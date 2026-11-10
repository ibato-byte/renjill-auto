// 「身長測定」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：健康診断の日。壁の身長計の前で、ジルがぴしっと立つ → 目もりに「ジル」の印
// ひっくり返し：課長の番。せのびしても低い → 足もとに箱を置いてから、すっと乗る（ご満悦）
// オチ：目もりの印は、ずっと上に「課長（箱こみ）」。字幕「身長：箱こみ」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
// 身長計（壁の目もり。x のところに縦の板）
const RULER = (x) => { let s = `<g><rect x="${x - 40}" y="420" width="80" height="1000" rx="10" fill="#FFF8E6" stroke="#D9C49A" stroke-width="5"/>`;
  for (let i = 0; i <= 20; i++) { const y = 1400 - i * 48; s += `<rect x="${x - 40}" y="${y - 2}" width="${i % 5 ? 26 : 48}" height="4" fill="#B89A62"/>`; if (i % 5 === 0 && i) s += `<text x="${x + 16}" y="${y + 12}" font-family="Noto Sans" font-weight="900" font-size="28" fill="#B89A62">${i * 5}</text>`; }
  return s + '</g>'; };
// 印（y の高さに矢印と名前）
const MARK = (x, y, txt, k, col) => k <= 0 ? '' : `<g transform="translate(${x} ${y})" opacity="${Math.min(1, k * 3)}"><path d="M-48 0 L-80 -18 L-80 18 Z" fill="${col}"/><rect x="-250" y="-30" width="170" height="60" rx="14" fill="${col}"/><text x="-165" y="12" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="30" fill="#FFF7E8">${txt}</text></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '5.6-6.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.8, type: 'swish' }, { t: 1.6, type: 'chime' }, { t: 2.8, type: 'swish' }, { t: 3.4, type: 'blink' }, { t: 4.2, type: 'thump' }, { t: 4.9, type: 'boing' },
    { t: 5.6, type: 'chime' }, { t: 6.6, type: 'blink' }, { t: 7.4, type: 'twitch' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const FLOOR = 1640, RX = 760;                                  // 身長計の位置
    const bg = L.office({ sky: 'day', clock: [10, 0], noClock: true });
    // ジル：身長計の前（0.4〜2.6）→ 左へ戻って見ている
    const jIn = ease(seg(t, .3, .8)) - ease(seg(t, 2.2, 2.7));
    const jface = t < 2.6 ? RIG.FACES.sharp : t < 4.9 ? RIG.FACES.neutral : t < 6.6 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : RIG.FACES.annoyed;
    L.char('jil', Object.assign({}, t > .8 && t < 2.2 ? RIG.POSES.stand : RIG.POSES.sit, jface, { x: -60 + 440 * jIn, y: FLOOR - 413 * 1.3, scale: 1.3, eyeLook: t > 2.6 ? .9 : 0 }), t, '', {});
    // レン：2.7 から身長計の前へ → せのび（stand）→ 箱を置く → 箱の上へ（ご満悦）
    const rIn = ease(seg(t, 2.6, 3.1)), onBox = ease(seg(t, 4.6, 5.0)), boxIn = ease(seg(t, 3.9, 4.3));
    const rface = t < 3.4 ? RIG.FACES.neutral : t < 3.9 ? Object.assign({}, RIG.FACES.oops, { sweat: 1 }) : t < 4.6 ? RIG.FACES.sharp : Object.assign({}, RIG.FACES.smug, { sparkle: t < 6.6 ? 1 : 0 });
    L.char('ren', Object.assign({}, t > 3.1 && t < 3.9 ? RIG.POSES.stand : RIG.POSES.sit, rface, { x: 900 - 420 * rIn, y: FLOOR - 413 * 1.35 - 230 * onBox - Math.sin(onBox * Math.PI) * 80, scale: 1.35, flip: true, eyeLook: -.2 }), t, '', {});
    let fx = `<rect x="-500" y="${FLOOR}" width="2080" height="400" fill="#D9C7A8"/><rect x="-500" y="${FLOOR - 8}" width="2080" height="12" fill="#C2AE8C"/>`;
    // 身長計はキャラの後ろの壁……fx は手前に描かれるので、目もりはキャラの右がわ（顔にかからない位置）に置く
    fx = RULER(RX + 330) + fx;
    // 箱（課長の足もと）
    if (boxIn > 0) fx += `<g transform="translate(${760} ${FLOOR + 40 - 0})" opacity="${boxIn}"><rect x="-150" y="-${230 * boxIn + 10}" width="300" height="${230 * boxIn + 10}" rx="8" fill="#C79A6C" stroke="#9C7448" stroke-width="6"/><rect x="-30" y="-${230 * boxIn + 10}" width="60" height="${230 * boxIn + 10}" fill="#D9B48A" opacity=".6"/></g>`;
    // 印：ジル（低め）・課長（箱こみで高い）
    fx += MARK(RX + 290, 1400 - 9.5 * 48, 'ジル', seg(t, 1.4, 1.8), '#5BA6D6');
    fx += MARK(RX + 290, 1400 - 15.5 * 48, '課長', seg(t, 5.4, 5.8), '#E8473A');
    if (t > 5.4) fx += `<text x="${RX + 125}" y="${1400 - 15.5 * 48 + 62}" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="30" fill="#E8473A" opacity="${Math.min(1, (t - 5.4) * 3)}">（箱こみ）</text>`;
    if (t > 5.6 && t < 6.8) fx += L.sparkles(RX + 200, 1400 - 15.5 * 48, t, 1.2, 6);
    if (t > 7.2 && t < 8.6) fx += L.emark(260, FLOOR - 650, 1.0, '…');
    let ui = (t > 0.6 && t < 2.4 ? CHIP(L, 'HEIGHT CHECK', '健康診断の身長測定', 1820, seg(t, .6, .9)) : '')
      + (t > 6.2 && t < 8.6 ? CHIP_OFF(L, 'HEIGHT: BOX INCLUDED', '身長：箱こみ', 1820, seg(t, 6.2, 6.5)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.1, cx: 600, cy: 1250 },
      { t: 0.01, z: .95, cx: 600, cy: 1200, d: .9 },
      { t: 3.0, z: 1.1, cx: 720, cy: 1200, d: .5 },
      { t: 5.2, z: .95, cx: 620, cy: 1100, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 4.2 && t < 4.4 ? 4 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
