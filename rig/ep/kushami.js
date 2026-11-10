// 「くしゃみ」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：冬。ジルが机の書類をきれいに積み上げる（きりっ）
// ひっくり返し：課長の鼻がむずむず……「へっ、へっ」→ 大きなくしゃみ！（うしろへ）
// オチ：書類が全部まい上がって、ジルの頭に1枚ふわり。課長は「…すまん」のあせ。字幕「上司のくしゃみ：書類が全部とぶ」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
const SHEET = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-56" y="-40" width="112" height="80" rx="4" fill="#FFFDF7" stroke="#CFC3B0" stroke-width="3"/><g fill="#CFC3B0">${[0, 1, 2].map(i => `<rect x="-40" y="${-22 + i * 16}" width="${i === 2 ? 44 : 80}" height="5"/>`).join('')}</g></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '4.6-5.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.6, type: 'tap' }, { t: 0.9, type: 'tap' }, { t: 1.2, type: 'tap' }, { t: 1.5, type: 'tap' }, { t: 2.0, type: 'chime' }, { t: 2.9, type: 'blink' }, { t: 3.5, type: 'blink' },
    { t: 4.6, type: 'boing' }, { t: 4.7, type: 'swish' }, { t: 5.0, type: 'swish' }, { t: 6.3, type: 'pon' }, { t: 7.2, type: 'twitch' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400, JN = [263, 1165];
    const bg = L.office({ sky: 'day', clock: [11, 0] });
    const stack = Math.min(8, Math.floor(seg(t, .5, 1.8) * 8));      // 積み上げた書類の枚数
    const ah = t >= 2.8 && t < 4.6, sneeze = t >= 4.6 && t < 5.2, fly = seg(t, 4.6, 6.4);
    // ジル（左）：書類を積む（lean）→ 満足 → 課長の「へっ」に「？」→ 書類がとんで「！」→ 頭に1枚、ジト目
    const jl = t > .4 && t < 1.9;
    const jface = t < 2.0 ? RIG.FACES.sharp : t < 2.8 ? Object.assign({}, RIG.FACES.smile, { sparkle: 1 }) : t < 4.6 ? Object.assign({}, RIG.FACES.think, { question: 1 }) : t < 6.4 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : RIG.FACES.annoyed;
    L.char('jil', Object.assign({}, jl ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 20, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: t > 2.8 ? .9 : .3, bodyTilt: jl ? -8 : t > 4.6 && t < 5.2 ? 10 : 0 }), t, '', {});
    // レン（右）：鼻むずむず（目をとじて、顔を上げていく）→ くしゃみ（体がうしろへ・nudge）→ あせ
    const rface = t < 2.8 ? RIG.FACES.neutral : ah ? Object.assign({}, RIG.FACES.oops, { eyeOpen: .25 + .25 * Math.sin(t * 9), sweat: 0 }) : sneeze ? Object.assign({}, RIG.FACES.surprised, { eyeOpen: .1, excl: 0 }) : RIG.FACES.oops;
    L.char('ren', Object.assign({}, sneeze ? RIG.POSES.nudge : RIG.POSES.sit, rface, { x: 560, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: -.2, headNod: ah ? -6 - 10 * seg(t, 2.8, 4.6) : sneeze ? 18 : 0, bodyTilt: sneeze ? -12 : 0 }), t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // 書類の山（ジルの机）→ くしゃみで、左上へまい上がる（顔の前は通らない高さ）
    for (let i = 0; i < 8; i++) {
      if (fly <= 0) { if (i < stack) fx += SHEET(430 + (i % 2) * 6, DESK - 46 - i * 14, (i % 3 - 1) * 3); continue; }
      const u = ease(Math.min(1, fly * (1 + i * .12))), sx = 430 - 120 * u - i * 40 * u + Math.sin(t * 4 + i) * 30 * u, sy = DESK - 46 - i * 14 - 700 * u + Math.sin(u * Math.PI) * 0 + (t > 5.6 ? 120 * Math.sin((t - 5.6) * 2 + i) : 0);
      if (i === 0) { const land = seg(t, 5.6, 6.4); fx += SHEET(430 + (JN[0] - 430) * land, DESK - 46 + (JN[1] - 205 - DESK + 46) * land - Math.sin(land * Math.PI) * 300, 20 - 30 * land); continue; }   // 1枚だけ、ジルの頭の上へ（顔より上）
      fx += SHEET(sx, sy, u * 200 + i * 30);
    }
    // 「へっ…」「へっ…」とくしゃみの文字
    if (ah) fx += `<text x="${780}" y="${900 - 40 * Math.floor((t - 2.8) / .9)}" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="80" fill="#8C7B66">${t < 3.7 ? 'へっ…' : 'へっ…！'}</text>`;
    if (sneeze) fx += `<text x="${900}" y="${820}" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="${130 * outBack(seg(t, 4.6, 4.8))}" fill="#E8473A" stroke="#FFF7E8" stroke-width="12" paint-order="stroke">ACHOO!</text>`
      + L.impact(640, 1230, seg(t, 4.6, 5.0), .8, '#BFD6EA');
    if (t > 7.0 && t < 8.6) fx += L.emark(240, DESK - 720, 1.0, '…');
    let ui = (t > 0.8 && t < 2.6 ? CHIP(L, 'NEAT STACK', 'ジル、書類をきれいに', 1600, seg(t, .8, 1.1)) : '')
      + (t > 6.4 && t < 8.6 ? CHIP_OFF(L, 'ACHOO! PAPERS FLY', '上司のくしゃみ：書類が全部とぶ', 1600, seg(t, 6.4, 6.7)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 380, cy: 1150 },
      { t: 0.01, z: 1.05, cx: 520, cy: 1120, d: .9 },
      { t: 2.8, z: 1.3, cx: 780, cy: 1100, d: .5 },                 // むずむず
      { t: 4.6, z: .95, cx: 520, cy: 960, d: .3 },                  // くしゃみ（引き）
      { t: 6.6, z: 1.15, cx: 420, cy: 1080, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: sneeze ? 9 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
