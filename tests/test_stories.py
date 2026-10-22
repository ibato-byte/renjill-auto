"""ストーリーズ・再生リスト・カルーセル（依頼 #35）の単体テスト（ネットワークに出ない）"""
import os, pathlib, sys, tempfile, unittest
from unittest import mock

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto"))
import stories  # noqa: E402

D = {"platforms": ["ig", "tt", "yt", "facebook"]}


class R:
    def __init__(self, j): self._j = j; self.status_code = 200; self.text = str(j)
    def json(self): return self._j


class Http:
    """呼ばれた順に返事を返す、偽の requests"""
    def __init__(self, quota=(100, 0), status="FINISHED"):
        self.calls = []; self.quota = quota; self.status = status
    def get(self, url, params=None, **kw):
        self.calls.append(("GET", url))
        if url.endswith("/content_publishing_limit"):
            return R({"data": [{"quota_usage": self.quota[1], "config": {"quota_total": self.quota[0]}}]})
        return R({"status_code": self.status})
    def post(self, url, data=None, **kw):
        self.calls.append(("POST", url, dict(data) if isinstance(data, dict) else {}))
        if url.endswith("/media_publish"): return R({"id": "PUB1"})
        if url.endswith("/video_stories") and (data if isinstance(data, dict) else {}).get("upload_phase") == "start": return R({"video_id": "V1", "upload_url": "https://rupload.facebook.com/x"})
        if url.endswith("/video_stories"): return R({"success": True, "post_id": "S1"})
        if "rupload" in url: return R({"success": True})
        return R({"id": f"C{len(self.calls)}"})


class ExtrasTest(unittest.TestCase):
    def test_story_follows_reel_only(self):
        p = {"ep": "a"}
        self.assertEqual(stories.extras_for(p, D, {}, {"ig", "facebook", "yt", "tt"}), ["ig_story", "fb_story", "bsky"])
        self.assertEqual(stories.extras_for(p, D, {}, {"tt"}), [])  # 本編が出ない SNS にはつけない
        self.assertEqual(stories.extras_for(p, D, {"ig": "1", "ig_story": "2"}, set()), [])  # 出済みは二重に出さない
        self.assertEqual(stories.extras_for(p, D, {"ig": "1"}, set()), ["ig_story"])  # 本編は出済み・ストーリーズだけ未
        self.assertEqual(stories.extras_for({"story": False}, D, {}, {"ig", "facebook"}), [])

    def test_playlist_and_carousel_need_opt_in(self):
        self.assertNotIn("yt_playlist", stories.extras_for({}, D, {}, {"yt"}))
        self.assertIn("yt_playlist", stories.extras_for({"series": "職場あるある"}, D, {}, {"yt"}))
        p = {"platforms": ["ig", "ig_carousel"], "carousel": {"images": ["a.png", "b.png"]}}
        self.assertIn("ig_carousel", stories.extras_for(p, D, {}, {"ig"}))
        self.assertNotIn("ig_carousel", stories.extras_for({"platforms": ["ig", "ig_carousel"]}, D, {}, {"ig"}))


class HighlightTest(unittest.TestCase):
    def test_never_reaches_the_punchline(self):
        for total in (8, 13, 20, 30):
            s, d = stories.highlight_window({}, total)
            self.assertLessEqual(s + d, total * 0.6 + 1e-6)
            self.assertGreaterEqual(d, 1)
        self.assertEqual(stories.highlight_window({"story": {"start": 1, "dur": 4}}, 30), (1.0, 4.0))
        self.assertLessEqual(sum(stories.highlight_window({"story": {"start": 0, "dur": 99}}, 10)), 6.0)


class QuotaTest(unittest.TestCase):
    def test_quota_blocks_near_limit(self):
        self.assertEqual(stories.ig_quota("U", "T", Http(quota=(100, 3))), 97)
        with self.assertRaises(stories.StorySkip): stories.ig_check_quota("U", "T", 1, Http(quota=(100, 97)))
        stories.ig_check_quota("U", "T", 1, Http(quota=(100, 50)))

    def test_unreadable_quota_skips(self):
        class Bad(Http):
            def get(self, url, params=None, **kw): raise RuntimeError("x")
        with self.assertRaises(stories.StorySkip): stories.ig_check_quota("U", "T", 1, Bad())


