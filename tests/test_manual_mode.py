"""手動予約モード（auto/mode.json・auto/manual_pack.py）の単体テスト（ネットワーク・描画なし）"""
import datetime as dt, json, os, pathlib, runpy, sys, tempfile, time, unittest
from unittest import mock

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto"))
import alerts  # noqa: E402
import manual_pack as mp  # noqa: E402
import mode  # noqa: E402
import post  # noqa: E402

MANUAL = {"MANUAL_PLATFORMS": "ig facebook"}
SCH = {"defaults": {"platforms": ["ig", "tt", "yt", "facebook"], "yt_description": "d", "tag_sets": {"A": "#a #b #c #d #e"},
                    "fb_tag_sets": {"A": "#a #b #c"}, "fb_cta": "Tell us.\n教えて"},
       "posts": [{"date": "2026-10-27", "slot": "12:00", "ep": "ep1", "no": 9, "title": "一つ目", "tag_set": "A", "caption_en": "One", "caption_ja": "いち"},
                 {"date": "2026-10-29", "slot": "18:00", "ep": "ep2", "no": 10, "title": "二つ目", "tag_set": "A", "caption_en": "Two", "caption_ja": "に"},
                 {"date": "2026-11-20", "slot": "18:00", "ep": "ep3", "no": 11, "title": "先の回", "tag_set": "A", "caption_en": "Three", "caption_ja": "さん"}]}
TODAY = dt.date(2026, 10, 26)


class ModeTest(unittest.TestCase):
    def test_file_says_ig_and_facebook(self):
        env = {k: v for k, v in os.environ.items() if k != "MANUAL_PLATFORMS"}
        with mock.patch.dict(os.environ, env, clear=True):
            self.assertEqual(mode.manual_platforms(), {"ig", "facebook"})

    def test_post_skips_manual_platforms(self):
        now = dt.datetime(2026, 10, 27, 12, tzinfo=post.JST)
        with mock.patch.dict(os.environ, MANUAL), mock.patch.object(pathlib.Path, "read_text",
                                                                    lambda self, *a, **k: json.dumps(SCH) if self.name == "schedule.json" else "{}"):
            _, _, targets = post.pick_posts(None, now)
        self.assertEqual([(t[1]["ep"], t[2]) for t in targets], [("ep1", ["tt", "yt"])])


class TokenCheckManualTest(unittest.TestCase):
    def test_invalid_ig_is_not_an_error_in_manual_mode(self):
        class R:
            status_code = 200
            def json(self): return {"data": {"is_valid": False}}
        with tempfile.TemporaryDirectory() as d:
            cwd = os.getcwd(); os.chdir(d)
            try:
                env = {"IG_ACCESS_TOKEN": "EAAbad1234567890", "ALERTS_FILE": f"{d}/a.jsonl", **MANUAL}
                with mock.patch.dict(os.environ, env, clear=True), mock.patch("requests.get", lambda *a, **k: R()):
                    with self.assertRaises(SystemExit) as cm:
                        runpy.run_path(str(ROOT / "auto" / "token_check.py"), run_name="__main__")
                    self.assertEqual(alerts.load(), [])
                args = (pathlib.Path(d) / "dist" / "token_check_args").read_bytes().split(b"\0")
            finally: os.chdir(cwd)
        self.assertEqual(cm.exception.code, 0)
        self.assertIn("Instagram=手動予約モード中".encode(), args)
        self.assertIn("Facebook=手動予約モード中".encode(), args)
        self.assertEqual(args[args.index(b"--owner-action") + 1], b"none")


