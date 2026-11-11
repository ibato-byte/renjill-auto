"""YouTube の多言語タイトル（title_i18n）の形の検査（2026-11-12 週なかの再検査）。
title_i18n がない回は英語のタイトルがそのまま全言語に出る（growth.youtube_localizations）。付けるときに壊れた値を出さない。"""
import json, pathlib, sys, unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto"))
import growth  # noqa: E402

SIMPLIFIED = set("这们说时会对发过还来为门问间车东见长马鸟贝页风飞龙")  # 簡体字だけの字（繁体字の欄に入れない）


class TitleI18n(unittest.TestCase):
    def setUp(self):
        self.posts = [p for p in json.loads((ROOT / "auto/schedule.json").read_text())["posts"] if p.get("title_i18n")]

    def test_langs_are_youtube_locales(self):
        bad = [f'{p["ep"]}:{k}' for p in self.posts for k in p["title_i18n"] if k not in growth.LOCALE_DESC]
        self.assertEqual(bad, [], "LOCALE_DESC にない言語：" + ", ".join(bad))

    def test_length_and_brand(self):
        for p in self.posts:
            for k, v in p["title_i18n"].items():
                self.assertTrue(v.strip(), f'{p["ep"]}:{k} が空')
                self.assertLessEqual(len(v), 100, f'{p["ep"]}:{k} が100文字を超える（YouTube の上限）')
                self.assertTrue("Ren & Jill" in v or "レンとジル" in v, f'{p["ep"]}:{k} に作品名がない')
                self.assertNotIn("＆", v, "日本語は「レンとジル」（＆を使わない）")

    def test_no_simplified_in_zh_hant(self):
        bad = [p["ep"] for p in self.posts if SIMPLIFIED & set(p["title_i18n"].get("zh-Hant", ""))]
        self.assertEqual(bad, [], "zh-Hant に簡体字：" + ", ".join(bad))

    def test_localizations_use_title_i18n(self):
        p = self.posts[0] if self.posts else {"title_i18n": {"ko": "테스트 | Ren & Jill"}}
        loc = growth.youtube_localizations(p, {}, "EN | Ren & Jill", "desc")
        for k, v in p["title_i18n"].items():
            self.assertEqual(loc[k]["title"], v[:100])


if __name__ == "__main__":
    unittest.main()
