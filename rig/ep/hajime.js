// 「仕事始め」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：1月4日、仕事始め。ジルが壁のカレンダーを「1/4」にする（きりっ）
// ひっくり返し：課長がそっと「12/31」に戻す → ジルが「1/4」に → また戻す（休みが恋しい）
// オチ：ジルがカレンダーをテープでぺたぺた固定。課長はしょんぼり。字幕「上司の心は、まだ12月」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
// カレンダー（中心 x,y）：jan=1 なら 1/4、0 なら 12/31。flip=めくり中（0〜1）
const CAL = (x, y, jan, flip, tape) => { const m = jan ? '1' : '12', d = jan ? '4' : '31', col = jan ? '#3A2414' : '#E8473A', sub = jan ? '仕事始め' : '大みそか';
  let s = `<g transform="translate(${x} ${y})"><rect x="-150" y="-170" width="300" height="340" rx="16" fill="#FFFDF7" stroke="#D7CCBB" stroke-width="6"/><rect x="-150" y="-170" width="300" height="70" rx="16" fill="#C9483C"/>`
    + `<text y="-120" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="46" fill="#FFF7E8">${m}月</text>`
    + `<g transform="scale(1 ${Math.abs(Math.cos(flip * Math.PI))})"><text y="70" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="170" fill="${col}">${d}</text><text y="140" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="40" fill="${col}">${sub}</text></g>`
    + `<circle cx="-100" cy="-180" r="10" fill="#8C5A3C"/><circle cx="100" cy="-180" r="10" fill="#8C5A3C"/>`;
  if (tape > 0) s += [[-150, -170, 35], [150, -170, -35], [-150, 170, -35], [150, 170, 35]].slice(0, Math.ceil(tape * 4)).map(([a, b, r]) => `<rect x="${a - 50}" y="${b - 16}" width="100" height="32" rx="4" fill="#F2E6B8" opacity=".9" transform="rotate(${r} ${a} ${b})"/>`).join('');
  return s + '</g>'; };
var EP = {
  dur: 9.5,
  bgmHolds: '5.8-6.4',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.9, type: 'swish' }, { t: 1.4, type: 'chime' }, { t: 2.4, type: 'swish' }, { t: 3.2, type: 'swish' }, { t: 3.6, type: 'blink' }, { t: 4.2, type: 'swish' },
    { t: 5.0, type: 'swish' }, { t: 5.8, type: 'tap' }, { t: 6.1, type: 'tap' }, { t: 6.4, type: 'tap' }, { t: 6.7, type: 'tap' }, { t: 7.4, type: 'twitch' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400, CX = 540, CY = 760;
    const bg = L.office({ sky: 'day', clock: [9, 0], noClock: true });
    // めくる時刻：ジル 0.8 → 1月、課長 2.3 → 12月、ジル 3.1 → 1月、課長 4.1 → 12月、ジル 4.9 → 1月（その後テープ）
    const F = [[.8, 1], [2.3, 0], [3.1, 1], [4.1, 0], [4.9, 1]];
    let jan = 0, flip = 0; for (const [ft, v] of F) { if (t >= ft + .25) jan = v; if (t >= ft && t < ft + .5) flip = (t - ft) / .5; }
    const tape = seg(t, 5.7, 6.9);
    const jReach = F.some(([ft, v]) => v === 1 && t >= ft - .1 && t < ft + .5) || (t >= 5.7 && t < 6.9);
    const rReach = F.some(([ft, v]) => v === 0 && t >= ft - .1 && t < ft + .5);
    // ジル（左）：きりっ → 戻されて「？」→ むっ → テープでぺたぺた → 満足（にこ）
    const jface = t < 2.3 ? RIG.FACES.sharp : t < 3.1 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : t < 5.7 ? RIG.FACES.annoyed : t < 7.0 ? RIG.FACES.sharp : RIG.FACES.smile;
    L.char('jil', Object.assign({}, jReach ? RIG.POSES.stand : RIG.POSES.sit, jface, { x: 20, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: .9, question: t >= 2.5 && t < 3.1 ? 1 : 0 }), t, '', {});
    // レン（右）：眠そう（休みぼけ）→ そっと戻す（stand・目をそらす）→ テープで固定されてしょんぼり
    const rface = t < 2.0 ? RIG.FACES.sleepy : t < 5.7 ? Object.assign({}, RIG.FACES.neutral, { eyeLook: -.6 }) : RIG.FACES.oops;
    L.char('ren', Object.assign({}, rReach ? RIG.POSES.stand : RIG.POSES.sit, rface, { x: 560, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: -.5, headNod: t >= 7.2 ? 18 : 0 }), t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    fx += CAL(CX, CY, jan, flip, tape);
    if (t > 5.7 && t < 6.9) fx += L.impact(CX, CY, seg(t, 5.7 + Math.floor((t - 5.7) / .3) * .3, 6.0 + Math.floor((t - 5.7) / .3) * .3), .4, '#F2E6B8');
    let ui = (t > 1.2 && t < 2.3 ? CHIP(L, 'JAN 4: BACK TO WORK', '1月4日、仕事始め', 1640, seg(t, 1.2, 1.5)) : '')
      + (t > 3.4 && t < 5.6 ? CHIP_OFF(L, 'BOSS: STILL DEC 31', '上司がこっそり12月に戻す', 1640, seg(t, 3.4, 3.7)) : '')
      + (t > 7.0 && t < 8.6 ? CHIP_OFF(L, 'STILL IN DECEMBER', '上司の心は、まだ12月', 1640, seg(t, 7.0, 7.3)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.25, cx: 540, cy: 850 },
      { t: 0.01, z: .95, cx: 540, cy: 1050, d: .9 },
      { t: 5.6, z: 1.2, cx: 540, cy: 900, d: .5 },                  // テープ
      { t: 7.0, z: 1.0, cx: 540, cy: 1080, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
