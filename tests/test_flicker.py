"""ちかちか（描きかけのコマ）の見張り。2026-11-15 事故：「10分の会議」が、絵が 1 コマだけ抜けるコマ 27 枚入りで出た。"""
import pathlib, subprocess, sys, tempfile, unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto"))
import flicker  # noqa: E402


def make(path, bad):
    """灰色の地に、ゆっくり動く箱。bad のコマだけ下半分が白く抜ける"""
    d = tempfile.mkdtemp()
    for i in range(30):
        vf = f"drawbox=x={20 + i * 4}:y=100:w=60:h=60:color=black:t=fill"
        if i in bad: vf += ",drawbox=x=0:y=240:w=270:h=120:color=white:t=fill"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "color=c=0x999999:s=270x480", "-frames:v", "1", "-vf", vf, f"{d}/f{i:04d}.jpg"], check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "30", "-i", f"{d}/f%04d.jpg", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", str(path)], check=True)
    return d


class Flicker(unittest.TestCase):
    def test_clean_video_passes(self):
        with tempfile.TemporaryDirectory() as t:
            p = pathlib.Path(t) / "ok.mp4"; d = make(p, [])
            self.assertEqual(flicker.find(str(p)), [])
            self.assertEqual(flicker.find(d), [])

    def test_one_frame_dropout_is_caught(self):
        with tempfile.TemporaryDirectory() as t:
            p = pathlib.Path(t) / "ng.mp4"; d = make(p, [12, 20])
            self.assertEqual([x[0] for x in flicker.find(str(p))], [13, 21])
            self.assertEqual([x[0] for x in flicker.find(d)], [13, 21])

    def test_cut_is_not_flicker(self):
        # 場面の切りかわり（変わったまま戻らない）は、ちかちかではない
        with tempfile.TemporaryDirectory() as t:
            p = pathlib.Path(t) / "cut.mp4"; make(p, list(range(15, 30)))
            self.assertEqual(flicker.find(str(p)), [])

    def test_gate_and_renderers_use_it(self):
        self.assertIn("flicker.find(str(path))", (ROOT / "auto/qa.py").read_text())
        for f in ("rig/render-ep.js", "rig/bgm/render.js"):
            s = (ROOT / f).read_text()
            self.assertIn("settled(p,", s.replace("settled(p, ", "settled(p,"))
            self.assertNotIn("p.screenshot({path:`${dir}", s)   # 1 回撮っただけの絵をそのまま保存しない
        self.assertIn("a.equals(b)", (ROOT / "rig/settled.js").read_text())
        self.assertIn("flicker.find(str(fr[i]))", (ROOT / "auto/bgm.py").read_text())   # 長い動画も、章ごとに見る


if __name__ == "__main__":
    unittest.main()


def test_unpost_resets_manual_tiktok():
    """やり直しのとき、TikTok（手動）の記録を外して、置き場の動画を新しい絵に差し替えさせる"""
    import pathlib
    src = (pathlib.Path(__file__).resolve().parent.parent / "auto" / "unpost.py").read_text()
    assert 'rec.get("tt") == "manual"' in src and 'rec.pop("tt", None)' in src
