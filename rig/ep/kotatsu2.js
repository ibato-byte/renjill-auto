// 「こたつと上司 第2話（Part 2）」（約11秒＋テロップ・セリフなし）2026-11-20 総見直し（Claude）の企画。全体は docs/series/2026-11-26_kotatsu.md
// 前回：寒い朝、会社にこたつ。課長（レン）はもぐったまま出てこず、仕事はジルの頭に積もり、最後はジルもこたつを見てとろけた（最初の0.9秒は、その終わりの夜の絵）
// 状況：翌朝。ジルが課長のたれ耳を口でくわえて、こたつから引っぱり出そうとする（腕なし。エレベーター第2話と同じやり方）
// オチ：綱引きの末、寝たままの課長の耳がボヨンと戻り、ジルがこたつの中へ吸いこまれる → 一瞬でとろける
//       書類を頭にのせて来た新人ポムも、のぞいた瞬間に吸いこまれる（書類が天板に降る）→ こたつから頭が3つ
// オチの後のオチ：3人の耳が同時に、ぴくっ
// 0.0–0.9   前回の終わり（夜・とろけたジル・こたつ）。カメラがゆっくり引く
// 0.9–1.8   時計が 18:00 → 翌朝 9:00（窓は夜 → 朝）
// 1.9–2.5   ジルがはっと起きる（L.startle）→ 寝てしまった、の顔
// 2.5–3.3   レンの頭がこたつから、ぽこっ。天板にあごをのせて寝たまま（Zz）。ジルがじろっ
// 3.4–3.9   ジルがため（L.anticip）→ ぴょんと耳の先へ → くわえる
// 4.1–6.3   綱引き：引く（耳がのびる）→ 寝たまま引き返される → 全力で引く（耳がさらにのびる・汗）。レンは目を閉じたまま
// 6.35–7.0  耳がボヨンと戻る → ジルが弧をえがいて、こたつの中へ（すぽっ）
// 7.0–7.6   こたつの左からジルの頭がぽこっ → とろける（ハート）
// 7.8–9.0   右から新人ポムが書類を頭にのせて、ぴょこぴょこ → 2人の頭を見て「？」→ のぞきこむ
// 9.1–9.5   すぽっ（ポムも中へ）→ 書類が宙に舞って天板に降る
// 9.7–10.4  ポムの頭がぽこっ → 頭が3つ並んで寝ている
// 10.6      オチの後のオチ：3人の耳が同時に、ぴくっ
// 11.2–14.2 その構図のまま。テロップ（画面の上の空いた所）「続きは次回！フォローして待っててね／To be continued! Follow us」
// 第3話へ引きつぐ最後の状態：こたつ KX=650・天板 TOP_Y。3人ともこたつの中（左からジル・レン・ポム。頭だけ出して寝ている）。天板に書類。朝
document.write('<script src="v2/lib.js"><\/script><script src="v2/elevator_set.js"><\/script>');
(function () {
  const sm = (a, b, t) => { const k = Math.max(0, Math.min(1, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const keys = (K, t) => { if (t <= K[0][0]) return K[0][1]; for (let i = 0; i < K.length - 1; i++) { const [t0, v0] = K[i], [t1, v1] = K[i + 1]; if (t <= t1) return lerp(v0, v1, sm(t0, t1, t)); } return K[K.length - 1][1]; };
  const FLOOR = 1500, KX = 650, TOP_Y = FLOOR - 165, KW = 265;   // 第1話と同じこたつ
  const RS = 1.5, JS = 1.42, PS = 1.5;                             // レン・ジル・ポムの大きさ
  const REN_X = KX - 200 * RS + 40;                               // 第1話より少し右（左にジルの頭が出る場所をあける。こたつの中なので、つながりは変わらない）
  const JX0 = 50;                                                  // 前回の終わりのジル（こたつの左でとろけている）
  const T = { spin0: 0.9, spin1: 1.8, wake: 1.9, pop: 2.5, glare: 2.95, hop: 3.4, bite: 3.85, pull1: 4.1, slack: 4.9, pull2: 5.3, snap: 6.35, fly1: 6.85, jpop: 7.05, pomIn: 7.8, pomStop: 8.35, peek: 8.95, suck: 9.15, suck1: 9.45, ppop: 9.7, twitch: 10.6, telop: 11.2, freeze: 11.5 };
  const JIN = { x: 150, y: TOP_Y - 140 - 195 * JS };               // こたつの中のジル（頭の中心が天板の少し上）          // こたつの中のジル（頭だけ出る）
  const POM0 = 1260, POM1 = 1000, PIN = { x: 895, y: TOP_Y - 105 + 128 * PS }; // ポム：入ってくる所・止まる所・こたつの中

  // ---- こたつ（第1話の kotatsu() と同じ形。ふくらみ bulge：中で何かが動くと布団がゆれる）----
  function kotatsu(t, bulge) {
    const H = FLOOR - TOP_Y, x0 = KX - KW - 40, x1 = KX + KW + 40, b = bulge || 0;
    const futon = `M${KX - KW} ${TOP_Y + 18} Q${x0 - 10} ${TOP_Y + 40} ${x0 - 30 - 20 * b} ${FLOOR - 40} L${x0 - 30 - 10 * b} ${FLOOR + 50}`
      + ` Q${x0 + 120} ${FLOOR + 60 + 16 * b} ${KX - 40} ${FLOOR + 62} Q${KX + 200} ${FLOOR + 66 + 16 * b} ${x1 + 30 + 10 * b} ${FLOOR + 50} Q${x1 + 6 + 20 * b} ${TOP_Y + 60} ${KX + KW} ${TOP_Y + 18} Z`;
    let s = `<defs><clipPath id="ktF"><path d="${futon}"/></clipPath>
      <linearGradient id="ktQ" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D9573F"/><stop offset="1" stop-color="#B53A2C"/></linearGradient></defs>`;
    s += `<g data-nb="1"><path d="${futon}" fill="url(#ktQ)"/><g clip-path="url(#ktF)" opacity=".5">`
      + [-3, -2, -1, 0, 1, 2, 3].map(i => `<rect x="${KX + i * 120 - 14}" y="${TOP_Y}" width="28" height="${H + 40}" fill="#F2C14E" opacity=".55"/>`).join('')
      + [0, 1].map(i => `<rect x="${x0 - 60}" y="${TOP_Y + 70 + i * 90}" width="${x1 - x0 + 120}" height="22" fill="#F2C14E" opacity=".45"/>`).join('')
      + `</g><path d="M${KX - KW + 10} ${TOP_Y + 30} Q${KX} ${TOP_Y + 44} ${KX + KW - 10} ${TOP_Y + 30}" stroke="#fff" stroke-width="8" fill="none" opacity=".25"/>`
      + `<path d="M${KX - 120} ${TOP_Y + 60} q-20 90 -60 ${H - 80} M${KX + 150} ${TOP_Y + 60} q30 90 70 ${H - 90}" stroke="#7E2418" stroke-width="7" fill="none" opacity=".25" stroke-linecap="round"/></g>`;
    s += `<g data-nb="1"><rect x="${KX - KW - 8}" y="${TOP_Y - 10}" width="${2 * KW + 16}" height="40" rx="10" fill="#6E4428"/>`
      + `<rect x="${KX - KW}" y="${TOP_Y - 26}" width="${2 * KW}" height="34" rx="9" fill="#A36A40"/><rect x="${KX - KW + 14}" y="${TOP_Y - 22}" width="${2 * KW - 28}" height="8" rx="4" fill="#fff" opacity=".22"/>`
      + `<path d="M${KX - KW + 60} ${TOP_Y - 12} H${KX + 40} M${KX + 90} ${TOP_Y - 6} H${KX + KW - 50}" stroke="#7A4A2A" stroke-width="3" opacity=".4"/></g>`;
    s += `<g transform="translate(${KX + KW - 70} ${TOP_Y - 44})"><circle r="26" fill="#F29A2E"/><circle cx="-8" cy="-8" r="8" fill="#fff" opacity=".35"/><path d="M0 -26 q6 -10 14 -8" stroke="#4E7A2E" stroke-width="5" fill="none" stroke-linecap="round"/></g>`;
    for (let i = 0; i < 3; i++) { const u = ((t * .6) + i / 3) % 1; s += `<path d="M${KX - 200 + i * 200} ${TOP_Y - 40 - u * 120} q14 -20 0 -40 q-14 -20 0 -40" stroke="#F2A33A" stroke-width="6" fill="none" stroke-linecap="round" opacity="${(.4 * Math.sin(Math.PI * u)).toFixed(2)}" data-nb="1"/>`; }
    // 天板の書類（ポムが落とした分。9.45 から降ってきて積もる）
    if (t >= T.suck1 + .35) { const k = sm(T.suck1 + .35, T.suck1 + .6, t); for (let i = 0; i < 7; i++) s += `<g transform="rotate(${(i % 2 ? 1 : -1) * (3 + i * 2)} ${KX - 160 + i * 52} ${TOP_Y - 30})" opacity="${k.toFixed(2)}"><rect x="${KX - 230 + i * 52}" y="${TOP_Y - 38 - (i % 3) * 7}" width="150" height="11" rx="3" fill="${i % 2 ? '#FFFFFF' : '#F4EFE6'}" stroke="#D7CCBB" stroke-width="2"/></g>`; }
    return s;
  }
  const SWITCH = `<g transform="translate(${KX + KW + 90} ${FLOOR - 6})"><path d="M-60 -10 q30 -20 60 -4" stroke="#3B2F2A" stroke-width="7" fill="none"/><rect x="-6" y="-30" width="54" height="34" rx="10" fill="#EFE8DC" stroke="#B9AE9C" stroke-width="4"/><circle cx="21" cy="-13" r="9" fill="#FF5A3C"/></g>`;

  // ---- レン：ずっと寝ている。2.5 に頭がぽこっと出て、天板にあごをのせる ----
  // 耳ののび（ジルが引っぱる量）
  const STRETCH = [[T.bite, 1], [T.pull1 + .1, 1], [T.slack, 1.45], [T.slack + .3, 1.22], [T.pull2, 1.22], [T.pull2 + .8, 1.8], [T.snap, 1.85], [T.snap + .12, .82], [T.snap + .26, 1.1], [T.snap + .4, .96], [T.snap + .55, 1]];
  const stretchAt = t => (t < T.bite || t > T.snap + .55) ? 1 : keys(STRETCH, t) + (t > T.pull2 + .6 && t < T.snap ? .03 * Math.sin(t * 60) : 0);
  function renPose(t) {
    const F = RIG.FACES; let x = REN_X, y = FLOOR - 413 * RS + 52, extra = {};
    const up = sm(T.pop, T.pop + .6, t) + .04 * L.pulse(t, T.pop + .5, T.pop + .8);   // ゆっくり、ぽこっ（qa：1コマで跳ばない）
    y += 460 * (1 - up);                                    // こたつの中 → あごを天板に
    const pull = Math.max(0, stretchAt(t) - 1);             // ジルに引かれて、頭が少し左上へ
    if (t >= T.bite && t < T.snap + .1) { x -= 34 * pull; y -= 26 * pull; }
    let htilt = 8 + (t >= T.bite && t < T.snap ? 10 * pull : 0), face = Object.assign({}, F.sleepy, { zzz: 0, blush: .8 });
    if (t >= T.snap && t < T.snap + .3) htilt = 8 - 12 * L.pulse(t, T.snap, T.snap + .3);
    if (t >= T.slack && t < T.slack + .3) x += 10 * L.pulse(t, T.slack, T.slack + .3);   // 寝たまま、むにゃっと引き返す
    extra.earL = 40; extra.earR = -40;
    if (t >= T.hop && t < T.snap + .2) extra.earR = -40 - 38 * sm(T.hop, T.bite, t) * (1 - sm(T.snap, T.snap + .2, t));   // 画面の左の耳（flip なので earR）を、ジルの口のほうへ持ち上げる
    if (t >= T.twitch && t < T.twitch + .3) { const p = L.pulse(t, T.twitch, T.twitch + .25); extra.earL = 40 - 22 * p; extra.earR = -40 + 22 * p; }
    if (t >= T.peek + .1 && t < T.suck) extra.earR = -40 - 6 * Math.sin((t - T.peek) * 40);   // ポムが来て、右の耳がぴくぴく
    return Object.assign({}, RIG.POSES.sit, face, { x, y, scale: RS, flip: true, eyeLook: 0, headNod: 16, headTilt: htilt, bodySquash: -.55 }, extra);
  }
  // 耳の伸び縮み（elevator_set.js の ELV.stretchEar と同じやり方。左右は描いたあとに、画面の左にある耳を探す）
  function earPaths() { const svg = document.getElementById('ren'); if (!svg) return []; return [...svg.querySelectorAll('path')].filter(p => /^M\s*(226|134) 112/.test(p.getAttribute('d') || '')); }
  function leftEar() {   // 画面の左がわの耳と、その先（いちばん左下の点）
    let best = null;
    for (const p of earPaths()) {
      const Lt = p.getTotalLength(), m = p.getCTM(); let tip = null;
      for (let i = 0; i <= 40; i++) { const a = p.getPointAtLength(Lt * i / 40), q = new DOMPoint(a.x, a.y).matrixTransform(m); if (!tip || q.x - .3 * q.y < tip.x - .3 * tip.y) tip = { x: q.x, y: q.y }; }
      if (!best || tip.x < best.tip.x) best = { p, tip };
    }
    return best;
  }
  function stretchLeft(k) {
    if (!k || Math.abs(k - 1) < .005) return; const e = leftEar(); if (!e) return;
    const side = /^M\s*226/.test(e.p.getAttribute('d')) ? 'R' : 'L', g = e.p.parentNode, px = side === 'R' ? 230 : 130, py = 120;
    g.setAttribute('transform', (g.getAttribute('transform') || '') + ` translate(${px} ${py}) scale(${(1 / Math.sqrt(k)).toFixed(4)} ${k.toFixed(4)}) translate(${-px} ${-py})`);
  }

  // ---- ジル ----
  // 口の位置（大きさ JS・体の左上 x,y のとき。頭でつんつん nudge のかまえ）
  const MOUTH = { x: 236, y: 250 };
  function jilPose(t, tip) {
    const F = RIG.FACES; let x = JX0, y = FLOOR - 413 * JS, face = Object.assign({}, F.shy, { mouth: 'w' }), pose = RIG.POSES.lean, look = 1, nod = 26, htilt = 10, tilt = 14, sq = 0, extra = { blush: .9, eyeOpen: .35, eyeShape: 'happy', earL: 18, earR: -18 }, layer = 'jil';
    if (t >= T.wake) {   // はっと起きる → 寝てた……の顔 → じろっ
      Object.assign(extra, { blush: 0, eyeOpen: 1, eyeShape: 'round', earL: 0, earR: 0 }, L.startle(t, T.wake));
      const k = sm(T.wake, T.wake + .2, t); tilt = 14 * (1 - k); nod = 26 * (1 - k); htilt = 10 * (1 - k); pose = RIG.POSES.sit;
      face = Object.assign({}, F.oops, { sweat: 1 }); look = -.4 + .8 * Math.sin((t - T.wake) * 9) * sm(T.wake + .3, T.wake + .4, t) * (1 - sm(T.pop - .1, T.pop, t));
    }
    if (t >= T.pop + .2) { face = Object.assign({}, F.annoyed, { sweat: 0 }); look = 1; extra.eyeShape = 'half'; extra.eyeOpen = .75; }
    if (t >= T.glare) { nod = 6 * L.pulse(t, T.glare, T.glare + .3); }
    Object.assign(extra, L.anticip(t, T.hop, .22));
    if (t >= T.hop && tip) {   // 耳の先へ、ぴょん → くわえて綱引き
      const lift = Math.max(0, Math.min(110, (y + MOUTH.y * JS) - tip.y));   // 耳の先が口より高いときは、のび上がる
      const hold = { x: tip.x - MOUTH.x * JS, y: y - lift, nod: Math.max(-10, Math.min(34, (tip.y - (y - lift + MOUTH.y * JS)) / 1.6)) };
      const k = sm(T.hop, T.bite, t); x = lerp(JX0, hold.x, k); y = lerp(y, hold.y, k) - 150 * Math.sin(Math.PI * Math.min(1, (t - T.hop) / (T.bite - T.hop)));
      pose = k < 1 ? RIG.POSES.stretch : RIG.POSES.nudge; nod = lerp(0, hold.nod, k); htilt = -6; tilt = 0; look = 1;
      face = Object.assign({}, F.annoyed, { sweat: 0 }); extra.eyeShape = 'round'; extra.eyeOpen = 1;
      if (t >= T.bite) {
        const pull = Math.max(0, stretchAt(t) - 1);
        tilt = -22 * Math.min(1, pull / .5); sq = -.1 * Math.min(1, pull); htilt = -8 - 6 * Math.min(1, pull / .5);
        face = pull > .5 ? Object.assign({}, F.oops, { sweat: 1, browAngle: 18 }) : Object.assign({}, F.annoyed, { sweat: .5 });
        extra.blush = .8 * Math.min(1, pull / .6); extra.eyeShape = pull > .5 ? 'half' : 'round';
        x += 4 * Math.sin(t * 48) * Math.min(1, pull);                                            // ぷるぷる
        extra.earL = -14 * Math.min(1, pull); extra.earR = 14 * Math.min(1, pull);                // 耳がうしろへ
      }
    }
    // ボヨン → 弧をえがいて、こたつの中へ
    if (t >= T.snap) {
      const st = jilPose(T.snap - .01, tip && JIL_TIP_AT_SNAP());
      const k = sm(T.snap, T.fly1, t);
      x = lerp(st.p.x, JIN.x, k); y = lerp(st.p.y, JIN.y + 160, k) - 340 * Math.sin(Math.PI * k);
      pose = RIG.POSES.binky; face = Object.assign({}, F.oops, { sweat: 0 }); extra = { eyeOpen: 1.25, earL: -30, earR: 30 }; tilt = 30 * k; nod = 0; htilt = 0; sq = 0;
      if (k > .55) layer = 'back';
    }
    if (t >= T.fly1) {   // 頭がぽこっ → とろける
      layer = 'back'; x = JIN.x; const u = L.outBack(sm(T.jpop, T.jpop + .3, t)); y = JIN.y + 160 * (1 - u);
      pose = RIG.POSES.sit; tilt = 0; nod = 10; htilt = 8;
      const m = sm(T.jpop + .3, T.jpop + .6, t);
      face = Object.assign({}, m < .5 ? F.oops : F.shy, { sweat: 0, mouth: 'w' }); extra = { blush: .9 * m, eyeOpen: lerp(1.2, .35, m), eyeShape: m > .4 ? 'happy' : 'round', earL: 18 * m, earR: -18 * m };
      if (t >= T.twitch && t < T.twitch + .3) { const p = L.pulse(t, T.twitch, T.twitch + .25); extra.earL = 18 - 34 * p; extra.earR = -18 + 34 * p; }
    }
    return { layer, p: Object.assign({}, pose, face, { x, y: y + (extra.yOff || 0), scale: JS, eyeLook: look, headNod: nod, headTilt: htilt, bodyTilt: tilt }, extra, { yOff: 0, bodySquash: (extra.bodySquash || 0) + sq }) };
  }
  let SNAP_TIP = null;
  const JIL_TIP_AT_SNAP = () => SNAP_TIP;

  // ---- ポム ----
  function pomAt(t) {
    let x = POM0, y = FLOOR, q = { eye: 'round', look: -1, blush: .35, wob: 0, squash: 0 }, layer = 'fx', papers = 5;
    if (t >= T.pomIn) { const h = RIG.hop(t, T.pomIn, T.pomStop, POM0, POM1, { height: 40 }); x = h.x; y = FLOOR + (h.yOff || 0); q.squash = (h.squash || 0) * .8; }
    if (t >= T.pomStop) { q.squash = -.18 * L.pulse(t, T.pomStop, T.pomStop + .25); }
    if (t >= T.pomStop + .25) { q.wob = -14 * sm(T.pomStop + .25, T.pomStop + .45, t); q.eye = 'big'; }
    if (t >= T.peek) { const k = sm(T.peek, T.suck, t); x = lerp(POM1, POM1 - 40, k); q.wob = lerp(-14, -24, k); }   // のぞきこむ
    if (t >= T.suck) {   // すぽっ
      const k = sm(T.suck, T.suck1, t); x = lerp(POM1 - 40, PIN.x, k); y = lerp(FLOOR, PIN.y + 260, k); q.squash = -.4 * Math.sin(Math.PI * k); q.eye = 'big'; papers = 0;
      if (k > .3) layer = 'back';
    }
    if (t >= T.suck1) { layer = 'back'; papers = 0; const u = L.outBack(sm(T.ppop, T.ppop + .3, t)); x = PIN.x; y = PIN.y + 260 * (1 - u); q = { eye: sm(T.ppop + .3, T.ppop + .5, t) > .5 ? 'happy' : 'big', look: -.5, blush: .35 + .5 * sm(T.ppop + .3, T.ppop + .6, t), wob: 8, squash: 0 }; }
    if (t >= T.twitch && t < T.twitch + .3) { const p = L.pulse(t, T.twitch, T.twitch + .25); q.squash = .1 * p; q.wob = 8 - 10 * p; }
    return { x, y, q, layer, papers };
  }
  // 宙に舞う書類（9.15〜9.8）
  function flying(t) {
    if (t < T.suck || t > T.suck1 + .4) return '';
    const u = (t - T.suck) / (T.suck1 + .4 - T.suck); let s = '';
    for (let i = 0; i < 7; i++) { const sx = POM1 - 40, ex = KX - 160 + i * 52, x = lerp(sx, ex, u), y = FLOOR - 300 - 380 * Math.sin(Math.PI * Math.min(1, u * 1.1)) + (TOP_Y - 30 - (FLOOR - 300)) * u, r = (i % 2 ? 1 : -1) * (20 + 200 * u) + i * 30;
      s += `<g transform="rotate(${r.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"><rect x="${(x - 75).toFixed(1)}" y="${(y - 6).toFixed(1)}" width="150" height="11" rx="3" fill="${i % 2 ? '#FFFFFF' : '#F4EFE6'}" stroke="#D7CCBB" stroke-width="2"/></g>`; }
    return s;
  }

  const ZZ = (x, y, t) => `<g font-family="Noto Sans CJK JP" font-weight="900" fill="#5F6B8C" opacity=".9">${[0, 1, 2].map(i => { const ph = (t * .5 + i * .33) % 1; return `<text x="${x + i * 30 + ph * 40}" y="${y - ph * 160}" font-size="${44 + i * 14}" opacity="${(1 - ph).toFixed(2)}">z</text>`; }).join('')}</g>`;
  const HEART = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 18 C-30 -8 -26 -34 0 -20 C26 -34 30 -8 0 18Z" fill="#F07A8C"/></g>`;
  const TELOP = (k) => k <= 0 ? '' : `<g transform="translate(540 560) scale(${L.outBack(Math.min(1, k * 1.6))})" opacity="${Math.min(1, k * 3)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle">
    <rect x="-452" y="-122" width="904" height="292" rx="46" fill="#3B2412" opacity=".22" transform="translate(6 10)"/>
    <rect x="-452" y="-122" width="904" height="292" rx="46" fill="#3A2414" opacity=".9"/><rect x="-436" y="-108" width="872" height="18" rx="9" fill="#fff" opacity=".08"/>
    <text y="-16" font-size="88" fill="#FFF7E8">続きは次回！</text><text y="66" font-size="54" fill="#F2D3A8">フォローして待っててね</text>
    <text y="128" font-size="38" fill="#FFF7E8" opacity=".85" font-family="Noto Sans, Noto Sans CJK JP, sans-serif">To be continued! Follow us</text></g>`;

  const still = t => t >= T.freeze && t < 14.2;
  const charOpt = (t, o) => Object.assign({}, still(t) ? { blink: false, breathe: false, ears: false, twitch: false } : {}, (t >= T.bite - .1 && t < T.fly1) ? { ears: false, twitch: false } : {}, o || {});
  function drawRen(t, front) {
    L.char('ren', renPose(t), t, front, charOpt(t, { shadow: false }));
    stretchLeft(stretchAt(t));
  }
  window.EP = {
    dur: 14.6,
    bgmHolds: '0.0-0.9',
    // 中に入ったジル・ポムは頭だけ（オチそのもの）。最後のテロップの間は、わざと止める
    qaAllow: { hidden_jil: [[6.6, 14.6]], still: [[11.2, 14.6]] },
    sfx: [{ t: 0.0, type: 'hum' }, { t: T.spin0, type: 'swish' }, { t: T.spin1, type: 'chime' }, { t: T.wake, type: 'twitch' }, { t: T.pop, type: 'puku' },
      { t: T.hop, type: 'boing' }, { t: T.bite, type: 'tap' }, { t: T.pull1, type: 'swish' }, { t: T.slack, type: 'flop' }, { t: T.pull2, type: 'swish' },
      { t: T.snap, type: 'boyon' }, { t: T.fly1 - .1, type: 'pon' }, { t: T.jpop, type: 'puku' }, { t: T.jpop + .4, type: 'kyu' },
      { t: T.pomIn, type: 'tap' }, { t: T.pomIn + .28, type: 'tap' }, { t: T.pomStop + .3, type: 'pikon' }, { t: T.suck, type: 'whoosh' }, { t: T.suck1 - .05, type: 'pon' },
      { t: T.suck1 + .4, type: 'flop' }, { t: T.ppop, type: 'puku' }, { t: T.twitch, type: 'twitch' }, { t: T.telop, type: 'pop' }],
    frame(t) {
      if (!window.L || !window.RIG || !window.ELV) return;
      // 時計：18:00 → 翌朝 9:00（0.9〜1.8）。窓：夜 → 朝
      const k = L.ease(sm(T.spin0, T.spin1, t)), mins = 18 * 60 + Math.round(k * 900), hh = Math.floor(mins / 60) % 24, mm = mins % 60;
      const bg = L.office({ sky: hh >= 18 || hh < 6 ? 'night' : hh < 8 ? 'dusk' : 'day', clock: [hh, mm], noClock: true }) + L.clock(540, 300, [hh, mm], .9);
      const bulge = .6 * (L.pulse(t, T.fly1 - .1, T.fly1 + .25) + L.pulse(t, T.suck1 - .1, T.suck1 + .25) + .5 * L.pulse(t, T.pop - .05, T.pop + .2));
      const front = kotatsu(t, bulge) + SWITCH;
      { const rs = document.getElementById('ren'); if (rs) rs.style.clipPath = `inset(0 0 ${1920 - (FLOOR + 60)}px 0)`; }
      // こたつの中のジル・ポム：天板より下は、布団の形の内がわだけ見せる（布団の外に体がはみ出さない）
      { const bk = document.getElementById('back'); if (bk) { const x0 = KX - KW - 40, x1 = KX + KW + 40, y = TOP_Y + 12; bk.style.clipPath = `polygon(-800px -800px, 1880px -800px, 1880px ${y}px, ${KX + KW}px ${y}px, ${x1 + 6}px ${TOP_Y + 60}px, ${x1 + 30}px ${FLOOR + 50}px, ${x0 - 30}px ${FLOOR + 50}px, ${x0 - 6}px ${TOP_Y + 60}px, ${KX - KW}px ${y}px, -800px ${y}px)`; } }
      drawRen(t, front);
      // ジル：くわえる所＝描いたレンの左の耳の先
      let tip = null;
      if (t >= T.hop && t < T.snap) { const e = leftEar(); tip = e && e.tip; }
      if (t >= T.snap && !SNAP_TIP) { const keep = t; drawRen(T.snap - .01, front); const e = leftEar(); SNAP_TIP = e && e.tip; drawRen(keep, front); }
      const J = jilPose(t, tip || (t >= T.snap ? SNAP_TIP : null));
      if (J.layer === 'jil') L.char('jil', J.p, t, '', charOpt(t)); else L.char('jil', null, t);
      const P = pomAt(t), pomSvg = ELV.pomDefs() + ELV.pom(P.x, P.y, PS, P.q) + (P.papers ? L.papers(P.x, P.y - 190 * PS, P.papers, { mess: 6 }) : '');
      let fx = '';
      if (P.layer === 'fx') fx += pomSvg;
      fx += flying(t);
      if (t > T.pop + .5 && t < T.bite) fx += ZZ(KX + 200, TOP_Y - 170, t);
      if (t >= T.freeze) fx += ZZ(KX + 200, TOP_Y - 170, T.freeze);
      else if (t > T.ppop + .4) fx += ZZ(KX + 200, TOP_Y - 170, t);
      if (t < T.wake) fx += HEART(JX0 + 260, FLOOR - 413 * JS + 30, 1);
      if (t > T.jpop + .45 && t < T.pomIn + .4) fx += HEART(JIN.x + 290, TOP_Y - 250, L.outBack(sm(T.jpop + .45, T.jpop + .65, t)));
      if (t > T.wake && t < T.wake + .5) fx += L.emark(JX0 + 330, FLOOR - 413 * JS - 10, .8);
      if (t > T.pomStop + .3 && t < T.suck) fx += L.qmark(P.x + 20, P.y - 360, .9);
      if (t > T.snap - .02 && t < T.snap + .35) fx += L.impact(380, TOP_Y - 80, sm(T.snap - .02, T.snap + .35, t), .7, '#F2A33A');
      if (t > T.fly1 - .1 && t < T.fly1 + .3) fx += L.dust(JIN.x + 260, TOP_Y - 20, sm(T.fly1 - .1, T.fly1 + .3, t));
      if (t > T.suck1 - .1 && t < T.suck1 + .3) fx += L.dust(PIN.x, TOP_Y - 20, sm(T.suck1 - .1, T.suck1 + .3, t));
      if (t > T.pull2 + .2 && t < T.snap) fx += `<g opacity=".85">${[0, 1, 2].map(i => `<path d="M${(J.p.x + 90 - i * 30).toFixed(0)} ${(J.p.y + 120 + i * 40).toFixed(0)} l-60 ${-10 + i * 10}" stroke="#7FA7D9" stroke-width="8" stroke-linecap="round"/>`).join('')}</g>`;   // ふんばる線
      if (k > 0 && k < 1) fx += L.speed(540, 300, .6 * Math.sin(Math.PI * k), 30);
      const cam = L.camAt([
        { t: 0, z: 1.3, cx: 430, cy: 1080 },                   // 前回の終わり（とろけたジル）
        { t: 0.01, z: 1.18, cx: 470, cy: 1060, d: .85 },
        { t: T.spin0, z: 1.55, cx: 560, cy: 520, d: .35 },      // 時計
        { t: T.spin1 + .05, z: 1.08, cx: 500, cy: 1040, d: .4 }, // 朝。ジルとこたつ
        { t: T.bite + .1, z: 1.14, cx: 420, cy: 1080, d: .6 },  // 綱引き
        { t: T.pull2, z: 1.1, cx: 420, cy: 1060, d: .6 },       // 全力で引く（ジルが左へ下がる）
        { t: T.snap, z: 1.04, cx: 500, cy: 1020, d: .4 },       // 吸いこまれる
        { t: T.pomIn - .1, z: 1.0, cx: 600, cy: 1020, d: .5 },  // ポムが来る
        { t: T.ppop + .2, z: 1.22, cx: 570, cy: 1200, d: .7 },  // 頭が3つ
      ], t);
      if (still(t)) cam.z /= 1 + .004 * Math.sin(t * .9);
      const ui = t < 14.2 ? TELOP(L.seg(t, T.telop, T.telop + .5)) : '';
      L.mount({ bg, back: `<ellipse cx="${KX + 10}" cy="${FLOOR + 56}" rx="${KW + 110}" ry="22" fill="#3B2412" opacity=".22" data-nb="1"/>`, fx, ui, cam, t, shake: t > T.snap && t < T.snap + .14 ? 7 : 0 });
      // こたつの中（レンの層＝こたつの手前より奥）：ジルとポム
      const b = document.getElementById('back');
      if (b && (J.layer === 'back' || P.layer === 'back')) {
        if (J.layer === 'back') RIG.render(b, RIG.alive(Object.assign({}, RIG.DEFAULTS, { char: 'jil' }, J.p), t, charOpt(t, { ears: !still(t) })));
        else b.innerHTML = '';
        if (P.layer === 'back') b.insertAdjacentHTML('beforeend', pomSvg);
        b.__html = '#in';   // 次のコマで L.mount が描き直す
      }
      if (typeof endcard === 'function') endcard(t, EP.dur);
    }
  };
})();
var EP = window.EP;
