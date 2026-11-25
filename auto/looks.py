"""部屋の見た目（背景4種類）を投稿日の順に割り当てる（総見直し 2026-11-10・OVERHAUL 56/57/94/179）。

毎話同じ部屋に見えないよう、予定（schedule.json）の日付順に 0→1→2→3 と回し、
前の3話と同じ部屋で始まらないようにする。結果は rig/v2/looks.js（ep.html が読む）。
予定を変えたら `python3 auto/looks.py` を実行する（tests/test_looks.py が古いままを止める）。
"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
N = 4


def is_office(ep):
    """台本が会社の部屋（L.office）を使う回か。台本が読めないときは会社の部屋とみなす"""
    try:
        return "L.office(" in (ROOT / "rig/ep" / f"{ep}.js").read_text(encoding="utf-8")
    except OSError:
        return True


def assign(posts, office=is_office):
    """会社の部屋を使う回だけで 0→1→2→3 と回す。専用のセットの回（エレベーターなど）は数えない
    （2026-11-19 総見直し：エレベーター3話を数えていたため、こたつ第1話が3話前の「月曜の朝」と同じ部屋になった。epcheck は会社の部屋の回どうしで比べる）"""
    seen, out, n = set(), {}, 0
    for p in sorted(posts, key=lambda p: (p.get("date", ""), p.get("slot", ""))):
        ep = p.get("ep")
        if not ep or ep in seen:
            continue
        seen.add(ep)
        out[ep] = p["look"] if p.get("look") is not None else n % N   # 予定表の look で固定できる（日付を動かしても、OKをもらった動画の部屋を変えない。2026-11-25）
        if office(ep) and p.get("look") is None:   # 固定した回は数えない（次の回が固定の部屋と続かないよう、番号を進めない）
            n += 1
    return out


def render(m):
    body = ",\n".join(f"  {json.dumps(k)}: {v}" for k, v in m.items())
    return "// 自動生成（auto/looks.py）。手で直さない。話ごとの部屋の見た目 0〜3（rig/v2/lib.js の LOOKS）\nwindow.LOOK_ALL = {\n" + body + "\n};\n"


def all_posts():
    """予定表の回＋在庫（auto/stock.json。2026-11-16 に週3本へ変えたとき外した回。元の予定日 planned_date の順）"""
    posts = json.loads((ROOT / "auto/schedule.json").read_text())["posts"]
    f = ROOT / "auto/stock.json"
    stock = [dict(p, date=p.get("planned_date", "")) for p in json.loads(f.read_text())["posts"]] if f.exists() else []
    return posts + stock


def main():
    (ROOT / "rig/v2/looks.js").write_text(render(assign(all_posts())))


if __name__ == "__main__":
    main()
