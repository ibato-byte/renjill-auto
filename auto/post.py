#!/usr/bin/env python3
"""レンとジル 自動投稿
- auto/schedule.json から「今日・このスロット」の回を取り出す
- 未レンダリングなら rig でレンダリング（dist/<ep>_yt.mp4 と dist/<ep>_loop.mp4）
- Instagram / TikTok / YouTube / Facebook（リール）に投稿し、auto/posted.json に記録する
- `python auto/post.py --dry-run [--ignore-posted] [--date YYYY-MM-DD] [スロット]`（または DRY_RUN=1）で、API を呼ばずに送る内容だけ表示する

必要な環境変数（GitHub Secrets）:
  IG_ACCESS_TOKEN                               … Meta のシステムユーザーのトークン（期限なし）。Instagram と Facebook の両方に使う
  IG_USER_ID                                    … 任意。Instagram の ID はページ 1358515160686321 の instagram_business_account から毎回取る（取れないときだけ使う）
  TT_ACCESS_TOKEN                               … TikTok（Content Posting API, video.publish）
  YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN … YouTube Data API v3
  MEDIA_TOKEN                                   … Instagramが取りに来る公開URL（renjill-media）への書き込み
Facebook ページ「レンとジル Ren & Jill」（ID 1358515160686321）のページトークンは IG_ACCESS_TOKEN から取る（auto/facebook.py）。
Instagram・Facebook のサムネは dist/<ep>_thumb.jpg（Instagram は公開URLを cover_url に、Facebook は /thumbnails に送る）。
失敗したSNSはスキップして他を続け、終了コードで知らせる。
Facebook は権限・設定がなければ飛ばすだけ（失敗にしない）。理由は dist/post_hub_args 経由で Automation Hub の「やること」に出る。
"""
import datetime as dt, json, os, subprocess, sys, time, pathlib
import requests
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import facebook as fb
import alerts
import mode
import stories
import growth
import threads
import textcheck

ROOT = pathlib.Path(__file__).resolve().parent.parent
RIG, DIST, AUTO = ROOT / "rig", ROOT / "dist", ROOT / "auto"
JST = dt.timezone(dt.timedelta(hours=9))
DIST.mkdir(exist_ok=True)

def log(*a): print("[post]", *a, flush=True)

# ---------- 対象の決定 ----------
def in_window(p, now):
    """予定時刻の10分前〜2時間後だけ出す。cron の遅れ（20分前後）は許すが、1時間前の回で先に出さない（依頼 #90）"""
    h, m = map(int, p["slot"].split(":"))
    d = (now - now.replace(hour=h, minute=m, second=0, microsecond=0)).total_seconds() / 60
    return -10 <= d <= 120

def pick_posts(slot_override=None, now=None, ignore_posted=False):
    sch = json.loads((AUTO / "schedule.json").read_text())
    posted = json.loads((AUTO / "posted.json").read_text()) if (AUTO / "posted.json").exists() else {}
    now = now or dt.datetime.now(JST)
    today = now.strftime("%Y-%m-%d")
    out = []
    for p in sch["posts"]:
        if p["date"] != today: continue
        if slot_override is None and not in_window(p, now): continue
        key = f'{p["date"]}_{p["ep"]}'
        done = {} if ignore_posted else posted.get(key, {})
        # posted.json に記録がある SNS（投稿ID・"manual"・"bs-scheduled"＝Business Suite で予約済み）は出さない（二重投稿を防ぐ）。
        # 手動予約モードの SNS（auto/mode.json。2026-10-21 に解除）も API で出さない
        plats = [x for x in p.get("platforms", sch["defaults"]["platforms"]) if x not in done and not mode.is_manual(x)]
        # 本編に付くおまけ（ストーリーズ・再生リスト・カルーセル）。本編を API で出した（または今出す）SNS にだけ付く
        real = {x: v for x, v in done.items() if v not in ("manual", "bs-scheduled")}
        plats += stories.extras_for(p, sch["defaults"], real, set(plats))
        if plats: out.append((key, p, plats))
    return sch, posted, out

