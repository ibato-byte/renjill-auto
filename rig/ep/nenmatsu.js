// 「年末調整」（約9.5秒・セリフなし・文字なし）v2 演出／キャラは本番の rig.js
// 書類を読むレン → 書類がどんどん伸びて机から床まで垂れる → レン、伸びて倒れる → ジルが跳ねて来て無言でハンコ3回、書類はシュッと1枚に
// → 生き返ったレン（跳ねる）がお礼に牧草を1本 → ジル、無表情のまま…もぐもぐ（ちょっとうれしい）
document.write('<script src="v2/lib.js"><\/script>');
// 分かりやすさの決まり（docs/CLARITY.md）：キャラはしゃべらない。そのかわり「状況」と「オチ」を短い字幕（英＋日）で1回ずつ出す
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const DIZZY = (x, y, t) => `<g transform="translate(${x} ${y})" fill="none" stroke="#8C6BB1" stroke-width="7" stroke-linecap="round">${[0, 1, 2].map(i => `<path transform="rotate(${t * 220 + i * 120}) translate(70 0)" d="M0 0 a14 14 0 1 1 -14 -14"/>`).join('')}</g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '2.6-3.3',
  sfx: [{ t: 0.12, type: 'pop' }, { t: 0.5, type: 'swish' }, { t: 1.1, type: 'swish' }, { t: 1.7, type: 'swish' }, { t: 2.25, type: 'boing' }, { t: 2.75, type: 'flop' },
    { t: 3.35, type: 'tap' }, { t: 3.6, type: 'tap' }, { t: 3.95, type: 'thump' }, { t: 4.35, type: 'thump' }, { t: 4.75, type: 'thump' }, { t: 5.0, type: 'whoosh' }, { t: 5.3, type: 'chime' },
    { t: 5.75, type: 'boing' }, { t: 6.4, type: 'pon' }, { t: 7.4, type: 'tap' }, { t: 7.65, type: 'tap' }, { t: 7.9, type: 'tap' }, { t: 8.15, type: 'tap' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, lerp, outBack, pulse } = L;
    const DESK = 1400, FX = 640;                                   // 書類の位置（机の上・x）
    const bg = L.office({ sky: 'day', clock: [15, 0] });
    // 書類：0.3〜2.4 で伸びる（机の前に垂れて床まで）、5.0 で一瞬で戻る
    const grow = t < 5.0 ? ease(seg(t, .3, 2.4)) : 1 - ease(seg(t, 5.0, 5.2));
    const len = 110 + grow * 780;
    const rows = Math.floor(len / 30);
    const lines = Array.from({ length: rows }, (_, i) => `<rect x="-78" y="${54 + i * 30}" width="${i % 3 ? 120 : 90}" height="9" rx="4" fill="#C9D3E0"/><rect x="58" y="${50 + i * 30}" width="18" height="16" rx="3" fill="none" stroke="#C9D3E0" stroke-width="3"/>`).join('');
    const SS = [3.95, 4.35, 4.75];
    const stamps = SS.filter(s => t >= s && (t < 5.0 || s === SS[0])).map((s, i) => t < 5.0 ? L.stamp(-30 + i * 34, 120 + i * 170, outBack(seg(t, s, s + .15))) : L.stamp(40, 80, 1)).join('');
    const curl = Math.min(len, 230);
    const form = `<g transform="translate(${FX} ${DESK - 6})"><rect x="-110" y="0" width="220" height="${len}" rx="6" fill="#FFFDF8" stroke="#D7CCBB" stroke-width="3"/><rect x="-110" y="0" width="220" height="40" rx="6" fill="#7FA6D6"/><g fill="#fff"><rect x="-80" y="14" width="70" height="12" rx="6"/><rect x="0" y="14" width="40" height="12" rx="6"/></g>${lines}${stamps}${len > 700 ? `<ellipse cx="0" cy="${len}" rx="${110 + (len - 700) * .3}" ry="26" fill="#FFFDF8" stroke="#D7CCBB" stroke-width="3"/>` : ''}</g>`;
    // レン（机の上）：読む → 2.25 驚く → 2.75 伸びて倒れる → 5.6 生き返って跳ねる → 6.3 牧草を差し出す
    const down = t > 2.75 && t < 5.6;
    let rp;
    if (t < 2.25) rp = Object.assign({}, RIG.POSES.loaf, RIG.FACES.think, { question: 0, eyeLook: -.4, headNod: 18 + 10 * grow });
    else if (t < 2.75) rp = Object.assign({}, RIG.POSES.sit, RIG.FACES.surprised);
    else if (down) rp = Object.assign({}, RIG.POSES.stretch, RIG.FACES.oops, { sweat: 1, eyeOpen: .5, excl: 0 });
    else if (t < 6.3) rp = Object.assign({}, RIG.POSES.binky, RIG.FACES.smile, { sparkle: 1 });
    else rp = Object.assign({}, RIG.POSES.nudge, RIG.FACES.smile);
    const rs = 1.5, jump = t > 5.6 && t < 6.2 ? -Math.sin(Math.PI * seg(t, 5.6, 6.2)) * 90 : 0;
    Object.assign(rp, { x: 470, y: DESK - 413 * rs + jump, scale: rs, flip: true });
    const hay = t > 6.3 && t < 7.15 ? `<g transform="translate(${560 - 80 * outBack(seg(t, 6.3, 6.6))} ${DESK - 200}) scale(1.6)">${L.hayStrand(0, 0, 150, 180)}</g>` : '';
    L.char('ren', rp, t, '', {});
    // ジル（左から跳ねて来る 3.2〜3.8）
    const h = RIG.hop(t, 3.2, 3.8, -420, 40, { hops: 2, height: 50 });
    const js = 1.3;
    let jp = null;
    if (t > 3.2) {
      const hit = SS.some(s => t > s - .12 && t < s + .08);
      const face = t < 7.2 ? Object.assign({}, RIG.FACES.sharp) : Object.assign({}, RIG.FACES.smile, { blush: 1 });
      jp = Object.assign({}, RIG.POSES.sit, face, { x: h.x, y: DESK - 413 * js + h.yOff, scale: js, bodySquash: h.squash + (hit ? -.25 : 0) + (t > 7.2 ? .06 * Math.sin(t * 22) : 0), eyeLook: t < 7.2 ? .6 : 0 });
    }
    const stamper = t > 3.6 && t < 5.3 ? L.stamper(FX - 120, DESK - 40 - (SS.some(s => t > s - .15 && t < s + .05) ? 0 : 60), 1.1) : '';
    const jhay = t > 7.0 ? L.hayStrand(h.x + 250 * js - Math.min(120, (t - 7.2) * 90), DESK - 250, Math.max(20, 150 - Math.max(0, t - 7.2) * 90), -170) : '';
    L.char('jil', jp, t, '', { vx: h.vx });
    // 手前（机の前板・書類・効果）
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    fx += form + stamper + jhay + hay;
    fx += SS.map(s => L.impact(FX - 20, DESK + 110 + SS.indexOf(s) * 170, seg(t, s, s + .3), 1.1)).join('');
    if (t > 2.25 && t < 2.75) fx += L.emark(820, DESK - 640, 1.1);
    if (down) fx += DIZZY(760, DESK - 420, t);
    fx += L.check(FX, DESK + 150, seg(t, 5.25, 5.5) * (t < 6.3 ? 1 : 0), 1);
    if (t > 5.6 && t < 6.6) fx += L.sparkles(760, DESK - 380, t, 1.4);
    if (t > 7.25 && t < 8.6) fx += L.munch(240, DESK - 300, t, 1.3);
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 640, cy: 1150 },
      { t: .8, z: 1.0, cx: 560, cy: 1300, d: 1.5 },                 // 伸びる書類を追って引く
      { t: 2.6, z: 1.25, cx: 640, cy: 1180, d: .5 },
      { t: 3.3, z: 1.0, cx: 480, cy: 1250, d: .5 },
      { t: 5.6, z: 1.15, cx: 560, cy: 1150, d: .5 },
      { t: 7.1, z: 1.45, cx: 330, cy: 1170, d: .6 },                // もぐもぐのジル
    ], t);
    // 状況とオチの字幕（各1回）
    let ui = (t > 1.0 && t < 2.6 ? CHIP(L, 'THE FORMS KEEP GOING...', '読んでも読んでも終わらない', 1380, seg(t, 1.0, 1.3)) : '')
      + (t > 5.2 && t < 6.9 ? CHIP(L, 'JILL: DONE IN 3 SECONDS', 'ジル、3秒で終わらせる', 1380, seg(t, 5.2, 5.5)) : '');
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: SS.some(s => t > s && t < s + .12) ? 9 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
