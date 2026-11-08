// 「日めくり」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：12/15。机の日めくりカレンダー「15」。レンが1枚めくる（16）
// ひっくり返し：止まらない → 17・18・…・28（仕事納め）まで高速でめくる。紙が舞う。レンはのんびり（冬休み気分・ご満悦）
// オチ：ジルが「15」の紙を拾って、カレンダーにぺたっと貼り直す。レン、がーん。字幕「今日：12/15。上司の気分：12/28」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
// 日めくり（底の中央 x,y）
const PAGE = (day, red) => `<rect x="-120" y="-250" width="240" height="250" rx="10" fill="#fff" stroke="#D7CCBB" stroke-width="5"/><rect x="-120" y="-250" width="240" height="56" rx="10" fill="${red ? '#E8473A' : '#355F86'}"/><text y="-210" text-anchor="middle" font-family="Noto Sans" font-weight="900" font-size="34" fill="#fff">DEC</text><text y="-50" text-anchor="middle" font-family="Noto Sans" font-weight="900" font-size="130" fill="${red ? '#E8473A' : '#3A2414'}">${day}</text>`;
const CAL = (x, y, day) => `<g transform="translate(${x} ${y})"><rect x="-130" y="-12" width="260" height="20" rx="6" fill="#8C5A3C"/>${PAGE(day, day >= 28)}${day >= 28 ? `<text y="-150" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="30" fill="#E8473A">仕事納め</text>` : ''}</g>`;
// めくった紙が飛ぶ（k=0〜1）
const FLY = (x, y, day, k, i) => k <= 0 || k >= 1 ? '' : `<g transform="translate(${x + (i % 2 ? 1 : -1) * (120 + i * 13) * k} ${y - 200 * k + 420 * k * k}) rotate(${(i % 2 ? 1 : -1) * 260 * k}) scale(${.6 - .2 * k})" opacity="${1 - k * .5}">${PAGE(day, false)}</g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '5.6-6.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 2.2, type: 'swish' }, { t: 2.6, type: 'swish' }, { t: 2.8, type: 'swish' }, { t: 3.0, type: 'swish' }, { t: 3.2, type: 'swish' }, { t: 3.4, type: 'swish' }, { t: 3.6, type: 'swish' }, { t: 3.8, type: 'swish' }, { t: 4.0, type: 'swish' }, { t: 4.2, type: 'swish' }, { t: 4.4, type: 'swish' }, { t: 4.6, type: 'swish' }, { t: 4.9, type: 'chime' },
    { t: 5.6, type: 'blink' }, { t: 6.8, type: 'tap' }, { t: 7.3, type: 'thump' }, { t: 7.6, type: 'twitch' }, { t: 8.2, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400, CX = 600, CY = DESK + 6;
    const bg = L.office({ sky: 'day', clock: [11, 0] });
    // めくった枚数：2.2 で 16、2.6〜4.8 で 0.2 秒ごとに 17〜28
    const torn = t < 2.2 ? 0 : t < 2.6 ? 1 : Math.min(13, 2 + Math.floor((t - 2.6) / .2));
    const back = t >= 7.3;                                                  // ジルが 15 を貼り直す
    const day = back ? 15 : 15 + torn;
    const tearing = t >= 2.5 && t < 4.9;
    // ジル（左）：仕事中（にこ）→ めくる音に「？」→ ジト目 → 紙を拾って貼り直す（lean）→ 満足（smug）
    const jface = t < 3.0 ? RIG.FACES.smile : t < 4.9 ? RIG.FACES.think : t < 7.3 ? RIG.FACES.annoyed : RIG.FACES.smug;
    const jp = Object.assign({}, t >= 6.6 && t < 7.5 ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 40, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: .8, bodyTilt: t >= 6.6 && t < 7.5 ? -16 : 0, question: t >= 3.0 && t < 4.9 ? 1 : 0 });
    L.char('jil', jp, t, '', {});
    // レン（右）：1枚めくる → 止まらない（lean・頭が小刻み）→ 28 で冬休み気分（ご満悦・のんびり揺れる）→ 15 に戻されて がーん
    const rface = t < 2.3 ? RIG.FACES.neutral : t < 4.9 ? RIG.FACES.sharp : t < 7.3 ? Object.assign({}, RIG.FACES.smug, { blush: .8 }) : Object.assign({}, RIG.FACES.surprised, { excl: 1 });
    const rp = Object.assign({}, tearing || (t >= 2.0 && t < 2.4) ? RIG.POSES.lean : RIG.POSES.sit, rface, { x: 540, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: .5, bodyTilt: tearing ? -12 + Math.sin(t * 40) * 3 : 0, headTilt: t >= 4.9 && t < 7.3 ? Math.sin(t * 2.5) * 8 : 0 });
    L.char('ren', rp, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // 床（机の手前）に散らばった紙
    for (let i = 0; i < Math.min(torn, 12); i++) if (!(back && i === 0)) fx += `<g transform="translate(${CX - 360 + (i * 67) % 720} ${DESK + 200 + (i * 31) % 90}) rotate(${(i * 53) % 70 - 35}) scale(.42)">${PAGE(16 + i, false)}</g>`;
    fx += CAL(CX, CY, day);
    // 飛んでいる紙
    for (let i = 0; i < torn; i++) { const ts = i === 0 ? 2.2 : 2.6 + (i - 1) * .2; fx += FLY(CX, CY - 120, 15 + i, seg(t, ts, ts + .55), i); }
    if (tearing) fx += L.speed(CX, CY - 120, .3, 16);
    // 「15」の紙を貼り直す（6.6〜7.3：ジルの手元から）＋ テープ
    if (t >= 6.6 && t < 7.3) { const k = ease(seg(t, 6.6, 7.3)); fx += `<g transform="translate(${330 + (CX - 330) * k} ${DESK - 60 + (CY - 125 - DESK + 60) * k}) rotate(${-20 * (1 - k)}) scale(${.5 + .5 * k})"><g transform="translate(0 125)">${PAGE(15, false)}</g></g>`; }
    if (back) fx += `<rect x="${CX - 60}" y="${CY - 262}" width="120" height="26" fill="#F2E3A0" opacity=".85" transform="rotate(-6 ${CX} ${CY - 250})"/>`;
    if (t > 4.9 && t < 5.4) fx += L.impact(CX, CY - 140, seg(t, 4.9, 5.4), .8, '#E8473A');
    if (t > 5.0 && t < 7.0) fx += L.sparkles(837, 1060, t, 1.0, 5);
    if (t > 7.3 && t < 7.8) fx += L.impact(CX, CY - 140, seg(t, 7.3, 7.8), .7, '#355F86');
    let ui = (t > 1.4 && t < 2.6 ? CHIP(L, 'TODAY: DEC 15', '今日は12/15', 1580, seg(t, 1.4, 1.7)) : '')
      + (t > 5.0 && t < 6.6 ? CHIP(L, 'BOSS: DEC 28', '上司だけ、仕事納め', 1580, seg(t, 5.0, 5.3)) : '')
      + (t > 7.4 && t < 8.6 ? CHIP(L, 'BACK TO DEC 15', '今日は、12/15です', 1580, seg(t, 7.4, 7.7)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 540, cy: 1150 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1150, d: .9 },
      { t: 2.2, z: 1.25, cx: 640, cy: 1220, d: .4 },                // めくりまくる
      { t: 5.0, z: 1.05, cx: 560, cy: 1150, d: .5 },                // 28 とのんびり上司
      { t: 7.2, z: 1.3, cx: 700, cy: 1200, d: .4 },                 // 15 に戻されて がーん
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 7.3 && t < 7.4 ? 4 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