# ---------- レンダリング ----------
def render(ep):
    yt, loop = DIST / f"{ep}_yt.mp4", DIST / f"{ep}_loop.mp4"
    if yt.exists() and loop.exists(): return yt, loop
    log("render", ep)
    env = dict(os.environ, NODE_PATH=subprocess.check_output(["npm", "root", "-g"]).decode().strip())
    subprocess.run(["node", str(RIG / "render-ep.js"), ep], check=True, env=env)
    subprocess.run(["bash", str(RIG / "build.sh"), ep, str(yt)], check=True)
    dur = json.loads((RIG / "out" / ep / "meta.json").read_text())["dur"]
    # ループ版：エンドカード（最後の0.9秒）を落とす
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(yt), "-t", str(dur - 1.0), "-c", "copy", str(loop)], check=True)
    return yt, loop

def qa_gate(ep, yt, loop):
    """QAに通らなければ投稿しない（dist/<ep>_qa.json に理由を残す）"""
    r = subprocess.run([sys.executable, str(AUTO / "qa.py"), ep, str(yt), str(loop)], capture_output=True, text=True)
    rep = json.loads((DIST / f"{ep}_qa.json").read_text()) if (DIST / f"{ep}_qa.json").exists() else {"pass": False, "issues": [r.stderr[-300:]]}
    if not rep["pass"]: log("QA NG", ep, rep["issues"]); return False
    log("QA OK", ep, "warns:", rep.get("warns")); return True

def tags(p, d):
    return d["tag_sets"][p.get("tag_set", "A")]

def caption(p, d, with_tags=True):
    base = f'{p["caption_en"]}\n{p["caption_ja"]}'
    # 毎日の振り返り（daily_review.py）が割り当てた「最後の一言」の打ち手（英語/日本語）
    if p.get("cta"): base += "\n" + p["cta"].replace("/", "\n", 1)
    # 末尾に英語の一言を必ず入れる（海外の人がフォローしやすいように。依頼 #38）
    # 検索される言葉（日・英）と、末尾の英語の一言。ハッシュタグは3個まで（依頼 #37・#38）
    tg = " ".join(tags(p, d).split()[:threads.MAX_TAGS])
    return base + "\n\n" + threads.seo_line(d) + ("\n\n" + tg if with_tags else "") + "\n\n" + growth.tail_en(d)

def thumbnail(p):
    """サムネ生成（rig/thumb.js）。dist/<ep>_thumb.jpg"""
    out = DIST / f'{p["ep"]}_thumb.jpg'
    # 毎回作り直す（古いサムネを使い回して見切れ版が出る事故を防ぐ）。はみ出しがあれば thumb.js が終了コード3で止まり、投稿もしない
    th = p.get("thumb") or {"t": 1.0, "cam": "1.6,560,1050", "hook": p["title"]}
    env = dict(os.environ, NODE_PATH=subprocess.check_output(["npm", "root", "-g"]).decode().strip())
    def gen(v): return subprocess.run(["node", str(RIG / "thumb.js"), p["ep"], str(th["t"]), th["cam"], th["hook"], f'EP.{p["no"]}', str(out), v], env=env).returncode
    v = th.get("variant", "A")
    rc = gen(v)
    # 毎日の振り返りが試すサムネの型（B・C）が検査に通らないときは、標準の型（A）で作る（打ち手のせいで投稿が止まらないように）
    if rc != 0 and v != "A":
        log(f"thumbnail variant {v} NG → A")
        rc = gen("A")
    if rc != 0: raise subprocess.CalledProcessError(rc, "thumb.js")
    return out

