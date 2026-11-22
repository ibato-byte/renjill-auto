// 「上司とエレベーター 第2話（Part 2）」（18秒＋エンドカード1秒・セリフなし）2026-11-17 オーナーの絵コンテ
// 2026-11-17 オーナー：最初の「全部の階で止まる」を 0〜4秒 → 0〜7秒に（場面の切り替えが早く、状況が伝わりにくい）。
//   扉の動きの速さはそのままで、誰もいない廊下を見る間を長く。下の台本の時間は「元の時間」（4秒より後は、見える時間では +3秒）。W() が見える時間 → 元の時間に直す
// 前回：課長（モチ）のたれ耳が、エレベーターの全部の階のボタンを押してしまった（最初の0.45秒は、その終わりの絵＝耳がボタンにのったまま）
// 状況：全部の階で止まるエレベーター。ユズがひらめき、モチの耳を頭の上にまとめて押さえる
// オチ：手をはなした瞬間、耳がボヨヨ〜ンとはね返って「開」を押す → 扉が開くと、新人クリが立っている（助けたのに、もっと悪くなる）
// 0.0–4.0   チーン！扉が開く → 誰もいない → 閉まる、を3回（5・6・7階）。だんだん速く。モチは困り顔が深く、ユズはだんだんあきれ顔
// 4.0–7.0   ユズがモチの耳とボタンを交互に見る → ひらめく → メガネをクイッ（見せ場）→ 胸を張る
// 7.0–9.0   ユズがモチの背中にぴょんと乗り、口で耳を1本ずつくわえて頭の上にまとめる（うさぎに腕はないので口で。書類の回と同じ）。モチは目を丸くしてされるがまま
// 9.0–10.5  ユズが下りた瞬間、耳がボヨヨ〜ン（伸び縮み・行き過ぎ）→ 右の耳が「開」に当たる（ピッ）
// 10.5–12.0 チーン！8階。扉が開くと正面に新人クリ（ふしぎそうな顔）。モチとユズは同時に固まる
// 12.0–15.0 その構図のまま。テロップ「続きは次回！フォローして待っててね／To be continued! Follow us」
// 第3話へ引きつぐもの：ELV.EP2_END（扉は開いたまま・8階・クリの位置・東京うさぎオフィスの位置・光っているボタン）
document.write('<script src="v2/lib.js"><\/script><script src="v2/elevator_set.js"><\/script>');
(function () {
  const sm = (a, b, t) => { const k = Math.max(0, Math.min(1, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  // 区切りの表 [[t, v], …] をなめらかにつなぐ
  const keys = (K, t) => { if (t <= K[0][0]) return K[0][1]; for (let i = 0; i < K.length - 1; i++) { const [t0, v0] = K[i], [t1, v1] = K[i + 1]; if (t <= t1) return lerp(v0, v1, sm(t0, t1, t)); } return K[K.length - 1][1]; };
  const RX = () => ELV.REN_END, JX0 = () => ELV.JIL.x, JX1 = -110;   // ユズは下りるとき少し左へ（クリが2人の間から見えるように）
  // ---- 扉：3回の空振り（5・6・7階）と、8階（クリ）----
  const STOPS = [   // [チーン, 開き始め, 開ききる, 閉め始め, 閉まりきる, 階]
    [0.45, 0.5, 0.75, 1.05, 1.32, 5],
    [1.55, 1.6, 1.8, 2.02, 2.28, 6],
    [2.5, 2.54, 2.7, 2.9, 3.12, 7],
  ];
  const ARRIVE = 10.5;   // 8階
  function doorOpen(t) {
    for (const [, a, b, c, d] of STOPS) {
      if (t >= a && t < b) { const u = sm(a, b, t); return Math.min(1.06, u * 1.06 + .0); }      // 少し大げさに（行き過ぎ）
      if (t >= b && t < c) return 1 + .06 * Math.exp(-(t - b) * 14) * Math.cos((t - b) * 40);
      if (t >= c && t < d) return 1 - L.ease(sm(c, d, t));
    }
    if (t >= ARRIVE + .05) { const u = sm(ARRIVE + .05, ARRIVE + .35, t); return u < 1 ? u * 1.05 : 1 + .05 * Math.exp(-(t - ARRIVE - .35) * 12) * Math.cos((t - ARRIVE - .35) * 36); }
    return 0;
  }
  function floorAt(t) { let f = 4; for (const s of STOPS) if (t >= s[0]) f = s[5]; if (t >= ARRIVE) f = 8; return f; }
  function litAt(t) { const off = new Set(); for (const s of STOPS) if (t >= s[0]) off.add(s[5]); if (t >= ARRIVE) off.add(8); return ELV.FLOORS.filter(n => !off.has(n)); }

  // ---- モチの耳 ----
  // ユズが口でくわえて上へ（左 7.55–7.9、右 8.05–8.4）→ まとめて押さえる → 9.0 はなす → ボヨヨ〜ン
  const UP = -162;
  const SPRING_R = [[9.0, UP], [9.27, 24], [9.55, -40], [9.85, 9], [10.1, -3], [10.35, 0]];   // 右：内がわへ行き過ぎ → 外へはね返って「開」へ
  const SPRING_L = [[9.0, UP], [9.29, 20], [9.58, -22], [9.88, 7], [10.12, -2], [10.38, 0]];
  function earsAt(t) {
    let r = 0, l = 0;
    if (t < 0.45) r = -30;                                                   // 前回の終わり：耳がボタンにのったまま
    else if (t < 0.75) r = -30 * (1 - L.outBack(sm(0.45, 0.75, t)));         // チーン！で耳を引っこめる
    if (t >= 7.55 && t < 9.0) l = lerp(0, UP, L.ease(sm(7.55, 7.9, t)));
    if (t >= 8.05 && t < 9.0) r = lerp(0, UP, L.ease(sm(8.05, 8.4, t)));
    if (t >= 8.4 && t < 9.0) { const j = 3 * Math.sin((t - 8.4) * 18) * (1 - sm(8.4, 8.9, t)); r += j; l -= j; }   // まとめた耳がぷるぷる
    if (t >= 9.0) { r = keys(SPRING_R, t); l = keys(SPRING_L, t); }
    return { r, l: t < 0.45 ? -.3 * 30 : l };
  }
  // 耳の伸び縮み：速く動くほど伸び（細く）、向きが変わる所で縮む（ぽよん）。くわえて引っぱる間も少し伸びる
  function stretchAt(side, t) {
    const f = s => (side === 'R' ? earsAt(s).r : earsAt(s).l);
    const v = Math.abs(f(t + 1 / 120) - f(t - 1 / 120)) * 60;   // 度／秒
    let k = 1 + Math.min(.26, v / 2600);
    const S = side === 'R' ? SPRING_R : SPRING_L;
    for (const [tk] of S.slice(1, -1)) k -= .14 * Math.max(0, 1 - Math.abs(t - tk) / .06);   // 折り返しでつぶれる
    if (side === 'L' && t >= 7.55 && t < 7.9) k += .1 * L.pulse(t, 7.55, 7.9);
    if (side === 'R' && t >= 8.05 && t < 8.4) k += .1 * L.pulse(t, 8.05, 8.4);
    return k;
  }

  function renPose(t) {
    const R = ELV.REN, F = RIG.FACES, E = earsAt(t);
    let face = Object.assign({}, F.neutral, { mouth: 'line' }), look = .3, eyeOpen = 1.22, sq = 0, sweat = 1, nod = 0, extra = {};
    if (t >= 0.45 && t < 7.0) {
      // 困り顔（扉が開くたびに少しずつ深く・小さく）
      const k = t < 1.55 ? 1 : t < 2.5 ? 2 : 3;
      face = Object.assign({}, F.oops, { sweat: 0, browAngle: 10 + 4 * k });
      eyeOpen = .9 - .08 * k; sq = -.05 * k; sweat = .6 + .15 * k; look = .2;
      for (const s of STOPS) sq -= .14 * L.pulse(t, s[0], s[0] + .25);           // チーン！のたびにびくっ
      if (t >= 4.0) { look = -.5 + .3 * Math.sin(t * 3); }                         // ユズの様子をうかがう
    }
    if (t >= 7.0 && t < 10.5) { face = Object.assign({}, F.neutral, { mouth: 'w' }); eyeOpen = 1.25; look = t < 9.4 ? 0 : L.lerp(0, 1, sm(9.4, 9.6, t)); sq = -.08; sweat = .5; }   // 目を丸くして、されるがまま → 耳の先を見る
    if (t >= 10.5) { const f = sm(10.6, 10.75, t); face = Object.assign({}, F.neutral, { mouth: 'line' }); eyeOpen = 1.25 + .05 * f; look = L.lerp(1, -.4, sm(10.6, 10.8, t)); sq = -.08 - .08 * f; sweat = 1; }   // 固まる
    return Object.assign({}, RIG.POSES.sit, face, { x: RX(), y: ELV.y(R) + nod, scale: R.s, bodyTilt: 6, headTilt: 6, bodySquash: sq, earR: E.r, earL: E.l, eyeLook: look, eyeOpen, sweat, blush: .25 });
  }
  // ユズの口（体の左上を 0,0・大きさ 1 のときの位置）。頭の中心は (188,195)
  const MOUTH = { x: 188, y: 240 }, LENS = [{ x: 148, y: 200 }, { x: 228, y: 200 }];
  // くわえる所：耳の外のふちの 30% の所。描いたモチの耳で 1/60 秒ごとに測っておく（どの時間から描いても同じ絵になる）
  const GRAB = .3;
  let EARTAB = null;
  const TOP = () => ({ x: RX() + 180 * ELV.REN.s - 188 * ELV.JIL.s, y: 1040 - 195 * ELV.JIL.s });   // モチの頭のうしろ（ユズの頭が、モチの頭の上に出る）
  function earTab(side, t) { if (!EARTAB) return null; const i = Math.max(0, Math.min(EARTAB.length - 1, Math.round((t - 7.3) * 60))); return EARTAB[i] && EARTAB[i][side]; }
  function earPoint(side, frac) {
    const svg = document.getElementById('ren'); const head = side === 'R' ? /^M\s*226 112/ : /^M\s*134 112/;
    const path = [...svg.querySelectorAll('path')].find(p => head.test(p.getAttribute('d') || '')); if (!path) return null;
    // 耳の外がわのふち（付け根から先へ）の frac の所
    const Lt = path.getTotalLength(), q = path.getPointAtLength(Lt * frac), m = path.getCTM();
    return new DOMPoint(q.x, q.y).matrixTransform(m);
  }
  function jilPose(t) {
    const J = ELV.JIL, F = RIG.FACES, s = J.s;
    let x = JX0(), y = ELV.y(J), face = F.neutral, look = 0, nod = 0, htilt = 0, sq = 0, eyeOpen = 1, layer = 'jil', pose = RIG.POSES.sit, extra = {};
    // 0–4：だんだんあきれる（ふつう → 目が平ら → 半目＋ため息）
    if (t >= 0.45 && t < 4.0) {
      const k = t < 1.55 ? 0 : t < 2.5 ? 1 : 2; look = -.3; nod = -14;
      face = k === 0 ? F.sharp : k === 1 ? Object.assign({}, F.annoyed, { sweat: 0 }) : Object.assign({}, F.sharp, { eyeShape: 'half', mouth: 'line' });
      eyeOpen = k === 2 ? .6 : 1;
      if (t > 3.3 && t < 3.9) { sq = -.12 * L.pulse(t, 3.3, 3.9); nod = -14 + 10 * L.pulse(t, 3.3, 3.9); }   // ため息
    }
    // 4.0–5.4：耳（右下）とボタン（右上）を交互に
    if (t >= 4.0 && t < 5.4) {
      const ph = Math.floor((t - 4.0) / .35) % 2;   // 0＝耳、1＝ボタン
      const u = ((t - 4.0) % .35) / .35, a = L.ease(Math.min(1, u * 3));
      look = 1; nod = ph === 0 ? lerp(-10, 12, a) : lerp(12, -10, a); htilt = ph === 0 ? 8 : 2;
      face = Object.assign({}, F.sharp, { eyeShape: 'half', mouth: 'line' }); eyeOpen = .75;
    }
    // 5.4：ひらめく（目が大きく・耳がぴんっ）
    if (t >= 5.4 && t < 7.0) {
      const a = sm(5.4, 5.55, t); face = Object.assign({}, F.neutral, { mouth: 'w' }); eyeOpen = 1 + .25 * a; look = 0; nod = -6 * a;
      extra.earL = -14 * L.pulse(t, 5.4, 5.75); extra.earR = 14 * L.pulse(t, 5.4, 5.75); extra.excl = L.pulse(t, 5.42, 5.8);
      // 5.8–6.25：メガネをクイッ（首をすっと下げて → くいっと上げる）
      if (t >= 5.8) { nod = -6 + 10 * L.pulse(t, 5.8, 6.0) - 8 * L.pulse(t, 6.0, 6.25); htilt = -6 * L.pulse(t, 5.85, 6.2); face = Object.assign({}, F.smug, { sparkle: 0 }); eyeOpen = .8; }
      // 6.3–7.0：胸を張る（少し得意げ）
      if (t >= 6.3) { const b = L.outBack(sm(6.3, 6.55, t)); sq = .16 * b; nod = -14 * b; face = Object.assign({}, F.smug); eyeOpen = .62; }
    }
    // 7.0–9.05：モチのうしろ（モチの層の下）に回り、口で耳を1本ずつくわえて頭の上へ
    if (t >= 7.0 && t < 9.05) {
      layer = 'back'; face = Object.assign({}, F.neutral, { mouth: 'w' }); eyeOpen = 1; look = 0;
      const top = TOP(), g0 = { x: JX0(), y: ELV.y(J) }, g1 = { x: JX1, y: ELV.y(J) };
      const at = (side, tt) => { const e = earTab(side, tt); return e ? { x: e.x - MOUTH.x * s, y: e.y - MOUTH.y * s } : top; };
      const mix = (A, B, k) => ({ x: lerp(A.x, B.x, k), y: lerp(A.y, B.y, k) });
      let P;
      if (t < 7.35) { const k = sm(7.0, 7.35, t); P = mix(g0, top, k); P.y -= 200 * Math.sin(Math.PI * k); pose = RIG.POSES.stretch; }      // ぴょん（モチのうしろへ）
      else if (t < 7.55) P = mix(top, at('L', 7.55), L.ease(sm(7.35, 7.55, t)));                                                       // 左の耳へ
      else if (t < 7.9) P = at('L', t);                                                                                                // くわえて上へ
      else if (t < 8.05) P = mix(at('L', 7.9), at('R', 8.05), L.ease(sm(7.9, 8.05, t)));                                             // 右の耳へ
      else if (t < 8.4) P = at('R', t);
      else if (t < 8.75) P = mix(at('R', 8.4), top, L.ease(sm(8.4, 8.55, t)));                                                        // まとめて押さえる
      else { const k = sm(8.75, 9.05, t); P = mix(top, g1, k); P.y -= 170 * Math.sin(Math.PI * k); pose = RIG.POSES.stretch; face = Object.assign({}, F.smug, { sparkle: 0 }); eyeOpen = .7; }
      x = P.x; y = P.y;
      if (t >= 7.35 && t < 7.9) { htilt = -10; nod = 8; } else if (t >= 7.9 && t < 8.4) { htilt = 10; nod = 8; }
      if (t >= 8.4 && t < 8.75) { face = Object.assign({}, F.smug, { sparkle: 0 }); eyeOpen = .7; nod = 8 * L.pulse(t, 8.45, 8.7); }   // 満足げにうなずく
      sq += .12 * L.pulse(t, 7.33, 7.48);
      if (t >= 8.9) layer = 'jil';
    }
    if (t >= 9.05) {
      x = JX1; face = Object.assign({}, F.smug, { sparkle: 0 }); eyeOpen = .7; sq = -.2 * L.pulse(t, 9.05, 9.25);
      if (t >= 9.5) { face = Object.assign({}, F.neutral, { mouth: 'line' }); eyeOpen = 1.1; look = 1; }   // 耳がはね返るのを見る
      if (t >= 10.6) { const f = sm(10.6, 10.75, t); eyeOpen = 1.1 + .15 * f; look = L.lerp(1, .5, f); sq = -.06 * f; extra.sweat = f; }   // 同時に固まる
    }
    return { layer, p: Object.assign({}, pose, face, { x, y, scale: s, eyeLook: look, headNod: nod, headTilt: htilt, bodySquash: sq, eyeOpen }, extra) };
  }
  // 止まる時間（呼吸・まばたき・耳のゆれも止める）
  const still = t => t >= 10.8;
  const charOpt = (t, extra) => Object.assign({ twitch: !still(t) && !(t > 6.9 && t < 10.5) }, still(t) ? { blink: false, breathe: false, ears: false } : {}, (t > 6.9 && t < 10.5) ? { ears: false } : {}, extra || {});

  // ---- 耳が「開」に当たった時間（実際に描いて判定。1回だけ）----
  let TOUCH = null;
  function drawRen(t, opt) { L.char('ren', renPose(t), t, '', opt); ELV.stretchEar('R', stretchAt('R', t)); ELV.stretchEar('L', stretchAt('L', t)); }
  function touches() {
    if (TOUCH) return TOUCH;
    TOUCH = {}; EARTAB = [];
    for (let t = 7.3; t <= 8.85; t += 1 / 60) { drawRen(t, charOpt(t, { shadow: false })); EARTAB.push({ L: earPoint('L', GRAB), R: earPoint('R', GRAB) }); }
    const unlit = () => [ELV.OPEN];
    for (let t = 8.95; t <= 10.5; t += 1 / 240) {
      drawRen(t, charOpt(t, { shadow: false }));
      for (const n of ELV.earTouch(unlit())) if (TOUCH[n] == null) TOUCH[n] = Math.round(t * 1000) / 1000;
    }
    return TOUCH;
  }
  const BASE_SFX = [{ t: 0.0, type: 'hum', pan: 0 }];
  for (const [d, a, , c] of STOPS) BASE_SFX.push({ t: d, type: 'ding', pan: .15 }, { t: a, type: 'doorq', pan: 0 }, { t: c, type: 'doorq', pan: 0 });
  BASE_SFX.push({ t: 0.47, type: 'twitch', pan: .3 },                     // 耳を引っこめる
    { t: 3.35, type: 'flop', pan: -.3 },                                 // ため息
    { t: 5.42, type: 'pon', pan: -.3 },                                  // ひらめき
    { t: 6.0, type: 'kui', pan: -.3 },                                   // クイッ
    { t: 7.0, type: 'pop', pan: -.1 }, { t: 7.36, type: 'tap', pan: 0 },  // ぴょん・着地
    { t: 7.6, type: 'swish', pan: -.2 }, { t: 8.1, type: 'swish', pan: .2 },
    { t: 8.78, type: 'pop', pan: -.2 }, { t: 9.06, type: 'tap', pan: -.3 },
    { t: 9.02, type: 'boyon', pan: .1 },                                  // ボヨヨ〜ン
    { t: ARRIVE, type: 'ding', pan: .15 }, { t: ARRIVE + .05, type: 'doorq', pan: 0 },
    { t: 10.75, type: 'twitch', pan: 0 },
    { t: 12.35, type: 'pop' });
  var sfxCache = null;
  const TELOP = (k) => k <= 0 ? '' : `<g transform="translate(540 1430) scale(${L.outBack(Math.min(1, k * 1.6))})" opacity="${Math.min(1, k * 3)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle">
    <rect x="-452" y="-122" width="904" height="292" rx="46" fill="#3B2412" opacity=".22" transform="translate(6 10)"/>
    <rect x="-452" y="-122" width="904" height="292" rx="46" fill="#3A2414" opacity=".9"/><rect x="-436" y="-108" width="872" height="18" rx="9" fill="#fff" opacity=".08"/>
    <text y="-16" font-size="88" fill="#FFF7E8">続きは次回！</text><text y="66" font-size="54" fill="#F2D3A8">フォローして待っててね</text>
    <text y="128" font-size="38" fill="#FFF7E8" opacity=".85" font-family="Noto Sans, Noto Sans CJK JP, sans-serif">To be continued! Follow us</text></g>`;
  // クリ（8階の廊下）。2人の間から見える所
  const POMQ = t => ({ eye: t < 11.0 ? 'round' : 'big', look: 0, wob: t < 10.9 ? 0 : 12 * L.ease(sm(10.9, 11.3, t)), blush: .35, squash: -.06 * L.pulse(t, 10.6, 10.85) });
  const POM_AT = { x: 355, y: 1486, s: 1.5 };   // ユズとモチの頭の間から顔が見える所
  const OLD = {
    dur: 16.0,
    bgmHolds: '0.0-12.2',
    get sfx() {
      if (sfxCache) return sfxCache;
      const T = touches(), add = [];
      if (T.open != null) add.push({ t: T.open, type: 'beep3', pan: .55 });
      sfxCache = BASE_SFX.concat(add).sort((a, b) => a.t - b.t);
      return sfxCache;
    },
    touches: () => touches(),
    frame(t) {
      if (!window.L || !window.RIG || !window.ELV) return;
      ELV.EP2_END = { renX: RX(), jilX: JX1, floor: 8, open: 1, lit: litAt(EP.dur), pom: POM_AT };   // 第3話へ引きつぐ最後の状態
      const T = touches();
      const openLit = T.open != null && t >= T.open ? (t < ARRIVE + .4 ? 1 + Math.max(0, 1 - (t - T.open) / .25) * .6 : Math.max(0, 1 - (t - ARRIVE - .4) / .3)) : 0;
      const pm = POM_AT;
      const hall = t >= ARRIVE ? ELV.pomDefs() + ELV.pom(pm.x, pm.y, pm.s, POMQ(t)) : '';
      const lit = litAt(t), glow = {};
      const bg = ELV.bg({ open: doorOpen(t), floor: floorAt(t), lit, glow, openLit, hallFloor: floorAt(t), hall, plant: false, pulse: .5 + .5 * Math.sin(t * 4) });
      // モチ（先に描いて、耳のくわえる所を測る）
      drawRen(t, charOpt(t));
      const J = jilPose(t);
      if (J.layer === 'jil') L.char('jil', J.p, t, '', charOpt(t)); else L.char('jil', null, t);
      let fx = '';
      // メガネのきらっ（クイッの直後）
      if (t > 6.0 && t < 6.45) { const k = L.seg(t, 6.0, 6.45), a = Math.sin(Math.PI * k), s = ELV.JIL.s, jx = J.p.x, jy = J.p.y;
        for (const ln of LENS) fx += `<g transform="translate(${jx + ln.x * s} ${jy + (ln.y + (J.p.headNod || 0)) * s}) rotate(-30)" opacity="${a.toFixed(2)}"><rect x="-6" y="-34" width="12" height="68" rx="6" fill="#fff"/></g>`;
        fx += `<g transform="translate(${jx + 270 * s} ${jy + 150 * s}) scale(${.6 + .6 * a})" opacity="${a.toFixed(2)}"><path d="M0 -26 L7 -7 L26 0 L7 7 L0 26 L-7 7 L-26 0 L-7 -7Z" fill="#FFE27A"/></g>`; }
      // ひらめきの光
      if (t > 5.4 && t < 5.9) { const a = L.pulse(t, 5.4, 5.9), s = ELV.JIL.s; fx += `<g transform="translate(${J.p.x + 188 * s} ${J.p.y + 40 * s})" opacity="${a.toFixed(2)}">${[0, 1, 2, 3, 4].map(i => `<path d="M0 -40 L0 -${70 + 10 * a}" stroke="#F2C14E" stroke-width="9" stroke-linecap="round" transform="rotate(${-50 + i * 25})"/>`).join('')}</g>`; }
      const cam = L.camAt([
        { t: 0, z: 1.66, cx: 780, cy: 1250 },                  // 前回の終わり（耳がボタンにのったまま）。最初のコマからゆっくり引く（qa：0.5 秒以内に動き）
        { t: 0.01, z: 1.13, cx: 525, cy: 1240, d: .85 },        // 扉と2人
        { t: 8.95, z: 1.2, cx: 600, cy: 1270, d: .4 },          // 耳がはね返って「開」へ（原因と結果が同じ画に入る）
        { t: 10.35, z: 1.08, cx: 490, cy: 1190, d: .45 },       // 扉が開いてクリ
      ], t);
      if (still(t)) cam.z /= 1 + .006 * Math.sin(t * .9);
      L.mount({ bg, fx, ui: t < 15.05 ? TELOP(L.seg(t, 12.3, 12.8)) : '', cam, t });
      if (J.layer === 'back') { const b = document.getElementById('back'); RIG.render(b, RIG.alive(Object.assign({}, RIG.DEFAULTS, { char: 'jil' }, J.p), t, { ears: true })); b.__html = '#jil'; }   // __html を変えておく＝次のコマで L.mount が消す
    }
  };
  // ---- 見える時間 → 元の時間（最初の 4 秒を 7 秒に。扉が開く・閉まる所は同じ速さ、廊下を見る間と、ため息の前を長く）----
  const NEW = [0, 0.9, 0.95, 1.25, 2.1, 2.4, 2.85, 2.9, 3.17, 3.95, 4.23, 4.7, 4.74, 4.98, 5.7, 5.95, 6.25, 6.85, 7.0];
  const OLDT = [0, 0.45, 0.5, 0.75, 1.05, 1.32, 1.55, 1.6, 1.8, 2.02, 2.28, 2.5, 2.54, 2.7, 2.9, 3.12, 3.3, 3.9, 4.0];
  const SHIFT = 3.0;
  const W = t => { if (t >= 7.0) return t - SHIFT; for (let i = 0; i < NEW.length - 1; i++) if (t <= NEW[i + 1]) return OLDT[i] + (OLDT[i + 1] - OLDT[i]) * (t - NEW[i]) / (NEW[i + 1] - NEW[i]); return t - SHIFT; };
  const Winv = o => { if (o >= 4.0) return o + SHIFT; for (let i = 0; i < OLDT.length - 1; i++) if (o <= OLDT[i + 1]) return NEW[i] + (NEW[i + 1] - NEW[i]) * (o - OLDT[i]) / (OLDT[i + 1] - OLDT[i]); return o + SHIFT; };
  window.EP = {
    dur: OLD.dur + SHIFT,
    bgmHolds: '0.0-15.2',
    get sfx() { return OLD.sfx.map(x => Object.assign({}, x, { t: x.type === 'hum' ? 0 : Math.round(Winv(x.t) * 1000) / 1000 })); },
    touches: () => { const T = OLD.touches(), o = {}; for (const k in T) o[k] = Winv(T[k]); return o; },
    frame(t) { OLD.frame(W(t)); if (typeof endcard === 'function') endcard(t, EP.dur); }
  };
})();
var EP = window.EP;
