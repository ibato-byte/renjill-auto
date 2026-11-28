#!/usr/bin/env python3
"""YouTube に、決まった時刻に公開される動画を予約で上げる（表紙つき）。1回きりの予約用。

使い方：auto/yt_schedule.json に並べた回を、上から順に上げる。
  各回：{"key": 記録の名前, "video": 動画の URL, "cover": 表紙の URL, "title": 題名, "description": 説明, "publish_at": "2026-11-28T09:00:00Z"}
- 上げた回は auto/yt_schedule.json の "done" に動画 ID を書く（もう一度動かしても二重に上げない）。
- 表紙は post.py と同じ yt_set_thumbnail で付けて確かめる。YouTube の処理が終わってから付ける（直後だと付いたことにならない。2026-11-28）。
- 公開されたら、チャンネルのショートの一覧で表紙を目で確かめる（API の「成功」だけで済ませない）。
- 公開の時刻・非公開のまま予約になっているかを読み直して確かめる。
"""
import json, os, pathlib, sys, time, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto"))
import sns_policy  # noqa: E402
from post import yt_set_thumbnail  # noqa: E402

CFG = ROOT / "auto" / "yt_schedule.json"


def fetch(url, dst):
    with urllib.request.urlopen(url, timeout=300) as r, open(dst, "wb") as f:
        f.write(r.read())
    return dst


def main():
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    cfg = json.loads(CFG.read_text())
    creds = Credentials(None, refresh_token=os.environ["YT_REFRESH_TOKEN"], token_uri="https://oauth2.googleapis.com/token",
                        client_id=os.environ["YT_CLIENT_ID"], client_secret=os.environ["YT_CLIENT_SECRET"])
    yt = build("youtube", "v3", credentials=creds)
    ch = yt.channels().list(part="snippet", mine=True).execute()["items"][0]["snippet"]
    print("チャンネル:", ch.get("title"), ch.get("customUrl"))
    work = pathlib.Path("/tmp/yts"); work.mkdir(exist_ok=True)
    ok = True
    for it in cfg["items"]:
        if it.get("done"):
            print("済み:", it["key"], it["done"]); continue
        v = fetch(it["video"], work / f'{it["key"]}.mp4'); c = fetch(it["cover"], work / f'{it["key"]}.jpg')
        print(it["key"], "動画", v.stat().st_size, "表紙", c.stat().st_size)
        body = {"snippet": {"title": it["title"], "description": sns_policy.yt_description(it["description"]), "categoryId": "23", "defaultLanguage": "ja"},
                "status": {"privacyStatus": "private", "publishAt": it["publish_at"], "selfDeclaredMadeForKids": False}}
        res = yt.videos().insert(part="snippet,status", body=body, media_body=MediaFileUpload(str(v), chunksize=-1, resumable=True)).execute()
        vid = res["id"]; it["done"] = vid
        CFG.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n")
        # 2026-11-28 事故：上げた直後（YouTube の処理が終わる前）に表紙を付けると、API は成功を返すのに、
        # 公開されたときは途中のコマのままだった。処理が終わるまで待ってから付ける（最大15分）。
        for _ in range(90):
            ps = yt.videos().list(part="processingDetails", id=vid).execute()["items"][0].get("processingDetails", {})
            if ps.get("processingStatus") in ("succeeded", "failed", "terminated"): break
            time.sleep(10)
        print(it["key"], "処理", ps.get("processingStatus"))
        th = yt_set_thumbnail(yt, vid, c)
        time.sleep(3)
        st = yt.videos().list(part="status,snippet", id=vid).execute()["items"][0]
        print(f'{it["key"]}: id={vid} 表紙={th} 公開予定={st["status"].get("publishAt")} 状態={st["status"]["privacyStatus"]} 題名={st["snippet"]["title"]}')
        it["thumb"] = th
        if th != "OK" or st["status"].get("publishAt", "").replace(".000Z", "Z") != it["publish_at"]: ok = False
        CFG.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
