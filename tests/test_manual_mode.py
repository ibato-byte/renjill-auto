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
    def test_file_says_none(self):
        """2026-10-21 に手動予約モードを解除（Instagram・Facebook も API で投稿する）"""
        env = {k: v for k, v in os.environ.items() if k != "MANUAL_PLATFORMS"}
        with mock.patch.dict(os.environ, env, clear=True):
            self.assertEqual(mode.manual_platforms(), set())

    def test_post_skips_manual_platforms(self):
        now = dt.datetime(2026, 10, 27, 12, tzinfo=post.JST)
        with mock.patch.dict(os.environ, MANUAL), mock.patch.object(pathlib.Path, "read_text",
                                                                    lambda self, *a, **k: json.dumps(SCH) if self.name == "schedule.json" else "{}"):
            _, _, targets = post.pick_posts(None, now)
        self.assertEqual([(t[1]["ep"], t[2]) for t in targets], [("ep1", ["tt", "yt", "bsky"])])


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
        self.assertIn("Instagram・Facebook=手動予約モード中".encode(), args)
        self.assertEqual(args[args.index(b"--owner-action") + 1], b"none")


class PackTest(unittest.TestCase):
    NOW = dt.datetime(2026, 10, 26, 9, 30, tzinfo=mp.JST)  # 月曜 9:30（保険の cron の時刻）

    def test_week_window(self):
        s, e = mp.week_window(self.NOW)
        self.assertEqual((s.isoformat(), e.isoformat()), ("2026-10-26T12:00:00+09:00", "2026-11-02T11:59:00+09:00"))
        s2, _ = mp.week_window(dt.datetime(2026, 10, 29, 15, tzinfo=mp.JST))  # 木曜でもその週の月曜から
        self.assertEqual(s2, s)

    def test_pending_window_and_done(self):
        with mock.patch.dict(os.environ, MANUAL):
            posted = {"2026-10-27_ep1": {"ig": "manual"}, "2026-10-29_ep2": {"facebook": "12345"}}
            items = mp.pending(SCH, posted, self.NOW)
            # ep3（11/20）は週の外。manual・投稿ID のある SNS は除く
            self.assertEqual([(p["ep"], pls) for p, pls in items], [("ep1", ["facebook"]), ("ep2", ["ig"])])
            # bs-scheduled は同じ週の作り直しでも残る（manifest の中身が変わらない）
            posted["2026-10-27_ep1"]["facebook"] = mp.BS
            self.assertEqual([(p["ep"], pls) for p, pls in mp.pending(SCH, posted, self.NOW)], [("ep1", ["facebook"]), ("ep2", ["ig"])])
            # 時刻が過ぎた回は出さない
            self.assertEqual([p["ep"] for p, _ in mp.pending(SCH, posted, dt.datetime(2026, 10, 28, 9, tzinfo=mp.JST))], ["ep2"])

    def test_mark_manual(self):
        with mock.patch.dict(os.environ, MANUAL):
            posted = {"2026-10-27_ep1": {"ig": mp.BS}}
            done = mp.mark(SCH, posted, {"ep1"}, self.NOW)
            self.assertEqual(done, [("2026-10-27_ep1", ["ig", "facebook"])])
            self.assertEqual(posted["2026-10-27_ep1"]["ig"], "manual")
            self.assertEqual([p["ep"] for p, _ in mp.pending(SCH, posted, self.NOW)], ["ep2"])

    def test_captions(self):
        p, d = SCH["posts"][0], SCH["defaults"]
        self.assertEqual(mp.caption_ig(p, d), "One\nいち\n\nTell us.\n教えて\n\n#a #b #c #d #e")  # en → ja → コメントを誘う一言 → tag_set
        self.assertTrue(mp.caption_for(p, d, "facebook").startswith("One\nいち\n\nTell us."))
        self.assertNotIn("#d", mp.caption_for(p, d, "facebook"))  # Facebook はハッシュタグ3個まで
        self.assertIn("カバー画像：ig_ep1_cover.jpg", mp.text_for(p, d, "ig"))

    def run_main(self, posted, argv=()):
        with tempfile.TemporaryDirectory() as d:
            vid = pathlib.Path(d) / "v.mp4"; vid.write_bytes(b"x")
            cover = pathlib.Path(d) / "c.jpg"; cover.write_bytes(b"j")
            state = {"posted": json.dumps(posted)}
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
            now = self.NOW
            class Now(dt.datetime):
                @classmethod
                def now(cls, tz=None): return now
            with mock.patch.dict(os.environ, {**MANUAL, "GITHUB_RUN_ID": "123", "ARTIFACT_NAME": "manual-20261026"}), \
                 mock.patch.object(pathlib.Path, "read_text", r), mock.patch.object(pathlib.Path, "write_text", w), \
                 mock.patch.object(pathlib.Path, "write_bytes", wb), mock.patch.object(mp.dt, "datetime", Now), \
                 mock.patch.object(post, "render", lambda ep: (vid, vid)), mock.patch.object(post, "qa_gate", lambda *a: True), \
                 mock.patch.object(post, "thumbnail", lambda p: cover), mock.patch.object(mp, "aspect", lambda p: (1080, 1920)):
                out = pathlib.Path(d) / "out"
                code = mp.main([str(out), *argv])
                files = sorted(x.name for x in out.iterdir())
                manifest = json.loads(orig_r(out / "manifest.json"))
        return code, json.loads(state["posted"]), files, manifest, hub["manual_hub_args"].decode().split("\0")

    def test_main_manifest_and_bs_scheduled(self):
        code, posted, files, man, args = self.run_main({"2026-10-27_ep1": {"ig": "manual"}})
        self.assertEqual(code, 0)
        self.assertEqual(files, ["ep1.mp4", "ep2.mp4", "fb_ep1.txt", "fb_ep2.txt", "ig_ep2.txt", "ig_ep2_cover.jpg", "manifest.json", "一覧.txt"])
        self.assertEqual(man["week_start"], "2026-10-26T12:00:00+09:00")
        self.assertEqual([(m["ep"], m["datetime_jst"], m["platforms"]) for m in man["posts"]],
                         [("ep1", "2026-10-27T12:00:00+09:00", ["facebook"]), ("ep2", "2026-10-29T18:00:00+09:00", ["ig", "facebook"])])
        m2 = man["posts"][1]
        self.assertEqual((m2["title"], m2["video"], m2["cover_ig"]), ("二つ目", "ep2.mp4", "ig_ep2_cover.jpg"))
        self.assertTrue(m2["caption_ig"].startswith("Two\nに\n\nTell us.")); self.assertTrue(m2["caption_fb"].startswith("Two\nに"))
        self.assertNotIn("caption_ig", man["posts"][0])
        # manifest に入れた回は bs-scheduled（ig=manual はそのまま）
        self.assertEqual((posted["2026-10-27_ep1"]["ig"], posted["2026-10-27_ep1"]["facebook"]), ("manual", mp.BS))
        self.assertEqual((posted["2026-10-29_ep2"]["ig"], posted["2026-10-29_ep2"]["facebook"]), (mp.BS, mp.BS))
        self.assertEqual(args[args.index("--owner-action") + 1], "none")
        self.assertIn("今週の予約=2本", args)
        # 同じ週にもう一度作っても、manifest の中身は同じ（Chrome 側が同じ回を二重に予約しないよう、予約済みかは Business Suite で確かめる）
        code2, posted2, _, man2, _ = self.run_main(posted)
        self.assertEqual([m["ep"] for m in man2["posts"]], ["ep1", "ep2"])
        self.assertEqual(posted2, posted)
        # 自動投稿は bs-scheduled の SNS を出さない（自動に戻したあとの二重投稿を防ぐ）
        with mock.patch.dict(os.environ, {"MANUAL_PLATFORMS": ""}), mock.patch.object(pathlib.Path, "read_text",
                lambda self, *a, **k: json.dumps(SCH) if self.name == "schedule.json" else json.dumps(posted2)):
            _, _, targets = post.pick_posts(None, dt.datetime(2026, 10, 29, 18, tzinfo=post.JST))
        self.assertEqual([(t[1]["ep"], t[2]) for t in targets], [("ep2", ["tt", "yt", "bsky"])])


