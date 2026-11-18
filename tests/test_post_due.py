"""出す回がない実行では ffmpeg などの重い準備をしない（Hub 依頼 #257。2026-11-19：
出す回のない拾い直しの実行が、パッケージの取得の止まりで3回続けて失敗した）"""
import os, re, sys, tempfile, unittest, datetime as dt
from unittest import mock

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "auto"))
import post  # noqa: E402


class CheckDueTest(unittest.TestCase):
    def _run(self, targets):
        with tempfile.TemporaryDirectory() as d:
            out = os.path.join(d, "out")
            sch = {"posts": [], "defaults": {"platforms": []}}
            with mock.patch.dict(os.environ, {"GITHUB_OUTPUT": out}), \
                 mock.patch.object(post, "pick_posts", return_value=(sch, {}, targets)), \
                 mock.patch.object(post, "next_api_post", return_value=None), \
                 mock.patch.object(post, "write_hub_args") as hub, \
                 mock.patch.object(post, "render") as render:
                rc = post.main(["--check-due"])
            return rc, open(out).read(), hub, render

    def test_no_post_writes_false_and_idle_record(self):
        rc, out, hub, render = self._run([])
        self.assertEqual(rc, 0)
        self.assertIn("due=false", out)
        hub.assert_called_once()          # Hub には「予定なし」を残す
        render.assert_not_called()

    def test_post_due_writes_true_and_does_not_post(self):
        p = {"ep": "ep1", "slot": "18:00", "date": "2026-11-19", "title": "t"}
        rc, out, hub, render = self._run([("2026-11-19_ep1", p, ["ig"])])
        self.assertEqual(rc, 0)
        self.assertIn("due=true", out)
        hub.assert_not_called()
        render.assert_not_called()        # 調べるだけで、描画も投稿もしない


class WorkflowGateTest(unittest.TestCase):
    def test_heavy_steps_wait_for_due(self):
        y = open(os.path.join(ROOT, ".github", "workflows", "post.yml"), encoding="utf-8").read()
        self.assertIn("--check-due", y)
        for marker in ("apt-get install", "playwright install", "pip install -q requests numpy", "python auto/post.py --date"):
            i = y.index(marker)
            step = y[y.rindex("\n      - ", 0, i):i]
            self.assertIn("steps.due.outputs.due == 'true'", step, marker)


if __name__ == "__main__":
    unittest.main()
