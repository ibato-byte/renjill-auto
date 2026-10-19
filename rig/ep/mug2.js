// 第5話 v2「マグカップを探す課長（頭の上）」（約23秒）
// ゲーム：マグは課長の頭の上にあるのに、本人は気づかない。
// ①ジルが上を指す→課長が見上げるがマグも一緒に動いて見えない ②小さい足ダン→しずくが鼻に→窓を見て「雨？」
// ③ジルが自分の頭を指す→課長がおじぎ→マグが顔にすっぽり→見えずにうろうろ→机の脚にゴン
// （間）→大足ダン→マグが宙を舞って机に着地 → オチの後のオチ：課長、安心してまた頭に乗せる
window.EP = {
  dur: 23.0,
  bgmHolds: '12.4-13.4',
  sfx: [{ t: 0.6, type: 'blink' }, { t: 2.2, type: 'tap' }, { t: 2.6, type: 'tap' }, { t: 3.0, type: 'tap' },
        { t: 4.6, type: 'swish' }, { t: 5.6, type: 'blink' },
        { t: 6.8, type: 'pon' }, { t: 7.1, type: 'blink' }, { t: 9.6, type: 'swish' }, { t: 10.0, type: 'pon' },
        { t: 10.6, type: 'tap' }, { t: 10.95, type: 'tap' }, { t: 11.3, type: 'tap' }, { t: 11.8, type: 'flop' },
        { t: 13.4, type: 'thump' }, { t: 13.45, type: 'whoosh' }, { t: 14.3, type: 'clink' }, { t: 15.2, type: 'pop' },
        { t: 18.6, type: 'swish' }, { t: 19.2, type: 'pon' }],
  frame(t) {
    const dur = this.dur, sh = shakeAt(t, 13.4, 0.5, 26), shS = shakeAt(t, 6.8, 0.3, 8);
    const S = { x: sh.x + shS.x, y: sh.y + shS.y };
    const onDesk = t >= 14.3 && t < 18.6;
    office({ clock: [11, 30], shake: S, mug: onDesk });
    const f = clear('fx'), ui = clear('ui'); clear('back');

    // ---- レン（床、机の手前）
    const RX = 180, RY = 1160;
    let R = Object.assign({}, RIG.POSES.sit, RIG.FACES.think, { scale: 1.45, x: RX + S.x, y: RY + S.y, question: t < 1.8 ? 0.8 + 0.2 * Math.sin(t * 5) : 0, eyeLook: Math.sin(t * 2.2) * 0.8, headTilt: Math.sin(t * 2.2) * 8 });
    // ① 見上げる（マグも一緒に上を向く）
    const up = goBack(t, 4.2, 4.6, 5.6, 6.0);
    if (up > 0) Object.assign(R, RIG.POSES.stand, { question: 0, headNod: -30 * up, eyeLook: 0, eyeOpen: 1.1 });
    if (t >= 5.6 && t < 6.6) Object.assign(R, RIG.FACES.think, { question: 1, eyeLook: 0 });
    // ② しずく→窓を見る
    if (t >= 7.0 && t < 9.2) Object.assign(R, RIG.FACES.surprised, { question: 0, excl: pulse(t, 7.0, 7.6), eyeLook: -0.9, headTilt: -10 });
    if (t >= 8.0 && t < 9.2) Object.assign(R, RIG.FACES.think, { question: 1, eyeLook: -0.9, headTilt: -14 });
    // ③ おじぎ→マグが顔に→うろうろ→ゴン
    const bow = seg(t, 9.4, 10.0);
    if (bow > 0 && t < 13.4) Object.assign(R, RIG.FACES.neutral, { question: 0, headNod: 40 * ease(bow) * (t < 10.4 ? 1 : 0.4), eyeOpen: 0.1 });
    const wander = RIG.hop(t, 10.4, 11.6, RX, RX + 260, { hops: 3, height: 30 });
    if (t >= 10.4 && t < 13.4) Object.assign(R, { x: wander.x + S.x, y: RY + wander.yOff + S.y, bodySquash: wander.squash });
    if (t >= 11.6 && t < 11.9) Object.assign(R, { x: RX + 260 - 30 * Math.sin(Math.PI * seg(t, 11.6, 11.9)) + S.x });
    if (t >= 11.8 && t < 13.4) Object.assign(R, { sweat: 1, headTilt: 8 * Math.sin(t * 10) * (t < 12.4 ? 1 : 0) });
    // 大足ダン→マグが飛ぶ
    const pop = seg(t, 13.45, 14.0);
    if (t >= 13.45) Object.assign(R, RIG.FACES.surprised, { sweat: 0, headNod: 0, x: RX + 260 + S.x, y: RY - 80 * Math.sin(Math.PI * pop) + S.y, excl: 1 - seg(t, 14.4, 14.8), eyeLook: 0.5 });
    if (t >= 14.6) Object.assign(R, RIG.FACES.smile, { excl: 0, eyeLook: 0.4, blush: 0.6 });
    // オチの後のオチ：マグを頭に戻す
    if (t >= 18.2) Object.assign(R, RIG.POSES.stand, RIG.FACES.smile, { headNod: -16 });
    if (t >= 19.2) Object.assign(R, RIG.POSES.sit, RIG.FACES.smug, { sparkle: pulse(t, 19.3, 20.2) });
    const Rq = draw('ren', 'ren', R, t, { blink: !(t >= 9.4 && t < 13.4) });

    // マグ（頭の上 → 顔 → 宙 → 机 → 頭）
    const ht = headTop(Rq);
    const mugOnHead = { x: ht.x - 35, y: ht.y - 70 };
    if (t < 13.45) {
      let mx = mugOnHead.x, my = mugOnHead.y, rot = Math.sin(t * 2.2 + 0.6) * 8;
      if (bow > 0) { const sl = ease(seg(t, 9.6, 10.0)); my = lerp(mugOnHead.y, ht.y + 150 * 1.45, sl); rot = lerp(rot, 180, sl); mx = lerp(mx, ht.x - 35, sl); }
      f.appendChild(mugShape(mx, my, bow > 0 ? 1.6 : 1, rot));
      // しずく
      if (t >= 6.8 && t < 7.4) { const d = seg(t, 6.8, 7.2); f.appendChild(el('path', { d: `M${ht.x - 4} ${ht.y + 20 + 160 * d} q-8 12 0 18 q8 -6 0 -18 Z`, fill: '#9FC3DE', opacity: 1 - seg(t, 7.2, 7.4) })); }
    } else if (t < 14.3) {
      const u = seg(t, 13.45, 14.3); const sx = mugOnHead.x, sy = ht.y + 150 * 1.45, ex = 560, ey = 1120;
      f.appendChild(mugShape(lerp(sx, ex, u), lerp(sy, ey, u) - 420 * Math.sin(Math.PI * u), 1.6 - 0.6 * u, 180 + 540 * u));
    } else if (t >= 18.6) {
      const u = ease(seg(t, 18.6, 19.2)); f.appendChild(mugShape(lerp(560, mugOnHead.x, u), lerp(1120, mugOnHead.y, u) - 120 * Math.sin(Math.PI * u), 1, 0));
    }
    if (onDesk) { // 湯気
      for (let i = 0; i < 3; i++) { const v = (t * 0.6 + i / 3) % 1; f.appendChild(el('path', { d: `M${585 + i * 10} ${1110 - 80 * v} q12 -12 0 -24`, fill: 'none', stroke: '#C9B79E', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.6 * (1 - v) })); }
    }

    // ---- ジル
    const JX = 680;
    const hp = RIG.hop(t, 1.9, 3.3, 1150, JX, { hops: 3, height: 40 });
    let J = Object.assign({}, RIG.POSES.sit, RIG.FACES.neutral, { scale: 1.25, flip: true, x: hp.x + S.x, y: 1240 + hp.yOff + S.y, bodySquash: hp.squash, eyeLook: 0.9 });
    const point1 = goBack(t, 3.6, 4.1, 5.8, 6.2);
    if (point1 > 0) Object.assign(J, RIG.POSES.stand, RIG.FACES.sharp, { headNod: -16 - 30 * point1, y: 1240 - 100 * point1 + S.y });
    thumpPose(J, t, 6.4, 6.8, S);
    if (t >= 7.2 && t < 9.0) Object.assign(J, RIG.FACES.annoyed, { sweat: 1, eyeOpen: t > 8.2 && t < 8.3 ? 0.1 : 0.5 });
    const point2 = goBack(t, 8.8, 9.2, 9.8, 10.2);
    if (point2 > 0) Object.assign(J, RIG.POSES.stand, RIG.FACES.sharp, { headNod: -16, headTilt: 25 * point2, y: 1240 - 60 * point2 + S.y });
    if (t >= 11.9 && t < 13.0) Object.assign(J, RIG.FACES.sharp, { earL: -8 * seg(t, 12.0, 12.8), earR: 8 * seg(t, 12.0, 12.8), bodySquash: -0.2 * seg(t, 12.0, 12.8) });
    thumpPose(J, t, 12.95, 13.4, S);
    if (t >= 13.4 && t < 15.2) Object.assign(J, RIG.FACES.sharp, {});
    if (t >= 15.2) Object.assign(J, RIG.FACES.smug, { eyeLook: 0.5 });
    if (t >= 19.2) Object.assign(J, RIG.FACES.annoyed, { sparkle: 0, eyeLook: 0.9, sweat: 1, eyeOpen: 0.15, eyeShape: 'flat' });
    const Jq = draw('jil', 'jil', J, t, { vx: hp.vx });

    thumpWave(f, t, 6.8, Jq.x + 250, 1730);
    thumpWave(f, t, 13.4, Jq.x + 250, 1730);
    const punch = impactAt(ui, t, 13.4);
    sparkle(f, t, 14.3, 595, 1150, 1.2);
    const shots = [
      { t: 0.0, cx: 440, cy: 1240, z: 2.0, z2: 2.15 },                 // A 寄り：頭にマグ、本人は探す
      { t: 1.9, cx: 560, cy: 1250, z: 1.3 },                           // B 中：ジル登場
      { t: 4.2, cx: 440, cy: 1220, z: 1.9 },                           // C 寄り：見上げる（マグも上へ）
      { t: 6.3, cx: 560, cy: 1250, z: 1.3 },                           // D 中：小さい足ダン、しずく
      { t: 7.4, cx: 420, cy: 1240, z: 2.1 },                           // E 寄り：窓を見て雨？
      { t: 9.2, cx: 560, cy: 1260, z: 1.3 },                           // F 中：おじぎ→マグが顔に→ゴン
      { t: 11.9, cx: FACE_JIL.x - 20, cy: FACE_JIL.y, z: 2.0, z2: 3.0 },// G 寄り：ため（無音）
      { t: 13.3, cx: 560, cy: 1150, z: 1.0 },                          // H 引き：大足ダン、マグが舞う
      { t: 14.8, cx: 560, cy: 1180, z: 1.6 },                          // I 中：マグ着地、課長にっこり
      { t: 18.2, cx: 560, cy: 1220, z: 1.4 },                          // J 中：また頭に乗せる
      { t: 19.6, cx: FACE_JIL.x - 20, cy: FACE_JIL.y, z: 2.4 },        // K 寄り：ジルの諦め顔
      { t: 21.0, cx: 560, cy: 1200, z: 1.2 }                           // L 引き
    ];
    camera(cameraAt(shots, t), punch);
    endcard(t, dur);
  }
};
