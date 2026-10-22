"""Bluesky への投稿（依頼 #38。無料）。YouTube に出した回のリンクカード（サムネ付き）と一言を投稿する。
必要な Secrets：BSKY_HANDLE（例 renjill.bsky.social）、BSKY_APP_PASSWORD（Bluesky の「アプリパスワード」。本物のパスワードではない）
ない間は見送るだけ（失敗にしない）。ログインは毎回1回だけ（上限：5分30回・1日300回）。
"""
import datetime as dt, os
import requests

PDS = "https://bsky.social/xrpc"
MAX_THUMB = 950_000


def post_text(p, d, max_len=300):
    """英語主・日本語従の短い本文（300文字以内）。ハッシュタグは付けない"""
    import growth
    s = f'{p["caption_en"]}\n{p["caption_ja"]}\n\n{growth.tail_en(d)}'
    return s if len(s) <= max_len else s[:max_len - 1] + "…"


def post_link_card(p, d, yt_id, thumb_path, env=None, http=requests):
    env = os.environ if env is None else env
    handle, pw = env.get("BSKY_HANDLE", ""), env.get("BSKY_APP_PASSWORD", "")
    if not handle or not pw: raise LookupError("BSKY_HANDLE / BSKY_APP_PASSWORD が未登録")
    s = http.post(f"{PDS}/com.atproto.server.createSession", json={"identifier": handle, "password": pw}, timeout=30).json()
    if "accessJwt" not in s: raise RuntimeError(f'ログイン失敗: {s.get("error", "不明")}')
    H = {"Authorization": f'Bearer {s["accessJwt"]}'}
    external = {"uri": f"https://www.youtube.com/shorts/{yt_id}", "title": f'Ren & Jill「{p["title"]}」', "description": p["caption_en"][:200]}
    if thumb_path and os.path.exists(thumb_path) and os.path.getsize(thumb_path) <= MAX_THUMB:
        with open(thumb_path, "rb") as f:
            b = http.post(f"{PDS}/com.atproto.repo.uploadBlob", headers={**H, "Content-Type": "image/jpeg"}, data=f.read(), timeout=60).json()
        if "blob" in b: external["thumb"] = b["blob"]
    rec = {"$type": "app.bsky.feed.post", "text": post_text(p, d), "langs": ["en", "ja"],
           "createdAt": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z"),
           "embed": {"$type": "app.bsky.embed.external", "external": external}}
    r = http.post(f"{PDS}/com.atproto.repo.createRecord", headers=H, json={"repo": s["did"], "collection": "app.bsky.feed.post", "record": rec}, timeout=60).json()
    if "uri" not in r: raise RuntimeError(f'投稿失敗: {r.get("error", "不明")}')
    return r["uri"]
