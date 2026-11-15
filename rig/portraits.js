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
    await p.waitForTimeout(200); await p.screenshot({ path: `${out}/${who}_${m}.png`, omitBackground: true }); }
  await b.close(); })();
