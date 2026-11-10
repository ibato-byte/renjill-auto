// 「ペン回し」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：考えごと中のジル。指先でペンをくるくる（きりっ）
// ひっくり返し：課長もやってみる → ペンは回らず、課長のほうがくるくる回る（イスごと）
// オチ：目が回ってふらふら、ペンは机に立ったまま。字幕「上司のペン回し：本人が回る」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
const PEN = (x, y, r, c) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-80" y="-9" width="160" height="18" rx="8" fill="${c}" stroke="#2B5E8A" stroke-width="3"/><rect x="-86" y="-10" width="26" height="20" rx="6" fill="#2B5E8A"/><path d="M80 -9 L102 0 L80 9 Z" fill="#F2D3A8"/></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '5.6-6.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.7, type: 'swish' }, { t: 1.1, type: 'swish' }, { t: 1.5, type: 'swish' }, { t: 2.2, type: 'chime' }, { t: 3.2, type: 'blink' }, { t: 3.8, type: 'swish' },
    { t: 4.1, type: 'swish' }, { t: 4.4, type: 'swish' }, { t: 4.7, type: 'swish' }, { t: 5.0, type: 'swish' }, { t: 5.6, type: 'boing' }, { t: 7.0, type: 'twitch' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400, RN = [858, 1156];
    const bg = L.office({ sky: 'day', clock: [15, 0] });
    const jspin = t > .6 && t < 2.4, rspin = t >= 3.8 && t < 5.6, dizzy = t >= 5.6;
    // ジル（左）：ペン回し（きりっ）→ 課長を見て「？」→ くるくる回る課長に「！」→ ジト目
    const jface = t < 2.4 ? RIG.FACES.sharp : t < 3.8 ? Object.assign({}, RIG.FACES.smile, { sparkle: t < 3.0 ? 1 : 0 }) : t < 5.6 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : RIG.FACES.annoyed;
    L.char('jil', Object.assign({}, RIG.POSES.sit, jface, { x: 20, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: t > 2.4 ? .9 : .2 }), t, '', {});
    // レン（右）：見ている → やる気（きらきら）→ 体ごとくるくる（向きが左右に入れかわる）→ 目が回ってふらふら
    const sp = rspin ? (t - 3.8) * (8 + 10 * seg(t, 3.8, 4.6)) : 0;
    const rface = t < 3.2 ? RIG.FACES.neutral : t < 3.8 ? Object.assign({}, RIG.FACES.smile, { sparkle: 1 }) : rspin ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : Object.assign({}, RIG.FACES.oops, { eyeOpen: .4 });
    L.char('ren', Object.assign({}, RIG.POSES.sit, rface, { x: 560, y: DESK - 413 * 1.35, scale: 1.35, flip: rspin ? Math.cos(sp) > 0 : true, eyeLook: -.3, bodyTilt: rspin ? Math.sin(sp) * 8 : dizzy && t < 7.6 ? Math.sin(t * 6) * 9 : 0, headTilt: dizzy && t < 7.6 ? Math.sin(t * 6 + 1) * 10 : 0 }), t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // ジルのペン：顔の右の上で、くるくる
    fx += PEN(430, 1000, jspin ? (t - .6) * 900 : 30, '#5BA6D6');
    if (jspin) fx += `<circle cx="430" cy="1000" r="96" fill="none" stroke="#5BA6D6" stroke-width="4" stroke-dasharray="14 18" opacity=".45"/>`;
    // 課長のペン：机に立ったまま（回らない）
    fx += `<g transform="translate(990 ${DESK - 90}) rotate(-90)">${PEN(0, 0, 0, '#E8473A')}</g>`;
    // 回っている線（体のまわり、顔にはかけない）
    if (rspin) fx += [0, 1, 2].map(i => { const a = sp * .8 + i * 2.1; return `<path d="M${RN[0] + Math.cos(a) * 260} ${RN[1] + 120 + Math.sin(a) * 40} q${Math.cos(a + 1) * 60} ${Math.sin(a + 1) * 20} ${Math.cos(a + 1.6) * 120} ${Math.sin(a + 1.6) * 40}" stroke="#8C7B66" stroke-width="7" fill="none" stroke-linecap="round" opacity=".6"/>`; }).join('');
    if (rspin) fx += `<text x="${RN[0] + 210}" y="${RN[1] - 230}" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="64" fill="#E8473A" stroke="#FFF7E8" stroke-width="10" paint-order="stroke" transform="rotate(${Math.sin(t * 9) * 8} ${RN[0] + 210} ${RN[1] - 230})">くるくる</text>`;
    // 目が回った：頭の上でぐるぐる
    if (dizzy && t < 7.6) fx += `<g transform="translate(${RN[0] - 10} ${RN[1] - 290}) rotate(${t * 200})"><path d="M0 -30 A30 30 0 1 1 -30 0 A20 20 0 1 1 0 -20 A10 10 0 1 1 -10 0" stroke="#8C7B66" stroke-width="7" fill="none" stroke-linecap="round"/></g>`;
    if (t > 7.4 && t < 8.6) fx += L.emark(220, DESK - 650, 1.0, '…');
    let ui = (t > 0.8 && t < 2.6 ? CHIP(L, 'PEN SPINNING', 'ジルのペン回し', 1600, seg(t, .8, 1.1)) : '')
      + (t > 6.0 && t < 8.6 ? CHIP_OFF(L, 'BOSS: HE SPINS INSTEAD', '上司のペン回し：本人が回る', 1600, seg(t, 6.0, 6.3)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 380, cy: 1080 },
      { t: 0.01, z: 1.1, cx: 420, cy: 1080, d: .9 },
      { t: 3.2, z: 1.15, cx: 700, cy: 1100, d: .5 },                // 課長の番
      { t: 6.0, z: 1.0, cx: 540, cy: 1080, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
