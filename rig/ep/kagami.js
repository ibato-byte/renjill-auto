// 「鏡もち」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：年末。ジルが机に小さな鏡もち（飾り）を置く（にこ）
// ひっくり返し：課長も作る → 牧草の丸い束を2段重ね＋上ににんじんの葉 → 「上司の鏡もち：牧草製」
// オチ：少し目を離すと、下の段から食べている → 上の段が傾いて落ちる。字幕「飾る前に、食べはじめ」
// （うさぎにおもちは食べさせない。もちは飾りだけ、課長が食べるのは牧草）
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
// ジルの鏡もち（飾り）：台＋白いもち2段＋だいだい（オレンジの丸）
const MOCHI = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-80 0 L80 0 L64 -40 L-64 -40 Z" fill="#E9D2A8" stroke="#C9A06A" stroke-width="4"/><rect x="-74" y="-48" width="148" height="12" rx="4" fill="#FFFDF7" stroke="#E3D6C6" stroke-width="3"/>`
  + `<ellipse cx="0" cy="-74" rx="66" ry="30" fill="#FFFDF7" stroke="#E3D6C6" stroke-width="4"/><ellipse cx="0" cy="-110" rx="48" ry="24" fill="#FFFDF7" stroke="#E3D6C6" stroke-width="4"/><circle cx="0" cy="-140" r="20" fill="#F29A3A"/><path d="M0 -158 l10 -10" stroke="#5E9E4A" stroke-width="5" stroke-linecap="round"/></g>`;
// 牧草の丸い束（中心 x,y・半径 r・かじられた量 bite 0〜1）
const BALE = (x, y, rx, ry, bite) => { let s = `<g><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#C9C46A" stroke="#9AA04A" stroke-width="5"/>`;
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; s += `<path d="M${x + Math.cos(a) * rx * .3} ${y + Math.sin(a) * ry * .3} q${Math.cos(a + .6) * rx * .3} ${Math.sin(a + .6) * ry * .3} ${Math.cos(a) * rx * .9} ${Math.sin(a) * ry * .85}" stroke="${i % 2 ? '#A8B84E' : '#E0D58A'}" stroke-width="5" fill="none" stroke-linecap="round"/>`; }
  if (bite > 0) s += `<path d="M${x + rx * (1.05 - bite * .9)} ${y - ry * .7} q${-rx * .25 * bite} ${ry * .7} 0 ${ry * 1.4} L${x + rx + 20} ${y + ry} L${x + rx + 20} ${y - ry} Z" fill="#E8DCC8"/>`;   // 右側からかじられる（背景の色でけずる）
  return s + '</g>'; };
