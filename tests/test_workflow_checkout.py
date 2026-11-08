"""投稿するワークフローは、常に最新の main を checkout する（2026-11-08 の二重投稿の再発防止）。

concurrency: post で待たされた実行は、起動した時点のコミットを checkout すると
先の実行が書いた auto/posted.json を見られず、同じ回を二重に投稿してしまう。
"""
import pathlib
import re
import unittest

WF = pathlib.Path(__file__).resolve().parent.parent / ".github" / "workflows"


def _posting_workflows():
    out = []
    for p in sorted(WF.glob("*.yml")):
        s = p.read_text(encoding="utf-8")
        if re.search(r"^concurrency:\s*post\b", s, re.M) and "posted.json" in s:
            out.append((p.name, s))
    return out


class PostingWorkflowsCheckoutLatestMain(unittest.TestCase):
    def test_posting_workflows_found(self):
        names = [n for n, _ in _posting_workflows()]
        self.assertIn("post.yml", names)
        self.assertIn("promo.yml", names)

    def test_checkout_uses_latest_main(self):
        bad = []
        for name, s in _posting_workflows():
            for m in re.finditer(r"uses:\s*actions/checkout@\S+", s):
                after = s[m.end():m.end() + 400]
                nxt = re.search(r"\n\s*- ", after)
                block = after[: nxt.start()] if nxt else after
                if not re.search(r"ref:\s*main\b", block):
                    bad.append(name)
        self.assertEqual(bad, [], f"checkout に ref: main がない: {bad}")


if __name__ == "__main__":
    unittest.main()
