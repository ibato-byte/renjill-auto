"""構図の見張り（2026-11-15）：キャラクターが半分切れたまま長く映らない・エンドカードの上に物が残らない。
描く検査そのもの（rig/qa.js）は 3 日前チェックで動く。ここでは、その決まりが消されていないことを確かめる。"""
import pathlib, re, unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
QA = (ROOT / "rig" / "qa.js").read_text(encoding="utf-8")


class Framing(unittest.TestCase):
    def test_long_cut_is_a_failure(self):
        # 2.5 秒以上、体が半分切れたまま → 不合格（issues）。1 秒以上は知らせる（warns）
        self.assertRegex(QA, r"cutT\[id\] \|\| 0\) >= 2\.5\) issues\.push")
        self.assertRegex(QA, r"cutT\[id\] \|\| 0\) >= 1\) warns\.push")

    def test_fully_offstage_is_not_cut(self):
        # 舞台の外で出番を待つ・退場した（まったく映っていない）は数えない。寄り（z 1.6）も数えない
        self.assertIn("vis > 0.02 && vis < 0.6 && r.z < 1.58", QA)

    def test_nothing_on_top_of_the_end_card(self):
        # エンドカードだけのコマと、そのままのコマが同じ（上に物が無い）ことを、不合格として見る
        self.assertIn("エンドカードの上に物が残っている", QA)
        self.assertRegex(QA, r"Math\.abs\(full\.length - base\.length\) > 200\) issues\.push")
        self.assertNotRegex(QA, r"warns\.push\(`エンドカード直前に")  # 22 話で誤って出ていた古い警告は戻さない

    def test_camfit_tool_exists(self):
        s = (ROOT / "rig" / "camfit.js").read_text(encoding="utf-8")
        self.assertIn("--write", s)
        self.assertIn("NEED = .66", s)

    def test_camera_keys_stay_in_the_one_line_form(self):
        # camfit.js が読める形（1 行 1 キー）を、新しい回でも守る：L.camAt を使う回の 9 割以上が読めること
        ok = bad = 0
        for f in sorted((ROOT / "rig" / "ep").glob("*.js")):
            s = f.read_text(encoding="utf-8")
            m = re.search(r"L\.camAt\(\[\s*\n([\s\S]*?)\], t\)", s)
            if not m:
                continue
            lines = [l for l in m.group(1).split("\n") if l.strip().startswith("{")]
            keys = re.findall(r"\{ *t: *[0-9.]+, *z: *[0-9.]+, *cx: *[0-9.\-]+, *cy: *[0-9.\-]+(?:, *d: *[0-9.]+)? *\}", m.group(1))
            if len(keys) == len(lines):
                ok += 1
            else:
                bad += 1
        self.assertGreater(ok, 30)
        self.assertLessEqual(bad, max(3, ok // 10))


if __name__ == "__main__":
    unittest.main()
