// 「かくれんぼ」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：昼休み。ジルが目をつぶって 3・2・1 と数える
// ひっくり返し：課長はペンを1本、顔の前に立てただけ。体も顔もまる見え（本人は目をつぶって、かくれたつもり）
// （顔が0.75秒以上かくれると描画QAで止まるので、細いペンにした。2026-11-08）
// オチ：ジルが箱をトン → 課長「見つかった？」の顔。字幕「1秒で発見」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
// ペン（下の中心 x,y・回転 r）
const PEN = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-16" y="-430" width="32" height="400" rx="14" fill="#5BA6D6" stroke="#3E7FAE" stroke-width="5"/><rect x="-18" y="-470" width="36" height="60" rx="12" fill="#2B5E8A"/><path d="M-16 -30 L16 -30 L0 10 Z" fill="#F2D3A8" stroke="#C9A06A" stroke-width="4"/><path d="M-4 0 L4 0 L0 10 Z" fill="#3A2414"/></g>`;
  + `<g fill="#F5B8C4">${[[-90, -40], [-20, 30], [60, -50], [100, 50], [-110, 60]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="14"/><circle cx="${a + 14}" cy="${b + 10}" r="9" fill="#F7D36A"/>`).join('')}</g>`
  + `<ellipse cx="0" cy="-108" rx="70" ry="14" fill="#E9E1D3"/><path d="M-30 -110 C-20 -170 30 -160 20 -112 Z" fill="#FFFFFF" stroke="#E3D9C8" stroke-width="4"/></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '4.2-4.8',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.7, type: 'tap' }, { t: 1.3, type: 'tap' }, { t: 1.9, type: 'tap' }, { t: 2.3, type: 'swish' }, { t: 2.6, type: 'pon' }, { t: 3.0, type: 'chime' },
    { t: 3.6, type: 'blink' }, { t: 4.3, type: 'twitch' }, { t: 5.7, type: 'tap' }, { t: 6.0, type: 'boing' }, { t: 7.0, type: 'blink' }, { t: 8.1, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400, HX = 812, HY = 1130;                  // レンの頭（だいたい）
    const bg = L.office({ sky: 'day', clock: [12, 30] });
    const counting = t < 2.9;
    // ジル（左）：目をつぶって数える → 目を開けてきょろきょろ → 見つけて「…」→ 箱をトン（lean）→ ジト目
    const jface = counting ? RIG.FACES.smile : t < 3.8 ? RIG.FACES.think : t < 5.5 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : RIG.FACES.annoyed;
    const tap = t >= 5.4 && t < 6.1;
    const jp = Object.assign({}, tap ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 30, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: t >= 2.9 && t < 3.8 ? Math.sin(t * 8) * .9 : .8, bodyTilt: tap ? -16 : 0, question: t >= 3.0 && t < 3.8 ? 1 : 0 });
    L.char('jil', jp, t, '', {});
    // レン（右）：きょろきょろ → 箱を頭に（2.3〜2.6）→ じっと（しっぽ・体がぷるぷる）→ 箱が取れて「見つかった？」の顔
    const boxOn = t >= 2.6 && t < 6.0;
    const rface = t < 2.3 ? Object.assign({}, RIG.FACES.smile, { sparkle: t > 1.6 ? 1 : 0 }) : t < 6.0 ? RIG.FACES.smile : t < 7.0 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : RIG.FACES.oops;
    const rp = Object.assign({}, RIG.POSES.sit, rface, { x: 540, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: t < 2.3 ? Math.sin(t * 5) * .8 : .5, bodyTilt: boxOn ? Math.sin(t * 30) * 1.5 : 0 });
    L.char('ren', rp, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // 数える 3・2・1
    if (counting) { const n = 3 - Math.min(2, Math.floor(t / .6 - .8)); if (t > .5) fx += `<text x="270" y="${DESK - 640}" text-anchor="middle" font-family="Noto Sans" font-weight="900" font-size="${120 * outBack(Math.min(1, ((t - .5) % .6) * 5))}" fill="#E8473A" stroke="#FFF7E8" stroke-width="10" paint-order="stroke">${n}</text>`; }
    // 箱：机の上 → 頭へ → 頭の上（3.0〜6.0）→ トンで飛ぶ
    // ペン：机の上（寝かせてある）→ 顔の前に立てる（2.3〜2.6）→ トンで倒れる（6.0〜）
    if (t < 2.3) fx += PEN(1000, DESK - 20, 90);
    else if (t < 6.0) { const u = ease(seg(t, 2.3, 2.6)); fx += PEN(1000 + (HX - 1000) * u, DESK - 20 + 40 * (1 - u), 90 * (1 - u) + (t > 2.6 ? Math.sin(t * 30) * 1.5 : 0)); }
    else { const u = ease(seg(t, 6.0, 6.5)); fx += PEN(HX + 60 * u, DESK - 20 + 20 * u, 85 * u); }
    if (t > 2.6 && t < 2.9) fx += L.impact(HX, HY - 160, seg(t, 2.6, 2.9), .6, '#5BA6D6');
    if (t > 5.9 && t < 6.3) fx += L.impact(HX, HY, seg(t, 5.9, 6.3), .8, '#F2C230');
    if (t > 4.6 && t < 5.4) fx += L.emark(220, DESK - 650, 1.0, '…');
    let ui = (t > 0.6 && t < 2.6 ? CHIP(L, 'HIDE AND SEEK', 'かくれんぼ。ジルが数える', 1580, seg(t, .6, .9)) : '')
      + (t > 3.9 && t < 5.6 ? CHIP_OFF(L, 'BOSS: HIDDEN (?)', '上司：ペンの後ろにかくれた', 1580, seg(t, 3.9, 4.2)) : '')
      + (t > 6.6 && t < 8.6 ? CHIP_OFF(L, 'FOUND IN 1 SEC', '1秒で発見', 1580, seg(t, 6.6, 6.9)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.4, cx: 300, cy: 1100 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1150, d: .9 },
      { t: 3.0, z: 1.3, cx: 330, cy: 1150, d: .4 },                 // ジルが目を開ける
      { t: 3.8, z: 1.0, cx: 620, cy: 1150, d: .5 },                 // まる見えの上司（引き）
      { t: 6.0, z: 1.35, cx: 720, cy: 1150, d: .4 },                // 見つかった顔
      { t: 7.2, z: 1.08, cx: 540, cy: 1150, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
