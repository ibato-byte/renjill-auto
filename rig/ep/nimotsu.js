// 「帰省の荷造り」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：年末。ジルは小さなスーツケースに服をきちんと。ふたがパチン（✓）
// ひっくり返し：課長のスーツケースは牧草だけ。あふれてふたが閉まらない → 上に乗ってぎゅっぎゅっ
// オチ：ばーんと開いて牧草が舞う。課長は牧草の上でご満悦。字幕「上司の荷物：牧草だけ」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
// スーツケース（底の中心 x,y・幅 w・高さ h・色 c・ふたの開き open 0〜1・中身 fill）
const CASE = (x, y, w, h, c, open, fill) => { const top = y - h; let g = `<g><rect x="${x - w / 2}" y="${top}" width="${w}" height="${h}" rx="16" fill="${c}" stroke="rgba(0,0,0,.25)" stroke-width="5"/><rect x="${x - w / 2 + 14}" y="${top + 14}" width="${w - 28}" height="${h - 28}" rx="10" fill="rgba(255,255,255,.18)"/>`;
  g += fill || '';
  const a = -open * 100;   // 奥の辺を軸に開く
  g += `<g transform="rotate(${a} ${x - w / 2} ${top})"><rect x="${x - w / 2}" y="${top - h * .3}" width="${w}" height="${h * .3}" rx="14" fill="${c}" stroke="rgba(0,0,0,.25)" stroke-width="5"/><rect x="${x - 30}" y="${top - h * .3 - 22}" width="60" height="26" rx="10" fill="none" stroke="#5A4A3A" stroke-width="8"/></g>`;
  return g + '</g>'; };
