// 「全員に返信」（約11.5秒・セリフなし）
// ゲーム：返信ボタンを押し間違える。宛先の小さな顔が ①小さくびっくり ②中くらい ③大きくびっくり（上がり方は三段）
//   レンは取り消しを連打（押すほど速くなる）。ジルは無言で画面を閉じる（呆れ顔で、でも黙って後始末をする）
// （間）画面は消えた。固まったレン。尻尾だけが小さく震え始める → 全力で震える（オチ）
// オチの後のオチ：閉じた画面の小窓に「了解」の親指が全員分ぽんぽん返ってくる。尻尾はまだ震えている
const NAME = n => document.createTextNode(n);
const PRESS = [1.0];                                              // 返信ボタン
const UNDO = [2.06, 2.36, 2.62, 2.86, 3.02, 3.16, 3.29, 3.41, 3.52, 3.62, 3.72];  // 取り消し連打（だんだん速く）
const T_ST1 = 1.3, T_ST2 = 2.5, T_ST3 = 3.5;                      // びっくり 小→中→大
const T_CLOSE = 4.78, T_TAIL = 5.5, T_BIG = 6.25, T_THUMB = 8.0;

const RX = 150, RY = 668;
const TAIL = { x: RX + 392 * 1.3, y: RY + 300 * 1.3 };            // レンの尻尾の付け根
const MON = { x: 690, y: 860, w: 370, h: 300 }, SCR = { x: 706, y: 876, w: 338, h: 254 };
const HEADS = ['#F2D3B0', '#D9C2A5', '#E8B9A0', '#C9D8E8', '#EBD9A8', '#D8B7C9'], EARS = ['#D9B48C', '#B79F82', '#C99A85', '#9FB5CC', '#C9B57F', '#B890A6'];
const NF = 18;
const cellPos = i => ({ x: SCR.x + 8 + ((i % 6) + 0.5) * 53.7, y: SCR.y + 46 + Math.floor(i / 6) * 38 });
const mix = (arr, l) => { const k = clamp(l, 0, arr.length - 1), i = Math.min(arr.length - 2, Math.floor(k)); return lerp(arr[i], arr[i + 1], k - i); };
const pressAt = (t, list, w = 0.12) => list.reduce((m, p) => Math.max(m, pulse(t, p, p + w)), 0);

function curPos(t) {
  const K = [[0, 800, 1015], [0.35, 760, 1100], [0.6, 762, 1100], [0.86, 850, 1100], [1.2, 850, 1102], [1.9, 850, 1102], [2.05, 872, 1104], [3.76, 872, 1104]];
  if (t >= K[K.length - 1][0]) return { x: K[K.length - 1][1], y: K[K.length - 1][2] };
  let i = 0; while (i + 1 < K.length && K[i + 1][0] <= t) i++;
  const a = K[i], b = K[i + 1], u = ease(seg(t, a[0], b[0]));
  return { x: lerp(a[1], b[1], u), y: lerp(a[2], b[2], u) };
}

