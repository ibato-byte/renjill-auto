#!/usr/bin/env python3
"""絵コンテ（docs/series/*.md）の点検。動画を作る前に、絵コンテの段階で直せることを見つける。

2026-11-28 総見直し（OVERHAUL 7・28・67・74）。OK 待ちの絵コンテに対して、オーナーに見せる前・OK 後の
台本づくりの前に使う。結果は「警告」だけ（投稿は止めない。直すかどうかは絵と数字で決める）。

見ること（1話ずつ）：
- 尺：7〜30 秒（連載は 7〜21 秒が目安、オーナーの回は 30 秒前後もある）
- 冒頭3秒（28）：最初の場面が 0 秒から始まり、3 秒以内に1つめの場面が終わるか次に移る
- オチの後のオチ（7）：「小さなオチ」の場面のあとに、締めテロップ以外の場面がもう1つある
- 集中線（67）：1話に2回以上なら警告
- 退場で消える（74）：「消える／フェードアウト」でキャラが退場していないか（走って画面の外へ）
- 腕（元のデザインに腕はない）：「両前足で挟む・抱きしめる・手で」など、腕を描き足さないとできない動き
- 第2・3話は最初の場面が「前回」の絵から
- 締めにフォローのテロップがある
使い方：python3 auto/sbcheck.py [ファイル …]（なしなら docs/series/ のうち「オーナーのOK：未」のもの）
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SERIES = ROOT / "docs" / "series"

PART_RE = re.compile(r"^##\s.*?(?:Part\s*([123])|第([123１２３])話)")
SEG_RE = re.compile(r"^-\s*([0-9]+(?:\.[0-9]+)?)\s*〜\s*([0-9]+(?:\.[0-9]+)?)\s*秒[：:](.*)")
ZEN = {"１": "1", "２": "2", "３": "3"}
VANISH = re.compile(r"(消え|フェードアウト|すっと消|パッと消|ぱっと消)")
ARMS = re.compile(r"(両前足|前足で(?:挟|はさ|抱|つか|持)|抱きしめ|抱きかか|手で|手を(?:ふ|振|上げ|あげ)|腕を)")
NO_ARMS_NOTE = re.compile(r"腕(は|を)?(描かない|描き足さない|なし)")


def parts(text):
    """{話の番号: [(開始, 終了, 本文), …]}"""
    out, cur = {}, None
    for line in text.splitlines():
        m = PART_RE.match(line)
        if m:
            cur = int(ZEN.get(m.group(1) or m.group(2), m.group(1) or m.group(2)))
            out.setdefault(cur, [])
            continue
        if line.startswith("## "):
            cur = None
            continue
        s = SEG_RE.match(line.strip())
        if cur is not None and s:
            out[cur].append((float(s.group(1)), float(s.group(2)), s.group(3).strip()))
    return out


def check_part(n, segs):
    w = []
    if not segs:
        return [f"第{n}話：秒ごとの流れ（「0〜3秒：…」の行）がない"]
    total = segs[-1][1]
    if not 7 <= total <= 30:
        w.append(f"第{n}話：尺 {total:g} 秒（7〜30 秒の外）")
    if segs[0][0] != 0:
        w.append(f"第{n}話：最初の場面が 0 秒から始まっていない")
    if segs[0][1] > 5:
        w.append(f"第{n}話：最初の場面が {segs[0][1]:g} 秒まで続く（冒頭3秒で状況が分かるよう、最初の場面を短く）")
    body = [t for _, _, t in segs]
    last = body[-1]
    if "フォロー" not in last and "Follow" not in last:
        w.append(f"第{n}話：最後の場面にフォローのテロップがない")
    if n >= 2 and "前回" not in body[0]:
        w.append(f"第{n}話：最初の場面が「前回」の絵から始まっていない")
    ochi = [i for i, t in enumerate(body) if "小さなオチ" in t or "この話のオチ" in t]
    if not ochi:
        w.append(f"第{n}話：「小さなオチ」の場面が書かれていない")
    elif ochi[-1] >= len(body) - 2:
        w.append(f"第{n}話：オチのすぐ後が締め（オチの後のオチ 0.5 秒の場面がない）")
    joined = "\n".join(body)
    if joined.count("集中線") >= 2:
        w.append(f"第{n}話：集中線が {joined.count('集中線')} 回（大事な1回だけ）")
    for i, t in enumerate(body):
        if VANISH.search(t) and not re.search(r"(明かり|ランプ|光|電気|テロップ|文字|字幕)", t):
            w.append(f"第{n}話 {segs[i][0]:g}秒〜：「消える」退場（走って画面の外へ出す）")
        a = ARMS.search(t)
        if a and not NO_ARMS_NOTE.search(t):
            w.append(f"第{n}話 {segs[i][0]:g}秒〜：「{a.group(1)}」は腕を描き足さないとできない動き（口でくわえる・頭で押す・体で寄せるに）")
    return w


def check_text(text):
    ps = parts(text)
    w = []
    for n in (1, 2, 3):
        if n not in ps:
            w.append(f"第{n}話の見出しがない")
            continue
        w += check_part(n, ps[n])
    return w


def targets():
    out = []
    for f in sorted(SERIES.glob("2*.md")):
        head = f.read_text(encoding="utf-8")[:400]
        first = head.splitlines()[0] if head else ""
        if "オーナーのOK：未" in head and not re.search(r"(使わない|取りやめ)", first):
            out.append(f)
    return out


def main(argv):
    files = [pathlib.Path(a) for a in argv] or targets()
    total = 0
    for f in files:
        w = check_text(f.read_text(encoding="utf-8"))
        total += len(w)
        print(f"[sbcheck] {f.name}：警告 {len(w)}")
        for x in w:
            print("  WARN", x)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
