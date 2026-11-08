// 「ブラインド」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：朝。ジルがひもを引いて、ブラインドをすーっと上げる。光が入る（きりっ）
// ひっくり返し：課長も右の窓のひもを引く……ブラインドは上がらず、課長のほうが上がっていく（宙ぶらりん）
// オチ：手をはなすとストン。ブラインドもバタンと全部しまる。字幕「上司のブラインド：本人が上がる」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const DESKFX = (L, DESK) => `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
  + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
const WY = 230, WW = 320, WH = 420;
// ブラインド：k = しまっている割合（0〜1）。ひもの先 cy
const BLIND = (wx, k, cy) => { const h = 16 + (WH - 16) * k, n = Math.max(1, Math.round(h / 26)); let s = `<g><rect x="${wx - 10}" y="${WY - 22}" width="${WW + 20}" height="26" rx="6" fill="#CDBF9F"/>`;
  for (let i = 0; i < n; i++) s += `<rect x="${wx - 4}" y="${WY + 4 + i * (h / n)}" width="${WW + 8}" height="${Math.max(4, h / n - 4)}" rx="3" fill="#EFE7D6" stroke="#D9CCB0" stroke-width="2"/>`;
  s += `<rect x="${wx - 8}" y="${WY + h}" width="${WW + 16}" height="14" rx="5" fill="#CDBF9F"/>`;
  s += `<path d="M${wx + WW - 6} ${WY} L${wx + WW - 6} ${cy}" stroke="#B8A889" stroke-width="5"/><circle cx="${wx + WW - 6}" cy="${cy}" r="16" fill="#B8A889"/>`;
  return s + '</g>'; };
var EP = {
  dur: 9.5,
  bgmHolds: '5.6-6.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.8, type: 'swish' }, { t: 1.2, type: 'swish' }, { t: 2.0, type: 'chime' }, { t: 2.8, type: 'blink' }, { t: 3.4, type: 'swish' },
    { t: 3.9, type: 'boing' }, { t: 4.5, type: 'twitch' }, { t: 5.3, type: 'thump' }, { t: 5.4, type: 'tap' }, { t: 6.2, type: 'pon' }, { t: 7.2, type: 'twitch' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400, WL = 70, WR = 690;
    const jUp = ease(seg(t, .8, 1.8));                          // 左のブラインドが上がる
    const lift = ease(seg(t, 3.5, 4.4)) * (1 - ease(seg(t, 5.0, 5.3)));   // 課長が上がる → ストン
    const shut = seg(t, 5.0, 5.3);                              // 右のブラインドがバタン
    const bg = L.office({ sky: 'day', clock: [9, 0] });
    // ジル（左）：立ってひもを引く（きりっ）→ 光で満足 → 宙ぶらりんの課長に「！」→ ジト目
    const jPull = t > .6 && t < 2.0;
    const jface = t < 2.0 ? RIG.FACES.sharp : t < 3.6 ? Object.assign({}, RIG.FACES.smile, { sparkle: t < 2.8 ? 1 : 0 }) : t < 5.6 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : RIG.FACES.annoyed;
    L.char('jil', Object.assign({}, jPull ? RIG.POSES.stand : RIG.POSES.sit, jface, { x: 20, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: t > 2.4 ? .9 : .5 }), t, '', {});
    // レン（右）：見ている → やる気で立つ → ひもを引くと本人が上がる（あせ）→ ストン → 目が回る
    const rface = t < 2.8 ? RIG.FACES.neutral : t < 3.5 ? Object.assign({}, RIG.FACES.smile, { sparkle: 1 }) : t < 5.0 ? Object.assign({}, RIG.FACES.oops, { sweat: 1 }) : t < 6.2 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : Object.assign({}, RIG.FACES.oops, { eyeOpen: .4 });
    L.char('ren', Object.assign({}, t > 2.8 && t < 5.3 ? RIG.POSES.stand : RIG.POSES.sit, rface, { x: 560, y: DESK - 413 * 1.35 - 300 * lift + (t > 5.3 && t < 5.5 ? 10 : 0), scale: 1.35, flip: true, eyeLook: -.2, bodyTilt: lift > .05 ? Math.sin(t * 7) * 6 : 0 }), t, '', {});
    let fx = '';
    // 左の窓：光の帯（ブラインドが上がると）
    if (jUp > 0) fx += `<path d="M${WL + 40} ${WY + 420} L${WL + 300} ${WY + 420} L${WL + 380} 860 L${WL + 60} 860 Z" fill="#FFF1B8" opacity="${.25 * jUp}"/>`;
    fx += BLIND(WL, 1 - .85 * jUp, WY + 420 + 60 + 180 * jUp);
    // 右の窓：はじめは半分。課長が引くと、ひもの先が課長といっしょに上がる → 手をはなすとバタンと全部しまる
    const rk = .5 + .5 * shut, rcy = t < 3.2 ? WY + 420 + 80 : t < 5.0 ? 1080 - 300 * lift : WY + WH + 60;
    fx += BLIND(WR, rk, rcy);
    fx = DESKFX(L, DESK) + fx;
    if (t > 5.3 && t < 5.7) fx += L.impact(860, DESK - 40, seg(t, 5.3, 5.7), .8, '#C2AE8C');
    if (t > 5.5 && t < 7.4) fx += `<g transform="translate(848 ${DESK - 520}) rotate(${t * 200})"><path d="M0 -30 A30 30 0 1 1 -30 0 A20 20 0 1 1 0 -20 A10 10 0 1 1 -10 0" stroke="#8C7B66" stroke-width="7" fill="none" stroke-linecap="round"/></g>`;
    if (t > 3.8 && t < 5.0) fx += `<text x="${400}" y="${820}" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="64" fill="#E8473A" stroke="#FFF7E8" stroke-width="10" paint-order="stroke" transform="rotate(${Math.sin(t * 8) * 6} 400 820)">ぷらーん</text>`;
    if (t > 7.2 && t < 8.6) fx += L.emark(220, DESK - 660, 1.0, '…');
    let ui = (t > 0.8 && t < 2.6 ? CHIP(L, 'BLINDS UP', 'ジル、朝の光を入れる', 1650, seg(t, .8, 1.1)) : '')
      + (t > 6.0 && t < 8.6 ? CHIP(L, 'BOSS PULLS: HE RISES', '上司のブラインド：本人が上がる', 1650, seg(t, 6.0, 6.3)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.2, cx: 330, cy: 900 },
      { t: 0.01, z: 1.0, cx: 420, cy: 920, d: .9 },
      { t: 2.8, z: 1.05, cx: 720, cy: 880, d: .5 },                 // 課長の番
      { t: 5.6, z: .95, cx: 540, cy: 960, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 5.3 && t < 5.45 ? 6 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
