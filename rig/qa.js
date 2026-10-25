// 動画QA（描画側）: node qa.js <ep> <report.json> <sheet.jpg>
// すべてのフレームを0.125秒刻みで確認し、次を検出する：
//  - JSエラー／コンソールエラー
//  - キャラクターの顔が画面外に出る（見切れ）
//  - 2.5秒以上まったく動かない（止まり）
//  - エンドカード直前に残骸（fxレイヤーの要素）が残る
//  - カメラの倍率が範囲外、カットが0.6秒未満で連続
//  - 真っ白／真っ黒のフレーム
//  - 暗い幕（#dim）が画面の四隅・四辺まで届いていない／背景が画面の端まで届いていない（依頼 #90：左端だけ明るいまま）
// 加えて12コマのコンタクトシートを出力する（週次レビューで人／Claudeが目視する）。
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const [ep, reportPath, sheetPath] = process.argv.slice(2);
const STEP = 0.125, W = 1080, H = 1920;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: H } });
  const errors = [];
  p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await p.goto('file://' + __dirname + '/ep.html?ep=' + ep); await p.waitForTimeout(600);
  const dur = await p.evaluate(() => EP.dur);
  const issues = [], warns = [];
  if (!(dur >= 15 && dur <= 32)) issues.push(`尺が範囲外: ${dur}s（15〜32s）`);
  let prevHash = null, stillSince = 0, noFace = 0, prevFaces = {}, prevTx = 0, prevTy = 0, prevZ = 1; const occl = {}, prevD = {};
  // 瞬間カット禁止（24fpsで確認）：1フレームで倍率が35%以上、または中心が画面幅の30%以上跳んだらNG。0.4秒のカメラ移動は通る
  {
    let pz = null, ptx = 0, pty = 0;
    for (let i = 0; i < Math.round(dur * 24); i++) {
      const tt = i / 24; await p.evaluate(t => window.setFrame(t), tt);
      const c = await p.evaluate(() => { const m = getComputedStyle(document.getElementById('world')).transform; const v = m && m !== 'none' ? m.split('(')[1].split(')')[0].split(',').map(Number) : [1, 0, 0, 1, 0, 0]; return { z: v[0], tx: v[4], ty: v[5], end: parseFloat(getComputedStyle(document.getElementById('end')).opacity) }; });
      if (pz !== null && c.end < 0.5 && (Math.abs(c.z - pz) / pz > 0.35 || Math.abs(c.tx - ptx) > 0.3 * W || Math.abs(c.ty - pty) > 0.3 * H)) issues.push(`画面が急に切り替わる t=${tt.toFixed(2)}（z ${pz.toFixed(2)}→${c.z.toFixed(2)}）`);
      pz = c.z; ptx = c.tx; pty = c.ty;
    }
  }
  const sheet = [];
  for (let t = 0; t < dur; t += STEP) {
    await p.evaluate(t => window.setFrame(t), t);
    const r = await p.evaluate(() => {
      const W = 1080, H = 1920;
      // 体の外接矩形：文字（Zz・！・？などの記号）は除外し、図形だけで取る
      const box = id => { const els = [...document.querySelectorAll('#' + id + ' path, #' + id + ' ellipse, #' + id + ' circle, #' + id + ' rect, #' + id + ' polygon')]; if (!els.length) return null;
        let l = 1e9, tp = 1e9, rt = -1e9, bt = -1e9; for (const e of els) { const r = e.getBoundingClientRect(); if (r.width < 1) continue; l = Math.min(l, r.left); tp = Math.min(tp, r.top); rt = Math.max(rt, r.right); bt = Math.max(bt, r.bottom); } return [l, tp, rt, bt]; };
      const m = getComputedStyle(document.getElementById('world')).transform;
      const mv = m && m !== 'none' ? m.split('(')[1].split(')')[0].split(',').map(Number) : [1,0,0,1,0,0]; const z = mv[0], tx = mv[4], ty = mv[5];
      const faces = {};
      // 顔の位置は「鼻」から取る（鼻の塗り色で特定）。顔箱＝鼻を中心に横±7・上6・下3（鼻幅の倍率）
      const NOSE = { ren: '#C88D85', jil: '#D98F8E' };
      for (const id of ['ren', 'jil']) {
        const nose = document.querySelector('#' + id + ' path[fill="' + NOSE[id] + '"]'); if (!nose) continue;
        const nr = nose.getBoundingClientRect(); if (nr.width < 1) continue;
        const cx = nr.left + nr.width / 2, cy = nr.top + nr.height / 2, u = nr.width;
        const l = cx - 7 * u, rt = cx + 7 * u, tp = cy - 6 * u, fb = cy + 3 * u, area = (rt - l) * (fb - tp);
        const vis = Math.max(0, Math.min(rt, W) - Math.max(l, 0)) * Math.max(0, Math.min(fb, H) - Math.max(tp, 0));
        let covered = 0, n = 0;
        for (let i = 1; i <= 3; i++) for (let j = 1; j <= 3; j++) {
          const x = l + (rt - l) * i / 4, y = tp + (fb - tp) * j / 4; if (x < 0 || x > W || y < 0 || y > H) continue; n++;
          const els = document.elementsFromPoint(x, y);
          const top = els.find(e => e.tagName !== 'svg' && e.tagName !== 'DIV'); const svg = top && top.closest ? top.closest('svg') : null;
          if (svg && svg.id !== id && svg.id !== 'bg' && svg.id !== 'back' && svg.id !== 'ui') covered++;
        }
        faces[id] = { vis: vis / area, covered: n ? covered / n : 0, cx, cy };
      }
      // 端のすき間：暗い幕と背景（#world）が画面全体（四隅・四辺）をおおっているか。1px の誤差は許す
      const rc = id => document.getElementById(id).getBoundingClientRect();
      const gap = r => Math.max(r.left, r.top, W - r.right, H - r.bottom);
      const dimOp = parseFloat(getComputedStyle(document.getElementById('dim')).opacity);
      return { dimGap: dimOp > 0.02 ? gap(rc('dim')) : 0, worldGap: gap(rc('world')), faces, z, tx, ty, fx: document.querySelectorAll('#fx > *').length, end: parseFloat(getComputedStyle(document.getElementById('end')).opacity), dim: parseFloat(getComputedStyle(document.getElementById('dim')).opacity) };
    });
    // 画面に顔が1つもない（両方とも60%未満）が2.6秒以上続いたらNG（モニターなど小道具への寄りは2.5秒以内の演出として許容）。片方だけ見切れは寄りの演出なのでOK。
    const visList = Object.values(r.faces).map(f => f.vis);
    if (r.end < 0.5 && visList.length && Math.max(...visList) < 0.6) { noFace += STEP; if (Math.abs(noFace - 2.625) < 1e-6) issues.push(`顔が画面にない t=${(t - 2.625).toFixed(2)}〜`); } else noFace = 0;
    // 瞬間移動禁止：見えている顔が1コマ（0.125秒）で画面幅の22%以上跳んだらNG（カメラ移動分は差し引く）
    for (const [id, f] of Object.entries(r.faces)) {
      const pf = prevFaces[id];
      if (pf && pf.vis > 0.6 && f.vis > 0.6 && r.end < 0.5) {
        const dx = (f.cx - r.tx) / r.z - (pf.cx - prevTx) / prevZ, dy = (f.cy - r.ty) / r.z - (pf.cy - prevTy) / prevZ; // ワールド座標での移動
        const d = Math.hypot(dx, dy); const pd = prevD[id] || 0;
        // 直前のコマがほぼ止まっていたのに急に大きく動く＝ポップ。落下や走りなど連続した速い動きは通す
        if (d > 240 && pd < d * 0.35) issues.push(`${id === 'ren' ? 'レン' : 'ジル'}が瞬間移動 t=${t.toFixed(2)}（${Math.round(d)}px/コマ）`);
        prevD[id] = d;
      }
    }
    prevFaces = r.faces; prevTx = r.tx; prevTy = r.ty; prevZ = r.z;
    // 顔が他のもの（書類・相手・fx）に隠れる：9点中5点以上が他レイヤーに覆われる状態が0.75秒以上
    for (const [id, f] of Object.entries(r.faces)) {
      if (f.vis >= 0.6 && f.covered >= 0.55 && r.end < 0.5) { occl[id] = (occl[id] || 0) + STEP; if (Math.abs(occl[id] - 0.75) < 1e-6) issues.push(`${id === 'ren' ? 'レン' : 'ジル'}の顔が隠れている t=${(t - 0.75).toFixed(2)}〜`); } else occl[id] = 0;
    }
    if (r.end < 0.5 && r.dimGap > 1) issues.push(`暗い幕が画面の端まで届いていない t=${t.toFixed(2)}（すき間 ${Math.round(r.dimGap)}px）`);
    if (r.end < 0.5 && r.worldGap > 1) issues.push(`背景が画面の端まで届いていない t=${t.toFixed(2)}（すき間 ${Math.round(r.worldGap)}px）`);
    if (r.z < 0.9 || r.z > 4.2) issues.push(`カメラ倍率が範囲外 t=${t.toFixed(2)} z=${r.z.toFixed(2)}`);
    // 止まり検出：縮小スクショのハッシュ比較
    const buf = await p.screenshot({ type: 'jpeg', quality: 40, clip: { x: 0, y: 0, width: W, height: H }, scale: 'css' });
    const hash = require('crypto').createHash('md5').update(buf).digest('hex');
    if (hash === prevHash) { stillSince += STEP; if (stillSince >= 2.5 && Math.abs(stillSince - 2.5) < 1e-6 && r.end < 0.5) issues.push(`2.5秒以上動きなし t=${(t - stillSince).toFixed(2)}〜`); }
    else stillSince = 0;
    prevHash = hash;
    // 白飛び／黒つぶれ：ごく小さいJPEGは単色
    if (buf.length < 6000 && r.end < 0.5 && r.dim < 0.9) issues.push(`単色フレーム t=${t.toFixed(2)}`);
    // 残骸：エンドカード直前
    if (t >= dur - 1.2 && t < dur - 1.1 && r.fx > 3) warns.push(`エンドカード直前にfx要素が${r.fx}個残っている`);
    if (Math.abs((t / dur) * 12 - Math.round((t / dur) * 12)) < STEP / dur * 6 && sheet.length < 12) sheet.push({ t, buf: await p.screenshot({ type: 'jpeg', quality: 70 }) });
  }
  // エンドカードが出ること
  await p.evaluate(t => window.setFrame(t), dur - 0.2);
  const endOp = await p.evaluate(() => parseFloat(getComputedStyle(document.getElementById('end')).opacity));
  if (endOp < 0.9) issues.push(`エンドカードが出ていない（opacity ${endOp}）`);
  await b.close();
  if (errors.length) issues.push(...[...new Set(errors)].slice(0, 5));
  // コンタクトシート（4x3）
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'qa-')); sheet.forEach((s, i) => fs.writeFileSync(`${tmp}/s${String(i).padStart(2, '0')}.jpg`, s.buf));
  require('child_process').execSync(`ffmpeg -y -loglevel error -pattern_type glob -i '${tmp}/s*.jpg' -filter_complex "scale=270:480,tile=4x3" "${sheetPath}"`);
  const report = { ep, dur, pass: issues.length === 0, issues: [...new Set(issues)], warns: [...new Set(warns)] };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report)); process.exit(report.pass ? 0 : 2);
})();
