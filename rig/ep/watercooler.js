// 「ウォーターサーバー」（セリフなし・約11秒）
// ゲーム：レンがサーバーでコップに水をくむ。①紙コップ（ちょっとこぼれる）②マグ（机があふれる）③バケツ（床が水びたしでジルの胸まで）
// （間：音が止まり、水に浸かったジルの顔に寄る）
// オチ：レンは、ちいさな紙コップに半分だけくんで、満足そうに一口。ジルは無言（水がひく）。レンがまたボタンに手をのばす（冒頭につながる）
const SP = { x: 800, y: 1010 };                    // 蛇口の先
const BASE = 1186;                                 // 机の天板（コップを置く高さ）
const CUPS = [                                     // [開始, 終了, 幅, 高さ, 満タンになる時刻, 色]
  [0.0, 2.15, 80, 90, 1.25, '#FFFFFF'], [2.2, 4.3, 120, 130, 3.4, '#C9962F'], [4.4, 6.1, 190, 200, 5.2, '#8FA3B5']
];
const STREAM = [[0.12, 2.1], [2.45, 4.2], [4.55, 6.0]];
function cupShape(c, y0, fill, tilt) {
  const [, , w, h, , col] = c;
  const g = [el('path', { d: `M${-w / 2} ${-h} L${-w / 2 + 8} 0 L${w / 2 - 8} 0 L${w / 2} ${-h} Z`, fill: col, stroke: '#6F8296', 'stroke-width': 5, opacity: 0.96 })];
  const wh = (h - 10) * clamp(fill, 0, 1);
  if (wh > 1) g.push(el('rect', { x: -w / 2 + 12, y: -wh - 4, width: w - 24, height: wh, rx: 4, fill: '#7FB8E8' }));
  return el('g', { transform: `translate(${SP.x} ${y0}) rotate(${tilt || 0})` }, g);
}
const waterTop = (t) => t < 3.0 ? 1960 : t < 4.4 ? lerp(1960, 1830, ease(seg(t, 3.0, 4.4))) : t < 6.0 ? lerp(1830, 1560, ease(seg(t, 4.4, 6.0))) : t < 9.0 ? 1560 : lerp(1560, 1760, ease(seg(t, 9.0, 10.4)));

