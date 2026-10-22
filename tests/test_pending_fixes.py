"""直した素材の未マージを知らせる仕組み（ネットワークに出ない）"""
import datetime as dt, pathlib, sys, unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto"))
import pending_fixes as pf  # noqa: E402

JST = pf.JST
SCH = {"defaults": {"platforms": ["ig", "yt", "facebook"]}, "posts": [{"date": "2026-10-23", "slot": "18:00", "ep": "mug2", "title": "マグ"}]}


class Fake:
    def __init__(self, prs, files, branches=(), cmp=None):
        self.prs, self.files, self.branches, self.cmp = prs, files, branches, cmp or {}
    def get(self, path, **kw):
        if path == "/pulls": return self.prs
        if path.endswith("/files"): return [{"filename": f} for f in self.files]
        if path == "/branches": return [{"name": b} for b in self.branches]
        if path.startswith("/compare/"): return self.cmp
        raise AssertionError(path)


class PendingTest(unittest.TestCase):
    now = dt.datetime(2026, 10, 22, 18, tzinfo=JST)
    pr = [{"number": 9, "html_url": "https://example/pull/9", "head": {"ref": "claude/x"}}]

    def test_open_pr_with_material_is_reported(self):
        out = pf.find(Fake(self.pr, ["dist/mug2_thumb.jpg"]), self.now, SCH, {})
        self.assertEqual(len(out), 1); self.assertIn("https://example/pull/9", out[0][2])

    def test_unrelated_pr_or_far_post_or_posted_is_quiet(self):
        self.assertEqual(pf.find(Fake(self.pr, ["README.md"]), self.now, SCH, {}), [])
        self.assertEqual(pf.find(Fake(self.pr, ["dist/mug2_thumb.jpg"]), dt.datetime(2026, 10, 20, tzinfo=JST), SCH, {}), [])
        done = {"2026-10-23_mug2": {"ig": "1", "facebook": "2", "yt": "3"}}
        self.assertEqual(pf.find(Fake(self.pr, ["dist/mug2_thumb.jpg"]), self.now, SCH, done), [])

    def test_branch_without_pr_is_reported(self):
        f = Fake([], [], ["main", "claude/old", "claude/fix"], {"ahead_by": 1, "files": [{"filename": "auto/schedule.json"}]})
        out = pf.find(f, self.now, SCH, {})
        self.assertEqual([o[0] for o in out], ["br:claude/old", "br:claude/fix"])


if __name__ == "__main__":
    unittest.main()