// 宛先の顔アイコン1つ。lvl 0=のんき 1=小さくびっくり 2=中くらい 3=大きくびっくり
function faceIcon(g, cx, cy, i, lvl, t) {
  const k = 1 + 0.12 * lvl + 0.1 * (pulse(t, T_ST1 + i * 0.025, T_ST1 + 0.3 + i * 0.025) + pulse(t, T_ST2 + i * 0.025, T_ST2 + 0.3 + i * 0.025) + pulse(t, T_ST3 + i * 0.025, T_ST3 + 0.3 + i * 0.025));
  const jx = lvl > 2 ? Math.sin(t * 52 + i * 2) * 1.6 * (lvl - 2) : 0, jy = lvl > 1 ? Math.cos(t * 47 + i) * 0.8 * (lvl - 1) : 0;
  const s = 14 * k, x = cx + jx, y = cy + jy, h = HEADS[i % 6], e = EARS[i % 6];
  const kids = [];
  const up = 3 * lvl;
  kids.push(el('ellipse', { cx: x - s * 0.5, cy: y - s * 1.0 - up, rx: s * 0.26, ry: s * 0.5, fill: e }), el('ellipse', { cx: x + s * 0.5, cy: y - s * 1.0 - up, rx: s * 0.26, ry: s * 0.5, fill: e }));
  kids.push(el('circle', { cx: x, cy: y, r: s, fill: h, stroke: '#7A6550', 'stroke-width': 1.2 }));
  const w = clamp(lvl * 3, 0, 1), er = mix([2.4, 3.8, 5.2, 6.8], lvl) * k, pr = mix([2.4, 2.2, 2.4, 1.6], lvl) * k;
  [-1, 1].forEach(sd => {
    const ex = x + sd * s * 0.4, ey = y - s * 0.12;
    kids.push(el('circle', { cx: ex, cy: ey, r: lerp(1.8 * k, er, w), fill: w < 1 ? '#FFFFFF' : '#FFFFFF', stroke: '#3B2E22', 'stroke-width': 1 }));
    kids.push(el('circle', { cx: ex + (lvl > 2 ? 0 : sd * 0.3), cy: ey, r: lerp(1.8 * k, pr, w), fill: '#2B1A10' }));
    if (lvl > 0.8) kids.push(el('path', { d: `M${ex - er} ${ey - er - 2 - lvl} L${ex + er} ${ey - er - 4 - 1.5 * lvl}`.replace(/^/, ''), stroke: '#5A3A1E', 'stroke-width': 1.3, fill: 'none', transform: sd < 0 ? `scale(-1 1) translate(${-2 * ex} 0)` : '' }));
  });
  const mo = clamp(lvl, 0, 3);
  if (mo < 0.3) kids.push(el('path', { d: `M${x - s * 0.3} ${y + s * 0.42} q${s * 0.3} ${s * 0.25} ${s * 0.6} 0`, stroke: '#7A3B3B', 'stroke-width': 1.4, fill: 'none', 'stroke-linecap': 'round' }));
  else kids.push(el('ellipse', { cx: x, cy: y + s * 0.5, rx: mix([1, 1.4, 2.6, 4.4], mo) * k, ry: mix([1, 2, 4.2, 7], mo) * k, fill: '#7A2E2E' }));
  if (lvl > 2.2) kids.push(el('path', { d: `M${x + s * 0.95} ${y - s * 0.9} q3 5 0 8 q-3 -3 0 -8 Z`, fill: '#8EC5EA' }));
  if (lvl > 1.5) { const q = (lvl - 1.5) / 1.5; kids.push(el('rect', { x: x + s * 0.9, y: y - s * 1.9, width: 2.4 * q + 1, height: 7 * q + 1, rx: 1, fill: '#C8463C' }), el('circle', { cx: x + s * 0.9 + 1.2 * q, cy: y - s * 1.9 + 10 * q + 2, r: 1.5 * q + 0.4, fill: '#C8463C' })); }
  g.appendChild(el('g', {}, kids));
}

// 親指（了解）
function thumb(col, dk, x, y, s) {
  return el('g', { transform: `translate(${x} ${y}) scale(${s})` }, [
    el('rect', { x: -11, y: -2, width: 6, height: 15, rx: 2, fill: dk }),
    el('path', { d: 'M-4 13 L-4 -1 L1 -4 L3 -13 Q3 -17 7 -15 Q10 -13 9 -8 L8 -3 L14 -3 Q17 -3 17 0 L16 10 Q15 13 12 13 Z', fill: col, stroke: '#5A3A1E', 'stroke-width': 1.2, 'stroke-linejoin': 'round' })
  ]);
}

