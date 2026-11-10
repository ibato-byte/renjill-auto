// 「おみくじ」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：お正月。ジルがおみくじの箱をふる → 「大吉」（きらっ）
// ひっくり返し：課長が勢いよくふる → 棒がばらばら飛び出す → 出てきた紙は「牧草吉」
// オチ：課長は大喜びで紙を高くかかげる。ジルは「…それ、ある？」の顔。字幕「上司のおみくじ：牧草吉」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
// おみくじの箱（中心 x,y・ふり rot）
const BOX = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="-56" y="-120" width="112" height="240" rx="18" fill="#C9483C" stroke="#8E2E26" stroke-width="6"/><rect x="-40" y="-80" width="80" height="150" rx="8" fill="#FFF7E8"/>`
  + `<text x="0" y="-26" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="46" fill="#C9483C">お</text><text x="0" y="24" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="46" fill="#C9483C">み</text>`
  + `<rect x="-10" y="-132" width="20" height="16" rx="4" fill="#3A2414"/></g>`;
// おみくじの紙（中心 x,y・縦書きの文字 s・大きさ k）
const SLIP = (x, y, s, k, col) => `<g transform="translate(${x} ${y}) scale(${k})"><rect x="-62" y="-150" width="124" height="300" rx="8" fill="#FFFDF7" stroke="#D7CCBB" stroke-width="5"/><rect x="-50" y="-138" width="100" height="276" rx="4" fill="none" stroke="#E8473A" stroke-width="3"/>`
  + [...s].map((c, i) => `<text x="0" y="${(i - (s.length - 1) / 2) * 84 + 24}" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="72" fill="${col}">${c}</text>`).join('') + `</g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '5.6-6.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.8, type: 'tap' }, { t: 1.1, type: 'tap' }, { t: 1.4, type: 'tap' }, { t: 1.8, type: 'pon' }, { t: 2.1, type: 'chime' },
    { t: 3.0, type: 'swish' }, { t: 3.3, type: 'swish' }, { t: 3.6, type: 'swish' }, { t: 3.9, type: 'swish' }, { t: 4.3, type: 'thump' }, { t: 5.0, type: 'pon' }, { t: 5.5, type: 'chime' }, { t: 6.4, type: 'blink' }, { t: 7.4, type: 'twitch' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [10, 0] });
    // ジル（左）：ふる（lean）→ 大吉にきらっ → 課長のばらばらに「！」→ 牧草吉に「…」→ ジト目（にが笑い）
    const jshake = t >= .7 && t < 1.7;
    const jface = t < 1.8 ? RIG.FACES.sharp : t < 2.8 ? Object.assign({}, RIG.FACES.smile, { sparkle: 1 }) : t < 4.3 ? RIG.FACES.smile : t < 5.6 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : t < 6.4 ? RIG.FACES.think : RIG.FACES.annoyed;
    L.char('jil', Object.assign({}, jshake ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 20, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: .8, bodyTilt: jshake ? -10 + Math.sin(t * 22) * 4 : 0 }), t, '', {});
    // レン（右）：わくわく → 激しくふる（lean・体ごと）→ 牧草吉で大喜び（binky）→ かかげて得意げ
    const rshake = t >= 2.9 && t < 4.3;
    const rface = t < 2.9 ? Object.assign({}, RIG.FACES.smile, { sparkle: t > 2.2 ? 1 : 0 }) : rshake ? RIG.FACES.sharp : t < 5.4 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : Object.assign({}, RIG.FACES.smile, { sparkle: 1, heart: t > 6.4 ? 1 : 0 });
    const rpose = rshake ? RIG.POSES.lean : t >= 5.4 && t < 6.2 ? RIG.POSES.binky : RIG.POSES.sit;
    L.char('ren', Object.assign({}, rpose, rface, { x: 560, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: -.3, bodyTilt: rshake ? -14 + Math.sin(t * 34) * 9 : 0 }), t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // ジルの箱と紙
    if (t < 2.0) fx += BOX(430, DESK - 120, jshake ? Math.sin(t * 22) * 25 + 160 : 0);
    if (t >= 1.8) fx += SLIP(430, DESK - 190, '大吉', outBack(seg(t, 1.8, 2.1)) * .8, '#C9483C');
    if (t > 2.0 && t < 2.8) fx += L.sparkles(430, DESK - 190, t, .9, 6);
    // 課長の箱：激しくふる → 棒がばらばら
    if (t >= 2.6 && t < 5.0) fx += BOX(760, DESK - 200, rshake ? Math.sin(t * 34) * 50 + 150 : 150);
    if (t >= 3.4) { const k = seg(t, 3.4, 4.6); fx += `<g>${Array.from({ length: 10 }, (_, i) => { const a = -1.2 + i * .25, px = 760 + Math.cos(a) * 320 * k, py = DESK - 200 + Math.sin(a) * 200 * k + 380 * k * k; return `<rect x="${px - 6}" y="${py - 60}" width="12" height="120" rx="5" fill="#D9B98E" stroke="#B08A60" stroke-width="3" transform="rotate(${i * 37 + k * 400} ${px} ${py})"/>`; }).join('')}</g>`; }
    // 牧草吉（5.0〜）：かかげる
    if (t >= 5.0) { const up = t >= 6.2 ? ease(seg(t, 6.2, 6.7)) : 0; fx += SLIP(930 - up * 80, DESK - 230 - up * 280, '牧草吉', outBack(seg(t, 5.0, 5.4)) * (.85 + up * .15), '#3E8A3E'); }
    if (t > 5.4 && t < 6.6) fx += L.sparkles(800, DESK - 400, t, 1.2, 10);
    if (t > 6.6 && t < 8.6) fx += L.emark(200, DESK - 650, 1.0, '…');
    let ui = (t > 0.5 && t < 2.6 ? CHIP(L, 'NEW YEAR FORTUNE', 'お正月のおみくじ', 1640, seg(t, .5, .8)) : '')
      + (t > 2.1 && t < 2.9 ? '' : '')
      + (t > 6.0 && t < 8.6 ? CHIP_OFF(L, "BOSS'S LUCK: HAY", '上司のおみくじ：牧草吉', 1640, seg(t, 6.0, 6.3)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 360, cy: 1200 },
      { t: 0.01, z: 1.05, cx: 520, cy: 1150, d: .9 },
      { t: 1.8, z: 1.35, cx: 360, cy: 1180, d: .4 },                // 大吉
      { t: 2.7, z: 1.0, cx: 560, cy: 1150, d: .5 },                 // 課長がふる
      { t: 5.0, z: 1.3, cx: 760, cy: 1150, d: .4 },                 // 牧草吉
      { t: 6.6, z: 1.05, cx: 540, cy: 1120, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: rshake ? 4 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
