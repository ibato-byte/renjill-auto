#!/usr/bin/env python3
"""取りこぼしていた数字を毎日集める（Hub 依頼 #92・#95。読み取りのみ・無料の Graph API の範囲）。
content/insights.csv に「1指標1行」で足す（計測日,対象,ref,指標,値,メモ）。取れなかった指標は値を空にして理由をメモに残す。
- reel   ：Instagram リール1本ごと（reach・保存・シェア・平均視聴時間・合計視聴時間・プロフィール訪問・フォロー）。完走率の代わりに「平均視聴時間÷動画の長さ」も出す
- account：Instagram アカウントの1日分（リーチ・プロフィール訪問・フォロー増減・エンゲージしたアカウント）
- story  ：24時間以内のストーリーズ（リーチ・返信・タップ前/後・離脱・リンク移動・シェア）
- threads：Threads の投稿ごと（再生・いいね・返信・リポスト・引用・シェア）
- fb_reel：Facebook リール（再生・反応の内訳・コメント・シェア）
- 3秒視聴率：Instagram の API には出ない（アプリの画面にだけ出る）。取れない理由として毎回メモに書き、Hub の資料にも載せる
`python auto/insights.py`（metrics.yml から毎日。失敗しても止めない）"""
import csv, datetime as dt, io, json, os, pathlib, sys
import requests

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import facebook as fb
import meta_stats

ROOT = pathlib.Path(__file__).resolve().parent.parent
JST = dt.timezone(dt.timedelta(hours=9))
HEADER = ["計測日", "対象", "ref", "指標", "値", "メモ"]
REEL_METRICS = ("reach", "saved", "shares", "ig_reels_avg_watch_time", "ig_reels_video_view_total_time", "total_interactions")
REEL_UNSUPPORTED = "リール1本ごとの値は API が対応していない（2026-10-25 に確認）。アカウント全体の profile_views・follows で見る"
ACCOUNT_METRICS = ("reach", "profile_views", "accounts_engaged", "follows_and_unfollows", "views")
STORY_METRICS = ("reach", "replies", "shares", "follows", "profile_visits", "total_interactions", "views")
NO_3SEC = "Instagram の API では3秒視聴率・完走率は取れない（アプリの画面にだけ出る）。代わりに平均視聴時間÷動画の長さを見る"


def _get(http, url, params):
    r = http.get(url, params=params, timeout=30)
    try: return r.json()
    except Exception: return {"error": {"message": f"HTTP {getattr(r, 'status_code', '?')}"}}


def _err(j):
    e = j.get("error") or {}
    return str(e.get("message") or e)[:120]


def _values(j):
    """insights の応答 → {指標: 値}。値が内訳つき（total_value.breakdowns）のときは合計だけ取る"""
    out = {}
    for d in j.get("data", []):
        v = (d.get("values") or [{}])[0].get("value")
        if v is None: v = (d.get("total_value") or {}).get("value", "")
        out[d["name"]] = v
    return out


def one_by_one(http, url, metrics, tok, extra=None):
    """指標を1つずつ聞く（1つがだめでも他は取れる）。{指標: (値, メモ)}"""
    out = {}
    for m in metrics:
        j = _get(http, url, dict({"metric": m, "access_token": tok}, **(extra or {})))
        if j.get("error"): out[m] = ("", _err(j))
        else:
            v = _values(j).get(m, "")
            out[m] = (v, "" if v != "" else "値が返らなかった")
    return out


def completion_proxy(avg_ms, duration_s):
    """平均視聴時間（ミリ秒）÷ 動画の長さ（秒）。どちらかが無ければ空"""
    try:
        a, d = float(avg_ms), float(duration_s)
    except (TypeError, ValueError):
        return ""
    return round(a / 1000 / d, 3) if d > 0 else ""


def reel_rows(today, posted, tok, http, durations):
    rows = []
    for key, v in sorted(posted.items()):
        mid = v.get("ig")
        if not mid or mid in meta_stats.NOT_ID: continue
        res = one_by_one(http, f"{fb.G}/{mid}/insights", REEL_METRICS, tok)
        for m, (val, note) in res.items(): rows.append([today, "reel", key, m, val, note])
        ep = key.split("_", 1)[1]
        # len＝実際に出した動画の長さ（冒頭を速くした回は短い。依頼 #97）
        rows.append([today, "reel", key, "avg_watch_ratio", completion_proxy(res["ig_reels_avg_watch_time"][0], v.get("len") or durations.get(ep)), "平均視聴時間÷動画の長さ（完走率の代わり）"])
        rows.append([today, "reel", key, "view_3s_rate", "", NO_3SEC])
        for m in ("profile_visits", "follows"): rows.append([today, "reel", key, m, "", REEL_UNSUPPORTED])
    return rows


