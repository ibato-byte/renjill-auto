// 「年賀状の写真」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：年賀状用の写真。ジルがカメラをセット（三脚）。タイマー 3・2・1
// ひっくり返し：フラッシュのたびにレンが目をつぶる（1回目・2回目）→ ジルがだんだんジト目
// オチ：3回目、ジルがレンの目を指で開けたまま撮影。できた写真：ジルは完璧、レンは白目気味の変顔。字幕「3回目：目を開けたまま固定」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
const CAMERA = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><line x1="0" y1="40" x2="-70" y2="260" stroke="#3B4252" stroke-width="10" stroke-linecap="round"/><line x1="0" y1="40" x2="70" y2="260" stroke="#3B4252" stroke-width="10" stroke-linecap="round"/><line x1="0" y1="40" x2="0" y2="270" stroke="#3B4252" stroke-width="10" stroke-linecap="round"/><rect x="-80" y="-50" width="160" height="100" rx="18" fill="#3B4252"/><circle r="34" fill="#1F2630" stroke="#C9CFD8" stroke-width="6"/><circle r="14" fill="#5A6B8C"/><rect x="40" y="-70" width="34" height="24" rx="6" fill="#C9CFD8"/></g>`;
const COUNT = (x, y, n) => `<g transform="translate(${x} ${y})"><circle r="60" fill="#fff" stroke="#5A3A1E" stroke-width="8"/><text y="22" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="60" fill="#5A3A1E">${n}</text></g>`;
// できた写真（ジルは完璧・レンは…）
const PHOTO = (x, y, k, renEyes) => k <= 0 ? '' : `<g transform="translate(${x} ${y}) rotate(-6) scale(${k})"><rect x="-200" y="-150" width="400" height="300" rx="10" fill="#fff" stroke="#D7CCBB" stroke-width="6"/><rect x="-180" y="-130" width="360" height="220" fill="#F4ECE0"/><ellipse cx="-80" cy="-10" rx="62" ry="54" fill="#DEC9A8"/><ellipse cx="90" cy="-10" rx="70" ry="60" fill="#D9B48C"/><circle cx="-100" cy="-20" r="7" fill="#3A2414"/><circle cx="-60" cy="-20" r="7" fill="#3A2414"/><path d="M-90 8 q10 8 20 0" stroke="#5A3826" stroke-width="4" fill="none"/>${renEyes}<rect x="-160" y="110" width="320" height="12" rx="6" fill="#E2D8C8"/></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '5.6-6.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.0, type: 'tap' }, { t: 1.6, type: 'click' }, { t: 2.0, type: 'click' }, { t: 2.4, type: 'click' }, { t: 2.8, type: 'chime' }, { t: 3.2, type: 'blink' }, { t: 3.8, type: 'click' }, { t: 4.2, type: 'click' }, { t: 4.6, type: 'click' }, { t: 5.0, type: 'chime' }, { t: 5.4, type: 'blink' },
    { t: 6.0, type: 'twitch' }, { t: 6.6, type: 'click' }, { t: 7.0, type: 'click' }, { t: 7.4, type: 'click' }, { t: 7.8, type: 'chime' }, { t: 8.3, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [13, 0] });
    // 3 回の撮影：カウント 1.6/2.0/2.4 → フラッシュ 2.8 ／ 3.8/4.2/4.6 → 5.0 ／ 6.6/7.0/7.4 → 7.8
    const takes = [[1.6, 2.8], [3.8, 5.0], [6.6, 7.8]];
    const take = takes.findIndex(([a, f]) => t >= a && t < f + .4);
    const flash = takes.some(([a, f]) => t >= f && t < f + .18);
    const counting = takes.find(([a, f]) => t >= a && t < f);
    const held = t >= 6.2;                                    // 3回目：ジルが目を開けたまま固定
    // レン（右）：ポーズ（にこ）→ フラッシュの瞬間に目をぎゅっ（1・2回目）→ 3回目は目を開けさせられて変顔
    const closedAt = takes.slice(0, 2).some(([a, f]) => t >= f - .1 && t < f + .9);
    const rface = held ? Object.assign({}, RIG.FACES.surprised, { excl: 0, mouth: 'w', browAngle: 18 }) : closedAt ? Object.assign({}, RIG.FACES.smile, { eyeOpen: .05 }) : RIG.FACES.smile;
    const rp = Object.assign({}, RIG.POSES.sit, rface, { x: 520, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: 0, headTilt: held ? 8 : 0, bodySquash: counting ? -.05 : 0 });
    L.char('ren', rp, t, '', {});
    // ジル（左）：完璧な笑顔 → 2回失敗でジト目 → 3回目は横から手を伸ばす（lean）
    const jface = t < 3.2 ? RIG.FACES.smile : t < 6.2 ? RIG.FACES.annoyed : RIG.FACES.smile;
    const jp = Object.assign({}, held ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 60, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: held ? .9 : 0, bodyTilt: held ? -14 : 0 });
    L.char('jil', jp, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // カメラ（手前・中央下）
    fx += CAMERA(540, DESK + 120, 1.0);
    if (counting) { const n = 3 - Math.floor((t - counting[0]) / 0.4); fx += COUNT(540, 760, Math.max(1, Math.min(3, n))); }
    // 3回目：ジルの指がレンの目を開ける（レンの顔の横に手）
    if (held && t < 7.9) fx += `<g transform="translate(${760} ${DESK - 330}) rotate(20)"><ellipse rx="26" ry="18" fill="#D9B48C" stroke="#B88A5C" stroke-width="4"/><circle cx="-16" cy="-14" r="8" fill="#D9B48C" stroke="#B88A5C" stroke-width="4"/><circle cx="0" cy="-20" r="8" fill="#D9B48C" stroke="#B88A5C" stroke-width="4"/><circle cx="16" cy="-14" r="8" fill="#D9B48C" stroke="#B88A5C" stroke-width="4"/></g>`;
    if (flash) fx += `<rect x="-500" y="-500" width="2080" height="3000" fill="#fff" opacity=".85" pointer-events="none"/>`;
    // できた写真（7.9〜）：レンは目を見開いた変顔
    const pk = t >= 7.9 ? outBack(seg(t, 7.9, 8.3)) : 0;
    fx += PHOTO(540, DESK - 380, pk, `<circle cx="70" cy="-24" r="14" fill="#fff" stroke="#3A2414" stroke-width="3"/><circle cx="112" cy="-24" r="14" fill="#fff" stroke="#3A2414" stroke-width="3"/><circle cx="74" cy="-22" r="5" fill="#3A2414"/><circle cx="108" cy="-22" r="5" fill="#3A2414"/><path d="M80 14 q10 -6 20 0" stroke="#5A3826" stroke-width="4" fill="none"/>`);
    if (t > 3.2 && t < 3.8) fx += L.emark(230, DESK - 650, 1.0, '…');
    if (t > 5.4 && t < 6.2) fx += L.emark(230, DESK - 650, 1.0, '…');
    let ui = (t > 1.8 && t < 3.0 ? CHIP(L, 'NEW YEAR CARD PHOTO', '年賀状の写真。3・2・1', 1380, seg(t, 1.8, 2.1)) : '')
      + (t > 5.2 && t < 6.4 ? CHIP_OFF(L, 'TAKE 2: EYES CLOSED', '2回目も、目をつぶった', 1380, seg(t, 5.2, 5.5)) : '')
      + (t > 7.9 && t < 8.6 ? CHIP_OFF(L, 'TAKE 3: EYES HELD OPEN', '3回目：目を開けたまま固定', 1380, seg(t, 7.9, 8.2)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 540, cy: 1100 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1050, d: .9 },
      { t: 2.7, z: 1.3, cx: 760, cy: 1050, d: .3 },                 // フラッシュのレン
      { t: 3.6, z: 1.05, cx: 540, cy: 1050, d: .4 },
      { t: 6.1, z: 1.25, cx: 640, cy: 1060, d: .4 },                // 指で固定
      { t: 7.9, z: 1.2, cx: 540, cy: 1000, d: .4 },                 // 写真
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: flash ? 3 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
