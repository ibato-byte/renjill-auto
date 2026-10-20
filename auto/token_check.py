#!/usr/bin/env python3
"""トークンの期限チェック（毎週。.github/workflows/tokens.yml）
Instagram・Facebook（ページ「レンとジル」へのリール投稿の権限）・YouTube・GitHub（HUB_TOKEN・MEDIA_TOKEN）のトークンが使えるか、期限が近くないかを確かめる。
FLOTO の自動格納が使う freee・Google の連携は、格納が毎日確かめて Hub の台帳に書く結果を読む（auto/floto_tokens.py）。
- 読み取りの API だけを使う（debug_token・/me）。投稿はしない。
- 値そのものは表示しない（有効かどうか・期限だけ）。
- 結果は dist/token_check_args（Automation Hub の report に渡す引数、NUL 区切り）に書く。
- 問題があれば終了コード 1（Hub で「エラー」になり、やることに手順が出る）。
"""
import datetime as dt, os, pathlib, sys
import requests
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import facebook as fb
import floto_tokens

WARN_DAYS = 21
now = dt.datetime.now(dt.timezone.utc)
kpis, actions, problems = [], [], []

def days_left(ts):
    return (dt.datetime.fromtimestamp(ts, dt.timezone.utc) - now).days

# ---- Instagram（ページトークン）----
ig = os.environ.get("IG_ACCESS_TOKEN", "")
if not ig:
    kpis.append("Instagram=未設定")
else:
    try:
        r = requests.get("https://graph.facebook.com/v21.0/debug_token", params={"input_token": ig, "access_token": ig}, timeout=30).json()
        d = r.get("data") or {}
        if not d.get("is_valid"):
            problems.append("Instagram")
            actions.append("Instagram のトークン（IG_ACCESS_TOKEN）が無効。グラフAPIエクスプローラで長期トークン→ me/accounts のページトークンを作り直し、renjill-auto の Secrets で差し替える")
            kpis.append("Instagram=無効")
        else:
            exp = d.get("expires_at", 0) or 0
            kpis.append("Instagram 期限=" + ("なし" if exp == 0 else f"残り{days_left(exp)}日"))
            if exp and days_left(exp) <= WARN_DAYS:
                actions.append(f"Instagram のトークン（IG_ACCESS_TOKEN）が残り{days_left(exp)}日で切れる。期限なしのページトークンに作り直して差し替える")
            dax = d.get("data_access_expires_at", 0) or 0
            if dax:
                kpis.append(f"Instagram データアクセス=残り{days_left(dax)}日")
                if days_left(dax) <= WARN_DAYS:
                    actions.append(f"Instagram のデータアクセスが残り{days_left(dax)}日で切れる。グラフAPIエクスプローラ（アプリ renjill-auto）で「Generate Access Token」を1回押して許可し直す（トークンの差し替えは不要）")
    except Exception as e:
        problems.append("Instagram"); kpis.append("Instagram=確認失敗")
        print("Instagram check error:", type(e).__name__)

# ---- Facebook（ページ「レンとジル」のリール投稿）----
try:
    f = fb.diagnose()
    for r in f["reasons"]: print("Facebook:", r)
    if f["ok"]:
        exp = f["expires_at"]
        kpis.append("Facebook=OK（" + ("期限なし" if exp == 0 else f"残り{days_left(exp)}日") + ("・IGと共用" if f["secret"] == "IG_ACCESS_TOKEN" else "") + "）")
        print(f"Facebook: {f['secret']} でページ「{f['page_name']}」に投稿できる（権限 {', '.join(fb.REQUIRED_SCOPES)}）")
        if exp and days_left(exp) <= WARN_DAYS:
            actions.append(f"Facebook のページトークン（{f['secret']}）が残り{days_left(exp)}日で切れる。docs/setup/facebook-reels.md の手順で期限なしのページトークンに作り直して差し替える")
    else:
        kpis.append("Facebook=権限・設定なし")
        actions.append("Facebook リールを自動投稿できない（" + "; ".join(f["reasons"])[:150] + "）。renjill-auto の docs/setup/facebook-reels.md の手順で権限 pages_show_list・pages_read_engagement・pages_manage_posts 付きのページトークンを発行し、Secrets の FB_PAGE_TOKEN を差し替える（それまで Facebook だけ飛ばし、他SNSは投稿を続ける）")
