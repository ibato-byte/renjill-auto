#!/usr/bin/env python3
"""作業用BGM（長尺）の検査。1つでも NG なら出さない（auto/bgm.py が呼ぶ）。
見る角度：①音（長さ・音量・ピーク・無音・こもり／きんきん・左右の広がり・曲ごとの音量差）②曲のかぶり（同じ回の中・前の回と）
③絵（大きさ・長さ・ループのつなぎ目・ちらつき・止まっていないか・明るさ・章ごとに絵が違うか）④表紙 ⑤題名・説明・曲の一覧 ⑥前の回と同じ作りになっていないか
機械では「曲として心地よいか」は測れない。そこは人の耳（オーナー・週次の見直し）で確かめる。"""
import json, pathlib, re, subprocess
import numpy as np


def _run(cmd): return subprocess.run([str(c) for c in cmd], capture_output=True, text=True)


def probe(path):
    r = _run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate,duration,sample_rate,channels:format=duration,size", "-of", "json", path])
    return json.loads(r.stdout or "{}")


def loudness(path):
    r = _run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"])
    tail = r.stderr[r.stderr.rfind("Summary:"):]
    g = lambda pat: float(re.search(pat, tail).group(1))
    return {"lufs": g(r"I:\s+(-?[\d.]+) LUFS"), "lra": g(r"LRA:\s+(-?[\d.]+) LU"), "peak": g(r"Peak:\s+(-?[\d.]+) dBFS")}


