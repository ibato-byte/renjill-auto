"""予定時刻より早く出さない（Hub 依頼 #90：19:00 の回が 18:20 の実行で出た）。"""
import datetime as dt
import os
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "auto"))
import post  # noqa: E402


def at(h, m):
    return dt.datetime(2026, 10, 25, h, m, tzinfo=post.JST)


class WindowTest(unittest.TestCase):
    def test_window(self):
        p = {"slot": "19:00"}
        self.assertFalse(post.in_window(p, at(18, 20)))  # 18:00 の cron の遅れた実行では出さない
        self.assertTrue(post.in_window(p, at(18, 55)))
        self.assertTrue(post.in_window(p, at(19, 20)))   # 19:00 の cron の遅れた実行は出す
        self.assertTrue(post.in_window(p, at(20, 59)))
        self.assertFalse(post.in_window(p, at(21, 10)))


class SlotOverrideTest(unittest.TestCase):  # Hub 依頼 #141：12:00 の起動で 18:00 の回が出ていた（11/11〜11/13）
    def test_slot_override_only_picks_that_slot(self):
        import json, tempfile, pathlib
        d = pathlib.Path(tempfile.mkdtemp())
        sch = {"defaults": {"platforms": ["ig"]}, "posts": [{"date": "2026-11-13", "slot": "18:00", "ep": "teiji"}]}
        (d / "schedule.json").write_text(json.dumps(sch)); (d / "posted.json").write_text("{}")
        old = post.AUTO; post.AUTO = d
        try:
            now = dt.datetime(2026, 11, 13, 12, 0, tzinfo=post.JST)
            self.assertEqual(post.pick_posts("12:00", now)[2], [])
            self.assertEqual([k for k, _, _ in post.pick_posts("18:00", now)[2]], ["2026-11-13_teiji"])
        finally:
            post.AUTO = old

    def test_same_slot(self):
        self.assertTrue(post.same_slot("18:00", "18:0")); self.assertFalse(post.same_slot("18:00", "12:00"))


if __name__ == "__main__":
    unittest.main()