except Exception as e:
    kpis.append("Facebook=確認失敗")
    print("Facebook check error:", type(e).__name__)

# ---- YouTube（リフレッシュトークン）----
if os.environ.get("YT_REFRESH_TOKEN"):
    try:
        r = requests.post("https://oauth2.googleapis.com/token", data={
            "grant_type": "refresh_token", "refresh_token": os.environ["YT_REFRESH_TOKEN"],
            "client_id": os.environ.get("YT_CLIENT_ID", ""), "client_secret": os.environ.get("YT_CLIENT_SECRET", "")}, timeout=30)
        if r.status_code == 200:
            kpis.append("YouTube=OK")
        else:
            err = (r.json() or {}).get("error", r.status_code)
            problems.append("YouTube"); kpis.append("YouTube=無効")
            actions.append(f"YouTube のリフレッシュトークン（YT_REFRESH_TOKEN）が使えない（{err}）。Google Cloud の OAuth 同意画面が「テスト中」だと7日で切れるので「本番環境」に公開してから、トークンを取り直して差し替える")
    except Exception as e:
        problems.append("YouTube"); kpis.append("YouTube=確認失敗")
        print("YouTube check error:", type(e).__name__)

# ---- GitHub（fine-grained トークン）----
def gh_check(label, secret, repo):
    tok = os.environ.get(secret, "")
    if not tok:
        kpis.append(f"{label}=未設定"); return
    try:
        r = requests.get(f"https://api.github.com/repos/{repo}", headers={"Authorization": f"Bearer {tok}", "Accept": "application/vnd.github+json"}, timeout=30)
        if r.status_code != 200:
            problems.append(label); kpis.append(f"{label}=無効")
            actions.append(f"{secret} が使えない（{r.status_code}）。{repo} だけの fine-grained トークンを「No expiration」で作り直し、使っている場所すべてで差し替える")
            return
        exp = r.headers.get("github-authentication-token-expiration")
        if not exp:
            kpis.append(f"{label}=期限なし"); return
        when = dt.datetime.strptime(exp.replace(" UTC", ""), "%Y-%m-%d %H:%M:%S").replace(tzinfo=dt.timezone.utc)
        left = (when - now).days
        kpis.append(f"{label}=残り{left}日")
        if left <= WARN_DAYS:
            actions.append(f"{secret} が残り{left}日で切れる。GitHub の Fine-grained tokens で「Regenerate token」→「No expiration」にして差し替える")
    except Exception as e:
        problems.append(label); kpis.append(f"{label}=確認失敗")
        print(label, "check error:", type(e).__name__)

gh_check("Hub トークン", "HUB_TOKEN", "ibato-byte/automation-hub")
gh_check("動画置き場トークン", "MEDIA_TOKEN", "ibato-byte/renjill-media")

# ---- FLOTO の freee・Google（automation-hub の floto-mykomon-sync の記録を読む）----
if os.environ.get("HUB_TOKEN"):
    try:
        k, a, p = floto_tokens.status(floto_tokens.fetch(os.environ["HUB_TOKEN"]), now)
    except Exception as e:
        print("FLOTO check error:", type(e).__name__)
        k, a, p = floto_tokens.status(None, now)
    kpis += k; actions += a; problems += p

# ---- 出力 ----
args = []
for k in kpis[:8]:
    args += ["--kpi", k]
if actions:
    for a in actions:
        args += ["--owner-action", a[:300]]
else:
    args += ["--owner-action", "none"]
out = pathlib.Path("dist"); out.mkdir(exist_ok=True)
(out / "token_check_args").write_bytes(b"\0".join(s.encode() for s in args) + b"\0")
print("結果:", " / ".join(kpis))
for a in actions: print("やること:", a)
sys.exit(1 if problems else 0)
