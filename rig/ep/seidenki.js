// 「静電気」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：冬の乾いたオフィス。ジルが課長に書類をわたそうとして、パチッ！
// ひっくり返し：課長の毛がパチパチ → 机の上の物が次々と課長にくっつく（ふせん・ペン・書類・クリップ）
// オチ：ジルがさがしていたペンも課長にくっついていた。課長はご満悦。字幕「なくし物：ぜんぶ上司に」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
const ZAP = (x, y, k, s = 1) => k <= 0 || k >= 1 ? '' : `<g transform="translate(${x} ${y}) scale(${s * (.7 + k * .5)})" opacity="${1 - k}" stroke="#FFD24A" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none">${[0, 1, 2, 3, 4, 5].map(i => { const a = i / 6 * Math.PI * 2 + .3; return `<path d="M${Math.cos(a) * 30} ${Math.sin(a) * 30} L${Math.cos(a + .2) * 60} ${Math.sin(a + .2) * 60} L${Math.cos(a - .1) * 80} ${Math.sin(a - .1) * 80} L${Math.cos(a + .15) * 110} ${Math.sin(a + .15) * 110}"/>`; }).join('')}</g>`;
// くっつく物（種類 k）
const THING = (k, x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})">` + (
  k === 'note' ? `<rect x="-30" y="-30" width="60" height="60" rx="4" fill="#FFE27A" stroke="#E0B94A" stroke-width="3"/><rect x="-18" y="-10" width="36" height="5" fill="#C9A24A"/>`
  : k === 'pen' ? `<rect x="-60" y="-8" width="120" height="16" rx="7" fill="#5BA6D6" stroke="#3E7FAE" stroke-width="3"/><rect x="-66" y="-9" width="22" height="18" rx="5" fill="#2B5E8A"/><path d="M60 -8 L80 0 L60 8 Z" fill="#F2D3A8"/>`
  : k === 'paper' ? `<rect x="-42" y="-54" width="84" height="108" rx="4" fill="#FFFDF7" stroke="#CFC3B0" stroke-width="3"/><g fill="#CFC3B0">${[0, 1, 2, 3].map(i => `<rect x="-28" y="${-34 + i * 18}" width="${i === 3 ? 30 : 56}" height="5"/>`).join('')}</g>`
  : `<path d="M-14 -26 L-14 18 Q-14 30 0 30 Q14 30 14 18 L14 -20 Q14 -28 6 -28 Q-2 -28 -2 -20 L-2 14" fill="none" stroke="#9AA3AE" stroke-width="5"/>`) + `</g>`;
