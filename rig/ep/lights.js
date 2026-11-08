// 「電飾」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：クリスマス前。ジルが窓の上に電飾（電球のひも）をかざる
// ひっくり返し：課長がひもの端に飛びつく → くるくる回って、体じゅうに巻きつく
// オチ：ジルがスイッチを入れると、光ったのは課長。字幕「電飾：上司に点灯」
// （コードをかじる場面は出さない：うさぎには危ないので）
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const COLS = ['#FF5A4E', '#FFD24A', '#5BC0F0', '#7EDB6A', '#FF8FC8'];
const BULB = (x, y, i, on, t) => { const c = COLS[i % COLS.length], blink = on ? .75 + .25 * Math.sin(t * 9 + i * 1.7) : 0;
  return (on ? `<circle cx="${x}" cy="${y + 10}" r="30" fill="${c}" opacity="${(.35 * blink).toFixed(2)}"/>` : '')
    + `<rect x="${x - 6}" y="${y - 8}" width="12" height="10" rx="2" fill="#5A6470"/><ellipse cx="${x}" cy="${y + 12}" rx="10" ry="14" fill="${on ? c : '#EDE6DA'}" stroke="${on ? '#FFF7E8' : '#B9AE9E'}" stroke-width="3"/>`; };
// ひも（点の列）に沿って電球
const WIRE = (pts, on, t, every) => { let s = `<path d="M${pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join(' L')}" fill="none" stroke="#3E4650" stroke-width="5" stroke-linejoin="round"/>`;
  let acc = 0, n = 0; for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], d = Math.hypot(x1 - x0, y1 - y0);
    for (let u = (every - acc) % every; u < d; u += every) { const k = u / d; s += BULB(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, n++, on, t); } acc = (acc + d) % every; }
  return s; };
