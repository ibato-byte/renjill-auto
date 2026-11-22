"""クリの体が透明にならないこと（2026-11-22：ELV.pom を使う回で pomDefs を入れ忘れ、体のグラデーションが無くて透明になった）"""
import re, unittest, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]


class PomDefs(unittest.TestCase):
    def test_pom_always_carries_defs(self):
        src = (ROOT / 'rig/v2/elevator_set.js').read_text()
        body = src[src.index('ELV.pom = '):]
        body = body[:body.index('\n  };')]
        self.assertIn('return ELV.pomDefs() +', body, 'ELV.pom は pomDefs を一緒に返す（体の色の定義）')


if __name__ == '__main__':
    unittest.main()
