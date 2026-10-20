#!/usr/bin/env python3
"""レンとジル 自動投稿
- auto/schedule.json から「今日・このスロット」の回を取り出す
- 未レンダリングなら rig でレンダリング（dist/<ep>_yt.mp4 と dist/<ep>_loop.mp4）
- Instagram / TikTok / YouTube / Facebook（リール）に投稿し、auto/posted.json に記録する
- `python auto/post.py --dry-run [--date YYYY-MM-DD] [スロット]`（または DRY_RUN=1）で、API を呼ばずに送る内容だけ表示する

必要な環境変数（GitHub Secrets）:
  IG_USER_ID, IG_ACCESS_TOKEN                  … Instagram（Meta Graph API）
  TT_ACCESS_TOKEN                               … TikTok（Content Posting API, video.publish）
  YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN … YouTube Data API v3
  MEDIA_TOKEN                                   … Instagramが取りに来る公開URL（renjill-media）への書き込み
  FB_PAGE_TOKEN, FB_PAGE_ID                     … Facebook ページ「レンとジル」（auto/facebook.py）
失敗したSNSはスキップして他を続け、終了コードで知らせる。
Facebook は権限・設定がなければ飛ばすだけ（失敗にしない）。理由は dist/post_hub_args 経由で Automation Hub の「やること」に出る。
"""
import datetime as dt, json, os, subprocess, sys, time, pathlib
import requests
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import facebook as fb

ROOT = pathlib.Path(__file__).resolve().parent.parent
RIG, DIST, AUTO = ROOT / "rig", ROOT / "dist", ROOT / "auto"
JST = dt.timezone(dt.timedelta(hours=9))
DIST.mkdir(exist_ok=True)

def log(*a): print("[post]", *a, flush=True)

# ---------- 対象の決定 ----------
def pick_posts(slot_override=None, now=None):
    sch = json.loads((AUTO / "schedule.json").read_text())
    posted = json.loads((AUTO / "posted.json").read_text()) if (AUTO / "posted.json").exists() else {}
    now = now or dt.datetime.now(JST)
    today = now.strftime("%Y-%m-%d")
    out = []
    for p in sch["posts"]:
        if p["date"] != today: continue
        slot_h = int(p["slot"].split(":")[0])
        if slot_override is None and abs(now.hour - slot_h) > 1: continue
        key = f'{p["date"]}_{p["ep"]}'
        done = posted.get(key, {})
        plats = [x for x in p.get("platforms", sch["defaults"]["platforms"]) if x not in done]
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
    return base + ("\n\n" + tags(p, d) if with_tags else "")

def thumbnail(p):
    """サムネ生成（rig/thumb.js）。dist/<ep>_thumb.jpg"""
    out = DIST / f'{p["ep"]}_thumb.jpg'
    # 毎回作り直す（古いサムネを使い回して見切れ版が出る事故を防ぐ）。はみ出しがあれば thumb.js が終了コード3で止まり、投稿もしない
    th = p.get("thumb") or {"t": 1.0, "cam": "1.6,560,1050", "hook": p["title"]}
    env = dict(os.environ, NODE_PATH=subprocess.check_output(["npm", "root", "-g"]).decode().strip())
    subprocess.run(["node", str(RIG / "thumb.js"), p["ep"], str(th["t"]), th["cam"], th["hook"], f'EP.{p["no"]}', str(out), "A"], check=True, env=env)
    return out

# ---------- YouTube ----------
def post_youtube(p, d, path):
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    creds = Credentials(None, refresh_token=os.environ["YT_REFRESH_TOKEN"], token_uri="https://oauth2.googleapis.com/token",
                        client_id=os.environ["YT_CLIENT_ID"], client_secret=os.environ["YT_CLIENT_SECRET"])
    yt = build("youtube", "v3", credentials=creds)
    body = {"snippet": {"title": f'{p["caption_en"]} | Ren & Jill「{p["title"]}」',
                        "description": f'{d["yt_description"]}\n\n{tags(p, d)}', "categoryId": "23"},
            "status": {"privacyStatus": "public", "selfDeclaredMadeForKids": False}}
    req = yt.videos().insert(part="snippet,status", body=body, media_body=MediaFileUpload(str(path), chunksize=-1, resumable=True))
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

