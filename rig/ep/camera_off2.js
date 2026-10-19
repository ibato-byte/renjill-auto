// 第7話 v2「オンライン会議でカメラオフのまま寝る」（約22秒）
// ゲーム：カメラオフなら寝てもバレない（はず）。①寝る→小さい足ダンで起きる→また寝る ②自分の番で寝ぼけてカメラON（寝顔が全員に） ③画面の全員がびっくり顔
// （間）→大足ダン→課長がキリッと座り直す → オチの後のオチ：議長の枠をよく見ると、議長も寝ていた
window.EP = {
  dur: 22.0,
  bgmHolds: '11.0-12.0',
  sfx: [{ t: 2.6, type: 'blink' }, { t: 3.6, type: 'tap' }, { t: 3.9, type: 'boing' }, { t: 5.4, type: 'blink' },
        { t: 6.2, type: 'chime' }, { t: 7.6, type: 'click' }, { t: 8.4, type: 'pop' }, { t: 9.0, type: 'pop' }, { t: 9.3, type: 'pop' },
        { t: 12.0, type: 'thump' }, { t: 12.1, type: 'boing' }, { t: 13.2, type: 'pop' }, { t: 16.6, type: 'blink' }, { t: 17.4, type: 'pop' }],
  frame(t) {
    const dur = this.dur, sh = shakeAt(t, 12.0, 0.5, 26), shS = shakeAt(t, 3.6, 0.25, 8);
    const S = { x: sh.x + shS.x, y: sh.y + shS.y };
    office({ clock: [15, 0], shake: S });
    const f = clear('fx'), back = clear('back'), ui = clear('ui');

    // ---- レン
    const RX = 250, RY = 668;
    let R = Object.assign({}, RIG.POSES.sit, RIG.FACES.neutral, { scale: 1.3, x: RX + S.x, y: RY + S.y, eyeLook: 0.7 });
    const d1 = seg(t, 0.6, 2.8);
    if (t < 3.6) Object.assign(R, { eyeOpen: lerp(1, 0.06, ease(d1)), eyeShape: d1 > 0.9 ? 'flat' : 'round', headNod: 22 * ease(d1), zzz: seg(t, 2.6, 3.0) });
    if (t >= 3.6 && t < 4.4) Object.assign(R, RIG.FACES.surprised, { y: RY - 50 * pulse(t, 3.6, 4.0) + S.y, eyeLook: 0.7 });
    const d2 = seg(t, 4.4, 5.8);
    if (t >= 4.4 && t < 7.4) Object.assign(R, { eyeOpen: lerp(1, 0.06, ease(d2)), eyeShape: d2 > 0.9 ? 'flat' : 'round', mouth: 'w', headNod: 22 * ease(d2), zzz: seg(t, 5.6, 6.0) });
    // ② 寝ぼけてボタンを押す（カメラON）
    const pressU = goBack(t, 7.2, 7.6, 7.8, 8.2);
    if (t >= 7.2 && t < 8.4) Object.assign(R, RIG.POSES.nudge, { eyeOpen: 0.15, eyeShape: 'flat', zzz: 0.6, bodyTilt: 10 * pressU, headNod: 24 + 10 * pressU });
    if (t >= 8.4 && t < 12.0) Object.assign(R, RIG.POSES.sit, RIG.FACES.sleepy, { headNod: 22, zzz: 0.8 + 0.2 * Math.sin(t * 3) });
    // 大足ダン→キリッ
    const wake = seg(t, 12.05, 12.7);
    if (wake > 0) Object.assign(R, RIG.FACES.surprised, { zzz: 0, headNod: -10, y: RY - 110 * Math.sin(Math.PI * wake) + S.y, earL: -30, earR: 30 });
    if (t >= 13.2) Object.assign(R, RIG.FACES.sharp, { excl: 0, y: RY + S.y, earL: 0, earR: 0, headNod: -14, sweat: 1, sparkle: pulse(t, 13.2, 14.0), eyeLook: 0.7 });
    if (t >= 16.8) Object.assign(R, RIG.FACES.surprised, { sweat: 0, sparkle: 0, excl: 0, eyeLook: 0.7 });
    if (t >= 17.4) Object.assign(R, RIG.FACES.smile, { blush: 0.6, eyeLook: 0.7 });
    const Rq = draw('ren', 'ren', R, t, { blink: t >= 13.2 || (t >= 3.6 && t < 4.4) });

    // ---- モニター：4分割の会議画面（左上=議長）
    const mx = 718 + S.x, my = 978 + S.y, tw = 128, th = 76;
    const camOn = t >= 7.8, turn = t >= 6.2 && t < 13.2;
    const surprised = t >= 8.4 && t < 13.2;
    const chairSleep = t >= 16.6;
    const people = [['#E9D7C1', '#8E7057'], ['#D6E4EE', '#4E77A0'], ['#E5E9D6', '#6A8F55']];
    people.forEach((c, i) => {
      const x = mx + 4 + (i % 2) * (tw + 4), y = my + 4 + Math.floor(i / 2) * (th + 4);
      const jolt = surprised && t < 8.4 + 0.3 * (i + 1) + 0.4 ? -6 * Math.sin((t - 8.4 - 0.3 * i) * 20) : 0;
      const kids = [el('rect', { x, y, width: tw, height: th, rx: 4, fill: c[0] }), el('circle', { cx: x + tw / 2, cy: y + 34 + jolt, r: 14, fill: c[1] }), el('ellipse', { cx: x + tw / 2, cy: y + 70, rx: 26, ry: 16, fill: c[1] })];
      if (surprised && t > 8.4 + 0.3 * i) kids.push(el('circle', { cx: x + tw / 2 - 5, cy: y + 32 + jolt, r: 3.5, fill: '#FFFFFF' }), el('circle', { cx: x + tw / 2 + 5, cy: y + 32 + jolt, r: 3.5, fill: '#FFFFFF' }), el('text', { x: x + tw / 2 + 20, y: y + 22, 'font-size': 18, 'font-weight': 900, fill: '#C8463C' }, [document.createTextNode('!')]));
      if (i === 0 && chairSleep) kids.push(el('path', { d: `M${x + tw / 2 - 8} ${y + 33} h5 M${x + tw / 2 + 3} ${y + 33} h5`, stroke: '#FFFFFF', 'stroke-width': 2.5 }), el('text', { x: x + tw / 2 + 16, y: y + 22, 'font-size': 16, 'font-weight': 900, fill: '#3B2E22' }, [document.createTextNode('Zz')]));
      back.appendChild(el('g', {}, kids));
    });
    { // 自分の枠（右下）
      const x = mx + 4 + (tw + 4), y = my + 4 + (th + 4);
      back.appendChild(el('rect', { x, y, width: tw, height: th, rx: 4, fill: camOn ? '#F1E2CC' : '#1E2833' }));
      if (camOn) {
        const sharp = t >= 13.2;
        back.appendChild(el('g', {}, [el('ellipse', { cx: x + 46, cy: y + 40, rx: 14, ry: 24, fill: '#AE8D6D' }), el('ellipse', { cx: x + 82, cy: y + 40, rx: 14, ry: 24, fill: '#AE8D6D' }), el('circle', { cx: x + 64, cy: y + 38 + (sharp ? 0 : 6), r: 22, fill: '#CDA67C' }),
          sharp ? el('g', {}, [el('circle', { cx: x + 57, cy: y + 36, r: 3, fill: '#2B1A10' }), el('circle', { cx: x + 71, cy: y + 36, r: 3, fill: '#2B1A10' })]) : el('path', { d: `M${x + 52} ${y + 44} h8 M${x + 68} ${y + 44} h8`, stroke: '#2B1A10', 'stroke-width': 2.5 }),
          sharp ? null : el('text', { x: x + 92, y: y + 24, 'font-size': 14, 'font-weight': 900, fill: '#3B2E22' }, [document.createTextNode('Zz')])]));
      } else back.appendChild(el('g', {}, [el('rect', { x: x + 48, y: y + 26, width: 26, height: 22, rx: 4, fill: '#7C8A98' }), el('path', { d: `M${x + 74} ${y + 32} l12 -6 v22 l-12 -6 Z`, fill: '#7C8A98' }), el('line', { x1: x + 44, y1: y + 54, x2: x + 90, y2: y + 20, stroke: '#C8463C', 'stroke-width': 4 })]));
      if (turn) back.appendChild(el('rect', { x: x - 2, y: y - 2, width: tw + 4, height: th + 4, rx: 5, fill: 'none', stroke: '#F2C14E', 'stroke-width': 4 + 2 * Math.sin(t * 12) }));
    }

    // ---- ジル
    const JX = 640;
    let J = Object.assign({}, RIG.POSES.sit, RIG.FACES.sharp, { scale: 1.25, flip: true, x: JX + S.x, y: 1240 + S.y, eyeLook: 0.9 });
    thumpPose(J, t, 3.2, 3.6, S);
    if (t >= 5.6 && t < 7.0) Object.assign(J, RIG.FACES.annoyed, { sweat: 0, eyeOpen: t > 6.0 && t < 6.15 ? 0.05 : 0.5 });
    if (t >= 7.0 && t < 8.6) Object.assign(J, RIG.FACES.surprised, { excl: pulse(t, 7.8, 8.4) });
    if (t >= 8.6 && t < 10.2) Object.assign(J, RIG.FACES.surprised, { sweat: 1, eyeOpen: 1.3, excl: 0 });
    if (t >= 10.2 && t < 11.6) Object.assign(J, RIG.FACES.sharp, { earL: -8 * seg(t, 10.4, 11.4), earR: 8 * seg(t, 10.4, 11.4), bodySquash: -0.2 * seg(t, 10.4, 11.4) });
    thumpPose(J, t, 11.55, 12.0, S);
    if (t >= 12.0 && t < 14.6) Object.assign(J, RIG.FACES.sharp, {});
    if (t >= 14.6) Object.assign(J, RIG.FACES.smug, { eyeLook: 0.5 });
    if (t >= 17.0) Object.assign(J, RIG.FACES.annoyed, { sparkle: 0, eyeLook: 0.9, sweat: 1 });
    const Jq = draw('jil', 'jil', J, t, { blink: !(t >= 5.6 && t < 7.0) });

    thumpWave(f, t, 3.6, Jq.x + 250, 1730);
    thumpWave(f, t, 12.0, Jq.x + 250, 1730);
    notes(f, t, 6.2, 860, 930);
    const punch = impactAt(ui, t, 12.0);
    const SCREEN = { x: 850, y: 1060 };
    const shots = [
      { t: 0.0, cx: 620, cy: 1000, z: 1.8, z2: 1.9 },                  // A 寄り：うとうと＋カメラオフの画面
      { t: 3.0, cx: 560, cy: 1120, z: 1.25 },                          // B 中：小さい足ダン→起きる→また寝る
      { t: 5.6, cx: FACE_JIL.x - 60, cy: FACE_JIL.y, z: 2.3 },         // C 寄り：ジル無言
      { t: 6.4, cx: SCREEN.x, cy: SCREEN.y, z: 2.9 },                  // D 寄り：画面、自分の番が光る
      { t: 7.2, cx: 600, cy: 1020, z: 1.6 },                           // E 中：寝ぼけてボタン
      { t: 8.2, cx: SCREEN.x, cy: SCREEN.y, z: 3.0 },                  // F 寄り：寝顔が全員に、みんなびっくり
      { t: 9.6, cx: FACE_JIL.x - 60, cy: FACE_JIL.y, z: 2.5 },         // G 寄り：ジル青ざめ
      { t: 10.2, cx: FACE_JIL.x - 60, cy: FACE_JIL.y, z: 2.0, z2: 3.0 },// H 寄り：ため（無音）
      { t: 11.9, cx: 560, cy: 1120, z: 1.0 },                          // I 引き：大足ダン
      { t: 13.0, cx: 600, cy: 990, z: 1.8 },                           // J 中：キリッ（画面もキリッ）
      { t: 15.0, cx: SCREEN.x - 60, cy: SCREEN.y - 40, z: 2.9, z2: 4.0 },        // K 寄り：議長の枠にゆっくり寄る→寝ている
      { t: 17.2, cx: 520, cy: 1000, z: 1.8 },                          // L 中：課長ほっこり
      { t: 19.4, cx: 560, cy: 1120, z: 1.15 }                          // M 引き
    ];
    camera(cameraAt(shots, t), punch);
    endcard(t, dur);
  }
};
