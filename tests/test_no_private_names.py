"""公開リポジトリに、出してはいけないお客さま・関係者の名前が入っていないことを確かめる（2026-11-08 オーナー決定）。

名前そのものをこのファイルに書くと公開されてしまうので、SHA-256 の指紋だけを持ち、
追跡中のテキストファイルを同じ長さの窓でずらしながら照合する。
名前を足すときは: python -c "import hashlib;print(hashlib.sha256('名前'.lower().encode()).hexdigest())"
"""
import hashlib
import pathlib
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent

# (文字数, 小文字にした名前の SHA-256)
FORBIDDEN = {
    (5, "56d9779748296956f3e6edf31025d6da973bf9e6984120c35b4c517f1dcdc381"),
    (2, "7256636fb472b03e504cef2d4c43e3aed4779b146e29b5e266f34c68deb897f8"),
}
MAX_BYTES = 2_000_000


def _tracked_text_files():
    out = subprocess.run(["git", "ls-files", "-z"], cwd=ROOT, capture_output=True, check=True).stdout
    for rel in filter(None, out.decode().split("\0")):
        p = ROOT / rel
        try:
            if not p.is_file() or p.stat().st_size > MAX_BYTES:
                continue
            data = p.read_bytes()
        except OSError:
            continue
        if b"\0" in data[:8192]:
            continue  # バイナリ
        yield rel, data.decode("utf-8", errors="ignore").lower()


def find_private_names(texts):
    hits = []
    for rel, text in texts:
        for length, digest in FORBIDDEN:
            for i in range(len(text) - length + 1):
                if hashlib.sha256(text[i:i + length].encode()).hexdigest() == digest:
                    hits.append(rel)
                    break
    return sorted(set(hits))


class NoPrivateNames(unittest.TestCase):
    def test_detector_works(self):
        sample = [("x.md", "abc " + bytes([102, 108, 111, 116, 111]).decode() + " def")]
        self.assertEqual(find_private_names(sample), ["x.md"])
        self.assertEqual(find_private_names([("y.md", "renjill bunny")]), [])

    def test_repo_has_no_private_names(self):
        hits = find_private_names(_tracked_text_files())
        self.assertEqual(hits, [], f"公開してはいけない名前が入っています: {hits}")


if __name__ == "__main__":
    unittest.main()
