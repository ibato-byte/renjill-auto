"""本編の「おまけ」の自動投稿（依頼 #35）。post.py から呼ぶ。どれも失敗しても本編の投稿は止めない。
- ig_story ：Instagram ストーリーズ（media_type=STORIES）。見どころ数秒＋「続きはリールで」の画像（縦9:16）を1本の動画にして出す
- fb_story ：Facebook ページのストーリーズ（video_stories）。同じ動画
- yt_playlist：YouTube のシリーズ別の再生リストに追加（schedule.json の回に "series" があるとき）
- ig_carousel：Instagram カルーセル（月2本まで。schedule.json の回の platforms に "ig_carousel" と "carousel": {"images": [...]} があるとき）
二重投稿は posted.json の記録（post.py が見る）で防ぐ。Instagram は 24 時間の API 投稿の上限（content_publishing_limit）を出す前に確かめる。
"""
import pathlib, subprocess, tempfile, time
import requests
import facebook as fb

G = "https://graph.facebook.com/v21.0"
# 本編に付く「おまけ」の種類 → 先に出ているべき本編の SNS
EXTRAS = {"ig_story": "ig", "fb_story": "facebook", "yt_playlist": "yt", "ig_carousel": "ig", "bsky": "yt"}
NAMES = {"ig_story": "Instagram ストーリーズ", "fb_story": "Facebook ストーリーズ", "yt_playlist": "YouTube 再生リスト", "ig_carousel": "Instagram カルーセル", "bsky": "Bluesky"}
IG_QUOTA_MARGIN = 5          # 24 時間の上限まで、これだけ余裕がなければ出さない（リール・ストーリーズを優先）
CAROUSEL_PER_MONTH = 2
END_CARD_SEC = 2.5  # 最後の一言は2秒以上（依頼 #51）
DEFAULT_POLL = "どっち派？コメントで"


class StorySkip(Exception):
    """今回は出さないだけ（失敗ではない）"""


def extras_for(p, defaults, done, planned):
    """この回に付けるおまけの一覧。planned：本編で出す予定の SNS。done：posted.json の記録。
    本編が出る（または出ている）SNS にだけ付ける。p["story"] が False ならストーリーズなし"""
    base_ok = set(planned) | {x for x in done if x in ("ig", "facebook", "yt")}
    want = p.get("platforms", defaults["platforms"])
    out = []
    for ex, base in EXTRAS.items():
        if ex in done or base not in base_ok: continue
        if ex in ("ig_story", "fb_story") and (p.get("story") is False or base not in want): continue
        if ex == "bsky" and ("yt" not in want or p.get("bsky") is False): continue
        if ex == "yt_playlist" and not (p.get("series") and "yt" in want): continue
        if ex == "ig_carousel" and not ("ig_carousel" in want and (p.get("carousel") or {}).get("images")): continue
        out.append(ex)
    return out


# ---------- ストーリーズ用の動画 ----------
def _font():
    """日本語が出るフォント（Noto Sans CJK JP を優先。なければ日本語対応の別のフォント）。なければ None"""
    try:
        fam, path = subprocess.check_output(["fc-match", "-f", "%{family}|%{file}", "Noto Sans CJK JP:bold"]).decode().split("|", 1)
        if "CJK" in fam and pathlib.Path(path).exists(): return path
        for line in subprocess.check_output(["fc-list", ":lang=ja", "-f", "%{file}\n"]).decode().splitlines():
            if line and "nifont" not in line and pathlib.Path(line.split(":")[0]).exists(): return line.split(":")[0]
    except Exception:
        pass
    return None


def _has_audio(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", str(path)], capture_output=True, text=True)
    return bool(r.stdout.strip())


def _duration(path):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)]).decode().strip())


def highlight_window(p, total):
    """見どころの区間 (開始, 長さ)。既定は冒頭から全体の約4割（3〜6秒）＝オチの手前まで。p["story"] = {"start":秒,"dur":秒} で上書き"""
    s = p.get("story") if isinstance(p.get("story"), dict) else {}
    start = float(s.get("start", 0.0))
    dur = float(s.get("dur", min(6.0, max(3.0, total * 0.4))))
    dur = min(dur, max(1.0, total * 0.6 - start))  # オチを見せてしまわない
    return start, round(dur, 2)


