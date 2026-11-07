#!/usr/bin/env python3
"""投稿の2日前までに、予定されている回を全部レンダリングしてQAにかける。
NGがあれば終了コード2（Actionsが失敗→GitHubからメール通知、Issueも作る）。"""
import datetime as dt, json, os, pathlib, subprocess, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from post import render, qa_gate, thumbnail, AUTO, JST
import textcheck
import covercheck
sch = json.loads((AUTO / "schedule.json").read_text())
today = dt.datetime.now(JST).date(); bad = []
DAYS = int(os.environ.get('PREFLIGHT_DAYS', '3'))  # 何日先まで見るか。新作の PR（main 以外への push）では 14 日先まで（投稿の3日前に初めて落ちるのを防ぐ。2026-11-08）
for p in sch["posts"]:
    d = dt.date.fromisoformat(p["date"])
    if not (0 <= (d - today).days <= DAYS): continue
    for msg in textcheck.check(p):  # 文字の時刻が動画の時計と違う回は出さない（Hub 依頼 #113）
        print("text NG", msg); bad.append(p["ep"])
    try:
        yt, loop = render(p["ep"])
        if not qa_gate(p["ep"], yt, loop): bad.append(p["ep"])
        th = thumbnail(p)  # グリッドで文字が切れないかも事前に確認
        probs, _ = covercheck.check(p, f'{p["date"]}_{p["ep"]}', json.loads((AUTO / "posted.json").read_text()), yt, loop, th)  # 表紙の型（Hub 依頼 #124）
        for _, m in probs: print("cover NG", p["ep"], m); bad.append(p["ep"])
    except Exception as e:
        print("render NG", p["ep"], repr(e)[:300]); bad.append(p["ep"])
print("NG:", bad) if bad else print("all pass")
sys.exit(2 if bad else 0)
