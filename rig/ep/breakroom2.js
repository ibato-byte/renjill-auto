// 「休憩室のこたつ 第2話（Part 2）先客は新人」（本編24秒＋締めテロップ3秒＋エンドカード1秒・セリフなし）2026-11-21 オーナーの絵コンテ
// 前回：布団の中で足に「コツン」→ 2人が足を引くと布団の真ん中がもぞっ → レンがそっと前足をのばした（最初の絵は第1話の最後と同じ）
// 状況：レンが布団のはしを持ち上げると、新人ポムがジルの後ろ足を抱えて眠っていた
// オチ：起こさずに足を抜きたいジルと、みかんで起こそうとするレン。みかんの房が鼻先へ → 鼻がひくっ（で切る）
// 0–5    レンが布団のはしをそっと持ち上げる。中にポム。ジルの後ろ足を小さな前足で抱えて、すやすや
// 5–11   ジルがゆっくり足を引く → ポムも抱えたまま座布団の上をずるずる → ジルはぴたりと止まる
// 11–17  レンが目を合わせ、小さくゆっくりうなずく → ジルがもう一度そっと → ポムが寝返り、足をぎゅっと抱き直す → ジルの耳がへにゃっ
// 17–24  ジルが助けを求めてレンを見る → レンの目が天板のみかんで止まる → むいてあるみかんを一房、前足でそっと支えてポムの鼻先へ → 鼻がひくっ → カット
// 24–27  締めテロップ「みかんで起きる？」「フォローして最終話へ」
// 次の話へ引きつぐ最後の状態：布団の右はし（BR.LIFT）はめくったまま・みかんの房はポムの鼻先（NOSE）・むいたみかんは 5 房
document.write('<script src="v2/lib.js"><\/script><script src="v2/elevator_set.js"><\/script><script src="v2/breakroom_set.js"><\/script>');
(function () {
  const sm = (a, b, t) => { const k = Math.max(0, Math.min(1, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const CUT = 24.0;
  const TIP0 = { x: 830, y: 1600 };                         // ジルの足先（はじめ）
  const footTip = t => { const a = L.ease(sm(5.4, 8.6, t)) * 70 + L.ease(sm(13.0, 13.5, t)) * 18; return { x: TIP0.x - a, y: TIP0.y }; };
  const POM_AT = t => { const f = footTip(t), roll = L.ease(sm(13.6, 14.4, t)); return { x: f.x + 30, y: f.y - 96, s: 1.2, rot: lerp(-22, 20, roll) + 2 * Math.sin(t * 1.6) }; };
  // ポムの鼻（ELV.pom の鼻＝足もとから上へ 114×大きさ。寝ている角度で回す）
  const NOSE = (t = 99) => { const p = POM_AT(t), r = p.rot * Math.PI / 180, d = 70 - 114 * p.s; return { x: p.x - d * Math.sin(r), y: p.y + d * Math.cos(r) }; };   // ポムの鼻先（第3話もここから）
  // ---- レン（第1話の最後：身をかがめて、布団のはしに前足）----
  function renPose(t) {
    const R = BR.REN, F = RIG.FACES;
    let face = F.neutral, look = -.3, nod = 26, eyeOpen = 1.2, x = R.x + 24, y = R.y + 104, tilt = -6, earL = 0, sq = 0;
    if (t >= 1.6 && t < 5) { eyeOpen = 1.3; face = Object.assign({}, F.neutral, { mouth: 'line' }); }                    // 中を見て、目を丸く
    if (t >= 5 && t < 11) { look = lerp(-.3, -1, sm(5.2, 5.5, t)); face = Object.assign({}, F.neutral, { mouth: 'line' }); }
    if (t >= 11 && t < 17) { look = -1; nod = 26 + 9 * (L.pulse(t, 11.6, 12.3) + L.pulse(t, 12.4, 13.1)); face = Object.assign({}, F.neutral, { mouth: 'w' }); eyeOpen = 1; }   // ゆっくりうなずく（そっとね）
    if (t >= 17 && t < 24) { look = lerp(-1, -.5, sm(18.2, 18.6, t)); nod = lerp(26, 16, sm(18.2, 18.6, t)); eyeOpen = 1.1; face = Object.assign({}, F.neutral, { mouth: 'line' });   // みかんで目が止まる
      const up = L.ease(sm(19.0, 19.6, t)) * (1 - L.ease(sm(20.6, 21.2, t))); y -= 60 * up; x -= 10 * up; }                 // みかんを取りに少し身を起こす
    if (t >= 21.6) { look = .2; nod = 28; eyeOpen = 1.15; }
    return Object.assign({}, RIG.POSES.sit, face, { x, y, scale: R.s, flip: R.flip, eyeLook: look, headNod: nod, bodyTilt: tilt, bodySquash: sq, earL, eyeOpen, blush: .2 });
  }
  function jilPose(t) {
    const J = BR.JIL, F = RIG.FACES;
    let face = Object.assign({}, F.neutral, { mouth: 'line' }), look = .5, nod = 18, eyeOpen = 1.2, earL = 0, earR = 0, sq = 0, x = J.x, htilt = 0;
    if (t >= 1.6 && t < 5) { eyeOpen = 1.3; }
    if (t >= 5 && t < 11) { face = Object.assign({}, F.neutral, { mouth: 'line' }); look = .4; sq = -.06 * sm(5.4, 6, t); x = J.x - 10 * sm(5.4, 8.6, t); if (t > 8.6) { eyeOpen = 1.32; sq = -.1; } }   // そっと引く → ぴたっ
    if (t >= 11 && t < 17) { look = 1; eyeOpen = 1.15; if (t > 13) { look = .5; x = J.x - 14; }
      if (t > 14.4) { const k = L.ease(sm(14.4, 14.9, t)); earL = 38 * k; earR = -38 * k; face = Object.assign({}, F.oops, { sweat: .6 }); eyeOpen = .9; } }   // へにゃっ
    if (t >= 17) { earL = 38; earR = -38; x = J.x - 14; face = Object.assign({}, F.oops, { sweat: .6, browAngle: 16 }); look = 1; eyeOpen = 1.1; htilt = 6;   // 助けて…
      if (t > 21.6) { look = .5; nod = 22; } }
    return Object.assign({}, RIG.POSES.sit, face, { x, y: J.y, scale: J.s, flip: J.flip, eyeLook: look, headNod: nod, headTilt: htilt, bodySquash: sq, earL, earR, eyeOpen, blush: .3 });
  }
  // ポム（布団の中）：寝返り・抱き直し・鼻
  function pomSvg(t) {
    const f = footTip(t), p = POM_AT(t), sq = .06 * Math.sin(t * 2.2) - .14 * L.pulse(t, 14.3, 14.8);   // 寝息・寝返り・ぎゅっ
    const q = { eye: 'happy', blush: .7, paws: 1 };
    let s = BR.foot(f.x, f.y) + BR.pomSleep(p.x, p.y, p.s, { rot: p.rot, q: Object.assign(q, { squash: sq }) });
    if (t > 1.4) s += zz(t, p.x - 90, p.y - 150);
    return s;
  }
  const zz = (t, x, y) => { let s = ''; for (let i = 0; i < 3; i++) { const u = ((t * .5) + i / 3) % 1; s += `<text x="${x - 20 * u}" y="${y - 60 * u}" font-size="${26 + 12 * i}" font-weight="900" fill="#FFF7E8" opacity="${(Math.min(1, u * 4, (1 - u) * 3) * .9).toFixed(2)}" font-family="Noto Sans, sans-serif">z</text>`; } return s; };
  const liftAt = t => L.ease(sm(0.6, 2.2, t)) * (1 + .03 * Math.sin(t * 2));
  const SFX = [{ t: 0.7, type: 'mozo', pan: .3 }, { t: 1.8, type: 'blink', pan: .2 }, { t: 2.2, type: 'blink', pan: -.2 },
    { t: 5.5, type: 'slide', pan: -.1 }, { t: 6.5, type: 'slide', pan: 0 }, { t: 7.6, type: 'slide', pan: .1 }, { t: 8.65, type: 'twitch', pan: -.3 },
    { t: 11.7, type: 'tap', pan: .3 }, { t: 12.5, type: 'tap', pan: .3 },
    { t: 13.05, type: 'slide', pan: 0 }, { t: 13.6, type: 'mozo', pan: .1 }, { t: 14.35, type: 'mozo', pan: .1 }, { t: 14.5, type: 'flop', pan: -.3 },
    { t: 17.3, type: 'blink', pan: -.2 }, { t: 18.3, type: 'blink', pan: .2 }, { t: 19.6, type: 'swish', pan: .1 }, { t: 21.0, type: 'swish', pan: .3 },
    { t: 23.55, type: 'sniff', pan: .1 }, { t: CUT + .02, type: 'pop', pan: 0 }];
  const TELOP = k => k <= 0 ? '' : `<g transform="translate(520 470) scale(${L.outBack(Math.min(1, k * 1.6))})" opacity="${Math.min(1, k * 3)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle">
    <rect x="-430" y="-150" width="860" height="300" rx="48" fill="#3B2412" opacity=".22" transform="translate(6 10)"/><rect x="-430" y="-150" width="860" height="300" rx="48" fill="#3A2414" opacity=".92"/>
    <text y="-22" font-size="88" fill="#FFF7E8">みかんで起きる？</text><text y="82" font-size="66" fill="#F2D3A8">フォローして最終話へ</text></g>`;
  window.EP = {
    dur: 28.0,
    bgm: { style: 'warm', bpm: 80, level: .5, mel: .35, shaker: .25, dips: [[5.4, 8.9, .45], [21.8, 24.0, .22], [CUT, 27, .7]] },   // ポムの寝顔に合うやわらかい曲。ずるずるは布の音が聞こえるように少し下げ、みかんが鼻先に近づいたら控える
    qaAllow: { still: [[CUT - .1, 28]] },
    sfx: SFX.sort((a, b) => a.t - b.t),
    nose: NOSE, pomAt: t => POM_AT(t), footTip: t => footTip(t),
    frame(t) {
      if (!window.L || !window.RIG || !window.BR) return;
      const tt = Math.min(t, CUT), P = BR.P;
      const bg = BR.bg({ t: tt, min: 4 + tt / 12 });
      L.char('ren', renPose(tt), tt, '', { twitch: false, shadow: false, blink: t < CUT && !(tt > 1.5 && tt < 4.5), breathe: t < CUT, ears: false });
      L.char('jil', jilPose(tt), tt, '', { twitch: false, shadow: false, blink: t < CUT, breathe: t < CUT, ears: false });
      const taken = tt >= 19.9 ? 1 : 0;
      const f = footTip(tt);
      let fx = BR.kotatsu({ props: { laptop: { open: 1, glow: .6 }, papers: { lift: 0 }, taken }, lift: liftAt(tt), inside: pomSvg(tt), bumps: tt > 5.4 && tt < 8.7 ? [{ x: 500 + (f.x - TIP0.x), k: .15 }] : [] });
      // 前足：布団のはし（めくる）・みかん
      const holdX = BR.LIFT.cx + 120, holdY = BR.K.floor - 40 - 230 * liftAt(tt);
      fx += BR.paw(996, 1420, holdX, holdY, { bend: 14, w: 30 });
      const nose = NOSE(tt);
      if (tt >= 21.0) { const k = L.ease(sm(21.0, 22.6, tt)); const sx = lerp(1000, nose.x + 34, k), sy = lerp(1340, nose.y + 2, k);   // 房を前足でそっと支えて鼻先へ
        fx += BR.paw(1000, 1330, sx + 22, sy + 6, { bend: 20, w: 26 }) + BR.segment(sx, sy, 1.3, -30); }
      let nosey = '';
      if (tt >= 23.4) { const a = L.pulse(tt, 23.45, 23.8); nosey = `<g transform="translate(${nose.x - 26} ${nose.y + 6})" opacity="${a.toFixed(2)}" stroke="#FFF7E8" stroke-width="5" stroke-linecap="round"><path d="M-10 -14 l-8 -6 M-12 0 h-10 M-10 14 l-8 6"/></g>`; }
      const cam = L.camAt([
        { t: 0, z: 1.26, cx: 600, cy: 1330 },                   // 第1話の最後（前足を布団のはしへ）
        { t: 0.01, z: 1.64, cx: 740, cy: 1410, d: 2.2 },        // めくる（中が見える）
        { t: 4.6, z: 1.3, cx: 600, cy: 1330, d: .7 },           // ジルの足とポム・2人の顔
        { t: 10.9, z: 1.3, cx: 540, cy: 1180, d: .6 },         // 2人の目くばせ
        { t: 13.3, z: 1.3, cx: 600, cy: 1330, d: .5 },          // 寝返り・へにゃっ
        { t: 16.9, z: 1.3, cx: 540, cy: 1180, d: .5 },         // 助けて／みかん
        { t: 20.8, z: 1.7, cx: 780, cy: 1420, d: 1.3 },         // 鼻先
      ], tt);
      const dim = t >= CUT ? `<rect x="0" y="0" width="1080" height="1920" fill="#1E140C" opacity="${(.42 * sm(CUT, CUT + .2, t)).toFixed(2)}"/>` : '';
      L.mount({ bg, fx: fx + nosey, ui: t < 27 ? dim + TELOP(L.seg(t, CUT + .05, CUT + .5)) : dim, cam, t: tt });
      const fxl = document.getElementById('fx');
      if (tt >= 19.0 && tt < 21.0) { const k = L.ease(sm(19.2, 19.8, tt)) * (1 - L.ease(sm(20.4, 21.0, tt))); const hx = lerp(P.papers.x - 20, P.peeled.x + 10, k), hy = P.peeled.y - 14;
        limb(fxl, 'ren', { x: hx, y: hy }, { max: 120, w: 30 }); if (tt > 19.9) fxl.insertAdjacentHTML('beforeend', BR.segment(hx - 14, hy - 4, 1.1, -20)); }   // 一房とる
      // ジルの前足：キーボードの上で止まったまま
      for (const dx of [-26, 30]) limb(fxl, 'jil', { x: P.laptop.x + 20 + dx, y: P.laptop.y + 4 }, { max: 110, w: 30 });
      if (typeof endcard === 'function') endcard(t, EP.dur);
    }
  };
})();
var EP = window.EP;
