// 「アドベントカレンダー」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// （2026-11-08：うさぎにチョコは毒なので、中身を牧草キューブに変更）
// 状況：12/1。ジルの机にアドベントカレンダー（24の小窓）。ジルが「1」を開けて牧草キューブを1つ（きらっ）
// ひっくり返し：ジルが席を外した隙に、レンが 2・3・4…24 を全部開ける（高速）→ 口のまわりに牧草のかけら
// オチ：ジルが戻る。窓は全部開いていて中は空。レンの前に包み紙の山。字幕「24日分、1日で」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
// カレンダー：opened=開いた窓の数（1〜24）。窓は 6×4、開いた窓は暗い穴＋小さな牧草キューブ（食べたら空）
const ADVENT = (x, y, opened, eaten) => { let s = `<g transform="translate(${x} ${y})"><rect x="-300" y="-210" width="600" height="420" rx="16" fill="#1F6B45" stroke="#145034" stroke-width="6"/>`; for (let i = 0; i < 24; i++) { const cx = -250 + (i % 6) * 100, cy = -160 + Math.floor(i / 6) * 100; const op = i < opened, ea = i < eaten; s += `<rect x="${cx - 38}" y="${cy - 38}" width="76" height="76" rx="8" fill="${op ? '#0E3A26' : '#E8473A'}" stroke="#F2B544" stroke-width="3"/>`; if (!op) s += `<text x="${cx}" y="${cy + 12}" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="30" fill="#FFF7E8">${i + 1}</text>`; else if (!ea) s += `<rect x="${cx - 18}" y="${cy - 18}" width="36" height="36" rx="8" fill="#B9C46A" stroke="#8C9A3E" stroke-width="3"/><path d="M${cx - 10} ${cy - 6} l20 -4 M${cx - 10} ${cy + 4} l20 -4" stroke="#7E8E36" stroke-width="3" stroke-linecap="round"/>`; } return s + '</g>'; };
const WRAPPERS = (x, y, n) => { let s = ''; for (let i = 0; i < n; i++) s += `<path d="M${x - 80 + (i * 37) % 160} ${y - (i * 13) % 50} l14 -10 l12 12 l-10 12 Z" fill="${i % 3 ? '#F2B544' : '#E86C5A'}" stroke="#C98A12" stroke-width="2"/>`; return s; };
var EP = {
  dur: 9.5,
  bgmHolds: '6.6-7.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.0, type: 'click' }, { t: 1.4, type: 'pon' }, { t: 2.6, type: 'swish' }, { t: 3.2, type: 'click' }, { t: 3.4, type: 'click' }, { t: 3.6, type: 'click' }, { t: 3.8, type: 'click' }, { t: 4.0, type: 'click' }, { t: 4.2, type: 'click' }, { t: 4.4, type: 'click' }, { t: 4.6, type: 'click' }, { t: 4.8, type: 'click' }, { t: 5.0, type: 'click' },
    { t: 5.3, type: 'tap' }, { t: 5.6, type: 'tap' }, { t: 5.9, type: 'tap' }, { t: 6.6, type: 'swish' }, { t: 7.0, type: 'blink' }, { t: 7.6, type: 'thump' }, { t: 8.2, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [9, 0] });
    const opened = t < 1.0 ? 0 : t < 3.2 ? 1 : Math.min(24, 1 + Math.floor((t - 3.2) / 0.08));  // 3.2〜5.0 で全部
    const eaten = t < 1.4 ? 0 : t < 5.3 ? 1 : Math.min(24, 1 + Math.floor((t - 5.3) / 0.03));
    const away = t >= 2.6 && t < 6.6;
    // ジル（左）：1 を開けて食べる（にこ）→ 2.6 席を外す（左へ）→ 6.6 戻る → 空のカレンダーに驚く → ジト目
    const jh = t >= 2.6 && t < 3.0 ? RIG.hop(t, 2.6, 3.0, 40, -700, { hops: 1, height: 40 }) : t >= 6.6 && t < 7.0 ? RIG.hop(t, 6.6, 7.0, -700, 40, { hops: 1, height: 40 }) : { x: away ? -700 : 40, yOff: 0, squash: 0 };
    const jface = t < 2.6 ? RIG.FACES.smile : t < 7.6 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : RIG.FACES.annoyed;
    const jp = Object.assign({}, away ? RIG.POSES.stand : RIG.POSES.sit, jface, { x: jh.x, y: DESK - 413 * 1.3 + jh.yOff, scale: 1.3, bodySquash: jh.squash, eyeLook: .7, headNod: t > 1.2 && t < 2.2 ? Math.abs(Math.sin(t * 14)) * 6 : 0 });
    L.char('jil', jp, t, '', { vx: t >= 2.6 && t < 3.0 ? -1400 : t >= 6.6 && t < 7.0 ? 1400 : 0 });
    // レン（右）：見ている → ジルがいなくなった瞬間、目がきらっ → 高速で開ける（頭が小刻み）→ 食べる（もぐもぐ）→ 何食わぬ顔（口のまわりに牧草のかけら）
    const rface = t < 2.6 ? RIG.FACES.neutral : t < 3.2 ? RIG.FACES.shy : t < 6.2 ? RIG.FACES.smile : t < 7.6 ? Object.assign({}, RIG.FACES.neutral, { eyeLook: -.6 }) : Object.assign({}, RIG.FACES.shy, { heart: 0 });
    const busy = t >= 3.2 && t < 5.0, eating = t >= 5.3 && t < 6.2;
    const rp = Object.assign({}, busy ? RIG.POSES.lean : RIG.POSES.sit, rface, { x: 540, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: t < 2.6 ? .8 : busy ? .4 : -.6, bodyTilt: busy ? -10 + Math.sin(t * 40) * 3 : 0, headNod: eating ? Math.abs(Math.sin(t * 18)) * 12 : 0, bodySquash: eating ? Math.sin(t * 18) * .12 : 0 });
    L.char('ren', rp, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // カレンダー（机の中央、少し低め）
    fx += ADVENT(540, DESK + 30, opened, eaten);
    if (t > 1.0 && t < 1.4) fx += L.sparkles(290, DESK - 130, t, .9, 4);
    if (busy) fx += L.speed(760, DESK - 100, .35, 18);
    if (t > 5.3 && t < 6.2) fx += L.munch(800, DESK - 150, t, 1.0);
    if (t >= 6.2) fx += WRAPPERS(820, DESK - 10, Math.min(24, Math.floor((t - 5.3) / .04)));
    if (t >= 6.0) fx += `<g fill="#9CB04E" opacity=".95">${[0, 1, 2, 3, 4].map(i => `<circle cx="${905 + Math.cos(i * 1.25) * 42}" cy="${DESK - 235 + Math.sin(i * 1.25) * 18}" r="${6 + (i % 2) * 3}"/>`).join('')}</g>`;   // 口のまわりの牧草のかけら
    if (t > 7.0 && t < 7.6) fx += L.emark(230, DESK - 650, 1.0);
    if (t > 7.6 && t < 8.1) fx += L.impact(905, DESK - 235, seg(t, 7.6, 8.1), .8, '#F2A33A');
    let ui = (t > 1.8 && t < 3.0 ? CHIP(L, 'DEC 1: ADVENT CALENDAR', '12/1。ジルのアドベントカレンダー、1日1個', 1380, seg(t, 1.8, 2.1)) : '')
      + (t > 3.4 && t < 5.2 ? CHIP(L, 'JILL IS AWAY: 2 → 24', 'ジルがいない間に、2から24まで', 1380, seg(t, 3.4, 3.7)) : '')
      + (t > 7.2 && t < 8.6 ? CHIP(L, '24 DAYS. IN ONE DAY.', '24日分、1日で', 1380, seg(t, 7.2, 7.5)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 540, cy: 1150 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1150, d: .9 },
      { t: 3.1, z: 1.25, cx: 620, cy: 1250, d: .4 },                // 高速で開ける
      { t: 6.5, z: 1.05, cx: 540, cy: 1150, d: .4 },
      { t: 7.5, z: 1.3, cx: 760, cy: 1150, d: .5 },                 // 口のまわりの牧草のかけら
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 7.6 && t < 7.7 ? 4 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
