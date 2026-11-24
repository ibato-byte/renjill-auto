// 「社員からのお土産 Part 2」（約30秒・セリフなし・吹き出しとテロップは日本語＋英語）2026-11-21 オーナーの絵コンテ ＋ 2026-11-22・11-24 の直し
// 2026-11-24 オーナー：見た目・締め方・演出は「定時1分前のちょっといい？」にそろえる（rig/v2/neo_ui.js）・長さは毎回30秒前後・題名「社員からのお土産」
// 前回：ユズが箱のチモシーを3分の1まで食べたところを、モチ課長に見られた（最初の1.4秒：残り3分の1の箱を見下ろすモチ）
// 状況：お土産を「課長が預かる」ことになった
// オチ：預かったはずの課長がデスクでほぼ食べきり、口の端から1本出たまま真顔
// 0–1.4    きりっと箱を見下ろすモチ（題名「社員からのお土産 / A souvenir from the new hire」）
// 1.4–6.4  引き：誰もいない休憩室にモチだけ。首ごと左・右・左を確かめる。モワモワの吹き出し「誰も見ていないな / Nobody's watching...」（2026-11-24：3秒のばす）
// 6.4–8.4  鼻を近づける → 鼻ひくっ・耳ぴん・思わず笑顔 → もう一度、目だけで周り
// 8.5–11.5 お皿に移して部屋を去る（2026-11-24 追加）：箱の横に空の浅い皿 →（カット）皿に山盛り・箱には1〜2本 → 皿のふちを口でくわえて、右へぴょこぴょこ
// 11.5     去ったあとの箱（1〜2本）
// 12.3     課長室の引き。テロップ「課長室は安全 / The boss's office is safe.」（2026-11-24 追加）
// 14.3–    寄り：書類の横の浅い皿 → 目が皿へ → ひとくち → 書類へ → 一拍で目が皿へ → もうひとくち（同じ構図で皿の中身を減らす）
// 20.2–    ユズとクリがデスクの横から顔をのぞかせる。モチは真顔で正面。皿はほとんど空、口の端に1本。ふたりの目がその1本へ → 23.6〜 ふたりで課長をじろり（半目のあきれ顔）
// 26.3–30  締めの赤い札「つづく ▶ 課長もハマった？ / Follow for Part 3 ▶ Is the boss hooked too?」
// 前足：使わない。持ち出しは「皿が空 → 山盛り」のカットと、口で皿のふちをくわえて運ぶ所でつなぐ
// 次の話へ引きつぐ状態：休憩室の箱の皿は空に近い（1〜2本）→ 第3話は翌日で空っぽ
document.write('<script src="v2/lib.js"><\/script><script src="v2/elevator_set.js"><\/script><script src="v2/breakroom_set.js"><\/script><script src="v2/timothy_set.js"><\/script><script src="v2/neo_ui.js"><\/script>');
(function () {
  const sm = (a, b, t) => { const k = Math.max(0, Math.min(1, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  // デスクの場面は前の版（6〜20秒）を 14.3 秒からの約0.82倍の速さに縮めて置く（F で時刻を写す）
  const F_ = t => 14.3 + (t - 6.0) * .82;
  const ALONE = 1.4, THINK = [3.3, 6.4], SNIFF = 6.9, SMILE = 7.3, CHECK = 7.7, MOVE = 8.5, FILLED = 9.4, LEAVE = 10.1, GONE = 11.5, OFFICE = 12.3, DESK_T = 14.3,
    B1 = F_(8.0), B2 = F_(10.6), CUTD = [F_(9.3), F_(11.9)], PEEK = F_(13.2), FRONT = F_(13.8), LOOK = F_(15.0), JIRO2 = F_(17.4), END = 26.3, STORY = 30.0;
  const PLATE = { x: 690, y: 1150 + 2 };   // 箱の横に出す浅い皿（テーブルの上・クリの立つ所）
  const DESK = 1400, QX = -380, QY = -70;   // カットのあと、箱のま後ろから身をのり出す
  // デスクの皿の量（同じ構図のカットごとに減らす）
  const deskDish = t => t < DESK_T + .1 ? 1 : t < CUTD[0] ? 1 : t < CUTD[1] ? .62 : t < PEEK ? .3 : .06;
  const chew = (t, t0, d = 1.0) => t >= t0 && t < t0 + d ? (Math.sin((t - t0) * 2 * Math.PI * 4.2) > 0 ? 1 : 0) : -1;
  const DD = { x: 520, y: DESK - 6 };       // デスクの皿（モチの左前）
  const PAPERS = { x: 840, y: DESK + 4 };   // 書類（モチの右前）
  // ---- 休憩室のモチ（0–11.5）----
  const MOUTH = { dx: 234, dy: 336 };   // モチ（左向き・scale 1.3）の口の位置（x・y からのずれ。rig.js の鼻の位置から測った）
  function renRoom(t) {
    const R = TM.REN, F = RIG.FACES;
    let look = -.3, nod = 16, face = Object.assign({}, F.sharp, { mouth: 'line' }), eyeOpen = 1, earL = 0, earR = 0, nose = 0, lean = 0, x = R.x + QX, y = R.y;
    let flip = R.flip, tiltH = 0;
    if (t < SNIFF - .4) x = R.x;   // 見回す間は箱の右（顔が見える）→ 鼻を近づける所で箱のま後ろへ
    if (t >= ALONE && t < SNIFF - .4) {   // 誰もいないか、首ごと左 → 右 → 左を確かめる（引きの画で、しっかり）
      nod = 4; eyeOpen = .95; face = Object.assign({}, F.neutral, { mouth: 'line' });
      if (t < 2.6) { look = -1; tiltH = -7 * sm(ALONE, ALONE + .3, t); }                       // 左（入口の方）
      else if (t < 3.8) { flip = !R.flip; look = 1; tiltH = 7; }                               // 右（窓の方）…くるっと首を向ける
      else if (t < 4.8) { look = -1; tiltH = -5; }                                             // もう一度左
      else { look = lerp(-1, -.2, sm(4.8, 5.1, t)); face = Object.assign({}, F.neutral, { mouth: 'w', eyeShape: 'half' }); }   // …よし（モワモワ）
    }
    if (t >= SNIFF - .4 && t < MOVE) { lean = L.ease(sm(SNIFF - .4, SNIFF, t)) * (1 - L.ease(sm(CHECK, CHECK + .3, t)) * .4); look = -.5; face = Object.assign({}, F.neutral, { mouth: 'w' }); }
    if (t >= SNIFF && t < SMILE + .9) nose = Math.max(0, Math.sin((t - SNIFF) * 30));                                               // 鼻がひくっ
    if (t >= SMILE && t < MOVE) { const k = L.outBack(sm(SMILE, SMILE + .25, t)); earL = -12 * k; earR = 12 * k; face = Object.assign({}, F.smile, { blush: .8 }); }   // 耳ぴん・思わず笑顔
    if (t >= CHECK && t < MOVE) { const u = (t - CHECK) / .7; look = u < 1 ? Math.sin(u * Math.PI * 2) * -.9 : -.4; eyeOpen = .8; face = Object.assign({}, F.neutral, { mouth: 'w', eyeShape: 'half' }); earL = earR = 0; }   // もう一度、目だけで周り
    if (t >= MOVE) {   // 箱の右へ。空の皿 →（カット）山盛り → 皿をくわえて右へ
      x = R.x - 60; look = -.4; nod = 14; face = Object.assign({}, F.smile, { blush: .7, eyeShape: t >= FILLED ? 'happy' : 'round' });
      if (t >= LEAVE) { const k = (t - LEAVE) / (GONE - LEAVE); x = R.x - 60 + 640 * Math.pow(Math.min(1, k), 1.35); y = R.y - 26 * Math.abs(Math.sin(k * Math.PI * 4.5)); nod = 8; face = Object.assign({}, F.smile, { eyeShape: 'happy', blush: .9, mouth: 'line' }); }   // ゆっくり出ていく（画面の右はしを 11.4 秒ごろに出る）
    }
    return Object.assign({}, RIG.POSES.sit, face, { x: x - 40 * lean, y: y + QY * lean, scale: R.s, flip, headTilt: tiltH, eyeLook: look, headNod: nod + 12 * lean, earL, earR, eyeOpen, nose, bodyTilt: -6 * lean });
  }
  // ---- デスクのモチ（6–20）----
  const RD = { x: 420, y: DESK - 560, s: 1.35 };
  function renDesk(t) {
    const F = RIG.FACES;
    let look = .5, nod = 14, face = Object.assign({}, F.sharp, { mouth: 'line' }), eyeOpen = .9, lean = 0, mouth = null, strand = 0, earL = 0, earR = 0;
    // 書類（右）を見る ⇔ 皿（左）を見る
    if (t >= F_(7.2) && t < B1) { look = lerp(.5, -1, sm(F_(7.2), F_(7.45), t)); }                                    // 目が皿へ
    for (const b of [B1, B2]) { const k = L.ease(sm(b - .35, b, t)) * (1 - L.ease(sm(b + .8, b + 1.0, t))); lean = Math.max(lean, k); if (t >= b - .35 && t < b + 1.0) look = -.6; const c = chew(t, b); if (c >= 0) mouth = c ? 'w' : 'line'; }
    if (t >= B1 + 1.0 && t < F_(10.0)) { look = .5; }                                                           // すぐ書類へ
    if (t >= F_(10.0) && t < B2 - .35) { look = lerp(.5, -1, sm(F_(10.0), F_(10.2), t)); }                              // 一拍で、また皿へ
    if (t >= B2 + 1.0) { look = .5; mouth = mouth || 'w'; }
    if (t >= PEEK) { look = .5; }
    if (t >= FRONT) { const k = sm(FRONT, FRONT + .3, t); look = lerp(.5, 0, k); nod = lerp(14, 2, k); eyeOpen = 1; face = Object.assign({}, F.neutral, { mouth: 'line' }); strand = 1; }
    if (t < DESK_T) { look = .2; nod = 8; face = Object.assign({}, F.smile, { eyeShape: 'happy', blush: .6 }); }   // 課長室の引き：ほっとして皿を置いた所   // 何事もなかったように真顔で正面
    if (t >= B2 + .4) strand = 1;   // ふたくち目から、口の端に1本
    return Object.assign({}, RIG.POSES.sit, face, { x: RD.x - 70 * lean, y: RD.y + 40 * lean, scale: RD.s, flip: false, eyeLook: look, headNod: nod + 16 * lean, eyeOpen, earL, earR, strand, bodyTilt: -4 * lean }, mouth ? { mouth } : {});
  }
  // ---- のぞくユズ・クリ（デスクの左はし）----
  const JP = { x: 10, y: DESK - 380, s: 1.15 };
  function jilPeek(t) {
    const k = L.ease(sm(PEEK, PEEK + .6, t)), F = RIG.FACES;
    let look = 1, eyeOpen = 1.1, face = Object.assign({}, F.neutral, { mouth: 'line' });
    if (t >= LOOK) { look = .9; eyeOpen = 1.1; face = Object.assign({}, F.neutral, { mouth: 'pout' }); }
    let nod = 4, earL = 0, earR = 0;
    if (t >= JIRO2) { const j = sm(JIRO2, JIRO2 + .3, t); look = 1; eyeOpen = 1; nod = 4 + 6 * j; earL = 18 * j; earR = -18 * j; face = Object.assign({}, F.annoyed, { eyeShape: 'half', sweat: .6 }); }   // 課長をじろり（半目のあきれ顔）
    return Object.assign({}, RIG.POSES.sit, face, { x: JP.x, y: JP.y + 260 * (1 - k), scale: JP.s, flip: true, eyeLook: look, headNod: nod, eyeOpen, earL, earR });
  }
  const pomPeek = t => { const k = L.ease(sm(PEEK + .25, PEEK + .8, t)); return { x: 420, y: DESK + 30 + 150 * (1 - k), s: 1.15, q: t >= JIRO2 ? { eye: 'half', look: 1, squash: .06, wob: 4, blush: 0, mouth: 'w' } : { eye: t >= LOOK ? 'big' : 'round', look: 1, squash: 0, blush: .4 } }; };   // 17.4〜 課長をじろり（あきれ顔）
  const SFX = [{ t: .15, type: 'pop', pan: 0 }, { t: ALONE, type: 'blink', pan: 0 }, { t: ALONE + .3, type: 'tap', pan: -.4 }, { t: 2.65, type: 'swish', pan: .4 }, { t: 3.85, type: 'swish', pan: -.4 }, { t: THINK[0] + .05, type: 'pop', pan: 0 },
    { t: SNIFF, type: 'sniff', pan: 0 }, { t: SNIFF + .35, type: 'sniff', pan: 0 }, { t: SMILE, type: 'twitch', pan: .2 }, { t: CHECK + .1, type: 'blink', pan: 0 }, { t: MOVE + .05, type: 'koto', pan: .2 }, { t: FILLED, type: 'pop', pan: .2 }];
  for (let h = LEAVE + .1; h < GONE; h += .3) SFX.push({ t: h, type: 'tap', pan: .5 });
  SFX.push({ t: GONE, type: 'swish', pan: .6 }, { t: OFFICE + .1, type: 'pop', pan: 0 }, { t: DESK_T + .1, type: 'pop', pan: 0 }, { t: F_(6.6), type: 'tap', pan: .3 }, { t: F_(7.25), type: 'blink', pan: 0 });
  for (const b of [B1, B2]) SFX.push({ t: b, type: 'saku', pan: -.2 }, { t: b + .42, type: 'saku', pan: -.2 });
  SFX.push({ t: B1 + 1.0, type: 'swish', pan: .3 }, { t: F_(10.0), type: 'blink', pan: 0 }, { t: PEEK + .1, type: 'pop', pan: -.5 }, { t: PEEK + .4, type: 'pop', pan: -.4 }, { t: FRONT, type: 'blink', pan: 0 }, { t: LOOK, type: 'blink', pan: -.4 }, { t: JIRO2, type: 'blink', pan: -.4 }, { t: END, type: 'pop', pan: 0 });
  const off = { x: 3000, y: 0, scale: 1 };
  window.EP = {
    neoTitle: true,   // 題名は rig/v2/neo_ui.js の NEO.title で画面に描く（qa.js が確かめる）
    dur: 31.0,   // 30 秒（Instagram・TikTok）＋エンドカード 1 秒（YouTube 用）
    bgm: { style: 'comedy', level: .5, dips: [[THINK[0], THINK[1], .55], [SNIFF - .2, SMILE + .5, .4], [B1 - .1, B1 + .8, .45], [B2 - .1, B2 + .8, .45], [LOOK - .3, LOOK + 1.8, .25], [END, STORY, .7]] },   // 鼻・かむ音の所で引き、最後は真顔の一拍で大きく引く
    qaAllow: { cuts: [ALONE, 2.6, 3.8, SNIFF - .5, CHECK, MOVE, FILLED, LEAVE, GONE, OFFICE, DESK_T, PEEK - .1, LOOK - .1, JIRO2], still: [[JIRO2 + .3, 31]], hidden_jil: [[0, PEEK + .5]], hidden_ren: [[GONE - .3, OFFICE + .05]] },   // 休憩室にはモチだけ（ユズは13.2秒にデスクの横から）・5.3〜6.0 はモチが去ったあとの箱だけ
    sfx: SFX.sort((a, b) => a.t - b.t),
    frame(t) {
      if (!window.L || !window.RIG || !window.TM || !window.NEO) return;
      NEO.install();
      const tt = Math.min(t, STORY);
      const opt = { twitch: false, shadow: false, blink: true, breathe: true, ears: false };
      const CY = z => TM.T.top - (1430 - 960) / z;   // 休憩室：天板が画面の下の方（y 1430）
      let plate = '';
      let bg, fx, cam;
      if (tt < OFFICE) {
        bg = BR.bg({ t: tt, min: 40 + tt / 12 });
        const rp = tt < GONE ? renRoom(tt) : null;
        if (rp) L.char('ren', rp, tt, '', opt); else L.char('ren', Object.assign({}, RIG.POSES.sit, off), tt, '', { shadow: false });
        L.char('jil', Object.assign({}, RIG.POSES.sit, off), tt, '', { shadow: false });
        const moved = tt >= FILLED;
        fx = TM.table() + TM.box(TM.BOX.x, TM.BOX.y, { dish: moved ? 0 : .34, left: moved ? 2 : 0 });
        if (tt >= MOVE && tt < LEAVE) fx += TM.dish(PLATE.x, PLATE.y, moved ? 1 : 0, .8);          // 箱の横の浅い皿：空 →（カット）山盛り
        if (rp && tt >= LEAVE) { const s2 = rp.scale / 1.3; plate = TM.dish(rp.x + MOUTH.dx * s2 - 30, rp.y + rp.headNod * 1.2 + MOUTH.dy * s2 + 34, 1, .62); fx += plate; }   // 皿のふちを口でくわえて運ぶ
        cam = L.camAt([
          { t: 0, z: 1.6, cx: 700, cy: CY(1.6) },                                 // 第1話の続き：きりっと箱を見下ろす
          { t: 0.01, z: 1.68, cx: 705, cy: CY(1.68), d: 1.3 },
          { t: ALONE, z: 1.0, cx: 540, cy: 1000, d: .01 },                          // 引き：休憩室にはモチだけ（カット）。誰もいない部屋をしっかり
          { t: ALONE + .01, z: 1.0, cx: 500, cy: 1000, d: 1.0 },                    // 左を見る → カメラも少し左（入口の札）
          { t: 2.65, z: 1.0, cx: 580, cy: 1000, d: .9 },                            // 右を見る → 窓・棚
          { t: 3.85, z: 1.0, cx: 510, cy: 1000, d: .8 },                            // もう一度左
          { t: 4.8, z: 1.1, cx: 540, cy: 1000, d: 1.4 },                          // …よし（少し寄る）
          { t: SNIFF - .5, z: 2.1, cx: 480, cy: CY(2.1), d: .01 },                // 鼻を近づける（カット）
          { t: CHECK, z: 1.9, cx: 500, cy: CY(1.9), d: .01 },                     // もう一度、目だけで周り
          { t: MOVE, z: 1.5, cx: 640, cy: CY(1.5), d: .01 },                      // 箱の横に皿（カット）
          { t: LEAVE, z: 1.1, cx: 620, cy: CY(1.1), d: .01 },                     // 皿をくわえて右へ（引き）
          { t: GONE, z: 2.0, cx: TM.BOX.x, cy: CY(2.0) + 40, d: .01 },            // 去ったあとの箱（1〜2本）
        ], tt);
      } else {
        bg = L.office({ sky: 'day', clock: [10, 30] });
        L.char('ren', renDesk(Math.max(tt, OFFICE)), tt, '', opt);
        if (tt >= PEEK) L.char('jil', jilPeek(tt), tt, '', opt); else L.char('jil', Object.assign({}, RIG.POSES.sit, off), tt, '', { shadow: false });
        fx = L.deskFront(DESK) + L.papers(PAPERS.x, PAPERS.y, 6) + TM.dish(DD.x, DD.y, deskDish(tt), .9, { left: tt >= PEEK ? 1 : 0 });
        if (tt >= PEEK) { const p = pomPeek(tt); fx = ELV.pom(p.x, p.y, p.s, p.q) + fx; }
        cam = L.camAt([
          { t: OFFICE, z: .92, cx: 540, cy: 1000 },                               // 課長室の引き（テロップ「課長室は安全」）
          { t: OFFICE + .01, z: .97, cx: 540, cy: 1010, d: 2.0 },
          { t: DESK_T, z: 1.6, cx: 600, cy: 1120, d: .01 },                       // 寄り：モチのデスク（カット）
          { t: DESK_T + .01, z: 1.7, cx: 600, cy: 1120, d: 1.6 },
          { t: PEEK - .1, z: 1.35, cx: 480, cy: 1120, d: .01 },                    // ユズとクリがのぞく（カット）
          { t: LOOK - .1, z: 2.4, cx: RD.x + 200, cy: 1000, d: .01 },             // モチの真顔と口の端の1本（カット）
          { t: JIRO2, z: 1.35, cx: 480, cy: 1120, d: .01 },                        // ふたりで課長をじろり
        ], tt);
      }
      // ---- 画面の文字（定時1分前と同じデザイン。日本語＋英語）----
      let ui = NEO.brand() + NEO.title('社員からのお土産', 'A souvenir from the new hire', 1 - sm(1.5, 1.8, t), 'PART 2 / 3');
      ui += NEO.think(560, 600, '誰も見ていないな', "Nobody's watching...", L.seg(t, THINK[0], THINK[0] + .5) * (1 - L.seg(t, THINK[1] - .25, THINK[1])), { tx: 600, ty: 860 });
      ui += NEO.telop('課長室は安全', "The boss's office is safe.", L.seg(t, OFFICE + .15, OFFICE + .5) * (1 - L.seg(t, DESK_T - .25, DESK_T)));
      ui += NEO.ending('つづく ▶ 課長もハマった？', 'Follow for Part 3 ▶ Is the boss hooked too?', L.seg(t, END, END + .5));
      L.mount({ bg, fx, ui, cam, t: tt });
      if (typeof endcard === 'function') endcard(t, EP.dur);
    }
  };
})();
var EP = window.EP;
