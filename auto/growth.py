"""フォロワー増加策（依頼 #37・#38）。post.py から呼ぶ。どれも無料の範囲で、失敗しても本編は止めない。
- seo_caption：キャプションを「検索される言葉」中心に（日英のキーワード、ハッシュタグは少なめ、末尾に英語の一言）
- yt_localizations：YouTube のタイトル・説明を英語・韓国語・中国語（繁体）・スペイン語・ポルトガル語にも付ける
- post_threads：Threads にも同じ動画を出す（threads_content_publish。権限・Secrets がなければ見送り）
- follow_overlay：動画の最後 0.9 秒に「フォローして続きを見てね」（英日）を絵の中に入れる（ループは壊さない）
- export_episodes：公式サイト用の全エピソード一覧（episodes.json）を作る
"""
import json, os, pathlib, subprocess, time
import requests

ROOT = pathlib.Path(__file__).resolve().parent.parent
THREADS_G = "https://graph.threads.net/v1.0"
LANGS = ("en", "ko", "zh-Hant", "es", "pt")
MAX_TAGS = 3


class GrowthSkip(Exception):
    """今回は出さないだけ（失敗ではない）"""


# ---------- キャプション ----------
DEFAULT_SEO = {
    "ja": "職場あるある｜うさぎ｜セリフなしアニメ",
    "en": "wordless office comedy · bunny boss · workplace humor",
    "follow_en": "Follow Ren & Jill for the next episode 🐰",
}


def _seo(d):
    return {**DEFAULT_SEO, **(d.get("seo") or {})}


def seo_caption(p, d, with_tags=True):
    """1行目 英語のひとこと／日本語のひとこと／検索される言葉（日・英）／末尾に英語のフォローの一言／ハッシュタグ（少なめ）"""
    s = _seo(d)
    lines = [p["caption_en"], p["caption_ja"], "", f'{s["ja"]}', f'{s["en"]}', "", s["follow_en"]]
    out = "\n".join(lines)
    if with_tags:
        tags = d["tag_sets"][p.get("tag_set", "A")].split()[:MAX_TAGS]
        out += "\n\n" + " ".join(tags)
    return out


# ---------- YouTube の多言語 ----------
DEFAULT_I18N = {
    "en": "A wordless office comedy about two bunnies: Ren, the absent-minded boss, and Jill, his sharp assistant. New episodes Mon / Wed / Fri / Sun.",
    "ko": "말이 없는 오피스 코미디. 덜렁이 토끼 과장 렌과 똑 부러지는 부하 질. 월·수·금·일 새 에피소드 공개.",
    "zh-Hant": "沒有台詞的辦公室喜劇。迷糊的兔子課長蓮，與精明的部下吉兒。每週一、三、五、日更新。",
    "es": "Una comedia de oficina sin palabras sobre dos conejos: Ren, el jefe despistado, y Jill, su ayudante lista. Nuevos episodios lun/mié/vie/dom.",
    "pt": "Uma comédia de escritório sem falas sobre dois coelhos: Ren, o chefe distraído, e Jill, sua assistente esperta. Novos episódios seg/qua/sex/dom.",
}
TITLE_TAIL = {"en": "Ren & Jill", "ko": "렌과 질", "zh-Hant": "蓮與吉兒", "es": "Ren y Jill", "pt": "Ren e Jill"}


def yt_localizations(p, d):
    """YouTube Data API の localizations。回ごとに p["titles"] = {"ko": "…"} があればそれを使い、なければ英語のひとこと＋シリーズ名。
    タイトルは 100 文字まで"""
    i18n = {**DEFAULT_I18N, **(d.get("yt_i18n") or {})}
    titles = p.get("titles") or {}
    out = {}
    for lang in LANGS:
        head = titles.get(lang) or p["caption_en"]
        title = f"{head} | {TITLE_TAIL[lang]}"
        out[lang] = {"title": title[:100], "description": i18n[lang]}
    return out


def yt_body(p, d, tags_text):
    """YouTube に出す body（日本語が元の言語。タイトルは従来どおり）"""
    return {"snippet": {"title": f'{p["caption_en"]} | Ren & Jill「{p["title"]}」',
                        "description": f'{d["yt_description"]}\n\n{tags_text}', "categoryId": "23", "defaultLanguage": "ja"},
            "status": {"privacyStatus": "public", "selfDeclaredMadeForKids": False},
            "localizations": {"ja": {"title": f'{p["caption_en"]} | Ren & Jill「{p["title"]}」', "description": d["yt_description"]}, **yt_localizations(p, d)}}