// [種類, 机の上の位置, くっつく位置, 回転]（顔をかくさないよう、体と耳のまわり）
const STICK = [['note', [960, 1360], [690, 1270], -20], ['paper', [1000, 1340], [990, 1300], 14], ['clip', [880, 1370], [640, 1180], 30], ['note', [1040, 1370], [1010, 1190], 18], ['paper', [620, 1340], [760, 1360], -8], ['pen', [700, 1380], [900, 1355], -12]];
var EP = {
  dur: 9.5,
  bgmHolds: '5.6-6.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.0, type: 'twitch' }, { t: 1.1, type: 'boing' }, { t: 2.0, type: 'blink' }, { t: 3.0, type: 'swish' }, { t: 3.35, type: 'tap' }, { t: 3.7, type: 'tap' }, { t: 4.05, type: 'tap' },
    { t: 4.4, type: 'tap' }, { t: 4.75, type: 'tap' }, { t: 5.1, type: 'tap' }, { t: 5.9, type: 'chime' }, { t: 7.2, type: 'twitch' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400, RN = [858, 1156];                 // レンの鼻（座った姿勢）
    const bg = L.office({ sky: 'day', clock: [10, 30] });
    // ジル（左）：書類をわたす（lean）→ パチッで「！」→ くっつくのをぽかん → ペンを見つけてジト目
    const reach = t > .4 && t < 1.1;
    const jface = t < 1.0 ? RIG.FACES.smile : t < 2.2 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : t < 5.6 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : t < 6.8 ? Object.assign({}, RIG.FACES.think, { question: 1 }) : RIG.FACES.annoyed;
    L.char('jil', Object.assign({}, reach ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 20, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: .8, bodyTilt: reach ? -14 : t > 1.0 && t < 1.4 ? 8 : 0 }), t, '', {});
    // レン（右）：パチッ → 毛がパチパチ（あせ）→ 物がくっつく → ご満悦
    const crackle = t >= 1.0 && t < 5.4;
    const rface = t < 1.0 ? RIG.FACES.neutral : t < 3.0 ? RIG.FACES.oops : t < 5.6 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : Object.assign({}, RIG.FACES.smug, { sparkle: t < 7.2 ? 1 : 0 });
    L.char('ren', Object.assign({}, RIG.POSES.sit, rface, { x: 560, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: -.3, bodyTilt: crackle && t < 3.0 ? Math.sin(t * 40) * 2 : 0 }), t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // ジルの書類（わたしかけて、パチッで机に落ちる）
    { const u = ease(seg(t, .4, 1.0)), d = seg(t, 1.1, 1.5); fx += THING('paper', 380 + 200 * u - 120 * d, DESK - 160 * u + 120 * d - 40 * (1 - u), -10 + 30 * d); }
    if (t > 1.0 && t < 1.5) fx += ZAP(600, 1180, seg(t, 1.0, 1.5), 1.2);
    // 毛のパチパチ（顔のまわりではなく、体の外がわ）
    if (crackle) fx += [[620, 1100], [1060, 1120], [700, 1420 - 60], [1020, 1340]].map(([x, y], i) => ZAP(x, y, ((t * 2.2 + i * .27) % 1), .45)).join('');
    // 物が飛んできて、くっつく（3.2 から 0.35 秒ごと）
    STICK.forEach(([k, a, b, r], i) => { const t0 = 3.2 + i * .35, u = ease(seg(t, t0, t0 + .3)); const x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u - Math.sin(u * Math.PI) * 140;
      fx += THING(k, x, t >= 5.4 ? y + Math.sin(t * 3 + i) * 3 : y, r * u); });
    // さいごのペンに「！」マーク（ジルのペン）
    if (t > 6.0 && t < 8.6) fx += `<g transform="translate(900 1290)"><circle r="34" fill="#E8473A"/><text y="16" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="46" fill="#FFF7E8">!</text></g>`;
    if (t > 5.8 && t < 7.0) fx += L.sparkles(RN[0], RN[1] - 40, t, 1.7, 8);
    if (t > 7.2 && t < 8.6) fx += L.emark(220, DESK - 650, 1.0, '…');
    let ui = (t > 1.2 && t < 2.9 ? CHIP(L, 'STATIC SHOCK', '冬の静電気、パチッ', 1600, seg(t, 1.2, 1.5)) : '')
      + (t > 3.4 && t < 5.4 ? CHIP_OFF(L, 'EVERYTHING STICKS', '課長に、なんでもくっつく', 1600, seg(t, 3.4, 3.7)) : '')
      + (t > 6.4 && t < 8.6 ? CHIP_OFF(L, 'LOST ITEMS: ON THE BOSS', 'なくし物：ぜんぶ上司に', 1600, seg(t, 6.4, 6.7)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 420, cy: 1100 },
      { t: 0.01, z: 1.1, cx: 520, cy: 1150, d: .9 },
      { t: 1.0, z: 1.25, cx: 560, cy: 1150, d: .3 },                // パチッ
      { t: 3.0, z: 1.1, cx: 720, cy: 1180, d: .5 },                 // くっつく
      { t: 6.0, z: 1.35, cx: 820, cy: 1220, d: .5 },                // ジルのペン
      { t: 7.2, z: 1.05, cx: 540, cy: 1120, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 1.0 && t < 1.25 ? 6 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
