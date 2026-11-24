#!/usr/bin/env python3
"""週3本（月・木・土）・3話連載の決まり（2026-11-16 オーナー決定。設定は auto/series_policy.json、方針の全文は docs/SERIES.md）。

  python3 auto/series.py [--date YYYY-MM-DD] [--days 21]   … 予定表を検査。不合格があれば終了コード 2

決まり
- 投稿は 月・木・土 だけ（since 以降）。ほかの曜日の回は予定表に入れない・投稿しない（post.py が出さない）。
- series_start 以降は、投稿日を順に3本ずつ区切って1つの話。予定の回には "series": {"id": 話の id, "part": 1〜3, "of": 3} を書く。
  series_start の日が第1話、次の投稿日が第2話、その次が第3話（2026-11-17 オーナー：第1弾は 木11/19・土11/21・月11/23。週をまたいでよい）。3本とも同じ id。
- series_start 以降は、連載ではない1話完結の回は出さない（オーナーの指示があるまで。post.py も出さない）。
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


def posting_days(start, end, pol=None):
    """start〜end（両方ふくむ）の投稿日の一覧"""
    pol = policy() if pol is None else pol
    a = dt.date.fromisoformat(start) if isinstance(start, str) else start
    b = dt.date.fromisoformat(end) if isinstance(end, str) else end
    out = []
    while a <= b:
        if not pol or a.weekday() in pol["post_weekdays"]: out.append(a)
        a += dt.timedelta(days=1)
    return out


def part_for(date, pol=None):
    """その日が何話目か。series_start の日を第1話として、投稿日を順に 1→2→3→1… と数える。投稿しない日・series_start より前は None
    （2026-11-17 までは「月＝1、木＝2、土＝3」の固定だった。第1弾を木曜から始めるため、投稿日の順に変えた。series_start が月曜なら今までと同じ）"""
    pol = policy() if pol is None else pol
    d = dt.date.fromisoformat(date) if isinstance(date, str) else date
    if not pol or d.weekday() not in pol["post_weekdays"]: return None
    s0 = dt.date.fromisoformat(pol["series_start"])
    if d < s0: return None
    return (len(posting_days(s0, d, pol)) - 1) % pol["parts"] + 1


def groups(start, end, pol=None):
    """series_start から数えて、start〜end にかかる「3本で1つの話」の組（投稿日のリスト）の一覧"""
    pol = policy() if pol is None else pol
    s0 = dt.date.fromisoformat(pol["series_start"])
    days_ = posting_days(s0, end, pol)
    out = [days_[i:i + pol["parts"]] for i in range(0, len(days_), pol["parts"])]
    st = dt.date.fromisoformat(start) if isinstance(start, str) else start
    return [g for g in out if g and g[-1] >= st]


def series_ok(p, pol=None):
    """投稿してよい回か（series_start 以降は、連載の欄 series がある回だけ。approval_from 以降は、オーナーが絵コンテをOKした回だけ）"""
    pol = policy() if pol is None else pol
    if not pol or p["date"] < pol["series_start"]: return True
    s = p.get("series") or {}
    return bool(s.get("id") and s.get("part")) and storyboard_ok(p, pol)


def storyboard_ok(p, pol=None):
    """オーナーが絵コンテをOKしたか（2026-11-20 オーナー：動画にする前に絵コンテを見せる）。approval_from より前の回は問わない"""
    pol = policy() if pol is None else pol
    if not pol or not pol.get("approval_from") or p["date"] < pol["approval_from"]: return True
    return bool((p.get("series") or {}).get("storyboard_ok"))


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
        if s["part"] != n: issues.append(f'{tag}: 第{s["part"]}話になっているが、この日は第{n}話（{pol["series_start"]} から投稿日の順に 1→2→3）')
        want = (pol.get("slots") or {}).get(str(dt.date.fromisoformat(p["date"]).weekday()))
        if want and p["date"] >= pol.get("slots_from", "9999") and p.get("slot") != want:
            issues.append(f'{tag}: 投稿時刻が {p.get("slot")}（{DAYS_JA[dt.date.fromisoformat(p["date"]).weekday()]}曜日は {want}。2026-11-21 オーナー：月・木 18:00、土 12:00）')
        if not storyboard_ok(p, pol):
            days_left = (dt.date.fromisoformat(p["date"]) - today).days
            (issues if days_left <= 3 else warns).append(f"{tag}: オーナーの絵コンテのOK（series.storyboard_ok）がまだ。OKが出るまで動画を作らず、投稿もしない")
        hook = (p.get("thumb") or {}).get("hook", "")
        if not re.search(rf'Part\s*{s["part"]}\b', hook, re.I): issues.append(f'{tag}: 冒頭の一言（thumb.hook）に「Part {s["part"]}」がない（途中から見た人にも何話目か分かるように）')
        if s["part"] < pol["parts"]:
            if "つづく" not in p.get("caption_ja", ""): warns.append(f"{tag}: caption_ja に「（つづく）」がない")
            if "to be continued" not in p.get("caption_en", "").lower(): warns.append(f"{tag}: caption_en に「(to be continued)」がない")
        code = src(p["ep"])
        if code is None: continue  # 台本がまだない回は preflight が止める
        # 2026-11-24：「定時1分前」と同じ締め（赤い札「つづく ▶ …」＋英語「Follow for Part 2 ▶ …」）も、フォローをうながすテロップとして数える
        if "フォロー" not in code and "Follow for" not in code: issues.append(f"{tag}: 最後にフォローをうながすテロップ（「フォロー」の文字）がない")
        NEXT = ("次回", "第2話へ", "第3話へ", "最終話へ", "次の話", "つづく ▶")   # 2026-11-21 オーナーのテロップ「フォローして第2話へ」「フォローして最終話へ」も次回予告
        if s["part"] < pol["parts"] and not any(w in code for w in NEXT): issues.append(f"{tag}: 最後に次回予告（「次回」「第2話へ」「最終話へ」などの文字）がない")
        if s["part"] >= 2 and not re.search(r"^\s*//\s*前回[：:]", code, re.M):
            issues.append(f"{tag}: 冒頭のあらすじがない（台本の頭のコメントに「// 前回：」の1行を書き、最初の1〜2秒で前回を見せる）")
    # 3本の組ごとに、3話そろっているか・同じ話か（series_start から投稿日の順に3本ずつ）
    last = max(dt.date.fromisoformat(max([p["date"] for p in rows], default=start)), today + dt.timedelta(days=7))
    for g in groups(start, last, pol):
        days_ = [x.isoformat() for x in g]
        ids = {(by_date.get(d, [{}])[0].get("series") or {}).get("id") for d in days_ if d in by_date}
        ids.discard(None)
        if len(ids) > 1: issues.append(f"{days_[0]} からの3本：別の話になっている（{'・'.join(sorted(ids))}。3本で1つの話）")
        # 1本でも入っている組（連載が始まった組）と、7日以内に始まる組は、3話そろっていないと知らせる
        busy = any(d in by_date for d in days_) or (g[0] - today).days <= 7
        for i, d in enumerate(days_, 1):
            if busy and start <= d < end and d not in by_date:
                (issues if (dt.date.fromisoformat(d) - today).days <= 3 else warns).append(f"{d}（{DAYS_JA[dt.date.fromisoformat(d).weekday()]}）: 第{i}話がまだ予定表にない")
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
