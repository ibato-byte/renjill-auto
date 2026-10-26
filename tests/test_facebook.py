"""Facebook リール投稿の単体テスト（ネットワークに出ない。python -m unittest discover -s tests）"""
import datetime as dt, json, os, pathlib, sys, tempfile, unittest
from unittest import mock

ROOT = pathlib.Path(__file__).resolve().parent.parent
os.environ["MANUAL_PLATFORMS"] = ""  # このファイルは API で投稿するとき（手動予約モードでない）の動きを確かめる
sys.path.insert(0, str(ROOT / "auto"))
import facebook as fb  # noqa: E402
import post  # noqa: E402

TOK = "EAAtesttoken1234567890"
PAGE_TOK = "EAApagetoken1234567890"
SCH = json.loads((ROOT / "auto" / "schedule.json").read_text())
D = SCH["defaults"]
P = SCH["posts"][0]
KEY = f'{P["date"]}_{P["ep"]}'


def posted_text_without_fb():
    """本物の posted.json から、P の facebook の記録だけを外したもの（テストを本番の記録に左右させない）"""
    real = json.loads((ROOT / "auto" / "posted.json").read_text())
    real.get(KEY, {}).pop("facebook", None); real.get(KEY, {}).pop("facebook_at", None)
    return json.dumps(real)


class Resp:
    def __init__(self, j, code=200): self._j, self.status_code = j, code
    def json(self): return self._j


class FakeHttp:
    """呼ばれた順に記録し、決めておいた応答を返す"""
    def __init__(self, debug=None, me=None, start=None, upload=None, finish=None, status=None, page=None, thumbs=None):
        self.calls = []
        self.debug = debug if debug is not None else {"data": {"is_valid": True, "type": "SYSTEM_USER",
                                                               "scopes": list(fb.ALL_SCOPES), "expires_at": 0}}
        self.me = me or {"id": fb.PAGE_ID, "name": "レンとジル Ren & Jill", "instagram_business_account": {"id": "17841"}}
        self.page = page if page is not None else {"id": fb.PAGE_ID, "name": "レンとジル Ren & Jill", "access_token": PAGE_TOK,
                                                   "instagram_business_account": {"id": "17841"}}
        self.thumbs = thumbs or [{"success": True}]
        self.start = start or [{"video_id": "v1", "upload_url": "https://rupload.facebook.com/video-upload/v21.0/v1"}]
        self.upload = upload or [{"success": True}]
        self.finish = finish or {"success": True}
        self.status = status or {"status": {"video_status": "ready", "publishing_phase": {"status": "complete"}}}

    def get(self, url, params=None, timeout=None, **kw):
        self.calls.append(("GET", url, params))
        if url.endswith("/debug_token"): return Resp(self.debug)
        if url.endswith("/me"): return Resp(self.me)
        if url.endswith("/" + fb.PAGE_ID): return Resp(self.page)
        return Resp(self.status)

    def post(self, url, data=None, headers=None, timeout=None, **kw):
        if hasattr(data, "read"): data = "<file>"
        self.calls.append(("POST", url, data, headers))
        if "rupload.facebook.com" in url: return Resp(self.upload.pop(0) if len(self.upload) > 1 else self.upload[0])
        if url.endswith("/thumbnails"):
            self.calls[-1] = ("POST", url, data, kw.get("files", {}).get("source", ("",))[0])
            return Resp(self.thumbs.pop(0) if len(self.thumbs) > 1 else self.thumbs[0])
        if data.get("upload_phase") == "start": return Resp(self.start.pop(0) if len(self.start) > 1 else self.start[0])
        if data.get("upload_phase") == "finish": return Resp(self.finish)
        raise AssertionError(url)


class CaptionTest(unittest.TestCase):
    def test_order_and_tags(self):
        c = fb.caption(P, D)
        lines = c.split("\n")
        self.assertEqual(lines[0], P["caption_en"])
        self.assertEqual(lines[1], P["caption_ja"])
        self.assertIn("comments", c)
        tags = [w for w in c.split() if w.startswith("#")]
        self.assertTrue(1 <= len(tags) <= 3, tags)

    def test_tags_max3_even_from_5(self):
        d = dict(D); d.pop("fb_tag_sets", None)
        self.assertEqual(len(fb.fb_tags({"tag_set": "B"}, d).split()), 3)

    def test_brand(self):
        self.assertEqual(fb.normalize_brand("レン＆ジル と レン&ジル / Ren and Jill"), "レンとジル と レンとジル / Ren & Jill")


