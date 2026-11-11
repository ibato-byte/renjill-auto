// 「定時1分前」（約9.5秒・セリフなし・文字なし）v2 演出／キャラは本番の rig.js
// 金曜17:59、帰る準備万端のジル → 書類の山を抱えたレンが跳ねてくる（吹き出しは書類の絵＋？）→ ジル固まる
// → 画面の時計が 18:00 になった瞬間、ジルはバッグを持って走って帰る（字幕「18:00ちょうど、ジルは帰った」） → 空いた席を見つめるレン → こちらを向いて書類の吹き出し（＝見ている人の番。ループ）
document.write('<script src="v2/lib.js"><\/script>');
// 分かりやすさの決まり（docs/CLARITY.md）：キャラはしゃべらない。そのかわり「状況」と「オチ」を短い字幕（英＋日）で1回ずつ出す
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '4.0-4.6',
  sfx: [{ t: 0.12, type: 'pop' }, { t: 0.55, type: 'tap' }, { t: 0.95, type: 'tap' }, { t: 1.45, type: 'tap' }, { t: 1.7, type: 'tap' }, { t: 2.0, type: 'pon' },
    { t: 2.65, type: 'blink' }, { t: 3.15, type: 'twitch' }, { t: 4.0, type: 'chime' }, { t: 4.38, type: 'swish' }, { t: 4.45, type: 'whoosh' },
    { t: 5.3, type: 'blink' }, { t: 6.5, type: 'boing' }, { t: 7.0, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, lerp, outBack, pulse } = L;
    const DESK = 1400;
    const gone = t >= 5.0, six = t >= 4.0;
    const bg = L.office({ sky: 'dusk', noClock: true }) + L.digital(540, 600, six ? '18:00' : '17:59', { s: 1.25 + .12 * pulse(t, 4.0, 4.35), color: six ? '#7CF0A8' : '#FFB86B' });
    // 壁のデジタル時計（数字は世界共通）17:59 → 18:00
    // ジル（机の上・左）：ルンルン → 気づく → 固まる → 消える
    let jp = null;
    if (!gone) {
      const bob = t < 2.4 ? Math.abs(Math.sin(t * 7)) * -14 : 0;
      const face = t < 2.55 ? RIG.FACES.smile : t < 3.1 ? RIG.FACES.surprised : Object.assign({}, RIG.FACES.oops, { sweat: 1, eyeOpen: 1.1 });
      const squash = t > 3.85 && t < 4.3 ? -.5 * seg(t, 3.85, 4.3) : 0;     // 走り出す前にぎゅっと縮む（ため）
      const dash = RIG.hop(t, 4.3, 5.0, 120, -700, { hops: 3, height: 40 });
      jp = Object.assign({}, t > 4.3 ? RIG.POSES.stretch : RIG.POSES.sit, t > 4.3 ? RIG.FACES.smile : face, { x: dash.x, y: DESK - 413 * 1.4 + bob + dash.yOff, scale: 1.4, bodySquash: squash, eyeLook: t > 2.55 ? .8 : 0, earL: t > 3.1 ? -18 : 0, earR: t > 3.1 ? 18 : 0, excl: t > 2.55 && t < 3.1 ? 1 : 0 });
    }
    const bagX = t > 4.3 ? RIG.hop(t, 4.3, 5.0, 120, -700, { hops: 3, height: 40 }).x - 30 : 90 + (t < 2.4 ? Math.sin(t * 7) * 3 : 0);
    const bag = gone ? '' : L.bag(bagX, DESK + 4 - (t > 4.3 ? 120 : 0), .75);
    L.char('jil', jp, t, '', { vx: t > 4.3 ? -1200 : 0 });
    // レン：右から跳ねて来る（1.3〜1.9）
    const h = RIG.hop(t, 1.3, 1.9, 1250, 560, { hops: 2, height: 60 });
    const rface = t < 4.3 ? RIG.FACES.smile : t < 6.4 ? Object.assign({}, RIG.FACES.surprised, { sweat: 1, excl: 0 }) : RIG.FACES.smile;
    const rs = 1.55;
    const rp = Object.assign({}, RIG.POSES.sit, rface, { x: h.x, y: DESK - 413 * rs + h.yOff, scale: rs, bodySquash: h.squash, eyeLook: t > 4.3 && t < 6.4 ? -1 : 0, question: 0, blush: t > 6.6 ? .8 : (rface.blush || 0) });
    const stack = `<g transform="translate(${h.x + 175 * rs} ${DESK - 4})">${L.papers(0, 0, 14)}</g>`;
    L.char('ren', rp, t, stack, { vx: h.vx });
    // 手前の層（机の前板）は fx の一番下に置く（キャラの足元を隠す）
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    fx += bag;
    const ask = s => L.bubble(0, 0, `<g transform="translate(-60 30) scale(.45)">${L.papers(0, 0, 9, { mess: 4 })}</g>${L.qmark(66, -6, .8)}`, { w: 280, h: 150, tail: 40, s });
    if (t > 2.0 && t < 3.7) fx += `<g transform="translate(840 ${DESK - 560})">${ask(outBack(seg(t, 2.0, 2.25)))}</g>`;
    fx += L.chime(540, 600, seg(t, 4.0, 4.6), 1.1);
    if (t > 4.3) fx += L.dust(260, DESK - 120, seg(t, 4.3, 5.2)) + L.speed(200, DESK - 250, 1 - seg(t, 4.5, 5.2));
    let ui = '';
    // オチの字幕（1回だけ）
    ui += t > 4.5 && t < 6.6 ? CHIP(L, '18:00. GONE.', '18:00ちょうど、ジルは帰った', 1380, seg(t, 4.5, 4.9)) : '';
    if (t > 7.0 && t < 8.6) ui += `<g transform="translate(540 640)">${ask(1.35 * outBack(seg(t, 7.0, 7.3)))}</g>`;
    const cam = L.camAt([
      { t: 0, z: 1.5, cx: 380, cy: 1120 },
      { t: 0.01, z: 1.3, cx: 360, cy: 1150, d: .75 },          // 最初の1秒で寄りから引く（qa：0.5秒以内に動き）
      { t: 1.25, z: 1.0, cx: 540, cy: 1120, d: .5 },
      { t: 2.55, z: 1.5, cx: 360, cy: 1170, d: .5 },
      { t: 3.55, z: 1.35, cx: 540, cy: 780, d: .45 },          // 壁の時計に寄る
      { t: 4.2, z: .95, cx: 420, cy: 1120, d: .4 },               // 引き：ジルが走って出ていくのが見える
      { t: 6.4, z: 1.4, cx: 700, cy: 1180, d: .7 },             // cx 800→700：時計の「18:00」の「1」が左端で切れて「8:00」に見えた（2026-11-12 再検査）
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 4.4 && t < 4.7 ? 10 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
