// 「サンタへの手紙」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：クリスマス前。二人ともサンタへの手紙を書く。ジルは小さなカードに1行（✓）
// ひっくり返し：レンの紙が机からはみ出し → 床へ → ジルの足元まで伸びる（牧草・にんじん・牧草…の絵がずらり）
// オチ：ジルが拾って読む → 全部「牧草」。字幕「ジル：1行。上司：3メートル（ほぼ牧草）」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
const HAY = (x, y) => `<g transform="translate(${x} ${y})"><path d="M-14 12 q2 -20 -2 -30 M-4 12 q0 -24 4 -32 M6 12 q2 -22 8 -28" stroke="#9CC46A" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="-16" y="6" width="32" height="8" rx="3" fill="#C9A24A"/></g>`;
const CARROT = (x, y) => `<g transform="translate(${x} ${y}) rotate(30)"><path d="M0 -24 L9 14 L-9 14 Z" fill="#F27B3A"/><path d="M0 -24 l-6 -10 M0 -24 l6 -10" stroke="#5E9E4A" stroke-width="5" stroke-linecap="round"/></g>`;
// 長い紙（道のり）：机の上 → 机の前面を下へ → 床を左へ。len=0〜1
const PATH = [[820, 1350], [820, 1420], [820, 1720], [700, 1760], [80, 1760], [-120, 1760]];
const SEGL = PATH.slice(1).map((p, i) => Math.hypot(p[0] - PATH[i][0], p[1] - PATH[i][1]));
const TOTAL = SEGL.reduce((a, b) => a + b, 0);
const ptAt = d => { for (let i = 0; i < SEGL.length; i++) { if (d <= SEGL[i]) { const k = d / SEGL[i]; return [PATH[i][0] + (PATH[i + 1][0] - PATH[i][0]) * k, PATH[i][1] + (PATH[i + 1][1] - PATH[i][1]) * k]; } d -= SEGL[i]; } return PATH[PATH.length - 1]; };
const SCROLL = len => { if (len <= 0) return ''; const D = TOTAL * len; const pts = []; for (let d = 0; d <= D; d += 20) pts.push(ptAt(d)); pts.push(ptAt(D));
  let s = `<path d="M${pts.map(p => p.join(' ')).join(' L')}" fill="none" stroke="#D7CCBB" stroke-width="96" stroke-linejoin="round"/><path d="M${pts.map(p => p.join(' ')).join(' L')}" fill="none" stroke="#FFFDF7" stroke-width="86" stroke-linejoin="round"/>`;
  for (let d = 60, i = 0; d < D - 30; d += 110, i++) { const [x, y] = ptAt(d); s += i % 4 === 3 ? CARROT(x, y) : HAY(x, y); }
  const [ex, ey] = ptAt(D); s += `<circle cx="${ex}" cy="${ey}" r="30" fill="#F2EAD8" stroke="#D7CCBB" stroke-width="5"/>`; return s; };