# ---------- Threads ----------
def threads_ready():
    return bool(os.environ.get("THREADS_ACCESS_TOKEN") and os.environ.get("THREADS_USER_ID"))


def post_threads(p, d, video_url, http=requests, sleep=time.sleep):
    """Threads に動画（MP4・9:16）を出す。作る→処理待ち→公開の3段階。24時間の投稿上限（250件）の手前で止める。
    video_url：Instagram と同じ公開 URL（renjill-media）"""
    if not threads_ready():
        raise GrowthSkip("Threads の権限・Secrets（THREADS_ACCESS_TOKEN・THREADS_USER_ID）が未設定で見送り")
    tok, uid = os.environ["THREADS_ACCESS_TOKEN"], os.environ["THREADS_USER_ID"]
    lim = http.get(f"{THREADS_G}/{uid}/threads_publishing_limit", params={"fields": "quota_usage,config", "access_token": tok}).json()
    try:
        used, total = lim["data"][0]["quota_usage"], lim["data"][0]["config"]["quota_total"]
        if total - used < 5: raise GrowthSkip("Threads の24時間の投稿上限に近いので見送り")
    except (KeyError, IndexError, TypeError):
        if "error" in lim: raise GrowthSkip(f'Threads の権限を確認できず見送り（{str(lim["error"].get("message", ""))[:80]}）')
    text = seo_caption(p, d, with_tags=False)[:480]  # Threads は 500 文字まで
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


# ---------- 動画の最後の一言 ----------
FOLLOW_TEXT = "Follow for more  フォローして続きを見てね"


def follow_filter(font, dur, text=FOLLOW_TEXT):
    """最後の 0.9 秒だけ、画面の下に小さく出す ffmpeg のフィルター（フェードインなし・絵は動かさない）。"""
    start = max(dur - 0.9, 0)
    safe = text.replace(":", r"\:").replace("'", "")
    return (f"drawtext=fontfile='{font}':text='{safe}':fontsize=44:fontcolor=#3B2E22:box=1:boxcolor=#F4ECE0@0.92:boxborderw=22"
            f":x=(w-text_w)/2:y=h*0.72:enable='between(t,{start:.2f},{dur:.2f})'")


def follow_overlay(src, dst, font, dur=None, run=subprocess.run):
    """src の最後 0.9 秒に「フォローして続きを見てね」を入れた動画を dst に作る。音声はそのまま。
    入れられなければ GrowthSkip（元の動画をそのまま使う）"""
    if not font: raise GrowthSkip("日本語フォントがなく、最後の一言を入れずに出す")
    if dur is None:
        try: dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(src)], stderr=subprocess.DEVNULL).decode().strip())
        except (subprocess.CalledProcessError, FileNotFoundError, ValueError): raise GrowthSkip("動画の長さを読めず、最後の一言を入れずに出す")
    r = run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-vf", follow_filter(font, dur), "-c:v", "libx264", "-preset", "veryfast",
             "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", str(dst)], capture_output=True, text=True)
    if r.returncode != 0 or not pathlib.Path(dst).exists():
        raise GrowthSkip(f"最後の一言を入れられず元の動画で出す（{(r.stderr or '')[-80:]}）")
    return pathlib.Path(dst)


# ---------- 公式サイト用の一覧 ----------
CHANNELS = {
    "instagram": "https://www.instagram.com/renjill_office/",
    "tiktok": "https://www.tiktok.com/@renjill_office",
    "facebook": "https://www.facebook.com/profile.php?id=1358515160686321",
}


def export_episodes(sch, posted, now_iso):
    """公式サイト（coana-website の /renjill）が読む一覧。投稿済み（YouTube か Instagram のどれかに出た回）だけを新しい順に。"""
    eps = []
    for p in sch["posts"]:
        rec = posted.get(f'{p["date"]}_{p["ep"]}') or {}
        if not any(rec.get(x) and rec[x] not in ("manual", "bs-scheduled") for x in ("yt", "ig", "facebook", "tt")): continue
        yt = rec.get("yt")
        eps.append({"no": p["no"], "ep": p["ep"], "title": p["title"], "caption_ja": p["caption_ja"], "caption_en": p["caption_en"],
                    "date": p["date"], "series": p.get("series"), "youtube_id": yt if yt and yt not in ("manual", "bs-scheduled") else None})
    eps.sort(key=lambda e: (e["date"], e["no"]), reverse=True)
    series = sorted({e["series"] for e in eps if e["series"]})
    return {"updated": now_iso, "channels": CHANNELS, "series": [{"id": s, "title": s} for s in series], "episodes": eps}
