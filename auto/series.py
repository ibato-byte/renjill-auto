#!/usr/bin/env python3
"""週3本（月・木・土）・3話連載の決まり（2026-11-16 オーナー決定。設定は auto/series_policy.json、方針の全文は docs/SERIES.md）。

  python3 auto/series.py [--date YYYY-MM-DD] [--days 21]   … 予定表を検査。不合格があれば終了コード 2

決まり
- 投稿は 月・木・土 だけ（since 以降）。ほかの曜日の回は予定表に入れない・投稿しない（post.py が出さない）。
- series_start 以降は、1週間（月〜日）の3本で1つの話。予定の回には "series": {"id": 話の id, "part": 1〜3, "of": 3} を書く。
  月＝第1話、木＝第2話、土＝第3話。3本とも同じ id。
- 冒頭の一言（thumb.hook）に「Part N」を入れる（途中から見た人にも何話目か分かるように）。
- 第1話・第2話は、キャプションに「（つづく）」「(to be continued)」。台本の最後に次回予告とフォローのテロップ（「フォロー」の文字）。
- 第3話も最後にフォローのテロップ（「フォロー」の文字。次の話へつなぐ）。
- 第2話・第3話は、冒頭1〜2秒で前回のあらすじを見せる（台本の頭のコメントに「前回：」の1行）。どの話から見ても分かるように。
"""
import datetime as dt, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
JST = dt.timezone(dt.timedelta(hours=9))
DAYS_JA = "月火水木金土日"


def policy():
    f = ROOT / "auto" / "series_policy.json"
    try:
        d = json.loads(f.read_text(encoding="utf-8")) if f.exists() else None
    except (ValueError, TypeError):
        return None
    # 形が違うもの（テストで read_text を差し替えたときなど）は「決まりなし」として扱う
    return d if isinstance(d, dict) and {"since", "series_start", "post_weekdays", "parts"} <= set(d) else None


def weekdays(pol=None):
    pol = policy() if pol is None else pol
    return list(pol["post_weekdays"]) if pol else list(range(7))


def label(pol=None):
    return "・".join(DAYS_JA[w] for w in weekdays(pol))


def allowed(date, pol=None):
    """その日に投稿してよいか（since より前の日は昔の決まりのまま＝いつでもよい）"""
    pol = policy() if pol is None else pol
    if not pol: return True
    d = dt.date.fromisoformat(date) if isinstance(date, str) else date
    return d < dt.date.fromisoformat(pol["since"]) or d.weekday() in pol["post_weekdays"]


def part_for(date, pol=None):
    """その曜日が何話目か（月＝1、木＝2、土＝3）。投稿しない曜日は None"""
    pol = policy() if pol is None else pol
    d = dt.date.fromisoformat(date) if isinstance(date, str) else date
    w = weekdays(pol)
    return w.index(d.weekday()) + 1 if d.weekday() in w else None


def _src(ep):
    f = ROOT / "rig" / "ep" / f"{ep}.js"
    return f.read_text(encoding="utf-8") if f.exists() else None


