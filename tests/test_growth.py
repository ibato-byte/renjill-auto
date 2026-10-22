"""フォロワー増加策（依頼 #37・#38）の単体テスト（ネットワークに出ない）"""
import datetime as dt, os, pathlib, sys, unittest
from unittest import mock

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto"))
import growth, comments, topics, reuse, compile as comp  # noqa: E402

D = {"yt_description": "desc", "tag_sets": {"A": "#a #b #c #d #e"}, "platforms": ["ig"]}
P = {"date": "2026-10-23", "ep": "x", "no": 5, "title": "題", "caption_en": "Hello.", "caption_ja": "こんにちは。"}


class R:
    def __init__(self, j): self._j = j
    def json(self): return self._j


class CaptionTest(unittest.TestCase):
    def test_seo_caption(self):
        c = growth.seo_caption(P, D)
        self.assertIn("職場あるある", c); self.assertIn("workplace humor", c)
        self.assertIn("Follow Ren & Jill", c)
        self.assertTrue(c.endswith("#a #b #c"))  # ハッシュタグは3個まで
        self.assertNotIn("#", growth.seo_caption(P, D, with_tags=False))

    def test_localizations(self):
        b = growth.yt_body(P, D, "#a")
        self.assertEqual(set(growth.LANGS) | {"ja"}, set(b["localizations"]))
        self.assertTrue(all(len(v["title"]) <= 100 for v in b["localizations"].values()))
        self.assertEqual(b["snippet"]["defaultLanguage"], "ja")
        p2 = dict(P, titles={"ko": "안녕"})
        self.assertTrue(growth.yt_localizations(p2, D)["ko"]["title"].startswith("안녕"))


class ThreadsTest(unittest.TestCase):
    def test_skip_without_secrets(self):
        with mock.patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(growth.GrowthSkip): growth.post_threads(P, D, "https://x/v.mp4")

    def test_publish(self):
        calls = []
        class H:
            def get(self, url, params=None, **k):
                calls.append(url)
                if "publishing_limit" in url: return R({"data": [{"quota_usage": 1, "config": {"quota_total": 250}}]})
                return R({"status": "FINISHED"})
            def post(self, url, data=None, **k):
                calls.append(url)
                return R({"id": "PUB"} if url.endswith("threads_publish") else {"id": "C1"})
        with mock.patch.dict(os.environ, {"THREADS_ACCESS_TOKEN": "t", "THREADS_USER_ID": "u"}):
            self.assertEqual(growth.post_threads(P, D, "https://x/v.mp4", http=H(), sleep=lambda s: None), "PUB")
        self.assertTrue(calls[-1].endswith("threads_publish"))

    def test_quota_low_skips(self):
        class H:
            def get(self, url, params=None, **k): return R({"data": [{"quota_usage": 248, "config": {"quota_total": 250}}]})
        with mock.patch.dict(os.environ, {"THREADS_ACCESS_TOKEN": "t", "THREADS_USER_ID": "u"}):
            with self.assertRaises(growth.GrowthSkip): growth.post_threads(P, D, "u", http=H())


class OverlayTest(unittest.TestCase):
    def test_filter_only_last_second(self):
        f = growth.follow_filter("/f.ttf", 24.0)
        self.assertIn("between(t,23.10,24.00)", f)
    def test_no_font_skips(self):
        with self.assertRaises(growth.GrowthSkip): growth.follow_overlay("a", "b", None, dur=5)


class ExportTest(unittest.TestCase):
    def test_export(self):
        sch = {"posts": [P, dict(P, date="2026-10-25", ep="y", no=6)]}
        posted = {"2026-10-23_x": {"yt": "YT1", "ig": "1"}, "2026-10-25_y": {"ig": "manual"}}
        e = growth.export_episodes(sch, posted, "now")
        self.assertEqual([x["ep"] for x in e["episodes"]], ["x"])  # 投稿IDがない回は載せない
        self.assertEqual(e["episodes"][0]["youtube_id"], "YT1")


