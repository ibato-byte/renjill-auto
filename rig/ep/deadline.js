// 「締め切り前夜」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：22:00、締め切りは明日 9:00（壁の時計＋カレンダーの赤丸）。二人の机に同じ高さの書類の山
// ひっくり返し：時計が回る（22:00→8:59）。ジルの山はどんどん低く（✓の束に）、レンの山は変わらず（寝ている）
// オチ：8:59、ジルが✓の束を出す。レンは1枚目のまま、机の上で寝ている。字幕「ジル：完了。上司：1枚目」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
const PILE = (x, y, n, done) => { let s = ''; for (let i = 0; i < n; i++) s += `<rect x="${x - 110 + Math.sin(i * 12.9) * 6}" y="${y - (i + 1) * 10}" width="220" height="11" rx="3" fill="${i % 2 ? '#fff' : '#F4EFE6'}" stroke="#D7CCBB" stroke-width="2"/>`; if (done > 0) { s += `<rect x="${x - 110}" y="${y - done * 10 - 2}" width="220" height="${done * 10}" rx="4" fill="#E8F5E9" stroke="#5DBB63" stroke-width="3"/>`; s += `<g transform="translate(${x} ${y - done * 10 - 36})"><circle r="26" fill="#5DBB63"/><path d="M-12 0 L-3 10 L14 -10" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>`; } return s; };
var EP = {
  dur: 9.5,
  bgmHolds: '7.0-7.6',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.0, type: 'tap' }, { t: 1.5, type: 'tap' }, { t: 2.0, type: 'tap' }, { t: 2.6, type: 'swish' }, { t: 3.1, type: 'swish' }, { t: 3.6, type: 'swish' }, { t: 4.1, type: 'swish' }, { t: 4.6, type: 'swish' }, { t: 5.1, type: 'swish' }, { t: 5.6, type: 'swish' },
    { t: 6.2, type: 'chime' }, { t: 7.0, type: 'pon' }, { t: 7.6, type: 'blink' }, { t: 8.2, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    // 時計：22:00 → 2.6〜6.2 で回って 8:59（翌朝）
    const k = ease(seg(t, 2.6, 6.2));
    const mins = 22 * 60 + Math.round(k * (11 * 60 - 1));
    const morning = t >= 6.2;
    const bg = L.office({ sky: morning ? 'day' : 'night', clock: [Math.floor(mins / 60) % 24, mins % 60] });
    // 山：ジルは 20 → 0（✓ の束が増える）、レンは 20 のまま
    const jn = Math.round(12 * (1 - k)), jdone = 12 - jn;
    // ジル（左）：黙々と（頭を小さく上下）→ 朝、✓の束をぽん（smug）
    const jface = t < 6.2 ? RIG.FACES.sharp : RIG.FACES.smug;
    const jp = Object.assign({}, RIG.POSES.sit, jface, { x: 40, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: t < 6.2 ? .2 : .8, headNod: t > 1.0 && t < 6.2 ? Math.abs(Math.sin(t * 14)) * 6 : 0, bodyTilt: t > 1.0 && t < 6.2 ? -4 : 0 });
    L.char('jil', jp, t, '', {});
    // レン（右）：1枚目をじっと見る → 2.6 こっくり → 寝る（机に突っ伏す＝loaf＋頭を下げる）→ 7.6 チャイムで飛び起きて、1枚目を見て汗
    const asleep = t >= 2.6 && t < 7.0;
    const rface = t < 2.0 ? RIG.FACES.neutral : t < 2.6 ? Object.assign({}, RIG.FACES.sleepy, { zzz: 0 }) : asleep ? RIG.FACES.sleepy : t < 8.0 ? RIG.FACES.surprised : Object.assign({}, RIG.FACES.oops, { sweat: 1 });
    const rp = Object.assign({}, asleep ? RIG.POSES.loaf : RIG.POSES.sit, rface, { x: 540, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: .5, headNod: asleep ? 28 : t < 2.6 ? 10 : 0, headTilt: asleep ? 12 : 0, bodySquash: t >= 8.0 ? -.15 : 0 });
    L.char('ren', rp, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    fx += PILE(300, DESK - 8, jn, jdone) + PILE(800, DESK - 8, 12, 0);
    // 締め切りの印：壁に「9:00」の赤い札（数字だけ）
    fx = `<g transform="translate(540 640)"><rect x="-130" y="-60" width="260" height="120" rx="16" fill="#fff" stroke="#E8473A" stroke-width="8"/><text y="22" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="64" fill="#E8473A">9:00</text></g>` + fx;
    if (asleep) fx += `<g font-family="Noto Sans CJK JP" font-weight="900" fill="#7C8FC4" opacity=".9">${[0, 1, 2].map(i => { const ph = (t * .5 + i * .33) % 1; return `<text x="${920 + i * 30 + ph * 40}" y="${DESK - 560 - ph * 160}" font-size="${44 + i * 14}" opacity="${(1 - ph).toFixed(2)}">z</text>`; }).join('')}</g>`;
    if (k > 0 && k < 1) fx += L.speed(540, 300, .3, 16);
    if (t > 6.2 && t < 6.8) fx += L.impact(540, 640, seg(t, 6.2, 6.8), 1.0, '#E8473A');
    if (t > 7.0 && t < 7.5) fx += L.impact(300, DESK - 170, seg(t, 7.0, 7.5), .9, '#5DBB63');
    if (t > 7.6 && t < 8.2) fx += L.emark(900, DESK - 700, 1.0);
    let ui = (t > 1.8 && t < 3.4 ? CHIP(L, 'DEADLINE: 9:00 AM', '締め切り前夜、22:00。山は同じ高さ', 1380, seg(t, 1.8, 2.1)) : '')
      + (t > 4.2 && t < 6.0 ? CHIP_OFF(L, '22:00 → 8:59', 'ジルの山は減る。上司の山は、寝ている', 1380, seg(t, 4.2, 4.5)) : '')
      + (t > 7.2 && t < 8.6 ? CHIP_OFF(L, 'JILL: DONE. BOSS: PAGE 1', 'ジル：完了。上司：1枚目', 1380, seg(t, 7.2, 7.5)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 540, cy: 1150 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1100, d: .9 },
      { t: 2.5, z: 1.0, cx: 540, cy: 1000, d: .5 },                 // 時計と山
      { t: 6.1, z: 1.15, cx: 540, cy: 1120, d: .4 },
      { t: 7.0, z: 1.3, cx: 360, cy: 1200, d: .4 },                 // ✓の束
      { t: 7.8, z: 1.2, cx: 640, cy: 1150, d: .5 },                 // 寝起きのレン
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, dim: morning ? 0 : .12, shake: t > 6.2 && t < 6.3 ? 4 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
