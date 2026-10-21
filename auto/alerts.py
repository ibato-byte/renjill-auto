#!/usr/bin/env python3
"""トークンの警告をオーナーにメールで知らせる（Automation Hub の指示 #5、2026-10-20）。

メールは coana-website の公開確認と同じしくみ：GitHub の Issue に @ibato-byte を付けて書くと、
GitHub の通知メールが ibato@coana.co.jp に届く（追加の Secrets・有料サービスなし）。
- 警告は1つの Issue（ラベル token-alert）にまとめる。閉じられていれば新しく作る。
- 同じ内容（キー）は1日1通まで：送ったキーを Issue に <!-- alert-sent:日付:キー --> として残し、同じ日には送らない。
- 秘密の値・エラーの原文は書かない（何が・どう直すかだけ）。

使い方
  各スクリプト：alerts.add("check:IG_ACCESS_TOKEN", "見出し", "直し方") … ALERTS_FILE（既定 dist/alerts.jsonl）に1行追記
  ワークフロー：python auto/alerts.py send   … まとめて送る（GITHUB_TOKEN・GITHUB_REPOSITORY が必要。issues: write）
"""
import datetime as dt, json, os, pathlib, re, sys

import requests

JST = dt.timezone(dt.timedelta(hours=9))
OWNER = os.environ.get("ALERT_OWNER", "ibato-byte")
LABEL = "token-alert"
TITLE = "【トークンの警告】自動投稿・数値の収集・トークンの期限チェック"

# トークンのエラー（期限切れ・取り消し・API の拒否）に当たる文言
TOKEN_ERROR_RE = re.compile(
    r"OAuthException|Error validating access token|Session has expired|has been invalidated|"
    r"['\"]code['\"]:\s*190\b|['\"]code['\"]:\s*102\b|invalid_grant|invalid_token|access_token_invalid|"
    r"scope_not_authorized|Invalid OAuth|unauthorized_client|Unauthorized", re.I)

# Secret ごとの直し方（Hub の「やること」と同じ内容）
FIX = {
    "IG_ACCESS_TOKEN": "ビジネス設定（renjill_office）→ システムユーザー renjill-auto で、ページ「レンとジル Ren & Jill」・Instagram @renjill_office・アプリ renjill-auto の割り当て（フルアクセス）を確かめ、期限なしのトークン（権限 pages_show_list・pages_read_engagement・pages_manage_posts・business_management・instagram_basic・instagram_content_publish・instagram_manage_insights）を生成し直して、renjill-auto の Settings → Secrets and variables → Actions の IG_ACCESS_TOKEN を差し替える（手順は docs/setup/facebook-reels.md）",
    "FB_PAGE_TOKEN": "Facebook のページトークンは IG_ACCESS_TOKEN（システムユーザーのトークン）から毎回取っている。docs/setup/facebook-reels.md の手順で、システムユーザーにページ 1358515160686321 のフルアクセスと権限 pages_manage_posts などがあるか確かめ、IG_ACCESS_TOKEN を差し替える",
    "YT_REFRESH_TOKEN": "Google Cloud の OAuth 同意画面を「本番環境」にしてから YouTube のリフレッシュトークンを取り直し、Secrets の YT_REFRESH_TOKEN を差し替える",
    "TT_ACCESS_TOKEN": "TikTok for Developers でアプリを認可し直し、Secrets の TT_ACCESS_TOKEN を差し替える",
    "MEDIA_TOKEN": "GitHub の Fine-grained tokens で renjill-media だけのトークンを「No expiration」で作り直し、Secrets の MEDIA_TOKEN を差し替える",
    "HUB_TOKEN": "GitHub の Fine-grained tokens で automation-hub だけのトークンを作り直し、使っている場所（各リポジトリの HUB_TOKEN と Cloudflare の GITHUB_TOKEN）すべてで差し替える",
}
PLATFORM_SECRET = {"ig": "IG_ACCESS_TOKEN", "facebook": "FB_PAGE_TOKEN", "yt": "YT_REFRESH_TOKEN", "tt": "TT_ACCESS_TOKEN"}
PLATFORM_NAME = {"ig": "Instagram", "facebook": "Facebook", "yt": "YouTube", "tt": "TikTok"}


def is_token_error(text):
    return bool(TOKEN_ERROR_RE.search(str(text)))