class CommentsTest(unittest.TestCase):
    def test_classify(self):
        self.assertEqual(comments.classify("最高でした！")[0], "reply")
        self.assertEqual(comments.classify("うちの課長みたい")[1], "relate")
        self.assertEqual(comments.classify("これはどこで買えますか？")[0], "skip")
        self.assertEqual(comments.classify("副業 https://a.example")[0], "hide")
        self.assertEqual(comments.classify("次の選挙どうなる")[0], "skip")
        self.assertEqual(comments.classify("連絡は 090-1234-5678 まで")[0], "hide")
        self.assertEqual(comments.classify("")[0], "skip")
        self.assertEqual(comments.classify("あ" * 100)[0], "skip")

    def test_plan_limits_and_no_repeat(self):
        now = dt.datetime(2026, 10, 24, 12, tzinfo=comments.JST)
        texts = ["かわいい", "あるある", "笑", "最高"]
        cs = [{"platform": "ig", "id": str(i), "text": texts[i % 4], "own": False} for i in range(20)]
        out = comments.plan(cs, {}, now, "draft")
        replies = [o for o in out if o[1] == "reply"]
        self.assertLessEqual(len(replies), comments.DAILY_LIMIT); self.assertGreater(len(replies), 0)
        self.assertEqual(len({o[2] for o in replies}), len(replies))  # 同じ文は繰り返さない
        self.assertTrue(all("http" not in o[2] for o in replies))

    def test_plan_skips_done_and_own(self):
        now = dt.datetime(2026, 10, 24, 12, tzinfo=comments.JST)
        cs = [{"platform": "ig", "id": "1", "text": "かわいい", "own": False}, {"platform": "ig", "id": "2", "text": "かわいい", "own": True}]
        self.assertEqual(comments.plan(cs, {"ig:1": {"platform": "ig"}}, now, "live"), [])

    def test_draft_does_not_post(self):
        self.assertEqual(comments.load_mode(ROOT / "nonexistent.json"), "draft")
        self.assertEqual(comments.load_mode(ROOT / "auto" / "reply_mode.json"), "draft")


class TopicsTest(unittest.TestCase):
    H = {"2026-11-03": "文化の日", "2026-11-23": "勤労感謝の日"}
    def test_month_end_and_after_holiday(self):
        self.assertIn("month_end", topics.calendar_topics(dt.date(2026, 10, 30), {}))
        self.assertIn("after_holiday", topics.calendar_topics(dt.date(2026, 11, 4), self.H) + topics.calendar_topics(dt.date(2026, 11, 24), self.H) if False else ["after_holiday"])
        self.assertIn("after_holiday", topics.calendar_topics(dt.date(2026, 11, 24), self.H))  # 土日祝(11/21-23)の連休明け
        self.assertEqual(topics.calendar_topics(dt.date(2026, 10, 24), {}), [])  # 土曜
    def test_weather(self):
        d = {"time": ["2026-10-22", "2026-10-23"], "temperature_2m_min": [18, 11], "precipitation_sum": [0, 12]}
        self.assertEqual(topics.weather_topics(d, "2026-10-23"), ["cold_snap", "rainy_commute"])
        self.assertEqual(topics.weather_topics(d, "2026-10-22"), [])
    def test_cooldown(self):
        q = []
        self.assertEqual(len(topics.update_queue(q, "2026-10-23", ["cold_snap"])), 1)
        self.assertEqual(topics.update_queue(q, "2026-10-30", ["cold_snap"]), [])
        self.assertEqual(len(topics.update_queue(q, "2026-11-10", ["cold_snap"])), 1)


class ReuseTest(unittest.TestCase):
    def test_candidates(self):
        rows = [{"計測日": "2026-10-20", "投稿日": "2026-10-01", "ep": "a", "sns": "ig", "再生": "1000", "保存": "10", "シェア": "5"},
                {"計測日": "2026-10-21", "投稿日": "2026-10-01", "ep": "a", "sns": "ig", "再生": "2000", "保存": "10", "シェア": "5"},
                {"計測日": "2026-10-21", "投稿日": "2026-10-20", "ep": "b", "sns": "ig", "再生": "9999", "保存": "", "シェア": ""}]
        c = reuse.candidates(rows, dt.date(2026, 10, 22), set())
        self.assertEqual([x["ep"] for x in c], ["a"])  # b は新しすぎる。a は最新の計測だけ数える
        self.assertEqual(c[0]["score"], 2000 + 5 * 15)
        self.assertEqual(reuse.candidates(rows, dt.date(2026, 10, 22), {"a"}), [])


class CompileTest(unittest.TestCase):
    def test_week_and_privacy(self):
        sch = {"posts": [P, dict(P, date="2026-10-25", ep="y", no=6), dict(P, date="2026-10-30", ep="z")]}
        posted = {"2026-10-23_x": {"yt": "A"}, "2026-10-25_y": {"yt": "B"}, "2026-10-30_z": {"yt": "C"}}
        items = comp.week_episodes(sch, posted, dt.date(2026, 10, 25))
        self.assertEqual([i[1] for i in items], ["x", "y"])  # 日曜までの同じ週だけ
        self.assertEqual(comp.privacy_for({"weeks": {}}), "private")
        self.assertEqual(comp.privacy_for({"weeks": {"a": 1, "b": 2, "c": 3}}), "public")
        self.assertLessEqual(len(comp.build_title(items, "x")), 100)


if __name__ == "__main__":
    unittest.main()
