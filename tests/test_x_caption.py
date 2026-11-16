"""X 用の説明文：X の数え方で 280 を超えない・英語と日本語の一言が入る・途中で切れない（全部の回で）"""
import json, pathlib, sys, unittest
ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto"))
import post  # noqa: E402


class XCaption(unittest.TestCase):
    def test_every_episode_fits(self):
        d = json.loads((ROOT / "auto/schedule.json").read_text())
        n = 0
        stock = json.loads((ROOT / "auto/stock.json").read_text())["posts"]  # 2026-11-16 に週3本へ変えたとき予定表から外した回も見る
        for p in d["posts"] + stock:
            if not p.get("caption_ja") or not p.get("caption_en"): continue
            c = post.x_caption(p, d.get("defaults", {}))
            self.assertLessEqual(post.x_len(c), post.X_LIMIT, p["ep"])
            self.assertIn(p["caption_ja"], c, p["ep"])
            n += 1
        self.assertGreater(n, 50)

    def test_counting(self):
        self.assertEqual(post.x_len("abc"), 3)
        self.assertEqual(post.x_len("うさぎ"), 6)
        self.assertEqual(post.x_len("see https://example.com/very/long/path"), 4 + 23)
