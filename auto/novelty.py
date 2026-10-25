#!/usr/bin/env python3
"""「新作」の数え方（Hub 依頼 #101）。

どれかの SNS に一度でも出した話は、作り直し（*2 の版）でも新作に数えない。
- 出した話の一覧 = 第1弾の9話（ORIGINALS）＋ posted.json ＋ content/metrics.csv に載っている回（+ 予定表の日付が早い同じ話）
- 作り直しを予定に入れてよいのは、前に出した日から REMAKE_MIN_DAYS 日以上あけ、かつ回に {"remake": {"why": "前回より明らかに良くなる理由"}} があるとき
`python auto/novelty.py [--date YYYY-MM-DD]` で、予定表の直近14日の新作の割合と、きまりに合わない回を出す。"""
import csv, datetime as dt, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
JST = dt.timezone(dt.timedelta(hours=9))
REMAKE_MIN_DAYS = 28
WINDOW_DAYS = 14
FIRST_DAY = dt.date(2026, 10, 19)  # 第1弾を出した日（metrics.csv の最初の投稿日）
# 第1弾の9話。metrics.csv で出したと確かめられるのは hanko・meeting・camera_off。残りは安全側（出した扱い）にしている
ORIGINALS = ["meeting", "jil_morning", "stamp", "papers", "mug", "chime", "camera_off", "receipts", "deadline"]
ALIASES = {"hanko": "stamp", "teiji_binky": "chime"}


def story_key(ep):
    """ep 名から「話」の名前を取る（meeting2 → meeting、hanko → stamp）"""
    k = re.sub(r"\d+$", "", ep)
    return ALIASES.get(k, k)


def published(root=ROOT):
    """話の名前 → 最後に出した日。出した記録のあるものだけ"""
    out = {story_key(k): FIRST_DAY for k in ORIGINALS}
    def put(ep, d):
        k = story_key(ep)
        if k not in out or d > out[k]: out[k] = d
    f = root / "auto" / "posted.json"
    if f.exists():
        for key, rec in json.loads(f.read_text(encoding="utf-8")).items():
            if not any(rec.get(s) and rec.get(s) != "manual" for s in ("ig", "facebook", "threads", "yt", "tt")): continue  # 番号が割り当たっただけで、まだ出していない回
            d, ep = key.split("_", 1)
            put(ep, dt.date.fromisoformat(d))
    m = root / "content" / "metrics.csv"
    if m.exists():
        for r in csv.DictReader(m.open(encoding="utf-8")):
            if r.get("ep") and r.get("投稿日"): put(r["ep"], dt.date.fromisoformat(r["投稿日"]))
    return out


def judge(posts, today, pub=None):
    """予定表（posts）のうち、今日から WINDOW_DAYS 日以内の回を判定する。
    戻り値：{"rows": [...], "new": 件数, "total": 件数, "ratio": 割合, "violations": [...]}"""
    pub = dict(pub if pub is not None else published())
    rows, seen, violations = [], dict(pub), []
    for p in sorted(posts, key=lambda p: (p["date"], p["slot"])):
        d = dt.date.fromisoformat(p["date"]); k = story_key(p["ep"])
        prev = seen.get(k)
        if prev is None:
            kind, gap = "new", None
        else:
            kind, gap = "remake", (d - prev).days
        if kind == "new": seen[k] = d
        else:
            why = (p.get("remake") or {}).get("why", "").strip()
            if gap < REMAKE_MIN_DAYS or not why:
                violations.append({"date": p["date"], "ep": p["ep"], "title": p.get("title", ""), "gap_days": gap,
                                   "text": f'「{p.get("title", p["ep"])}」（{p["date"]}）は {prev.isoformat()} に出した話の作り直し'
                                           + (f'（間隔 {gap} 日 < {REMAKE_MIN_DAYS} 日）' if gap < REMAKE_MIN_DAYS else "")
                                           + ("" if why else "。作り直す理由の記録なし")})
            seen[k] = max(seen[k], d)
        if (d - today).days in range(-1, WINDOW_DAYS + 1) and d >= today:
            rows.append({"date": p["date"], "ep": p["ep"], "title": p.get("title", ""), "kind": kind, "gap_days": gap})
    n = sum(1 for r in rows if r["kind"] == "new")
    # きまりに合わない回のうち、まだ出していない（今日以降の）ものだけを返す
    violations = [v for v in violations if dt.date.fromisoformat(v["date"]) >= today]
    return {"rows": rows, "new": n, "total": len(rows), "ratio": (n / len(rows)) if rows else None, "violations": violations}


def main(argv):
    today = dt.datetime.now(JST).date()
    if "--date" in argv: today = dt.date.fromisoformat(argv[argv.index("--date") + 1])
    sch = json.loads((ROOT / "auto" / "schedule.json").read_text(encoding="utf-8"))
    r = judge(sch["posts"], today)
    for x in r["rows"]: print(f'{x["date"]} {x["ep"]:<14} {"新作" if x["kind"] == "new" else "作り直し(前回から%d日)" % x["gap_days"]}  {x["title"]}')
    print(f'新作 {r["new"]}/{r["total"]}' + (f' = {r["ratio"]:.0%}' if r["ratio"] is not None else ""))
    for v in r["violations"]: print("要対応:", v["text"])
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
