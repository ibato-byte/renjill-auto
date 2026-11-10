// 「シュレッダーの紙くず」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：年末の書類整理。ジルが書類をシュレッダーへ（束が減る・紙くずがごみ箱にたまる）
// ひっくり返し：紙くずが山盛り → レンの目がきらっ → ごみ箱に飛び込む（ぽすっ）
// オチ：紙くずの巣でレンがすやすや（顔だけ出して zzz）。ジルは手を止めてジト目 → でもそっと書類を追加（♥）。字幕「紙くず：上司の巣」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 総見直し（2026-11-10）：字幕は2回まで。3回目以降（オチの説明）は出さず、絵で見せる
// 紙くず（細長い紙）を n 本、中心 x,y・幅 w の範囲に
const STRIPS = (x, y, w, n, t, wob = 0) => { let s = ''; for (let i = 0; i < n; i++) { const u = (i * .618) % 1, v = (i * .382) % 1; const px = x - w / 2 + u * w, py = y - v * 60 + Math.sin(t * 6 + i) * wob; s += `<rect x="${px}" y="${py}" width="8" height="${40 + (i % 4) * 8}" rx="3" fill="${i % 3 ? '#fff' : '#F2EEE6'}" stroke="#D7CCBB" stroke-width="2" transform="rotate(${(i * 47) % 90 - 45} ${px} ${py})"/>`; } return s; };
const SHREDDER = (x, y, on) => `<g transform="translate(${x} ${y})"><rect x="-110" y="-120" width="220" height="120" rx="14" fill="#5A6578" stroke="#3B4252" stroke-width="5"/><rect x="-80" y="-128" width="160" height="14" rx="5" fill="#2A303B"/><circle cx="80" cy="-60" r="10" fill="${on ? '#5DBB63' : '#9AA3B0'}"/></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '5.7-6.3',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.0, type: 'swish' }, { t: 1.4, type: 'whoosh' }, { t: 2.0, type: 'whoosh' }, { t: 2.6, type: 'whoosh' }, { t: 3.2, type: 'whoosh' }, { t: 3.8, type: 'whoosh' }, { t: 4.3, type: 'twitch' },
    { t: 4.7, type: 'boing' }, { t: 5.1, type: 'flop' }, { t: 5.7, type: 'blink' }, { t: 7.0, type: 'swish' }, { t: 7.6, type: 'pon' }, { t: 8.2, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [16, 0] });
    const shredding = t >= 1.2 && t < 4.3;
    const fill = Math.min(1, Math.max(0, (t - 1.2) / 3.1));                 // ごみ箱の紙くず
    const inBin = t >= 5.1;
    // ジル（左）：書類を入れる（lean・小さく頭が上下）→ 飛び込みに驚く → ジト目 → 書類をそっと足す（にこ・♥）
    const jface = t < 4.6 ? RIG.FACES.sharp : t < 5.7 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : t < 7.0 ? RIG.FACES.annoyed : RIG.FACES.shy;
    const jp = Object.assign({}, shredding || (t >= 7.0 && t < 7.6) ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 40, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: .8, bodyTilt: shredding ? -12 : 0, headNod: shredding ? Math.abs(Math.sin(t * 10)) * 6 : 0 });
    L.char('jil', jp, t, '', {});
    // レン（右）：見ている → 紙くずに目がきらっ（4.3）→ 4.7 ジャンプ → 5.1 ごみ箱の中へ（下へ沈む）→ すやすや
    const h = t >= 4.7 && t < 5.1 ? RIG.hop(t, 4.7, 5.1, 540, 540, { hops: 1, height: 160 }) : { x: 540, yOff: 0, squash: 0 };
    const sink = 70 * ease(seg(t, 4.9, 5.35));                                 // 着地しながら箱の中へ沈む（瞬間移動しない）
    const rface = t < 4.3 ? RIG.FACES.neutral : t < 5.1 ? Object.assign({}, RIG.FACES.smile, { sparkle: 1 }) : t < 5.6 ? RIG.FACES.smile : RIG.FACES.sleepy;
    const rp = Object.assign({}, inBin ? RIG.POSES.loaf : RIG.POSES.sit, rface, { x: h.x, y: DESK - 413 * 1.35 + h.yOff + sink, scale: 1.35, flip: true, eyeLook: t < 4.3 ? .6 : .2, bodySquash: h.squash + (inBin ? Math.sin(t * 2.4) * .04 : 0) });
    L.char('ren', rp, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // 書類の束（ジルの手元）：入れるたびに減る
    const left = Math.max(0, 14 - Math.floor(fill * 14) + (t >= 7.4 ? 3 : 0));
    fx += L.papers(250, DESK - 4, left);
    // シュレッダー（机の中央）と、入っていく紙
    fx += SHREDDER(560, DESK + 6, shredding);
    if (shredding) { const u = ((t - 1.2) % .6) / .6; fx += `<rect x="${520}" y="${DESK - 210 + u * 90}" width="80" height="${100 * (1 - u)}" fill="#fff" stroke="#D7CCBB" stroke-width="3"/>`; fx += STRIPS(700, DESK - 30, 120, 6, t, 10); }
    // ごみ箱（レンの前）：中の紙くずが増える → レンが入ると周りにあふれる。レンの顔より下に置く
    const BX = 840, BT = 1330;
    fx += `<g pointer-events="none">${inBin ? STRIPS(BX - 175, BT + 5, 110, 14, t, 2) + STRIPS(BX + 175, BT + 5, 110, 14, t, 2) + (t > 5.35 ? STRIPS(830, 1040, 150, 5, t, 1) : '') : STRIPS(BX, BT + 10 - fill * 50, 300, Math.round(10 + fill * 40), t)}<path d="M${BX - 170} ${BT} L${BX + 170} ${BT} L${BX + 140} ${DESK + 6} L${BX - 140} ${DESK + 6} Z" fill="#8FA7C2" stroke="#5A7FA8" stroke-width="6"/><path d="M${BX - 120} ${BT + 20} v40 M${BX - 40} ${BT + 20} v40 M${BX + 40} ${BT + 20} v40 M${BX + 120} ${BT + 20} v40" stroke="#5A7FA8" stroke-width="5" opacity=".5"/></g>`;
    if (t > 4.3 && t < 4.7) fx += L.sparkles(837, 1100, t, 1.0, 5);
    if (t > 5.1 && t < 5.5) fx += L.impact(BX, BT - 40, seg(t, 5.1, 5.5), .9, '#fff');
    if (t > 5.7 && t < 7.0) fx += L.emark(230, DESK - 650, 1.0, '…');
    let ui = (t > 1.6 && t < 3.0 ? CHIP(L, 'YEAR-END SHREDDING', '年末の書類を、シュレッダーへ', 1580, seg(t, 1.6, 1.9)) : '')
      + (t > 5.4 && t < 6.8 ? CHIP(L, 'BOSS: IN THE BIN', '上司、ごみ箱の中', 1580, seg(t, 5.4, 5.7)) : '')
      + (t > 7.4 && t < 8.6 ? CHIP_OFF(L, 'PAPER = BOSS NEST', '紙くず：上司の巣', 1580, seg(t, 7.4, 7.7)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 540, cy: 1150 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1150, d: .9 },
      { t: 2.4, z: 1.2, cx: 700, cy: 1250, d: .5 },                 // ごみ箱がいっぱいに
      { t: 4.6, z: 1.05, cx: 600, cy: 1150, d: .3 },                // 飛び込み
      { t: 5.6, z: 1.4, cx: 820, cy: 1280, d: .5 },                 // 巣ですやすや
      { t: 6.9, z: 1.1, cx: 560, cy: 1200, d: .5 },                 // ジルが書類を足す
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 5.1 && t < 5.2 ? 5 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
