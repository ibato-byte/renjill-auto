#!/usr/bin/env python3
"""投稿ずみの回の表紙だけを差し替える（動画は消さない）。
2026-11-26 オーナー：「定時1分前のちょっといい？」3本の表紙の題名がばらばらなので、変えられる SNS はすべて Part 1 の題名にそろえる。
  YouTube：thumbnails().set／Facebook リール：/{video}/thumbnails（is_preferred）。
  Instagram・Threads・TikTok は投稿後に API で表紙を変えられないので、ここでは ID を調べて出すだけ。
  python auto/fix_covers.py <表紙JSON>   例：[{"part":2,"yt":"gcwECsYO7p0","cover":"https://…jpg","match":["My boss is everywhere","どこに逃げても"]}]
"""
import json, os, pathlib, sys, tempfile, requests
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import facebook as fb


def download(url, d):
    p = pathlib.Path(d) / url.rsplit("/", 1)[-1]
    r = requests.get(url, timeout=60); r.raise_for_status(); p.write_bytes(r.content)
    assert r.content[:2] == b"\xff\xd8", "JPEG ではない"
    return p


def yt_set(vid, path):
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    creds = Credentials(None, refresh_token=os.environ["YT_REFRESH_TOKEN"], token_uri="https://oauth2.googleapis.com/token",
                        client_id=os.environ["YT_CLIENT_ID"], client_secret=os.environ["YT_CLIENT_SECRET"])
    yt = build("youtube", "v3", credentials=creds)
    r = yt.thumbnails().set(videoId=vid, media_body=MediaFileUpload(str(path), mimetype="image/jpeg")).execute()
    return (r.get("items") or [{}])[0].get("maxres", (r.get("items") or [{}])[0].get("default", {})).get("url", "OK")


def fb_reels(acc):
    out, url = [], f'{fb.G}/{acc["page_id"]}/video_reels'
    params = {"fields": "id,description,created_time", "limit": 50, "access_token": acc["token"]}
    while url and len(out) < 200:
        j = requests.get(url, params=params, timeout=30).json(); params = None
        out += j.get("data", []); url = (j.get("paging") or {}).get("next")
    return out


def ig_media():
    tok, uid = os.environ.get("IG_ACCESS_TOKEN"), os.environ.get("IG_USER_ID")
    if not (tok and uid): return []
    j = requests.get(f"https://graph.facebook.com/v21.0/{uid}/media", params={"fields": "id,caption,timestamp,permalink,media_product_type", "limit": 50, "access_token": tok}, timeout=30).json()
    return j.get("data", [])


def main(spec):
    items = json.loads(spec)
    res = {}
    with tempfile.TemporaryDirectory() as d:
        acc = fb.diagnose()
        reels = fb_reels(acc) if acc.get("ok") else []
        print("[fb] page reels:", len(reels), "" if acc.get("ok") else "; ".join(acc.get("reasons", [])))
        igm = ig_media()
        for x in reels[:15]: print("[fb]", x["id"], x.get("created_time"), (x.get("description") or "").replace("\n", " ")[:70])
        for x in igm[:12]: print("[ig]", x["id"], x.get("timestamp"), x.get("permalink"), (x.get("caption") or "").replace("\n", " ")[:50])
        if os.environ.get("LIST_ONLY") == "1": return
        for it in items:
            path = download(it["cover"], d); r = res.setdefault(f'part{it["part"]}', {})
            if it.get("yt"):
                try: r["yt"] = yt_set(it["yt"], path)
                except Exception as e: r["yt"] = "NG " + fb.scrub(e)[:200]
            hit = [x for x in reels if any(m.lower() in (x.get("description") or "").lower() for m in it.get("match", []))]
            r["fb_found"] = [(x["id"], x.get("created_time")) for x in hit]
            for x in hit[:1]:
                ok = fb.set_thumbnail(x["id"], acc["token"], path)
                r["fb"] = ("OK " if ok else "NG ") + x["id"] + " attached=" + str(fb.thumbnail_attached(x["id"], acc["token"]))
            r["ig_found"] = [(x["id"], x.get("timestamp"), x.get("permalink")) for x in igm if any(m.lower() in (x.get("caption") or "").lower() for m in it.get("match", []))]
    print(json.dumps(res, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else os.environ["COVERS"])
