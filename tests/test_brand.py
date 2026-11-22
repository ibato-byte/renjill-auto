"""旧名が、これから出す物（台本・予定・在庫・キャプションの作り方）に残っていないか（2026-11-22 改名）。
旧名を書いてよいのは、過去の記録（posted.json・content/*.csv）と、「旧名」と書いた行だけ。"""
import os, re, subprocess, unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# 旧名の一覧（この行は「旧名」を含むので置き換えの道具が変えない）
OLD = re.compile("レンとジル|(?<![ァ-ー])(?:レン|ジル|ポム)(?![ァ-ー])|(?<![A-Za-z0-9_.$/-])(?:R" "en|J" "ill|P" "om|R" "EN|J" "ILL)(?![A-Za-z0-9_/-])|renjill_office|renjill\\.coana\\.co\\.jp")
SKIP = re.compile(r"^(content/.*\.csv|auto/posted\.json|auto/bgm_state\.json|dist/.*\.json|docs/|tests/test_brand\.py|README\.md)")


class BrandTest(unittest.TestCase):
    def test_no_old_names(self):
        files = subprocess.run(["git", "-C", ROOT, "ls-files"], capture_output=True, text=True).stdout.split("\n")
        hits = []
        for f in files:
            if not f or SKIP.search(f) or not re.search(r"\.(py|js|json|html|md|txt|yml)$", f): continue
            try:
                with open(os.path.join(ROOT, f), encoding="utf-8") as fh: lines = fh.read().split("\n")
            except (UnicodeDecodeError, OSError): continue
            for i, l in enumerate(lines, 1):
                if "旧名" in l or "旧ID" in l: continue
                l2 = re.sub(r"https?://\S+", "", l)
                m = OLD.search(l2)
                if m: hits.append(f"{f}:{i} {m.group(0)}")
        self.assertEqual(hits[:20], [], f"旧名が {len(hits)} か所に残っている")


if __name__ == "__main__":
    unittest.main()
