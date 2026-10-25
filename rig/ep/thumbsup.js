// 「了解です」スタンプ（セリフなし・約11秒）
// ゲーム：チャットの通知が来るたび、レンが親指スタンプをぽんと押す。①資料依頼(小) ②トラブル(中) ③ジルの「辞めます」(大)にも親指。
// ジルが固まる → レンが気づいて土下座スタンプを連打（画面いっぱい）→（間）→ オチ：レンの親指だけが勝手に動いて親指スタンプを押し続ける。ジルはあきれ顔
const SCR = { x: 556, y: 396, w: 468, h: 738 };          // チャット画面（ワールド座標）
const ROW0 = [485, 690, 895];                              // 3つの通知の行
const ARR = [0.0, 2.55, 4.4];                              // 通知が来る時刻
const TAP = [0.8, 3.3, 5.1];                               // レンが親指を押す時刻
const DOG = [7.05, 7.28, 7.47, 7.63, 7.77, 7.89, 8.0];   // 土下座スタンプ連打
const TH2 = [8.95, 9.4, 9.8, 10.1, 10.32];              // 勝手に押す親指（だんだん速く）

function thumbShape(s, fill, stroke) {                    // 親指を立てたこぶし（原点＝中心、s=大きさ）
  return el('g', { transform: `scale(${s})` }, [
    el('rect', { x: -34, y: -4, width: 68, height: 52, rx: 16, fill, stroke, 'stroke-width': 5 }),
    el('path', { d: 'M-12 -2 L-12 -34 Q-12 -52 4 -50 Q16 -48 14 -34 L12 -4 Z', fill, stroke, 'stroke-width': 5, 'stroke-linejoin': 'round' }),
    ...[10, 22, 34].map(y => el('path', { d: `M-34 ${y} h22`, stroke, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.7 })),
    el('rect', { x: -40, y: 2, width: 12, height: 44, rx: 6, fill: '#6F8FB0', stroke, 'stroke-width': 4 })
  ]);
}
function stampThumb(cx, cy, r, pop) {                      // 親指スタンプ（黄色い丸）
  return el('g', { transform: `translate(${cx} ${cy}) scale(${pop})` }, [
    el('circle', { r, fill: '#F2C14E', stroke: '#FFFFFF', 'stroke-width': r * 0.08 }),
    el('g', { transform: `translate(0 ${r * 0.08})` }, [thumbShape(r / 62, '#FFF3D6', '#7A5A2E')])
  ]);
}
function stampDogeza(cx, cy, r, pop, rot) {                // 土下座スタンプ（うさぎが額を床につけている）
  const k = r / 60, fur = '#E3C29C', ds = '#8E7057';
  return el('g', { transform: `translate(${cx} ${cy}) rotate(${rot}) scale(${pop * k})` }, [
    el('circle', { r: 60, fill: '#F7D9D2', stroke: '#FFFFFF', 'stroke-width': 5 }),
    el('line', { x1: -50, y1: 34, x2: 50, y2: 34, stroke: '#B98A5A', 'stroke-width': 5, 'stroke-linecap': 'round' }),
    el('ellipse', { cx: 14, cy: 8, rx: 30, ry: 24, fill: fur, stroke: ds, 'stroke-width': 4 }),
    el('circle', { cx: 36, cy: 8, r: 8, fill: '#F3E7D6' }),
    el('circle', { cx: -22, cy: 24, r: 14, fill: fur, stroke: ds, 'stroke-width': 4 }),
    el('ellipse', { cx: -6, cy: 26, rx: 20, ry: 7, fill: ds, transform: 'rotate(-8 -6 26)' }),
    el('path', { d: 'M12 26 q12 6 26 4', stroke: ds, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }),
    el('path', { d: 'M-32 10 q-8 -12 -26 -8', stroke: '#C7A077', 'stroke-width': 8, fill: 'none', 'stroke-linecap': 'round' }),
    el('path', { d: 'M-40 0 q6 -10 0 -16 M-30 -4 q6 -10 0 -16', stroke: '#6AA5D8', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' })
  ]);
}
function bubbleBase(x, y, w, h, color, edge) {
  return [el('rect', { x, y, width: w, height: h, rx: 22, fill: color, stroke: edge, 'stroke-width': 5 }), el('path', { d: `M${x + 18} ${y + h - 4} l-12 18 l30 -14 Z`, fill: color, stroke: edge, 'stroke-width': 5, 'stroke-linejoin': 'round' })];
}
function msgIcon(kind, x, y, pop, t) {                     // 通知の中身（絵だけ）。0=資料依頼(小) 1=トラブル(中) 2=ジルの辞めます(大)
  const g = [];
  if (kind === 0) {
    g.push(...bubbleBase(0, 0, 130, 96, '#FFFFFF', '#9FB3C8'));
    g.push(el('rect', { x: 34, y: 14, width: 62, height: 68, rx: 6, fill: '#FDFBF6', stroke: '#8A97A6', 'stroke-width': 4 }));
    [30, 44, 58].forEach(yy => g.push(el('rect', { x: 44, y: yy, width: 42 - (yy % 3) * 3, height: 6, rx: 3, fill: '#B8C4D0' })));
    g.push(el('path', { d: 'M96 14 v22 h-26', fill: 'none', stroke: '#8A97A6', 'stroke-width': 0 }));
  } else if (kind === 1) {
    g.push(...bubbleBase(0, 0, 200, 140, '#FFE9E5', '#D9564A'));
    g.push(el('path', { d: 'M100 14 L168 118 H32 Z', fill: '#F2C14E', stroke: '#D9564A', 'stroke-width': 7, 'stroke-linejoin': 'round' }));
    g.push(el('rect', { x: 94, y: 48, width: 12, height: 36, rx: 5, fill: '#3B2E22' }), el('circle', { cx: 100, cy: 100, r: 7, fill: '#3B2E22' }));
  } else {
    g.push(...bubbleBase(0, 0, 290, 182, '#FFFFFF', '#355F86'));
    g.push(el('circle', { cx: 52, cy: 56, r: 34, fill: '#355F86' }), el('ellipse', { cx: 40, cy: 30, rx: 8, ry: 22, fill: '#355F86', transform: 'rotate(-6 40 30)' }), el('ellipse', { cx: 66, cy: 30, rx: 8, ry: 22, fill: '#355F86', transform: 'rotate(6 66 30)' }));
    g.push(el('circle', { cx: 42, cy: 58, r: 4, fill: '#FFFFFF' }), el('circle', { cx: 62, cy: 58, r: 4, fill: '#FFFFFF' }));
    g.push(el('rect', { x: 110, y: 40, width: 150, height: 100, rx: 8, fill: '#FFFDF8', stroke: '#6B7A8C', 'stroke-width': 5 }));
    g.push(el('path', { d: 'M110 44 L185 100 L260 44', fill: 'none', stroke: '#6B7A8C', 'stroke-width': 5, 'stroke-linejoin': 'round' }));
    g.push(el('circle', { cx: 185, cy: 108, r: 14, fill: '#C8463C', stroke: '#8A2A22', 'stroke-width': 3 }));
  }
  return el('g', { transform: `translate(${x} ${y}) scale(${pop})` }, g);
}

window.EP = {
  dur: 11.4,
  bgmHolds: '8.1-8.9',
  sfx: [{ t: 0.05, type: 'pop' }, { t: 0.8, type: 'pon' }, { t: 2.55, type: 'pop' }, { t: 3.3, type: 'pon' },
        { t: 4.4, type: 'pop' }, { t: 5.1, type: 'pon' }, { t: 5.15, type: 'boing' }, { t: 6.8, type: 'twitch' },
        { t: 7.05, type: 'tap' }, { t: 7.28, type: 'tap' }, { t: 7.47, type: 'tap' }, { t: 7.63, type: 'tap' }, { t: 7.77, type: 'tap' }, { t: 7.89, type: 'tap' }, { t: 8.0, type: 'thump' },
        { t: 8.95, type: 'pon' }, { t: 9.4, type: 'pon' }, { t: 9.8, type: 'pon' }, { t: 10.1, type: 'pon' }, { t: 10.32, type: 'pon' }, { t: 9.6, type: 'swish' }],
  frame(t) {
    const dur = this.dur;
    office({ clock: [9, 20] });
    const f = clear('fx'), back = clear('back'), ui = clear('ui');
    const popK = (a, d = 0.22) => { const u = seg(t, a, a + d); return u <= 0 ? 0 : (u >= 1 ? 1 : 1 + 0.25 * Math.sin(Math.PI * u) * (1 - u) + (u - 1) * 0) * Math.min(1, u * 1.6); };

    // ---- 画面（大きなモニター）
    back.appendChild(el('rect', { x: 760, y: 1140, width: 60, height: 60, fill: '#3B4A5A' }));
    back.appendChild(el('rect', { x: 540, y: 380, width: 500, height: 770, rx: 26, fill: '#3B4A5A' }));
    back.appendChild(el('clipPath', { id: 'scr' }, [el('rect', { x: SCR.x, y: SCR.y, width: SCR.w, height: SCR.h, rx: 12 })]));
    const sc = el('g', { 'clip-path': 'url(#scr)' });
    back.appendChild(sc);
    sc.appendChild(el('rect', { x: SCR.x, y: SCR.y, width: SCR.w, height: SCR.h, fill: '#EAF1F7' }));
    sc.appendChild(el('rect', { x: SCR.x, y: SCR.y, width: SCR.w, height: 74, fill: '#4F7FA8' }));
    sc.appendChild(el('circle', { cx: SCR.x + 44, cy: SCR.y + 37, r: 22, fill: '#DDE9F4' }));
    sc.appendChild(el('rect', { x: SCR.x + 82, y: SCR.y + 28, width: 130, height: 18, rx: 9, fill: '#DDE9F4' }));
    for (let i = 0; i < 3; i++) {
      const arr = seg(t, ARR[i], ARR[i] + 0.3), kick = i === 1 ? Math.sin((t - ARR[i]) * 60) * 7 * (1 - seg(t, ARR[i], ARR[i] + 0.4)) : 0;
      if (arr <= 0) continue;
      const x0 = SCR.x + 16 + kick, y0 = ROW0[i];
      sc.appendChild(msgIcon(i, x0 - 120 * (1 - ease(arr)), y0, 0.7 + 0.3 * ease(arr), t));
      // 通知の丸（新着）
      if (t < TAP[i]) sc.appendChild(el('circle', { cx: x0 + (i === 0 ? 140 : i === 1 ? 212 : 300), cy: y0 + 8, r: 14 + 4 * Math.sin(t * 14), fill: '#E0483C', stroke: '#FFFFFF', 'stroke-width': 4 }));
      const rr = [46, 70, 92][i], p = popK(TAP[i], 0.25);
      if (p > 0) sc.appendChild(stampThumb(SCR.x + SCR.w - 20 - rr, y0 + [58, 78, 98][i] + (i === 2 ? 40 : 0), rr, p));
    }
    // 土下座スタンプ（画面いっぱいに積もる）
    const dpos = [[790, 560, 120, -8], [680, 840, 150, 10], [900, 760, 160, 6], [740, 1010, 170, -6], [880, 980, 190, 8], [790, 700, 230, -4], [790, 800, 330, 3]];
    DOG.forEach((a, i) => { const p = popK(a, 0.16); if (p > 0) sc.appendChild(stampDogeza(dpos[i][0], dpos[i][1], dpos[i][2], p, dpos[i][3])); });
    // 勝手に押される親指スタンプ（だんだん大きく）
    TH2.forEach((a, i) => { const p = popK(a, 0.2); if (p > 0 && !(i < TH2.length - 1 && t > TH2[i] + 0.0 && false)) sc.appendChild(stampThumb(790 + (i % 2 ? 40 : -40), 760 + (i % 3) * 40 - 40, 90 + 24 * i, p)); });

    // ---- レン
    const RX = 250, RY = 668;
    let R = Object.assign({}, RIG.POSES.sit, RIG.FACES.smile, { scale: 1.3, x: RX, y: RY, eyeLook: 0.7, blush: 0.2 });
    const fistT = [0, 0, 0];
    let fist = 0, shake = 0;                                     // 親指の押し込み 0〜1
    TAP.forEach((a, i) => { fist = Math.max(fist, pulse(t, a - 0.3, a + 0.25) * (t < a + 0.05 ? seg(t, a - 0.3, a) : 1)); });
    if (t >= 2.2 && t < 5.4) Object.assign(R, RIG.FACES.neutral, { eyeLook: 0.7 });
    if (t >= 3.3 && t < 5.4) Object.assign(R, RIG.FACES.smile, { blush: 0.2 });
    if (t >= 5.1 && t < 6.4) Object.assign(R, RIG.FACES.smile, { blush: 0.7, sparkle: pulse(t, 5.1, 5.9), eyeLook: 0.7 });
    if (t >= 6.4 && t < 6.9) Object.assign(R, RIG.FACES.surprised, { excl: pulse(t, 6.5, 6.9), y: RY - 40 * pulse(t, 6.4, 6.8), eyeLook: 0.7 });
    if (t >= 6.9 && t < 8.1) { Object.assign(R, RIG.FACES.oops, { mouth: 'open', eyeOpen: 1.2, eyeLook: 0.7, sweat: 1, headTilt: 8 * Math.sin(t * 38), bodyTilt: 5 * Math.sin(t * 38 + 1), y: RY - 12 * Math.abs(Math.sin(t * 19)) }); shake = 1; }
    if (t >= 8.1 && t < 8.9) Object.assign(R, RIG.FACES.oops, { eyeOpen: 0.15, eyeShape: 'flat', mouth: 'wavy', headNod: 20 * seg(t, 8.1, 8.6), eyeLook: 0, sweat: 1 });
    const tw = TH2.reduce((m, a) => Math.max(m, pulse(t, a - 0.12, a + 0.12)), 0);
    if (t >= 8.9) Object.assign(R, RIG.FACES.surprised, { excl: 0, sweat: 1, eyeLook: 0.3, mouth: t > 10.3 ? 'wavy' : 'open', headNod: 4, y: RY });
    if (t >= 10.3) Object.assign(R, RIG.FACES.oops, { eyeLook: 0.3, mouth: 'wavy', eyeOpen: 0.9 });
    const Rq = draw('ren', 'ren', R, t, { blink: false });

    // ---- レンの親指（手前）。押すたびにぽんと動く／ラストは勝手に動く
    let fx = 0, fy = 0, frot = 0;
    if (t < 8.9) { fy = 40 * fist; frot = -10 * fist; if (shake) { fy = 22 * Math.abs(Math.sin(t * 38)); frot = 14 * Math.sin(t * 38); } }
    else { fy = 46 * tw; frot = -14 * tw + 5 * Math.sin(t * 50) * (t > 9.2 ? 1 : 0); }
    fx = (t >= 8.9 && t < 12) ? 3 * Math.sin(t * 60) : 0;
    f.appendChild(el('g', { transform: `translate(${585 + fx} ${1120 + fy * 0.6}) rotate(${frot})` }, [thumbShape(1.5, '#E3C29C', '#8E7057')]));
    if (t >= 8.9 && tw > 0.2) for (let i = 0; i < 3; i++) f.appendChild(el('path', { d: `M${535 - i * 14} ${1080 + i * 22} q-18 6 -30 0`, stroke: '#8E7057', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round', opacity: 0.8 }));

    // ---- ジル
    const JX = 640;
    let J = Object.assign({}, RIG.POSES.sit, RIG.FACES.neutral, { scale: 1.25, flip: true, x: JX, y: 1240, eyeLook: 0.9 });
    if (t >= 1.5 && t < 2.6) Object.assign(J, RIG.FACES.annoyed, { eyeOpen: 0.45, sweat: 0.4, eyeLook: -0.6 });   // 課長の返信を見て、ため息
    if (t >= 4.4 && t < 5.4) Object.assign(J, RIG.FACES.sharp, { eyeLook: 0.9 });
    if (t >= 5.4 && t < 5.9) Object.assign(J, RIG.FACES.surprised, { excl: 0, eyeOpen: 1.3 });
    if (t >= 5.9 && t < 8.9) Object.assign(J, RIG.FACES.sharp, { eyeOpen: 1.2, mouth: 'line', sweat: 0, earL: 6, earR: -6 });
    if (t >= 8.9) Object.assign(J, RIG.FACES.annoyed, { eyeOpen: 0.4, sweat: 0.8, eyeLook: -0.5, headTilt: -6 });
    const Jq = draw('jil', 'jil', J, t, { blink: !(t >= 5.4 && t < 8.9) });
    if (t >= 5.9 && t < 8.9) { const k = seg(t, 5.9, 6.2); for (let i = 0; i < 5; i++) f.appendChild(el('line', { x1: 780 + i * 24, y1: 1330, x2: 780 + i * 24, y2: 1330 + 60 * k + (i % 2) * 14, stroke: '#4A5A6E', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0.75 })); }
    if (t >= 9.6 && t < 11) { const u = seg(t, 9.6, 10.6); for (let i = 0; i < 3; i++) f.appendChild(el('circle', { cx: 700 - u * 60 - i * 22, cy: 1500 - u * 24 - i * 6, r: (14 + i * 9) * (0.4 + u), fill: '#FFFFFF', opacity: 0.8 * (1 - u) })); }

    // ---- カメラ
    const shots = [
      { t: 0.0, cx: 650, cy: 850, z: 1.3, z2: 1.4 },                       // A 中：チャット画面とレンの親指
      { t: 1.4, cx: FACE_JIL.x - 60, cy: FACE_JIL.y - 20, z: 2.3 },          // B 寄り：ジル、課長の返信にあきれ（心の声）
      { t: 2.4, cx: 600, cy: 840, z: 1.6 },                                  // C 中：トラブル通知、親指
      { t: 4.2, cx: 790, cy: 860, z: 2.2, z2: 2.6 },                         // D 寄り：ジルの辞めます、親指
      { t: 5.45, cx: FACE_JIL.x - 60, cy: FACE_JIL.y - 20, z: 2.6, z2: 2.9 },// E 寄り：ジル固まる
      { t: 6.3, cx: 440, cy: 880, z: 2.0 },                                  // F 寄り：レン、気づく
      { t: 6.9, cx: 600, cy: 860, z: 1.4 },                                  // G 中：土下座連打
      { t: 8.1, cx: 440, cy: 900, z: 1.9, z2: 2.4 },                         // H 寄り：ため（無音）
      { t: 8.8, cx: 520, cy: 960, z: 1.6 },                                  // I 中：親指が勝手に動く
      { t: 9.5, cx: 640, cy: 1160, z: 1.25, z2: 1.35 }                      // J 中：ジルあきれ顔と、止まらない親指が両方入る
    ];
    camera(cameraAt(shots, t), 0);
    endcard(t, dur);
  }
};
