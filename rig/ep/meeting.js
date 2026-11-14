// 「10分の会議」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：ホワイトボードが落ちてきて「10 min」。レンが張り切って話す（吹き出しの「・」が増える・ビンキー）
// ひっくり返し：時計の針がぐるぐる（14:00→16:00）、ボードは「2 h」、コーヒーは3杯
// オチ：ジルはうとうと→机に突っ伏す（体で見せる）。レンはまだ跳ねている
// オチの後のオチ（ループ）：レンが寝ているジルを見て、にっこりボードを「10 min」に戻す（最初に戻る）
// 2026-11-14 総見直し：キャラを 1.3→1.7 倍（画面の高さの35%）・字幕なし（ボードと時計で分かる）・
//   ボードは冒頭の一言が消えてから（1.7秒）落ちてくる（前は一言と重なっていた）・動きの部品（L.binky・L.droop・L.land・L.anticip）
document.write('<script src="v2/lib.js"><\/script>');
const BOARD = (txt, y, s) => `<g transform="translate(540 ${y}) scale(${s})"><rect x="-6" y="-420" width="12" height="250" fill="#B8B2A8"/><rect x="-330" y="-170" width="660" height="340" rx="12" fill="#fff" stroke="#B8B2A8" stroke-width="12"/><text x="0" y="36" text-anchor="middle" font-size="130" font-weight="900" font-family="Noto Sans CJK JP" fill="${txt === '2 h' ? '#C2453A' : '#2F6FB5'}">${txt}</text></g>`;
const CUP = (x, y, s, full) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-40 0 L-48 -90 L48 -90 L40 0Z" fill="#fff" stroke="#C9A87E" stroke-width="5"/><path d="M48 -75 q40 0 40 32 q0 32 -40 32" fill="none" stroke="#C9A87E" stroke-width="7"/>${full ? '<path d="M-42 -70 L42 -70 L38 -20 L-38 -20Z" fill="#6B4A2E" opacity=".8"/>' : ''}</g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '6.0-6.6',
  sfx: [{ t: 0.1, type: 'pop' }, { t: 0.8, type: 'tap' }, { t: 1.75, type: 'whoosh' }, { t: 2.05, type: 'tap' }, { t: 2.6, type: 'boing' }, { t: 3.6, type: 'whoosh' }, { t: 4.2, type: 'swish' }, { t: 4.8, type: 'swish' },
    { t: 5.2, type: 'pon' }, { t: 5.4, type: 'clink' }, { t: 6.0, type: 'flop' }, { t: 6.3, type: 'boing' }, { t: 6.95, type: 'blink' }, { t: 7.45, type: 'swish' }, { t: 7.6, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400, S = 1.7;
    // 時計：14:00 → 3.6〜5.2 で針がぐるぐる → 16:00
    const spin = ease(seg(t, 3.6, 5.2));
    const minutes = 14 * 60 + spin * 120;
    // ボード：1.45〜1.8 で上から落ちてくる → 5.2 で「2 h」 → 7.9〜8.1 でレンが「10 min」に戻す（くるっと回る）
    const drop = outBack(seg(t, 1.7, 2.05));
    const flip1 = seg(t, 5.0, 5.25), flip2 = seg(t, 7.45, 7.7);
    const txt = t < 5.12 ? '10 min' : t < 7.57 ? '2 h' : '10 min';
    const bs = Math.max(.04, Math.abs(Math.cos(Math.PI * (flip1 > 0 && flip1 < 1 ? flip1 : flip2 > 0 && flip2 < 1 ? flip2 : 0))));
    const board = t < 1.7 ? '' : `<g transform="translate(0 ${-700 * (1 - drop)})"><g transform="translate(-210 0) translate(540 540) scale(${bs} 1) translate(-540 -540)">${BOARD(txt, 540, .78)}</g></g>`;
    const bg = L.office({ sky: spin > .5 ? 'dusk' : 'day', noClock: true }) + L.clock(880, 260, [Math.floor(minutes / 60), minutes % 60], 1.0) + board;
    // レン（右）：ずっと話している（口パク）。2.6 と 6.3 で張り切ってビンキー。6.95 ジルに気づく → 7.3 にっこり → 7.45 ボードを戻す
    const talk = t < 6.95 && Math.floor(t * 6) % 2 === 0;
    const notice = t >= 6.95 && t < 7.3, reset = t >= 7.3;
    const rface = notice ? Object.assign({}, RIG.FACES.neutral, { eyeOpen: 1.1 }) : reset ? RIG.FACES.smile : talk ? RIG.FACES.smile : RIG.FACES.neutral;
    const rmove = Object.assign({}, L.anticip(t, 2.6), L.binky(t, 2.6), L.land(t, 3.15), L.anticip(t, 6.3), L.binky(t, 6.3), L.land(t, 6.85));
    const rp = Object.assign({}, RIG.POSES.sit, rface, { mouth: notice ? 'w' : talk ? 'open' : 'w', x: 430, y: DESK - 413 * S, scale: S, flip: true, headTilt: t < 6.95 ? Math.sin(t * 3) * 4 : 0, earL: Math.sin(t * 2.5) * 4, eyeLook: notice ? -1 : 0, sparkle: reset ? 1 : 0 }, rmove);
    if (rmove.yOff) rp.y += rmove.yOff;
    L.char('ren', rp, t, '', {});
    // ジル（左）：聞く → 4.2 まぶたが重い → 5.3 うとうと（頭がかくっ）→ 5.6 体がしぼむ → 6.0 ばたっと横に伸びて寝る（うさぎの「フロップ」・着地のつぶれ）
    const asleep = t >= 6.0;
    const nod = t >= 5.3 && t < 6.0 ? 22 * Math.max(0, Math.sin((t - 5.3) * 14)) : 0;
    const jface = t < 4.2 ? RIG.FACES.sharp : t < 6.0 ? Object.assign({}, RIG.FACES.sleepy, { zzz: 0, eyeOpen: t < 5.3 ? .35 : .15 }) : RIG.FACES.sleepy;
    const jmove = Object.assign({}, t >= 5.6 && t < 6.0 ? L.droop(t, 5.6) : {}, L.land(t, 6.0, .3));
    const jp = Object.assign({}, asleep ? RIG.POSES.stretch : RIG.POSES.sit, Object.assign({}, jface, { zzz: 0 }), { x: 20, y: DESK - 413 * S, scale: S, eyeLook: t < 4.2 ? .6 : 0, headNod: asleep ? RIG.POSES.stretch.headNod : nod }, jmove);
    if (asleep && jmove.bodySquash) jp.bodySquash = RIG.POSES.stretch.bodySquash + jmove.bodySquash;
    L.char('jil', jp, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // コーヒー：ジルの前に。1杯 → 2杯 → 2時間後は3杯（最後だけ中身あり）
    const cups = spin < .5 ? 1 : spin < .9 ? 2 : 3;
    for (let i = 0; i < cups; i++) fx += CUP(110 + i * 105, DESK - 6, .85, i === cups - 1 && spin < 1);
    // レンの吹き出し：「・」が増える（話しているあいだだけ）
    const dots = Math.min(5, 1 + Math.floor(t / 1.5));
    if (t < 6.95) fx += L.bubble(880, DESK - 780, `<text y="22" text-anchor="middle" font-size="90" font-weight="900" font-family="Noto Sans CJK JP" fill="#3A2414">${'・'.repeat(dots)}</text>`, { w: 150 + dots * 50, h: 140, tail: 40, s: outBack(seg(t, .8, 1.1)) });
    if (asleep) fx += `<text x="60" y="${DESK - 430}" font-size="${84 + Math.sin(t * 4) * 8}" font-weight="900" font-family="Noto Sans CJK JP" fill="#5F6B8C" opacity=".9">Zz</text>`;
    if (spin > 0 && spin < 1) fx += L.speed(880, 260, .6 * Math.sin(Math.PI * spin), 30);
    let ui = '';
    const cam = L.camAt([
      { t: 0, z: 1.2, cx: 560, cy: 1120 },
      { t: 0.01, z: .95, cx: 565, cy: 1060, d: .8 },
      { t: 3.5, z: 1.7, cx: 820, cy: 360, d: .5 },                 // 時計に寄る（演出の寄り）
      { t: 5.3, z: 1.05, cx: 480, cy: 1130, d: .5 },               // うとうとのジル
      { t: 6.85, z: .95, cx: 565, cy: 1000, d: .45 },               // レンとボードが入る引き
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 6.0 && t < 6.2 ? 8 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
