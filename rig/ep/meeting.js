// 「10分の会議」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：14:00、ホワイトボードに「10 min」。レンが話し始める（吹き出しは「…」が増えていく）
// ひっくり返し：時計の針がぐるぐる回る（14:00→16:00）→ オチ：ジルはコーヒー3杯目で寝落ち、レンはまだ話している。字幕「2時間後」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
const BOARD = (txt) => `<g transform="translate(540 520)"><rect x="-330" y="-170" width="660" height="340" rx="12" fill="#fff" stroke="#B8B2A8" stroke-width="12"/><text x="0" y="24" text-anchor="middle" font-size="110" font-weight="900" font-family="Noto Sans CJK JP" fill="#2F6FB5">${txt}</text></g>`;
const CUP = (x, y, s, full) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-40 0 L-48 -90 L48 -90 L40 0Z" fill="#fff" stroke="#C9A87E" stroke-width="5"/><path d="M48 -75 q40 0 40 32 q0 32 -40 32" fill="none" stroke="#C9A87E" stroke-width="7"/>${full ? '<path d="M-42 -70 L42 -70 L38 -20 L-38 -20Z" fill="#6B4A2E" opacity=".8"/>' : ''}</g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '6.0-6.6',
  sfx: [{ t: 0.1, type: 'pop' }, { t: 0.8, type: 'tap' }, { t: 1.5, type: 'pon' }, { t: 2.2, type: 'pon' }, { t: 2.9, type: 'pon' }, { t: 3.6, type: 'whoosh' }, { t: 4.2, type: 'swish' }, { t: 4.8, type: 'swish' },
    { t: 5.4, type: 'clink' }, { t: 6.0, type: 'flop' }, { t: 6.9, type: 'pon' }, { t: 7.6, type: 'pon' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    // 時計：14:00 → 3.6〜5.2 で針がぐるぐる → 16:00
    const spin = ease(seg(t, 3.6, 5.2));
    const minutes = 14 * 60 + spin * 120;
    const bg = L.office({ sky: spin > .5 ? 'dusk' : 'day', noClock: true }) + L.clock(880, 300, [Math.floor(minutes / 60), minutes % 60], 1.15) + BOARD(spin < 1 ? '10 min' : '2 h');
    // レン（右）：ずっと話している（口パク＝口の形を交互に）
    const talk = Math.floor(t * 6) % 2 === 0;
    const rp = Object.assign({}, RIG.POSES.sit, talk ? RIG.FACES.smile : RIG.FACES.neutral, { mouth: talk ? 'open' : 'w', x: 560, y: DESK - 413 * 1.3, scale: 1.3, flip: true, headTilt: Math.sin(t * 3) * 3, earL: Math.sin(t * 2.5) * 4 });
    L.char('ren', rp, t, '', {});
    // ジル（左）：聞く → 4.2 あくび気味（目が半分）→ 6.0 寝落ち（机に突っ伏す）
    const asleep = t >= 6.0;
    const jface = t < 4.2 ? RIG.FACES.sharp : t < 6.0 ? Object.assign({}, RIG.FACES.sleepy, { zzz: 0, eyeOpen: .3 }) : RIG.FACES.sleepy;
    const jp = Object.assign({}, asleep ? RIG.POSES.loaf : RIG.POSES.sit, jface, { x: 240, y: DESK - 413 * 1.3 + (asleep ? 40 : 0), scale: 1.3, eyeLook: t < 4.2 ? .6 : 0, headNod: asleep ? 30 : 0, bodyTilt: asleep ? 10 : 0 });
    L.char('jil', jp, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // コーヒー：1杯 → 2時間後は空のカップが3つ
    const cups = spin < .5 ? 1 : spin < .9 ? 2 : 3;
    for (let i = 0; i < cups; i++) fx += CUP(430 + i * 95, DESK - 6, .8, i === cups - 1 && spin < 1);
    // レンの吹き出し：「…」が増える
    const dots = Math.min(5, 1 + Math.floor(t / 1.5));
    fx += L.bubble(900, DESK - 580, `<text y="22" text-anchor="middle" font-size="90" font-weight="900" font-family="Noto Sans CJK JP" fill="#3A2414">${'・'.repeat(dots)}</text>`, { w: 150 + dots * 60, h: 140, tail: 40, s: outBack(seg(t, .8, 1.1)) });
    if (asleep) fx += `<text x="300" y="${DESK - 560}" font-size="${80 + Math.sin(t * 4) * 8}" font-weight="900" font-family="Noto Sans CJK JP" fill="#5F6B8C" opacity=".9">Zz</text>`;
    if (spin > 0 && spin < 1) fx += L.speed(880, 300, .6 * Math.sin(Math.PI * spin), 30);
    let ui = (t > 1.8 && t < 3.4 ? CHIP(L, 'MEETING: "JUST 10 MIN"', '「10分だけ」の会議、話すのは上司', 1380, seg(t, 1.8, 2.1)) : '')
      + (t > 6.0 && t < 8.6 ? CHIP_OFF(L, '2 HOURS LATER', '2時間後。部下は3杯目で寝落ち', 1380, seg(t, 6.0, 6.3)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.2, cx: 640, cy: 1050 },
      { t: 0.01, z: .95, cx: 660, cy: 1100, d: .8 },
      { t: 3.5, z: 1.3, cx: 760, cy: 700, d: .5 },                 // 時計に寄る
      { t: 5.3, z: .95, cx: 660, cy: 1150, d: .5 },
      { t: 6.9, z: 1.15, cx: 600, cy: 1200, d: .6 },                // 寝落ちのジル
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
