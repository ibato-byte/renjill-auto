"""台本の決まりの検査（auto/epcheck.py）のテスト（総見直し 2026-11-10）"""
import datetime as dt, json, pathlib, sys, unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto"))
import epcheck


class Parse(unittest.TestCase):
    def test_captions(self):
        src = "x = CHIP(L, 'A B', 'あ', 1380, k) + CHIP(L, \"BOSS'S\", 'い', 1380, k)"
        self.assertEqual(epcheck.captions(src), [("A B", "あ"), ("BOSS'S", "い")])

    def test_chip_off_not_counted(self):
        self.assertEqual(epcheck.captions("CHIP_OFF(L, 'X', 'y', 1, 1)"), [])


class Arms(unittest.TestCase):
    """腕を描かない（2026-11-11：最後の1枚を口でくわえる形に作り直した。1回の失敗を2度起こさない）"""
    def test_limb_detected(self):
        self.assertTrue(epcheck.uses_limb("  limb(f, 'ren', hand, {});"))
        self.assertFalse(epcheck.uses_limb("// limb() は使わない"))
        self.assertFalse(epcheck.uses_limb("const x = L.limbo(1);"))

    def test_upcoming_limb_is_issue(self):
        today = dt.date(2026, 11, 11)
        r = epcheck.check([{"date": "2026-11-12", "slot": "18:00", "ep": "replyall"}], today, 14, pc={}, lk={})
        self.assertTrue(any("腕" in x for x in r["issues"]))

    def test_lastsheet_has_no_arms(self):
        self.assertFalse(epcheck.uses_limb((ROOT / "rig/ep/lastsheet.js").read_text()))


class Small(unittest.TestCase):
    """画面の中のキャラを縮めない（2026-11-13：wifi・mute のレンが画面の高さの20%だった）"""
    def test_shrink_detected(self):
        self.assertTrue(epcheck.shrinks("if (rs) rs.style.transform = `translate(${x}px, ${y}px) scale(.95)`;"))
        self.assertFalse(epcheck.shrinks("rs.style.transform = `scale(1.5)`;"))
        self.assertFalse(epcheck.shrinks("// rs.style.transform = `scale(.5)`;"))

    def test_wifi_mute_not_shrunk(self):
        for ep in ("wifi", "mute"):
            self.assertFalse(epcheck.shrinks((ROOT / f"rig/ep/{ep}.js").read_text()), ep)


class Jump(unittest.TestCase):
    """跳ぶ部品の yOff を y に足す（2026-11-15：rig.js は yOff を使わない。月曜の朝・オンライン会議で体が跳んでいなかった）"""
    def test_missing_yoff_detected(self):
        self.assertTrue(epcheck.jump_without_yoff("const jp = Object.assign({}, P, { y: 100 }, L.startle(t, 2));"))
        self.assertFalse(epcheck.jump_without_yoff("const jp = Object.assign({}, P, L.startle(t, 2));\n if (jp.yOff) jp.y += jp.yOff;"))
        self.assertFalse(epcheck.jump_without_yoff("y: DESK + (st.yOff || 0), st = L.startle(t, 2)"))
        self.assertFalse(epcheck.jump_without_yoff("// L.binky(t, 1) は使わない"))

    def test_all_episodes_apply_yoff(self):
        bad = [f.stem for f in (ROOT / "rig/ep").glob("*.js") if epcheck.jump_without_yoff(f.read_text())]
        self.assertEqual(bad, [])


class Upcoming(unittest.TestCase):
    def test_next_14_days_have_no_issues(self):
        posts = json.loads((ROOT / "auto/schedule.json").read_text())["posts"]
        today = dt.datetime.now(epcheck.JST).date()
        r = epcheck.check(posts, today, 14)
        self.assertEqual(r["issues"], [], "\n".join(r["issues"]))


class Lib(unittest.TestCase):
    def test_motion_parts_exist(self):
        lib = (ROOT / "rig/v2/lib.js").read_text()
        for name in ("L.anticip", "L.land", "L.startle", "L.droop", "L.binky", "L.runIn", "L.twitch", "L.footShadow"):
            self.assertIn(name + " =", lib)


