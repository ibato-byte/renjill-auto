"""作業用BGM（YouTube 長尺）の絵の質の見張り（2026-11-15：1080p → 1440p・色の印）。

設定が 1 か所（auto/bgm.py）にあり、検査（auto/bgm_qa.py）・描く部品（rig/bgm/render.js）・実行の制限時間が、それに合っていること。
"""
import pathlib, re, sys, unittest
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "auto"))
import bgm  # noqa: E402


class BgmQualityTest(unittest.TestCase):
    def test_1440p(self):
        self.assertEqual((bgm.VIDEO_W, bgm.VIDEO_H), (2560, 1440))
        self.assertAlmostEqual(bgm.RENDER_SCALE, 2560 / 1920, places=6)
        self.assertEqual(bgm.VIDEO_W * 9, bgm.VIDEO_H * 16, "16:9 でない")

    def test_qa_expects_the_same_size(self):
        src = (ROOT / "auto" / "bgm_qa.py").read_text()
        self.assertIn(f"({bgm.VIDEO_W}, {bgm.VIDEO_H})", src, "検査が見る大きさが、作る大きさと違う")
        self.assertIn('"color_space") != "bt709"', src)

    def test_encode_has_color_tags_and_conversion(self):
        enc = [str(x) for x in bgm.ENC]
        for flag, val in (("-colorspace", "bt709"), ("-color_primaries", "bt709"), ("-color_trc", "bt709"), ("-color_range", "tv"), ("-pix_fmt", "yuv420p")):
            self.assertIn(flag, enc); self.assertEqual(enc[enc.index(flag) + 1], val)
        self.assertIn("in_color_matrix=bt601", bgm.COLOR_VF); self.assertIn("out_color_matrix=bt709", bgm.COLOR_VF)
        src = (ROOT / "auto" / "bgm.py").read_text()
        self.assertGreaterEqual(src.count("COLOR_VF"), 4, "色の直しが、つなぎ目（溶ける所）にも入っていること")

    def test_renderer_takes_scale_and_thumb_stays_1080(self):
        js = (ROOT / "rig" / "bgm" / "render.js").read_text()
        self.assertIn("deviceScaleFactor: k || 1", js)
        self.assertRegex(js, r"const p = await open\(\);\s*await p\.evaluate\(t => window\.setT\(t\), \+a4", "表紙（thumb）は 1 倍のまま（切り抜きの座標が 1920x1080 の前提）")
        self.assertIn("await open(SCALE)", js)
        self.assertIn('f"{RENDER_SCALE:.7f}"', (ROOT / "auto" / "bgm.py").read_text())

    def test_method_fingerprint_covers_video_settings(self):
        src = (ROOT / "auto" / "bgm.py").read_text()
        self.assertRegex(src, r"json\.dumps\(\[VIDEO_W, VIDEO_H, COLOR_VF, COLOR_TAGS,", "大きさ・色を変えたら、作り置きが「古い作り方」と分かること")

    def test_workflow_time_limits(self):
        for f in ("bgm.yml", "bgm-stock.yml"):
            y = (ROOT / ".github" / "workflows" / f).read_text()
            limits = [int(x) for x in re.findall(r"timeout-minutes:\s*(\d+)", y)]
            self.assertGreaterEqual(max(limits), 110, f"{f}：1440p で描く時間（1 本 25〜45 分の見込み）に対して制限時間が短い")


if __name__ == "__main__":
    unittest.main()
