"""YouTube のタイトルが上限（100文字）を超えない・< > を含まない（2026-11-12「ハンコ8個」が invalidTitle で失敗した再発防止）"""
import json, pathlib, sys, unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto"))
import post  # noqa: E402


def episodes(o):
    if isinstance(o, dict):
        if {"caption_en", "title", "date"} <= set(o): yield o
        for v in o.values(): yield from episodes(v)
    elif isinstance(o, list):
        for v in o: yield from episodes(v)


class YtTitleTest(unittest.TestCase):
    def test_short_title_unchanged(self):
        self.assertEqual(post.yt_title({"caption_en": "Short.", "title": "T"}), "Short. | Ren & Jill「T」")

    def test_hanko_fits(self):
        p = {"caption_en": "The form needs 8 stamps. The boss runs out of ink at 7. Stamp 8 is a paw print. Approved.", "title": "ハンコ8個"}
        t = post.yt_title(p)
        self.assertLessEqual(len(t), 100)
        self.assertTrue(t.endswith("| Ren & Jill「ハンコ8個」"), t)
        self.assertIn("…", t)

    def test_every_scheduled_title_is_valid(self):
        sched = json.loads((ROOT / "auto" / "schedule.json").read_text(encoding="utf-8"))
        for p in episodes(sched):
            t = post.yt_title(p)
            self.assertTrue(0 < len(t) <= 100, (p["date"], len(t), t))
            self.assertNotRegex(t, r"[<>]", p["date"])

    def test_post_youtube_uses_yt_title(self):
        src = (ROOT / "auto" / "post.py").read_text(encoding="utf-8")
        body = src[src.index("def post_youtube"):src.index("# ---------- TikTok")]
        self.assertIn("yt_title(p)", body)


if __name__ == "__main__":
    unittest.main()