var EP = {
  dur: 9.5,
  bgmHolds: '5.4-6.0',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.9, type: 'pon' }, { t: 1.4, type: 'chime' }, { t: 2.3, type: 'thump' }, { t: 2.8, type: 'thump' }, { t: 3.2, type: 'pon' }, { t: 3.6, type: 'chime' },
    { t: 4.6, type: 'tap' }, { t: 5.0, type: 'tap' }, { t: 5.4, type: 'tap' }, { t: 6.1, type: 'boing' }, { t: 6.6, type: 'thump' }, { t: 7.2, type: 'blink' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400, BX = 600;                        // 課長の鏡もちの場所（二人の間）
    const bg = L.office({ sky: 'day', clock: [16, 0] });
    const bite = seg(t, 4.4, 6.0);                      // 下の段をかじる
    const fall = ease(seg(t, 6.0, 6.6));                // 上の段が落ちる
    const munch = t >= 4.4 && t < 6.0;
    // ジル（左）：飾る（lean）→ 満足 → 課長の牧草の鏡もちに「…」→ 書類を見る（目を離す）→ 落ちる音で顔を上げる → ジト目
    const away = t >= 4.2 && t < 6.0;
    const jface = t < 2.2 ? RIG.FACES.smile : t < 4.2 ? RIG.FACES.think : away ? RIG.FACES.sharp : t < 7.0 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : RIG.FACES.annoyed;
    const jlean = t > .7 && t < 1.3;
    L.char('jil', Object.assign({}, jlean ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 0, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: away ? 0 : .8, headNod: away ? 14 : 0, bodyTilt: jlean ? -10 : 0 }), t, '', {});
    // レン（右）：牧草を積む（lean・得意げ）→ 見つめる（目がきらっ）→ 下の段をかじる（lean・もぐもぐ）→ 落ちて固まる → ご満悦
    const build = t >= 2.0 && t < 3.3;
    const rface = t < 2.0 ? RIG.FACES.smile : t < 3.6 ? RIG.FACES.smug : t < 4.4 ? Object.assign({}, RIG.FACES.smile, { sparkle: 1 }) : munch ? RIG.FACES.smile : t < 7.0 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : RIG.FACES.smug;
    L.char('ren', Object.assign({}, build || munch ? RIG.POSES.lean : RIG.POSES.sit, rface, { x: 600, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: -.5, bodyTilt: build || munch ? -12 : 0, headNod: munch ? Math.abs(Math.sin(t * 16)) * 10 : 0 }), t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // ジルの鏡もち（飾り）
    if (t >= .9) fx += MOCHI(400, DESK + 4, outBack(seg(t, .9, 1.2)) * .75);
    // 課長の鏡もち（牧草）：下の段 2.3、上の段 2.8、にんじんの葉 3.2
    if (t >= 2.3) fx += `<g transform="translate(0 ${-(1 - outBack(seg(t, 2.3, 2.6))) * 60})">${BALE(BX - 40 * bite, DESK - 70 + 14 * bite, 120 * (1 - .4 * bite), 70 * (1 - .2 * bite), 0)}</g>`;
    if (t >= 2.8) { const tilt = fall * 70, dx = fall * 120, dy = fall * 110;
      fx += `<g transform="translate(${dx} ${dy - (1 - outBack(seg(t, 2.8, 3.1))) * 80}) rotate(${tilt} ${BX} ${DESK - 175})">${BALE(BX, DESK - 175, 90, 50, 0)}`
        + (t >= 3.2 ? `<g transform="translate(${BX} ${DESK - 225}) scale(${outBack(seg(t, 3.2, 3.5))})">${[-1, 0, 1].map(k => `<path d="M0 0 C${k * 14} -30 ${k * 30} -50 ${k * 40} -70" stroke="#5E9E4A" stroke-width="8" fill="none" stroke-linecap="round"/>`).join('')}</g>` : '') + `</g>`; }
    if (t > 3.6 && t < 4.3) fx += L.sparkles(BX, DESK - 200, t, 1.0, 6);
    if (munch) fx += L.munch(760, DESK - 140, t, .8);
    if (t > 6.5 && t < 6.9) fx += L.impact(BX + 130, DESK - 30, seg(t, 6.5, 6.9), .7, '#C9C46A');
    if (t > 7.2 && t < 8.6) fx += L.emark(200, DESK - 650, 1.0, '…');
    let ui = (t > 1.0 && t < 2.3 ? CHIP(L, 'KAGAMI MOCHI', '年末の鏡もち', 1640, seg(t, 1.0, 1.3)) : '')
      + (t > 3.3 && t < 4.6 ? CHIP(L, "BOSS'S: MADE OF HAY", '上司の鏡もち：牧草製', 1640, seg(t, 3.3, 3.6)) : '')
      + (t > 6.8 && t < 8.6 ? CHIP(L, 'EATEN BEFORE NEW YEAR', '飾る前に、食べはじめ', 1640, seg(t, 6.8, 7.1)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 320, cy: 1200 },
      { t: 0.01, z: 1.05, cx: 520, cy: 1200, d: .9 },
      { t: 2.1, z: 1.3, cx: 600, cy: 1220, d: .5 },                 // 牧草を積む
      { t: 4.2, z: 1.15, cx: 640, cy: 1220, d: .5 },                // かじる
      { t: 6.0, z: 1.05, cx: 520, cy: 1200, d: .4 },                // 落ちる
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 6.5 && t < 6.7 ? 5 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
