#!/usr/bin/env python3
"""トークンの期限チェック（毎日 6:00。.github/workflows/tokens.yml）
Instagram・Facebook（Meta のシステムユーザーのトークン IG_ACCESS_TOKEN）・YouTube・GitHub（HUB_TOKEN・MEDIA_TOKEN）のトークンが使えるか、期限が近くないかを確かめる。
- Meta：debug_token で有効か・期限（期限なし＝expires_at 0）・必要な権限（auto/facebook.py の ALL_SCOPES）がそろっているか、
  ページ 1358515160686321 のページトークンと Instagram の ID が取れるか。Secrets の IG_USER_ID・FB_PAGE_ID とは一致かどうかだけを出す。
- 読み取りの API だけを使う（debug_token・ページの取得）。投稿はしない。
- 値そのものは表示しない（有効かどうか・期限だけ）。
- 結果は dist/token_check_args（Automation Hub の report に渡す引数、NUL 区切り）に書く。
- 手動予約モード（auto/mode.json）の SNS は確認しない（「手動予約モード中」と表示。エラー・メールにしない）。
- 問題があれば終了コード 1（Hub で「エラー」になり、やることに手順が出る）。期限が残り14日を切ったものは「やること」に出す（Hub で「要対応」）。
- 使えない・残り14日を切ったものは、オーナーにメールで知らせる（auto/alerts.py。同じ内容は1日1通まで）。
"""
import datetime as dt, os, pathlib, sys
import requests
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import facebook as fb
import mode
import alerts

WARN_DAYS = 14  # 残りがこれ以下なら「要対応」＋メール（Hub の指示 #5）
now = dt.datetime.now(dt.timezone.utc)
kpis, actions, problems = [], [], []

def days_left(ts):
    return (dt.datetime.fromtimestamp(ts, dt.timezone.utc) - now).days

# ---- Meta（Instagram・Facebook 共通。システムユーザーのトークン IG_ACCESS_TOKEN）----
# debug_token で有効か・期限（期限なしなら expires_at=0）・権限（fb.ALL_SCOPES）を見て、
# ページ 1358515160686321 からページトークン（Facebook の投稿用）と Instagram の ID が取れるかを確かめる。
FIX_META = "docs/setup/facebook-reels.md の手順で、ビジネス設定（renjill_office）→ システムユーザー renjill-auto のトークンを期限なし・必要な権限つきで生成し直し、renjill-auto の Settings → Secrets → Actions の IG_ACCESS_TOKEN を差し替える"
meta_manual = [x for x in ("ig", "facebook") if mode.is_manual(x)]
if meta_manual:
    kpis.append("Instagram・Facebook=手動予約モード中")  # API を使わないので、無効でもエラー・メールにしない（auto/mode.json）
elif not os.environ.get("IG_ACCESS_TOKEN"):
    problems.append("Meta"); kpis.append("Meta トークン=未設定")
    actions.append("Instagram・Facebook のトークン（IG_ACCESS_TOKEN）が未設定。" + FIX_META)