# ストーリーズのデザイン（依頼 #91）。3案を比べて B を採用（理由は knowledge/renjill-post.md）。
#   A 「ひとこと重ね」：見どころの動画に、ひとことのフックと下の誘導を重ねるだけ（1場面）
#   B 「つかみ→本編へ」：①見どころ＋フック＋「この続きは？」②同じ絵を暗い幕で覆い、「Watch the full episode」と矢印（2場面）← 採用
#   C 「クイズ」：見どころ＋問いかけの大きな札、最後に誘導
# どれも：紺・クリーム・金（レンとジルの色）、金の枠、画面の端から端まで（暗い幕・枠にすき間を作らない・依頼 #90）。
# 上 14%・下 20% は Instagram の表示で隠れるので、文字は置かない。
NAVY, CREAM, GOLD = "0x1F3A5F", "0xFFF7E8", "0xE8B84A"
STORY_VARIANTS = ("A", "B", "C")
DEFAULT_STORY_VARIANT = "B"
CTA_EN, CTA_JA = "Watch the full episode", "本編はこちら"
TEASE_JA = "この続きは…？"


def story_hook(p):
    """ひとことのフック（英語を主・日本語を従）。schedule.json の thumb.hook「英語/日本語」。なければ汎用"""
    h = ((p.get("thumb") or {}).get("hook") or "").strip()
    en, _, ja = h.partition("/")
    return (en.strip() or "WHAT HAPPENS NEXT?"), ja.strip()


def _text(tmp, name, text):
    (tmp / name).write_text(text, encoding="utf-8")
    return tmp / name


def _dt(font, tf, size, y, color, box=None, x="(w-text_w)/2", border=26, enable=None):
    s = f"drawtext=fontfile={font}:textfile={tf}:fontsize={size}:fontcolor={color}:x={x}:y={y}"
    if box: s += f":box=1:boxcolor={box}:boxborderw={border}"
    if enable: s += f":enable='{enable}'"
    return s


def story_filters(variant, font, tmp, hook_en, hook_ja, poll, tease_sec, card_sec):
    """(見どころの映像に足すフィルタ, 最後の幕の映像に足すフィルタ)。どちらも 1080x1920"""
    en, ja = _text(tmp, "en.txt", hook_en), _text(tmp, "ja.txt", hook_ja or " ")
    frame = f"drawbox=x=0:y=0:w=iw:h=ih:color={GOLD}:t=18"          # 金の枠（画面いっぱい）
    fs_en = 128 if len(hook_en) <= 12 else 100 if len(hook_en) <= 18 else 78
    tease = [frame, _dt(font, en, fs_en, 330, CREAM, NAVY), _dt(font, ja, 68, 330 + fs_en + 70, GOLD, NAVY, border=20)]
    pl = _text(tmp, "poll.txt", poll)
    psz = lambda base: max(36, min(base, int(900 / max(1, len(poll)))))  # 長い問いかけは小さくして、端からはみ出さない
    if variant == "A":
        tease += [_dt(font, _text(tmp, "c1.txt", f"▶ {CTA_EN}"), 66, 1420, CREAM, NAVY, border=24),
                  _dt(font, _text(tmp, "c2.txt", f"{CTA_JA}（最新のリール）"), 52, 1540, GOLD, NAVY, border=18)]
        card = [f"drawbox=x=0:y=0:w=iw:h=ih:color={NAVY}@0.78:t=fill", frame,
                _dt(font, _text(tmp, "a1.txt", "続きはリールで"), 120, 720, CREAM), _dt(font, pl, psz(68), 960, GOLD)]
    elif variant == "C":
        q = _text(tmp, "q.txt", poll)
        tease = [frame, _dt(font, en, fs_en, 330, CREAM, NAVY), _dt(font, q, psz(76), 1380, NAVY, CREAM, border=34)]
        card = [f"drawbox=x=0:y=0:w=iw:h=ih:color={NAVY}@0.78:t=fill", frame,
                _dt(font, _text(tmp, "b1.txt", f"▶ {CTA_EN}"), 78, 760, CREAM), _dt(font, _text(tmp, "b2.txt", CTA_JA), 70, 900, GOLD)]
    else:  # B
        tease += [_dt(font, _text(tmp, "t.txt", TEASE_JA), 88, 1400, NAVY, CREAM, border=34)]
        card = [f"drawbox=x=0:y=0:w=iw:h=ih:color={NAVY}@0.80:t=fill", frame,
                _dt(font, _text(tmp, "d1.txt", f"▶ {CTA_EN}"), 80, 700, CREAM),
                _dt(font, _text(tmp, "d2.txt", CTA_JA), 96, 850, GOLD),
                _dt(font, _text(tmp, "d3.txt", "▼ 最新のリール ▼"), 60, 1020, CREAM),
                _dt(font, pl, psz(60), 1150, NAVY, CREAM, border=30)]
    return ",".join(tease), ",".join(card)


