// 「おせちの重箱」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：年末。机に重箱が2つ。ジルの重箱は、色とりどりのおせち（にこ）
// ひっくり返し：課長の重箱は、1段目・2段目・3段目、ぜんぶ牧草（どんどん目がきらきら）
// オチ：ジルが自分の3段目を開けると、牧草が1本（赤いリボンつき）。課長がウインク。字幕「ジルの3段目にも、牧草1本」
// （おせちは人の食べ物。課長が食べるのは牧草だけ）
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
// 重箱の段（中心 x,y・中身 kind：'food'｜'hay'｜'one'｜'closed'）
const TIER = (x, y, kind, s) => { let g = `<g transform="translate(${x} ${y}) scale(${s || 1})"><rect x="-110" y="-46" width="220" height="92" rx="10" fill="#2B2220" stroke="#C9A24A" stroke-width="4"/>`;
  if (kind === 'closed') return g + `<rect x="-110" y="-50" width="220" height="24" rx="8" fill="#3A2E2A" stroke="#C9A24A" stroke-width="4"/><circle r="10" cy="-38" fill="#C9A24A"/></g>`;
  g += `<rect x="-98" y="-36" width="196" height="72" rx="6" fill="#9E2B25"/>`;
  if (kind === 'food') { const C = ['#F2C230', '#F07A8A', '#FFFDF7', '#7BB662', '#E8473A', '#F29A3A']; for (let i = 0; i < 9; i++) g += `<circle cx="${-70 + (i % 5) * 35}" cy="${-14 + Math.floor(i / 5) * 30}" r="${12 + (i % 2) * 3}" fill="${C[i % C.length]}" stroke="rgba(0,0,0,.15)" stroke-width="2"/>`; }
  if (kind === 'hay') for (let i = 0; i < 16; i++) g += `<path d="M${-88 + (i * 12)} ${30} q${6 + (i % 3) * 3} ${-50} ${16 - (i % 4) * 8} ${-110 - (i % 3) * 14}" stroke="${i % 2 ? "#A8B84E" : "#D8D07A"}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  if (kind === 'one') g += `<path d="M-60 10 q50 -30 120 -10" stroke="#A8B84E" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M0 -6 l-16 -12 l0 24 Z M0 -6 l16 -12 l0 24 Z" fill="#E8473A"/>`;
  return g + `</g>`; };
var EP = {
  dur: 9.5,
  bgmHolds: '5.6-6.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.0, type: 'chime' }, { t: 1.6, type: 'pon' }, { t: 2.9, type: 'pon' }, { t: 3.6, type: 'pon' }, { t: 4.3, type: 'pon' }, { t: 4.5, type: 'chime' },
    { t: 5.9, type: 'pon' }, { t: 6.3, type: 'blink' }, { t: 7.0, type: 'twitch' }, { t: 7.6, type: 'chime' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [12, 0] });
    const n = t < 2.9 ? 0 : t < 3.6 ? 1 : t < 4.3 ? 2 : 3;        // 課長が開けた段の数
    const mine3 = t >= 5.9;
    // ジル（左）：にこ → 自分のを開ける（lean・きらっ）→ 課長の牧草に「…」→ 自分の3段目（lean）→ びっくり → にこ（照れ）
    const jlean = (t > 1.4 && t < 2.0) || (t > 5.6 && t < 6.2);
    const jface = t < 2.4 ? Object.assign({}, RIG.FACES.smile, { sparkle: t > 1.6 ? 1 : 0 }) : t < 5.6 ? RIG.FACES.think : t < 7.0 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : Object.assign({}, RIG.FACES.shy, { heart: t > 7.4 ? 1 : 0 });
    L.char('jil', Object.assign({}, jlean ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 20, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: .8, bodyTilt: jlean ? -10 : 0 }), t, '', {});
    // レン（右）：開けるたびに目がきらきら → ご満悦 → ジルを見てウインク（smug）
    const ropen = t >= 2.7 && t < 4.5;
    const rface = t < 2.7 ? RIG.FACES.neutral : t < 5.6 ? Object.assign({}, RIG.FACES.smile, { sparkle: n > 0 ? 1 : 0, heart: n >= 3 ? 1 : 0 }) : t < 7.0 ? RIG.FACES.neutral : RIG.FACES.smug;
    L.char('ren', Object.assign({}, ropen ? RIG.POSES.lean : RIG.POSES.sit, rface, { x: 560, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: t >= 6.2 ? -.8 : -.2, bodyTilt: ropen ? -10 : 0 }), t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // ジルの重箱：閉じて積んである → 1段目を開けて横に（おせち）→ 3段目（牧草1本）
    if (t < 1.6) { fx += TIER(320, DESK - 50, 'closed', 1) + TIER(320, DESK - 140, 'closed', 1) + TIER(320, DESK - 230, 'closed', 1); }
    else { fx += TIER(320, DESK - 50, mine3 ? 'one' : 'closed', 1) + (mine3 ? '' : TIER(320, DESK - 140, 'closed', 1)) + `<g transform="translate(0 ${-(1 - outBack(seg(t, 1.6, 1.9))) * 30})">${TIER(320, DESK - (mine3 ? 120 : 190), 'food', 1)}</g>`; }
    // 課長の重箱：3段を横に並べて開けていく（牧草）
    const ks = ['closed', 'closed', 'closed'].map((k, i) => i < n ? 'hay' : k);
    fx += ks.map((k, i) => `<g transform="translate(0 ${i < n ? -(1 - outBack(seg(t, 2.9 + i * .7, 3.2 + i * .7))) * 30 : 0})">${TIER(610 + i * 175, DESK - 46, k, .78)}</g>`).join('');
    if (n > 0 && t < 5.4) fx += L.sparkles(800, DESK - 160, t, .6 + n * .25, 4 + n * 2);
    if (t > 5.9 && t < 6.6) fx += L.sparkles(330, DESK - 70, t, .9, 6);
    let ui = (t > 0.6 && t < 2.6 ? CHIP(L, 'NEW YEAR OSECHI', 'お正月の重箱', 1640, seg(t, .6, .9)) : '')
      + (t > 4.4 && t < 5.8 ? CHIP(L, "BOSS'S: HAY ×3", '上司の重箱：3段とも牧草', 1640, seg(t, 4.4, 4.7)) : '')
      + (t > 6.6 && t < 8.6 ? CHIP(L, "JILL'S TIER 3: ONE HAY", 'ジルの3段目にも、牧草1本', 1640, seg(t, 6.6, 6.9)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 360, cy: 1200 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1200, d: .9 },
      { t: 2.7, z: 1.25, cx: 720, cy: 1230, d: .5 },                // 課長が開ける
      { t: 5.6, z: 1.35, cx: 360, cy: 1230, d: .4 },                // ジルの3段目
      { t: 7.0, z: 1.08, cx: 540, cy: 1200, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
