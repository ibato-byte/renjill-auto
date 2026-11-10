// 「残業の夜食」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：21:00、残業。レンがカップ麺にお湯を入れて、ふたを閉じる。3分（時計）
// ひっくり返し：待っているうちに寝落ち → 時計がぐるぐる回って 23:00 → オチ：ジルが起こす。麺はのびのび（カップから麺があふれる）。字幕「3分のつもりが2時間」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 総見直し（2026-11-10）：字幕は2回まで。3回目以降（オチの説明）は出さず、絵で見せる
// カップ麺：lid=ふた（0 閉じる〜1 開く）、steam=湯気、over=のびた麺（0〜1）
const CUP = (x, y, lid, steam, over, t) => { let s = `<g transform="translate(${x} ${y})"><path d="M-80 -120 L80 -120 L62 60 L-62 60 Z" fill="#F4ECE0" stroke="#D7CCBB" stroke-width="6"/><rect x="-80" y="-120" width="160" height="30" rx="6" fill="#E86C5A"/><rect x="-60" y="-40" width="120" height="14" rx="7" fill="#E86C5A" opacity=".5"/>`; if (over > 0) for (let i = 0; i < 7; i++) s += `<path d="M${-60 + i * 20} -120 q${10 * Math.sin(i)} ${-60 * over} ${20 * Math.sin(i * 1.3)} ${-110 * over}" fill="none" stroke="#F2D27A" stroke-width="9" stroke-linecap="round"/>`; if (steam > 0) for (let i = 0; i < 3; i++) { const ph = (t * .6 + i * .33) % 1; s += `<path d="M${-30 + i * 30} ${-130 - ph * 90} q14 -16 0 -32 q-14 -16 0 -32" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity="${(steam * (1 - ph)).toFixed(2)}"/>`; } s += `<g transform="translate(0 -120) rotate(${-lid * 70}) translate(0 0)"><ellipse rx="86" ry="18" fill="#FFF4E6" stroke="#D7CCBB" stroke-width="6"/><rect x="-16" y="-10" width="32" height="8" rx="4" fill="#E86C5A"/></g></g>`; return s; };
var EP = {
  dur: 9.5,
  bgmHolds: '6.6-7.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.0, type: 'click' }, { t: 1.3, type: 'whoosh' }, { t: 2.2, type: 'tap' }, { t: 3.2, type: 'blink' }, { t: 3.8, type: 'flop' }, { t: 4.4, type: 'swish' }, { t: 4.9, type: 'swish' }, { t: 5.4, type: 'swish' }, { t: 5.9, type: 'swish' },
    { t: 6.6, type: 'pop' }, { t: 6.9, type: 'tap' }, { t: 7.1, type: 'tap' }, { t: 7.4, type: 'boing' }, { t: 7.9, type: 'blink' }, { t: 8.3, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    // 時計：21:00 → 4.4〜6.2 でぐるぐる → 23:00
    const spin = seg(t, 4.4, 6.2);
    const mins = 21 * 60 + Math.round(ease(spin) * 120);
    const bg = L.office({ sky: 'night', clock: [Math.floor(mins / 60), mins % 60] });
    const lid = t < 1.0 ? 1 : t < 2.2 ? 1 - ease(seg(t, 1.0, 1.4)) : t < 7.4 ? 0 : ease(seg(t, 7.4, 7.8));
    const asleep = t >= 3.8 && t < 7.4;
    const over = t >= 7.4 ? outBack(seg(t, 7.4, 8.0)) : 0;
    // レン（右）：お湯を入れる → じっと待つ（3分）→ 3.8 こっくり → 寝る（zzz）→ 7.4 起こされてびっくり → のびた麺にしょんぼり
    const rface = t < 3.2 ? RIG.FACES.neutral : t < 3.8 ? Object.assign({}, RIG.FACES.sleepy, { zzz: 0 }) : asleep ? RIG.FACES.sleepy : t < 8.0 ? RIG.FACES.surprised : Object.assign({}, RIG.FACES.oops, { sweat: 1 });
    const nod = t >= 3.2 && t < 3.8 ? Math.abs(Math.sin(t * 12)) * 10 : asleep ? 26 : 0;
    const rp = Object.assign({}, asleep ? RIG.POSES.loaf : RIG.POSES.sit, rface, { x: 540, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: .5, headNod: nod, headTilt: asleep ? 10 : 0, bodySquash: t >= 8.0 ? -.15 : 0 });
    L.char('ren', rp, t, '', {});
    // ジル（左）：6.6 に来て（左から）、7.0 レンの肩をとんとん（lean）
    if (t >= 6.6) {
      const h = RIG.hop(t, 6.6, 7.0, -700, 60, { hops: 2, height: 40 });
      const jp = Object.assign({}, t < 7.0 ? RIG.POSES.stand : RIG.POSES.lean, t < 7.9 ? RIG.FACES.sharp : RIG.FACES.annoyed, { x: h.x, y: DESK - 413 * 1.3 + h.yOff, scale: 1.3, bodySquash: h.squash, bodyTilt: t >= 7.0 ? -10 : 0, eyeLook: .8 });
      L.char('jil', jp, t, '', { vx: t < 7.0 ? 900 : 0 });
    } else L.char('jil', null, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    fx += L.papers(300, DESK - 10, 4, {});
    // ポット（1.0〜1.4 お湯を注ぐ）
    if (t > 0.6 && t < 2.0) { const k = seg(t, 1.0, 1.4); fx += `<g transform="translate(${760} ${DESK - 300}) rotate(${-30 * Math.sin(seg(t, 0.8, 1.8) * Math.PI)})"><rect x="-50" y="-70" width="100" height="120" rx="20" fill="#3B4252"/><path d="M50 -40 l50 -20 l0 20 l-50 20Z" fill="#3B4252"/><rect x="-30" y="-90" width="60" height="24" rx="10" fill="#1F2630"/></g>`; if (k > 0 && k < 1) fx += `<path d="M850 ${DESK - 330} q10 60 -40 150" fill="none" stroke="#BFE1F7" stroke-width="10" stroke-linecap="round" opacity=".9"/>`; }
    fx += CUP(680, DESK - 60, lid, t > 1.2 && t < 7.4 ? .9 : 0, over, t);
    // 3分の印：時計の絵（小）に「3」→ 寝落ち → 2時間
    if (t > 2.2 && t < 3.8) fx += `<g transform="translate(900 ${DESK - 640})"><circle r="60" fill="#fff" stroke="#5A3A1E" stroke-width="8"/><text y="18" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="56" fill="#5A3A1E">3</text><line x1="0" y1="0" x2="0" y2="-40" stroke="#5A3A1E" stroke-width="7" stroke-linecap="round" transform="rotate(${(t - 2.2) * 120})"/></g>`;
    if (asleep) fx += `<g font-family="Noto Sans CJK JP" font-weight="900" fill="#7C8FC4" opacity=".9">${[0, 1, 2].map(i => { const ph = (t * .5 + i * .33) % 1; return `<text x="${920 + i * 30 + ph * 40}" y="${DESK - 560 - ph * 160}" font-size="${44 + i * 14}" opacity="${(1 - ph).toFixed(2)}">z</text>`; }).join('')}</g>`;
    if (spin > 0 && spin < 1) fx += L.speed(540, 300, .35, 16);
    if (t > 7.0 && t < 7.4) fx += L.impact(800, DESK - 420, seg(t, 7.0, 7.4), .7, '#F2A33A');
    if (t > 7.4 && t < 8.0) fx += L.emark(900, DESK - 700, 1.0);
    let ui = (t > 1.8 && t < 3.4 ? CHIP(L, 'OVERTIME: 3 MIN WAIT', '残業の夜食、できるまで3分', 1380, seg(t, 1.8, 2.1)) : '')
      + (t > 4.6 && t < 6.4 ? CHIP(L, '21:00 → 23:00', '待っているうちに2時間', 1380, seg(t, 4.6, 4.9)) : '')
      + (t > 7.6 && t < 8.6 ? CHIP_OFF(L, 'NOODLES: OVERGROWN', '麺、のびのび', 1380, seg(t, 7.6, 7.9)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 640, cy: 1150 },
      { t: 0.01, z: 1.1, cx: 600, cy: 1120, d: .9 },
      { t: 3.6, z: 1.3, cx: 720, cy: 1050, d: .5 },                 // 寝落ち
      { t: 4.3, z: 1.0, cx: 540, cy: 900, d: .4 },                  // 時計が回る
      { t: 6.5, z: 1.05, cx: 540, cy: 1100, d: .4 },
      { t: 7.4, z: 1.35, cx: 680, cy: 1180, d: .4 },                // のびた麺
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, dim: .12, shake: t > 7.4 && t < 7.5 ? 4 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
