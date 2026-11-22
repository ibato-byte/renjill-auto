"""公開済みの投稿の「文字」を新しい名前にする（2026-11-22 改名。オーナーの決定：動画はそのまま、文字だけ更新）。
- YouTube：ショート（posted.json の yt）と作業用BGM（bgm_state.json の yt）の題・説明・翻訳（localizations）
- Facebook：リール（posted.json の facebook）の説明
Instagram・TikTok・Threads・X は API で直せない（Instagram は手で直す。docs/REBRAND-2026-11-22.md）。
動画・再生数・いいねは変えない。何度動かしても同じ結果（直す物が無ければ何もしない）。
使い方: python auto/rebrand_posts.py [--dry-run]
"""
import json, os, pathlib, sys

import requests

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import rebrand  # noqa: E402

AUTO = pathlib.Path(__file__).parent
G = "https://graph.facebook.com/v21.0"


def ids():
    """直す動画の ID（YouTube・Facebook）。重複は1つに"""
    posted = json.loads((AUTO / "posted.json").read_text(encoding="utf-8"))
    yt, fb = [], []
    for k, r in posted.items():
        if not isinstance(r, dict): continue
        if r.get("yt") and r["yt"] not in yt and r["yt"] != "manual": yt.append(r["yt"])
        f = str(r.get("facebook") or "")
        if f.isdigit() and f not in fb: fb.append(f)
    bgm = json.loads((AUTO / "bgm_state.json").read_text(encoding="utf-8"))
    for r in (bgm.get("episodes") or {}).values():
        if r.get("yt") and r["yt"] not in yt: yt.append(r["yt"])
    return yt, fb


def yt_body(it):
    """YouTube の videos.update に送る中身。変わらなければ None"""
    sn = it["snippet"]
    title, desc = rebrand.rebrand(sn["title"])[:100], rebrand.rebrand(sn.get("description", ""))[:5000]
    loc = {lang: {"title": rebrand.rebrand(v.get("title", ""))[:100], "description": rebrand.rebrand(v.get("description", ""))[:5000]}
           for lang, v in (it.get("localizations") or {}).items()}
    tags = [rebrand.rebrand(t) for t in sn.get("tags") or []]
    same = title == sn["title"] and desc == sn.get("description", "") and tags == (sn.get("tags") or []) and loc == {
        lang: {"title": v.get("title", ""), "description": v.get("description", "")} for lang, v in (it.get("localizations") or {}).items()}
    if same: return None, None
    body = {"id": it["id"], "snippet": {"title": title, "description": desc, "categoryId": sn.get("categoryId", "22")}}
    if tags: body["snippet"]["tags"] = tags
    if sn.get("defaultLanguage"): body["snippet"]["defaultLanguage"] = sn["defaultLanguage"]
    part = "snippet"
    if loc: body["localizations"] = loc; part = "snippet,localizations"
    return body, part


def fix_youtube(video_ids, dry=False, yt=None, log=print):
    if not video_ids: return 0
    if yt is None:
        import comments
        yt = comments.yt_client()
    bad = 0
    for i in range(0, len(video_ids), 50):
        items = yt.videos().list(part="snippet,localizations", id=",".join(video_ids[i:i + 50])).execute().get("items") or []
        for it in items:
            body, part = yt_body(it)
            if not body: log("yt", it["id"], "直す所なし"); continue
            log("yt", it["id"], it["snippet"]["title"], "→", body["snippet"]["title"])
            if dry: continue
            try: yt.videos().update(part=part, body=body).execute()
            except Exception as e: bad += 1; log("yt", it["id"], "直せず", type(e).__name__, str(e)[:200])
    return bad


def fix_facebook(video_ids, dry=False, env=None, http=requests, log=print):
    if not video_ids: return 0
    import facebook
    d = facebook._diagnose(env or os.environ, http)
    if not d.get("ok"): log("facebook: トークンが使えない", d.get("reasons")); return 1
    tok, bad = d["token"], 0
    for vid in video_ids:
        r = http.get(f"{G}/{vid}", params={"fields": "description,title", "access_token": tok}, timeout=30).json()
        if r.get("error"): bad += 1; log("facebook", vid, "読めず", facebook.scrub(str(r["error"])[:200])); continue
        new = {k: rebrand.rebrand(r.get(k) or "") for k in ("description", "title") if r.get(k)}
        new = {k: v for k, v in new.items() if v != r.get(k)}
        if not new: log("facebook", vid, "直す所なし"); continue
        log("facebook", vid, "直す：", ", ".join(new))
        if dry: continue
        w = http.post(f"{G}/{vid}", data=dict(new, access_token=tok), timeout=30).json()
        if w.get("error"): bad += 1; log("facebook", vid, "直せず", facebook.scrub(str(w["error"])[:200]))
    return bad


def main(argv=None):
    dry = "--dry-run" in (argv or sys.argv[1:])
    yt_ids, fb_ids = ids()
    print(f"YouTube {len(yt_ids)} 本・Facebook {len(fb_ids)} 本を確かめる" + ("（dry-run：直さない）" if dry else ""))
    bad = fix_youtube(yt_ids, dry) + fix_facebook(fb_ids, dry)
    print("おわり" if not bad else f"直せなかった物 {bad} 件")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
