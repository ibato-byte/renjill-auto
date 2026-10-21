"""Instagram・Facebook の API 投稿に戻したとき（2026-10-21）の単体テスト（ネットワークに出ない）"""
import datetime as dt, json, os, pathlib, runpy, sys, tempfile, time, unittest
from unittest import mock

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto"))
import alerts  # noqa: E402
import facebook as fb  # noqa: E402
import post  # noqa: E402

TOK = "EAAsystemuser1234567890"
BS_EPS = ("2026-10-23_mug2", "2026-10-25_chime2", "2026-10-26_jil_morning2", "2026-10-28_receipts2", "2026-10-30_deadline2")


class R:
    status_code = 200
    def __init__(self, j): self._j = j
    def json(self): return self._j


def run_token_check(debug, page, extra_env=None):
    def get(url, params=None, timeout=None, headers=None):
        assert "graph.facebook.com" in url, url
        return R({"data": debug}) if url.endswith("/debug_token") else R(page)
    with tempfile.TemporaryDirectory() as d:
        env = {"IG_ACCESS_TOKEN": TOK, "ALERTS_FILE": f"{d}/a.jsonl", "MANUAL_PLATFORMS": "", **(extra_env or {})}
        cwd = os.getcwd(); os.chdir(d)
        try:
            with mock.patch.dict(os.environ, env, clear=True), mock.patch("requests.get", get), \
                 mock.patch("sys.stdout.write", lambda *a: None):
                with unittest.TestCase().assertRaises(SystemExit) as cm:
                    runpy.run_path(str(ROOT / "auto" / "token_check.py"), run_name="__main__")
                keys = [a["key"] for a in alerts.load()]
            raw = (pathlib.Path(d) / "dist" / "token_check_args").read_bytes()
        finally: os.chdir(cwd)
    return cm.exception.code, keys, [a.decode() for a in raw.split(b"\0")], raw


PAGE = {"id": fb.PAGE_ID, "name": "レンとジル Ren & Jill", "access_token": "EAApage1234567890", "instagram_business_account": {"id": "17841400000"}}
OK = {"is_valid": True, "type": "SYSTEM_USER", "expires_at": 0, "data_access_expires_at": 0, "scopes": list(fb.ALL_SCOPES)}


class TokenCheckTest(unittest.TestCase):
    def test_ok_no_expiry(self):
        code, keys, args, raw = run_token_check(OK, PAGE, {"IG_USER_ID": "17841400000", "FB_PAGE_ID": fb.PAGE_ID})
        self.assertEqual(code, 0); self.assertEqual(keys, [])
        self.assertIn("Meta トークン=期限なし", args); self.assertIn("Meta 権限=すべてOK", args)
        self.assertIn(f"Facebook=OK（ページ {fb.PAGE_ID}・Secret の FB_PAGE_ID と一致）", args)
        self.assertIn("Instagram=OK（ID 17841400000・Secret と一致）", args)
        self.assertNotIn(TOK.encode(), raw); self.assertNotIn(b"EAApage", raw)

    def test_secret_mismatch_is_reported_not_error(self):
        code, _, args, _ = run_token_check(OK, PAGE, {"IG_USER_ID": "17841499999", "FB_PAGE_ID": "1386940331166810"})
        self.assertEqual(code, 0)
        self.assertTrue(any("Secret と不一致" in a for a in args))
        self.assertTrue(any("FB_PAGE_ID は別の値" in a for a in args))
        self.assertFalse(any("17841499999" in a or "1386940331166810" in a for a in args))  # Secret の値は出さない

    def test_missing_scope_is_failure(self):
        d = dict(OK, scopes=[s for s in fb.ALL_SCOPES if s != "instagram_content_publish"])
        code, keys, args, _ = run_token_check(d, PAGE)
        self.assertEqual(code, 1); self.assertIn("check:IG_ACCESS_TOKEN", keys)
        self.assertIn("Meta 権限=不足1件", args)
        self.assertTrue(any("instagram_content_publish" in a for a in args))

    def test_expiring_token(self):
        d = dict(OK, expires_at=int(time.time()) + 10 * 86400 + 3600)
        code, keys, args, _ = run_token_check(d, PAGE)
        self.assertEqual(code, 0); self.assertIn("Meta トークン=残り10日", args); self.assertIn("check:IG_ACCESS_TOKEN", keys)

    def test_invalid_token(self):
        code, keys, args, _ = run_token_check({"is_valid": False}, PAGE)
        self.assertEqual(code, 1); self.assertIn("Meta トークン=無効", args); self.assertIn("check:IG_ACCESS_TOKEN", keys)

    def test_page_not_assigned(self):
        code, keys, args, _ = run_token_check(OK, {"error": {"code": 100, "message": "Unsupported get request"}})
        self.assertEqual(code, 1); self.assertIn("Facebook=ページトークンが取れない", args); self.assertIn("check:FB_PAGE", keys)

    def test_no_instagram(self):
        code, keys, args, _ = run_token_check(OK, {k: v for k, v in PAGE.items() if k != "instagram_business_account"})
        self.assertEqual(code, 1); self.assertIn("Instagram=ID が取れない", args); self.assertIn("check:IG_USER_ID", keys)