const HAYS = (x, y, w, n, h) => { let s = ''; for (let i = 0; i < n; i++) { const px = x - w / 2 + (i + .5) * w / n; s += `<path d="M${px} ${y} q${(i % 2 ? 1 : -1) * 18} ${-h * .5} ${(i % 3 - 1) * 30} ${-h - (i % 4) * 14}" stroke="${i % 2 ? '#A8B84E' : '#D8D07A'}" stroke-width="8" fill="none" stroke-linecap="round"/>`; } return s; };
var EP = {
  dur: 9.5,
  bgmHolds: '5.8-6.3',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.9, type: 'tap' }, { t: 1.3, type: 'tap' }, { t: 1.8, type: 'pon' }, { t: 2.0, type: 'chime' }, { t: 2.9, type: 'swish' }, { t: 3.3, type: 'swish' }, { t: 3.7, type: 'swish' },
    { t: 4.4, type: 'thump' }, { t: 4.8, type: 'thump' }, { t: 5.2, type: 'thump' }, { t: 5.8, type: 'boing' }, { t: 6.0, type: 'swish' }, { t: 7.2, type: 'blink' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400, RX = 780;
    const bg = L.office({ sky: 'day', clock: [17, 0] });
    const stuff = seg(t, 2.8, 4.2);                         // 牧草を詰める
    const sitting = t >= 4.2 && t < 5.8;
    const burst = t >= 5.8;
    // ジル（左）：服をたたむ（lean）→ パチン（✓・にこ）→ 課長を見る → ばーんに「！」→ ジト目
    const jface = t < 2.2 ? RIG.FACES.smile : t < 5.8 ? RIG.FACES.think : t < 7.0 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : RIG.FACES.annoyed;
    const jlean = t > .7 && t < 1.8;
    L.char('jil', Object.assign({}, jlean ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 0, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: .8, bodyTilt: jlean ? -10 : 0 }), t, '', {});
    // レン：詰める（lean・にこ）→ ケースの上に乗ってぎゅっ（上下）→ ばーん（binky）→ 牧草の上でご満悦
    const bounce = sitting ? Math.abs(Math.sin((t - 4.2) * Math.PI / .4)) * 40 : 0;
    const ry = sitting ? DESK - 200 - 413 * 1.15 + bounce * .4 : burst ? DESK - 230 - 413 * 1.15 - 160 * (1 - ease(seg(t, 5.8, 6.6))) : DESK - 413 * 1.35;
    const rface = t < 2.8 ? RIG.FACES.neutral : t < 4.2 ? RIG.FACES.smile : sitting ? RIG.FACES.sharp : t < 6.6 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : Object.assign({}, RIG.FACES.smug, { sparkle: 1 });
    const rpose = t >= 2.8 && t < 4.2 ? RIG.POSES.lean : burst && t < 6.4 ? RIG.POSES.binky : RIG.POSES.sit;
    L.char('ren', Object.assign({}, rpose, rface, { x: sitting || burst ? RX - 270 : 600, y: ry, scale: sitting || burst ? 1.15 : 1.35, flip: true, eyeLook: -.3, bodyTilt: t >= 2.8 && t < 4.2 ? -10 : 0 }), t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // ジルのスーツケース：たたんだ服（1.0〜1.6）→ 1.8 でパチン
    const clothes = t >= .9 ? `<g>${[0, 1].map(i => `<rect x="${280 + i * 70}" y="${DESK - 150}" width="60" height="${18 + i * 4}" rx="6" fill="${i ? '#F07A8A' : '#9BC7E8'}"/>`).join('')}</g>` : '';
    fx += CASE(340, DESK, 200, 130, '#5BA6D6', t < 1.8 ? 1 : 0, t < 1.8 ? clothes : '');
    if (t > 1.8 && t < 2.6) fx += L.check(340, DESK - 260, outBack(seg(t, 1.8, 2.1)), .45);
    // 課長のスーツケース：牧草があふれる → 乗っても閉まらない → ばーん
    const hayH = 40 + stuff * 130;
    if (!burst) { const lid = t < 4.2 ? .9 : .06 + bounce / 900; fx += CASE(RX, DESK, 300, 180, '#E8A33A', lid, t >= 2.8 ? HAYS(RX, DESK - 160, 260, 12, hayH * (sitting ? .6 : 1)) : ''); }
    else { const k = ease(seg(t, 5.8, 6.3)); fx += CASE(RX, DESK, 300, 180, '#E8A33A', 1, HAYS(RX, DESK - 160, 280, 14, 60 + 40 * k));
      // 舞う牧草
      fx += `<g>${Array.from({ length: 14 }, (_, i) => { const a = -Math.PI * (.15 + .7 * i / 13), r = 80 + k * 380, px = RX + Math.cos(a) * r, py = DESK - 200 + Math.sin(a) * r + k * k * 160; return `<path d="M${px} ${py} l${18 + (i % 3) * 6} ${-10}" stroke="${i % 2 ? '#A8B84E' : '#D8D07A'}" stroke-width="7" stroke-linecap="round" opacity="${(1 - seg(t, 6.6, 7.6)).toFixed(2)}"/>`; }).join('')}</g>`; }
    if (sitting && t > 4.4) fx += L.emark(RX + 200, DESK - 520, 1.0, '!');
    if (t > 5.8 && t < 6.2) fx += L.impact(RX, DESK - 200, seg(t, 5.8, 6.2), 1.0, '#D8D07A');
    if (t > 7.2 && t < 8.6) fx += L.emark(200, DESK - 650, 1.0, '…');
    let ui = (t > 0.6 && t < 2.6 ? CHIP(L, 'PACKING FOR HOME', '帰省の荷造り', 1640, seg(t, .6, .9)) : '')
      + (t > 4.4 && t < 5.8 ? CHIP(L, "LID WON'T CLOSE", 'ふたが閉まらない', 1640, seg(t, 4.4, 4.7)) : '')
      + (t > 6.8 && t < 8.6 ? CHIP(L, "BOSS'S BAG: HAY ONLY", '上司の荷物：牧草だけ', 1640, seg(t, 6.8, 7.1)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 340, cy: 1200 },
      { t: 0.01, z: 1.05, cx: 520, cy: 1200, d: .9 },
      { t: 2.6, z: 1.15, cx: 660, cy: 1180, d: .5 },                // 課長の荷物
      { t: 5.6, z: .95, cx: 600, cy: 1100, d: .3 },                 // ばーん（引き）
      { t: 6.8, z: 1.05, cx: 540, cy: 1150, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 5.8 && t < 6.1 ? 8 : sitting ? bounce / 12 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
