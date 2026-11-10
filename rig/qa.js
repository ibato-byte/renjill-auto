// 動画QA（描画側）: node qa.js <ep> <report.json> <sheet.jpg>
// すべてのフレームを0.125秒刻みで確認し、次を検出する：
//  - JSエラー／コンソールエラー
//  - キャラクターの顔が画面外に出る（見切れ）
//  - 2.5秒以上まったく動かない（止まり）
//  - エンドカード直前に残骸（fxレイヤーの要素）が残る
//  - カメラの倍率が範囲外、カットが0.6秒未満で連続
//  - 真っ白／真っ黒のフレーム
//  - 暗い幕（#dim）が画面の四隅・四辺にかかっていない（最後のカードの左端だけ明るい不具合・依頼 #90）
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
  const dur = await p.evaluate(() => outDur());   // 画面に出る長さ（頭を削り、速くしたあと。依頼 #97）
  const issues = [], warns = [];
  // ---- 腕（2026-11-10 の報告「変なところから腕が生える」）：レンとジルには元のデザインに腕がない。
  //   ① エピソードの中で太い丸い線（腕のような物）を直接描かない → common.js の limb()（体のふちから・長さに上限）を使う
  //   ② limb() で届かず、腕を短く切った所があれば知らせる（手と持ち物が離れて見える）
  try { const src = fs.readFileSync(path.join(__dirname, 'ep', ep + '.js'), 'utf8');
    const thick = (src.match(/'stroke-width':\s*(2[8-9]|[3-9]\d)\b[^)]*'stroke-linecap':\s*'round'|'stroke-linecap':\s*'round'[^)]*'stroke-width':\s*(2[8-9]|[3-9]\d)\b/g) || []);
    if (thick.length) issues.push(`腕のような太い線を直接描いている（${thick.length}か所）：腕は limb() で、体のふちから短く`); } catch (e) { }
  if (!(dur >= 8 && dur <= 20)) issues.push(`尺が範囲外: ${dur.toFixed(1)}s（8〜20s。目安は7〜12s、最後まで見られる長さに）`);
  else if (dur > 17) warns.push(`尺が長め: ${dur.toFixed(1)}s（目安は7〜12s）`);
  // ---- 最初のコマ＝表紙（TikTok などは最初のコマが表紙になる）：冒頭の一言が薄くないこと（2026-11-10 の報告「サムネが薄い」）
  { await p.evaluate(() => window.setOut(0)); const f0 = await p.evaluate(() => { const h = document.getElementById('hook'); return h && h.textContent.trim() ? parseFloat(getComputedStyle(h).opacity) : null; });
    if (f0 !== null && f0 < 0.98) issues.push(`最初のコマで冒頭の一言が薄い（濃さ ${f0.toFixed(2)}）：表紙が薄くなる。最初のコマから濃さ100%で出す`); }
  // ---- つかみの検査（依頼 #97）：①最初の1秒で絵が動く ②冒頭の英語の文字が十分大きく、安全域（上下の隠れる範囲の内側）に収まる
  {
    const sig = async o => { await p.evaluate(t => window.setOut(t), o); return p.evaluate(() => {
      const m = getComputedStyle(document.getElementById('world')).transform; const v = m && m !== 'none' ? m.split('(')[1].split(')')[0].split(',').map(Number) : [1, 0, 0, 1, 0, 0];
      const bb = id => { const els = [...document.querySelectorAll('#' + id + ' path, #' + id + ' ellipse, #' + id + ' circle, #' + id + ' rect')].filter(e => e.getBoundingClientRect().width > 1); if (!els.length) return [0, 0, 0, 0]; const rs = els.map(e => e.getBoundingClientRect()); return [Math.min(...rs.map(r => r.left)), Math.min(...rs.map(r => r.top)), Math.max(...rs.map(r => r.right)), Math.max(...rs.map(r => r.bottom))]; };
      return { z: v[0], tx: v[4], ty: v[5], ren: bb('ren'), jil: bb('jil'), fx: document.querySelectorAll('#fx > *').length }; }); };
    const diff = (a, b) => Math.max(Math.abs(a.z - b.z) * 400, Math.abs(a.tx - b.tx), Math.abs(a.ty - b.ty), ...['ren', 'jil'].flatMap(k => a[k].map((x, i) => Math.abs(x - b[k][i]))), Math.abs(a.fx - b.fx) * 40);
    const s0 = await sig(0), s5 = await sig(0.5), s10 = await sig(1.0);
    const m5 = diff(s0, s5), m10 = diff(s0, s10);
    if (m5 < 6) issues.push(`最初の0.5秒で絵が動いていない（動き ${m5.toFixed(1)}px。0.5秒以内に動きを出す）`);
    if (m10 < 30) issues.push(`最初の1秒で絵がほとんど動かない（動き ${m10.toFixed(0)}px）`);
    const hk = await p.evaluate(() => { const h = document.getElementById('hook'); if (!window.PACE.hook) return null; window.setOut(0.5);
      const sp = h.firstChild, sm = h.querySelector('small'); const rg = document.createRange(); rg.selectNodeContents(sp); const r = rg.getBoundingClientRect(), all = h.getBoundingClientRect(), sr = sm && sm.getBoundingClientRect();
      return { op: parseFloat(getComputedStyle(h).opacity), en: parseFloat(sp.style.fontSize), w: r.width, top: all.top, bottom: all.bottom, ja: sm ? parseFloat(sm.style.fontSize) : 0 }; });
    if (!hk) issues.push('冒頭の英語の一言がない（pace.js に hook を入れる）');
    else {
      if (hk.op < 0.9) issues.push(`冒頭の一言が0.5秒の時点で見えていない（opacity ${hk.op.toFixed(2)}）`);
      if (hk.en < 90 || hk.w < 1080 * 0.6) issues.push(`冒頭の英語が小さい（${Math.round(hk.en)}px・幅${Math.round(hk.w)}px。90px以上・幅の60%以上に）`);
      if (hk.top < 280 || hk.bottom > 1640 || hk.w > 1040) issues.push(`冒頭の一言が安全域をはみ出す（上${Math.round(hk.top)}・下${Math.round(hk.bottom)}・幅${Math.round(hk.w)}）`);
    }
  }
  const capSet = new Set(), cutT = {}, sizeSum = {}, sizeN = {};
  let prevHash = null, stillSince = 0, noFace = 0, prevFaces = {}, prevTx = 0, prevTy = 0, prevZ = 1; const occl = {}, prevD = {};
  // 瞬間カット禁止（24fpsで確認）：1フレームで倍率が35%以上、または中心が画面幅の30%以上跳んだらNG。0.4秒のカメラ移動は通る
  {
    let pz = null, ptx = 0, pty = 0;
    for (let i = 0; i < Math.round(dur * 24); i++) {
      const tt = i / 24; await p.evaluate(t => window.setOut(t), tt);
      const c = await p.evaluate(() => { const m = getComputedStyle(document.getElementById('world')).transform; const v = m && m !== 'none' ? m.split('(')[1].split(')')[0].split(',').map(Number) : [1, 0, 0, 1, 0, 0]; return { z: v[0], tx: v[4], ty: v[5], end: parseFloat(getComputedStyle(document.getElementById('end')).opacity) }; });
      if (pz !== null && c.end < 0.5 && (Math.abs(c.z - pz) / pz > 0.35 || Math.abs(c.tx - ptx) > 0.3 * W || Math.abs(c.ty - pty) > 0.3 * H)) issues.push(`画面が急に切り替わる t=${tt.toFixed(2)}（z ${pz.toFixed(2)}→${c.z.toFixed(2)}）`);
      pz = c.z; ptx = c.tx; pty = c.ty;
    }
  }
  const sheet = [];
  for (let t = 0; t < dur; t += STEP) {
    await p.evaluate(t => window.setOut(t), t);
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
      // 暗い幕（#dim）が画面の四隅・四辺の中央すべてにかかっているか（依頼 #90：左端だけ暗くならない不具合の再発防止）
      let dimGap = null;
      if (parseFloat(getComputedStyle(document.getElementById('dim')).opacity) > 0.05) {
        // #dim は pointer-events:none なので当たり判定は使えない。外接矩形が画面全体（0〜W, 0〜H）を含むかで見る
        const d = document.getElementById('dim').getBoundingClientRect(), g = [];
        if (d.left > 0.5) g.push('左'); if (d.right < W - 0.5) g.push('右'); if (d.top > 0.5) g.push('上'); if (d.bottom < H - 0.5) g.push('下');
        dimGap = g;
      }
      // 総見直し（2026-11-10）：体の外接矩形と、出ている字幕（CHIP：幅940の帯）の文字
      const bodies = { ren: box('ren'), jil: box('jil') };
      const caps = [...document.querySelectorAll('#ui rect[width="940"]')].map(r => (r.parentNode.textContent || '').trim()).filter(Boolean);
      return { bodies, caps, dimGap, faces, z, tx, ty, fx: document.querySelectorAll('#fx > *').length, end: parseFloat(getComputedStyle(document.getElementById('end')).opacity), dim: parseFloat(getComputedStyle(document.getElementById('dim')).opacity) };
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
    if (r.dimGap && r.dimGap.length) issues.push(`暗い幕が画面の端まで届いていない（${r.dimGap.join('・')}）t=${t.toFixed(2)}`);
    if (r.z < 0.9 || r.z > 4.2) issues.push(`カメラ倍率が範囲外 t=${t.toFixed(2)} z=${r.z.toFixed(2)}`);
    // 止まり検出：縮小スクショのハッシュ比較
    const buf = await p.screenshot({ type: 'jpeg', quality: 40, clip: { x: 0, y: 0, width: W, height: H }, scale: 'css' });
    const hash = require('crypto').createHash('md5').update(buf).digest('hex');
    { // 総見直し（2026-11-10）の新しい見張り：まずは「知らせる」（警告）。在庫の回を直し終えたら不合格に上げる
      for (const c of r.caps || []) if (r.end < 0.5) capSet.add(c.slice(0, 40));
      for (const id of ['ren', 'jil']) { const b = r.bodies && r.bodies[id]; if (!b || r.end >= 0.5) continue; const w = b[2] - b[0], h = b[3] - b[1]; if (w < 5 || h < 5) continue;
        const vis = Math.max(0, Math.min(b[2], W) - Math.max(b[0], 0)) * Math.max(0, Math.min(b[3], H) - Math.max(b[1], 0)) / (w * h);
        if (vis < 0.6 && r.z < 1.6) cutT[id] = (cutT[id] || 0) + STEP; // 寄り（z≥1.6）は演出として除く
        if (vis > 0.95) sizeSum[id] = (sizeSum[id] || 0) + h / H, sizeN[id] = (sizeN[id] || 0) + 1; }
    }
    if (hash === prevHash) { stillSince += STEP; if (stillSince >= 1.5 && Math.abs(stillSince - 1.5) < 1e-6 && r.end < 0.5) warns.push(`1.5秒以上止まっている t=${(t - stillSince).toFixed(2)}〜（オチ前の間は0.7秒まで）`); if (stillSince >= 2.5 && Math.abs(stillSince - 2.5) < 1e-6 && r.end < 0.5) issues.push(`2.5秒以上動きなし t=${(t - stillSince).toFixed(2)}〜`); }
    else stillSince = 0;
    prevHash = hash;
    // 白飛び／黒つぶれ：ごく小さいJPEGは単色
    if (buf.length < 6000 && r.end < 0.5 && r.dim < 0.9) issues.push(`単色フレーム t=${t.toFixed(2)}`);
    // 残骸：エンドカード直前
    if (t >= dur - 1.2 && t < dur - 1.1 && r.fx > 3) warns.push(`エンドカード直前にfx要素が${r.fx}個残っている`);
    if (Math.abs((t / dur) * 12 - Math.round((t / dur) * 12)) < STEP / dur * 6 && sheet.length < 12) sheet.push({ t, buf: await p.screenshot({ type: 'jpeg', quality: 70 }) });
  }
  // エンドカードが出ること
  await p.evaluate(t => window.setOut(t), dur - 0.05);
  const endOp = await p.evaluate(() => parseFloat(getComputedStyle(document.getElementById('end')).opacity));
  if (endOp < 0.9) issues.push(`エンドカードが出ていない（opacity ${endOp}）`);
  { const cut = await p.evaluate(() => window.__LIMBCUT || 0); if (cut > 0) issues.push(`腕を長く伸ばす所がある（必要な長さ ${Math.round(cut)}px）：レンとジルには腕がない。持ち物は体のすぐ前に置き、前足だけで持つ`); }
  if (capSet.size > 2) warns.push(`字幕が${capSet.size}種類（決まりは2回まで。オチは絵で見せる）：${[...capSet].map(x => x.split(/\s+/)[0]).join('／')}`);
  for (const id of ['ren', 'jil']) { if ((cutT[id] || 0) >= 1) warns.push(`${id === 'ren' ? 'レン' : 'ジル'}の体が画面から4割以上切れている時間が${cutT[id].toFixed(1)}秒（寄りの演出を除く）`);
    if (sizeN[id] >= 8 && sizeSum[id] / sizeN[id] < 0.2) warns.push(`${id === 'ren' ? 'レン' : 'ジル'}が小さい（画面の高さの平均${Math.round(100 * sizeSum[id] / sizeN[id])}%。35%以上が目安）`); }
  await b.close();
  if (errors.length) issues.push(...[...new Set(errors)].slice(0, 5));
  // コンタクトシート（4x3）
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'qa-')); sheet.forEach((s, i) => fs.writeFileSync(`${tmp}/s${String(i).padStart(2, '0')}.jpg`, s.buf));
  require('child_process').execSync(`ffmpeg -y -loglevel error -pattern_type glob -i '${tmp}/s*.jpg' -filter_complex "scale=270:480,tile=4x3" "${sheetPath}"`);
  const report = { ep, dur, pass: issues.length === 0, issues: [...new Set(issues)], warns: [...new Set(warns)] };
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report)); process.exit(report.pass ? 0 : 2);
})();
