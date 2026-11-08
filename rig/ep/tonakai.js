// 「サンタとトナカイ」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：クリスマス当日。課長はサンタ帽でそり（段ボール）に乗る。ジルはトナカイのカチューシャで、ひもを引く → びくともしない（汗）
// ひっくり返し：ジルが棒の先に牧草をつるす → 課長がそりから飛び出す
// オチ：交代。課長が牧草を追いかけて引く（ご機嫌）、ジルはそりで牧草の棒を持つ（にこ）。字幕「トナカイ交代」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const ANTLERS = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" stroke="#8C5A3C" stroke-width="12" stroke-linecap="round" fill="none"><path d="M-60 0 C-90 -50 -100 -90 -90 -130 M-80 -60 l-40 -20 M-92 -100 l-30 -30"/><path d="M60 0 C90 -50 100 -90 90 -130 M80 -60 l40 -20 M92 -100 l30 -30"/><path d="M-70 10 C-30 -12 30 -12 70 10" stroke="#C9A24A" stroke-width="10"/></g>`;
const SHAT = (x, y, s, r) => `<g transform="translate(${x} ${y}) rotate(${r || 0}) scale(${s})"><path d="M-70 0 C-60 -60 -10 -110 50 -120 C30 -80 50 -40 70 0 Z" fill="#D9372E"/><rect x="-80" y="-14" width="160" height="28" rx="14" fill="#FFF7EE"/><circle cx="50" cy="-120" r="16" fill="#FFF7EE"/></g>`;
// そり（左下 x・底 y）
const SLED = x => `<g transform="translate(${x} 0)"><rect x="0" y="1170" width="470" height="210" rx="22" fill="#C9A06A" stroke="#9C7A48" stroke-width="6"/><path d="M30 1240 l410 0" stroke="#B08A55" stroke-width="5" opacity=".6"/>`
  + `<path d="M-30 1392 C-40 1352 -10 1340 20 1366 L460 1366 C490 1366 500 1392 480 1400 L-10 1400 Z" fill="#E8473A" stroke="#B8302A" stroke-width="5"/></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '5.4-5.9',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.8, type: 'pon' }, { t: 1.5, type: 'chime' }, { t: 2.3, type: 'thump' }, { t: 2.9, type: 'thump' }, { t: 3.5, type: 'thump' }, { t: 4.3, type: 'blink' },
    { t: 4.8, type: 'swish' }, { t: 5.4, type: 'boing' }, { t: 5.8, type: 'pon' }, { t: 6.4, type: 'swish' }, { t: 7.0, type: 'swish' }, { t: 7.6, type: 'chime' }, { t: 8.3, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400, swap = t >= 5.8;
    const bg = L.office({ sky: 'day', clock: [10, 0] });
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    if (!swap) {
      // ジル（左・トナカイ）：にこ → 引く（lean・ぷるぷる・汗）→ ひらめき「！」→ 牧草の棒
      const pull = t >= 2.0 && t < 4.2;
      const jface = t < 2.0 ? Object.assign({}, RIG.FACES.smile, { sparkle: t > .8 && t < 1.6 ? 1 : 0 }) : t < 4.2 ? RIG.FACES.oops : t < 4.7 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : RIG.FACES.smug;
      L.char('jil', Object.assign({}, pull ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: -20, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: -.6, bodyTilt: pull ? -16 + Math.sin(t * 40) * 3 : 0, flip: true }), t,
        t >= .8 ? ANTLERS(210, 960, outBack(seg(t, .8, 1.1)) * .9) : '', {});
      // レン（そりの中・サンタ帽）：ご満悦 → 牧草を見て目がきらっ → 飛び出す
      const out = ease(seg(t, 5.4, 5.8));
      const rface = t < 4.8 ? RIG.FACES.smug : Object.assign({}, RIG.FACES.smile, { sparkle: 1 });
      L.char('ren', Object.assign({}, t >= 5.4 ? RIG.POSES.binky : RIG.POSES.sit, rface, { x: 520 - out * 300, y: DESK - 413 * 1.35 - 60 - out * 120, scale: 1.35, flip: true, eyeLook: t >= 4.8 ? -.8 : 0 }), t,
        SHAT(830 - out * 300, 990 - out * 120, 1, 14), {});
      fx += SLED(500);
      // ひも
      fx += `<path d="M300 1250 C380 1300 450 1300 505 1260" stroke="#7A5634" stroke-width="7" fill="none"/>`;
      // 牧草の棒（4.8〜）
      if (t >= 4.8) { const k = ease(seg(t, 4.8, 5.2)); fx += `<line x1="280" y1="1180" x2="${280 + 420 * k}" y2="${1180 - 220 * k}" stroke="#8C5A3C" stroke-width="9" stroke-linecap="round"/><line x1="${280 + 420 * k}" y1="${960 + 20 * (1 - k)}" x2="${280 + 420 * k}" y2="1060" stroke="#7A5634" stroke-width="3"/>` + L.hayStrand(280 + 420 * k - 40, 1070, 90, -60); }
      if (pull) fx += `<g fill="#9BC7E8">${[0, 1].map(i => `<path d="M${120 + i * 50} ${980 - ((t * 2 + i * .5) % 1) * 40} q8 14 0 20 q-8 -6 0 -20 Z" opacity="${(1 - ((t * 2 + i * .5) % 1)).toFixed(2)}"/>`).join('')}</g>`;
    } else {
      // 交代：課長が引く（lean・ご機嫌・スピード線）／ジルはそりで牧草の棒を持つ（にこ）
      const run = t >= 6.0;
      L.char('ren', Object.assign({}, RIG.POSES.lean, Object.assign({}, RIG.FACES.smile, { sparkle: 1 }), { x: -80, y: DESK - 413 * 1.35 - 20, scale: 1.35, flip: true, eyeLook: -.8, bodyTilt: -18 + (run ? Math.sin(t * 20) * 4 : 0), headNod: run ? Math.abs(Math.sin(t * 20)) * 8 : 0 }), t,
        SHAT(220, 1010, 1, -10), {});
      L.char('jil', Object.assign({}, RIG.POSES.sit, RIG.FACES.smile, { x: 560, y: DESK - 413 * 1.3 - 60, scale: 1.3, eyeLook: -.6, flip: true }), t, ANTLERS(800, 960, .9), {});
      fx += SLED(500);
      fx += `<path d="M320 1270 C400 1310 450 1310 505 1270" stroke="#7A5634" stroke-width="7" fill="none"/>`;
      // ジルが持つ棒の先に牧草（課長の鼻先）
      fx += `<line x1="700" y1="1100" x2="40" y2="760" stroke="#8C5A3C" stroke-width="9" stroke-linecap="round"/><line x1="40" y1="760" x2="40" y2="930" stroke="#7A5634" stroke-width="3"/>` + L.hayStrand(0, 940, 90, -60);
      if (run) fx += L.speed(540, 1150, .35, 36);
    }
    const flash = t > 5.6 && t < 6.0 ? Math.sin(seg(t, 5.6, 6.0) * Math.PI) * .9 : 0;
    let ui = (t > 1.0 && t < 2.6 ? CHIP(L, 'SANTA & REINDEER', 'サンタは上司、トナカイは部下', 1640, seg(t, 1.0, 1.3)) : '')
      + (t > 2.8 && t < 4.2 ? CHIP(L, "WON'T MOVE", 'びくともしない', 1640, seg(t, 2.8, 3.1)) : '')
      + (t > 6.6 && t < 8.6 ? CHIP(L, 'REINDEER: SWAPPED', 'トナカイ交代（牧草つき）', 1640, seg(t, 6.6, 6.9)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 360, cy: 1150 },
      { t: 0.01, z: 1.0, cx: 520, cy: 1200, d: .9 },
      { t: 2.2, z: 1.15, cx: 440, cy: 1200, d: .5 },
      { t: 4.6, z: 1.2, cx: 500, cy: 1150, d: .4 },                 // 牧草の棒
      { t: 6.0, z: 1.0, cx: 480, cy: 1200, d: .4 },                 // 交代
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: 0, dim: flash });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
