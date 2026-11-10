// 「凧あげ」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：お正月。窓から風。ジルが小さな凧（赤い四角）をあげる → すいすい（にこ）
// ひっくり返し：課長もやりたい → 強い風 → たれ耳がばたばた → 課長がふわっと浮く
// オチ：ジルの凧糸の先は、浮いた課長（ネクタイに結ばれている）。課長はご満悦。字幕「よくあがる凧：上司」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
const KITE = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 -70 L56 0 L0 70 L-56 0 Z" fill="#E8473A" stroke="#B8302A" stroke-width="5"/><path d="M0 -70 L0 70 M-56 0 L56 0" stroke="#F2D3A8" stroke-width="4"/><text y="18" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="44" fill="#FFF7E8">福</text>`
  + `<path d="M0 70 q-20 30 0 60 q20 30 0 60" stroke="#F2C230" stroke-width="6" fill="none"/></g>`;
const WIND = (t, k) => k <= 0 ? '' : `<g stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" fill="none" opacity="${(.7 * k).toFixed(2)}">${[0, 1, 2, 3, 4].map(i => { const u = (t * 1.4 + i / 5) % 1, x = -200 + u * 1500, y = 760 + i * 110 + Math.sin(u * 6 + i) * 20; return `<path d="M${x} ${y} q60 -24 120 0 q40 16 70 -6"/>`; }).join('')}</g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '5.4-6.0',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.8, type: 'swish' }, { t: 1.6, type: 'chime' }, { t: 2.8, type: 'swish' }, { t: 3.4, type: 'swish' }, { t: 3.9, type: 'swish' }, { t: 4.4, type: 'boing' },
    { t: 5.0, type: 'swish' }, { t: 5.6, type: 'blink' }, { t: 6.4, type: 'chime' }, { t: 7.2, type: 'twitch' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [11, 0] });
    const gust = seg(t, 2.6, 3.2);                         // 強い風
    const lift = ease(seg(t, 4.2, 5.6));                    // 課長が浮く
    const wob = Math.sin(t * 3) * 14 * lift;
    // ジル（左）：凧糸を持つ（にこ）→ 強い風に「！」→ 課長が浮いて「…」→ 糸をしっかり持ってにが笑い
    const jface = t < 2.6 ? Object.assign({}, RIG.FACES.smile, { sparkle: t > 1.2 && t < 2.2 ? 1 : 0 }) : t < 4.2 ? RIG.FACES.sharp : t < 5.8 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : RIG.FACES.annoyed;
    L.char('jil', Object.assign({}, RIG.POSES.sit, jface, { x: 20, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: t < 4.2 ? .9 : .6 }), t, '', {});
    // レン（右）：見ている → 風で耳がばたばた（体がゆれる）→ ふわっと浮く（binky）→ 空中でご満悦
    const flap = t >= 2.6 && t < 5.6;
    const rface = t < 2.6 ? Object.assign({}, RIG.FACES.smile, { sparkle: t > 1.8 ? 1 : 0 }) : t < 4.2 ? RIG.FACES.oops : t < 5.6 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : Object.assign({}, RIG.FACES.smug, { sparkle: t < 7.0 ? 1 : 0 });
    const rx = 560 - 60 * lift, ry = DESK - 413 * 1.35 - 520 * lift + wob;
    L.char('ren', Object.assign({}, lift > .05 ? RIG.POSES.binky : RIG.POSES.sit, rface, { x: rx, y: ry, scale: 1.35, flip: true, eyeLook: -.4, bodyTilt: flap ? Math.sin(t * 22) * 8 : 0, headTilt: flap ? Math.sin(t * 18) * 10 : 0 }), t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    fx += WIND(t, t < 2.6 ? .5 : t < 6.0 ? 1 : .5);
    // ジルの凧（〜4.2）→ 課長が浮いたら糸の先は課長
    const hand = [330, DESK - 200];
    if (t < 4.6) { const kx = 420 + Math.sin(t * 2) * 30, ky = 760 - 60 * seg(t, .6, 1.6) + Math.cos(t * 2.4) * 20 - gust * 80; fx += `<path d="M${hand[0]} ${hand[1]} Q${(hand[0] + kx) / 2 + 40} ${(hand[1] + ky) / 2 + 60} ${kx} ${ky + 70}" stroke="#7A5634" stroke-width="3" fill="none"/>` + KITE(kx, ky, Math.sin(t * 3) * 10); }
    else { const tie = [rx + 300, ry + 470]; fx += `<path d="M${hand[0]} ${hand[1]} Q${(hand[0] + tie[0]) / 2} ${(hand[1] + tie[1]) / 2 + 80} ${tie[0]} ${tie[1]}" stroke="#7A5634" stroke-width="3" fill="none"/>`;
      if (t < 5.2) fx += KITE(420, 700 - (t - 4.6) * 400, 30 + (t - 4.6) * 200); }   // 小さな凧は風で飛んでいく
    if (t > 4.4 && t < 5.4) fx += L.dust(rx + 300, DESK, seg(t, 4.4, 5.4));
    if (t > 6.0 && t < 7.0) fx += L.sparkles(rx + 300, ry + 100, t, 1.0, 6);
    let ui = (t > 0.5 && t < 2.6 ? CHIP(L, 'NEW YEAR KITE', 'お正月の凧あげ', 1640, seg(t, .5, .8)) : '')
      + (t > 2.8 && t < 4.2 ? CHIP_OFF(L, 'STRONG WIND', '強い風、たれ耳がばたばた', 1640, seg(t, 2.8, 3.1)) : '')
      + (t > 6.2 && t < 8.6 ? CHIP_OFF(L, 'BEST KITE: THE BOSS', 'よくあがる凧：上司', 1640, seg(t, 6.2, 6.5)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.2, cx: 420, cy: 1000 },
      { t: 0.01, z: 1.0, cx: 520, cy: 1050, d: .9 },
      { t: 2.6, z: 1.2, cx: 700, cy: 1150, d: .5 },                 // 耳がばたばた
      { t: 4.2, z: .95, cx: 540, cy: 960, d: .6 },                  // 浮く（引き）
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
