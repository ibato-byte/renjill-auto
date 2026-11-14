"""作業用BGM（長尺）：計画・説明・検査・ワークフローの決まり（ネットワークに出ない・動画は作らない）"""
import json, os, pathlib, re, sys, unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto")); sys.path.insert(0, str(ROOT / "rig" / "bgm"))
import bgm, bgm_qa  # noqa: E402

CFG = {"days": [2, 5], "minutes": 60, "privacy": "unlisted", "enabled": True}


def tracks(n=18, sec=200.0):
    keys = ["C major", "D major", "F major", "G major", "A minor", "Bb major", "Eb major"]
    return [{"no": i + 1, "key": keys[i % 7], "bpm": 66.0 + i, "bars": 60, "sec": sec, "lead": "bell", "prog": [f"{i}maj7", "4m7", "2m7", "0maj7"], "swing": 0.1, "file": f"track_{i + 1:02d}.wav"} for i in range(n)]


class PlanTest(unittest.TestCase):
    def test_same_date_same_plan(self):
        a = bgm.plan("2026-11-14", {"episodes": {}}, CFG); b = bgm.plan("2026-11-14", {"episodes": {}}, CFG)
        self.assertEqual(a, b); self.assertEqual(a["seed"], 20261114)

    def test_theme_and_room_change_every_episode(self):
        st = {"episodes": {}}; seen = []
        for d in ("2026-11-14", "2026-11-18", "2026-11-21", "2026-11-25", "2026-11-28", "2026-12-02", "2026-12-05"):
            p = bgm.plan(d, st, CFG); seen.append((p["theme"], p["look"]))
            st["episodes"][d] = {"yt": "x" + d, "theme": p["theme"]}
        for a, b in zip(seen, seen[1:]):
            self.assertNotEqual(a[0], b[0]); self.assertNotEqual(a[1], b[1])
        self.assertEqual(len({t for t, _ in seen[:6]}), 6)          # 6本は全部ちがうテーマ

    def test_rerun_of_posted_date_keeps_its_plan(self):
        st = {"episodes": {}}
        p1 = bgm.plan("2026-11-14", st, CFG); st["episodes"]["2026-11-14"] = {"yt": "abc"}
        self.assertEqual(bgm.plan("2026-11-14", st, CFG)["theme"], p1["theme"])

    def test_titles_fit_youtube(self):
        for i, th in enumerate(bgm.THEMES):
            st = {"episodes": {f"2026-01-{k + 1:02d}": {"yt": "x"} for k in range(i)}}
            p = bgm.plan("2026-11-14", st, CFG)
            self.assertLessEqual(len(p["title"]), 100); self.assertNotRegex(p["title"], "[<>]")
            self.assertIn("Ren & Jill", p["title"]); self.assertIn(th["ja"], p["title"])
            for lang, v in bgm.localizations(p, p["title"], "x").items(): self.assertLessEqual(len(v["title"]), 100, lang)

    def test_themes_are_valid(self):
        for th in bgm.THEMES:
            self.assertEqual(len(th["hours"]), 4); self.assertEqual(len(th["ren"]), 4); self.assertEqual(len(th["jil"]), 4)
            self.assertEqual(th["hours"], sorted(th["hours"]))                       # 時計は進む
            self.assertTrue(set(th["ren"]) <= {"type", "hay", "sleepy", "asleep", "dance", "gaze"}); self.assertTrue(set(th["jil"]) <= {"type", "glance", "happy", "asleep", "dance", "gaze"})
            self.assertIn(th.get("style", "lofi"), bgm.GENRE)
            pairs = list(zip(th["ren"], th["jil"]))
            for a, b in zip(pairs, pairs[1:]): self.assertNotEqual(a, b)             # となりの章は2匹のようすが変わる
        self.assertGreaterEqual(len(bgm.TRACK_NAMES), 30); self.assertEqual(len(set(bgm.TRACK_NAMES)), len(bgm.TRACK_NAMES))

    def test_due_only_on_configured_days_and_once(self):
        self.assertTrue(bgm.due("2026-11-14", CFG, {"episodes": {}}))    # 土
        self.assertTrue(bgm.due("2026-11-18", CFG, {"episodes": {}}))    # 水
        self.assertFalse(bgm.due("2026-11-16", CFG, {"episodes": {}}))   # 月
        self.assertFalse(bgm.due("2026-11-14", CFG, {"episodes": {"2026-11-14": {"yt": "abc"}}}))
        self.assertFalse(bgm.due("2026-11-14", {**CFG, "enabled": False}, {"episodes": {}}))


