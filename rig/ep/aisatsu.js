// 「新年のごあいさつ」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：1月1日。オフィスに「謹賀新年」。ジルがきちんとおじぎ（にこ）
// ひっくり返し：課長もおじぎ → 深く、もっと深く → そのまま前にころん（1回転）
// オチ：ジルの横で起き上がり、ご満悦。ジルは思わず笑う。字幕「上司のおじぎ、深すぎ」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
var EP = {
  dur: 9.5,
  bgmHolds: '4.6-5.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.8, type: 'chime' }, { t: 1.9, type: 'swish' }, { t: 2.6, type: 'tap' }, { t: 3.3, type: 'swish' }, { t: 3.9, type: 'swish' }, { t: 4.5, type: 'swish' },
    { t: 4.9, type: 'boing' }, { t: 5.7, type: 'thump' }, { t: 6.3, type: 'blink' }, { t: 7.0, type: 'chime' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [9, 0] });
    // ジル（左）：おじぎ（1.8〜2.6）→ 課長を見る → ころんに「！」→ 笑う（にこ・照れ）
    const jbow = t >= 1.8 && t < 2.6 ? Math.sin(seg(t, 1.8, 2.6) * Math.PI) : 0;
    const jface = t < 3.2 ? RIG.FACES.smile : t < 4.9 ? RIG.FACES.think : t < 6.2 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : Object.assign({}, RIG.FACES.smile, { sparkle: 1 });
    L.char('jil', Object.assign({}, jbow ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 20, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: .8, bodyTilt: -22 * jbow, headNod: 26 * jbow }), t, '', {});
    // レン（右）：おじぎがどんどん深く（3.2〜4.8）→ ころん（4.8〜5.7・1回転しながら左へ）→ 起き上がってご満悦
    const deep = ease(seg(t, 3.2, 4.8)), roll = ease(seg(t, 4.8, 5.7));
    const rface = t < 3.2 ? RIG.FACES.smile : t < 4.8 ? RIG.FACES.sharp : t < 5.9 ? RIG.FACES.oops : Object.assign({}, RIG.FACES.smug, { sparkle: t < 7.0 ? 1 : 0 });
    const rx = 560 - 120 * roll;
    L.char('ren', Object.assign({}, t >= 3.2 && t < 4.8 ? RIG.POSES.lean : RIG.POSES.sit, rface, { x: rx, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: -.4, bodyTilt: t < 4.8 ? -38 * deep : 0, headNod: t < 4.8 ? 30 * deep : 0 }), t, '', {});
    const rs = document.getElementById('ren');
    if (rs) { const cx = rx + 300, cy = DESK - 260; rs.style.transformOrigin = `${cx}px ${cy}px`; rs.style.transform = t >= 4.8 && t < 5.7 ? `rotate(${-360 * roll}deg)` : ''; }
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // 謹賀新年のたれ幕（壁）
    fx += `<g transform="translate(540 ${DESK - 760}) scale(${outBack(seg(t, .3, .7))})"><rect x="-260" y="-70" width="520" height="140" rx="12" fill="#FFFDF7" stroke="#C9483C" stroke-width="10"/><text y="26" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="80" fill="#C9483C">謹賀新年</text>`
      + `<circle cx="-230" cy="-40" r="16" fill="#E8473A"/><circle cx="230" cy="-40" r="16" fill="#E8473A"/></g>`;
    if (t > 5.6 && t < 6.0) fx += L.impact(rx + 300, DESK - 60, seg(t, 5.6, 6.0), .7, '#F2C230');
    if (t > 6.2 && t < 7.4) fx += L.sparkles(rx + 300, DESK - 420, t, 1.0, 6);
    let ui = (t > 0.6 && t < 2.6 ? CHIP(L, 'HAPPY NEW YEAR', 'あけましておめでとうございます', 1640, seg(t, .6, .9)) : '')
      + (t > 3.6 && t < 4.9 ? CHIP_OFF(L, 'THE BOSS BOWS…', '上司もおじぎ…', 1640, seg(t, 3.6, 3.9)) : '')
      + (t > 6.2 && t < 8.6 ? CHIP_OFF(L, 'BOW: TOO DEEP', '上司のおじぎ、深すぎ', 1640, seg(t, 6.2, 6.5)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.2, cx: 540, cy: 900 },
      { t: 0.01, z: 1.0, cx: 540, cy: 1100, d: .9 },
      { t: 3.2, z: 1.2, cx: 680, cy: 1180, d: .5 },                 // 深いおじぎ
      { t: 4.8, z: 1.0, cx: 540, cy: 1150, d: .4 },                 // ころん
      { t: 6.4, z: 1.1, cx: 500, cy: 1150, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 5.6 && t < 5.8 ? 5 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