# ---------- YouTube ----------
def post_youtube(p, d, path):
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    creds = Credentials(None, refresh_token=os.environ["YT_REFRESH_TOKEN"], token_uri="https://oauth2.googleapis.com/token",
                        client_id=os.environ["YT_CLIENT_ID"], client_secret=os.environ["YT_CLIENT_SECRET"])
    yt = build("youtube", "v3", credentials=creds)
    en_title, en_desc = f'{p["caption_en"]} | Ren & Jill「{p["title"]}」', f'{d["yt_description"]}\n\n{tags(p, d)}'
    body = {"snippet": {"title": en_title, "description": en_desc, "categoryId": "23", "defaultLanguage": "en"},
            "localizations": growth.youtube_localizations(p, d, en_title, en_desc),  # 英・日・韓・繁体中・西・葡のタイトルと説明（依頼 #38）
            "status": {"privacyStatus": "public", "selfDeclaredMadeForKids": False}}
    req = yt.videos().insert(part="snippet,status,localizations", body=body, media_body=MediaFileUpload(str(path), chunksize=-1, resumable=True))
    res = req.execute()
    try: yt.thumbnails().set(videoId=res["id"], media_body=MediaFileUpload(str(thumbnail(p)))).execute()
    except Exception as e: log("thumbnail NG", repr(e)[:200])
    return res["id"]

# ---------- TikTok ----------
def post_tiktok(p, d, path):
    tok = os.environ["TT_ACCESS_TOKEN"]; H = {"Authorization": f"Bearer {tok}", "Content-Type": "application/json; charset=UTF-8"}
    size = path.stat().st_size
    init = requests.post("https://open.tiktokapis.com/v2/post/publish/video/init/", headers=H, json={
        "post_info": {"title": caption(p, d), "privacy_level": "PUBLIC_TO_EVERYONE", "disable_duet": False, "disable_comment": False, "disable_stitch": False, "video_cover_timestamp_ms": int(float((p.get("thumb") or {}).get("t", 1.0)) * 1000)},
        "source_info": {"source": "FILE_UPLOAD", "video_size": size, "chunk_size": size, "total_chunk_count": 1}}).json()
    if init.get("error", {}).get("code") != "ok": raise RuntimeError(init)
    up = init["data"]["upload_url"]
    r = requests.put(up, data=path.read_bytes(), headers={"Content-Type": "video/mp4", "Content-Range": f"bytes 0-{size-1}/{size}"})
    r.raise_for_status()
    return init["data"]["publish_id"]

# ---------- Instagram ----------
MEDIA_REPO = os.environ.get("MEDIA_REPO", "ibato-byte/renjill-media")  # 公開済み動画とカバーだけを置く公開リポジトリ（Shota承認 2026-10-20）

def media_publish(local_path, name):
    """公開リポジトリ renjill-media に置いて、Instagram が取りに来られる公開URLを返す。
    必要なもの: Secrets の MEDIA_TOKEN（renjill-media の contents 読み書きだけを許可した fine-grained PAT）"""
    tok = os.environ["MEDIA_TOKEN"]
    import base64
    api = f"https://api.github.com/repos/{MEDIA_REPO}/contents/{name}"
    H = {"Authorization": f"Bearer {tok}", "Accept": "application/vnd.github+json"}
    body = {"message": f"media: {name}", "content": base64.b64encode(pathlib.Path(local_path).read_bytes()).decode()}
    cur = requests.get(api, headers=H)
    if cur.status_code == 200: body["sha"] = cur.json()["sha"]
    r = requests.put(api, headers=H, json=body)
    if r.status_code not in (200, 201): raise RuntimeError(f"media upload {r.status_code}: {r.text[:300]}")
    url = f"https://raw.githubusercontent.com/{MEDIA_REPO}/main/{name}"
    for _ in range(20):  # CDNに乗るまで待つ
        if requests.head(url, allow_redirects=True).status_code == 200: return url
        time.sleep(6)
    raise RuntimeError(f"public url not ready: {url}")

