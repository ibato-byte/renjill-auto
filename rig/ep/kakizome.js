// 「書き初め」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：1月5日。ジルが半紙に「努力」と書いて、壁にはる（にこ）
// ひっくり返し：課長も大きな筆で挑戦。机いっぱいにぶんぶん → 大きな紙が壁に
// オチ：課長の抱負は「牧草」。課長はご満悦、ジルはジト目。字幕「今年の抱負：牧草」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 総見直し（2026-11-10）：字幕は2回まで。3回目以降（オチの説明）は出さず、絵で見せる
// 壁の半紙（中心 x,y・幅 w・高さ h）。字は上から順に、k（0〜1）で1文字ずつ出る
const SHEET = (x, y, w, h, chars, k, s) => s <= 0 ? '' : `<g transform="translate(${x} ${y}) scale(${s})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="#FFFDF7" stroke="#D7CCBB" stroke-width="5"/><rect x="${-w / 2 - 10}" y="${-h / 2 - 14}" width="${w + 20}" height="20" rx="8" fill="#8C5A3C"/>`
  + chars.map((c, i) => `<text y="${-h / 2 + h * (i + .5) / chars.length + h * .17 / chars.length}" text-anchor="middle" font-family="Noto Serif CJK JP, Noto Sans CJK JP" font-weight="900" font-size="${Math.min(w * .8, h / chars.length * .8)}" fill="#1E1A17" opacity="${Math.max(0, Math.min(1, k * chars.length - i))}">${c}</text>`).join('')
  + `<rect x="${w / 2 - 34}" y="${h / 2 - 50}" width="22" height="22" fill="#D8423A"/></g>`;
// 筆（毛先 x,y・回転 r・長さ len）
const BRUSH = (x, y, r, len) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-9" y="${-len}" width="18" height="${len - 40}" rx="8" fill="#B9874E" stroke="#8C5A3C" stroke-width="4"/><path d="M-14 -46 Q-16 -10 0 10 Q16 -10 14 -46 Z" fill="#1E1A17"/></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '5.3-5.9',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.9, type: 'swish' }, { t: 1.5, type: 'swish' }, { t: 2.4, type: 'chime' }, { t: 3.1, type: 'boing' }, { t: 3.6, type: 'swish' }, { t: 4.0, type: 'swish' }, { t: 4.4, type: 'swish' },
    { t: 4.8, type: 'swish' }, { t: 5.4, type: 'pon' }, { t: 6.2, type: 'blink' }, { t: 7.2, type: 'twitch' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [10, 0], noClock: true });
    const write = seg(t, .8, 2.2);                          // ジルが書く
    const big = t >= 3.4 && t < 5.2;                        // 課長がぶんぶん
    // ジル（左）：書く（lean・きりっ）→ はって満足（にこ）→ 課長を見る → 「牧草」にジト目
    const jface = t < 2.3 ? RIG.FACES.sharp : t < 3.2 ? Object.assign({}, RIG.FACES.smile, { sparkle: 1 }) : t < 5.6 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : RIG.FACES.annoyed;
    const jw = t > .7 && t < 2.3;
    L.char('jil', Object.assign({}, jw ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 20, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: t < 2.3 ? .3 : .9, bodyTilt: jw ? -10 : 0 }), t, '', {});
    // レン（右）：じっと見る → やる気（stand・きらきら）→ 体ごとぶんぶん → ご満悦
    const rface = t < 2.6 ? RIG.FACES.neutral : t < 3.4 ? Object.assign({}, RIG.FACES.smile, { sparkle: 1 }) : t < 5.3 ? RIG.FACES.sharp : Object.assign({}, RIG.FACES.smug, { sparkle: t < 7.0 ? 1 : 0 });
    L.char('ren', Object.assign({}, t >= 2.8 && t < 5.3 ? RIG.POSES.stand : RIG.POSES.sit, rface, { x: 560, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: -.4, bodyTilt: big ? Math.sin(t * 16) * 9 : 0 }), t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // 机の上：ジルの小さな半紙と硯、課長の大きな紙
    fx += `<rect x="300" y="${DESK - 14}" width="200" height="16" fill="#FFFDF7" stroke="#D7CCBB" stroke-width="3"/><rect x="190" y="${DESK - 30}" width="80" height="32" rx="8" fill="#2E2A27"/>`;
    fx += `<rect x="640" y="${DESK - 14}" width="380" height="16" fill="#FFFDF7" stroke="#D7CCBB" stroke-width="3"/>`;
    if (jw) fx += BRUSH(330 + 140 * write + Math.sin(t * 14) * 12, DESK - 16, -20 + Math.sin(t * 10) * 10, 170);
    if (t >= 2.8 && t < 5.3) { const u = big ? Math.sin((t - 3.4) * 7) : 0; fx += BRUSH(830 + u * 170, DESK - 18 - (t < 3.4 ? 120 * (3.4 - t) / .6 : 0), u * 40, 420); }
    if (big) fx += `<g fill="#1E1A17">${[0, 1, 2, 3, 4].map(i => { const a = (t * 3 + i * 1.3) % 1; return `<circle cx="${700 + i * 70 + Math.sin(i * 7) * 30}" cy="${DESK - 40 - a * 160}" r="${9 * (1 - a)}" opacity="${(1 - a).toFixed(2)}"/>`; }).join('')}</g>`;
    // 壁：ジルの「努力」→ 課長の「牧草」
    fx += SHEET(250, 470, 170, 300, ['努', '力'], 1, outBack(seg(t, 2.2, 2.6)));
    fx += SHEET(800, 470, 260, 380, ['牧', '草'], seg(t, 5.5, 6.1), outBack(seg(t, 5.3, 5.7)));
    if (t > 5.3 && t < 5.7) fx += L.impact(800, 470, seg(t, 5.3, 5.7), 1.1, '#1E1A17');
    if (t > 6.0 && t < 7.2) fx += L.sparkles(800, 470, t, 1.6, 8);
    if (t > 7.0 && t < 8.6) fx += L.emark(380, DESK - 640, 1.0, '…');
    let ui = (t > 0.9 && t < 2.6 ? CHIP(L, 'CALLIGRAPHY', '書き初め', 1600, seg(t, .9, 1.2)) : '')
      + (t > 3.4 && t < 5.2 ? CHIP(L, 'BOSS: BIG BRUSH', '上司も大きな筆で', 1600, seg(t, 3.4, 3.7)) : '')
      + (t > 6.4 && t < 8.6 ? CHIP_OFF(L, 'NEW YEAR GOAL: HAY', '今年の抱負：牧草', 1600, seg(t, 6.4, 6.7)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 360, cy: 1050 },
      { t: 0.01, z: 1.0, cx: 540, cy: 1000, d: .9 },
      { t: 3.3, z: 1.15, cx: 700, cy: 1100, d: .5 },                // ぶんぶん
      { t: 5.3, z: .95, cx: 540, cy: 900, d: .5 },                  // 壁の2枚（引き）
      { t: 7.2, z: 1.05, cx: 540, cy: 1000, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 5.3 && t < 5.5 ? 5 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
