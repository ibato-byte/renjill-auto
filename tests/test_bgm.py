"""作業用BGM（長尺）：計画・説明・検査・ワークフローの決まり（ネットワークに出ない・動画は作らない）"""
import json, os, pathlib, re, sys, unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto")); sys.path.insert(0, str(ROOT / "rig" / "bgm"))
import bgm, bgm_qa, bgm_names  # noqa: E402

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
            self.assertIn(th["id"], bgm_names.THEME_NAMES)                           # テーマごとに、その回に合った曲名がある

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
        for i, t in enumerate(tr): t["bpm"] = keys[i] if keys else 100.0 * n + i     # 回ごとに別の曲（keys を渡すと、わざと同じ曲にできる）
        desc, _ = bgm.description(pl, tr); names = [f"{date} {i}" for i in range(len(tr))]
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


class NoRepeatTest(unittest.TestCase):
    """曲は回をまたいでかぶらない（オーナー依頼 2026-11-14「曲はできるだけ被らないようにして」）：調・進行・速さの組み合わせと曲名を二度使わない"""
    ST = {"episodes": {"2026-11-13": {"yt": "a", "theme": "rain_night", "privacy": "public", "track_keys": ["A minor|0m7-5m7-107-3maj7|83.0"], "track_names": ["Hay Break", "Desk Lamp"]},
                       "2026-11-14": {"yt": "b", "theme": "seaside", "privacy": "public", "track_keys": ["C major|0maj7-9m7-5maj7-77|80.0"], "track_names": ["Tea Time"]}}}

    def made(self, date, n, st):
        """その回を作ったときの曲（音は作らない）。作り置きの各ジョブがやることと同じ"""
        import music
        keys, names = bgm.history(date, st, CFG, today="2026-11-14")
        pl = bgm.plan(date, st, CFG, n=n)
        heads = music.choose(pl["seed"], pl["minutes"] + 0.5, pl["style"], keys)
        return pl, heads, bgm.pick_names(pl["seed"], len(heads), names, pl["theme"]), keys, names

    def test_whole_year_stock_shares_no_track_and_no_name(self):
        # 作り置きは並べて同時に作る（おたがいの結果を知らない）。それでも、どの2本も曲・曲名がかぶらない
        plan = bgm.stock_plan("2026-12-31", self.ST, CFG, "2026-11-14"); self.assertEqual(len(plan), 13)
        seen_k, seen_n = set(self.ST["episodes"]["2026-11-13"]["track_keys"] + self.ST["episodes"]["2026-11-14"]["track_keys"]), {"Hay Break", "Desk Lamp", "Tea Time"}
        for x in reversed(plan):                                                       # 作る順番がばらばらでも同じ結果
            pl, heads, names, _, _ = self.made(x["date"], x["n"], self.ST)
            ks = {h["tk"] for h in heads}
            self.assertEqual(len(ks), len(heads)); self.assertEqual(len(set(names)), len(heads)); self.assertGreaterEqual(len(heads), 12)
            self.assertFalse(ks & seen_k, x["date"]); self.assertFalse(set(names) & seen_n, x["date"])
            self.assertFalse(any(h.get("reused") for h in heads))
            for a, b in zip(heads, heads[1:]): self.assertNotEqual(a["key"], b["key"])
            seen_k |= ks; seen_n |= set(names)

    def test_day_build_avoids_later_stock_too(self):
        st = json.loads(json.dumps(self.ST)); st["stock"] = {"2026-11-21": {"code": bgm.code_hash(), "track_keys": ["K1"], "track_names": ["N1"]}, "2026-11-25": {"code": "old", "track_keys": ["K2"], "track_names": ["N2"]}}
        keys, names = bgm.history("2026-11-18", st, CFG, today="2026-11-18")
        self.assertIn("K1", keys); self.assertIn("N1", names); self.assertNotIn("K2", keys)      # 作り方が古い作り置きは作り直されるので数えない
        self.assertIn("A minor|0m7-5m7-107-3maj7|83.0", keys); self.assertIn("Tea Time", names)
        self.assertNotIn("K1", bgm.history("2026-11-18", st, CFG, today="2026-11-18", redo=True)[0])

    def test_choose_is_repeatable_and_obeys_avoid(self):
        import music
        for style in music.STYLES:
            a = music.choose(20261118, 60.5, style); self.assertEqual(a, music.choose(20261118, 60.5, style))
            b = music.choose(20261118, 60.5, style, [h["tk"] for h in a])
            self.assertFalse({h["tk"] for h in a} & {h["tk"] for h in b}, style)

    def test_made_track_matches_its_plan(self):
        import music, numpy as np
        h = music.choose(7, 4, "wa")[0]
        x, info = music.make_track(np.random.default_rng([7, 1, h["try"], 7]), 1, "wa", head=json.loads(json.dumps(h)))
        self.assertEqual(f'{info["key"]}|{"-".join(info["prog"])}|{info["bpm"]}', h["tk"]); self.assertAlmostEqual(len(x) / music.SR, h["sec"], places=1)

    def test_exhausted_pool_is_marked_not_hidden(self):
        import music
        every = {music.pick_head(__import__("numpy").random.default_rng([1, i, j]), "wa")["tk"] for i in range(1, 40) for j in range(81)}
        heads = music.choose(1, 10, "wa", every)
        self.assertTrue(all(h.get("reused") for h in heads))                          # 使い切ったら印を付ける（検査はその数だけ見逃す）

    def test_names_never_repeat_even_when_a_theme_runs_out(self):
        used = set()
        for k in range(12):                                                            # 同じテーマを12回（1テーマ 約100個を使い切る）
            nm = bgm.pick_names(20270101 + k, 22, used, "seaside")
            self.assertEqual(len(nm), 22); self.assertEqual(len(set(nm)), 22); self.assertFalse(set(nm) & used); used |= set(nm)
        self.assertTrue(any(" II" in x for x in used))                                # 使い切ったら II を付ける（同じ名前にはしない）
        self.assertEqual(bgm.pick_names(5, 22, ["x"], "morning"), bgm.pick_names(5, 22, ["x"], "morning"))

    def test_qa_fails_on_any_shared_track_or_name(self):
        tr = tracks(); pl = bgm.plan("2026-11-18", self.ST, CFG, n=2); first = bgm.description(pl, tr)[1][0]; desc, names = bgm.description(pl, tr, [first])
        meta = {**pl, "description": desc, "track_names": names, "tracks": tr, "localizations": {}, "tags": []}
        self.assertNotIn(first, names)
        k0 = f'{tr[0]["key"]}|{"-".join(tr[0]["prog"])}|{tr[0]["bpm"]}'
        self.assertEqual(bgm_qa.check_novelty(meta, [{"theme": "x", "track_keys": ["other"], "track_names": ["Other"]}]), [])
        self.assertTrue(any("同じ曲" in p for p in bgm_qa.check_novelty(meta, [{"theme": "x", "track_keys": [k0]}])))
        self.assertTrue(any("同じ曲名" in p for p in bgm_qa.check_novelty(meta, [{"theme": "x", "track_names": [names[3]]}])))
        tr[0]["reused"] = True
        self.assertEqual(bgm_qa.check_novelty(meta, [{"theme": "x", "track_keys": [k0]}]), [])

    def test_published_episodes_have_their_names_on_record(self):
        st = json.loads((ROOT / "auto" / "bgm_state.json").read_text(encoding="utf-8"))
        for d, r in st["episodes"].items():
            if r.get("yt"): self.assertEqual(len(r.get("track_names") or []), len(r["track_keys"]), d)


