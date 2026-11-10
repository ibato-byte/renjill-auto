// 「手編みのマフラー」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：12月。ジルが上司に手編みのマフラー（赤）を渡す。レンは照れる
// ひっくり返し：巻いても巻いても終わらない（5周）→ 余りが机をこえてジルまで届く
// オチ：二人で一本のマフラーをぐるぐる。字幕「長さ：5メートル。二人用」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 総見直し（2026-11-10）：字幕は2回まで。3回目以降（オチの説明）は出さず、絵で見せる
// マフラーの巻き（首に n 周）＋ 余りの帯
const WRAP = (x, y, n, w = 300) => { let s = ''; for (let i = 0; i < n; i++) { const ww = w + i * 24; s += `<path d="M${x - ww / 2} ${y + i * 24} q${ww / 2} ${34} ${ww} 0" fill="none" stroke="${i % 2 ? '#E8473A' : '#F2B544'}" stroke-width="30" stroke-linecap="round"/>`; } return s; };
const BAND = (pts) => `<path d="M${pts.map(p => p.join(' ')).join(' L')}" fill="none" stroke="#E8473A" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/><path d="M${pts.map(p => p.join(' ')).join(' L')}" fill="none" stroke="#F2B544" stroke-width="30" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="40 40"/>`;
var EP = {
  dur: 9.5,
  bgmHolds: '5.4-6.0',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.0, type: 'swish' }, { t: 1.6, type: 'pon' }, { t: 2.6, type: 'swish' }, { t: 3.1, type: 'swish' }, { t: 3.6, type: 'swish' }, { t: 4.1, type: 'swish' }, { t: 4.6, type: 'swish' }, { t: 5.1, type: 'swish' }, { t: 5.5, type: 'twitch' },
    { t: 6.2, type: 'whoosh' }, { t: 6.8, type: 'swish' }, { t: 7.3, type: 'swish' }, { t: 7.9, type: 'pon' }, { t: 8.3, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [10, 0] });
    const given = t >= 1.6;
    const wraps = t < 2.6 ? 0 : Math.min(5, Math.floor((t - 2.1) / 0.5));        // 2.6〜4.6 で 1〜5 周
    const reach = t >= 6.2 ? ease(seg(t, 6.2, 6.8)) : 0;                          // 余りがジルへ
    const jwraps = t < 6.8 ? 0 : Math.min(3, Math.floor((t - 6.3) / 0.5));        // ジルにも 1〜3 周
    // ジル（左）：渡す（lean）→ 見守る（にこ）→ 余りが来て「？」→ 自分も巻かれて照れ
    const jface = t < 5.5 ? RIG.FACES.smile : t < 6.8 ? RIG.FACES.think : RIG.FACES.shy;
    const jp = Object.assign({}, t > 0.8 && t < 1.8 ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 40, y: DESK - 413 * 1.3, scale: 1.3, bodyTilt: t > 0.8 && t < 1.8 ? -10 : 0, eyeLook: .8, question: t >= 5.5 && t < 6.8 ? 1 : 0 });
    L.char('jil', jp, t, '', {});
    // レン（右）：もらって照れ → 巻く（頭を左右に）→ 終わらなくて汗 → 二人で巻かれてにこにこ
    const rface = t < 2.6 ? RIG.FACES.shy : t < 5.0 ? RIG.FACES.smile : t < 6.8 ? Object.assign({}, RIG.FACES.oops, { sweat: 1 }) : RIG.FACES.shy;
    const rp = Object.assign({}, RIG.POSES.sit, rface, { x: 540, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: .4, headTilt: t >= 2.6 && t < 4.8 ? Math.sin(t * 12) * 8 : 0, bodySquash: t >= 2.6 && t < 4.8 ? Math.abs(Math.sin(t * 12)) * .08 : 0 });
    L.char('ren', rp, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // 包み（1.0 にジルからレンへ滑る）→ 1.6 ほどける
    if (t > 0.8 && t < 1.6) { const k = ease(seg(t, 1.0, 1.5)); fx += `<g transform="translate(${300 + 400 * k} ${DESK - 120 - Math.sin(k * Math.PI) * 60}) rotate(${k * 20})"><rect x="-80" y="-60" width="160" height="120" rx="14" fill="#F7E7D0" stroke="#D9B98E" stroke-width="6"/><rect x="-10" y="-60" width="20" height="120" fill="#E8473A"/><rect x="-80" y="-10" width="160" height="20" fill="#E8473A"/></g>`; }
    // レンの首のマフラー（首の位置：x 905, y DESK-210 あたり）
    if (given) fx += WRAP(905, DESK - 215, Math.max(1, wraps), 300);
    // 余り：机の上を左へ伸びてジルへ
    if (t >= 4.6) { const len = reach; const pts = [[760, DESK - 190], [700, DESK - 60], [560, DESK - 40]]; if (len > 0) { pts.push([560 - 200 * len, DESK - 40 - 60 * len]); pts.push([400 - 60 * len, DESK - 160 * len]); } fx += BAND(pts); }
    if (jwraps > 0) fx += WRAP(410, DESK - 215, jwraps, 280);
    if (t > 1.6 && t < 2.2) fx += L.sparkles(905, DESK - 300, t, .9, 5);
    if (t > 4.8 && t < 6.2) fx += L.emark(900, DESK - 700, 1.0, '…');
    if (t > 6.2 && t < 6.8) fx += L.speed(300, DESK - 100, (1 - seg(t, 6.2, 6.8)) * .5, 16);
    if (t > 7.9) fx += L.sparkles(540, DESK - 420, t, 1.0, 6);
    let ui = (t > 1.8 && t < 3.3 ? CHIP(L, 'A SCARF FROM JILL', 'ジルの手編みのマフラー。上司へ', 1380, seg(t, 1.8, 2.1)) : '')
      + (t > 4.8 && t < 6.2 ? CHIP(L, '5 WRAPS. STILL GOING.', '5周巻いても、まだ余る', 1380, seg(t, 4.8, 5.1)) : '')
      + (t > 7.4 && t < 8.6 ? CHIP_OFF(L, 'LENGTH: 5 M. FOR TWO.', '長さ：5メートル。二人用', 1380, seg(t, 7.4, 7.7)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 540, cy: 1150 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1120, d: .9 },
      { t: 2.5, z: 1.3, cx: 760, cy: 1150, d: .5 },                 // 巻く
      { t: 6.1, z: 1.0, cx: 540, cy: 1100, d: .4 },                 // 引き：ジルまで
      { t: 7.8, z: 1.15, cx: 540, cy: 1120, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
