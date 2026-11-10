// 「お年玉」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：課長がにこにこと、ポチ袋をジルの机へすべらせる。ジルはうれしい（きらきら）
// ひっくり返し：中から出てきたのは手作りの「かたたたき券」……ただし「課長の肩を」
// オチ：課長は背中を向けて待つ。ジルがしぶしぶトントン。課長はうっとり。字幕「お年玉：たたく券（上司の肩を）」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
// ポチ袋（中心 x,y・回転 r・ふたが開く o）
const POCHI = (x, y, r, o) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-46" y="-66" width="92" height="132" rx="8" fill="#E8473A" stroke="#B8302A" stroke-width="4"/><path d="M-46 -66 L0 ${-66 + 46 * (1 - 2 * o)} L46 -66" fill="#D63D31" stroke="#B8302A" stroke-width="4"/>`
  + `<circle cy="10" r="24" fill="#FFF7E8"/><text y="22" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="32" fill="#E8473A">福</text><path d="M-30 46 Q0 34 30 46" stroke="#F2C230" stroke-width="6" fill="none"/></g>`;
// 券（大きく見せる）
const TICKET = (x, y, s) => s <= 0 ? '' : `<g transform="translate(${x} ${y}) scale(${s})" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-230" y="-120" width="460" height="240" rx="18" fill="#FFF7E8" stroke="#C9A24A" stroke-width="7" stroke-dasharray="18 10"/>`
  + `<text y="-48" font-size="40" fill="#8C7B66">課長より</text><text y="30" font-size="84" fill="#3A2414">かたたたき券</text><text y="92" font-size="46" fill="#E8473A">※ 課長の肩を</text></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '4.4-5.0',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.6, type: 'swish' }, { t: 1.5, type: 'chime' }, { t: 2.9, type: 'swish' }, { t: 3.6, type: 'pon' }, { t: 4.4, type: 'blink' }, { t: 5.0, type: 'swish' },
    { t: 5.9, type: 'tap' }, { t: 6.2, type: 'tap' }, { t: 6.5, type: 'tap' }, { t: 6.8, type: 'tap' }, { t: 7.1, type: 'tap' }, { t: 7.6, type: 'chime' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [13, 0] });
    const tapping = t >= 5.8 && t < 7.3;
    // ジル（左）：ポチ袋にきらきら → あける（lean）→ 券を読んで「！」→ ジト目 → しぶしぶトントン（lean）
    const jface = t < 1.4 ? RIG.FACES.neutral : t < 3.6 ? Object.assign({}, RIG.FACES.smile, { sparkle: 1 }) : t < 4.4 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : RIG.FACES.annoyed;
    const jl = (t > 2.8 && t < 3.6) || tapping;
    L.char('jil', Object.assign({}, jl ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 20 + 300 * ease(seg(t, 5.3, 5.8) - seg(t, 7.3, 7.7)),   // 課長のうしろまで行ってトントン、終わったら席へ
       y: DESK - 413 * 1.3, scale: 1.3, eyeLook: .8, bodyTilt: tapping ? -12 + Math.sin(t * 20) * 5 : jl ? -10 : 0 }), t, '', {});
    // レン（右）：にこにこでポチ袋をすべらせる → 「どう？」のご満悦 → くるっと背中を向けて待つ → うっとり（ハート）
    const turned = t >= 5.0 && t < 7.4;
    const rface = t < 3.6 ? Object.assign({}, RIG.FACES.smile, { sparkle: t < 1.6 ? 1 : 0 }) : t < 5.0 ? RIG.FACES.smug : tapping ? Object.assign({}, RIG.FACES.shy, { eyeOpen: .3 }) : RIG.FACES.shy;
    L.char('ren', Object.assign({}, t > .4 && t < 1.2 ? RIG.POSES.lean : RIG.POSES.sit, rface, { x: 560, y: DESK - 413 * 1.35, scale: 1.35, flip: !turned, eyeLook: -.4, headNod: tapping ? Math.sin(t * 20) * 4 : 0, bodyTilt: t > .4 && t < 1.2 ? -10 : 0 }), t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // ポチ袋：課長の机 → ジルの机へすべる → 開く
    { const u = ease(seg(t, .6, 1.4)), o = seg(t, 2.9, 3.3); fx += POCHI(760 - 320 * u, DESK - 70, -6 + 10 * u, o); }
    if (t > 3.3) { const k = outBack(seg(t, 3.4, 3.8)), out = seg(t, 5.0, 5.4); fx += TICKET(540 - 110 * out, 720 + 600 * out, .9 * k * (1 - out * .8)); }   // 読んだら、ジルの机の上（ポチ袋のとなり）へ
    if (t > 1.4 && t < 2.6) fx += L.sparkles(440, DESK - 120, t, .8, 6);
    if (tapping) { const k = ((t - 5.8) % .3) / .3; fx += L.impact(700, 1150, k, .35, '#F2C230'); }
    if (t > 7.4 && t < 8.6) fx += L.emark(220, DESK - 650, 1.0, '…');
    let ui = (t > 1.0 && t < 2.8 ? CHIP(L, 'A NEW YEAR GIFT?', '課長からポチ袋', 1600, seg(t, 1.0, 1.3)) : '')
      + (t > 6.2 && t < 8.6 ? CHIP_OFF(L, 'GIFT: A MASSAGE TICKET', 'お年玉：肩たたき券（課長の肩を）', 1600, seg(t, 6.2, 6.5)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 700, cy: 1150 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1150, d: .9 },
      { t: 2.8, z: 1.25, cx: 440, cy: 1150, d: .4 },                // あける
      { t: 3.4, z: 1.0, cx: 540, cy: 960, d: .4 },                  // 券
      { t: 5.2, z: 1.1, cx: 600, cy: 1150, d: .5 },                 // トントン
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
