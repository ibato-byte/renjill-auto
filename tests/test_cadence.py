import pathlib, sys, unittest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "auto"))
import cadence


class DecideTest(unittest.TestCase):
    def test_not_enough_data_stays_stage1(self):
        self.assertEqual(cadence.decide([])[0], 1)
        self.assertEqual(cadence.decide([("a_x", 0.30)])[0], 1)

    def test_two_in_a_row_goes_daily(self):
        s, per, _ = cadence.decide([("a_x", 0.15), ("b_y", 0.25), ("c_z", 0.30)])
        self.assertEqual((s, per), (2, 7))

    def test_one_low_in_between_does_not(self):
        self.assertEqual(cadence.decide([("a_x", 0.30), ("b_y", 0.18)])[0], 1)

    def test_just_below_threshold(self):
        self.assertEqual(cadence.decide([("a_x", 0.20), ("b_y", 0.20)])[0], 1)  # 基準0.16×1.3＝0.208 に届かない

    def test_falls_back_when_quality_drops(self):
        self.assertEqual(cadence.decide([("a_x", 0.30), ("b_y", 0.12), ("c_z", 0.14)], prev_stage=2)[0], 1)

    def test_stays_daily_through_one_dip(self):
        self.assertEqual(cadence.decide([("a_x", 0.30), ("b_y", 0.30), ("c_z", 0.14)], prev_stage=2)[0], 2)

    def test_old_style_episodes_are_not_counted(self):
        eps = cadence.new_style_eps()
        self.assertIn("meeting2", eps); self.assertNotIn("papers2", eps)
        rows = cadence.ratios([{"対象": "reel", "指標": "avg_watch_ratio", "ref": "2026-10-21_papers2", "値": "0.9", "計測日": "2026-10-25"}],
                              {"2026-10-21_papers2": {}}, eps)
        self.assertEqual(rows, [])


if __name__ == "__main__":
    unittest.main()