var EP = {
  dur: 9.5,
  bgmHolds: '5.8-6.4',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.0, type: 'tap' }, { t: 1.6, type: 'chime' }, { t: 2.4, type: 'tap' }, { t: 2.8, type: 'tap' }, { t: 3.2, type: 'swish' }, { t: 3.8, type: 'swish' }, { t: 4.4, type: 'swish' }, { t: 5.0, type: 'swish' }, { t: 5.4, type: 'thump' },
    { t: 5.8, type: 'blink' }, { t: 6.6, type: 'swish' }, { t: 7.4, type: 'twitch' }, { t: 8.2, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [17, 0] });
    const len = ease(seg(t, 2.6, 5.4));
    const writing = t >= 1.0 && t < 5.4;
    // ジル（左）：小さなカードに1行（にこ）→ ✓ → レンの紙が伸びてきて「？」→ 拾って読む（lean）→ ジト目
    const jface = t < 2.0 ? RIG.FACES.sharp : t < 3.4 ? RIG.FACES.smile : t < 5.8 ? RIG.FACES.think : t < 7.0 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : RIG.FACES.annoyed;
    const jp = Object.assign({}, t >= 6.0 && t < 7.0 ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 40, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: t >= 3.4 && t < 6.0 ? .4 : .8, headNod: t < 1.8 && t > 1.0 ? 12 : 0, bodyTilt: t >= 6.0 && t < 7.0 ? -16 : 0, question: t >= 3.4 && t < 5.8 ? 1 : 0 });
    L.char('jil', jp, t, '', {});
    // レン（右）：書き続ける（頭が上下・ご機嫌）→ 書き終えて満足（照れ・♥）
    const rface = t < 5.4 ? RIG.FACES.smile : RIG.FACES.shy;
    const rp = Object.assign({}, writing ? RIG.POSES.lean : RIG.POSES.sit, rface, { x: 540, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: .2, bodyTilt: writing ? -8 : 0, headNod: writing ? 12 + Math.abs(Math.sin(t * 12)) * 8 : 0 });
    L.char('ren', rp, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // 床
    fx += `<rect x="-500" y="${DESK + 300}" width="2080" height="600" fill="#D8C2A0"/>`;
    // ジルのカード（1行）と ✓
    fx += `<g transform="translate(260 ${DESK - 50}) rotate(-6)"><rect x="-80" y="-50" width="160" height="100" rx="8" fill="#FFFDF7" stroke="#D7CCBB" stroke-width="4"/><text x="0" y="-12" text-anchor="middle" font-family="Noto Sans" font-weight="900" font-size="22" fill="#E8473A">Dear Santa</text>${HAY(0, 26)}</g>`;
    if (t >= 2.0 && t < 3.0) fx += L.check(260, DESK - 160, outBack(seg(t, 2.0, 2.3)), .45);
    // レンの紙：机の上の部分＋伸びる部分
    fx += `<g transform="translate(820 ${DESK - 40})"><rect x="-90" y="-40" width="180" height="80" fill="#FFFDF7" stroke="#D7CCBB" stroke-width="4"/><text y="-6" text-anchor="middle" font-family="Noto Sans" font-weight="900" font-size="22" fill="#E8473A">Dear Santa</text></g>`;
    fx += SCROLL(len);
    // 鉛筆
    if (writing) fx += `<g transform="translate(${860 + Math.sin(t * 9) * 25} ${DESK - 90}) rotate(-40)"><rect x="-8" y="-70" width="16" height="110" rx="4" fill="#F2B544"/><path d="M-8 40 l8 24 l8 -24 Z" fill="#5A3A1E"/></g>`;
    if (t > 5.4 && t < 5.9) fx += L.impact(80, 1760, seg(t, 5.4, 5.9), .8, '#C9A24A');
    if (t > 7.0 && t < 8.0) fx += L.emark(230, DESK - 650, 1.0, '…');
    let ui = (t > 1.6 && t < 3.0 ? CHIP(L, 'DEAR SANTA', 'サンタへの手紙。ジルは1行', 1580, seg(t, 1.6, 1.9)) : '')
      + (t > 4.2 && t < 5.8 ? CHIP_OFF(L, "BOSS: STILL WRITING", '上司、まだ書いている', 1580, seg(t, 4.2, 4.5)) : '')
      + (t > 6.8 && t < 8.6 ? CHIP_OFF(L, 'JILL: 1 LINE. BOSS: 3 M', 'ジル1行。上司3メートル（ほぼ牧草）', 1580, seg(t, 6.8, 7.1)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 540, cy: 1150 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1150, d: .9 },
      { t: 2.6, z: 1.0, cx: 560, cy: 1350, d: .8 },                 // 紙が床へ伸びる（引き）
      { t: 6.6, z: 1.05, cx: 480, cy: 1250, d: .5 },                // ジルと床の長い紙
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