class DescriptionTest(unittest.TestCase):
    def setUp(self):
        self.pl = bgm.plan("2026-11-14", {"episodes": {}}, CFG); self.tr = tracks()
        self.desc, self.names = bgm.description(self.pl, self.tr)
        self.meta = {**self.pl, "description": self.desc, "track_names": self.names, "tracks": self.tr, "localizations": bgm.localizations(self.pl, self.pl["title"], self.desc), "tags": ["lofi"]}

    def test_chapters_follow_youtube_rules(self):
        self.assertEqual(bgm_qa.check_meta(self.meta), [])
        self.assertIn("\n0:00 ", self.desc)

    def test_no_sales_or_investment_words(self):
        self.assertNotRegex(self.desc, r"(?i)buy|invest|投資|儲")

    def test_meta_problems_are_caught(self):
        bad = {**self.meta, "title": "x" * 101}
        self.assertTrue(bgm_qa.check_meta(bad))
        bad = {**self.meta, "description": "no chapters"}
        self.assertTrue(bgm_qa.check_meta(bad))
        bad = {**self.meta, "track_names": ["A", "A"]}
        self.assertTrue(bgm_qa.check_meta(bad))


class NoveltyTest(unittest.TestCase):
    def meta(self, **kw): return {"theme": "rain_night", "title": "T", "seed": 1, "tracks": tracks(), **kw}

    def test_fresh_episode_passes(self):
        self.assertEqual(bgm_qa.check_novelty(self.meta(), []), [])

    def test_same_theme_title_seed_as_previous_fail(self):
        prev = [{"theme": "rain_night", "title": "T", "seed": 1, "track_keys": []}]
        self.assertEqual(len(bgm_qa.check_novelty(self.meta(), prev)), 3)

    def test_reused_tracks_fail(self):
        m = self.meta(theme="morning", title="U", seed=2)
        keys = [f'{t["key"]}|{"-".join(t["prog"])}|{t["bpm"]}' for t in m["tracks"]]
        self.assertTrue(bgm_qa.check_novelty(m, [{"theme": "x", "title": "y", "seed": 9, "track_keys": keys}]))

    def test_same_key_twice_in_a_row_fails(self):
        tr = tracks(); tr[1]["key"] = tr[0]["key"]
        self.assertTrue(bgm_qa.check_novelty(self.meta(tracks=tr), []))


class LoopCheckTest(unittest.TestCase):
    def test_seam_and_flash_numbers(self):
        import numpy as np
        g = np.zeros((10, 90, 160), dtype=np.float32) + 100
        c = bgm_qa.check_loop(g); self.assertEqual(c["seam"], 0); self.assertEqual(c["adj_max"], 0)
        g[5] += 80
        self.assertGreater(bgm_qa.check_loop(g)["adj_max"], 10)       # 1コマだけ明るい＝ちらつき
        g2 = np.zeros((10, 90, 160), dtype=np.float32); g2[-1] += 50
        self.assertGreater(bgm_qa.check_loop(g2)["seam"], 10)          # 最後と最初が違う＝つなぎ目


class MusicTest(unittest.TestCase):
    def test_every_chord_gets_a_voicing_without_clashes(self):
        import music
        for mode in music.PROGS:
            for prog in music.PROGS[mode]:
                prev = None
                for key in (48, 50, 51, 53, 55, 57, 58):
                    for root, kind in prog:
                        v = music.voice((key + root) % 12, kind, prev); prev = v
                        self.assertGreaterEqual(len(v), 3); self.assertGreaterEqual(min(v), 55); self.assertLessEqual(max(v), 78)

    def test_no_samples_or_downloads(self):
        src = (ROOT / "rig" / "bgm" / "music.py").read_text(encoding="utf-8")
        self.assertNotRegex(src, r"requests|urllib|http://|https://|\.mp3|\.ogg")   # 音は全部その場で合成（外の素材を使わない＝権利の申し立てなし）


