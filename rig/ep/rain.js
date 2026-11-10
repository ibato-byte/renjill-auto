// 「雨の日の上司」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：雨の朝（窓は雨）。傘を忘れたレンがびしょ濡れで入ってくる。足元に水たまり。ジルがタオルを差し出す
// ひっくり返し：レンがタオルの前に犬みたいに「ぶるぶる」→ しずくが飛ぶ → オチ：ジルも濡れた。字幕「ジルも濡れた」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
const RAIN = (t) => { let s = '<g stroke="#9BB8D8" stroke-width="5" stroke-linecap="round" opacity=".8">'; for (let i = 0; i < 40; i++) { const x = 70 + (i * 173) % 940, y = 230 + ((i * 97 + t * 700) % 420); if ((x > 390 && x < 690)) continue; s += `<line x1="${x}" y1="${y}" x2="${x - 6}" y2="${y + 28}"/>`; } return s + '</g>'; };
const DROP = (x, y, s = 1) => `<path d="M${x} ${y - 22 * s} q${14 * s} ${22 * s} 0 ${30 * s} q${-14 * s} ${-8 * s} 0 ${-30 * s}Z" fill="#6FA8DC"/>`;
const TOWEL = (x, y, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="-90" y="-50" width="180" height="100" rx="14" fill="#FFF3C4" stroke="#E6C96A" stroke-width="5"/><rect x="-90" y="-20" width="180" height="12" fill="#E6C96A" opacity=".6"/><rect x="-90" y="8" width="180" height="12" fill="#E6C96A" opacity=".6"/></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '5.4-6.0',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.0, type: 'flop' }, { t: 1.4, type: 'flop' }, { t: 1.8, type: 'flop' }, { t: 2.3, type: 'twitch' }, { t: 3.6, type: 'swish' }, { t: 4.0, type: 'pop' }, { t: 5.4, type: 'whoosh' }, { t: 5.7, type: 'whoosh' }, { t: 6.0, type: 'whoosh' },
    { t: 6.3, type: 'blink' }, { t: 6.8, type: 'flop' }, { t: 7.4, type: 'twitch' }, { t: 8.1, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [8, 55] }) + RAIN(t);
    const shake = t >= 5.4 && t < 6.3;
    const wetJ = t >= 6.3;
    // レン（右）：1.0〜2.0 右からとぼとぼ入ってくる（しずく）→ 止まる → 5.4 ぶるぶる → すっきり（にこ）
    const h = RIG.hop(t, 1.0, 2.0, 1250, 540, { hops: 3, height: 30 });
    const rface = t < 5.4 ? Object.assign({}, RIG.FACES.annoyed, { sweat: 0, eyeOpen: .5 }) : t < 6.3 ? Object.assign({}, RIG.FACES.sleepy, { zzz: 0, eyeOpen: .05 }) : RIG.FACES.smile;
    const rp = Object.assign({}, t < 2.0 ? RIG.POSES.stand : RIG.POSES.sit, rface, { x: h.x, y: DESK - 413 * 1.35 + h.yOff, scale: 1.35, flip: true, bodySquash: h.squash, bodyTilt: shake ? Math.sin(t * 60) * 14 : 0, headTilt: shake ? Math.sin(t * 60 + 1) * 16 : (t < 5.4 ? 6 : 0), blush: t >= 6.3 ? .7 : 0 });
    L.char('ren', rp, t, '', { vx: t < 2.0 ? -700 : 0 });
    // ジル（左）：見る → 3.6 タオルを差し出す（lean）→ しずくを浴びて目を閉じる（annoyed）→ 7.4 ぽたぽた
    const jface = t < 6.3 ? RIG.FACES.sharp : RIG.FACES.annoyed;
    const jp = Object.assign({}, t > 3.6 && t < 6.3 ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 60, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: .8, bodyTilt: t > 3.6 && t < 6.3 ? -8 : 0, earL: wetJ ? 25 : 0, earR: wetJ ? 25 : 0, eyeOpen: wetJ ? .4 : 1 });
    L.char('jil', jp, t, t > 3.6 && t < 5.4 ? TOWEL(520, DESK - 170, -12) : '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // レンの足元の水たまり（止まってから広がる）と、頭からのしずく
    if (t > 1.2) { const k = Math.min(1, (t - 1.2) / 2.5); fx += `<ellipse cx="${h.x + 360}" cy="${DESK + 20}" rx="${40 + 200 * k}" ry="${8 + 30 * k}" fill="#8FBBE0" opacity=".55"/>`; }
    if (t < 5.4) for (let i = 0; i < 4; i++) { const ph = (t * 1.6 + i * .25) % 1; fx += DROP(h.x + 250 + i * 70, DESK - 620 + ph * 560, .8 * (1 - ph * .3)); }
    // ぶるぶるで飛ぶしずく（放射状）→ 6.3 にジルに届く
    if (shake) { const k = (t - 5.4) / .9; for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2 + i, r = 140 + 560 * ((k * 1.4 + i * .04) % 1); fx += DROP(h.x + 360 + Math.cos(a) * r, DESK - 330 + Math.sin(a) * r * .6, 1.2); } }
    if (wetJ) { for (let i = 0; i < 5; i++) { const ph = (t * 1.2 + i * .2) % 1; fx += DROP(230 + i * 70, DESK - 560 + ph * 480, .7); } fx += `<ellipse cx="400" cy="${DESK + 20}" rx="${60 + 120 * Math.min(1, (t - 6.3) / 2)}" ry="${10 + 20 * Math.min(1, (t - 6.3) / 2)}" fill="#8FBBE0" opacity=".5"/>`; }
    if (t > 5.4 && t < 5.7) fx += L.impact(h.x + 360, DESK - 330, seg(t, 5.4, 5.7), 1.2, '#6FA8DC');
    if (wetJ && t < 7.4) fx += L.emark(230, DESK - 650, 1.0);
    if (t >= 6.3) fx += L.sparkles(h.x + 360, DESK - 500, t, .9, 5);  // すっきりしたレン
    let ui = (t > 1.8 && t < 3.4 ? CHIP(L, 'RAIN. NO UMBRELLA.', '雨の朝、傘を忘れた上司が到着', 1380, seg(t, 1.8, 2.1)) : '')
      + (t > 3.8 && t < 5.2 ? CHIP_OFF(L, 'TOWEL, PLEASE', 'ジルがタオルを差し出す', 1380, seg(t, 3.8, 4.1)) : '')
      + (t > 6.5 && t < 8.6 ? CHIP_OFF(L, 'SHAKE. JILL: ALSO WET', 'ぶるぶる。ジルも濡れた', 1380, seg(t, 6.5, 6.8)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.4, cx: 700, cy: 1100 },
      { t: 0.01, z: 1.05, cx: 600, cy: 1100, d: .9 },
      { t: 3.5, z: 1.2, cx: 480, cy: 1120, d: .5 },                 // タオル
      { t: 5.3, z: 1.0, cx: 540, cy: 1060, d: .3 },                 // 引き：しずくが飛ぶ
      { t: 6.6, z: 1.3, cx: 360, cy: 1120, d: .5 },                 // 濡れたジル
      { t: 8.0, z: 1.05, cx: 540, cy: 1080, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: shake ? 4 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
