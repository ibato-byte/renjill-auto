"""台本の決まりの検査（auto/epcheck.py）のテスト（総見直し 2026-11-10）"""
import datetime as dt, json, pathlib, sys, unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto"))
import epcheck


class Parse(unittest.TestCase):
    def test_captions(self):
        src = "x = CHIP(L, 'A B', 'あ', 1380, k) + CHIP(L, \"BOSS'S\", 'い', 1380, k)"
        self.assertEqual(epcheck.captions(src), [("A B", "あ"), ("BOSS'S", "い")])

    def test_chip_off_not_counted(self):
        self.assertEqual(epcheck.captions("CHIP_OFF(L, 'X', 'y', 1, 1)"), [])


class Upcoming(unittest.TestCase):
    def test_next_14_days_have_no_issues(self):
        posts = json.loads((ROOT / "auto/schedule.json").read_text())["posts"]
        today = dt.datetime.now(epcheck.JST).date()
        r = epcheck.check(posts, today, 14)
        self.assertEqual(r["issues"], [], "\n".join(r["issues"]))


class Lib(unittest.TestCase):
    def test_motion_parts_exist(self):
        lib = (ROOT / "rig/v2/lib.js").read_text()
        for name in ("L.anticip", "L.land", "L.startle", "L.droop", "L.binky", "L.runIn", "L.twitch", "L.footShadow"):
            self.assertIn(name + " =", lib)
