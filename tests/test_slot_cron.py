"""予定の時間（slot）に、投稿の自動起動（post.yml の cron）が必ずあること。
2026-11-25：8:00 の回を入れたとき、cron は 12:00・18:00・19:00 しかなく、そのままだと出なかった。"""
import json, pathlib, re, datetime as dt
ROOT = pathlib.Path(__file__).resolve().parents[1]


def cron_slots_jst():
    out = set()
    for m in re.finditer(r'cron:\s*"(\d+)\s+(\d+)\s+\*\s+\*\s+\*"', (ROOT / ".github/workflows/post.yml").read_text()):
        mi, h = int(m.group(1)), int(m.group(2))
        out.add(((h + 9) % 24, mi))
    return out


def test_every_upcoming_slot_has_cron():
    slots = cron_slots_jst()
    today = dt.date(2026, 11, 25)
    s = json.loads((ROOT / "auto/schedule.json").read_text())
    for p in s["posts"]:
        if dt.date.fromisoformat(p["date"]) < today: continue
        h, _, mi = p["slot"].partition(":")
        assert (int(h), int(mi or 0)) in slots, f'{p["date"]} {p["slot"]} {p["ep"]} を出す cron が post.yml にない'
