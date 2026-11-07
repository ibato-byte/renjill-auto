// 「1枚だけ印刷」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：レンがプリンターのボタンを押す（画面に「×1」）→ 紙が1枚…2枚…止まらない → 紙の山に埋もれるレン
// ひっくり返し：ジルが来て、ボタンを1回押す → オチ：ぴたっと止まる。レンは紙の山から顔だけ。字幕「ジル、ボタン1回」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const PRINTER = (x, y, n, lamp) => `<g transform="translate(${x} ${y})"><rect x="-230" y="-200" width="460" height="200" rx="22" fill="#DDE1E6" stroke="#9AA3AE" stroke-width="6"/><rect x="-200" y="-230" width="400" height="60" rx="12" fill="#C9D0D8"/><rect x="-170" y="-120" width="140" height="70" rx="10" fill="#2E3440"/><text x="-100" y="-70" text-anchor="middle" font-size="48" font-weight="900" font-family="Noto Sans Mono, monospace" fill="#7CF0A8">×${n}</text><circle cx="150" cy="-100" r="34" fill="${lamp}"/><circle cx="150" cy="-100" r="34" fill="none" stroke="#6B7580" stroke-width="5"/><rect x="-180" y="-12" width="360" height="12" fill="#9AA3AE"/></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '5.9-6.4',
  sfx: [{ t: 0.3, type: 'click' }, { t: 0.9, type: 'swish' }, { t: 1.5, type: 'swish' }, { t: 1.9, type: 'swish' }, { t: 2.2, type: 'swish' }, { t: 2.45, type: 'swish' }, { t: 2.65, type: 'swish' }, { t: 2.85, type: 'swish' }, { t: 3.0, type: 'swish' }, { t: 3.15, type: 'swish' }, { t: 3.3, type: 'swish' }, { t: 3.45, type: 'swish' },
    { t: 3.6, type: 'flop' }, { t: 4.3, type: 'twitch' }, { t: 5.0, type: 'tap' }, { t: 5.3, type: 'tap' }, { t: 5.9, type: 'click' }, { t: 6.2, type: 'pon' }, { t: 7.0, type: 'blink' }, { t: 7.8, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400, PX = 400;
    const bg = L.office({ sky: 'day', clock: [10, 30] });
    // 紙の枚数：0.9〜3.6 で加速して増える（最大 40）。5.9 で止まる
    const flow = t < 5.9 ? ease(seg(t, .9, 3.6)) : 1;
    const n = Math.floor(flow * flow * 40);
    const stopped = t >= 5.9;
    // レン：ボタンを押す → 驚く → 紙に埋もれる（3.6〜）→ 顔だけ
    const buried = t >= 3.6;
    let rp = t < 0.5 ? Object.assign({}, RIG.POSES.lean, RIG.FACES.smile) : t < 1.9 ? Object.assign({}, RIG.POSES.sit, RIG.FACES.smile) : t < 3.6 ? Object.assign({}, RIG.POSES.sit, RIG.FACES.surprised, { excl: 0 }) : Object.assign({}, RIG.POSES.loaf, RIG.FACES.oops, { sweat: 1, eyeOpen: 1 });
    if (stopped) rp = Object.assign({}, RIG.POSES.loaf, t > 7.8 ? RIG.FACES.smile : RIG.FACES.neutral, { eyeOpen: 1 });
    Object.assign(rp, { x: 620, y: DESK - 413 * 1.3 + (buried ? 30 : 0), scale: 1.3, flip: true });
    L.char('ren', rp, t, '', {});
    // ジル：4.6 左から来る → 5.9 ボタンを1回押す → そのまま無言
    const h = RIG.hop(t, 4.6, 5.2, -500, -40, { hops: 2, height: 46 });
    const press = t > 5.75 && t < 6.05;
    const jp = t > 4.6 ? Object.assign({}, RIG.POSES.sit, t < 7.0 ? RIG.FACES.sharp : RIG.FACES.smug, { x: h.x, y: DESK - 413 * 1.3 + h.yOff, scale: 1.3, bodySquash: h.squash + (press ? -.25 : 0), eyeLook: .6 }) : null;
    L.char('jil', jp, t, '', { vx: h.vx });
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    fx += PRINTER(PX, DESK + 6, Math.max(1, n), stopped ? '#5DBB63' : (Math.floor(t * 8) % 2 ? '#E8473A' : '#FFB86B'));
    // 紙：プリンターから右（レンの方）へ飛び出して積もる
    for (let i = 0; i < n; i++) {
      const age = Math.max(0, flow * flow * 40 - i);
      const fly = Math.min(1, age / 2.5);
      const x = PX + 220 + fly * (120 + (i % 7) * 70 + Math.sin(i * 7.3) * 30), y = DESK - 20 - fly * (10 + Math.min(i, 13) * 8) - (1 - fly) * 40;
      fx += `<rect x="${x - 110}" y="${y - 8}" width="220" height="16" rx="3" fill="${i % 2 ? '#fff' : '#F4EFE6'}" stroke="#D7CCBB" stroke-width="2" transform="rotate(${Math.sin(i * 3.1) * 14 * (1 - fly) + Math.sin(i * 1.7) * 3} ${x} ${y})"/>`;
    }
    if (t > .3 && t < .6) fx += L.impact(PX + 150, DESK - 110, seg(t, .3, .6), .8, '#7CF0A8');
    if (press) fx += L.impact(PX + 150, DESK - 110, seg(t, 5.75, 6.05), 1.0, '#E8473A');
    if (t > 6.1 && t < 7.0) fx += L.check(PX + 150, DESK - 330, seg(t, 6.1, 6.4), .9);
    let ui = (t > 1.8 && t < 3.4 ? CHIP(L, 'PRINT: 1 PAGE', '上司「1枚だけ印刷」', 1380, seg(t, 1.8, 2.1)) : '')
      + (t > 6.2 && t < 8.6 ? CHIP(L, 'JILL: ONE BUTTON', 'ジル、ボタン1回で止める', 1380, seg(t, 6.2, 6.5)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.4, cx: 700, cy: 1200 },
      { t: 0.01, z: 1.1, cx: 700, cy: 1200, d: .9 },
      { t: 2.0, z: 1.0, cx: 720, cy: 1220, d: .6 },
      { t: 4.6, z: .95, cx: 600, cy: 1200, d: .5 },
      { t: 5.7, z: 1.3, cx: 520, cy: 1260, d: .3 },                // ボタン
      { t: 6.6, z: 1.0, cx: 640, cy: 1200, d: .5 },
      { t: 7.8, z: 1.3, cx: 860, cy: 1200, d: .6 },                // 紙の山の中のレン
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 3.6 && t < 3.75 ? 8 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
