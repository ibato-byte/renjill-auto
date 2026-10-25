"""自分たちのコメントには返信しない（依頼 #100）。ネットワークに出ない"""
import pathlib, sys, unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "auto"))
import comments  # noqa: E402


class H:
    def __init__(self, j): self.j = j
    def get(self, *a, **k):
        j = self.j
        class R:
            def json(_): return j
        return R()


class OwnCommentTest(unittest.TestCase):
    def test_instagram(self):
        r = comments.fetch_meta("ig", "1", "t", H({"data": [{"id": "a", "text": "x", "username": "renjill_office"}, {"id": "b", "text": "y", "username": "fan"}]}))
        self.assertEqual([c["own"] for c in r], [True, False])

    def test_facebook(self):
        r = comments.fetch_meta("facebook", "1", "t", H({"data": [{"id": "a", "message": "x", "from": {"id": "1358515160686321"}}, {"id": "b", "message": "y", "from": {"id": "9"}}]}))
        self.assertEqual([c["own"] for c in r], [True, False])


if __name__ == "__main__":
    unittest.main()
