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
FOLLOW_SHOW = 2.3        # 表示する秒数（2.0〜2.5）
FOLLOW_FADE_IN = 0.2     # 出てくる動き（フェード）
FOLLOW_CUT = 0.15        # 最後のこの秒数だけ消す（最後→最初のループの継ぎ目に文字を残さない）
FOLLOW_EXTEND = 1.2      # 最後の絵をのばす秒数（1〜1.5）。オチに重ねず、余韻の部分に文字を載せるため
FOLLOW_MAX_TOTAL = 29.9  # 本編は30秒未満
FOLLOW_FONT_RATIO = 0.062  # 文字の大きさ＝画面の高さの6.2%（6%以上）
FOLLOW_BOTTOM_RATIO = 0.78  # 文字の下端。下から20%より上（Instagram・TikTok の下のボタンや説明文に隠れない）
FOLLOW_LINES = ("Follow for more!", "フォローして", "続きを見てね")
FOLLOW_BG, FOLLOW_FG = "0x1F3A5F", "0xFFF7E8"  # 紺の帯＋クリーム色の文字（コントラスト約11:1）


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


def follow_filter(total, fontfile, textdir, h=1920, extend=FOLLOW_EXTEND):
    """最後の一言のフィルタ。最後の絵をのばし、その終わりの約2.3秒に紺の帯＋クリーム色の文字を出す。
    0.2秒でフェードして出て、最後の0.15秒は完全に消える（ループの継ぎ目に残らない）"""
    L = follow_layout(total, h, extend)
    t0, t1 = L["start"], L["end"]
    alpha = f"if(lt(t,{t0}),0,if(lt(t,{t0 + FOLLOW_FADE_IN}),(t-{t0})/{FOLLOW_FADE_IN},if(lt(t,{t1}),1,0)))"
    parts = [f"tpad=stop_mode=clone:stop_duration={L['extend']}"] if L["extend"] > 0 else []
    # 帯は画面の端から端まで（文字の幅だけだと左右の端が暗くならない・依頼 #90）。0.2秒で段階的に濃くして出し、最後に消す
    by, bh = L["y0"] - L["pad"], L["text_bottom"] - L["y0"] + 2 * L["pad"]
    steps = 4
    for k in range(steps):
        a, b = t0 + FOLLOW_FADE_IN * k / steps, (t0 + FOLLOW_FADE_IN * (k + 1) / steps if k < steps - 1 else t1)
        parts.append(f"drawbox=x=0:y={by}:w=iw:h={bh}:color={FOLLOW_BG}@{(k + 1) / steps:.2f}:t=fill:enable='between(t,{a:.3f},{b:.3f})'")
    for i, _ in enumerate(FOLLOW_LINES):
        parts.append(f"drawtext=fontfile={fontfile}:textfile={textdir / f'l{i}.txt'}:fontsize={L['fontsize']}:fontcolor={FOLLOW_FG}"
                     f":box=1:boxcolor={FOLLOW_BG}:boxborderw={L['pad']}:x=(w-text_w)/2:y={L['y0'] + i * L['pitch']}:alpha='{alpha}'")
    return ",".join(parts)


def _video_height(path):
    try:
        return int(subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=height", "-of", "csv=p=0", str(path)]).decode().strip())
    except Exception:
        return 1920


def _video_width(path):
    try:
        return int(subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width", "-of", "csv=p=0", str(path)]).decode().strip())
    except Exception:
        return 1080


def follow_edge_issues(video, L, h, real):
    """最後の一言の帯が、左右の端・四隅まで暗いか（依頼 #90）。帯を出している間のコマで、帯の行の左端・右端と、文字のない帯の色を比べる。
    端が帯の紺より明るければ NG"""
    w = _video_width(video)
    t = min(L["end"] - 0.2, real - 0.3)
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.2f}", "-i", str(video), "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True).stdout
    if len(raw) < w * h: return ["最後の一言のコマを読めず、帯の端を確認できない"]
    px = lambda x, y, n=1: sum(raw[y * w + x + i] for i in range(n)) / n
    y0, y1 = L["y0"] - L["pad"], L["text_bottom"] + L["pad"]
    ref = (px(w // 2 - 4, y0 + 3, 8) + px(w // 2 - 4, y1 - 4, 8)) / 2  # 帯の上下の縁（文字のない所）の色
    issues = []
    for r in (y0 + 3, (y0 + y1) // 2, y1 - 4):
        for name, x in (("左端", 0), ("右端", w - 6)):
            v = px(x, r, 6)
            if v > ref + 18: issues.append(f"帯が{name}まで暗くない（y={r}、明るさ{v:.0f}／帯{ref:.0f}）")
    for name, (x, y) in (("左上", (2, y0 + 2)), ("右上", (w - 3, y0 + 2)), ("左下", (2, y1 - 3)), ("右下", (w - 3, y1 - 3))):
        if px(x, y) > ref + 18: issues.append(f"帯の{name}の隅が暗くない")
    return issues

def _has_audio(path):
    return bool(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=index", "-of", "csv=p=0", str(path)],
                               capture_output=True, text=True).stdout.strip())


def add_follow_line(loop_path, out_path):
    """ループ版の最後に「フォローして続きを見てね」を入れた動画を作る。できなければ None（元の動画を使う）"""
    f = font()
    if not f: return None
    total = duration(loop_path)
    if total < 3: return None
    h = _video_height(loop_path)
    L = follow_layout(total, h)
    tmp = pathlib.Path(tempfile.mkdtemp())
    for i, line in enumerate(FOLLOW_LINES): (tmp / f"l{i}.txt").write_text(line, encoding="utf-8")
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", str(loop_path), "-vf", follow_filter(total, f, tmp, h)]
    if _has_audio(loop_path) and L["extend"] > 0:
        cmd += ["-af", f"apad=pad_dur={L['extend']}", "-t", str(L["total"]), "-c:a", "aac", "-b:a", "160k"]
    else:
        cmd += ["-c:a", "copy"]
    cmd += ["-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out_path)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    return pathlib.Path(out_path) if r.returncode == 0 and pathlib.Path(out_path).exists() else None
