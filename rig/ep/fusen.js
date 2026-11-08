// 「付箋」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：ジルが付箋に「TODO」と書いて、パソコンのふちにぴしっと1枚（きりっ）
// ひっくり返し：課長も付箋の束を持ってやる気 → ぺた、ぺた、ぺた……全部、自分の体に貼っていく
// オチ：耳にもおなかにも付箋。どこに貼ったか探してきょろきょろ。字幕「上司のメモ：ぜんぶ自分に貼る」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const DESKFX = (L, DESK) => `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
  + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
const NOTE = (x, y, r, txt, k, col = '#FFE27A') => k <= 0 ? '' : `<g transform="translate(${x} ${y}) rotate(${r}) scale(${L_ob(k)})"><rect x="-38" y="-38" width="76" height="76" rx="4" fill="${col}" stroke="#D9B84A" stroke-width="3"/><rect x="-38" y="-38" width="76" height="14" fill="#F2CF5A"/><text y="16" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="20" fill="#6B5420">${txt}</text></g>`;
const L_ob = k => window.L ? window.L.outBack(Math.min(1, k * 3)) : 1;
var EP = {
  dur: 9.5,
  bgmHolds: '5.6-6.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.7, type: 'swish' }, { t: 1.6, type: 'tap' }, { t: 2.2, type: 'chime' }, { t: 2.8, type: 'blink' }, { t: 3.5, type: 'tap' }, { t: 3.85, type: 'tap' },
    { t: 4.2, type: 'tap' }, { t: 4.55, type: 'tap' }, { t: 4.9, type: 'tap' }, { t: 5.25, type: 'tap' }, { t: 5.8, type: 'boing' }, { t: 7.0, type: 'twitch' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400, RN = [858, 1156];
    const bg = L.office({ sky: 'day', clock: [10, 0] });
    // ジル（左）：書いて貼る（lean・きりっ）→ 満足 → 課長が貼りまくるのに「？」→ ジト目
    const jl = t > .5 && t < 1.8;
    const jface = t < 2.2 ? RIG.FACES.sharp : t < 3.4 ? Object.assign({}, RIG.FACES.smile, { sparkle: t < 2.9 ? 1 : 0 }) : t < 5.8 ? Object.assign({}, RIG.FACES.think, { question: 1 }) : RIG.FACES.annoyed;
    L.char('jil', Object.assign({}, jl ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 20, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: t > 2.6 ? .9 : .3, bodyTilt: jl ? -8 : 0 }), t, '', {});
    // レン（右）：見ている → 付箋の束でやる気 → 自分にぺたぺた（きりっ）→ どこ？（きょろきょろ）
    const stick = t >= 3.4 && t < 5.6, look = t >= 5.6 && t < 7.4;
    const rface = t < 2.8 ? RIG.FACES.neutral : t < 3.4 ? Object.assign({}, RIG.FACES.smile, { sparkle: 1 }) : stick ? RIG.FACES.sharp : look ? Object.assign({}, RIG.FACES.think, { question: 1 }) : Object.assign({}, RIG.FACES.oops, { sweat: 1 });
    L.char('ren', Object.assign({}, RIG.POSES.sit, rface, { x: 560, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: look ? Math.sin(t * 5) * .8 : -.3, headTilt: look ? Math.sin(t * 5) * 10 : 0, bodyTilt: stick ? Math.sin(t * 9) * 4 : 0 }), t, '', {});
    let fx = DESKFX(L, DESK);
    // ジルのパソコン（顔より下）と、ふちの付箋1枚
    fx += L.laptop(330, DESK, .55, `<g fill="#9FB4C6">${[0, 1, 2, 3].map(i => `<rect x="30" y="${40 + i * 40}" width="${i === 3 ? 140 : 260}" height="14" rx="7"/>`).join('')}</g>`);
    fx += NOTE(418, DESK - 112, 6, 'TODO', seg(t, 1.5, 1.8));
    // 課長の付箋の束（手もと）
    if (t > 2.8 && t < 5.6) fx += `<g transform="translate(700 ${DESK - 20})"><rect x="-44" y="-30" width="88" height="40" rx="4" fill="#FFE27A" stroke="#D9B84A" stroke-width="3"/><rect x="-44" y="-30" width="88" height="10" fill="#F2CF5A"/></g>`;
    // 自分に貼る：耳・肩・おなか・机・イス（顔の上には貼らない）
    const spots = [[RN[0] - 70, RN[1] + 210, -8, 'にんじん'], [RN[0] + 150, RN[1] + 150, 12, '会議'], [RN[0] - 175, RN[1] + 50, -14, '牧草'], [RN[0] + 70, RN[1] + 230, 6, 'ひるね'], [RN[0] + 175, RN[1] + 40, 16, 'おやつ'], [RN[0] - 200, RN[1] + 120, -10, '電話']];
    spots.forEach(([x, y, r, txt], i) => { fx += NOTE(x, y + (look ? Math.sin(t * 5 + i) * 3 : 0), r, txt, seg(t, 3.5 + i * .35, 3.8 + i * .35)); });
    if (look) fx += L.emark(RN[0] + 260, RN[1] - 240, .8, '?');
    if (t > 7.2 && t < 8.6) fx += L.emark(220, DESK - 660, 1.0, '…');
    let ui = (t > 0.8 && t < 2.6 ? CHIP(L, 'STICKY NOTE', 'ジル、付箋を1枚', 1650, seg(t, .8, 1.1)) : '')
      + (t > 6.0 && t < 8.6 ? CHIP(L, 'MEMOS: ALL ON HIMSELF', '上司のメモ：ぜんぶ自分に貼る', 1650, seg(t, 6.0, 6.3)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 360, cy: 1150 },
      { t: 0.01, z: 1.1, cx: 420, cy: 1120, d: .9 },
      { t: 2.8, z: 1.2, cx: 760, cy: 1120, d: .5 },                 // 課長の番
      { t: 5.8, z: 1.0, cx: 560, cy: 1080, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
