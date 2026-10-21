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
  3. レビュー用素材の書き出し（Claudeが画像を開いて目視レビュー、別の視点の「辛口レビュー」も行う。
     基準は README の「笑いの設計」と下の REVIEW_CHECKLIST）
"""
import json, os, pathlib, subprocess, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from post import render, qa_gate, thumbnail, AUTO, DIST, RIG

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
        p = sch.get(ep) or {"ep": ep, "no": 0, "title": ep}
        try:
            res["thumb"] = str(thumbnail(p)); res["thumb_qa"] = True
        except subprocess.CalledProcessError as e:
            res["thumb_qa"] = False; res["thumb_error"] = f"exit {e.returncode}（3=文字がグリッド外/重なり、4=顔が写っていない、5=英語の見出しが枠の幅の70%未満で小さすぎる）"
        try:
            res["review_images"] = [str(review_sheet(ep)), str(DIST / f"{ep}_sheet.jpg")] + ([res["thumb"]] if res.get("thumb") else [])
        except Exception as e:
            res["review_error"] = repr(e)[:300]
        res["pass_machine"] = bool(res["render_qa"] and res["thumb_qa"])
        ok_all &= res["pass_machine"]
        (DIST / f"{ep}_brushup.json").write_text(json.dumps(res, ensure_ascii=False, indent=2))
        print(json.dumps({k: res[k] for k in ("ep", "render_qa", "thumb_qa", "pass_machine")}, ensure_ascii=False), flush=True)
    return 0 if ok_all else 2

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
