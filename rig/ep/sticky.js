// 「付箋だらけ」（セリフなし・約11秒）
// ゲーム：レンがジルのモニターに付箋を投げて貼る。①1枚 ②3枚 ③ドサッと12枚（ジルの顔にも貼れる）
// （間：音が止まり、付箋で片目をふさがれたジルの顔に寄る）→ ジルが付箋をぜんぶはがす
// オチ：ジルが付箋に小さなハートを描き、レンのおでこへ投げ返す。レンは大喜びで、新しい付箋の束を持ってまた投げる（冒頭につながる）
const MON = { x0: 728, y0: 988, x1: 972, y1: 1128 };   // モニター画面
const COL = ['#FFE98A', '#FFD3E0', '#C9F0D0', '#FFE98A'];
// [投げる時刻, 着く時刻, 着地x, 着地y, 回転, 色]
const NOTES = [
  [0.15, 0.55, 850, 1050, -8, 0],
  [1.45, 1.8, 770, 1010, 6, 1], [1.75, 2.1, 900, 1100, -10, 2], [2.05, 2.4, 950, 1020, 12, 0],
  [3.0, 3.3, 790, 1080, -6, 2], [3.12, 3.42, 880, 1000, 9, 1], [3.24, 3.54, 940, 1090, -12, 0], [3.36, 3.66, 760, 1040, 14, 1],
  [3.48, 3.78, 830, 1110, -4, 2], [3.6, 3.9, 910, 1060, 7, 0], [3.72, 4.02, 800, 1020, -15, 1], [3.84, 4.14, 870, 1090, 5, 2],
  [3.96, 4.26, 'J', 'J', 10, 0], [4.12, 4.42, 'J2', 'J2', -14, 1]
];
const FALL0 = 6.1, FACEPEEL = 5.5;
const noteShape = (s, col, mark) => el('g', { transform: `scale(${s})` }, [
  el('rect', { x: -38, y: -38, width: 76, height: 76, rx: 4, fill: col, stroke: '#C9A93B', 'stroke-width': 3 }),
  el('rect', { x: -38, y: -38, width: 76, height: 14, fill: '#FFFFFF', opacity: 0.35 }),
  mark === 'heart' ? el('path', { d: 'M0 22 C-34 -4 -22 -30 0 -10 C22 -30 34 -4 0 22 Z', fill: '#E2536B' })
    : el('path', { d: 'M-22 -4 h44 M-22 10 h30', stroke: '#8A7A4A', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.6 })
]);
const flyPos = (t, a, b, x0, y0, x1, y1, arc) => { const u = clamp((t - a) / (b - a), 0, 1), e = u; return { x: lerp(x0, x1, e), y: lerp(y0, y1, e) - arc * Math.sin(Math.PI * u), u }; };

