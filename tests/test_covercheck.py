"""表紙の型の検査（Hub 依頼 #124）：YouTube＝文字なし、ほかの SNS＝文字あり。今回だけ違う回は止める。"""
import os, re, sys, unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "auto"))
import covercheck  # noqa: E402


class JudgeTest(unittest.TestCase):
    ALL_OK = {"yt": "none", "ig": "text", "facebook": "text", "tt": "text", "threads": "text"}

    def test_correct_styles_pass(self):
        self.assertEqual(covercheck.judge(self.ALL_OK, {}), [])

    def test_youtube_with_text_is_ng(self):  # 10/26「ジルの朝」の事故
        probs = covercheck.judge(dict(self.ALL_OK, yt="text"), {})
        self.assertEqual([s for s, _ in probs], ["yt"])

    def test_other_sns_without_text_is_ng(self):
        probs = covercheck.judge(dict(self.ALL_OK, tt="none"), {})
        self.assertEqual([s for s, _ in probs], ["tt"])

    def test_differs_from_recent_post_is_ng(self):  # 正しい型でも、直近の投稿と違えば止める（直近が間違いのまま続くのを防ぐ）
        probs = covercheck.judge(self.ALL_OK, {"ig": ("2026-10-25_chime2", "none")})
        self.assertEqual([s for s, _ in probs], ["ig"])

    def test_only_limits_to_sns_being_posted(self):
        self.assertEqual(covercheck.judge(dict(self.ALL_OK, yt="text"), {}, only={"ig"}), [])

    def test_latest_styles_uses_only_earlier_posts(self):
        posted = {"2026-10-25_a": {"cover_style": {"yt": "none"}}, "2026-10-26_b": {"cover_style": {"yt": "text"}}, "2026-10-27_c": {}}
        self.assertEqual(covercheck.latest_styles(posted, "2026-10-27_c")["yt"], ("2026-10-26_b", "text"))
        self.assertEqual(covercheck.latest_styles(posted, "2026-10-26_b")["yt"], ("2026-10-25_a", "none"))


class WiringTest(unittest.TestCase):
    def src(self, *p): return open(os.path.join(ROOT, *p), encoding="utf-8").read()

    def test_youtube_does_not_send_text_thumbnail(self):
        post = self.src("auto", "post.py")
        body = post[post.index("def post_youtube"):post.index("# ---------- TikTok")]
        self.assertNotIn("thumbnails().set", re.sub(r"#.*", "", body))

    def test_youtube_video_is_rendered_without_hook(self):
        post = self.src("auto", "post.py")
        self.assertIn('"nohook"', post)
        self.assertIn("_nohook", post)
        self.assertIn("nohook", self.src("rig", "render-ep.js"))
        self.assertIn("nohook", self.src("rig", "ep.html"))

    def test_cover_gate_runs_before_posting_and_in_preflight(self):
        self.assertIn("covercheck.check", self.src("auto", "post.py"))
        self.assertIn("covercheck.check", self.src("auto", "preflight.py"))


if __name__ == "__main__":
    unittest.main()
