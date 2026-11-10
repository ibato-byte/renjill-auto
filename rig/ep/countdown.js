// 「カウントダウン」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：大みそかの夜。時計は 23:59。ジルはクラッカーを持って 3・2・1（わくわく）。課長は横でぐっすり
// ひっくり返し：0:00、ジルのクラッカーがパーン（紙ふぶき）。課長は起きない
// オチ：0:01、課長がはっと起きて、1人でクラッカーをパーン（ジルの頭に紙テープ）。字幕「上司、1分遅れて新年」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 総見直し（2026-11-10）：字幕は2回まで。3回目以降（オチの説明）は出さず、絵で見せる
// クラッカー（先 x,y・向き r）
const POPPER = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(1.4)"><path d="M0 0 L-26 90 L26 90 Z" fill="#F2C230" stroke="#C9A24A" stroke-width="4"/><path d="M-12 40 l24 -6 M-18 64 l36 -8" stroke="#E8473A" stroke-width="6"/></g>`;
const CONFETTI = (x, y, k, seed) => { if (k <= 0 || k >= 1) return ''; const C = ['#E8473A', '#F2C230', '#5BC0F0', '#7EDB6A', '#FF8FC8']; let s = '';
  for (let i = 0; i < 26; i++) { const a = -Math.PI / 2 + Math.sin(i * 12.9 + seed) * 1.1, v = 300 + (i * 37 % 100) * 3, px = x + Math.cos(a) * v * k, py = y + Math.sin(a) * v * k + 500 * k * k; s += `<rect x="${px}" y="${py}" width="22" height="12" fill="${C[i % 5]}" transform="rotate(${i * 40 + k * 300} ${px} ${py})" opacity="${(1 - k * .7).toFixed(2)}"/>`; }
  return s; };
var EP = {
  dur: 9.5,
  bgmHolds: '4.4-5.0',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.2, type: 'tap' }, { t: 2.0, type: 'tap' }, { t: 2.8, type: 'tap' }, { t: 3.6, type: 'boing' }, { t: 3.7, type: 'chime' }, { t: 4.6, type: 'blink' },
    { t: 5.6, type: 'twitch' }, { t: 6.0, type: 'boing' }, { t: 6.6, type: 'blink' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const newYear = t >= 3.6, rUp = t >= 5.5;
    const min = t < 3.6 ? [23, 59] : t < 5.5 ? [0, 0] : [0, 1];
    const bg = L.office({ sky: 'night', clock: min });
    // ジル（左）：クラッカーを持ってわくわく → 3・2・1 → パーン（にこ・きらきら）→ 課長を見る「…」→ 紙テープが頭に → ジト目
    const jface = t < 3.6 ? Object.assign({}, RIG.FACES.smile, { sparkle: 1 }) : t < 4.4 ? Object.assign({}, RIG.FACES.smile, { sparkle: 1 }) : t < 6.0 ? RIG.FACES.think : t < 6.8 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : RIG.FACES.annoyed;
    L.char('jil', Object.assign({}, t >= 3.6 && t < 4.2 ? RIG.POSES.binky : RIG.POSES.sit, jface, { x: 20, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: t >= 4.4 ? .8 : .2 }), t,
      (t < 3.6 ? POPPER(380, 1160, 30) : POPPER(380, 1160, 15)) + (t >= 6.1 ? `<path d="M200 960 q60 -30 120 10 q50 30 110 -10" stroke="#5BC0F0" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M230 980 q40 40 90 20" stroke="#FF8FC8" stroke-width="10" fill="none" stroke-linecap="round"/>` : ''), {});
    // レン（右）：ぐっすり（sleepy・loaf）→ 0:01 はっと起きる（びっくり）→ 1人でパーン（binky・きらきら）→ ご満悦
    const rface = !rUp ? RIG.FACES.sleepy : t < 6.0 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : t < 6.8 ? Object.assign({}, RIG.FACES.smile, { sparkle: 1 }) : RIG.FACES.smug;
    L.char('ren', Object.assign({}, !rUp ? RIG.POSES.loaf : t >= 6.0 && t < 6.6 ? RIG.POSES.binky : RIG.POSES.sit, rface, { x: 560, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: -.5 }), t,
      rUp ? POPPER(700, 1180, -20) : '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // 大きな時計表示（机の上のデジタル）
    fx += `<g transform="translate(540 ${DESK - 30})"><rect x="-120" y="-56" width="240" height="96" rx="14" fill="#2B3142" stroke="#5A6470" stroke-width="5"/><text y="12" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="56" fill="${newYear ? '#F2C230' : '#9BE3FF'}">${String(min[0]).padStart(2, '0')}:${String(min[1]).padStart(2, '0')}</text></g>`;
    // 3・2・1
    if (t > 1.0 && t < 3.6) { const n = t < 1.8 ? 3 : t < 2.6 ? 2 : 1, k = ((t - 1.0) % .8) / .8; fx += `<text x="300" y="${DESK - 640}" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="${130 * outBack(Math.min(1, k * 4))}" fill="#F2C230" stroke="#3A2414" stroke-width="10" paint-order="stroke">${n}</text>`; }
    // 紙ふぶき（ジル 3.6、課長 6.0）
    fx += CONFETTI(380, 1160, seg(t, 3.6, 5.0), 1) + CONFETTI(700, 1180, seg(t, 6.0, 7.4), 7);
    if (t > 3.6 && t < 4.6) fx += `<text x="540" y="${DESK - 560}" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="${96 * outBack(seg(t, 3.6, 3.9))}" fill="#FFF7E8" stroke="#E8473A" stroke-width="10" paint-order="stroke">HAPPY NEW YEAR</text>`;
    if (t > 4.6 && t < 5.5) fx += L.emark(220, DESK - 650, 1.0, '…');
    let ui = (t > 0.4 && t < 1.0 ? CHIP(L, "NEW YEAR'S EVE 23:59", '大みそか 23:59', 1640, seg(t, .4, .6)) : '')
      + (t > 4.6 && t < 5.5 ? CHIP(L, 'THE BOSS: ASLEEP', '上司：寝てた', 1640, seg(t, 4.6, 4.9)) : '')
      + (t > 6.6 && t < 8.6 ? CHIP_OFF(L, 'BOSS: 1 MIN LATE', '上司、1分遅れて新年', 1640, seg(t, 6.6, 6.9)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 540, cy: 1250 },
      { t: 0.01, z: 1.05, cx: 520, cy: 1200, d: .9 },
      { t: 3.5, z: 1.0, cx: 540, cy: 1100, d: .3 },                 // 0:00
      { t: 4.6, z: 1.3, cx: 720, cy: 1200, d: .5 },                 // 寝てる課長
      { t: 6.0, z: 1.0, cx: 540, cy: 1150, d: .4 },                 // 1人でパーン
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: (t > 3.6 && t < 3.8) || (t > 6.0 && t < 6.2) ? 6 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
