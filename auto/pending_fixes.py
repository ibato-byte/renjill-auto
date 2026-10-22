#!/usr/bin/env python3
"""直した素材が、マージされないまま投稿時刻を迎えないか見張る（Hub の依頼 #26、2026-10-22）。
対象：main に入っていない変更（開いている PR、または PR のないブランチ）のうち、auto/schedule.json か dist/*_thumb* を変えるもの。
次に API で出す回（Instagram・Facebook がまだ）が 36 時間以内なら、@ibato-byte 付きの Issue（ラベル pending-fix）で知らせる。
- PR がある → 「承認してマージ」の1クリック案内（PR のリンク付き）
- PR がない → 「ブランチに置きっぱなし」（Claude に PR を作らせる案内）
同じ PR・ブランチは1日1通まで。秘密の値は扱わない。

  python auto/pending_fixes.py        … GITHUB_TOKEN・GITHUB_REPOSITORY が必要（contents: read, pull-requests: read, issues: write）
"""
import datetime as dt, json, os, pathlib, sys

import requests

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import alerts  # noqa: E402
import mode  # noqa: E402

AUTO = pathlib.Path(__file__).resolve().parent
JST = dt.timezone(dt.timedelta(hours=9))
LABEL = "pending-fix"
WITHIN_H = 36
META = ("ig", "facebook")


def touches_material(files):
    return any(f == "auto/schedule.json" or (f.startswith("dist/") and "_thumb" in f) for f in files)


def next_api_post(sch, posted, now):
    """次に Instagram・Facebook へ API で出す回 (datetime, p)。なければ None"""
    best = None
    for p in sch["posts"]:
        h, m = map(int, p["slot"].split(":"))
        t = dt.datetime.fromisoformat(p["date"]).replace(hour=h, minute=m, tzinfo=JST)
        if t <= now: continue
        done = posted.get(f'{p["date"]}_{p["ep"]}', {})
        if any(x in p.get("platforms", sch["defaults"]["platforms"]) and x not in done and not mode.is_manual(x) for x in META):
            if best is None or t < best[0]: best = (t, p)
    return best


def find(gh, now, sch, posted):
    """知らせるべきもの [(key, 見出し, 本文)]"""
    nxt = next_api_post(sch, posted, now)
    if not nxt or nxt[0] - now > dt.timedelta(hours=WITHIN_H): return []
    when = f'{nxt[0]:%m/%d %H:%M}「{nxt[1]["title"]}」'
    out, pr_heads = [], set()
    for pr in gh.get(f"/pulls", state="open", base="main", per_page=30):
        pr_heads.add(pr["head"]["ref"])
        files = [f["filename"] for f in gh.get(f'/pulls/{pr["number"]}/files', per_page=100)]
        if touches_material(files):
            out.append((f'pr{pr["number"]}', "直した素材がまだマージされていません（承認待ち）",
                        f'次の投稿（{when}）までにマージされないと、直す前の素材で出ます。\n'
                        f'→ 承認してマージ（1クリック）：{pr["html_url"]}'))
    for br in gh.get("/branches", per_page=100):
        name = br["name"]
        if name == "main" or name in pr_heads or not name.startswith("claude/"): continue
        cmp = gh.get(f"/compare/main...{name}")
        if cmp.get("ahead_by", 0) and touches_material([f["filename"] for f in cmp.get("files", [])]):
            out.append((f"br:{name}", "直した素材がブランチに置きっぱなしです（PR がありません）",
                        f'ブランチ {name} に、まだ main に入っていない素材の修正があります。次の投稿（{when}）に間に合わないかもしれません。'
                        f'Claude に「{name} の素材修正を PR にして」と伝えてください。'))
    return out


class Api:
    def __init__(self, token, repo, http=requests):
        self.base, self.http = f"https://api.github.com/repos/{repo}", http
        self.h = {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}

    def get(self, path, **params):
        r = self.http.get(self.base + path, headers=self.h, params=params, timeout=30)
        if r.status_code >= 300: raise RuntimeError(f"GitHub {r.status_code}")
        return r.json()

    def post(self, path, body):
        return self.http.post(self.base + path, headers=self.h, json=body, timeout=30)


def notify(api, items, day):
    """今日まだ知らせていないものだけ Issue にする。送った件数を返す"""
    sent = "\n".join(i.get("body") or "" for i in api.get("/issues", labels=LABEL, state="all", per_page=30, since=f"{day}T00:00:00+09:00") if not i.get("pull_request"))
    new = [it for it in items if alerts.marker(day, it[0]) not in sent]
    for key, title, body in new:
        api.post("/labels", {"name": LABEL, "color": "D9822B"})  # 既にあれば 422（無視）
        api.post("/issues", {"title": f"【要承認】{title}", "labels": [LABEL],
                             "body": f"@{alerts.OWNER} {body}\n\nこの案内は同じ内容につき1日1回です。\n{alerts.marker(day, key)}"})
    return len(new)


def main():
    tok, repo = os.environ.get("GITHUB_TOKEN"), os.environ.get("GITHUB_REPOSITORY")
    if not tok or not repo: print("GITHUB_TOKEN がないため確認しない"); return 0
    now = dt.datetime.now(JST)
    sch = json.loads((AUTO / "schedule.json").read_text())
    posted = json.loads((AUTO / "posted.json").read_text())
    api = Api(tok, repo)
    try:
        items = find(api, now, sch, posted)
        n = notify(api, items, now.strftime("%Y-%m-%d")) if items else 0
        print(f"未マージの素材修正 {len(items)} 件、メールで知らせた {n} 件")
    except Exception as e:
        print("確認できなかった:", type(e).__name__, str(e)[:100])
    return 0


if __name__ == "__main__":
    sys.exit(main())