class DiagnoseTest(unittest.TestCase):
    def test_system_user_token(self):
        h = FakeHttp()
        a = fb.diagnose({"IG_ACCESS_TOKEN": TOK}, h)
        self.assertTrue(a["ok"]); self.assertEqual(a["page_id"], "1358515160686321"); self.assertEqual(a["token"], PAGE_TOK)
        self.assertEqual((a["ig_user_id"], a["expires_at"], a["token_type"]), ("17841", 0, "SYSTEM_USER"))
        page = [c for c in h.calls if c[1].endswith("/" + fb.PAGE_ID)][0]
        self.assertIn("instagram_business_account", page[2]["fields"]); self.assertIn("access_token", page[2]["fields"])

    def test_unset(self):
        a = fb.diagnose({}, FakeHttp())
        self.assertFalse(a["ok"]); self.assertIn("未設定", a["reasons"][0])

    def test_fb_page_token_is_not_used(self):
        self.assertFalse(fb.diagnose({"FB_PAGE_TOKEN": TOK}, FakeHttp())["ok"])

    def test_missing_scope(self):
        h = FakeHttp(debug={"data": {"is_valid": True, "type": "SYSTEM_USER", "scopes": ["pages_show_list"], "expires_at": 0}})
        a = fb.diagnose({"IG_ACCESS_TOKEN": TOK}, h)
        self.assertFalse(a["ok"]); self.assertIn("pages_manage_posts", a["reasons"][0])
        self.assertEqual(a["ig_user_id"], "17841")  # 権限が足りなくても、ページと Instagram の ID は確かめる

    def test_page_not_assigned(self):
        h = FakeHttp(page={"error": {"code": 100, "message": "Unsupported get request"}})
        a = fb.diagnose({"IG_ACCESS_TOKEN": TOK}, h)
        self.assertFalse(a["ok"]); self.assertIn(fb.PAGE_ID, a["reasons"][0])

    def test_no_page_token(self):
        h = FakeHttp(page={"id": fb.PAGE_ID, "name": "レンとジル Ren & Jill"})
        self.assertFalse(fb.diagnose({"IG_ACCESS_TOKEN": TOK}, h)["ok"])

    def test_page_token_directly(self):
        h = FakeHttp(debug={"data": {"is_valid": True, "type": "PAGE", "scopes": list(fb.ALL_SCOPES), "expires_at": 0}})
        a = fb.diagnose({"IG_ACCESS_TOKEN": TOK}, h)
        self.assertTrue(a["ok"]); self.assertEqual(a["token"], TOK); self.assertEqual(a["ig_user_id"], "17841")

    def test_other_page_rejected(self):
        h = FakeHttp(debug={"data": {"is_valid": True, "type": "PAGE", "scopes": list(fb.ALL_SCOPES), "expires_at": 0}},
                     me={"id": "1386940331166810", "name": "レンとジル Ren & Jill"})
        self.assertFalse(fb.diagnose({"IG_ACCESS_TOKEN": TOK}, h)["ok"])

    def test_no_token_in_reasons(self):
        for h in (FakeHttp(debug={"data": {"is_valid": False}}), FakeHttp(page={"error": {"message": f"bad access_token={TOK}"}})):
            a = fb.diagnose({"IG_ACCESS_TOKEN": TOK}, h)
            self.assertNotIn(TOK, json.dumps(a["reasons"], ensure_ascii=False))


class PublishTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False); self.tmp.write(b"x" * 1234); self.tmp.close()

    def tearDown(self): os.unlink(self.tmp.name)

    def acc(self): return {"ok": True, "page_id": "111", "token": TOK, "reasons": []}

    def test_three_phases(self):
        h = FakeHttp()
        vid = fb.post(P, D, self.tmp.name, env={"FB_PAGE_TOKEN": TOK}, http=h, sleep=lambda s: None, access=self.acc())
        self.assertEqual(vid, "v1")
        posts = [c for c in h.calls if c[0] == "POST"]
        self.assertEqual(posts[0][2]["upload_phase"], "start")
        self.assertTrue(posts[1][1].startswith("https://rupload.facebook.com/video-upload/"))
        self.assertEqual(posts[1][3], {"Authorization": f"OAuth {TOK}", "offset": "0", "file_size": "1234"})
        fin = posts[2][2]
        self.assertEqual((fin["upload_phase"], fin["video_state"], fin["video_id"]), ("finish", "PUBLISHED", "v1"))
        self.assertEqual(fin["description"], fb.caption(P, D))

    def test_thumbnail(self):
        th = tempfile.NamedTemporaryFile(suffix="_thumb.jpg", delete=False); th.write(b"jpg"); th.close()
        try:
            h, info = FakeHttp(), {}
            fb.post(P, D, self.tmp.name, http=h, sleep=lambda s: None, access=self.acc(), thumb_path=th.name, info=info)
            self.assertEqual(info["thumb"], "OK")
            urls = [c[1] for c in h.calls if c[0] == "POST"]
            self.assertTrue(urls[2].endswith("/v1/thumbnails"))  # アップロードのあと・公開（finish）の前
            self.assertEqual([c for c in h.calls if c[1].endswith("/thumbnails")][0][2]["is_preferred"], "true")
            # 公開前に付けられなければ、公開後にもう一度
            h, info = FakeHttp(thumbs=[{"error": {"message": "not ready"}}, {"success": True}]), {}
            fb.post(P, D, self.tmp.name, http=h, sleep=lambda s: None, access=self.acc(), thumb_path=th.name, info=info)
            self.assertEqual(info["thumb"], "OK")
            self.assertEqual(sum(1 for c in h.calls if c[1].endswith("/thumbnails")), 2)
            # それでもだめなら NG（動画は公開済みなので失敗にはしない）
            h, info = FakeHttp(thumbs=[{"error": {"message": "no"}}]), {}
            self.assertEqual(fb.post(P, D, self.tmp.name, http=h, sleep=lambda s: None, access=self.acc(), thumb_path=th.name, info=info), "v1")
            self.assertEqual(info["thumb"], "NG")
        finally: os.unlink(th.name)

    def test_retry_once_before_finish(self):
        h = FakeHttp(upload=[{"error": {"message": "temporary"}}, {"success": True}],
                     start=[{"video_id": "v1"}, {"video_id": "v2"}])
        vid = fb.post(P, D, self.tmp.name, env={}, http=h, sleep=lambda s: None, log=lambda *a: None, access=self.acc())
        self.assertEqual(vid, "v2")
        self.assertEqual(sum(1 for c in h.calls if c[0] == "POST" and isinstance(c[2], dict) and c[2].get("upload_phase") == "finish"), 1)

    def test_gives_up_after_second_failure(self):
        h = FakeHttp(upload=[{"error": {"message": "down"}}])
        with self.assertRaises(fb.FbBeforeFinish):
            fb.post(P, D, self.tmp.name, env={}, http=h, sleep=lambda s: None, log=lambda *a: None, access=self.acc())

    def test_no_retry_after_finish(self):
        h = FakeHttp(finish={"error": {"message": "x"}})
        with self.assertRaises(RuntimeError):
            fb.post(P, D, self.tmp.name, env={}, http=h, sleep=lambda s: None, log=lambda *a: None, access=self.acc())
        self.assertEqual(sum(1 for c in h.calls if c[0] == "POST" and "rupload" not in c[1] and c[2].get("upload_phase") == "start"), 1)

    def test_skip_without_permission(self):
        with self.assertRaises(fb.FbSkip):
            fb.post(P, D, self.tmp.name, access={"ok": False, "reasons": ["FB_PAGE_TOKEN が未設定"]})

    def test_processing_error(self):
        h = FakeHttp(status={"status": {"video_status": "error"}})
        with self.assertRaises(RuntimeError):
            fb.post(P, D, self.tmp.name, env={}, http=h, sleep=lambda s: None, access=self.acc())


class ScrubTest(unittest.TestCase):
    def test_scrub(self):
        s = fb.scrub(f"https://x/?access_token={TOK}&a=1 OAuth {TOK}", {"FB_PAGE_TOKEN": TOK})
        self.assertNotIn(TOK, s)


class StatsTest(unittest.TestCase):
    def test_reel_stats(self):
        class H:
            def get(self, url, params=None, timeout=None):
                return Resp({"data": [
                    {"name": "blue_reels_play_count", "values": [{"value": 321}]},
                    {"name": "post_video_likes_by_reaction_type", "values": [{"value": {"REACTION_LIKE": 5, "REACTION_LOVE": 2}}]},
                    {"name": "post_video_social_actions", "values": [{"value": {"share": 3, "comment": 1}}]}]})
        self.assertEqual(fb.reel_stats("v1", TOK, H()), {"plays": 321, "reactions": 7, "comments": 1, "shares": 3})

    def test_reel_stats_unavailable(self):
        class H:
            def get(self, url, params=None, timeout=None): return Resp({"error": {"message": "no permission"}})
        self.assertEqual(fb.reel_stats("v1", TOK, H()), {})


