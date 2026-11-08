// 「日なた」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：冬の朝。窓から床に日なたの四角。課長はその中で香箱すわり（ぬくぬく）
// ひっくり返し：時計が進むと日なたが動く → 課長も少しずつ動く（座ったまま、すーっと）
// オチ：夕方、日なたはジルの席へ。課長もジルの横にぴったり。字幕「上司の席：日なたのある所」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '5.6-6.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.0, type: 'chime' }, { t: 2.4, type: 'swish' }, { t: 3.4, type: 'swish' }, { t: 4.4, type: 'swish' }, { t: 5.4, type: 'blink' }, { t: 6.0, type: 'pon' }, { t: 7.0, type: 'chime' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const move = ease(seg(t, 2.0, 5.6));                       // 日なたが動く（朝 → 夕方）
    const hour = 9 + 8 * move;
    const bg = L.office({ sky: move > .8 ? 'dusk' : 'day', clock: [Math.floor(hour), Math.round((hour % 1) * 60 / 15) * 15 % 60] });
    // 日なた（床＝机の天板の上の明るい四角）：右から左へ
    const sx = 860 - 560 * move;
    // レン：日なたの中で香箱 → 日なたについていく（座ったまま横へ）→ ジルの横にぴったり
    const rx = 560 - 330 * move;
    const rface = t < 5.6 ? Object.assign({}, RIG.FACES.sleepy, { zzz: 0, eyeOpen: .25, blush: .5 }) : t < 7.0 ? Object.assign({}, RIG.FACES.smile, { blush: .7 }) : Object.assign({}, RIG.FACES.sleepy, { zzz: 1 });
    // ジル（左）：書類 → 課長がだんだん近づいてきて「？」→ 横にぴったりで「…」→ にが笑い
    const jface = t < 3.6 ? RIG.FACES.neutral : t < 5.6 ? Object.assign({}, RIG.FACES.think, { question: 1 }) : t < 7.0 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : Object.assign({}, RIG.FACES.smile, { blush: .3 });
    L.char('jil', Object.assign({}, RIG.POSES.sit, jface, { x: 20 - 60 * move, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: t < 3.6 ? 0 : .9 }), t, '', {});
    L.char('ren', Object.assign({}, RIG.POSES.loaf, rface, { x: rx, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: -.4 }), t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // 光の帯（窓から斜めに）と、机の上の日なた
    const warm = move > .7 ? '#FFC98A' : '#FFF1B8';
    fx += `<path d="M${sx + 160} 380 L${sx + 360} 380 L${sx + 290} 860 L${sx - 90} 860 Z" fill="${warm}" opacity=".22"/>`;   // 光の帯は顔より上まで（顔にかぶせない：描画QA）
    fx += `<ellipse cx="${sx}" cy="${DESK + 8}" rx="250" ry="34" fill="${warm}" opacity=".75"/>`;
    // 時間が進む表示（時計のまわりに矢印）
    if (t > 2.0 && t < 5.6) fx += `<g transform="translate(540 300)" opacity=".85"><path d="M-120 0 A120 120 0 1 1 0 120" stroke="#E8473A" stroke-width="12" fill="none" stroke-linecap="round" stroke-dasharray="20 18"/></g>`;
    if (t > 6.2 && t < 7.4) fx += L.sparkles(rx + 260, 1150, t, 1.2, 6);
    let ui = (t > 0.6 && t < 2.2 ? CHIP(L, 'SUNNY SPOT', '冬の日なた、ぬくぬく', 1600, seg(t, .6, .9)) : '')
      + (t > 2.4 && t < 5.4 ? CHIP(L, 'THE SUN MOVES…', '日なたが動くと、課長も', 1600, seg(t, 2.4, 2.7)) : '')
      + (t > 6.2 && t < 8.6 ? CHIP(L, "BOSS'S SEAT: THE SUN", '上司の席：日なたのある所', 1600, seg(t, 6.2, 6.5)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 780, cy: 1150 },
      { t: 0.01, z: 1.05, cx: 600, cy: 1100, d: .9 },
      { t: 2.0, z: 1.0, cx: 540, cy: 1000, d: .6 },                 // 時間が進む（引き）
      { t: 5.8, z: 1.25, cx: 360, cy: 1150, d: .5 },                // ジルの横にぴったり
      { t: 7.4, z: 1.1, cx: 420, cy: 1120, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
