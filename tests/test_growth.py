"""無料のフォロワー増加策（依頼 #38）の単体テスト（ネットワークに出ない）"""
import datetime as dt, pathlib, sys, unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto"))
import growth, topics, post, facebook  # noqa: E402

D = {"yt_description": "d", "platforms": ["ig"], "tag_sets": {"A": "#a"}, "fb_tag_sets": {"A": "#a"}}
P = {"caption_en": "EN", "caption_ja": "JA", "tag_set": "A", "title": "T"}


class GrowthTest(unittest.TestCase):
    def test_caption_ends_with_english_line(self):
        for c in (post.caption(P, D), facebook.caption(P, D)):
            self.assertTrue(c.rstrip().endswith("Follow for more Ren & Jill 🐰"), c)

    def test_localizations(self):
        loc = growth.youtube_localizations({**P, "title_i18n": {"ko": "한국어 제목"}}, D, "En title", "En desc")
        self.assertEqual(set(loc), {"ja", "ko", "zh-Hant", "es", "pt"})
        self.assertEqual(loc["ko"]["title"], "한국어 제목")
        self.assertEqual(loc["es"]["title"], "En title")
        self.assertTrue(all(len(v["title"]) <= 100 for v in loc.values()))

    def test_follow_filter_fades_out_before_end(self):
        f = growth.follow_filter(10.0, "/f.ttf", pathlib.Path("/t"))
        self.assertIn("alpha=", f); self.assertIn("tpad=", f)
        L = growth.follow_layout(10.0, 1920)
        self.assertAlmostEqual(L["end"], L["total"] - 0.15)  # 最後の0.15秒は表示しない

    def test_follow_layout_rules(self):
        for total in (10.0, 22.0, 29.5):
            L = growth.follow_layout(total, 1920)
            self.assertGreaterEqual(L["show"], 2.0); self.assertLessEqual(L["show"], 2.5)
            self.assertGreaterEqual(L["fontsize"], 1920 * 0.06)
            self.assertLessEqual(L["text_bottom"], 1920 * 0.80)  # 下から20%より上
            self.assertLess(L["total"], 30)
            self.assertLessEqual(L["start"] + L["show"], L["total"] + 1e-6)

    def test_topics(self):
        self.assertIn("month_end", [k for k, _ in topics.calendar_topics(dt.date(2026, 10, 30))])
        self.assertIn("after_holiday", [k for k, _ in topics.calendar_topics(dt.date(2026, 11, 24))])
        self.assertEqual(topics.calendar_topics(dt.date(2026, 10, 28)), [])

    def test_queue_dedup_and_expire(self):
        d = dt.date(2026, 11, 30)
        q, n = topics.update_queue(d, [("month_end", "x")], [])
        q, n2 = topics.update_queue(d, [("month_end", "x")], q)
        self.assertEqual((n, n2, len(q)), (1, 0, 1))
        q, _ = topics.update_queue(d + dt.timedelta(days=30), [], q)
        self.assertEqual(q, [])

    def test_bsky_skips_without_secrets_and_posts_card(self):
        import bsky
        with self.assertRaises(LookupError): bsky.post_link_card(P, D, "abc", None, env={})
        class R:
            def __init__(s, j): s.j = j
            def json(s): return s.j
        calls = []
        class H:
            def post(s, url, **kw):
                calls.append(url)
                if url.endswith("createSession"): return R({"accessJwt": "j", "did": "did:x"})
                return R({"uri": "at://x"})
        self.assertEqual(bsky.post_link_card(P, D, "abc", None, env={"BSKY_HANDLE": "h", "BSKY_APP_PASSWORD": "p"}, http=H()), "at://x")
        self.assertEqual(len(calls), 2)
        self.assertLessEqual(len(bsky.post_text({**P, "caption_en": "x" * 400}, D)), 300)


if __name__ == "__main__":
    unittest.main()