def post_instagram(p, d, video_path, th_path, uid=None):
    """リール投稿。動画とカバーを公開リポジトリに置き、その URL で投稿する（cover_url でサムネの文字を確実に出す）。
    uid：ページから取った Instagram の ID（なければ Secrets の IG_USER_ID）"""
    uid, tok = uid or os.environ.get("IG_USER_ID", ""), os.environ["IG_ACCESS_TOKEN"]
    if not uid: raise RuntimeError("Instagram の ID が分からない（ページ 1358515160686321 に Instagram がつながっているか確認）")
    G = "https://graph.facebook.com/v21.0"
    stamp = dt.datetime.now(JST).strftime("%Y%m%d")
    try:
        cover = media_publish(th_path, f"{stamp}_{p['ep']}_cover.jpg")
        video = media_publish(video_path, f"{stamp}_{p['ep']}.mp4")
    except Exception as e:
        raise RuntimeError(f"公開URLを用意できないので投稿しない（文字なしサムネを避けるため）: {e!r}"[:400])
    data = {"media_type": "REELS", "video_url": video, "cover_url": cover, "caption": caption(p, d), "share_to_feed": "true", "access_token": tok}
    c = requests.post(f"{G}/{uid}/media", data=data).json()
    if "id" not in c: raise RuntimeError(c)
    cid = c["id"]
    for _ in range(40):  # 処理待ち（最大 ~10分）
        s = requests.get(f"{G}/{cid}", params={"fields": "status_code,status", "access_token": tok}).json()
        if s.get("status_code") == "FINISHED": break
        if s.get("status_code") == "ERROR": raise RuntimeError(s)
        time.sleep(15)
    r = requests.post(f"{G}/{uid}/media_publish", data={"creation_id": cid, "access_token": tok}).json()
    if "id" not in r: raise RuntimeError(r)
    return r["id"]

def parse_args(argv):
    a = {"dry_run": os.environ.get("DRY_RUN", "") not in ("", "0", "false"), "date": None, "slot": None, "ignore_posted": False}
    it = iter(argv)
    for x in it:
        if x == "--dry-run": a["dry_run"] = True
        elif x == "--date": a["date"] = next(it)
        elif x == "--ignore-posted": a["ignore_posted"] = True  # ドライランだけ：posted.json の記録があっても送る内容を表示する
        elif x: a["slot"] = x
    return a

def dry_run(targets, d, posted=None):
    """API を呼ばず、描画もせず、posted.json も書かない"""
    for key, p, plats in targets:
        log(f"[DRY-RUN] {key}（{p['slot']}）→ {', '.join(plats)}")
        done = {x: v for x, v in (posted or {}).get(key, {}).items() if x in plats}
        if done: log("  ※ posted.json に記録あり（本番では出さない）：" + ", ".join(f"{x}={v}" for x, v in done.items()))
        for pl in plats:
            if pl == "facebook":
                for line in fb.dry_run_plan(p, d, DIST / f'{p["ep"]}_loop.mp4'): print("    facebook:", line.replace("\n", "\n      "))
            elif pl == "ig":
                print(f"    ig: POST {fb.G}/<ページ {fb.PAGE_ID} の instagram_business_account>/media  media_type=REELS share_to_feed=true")
                print(f'    ig: video_url=<renjill-media に置いた {p["ep"]}_loop.mp4> cover_url=<renjill-media に置いた {p["ep"]}_thumb.jpg>')
                print("    ig: caption:\n      " + caption(p, d).replace("\n", "\n      "))
            elif pl == "threads": print("    threads: VIDEO（Instagram と同じ公開 URL）" + ("" if threads.threads_ready() else "  ※権限・Secrets 未設定のため本番では見送り"))
            elif pl == "yt": print(f'    yt: title: {p["caption_en"]} | Ren & Jill「{p["title"]}」')
            elif pl == "tt": print("    tt: FILE_UPLOAD", f'{p["ep"]}_loop.mp4')
            elif pl in stories.EXTRAS: print(f"    {pl}: {stories.NAMES[pl]}（本編のあとに出す。失敗しても本編は止めない）")
    log("[DRY-RUN] API は呼んでいません")
    return 0

META = ("ig", "facebook")
NOT_ID = ("manual", "bs-scheduled")  # 手で予約・Business Suite で予約した回（投稿IDではない）

