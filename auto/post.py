#!/usr/bin/env python3
"""レンとジル 自動投稿
- auto/schedule.json から「今日・このスロット」の回を取り出す
- 未レンダリングなら rig でレンダリング（dist/<ep>_yt.mp4 と dist/<ep>_loop.mp4）
- Instagram / TikTok / YouTube に投稿し、auto/posted.json に記録する

必要な環境変数（GitHub Secrets）:
  IG_USER_ID, IG_ACCESS_TOKEN                  … Instagram（Meta Graph API）
  TT_ACCESS_TOKEN                               … TikTok（Content Posting API, video.publish）
  YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN … YouTube Data API v3
  PUBLIC_BASE_URL                               … Instagramが取りに来る公開URLの土台（GitHub Pages など）
失敗したSNSはスキップして他を続け、終了コードで知らせる。
"""
import datetime as dt, json, os, subprocess, sys, time, pathlib
import requests

ROOT = pathlib.Path(__file__).resolve().parent.parent
RIG, DIST, AUTO = ROOT / "rig", ROOT / "dist", ROOT / "auto"
JST = dt.timezone(dt.timedelta(hours=9))
DIST.mkdir(exist_ok=True)

def log(*a): print("[post]", *a, flush=True)

# ---------- 対象の決定 ----------
def pick_posts(slot_override=None):
    sch = json.loads((AUTO / "schedule.json").read_text())
    posted = json.loads((AUTO / "posted.json").read_text()) if (AUTO / "posted.json").exists() else {}
    now = dt.datetime.now(JST)
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
    subprocess.run([str(RIG / "build.sh"), ep, str(yt)], check=True)
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
def ig_cover_url(th_path):
    """カバー画像の公開URLを作る。リポジトリは非公開のままにするため、FBページに「非公開の写真」として上げ、
    そのCDN URLをカバーに使う（ページのタイムラインには出ない）。必要な権限: pages_manage_posts"""
    G = "https://graph.facebook.com/v21.0"
    page, ptok = os.environ["FB_PAGE_ID"], os.environ["FB_PAGE_TOKEN"]
    with open(th_path, "rb") as f:
        r = requests.post(f"{G}/{page}/photos", data={"published": "false", "access_token": ptok}, files={"source": f}).json()
    if "id" not in r: raise RuntimeError(r)
    img = requests.get(f"{G}/{r['id']}", params={"fields": "images", "access_token": ptok}).json()
    return max(img["images"], key=lambda x: x["width"])["source"]

def post_instagram(p, d, video_path, th_path):
    """リール投稿。動画はファイルをそのまま送る（resumable upload）ので公開URLは不要"""
    uid, tok = os.environ["IG_USER_ID"], os.environ["IG_ACCESS_TOKEN"]
    G = "https://graph.facebook.com/v21.0"
    data = {"media_type": "REELS", "upload_type": "resumable", "caption": caption(p, d), "share_to_feed": "true", "access_token": tok}
    try: data["cover_url"] = ig_cover_url(th_path)
    except Exception as e: raise RuntimeError(f"カバー画像を用意できないので投稿しない（文字なしサムネを避けるため）: {e!r}"[:400])
    c = requests.post(f"{G}/{uid}/media", data=data).json()
    if "id" not in c: raise RuntimeError(c)
    cid = c["id"]; size = pathlib.Path(video_path).stat().st_size
    with open(video_path, "rb") as f:
        u = requests.post(f"https://rupload.facebook.com/ig-api-upload/v21.0/{cid}",
                          headers={"Authorization": f"OAuth {tok}", "offset": "0", "file_size": str(size)}, data=f).json()
    if not u.get("success"): raise RuntimeError(u)
    for _ in range(40):  # 処理待ち（最大 ~10分）
        s = requests.get(f"{G}/{cid}", params={"fields": "status_code", "access_token": tok}).json()
        if s.get("status_code") == "FINISHED": break
        if s.get("status_code") == "ERROR": raise RuntimeError(s)
        time.sleep(15)
    r = requests.post(f"{G}/{uid}/media_publish", data={"creation_id": cid, "access_token": tok}).json()
    if "id" not in r: raise RuntimeError(r)
    return r["id"]

def main():
    slot_override = sys.argv[1] if len(sys.argv) > 1 else None
    sch, posted, targets = pick_posts(slot_override)
    d = sch["defaults"]
    if not targets: log("今日のこの時間帯に投稿なし"); return 0
    failed = []
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
                rec[pl + "_at"] = dt.datetime.now(JST).isoformat(timespec="minutes")
                log("OK", key, pl, rec[pl])
            except Exception as e:
                log("NG", key, pl, repr(e)[:500]); failed.append(f"{key}:{pl}")
        (AUTO / "posted.json").write_text(json.dumps(posted, ensure_ascii=False, indent=2))
    if failed: log("失敗:", failed); return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