class Rules20261112(unittest.TestCase):
    """2026-11-12 総見直し：138（冒頭の一言＝表紙の文字）・161（字幕 1.2 秒以上）・164（「…」）・166（長い英単語）"""
    def test_chip_window(self):
        src = "ui += t > 4.5 && t < 6.6 ? CHIP(L, 'A', 'あ', 1380, k) : '';"
        self.assertEqual([round(x, 2) for x in epcheck.chip_windows(src)], [2.1])

    def test_rules_warn(self, ):
        import tempfile, shutil
        d = pathlib.Path(tempfile.mkdtemp())
        try:
            (d / "zz_test.js").write_text("var EP={dur: 9.5};\n// … コメントは数えない …\nui += t > 2 && t < 2.8 ? CHIP(L, 'CALLIGRAPHY', 'あ', 1380, k) : '';\nx('…'); y('…'); z('…');\n")
            old = epcheck.EP; epcheck.EP = d
            try:
                r = epcheck.check([{"date": "2026-11-13", "ep": "zz_test", "thumb": {"hook": "X/ちがう"}}], dt.date(2026, 11, 12), 14,
                                  pc={"zz_test": {"start": 0, "speed": 1, "hook": "X/冒頭"}}, lk={})
            finally:
                epcheck.EP = old
            w = "\n".join(r["warns"])
            for key in ("表紙の文字が違う", "字幕の出ている時間が0.8秒", "「…」が3回", "長い単語「CALLIGRAPHY」"):
                self.assertIn(key, w)
        finally:
            shutil.rmtree(d)

    def test_upcoming_hook_matches_thumb(self):
        posts = json.loads((ROOT / "auto/schedule.json").read_text())["posts"]
        r = epcheck.check(posts, dt.datetime.now(epcheck.JST).date(), 14)
        self.assertFalse([x for x in r["warns"] if "表紙の文字が違う" in x])


class Required(unittest.TestCase):
    """台本と一緒に決めるもの（総見直し 2026-11-16：OVERHAUL 17・37・39 を検査に入れた）"""
    def test_head_lines(self):
        self.assertEqual(epcheck.head_lines("// x\n// 状況：a\n// オチ：b\nvar EP={}"), {"situation": True, "punch": True})
        self.assertEqual(epcheck.head_lines("// x\nvar EP={}\n// 状況 オチ"), {"situation": False, "punch": False})

    def test_post_fields(self):
        full = {"thumb": {"t": 0, "cam": "1,540,1000", "hook": "A/あ"}, "caption_ja": "あ", "first_comment": "い"}
        self.assertEqual(epcheck.post_fields(full), [])
        self.assertEqual(epcheck.post_fields({"thumb": {"hook": "A/あ"}, "caption_ja": " "}), ["thumb.t", "thumb.cam", "caption_ja", "first_comment"])

    def test_missing_is_issue(self):
        import tempfile, shutil
        d = pathlib.Path(tempfile.mkdtemp())
        try:
            (d / "zz_req.js").write_text("// 題だけ\nvar EP={dur: 9};\n")
            old = epcheck.EP; epcheck.EP = d
            try:
                r = epcheck.check([{"date": "2026-11-17", "ep": "zz_req"}], dt.date(2026, 11, 16), 14, pc={}, lk={})
            finally:
                epcheck.EP = old
            joined = "\n".join(r["issues"])
            self.assertIn("「状況：」と「オチ：」", joined)
            self.assertIn("thumb.t", joined)
        finally:
            shutil.rmtree(d)

    def test_all_stock_has_required(self):
        """予定表の今日以降の回はすべて満たしている（在庫76話）"""
        posts = json.loads((ROOT / "auto/schedule.json").read_text())["posts"]
        r = epcheck.check(posts, dt.datetime.now(epcheck.JST).date(), 400)
        self.assertFalse([x for x in r["issues"] if "OVERHAUL 17" in x or "OVERHAUL 37" in x])


class SameRoom20261118(unittest.TestCase):
    """2026-11-18 総見直し：「前の3話と同じ部屋」は会社の部屋（L.office）を描く回どうし・ほかの話の回とだけ比べる"""
    def _warns(self, rows, lk):
        today = dt.date(2030, 1, 1)
        posts = [dict(date=f"2030-01-0{n + 1}", slot="18:00", ep=ep, **({"series": s} if s else {})) for n, (ep, s) in enumerate(rows)]
        r = epcheck.check(posts, today, 14, lk=lk)
        return [w for w in r["warns"] if "同じ部屋" in w]

    def test_office_same_look_warns(self):
        self.assertTrue(self._warns([("teiji", None), ("meeting", None)], {"teiji": 2, "meeting": 2}))

    def test_own_set_not_counted(self):
        self.assertEqual(self._warns([("teiji", None), ("elevator2", None)], {"teiji": 2, "elevator2": 2}), [])

    def test_same_series_not_counted(self):
        s = lambda n: {"id": "x", "part": n, "of": 3}
        self.assertEqual(self._warns([("teiji", s(1)), ("meeting", s(2))], {"teiji": 2, "meeting": 2}), [])
