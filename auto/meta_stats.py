#!/usr/bin/env python3
"""Instagram・Facebook の数値を Graph API で取る（metrics.py から。読み取りのみ）。
2026-10-21 から Business Suite の週次 CSV（Chrome の Claude が書いていた）は作られないので、ここで代わりに取る。
- ig_insights：リールのインサイト（再生＝views。古い版の plays にも対応）。まとめて取れなければ1つずつ
- find_ids：Business Suite・手で予約した回（posted.json の "bs-scheduled"／"manual"）の投稿IDを、予定時刻とキャプションで探す
- fix_stale_ig：記録の Instagram の番号が最近の投稿の一覧にない（消した二重投稿の番号が残った等）とき、同じ時刻に出た今の投稿に付け替える（Hub 依頼 #244）
- followers：Instagram・Facebook のフォロワー数
- write_followers：content/followers.csv に1日1行
"""
import csv, datetime as dt, io, pathlib
import requests

import facebook as fb

JST = dt.timezone(dt.timedelta(hours=9))
NOT_ID = ("manual", "bs-scheduled")
IG_METRICS = ("views", "reach", "saved", "shares", "likes", "comments")
WINDOW = dt.timedelta(hours=3)  # 予定時刻からこの範囲に出た投稿だけを同じ回とみなす


def _get(http, url, params):
    r = http.get(url, params=params, timeout=30)
    try: return r.json()
    except Exception: return {"error": {"message": f"HTTP {getattr(r, 'status_code', '?')}"}}


def ig_insights(mid, tok, http=requests):
    """{"views": …, "reach": …, …}。何も取れなければ RuntimeError（トークンのエラーの判定に使う）"""
    def parse(j):
        return {d["name"]: (d.get("values") or [{}])[0].get("value", d.get("total_value", {}).get("value", "")) for d in j.get("data", [])}
    j = _get(http, f"{fb.G}/{mid}/insights", {"metric": ",".join(IG_METRICS), "access_token": tok})
    if not j.get("error"): out = parse(j)
    else:
        out, first_err = {}, j["error"]
        for m in IG_METRICS + ("plays",):
            k = _get(http, f"{fb.G}/{mid}/insights", {"metric": m, "access_token": tok})
            if not k.get("error"): out.update(parse(k))
        if not out: raise RuntimeError(str(first_err)[:300])
    if "views" not in out and "plays" in out: out["views"] = out["plays"]
    return out


def _at(p):
    h, m = map(int, p["slot"].split(":"))
    return dt.datetime.fromisoformat(p["date"]).replace(hour=h, minute=m, tzinfo=JST)


def _ts(s):
    return dt.datetime.strptime(s.replace("Z", "+0000"), "%Y-%m-%dT%H:%M:%S%z")


def _same(p, text, when):
    head = p["caption_en"].strip()[:25].lower()
    return abs(when - _at(p)) <= WINDOW and bool(head) and head in (text or "").lower()


def find_ids(posted, sch, ig_media, fb_reels, now):
    """予約した回の投稿IDを探して posted に入れる（"ig": "<ID>", "ig_via": "bs-scheduled" など）。見つけた [(key, SNS)] を返す
    ig_media：[{id, caption, timestamp}]、fb_reels：[{id, description, created_time}]（新しい順、最近の50件など）"""
    found, used = [], set()
    for p in sch["posts"]:
        key = f'{p["date"]}_{p["ep"]}'
        rec = posted.get(key)
        if not rec or _at(p) > now: continue
        for pl, items, text_k, time_k in (("ig", ig_media, "caption", "timestamp"), ("facebook", fb_reels, "description", "created_time")):
            if rec.get(pl) not in NOT_ID: continue
            hit = next((m for m in items if m.get("id") not in used and m.get(time_k) and _same(p, m.get(text_k), _ts(m[time_k]))), None)
            if hit:
                used.add(hit["id"]); rec[pl + "_via"] = rec[pl]; rec[pl] = str(hit["id"]); found.append((key, pl))
    return found


