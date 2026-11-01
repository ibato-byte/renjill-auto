#!/usr/bin/env python3
"""公式サイト（https://renjill.coana.co.jp/、リポジトリ ibato-byte/renjill-site）のエピソード一覧 episodes.json を、公開リポジトリ renjill-media に書く。
サイトのエピソード一覧・ヒーローの動画・PICKUP・関係カードのリンクは、すべてこのファイルを読む（renjill-site の README「自動で更新されるもの」）。
- 1件の形：{ep, date, title:{ja,en,zh,ko}, caption:{ja,en,zh,ko}, cover, video, youtube_id}
  - 題・一言の4言語：ja は title・caption_ja、en は caption_en（題は site_i18n.title.en）、zh・ko は schedule.json の回の site_i18n（週次PDCAが書く）
  - 無い言語は書かない（サイトが英語→日本語の順で代わりに出す）
- 出す回：posted.json に記録があり、公開日（日本時間）が今日以前の回。今ある episodes.json とまとめる（今ある回・今ある項目は消さない。
  YouTube の ID など、今回分からない項目は前のまま残す）
- カバー・動画は renjill-media に実際にある名前だけ載せる。YouTube の ID は posted.json の本物の ID だけ（"manual" は載せない）
- 投稿の後処理。失敗しても投稿は止めない（post.py から呼ぶ）。sns_policy.json の episodes_json が false なら何もしない

  python auto/episodes_json.py   … 書き出す中身を表示するだけ（今ある episodes.json とはまとめない。ネットワークに出ない）
"""
import datetime as dt, json, pathlib, sys

AUTO = pathlib.Path(__file__).resolve().parent
JST = dt.timezone(dt.timedelta(hours=9))
NOT_ID = ("manual", "bs-scheduled")
NAME = "episodes.json"
LANGS = ("ja", "en", "zh", "ko")


def _clean(d):
    return {k: d[k] for k in LANGS if d.get(k)}


def entry(p, rec, files):
    si = p.get("site_i18n") or {}
    st, sc, ti = si.get("title") or {}, si.get("caption") or {}, p.get("title_i18n") or {}
    e = {"ep": p["ep"], "date": p["date"],
         "title": _clean({"ja": p["title"], "en": st.get("en") or ti.get("en"), "zh": st.get("zh") or ti.get("zh-Hant"), "ko": st.get("ko") or ti.get("ko")}),
         "caption": _clean({"ja": p.get("caption_ja"), "en": p.get("caption_en"), "zh": sc.get("zh"), "ko": sc.get("ko")})}
    stamp = p["date"].replace("-", "")
    for k, name in (("cover", f"{stamp}_{p['ep']}_cover.jpg"), ("video", f"{stamp}_{p['ep']}.mp4")):
        if name in files: e[k] = name
    yt = (rec or {}).get("yt")
    if yt and yt not in NOT_ID: e["youtube_id"] = yt
    return e


def build(sch, posted, media_files=(), today=None, also=()):
    """also：今の episodes.json にすでにある回（投稿前に載せた回も、予定表の文言・4言語で書き直す）"""
    today = today or dt.datetime.now(JST).date().isoformat()
    files, also = set(media_files), set(also)
    out = [entry(p, posted.get(f'{p["date"]}_{p["ep"]}'), files) for p in sch["posts"]
           if (f'{p["date"]}_{p["ep"]}' in posted and p["date"] <= today) or p["ep"] in also]
    return sorted(out, key=lambda e: e["date"], reverse=True)


def normalize(e):
    """旧形式（title が文字列・caption_ja／caption_en）を4言語の形にそろえる"""
    e = dict(e)
    if isinstance(e.get("title"), str): e["title"] = {"ja": e["title"]}
    cap = dict(e.get("caption") or {}) if isinstance(e.get("caption"), dict) else {}
    for lang in ("ja", "en"):
        v = e.pop(f"caption_{lang}", None)
        if v and not cap.get(lang): cap[lang] = v
    if cap: e["caption"] = cap
    return e


def merge(old, new):
    """今ある一覧（old）に今回の分（new）を重ねる。今回分からない項目・言語・回は前のまま残す"""
    by = {e["ep"]: normalize(e) for e in (old or []) if isinstance(e, dict) and e.get("ep")}
    for e in new:
        cur = by.get(e["ep"], {})
        m = {**cur, **e}
        for k in ("title", "caption"):
            a, b = cur.get(k), e.get(k)
            if isinstance(a, dict) and isinstance(b, dict): m[k] = {**a, **b}
            elif isinstance(a, str) and isinstance(b, dict): m[k] = {"ja": a, **b}
        by[e["ep"]] = m
    return sorted(by.values(), key=lambda e: e.get("date", ""), reverse=True)


def fetch_existing(repo, token=None):
    """renjill-media にある今の episodes.json（なければ []。読み取りのみ）"""
    import requests
    H = {"Accept": "application/vnd.github.raw+json"}
    if token: H["Authorization"] = f"Bearer {token}"
    r = requests.get(f"https://api.github.com/repos/{repo}/contents/{NAME}", headers=H, timeout=30)
    if r.status_code == 404: return []
    r.raise_for_status()
    data = r.json()
    return data if isinstance(data, list) else data.get("episodes", [])


def media_listing(repo, token=None):
    """renjill-media の一番上のファイル名（読み取りのみ。フォルダの一覧は1000件までなので、git の木で数える）"""
    import requests
    H = {"Accept": "application/vnd.github+json"}
    if token: H["Authorization"] = f"Bearer {token}"
    r = requests.get(f"https://api.github.com/repos/{repo}/git/trees/main", headers=H, timeout=30)
    r.raise_for_status()
    return [f["path"] for f in r.json().get("tree", []) if f.get("type") == "blob"]


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
