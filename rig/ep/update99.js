// 「更新バーが99%で止まる」（12秒）
// ゲーム：99%で止まった更新バーを待つ。①レンが小さく足トントン ②中くらいの足ダン ③大きい足ダン（でも99%のまま）
// ジルは1カットで「あきれ」。ポムは机の上でおとなしく待つ → 三人とも力尽きて寝る（壁の時計だけ進む）
// （間：無音で寝息）→ バーが100%に → 「再起動が必要です」→ 全員びっくりして起きる
// オチの後のオチ：誰も再起動せず、また待ち始める → 三人ともまた寝ている絵で終わる
window.EP = {
  dur: 12.0,
  bgmHolds: '6.3-7.2',
  sfx: [{ t: 0.4, type: 'tap' }, { t: 0.8, type: 'tap' }, { t: 1.5, type: 'tap' }, { t: 1.85, type: 'tap' },
        { t: 2.5, type: 'thump' }, { t: 2.55, type: 'boing' }, { t: 3.3, type: 'blink' },
        { t: 4.1, type: 'thump' }, { t: 4.15, type: 'boing' }, { t: 5.5, type: 'flop' }, { t: 5.9, type: 'flop' }, { t: 6.2, type: 'flop' },
        { t: 7.25, type: 'pon' }, { t: 7.5, type: 'chime' }, { t: 8.2, type: 'boing' }, { t: 8.3, type: 'pop' }, { t: 9.1, type: 'blink' },
        { t: 9.8, type: 'flop' }, { t: 10.0, type: 'flop' }, { t: 10.2, type: 'flop' }],
  frame(t) {
    const dur = this.dur;
    const S1 = shakeAt(t, 0.4, 0.2, 7), S2 = shakeAt(t, 0.8, 0.2, 7), S3 = shakeAt(t, 1.5, 0.2, 8), S4 = shakeAt(t, 1.85, 0.2, 8);
    const S5 = shakeAt(t, 2.5, 0.35, 16), S6 = shakeAt(t, 4.1, 0.5, 28);
    const S = { x: S1.x + S2.x + S3.x + S4.x + S5.x + S6.x, y: S1.y + S2.y + S3.y + S4.y + S5.y + S6.y };
    const clockMin = 55 * seg(t, 4.8, 7.0);
    office({ clock: [15, clockMin], shake: S, mug: false, papers: 'neat' });
    const f = clear('fx'), ui = clear('ui'), back = clear('back');

    // ---- 状態
    const full = t >= 7.25;                 // バーが100%
    const popup = t >= 7.5;
    const sleepRen = seg(t, 4.7, 5.6), sleepJil = seg(t, 5.3, 6.1), sleepPom = seg(t, 5.0, 5.9);
    const wake = t >= 8.2 && t < 9.4;
    const resleep = (a) => seg(t, a, a + 0.5);

    // ---- ポム（机の上）
    const PX = 600, PY = 1192, PS = 1.2;
    const q = { cheek: 0, eye: 'round', bow: 0, squash: 0, paws: 0, wob: 0, blush: 0.3, look: -0.4, mouth: 'w', sweat: 0 };
    if (t >= 3.3 && t < 4.7) { q.look = -0.2; q.sweat = 0; }
    if (t >= 1.5 && t < 2.5) q.wob = 0;
    // 足ダンでぴょこっと
    const pj = Math.max(pulse(t, 2.5, 2.9), 1.4 * pulse(t, 4.1, 4.6));
    q.squash = -0.2 * pj;
    let pomY = PY - 40 * pj;
    if (t >= 4.1 && t < 4.7) { q.eye = 'big'; q.mouth = 'o'; }
    if (t >= 4.7 && t < 8.2) { q.eye = 'happy'; q.blush = 0.8; q.wob = Math.sin(t * 2.4) * 5 * sleepPom; q.bow = 0.7 * sleepPom; q.look = 0; }
    if (wake) { q.eye = 'big'; q.mouth = 'o'; q.look = -0.6; q.bow = 0; q.wob = 0; q.squash = -0.35 * pulse(t, 8.2, 8.6); pomY = PY - 70 * pulse(t, 8.2, 8.7); }
    if (t >= 8.9 && t < 9.4) { q.eye = 'round'; q.mouth = 'w'; q.look = -0.7; q.squash = 0; }
    if (t >= 9.4) { q.eye = 'happy'; q.blush = 0.8; q.wob = Math.sin(t * 2.4) * 5 * resleep(9.4); q.bow = 0.7 * resleep(9.4); q.look = 0; }
    back.appendChild(pomDefs());
    // ---- 画面（99% → 100% → 再起動が必要です）
    screenUI(back, t, full, popup, S);
    back.appendChild(pomShape(PX + S.x, pomY + S.y, PS, q));
    const pomZ = (a, b) => seg(t, a, b);
    if (t >= 5.6 && t < 8.2) zz(f, PX + 60 + S.x, PY - 220 + S.y, t, 1.1);
    if (t >= 10.2) zz(f, PX + 60 + S.x, PY - 220 + S.y, t, 1.1);

    // ---- レン（床、机の手前）
    const RX = 120, RY = 1160;
    let R = Object.assign({}, RIG.POSES.sit, RIG.FACES.neutral, { scale: 1.45, x: RX + S.x, y: RY + S.y, eyeLook: 0.9, headNod: -6 });
    // ① 小さい足トントン（0.4 / 0.8 / 1.5 / 1.85）
    const tapU = Math.max(pulse(t, 0.3, 0.5), pulse(t, 0.7, 0.9), pulse(t, 1.4, 1.6), pulse(t, 1.75, 1.95));
    if (tapU > 0) { R.y = RY - 14 * tapU + S.y; R.headNod = -6 + 5 * tapU; }
    if (t >= 1.0 && t < 2.1) Object.assign(R, RIG.FACES.sharp, { eyeLook: 0.9 });
    // ② 中くらい（2.1→2.5着地） ③ 大きい（3.7→4.1着地）
    thumpPose(R, t, 2.1, 2.5, S, RY);
    if (t >= 2.5 && t < 3.7) Object.assign(R, RIG.FACES.annoyed, { sweat: 0, eyeLook: 0.9, eyeShape: 'round', eyeOpen: 0.9, mouth: 'open' });
    thumpPose(R, t, 3.7, 4.1, S, RY);
    if (t >= 4.1 && t < 4.7) Object.assign(R, RIG.FACES.angry, { excl: 0, eyeLook: 0.9 });
    // 力尽きて寝る
    if (t >= 4.7 && t < 8.2) Object.assign(R, RIG.POSES.sit, { x: RX + S.x, y: RY + S.y, scale: 1.45, eyeOpen: lerp(1, 0.06, ease(sleepRen)), eyeShape: sleepRen > 0.9 ? 'flat' : 'round', mouth: 'w', headNod: -6 + 28 * ease(sleepRen), zzz: seg(t, 5.2, 5.7), eyeLook: 0.9, sweat: 0, excl: 0, browAngle: 0 });
    if (wake) {
      const w = pulse(t, 8.2, 8.9);
      Object.assign(R, RIG.FACES.surprised, { zzz: 0, headNod: -10, y: RY - 110 * w + S.y, earL: -30 * w, earR: 30 * w });
      if (t >= 8.9) Object.assign(R, RIG.FACES.think, { question: pulse(t, 8.9, 9.4), eyeLook: 0.95, headNod: 0 });
    }
    if (t >= 9.4) Object.assign(R, RIG.FACES.sleepy, { eyeOpen: lerp(0.9, 0.06, ease(resleep(9.4))), eyeShape: resleep(9.4) > 0.9 ? 'flat' : 'round', headNod: -6 + 28 * ease(resleep(9.4)), zzz: seg(t, 9.8, 10.3), eyeLook: 0.9 });
    const Rq = draw('ren', 'ren', R, t, { blink: (t >= 4.7 && t < 8.2 && false) });
    thumpWave(f, t, 2.5, Rq.x + 120, 1730);
    thumpWave(f, t, 4.1, Rq.x + 120, 1730);

    // ---- ジル
    const JX = 520;
    let J = Object.assign({}, RIG.POSES.sit, RIG.FACES.neutral, { scale: 1.25, flip: true, x: JX + S.x, y: 1240 + S.y, eyeLook: 0.9 });
    if (t >= 1.1 && t < 2.5) Object.assign(J, { eyeLook: 0.9, mouth: 'line' });
    // あきれ：ひと息ついて、レンの方を細い目でじっと見る（中盤の寄り）
    if (t >= 2.5 && t < 4.7) Object.assign(J, RIG.FACES.annoyed, { sweat: 1, eyeLook: 1, eyeOpen: t > 3.3 && t < 3.45 ? 0.05 : 0.45, headTilt: 6 * seg(t, 2.6, 3.0) });
    if (t >= 4.1 && t < 4.7) Object.assign(J, RIG.FACES.annoyed, { sweat: 1, eyeOpen: 0.3, headTilt: 8 });
    if (t >= 4.7 && t < 8.2) Object.assign(J, RIG.FACES.annoyed, { eyeOpen: lerp(0.4, 0.06, ease(sleepJil)), eyeShape: 'flat', mouth: 'w', headNod: 20 * ease(sleepJil), headTilt: 0, sweat: 0, zzz: seg(t, 5.9, 6.3) });
    if (wake) {
      Object.assign(J, RIG.FACES.surprised, { zzz: 0, headNod: -8, y: 1240 - 70 * pulse(t, 8.25, 8.8) + S.y });
      if (t >= 8.9) Object.assign(J, RIG.FACES.annoyed, { sweat: 1, eyeLook: 1, eyeOpen: 0.45, eyeShape: 'flat', headNod: 0, headTilt: 6, zzz: 0 });
    }
    if (t >= 9.4) Object.assign(J, RIG.FACES.annoyed, { eyeOpen: lerp(0.45, 0.06, ease(resleep(9.5))), eyeShape: 'flat', mouth: 'w', headNod: 20 * ease(resleep(9.5)), headTilt: 0, sweat: 0, zzz: seg(t, 10.0, 10.4) });
    draw('jil', 'jil', J, t, { blink: !(t >= 2.5 && t < 4.7) && !(t >= 4.7 && t < 8.2) });

    const punch = Math.max(impactAt(ui, t, 4.1) * 0.8, 0);
    const SCREEN = { x: 850, y: 1060 };
    const FJ = { x: 520 + 212 * 1.25, y: 1490 };
    const shots = [
      { t: 0.0, cx: 790, cy: 1070, z: 2.7, z2: 2.9 },        // A 寄り：画面いっぱいの99%、バーが止まっている
      { t: 1.1, cx: 480, cy: 1210, z: 1.3 },                          // B 中：三人で待つ、足トントン→足ダン
      { t: 2.9, cx: FJ.x - 60, cy: FJ.y - 20, z: 2.2 },               // C 寄り：ジルのあきれ顔
      { t: 3.6, cx: 480, cy: 1210, z: 1.25 },                         // D 中：大きい足ダン（でも99%）
      { t: 4.9, cx: 540, cy: 1000, z: 1.0, z2: 1.12 },                // E 引き：三人とも寝る、時計だけ進む（間）
      { t: 7.0, cx: SCREEN.x, cy: SCREEN.y, z: 2.6, z2: 2.8 },        // F 寄り：100%、「再起動が必要です」
      { t: 7.9, cx: 480, cy: 1210, z: 1.3 },                          // G 中：全員びっくりして起きる
      { t: 8.9, cx: 500, cy: 1160, z: 1.5 },                         // H 中寄り：レン、迷う／ジル、あきれ
      { t: 10.0, cx: 540, cy: 1000, z: 1.0 }                          // I 引き：また三人とも寝ている
    ];
    camera(cameraAt(shots, t), punch);
    endcard(t, dur);
  }
};

