"""行のとちゅうの「//」のあとに、絵の命令が続いていないか（2026-11-17）。

寝る姿を作る時、説明（// …）を 1 行の途中に書き足して、その後ろの命令（かげ・大きさ）が
消えていたことが 2 回あった。rig の JS で、// のあとに E( P( G( line( などが続く行を見つける。
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
CALL = re.compile(r"\b(E|P|G|el|line|frontPaw|hindFoot|haunch|hindSole|splootPaws|splootBody|flopBody|bowBody)\(")
# 説明の中で、開いていないかっこを閉じている形も（2026-11-17：ほおの毛の説明のあとに「]) : null,」が入り、絵が出なくなりかけた）


def net_close(tail: str) -> int:
    t = re.sub(r"[^\x00-\x7f]+", " ", tail)
    return sum(t.count(c) for c in ")]}") - sum(t.count(c) for c in "([{")


def strip_strings(code: str) -> str:
    return re.sub(r"'[^']*'|\"[^\"]*\"|`[^`]*`", "''", code)


def bad_lines(text: str):
    out = []
    for n, line in enumerate(text.splitlines(), 1):
        code = strip_strings(line)
        i = code.find("// ")
        if i <= 0 or "://" in code[max(0, i - 1):i + 2]:
            continue
        tail = code[i:]
        if CALL.search(tail) or net_close(tail) > 0:
            out.append((n, line.strip()[:80]))
    return out


def test_no_code_after_inline_comment():
    files = [ROOT / "rig" / "rig.js", ROOT / "rig" / "portraits.js", *sorted((ROOT / "rig" / "ep").glob("*.js"))]
    found = []
    for f in files:
        if f.exists():
            found += [(f.name, n, l) for n, l in bad_lines(f.read_text(encoding="utf-8"))]
    assert not found, "説明（//）のあとに命令が続いている行：" + "; ".join(f"{a}:{b} {c}" for a, b, c in found[:5])


def test_detects_the_mistake():
    sample = "      paw(1, 2), paw(3, 4), // 前足 E(182, 384, 62, 6, '#5A4030')]);"
    assert bad_lines(sample)


def test_detects_closing_after_comment():
    sample = "      ...(p.pose === 'sploot' ? [E(1, 2, 3, 4, 'x')] : [])   // ほおの毛（説明）]) : null,"
    assert bad_lines(sample)