class ScheduleTest(unittest.TestCase):
    def test_defaults_include_facebook(self):
        self.assertIn("facebook", D["platforms"])
        for p in SCH["posts"]:
            if "ig" in p.get("platforms", D["platforms"]):
                self.assertIn("facebook", p.get("platforms", D["platforms"]), p["ep"])

    def test_pick_and_dedupe(self):
        now = dt.datetime.fromisoformat(P["date"]).replace(hour=int(P["slot"][:2]), tzinfo=post.JST)
        text, orig = posted_text_without_fb(), pathlib.Path.read_text
        with mock.patch.object(pathlib.Path, "read_text", lambda self, *a, **k: text if self.name == "posted.json" else orig(self, *a, **k)):
            _, posted, targets = post.pick_posts(None, now)
        mine = [t for t in targets if t[1]["ep"] == P["ep"]]
        self.assertTrue(mine)
        key = mine[0][0]
        self.assertIn("facebook", mine[0][2])
        if posted.get(key, {}).get("ig"): self.assertNotIn("ig", mine[0][2])  # 投稿済み（manual 含む）は出さない

    def test_already_posted_facebook_is_skipped(self):
        now = dt.datetime.fromisoformat(P["date"]).replace(hour=int(P["slot"][:2]), tzinfo=post.JST)
        key = f'{P["date"]}_{P["ep"]}'
        real = json.loads((ROOT / "auto" / "posted.json").read_text())
        real.setdefault(key, {})["facebook"] = "v1"
        orig = pathlib.Path.read_text
        def fake(self, *a, **k):
            return json.dumps(real) if self.name == "posted.json" else orig(self, *a, **k)
        with mock.patch.object(pathlib.Path, "read_text", fake):
            _, _, targets = post.pick_posts(None, now)
        self.assertFalse([t for t in targets if t[0] == key and "facebook" in t[2]])


class DryRunTest(unittest.TestCase):
    def test_dry_run_calls_nothing(self):
        def boom(*a, **k): raise AssertionError("network called")
        with mock.patch("requests.get", boom), mock.patch("requests.post", boom), \
             mock.patch.object(post, "render", boom), mock.patch.dict(os.environ, {"FB_PAGE_TOKEN": TOK}):
            before = (ROOT / "auto" / "posted.json").read_text()
            self.assertEqual(post.main(["--dry-run", "--date", P["date"], P["slot"]]), 0)
            self.assertEqual((ROOT / "auto" / "posted.json").read_text(), before)


class MainLoopTest(unittest.TestCase):
    """本番の流れ：Facebook の権限がなければ飛ばして終了コード0、Hub に「やること」を渡す"""
    def run_main(self, access, fb_post=None):
        writes = {}
        orig_w, orig_r, text = pathlib.Path.write_text, pathlib.Path.read_text, posted_text_without_fb()
        def r(self, *a, **k):
            return text if self.name == "posted.json" else orig_r(self, *a, **k)
        def w(self, data, *a, **k):
            if self.name == "posted.json": writes["posted"] = data; return len(data)
            return orig_w(self, data, *a, **k)
        def wb(self, data):
            writes[self.name] = data; return len(data)
        ctx = [mock.patch.object(pathlib.Path, "write_text", w), mock.patch.object(pathlib.Path, "read_text", r), mock.patch.object(pathlib.Path, "write_bytes", wb),
               mock.patch.object(post, "render", lambda ep: (pathlib.Path("a.mp4"), pathlib.Path("b.mp4"))),
               mock.patch.object(post, "qa_gate", lambda *a: True), mock.patch.object(post.covercheck, "check", lambda *a, **k: ([], {})), mock.patch.object(post, "thumbnail", lambda p: pathlib.Path("t.jpg")),
               mock.patch.object(fb, "diagnose", lambda *a, **k: access)]
        if fb_post: ctx.append(mock.patch.object(fb, "post", fb_post))
        for c in ctx: c.start()
        try: code = post.main(["--date", P["date"], P["slot"]])
        finally:
            for c in reversed(ctx): c.stop()
        return code, writes

    def test_skip(self):
        code, writes = self.run_main({"ok": False, "reasons": ["FB_PAGE_TOKEN: 権限が足りない（pages_manage_posts）"], "token": None})
        self.assertEqual(code, 0)
        rec = json.loads(writes["posted"])[f'{P["date"]}_{P["ep"]}']
        self.assertNotIn("facebook", rec)
        args = writes["post_hub_args"].split(b"\0")
        self.assertIn(b"--owner-action", args)
        self.assertIn("Facebook=権限・設定なしで見送り".encode(), args)

    def test_success_records_id(self):
        code, writes = self.run_main({"ok": True, "page_id": "111", "token": TOK, "reasons": []}, lambda *a, **k: "v9")
        self.assertEqual(code, 0)
        rec = json.loads(writes["posted"])[f'{P["date"]}_{P["ep"]}']
        self.assertEqual(rec["facebook"], "v9"); self.assertIn("facebook_at", rec)

    def test_failure_does_not_raise(self):
        def bad(*a, **k): raise RuntimeError(f"boom {TOK}")
        with mock.patch.dict(os.environ, {"FB_PAGE_TOKEN": TOK}):
            code, writes = self.run_main({"ok": True, "page_id": "111", "token": TOK, "reasons": []}, bad)
        self.assertEqual(code, 1)
        self.assertNotIn(TOK, writes["posted"])


if __name__ == "__main__":
    unittest.main()
