// 「サンタ帽」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：クリスマス週。ジルは小さなサンタ帽をちょこんと（にこ）
// ひっくり返し：課長の帽子は特大。かぶったら全身が赤い三角に → よちよち歩いてジルにごつん
// オチ：ジルが帽子を持ち上げると、中で課長がぐっすり。字幕「中で寝てた」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 総見直し（2026-11-10）：字幕は2回まで。3回目以降（オチの説明）は出さず、絵で見せる
// サンタ帽（下の中心 x,y・幅 w・高さ h・先の曲がり bend）
const HAT = (x, y, w, h, bend, rot) => `<g transform="translate(${x} ${y}) rotate(${rot || 0})">`
  + `<path d="M${-w / 2} 0 C${-w * .38} ${-h * .55} ${-w * .1 + bend * .3} ${-h * .9} ${bend} ${-h} C${w * .12 + bend * .4} ${-h * .82} ${w * .4} ${-h * .5} ${w / 2} 0 Z" fill="#D9372E"/>`
  + `<path d="M${-w * .3} ${-h * .1} C${-w * .2} ${-h * .5} ${-w * .05} ${-h * .8} ${bend * .8} ${-h * .95}" stroke="#F0675C" stroke-width="${w * .05}" fill="none" stroke-linecap="round" opacity=".7"/>`
  + `<rect x="${-w / 2 - w * .06}" y="${-h * .1}" width="${w * 1.12}" height="${h * .16}" rx="${h * .08}" fill="#FFF7EE" stroke="#E3D6C6" stroke-width="${Math.max(2, w * .012)}"/>`
  + `<circle cx="${bend}" cy="${-h}" r="${w * .1}" fill="#FFF7EE" stroke="#E3D6C6" stroke-width="${Math.max(2, w * .012)}"/></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '5.4-6.0',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.8, type: 'pon' }, { t: 1.4, type: 'chime' }, { t: 2.4, type: 'swish' }, { t: 2.7, type: 'thump' }, { t: 3.3, type: 'tap' }, { t: 3.7, type: 'tap' }, { t: 4.1, type: 'tap' }, { t: 4.5, type: 'tap' },
    { t: 4.8, type: 'thump' }, { t: 5.6, type: 'swish' }, { t: 6.2, type: 'blink' }, { t: 7.2, type: 'twitch' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [10, 0] });
    const drop = ease(seg(t, 2.2, 2.7));                       // 特大の帽子が上から
    const walk = ease(seg(t, 3.1, 4.8));                       // よちよち左へ
    const lift = ease(seg(t, 5.4, 6.1));                       // ジルが持ち上げる
    const hx = 830 - 140 * walk, wob = t > 3.1 && t < 4.8 ? Math.sin(t * 14) * 7 : 0;
    const covered = t >= 2.65 && t < 5.7;
    // ジル（左）：帽子をかぶる（にこ）→ 特大を見て「！」→ ごつん（びっくり）→ 持ち上げる（lean）→ ジト目
    const jface = t < 2.2 ? Object.assign({}, RIG.FACES.smile, { sparkle: t > .8 && t < 1.6 ? 1 : 0 }) : t < 4.8 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : t < 5.4 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : t < 6.4 ? RIG.FACES.think : RIG.FACES.annoyed;
    const jlift = t >= 5.3 && t < 6.3;
    const jp = Object.assign({}, jlift ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 30, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: .8, bodyTilt: jlift ? -10 : 0 });
    // ジルの小さな帽子（頭の上）
    const jhat = t >= .8 ? `<g transform="translate(264 ${1012 - (jlift ? 0 : 0)}) scale(${outBack(seg(t, .8, 1.1))})">${HAT(0, 0, 120, 110, 50, 8)}</g>` : '';
    L.char('jil', jp, t, jhat, {});
    // レン（右）：ふつう → 帽子の中（見えない）→ 中でぐっすり（loaf・sleepy）→ 起きずにご満悦
    if (!covered) {
      const rx = t < 3 ? 540 : 540 - 140;
      const rface = t < 2.2 ? Object.assign({}, RIG.FACES.smile, { sparkle: t > 1.6 ? 1 : 0 }) : t < 3 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : RIG.FACES.sleepy;
      L.char('ren', Object.assign({}, t < 3 ? RIG.POSES.sit : RIG.POSES.loaf, rface, { x: rx, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: .3 }), t, '', {});
    } else L.char('ren', null, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // 特大の帽子（落ちてくる → かぶさる → 歩く → 持ち上がる）
    if (t >= 2.2) {
      const y = DESK + 10 - (1 - drop) * 1200 - lift * 1400;
      // 歩いている間は、帽子の下から足がちょこちょこ
      if (t > 3.1 && t < 4.8) fx += [0, 1].map(k => `<ellipse cx="${hx - 60 + k * 120}" cy="${DESK + 6 - Math.abs(Math.sin(t * 14 + k * Math.PI)) * 14}" rx="42" ry="22" fill="#F4E6D2" stroke="#D9C4A8" stroke-width="4"/>`).join('');
      fx += HAT(hx, y, 560, 760, -150, wob - lift * 8);
    }
    if (t > 2.65 && t < 3.0) fx += L.impact(hx, DESK - 20, seg(t, 2.65, 3.0), .8, '#D9372E');
    if (t > 4.8 && t < 5.2) fx += L.impact(430, DESK - 300, seg(t, 4.8, 5.2), .8, '#F2C230');
    if (t > 6.6 && t < 8.6) fx += L.emark(220, DESK - 650, 1.0, '…');
    let ui = (t > 1.0 && t < 2.3 ? CHIP(L, 'SANTA HATS', 'サンタ帽、ジルはちょこん', 1580, seg(t, 1.0, 1.3)) : '')
      + (t > 2.9 && t < 4.6 ? CHIP(L, "BOSS'S HAT: XXL", '上司の帽子：特大', 1580, seg(t, 2.9, 3.2)) : '')
      + (t > 6.3 && t < 8.6 ? CHIP_OFF(L, 'INSIDE: ASLEEP', '中で寝てた', 1580, seg(t, 6.3, 6.6)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.4, cx: 300, cy: 1050 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1100, d: .9 },
      { t: 2.1, z: .95, cx: 600, cy: 1000, d: .5 },                 // 特大の帽子（引き）
      { t: 4.4, z: 1.05, cx: 500, cy: 1080, d: .5 },
      { t: 5.9, z: 1.3, cx: 600, cy: 1150, d: .5 },                 // 中で寝てる
      { t: 7.2, z: 1.08, cx: 520, cy: 1120, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 2.65 && t < 2.85 ? 6 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
