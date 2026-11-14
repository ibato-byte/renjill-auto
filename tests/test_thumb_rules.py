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

    def test_far_frames_when_nearby_all_ng(self):
        # 2026-11-14「エレベーター」：ふきだしが 2.0〜6.6 秒ずっと出ていて、4.0±1.2 秒の候補が全部 NG → 投稿前の動画づくりが失敗した。
        # 近くがだめなら、ふきだしの出ていないコマ（2.0 秒より前・6.6 秒より後）まで候補にする。近いコマが先・エンドカードは外す
        import post
        ts = post.thumb_times(4.0, 9.5)
        self.assertEqual(ts[:7], [4.0, 3.6, 4.4, 3.2, 4.8, 2.8, 5.2])
        self.assertTrue(any(t < 2.0 for t in ts) and any(6.6 < t for t in ts), ts)
        self.assertTrue(all(0.3 <= t <= 9.5 - post.END_CARD_SEC for t in ts), ts)
        self.assertEqual(len(ts), len(set(ts)))
        # 台本の表紙の指定そのものも、ふきだしの出ていないコマにしてある
        import json
        sch = json.loads((ROOT / "auto/schedule.json").read_text(encoding="utf-8"))
        el = [p for p in sch["posts"] if p["ep"] == "elevator"][0]
        self.assertFalse(2.0 < el["thumb"]["t"] < 6.6, el["thumb"])

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
