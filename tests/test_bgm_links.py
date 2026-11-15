"""長い動画の説明欄：出している SNS だけを書く（2026-11-15：「X」と書いていたが、X には出していない）。作り置きの回・出した回も直る"""
import pathlib, sys, unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto"))
import bgm  # noqa: E402


class Links(unittest.TestCase):
    def test_new_descriptions_name_only_real_accounts(self):
        pl = bgm.plan("2026-12-02")
        desc, _ = bgm.description(pl, [{"sec": 180.0}] * 20)
        self.assertIn(bgm.SNS_LINE, desc)
        self.assertNotIn(" X:", desc)
        self.assertNotIn("/ X", desc)

    def test_stock_descriptions_are_refreshed(self):
        old = "a\n▶ Daily shorts\n" + bgm.SNS_LINE_OLD + "\n© COANA TOKYO"
        self.assertEqual(bgm.fresh_links(old), old.replace(bgm.SNS_LINE_OLD, bgm.SNS_LINE))
        self.assertEqual(bgm.fresh_links("no such line"), "no such line")
        self.assertEqual(bgm.fresh_links(None), "")

    def test_upload_and_run_use_the_refresh(self):
        src = (ROOT / "auto" / "bgm.py").read_text(encoding="utf-8")
        self.assertIn('sns_policy.yt_description(fresh_links(meta["description"]))', src)
        self.assertIn('sns_policy.yt_description(fresh_links(v["description"]))', src)
        self.assertIn("try: fix_links()", src)   # 出した回も、次の実行で直す（失敗しても投稿は止めない）

    def test_sns_line_matches_the_site(self):
        # 公式サイト・ゲームの SNS の一覧にある物だけ（YouTube 自身は書かない）
        for name in ("Instagram", "TikTok", "Threads"):
            self.assertIn(name, bgm.SNS_LINE)
        self.assertNotIn("X", bgm.SNS_LINE.replace("TikTok", ""))

    def test_fix_links_skips_when_all_marked(self):
        st = {"episodes": {"2026-11-14": {"yt": "abc", "links_ok": 1}}}
        orig = bgm.state
        try:
            bgm.state = lambda: st
            self.assertEqual(bgm.fix_links(), 0)   # 直す物が無ければ、YouTube に聞きに行かない
        finally:
            bgm.state = orig


if __name__ == "__main__":
    unittest.main()
