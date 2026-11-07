// 「大掃除」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：12/28、大掃除。レンの机は書類・マグ・牧草の山（ジルの机は空っぽでピカピカ）
// ひっくり返し：レンが山を動かす → 山の中から去年のおにぎり（食べかけ）が出てくる → オチ：ジル、無言で距離を取る（ジルの机の方へ後ずさり）。字幕「去年のおにぎり発見」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CAL = (x, y) => `<g transform="translate(${x} ${y})"><rect x="-90" y="-110" width="180" height="220" rx="12" fill="#fff" stroke="#E2D2BC" stroke-width="5"/><rect x="-90" y="-110" width="180" height="56" rx="12" fill="#E86C5A"/><text x="0" y="-70" text-anchor="middle" font-size="34" font-weight="900" font-family="Noto Sans CJK JP" fill="#fff">12</text><text x="0" y="50" text-anchor="middle" font-size="96" font-weight="900" font-family="Noto Sans CJK JP" fill="#3A2414">28</text></g>`;
const PILE = (x, y, k) => { let s = ''; for (let i = 0; i < 16; i++) { const j = Math.sin(i * 12.9) * 40, h = i * 15 * (1 - k * .3); s += `<rect x="${x - 110 + j}" y="${y - h - 14}" width="220" height="15" rx="3" fill="${i % 2 ? '#fff' : '#F4EFE6'}" stroke="#D7CCBB" stroke-width="2" transform="rotate(${Math.sin(i * 7.1) * 3} ${x} ${y - h})"/>`; } s += `<g transform="translate(${x + 150} ${y - 190 * (1 - k * .3)})"><path d="M-36 0 L-44 -70 L44 -70 L36 0Z" fill="#fff" stroke="#C9A87E" stroke-width="5"/><path d="M44 -58 q36 0 36 26 q0 26 -36 26" fill="none" stroke="#C9A87E" stroke-width="7"/></g>`; return s; };
const ONIGIRI = (x, y, s, mold) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-70 40 L0 -70 L70 40 Z" fill="#FFFDF8" stroke="#D7CCBB" stroke-width="5" stroke-linejoin="round"/><rect x="-30" y="0" width="60" height="40" fill="#2E4A2E"/><path d="M40 20 a22 22 0 1 1 -1 -1Z" fill="#F4ECE0"/>${mold ? `<g fill="#7FB37A" opacity=".9"><circle cx="-20" cy="-5" r="12"/><circle cx="12" cy="-28" r="9"/><circle cx="-38" cy="20" r="8"/></g><path d="M-60 -70 q10 -30 0 -50 M-30 -80 q10 -30 0 -50" stroke="#9BB59B" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>` : ''}</g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '5.3-6.0',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.8, type: 'tap' }, { t: 1.6, type: 'swish' }, { t: 2.3, type: 'swish' }, { t: 3.0, type: 'swish' }, { t: 3.8, type: 'flop' }, { t: 4.6, type: 'swish' }, { t: 5.3, type: 'boing' },
    { t: 5.6, type: 'twitch' }, { t: 6.1, type: 'blink' }, { t: 6.6, type: 'tap' }, { t: 7.0, type: 'tap' }, { t: 7.4, type: 'tap' }, { t: 8.0, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack, lerp } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [10, 0] }) + CAL(540, 560);
    // 山の崩れ具合（レンが動かす 1.6〜3.8）→ 5.3 におにぎり発見
    const dig = ease(seg(t, 1.6, 3.8));
    const found = t >= 5.3;
    // レン（右）：掃除中（体を揺らす）→ 発見で驚く → 「これ…まだいける？」の顔（にこっ）
    const rface = t < 5.3 ? RIG.FACES.neutral : t < 7.0 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : RIG.FACES.smile;
    const rp = Object.assign({}, t < 5.3 ? RIG.POSES.lean : RIG.POSES.sit, rface, { x: 640, y: DESK - 413 * 1.35, scale: 1.35, flip: true, bodyTilt: t > 1.6 && t < 3.8 ? Math.sin(t * 9) * 6 : 0, sweat: t > 2.5 && t < 5.3 ? .6 : 0, eyeLook: found ? .4 : 0 });
    L.char('ren', rp, t, '', {});
    // ジル（左）：ピカピカの机の前で待つ → 5.6 発見を見る → 6.6〜 後ずさり（左へ3回）
    const back = t > 6.6 ? Math.min(3, Math.floor((t - 6.6) / .4) + 1) * 70 * ease(Math.min(1, ((t - 6.6) % .4) / .25)) + Math.min(2, Math.floor((t - 6.6) / .4)) * 70 : 0;
    const jface = t < 5.6 ? RIG.FACES.sharp : t < 6.6 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : RIG.FACES.annoyed;
    const jp = Object.assign({}, RIG.POSES.sit, jface, { x: 140 - back, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: t > 5.6 ? .9 : .2, bodySquash: t > 6.6 ? -.1 : 0 });
    L.char('jil', jp, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // ジルの机：ピカピカ（星）
    fx += L.sparkles(230, DESK - 60, t, .8, 4);
    // レンの机：山（手前に置いて、レンの体の下半分を隠す）
    fx += PILE(800, DESK - 4, dig);
    if (found) fx += ONIGIRI(820, DESK - 300 + 60 * (1 - outBack(seg(t, 5.3, 5.7))), 1.7 * outBack(seg(t, 5.3, 5.6)), true);
    if (t > 5.3 && t < 5.9) fx += L.impact(820, DESK - 320, seg(t, 5.3, 5.9), 1.0, '#7FB37A');
    if (t > 5.6 && t < 6.6) fx += L.emark(220, DESK - 620, 1.0);
    let ui = (t > 1.8 && t < 3.4 ? CHIP(L, 'DEC 28. CLEANING DAY.', '12月28日、大掃除。上司の机だけ山', 1380, seg(t, 1.8, 2.1)) : '')
      + (t > 5.9 && t < 8.6 ? CHIP(L, "FOUND: LAST YEAR'S LUNCH", '去年のおにぎり、発見', 1380, seg(t, 5.9, 6.2)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.4, cx: 640, cy: 1100 },
      { t: 0.01, z: 1.05, cx: 560, cy: 1150, d: .9 },
      { t: 1.6, z: 1.3, cx: 760, cy: 1220, d: .5 },                 // 山に寄る
      { t: 5.2, z: 1.5, cx: 800, cy: 1150, d: .3 },                 // おにぎり
      { t: 6.2, z: 1.05, cx: 500, cy: 1160, d: .5 },                // 引き：後ずさるジル
      { t: 7.8, z: 1.2, cx: 330, cy: 1180, d: .6 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 5.3 && t < 5.45 ? 8 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
