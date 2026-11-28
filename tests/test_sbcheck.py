"""絵コンテの点検（auto/sbcheck.py。2026-11-28 総見直し・OVERHAUL 7・28・67・74）"""
import pathlib, sys, unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto"))
import sbcheck

GOOD = """オーナーのOK：未
# 試しの話
## 【試し Part 1】はじまり（12秒）
- 0〜2秒：朝のオフィス。モチが箱を頭で押す。
- 2〜8秒：箱が倒れる（この話の小さなオチ：箱が空だった）。
- 8〜9秒：オチの後のオチ。ふたがぱたん。
- 9〜12秒：静止。「フォローして待っててね／Follow us」
## 【試し Part 2】つづき（12秒）
- 0〜2秒：前回の絵。
- 2〜8秒：ユズが書類を口でくわえる（小さなオチ：書類も空）。
- 8〜9秒：耳がぴくっ。
- 9〜12秒：「フォローして最終話へ」
## 【試し Part 3】おわり（12秒）
- 0〜2秒：前回の絵。
- 2〜8秒：クリが小走り（小さなオチ：クリが箱に入る）。
- 8〜9秒：箱がぴょんと跳ねる。
- 9〜12秒：「次のお話もフォローしてね」
"""


class SbCheck(unittest.TestCase):
    def test_good_has_no_warnings(self):
        self.assertEqual(sbcheck.check_text(GOOD), [])

    def test_no_beat_after_ochi(self):
        t = GOOD.replace("- 8〜9秒：オチの後のオチ。ふたがぱたん。\n", "").replace("9〜12秒：静止", "8〜12秒：静止")
        self.assertTrue(any("オチの後のオチ" in w for w in sbcheck.check_text(t)))

    def test_arms_and_vanish(self):
        t = GOOD.replace("クリが小走り", "クリが両前足で挟んで抱きしめ、すっと消える")
        w = sbcheck.check_text(t)
        self.assertTrue(any("両前足" in x for x in w))
        self.assertTrue(any("消える" in x for x in w))

    def test_part2_must_open_with_recap(self):
        t = GOOD.replace("- 0〜2秒：前回の絵。\n- 2〜8秒：ユズ", "- 0〜2秒：朝。\n- 2〜8秒：ユズ", 1)
        self.assertTrue(any("前回" in w for w in sbcheck.check_text(t)))

    def test_long_opening_and_length(self):
        t = GOOD.replace("- 0〜2秒：朝のオフィス", "- 0〜6秒：朝のオフィス", 1).replace("9〜12秒：静止", "9〜40秒：静止")
        w = sbcheck.check_text(t)
        self.assertTrue(any("冒頭3秒" in x for x in w))
        self.assertTrue(any("尺 40" in x for x in w))

    def test_focus_lines_once(self):
        t = GOOD.replace("箱が倒れる", "集中線。箱が倒れる、集中線")
        self.assertTrue(any("集中線" in w for w in sbcheck.check_text(t)))


if __name__ == "__main__":
    unittest.main()
