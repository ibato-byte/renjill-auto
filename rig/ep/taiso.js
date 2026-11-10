// 「朝の体操」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：朝。ジルが体操（せのび・左右にゆらゆら）。1・2・3・4 のかけ声の数字
// ひっくり返し：課長もまねして、ぐーっと「のび」……のびたまま、ぺたっと香箱すわり
// オチ：そのまま寝る（zzz）。ジルは体操を続ける。字幕「上司の体操：のびて、ねる」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
var EP = {
  dur: 9.5,
  bgmHolds: '5.2-5.8',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.7, type: 'tap' }, { t: 1.2, type: 'tap' }, { t: 1.7, type: 'tap' }, { t: 2.2, type: 'tap' }, { t: 2.8, type: 'chime' }, { t: 3.6, type: 'swish' },
    { t: 4.6, type: 'boing' }, { t: 5.3, type: 'thump' }, { t: 6.0, type: 'blink' }, { t: 7.0, type: 'tap' }, { t: 7.5, type: 'tap' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [9, 0] });
    // かけ声（0.7 から 0.5 秒ごと）：のび（stand）とすわる（sit）をくり返す
    const beat = Math.floor((t - .7) / .5), up = t >= .7 && beat % 2 === 0;
    const exercising = t >= .7 && t < 9;
    // ジル（左）：体操（せのび・左右にゆらゆら）→ 課長が寝ても続ける（ちらっと見てジト目）
    const jface = t < 5.6 ? RIG.FACES.sharp : t < 6.8 ? RIG.FACES.annoyed : RIG.FACES.sharp;
    L.char('jil', Object.assign({}, exercising && up ? RIG.POSES.stand : RIG.POSES.sit, jface, { x: 20, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: t >= 5.6 && t < 6.8 ? .9 : 0, bodyTilt: exercising && !up ? Math.sin(t * Math.PI * 2) * 8 : 0 }), t, '', {});
    // レン（右）：見ている → まねして「のび」（stretch・きらきら）→ のびたまま香箱すわり（loaf）→ 寝る
    const rpose = t < 3.0 ? RIG.POSES.sit : t < 3.6 ? RIG.POSES.stand : t < 5.2 ? RIG.POSES.stretch : RIG.POSES.loaf;
    const rface = t < 3.0 ? RIG.FACES.neutral : t < 3.6 ? Object.assign({}, RIG.FACES.smile, { sparkle: 1 }) : t < 5.2 ? Object.assign({}, RIG.FACES.smile, { eyeOpen: .5 }) : t < 6.0 ? Object.assign({}, RIG.FACES.sleepy, { zzz: 0, eyeOpen: .3 }) : RIG.FACES.sleepy;
    L.char('ren', Object.assign({}, rpose, rface, { x: 560, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: -.5 }), t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // かけ声の数字（ジルの上）
    if (exercising && t < 8.6) { const n = (beat % 4) + 1, k = ((t - .7) % .5) / .5; fx += `<text x="300" y="${DESK - 640}" text-anchor="middle" font-family="Noto Sans" font-weight="900" font-size="${110 * outBack(Math.min(1, k * 4))}" fill="#E8473A" stroke="#FFF7E8" stroke-width="10" paint-order="stroke" opacity="${1 - k * .6}">${n}</text>`; }
    if (t > 3.6 && t < 4.6) fx += L.sparkles(820, 1000, t, 1.2, 6);
    if (t > 5.2 && t < 5.6) fx += L.dust(820, DESK, seg(t, 5.2, 5.6));
    let ui = (t > 0.8 && t < 2.8 ? CHIP(L, 'MORNING STRETCH', '朝の体操', 1600, seg(t, .8, 1.1)) : '')
      + (t > 3.6 && t < 5.2 ? CHIP_OFF(L, 'BOSS JOINS IN', '課長もまねして、のび〜', 1600, seg(t, 3.6, 3.9)) : '')
      + (t > 6.2 && t < 8.6 ? CHIP_OFF(L, 'BOSS: STRETCH, THEN NAP', '上司の体操：のびて、ねる', 1600, seg(t, 6.2, 6.5)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 360, cy: 1100 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1100, d: .9 },
      { t: 3.4, z: 1.25, cx: 760, cy: 1150, d: .5 },                // 課長の「のび」
      { t: 5.8, z: 1.4, cx: 800, cy: 1200, d: .5 },                 // 寝てる
      { t: 7.0, z: 1.05, cx: 540, cy: 1100, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
