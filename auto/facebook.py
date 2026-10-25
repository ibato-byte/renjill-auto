#!/usr/bin/env python3
"""Facebook ページ「レンとジル Ren & Jill」（ID 1358515160686321）へのリール投稿（Meta 公式の Reels Publishing API）。

流れ（https://developers.facebook.com/docs/video-api/guides/reels-publishing）:
  0. GET  graph.facebook.com/{page-id}?fields=access_token,instagram_business_account
       … システムユーザーのトークン（Secrets の IG_ACCESS_TOKEN）から、ページトークンと Instagram の ID を取る
  1. POST graph.facebook.com/{page-id}/video_reels  upload_phase=start            → video_id, upload_url
  2. POST rupload.facebook.com/video-upload/<ver>/{video_id}
       ヘッダ Authorization: OAuth <ページトークン>, offset: 0, file_size: <バイト数>, 本文 = 動画ファイル
  3. POST graph.facebook.com/{video_id}/thumbnails  source=<サムネ画像>, is_preferred=true（サムネ。だめなら公開後にもう一度）
  4. POST graph.facebook.com/{page-id}/video_reels  upload_phase=finish, video_state=PUBLISHED, description
  5. GET  graph.facebook.com/{video_id}?fields=status で公開まで確認（読み取りのみ）

必要なもの: ビジネスポートフォリオ renjill_office のシステムユーザー renjill-auto の期限なしトークン（Secrets の IG_ACCESS_TOKEN）。
  ページ・Instagram・アプリが割り当て済みで、権限は ALL_SCOPES（Facebook の投稿に要るのは REQUIRED_SCOPES）。
  ページトークン（期限なし）を直接入れた場合も使える。
権限・設定がなければ FbSkip を投げ、呼び出し側は Facebook だけ飛ばして他SNSの投稿を続ける。
トークンの値は表示しない（エラー文からも消す）。
"""
import growth
import os, pathlib, re, time
import requests

GRAPH_VER = "v21.0"  # 既存の Instagram 投稿と同じ版
G = f"https://graph.facebook.com/{GRAPH_VER}"
RUPLOAD = f"https://rupload.facebook.com/video-upload/{GRAPH_VER}"
PAGE_ID = "1358515160686321"  # Facebook ページ「レンとジル Ren & Jill」（2026-10-21 オーナー確認。1386940331166810 は重複で削除済み）
REQUIRED_SCOPES = ("pages_show_list", "pages_read_engagement", "pages_manage_posts")  # Facebook のリール投稿
ALL_SCOPES = REQUIRED_SCOPES + ("business_management", "instagram_basic", "instagram_content_publish", "instagram_manage_insights")
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
    return normalize_brand(body + (f"\n\n{tags}" if tags else "") + "\n\n" + growth.tail_en(d))  # 末尾に英語の一言（依頼 #38）


# ---------- トークン・権限の確認（読み取りのみ） ----------
def inspect_token(tok, http=requests):
    r = http.get(f"{G}/debug_token", params={"input_token": tok, "access_token": tok}, timeout=30)
    return (_json(r).get("data") or {})


def diagnose(env=None, http=requests):
    env = os.environ if env is None else env
    out = _diagnose(env, http)
    out["reasons"] = [scrub(r, env) for r in out["reasons"]]  # エラー文にトークンが混ざっても出さない
    return out


def _diagnose(env, http):
    """IG_ACCESS_TOKEN（システムユーザー）で、ページ PAGE_ID のページトークンと Instagram の ID を取る（読み取りのみ）。値は表示しない。
    戻り値: {ok, secret, token_type, page_id, page_name, ig_user_id, expires_at, data_access_expires_at, scopes, reasons[], token(ページトークン。内部用)}
    ok は「Facebook に投稿できる」。Instagram の ID が取れたかは ig_user_id で見る"""
    name, tok = "IG_ACCESS_TOKEN", env.get("IG_ACCESS_TOKEN", "")
    out = {"ok": False, "secret": name, "token_type": None, "page_id": PAGE_ID, "page_name": "", "ig_user_id": None,
           "expires_at": None, "data_access_expires_at": None, "scopes": [], "reasons": [], "token": None}
    if not tok:
        out["reasons"].append(f"{name} が未設定"); return out
    try:
        d = inspect_token(tok, http)
    except Exception as e:
        out["reasons"].append(f"{name}: 確認できず（{type(e).__name__}）"); return out
    if not d.get("is_valid"):
        out["reasons"].append(f"{name}: 無効なトークン"); return out
    out.update(token_type=d.get("type"), scopes=d.get("scopes") or [],
               expires_at=d.get("expires_at", 0) or 0, data_access_expires_at=d.get("data_access_expires_at", 0) or 0)
    missing = [s for s in REQUIRED_SCOPES if s not in out["scopes"]]
    if missing:
        out["reasons"].append(f"{name}: 権限が足りない（{', '.join(missing)}）")
    try:
        if d.get("type") == "PAGE":  # ページトークンを直接入れた場合
            pg = _json(http.get(f"{G}/me", params={"fields": "id,name,instagram_business_account", "access_token": tok}, timeout=30))
            pg["access_token"] = tok
        else:
            pg = _json(http.get(f"{G}/{PAGE_ID}", params={"fields": "id,name,access_token,instagram_business_account", "access_token": tok}, timeout=30))
    except Exception as e:
        out["reasons"].append(f"{name}: ページを確認できず（{type(e).__name__}）"); return out
    if str(pg.get("id") or "") != PAGE_ID:
        out["reasons"].append(f"{name}: ページ {PAGE_ID} を取れない（{_err(pg) if pg.get('error') else '別のページのトークン'}）"); return out
    out["page_name"] = pg.get("name", "")
    out["ig_user_id"] = str((pg.get("instagram_business_account") or {}).get("id") or "") or None
    if not pg.get("access_token"):
        out["reasons"].append(f"{name}: ページトークンが取れない（システムユーザーにページのフルアクセスが必要）"); return out
    if missing: return out
    out.update(ok=True, token=pg["access_token"])
    return out


