#!/usr/bin/env python3
"""動画QA（投稿前の関門）。すべて通らなければ投稿しない。
  1. 描画QA（rig/qa.js）: JSエラー・見切れ・止まり・残骸・エンドカード・コンタクトシート
  2. ファイルQA: 1080x1920 / 24fps / 音声あり / 尺 / ピーク（クリップなし）/ 無音でない / 音の途切れ
使い方: python auto/qa.py <ep> <yt.mp4> <loop.mp4>  → dist/<ep>_qa.json, dist/<ep>_sheet.jpg
"""
import json, os, pathlib, subprocess, sys
import numpy as np
ROOT = pathlib.Path(__file__).resolve().parent.parent
RIG, DIST = ROOT / "rig", ROOT / "dist"

def ffprobe(path):
    j = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-print_format", "json", "-show_streams", "-show_format", str(path)]))
    v = next(s for s in j["streams"] if s["codec_type"] == "video"); a = [s for s in j["streams"] if s["codec_type"] == "audio"]
    return v, a, float(j["format"]["duration"])

def audio_stats(path):
    # ステレオは左右の平均で測る（-ac 1 は -3dB で足し合わせるので、真ん中の音のピークを 1.41 倍に見積もり「クリップ」と誤判定する。2026-11-08）
    ch = int((subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=channels", "-of", "csv=p=0", str(path)]).decode().strip() or "1").split(",")[0])
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", str(ch), "-ar", "24000", "-"])
    x = np.frombuffer(raw, dtype=np.float32)
    if ch > 1: x = x[: len(x) // ch * ch].reshape(-1, ch).mean(1)
    peak = float(np.abs(x).max()) if x.size else 0.0
    rms = float(np.sqrt(np.mean(x ** 2))) if x.size else 0.0
    # 1秒ごとの無音区間（BGMがあるので完全無音は異常。ただし意図した「間」は1秒程度）
    sec = x[: len(x) // 24000 * 24000].reshape(-1, 24000); silent = (np.sqrt((sec ** 2).mean(1)) < 1e-4)
    longest = 0; cur = 0
    for s in silent: cur = cur + 1 if s else 0; longest = max(longest, cur)
    return peak, rms, longest

def main(ep, yt, loop):
    issues, warns = [], []
    rep, sheet = DIST / f"{ep}_qa.json", DIST / f"{ep}_sheet.jpg"
    env = dict(os.environ, NODE_PATH=subprocess.check_output(["npm", "root", "-g"]).decode().strip())
    r = subprocess.run(["node", str(RIG / "qa.js"), ep, str(rep), str(sheet)], env=env, capture_output=True, text=True)
    try: rj = json.loads(rep.read_text())
    except Exception: rj = {"pass": False, "issues": [f"qa.js が失敗: {r.stderr[-300:]}"], "warns": []}
    issues += rj.get("issues", []); warns += rj.get("warns", [])
    for name, path, need_end in [("yt", yt, True), ("loop", loop, False)]:
        path = pathlib.Path(path)
        if not path.exists() or path.stat().st_size < 500_000: issues.append(f"{name}: ファイルがない/小さすぎる"); continue
        v, a, d = ffprobe(path)
        if (v["width"], v["height"]) != (1080, 1920): issues.append(f"{name}: 解像度 {v['width']}x{v['height']}")
        if abs(eval(v["r_frame_rate"]) - 24) > 0.1: issues.append(f"{name}: fps {v['r_frame_rate']}")
        if not a: issues.append(f"{name}: 音声トラックなし"); continue
        if not (8 <= d <= 20): issues.append(f"{name}: 尺 {d:.1f}s")
        peak, rms, longest = audio_stats(path)
        if peak > 0.99: issues.append(f"{name}: 音がクリップ（peak {peak:.2f}）")
        if rms < 0.01: issues.append(f"{name}: ほぼ無音（rms {rms:.3f}）")
        if longest >= 3: issues.append(f"{name}: {longest}秒以上の完全無音")
    out = {"ep": ep, "pass": not issues, "issues": issues, "warns": warns, "render": rj}
    rep.write_text(json.dumps(out, ensure_ascii=False, indent=2))
    print(json.dumps(out, ensure_ascii=False))
    return 0 if not issues else 2

if __name__ == "__main__":
    sys.exit(main(*sys.argv[1:4]))
