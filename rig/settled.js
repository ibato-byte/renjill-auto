// 描き終わったコマだけを撮る：ブラウザが絵を塗り終えるのを待ち、2 回つづけて同じ絵になったものを返す（rig/render-ep.js・rig/bgm/render.js が使う）。
// 2026-11-15 事故：描きかけのコマが動画にまざり、ちかちかした。二度と起きないように、撮る所はすべてここを通す。
exports.settled = async function (p, opt, max) {
  await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  let a = await p.screenshot(opt);
  for (let k = 0; k < (max || 8); k++) { const b = await p.screenshot(opt); if (a.equals(b)) return b; a = b; await p.waitForTimeout(40); }
  throw new Error('コマの絵が落ち着かない（撮るたびに違う）');
};
