// カメラの見直し：中くらいの寄り（z < 1.6）で、キャラクターの体が 4 割以上切れて映る所を、最小の動きで直す（少し引く・少し振る）。
//   node rig/camfit.js <回の名前> [--write]     --write を付けると rig/ep/<回>.js のカメラの数字を書き換える
// 直す対象は L.camAt([...], t) の 1 行 1 キーの形だけ。寄りの演出（z ≥ 1.6）と、ほとんど映っていない相手（8% 未満）は触らない。
// 直したあとは必ず node rig/qa.js <回> で確かめる（qa.js の「体が画面から切れている」の警告が消えること・新しい警告が出ないこと）。
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const [ep, flag] = process.argv.slice(2); const file = path.join(__dirname, 'ep', ep + '.js');
const X0 = -40, X1 = 1120, Y0 = -40, Y1 = 1960, NEED = .66, SEE = .08;
(async () => {
  let src = fs.readFileSync(file, 'utf8'); const m = src.match(/L\.camAt\(\[\s*\n([\s\S]*?)\], t\)/); if (!m) { console.log(ep, '形が違うので触らない'); return; }
  const lines = m[1].split('\n'), keys = [];
  lines.forEach((ln, i) => { const k = ln.match(/\{ *t: *([0-9.]+), *z: *([0-9.]+), *cx: *([0-9.\-]+), *cy: *([0-9.\-]+)(?:, *d: *([0-9.]+))? *\}/); if (k) keys.push({ i, t: +k[1], z: +k[2], cx: +k[3], cy: +k[4], d: k[5] != null ? +k[5] : .6 }); });
  if (keys.length !== lines.filter(l => l.trim().startsWith('{')).length) { console.log(ep, '読めないキーがあるので触らない'); return; }
  const b = await chromium.launch(process.env.PW_EXEC ? { executablePath: process.env.PW_EXEC } : {}); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto(`file://${__dirname}/ep.html?ep=${ep}`); await p.waitForTimeout(700); const dur = await p.evaluate(() => EP.dur); const rows = [];
  for (let t = 0; t < dur - .9; t += .1) { await p.evaluate(t => window.setFrame(t), t); rows.push(await p.evaluate(t => { const box = id => { const els = [...document.querySelectorAll('#' + id + ' path, #' + id + ' ellipse, #' + id + ' circle, #' + id + ' rect, #' + id + ' polygon')]; let l = 1e9, tp = 1e9, rt = -1e9, bt = -1e9; for (const e of els) { const r = e.getBoundingClientRect(); if (r.width < 1) continue; l = Math.min(l, r.left); tp = Math.min(tp, r.top); rt = Math.max(rt, r.right); bt = Math.max(bt, r.bottom); } return l > 1e8 ? null : [l, tp, rt, bt]; };
      const mm = getComputedStyle(document.getElementById('world')).transform, v = mm && mm !== 'none' ? mm.split('(')[1].split(')')[0].split(',').map(Number) : [1, 0, 0, 1, 0, 0], z = v[0], tx = v[4], ty = v[5], sc = q => q && [(q[0] - tx) / z, (q[1] - ty) / z, (q[2] - tx) / z, (q[3] - ty) / z];
      return { t, bodies: [sc(box('ren')), sc(box('jil'))].filter(q => q && q[2] - q[0] > 5 && q[3] - q[1] > 5) }; }, t)); }
  await b.close();
  const vis = (q, c) => { const hw = 540 / c.z, hh = 960 / c.z; return Math.max(0, Math.min(q[2], c.cx + hw) - Math.max(q[0], c.cx - hw)) * Math.max(0, Math.min(q[3], c.cy + hh) - Math.max(q[1], c.cy - hh)) / ((q[2] - q[0]) * (q[3] - q[1])); };
  // 映してよい範囲：舞台（-40〜1120・-40〜1960）か、この回のカメラがすでに映している範囲の広いほう
  let BX0 = X0, BX1 = X1, BY0 = Y0, BY1 = Y1; for (const k of keys) { const hw = 540 / k.z, hh = 960 / k.z; BX0 = Math.min(BX0, k.cx - hw); BX1 = Math.max(BX1, k.cx + hw); BY0 = Math.min(BY0, k.cy - hh); BY1 = Math.max(BY1, k.cy + hh); }
  const out = []; let changed = 0;
  keys.forEach((k, n) => { if (k.z >= 1.6) return; const t1 = n + 1 < keys.length ? keys[n + 1].t : dur - 1; let fr = rows.filter(r => r.t >= k.t + k.d - .02 && r.t <= t1 + .02); if (!fr.length) fr = rows.filter(r => Math.abs(r.t - (k.t + k.d)) < .16); if (!fr.length) return;
    const bad = fr.some(r => r.bodies.some(q => { const v = vis(q, k); return v > SEE && v < .6; })); if (!bad) return;
    let best = null;
    for (let z = k.z; z >= Math.max(1, k.z - .5) - 1e-6; z -= .05) for (let dx = -320; dx <= 320; dx += 10) for (let dy = -200; dy <= 200; dy += 20) {
      const c = { z: +z.toFixed(2), cx: k.cx + dx, cy: k.cy + dy }, hw = 540 / c.z, hh = 960 / c.z; if (c.cx - hw < BX0 - .5 || c.cx + hw > BX1 + .5 || c.cy - hh < BY0 - .5 || c.cy + hh > BY1 + .5) continue;
      let ok = true; for (const r of fr) { for (const q of r.bodies) { const v0 = vis(q, k); if (v0 <= SEE) continue; const v1 = vis(q, c); if (v1 < NEED || (v0 >= .95 && v1 < .92)) { ok = false; break; } } if (!ok) break; }
      if (!ok) continue; const cost = Math.abs(dx) / 100 + (k.z - c.z) * 6 + Math.abs(dy) / 60; if (!best || cost < best.cost) best = Object.assign(c, { cost }); }
    if (!best) { out.push(`  t=${k.t} z=${k.z} cx=${k.cx}：直せる置き方が見つからない（そのまま）`); return; }
    out.push(`  t=${k.t}：z ${k.z}→${best.z}  cx ${k.cx}→${best.cx}${best.cy !== k.cy ? `  cy ${k.cy}→${best.cy}` : ''}`);
    lines[k.i] = lines[k.i].replace(/z: *[0-9.]+/, 'z: ' + best.z).replace(/cx: *[0-9.\-]+/, 'cx: ' + best.cx).replace(/cy: *[0-9.\-]+/, 'cy: ' + best.cy); changed++; });
  console.log(ep, changed ? `カメラ ${changed} か所` : '直す所なし'); if (out.length) console.log(out.join('\n'));
  if (changed && flag === '--write') { src = src.replace(m[1], lines.join('\n')); fs.writeFileSync(file, src); }
})();
