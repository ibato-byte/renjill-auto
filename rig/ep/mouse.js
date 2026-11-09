// 「マウス」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：ジルがマウスで、画面の矢印をすいすい動かしてクリック（きりっ）
// ひっくり返し：課長は画面の矢印が気になって、目と頭で追いかける……そして、えいっ
// オチ：画面に肉球のあと、矢印は逃げていく。字幕「上司とマウス：矢印を追いかける」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const DESKFX = (L, DESK) => `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
  + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
const CURSOR = (x, y, s) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 0 L0 34 L9 26 L15 40 L21 37 L15 24 L27 24 Z" fill="#fff" stroke="#2E3440" stroke-width="3" stroke-linejoin="round"/>`;
const PAW = (x, y, s, o) => `<g transform="translate(${x} ${y}) scale(${s})" fill="#C88D85" opacity="${o}"><ellipse cx="0" cy="10" rx="22" ry="18"/><circle cx="-22" cy="-16" r="9"/><circle cx="-7" cy="-26" r="9"/><circle cx="9" cy="-26" r="9"/><circle cx="24" cy="-16" r="9"/></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '5.6-6.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.9, type: 'tap' }, { t: 1.5, type: 'tap' }, { t: 2.1, type: 'chime' }, { t: 2.9, type: 'blink' }, { t: 3.6, type: 'swish' }, { t: 4.2, type: 'swish' },
    { t: 4.8, type: 'swish' }, { t: 5.3, type: 'boing' }, { t: 5.45, type: 'thump' }, { t: 6.3, type: 'pon' }, { t: 7.2, type: 'twitch' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400, MX = 540, MY = 1250, SX0 = MX - 128, SY0 = MY - 268;   // 画面（左上）
    const bg = L.office({ sky: 'day', clock: [13, 30] });
    // 矢印の動き：ジルの番はアイコンへ、課長の番は画面をぐるぐる → 肉球の後は逃げる
    let cx, cy;
    if (t < 2.6) { const k = ease(seg(t, .5, 1.4)); cx = SX0 + 40 + 150 * k; cy = SY0 + 200 - 120 * k; }
    else if (t < 5.3) { const a = (t - 2.6) * 2.4; cx = SX0 + 128 + Math.cos(a) * 80; cy = SY0 + 128 + Math.sin(a * 1.3) * 70; }
    else { const k = ease(seg(t, 5.5, 6.2)); cx = SX0 + 128 + 100 * k; cy = SY0 + 128 - 100 * k; }
    // ジル（左）：マウス（lean・きりっ）→ 満足 → 課長が矢印を追うのに「？」→ 肉球に「！」→ ジト目
    const jl = t > .4 && t < 2.1;
    const jface = t < 2.1 ? RIG.FACES.sharp : t < 3.4 ? Object.assign({}, RIG.FACES.smile, { sparkle: t < 2.8 ? 1 : 0 }) : t < 5.3 ? Object.assign({}, RIG.FACES.think, { question: 1 }) : t < 6.6 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : RIG.FACES.annoyed;
    L.char('jil', Object.assign({}, jl ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 20, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: t > 2.6 ? .9 : .6, bodyTilt: jl ? -6 : 0 }), t, '', {});
    // レン（右）：矢印を目で追う（eyeLook・頭も）→ 身をかがめる → えいっ（nudge）→ ご満悦
    const watch = t > 2.9 && t < 5.2, pounce = t >= 5.2 && t < 5.6;
    const rface = t < 2.9 ? RIG.FACES.neutral : watch ? Object.assign({}, RIG.FACES.sharp, { eyeOpen: 1.15 }) : pounce ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : Object.assign({}, RIG.FACES.smug, { sparkle: t < 7.4 ? 1 : 0 });
    L.char('ren', Object.assign({}, pounce ? RIG.POSES.nudge : watch && t > 4.4 ? RIG.POSES.loaf : RIG.POSES.sit, rface, { x: 560 - (pounce ? 60 : 0), y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: watch ? -.4 - .5 * Math.cos((t - 2.6) * 2.4) : -.3, headTilt: watch ? Math.sin((t - 2.6) * 2.4 * 1.3) * 12 : 0 }), t, '', {});
    let fx = DESKFX(L, DESK);
    fx += `<g><rect x="${MX - 6}" y="${MY}" width="12" height="${DESK - MY}" fill="#7A818C"/><rect x="${MX - 60}" y="${DESK - 12}" width="120" height="14" rx="6" fill="#7A818C"/><rect x="${MX - 140}" y="${MY - 280}" width="280" height="280" rx="14" fill="#3B4252"/><rect x="${SX0}" y="${SY0}" width="256" height="256" rx="6" fill="#DCEAF5"/>`
      + [[30, 30], [100, 30], [170, 30]].map(([x, y], i) => `<rect x="${SX0 + x}" y="${SY0 + y}" width="50" height="44" rx="8" fill="${['#F2C230', '#7FB3D9', '#E8907A'][i]}"/>`).join('') + '</g>';
    if (t > 1.4 && t < 2.0) fx += `<circle cx="${SX0 + 195}" cy="${SY0 + 52}" r="${30 * seg(t, 1.4, 1.7)}" fill="none" stroke="#2E3440" stroke-width="4" opacity="${1 - seg(t, 1.4, 2.0)}"/>`;
    // 肉球のあと（画面に）
    if (t > 5.4) fx += PAW(SX0 + 128, SY0 + 140, 1.2, Math.min(1, (t - 5.4) * 4));
    fx += CURSOR(cx, cy, 1.4);
    // マウス（ジルの手もと）
    fx += `<g transform="translate(330 ${DESK - 16})"><ellipse cx="0" cy="0" rx="34" ry="22" fill="#E9ECEF" stroke="#9AA3AE" stroke-width="4"/><path d="M0 -22 L0 -4" stroke="#9AA3AE" stroke-width="3"/></g>`;
    if (watch) fx += `<text x="${MX + 250}" y="${MY - 330}" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="60" fill="#E8473A" stroke="#FFF7E8" stroke-width="10" paint-order="stroke">じーっ</text>`;
    fx += L.impact(SX0 + 128, SY0 + 140, seg(t, 5.4, 5.8), .7, '#E8473A');
    if (t > 7.2 && t < 8.6) fx += L.emark(220, DESK - 660, 1.0, '…');
    let ui = (t > 0.8 && t < 2.6 ? CHIP(L, 'MOUSE CLICK', 'ジル、マウスですいすい', 1650, seg(t, .8, 1.1)) : '')
      + (t > 6.0 && t < 8.6 ? CHIP(L, 'BOSS VS. THE CURSOR', '上司とマウス：矢印を追いかける', 1650, seg(t, 6.0, 6.3)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 400, cy: 1120 },
      { t: 0.01, z: 1.1, cx: 450, cy: 1100, d: .9 },
      { t: 2.9, z: 1.15, cx: 700, cy: 1100, d: .5 },                 // 課長の番
      { t: 5.6, z: 1.0, cx: 560, cy: 1080, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 5.4 && t < 5.55 ? 6 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