// Zz
function zz(f, x, y, t, s) {
  [0, 1, 2].forEach(i => {
    const v = (t * 0.5 + i / 3) % 1;
    f.appendChild(el('text', { x: x + i * 22 + 10 * Math.sin(v * 6), y: y - v * 90, 'font-size': (26 + i * 8) * s, 'font-weight': 900, fill: '#3B2E22', opacity: Math.sin(Math.PI * v) }, [document.createTextNode('Z')]));
  });
}

// モニターの中身。更新ウィンドウ（99%の大きいバー）→ 100% → 再起動ポップアップ
function screenUI(back, t, full, popup, S) {
  const x0 = 718 + S.x, y0 = 978 + S.y, W = 264, H = 160;
  const g = [];
  g.push(el('rect', { x: x0, y: y0, width: W, height: H, rx: 8, fill: '#2F6FB5' }));
  g.push(el('rect', { x: x0 + 10, y: y0 + 10, width: W - 20, height: H - 20, rx: 6, fill: '#F7FAFD' }));
  // 回るスピナー（止まっていない印）
  const sx = x0 + 34, sy = y0 + 38;
  if (!full) {
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 - t * 6; g.push(el('circle', { cx: sx + Math.cos(a) * 12, cy: sy + Math.sin(a) * 12, r: 2.2 + 2 * ((i + Math.floor(t * 0)) % 8) / 8, fill: '#2F6FB5', opacity: 0.35 + 0.65 * (i / 8) })); }
  } else g.push(el('circle', { cx: sx, cy: sy, r: 13, fill: '#3FA34D' }), el('path', { d: `M${sx - 6} ${sy} l4 5 l9 -10`, fill: 'none', stroke: '#FFFFFF', 'stroke-width': 3.5, 'stroke-linecap': 'round' }));
  if (!popup) {
  // 大きな数字
  g.push(el('text', { x: x0 + 156, y: y0 + 56, 'text-anchor': 'middle', 'font-size': 56, 'font-weight': 900, fill: full ? '#2E8B3F' : '#1F3F66', 'font-family': 'Noto Sans, sans-serif' }, [document.createTextNode(full ? '100%' : '99%')]));
  // バー
  const bx = x0 + 22, by = y0 + 86, bw = W - 44, bh = 26;
  g.push(el('rect', { x: bx, y: by, width: bw, height: bh, rx: 6, fill: '#D5DEE9', stroke: '#1F3F66', 'stroke-width': 3 }));
  const fw = full ? bw : bw * 0.97;
  const clipId = 'barclip';
  g.push(el('defs', {}, [el('clipPath', { id: clipId }, [el('rect', { x: bx, y: by, width: fw, height: bh, rx: 6 })])]));
  g.push(el('rect', { x: bx, y: by, width: fw, height: bh, rx: 6, fill: full ? '#3FA34D' : '#3E86D6' }));
  if (!full) {
    const stripes = [];
    const off = (t * 40) % 24;
    for (let i = -2; i < 12; i++) stripes.push(el('path', { d: `M${bx + i * 24 + off} ${by + bh} l12 -${bh} h10 l-12 ${bh} Z`, fill: '#FFFFFF', opacity: 0.28 }));
    g.push(el('g', { 'clip-path': `url(#${clipId})` }, stripes));
    // 残り1%の小さな隙間（ここが主役）
    g.push(el('rect', { x: bx + fw - 1, y: by, width: bw - fw + 1, height: bh, fill: '#D5DEE9', opacity: 0 }));
  }
  g.push(el('text', { x: x0 + W / 2, y: y0 + 134, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: '#5C6F86', 'font-family': 'Noto Sans, sans-serif' }, [document.createTextNode(full ? 'Update complete' : 'Updating...')]));
  }
  if (popup) {
    const u = ease(seg(t, 7.5, 7.8)), pw = W - 20, ph = H - 20, px = x0 + 10, py = y0 + 10 - (1 - u) * 14;
    g.push(el('g', { opacity: u }, [
      el('rect', { x: px, y: py, width: pw, height: ph, rx: 8, fill: '#FFFFFF', stroke: '#C8463C', 'stroke-width': 4 }),
      el('path', { d: `M${px + 30} ${py + 22} l18 32 h-36 Z`, fill: '#F2C14E', stroke: '#3B2E22', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }),
      el('text', { x: px + 30, y: py + 49, 'text-anchor': 'middle', 'font-size': 19, 'font-weight': 900, fill: '#3B2E22' }, [document.createTextNode('!')]),
      el('text', { x: px + 140, y: py + 50, 'text-anchor': 'middle', 'font-size': 24, 'font-weight': 900, fill: '#3B2E22', 'font-family': 'Noto Sans, sans-serif' }, [document.createTextNode('Restart now')]),
      el('rect', { x: px + 40, y: py + 80, width: pw - 80, height: 44, rx: 10, fill: '#E8742C' }),
      el('text', { x: px + pw / 2, y: py + 111, 'text-anchor': 'middle', 'font-size': 26, 'font-weight': 900, fill: '#FFFFFF', 'font-family': 'Noto Sans, sans-serif' }, [document.createTextNode('RESTART')])
    ]));
  }
  back.appendChild(el('g', {}, g));
}