def fix_stale_ig(posted, ig_media):
    """記録の Instagram の番号が、最近の投稿の一覧（ig_media）にないときに付け替える。[(key, 古い番号, 新しい番号)] を返す
    11/8「了解です」は二重に出て片方を消したため、記録の番号が消した方のままになり、数字が毎日取れなかった（Hub 依頼 #244）。
    付け替えるのは、記録の投稿時刻（ig_at）が一覧の範囲内で、その時刻の前後3時間に出た「まだどの回の記録にもない投稿」がちょうど1本のときだけ。
    記録に ig_shortcode（投稿のアドレスの /reel/<ここ>/）があれば、それと同じ投稿に限る。迷うときは付け替えない（推測で埋めない）"""
    stamped = [(m, _ts(m["timestamp"])) for m in ig_media if m.get("id") and m.get("timestamp")]
    if not stamped: return []
    oldest = min(t for _, t in stamped)
    listed = {str(m["id"]) for m, _ in stamped}
    used = {str(v.get("ig")) for v in posted.values() if isinstance(v, dict) and v.get("ig")}
    fixed = []
    for key, rec in sorted(posted.items()):
        if not isinstance(rec, dict): continue
        mid, at = rec.get("ig"), rec.get("ig_at")
        if not mid or mid in NOT_ID or str(mid) in listed or not at: continue
        try: when = dt.datetime.fromisoformat(at)
        except ValueError: continue
        if when.tzinfo is None: when = when.replace(tzinfo=JST)
        if when < oldest: continue  # 一覧より古い回は、一覧にないのが当たり前
        cands = [m for m, t in stamped if str(m["id"]) not in used and abs(t - when) <= WINDOW]
        sc = rec.get("ig_shortcode")
        if sc: cands = [m for m in cands if f"/{sc}/" in (m.get("permalink") or "")]
        if len(cands) != 1: continue
        new = str(cands[0]["id"])
        rec["ig_old"], rec["ig"] = str(mid), new
        used.add(new); fixed.append((key, str(mid), new))
    return fixed


def recent_media(meta, http=requests):
    """Instagram の最近の投稿と Facebook ページの最近のリール（取れなければ空）"""
    ig, fbr = [], []
    tok = meta.get("system_token")
    if meta.get("ig_user_id") and tok:
        ig = _get(http, f'{fb.G}/{meta["ig_user_id"]}/media', {"fields": "id,caption,timestamp,permalink", "limit": 50, "access_token": tok}).get("data") or []
    if meta.get("token"):
        fbr = _get(http, f'{fb.G}/{fb.PAGE_ID}/video_reels', {"fields": "id,description,created_time", "limit": 50, "access_token": meta["token"]}).get("data") or []
    return ig, fbr


def followers(meta, http=requests):
    """{"ig": 数, "facebook": 数}（取れないものは入れない）"""
    out = {}
    tok = meta.get("system_token")
    if meta.get("ig_user_id") and tok:
        j = _get(http, f'{fb.G}/{meta["ig_user_id"]}', {"fields": "followers_count", "access_token": tok})
        if isinstance(j.get("followers_count"), int): out["ig"] = j["followers_count"]
    if meta.get("token"):
        j = _get(http, f"{fb.G}/{fb.PAGE_ID}", {"fields": "followers_count,fan_count", "access_token": meta["token"]})
        v = j.get("followers_count", j.get("fan_count"))
        if isinstance(v, int): out["facebook"] = v
    return out


HEADER = ["計測日", "ig", "tiktok", "youtube", "facebook", "x", "line", "合計", "メモ"]


def write_followers(path, today, counts):
    """content/followers.csv に今日の行を足す（同じ日の行があれば足さない）。古い形（facebook 列なし）は列を足して直す。足したら True"""
    path = pathlib.Path(path)
    rows = list(csv.reader(io.StringIO(path.read_text(encoding="utf-8")))) if path.exists() else []
    migrate = bool(rows) and rows[0] != HEADER
    if migrate:
        old = rows[0]
        rows = [HEADER] + [[r[old.index(h)] if h in old and old.index(h) < len(r) else "" for h in HEADER] for r in rows[1:]]
    if not rows: rows = [HEADER]
    if any(r and r[0] == today for r in rows[1:]) or not counts:
        if migrate: _write(path, rows)
        return False
    vals = {k: counts.get(k, "") for k in ("ig", "tiktok", "youtube", "facebook")}
    total = sum(v for v in vals.values() if isinstance(v, int))
    rows.append([today, vals["ig"], vals["tiktok"], vals["youtube"], vals["facebook"], "", "", total, "自動（API）。空欄は取れなかった"])
    _write(path, rows)
    return True


def _write(path, rows):
    buf = io.StringIO(); csv.writer(buf, lineterminator="\n").writerows(rows)
    path.write_text(buf.getvalue(), encoding="utf-8")
