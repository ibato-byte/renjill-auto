// v2フォーマット試作：ハンコ（三段エスカレーション版・約25秒）
// ゲーム：「課長はハンコ欄を体で押す」。①鼻 → ②耳 → ③全身ダイブ（エスカレーション）→ 間 → 足ダン → ジルが正しく押す → ほっこりオチ
// 文法：寄り（リアクション）と引き（アクション）を2〜3秒ごとに切り替える。オチ前に音楽を止めて「間」を作る
window.EP = {
  dur: 25.0,
  bgmHolds: '12.0-13.0',
  sfx: [{ t: 1.55, type: 'pon' }, { t: 2.0, type: 'pop' }, { t: 3.0, type: 'blink' },
        { t: 5.35, type: 'pon' }, { t: 5.7, type: 'pop' }, { t: 7.0, type: 'twitch' }, { t: 7.25, type: 'twitch' },
        { t: 8.4, type: 'boing' }, { t: 9.0, type: 'flop' }, { t: 10.2, type: 'pop' },
        { t: 13.0, type: 'thump' }, { t: 13.05, type: 'whoosh' }, { t: 13.4, type: 'boing' },
        { t: 17.4, type: 'pon' }, { t: 17.8, type: 'pop' }, { t: 20.6, type: 'pon' }, { t: 21.3, type: 'pop' }],
  frame(t) {
    const dur = this.dur;
    const sh = shakeAt(t, 13.0, 0.5, 26);
    office({ clock: [10, 20], shake: sh });
    const f = clear('fx'), back = clear('back'), ui = clear('ui');

    // ---- 配置
    const RX = 120, PUSH = 300;
    const full = Object.assign({}, RIG.DEFAULTS, RIG.POSES.nudge, { char: 'ren', scale: 1.3, x: RX + PUSH, y: 668, bodyTilt: 18, headTilt: 26, headNod: 60 });
    const nt = headTop(full);
    const cb = { x: nt.x - 120 + 14 + sh.x, y: nt.y + 110 * 1.3 - 200 + sh.y };
    const box1 = { x: cb.x + 120, y: cb.y + 196 }, box2 = { x: cb.x + 60, y: cb.y + 150 };
    const fresh = seg(t, 15.2, 15.8);   // 新しい書類に差し替え
    // クリップボード
    const pageShift = fresh > 0 && fresh < 1 ? -260 * (1 - ease(fresh)) : 0;
    back.appendChild(el('g', { transform: `translate(${cb.x} ${cb.y})` }, [
      el('rect', { x: 0, y: 0, width: 190, height: 262, rx: 14, fill: '#B98A5A', stroke: '#6B4E32', 'stroke-width': 5 }),
      el('rect', { x: 14, y: 26 + pageShift, width: 162, height: 222, rx: 6, fill: '#FFFFFF' }),
      el('rect', { x: 66, y: -10, width: 58, height: 26, rx: 8, fill: '#8E9AA6' }),
      ...[52, 76, 100].map(y => el('rect', { x: 30, y: y + pageShift, width: 130 - (y % 3) * 10, height: 8, rx: 4, fill: '#D9DEE4' })),
      el('circle', { cx: 120, cy: 196 + pageShift, r: 30, fill: 'none', stroke: '#C9B9A6', 'stroke-width': 4, 'stroke-dasharray': '7 6' }),
      el('circle', { cx: 60, cy: 150 + pageShift, r: 26, fill: 'none', stroke: '#C9B9A6', 'stroke-width': 4, 'stroke-dasharray': '7 6' })
    ]));
    const old = t < 15.2;  // 古い書類の上の跡
    if (old && t >= 1.55) back.appendChild(el('path', { d: `M${box1.x - 22} ${box1.y - 10} Q${box1.x} ${box1.y - 18} ${box1.x + 22} ${box1.y - 10} Q${box1.x + 6} ${box1.y + 18} ${box1.x} ${box1.y + 20} Q${box1.x - 6} ${box1.y + 18} ${box1.x - 22} ${box1.y - 10} Z`, fill: '#E39A9A', opacity: 0.85 }));
    if (old && t >= 5.35) back.appendChild(el('path', { d: `M${box2.x - 30} ${box2.y - 40} C ${box2.x - 50} ${box2.y} ${box2.x - 30} ${box2.y + 40} ${box2.x} ${box2.y + 36} C ${box2.x + 24} ${box2.y + 30} ${box2.x + 12} ${box2.y - 20} ${box2.x - 30} ${box2.y - 40} Z`, fill: '#AE8D6D', opacity: 0.7 }));
    if (old && t >= 9.0) back.appendChild(el('ellipse', { cx: cb.x + 95, cy: cb.y + 150, rx: 92, ry: 110, fill: '#C7A077', opacity: 0.75 }));
    if (t >= 17.4) back.appendChild(el('g', {}, [el('circle', { cx: box1.x, cy: box1.y, r: 24, fill: 'none', stroke: '#C8463C', 'stroke-width': 6 }), el('circle', { cx: box1.x, cy: box1.y, r: 9, fill: '#C8463C' })]));
    if (t >= 20.6) back.appendChild(el('path', { d: `M${box2.x - 20} ${box2.y - 9} Q${box2.x} ${box2.y - 16} ${box2.x + 20} ${box2.y - 9} Q${box2.x + 5} ${box2.y + 16} ${box2.x} ${box2.y + 18} Q${box2.x - 5} ${box2.y + 16} ${box2.x - 20} ${box2.y - 9} Z`, fill: '#E39A9A', opacity: 0.9 }));

    // ---- レン
    let R = Object.assign({}, RIG.POSES.sit, RIG.FACES.neutral, { scale: 1.3, x: RX + sh.x, y: 668 + sh.y, eyeLook: 0.8 });
    const press = (a, b, c) => { const p = seg(t, a, b), r = seg(t, b + 0.2, c); return ease(p) * (1 - ease(r)); };
    // ① 鼻（0.3〜2.0）
    let e1 = Math.max(press(0.3, 1.55, 2.0), 0.85 * (1 - seg(t, 0.3, 0.9)));   // 最初から寄っている姿勢から、途切れずに押し込む
    if (t < 2.0) Object.assign(R, RIG.POSES.nudge, { eyeShape: 'happy', mouth: 'w', bodyTilt: 18 * e1, headTilt: 26 * e1, headNod: 60 * e1, x: RX + PUSH * Math.max(e1, t < 0.3 ? 0.85 : 0) + sh.x });
    if (t < 0.3) Object.assign(R, { bodyTilt: 15, headTilt: 22, headNod: 50 });          // フック：最初から寄っている
    if (t >= 2.0 && t < 4.0) Object.assign(R, RIG.FACES.smug, { x: RX + PUSH * (1 - seg(t, 2.0, 2.4)) + sh.x });
    // ② 耳（4.3〜6.0）
    const e2 = press(4.3, 5.35, 6.0);
    if (t >= 4.0 && t < 6.6) Object.assign(R, RIG.POSES.nudge, RIG.FACES.smile, { bodyTilt: 26 * e2, headTilt: 48 * e2, headNod: 50 * e2, earR: 40 * e2, x: RX + (PUSH - 80) * e2 + sh.x });
    if (t >= 6.0 && t < 8.0) Object.assign(R, RIG.FACES.smug, { x: RX + sh.x, sparkle: pulse(t, 6.0, 6.8) });
    // ③ 全身ダイブ（8.0〜10.8）
    const jumpU = seg(t, 8.4, 9.0), back3 = seg(t, 10.0, 10.8);   // ダイブは0.6秒で一気に（ふわっと浮くと瞬間移動に見える）
    if (t >= 8.0 && t < 8.4) Object.assign(R, RIG.POSES.thump, RIG.FACES.sharp, { legLift: 0.4, bodySquash: -0.4 });       // ため
    if (jumpU > 0 && jumpU < 1) Object.assign(R, RIG.POSES.binky, RIG.FACES.smile, { x: RX + (PUSH + 40) * ease(jumpU) + sh.x, y: 668 - 260 * Math.sin(Math.PI * jumpU) + 40 * jumpU + sh.y, bodyTilt: 30 * jumpU, earL: -30, earR: 30 });
    if (t >= 9.0 && t < 10.0) Object.assign(R, RIG.POSES.loaf, RIG.FACES.smile, { x: RX + PUSH + 40 + sh.x, y: 708 + sh.y, bodySquash: -0.7 + 0.5 * ease(seg(t, 9.0, 9.6)) });   // 着地→ぺしゃ→ゆっくり起きる
    if (t >= 10.0 && t < 12.0) Object.assign(R, RIG.FACES.smug, { pose: 'sit', x: RX + (PUSH + 40) * (1 - ease(back3)) + sh.x, y: 668 + sh.y, sparkle: pulse(t, 10.6, 11.6) });
    // 足ダンでびっくり（13.0〜）
    const fright = seg(t, 13.05, 13.7);
    if (t >= 12.0 && t < 13.05) Object.assign(R, RIG.FACES.smug, { eyeLook: 0.9 });
    if (fright > 0) Object.assign(R, RIG.FACES.surprised, { sparkle: 0, eyeLook: 0.9, y: 668 - 120 * Math.sin(Math.PI * fright) + sh.y, earL: -30 * (1 - seg(t, 13.7, 14.3)), earR: 30 * (1 - seg(t, 13.7, 14.3)) });
    if (t >= 14.3) Object.assign(R, RIG.FACES.oops, { excl: 0, eyeLook: 0.9 });
    // ジルの正しいハンコを見て、隣にそっと鼻ハンコ（20.0〜）
    if (t >= 18.0) Object.assign(R, RIG.FACES.think, { excl: 0, sweat: 0, question: pulse(t, 18.0, 19.0), eyeLook: 0.8, headTilt: 10 });
    const e4 = press(19.6, 20.6, 21.2);
    if (t >= 19.6 && t < 21.4) Object.assign(R, RIG.POSES.nudge, { question: 0, eyeShape: 'happy', mouth: 'w', bodyTilt: 16 * e4, headTilt: 30 * e4, headNod: 46 * e4, x: RX + (PUSH - 60) * e4 + sh.x });
    if (t >= 21.4) Object.assign(R, RIG.FACES.shy, { heart: 0, blush: 0.8, eyeLook: 0.9 });
    draw('ren', 'ren', R, t, {});

    // ---- ジル（最初から床にいる）
    const JX = 640;
    let J = Object.assign({}, RIG.POSES.sit, RIG.FACES.neutral, { scale: 1.25, flip: true, x: JX + sh.x, y: 1240 + sh.y, eyeLook: 0.9 });
    if (t >= 2.4 && t < 4.0) Object.assign(J, RIG.FACES.annoyed, { sweat: 0, eyeLook: 0.9, eyeOpen: t > 3.0 && t < 3.15 ? 0.05 : 0.5 });   // 無言の凝視＋ゆっくりまばたき
    if (t >= 6.6 && t < 8.0) Object.assign(J, RIG.FACES.annoyed, { eyeLook: 0.9, sweat: 1, eyeOpen: (t > 7.0 && t < 7.08) || (t > 7.25 && t < 7.33) ? 0.15 : 0.5, earL: (t > 7.0 && t < 7.4) ? -8 : 0 });  // 目がピクッ
    if (t >= 10.8 && t < 12.6) Object.assign(J, RIG.FACES.sharp, { eyeLook: 0.9, earL: -6 * seg(t, 11.0, 12.0), earR: 6 * seg(t, 11.0, 12.0), bodySquash: -0.15 * seg(t, 11.0, 12.0) });  // 怒りのため
    const th = seg(t, 12.6, 13.1);
    if (th > 0 && th < 1) { const up = th < 0.75 ? th / 0.75 : 1 - (th - 0.75) / 0.25; Object.assign(J, RIG.POSES.thump, RIG.FACES.angry, { legLift: up, eyeLook: 0.9, y: 1240 - 30 * up + sh.y }); }
    if (t >= 13.1 && t < 16.2) Object.assign(J, RIG.FACES.sharp, { eyeLook: 0.9, excl: 0 });
    const reach = seg(t, 16.4, 17.4), ret = seg(t, 17.6, 18.2);
    if (reach > 0) { const e = ease(reach) * (1 - ease(ret)); Object.assign(J, RIG.POSES.stand, RIG.FACES.sharp, { headNod: -16 - 30 * e, bodyTilt: -10 * e, y: 1240 - 150 * e + sh.y, x: JX - 20 * e + sh.x, eyeLook: 0.6 }); }
    if (t >= 18.2) Object.assign(J, RIG.FACES.smug, { eyeLook: 0.4 });
    if (t >= 21.0) Object.assign(J, RIG.FACES.surprised, { excl: 0, eyeLook: 0.9 });
    if (t >= 21.6) Object.assign(J, RIG.FACES.shy, { eyeLook: 0.9 });
    const Jq = draw('jil', 'jil', J, t, { blink: !(t >= 2.4 && t < 4.0) && !(t >= 6.6 && t < 8.0) });

    // ---- カメラ（ショット割り）
    const renFace = { x: 360, y: 900 }, jilFace = { x: 860, y: 1470 }, both = { x: 560, y: 1150 };
    const shots = [
      { t: 0.0, cx: 520, cy: 1000, z: 1.9, z2: 2.1 },          // A 寄り：鼻ハンコ（フック）
      { t: 2.3, cx: jilFace.x, cy: jilFace.y, z: 2.2, z2: 2.4 }, // B 寄り：ジルの無言の凝視
      { t: 4.0, cx: 500, cy: 1020, z: 1.6 },                  // C 中：耳ハンコ
      { t: 6.6, cx: jilFace.x, cy: jilFace.y, z: 2.5, z2: 2.7 }, // D 寄り：目がピクッ
      { t: 8.0, cx: both.x, cy: 1050, z: 1.15 },              // E 引き：全身ダイブ
      { t: 10.8, cx: jilFace.x, cy: jilFace.y, z: 2.0, z2: 3.0 }, // F 寄り：怒りのため（音楽が止まる）
      { t: 12.9, cx: both.x, cy: 1150, z: 1.0 },              // G 引き：足ダン（ズームパンチ）
      { t: 14.6, cx: renFace.x + 60, cy: renFace.y + 60, z: 2.0 }, // H 寄り：しゅん
      { t: 16.2, cx: 600, cy: 1150, z: 1.25 },                // I 中：ジルが正しく押す
      { t: 19.2, cx: 520, cy: 1000, z: 1.8 },                 // J 寄り：レンが隣に鼻ハンコ
      { t: 21.2, cx: jilFace.x, cy: jilFace.y, z: 2.3 },      // K 寄り：ジル照れ
      { t: 22.6, cx: both.x, cy: 1100, z: 1.2, z2: 1.1 }      // L 引き：2匹（締め）
    ];
    const punch = Math.max(0, 1 - Math.abs(t - 13.0) / 0.25);
    camera(cameraAt(shots, t), punch);

    thumpWave(f, t, 13.0, Jq.x + 200 * 1.25, 1730);
    sparkle(f, t, 17.4, box1.x, box1.y, 1);
    speedLines(ui, t > 8.4 && t < 9.0 ? 1 : (t > 12.95 && t < 13.5 ? 1 - seg(t, 12.95, 13.5) : 0));
    impactFlash(ui, Math.max(0, 1 - Math.abs(t - 13.02) / 0.12));
    if (t >= 21.6) f.appendChild(el('path', { d: `M${(box1.x + box2.x) / 2} ${box2.y - 60} c -12 -18 -38 -6 -26 12 l26 24 l26 -24 c12 -18 -14 -30 -26 -12 Z`, fill: '#E86A75', opacity: seg(t, 21.6, 22.0) }));
    endcard(t, dur);
  }
};
