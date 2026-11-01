"""SNS の多言語方針（auto/sns_policy.json）と公式サイトのエピソード一覧（episodes.json）の単体テスト（ネットワークに出ない）"""
import json, pathlib, sys, unittest
from unittest import mock

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto"))
import sns_policy, episodes_json, post, growth  # noqa: E402

POL = json.loads((ROOT / "auto" / "sns_policy.json").read_text())
D = {"yt_description": "▶ game: https://hay-dash.coana.co.jp/?lang=en\n\nabout", "platforms": ["ig"],
     "tag_sets": {"A": "#a #b"}, "fb_tag_sets": {"A": "#a"}}
P = {"caption_en": "EN", "caption_ja": "JA", "tag_set": "A", "title": "T"}
SITE = "https://renjill.coana.co.jp/"


class PolicyFileTest(unittest.TestCase):
    def test_no_simplified_chinese(self):
        # 簡体字（zh-Hans・zh-CN）は入れない。YouTube の多言語は ko と zh-Hant を含む
        self.assertIn("ko", growth.LOCALE_DESC); self.assertIn("zh-Hant", growth.LOCALE_DESC)
        self.assertFalse({"zh-Hans", "zh-CN", "zh"} & set(growth.LOCALE_DESC))

    def test_tiktok_tags_at_most_three(self):
        self.assertLessEqual(len(POL["tt_tags"]), 3)


class YouTubeTest(unittest.TestCase):
    def test_site_line_added_once_in_first_block(self):
        out = sns_policy.yt_description(D["yt_description"], POL)
        self.assertEqual(out.count(SITE), 1)
        self.assertIn(SITE, out.split("\n\n")[0])
        self.assertEqual(out.count("hay-dash.coana.co.jp"), 1)  # ゲームはもうあるので足さない
        self.assertEqual(sns_policy.yt_description(out, POL), out)

    def test_flag_off(self):
        self.assertEqual(sns_policy.yt_description(D["yt_description"], {**POL, "yt_extra_lines": False}), D["yt_description"])

    def test_localized_descriptions_carry_the_line(self):
        desc = sns_policy.yt_description(D["yt_description"], POL)
        loc = growth.youtube_localizations(P, D, "t", desc)
        self.assertTrue(all(SITE in v["description"] for v in loc.values()))


class TikTokTest(unittest.TestCase):
    def test_tags_only_on_tiktok(self):
        with mock.patch.object(sns_policy, "load", return_value=POL):
            tt, ig = post.tt_caption(P, D), post.caption(P, D)
        self.assertTrue(tt.endswith(" ".join(POL["tt_tags"])))
        self.assertFalse(any(t in ig for t in POL["tt_tags"]))  # Instagram などは変えない
        self.assertTrue(tt.startswith(ig))

    def test_limit_and_duplicates(self):
        self.assertEqual(sns_policy.tiktok_caption("x" * 2199, POL), "x" * 2199)  # 上限を超えるなら足さない
        self.assertEqual(sns_policy.tiktok_caption("a #兔子", POL), "a #兔子\n#療癒 #토끼")
        self.assertEqual(sns_policy.tiktok_caption("a", {**POL, "tt_i18n_tags": False}), "a")
        self.assertEqual(sns_policy.tiktok_caption("a", {**POL, "tt_max_tags": 1}), "a\n#兔子")


class EpisodesJsonTest(unittest.TestCase):
    SCH = {"posts": [
        {"date": "2026-10-28", "ep": "a", "title": "エー", "caption_ja": "じゃ", "caption_en": "en"},
        {"date": "2026-10-30", "ep": "b", "title": "ビー", "caption_ja": "じゃ2", "caption_en": "en2", "title_i18n": {"en": "Bee", "ko": "비"}},
        {"date": "2026-11-01", "ep": "c", "title": "シー", "caption_ja": "", "caption_en": ""},
        {"date": "2026-10-20", "ep": "d", "title": "ディー", "caption_ja": "", "caption_en": ""}]}
    POSTED = {"2026-10-28_a": {"yt": "manual", "ig": "1"}, "2026-10-30_b": {"yt": "YTID"}, "2026-11-01_c": {"yt": "X"}}

    def test_build(self):
        eps = episodes_json.build(self.SCH, self.POSTED, ["20261028_a_cover.jpg", "20261030_b.mp4"], today="2026-10-31")
        self.assertEqual([e["ep"] for e in eps], ["b", "a"])  # 未来の回・記録のない回は出さない、新しい順
        b, a = eps
        self.assertEqual(b["title"], {"ja": "ビー", "en": "Bee", "ko": "비"})
        self.assertEqual(b["youtube_id"], "YTID"); self.assertEqual(b["video"], "20261030_b.mp4"); self.assertNotIn("cover", b)
        self.assertEqual(a["title"], "エー"); self.assertNotIn("youtube_id", a)  # "manual" は ID ではない
        self.assertEqual(a["cover"], "20261028_a_cover.jpg"); self.assertEqual(a["caption_en"], "en")

    def test_real_data_builds(self):
        sch = json.loads((ROOT / "auto" / "schedule.json").read_text())
        posted = json.loads((ROOT / "auto" / "posted.json").read_text())
        eps = episodes_json.build(sch, posted, today="2099-01-01")
        self.assertTrue(eps and all(e["ep"] and e["date"] and e["title"] for e in eps))

    def test_publish_failure_does_not_raise(self):
        with mock.patch.object(sns_policy, "load", return_value=POL), \
             mock.patch.object(episodes_json, "media_listing", side_effect=RuntimeError("net")):
            post.publish_episodes(self.SCH, self.POSTED)  # 例外を出さない（投稿は止めない）

    def test_publish_off(self):
        with mock.patch.object(sns_policy, "load", return_value={**POL, "episodes_json": False}), \
             mock.patch.object(episodes_json, "media_listing") as ml:
            post.publish_episodes(self.SCH, self.POSTED)
        ml.assert_not_called()


if __name__ == "__main__":
    unittest.main()
