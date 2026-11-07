// 「年賀状100枚」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：年賀状の季節。机にはがきの束（100枚）。ジルはすらすら（束が右へ移っていく）。レンは1枚目
// ひっくり返し：時計が 15:00 → 17:00。ジルは100枚（✓）。レンはまだ1枚目を描いている
// オチ：レンの1枚目は、自分の似顔絵（うさぎの顔）だけ。ジルが見て「…」→ でも悪くない（♥）。字幕「ジル：100枚。上司：1枚（自画像）」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const STACK = (x, y, n, done) => { let s = ''; for (let i = 0; i < n; i++) s += `<rect x="${x - 90 + Math.sin(i * 9.1) * 4}" y="${y - (i + 1) * 5}" width="180" height="6" rx="2" fill="${done ? '#FFF4E6' : '#fff'}" stroke="${done ? '#E8B4A0' : '#D7CCBB'}" stroke-width="1.5"/>`; if (done && n > 0) s += `<circle cx="${x + 60}" cy="${y - n * 5 - 30}" r="22" fill="#5DBB63"/><path d="M${x + 50} ${y - n * 5 - 30} L${x + 57} ${y - n * 5 - 22} L${x + 72} ${y - n * 5 - 40}" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`; return s; };
// レンの1枚：自画像（たれ耳のうさぎ）。k=描き進み（0〜1）
const CARD = (x, y, k, s = 1) => { let g = `<g transform="translate(${x} ${y}) rotate(-6) scale(${s})"><rect x="-110" y="-150" width="220" height="300" rx="8" fill="#fff" stroke="#D7CCBB" stroke-width="5"/><rect x="-70" y="-130" width="60" height="70" rx="4" fill="none" stroke="#E8473A" stroke-width="3"/>`; if (k > .1) g += `<ellipse cx="0" cy="20" rx="${50 * Math.min(1, k * 2)}" ry="${44 * Math.min(1, k * 2)}" fill="none" stroke="#5A3A1E" stroke-width="5"/>`; if (k > .4) g += `<path d="M-40 -10 q-30 40 -10 80 M40 -10 q30 40 10 80" fill="none" stroke="#5A3A1E" stroke-width="5" stroke-linecap="round"/>`; if (k > .6) g += `<circle cx="-18" cy="14" r="5" fill="#5A3A1E"/><circle cx="18" cy="14" r="5" fill="#5A3A1E"/>`; if (k > .8) g += `<path d="M-10 36 q10 8 20 0" stroke="#5A3A1E" stroke-width="4" fill="none"/><path d="M-12 56 l24 0 l-12 20 Z" fill="#F2B544"/>`; return g + '</g>'; };
var EP = {
  dur: 9.5,
  bgmHolds: '6.8-7.4',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.0, type: 'tap' }, { t: 1.3, type: 'tap' }, { t: 1.6, type: 'tap' }, { t: 1.9, type: 'tap' }, { t: 2.2, type: 'tap' }, { t: 2.6, type: 'swish' }, { t: 3.1, type: 'swish' }, { t: 3.6, type: 'swish' }, { t: 4.1, type: 'swish' }, { t: 4.6, type: 'swish' },
    { t: 5.2, type: 'pon' }, { t: 5.8, type: 'twitch' }, { t: 6.8, type: 'blink' }, { t: 7.4, type: 'pon' }, { t: 8.2, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const k = ease(seg(t, 2.6, 5.2));                           // 時計 15:00 → 17:00
    const mins = 15 * 60 + Math.round(k * 120);
    const bg = L.office({ sky: 'day', clock: [Math.floor(mins / 60), mins % 60] });
    const jl = Math.round(20 * (1 - k)), jd = 20 - jl;         // ジル：左の束が減り、右の✓束が増える
    const draw = Math.min(1, Math.max(0, (t - 1.0) / 6.0));    // レンの1枚（ゆっくり）
    // ジル（左）：すらすら（小さく上下）→ 完了（smug）→ レンの1枚を見る → ♥
    const jface = t < 5.2 ? RIG.FACES.sharp : t < 6.8 ? RIG.FACES.smug : t < 7.4 ? RIG.FACES.think : RIG.FACES.shy;
    const jp = Object.assign({}, RIG.POSES.sit, jface, { x: 40, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: t >= 5.8 ? .9 : .2, headNod: t > 1.0 && t < 5.2 ? Math.abs(Math.sin(t * 16)) * 6 : 0, question: 0 });
    L.char('jil', jp, t, '', {});
    // レン（右）：舌を出して集中（頭を少し傾ける）→ 7.4 完成でご満悦
    const rface = t < 7.4 ? Object.assign({}, RIG.FACES.neutral, { eyeOpen: .7, mouth: 'w' }) : RIG.FACES.smug;
    const rp = Object.assign({}, RIG.POSES.lean, rface, { x: 540, y: DESK - 413 * 1.35, scale: 1.35, flip: true, bodyTilt: -8, headTilt: t < 7.4 ? 14 + Math.sin(t * 2) * 3 : 0, eyeLook: .4 });
    L.char('ren', rp, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    fx += STACK(170, DESK - 6, jl, false) + STACK(420, DESK - 6, jd, true);
    fx += CARD(790, DESK - 30, draw, .85);
    if (t > 1.0 && t < 7.4) fx += `<g transform="translate(${830 + Math.sin(t * 6) * 20} ${DESK - 170 + Math.cos(t * 5) * 8}) rotate(-40)"><rect x="-8" y="-70" width="16" height="110" rx="4" fill="#F2B544"/><path d="M-8 40 l8 24 l8 -24 Z" fill="#5A3A1E"/></g>`;  // 鉛筆
    if (k > 0 && k < 1) fx += L.speed(540, 300, .3, 16);
    if (t > 5.2 && t < 5.6) fx += L.impact(480, DESK - 160, seg(t, 5.2, 5.6), .8, '#5DBB63');
    if (t > 5.8 && t < 6.8) fx += L.emark(230, DESK - 650, 1.0, '…');
    if (t > 7.4 && t < 7.9) fx += L.impact(790, DESK - 110, seg(t, 7.4, 7.9), .8, '#F2A33A');
    if (t > 7.4) fx += L.sparkles(790, DESK - 200, t, .9, 5);
    let ui = (t > 1.8 && t < 3.2 ? CHIP(L, 'NEW YEAR CARDS: 100', '年賀状100枚。15:00スタート', 1380, seg(t, 1.8, 2.1)) : '')
      + (t > 5.3 && t < 6.6 ? CHIP(L, '17:00. JILL: 100. BOSS: 1', '17:00。ジル100枚、上司1枚目', 1380, seg(t, 5.3, 5.6)) : '')
      + (t > 7.6 && t < 8.6 ? CHIP(L, 'BOSS: 1 SELF-PORTRAIT', '上司の1枚：自画像', 1380, seg(t, 7.6, 7.9)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 540, cy: 1150 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1120, d: .9 },
      { t: 2.5, z: 1.0, cx: 540, cy: 1000, d: .5 },                 // 時計と束
      { t: 5.1, z: 1.2, cx: 420, cy: 1150, d: .4 },                 // ✓の束
      { t: 6.8, z: 1.35, cx: 740, cy: 1260, d: .5 },                // 自画像
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
