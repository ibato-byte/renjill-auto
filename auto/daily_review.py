#!/usr/bin/env python3
"""毎日の軽い振り返り（Claude を使わない。Hub 依頼 #95）。数字の収集（metrics.py・insights.py）のあとに動く。
1. 打ち手の評価：投稿済みの「予定」の打ち手を、標準の回と比べて「良い／同じ／悪い」にする（効いたものは content/standards.json に残して標準にする）
2. 次の投稿に1つだけ打ち手を割り当てる：まだ投稿していない回のうち、打ち手のない最初の1本に、1変数だけ変えて試す（サムネの型・ハッシュタグ・一言・時刻）。
   つかみの文・サムネの絵の差し替えのような「文を作る」ものは週次の Claude（週次PDCA）が担当する
3. 目標との差を出す（Instagram フォロワー。届きそうなら目標を引き上げる）
4. 改善が止まっていないかの点検：数字が2日続けて取れない／投稿したのに打ち手の記録がない／予定表が7日を切った
数字に変化がない日は、記録だけして終わる（割り当て・評価の変更がなければファイルを書かない）。
`python auto/daily_review.py [--date YYYY-MM-DD]`"""
import csv, datetime as dt, io, json, pathlib, statistics, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
JST = dt.timezone(dt.timedelta(hours=9))
EXP_HEADER = ["投稿日", "ep", "変数", "標準", "試す値", "理由", "状態", "結果", "採用"]
SLOTS = ["12:00", "18:00", "19:00"]  # post.yml の cron がある時刻
CTAS = [  # 一言（英語が先・日本語が後）。1つずつ試す
    "Send this to the coworker who needs it./あの同僚に送ってあげて",
    "Which one is your boss?/あなたの職場のレンは誰？",
    "Save this for your next Monday./月曜の朝のために保存して",
]
VARIABLES = ["thumb_variant", "tag_set", "cta", "slot"]  # この順にめぐる（効かなかったものは後回し）
GOAL = {"metric": "Instagram フォロワー", "base": 3, "target": 30, "due": "2026-11-25", "avg_views_base": 130, "avg_views_target": 300}
GOAL_START = "2026-10-26"  # この日以降の回から、打ち手の記録を必須にする
MIN_GAIN = 0.2  # 標準の中央値より2割以上多ければ「良い」、2割以上少なければ「悪い」
SCHEDULE_MIN_DAYS = 7


def read_csv(path):
    path = pathlib.Path(path)
    return list(csv.DictReader(io.StringIO(path.read_text(encoding="utf-8")))) if path.exists() else []


def write_csv(path, header, rows):
    buf = io.StringIO(); w = csv.writer(buf, lineterminator="\n"); w.writerow(header); w.writerows(rows)
    pathlib.Path(path).write_text(buf.getvalue(), encoding="utf-8")


def num(x):
    try: return float(x)
    except (TypeError, ValueError): return None


def latest_views(metrics, sns="ig"):
    """{ep: 最新の再生数}"""
    last = {}
    for r in metrics:
        if r["sns"] != sns: continue
        if r["ep"] not in last or r["計測日"] >= last[r["ep"]][0]: last[r["ep"]] = (r["計測日"], num(r["再生"]))
    return {ep: v for ep, (_, v) in last.items() if v is not None}


def ig_followers(rows):
    """followers.csv の最新の Instagram フォロワー数（無ければ None）"""
    for r in reversed(rows):
        v = num(r.get("ig"))
        if v is not None: return int(v)
    return None


def goal_status(followers, today, goal, history):
    """目標との差。直線で伸びて期限までに届きそうなら目標を引き上げる（引き上げは記録して Hub に出す）"""
    target, raised = goal["target"], None
    if followers is not None and history:
        d0, v0 = history[0]
        days = max((today - d0).days, 1)
        due_days = max((dt.date.fromisoformat(goal["due"]) - today).days, 0)
        proj = followers + (followers - v0) / days * due_days
        if followers >= target or proj >= target * 1.1:
            raised = max(target * 2, int(proj) + 10); target = raised
    gap = None if followers is None else target - followers
    return {"followers": followers, "target": target, "gap": gap, "raised": raised, "due": goal["due"]}


def stalled_metrics(metrics, today):
    """数字が2日続けて取れていない（最新の計測日が一昨日以前）ならその日付を返す"""
    days = sorted({r["計測日"] for r in metrics if r["計測日"]})
    if not days: return "計測の記録がまだない"
    last = dt.date.fromisoformat(days[-1])
    return f"最新の計測は {last}（{(today - last).days} 日前）" if (today - last).days >= 2 else None


def blank_streak(metrics, sns, today):
    """直近の計測日で、その SNS の再生が全部空欄だった日が何日続いたか"""
    by = {}
    for r in metrics:
        if r["sns"] == sns: by.setdefault(r["計測日"], []).append(num(r["再生"]))
    n = 0
    for d in sorted(by, reverse=True):
        if any(v is not None for v in by[d]): break
        n += 1
    return n


