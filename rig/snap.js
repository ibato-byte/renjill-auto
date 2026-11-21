// 指定した秒のコマだけを並べて1枚にする（全部レンダリングせずに見た目を確かめる）
// node rig/snap.js <ep> "<秒,秒,...>" <出力.png> [幅=360]
const { chromium } = require('playwright');
const [ep, ts, out, w = '360'] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(process.env.PW_EXEC ? { executablePath: process.env.PW_EXEC } : {});
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto(`file://${__dirname}/ep.html?ep=${ep}${process.env.Q || ""}`); await p.waitForTimeout(800);
  const shots = [];
  for (const t of ts.split(',').map(Number)) { await p.evaluate(t => window.setOut ? window.setOut(t) : window.setFrame(t), t); await p.waitForTimeout(60); shots.push((await p.screenshot({ type: 'png' })).toString('base64')); }
  const W = +w, H = Math.round(W * 1920 / 1080), cols = Math.min(4, shots.length), rows = Math.ceil(shots.length / cols);
  const q = await b.newPage({ viewport: { width: W * cols, height: H * rows } });
  await q.setContent(`<body style="margin:0;display:grid;grid-template-columns:repeat(${cols},${W}px)">${shots.map((s, i) => `<div style="position:relative"><img src="data:image/png;base64,${s}" width="${W}" height="${H}"><b style="position:absolute;left:6px;top:4px;color:#fff;background:#000a;font:16px sans-serif;padding:2px 6px">${ts.split(',')[i]}s</b></div>`).join('')}</body>`);
  await q.screenshot({ path: out }); await b.close();
})();
