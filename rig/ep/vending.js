// 第N話 v2「自販機」（約11.5秒）
// ゲーム：自販機を叩けば出る（はず）。①ぺちっ→缶1本 ②どんっ→缶3本 ③（間）→大足ダン→缶がどさどさ8本。ジルが全部抱えて受け止める
// → ジルは1本だけ飲んで、残りを抱えて去る。レンの手は空のまま
// オチ：缶が1本だけ転がってレンの足元へ（にんじんジュース！）→ オチの後のオチ：開けたら、さんざん揺れた缶が顔にぷしゅー
window.EP = {
  dur: 11.5,
  bgmHolds: '4.3-5.0',
  sfx: [{ t: 0.55, type: 'click' }, { t: 0.65, type: 'clink' }, { t: 1.3, type: 'tap' }, { t: 1.75, type: 'blink' },
        { t: 2.05, type: 'tap' }, { t: 2.4, type: 'clink' },
        { t: 2.85, type: 'thump' }, { t: 3.2, type: 'clink' }, { t: 3.25, type: 'clink' }, { t: 3.3, type: 'clink' },
        { t: 3.0, type: 'swish' }, { t: 4.0, type: 'blink' },
        { t: 5.0, type: 'thump' }, { t: 5.05, type: 'boing' }, { t: 5.34, type: 'clink' }, { t: 5.5, type: 'clink' }, { t: 5.65, type: 'clink' }, { t: 5.8, type: 'clink' },
        { t: 5.95, type: 'clink' }, { t: 6.1, type: 'clink' }, { t: 6.25, type: 'clink' }, { t: 6.4, type: 'clink' },
        { t: 7.0, type: 'pon' }, { t: 7.5, type: 'swish' }, { t: 8.4, type: 'tap' }, { t: 8.7, type: 'swish' }, { t: 9.1, type: 'tap' }, { t: 9.5, type: 'clink' },
        { t: 10.1, type: 'pop' }, { t: 10.15, type: 'whoosh' }, { t: 10.9, type: 'blink' }],
  frame(t) {
    const dur = this.dur, sh = shakeAt(t, 5.0, 0.5, 26), shB = shakeAt(t, 2.85, 0.3, 12), shA = shakeAt(t, 2.05, 0.2, 5);
    const S = { x: sh.x + shB.x + shA.x, y: sh.y + shB.y + shA.y };
    office({ clock: [14, 20], shake: S, mug: false });
    const f = clear('fx'), back = clear('back'), ui = clear('ui');

    const CAN_COL = ['#4E8FC7', '#6DAE5B', '#D9708F', '#8E7FC4', '#E0B13E', '#5BA7A0'];
    const canShape = (x, y, s, rot, col, carrot) => el('g', { transform: `translate(${x} ${y}) rotate(${rot}) scale(${s})` }, [
      el('rect', { x: -22, y: -34, width: 44, height: 68, rx: 9, fill: col, stroke: '#4E3626', 'stroke-width': 4 }),
      el('rect', { x: -22, y: -34, width: 44, height: 11, rx: 5, fill: '#D8DDE2', stroke: '#4E3626', 'stroke-width': 3 }),
      carrot ? el('path', { d: 'M-10 -8 L10 -8 L0 22 Z', fill: '#F08A24', stroke: '#4E3626', 'stroke-width': 2.5 }) : el('circle', { cx: 0, cy: 6, r: 8, fill: '#FFFFFF', opacity: 0.8 }),
      carrot ? el('path', { d: 'M0 -8 q-7 -10 -2 -14 M0 -8 q7 -10 2 -14', fill: 'none', stroke: '#4E9E4A', 'stroke-width': 4, 'stroke-linecap': 'round' }) : null
    ]);
    const carrotIcon = (x, y, s) => el('g', { transform: `translate(${x} ${y}) scale(${s})` }, [
      el('path', { d: 'M-16 -14 L16 -14 L0 38 Z', fill: '#F08A24', stroke: '#4E3626', 'stroke-width': 4, 'stroke-linejoin': 'round' }),
      el('path', { d: 'M0 -14 q-12 -16 -4 -24 M0 -14 q12 -16 4 -24', fill: 'none', stroke: '#4E9E4A', 'stroke-width': 6, 'stroke-linecap': 'round' })
    ]);

    // ---- 自販機（レンの手前の床に置く）
    const mx = 540 + S.x, my = 1000 + S.y;
    const rumble = t > 0.85 && t < 1.5 ? Math.sin(t * 90) * 3 : 0;
    const lit = t > 0.7;
    const redX = t > 1.5 && t < 2.1 ? (Math.floor(t * 8) % 2 === 0) : (t >= 2.1);
    const mc = (x, y, w, h, fill, extra) => el('rect', Object.assign({ x: mx + x + rumble, y: my + y, width: w, height: h, rx: 10, fill }, extra || {}));
    back.appendChild(el('g', {}, [
      mc(0, 0, 400, 720, '#5BA7A0', { stroke: '#2F5E5A', 'stroke-width': 8, rx: 22 }),
      mc(14, 14, 372, 52, '#FFF3D6', { stroke: '#2F5E5A', 'stroke-width': 5 }),
      carrotIcon(mx + 200 + rumble, my + 22, 0.5),
      mc(130, 80, 240, 372, '#CFE6EC', { stroke: '#2F5E5A', 'stroke-width': 6 }),
      mc(130, 174, 240, 8, '#7B9AA3', {}), mc(130, 292, 240, 8, '#7B9AA3', {}), mc(130, 410, 240, 8, '#7B9AA3', {}),
      mc(26, 80, 88, 372, '#3E6F6B', { stroke: '#2F5E5A', 'stroke-width': 5 }),
      mc(40, 94, 60, 60, lit ? '#FFD86B' : '#F5E8C8', { stroke: '#4E3626', 'stroke-width': 4 }),
      carrotIcon(mx + 70 + rumble, my + 108, 0.5),
      mc(40, 170, 60, 30, '#2B3A3E', {}),
      mc(40, 230, 60, 44, '#C9D3D6', { stroke: '#4E3626', 'stroke-width': 4 }),
      mc(46, 246, 48, 12, '#1E2833', { rx: 4 }),
      mc(130, 500, 240, 170, '#2B3A3E', { stroke: '#2F5E5A', 'stroke-width': 6 }),
      mc(20, 480, 100, 200, '#4B857F', { stroke: '#2F5E5A', 'stroke-width': 4 })
    ]));
    const winCan = (r, c) => [mx + 160 + c * 58 + rumble, my + 135 + r * 118];
    // 窓の中の缶（静止）。落ちる缶は抜けていく
    const outAt = { '2,3': 2.05, '2,2': 2.85, '2,1': 2.88, '2,0': 2.91, '1,3': 5.0, '1,2': 5.15, '1,1': 5.3, '1,0': 5.45, '0,3': 5.6, '0,2': 5.75, '0,1': 5.9, '0,0': 6.05 };
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      if (t >= outAt[r + ',' + c]) continue;
      const [x, y] = winCan(r, c);
      back.appendChild(canShape(x, y, 0.82, 0, CAN_COL[(r * 4 + c) % 6], false));
    }
    // 表示パネルの赤い×（にんじんが売り切れ）
    if (redX) back.appendChild(el('g', { transform: `translate(${mx + 70} ${my + 108})` }, [el('path', { d: 'M-24 -24 L24 24 M24 -24 L-24 24', stroke: '#D23A2E', 'stroke-width': 9, 'stroke-linecap': 'round' })]));
    // コイン投入口
    const slot = { x: mx + 70, y: my + 252 };

    // ---- レン
    const RX = 60, RY = 1180;
    let R = Object.assign({}, RIG.POSES.stand, RIG.FACES.neutral, { scale: 1.3, x: RX + S.x, y: RY + S.y, eyeLook: 0.9, headNod: -4 });
    // コインを入れる（前に寄る）
    const lean = goBack(t, 0.15, 0.5, 0.6, 1.0);
    if (t < 1.1) Object.assign(R, RIG.POSES.lean, { bodyTilt: -8 + 14 * lean, headNod: 4 * lean, eyeLook: 0.9, x: RX + 40 * lean + S.x });
    if (t >= 1.1 && t < 2.0) Object.assign(R, RIG.FACES.think, { question: 0.5 + 0.5 * Math.sin(t * 6), eyeLook: 0.9, headTilt: 10 });
    // ① ぺちっ
    const pat = goBack(t, 1.95, 2.1, 2.2, 2.5);
    if (t >= 2.0 && t < 2.8) Object.assign(R, RIG.POSES.lean, RIG.FACES.oops, { bodyTilt: 12 * pat, x: RX + 40 * pat + S.x, eyeLook: 0.9, sweat: 0 });
    // ② どんっ（体当たり）
    const bump = goBack(t, 2.65, 2.85, 3.0, 3.4);
    if (t >= 2.8 && t < 3.5) Object.assign(R, RIG.POSES.lean, RIG.FACES.angry, { excl: 0, bodyTilt: 18 * bump, x: RX + 90 * bump + S.x, eyeLook: 0.9 });
    if (t >= 2.6 && t < 2.8) Object.assign(R, RIG.POSES.lean, RIG.FACES.sharp, { bodyTilt: 18 * bump, x: RX + 90 * bump + S.x, eyeLook: 0.9 });
    // 缶3本→ほしいのはこれじゃない。ジルが来る間、ふるえる
    if (t >= 3.5 && t < 4.3) Object.assign(R, RIG.FACES.angry, { excl: 0, sweat: 0, eyeLook: 0.9 });
    // ③ 足ダン構え→ドン
    thumpPose(R, t, 4.35, 5.0, S, RY);
    if (t >= 4.35 && t < 5.0) Object.assign(R, { x: RX + 20 + S.x });
    // 缶がどさどさ→あぜん
    if (t >= 5.0 && t < 6.4) Object.assign(R, RIG.POSES.stand, RIG.FACES.surprised, { x: RX + S.x, y: RY - 40 * pulse(t, 5.0, 5.5) + S.y, eyeLook: 0.9, excl: 1 - seg(t, 5.6, 6.0) });
    // 期待のきらきら（缶の山を見る）
    if (t >= 6.4 && t < 7.3) Object.assign(R, RIG.POSES.stand, RIG.FACES.smile, { blush: 0, eyeShape: 'round', mouth: 'open', eyeOpen: 1.2, sparkle: pulse(t, 6.4, 7.2), eyeLook: 0.9, x: RX + S.x });
    // ジルが1本飲んで去る。レンは手を出したまま固まる→しょんぼり
    if (t >= 7.3) Object.assign(R, RIG.POSES.stand, RIG.FACES.oops, { sweat: 0.6, eyeOpen: 0.6, eyeLook: 0.9, x: RX + S.x, headNod: 2, earL: 14 * seg(t, 7.8, 8.4), earR: 14 * seg(t, 7.8, 8.4) });
    // 缶が足元へ→見る→拾う→開ける→ぷしゅー
    const lookDown = seg(t, 9.0, 9.4);
    if (t >= 9.0) Object.assign(R, { headNod: 2 + 26 * ease(lookDown) * (1 - seg(t, 9.9, 10.1)), eyeLook: 0.2 });
    if (t >= 9.5) Object.assign(R, RIG.FACES.smile, { sparkle: pulse(t, 9.5, 10.1), blush: 0.5, headNod: 8 * (1 - seg(t, 9.5, 9.9)) });
    if (t >= 10.1) Object.assign(R, RIG.FACES.surprised, { sparkle: 0, blush: 0, excl: 0, headNod: -6, eyeOpen: 0.15, eyeShape: 'flat', mouth: 'line' });
    if (t >= 10.8) Object.assign(R, RIG.FACES.annoyed, { sweat: 1, headNod: 0, eyeLook: 0.9 });
    const Rq = draw('ren', 'ren', R, t, { blink: !(t >= 5.0 && t < 7.0) });
    const faceR = { x: Rq.x + 180 * Rq.scale, y: Rq.y + (192 + (Rq.headNod || 0)) * Rq.scale };

    // ---- コイン
    if (t < 0.75) {
      const u = seg(t, 0.15, 0.62), sx = faceR.x + 70, sy = faceR.y + 70;
      const cx = lerp(sx, slot.x, ease(u)), cy = lerp(sy, slot.y, ease(u)) - 110 * Math.sin(Math.PI * u);
      if (t < 0.62) f.appendChild(el('g', { transform: `translate(${cx} ${cy}) rotate(${u * 540})` }, [el('ellipse', { cx: 0, cy: 0, rx: 16 * Math.abs(Math.cos(u * 14)) + 4, ry: 16, fill: '#F2C14E', stroke: '#4E3626', 'stroke-width': 4 })]));
    }
    if (t >= 0.62 && t < 1.0) sparkle(f, t, 0.62, slot.x, slot.y - 10, 0.5);

    // ---- ジル
    const JC = 470;           // 受け止める位置（左端）
    const hpIn = RIG.hop(t, 2.9, 3.6, 1150, JC, { hops: 3, height: 34 });
    const hpOut = RIG.hop(t, 7.7, 8.8, JC, 1250, { hops: 4, height: 34 });
    const jx = t < 7.7 ? hpIn.x : hpOut.x, jyo = t < 7.7 ? hpIn.yOff : hpOut.yOff, jsq = t < 7.7 ? hpIn.squash : hpOut.squash;
    let J = Object.assign({}, RIG.POSES.stand, RIG.FACES.sharp, { scale: 1.35, flip: true, x: jx + S.x, y: 1170 + jyo + S.y, bodySquash: jsq, eyeLook: 0.9 });
    if (t >= 3.6 && t < 4.5) { // ひと目で分かる：呆れ顔（半目・ため息・汗）→ やれやれと構える
      Object.assign(J, RIG.FACES.annoyed, { eyeOpen: 0.45, sweat: 1, eyeLook: 0.9, earL: 10 * seg(t, 3.7, 4.2), earR: 10 * seg(t, 3.7, 4.2), headNod: 6 * pulse(t, 3.6, 4.4) });
    }
    if (t >= 4.5 && t < 5.0) Object.assign(J, RIG.FACES.sharp, { bodySquash: -0.2, eyeLook: 0.9 });
    // 受け止め：缶が入るたびにぐっと沈む
    const nCaught = clamp(Math.floor((t - 5.25) / 0.15) + 1, 0, 8);
    if (t >= 5.0 && t < 6.6) Object.assign(J, RIG.FACES.surprised, { excl: 0, eyeOpen: 1.1, bodySquash: -0.12 - 0.04 * nCaught, sweat: 1 });
    if (t >= 6.6 && t < 7.0) Object.assign(J, RIG.FACES.sharp, { bodySquash: -0.4, eyeLook: 0.5 });
    if (t >= 7.0 && t < 7.7) Object.assign(J, RIG.FACES.smug, { bodySquash: -0.4, eyeLook: 0.5, sparkle: 0 });
    if (t >= 7.7) Object.assign(J, RIG.FACES.smug, { sparkle: 0, eyeLook: 0.2 });
    const Jq = draw('jil', 'jil', J, t, { blink: t >= 7.0 || t < 3.6 });

    // ---- 缶（受け止める山）
    const pileDx = jx - JC;
    const pileSlot = i => { const r = Math.floor(i / 4), c = i % 4; return { x: JC + 70 + c * 64 + (r % 2) * 28, y: 1660 - r * 64 }; };
    // 落ちる缶: [落ち始め, 山のどこに入るか, 色, 開始x, にんじんか]
    const cans = [
      [2.05, 0], [2.85, 1], [2.88, 2], [2.91, 3],
      [5.0, 4], [5.15, 5], [5.3, 6], [5.45, 7], [5.6, 8], [5.75, 9], [5.9, 10], [6.05, 11]
    ];
    // 山に入った缶は、ジルが来る前は受け皿に、来たらジルの腕の中に。去るときはジルと一緒に動く
    const SIP = 11;       // 飲む1本（山のてっぺん）
    const DROPPED = 10;   // 途中で落とす1本（にんじん）
    cans.forEach(([t0, idx], n) => {
      const sl = pileSlot(idx), fall = 0.34;
      if (idx === DROPPED && t >= 8.3) return;                    // 転がる缶は別に描く
      const rr = idx < 4 ? 2 : idx < 8 ? 1 : 0, cc = 3 - (idx % 4); const x0 = winCan(rr, cc)[0], y0 = winCan(rr, cc)[1];
      let x, y, rot = (idx * 37) % 40 - 20, s = 1;
      if (t < t0) return;
      const u = seg(t, t0, t0 + fall);
      const px = sl.x + (t >= 7.7 ? pileDx : 0) + (idx > 3 && idx < 12 ? 0 : 0);
      if (u < 1) { x = lerp(x0, sl.x, u); y = lerp(y0, sl.y, u * u); rot = lerp(rot + 200, rot, u); s = 0.9; }
      else { const b = t - (t0 + fall); y = sl.y - 14 * Math.max(0, Math.sin(b * 22)) * Math.exp(-b * 8); x = px; s = 1; }
      // 1本を飲む（顔の高さまで上げて傾ける）
      if (idx === SIP && t >= 6.7) {
        const up = ease(seg(t, 6.7, 7.1)), tip = pulse(t, 7.0, 7.7);
        const hx = Jq.x + (400 - 188) * Jq.scale + 6, hy = Jq.y + (120 + 70) * Jq.scale;
        x = lerp(sl.x, hx - 40, up); y = lerp(sl.y, hy + 85, up); rot = lerp(rot, -20, up) - 50 * tip;
        if (t >= 7.7) { x = hx - 40; y = hy + 85; }
      }
      if (x > 1260) return;
      const behind = u < 1 && t >= 3.6 && y < 1500;
      (behind ? back : f).appendChild(canShape(x, y, s, rot, CAN_COL[(idx + 1) % 6], false));
    });
    // 転がる1本（ジルの山から落ちて、レンの足元へ）
    if (t >= 8.3) {
      const s0 = pileSlot(DROPPED), ex = faceR.x + 60 + 0, ey = 1660;
      let x, y, rot;
      if (t < 8.6) { const u = seg(t, 8.3, 8.6); x = lerp(s0.x + (jx - JC), 880, u); y = lerp(s0.y, ey - 30, u * u); rot = 20 + 400 * u; }
      else { const u = ease(seg(t, 8.6, 9.5)); x = lerp(880, ex, u); y = ey - 30 + 8 * Math.abs(Math.sin((t - 8.6) * 14)) * (1 - u); rot = 90 + 420 + 1000 * u; }
      if (t < 9.5) f.appendChild(canShape(x, y, 1, rot, '#F08A24', true));
      else if (t < 9.9) { const u = ease(seg(t, 9.5, 9.9)); f.appendChild(canShape(lerp(ex, faceR.x + 40, u), lerp(ey - 30, faceR.y + 140, u) - 30 * Math.sin(Math.PI * u), 1, lerp(90 + 420 + 1000, 0, u) % 360, '#F08A24', true)); }
      else {
        const cx = faceR.x + 40, cy = faceR.y + 140;
        f.appendChild(canShape(cx, cy, 1, 0, '#F08A24', true));
        if (t >= 10.1 && t < 11.3) { // ぷしゅー：上へ噴き出して、頭の上に降る（目は隠さない）
          const d = seg(t, 10.1, 11.2);
          for (let i = 0; i < 14; i++) {
            const a = -Math.PI / 2 + (i - 7) * 0.12, v = 0.55 + (i % 4) * 0.12, tt = Math.min(1, d * 2.5);
            const px = cx + Math.cos(a) * 520 * v * tt + (i - 7) * 14 * d, py = cy + Math.sin(a) * 620 * v * tt + 900 * Math.max(0, d - 0.4) * Math.max(0, d - 0.4);
            if (py > faceR.y - 30 && py < faceR.y + 60 && Math.abs(px - faceR.x) < 150) continue;
            f.appendChild(el('circle', { cx: px, cy: py, r: 9 + (i % 3) * 4, fill: i % 2 ? '#F6A640' : '#FFE2A8', opacity: 1 - seg(t, 10.9, 11.3) }));
          }
        }
      }
    }
    // 顔にしたたり
    if (t >= 10.5) { const d = seg(t, 10.5, 11.4); f.appendChild(el('path', { d: `M${faceR.x - 70} ${faceR.y - 110 + 70 * d} q-9 14 0 22 q9 -8 0 -22 Z`, fill: '#F6A640', opacity: 0.9 })); }

    if (t >= 3.8 && t < 4.5) { // ため息のふわっ（レンにあきれている）
      const d = seg(t, 3.8, 4.5);
      for (let i = 0; i < 3; i++) { const v = clamp(d * 1.3 - i * 0.18, 0, 1); if (v <= 0 || v >= 1) continue;
        f.appendChild(el('circle', { cx: Jq.x + 150 - 120 * v - i * 20, cy: Jq.y + 200 * Jq.scale + 10 * v, r: 16 + 14 * v + i * 4, fill: '#FFFFFF', stroke: '#C9B79E', 'stroke-width': 3, opacity: 0.9 * (1 - v) })); }
    }
    thumpWave(f, t, 5.0, 330, 1700);
    thumpWave(f, t, 2.85, 600, 1650);
    const punch = impactAt(ui, t, 5.0);
    const shots = [
      { t: 0.0, cx: 560, cy: 1300, z: 1.3, z2: 1.42 },              // A 寄り：自販機とコイン
      { t: 2.7, cx: 620, cy: 1320, z: 1.4 },                        // B 中：どんっ→缶3本
      { t: 3.5, cx: 760, cy: 1340, z: 2.5 },                        // C 寄り：ジルの呆れ顔（レンのことをどう思っているか）
      { t: 4.4, cx: 420, cy: 1440, z: 1.7, z2: 2.0 },               // D 寄り：ため（レンが足を上げる・無音）
      { t: 4.75, cx: 560, cy: 1330, z: 1.2 },                      // E 引き：大足ダン→缶どさどさ
      { t: 6.3, cx: 740, cy: 1380, z: 1.85 },                       // F 寄り：ジルが山を抱えて1本飲む
      { t: 7.6, cx: 640, cy: 1290, z: 1.2 },                        // G 引き：ジルが缶を抱えて去る
      { t: 8.6, cx: 400, cy: 1560, z: 1.9 },                        // H 寄り：足元へ缶が転がる
      { t: 9.8, cx: 340, cy: 1450, z: 2.3, z2: 2.0 }                // I 寄り：ぷしゅー
    ];
    camera(cameraAt(shots, t), punch);
    endcard(t, dur);
  }
};
