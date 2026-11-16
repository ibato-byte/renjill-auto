"""週3本（月・木・土）・3話連載の決まり（2026-11-16 オーナー決定。auto/series.py）"""
import datetime as dt, json, pathlib, sys, unittest
from unittest import mock

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto"))
import series

POL = {"since": "2026-11-17", "series_start": "2026-11-23", "post_weekdays": [0, 3, 5], "parts": 3, "per_week": 3, "schedule_target_days": 7}
TODAY = dt.date(2026, 11, 20)
SRC = {
    "p1": "// 状況：x\n// オチ：y\n次回！フォローして待っててね",
    "p2": "// 前回：耳がボタンを全部押した\n// 状況：x\n次回！フォローして",
    "p3": "// 前回：止まった\nフォローしてね",
}


def post(date, ep, part=None, sid="elv", hook=None, ja="（つづく）", en="(to be continued)"):
    p = {"date": date, "slot": "18:00", "ep": ep, "caption_ja": ja, "caption_en": en,
         "thumb": {"hook": hook if hook is not None else (f"ELEVATOR/上司とエレベーター Part {part}" if part else "X/Y")}}
    if part: p["series"] = {"id": sid, "part": part, "of": 3}
    return p


def run(posts, today=TODAY, src=None):
    return series.check(posts, today, 21, POL, src=(src or SRC).get)


GOOD = [post("2026-11-23", "p1", 1), post("2026-11-26", "p2", 2), post("2026-11-28", "p3", 3, ja="", en="")]


class SeriesTest(unittest.TestCase):
    def test_good_week_passes(self):
        r = run(GOOD)
        self.assertEqual(r["issues"], [], r)

    def test_off_day_is_rejected(self):
        r = run(GOOD + [post("2026-11-24", "p1", 1)])
        self.assertTrue(any("火曜日" in x for x in r["issues"]))

    def test_allowed(self):
        self.assertTrue(series.allowed("2026-11-16", POL))   # since より前は昔のまま
        self.assertFalse(series.allowed("2026-11-17", POL))  # 火曜
        self.assertTrue(series.allowed("2026-11-19", POL))   # 木曜
        self.assertEqual(series.part_for("2026-11-28", POL), 3)

    def test_needs_series_field_and_part_label(self):
        r = run([post("2026-11-23", "p1", None)] + GOOD[1:])
        self.assertTrue(any("series" in x for x in r["issues"]))
        r = run([post("2026-11-23", "p1", 1, hook="ELEVATOR/上司とエレベーター")] + GOOD[1:])
        self.assertTrue(any("Part 1" in x for x in r["issues"]))

    def test_wrong_part_for_weekday(self):
        r = run([post("2026-11-23", "p1", 2)] + GOOD[1:])
        self.assertTrue(any("この日は第1話" in x for x in r["issues"]))

    def test_series_can_start_midweek(self):
        """第1弾は 木11/19・土11/21・月11/23（2026-11-17 オーナー）。series_start から投稿日の順に 1→2→3"""
        pol = dict(POL, series_start="2026-11-19")
        self.assertEqual([series.part_for(d, pol) for d in ("2026-11-19", "2026-11-21", "2026-11-23", "2026-11-26")], [1, 2, 3, 1])
        good = [post("2026-11-19", "p1", 1), post("2026-11-21", "p2", 2), post("2026-11-23", "p3", 3, ja="", en="")]
        r = series.check(good, dt.date(2026, 11, 18), 6, pol, src=SRC.get)
        self.assertEqual(r["issues"], [], r)
        r = series.check(good + [post("2026-11-20", "x", None)], dt.date(2026, 11, 18), 6, pol, src=SRC.get)
        self.assertTrue(any("金曜日" in x for x in r["issues"]))

    def test_post_py_skips_non_series_after_start(self):
        """連載が始まったら、1話完結（series の欄がない回）は出さない（オーナーの指示があるまで）"""
        import post
        sch = {"defaults": {"platforms": ["ig"]}, "posts": [post_entry("2026-11-19")]}
        with mock.patch.object(post.series, "policy", return_value=dict(POL, series_start="2026-11-19")), \
             mock.patch.object(post.json, "loads", side_effect=[sch, {}]):
            now = dt.datetime(2026, 11, 19, 18, 0, tzinfo=post.JST)
            _, _, out = post.pick_posts(slot_override="18:00", now=now)
        self.assertEqual(out, [])

    def test_follow_teaser_and_recap(self):
        src = dict(SRC, p1="// 状況：x\nおわり", p2="// 状況：x\n次回！フォローして")
        r = run(GOOD, src=src)
        self.assertTrue(any("フォロー" in x and "p1" in x for x in r["issues"]))
        self.assertTrue(any("次回予告" in x and "p1" in x for x in r["issues"]))
        self.assertTrue(any("あらすじ" in x and "p2" in x for x in r["issues"]))

    def test_mixed_stories_in_one_week(self):
        r = run([GOOD[0], post("2026-11-26", "p2", 2, sid="other"), GOOD[2]])
        self.assertTrue(any("別の話" in x for x in r["issues"]))

    def test_missing_part_soon_is_issue(self):
        r = run(GOOD[:1], today=dt.date(2026, 11, 23))
        self.assertTrue(any("第2話がまだ" in x for x in r["issues"]))  # 3日以内
        self.assertTrue(any("第3話がまだ" in x for x in r["warns"]))

    def test_post_py_skips_off_days(self):
        import post
        sch = {"defaults": {"platforms": ["ig"]}, "posts": [post_entry("2026-11-24")]}
        with mock.patch.object(post.series, "policy", return_value=POL), \
             mock.patch.object(post.json, "loads", side_effect=[sch, {}]):
            now = dt.datetime(2026, 11, 24, 18, 0, tzinfo=post.JST)
            _, _, out = post.pick_posts(slot_override="18:00", now=now)
        self.assertEqual(out, [])

    def test_real_schedule_has_no_off_day_posts(self):
        """予定表（本物）に、月・木・土の外の回がない（再発防止：毎日投稿の回が混ざらない）"""
        pol = series.policy()
        posts = json.loads((ROOT / "auto" / "schedule.json").read_text(encoding="utf-8"))["posts"]
        bad = [p["date"] + " " + p["ep"] for p in posts if not series.allowed(p["date"], pol)]
        self.assertEqual(bad, [])


def post_entry(date):
    return {"date": date, "slot": "18:00", "ep": "x", "title": "x"}


if __name__ == "__main__":
    unittest.main()
