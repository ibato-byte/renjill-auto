// 「シークレットサンタ」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：プレゼント交換。机の上に箱が2つ（赤いリボン／青いリボン）。二人とも「？」
// ひっくり返し：同時に開ける → 両方とも牧草の束（同じもの）→ 見合わせて固まる
// オチ：そのまま交換して、同じ牧草をもぐもぐ。字幕「交換：牧草 ⇄ 牧草」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const HAYB = (x, y, s = 1, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M-110 20 Q-50 -70 0 -80 Q50 -70 110 20 Z" fill="#E6C97E"/>${[0, 1, 2, 3, 4, 5].map(i => `<line x1="${-80 + i * 32}" y1="10" x2="${-70 + i * 32 + Math.sin(i * 2) * 18}" y2="${-80 - Math.cos(i) * 18}" stroke="#C9A24E" stroke-width="7" stroke-linecap="round"/>`).join('')}<rect x="-36" y="-14" width="72" height="22" rx="11" fill="#E86CB0"/></g>`;
// 箱：open=0 閉じる〜1 開く（ふたが上に飛ぶ）、inner=中身
const GIFT = (x, y, ribbon, open, inner) => `<g transform="translate(${x} ${y})"><rect x="-120" y="-110" width="240" height="130" rx="12" fill="#F7E7D0" stroke="#D9B98E" stroke-width="6"/><rect x="-18" y="-110" width="36" height="130" fill="${ribbon}"/>${open > 0 ? `<g transform="translate(0 ${-110 - open * 40})">${inner}</g>` : ''}<g transform="translate(${open * 160} ${-110 - open * 300}) rotate(${open * 40})" opacity="${(1 - open).toFixed(2)}"><rect x="-130" y="-50" width="260" height="56" rx="12" fill="#FFF4E6" stroke="#D9B98E" stroke-width="6"/><rect x="-18" y="-50" width="36" height="56" fill="${ribbon}"/><path d="M-40 -50 q40 -50 40 0 q0 -50 40 0" fill="none" stroke="${ribbon}" stroke-width="12"/></g></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '4.4-5.0',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.0, type: 'tap' }, { t: 1.3, type: 'tap' }, { t: 2.4, type: 'twitch' }, { t: 3.4, type: 'click' }, { t: 3.45, type: 'click' }, { t: 3.8, type: 'pop' }, { t: 3.85, type: 'pop' }, { t: 4.4, type: 'blink' }, { t: 4.8, type: 'blink' },
    { t: 5.8, type: 'swish' }, { t: 6.0, type: 'swish' }, { t: 6.6, type: 'tap' }, { t: 6.9, type: 'tap' }, { t: 7.2, type: 'tap' }, { t: 7.8, type: 'pon' }, { t: 8.2, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [16, 0] });
    const open = outBack(seg(t, 3.4, 3.8));
    const stare = t >= 4.4 && t < 5.8;                        // 見合わせて固まる
    const swap = ease(seg(t, 5.8, 6.3));
    const eat = t >= 6.6;
    // ジル（左）：箱を見て「？」→ 開けて牧草 → 固まる（レンを見る）→ 交換 → もぐもぐ（にこ）
    const jface = t < 3.8 ? RIG.FACES.think : t < 4.4 ? RIG.FACES.surprised : stare ? RIG.FACES.neutral : RIG.FACES.smile;
    const jp = Object.assign({}, RIG.POSES.sit, jface, { x: 40, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: stare ? .95 : .5, headNod: eat ? Math.abs(Math.sin(t * 16)) * 8 : 0, bodySquash: eat ? Math.sin(t * 16) * .12 : 0, question: t < 3.4 ? 1 : 0 });
    L.char('jil', jp, t, '', {});
    const rface = t < 3.8 ? RIG.FACES.think : t < 4.4 ? RIG.FACES.surprised : stare ? RIG.FACES.neutral : RIG.FACES.smile;
    const rp = Object.assign({}, RIG.POSES.sit, rface, { x: 540, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: stare ? .95 : .5, headNod: eat ? Math.abs(Math.sin(t * 16 + 1)) * 8 : 0, bodySquash: eat ? Math.sin(t * 16 + 1) * .12 : 0, question: t < 3.4 ? 1 : 0 });
    L.char('ren', rp, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // 箱 2 つ（1.0 に上から）。交換で左右が入れ替わる
    const drop = outBack(seg(t, 1.0, 1.4));
    const xL = 300 + 480 * swap, xR = 780 - 480 * swap, lift = Math.sin(swap * Math.PI) * 90;
    const hayK = eat ? Math.max(.2, 1 - seg(t, 6.6, 8.0) * .8) : 1;
    if (t >= 1.0) { fx += GIFT(xL, DESK - 10 - 400 * (1 - drop) - lift, '#E8473A', open, HAYB(0, 0, 1.0 * hayK)); fx += GIFT(xR, DESK - 10 - 400 * (1 - drop) - lift * .6, '#4A90D9', open, HAYB(0, 0, 1.0 * hayK)); }
    if (t > 1.0 && t < 1.5) fx += L.dust(540, DESK, seg(t, 1.0, 1.5));
    if (t > 3.4 && t < 3.9) { fx += L.impact(300, DESK - 250, seg(t, 3.4, 3.9), .8, '#F2A33A'); fx += L.impact(780, DESK - 250, seg(t, 3.4, 3.9), .8, '#F2A33A'); }
    if (t > 3.8 && t < 4.4) { fx += L.emark(230, DESK - 650, 1.0); fx += L.emark(900, DESK - 650, 1.0); }
    if (stare) fx += `<g stroke="#5A3A1E" stroke-width="6" stroke-dasharray="14 12" opacity=".6"><line x1="400" y1="${DESK - 360}" x2="740" y2="${DESK - 360}"/></g>`;   // 視線
    if (eat) { fx += L.munch(300, DESK - 160, t, .9); fx += L.munch(780, DESK - 160, t + .4, .9); }
    let ui = (t > 1.8 && t < 3.3 ? CHIP(L, 'SECRET SANTA', 'プレゼント交換。箱が2つ', 1380, seg(t, 1.8, 2.1)) : '')
      + (t > 4.5 && t < 5.7 ? CHIP(L, 'HAY. AND HAY.', '中身：牧草と、牧草', 1380, seg(t, 4.5, 4.8)) : '')
      + (t > 6.5 && t < 8.6 ? CHIP(L, 'SWAP: HAY ⇄ HAY', '交換：牧草 ⇄ 牧草。両方うれしい', 1380, seg(t, 6.5, 6.8)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 540, cy: 1150 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1120, d: .9 },
      { t: 3.3, z: 1.2, cx: 540, cy: 1180, d: .4 },                 // 開ける
      { t: 4.4, z: 1.15, cx: 540, cy: 1050, d: .4 },                // 見合わせる
      { t: 5.7, z: 1.05, cx: 540, cy: 1120, d: .4 },
      { t: 7.4, z: 1.2, cx: 540, cy: 1150, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 3.4 && t < 3.5 ? 4 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
