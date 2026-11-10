// 「紙飛行機」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：ジルが書きそんじの紙で紙飛行機。すーっと飛んで、ごみ箱にストン（きりっ）
// ひっくり返し：課長も大きな紙飛行機（自信まんまん）→ ぐるっと宙返りして……戻ってくる
// オチ：紙飛行機は課長の頭の上に着陸。課長はなぜかご満悦。字幕「上司の紙飛行機：自分に戻る」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
const DESKFX = (L, DESK) => `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
  + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
const PLANE = (x, y, r, s, c) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M60 0 L-50 -26 L-30 0 Z" fill="${c}" stroke="#9AA3AE" stroke-width="3" stroke-linejoin="round"/><path d="M60 0 L-30 0 L-50 22 Z" fill="#E6EAF0" stroke="#9AA3AE" stroke-width="3" stroke-linejoin="round"/></g>`;
const BIN = (x, y) => `<g transform="translate(${x} ${y})"><path d="M-70 -120 L70 -120 L56 0 L-56 0 Z" fill="#8FA9C4" stroke="#6E88A3" stroke-width="5"/><rect x="-78" y="-132" width="156" height="18" rx="8" fill="#7D97B3"/></g>`;
// 点の列にそって飛ぶ（k: 0〜1）。向きも返す
const ALONG = (pts, k) => { const n = pts.length - 1, m = Math.max(0, Math.min(n - 1e-6, k * n)), i = Math.floor(m), f = m - i, a = pts[i], b = pts[i + 1]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI]; };
var EP = {
  dur: 9.5,
  bgmHolds: '5.6-6.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.6, type: 'tap' }, { t: 0.9, type: 'tap' }, { t: 1.3, type: 'swish' }, { t: 2.1, type: 'thump' }, { t: 2.3, type: 'chime' }, { t: 3.0, type: 'blink' },
    { t: 3.8, type: 'swish' }, { t: 4.4, type: 'swish' }, { t: 5.0, type: 'swish' }, { t: 5.5, type: 'boing' }, { t: 6.2, type: 'pon' }, { t: 7.2, type: 'twitch' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400, RN = [858, 1156];
    const bg = L.office({ sky: 'day', clock: [15, 0] });
    // ジル（左）：折る（lean）→ 投げる → ごみ箱にストンで満足 → 課長の宙返りに「！」→ ジト目
    const jl = t > .4 && t < 1.2;
    const jface = t < 2.2 ? RIG.FACES.sharp : t < 3.6 ? Object.assign({}, RIG.FACES.smile, { sparkle: t < 3.0 ? 1 : 0 }) : t < 5.6 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : RIG.FACES.annoyed;
    L.char('jil', Object.assign({}, jl ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 20, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: t > 2.4 ? .9 : .4, bodyTilt: jl ? -8 : t > 1.2 && t < 1.5 ? 8 : 0 }), t, '', {});
    // レン（右）：見ている → 大きな紙飛行機で自信まんまん → 投げる（nudge）→ 戻ってきて頭に → ご満悦
    const throwR = t > 3.7 && t < 4.0;
    const rface = t < 3.0 ? RIG.FACES.neutral : t < 3.7 ? Object.assign({}, RIG.FACES.smug, { sparkle: 1 }) : t < 5.5 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : t < 6.2 ? RIG.FACES.oops : Object.assign({}, RIG.FACES.smug, { sparkle: t < 7.4 ? 1 : 0 });
    L.char('ren', Object.assign({}, throwR ? RIG.POSES.nudge : RIG.POSES.sit, rface, { x: 560, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: t > 3.9 && t < 5.5 ? Math.sin((t - 3.9) * 4) * .7 : -.3, headNod: t > 5.4 && t < 5.7 ? 10 : 0 }), t, '', {});
    let fx = DESKFX(L, DESK);
    fx += BIN(540, DESK + 330);
    // ジルの紙飛行機：手もとで折る → ごみ箱へすーっと
    const jf = seg(t, 1.25, 2.1);
    if (t < 1.25) fx += t < .9 ? `<rect x="360" y="${DESK - 30}" width="${120 - 60 * seg(t, .5, .9)}" height="80" rx="4" fill="#FFFDF7" stroke="#CFC3B0" stroke-width="3" transform="rotate(-6 400 ${DESK})"/>` : PLANE(410, DESK - 40, -10, 1, '#FFFDF7');
    else if (jf < 1) { const [x, y, r] = ALONG([[410, DESK - 40], [470, DESK - 140], [520, DESK - 60], [540, DESK + 200]], ease(jf)); fx += PLANE(x, y, r, 1, '#FFFDF7'); }
    fx += L.impact(540, DESK + 200, seg(t, 2.1, 2.5), .6, '#F2A33A');
    // 課長の紙飛行機：大きく、宙返りして戻る → 頭の上（顔にはかからない高さ）
    const rf = seg(t, 3.85, 5.5), top = [RN[0] - 10, RN[1] - 215];
    const loop = [[RN[0] - 170, RN[1] + 140], [RN[0] - 360, RN[1] - 60], [RN[0] - 420, RN[1] - 420], [RN[0] - 300, RN[1] - 640], [RN[0] - 60, RN[1] - 660], [RN[0] + 120, RN[1] - 520], [RN[0] + 100, RN[1] - 330], top];
    if (t > 3.0 && t < 3.85) fx += PLANE(RN[0] - 170, RN[1] + 140, 190, 1.6, '#FFFDF7');
    else if (rf > 0 && rf < 1) { const [x, y, r] = ALONG(loop, rf); fx += PLANE(x, y, r, 1.6, '#FFFDF7'); fx += `<path d="M${loop.slice(0, 1 + Math.floor(rf * 7)).map(p => p.join(' ')).join(' L')}" stroke="#8C7B66" stroke-width="6" stroke-dasharray="4 22" stroke-linecap="round" fill="none" opacity=".5"/>`; }
    else if (rf >= 1) fx += PLANE(top[0], top[1] + (t < 5.7 ? -Math.sin(seg(t, 5.5, 5.7) * Math.PI) * 20 : 0), 180, 1.6, '#FFFDF7');
    if (t > 6.2 && t < 7.4) fx += L.sparkles(RN[0] + 40, RN[1] - 300, t, 1.3, 6);
    if (t > 7.2 && t < 8.6) fx += L.emark(220, DESK - 660, 1.0, '…');
    let ui = (t > 0.8 && t < 2.6 ? CHIP(L, 'PAPER PLANE', 'ジル、ごみ箱にストン', 1650, seg(t, .8, 1.1)) : '')
      + (t > 6.0 && t < 8.6 ? CHIP_OFF(L, "BOSS'S PLANE: RETURNS", '上司の紙飛行機：自分に戻る', 1650, seg(t, 6.0, 6.3)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 380, cy: 1180 },
      { t: 0.01, z: 1.05, cx: 480, cy: 1220, d: .9 },
      { t: 3.0, z: 1.15, cx: 700, cy: 1100, d: .5 },                 // 課長の番
      { t: 3.9, z: 1.0, cx: 600, cy: 900, d: .5 },                   // 宙返り（引き）
      { t: 5.8, z: 1.05, cx: 600, cy: 1050, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
