#!/usr/bin/env python3
"""Facebook ページ「レンとジル」へのリール投稿（Meta 公式の Reels Publishing API）。

流れ（https://developers.facebook.com/docs/video-api/guides/reels-publishing）:
  1. POST graph.facebook.com/{page-id}/video_reels  upload_phase=start            → video_id, upload_url
  2. POST rupload.facebook.com/video-upload/<ver>/{video_id}
       ヘッダ Authorization: OAuth <ページトークン>, offset: 0, file_size: <バイト数>, 本文 = 動画ファイル
  3. POST graph.facebook.com/{page-id}/video_reels  upload_phase=finish, video_state=PUBLISHED, description
  4. GET  graph.facebook.com/{video_id}?fields=status で公開まで確認（読み取りのみ）

必要なもの: Facebook ログイン経由の「ページ」アクセストークン
  権限 pages_show_list・pages_read_engagement・pages_manage_posts（ページで「コンテンツの作成」ができる人が発行）。
  Secrets の FB_PAGE_TOKEN（なければ IG_ACCESS_TOKEN が同じページのページトークンなら流用）、FB_PAGE_ID（任意。あれば一致を確認）。
権限・設定がなければ FbSkip を投げ、呼び出し側は Facebook だけ飛ばして他SNSの投稿を続ける。
トークンの値は表示しない（エラー文からも消す）。
"""
import os, pathlib, re, time
import requests

GRAPH_VER = "v21.0"  # 既存の Instagram 投稿と同じ版
G = f"https://graph.facebook.com/{GRAPH_VER}"
RUPLOAD = f"https://rupload.facebook.com/video-upload/{GRAPH_VER}"
REQUIRED_SCOPES = ("pages_show_list", "pages_read_engagement", "pages_manage_posts")
PAGE_NAMES = ("レンとジル", "Ren & Jill", "REN & JILL")
MAX_TAGS = 3  # Facebook ではハッシュタグ3個以内
DEFAULT_CTA = "Who in your office does this? Tell us in the comments.\nあなたの職場にもいますか？コメントで教えてください"


class FbSkip(Exception):
    """権限・設定がないので Facebook だけ飛ばす（失敗ではなく、オーナーの対応待ち）"""


class FbBeforeFinish(Exception):
    """公開（finish）を送る前の失敗。やり直しても二重投稿にならない"""


def scrub(text, env=None):
    """メッセージからトークンの値を消す"""
    env = os.environ if env is None else env
    s = str(text)
    for k in ("FB_PAGE_TOKEN", "IG_ACCESS_TOKEN", "TT_ACCESS_TOKEN", "YT_REFRESH_TOKEN", "YT_CLIENT_SECRET", "MEDIA_TOKEN", "HUB_TOKEN"):
        v = env.get(k)
        if v and len(v) >= 8: s = s.replace(v, "***")
    return re.sub(r"(access_token=)[^&\s'\"]+", r"\1***", s)


def _json(r):
    try: return r.json()
    except Exception: return {"error": {"message": f"HTTP {getattr(r, 'status_code', '?')}（JSON でない応答）"}}


def _err(j):
    e = (j or {}).get("error") or {}
    return f'{e.get("code", "")} {e.get("type", "")} {e.get("message", j)}'.strip()[:300]


# ---------- キャプション ----------
def normalize_brand(text):
    """表記ルール：日本語は「レンとジル」、英語は「Ren & Jill」"""
    text = re.sub(r"レン\s*[＆&]\s*ジル", "レンとジル", text)
    return re.sub(r"\bRen\s+(?:and|＆)\s+Jill\b", "Ren & Jill", text)


def fb_tags(p, d):
    ts = p.get("tag_set", "A")
    src = (d.get("fb_tag_sets") or {}).get(ts) or d["tag_sets"][ts]
    return " ".join([t for t in src.split() if t.startswith("#")][:MAX_TAGS])


