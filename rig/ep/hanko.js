// 「ハンコ8個」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：書類にハンコの枠が8つ。レンがとん、とん、と押していく（1〜7個目）
// ひっくり返し：8個目で朱肉が切れる（かすれ）→ レンは自分の前足をぺたん → 肉球の判
// オチ：ジルがチェック（✓）して受理。字幕「8個目：にくきゅう。受理」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 総見直し（2026-11-10）：字幕は2回まで。3回目以降（オチの説明）は出さず、絵で見せる
// 大きな書類（8つの枠）。stamps=押した数、paw=肉球（0/1）、faint=かすれ（0〜1）
const SHEET = (x, y, stamps, paw, faint) => {
  let s = `<g transform="translate(${x} ${y})"><rect x="-300" y="-170" width="600" height="370" rx="10" fill="#fff" stroke="#D7CCBB" stroke-width="6"/>`;
  for (let i = 0; i < 3; i++) s += `<rect x="-240" y="${-130 + i * 40}" width="${300 - i * 30}" height="14" rx="7" fill="#E2D8C8"/>`;
  for (let i = 0; i < 8; i++) {
    const cx = -220 + (i % 4) * 150, cy = 60 + Math.floor(i / 4) * 110;
    s += `<rect x="${cx - 42}" y="${cy - 42}" width="84" height="84" rx="8" fill="none" stroke="#C9C2B6" stroke-width="4" stroke-dasharray="8 8"/>`;
    if (i < stamps) s += `<g transform="translate(${cx} ${cy}) rotate(${-8 + (i * 37) % 16})"><circle r="32" fill="none" stroke="#E8473A" stroke-width="6"/><path d="M-14 -10 l0 20 M-4 -12 l0 24 M8 -10 l10 0 l-10 20" fill="none" stroke="#E8473A" stroke-width="6" stroke-linecap="round"/></g>`;
    else if (i === 7 && faint > 0) s += `<g transform="translate(${cx} ${cy})" opacity="${.25 * faint}"><circle r="32" fill="none" stroke="#E8473A" stroke-width="6" stroke-dasharray="6 10"/></g>`;
    if (i === 7 && paw) s += `<g transform="translate(${cx} ${cy}) scale(1.35) rotate(-10)" fill="#E8473A" opacity="${paw}"><ellipse cx="0" cy="10" rx="22" ry="18"/><circle cx="-22" cy="-12" r="9"/><circle cx="-8" cy="-22" r="9"/><circle cx="8" cy="-22" r="9"/><circle cx="22" cy="-12" r="9"/></g>`;
  }
  return s + '</g>';
};
var EP = {
  dur: 9.5,
  bgmHolds: '4.6-5.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.0, type: 'thump' }, { t: 1.4, type: 'thump' }, { t: 1.8, type: 'thump' }, { t: 2.2, type: 'thump' }, { t: 2.6, type: 'thump' }, { t: 3.0, type: 'thump' }, { t: 3.4, type: 'thump' },
    { t: 3.9, type: 'tap' }, { t: 4.2, type: 'tap' }, { t: 4.6, type: 'twitch' }, { t: 5.6, type: 'click' }, { t: 6.1, type: 'flop' }, { t: 6.9, type: 'blink' }, { t: 7.5, type: 'pon' }, { t: 8.1, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [15, 0] });
    const stamps = Math.min(7, Math.max(0, Math.floor((t - 0.6) / 0.4)));       // 1.0〜3.4 で 1〜7 個
    const faint = t >= 3.9 && t < 6.1 ? Math.min(1, (t - 3.9) * 3) : 0;          // かすれ
    const pawDown = t >= 5.6 && t < 6.1 ? seg(t, 5.6, 6.1) : 0;                   // 前足をぺたん
    const paw = t >= 6.1 ? 1 : 0;
    const ok = t >= 7.5;
    // レン（右）：押す（頭を上下）→ かすれて汗 → ひらめき → 前足をぺたん → 得意げ
    const rface = t < 3.9 ? RIG.FACES.neutral : t < 4.6 ? Object.assign({}, RIG.FACES.oops, { sweat: 1 }) : t < 5.6 ? RIG.FACES.think : t < 7.5 ? RIG.FACES.smile : RIG.FACES.smug;
    const stampNod = t > 0.8 && t < 3.6 ? Math.abs(Math.sin((t - 0.6) / 0.4 * Math.PI)) * 14 : 0;
    const rp = Object.assign({}, RIG.POSES.lean, rface, { x: 520, y: DESK - 413 * 1.35, scale: 1.35, flip: true, headNod: stampNod + (pawDown ? 16 * pawDown : 0), bodyTilt: -8 - (pawDown ? 10 * pawDown : 0) + (t > 3.9 && t < 4.6 ? Math.sin(t * 30) * 2 : 0), eyeLook: t < 3.9 ? .4 : .2 });
    L.char('ren', rp, t, '', {});
    // ジル（左）：見守る → 肉球にきょとん → 7.5 ✓ で受理（にこっ）
    const jface = t < 6.1 ? RIG.FACES.sharp : t < 7.5 ? Object.assign({}, RIG.FACES.think, { question: 0 }) : RIG.FACES.smile;
    const jp = Object.assign({}, RIG.POSES.sit, jface, { x: 40, y: DESK - 413 * 1.25, scale: 1.25, eyeLook: .8, headTilt: t >= 6.1 && t < 7.5 ? -12 : 0 });
    L.char('jil', jp, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // 書類（机の手前に立てて見せる）とハンコ
    fx += SHEET(540, DESK - 30, stamps, paw, faint);
    const cell = i => [540 - 220 + (i % 4) * 150, DESK - 30 + 60 + Math.floor(i / 4) * 110];
    if (t > 0.8 && t < 3.9) { const i = Math.min(7, Math.floor((t - 0.6) / 0.4)), [cx, cy] = cell(Math.min(i, 7)); const ph = ((t - 0.6) / 0.4) % 1; fx += L.stamper(cx, cy - 70 - 90 * Math.abs(Math.sin(ph * Math.PI)), 1.1); }
    if (t >= 3.9 && t < 5.6) { const [cx, cy] = cell(7); fx += L.stamper(cx, cy - 70 - (t < 4.6 ? Math.abs(Math.sin(t * 20)) * 30 : 0), 1.1); }
    for (let i = 1; i <= 7; i++) { const at = 0.6 + i * 0.4; if (t > at && t < at + .25) { const [cx, cy] = cell(i - 1); fx += L.impact(cx, cy, seg(t, at, at + .25), .5, '#E8473A'); } }
    if (t > 4.6 && t < 5.6) fx += L.emark(900, DESK - 700, 1.0, '!');     // ひらめき
    if (pawDown > 0) { const [cx, cy] = cell(7); fx += `<g transform="translate(${cx} ${cy - 160 + 150 * ease(pawDown)})"><ellipse cx="0" cy="0" rx="52" ry="40" fill="#D9B48C" stroke="#B88A5C" stroke-width="5"/><circle cx="-26" cy="-26" r="12" fill="#D9B48C" stroke="#B88A5C" stroke-width="5"/><circle cx="-9" cy="-36" r="12" fill="#D9B48C" stroke="#B88A5C" stroke-width="5"/><circle cx="9" cy="-36" r="12" fill="#D9B48C" stroke="#B88A5C" stroke-width="5"/><circle cx="26" cy="-26" r="12" fill="#D9B48C" stroke="#B88A5C" stroke-width="5"/></g>`; }
    if (t > 6.1 && t < 6.5) { const [cx, cy] = cell(7); fx += L.impact(cx, cy, seg(t, 6.1, 6.5), .8, '#E8473A'); }
    if (ok) fx += L.check(540, DESK - 30, outBack(seg(t, 7.5, 7.9)), 2.2);
    if (ok) fx += L.sparkles(540, DESK - 120, t, 1.0, 6);
    let ui = (t > 1.8 && t < 3.4 ? CHIP(L, 'STAMPS NEEDED: 8', '書類にハンコ、8個。上司が押していく', 1380, seg(t, 1.8, 2.1)) : '')
      + (t > 4.2 && t < 5.4 ? CHIP(L, 'NO INK LEFT', '8個目で、朱肉が切れた', 1380, seg(t, 4.2, 4.5)) : '')
      + (t > 7.6 && t < 8.6 ? CHIP_OFF(L, 'STAMP 8/8: PAW. APPROVED', '8個目はにくきゅう。受理', 1380, seg(t, 7.6, 7.9)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 620, cy: 1150 },
      { t: 0.01, z: 1.1, cx: 540, cy: 1150, d: .9 },
      { t: 3.8, z: 1.35, cx: 640, cy: 1250, d: .4 },                // 8個目の枠
      { t: 5.5, z: 1.5, cx: 640, cy: 1300, d: .4 },                 // 肉球
      { t: 6.6, z: 1.1, cx: 500, cy: 1150, d: .5 },
      { t: 7.4, z: 1.25, cx: 540, cy: 1250, d: .4 },                // ✓
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: (t > 6.1 && t < 6.2) ? 5 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
