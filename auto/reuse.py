#!/usr/bin/env python3
"""伸びた回の再活用の候補（依頼 #37-4）。content/metrics.csv から、再生が上位で、公開から 14〜28 日たった回を選ぶ。
候補は content/reuse_candidates.json に書く。週次 PDCA（Claude）が、冒頭やサムネを変えた別バージョンを作って schedule.json に入れる。
同じ動画をそのまま出し直すことはしない（Instagram は他の SNS からの転載や同じ内容の繰り返しをおすすめから外す。同じ回の再投稿は 30 日あけ、別バージョンにする）。
`python auto/reuse.py [--date YYYY-MM-DD]`"""
import csv, datetime as dt, json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
JST = dt.timezone(dt.timedelta(hours=9))
MIN_AGE, MAX_AGE, TOP_N = 14, 28, 2


def score(rows):
    """回ごとに、各 SNS の最新の計測の「再生 + 送られた・保存×5 + シェア×5」を足す"""
    latest = {}
    for r in rows:
        k = (r["ep"], r["sns"])
        if k not in latest or r["計測日"] >= latest[k]["計測日"]: latest[k] = r
    out = {}
    for (ep, _), r in latest.items():
        def n(x):
            try: return int(float(r.get(x) or 0))
            except ValueError: return 0
        s = n("再生") + 5 * (n("保存") + n("シェア"))
        o = out.setdefault(ep, {"ep": ep, "posted": r["投稿日"], "score": 0})
        o["score"] += s; o["posted"] = min(o["posted"], r["投稿日"])
    return out


def candidates(rows, today, already):
    sc = score(rows)
    ok = [v for v in sc.values() if MIN_AGE <= (today - dt.date.fromisoformat(v["posted"])).days <= MAX_AGE and v["ep"] not in already and v["score"] > 0]
    ok.sort(key=lambda v: -v["score"])
    return ok[:TOP_N]


def main(argv):
    today = dt.datetime.now(JST).date()
    if "--date" in argv: today = dt.date.fromisoformat(argv[argv.index("--date") + 1])
    f = ROOT / "content" / "metrics.csv"
    rows = list(csv.DictReader(f.open(encoding="utf-8"))) if f.exists() else []
    out_f = ROOT / "content" / "reuse_candidates.json"
    prev = json.loads(out_f.read_text()) if out_f.exists() else {"candidates": []}
    already = {c["ep"] for c in prev["candidates"]}
    new = candidates(rows, today, already)
    for c in new:
        c["note"] = "冒頭 1〜2 秒の見せ場を変える／サムネの一言を変える。動画の中身は同じでも別バージョンとして作り、前回の公開から 30 日あけて出す"
        c["found"] = today.isoformat(); c["done"] = False
    prev["candidates"] += new
    out_f.write_text(json.dumps(prev, ensure_ascii=False, indent=1) + "\n")
    print("[reuse] 新しい候補:", [c["ep"] for c in new] or "なし")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
