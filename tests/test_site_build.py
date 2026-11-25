"""公式ページ（site/build.py）が、今の予定表と「全部の回が YouTube に出た」状態で落ちずに作れること。
2026-11-26：連載の series（辞書）を見出しに使って落ち、投稿のあとの公式ページの更新が止まった。"""
import importlib.util, json, pathlib, unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("site_build", ROOT / "site/build.py")
build = importlib.util.module_from_spec(spec); spec.loader.exec_module(build)


class SiteBuild(unittest.TestCase):
    def test_page_builds_with_every_post(self):
        sch = json.loads((ROOT / "auto/schedule.json").read_text())
        posted = {f'{p["date"]}_{p["ep"]}': {"yt": "x" * 11} for p in sch["posts"]}
        html = build.page(sch, build.episodes(sch, posted))
        self.assertIn("社員からのお土産", html)

    def test_series_name(self):
        self.assertEqual(build.series_name({"series": "A"}), "A")
        self.assertEqual(build.series_name({"series": {"id": "t", "part": 1}, "title": "社員からのお土産 Part 1「ひとくちだけ」"}), "社員からのお土産")
        self.assertEqual(build.series_name({"title": "x"}), "すべてのエピソード")
