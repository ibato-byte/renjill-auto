// 「福笑い」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：お正月の遊び。ジルが目かくしをして、うさぎの顔の紙に目・鼻・口を置く → ばらばら（課長は大笑い）
// ひっくり返し：課長の番。目かくしをする → でも置いた顔は完ぺき
// オチ：カメラが寄ると、課長の目かくしはおでこの上。目はぱっちり。字幕「目かくし：おでこ」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
// 部品：目（左右）・鼻・口。正しい位置と、ジルが置いたばらばらの位置
const GOOD = [[-38, 0, 0], [38, 0, 0], [0, 34, 0], [0, 62, 0]];
const MESS = [[-74, -70, 0], [64, 92, 0], [78, -24, 70], [-66, 58, 90]];
const PART = (i, x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})">${i < 2 ? '<circle r="14" fill="#2B1B12"/><circle cx="4" cy="-5" r="4" fill="#FFF"/>' : i === 2 ? '<path d="M-14 -8 L14 -8 L0 8 Z" fill="#D98F8E"/>' : '<path d="M-22 -4 Q-11 12 0 -2 Q11 12 22 -4" fill="none" stroke="#5A3A2A" stroke-width="5" stroke-linecap="round"/>'}</g>`;
// 紙（中心 x,y）。placed(i)=[x,y,r] か null
const PAPER = (x, y, s, placed) => s <= 0 ? '' : `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-140" y="-170" width="280" height="330" rx="10" fill="#FFFDF7" stroke="#D7CCBB" stroke-width="5"/><rect x="-150" y="-184" width="300" height="20" rx="8" fill="#8C5A3C"/>`
  + `<g fill="none" stroke="#B9A48C" stroke-width="5"><ellipse cx="-44" cy="-96" rx="22" ry="58"/><ellipse cx="44" cy="-96" rx="22" ry="58"/><ellipse cx="0" cy="24" rx="104" ry="92"/></g>`
  + [0, 1, 2, 3].map(i => placed(i) ? PART(i, ...placed(i)) : '').join('') + `</g>`;
