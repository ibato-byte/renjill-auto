// 「福引き」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：年末の福引き（ガラガラ）。ジルが回す → 白い玉 → ティッシュ1個（にこ）
// ひっくり返し：課長が勢いよく回す → 金の玉！ → 「牧草1年分」
// オチ：上から牧草の山がどさっ → 課長は山にうもれてご満悦。ジルはティッシュを持ってジト目。字幕「ジル：ティッシュ」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
// ガラガラ（中心 x,y・回転 a）
const DRUM = (x, y, a) => { const P = Array.from({ length: 8 }, (_, i) => { const t = a + i * Math.PI / 4; return [x + Math.cos(t) * 110, y + Math.sin(t) * 110]; });
  return `<g><path d="M${x - 120} ${y + 170} L${x - 70} ${y} M${x + 120} ${y + 170} L${x + 70} ${y}" stroke="#8C5A3C" stroke-width="16" stroke-linecap="round"/>`
    + `<path d="M${P.map(p => p.join(' ')).join(' L')} Z" fill="#C9483C" stroke="#8E2E26" stroke-width="7"/>`
    + `<path d="M${P.map(p => [x + (p[0] - x) * .6, y + (p[1] - y) * .6].join(' ')).join(' L')} Z" fill="none" stroke="#E87A6E" stroke-width="5" opacity=".7"/>`
    + `<circle cx="${x}" cy="${y}" r="16" fill="#F2C230"/><line x1="${x}" y1="${y}" x2="${x + Math.cos(a) * 150}" y2="${y + Math.sin(a) * 150}" stroke="#8C5A3C" stroke-width="12" stroke-linecap="round"/><circle cx="${x + Math.cos(a) * 150}" cy="${y + Math.sin(a) * 150}" r="16" fill="#E9D2A8" stroke="#8C5A3C" stroke-width="5"/></g>`; };
// 牧草の山（底の中心 x,y・大きさ s）
const HAYMT = (x, y, s) => { if (s <= 0) return ''; let g = `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-300 0 C-280 -150 -150 -300 0 -310 C150 -300 280 -150 300 0 Z" fill="#C9C46A" stroke="#9AA04A" stroke-width="6"/>`;
  for (let i = 0; i < 30; i++) { const u = (i * 37 % 100) / 100, v = (i * 61 % 100) / 100, px = -250 + u * 500, py = -20 - v * 260 * (1 - Math.abs(u - .5) * 1.4); g += `<path d="M${px} ${py} q${20 + (i % 3) * 10} ${-12} ${46} ${-4 - (i % 4) * 6}" stroke="${i % 2 ? '#A8B84E' : '#E0D58A'}" stroke-width="7" fill="none" stroke-linecap="round"/>`; }
  return g + '</g>'; };
