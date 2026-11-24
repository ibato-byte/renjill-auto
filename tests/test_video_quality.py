"""動画の書き出しの質と、冒頭の文字の決まり（2026-11-15 の質の引き上げの見張り）。
ねらい：「片方だけ直して全話が QA 不合格」「いつのまにか画質の設定が元に戻る」「題の翻訳がない回が出る」を、投稿の前に止める。ネットワークには出ない。"""
import datetime as dt, json, pathlib, re, sys, unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto"))
import growth  # noqa: E402

V = json.loads((ROOT / "rig/video.json").read_text())
BUILD = (ROOT / "rig/build.sh").read_text()
RENDER = (ROOT / "rig/render-ep.js").read_text()
EPHTML = (ROOT / "rig/ep.html").read_text()
PACE = (ROOT / "rig/pace.js").read_text()
POSTS = json.loads((ROOT / "auto/schedule.json").read_text())["posts"]
HOOKS = {(m.group(1) or m.group(2)): m.group(3) for m in re.finditer(r"(?:PACE_ALL\.(\w+)\s*=\s*|^\s*(\w+):\s*)\{\s*start:\s*[\d.]+,\s*speed:\s*[\d.]+,\s*hook:\s*'([^']*)'", PACE, re.M)}
POSTED = json.loads((ROOT / "auto/posted.json").read_text()) if (ROOT / "auto/posted.json").exists() else {}


def upcoming():
    """まだ出していない回（投稿の記録にない回）"""
    return [p for p in POSTS if f'{p["date"]}_{p["ep"]}' not in POSTED and p["date"] >= "2026-11-15"]


class VideoSettings(unittest.TestCase):
    def test_settings_are_sane(self):
        self.assertEqual((V["width"], V["height"]), (1080, 1920))
        self.assertIn(V["fps"], (30, 60), "コマ数は 30（スマホの 60 回/秒の画面にそろう）。24 に戻さない")
        self.assertTrue(1 <= V["scale"] <= 2, "描く倍率は 1〜2（大きすぎると描くのに時間がかかり、投稿が時間切れになる）")
        self.assertTrue(90 <= V["jpeg"] <= 100)
        self.assertTrue(14 <= V["crf"] <= 18, "crf は 14〜18（大きいと画質が落ち、小さいとファイルが大きくなる）")

    def test_one_source_of_truth(self):
        self.assertNotRegex(BUILD, r"-framerate\s+\d", "build.sh にコマ数を直接書かない（rig/video.json を読む）")
        self.assertIn("video.json", BUILD); self.assertIn("video.json", RENDER)
        self.assertNotRegex(RENDER, r"fps\s*=\s*\d", "render-ep.js にコマ数を直接書かない")
        self.assertIn("deviceScaleFactor:V.scale", RENDER.replace(" ", ""))
        qa = (ROOT / "auto/qa.py").read_text()
        self.assertIn('video.json', qa); self.assertNotIn("- 24)", qa, "auto/qa.py のコマ数の検査は video.json から")

    def test_encode_quality(self):
        for need in ("-tune animation", "-colorspace bt709", "-color_primaries bt709", "-color_trc bt709", "-color_range tv", "out_color_matrix=bt709", "flags=lanczos", "+cgop", "-level:v 4.1", "+faststart"):
            self.assertIn(need, BUILD, f"build.sh に {need} がない")
        self.assertNotIn('"veryfast"', (ROOT / "auto/growth.py").read_text().split("def add_follow_line")[1].split("\ndef ")[0], "フォローの一言入りの版を veryfast で作り直さない（画質が落ちる）")
        self.assertNotIn('"veryfast"', (ROOT / "auto/stories.py").read_text())

    def test_local_run_hooks_do_not_change_ci(self):
        # 手元で描くための PW_EXEC・NODE_PATH は「あれば使う」だけ（CI では今までどおり）
        self.assertIn("process.env.PW_EXEC", RENDER)
        self.assertIn('os.environ.get("NODE_PATH") or', (ROOT / "auto/post.py").read_text())


class OpeningText(unittest.TestCase):
    def test_chip_rule_present(self):
        for need in ("function chipScan()", "function chipApply(o)", "chipApply(o);window.drawHook(o)", "if(!PACE.hook)return null"):
            self.assertIn(need, EPHTML, f"ep.html に {need} がない（冒頭の一言と同じ字幕を出さない決まり）")

    def test_hook_japanese_is_short(self):
        # シリーズの印「 Part N」は数えない（2026-11-16 オーナー：エレベーター第1話の冒頭に Part 1 を足す。題の部分は 13 文字までのまま）
        ja = lambda h: re.sub(r"\s*Part\s*\d+$", "", h.split("/")[1])
        bad = [f'{p["ep"]}（{len(ja(HOOKS[p["ep"]]))}文字）' for p in upcoming() if p["ep"] in HOOKS and "/" in HOOKS[p["ep"]] and len(ja(HOOKS[p["ep"]])) > 13]
        self.assertEqual(bad, [], "冒頭の日本語は 13 文字まで：" + ", ".join(bad))

    def test_cover_text_matches_hook(self):
        # 2026-11-24：「定時1分前」と同じデザインの回は、冒頭の題名を台本の中で描く（pace.js の hook は空・表紙は variant N）。その回は比べない
        bad = [p["ep"] for p in upcoming() if HOOKS.get(p["ep"]) and (p.get("thumb") or {}).get("hook") and p["thumb"]["hook"] != HOOKS[p["ep"]]]
        self.assertEqual(bad, [], "表紙の文字（schedule.json）と冒頭の一言（pace.js）がちがう：" + ", ".join(bad))


class YouTubeTitles(unittest.TestCase):
    def test_upcoming_posts_have_localized_titles(self):
        need = set(growth.LOCALE_DESC)
        bad = [f'{p["date"]} {p["ep"]}' for p in upcoming() if set((p.get("title_i18n") or {})) != need]
        self.assertEqual(bad, [], "YouTube の題の翻訳（title_i18n）がそろっていない回：" + ", ".join(bad[:8]) + f"（必要な言語：{sorted(need)}）")


if __name__ == "__main__":
    unittest.main()
