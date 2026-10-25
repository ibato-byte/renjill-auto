"""Threads・コメント返信・再活用・まとめ動画（依頼 #37）の単体テスト（ネットワークに出ない）"""
import datetime as dt, os, pathlib, sys, unittest
from unittest import mock

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto"))
import threads, comments, reuse, compile as comp  # noqa: E402

D = {"yt_description": "desc", "tag_sets": {"A": "#a #b #c #d #e"}, "platforms": ["ig"]}
P = {"date": "2026-10-23", "ep": "x", "no": 5, "title": "題", "caption_en": "Hello.", "caption_ja": "こんにちは。"}


class R:
    def __init__(self, j): self._j = j
    def json(self): return self._j



class SeoTest(unittest.TestCase):
    def test_seo_in_threads_text(self):
        t = threads.threads_text(P, D)
        self.assertIn("職場あるある", t); self.assertLessEqual(len(t), 480)


class ThreadsTest(unittest.TestCase):
    def test_skip_without_secrets(self):
        with mock.patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(threads.GrowthSkip): threads.post_threads(P, D, "https://x/v.mp4")

    def test_user_id_from_me_when_secret_missing(self):
        seen = []
        class H:
            def get(self, url, params=None, **k):
                seen.append(url); return R({"id": "777"} if url.endswith("/me") else {"error": {"message": "x"}})
        with mock.patch.dict(os.environ, {"THREADS_ACCESS_TOKEN": "t"}, clear=True):
            self.assertEqual(threads.threads_user_id("t", H()), "777")
        class Bad:
            def get(self, url, params=None, **k): return R({"error": {"message": "expired"}})
        with mock.patch.dict(os.environ, {"THREADS_ACCESS_TOKEN": "t"}, clear=True):
            with self.assertRaises(threads.GrowthSkip): threads.threads_user_id("t", Bad())

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
            self.assertEqual(threads.post_threads(P, D, "https://x/v.mp4", http=H(), sleep=lambda s: None), "PUB")
        self.assertTrue(calls[-1].endswith("threads_publish"))

    def test_quota_low_skips(self):
        class H:
            def get(self, url, params=None, **k): return R({"data": [{"quota_usage": 248, "config": {"quota_total": 250}}]})
        with mock.patch.dict(os.environ, {"THREADS_ACCESS_TOKEN": "t", "THREADS_USER_ID": "u"}):
            with self.assertRaises(threads.GrowthSkip): threads.post_threads(P, D, "u", http=H())




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
        self.assertEqual(comments.load_mode(ROOT / "auto" / "reply_mode.json"), "live")  # 2026-10-25 にオーナー指示（Hub 依頼 #99）で実際の返信へ。ファイルがないときは draft のまま



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
