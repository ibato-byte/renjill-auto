#!/usr/bin/env python3
"""投稿せずに、鍵と接続だけを確認する（Actions の check ワークフローから実行）。秘密の値は一切表示しない。"""
import os, sys, pathlib, requests
sys.path.insert(0, str(pathlib.Path(__file__).parent))
ok = True
def res(name, good, info=""):
    global ok; ok &= bool(good); print(("OK " if good else "NG "), name, info, flush=True)

# YouTube
try:
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    creds = Credentials(None, refresh_token=os.environ["YT_REFRESH_TOKEN"], token_uri="https://oauth2.googleapis.com/token",
                        client_id=os.environ["YT_CLIENT_ID"], client_secret=os.environ["YT_CLIENT_SECRET"])
    r = build("youtube", "v3", credentials=creds).channels().list(part="snippet,statistics", mine=True).execute()
    it = r["items"][0]; res("YouTube", True, f'channel={it["snippet"]["title"]} subs={it["statistics"].get("subscriberCount")}')
except Exception as e: res("YouTube", False, repr(e)[:200])

# Instagram
try:
    uid, tok = os.environ["IG_USER_ID"], os.environ["IG_ACCESS_TOKEN"]
    r = requests.get(f"https://graph.facebook.com/v21.0/{uid}", params={"fields": "username,followers_count,media_count", "access_token": tok}).json()
    res("Instagram", "username" in r, str({k: r.get(k) for k in ("username", "followers_count", "media_count", "error")}))
    q = requests.get(f"https://graph.facebook.com/v21.0/{uid}/content_publishing_limit", params={"access_token": tok}).json()
    res("Instagram publish quota", "data" in q, str(q.get("data", q.get("error")))[:200])
except Exception as e: res("Instagram", False, repr(e)[:200])

# media repo
try:
    from post import media_publish
    url = media_publish(pathlib.Path(__file__), "check_ping.txt")
    res("renjill-media write", True, url)
except Exception as e: res("renjill-media write", False, repr(e)[:200])

print("ALL OK" if ok else "SOME NG"); sys.exit(0 if ok else 1)
