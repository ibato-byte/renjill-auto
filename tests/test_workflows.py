"""毎日の事前確認（preflight）が全テストを動かし、落ちたら失敗＋「あなたの番」にすること（Hub 依頼 #125）"""
import os, unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class PreflightRunsTestsTest(unittest.TestCase):
    def setUp(self):
        self.y = open(os.path.join(ROOT, ".github", "workflows", "preflight.yml"), encoding="utf-8").read()

    def test_runs_all_tests(self):
        self.assertIn("unittest discover -s tests", self.y)

    def test_failure_fails_job_and_reaches_owner(self):
        self.assertIn("steps.tests.outcome == 'failure'", self.y)   # ジョブを失敗にする
        self.assertIn('"$TESTS" = "failure"', self.y)               # Hub の「あなたの番」に出す


if __name__ == "__main__":
    unittest.main()