def silences(path, db=-45, dur=3.0):
    r = _run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-vn", "-af", f"silencedetect=noise={db}dB:d={dur}", "-f", "null", "-"])
    return [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", r.stderr)]


def excerpt(path, start, secs=30, sr=22050):
    r = subprocess.run(["ffmpeg", "-loglevel", "error", "-ss", str(start), "-t", str(secs), "-i", str(path), "-vn", "-ac", "2", "-ar", str(sr), "-f", "f32le", "-"], capture_output=True)
    return np.frombuffer(r.stdout, dtype=np.float32).reshape(-1, 2), sr


def spectrum(x, sr):
    """帯域ごとのエネルギーの割合（%）と左右の相関"""
    m = x.mean(axis=1); n = 4096
    segs = [m[i:i + n] * np.hanning(n) for i in range(0, len(m) - n, n // 2)]
    p = np.mean([np.abs(np.fft.rfft(s)) ** 2 for s in segs], axis=0); f = np.fft.rfftfreq(n, 1 / sr); tot = p.sum() + 1e-12
    b = lambda a, c: float(100 * p[(f >= a) & (f < c)].sum() / tot)
    corr = float(np.corrcoef(x[:, 0], x[:, 1])[0, 1]) if x[:, 0].std() > 0 and x[:, 1].std() > 0 else 1.0
    return {"sub": b(0, 60), "bass": b(60, 250), "lowmid": b(250, 1000), "mid": b(1000, 4000), "hi": b(4000, sr / 2), "corr": corr}


def gray_frames(frames_dir, step=1, size=(160, 90)):
    r = subprocess.run(["ffmpeg", "-loglevel", "error", "-framerate", "24", "-i", str(frames_dir / "f%05d.jpg"), "-vf", f"select='not(mod(n\\,{step}))',scale={size[0]}:{size[1]},format=gray", "-vsync", "0", "-f", "rawvideo", "-"], capture_output=True)
    return np.frombuffer(r.stdout, dtype=np.uint8).reshape(-1, size[1], size[0]).astype(np.float32)


def check_loop(g):
    """1章ぶんのコマ（グレー・縮小）→ つなぎ目・ちらつき・動きの数字"""
    d = np.abs(np.diff(g, axis=0)).mean(axis=(1, 2))
    seam = float(np.abs(g[0] - g[-1]).mean())
    return {"adj_mean": float(d.mean()), "adj_max": float(d.max()), "seam": seam, "luma": float(g.mean())}


def check_meta(meta):
    probs = []
    t = meta["title"]
    if not t or len(t) > 100 or "<" in t or ">" in t: probs.append(f"題名が長い・使えない文字（{len(t)}文字）")
    if len(meta["description"]) > 4500: probs.append("説明が長すぎる")
    ts = re.findall(r"^(\d+:\d{2}(?::\d{2})?) ", meta["description"], flags=re.M)
    sec = [sum(int(x) * 60 ** i for i, x in enumerate(reversed(s.split(":")))) for s in ts]
    if len(sec) < 3 or sec[0] != 0 or any(b - a < 10 for a, b in zip(sec, sec[1:])): probs.append("曲の一覧の時刻が YouTube のチャプターの決まり（0:00 から・3つ以上・10秒以上あける）に合わない")
    if sec and sec[-1] >= meta["minutes"] * 60: probs.append("曲の一覧の時刻が動画の長さを超えている")
    if len(set(meta["track_names"])) != len(meta["track_names"]): probs.append("曲名がかぶっている")
    if sum(len(x) + 1 for x in meta["tags"]) > 480: probs.append("タグが長すぎる")
    for lang, v in meta["localizations"].items():
        if len(v["title"]) > 100: probs.append(f"{lang} の題名が長い")
    return probs


def check_novelty(meta, prev):
    """前の回と同じ作りになっていないか（量産に見えないための最低限）"""
    probs = []
    keys = [f'{t["key"]}|{"-".join(t["prog"])}|{t["bpm"]}' for t in meta["tracks"]]
    if len(set(keys)) != len(keys): probs.append("同じ回の中に、同じ調・進行・速さの曲がある")
    sig = [(t["key"], tuple(t["prog"])) for t in meta["tracks"]]
    if len(set(sig)) < len(sig): probs.append("同じ回の中に、同じ調・同じ進行の曲がある")
    for a, b in zip(meta["tracks"], meta["tracks"][1:]):
        if a["key"] == b["key"]: probs.append(f'曲 {a["no"]} と {b["no"]} の調が同じ（続けて聞くと同じ曲に聞こえる）')
    if prev:
        last = prev[-1]
        if last.get("theme") == meta["theme"]: probs.append("前の回と同じテーマ")
        if last.get("title") == meta["title"]: probs.append("前の回と同じ題名")
        if last.get("seed") == meta["seed"]: probs.append("前の回と同じ seed（同じ曲になる）")
        for p in prev:
            both = set(p.get("track_keys") or []) & set(keys)
            if len(both) > 2: probs.append(f'前の回（{p.get("title", "")[:20]}…）と同じ曲が {len(both)} 曲ある')
    return probs


def check_all(work, meta, frame_dirs, prev):
    work = pathlib.Path(work); probs, warns, num = [], [], {}
    out = next((work / n for n in ("bgm.mov", "bgm.mp4") if (work / n).exists()), work / "bgm.mov"); total = meta["minutes"] * 60
    # ---- ファイル ----
    pr = probe(out); st = {s["codec_type"]: s for s in pr.get("streams", [])}
    dur = float(pr.get("format", {}).get("duration", 0)); num["sec"] = round(dur, 1); num["mb"] = round(int(pr.get("format", {}).get("size", 0)) / 1e6)
    if abs(dur - total) > 2: probs.append(f"長さが {dur:.1f} 秒（予定 {total} 秒）")
    v, a = st.get("video"), st.get("audio")
    if not v or (v.get("width"), v.get("height")) != (1920, 1080): probs.append("絵が 1920x1080 でない")
    if v and v.get("r_frame_rate") != "24/1": probs.append(f'コマ数が 24 でない（{v.get("r_frame_rate")}）')
    if not a or int(a.get("channels", 0)) != 2: probs.append("音がステレオでない")
    if v and a and abs(float(v.get("duration", 0)) - float(a.get("duration", 0))) > 1.0: probs.append("絵と音の長さがずれている")
    if num["mb"] > 8000: probs.append("ファイルが大きすぎる")
    # ---- 音 ----
    L = loudness(out); num.update({"lufs": L["lufs"], "lra": L["lra"], "peak": L["peak"]})
    if not -16.5 <= L["lufs"] <= -13.5: probs.append(f'音量 {L["lufs"]} LUFS（目安 -15）')
    if L["peak"] > -1.0: probs.append(f'ピーク {L["peak"]} dBFS（-1.0 以下にする）')
    if L["lra"] > 9: warns.append(f'音量の幅が広い（LRA {L["lra"]}）。作業用には静かと大きいの差が大きすぎるかも')
    sil = [s for s in silences(out) if 3 < s < total - 8]
    num["silences"] = len(sil)
    if sil: probs.append(f"途中に3秒以上の無音が {len(sil)} か所（最初は {sil[0]:.0f} 秒）")
    sp = []
    for k in range(8):                                       # 全体から8か所を30秒ずつ
        x, sr = excerpt(out, 40 + k * (total - 120) / 8)
        if len(x) > sr * 5: sp.append(spectrum(x, sr))
    if sp:
        avg = {k: round(float(np.mean([s[k] for s in sp])), 2) for k in sp[0]}; num["spectrum"] = avg
        if avg["mid"] + avg["hi"] < 2.0: probs.append(f'音がこもりすぎ（1kHz より上が {avg["mid"] + avg["hi"]:.1f}%）')
        if avg["hi"] > 10: probs.append(f'高い音が強すぎて耳に刺さる（4kHz より上が {avg["hi"]:.1f}%）')
        if avg["sub"] > 30: probs.append(f'低い音が強すぎる（60Hz より下が {avg["sub"]:.1f}%）')
        if min(s["corr"] for s in sp) < 0.2: probs.append("左右の音がばらばら（片耳・スマホのスピーカーで音が消える）")
        if avg["corr"] > 0.995: warns.append("ほぼモノラル（広がりがない）")
    secs = [t["sec"] for t in meta["tracks"]]
    if min(secs) < 90 or max(secs) > 330: probs.append(f"曲の長さが極端（{min(secs):.0f}〜{max(secs):.0f} 秒）")
    num["tracks"] = len(secs)
    # ---- 絵 ----
    loops = []
    for i, d in enumerate(frame_dirs):
        d = pathlib.Path(d)
        if not d.exists(): continue
        g = gray_frames(d); c = check_loop(g); loops.append(c)
        if len(g) != 24 * 60: probs.append(f"章{i + 1}：コマ数が {len(g)}（1440 のはず）")
        if c["seam"] > max(1.2, c["adj_max"] * 1.5): probs.append(f'章{i + 1}：ループのつなぎ目が見える（差 {c["seam"]:.2f}）')
        if c["adj_max"] > 10: probs.append(f'章{i + 1}：1コマで画面が大きく変わる所がある（{c["adj_max"]:.1f}）')
        if c["adj_mean"] < 0.02: probs.append(f"章{i + 1}：絵が止まっている")
        if not 30 <= c["luma"] <= 225: probs.append(f'章{i + 1}：暗すぎる／明るすぎる（{c["luma"]:.0f}）')
    if loops:
        num["loops"] = [{k: round(v, 2) for k, v in c.items()} for c in loops]
        firsts = [gray_frames(pathlib.Path(d), step=1440)[0] for d in frame_dirs if pathlib.Path(d).exists()]
        diffs = [float(np.abs(a - b).mean()) for a, b in zip(firsts, firsts[1:])]
        num["chapter_diff"] = [round(x, 1) for x in diffs]
        if diffs and min(diffs) < 1.5: probs.append("となりの章で絵がほとんど同じ（時間が進んだことが分からない）")
    # ---- 表紙 ----
    th = work / "thumb.jpg"; tp = probe(th); ts = (tp.get("streams") or [{}])[0]
    if (ts.get("width"), ts.get("height")) != (1280, 720): probs.append("表紙が 1280x720 でない")
    if th.exists() and th.stat().st_size > 2_000_000: probs.append("表紙が 2MB を超える")
    # ---- 題名・説明・かぶり ----
    probs += check_meta(meta) + check_novelty(meta, prev)
    return {"ok": not probs, "problems": probs, "warnings": warns, "numbers": num}


def contact_sheet(frame_dirs, out):
    """目で点検するための一覧（章ごとに4コマ）"""
    ins, n = [], 0
    for d in frame_dirs:
        for t in (5, 14, 33, 52):
            f = pathlib.Path(d) / f"f{t * 24:05d}.jpg"
            if f.exists(): ins += ["-i", str(f)]; n += 1
    if n < 2: return
    cols = 4; rows = (n + cols - 1) // cols
    f = "".join(f"[{i}:v]scale=480:270[s{i}];" for i in range(n)) + "".join(f"[s{i}]" for i in range(n)) + f"xstack=inputs={n}:layout=" + "|".join(f"{(i % cols) * 480}_{(i // cols) * 270}" for i in range(n))
    _run(["ffmpeg", "-y", "-loglevel", "error"] + ins + ["-filter_complex", f, "-frames:v", "1", "-q:v", "4", str(out)])
