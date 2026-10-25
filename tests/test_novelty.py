"""「新作」の数え方（auto/novelty.py。Hub 依頼 #101）のテスト"""
import datetime as dt, pathlib, sys, unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "auto"))
import novelty as nv

D = dt.date
PUB = {"meeting": D(2026, 10, 19), "stamp": D(2026, 10, 19)}


def post(date, ep, **kw):
    return dict({"date": date, "slot": "12:00", "ep": ep, "title": ep}, **kw)


class Key(unittest.TestCase):
    def test_remake_and_alias(self):
        self.assertEqual((nv.story_key("meeting2"), nv.story_key("hanko"), nv.story_key("stamp2"), nv.story_key("pom_debut")), ("meeting", "stamp", "stamp", "pom_debut"))


class Judge(unittest.TestCase):
    def test_remake_is_not_new(self):
        r = nv.judge([post("2026-11-02", "meeting2"), post("2026-11-03", "brand_new")], D(2026, 10, 26), PUB)
        self.assertEqual([x["kind"] for x in r["rows"]], ["remake", "new"])
        self.assertEqual((r["new"], r["total"]), (1, 2))
        self.assertEqual([v["ep"] for v in r["violations"]], ["meeting2"])  # 14日 < 28日・理由なし

    def test_remake_ok_with_reason_and_gap(self):
        ok = post("2026-11-20", "stamp2", remake={"why": "冒頭を変えて最後まで見られる割合が上がる見込み"})
        self.assertEqual(nv.judge([ok], D(2026, 10, 26), PUB)["violations"], [])
        self.assertEqual(len(nv.judge([post("2026-11-20", "stamp2")], D(2026, 10, 26), PUB)["violations"]), 1)  # 理由なし
        self.assertEqual(len(nv.judge([dict(ok, date="2026-11-10")], D(2026, 10, 26), PUB)["violations"]), 1)  # 22日

    def test_same_story_twice_in_schedule(self):
        r = nv.judge([post("2026-11-01", "x_new"), post("2026-11-05", "x_new2")], D(2026, 10, 26), PUB)
        self.assertEqual([x["kind"] for x in r["rows"]], ["new", "remake"])


class Published(unittest.TestCase):
    def test_unposted_posted_json_entry_is_not_published(self):
        import json, tempfile
        with tempfile.TemporaryDirectory() as t:
            root = pathlib.Path(t); (root / "auto").mkdir()
            (root / "auto" / "posted.json").write_text(json.dumps({"2026-11-01_zzz": {"no": 1}, "2026-10-23_mug2": {"ig": "123"}, "2026-10-21_papers2": {"tt": "manual", "ig": "9"}}))
            pub = nv.published(root)
            self.assertNotIn("zzz", pub)
            self.assertEqual(pub["mug"], D(2026, 10, 23))


if __name__ == "__main__":
    unittest.main()
