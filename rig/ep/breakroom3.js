// 「休憩室のこたつ 第3話（Part 3・最終話）課長の席」（本編24秒＋締めテロップ3秒＋エンドカード1秒・セリフなし）2026-11-21 オーナーの絵コンテ
// 前回：布団の中で、新人ポムがジルの後ろ足を抱えて眠っていた。レンがみかんの房を鼻先へ → 鼻がひくっ（最初の絵は第2話の最後と同じ）
// 状況：みかんでポムを布団から出し、ジルの足を助ける。レンは仕事に戻る
// オチ：ポムはみかんを抱えたまま、レンの膝で二度寝。ハンコを構えたまま固まるレン、笑いをこらえるジル
// 0–5    みかんの香りに、ポムの鼻がひくひく。目を閉じたまま、小さな前足をのばす
// 5–11   レンがみかんを少しずつ手前に引く → ポムが追って布団から出てくる → そのすきにジルが足を引き抜く → ほっとしてレンに小さくうなずき、耳がふわっと起きる
// 11–17  レンはみかんをポムに渡して仕事に戻る。書類を前足でまっすぐそろえ、今度こそとハンコを構える
// 17–24  ポムはみかんを抱えたまま、布団のはしからするっとレンの膝へ → 丸くなって二度寝 → レンはハンコを浮かせたまま固まる。ジルはノートPCの画面の陰に顔をふせ、肩と耳が小刻みにゆれる（一拍）
// 24–27  締めテロップ「次のお話も、フォローして待っててね」
// 前の話の最後の状態：rig/ep/breakroom2.js（布団の右はしはめくったまま・房は鼻先・ポムはジルの足を抱いて寝ている）。位置はそこから計算して合わせる
document.write('<script src="v2/lib.js"><\/script><script src="v2/elevator_set.js"><\/script><script src="v2/breakroom_set.js"><\/script>');
(function () {
  const sm = (a, b, t) => { const k = Math.max(0, Math.min(1, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const CUT = 24.0;
  // 第2話の最後と同じ値（breakroom2.js の footTip・POM_AT・NOSE を 24 秒で計算したもの）
  const F2 = { foot: { x: 742, y: 1600 }, pom: { x: 772, y: 1504, s: 1.2, rot: 20 + 2 * Math.sin(24 * 1.6) } };
  const nose2 = (() => { const p = F2.pom, r = p.rot * Math.PI / 180, d = 70 - 114 * p.s; return { x: p.x - d * Math.sin(r), y: p.y + d * Math.cos(r) }; })();
  const OUT = { x: 868, y: 1736 };    // 布団から出たポムの位置（床・布団の前の右）
  const LAP = { x: 862, y: 1262 };    // レンの膝（布団の右はしの上）
  // 房の位置（レンの前足でそっと支える）
  function segAt(t) {
    if (t < 5.2) return { x: nose2.x + 34, y: nose2.y + 2 };
    if (t < 9.6) { const k = L.ease(sm(5.2, 9.6, t)); return { x: lerp(nose2.x + 34, OUT.x + 52, k), y: lerp(nose2.y + 2, OUT.y - 150, k) }; }   // 少しずつ手前へ
    return { x: OUT.x + 52, y: OUT.y - 150 };
  }
  // ポム
  function pomAt(t) {
    const P = F2.pom;
    if (t < 5.6) return { mode: 'in', x: P.x, y: P.y, s: P.s, rot: P.rot + 2 * Math.sin(t * 1.6) };
    if (t < 7.2) { const k = L.ease(sm(5.6, 7.2, t)); return { mode: 'in', x: lerp(P.x, 880, k), y: lerp(P.y, 1630, k), s: lerp(P.s, 1.3, k), rot: lerp(P.rot, 0, k) }; }   // 起き上がって、はい出る
    if (t < 9.8) { const k = sm(7.2, 9.8, t); return { mode: 'out', x: lerp(880, OUT.x, k), y: lerp(1640, OUT.y, k) - 10 * Math.abs(Math.sin(k * Math.PI * 4)), s: 1.3, rot: 0 }; }   // ちょこちょこ追う
    if (t < 17.0) return { mode: 'out', x: OUT.x, y: OUT.y, s: 1.3, rot: 0 };
    if (t < 17.9) { const k = sm(17.0, 17.9, t); return { mode: "out", x: lerp(OUT.x, 940, k), y: lerp(OUT.y, 1600, k), s: 1.3, rot: 0 }; }   // 布団のはしへ
    if (t < 18.6) { const k = sm(17.9, 18.6, t); return { mode: "under", x: 940, y: lerp(1600, 1520, k), s: 1.3, rot: 0, hide: k }; }        // するっ（布団の下へ）
    const k = L.outBack(sm(18.7, 19.2, t));
    return { mode: 'lap', x: LAP.x, y: LAP.y + 40 * (1 - k), s: 1.05, rot: lerp(-6, -14, sm(19.4, 20.4, t)) };                                 // 膝の上で丸くなる
  }
  function pomSvg(t) {
    const p = pomAt(t);
    const q = { eye: 'happy', blush: .7, paws: 1, squash: 0 };
    if (p.mode === 'out' && t >= 9.8 && t < 17) { q.eye = t > 12 && t < 16 ? 'round' : 'happy'; q.blush = .9; }   // みかんをもらう
    if (p.mode === 'lap') { q.squash = -.12 * L.pulse(t, 19.0, 19.4) + .05 * Math.sin(t * 2.2); q.eye = 'happy'; }
    if (p.mode === 'in') return BR.pomSleep(p.x, p.y, p.s, { rot: p.rot, q });
    if (p.mode === 'under') return '';
    if (p.mode === 'lap') return BR.pomSleep(p.x, p.y, p.s, { rot: p.rot, q });
    return ELV.pom(p.x, p.y, p.s, q);
  }
  // 布団のめくれ：11.5 まではめくったまま（第2話の最後）→ 下ろす
  const liftAt = t => t < 11.4 ? 1 : 1 - L.ease(sm(11.4, 12.1, t));
  const footX = t => lerp(F2.foot.x, 240, L.ease(sm(7.6, 8.6, t)));
  function renPose(t) {
    const R = BR.REN, F = RIG.FACES;
    let face = Object.assign({}, F.neutral, { mouth: 'line' }), look = .2, nod = 28, eyeOpen = 1.15, x = R.x + BR.CROUCH.dx, y = R.y + BR.CROUCH.dy, tilt = BR.CROUCH.tilt;
    if (t < 5.2) { look = .2; }
    if (t >= 5.2 && t < 11) { look = .4; eyeOpen = 1.05; face = Object.assign({}, F.neutral, { mouth: 'w' }); if (t > 9) { look = lerp(.4, -1, sm(9.0, 9.3, t)); } }   // 少しずつ引く → ジルのうなずきを受ける
    if (t >= 11 && t < 12.9) { const k = L.ease(sm(11.8, 12.8, t)); x = R.x + BR.CROUCH.dx * (1 - k); y = R.y + BR.CROUCH.dy * (1 - k); tilt = BR.CROUCH.tilt * (1 - k); nod = lerp(28, 12, k); look = .1; face = F.neutral; }   // 仕事に戻る
    if (t >= 12.9 && t < 19.2) { x = R.x; y = R.y; tilt = 0; nod = 12; look = -.1; face = Object.assign({}, F.sharp); eyeOpen = .9; }   // 今度こそ
    if (t >= 19.2) { x = R.x; y = R.y; tilt = 0; const k = sm(19.2, 19.5, t); nod = lerp(12, 22, k); look = lerp(-.1, .5, k); face = Object.assign({}, F.neutral, { mouth: 'line' }); eyeOpen = 1.22; }   // 膝を見て、固まる
    return Object.assign({}, RIG.POSES.sit, face, { x, y, scale: R.s, flip: R.flip, eyeLook: look, headNod: nod, bodyTilt: tilt, eyeOpen, blush: t > 19.2 ? .5 : .2 });
  }
  function jilPose(t) {
    const J = BR.JIL, F = RIG.FACES;
    let face = Object.assign({}, F.oops, { sweat: .5, browAngle: 16 }), look = .6, nod = 22, eyeOpen = 1.05, earL = 38, earR = -38, x = J.x - 14, y = J.y, sq = 0;
    if (t >= 7.6 && t < 8.6) { x = J.x - 14 - 16 * L.pulse(t, 7.6, 8.6); sq = -.1 * L.pulse(t, 7.6, 8.6); }   // 足を引き抜く
    if (t >= 8.6) { face = Object.assign({}, F.smile); x = J.x; const k = L.outBack(sm(9.2, 9.8, t)); earL = 38 * (1 - k); earR = -38 * (1 - k); look = 1; nod = 10 + 10 * L.pulse(t, 8.8, 9.4); }   // ほっ → うなずく → 耳がふわっと
    if (t >= 11 && t < 19.4) { face = Object.assign({}, F.neutral); look = .8; nod = 10; earL = 0; earR = 0; }
    if (t >= 19.4) { const k = L.ease(sm(19.6, 20.2, t)); face = Object.assign({}, F.smile); x = J.x + 40 * k; y = J.y + 120 * k; nod = 10 + 26 * k; look = .3;   // 画面の陰に顔をふせる
      const sh = t > 20.2 ? Math.sin(t * 34) : 0; sq = .05 * sh; earL = 9 * sh; earR = -9 * sh; }               // 笑いをこらえて、肩と耳が小刻みに
    return Object.assign({}, RIG.POSES.sit, face, { x, y, scale: J.s, flip: J.flip, eyeLook: look, headNod: nod, bodySquash: sq, earL, earR, eyeOpen, blush: .45 });
  }
  const SFX = [{ t: 0.5, type: 'sniff', pan: .1 }, { t: 1.4, type: 'sniff', pan: .1 }, { t: 2.3, type: 'sniff', pan: .1 }, { t: 3.2, type: 'swish', pan: .1 },
    { t: 5.6, type: 'mozo', pan: .2 }, { t: 6.4, type: 'slide', pan: .2 }, { t: 7.3, type: 'tap', pan: .3 }, { t: 7.8, type: 'tap', pan: .35 }, { t: 8.3, type: 'tap', pan: .4 },
    { t: 7.6, type: 'slide', pan: -.3 }, { t: 9.25, type: 'pon', pan: -.3 },
    { t: 11.1, type: 'swish', pan: .3 }, { t: 11.5, type: 'mozo', pan: .3 }, { t: 12.0, type: 'pop', pan: .2 },
    { t: 13.3, type: 'tap', pan: .35 }, { t: 13.9, type: 'tap', pan: .35 }, { t: 14.5, type: 'tap', pan: .35 }, { t: 15.2, type: 'swish', pan: .35 },
    { t: 17.9, type: 'mozo', pan: .4 }, { t: 18.8, type: 'pop', pan: .3 }, { t: 19.25, type: 'blink', pan: .3 }, { t: 20.3, type: 'twitch', pan: -.35 },
    { t: CUT + .02, type: 'pop', pan: 0 }];
  const TELOP = k => k <= 0 ? '' : `<g transform="translate(520 330) scale(${L.outBack(Math.min(1, k * 1.6))})" opacity="${Math.min(1, k * 3)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle">
    <rect x="-430" y="-150" width="860" height="300" rx="48" fill="#3B2412" opacity=".22" transform="translate(6 10)"/><rect x="-430" y="-150" width="860" height="300" rx="48" fill="#3A2414" opacity=".92"/>
    <text y="-22" font-size="80" fill="#FFF7E8">次のお話も、</text><text y="82" font-size="80" fill="#F2D3A8">フォローして待っててね</text></g>`;
  window.EP = {
    dur: 28.0,
    bgm: { style: 'warm', bpm: 88, level: .5, mel: .45, shaker: .4, lift: [[7.0, 1.25]], dips: [[18.7, 21.2, .3], [CUT, 27, .7]] },   // ポムが布団から出たら少し軽やかに。膝で丸くなる瞬間に引く
    qaAllow: { still: [[CUT - .1, 28]], hidden_jil: [[19.6, 28]] },   // わざと：ジルは画面の陰に顔をふせる（オーナーの絵コンテ）
    sfx: SFX.sort((a, b) => a.t - b.t),
    frame(t) {
      if (!window.L || !window.RIG || !window.BR) return;
      const tt = Math.min(t, CUT), P = BR.P;
      const bg = BR.bg({ t: tt, min: 6 + tt / 12 });
      L.char('ren', renPose(tt), tt, '', { twitch: false, shadow: false, blink: t < CUT && tt < 19.2, breathe: t < CUT, ears: false });
      L.char('jil', jilPose(tt), tt, '', { twitch: false, shadow: false, blink: t < CUT, breathe: t < CUT, ears: false });
      const p = pomAt(tt), lift = liftAt(tt);
      const inside = (tt < 8.6 ? BR.foot(footX(tt), F2.foot.y) : '') + (p.mode === 'in' ? pomSvg(tt) : '');
      const hanko = tt >= 15.0 ? { held: true } : null;
      let fx = BR.kotatsu({ props: { laptop: { open: 1, glow: .6 }, papers: { lift: 0, mess: 0 }, taken: 1, hankoHeld: !!hanko }, lift, inside, bumps: tt > 17.9 && tt < 18.8 ? [{ x: 900, k: .5 * L.pulse(tt, 17.9, 18.8) }] : [] });
      if (p.mode === 'out' || p.mode === 'lap') fx += pomSvg(tt);
      // みかんの房：レンの前足で（11.8 まで）→ ポムが抱える
      const sg = segAt(tt);
      if (tt < 11.8) { fx += BR.segment(tt < 11.0 ? sg.x : lerp(sg.x, OUT.x, sm(11.0, 11.6, tt)), tt < 11.0 ? sg.y : lerp(sg.y, OUT.y - 110, sm(11.0, 11.6, tt)), 1.3, -30); }
      else if (p.mode === 'out') fx += BR.segment(p.x, p.y - 112 * p.s / 1.3, 1.3, -10);
      else if (p.mode === 'lap') fx += BR.segment(p.x - 20, p.y - 40, 1.1, 30);
      // 鼻ひくひく・前足をのばす
      let fx2 = '';
      if (tt < 5.2) { for (const t0 of [0.5, 1.4, 2.3]) if (tt >= t0 && tt < t0 + .5) { const a = L.pulse(tt, t0, t0 + .5); fx2 += `<g transform="translate(${nose2.x - 26} ${nose2.y + 6})" opacity="${a.toFixed(2)}" stroke="#FFF7E8" stroke-width="5" stroke-linecap="round"><path d="M-10 -14 l-8 -6 M-12 0 h-10 M-10 14 l-8 6"/></g>`; }
        const k = L.ease(sm(2.6, 4.4, tt)); fx2 += `<ellipse cx="${lerp(nose2.x - 10, nose2.x + 18, k)}" cy="${lerp(nose2.y + 40, nose2.y + 14, k)}" rx="10" ry="8" fill="#F2B8B0"/>`; }
      // ハンコ（構えて浮かせたまま）
      if (hanko) { const k = L.ease(sm(15.0, 15.8, tt)); const hx = lerp(P.hanko.x, P.papers.x + 12, k), hy = lerp(P.hanko.y, P.papers.y - 80, k); fx2 += BR.hanko(hx, hy); }
      const cam = L.camAt([
        { t: 0, z: 1.6, cx: 860, cy: 1420 },                    // 第2話の最後（鼻先にみかん）
        { t: 0.01, z: 1.62, cx: 850, cy: 1420, d: 4.5 },        // ひくひく（最初のコマからゆっくり）
        { t: 5.0, z: 1.04, cx: 660, cy: 1330, d: .8 },          // 引く → 出てくる・ジル
        { t: 10.9, z: 1.35, cx: 600, cy: 1260, d: .6 },         // 渡す → 仕事に戻る
        { t: 17.0, z: 1.3, cx: 640, cy: 1360, d: .5 },          // 布団のはしへ
        { t: 18.9, z: 1.42, cx: 560, cy: 1200, d: .6 },         // 膝で二度寝・固まるレン・ふせるジル
      ], tt);
      const dim = t >= CUT ? `<rect x="0" y="0" width="1080" height="1920" fill="#1E140C" opacity="${(.42 * sm(CUT, CUT + .2, t)).toFixed(2)}"/>` : '';
      L.mount({ bg, fx: fx + fx2, ui: t < 27 ? dim + TELOP(L.seg(t, CUT + .05, CUT + .5)) : dim, cam, t: tt });
      const fxl = document.getElementById('fx');
      // レンの前足（公式の長さ）：みかんの房をそっと支えて、少しずつ手前へ（11.0 まで）
      if (tt < 11.0) limb(fxl, 'ren', { x: sg.x + 22, y: sg.y + 6 }, { max: 120, w: 26, bend: 12 });
      // レンの前足：書類をそろえる（トントン）→ ハンコを持つ
      if (tt >= 12.9 && tt < 15.0) { const lift = Math.max(...[13.1, 13.7, 14.3].map(a => .6 * L.pulse(tt, a, a + .36))); for (const dx of [-58, 62]) limb(fxl, 'ren', { x: P.papers.x + dx, y: P.papers.y - 14 - 40 * lift }, { max: 110, w: 32 }); }
      if (hanko) { const k = L.ease(sm(15.0, 15.8, tt)); limb(fxl, 'ren', { x: lerp(P.hanko.x, P.papers.x + 12, k) + 16, y: lerp(P.hanko.y, P.papers.y - 80, k) - 26 }, { max: 120, w: 32 }); limb(fxl, 'ren', { x: P.papers.x + 50, y: P.papers.y - 8 }, { max: 110, w: 32 }); }
      // ジルの前足：キーボードの上
      if (tt < 19.6) for (const dx of [-26, 30]) limb(fxl, 'jil', { x: P.laptop.x + 20 + dx, y: P.laptop.y + 4 }, { max: 110, w: 30 });
      if (typeof endcard === 'function') endcard(t, EP.dur);
    }
  };
})();
var EP = window.EP;