def _file():
    return pathlib.Path(os.environ.get("ALERTS_FILE", "dist/alerts.jsonl"))


def add(key, title, fix):
    f = _file(); f.parent.mkdir(parents=True, exist_ok=True)
    with f.open("a", encoding="utf-8") as w:
        w.write(json.dumps({"key": key, "title": title, "fix": fix}, ensure_ascii=False) + "\n")


def load():
    f = _file()
    if not f.exists(): return []
    seen, out = set(), []
    for line in f.read_text(encoding="utf-8").splitlines():
        if not line.strip(): continue
        a = json.loads(line)
        if a["key"] not in seen: seen.add(a["key"]); out.append(a)
    return out


def marker(day, key):
    return f"<!-- alert-sent:{day}:{key} -->"


def to_send(items, sent_text, day):
    """まだ今日送っていない警告だけ"""
    return [a for a in items if marker(day, a["key"]) not in sent_text]


def message(items, day, run_url=""):
    lines = [f"@{OWNER} トークンの警告（{day}）", ""]
    for a in items:
        lines += [f"### {a['title']}", f"- 直し方：{a['fix']}", ""]
    if run_url: lines.append(f"実行の記録：{run_url}")
    lines.append("同じ内容は1日1回だけお知らせします。直したら Actions の tokens を「Run workflow」で実行すると、Automation Hub の「トークンの期限チェック」に結果が出ます。")
    lines += [marker(day, a["key"]) for a in items]
    return "\n".join(lines)


class GitHub:
    def __init__(self, token, repo, http=requests):
        self.base, self.http = f"https://api.github.com/repos/{repo}", http
        self.h = {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}

    def _ok(self, r):
        if r.status_code >= 300: raise RuntimeError(f"GitHub {r.status_code}")
        return r.json() if r.content else None

    def open_issue(self):
        r = self._ok(self.http.get(f"{self.base}/issues", headers=self.h, params={"labels": LABEL, "state": "open", "per_page": 5}, timeout=30))
        return next((i for i in r if not i.get("pull_request")), None)

    def sent_text(self, issue):
        texts = [issue.get("body") or ""]
        if issue.get("comments"):
            cs = self._ok(self.http.get(f"{self.base}/issues/{issue['number']}/comments", headers=self.h, params={"per_page": 100}, timeout=30))
            texts += [c.get("body") or "" for c in cs]
        return "\n".join(texts)

    def create(self, body):
        self.http.post(f"{self.base}/labels", headers=self.h, json={"name": LABEL, "color": "B83C3C"}, timeout=30)  # 既にあれば 422（無視）
        return self._ok(self.http.post(f"{self.base}/issues", headers=self.h, json={"title": TITLE, "body": body, "labels": [LABEL]}, timeout=30))

    def comment(self, number, body):
        return self._ok(self.http.post(f"{self.base}/issues/{number}/comments", headers=self.h, json={"body": body}, timeout=30))


def send(gh, items, now=None, run_url=""):
    """送ったら送った件数、送るものがなければ 0"""
    if not items: return 0
    day = (now or dt.datetime.now(JST)).astimezone(JST).strftime("%Y-%m-%d")
    issue = gh.open_issue()
    new = to_send(items, gh.sent_text(issue) if issue else "", day)
    if not new: return 0
    body = message(new, day, run_url)
    if issue: gh.comment(issue["number"], body)
    else: gh.create(body)
    return len(new)


def main(argv):
    if argv[:1] != ["send"]:
        print(__doc__); return 0
    items = load()
    if not items: print("警告なし"); return 0
    tok, repo = os.environ.get("GITHUB_TOKEN"), os.environ.get("GITHUB_REPOSITORY")
    if not tok or not repo: print("GITHUB_TOKEN がないため送れない（警告", len(items), "件）"); return 0
    run_url = f"{os.environ.get('GITHUB_SERVER_URL', 'https://github.com')}/{repo}/actions/runs/{os.environ.get('GITHUB_RUN_ID', '')}"
    try:
        n = send(GitHub(tok, repo), items, run_url=run_url)
        print(f"警告 {len(items)} 件のうち {n} 件をメールで知らせた" if n else f"警告 {len(items)} 件は今日すでに知らせ済み（1日1通まで）")
    except Exception as e:
        print("警告を送れなかった:", type(e).__name__, str(e)[:100])
    return 0  # 知らせられなくても本来の結果は変えない


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
