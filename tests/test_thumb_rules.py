"""表紙の決まり（2026-11-10：おかしな表紙は絶対に出さない）"""
import pathlib, sys, unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto"))


class Thumb(unittest.TestCase):
    def test_fx_over_text_check_exists(self):
        src = (ROOT / "rig/thumb.js").read_text()
        self.assertIn("THUMB_FX_OVER_TEXT", src)   # 記号・効果が文字にかかったら作り直す
        self.assertIn("THUMB_BUSY_BACKGROUND", src)

    def test_retry_nearby_frames(self):
        import post
        self.assertEqual(post.thumb_times(2.6)[:3], [2.6, 2.2, 3.0])
        self.assertTrue(all(t >= 0.3 for t in post.thumb_times(0.5)))

    def test_no_end_card_frames(self):
        # 2026-11-12：7.6 が NG → 8.8（尺 9.5 のエンドカード）の薄い表紙になった。エンドカードのコマは候補にしない
        import post
        self.assertEqual(post.ep_dur("meeting"), 9.5)
        ts = post.thumb_times(7.6, 9.5)
        self.assertTrue(ts and all(t <= 9.5 - post.END_CARD_SEC for t in ts), ts)
        self.assertIn(7.6, ts)
        self.assertIsNone(post.ep_dur("__no_such_ep__"))

    def test_first_frame_hook_full_opacity(self):
        # 表紙＝最初のコマ（TikTok など）。冒頭の一言は最初のコマから濃さ100%（qa.js が見張る）
        self.assertIn("最初のコマで冒頭の一言が薄い", (ROOT / "rig/qa.js").read_text())

    def test_endcard_leftover_uses_scene_baseline(self):
        # 総見直し #200（2026-11-14）：机などの背景も fx に描くため、数そのもので警告すると全話に出て見張りにならなかった。
        # 「その回でいちばん少ないときの fx の数（背景）」との差で見る
        src = (ROOT / "rig/qa.js").read_text()
        self.assertIn("fxMin = Math.min(fxMin, r.fx)", src)
        self.assertIn("r.fx - fxMin > 3", src)
        self.assertNotIn("&& r.fx > 3)", src)
