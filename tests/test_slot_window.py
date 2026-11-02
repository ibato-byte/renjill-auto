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
        self.assertTrue(post.in_window(p, at(21, 10), catchup=True))  # 定時実行が来なかった日は、その日のうちに拾う（依頼 #175）
        self.assertFalse(post.in_window(p, at(17, 0), catchup=True))  # 早出しはしない


if __name__ == "__main__":
    unittest.main()
