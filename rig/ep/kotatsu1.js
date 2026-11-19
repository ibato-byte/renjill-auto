// 「こたつと上司 第1話（Part 1）」（約13.5秒＋テロップ・セリフなし）2026-11-19 総見直し（Claude）の企画。全体は docs/series/2026-11-26_kotatsu.md
// 状況：寒い朝のオフィス。2人ともふるえている。天井からこたつがドスン → スイッチが入ってぽかぽか
// オチ：課長（レン）がこたつに飛びこみ、天板にあごをのせて寝てしまう。夕方まで、課長の仕事（書類）がジルの頭に積もっていく
//       18:00、ジルが頭でつんつん → 課長は寝たまま、すぽっと全部こたつの中へもぐる（ポン）→ ジルの頭の書類がざざっと落ちる
// オチの後のオチ：ジルはこたつを見て……とろける（ハート。次は自分も？＝続きは次回）
// 0.0–1.6   寒い朝（9:00）。2人ともぶるぶる・白い息
// 1.6–2.4   天井からこたつがドスン → 2.4 スイッチが入って赤く光る（ピコン）
// 2.6–4.0   レンが「？」→ あったかい（キラキラ）→ ため → その場で高く跳んで、こたつに入る → 着地でつぶれる
// 4.4–5.8   2段階で沈む：肩まで → 天板にあごをのせて寝る（Zz）
// 5.9–8.7   時計が 9:00 → 18:00（窓は昼 → 夕方 → 夜）。ジルの頭に書類が 3回落ちてきて、だんだん高い山に（3 → 12 → 30枚）
// 8.9–10.25 チーン（18:00）。ジルが書類を頭にのせたまま、こたつの横へぴょん → 頭でつんつん 2回（腕なし）
// 10.25–11.6 レンが寝たまま、すぽっと全部もぐる（ポン）→ ジルの頭の書類がざざっと落ちる → がっかり（L.droop）
// 11.8–13.4 ジルがこたつを見る……目がとろんとして、ハート（こたつの誘惑）
// 13.6–16.6 その構図のまま。テロップ（画面の上の空いた所）「続きは次回！フォローして待っててね／To be continued! Follow us」
// 第2話へ引きつぐ最後の状態：こたつは KX=650・天板 TOP_Y。レンはこたつの中（見えない）。ジルはこたつの左でとろけている。床に書類が散らばっている。18:00 の夜
document.write('<script src="v2/lib.js"><\/script>');
(function () {
  const sm = (a, b, t) => { const k = Math.max(0, Math.min(1, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const FLOOR = 1500, KX = 650, TOP_Y = FLOOR - 165, KW = 265;   // こたつ：中心 x・天板の高さ・天板の半分の幅
  const RS = 1.5, JS = 1.42;                                       // レン・ジルの大きさ（画面の高さの35%以上）
  const REN_IN = KX - 200 * RS;                                    // こたつのうしろ（真ん中）に入ったときのレンの x
  const REN_OUT = REN_IN;                                          // こたつはレンの目の前に落ちてくる
  const JX0 = -40, JX1 = 10;                                       // ジル：最初・こたつの横
  const T = { drop: 1.6, on: 2.4, jump: 3.45, land: 3.95, sink1: 4.4, sink2: 5.2, spin0: 5.9, spin1: 8.7, chime: 8.9, hop: 9.15, bite: 9.6, lift: 99, nudge2: 9.95, roll: 10.25, shut: 10.45, slide: 10.95, droop: 11.3, tempt: 11.8, chin: 12.6, freeze: 13.4, telop: 13.6 };
  const PAPER_T = [6.4, 7.25, 8.1];                                // 書類が落ちてくる時間（1枚 → 6枚 → 14枚）
  const PAPER_N = [3, 12, 30];

  // ---- こたつ（前から見た形）----
  // lift：左はしの布団をくわえて持ち上げる量（0〜1）。mx,my：くわえている口の位置
  function kotatsu(t, lift, mx, my) {
    const H = FLOOR - TOP_Y, x0 = KX - KW - 40, x1 = KX + KW + 40;
    const on = sm(T.on, T.on + .3, t);
    // 布団のすそ（左はしは、めくると口の位置まで上がる）
    const cornerX = lerp(x0 - 30, mx, lift), cornerY = lerp(FLOOR + 50, my, lift);
    const midY = lerp(FLOOR + 60, FLOOR - H * .55, lift * .9);
    const futon = `M${KX - KW} ${TOP_Y + 18} Q${x0 - 10} ${TOP_Y + 40} ${x0 - 30} ${lerp(FLOOR - 40, TOP_Y + 120, lift)} L${cornerX} ${cornerY}`
      + ` Q${lerp(x0 + 120, x0 + 160, lift)} ${midY} ${KX - 40} ${FLOOR + 62} Q${KX + 200} ${FLOOR + 66} ${x1 + 30} ${FLOOR + 50} Q${x1 + 6} ${TOP_Y + 60} ${KX + KW} ${TOP_Y + 18} Z`;
    let s = `<defs><clipPath id="ktF"><path d="${futon}"/></clipPath>
      <linearGradient id="ktQ" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D9573F"/><stop offset="1" stop-color="#B53A2C"/></linearGradient>
      <radialGradient id="ktGlow" cx=".5" cy=".6" r=".6"><stop offset="0" stop-color="#FF9A3C" stop-opacity=".75"/><stop offset="1" stop-color="#FF6A2C" stop-opacity="0"/></radialGradient></defs>`;
    // 床のかげ
    // めくった所から見える中の赤い光（レンの体の上に重ねる）
    if (lift > 0) s += `<ellipse cx="${lerp(x0 + 60, x0 + 200, lift)}" cy="${FLOOR - 90}" rx="${260 * lift + 40}" ry="${150 * lift + 20}" fill="url(#ktGlow)" opacity="${(on * lift).toFixed(2)}" data-nb="1"/>`;
    // 布団：赤い格子もよう
    s += `<g data-nb="1"><path d="${futon}" fill="url(#ktQ)"/><g clip-path="url(#ktF)" opacity=".5">`
      + [-3, -2, -1, 0, 1, 2, 3].map(i => `<rect x="${KX + i * 120 - 14}" y="${TOP_Y}" width="28" height="${H + 40}" fill="#F2C14E" opacity=".55"/>`).join('')
      + [0, 1].map(i => `<rect x="${x0 - 60}" y="${TOP_Y + 70 + i * 90}" width="${x1 - x0 + 120}" height="22" fill="#F2C14E" opacity=".45"/>`).join('')
      + `</g><path d="M${KX - KW + 10} ${TOP_Y + 30} Q${KX} ${TOP_Y + 44} ${KX + KW - 10} ${TOP_Y + 30}" stroke="#fff" stroke-width="8" fill="none" opacity=".25"/>`
      // 布団のしわ
      + `<path d="M${KX - 120} ${TOP_Y + 60} q-20 90 -60 ${H - 80} M${KX + 150} ${TOP_Y + 60} q30 90 70 ${H - 90}" stroke="#7E2418" stroke-width="7" fill="none" opacity=".25" stroke-linecap="round"/></g>`;
    // 天板（木）
    s += `<g data-nb="1"><rect x="${KX - KW - 8}" y="${TOP_Y - 10}" width="${2 * KW + 16}" height="40" rx="10" fill="#6E4428"/>`
      + `<rect x="${KX - KW}" y="${TOP_Y - 26}" width="${2 * KW}" height="34" rx="9" fill="#A36A40"/><rect x="${KX - KW + 14}" y="${TOP_Y - 22}" width="${2 * KW - 28}" height="8" rx="4" fill="#fff" opacity=".22"/>`
      + `<path d="M${KX - KW + 60} ${TOP_Y - 12} H${KX + 40} M${KX + 90} ${TOP_Y - 6} H${KX + KW - 50}" stroke="#7A4A2A" stroke-width="3" opacity=".4"/></g>`;
    // みかん（天板の右はし）
    s += `<g transform="translate(${KX + KW - 70} ${TOP_Y - 44})"><circle r="26" fill="#F29A2E"/><circle cx="-8" cy="-8" r="8" fill="#fff" opacity=".35"/><path d="M0 -26 q6 -10 14 -8" stroke="#4E7A2E" stroke-width="5" fill="none" stroke-linecap="round"/></g>`;
    // あったかい空気（スイッチが入ってから）
    if (on > 0) for (let i = 0; i < 3; i++) { const u = ((t * .6) + i / 3) % 1; s += `<path d="M${KX - 200 + i * 200} ${TOP_Y - 40 - u * 120} q14 -20 0 -40 q-14 -20 0 -40" stroke="#F2A33A" stroke-width="6" fill="none" stroke-linecap="round" opacity="${(on * .5 * Math.sin(Math.PI * u)).toFixed(2)}" data-nb="1"/>`; }
    return s;
  }
  // スイッチ（コードの先・こたつの右下）
  const SWITCH = (t) => { const on = t >= T.on; return `<g transform="translate(${KX + KW + 90} ${FLOOR - 6})"><path d="M-60 -10 q30 -20 60 -4" stroke="#3B2F2A" stroke-width="7" fill="none"/><rect x="-6" y="-30" width="54" height="34" rx="10" fill="#EFE8DC" stroke="#B9AE9C" stroke-width="4"/><circle cx="21" cy="-13" r="9" fill="${on ? '#FF5A3C' : '#8A8076'}"/>${on ? `<circle cx="21" cy="-13" r="${16 + 8 * Math.max(0, 1 - (t - T.on) / .4)}" fill="#FF5A3C" opacity=".3"/>` : ''}</g>`; };

  // 書類の山（ジルの頭の上）。n 枚。落ちてくる途中は上から
  function paperPile(t, x, y) {
    let n = 0; for (let i = 0; i < PAPER_T.length; i++) if (t >= PAPER_T[i] + .25) n = PAPER_N[i];
    let s = '';
    if (t < T.slide) s += L.papers(x, y, n, { mess: 8 });
    for (let i = 0; i < PAPER_T.length; i++) {   // 落ちてくる束
      const a = PAPER_T[i], u = (t - a) / .25; if (u < 0 || u >= 1) continue;
      const add = PAPER_N[i] - (i ? PAPER_N[i - 1] : 0);
      s += `<g transform="translate(0 ${-(1 - u * u) * 700})">${L.papers(x, y - (i ? PAPER_N[i - 1] : 0) * 14, add, { mess: 10 })}</g>`;
    }
    // 落ちる（もぐったあと）：ざざっと左右へ散らばる
    if (t >= T.slide) {
      const u = sm(T.slide, T.slide + .45, t);
      for (let i = 0; i < 10; i++) {
        const dir = i % 2 ? 1 : -1, fx_ = x + dir * (60 + i * 18) * u, fy = lerp(y - i * 40, FLOOR + 40 - (i % 3) * 10, u);
        s += `<g transform="rotate(${dir * (4 + i * 2) * u} ${fx_} ${fy})"><rect x="${fx_ - 90}" y="${fy - 12}" width="180" height="13" rx="3" fill="${i % 2 ? '#FFFFFF' : '#F4EFE6'}" stroke="#D7CCBB" stroke-width="2"/></g>`;
      }
    }
    return s;
  }
  const pileH = t => { let n = 0; for (let i = 0; i < PAPER_T.length; i++) if (t >= PAPER_T[i] + .2) n = PAPER_N[i]; return t >= T.slide ? 0 : n; };

  // ---- ジル ----
  function jilState(t) {
    const F = RIG.FACES; let x = JX0, yOff = 0, face = Object.assign({}, F.sharp), pose = RIG.POSES.sit, look = .6, nod = 0, htilt = 0, sq = 0, tilt = 0, extra = {};
    // ふるえ
    if (t < T.drop) { x += 3 * Math.sin(t * 70); face = Object.assign({}, F.oops, { sweat: 0, browAngle: 14 }); look = .2; }
    if (t >= T.drop && t < T.drop + .5) Object.assign(extra, L.startle(t, T.drop));
    if (t >= T.on && t < T.spin0) { face = Object.assign({}, F.neutral); look = 1; }
    // 書類が落ちるたびにつぶれる → だんだんジト目
    if (t >= T.spin0 && t < T.chime) {
      face = Object.assign({}, F.annoyed, { sweat: 0 }); look = .3;
      for (const a of PAPER_T) sq -= .3 * L.pulse(t, a + .22, a + .5);
      sq -= .08 * pileH(t) / 30;
    }
    // ぴょんとこたつの横へ → くわえる
    if (t >= T.hop) {
      const h = RIG.hop(t, T.hop, T.hop + .5, JX0, JX1, { height: 34 }); x = h.x; yOff = h.yOff; sq += h.squash || 0;
      face = Object.assign({}, F.annoyed, { sweat: 0 }); look = 1;
    }
    if (t >= T.bite && t < T.roll) { const p1 = L.pulse(t, T.bite, T.bite + .3) + L.pulse(t, T.nudge2, T.nudge2 + .3); pose = RIG.POSES.nudge; nod = 14 + 10 * p1; tilt = 10 + 8 * p1; x += 30 * p1; htilt = 14; face = Object.assign({}, F.annoyed, { sweat: 0 }); look = 1; }   // 頭でつんつん（腕なし）
    if (t >= T.roll && t < T.tempt) { Object.assign(extra, L.startle(t, T.shut), {}); face = Object.assign({}, F.oops, { sweat: 0 }); }
    if (t >= T.droop && t < T.tempt) Object.assign(extra, L.droop(t, T.droop));
    // こたつを見る → とろける → あごを天板に
    if (t >= T.tempt) {
      const k = sm(T.tempt, T.tempt + .5, t), c = sm(T.chin, T.chin + .6, t);
      face = Object.assign({}, k < .5 ? F.neutral : F.shy, { mouth: 'w' }); look = 1; extra.eyeOpen = lerp(1, .35, c); extra.eyeShape = c > .4 ? 'happy' : 'round';
      pose = c > 0 ? RIG.POSES.lean : RIG.POSES.sit; tilt = 14 * c; nod = 26 * c; htilt = 10 * c; x = JX1 + 40 * c; yOff = 0; extra.blush = .9;
      extra.earL = 18 * c; extra.earR = -18 * c;   // 耳の力がぬける
    }
    return { x, yOff, face, pose, look, nod, htilt, sq, tilt, extra };
  }
  function jilPose(t) {
    const s = jilState(t);
    const p = Object.assign({}, s.pose, s.face, { x: s.x, y: FLOOR - 413 * JS + (s.yOff || 0), scale: JS, eyeLook: s.look, headNod: s.nod, headTilt: s.htilt, bodyTilt: s.tilt }, s.extra);
    if (s.extra.yOff) p.y += s.extra.yOff;
    p.bodySquash = (s.extra.bodySquash || 0) + s.sq;
    return p;
  }
  // ジルの口・頭のてっぺん（大きさ 1・体の左上 0,0 のとき）
  const jilMouth = t => { const s = jilState(t); return { x: s.x + 200 * JS + 40 * JS * sm(T.bite, T.bite + .2, t), y: FLOOR - 413 * JS + 250 * JS + s.nod * 1.6 + (s.yOff || 0) }; };
  const jilHeadTop = t => { const s = jilState(t), p = jilPose(t); return { x: s.x + 188 * JS, y: p.y + 120 * JS + 140 * Math.max(0, -(p.bodySquash || 0)) + (s.nod || 0) * 1.4 }; };

  // ---- レン ----
  function renPose(t) {
    const F = RIG.FACES; let x = REN_OUT, y = FLOOR - 413 * RS, face = Object.assign({}, F.oops, { sweat: 0, browAngle: 14 }), look = -.3, sq = 0, nod = 0, htilt = 0, extra = {}, pose = RIG.POSES.sit;
    if (t < T.drop) x += 3 * Math.sin(t * 66 + 1);
    if (t >= T.drop && t < T.drop + .5) Object.assign(extra, L.startle(t, T.drop + .05));
    if (t >= T.drop + .5 && t < T.on + .2) { face = Object.assign({}, F.think); look = -.8; }
    if (t >= T.on + .2 && t < T.jump) { face = Object.assign({}, F.smile, { sparkle: 1 }); look = -.8; extra.earL = -10 * L.pulse(t, T.on + .2, T.on + .6); }
    Object.assign(extra, L.anticip(t, T.jump, .22));
    // 飛びこむ：その場で高く跳んで、こたつの中へもぐる
    if (t >= T.jump && t < T.land) {
      y -= 200 * Math.sin(Math.PI * (t - T.jump) / (T.land - T.jump)); pose = RIG.POSES.binky; face = Object.assign({}, F.smile); extra.earL = -26; extra.earR = 26;
    }
    if (t >= T.land) face = Object.assign({}, F.smile);
    Object.assign(extra, L.land(t, T.land, .26));
    // 沈む：肩まで → 目の下まで（体をつぶして頭を下げる・少し下へ。足は布団のすそがかくす）
    const s1 = L.outBack(sm(T.sink1, T.sink1 + .35, t)), s2 = L.outBack(sm(T.sink2, T.sink2 + .45, t));
    if (t >= T.land) { y += 22 * s1 + 30 * s2; sq += -.3 * s1 - .25 * s2; nod += 6 * s1 + 10 * s2; }
    if (t >= T.sink1) { face = Object.assign({}, F.smile, { blush: .9 }); extra.eyeOpen = .7; }
    if (t >= T.sink2) { face = Object.assign({}, F.sleepy, { zzz: 0, blush: .8 }); htilt = 8; extra.earL = 40; extra.earR = -40; }   // たれ耳が天板の上に広がる
    if (t >= T.bite && t < T.roll) { face = Object.assign({}, F.sleepy, { zzz: 0, browAngle: 10 }); htilt = 8 - 6 * Math.sin((t - T.bite) * 30) * sm(T.bite, T.bite + .1, t); }   // つんつんされて、目を閉じたまま、むっ
    if (t >= T.roll) { const u = sm(T.roll, T.shut, t); y += 460 * u * u; htilt = 8 - 10 * L.pulse(t, T.roll, T.shut); face = Object.assign({}, F.sleepy, { zzz: 0, blush: .8 }); }   // 寝たまま、すぽっと全部もぐる
    return Object.assign({}, pose, face, { x, y: y + (extra.yOff || 0), scale: RS, flip: true, eyeLook: look, headNod: nod, headTilt: htilt, bodySquash: (extra.bodySquash || 0) + sq }, extra, { yOff: 0 });
  }

  // ---- 白い息（寒い朝）・Zz ----
  const breath = (x, y, t, ph) => { const u = ((t + ph) / .9) % 1; return `<g opacity="${(.7 * Math.sin(Math.PI * u)).toFixed(2)}" fill="#FFFFFF"><circle cx="${x + 30 * u}" cy="${y - 40 * u}" r="${14 + 22 * u}"/><circle cx="${x + 56 * u}" cy="${y - 58 * u}" r="${10 + 14 * u}"/></g>`; };
  const ZZ = (x, y, t) => `<g font-family="Noto Sans CJK JP" font-weight="900" fill="#5F6B8C" opacity=".9">${[0, 1, 2].map(i => { const ph = (t * .5 + i * .33) % 1; return `<text x="${x + i * 30 + ph * 40}" y="${y - ph * 160}" font-size="${44 + i * 14}" opacity="${(1 - ph).toFixed(2)}">z</text>`; }).join('')}</g>`;

  const TELOP = (k) => k <= 0 ? '' : `<g transform="translate(540 560) scale(${L.outBack(Math.min(1, k * 1.6))})" opacity="${Math.min(1, k * 3)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle">
    <rect x="-452" y="-122" width="904" height="292" rx="46" fill="#3B2412" opacity=".22" transform="translate(6 10)"/>
    <rect x="-452" y="-122" width="904" height="292" rx="46" fill="#3A2414" opacity=".9"/><rect x="-436" y="-108" width="872" height="18" rx="9" fill="#fff" opacity=".08"/>
    <text y="-16" font-size="88" fill="#FFF7E8">続きは次回！</text><text y="66" font-size="54" fill="#F2D3A8">フォローして待っててね</text>
    <text y="128" font-size="38" fill="#FFF7E8" opacity=".85" font-family="Noto Sans, Noto Sans CJK JP, sans-serif">To be continued! Follow us</text></g>`;

  const still = t => t >= T.freeze + .3 && t < 16.6;
  window.EP = {
    dur: 17.0,
    bgmHolds: '0.0-1.6',
    // 最後のテロップの間は、わざと止める（とろけたジルと沈んだレンの構図のまま）。沈んだレンは顔の下半分が布団にかくれる（オチそのもの）
    qaAllow: { hidden_ren: [[10.25, 17]], still: [[13.4, 17]] },
    sfx: [{ t: 0.1, type: 'whoosh' }, { t: T.drop, type: 'whoosh' }, { t: T.drop + .3, type: 'thump' }, { t: T.on, type: 'pikon' }, { t: T.on + .3, type: 'hum' },
      { t: T.jump, type: 'boing' }, { t: T.land, type: 'flop' }, { t: T.sink1, type: 'puku' }, { t: T.sink2, type: 'puku' },
      { t: T.spin0, type: 'swish' }, ...PAPER_T.map(a => ({ t: a + .22, type: 'thump' })), { t: T.chime, type: 'chime' },
      { t: T.hop, type: 'tap' }, { t: T.bite, type: 'tap' }, { t: T.nudge2, type: 'tap' }, { t: T.roll, type: 'whoosh' }, { t: T.shut, type: 'pon' }, { t: T.slide, type: 'flop' }, { t: T.chin, type: 'kyu' }, { t: T.telop, type: 'pop' }],
    frame(t) {
      if (!window.L || !window.RIG) return;
      // 時計：9:00 → 18:00（5.9〜8.7）。窓：昼 → 夕方 → 夜
      const k = L.ease(sm(T.spin0, T.spin1, t)), mins = 9 * 60 + Math.round(k * 540);
      const hh = Math.floor(mins / 60), mm = mins % 60;
      const bg = L.office({ sky: hh >= 18 ? 'night' : hh >= 16 ? 'dusk' : 'day', clock: [hh, mm], noClock: true }) + L.clock(540, 300, [hh, mm], .9);
      const jp = jilPose(t);
      
      // こたつ（1.6 に上から落ちてくる）
      const lift = t >= T.lift && t < T.shut ? L.outBack(sm(T.lift, T.lift + .3, t)) : t >= T.shut ? Math.max(0, 1 - sm(T.shut, T.shut + .12, t)) : 0;
      const m = jilMouth(t);
      let fx = '';
      let kt = '';
      if (t >= T.drop) { const d = L.outBack(sm(T.drop, T.drop + .3, t)); kt = `<g transform="translate(0 ${(-900 * (1 - Math.min(1, d))).toFixed(1)})">${kotatsu(t, lift, m.x, m.y)}</g>` + SWITCH(t); }
      { const rs = document.getElementById('ren'); if (rs) rs.style.clipPath = `inset(0 0 ${1920 - (FLOOR + 60)}px 0)`; }
      L.char('ren', renPose(t), t, kt, Object.assign(t >= T.land ? { shadow: false } : {}, still(t) ? { blink: false, breathe: false, ears: false, twitch: false } : {}));
      L.char('jil', jp, t, '', still(t) ? { blink: false, breathe: false, ears: false, twitch: false } : {});
      if (t > T.shut - .05 && t < T.shut + .4) fx += L.impact(KX, TOP_Y - 40, sm(T.shut - .05, T.shut + .4, t), .8, '#F2A33A');
      if (t < T.drop) fx += breath(JX0 + 200 * JS + 40, FLOOR - 413 * JS + 250 * JS, t, 0) + breath(REN_OUT + 120, FLOOR - 413 * RS + 250 * RS, t, .45);
      if (t > T.drop + .55 && t < T.on + .2) fx += L.qmark(REN_OUT + 470, FLOOR - 413 * RS - 10, 1);
      if (t > T.on + .2 && t < T.jump) fx += L.sparkles(KX, TOP_Y - 120, t, .9, 5);
      if (t > T.sink2 + .5 && t < T.roll) fx += ZZ(KX + 210, TOP_Y - 160, t);
      // 書類（ジルの頭の上）
      const ht = jilHeadTop(t);
      if (t >= PAPER_T[0] - .1 && t < T.slide + .6) fx += paperPile(t, ht.x, ht.y);
      if (t >= T.slide + .6) fx += paperPile(T.slide + .6, ht.x, ht.y);
      if (k > 0 && k < 1) fx += L.speed(540, 300, .6 * Math.sin(Math.PI * k), 30);
      if (t > T.lift + .2 && t < T.shut) fx += `<g transform="translate(${KX - 60} ${TOP_Y - 60}) scale(${L.outBack(sm(T.lift + .2, T.lift + .45, t))})"><path d="M0 18 C-30 -8 -26 -34 0 -20 C26 -34 30 -8 0 18Z" fill="#F07A8C"/></g>`;
      if (t > T.droop && t < T.tempt) fx += `<path d="M${ht.x - 120} ${ht.y + 20} q-10 30 0 50" stroke="#7FA7D9" stroke-width="8" fill="none" stroke-linecap="round" opacity=".8"/>`;
      if (t > T.chin && !still(t)) fx += L.sparkles(KX - 220, TOP_Y - 140, t, .6, 3);
      if (still(t)) fx += L.sparkles(KX - 220, TOP_Y - 140, T.freeze + .3, .6, 3);
      const cam = L.camAt([
        { t: 0, z: 1.12, cx: 500, cy: 960 },
        { t: 0.01, z: 1.05, cx: 490, cy: 930, d: 1.4 },      // 寒い朝の2人
        { t: T.drop, z: .98, cx: 490, cy: 880, d: .35 },     // こたつが落ちてくる（引き）
        { t: T.on + .3, z: 1.12, cx: 590, cy: 960, d: .6 },    // レンとこたつ
        { t: T.spin0, z: 1.55, cx: 560, cy: 520, d: .4 },     // 時計
        { t: T.spin0 + 1.0, z: .98, cx: 490, cy: 860, d: .5 }, // 書類がたまるジルと、寝ているレン
        { t: T.hop, z: 1.06, cx: 490, cy: 950, d: .5 },       // つんつん
        { t: T.tempt, z: 1.22, cx: 480, cy: 990, d: .8 },     // とろける
      ], t);
      if (still(t)) { const c2 = L.camAt([{ t: 0, z: 1.22, cx: 480, cy: 990 }], T.freeze + .3); cam.z = c2.z; }
      const ui = t < 16.6 ? TELOP(L.seg(t, T.telop, T.telop + .5)) : '';
      L.mount({ bg, back: t >= T.drop + .2 ? `<ellipse cx="${KX + 10}" cy="${FLOOR + 56}" rx="${KW + 110}" ry="22" fill="#3B2412" opacity=".22" data-nb="1"/>` : '', fx, ui, cam, t, shake: t > T.drop + .28 && t < T.drop + .42 ? 8 : 0 });
      if (typeof endcard === 'function') endcard(t, EP.dur);
    }
  };
})();
var EP = window.EP;