// ---------- ポム（キンクマハムスター）の SVG。pom_debut.js と同じ描き方 ----------
const POM = { a: '#F3E3CA', b: '#DCC29E', deep: '#C9A57A', cream: '#FAF1E4', earO: '#8E786C', earI: '#E9A9A2', nose: '#E58F98', pink: '#F2B8B0', band: '#C8263C', eye: '#0B0D10' };
function pomDefs() {
const st = (o, c, a) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a == null ? 1 : a });
return el('defs', {}, [
el('filter', { id: 'pomfur', x: '-10%', y: '-10%', width: '120%', height: '120%' }, [
el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.7', numOctaves: '2', seed: '21', result: 'n' }),
el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: '5', xChannelSelector: 'R', yChannelSelector: 'G' })]),
el('filter', { id: 'pomblur', x: '-40%', y: '-40%', width: '180%', height: '180%' }, [el('feGaussianBlur', { stdDeviation: 4 })]),
el('radialGradient', { id: 'pombody', cx: 0.4, cy: 0.3, r: 0.8 }, [st(0, POM.a), st(0.6, POM.b), st(1, POM.deep)]),
el('radialGradient', { id: 'pomhead', cx: 0.5, cy: 0.4, r: 0.65 }, [st(0, '#F7E9D3'), st(0.6, POM.a), st(1, POM.b)]),
el('radialGradient', { id: 'pomcheek', cx: 0.45, cy: 0.4, r: 0.6 }, [st(0, '#FFFFFF'), st(0.62, POM.cream), st(0.9, '#EBDCC6'), st(1, '#D9C4A4')])
]);
}
// q = { cheek 0〜1, eye 'round'|'happy'|'big', bow 0〜1, squash, paws 0/1, wob(deg), blush, look -1〜1, mouth 'w'|'o' }
function pomShape(x, y, s, q) {
const fur = { filter: 'url(#pomfur)' };
const E = (cx, cy, rx, ry, fill, ex) => el('ellipse', Object.assign({ cx, cy, rx, ry, fill }, ex || {}));
const sq = q.squash || 0, sy = 1 + sq * 0.6, sx = 1 - sq * 0.4;
const c = q.cheek || 0, bow = q.bow || 0;
const hy = -128 + 16 * bow; // 頭の中心
const body = [
E(0, 2, 78, 9, '#3B2A20', { opacity: 0.18, filter: 'url(#pomblur)' }),
E(-30, -5, 17, 8, POM.pink), E(30, -5, 17, 8, POM.pink),
E(0, -60, 76, 62, 'url(#pombody)', fur),
E(0, -46, 48, 40, POM.cream, Object.assign({ opacity: 0.95 }, fur)),
// 若葉の社員バッジ
el('g', { transform: 'translate(-30 -40) scale(0.9)' }, [
el('path', { d: 'M0 12 L-9 0 L-9 -11 L0 -4 Z', fill: '#F2C230', stroke: '#B8901C', 'stroke-width': 1 }),
el('path', { d: 'M0 12 L9 0 L9 -11 L0 -4 Z', fill: '#3FA34D', stroke: '#2C7A37', 'stroke-width': 1 })])
];
// 手：ふだんはおなかの前、受け取るときはバンザイ
const pw = q.paws ? [E(-26, -96, 11, 9, POM.pink), E(26, -96, 11, 9, POM.pink)] : [E(-20, -70, 10, 8, POM.pink), E(20, -70, 10, 8, POM.pink)];
const ear = sd => el('g', { transform: `translate(${sd * 42} ${hy - 44}) rotate(${sd * 22})` }, [E(0, 0, 17, 18, POM.earO, fur), E(0, 2, 12, 13, POM.earI)]);
const cr = 1 + 1.45 * c;
const cheek = sd => E(sd * (34 + 24 * c), hy + 18 + 8 * c, 26 * cr, 22 * (1 + 1.1 * c), 'url(#pomcheek)', fur);
const eyeY = hy - 6, ex = 22 + 2 * c, look = 2.5 * (q.look || 0);
const eye = sd => {
const cx = sd * ex + look;
if (q.eye === 'happy') return el('path', { d: `M${cx - 9} ${eyeY + 3} Q${cx} ${eyeY - 9} ${cx + 9} ${eyeY + 3}`, fill: 'none', stroke: POM.eye, 'stroke-width': 4, 'stroke-linecap': 'round' });
const r = q.eye === 'big' ? 12 : 9.5;
return el('g', {}, [E(cx, eyeY, r * 0.92, r * 1.05, POM.eye), E(cx + 3, eyeY - 4, r * 0.32, r * 0.3, '#FFFFFF'), E(cx - 2.5, eyeY + 4, r * 0.14, r * 0.12, '#FFFFFF', { opacity: 0.7 })]);
};
const mouth = q.mouth === 'o' ? E(0, hy + 30, 4, 5, '#B5615E') :
el('path', { d: `M0 ${hy + 24} V${hy + 28} M0 ${hy + 28} q-4 4 -8 2 M0 ${hy + 28} q4 4 8 2`, fill: 'none', stroke: '#9A5A50', 'stroke-width': 2, 'stroke-linecap': 'round' });
const head = el('g', { transform: `rotate(${q.wob || 0} 0 ${hy + 40})` }, [
ear(-1), ear(1),
E(0, hy, 64, 55, 'url(#pomhead)', fur),
E(0, hy - 24, 44, 26, '#E2BE8C', { opacity: 0.4, filter: 'url(#pomblur)' }), // 頭の上のあんず色
cheek(-1), cheek(1),
E(-36 - 18 * c, hy + 16, 9 + 6 * c, 5 + 3 * c, '#EC8C8C', { opacity: 0.45 * (q.blush || 0) }), E(36 + 18 * c, hy + 16, 9 + 6 * c, 5 + 3 * c, '#EC8C8C', { opacity: 0.45 * (q.blush || 0) }),
eye(-1), eye(1),
E(0, hy + 14, 6.5, 4.8, POM.nose),
mouth,
el('path', { d: `M-14 ${hy + 18} L-${54 + 20 * c} ${hy + 10} M-14 ${hy + 22} L-${52 + 20 * c} ${hy + 26} M14 ${hy + 18} L${54 + 20 * c} ${hy + 10} M14 ${hy + 22} L${52 + 20 * c} ${hy + 26}`, fill: 'none', stroke: '#FFFFFF', 'stroke-width': 1.3, opacity: 0.85 }),
// はちまき
el('path', { d: `M-54 ${hy - 24} Q0 ${hy - 44} 54 ${hy - 24}`, fill: 'none', stroke: POM.band, 'stroke-width': 10, 'stroke-linecap': 'round' }),
el('path', { d: `M-44 ${hy - 28} Q0 ${hy - 45} 44 ${hy - 28}`, fill: 'none', stroke: '#FFFFFF', 'stroke-width': 2, opacity: 0.4 }),
el('path', { d: `M50 ${hy - 26} q16 2 22 12 l-6 4 q-6 -8 -16 -10 Z M50 ${hy - 26} q18 -6 26 0 l-4 6 q-8 -4 -20 0 Z`, fill: POM.band })
]);
const sw = q.sweat ? [el('path', { d: `M58 ${hy - 46} q-9 14 0 20 q9 -6 0 -20 Z`, fill: '#CFE2F1', stroke: '#4E77A0', 'stroke-width': 2.5, opacity: q.sweat })] : [];
return el('g', { transform: `translate(${x} ${y}) scale(${s * sx} ${s * sy})` }, [...body, head, ...pw, ...sw]);
}