class TracklistTest(unittest.TestCase):
    """説明欄の Tracklist（2026-11-14 オーナーの指摘「Tracklist が意味不明」の再発防止）：その回のテーマに合った名前・日本語つき"""
    def test_every_name_has_english_and_japanese(self):
        import re
        for theme, (A, B) in bgm_names.THEME_NAMES.items():
            self.assertGreaterEqual(len(A) * len(B) + len(B), 80, theme); self.assertEqual(len(set(A)), len(A)); self.assertEqual(len(set(B)), len(B))
            for en, ja in A:
                self.assertRegex(en, r"^[A-Za-z][A-Za-z\-' ]*$"); self.assertRegex(ja, "[のな]$", (theme, ja))   # 時間・場面の言葉だけ（「〜の」「〜な」）
                self.assertNotRegex(ja, "あたたか|ゆっくり|ゆったり|やわらか|音のない|青い|白い|小さな", (theme, ja))   # 色・温度・速さ・大きさの形容は、意味の通らない曲名になる
            for en, ja in B:
                self.assertRegex(en, r"^[A-Za-z][A-Za-z\- ]*$"); self.assertRegex(ja, r"^[぀-ヿ一-鿿ー]+$", (theme, ja))
            names = bgm_names.pool(theme); self.assertEqual(len(set(names)), len(names))
            for x in names: self.assertEqual(x.count(bgm_names.SEP), 1); self.assertLessEqual(len(x), 60)

    def test_names_belong_to_the_theme(self):
        # 海の回に雨・残業の曲名、雨の回に海の曲名が出ない
        sea = " ".join(bgm_names.pick(1, 24, (), "seaside")); self.assertNotRegex(sea, "Rain|Overtime|雨|残業")
        rain = " ".join(bgm_names.pick(1, 24, (), "rain_night")); self.assertNotRegex(rain, "Tide|Harbor|潮|港")
        self.assertFalse(set(bgm_names.pool("seaside")) & set(bgm_names.pool("wa_evening")))

    def test_description_lists_bilingual_names_under_a_bilingual_heading(self):
        import re
        pl = bgm.plan("2026-11-14", {"episodes": {"2026-11-13": {"yt": "x"}}}, CFG); desc, names = bgm.description(pl, tracks())
        self.assertIn("\nTracklist｜曲目\n0:00 ", desc)
        lines = re.findall(bgm.TS_LINE, desc); self.assertGreaterEqual(len(lines), 12)
        for (_, nm), want in zip(lines, names): self.assertEqual(nm, want); self.assertIn("｜", nm)
        self.assertEqual(bgm_qa.check_meta({**pl, "description": desc, "track_names": names, "tracks": tracks(), "localizations": {}, "tags": []}), [])

    def test_relabel_keeps_times_and_everything_else(self):
        old = "Intro line\n\nTracklist\n0:00 Small Thump\n3:05 Hay Break\n1:02:10 Binky\n\nAll music… 10:30 is not a track\n#tag"
        new = bgm.relabel_text(old, ["A｜あ", "B｜い", "C｜う", "D｜え"])
        self.assertEqual(new, "Intro line\n\nTracklist｜曲目\n0:00 A｜あ\n3:05 B｜い\n1:02:10 C｜う\n\nAll music… 10:30 is not a track\n#tag")
        self.assertEqual(bgm.relabel_text(old, ["A｜あ"]).count("Hay Break"), 1)        # 名前が足りなければ、残りはそのまま（消さない）

    def test_relabel_picks_new_names_for_old_style_episodes_only(self):
        import tempfile
        keep = bgm.AUTO; bgm.AUTO = pathlib.Path(tempfile.mkdtemp())
        try:
            st = {"episodes": {"2026-11-13": {"yt": "a", "theme": "rain_night", "seed": 20261113, "track_keys": ["k"] * 22, "track_names": ["Nine to Five"] * 22},
                               "2026-11-14": {"yt": "b", "theme": "seaside", "seed": 20261114, "track_keys": ["k"] * 24, "track_names": bgm_names.pick(1, 24, (), "seaside")}}}
            (bgm.AUTO / "bgm_state.json").write_text(json.dumps(st))
            logs = []; keep_log = bgm.log; bgm.log = lambda *a: logs.append(a)
            try: self.assertEqual(bgm.relabel(dry=True), 0)
            finally: bgm.log = keep_log
            self.assertEqual([x[0] for x in logs], ["2026-11-13"])                      # 新しい形の回は触らない
        finally: bgm.AUTO = keep

    def test_workflow_can_relabel(self):
        y = (ROOT / ".github" / "workflows" / "bgm.yml").read_text(encoding="utf-8")
        self.assertIn("IN_RELABEL", y); self.assertIn("bgm.py relabel", y)


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
