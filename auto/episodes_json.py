#!/usr/bin/env python3
"""公式サイト（ibato-byte/renjill-site）のエピソード一覧 episodes.json を、公開リポジトリ renjill-media に書く（仕様は renjill-site の README）。
- 出す回：posted.json に記録があり、公開日（日本時間）が今日以前の回。毎回すべての回を書き出す（初回も全件）
- 題は日本語の文字列（回ごとの翻訳 title_i18n に英語があれば {ja,en,zh,ko}）。サイトは知っている回の英語・繁体字・韓国語を自分の埋め込みから補う
- カバー・動画は renjill-media に実際にある名前だけ載せる。YouTube の ID は posted.json の本物の ID だけ（"manual" は載せない）
- 投稿の後処理。失敗しても投稿は止めない（post.py から呼ぶ）。sns_policy.json の episodes_json が false なら何もしない

  python auto/episodes_json.py --dry-run   … 書き出す中身を表示するだけ（ネットワークに出ない）
"""
import datetime as dt, json, pathlib, sys

AUTO = pathlib.Path(__file__).resolve().parent
JST = dt.timezone(dt.timedelta(hours=9))
NOT_ID = ("manual", "bs-scheduled")
NAME = "episodes.json"


def build(sch, posted, media_files=(), today=None):
    today = today or dt.datetime.now(JST).date().isoformat()
    files = set(media_files)
    out = []
    for p in sch["posts"]:
        key = f'{p["date"]}_{p["ep"]}'
        if key not in posted or p["date"] > today: continue
        i18n = p.get("title_i18n") or {}
        title = {k: v for k, v in {"ja": p["title"], "en": i18n.get("en"), "zh": i18n.get("zh-Hant"), "ko": i18n.get("ko")}.items() if v} if i18n.get("en") else p["title"]
        e = {"ep": p["ep"], "date": p["date"], "title": title, "caption_ja": p.get("caption_ja", ""), "caption_en": p.get("caption_en", "")}
        stamp = p["date"].replace("-", "")
        for k, name in (("cover", f"{stamp}_{p['ep']}_cover.jpg"), ("video", f"{stamp}_{p['ep']}.mp4")):
            if name in files: e[k] = name
        yt = posted[key].get("yt")
        if yt and yt not in NOT_ID: e["youtube_id"] = yt
        out.append(e)
    return sorted(out, key=lambda e: e["date"], reverse=True)


def media_listing(repo, token=None):
    """renjill-media の一番上のファイル名（読み取りのみ）"""
    import requests
    H = {"Accept": "application/vnd.github+json"}
    if token: H["Authorization"] = f"Bearer {token}"
    r = requests.get(f"https://api.github.com/repos/{repo}/contents/", headers=H, timeout=30)
    r.raise_for_status()
    return [f["name"] for f in r.json() if f.get("type") == "file"]


def write_local(path, eps):
    pathlib.Path(path).write_text(json.dumps(eps, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return path


def main(argv):
    sch = json.loads((AUTO / "schedule.json").read_text())
    posted = json.loads((AUTO / "posted.json").read_text())
    eps = build(sch, posted)
    print(json.dumps(eps, ensure_ascii=False, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