var EP = {
  dur: 9.5,
  bgmHolds: '4.0-4.6',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.0, type: 'swish' }, { t: 1.6, type: 'swish' }, { t: 2.2, type: 'pon' }, { t: 2.8, type: 'swish' }, { t: 3.1, type: 'swish' }, { t: 3.4, type: 'swish' }, { t: 3.7, type: 'swish' },
    { t: 4.0, type: 'chime' }, { t: 4.3, type: 'chime' }, { t: 5.4, type: 'thump' }, { t: 6.2, type: 'boing' }, { t: 7.2, type: 'blink' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400, DX = 520, DY = DESK - 200;
    const bg = L.office({ sky: 'day', clock: [11, 0] });
    // 回転：ジル 1.0〜2.1 ゆっくり、課長 2.7〜3.9 高速
    const a = t < 1.0 ? 0 : t < 2.1 ? (t - 1.0) * 5 : t < 2.7 ? 5.5 : t < 3.9 ? 5.5 + (t - 2.7) * 22 : 5.5 + 26.4;
    const bury = outBack(seg(t, 5.2, 5.7));
    // ジル（左）：回す（lean）→ 白い玉・ティッシュ（にこ）→ 金の玉に「！」→ 牧草の山を見てジト目
    const jturn = t >= 1.0 && t < 2.1;
    const jface = t < 2.2 ? RIG.FACES.sharp : t < 4.0 ? RIG.FACES.smile : t < 5.6 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : RIG.FACES.annoyed;
    L.char('jil', Object.assign({}, jturn ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 20, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: .8, bodyTilt: jturn ? -10 : 0 }), t, '', {});
    // レン（右）：わくわく → 高速で回す（lean）→ 金の玉で目がきらっ → 牧草にうもれてご満悦
    const rturn = t >= 2.7 && t < 3.9;
    const rface = t < 2.6 ? Object.assign({}, RIG.FACES.smile, { sparkle: t > 2.2 ? 1 : 0 }) : t < 4.0 ? RIG.FACES.sharp : t < 5.2 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : Object.assign({}, RIG.FACES.smile, { sparkle: t < 6.6 ? 1 : 0, heart: t >= 6.6 ? 1 : 0 });
    L.char('ren', Object.assign({}, rturn ? RIG.POSES.lean : RIG.POSES.sit, rface, { x: 560, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: -.4, bodyTilt: rturn ? -12 + Math.sin(t * 30) * 3 : 0 }), t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // 受け皿
    fx += `<rect x="${DX - 70}" y="${DESK - 34}" width="140" height="30" rx="10" fill="#E9D2A8" stroke="#C9A06A" stroke-width="4"/>`;
    if (t < 5.2) fx += DRUM(DX, DY, a);
    if (rturn) fx += L.speed(DX, DY, .25, 24);
    // 白い玉（2.1）→ ティッシュ（ジルの手元）
    if (t >= 2.1 && t < 2.6) { const k = seg(t, 2.1, 2.4); fx += `<circle cx="${DX - 40 * k}" cy="${DY + 100 + 80 * k}" r="18" fill="#FFFFFF" stroke="#CFC6B8" stroke-width="4"/>`; }
    if (t >= 2.4) fx += `<g transform="translate(330 ${DESK - 40}) scale(${outBack(seg(t, 2.4, 2.7))}) rotate(-6)"><rect x="-56" y="-36" width="112" height="72" rx="10" fill="#FFFDF7" stroke="#D7CCBB" stroke-width="4"/><path d="M-20 -36 C-10 -64 18 -62 14 -38 Z" fill="#fff" stroke="#E3D9C8" stroke-width="3"/><g fill="#9BC7E8"><circle cx="-26" cy="6" r="8"/><circle cx="20" cy="12" r="8"/></g></g>`;
    // 金の玉（3.9）
    if (t >= 3.9 && t < 5.4) { const k = seg(t, 3.9, 4.2); fx += `<circle cx="${DX + 30 * k}" cy="${DY + 100 + 80 * k}" r="22" fill="#F2C230" stroke="#C9A24A" stroke-width="5"/>` + (t > 4.0 && t < 5.0 ? L.sparkles(DX + 30, DY + 180, t, 1.2, 10) : ''); }
    // 牧草1年分（どさっ）
    if (t >= 5.2) fx += `<g transform="translate(0 ${-(1 - seg(t, 5.2, 5.45)) * 900})">${HAYMT(820, DESK + 6, .72 * bury)}</g>`;
    if (t > 5.4 && t < 5.8) fx += L.impact(800, DESK - 60, seg(t, 5.4, 5.8), 1.0, '#C9C46A');
    if (t > 7.0 && t < 8.6) fx += L.emark(180, DESK - 650, 1.0, '…');
    let ui = (t > 0.6 && t < 2.6 ? CHIP(L, 'YEAR-END LUCKY DRAW', '年末の福引き', 1640, seg(t, .6, .9)) : '')
      + (t > 4.2 && t < 5.4 ? CHIP_OFF(L, 'GOLD: 1 YEAR OF HAY', '金の玉：牧草1年分', 1640, seg(t, 4.2, 4.5)) : '')
      + (t > 6.6 && t < 8.6 ? CHIP_OFF(L, 'JILL: TISSUES', 'ジル：ティッシュ', 1640, seg(t, 6.6, 6.9)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 460, cy: 1150 },
      { t: 0.01, z: 1.0, cx: 520, cy: 1180, d: .9 },
      { t: 3.9, z: 1.4, cx: 540, cy: 1300, d: .3 },                 // 金の玉
      { t: 5.0, z: .95, cx: 560, cy: 1150, d: .4 },                 // 牧草の山
      { t: 6.6, z: 1.05, cx: 540, cy: 1180, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 5.4 && t < 5.7 ? 8 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