class UploadTest(unittest.TestCase):
    """YouTube が題名・説明の一部を断っても、形を変えて出す。断られたものを何度もやり直さない（2026-11-13 の1本目）"""
    def test_client_error_is_not_retried(self):
        calls = []

        class Rejected(Exception):
            class resp: status = 400

        class Req:
            def next_chunk(self, num_retries=0):
                calls.append(1); raise Rejected("INVALID_REQUEST_METADATA")
        with self.assertRaises(Rejected): bgm._send(Req())
        self.assertEqual(len(calls), 1)

    def test_upload_finishes_in_chunks(self):
        class Req:
            n = 0
            def next_chunk(self, num_retries=0):
                Req.n += 1; return (None, None) if Req.n < 3 else (None, {"id": "abc"})
        self.assertEqual(bgm._send(Req()), {"id": "abc"})

    def test_no_audio_language_code_that_youtube_rejects(self):
        src = (ROOT / "auto" / "bgm.py").read_text(encoding="utf-8")
        self.assertNotIn('"defaultAudioLanguage"', src)
        self.assertIn("多言語なし", src); self.assertIn("題名と短い説明だけ", src)

    def test_audio_is_not_aac(self):
        src = (ROOT / "auto" / "bgm.py").read_text(encoding="utf-8")
        self.assertIn('"-c:a", "pcm_s16le"', src); self.assertNotIn('"-c:a", "aac"', src)   # ffmpeg の AAC は元の音にない山を作った


class StyleTest(unittest.TestCase):
    """曲調（海・和・あげあげ・バラード）：音楽・絵・題名がそろって切り替わる（オーナー依頼 2026-11-14）"""
    def test_every_style_exists_in_music_and_scene(self):
        import music
        scene = (ROOT / "rig" / "bgm" / "scene.js").read_text(encoding="utf-8")
        styles = {th.get("style", "lofi") for th in bgm.THEMES}
        self.assertTrue({"lofi", "sea", "wa", "club", "ballad"} <= styles)
        for st in styles:
            self.assertIn(st, music.STYLES); self.assertIn(st, bgm.GENRE_I18N); self.assertIn(st, bgm.STYLE_TAGS); self.assertIn(st, bgm.STYLE_HASH)
            if st != "lofi": self.assertIn(f"ST === '{st}'", scene)        # 絵（窓の外・小物・衣装）も曲調で変わる
        for mode in ("dance", "gaze"): self.assertIn(f"=== '{mode}'", scene)

    def test_style_reaches_music_and_scene(self):
        st = {"episodes": {"2026-11-13": {"yt": "x", "privacy": "public", "theme": "rain_night"}}}
        pl = bgm.plan("2026-11-14", st, CFG)
        self.assertEqual(pl["style"], "sea"); self.assertIn("style=sea", bgm.query(pl, 0)); self.assertIn("month=11", bgm.query(pl, 0))
        self.assertNotIn("Lofi", pl["title"])                             # 海の回を「Lofi」と名乗らない

    def test_each_style_track_is_made(self):
        import music, numpy as np
        for st in music.STYLES:
            x, info = music.make_track(np.random.default_rng(3), 1, st)
            self.assertEqual(info["style"], st); self.assertGreater(info["sec"], 90); self.assertLess(info["sec"], 330)
            self.assertLessEqual(float(np.abs(x).max()), 0.46); self.assertFalse(np.isnan(x).any())

    def test_no_strobe_in_club_scene(self):
        scene = (ROOT / "rig" / "bgm" / "scene.js").read_text(encoding="utf-8")
        self.assertIn("強い点滅はさせない", scene)                          # 光の点滅で気分が悪くなる人がいる。色はゆっくり変える


class SiteListTest(unittest.TestCase):
    """公式サイトの「長い動画」の一覧（renjill-media/bgm.json）：公開した回だけ・4言語の題・新しい順"""
    def test_only_public_and_sorted(self):
        st = {"episodes": {"2026-11-13": {"yt": "aaaaaaaaaaa", "privacy": "public", "theme": "rain_night", "minutes": 60, "at": "2026-11-14T00:55+09:00"},
                           "2026-11-14": {"yt": "bbbbbbbbbbb", "privacy": "unlisted", "theme": "morning", "minutes": 60, "at": "2026-11-14T20:50+09:00"},
                           "2026-11-18": {"yt": "ccccccccccc", "privacy": "public", "theme": "clear_night", "minutes": 60, "at": "2026-11-18T20:50+09:00"}}}
        out = bgm.media_list(st)
        self.assertEqual([x["youtube_id"] for x in out], ["ccccccccccc", "aaaaaaaaaaa"])
        self.assertEqual(out[1]["thumb"], "bgm_2026-11-13_thumb.jpg"); self.assertEqual(out[1]["date"], "2026-11-14")
        for x in out:
            self.assertEqual(set(x["title"]), {"ja", "en", "zh", "ko"}); self.assertTrue(all(x["title"].values()))

    def test_every_theme_has_four_languages(self):
        for th in bgm.THEMES:
            for k in ("ja", "en", "zh", "ko"): self.assertTrue(th.get(k), (th["id"], k))


