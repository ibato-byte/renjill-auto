#!/usr/bin/env python3
"""投稿済み動画の数値を集めて content/metrics.csv に追記する（毎日1回）。
YouTube: videos.list statistics / Instagram: media insights / TikTok: video query /
Facebook リール: video_insights（再生=blue_reels_play_count、いいね=リアクション合計、コメント・シェア）。
取れないSNSは空欄のまま（推測で埋めない。ログに「計測なし」と出す）。"""
import csv, datetime as dt, json, os, pathlib, sys, requests
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import facebook as fb
import alerts
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
    if r.get("error"): raise RuntimeError(json.dumps(r["error"])[:300])
    return {d["name"]: d["values"][0]["value"] for d in r.get("data", [])}

def tt_stats(ids):
    tok = os.environ.get("TT_ACCESS_TOKEN")
    if not tok or not ids: return {}
    r = requests.post("https://open.tiktokapis.com/v2/video/query/?fields=id,view_count,like_count,comment_count,share_count",
                      headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}, json={"filters": {"video_ids": ids}}).json()
    if (r.get("error") or {}).get("code", "ok") != "ok": raise RuntimeError(json.dumps(r["error"])[:300])
    return {v["id"]: v for v in r.get("data", {}).get("videos", [])}

def token_alert(pl, e):
    """数値の収集がトークンのエラーで失敗したらメールで知らせる（Hub の指示 #5）"""
    if alerts.is_token_error(repr(e)):
        sec = alerts.PLATFORM_SECRET[pl]
        alerts.add(f"use:{sec}", f"数値の収集：{alerts.PLATFORM_NAME[pl]} の数値がトークンのエラーで取れなかった", alerts.FIX[sec])

try: Y = yt_stats([v["yt"] for v in posted.values() if v.get("yt") and v["yt"] != "manual"])
except Exception as e: print("yt", fb.scrub(e)); Y = {}; token_alert("yt", e)
try: T = tt_stats([v["tt"] for v in posted.values() if v.get("tt") and v["tt"] != "manual"])
except Exception as e: print("tt", fb.scrub(e)); T = {}; token_alert("tt", e)
FB_TOK = None
if any(v.get("facebook") and v["facebook"] != "manual" for v in posted.values()):
    try:
        acc = fb.diagnose()
        FB_TOK = acc["token"]
        if not acc["ok"]:
            print("facebook: 計測なし（" + "; ".join(acc["reasons"]) + "）")
            alerts.add("use:FB_PAGE_TOKEN", "数値の収集：Facebook リールの数値がトークン・権限の問題で取れなかった", alerts.FIX["FB_PAGE_TOKEN"])
    except Exception as e: print("facebook: 計測なし", type(e).__name__)
for key, v in posted.items():
    date, ep = key.split("_", 1); ts = v.get("tag_set", "")
    if v.get("yt") and v["yt"] != "manual":
        s = Y.get(v["yt"], {}); rows.append([today, date, ep, ts, "yt", s.get("viewCount", ""), s.get("likeCount", ""), s.get("commentCount", ""), "", ""])
    if v.get("tt") and v["tt"] != "manual":
        s = T.get(v["tt"], {}); rows.append([today, date, ep, ts, "tt", s.get("view_count", ""), s.get("like_count", ""), s.get("comment_count", ""), s.get("share_count", ""), ""])
    if v.get("ig") and v["ig"] != "manual":
        try: s = ig_stats(v["ig"])
        except Exception as e: print("ig", fb.scrub(e)); s = {}; token_alert("ig", e)
        rows.append([today, date, ep, ts, "ig", s.get("plays", ""), s.get("likes", ""), s.get("comments", ""), s.get("shares", ""), s.get("saved", "")])
    if v.get("facebook") and v["facebook"] != "manual":
        s = {}
        if FB_TOK:
            try: s = fb.reel_stats(v["facebook"], FB_TOK)
            except Exception as e: print("facebook", fb.scrub(e))
        if not s: print("facebook: 計測なし", key)
        rows.append([today, date, ep, ts, "facebook", s.get("plays", ""), s.get("reactions", ""), s.get("comments", ""), s.get("shares", ""), ""])
with out.open("a", newline="") as f:
    w = csv.writer(f)
    if new: w.writerow(["計測日", "投稿日", "ep", "tag_set", "sns", "再生", "いいね", "コメント", "シェア", "保存"])
    w.writerows(rows)
print("rows", len(rows))
