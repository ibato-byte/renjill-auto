"""トークンの警告メール（auto/alerts.py）と、トークンのエラーのときの投稿・出し直しの単体テスト（ネットワークに出ない）"""
import datetime as dt, json, os, pathlib, runpy, sys, tempfile, time, unittest
from unittest import mock

ROOT = pathlib.Path(__file__).resolve().parent.parent
os.environ["MANUAL_PLATFORMS"] = ""  # このファイルは API で投稿するとき（手動予約モードでない）の動きを確かめる
sys.path.insert(0, str(ROOT / "auto"))
import alerts  # noqa: E402
import facebook as fb  # noqa: E402
import post  # noqa: E402

JST = alerts.JST
DAY1 = dt.datetime(2026, 10, 21, 6, 0, tzinfo=JST)
DAY2 = DAY1 + dt.timedelta(days=1)
A_IG = {"key": "check:IG_ACCESS_TOKEN", "title": "Instagram のトークンが無効", "fix": "作り直す"}
A_FB = {"key": "check:FB_PAGE_TOKEN", "title": "Facebook に投稿できない", "fix": "権限を付ける"}


class FakeGH:
    def __init__(self): self.issue, self.comments, self.mails = None, [], 0
    def open_issue(self): return self.issue
    def sent_text(self, issue): return "\n".join([issue["body"]] + self.comments)
    def create(self, body): self.issue = {"number": 1, "body": body}; self.mails += 1
    def comment(self, n, body): self.comments.append(body); self.mails += 1


class AlertTest(unittest.TestCase):
    def test_token_error_detection(self):
        for t in ['{"error": {"type": "OAuthException", "code": 190}}', "RefreshError('invalid_grant: Token has been expired or revoked.')",
                  "{'code': 'access_token_invalid'}", "401 Client Error: Unauthorized for url"]:
            self.assertTrue(alerts.is_token_error(t), t)
        for t in ["RuntimeError('公開URLを用意できない')", "ConnectionError('timeout')", "QA NG"]:
            self.assertFalse(alerts.is_token_error(t), t)

    def test_one_mail_per_day_per_content(self):
        gh = FakeGH()
        self.assertEqual(alerts.send(gh, [A_IG, A_FB], DAY1), 2)
        self.assertEqual(gh.mails, 1)
        self.assertIn("@ibato-byte", gh.issue["body"]); self.assertIn("直し方：作り直す", gh.issue["body"])
        # 同じ日に同じ内容（毎時の投稿・数値の収集など）→ 送らない
        self.assertEqual(alerts.send(gh, [A_IG], DAY1 + dt.timedelta(hours=6)), 0)
        self.assertEqual(alerts.send(gh, [A_FB, A_IG], DAY1 + dt.timedelta(hours=13)), 0)
        self.assertEqual(gh.mails, 1)
        # 同じ日でも新しい内容は送る（新しいものだけ）
        new = {"key": "use:IG_ACCESS_TOKEN", "title": "自動投稿が失敗", "fix": "作り直す"}
        self.assertEqual(alerts.send(gh, [A_IG, new], DAY1 + dt.timedelta(hours=6)), 1)
        self.assertNotIn("Instagram のトークンが無効", gh.comments[-1])
        # 翌日も続いていれば、また1通
        self.assertEqual(alerts.send(gh, [A_IG, A_FB], DAY2), 2)
        self.assertEqual(gh.mails, 3)
        self.assertEqual(alerts.send(gh, [A_IG, A_FB], DAY2 + dt.timedelta(hours=1)), 0)

    def test_file_roundtrip_dedupes_keys(self):
        with tempfile.TemporaryDirectory() as d, mock.patch.dict(os.environ, {"ALERTS_FILE": f"{d}/a.jsonl"}):
            alerts.add("use:IG_ACCESS_TOKEN", "x", "y"); alerts.add("use:IG_ACCESS_TOKEN", "x2", "y"); alerts.add("check:HUB_TOKEN", "z", "w")
            self.assertEqual([a["key"] for a in alerts.load()], ["use:IG_ACCESS_TOKEN", "check:HUB_TOKEN"])

    def test_send_without_github_token_is_quiet(self):
        with tempfile.TemporaryDirectory() as d, mock.patch.dict(os.environ, {"ALERTS_FILE": f"{d}/a.jsonl", "GITHUB_TOKEN": ""}):
            alerts.add("check:X", "x", "y")
            self.assertEqual(alerts.main(["send"]), 0)