// 目かくし（中心 x,y・幅 w）
const BAND = (x, y, w, k) => k <= 0 ? '' : `<g transform="translate(${x} ${y}) scale(${k} 1)"><rect x="${-w / 2}" y="-19" width="${w}" height="38" rx="16" fill="#E8473A" stroke="#B8302A" stroke-width="4"/><path d="M${w / 2 - 6} 0 l34 -26 l6 30 Z M${w / 2 - 6} 0 l30 30 l-4 -28 Z" fill="#E8473A" stroke="#B8302A" stroke-width="3"/></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '5.9-6.5',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.7, type: 'swish' }, { t: 1.3, type: 'tap' }, { t: 1.7, type: 'tap' }, { t: 2.1, type: 'tap' }, { t: 2.5, type: 'tap' }, { t: 3.0, type: 'blink' }, { t: 3.3, type: 'boing' },
    { t: 4.0, type: 'swish' }, { t: 4.5, type: 'tap' }, { t: 4.8, type: 'tap' }, { t: 5.1, type: 'tap' }, { t: 5.4, type: 'tap' }, { t: 5.8, type: 'chime' }, { t: 6.5, type: 'blink' }, { t: 7.4, type: 'twitch' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400, J = [263, 1165], R = [858, 1156];      // 鼻の位置（座った姿勢）
    const JP = [270, 520], RP = [810, 520];                    // 壁の紙
    const bg = L.office({ sky: 'day', clock: [14, 0], noClock: true });
    const jBlind = t >= .6 && t < 2.9, rBlind = t >= 3.9;
    // ジル（左）：目かくし（lean で置く）→ 外して「！」→ 課長の番を見る → 完ぺきに「？」→ ジト目
    const jface = t < 2.9 ? RIG.FACES.smile : t < 3.9 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : t < 5.8 ? RIG.FACES.neutral : t < 6.6 ? Object.assign({}, RIG.FACES.think, { question: 1 }) : RIG.FACES.annoyed;
    const jl = false;                                          // 目かくし中は座ったまま（顔の位置と目かくしをそろえる）
    L.char('jil', Object.assign({}, jl ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 20, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: .7, bodyTilt: jl ? -8 : 0 }), t, '', {});
    // レン（右）：見ている → 大笑い（binky）→ 目かくし（でもおでこ）→ 目はぱっちり、ご満悦
    const rface = t < 2.9 ? RIG.FACES.neutral : t < 3.9 ? Object.assign({}, RIG.FACES.smile, { sparkle: 1 }) : t < 5.8 ? Object.assign({}, RIG.FACES.neutral, { eyeLook: Math.sin(t * 6) * .6 }) : Object.assign({}, RIG.FACES.smug, { sparkle: t < 7.0 ? 1 : 0 });
    L.char('ren', Object.assign({}, t >= 3.0 && t < 3.8 ? RIG.POSES.binky : RIG.POSES.sit, rface, { x: 560, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: t >= 3.9 && t < 5.8 ? Math.sin(t * 6) * .6 : -.3 }), t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // 紙と部品：ジルは 1.3〜2.5、課長は 4.5〜5.4 に 1 つずつ（0.3 秒で飛んでいく）
    const placeAt = (start, step, tgt, hand, P) => i => { const t0 = start + i * step; if (t < t0) return null; const u = ease(Math.min(1, (t - t0) / .3)); const [tx, ty, tr] = tgt[i];
      return [hand[0] - P[0] + (tx - hand[0] + P[0]) * u, hand[1] - P[1] + (ty - hand[1] + P[1]) * u - Math.sin(u * Math.PI) * 60, tr * u]; };
    fx += PAPER(JP[0], JP[1], outBack(seg(t, .2, .6)), placeAt(1.3, .4, MESS, [300, DESK - 60], JP));
    fx += PAPER(RP[0], RP[1], outBack(seg(t, 3.7, 4.1)), placeAt(4.5, .3, GOOD, [760, DESK - 60], RP));
    // 目かくし：ジルは目の上、課長はおでこの上（目は出ている）
    if (jBlind) fx += BAND(J[0], J[1] - 44, 250, outBack(seg(t, .6, .9)));
    if (t >= 2.9 && t < 3.3) fx += `<g transform="translate(${J[0] + 40 * seg(t, 2.9, 3.3)} ${J[1] - 44 - 300 * seg(t, 2.9, 3.3)}) rotate(${200 * seg(t, 2.9, 3.3)})" opacity="${1 - seg(t, 2.9, 3.3)}">${BAND(0, 0, 250, 1)}</g>`;
    if (rBlind) fx += BAND(R[0] - 6, R[1] - 136, 220, outBack(seg(t, 3.9, 4.2)));
    if (t > 3.0 && t < 3.8) fx += L.sparkles(R[0], R[1] - 160, t, 1.0, 5);
    if (t > 5.8 && t < 6.8) fx += L.sparkles(RP[0], RP[1], t, 1.5, 8);
    if (t > 7.2 && t < 8.6) fx += L.emark(220, DESK - 650, 1.0, '…');
    let ui = (t > 0.8 && t < 2.6 ? CHIP(L, 'FUKUWARAI', '福笑い：目かくしで顔を作る', 1600, seg(t, .8, 1.1)) : '')
      + (t > 4.2 && t < 5.7 ? CHIP_OFF(L, "BOSS'S TURN", '課長の番', 1600, seg(t, 4.2, 4.5)) : '')
      + (t > 6.6 && t < 8.6 ? CHIP_OFF(L, 'BLINDFOLD: FOREHEAD', '目かくし：おでこ', 1600, seg(t, 6.6, 6.9)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 360, cy: 900 },
      { t: 0.01, z: 1.0, cx: 540, cy: 960, d: .9 },
      { t: 2.9, z: 1.2, cx: 420, cy: 900, d: .4 },                  // ばらばらの顔
      { t: 3.9, z: 1.0, cx: 540, cy: 960, d: .5 },
      { t: 5.8, z: 1.1, cx: 640, cy: 860, d: .4 },                  // 完ぺきな顔
      { t: 6.4, z: 1.45, cx: 820, cy: 1080, d: .5 },                // おでこの目かくし
      { t: 7.6, z: 1.05, cx: 540, cy: 1000, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
