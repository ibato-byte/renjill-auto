// 「コロコロ」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：年末の大そうじ。ジルが粘着ローラー（コロコロ）で机をきれいに
// ひっくり返し：ふわふわの課長にもコロコロ → 毛がどんどん取れて、横に毛の山。課長はだんだん細く（気持ちよさそう）
// オチ：毛の山が課長より大きくなって、目がついたように見える。字幕「毛だけで、上司もう1匹」
// （うさぎは毛が生えかわる。ブラッシングで取れる毛が多いのは本当）
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
// コロコロ（ローラーの中心 x,y・回転 r・毛の量 fur 0〜1）
const ROLLER = (x, y, r, fur) => `<g transform="translate(${x} ${y}) rotate(${r})"><line x1="0" y1="0" x2="0" y2="-170" stroke="#5BA6D6" stroke-width="22" stroke-linecap="round"/><path d="M-40 -30 L0 -40 L40 -30" stroke="#9AA3AE" stroke-width="8" fill="none"/>`
  + `<rect x="-70" y="-28" width="140" height="56" rx="26" fill="#FFFDF7" stroke="#D7CCBB" stroke-width="5"/>`
  + (fur > 0 ? `<rect x="-66" y="-24" width="132" height="48" rx="22" fill="#C9A27A" opacity="${Math.min(.9, fur).toFixed(2)}"/>` : '') + `</g>`;
// 毛の山（底の中心 x,y・大きさ s）。eyes で目がつく
const FURBALL = (x, y, s, eyes, t) => { if (s <= 0) return ''; let g = `<g transform="translate(${x} ${y}) scale(${s})">`;
  const P = [[0, -120, 120], [-90, -70, 80], [90, -70, 80], [-50, -170, 70], [50, -175, 72], [0, -220, 60], [-120, -30, 50], [120, -30, 50], [0, -40, 100]];
  for (const [a, b, r] of P) g += `<circle cx="${a}" cy="${b}" r="${r}" fill="#C9A27A"/>`;
  for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2, R = 150 + (i % 3) * 20; g += `<path d="M${Math.cos(a) * R * .8} ${-120 + Math.sin(a) * R * .75} l${Math.cos(a) * 14} ${Math.sin(a) * 12}" stroke="#B89268" stroke-width="5" opacity=".6" stroke-linecap="round"/>`; }
  for (const [a, b, r] of P.slice(0, 3)) g += `<circle cx="${a - r * .3}" cy="${b - r * .3}" r="${r * .35}" fill="#E2C49E" opacity=".5"/>`;
  if (eyes > 0) g += `<g opacity="${eyes}"><circle cx="-40" cy="-130" r="14" fill="#3A2A20"/><circle cx="40" cy="-130" r="14" fill="#3A2A20"/><circle cx="-36" cy="-135" r="4" fill="#fff"/><circle cx="44" cy="-135" r="4" fill="#fff"/><path d="M-10 -100 q10 8 20 0" stroke="#3A2A20" stroke-width="5" fill="none" stroke-linecap="round"/></g>`;
  return g + '</g>'; };
var EP = {
  dur: 9.5,
  bgmHolds: '5.6-6.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.7, type: 'swish' }, { t: 1.1, type: 'swish' }, { t: 1.5, type: 'chime' }, { t: 2.4, type: 'blink' }, { t: 2.9, type: 'swish' }, { t: 3.3, type: 'swish' }, { t: 3.7, type: 'swish' }, { t: 4.1, type: 'swish' }, { t: 4.5, type: 'swish' }, { t: 4.9, type: 'swish' },
    { t: 5.6, type: 'thump' }, { t: 6.6, type: 'blink' }, { t: 7.3, type: 'twitch' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [15, 0] });
    const groom = t >= 2.8 && t < 5.4, g = ease(seg(t, 2.8, 5.4));
    const rs = 1.35 - .28 * g;                                   // 課長がだんだん細く
    // ジル（左）：机をコロコロ（にこ）→ 課長の毛に気づく「！」→ 課長をコロコロ（lean）→ 毛の山を見て固まる → ジト目
    const jface = t < 2.2 ? RIG.FACES.smile : t < 2.8 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : t < 5.4 ? RIG.FACES.sharp : t < 6.8 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : RIG.FACES.annoyed;
    L.char('jil', Object.assign({}, groom || t < 2.0 ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 30, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: .8, bodyTilt: groom ? -14 : t < 2.0 ? -8 : 0 }), t, '', {});
    // レン（右）：ふわふわ → コロコロされて気持ちよさそう（照れ）→ 細くなってご満悦
    const rface = t < 2.8 ? RIG.FACES.neutral : t < 5.4 ? Object.assign({}, RIG.FACES.shy, { heart: 1 }) : RIG.FACES.smug;
    L.char('ren', Object.assign({}, RIG.POSES.sit, rface, { x: 540 + (1.35 - rs) * 260, y: DESK - 413 * rs, scale: rs, flip: true, eyeLook: .2 }), t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // 毛の山（課長とジルの間）
    const pile = groom ? g * .95 : t >= 5.4 ? .95 + .25 * outBack(seg(t, 5.4, 5.8)) : 0;
    fx += FURBALL(560, DESK + 6, pile * .9, t >= 6.4 ? Math.min(1, (t - 6.4) * 4) : 0, t);
    // コロコロ：机 → 課長の体（上下に動く）
    if (t < 2.0) fx += ROLLER(300 + Math.sin(t * 7) * 90, DESK - 30, 90, 0);
    else if (groom) { const k = Math.sin(t * 9); fx += ROLLER(840 + k * 70, DESK - 150 + Math.cos(t * 9) * 40, 120 + k * 10, .4 + .6 * Math.abs(Math.sin(t * 2.2))); }
    else if (t >= 5.4) fx += ROLLER(330, DESK - 30, 80, .8);
    // ふわふわ舞う毛
    if (t > 1.6 && t < 5.6) fx += `<g fill="#C9A27A" opacity=".8">${[0, 1, 2, 3, 4, 5].map(i => { const k = (t * .6 + i / 6) % 1; return `<circle cx="${760 + Math.sin(i * 2.1 + t) * 180}" cy="${1200 - k * 380}" r="${6 + (i % 3) * 2}" opacity="${(1 - k).toFixed(2)}"/>`; }).join('')}</g>`;
    if (t > 5.4 && t < 5.8) fx += L.impact(560, DESK - 160, seg(t, 5.4, 5.8), .7, '#C9A27A');
    if (t > 7.0 && t < 8.6) fx += L.emark(200, DESK - 650, 1.0, '…');
    let ui = (t > 0.6 && t < 2.2 ? CHIP(L, 'YEAR-END CLEANING', '年末の大そうじ、コロコロ', 1640, seg(t, .6, .9)) : '')
      + (t > 3.2 && t < 5.2 ? CHIP(L, 'THE BOSS: FLUFFY', '上司もコロコロ', 1640, seg(t, 3.2, 3.5)) : '')
      + (t > 6.4 && t < 8.6 ? CHIP(L, 'FUR: ONE MORE BOSS', '毛だけで、上司もう1匹', 1640, seg(t, 6.4, 6.7)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 340, cy: 1200 },
      { t: 0.01, z: 1.05, cx: 520, cy: 1200, d: .9 },
      { t: 2.8, z: 1.2, cx: 700, cy: 1180, d: .5 },                 // コロコロ
      { t: 5.4, z: 1.0, cx: 560, cy: 1180, d: .4 },                 // 毛の山
      { t: 6.4, z: 1.25, cx: 600, cy: 1200, d: .5 },                // 目がついた
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
