"""部屋の見た目の割り当て（auto/looks.py）のテスト：続けて同じ部屋にならない・ファイルが最新"""
import json, pathlib, sys, unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto"))
import looks


class Looks(unittest.TestCase):
    def test_no_repeat_within_4(self):
        m = looks.assign(looks.all_posts())
        order = [e for e in m if looks.is_office(e)]   # 専用のセットの回（エレベーターなど）は部屋を使わない
        for i in range(len(order)):
            prev = [m[e] for e in order[max(0, i - 3):i]]
            self.assertNotIn(m[order[i]], prev, order[i])

    def test_special_sets_do_not_count(self):
        """専用のセットの回は数えない（2026-11-19：エレベーター3話のあとの会社の回が、3話前の会社の回と同じ部屋になった）"""
        posts = [{"date": f"2026-12-0{i}", "ep": e} for i, e in enumerate(["a", "b", "c", "set1", "set2", "set3", "d"], 1)]
        m = looks.assign(posts, office=lambda e: not e.startswith("set"))
        self.assertEqual([m[e] for e in "abcd"], [0, 1, 2, 3])

    def test_file_up_to_date(self):
        self.assertEqual((ROOT / "rig/v2/looks.js").read_text(), looks.render(looks.assign(looks.all_posts())),
                         "rig/v2/looks.js が古い：python3 auto/looks.py を実行")

    def test_lib_uses_table(self):
        lib = (ROOT / "rig/v2/lib.js").read_text()
        self.assertIn("LOOK_ALL", lib)
        self.assertIn("looks.js", (ROOT / "rig/ep.html").read_text())