def caption(p, d):
    """caption_en → caption_ja → コメントを誘う一言 → ハッシュタグ3個以内"""
    cta = p.get("fb_cta") or d.get("fb_cta") or DEFAULT_CTA
    body = f'{p["caption_en"]}\n{p["caption_ja"]}\n\n{cta}'
    tags = fb_tags(p, d)
    return normalize_brand(body + (f"\n\n{tags}" if tags else ""))


# ---------- トークン・権限の確認（読み取りのみ） ----------
def _candidates(env):
    seen = set()
    for name in ("FB_PAGE_TOKEN", "IG_ACCESS_TOKEN"):
        tok = env.get(name, "")
        if tok and tok not in seen:
            seen.add(tok); yield name, tok


def inspect_token(tok, http=requests):
    r = http.get(f"{G}/debug_token", params={"input_token": tok, "access_token": tok}, timeout=30)
    return (_json(r).get("data") or {})


def diagnose(env=None, http=requests):
    """使えるページトークンを探す。値は返さず、どの Secret か・何が足りないかを返す。
    戻り値: {ok, secret, page_id, page_name, expires_at, data_access_expires_at, scopes, reasons[], token(内部用)}"""
    env = os.environ if env is None else env
    want = env.get("FB_PAGE_ID", "").strip()
    reasons = []
    for name, tok in _candidates(env):
        try:
            d = inspect_token(tok, http)
        except Exception as e:
            reasons.append(f"{name}: 確認できず（{type(e).__name__}）"); continue
        if not d.get("is_valid"):
            reasons.append(f"{name}: 無効なトークン"); continue
        if d.get("type") != "PAGE":
            reasons.append(f"{name}: ページトークンではない（{d.get('type', '不明')}）"); continue
        scopes = d.get("scopes") or []
        missing = [s for s in REQUIRED_SCOPES if s not in scopes]
        if missing:
            reasons.append(f"{name}: 権限が足りない（{', '.join(missing)}）"); continue
        try:
            me = _json(http.get(f"{G}/me", params={"fields": "id,name", "access_token": tok}, timeout=30))
        except Exception as e:
            reasons.append(f"{name}: ページを確認できず（{type(e).__name__}）"); continue
        pid, pname = str(me.get("id") or d.get("profile_id") or ""), me.get("name", "")
        if not pid:
            reasons.append(f"{name}: ページIDが取れない（{_err(me)}）"); continue
        if want and pid != want:
            reasons.append(f"{name}: FB_PAGE_ID と別のページのトークン"); continue
        if not want and not any(n in pname for n in PAGE_NAMES):
            reasons.append(f"{name}: ページ名が「レンとジル」ではない（FB_PAGE_ID を設定すれば ID で確認する）"); continue
        return {"ok": True, "secret": name, "page_id": pid, "page_name": pname, "scopes": scopes,
                "expires_at": d.get("expires_at", 0) or 0, "data_access_expires_at": d.get("data_access_expires_at", 0) or 0,
                "reasons": reasons, "token": tok}
    if not reasons: reasons.append("FB_PAGE_TOKEN が未設定")
    return {"ok": False, "secret": None, "page_id": want or None, "reasons": reasons, "token": None}


