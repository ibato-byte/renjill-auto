// 「目覚まし時計」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：昼休みの10分仮眠。ジルの小さな目覚ましが「ピピッ」→ ぱっと起きる（きりっ）
// ひっくり返し：課長は大きなベルの目覚まし。「ジリリリリ！」机も書類もゆれる……課長はぐっすり
// オチ：飛び起きたのはジル（毛が逆立つ）、課長は寝たまま。字幕「上司の目覚まし：ほかの人が起きる」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
const DESKFX = (L, DESK) => `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
  + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
const SMALLCLK = (x, y) => `<g transform="translate(${x} ${y})"><rect x="-44" y="-56" width="88" height="56" rx="12" fill="#E9ECEF" stroke="#9AA3AE" stroke-width="4"/><rect x="-34" y="-46" width="68" height="34" rx="6" fill="#2E3440"/><text y="-21" text-anchor="middle" font-family="Noto Sans" font-weight="900" font-size="22" fill="#7CF0A8">12:10</text></g>`;
const BELLCLK = (x, y, s, sh) => `<g transform="translate(${x} ${y}) rotate(${sh}) scale(${s})"><circle cx="-46" cy="-118" r="26" fill="#E9A23B"/><circle cx="46" cy="-118" r="26" fill="#E9A23B"/><circle cx="0" cy="-60" r="70" fill="#E8473A"/><circle cx="0" cy="-60" r="54" fill="#FFF7E8"/><path d="M0 -60 L0 -96 M0 -60 L24 -48" stroke="#2E3440" stroke-width="7" stroke-linecap="round"/><path d="M-50 0 L-62 16 M50 0 L62 16" stroke="#5E4A3A" stroke-width="10" stroke-linecap="round"/></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '4.4-5.0',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.2, type: 'chime' }, { t: 1.5, type: 'blink' }, { t: 2.6, type: 'swish' }, { t: 3.6, type: 'blink' }, { t: 4.4, type: 'boing' }, { t: 4.6, type: 'tap' },
    { t: 4.8, type: 'tap' }, { t: 5.0, type: 'tap' }, { t: 5.2, type: 'tap' }, { t: 5.4, type: 'thump' }, { t: 6.4, type: 'pon' }, { t: 7.2, type: 'twitch' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400, JN = [263, 1165], RN = [858, 1156];
    const bg = L.office({ sky: 'day', clock: [12, 10] });
    const ring = t >= 4.4 && t < 6.2, jump = seg(t, 4.5, 4.8) * (1 - seg(t, 5.3, 5.7));
    // ジル（左）：仮眠 → ピピッでぱっと起きる（きりっ）→ 課長のベルで飛び上がる（毛が逆立つ）→ ジト目
    const jface = t < 1.2 ? RIG.FACES.sleepy : t < 2.6 ? RIG.FACES.sharp : t < 4.4 ? Object.assign({}, RIG.FACES.smile, { sparkle: 0 }) : t < 6.4 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : RIG.FACES.annoyed;
    L.char('jil', Object.assign({}, jump > .1 ? RIG.POSES.binky : t < 1.2 ? RIG.POSES.loaf : RIG.POSES.sit, jface, { x: 20, y: DESK - 413 * 1.3 - 160 * jump, scale: 1.3, eyeLook: t > 2.6 ? .9 : 0 }), t, '', {});
    // レン（右）：起きている → ベルをセットして寝る → ジリリリでもぐっすり
    const rface = t < 2.6 ? RIG.FACES.neutral : t < 3.6 ? Object.assign({}, RIG.FACES.smug, { sparkle: 0 }) : Object.assign({}, RIG.FACES.sleepy, { zzz: 1 });
    L.char('ren', Object.assign({}, t < 3.6 ? RIG.POSES.sit : RIG.POSES.loaf, rface, { x: 560, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: -.3 }), t, '', {});
    let fx = DESKFX(L, DESK);
    fx += SMALLCLK(420, DESK);
    if (t > 1.2 && t < 1.8) fx += `<text x="420" y="${DESK - 90}" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="44" fill="#3E6FA8" opacity="${1 - seg(t, 1.5, 1.8)}">ピピッ</text>`;
    const sh = ring ? Math.sin(t * 60) * 8 : 0;
    if (t > 2.6) fx += BELLCLK(700, DESK, outBack(seg(t, 2.6, 3.0)) * 1.15, sh);
    if (ring) fx += L.impact(700, DESK - 150, ((t - 4.4) * 3) % 1, 1.1, '#E8473A')
      + `<text x="${560}" y="${DESK - 560}" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="${100 * outBack(seg(t, 4.4, 4.6))}" fill="#E8473A" stroke="#FFF7E8" stroke-width="12" paint-order="stroke" transform="rotate(${Math.sin(t * 30) * 4} 560 ${DESK - 560})">ジリリリリ！</text>`;
    // ジルの毛が逆立つ（頭の上の線）
    if (t > 4.5 && t < 6.6) fx += `<g transform="translate(${JN[0]} ${JN[1] - 200 - 160 * jump})" stroke="#B98A5E" stroke-width="9" stroke-linecap="round">` + [-60, -30, 0, 30, 60].map(a => `<path d="M0 0 L${Math.sin(a * Math.PI / 180) * 60} ${-Math.cos(a * Math.PI / 180) * 60}" transform="translate(${a} 0)"/>`).join('') + '</g>';
    if (t > 7.2 && t < 8.6) fx += L.emark(220, DESK - 660, 1.0, '…');
    let ui = (t > 1.4 && t < 2.8 ? CHIP(L, 'POWER NAP', '昼休みの10分仮眠', 1650, seg(t, 1.4, 1.7)) : '')
      + (t > 6.2 && t < 8.6 ? CHIP_OFF(L, "BOSS'S ALARM: WAKES HER", '上司の目覚まし：ほかの人が起きる', 1650, seg(t, 6.2, 6.5)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 360, cy: 1150 },
      { t: 0.01, z: 1.15, cx: 400, cy: 1130, d: .9 },
      { t: 2.6, z: 1.15, cx: 720, cy: 1120, d: .5 },                 // 課長の番
      { t: 4.4, z: .95, cx: 540, cy: 1040, d: .3 },                  // ジリリリ（引き）
      { t: 6.6, z: 1.1, cx: 500, cy: 1100, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: ring ? 5 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
