// 作業用BGMの場面を1章ぶん（60秒のループ）描く。使い方: node render.js 出力フォルダ "hour=17.5&ren=type&jil=type&weather=rain&look=0&seed=3" [fps=24] [並列数=3] [秒数=60]
// 出力: f00000.jpg …（1920x1080）。thumb を付けると t 秒の1枚だけ: node render.js out.jpg "…" thumb 12.5
const fs = require('fs'), path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/npm-tools/node_modules/playwright')); }
const [out, query, a3, a4, a5, a6] = process.argv.slice(2);
// 2026-11-15：コマは a6 倍の細かさで描く（4/3 倍 = 2560x1440。YouTube は 1440p 以上で上げた動画に質の高い圧縮を使うので、見る人の画面できれいになる）。表紙（thumb）は今までどおり 1920x1080
const SCALE = Math.max(1, Math.min(2, +a6 || 1));
const url = 'file://' + path.join(__dirname, 'scene.html') + '?' + query;
(async () => {
  const b = await chromium.launch(process.env.PW_EXEC ? { executablePath: process.env.PW_EXEC } : {});
  const open = async (k) => { const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: k || 1 }); p.on('pageerror', e => { console.log('ERR', e.message); process.exitCode = 2; }); await p.goto(url); await p.waitForFunction(() => window.BGM && window.setT); return p; };
  if (a3 === 'thumb') {
    const p = await open(); await p.evaluate(t => window.setT(t), +a4 || 0);
    await p.screenshot({ path: out, type: 'jpeg', quality: 93 }); await b.close(); console.log('thumb', out); return;
  }
  const fps = +a3 || 24, par = +a4 || 3, secs = +a5 || 60, N = Math.round(fps * secs);
  fs.mkdirSync(out, { recursive: true });
  let next = 0;
  await Promise.all(Array.from({ length: par }, async () => {
    const p = await open(SCALE);
    for (;;) { const i = next++; if (i >= N) break; await p.evaluate(t => window.setT(t), i / fps); await p.screenshot({ path: `${out}/f${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 95 }); }
  }));
  await b.close(); console.log('frames', N, out);
})();