class PostTest(unittest.TestCase):
    def test_ig_story_container_is_stories(self):
        h = Http()
        self.assertEqual(stories.post_ig_story("U", "T", "https://x/s.mp4", http=h, sleep=lambda s: None), "PUB1")
        media = [c for c in h.calls if c[0] == "POST" and c[1].endswith("/U/media")][0][2]
        self.assertEqual(media["media_type"], "STORIES"); self.assertEqual(media["video_url"], "https://x/s.mp4")

    def test_ig_story_not_published_when_over_quota(self):
        h = Http(quota=(100, 98))
        with self.assertRaises(stories.StorySkip): stories.post_ig_story("U", "T", "u", http=h, sleep=lambda s: None)
        self.assertFalse([c for c in h.calls if c[0] == "POST"])

    def test_carousel(self):
        h = Http()
        self.assertEqual(stories.post_ig_carousel("U", "T", ["a", "b", "c"], "cap", http=h, sleep=lambda s: None), "PUB1")
        kinds = [c[2].get("media_type") or ("child" if c[2].get("is_carousel_item") else None) for c in h.calls if c[0] == "POST" and c[1].endswith("/U/media")]
        self.assertEqual(kinds, ["child", "child", "child", "CAROUSEL"])
        with self.assertRaises(stories.StorySkip): stories.post_ig_carousel("U", "T", ["a"], "c", http=h, sleep=lambda s: None)

    def test_carousel_monthly_cap(self):
        posted = {"k1": {"ig_carousel_at": "2026-10-03T12:00"}, "k2": {"ig_carousel_at": "2026-10-20T12:00"}, "k3": {"ig_carousel_at": "2026-09-30T12:00"}}
        self.assertEqual(stories.carousel_left(posted, "2026-10"), 0)
        self.assertEqual(stories.carousel_left(posted, "2026-11"), 2)

    def test_fb_story_three_steps(self):
        h = Http()
        with tempfile.NamedTemporaryFile(suffix=".mp4") as f:
            f.write(b"x"); f.flush()
            self.assertEqual(stories.post_fb_story("PG", "T", f.name, http=h), "S1")
        phases = [c[2].get("upload_phase") for c in h.calls if c[0] == "POST" and c[1].endswith("/video_stories")]
        self.assertEqual(phases, ["start", "finish"])

    def test_playlist_reuses_existing(self):
        yt = mock.MagicMock()
        yt.playlists().list().execute.return_value = {"items": [{"id": "PL1", "snippet": {"title": "職場あるある"}}]}
        self.assertEqual(stories.add_to_playlist(yt, "VID", "職場あるある"), "PL1")
        yt.playlists().insert.assert_not_called()
        yt.playlistItems().insert.assert_called()


class VideoTest(unittest.TestCase):
    @unittest.skipUnless(__import__("shutil").which("ffmpeg"), "ffmpeg なし")
    def test_build_is_vertical_and_ends_with_card(self):
        import subprocess
        with tempfile.TemporaryDirectory() as d:
            src, out = f"{d}/l.mp4", f"{d}/s.mp4"
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc=s=1080x1920:d=12:r=30", "-pix_fmt", "yuv420p", src], check=True)
            if not stories._font(): self.skipTest("日本語フォントなし")
            stories.build_story_video({}, src, out)
            info = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "stream=width,height:format=duration", "-of", "csv=p=0", out]).decode()
            self.assertIn("1080,1920", info)
            self.assertAlmostEqual(stories._duration(out), 4.8 + stories.END_CARD_SEC, delta=0.3)


if __name__ == "__main__":
    unittest.main()


class PostExtraTest(unittest.TestCase):
    """post.py の post_extra：本編が出ていなければ出さない・失敗しても止めない・出せたら ID を残す"""
    def setUp(self):
        import post; self.post = post
        self.p = {"ep": "mug2", "title": "t", "series": "S"}

    def run_extra(self, pl, rec, acc, **patches):
        results = {}
        with mock.patch.dict(os.environ, {"IG_ACCESS_TOKEN": "T"}):
            with mock.patch.object(self.post.stories, "build_story_video", lambda *a, **k: pathlib.Path("/tmp/x.mp4")), \
                 mock.patch.object(self.post, "media_publish", lambda *a, **k: "https://x/u.mp4"), \
                 mock.patch.object(self.post.stories, "post_ig_story", patches.get("ig", lambda *a, **k: "ST1")):
                self.post.post_extra(pl, "k", self.p, {"platforms": []}, rec, pathlib.Path("/tmp/l.mp4"), acc, results, {})
        return results

    def test_ok_records_id(self):
        rec = {"ig": "R1"}
        r = self.run_extra("ig_story", rec, {"ig_user_id": "U"})
        self.assertEqual(rec["ig_story"], "ST1"); self.assertIn("ig_story_at", rec); self.assertEqual(r["ストーリーズ"], "投稿OK")

    def test_skip_without_reel(self):
        for rec in ({}, {"ig": "manual"}, {"ig": "bs-scheduled"}):
            r = self.run_extra("ig_story", rec, {"ig_user_id": "U"})
            self.assertNotIn("ig_story", rec); self.assertIn("見送り", r["ストーリーズ"])

    def test_failure_does_not_raise_or_record(self):
        def boom(*a, **k): raise RuntimeError("x")
        rec = {"ig": "R1"}
        r = self.run_extra("ig_story", rec, {"ig_user_id": "U"}, ig=boom)
        self.assertNotIn("ig_story", rec); self.assertIn("失敗", r["ストーリーズ"])

    def test_quota_skip(self):
        def over(*a, **k): raise stories.StorySkip("上限")
        rec = {"ig": "R1"}
        r = self.run_extra("ig_story", rec, {"ig_user_id": "U"}, ig=over)
        self.assertNotIn("ig_story", rec); self.assertIn("見送り", r["ストーリーズ"])
