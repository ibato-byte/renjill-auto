"""Threads への自動投稿（依頼 #37-1）と、キャプションの検索語（#37-5）。post.py から呼ぶ。失敗しても本編は止めない。
Secrets は THREADS_ACCESS_TOKEN があれば動く（THREADS_USER_ID は無ければ /me から自動で取る）。トークンがなければ見送るだけ。"""
import os, time
import requests

THREADS_G = "https://graph.threads.net/v1.0"
MAX_TAGS = 3


class GrowthSkip(Exception):
    """今回は出さないだけ（失敗ではない）"""


DEFAULT_SEO = {"ja": "職場あるある｜うさぎ｜セリフなしアニメ", "en": "wordless office comedy · bunny boss · workplace humor"}


def seo_line(d):
    """キャプションに入れる、検索される言葉（日本語・英語）"""
    s = {**DEFAULT_SEO, **(d.get("seo") or {})}
    return f'{s["ja"]}\n{s["en"]}'


def threads_text(p, d):
    """Threads の本文（500文字まで。ハッシュタグは少なめ）"""
    from growth import tail_en
    return f'{p["caption_en"]}\n{p["caption_ja"]}\n\n{seo_line(d)}\n\n{tail_en(d)}'[:480]


# ---------- Threads ----------
def threads_ready():
    return bool(os.environ.get("THREADS_ACCESS_TOKEN"))


def threads_user_id(tok, http=requests):
    """THREADS_USER_ID があればそれを、なければトークンで /me を呼んで取る（トークンは出力しない）"""
    uid = os.environ.get("THREADS_USER_ID")
    if uid: return uid
    r = http.get(f"{THREADS_G}/me", params={"fields": "id", "access_token": tok}).json()
    if "id" not in r:
        msg = str(r.get("error", {}).get("message", ""))[:80] if isinstance(r.get("error"), dict) else ""
        raise GrowthSkip(f"Threads のユーザー ID を取得できず見送り（{msg}）")
    return str(r["id"])


def post_threads(p, d, video_url, http=requests, sleep=time.sleep):
    """Threads に動画（MP4・9:16）を出す。作る→処理待ち→公開の3段階。24時間の投稿上限（250件）の手前で止める。
    video_url：Instagram と同じ公開 URL（renjill-media）"""
    if not threads_ready():
        raise GrowthSkip("Threads の権限・Secrets（THREADS_ACCESS_TOKEN）が未設定で見送り")
    tok = os.environ["THREADS_ACCESS_TOKEN"]
    uid = threads_user_id(tok, http)
    lim = http.get(f"{THREADS_G}/{uid}/threads_publishing_limit", params={"fields": "quota_usage,config", "access_token": tok}).json()
    try:
        used, total = lim["data"][0]["quota_usage"], lim["data"][0]["config"]["quota_total"]
        if total - used < 5: raise GrowthSkip("Threads の24時間の投稿上限に近いので見送り")
    except (KeyError, IndexError, TypeError):
        if "error" in lim: raise GrowthSkip(f'Threads の権限を確認できず見送り（{str(lim["error"].get("message", ""))[:80]}）')
    text = threads_text(p, d)
    c = http.post(f"{THREADS_G}/{uid}/threads", data={"media_type": "VIDEO", "video_url": video_url, "text": text, "access_token": tok}).json()
    if "id" not in c: raise RuntimeError(c)
    for _ in range(40):  # 処理待ち（最大 ~10分）
        s = http.get(f"{THREADS_G}/{c['id']}", params={"fields": "status,error_message", "access_token": tok}).json()
        if s.get("status") == "FINISHED": break
        if s.get("status") in ("ERROR", "EXPIRED"): raise RuntimeError(s)
        sleep(15)
    r = http.post(f"{THREADS_G}/{uid}/threads_publish", data={"creation_id": c["id"], "access_token": tok}).json()
    if "id" not in r: raise RuntimeError(r)
    return r["id"]