def account_rows(today, uid, tok, http):
    res = one_by_one(http, f"{fb.G}/{uid}/insights", ACCOUNT_METRICS, tok, {"period": "day", "metric_type": "total_value"})
    rows = [[today, "account", uid, m, val, note] for m, (val, note) in res.items() if m != "follows_and_unfollows"]
    # フォロー増減は内訳つきで聞く（follow_type：フォローした／やめた）
    j = _get(http, f"{fb.G}/{uid}/insights", {"metric": "follows_and_unfollows", "period": "day", "metric_type": "total_value", "breakdown": "follow_type", "access_token": tok})
    if j.get("error"): rows.append([today, "account", uid, "follows_and_unfollows", "", _err(j)])
    else:
        got = {}
        for d in j.get("data", []):
            for b in (d.get("total_value") or {}).get("breakdowns") or []:
                for r in b.get("results", []): got["follows_" + "_".join(r.get("dimension_values", ["?"]))] = r.get("value", 0)
        if got:
            for k, v in got.items(): rows.append([today, "account", uid, k, v, ""])
        else: rows.append([today, "account", uid, "follows_and_unfollows", (j.get("data") or [{}])[0].get("total_value", {}).get("value", ""), "内訳が返らなかった"])
    return rows


def story_rows(today, uid, tok, http):
    j = _get(http, f"{fb.G}/{uid}/stories", {"fields": "id,timestamp", "access_token": tok})
    if j.get("error"): return [[today, "story", uid, "stories", "", "ストーリーズ一覧が取れない：" + _err(j)]]
    rows = []
    for s in j.get("data") or []:
        res = one_by_one(http, f"{fb.G}/{s['id']}/insights", STORY_METRICS, tok)
        for m, (val, note) in res.items(): rows.append([today, "story", s["id"], m, val, note])
        nav = _get(http, f"{fb.G}/{s['id']}/insights", {"metric": "navigation", "breakdown": "story_navigation_action_type", "access_token": tok})
        if nav.get("error"):
            rows.append([today, "story", s["id"], "navigation", "", _err(nav)])
        else:
            for d in nav.get("data", []):
                for r in ((d.get("total_value") or {}).get("breakdowns") or [{}])[0].get("results", []):
                    rows.append([today, "story", s["id"], "nav_" + "_".join(r.get("dimension_values", ["?"])), r.get("value", ""), ""])
    return rows or [[today, "story", uid, "stories", "", "いま24時間以内のストーリーズがない"]]


def fb_rows(today, posted, token, http):
    """Facebook リール。インサイト・動画そのものの順に聞き、取れなかったときは API が返した理由をメモに残す（Hub 依頼 #95）"""
    rows = []
    for key, v in sorted(posted.items()):
        vid = v.get("facebook")
        if not vid or vid in meta_stats.NOT_ID: continue
        got, why = {}, []
        for m, label in (("blue_reels_play_count", "plays"), ("post_video_likes_by_reaction_type", "reactions"), ("post_video_social_actions", "social")):
            j = _get(http, f"{fb.G}/{vid}/video_insights", {"metric": m, "access_token": token})
            if j.get("error"): why.append(f"{m}：{_err(j)}"); continue
            vals = ((j.get("data") or [{}])[0].get("values") or [{}])[0].get("value")
            if vals is None: why.append(f"{m}：値が返らなかった"); continue
            if label == "social" and isinstance(vals, dict): got["comments"] = vals.get("comment", 0); got["shares"] = vals.get("share", 0)
            elif label == "reactions" and isinstance(vals, dict): got["reactions"] = sum(x for x in vals.values() if isinstance(x, (int, float)))
            elif label == "plays": got["plays"] = vals
        if "plays" not in got:
            for fields in ("views", "video_insights", "likes.summary(true).limit(0),comments.summary(true).limit(0)"):
                j = _get(http, f"{fb.G}/{vid}", {"fields": fields, "access_token": token})
                if j.get("error"): why.append(f"動画の {fields.split('.')[0]}：{_err(j)}"); continue
                if isinstance(j.get("views"), (int, float)): got["plays"] = j["views"]
                for k, name in (("likes", "reactions"), ("comments", "comments")):
                    t = ((j.get(k) or {}).get("summary") or {}).get("total_count")
                    if isinstance(t, (int, float)) and name not in got: got[name] = t
        note = " / ".join(why)[:300]
        for m in ("plays", "reactions", "comments", "shares"):
            rows.append([today, "fb_reel", key, m, got.get(m, ""), "" if m in got else (note or "値が返らなかった")])
    return rows


