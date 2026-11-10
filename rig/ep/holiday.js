// 「祝日に出社」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：11/23（勤労感謝の日）朝9時。会社は薄暗く、レンだけが出社して書類を広げている。ジルの机は空っぽ
// ひっくり返し：カレンダーの 23（赤）に気づく → 汗 → オチ：ジルも来た（牧草の束つき）。字幕「ジルも来た。牧草つき」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 総見直し（2026-11-10）：字幕は2回まで。3回目以降（オチの説明）は出さず、絵で見せる
const CAL = (x, y, s = 1, ring = 0) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-90" y="-110" width="180" height="220" rx="12" fill="#fff" stroke="#E2D2BC" stroke-width="5"/><rect x="-90" y="-110" width="180" height="56" rx="12" fill="#E86C5A"/><text x="0" y="-70" text-anchor="middle" font-size="34" font-weight="900" font-family="Noto Sans CJK JP" fill="#fff">11</text><text x="0" y="50" text-anchor="middle" font-size="96" font-weight="900" font-family="Noto Sans CJK JP" fill="#E8473A">23</text>${ring > 0 ? `<circle cx="0" cy="18" r="${70 * ring}" fill="none" stroke="#E8473A" stroke-width="10" opacity="${Math.min(1, ring * 2)}"/>` : ''}</g>`;
const HAYBUNDLE = (x, y, rot, s = 1) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M-120 20 Q-60 -60 0 -70 Q60 -60 120 20 Z" fill="#E6C97E"/>${[0, 1, 2, 3, 4, 5].map(i => `<line x1="${-90 + i * 36}" y1="10" x2="${-80 + i * 36 + Math.sin(i * 2) * 20}" y2="${-70 - Math.cos(i) * 20}" stroke="#C9A24E" stroke-width="7" stroke-linecap="round"/>`).join('')}<rect x="-40" y="-20" width="80" height="24" rx="12" fill="#E86CB0"/></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '4.2-4.9',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.9, type: 'tap' }, { t: 1.5, type: 'tap' }, { t: 2.3, type: 'tap' }, { t: 3.4, type: 'twitch' }, { t: 3.9, type: 'blink' }, { t: 4.2, type: 'thump' }, { t: 4.6, type: 'twitch' },
    { t: 6.4, type: 'pop' }, { t: 6.7, type: 'tap' }, { t: 7.0, type: 'tap' }, { t: 7.3, type: 'tap' }, { t: 7.6, type: 'pon' }, { t: 8.2, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [9, 0] }) + CAL(540, 560, 1, t > 4.2 ? outBack(seg(t, 4.2, 4.6)) : 0);
    const notice = t >= 3.4, found = t >= 4.2, jillIn = t >= 6.4;
    // レン（右）：ひとりで書類仕事（にこにこ、紙をめくる）→ 3.4 まわりを見る → 4.2 カレンダーの 23 を見て汗 → ジルが来てほっ（照れ）
    const rface = !notice ? RIG.FACES.smile : !found ? RIG.FACES.think : t < 7.4 ? Object.assign({}, RIG.FACES.oops, { sweat: 1 }) : RIG.FACES.shy;
    const rp = Object.assign({}, RIG.POSES.sit, rface, { x: 560, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: !notice ? .2 : !found ? -.9 : t < 6.4 ? .6 : -.8, headTilt: notice && !found ? -12 : 0, headNod: !notice ? Math.abs(Math.sin(t * 5)) * 4 : 0 });
    L.char('ren', rp, t, '', {});
    // ジル（左）：6.4 に左からとんとんと入ってきて、7.6 に牧草の束をレンの机に置く
    if (jillIn) {
      const h = RIG.hop(t, 6.4, 7.2, -700, 60, { hops: 3, height: 50 });
      const jp = Object.assign({}, t < 7.2 ? RIG.POSES.stand : RIG.POSES.sit, t < 7.6 ? RIG.FACES.neutral : RIG.FACES.smile, { x: h.x, y: DESK - 413 * 1.3 + h.yOff, scale: 1.3, bodySquash: h.squash, eyeLook: .6 });
      L.char('jil', jp, t, '', { vx: t < 7.2 ? 900 : 0 });
    } else L.char('jil', null, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // レンの机の書類（めくれる）とジルの空の椅子
    fx += L.papers(700, DESK - 10, 5, {}) + `<g transform="translate(${870} ${DESK - 60}) rotate(${Math.sin(t * 5) * 6})"><rect x="-70" y="-90" width="140" height="100" rx="6" fill="#fff" stroke="#D7CCBB" stroke-width="4"/><rect x="-50" y="-70" width="100" height="8" rx="4" fill="#E2D8C8"/><rect x="-50" y="-50" width="80" height="8" rx="4" fill="#E2D8C8"/></g>`;
    if (!jillIn) fx += L.chair(300, DESK - 40, 0) + L.sparkles(300, DESK - 200, t, .7, 3);
    if (notice && !found) fx += L.qmark(900, DESK - 680, 1.0);
    if (found && t < 6.4) fx += L.emark(900, DESK - 680, 1.0);
    if (t > 4.2 && t < 4.7) fx += L.impact(540, 560, seg(t, 4.2, 4.7), 1.1, '#E8473A');
    // 牧草の束：ジルが運ぶ（手元）→ 7.6 レンの机へ
    if (jillIn) { const h = RIG.hop(t, 6.4, 7.2, -700, 60, { hops: 3, height: 50 }); const k = ease(seg(t, 7.2, 7.6)); fx += HAYBUNDLE(h.x + 330 + (760 - (h.x + 330)) * k, DESK - 190 + h.yOff + 100 * k, -10 + 10 * k, 1.0 - .1 * k); }
    if (t > 7.6 && t < 8.1) fx += L.impact(760, DESK - 140, seg(t, 7.6, 8.1), .8, '#F2B544');
    if (t > 7.6) fx += L.sparkles(760, DESK - 200, t, .9, 5);
    let ui = (t > 1.8 && t < 3.4 ? CHIP(L, 'NOV 23: HOLIDAY. 9:00 AM', '祝日の朝9時、上司だけ出社', 1380, seg(t, 1.8, 2.1)) : '')
      + (t > 4.7 && t < 6.2 ? CHIP(L, 'NOBODY IS COMING', 'だれも来ない日だった', 1380, seg(t, 4.7, 5.0)) : '')
      + (t > 7.7 && t < 8.6 ? CHIP_OFF(L, 'JILL CAME ANYWAY', 'ジルも来た。牧草つき', 1380, seg(t, 7.7, 8.0)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.4, cx: 760, cy: 1100 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1080, d: .9 },
      { t: 3.3, z: 1.2, cx: 420, cy: 1150, d: .5 },                 // 空の机
      { t: 4.1, z: 1.5, cx: 540, cy: 760, d: .3 },                  // カレンダー
      { t: 4.8, z: 1.15, cx: 700, cy: 1100, d: .5 },
      { t: 6.3, z: 1.0, cx: 500, cy: 1080, d: .5 },                 // ジルが入ってくる
      { t: 7.6, z: 1.25, cx: 600, cy: 1150, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, dim: t < 6.4 ? .18 : .18 * (1 - seg(t, 6.4, 7.0)), shake: t > 4.2 && t < 4.3 ? 5 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
