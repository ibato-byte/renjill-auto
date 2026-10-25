#!/usr/bin/env python3
"""投稿の頻度を「毎日（週7本）」へ段階的に増やす判定（Claude を使わない。Hub 依頼 #98）。
第1段階（今）：週4〜5本。つかみの改善（#97）を優先し、毎日出せる体制（ネタ・描画・検査・予定表14日先）だけ先に作る。
第2段階：#97 の直しで出した回（posted.json の opening あり）のうち、投稿順に「最後まで見られた割合（平均視聴時間÷長さ）」が
  直す前の基準（約16%）より明らかに上（RISE_RATIO 倍以上）の回が 2 本続いたら、毎日（週7本）に切り替える。
  切り替えたあとも、直近2本が基準を割ったら週4〜5本に戻す（質が落ちるなら本数を戻す）。
結果は content/cadence.json に書く。daily_review.py が毎朝呼んで Hub に出し、週次PDCAは「今週の本数」をこの値から決める。
`python auto/cadence.py [--date YYYY-MM-DD]`"""
import csv, datetime as dt, io, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
JST = dt.timezone(dt.timedelta(hours=9))
BASELINE = 0.16      # 直す前の「平均視聴時間÷長さ」（約15〜17%。依頼 #95 の調べ）
RISE_RATIO = 1.3     # 基準の 1.3 倍（約21%）以上を「明らかに上がった」とする
NEED_IN_A_ROW = 2    # 続けて何本で切り替えるか
STAGE1_PER_WEEK, STAGE2_PER_WEEK = 5, 7
AHEAD_DAYS = 14      # 予定表を常にここまで埋める


def read_csv(path):
    path = pathlib.Path(path)
    return list(csv.DictReader(io.StringIO(path.read_text(encoding="utf-8")))) if path.exists() else []


def ratios(insights, posted):
    """投稿順（キーの日付順）の [(key, 最新の avg_watch_ratio)]。冒頭を直した版（posted の opening あり。依頼 #97）の回だけ"""
    last = {}
    for r in insights:
        if r["対象"] != "reel" or r["指標"] != "avg_watch_ratio" or r["値"] == "": continue
        if r["ref"] not in last or r["計測日"] >= last[r["ref"]][0]: last[r["ref"]] = (r["計測日"], float(r["値"]))
    return [(k, v) for k, (_, v) in sorted(last.items()) if (posted.get(k) or {}).get("opening")]


def decide(rows, prev_stage=1):
    """rows＝[(key, ratio)]（投稿順）→ (stage, per_week, 理由)"""
    need = BASELINE * RISE_RATIO
    n = len(rows)
    if n < NEED_IN_A_ROW:
        return 1, STAGE1_PER_WEEK, f"直した版の回の数字がまだ {n} 本（{NEED_IN_A_ROW} 本そろうまで週{STAGE1_PER_WEEK}本。つかみの改善を優先）"
    tail = [v for _, v in rows[-NEED_IN_A_ROW:]]
    if all(v >= need for v in tail):
        return 2, STAGE2_PER_WEEK, f"直近 {NEED_IN_A_ROW} 本の最後まで見られた割合が {tail[0]:.0%}・{tail[1]:.0%}（基準 {BASELINE:.0%} の {RISE_RATIO} 倍＝{need:.0%} 以上）→ 毎日"
    if prev_stage == 2 and all(v < BASELINE for v in tail):
        return 1, STAGE1_PER_WEEK, f"毎日にしたあと、直近 {NEED_IN_A_ROW} 本が基準 {BASELINE:.0%} を割った（{tail[0]:.0%}・{tail[1]:.0%}）→ 週{STAGE1_PER_WEEK}本に戻す"
    if prev_stage == 2:
        return 2, STAGE2_PER_WEEK, f"毎日を続ける（直近 {tail[0]:.0%}・{tail[1]:.0%}。基準 {BASELINE:.0%} を割った2本続きになるまで戻さない）"
    return 1, STAGE1_PER_WEEK, f"直近 {NEED_IN_A_ROW} 本が {tail[0]:.0%}・{tail[1]:.0%}。{need:.0%} 以上が {NEED_IN_A_ROW} 本続くまで週{STAGE1_PER_WEEK}本"


def planned(sch, today):
    """今日から予定表の最後までの日数と、1日に2本以上入っている日"""
    dates = [p["date"] for p in sch["posts"] if p["date"] >= today.isoformat()]
    last = max((dt.date.fromisoformat(d) for d in dates), default=today)
    dup = sorted({d for d in dates if dates.count(d) > 1})
    return (last - today).days, dup


def main(argv):
    today = dt.datetime.now(JST).date()
    if "--date" in argv: today = dt.date.fromisoformat(argv[argv.index("--date") + 1])
    f = ROOT / "content" / "cadence.json"
    prev = json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}
    posted_f = ROOT / "auto" / "posted.json"
    posted = json.loads(posted_f.read_text(encoding="utf-8")) if posted_f.exists() else {}
    rows = ratios(read_csv(ROOT / "content" / "insights.csv"), posted)
    stage, per_week, why = decide(rows, prev.get("stage", 1))
    days, dup = planned(json.loads((ROOT / "auto" / "schedule.json").read_text(encoding="utf-8")), today)
    out = {"stage": stage, "per_week": per_week, "why": why, "baseline": BASELINE, "need": round(BASELINE * RISE_RATIO, 3),
           "recent": [{"key": k, "ratio": v} for k, v in rows[-4:]], "schedule_days_ahead": days, "schedule_target_days": AHEAD_DAYS,
           "same_day_twice": dup, "date": today.isoformat()}
    if {k: v for k, v in out.items() if k != "date"} != {k: v for k, v in prev.items() if k != "date"} or not f.exists():
        f.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"[cadence] 第{stage}段階・週{per_week}本：{why}")
    return out


if __name__ == "__main__":
    main(sys.argv[1:])
