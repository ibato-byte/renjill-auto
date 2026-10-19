// 第4話 v2「書類の山を足ダンで整列」（約22秒）
// ゲーム：課長が整えるほど書類が崩れる。①そっと押す→ずれる ②まねして足ダン→散らばって1枚が頭に ③上に乗って押さえる→爆散
// （間）→ジルの足ダン→書類がぴしっと揃う → オチの後のオチ：課長がまねして足ダン→紙が1枚ジルの頭に
window.EP = {
  dur: 22.0,
  bgmHolds: '10.6-11.6',
  sfx: [{ t: 1.0, type: 'swish' }, { t: 1.5, type: 'swish' }, { t: 3.3, type: 'blink' },
        { t: 5.0, type: 'tap' }, { t: 5.15, type: 'swish' }, { t: 5.6, type: 'pon' }, { t: 6.6, type: 'twitch' }, { t: 6.85, type: 'twitch' },
        { t: 8.2, type: 'boing' }, { t: 8.9, type: 'flop' }, { t: 9.0, type: 'whoosh' },
        { t: 11.6, type: 'thump' }, { t: 11.7, type: 'whoosh' }, { t: 12.6, type: 'pop' },
        { t: 17.4, type: 'tap' }, { t: 17.6, type: 'swish' }, { t: 18.6, type: 'pon' }],
  frame(t) {
    const dur = this.dur, sh = shakeAt(t, 11.6, 0.5, 26);
    // 書類の状態
    let neat = 0.4, mess = 1, lift = 0;
    const p1 = seg(t, 0.9, 1.6); neat = 0.4 - 0.25 * ease(p1);
    const p2 = seg(t, 5.0, 5.6); if (p2 > 0) { mess = 1 + 0.8 * ease(p2); neat = 0.15 - 0.15 * ease(p2); lift = 0.5 * Math.sin(Math.PI * p2); }
    const p3 = seg(t, 8.9, 9.6); if (p3 > 0) { mess = 1.8 + 1.4 * ease(p3); lift = 0.9 * Math.sin(Math.PI * p3); }
    const fly = seg(t, 11.65, 12.6); if (fly > 0) { lift = 2.0 * Math.sin(Math.PI * fly); neat = ease(fly); mess = 3.2 * (1 - ease(fly)) + 1 * ease(fly); }
    office({ clock: [14, 5], shake: sh, papers: clamp(neat, 0, 1), paperLift: lift, paperMess: mess });
    const f = clear('fx'), ui = clear('ui'); clear('back');

    // ---- レン（書類の山の右）
    const RX = 470, RY = 668;
    let R = Object.assign({}, RIG.POSES.sit, RIG.FACES.think, { scale: 1.3, x: RX + sh.x, y: RY + sh.y, flip: true, eyeLook: 0.7, question: pulse(t, 0.0, 0.8) });
    const n1 = goBack(t, 0.6, 1.0, 1.6, 2.0);
    if (n1 > 0) Object.assign(R, RIG.POSES.nudge, { question: 0, bodyTilt: 12 * n1, headTilt: 16 * n1, headNod: 26 * n1, x: RX - 40 * n1 + sh.x });
    if (t >= 2.0 && t < 4.4) Object.assign(R, RIG.FACES.oops, { eyeLook: 0.7 });
    // ② まねして足ダン（へなちょこ）
    if (t >= 4.4 && t < 5.0) Object.assign(R, RIG.FACES.sharp, { eyeLook: 0.7, sweat: 0 });
    if (thumpPose(R, t, 4.6, 5.05, sh, RY)) Object.assign(R, RIG.FACES.sharp, { flip: true });
    if (t >= 5.05 && t < 7.8) Object.assign(R, RIG.FACES.oops, { sweat: 1, eyeLook: 0.7 });
    // ③ 上に乗って押さえる
    const jump = seg(t, 8.2, 8.9);
    if (t >= 7.8 && t < 8.2) Object.assign(R, RIG.POSES.thump, RIG.FACES.sharp, { legLift: 0.4, bodySquash: -0.4, sweat: 0 });
    if (jump > 0 && jump < 1) Object.assign(R, RIG.POSES.binky, RIG.FACES.smile, { x: RX - 150 * ease(jump) + sh.x, y: RY - 200 * Math.sin(Math.PI * jump) + 30 * jump + sh.y });
    if (t >= 8.9 && t < 11.6) Object.assign(R, RIG.POSES.loaf, RIG.FACES.smug, { x: RX - 150 + sh.x, y: RY + 30 + sh.y, bodySquash: t < 9.1 ? -0.6 : -0.4, sparkle: pulse(t, 9.6, 10.4) });
    // ジルの足ダンで飛ばされて元の位置へ
    const back = seg(t, 11.65, 12.4);
    if (back > 0) Object.assign(R, RIG.FACES.surprised, { pose: 'sit', sparkle: 0, x: lerp(RX - 150, RX, ease(back)) + sh.x, y: RY - 180 * Math.sin(Math.PI * back) + sh.y, earL: -30, earR: 30 });
    if (t >= 12.6) Object.assign(R, RIG.FACES.surprised, { excl: 0, sparkle: 1, eyeLook: 0.7, y: RY + sh.y, earL: 0, earR: 0 });  // きらきら目
    if (t >= 14.0) Object.assign(R, RIG.FACES.smile, { sparkle: pulse(t, 14.0, 15.0), eyeLook: 0 });
    // オチの後のオチ：まねして足ダン
    if (t >= 16.6 && t < 17.0) Object.assign(R, RIG.FACES.sharp, { flip: false, eyeLook: 0.6 });
    if (thumpPose(R, t, 17.0, 17.45, sh, RY)) Object.assign(R, { flip: false });
    if (t >= 17.45) Object.assign(R, RIG.FACES.smug, { flip: false, eyeLook: 0.6, sparkle: pulse(t, 17.5, 18.2) });
    if (t >= 19.0) Object.assign(R, RIG.FACES.shy, { heart: 0, eyeLook: 0.7, sweat: 1 });
    const Rq = draw('ren', 'ren', R, t, {});
    // ②で頭に乗る1枚
    if (t >= 5.6 && t < 8.2) { const ht = headTop(Rq); const d = seg(t, 5.15, 5.6); f.appendChild(el('rect', { x: ht.x - 60, y: ht.y - 26 - 200 * (1 - d), width: 120, height: 26, rx: 3, fill: '#FFFFFF', stroke: '#D8CBB6', 'stroke-width': 3, transform: `rotate(${-8 + 6 * Math.sin(t * 3)} ${ht.x} ${ht.y})` })); }

    // ---- ジル
    const JX = 620;
    let J = Object.assign({}, RIG.POSES.sit, RIG.FACES.neutral, { scale: 1.25, flip: true, x: JX + sh.x, y: 1240 + sh.y, eyeLook: 0.9 });
    if (t >= 2.6 && t < 4.4) Object.assign(J, RIG.FACES.annoyed, { sweat: 0, eyeOpen: t > 3.3 && t < 3.45 ? 0.05 : 0.5 });
    if (t >= 6.2 && t < 7.8) Object.assign(J, RIG.FACES.annoyed, { sweat: 1, eyeOpen: (t > 6.6 && t < 6.68) || (t > 6.85 && t < 6.93) ? 0.12 : 0.5, earL: t > 6.6 && t < 7.0 ? -8 : 0 });
    if (t >= 9.6 && t < 11.2) Object.assign(J, RIG.FACES.sharp, { earL: -8 * seg(t, 9.8, 10.8), earR: 8 * seg(t, 9.8, 10.8), bodySquash: -0.2 * seg(t, 9.8, 10.8) });
    thumpPose(J, t, 11.15, 11.6, sh);
    if (t >= 11.6 && t < 13.2) Object.assign(J, RIG.FACES.sharp, {});
    if (t >= 13.2) Object.assign(J, RIG.FACES.smug, { eyeLook: 0.5 });
    if (t >= 17.5) Object.assign(J, RIG.FACES.surprised, { sparkle: 0, eyeLook: 0.9, excl: pulse(t, 17.5, 18.0) });
    if (t >= 18.6) Object.assign(J, RIG.FACES.annoyed, { eyeLook: 0, sweat: 0 });    // 頭に紙、無表情
    const Jq = draw('jil', 'jil', J, t, { blink: !(t >= 2.6 && t < 4.4) && !(t >= 6.2 && t < 7.8) && t < 18.6 });
    // ジルの頭に紙が1枚ひらひら落ちる
    if (t >= 17.6) { const ht = headTop(Jq); const d = ease(seg(t, 17.6, 18.6)); const sway = Math.sin(t * 6) * 40 * (1 - d); f.appendChild(el('rect', { x: ht.x - 70 + sway, y: ht.y - 20 - 500 * (1 - d), width: 140, height: 26, rx: 3, fill: '#FFFFFF', stroke: '#D8CBB6', 'stroke-width': 3, transform: `rotate(${sway * 0.4} ${ht.x + sway} ${ht.y - 500 * (1 - d)})` })); }

    thumpWave(f, t, 11.6, Jq.x + 250, 1730);
    const punch = impactAt(ui, t, 11.6);
    sparkle(f, t, 12.6, 410, 1120, 1.4);
    speedLines(ui, jump > 0 && jump < 1 ? 1 : 0);
    const shots = [
      { t: 0.0, cx: 600, cy: 1030, z: 2.0, z2: 2.1 },                  // A 寄り：書類をそっと押す
      { t: 2.4, cx: FACE_JIL.x - 60, cy: FACE_JIL.y, z: 2.3 },         // B 寄り：ジル無言
      { t: 4.3, cx: 520, cy: 1050, z: 1.5 },                           // C 中：まね足ダン→散らばる
      { t: 6.2, cx: FACE_JIL.x - 60, cy: FACE_JIL.y, z: 2.5 },         // D 寄り：目がピクッ
      { t: 7.8, cx: 520, cy: 1080, z: 1.2 },                           // E 引き：書類に乗る
      { t: 9.6, cx: FACE_JIL.x - 60, cy: FACE_JIL.y, z: 2.0, z2: 3.0 },// F 寄り：ため（無音）
      { t: 11.5, cx: 540, cy: 1100, z: 1.0 },                          // G 引き：足ダン→整列
      { t: 13.0, cx: 640, cy: 1000, z: 2.0 },                          // H 寄り：課長きらきら
      { t: 15.4, cx: 560, cy: 1120, z: 1.3 },                          // I 中：まね足ダン
      { t: 18.4, cx: FACE_JIL.x - 60, cy: FACE_JIL.y - 40, z: 2.2 },   // J 寄り：頭に紙のジル
      { t: 20.0, cx: 560, cy: 1100, z: 1.15 }                          // K 引き
    ];
    camera(cameraAt(shots, t), punch);
    endcard(t, dur);
  }
};
