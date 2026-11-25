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
        bad = [p["date"] + " " + p["ep"] for p in posts if not series.allowed(p["date"], pol) and not series.owner_exception(p)]   # オーナーが「今回に限り」と決めた回は除く
        self.assertEqual(bad, [])


def post_entry(date):
    return {"date": date, "slot": "18:00", "ep": "x", "title": "x"}


if __name__ == "__main__":
    unittest.main()

    def test_no_post_without_storyboard_ok(self):
        """2026-11-20 オーナー：絵コンテは動画にする前に見せる。approval_from 以降、OK（storyboard_ok）がない連載の回は出さない"""
        pol = dict(POL, series_start="2026-11-19", approval_from="2026-11-21")
        p_old = post("2026-11-19", "a1", 1)
        p_new = post("2026-11-26", "k1", 1)
        self.assertTrue(series.series_ok(p_old, pol))
        self.assertFalse(series.series_ok(p_new, pol))
        p_new["series"]["storyboard_ok"] = "2026-11-21"
        self.assertTrue(series.series_ok(p_new, pol))
        r = series.check([post("2026-11-26", "k1", 1)], dt.date(2026, 11, 24), 6, pol, src=SRC.get)
        self.assertTrue(any("絵コンテのOK" in x for x in r["issues"]), r)

    def test_weekday_slots(self):
        """2026-11-21 オーナー：投稿時刻は 月・木 18:00、土 12:00（slots_from 以降）"""
        pol = dict(POL, series_start="2026-11-19", slots={"0": "18:00", "3": "18:00", "5": "12:00"}, slots_from="2026-11-26")
        a, b, c = post("2026-11-26", "b1", 1), post("2026-11-28", "b2", 2), post("2026-11-30", "b3", 3, ja="", en="")
        a["slot"], b["slot"], c["slot"] = "18:00", "18:00", "18:00"
        r = series.check([a, b, c], dt.date(2026, 11, 21), 12, pol, src=SRC.get)
        self.assertTrue(any("2026-11-28" in x and "12:00" in x for x in r["issues"]), r)
        b["slot"] = "12:00"
        r = series.check([a, b, c], dt.date(2026, 11, 21), 12, pol, src=SRC.get)
        self.assertFalse(any("投稿時刻" in x for x in r["issues"]), r)



class OwnerExceptionTest(unittest.TestCase):
    """2026-11-25 オーナー：「今回の投稿に限り」11/25〜27 の 8:00 に出す。決まりの外の日でも、owner_exception がある回だけは出す"""
    def test_exception_post_is_picked_on_off_day(self):
        import post
        p = {"date": "2026-11-25", "slot": "08:00", "ep": "x", "title": "x", "series": {"id": "s", "part": 1, "of": 3}, "owner_exception": "2026-11-25 オーナー"}
        self.assertTrue(series.owner_exception(p))
        self.assertFalse(series.owner_exception(dict(p, owner_exception="")))
        self.assertFalse(series.allowed("2026-11-25"))   # 水曜は本来は出さない


class HoldTest(unittest.TestCase):
    """2026-11-25 オーナー：出した回を消してブラッシュアップ中。hold の回は、時刻が来ても出さない"""
    def test_hold_posts_are_not_picked(self):
        import post, datetime as dt, json, pathlib
        s = json.loads((pathlib.Path(post.AUTO) / "schedule.json").read_text())
        held = [p for p in s["posts"] if p.get("hold")]
        for p in held:
            h, m = map(int, p["slot"].split(":"))
            now = dt.datetime.fromisoformat(p["date"]).replace(hour=h, minute=m + 5, tzinfo=post.JST)
            eps = [x[1]["ep"] for x in post.pick_posts(None, now)[2]]
            self.assertNotIn(p["ep"], eps)
            self.assertNotIn(p["ep"], [x[1]["ep"] for x in post.pick_posts(p["slot"], now)[2]])