function button(g, x, y, w, h, fill, press, kids) {
  const s = 1 - 0.1 * press;
  g.appendChild(el('g', { transform: `translate(${x + w / 2} ${y + h / 2}) scale(${s}) translate(${-(x + w / 2)} ${-(y + h / 2)})` }, [el('rect', { x, y, width: w, height: h, rx: 7, fill, stroke: '#3B4A5A', 'stroke-width': 1.6 })].concat(kids || [])));
}
const arrowPath = (x, y, s) => `M${x} ${y} h${-9 * s} v${-4 * s} l${-9 * s} ${7 * s} l${9 * s} ${7 * s} v${-4 * s} h${9 * s} q${6 * s} 0 ${6 * s} ${6 * s} v${4 * s}`;  // ↩ の形の簡易

function drawScreen(back, t) {
  // モニター
  back.appendChild(el('rect', { x: MON.x, y: MON.y, width: MON.w, height: MON.h, rx: 18, fill: '#3B4A5A' }));
  const closed = t >= T_CLOSE;
  // デスクトップ（窓の下）
  back.appendChild(el('rect', { x: SCR.x, y: SCR.y, width: SCR.w, height: SCR.h, rx: 8, fill: '#7FA3C4' }));
  back.appendChild(el('rect', { x: SCR.x, y: SCR.y + SCR.h - 18, width: SCR.w, height: 18, rx: 0, fill: '#4A5C70' }));
  for (let i = 0; i < 4; i++) back.appendChild(el('rect', { x: SCR.x + 14, y: SCR.y + 16 + i * 40, width: 24, height: 24, rx: 5, fill: i % 2 ? '#F2C14E' : '#F4ECE0', opacity: 0.9 }));

  // メール窓（閉じるときは右上へすぼむ）
  const cu = seg(t, T_CLOSE, T_CLOSE + 0.28);
  if (cu < 1) {
    const sc = 1 - ease(cu), ox = SCR.x + SCR.w - 12, oy = SCR.y + 12;
    const g = el('g', { transform: `translate(${ox} ${oy}) scale(${Math.max(sc, 0.001)}) translate(${-ox} ${-oy})`, opacity: 1 - 0.4 * cu });
    g.appendChild(el('rect', { x: SCR.x, y: SCR.y, width: SCR.w, height: SCR.h - 18, rx: 8, fill: '#FBF8F2', stroke: '#C9B79E', 'stroke-width': 2 }));
    g.appendChild(el('rect', { x: SCR.x, y: SCR.y, width: SCR.w, height: 24, rx: 8, fill: '#DDE6EE' }));
    [0, 1, 2].forEach(i => g.appendChild(el('circle', { cx: SCR.x + 14 + i * 14, cy: SCR.y + 12, r: 4, fill: ['#E0746A', '#F2C14E', '#7CB36A'][i] })));
    g.appendChild(el('rect', { x: SCR.x + SCR.w - 30, y: SCR.y + 4, width: 24, height: 16, rx: 4, fill: closed || (t > T_CLOSE - 0.25) ? '#E0746A' : '#EAB1AB' }));
    g.appendChild(el('path', { d: `M${SCR.x + SCR.w - 23} ${SCR.y + 8} l10 8 M${SCR.x + SCR.w - 13} ${SCR.y + 8} l-10 8`, stroke: '#FFFFFF', 'stroke-width': 2, 'stroke-linecap': 'round' }));
    // 宛先（顔）
    for (let i = 0; i < NF; i++) {
      const d = i * 0.025, lvl = seg(t, T_ST1 + d, T_ST1 + 0.25 + d) + seg(t, T_ST2 + d, T_ST2 + 0.25 + d) + seg(t, T_ST3 + d, T_ST3 + 0.25 + d);
      const c = cellPos(i); faceIcon(g, c.x, c.y, i, lvl, t);
    }
    // 本文の行
    [0, 1].forEach(i => g.appendChild(el('rect', { x: SCR.x + 14, y: SCR.y + 150 + i * 11, width: i ? 150 : 250, height: 5, rx: 2.5, fill: '#C9C2B6' })));
    // ボタン行
    const sent = t >= 1.05;
    if (!sent) {
      const hoverA = curPos(t).x < 800, p = pressAt(t, PRESS, 0.14);
      button(g, SCR.x + 14, SCR.y + 174, 70, 34, hoverA ? '#D6E4F0' : '#E6E9ED', 0, [el('path', { d: 'M24 -2 h-14 v-5 l-11 9 l11 9 v-5 h14', transform: `translate(${SCR.x + 38} ${SCR.y + 191})`, fill: '#4A5C70' })]);
      button(g, SCR.x + 96, SCR.y + 174, 100, 34, hoverA ? '#7CB36A' : '#9BCB8A', p, [
        el('path', { d: 'M18 -2 h-10 v-5 l-10 9 l10 9 v-5 h10', transform: `translate(${SCR.x + 126} ${SCR.y + 191})`, fill: '#2F4F2A' }),
        el('path', { d: 'M18 -2 h-10 v-5 l-10 9 l10 9 v-5 h10', transform: `translate(${SCR.x + 152} ${SCR.y + 191})`, fill: '#2F4F2A' })]);
    } else {
      const pr = seg(t, 1.05, 1.5);
      g.appendChild(el('rect', { x: SCR.x + 14, y: SCR.y + 184, width: 200, height: 14, rx: 7, fill: '#E3E6EA' }));
      g.appendChild(el('rect', { x: SCR.x + 14, y: SCR.y + 184, width: 200 * ease(pr), height: 14, rx: 7, fill: '#7CB36A' }));
      // 取り消しボタン（大きな丸）
      const ux = SCR.x + 270, uy = SCR.y + 190, p = pressAt(t, UNDO, 0.1), ap = seg(t, 1.55, 1.8);
      if (ap > 0) {
        const fl = p > 0 ? 1 : 0;
        g.appendChild(el('g', { transform: `translate(${ux} ${uy}) scale(${(1 - 0.16 * p) * (0.4 + 0.6 * easeOut(ap))}) rotate(${-12 * p})` }, [
          el('circle', { r: 21, fill: fl ? '#F28B62' : '#F2B27C', stroke: '#8A4B22', 'stroke-width': 2.2 }),
          el('path', { d: 'M-8 -2 a9 9 0 1 1 3 12 M-8 -2 l-6 -6 M-8 -2 l7 -2', fill: 'none', stroke: '#5A2E12', 'stroke-width': 3.2, 'stroke-linecap': 'round' })
        ]));
        if (p > 0.1) g.appendChild(el('path', { d: `M${ux - 7} ${uy - 33} l14 -10 M${ux + 7} ${uy - 33} l-14 -10`, stroke: '#C8463C', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: p }));
      }
    }
    // カーソル
    const c = curPos(t), cl = pressAt(t, PRESS.concat(UNDO), 0.1);
    if (t < T_CLOSE - 0.1) g.appendChild(el('path', { d: 'M0 0 L0 22 L6 17 L10 26 L14 24 L10 15 L18 15 Z', fill: '#FFFFFF', stroke: '#1B1B1B', 'stroke-width': 1.8, 'stroke-linejoin': 'round', transform: `translate(${c.x} ${c.y}) scale(${1 - 0.12 * cl})` }));
    back.appendChild(g);
  }

  // 閉じたあとの小窓（了解の親指）
  const wu = seg(t, T_THUMB - 0.3, T_THUMB);
  if (wu > 0) {
    const wx = SCR.x + 96, wy = SCR.y + 80, ww = 232, wh = 148, k = easeOut(wu);
    const g = el('g', { transform: `translate(${wx + ww} ${wy + wh}) scale(${k}) translate(${-(wx + ww)} ${-(wy + wh)})` });
    g.appendChild(el('rect', { x: wx, y: wy, width: ww, height: wh, rx: 7, fill: '#FBF8F2', stroke: '#C9B79E', 'stroke-width': 2 }));
    g.appendChild(el('rect', { x: wx, y: wy, width: ww, height: 16, rx: 7, fill: '#DDE6EE' }));
    for (let i = 0; i < NF; i++) {
      const tk = T_THUMB + i * 0.095, u = seg(t, tk, tk + 0.22);
      const cx = wx + 6 + ((i % 6) + 0.5) * 36.7, cy = wy + 16 + 6 + (Math.floor(i / 6) + 0.5) * 40;
      g.appendChild(el('circle', { cx, cy, r: 15, fill: '#F2ECE2' }));
      if (u > 0) { const s = u < 1 ? 1.15 * Math.sin(Math.PI * 0.5 * Math.min(1, u * 1.15)) + 0.0 : 1; g.appendChild(thumb(HEADS[i % 6], EARS[i % 6], cx, cy + 1, 0.95 * (u < 0.7 ? easeOut(u / 0.7) * 1.25 : lerp(1.25, 1, (u - 0.7) / 0.3)))); }
    }
    back.appendChild(g);
  }
  // 台
  back.appendChild(el('rect', { x: 830, y: MON.y + MON.h, width: 40, height: 30, fill: '#3B4A5A' }));
  // キーボード（机の上）
  back.appendChild(el('rect', { x: 740, y: 1168, width: 280, height: 22, rx: 6, fill: '#E8E1D6', stroke: '#8E7A60', 'stroke-width': 3 }));
  for (let i = 0; i < 12; i++) back.appendChild(el('rect', { x: 750 + i * 22.5, y: 1173, width: 17, height: 5, rx: 1.5, fill: '#B8AC9A' }));
  const kp = pulse(t, T_CLOSE - 0.12, T_CLOSE + 0.1);
  back.appendChild(el('rect', { x: 765, y: 1173 + 3 * kp, width: 26, height: 12 - 3 * kp, rx: 2, fill: '#E0746A' }));
}
const easeOut = u => 1 - Math.pow(1 - clamp(u, 0, 1), 3);

