// 「カイロ10個」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：寒い朝のオフィス（窓に霜）。ジルが上司にカイロを1個あげる → レンはぽかぽか（にこ）
// ひっくり返し：レンが引き出しからカイロを次々出して体じゅうに貼る（数字 1→10）→ 汗だく・湯気。ジルはぶるぶる（カイロ0）
// オチ：レンが1個はがしてジルに返す → ジルぽかぽか（♥）。字幕「上司10個、ジル1個」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 総見直し（2026-11-10）：字幕は2回まで。3回目以降（オチの説明）は出さず、絵で見せる
const KAIRO = (x, y, s = 1, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><rect x="-34" y="-44" width="68" height="88" rx="10" fill="#FFF7EE" stroke="#E8A070" stroke-width="4"/><rect x="-22" y="-26" width="44" height="30" rx="6" fill="#F27B3A"/><text y="-4" text-anchor="middle" font-family="Noto Sans" font-weight="900" font-size="18" fill="#fff">HOT</text><path d="M-16 20 h32" stroke="#E8A070" stroke-width="4" stroke-linecap="round"/></g>`;
// レンの体に貼る位置（顔＝鼻 world 837,1155 のまわりは避ける）
const SPOTS = [[760, 1290, -12], [900, 1300, 10], [700, 1360, -20], [960, 1360, 16], [830, 1350, 0], [640, 1290, -24], [1010, 1280, 22], [760, 1380, 8], [900, 1380, -8], [1040, 1340, 30]];
const STEAM = (x, y, t, k) => k <= 0 ? '' : `<g fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity="${.8 * k}">${[0, 1, 2].map(i => { const ph = (t * 1.2 + i * .33) % 1; return `<path d="M${x - 60 + i * 60} ${y - ph * 120} q16 -24 0 -48 q-16 -24 0 -48" opacity="${1 - ph}"/>`; }).join('')}</g>`;
const FROST = `<g fill="#fff" opacity=".55">${[[90, 270], [150, 330], [330, 260], [380, 600], [720, 280], [990, 300], [940, 610], [700, 590]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="26"/><circle cx="${x + 24}" cy="${y + 14}" r="16"/>`).join('')}</g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '5.6-6.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.0, type: 'swish' }, { t: 1.5, type: 'pon' }, { t: 2.6, type: 'click' }, { t: 2.9, type: 'tap' }, { t: 3.2, type: 'tap' }, { t: 3.5, type: 'tap' }, { t: 3.8, type: 'tap' }, { t: 4.1, type: 'tap' }, { t: 4.4, type: 'tap' }, { t: 4.7, type: 'tap' }, { t: 5.0, type: 'tap' }, { t: 5.3, type: 'tap' },
    { t: 5.6, type: 'twitch' }, { t: 6.8, type: 'swish' }, { t: 7.3, type: 'pon' }, { t: 7.9, type: 'chime' }, { t: 8.3, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [9, 0] }) + FROST;
    const n = t < 1.5 ? 0 : t < 2.9 ? 1 : Math.min(10, 1 + Math.floor((t - 2.6) / 0.3));   // 体に貼ったカイロ
    const back = t >= 6.8;                                                              // 1個ジルへ
    const hot = Math.min(1, Math.max(0, (n - 3) / 6));                                   // 汗・湯気の強さ
    // ジル（左）：渡す（lean）→ にこ → 自分の分がなくてぶるぶる（ジト目）→ 返ってきてぽかぽか（shy）
    const cold = t >= 3.0 && t < 7.3;
    const jface = t < 3.0 ? RIG.FACES.smile : t < 7.3 ? RIG.FACES.annoyed : RIG.FACES.shy;
    const jp = Object.assign({}, t > 0.8 && t < 1.6 ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 40, y: DESK - 413 * 1.3, scale: 1.3, bodyTilt: t > 0.8 && t < 1.6 ? -10 : cold ? Math.sin(t * 50) * 2.5 : 0, eyeLook: .8 });
    L.char('jil', jp, t, '', {});
    // レン（右）：もらってにこ → 引き出しから次々（lean・小刻み）→ 汗だく（oops）→ 1個返して照れ
    const busy = t >= 2.6 && t < 5.5;
    const rface = t < 2.6 ? RIG.FACES.smile : t < 5.5 ? RIG.FACES.smug : t < 6.8 ? Object.assign({}, RIG.FACES.oops, { sweat: 1 }) : RIG.FACES.shy;
    const rp = Object.assign({}, busy ? RIG.POSES.lean : RIG.POSES.sit, rface, { x: 540, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: busy ? .2 : .6, bodyTilt: busy ? -6 + Math.sin(t * 30) * 2 : 0, bodySquash: hot * .08 });
    let front = '';
    for (let i = 0; i < n; i++) { if (back && i === n - 1) continue; const [x, y, r] = SPOTS[i]; front += KAIRO(x, y, .9, r); }
    L.char('ren', rp, t, front, {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // 1個目：ジルからレンへ（1.0〜1.5）
    if (t >= 0.9 && t < 1.5) { const k = ease(seg(t, 1.0, 1.45)); fx += KAIRO(330 + 430 * k, DESK - 120 - Math.sin(k * Math.PI) * 80 + 170 * k * k * 0, 1, k * 30); }
    // 引き出しが開いて、カイロの箱
    if (t >= 2.6 && t < 5.6) fx += `<rect x="620" y="${DESK + 70}" width="420" height="150" rx="12" fill="#C98A5A" stroke="#9A6238" stroke-width="6"/><rect x="660" y="${DESK + 40}" width="200" height="90" rx="10" fill="#F27B3A"/><text x="760" y="${DESK + 98}" text-anchor="middle" font-family="Noto Sans" font-weight="900" font-size="34" fill="#fff">HOT ×10</text>`;
    // 返す1個：レンの体からジルへ（6.8〜7.3）
    if (back) { const k = ease(seg(t, 6.8, 7.3)); const [sx, sy] = SPOTS[n - 1]; fx += KAIRO(sx + (300 - sx) * k, sy + (DESK - 140 - sy) * k - Math.sin(k * Math.PI) * 120, k < 1 ? 1 : 1.05, 20 * (1 - k)); }
    // カウント（貼った数）
    if (t >= 2.9 && t < 5.8) fx += `<g transform="translate(540 760)"><circle r="70" fill="#fff" stroke="#F27B3A" stroke-width="10"/><text y="26" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="72" fill="#F27B3A">${n}</text></g>`;
    fx += STEAM(837, 900, t, back ? hot * .4 : hot);
    if (cold) fx += `<g stroke="#9BC7F0" stroke-width="6" stroke-linecap="round" opacity=".9">${[[120, 1060], [430, 1040], [110, 1180], [450, 1170]].map(([x, y], i) => `<path d="M${x} ${y + Math.sin(t * 30 + i) * 6} l${i % 2 ? 22 : -22} 0"/>`).join('')}</g>`;
    if (t > 5.6 && t < 6.6) fx += L.emark(230, DESK - 650, 1.0, '…');
    if (t > 7.3 && t < 7.8) fx += L.impact(300, DESK - 140, seg(t, 7.3, 7.8), .8, '#F27B3A');
    if (t > 7.4) fx += L.sparkles(300, DESK - 220, t, .9, 5);
    let ui = (t > 1.8 && t < 2.9 ? CHIP(L, 'COLD MORNING', '寒い朝。ジルからカイロ1個', 1580, seg(t, 1.8, 2.1)) : '')
      + (t > 5.6 && t < 6.8 ? CHIP(L, 'BOSS: 10. JILL: 0', '上司10個、ジル0個', 1580, seg(t, 5.6, 5.9)) : '')
      + (t > 7.6 && t < 8.6 ? CHIP_OFF(L, 'ONE FOR JILL', '1個、ジルに返した', 1580, seg(t, 7.6, 7.9)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 540, cy: 1150 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1150, d: .9 },
      { t: 2.5, z: 1.2, cx: 720, cy: 1200, d: .4 },                 // 貼っていく
      { t: 5.5, z: 1.05, cx: 540, cy: 1150, d: .4 },                // 引き：10個とぶるぶる
      { t: 7.2, z: 1.25, cx: 420, cy: 1160, d: .5 },                // ジルへ
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