class WorkflowTest(unittest.TestCase):
    def setUp(self): self.y = (ROOT / ".github" / "workflows" / "bgm.yml").read_text(encoding="utf-8")

    def test_not_on_push(self):
        on = self.y.split("\njobs:")[0]
        self.assertNotRegex(on, r"\n\s+push:"); self.assertNotRegex(on, r"\n\s+pull_request:")

    def test_does_not_block_daily_posts(self):
        self.assertRegex(self.y, r"(?m)^concurrency:\s*bgm\b")           # post の列に入ると、毎日の投稿が待たされる
        self.assertIn("ref: main", self.y)

    def test_hub_pause_and_report(self):
        self.assertIn("gha.sh\" check renjill-bgm", self.y); self.assertIn("gha.sh\" report renjill-bgm", self.y)
        self.assertIn("vars.AUTO_POST_ENABLED == 'true'", self.y)

    def test_schedule_matches_config(self):
        cfg = json.loads((ROOT / "auto" / "bgm_config.json").read_text(encoding="utf-8"))
        cron = re.search(r'cron: "(\d+) (\d+) \* \* ([\d,]+)"', self.y)
        # cron の曜日（0=日）→ Python の曜日（0=月）。UTC 11時台＝日本の同じ日の 20時台
        days = sorted((int(d) - 1) % 7 for d in cron.group(3).split(","))
        self.assertEqual(days, sorted(cfg["days"])); self.assertLess(int(cron.group(2)) + 9, 24)
        self.assertIn(cfg["privacy"], ("public", "unlisted", "private")); self.assertEqual(cfg["minutes"] % 4, 0)


