#!/usr/bin/env python3
"""投稿の2日前までに、予定されている回を全部レンダリングしてQAにかける。
NGがあれば終了コード2（Actionsが失敗→GitHubからメール通知、Issueも作る）。"""
import datetime as dt, json, pathlib, subprocess, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from post import render, qa_gate, thumbnail, opening_gate, AUTO, JST
sch = json.loads((AUTO / "schedule.json").read_text())
today = dt.datetime.now(JST).date(); bad = []
for p in sch["posts"]:
    d = dt.date.fromisoformat(p["date"])
    if not (0 <= (d - today).days <= 3): continue
    try:
        yt, loop = render(p["ep"])
        if not qa_gate(p["ep"], yt, loop): bad.append(p["ep"])
        elif not opening_gate(p, loop): bad.append(p["ep"])  # 冒頭の検査（最初の動き・文字の大きさ・長さ。依頼 #97）
        thumbnail(p)  # グリッドで文字が切れないかも事前に確認
    except Exception as e:
        print("render NG", p["ep"], repr(e)[:300]); bad.append(p["ep"])
print("NG:", bad) if bad else print("all pass")
sys.exit(2 if bad else 0)
