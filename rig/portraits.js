// アニメの絵（rig）そのもので、キャラクターの絵（透明の PNG）を書き出す。公式サイト・ゲームの「正面の絵」は、これを元にする（2026-11-15 オーナー：ゲームとアニメの絵を完全に同じに。アニメが正）。usage: node rig/portraits.js <出力フォルダ>
const { chromium } = require('playwright'); const fs = require('fs'); const out = process.argv[2];
(async () => { const b = await chromium.launch(process.env.PW_EXEC ? { executablePath: process.env.PW_EXEC } : {}); const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await p.goto('file://' + __dirname + '/ep.html?ep=pom_debut'); await p.waitForTimeout(800);
  await p.evaluate(() => { document.documentElement.style.background = 'transparent'; document.body.style.background = 'transparent'; for (const id of ['bg', 'back', 'fx', 'ui', 'ren', 'jil']) document.getElementById(id).innerHTML = ''; for (const id of ['dim', 'hook', 'end']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } document.getElementById('world').style.transform = 'none'; });
  const shots = { ren: { open: 'neutral', blink: 'B', happy: 'smile' }, jil: { open: 'neutral', blink: 'B', happy: 'smile' }, pom: { open: { eye: 'round' }, blink: { eye: 'happy', blush: 0 }, happy: { eye: 'happy', blush: 1, cheek: .0 }, puff: { eye: 'happy', cheek: 1, blush: 1 } } };
  for (const who of ['ren', 'jil', 'pom']) for (const m of Object.keys(shots[who])) {
    await p.evaluate(([who, m, f]) => { for (const id of ['ren', 'jil', 'fx']) document.getElementById(id).innerHTML = '';
      if (who === 'pom') { const s = document.getElementById('fx'); s.appendChild(pomDefs()); s.appendChild(pomShape(540, 1250, 2.4, Object.assign({ paws: 1 }, f))); }
      else { const face = f === 'B' ? Object.assign({}, RIG.FACES.neutral, { eyeOpen: .04, eyeShape: 'flat' }) : RIG.FACES[f]; RIG.render(document.getElementById(who), Object.assign({ char: who }, RIG.POSES.sit, face, { x: who === 'ren' ? 120 : 300, y: 620, scale: 2.2, flip: who === 'ren', sparkle: 0, zzz: 0 })); } }, [who, m, shots[who][m]]);
    await p.waitForTimeout(200); await p.screenshot({ path: `${out}/${who}_${m}.png`, omitBackground: true });
    if (who !== 'pom' && m === 'open') { // 耳だけの絵（公式サイトの動く 3D で、耳だけを動かすための形。2026-11-16：耳の形が分からず、背中まで一緒に動いて髪の毛のように見えた）
      await p.evaluate(who => { const r = document.getElementById(who); const ears = [...r.querySelectorAll('path,ellipse')].filter(e => /ear(In)?\)$/.test(e.getAttribute('fill') || ''));
        r.querySelectorAll('*').forEach(e => e.style.visibility = 'hidden'); for (const e of ears) for (const k of e.parentNode.children) { k.style.visibility = 'visible'; k.style.opacity = 1; } }, who);
      await p.waitForTimeout(150); await p.screenshot({ path: `${out}/${who}_ears.png`, omitBackground: true });
      // 頭（耳こみ）だけの絵：3D で頭を回す時、頭と耳をひとかたまりで動かすため（帯で分けると、体の前に垂れた耳がちぎれて見えた。2026-11-16）
      await p.evaluate(who => { const r = document.getElementById(who); const hp = [...r.querySelectorAll('path')].find(e => /head\)$/.test(e.getAttribute('fill') || '')); r.querySelectorAll('*').forEach(e => e.style.visibility = 'hidden');
        let n = hp.parentNode; n.style.visibility = 'visible'; n.querySelectorAll('*').forEach(e => { e.style.visibility = 'visible'; }); }, who);
      await p.waitForTimeout(150); await p.screenshot({ path: `${out}/${who}_headmask.png`, omitBackground: true }); } }
  // 寝る姿勢（のびて寝る）：アニメの「のび」（体が長く低い）に、目を閉じた顔。公式サイトの動く 3D で、レンが居眠りする時に使う（2026-11-17）
  // ふだんの絵と同じ場所・同じ大きさで撮る（サイトの tools/char_from_rig.py が、ふだんの絵と同じ縮尺で切り出す）
  // 体が横に長いので、ふだんより小さく（1.7 倍）・内側で撮る。同じ場所で「ふだんの絵」（flatref）も撮り、サイトの道具はそれに合わせて切る
  for (const who of ['ren', 'jil']) for (const [m, flat] of [['flatref', 0], ['flat', 1], ['bow', 2], ['flop', 3]]) {
    await p.evaluate(([who, flat]) => { for (const id of ['ren', 'jil', 'fx']) document.getElementById(id).innerHTML = '';
      const pose = flat === 3 ? Object.assign({}, RIG.POSES.flop, { zzz: 0 }) : flat === 2 ? Object.assign({}, RIG.POSES.bow, { zzz: 0 }) : flat ? Object.assign({}, RIG.POSES.sploot, RIG.FACES.sleepy, { zzz: 0 }) : Object.assign({}, RIG.POSES.sit, RIG.FACES.neutral);
      RIG.render(document.getElementById(who), Object.assign({ char: who }, pose, { x: who === 'ren' ? 430 : 90, y: 820, scale: 1.7, flip: who === 'ren', sparkle: 0 })); }, [who, flat]);
    await p.waitForTimeout(200); await p.screenshot({ path: `${out}/${who}_${m}.png`, omitBackground: true }); }
  await b.close(); })();
