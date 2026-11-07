// 「机の観葉植物」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：レンの机の植物がしおれている（葉が垂れる）。レンはコーヒーをかける（茶色の水）→ もっとしおれる
// ひっくり返し：ジルがそっと造花（プラスチック、タグつき）に取り替える → 葉がピン
// オチ：レンは気づかず、翌日もコーヒーをかける。字幕「造花。それでも水やり」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
// 鉢植え：droop=しおれ具合（0 ピン〜1 だらん）、fake=造花（タグと光沢）
const POT = (x, y, droop, fake, s = 1) => { let g = `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-70 0 L70 0 L56 90 L-56 90 Z" fill="#C9744A"/><rect x="-78" y="-14" width="156" height="22" rx="6" fill="#D98B5E"/>`; for (let i = 0; i < 5; i++) { const a = -60 + i * 30, len = 120 + (i % 2) * 30, bend = droop * (80 + i * 10); g += `<path d="M0 -10 q${Math.sin(a * Math.PI / 180) * len * .6} ${-len * .7 + bend * .6} ${Math.sin(a * Math.PI / 180) * len + bend * Math.sign(Math.sin(a * Math.PI / 180) || 1) * .3} ${-len * (1 - droop * .9) + bend}" fill="none" stroke="${fake ? '#4CB86A' : droop > .5 ? '#9DAE6E' : '#5DBB63'}" stroke-width="${26 - droop * 6}" stroke-linecap="round"/>`; } if (fake) g += `<g transform="translate(70 -40) rotate(20)"><rect x="-26" y="-16" width="52" height="32" rx="6" fill="#fff" stroke="#B9B2A6" stroke-width="4"/><circle cx="-16" cy="0" r="4" fill="#B9B2A6"/><rect x="-6" y="-4" width="24" height="8" rx="4" fill="#B9B2A6"/></g><circle cx="-30" cy="-120" r="6" fill="#fff" opacity=".9"/><circle cx="20" cy="-150" r="5" fill="#fff" opacity=".9"/>`; return g + '</g>'; };
const MUG = (x, y, rot, s = 1) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><rect x="-40" y="-50" width="80" height="90" rx="12" fill="#F4ECE0" stroke="#CDBFA8" stroke-width="6"/><rect x="40" y="-30" width="24" height="46" rx="12" fill="none" stroke="#CDBFA8" stroke-width="8"/><rect x="-32" y="-42" width="64" height="20" rx="6" fill="#6B4A2E"/></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '4.8-5.4',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.0, type: 'tap' }, { t: 1.6, type: 'whoosh' }, { t: 2.4, type: 'flop' }, { t: 3.2, type: 'twitch' }, { t: 4.0, type: 'swish' }, { t: 4.4, type: 'swish' }, { t: 4.8, type: 'pop' }, { t: 5.2, type: 'pon' }, { t: 5.6, type: 'swish' },
    { t: 6.6, type: 'chime' }, { t: 7.4, type: 'tap' }, { t: 7.8, type: 'whoosh' }, { t: 8.3, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const day2 = t >= 6.6;                                    // 翌日（チャイム＋朝の光）
    const bg = L.office({ sky: 'day', clock: day2 ? [9, 0] : [15, 0] });
    const pour1 = t > 1.6 && t < 2.4, pour2 = t > 7.8 && t < 8.5;
    const swap = t >= 4.8;
    const droop = t < 2.4 ? .6 : t < 4.8 ? Math.min(1, .6 + seg(t, 2.4, 3.2) * .4) : 1 - outBack(seg(t, 5.0, 5.6));
    // レン（右）：植物をじっと見る → コーヒーをかける（lean）→ もっとしおれて汗 → 4.0〜5.6 席を外す（右へ消える）→ 翌日戻って、ピンとした葉ににこにこ → またコーヒー
    const out = t >= 4.0 && t < 6.6;
    const rface = t < 2.4 ? RIG.FACES.think : t < 4.0 ? Object.assign({}, RIG.FACES.oops, { sweat: 1 }) : RIG.FACES.smile;
    const rh = t >= 4.0 && t < 4.6 ? RIG.hop(t, 4.0, 4.6, 540, 1300, { hops: 2, height: 40 }) : t >= 6.6 && t < 7.2 ? RIG.hop(t, 6.6, 7.2, 1300, 540, { hops: 2, height: 40 }) : { x: out ? 1300 : 540, yOff: 0, squash: 0 };
    const rp = Object.assign({}, pour1 || pour2 ? RIG.POSES.lean : RIG.POSES.sit, rface, { x: rh.x, y: DESK - 413 * 1.35 + rh.yOff, scale: 1.35, flip: true, bodySquash: rh.squash, bodyTilt: pour1 || pour2 ? -10 : 0, eyeLook: .6, question: t < 2.4 ? 1 : 0 });
    L.char('ren', rp, t, '', { vx: t >= 4.0 && t < 4.6 ? 1200 : t >= 6.6 && t < 7.2 ? -1200 : 0 });
    // ジル（左）：4.0 にそっと来て、4.8 鉢を取り替える（造花）→ 5.6 席へ戻る
    const jh = t >= 4.0 && t < 4.4 ? RIG.hop(t, 4.0, 4.4, 40, 200, { hops: 1, height: 30 }) : t >= 5.6 && t < 6.0 ? RIG.hop(t, 5.6, 6.0, 200, 40, { hops: 1, height: 30 }) : { x: t >= 4.4 && t < 5.6 ? 200 : 40, yOff: 0, squash: 0 };
    const jp = Object.assign({}, t >= 4.4 && t < 5.6 ? RIG.POSES.lean : RIG.POSES.sit, t < 6.6 ? RIG.FACES.sharp : RIG.FACES.smug, { x: jh.x, y: DESK - 413 * 1.3 + jh.yOff, scale: 1.3, bodySquash: jh.squash, bodyTilt: t >= 4.4 && t < 5.6 ? -12 : 0, eyeLook: .7 });
    L.char('jil', jp, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // 鉢（レンの机の手前・中央寄り）。取り替えの瞬間は上に持ち上がって入れ替わる
    const lift = t > 4.8 && t < 5.0 ? Math.sin(seg(t, 4.8, 5.0) * Math.PI) * 160 : 0;
    fx += POT(640, DESK - 40 - lift, droop, swap, 1.0);
    if (t > 4.8 && t < 5.2) fx += L.impact(640, DESK - 180, seg(t, 4.8, 5.2), .9, '#5DBB63');
    if (swap && t < 6.6) fx += L.sparkles(640, DESK - 220, t, .9, 5);
    // コーヒー：マグを傾けて茶色の線
    if (pour1 || pour2) { const k = pour1 ? seg(t, 1.6, 2.4) : seg(t, 7.8, 8.5); fx += MUG(720, DESK - 190, -80 * Math.sin(k * Math.PI), 1.2); fx += `<path d="M660 ${DESK - 200} q-20 50 -30 140" fill="none" stroke="#6B4A2E" stroke-width="14" stroke-linecap="round" opacity="${Math.sin(k * Math.PI).toFixed(2)}"/>`; }
    if (t > 2.4 && t < 4.0) fx += L.emark(900, DESK - 700, 1.0, '…');
    if (day2) fx += `<rect x="-500" y="-500" width="2080" height="1400" fill="#FFF0C8" opacity="${(.18 * Math.min(1, (t - 6.6) * 2)).toFixed(2)}" pointer-events="none"/>`;
    let ui = (t > 1.8 && t < 3.4 ? CHIP(L, 'DESK PLANT: WILTING', '上司の机の植物。水やりはコーヒー', 1580, seg(t, 1.8, 2.1)) : '')
      + (t > 5.0 && t < 6.4 ? CHIP(L, 'JILL: SWAP. PLASTIC.', 'ジルがそっと造花に', 1580, seg(t, 5.0, 5.3)) : '')
      + (t > 7.4 && t < 8.6 ? CHIP(L, 'NEXT DAY: COFFEE AGAIN', '翌日。それでも水やり（コーヒー）', 1580, seg(t, 7.4, 7.7)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 640, cy: 1150 },
      { t: 0.01, z: 1.1, cx: 600, cy: 1120, d: .9 },
      { t: 1.5, z: 1.3, cx: 680, cy: 1200, d: .5 },                 // コーヒー
      { t: 3.9, z: 1.05, cx: 540, cy: 1100, d: .5 },                // ジルが来る
      { t: 4.7, z: 1.3, cx: 600, cy: 1180, d: .4 },                 // 取り替え
      { t: 6.5, z: 1.05, cx: 600, cy: 1100, d: .5 },
      { t: 7.7, z: 1.3, cx: 680, cy: 1200, d: .5 },                 // またコーヒー
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 4.8 && t < 4.9 ? 4 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