window.EP = {
  dur: 11.2,
  bgmHolds: '6.0-7.2',
  sfx: [{ t: 0.1, type: 'pon' }, { t: 0.15, type: 'whoosh' }, { t: 1.4, type: 'boing' }, { t: 2.1, type: 'pon' },
    { t: 2.25, type: 'clink' }, { t: 2.45, type: 'whoosh' }, { t: 3.5, type: 'boing' }, { t: 4.2, type: 'pon' },
    { t: 4.4, type: 'clink' }, { t: 4.55, type: 'whoosh' }, { t: 5.2, type: 'boing' }, { t: 5.5, type: 'flop' }, { t: 5.9, type: 'flop' }, { t: 6.0, type: 'pon' },
    { t: 7.2, type: 'swish' }, { t: 7.6, type: 'tap' }, { t: 8.1, type: 'chime' }, { t: 9.2, type: 'twitch' }, { t: 10.6, type: 'pon' }, { t: 10.65, type: 'whoosh' }],
  frame(t) {
    const dur = this.dur;
    office({ clock: [14, 5], mug: false });
    const f = clear('fx'), back = clear('back'), ui = clear('ui');
    const loopOn = t >= 10.6;

    // ---- サーバー本体（モニターの前）
    back.appendChild(el('rect', { x: 740, y: 560, width: 240, height: 626, rx: 22, fill: '#E8EEF4', stroke: '#8EA1B4', 'stroke-width': 8 }));
    back.appendChild(el('ellipse', { cx: 860, cy: 560, rx: 100, ry: 26, fill: '#BFD9EE', stroke: '#8EA1B4', 'stroke-width': 6 }));
    back.appendChild(el('rect', { x: 770, y: 150, width: 180, height: 400, rx: 60, fill: '#A9D3F2', stroke: '#6AA5D8', 'stroke-width': 8, opacity: 0.85 }));
    back.appendChild(el('rect', { x: 780, y: 360 + 40 * seg(t, 0, 10), width: 160, height: 190 - 40 * seg(t, 0, 10), rx: 40, fill: '#7FB8E8', opacity: 0.8 }));
    const pressed = (t > 0.1 && t < 2.1) || (t > 2.45 && t < 4.2) || (t > 4.55 && t < 6.0) || loopOn;
    back.appendChild(el('rect', { x: 780, y: 880, width: 40, height: 28, rx: 8, fill: pressed ? '#C0392B' : '#E0483C', stroke: '#8A2A22', 'stroke-width': 4, transform: pressed ? 'translate(0 5)' : '' }));
    back.appendChild(el('rect', { x: 840, y: 880, width: 40, height: 28, rx: 8, fill: '#4F7FA8', stroke: '#355F86', 'stroke-width': 4 }));
    back.appendChild(el('rect', { x: 790, y: 960, width: 44, height: 44, rx: 8, fill: '#8EA1B4' }));
    back.appendChild(el('rect', { x: SP.x - 30, y: 1000, width: 60, height: 14, rx: 7, fill: '#6F8296' }));

    // ---- キャラ
    const RX = 250, RY = 668, JX = 640, JY = 1240;
    let R = Object.assign({}, RIG.POSES.sit, RIG.FACES.smile, { scale: 1.3, x: RX, y: RY, eyeLook: 0.9, blush: 0.2 });
    if (pressed && !loopOn) Object.assign(R, RIG.POSES.lean, { bodyTilt: 5 });
    if (t >= 1.4 && t < 2.2) Object.assign(R, RIG.FACES.oops, { eyeLook: 0.9, sweat: 0.4 });
    if (t >= 3.5 && t < 4.4) Object.assign(R, RIG.FACES.surprised, { excl: 0, eyeLook: 0.9, sweat: 0.6 });
    if (t >= 4.5 && t < 6.0) Object.assign(R, RIG.FACES.angry, { eyeShape: 'round', mouth: 'open', eyeLook: 0.9, sweat: 1 });
    if (t >= 6.0 && t < 7.2) Object.assign(R, RIG.FACES.oops, { eyeLook: 0.7, sweat: 1, mouth: 'wavy' });
    if (t >= 7.2 && t < 9.2) Object.assign(R, RIG.FACES.smile, { blush: 0.8, sparkle: pulse(t, 8.0, 9.0), eyeLook: 0.5, headNod: -8 * pulse(t, 7.6, 8.4) });
    if (t >= 9.2 && t < 10.5) Object.assign(R, RIG.FACES.smug, { eyeLook: 0.9 });
    const Rq = draw('ren', 'ren', R, t, {});

    let J = Object.assign({}, RIG.POSES.sit, RIG.FACES.neutral, { scale: 1.25, flip: true, x: JX, y: JY, eyeLook: 0.9 });
    if (t >= 1.4 && t < 3.0) Object.assign(J, RIG.FACES.sharp, { eyeLook: 0.9 });
    if (t >= 3.0 && t < 4.5) Object.assign(J, RIG.FACES.annoyed, { eyeOpen: 0.5, sweat: 0.6 });
    if (t >= 4.5 && t < 6.0) Object.assign(J, RIG.FACES.surprised, { excl: 0, eyeOpen: 1.2, sweat: 1 });
    if (t >= 6.0 && t < 7.2) Object.assign(J, RIG.FACES.angry, { eyeShape: 'angry', mouth: 'line', sweat: 0.6, eyeLook: 0.9, earL: 8, earR: -8 });
    if (t >= 7.2 && t < 9.2) Object.assign(J, RIG.FACES.annoyed, { eyeOpen: 0.3, eyeShape: 'flat', sweat: 1, eyeLook: -0.4 });
    if (t >= 9.2) Object.assign(J, RIG.FACES.sharp, { eyeShape: 'angry', eyeLook: 0.9, sweat: 0.4 });
    const Jq = draw('jil', 'jil', J, t, {});

    // ---- 水を受けるコップと水の流れ
    const ci = t < 2.18 ? 0 : t < 4.35 ? 1 : 2;
    const c = CUPS[ci];
    const sIdx = STREAM.findIndex(s => t >= s[0] && t < s[1]);
    const loopStream = loopOn;
    let fill = clamp((t - STREAM[ci][0]) / (c[4] - STREAM[ci][0]), 0, 1);
    if (t > STREAM[ci][1]) fill = 1;
    if (t >= 7.2 && t < 10.5) { /* 紙コップ半分 */ }
    const flowing = sIdx >= 0 || loopStream;
    const cupTopY = BASE - c[3];
    const waterY = BASE - 6 - (c[3] - 10) * clamp(fill, 0, 1);
    if (t < 7.1 || loopOn) {
      const cc = loopOn ? CUPS[0] : c; const ff = loopOn ? clamp((t - 10.65) / 1.2, 0, 1) * 0.3 : fill;
      back.appendChild(cupShape(cc, BASE, ff, 0));
      const isFlow = flowing;
      if (isFlow) {
        const endY = (fill >= 1 && !loopOn) ? BASE - 4 : (loopOn ? BASE - 20 : waterY);
        f.appendChild(el('rect', { x: SP.x - 9, y: SP.y + 4, width: 18, height: Math.max(8, endY - SP.y - 4), rx: 9, fill: '#7FB8E8', opacity: 0.95 }));
      }
      // あふれ：コップのふちから机へ
      if (fill >= 1 && !loopOn) {
        const o = (sIdx >= 0 ? seg(t, c[4], c[4] + 0.5) : 1);
        [-1, 1].forEach(s => back.appendChild(el('path', { d: `M${SP.x + s * c[2] / 2} ${cupTopY} q${s * 16 * o} ${40 * o} ${s * 8 * o} ${(c[3] - 6) * o}`, stroke: '#7FB8E8', 'stroke-width': 10, fill: 'none', 'stroke-linecap': 'round' })));
        const pw = (ci === 0 ? 70 : ci === 1 ? 180 : 330) * o;
        back.appendChild(el('ellipse', { cx: SP.x, cy: BASE + 6, rx: pw, ry: 14 + pw * 0.04, fill: '#9CCBF0', opacity: 0.9 }));
        if (ci >= 1) for (let i = 0; i < 4; i++) { const u = (t * 3 + i * 0.27) % 1; f.appendChild(el('ellipse', { cx: SP.x - 240 - i * 40 + (ci === 2 ? 0 : 60), cy: BASE + 30 + u * 700, rx: 6, ry: 12, fill: '#7FB8E8', opacity: 0.8 * (1 - u) })); }
      }
    }
    // 机の端から床へ流れ落ちる水
    if (t > 3.2 && t < 6.3 && !loopOn) { const k = seg(t, 3.2, 3.8); f.appendChild(el('rect', { x: 560, y: BASE + 20, width: 24, height: (waterTop(t) - BASE) * k * 0.9, fill: '#7FB8E8', opacity: 0.85 })); }
    // 床の水（ジルの前面に半透明）
    const wy = waterTop(t);
    if (wy < 1950) {
      let d = `M-40 ${wy}`; for (let x = -40; x <= 1120; x += 40) d += ` L${x} ${wy + 8 * Math.sin(x * 0.03 + t * 6)}`; d += ' L1120 2000 L-40 2000 Z';
      f.appendChild(el('path', { d, fill: '#7FB8E8', opacity: 0.55 }));
      f.appendChild(el('path', { d, fill: 'none', stroke: '#CFE8FA', 'stroke-width': 5, opacity: 0.9 }));
    }
    if (t >= 4.9 && t < 7.0) { const u = seg(t, 4.9, 5.4); f.appendChild(el('g', { transform: `translate(${JX + 80} ${wy - 20})`, opacity: 1 - seg(t, 6.2, 7.0) }, [el('path', { d: 'M0 0 q10 -26 20 0 q-10 8 -20 0 Z', fill: '#CFE8FA', transform: `scale(${u})` })])); }
    // ---- オチ：ちいさな紙コップ
    if (t >= 7.2 && t < 10.5) {
      const sip = pulse(t, 7.6, 8.4);
      const rtp = headTop(Object.assign({}, RIG.DEFAULTS, { char: 'ren' }, R));
      const cx = 480 - 40 * sip, cy = 1010 - 90 * sip;
      back.appendChild(el('g', { transform: `translate(${cx} ${cy}) rotate(${-30 * sip})` }, [
        el('path', { d: 'M-34 -40 L-28 0 L28 0 L34 -40 Z', fill: '#FFFFFF', stroke: '#6F8296', 'stroke-width': 5 }),
        el('rect', { x: -26, y: -20 * (1 - sip * 0.6), width: 52, height: 18, rx: 3, fill: '#7FB8E8' })]));
    }
    // 水がひく泡
    if (t >= 9.0 && t < 10.5) { const u = seg(t, 9.0, 10.2); for (let i = 0; i < 3; i++) f.appendChild(el('circle', { cx: 700 - u * 50 - i * 22, cy: 1560 - u * 60 - i * 8, r: (12 + i * 8) * (0.4 + u), fill: '#FFFFFF', opacity: 0.8 * (1 - u) })); }

    // ---- カメラ
    const shots = [
      { t: 0.0, cx: 680, cy: 1000, z: 1.2, z2: 1.28 },
      { t: 2.3, cx: 700, cy: 1050, z: 1.35 },
      { t: 4.3, cx: 700, cy: 1150, z: 1.2, z2: 1.1 },
      { t: 5.9, cx: FACE_JIL.x - 120, cy: FACE_JIL.y - 40, z: 2.4, z2: 2.8 },
      { t: 7.1, cx: 440, cy: 900, z: 1.9 },
      { t: 8.9, cx: 700, cy: 1250, z: 1.25 },
      { t: 10.3, cx: 680, cy: 1000, z: 1.2 }
    ];
    camera(cameraAt(shots, t), 0);
    endcard(t, dur);
  }
};