class TokenCheckTest(unittest.TestCase):
    """期限が残り14日を切ったら「やること」（Hub で要対応）＋メール。終了コードは 0（エラーではない）"""
    def run_check(self, expires_in_days):
        exp = int(time.time()) + expires_in_days * 86400 + 3600
        class R:
            status_code = 200
            def __init__(self, j): self._j = j
            def json(self): return self._j
        def get(url, params=None, timeout=None, headers=None):
            if url.endswith("/debug_token"):
                return R({"data": {"is_valid": True, "type": "SYSTEM_USER", "expires_at": exp, "scopes": list(fb.ALL_SCOPES)}})
            return R({"id": fb.PAGE_ID, "name": "レンとジル Ren & Jill", "access_token": "EAApage1234567890", "instagram_business_account": {"id": "17841"}})
        with tempfile.TemporaryDirectory() as d:
            env = {"IG_ACCESS_TOKEN": "EAAtest1234567890", "ALERTS_FILE": f"{d}/a.jsonl", "MANUAL_PLATFORMS": ""}
            cwd = os.getcwd(); os.chdir(d)
            try:
                with mock.patch.dict(os.environ, env, clear=True), mock.patch("requests.get", get):
                    with self.assertRaises(SystemExit) as cm:
                        runpy.run_path(str(ROOT / "auto" / "token_check.py"), run_name="__main__")
                    keys = [a["key"] for a in alerts.load()]
                args = (pathlib.Path(d) / "dist" / "token_check_args").read_bytes().split(b"\0")
            finally: os.chdir(cwd)
        return cm.exception.code, keys, args

    def test_13_days_left(self):
        code, keys, args = self.run_check(13)
        self.assertEqual(code, 0)
        self.assertIn("check:IG_ACCESS_TOKEN", keys)
        self.assertTrue(any("残り13日" in a.decode() for a in args))

    def test_30_days_left(self):
        code, keys, _ = self.run_check(30)
        self.assertEqual(code, 0)
        self.assertNotIn("check:IG_ACCESS_TOKEN", keys)


