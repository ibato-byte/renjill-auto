// 「エアコン戦争」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：壁のエアコンの表示は 26。レンがリモコンで 18 に下げる（寒い！ジルがマフラー）→ ジルが 28 に上げる（暑い！レンが汗）→ 18 → 28 …
// ひっくり返し：二人が同時にボタンを押して、表示が「－－」（壊れた／止まった）→ オチ：二人そろって窓を開ける。字幕「決着：窓」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 総見直し（2026-11-10）：字幕は2回まで。3回目以降（オチの説明）は出さず、絵で見せる
// 壁のエアコン：表示（数字か「--」）、風の色（冷＝青／暖＝赤）
const AC = (x, y, txt, col, k) => `<g transform="translate(${x} ${y})"><rect x="-230" y="-70" width="460" height="140" rx="30" fill="#F7F4EE" stroke="#D7CFC2" stroke-width="6"/><rect x="-200" y="40" width="400" height="14" rx="7" fill="#C9C2B6"/><rect x="60" y="-40" width="140" height="70" rx="12" fill="#2B2F38"/><text x="130" y="12" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="52" fill="${col}">${txt}</text>${k > 0 ? [0, 1, 2].map(i => `<path d="M${-170 + i * 120} 70 q30 ${60 + i * 10} 0 ${150}" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round" opacity="${(.6 * k).toFixed(2)}"/>`).join('') : ''}</g>`;
const REMOTE = (x, y, rot, s = 1) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><rect x="-32" y="-90" width="64" height="180" rx="14" fill="#F2F2F2" stroke="#B9B2A6" stroke-width="5"/><rect x="-20" y="-72" width="40" height="28" rx="5" fill="#2B2F38"/><circle cx="0" cy="-16" r="11" fill="#E8473A"/><circle cx="0" cy="20" r="11" fill="#4A90D9"/><rect x="-18" y="46" width="36" height="10" rx="5" fill="#CFC8BC"/></g>`;
const SCARF = (x, y) => `<g transform="translate(${x} ${y})"><path d="M-110 0 q110 70 220 0 l0 40 q-110 70 -220 0 Z" fill="#E86C5A"/><path d="M60 30 l30 120 l40 -10 l-20 -120 Z" fill="#E86C5A"/></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '5.6-6.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.6, type: 'click' }, { t: 1.9, type: 'whoosh' }, { t: 2.8, type: 'twitch' }, { t: 3.2, type: 'click' }, { t: 3.5, type: 'whoosh' }, { t: 4.3, type: 'twitch' }, { t: 4.7, type: 'click' }, { t: 5.2, type: 'click' },
    { t: 5.6, type: 'click' }, { t: 5.65, type: 'click' }, { t: 5.8, type: 'thump' }, { t: 6.4, type: 'blink' }, { t: 7.2, type: 'swish' }, { t: 7.6, type: 'pon' }, { t: 8.1, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [14, 30] });
    // 表示の流れ：26 → 1.6 レンが 18 → 3.2 ジルが 28 → 4.7 レン 18 → 5.2 ジル 28 → 5.6 同時押し「--」
    const stage = t < 1.6 ? 0 : t < 3.2 ? 1 : t < 4.7 ? 2 : t < 5.2 ? 3 : t < 5.6 ? 4 : 5;
    const txt = ['26', '18', '28', '18', '28', '--'][stage], col = stage === 0 ? '#5DBB63' : stage === 5 ? '#B8B2A8' : (stage % 2 ? '#4A90D9' : '#E8473A');
    const windK = stage === 0 || stage === 5 ? 0 : 1;
    const openWin = t >= 7.2;                                 // 二人で窓を開ける
    // ジル（左）：寒い（マフラー・震え）→ リモコンで上げる → 暑い顔のレンを見る → 窓へ
    const jcold = stage === 1 || stage === 3;
    const jface = stage === 5 ? (t < 6.4 ? RIG.FACES.surprised : RIG.FACES.annoyed) : jcold ? Object.assign({}, RIG.FACES.annoyed, { sweat: 0 }) : RIG.FACES.sharp;
    const jp = Object.assign({}, openWin ? RIG.POSES.stand : RIG.POSES.sit, jface, { x: 60 + (openWin ? 60 * ease(seg(t, 7.2, 7.8)) : 0), y: DESK - 413 * 1.3, scale: 1.3, eyeLook: .5, bodyTilt: jcold ? Math.sin(t * 40) * 3 : 0, headTilt: openWin ? -6 : 0 });
    L.char('jil', jp, t, '', {});
    // レン（右）：暑い（汗）→ リモコンで下げる → 「--」にきょとん → 窓へ
    const rhot = stage === 0 || stage === 2 || stage === 4;
    const rface = stage === 5 ? (t < 6.4 ? RIG.FACES.surprised : RIG.FACES.oops) : rhot ? Object.assign({}, RIG.FACES.oops, { sweat: 1, mouth: 'w', browAngle: 4 }) : RIG.FACES.smile;
    const rp = Object.assign({}, openWin ? RIG.POSES.stand : RIG.POSES.sit, rface, { x: 560 - (openWin ? 60 * ease(seg(t, 7.2, 7.8)) : 0), y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: .4, headNod: rhot && !openWin ? 6 : 0 });
    L.char('ren', rp, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // 手前のリモコン：押す側の前に出る（1.6 レン、3.2 ジル、4.7 レン、5.2 ジル、5.6 両方）
    const press = (at, x) => (t > at && t < at + .5) ? REMOTE(x, DESK - 180 - Math.sin(seg(t, at, at + .5) * Math.PI) * 60, x < 540 ? -20 : 20, 1.0) : '';
    fx += press(1.6, 760) + press(3.2, 320) + press(4.7, 760) + press(5.2, 320);
    if (t > 5.6 && t < 6.6) fx += REMOTE(320, DESK - 200, -20) + REMOTE(760, DESK - 200, 20);
    // ぶつかった印（同時押し）と「？」
    if (t > 5.6 && t < 6.0) fx += L.impact(540, DESK - 720, seg(t, 5.6, 6.0), 1.0, '#E8473A');
    if (t > 6.2 && t < 7.2) { fx += L.qmark(230, DESK - 660, 1.0); fx += L.qmark(900, DESK - 660, 1.0); }
    // 寒い印（青の線）・暑い印（赤い揺らぎ）
    if (jcold) fx += `<g stroke="#4A90D9" stroke-width="8" stroke-linecap="round" opacity=".8">${[0, 1, 2].map(i => `<line x1="${150 + i * 40}" y1="${DESK - 700 + (i % 2) * 20}" x2="${150 + i * 40}" y2="${DESK - 760 + (i % 2) * 20}"/>`).join('')}</g>`;
    if (rhot && stage !== 0) fx += `<g stroke="#E8473A" stroke-width="8" stroke-linecap="round" fill="none" opacity=".8">${[0, 1, 2].map(i => `<path d="M${860 + i * 40} ${DESK - 700} q14 -20 0 -40 q-14 -20 0 -40" transform="translate(0 ${Math.sin(t * 8 + i) * 6})"/>`).join('')}</g>`;
    // 窓を開ける：外の風（緑の葉）と光
    if (openWin) { const k = seg(t, 7.2, 7.8); fx += `<g opacity="${k}"><rect x="690" y="218" width="320" height="420" fill="#DFF3FF" opacity=".6"/>${[0, 1, 2, 3].map(i => `<ellipse cx="${840 - i * 160 - ((t * 120 + i * 90) % 700)}" cy="${420 + Math.sin(t * 3 + i) * 40 + i * 60}" rx="18" ry="9" fill="#7FB37A" transform="rotate(${-20 + i * 15})"/>`).join('')}</g>`; fx += L.sparkles(850, 420, t, .9, 5); }
    // 背景の上にエアコン（壁の高いところ）
    fx = AC(540, 660, txt, col, windK) + fx;
    let ui = (t > 1.8 && t < 3.2 ? CHIP(L, 'A/C: 26 → 18', '上司がリモコンで18度に', 1380, seg(t, 1.8, 2.1)) : '')
      + (t > 3.4 && t < 4.6 ? CHIP(L, '→ 28', 'ジルが28度に戻す', 1380, seg(t, 3.4, 3.7)) : '')
      + (t > 6.4 && t < 7.2 ? CHIP_OFF(L, 'A/C: --', '同時押しで、止まった', 1380, seg(t, 6.4, 6.7)) : '')
      + (t > 7.6 && t < 8.6 ? CHIP_OFF(L, 'SOLVED: WINDOW', '決着：窓を開ける', 1380, seg(t, 7.6, 7.9)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 540, cy: 800 },
      { t: 0.01, z: 1.0, cx: 540, cy: 1000, d: .9 },
      { t: 1.5, z: 1.25, cx: 700, cy: 1050, d: .4 },                // レンのリモコン
      { t: 3.1, z: 1.25, cx: 380, cy: 1050, d: .4 },                // ジルのリモコン
      { t: 4.6, z: 1.0, cx: 540, cy: 980, d: .4 },
      { t: 5.5, z: 1.15, cx: 540, cy: 900, d: .3 },                 // 「--」
      { t: 7.0, z: 1.0, cx: 540, cy: 980, d: .6 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 5.6 && t < 5.75 ? 6 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
