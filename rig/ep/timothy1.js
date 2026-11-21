// 「ポムのお土産『金のチモシー』第1話（Part 1）ひとくちだけ」（本編20秒＋締めテロップ3秒＋エンドカード1秒・セリフなし）2026-11-21 オーナーの絵コンテ
// 状況：新人ポムが旅行のお土産「金のチモシー」を休憩室に持ってきた
// オチ：ジルが「ひとくちだけ」のつもりで3分の2を食べたところへ、課長レンが現れてジロッ
// 0–5    休憩室。旅行のお土産を買ってきたポムが、テーブルのそばで得意げに胸を張る →「コトッ」でカット → テーブルの「お土産」の箱（中に金色の袋と、チモシー山盛りの浅い皿）→ ジルの鼻がひくひく
// 5–12   ジルが皿に顔を近づけてひとくち。耳がぴん。同じ画角の短いカットで、皿の中身が 山盛り → 半分 → 約3分の1。カットに合わせて小さな「サクッ」
// 12–20  もうひとくち…の所で、画面の端にレン課長。減った箱を見て、一拍、目だけでジルをジロッ。ジルは顔を上げ、耳がへにゃっ。最後の一拍はふたりの目線
// 20–23  締めテロップ「最後のお土産、どうなる？」「フォローして第2話へ」
// 前足：レンとジルは前足を使わない（テーブルの陰）。食べるのは顔を皿に近づけて口元を小さく動かすだけ。セット・位置は rig/v2/timothy_set.js（3話共通）
// 次の話へ引きつぐ最後の状態：箱の皿は約3分の1・レンは箱の右奥に立つ（TM.REN）・ジルは耳を下げて顔を上げた所
document.write('<script src="v2/lib.js"><\/script><script src="v2/elevator_set.js"><\/script><script src="v2/breakroom_set.js"><\/script><script src="v2/timothy_set.js"><\/script>');
(function () {
  const LX = 150, LY = -50, LN = 10;   // 顔を皿に近づける（箱の上へ身をのり出す）
  const sm = (a, b, t) => { const k = Math.max(0, Math.min(1, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const KOTO = 2.2, BITES = [5.6, 7.7, 9.8], CUTS = [7.4, 9.5], AGAIN = 12.0, REN_IN = 12.5, JIRO = 15.0, UP = 15.9, CUT = 20.0;
  // 皿の量（同じ画角のカットごとに変える）
  const dishAt = t => t < CUTS[0] ? 1 : t < CUTS[1] ? .5 : .34;
  // かむ動き（口元を小さく）：t0 から d 秒
  const chew = (t, t0, d = 1.1) => t >= t0 && t < t0 + d ? (Math.sin((t - t0) * 2 * Math.PI * 4.2) > 0 ? 1 : 0) : -1;
  // ---- ジル（左・右向き）----
  function jilPose(t) {
    const J = TM.JIL, F = RIG.FACES;
    let face = F.neutral, look = .4, nod = 6, earL = 0, earR = 0, x = J.x, y = J.y, eyeOpen = 1, nose = 0, mouth = null, sq = 0, tilt = 0;
    if (t < KOTO) { look = 1; }                                                                        // 胸を張るポムを見る
    if (t >= KOTO && t < 5.0) { look = .5; nod = 12; if (t > 3.0) { nose = Math.max(0, Math.sin(t * 34)); eyeOpen = 1.1; } }   // 箱を見る → 鼻がひくひく
    // 食べる：顔を皿に近づける（x・y・うなずき）→ かむ → 少し戻す
    let lean = 0;
    for (const b of BITES) lean = Math.max(lean, sm(b - .45, b - .05, t) * (1 - sm(b + 1.1, b + 1.45, t)));
    if (t >= AGAIN) lean = Math.max(lean, sm(AGAIN, AGAIN + .5, t) * (1 - sm(UP, UP + .3, t)));
    if (t >= 5.0 && t < AGAIN) { look = .6; face = F.neutral; }
    for (const b of BITES) { const c = chew(t, b); if (c >= 0) mouth = c ? 'w' : 'line'; }
    for (const b of BITES) if (t >= b + .25 && t < b + 1.3) { const k = L.outBack(sm(b + .25, b + .45, t)); earL = -14 * k; earR = 14 * k; eyeOpen = 1.15; }   // 耳がぴん
    if (t >= 5.0 && t < AGAIN) face = Object.assign({}, F.neutral, { eyeShape: t > BITES[0] + .2 ? 'happy' : 'round', blush: .6 });
    if (t >= AGAIN && t < UP) { look = .6; face = Object.assign({}, F.neutral, { eyeShape: 'happy', blush: .5 }); }
    if (t >= UP) { const k = sm(UP, UP + .25, t); look = lerp(.6, 1, k); eyeOpen = 1.2; face = Object.assign({}, F.neutral, { mouth: 'line' }); }   // 顔を上げる → レンと目が合う
    if (t >= UP + .5) { const dk = L.ease(sm(UP + .5, UP + 1.1, t)); earL = 50 * dk; earR = -50 * dk; nod = 6 + 6 * sm(UP + .5, UP + 1.1, t); face = Object.assign({}, F.oops, { sweat: .8, mouth: 'wavy' }); eyeOpen = .9; }   // 耳がへにゃっ
    x += LX * lean; y += LY * lean; nod += LN * lean; tilt = 6 * lean;
    return Object.assign({}, RIG.POSES.sit, face, { x, y, scale: J.s, flip: J.flip, eyeLook: look, headNod: nod, bodySquash: sq, earL, earR, eyeOpen, nose, bodyTilt: tilt }, mouth ? { mouth } : {});
  }
  // ---- レン（右・左向き。12.5 に画面の右はしから）----
  function renPose(t) {
    const R = TM.REN, F = RIG.FACES;
    const k = L.ease(sm(REN_IN, REN_IN + .7, t));
    let x = lerp(R.x + 420, R.x, k), look = -.4, nod = 4, face = F.neutral, eyeOpen = 1, earL = 0, earR = 0, y = R.y + 8 * Math.abs(Math.sin(k * Math.PI * 2)) * (k < 1 ? 1 : 0);
    if (t >= REN_IN + .8) { look = -.3; nod = 16; face = Object.assign({}, F.sharp, { mouth: 'line' }); }    // 減った箱を見る
    if (t >= JIRO) { look = lerp(-.3, -1, sm(JIRO, JIRO + .25, t)); nod = 10; face = Object.assign({}, F.sharp, { eyeShape: 'half', mouth: 'line' }); eyeOpen = .7; }   // 目だけでジロッ
    return Object.assign({}, RIG.POSES.sit, face, { x, y, scale: R.s, flip: R.flip, eyeLook: look, headNod: nod, earL, earR, eyeOpen });
  }
  // ---- ポム（テーブルの上、箱の右）----
  function pomAt(t) {
    const P = TM.POM;
    if (t < KOTO) { const k = L.outBack(sm(.15, .7, t)); return { x: P.x, y: P.y, s: P.s, q: { eye: 'happy', squash: -.16 * k, wob: -4 * k, blush: .8 } }; }   // 得意げに胸を張る
    if (t < UP) return { x: P.x, y: P.y, s: P.s, q: { eye: t > 5.6 && t < AGAIN ? 'happy' : 'round', look: -1, squash: -.05, blush: .6 } };                           // ジルが食べるのを見る
    return { x: P.x, y: P.y, s: P.s, q: { eye: 'big', look: 1, squash: .04, blush: .3 } };                                                                              // レンを見る
  }
  const SFX = [{ t: .2, type: 'pop', pan: .3 }, { t: KOTO, type: 'koto', pan: 0 }, { t: 3.1, type: 'sniff', pan: -.3 }, { t: 3.9, type: 'sniff', pan: -.3 }];
  for (const b of BITES) SFX.push({ t: b, type: 'saku', pan: -.1 }, { t: b + .45, type: 'saku', pan: -.1 }, { t: b + .3, type: 'twitch', pan: -.3 });
  SFX.push({ t: REN_IN + .1, type: 'swish', pan: .6 }, { t: JIRO + .05, type: 'blink', pan: .4 }, { t: UP, type: 'blink', pan: -.3 }, { t: UP + .55, type: 'flop', pan: -.3 }, { t: CUT + .02, type: 'pop', pan: 0 });
  // 締めテロップ（2行・下のはしと右のはしを避ける。3話とも同じデザイン）
  const TELOP = k => k <= 0 ? '' : `<g transform="translate(520 330) scale(${L.outBack(Math.min(1, k * 1.6))})" opacity="${Math.min(1, k * 3)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle">
    <rect x="-440" y="-150" width="880" height="300" rx="48" fill="#3B2412" opacity=".22" transform="translate(6 10)"/><rect x="-440" y="-150" width="880" height="300" rx="48" fill="#3A2414" opacity=".92"/>
    <text y="-22" font-size="80" fill="#FFF7E8">最後のお土産、どうなる？</text><text y="82" font-size="66" fill="#F2D3A8">フォローして第2話へ</text></g>`;
  window.EP = {
    dur: 24.0,   // 本編 20 秒＋締めテロップ 3 秒（＝Instagram 用 23 秒）＋エンドカード 1 秒（YouTube 用）
    bgm: { style: 'comedy', level: .5, dips: [[KOTO - .25, KOTO + .3, .3], [BITES[0] - .1, BITES[0] + .7, .45], [BITES[1] - .1, BITES[1] + .7, .45], [BITES[2] - .1, BITES[2] + .7, .45], [14.3, 17.2, .3], [CUT, 23.0, .65]] },   // 「コトッ」・かむ音・ジロッの間で引く
    qaAllow: { cuts: [KOTO, 3.0, 5.0, JIRO - .2, UP - .1, 17.6], still: [[CUT - .1, 24]], hidden_ren: [[0, REN_IN + .4]] },   // レンは 12.5 秒に画面の右はしから   // わざと：20秒でカットして、その絵のまま締めテロップ（オーナーの絵コンテ）
    sfx: SFX.sort((a, b) => a.t - b.t),
    frame(t) {
      if (!window.L || !window.RIG || !window.TM) return;
      const tt = Math.min(t, CUT);
      const bg = BR.bg({ t: tt, min: 30 + tt / 12 });
      L.char('jil', jilPose(tt), tt, '', { twitch: false, shadow: false, blink: t < CUT, breathe: t < CUT, ears: false });
      if (tt >= REN_IN) L.char('ren', renPose(tt), tt, '', { twitch: false, shadow: false, blink: t < CUT, breathe: t < CUT, ears: false }); else L.char('ren', Object.assign({}, RIG.POSES.sit, { x: 3000, y: 0, scale: 1 }), tt, '', { shadow: false });
      const p = pomAt(tt);
      let fx = TM.table() + (tt >= KOTO ? TM.box(TM.BOX.x, TM.BOX.y, { dish: dishAt(tt) }) : '') + ELV.pom(p.x, p.y, p.s, p.q);
      for (const b of BITES) if (tt >= b && tt < b + .35) fx += TM.crunch(TM.DISH_IN.x - 10, TM.DISH_IN.y - 70, (tt - b) / .35, .8);
      if (tt >= .3 && tt < KOTO) fx += L.sparkles(p.x, p.y - 120, tt, .9, 5);   // 得意げのきらきら
      const cam = L.camAt([
        { t: 0, z: 2.2, cx: 700, cy: 1010 },                                    // ポム（得意げに胸を張る）
        { t: 0.01, z: 2.3, cx: 710, cy: 1000, d: 2.1 },
        { t: KOTO, z: 2.4, cx: TM.BOX.x, cy: 1060, d: .01 },                     // コトッ → 箱（カット）
        { t: KOTO + .01, z: 2.3, cx: TM.BOX.x + 10, cy: 1050, d: .8 },
        { t: 3.0, z: 2.1, cx: 300, cy: 990, d: .01 },                            // ジルの鼻がひくひく（カット）
        { t: 5.0, z: 1.9, cx: 420, cy: 1000, d: .01 },                           // 食べる（ここから同じ画角）
        { t: REN_IN - .3, z: 1.3, cx: 560, cy: 1000, d: .5 },                    // 画面の端にレン
        { t: JIRO - .2, z: 1.9, cx: 820, cy: 930, d: .01 },                      // レン：目だけでジロッ（カット）
        { t: UP - .1, z: 1.9, cx: 360, cy: 960, d: .01 },                        // ジル：顔を上げる・耳へにゃっ（カット）
        { t: 17.6, z: 1.3, cx: 560, cy: 990, d: .01 },                           // ふたりの目線（カット）
      ], tt);
      const dim = t >= CUT ? `<rect x="0" y="0" width="1080" height="1920" fill="#1E140C" opacity="${(.42 * sm(CUT, CUT + .2, t)).toFixed(2)}"/>` : '';
      L.mount({ bg, fx, ui: t < 23.0 ? dim + TELOP(L.seg(t, CUT + .05, CUT + .5)) : dim, cam, t: tt });
      if (typeof endcard === 'function') endcard(t, EP.dur);
    }
  };
})();
var EP = window.EP;
