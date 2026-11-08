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


class ActionsMinutesTest(unittest.TestCase):
    """GitHub Actions の無料枠（月2,000分）を使い切らない（2026-11-08 再発防止）"""
    def test_heavy_workflows_do_not_run_on_push(self):
        # 描画・QA で ffmpeg・Playwright を入れる重い自動は、push のたびに動かさない（11/7 に preflight が push で500分超）
        for name in ("preflight.yml", "post.yml", "growth.yml", "metrics.yml", "daily-review.yml"):
            y = open(os.path.join(ROOT, ".github", "workflows", name), encoding="utf-8").read()
            on = y.split("\njobs:")[0]
            self.assertNotRegex(on, r"\n\s+push:", name)
            self.assertNotRegex(on, r"\n\s+pull_request:", name)


if __name__ == "__main__":
    unittest.main()
