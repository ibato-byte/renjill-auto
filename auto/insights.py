#!/usr/bin/env python3
"""取りこぼしていた数字を毎日集める（Hub 依頼 #92・#95。読み取りのみ・無料の Graph API の範囲）。
content/insights.csv に「1指標1行」で足す（計測日,対象,ref,指標,値,メモ）。取れなかった指標は値を空にして理由をメモに残す。
- reel   ：Instagram リール1本ごと（reach・保存・シェア・平均視聴時間・合計視聴時間・プロフィール訪問・フォロー）。完走率の代わりに「平均視聴時間÷動画の長さ」も出す
- account：Instagram アカウントの1日分（リーチ・プロフィール訪問・フォロー増減・エンゲージしたアカウント）
- story  ：24時間以内のストーリーズ（リーチ・返信・タップ前/後・離脱・リンク移動・シェア）
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
REEL_METRICS = ("reach", "saved", "shares", "ig_reels_avg_watch_time", "ig_reels_video_view_total_time", "profile_visits", "follows", "total_interactions")
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
        rows.append([today, "reel", key, "avg_watch_ratio", completion_proxy(res["ig_reels_avg_watch_time"][0], durations.get(ep)), "平均視聴時間÷動画の長さ（完走率の代わり）"])
        rows.append([today, "reel", key, "view_3s_rate", "", NO_3SEC])
    return rows


def account_rows(today, uid, tok, http):
    res = one_by_one(http, f"{fb.G}/{uid}/insights", ACCOUNT_METRICS, tok, {"period": "day", "metric_type": "total_value"})
    return [[today, "account", uid, m, val, note] for m, (val, note) in res.items()]


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
    rows = []
    for key, v in sorted(posted.items()):
        vid = v.get("facebook")
        if not vid or vid in meta_stats.NOT_ID: continue
        try: s = fb.reel_stats(vid, token) or {}
        except Exception as e: s = {}; rows.append([today, "fb_reel", key, "error", "", fb.scrub(e)[:120]])
        for m, label in (("plays", "再生"), ("reactions", "反応"), ("comments", "コメント"), ("shares", "シェア")):
            rows.append([today, "fb_reel", key, m, s.get(m, ""), "" if s.get(m, "") != "" else "取れなかった（応答が空）"])
    return rows


def durations_of():
    """ep → 動画の長さ（秒）。rig/ep/<ep>.js の dur から"""
    import re
    out = {}
    for f in (ROOT / "rig" / "ep").glob("*.js"):
        m = re.search(r"\bdur:\s*([0-9.]+)", f.read_text(encoding="utf-8"))
        if m: out[f.stem] = float(m.group(1))
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
    n = append(ROOT / "content" / "insights.csv", rows, today)
    g = gaps(rows)
    (ROOT / "dist").mkdir(exist_ok=True)
    (ROOT / "dist" / "insights_gaps.json").write_text(json.dumps([{"対象": k[0], "指標": k[1], "理由": v} for k, v in g.items()], ensure_ascii=False, indent=1))
    print(f"insights: {n} 行を記録。取れなかった指標 {len(g)} 種類（dist/insights_gaps.json）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
