"""auto/posted.json の衝突を、両方の記録を合わせて解決する（union）。

使い方: merge_posted.py <main側.json> <今回保存した側.json> <出力先>
回（キー）は両方を残す。同じ回の同じ項目は、今回保存した側を優先する（空でない値だけ）。
"""
import json
import sys


def merge(base, mine):
    out = {k: dict(v) if isinstance(v, dict) else v for k, v in base.items()}
    for key, rec in mine.items():
        if isinstance(rec, dict) and isinstance(out.get(key), dict):
            for field, value in rec.items():
                if value in (None, "", []):
                    continue
                # 「manual」（手で予約済みの印）で、すでにある本物の ID を上書きしない（2026-11-01 に YouTube の ID が戻った。Hub 依頼 #170）
                cur = out[key].get(field)
                if value == "manual" and cur not in (None, "", [], "manual"):
                    continue
                out[key][field] = value
        else:
            out[key] = rec
    return out


if __name__ == "__main__":
    main_path, mine_path, dest = sys.argv[1:4]
    with open(main_path, encoding="utf-8") as f:
        a = json.load(f)
    with open(mine_path, encoding="utf-8") as f:
        b = json.load(f)
    with open(dest, "w", encoding="utf-8") as f:
        json.dump(merge(a, b), f, ensure_ascii=False, indent=2)
        f.write("\n")