class OutageAndCatchUpTest(unittest.TestCase):
    """Instagram のトークンが無効な間：Instagram だけ失敗し他SNSは続く。復旧後の出し直しで二重投稿しない"""
    SCH = {"defaults": {"platforms": ["ig", "yt", "facebook"], "yt_description": "d", "tag_sets": {"A": "#a #b #c"}},
           "posts": [{"date": "2026-10-23", "slot": "18:00", "ep": "mug2", "no": 5, "title": "マグカップはどこ", "tag_set": "A",
                      "caption_en": "Where is my mug", "caption_ja": "マグはどこ", "thumb": {"t": 1, "cam": "1,1,1", "hook": "Mug?/マグ"}}]}

    def run_post(self, posted, argv, ig, fb_access):
        state = {"posted": json.dumps(posted), "calls": []}
        orig_r, orig_w, orig_e = pathlib.Path.read_text, pathlib.Path.write_text, pathlib.Path.exists
        def r(self, *a, **k):
            if self.name == "schedule.json": return json.dumps(OutageAndCatchUpTest.SCH)
            if self.name == "posted.json": return state["posted"]
            return orig_r(self, *a, **k)
        def w(self, data, *a, **k):
            if self.name == "posted.json": state["posted"] = data; return len(data)
            return orig_w(self, data, *a, **k)
        def yt(*a): state["calls"].append("yt"); return "yt1"
        def igp(*a, **k): state["calls"].append("ig"); return ig()
        def fbp(*a, access=None, **k):
            if not access["ok"]: raise fb.FbSkip("; ".join(access["reasons"]))  # 本物と同じく、権限がなければ見送り
            state["calls"].append("facebook"); return "fb1"
        with tempfile.TemporaryDirectory() as d, mock.patch.dict(os.environ, {"ALERTS_FILE": f"{d}/a.jsonl"}), \
             mock.patch.object(pathlib.Path, "read_text", r), mock.patch.object(pathlib.Path, "write_text", w), \
             mock.patch.object(pathlib.Path, "exists", lambda self: self.name == "posted.json" or orig_e(self)), \
             mock.patch.object(pathlib.Path, "write_bytes", lambda self, data: len(data)), \
             mock.patch.object(post, "render", lambda ep: (pathlib.Path("a.mp4"), pathlib.Path("b.mp4"))), \
             mock.patch.object(post, "qa_gate", lambda *a: True), mock.patch.object(post.covercheck, "check", lambda *a, **k: ([], {})), mock.patch.object(post, "thumbnail", lambda p: pathlib.Path("t.jpg")), \
             mock.patch.object(post, "post_youtube", yt), mock.patch.object(post, "post_instagram", igp), \
             mock.patch.object(fb, "diagnose", lambda *a, **k: fb_access), mock.patch.object(fb, "post", fbp):
            code = post.main(argv)
            keys = [a["key"] for a in alerts.load()]
        return code, json.loads(state["posted"]), state["calls"], keys

    def test_outage_then_catch_up(self):
        def ig_bad(): raise RuntimeError({"error": {"message": "Error validating access token", "type": "OAuthException", "code": 190}})
        no_fb = {"ok": False, "reasons": ["IG_ACCESS_TOKEN: 無効なトークン"], "token": None}
        # 当日 18:00：Instagram はトークンのエラーで失敗、Facebook は見送り、YouTube は出る
        code, posted, calls, keys = self.run_post({}, ["--date", "2026-10-23", "18:00"], ig_bad, no_fb)
        rec = posted["2026-10-23_mug2"]
        self.assertEqual(code, 1)
        self.assertEqual(rec.get("yt"), "yt1")
        self.assertNotIn("ig", rec); self.assertNotIn("facebook", rec)
        self.assertIn("use:IG_ACCESS_TOKEN", keys); self.assertIn("use:FB_PAGE_TOKEN", keys)
        # 復旧後（10/27）に workflow_dispatch の date=2026-10-23 で出し直す：YouTube は二度出さない
        ok_fb = {"ok": True, "page_id": "111", "token": "EAAx", "reasons": []}
        code, posted2, calls2, keys2 = self.run_post(posted, ["--date", "2026-10-23", "18:00"], lambda: "ig1", ok_fb)
        rec2 = posted2["2026-10-23_mug2"]
        self.assertEqual(code, 0)
        self.assertEqual(calls2, ["ig", "facebook"])
        self.assertEqual((rec2["yt"], rec2["ig"], rec2["facebook"]), ("yt1", "ig1", "fb1"))
        self.assertEqual(keys2, [])
        # もう一度出し直しても何も出さない
        code, _, calls3, _ = self.run_post(posted2, ["--date", "2026-10-23", "18:00"], lambda: "ig2", ok_fb)
        self.assertEqual((code, calls3), (0, []))

    def test_manual_ig_is_not_retried(self):
        """手動で予約済み（ig=manual）の回は、自動では出さない（二重投稿を防ぐ）"""
        ok_fb = {"ok": True, "page_id": "111", "token": "EAAx", "reasons": []}
        _, _, calls, _ = self.run_post({"2026-10-23_mug2": {"ig": "manual", "yt": "manual"}}, ["--date", "2026-10-23", "18:00"], lambda: "ig1", ok_fb)
        self.assertEqual(calls, ["facebook"])


if __name__ == "__main__":
    unittest.main()