def evaluate(exps, posted, views, today):
    """状態「予定」で、投稿から1日以上たって再生が取れた打ち手を評価する。変えたら True"""
    changed = False
    standard_pool = [v for ep, v in views.items() if not any(e["ep"] == ep for e in exps)]
    for e in exps:
        if e["状態"] != "予定" or f'{e["投稿日"]}_{e["ep"]}' not in posted: continue
        if (today - dt.date.fromisoformat(e["投稿日"])).days < 1 or e["ep"] not in views: continue
        base = statistics.median(standard_pool) if standard_pool else None
        v = views[e["ep"]]
        if not base:
            e["状態"], e["結果"], e["採用"] = "評価済み", f"再生 {int(v)}（比べる標準の回がまだない）", "様子見"
        else:
            r = v / base - 1
            word = "良い" if r >= MIN_GAIN else "悪い" if r <= -MIN_GAIN else "同じ"
            e["状態"], e["結果"] = "評価済み", f"再生 {int(v)}（標準の中央値 {int(base)}・{r:+.0%}）：{word}。本数が少ないので参考値"
            e["採用"] = {"良い": "標準にする", "悪い": "戻す", "同じ": "様子見"}[word]
        changed = True
    return changed


def next_variable(exps):
    """次に試す変数。評価が「戻す」だった変数は後回しにし、まだ試していない・いちばん昔に試した変数を先に"""
    last, bad = {}, set()
    for e in exps:
        last[e["変数"]] = e["投稿日"]
        if e["採用"] == "戻す": bad.add(e["変数"])
    return sorted(VARIABLES, key=lambda v: (v in bad, last.get(v, "")))[0]


def assign(p, var, standards, defaults, posted_slots):
    """予定表の回 p に、変数 var を1つだけ変えた設定を入れる。(標準, 試す値, 理由) を返す。入れられなければ None"""
    if var == "thumb_variant":
        std = standards.get("thumb_variant", "A"); new = "B" if std == "A" else "A"
        p.setdefault("thumb", {})["variant"] = new
        return std, new, "サムネの文字の位置（上と下）を変えて、プロフィール一覧からの見られ方を比べる"
    if var == "tag_set":
        std = standards.get("tag_set", p.get("tag_set", "A")); new = "B" if std == "A" else "A"
        p["tag_set"] = new
        return std, new, "ハッシュタグの組み合わせを変えて、見つかり方を比べる"
    if var == "cta":
        used = len([1 for _ in posted_slots.get("cta", [])])
        new = CTAS[used % len(CTAS)]
        p["cta"] = new
        return standards.get("cta", "なし"), new, "最後の一言を足して、送る・保存する人が増えるか比べる"
    if var == "slot":
        std = p["slot"]
        pool = [s for s in SLOTS if s != std]
        new = pool[len(posted_slots.get("slot", [])) % len(pool)]
        p["slot"] = new
        return std, new, "投稿時刻を変えて、最初の数時間の伸びを比べる"
    return None


