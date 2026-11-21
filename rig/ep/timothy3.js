// 「ポムのお土産『金のチモシー』第3話（Part 3）業務用」（本編20秒＋締めテロップ3秒＋エンドカード1秒・セリフなし）2026-11-21 オーナーの絵コンテ
// 前回：レン課長が箱のチモシーを預かって、デスクでほぼ食べきった（最初の2秒：空っぽの皿をのぞくジルとポム）
// 状況：翌日、お土産の皿は空っぽ
// オチ：課長が「業務用」の大袋を買ってきて補充し、自分がまた食べる
// 0–6    翌日の休憩室。ジルとポムの前に、昨日と同じ「お土産」の箱。中の皿は空っぽ。ふたりで皿をのぞき込み、がっかりして顔を見合わせる
// 6–13   画面の右から、やけに大きな「ザクッ、ザクッ」。音に合わせて画面をほんの少し揺らし、ふたりが同時に右を向く（レンも大袋も画面に入れない）→ ふたりの反応を一拍
// 13–20  引きの画：レンと、テーブルの横に立てかけた巨大な金色の袋「金のチモシー 業務用」。箱の皿を同じ角度で 空っぽ → 山盛り（レンが補充した）。レンはふたりの視線に気づいてにっこり。
//        ジルとポムは一拍おいて、呆れた顔で目を合わせる。BGMを一瞬引き、レンが補充したばかりの皿に顔を近づけて、もうひとくち。「ザクッ」で本編を締める
// 20–23  締めテロップ「次のお話も、」「フォローして待っててね」
// 前足：使わない（テーブルの陰）。補充は「皿が空っぽ」→「山盛り」のカットでつなぐ
document.write('<script src="v2/lib.js"><\/script><script src="v2/elevator_set.js"><\/script><script src="v2/breakroom_set.js"><\/script><script src="v2/timothy_set.js"><\/script>');
(function () {
  const sm = (a, b, t) => { const k = Math.max(0, Math.min(1, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const PEER = 1.0, SAD = 2.9, EYES = 4.0, ZAKU = [6.4, 7.2, 9.9, 10.7], TURN = 6.6, WIDE = 13.0, DISH_E = 14.2, DISH_F = 14.9, NOTICE = 15.6, AKIRE = 16.9, LAST = 18.1, LASTZ = 19.4, CUT = 20.0;
  // （TM はこのあと読みこまれるので、位置は使う時に決める）
  const RW = () => ({ x: 600, y: 520 });   // 立って、ポムの後ろ          // 引きの画のレン（テーブルの右のはし・大袋の横）
  const RL = () => ({ x: 300, y: TM.REN.y - 70 });     // 最後のひとくち（箱のま後ろから身をのり出す）
  const BAG = () => ({ x: 960, y: TM.T.floor, s: 2.1, rot: -7 });   // 業務用の大袋（テーブルの右に立てかけ）
  const dishAt = t => t < DISH_F ? 0 : 1;
  const chew = (t, t0, d = .9) => t >= t0 && t < t0 + d ? (Math.sin((t - t0) * 2 * Math.PI * 4.2) > 0 ? 1 : 0) : -1;
  // ---- ジル ----
  function jilPose(t) {
    const J = TM.JIL, F = RIG.FACES;
    let face = F.neutral, look = .6, nod = 6, earL = 0, earR = 0, eyeOpen = 1, lean = 0, tilt = 0;
    lean = L.ease(sm(PEER, PEER + .5, t)) * (1 - L.ease(sm(SAD + .6, SAD + 1.0, t)));                        // 皿をのぞき込む
    if (t >= PEER) { look = .5; eyeOpen = 1; }
    if (t >= SAD) { const k = L.ease(sm(SAD, SAD + .5, t)); earL = 40 * k; earR = -40 * k; face = Object.assign({}, F.oops, { sweat: 0, mouth: 'wavy' }); eyeOpen = .8; }   // がっかり（耳が下がる）
    if (t >= EYES) look = 1;                                                                                    // ポムと顔を見合わせる
    if (t >= TURN) { const k = L.outBack(sm(TURN, TURN + .2, t)); look = 1; earL = lerp(40, -14, k); earR = lerp(-40, 14, k); eyeOpen = 1; face = Object.assign({}, F.neutral, { mouth: 'pout' }); nod = 0; tilt = 4 * k; }   // 右を向く（耳ぴん）   // 目の大きさはほかの場面とそろえる（eyeOpen 1。2026-11-22 オーナー：大きすぎ）
    if (t >= WIDE) { look = 1; eyeOpen = 1; face = Object.assign({}, F.neutral, { mouth: 'line' }); earL = -8; earR = 8; }
    if (t >= AKIRE) { const k = sm(AKIRE, AKIRE + .3, t); look = 1; eyeOpen = .65; face = Object.assign({}, F.annoyed, { sweat: .7 }); earL = 26 * k; earR = -26 * k; }     // 呆れた顔
    const back = L.ease(sm(LAST, LAST + .4, t));   // 最後：レンが割りこむので、ジルは少し身を引く
    return Object.assign({}, RIG.POSES.sit, face, { x: J.x + 150 * lean - 90 * back, y: J.y - 50 * lean, scale: J.s, flip: J.flip, eyeLook: look, headNod: nod + 10 * lean, earL, earR, eyeOpen, bodyTilt: tilt + 6 * lean });
  }
  // ---- ポム（テーブルの上、箱の右）----
  function pomAt(t) {
    const P = TM.POM;
    let x = P.x, y = P.y, q = { eye: 'round', look: -1, squash: 0, wob: 0, blush: .4 };
    const lean = L.ease(sm(PEER + .1, PEER + .6, t)) * (1 - L.ease(sm(SAD + .6, SAD + 1.0, t)));
    x -= 40 * lean; q.wob = -14 * lean;
    if (t >= SAD) { q.eye = 'round'; q.squash = .1; q.blush = .1; q.mouth = 'w'; }                         // しょんぼり
    if (t >= EYES) q.look = -1;                                                                           // ジルと顔を見合わせる
    if (t >= TURN) { const k = L.outBack(sm(TURN, TURN + .2, t)); q = { eye: 'big', look: 1, squash: -.08 * k, wob: 6 * k, blush: .2, mouth: 'o' }; }   // 同時に右を向く
    if (t >= WIDE) q = { eye: 'big', look: 1, squash: 0, wob: 0, blush: .2 };
    if (t >= AKIRE) q = { eye: 'round', look: -1, squash: .06, wob: -4, blush: 0, mouth: 'w' };          // ジルと目を合わせる（呆れ）
    return { x, y, s: P.s, q };
  }
  // ---- レン（13 秒から。大袋の横 → 最後は箱の皿へ）----
  function renPose(t) {
    const F = RIG.FACES;
    let x = RW().x, y = RW().y, look = 1, nod = 6, face = Object.assign({}, F.smile, { eyeShape: 'round', blush: .5 }), mouth = null, eyeOpen = 1, lean = 0, tilt = 0;
    const c = chew(t, WIDE, 1.2); if (c >= 0) mouth = c ? 'w' : 'line';                                    // 大袋のチモシーをザクザク
    if (t < NOTICE) { look = .2; face = Object.assign({}, F.neutral, { eyeShape: 'happy', blush: .6 }); }
    if (t >= NOTICE) { const k = sm(NOTICE, NOTICE + .3, t); look = lerp(.2, -1, k); face = Object.assign({}, F.smile, { blush: .8 }); }   // 視線に気づいて、にっこり
    if (t >= LAST) { x = RL().x; y = RL().y; lean = L.ease(sm(LAST + .1, LAST + .7, t)); look = -.6; face = Object.assign({}, F.smile, { eyeShape: 'happy', blush: .8 }); const c2 = chew(t, LASTZ, .6); if (c2 >= 0) mouth = c2 ? 'w' : 'line'; }
    return Object.assign({}, t >= LAST ? RIG.POSES.sit : RIG.POSES.stand, face, { x: x - 40 * lean, y: y + 20 * lean, scale: TM.REN.s, flip: false, eyeLook: look, headNod: nod + 14 * lean, eyeOpen, bodyTilt: tilt - 6 * lean }, mouth ? { mouth } : {});
  }
  const SFX = [{ t: .15, type: 'pop', pan: 0 }, { t: PEER + .1, type: 'swish', pan: -.2 }, { t: SAD, type: 'flop', pan: -.2 }, { t: EYES, type: 'blink', pan: 0 }];
  for (const z of ZAKU) SFX.push({ t: z, type: 'zaku', pan: .85 });
  SFX.push({ t: TURN + .02, type: 'twitch', pan: 0 }, { t: TURN + .05, type: 'whoosh', pan: .3 }, { t: WIDE, type: 'zaku', pan: .5 }, { t: WIDE + .5, type: 'zaku', pan: .5 },
    { t: DISH_E + .05, type: 'blink', pan: 0 }, { t: DISH_F, type: 'pop', pan: 0 }, { t: NOTICE + .1, type: 'chime', pan: .4 }, { t: AKIRE, type: 'blink', pan: -.2 }, { t: AKIRE + .4, type: 'flop', pan: -.2 },
    { t: LASTZ, type: 'zaku', pan: 0 }, { t: CUT + .02, type: 'pop', pan: 0 });
  // 締めテロップ：1文を読みやすく2行に（「、」で改行）
  const TELOP = k => k <= 0 ? '' : `<g transform="translate(520 330) scale(${L.outBack(Math.min(1, k * 1.6))})" opacity="${Math.min(1, k * 3)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle">
    <rect x="-440" y="-150" width="880" height="300" rx="48" fill="#3B2412" opacity=".22" transform="translate(6 10)"/><rect x="-440" y="-150" width="880" height="300" rx="48" fill="#3A2414" opacity=".92"/>
    <text y="-22" font-size="84" fill="#FFF7E8">次のお話も、</text><text y="82" font-size="70" fill="#F2D3A8">フォローして待っててね</text></g>`;
  const off = { x: 3000, y: 0, scale: 1 };
  window.EP = {
    dur: 24.0,
    bgm: { style: 'comedy', level: .5, dips: [[SAD - .1, EYES + .8, .45], [ZAKU[0] - .3, 12.9, .3], [LAST - .2, LASTZ + .5, .2], [CUT, 23.0, .65]] },   // ザクッの間・最後のひとくちの前に引く
    qaAllow: { cuts: [TURN, WIDE, DISH_E, DISH_F, NOTICE, LAST], still: [[CUT - .1, 24]], hidden_ren: [[0, WIDE + .05], [DISH_E - .05, NOTICE + .05]] },   // レンは 13 秒の引きの画まで画面に入れない（オーナーの絵コンテ）・皿の寄りの間も
    sfx: SFX.sort((a, b) => a.t - b.t),
    frame(t) {
      if (!window.L || !window.RIG || !window.TM) return;
      const tt = Math.min(t, CUT);
      const opt = { twitch: false, shadow: false, blink: t < CUT, breathe: t < CUT, ears: false };
      const bg = BR.bg({ t: tt, min: 5 + tt / 12 });
      if (tt >= WIDE) L.char('ren', renPose(tt), tt, '', opt); else L.char('ren', Object.assign({}, RIG.POSES.sit, off), tt, '', { shadow: false });
      L.char('jil', jilPose(tt), tt, '', opt);
      const p = pomAt(tt);
      let fx = TM.table() + TM.box(TM.BOX.x, TM.BOX.y, { dish: dishAt(tt) }) + ELV.pom(p.x, p.y, p.s, p.q);
      if (tt >= WIDE) { const B = BAG(); fx += TM.bag(B.x, B.y, B.s, { biz: 1, rot: B.rot, open: 1 }); }
      for (const z of ZAKU) if (tt >= z && tt < z + .3) fx += TM.crunch(770, 880, (tt - z) / .3, 1.2);   // 右の外から（画面のはし）
      if (tt >= LASTZ && tt < LASTZ + .35) fx += TM.crunch(TM.DISH_IN.x + 30, TM.DISH_IN.y - 90, (tt - LASTZ) / .35, 1.1);
      // 画面をほんの少し揺らす：カメラをゆっくり（6Hz）左右に。速くゆらすと1コマごとに絵が変わって「ちかちか」になる（2026-11-21 qa.py）
      let sx = 0, sy = 0; for (const z of ZAKU) if (tt >= z && tt < z + .4) { const u = (tt - z) / .4, a = 7 * (1 - u); sx = a * Math.sin(u * 2 * Math.PI * 2.4); sy = a * .5 * Math.sin(u * 2 * Math.PI * 2.4 + 1.3); }
      const cam = L.camAt([
        { t: 0, z: 1.7, cx: 470, cy: 990 },                                    // 翌日：ジルとポムと箱
        { t: 0.01, z: 1.78, cx: 480, cy: 995, d: 2.6 },
        { t: EYES, z: 1.7, cx: 490, cy: 990, d: .5 },                            // 顔を見合わせる
        { t: TURN, z: 1.72, cx: 495, cy: 985, d: .01 },                          // 右を向く（レンも大袋も入れない）
        { t: WIDE, z: .98, cx: 610, cy: 1080, d: .01 },                         // 引きの画（カット）：レンと業務用の大袋
        { t: DISH_E, z: 2.6, cx: TM.DISH_IN.x + 20, cy: 1040, d: .01 },          // 箱の皿（同じ角度）：空っぽ
        { t: NOTICE, z: .98, cx: 610, cy: 1080, d: .01 },                       // 引き：にっこり → 呆れ顔
        { t: LAST, z: 2.0, cx: TM.DISH_IN.x + 60, cy: 990, d: .01 },             // 補充したばかりの皿に、もうひとくち
      ], tt);
      cam.cx += sx; cam.cy += sy;
      const dim = t >= CUT ? `<rect x="0" y="0" width="1080" height="1920" fill="#1E140C" opacity="${(.42 * sm(CUT, CUT + .2, t)).toFixed(2)}"/>` : '';
      L.mount({ bg, fx, ui: t < 23.0 ? dim + TELOP(L.seg(t, CUT + .05, CUT + .5)) : dim, cam, t: tt });
      if (typeof endcard === 'function') endcard(t, EP.dur);
    }
  };
})();
var EP = window.EP;
