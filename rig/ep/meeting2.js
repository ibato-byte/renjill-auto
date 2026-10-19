// 第1話 v2「会議の5分前」（約24秒）
// ゲーム：課長は起きない。①机をトントン→寝返り ②小さい足ダン→耳を毛布にする ③（間）→大足ダン→課長が宙に飛ぶ
// オチ：ネクタイを直されてにっこり → オチの後のオチ：また鼻ちょうちんが膨らみはじめる
window.EP = {
  dur: 24.0,
  bgmHolds: '11.0-12.0',
  sfx: [{ t: 2.6, type: 'tap' }, { t: 3.0, type: 'tap' }, { t: 3.4, type: 'tap' },
        { t: 4.6, type: 'pon' }, { t: 4.9, type: 'pon' }, { t: 5.4, type: 'swish' },
        { t: 7.2, type: 'pon' }, { t: 7.9, type: 'swish' }, { t: 9.5, type: 'twitch' }, { t: 9.75, type: 'twitch' },
        { t: 12.0, type: 'thump' }, { t: 12.05, type: 'pop' }, { t: 12.1, type: 'whoosh' }, { t: 12.9, type: 'flop' },
        { t: 14.6, type: 'boing' }, { t: 16.6, type: 'swish' }, { t: 17.6, type: 'pop' }, { t: 20.4, type: 'blink' }],
  frame(t) {
    const dur = this.dur, sh = shakeAt(t, 12.0, 0.5, 26), shS = shakeAt(t, 7.2, 0.3, 8);
    const S = { x: sh.x + shS.x, y: sh.y + shS.y };
    office({ clock: [9, t < 14.4 ? 55 : 58], shake: S });
    const f = clear('fx'), ui = clear('ui'); clear('back');

    // ---- レン：机の上で伸び寝
    const RX = 40, RY = 600, RS = 1.5;
    let R = Object.assign({}, RIG.POSES.stretch, RIG.FACES.sleepy, { scale: RS, x: RX + S.x, y: RY + S.y, zzz: 0.7 + 0.3 * Math.sin(t * 3), bodySquash: 1 + 0.05 * Math.sin(t * 2.4) });
    if (t >= 5.3) R.flip = true;
    const roll = seg(t, 5.0, 5.6); if (roll > 0 && roll < 1) Object.assign(R, { bodyTilt: 25 * Math.sin(Math.PI * roll), headTilt: 20 * Math.sin(Math.PI * roll) });
    // ② 耳を毛布にする
    const blanket = seg(t, 7.6, 8.2);
    if (blanket > 0 && t < 12.0) Object.assign(R, { earL: 60 * ease(blanket), earR: -60 * ease(blanket), zzz: 1.2 + 0.2 * Math.sin(t * 3) });
    // ③ 大足ダンで宙に飛ぶ → 着地
    const fly = seg(t, 12.05, 12.9);
    if (fly > 0) Object.assign(R, RIG.POSES.sit, RIG.FACES.surprised, { zzz: 0, bodySquash: -0.1, y: RY - 620 * Math.sin(Math.PI * fly) + S.y, bodyTilt: 360 * fly * 0 + 20 * Math.sin(Math.PI * fly), earL: -40, earR: 40, excl: 1 });
    if (t >= 12.9) Object.assign(R, RIG.POSES.sit, RIG.FACES.surprised, { y: RY + 40 * ease(seg(t, 12.9, 13.1)) + S.y, excl: 1 - seg(t, 13.6, 14.0), earL: -30 * (1 - seg(t, 13.4, 14.2)), earR: 30 * (1 - seg(t, 13.4, 14.2)), bodySquash: t < 13.1 ? -0.5 : 0 });
    if (t >= 14.0) Object.assign(R, { eyeLook: -0.4 });                                   // 時計を見る
    if (t >= 14.6) Object.assign(R, RIG.FACES.oops, { excl: 0, eyeLook: -0.4, sweat: 1 });
    const fix = seg(t, 16.6, 17.4);
    if (fix > 0) Object.assign(R, RIG.FACES.smile, { sweat: 1 - fix, blush: 0.7 * fix, eyeLook: 0 });
    const doze = seg(t, 18.6, 20.6);
    if (doze > 0) Object.assign(R, { eyeOpen: lerp(1, 0.08, ease(doze)), eyeShape: doze > 0.9 ? 'flat' : 'happy', headNod: 14 * ease(doze), mouth: 'w', zzz: seg(t, 20.4, 21.0) });
    const Rq = draw('ren', 'ren', R, t, { blink: t > 13.0 && doze === 0 });
    // 鼻ちょうちん
    const nt = headTop(Rq), nx = nt.x + (Rq.flip ? -8 : 8) * RS, ny = nt.y + 116 * RS;
    let bub = 0;
    if (t < 12.05) bub = 0.6 + 0.4 * Math.sin(t * 2.4);
    if (t >= 20.6) bub = 0.15 + 0.35 * seg(t, 20.6, 23.0) * (0.8 + 0.2 * Math.sin(t * 2.4));
    if (bub > 0) f.appendChild(el('g', {}, [el('circle', { cx: nx + 22 * bub * RS, cy: ny + 6, r: 26 * bub * RS, fill: '#DCEFFA', opacity: 0.75, stroke: '#9FC3DE', 'stroke-width': 3 }), el('circle', { cx: nx + 14 * bub * RS, cy: ny - 4 * bub * RS, r: 6 * bub * RS, fill: '#FFFFFF', opacity: 0.9 })]));
    if (t >= 12.05 && t < 12.3) { const u = seg(t, 12.05, 12.3); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; f.appendChild(el('circle', { cx: nx + 30 + Math.cos(a) * 60 * u, cy: ny + Math.sin(a) * 60 * u, r: 6 * (1 - u), fill: '#9FC3DE' })); } }

    // ---- ジル
    const JX = 600;
    const hp = RIG.hop(t, 2.2, 3.6, 1150, JX, { hops: 3, height: 40 });
    let J = Object.assign({}, RIG.POSES.sit, RIG.FACES.neutral, { scale: 1.25, flip: true, x: hp.x + S.x, y: 1240 + hp.yOff + S.y, bodySquash: hp.squash, eyeLook: 0.9 });
    // ① 机をトントン
    const tap = goBack(t, 4.0, 4.5, 5.0, 5.4);
    if (tap > 0) Object.assign(J, RIG.POSES.stand, RIG.FACES.sharp, { headNod: -16 - 24 * tap, y: 1240 - 120 * tap + S.y + (t > 4.5 && t < 5.0 ? 10 * Math.abs(Math.sin(t * 20)) : 0) });
    if (t >= 5.6 && t < 6.8) Object.assign(J, RIG.FACES.annoyed, { sweat: 0, eyeOpen: t > 6.1 && t < 6.25 ? 0.05 : 0.5 });   // 無言の凝視
    // ② 小さい足ダン
    if (!thumpPose(J, t, 6.85, 7.2, S)) { if (t >= 7.2 && t < 9.2) Object.assign(J, RIG.FACES.sharp, {}); }
    if (t >= 9.2 && t < 10.4) Object.assign(J, RIG.FACES.annoyed, { sweat: 1, eyeOpen: (t > 9.5 && t < 9.58) || (t > 9.75 && t < 9.83) ? 0.12 : 0.5, earL: t > 9.5 && t < 9.9 ? -8 : 0 });
    // ③ ため → 大足ダン
    if (t >= 10.4 && t < 11.6) Object.assign(J, RIG.FACES.sharp, { earL: -8 * seg(t, 10.6, 11.4), earR: 8 * seg(t, 10.6, 11.4), bodySquash: -0.2 * seg(t, 10.6, 11.4) });
    thumpPose(J, t, 11.55, 12.0, S);
    if (t >= 12.0 && t < 15.6) Object.assign(J, RIG.FACES.sharp, { excl: 0 });
    // ネクタイを直す
    const tie = goBack(t, 15.8, 16.6, 17.6, 18.2);
    if (tie > 0) Object.assign(J, RIG.POSES.nudge, RIG.FACES.neutral, { bodyTilt: 10 * tie, headTilt: 14 * tie, headNod: 14 * tie, x: JX - 160 * tie + S.x, y: 1240 - 330 * tie + S.y });
    if (t >= 18.2) Object.assign(J, RIG.FACES.smug, { eyeLook: 0.5 });
    if (t >= 20.8) Object.assign(J, RIG.FACES.annoyed, { sparkle: 0, eyeLook: 0.9, sweat: 1, earR: t > 21.4 && t < 21.7 ? 10 : 0 });
    const Jq = draw('jil', 'jil', J, t, { vx: hp.vx, blink: !(t >= 5.6 && t < 6.8) && !(t >= 9.2 && t < 10.4) });

    // ---- 効果・カメラ
    thumpWave(f, t, 7.2, Jq.x + 250, 1730);
    thumpWave(f, t, 12.0, Jq.x + 250, 1730);
    const punch = impactAt(ui, t, 12.0);
    speedLines(ui, fly > 0 && fly < 0.6 ? 1 : 0);
    const shots = [
      { t: 0.0, cx: 330, cy: 960, z: 2.3, z2: 2.5 },                  // A 寄り：鼻ちょうちん
      { t: 2.2, cx: 640, cy: 1150, z: 1.2 },                          // B 引き：ジル登場、時計9:55
      { t: 3.8, cx: 520, cy: 1050, z: 1.45 },                         // C 中：トントン→寝返り
      { t: 5.6, cx: FACE_JIL.x - 40, cy: FACE_JIL.y, z: 2.3 },        // D 寄り：ジル無言
      { t: 6.8, cx: 560, cy: 1150, z: 1.2 },                          // E 引き：小さい足ダン
      { t: 7.9, cx: 330, cy: 950, z: 2.2 },                           // F 寄り：耳の毛布
      { t: 9.2, cx: FACE_JIL.x - 40, cy: FACE_JIL.y, z: 2.5 },        // G 寄り：目がピクッ
      { t: 10.4, cx: FACE_JIL.x - 40, cy: FACE_JIL.y, z: 2.0, z2: 3.0 }, // H 寄り：ため（無音）
      { t: 11.9, cx: 540, cy: 1000, z: 1.0 },                         // I 引き：大足ダン、宙に飛ぶ
      { t: 13.4, cx: 360, cy: 980, z: 2.1 },                          // J 寄り：時計を見て焦る
      { t: 15.6, cx: 520, cy: 1100, z: 1.35 },                        // K 中：ネクタイ直し
      { t: 18.4, cx: 360, cy: 980, z: 2.2, z2: 2.5 },                 // L 寄り：また寝る（鼻ちょうちん）
      { t: 20.8, cx: FACE_JIL.x - 40, cy: FACE_JIL.y, z: 2.3 },       // M 寄り：ジルの汗
      { t: 22.0, cx: 560, cy: 1100, z: 1.15 }                         // N 引き
    ];
    camera(cameraAt(shots, t), punch);
    endcard(t, dur);
  }
};
