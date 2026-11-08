// 「窓のくもり」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：寒い朝。窓が白くくもっている。ジルが指で小さなハートをかく（ほっこり）
// ひっくり返し：課長も窓へ。「はぁ〜」と息でもっとくもらせて、大きく、大きく……
// オチ：窓いっぱいに課長の自画像（耳つき・どや顔）。字幕「上司のらくがき：窓いっぱいの自画像」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const DESKFX = (L, DESK) => `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
  + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
// 線を k（0〜1）まで描く（pathLength=1 の破線で）
const DRAW = (d, k, w = 14) => k <= 0 ? '' : `<path d="${d}" pathLength="1" stroke-dasharray="${Math.min(1, k)} 1" stroke="#8FC3E8" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const WL = 70, WR = 690, WY = 230, WW = 320, WH = 420;            // 窓（左・右）
var EP = {
  dur: 9.5,
  bgmHolds: '5.6-6.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.7, type: 'swish' }, { t: 1.2, type: 'swish' }, { t: 2.0, type: 'chime' }, { t: 2.8, type: 'blink' }, { t: 3.3, type: 'swish' },
    { t: 3.9, type: 'swish' }, { t: 4.3, type: 'swish' }, { t: 4.7, type: 'swish' }, { t: 5.1, type: 'swish' }, { t: 5.6, type: 'pon' }, { t: 7.0, type: 'twitch' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [8, 30] });
    // ジル（左）：立って窓にハート（ほっこり）→ 課長の「はぁ〜」に「？」→ 自画像に「！」→ ジト目
    const jUp = t > .5 && t < 2.2;
    const jface = t < 2.2 ? Object.assign({}, RIG.FACES.smile, { blush: .4 }) : t < 3.8 ? Object.assign({}, RIG.FACES.think, { question: 1 }) : t < 5.6 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : RIG.FACES.annoyed;
    L.char('jil', Object.assign({}, jUp ? RIG.POSES.stand : RIG.POSES.sit, jface, { x: 20, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: t > 2.4 ? .9 : .2 }), t, '', {});
    // レン（右）：見ている → 立って窓へ「はぁ〜」→ かく（きりっ）→ ご満悦
    const rUp = t > 2.8 && t < 5.6, breath = t > 3.0 && t < 3.7;
    const rface = t < 2.8 ? RIG.FACES.neutral : breath ? Object.assign({}, RIG.FACES.surprised, { excl: 0, eyeOpen: .3 }) : t < 5.6 ? RIG.FACES.sharp : Object.assign({}, RIG.FACES.smug, { sparkle: t < 7.2 ? 1 : 0 });
    L.char('ren', Object.assign({}, rUp ? RIG.POSES.stand : RIG.POSES.sit, rface, { x: 560, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: -.3, headNod: breath ? -10 : 0 }), t, '', {});
    let fx = DESKFX(L, DESK);
    // くもり（窓の上に白いもや）。右は「はぁ〜」でもっと白く
    const fogR = .55 + .25 * seg(t, 3.0, 3.7);
    fx += `<rect x="${WL}" y="${WY}" width="${WW}" height="${WH}" rx="6" fill="#F4F7FA" opacity=".6"/><rect x="${WR}" y="${WY}" width="${WW}" height="${WH}" rx="6" fill="#F4F7FA" opacity="${fogR}"/>`;
    if (breath) fx += [0, 1, 2, 3].map(i => `<circle cx="${WR + 160 + Math.sin(i * 2.1) * 70}" cy="${WY + 300 - i * 40 - (t - 3.0) * 60}" r="${40 + i * 14 + (t - 3.0) * 40}" fill="#FFFFFF" opacity="${.5 - i * .08}"/>`).join('')
      + `<text x="${WR + 160}" y="${WY + WH + 120}" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="72" fill="#8C7B66" stroke="#FFF7E8" stroke-width="10" paint-order="stroke">はぁ〜</text>`;
    // ジルのハート（左の窓・小さく）
    const hx = WL + 160, hy = WY + 210;
    fx += DRAW(`M${hx} ${hy + 40} C${hx - 70} ${hy - 10} ${hx - 40} ${hy - 60} ${hx} ${hy - 26} C${hx + 40} ${hy - 60} ${hx + 70} ${hy - 10} ${hx} ${hy + 40}`, seg(t, .8, 1.8), 12);
    // 課長の自画像（右の窓いっぱい）：顔の輪 → 耳2本 → 目・鼻・どや口
    const cx = WR + 160, cy = WY + 270;
    fx += DRAW(`M${cx} ${cy - 120} A120 120 0 1 1 ${cx - .1} ${cy - 120}`, seg(t, 3.8, 4.4), 16);
    fx += DRAW(`M${cx - 70} ${cy - 96} C${cx - 110} ${cy - 220} ${cx - 50} ${cy - 250} ${cx - 30} ${cy - 112}`, seg(t, 4.4, 4.7), 16);
    fx += DRAW(`M${cx + 30} ${cy - 112} C${cx + 50} ${cy - 250} ${cx + 110} ${cy - 220} ${cx + 70} ${cy - 96}`, seg(t, 4.7, 5.0), 16);
    const fk = seg(t, 5.0, 5.5);
    if (fk > 0) fx += `<g opacity="${Math.min(1, fk * 3)}" stroke="#8FC3E8" stroke-width="14" fill="none" stroke-linecap="round"><path d="M${cx - 60} ${cy - 20} q20 -16 40 0"/><path d="M${cx + 20} ${cy - 20} q20 -16 40 0"/></g>`
      + (fk > .4 ? `<path d="M${cx - 12} ${cy + 18} L${cx + 12} ${cy + 18} L${cx} ${cy + 32} Z" fill="#8FC3E8"/>` : '')
      + (fk > .7 ? `<path d="M${cx - 40} ${cy + 52} Q${cx} ${cy + 80} ${cx + 40} ${cy + 46}" stroke="#8FC3E8" stroke-width="12" fill="none" stroke-linecap="round"/>` : '');
    if (t > 5.6 && t < 7.0) fx += L.sparkles(cx, cy, t, 1.8, 8);
    if (t > 7.0 && t < 8.6) fx += L.emark(220, DESK - 660, 1.0, '…');
    let ui = (t > 0.8 && t < 2.6 ? CHIP(L, 'FOGGY WINDOW', 'ジル、窓に小さなハート', 1650, seg(t, .8, 1.1)) : '')
      + (t > 6.0 && t < 8.6 ? CHIP(L, 'BOSS DRAWS: HIMSELF', '上司のらくがき：窓いっぱいの自画像', 1650, seg(t, 6.0, 6.3)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.25, cx: 330, cy: 800 },
      { t: 0.01, z: 1.05, cx: 380, cy: 860, d: .9 },
      { t: 2.8, z: 1.05, cx: 760, cy: 860, d: .6 },                 // 課長の番
      { t: 5.6, z: .95, cx: 540, cy: 900, d: .5 },                  // 2つの窓（引き）
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
