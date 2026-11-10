"""部屋の見た目の割り当て（auto/looks.py）のテスト：続けて同じ部屋にならない・ファイルが最新"""
import json, pathlib, sys, unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto"))
import looks


class Looks(unittest.TestCase):
    def test_no_repeat_within_4(self):
        posts = json.loads((ROOT / "auto/schedule.json").read_text())["posts"]
        m = looks.assign(posts)
        order = list(m)
        for i in range(len(order)):
            prev = [m[e] for e in order[max(0, i - 3):i]]
            self.assertNotIn(m[order[i]], prev, order[i])

    def test_file_up_to_date(self):
        posts = json.loads((ROOT / "auto/schedule.json").read_text())["posts"]
        self.assertEqual((ROOT / "rig/v2/looks.js").read_text(), looks.render(looks.assign(posts)),
                         "rig/v2/looks.js が古い：python3 auto/looks.py を実行")

    def test_lib_uses_table(self):
        lib = (ROOT / "rig/v2/lib.js").read_text()
        self.assertIn("LOOK_ALL", lib)
        self.assertIn("looks.js", (ROOT / "rig/ep.html").read_text())