def check(posts, today, days=21, pol=None, src=_src):
    """予定表の今日から days 日分を検査。{"issues": [...], "warns": [...]}。
    issues＝投稿してはいけない・連載が崩れる（投稿の3日以内なら直すまで出さない扱い）、warns＝見直すきっかけ"""
    pol = policy() if pol is None else pol
    issues, warns = [], []
    if not pol: return {"issues": issues, "warns": warns}
    start, end = today.isoformat(), (today + dt.timedelta(days=days)).isoformat()
    rows = sorted([p for p in posts if start <= p["date"] < end], key=lambda p: (p["date"], p.get("slot", "")))
    by_date = {}
    for p in rows: by_date.setdefault(p["date"], []).append(p)
    for d, ps in by_date.items():
        if len(ps) > 1: issues.append(f"{d}: 同じ日に {len(ps)} 本（週3本・1日1本）")
    for p in rows:
        tag = f'{p["date"]} {p.get("ep")}'
        if not allowed(p["date"], pol):
            issues.append(f"{tag}: {DAYS_JA[dt.date.fromisoformat(p['date']).weekday()]}曜日の回（投稿は{label(pol)}だけ。在庫 auto/stock.json に移す）")
            continue
        if p["date"] < pol["series_start"]: continue
        s, n = p.get("series") or {}, part_for(p["date"], pol)
        if not s.get("id") or not s.get("part"):
            issues.append(f'{tag}: 連載の欄 series（id・part・of）がない（{label(pol)}の3本で1つの話。この日は第{n}話）')
            continue
        if s["part"] != n: issues.append(f'{tag}: 第{s["part"]}話になっているが、この曜日は第{n}話（月＝1・木＝2・土＝3）')
        hook = (p.get("thumb") or {}).get("hook", "")
        if f'Part {s["part"]}' not in hook: issues.append(f'{tag}: 冒頭の一言（thumb.hook）に「Part {s["part"]}」がない（途中から見た人にも何話目か分かるように）')
        if s["part"] < pol["parts"]:
            if "つづく" not in p.get("caption_ja", ""): warns.append(f"{tag}: caption_ja に「（つづく）」がない")
            if "to be continued" not in p.get("caption_en", "").lower(): warns.append(f"{tag}: caption_en に「(to be continued)」がない")
        code = src(p["ep"])
        if code is None: continue  # 台本がまだない回は preflight が止める
        if "フォロー" not in code: issues.append(f"{tag}: 最後にフォローをうながすテロップ（「フォロー」の文字）がない")
        if s["part"] < pol["parts"] and "次回" not in code: issues.append(f"{tag}: 最後に次回予告（「次回」の文字）がない")
        if s["part"] >= 2 and not re.search(r"^\s*//\s*前回[：:]", code, re.M):
            issues.append(f"{tag}: 冒頭のあらすじがない（台本の頭のコメントに「// 前回：」の1行を書き、最初の1〜2秒で前回を見せる）")
    # 週ごとに3話そろっているか・同じ話か（series_start 以降で、予定表の範囲内の週）
    wk = dt.date.fromisoformat(max(pol["series_start"], start))
    wk -= dt.timedelta(days=wk.weekday())
    last = max(dt.date.fromisoformat(max([p["date"] for p in rows], default=start)), today + dt.timedelta(days=7))
    while wk <= last:
        days_ = [(wk + dt.timedelta(days=w)).isoformat() for w in pol["post_weekdays"]]
        ids = {(by_date.get(d, [{}])[0].get("series") or {}).get("id") for d in days_ if d in by_date}
        ids.discard(None)
        if len(ids) > 1: issues.append(f"{days_[0]} の週：3本が別の話になっている（{'・'.join(sorted(ids))}。1週間の3本で1つの話）")
        # 1本でも入っている週（連載が始まった週）と、7日以内に始まる週は、3話そろっていないと知らせる
        busy = any(d in by_date for d in days_) or (wk - today).days <= 7
        for i, d in enumerate(days_, 1):
            if busy and start <= d < end and d not in by_date:
                (issues if (dt.date.fromisoformat(d) - today).days <= 3 else warns).append(f"{d}（{DAYS_JA[dt.date.fromisoformat(d).weekday()]}）: 第{i}話がまだ予定表にない")
        wk += dt.timedelta(days=7)
    return {"issues": issues, "warns": warns}


def main(argv):
    today = dt.datetime.now(JST).date()
    if "--date" in argv: today = dt.date.fromisoformat(argv[argv.index("--date") + 1])
    days = int(argv[argv.index("--days") + 1]) if "--days" in argv else 21
    posts = json.loads((ROOT / "auto" / "schedule.json").read_text(encoding="utf-8"))["posts"]
    r = check(posts, today, days)
    for x in r["issues"]: print("ISSUE", x)
    for x in r["warns"]: print("WARN ", x)
    print(f"[series] 投稿は{label()}・3話連載 issues {len(r['issues'])} warns {len(r['warns'])}")
    return 2 if r["issues"] else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
