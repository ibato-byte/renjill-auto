#!/usr/bin/env python3
"""投稿済み動画の数値を集めて content/metrics.csv に追記する（毎日1回）。
YouTube: videos.list statistics / Instagram: media insights / TikTok: video query /
Facebook リール: video_insights（再生=blue_reels_play_count、いいね=リアクション合計、コメント・シェア）。
取れないSNSは空欄のまま（推測で埋めない。ログに「計測なし」と出す）。
Business Suite・手で予約した回（posted.json の "bs-scheduled"／"manual"）は、Instagram・Facebook の最近の投稿から
予定時刻とキャプションで投稿IDを探して posted.json に入れ、数値を取る（auto/meta_stats.py）。
フォロワー数（Instagram・Facebook・YouTube）は content/followers.csv に1日1行。"""
import csv, datetime as dt, json, os, pathlib, sys, requests
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import facebook as fb
import alerts
import mode
import meta_stats
ROOT = pathlib.Path(__file__).resolve().parent.parent
JST = dt.timezone(dt.timedelta(hours=9))
posted = json.loads((ROOT / "auto" / "posted.json").read_text()) if (ROOT / "auto" / "posted.json").exists() else {}
out = ROOT / "content" / "metrics.csv"; out.parent.mkdir(exist_ok=True)
new = out.exists() is False
rows = []
today = dt.datetime.now(JST).strftime("%Y-%m-%d")

NOT_ID = ("manual", "bs-scheduled")  # 手で予約・Business Suite で予約した回（投稿IDがないので API で数値を取れない）

def is_id(v):
    return bool(v) and v not in NOT_ID

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
    return meta_stats.ig_insights(mid, tok)

def yt_subscribers():
    if not os.environ.get("YT_REFRESH_TOKEN"): return None
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    creds = Credentials(None, refresh_token=os.environ["YT_REFRESH_TOKEN"], token_uri="https://oauth2.googleapis.com/token",
                        client_id=os.environ["YT_CLIENT_ID"], client_secret=os.environ["YT_CLIENT_SECRET"])
    it = build("youtube", "v3", credentials=creds).channels().list(part="statistics", mine=True).execute()["items"][0]
    return int(it["statistics"]["subscriberCount"])

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

try: Y = yt_stats([v["yt"] for v in posted.values() if is_id(v.get("yt"))])
except Exception as e: print("yt", fb.scrub(e)); Y = {}; token_alert("yt", e)
try: T = tt_stats([v["tt"] for v in posted.values() if is_id(v.get("tt"))])
except Exception as e: print("tt", fb.scrub(e)); T = {}; token_alert("tt", e)
MANUAL = mode.manual_platforms()  # 手動予約モードの SNS は API で数値を取らない（「計測なし」）
FB_TOK, META, FOUND, FOLLOW = None, {}, [], {}
if {"ig", "facebook"} - MANUAL and os.environ.get("IG_ACCESS_TOKEN"):
    try:
        META = dict(fb.diagnose(), system_token=os.environ["IG_ACCESS_TOKEN"])
        FB_TOK = META["token"]
        if not META["ok"]:
            print("facebook: 計測なし（" + "; ".join(META["reasons"]) + "）")
            alerts.add("use:FB_PAGE_TOKEN", "数値の収集：Facebook リールの数値がトークン・権限の問題で取れなかった", alerts.FIX["FB_PAGE_TOKEN"])
        # 予約した回の投稿IDを探す（見つかれば posted.json に入れて、今日から数値を取る）
        sch = json.loads((ROOT / "auto" / "schedule.json").read_text())
        ig_media, fb_reels = meta_stats.recent_media(META)
        FOUND = meta_stats.find_ids(posted, sch, ig_media, fb_reels, dt.datetime.now(JST))
        if FOUND:
            (ROOT / "auto" / "posted.json").write_text(json.dumps(posted, ensure_ascii=False, indent=2))
            for k, pl in FOUND: print("投稿IDを見つけた：", k, mode.NAMES[pl])
        FOLLOW = meta_stats.followers(META)
    except Exception as e: print("Meta: 計測なし", type(e).__name__)
try:
    n = yt_subscribers()
    if n is not None: FOLLOW["youtube"] = n
except Exception as e: print("yt subscribers", type(e).__name__)
for key, v in posted.items():
    date, ep = key.split("_", 1); ts = v.get("tag_set", "")
    if is_id(v.get("yt")):
        s = Y.get(v["yt"], {}); rows.append([today, date, ep, ts, "yt", s.get("viewCount", ""), s.get("likeCount", ""), s.get("commentCount", ""), "", ""])
    if is_id(v.get("tt")):
        s = T.get(v["tt"], {}); rows.append([today, date, ep, ts, "tt", s.get("view_count", ""), s.get("like_count", ""), s.get("comment_count", ""), s.get("share_count", ""), ""])
    if is_id(v.get("ig")) and "ig" not in MANUAL:
        try: s = ig_stats(v["ig"])
        except Exception as e: print("ig", fb.scrub(e)); s = {}; token_alert("ig", e)
        rows.append([today, date, ep, ts, "ig", s.get("views", ""), s.get("likes", ""), s.get("comments", ""), s.get("shares", ""), s.get("saved", "")])
    if is_id(v.get("facebook")) and "facebook" not in MANUAL:
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
if MANUAL: print("手動予約モード：", "・".join(sorted(mode.NAMES[x] for x in MANUAL)), "の数値は API で取らない（計測なし）")
wrote_f = meta_stats.write_followers(ROOT / "content" / "followers.csv", today, FOLLOW)
print("フォロワー：", FOLLOW if FOLLOW else "取れず", "（followers.csv に記録）" if wrote_f else "")
print("rows", len(rows))
# Automation Hub の report に渡す KPI（NUL 区切り。metrics.yml が読む）
hub = ["--kpi", f"記録した行={len(rows)}"]
for pl, label in (("ig", "Instagram フォロワー"), ("facebook", "Facebook フォロワー"), ("youtube", "YouTube 登録者")):
    if pl in FOLLOW: hub += ["--kpi", f"{label}={FOLLOW[pl]}"]
if FOUND: hub += ["--kpi", f"予約した回の投稿IDを見つけた={len(FOUND)}件"]
hub += ["--owner-action", "none"]
for pl in ("ig", "facebook"):
    if pl in MANUAL: hub += ["--kpi", f"{mode.NAMES[pl]}=手動予約モード中"]
(ROOT / "dist").mkdir(exist_ok=True)
(ROOT / "dist" / "metrics_hub_args").write_bytes(b"\0".join(x.encode() for x in hub) + b"\0")
