// 「1枚だけ印刷」（約9.5秒・セリフなし）v3 演出（2026-11-15 総見直しで作り直し）／キャラは本番の rig.js
// 状況：レンがプリンターのボタンを押す（画面に「×1」）→ 紙が1枚…2枚…止まらない → 紙の山がおなかまでたまり、頭にも乗る
// ひっくり返し：ジルが跳ねて来て、ボタンの上にちょこんと座る（腕は使わない）→ オチ：ぴたっと止まる（緑のランプ・チェック）
// オチの後のオチ（0.5秒）：最後の1枚がひらひら落ちてきて、レンの頭にぺたっと乗り、耳がしょんぼり
// 前の版（v2）の問題：紙の束（横長の線）がレンの顔の前を横切って顔が隠れる／ジルが小さく、左で4割以上切れる／止めた動きが見えない
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
// プリンター（ボタンは左側＝ジルが届く側）。press（0〜1）でボタンが沈む
const PRINTER = (x, y, n, lamp, press) => `<g transform="translate(${x} ${y}) scale(.82)"><rect x="-230" y="-200" width="460" height="200" rx="22" fill="#DDE1E6" stroke="#9AA3AE" stroke-width="6"/><rect x="-200" y="-230" width="400" height="60" rx="12" fill="#C9D0D8"/><rect x="10" y="-130" width="160" height="80" rx="10" fill="#2E3440"/><text x="90" y="-72" text-anchor="middle" font-size="52" font-weight="900" font-family="Noto Sans Mono, monospace" fill="#7CF0A8">×${n}</text><circle cx="-130" cy="${-100 + press * 10}" r="40" fill="${lamp}"/><circle cx="-130" cy="${-100 + press * 10}" r="40" fill="none" stroke="#6B7580" stroke-width="5"/><rect x="200" y="-60" width="40" height="40" rx="6" fill="#9AA3AE"/></g>`;
// 紙1枚（たて長・少し傾く）
const SHEET = (x, y, rot, s = 1) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><rect x="-55" y="-72" width="110" height="144" rx="4" fill="#fff" stroke="#CFC3B0" stroke-width="3"/><path d="M-36 -44 H36 M-36 -22 H36 M-36 0 H24" stroke="#D9D2C6" stroke-width="6" stroke-linecap="round"/></g>`;
const DESK = 1400, PX = 450, OUTX = PX + 190, OUTY = DESK - 60;
const RS = 1.4, RCX = 820;              // レン：大きさ・体の中心（rig の x は左端。中心＝x＋200×scale）
const JS = 1.35, JCX = 210;             // ジル
var EP = {
  dur: 9.5,
  bgmHolds: '5.9-6.4',
  sfx: [{ t: 0.3, type: 'click' }, { t: 0.9, type: 'swish' }, { t: 1.5, type: 'swish' }, { t: 1.9, type: 'swish' }, { t: 2.2, type: 'swish' }, { t: 2.45, type: 'swish' }, { t: 2.65, type: 'swish' }, { t: 2.85, type: 'swish' }, { t: 3.0, type: 'swish' }, { t: 3.15, type: 'swish' }, { t: 3.3, type: 'swish' }, { t: 3.45, type: 'swish' },
    { t: 3.6, type: 'flop' }, { t: 4.6, type: 'tap' }, { t: 4.9, type: 'tap' }, { t: 5.9, type: 'pon' }, { t: 6.2, type: 'click' }, { t: 7.0, type: 'blink' }, { t: 8.15, type: 'flop' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease } = L;
    const bg = L.office({ sky: 'day', clock: [10, 30] });
    // 紙の枚数：0.9〜3.6 で加速して増える（最大 40）。5.9 で止まる
    const stopped = t >= 5.9;
    const flowF = t < 5.9 ? Math.min(1, ease(seg(t, .9, 3.6)) + seg(t, 3.6, 5.9) * .0) : 1;
    const nf = flowF * flowF * 40, n = Math.floor(nf);
    const pile = Math.min(1, nf / 40);                // 山の高さ（0〜1）
    // ---- レン（右）：ボタンを押す → 紙が止まらず驚く → 胸まで埋もれて汗 → 止まってほっ → 最後の1枚が顔に
    const buried = t >= 3.6;
    let rface = t < 1.9 ? RIG.FACES.smile : t < 3.6 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : Object.assign({}, RIG.FACES.oops, { sweat: 1, eyeOpen: 1 });
    if (stopped) rface = t > 6.4 && t < 8.15 ? RIG.FACES.smile : RIG.FACES.neutral;
    const rp = Object.assign({}, RIG.POSES.sit, rface,
      { x: RCX - 200 * RS, y: DESK - 413 * RS, scale: RS, flip: true, eyeLook: t < 1.9 ? 1 : 0 },
      L.anticip(t, 0.3, .15), L.startle(t, 1.9), L.land(t, 3.6, .3), t >= 8.15 ? L.droop(t, 8.15) : {});
    if (rp.yOff) rp.y += rp.yOff;   // 部品の yOff は rig が使わない。y に足す
    L.char('ren', rp, t, '', {});
    // ---- ジル（左）：4.4 左から跳ねて来る → 5.6 ため → ボタンの上にちょこんと座る（5.9）→ 6.5 元の場所へ。顔はずっと平然
    const h = RIG.hop(t, 4.5, 5.1, -330, JCX - 200 * JS, { hops: 2, height: 46 });
    const BTN = PX - 130 * .82;
    const onBtn = seg(t, 5.6, 5.9), offBtn = seg(t, 6.6, 6.9);
    const jx = h.x + (BTN - JCX + 20) * (Math.sin(Math.PI / 2 * onBtn) - Math.sin(Math.PI / 2 * offBtn));
    const jhop = (onBtn > 0 && onBtn < 1 ? -90 * Math.sin(Math.PI * onBtn) : 0) + (offBtn > 0 && offBtn < 1 ? -70 * Math.sin(Math.PI * offBtn) : 0);
    const sitting = t >= 5.9 && t < 6.6;
    const jp = t > 4.5 ? Object.assign({}, RIG.POSES.sit, t < 6.9 ? RIG.FACES.sharp : RIG.FACES.smug,
      { x: jx, y: DESK - 413 * JS + h.yOff + jhop - (sitting ? 70 : 0), scale: JS, eyeLook: t > 6.9 ? .8 : 0 },
      L.anticip(t, 5.6, .2), L.land(t, 5.9, .25), L.land(t, 6.9, .2), h.moving ? { bodySquash: h.squash } : {}) : null;
    L.char('jil', jp, t, '', { vx: h.vx });
    // ---- 机・プリンター
    let fx = `${L.deskFront(DESK)}`
      + [60, 560].map(x => `${L.drawer(x, DESK)}`).join('');
    const press = (t > .2 && t < .45) ? 1 : (t > 5.85 && t < 6.6) ? 1 : 0;
    fx += PRINTER(PX, DESK + 6, Math.max(1, n), stopped ? '#5DBB63' : (Math.floor(t * 8) % 2 ? '#E8473A' : '#FFB86B'), press);
    // 紙の山：レンの前（体の下半分だけ。顔は隠さない）。高さは最大 300px
    const pileH = 165 * pile, pileL = RCX - 170, pileR = RCX + 230;
    if (pileH > 4) {
      fx += `<path d="M${pileL - 40} ${DESK} Q${pileL} ${DESK - pileH * .9} ${RCX - 60} ${DESK - pileH} Q${RCX + 80} ${DESK - pileH * 1.05} ${pileR} ${DESK - pileH * .7} Q${pileR + 40} ${DESK - pileH * .3} ${pileR + 50} ${DESK}Z" fill="#FBF8F2" stroke="#CFC3B0" stroke-width="4"/>`;
      for (let i = 0; i < Math.min(14, n); i++) { const u = (i * 0.618) % 1; const sx = pileL + u * (pileR - pileL), sy = DESK - pileH * (.25 + .6 * Math.sin(Math.PI * u)) + 30; fx += SHEET(sx, sy, Math.sin(i * 2.3) * 35, .8); }
    }
    // 頭に乗った紙（埋もれてから）
    if (t > 3.0) fx += SHEET(RCX - 10, DESK - 413 * RS + 30 + (rp.yOff || 0), -14, .75);
    // 飛んでいる紙：直近の6枚だけ。出口から弧を描いて山へ
    if (!stopped) for (let i = Math.max(0, n - 6); i < n; i++) {
      const fly = Math.min(1, (nf - i) / 2.2); if (fly >= 1) continue;
      const tx = pileL + ((i * 0.618) % 1) * (pileR - pileL);
      const x = OUTX + (tx - OUTX) * fly, y = OUTY - 50 * Math.sin(Math.PI * fly) + (DESK - pileH - OUTY) * fly;
      fx += SHEET(x, y, fly * 360 * (i % 2 ? 1 : -1), .9);
    }
    // オチの後のオチ：最後の1枚がひらひら落ちて、レンの頭にぺたっ（7.4〜8.15）
    if (t > 7.4) { const k = seg(t, 7.4, 8.15); const fy = 300 + (DESK - 413 * RS + 60 - 300) * ease(k); fx += SHEET(RCX + 10 + Math.sin(k * 9) * 60 * (1 - k), fy, Math.sin(k * 8) * 25 * (1 - k), 1.0); }
    if (t > .2 && t < .5) fx += L.impact(BTN, DESK - 80, seg(t, .2, .5), .8, '#7CF0A8');
    if (t > 5.85 && t < 6.2) fx += L.impact(BTN, DESK - 80, seg(t, 5.85, 6.2), 1.1, '#5DBB63');
    if (t > 6.1 && t < 7.2) fx += L.check(PX + 70, DESK - 330, seg(t, 6.1, 6.4), .9);
    let ui = (t > 1.8 && t < 3.4 ? CHIP(L, 'PRINT: 1 PAGE', '上司「1枚だけ印刷」', 1560, seg(t, 1.8, 2.1)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 700, cy: 1150 },
      { t: 0.01, z: 1.15, cx: 700, cy: 1150, d: .9 },
      { t: 2.0, z: 1.0, cx: 640, cy: 1150, d: .6 },
      { t: 4.2, z: 1.0, cx: 580, cy: 1150, d: .5 },
      { t: 5.5, z: 1.2, cx: 420, cy: 1180, d: .3 },                // ボタンの上のジル
      { t: 6.7, z: 1.0, cx: 590, cy: 1150, d: .5 },
      { t: 7.5, z: 1.25, cx: 760, cy: 1100, d: .6 },                // 頭に紙が乗るレン
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 3.6 && t < 3.75 ? 8 : t > 5.9 && t < 6.0 ? 6 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
