"""無料のフォロワー増加策（依頼 #38）。post.py から呼ぶ。どれも失敗しても本編の投稿は止めない。
- 多言語化：YouTube のタイトル・説明の翻訳（localizations）。Instagram・Threads 等のキャプション末尾の英語の一言
- 動画の最後の「フォローして続きを見てね」（英日、最後の1秒以内、絵の中）。最後の瞬間には消え、ループの継ぎ目を壊さない
"""
import pathlib, subprocess, tempfile

# YouTube に付ける翻訳の言語（YouTube Data API の localizations。無料）。既定の言語は英語
LOCALE_DESC = {
    "ja": "うさぎの課長レン（たれ耳）と、しっかり者の部下ジル。セリフなしのオフィスコメディ。",
    "ko": "덜렁이 렌 과장(홀랜드 롭)과 똑 부러지는 부하 질(네덜란드 드워프). 대사 없는 오피스 코미디예요.",
    "zh-Hant": "迷糊的蓮課長（垂耳兔）和精明的部下吉兒（侏儒兔）。沒有台詞的辦公室喜劇。",
    "es": "Una comedia de oficina sin palabras sobre dos conejos: Ren, el jefe despistado, y Jill, su ayudante lista.",
    "pt": "Uma comédia de escritório sem falas sobre dois coelhos: Ren, o chefe distraído, e Jill, sua assistente esperta.",
}
LOCALE_FOLLOW = {
    "ja": "続きを見るにはチャンネル登録を！",
    "ko": "다음 이야기가 궁금하면 구독해 주세요!",
    "zh-Hant": "想看後續，歡迎訂閱頻道！",
    "es": "¡Suscríbete para ver más!",
    "pt": "Inscreva-se para ver mais!",
}
DEFAULT_TAIL_EN = "Follow for more Ren & Jill 🐰"


def tail_en(d):
    return d.get("caption_tail_en", DEFAULT_TAIL_EN)


def youtube_localizations(p, d, en_title, en_desc):
    """YouTube の snippet.localizations。タイトルは回ごとの翻訳（p["title_i18n"]）があればそれ、なければ英語のまま（ブランド名つき）。
    説明は固定の翻訳＋英語の説明。{言語: {title, description}}"""
    i18n = p.get("title_i18n") or {}
    out = {}
    for lang, desc in LOCALE_DESC.items():
        title = (i18n.get(lang) or en_title)[:100]
        out[lang] = {"title": title, "description": f"{desc}\n{LOCALE_FOLLOW[lang]}\n\n{en_desc}"[:5000]}
    return out


def font():
    try:
        fam, path = subprocess.check_output(["fc-match", "-f", "%{family}|%{file}", "Noto Sans CJK JP:bold"]).decode().split("|", 1)
        if "CJK" in fam and pathlib.Path(path).exists(): return path
    except Exception:
        pass
    return None


def duration(path):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)]).decode().strip())


def follow_filter(total, fontfile, textdir, show=0.9):
    """最後の show 秒だけ、下側に小さく文字を出す。出入りは0.2秒でなめらかに、最後の0.1秒は完全に消えてループの継ぎ目に残らない"""
    t0, t1 = total - show, total - 0.1
    alpha = f"if(lt(t,{t0}),0,if(lt(t,{t0 + 0.2}),(t-{t0})/0.2,if(lt(t,{t1 - 0.2}),1,max(0,({t1}-t)/0.2))))"
    parts = []
    for i, (name, size, y) in enumerate((("en.txt", 56, "h*0.70"), ("ja.txt", 46, "h*0.70+80"))):
        parts.append(f"drawtext=fontfile={fontfile}:textfile={textdir / name}:fontsize={size}:fontcolor=white:borderw=4:bordercolor=black@0.55:x=(w-text_w)/2:y={y}:alpha='{alpha}'")
    return ",".join(parts)


def add_follow_line(loop_path, out_path):
    """ループ版の最後に「フォローして続きを見てね」を入れた動画を作る。音声はそのまま。できなければ None（元の動画を使う）"""
    f = font()
    if not f: return None
    total = duration(loop_path)
    if total < 3: return None
    tmp = pathlib.Path(tempfile.mkdtemp())
    (tmp / "en.txt").write_text("Follow for more!", encoding="utf-8")
    (tmp / "ja.txt").write_text("フォローして続きを見てね", encoding="utf-8")
    r = subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(loop_path), "-vf", follow_filter(total, f, tmp),
                        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", str(out_path)],
                       capture_output=True, text=True)
    return pathlib.Path(out_path) if r.returncode == 0 and pathlib.Path(out_path).exists() else None