class StockTest(unittest.TestCase):
    """作り置き（先の回を前もって作る。オーナー依頼 2026-11-14）：順番・記録・当日の使い方"""
    ST = {"episodes": {"2026-11-13": {"yt": "a", "theme": "rain_night", "privacy": "public"}, "2026-11-14": {"yt": "b", "theme": "seaside", "privacy": "public"}}}

    def meta(self, date, n, st=None, keys=None):
        pl = bgm.plan(date, st or self.ST, CFG, n=n); tr = tracks()
        if keys:
            for t, k in zip(tr, keys): t["bpm"] = k
        desc, names = bgm.description(pl, tr)
        return {**pl, "code": bgm.code_hash(), "description": desc, "track_names": names, "tracks": tr, "localizations": bgm.localizations(pl, pl["title"], desc), "tags": ["lofi"]}

    def put(self, root, date, meta, ok=True, mb=900):
        d = root / f"bgm-stockmeta-{date}"; d.mkdir(parents=True)
        (d / "meta.json").write_text(json.dumps(meta)); (d / "qa.json").write_text(json.dumps({"ok": ok, "problems": [] if ok else ["音量"], "numbers": {"mb": mb}}))

    def setUp(self):
        import tempfile
        self.tmp = pathlib.Path(tempfile.mkdtemp()); self.keep = (bgm.AUTO, bgm.ROOT, bgm.STOCK, bgm.DIST)
        bgm.AUTO = self.tmp / "auto"; bgm.AUTO.mkdir(); bgm.DIST = self.tmp / "dist"; bgm.STOCK = bgm.DIST / "bgm_stock"

    def tearDown(self):
        import shutil
        bgm.AUTO, bgm.ROOT, bgm.STOCK, bgm.DIST = self.keep; shutil.rmtree(self.tmp, ignore_errors=True)
        for f in (ROOT / "content" / "bgm").glob("2099-*"): f.unlink()

    def test_plan_lists_every_wed_sat_until_year_end_in_order(self):
        out = bgm.stock_plan("2026-12-31", self.ST, CFG, "2026-11-14")
        self.assertEqual([x["date"] for x in out], ["2026-11-18", "2026-11-21", "2026-11-25", "2026-11-28", "2026-12-02", "2026-12-05", "2026-12-09", "2026-12-12", "2026-12-16", "2026-12-19", "2026-12-23", "2026-12-26", "2026-12-30"])
        self.assertEqual([x["n"] for x in out], list(range(2, 15)))
        themes = [bgm.plan(x["date"], self.ST, CFG, n=x["n"])["theme"] for x in out]
        self.assertEqual(themes[0], "wa_evening")                                   # 出した2本（雨の夜・海）の次
        for a, b in zip(themes, themes[1:]): self.assertNotEqual(a, b)

    def test_plan_skips_stocked_and_remakes_when_recipe_changed(self):
        st = json.loads(json.dumps(self.ST)); st["stock"] = {"2026-11-18": {"code": bgm.code_hash(), "no": 3}, "2026-11-21": {"code": "old", "no": 4}}
        out = bgm.stock_plan("2026-11-25", st, CFG, "2026-11-14")
        self.assertEqual([x["date"] for x in out], ["2026-11-21", "2026-11-25"])
        self.assertEqual(len(bgm.stock_plan("2026-11-25", st, CFG, "2026-11-14", redo=True)), 3)

    def test_day_plan_counts_stock_before_it(self):
        # 当日に作り直すときも、作り置きと同じ番号（＝同じテーマの順番）になる
        st = json.loads(json.dumps(self.ST)); st["stock"] = {"2026-11-18": {}, "2026-11-21": {}}
        self.assertEqual(bgm.plan("2026-11-21", st, CFG)["no"], 4); self.assertEqual(bgm.plan("2026-11-18", st, CFG)["no"], 3)
        self.assertEqual(bgm.plan("2026-11-21", st, CFG), bgm.plan("2026-11-21", self.ST, CFG, n=3))

    def test_record_checks_stock_against_each_other(self):
        st = json.loads(json.dumps(self.ST)); src = self.tmp / "src"
        same = [70.0 + i for i in range(18)]
        self.put(src, "2099-01-01", self.meta("2099-01-01", 2, keys=same))
        self.put(src, "2099-01-04", self.meta("2099-01-04", 3, keys=same))            # 前の作り置きと同じ曲ばかり
        self.put(src, "2099-01-08", self.meta("2099-01-08", 4), ok=False)             # 検査に落ちた回
        self.put(src, "2099-01-11", self.meta("2099-01-11", 5))
        bad = bgm.stock_record(src, 123, st)
        self.assertEqual(bad, ["2099-01-04", "2099-01-08"]); self.assertEqual(sorted(st["stock"]), ["2099-01-01", "2099-01-11"])
        s = st["stock"]["2099-01-01"]
        self.assertEqual((s["run"], s["artifact"], s["no"], s["code"], s["mb"]), ("123", "bgm-stock-2099-01-01", 3, bgm.code_hash(), 900))
        self.assertEqual(json.loads((bgm.AUTO / "bgm_state.json").read_text())["stock"].keys(), st["stock"].keys())

    def stocked(self, date="2099-01-01", code=None, mb=None):
        st = json.loads(json.dumps(self.ST)); meta = self.meta(date, 2)
        import shutil
        d = bgm.STOCK / date; shutil.rmtree(d, ignore_errors=True); shutil.rmtree(bgm.DIST / "bgm" / date, ignore_errors=True); d.mkdir(parents=True)
        (d / "meta.json").write_text(json.dumps(meta)); (d / "qa.json").write_text(json.dumps({"ok": True})); (d / "thumb.jpg").write_bytes(b"x"); (d / bgm.VIDEO_NAME).write_bytes(b"x" * 1000)
        st["stock"] = {date: {"code": code or bgm.code_hash(), "no": 3, "run": "1", "artifact": "a", "mb": mb}}
        (bgm.AUTO / "bgm_state.json").write_text(json.dumps(st))
        return st

    def run_day(self, date, build_ok=True):
        calls = []
        keep = (bgm.build, bgm.upload)
        bgm.build = lambda d, *a, **k: (calls.append("build") or (build_ok, None, {"en": "X"}))
        bgm.upload = lambda d, p=None: (calls.append("upload:" + ("stock" if (bgm.DIST / "bgm" / d / bgm.VIDEO_NAME).exists() else "fresh")) or "vid")
        try: return bgm.run_day(date), calls
        finally: bgm.build, bgm.upload = keep

    def test_day_uses_stock_when_recipe_unchanged(self):
        self.stocked()
        (vid, msg), calls = self.run_day("2099-01-01")
        self.assertEqual(calls, ["upload:stock"]); self.assertEqual(vid, "vid"); self.assertIn("作り置き", msg)

    def test_day_rebuilds_when_recipe_changed_and_falls_back_to_stock(self):
        self.stocked(code="old")
        (_, msg), calls = self.run_day("2099-01-01")
        self.assertEqual(calls, ["build", "upload:fresh"]); self.assertNotIn("作り置き", msg)
        self.stocked(code="old")
        (vid, msg), calls = self.run_day("2099-01-01", build_ok=False)
        self.assertEqual(calls, ["build", "upload:stock"]); self.assertEqual(vid, "vid")

    def test_day_without_stock_builds_as_before(self):
        (bgm.AUTO / "bgm_state.json").write_text(json.dumps(self.ST))
        (_, _), calls = self.run_day("2099-01-01")
        self.assertEqual(calls, ["build", "upload:fresh"])
        (vid, msg), calls = self.run_day("2099-01-01", build_ok=False)
        self.assertEqual(calls, ["build"]); self.assertIsNone(vid); self.assertIn("出さなかった", msg)

    def test_broken_or_out_of_order_stock_is_not_used(self):
        st = self.stocked(mb=900)                                                     # 取ってきた動画の大きさが作ったときと違う（途中で切れた）
        self.assertTrue(any("大きさ" in p for p in bgm.stock_problems("2099-01-01", st)))
        (_, _), calls = self.run_day("2099-01-01")
        self.assertEqual(calls, ["build", "upload:fresh"])
        st = self.stocked(); st["episodes"]["2098-12-30"] = {"yt": "z", "theme": bgm.plan("2099-01-01", self.ST, CFG, n=2)["theme"]}
        self.assertIn("前の回と同じテーマ", bgm.stock_problems("2099-01-01", st))     # 順番がずれて、前の回と同じテーマになった

    def test_recipe_hash_is_stable_and_follows_the_music(self):
        a = bgm.code_hash(); bgm.set_crf("club"); self.assertEqual(bgm.code_hash(), a); bgm.set_crf("lofi")
        keep = bgm.TARGET_LUFS; bgm.TARGET_LUFS = -14.5
        try: self.assertNotEqual(bgm.code_hash(), a)
        finally: bgm.TARGET_LUFS = keep


