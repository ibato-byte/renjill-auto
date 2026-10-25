#!/usr/bin/env python3
"""投稿の2日前までに、予定されている回を全部レンダリングしてQAにかける。
NGがあれば終了コード2（Actionsが失敗→GitHubからメール通知、Issueも作る）。"""
import datetime as dt, json, pathlib, subprocess, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from post import render, qa_gate, thumbnail, AUTO, JST
sch = json.loads((AUTO / "schedule.json").read_text())
today = dt.datetime.now(JST).date(); bad = []
for p in sch["posts"]:
    d = dt.date.fromisoformat(p["date"])
    if not (0 <= (d - today).days <= 3): continue
    try:
        yt, loop = render(p["ep"])
        if not qa_gate(p["ep"], yt, loop): bad.append(p["ep"])
        thumbnail(p)  # グリッドで文字が切れないかも事前に確認
    except Exception as e:
        print("render NG", p["ep"], repr(e)[:300]); bad.append(p["ep"])
print("NG:", bad) if bad else print("all pass")
sys.exit(2 if bad else 0)