var EP = {
  dur: 9.5,
  bgmHolds: '5.5-6.1',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.9, type: 'tap' }, { t: 1.3, type: 'chime' }, { t: 2.2, type: 'boing' }, { t: 3.0, type: 'swish' }, { t: 3.5, type: 'swish' }, { t: 4.0, type: 'swish' }, { t: 4.5, type: 'swish' },
    { t: 5.6, type: 'tap' }, { t: 5.9, type: 'chime' }, { t: 6.6, type: 'blink' }, { t: 7.4, type: 'twitch' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400, RX = 800, RY = DESK - 300;      // レンの体のまんなか（だいたい）
    const bg = L.office({ sky: 'night', clock: [18, 0] });
    const hang = ease(seg(t, .6, 1.6));               // かざる（左から右へ伸びる）
    const grab = ease(seg(t, 2.1, 2.8));              // 右の端がレンへ
    const wrap = ease(seg(t, 2.9, 5.0));              // 巻きつく
    const on = t >= 5.9;
    // ジル（左）：かざる（lean）→ 満足 → レンを見て「！」→ 気づかずスイッチ（lean）→ びっくり → ジト目
    const jface = t < 1.8 ? RIG.FACES.smile : t < 3.0 ? Object.assign({}, RIG.FACES.smile, { sparkle: t < 2.2 ? 1 : 0 }) : t < 5.4 ? RIG.FACES.sharp : t < 7.0 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : RIG.FACES.annoyed;
    const jreach = (t > .6 && t < 1.6) || (t > 5.3 && t < 5.9);
    const jp = Object.assign({}, jreach ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 30, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: t >= 3.0 && t < 5.4 ? 0 : .8, headNod: t >= 3.0 && t < 5.3 ? 14 : 0, bodyTilt: jreach ? -12 : 0 });
    L.char('jil', jp, t, '', {});
    // レン（右）：ひもを見る → 飛びつく（stretch）→ くるくる（体を左右に）→ 光ってご満悦
    const spin = t >= 2.9 && t < 5.0;
    const rface = t < 2.0 ? RIG.FACES.neutral : t < 2.9 ? Object.assign({}, RIG.FACES.smile, { sparkle: 1 }) : t < 5.0 ? RIG.FACES.oops : t < 5.9 ? RIG.FACES.neutral : Object.assign({}, RIG.FACES.smug, { sparkle: 1 });
    const rp = Object.assign({}, t >= 2.0 && t < 2.9 ? RIG.POSES.binky : RIG.POSES.sit, rface, { x: 540, y: DESK - 413 * 1.35, scale: 1.35, flip: !(spin && Math.sin(t * 14) > 0), eyeLook: .3, bodyTilt: spin ? Math.sin(t * 14) * 10 : 0 });
    L.char('ren', rp, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // スイッチ（ジルの机）
    fx += `<g transform="translate(330 ${DESK - 30})"><rect x="-44" y="-34" width="88" height="64" rx="12" fill="#F4EEE4" stroke="#B9AE9E" stroke-width="4"/><rect x="-14" y="${on ? -20 : -4}" width="28" height="26" rx="6" fill="${on ? '#E8473A' : '#9AA3AE'}"/></g>`;
    // 電飾のひも：左の端は窓の上に留まる。右の部分はレンへ引っぱられ、体に巻きつく
    const span = 120 + 880 * hang;                    // かざった長さ
    const left = [], right = [];
    for (let k = 0; k <= 12; k++) { const u = k / 12, x = 60 + span * u, y = 760 + Math.sin(u * Math.PI) * 50; left.push([x, y]); }
    if (grab > 0) { // 右半分（u>.55）をレンの方へ
      const cut = Math.round(12 * .55), head = left.slice(0, cut + 1), tail = left.slice(cut);
      const [ax, ay] = head[head.length - 1];
      const pts = head.slice(); for (let k = 1; k <= 14; k++) { const u = k / 14, tx = ax + (RX - ax) * u, ty = ay + (RY - 120 - ay) * u + Math.sin(u * Math.PI) * 120; const ox = tail[Math.min(tail.length - 1, k)] || [ax, ay]; pts.push([ox[0] + (tx - ox[0]) * grab, ox[1] + (ty - ox[1]) * grab]); }
      fx += WIRE(pts, on, t, 64);
      if (wrap > 0) { // 体に巻いたひも（らせん）
        const coil = []; const turns = 3.2 * wrap; for (let a = 0; a <= turns * Math.PI * 2; a += .25) { const k = a / (3.2 * Math.PI * 2); coil.push([RX + Math.cos(a) * 185, RY + 140 + k * 190 + Math.sin(a) * 26]); }
        if (coil.length > 1) fx += WIRE(coil, on, t, 70);
      }
    } else fx += WIRE(left, on, t, 64);
    if (on && t < 6.6) fx += L.sparkles(RX, RY - 200, t, 1.6, 12);
    if (t > 2.1 && t < 2.5) fx += L.impact(RX, RY - 260, seg(t, 2.1, 2.5), .7, '#FFD24A');
    if (t > 7.2 && t < 8.6) fx += L.emark(220, DESK - 650, 1.0, '…');
    let ui = (t > 1.0 && t < 2.4 ? CHIP(L, 'XMAS LIGHTS', 'ジル、電飾をかざる', 1580, seg(t, 1.0, 1.3)) : '')
      + (t > 6.4 && t < 8.6 ? CHIP(L, 'LIGHTS ON: THE BOSS', '電飾：上司に点灯', 1580, seg(t, 6.4, 6.7)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 400, cy: 1000 },
      { t: 0.01, z: 1.0, cx: 540, cy: 1060, d: .9 },
      { t: 2.0, z: 1.2, cx: 700, cy: 1100, d: .5 },                 // 飛びつく
      { t: 5.2, z: 1.05, cx: 540, cy: 1100, d: .4 },                // スイッチ
      { t: 6.0, z: 1.35, cx: 760, cy: 1120, d: .5 },                // 光った課長
      { t: 7.2, z: 1.1, cx: 560, cy: 1120, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: 0, dim: on && t < 8.6 ? .25 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
