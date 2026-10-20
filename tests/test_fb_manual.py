"""Facebook 手動予約の素材づくり（auto/fb_manual.py）の単体テスト（描画は呼ばない）"""
import json, pathlib, subprocess, sys, tempfile, unittest
from unittest import mock

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto"))
import fb_manual  # noqa: E402
import post  # noqa: E402

SCH = json.loads((ROOT / "auto" / "schedule.json").read_text())
EPS = ["papers2", "mug2", "chime2", "jil_morning2", "receipts2", "deadline2"]


class FbManualTest(unittest.TestCase):
    def test_text(self):
        p = fb_manual.find(SCH, "papers2")
        t = fb_manual.text_for(p, SCH["defaults"])
        self.assertTrue(t.startswith(f'予約日時（日本時間）：{p["date"]} {p["slot"]}'))
        body = t.split("----\n", 1)[1]
        self.assertTrue(body.startswith(p["caption_en"] + "\n" + p["caption_ja"]))
        self.assertIn("コメントで教えてください", body)
        tags = [w for w in body.split() if w.startswith("#")]
        self.assertLessEqual(len(tags), 3)
        self.assertNotIn("レン＆ジル", body)

    def test_all_six_with_mocked_render(self):
        with tempfile.TemporaryDirectory() as d:
            vid = pathlib.Path(d) / "v.mp4"; vid.write_bytes(b"x")
            with mock.patch.object(post, "render", lambda ep: (vid, vid)), mock.patch.object(post, "qa_gate", lambda *a: True), \
                 mock.patch.object(fb_manual, "aspect", lambda p: (1080, 1920)):
                code = fb_manual.main([d + "/out"] + EPS)
            out = pathlib.Path(d) / "out"
            self.assertEqual(code, 0)
            for ep in EPS:
                self.assertTrue((out / f"fb_{ep}.mp4").exists(), ep); self.assertTrue((out / f"fb_{ep}.txt").exists(), ep)
            self.assertEqual(len((out / "一覧.txt").read_text().strip().splitlines()), 6 + 4)

    def test_qa_ng_has_no_video(self):
        with tempfile.TemporaryDirectory() as d:
            with mock.patch.object(post, "render", lambda ep: (pathlib.Path("a"), pathlib.Path("b"))), mock.patch.object(post, "qa_gate", lambda *a: False):
                code = fb_manual.main([d, "mug2"])
            self.assertEqual(code, 1)
            self.assertFalse((pathlib.Path(d) / "fb_mug2.mp4").exists())
            self.assertIn("予約しないでください", (pathlib.Path(d) / "一覧.txt").read_text())


if __name__ == "__main__":
    unittest.main()
