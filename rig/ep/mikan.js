// 「みかん5個」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：冬。ジルの机にみかんが5個。ジルは1個を皮をつなげたままきれいにむく（下を向いている）
// ひっくり返し：ジルが下を向くたびに、レンが1個ずつ取る → 4秒で 5 → 0。レンのほっぺがどんどんふくらむ
// オチ：ジルが顔を上げると空っぽ。レンは何食わぬ顔（ほっぺぱんぱん）。ジルがほっぺをつつくと、みかんが1個ぽん。字幕「発見：上司のほっぺ」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 総見直し（2026-11-10）：字幕は2回まで。3回目以降（オチの説明）は出さず、絵で見せる
const MIKAN = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><circle r="40" fill="#F5A02A" stroke="#D97C12" stroke-width="4"/><circle cx="-12" cy="-12" r="9" fill="#fff" opacity=".35"/><ellipse cx="6" cy="-38" rx="16" ry="8" fill="#5E9E4A" transform="rotate(-25 6 -38)"/></g>`;
// 器（木の皿）と残りのみかん n 個
const BOWL = (x, y, n) => { let s = `<ellipse cx="${x}" cy="${y}" rx="150" ry="36" fill="#C98A5A" stroke="#9A6238" stroke-width="5"/>`; const pos = [[-80, -30], [0, -34], [80, -30], [-40, -70], [40, -70]]; for (let i = 0; i < n; i++) s += MIKAN(x + pos[i][0], y + pos[i][1], .9); return s; };
// ジルの手元：皮がつながったまま（k=むき進み 0〜1）
const PEEL = (x, y, k) => { if (k <= 0) return ''; const n = Math.ceil(k * 6); let s = MIKAN(x, y, .9); for (let i = 0; i < n; i++) { const a = -1.2 + i * .5; s += `<path d="M${x + Math.cos(a) * 44} ${y + Math.sin(a) * 44} q${Math.cos(a) * 40 + 20} ${Math.sin(a) * 40 + 30} ${Math.cos(a) * 70} ${Math.sin(a) * 70 + 50}" fill="none" stroke="#F5A02A" stroke-width="14" stroke-linecap="round"/>`; } return s; };
// レンのほっぺ（n = 口の中のみかんの数）
// 鼻（world 837,1155）の左右に、顔と同じ毛色でふくらむ。輪郭線なし・ふちをぼかして「顔の一部」に見せる
const CHEEKS = (n, t) => { if (n <= 0) return ''; const r = 22 + n * 7, w = Math.sin(t * 14) * 1.5, NX = 837, NY = 1170;
  const g = `<defs><radialGradient id="mkCheek" cx=".5" cy=".42" r=".55"><stop offset="0" stop-color="#EEDCC2"/><stop offset=".7" stop-color="#E2C6A0"/><stop offset="1" stop-color="#D4B188" stop-opacity="0"/></radialGradient></defs>`;
  const one = (dx, s) => `<ellipse cx="${NX + dx}" cy="${NY + s * w}" rx="${r}" ry="${r * .82}" fill="url(#mkCheek)"/><ellipse cx="${NX + dx + Math.sign(dx) * r * .25}" cy="${NY + s * w + r * .3}" rx="${r * .45}" ry="${r * .18}" fill="#E8A0A0" opacity="${.15 + n * .05}"/>`;
  return g + one(-(48 + n * 5), 1) + one(48 + n * 5, -1); };
var EP = {
  dur: 9.5,
  bgmHolds: '5.4-6.0',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.0, type: 'tap' }, { t: 1.6, type: 'tap' }, { t: 2.2, type: 'tap' }, { t: 2.8, type: 'swish' }, { t: 3.3, type: 'swish' }, { t: 3.8, type: 'swish' }, { t: 4.3, type: 'swish' }, { t: 4.8, type: 'swish' },
    { t: 5.4, type: 'blink' }, { t: 6.0, type: 'twitch' }, { t: 7.2, type: 'click' }, { t: 7.6, type: 'pon' }, { t: 8.2, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [15, 0] });
    const left = t < 2.8 ? 5 : Math.max(0, 5 - Math.floor((t - 2.3) / 0.5));      // 2.8〜4.8 で 5 → 0
    const inMouth = t < 7.6 ? 5 - left : 4;                                       // 7.6 に1個ぽん
    const peel = Math.min(1, Math.max(0, (t - 1.0) / 4.0));                       // ジルのむき進み
    const grab = t >= 2.6 && t < 5.0;
    // ジル（左）：皮をむく（下を向く・小さくうなずく）→ 5.0 顔を上げる → 5.4 空っぽに驚く → 6.0 ジト目 → 7.2 ほっぺをつつく（lean）→ 7.6 「…」
    const jface = t < 5.4 ? RIG.FACES.smile : t < 6.0 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : t < 7.6 ? RIG.FACES.annoyed : RIG.FACES.smug;
    const jp = Object.assign({}, t >= 7.0 && t < 7.8 ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 40, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: t < 5.0 ? 0 : .8, headNod: t < 5.0 ? 16 + Math.abs(Math.sin(t * 9)) * 6 : 0, bodyTilt: t >= 7.0 && t < 7.8 ? -14 : 0 });
    L.char('jil', jp, t, '', {});
    // レン（右）：見ている → 取る（lean・小刻み）→ 何食わぬ顔（目をそらす・汗）→ つつかれて目をぱちくり → 照れ
    const rface = t < 2.6 ? RIG.FACES.neutral : t < 5.0 ? RIG.FACES.smile : t < 7.6 ? Object.assign({}, RIG.FACES.oops, { sweat: 1 }) : RIG.FACES.shy;
    const rp = Object.assign({}, grab ? RIG.POSES.lean : RIG.POSES.sit, rface, { x: 540, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: t < 2.6 ? .8 : grab ? .4 : t < 7.6 ? -.6 : .6, bodyTilt: grab ? -12 + Math.sin(t * 40) * 3 : 0, bodySquash: Math.min(.18, inMouth * .04) });
    L.char('ren', rp, t, CHEEKS(inMouth, t), {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    fx += BOWL(560, DESK - 10, left);
    fx += PEEL(250, DESK - 60, peel);
    if (grab) fx += L.speed(700, DESK - 120, .35, 18);
    // 取る手：0.5 秒ごとに器へ伸びて、みかんを持って口へ戻る
    if (t >= 2.6 && t < 4.9) { const u = ((t - 2.3) % 0.5) / 0.5, out = Math.sin(u * Math.PI), hx = 760 - 180 * out, hy = DESK - 150 + 110 * out; fx += `<g pointer-events="none"><ellipse cx="${hx}" cy="${hy}" rx="34" ry="26" fill="#D9B48C" stroke="#B88A5C" stroke-width="4"/>${u > .5 ? MIKAN(hx - 6, hy - 26, .6) : ''}</g>`; }
    // ジルの指：ほっぺをつつく（7.2〜7.7）
    if (t >= 7.1 && t < 7.8) { const k = ease(seg(t, 7.1, 7.5)); fx += `<g pointer-events="none" transform="translate(${560 + 150 * k} ${DESK - 230}) rotate(-8)"><rect x="-120" y="-14" width="120" height="28" rx="14" fill="#DEC9A8" stroke="#B89B74" stroke-width="4"/><ellipse cx="0" cy="0" rx="22" ry="17" fill="#DEC9A8" stroke="#B89B74" stroke-width="4"/></g>`; }
    if (t > 5.4 && t < 6.0) fx += L.emark(230, DESK - 650, 1.0);
    if (t > 6.0 && t < 7.0) fx += L.emark(230, DESK - 650, 1.0, '…');
    if (t > 7.6 && t < 8.1) fx += L.impact(800, DESK - 190, seg(t, 7.6, 8.1), .8, '#F5A02A');
    if (t >= 7.6) { const k = ease(seg(t, 7.6, 8.0)); fx += MIKAN(760 - 180 * k, DESK - 200 + Math.sin(k * Math.PI) * -120 + k * 160, 1); }   // ぽんと出て机へ
    if (t > 8.0) fx += L.sparkles(580, DESK - 100, t, .8, 4);
    let ui = (t > 1.8 && t < 3.0 ? CHIP(L, 'WINTER MIKAN: 5', 'ジルのみかん、5個', 1380, seg(t, 1.8, 2.1)) : '')
      + (t > 4.9 && t < 6.2 ? CHIP(L, '4 SECONDS: 0', '4秒で、0個', 1380, seg(t, 4.9, 5.2)) : '')
      + (t > 7.4 && t < 8.6 ? CHIP_OFF(L, 'FOUND: THE CHEEKS', '発見：上司のほっぺ', 1380, seg(t, 7.4, 7.7)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 540, cy: 1150 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1150, d: .9 },
      { t: 2.5, z: 1.25, cx: 640, cy: 1200, d: .4 },                // 器とレンの手
      { t: 5.0, z: 1.05, cx: 540, cy: 1150, d: .4 },
      { t: 7.0, z: 1.35, cx: 760, cy: 1200, d: .5 },                // ほっぺ
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 7.6 && t < 7.7 ? 3 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
