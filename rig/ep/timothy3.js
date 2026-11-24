// 「社員からのお土産 Part 3」（約30秒・セリフなし・テロップは日本語＋英語）2026-11-21 オーナーの絵コンテ ＋ 2026-11-22・11-24 の直し
// 2026-11-24 オーナー：見た目・締め方・演出は「定時1分前のちょっといい？」にそろえる（rig/v2/neo_ui.js）・長さは毎回30秒前後・題名「社員からのお土産」
// 前回：モチ課長が箱のチモシーを預かって、デスクでほぼ食べきった（最初の2秒：空っぽの皿をのぞくユズとクリ）
// 状況：翌日、お土産の皿は空っぽ
// オチ：課長が「業務用」の大袋を買ってきて補充し、自分がまた食べる
// 0–1.8   題名「社員からのお土産 / A souvenir from the new hire」
// 0–8     翌日の休憩室。ユズとクリの前に、昨日と同じ「お土産」の箱。中の皿は空っぽ。ふたりで皿をのぞき込む。
//         2〜4秒 テロップ「あっという間になくなる / Gone in no time.」（2026-11-24：2秒たす）→ がっかりして顔を見合わせる
// 8–15    画面の右から、やけに大きな「ドスッ、ドスッ」（2026-11-24：低い音に）。音に合わせて画面をほんの少し揺らし、ふたりが同時に右を向く（モチも大袋も画面に入れない）
// 15–26   引きの画：モチと、テーブルの横に立てかけた巨大な金色の袋「金のチモシー 業務用」。箱の皿を同じ角度で 空っぽ → 山盛り（モチが補充した）。
//         モチはふたりの視線に気づいてにっこり。ユズとクリは一拍おいて、呆れた顔で目を合わせる。BGMを一瞬引き、モチが補充したばかりの皿にもうひとくち「ザクッ」
// 26.3–30 締めの赤い札「フォローで次の話も ▶ / Follow for the next story!」
// 前足：使わない（テーブルの陰）。補充は「皿が空っぽ」→「山盛り」のカットでつなぐ
document.write('<script src="v2/lib.js"><\/script><script src="v2/elevator_set.js"><\/script><script src="v2/breakroom_set.js"><\/script><script src="v2/timothy_set.js"><\/script><script src="v2/neo_ui.js"><\/script>');
(function () {
  const sm = (a, b, t) => { const k = Math.max(0, Math.min(1, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const PEER = 1.0, GONE_T = [2.0, 4.6], SAD = 4.9, EYES = 6.0, ZAKU = [8.4, 9.2, 11.9, 12.7], TURN = 8.6, WIDE = 15.0, DISH_E = 16.4, DISH_F = 17.2, NOTICE = 18.2, AKIRE = 19.8, LAST = 21.4, LASTZ = 22.9, END = 26.3, STORY = 30.0;
  // （TM はこのあと読みこまれるので、位置は使う時に決める）
  const RW = () => ({ x: 600, y: 520 });   // 立って、クリの後ろ          // 引きの画のモチ（テーブルの右のはし・大袋の横）
  const RL = () => ({ x: 300, y: TM.REN.y - 70 });     // 最後のひとくち（箱のま後ろから身をのり出す）
  const BAG = () => ({ x: 960, y: TM.T.floor, s: 2.1, rot: -7 });   // 業務用の大袋（テーブルの右に立てかけ）
  const dishAt = t => t < DISH_F ? 0 : 1;
  const chew = (t, t0, d = .9) => t >= t0 && t < t0 + d ? (Math.sin((t - t0) * 2 * Math.PI * 4.2) > 0 ? 1 : 0) : -1;
  // ---- ユズ ----
  function jilPose(t) {
    const J = TM.JIL, F = RIG.FACES;
    let face = F.neutral, look = .6, nod = 6, earL = 0, earR = 0, eyeOpen = 1, lean = 0, tilt = 0;
    lean = L.ease(sm(PEER, PEER + .5, t)) * (1 - L.ease(sm(SAD + .6, SAD + 1.0, t)));                        // 皿をのぞき込む
    if (t >= PEER) { look = .5; eyeOpen = 1; }
    if (t >= SAD) { const k = L.ease(sm(SAD, SAD + .5, t)); earL = 40 * k; earR = -40 * k; face = Object.assign({}, F.oops, { sweat: 0, mouth: 'wavy' }); eyeOpen = .8; }   // がっかり（耳が下がる）
    if (t >= EYES) look = 1;                                                                                    // クリと顔を見合わせる
    if (t >= TURN) { const k = L.outBack(sm(TURN, TURN + .2, t)); look = 1; earL = lerp(40, -14, k); earR = lerp(-40, 14, k); eyeOpen = 1; face = Object.assign({}, F.neutral, { mouth: 'pout' }); nod = 0; tilt = 4 * k; }   // 右を向く（耳ぴん）   // 目の大きさはほかの場面とそろえる（eyeOpen 1。2026-11-22 オーナー：大きすぎ）
    if (t >= WIDE) { look = 1; eyeOpen = 1; face = Object.assign({}, F.neutral, { mouth: 'line' }); earL = -8; earR = 8; }
    if (t >= AKIRE) { const k = sm(AKIRE, AKIRE + .3, t); look = 1; eyeOpen = .65; face = Object.assign({}, F.annoyed, { sweat: .7 }); earL = 26 * k; earR = -26 * k; }     // 呆れた顔
    const back = L.ease(sm(LAST, LAST + .4, t));   // 最後：モチが割りこむので、ユズは少し身を引く
    return Object.assign({}, RIG.POSES.sit, face, { x: J.x + 150 * lean - 90 * back, y: J.y - 50 * lean, scale: J.s, flip: J.flip, eyeLook: look, headNod: nod + 10 * lean, earL, earR, eyeOpen, bodyTilt: tilt + 6 * lean });
  }
  // ---- クリ（テーブルの上、箱の右）----
  function pomAt(t) {
    const P = TM.POM;
    let x = P.x, y = P.y, q = { eye: 'round', look: -1, squash: 0, wob: 0, blush: .4 };
    const lean = L.ease(sm(PEER + .1, PEER + .6, t)) * (1 - L.ease(sm(SAD + .6, SAD + 1.0, t)));
    x -= 40 * lean; q.wob = -14 * lean;
    if (t >= SAD) { q.eye = 'round'; q.squash = .1; q.blush = .1; q.mouth = 'w'; }                         // しょんぼり
    if (t >= EYES) q.look = -1;                                                                           // ユズと顔を見合わせる
    if (t >= TURN) { const k = L.outBack(sm(TURN, TURN + .2, t)); q = { eye: 'big', look: 1, squash: -.08 * k, wob: 6 * k, blush: .2, mouth: 'o' }; }   // 同時に右を向く
    if (t >= WIDE) q = { eye: 'big', look: 1, squash: 0, wob: 0, blush: .2 };
    if (t >= AKIRE) q = { eye: 'round', look: -1, squash: .06, wob: -4, blush: 0, mouth: 'w' };          // ユズと目を合わせる（呆れ）
    return { x, y, s: P.s, q };
  }
  // ---- モチ（13 秒から。大袋の横 → 最後は箱の皿へ）----
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
  for (const z of ZAKU) SFX.push({ t: z, type: 'dosu', pan: .85 });   // 低い「ドスッ」（2026-11-24 オーナー）
  SFX.push({ t: TURN + .02, type: 'twitch', pan: 0 }, { t: TURN + .05, type: 'whoosh', pan: .3 }, { t: WIDE, type: 'dosu', pan: .5 }, { t: WIDE + .5, type: 'dosu', pan: .5 },
    { t: DISH_E + .05, type: 'blink', pan: 0 }, { t: DISH_F, type: 'pop', pan: 0 }, { t: NOTICE + .1, type: 'chime', pan: .4 }, { t: AKIRE, type: 'blink', pan: -.2 }, { t: AKIRE + .4, type: 'flop', pan: -.2 },
    { t: LASTZ, type: 'zaku', pan: 0 }, { t: END, type: 'pop', pan: 0 });
  // 締めテロップ：1文を読みやすく2行に（「、」で改行）
  const off = { x: 3000, y: 0, scale: 1 };
  window.EP = {
    neoTitle: true,   // 題名は rig/v2/neo_ui.js の NEO.title で画面に描く（qa.js が確かめる）
    dur: 31.0,   // 30 秒（Instagram・TikTok）＋エンドカード 1 秒（YouTube 用）
    bgm: { style: 'comedy', level: .5, dips: [[GONE_T[0], EYES + .8, .45], [ZAKU[0] - .3, ZAKU[3] + .5, .3], [LAST - .2, LASTZ + .5, .2], [END, STORY, .7]] },   // ザクッの間・最後のひとくちの前に引く
    qaAllow: { cuts: [TURN, WIDE, DISH_E, DISH_F, NOTICE, LAST], still: [[LASTZ + .6, 31]], hidden_ren: [[0, WIDE + .05], [DISH_E - .05, NOTICE + .05]] },   // モチは 13 秒の引きの画まで画面に入れない（オーナーの絵コンテ）・皿の寄りの間も
    sfx: SFX.sort((a, b) => a.t - b.t),
    frame(t) {
      if (!window.L || !window.RIG || !window.TM || !window.NEO) return;
      NEO.install();
      const tt = Math.min(t, STORY);
      const opt = { twitch: false, shadow: false, blink: true, breathe: true, ears: false };
      const CY = z => TM.T.top - (1430 - 960) / z;   // 天板が画面の下の方（y 1430）
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
        { t: 0, z: 1.55, cx: 450, cy: CY(1.55) },                                    // 翌日：ユズとクリと箱
        { t: 0.01, z: 1.6, cx: 455, cy: CY(1.6), d: 3.6 },
        { t: EYES, z: 1.55, cx: 460, cy: CY(1.55), d: .5 },                            // 顔を見合わせる
        { t: TURN, z: 1.58, cx: 465, cy: CY(1.58), d: .01 },                          // 右を向く（モチも大袋も入れない）
        { t: WIDE, z: .98, cx: 610, cy: 1080, d: .01 },                         // 引きの画（カット）：モチと業務用の大袋
        { t: DISH_E, z: 2.6, cx: TM.DISH_IN.x + 20, cy: CY(2.6) + 40, d: .01 },          // 箱の皿（同じ角度）：空っぽ
        { t: NOTICE, z: .98, cx: 610, cy: 1080, d: .01 },                       // 引き：にっこり → 呆れ顔
        { t: LAST, z: 2.0, cx: TM.DISH_IN.x + 60, cy: CY(2.0), d: .01 },             // 補充したばかりの皿に、もうひとくち
        { t: LASTZ + 1.0, z: 1.35, cx: 480, cy: CY(1.35), d: 1.6 },                // 少し引いて、呆れ顔のふたりも（締めの札の間）
      ], tt);
      cam.cx += sx; cam.cy += sy;
      // ---- 画面の文字（定時1分前と同じデザイン。日本語＋英語）----
      let ui = NEO.brand() + NEO.title('社員からのお土産', 'A souvenir from the new hire', 1 - sm(1.5, 1.8, t), 'PART 3 / 3');
      ui += NEO.telop('あっという間になくなる', 'Gone in no time.', L.seg(t, GONE_T[0], GONE_T[0] + .4) * (1 - L.seg(t, GONE_T[1] - .3, GONE_T[1])));
      ui += NEO.ending('フォローで次の話も ▶', 'Follow for the next story!', L.seg(t, END, END + .5));
      L.mount({ bg, fx, ui, cam, t: tt });
      if (typeof endcard === 'function') endcard(t, EP.dur);
    }
  };
})();
var EP = window.EP;
