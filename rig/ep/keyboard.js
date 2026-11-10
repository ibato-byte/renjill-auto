// 「キーボード」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：ジルが資料をカタカタ。画面に文字がきれいに並ぶ（きりっ）
// ひっくり返し：課長もタイピング……と思ったら、キーボードの上に香箱すわり（あったかい）
// オチ：画面は「あああああ」でいっぱい、ページ数はどんどん増える。課長はそのままお昼寝。字幕「上司のタイピング：座ると速い」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
const DESKFX = (L, DESK) => `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
  + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
const KB = (x, y, w, t, hot) => { let s = `<g transform="translate(${x} ${y})"><rect x="${-w / 2}" y="-18" width="${w}" height="30" rx="8" fill="#D5DAE2" stroke="#9AA3AE" stroke-width="3"/>`;
  for (let i = 0; i < 9; i++) { const on = hot && Math.sin(t * 30 + i * 2.3) > .4; s += `<rect x="${-w / 2 + 10 + i * (w - 20) / 9}" y="${on ? -10 : -13}" width="${(w - 20) / 9 - 6}" height="14" rx="3" fill="${on ? '#B9C1CC' : '#F4F6F9'}"/>`; }
  return s + '</g>'; };
var EP = {
  dur: 9.5,
  bgmHolds: '5.6-6.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.6, type: 'tap' }, { t: 0.8, type: 'tap' }, { t: 1.0, type: 'tap' }, { t: 1.2, type: 'tap' }, { t: 1.4, type: 'tap' }, { t: 1.6, type: 'tap' }, { t: 2.2, type: 'chime' }, { t: 3.0, type: 'blink' },
    { t: 3.7, type: 'boing' }, { t: 4.1, type: 'tap' }, { t: 4.25, type: 'tap' }, { t: 4.4, type: 'tap' }, { t: 4.55, type: 'tap' }, { t: 4.7, type: 'tap' }, { t: 4.85, type: 'tap' }, { t: 5.6, type: 'twitch' }, { t: 6.2, type: 'pon' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400, MX = 540, MY = 1250;                          // まんなかのモニター（下のふち）
    const bg = L.office({ sky: 'day', clock: [14, 0] });
    const type = t > .5 && t < 2.1, sitK = t >= 3.9;
    // ジル（左）：カタカタ（lean・きりっ）→ 満足 → 課長がキーボードに乗って「！」→ ジト目
    const jface = t < 2.2 ? RIG.FACES.sharp : t < 3.6 ? Object.assign({}, RIG.FACES.smile, { sparkle: t < 3.0 ? 1 : 0 }) : t < 5.6 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : RIG.FACES.annoyed;
    L.char('jil', Object.assign({}, type ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 20, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: t > 2.4 ? .9 : .5, bodyTilt: type ? -6 + Math.sin(t * 30) * 2 : 0 }), t, '', {});
    // レン（右）：見ている → やる気（立つ）→ ぴょんとキーボードの上へ（香箱）→ ぬくぬく → お昼寝
    const hop = seg(t, 3.6, 3.9);
    const rface = t < 3.0 ? RIG.FACES.neutral : t < 3.6 ? Object.assign({}, RIG.FACES.smile, { sparkle: 1 }) : t < 5.6 ? Object.assign({}, RIG.FACES.sleepy, { zzz: 0, eyeOpen: .35, blush: .5 }) : Object.assign({}, RIG.FACES.sleepy, { zzz: 1 });
    L.char('ren', Object.assign({}, sitK ? RIG.POSES.loaf : t > 3.0 ? RIG.POSES.stand : RIG.POSES.sit, rface, { x: 560 + 40 * ease(hop), y: DESK - 413 * 1.35 - Math.sin(hop * Math.PI) * 90, scale: 1.35, flip: true, eyeLook: -.4 }), t, '', {});
    let fx = DESKFX(L, DESK);
    // まんなかのモニター（2人の顔のあいだ）
    const nJ = Math.floor(seg(t, .5, 2.1) * 6), nA = sitK ? Math.min(9, Math.floor((t - 3.9) * 8)) : 0, pages = sitK ? Math.floor(1 + (t - 3.9) ** 2.2 * 40) : 1;
    fx += `<g><rect x="${MX - 6}" y="${MY}" width="12" height="${DESK - MY}" fill="#7A818C"/><rect x="${MX - 60}" y="${DESK - 12}" width="120" height="14" rx="6" fill="#7A818C"/>`
      + `<rect x="${MX - 140}" y="${MY - 280}" width="280" height="280" rx="14" fill="#3B4252"/><rect x="${MX - 128}" y="${MY - 268}" width="256" height="256" rx="6" fill="#F4F7FB"/>`;
    for (let i = 0; i < 9; i++) {
      const y = MY - 240 + i * 26;
      if (nA > i) fx += `<text x="${MX - 116}" y="${y + 10}" font-family="Noto Sans CJK JP" font-weight="900" font-size="22" fill="#E8473A">ああああああああああ</text>`;
      else if (!nA && i < nJ) fx += `<rect x="${MX - 116}" y="${y - 6}" width="${i % 3 === 2 ? 120 : 220}" height="10" rx="5" fill="#9FB4C6"/>`;
    }
    fx += `<text x="${MX + 116}" y="${MY - 24}" text-anchor="end" font-family="Noto Sans" font-weight="900" font-size="22" fill="${pages > 1 ? '#E8473A' : '#8C97A6'}">p.${pages}</text></g>`;
    // キーボード：ジルの手もと／課長のはおしりの下
    fx += KB(330, DESK - 8, 300, t, type) + KB(880, DESK - 8, 300, t, sitK && t < 7.6);
    if (t > 4.2 && t < 5.6) fx += `<text x="${MX}" y="${MY - 330}" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="64" fill="#E8473A" stroke="#FFF7E8" stroke-width="10" paint-order="stroke" transform="rotate(${Math.sin(t * 9) * 5} ${MX} ${MY - 330})">カタカタカタ</text>`;
    if (t > 7.2 && t < 8.6) fx += L.emark(220, DESK - 660, 1.0, '…');
    let ui = (t > 0.8 && t < 2.6 ? CHIP(L, 'FAST TYPING', 'ジル、資料をカタカタ', 1650, seg(t, .8, 1.1)) : '')
      + (t > 6.0 && t < 8.6 ? CHIP_OFF(L, 'BOSS TYPES BY SITTING', '上司のタイピング：座ると速い', 1650, seg(t, 6.0, 6.3)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 380, cy: 1150 },
      { t: 0.01, z: 1.1, cx: 440, cy: 1120, d: .9 },
      { t: 3.0, z: 1.15, cx: 720, cy: 1120, d: .5 },                 // 課長の番
      { t: 5.6, z: 1.0, cx: 560, cy: 1080, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
