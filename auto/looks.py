"""部屋の見た目（背景4種類）を投稿日の順に割り当てる（総見直し 2026-11-10・OVERHAUL 56/57/94/179）。

毎話同じ部屋に見えないよう、予定（schedule.json）の日付順に 0→1→2→3 と回し、
前の3話と同じ部屋で始まらないようにする。結果は rig/v2/looks.js（ep.html が読む）。
予定を変えたら `python3 auto/looks.py` を実行する（tests/test_looks.py が古いままを止める）。
"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
N = 4


def assign(posts):
    seen, out = set(), {}
    for p in sorted(posts, key=lambda p: (p.get("date", ""), p.get("slot", ""))):
        ep = p.get("ep")
        if not ep or ep in seen:
            continue
        seen.add(ep)
        out[ep] = len(out) % N
    return out


def render(m):
    body = ",\n".join(f"  {json.dumps(k)}: {v}" for k, v in m.items())
    return "// 自動生成（auto/looks.py）。手で直さない。話ごとの部屋の見た目 0〜3（rig/v2/lib.js の LOOKS）\nwindow.LOOK_ALL = {\n" + body + "\n};\n"


def main():
    posts = json.loads((ROOT / "auto/schedule.json").read_text())["posts"]
    (ROOT / "rig/v2/looks.js").write_text(render(assign(posts)))


if __name__ == "__main__":
    main()
