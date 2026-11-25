import os, sys, unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "auto"))
import rebrand, rebrand_posts  # noqa: E402

OLD_BRAND = "レンとジル"  # 旧名（ブランド）


class RebrandTest(unittest.TestCase):
    def test_names_ids_urls(self):
        s = OLD_BRAND + "｜書類の山 #" + OLD_BRAND + " @" + "renjill_office https://x.com/" + "renjill_office https://renjill" + ".coana.co.jp/"  # 旧ID
        self.assertEqual(rebrand.rebrand(s), "東京うさぎオフィス｜書類の山 #東京うさぎオフィス @tokyo_usagi_office https://x.com/tokyo_usagi_ofc https://usagi.coana.co.jp/")
        self.assertEqual(rebrand.rebrand("R" "en & J" "ill"), "Tokyo Usagi Office")
        self.assertEqual(rebrand.rebrand("the boss R" "en and his J" "ill"), "the boss Mochi and his Yuzu")

    def test_not_names(self):  # 名前でない言葉は変えない
        for w in ("カレンダー", "チャレンジ", "オレンジ", "레", "질문", "Rent", "renjill-media", "Pomodoro"):
            self.assertEqual(rebrand.rebrand(w), w)

    def test_idempotent(self):
        s = OLD_BRAND + "：R" "en & J" "ill"
        self.assertEqual(rebrand.rebrand(rebrand.rebrand(s)), rebrand.rebrand(s))

    def test_yt_body(self):
        it = {"id": "v", "snippet": {"title": OLD_BRAND + "｜x", "description": "d", "categoryId": "1", "tags": [OLD_BRAND]},
              "localizations": {"en": {"title": "R" "en & J" "ill | x", "description": "y"}}}
        body, part = rebrand_posts.yt_body(it)
        self.assertEqual(body["snippet"]["title"], "東京うさぎオフィス｜x")
        self.assertEqual(body["snippet"]["tags"], ["東京うさぎオフィス"])
        self.assertEqual(body["localizations"]["en"]["title"], "Tokyo Usagi Office | x")
        self.assertEqual(part, "snippet,localizations")
        it2 = {"id": "v", "snippet": {"title": "東京うさぎオフィス｜x", "description": "d", "categoryId": "1"}}
        self.assertEqual(rebrand_posts.yt_body(it2), (None, None))

    def test_ids(self):
        yt, fb = rebrand_posts.ids()
        # 2026-11-23：オーナーの指示で過去のショート動画を全部消したので、本数は決めない（作業用BGMの長い動画は残る）
        self.assertGreater(len(yt), 0); self.assertNotIn("manual", yt); self.assertNotIn("manual", fb)
        self.assertEqual(len(yt), len(set(yt))); self.assertEqual(len(fb), len(set(fb)))


if __name__ == "__main__":
    unittest.main()
