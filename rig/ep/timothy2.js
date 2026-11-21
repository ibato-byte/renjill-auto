// 「ポムのお土産『金のチモシー』第2話（Part 2）課長が預かります」（本編20秒＋締めテロップ3秒＋エンドカード1秒・セリフなし）2026-11-21 オーナーの絵コンテ
// 前回：ジルが箱のチモシーを3分の1まで食べたところを、レン課長に見られた（最初の1.6秒：残り3分の1の箱を見下ろすレン）
// 状況：お土産を「課長が預かる」ことになった
// オチ：預かったはずの課長がデスクでほぼ食べきり、口の端から1本出たまま真顔
// 0–6    第1話の続き。レンがきりっとした顔で、残り約3分の1の箱を見下ろす →（カット・引き）誰もいない休憩室にレンだけ。首ごと左・右・左を確かめる（2026-11-22 オーナー） → 鼻を近づける → 鼻ひくっ・耳ぴん・思わず笑顔 → もう一度目だけで周り →（カット）レンが去ったあと、箱のチモシーは1〜2本
// 6–13   レンのデスク。書類の横に、箱から取り分けたチモシーの浅い皿。真面目な顔で書類 → 目が皿へ → ひとくち → すぐ書類へ → 一拍で目が皿へ → もうひとくち（同じ構図で皿の中身を減らす）
// 13–20  ジルとポムがデスクの横から顔をのぞかせる。レンは何事もなかったように真顔で正面。皿はほとんど空、口の端からチモシーが1本（片側だけのヒゲのよう）。ふたりの目がそろってその1本へ。BGMを少し引いて真顔を一拍 → 17.4〜 ふたりで課長をじろり（あきれ顔。2026-11-22 オーナー）
// 20–23  締めテロップ「課長もハマった？」「フォローして最終話へ」
// 前足：使わない（デスクの陰）。持ち出し・取り分けは「箱のチモシーが1〜2本になる」→「デスクの皿に盛られている」のカットでつなぐ
// 次の話へ引きつぐ状態：休憩室の箱の皿は空に近い（1〜2本）→ 第3話は翌日で空っぽ
document.write('<script src="v2/lib.js"><\/script><script src="v2/elevator_set.js"><\/script><script src="v2/breakroom_set.js"><\/script><script src="v2/timothy_set.js"><\/script>');
(function () {
  const sm = (a, b, t) => { const k = Math.max(0, Math.min(1, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ALONE = 1.4, SNIFF = 3.9, SMILE = 4.3, CHECK = 4.7, GONE = 5.45, JIRO2 = 17.4, DESK_T = 6.0, B1 = 8.0, B2 = 10.6, CUTD = [9.3, 11.9], PEEK = 13.2, FRONT = 13.8, LOOK = 15.0, CUT = 20.0;
  const DESK = 1400, QX = -380, QY = -70;   // カットのあと、箱のま後ろから身をのり出す
  // デスクの皿の量（同じ構図のカットごとに減らす）
  const deskDish = t => t < CUTD[0] ? 1 : t < CUTD[1] ? .62 : t < PEEK ? .3 : .06;
  const chew = (t, t0, d = 1.0) => t >= t0 && t < t0 + d ? (Math.sin((t - t0) * 2 * Math.PI * 4.2) > 0 ? 1 : 0) : -1;
  const DD = { x: 520, y: DESK - 6 };       // デスクの皿（レンの左前）
  const PAPERS = { x: 840, y: DESK + 4 };   // 書類（レンの右前）
  // ---- 休憩室のレン（0–5.3）----
  function renRoom(t) {
    const R = TM.REN, F = RIG.FACES;
    let look = -.3, nod = 16, face = Object.assign({}, F.sharp, { mouth: 'line' }), eyeOpen = 1, earL = 0, earR = 0, nose = 0, lean = 0;
    let flip = R.flip, tiltH = 0;
    if (t >= ALONE && t < SNIFF - .4) {   // 誰もいないか、首ごと左 → 右 → 左を確かめる（2026-11-22 オーナー：引きの画で、しっかり）
      nod = 4; eyeOpen = .95; face = Object.assign({}, F.neutral, { mouth: 'line' });
      if (t < 2.2) { look = -1; tiltH = -6 * sm(ALONE, ALONE + .3, t); }                       // 左（入口の方）
      else if (t < 2.95) { flip = !R.flip; look = 1; tiltH = 6; }                              // 右（窓の方）…くるっと首を向ける
      else { look = lerp(-1, -.3, sm(3.2, 3.45, t)); tiltH = -4; }                             // もう一度左…よし
    }
    if (t >= SNIFF - .4) { lean = L.ease(sm(SNIFF - .4, SNIFF, t)) * (1 - L.ease(sm(CHECK, CHECK + .3, t)) * .4); look = -.5; face = Object.assign({}, F.neutral, { mouth: 'w' }); }
    if (t >= SNIFF && t < SMILE + .9) nose = Math.max(0, Math.sin((t - SNIFF) * 30));                                               // 鼻がひくっ
    if (t >= SMILE) { const k = L.outBack(sm(SMILE, SMILE + .25, t)); earL = -12 * k; earR = 12 * k; face = Object.assign({}, F.smile, { blush: .8 }); }   // 耳ぴん・思わず笑顔
    if (t >= CHECK) { const u = (t - CHECK) / .8; look = u < 1 ? Math.sin(u * Math.PI * 2) * -.9 : -.4; eyeOpen = .8; face = Object.assign({}, F.neutral, { mouth: 'w', eyeShape: 'half' }); earL = earR = 0; }   // もう一度、目だけで周り
    const bx = t < ALONE ? R.x : R.x + QX;   // カットのあと、レンは箱のま後ろへ
    return Object.assign({}, RIG.POSES.sit, face, { x: bx - 40 * lean, y: R.y + QY * lean, scale: R.s, flip, headTilt: tiltH, eyeLook: look, headNod: nod + 12 * lean, earL, earR, eyeOpen, nose, bodyTilt: -6 * lean });
  }
  // ---- デスクのレン（6–20）----
  const RD = { x: 420, y: DESK - 560, s: 1.35 };
  function renDesk(t) {
    const F = RIG.FACES;
    let look = .5, nod = 14, face = Object.assign({}, F.sharp, { mouth: 'line' }), eyeOpen = .9, lean = 0, mouth = null, strand = 0, earL = 0, earR = 0;
    // 書類（右）を見る ⇔ 皿（左）を見る
    if (t >= 7.2 && t < B1) { look = lerp(.5, -1, sm(7.2, 7.45, t)); }                                    // 目が皿へ
    for (const b of [B1, B2]) { const k = L.ease(sm(b - .35, b, t)) * (1 - L.ease(sm(b + .8, b + 1.0, t))); lean = Math.max(lean, k); if (t >= b - .35 && t < b + 1.0) look = -.6; const c = chew(t, b); if (c >= 0) mouth = c ? 'w' : 'line'; }
    if (t >= B1 + 1.0 && t < 10.0) { look = .5; }                                                           // すぐ書類へ
    if (t >= 10.0 && t < B2 - .35) { look = lerp(.5, -1, sm(10.0, 10.2, t)); }                              // 一拍で、また皿へ
    if (t >= B2 + 1.0) { look = .5; mouth = mouth || 'w'; }
    if (t >= PEEK) { look = .5; }
    if (t >= FRONT) { const k = sm(FRONT, FRONT + .3, t); look = lerp(.5, 0, k); nod = lerp(14, 2, k); eyeOpen = 1; face = Object.assign({}, F.neutral, { mouth: 'line' }); strand = 1; }   // 何事もなかったように真顔で正面
    if (t >= B2 + .4) strand = 1;   // ふたくち目から、口の端に1本
    return Object.assign({}, RIG.POSES.sit, face, { x: RD.x - 70 * lean, y: RD.y + 40 * lean, scale: RD.s, flip: false, eyeLook: look, headNod: nod + 16 * lean, eyeOpen, earL, earR, strand, bodyTilt: -4 * lean }, mouth ? { mouth } : {});
  }
  // ---- のぞくジル・ポム（デスクの左はし）----
  const JP = { x: 10, y: DESK - 380, s: 1.15 };
  function jilPeek(t) {
    const k = L.ease(sm(PEEK, PEEK + .6, t)), F = RIG.FACES;
    let look = 1, eyeOpen = 1.1, face = Object.assign({}, F.neutral, { mouth: 'line' });
    if (t >= LOOK) { look = .9; eyeOpen = 1.1; face = Object.assign({}, F.neutral, { mouth: 'pout' }); }
    let nod = 4, earL = 0, earR = 0;
    if (t >= JIRO2) { const j = sm(JIRO2, JIRO2 + .3, t); look = 1; eyeOpen = 1; nod = 4 + 6 * j; earL = 18 * j; earR = -18 * j; face = Object.assign({}, F.annoyed, { sweat: .6 }); }   // 課長をじろり（あきれ顔）
    return Object.assign({}, RIG.POSES.sit, face, { x: JP.x, y: JP.y + 260 * (1 - k), scale: JP.s, flip: true, eyeLook: look, headNod: nod, eyeOpen, earL, earR });
  }
  const pomPeek = t => { const k = L.ease(sm(PEEK + .25, PEEK + .8, t)); return { x: 420, y: DESK + 30 + 150 * (1 - k), s: 1.15, q: t >= JIRO2 ? { eye: 'half', look: 1, squash: .06, wob: 4, blush: 0, mouth: 'w' } : { eye: t >= LOOK ? 'big' : 'round', look: 1, squash: 0, blush: .4 } }; };   // 17.4〜 課長をじろり（あきれ顔）
  const SFX = [{ t: .15, type: 'pop', pan: 0 }, { t: ALONE, type: 'blink', pan: 0 }, { t: ALONE + .4, type: 'tap', pan: -.4 }, { t: ALONE + .9, type: 'tap', pan: .4 },
    { t: SNIFF, type: 'sniff', pan: 0 }, { t: SNIFF + .35, type: 'sniff', pan: 0 }, { t: SMILE, type: 'twitch', pan: .2 }, { t: CHECK + .1, type: 'blink', pan: 0 }, { t: GONE, type: 'swish', pan: .4 },
    { t: DESK_T + .1, type: 'pop', pan: 0 }, { t: 6.6, type: 'tap', pan: .3 }, { t: 7.25, type: 'blink', pan: 0 }];
  for (const b of [B1, B2]) SFX.push({ t: b, type: 'saku', pan: -.2 }, { t: b + .42, type: 'saku', pan: -.2 });
  SFX.push({ t: B1 + 1.0, type: 'swish', pan: .3 }, { t: 10.0, type: 'blink', pan: 0 }, { t: PEEK + .1, type: 'pop', pan: -.5 }, { t: PEEK + .4, type: 'pop', pan: -.4 }, { t: FRONT, type: 'blink', pan: 0 }, { t: LOOK, type: 'blink', pan: -.4 }, { t: CUT + .02, type: 'pop', pan: 0 });
  const TELOP = k => k <= 0 ? '' : `<g transform="translate(520 330) scale(${L.outBack(Math.min(1, k * 1.6))})" opacity="${Math.min(1, k * 3)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle">
    <rect x="-440" y="-150" width="880" height="300" rx="48" fill="#3B2412" opacity=".22" transform="translate(6 10)"/><rect x="-440" y="-150" width="880" height="300" rx="48" fill="#3A2414" opacity=".92"/>
    <text y="-22" font-size="84" fill="#FFF7E8">課長もハマった？</text><text y="82" font-size="66" fill="#F2D3A8">フォローして最終話へ</text></g>`;
  const off = { x: 3000, y: 0, scale: 1 };
  window.EP = {
    dur: 24.0,
    bgm: { style: 'comedy', level: .5, dips: [[SNIFF - .2, SMILE + .5, .4], [B1 - .1, B1 + .8, .45], [B2 - .1, B2 + .8, .45], [LOOK - .3, 18.6, .25], [CUT, 23.0, .65]] },   // 鼻・かむ音の所で引き、最後は真顔の一拍で大きく引く
    qaAllow: { cuts: [ALONE, 2.2, 2.95, SNIFF - .5, CHECK, GONE, DESK_T, PEEK - .1, LOOK - .1, 17.4], still: [[CUT - .1, 24]], hidden_jil: [[0, PEEK + .5]], hidden_ren: [[GONE - .05, DESK_T + .05]] },   // 休憩室にはレンだけ（ジルは13.2秒にデスクの横から）・5.3〜6.0 はレンが去ったあとの箱だけ
    sfx: SFX.sort((a, b) => a.t - b.t),
    frame(t) {
      if (!window.L || !window.RIG || !window.TM) return;
      const tt = Math.min(t, CUT);
      const opt = { twitch: false, shadow: false, blink: t < CUT, breathe: t < CUT, ears: false };
      let bg, fx, cam;
      if (tt < DESK_T) {
        bg = BR.bg({ t: tt, min: 40 + tt / 12 });
        if (tt < GONE) L.char('ren', renRoom(tt), tt, '', opt); else L.char('ren', Object.assign({}, RIG.POSES.sit, off), tt, '', { shadow: false });
        L.char('jil', Object.assign({}, RIG.POSES.sit, off), tt, '', { shadow: false });
        fx = TM.table() + TM.box(TM.BOX.x, TM.BOX.y, { dish: tt < GONE ? .34 : 0, left: tt < GONE ? 0 : 2 });
        cam = L.camAt([
          { t: 0, z: 1.6, cx: 700, cy: 990 },                                    // 第1話の続き：きりっと箱を見下ろす
          { t: 0.01, z: 1.68, cx: 705, cy: 985, d: 1.5 },
          { t: ALONE, z: .9, cx: 520, cy: 960, d: .01 },                          // 引き：休憩室にはレンだけ（カット）。誰もいない部屋をしっかり
          { t: ALONE + .01, z: .9, cx: 470, cy: 960, d: .7 },                     // 左を見る → カメラも少し左（入口の札）
          { t: 2.25, z: .9, cx: 610, cy: 960, d: .6 },                            // 右を見る → 窓・棚
          { t: 3.0, z: .92, cx: 540, cy: 960, d: .5 },
          { t: SNIFF - .5, z: 2.1, cx: 480, cy: 990, d: .01 },                    // 鼻を近づける（カット）
          { t: CHECK, z: 1.9, cx: 500, cy: 970, d: .01 },                         // もう一度、目だけで周り
          { t: GONE, z: 2.3, cx: TM.BOX.x, cy: 1060, d: .01 },                    // 去ったあとの箱（1〜2本）
        ], tt);
      } else {
        bg = L.office({ sky: 'day', clock: [10, 30] });
        L.char('ren', renDesk(tt), tt, '', opt);
        if (tt >= PEEK) L.char('jil', jilPeek(tt), tt, '', opt); else L.char('jil', Object.assign({}, RIG.POSES.sit, off), tt, '', { shadow: false });
        fx = L.deskFront(DESK) + L.papers(PAPERS.x, PAPERS.y, 6) + TM.dish(DD.x, DD.y, deskDish(tt), .9, { left: tt >= PEEK ? 1 : 0 });
        if (tt >= PEEK) { const p = pomPeek(tt); fx = ELV.pom(p.x, p.y, p.s, p.q) + fx; }
        cam = L.camAt([
          { t: DESK_T, z: 1.6, cx: 600, cy: 1120 },                               // レンのデスク
          { t: DESK_T + .01, z: 1.7, cx: 600, cy: 1120, d: 1.6 },
          { t: PEEK - .1, z: 1.35, cx: 480, cy: 1120, d: .01 },                    // ジルとポムがのぞく（カット）
          { t: LOOK - .1, z: 2.4, cx: RD.x + 200, cy: 1000, d: .01 },             // レンの真顔と口の端の1本（カット）
          { t: 17.4, z: 1.35, cx: 480, cy: 1120, d: .01 },                         // ふたりの目がその1本へ
        ], tt);
      }
      const dim = t >= CUT ? `<rect x="0" y="0" width="1080" height="1920" fill="#1E140C" opacity="${(.42 * sm(CUT, CUT + .2, t)).toFixed(2)}"/>` : '';
      L.mount({ bg, fx, ui: t < 23.0 ? dim + TELOP(L.seg(t, CUT + .05, CUT + .5)) : dim, cam, t: tt });
      if (typeof endcard === 'function') endcard(t, EP.dur);
    }
  };
})();
var EP = window.EP;