class PostedTest(unittest.TestCase):
    def test_bs_scheduled_not_posted_again(self):
        """Business Suite で予約済みの5回は、API で Instagram・Facebook に出さない"""
        posted = json.loads((ROOT / "auto" / "posted.json").read_text())
        sch = json.loads((ROOT / "auto" / "schedule.json").read_text())
        for key in BS_EPS:
            self.assertEqual((posted[key]["ig"], posted[key]["facebook"]), ("bs-scheduled", "bs-scheduled"), key)
            p = next(p for p in sch["posts"] if f'{p["date"]}_{p["ep"]}' == key)
            now = dt.datetime.fromisoformat(p["date"]).replace(hour=int(p["slot"][:2]), tzinfo=post.JST)
            with mock.patch.dict(os.environ, {"MANUAL_PLATFORMS": ""}):
                _, _, targets = post.pick_posts(None, now)
            for t in targets:
                self.assertNotIn("ig", t[2], key); self.assertNotIn("facebook", t[2], key)

    def test_new_posts_go_to_api(self):
        sch = {"defaults": {"platforms": ["ig", "tt", "yt", "facebook"]},
               "posts": [{"date": "2026-10-31", "slot": "12:00", "ep": "new", "no": 99, "title": "新しい回"}]}
        orig = pathlib.Path.read_text
        with mock.patch.object(pathlib.Path, "read_text", lambda self, *a, **k: json.dumps(sch) if self.name == "schedule.json" else orig(self, *a, **k)):
            _, _, targets = post.pick_posts(None, dt.datetime(2026, 10, 31, 12, tzinfo=post.JST))
        self.assertEqual(targets[0][2], ["ig", "tt", "yt", "facebook"])


class InstagramTest(unittest.TestCase):
    def test_uses_page_ig_id_and_cover_url(self):
        calls = []
        def rpost(url, data=None, **k):
            calls.append((url, data)); return R({"id": "c1"} if url.endswith("/media") else {"id": "m1"})
        with mock.patch.dict(os.environ, {"IG_ACCESS_TOKEN": TOK, "IG_USER_ID": "17841499999"}), \
             mock.patch.object(post, "media_publish", lambda path, name: f"https://raw.githubusercontent.com/x/main/{name}"), \
             mock.patch("requests.post", rpost), mock.patch("requests.get", lambda *a, **k: R({"status_code": "FINISHED"})):
            p = {"ep": "new", "caption_en": "E", "caption_ja": "J", "tag_set": "A"}
            self.assertEqual(post.post_instagram(p, {"tag_sets": {"A": "#a"}}, "v.mp4", "t.jpg", uid="17841400000"), "m1")
        url, data = calls[0]
        self.assertIn("/17841400000/media", url)  # Secret でなく、ページから取った ID
        self.assertTrue(data["cover_url"].endswith("_new_cover.jpg")); self.assertEqual(data["media_type"], "REELS")


class HubArgsTest(unittest.TestCase):
    def test_per_post_kpis(self):
        out = {}
        with mock.patch.object(pathlib.Path, "write_bytes", lambda self, b: out.setdefault("b", b)):
            post.write_hub_args({"kpi": "投稿OK（サムネOK）"}, {"回": "新しい回（10-31 12:00）", "Instagram": "投稿OK", "Facebook": "投稿OK（サムネOK）"})
        args = out["b"].split(b"\0")
        self.assertIn("Instagram=投稿OK".encode(), args); self.assertIn("Facebook=投稿OK（サムネOK）".encode(), args)
        self.assertEqual(args.count(b"--kpi"), 3)


class MetricsTest(unittest.TestCase):
    def test_not_id(self):
        src = (ROOT / "auto" / "metrics.py").read_text()
        self.assertIn('NOT_ID = ("manual", "bs-scheduled")', src)


if __name__ == "__main__":
    unittest.main()
