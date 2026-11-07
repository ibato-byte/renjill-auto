// 「ボーナスの日」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：ボーナスの封筒が2つ（12月）→ レンがわくわく開ける → 中は「牧草 ×3」（レンの目が点）
// ひっくり返し：ジルも開ける → 「牧草 ×30」の山 → オチ：レン固まる。ジルは無表情でもぐもぐ（字幕「部下のほうが多い」）
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
// 封筒：open=0..1 でふたが開く。inner＝中身（開いた分だけ上に出る）
const ENV = (L, x, y, open, inner, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><g transform="translate(0 ${-140 * open})">${inner}</g><rect x="-150" y="-100" width="300" height="200" rx="14" fill="#F3E2C4" stroke="#C9A87E" stroke-width="5"/><path d="M-150 -100 L0 20 L150 -100" fill="none" stroke="#C9A87E" stroke-width="5"/><g transform="rotate(${-170 * open} 0 -100)"><path d="M-150 -100 L0 -210 L150 -100Z" fill="#E9D3AE" stroke="#C9A87E" stroke-width="5"/></g><circle cx="0" cy="-20" r="22" fill="#E8473A"/></g>`;
const HAYPILE = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-120 0 Q-100 -110 0 -130 Q100 -110 120 0Z" fill="#B9C46A"/>${Array.from({ length: 22 }, (_, i) => `<path d="M${-100 + i * 9} 0 q${Math.sin(i) * 20} -60 ${(-80 + i * 7.6) * .6} ${-90 - (i % 5) * 10}" stroke="${i % 3 ? '#9FAE4E' : '#D4D98A'}" stroke-width="6" fill="none" stroke-linecap="round"/>`).join('')}</g>`;
const HAYCARD = (L, n, big) => `<g><rect x="-120" y="-80" width="240" height="160" rx="12" fill="#fff" stroke="#D7CCBB" stroke-width="4"/>${big ? HAYPILE(0, 60, .8) : `<path d="M-40 40 q10 -60 40 -70 M-10 40 q20 -40 50 -50 M-60 40 q0 -40 20 -60" stroke="#A8B84E" stroke-width="8" fill="none" stroke-linecap="round"/>`}<text x="0" y="${big ? -30 : 10}" text-anchor="middle" font-size="${big ? 56 : 48}" font-weight="900" font-family="Noto Sans CJK JP" fill="#3A2414">×${n}</text></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '6.2-6.8',
  sfx: [{ t: 0.12, type: 'pop' }, { t: 0.7, type: 'tap' }, { t: 1.3, type: 'swish' }, { t: 1.9, type: 'pon' }, { t: 2.6, type: 'blink' }, { t: 3.1, type: 'flop' },
    { t: 4.0, type: 'tap' }, { t: 4.6, type: 'swish' }, { t: 5.2, type: 'chime' }, { t: 5.6, type: 'boing' }, { t: 6.2, type: 'twitch' }, { t: 7.2, type: 'tap' }, { t: 7.45, type: 'tap' }, { t: 7.7, type: 'tap' }, { t: 7.95, type: 'tap' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack, pulse } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [12, 0] });
    // レン（右）：0.7 封筒を見てわくわく → 1.3〜1.9 開ける → 2.6 目が点 → 3.1 しおれる → 5.6 ジルの中身を見て固まる
    const rOpen = ease(seg(t, 1.3, 1.9));
    let rp;
    if (t < 2.6) rp = Object.assign({}, RIG.POSES.sit, RIG.FACES.smile, { sparkle: t > .7 ? 1 : 0, bodySquash: t > .7 && t < 1.3 ? .08 * Math.sin(t * 18) : 0 });
    else if (t < 3.1) rp = Object.assign({}, RIG.POSES.sit, RIG.FACES.neutral, { eyeOpen: .9 });
    else if (t < 5.6) rp = Object.assign({}, RIG.POSES.loaf, RIG.FACES.annoyed, { sweat: .6 });
    else rp = Object.assign({}, RIG.POSES.loaf, RIG.FACES.surprised, { excl: 0, eyeLook: -.9, sweat: 1, headNod: 24 });
    Object.assign(rp, { x: 700, y: DESK - 413 * 1.5, scale: 1.5, flip: true });
    L.char('ren', rp, t, '', {});
    // ジル（左）：4.0 封筒に手を伸ばす → 4.6〜5.2 開ける → 5.6 大きな束 → 6.2〜 もぐもぐ
    const jOpen = ease(seg(t, 4.6, 5.2));
    let jp;
    if (t < 5.6) jp = Object.assign({}, RIG.POSES.sit, RIG.FACES.sharp, { eyeLook: .3 });
    else jp = Object.assign({}, RIG.POSES.sit, RIG.FACES.smile, { blush: 1, bodySquash: t > 6.2 ? .06 * Math.sin(t * 22) : 0 });
    Object.assign(jp, { x: 200, y: DESK - 413 * 1.3, scale: 1.3 });
    L.char('jil', jp, t, '', {});
    // 手前：机・封筒2つ・中身
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    const renIn = rOpen > 0 ? `<g transform="translate(0 -40) scale(${.9 * outBack(seg(t, 1.5, 1.95))})">${HAYCARD(L, 3, false)}</g>` : '';
    const jilIn = jOpen > 0 ? `<g transform="translate(0 -60) scale(${1.15 * outBack(seg(t, 4.8, 5.3))})">${HAYCARD(L, 30, true)}</g>` : '';
    fx += ENV(L, 760, DESK - 120, rOpen, renIn, .85) + ENV(L, 300, DESK - 120, jOpen, jilIn, .85);
    if (t > .7 && t < 1.3) fx += L.sparkles(760, DESK - 300, t, 1.2);
    if (t > 5.3 && t < 6.6) fx += L.sparkles(300, DESK - 360, t, 1.6, 7);
    if (t > 6.2 && t < 8.6) fx += L.munch(200, DESK - 320, t, 1.3);
    let ui = (t > 1.8 && t < 3.4 ? CHIP(L, 'BONUS DAY', 'ボーナスの日。上司と部下に封筒が1通ずつ', 1380, seg(t, 1.8, 2.1)) : '')
      + (t > 5.8 && t < 8.6 ? CHIP(L, "JILL'S IS 10× BIGGER", '部下のほうが10倍多い', 1380, seg(t, 5.8, 6.1)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.5, cx: 700, cy: 1150 },
      { t: 0.01, z: 1.25, cx: 620, cy: 1200, d: .8 },
      { t: 1.3, z: 1.6, cx: 740, cy: 1240, d: .5 },                 // レンの封筒に寄る
      { t: 3.1, z: 1.15, cx: 540, cy: 1200, d: .5 },
      { t: 4.4, z: 1.6, cx: 320, cy: 1230, d: .5 },                 // ジルの封筒に寄る
      { t: 5.6, z: 1.1, cx: 500, cy: 1180, d: .5 },                 // 引き：両方見える
      { t: 7.2, z: 1.45, cx: 420, cy: 1200, d: .6 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 5.2 && t < 5.4 ? 8 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
