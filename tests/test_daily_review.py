"""毎日の軽い振り返り（auto/daily_review.py）と、取りこぼしの数字（auto/insights.py）のテスト（Hub 依頼 #95）"""
import datetime as dt, pathlib, sys, unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "auto"))
import daily_review as dr
import insights


def post(date, ep, slot="12:00", **kw):
    return dict({"date": date, "slot": slot, "ep": ep, "no": 1, "title": ep, "caption_en": "e", "caption_ja": "j", "tag_set": "A"}, **kw)


class Assign(unittest.TestCase):
    def test_one_variable_each(self):
        p = post("2026-11-01", "a")
        std, new, _ = dr.assign(p, "thumb_variant", {}, {}, {})
        self.assertEqual((std, new, p["thumb"]["variant"]), ("A", "B", "B"))
        p = post("2026-11-01", "a"); dr.assign(p, "tag_set", {}, {}, {})
        self.assertEqual(p["tag_set"], "B")
        p = post("2026-11-01", "a", slot="12:00"); dr.assign(p, "slot", {}, {}, {})
        self.assertIn(p["slot"], ("18:00", "19:00"))
        p = post("2026-11-01", "a"); dr.assign(p, "cta", {}, {}, {}); self.assertIn("/", p["cta"])

    def test_next_variable_skips_bad(self):
        exps = [{"変数": "thumb_variant", "投稿日": "2026-10-20", "採用": "戻す"}, {"変数": "tag_set", "投稿日": "2026-10-22", "採用": "様子見"}]
        self.assertEqual(dr.next_variable(exps), "cta")
        self.assertEqual(dr.next_variable([]), "thumb_variant")  # 同点は VARIABLES の順


class Evaluate(unittest.TestCase):
    def test_good_and_bad(self):
        posted = {"2026-10-20_x": {}, "2026-10-21_y": {}}
        views = {"x": 200.0, "y": 70.0, "base1": 100.0, "base2": 100.0}
        exps = [{"投稿日": "2026-10-20", "ep": "x", "変数": "cta", "標準": "なし", "試す値": "v", "理由": "", "状態": "予定", "結果": "", "採用": ""},
                {"投稿日": "2026-10-21", "ep": "y", "変数": "slot", "標準": "12:00", "試す値": "18:00", "理由": "", "状態": "予定", "結果": "", "採用": ""}]
        self.assertTrue(dr.evaluate(exps, posted, views, dt.date(2026, 10, 25)))
        self.assertEqual((exps[0]["採用"], exps[1]["採用"]), ("標準にする", "戻す"))

    def test_not_yet(self):
        exps = [{"投稿日": "2026-10-25", "ep": "x", "変数": "cta", "標準": "", "試す値": "", "理由": "", "状態": "予定", "結果": "", "採用": ""}]
        self.assertFalse(dr.evaluate(exps, {"2026-10-25_x": {}}, {"x": 5.0}, dt.date(2026, 10, 25)))
        self.assertEqual(exps[0]["状態"], "予定")


class Checks(unittest.TestCase):
    def test_stalled(self):
        m = [{"計測日": "2026-10-22", "sns": "ig", "再生": "1"}]
        self.assertIn("日前", dr.stalled_metrics(m, dt.date(2026, 10, 25)))
        self.assertIsNone(dr.stalled_metrics(m, dt.date(2026, 10, 23)))

    def test_blank_streak(self):
        m = [{"計測日": d, "sns": "facebook", "再生": ""} for d in ("2026-10-24", "2026-10-25")] + [{"計測日": "2026-10-23", "sns": "facebook", "再生": "9"}]
        self.assertEqual(dr.blank_streak(m, "facebook", dt.date(2026, 10, 25)), 2)

    def test_goal_raise(self):
        today = dt.date(2026, 11, 10)
        g = dr.goal_status(40, today, dict(dr.GOAL), [(dt.date(2026, 10, 25), 3)])
        self.assertGreaterEqual(g["target"], 60); self.assertEqual(g["gap"], g["target"] - 40)
        g = dr.goal_status(3, dt.date(2026, 10, 25), dict(dr.GOAL), [(dt.date(2026, 10, 23), 3)])
        self.assertEqual((g["target"], g["gap"], g["raised"]), (30, 27, None))


class Insights(unittest.TestCase):
    class Http:
        def __init__(self, bad): self.bad = bad
        def get(self, url, params, timeout=30):
            m = params.get("metric")
            class R:
                def json(s):
                    if m in self.bad: return {"error": {"message": "(#100) metric not supported"}}
                    return {"data": [{"name": m, "values": [{"value": 7}]}]}
            return R()

    def test_one_by_one_keeps_others(self):
        r = insights.one_by_one(self.Http({"saved"}), "u", ("reach", "saved"), "t")
        self.assertEqual(r["reach"], (7, "")); self.assertEqual(r["saved"][0], ""); self.assertIn("not supported", r["saved"][1])

    def test_completion_and_append(self):
        self.assertEqual(insights.completion_proxy(6000, 20), 0.3)
        self.assertEqual(insights.completion_proxy("", 20), "")
        import tempfile
        f = pathlib.Path(tempfile.mkdtemp()) / "i.csv"
        rows = [["2026-10-25", "reel", "k", "reach", 1, ""]]
        self.assertEqual(insights.append(f, rows, "2026-10-25"), 1)
        self.assertEqual(insights.append(f, rows, "2026-10-25"), 0)  # 同じ日は重ならない



class FbRows(unittest.TestCase):
    class Http:
        def get(self, url, params, timeout=30):
            class R:
                def json(s):
                    if "video_insights" in url: return {"error": {"message": "(#100) deprecated metric"}}
                    return {"views": 42, "likes": {"summary": {"total_count": 3}}, "comments": {"summary": {"total_count": 1}}}
            return R()

    def test_fallback_and_reason(self):
        rows = insights.fb_rows("2026-10-25", {"k": {"facebook": "123"}}, "t", self.Http())
        d = {r[3]: (r[4], r[5]) for r in rows}
        self.assertEqual(d["plays"][0], 42); self.assertEqual(d["reactions"][0], 3)
        self.assertEqual(d["shares"][0], ""); self.assertIn("deprecated", d["shares"][1])


if __name__ == "__main__":
    unittest.main()
