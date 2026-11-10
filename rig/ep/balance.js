// 「バランスボール」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：健康のためにバランスボール。ジルはぴしっと座って、ゆらゆら（きりっ）
// ひっくり返し：課長も座る……ぽよん、ぽよん、どんどん高くはずんでいく
// オチ：はずみすぎて目が回り、ボールはぺちゃんこ。字幕「上司のバランスボール：はずみすぎる」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
const DESKFX = (L, DESK) => `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
  + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
const BALL = (x, y, r, sq, c) => `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="${r * sq * .5}" rx="${r * (1 + sq * .35)}" ry="${r * (1 - sq * .5)}" fill="${c}"/><ellipse cx="${-r * .35}" cy="${-r * .25 + r * sq * .5}" rx="${r * .28}" ry="${r * .16}" fill="#fff" opacity=".35" transform="rotate(-25 ${-r * .35} ${-r * .25})"/></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '5.6-6.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.8, type: 'swish' }, { t: 1.6, type: 'chime' }, { t: 3.0, type: 'blink' }, { t: 3.6, type: 'boing' }, { t: 4.2, type: 'boing' }, { t: 4.8, type: 'boing' },
    { t: 5.4, type: 'boing' }, { t: 5.9, type: 'thump' }, { t: 6.4, type: 'pon' }, { t: 7.2, type: 'twitch' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const FLOOR = 1640, BR = 130;
    const bg = L.office({ sky: 'day', clock: [12, 30], noClock: true });
    // ジル（左）：ボールの上でゆらゆら（きりっ）→ 満足 → 課長がはずむのに「！」→ ジト目
    const jsw = Math.sin(t * 2.2) * 5;
    const jface = t < 2.0 ? RIG.FACES.sharp : t < 3.4 ? Object.assign({}, RIG.FACES.smile, { sparkle: t < 2.8 ? 1 : 0 }) : t < 6.0 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : RIG.FACES.annoyed;
    L.char('jil', Object.assign({}, RIG.POSES.sit, jface, { x: 0, y: FLOOR - 413 * 1.3 - 2 * BR + 40, scale: 1.3, eyeLook: t > 3.0 ? .9 : .2, bodyTilt: jsw }), t, '', {});
    // レン（右）：ボールに座る → ぽよん、ぽよん（だんだん高く）→ どすん → 目が回る
    const A = 190 * ease(seg(t, 3.5, 5.3)) * (1 - ease(seg(t, 5.35, 5.95))), ph = (t - 3.5) * 1.2 * Math.PI * 2, hop = t > 3.5 && t < 5.9 ? Math.abs(Math.sin(ph)) * A : 0;
    const land = seg(t, 5.9, 6.1), sq = t < 3.5 ? 0 : t < 5.9 ? Math.max(0, .25 - Math.abs(Math.sin(ph)) * .6) * Math.min(1, A / 80) : .55 * (1 - .3 * seg(t, 6.1, 7.0));
    const rface = t < 3.0 ? RIG.FACES.neutral : t < 3.5 ? Object.assign({}, RIG.FACES.smile, { sparkle: 1 }) : t < 5.9 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : Object.assign({}, RIG.FACES.oops, { eyeOpen: .4 });
    L.char('ren', Object.assign({}, t > 3.5 && t < 5.9 ? RIG.POSES.binky : RIG.POSES.sit, rface, { x: 560, y: FLOOR - 413 * 1.35 - 2 * BR * (1 - sq * .5) + 40 - hop, scale: 1.35, flip: true, eyeLook: -.2, headTilt: t > 6.1 && t < 7.8 ? Math.sin(t * 6) * 10 : 0, bodyTilt: t > 6.1 && t < 7.8 ? Math.sin(t * 6 + 1) * 8 : 0 }), t, '', {});
    let fx = `<rect x="-500" y="${FLOOR}" width="2080" height="400" fill="#D9C7A8"/><rect x="-500" y="${FLOOR - 8}" width="2080" height="12" fill="#C2AE8C"/>`;
    fx += BALL(270, FLOOR - BR, BR, 0, '#7FB3D9') + BALL(840, FLOOR - BR * (1 - sq * .5), BR, sq, '#E8907A');
    if (t > 3.6 && t < 5.9 && hop > 60) fx += `<text x="${840 + 230}" y="${FLOOR - 520}" text-anchor="end" font-family="Noto Sans CJK JP" font-weight="900" font-size="64" fill="#E8473A" stroke="#FFF7E8" stroke-width="10" paint-order="stroke">ぽよーん</text>`;
    fx += L.impact(840, FLOOR - 40, land, 1, '#C2AE8C');
    if (t > 6.1 && t < 7.8) fx += `<g transform="translate(848 ${FLOOR - 800}) rotate(${t * 200})"><path d="M0 -30 A30 30 0 1 1 -30 0 A20 20 0 1 1 0 -20 A10 10 0 1 1 -10 0" stroke="#8C7B66" stroke-width="7" fill="none" stroke-linecap="round"/></g>`;
    if (t > 7.4 && t < 8.6) fx += L.emark(240, FLOOR - 860, 1.0, '…');
    let ui = (t > 0.6 && t < 2.4 ? CHIP(L, 'BALANCE BALL', 'ジル、バランスボール', 1820, seg(t, .6, .9)) : '')
      + (t > 6.2 && t < 8.6 ? CHIP_OFF(L, 'BOSS ON A BALL: BOING', '上司のバランスボール：はずみすぎる', 1820, seg(t, 6.2, 6.5)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.2, cx: 360, cy: 1150 },
      { t: 0.01, z: 1.0, cx: 480, cy: 1120, d: .9 },
      { t: 3.2, z: .95, cx: 640, cy: 1000, d: .5 },                 // はずむ（引き）
      { t: 6.0, z: 1.05, cx: 560, cy: 1120, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 5.9 && t < 6.1 ? 7 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
