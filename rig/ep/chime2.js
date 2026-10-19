// 第6話 v2「定時のチャイムでビンキー」（約23秒）
// ゲーム：18:00のチャイムで課長のよろこびが止まらない。①机の上で小ビンキー ②床まで大ビンキー（ジルびっくり） ③部屋中をぴょんぴょん暴走
// （間）→足ダンで静止 → ジルが電気を消す → 暗くなった瞬間に課長が寝る → オチの後のオチ：暗闇でジルもこっそり小ビンキー（メガネだけ光る）
window.EP = {
  dur: 23.0,
  bgmHolds: '11.2-12.2',
  sfx: [{ t: 2.4, type: 'chime' }, { t: 3.2, type: 'boing' }, { t: 5.2, type: 'boing' }, { t: 6.1, type: 'flop' },
        { t: 7.6, type: 'boing' }, { t: 8.0, type: 'tap' }, { t: 8.4, type: 'tap' }, { t: 8.8, type: 'tap' }, { t: 9.2, type: 'tap' }, { t: 9.6, type: 'tap' }, { t: 10.0, type: 'swish' },
        { t: 12.2, type: 'thump' }, { t: 14.0, type: 'tap' }, { t: 14.4, type: 'tap' }, { t: 14.8, type: 'tap' }, { t: 15.5, type: 'click' },
        { t: 16.4, type: 'blink' }, { t: 19.0, type: 'boing' }],
  frame(t) {
    const dur = this.dur, sh = shakeAt(t, 12.2, 0.5, 26);
    const m = t < 1.2 ? 58 : t < 2.4 ? 59 : 0, h = t < 2.4 ? 17 : 18;
    const dim = seg(t, 15.5, 15.75);
    office({ clock: [h, m], shake: sh, dim, papers: t < 10.0 ? 'neat' : 0.3, paperMess: t < 10.0 ? 1 : 1.6 });
    const f = clear('fx'), ui = clear('ui'); clear('back');
    f.appendChild(el('g', {}, [el('rect', { x: 40, y: 820, width: 56, height: 86, rx: 8, fill: '#FBF7F0', stroke: '#C9B79E', 'stroke-width': 4 }), el('rect', { x: 58, y: t < 15.5 ? 836 : 862, width: 20, height: 28, rx: 4, fill: '#C9B79E' })]));
    notes(f, t, 2.4, 860, 300);

    // ---- レン
    const RX = 430, RY = 668;
    let R = Object.assign({}, RIG.POSES.loaf, { scale: 1.3, x: RX + sh.x, y: RY + sh.y, eyeOpen: 0.4, eyeShape: 'round', mouth: 'w' });
    if (t >= 2.4 && t < 3.2) Object.assign(R, RIG.FACES.surprised, { pose: 'sit', bodySquash: -0.2, excl: 1, earL: -20, earR: 20 });
    const j1 = seg(t, 3.2, 3.9);
    if (j1 > 0 && j1 < 1) Object.assign(R, RIG.POSES.binky, RIG.FACES.smile, { y: RY - 120 * Math.sin(Math.PI * j1), earL: -20, earR: 20 });
    if (t >= 3.9 && t < 5.2) Object.assign(R, RIG.POSES.sit, RIG.FACES.smile, { blush: 0.6 });
    // ② 床まで大ビンキー（机→ジルの隣）
    const j2 = seg(t, 5.2, 6.1);
    if (j2 > 0 && j2 < 1) Object.assign(R, RIG.POSES.binky, RIG.FACES.smile, { x: lerp(RX, 260, j2) + sh.x, y: lerp(RY, 1160, j2) - 320 * Math.sin(Math.PI * j2) + sh.y, scale: lerp(1.3, 1.45, j2), bodyTilt: 30 * Math.sin(Math.PI * j2), flip: true, earL: -30, earR: 30, sparkle: 1 });
    if (t >= 6.1 && t < 7.6) Object.assign(R, RIG.POSES.sit, RIG.FACES.smile, { x: 260 + sh.x, y: 1160 + sh.y, scale: 1.45, blush: 0.8, bodySquash: t < 6.3 ? -0.5 : 0 });
    // ③ 部屋中を暴走
    const run = RIG.hop(t, 7.6, 10.4, 260, 260, { hops: 7, height: 140 });
    if (t >= 7.6 && t < 10.4) { const u = seg(t, 7.6, 10.4); const x = 260 + 520 * Math.sin(u * Math.PI * 2) * (1 - ease(seg(t, 9.9, 10.4))); /* 走り終わりはなめらかに減速 */ Object.assign(R, RIG.POSES.binky, RIG.FACES.smile, { x: x + sh.x, y: 1160 + run.yOff + sh.y, scale: 1.45, flip: Math.cos(u * Math.PI * 2) < 0, bodyTilt: 20 * Math.sin(t * 12), earL: -30, earR: 30, sparkle: 1 }); }
    if (t >= 10.4 && t < 12.2) Object.assign(R, RIG.POSES.sit, RIG.FACES.smile, { x: 260 + sh.x, y: 1160 + sh.y, scale: 1.45, blush: 1, sparkle: 0 });
    // 足ダンで静止（ポーズのまま固まる）
    if (t >= 12.2 && t < 15.75) Object.assign(R, RIG.POSES.sit, RIG.FACES.oops, { x: 260 + sh.x, y: 1160 + sh.y - 60 * pulse(t, 12.2, 12.6), scale: 1.45, earL: t < 12.8 ? -30 : 0, earR: t < 12.8 ? 30 : 0 });
    if (t >= 15.75) Object.assign(R, RIG.POSES.stretch, RIG.FACES.sleepy, { x: 200, y: 1160, scale: 1.45, zzz: seg(t, 16.2, 16.6) * (0.7 + 0.3 * Math.sin(t * 3)) });
    draw('ren', 'ren', R, t, { blink: (t > 3.9 && t < 5.2) || (t > 12.8 && t < 15.5), vx: t >= 7.6 && t < 10.4 ? 600 * Math.cos(seg(t, 7.6, 10.4) * Math.PI * 2) : 0 });

    // ---- ジル
    const JX = 700;
    let J = Object.assign({}, RIG.POSES.sit, RIG.FACES.sharp, { scale: 1.25, flip: true, x: JX + sh.x, y: 1240 + sh.y, eyeLook: 0.9 });
    if (t >= 2.4 && t < 5.2) Object.assign(J, RIG.FACES.annoyed, { sweat: 0.6 });
    if (t >= 5.9 && t < 7.4) Object.assign(J, RIG.FACES.surprised, { excl: pulse(t, 5.9, 6.6), y: 1240 - 50 * pulse(t, 6.0, 6.4) + sh.y });
    if (t >= 7.6 && t < 10.4) Object.assign(J, RIG.FACES.annoyed, { sweat: 1, eyeLook: Math.cos(seg(t, 7.6, 10.4) * Math.PI * 2) > 0 ? 0.9 : -0.9 });
    if (t >= 10.4 && t < 11.8) Object.assign(J, RIG.FACES.sharp, { earL: -8 * seg(t, 10.6, 11.6), earR: 8 * seg(t, 10.6, 11.6), bodySquash: -0.2 * seg(t, 10.6, 11.6) });
    thumpPose(J, t, 11.75, 12.2, sh);
    if (t >= 12.2 && t < 13.6) Object.assign(J, RIG.FACES.sharp, {});
    const hp = RIG.hop(t, 13.6, 15.0, JX, 40, { hops: 3, height: 38 });
    if (t >= 13.6) Object.assign(J, { x: hp.x, y: 1240 + hp.yOff, bodySquash: hp.squash });
    if (t >= 15.0) Object.assign(J, RIG.POSES.stand, { x: 40, y: 1240 - 200 * pulse(t, 15.1, 15.7), headNod: -20 });
    if (t >= 15.8) Object.assign(J, RIG.POSES.sit, RIG.FACES.annoyed, { flip: false, eyeLook: 0.9, sweat: 1, y: 1240 });
    // オチの後のオチ：暗闇でこっそり小ビンキー
    const sb = seg(t, 19.0, 19.7);
    if (t >= 18.2) Object.assign(J, RIG.FACES.smile, { sweat: 0, eyeLook: 0, flip: false });
    if (sb > 0 && sb < 1) Object.assign(J, RIG.POSES.binky, RIG.FACES.smile, { y: 1240 - 120 * Math.sin(Math.PI * sb), flip: false, sparkle: 1 });
    if (t >= 19.7) Object.assign(J, RIG.FACES.shy, { heart: seg(t, 19.8, 20.2), flip: false });
    const Jq = draw('jil', 'jil', J, t, { vx: hp.vx });
    // 暗闇でメガネだけきらり
    if (t >= 18.4) { const ht = headTop(Jq); sparkle(f, t, 18.5, ht.x - 20, ht.y + 120, 0.7); sparkle(f, t, 19.8, ht.x - 20, ht.y + 120, 0.9); }

    const punch = impactAt(ui, t, 12.2);
    thumpWave(f, t, 12.2, Jq.x + 250, 1730);
    speedLines(ui, (t > 5.2 && t < 6.1) || (t > 7.6 && t < 10.4) ? 0.8 : 0);
    const shots = [
      { t: 0.0, cx: 860, cy: 330, z: 2.4, z2: 2.6 },                   // A 寄り：時計 17:58 → 17:59
      { t: 1.6, cx: 640, cy: 960, z: 2.0 },                            // B 寄り：うとうと課長
      { t: 2.4, cx: 640, cy: 900, z: 1.8 },                            // C 寄り：チャイム！→小ビンキー
      { t: 5.0, cx: 540, cy: 1100, z: 1.0 },                           // D 引き：床まで大ビンキー
      { t: 6.4, cx: FACE_JIL.x - 60, cy: FACE_JIL.y, z: 2.3 },         // E 寄り：ジルびっくり
      { t: 7.5, cx: 540, cy: 1150, z: 1.0 },                           // F 引き：暴走
      { t: 10.4, cx: FACE_JIL.x - 60, cy: FACE_JIL.y, z: 2.0, z2: 3.0 },// G 寄り：ため（無音）
      { t: 12.1, cx: 540, cy: 1150, z: 1.0 },                          // H 引き：足ダン→静止
      { t: 13.0, cx: 400, cy: 1320, z: 2.0 },                          // I 寄り：固まる課長
      { t: 13.6, cx: 380, cy: 1150, z: 1.15 },                         // J 引き：スイッチへ→消灯
      { t: 16.0, cx: 420, cy: 1320, z: 1.9 },                          // K 寄り：即寝
      { t: 17.8, cx: 300, cy: 1420, z: 1.9 },                          // L 寄り：暗闇のジル→小ビンキー
      { t: 21.0, cx: 400, cy: 1250, z: 1.2 }                           // M 引き
    ];
    camera(cameraAt(shots, t), punch);
    endcard(t, dur);
  }
};
