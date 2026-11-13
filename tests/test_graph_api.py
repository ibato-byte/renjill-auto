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
    def test_five_eps_go_to_api(self):
        """2026-10-22：Business Suite の予約をやめた。5回とも Instagram・Facebook を API で出す（bs-scheduled は残さない）"""
        posted = json.loads((ROOT / "auto" / "posted.json").read_text())
        sch = json.loads((ROOT / "auto" / "schedule.json").read_text())
        for key in BS_EPS:
            self.assertNotIn("bs-scheduled", posted[key].values(), key)
            p = next(p for p in sch["posts"] if f'{p["date"]}_{p["ep"]}' == key)
            now = dt.datetime.fromisoformat(p["date"]).replace(hour=int(p["slot"][:2]), tzinfo=post.JST)
            with mock.patch.dict(os.environ, {"MANUAL_PLATFORMS": ""}):
                _, _, targets = post.pick_posts(None, now, True)
            self.assertTrue(any(t[1]["ep"] == p["ep"] and "ig" in t[2] and "facebook" in t[2] for t in targets), key)

    def test_ensure_thumbnail_retries(self):
        """投稿直後にカバーを確かめ、付いていなければ付け直す"""
        import facebook as fb
        class R:
            def __init__(s, j): s.j = j; s.status_code = 200
            def json(s): return s.j
        class H:
            def __init__(s, attached): s.attached, s.sets = list(attached), 0
            def get(s, url, params=None, **k):
                a = s.attached.pop(0) if len(s.attached) > 1 else s.attached[0]
                return R({"data": [{"uri": "x", "is_preferred": a}]})
            def post(s, url, data=None, **k): s.sets += 1; return R({"success": True})
        import tempfile
        th = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False); th.write(b"j"); th.close()
        h = H([True]); self.assertEqual(fb.ensure_thumbnail("v1", "t", th.name, h, sleep=lambda s: None), "OK"); self.assertEqual(h.sets, 0)
        h = H([False, True]); self.assertEqual(fb.ensure_thumbnail("v1", "t", th.name, h, sleep=lambda s: None), "OK"); self.assertEqual(h.sets, 1)
        h = H([False]); self.assertEqual(fb.ensure_thumbnail("v1", "t", th.name, h, sleep=lambda s: None), "NG"); self.assertEqual(h.sets, 3)

    def test_new_posts_go_to_api(self):
        sch = {"defaults": {"platforms": ["ig", "tt", "yt", "facebook"]},
               "posts": [{"date": "2026-10-31", "slot": "12:00", "ep": "new", "no": 99, "title": "新しい回"}]}
        orig = pathlib.Path.read_text
        with mock.patch.object(pathlib.Path, "read_text", lambda self, *a, **k: json.dumps(sch) if self.name == "schedule.json" else orig(self, *a, **k)):
            _, _, targets = post.pick_posts(None, dt.datetime(2026, 10, 31, 12, tzinfo=post.JST))
        self.assertEqual(targets[0][2], ["ig", "tt", "yt", "facebook", "ig_story", "fb_story", "bsky"])


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
        self.assertEqual(args.count(b"--kpi"), 4)  # 回・Instagram・Facebook・次の Instagram・Facebook 投稿
        self.assertIn("次の Instagram・Facebook 投稿=未登録（週次PDCA で登録）".encode(), args)
        self.assertEqual(args[args.index(b"--owner-action") + 1], b"none")

    def test_failure_goes_to_owner_action(self):
        out = {}
        p = {"title": "新しい回", "date": "2026-11-02", "slot": "12:00"}
        acts = [post.failure_action(p, "ig", RuntimeError({"error": {"code": 190, "type": "OAuthException"}})),
                post.failure_action(p, "facebook", RuntimeError("boom"))]
        self.assertIn("トークン", acts[0]); self.assertIn("2026-11-02", acts[1]); self.assertIn("12:00", acts[1])
        with mock.patch.object(pathlib.Path, "write_bytes", lambda self, b: out.setdefault("b", b)):
            post.write_hub_args(None, {"Instagram": "投稿失敗"}, acts, "11/04 18:00")
        args = out["b"].split(b"\0")
        self.assertEqual(args.count(b"--owner-action"), 2); self.assertNotIn(b"none", args)
        self.assertIn("次の Instagram・Facebook 投稿=11/04 18:00".encode(), args)

    def test_no_post_keeps_previous_actions(self):
        out = {}
        with mock.patch.object(pathlib.Path, "write_bytes", lambda self, b: out.setdefault("b", b)):
            post.write_hub_args(None, next_api="11/02 12:00", keep_actions=True)
        self.assertNotIn(b"--owner-action", out["b"].split(b"\0"))

    def test_idle_summary_and_hub_args(self):
        """予定がない回は「やることなし」と、次の投稿を具体的に書く（固定文にしない。依頼 #79）"""
        sch = {"defaults": {"platforms": ["ig", "yt", "facebook"]},
               "posts": [{"date": "2026-10-25", "slot": "19:00", "ep": "a", "title": "定時のチャイム"}]}
        now = dt.datetime(2026, 10, 25, 12, 20, tzinfo=post.JST)
        with mock.patch.dict(os.environ, {"MANUAL_PLATFORMS": ""}):
            nx = post.next_api_post(sch, {}, now, detail=True)
            self.assertEqual(nx, ("10/25 19:00", "定時のチャイム", "2026-10-25T10:00:00Z"))
            self.assertEqual(post.idle_summary(sch, now, nx), "12:20 は予定なし。次の投稿は 10/25 19:00『定時のチャイム』")
            out = {}
            with mock.patch.object(pathlib.Path, "write_bytes", lambda self, b: out.setdefault("b", b)), \
                 mock.patch.object(pathlib.Path, "write_text", lambda self, t: out.setdefault("t", t)):
                post.write_hub_args(None, next_api=nx[0], keep_actions=True, summary="x", outcome="idle", next_action=("10/25 19:00『定時のチャイム』を投稿", nx[2]))
            args = out["b"].split(b"\0")
            self.assertIn(b"idle", args)
            self.assertIn("10/25 19:00『定時のチャイム』を投稿".encode(), args)
            self.assertNotIn(b"--count", args)

    def test_next_api_post(self):
        sch = {"defaults": {"platforms": ["ig", "yt", "facebook"]},
               "posts": [{"date": "2026-10-30", "slot": "18:00", "ep": "a"}, {"date": "2026-11-02", "slot": "12:00", "ep": "b"}]}
        posted = {"2026-10-30_a": {"ig": "bs-scheduled", "facebook": "bs-scheduled"}}
        now = dt.datetime(2026, 10, 21, 16, tzinfo=post.JST)
        with mock.patch.dict(os.environ, {"MANUAL_PLATFORMS": ""}):
            self.assertEqual(post.next_api_post(sch, posted, now), "11/02 12:00")
            self.assertIsNone(post.next_api_post(sch, posted, dt.datetime(2026, 11, 3, tzinfo=post.JST)))


