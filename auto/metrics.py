#!/usr/bin/env python3
"""投稿済み動画の数値を集めて content/metrics.csv に追記する（毎日1回）。
YouTube: videos.list statistics / Instagram: media insights / TikTok: video query。
取れないSNSは空欄のまま（推測で埋めない）。"""
import csv, datetime as dt, json, os, pathlib, requests
ROOT = pathlib.Path(__file__).resolve().parent.parent
JST = dt.timezone(dt.timedelta(hours=9))
posted = json.loads((ROOT / "auto" / "posted.json").read_text()) if (ROOT / "auto" / "posted.json").exists() else {}
out = ROOT / "content" / "metrics.csv"; out.parent.mkdir(exist_ok=True)
new = out.exists() is False
rows = []
today = dt.datetime.now(JST).strftime("%Y-%m-%d")

def yt_stats(ids):
    if not ids: return {}
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    creds = Credentials(None, refresh_token=os.environ["YT_REFRESH_TOKEN"], token_uri="https://oauth2.googleapis.com/token",
                        client_id=os.environ["YT_CLIENT_ID"], client_secret=os.environ["YT_CLIENT_SECRET"])
    r = build("youtube", "v3", credentials=creds).videos().list(part="statistics", id=",".join(ids)).execute()
    return {i["id"]: i["statistics"] for i in r.get("items", [])}

def ig_stats(mid):
    tok = os.environ.get("IG_ACCESS_TOKEN")
    if not tok: return {}
    r = requests.get(f"https://graph.facebook.com/v21.0/{mid}/insights", params={"metric": "plays,reach,saved,shares,likes,comments", "access_token": tok}).json()
    return {d["name"]: d["values"][0]["value"] for d in r.get("data", [])}

def tt_stats(ids):
    tok = os.environ.get("TT_ACCESS_TOKEN")
    if not tok or not ids: return {}
    r = requests.post("https://open.tiktokapis.com/v2/video/query/?fields=id,view_count,like_count,comment_count,share_count",
                      headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}, json={"filters": {"video_ids": ids}}).json()
    return {v["id"]: v for v in r.get("data", {}).get("videos", [])}

try: Y = yt_stats([v["yt"] for v in posted.values() if v.get("yt") and v["yt"] != "manual"])
except Exception as e: print("yt", e); Y = {}
try: T = tt_stats([v["tt"] for v in posted.values() if v.get("tt") and v["tt"] != "manual"])
except Exception as e: print("tt", e); T = {}
for key, v in posted.items():
    date, ep = key.split("_", 1); ts = v.get("tag_set", "")
    if v.get("yt") and v["yt"] != "manual":
        s = Y.get(v["yt"], {}); rows.append([today, date, ep, ts, "yt", s.get("viewCount", ""), s.get("likeCount", ""), s.get("commentCount", ""), "", ""])
    if v.get("tt") and v["tt"] != "manual":
        s = T.get(v["tt"], {}); rows.append([today, date, ep, ts, "tt", s.get("view_count", ""), s.get("like_count", ""), s.get("comment_count", ""), s.get("share_count", ""), ""])
    if v.get("ig") and v["ig"] != "manual":
        try: s = ig_stats(v["ig"])
        except Exception as e: print("ig", e); s = {}
        rows.append([today, date, ep, ts, "ig", s.get("plays", ""), s.get("likes", ""), s.get("comments", ""), s.get("shares", ""), s.get("saved", "")])
with out.open("a", newline="") as f:
    w = csv.writer(f)
    if new: w.writerow(["計測日", "投稿日", "ep", "tag_set", "sns", "再生", "いいね", "コメント", "シェア", "保存"])
    w.writerows(rows)
print("rows", len(rows))
