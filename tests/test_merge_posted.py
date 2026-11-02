import sys, unittest, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "auto"))
from merge_posted import merge


class MergePosted(unittest.TestCase):
    def test_manual_does_not_overwrite_real_id(self):
        out = merge({"ep": {"yt": "abc123"}}, {"ep": {"yt": "manual", "ig": "9"}})
        self.assertEqual(out["ep"]["yt"], "abc123")
        self.assertEqual(out["ep"]["ig"], "9")

    def test_real_id_replaces_manual(self):
        self.assertEqual(merge({"ep": {"yt": "manual"}}, {"ep": {"yt": "abc"}})["ep"]["yt"], "abc")


if __name__ == "__main__":
    unittest.main()