def build_story_video(p, loop_path, out_path, variant=None):
    """見どころ（縦 9:16）に、ひとことのフックを重ね、最後に「本編はこちら」の幕を付けた1本の動画にする"""
    total = _duration(loop_path)
    start, dur = highlight_window(p, total)
    s = p.get("story") if isinstance(p.get("story"), dict) else {}
    poll = s.get("poll", DEFAULT_POLL)
    font = _font()
    if not font: raise StorySkip("日本語フォントがなく、ストーリーズの絵を作れない")
    tmp = pathlib.Path(tempfile.mkdtemp())
    en, ja = story_hook(p)
    tease_f, card_f = story_filters(variant or s.get("design") or DEFAULT_STORY_VARIANT, font, tmp, en, ja, poll, dur, END_CARD_SEC)
    audio = _has_audio(loop_path)
    norm = "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p"
    fc = (f"[0:v]{norm},{tease_f}[v0];"
          f"[1:v]{norm},tpad=stop_mode=clone:stop_duration={END_CARD_SEC},trim=duration={END_CARD_SEC},setpts=PTS-STARTPTS,{card_f},setsar=1[v1];")
    if audio:
        fc += (f"[0:a]aformat=sample_rates=44100:channel_layouts=stereo[a0];anullsrc=r=44100:cl=stereo,atrim=0:{END_CARD_SEC}[a1];"
               "[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]")
    else:
        fc += "[v0][v1]concat=n=2:v=1:a=0[v]"
    last = max(0.0, start + dur - 0.1)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-ss", str(start), "-t", str(dur), "-i", str(loop_path),
           "-ss", f"{last:.2f}", "-t", "0.1", "-i", str(loop_path),
           "-filter_complex", fc, "-map", "[v]"] + (["-map", "[a]", "-c:a", "aac", "-b:a", "128k"] if audio else []) + \
          ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-movflags", "+faststart", str(out_path)]
    subprocess.run(cmd, check=True)
    return out_path


# ---------- Instagram ----------
def ig_quota(uid, tok, http=requests):
    """24 時間の API 投稿の残り（件数）。読めなければ None"""
    try:
        j = fb._json(http.get(f"{G}/{uid}/content_publishing_limit", params={"fields": "quota_usage,config", "access_token": tok}, timeout=30))
        row = (j.get("data") or [{}])[0]
        used, total = row.get("quota_usage"), (row.get("config") or {}).get("quota_total")
        return None if used is None or not total else int(total) - int(used)
    except Exception:
        return None


def ig_check_quota(uid, tok, need, http=requests):
    left = ig_quota(uid, tok, http)
    if left is None: raise StorySkip("Instagram の投稿上限を確認できず、見送り")
    if left < need + IG_QUOTA_MARGIN: raise StorySkip(f"Instagram の 24 時間の投稿上限に近い（残り{left}件）ので見送り")


def _wait_container(cid, tok, http, sleep, polls=40, interval=15):
    for _ in range(polls):
        s = http.get(f"{G}/{cid}", params={"fields": "status_code,status", "access_token": tok}, timeout=30).json()
        if s.get("status_code") == "FINISHED": return
        if s.get("status_code") == "ERROR": raise RuntimeError(s)
        sleep(interval)
    raise RuntimeError(f"処理待ちの時間切れ {cid}")


