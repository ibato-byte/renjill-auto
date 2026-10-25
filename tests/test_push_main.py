"""auto/push_main.sh と auto/merge_posted.py：先に別の処理が保存していても、記録を失わず push できる。"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "auto"))
from merge_posted import merge  # noqa: E402


def run(*cmd, cwd, env=None):
    return subprocess.run(cmd, cwd=cwd, check=True, capture_output=True, text=True, env=env)


class MergeTest(unittest.TestCase):
    def test_union_keeps_both(self):
        a = {"x": {"ig": "1"}, "y": {"yt": "manual"}}
        b = {"x": {"facebook": "2", "ig": ""}, "z": {"ig": "3"}}
        m = merge(a, b)
        self.assertEqual(m["x"], {"ig": "1", "facebook": "2"})
        self.assertIn("y", m)
        self.assertIn("z", m)


class PushTest(unittest.TestCase):
    def test_conflict_on_posted_json(self):
        tmp = tempfile.mkdtemp()
        try:
            origin = os.path.join(tmp, "origin.git")
            run("git", "init", "-q", "--bare", "-b", "main", origin, cwd=tmp)
            env = dict(os.environ, RUNNER_TEMP=tmp, GIT_AUTHOR_NAME="t", GIT_AUTHOR_EMAIL="t@t",
                       GIT_COMMITTER_NAME="t", GIT_COMMITTER_EMAIL="t@t")
            clones = []
            for n in ("a", "b"):
                d = os.path.join(tmp, n)
                if n == "a":
                    run("git", "clone", "-q", origin, d, cwd=tmp, env=env)
                    os.makedirs(os.path.join(d, "auto"))
                    with open(os.path.join(d, "auto", "posted.json"), "w") as f:
                        json.dump({"base": {"ig": "0"}}, f)
                    shutil.copy(os.path.join(ROOT, "auto", "push_main.sh"), os.path.join(d, "auto"))
                    shutil.copy(os.path.join(ROOT, "auto", "merge_posted.py"), os.path.join(d, "auto"))
                    run("git", "add", "-A", cwd=d, env=env)
                    run("git", "commit", "-qm", "init", cwd=d, env=env)
                    run("git", "push", "-q", "origin", "HEAD:main", cwd=d, env=env)
                else:
                    run("git", "clone", "-q", origin, d, cwd=tmp, env=env)
                clones.append(d)
            a, b = clones
            for d, key in ((a, "from_a"), (b, "from_b")):
                p = os.path.join(d, "auto", "posted.json")
                data = json.load(open(p))
                data[key] = {"ig": key}
                json.dump(data, open(p, "w"))
                run("git", "commit", "-qam", key, cwd=d, env=env)
            run("git", "push", "-q", "origin", "HEAD:main", cwd=a, env=env)
            # 追跡中のファイルに未保存の変更があっても push できる（2026-10-25 19:28 の失敗）
            with open(os.path.join(b, "auto", "merge_posted.py"), "a") as f:
                f.write("\n# stray\n")
            r = subprocess.run(["bash", "auto/push_main.sh"], cwd=b, env=env, capture_output=True, text=True)
            self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
            run("git", "pull", "-q", "origin", "main", cwd=a, env=env)
            data = json.load(open(os.path.join(a, "auto", "posted.json")))
            self.assertEqual(set(data), {"base", "from_a", "from_b"})
        finally:
            shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