class MetricsManualTest(unittest.TestCase):
    """数値の収集：手動予約モードの Instagram・Facebook は API を呼ばず、正常終了して Hub に「手動予約モード中」と出す"""
    def test_metrics_skips_ig_and_fb(self):
        import shutil, subprocess
        with tempfile.TemporaryDirectory() as d:
            shutil.copytree(ROOT / "auto", pathlib.Path(d) / "auto", ignore=shutil.ignore_patterns("__pycache__"))
            (pathlib.Path(d) / "content").mkdir()
            (pathlib.Path(d) / "auto" / "posted.json").write_text(json.dumps({"2026-10-27_ep1": {"ig": "1789", "facebook": "999", "tag_set": "A"}}))
            env = {"PATH": os.environ["PATH"], "MANUAL_PLATFORMS": "ig facebook", "IG_ACCESS_TOKEN": "EAAbad", "FB_PAGE_TOKEN": "EAAbad"}
            r = subprocess.run([sys.executable, "-I", str(pathlib.Path(d) / "auto" / "metrics.py")], env=env, capture_output=True, text=True, timeout=60,
                               cwd=d)
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertIn("手動予約モード", r.stdout)
            args = (pathlib.Path(d) / "dist" / "metrics_hub_args").read_bytes().split(b"\0")
            self.assertIn("Instagram=手動予約モード中".encode(), args); self.assertIn("Facebook=手動予約モード中".encode(), args)
            self.assertFalse((pathlib.Path(d) / "dist" / "alerts.jsonl").exists())
            rows = (pathlib.Path(d) / "content" / "metrics.csv").read_text().strip().splitlines()
            self.assertEqual(len(rows), 1)  # 見出しだけ（IG・FB の行は書かない）
