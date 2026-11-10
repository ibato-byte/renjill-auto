// 「クリスマスリース」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：ジルが机のスタンドに、緑のリース（赤いリボンつき）を飾る（きらきら）。ジルは仕事に戻る（画面を見る）
// ひっくり返し：レンが横からひと口 → もうひと口 → 葉がどんどん減る（もぐもぐ）
// オチ：ジルが見ると、残っているのは赤いリボンだけ。レンの口のまわりに緑のかけら。字幕「リース：完食。残り：リボン」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
// リース（中心 x,y）。eaten=食べられた割合（右側＝レン側から減る）
const WREATH = (x, y, eaten) => { const N = 28; let s = `<g transform="translate(${x} ${y})"><line x1="0" y1="110" x2="0" y2="240" stroke="#8C5A3C" stroke-width="12"/><rect x="-70" y="232" width="140" height="18" rx="8" fill="#8C5A3C"/>`;
  for (let i = 0; i < N; i++) { const a = -Math.PI / 2 + (i / N) * Math.PI * 2; const order = (Math.cos(a) + 1) / 2;   // 右側ほど先に食べられる
    if (eaten > 0 && order >= 1 - eaten) continue; const r = 100 + (i % 2) * 10; s += `<ellipse cx="${Math.cos(a) * r}" cy="${Math.sin(a) * r}" rx="34" ry="18" fill="${i % 3 ? '#4F9A5A' : '#3E7F48'}" transform="rotate(${a * 180 / Math.PI + 90} ${Math.cos(a) * r} ${Math.sin(a) * r})"/>`;
    if (i % 4 === 0) s += `<circle cx="${Math.cos(a) * (r - 18)}" cy="${Math.sin(a) * (r - 18)}" r="10" fill="#E8473A"/>`; }
  s += `<path d="M0 104 l-50 -26 l0 52 Z M0 104 l50 -26 l0 52 Z" fill="#E8473A" stroke="#B8302A" stroke-width="4"/><circle cx="0" cy="104" r="14" fill="#B8302A"/><path d="M-8 114 l-22 60 M8 114 l22 60" stroke="#E8473A" stroke-width="14" stroke-linecap="round"/></g>`; return s; };
var EP = {
  dur: 9.5,
  bgmHolds: '5.6-6.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.0, type: 'tap' }, { t: 1.4, type: 'chime' }, { t: 2.6, type: 'tap' }, { t: 3.0, type: 'tap' }, { t: 3.4, type: 'tap' }, { t: 3.8, type: 'tap' }, { t: 4.2, type: 'tap' }, { t: 4.6, type: 'tap' },
    { t: 5.6, type: 'blink' }, { t: 6.1, type: 'twitch' }, { t: 7.2, type: 'pon' }, { t: 8.2, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400, WX = 600, WY = DESK - 250;
    const bg = L.office({ sky: 'day', clock: [13, 0] });
    const eaten = Math.min(1, Math.max(0, (t - 2.5) / 2.6));                // 2.5〜5.1 で全部
    const munching = t >= 2.5 && t < 5.3;
    // ジル（左）：飾る（lean）→ 満足（にこ）→ 仕事（画面を見る・少しうつむく）→ 5.6 顔を上げて固まる → ジト目
    const working = t >= 2.0 && t < 5.5;
    const jface = t < 2.0 ? RIG.FACES.smile : t < 5.5 ? RIG.FACES.sharp : t < 6.1 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : RIG.FACES.annoyed;
    const jp = Object.assign({}, t > 0.8 && t < 1.4 ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 40, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: working ? 0 : .8, headNod: working ? 14 : 0, bodyTilt: t > 0.8 && t < 1.4 ? -12 : 0 });
    L.char('jil', jp, t, '', {});
    // レン（右）：リースを見て目がきらっ → 横からかじる（lean・もぐもぐ）→ 何食わぬ顔（目をそらす）→ ご満悦
    const rface = t < 2.2 ? RIG.FACES.neutral : t < 2.5 ? Object.assign({}, RIG.FACES.smile, { sparkle: 1 }) : t < 5.3 ? RIG.FACES.smile : t < 7.2 ? Object.assign({}, RIG.FACES.neutral, { eyeLook: -.6 }) : RIG.FACES.smug;
    const rp = Object.assign({}, munching ? RIG.POSES.lean : RIG.POSES.sit, rface, { x: 540, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: munching ? .5 : t < 7.2 ? -.6 : .4, bodyTilt: munching ? -14 : 0, headNod: munching ? Math.abs(Math.sin(t * 16)) * 10 : 0 });
    L.char('ren', rp, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // ジルの画面（仕事）
    fx += `<g transform="translate(250 ${DESK - 4})"><path d="M-130 0 L130 0 L146 18 L-146 18Z" fill="#C9CFD8"/><rect x="-120" y="-150" width="240" height="150" rx="10" fill="#3B4252"/><rect x="-108" y="-138" width="216" height="126" rx="6" fill="#DCE9F5"/></g>`;
    // リース（0.8〜1.4 でスタンドに置く）
    const put = t < 1.4 ? outBack(seg(t, .8, 1.4)) : 1;
    fx += `<g transform="translate(${WX} ${WY}) scale(${put}) translate(${-WX} ${-WY})">${WREATH(WX, WY, eaten)}</g>`;
    if (t > 1.4 && t < 2.0) fx += L.sparkles(WX, WY, t, 1.0, 6);
    if (munching) fx += L.munch(800, DESK - 260, t, .9);
    // 口のまわりの緑のかけら
    if (t >= 5.0) fx += `<g fill="#4F9A5A">${[0, 1, 2, 3].map(i => `<ellipse cx="${800 + Math.cos(i * 1.6) * 40}" cy="${DESK - 240 + Math.sin(i * 1.6) * 16}" rx="9" ry="5" transform="rotate(${i * 40} ${800 + Math.cos(i * 1.6) * 40} ${DESK - 240 + Math.sin(i * 1.6) * 16})"/>`).join('')}</g>`;
    if (t > 6.1 && t < 7.2) fx += L.emark(230, DESK - 650, 1.0, '…');
    if (t > 7.2 && t < 7.7) fx += L.impact(WX, WY + 100, seg(t, 7.2, 7.7), .7, '#E8473A');
    let ui = (t > 1.4 && t < 2.8 ? CHIP(L, 'CHRISTMAS WREATH', 'ジルが飾った、クリスマスリース', 1580, seg(t, 1.4, 1.7)) : '')
      + (t > 3.4 && t < 5.2 ? CHIP_OFF(L, 'MADE OF GREENS', 'リースは、緑の葉っぱ製', 1580, seg(t, 3.4, 3.7)) : '')
      + (t > 6.4 && t < 8.6 ? CHIP_OFF(L, 'LEFT: THE RIBBON', 'リース：完食。残り：リボン', 1580, seg(t, 6.4, 6.7)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 540, cy: 1150 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1150, d: .9 },
      { t: 2.4, z: 1.3, cx: 720, cy: 1150, d: .5 },                 // かじる
      { t: 5.4, z: 1.05, cx: 540, cy: 1150, d: .4 },                // ジルが見る
      { t: 7.1, z: 1.35, cx: 650, cy: 1180, d: .5 },                // リボンだけ
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
