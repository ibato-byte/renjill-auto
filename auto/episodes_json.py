#!/usr/bin/env python3
"""公式ページ用のエピソード一覧 episodes.json を作り、公開リポジトリ renjill-media に置く（依頼 #38・#40）。
公式ページは会社サイト coana-website の /renjill（毎日この一覧を取り込む）。投稿のたびに post.yml が実行する。AI は使わない。
入力：auto/schedule.json（回の情報・defaults.site のリンク）、auto/posted.json（YouTube の動画 ID）
YouTube の動画 ID がない回も載せる（公開日までは会社サイト側で出さない）。数字は載せない。"""
import datetime as dt, json, os, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
JST = dt.timezone(dt.timedelta(hours=9))
# 確かなリンクだけ固定。YouTube・Threads・Bluesky は schedule.json の defaults.site に URL を入れると載る（なければ載せない）
FIXED = {"instagram": "https://www.instagram.com/renjill_office/", "tiktok": "https://www.tiktok.com/@renjill_office",
         "x": "https://x.com/renjill_office", "facebook": "https://www.facebook.com/profile.php?id=1358515160686321"}
SITE_KEYS = ("youtube", "threads", "bluesky")


def build(sch, posted, now=None):
    site = (sch.get("defaults") or {}).get("site") or {}
    channels = dict(FIXED)
    for k in SITE_KEYS:
        u = site.get(k)
        channels[k] = u if isinstance(u, str) and u.startswith("https://") else None
    series, eps = [], []
    for p in sorted(sch["posts"], key=lambda x: (x["date"], x["no"])):
        yt = (posted.get(f'{p["date"]}_{p["ep"]}') or {}).get("yt")
        s = p.get("series") or None
        if s and s not in [x["id"] for x in series]: series.append({"id": s, "title": s})
        eps.append({"no": p["no"], "ep": p["ep"], "title": p["title"], "caption_ja": p["caption_ja"], "caption_en": p["caption_en"],
                    "date": p["date"], "series": s, "youtube_id": yt if yt and yt != "manual" else None})
    return {"updated": (now or dt.datetime.now(JST)).isoformat(timespec="seconds"), "channels": channels, "series": series, "episodes": eps}


def main():
    sch = json.loads((ROOT / "auto" / "schedule.json").read_text())
    pj = ROOT / "auto" / "posted.json"
    data = build(sch, json.loads(pj.read_text()) if pj.exists() else {})
    out = ROOT / "dist" / "episodes.json"
    out.parent.mkdir(exist_ok=True)
    text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    out.write_text(text, encoding="utf-8")
    print(f"[episodes] {len(data['episodes'])} 件")
    if os.environ.get("MEDIA_TOKEN"):
        sys.path.insert(0, str(ROOT / "auto"))
        import post
        post.media_publish(out, "episodes.json")


if __name__ == "__main__":
    main()