def main(argv):
    today = dt.datetime.now(JST).date()
    if "--date" in argv: today = dt.date.fromisoformat(argv[argv.index("--date") + 1])
    sch_f, posted_f = ROOT / "auto" / "schedule.json", ROOT / "auto" / "posted.json"
    sch = json.loads(sch_f.read_text(encoding="utf-8"))
    posted = json.loads(posted_f.read_text(encoding="utf-8")) if posted_f.exists() else {}
    metrics = read_csv(ROOT / "content" / "metrics.csv")
    followers_rows = read_csv(ROOT / "content" / "followers.csv")
    exp_f = ROOT / "content" / "experiments.csv"
    exps = read_csv(exp_f)
    std_f = ROOT / "content" / "standards.json"
    standards = json.loads(std_f.read_text(encoding="utf-8")) if std_f.exists() else {}
    goal_f = ROOT / "content" / "goal.json"
    goal = json.loads(goal_f.read_text(encoding="utf-8")) if goal_f.exists() else dict(GOAL)
    problems, notes, changed_files = [], [], []

    # 1. 評価
    views = latest_views(metrics)
    if evaluate(exps, posted, views, today):
        for e in exps:
            if e["採用"] == "標準にする": standards[e["変数"]] = e["試す値"]
        std_f.write_text(json.dumps(standards, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"); changed_files.append("content/standards.json")
        notes.append("打ち手の結果を評価した")

    # 2. 次の投稿に1つだけ割り当てる
    posts = sorted(sch["posts"], key=lambda p: (p["date"], p["slot"]))
    future = [p for p in posts if p["date"] > today.isoformat() and f'{p["date"]}_{p["ep"]}' not in posted]
    target = next((p for p in future if "experiment" not in p), None)
    next_try = None
    if target:
        var = next_variable(exps)
        by_var = {}
        for e in exps: by_var.setdefault(e["変数"], []).append(e)
        res = assign(target, var, standards, sch["defaults"], by_var)
        if res:
            std, new, why = res
            target["experiment"] = {"var": var, "std": std, "value": new, "why": why}
            exps.append({"投稿日": target["date"], "ep": target["ep"], "変数": var, "標準": std, "試す値": new, "理由": why, "状態": "予定", "結果": "", "採用": ""})
            sch_f.write_text(json.dumps(sch, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"); changed_files.append("auto/schedule.json")
            notes.append(f'{target["date"]}「{target["title"]}」で {var} を試す')
    cur = next((p for p in future if "experiment" in p), None) or target
    if cur and "experiment" in cur:
        x = cur["experiment"]; next_try = f'{cur["date"][5:].replace("-", "/")}「{cur["title"]}」で {x["var"]}：{x["std"]}→{x["value"]}'
    if changed_files:
        write_csv(exp_f, EXP_HEADER, [[e[h] for h in EXP_HEADER] for e in exps]); changed_files.append("content/experiments.csv")

    # 3. 目標との差
    fol = ig_followers(followers_rows)
    hist = [(dt.date.fromisoformat(r["計測日"]), int(num(r["ig"]))) for r in followers_rows if num(r.get("ig")) is not None]
    gs = goal_status(fol, today, goal, hist)
    if gs["raised"]:
        goal["target"] = gs["raised"]; goal_f.write_text(json.dumps(goal, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        changed_files.append("content/goal.json"); notes.append(f'目標を {gs["raised"]} 人に引き上げた（届きそうなため）')
    avg = statistics.mean(views.values()) if views else None

    # 4. 止まっていないかの点検
    s = stalled_metrics(metrics, today)
    if s: problems.append({"kind": "metrics-stalled", "text": f"数字が2日以上取れていない：{s}", "fix": "metrics を動かし直す"})
    for sns, name in (("ig", "Instagram"), ("facebook", "Facebook")):
        n = blank_streak(metrics, sns, today)
        if n >= 2: problems.append({"kind": f"{sns}-blank", "text": f"{name} の再生が {n} 日続けて空欄", "fix": "取り方を直す"})
    recent = [p for p in posts if (today - dt.date.fromisoformat(p["date"])).days in range(0, 4) and f'{p["date"]}_{p["ep"]}' in posted]
    for p in recent:
        if p["date"] >= GOAL_START and "experiment" not in p and not any(e["ep"] == p["ep"] for e in exps):
            problems.append({"kind": "no-experiment", "text": f'「{p["title"]}」は打ち手の記録がないまま投稿された', "fix": "次の回から割り当てる"})
    last_date = max((dt.date.fromisoformat(p["date"]) for p in posts), default=today)
    left = (last_date - today).days
    if left < SCHEDULE_MIN_DAYS: problems.append({"kind": "schedule-short", "text": f"予定表があと {left} 日分しかない（最後は {last_date}）", "fix": "週次PDCAのネタ作りで埋める"})

    # 記録（毎日1行。数字が変わらない日は同じ内容が並ぶだけ）
    log_f = ROOT / "content" / "daily_log.csv"
    rows = read_csv(log_f)
    prev_kinds = set((rows[-1]["問題"] if rows else "").split("；"))
    for pr in problems: pr["new"] = pr["kind"] not in prev_kinds  # 依頼は「きのうまでなかった問題」だけ出す（毎日同じ依頼を出さない）
    line = [today.isoformat(), fol if fol is not None else "", gs["target"], gs["gap"] if gs["gap"] is not None else "", int(avg) if avg else "", next_try or "", "；".join(p["kind"] for p in problems)]
    if not any(r["日付"] == today.isoformat() for r in rows):
        rows_out = [[r[h] for h in ("日付", "IGフォロワー", "目標", "差", "平均再生", "次に試すこと", "問題")] for r in rows] + [line]
        write_csv(log_f, ["日付", "IGフォロワー", "目標", "差", "平均再生", "次に試すこと", "問題"], rows_out); changed_files.append("content/daily_log.csv")

    (ROOT / "dist").mkdir(exist_ok=True)
    (ROOT / "dist" / "daily_problems.json").write_text(json.dumps(problems, ensure_ascii=False, indent=1), encoding="utf-8")
    hub = ["--kpi", f'目標との差=Instagram フォロワー {fol if fol is not None else "不明"}/{gs["target"]}（{goal["due"][5:].replace("-", "/")}まで）']
    if avg: hub += ["--kpi", f'平均再生={int(avg)}/{goal["avg_views_target"]}']
    hub += ["--kpi", f'次の投稿で試すこと={next_try or "割り当てなし（予定表に未投稿の回がない）"}']
    hub += ["--kpi", f"止まっているもの={len(problems)}"]
    (ROOT / "dist" / "daily_hub_args").write_bytes(b"\0".join(x.encode() for x in hub) + b"\0")
    print("[daily] " + ("；".join(notes) or "変更なし（記録だけ）"), "| 問題:", [p["kind"] for p in problems] or "なし")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
