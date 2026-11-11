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


class Arms(unittest.TestCase):
    """腕を描かない（2026-11-11：最後の1枚を口でくわえる形に作り直した。1回の失敗を2度起こさない）"""
    def test_limb_detected(self):
        self.assertTrue(epcheck.uses_limb("  limb(f, 'ren', hand, {});"))
        self.assertFalse(epcheck.uses_limb("// limb() は使わない"))
        self.assertFalse(epcheck.uses_limb("const x = L.limbo(1);"))

    def test_upcoming_limb_is_issue(self):
        today = dt.date(2026, 11, 11)
        r = epcheck.check([{"date": "2026-11-12", "slot": "18:00", "ep": "replyall"}], today, 14, pc={}, lk={})
        self.assertTrue(any("腕" in x for x in r["issues"]))

    def test_lastsheet_has_no_arms(self):
        self.assertFalse(epcheck.uses_limb((ROOT / "rig/ep/lastsheet.js").read_text()))


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
