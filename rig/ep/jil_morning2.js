// 第2話 v2「ジルの朝」（約22秒）
// ゲーム：ジルはメガネでスイッチが入る。課長は自分のスイッチが見つからない。
// ①寝ぼけジルが机の脚にゴン→メガネをかけて一瞬でキリッ ②課長もネクタイを締めてキリッ…がすぐ目が閉じる ③頬をぷくっと膨らませて気合→立ったまま寝る
// （間）→足ダン→課長ついにキリッ → オチの後のオチ：ジルのメガネがずり落ちて寝ぼけ→課長がまね足ダン→ジル復活
window.EP = {
  dur: 22.0,
  bgmHolds: '10.8-11.8',
  sfx: [{ t: 0.3, type: 'tap' }, { t: 0.7, type: 'tap' }, { t: 1.1, type: 'tap' }, { t: 2.0, type: 'flop' },
        { t: 3.6, type: 'pop' }, { t: 5.2, type: 'swish' }, { t: 5.6, type: 'pop' }, { t: 6.6, type: 'blink' },
        { t: 8.0, type: 'boing' }, { t: 9.6, type: 'blink' }, { t: 11.8, type: 'thump' }, { t: 11.9, type: 'boing' }, { t: 12.8, type: 'pop' },
        { t: 15.6, type: 'swish' }, { t: 17.0, type: 'tap' }, { t: 17.4, type: 'pop' }],
  frame(t) {
    const dur = this.dur, sh = shakeAt(t, 11.8, 0.5, 26), shS = shakeAt(t, 17.0, 0.25, 8);
    const S = { x: sh.x + shS.x, y: sh.y + shS.y };
    office({ clock: [8, t < 12 ? 59 : 0].map((v, i) => i === 0 && t >= 12 ? 9 : v), shake: S });
    const f = clear('fx'), ui = clear('ui'); clear('back');

    // ---- ジル
    const JX = 620;
    const hp = RIG.hop(t, 0.0, 1.3, 1060, JX, { hops: 3, height: 34 });
    let J = Object.assign({}, RIG.POSES.sit, { scale: 1.25, flip: true, prop: false, eyeOpen: 0.3, eyeShape: 'round', mouth: 'w', x: hp.x + S.x, y: 1240 + hp.yOff + S.y, bodySquash: hp.squash });
    const bonk = seg(t, 1.9, 2.5); if (bonk > 0 && bonk < 1) Object.assign(J, { x: JX + 30 * Math.sin(Math.PI * bonk) + S.x, headTilt: 12 * Math.sin(Math.PI * bonk * 2), sweat: 1 });
    const yawn = pulse(t, 2.5, 3.3); if (yawn > 0) Object.assign(J, { eyeOpen: 0.05, eyeShape: 'flat', mouth: 'open', headNod: -10 * yawn });
    if (t >= 3.6) { const p = seg(t, 3.6, 3.9); Object.assign(J, RIG.FACES.sharp, { prop: true, sweat: 0, bodySquash: -0.3 * Math.sin(Math.PI * p), eyeLook: 0.9 }); }
    if (t >= 4.4 && t < 5.0) Object.assign(J, RIG.FACES.smug, { eyeLook: 0.9 });
    if (t >= 6.4 && t < 7.6) Object.assign(J, RIG.FACES.annoyed, { sweat: 0, eyeLook: 0.9, eyeOpen: t > 6.6 && t < 6.75 ? 0.05 : 0.5 });
    if (t >= 9.2 && t < 10.4) Object.assign(J, RIG.FACES.annoyed, { sweat: 1, eyeLook: 0.9, eyeOpen: (t > 9.6 && t < 9.68) || (t > 9.85 && t < 9.93) ? 0.12 : 0.5 });
    if (t >= 10.4 && t < 11.4) Object.assign(J, RIG.FACES.sharp, { eyeLook: 0.9, earL: -8 * seg(t, 10.5, 11.2), earR: 8 * seg(t, 10.5, 11.2), bodySquash: -0.2 * seg(t, 10.5, 11.2) });
    thumpPose(J, t, 11.35, 11.8, S);
    if (t >= 11.8 && t < 14.6) Object.assign(J, RIG.FACES.sharp, { prop: true, eyeLook: 0.6 });
    // オチの後のオチ：メガネがずり落ちる→寝ぼけ→課長のまね足ダンで復活
    if (t >= 14.6 && t < 15.6) Object.assign(J, { prop: true, eyeShape: 'flat', eyeOpen: 0.1, mouth: 'open', headNod: -8 });
    if (t >= 15.6 && t < 17.4) Object.assign(J, { prop: false, eyeOpen: 0.3, eyeShape: 'round', mouth: 'w', headNod: 6, zzz: seg(t, 16.0, 16.4) });
    if (t >= 17.4) { const p = seg(t, 17.4, 17.7); Object.assign(J, RIG.FACES.sharp, { prop: true, zzz: 0, eyeLook: 0.9, bodySquash: -0.3 * Math.sin(Math.PI * p), sparkle: pulse(t, 17.4, 18.2) }); }
    if (t >= 18.6) Object.assign(J, RIG.FACES.shy, { heart: 0, eyeLook: 0.9, prop: true });
    const Jq = draw('jil', 'jil', J, t, { vx: hp.vx, blink: t > 3.9 && !(t >= 6.4 && t < 7.6) && !(t >= 9.2 && t < 10.4) && !(t >= 14.6 && t < 17.4) });

    // ---- レン（机の上）
    const RX = 430, RY = 668;
    let R = Object.assign({}, RIG.POSES.loaf, RIG.FACES.sleepy, { scale: 1.3, x: RX + S.x, y: RY + S.y, zzz: 0.6 + 0.3 * Math.sin(t * 3) });
    if (t >= 3.7 && t < 5.0) Object.assign(R, RIG.FACES.surprised, { pose: 'sit', zzz: 0, eyeLook: 0.7, excl: pulse(t, 3.7, 4.3) });
    // ② ネクタイを締めてキリッ→目が閉じる
    if (t >= 5.0 && t < 5.6) Object.assign(R, RIG.POSES.stand, RIG.FACES.sharp, { zzz: 0, headNod: -16 - 8 * Math.sin(Math.PI * seg(t, 5.0, 5.6)) });
    if (t >= 5.6 && t < 6.4) Object.assign(R, RIG.POSES.sit, RIG.FACES.sharp, { zzz: 0, sparkle: pulse(t, 5.6, 6.3), headNod: -12 });
    if (t >= 6.4 && t < 7.6) Object.assign(R, RIG.POSES.sit, { zzz: 0, eyeOpen: lerp(1, 0.08, ease(seg(t, 6.4, 7.4))), eyeShape: 'round', mouth: 'w', headNod: lerp(-12, 8, seg(t, 6.4, 7.4)) });
    // ③ 頬をぷくっと→立ったまま寝る
    if (t >= 7.6 && t < 8.6) Object.assign(R, RIG.POSES.stand, RIG.FACES.angry, { zzz: 0, excl: 0, bodySquash: -0.5 + 0.1 * Math.sin(t * 30), headNod: -16 });
    if (t >= 8.6 && t < 11.8) Object.assign(R, RIG.POSES.stand, RIG.FACES.sleepy, { headNod: -10 + 10 * seg(t, 8.6, 9.6), zzz: seg(t, 9.0, 9.4) * (0.8 + 0.2 * Math.sin(t * 3)), headTilt: 6 * Math.sin(t * 1.5) });
    // 足ダンでついにキリッ
    const wake = seg(t, 11.85, 12.5);
    if (wake > 0) Object.assign(R, RIG.FACES.surprised, { pose: 'stand', zzz: 0, y: RY - 120 * Math.sin(Math.PI * wake) + S.y, earL: -30, earR: 30 });
    if (t >= 12.8) Object.assign(R, RIG.POSES.stand, RIG.FACES.sharp, { excl: 0, y: RY + S.y, earL: 0, earR: 0, sparkle: pulse(t, 12.8, 13.8), headNod: -16 });
    if (t >= 15.6 && t < 16.6) Object.assign(R, RIG.FACES.surprised, { pose: 'sit', sparkle: 0, eyeLook: 0.7, excl: pulse(t, 15.6, 16.2) });
    if (t >= 16.6) { Object.assign(R, RIG.POSES.sit, RIG.FACES.sharp, { eyeLook: 0.7 }); thumpPose(R, t, 16.6, 17.0, S, RY); }
    if (t >= 17.4) Object.assign(R, RIG.POSES.sit, RIG.FACES.smug, { eyeLook: 0.7, sparkle: pulse(t, 17.6, 18.4) });
    draw('ren', 'ren', R, t, { blink: (t >= 3.7 && t < 6.4) || t >= 12.8 });

    // ---- 効果・カメラ
    const ht = headTop(Jq);
    sparkle(f, t, 3.6, ht.x, ht.y + 100, 1.3);
    sparkle(f, t, 17.4, ht.x, ht.y + 100, 1.1);
    thumpWave(f, t, 11.8, Jq.x + 250, 1730);
    const punch = impactAt(ui, t, 11.8);
    const shots = [
      { t: 0.0, cx: 860, cy: 1450, z: 1.8 },                          // A 寄り：寝ぼけジル入場→ゴン（最初の1秒で顔が見える）
      { t: 2.4, cx: FACE_JIL.x - 60, cy: FACE_JIL.y, z: 2.6, z2: 2.8 },// B 寄り：あくび→メガネでキリッ
      { t: 4.4, cx: 560, cy: 1100, z: 1.3 },                          // C 中：課長が見てる
      { t: 5.0, cx: 640, cy: 960, z: 2.0 },                           // D 寄り：ネクタイでキリッ→閉じる
      { t: 7.6, cx: 560, cy: 1100, z: 1.3 },                          // E 中：ぷくっ→立ったまま寝る
      { t: 9.2, cx: FACE_JIL.x - 60, cy: FACE_JIL.y, z: 2.5 },        // F 寄り：目がピクッ
      { t: 10.4, cx: FACE_JIL.x - 60, cy: FACE_JIL.y, z: 2.0, z2: 3.0 },// G 寄り：ため（無音）
      { t: 11.7, cx: 560, cy: 1120, z: 1.0 },                         // H 引き：足ダン
      { t: 13.0, cx: 640, cy: 940, z: 2.1 },                          // I 寄り：課長ついにキリッ
      { t: 14.4, cx: FACE_JIL.x - 60, cy: FACE_JIL.y, z: 2.4 },       // J 寄り：ジルのメガネがずり落ちる
      { t: 16.4, cx: 600, cy: 1120, z: 1.25 },                        // K 中：課長のまね足ダン→ジル復活
      { t: 18.6, cx: FACE_JIL.x - 60, cy: FACE_JIL.y, z: 2.3 },       // L 寄り：ジル照れ
      { t: 20.0, cx: 560, cy: 1120, z: 1.15 }                         // M 引き
    ];
    camera(cameraAt(shots, t), punch);
    endcard(t, dur);
  }
};
