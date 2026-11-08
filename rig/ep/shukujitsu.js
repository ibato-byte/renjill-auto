// 「祝日出社」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：月曜日の朝。ジルが出社（左から入ってくる）。課長はもう席にいる（早い！）
// ひっくり返し：壁のカレンダーは赤い「11」——今日は成人の日（祝日）
// オチ：ふたりとも気づいて「！」→ 顔を見合わせ、そのままのんびり（課長は香箱、ジルはにが笑い）。字幕「祝日に出社：ふたりとも」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
// カレンダー（中心 x,y・強調 k）
const CAL = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${1 + .12 * k})" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-150" y="-170" width="300" height="340" rx="16" fill="#FFFDF7" stroke="#D7CCBB" stroke-width="6"/><rect x="-150" y="-170" width="300" height="70" rx="16" fill="#C9483C"/>`
  + `<text y="-120" font-size="46" fill="#FFF7E8">1月</text><text y="70" font-size="170" fill="#E8473A">11</text><text y="140" font-size="40" fill="#E8473A">成人の日</text>`
  + `<circle cx="-100" cy="-180" r="10" fill="#8C5A3C"/><circle cx="100" cy="-180" r="10" fill="#8C5A3C"/>`
  + (k > 0 ? `<circle r="${150 + 30 * k}" fill="none" stroke="#E8473A" stroke-width="10" opacity="${(.8 * k).toFixed(2)}" stroke-dasharray="30 16"/>` : '') + `</g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '3.8-4.4',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.4, type: 'tap' }, { t: 0.7, type: 'tap' }, { t: 1.0, type: 'tap' }, { t: 1.6, type: 'chime' }, { t: 2.8, type: 'swish' }, { t: 3.4, type: 'blink' },
    { t: 3.9, type: 'boing' }, { t: 4.1, type: 'twitch' }, { t: 5.2, type: 'blink' }, { t: 6.0, type: 'pon' }, { t: 7.2, type: 'chime' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [9, 0], noClock: true });
    const jx = -360 + 380 * ease(seg(t, .2, 1.3));          // ジルが左から入ってくる
    const shock = t >= 3.8 && t < 5.0;
    // ジル（左）：にこにこ出社 → 課長が早くて「？」→ カレンダーを見て「！」→ 見合わせる → にが笑い
    const jface = t < 1.6 ? RIG.FACES.smile : t < 2.8 ? Object.assign({}, RIG.FACES.think, { question: 1 }) : t < 3.8 ? RIG.FACES.neutral : t < 5.0 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : t < 6.2 ? RIG.FACES.oops : Object.assign({}, RIG.FACES.smile, { blush: .3 });
    L.char('jil', Object.assign({}, t < 1.3 ? RIG.POSES.stand : RIG.POSES.sit, jface, { x: jx, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: t >= 2.8 && t < 3.8 ? .4 : .8, bodyTilt: t < 1.3 ? Math.sin(t * 18) * 4 : 0 }), t, '', {});
    // レン（右）：もう座っている（ご満悦・早い）→ カレンダーで「！」→ 見合わせる → 香箱すわりでのんびり
    const rface = t < 2.8 ? Object.assign({}, RIG.FACES.smug, { sparkle: t > 1.4 && t < 2.6 ? 1 : 0 }) : t < 3.8 ? RIG.FACES.neutral : t < 5.0 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : t < 6.2 ? RIG.FACES.oops : Object.assign({}, RIG.FACES.smile, { sparkle: 0 });
    L.char('ren', Object.assign({}, t >= 6.2 ? RIG.POSES.loaf : RIG.POSES.sit, rface, { x: 560, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: t >= 2.8 && t < 3.8 ? .3 : -.4 }), t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    fx += CAL(540, 640, t >= 3.0 && t < 5.0 ? outBack(seg(t, 3.0, 3.4)) : 0);
    if (shock) fx += L.impact(540, 640, seg(t, 3.8, 4.3), 1.6, '#E8473A');
    if (t > 6.6 && t < 8.0) fx += L.sparkles(540, 1000, t, 1.4, 6);
    let ui = (t > 0.6 && t < 2.6 ? CHIP(L, 'MONDAY MORNING', '月曜日、出社', 1600, seg(t, .6, .9)) : '')
      + (t > 3.4 && t < 5.4 ? CHIP(L, "TODAY'S A HOLIDAY", '今日は祝日（成人の日）', 1600, seg(t, 3.4, 3.7)) : '')
      + (t > 6.2 && t < 8.6 ? CHIP(L, 'HOLIDAY. BOTH CAME IN.', '祝日に出社：ふたりとも', 1600, seg(t, 6.2, 6.5)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.15, cx: 400, cy: 1100 },
      { t: 0.01, z: 1.0, cx: 520, cy: 1100, d: .9 },
      { t: 2.8, z: 1.2, cx: 540, cy: 760, d: .5 },                  // カレンダー
      { t: 4.2, z: 1.0, cx: 540, cy: 1000, d: .5 },                 // ふたりの「！」
      { t: 6.4, z: 1.1, cx: 540, cy: 1120, d: .6 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 3.8 && t < 4.1 ? 5 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