window.EP = {
  dur: 11.4,
  sfx: [{ t: 0.55, type: 'tap' }, { t: 0.86, type: 'tap' }, { t: 1.0, type: 'click' }, { t: 1.05, type: 'whoosh' }, { t: 1.3, type: 'pop' }, { t: 1.45, type: 'pop' }, { t: 1.6, type: 'pop' },
        { t: 2.5, type: 'pop' }, { t: 2.65, type: 'pop' }, { t: 2.8, type: 'pop' }, { t: 3.5, type: 'boing' }, { t: 3.62, type: 'pop' },
        ...UNDO.map(u => ({ t: u, type: 'click' })),
        { t: 4.35, type: 'swish' }, { t: 4.7, type: 'click' }, { t: 4.8, type: 'flop' },
        ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => ({ t: T_BIG + i * 0.14, type: 'twitch' })),
        { t: 7.7, type: 'swish' }, ...Array.from({ length: NF }, (_, i) => ({ t: T_THUMB + i * 0.095, type: 'pop' })),
        { t: 10.0, type: 'chime' }],
  frame(t) {
    const dur = this.dur;
    office({ clock: [9, 12], papers: 'neat', mug: false });
    const f = clear('fx'), back = clear('back'), ui = clear('ui');
    drawScreen(back, t);

    // ---- レン
    const clk = pressAt(t, PRESS.concat(UNDO), 0.1);
    let R = Object.assign({}, RIG.POSES.nudge, RIG.FACES.neutral, { scale: 1.3, x: RX, y: RY, eyeLook: 0.8, bodyTilt: 4 + 6 * clk, headNod: 8 + 6 * clk + 3 * Math.sin(t * 9) });
    if (t < 1.0) Object.assign(R, { eyeLook: 0.8 - 0.3 * Math.sin(t * 7), mouth: 'line', sweat: seg(t, 0.4, 0.9) * 0.6 });
    if (t >= 1.0 && t < 1.4) Object.assign(R, RIG.FACES.neutral, { eyeLook: 0.8, bodyTilt: 0, headNod: 0 });
    if (t >= 1.4 && t < 3.5) Object.assign(R, RIG.FACES.oops, { eyeOpen: 1 + 0.2 * seg(t, 1.4, 3.4), eyeLook: 0.8, sweat: 1 });
    if (t >= 3.5 && t < 3.95) Object.assign(R, RIG.FACES.surprised, { eyeLook: 0.8, sweat: 1, eyeOpen: 1.3 });
    if (t >= 3.95) { const k = seg(t, 3.95, 4.15);   // 固まる
      Object.assign(R, RIG.POSES.sit, RIG.FACES.surprised, { eyeOpen: 1.3, mouth: 'line', excl: 0, sweat: 1, eyeLook: 0.8, bodyTilt: 0, headNod: -4 * k, earL: 0, earR: 0 }); }
    if (t >= T_THUMB + 0.2) Object.assign(R, { eyeOpen: 1.1, mouth: 'wavy', excl: 0, sweat: 0.6, eyeLook: 0.8 });
    if (t >= 9.9) Object.assign(R, RIG.FACES.smile, { sweat: 0.5, blush: 0.5, eyeLook: 0.8, headNod: 0 });
    draw('ren', 'ren', R, t, { blink: t < 3.9 || t >= 8.6, ears: t < 3.95 });
    // 尻尾（尻の後ろに丸いふわふわ）。オチで震える
    {
      const a = seg(t, T_TAIL, T_BIG), amp = (t < T_TAIL ? 1.2 + 0.6 * Math.sin(t * 5) : lerp(2, 15, ease(a))) * (t >= 9.9 ? lerp(1, 0.55, seg(t, 9.9, 10.6)) : 1);
      const w = Math.sin(t * 2 * Math.PI * 6) * amp;    // 6Hz（24fpsで4コマ周期）
      const g = el('g', { transform: `translate(${TAIL.x + w * 0.6} ${TAIL.y}) rotate(${w * 1.2} 0 20)` }, [
        el('circle', { cx: 0, cy: 0, r: 28, fill: '#F6EEE0', stroke: '#C7A077', 'stroke-width': 3 }),
        el('circle', { cx: -8, cy: -8, r: 11, fill: '#FFFFFF', opacity: 0.6 })
      ]);
      document.getElementById('ren').appendChild(g);
      if (t >= T_BIG - 0.05 && t < 9.6) { const m = (x1, y1, x2, y2) => el('line', { x1: TAIL.x + x1, y1: TAIL.y + y1, x2: TAIL.x + x2, y2: TAIL.y + y2, stroke: '#7A6550', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.35 + 0.35 * Math.abs(Math.sin(t * 2 * Math.PI * 3)) });
        [-1, 1].forEach(sd => { document.getElementById('ren').appendChild(m(sd * 58, -22, sd * 78, -34)); document.getElementById('ren').appendChild(m(sd * 62, 2, sd * 86, 2)); document.getElementById('ren').appendChild(m(sd * 58, 26, sd * 78, 38)); }); }
    }

    // ---- ジル（下の席。呆れ顔だが、黙って後始末をする）
    const JX = 640, JY = 1240;
    let J = Object.assign({}, RIG.POSES.sit, RIG.FACES.neutral, { scale: 1.25, flip: true, x: JX, y: JY, eyeLook: 0.9, mouth: 'line' });
    const lk = seg(t, 3.7, 4.2);
    if (t >= 1.5 && t < 2.5) Object.assign(J, { eyeOpen: 1, mouth: 'line', earL: -8, earR: 8 });
    if (t >= 2.5 && t < 3.9) Object.assign(J, RIG.FACES.annoyed, { sweat: 0, eyeOpen: lerp(0.6, 0.4, seg(t, 2.5, 3.8)) });
    if (t >= 3.9 && t < 5.4) Object.assign(J, RIG.FACES.annoyed, { eyeShape: 'half', eyeOpen: 0.7, sweat: 0, earL: -14 * lk, earR: 14 * lk, headNod: 6 * lk });
    // 画面を閉じる：立ち上がって片手を伸ばす
    const reach = goBack(t, 4.3, 4.68, 4.9, 5.25);
    if (t >= 4.3 && t < 5.3) Object.assign(J, RIG.POSES.stretch, RIG.FACES.annoyed, { eyeShape: 'half', eyeOpen: 0.7, sweat: 0, scale: 1.25, flip: true, x: JX, y: JY, bodySquash: 0.75 * reach, headNod: 14 * reach, headTilt: 6 * reach, earL: -14, earR: 14 });
    if (t >= 5.3 && t < 8.0) Object.assign(J, RIG.FACES.annoyed, { eyeShape: 'half', eyeOpen: 0.7, sweat: 0, earL: -14, earR: 14, eyeLook: 0.9 });
    if (t >= 8.0 && t < 9.9) Object.assign(J, RIG.FACES.annoyed, { eyeOpen: 0.5, sweat: 0, earL: -6, earR: 6 });
    if (t >= 9.9) Object.assign(J, RIG.FACES.smug, { sparkle: 0, mouth: 'smile', eyeOpen: 0.5, eyeLook: 0.9 });
    const Jq = draw('jil', 'jil', J, t, { blink: !(t >= 2.5 && t < 8.0) });
    if (reach > 0) {  // 手を伸ばしてキーを押す（腕は体の後ろから、顔の前側＝左を通る）
      const px = 778, py = lerp(1640, 1180, ease(reach)), sx = 880, sy = 1620, mx = lerp(850, 735, reach), my = lerp(1620, 1420, reach);
      const jil = document.getElementById('jil');
      jil.insertBefore(el('path', { d: `M${sx} ${sy} Q${mx} ${my} ${px} ${py}`, fill: 'none', stroke: '#CFA174', 'stroke-width': 38, 'stroke-linecap': 'round' }), jil.firstChild);
      jil.appendChild(el('ellipse', { cx: px, cy: py - 4, rx: 26, ry: 21, fill: '#F6EBDC', stroke: '#B08155', 'stroke-width': 3 }));
    }

        const FACE_REN2 = { x: 400, y: 960 };
    const shots = [
      { t: 0.0, cx: 640, cy: 1040, z: 1.45, z2: 1.55 },             // A 状況：レンと画面の宛先（小さな顔がずらり）。カーソルが迷う
      { t: 1.9, cx: 880, cy: 1020, z: 2.45, z2: 2.6 },              // B 画面に寄る：びっくりが 小→中→大。取り消し連打
      { t: 3.85, cx: 780, cy: 1440, z: 2.1 },                       // C ジル：呆れ顔。無言
      { t: 4.4, cx: 880, cy: 1230, z: 1.3, z2: 1.35 },              // D 引き：ジルが手を伸ばして画面を閉じる
      { t: 5.15, cx: 480, cy: 980, z: 2.1, z2: 2.4 },               // E （間）固まったレン。画面は消えた。尻尾が右端でぷるっ
      { t: 6.15, cx: 540, cy: TAIL.y - 60, z: 2.3 },        // F オチ：尻尾だけが全力で震える
      { t: 7.45, cx: 890, cy: 1010, z: 2.4, z2: 2.55 },             // G オチの後：小窓に親指が次々
      { t: 9.4, cx: 700, cy: 1150, z: 1.2 }                         // H 引き：尻尾はまだ震えている。ジルはやれやれ
    ];
    camera(cameraAt(shots, t), 0);
    endcard(t, dur);
  }
};