class StockWorkflowTest(unittest.TestCase):
    def setUp(self):
        self.y = (ROOT / ".github" / "workflows" / "bgm-stock.yml").read_text(encoding="utf-8")
        self.day = (ROOT / ".github" / "workflows" / "bgm.yml").read_text(encoding="utf-8")

    def test_manual_only_and_never_uploads_to_youtube(self):
        on = self.y.split("\njobs:")[0]
        self.assertNotRegex(on, r"\n\s+push:"); self.assertNotRegex(on, r"\n\s+pull_request:"); self.assertNotRegex(on, r"\n\s+schedule:")
        self.assertNotIn("YT_REFRESH_TOKEN", self.y); self.assertNotRegex(self.y, r"bgm\.py (run|upload|publish)\b")

    def test_does_not_block_posts_or_the_day_run(self):
        self.assertRegex(self.y, r"(?m)^concurrency:\s*bgm-stock\b"); self.assertIn("ref: main", self.y)
        self.assertIn("vars.AUTO_POST_ENABLED == 'true'", self.y); self.assertIn('gha.sh" check renjill-bgm', self.y)

    def test_only_passed_videos_are_stored(self):
        self.assertIn("steps.build.outputs.code == '0'", self.y); self.assertIn("name: bgm-stock-${{ matrix.ep.date }}", self.y)
        self.assertIn("stock-record", self.y); self.assertIn("fail-fast: false", self.y)

    def test_day_run_fetches_stock_and_can_read_artifacts(self):
        self.assertIn("actions: read", self.day); self.assertIn("stock-fetch", self.day); self.assertIn("GH_TOKEN", self.day)
        self.assertLess(self.day.index("stock-fetch"), self.day.index('args=(run --date'))


if __name__ == "__main__":
    unittest.main()
