#!/usr/bin/env python3
"""文字と動画の絵の食い違い検査（Hub 依頼 #113：動画の時計は 18:00 なのに TikTok・YouTube の題名が「5pm」だった）。

  python auto/textcheck.py            … schedule.json の今日以降の回を全部検査。食い違いがあれば終了コード 2

- 動画の時計：rig/ep/<ep>.js の `clock: [時, 分]` の時（と先頭のコメントにある HH:MM）
- 投稿の文字：題名・caption_en・caption_ja・サムネの文字・コメント誘導文に出てくる時刻
  （5pm / 5 PM / 17:00 / 午後5時 / 5時）。動画に出てこない時刻が書かれていたら不合格
- 動画の時計が読み取れない回（時を計算で出している回）は、文字に時刻があれば「確認できない」として止める
  （schedule の回に "shows_time": ["18:00"] を書けば、それを動画の時刻として使う）
"""
import datetime as dt, json, pathlib, re, sys

AUTO = pathlib.Path(__file__).resolve().parent
RIG_EP = AUTO.parent / "rig" / "ep"
JST = dt.timezone(dt.timedelta(hours=9))
FIELDS = ("title", "caption_en", "caption_ja", "fb_cta")

_AMPM = re.compile(r"(?<![\d:])(\d{1,2})(?::(\d{2}))?\s?([ap])\.?m\b", re.I)
_HHMM = re.compile(r"(?<![\d:.])([01]?\d|2[0-3]):([0-5]\d)(?![\d:])")
_JA = re.compile(r"(午前|午後)?\s?(\d{1,2})時")


def video_hours(ep, p=None):
    """動画に出る時計の「時」（24時間表記）の集合。読み取れなければ None"""
    if p and p.get("shows_time"):
        return {int(t.split(":")[0]) for t in p["shows_time"]}
    f = RIG_EP / f"{ep}.js"
    if not f.exists(): return None
    src = f.read_text(encoding="utf-8")
    hs = {int(h) for h in re.findall(r"clock:\s*\[\s*(\d{1,2})\s*,", src)}
    head = "\n".join(src.splitlines()[:4])
    hs |= {int(h) for h, _ in _HHMM.findall(head)}
    return hs or None


def times_in(text):
    """文字に出てくる時刻 [(表記, 時(24h))]"""
    out = []
    for m in _AMPM.finditer(text):
        h = int(m.group(1)) % 12 + (12 if m.group(3).lower() == "p" else 0)
        out.append((m.group(0), h))
    spans = [m.span() for m in _AMPM.finditer(text)]
    for m in _HHMM.finditer(text):
        if not any(a <= m.start() < b for a, b in spans): out.append((m.group(0), int(m.group(1))))
    for m in _JA.finditer(text):
        h = int(m.group(2))
        if m.group(1) == "午後" and h < 12: h += 12
        elif m.group(1) == "午前": h %= 12
        elif h <= 12 and not m.group(1): h = None  # 午前午後がない「5時」は 5 時とも 17 時とも読める
        out.append((m.group(0), h if h is not None else -int(m.group(2))))
    return out


def texts_of(p):
    t = {k: p[k] for k in FIELDS if p.get(k)}
    if p.get("thumb", {}).get("hook"): t["サムネの文字"] = p["thumb"]["hook"]
    return t


_FILENAME_TAIL = re.compile(r"(\d{8}_[A-Za-z0-9_]+|[\w\-]+\.(?:mp4|jpg|jpeg|png|mov))\s*$")


def caption_tail_problem(text):
    """説明文の末尾にファイル名（20261102_update99 など）が残っていれば、その説明（なければ空）。Hub 依頼 #178"""
    m = _FILENAME_TAIL.search((text or "").rstrip())
    return f"ファイル名「{m.group(1)}」が残っている" if m else ""


def check(p):
    """この回の食い違い（文字列のリスト）。なければ空"""
    ep, issues, hs = p["ep"], [], video_hours(p["ep"], p)
    for field, text in texts_of(p).items():  # 説明文の末尾のファイル名（Hub 依頼 #178）
        bad = caption_tail_problem(text)
        if bad: issues.append(f"{ep}：{field}の末尾に{bad}")
    for field, text in texts_of(p).items():
        for shown, h in times_in(text):
            if hs is None:
                issues.append(f"{ep}：{field}に時刻「{shown}」があるが、動画の時計を読み取れず確認できない")
            elif h < 0:  # 午前午後なしの「N時」
                if (-h) not in hs and (-h + 12) not in hs:
                    issues.append(f"{ep}：{field}の「{shown}」が動画の時計（{'・'.join(f'{x}時台' for x in sorted(hs))}）と合わない")
            elif h not in hs:
                issues.append(f"{ep}：{field}の「{shown}」が動画の時計（{'・'.join(f'{x}時台' for x in sorted(hs))}）と合わない")
    return issues


def main():
    sch = json.loads((AUTO / "schedule.json").read_text())
    today = dt.datetime.now(JST).date().isoformat()
    bad = [i for p in sch["posts"] if p["date"] >= today for i in check(p)]
    print("文字と動画の食い違い：" + (f"{len(bad)}件" if bad else "なし"))
    for b in bad: print(" -", b)
    return 2 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
