// 「年賀状の仕分け」nenga2（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js（nengajo＝年賀状100枚 とは別の回）
// 状況：1月6日。ジルが届いた年賀状を「ジルあて」「課長あて」に仕分ける。課長あてがどんどん高くなる
// ひっくり返し：課長はご満悦（人気者？）→ ジルが1枚めくると差出人「課長」→ もう1枚も「課長」
// オチ：課長はあせあせ。ジルはジト目。字幕「差出人：ぜんぶ本人」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
// 小さな年賀状（中心 x,y・回転 r）
const CARD = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-44" y="-62" width="88" height="124" rx="6" fill="#FFFDF7" stroke="#CFC3B0" stroke-width="3"/><circle cx="0" cy="-14" r="20" fill="#E8473A"/><text y="-6" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="24" fill="#FFF7E8">賀</text><rect x="-26" y="22" width="52" height="6" rx="3" fill="#CFC3B0"/><rect x="-20" y="36" width="40" height="6" rx="3" fill="#CFC3B0"/></g>`;
// 大きく見せる年賀状（めくり f：0=表、1=裏）
const BIG = (x, y, s, f, from) => { const c = Math.cos(f * Math.PI), back = c < 0;
  return `<g transform="translate(${x} ${y}) scale(${(s * Math.abs(c)).toFixed(3)} ${s})" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-150" y="-210" width="300" height="420" rx="14" fill="#FFFDF7" stroke="#CFC3B0" stroke-width="6"/>`
    + (back ? `<text y="-120" font-size="38" fill="#8C7B66">差出人</text><text y="20" font-size="104" fill="#E8473A">課長</text><text y="140" font-size="34" fill="#8C7B66">あけおめ</text>`
      : `<text y="-120" font-size="38" fill="#8C7B66">あて先</text><text y="20" font-size="104" fill="#3A2414">課長</text><circle cx="0" cy="130" r="40" fill="#E8473A"/><text y="146" font-size="44" fill="#FFF7E8">賀</text>`)
    + (from > 1 ? `<text x="110" y="-160" font-size="40" fill="#C9483C">${from}枚目</text>` : '') + `</g>`; };
var EP = {
  dur: 9.5,
  bgmHolds: '5.6-6.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.7, type: 'tap' }, { t: 1.1, type: 'tap' }, { t: 1.5, type: 'tap' }, { t: 1.9, type: 'tap' }, { t: 2.3, type: 'tap' }, { t: 2.7, type: 'tap' }, { t: 3.2, type: 'chime' },
    { t: 4.6, type: 'swish' }, { t: 5.2, type: 'blink' }, { t: 5.8, type: 'swish' }, { t: 6.4, type: 'twitch' }, { t: 7.4, type: 'blink' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400, JX = 220, KX = 640;                  // 仕分けの山（ジルあて・課長あて）
    const bg = L.office({ sky: 'day', clock: [9, 30] });
    // 仕分け：0.6 から 0.4 秒ごとに1枚（ジルあて 1 枚、あとは全部課長あて）
    const N = 6, dealt = Math.max(0, Math.min(N, Math.floor((t - .6) / .4) + 1));
    const toJ = i => i === 2;
    const nJ = Array.from({ length: dealt }, (_, i) => toJ(i)).filter(Boolean).length, nK = dealt - nJ;
    const kStack = nK * 3 + (t > 3.0 ? 14 : 0);              // 3.0 で「どさっ」と残りも
    const look = t >= 4.4 && t < 7.0;
    // ジル（左）：仕分け（lean）→ 山を見て「？」→ めくる（lean）→ ジト目
    const jface = t < 3.0 ? RIG.FACES.sharp : t < 4.4 ? Object.assign({}, RIG.FACES.think, { question: 1 }) : t < 6.4 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : RIG.FACES.annoyed;
    const jl = (t > .5 && t < 3.0) || (t > 4.4 && t < 6.2);
    L.char('jil', Object.assign({}, jl ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 20, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: .8, bodyTilt: jl ? -10 : 0, question: 0 }), t, '', {});
    // レン（右）：山が高くなるとご満悦 → 差出人がばれてあせあせ（目をそらす）
    const rface = t < 2.0 ? RIG.FACES.neutral : t < 6.2 ? Object.assign({}, RIG.FACES.smug, { sparkle: t > 3.0 && t < 4.6 ? 1 : 0 }) : Object.assign({}, RIG.FACES.oops, { eyeLook: .9 });
    L.char('ren', Object.assign({}, RIG.POSES.sit, rface, { x: 560, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: t < 6.2 ? -.3 : .9, headNod: t >= 7.2 ? 14 : 0 }), t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // 山（ジルあて・課長あて）と、とんでいく1枚
    fx += `<text x="${JX}" y="${DESK + 70}" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="34" fill="#FFF7E8">ジル</text><text x="${KX}" y="${DESK + 70}" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="34" fill="#FFF7E8">課長</text>`;
    for (let i = 0; i < nJ; i++) fx += CARD(JX, DESK - 64 - i * 8, -4 + i * 3);
    for (let i = 0; i < kStack; i++) fx += CARD(KX + Math.sin(i * 2.3) * 6, DESK - 64 - i * 8, Math.sin(i * 1.7) * 6);
    if (t > .6 && t < .6 + N * .4) { const i = Math.floor((t - .6) / .4), u = ((t - .6) % .4) / .4, tx = toJ(i) ? JX : KX; fx += CARD(400 + (tx - 400) * u, DESK - 200 - Math.sin(u * Math.PI) * 120, u * 360); }
    if (t > 3.0 && t < 3.4) fx += L.dust(KX, DESK, seg(t, 3.0, 3.4));
    // めくって見せる：1枚目（4.6〜）・2枚目（5.8〜）
    if (look) { const s = outBack(seg(t, 4.4, 4.7)), second = t >= 5.8, f = second ? seg(t, 6.0, 6.3) : seg(t, 4.9, 5.2);
      if (second) fx += `<g transform="translate(-18 14) rotate(-6 440 760)">${BIG(440, 760, .9, 1, 1).replace(/^<g transform="translate\(([^)]*)\)/, '<g transform="translate($1)" opacity=".9"')}</g>`;
      fx += BIG(440 + (second ? 40 * (1 - seg(t, 5.8, 6.0)) : 0), 760, .9 * s, f, second ? 2 : 1); }
    if (t > 7.2 && t < 8.6) fx += L.emark(220, DESK - 650, 1.0, '…');
    let ui = (t > 0.8 && t < 2.8 ? CHIP(L, 'SORTING CARDS', '年賀状の仕分け', 1600, seg(t, .8, 1.1)) : '')
      + (t > 3.2 && t < 4.4 ? CHIP_OFF(L, 'BOSS: SO POPULAR?', '課長あてが山ほど', 1600, seg(t, 3.2, 3.5)) : '')
      + (t > 6.6 && t < 8.6 ? CHIP_OFF(L, 'ALL FROM: THE BOSS', '差出人：ぜんぶ本人', 1600, seg(t, 6.6, 6.9)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 420, cy: 1150 },
      { t: 0.01, z: 1.05, cx: 500, cy: 1100, d: .9 },
      { t: 3.0, z: 1.2, cx: 640, cy: 1150, d: .4 },                 // 課長あての山
      { t: 4.4, z: 1.0, cx: 520, cy: 1000, d: .5 },                 // めくる
      { t: 7.0, z: 1.1, cx: 540, cy: 1100, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
