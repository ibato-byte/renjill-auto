// 「Wi-Fiが切れた」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：オンライン会議。画面の中でレンが話している（口パク）→ Wi-Fi の印に×、レンの顔が変な表情で固まる
// ひっくり返し：固まったままの顔を、ジルがスクリーンショット（カシャ）→ オチ：つながった瞬間、レンはにこにこ。ジルの手元には保存した変顔。字幕「スクショ、保存しました」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const WIFI = (x, y, ok, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${[1, 2, 3].map(i => `<path d="M${-i * 26} ${-i * 10} a${i * 36} ${i * 36} 0 0 1 ${i * 52} 0" fill="none" stroke="${ok ? '#5DBB63' : '#B8B2A8'}" stroke-width="9" stroke-linecap="round"/>`).join('')}<circle cy="8" r="9" fill="${ok ? '#5DBB63' : '#B8B2A8'}"/>${ok ? '' : '<path d="M30 -70 L70 -30 M70 -70 L30 -30" stroke="#E8473A" stroke-width="12" stroke-linecap="round"/>'}</g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '2.6-3.4',
  sfx: [{ t: 0.2, type: 'pop' }, { t: 0.8, type: 'pon' }, { t: 1.4, type: 'pon' }, { t: 2.0, type: 'pon' }, { t: 2.6, type: 'click' }, { t: 2.8, type: 'blink' }, { t: 3.6, type: 'twitch' },
    { t: 4.6, type: 'tap' }, { t: 5.2, type: 'click' }, { t: 5.3, type: 'chime' }, { t: 6.4, type: 'pop' }, { t: 7.0, type: 'pon' }, { t: 7.6, type: 'pon' }, { t: 8.2, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const cut = t >= 2.6 && t < 6.4;                    // 切れている間
    const bg = L.office({ sky: 'day', clock: [14, 0] });
    // ジル（左・実物）：聞く → 固まった顔を見てにやり → 5.2 スクショ（カシャ）→ 保存した絵を手元に
    const jface = t < 3.6 ? RIG.FACES.sharp : t < 6.4 ? RIG.FACES.smug : RIG.FACES.smile;
    const jp = Object.assign({}, RIG.POSES.sit, jface, { x: 60, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: .7, blush: t > 3.6 ? .5 : 0 });
    L.char('jil', jp, t, '', {});
    // レン（画面の中）：口パク → 2.6 固まる（変顔：目が片方閉じ、口が「う」）→ 6.4 復帰（にこにこ）
    const talk = Math.floor(t * 6) % 2 === 0;
    let rface = t < 2.6 ? Object.assign({}, talk ? RIG.FACES.smile : RIG.FACES.neutral, { mouth: talk ? 'open' : 'w' }) : cut ? Object.assign({}, RIG.FACES.oops, { eyeOpen: .35, mouth: 'pout', browAngle: 18, sweat: 0 }) : RIG.FACES.smile;
    const rp = Object.assign({}, RIG.POSES.sit, rface, { x: 0, y: 0, scale: 1, headTilt: cut ? 9 : Math.sin(t * 3) * 3 });
    // 画面の中に描くために、レンは一度 svg に描いてから画面の位置へ移す（L.char の後で transform）
    L.char('ren', rp, t, '', { blink: !cut, breathe: !cut, ears: !cut });
    const rs = document.getElementById('ren'); if (rs) rs.style.transform = `translate(${(540 - 270 * .95) + 110}px, ${DESK - 760}px) scale(.95)`;
    // 手前：机・ノートPC（レンの画面枠）・Wi-Fi の印・スクショの紙
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // 画面の枠（レンの周り）：切れている間は少し灰色に
    fx += `<g><rect x="370" y="${DESK - 800}" width="620" height="560" rx="22" fill="none" stroke="#3B4252" stroke-width="22"/><rect x="370" y="${DESK - 800}" width="620" height="560" rx="22" fill="${cut ? 'rgba(120,120,120,.28)' : 'rgba(0,0,0,0)'}" pointer-events="none"/><rect x="400" y="${DESK - 290}" width="560" height="44" rx="10" fill="#3B4252"/><path d="M490 ${DESK - 246} L870 ${DESK - 246} L900 ${DESK - 214} L460 ${DESK - 214}Z" fill="#C9CFD8"/></g>`;
    fx += WIFI(930, DESK - 740, !cut, .9);
    if (cut && t < 3.4) fx += L.emark(680, DESK - 860, 1.0, '!?');
    if (cut) fx += `<g transform="translate(680 ${DESK - 330})">${Array.from({ length: 3 }, (_, i) => `<circle cx="${-40 + i * 40}" cy="0" r="${12 + 6 * Math.max(0, Math.sin(t * 6 - i * 1.2))}" fill="#fff" opacity=".9"/>`).join('')}</g>`;   // つながるのを待つ点々
    // スクショ：5.2 に白いフラッシュ → ジルの手元に紙（固まった顔の小さな絵）
    if (t > 5.2 && t < 5.45) fx += `<rect x="370" y="${DESK - 800}" width="620" height="560" rx="22" fill="#fff" opacity="${1 - seg(t, 5.2, 5.45)}" pointer-events="none"/>`;
    if (t > 5.3) { const k = outBack(seg(t, 5.3, 5.7)); fx += `<g transform="translate(${210} ${DESK - 40}) rotate(-8) scale(${k})"><rect x="-120" y="-150" width="240" height="190" rx="10" fill="#fff" stroke="#D7CCBB" stroke-width="5"/><ellipse cx="0" cy="-70" rx="56" ry="48" fill="#DEC9A8"/><path d="M-28 -78 q8 -10 16 0 M12 -84 L34 -74" stroke="#3A2414" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="0" cy="-48" rx="10" ry="7" fill="#C88D85"/><path d="M-8 -36 q8 6 16 0" stroke="#5A3826" stroke-width="4" fill="none"/><rect x="-100" y="0" width="200" height="12" rx="6" fill="#E2D8C8"/></g>`; }
    if (t > 5.2 && t < 5.6) fx += L.impact(210, DESK - 150, seg(t, 5.2, 5.6), .9, '#F2A33A');
    let ui = (t > 1.8 && t < 3.4 ? CHIP(L, 'ONLINE MEETING', 'オンライン会議。上司は画面の中', 1380, seg(t, 1.8, 2.1)) : '')
      + (t > 5.6 && t < 8.6 ? CHIP(L, 'FROZEN FACE: SAVED', '固まった顔、ジルが保存', 1380, seg(t, 5.6, 5.9)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 560, cy: 1000 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1060, d: .9 },
      { t: 2.6, z: 1.5, cx: 680, cy: 900, d: .4 },                  // 固まった顔に寄る
      { t: 3.6, z: 1.15, cx: 480, cy: 1050, d: .5 },
      { t: 5.1, z: 1.4, cx: 300, cy: 1230, d: .4 },                 // スクショの紙
      { t: 6.4, z: 1.05, cx: 540, cy: 1060, d: .5 },
      { t: 7.6, z: 1.35, cx: 320, cy: 1200, d: .6 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 5.2 && t < 5.3 ? 6 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
