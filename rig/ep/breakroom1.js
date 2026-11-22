// 「休憩室のこたつ 第1話（Part 1）いま、蹴った？」（本編24秒＋締めテロップ3秒＋エンドカード1秒・セリフなし）2026-11-21 オーナーの絵コンテ
// 状況：寒い朝の休憩室。課長モチと部下ユズが、こたつに向かい合って仕事をしている
// オチ：布団の中で足に「コツン」→ おたがいを疑う → 2人同時に足を引くのに、布団の真ん中がもぞっ（誰かいる）→ モチがめくる寸前でカット
// 0–5    札「休憩室」から室内へ。モチは前足で書類をトントン、ユズはノートPCを開く
// 5–10   モチがハンコを押しかけた瞬間、足に「コツン」。片耳がピクッ。ハンコを浮かせたまま、目だけでユズをジロリ
// 10–16  ユズは背筋を伸ばし、キーボードを軽く叩いて仕事に戻る。モチが書類に目を戻すと、今度はユズの足に「コツン」。ユズの両耳がピンと立ち、前足が止まる
// 16–24  顔を見合わせ、同時に足を引く → 一拍 → 布団の裾が真ん中からもぞっ → モチがそっと前足を伸ばし、めくる寸前でカット（クリは第2話で初めて見せる）
// 24–27  締めテロップ「こたつの中に誰かいる？」「フォローして第2話へ」
// 前足：公式の形と長さのまま、体のふちから短く（common.js の limb）。指や関節は足さない。セット・位置は rig/v2/breakroom_set.js（3話共通）
// 次の話へ引きつぐ最後の状態：モチは前足を布団の前（BR.LIFT の所）にのばしたまま・ハンコは天板（P.hanko）・書類はそろった束・ノートPCは開いた・みかんはかごとむいたもの（6房）
document.write('<script src="v2/lib.js"><\/script><script src="v2/elevator_set.js"><\/script><script src="v2/breakroom_set.js"><\/script>');
(function () {
  const sm = (a, b, t) => { const k = Math.max(0, Math.min(1, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const KOTSUN1 = 6.3, KOTSUN2 = 13.4, PULL = 17.0, MOZO = [18.5, 19.3, 20.0], CUT = 24.0;
  // ---- モチ ----
  function renPose(t) {
    const R = BR.REN, F = RIG.FACES;
    let face = F.neutral, look = -.2, nod = 6, htilt = 0, sq = 0, earL = 0, earR = 0, x = R.x, y = R.y, eyeOpen = 1, tilt = 0;
    if (t < 5.0) { look = -.1; nod = 12; }                                                       // 書類を見る
    if (t >= 5.0 && t < KOTSUN1) { look = -.1; nod = 12; face = F.sharp; }                       // ハンコ
    if (t >= KOTSUN1 && t < 7.0) { earL = -10 * L.pulse(t, KOTSUN1, KOTSUN1 + .25); nod = 12; look = -.1; face = F.neutral; eyeOpen = 1.12; }   // ピクッ（片耳）
    if (t >= 7.0 && t < 12.6) { look = lerp(-.1, -1, sm(7.0, 7.35, t)); nod = 12; face = Object.assign({}, F.sharp, { eyeShape: 'half', mouth: 'line' }); eyeOpen = .7; }   // 目だけでジロリ（首は動かさない）
    if (t >= 12.6 && t < 13.4) { look = lerp(-1, -.1, sm(12.6, 12.9, t)); nod = 12; face = F.neutral; }   // 書類に目を戻す
    if (t >= 13.4 && t < 16.0) { look = -.1; nod = 12; face = F.neutral; if (t > 13.6) look = lerp(-.1, -.9, sm(13.6, 13.9, t)); }   // ユズの耳がピンと → ん？
    if (t >= 16.0) { look = -1; nod = 4; face = Object.assign({}, F.neutral, { mouth: 'line' }); eyeOpen = 1.1; }   // 顔を見合わせる
    if (t >= PULL && t < PULL + .35) { sq = -.12 * L.pulse(t, PULL, PULL + .35); x += 14 * L.pulse(t, PULL, PULL + .35); }   // 足を引く（腰が少し後ろへ）
    if (t >= 18.3) { look = -.3; nod = 18 * sm(18.3, 18.6, t); eyeOpen = 1.2; face = Object.assign({}, F.neutral, { mouth: 'line' }); }   // 布団を見る
    if (t >= 20.4) { const k = L.ease(sm(20.4, 22.6, t)); const C = BR.CROUCH; x = R.x + C.dx * k; tilt = C.tilt * k; nod = 20 + 6 * k; y = R.y + C.dy * k; }   // そっと身をかがめて、布団のはしをのぞく
    return Object.assign({}, RIG.POSES.sit, face, { x, y, scale: R.s, flip: R.flip, eyeLook: look, headNod: nod, headTilt: htilt, bodySquash: sq, earL, earR, eyeOpen, bodyTilt: tilt, blush: .2 });
  }
  // ---- ユズ（左・右向き）----
  function jilPose(t) {
    const J = BR.JIL, F = RIG.FACES;
    let face = F.neutral, look = .2, nod = 10, htilt = 0, sq = 0, earL = 0, earR = 0, eyeOpen = 1, x = J.x;
    if (t >= 7.0 && t < 10.0) { look = .2; nod = 10; }                                            // 気づかずにPC
    if (t >= 10.0 && t < 10.6) { look = lerp(.2, 1, sm(10.0, 10.2, t)); face = Object.assign({}, F.neutral, { mouth: 'line' }); eyeOpen = 1.15; }   // 視線に気づく
    if (t >= 10.4 && t < 13.4) { const k = L.outBack(sm(10.4, 10.75, t)); sq = .12 * k; nod = lerp(10, 2, k); look = lerp(1, .2, sm(10.6, 10.9, t)); face = F.sharp; }   // 背筋を伸ばして仕事に戻る
    if (t >= KOTSUN2 && t < 16.0) { earL = -16 * L.pulse(t, KOTSUN2, KOTSUN2 + .3) ; earR = 16 * L.pulse(t, KOTSUN2, KOTSUN2 + .3); sq = .14; face = Object.assign({}, F.neutral, { mouth: 'line' }); eyeOpen = 1.22; nod = 2; look = .2;
      if (t > 13.75) look = lerp(.2, 1, sm(13.75, 14.1, t)); }                                    // 両耳がピン・前足が止まる → ん？
    if (t >= 16.0) { look = 1; nod = 4; face = Object.assign({}, F.neutral, { mouth: 'line' }); eyeOpen = 1.15; sq = .06; }
    if (t >= PULL && t < PULL + .35) { sq -= .12 * L.pulse(t, PULL, PULL + .35); x -= 14 * L.pulse(t, PULL, PULL + .35); }
    if (t >= 18.3) { look = .5; nod = 18 * sm(18.3, 18.6, t); eyeOpen = 1.25; }
    return Object.assign({}, RIG.POSES.sit, face, { x, y: J.y, scale: J.s, flip: J.flip, eyeLook: look, headNod: nod, headTilt: htilt, bodySquash: sq, earL, earR, eyeOpen, blush: .3 });
  }
  // 布団：コツン（足が触れた所が小さくはねる）・同時に足を引く（左右のすそ）・真ん中のもぞっ
  function futonAt(t) {
    const bumps = [];
    for (const [t0, x] of [[KOTSUN1, 700], [KOTSUN2, 420]]) if (t >= t0 && t < t0 + .5) bumps.push({ x, k: .45 * Math.sin(Math.PI * (t - t0) / .5) });
    if (t >= PULL && t < PULL + .4) { bumps.push({ x: 360, k: .35 * L.pulse(t, PULL, PULL + .4) }, { x: 740, k: .35 * L.pulse(t, PULL, PULL + .4) }); }
    let mz = 0; for (const m of MOZO) if (t >= m && t < m + .55) mz = Math.max(mz, Math.sin(Math.PI * (t - m) / .55) * (m === MOZO[2] ? 1.1 : .8));
    if (t >= MOZO[2] + .55) mz = .25;                                                                      // 少しふくらんだまま
    if (mz) bumps.push({ x: 560 + 30 * Math.sin(t * 3), k: mz });
    const pull = t >= PULL ? L.pulse(t, PULL, PULL + .4) : 0;
    return { bumps, futL: -pull, futR: pull };
  }
  // 小物の状態
  function propsAt(t) {
    const pr = { laptop: { open: sm(3.1, 4.3, t), glow: t > 4.3 ? .6 : 0 }, papers: { lift: 0, mess: 1 - sm(2.6, 4.6, t) }, hankoHeld: t >= 5.15 };
    for (const t0 of [2.7, 3.5, 4.1]) pr.papers.lift = Math.max(pr.papers.lift, .6 * L.pulse(t, t0, t0 + .36));
    return pr;
  }
  // ハンコを持つ位置（持ち上げた所）
  function hankoAt(t) {
    const P = BR.P;
    const up = { x: P.papers.x + 12, y: P.papers.y - 88 }, near = { x: P.papers.x + 12, y: P.papers.y - 40 };
    if (t < 5.6) { const k = L.ease(sm(5.15, 5.6, t)); return { x: lerp(P.hanko.x, up.x, k), y: lerp(P.hanko.y, up.y, k) }; }
    if (t < KOTSUN1) { const k = L.ease(sm(5.75, KOTSUN1, t)); return { x: up.x, y: lerp(up.y, near.y, k) }; }   // 押しかける
    if (t < 16.0) return { x: near.x, y: near.y - 6 * L.pulse(t, KOTSUN1, KOTSUN1 + .3) };                       // 浮かせたまま止まる
    const k = L.ease(sm(16.0, 16.6, t)); return { x: lerp(near.x, P.hanko.x, k), y: lerp(near.y, P.hanko.y, k) };   // 置く（足を引く前に）
  }
  // 前足（公式の形・長さのまま。体のふちから短く）
  function paws(t, fx) {
    const P = BR.P, pr = propsAt(t);
    // モチ：書類をトントン（両前足で束の両はし）→ ハンコ → 最後は布団へ
    if (t < 5.0) { const lift = pr.papers.lift; for (const dx of [-58, 62]) limb(fx, 'ren', { x: P.papers.x + dx, y: P.papers.y - 14 - 40 * lift }, { max: 110, w: 32 }); }
    else if (t < 16.6) { const h = hankoAt(t); limb(fx, 'ren', { x: h.x + 16, y: h.y - 26 }, { max: 120, w: 32 }); limb(fx, 'ren', { x: P.papers.x + 50, y: P.papers.y - 8 }, { max: 110, w: 32 }); }
    else if (t < 20.4) limb(fx, 'ren', { x: P.papers.x + 40, y: P.papers.y - 8 }, { max: 110, w: 32 });
    else if (t < 21.2) limb(fx, 'ren', { x: P.papers.x + 40, y: P.papers.y - 8 }, { max: 110, w: 32 });
    else if (t >= 21.9) { const k = L.ease(sm(21.9, 23.6, t)); limb(fx, 'ren', { x: lerp(BR.LIFT.cx + 190, BR.LIFT.cx + 120, k), y: lerp(BR.K.floor - 170, BR.K.floor - 40, k) }, { max: 120, w: 30, bend: 10 }); }   // 布団の右の外（モチの体の見えている所）から、そっと布団のはしへ（めくる寸前）
    // ユズ：PCを開く（画面のふちを前足で押し上げる）→ キーボード（両前足を交互に、軽く）
    const kb = { x: P.laptop.x + 20, y: P.laptop.y + 4 };
    if (t >= 2.9 && t < 4.4) { const lid = BR.laptopLid(sm(3.1, 4.3, t)); limb(fx, 'jil', { x: lid.x1, y: lid.y1 + 6 }, { max: 120, w: 30 }); }
    else if (t >= 4.4) {
      const typing = (t > 4.6 && t < 7.0) || (t > 10.8 && t < 13.4);
      for (const [i, dx] of [[0, -26], [1, 30]]) { const tap = typing ? Math.max(0, Math.sin((t * 9 + i * 1.6) * Math.PI)) * 9 : 0;
        const stop = t >= KOTSUN2 && t < 16 ? -10 * L.pulse(t, KOTSUN2, KOTSUN2 + .3) : 0;
        limb(fx, 'jil', { x: kb.x + dx, y: kb.y - tap + stop }, { max: 110, w: 30 }); }
    }
  }
  const SFX = [];
  // タン（書類をそろえる）
  for (const t0 of [2.7, 3.5, 4.1]) SFX.push({ t: t0 + .3, type: 'tap', pan: .35 });
  SFX.push({ t: 3.15, type: 'swish', pan: -.3 }, { t: 4.25, type: 'tap', pan: -.3 });   // PCを開く・カチ
  // キーボードの小さな音
  for (let t0 = 4.7; t0 < 7.0; t0 += .19) SFX.push({ t: Math.round(t0 * 100) / 100, type: 'key', pan: -.4 });
  for (let t0 = 10.85; t0 < 13.35; t0 += .17) SFX.push({ t: Math.round(t0 * 100) / 100, type: 'key', pan: -.4 });
  SFX.push({ t: 5.2, type: 'swish', pan: .3 },                       // ハンコを持つ
    { t: KOTSUN1, type: 'kotsun', pan: .25 }, { t: KOTSUN1 + .05, type: 'twitch', pan: .4 },
    { t: 7.05, type: 'blink', pan: .3 },                              // ジロリ
    { t: 10.45, type: 'pop', pan: -.3 },                              // 背筋
    { t: KOTSUN2, type: 'kotsun', pan: -.25 }, { t: KOTSUN2 + .04, type: 'twitch', pan: -.35 },
    { t: 16.0, type: 'blink', pan: 0 },
    { t: PULL, type: 'mozo', pan: -.3 }, { t: PULL + .02, type: 'mozo', pan: .3 });
  for (const m of MOZO) SFX.push({ t: m, type: 'mozo', pan: 0 });
  SFX.push({ t: 20.5, type: 'swish', pan: .2 }, { t: CUT + .02, type: 'pop', pan: 0 });
  // 締めテロップ（2行）。下のはしと右のはしを避ける（Instagram の表示と重なりやすい）
  const TELOP = k => k <= 0 ? '' : `<g transform="translate(520 330) scale(${L.outBack(Math.min(1, k * 1.6))})" opacity="${Math.min(1, k * 3)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle">
    <rect x="-430" y="-150" width="860" height="300" rx="48" fill="#3B2412" opacity=".22" transform="translate(6 10)"/><rect x="-430" y="-150" width="860" height="300" rx="48" fill="#3A2414" opacity=".92"/>
    <text y="-22" font-size="72" fill="#FFF7E8">こたつの中に誰かいる？</text><text y="82" font-size="66" fill="#F2D3A8">フォローして第2話へ</text></g>`;
  window.EP = {
    dur: 28.0,   // 本編 24 秒＋締めテロップ 3 秒（＝Instagram 用 27 秒）＋エンドカード 1 秒（YouTube 用）
    bgm: { style: 'warm', bpm: 100, level: .52, mel: .55, shaker: .7, dips: [[5.75, 6.7, .25], [12.9, 13.85, .25], [16.9, 21.2, .32], [CUT, 27.0, .7]] },   // 朝の仕事の軽い曲。「コツン」の直前・布団が動く所で少し引く
    qaAllow: { still: [[CUT - .1, 28]], hidden_ren: [[21.0, 28]] },   // モチは身をかがめて布団のはしをのぞく（顔の下が天板にかくれる）   // わざと：24秒でカットして、その絵のまま締めテロップ（オーナーの絵コンテ）
    sfx: SFX.sort((a, b) => a.t - b.t),
    frame(t) {
      if (!window.L || !window.RIG || !window.BR) return;
      const tt = Math.min(t, CUT);   // 24 秒でカット：その後は止めた絵の上にテロップ
      const bg = BR.bg({ t: tt, min: 2 + tt / 12 });
      L.char('ren', renPose(tt), tt, '', { twitch: false, shadow: false, blink: t < CUT, breathe: t < CUT, ears: false });
      L.char('jil', jilPose(tt), tt, '', { twitch: false, shadow: false, blink: t < CUT, breathe: t < CUT, ears: false });
      const F = futonAt(tt), pr = propsAt(tt);
      const fxs = BR.kotatsu(Object.assign({ props: pr }, F)) + (pr.hankoHeld ? BR.hanko(hankoAt(tt).x, hankoAt(tt).y) : '');
      // 「コツン」の小さなしるし（布団の上）
      let mark = '';
      for (const [t0, x] of [[KOTSUN1, 700], [KOTSUN2, 420]]) if (tt >= t0 && tt < t0 + .4) { const a = 1 - (tt - t0) / .4; mark += `<g transform="translate(${x} ${BR.K.floor - 120})" opacity="${a.toFixed(2)}" stroke="#FFF7E8" stroke-width="7" stroke-linecap="round"><path d="M-40 -10 l-18 -10 M0 -26 v-20 M40 -10 l18 -10"/></g>`; }
      const cam = L.camAt([
        { t: 0, z: 2.3, cx: BR.SIGN.x, cy: BR.SIGN.y - 150 },
        { t: 0.01, z: 2.2, cx: BR.SIGN.x + 30, cy: BR.SIGN.y - 120, d: 1.5 },     // 札「休憩室」（最初のコマからゆっくり動く）
        { t: 1.5, z: 1.3, cx: 535, cy: 1090, d: 1.4 },                          // 室内へ（2人の顔と天板）
        { t: 4.9, z: 1.6, cx: 660, cy: 1080, d: .6 },                            // モチとハンコ
        { t: 6.9, z: 1.3, cx: 535, cy: 1090, d: .5 },                           // ジロリ（2人）
        { t: 13.0, z: 1.6, cx: 420, cy: 1100, d: .45 },                          // ユズ
        { t: 15.8, z: 1.3, cx: 535, cy: 1130, d: .6 },                          // 顔を見合わせる・足を引く
        { t: 18.1, z: 1.24, cx: 560, cy: 1300, d: .7 },                          // 布団のもぞっ（顔と布団が入る）
        { t: 20.4, z: 1.04, cx: 690, cy: 1290, d: 2.4 },                         // そっと身をかがめて、前足を（こたつの右の外のモチまで入る）
      ], tt);
      const dim = t >= CUT ? `<rect x="0" y="0" width="1080" height="1920" fill="#1E140C" opacity="${(.42 * sm(CUT, CUT + .2, t)).toFixed(2)}"/>` : '';
      L.mount({ bg, fx: fxs + mark, ui: t < 27.0 ? dim + TELOP(L.seg(t, CUT + .05, CUT + .5)) : dim, cam, t: tt });
      paws(tt, document.getElementById('fx'));
      if (typeof endcard === 'function') endcard(t, EP.dur);
    }
  };
})();
var EP = window.EP;
