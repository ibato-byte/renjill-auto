#!/usr/bin/env python3
"""ブラッシュアップ検査（1回分）。週次PDCAのClaudeが「作る→検査→直す」を最大3周くり返すときに使う。

使い方:
  python auto/brushup.py <ep> [<ep> ...]
出力:
  dist/<ep>_brushup.json  … 機械検査の結果と、目視・笑いのレビューで見るべき画像のパス
  dist/<ep>_review.jpg    … 24コマのコンタクトシート（2秒ごと＋オチ前後を細かく）
  dist/<ep>_thumb.jpg     … サムネ（グリッド切り抜き・重なり・顔のチェック済み）
終了コード: 全部 pass なら 0、どれか NG なら 2

検査は3段：
  1. 描画QA＋ファイルQA（auto/qa.py。瞬間カット・瞬間移動・顔の見切れ/隠れ・止まり・音）
  2. サムネQA（rig/thumb.js。グリッド切り抜き・文字とチップの重なり・顔）
  2b. 最後の一言（フォローして続きを見てね）：2秒以上・読める大きさ・隠れない位置（依頼 #51）
  3. レビュー用素材の書き出し（Claudeが画像を開いて目視レビュー、別の視点の「辛口レビュー」も行う。
     基準は README の「笑いの設計」と下の REVIEW_CHECKLIST）
"""
import json, os, pathlib, subprocess, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from post import render, qa_gate, thumbnail, AUTO, DIST, RIG
import growth

REVIEW_CHECKLIST = [
    "最初の1秒で状況（誰が・何をしている）がわかるか",
    "遊び（ゲーム）は1つだけか。3回、少しずつ大きくなっているか",
    "オチの前に「間」（音が止まる・寄り）があるか",
    "オチの後のオチ（ひとひねり）があるか",
    "セリフなしで海外の人にも伝わるか（文字に頼っていないか）",
    "顔が隠れる・小道具がキャラの後ろに消える・記号の残骸がないか",
    "サムネの英語見出しが一目で内容を言い当てているか（12文字以内）",
]

def review_sheet(ep):
    """2秒ごと＋終盤を細かく、24コマのシートを書き出す"""
    env = dict(os.environ, NODE_PATH=subprocess.check_output(["npm", "root", "-g"]).decode().strip())
    js = r"""
const { chromium } = require('playwright'); const fs = require('fs'); const os = require('os'); const path = require('path');
const [ep, out, rig] = process.argv.slice(1);
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + rig + '/ep.html?ep=' + ep); await p.waitForTimeout(600);
  const dur = await p.evaluate(() => EP.dur); const ts = [];
  for (let i = 0; i < 16; i++) ts.push(i * (dur - 1.2) / 15);
  for (let i = 0; i < 8; i++) ts.push((dur * 0.5) + i * (dur * 0.45) / 8);
  ts.sort((a, b) => a - b);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rv-'));
  for (let i = 0; i < ts.length; i++) { await p.evaluate(t => window.setFrame(t), ts[i]); await p.screenshot({ path: `${tmp}/s${String(i).padStart(2, '0')}.jpg`, type: 'jpeg', quality: 60 }); }
  await b.close();
  require('child_process').execSync(`ffmpeg -y -loglevel error -pattern_type glob -i '${tmp}/s*.jpg' -filter_complex "scale=216:384,tile=6x4" "${out}"`);
})();
"""
    out = DIST / f"{ep}_review.jpg"
    subprocess.run(["node", "-e", js, ep, str(out), str(RIG)], check=True, env=env)
    return out

def follow_edge_issues(video, L, h, real):
    """最後の一言の帯が、左右の端・四隅まで暗いか（依頼 #90）。帯を出している間のコマで、帯の行の左端・右端と、文字のない帯の色を比べる。
    端が帯の紺より明るければ NG"""
    w = growth._video_width(video)
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

