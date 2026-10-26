"""文字の時刻が動画の時計と違う回を止める（Hub 依頼 #113：動画は 18:00 なのに題名が 5pm だった）。"""
import os, sys, unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "auto"))
import textcheck  # noqa: E402


class TextCheckTest(unittest.TestCase):
    def test_5pm_with_6pm_clock_is_ng(self):
        p = {"ep": "chime2", "title": "定時のチャイム", "caption_en": "5pm chime.", "thumb": {"hook": "IT'S 5 PM!/定時"}}
        self.assertEqual(len(textcheck.check(p)), 2)

    def test_6pm_is_ok(self):
        p = {"ep": "chime2", "caption_en": "6pm chime.", "caption_ja": "午後6時のチャイム", "thumb": {"hook": "IT'S 6 PM!/定時"}}
        self.assertEqual(textcheck.check(p), [])

    def test_no_time_in_text_is_ok(self):
        self.assertEqual(textcheck.check({"ep": "deadline2", "caption_en": "Deadline? No."}), [])

    def test_declared_time(self):
        p = {"ep": "deadline2", "caption_en": "It is 9:30 am", "shows_time": ["9:30"]}
        self.assertEqual(textcheck.check(p), [])
        self.assertEqual(len(textcheck.check(dict(p, shows_time=["10:00"]))), 1)

    def test_schedule_is_clean(self):
        import json
        sch = json.load(open(os.path.join(ROOT, "auto", "schedule.json")))
        self.assertEqual([i for p in sch["posts"] for i in textcheck.check(p)], [])


if __name__ == "__main__":
    unittest.main()