def next_api_post(sch, posted, now, detail=False):
    """次に Instagram・Facebook へ API で出す回の「月/日 時刻」。なければ None。
    detail=True なら (「月/日 時刻」, タイトル, 投稿予定の時刻 UTC の ISO 8601) を返す"""
    for p in sorted(sch["posts"], key=lambda p: (p["date"], p["slot"])):
        h, m = map(int, p["slot"].split(":"))
        at = dt.datetime.fromisoformat(p["date"]).replace(hour=h, minute=m, tzinfo=JST)
        if at <= now: continue
        done = posted.get(f'{p["date"]}_{p["ep"]}', {})
        if any(x in p.get("platforms", sch["defaults"]["platforms"]) and x not in done and not mode.is_manual(x) for x in META):
            label = f'{p["date"][5:].replace("-", "/")} {p["slot"]}'
            return (label, p["title"], at.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:00Z")) if detail else label
    return None

HUB_DOES = "毎日 12:00・18:00・19:00 に、予定の動画を Instagram・Facebook などに自動で投稿する（レンとジル）"

def write_hub_args(fb_result, results=None, actions=None, next_api=None, keep_actions=False, summary=None, outcome=None, count=None, next_action=None):
    """Automation Hub の report に渡す追加の引数（NUL 区切り。post.yml が読む）。
    results：{"回": "タイトル（日付 時刻）", "Instagram": "投稿OK", …}（投稿ごとの結果。KPI は8件まで）
    actions：オーナーのやること（失敗した投稿の出し直しなど）。なければ「やること」を空にする（keep_actions なら前のまま）
    summary：その回に実際にやったことを1行で（dist/post_hub_summary に書く。Hub の「前回やったこと」になる）
    outcome：done（投稿した）／idle（やることがなかった）。count：投稿した回の数。next_action：(次の投稿の説明, 時刻 UTC)"""
    manual = sorted(mode.NAMES[x] for x in mode.manual_platforms())
    args = ["--does", HUB_DOES]
    if outcome: args += ["--outcome", outcome]
    if outcome == "done" and count: args += ["--count", str(count)]
    if next_action: args += ["--next-action", next_action[0]] + (["--next-action-at", next_action[1]] if next_action[1] else [])
    elif next_api is None and outcome: args += ["--next-action", "none"]
    if summary: (DIST / "post_hub_summary").write_text(summary)
    for k, v in list((results or {}).items())[:6]:
        args += ["--kpi", f"{k}={str(v).replace('=', '＝')}"]
    if fb_result and "Facebook" not in (results or {}): args += ["--kpi", f"Facebook={fb_result['kpi']}"]
    args += ["--kpi", "次の Instagram・Facebook 投稿=" + (next_api or "未登録（週次PDCA で登録）")]
    if manual: args += ["--kpi", "手動予約=" + "・".join(manual)]
    acts = list(actions or [])
    if fb_result and fb_result.get("action"): acts.append(fb_result["action"])
    for a in acts: args += ["--owner-action", a[:300]]
    if not acts and not keep_actions: args += ["--owner-action", "none"]
    (DIST / "post_hub_args").write_bytes(b"\0".join(s.encode() for s in args) + b"\0")

def next_hub_info(sch, posted, now):
    """Hub に渡す「次の投稿」：(「月/日 時刻」, next_action=(説明, 時刻UTC) か None)"""
    nx = next_api_post(sch, posted, now, detail=True)
    if not nx: return None, None
    return nx[0], (f"{nx[0]}『{nx[1]}』を投稿", nx[2])

def idle_summary(sch, now, nxt):
    """やることがなかった回の説明（なぜ何もしなかったか＋次の投稿）"""
    today = now.strftime("%Y-%m-%d")
    near = any(p["date"] == today and in_window(p, now) for p in sch["posts"])
    why = "予定の回は投稿済み（または手動で予約済み）のため何もしなかった" if near else "予定なし"
    nxt_s = f"次の投稿は {nxt[0]}『{nxt[1]}』" if nxt else "次の投稿の予定はまだ登録されていない"
    return f'{now.strftime("%H:%M")} は{why}。{nxt_s}'

def thumb_path_ok(th):
    return bool(th.get("path")) and pathlib.Path(th["path"]).exists()

def failure_action(p, pl, err):
    """投稿に失敗したときの「やること」（Hub に出す）"""
    name = mode.NAMES.get(pl, pl)
    redo = f'直したら Actions → post → Run workflow で date に {p["date"]}、slot に {p["slot"]} を入れて出し直す（投稿済みの SNS は飛ばす）'
    if alerts.is_token_error(repr(err)):
        return f'「{p["title"]}」の {name} がトークンのエラーで出せなかった。Hub の「トークンの期限チェック」の「やること」（メールにも同じ手順）でトークンを直す。{redo}'
    return f'「{p["title"]}」の {name} の投稿に失敗した（{type(err).__name__}）。{redo}。続けて失敗するなら、この実行のログを Claude に送って相談する'

def post_extra(pl, key, p, d, rec, loop_path, fb_access, results, posted):
    """ストーリーズ・再生リスト・カルーセル。失敗しても本編は止めない（失敗にも数えない）。出せたら rec[pl] に ID を残す（二重投稿を防ぐ）"""
    label = {"ig_story": "ストーリーズ", "fb_story": "FBストーリーズ", "yt_playlist": "再生リスト", "ig_carousel": "カルーセル", "bsky": "Bluesky"}[pl]
    base = stories.EXTRAS[pl]
    try:
        if not rec.get(base) or rec[base] in NOT_ID: raise stories.StorySkip("本編が出ていないので見送り")
        if pl in ("ig_story", "fb_story", "ig_carousel") and fb_access is None:
            raise stories.StorySkip("Meta の確認ができず見送り")
        if pl == "ig_story":
            if not fb_access.get("ig_user_id"): raise stories.StorySkip("Instagram の ID が分からず見送り")
            sv = stories.build_story_video(p, loop_path, DIST / f'{p["ep"]}_story.mp4')
            url = media_publish(sv, f"{dt.datetime.now(JST).strftime('%Y%m%d')}_{p['ep']}_story.mp4")
            rec[pl] = stories.post_ig_story(fb_access["ig_user_id"], os.environ["IG_ACCESS_TOKEN"], url)
        elif pl == "fb_story":
            if not fb_access.get("ok"): raise stories.StorySkip("Facebook の権限・設定なしで見送り")
            sv = DIST / f'{p["ep"]}_story.mp4'
            if not sv.exists(): stories.build_story_video(p, loop_path, sv)
            rec[pl] = stories.post_fb_story(fb_access["page_id"], fb_access["token"], sv)
        elif pl == "ig_carousel":
            month = dt.datetime.now(JST).strftime("%Y-%m")
            if stories.carousel_left(posted, month) <= 0: raise stories.StorySkip(f"今月のカルーセルは {stories.CAROUSEL_PER_MONTH} 本に達したので見送り")
            if not fb_access.get("ig_user_id"): raise stories.StorySkip("Instagram の ID が分からず見送り")
            urls = [media_publish(ROOT / im, f"{month.replace('-', '')}_{p['ep']}_c{i}{pathlib.Path(im).suffix}") for i, im in enumerate(p["carousel"]["images"], 1)]
            rec[pl] = stories.post_ig_carousel(fb_access["ig_user_id"], os.environ["IG_ACCESS_TOKEN"], urls, p["carousel"].get("caption") or caption(p, d))
        elif pl == "bsky":
            import bsky
            try: rec[pl] = bsky.post_link_card(p, d, rec["yt"], DIST / f'{p["ep"]}_thumb.jpg')
            except LookupError as e: raise stories.StorySkip(str(e))
        elif pl == "yt_playlist":
            from google.oauth2.credentials import Credentials
            from googleapiclient.discovery import build
            creds = Credentials(None, refresh_token=os.environ["YT_REFRESH_TOKEN"], token_uri="https://oauth2.googleapis.com/token",
                                client_id=os.environ["YT_CLIENT_ID"], client_secret=os.environ["YT_CLIENT_SECRET"])
            rec[pl] = stories.add_to_playlist(build("youtube", "v3", credentials=creds), rec["yt"], p["series"])
        rec[pl + "_at"] = dt.datetime.now(JST).isoformat(timespec="minutes")
        results[label] = "投稿OK"
        log("OK", key, pl, rec[pl])
    except stories.StorySkip as e:
        log("SKIP", key, pl, fb.scrub(e)); results[label] = f"見送り（{str(fb.scrub(e))[:40]}）"
    except Exception as e:
        log("NG(続行)", key, pl, fb.scrub(repr(e))[:500]); results[label] = "失敗（本編は投稿済み）"


def main(argv=None):
    a = parse_args(sys.argv[1:] if argv is None else argv)
    now = None
    if a["date"]:
        h = int((a["slot"] or "12:00").split(":")[0])
        now = dt.datetime.fromisoformat(a["date"]).replace(hour=h, tzinfo=JST)
    if a["ignore_posted"] and not a["dry_run"]: log("--ignore-posted はドライランでだけ使える"); return 2
    sch, posted, targets = pick_posts(a["slot"], now, a["ignore_posted"])
    d = sch["defaults"]
    now_ = now or dt.datetime.now(JST)
    if not targets:
        log("今日のこの時間帯に投稿なし")
        nx = next_api_post(sch, posted, now_, detail=True)
        write_hub_args(None, next_api=nx[0] if nx else None, keep_actions=True,  # 前の失敗の「やること」は消さない
                       summary=idle_summary(sch, now_, nx), outcome="idle", next_action=(f"{nx[0]}『{nx[1]}』を投稿", nx[2]) if nx else None)
        return 0
    if a["dry_run"]: return dry_run(targets, d, posted)
    failed = []
    fb_access, fb_result, results, actions = None, None, {}, []
    did = {}  # タイトル → 投稿できた SNS の名前
    for key, p, plats in targets:
        results["回"] = f'{p["title"]}（{p["date"][5:]} {p["slot"]}）' if "回" not in results else results["回"] + f'・{p["title"]}'
        tx = textcheck.check(p)  # 文字の時刻が動画の時計と違う回は、どの SNS にも出さない（Hub 依頼 #113）
        if tx:
            failed.append(f"{key}:文字"); results["QA"] = "文字と動画の食い違いで見送り"
            actions.append(f'「{p["title"]}」（{p["date"]} {p["slot"]}）の文字が動画の絵と食い違うため、どの SNS にも出していない：{" / ".join(tx)}。Claude に「{p["ep"]} の文字を直して出し直して」と伝える')
            continue
        yt_path, loop_path = render(p["ep"])
        story_src = loop_path  # ストーリーズの見どころは元のループ版から切り出す
        if not qa_gate(p["ep"], yt_path, loop_path):
            failed.append(f"{key}:QA"); results["QA"] = "不合格で見送り"
            actions.append(f'「{p["title"]}」（{p["date"]} {p["slot"]}）が投稿前の QA に不合格で、どの SNS にも出していない（理由は dist/{p["ep"]}_qa.json）。Claude に「{p["ep"]} の QA を直して出し直して」と伝える')
            continue
        try:  # 最後に「フォローして続きを見てね」を入れた版（作れなければ元のまま）。ループの継ぎ目は壊さない
            loop_path = growth.add_follow_line(loop_path, DIST / f'{p["ep"]}_loopf.mp4') or loop_path
        except Exception as e: log("フォロー案内の追加に失敗（元の動画で続ける）", repr(e)[:200])
        rec = posted.setdefault(key, {"tag_set": p.get("tag_set", "A"), "no": p["no"], "title": p["title"]})
        th = {}
        def thumb():  # Instagram・Facebook で同じサムネ（チェックに通らなければ両方とも出さない）
            if "path" not in th: th["path"] = thumbnail(p)
            return th["path"]
        for pl in [x for x in plats if x not in stories.EXTRAS] + [x for x in plats if x in stories.EXTRAS]:  # おまけは本編のあと
            if pl in stories.EXTRAS:
                if pl in ("ig_story", "fb_story", "ig_carousel") and fb_access is None:
                    try: fb_access = fb.diagnose()
                    except Exception as e: log("Meta の確認に失敗", fb.scrub(repr(e))[:200])
                post_extra(pl, key, p, d, rec, story_src, fb_access, results, posted)
                continue
            try:
                if pl in ("ig", "facebook") and fb_access is None:
                    fb_access = fb.diagnose()  # ページトークンと Instagram の ID（読み取りのみ）
                    for r in fb_access["reasons"]: log("Meta:", fb.scrub(r))
                if pl == "yt": rec["yt"] = post_youtube(p, d, yt_path)
                elif pl == "tt": rec["tt"] = post_tiktok(p, d, loop_path)
                elif pl == "threads":
                    if not threads.threads_ready(): raise threads.GrowthSkip("Threads の権限・Secrets が未設定で見送り")  # 動画を置く前に確かめる
                    rec["threads"] = threads.post_threads(p, d, media_publish(loop_path, f"{dt.datetime.now(JST).strftime('%Y%m%d')}_{p['ep']}.mp4"))
                elif pl == "ig":
                    rec["ig"] = post_instagram(p, d, loop_path, thumb(), uid=fb_access.get("ig_user_id"))
                elif pl == "facebook":
                    info = {}
                    rec["facebook"] = fb.post(p, d, loop_path, access=fb_access, log=log, thumb_path=thumb(), info=info)
                    if rec["facebook"] and thumb_path_ok(th):  # 投稿直後に Graph API でカバーを確かめ、付いていなければ付け直す
                        info["thumb"] = fb.ensure_thumbnail(rec["facebook"], fb_access["token"], th["path"])
                    fb_result = {"kpi": f'投稿OK（サムネ{info.get("thumb", "なし")}）'}
                    if info.get("thumb") == "NG":
                        fb_result["action"] = f"Facebook リール「{p['title']}」のカバーを自動で3回付け直しても付かなかった（動画は公開済み）。Claude に「{p['ep']} の Facebook のカバーを付けて」と伝える"
                    results["Facebook"] = fb_result["kpi"]
                else:
                    log("未対応のSNS", pl); continue
                rec[pl + "_at"] = dt.datetime.now(JST).isoformat(timespec="minutes")
                if pl != "facebook": results[mode.NAMES[pl]] = "投稿OK"
                did.setdefault(p["title"], []).append(mode.NAMES.get(pl, pl))
                log("OK", key, pl, rec[pl])
            except threads.GrowthSkip as e:  # 今回は出さないだけ（失敗にしない。posted.json にも書かない）
                log("SKIP", key, pl, fb.scrub(e)); results[mode.NAMES.get(pl, pl)] = f"見送り（{str(fb.scrub(e))[:40]}）"
            except fb.FbSkip as e:
                why = fb.scrub(e)
                log("SKIP", key, pl, why)
                alerts.add("use:FB_PAGE_TOKEN", f"自動投稿：「{p['title']}」の Facebook リールをトークン・権限の問題で出せなかった（{why[:80]}）", alerts.FIX["FB_PAGE_TOKEN"])
                fb_result = {"kpi": "権限・設定なしで見送り",
                             "action": f"Facebook リールを投稿できず見送り（{why}）。renjill-auto の docs/setup/facebook-reels.md の手順で、システムユーザーのトークン（権限・ページの割り当て）を確かめ、Settings → Secrets → Actions の IG_ACCESS_TOKEN を差し替える"}
                results["Facebook"] = fb_result["kpi"]
            except Exception as e:
                log("NG", key, pl, fb.scrub(repr(e))[:500]); failed.append(f"{key}:{pl}")
                if alerts.is_token_error(repr(e)) and pl in alerts.PLATFORM_SECRET:
                    sec = alerts.PLATFORM_SECRET[pl]
                    alerts.add(f"use:{sec}", f"自動投稿：「{p['title']}」の {alerts.PLATFORM_NAME[pl]} がトークンのエラーで失敗（他のSNSは続けた。直したら出し直せる）", alerts.FIX[sec])
                if pl == "facebook": fb_result = {"kpi": "投稿失敗"}
                results[mode.NAMES.get(pl, pl)] = "投稿失敗"
                actions.append(failure_action(p, pl, e))
        (AUTO / "posted.json").write_text(json.dumps(posted, ensure_ascii=False, indent=2))
    nxt, nxa = next_hub_info(sch, posted, now_)
    if did: summary = "・".join(f'『{t}』' for t in did) + " を " + "・".join(dict.fromkeys(x for v in did.values() for x in v)) + " に投稿"
    else: summary = f'{now_.strftime("%H:%M")} は投稿できなかった（見送りまたは失敗。理由は結果の欄）'
    if nxt: summary += f"。次の投稿は {nxt}"
    write_hub_args(fb_result, results, actions, nxt, summary=summary, outcome="done" if did else "idle", count=len(did), next_action=nxa)
    if failed: log("失敗:", failed); return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
