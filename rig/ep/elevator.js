// 「エレベーター 第1話：気まずい2人」（20秒＋エンドカード1秒・セリフなし）2026-11-16 オーナーの絵コンテで作り直し（同日、20秒に）
// 状況：エレベーターで上司と2人きり。気まずい沈黙
// オチ：ごまかして耳をゆらしていたら、課長の耳が全部の階のボタンを押していた（ユズの無言のツッコミ・つづく）
// 0.0–3.0   扉が閉まる（チーン・ウィーン）→ 2人だけ。チラッと見て、同時に反対へ目をそらす
// 3.0–7.5   沈黙。モチはキョロキョロ・モゾモゾ、ユズは真顔で階の表示。4〜6秒は上に「・・・。」。最後の 0.6 秒は完全に止まる
// 7.5–13.3  モチは気まずさをごまかすように、天井を見ながら耳を左右にゆらす（無意識・♪）。ゆれるたびに耳の先がボタンにふれ、
//           何回かに分けて上から順に押される（ピッ…ピッピッ…ピッピッ…ピピピッ）。全部光った後、モチが固まる
// 13.6–17.0 ユズが光るボタンを見る → ゆっくりモチへ（無言のツッコミ）→ モチもおそるおそる → 目が合って静止
// 17.4–20.0 テロップ「続きは次回！ フォローして待っててね」。全部の階が光ったまま（第2話へ続く）
// セット（内装・ボタン・照明・立ち位置）は rig/v2/elevator_set.js を共通で使う
document.write('<script src="v2/lib.js"><\/script><script src="v2/elevator_set.js"><\/script>');
(function () {
  const sm = (a, b, t) => { const k = Math.max(0, Math.min(1, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
  // 耳の角度 → 耳の先のいちばん右の x（モチを x=392 に置いて実測。2026-11-16）。耳の先をボタンの列に重ねるための x を出す
  const EAR_X = [[-100, 1060], [-96, 1067], [-92, 1073], [-88, 1077], [-84, 1080], [-80, 1082], [-76, 1083], [-72, 1082], [-68, 1080], [-64, 1077], [-60, 1072], [-56, 1066], [-52, 1059], [-40, 1031], [-30, 1002], [-20, 969], [-10, 934], [0, 902]];
  const earRight = e => { for (let i = 0; i < EAR_X.length - 1; i++) { const [e0, r0] = EAR_X[i], [e1, r1] = EAR_X[i + 1]; if (e <= e1) return L.lerp(r0, r1, (e - e0) / (e1 - e0)); } return 902; };
  const xFor = e => 392 + (ELV.BX + 14) - earRight(e);
  // 耳のゆれ：[外へ振る開始, 外のいちばん端の時間, 戻り終わり, 外の角度, そのときのモチの x（null＝届かない位置）]
  //   外へ振るとき、x も少しずつ右へ（モゾモゾ）→ いちばん外に振れた瞬間だけ耳の先がボタンの列にかかる。戻るときは耳がボタンからはなれる
  const SW = [
    [7.85, 8.25, 8.7, -40, 'far'],     // 1回目：まだ届かない（ゆらし始め）
    [8.7, 9.15, 9.65, -86, 'hit'],     // 2回目：いちばん上（8）
    [9.65, 10.15, 10.65, -74, 'hit'],  // 3回目：7・6
    [10.65, 11.15, 11.65, -62, 'hit'], // 4回目：5・4
  ];
  const DROOP = [11.65, 12.15, 12.95]; // 最後：外へ振って（-55）そのまま重みで垂れる → 3・2・1 が続けて（ピピピッ）
  const HOLD_E = -30;
  // 体も耳と一緒に左右にゆれる：外へ振るときは x を遅れて右へ（u^3）、戻るときは耳より先に左へ 70px もどす。
  //   こうしないと、耳が外へ振れる途中（-80° あたりが耳のいちばん外）で、ねらっていない下のボタンまでふれてしまう（2026-11-16 実測）
  const BACK = 70;
  function earAt(t) {   // { e: 耳の角度, x: モチの x }
    const R = ELV.REN; let e = 0, prevX = R.x;
    for (const [a, p, b, ep, mode] of SW) {
      const tx = mode === 'far' ? R.x : xFor(ep), back = mode === 'far' ? R.x : tx - BACK;
      if (t < a) return { e, x: prevX };
      if (t < p) { const u = sm(a, p, t); return { e: L.lerp(-22, ep, L.ease(u)), x: L.lerp(prevX, tx, Math.pow(u, 3)) }; }
      if (t < b) { const v = sm(p, b, t); return { e: L.lerp(ep, -22, L.ease(v)), x: L.lerp(tx, back, Math.sqrt(v)) }; }   // 体は耳より先に左へ（はなれる）
      e = -22; prevX = back;
    }
    const [a, p, b] = DROOP, tx0 = xFor(-55);
    if (t < p) { const u = sm(a, p, t); return { e: L.lerp(-22, -55, L.ease(u)), x: L.lerp(prevX, tx0, Math.pow(u, 3)) }; }
    const u = Math.pow(sm(p, b, t), 1.4), ee = L.lerp(-55, HOLD_E, u);
    return { e: ee, x: xFor(ee) };
  }
  // ---- モチの動き（耳がボタンにふれるかは、この動きの実際の耳の形で判定する）----
  function renPose(t) {
    const R = ELV.REN, F = RIG.FACES;
    let x = R.x, tilt = 0, sq = 0, nod = 0, earR = 0, earL = 0, look = 0, eyeOpen = 1, face = F.neutral, extra = {};
    // 2.2–2.6 チラッ（ユズの方＝左）→ 2.6 同時に反対（右）へ。目だけだと小さいので首も少しかしげる
    if (t >= 2.2 && t < 2.6) { look = -sm(2.2, 2.3, t); extra.headTilt = -7 * sm(2.2, 2.35, t); }
    else if (t >= 2.6 && t < 3.0) { look = sm(2.6, 2.68, t); extra.headTilt = L.lerp(-7, 7, sm(2.6, 2.72, t)); }
    // 3.0–6.2：キョロキョロ（0.3 秒ごとに目線が飛ぶ）＋モゾモゾ
    if (t >= 3.0 && t < 6.2) {
      const seq = [1, -.3, .7, -.6, .2, .9, -.2, .5, -.7, .4, 1, -.4, .3, .8, -.1], i = Math.floor((t - 3.0) / .3), u = ((t - 3.0) % .3) / .3;
      look = L.lerp(seq[Math.max(0, i - 1)] ?? 1, seq[Math.min(i, seq.length - 1)], L.ease(Math.min(1, u * 2.5)));
      extra.headTilt = 7 * (1 - sm(3.0, 3.4, t));
      tilt = 3 * Math.sin((t - 3.0) * 8) * (1 - sm(5.8, 6.2, t)); sq = .05 * Math.sin((t - 3.0) * 12); x += 4 * Math.sin((t - 3.0) * 6) * (1 - sm(5.8, 6.2, t));
      extra.sweat = .5 * sm(3.6, 4.2, t);
    }
    if (t >= 6.2 && t < 7.5) { look = .5; extra.sweat = .5; }   // だまって止まる（6.9–7.5 は完全に静止）
    // 7.5–13.3：天井を見て、気まずさをごまかすように耳を左右にゆらす（本人は気づいていない＝のんきな顔・♪）
    if (t >= 7.5 && t < 13.3) {
      const a = sm(7.5, 7.85, t), E = earAt(t);
      earR = L.lerp(0, E.e, a); earL = .3 * earR;                // 左の耳も外へ小さく（パタパタ。内がわへ振ると顔にかぶる）
      x = E.x;
      const sway = Math.sin((t - 7.85) * Math.PI / 1.0);         // 体も耳のゆれに合わせて小さく左右に
      tilt = 6 * a; extra.headTilt = 6 * a; nod = -12 * a; sq = .03 * sway * a;   // 体のかたむきは一定（耳の位置の実測と同じ）。左右のゆれは x で
      look = .2; face = Object.assign({}, F.smile, { blush: .3 });   // 目を細めて、のんき
      if (t > 12.3) face = Object.assign({}, F.neutral, { mouth: 'w' });
    }
    // 13.3：突然固まる（気づく）。耳はボタンにのせたまま
    if (t >= 13.3) {
      const f = sm(13.3, 13.42, t);
      earR = HOLD_E; earL = .3 * HOLD_E; x = xFor(HOLD_E); tilt = 4; extra.headTilt = 5; nod = -12 * (1 - f) + 6 * f; sq = -.1 * f + .05 * L.pulse(t, 13.3, 13.5); look = .3;
      face = Object.assign({}, F.neutral, { mouth: 'line' }); eyeOpen = 1 + .22 * f; extra.sweat = f;
    }
    // 16.2–16.9：おそるおそるユズを見る
    if (t >= 16.2) { const g = sm(16.2, 16.9, t); look = L.lerp(.3, -1, g); extra.headTilt = L.lerp(5, -6, g); }
    return Object.assign({}, RIG.POSES.sit, face, { x, y: ELV.y(R) + nod * .3, scale: R.s, bodyTilt: tilt, bodySquash: sq, headNod: nod * .5, earL, earR, eyeLook: look, eyeOpen, blush: face.blush ?? .25 }, extra.sweat ? { sweat: extra.sweat } : {}, extra.headTilt != null ? { headTilt: extra.headTilt } : {});
  }
  // ユズ：真顔で階の表示 → 光るボタンをじっと → ゆっくりモチへ
  function jilPose(t) {
    const J = ELV.JIL, F = RIG.FACES;
    let look = 0, nod = 0, htilt = 0, face = F.neutral, eyeOpen = 1;
    if (t >= 2.2 && t < 2.6) { look = sm(2.2, 2.3, t); htilt = 7 * sm(2.2, 2.35, t); }                                // チラッ（モチの方＝右）
    else if (t >= 2.6 && t < 3.0) { look = -sm(2.6, 2.68, t); htilt = L.lerp(7, -7, sm(2.6, 2.72, t)); }              // 同時に反対へ
    if (t >= 3.0 && t < 13.6) { look = L.lerp(-1, 0, sm(3.0, 3.3, t)); htilt = -7 * (1 - sm(3.0, 3.3, t)); nod = -16 * sm(3.0, 3.4, t); face = F.sharp; } // 階の表示をじっと
    if (t >= 13.6) {
      const a = sm(13.6, 14.1, t); look = L.lerp(0, .9, a); nod = L.lerp(-16, 8, a); face = F.sharp;                    // 光るボタンを見る（右下）
      const b = sm(15.2, 16.4, t); htilt = 10 * b; nod = L.lerp(nod, 2, b); look = L.lerp(look, 1, b);                  // ゆっくりモチへ（無言のツッコミ）
      if (b > 0) face = Object.assign({}, F.sharp, { eyeShape: 'half', mouth: 'line' }); eyeOpen = L.lerp(1, .6, sm(15.4, 15.9, t));
    }
    return Object.assign({}, RIG.POSES.sit, face, { x: J.x, y: ELV.y(J), scale: J.s, eyeLook: look, headNod: nod, headTilt: htilt, eyeOpen });
  }
  // 完全に止まる時間（呼吸・まばたき・耳のゆれも止める）
  const still = t => (t >= 6.9 && t < 7.5) || t >= 16.95;
  const charOpt = (t, extra) => Object.assign({ twitch: !still(t) && !(t > 7.4 && t < 13.6) }, still(t) ? { blink: false, breathe: false, ears: false } : {}, (t > 7.4 && t < 13.6) ? { ears: false } : {}, extra || {});

  // ---- 耳がふれた時間（実際に描いて判定。1回だけ計算）----
  let TOUCH = null;
  function touches() {
    if (TOUCH) return TOUCH;
    TOUCH = {};
    for (let t = 7.4; t <= 13.6; t += 1 / 240) {
      L.char('ren', renPose(t), t, '', charOpt(t, { shadow: false }));
      for (const n of ELV.earTouch()) if (TOUCH[n] == null) TOUCH[n] = Math.round(t * 1000) / 1000;
    }
    return TOUCH;
  }
  const BASE_SFX = [
    { t: 0.0, type: 'hum', pan: 0 },   // 空気の音（ずっと小さく）
    { t: 0.2, type: 'ding', pan: .2 }, { t: 0.45, type: 'door' },
    { t: 2.22, type: 'blink', pan: -.2 }, { t: 2.6, type: 'swish' },
    { t: 7.55, type: 'swish', pan: .4 },
    { t: 13.32, type: 'twitch', pan: .3 },
    { t: 15.25, type: 'blink', pan: -.3 },
    { t: 17.45, type: 'pop' }
  ];
  var sfxCache = null;
  // テロップ（最後）：画面の文字はカメラの外（ui）に。Instagram の下の隠れる範囲より上
  // 2026-11-17 オーナー：テロップに英語も（日本語の下に小さく）
  const TELOP = (k) => k <= 0 ? '' : `<g transform="translate(540 1430) scale(${L.outBack(Math.min(1, k * 1.6))})" opacity="${Math.min(1, k * 3)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle">
    <rect x="-452" y="-122" width="904" height="292" rx="46" fill="#3B2412" opacity=".22" transform="translate(6 10)"/>
    <rect x="-452" y="-122" width="904" height="292" rx="46" fill="#3A2414" opacity=".9"/><rect x="-436" y="-108" width="872" height="18" rx="9" fill="#fff" opacity=".08"/>
    <text y="-16" font-size="88" fill="#FFF7E8">続きは次回！</text><text y="66" font-size="54" fill="#F2D3A8">フォローして待っててね</text>
    <text y="128" font-size="38" fill="#FFF7E8" opacity=".85" font-family="Noto Sans, Noto Sans CJK JP, sans-serif">To be continued! Follow us</text></g>`;
  // 4〜6秒：上に「・・・。」（2人きりの気まずさ）。点が 1 つずつ増えて「。」で止まる
  const DOTS = t => { if (t < 4.0 || t > 6.0) return ''; const n = Math.min(4, 1 + Math.floor((t - 4.0) / .3)), a = Math.min(1, (t - 4.0) * 6, (6.0 - t) * 5);
    const txt = '・・・。'.slice(0, n);
    return `<g opacity="${a.toFixed(2)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="start"><text x="330" y="610" font-size="130" fill="#3A2414" stroke="#FFF7E8" stroke-width="16" paint-order="stroke" letter-spacing="6">${txt}</text></g>`; };
  window.EP = {
    dur: 21.0,
    bgmHolds: '0.0-17.3',   // 気まずさの回：本編は BGM なし（効果音と沈黙だけ）。テロップから BGM
    get sfx() {
      if (sfxCache) return sfxCache;
      const T = touches(), order = Object.keys(T).map(Number).sort((a, b) => T[a] - T[b]);
      sfxCache = BASE_SFX.concat(order.map((n, i) => ({ t: T[n], type: 'beep' + Math.min(6, 1 + Math.floor(i * .7)), pan: .55 }))).sort((a, b) => a.t - b.t);
      return sfxCache;
    },
    touches: () => touches(),
    frame(t) {
      if (!window.L || !window.RIG || !window.ELV) return;
      const T = touches();
      const open = 1 - L.ease(L.seg(t, 0.45, 1.6));
      const lit = Object.keys(T).map(Number).filter(n => T[n] <= t);
      const glow = {}; for (const n of lit) glow[n] = Math.max(0, 1 - (t - T[n]) / .25);
      const floor = t < 5.0 ? 1 : t < 10.0 ? 2 : t < 15.0 ? 3 : 4;
      const bg = ELV.bg({ open, floor, lit, glow, pulse: .5 + .5 * Math.sin(t * 4) });
      L.char('jil', jilPose(t), t, '', charOpt(t));
      L.char('ren', renPose(t), t, '', charOpt(t));
      let fx = '';
      // 耳をゆらしている間の ♪（のんき・無意識）
      if (t > 7.9 && t < 12.4) for (let i = 0; i < 3; i++) {
        const u = ((t - 7.9) / 1.5 + i / 3) % 1, a = Math.min(1, u * 5, (1 - u) * 3) * Math.min(1, (12.4 - t) * 3);
        fx += `<text x="${560 + 40 * Math.sin(u * 6 + i)}" y="${1040 - u * 160}" font-size="${54 + 10 * i}" font-weight="900" fill="#8C603C" opacity="${a.toFixed(2)}" text-anchor="middle" font-family="Noto Sans CJK JP, sans-serif">♪</text>`;
      }
      const cam = L.camAt([
        { t: 0, z: 1.08, cx: 540, cy: 1110 },                  // 扉が閉まる（扉と2人）。最初のコマからゆっくり寄る（qa：最初の 0.5 秒で動きを出す）
        { t: 0.01, z: 1.32, cx: 510, cy: 1300, d: 2.4 },       // 2人
        { t: 7.4, z: 1.62, cx: 770, cy: 1250, d: .7 },          // モチの耳とボタン
        { t: 13.6, z: 1.13, cx: 525, cy: 1290, d: .6 },        // 2人＋光るボタン（全身と表情とボタンが入る）
        { t: 16.85, z: 1.2, cx: 530, cy: 1300, d: .5 },        // 目が合う
      ], t);
      cam.z /= 1 + .006 * Math.sin(t * .9); if (!still(t)) cam.z *= 1 + .006 * Math.sin(t * .9);  // 静止中はカメラのゆれも止める
      const ui = t < 20.05 ? DOTS(t) + TELOP(L.seg(t, 17.4, 17.9)) : '';
      L.mount({ bg, fx, ui, cam, t });
      if (typeof endcard === 'function') endcard(t, EP.dur);
    }
  };
})();
var EP = window.EP;