else:
    try:
        m = fb.diagnose()
        for r in m["reasons"]: print("Meta:", fb.scrub(r))
        if m["expires_at"] is None:  # 無効・確認できず
            problems.append("Meta"); kpis.append("Meta トークン=無効")
            actions.append("Instagram・Facebook のトークン（IG_ACCESS_TOKEN）が使えない（" + "; ".join(m["reasons"])[:120] + "）。" + FIX_META)
        else:
            exp = m["expires_at"]
            kpis.append("Meta トークン=" + ("期限なし" if exp == 0 else f"残り{days_left(exp)}日"))
            print(f"Meta: トークンの種類={m['token_type']} expires_at={'0（期限なし）' if exp == 0 else '期限あり'}")
            if exp and days_left(exp) <= WARN_DAYS:
                actions.append(f"Instagram・Facebook のトークン（IG_ACCESS_TOKEN）が残り{days_left(exp)}日で切れる。{FIX_META}")
            missing = [x for x in fb.ALL_SCOPES if x not in m["scopes"]]
            kpis.append("Meta 権限=" + ("すべてOK" if not missing else f"不足{len(missing)}件"))
            print("Meta: 権限", "すべてあり（" + ", ".join(fb.ALL_SCOPES) + "）" if not missing else "足りない：" + ", ".join(missing))
            if missing:
                problems.append("Meta")
                actions.append(f"Instagram・Facebook のトークン（IG_ACCESS_TOKEN）に権限が足りない（{', '.join(missing)}）。{FIX_META}")
            dax = m["data_access_expires_at"] or 0
            if dax and days_left(dax) <= WARN_DAYS:
                kpis.append(f"Meta データアクセス=残り{days_left(dax)}日")
                actions.append(f"Instagram・Facebook のデータアクセスが残り{days_left(dax)}日で切れる。{FIX_META}")
            # Facebook ページ（ページトークンが取れるか）
            sec_page = os.environ.get("FB_PAGE_ID", "").strip()
            page_note = "" if not sec_page else ("・Secret の FB_PAGE_ID と一致" if sec_page == fb.PAGE_ID else "・Secret の FB_PAGE_ID は別の値（使っていない）")
            if m["ok"]:
                kpis.append(f"Facebook=OK（ページ {fb.PAGE_ID}{page_note}）")
                print(f"Facebook: ページ「{m['page_name']}」（{fb.PAGE_ID}）のページトークンを取れた")
            elif not missing:
                problems.append("Facebook"); kpis.append("Facebook=ページトークンが取れない")
                actions.append(f"Facebook ページ {fb.PAGE_ID} のページトークンが取れない（" + "; ".join(m["reasons"])[:120] + "）。ビジネス設定 → システムユーザー renjill-auto にページ「レンとジル Ren & Jill」をフルアクセスで割り当てる")
            # Instagram の ID（ページにつながった Instagram）
            sec_ig = os.environ.get("IG_USER_ID", "").strip()
            if m["ig_user_id"]:
                same = "Secret 未設定" if not sec_ig else ("Secret と一致" if sec_ig == m["ig_user_id"] else "Secret と不一致（投稿はページから取った ID を使う）")
                kpis.append(f"Instagram=OK（ID {m['ig_user_id']}・{same}）")
                print(f"Instagram: ページにつながった Instagram の ID={m['ig_user_id']}（IG_USER_ID：{same}）")
            elif m["page_name"] or m["ok"]:
                problems.append("Instagram"); kpis.append("Instagram=ID が取れない")
                actions.append(f"Instagram の ID が取れない（ページ {fb.PAGE_ID} の instagram_business_account が空）。ページの設定 → リンク済みのアカウントで @renjill_office をつなぎ、システムユーザーにも Instagram を割り当てる")
    except Exception as e:
        problems.append("Meta"); kpis.append("Meta トークン=確認失敗")
        print("Meta check error:", type(e).__name__)

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
# メールで知らせる（キーは Secret ごと。同じ日に同じキーは送らない）
SECRETS = ("IG_ACCESS_TOKEN", "YT_REFRESH_TOKEN", "HUB_TOKEN", "MEDIA_TOKEN")
for a in actions:
    key = ("FB_PAGE" if a.startswith("Facebook") else "IG_USER_ID" if a.startswith("Instagram の ID") else "IG_DATA_ACCESS" if "データアクセス" in a
           else next((x for x in SECRETS if x in a), "other"))
    head, _, fix = a.partition("。")
    alerts.add(f"check:{key}", head, fix or "Automation Hub の「トークンの期限チェック」の「やること」を参照")
(out / "token_check_args").write_bytes(b"\0".join(s.encode() for s in args) + b"\0")
print("結果:", " / ".join(kpis))
for a in actions: print("やること:", a)
sys.exit(1 if problems else 0)