THREADS_G = "https://graph.threads.net/v1.0"
THREADS_METRICS = ("views", "likes", "replies", "reposts", "quotes", "shares")


def threads_rows(today, posted, tok, http):
    """Threads の投稿ごとの数字（Hub 依頼 #99）。取れないときは理由をメモに残す"""
    rows = []
    for key, v in sorted(posted.items()):
        mid = v.get("threads")
        if not mid or mid in meta_stats.NOT_ID: continue
        j = _get(http, f"{THREADS_G}/{mid}/insights", {"metric": ",".join(THREADS_METRICS), "access_token": tok})
        if j.get("error"):
            rows += [[today, "threads", key, m, "", _err(j)] for m in THREADS_METRICS]
            continue
        got = {d["name"]: (d.get("values") or [{}])[0].get("value", "") for d in j.get("data", [])}
        rows += [[today, "threads", key, m, got.get(m, ""), "" if m in got else "値が返らなかった"] for m in THREADS_METRICS]
    return rows


def durations_of():
    """ep → 画面に出る動画の長さ（秒）。rig/ep/<ep>.js の dur（台本の長さ）から、rig/pace.js の「頭を削る秒数 start・速さ speed」を引き直す
    （(dur − start) ÷ speed。これを忘れると完走率の代わりの数字が実際より低く出る。依頼 #97）"""
    import re
    pace = {}
    pf = ROOT / "rig" / "pace.js"
    if pf.exists():
        for m in re.finditer(r"(\w+):\s*\{\s*start:\s*([0-9.]+),\s*speed:\s*([0-9.]+)", pf.read_text(encoding="utf-8")):
            pace[m.group(1)] = (float(m.group(2)), float(m.group(3)))
    out = {}
    for f in (ROOT / "rig" / "ep").glob("*.js"):
        m = re.search(r"\bdur:\s*([0-9.]+)", f.read_text(encoding="utf-8"))
        if m:
            start, speed = pace.get(f.stem, (0.0, 1.0))
            out[f.stem] = round((float(m.group(1)) - start) / speed, 2)
    return out


def append(path, rows, today):
    """同じ日・同じ対象・ref・指標の行があれば足さない（1日に何度動かしても重ならない）"""
    path = pathlib.Path(path)
    have = set()
    if path.exists():
        for r in csv.reader(io.StringIO(path.read_text(encoding="utf-8"))):
            if len(r) >= 4 and r[0] == today: have.add(tuple(r[:4]))
    new = [r for r in rows if tuple(r[:4]) not in have]
    buf = io.StringIO(); w = csv.writer(buf, lineterminator="\n")
    if not path.exists(): w.writerow(HEADER)
    w.writerows(new)
    with path.open("a", encoding="utf-8") as f: f.write(buf.getvalue())
    return len(new)


def gaps(rows):
    """取れなかった指標の一覧（対象ごと・理由つき）。Hub に出す"""
    seen = {}
    for r in rows:
        if r[4] == "" and r[5] and r[3] != "view_3s_rate": seen.setdefault((r[1], r[3]), r[5])
    return seen


def main():
    today = dt.datetime.now(JST).strftime("%Y-%m-%d")
    posted_f = ROOT / "auto" / "posted.json"
    posted = json.loads(posted_f.read_text()) if posted_f.exists() else {}
    tok = os.environ.get("IG_ACCESS_TOKEN")
    if not tok: print("insights: IG_ACCESS_TOKEN がないので何もしない"); return 0
    rows = []
    meta = {}
    try: meta = dict(fb.diagnose(), system_token=tok)
    except Exception as e: print("insights: Meta の確認で失敗", type(e).__name__)
    uid = meta.get("ig_user_id")
    if uid:
        rows += reel_rows(today, posted, tok, requests, durations_of())
        rows += account_rows(today, uid, tok, requests)
        rows += story_rows(today, uid, tok, requests)
    if meta.get("token"): rows += fb_rows(today, posted, meta["token"], requests)
    ttok = os.environ.get("THREADS_ACCESS_TOKEN")
    if ttok: rows += threads_rows(today, posted, ttok, requests)
    n = append(ROOT / "content" / "insights.csv", rows, today)
    g = gaps(rows)
    (ROOT / "dist").mkdir(exist_ok=True)
    (ROOT / "dist" / "insights_gaps.json").write_text(json.dumps([{"対象": k[0], "指標": k[1], "理由": v} for k, v in g.items()], ensure_ascii=False, indent=1))
    print(f"insights: {n} 行を記録。取れなかった指標 {len(g)} 種類（dist/insights_gaps.json）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
