"""TikTok を「あなたの番」にする・Threads の数字・コメント対応のログ（依頼 #99。ネットワークに出ない）"""
import datetime as dt, json, os, pathlib, sys, tempfile, unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto"))
import comments, insights, post  # noqa: E402

D = {"yt_description": "d", "platforms": ["tt"], "tag_sets": {"A": "#a"}, "fb_tag_sets": {"A": "#a"}}
P = {"ep": "x", "date": "2026-10-26", "caption_en": "EN", "caption_ja": "JA", "tag_set": "A", "title": "T"}


class FakeHttp:
    def __init__(self, j): self.j = j
    def get(self, url, params=None, timeout=None):
        class R:
            status_code = 200
            def json(s): return self.j
        return R()


class Tests(unittest.TestCase):
    def test_tiktok_without_token_is_manual(self):
        os.environ.pop("TT_ACCESS_TOKEN", None)
        with self.assertRaises(post.TikTokManual): post.post_tiktok(P, D, pathlib.Path("/nonexistent"))

    def test_tiktok_task_has_link_caption_due(self):
        t = post.tiktok_task(P, D, "https://example.com/v.mp4", "https://example.com/c.jpg")
        self.assertEqual(t["due"], "2026-10-26"); self.assertEqual(t["links"][0]["url"], "https://example.com/v.mp4")
        self.assertIn("Follow for more", t["copy"]); self.assertEqual(t["id"], "tiktok-x")
        self.assertIn("カバーをアップロード", t["copy"]); self.assertIn("プロフィールの一覧", t["copy"])  # Hub 依頼 #178
        self.assertTrue(any(l["url"] == "https://example.com/c.jpg" for l in t["links"]))

    def test_tiktok_never_without_cover_image(self):  # Hub 依頼 #178：表紙画像が無ければ TikTok に出さない
        with self.assertRaises(post.TikTokNoCover): post.tiktok_task(P, D, "https://example.com/v.mp4", None)

    def test_tiktok_api_is_never_used_for_posting(self):  # API は動画のコマが表紙になり半透明になる
        os.environ["TT_ACCESS_TOKEN"] = "x"
        try:
            with self.assertRaises(post.TikTokManual): post.post_tiktok(P, D, pathlib.Path("/nonexistent"))
        finally: os.environ.pop("TT_ACCESS_TOKEN", None)

    def test_threads_rows(self):
        j = {"data": [{"name": "views", "values": [{"value": 5}]}, {"name": "likes", "values": [{"value": 1}]}]}
        rows = insights.threads_rows("2026-10-26", {"2026-10-25_x": {"threads": "123"}}, "tok", FakeHttp(j))
        d = {r[3]: r for r in rows}
        self.assertEqual(d["views"][4], 5); self.assertEqual(d["replies"][4], ""); self.assertTrue(d["replies"][5])

    def test_threads_error_keeps_reason(self):
        rows = insights.threads_rows("d", {"k": {"threads": "1"}}, "t", FakeHttp({"error": {"message": "no permission"}}))
        self.assertTrue(all(r[4] == "" and "no permission" in r[5] for r in rows))

    def test_reply_mode_is_live_and_log(self):
        self.assertEqual(comments.load_mode(), "live")
        now = dt.datetime(2026, 10, 26, 12, tzinfo=comments.JST)
        with tempfile.TemporaryDirectory() as d:
            f = pathlib.Path(d) / "r.json"
            f.write_text(json.dumps({"ig:1": {"platform": "ig", "mode": "live", "reply": "ありがとう", "text": "好き", "at": "2026-10-26T12:00+09:00"},
                                     "ig:2": {"platform": "ig", "mode": "draft", "reply": "x", "text": "y", "at": "2026-10-26T12:00+09:00"}}))
            log = comments.recent_log(now, f)
        self.assertIn("ありがとう", log); self.assertNotIn("→「x」", log)

    def test_unsafe_comments_not_replied(self):
        for t in ["副業はこちら https://x.example", "これはどこで買えますか？", "選挙に行こう", "死ね"]:
            self.assertNotEqual(comments.classify(t)[0], "reply", t)


if __name__ == "__main__": unittest.main()
