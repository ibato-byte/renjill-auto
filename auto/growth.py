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


# 動画の最後の一言（依頼 #51）。出す長さ・大きさ・位置の決まり。検査（brushup）も同じ値を使う
FOLLOW_SHOW = 1.8        # 表示する秒数（1.5〜2.5。依頼 #97 で2.3→1.8に短縮）
FOLLOW_FADE_IN = 0.2     # 出てくる動き（フェード）
FOLLOW_CUT = 0.15        # 最後のこの秒数だけ消す（最後→最初のループの継ぎ目に文字を残さない）
FOLLOW_EXTEND = 0.8      # 最後の絵をのばす秒数。オチに重ねず、余韻の部分に文字を載せるため（依頼 #97 で1.2→0.8に短縮）
FOLLOW_MAX_TOTAL = 29.9  # 本編は30秒未満
FOLLOW_FONT_RATIO = 0.062  # 文字の大きさ＝画面の高さの6.2%（6%以上）
FOLLOW_BOTTOM_RATIO = 0.78  # 文字の下端。下から20%より上（Instagram・TikTok の下のボタンや説明文に隠れない）
FOLLOW_LINES = ("Follow for more!", "フォローして", "続きを見てね")
FOLLOW_BG, FOLLOW_FG = "0x1F3A5F", "0xFFF7E8"  # 紺の帯＋クリーム色の文字（コントラスト約11:1）


# 冒頭のつかみ（依頼 #97）。最初のコマから大きな英語の一言を出し、全体を少し速くして、最後の余韻を短くする
TIGHTEN_SPEED = 1.2      # 本編を速くする倍率（音の高さは変えない）。22秒の回が約18秒になる
HOOK_SHOW = 1.6          # 冒頭の文字を出す秒数（最初のコマから出ている）
HOOK_FADE_OUT = 0.3
HOOK_EN_RATIO = 0.075    # 英語の大きさ＝画面の高さの7.5%（長い言葉は幅に合わせて小さくなる）。検査の下限は5%
HOOK_JA_RATIO = 0.036
HOOK_Y_RATIO = 0.20      # 英語の上端。Instagram の上の隠れる範囲（上から約13%）より下
HOOK_MIN_RATIO = 0.05    # 検査：英語がこれ未満なら不合格（読めない）
OPENING_MIN_MOTION = 2.0  # 検査：最初の0.5秒で絵がこれ以上動く（0〜255 の差の平均）
LENGTH_FAIL, LENGTH_WARN = 24.0, 12.0  # 検査：本編の長さ（秒）。目標は7〜12秒、24秒を超えたら不合格


def hook_parts(p):
    """スケジュールの thumb.hook（'EN/日本語'）から冒頭の文字を取る。なければ題名"""
    raw = ((p.get("thumb") or {}).get("hook") or p.get("title") or "").strip()
    en, _, ja = raw.partition("/")
    return en.strip(), ja.strip()


def hook_layout(en, ja, h=1920, w=1080):
    """冒頭の文字の置き方。英語は幅の90%に収まる大きさまで小さくする"""
    fs = int(min(h * HOOK_EN_RATIO, 0.9 * w / max(1, len(en)) / 0.62))
    pad = int(round(fs * 0.16))
    ja_fs = int(h * HOOK_JA_RATIO)
    y_en = int(h * HOOK_Y_RATIO)
    y_ja = y_en + fs + 2 * pad + int(fs * 0.12)
    return {"en_size": fs, "en_ratio": round(fs / h, 4), "pad": pad, "ja_size": ja_fs, "y_en": y_en, "y_ja": y_ja, "show": HOOK_SHOW}


def hook_filter(en, ja, fontfile, textdir, h=1920, w=1080):
    """冒頭の文字のフィルタ。最初のコマから出て、約1.6秒で消える"""
    H = hook_layout(en, ja, h, w)
    alpha = f"if(lt(t,{HOOK_SHOW - HOOK_FADE_OUT}),1,if(lt(t,{HOOK_SHOW}),({HOOK_SHOW}-t)/{HOOK_FADE_OUT},0))"
    parts = []
    for name, size, y in (("h0", H["en_size"], H["y_en"]), ("h1", H["ja_size"], H["y_ja"])):
        if name == "h1" and not ja: continue
        parts.append(f"drawtext=fontfile={fontfile}:textfile={textdir / (name + '.txt')}:fontsize={size}:fontcolor={FOLLOW_FG}"
                     f":box=1:boxcolor={FOLLOW_BG}@0.92:boxborderw={H['pad'] if name == 'h0' else int(size * 0.2)}:x=(w-text_w)/2:y={y}:alpha='{alpha}'")
    return ",".join(parts)


def tighten(src, out_path, speed=TIGHTEN_SPEED):
    """本編を speed 倍に速くする（音の高さは変えない）。できなければ None"""
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", str(src)]
    if _has_audio(src):
        cmd += ["-filter_complex", f"[0:v]setpts=PTS/{speed}[v];[0:a]atempo={speed}[a]", "-map", "[v]", "-map", "[a]", "-c:a", "aac", "-b:a", "160k"]
    else:
        cmd += ["-vf", f"setpts=PTS/{speed}"]
    cmd += ["-r", "24", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out_path)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    return pathlib.Path(out_path) if r.returncode == 0 and pathlib.Path(out_path).exists() else None


