// 第9話 v2「締め切りのカレンダー」（約22秒）
// ゲーム：課長は締め切りを見ないふり。①ジルが指さす→反対を向く ②小さい足ダンでカレンダーが机に落ちる→裏返す ③カレンダーがぱたっと起き上がる→耳で目隠し
// （間）→大足ダン→猛スピードで仕事（時計が早回し）→ オチの後のオチ：赤丸の日に大きなチェック、2匹ともぐったり
window.EP = {
  dur: 22.0,
  bgmHolds: '9.6-10.6',
  sfx: [{ t: 1.4, type: 'pop' }, { t: 2.2, type: 'swish' }, { t: 3.6, type: 'tap' }, { t: 3.9, type: 'whoosh' }, { t: 4.4, type: 'flop' },
        { t: 5.4, type: 'swish' }, { t: 7.0, type: 'pop' }, { t: 7.9, type: 'swish' }, { t: 10.6, type: 'thump' }, { t: 10.7, type: 'boing' },
        { t: 11.6, type: 'whoosh' }, { t: 12.6, type: 'whoosh' }, { t: 13.6, type: 'whoosh' }, { t: 14.6, type: 'chime' }, { t: 16.0, type: 'pon' }, { t: 17.2, type: 'blink' }],
  frame(t) {
    const dur = this.dur, sh = shakeAt(t, 10.6, 0.5, 26), shS = shakeAt(t, 3.6, 0.25, 8);
    const S = { x: sh.x + shS.x, y: sh.y + shS.y };
    const rush = seg(t, 11.2, 14.6);
    const totalMin = 15 * 60 + rush * 8 * 60;
    office({ clock: [Math.floor(totalMin / 60), Math.floor(totalMin % 60)], shake: S, dim: rush > 0.4 ? 0.5 * seg(t, 12.4, 14.0) : (t >= 14.6 ? 0.5 : 0) });
    const f = clear('fx'), ui = clear('ui'), back = clear('back');

    // ---- カレンダー：壁 → 落ちて机の上 → 裏返し → 起き上がる
    const calendar = (x, y, s, rot, face = true, check = 0, layer = back) => {
      const kids = [el('rect', { x: 0, y: 0, width: 270, height: 210, rx: 10, fill: face ? '#FFFFFF' : '#E6DCCB', stroke: '#C9B79E', 'stroke-width': 6 })];
      if (face) {
        kids.push(el('rect', { x: 0, y: 0, width: 270, height: 48, rx: 10, fill: '#C8463C' }));
        for (let i = 0; i < 28; i++) { const cx = 16 + (i % 7) * 34, cy = 64 + Math.floor(i / 7) * 34; kids.push(el('rect', { x: cx, y: cy, width: 28, height: 28, rx: 4, fill: i < 18 ? '#E4DCCF' : '#FFFFFF' })); }
        const blink = t > 1.2 && t < 2.4 ? 0.5 + 0.5 * Math.sin(t * 14) : 1;
        kids.push(el('circle', { cx: 16 + (18 % 7) * 34 + 14, cy: 64 + 2 * 34 + 14, r: 24, fill: 'none', stroke: '#C8463C', 'stroke-width': 6, opacity: blink }));
        if (check > 0) kids.push(el('path', { d: 'M70 120 L120 170 L220 60', fill: 'none', stroke: '#3E8E5A', 'stroke-width': 18, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': 300, 'stroke-dashoffset': 300 * (1 - check) }));
      }
      layer.appendChild(el('g', { transform: `translate(${x} ${y}) rotate(${rot} 135 105) scale(${s})` }, kids));
    };
    const fall = seg(t, 3.65, 4.4);
    const wallP = { x: 700, y: 620 }, deskP = { x: 640, y: 1000 };
    if (t < 3.65) calendar(wallP.x + S.x, wallP.y + S.y, 1, 0);
    else {
      const x = lerp(wallP.x, deskP.x, ease(fall)), y = lerp(wallP.y, deskP.y, fall * fall);
      const flipped = t >= 5.6 && t < 7.0;
      const rise = seg(t, 7.0, 7.3);
      const rot = fall < 1 ? 200 * fall : 0;
      const sx = flipped ? 1 : 1;
      calendar(x + S.x, y + S.y, 0.85, rot, !flipped, ease(seg(t, 15.6, 16.2)), back);
      if (t >= 7.0 && t < 7.3) f.appendChild(el('path', { d: `M${x + 20} ${y + 190} q115 -40 230 0`, fill: 'none', stroke: '#C9B79E', 'stroke-width': 4, opacity: 1 - rise }));
    }

    // ---- レン（机の上、カレンダーの左）
    const RX = 250, RY = 668;
    let R = Object.assign({}, RIG.POSES.lean, RIG.FACES.smug, { scale: 1.3, x: RX + S.x, y: RY + S.y, eyeLook: 0, sparkle: 0 });
    if (t >= 1.6 && t < 3.4) Object.assign(R, RIG.POSES.sit, RIG.FACES.smug, { flip: true, eyeLook: 0.6, sparkle: pulse(t, 2.2, 3.0) });   // 反対を向く
    if (t >= 4.4 && t < 5.4) Object.assign(R, RIG.FACES.surprised, { pose: 'sit', eyeLook: 0.8, excl: 1 });
    const turnOver = goBack(t, 5.4, 5.6, 5.7, 6.0);
    if (t >= 5.4 && t < 7.0) Object.assign(R, RIG.POSES.nudge, RIG.FACES.smug, { excl: 0, bodyTilt: 14 * turnOver, headTilt: 16 * turnOver, headNod: 20 * turnOver, x: RX + 120 * turnOver + S.x });
    if (t >= 7.0 && t < 7.9) Object.assign(R, RIG.FACES.surprised, { pose: 'sit', excl: 1, eyeLook: 0.8 });
    if (t >= 7.9 && t < 10.6) Object.assign(R, RIG.POSES.sit, { excl: 0, eyeOpen: 0.1, eyeShape: 'flat', mouth: 'line', earL: 60 * ease(seg(t, 7.9, 8.3)), earR: -60 * ease(seg(t, 7.9, 8.3)), sweat: 1 });
    const wake = seg(t, 10.65, 11.2);
    if (wake > 0) Object.assign(R, RIG.FACES.surprised, { earL: -30, earR: 30, sweat: 0, y: RY - 100 * Math.sin(Math.PI * wake) + S.y });
    if (rush > 0 && rush < 1) Object.assign(R, RIG.POSES.nudge, RIG.FACES.sharp, { excl: 0, sweat: 1, bodyTilt: 8 + 6 * Math.sin(t * 40), headTilt: 10 + 6 * Math.sin(t * 37), headNod: 14 + 4 * Math.sin(t * 43), earL: -10 * Math.sin(t * 30), earR: 10 * Math.sin(t * 31), y: RY + S.y });
    if (t >= 14.6 && t < 16.8) Object.assign(R, RIG.POSES.sit, RIG.FACES.smile, { excl: 0, sweat: 0, earL: 0, earR: 0, sparkle: pulse(t, 15.6, 16.6) });
    if (t >= 16.8) Object.assign(R, RIG.POSES.stretch, RIG.FACES.sleepy, { sparkle: 0, excl: 0, x: 230, zzz: seg(t, 17.2, 17.6) });
    draw('ren', 'ren', R, t, { blink: !(rush > 0 && rush < 1) && !(t >= 7.9 && t < 10.6) && t < 16.8 });
    if (rush > 0 && rush < 1) for (let i = 0; i < 5; i++) { const u = ((t * 1.6 + i * 0.2) % 1); f.appendChild(el('rect', { x: 760 + 200 * u + i * 16, y: 960 - 320 * Math.sin(Math.PI * u), width: 70, height: 46, rx: 4, fill: '#FFFFFF', stroke: '#D8CBB6', 'stroke-width': 3, transform: `rotate(${u * 300 + i * 40} ${795 + 200 * u} ${983 - 320 * Math.sin(Math.PI * u)})`, opacity: 1 - u })); }

    // ---- ジル
    const JX = 640;
    let J = Object.assign({}, RIG.POSES.sit, RIG.FACES.sharp, { scale: 1.25, flip: true, x: JX + S.x, y: 1240 + S.y, eyeLook: 0.9 });
    const point = goBack(t, 0.8, 1.2, 2.6, 3.0);
    if (point > 0) Object.assign(J, RIG.POSES.stand, { headNod: -16 - 26 * point, headTilt: -10 * point, eyeLook: 0.2, y: 1240 - 120 * point + S.y, excl: pulse(t, 1.1, 1.6) });
    thumpPose(J, t, 3.2, 3.6, S);
    if (t >= 6.0 && t < 7.0) Object.assign(J, RIG.FACES.annoyed, { sweat: 1, eyeOpen: t > 6.4 && t < 6.5 ? 0.1 : 0.5 });
    if (t >= 8.4 && t < 10.2) Object.assign(J, RIG.FACES.sharp, { earL: -8 * seg(t, 8.6, 10.0), earR: 8 * seg(t, 8.6, 10.0), bodySquash: -0.2 * seg(t, 8.6, 10.0) });
    thumpPose(J, t, 10.15, 10.6, S);
    if (rush > 0 && rush < 1) Object.assign(J, RIG.FACES.sharp, { sweat: 0.6, eyeLook: 0.9 });
    if (t >= 14.6) Object.assign(J, RIG.FACES.smile, { sweat: 0, eyeLook: 0.9 });
    if (t >= 16.8) Object.assign(J, RIG.POSES.loaf, RIG.FACES.sleepy, { zzz: seg(t, 17.6, 18.0), eyeOpen: 0.1 });
    const Jq = draw('jil', 'jil', J, t, { blink: !(t >= 6.0 && t < 7.0) && t < 16.8 });

    thumpWave(f, t, 3.6, Jq.x + 250, 1730);
    thumpWave(f, t, 10.6, Jq.x + 250, 1730);
    const punch = impactAt(ui, t, 10.6);
    speedLines(ui, rush > 0 && rush < 1 ? 0.7 : 0);
    sparkle(f, t, 16.0, 770, 1080, 1.4);
    const shots = [
      { t: 0.0, cx: 560, cy: 1000, z: 1.2 },                            // A 中：ジルが指さす
      { t: 1.6, cx: 420, cy: 960, z: 2.0 },                             // B 寄り：反対を向く課長
      { t: 3.2, cx: 600, cy: 1050, z: 1.2 },                            // C 中：足ダン→カレンダー落下
      { t: 4.6, cx: 560, cy: 1000, z: 1.7 },                            // D 中：裏返す
      { t: 6.0, cx: FACE_JIL.x - 60, cy: FACE_JIL.y, z: 2.3 },          // E 寄り：ジル無言
      { t: 6.9, cx: 600, cy: 1020, z: 1.7 },                            // F 中：起き上がる→耳で目隠し
      { t: 8.4, cx: FACE_JIL.x - 60, cy: FACE_JIL.y, z: 2.0, z2: 3.0 }, // G 寄り：ため（無音）
      { t: 10.5, cx: 560, cy: 1100, z: 1.0 },                           // H 引き：足ダン
      { t: 11.2, cx: 560, cy: 1000, z: 1.3, z2: 1.7 },                  // I 中：猛スピード＋時計早回し
      { t: 14.6, cx: 760, cy: 1110, z: 2.2 },                           // J 寄り：赤丸に大きなチェック
      { t: 16.6, cx: 560, cy: 1120, z: 1.2, z2: 1.1 }                   // K 引き：ぐったり
    ];
    camera(cameraAt(shots, t), punch);
    endcard(t, dur);
  }
};