# ---------- 投稿 ----------
def publish_reel(page_id, tok, video_path, description, http=requests, sleep=time.sleep, polls=20, interval=15):
    video_path = pathlib.Path(video_path)
    size = video_path.stat().st_size
    j = _json(http.post(f"{G}/{page_id}/video_reels", data={"upload_phase": "start", "access_token": tok}, timeout=60))
    vid = j.get("video_id")
    if not vid: raise FbBeforeFinish(f"start: {_err(j)}")
    up_url = j.get("upload_url") or f"{RUPLOAD}/{vid}"
    if not up_url.startswith("https://rupload.facebook.com/"): raise FbBeforeFinish("start: 想定外のアップロード先")
    with video_path.open("rb") as f:
        u = _json(http.post(up_url, headers={"Authorization": f"OAuth {tok}", "offset": "0", "file_size": str(size)}, data=f, timeout=900))
    if not u.get("success"): raise FbBeforeFinish(f"upload: {_err(u)}")
    fin = _json(http.post(f"{G}/{page_id}/video_reels", data={
        "access_token": tok, "video_id": vid, "upload_phase": "finish", "video_state": "PUBLISHED", "description": description}, timeout=120))
    if not fin.get("success"):
        # finish を送った後は、やり直さない（二重投稿を防ぐ）
        raise RuntimeError(f"finish 失敗 video_id={vid}: {_err(fin)}")
    for _ in range(polls):
        s = (_json(http.get(f"{G}/{vid}", params={"fields": "status", "access_token": tok}, timeout=30)).get("status") or {})
        phases = [s.get("video_status")] + [(s.get(k) or {}).get("status") for k in ("uploading_phase", "processing_phase", "publishing_phase")]
        if "error" in phases: raise RuntimeError(f"公開処理でエラー video_id={vid}: {s}"[:400])
        if (s.get("publishing_phase") or {}).get("status") == "complete": break
        sleep(interval)
    return str(vid)


def post(p, d, video_path, env=None, http=requests, sleep=time.sleep, log=print, access=None):
    """1回だけやり直す（finish 前の失敗のみ）。権限がなければ FbSkip"""
    acc = access or diagnose(env, http)
    if not acc["ok"]: raise FbSkip("; ".join(acc["reasons"]))
    desc = caption(p, d)
    for attempt in (1, 2):
        try:
            return publish_reel(acc["page_id"], acc["token"], video_path, desc, http=http, sleep=sleep)
        except FbBeforeFinish as e:
            if attempt == 2: raise
            log("Facebook やり直し:", scrub(e, env)); sleep(30)


def dry_run_plan(p, d, video_path, env=None):
    """API を呼ばずに、送る内容を表示用に返す（トークンは伏せる）"""
    env = os.environ if env is None else env
    pid = env.get("FB_PAGE_ID") or "<FB_PAGE_ID（本番は debug_token・/me で確認）>"
    return [
        f"POST {G}/{pid}/video_reels  upload_phase=start access_token=***",
        f"POST {RUPLOAD}/<video_id>  Authorization: OAuth *** / offset: 0 / file_size: <{pathlib.Path(video_path).name} のバイト数>",
        f"POST {G}/{pid}/video_reels  upload_phase=finish video_state=PUBLISHED video_id=<video_id>",
        "description:\n" + caption(p, d),
    ]


# ---------- 数値（metrics.py から） ----------
def _num(v):
    if isinstance(v, (int, float)): return v
    if isinstance(v, dict): return sum(x for x in v.values() if isinstance(x, (int, float)))
    return ""


def reel_stats(vid, tok, http=requests):
    """リールの再生・リアクション・コメント・シェア。取れない項目は空欄"""
    metrics = ("blue_reels_play_count", "post_video_likes_by_reaction_type", "post_video_social_actions")
    out = {}
    data = _json(http.get(f"{G}/{vid}/video_insights", params={"metric": ",".join(metrics), "access_token": tok}, timeout=30)).get("data")
    if data is None:  # まとめて取れなければ1つずつ
        data = []
        for m in metrics:
            data += _json(http.get(f"{G}/{vid}/video_insights", params={"metric": m, "access_token": tok}, timeout=30)).get("data") or []
    for it in data:
        vals = it.get("values") or [{}]
        v = vals[0].get("value", "")
        if it.get("name") == "blue_reels_play_count": out["plays"] = _num(v)
        elif it.get("name") == "post_video_likes_by_reaction_type": out["reactions"] = _num(v)
        elif it.get("name") == "post_video_social_actions" and isinstance(v, dict):
            out["comments"] = v.get("comment", ""); out["shares"] = v.get("share", "")
    return out
