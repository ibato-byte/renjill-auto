// チモシーダッシュ（ゲーム）のアプリのアイコンを書き出す。使い方: node rig/icon3.js <renjill-game の app フォルダ>
// 2 倍の細かさで描いてから縮める（毛並み・ひげがなめらか）。A＝ふつうのアイコン（512・192・iPhone 用 180）、M＝マスク用 512、F＝ブラウザのタブ用 64（モチの顔を大きく）
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/npm-tools/node_modules/playwright')); }
(async () => { const out = process.argv[2]; if (!out || !fs.existsSync(out)) { console.error('出力先のフォルダを指定してください'); process.exit(2); }
  const b = await chromium.launch(process.env.PW_EXEC ? { executablePath: process.env.PW_EXEC } : {}); const p = await b.newPage({ viewport: { width: 1024, height: 1200 }, deviceScaleFactor: 2 });
  await p.goto('file://' + path.join(__dirname, 'icon3.html')); await p.waitForTimeout(600); const tmp = fs.mkdtempSync('/tmp/icon3-');
  for (const id of ['A', 'M', 'F']) await (await p.$('#' + id)).screenshot({ path: `${tmp}/${id}.png` }); await b.close();
  const mk = (src, size, name) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${tmp}/${src}.png`, '-vf', `scale=${size}:${size}:flags=lanczos,format=rgb24`, path.join(out, name)]);
  mk('A', 512, 'icon-512.png'); mk('A', 192, 'icon-192.png'); mk('A', 180, 'apple-touch-icon.png'); mk('M', 512, 'maskable-512.png'); mk('F', 64, 'favicon.png');
  console.log('icons →', out); })();