window.EP = {
  dur: 11.2,
  bgmHolds: '4.7-5.9',
  sfx: [{ t: 0.15, type: 'swish' }, { t: 0.55, type: 'pon' },
    { t: 1.45, type: 'swish' }, { t: 1.8, type: 'pon' }, { t: 1.75, type: 'swish' }, { t: 2.1, type: 'pon' }, { t: 2.05, type: 'swish' }, { t: 2.4, type: 'pon' },
    { t: 3.0, type: 'whoosh' }, { t: 3.3, type: 'pon' }, { t: 3.54, type: 'pon' }, { t: 3.78, type: 'pon' }, { t: 4.02, type: 'pon' }, { t: 4.26, type: 'pon' }, { t: 4.42, type: 'boing' },
    { t: 5.5, type: 'twitch' }, { t: 6.1, type: 'whoosh' }, { t: 6.6, type: 'flop' }, { t: 7.5, type: 'blink' },
    { t: 8.1, type: 'swish' }, { t: 8.5, type: 'pon' }, { t: 8.7, type: 'chime' }, { t: 10.15, type: 'swish' }, { t: 10.5, type: 'pon' }],
  frame(t) {
    const dur = this.dur;
    office({ clock: [10, 40], mug: false });
    const f = clear('fx'), back = clear('back'), ui = clear('ui');

    // ---- キャラ
    const RX = 250, RY = 668, JX = 640, JY = 1240;
    const throwing = NOTES.some(n => t > n[0] - 0.12 && t < n[0] + 0.12) && t < 4.5 || (t > 10.0 && t < 10.3);
    let R = Object.assign({}, RIG.POSES.sit, RIG.FACES.smile, { scale: 1.3, x: RX, y: RY, eyeLook: 0.8, blush: 0.2 });
    if (throwing) Object.assign(R, RIG.POSES.lean, { bodyTilt: 6 });
    if (t >= 4.3 && t < 5.5) Object.assign(R, RIG.FACES.surprised, { excl: 0, sweat: 0.5 });
    if (t >= 5.5 && t < 7.9) Object.assign(R, RIG.FACES.oops, { sweat: 1, eyeLook: 0.8, mouth: 'wavy' });
    if (t >= 8.0 && t < 8.5) Object.assign(R, RIG.FACES.surprised, { excl: 0, eyeLook: 0.9 });
    if (t >= 8.5 && t < 10.0) Object.assign(R, RIG.FACES.smile, { blush: 0.9, sparkle: pulse(t, 8.6, 9.6), eyeLook: 0.6, y: RY - 30 * pulse(t, 8.5, 9.0) });
    const Rq = draw('ren', 'ren', R, t, {});

    let J = Object.assign({}, RIG.POSES.sit, RIG.FACES.neutral, { scale: 1.25, flip: true, x: JX, y: JY, eyeLook: 0.9 });
    if (t >= 0.55 && t < 1.45) Object.assign(J, RIG.FACES.sharp, { eyeLook: 0.9 });
    if (t >= 1.8 && t < 3.0) Object.assign(J, RIG.FACES.annoyed, { eyeOpen: 0.5, sweat: 0.6 });
    if (t >= 3.0 && t < 4.7) Object.assign(J, RIG.FACES.sharp, { eyeShape: 'angry', browAngle: -10, sweat: 0.4 });
    if (t >= 4.7 && t < 6.1) Object.assign(J, RIG.FACES.angry, { eyeShape: 'angry', mouth: 'line', sweat: 0, eyeLook: 0.9 });
    if (t >= 6.1 && t < 7.2) Object.assign(J, RIG.FACES.annoyed, { eyeOpen: 0.35, eyeShape: 'flat', sweat: 0.8 });
    if (t >= 7.2 && t < 8.1) Object.assign(J, RIG.FACES.neutral, { eyeLook: -0.4, mouth: 'line' });
    if (t >= 8.1 && t < 8.5) Object.assign(J, RIG.FACES.sharp, { eyeLook: 0.9 });
    if (t >= 8.5) Object.assign(J, RIG.FACES.annoyed, { eyeOpen: 0.45, eyeLook: -0.6, blush: 0.9, mouth: 'smile', headTilt: -6 });
    const Jq = draw('jil', 'jil', J, t, {});
    const jt = headTop(Object.assign({}, RIG.DEFAULTS, { char: 'jil' }, J)), rt = headTop(Object.assign({}, RIG.DEFAULTS, { char: 'ren' }, R));
    const HAND = { x: 470, y: 1010 };

    // ---- 付箋
    NOTES.forEach((n, i) => {
      const [a, b, tx0, ty0, rot, ci] = n;
      const onJ = tx0 === 'J' || tx0 === 'J2';
      const tx = onJ ? jt.x - (tx0 === 'J' ? 18 : -24) : tx0, ty = onJ ? jt.y + (tx0 === 'J' ? 60 : 78) : ty0;
      if (t < a) return;
      if (t < b) { const p = flyPos(t, a, b, HAND.x, HAND.y, tx, ty, 90); back.appendChild(el('g', { transform: `translate(${p.x} ${p.y}) rotate(${rot + 360 * (1 - p.u)})` }, [noteShape(0.9, COL[ci])])); return; }
      let y = ty, x = tx, op = 1, r = rot;
      if (!onJ && t >= FALL0 + 0.04 * i) { const d = t - FALL0 - 0.04 * i; y += 0.5 * 2600 * d * d; x += 40 * d; r += 80 * d; }
      if (onJ) { if (t >= FACEPEEL) { const d = t - FACEPEEL; y += 0.5 * 2200 * d * d; x += (tx0 === 'J' ? -60 : 60) * d; r += 120 * d; } }
      if (y > 2100) return;
      const pop = 1 + 0.25 * pulse(t, b, b + 0.14);
      (onJ ? f : back).appendChild(el('g', { transform: `translate(${x} ${y}) rotate(${r}) scale(${pop})` }, [noteShape(0.9, COL[ci])]));
    });

    // ---- オチ：ジルのハート付箋 → レンのおでこへ
    if (t >= 7.2 && t < 8.1) { const u = seg(t, 7.2, 7.7); f.appendChild(el('g', { transform: `translate(${jt.x - 30} ${jt.y + 170 - 10 * u}) rotate(-6) scale(${0.7 + 0.2 * ease(u)})` }, [noteShape(1, COL[0], u > 0.5 ? 'heart' : null)])); }
    if (t >= 8.1 && t < 8.5) { const p = flyPos(t, 8.1, 8.5, jt.x - 30, jt.y + 160, rt.x, rt.y + 70, 120); f.appendChild(el('g', { transform: `translate(${p.x} ${p.y}) rotate(${-6 + 540 * p.u})` }, [noteShape(0.9, COL[0], 'heart')])); }
    if (t >= 8.5 && t < 9.7) f.appendChild(el('g', { transform: `translate(${rt.x} ${rt.y + 70}) rotate(-4) scale(${1 + 0.2 * pulse(t, 8.5, 8.7)})` }, [noteShape(0.9, COL[0], 'heart')]));
    if (t >= 9.7 && t < 10.1) { const p = flyPos(t, 9.7, 10.1, rt.x, rt.y + 70, rt.x + 40, rt.y + 520, 60); f.appendChild(el('g', { transform: `translate(${p.x} ${p.y}) rotate(${60 * p.u})` }, [noteShape(0.9, COL[0], 'heart')])); }
    if (t >= 9.2 && t < 10.5) f.appendChild(el('g', { transform: `translate(${HAND.x - 10} ${HAND.y + 20})` }, [noteShape(0.9, COL[2]), el('g', { transform: 'translate(8 -8)' }, [noteShape(0.9, COL[1])])]));
    // 2周目のつなぎ：最初の1枚（10.15 → 10.5）
    if (t >= 10.15 && t < 10.55) { const p = flyPos(t, 10.15, 10.55, HAND.x, HAND.y, 850, 1050, 90); f.appendChild(el('g', { transform: `translate(${p.x} ${p.y}) rotate(${-8 + 360 * (1 - p.u)})` }, [noteShape(0.9, COL[0])])); }
    if (t >= 10.55) back.appendChild(el('g', { transform: 'translate(850 1050) rotate(-8)' }, [noteShape(0.9, COL[0])]));

    // ---- カメラ
    const shots = [
      { t: 0.0, cx: 600, cy: 1000, z: 1.15, z2: 1.22 },
      { t: 1.3, cx: 640, cy: 1060, z: 1.3 },
      { t: 2.85, cx: 700, cy: 1120, z: 1.45 },
      { t: 4.5, cx: jt.x, cy: jt.y + 120, z: 2.3, z2: 2.7 },
      { t: 6.0, cx: 780, cy: 1180, z: 1.5 },
      { t: 7.1, cx: jt.x - 20, cy: jt.y + 160, z: 2.2 },
      { t: 8.0, cx: 560, cy: 1000, z: 1.25 },
      { t: 8.5, cx: rt.x, cy: rt.y + 120, z: 2.2 },
      { t: 9.7, cx: 600, cy: 1000, z: 1.15 }
    ];
    camera(cameraAt(shots, t), 0);
    endcard(t, dur);
  }
};
