// 「会社にこたつ」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：12月。ジルがオフィスにこたつ（テーブル＋布団）を持ち込む。レンが「？」
// ひっくり返し：レンが入る → 肩まで → 頭まで（耳だけ出ている）→ 動かない。時計が 14:00 → 18:00
// オチ：定時。ジルが布団をめくるとレンは寝ている。字幕「上司、行方不明。発見：こたつ」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
// こたつ：天板＋布団（手前にかかる）。lift=布団をめくる（0〜1）
const KOTATSU = (x, y, lift = 0) => `<g transform="translate(${x} ${y})"><path d="M-260 -60 Q0 -40 260 -60 L300 140 Q0 180 -300 140 Z" fill="#C8463C"/><path d="M-260 -60 Q0 -40 260 -60 L300 140 Q0 180 -300 140 Z" fill="url(#v2desk)" opacity=".0"/>${[0, 1, 2, 3].map(i => `<circle cx="${-180 + i * 120}" cy="60" r="18" fill="#F2D27A" opacity=".9"/>`).join('')}<g transform="translate(0 ${-lift * 120}) rotate(${-lift * 25})"><path d="M-240 -60 Q0 -40 240 -60 L240 -20 Q0 0 -240 -20 Z" fill="#E86C5A"/></g><rect x="-220" y="-100" width="440" height="40" rx="10" fill="#8C5A3C"/><rect x="-210" y="-108" width="420" height="16" rx="6" fill="#A66E4A"/></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '6.6-7.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.0, type: 'thump' }, { t: 1.4, type: 'flop' }, { t: 2.2, type: 'twitch' }, { t: 3.0, type: 'swish' }, { t: 3.6, type: 'swish' }, { t: 4.2, type: 'swish' }, { t: 4.8, type: 'swish' }, { t: 5.3, type: 'swish' }, { t: 5.8, type: 'swish' },
    { t: 6.4, type: 'chime' }, { t: 7.2, type: 'whoosh' }, { t: 7.6, type: 'blink' }, { t: 8.2, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    // 時計 14:00 → 4.6〜6.2 で 18:00（夕方の窓）
    const k = ease(seg(t, 4.6, 6.2));
    const mins = 14 * 60 + Math.round(k * 240);
    const bg = L.office({ sky: t < 5.6 ? 'day' : 'night', clock: [Math.floor(mins / 60), mins % 60] });
    const placed = t >= 1.0;
    const sink = t < 3.0 ? 0 : t < 4.6 ? ease(seg(t, 3.0, 4.6)) : t < 7.2 ? 1 : 1 - outBack(seg(t, 7.2, 7.6));   // レンが沈む（0〜1）→ 7.2 に引き上げられる
    const lift = t >= 7.2 ? outBack(seg(t, 7.2, 7.6)) : 0;            // 布団をめくる
    // ジル（左）：こたつを置く（lean）→ 仕事 → 18:00 布団をめくる → ジト目
    const jface = t < 7.6 ? RIG.FACES.sharp : RIG.FACES.annoyed;
    const jp = Object.assign({}, t < 1.4 || (t >= 7.0 && t < 7.8) ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 20, y: DESK - 413 * 1.3, scale: 1.3, bodyTilt: t < 1.4 || (t >= 7.0 && t < 7.8) ? -10 : 0, eyeLook: .8, headTilt: t >= 7.6 ? -12 : 0 });
    L.char('jil', jp, t, '', {});
    // レン（右・こたつの奥）：？ → 入る → だんだん沈む（y が下がる）→ 寝る → めくられて寝顔のまま
    const rface = t < 2.2 ? RIG.FACES.think : t < 3.0 ? RIG.FACES.shy : t < 4.6 ? RIG.FACES.smile : RIG.FACES.sleepy;
    const rp = Object.assign({}, RIG.POSES.sit, rface, { x: 520, y: DESK - 413 * 1.35 + 85 * sink, scale: 1.35, flip: true, eyeLook: .3, headNod: sink * 14, headTilt: t >= 4.6 ? 10 : 0, bodySquash: -sink * .3 });
    L.char('ren', rp, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // こたつ（1.0 に上から置かれる）。レンの前に置いて、沈むほど隠れる
    if (placed) { const drop = outBack(seg(t, 1.0, 1.4)); fx += KOTATSU(760, DESK - 10 - 500 * (1 - drop), 0); }
    if (t > 1.0 && t < 1.6) fx += L.dust(760, DESK + 20, seg(t, 1.0, 1.6));
    if (t > 1.6 && t < 3.0) fx += L.qmark(900, DESK - 700, 1.0);
    if (t > 3.0 && t < 4.6) fx += L.sparkles(900, DESK - 420, t, .8, 4);          // ぬくぬく
    if (t >= 4.6 && t < 7.2) fx += `<g font-family="Noto Sans CJK JP" font-weight="900" fill="#7C8FC4" opacity=".9">${[0, 1, 2].map(i => { const ph = (t * .5 + i * .33) % 1; return `<text x="${920 + i * 30 + ph * 40}" y="${DESK - 420 - ph * 160}" font-size="${44 + i * 14}" opacity="${(1 - ph).toFixed(2)}">z</text>`; }).join('')}</g>`;
    if (k > 0 && k < 1) fx += L.speed(540, 300, .3, 16);
    if (t > 7.2 && t < 7.7) fx += L.impact(760, DESK - 200, seg(t, 7.2, 7.7), .9, '#F2A33A');
    if (t > 7.6 && t < 8.6) fx += L.emark(230, DESK - 650, 1.0);
    let ui = (t > 1.8 && t < 3.4 ? CHIP(L, 'DEC 1: KOTATSU AT WORK', '12月。ジルが会社にこたつを持ち込んだ', 1380, seg(t, 1.8, 2.1)) : '')
      + (t > 4.8 && t < 6.4 ? CHIP_OFF(L, '14:00 → 18:00', '上司、こたつから出てこない', 1380, seg(t, 4.8, 5.1)) : '')
      + (t > 7.6 && t < 8.6 ? CHIP_OFF(L, 'BOSS: FOUND. ASLEEP.', '上司、発見。寝ていた', 1380, seg(t, 7.6, 7.9)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 540, cy: 1150 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1120, d: .9 },
      { t: 2.9, z: 1.3, cx: 760, cy: 1150, d: .5 },                 // レンが入る
      { t: 4.5, z: 1.0, cx: 540, cy: 1000, d: .5 },                 // 時計
      { t: 7.0, z: 1.3, cx: 700, cy: 1180, d: .4 },                 // めくる
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 1.0 && t < 1.1 ? 5 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
