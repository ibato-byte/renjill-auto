// 「社員からのお土産 Part 1」（約30秒・セリフなし・吹き出しとテロップは日本語＋英語）2026-11-21 オーナーの絵コンテ ＋ 2026-11-22・11-24 の直し
// 2026-11-24 オーナー：見た目・締め方・演出は「定時1分前のちょっといい？」にそろえる（rig/v2/neo_ui.js）・長さは毎回30秒前後・題名は「金のチモシー」から「社員からのお土産」へ
// 状況：新人クリが旅行のお土産「金のチモシー」を休憩室に持ってきた
// オチ：ユズが「ひとくちだけ」のつもりで3分の2を食べたところへ、課長モチが現れてジロッ
// 0–2.0   題名「社員からのお土産 / The new hire's gift」（表紙と同じ。2026-11-25 オーナー：サムネと動画の題名をそろえる）
// 0–4.6   クリがお土産の紙袋を口にくわえて、テーブルの上をとことこ登場（約5秒）。吹き出し「皆さんでどうぞ / Help yourselves, everyone!」
// 4.6     「コトッ」でカット → 同じカットに「お土産」の箱（中に金色の袋と、チモシー山盛りの浅い皿）と、胸を張るクリ（空の紙袋はたたんで横に）
// 6.4     ユズの鼻がひくひく
// 8.4–16  テロップ「食べ始めると止まらない / Once you start, you can't stop.」。ユズがひとくち・耳ぴん。同じ画角の短いカットで皿が 山盛り → 半分 → 約3分の1。「サクッ」
// 16–22   もうひとくち…の所で、画面の端にモチ課長。減った箱を見て、一拍、目だけでユズをジロッ。ユズは顔を上げ、耳がへにゃっ
// 22.4–   ふたりの目線。テロップ「バレると気まずい・・・ / Awkward if you get caught...」
// 26.3–30 締めの赤い札「つづく ▶ 残りはどうなる？ / Follow for Part 2 ▶ What about the rest?」（見本と同じ1行。絵は止めず、そのまま）
// 前足：モチとユズは前足を使わない（テーブルの陰）。食べるのは顔を皿に近づけて口元を小さく動かすだけ。セット・位置は rig/v2/timothy_set.js（3話共通）
// 次の話へ引きつぐ最後の状態：箱の皿は約3分の1・モチは箱の右奥（TM.REN）・ユズは耳を下げて顔を上げた所
document.write('<script src="v2/lib.js"><\/script><script src="v2/elevator_set.js"><\/script><script src="v2/breakroom_set.js"><\/script><script src="v2/timothy_set.js"><\/script><script src="v2/neo_ui.js"><\/script>');
(function () {
  const LX = 150, LY = -50, LN = 10;   // 顔を皿に近づける（箱の上へ身をのり出す）
  const sm = (a, b, t) => { const k = Math.max(0, Math.min(1, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const WALK = 3.0, SAY = [3.0, 6.3], KOTO = 4.6, NOSE = 6.4, EAT = 8.4, BITES = [9.0, 11.4, 13.8], CUTS = [11.1, 13.5], AGAIN = 16.2, REN_IN = 16.8, JIRO = 19.6, UP = 20.6, EYES = 22.4, END = 26.3, STORY = 30.0;
  const dishAt = t => t < CUTS[0] ? 1 : t < CUTS[1] ? .5 : .34;   // 皿の量（同じ画角のカットごとに変える）
  const chew = (t, t0, d = 1.1) => t >= t0 && t < t0 + d ? (Math.sin((t - t0) * 2 * Math.PI * 4.2) > 0 ? 1 : 0) : -1;   // 口元を小さく
  // 画面の座標（吹き出しをキャラの上に置く）。common.js の camera() と同じ寄せ方
  const W2S = (c, x, y) => { const hw = 540 / c.z, hh = 960 / c.z, cx = Math.max(hw - 40, Math.min(1120 - hw, c.cx)), cy = Math.max(hh - 40, Math.min(1960 - hh, c.cy)); return { x: (x - cx) * c.z + 540, y: (y - cy) * c.z + 960 }; };
  // ---- ユズ（左・右向き）----
  function jilPose(t) {
    const J = TM.JIL, F = RIG.FACES;
    let face = F.neutral, look = .4, nod = 6, earL = 0, earR = 0, x = J.x, y = J.y, eyeOpen = 1, nose = 0, mouth = null, tilt = 0;
    if (t < KOTO) look = 1;                                                                            // とことこ来るクリを見る
    if (t >= KOTO && t < EAT) { look = .5; nod = 12; if (t > NOSE) { nose = Math.max(0, Math.sin(t * 34)); eyeOpen = 1.05; } }   // 箱を見る → 鼻がひくひく
    let lean = 0;
    for (const b of BITES) lean = Math.max(lean, L.outBack(sm(b - .45, b - .05, t)) * (1 - sm(b + 1.1, b + 1.45, t)));   // 行きすぎて戻る（勢い）
    let anti = 0; for (const b of BITES) anti = Math.max(anti, sm(b - .75, b - .5, t) * (1 - sm(b - .5, b - .38, t)));   // かむ前に一瞬うしろへ引く（ため）2026-11-25
    let bob = 0; for (const b of BITES) if (t >= b && t < b + 1.1) bob = 3.5 * Math.sin((t - b) * 2 * Math.PI * 4.2);   // かむたびに頭が小さくはずむ
    if (t >= AGAIN) lean = Math.max(lean, sm(AGAIN, AGAIN + .5, t) * (1 - sm(UP, UP + .3, t)));
    if (t >= EAT && t < AGAIN) { look = .6; face = Object.assign({}, F.neutral, { eyeShape: t > BITES[0] + .2 ? 'happy' : 'round', blush: .6 }); }
    for (const b of BITES) { const c = chew(t, b); if (c >= 0) mouth = c ? 'w' : 'line'; }
    for (const b of BITES) if (t >= b + .25 && t < b + 1.3) { const k = L.outBack(sm(b + .25, b + .45, t)); earL = -14 * k; earR = 14 * k; }   // 耳がぴん
    if (t >= AGAIN && t < UP) { look = .6; face = Object.assign({}, F.neutral, { eyeShape: 'happy', blush: .5 }); }
    if (t >= UP) { const k = sm(UP, UP + .25, t); look = lerp(.6, 1, k); eyeOpen = 1.05; face = Object.assign({}, F.neutral, { mouth: 'line' }); }   // 顔を上げる → モチと目が合う
    if (t >= UP + .5) { const dk = L.ease(sm(UP + .5, UP + 1.1, t)); earL = 50 * dk; earR = -50 * dk; nod = 6 + 6 * dk; face = Object.assign({}, F.oops, { sweat: 0, mouth: 'wavy' }); eyeOpen = .9; }   // 汗は DECO の sweat で顔の横に（元の汗は画面の左はしに出て見えなかった）   // 耳がへにゃっ
    if (t >= EYES) { earL += 4 * Math.sin(t * 2.2); earR -= 4 * Math.sin(t * 2.2); }                 // 気まずさで耳がかすかにゆれる
    x += LX * lean - 26 * anti; y += LY * lean - 8 * anti; nod += LN * lean + bob - 5 * anti; tilt = 6 * lean - 3 * anti;
    return Object.assign({}, RIG.POSES.sit, face, { x, y, scale: J.s, flip: J.flip, eyeLook: look, headNod: nod, earL, earR, eyeOpen, nose, bodyTilt: tilt }, mouth ? { mouth } : {});
  }
  // ---- モチ（右・左向き。REN_IN に画面の右はしから）----
  function renPose(t) {
    const R = TM.REN, F = RIG.FACES;
    const k = L.ease(sm(REN_IN, REN_IN + .7, t));
    let x = lerp(R.x + 420, R.x, k), look = -.4, nod = 4, face = F.neutral, eyeOpen = 1, y = R.y + 8 * Math.abs(Math.sin(k * Math.PI * 2)) * (k < 1 ? 1 : 0);
    if (t >= REN_IN + .8) { look = -.3; nod = 16; face = Object.assign({}, F.sharp, { mouth: 'line' }); }    // 減った箱を見る
    if (t >= JIRO) { look = lerp(-.3, -1, sm(JIRO, JIRO + .25, t)); nod = 10; face = Object.assign({}, F.sharp, { eyeShape: 'half', mouth: 'line' }); eyeOpen = .7; }   // 目だけでジロッ
    return Object.assign({}, RIG.POSES.sit, face, { x, y, scale: R.s, flip: R.flip, eyeLook: look, headNod: nod, eyeOpen });
  }
  // ---- クリ（テーブルの上、箱の右）----
  function pomAt(t) {
    const P = TM.POM;
    if (t < KOTO) {   // 紙袋をくわえて右からとことこ（手は使わない）→ 止まって「皆さんでどうぞ」
      const k = sm(.2, WALK, t), x = lerp(P.x + 230, P.x, k), walking = t > .2 && t < WALK, ph = (t - .2) * 3.2;
      const hop = walking ? Math.abs(Math.sin(ph * Math.PI)) : 0;
      const say = t >= SAY[0] + .1 && t < SAY[0] + .9 ? Math.pow(Math.sin((t - SAY[0] - .1) * Math.PI * 2.5), 2) : 0;   // sin² でなめらかに（|sin| だと着地の1コマだけ絵が変わり、qa の「ちかちか」に掛かった）   // 「皆さんでどうぞ」で、ぴょこぴょこ2回（2026-11-25）
      return { x, y: P.y - 16 * hop - 14 * say, s: P.s, bag: { swing: walking ? 7 * Math.sin(ph * Math.PI) : 3 * Math.sin((t - WALK) * 9) * Math.exp(-(t - WALK) * 3) },
        q: { eye: t > WALK + .1 ? 'happy' : 'round', look: -.6, squash: walking ? .06 - .1 * hop : -.08 * sm(WALK, WALK + .3, t) + .05 * say, wob: walking ? 5 * Math.sin(ph * Math.PI) : 0, blush: .7 } };
    }
    if (t < NOSE) { const k = L.outBack(sm(KOTO + .05, KOTO + .4, t)); return { x: P.x, y: P.y, s: P.s, q: { eye: 'happy', squash: -.18 * k, wob: -4 * k, blush: .8 } }; }   // 箱の横で得意げに胸を張る
    if (t < UP) return { x: P.x, y: P.y, s: P.s, q: { eye: t > BITES[0] && t < AGAIN ? 'happy' : 'round', look: -1, squash: -.05, blush: .6 } };                        // ユズが食べるのを見る
    return { x: P.x, y: P.y, s: P.s, q: { eye: 'big', look: 1, squash: .04, blush: .3 } };                                                                              // モチを見る
  }
  // 題名は表紙（auto/schedule.json の thumb.hook）と同じ（tests/test_neo_cover.py が見張る）
  const TITLE = { ja: '社員からのお土産', en: "The new hire's gift", part: 'PART 1 / 3' };
  // 飾り（2026-11-25 ブラッシュアップ：見本と同じ、音の文字・「!」・ハート・星・時刻の札）。w:1 は世界の座標
  const JH = { x: 274, y: 830 }, RH = { x: 884, y: 800 };   // ユズ・モチの頭の上あたり
  const DECO = [
    { a: 2.0, b: 4.4, k: 'chip', x: 190, y: 640, txt: '15:00', en: 'Snack time' },
    { a: .5, b: 1.7, k: 'word', w: 1, x: 900, y: 880, txt: 'とことこ', size: 56 }, { a: 1.7, b: 2.9, k: 'word', w: 1, x: 860, y: 880, txt: 'とことこ', size: 56 },
    { a: KOTO + .02, b: KOTO + 1.0, k: 'word', w: 1, x: 440, y: 1250, txt: 'コトン', size: 72 }, { a: KOTO + .1, b: KOTO + 1.3, k: 'star', w: 1, x: 330, y: 900, r: 30 }, { a: KOTO + .25, b: KOTO + 1.5, k: 'star', w: 1, x: 600, y: 860, r: 22 },
    { a: NOSE + .1, b: EAT - .1, k: 'word', w: 1, x: 380, y: 900, txt: 'くんくん', size: 56 },
    ...BITES.flatMap((b, i) => [{ a: b, b: b + .85, k: 'word', w: 1, x: 470 + 50 * (i % 2), y: 860 - 20 * i, txt: 'サクッ', size: 70, rot: -8 + 10 * (i % 2) }, { a: b + .5, b: b + 1.7, k: 'heart', w: 1, x: JH.x + 150 + 30 * i, y: JH.y + 40 }]),
    { a: JIRO, b: JIRO + 1.0, k: 'word', w: 1, x: RH.x - 190, y: RH.y + 10, txt: 'ジロッ', size: 78, fill: '#7A62D8' },
    { a: UP + .05, b: UP + .95, k: 'mark', w: 1, x: JH.x + 120, y: JH.y - 10, txt: '!', size: 130 },
    { a: UP + .6, b: UP + 1.8, k: 'word', w: 1, x: JH.x + 170, y: JH.y + 60, txt: 'へにゃ…', size: 54, fill: '#7FA8D8', rot: 6 },
    { a: UP + .6, b: 31, k: 'sweat', w: 1, x: JH.x + 150, y: JH.y + 70 },
    { a: EYES + 1.6, b: END - .2, k: 'word', w: 1, x: 560, y: 760, txt: 'シーン…', size: 60, fill: '#8E9AAE', rot: 0 },
  ];
  const SFX = [{ t: .1, type: 'title', pan: 0 }, { t: .25, type: 'pop', pan: .3 }, { t: EAT + .12, type: 'telop', pan: 0 }, { t: EYES + .32, type: 'telop', pan: 0 }, { t: UP + .05, type: 'bikkuri', pan: -.3 }, { t: END + .12, type: 'kira', pan: 0 }, { t: KOTO + .12, type: 'kira', pan: .1 }];
  for (let w = .4; w < WALK; w += .32) SFX.push({ t: w, type: 'tap', pan: .35 });                       // とことこ
  SFX.push({ t: SAY[0] + .05, type: 'pop', pan: .2 }, { t: KOTO, type: 'koto', pan: 0 }, { t: NOSE + .1, type: 'sniff', pan: -.3 }, { t: NOSE + .9, type: 'sniff', pan: -.3 });
  for (const b of BITES) SFX.push({ t: b, type: 'saku', pan: -.1 }, { t: b + .45, type: 'saku', pan: -.1 }, { t: b + .3, type: 'twitch', pan: -.3 });
  SFX.push({ t: REN_IN + .1, type: 'swish', pan: .6 }, { t: JIRO + .05, type: 'blink', pan: .4 }, { t: UP, type: 'blink', pan: -.3 }, { t: UP + .55, type: 'flop', pan: -.3 }, { t: END, type: 'pop', pan: 0 });
  window.EP = {
    neoTitle: true,   // 題名は rig/v2/neo_ui.js の NEO.title で画面に描く（qa.js が確かめる）
    dur: 31.0,   // 30 秒（Instagram・TikTok）＋エンドカード 1 秒（YouTube 用）
    bgm: { style: 'neo', level: 2.6, warm: [[END, 31]], dips: [[KOTO - .25, KOTO + .3, .3], [BITES[0] - .1, BITES[0] + .7, .45], [BITES[1] - .1, BITES[1] + .7, .45], [BITES[2] - .1, BITES[2] + .7, .45], [JIRO - .7, EYES + .2, .3], [END, STORY, .7]] },   // 「コトッ」・かむ音・ジロッの間で引く
    qaAllow: { cuts: [KOTO, NOSE, EAT, JIRO - .2, UP - .1, EYES], still: [[EYES + .5, 31]], hidden_ren: [[0, REN_IN + .4]] },   // モチは REN_IN に画面の右はしから
    sfx: SFX.sort((a, b) => a.t - b.t),
    frame(t) {
      if (!window.L || !window.RIG || !window.TM || !window.NEO) return;
      NEO.install();
      const tt = Math.min(t, STORY);
      const bg = BR.bg({ t: tt, min: 30 + tt / 12 });
      const opt = { shadow: false, blink: true, breathe: true, ears: false };
      L.char('jil', jilPose(tt), tt, '', opt);
      if (tt >= REN_IN) L.char('ren', renPose(tt), tt, '', opt); else L.char('ren', Object.assign({}, RIG.POSES.sit, { x: 3000, y: 0, scale: 1 }), tt, '', { shadow: false });
      const p = pomAt(tt);
      const bq = tt >= KOTO && tt < KOTO + .45 ? .07 * Math.sin((tt - KOTO) / .45 * Math.PI * 2.5) * (1 - (tt - KOTO) / .45) : 0;   // 置いた箱が小さくはずむ（2026-11-25）
      let fx = TM.table() + (tt >= KOTO ? `<g transform="translate(${TM.BOX.x} ${TM.BOX.y}) scale(${(1 + bq).toFixed(3)} ${(1 - bq).toFixed(3)}) translate(${-TM.BOX.x} ${-TM.BOX.y})">` + TM.box(TM.BOX.x, TM.BOX.y, { dish: dishAt(tt) }) + '</g>' + TM.paperBag(TM.POM.x + 120, TM.T.top + 2, .9, { flat: 1 }) : '') + ELV.pom(p.x, p.y, p.s, p.q);
      if (p.bag) fx += TM.paperBag(p.x, p.y - 112 * p.s, 1.0, { swing: p.bag.swing });   // 口にくわえた紙袋（持ち手が口元）
      for (const b of BITES) if (tt >= b && tt < b + .35) fx += TM.crunch(TM.DISH_IN.x - 10, TM.DISH_IN.y - 70, (tt - b) / .35, .8);
      BITES.forEach((b, i) => { fx += TM.bits(TM.DISH_IN.x - 20, TM.DISH_IN.y - 60, (tt - b) / .7, i) + TM.bits(TM.DISH_IN.x - 10, TM.DISH_IN.y - 60, (tt - b - .45) / .6, i + 4, 4); });   // かけらが飛ぶ
      if (tt >= KOTO + .1 && tt < NOSE) fx += L.sparkles(p.x, p.y - 120, tt, .9, 5);   // 得意げのきらきら
      const CY = z => TM.T.top - (1430 - 960) / z;   // テーブルの天板が画面の下の方（y 1430）に来る高さ（定時1分前と同じく、キャラを画面の下半分に大きく）
      const cam = L.camAt([
        { t: 0, z: 1.28, cx: 570, cy: CY(1.28) },                                    // 紙袋をくわえたクリが右から登場（ユズも画面に）
        { t: 0.01, z: 1.32, cx: 575, cy: CY(1.32), d: 2.8 },
        { t: KOTO, z: 1.75, cx: 600, cy: CY(1.75), d: .01 },                         // コトッ → 箱と、胸を張るクリ（同じカット）
        { t: KOTO + .01, z: 1.8, cx: 602, cy: CY(1.8), d: 1.6 },
        { t: NOSE, z: 2.1, cx: 300, cy: CY(2.1), d: .01 },                           // ユズの鼻がひくひく（カット）
        { t: EAT, z: 1.9, cx: 420, cy: CY(1.9), d: .01 },                           // 食べる（ここから同じ画角）
        { t: REN_IN - .3, z: 1.15, cx: 590, cy: CY(1.15), d: .5 },                    // 画面の端にモチ
        { t: JIRO - .2, z: 1.9, cx: 820, cy: CY(1.9), d: .01 },                      // モチ：目だけでジロッ（カット）
        { t: JIRO, z: 2.12, cx: 800, cy: CY(2.12), d: .22 },                         // ジロッに合わせて、ぐっと寄る（2026-11-25）
        { t: UP - .1, z: 1.9, cx: 360, cy: CY(1.9), d: .01 },                        // ユズ：顔を上げる・耳へにゃっ（カット）
        { t: UP + .5, z: 2.0, cx: 350, cy: CY(2.0), d: 1.0 },                        // へにゃっに合わせて、ゆっくり寄る
        { t: EYES, z: 1.12, cx: 590, cy: CY(1.12), d: .01 },                           // ふたりの目線（カット）
        { t: EYES + .01, z: 1.16, cx: 590, cy: CY(1.16), d: 7.5 },                    // ゆっくり寄る
      ], tt);
      // ---- 画面の文字（定時1分前と同じデザイン。日本語＋英語）----
      let ui = NEO.grade() + NEO.deco(t, cam, DECO) + NEO.brand() + NEO.title(TITLE.ja, TITLE.en, 1 - sm(1.75, 2.0, t), TITLE.part);
      if (t >= SAY[0] && t < SAY[1]) { const h = W2S(cam, p.x, p.y - 220 * p.s); ui += NEO.say(Math.min(800, Math.max(330, h.x - 120)), h.y - 170, '皆さんでどうぞ', 'Help yourselves, everyone!', L.seg(t, SAY[0], SAY[0] + .4) * (1 - L.seg(t, SAY[1] - .2, SAY[1])), { tx: h.x - 30, ty: h.y - 20 }); }
      ui += NEO.telop('食べ始めると止まらない', "Once you start, you can't stop.", L.seg(t, EAT + .1, EAT + .5) * (1 - L.seg(t, EAT + 2.9, EAT + 3.2)));
      ui += NEO.telop('バレると気まずい・・・', 'Awkward if you get caught...', L.seg(t, EYES + .3, EYES + .7) * (1 - L.seg(t, END - .3, END)));
      ui += NEO.ending('つづく ▶ 残りはどうなる？', 'Follow for Part 2 ▶ What about the rest?', L.seg(t, END, END + .5), t);
      L.mount({ bg, fx, ui, cam, t: tt });
      if (typeof endcard === 'function') endcard(t, EP.dur);
    }
  };
})();
var EP = window.EP;
