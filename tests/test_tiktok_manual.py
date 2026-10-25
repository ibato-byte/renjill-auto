"""TikTok を API で出せないとき、手動投稿の「あなたの番」を1回＝1動作で出す（依頼 #100）。ネットワークに出ない"""
import datetime as dt, json, os, pathlib, sys, unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto"))
import post  # noqa: E402

D = {"yt_description": "d", "tag_sets": {"A": "#a #b #c"}, "platforms": ["ig", "tt"], "seo": {}}
P = {"date": "2026-10-26", "slot": "12:00", "ep": "x1", "no": 2, "title": "ジルの朝", "caption_en": "Hello.", "caption_ja": "こんにちは。"}
SCH = {"defaults": D, "posts": [P]}
NOW = dt.datetime(2026, 10, 26, 13, 0, tzinfo=post.JST)


class TiktokTasksTest(unittest.TestCase):
    def rec(self, **kw): return {"2026-10-26_x1": {"tt": "manual", "tt_todo": "2026-10-26", "tt_video": "https://example.test/v.mp4", **kw}}

    def test_task_has_link_caption_and_one_action(self):
        t = post.tiktok_tasks(SCH, self.rec(), NOW)
        self.assertEqual(len(t), 1)
        self.assertEqual(t[0]["id"], "tiktok-x1"); self.assertEqual(t[0]["kind"], "manual")
        self.assertIn("ジルの朝", t[0]["text"]); self.assertIn("Hello.", t[0]["copy"])
        self.assertEqual(t[0]["links"][0]["url"], "https://example.test/v.mp4")

    def test_old_or_unmarked_posts_are_not_listed(self):
        self.assertEqual(post.tiktok_tasks(SCH, self.rec(), NOW + dt.timedelta(days=5)), [])
        self.assertEqual(post.tiktok_tasks(SCH, {"2026-10-26_x1": {"tt": "manual", "note": "手動で予約済み"}}, NOW), [])
        self.assertEqual(post.tiktok_tasks(SCH, {"2026-10-26_x1": {"tt": "12345"}}, NOW), [])

    def test_hub_args_carry_task_and_do_not_clear_it(self):
        post.DIST.mkdir(exist_ok=True)
        t = post.tiktok_tasks(SCH, self.rec(), NOW)
        post.write_hub_args(None, {}, [], None, tasks=t)
        args = (post.DIST / "post_hub_args").read_bytes().split(b"\0")
        self.assertIn(b"--owner-task", args); self.assertNotIn("none".encode(), args)
        self.assertEqual(json.loads(args[args.index(b"--owner-task") + 1])["id"], "tiktok-x1")


class OwnCommentTest(unittest.TestCase):
    def test_own_comments_are_marked(self):
        import comments
        class H:
            def __init__(s, j): s.j = j
            def get(s, *a, **k):
                class R:
                    def json(_): return s.j
                return R()
        ig = comments.fetch_meta("ig", "1", "t", H({"data": [{"id": "a", "text": "x", "username": "renjill_office"}, {"id": "b", "text": "y", "username": "fan"}]}))
        self.assertEqual([c["own"] for c in ig], [True, False])
        fbc = comments.fetch_meta("facebook", "1", "t", H({"data": [{"id": "a", "message": "x", "from": {"id": "1358515160686321"}}, {"id": "b", "message": "y", "from": {"id": "9"}}]}))
        self.assertEqual([c["own"] for c in fbc], [True, False])


if __name__ == "__main__":
    unittest.main()
