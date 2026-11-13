#!/usr/bin/env python3
"""投稿せずに、鍵と接続だけを確認する（Actions の check ワークフローから実行）。読み取りのみ。秘密の値は一切表示しない。"""
import os, sys, pathlib, requests
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import facebook as fb
ok = True
def res(name, good, info=""):
    global ok; ok &= bool(good); print(("OK " if good else "NG "), name, fb.scrub(info), flush=True)

# YouTube
try:
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    creds = Credentials(None, refresh_token=os.environ["YT_REFRESH_TOKEN"], token_uri="https://oauth2.googleapis.com/token",
                        client_id=os.environ["YT_CLIENT_ID"], client_secret=os.environ["YT_CLIENT_SECRET"])
    r = build("youtube", "v3", credentials=creds).channels().list(part="snippet,statistics,status", mine=True).execute()
    it = r["items"][0]; res("YouTube", True, f'channel={it["snippet"]["title"]} subs={it["statistics"].get("subscriberCount")}')
    # 15分を超える動画を出せるか（作業用BGMの長尺に必要。allowed 以外なら、オーナーが https://www.youtube.com/verify で電話番号の確認をする）
    print("   YouTube 15分超の動画:", (it.get("status") or {}).get("longUploadsStatus"), flush=True)
except Exception as e: res("YouTube", False, repr(e)[:200])

# Meta（システムユーザーのトークン：期限・権限・ページ・Instagram の ID）
uid = None
try:
    m = fb.diagnose()
    if m["expires_at"] is not None:
        missing = [x for x in fb.ALL_SCOPES if x not in m["scopes"]]
        res("Meta token", True, f"type={m['token_type']} expires_at={m['expires_at']}" + ("（期限なし）" if m["expires_at"] == 0 else ""))
        res("Meta scopes", not missing, "すべてあり：" + ", ".join(fb.ALL_SCOPES) if not missing else "足りない：" + ", ".join(missing))
    res("Facebook page", m["ok"], f"page={m['page_id']} name={m['page_name']}" if m["ok"] else "; ".join(m["reasons"])[:300])
    sec = os.environ.get("FB_PAGE_ID", "").strip()
    if sec: print("   Secret FB_PAGE_ID:", "一致" if sec == fb.PAGE_ID else f"不一致（コードは {fb.PAGE_ID} を使う）")
    uid = m["ig_user_id"]
    sec = os.environ.get("IG_USER_ID", "").strip()
    res("Instagram id", bool(uid), f"instagram_business_account={uid}（Secret IG_USER_ID：" + ("未設定" if not sec else "一致" if sec == uid else "不一致") + "）")
except Exception as e: res("Meta", False, type(e).__name__)

# Instagram（読み取り：アカウントと投稿の上限）
try:
    uid, tok = uid or os.environ["IG_USER_ID"], os.environ["IG_ACCESS_TOKEN"]
    r = requests.get(f"{fb.G}/{uid}", params={"fields": "username,followers_count,media_count", "access_token": tok}, timeout=30).json()
    res("Instagram", "username" in r, str({k: r.get(k) for k in ("username", "followers_count", "media_count", "error")}))
    q = requests.get(f"{fb.G}/{uid}/content_publishing_limit", params={"access_token": tok}, timeout=30).json()
    res("Instagram publish quota", "data" in q, str(q.get("data", q.get("error")))[:200])
except Exception as e: res("Instagram", False, repr(e)[:200])

# 公開URLの置き場（renjill-media）に書けるか（読み取りで権限だけ見る）
try:
    repo = os.environ.get("MEDIA_REPO", "ibato-byte/renjill-media")
    r = requests.get(f"https://api.github.com/repos/{repo}", headers={"Authorization": f"Bearer {os.environ['MEDIA_TOKEN']}", "Accept": "application/vnd.github+json"}, timeout=30)
    j = r.json() if r.status_code == 200 else {}
    res("renjill-media", r.status_code == 200 and (j.get("permissions") or {}).get("push") and not j.get("private"),
        f"HTTP {r.status_code} push={(j.get('permissions') or {}).get('push')} public={not j.get('private', True)}")
except Exception as e: res("renjill-media", False, type(e).__name__)

print("ALL OK" if ok else "SOME NG"); sys.exit(0 if ok else 1)

# 診断（Hub 依頼 #110。main には入れない）：Facebook リールの数字を、記録せずに表示する
try:
    import json, datetime as _dt, insights as _ins
    _m = fb.diagnose()
    _posted = json.loads((pathlib.Path(__file__).parent / "posted.json").read_text())
    _rows = _ins.fb_rows(_dt.datetime.now().strftime("%Y-%m-%d"), _posted, _m["token"], requests)
    for _r in _rows: print("   FB", _r[2], _r[3], _r[4], (_r[5] or "")[:120], flush=True)
except Exception as e: print("   FB 診断で失敗", type(e).__name__, flush=True)