# ---------- 投稿 ----------
def set_thumbnail(vid, tok, thumb_path, http=requests):
    """サムネを設定する（POST /{video_id}/thumbnails、is_preferred=true）。成否を返す（失敗しても投稿は止めない）"""
    try:
        with pathlib.Path(thumb_path).open("rb") as f:
            j = _json(http.post(f"{G}/{vid}/thumbnails", data={"is_preferred": "true", "access_token": tok},
                                files={"source": (pathlib.Path(thumb_path).name, f, "image/jpeg")}, timeout=120))
        return bool(j.get("success") or j.get("id"))
    except Exception:
        return False


def thumbnail_attached(vid, tok, http=requests):
    """Graph API で、リールにカバー（is_preferred のサムネ）が付いているか調べる。True／False／None（調べられない）"""
    try:
        j = _json(http.get(f"{G}/{vid}/thumbnails", params={"fields": "uri,is_preferred", "access_token": tok}, timeout=30))
    except Exception:
        return None
    if not isinstance(j.get("data"), list): return None
    return any(t.get("is_preferred") for t in j["data"])


def ensure_thumbnail(vid, tok, thumb_path, http=requests, sleep=time.sleep, tries=3, interval=20):
    """投稿直後にカバーが付いたかを確かめ、付いていなければ付け直す（人の目視の代わり）。"OK"／"NG" を返す。
    調べられない（None）ときは、付け直しの成功を「OK」とみなす"""
    for i in range(tries):
        if thumbnail_attached(vid, tok, http): return "OK"
        if set_thumbnail(vid, tok, thumb_path, http):
            sleep(interval)
            if thumbnail_attached(vid, tok, http) is not False: return "OK"
        sleep(interval)
    return "OK" if thumbnail_attached(vid, tok, http) else "NG"


def publish_reel(page_id, tok, video_path, description, http=requests, sleep=time.sleep, polls=20, interval=15, thumb_path=None, info=None):
    """info（dict）を渡すと info["thumb"] にサムネの結果（"OK"／"NG"／"なし"）を入れる"""
    info = {} if info is None else info
    info["thumb"] = "なし"
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
    if thumb_path: info["thumb"] = "OK" if set_thumbnail(vid, tok, thumb_path, http) else "NG"
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
    if info["thumb"] == "NG":  # アップロード直後に付けられなかったら、公開後にもう一度
        info["thumb"] = "OK" if set_thumbnail(vid, tok, thumb_path, http) else "NG"
    return str(vid)


def post(p, d, video_path, env=None, http=requests, sleep=time.sleep, log=print, access=None, thumb_path=None, info=None):
    """1回だけやり直す（finish 前の失敗のみ）。権限がなければ FbSkip。サムネの結果は info["thumb"]"""
    acc = access or diagnose(env, http)
    if not acc["ok"]: raise FbSkip("; ".join(acc["reasons"]))
    desc = caption(p, d)
    for attempt in (1, 2):
        try:
            return publish_reel(acc["page_id"], acc["token"], video_path, desc, http=http, sleep=sleep, thumb_path=thumb_path, info=info)
        except FbBeforeFinish as e:
            if attempt == 2: raise
            log("Facebook やり直し:", scrub(e, env)); sleep(30)


def dry_run_plan(p, d, video_path, env=None):
    """API を呼ばずに、送る内容を表示用に返す（トークンは伏せる）"""
    pid = PAGE_ID
    return [
        f"GET  {G}/{pid}?fields=id,name,access_token,instagram_business_account  access_token=***（IG_ACCESS_TOKEN）",
        f"POST {G}/{pid}/video_reels  upload_phase=start access_token=***（ページトークン）",
        f"POST {RUPLOAD}/<video_id>  Authorization: OAuth *** / offset: 0 / file_size: <{pathlib.Path(video_path).name} のバイト数>",
        f"POST {G}/<video_id>/thumbnails  source=<{pathlib.Path(video_path).name.split('_loop')[0]}_thumb.jpg> is_preferred=true",
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