def post_ig_story(uid, tok, video_url, http=requests, sleep=time.sleep):
    """動画のストーリーズ。ステッカー（アンケート等）は API で付けられないので、画像の中に問いかけを入れてある"""
    ig_check_quota(uid, tok, 1, http)
    c = http.post(f"{G}/{uid}/media", data={"media_type": "STORIES", "video_url": video_url, "access_token": tok}, timeout=120).json()
    if "id" not in c: raise RuntimeError(c)
    _wait_container(c["id"], tok, http, sleep)
    r = http.post(f"{G}/{uid}/media_publish", data={"creation_id": c["id"], "access_token": tok}, timeout=120).json()
    if "id" not in r: raise RuntimeError(r)
    return str(r["id"])


def post_ig_carousel(uid, tok, image_urls, caption, http=requests, sleep=time.sleep):
    """写真のカルーセル（2〜10枚）。1投稿として数える"""
    if not 2 <= len(image_urls) <= 10: raise StorySkip("カルーセルは 2〜10 枚")
    ig_check_quota(uid, tok, 1, http)
    kids = []
    for u in image_urls:
        c = http.post(f"{G}/{uid}/media", data={"image_url": u, "is_carousel_item": "true", "access_token": tok}, timeout=120).json()
        if "id" not in c: raise RuntimeError(c)
        kids.append(c["id"])
    for k in kids: _wait_container(k, tok, http, sleep)
    c = http.post(f"{G}/{uid}/media", data={"media_type": "CAROUSEL", "children": ",".join(kids), "caption": caption, "access_token": tok}, timeout=120).json()
    if "id" not in c: raise RuntimeError(c)
    _wait_container(c["id"], tok, http, sleep)
    r = http.post(f"{G}/{uid}/media_publish", data={"creation_id": c["id"], "access_token": tok}, timeout=120).json()
    if "id" not in r: raise RuntimeError(r)
    return str(r["id"])


def carousel_left(posted, month):
    """その月（"2026-10"）に出したカルーセルの数から、あと何本出せるか（posted.json の "ig_carousel_at" の月で数える）"""
    n = sum(1 for v in posted.values() if isinstance(v, dict) and str(v.get("ig_carousel_at", "")).startswith(month))
    return CAROUSEL_PER_MONTH - n


# ---------- Facebook ----------
def post_fb_story(page_id, tok, video_path, http=requests):
    """ページの動画ストーリーズ：開始 → アップロード → 完了。finish を送った後はやり直さない（二重投稿を防ぐ）"""
    video_path = pathlib.Path(video_path)
    j = fb._json(http.post(f"{G}/{page_id}/video_stories", data={"upload_phase": "start", "access_token": tok}, timeout=60))
    vid = j.get("video_id")
    if not vid: raise RuntimeError(f"start: {fb._err(j)}")
    up_url = j.get("upload_url") or f"{fb.RUPLOAD}/{vid}"
    if not up_url.startswith("https://rupload.facebook.com/"): raise RuntimeError("start: 想定外のアップロード先")
    with video_path.open("rb") as f:
        u = fb._json(http.post(up_url, headers={"Authorization": f"OAuth {tok}", "offset": "0", "file_size": str(video_path.stat().st_size)}, data=f, timeout=900))
    if not u.get("success"): raise RuntimeError(f"upload: {fb._err(u)}")
    fin = fb._json(http.post(f"{G}/{page_id}/video_stories", data={"upload_phase": "finish", "video_id": vid, "access_token": tok}, timeout=120))
    if not fin.get("success"): raise RuntimeError(f"finish 失敗 video_id={vid}: {fb._err(fin)}")
    return str(fin.get("post_id") or vid)


# ---------- YouTube ----------
def add_to_playlist(yt, video_id, series):
    """シリーズ名の再生リストを探し（なければ作る）、動画を足す。yt：googleapiclient の YouTube オブジェクト"""
    pid, page = None, None
    while True:
        r = yt.playlists().list(part="snippet", mine=True, maxResults=50, pageToken=page).execute()
        for it in r.get("items", []):
            if it["snippet"]["title"] == series: pid = it["id"]; break
        page = r.get("nextPageToken")
        if pid or not page: break
    if not pid:
        pid = yt.playlists().insert(part="snippet,status", body={"snippet": {"title": series}, "status": {"privacyStatus": "public"}}).execute()["id"]
    yt.playlistItems().insert(part="snippet", body={"snippet": {"playlistId": pid, "resourceId": {"kind": "youtube#video", "videoId": video_id}}}).execute()
    return pid