def follow_check(ep, loop):
    """最後の一言（フォローして続きを見てね）の検査：2秒以上・読める大きさ・下のボタンに隠れない・30秒未満。
    作った動画の最後の数コマを dist/<ep>_follow.jpg に書き出す（目視で、顔に重なっていないか見る）"""
    out = growth.add_follow_line(loop, DIST / f"{ep}_loopf.mp4")
    if not out: return {"pass": False, "issues": ["最後の一言を動画に入れられなかった（日本語フォントや ffmpeg を確認）"]}
    h = growth._video_height(out)
    total = growth.duration(loop)
    L = growth.follow_layout(total, h)
    real = growth.duration(out)
    issues = []
    if L["show"] < 2.0: issues.append(f"表示が{L['show']}秒（2秒以上にする）")
    if L["fontsize"] < h * 0.06: issues.append("文字が小さい（画面の高さの6%以上にする）")
    if L["text_bottom"] > h * 0.80: issues.append("文字が下すぎる（下から20%より上にする。下のボタンや説明文に隠れる）")
    if real >= 30: issues.append(f"動画が{real:.1f}秒で30秒以上")
    if abs(real - L["total"]) > 0.3: issues.append(f"動画の長さが想定（{L['total']}秒）とずれている（{real:.2f}秒）")
    ts = [L["start"] - 0.3, L["start"] + 0.1, L["start"] + 1.0, L["end"] - 0.1, real - 0.05]
    tmp = DIST / f"_{ep}_ff"; tmp.mkdir(exist_ok=True)
    for i, t in enumerate(ts):
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{max(0, t):.2f}", "-i", str(out), "-frames:v", "1", "-vf", "scale=270:480", str(tmp / f"{i}.png")], check=False)
    issues += follow_edge_issues(out, L, h, real)
    sheet = DIST / f"{ep}_follow.jpg"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(tmp / "%d.png"), "-filter_complex", f"tile={len(ts)}x1", str(sheet)], check=False)
    return {"pass": not issues, "issues": issues, "show_sec": L["show"], "extend_sec": L["extend"], "total_sec": round(real, 2), "image": str(sheet)}

def main(eps):
    sch = {p["ep"]: p for p in json.loads((AUTO / "schedule.json").read_text())["posts"]}
    ok_all = True
    for ep in eps:
        res = {"ep": ep, "render_qa": None, "thumb_qa": None, "review_images": [], "checklist": REVIEW_CHECKLIST}
        try:
            yt, loop = render(ep)
            res["render_qa"] = qa_gate(ep, yt, loop)
            res["qa_detail"] = json.loads((DIST / f"{ep}_qa.json").read_text())
        except Exception as e:
            res["render_qa"] = False; res["error"] = repr(e)[:400]
        try:
            res["follow"] = follow_check(ep, loop)
        except Exception as e:
            res["follow"] = {"pass": False, "issues": [repr(e)[:300]]}
        p = sch.get(ep) or {"ep": ep, "no": 0, "title": ep}
        try:
            res["thumb"] = str(thumbnail(p)); res["thumb_qa"] = True
        except subprocess.CalledProcessError as e:
            res["thumb_qa"] = False; res["thumb_error"] = f"exit {e.returncode}（3=文字がグリッド外/重なり、4=顔が写っていない、5=英語の見出しが枠の幅の70%未満で小さすぎる、6=キャラが枠の端で中途半端に切れる、7=文字の背景がごちゃつく、8=直近6本と見出しの幅・高さ・位置が揃わない）"
        try:
            res["review_images"] = [str(review_sheet(ep)), str(DIST / f"{ep}_sheet.jpg")] + ([res["follow"]["image"]] if res.get("follow", {}).get("image") else []) + ([res["thumb"]] if res.get("thumb") else [])
        except Exception as e:
            res["review_error"] = repr(e)[:300]
        res["pass_machine"] = bool(res["render_qa"] and res["thumb_qa"] and res.get("follow", {}).get("pass"))
        ok_all &= res["pass_machine"]
        (DIST / f"{ep}_brushup.json").write_text(json.dumps(res, ensure_ascii=False, indent=2))
        print(json.dumps({k: res[k] for k in ("ep", "render_qa", "thumb_qa", "pass_machine")}, ensure_ascii=False), flush=True)
    return 0 if ok_all else 2

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
