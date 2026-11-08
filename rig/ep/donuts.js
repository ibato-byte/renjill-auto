// 「差し入れのドーナツ」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：ジルが差し入れのドーナツ（箱に6個）を机に置く。レンの目がきらっ
// ひっくり返し：ジルが後ろを向く（棚の方）2秒 → 向き直ると箱は空。レンは「知らない顔」
// オチ：口のまわりに粉砂糖。字幕「証拠：口のまわりの粉」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const DONUT = (x, y, s = 1, col = '#F2B8C6') => `<g transform="translate(${x} ${y}) scale(${s})"><circle r="44" fill="#E2A96B"/><circle r="40" fill="${col}"/><circle r="12" fill="#F4ECE0"/><circle cx="-14" cy="-10" r="4" fill="#fff"/><circle cx="12" cy="-16" r="4" fill="#5DBB63"/><circle cx="16" cy="12" r="4" fill="#4A90D9"/></g>`;
// 箱：open=ふたの開き、n=中のドーナツの数（6→0）
const BOX = (x, y, open, n) => { let s = `<g transform="translate(${x} ${y})"><rect x="-200" y="-70" width="400" height="110" rx="14" fill="#F7E7D0" stroke="#D9B98E" stroke-width="6"/>`; const cols = ['#F2B8C6', '#F6D7A3', '#C9A0DC', '#F2B8C6', '#9FD3C7', '#F6D7A3']; for (let i = 0; i < n; i++) s += DONUT(-160 + (i % 3) * 80 + (i >= 3 ? 40 : 0) + 60, -20 + (i >= 3 ? 0 : -10), .62, cols[i]); s += `<g transform="translate(0 ${-70 - open * 22}) scale(1 ${1 - open * .85})"><rect x="-204" y="-60" width="408" height="64" rx="14" fill="#FFF4E6" stroke="#D9B98E" stroke-width="6"/><rect x="-30" y="-40" width="60" height="24" rx="8" fill="#E86C5A"/></g></g>`; return s; };
var EP = {
  dur: 9.5,
  bgmHolds: '5.9-6.5',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.0, type: 'tap' }, { t: 1.6, type: 'click' }, { t: 2.0, type: 'chime' }, { t: 2.6, type: 'blink' }, { t: 3.4, type: 'swish' }, { t: 3.9, type: 'tap' }, { t: 4.2, type: 'tap' }, { t: 4.5, type: 'tap' }, { t: 4.8, type: 'tap' }, { t: 5.1, type: 'tap' }, { t: 5.4, type: 'tap' },
    { t: 5.9, type: 'swish' }, { t: 6.4, type: 'twitch' }, { t: 7.2, type: 'blink' }, { t: 7.8, type: 'pon' }, { t: 8.2, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [15, 0] });
    const open = outBack(seg(t, 1.6, 2.0));
    const away = t >= 3.4 && t < 5.9;                         // ジルが後ろを向いている間
    const n = t < 3.9 ? 6 : Math.max(0, 6 - Math.floor((t - 3.6) / 0.3));   // 3.9〜5.4 で 1 個ずつ消える
    const back = t >= 5.9;
    // ジル（左）：箱を置く → 棚の方を向く（flip・背中はないので横向き＋目を閉じる代わりに向こうを見る）→ 向き直って空箱に目を丸く → 粉を見てジト目
    const jface = t < 3.4 ? RIG.FACES.smile : away ? RIG.FACES.neutral : t < 7.2 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : RIG.FACES.annoyed;
    const jp = Object.assign({}, RIG.POSES.sit, jface, { x: 40, y: DESK - 413 * 1.3, scale: 1.3, flip: away, eyeLook: away ? -.9 : .8, headTilt: t >= 7.2 ? -10 : 0, bodyTilt: away ? -6 : 0 });
    L.char('jil', jp, t, '', {});
    // レン（右）：ドーナツにきらきら → ジルが向こうを向いたら、頭を下げてもぐもぐ（6回）→ 何食わぬ顔（口のまわりに粉）→ 7.8 ばれて照れ
    const eating = t >= 3.9 && t < 5.6;
    const rface = t < 2.0 ? RIG.FACES.neutral : t < 3.4 ? RIG.FACES.shy : eating ? RIG.FACES.smile : t < 7.8 ? Object.assign({}, RIG.FACES.neutral, { eyeLook: -.6 }) : Object.assign({}, RIG.FACES.shy, { heart: 0 });
    const chomp = eating ? Math.abs(Math.sin((t - 3.6) / 0.3 * Math.PI)) : 0;
    const rp = Object.assign({}, RIG.POSES.sit, rface, { x: 540, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: t < 3.4 ? .9 : eating ? .2 : -.6, headNod: chomp * 18, bodySquash: eating ? chomp * .15 : 0, headTilt: t >= 5.9 && t < 7.8 ? 12 : 0 });
    L.char('ren', rp, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // 箱（ジルが 1.0 に置く：上から降りてくる）
    const drop = t < 1.0 ? 0 : outBack(seg(t, 1.0, 1.4));
    if (t >= 1.0) fx += BOX(540, DESK - 20 - 400 * (1 - drop), open, n);
    if (t > 1.0 && t < 1.5) fx += L.dust(540, DESK, seg(t, 1.0, 1.5));
    if (t > 2.0 && t < 3.4) fx += L.sparkles(540, DESK - 150, t, 1.0, 6);
    if (eating) fx += L.munch(760, DESK - 160, t, 1.0);
    // 口のまわりの粉砂糖（レンの口元に白い点々）
    if (t >= 5.6) fx += `<g fill="#fff" opacity=".95">${[0, 1, 2, 3, 4, 5].map(i => `<circle cx="${905 + Math.cos(i * 1.05) * 42}" cy="${DESK - 235 + Math.sin(i * 1.05) * 20}" r="${6 + (i % 3) * 2}"/>`).join('')}</g>`;
    if (t > 7.2 && t < 7.7) fx += L.impact(905, DESK - 235, seg(t, 7.2, 7.7), .8, '#F2A33A');
    if (t > 5.9 && t < 7.2) fx += L.emark(230, DESK - 650, 1.0);
    let ui = (t > 1.8 && t < 3.4 ? CHIP(L, 'DONUTS: 6', '差し入れのドーナツ、6個', 1380, seg(t, 1.8, 2.1)) : '')
      + (t > 3.6 && t < 5.8 ? CHIP(L, 'JILL LOOKS AWAY: 2 SEC', 'ジルが後ろを向いた2秒間', 1380, seg(t, 3.6, 3.9)) : '')
      + (t > 7.3 && t < 8.6 ? CHIP(L, 'EVIDENCE: SUGAR', '証拠：口のまわりの粉', 1380, seg(t, 7.3, 7.6)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 540, cy: 1150 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1120, d: .9 },
      { t: 3.4, z: 1.25, cx: 640, cy: 1150, d: .5 },                // レンともぐもぐ
      { t: 5.9, z: 1.05, cx: 540, cy: 1100, d: .4 },
      { t: 7.2, z: 1.5, cx: 820, cy: 1120, d: .4 },                 // 口のまわりの粉
      { t: 8.2, z: 1.1, cx: 540, cy: 1100, d: .4 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 1.0 && t < 1.1 ? 4 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
