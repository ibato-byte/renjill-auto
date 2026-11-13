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
            self.assertTrue(set(th["ren"]) <= {"type", "hay", "sleepy", "asleep"}); self.assertTrue(set(th["jil"]) <= {"type", "glance", "happy", "asleep"})
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


if __name__ == "__main__":
    unittest.main()