def post_instagram(p, d, video_path, th_path):
    """リール投稿。動画とカバーを公開リポジトリに置き、その URL で投稿する（cover_url でサムネの文字を確実に出す）"""
    uid, tok = os.environ["IG_USER_ID"], os.environ["IG_ACCESS_TOKEN"]
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
    a = {"dry_run": os.environ.get("DRY_RUN", "") not in ("", "0", "false"), "date": None, "slot": None}
    it = iter(argv)
    for x in it:
        if x == "--dry-run": a["dry_run"] = True
        elif x == "--date": a["date"] = next(it)
        elif x: a["slot"] = x
    return a

def dry_run(targets, d):
    """API を呼ばず、描画もせず、posted.json も書かない"""
    for key, p, plats in targets:
        log(f"[DRY-RUN] {key}（{p['slot']}）→ {', '.join(plats)}")
        for pl in plats:
            if pl == "facebook":
                for line in fb.dry_run_plan(p, d, DIST / f'{p["ep"]}_loop.mp4'): print("    facebook:", line.replace("\n", "\n      "))
            elif pl == "ig": print("    ig: REELS caption:\n      " + caption(p, d).replace("\n", "\n      "))
            elif pl == "yt": print(f'    yt: title: {p["caption_en"]} | Ren & Jill「{p["title"]}」')
            elif pl == "tt": print("    tt: FILE_UPLOAD", f'{p["ep"]}_loop.mp4')
    log("[DRY-RUN] API は呼んでいません")
    return 0

def write_hub_args(fb_result):
    """Automation Hub の report に渡す追加の引数（NUL 区切り。post.yml が読む）"""
    if not fb_result: return
    args = ["--kpi", f"Facebook={fb_result['kpi']}"]
    if fb_result.get("action"): args += ["--owner-action", fb_result["action"][:300]]
    (DIST / "post_hub_args").write_bytes(b"\0".join(s.encode() for s in args) + b"\0")

def main(argv=None):
    a = parse_args(sys.argv[1:] if argv is None else argv)
    now = None
    if a["date"]:
        h = int((a["slot"] or "12:00").split(":")[0])
        now = dt.datetime.fromisoformat(a["date"]).replace(hour=h, tzinfo=JST)
    sch, posted, targets = pick_posts(a["slot"], now)
    d = sch["defaults"]
    if not targets: log("今日のこの時間帯に投稿なし"); return 0
    if a["dry_run"]: return dry_run(targets, d)
    failed = []
    fb_access, fb_result = None, None
    for key, p, plats in targets:
        yt_path, loop_path = render(p["ep"])
        if not qa_gate(p["ep"], yt_path, loop_path):
            failed.append(f"{key}:QA"); continue
        rec = posted.setdefault(key, {"tag_set": p.get("tag_set", "A"), "no": p["no"], "title": p["title"]})
        for pl in plats:
            try:
                if pl == "yt": rec["yt"] = post_youtube(p, d, yt_path)
                elif pl == "tt": rec["tt"] = post_tiktok(p, d, loop_path)
                elif pl == "ig":
                    rec["ig"] = post_instagram(p, d, loop_path, thumbnail(p))
                elif pl == "facebook":
                    fb_access = fb_access or fb.diagnose()
                    rec["facebook"] = fb.post(p, d, loop_path, access=fb_access, log=log)
                    fb_result = {"kpi": "投稿OK"}
                else:
                    log("未対応のSNS", pl); continue
                rec[pl + "_at"] = dt.datetime.now(JST).isoformat(timespec="minutes")
                log("OK", key, pl, rec[pl])
            except fb.FbSkip as e:
                why = fb.scrub(e)
                log("SKIP", key, pl, why)
                fb_result = {"kpi": "権限・設定なしで見送り",
                             "action": f"Facebook リールを投稿できず見送り（{why}）。renjill-auto の docs/setup/facebook-reels.md の手順で権限を付けたページトークンを発行し、Settings → Secrets → Actions の FB_PAGE_TOKEN を差し替える"}
            except Exception as e:
                log("NG", key, pl, fb.scrub(repr(e))[:500]); failed.append(f"{key}:{pl}")
                if pl == "facebook": fb_result = {"kpi": "投稿失敗"}
        (AUTO / "posted.json").write_text(json.dumps(posted, ensure_ascii=False, indent=2))
    write_hub_args(fb_result)
    if failed: log("失敗:", failed); return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