def opening_motion(path, secs=0.5):
    """最初の secs 秒に絵がどれだけ動くか（先頭と secs 秒後の白黒の差の平均、0〜255）。検査用"""
    import numpy as np
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(path), "-t", str(secs + 0.1), "-vf", "fps=24,scale=108:192,format=gray", "-f", "rawvideo", "-"])
    fr = np.frombuffer(raw, dtype=np.uint8).reshape(-1, 192, 108).astype(float)
    k = min(len(fr) - 1, int(round(secs * 24)))
    return float(np.abs(fr[k] - fr[0]).mean()) if k > 0 else 0.0


def follow_layout(total, h, extend=FOLLOW_EXTEND):
    """最後の一言の置き方（秒・大きさ・位置）。total は文字を載せる前の動画の長さ、h は画面の高さ。検査と共用"""
    ext = max(0.0, min(extend, FOLLOW_MAX_TOTAL - total))
    new_total = total + ext
    fs = int(round(h * FOLLOW_FONT_RATIO))
    pad = int(round(fs * 0.16))
    pitch = fs + 2 * pad + int(round(fs * 0.08))
    n = len(FOLLOW_LINES)
    bottom = h * FOLLOW_BOTTOM_RATIO
    y0 = int(bottom - (n - 1) * pitch - fs - pad)
    return {"extend": round(ext, 3), "total": round(new_total, 3), "start": round(new_total - FOLLOW_SHOW, 3),
            "end": round(new_total - FOLLOW_CUT, 3), "fontsize": fs, "pad": pad, "pitch": pitch, "y0": y0,
            "text_bottom": y0 + (n - 1) * pitch + fs + pad, "show": FOLLOW_SHOW}


def follow_filter(total, fontfile, textdir, h=1920, extend=FOLLOW_EXTEND, hook=None, w=1080):
    """最後の一言のフィルタ。最後の絵をのばし、その終わりの約2.3秒に紺の帯＋クリーム色の文字を出す。
    0.2秒でフェードして出て、最後の0.15秒は完全に消える（ループの継ぎ目に残らない）"""
    L = follow_layout(total, h, extend)
    t0, t1 = L["start"], L["end"]
    alpha = f"if(lt(t,{t0}),0,if(lt(t,{t0 + FOLLOW_FADE_IN}),(t-{t0})/{FOLLOW_FADE_IN},if(lt(t,{t1}),1,0)))"
    parts = [f"tpad=stop_mode=clone:stop_duration={L['extend']}"] if L["extend"] > 0 else []
    for i, _ in enumerate(FOLLOW_LINES):
        parts.append(f"drawtext=fontfile={fontfile}:textfile={textdir / f'l{i}.txt'}:fontsize={L['fontsize']}:fontcolor={FOLLOW_FG}"
                     f":box=1:boxcolor={FOLLOW_BG}:boxborderw={L['pad']}:x=(w-text_w)/2:y={L['y0'] + i * L['pitch']}:alpha='{alpha}'")
    if hook and hook[0]: parts.append(hook_filter(hook[0], hook[1], fontfile, textdir, h, w))
    return ",".join(parts)


def _video_height(path):
    try:
        return int(subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=height", "-of", "csv=p=0", str(path)]).decode().strip())
    except Exception:
        return 1920


def _has_audio(path):
    return bool(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=index", "-of", "csv=p=0", str(path)],
                               capture_output=True, text=True).stdout.strip())


def add_follow_line(loop_path, out_path, hook=None, speed=None):
    """ループ版の最後に「フォローして続きを見てね」を入れた動画を作る。できなければ None（元の動画を使う）。
    hook=(英語, 日本語) なら最初のコマから大きな一言を出し、speed なら本編をその倍率で速くする（依頼 #97）"""
    f = font()
    if not f: return None
    if speed and speed != 1:
        fast = tighten(loop_path, pathlib.Path(out_path).with_name(pathlib.Path(out_path).stem + "_fast.mp4"), speed)
        if not fast: return None
        loop_path = fast
    total = duration(loop_path)
    if total < 3: return None
    h = _video_height(loop_path)
    L = follow_layout(total, h)
    tmp = pathlib.Path(tempfile.mkdtemp())
    for i, line in enumerate(FOLLOW_LINES): (tmp / f"l{i}.txt").write_text(line, encoding="utf-8")
    if hook and hook[0]:
        (tmp / "h0.txt").write_text(hook[0], encoding="utf-8"); (tmp / "h1.txt").write_text(hook[1] or "", encoding="utf-8")
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", str(loop_path), "-vf", follow_filter(total, f, tmp, h, hook=hook)]
    if _has_audio(loop_path) and L["extend"] > 0:
        cmd += ["-af", f"apad=pad_dur={L['extend']}", "-t", str(L["total"]), "-c:a", "aac", "-b:a", "160k"]
    else:
        cmd += ["-c:a", "copy"]
    cmd += ["-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out_path)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    return pathlib.Path(out_path) if r.returncode == 0 and pathlib.Path(out_path).exists() else None
