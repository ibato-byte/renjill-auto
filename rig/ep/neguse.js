// 「寝ぐせ」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：朝。ジルの頭に寝ぐせが1本。くしでさっと直す（きりっ）
// ひっくり返し：課長もブラシで毛並みを整える……ブラシをかけるほど、毛がふくらんでいく
// オチ：課長はまんまるの毛玉に（ご満悦）。字幕「上司の寝ぐせ直し：ふくらむ」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
const DESKFX = (L, DESK) => `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
  + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
const COMB = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-60" y="-12" width="120" height="22" rx="6" fill="#E9A23B"/>${Array.from({ length: 10 }, (_, i) => `<rect x="${-56 + i * 12}" y="8" width="6" height="22" rx="2" fill="#E9A23B"/>`).join('')}</g>`;
const BRUSH = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-90" y="-10" width="110" height="20" rx="10" fill="#9C7448"/><rect x="10" y="-30" width="80" height="60" rx="18" fill="#C79A6C"/>${Array.from({ length: 5 }, (_, i) => `<rect x="${16 + i * 15}" y="28" width="6" height="16" rx="2" fill="#5E4A3A"/>`).join('')}</g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '5.6-6.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.8, type: 'swish' }, { t: 1.2, type: 'swish' }, { t: 1.9, type: 'chime' }, { t: 3.0, type: 'blink' }, { t: 3.6, type: 'swish' }, { t: 4.1, type: 'swish' },
    { t: 4.6, type: 'swish' }, { t: 5.1, type: 'swish' }, { t: 5.7, type: 'pon' }, { t: 7.0, type: 'twitch' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400, JN = [263, 1165], RN = [858, 1156];
    const bg = L.office({ sky: 'day', clock: [8, 45] });
    // ジル（左）：寝ぐせ → くしで直す（きりっ）→ 満足 → ふくらむ課長に「！」→ ジト目
    const fix = seg(t, .8, 1.6);
    const jface = t < 1.8 ? RIG.FACES.sharp : t < 3.4 ? Object.assign({}, RIG.FACES.smile, { sparkle: t < 2.8 ? 1 : 0 }) : t < 5.8 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : RIG.FACES.annoyed;
    L.char('jil', Object.assign({}, RIG.POSES.sit, jface, { x: 20, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: t > 3.0 ? .9 : .2 }), t, '', {});
    // レン（右）：見ている → ブラシ（きりっ）→ ブラシのたびにふくらむ → まんまるでご満悦
    const puff = ease(seg(t, 3.5, 5.6)), brushing = t > 3.4 && t < 5.6;
    const rface = t < 3.0 ? RIG.FACES.neutral : t < 3.4 ? Object.assign({}, RIG.FACES.smile, { sparkle: 1 }) : brushing ? RIG.FACES.sharp : Object.assign({}, RIG.FACES.smug, { sparkle: t < 7.2 ? 1 : 0 });
    L.char('ren', Object.assign({}, RIG.POSES.sit, rface, { x: 560, y: DESK - 413 * 1.35 - 30 * puff, scale: 1.35, flip: true, eyeLook: -.3, headTilt: brushing ? Math.sin(t * 8) * 5 : 0 }), t, '', {});
    // ふわふわの毛（課長のうしろ＝顔にはかからない）：ブラシをかけるほど大きく
    let back = '';
    if (puff > 0) { const R = 120 + 260 * puff; back = `<g opacity="${Math.min(1, puff * 2)}">` + Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2 + Math.sin(t * 2) * .03; return `<circle cx="${RN[0] + Math.cos(a) * R * .78}" cy="${RN[1] + 40 + Math.sin(a) * R * .72}" r="${R * .34}" fill="${i % 2 ? '#E9D6BC' : '#F2E3CC'}"/>`; }).join('') + `<circle cx="${RN[0]}" cy="${RN[1] + 40}" r="${R * .8}" fill="#F2E3CC"/></g>`; }
    let fx = DESKFX(L, DESK);
    // ジルの寝ぐせ（頭の上・1本）→ くしで消える
    if (fix < 1) fx += `<path d="M${JN[0] + 10} ${JN[1] - 205} q30 -60 0 -90 q-24 -20 -10 -40" stroke="#B98A5E" stroke-width="12" fill="none" stroke-linecap="round" opacity="${1 - fix}"/>`;
    if (t > .6 && t < 1.8) fx += COMB(JN[0] + 30 + Math.sin(t * 10) * 30, JN[1] - 250, -10);
    // 課長のブラシ（頭の横を行ったり来たり、顔にはかからない）
    if (brushing) fx += BRUSH(RN[0] + 210 + Math.sin(t * 9) * 20, RN[1] - 120 + Math.sin(t * 9) * 60, -30);
    if (brushing) fx += [0, 1, 2].map(i => `<path d="M${RN[0] + 300 + i * 20} ${RN[1] - 60 + i * 50} q20 -10 40 0" stroke="#8C7B66" stroke-width="6" fill="none" stroke-linecap="round" opacity="${.4 + .3 * Math.sin(t * 9 + i)}"/>`).join('');
    if (t > 5.7 && t < 7.0) fx += L.sparkles(RN[0], RN[1] - 60, t, 2.2, 8);
    if (t > 7.0 && t < 8.6) fx += L.emark(220, DESK - 660, 1.0, '…');
    let ui = (t > 0.8 && t < 2.6 ? CHIP(L, 'BEDHEAD', 'ジル、寝ぐせをさっと', 1650, seg(t, .8, 1.1)) : '')
      + (t > 6.0 && t < 8.6 ? CHIP_OFF(L, 'BOSS BRUSHES: MORE FLUFF', '上司の寝ぐせ直し：ふくらむ', 1650, seg(t, 6.0, 6.3)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 340, cy: 1080 },
      { t: 0.01, z: 1.15, cx: 380, cy: 1080, d: .9 },
      { t: 3.0, z: 1.1, cx: 720, cy: 1100, d: .5 },                 // 課長の番
      { t: 5.7, z: .95, cx: 580, cy: 1080, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; back = ''; }
    L.mount({ bg, back, fx, ui, cam, t, shake: 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
