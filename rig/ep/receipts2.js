// 第8話 v2「牧草の領収書の山とジルの電卓」（約22秒）
// ゲーム：経費精算の領収書がぜんぶ「牧草」。①1枚→ジル無言 ②5枚どさっ→電卓の桁が増えて目がピクッ ③山ごとどーん→ジルが領収書に埋もれる（耳だけ出る）
// （間：耳だけピクッ）→山の中から足ダン→領収書が舞ってぴしっと揃う → オチの後のオチ：課長が1枚もぐもぐ→ジルもこっそり1枚もぐもぐ
window.EP = {
  dur: 22.0,
  bgmHolds: '10.6-11.6',
  sfx: [{ t: 1.2, type: 'swish' }, { t: 2.2, type: 'click' }, { t: 2.9, type: 'blink' },
        { t: 4.4, type: 'swish' }, { t: 4.6, type: 'swish' }, { t: 4.8, type: 'swish' }, { t: 5.4, type: 'click' }, { t: 5.6, type: 'click' }, { t: 5.8, type: 'click' }, { t: 6.4, type: 'twitch' }, { t: 6.65, type: 'twitch' },
        { t: 8.0, type: 'boing' }, { t: 8.6, type: 'flop' }, { t: 8.7, type: 'whoosh' }, { t: 10.0, type: 'twitch' },
        { t: 11.6, type: 'thump' }, { t: 11.7, type: 'whoosh' }, { t: 12.6, type: 'pop' }, { t: 15.6, type: 'pop' }, { t: 18.4, type: 'pop' }],
  frame(t) {
    const dur = this.dur, sh = shakeAt(t, 11.6, 0.5, 26);
    office({ clock: [16, 40], shake: sh, papers: 'neat' });
    const f = clear('fx'), ui = clear('ui'), back = clear('back');
    const JX = 620;

    // ---- 領収書
    const slip = (x, y, r, s = 1, layer = back) => layer.appendChild(el('g', { transform: `translate(${x} ${y}) rotate(${r}) scale(${s})` }, [
      el('rect', { x: -50, y: -29, width: 100, height: 58, rx: 4, fill: '#FFFDF7', stroke: '#D8CBB6', 'stroke-width': 3 }),
      el('path', { d: 'M-32 15 q8 -26 4 -30 M-24 15 q2 -24 10 -28 M-16 15 q-4 -20 6 -24', fill: 'none', stroke: '#7CB36A', 'stroke-width': 3.5, 'stroke-linecap': 'round' }),
      el('rect', { x: 0, y: -13, width: 36, height: 6, rx: 3, fill: '#D9DEE4' }), el('rect', { x: 0, y: 1, width: 28, height: 6, rx: 3, fill: '#D9DEE4' })]));
    // 床のジルの前に積まれる領収書（1枚→6枚→山）
    const floorX = JX + 160, floorY = 1690;
    const fly = seg(t, 11.65, 12.6);
    let count = t < 1.2 ? 0 : t < 4.4 ? 1 : t < 4.9 ? 1 + Math.floor(seg(t, 4.4, 4.9) * 5) + 1 : t < 8.6 ? 6 : 34;
    for (let i = 0; i < count; i++) {
      const h = (i * 7919) % 100 / 100;
      let x = floorX + (h - 0.5) * (i < 6 ? 120 : 360), y = floorY - (i < 6 ? i * 10 : 30 + (i - 6) * 4.5 * (0.6 + h * 0.5))  /* 山は体まで。目とメガネは山の上に出る（顔は隠さない） */, r = (h - 0.5) * (i < 6 ? 40 : 120);
      if (i >= 6 && t < 8.9) y -= (1 - seg(t, 8.6, 8.9)) * 500;   // 山がどさっと落ちる
      if (fly > 0) { const nx = 820, ny = 1170 - i * 4; x = lerp(x, nx, ease(fly)); y = lerp(y, ny, ease(fly)) - Math.sin(Math.PI * fly) * (300 + i * 8); r = lerp(r, 0, ease(fly)); }
      slip(x + sh.x, y + sh.y, r, 1, fly > 0 ? f : (i >= 6 ? f : back));
    }

    // ---- レン（机の上）
    const RX = 300, RY = 668;
    let R = Object.assign({}, RIG.POSES.sit, RIG.FACES.smile, { scale: 1.3, x: RX + sh.x, y: RY + sh.y });
    const give = (a) => goBack(t, a, a + 0.3, a + 0.5, a + 0.8);
    const g1 = give(0.9), g2 = Math.max(give(4.2), give(4.5));
    if (g1 + g2 > 0) Object.assign(R, RIG.POSES.nudge, { flip: false, bodyTilt: 12 * (g1 + g2), headTilt: 14 * (g1 + g2), headNod: 18 * (g1 + g2) });
    if (t >= 1.8 && t < 4.0) Object.assign(R, RIG.FACES.smug, {});
    if (t >= 5.0 && t < 7.6) Object.assign(R, RIG.FACES.smug, { sparkle: pulse(t, 5.0, 5.8) });
    // ③ 山ごとどーん
    if (t >= 7.6 && t < 8.6) Object.assign(R, RIG.POSES.stand, RIG.FACES.sharp, { headNod: -16, bodySquash: -0.3 * pulse(t, 7.6, 8.0) });
    if (t >= 8.6 && t < 11.6) Object.assign(R, RIG.FACES.smile, { sparkle: pulse(t, 8.8, 9.6) });
    const fright = seg(t, 11.65, 12.2);
    if (fright > 0) Object.assign(R, RIG.FACES.surprised, { sparkle: 0, y: RY - 60 * Math.sin(Math.PI * fright) + sh.y });
    // オチの後のオチ：もぐもぐ
    if (t >= 14.6) { const chew = Math.sin(t * 22) > 0; Object.assign(R, RIG.FACES.smile, { excl: 0, mouth: chew ? 'w' : 'open', blush: 0.6 }); }
    const Rq = draw('ren', 'ren', R, t, {});
    if (t >= 14.6) { const ht = headTop(Rq); const nx = ht.x + 8, ny = ht.y + 128 * 1.3; f.appendChild(el('path', { d: `M${nx} ${ny} q30 10 56 4 M${nx} ${ny + 4} q26 18 50 16`, fill: 'none', stroke: '#7CB36A', 'stroke-width': 5, 'stroke-linecap': 'round' })); }

    // ---- ジル（床、電卓つき）
    let J = Object.assign({}, RIG.POSES.sit, RIG.FACES.sharp, { scale: 1.25, flip: true, x: JX + sh.x, y: 1240 + sh.y, eyeLook: 0.3 });
    if (t >= 2.2 && t < 3.8) Object.assign(J, RIG.FACES.annoyed, { sweat: 0, eyeLook: 0.9, eyeOpen: t > 2.9 && t < 3.05 ? 0.05 : 0.5 });
    if (t >= 5.2 && t < 6.0) Object.assign(J, { headNod: Math.sin(t * 24) > 0 ? 10 : 4, eyeLook: -0.2 });
    if (t >= 6.0 && t < 7.6) Object.assign(J, RIG.FACES.annoyed, { sweat: 1, eyeLook: 0.9, eyeOpen: (t > 6.4 && t < 6.48) || (t > 6.65 && t < 6.73) ? 0.12 : 0.5 });
    if (t >= 7.6 && t < 8.6) Object.assign(J, RIG.FACES.surprised, { excl: 1, eyeLook: 0.9 });
    const buried = t >= 8.6 && t < 11.6;
    if (buried) Object.assign(J, RIG.FACES.surprised, { excl: 0, eyeLook: 0.9, eyeOpen: t > 10.0 && t < 10.25 ? 0.1 : 0.9 });
    if (thumpPose(J, t, 11.15, 11.6, sh)) {}
    if (t >= 11.6 && t < 13.0) Object.assign(J, RIG.FACES.sharp, { excl: 0, eyeLook: 0.9 });
    if (t >= 13.0) Object.assign(J, RIG.FACES.smug, { eyeLook: 0.4 });
    if (t >= 15.4 && t < 17.4) Object.assign(J, RIG.FACES.annoyed, { sparkle: 0, sweat: 1, eyeLook: 0.9 });
    if (t >= 17.4) { const chew = Math.sin(t * 22) > 0; Object.assign(J, RIG.FACES.shy, { heart: 0, sweat: 0, eyeLook: 0.9, mouth: chew ? 'w' : 'open', blush: 0.8 }); }
    const Jq = draw('jil', 'jil', J, t, { blink: !(t >= 2.2 && t < 3.8) && !(t >= 6.0 && t < 7.6) });
    // 埋もれている間は耳だけ見せる（山を前面に描いたうえで、耳の先だけ上に描く）
    if (false && buried) { /* 顔が見えるので耳だけの演出は不要 */
      const ht = headTop(Jq); const tw = t > 10.0 && t < 10.25 ? 10 : 0;
      f.appendChild(el('g', {}, [el('ellipse', { cx: ht.x - 24, cy: ht.y - 50, rx: 16, ry: 42, fill: '#C79A6C', transform: `rotate(${-10 - tw} ${ht.x - 24} ${ht.y - 10})` }), el('ellipse', { cx: ht.x + 24, cy: ht.y - 50, rx: 16, ry: 42, fill: '#C79A6C', transform: `rotate(${10 + tw} ${ht.x + 24} ${ht.y - 10})` }),
        el('ellipse', { cx: ht.x - 24, cy: ht.y - 48, rx: 8, ry: 30, fill: '#E9C3B2', transform: `rotate(${-10 - tw} ${ht.x - 24} ${ht.y - 10})` }), el('ellipse', { cx: ht.x + 24, cy: ht.y - 48, rx: 8, ry: 30, fill: '#E9C3B2', transform: `rotate(${10 + tw} ${ht.x + 24} ${ht.y - 10})` })]));
    }
    if (t >= 17.4) { const ht = headTop(Jq); const nx = ht.x - 8, ny = ht.y + 112 * 1.25; f.appendChild(el('path', { d: `M${nx} ${ny} q-26 10 -48 4`, fill: 'none', stroke: '#7CB36A', 'stroke-width': 5, 'stroke-linecap': 'round' })); }
    // 電卓
    if (!buried) {
      const cx = Jq.x + 40 + sh.x, cy = 1570 + sh.y;
      const digits = t < 5.2 ? (t < 2.2 ? '0' : '480') : t < 6.0 ? String(480 * Math.floor(1 + seg(t, 5.2, 6.0) * 6)) : t < 7.6 ? '2880' : 'E';
      f.appendChild(el('g', { transform: `translate(${cx} ${cy}) rotate(-8)` }, [
        el('rect', { x: 0, y: 0, width: 150, height: 190, rx: 16, fill: '#3B4A5A' }),
        el('rect', { x: 14, y: 14, width: 122, height: 44, rx: 6, fill: digits === 'E' ? '#F2C14E' : '#BFD8C6' }),
        el('text', { x: 128, y: 48, 'text-anchor': 'end', 'font-size': 28, 'font-weight': 700, fill: '#1E2833', 'font-family': 'monospace' }, [document.createTextNode(digits)]),
        ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map(k => el('rect', { x: 16 + (k % 3) * 42, y: 72 + Math.floor(k / 3) * 38, width: 34, height: 28, rx: 6, fill: '#8E9AA6' }))]));
    }

    const punch = impactAt(ui, t, 11.6);
    thumpWave(f, t, 11.6, Jq.x + 250, 1730);
    sparkle(f, t, 12.6, 820, 1150, 1.4);
    const shots = [
      { t: 0.0, cx: 560, cy: 1180, z: 1.4 },                           // A 中：1枚目を渡す
      { t: 2.0, cx: FACE_JIL.x - 60, cy: FACE_JIL.y + 40, z: 2.2 },    // B 寄り：電卓・無言
      { t: 4.0, cx: 560, cy: 1180, z: 1.3 },                           // C 中：5枚どさっ
      { t: 5.2, cx: FACE_JIL.x - 60, cy: FACE_JIL.y + 60, z: 2.4 },    // D 寄り：電卓の桁→目がピクッ
      { t: 7.6, cx: 560, cy: 1150, z: 1.05 },                          // E 引き：山ごとどーん
      { t: 9.4, cx: FACE_JIL.x - 60, cy: FACE_JIL.y + 40, z: 2.0, z2: 3.0 },// F 寄り：耳だけピクッ（無音）
      { t: 11.5, cx: 560, cy: 1150, z: 1.0 },                          // G 引き：足ダン→整列
      { t: 13.2, cx: 520, cy: 1000, z: 1.9 },                          // H 寄り：課長もぐもぐ
      { t: 15.6, cx: FACE_JIL.x - 60, cy: FACE_JIL.y, z: 2.3 },        // I 寄り：ジルあきれ→こっそりもぐもぐ
      { t: 19.4, cx: 560, cy: 1150, z: 1.15 }                          // J 引き
    ];
    camera(cameraAt(shots, t), punch);
    endcard(t, dur);
  }
};
