"""3つの SNS（Instagram・YouTube・TikTok）に、完成した短い動画が全部出ているかを見る（2026-11-22 オーナー：「今後も完成したショートアニメはこの３つのSNSに必ずあげて」）。
- Instagram・YouTube：自動投稿が posted.json に投稿の ID を書く（ID が無ければ「出ていない」）
- TikTok：自動では出せない（post.py の post_tiktok）。"tt": "manual" は「依頼を出した」だけ。
  Claude が TikTok Studio の一覧で出ているのを確かめたら "tt_ok": "YYYY-MM-DD 確認" を書く。tt_ok が無い回は「TikTok がまだ」
使い方：python3 auto/sns_gaps.py   → 足りない回を日付の順に出す（無ければ「漏れなし」）。終わりのコードは漏れの数"""
import json, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]


def gaps(posted):
    out = []
    for key in sorted(posted):
        v = posted[key]
        if v.get("promo") or v.get("skip_sns_check"): continue
        miss = [name for name, ok in (("Instagram", v.get("ig")), ("YouTube", v.get("yt")), ("TikTok", v.get("tt_ok"))) if not ok]
        if miss: out.append((key, v.get("title", ""), miss))
    return out


def main():
    g = gaps(json.loads((ROOT / "auto/posted.json").read_text()))
    for key, title, miss in g: print(f"{key}「{title}」: {'・'.join(miss)} がまだ")
    if not g: print("漏れなし")
    return len(g)


if __name__ == "__main__":
    sys.exit(min(main(), 100))
