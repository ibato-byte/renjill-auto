"""台本（rig/ep/*.js）とセット（rig/v2/*.js）の文法を確かめる（2026-11-22：行の途中に「//」の説明を入れて、残りの式がコメントになり、第3話が描けなくなった）"""
import pathlib, shutil, subprocess, unittest
ROOT = pathlib.Path(__file__).resolve().parents[1]


@unittest.skipUnless(shutil.which("node"), "node が無い")
class JsSyntax(unittest.TestCase):
    def test_all_scripts_parse(self):
        bad = []
        for f in sorted(list((ROOT / "rig/ep").glob("*.js")) + list((ROOT / "rig/v2").glob("*.js"))):
            r = subprocess.run(["node", "--check", str(f)], capture_output=True, text=True)
            if r.returncode: bad.append(f"{f.name}: {r.stderr.strip().splitlines()[-1] if r.stderr.strip() else ''}")
        self.assertEqual(bad, [])


if __name__ == "__main__":
    unittest.main()
