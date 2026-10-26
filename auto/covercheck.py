#!/usr/bin/env python3
"""表紙の「型」がそろっているかの検査（Hub 依頼 #124。#114 の再発防止）。

正しい型：YouTube＝文字なし（動画の冒頭のコマが表紙になる）、Instagram・Facebook・TikTok・Threads＝文字あり（rig/thumb.js の正式な表紙）。
投稿の前に、今回の表紙の型を実物（動画の冒頭のコマ・表紙の画像）から調べ、
  ①正しい型と違う ②その SNS の直近の投稿（posted.json の cover_style）の型と違う
ときは投稿を止めて「あなたの対応」に出す。あわせて「直近の表紙＋今回の表紙」を並べた一覧画像（dist/<回>_covers.jpg）を作る。

  python auto/covercheck.py --sheet   … 直近の表紙の一覧画像 dist/covers_recent.jpg を作る（週次レポート用）
"""
import json, pathlib, subprocess, sys, tempfile

AUTO = pathlib.Path(__file__).resolve().parent
DIST = AUTO.parent / "dist"
LABEL = {"yt": "YouTube", "ig": "Instagram", "facebook": "Facebook", "tt": "TikTok", "threads": "Threads"}
EXPECTED = {"yt": "none", "ig": "text", "facebook": "text", "tt": "text", "threads": "text"}
STYLE_JA = {"none": "文字なし", "text": "文字あり"}
FRAME_T = 0.5  # 冒頭の一言が最も濃く出ている時間（秒）


def frame(video, t, out):
    """動画の t 秒のコマを 270x480 の画像にして out に保存する"""
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(t), "-i", str(video), "-frames:v", "1", "-vf", "scale=270:480", str(out)], check=True)
    return out


def gray(path):
    import numpy as np
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(path), "-vf", "scale=270:480,format=gray", "-f", "rawvideo", "-"])
    return np.frombuffer(raw, dtype=np.uint8).astype(float)


def mean_diff(a, b):
    """2枚の画像の平均の差（0〜255）"""
    import numpy as np
    return float(np.abs(gray(a) - gray(b)).mean())


def yt_style(yt, loop, work):
    """YouTube 用の動画に一言が焼き込まれているか。ループ版（一言あり）の同じコマと比べ、同じなら一言あり"""
    d = mean_diff(frame(yt, FRAME_T, work / "yt.png"), frame(loop, FRAME_T, work / "loop.png"))
    return "text" if d < 1.0 else "none"


def planned_styles(p, yt, loop, thumb, work):
    """今回出す予定の表紙の型 {SNS: 型}。実物から調べる"""
    st = {"yt": yt_style(yt, loop, work)}
    for k in ("ig", "facebook", "tt", "threads"):
        st[k] = "text" if pathlib.Path(thumb).exists() else "none"
    return st


def latest_styles(posted, key):
    """SNS ごとの、直近の投稿（key より前）の cover_style"""
    last = {}
    for k in sorted(posted):
        if k >= key: continue
        for sns, s in (posted[k].get("cover_style") or {}).items(): last[sns] = (k, s)
    return last


def judge(styles, last, only=None):
    """[(SNS, 問題の文)]。only があればその SNS だけ"""
    out = []
    for sns, s in styles.items():
        if only is not None and sns not in only: continue
        if s != EXPECTED[sns]:
            out.append((sns, f'{LABEL[sns]} の表紙が「{STYLE_JA[s]}」になる（正しいのは「{STYLE_JA[EXPECTED[sns]]}」）'))
        elif sns in last and last[sns][1] != s:
            out.append((sns, f'{LABEL[sns]} の直近の投稿（{last[sns][0]}）は「{STYLE_JA[last[sns][1]]}」で、今回だけ「{STYLE_JA[s]}」'))
    return out


def sheet(posted, key, p, yt, loop, thumb, out, work):
    """左から、直近5回の表紙（文字あり）・今回の YouTube（冒頭のコマ）・今回のほかの SNS の表紙 を横に並べた一覧画像"""
    imgs = []
    for k in [k for k in sorted(posted) if k < key][-5:]:
        t = DIST / (k.split("_", 1)[1] + "_thumb.jpg")
        if t.exists(): imgs.append(t)
    imgs.append(frame(yt, FRAME_T, work / "s_yt.png"))
    if pathlib.Path(thumb).exists(): imgs.append(pathlib.Path(thumb))
    cmd = ["ffmpeg", "-y", "-loglevel", "error"]
    for i in imgs: cmd += ["-i", str(i)]
    f = "".join(f"[{n}:v]scale=270:480[s{n}];" for n in range(len(imgs))) + "".join(f"[s{n}]" for n in range(len(imgs))) + f"hstack=inputs={len(imgs)}"
    subprocess.run(cmd + ["-filter_complex", f, "-frames:v", "1", str(out)], check=True)
    return out


def check(p, key, posted, yt, loop, thumb, only=None):
    """問題の一覧（空なら合格）と、記録する cover_style を返す。一覧画像も dist/<回>_covers.jpg に作る"""
    with tempfile.TemporaryDirectory() as td:
        work = pathlib.Path(td)
        styles = planned_styles(p, yt, loop, thumb, work)
        probs = judge(styles, latest_styles(posted, key), only)
        try: sheet(posted, key, p, yt, loop, thumb, DIST / f'{p["ep"]}_covers.jpg', work)
        except Exception as e: print("covers sheet NG", repr(e)[:200])
    return probs, styles


if __name__ == "__main__":
    if "--sheet" in sys.argv:
        posted = json.loads((AUTO / "posted.json").read_text())
        imgs = [DIST / (k.split("_", 1)[1] + "_thumb.jpg") for k in sorted(posted)]
        imgs = [i for i in imgs if i.exists()][-8:]
        cmd = ["ffmpeg", "-y", "-loglevel", "error"]
        for i in imgs: cmd += ["-i", str(i)]
        f = "".join(f"[{n}:v]scale=270:480[s{n}];" for n in range(len(imgs))) + "".join(f"[s{n}]" for n in range(len(imgs))) + f"hstack=inputs={len(imgs)}"
        subprocess.run(cmd + ["-filter_complex", f, "-frames:v", "1", str(DIST / "covers_recent.jpg")], check=True)
        print(DIST / "covers_recent.jpg")
