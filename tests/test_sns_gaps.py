"""3つの SNS の漏れの見つけ方（2026-11-22：エレベーターの話から TikTok に出ていなかった）"""
import sys, pathlib, unittest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "auto"))
import sns_gaps


class Gaps(unittest.TestCase):
    def test_tt_manual_is_not_posted(self):
        g = sns_gaps.gaps({"2026-11-19_elevator": {"title": "x", "ig": "1", "yt": "a", "tt": "manual"}})
        self.assertEqual(g, [("2026-11-19_elevator", "x", ["TikTok"])])

    def test_all_three_ok(self):
        self.assertEqual(sns_gaps.gaps({"k": {"ig": "1", "yt": "a", "tt_ok": "確認"}}), [])

    def test_promo_skipped(self):
        self.assertEqual(sns_gaps.gaps({"k": {"promo": 1}}), [])


if __name__ == "__main__":
    unittest.main()
