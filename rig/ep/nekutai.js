// 「ネクタイ」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：ジルがプレゼントの箱にリボンをきゅっ（きりっ）
// ひっくり返し：課長もネクタイを結び直す……くるくる、くるくる、手もとがこんがらがる
// オチ：ネクタイはそのまま、頭の上に大きなリボン（ご満悦）。字幕「上司のネクタイ：頭にリボン」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const DESKFX = (L, DESK) => `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
  + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
const BOW = (x, y, s, c) => s <= 0 ? '' : `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 C-30 -40 -90 -40 -90 0 C-90 40 -30 40 0 0 Z" fill="${c}"/><path d="M0 0 C30 -40 90 -40 90 0 C90 40 30 40 0 0 Z" fill="${c}"/><path d="M-6 6 L-40 70 L-20 66 M6 6 L40 70 L20 66" stroke="${c}" stroke-width="14" fill="none" stroke-linecap="round"/><circle r="16" fill="#fff" opacity=".85"/><circle r="12" fill="${c}"/></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '5.6-6.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.8, type: 'swish' }, { t: 1.4, type: 'tap' }, { t: 2.0, type: 'chime' }, { t: 3.0, type: 'blink' }, { t: 3.6, type: 'swish' }, { t: 4.1, type: 'swish' },
    { t: 4.6, type: 'swish' }, { t: 5.1, type: 'twitch' }, { t: 5.7, type: 'pon' }, { t: 7.2, type: 'twitch' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400, RN = [858, 1156];
    const bg = L.office({ sky: 'day', clock: [9, 30] });
    // ジル（左）：箱にリボン（lean・きりっ）→ 満足 → 課長のくるくるに「？」→ 頭のリボンに「！」→ ジト目
    const jl = t > .5 && t < 1.8;
    const jface = t < 2.0 ? RIG.FACES.sharp : t < 3.4 ? Object.assign({}, RIG.FACES.smile, { sparkle: t < 2.8 ? 1 : 0 }) : t < 5.6 ? Object.assign({}, RIG.FACES.think, { question: 1 }) : t < 6.8 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : RIG.FACES.annoyed;
    L.char('jil', Object.assign({}, jl ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 20, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: t > 2.6 ? .9 : .4, bodyTilt: jl ? -8 : 0 }), t, '', {});
    // レン（右）：見ている → やる気 → くるくる（あせ）→ 頭にリボンでご満悦
    const tie = t > 3.4 && t < 5.6;
    const rface = t < 3.0 ? RIG.FACES.neutral : t < 3.4 ? Object.assign({}, RIG.FACES.smile, { sparkle: 1 }) : tie ? Object.assign({}, RIG.FACES.oops, { sweat: 1 }) : Object.assign({}, RIG.FACES.smug, { sparkle: t < 7.4 ? 1 : 0 });
    L.char('ren', Object.assign({}, RIG.POSES.sit, rface, { x: 560, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: tie ? .3 : -.3, headNod: tie ? 10 : 0, bodyTilt: tie ? Math.sin(t * 7) * 5 : 0 }), t, '', {});
    let fx = DESKFX(L, DESK);
    // ジルの箱とリボン
    fx += `<g transform="translate(370 ${DESK})"><rect x="-80" y="-120" width="160" height="120" rx="8" fill="#7FB3D9"/><rect x="-12" y="-120" width="24" height="120" fill="#E8473A"/><rect x="-80" y="-72" width="160" height="22" fill="#E8473A"/></g>`;
    fx += BOW(370, DESK - 124, outBack(seg(t, 1.2, 1.6)) * .7, '#E8473A');
    // 課長の手もと：ネクタイの線がこんがらがる（胸の前、顔より下）
    if (tie) fx += `<g opacity=".9">` + [0, 1, 2, 3].map(i => { const a = t * 6 + i * 1.6; return `<path d="M${RN[0] - 40 + Math.cos(a) * 40} ${RN[1] + 210 + Math.sin(a) * 30} q${Math.cos(a + 1) * 60} ${Math.sin(a + 1) * 40} ${Math.cos(a + 2) * 90} ${Math.sin(a + 2) * 30}" stroke="#E9A23B" stroke-width="14" fill="none" stroke-linecap="round"/>`; }).join('') + '</g>';
    if (tie) fx += `<text x="${RN[0] + 230}" y="${RN[1] - 230}" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="60" fill="#E8473A" stroke="#FFF7E8" stroke-width="10" paint-order="stroke" transform="rotate(${Math.sin(t * 9) * 8} ${RN[0] + 230} ${RN[1] - 230})">くるくる</text>`;
    // オチ：頭の上に大きなリボン（顔にはかからない高さ）
    fx += BOW(RN[0] - 10, RN[1] - 225, outBack(seg(t, 5.5, 5.9)) * 1.25, '#E9A23B');
    if (t > 5.8 && t < 7.2) fx += L.sparkles(RN[0] - 10, RN[1] - 230, t, 1.4, 6);
    if (t > 7.2 && t < 8.6) fx += L.emark(220, DESK - 660, 1.0, '…');
    let ui = (t > 0.8 && t < 2.6 ? CHIP(L, 'GIFT RIBBON', 'ジル、リボンをきゅっ', 1650, seg(t, .8, 1.1)) : '')
      + (t > 6.0 && t < 8.6 ? CHIP(L, 'BOSS TIES HIS TIE: A BOW', '上司のネクタイ：頭にリボン', 1650, seg(t, 6.0, 6.3)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 360, cy: 1150 },
      { t: 0.01, z: 1.1, cx: 420, cy: 1120, d: .9 },
      { t: 3.0, z: 1.2, cx: 760, cy: 1100, d: .5 },                 // 課長の番
      { t: 5.6, z: 1.0, cx: 560, cy: 1060, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
