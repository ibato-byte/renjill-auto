// 「新しいイス」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：新しいオフィスチェアが届く（右はしでくるっと回って見せる）。ジルはうれしい（にこ）
// ひっくり返し：課長のイスは……課長は乗らずに、届いた段ボール箱の中へ
// オチ：箱の中でご満悦。イスはからっぽ。字幕「新しいイス：箱のほうが人気」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
// オフィスチェア（下の中心 x,y・回転 spin）
const CHAIR = (x, y, spin) => { const w = Math.abs(Math.cos(spin)) * 1 + .25;
  return `<g transform="translate(${x} ${y})"><path d="M-110 0 L110 0 M0 0 L0 -18" stroke="#3E4650" stroke-width="12" stroke-linecap="round"/><circle cx="-110" cy="6" r="12" fill="#2B3138"/><circle cx="110" cy="6" r="12" fill="#2B3138"/><circle cx="0" cy="6" r="12" fill="#2B3138"/>`
    + `<rect x="-10" y="-120" width="20" height="104" fill="#5A6470"/><rect x="${-130 * w}" y="-150" width="${260 * w}" height="40" rx="18" fill="#2F6FA8"/><rect x="${-110 * w}" y="-380" width="${220 * w}" height="230" rx="40" fill="#3A80BE" stroke="#2F6FA8" stroke-width="8"/></g>`; };
// 段ボール箱（下の中心 x,y・ふた open）
const BOX = (x, y, open) => `<g transform="translate(${x} ${y})"><rect x="-190" y="-170" width="380" height="170" rx="6" fill="#C79A6C" stroke="#9C7448" stroke-width="6"/><rect x="-40" y="-170" width="80" height="170" fill="#D9B48A" opacity=".6"/>`
  + `<path d="M-190 -170 L${-190 - 70 * open} ${-170 - 90 * open} L-30 ${-170 - 90 * open} L0 -170 Z" fill="#B88A5C" stroke="#9C7448" stroke-width="5"/><path d="M190 -170 L${190 + 70 * open} ${-170 - 90 * open} L30 ${-170 - 90 * open} L0 -170 Z" fill="#B88A5C" stroke="#9C7448" stroke-width="5"/>`
  + `<text y="-70" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="34" fill="#7A5634">新品・イス</text></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '5.2-5.8',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.7, type: 'thump' }, { t: 1.3, type: 'chime' }, { t: 2.0, type: 'swish' }, { t: 2.4, type: 'swish' }, { t: 2.8, type: 'swish' }, { t: 3.6, type: 'blink' },
    { t: 4.4, type: 'boing' }, { t: 4.9, type: 'thump' }, { t: 5.6, type: 'chime' }, { t: 7.0, type: 'blink' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400, FLOOR = 1640;
    const bg = L.office({ sky: 'day', clock: [10, 0] });
    const arrive = outBack(seg(t, .4, .9));
    const spin = t >= 1.8 && t < 3.4 ? (t - 1.8) * 9 : 0;
    const hop = seg(t, 4.3, 4.9), inBox = t >= 4.9;
    // ジル（左）：イスにすわる → くるくる（にこ）→ 課長を見て「？」→ 箱に「…」
    const jface = t < 1.6 ? RIG.FACES.neutral : t < 3.4 ? Object.assign({}, RIG.FACES.smile, { sparkle: 1 }) : t < 4.9 ? Object.assign({}, RIG.FACES.think, { question: 1 }) : t < 6.4 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : RIG.FACES.annoyed;
    // レン：イスを見る → 箱を見て目がきらきら → ぴょんと箱の中へ（binky）→ 箱の中でご満悦
    const rface = t < 3.4 ? RIG.FACES.neutral : t < 4.3 ? Object.assign({}, RIG.FACES.smile, { sparkle: 1 }) : t < 4.9 ? RIG.FACES.smile : Object.assign({}, RIG.FACES.smug, { sparkle: t < 6.6 ? 1 : 0 });
    const rx0 = 560, rx1 = 520, ry0 = DESK - 413 * 1.35 - 40, ry1 = FLOOR - 413 * 1.1 - 150;
    const rx = rx0 + (rx1 - rx0) * hop, ry = ry0 + (ry1 - ry0) * hop - Math.sin(hop * Math.PI) * 220;
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`;
    // （この回は机の手前に、イスと箱を置く）
    L.char('jil', Object.assign({}, RIG.POSES.sit, jface, { x: 30, y: DESK - 413 * 1.3 - 40, scale: 1.3, eyeLook: t >= 3.4 ? .9 : 0, bodyTilt: 0 }), t, '', {});
    L.char('ren', Object.assign({}, t >= 4.3 && t < 4.9 ? RIG.POSES.binky : RIG.POSES.sit, rface, { x: inBox ? rx1 : rx, y: inBox ? ry1 : ry, scale: inBox ? 1.1 : 1.35, flip: true, eyeLook: -.3 }), t, '', {});
    // 新しいイスは右はし（だれも座らない）、届いた箱はまんなかの手前。キャラの顔にかぶらない位置
    let front = `<g transform="translate(0 ${-30 * (1 - arrive)})" opacity="${arrive}">${CHAIR(990, FLOOR + 60, spin)}</g>`;
    front += BOX(780, FLOOR + 170, inBox ? 1 : .6);
    fx += front;
    if (t > 4.8 && t < 5.2) fx += L.impact(780, FLOOR - 40, seg(t, 4.8, 5.2), .8, '#C79A6C');
    if (t > 5.2 && t < 6.6) fx += L.sparkles(780, FLOOR - 220, t, 1.2, 6);
    if (t > 7.0 && t < 8.6) fx += L.emark(240, DESK - 690, 1.0, '…');
    let ui = (t > 0.8 && t < 2.6 ? CHIP(L, 'NEW CHAIR!', '新しいイスが届いた', 1760, seg(t, .8, 1.1)) : '')
      + (t > 6.0 && t < 8.6 ? CHIP_OFF(L, 'THE BOX WINS', '新しいイス：箱のほうが人気', 1760, seg(t, 6.0, 6.3)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.2, cx: 540, cy: 1300 },
      { t: 0.01, z: 1.0, cx: 540, cy: 1200, d: .9 },
      { t: 3.4, z: 1.15, cx: 660, cy: 1280, d: .5 },                // 箱を見る
      { t: 5.0, z: 1.3, cx: 760, cy: 1380, d: .5 },                 // 箱の中
      { t: 6.8, z: 1.0, cx: 540, cy: 1220, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 4.9 && t < 5.1 ? 5 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