class MetricsTest(unittest.TestCase):
    def test_not_id(self):
        src = (ROOT / "auto" / "metrics.py").read_text()
        self.assertIn('NOT_ID = ("manual", "bs-scheduled")', src)

    def test_ig_insights_fallback(self):
        import meta_stats as ms
        def get(url, params=None, timeout=None):
            m = params["metric"]
            if "," in m or m in ("views", "saved"): return R({"error": {"message": "unsupported"}})
            return R({"data": [{"name": m, "values": [{"value": 7}]}]})
        s = ms.ig_insights("m1", TOK, type("H", (), {"get": staticmethod(get)})())
        self.assertEqual((s["views"], s["reach"], s["likes"]), (7, 7, 7))  # views が取れなければ plays を使う
        with self.assertRaises(RuntimeError):
            ms.ig_insights("m1", TOK, type("H", (), {"get": staticmethod(lambda *a, **k: R({"error": {"code": 190}}))})())

    def test_find_ids_of_reserved_posts(self):
        import meta_stats as ms
        sch = {"posts": [{"date": "2026-10-23", "slot": "18:00", "ep": "mug2", "caption_en": "Where did my mug go? Again."},
                         {"date": "2026-10-25", "slot": "19:00", "ep": "chime2", "caption_en": "It's 5 PM!"}]}
        posted = {"2026-10-23_mug2": {"ig": "bs-scheduled", "facebook": "bs-scheduled", "yt": "y1"},
                  "2026-10-25_chime2": {"ig": "bs-scheduled", "facebook": "bs-scheduled"}}
        ig = [{"id": "i9", "caption": "Where did my mug go? Again.\nマグ", "timestamp": "2026-10-23T09:00:05+0000"},
              {"id": "i8", "caption": "Where did my mug go? Again.", "timestamp": "2026-10-20T09:00:05+0000"}]  # 別の日は使わない
        fbr = [{"id": "f9", "description": "where did my mug go? again.", "created_time": "2026-10-23T09:01:00+0000"}]
        found = ms.find_ids(posted, sch, ig, fbr, dt.datetime(2026, 10, 26, tzinfo=post.JST))
        self.assertEqual(found, [("2026-10-23_mug2", "ig"), ("2026-10-23_mug2", "facebook")])
        rec = posted["2026-10-23_mug2"]
        self.assertEqual((rec["ig"], rec["ig_via"], rec["facebook"], rec["facebook_via"]), ("i9", "bs-scheduled", "f9", "bs-scheduled"))
        self.assertEqual(posted["2026-10-25_chime2"]["ig"], "bs-scheduled")  # 見つからなければそのまま（API で出さない）

    def test_fix_stale_ig(self):
        import meta_stats as ms
        posted = {"2026-11-08_thumbsup": {"ig": "old1", "ig_at": "2026-11-08T12:22+09:00", "ig_shortcode": "DfdxKAlD8Cw"},
                  "2026-11-10_last": {"ig": "n2", "ig_at": "2026-11-10T12:20+09:00"},
                  "2026-11-09_gone": {"ig": "old3", "ig_at": "2026-11-09T12:20+09:00"},
                  "2026-10-01_old": {"ig": "old4", "ig_at": "2026-10-01T12:20+09:00"},
                  "2026-10-23_mug2": {"ig": "bs-scheduled"}}
        ig = [{"id": "n2", "timestamp": "2026-11-10T03:20:00+0000", "permalink": "https://www.instagram.com/reel/AAA/"},
              {"id": "n1", "timestamp": "2026-11-08T03:25:10+0000", "permalink": "https://www.instagram.com/reel/DfdxKAlD8Cw/"},
              {"id": "x1", "timestamp": "2026-11-08T03:18:00+0000", "permalink": "https://www.instagram.com/reel/OTHER/"},
              {"id": "n0", "timestamp": "2026-11-01T03:20:00+0000", "permalink": "https://www.instagram.com/reel/BBB/"}]
        fixed = ms.fix_stale_ig(posted, ig)
        self.assertEqual(fixed, [("2026-11-08_thumbsup", "old1", "n1")])  # アドレスの印で、もう1本（x1）ではなく残っている方に
        self.assertEqual((posted["2026-11-08_thumbsup"]["ig"], posted["2026-11-08_thumbsup"]["ig_old"]), ("n1", "old1"))
        self.assertEqual(posted["2026-11-09_gone"]["ig"], "old3")  # その時刻の投稿がなければ付け替えない
        self.assertEqual(posted["2026-10-01_old"]["ig"], "old4")  # 一覧より古い回は触らない
        self.assertEqual(posted["2026-11-10_last"]["ig"], "n2")
        # 印がなく候補が2本なら迷うので付け替えない
        p2 = {"k": {"ig": "old1", "ig_at": "2026-11-08T12:22+09:00"}}
        self.assertEqual(ms.fix_stale_ig(p2, ig), [])
        self.assertEqual(ms.fix_stale_ig(p2, []), [])

    def test_followers_csv(self):
        import meta_stats as ms
        with tempfile.TemporaryDirectory() as d:
            p = pathlib.Path(d) / "followers.csv"
            p.write_text("計測日,ig,tiktok,youtube,x,line,合計,メモ\n2026-10-20,2,5,2,0,,9,手動\n", encoding="utf-8")
            self.assertTrue(ms.write_followers(p, "2026-10-22", {"ig": 4, "facebook": 1, "youtube": 2}))
            self.assertFalse(ms.write_followers(p, "2026-10-22", {"ig": 5}))  # 1日1行
            lines = p.read_text(encoding="utf-8").splitlines()
        self.assertEqual(lines[0], ",".join(ms.HEADER))
        self.assertEqual(lines[1], "2026-10-20,2,5,2,,0,,9,手動")
        self.assertTrue(lines[2].startswith("2026-10-22,4,,2,1,,,7,"))


if __name__ == "__main__":
    unittest.main()