class PackTest(unittest.TestCase):
    def test_pending_and_mark(self):
        with mock.patch.dict(os.environ, MANUAL):
            posted = {"2026-10-27_ep1": {"ig": "manual"}}
            items = mp.pending(SCH, posted, TODAY, 8)
            self.assertEqual([(p["ep"], pls) for p, pls in items], [("ep1", ["facebook"]), ("ep2", ["ig", "facebook"])])
            done = mp.mark(SCH, posted, {"ep1", "ep2"}, dt.datetime(2026, 10, 26, 9, tzinfo=mp.JST))
            self.assertEqual(done, [("2026-10-27_ep1", ["facebook"]), ("2026-10-29_ep2", ["ig", "facebook"])])
            self.assertEqual(posted["2026-10-29_ep2"]["ig"], "manual")
            self.assertEqual(mp.pending(SCH, posted, TODAY, 8), [])
            # 記録した回は自動投稿でも出さない（手動予約モードを解除したあとも二重投稿しない）
            self.assertNotIn("ig", [x for x in SCH["defaults"]["platforms"] if x not in posted["2026-10-29_ep2"]])

    def test_texts(self):
        p = SCH["posts"][0]
        ig = mp.text_for(p, SCH["defaults"], "ig").split(mp.CUT + "\n", 1)[1]
        fb_ = mp.text_for(p, SCH["defaults"], "facebook").split(mp.CUT + "\n", 1)[1]
        self.assertTrue(ig.startswith("One\nいち")); self.assertIn("#e", ig)                  # Instagram：ハッシュタグ5個（既存の caption）
        self.assertTrue(fb_.startswith("One\nいち\n\nTell us.")); self.assertNotIn("#d", fb_)  # Facebook：fb_cta とハッシュタグ3個まで
        self.assertIn("カバー画像：ig_ep1_cover.jpg", mp.text_for(p, SCH["defaults"], "ig"))

    def test_main_builds_pack_and_hub_action(self):
        with tempfile.TemporaryDirectory() as d:
            vid = pathlib.Path(d) / "v.mp4"; vid.write_bytes(b"x")
            cover = pathlib.Path(d) / "c.jpg"; cover.write_bytes(b"j")
            state = {"posted": "{}"}
            orig_r, orig_w = pathlib.Path.read_text, pathlib.Path.write_text
            def r(self, *a, **k):
                if self.name == "schedule.json": return json.dumps(SCH)
                if self.name == "posted.json": return state["posted"]
                return orig_r(self, *a, **k)
            def w(self, data, *a, **k):
                if self.name == "posted.json": state["posted"] = data; return len(data)
                return orig_w(self, data, *a, **k)
            hub = {}
            def wb(self, data): hub[self.name] = data; return len(data)
            class Now(dt.datetime):
                @classmethod
                def now(cls, tz=None): return dt.datetime(2026, 10, 26, 10, tzinfo=tz)
            with mock.patch.dict(os.environ, {**MANUAL, "GITHUB_RUN_ID": "123", "ARTIFACT_NAME": "manual-20261026"}), \
                 mock.patch.object(pathlib.Path, "read_text", r), mock.patch.object(pathlib.Path, "write_text", w), \
                 mock.patch.object(pathlib.Path, "write_bytes", wb), mock.patch.object(mp.dt, "datetime", Now), \
                 mock.patch.object(post, "render", lambda ep: (vid, vid)), mock.patch.object(post, "qa_gate", lambda *a: True), \
                 mock.patch.object(post, "thumbnail", lambda p: cover), mock.patch.object(mp, "aspect", lambda p: (1080, 1920)):
                out = pathlib.Path(d) / "out"
                code = mp.main([str(out), "--mark", "ep1"])
                files = sorted(x.name for x in out.iterdir())
            self.assertEqual(code, 0)
            self.assertEqual(json.loads(state["posted"])["2026-10-27_ep1"]["facebook"], "manual")
            self.assertEqual(files, ["ep2.mp4", "fb_ep2.txt", "ig_ep2.txt", "ig_ep2_cover.jpg", "一覧.txt"])
            args = hub["manual_hub_args"].decode().split("\0")
            act = args[args.index("--owner-action") + 1]
            self.assertIn("今週の予約（Business Suite）：10/29（木）18:00「二つ目」", act)
            self.assertIn("manual-20261026", act); self.assertIn("/actions/runs/123", act)
            self.assertLessEqual(len(act), 300)

    def test_nothing_pending_clears_hub_action(self):
        self.assertEqual(mp.hub_action([], [], "manual-x", "u"), "none")


if __name__ == "__main__":
    unittest.main()
