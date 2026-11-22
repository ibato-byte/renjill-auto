// 「上司とエレベーター 第3話（Part 3・最終話）」（20秒＋エンドカード1秒・セリフなし）2026-11-17 オーナーの絵コンテ
// 前回：ユズがまとめたモチの耳がはね返って「開」を押し、8階で扉が開くと新人クリが立っていた（最初の絵は第2話の終わりと同じ）
// 状況：クリがエレベーターに乗り、自分の赤いはちまきでモチの耳を頭の上に結んで解決。やっと1階に着き、モチは仕事から解放される
// オチ：クリが思い出したように、ほおぶくろから書類をポポポポン → モチは書類の山に埋もれ、ネクタイだけが見える → ユズが静かに目をそらす（無音）
// 0.0–4.0   クリが乗りこむ → 光るボタンと困った2人を見る → モチのたれ耳がボタンのそばにあると気づく → 目がキラッ（ピコーン）
// 4.0–7.0   クリがはちまきを外す → モチのうしろに乗り、耳を頭の上にまとめて、はちまきでキュッと結ぶ → 結ばれたモチの顔を少し長めに。クリは満足、ユズは笑顔で小さく拍手
// 7.0–10.0  チーン！1階。モチはうれしそうに目を細め、扉の方へ（一瞬の幸せ）
// 10.0–14.0 クリが「！」→ ほおがぷくーっと風船のように → 書類がほおから次々に飛び出し（ポン！ポン！ポポポポン！）、モチが山に埋もれる（ネクタイだけ見える）
//           → ユズが静かに目をそらす → 13.4 から音が消えて静止（シーン…）
// 14.0–20.0 テロップ「続きは次回！フォローして待っててね／To be continued! Follow us」
// セット・クリ・はちまきは rig/v2/elevator_set.js（第1話・第2話と同じ）。始まりは第2話の終わり（docs/series/2026-11-19_elevator.md）
document.write('<script src="v2/lib.js"><\/script><script src="v2/elevator_set.js"><\/script>');
(function () {
  const sm = (a, b, t) => { const k = Math.max(0, Math.min(1, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const hop = (A, B, k, h) => ({ x: lerp(A.x, B.x, k), y: lerp(A.y, B.y, k) - h * Math.sin(Math.PI * k), s: lerp(A.s, B.s, k) });
  const RX = () => ELV.REN_END, JX = -110;
  // クリの位置（足もと・大きさ）
  const P0 = { x: 355, y: 1486, s: 1.5 };           // 第2話の終わり：8階の廊下（扉のすぐ外）
  const P1 = { x: 350, y: 1590, s: 1.72 };          // 乗りこんだ所（2人の間、少しうしろ）
  const PF = { x: 360, y: 1800, s: 1.95 };          // 「！」のあと前へ出た所（ほおぶくろがよく見える）
  const PT = () => ({ x: RX() + 180 * ELV.REN.s + 6, y: 1235, s: 1.45 });   // モチの背中の上（頭のうしろ）
  // ---- 階・ボタン・扉 ----
  const floorAt = t => t < 2.0 ? 8 : t < 7.2 ? Math.max(2, 8 - Math.floor((t - 2.0) / (5.2 / 6) + 1)) : 1;
  const litAt = t => [4, 3, 2, 1].filter(n => !(floorAt(t) <= n && (n > 1 || t >= 7.2)));
  function doorOpen(t) {
    if (t < 1.4) return 1;
    if (t < 1.85) return 1 - L.ease(sm(1.4, 1.85, t));
    if (t < 7.3) return 0;
    const u = sm(7.3, 7.62, t); return u < 1 ? u * 1.05 : 1 + .05 * Math.exp(-(t - 7.62) * 12) * Math.cos((t - 7.62) * 36);
  }
  // ---- クリ ----
  function pomAt(t) {
    let P = P0, layer = 'hall', q = { eye: 'round', look: 0, wob: 0, blush: .35, squash: 0, cheek: 0, band: true, paws: 0, mouth: 'w' };
    if (t < 0.25) { P = P0; q.eye = 'big'; q.wob = 12; }                                         // 第2話の終わり（首をかしげて）
    else if (t < 0.7) { P = hop(P0, { x: 352, y: 1540, s: 1.6 }, sm(0.25, 0.7, t), 70); q.squash = -.15 * L.pulse(t, 0.25, 0.35); q.wob = lerp(12, 0, sm(0.25, 0.5, t)); }   // ぴょん（廊下 → しきい）
    else if (t < 1.15) { P = hop({ x: 352, y: 1540, s: 1.6 }, P1, sm(0.7, 1.15, t), 60); layer = 'back'; }
    else P = P1, layer = 'back';
    if (t >= 0.7) layer = 'back';
    if (t >= 1.15 && t < 1.35) q.squash = -.2 * L.pulse(t, 1.15, 1.35);                           // 着地
    // 1.6–4.0：光るボタン → 困った2人 → モチの耳（ボタンのそば）→ キラッ
    if (t >= 1.6 && t < 2.4) { q.look = 1; q.wob = -4; }
    if (t >= 2.4 && t < 2.9) { q.look = sm(2.4, 2.6, t) * -1; q.wob = 6; }                        // ユズを見る
    if (t >= 2.9 && t < 3.25) { q.look = 1; q.wob = 10; }                                         // モチの耳
    if (t >= 3.25 && t < 4.0) { q.look = .6; q.eye = 'big'; q.wob = 0; q.squash = .12 * L.pulse(t, 3.6, 3.9); }   // キラッ → わくわく
    // 4.0–6.0：はちまきを外す → 背中へ → 耳をまとめる → 結ぶ → 下りる
    if (t >= 4.0 && t < 6.05) {
      q.eye = 'round'; q.look = 0;
      if (t >= 4.0) q.paws = 1;
      if (t >= 4.15) q.band = false;                                                                // 頭の形はそのまま（はちまきだけ外れる）
      if (t >= 4.35 && t < 4.75) { P = hop(P1, PT(), sm(4.35, 4.75, t), 160); }
      else if (t >= 4.75 && t < 5.7) { P = PT(); q.squash = -.15 * L.pulse(t, 4.75, 4.9) + .1 * L.pulse(t, 4.8, 5.25); q.eye = t > 5.55 ? 'happy' : 'round'; }
      else if (t >= 5.7) { P = hop(PT(), P1, sm(5.7, 6.05, t), 120); q.eye = 'happy'; q.paws = 0; }
    }
    if (t >= 6.05) { q.band = false; q.eye = 'happy'; q.squash = -.18 * L.pulse(t, 6.05, 6.25) + .08 * L.pulse(t, 6.35, 6.65); q.blush = .6; }   // 着地 → 満足げにうなずく
    if (t >= 7.0) { q.eye = 'round'; q.look = .5; q.blush = .4; }
    // 10.0：思い出した！ → ほおがふくらむ → 書類 → しぼむ
    if (t >= 10.0) {
      q.eye = 'big'; q.look = .3; q.squash = .14 * L.pulse(t, 10.0, 10.2);
      if (t >= 10.12) { P = t < 10.38 ? hop(P1, PF, sm(10.12, 10.38, t), 90) : PF; layer = t >= 10.2 ? 'front' : 'back'; q.look = .8; }   // 前へぴょん
      if (t >= 10.3) {
        const inflate = L.outBack(sm(10.3, 10.9, t)) * 1.55;
        const wob = .08 * Math.sin((t - 10.3) * 26) * Math.exp(-(t - 10.3) * 3);   // ぷるん（やわらかい弾力）
        const deflate = sm(11.0, 13.0, t) * 1.15;
        q.cheek = Math.max(0, inflate + wob - deflate); q.mouth = 'w';
        if (t >= 11.0 && t < 13.0) { const k = pops(t).count; q.squash = .05 * Math.sin(k * 2.1); }
      }
      if (t >= 13.0) { q.eye = 'happy'; q.blush = .7; q.look = 0; }                               // やりきった顔
    }
    return { P, layer, q };
  }
  // ---- 書類：ほおから次々に（だんだん速く）。ポン！ポン！ポポポポン！ ----
  const POP_T = (() => { const a = [11.0, 11.35, 11.62]; let t = 11.62, dt = .2; while (t < 12.95) { dt = Math.max(.045, dt * .86); t += dt; a.push(Math.round(t * 1000) / 1000); } return a; })();
  function pops(t) { let n = 0; for (const x of POP_T) if (t >= x) n++; return { count: n, total: POP_T.length }; }
  const FLY = .32;   // ほおから山まで飛ぶ時間
  // ---- モチ ----
  const UP = -164, TIE = -169;
  function earsAt(t) {
    let e = 0;
    if (t >= 4.75 && t < 5.3) e = lerp(0, UP, L.ease(sm(4.75, 5.3, t)));
    else if (t >= 5.3) e = lerp(UP, TIE, sm(5.5, 5.65, t));   // キュッ（結ぶと少しすぼまる）
    if (t >= 7.6 && t < 10.0) e += 4 * Math.sin((t - 7.6) * 11);   // うれしくて束がぴょこぴょこ
    return { r: e, l: e };
  }
  function stretchAt(t) {
    let k = 1;
    if (t >= 4.75 && t < 5.3) k += .14 * L.pulse(t, 4.75, 5.3);      // 持ち上げると少し伸びる（布のように）
    if (t >= 5.5 && t < 5.9) k += .1 * L.pulse(t, 5.5, 5.75) - .06 * L.pulse(t, 5.7, 5.9);   // キュッ → ぽよん
    return k;
  }
  function renPose(t) {
    const R = ELV.REN, F = RIG.FACES, E = earsAt(t);
    let face = Object.assign({}, F.neutral, { mouth: 'line' }), look = -.4, eyeOpen = 1.25, sq = -.16, sweat = 1, x = RX(), yOff = 0, extra = {};
    if (t >= 0.6) { face = Object.assign({}, F.oops, { sweat: 0, browAngle: 14 }); eyeOpen = .85; sq = -.12; sweat = .8; look = t < 1.6 ? -.6 : .2; }   // 困っている
    if (t >= 4.7 && t < 5.9) { face = Object.assign({}, F.neutral, { mouth: 'w' }); eyeOpen = 1.2; look = 0; sweat = .6; }                                 // されるがまま
    if (t >= 5.9 && t < 7.2) { face = Object.assign({}, F.neutral, { mouth: 'w' }); eyeOpen = 1.05 - .9 * L.pulse(t, 6.55, 6.7); look = .15 * Math.sin(t * 5); sweat = .3; extra.blush = .9; sq = -.05; }   // 結ばれた顔（少し間抜けでかわいい）
    if (t >= 7.4 && t < 10.0) {   // 1階！ うれしい（目を細める・一瞬の幸せ）→ 扉の方へ
      face = Object.assign({}, F.smile, { sparkle: L.pulse(t, 7.5, 8.6) }); extra.blush = 1; sweat = 0; sq = .05;
      Object.assign(extra, L.binky(t, 7.75));
      const go = sm(8.6, 9.8, t); x = RX() - 26 * go; yOff = -28 * go + (-30 * Math.abs(Math.sin(Math.PI * Math.min(1, (t - 8.6) / .6)))) * (t > 8.6 && t < 9.8 ? 1 : 0);
    }
    if (t >= 10.0) { const f = sm(10.0, 10.15, t); face = Object.assign({}, F.neutral, { mouth: 'line' }); eyeOpen = 1.1 + .15 * f; look = -1; sweat = f; extra.blush = .3; x = RX() - 26; yOff = -28; sq = -.1 * f;
      if (t >= 11.2) { face = Object.assign({}, F.surprised, { excl: 0 }); eyeOpen = 1.3; } }
    const p = Object.assign({}, RIG.POSES.sit, face, { x, y: ELV.y(R) + yOff + (extra.yOff || 0), scale: R.s, bodyTilt: 6 + (extra.bodyTilt || 0), headTilt: 6 + (extra.headTilt || 0), bodySquash: sq + (extra.bodySquash || 0), earR: E.r, earL: E.l, eyeLook: look, eyeOpen, sweat });
    if (extra.blush != null) p.blush = extra.blush;
    return p;
  }
  function jilPose(t) {
    const J = ELV.JIL, F = RIG.FACES;
    let face = Object.assign({}, F.neutral, { mouth: 'line' }), look = .5, eyeOpen = 1.25, sq = -.06, nod = 0, htilt = 0, extra = { sweat: 1 };
    if (t >= 0.6) { face = Object.assign({}, F.neutral, { mouth: 'line' }); eyeOpen = 1.05; look = t < 1.6 ? .6 : .9; extra.sweat = .4; sq = 0; }   // クリを目で追う
    if (t >= 2.4 && t < 2.9) { look = .9; nod = -4; }
    if (t >= 4.0 && t < 5.65) { look = 1; eyeOpen = 1.1; nod = -10; extra.sweat = 0; }                      // モチの頭の上を見る
    if (t >= 5.65 && t < 7.4) { face = Object.assign({}, F.smile); eyeOpen = 1; look = .6; nod = 0; extra.sweat = 0; sq = .04 * Math.sin((t - 5.65) * 22) * (t < 6.3 ? 1 : 0); }   // 笑顔で小さく拍手
    if (t >= 7.4 && t < 10.0) { face = Object.assign({}, F.smile); look = .8; extra.sweat = 0; }
    if (t >= 10.0) { face = Object.assign({}, F.neutral, { mouth: 'line' }); eyeOpen = 1.2; look = .8; extra.sweat = .6; }
    if (t >= 12.95) { const a = sm(12.95, 13.4, t); face = Object.assign({}, F.sharp, { eyeShape: a > .4 ? 'half' : 'round', mouth: 'line' }); look = lerp(.8, -1, a); htilt = -8 * a; nod = 4 * a; eyeOpen = lerp(1.2, .7, a); extra.sweat = .6; }   // 静かに目をそらす
    return Object.assign({}, RIG.POSES.sit, face, { x: JX, y: ELV.y(J), scale: J.s, eyeLook: look, headNod: nod, headTilt: htilt, bodySquash: sq, eyeOpen }, extra);
  }
  const still = t => t >= 13.4;
  const charOpt = (t, extra) => Object.assign({ twitch: !still(t) && !(t > 4.5 && t < 10.0) }, still(t) ? { blink: false, breathe: false, ears: false } : {}, (t > 4.5) ? { ears: false } : {}, extra || {});
  // 描いたモチの、耳のふちの点・ネクタイの真ん中（世界の座標）
  function renPoint(re, frac) {
    const svg = document.getElementById('ren'); const p = [...svg.querySelectorAll('path')].find(x => re.test(x.getAttribute('d') || '')); if (!p) return null;
    const q = frac == null ? (() => { const b = p.getBBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })() : p.getPointAtLength(p.getTotalLength() * frac);
    return new DOMPoint(q.x, q.y).matrixTransform(p.getCTM());
  }
  // ---- 書類の山（モチの前）。ネクタイのところだけすき間 ----
  const PILE = { cx: 690, base: 1668, top: 830, half: 330 };
  const SH = (i, k) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
  const NP = 96;   // 山の紙の枚数（最後に全部）
  function paperRect(i) {   // i 枚目の紙の場所（山の下から上へ。山の形にそって）
    const h = i / (NP - 1), y = lerp(PILE.base - 16, PILE.top + 20, Math.pow(h, .92));
    const w = PILE.half * Math.sqrt(Math.max(0, 1 - Math.pow((y - PILE.top) / (PILE.base - PILE.top) - 1, 2) * .0 - Math.pow(1 - (PILE.base - y) / (PILE.base - PILE.top), 2) * .0)) * (1 - .78 * h);
    const x = PILE.cx + (SH(i, 1) * 2 - 1) * Math.max(20, w - 90);
    return { x: x + (SH(i, 6) * 2 - 1) * 40, y, r: (SH(i, 2) * 2 - 1) * 26, c: SH(i, 3) > .5 ? '#FFFFFF' : '#F4EFE6' };
  }
  function pileSvg(t, tie) {
    const { count, total } = pops(t); if (!count) return '';
    // 着いた紙の数 → 山の高さ（紙1枚で山の数枚分。最後の「ポポポポン」で一気に高く）
    const landed = POP_T.filter(x => t >= x + FLY).length, k = landed / total, n = Math.round(NP * Math.pow(k, .85));
    const hole = tie ? { x: tie.x, y: tie.y, rx: 26, ry: 40 } : null;
    let s = '';
    if (n > 3) {   // 紙のかたまり（下地）。ネクタイの所に穴
      const topY = lerp(PILE.base, PILE.top + 40, Math.pow(k, .85)), hw = PILE.half * .82 * (.55 + .45 * Math.min(1, k * 1.6));
      const mound = `M${PILE.cx - hw} ${PILE.base} Q${PILE.cx - hw * .95} ${topY + (PILE.base - topY) * .25} ${PILE.cx - hw * .3} ${topY} Q${PILE.cx} ${topY - 30} ${PILE.cx + hw * .3} ${topY} Q${PILE.cx + hw * .95} ${topY + (PILE.base - topY) * .25} ${PILE.cx + hw} ${PILE.base} Z`;
      const holeP = hole && k > .45 ? ` M${hole.x - hole.rx} ${hole.y} a${hole.rx} ${hole.ry} 0 1 0 ${hole.rx * 2} 0 a${hole.rx} ${hole.ry} 0 1 0 ${-hole.rx * 2} 0Z` : '';
      s += `<path d="${mound}${holeP}" fill="#EFE8DC" fill-rule="evenodd" stroke="#D7CCBB" stroke-width="3"/>`;
    }
    for (let i = 0; i < n; i++) {
      const p = paperRect(i); if (hole && Math.abs(p.x - hole.x) < 140 && Math.abs(p.y - hole.y) < 52) continue;   // すき間（ネクタイ）
      const fresh = i >= n - 3 ? Math.max(0, 1 - (t - (POP_T[Math.min(total - 1, Math.floor(i / NP * total))] + FLY)) / .15) : 0;
      s += `<g transform="translate(${p.x} ${p.y - 14 * fresh}) rotate(${p.r})"><rect x="-104" y="-15" width="208" height="30" rx="3" fill="${p.c}" stroke="#CDBFAA" stroke-width="2.5"/><rect x="-104" y="9" width="208" height="6" fill="#3B2412" opacity=".08"/><rect x="-80" y="-4" width="${90 + 60 * SH(i, 4)}" height="3" fill="#8C7B66" opacity=".3"/><rect x="-80" y="3" width="${60 + 80 * SH(i, 5)}" height="3" fill="#8C7B66" opacity=".22"/></g>`;
    }
    return `<g data-nb="1">${s}</g>`;
  }
  function flyingSvg(t, pom) {
    let s = '';
    POP_T.forEach((t0, i) => {
      if (t < t0 || t >= t0 + FLY) return;
      const u = (t - t0) / FLY, side = i % 2 ? 1 : -1;
      const sx = pom.x + side * (60 + 30 * pom.c) * pom.s, sy = pom.y - 118 * pom.s;
      const land = paperRect(Math.min(NP - 1, Math.round(NP * Math.pow((i + 1) / POP_T.length, .85)) - 1));
      const x = lerp(sx, land.x, u), y = lerp(sy, land.y, u) - 260 * Math.sin(Math.PI * u) * (1 - .3 * (i / POP_T.length));
      s += `<g transform="translate(${x} ${y}) rotate(${(u * 540 + i * 37) % 360}) scale(${.55 + .45 * u})"><rect x="-90" y="-60" width="180" height="120" rx="6" fill="#FFFFFF" stroke="#D7CCBB" stroke-width="3"/><rect x="-70" y="-40" width="110" height="7" fill="#8C7B66" opacity=".3"/><rect x="-70" y="-24" width="140" height="7" fill="#8C7B66" opacity=".25"/><rect x="-70" y="-8" width="90" height="7" fill="#8C7B66" opacity=".22"/></g>`;
      if (u < .25) s += `<g transform="translate(${sx} ${sy})" opacity="${(1 - u / .25).toFixed(2)}"><circle r="${30 + 60 * u}" fill="none" stroke="#FFFFFF" stroke-width="7"/></g>`;   // ポン！
    });
    return s ? `<g data-nb="1">${s}</g>` : '';
  }
  // テロップは画面の上（扉の上の空いた所）。下に置くと、オチのクリの顔とネクタイ（書類の山のすき間）を6秒間かくしていた（2026-11-17 総見直し）
  const TELOP = (k) => k <= 0 ? '' : `<g transform="translate(540 345) scale(${(.86 * L.outBack(Math.min(1, k * 1.6))).toFixed(3)})" opacity="${Math.min(1, k * 3)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle">
    <rect x="-452" y="-122" width="904" height="292" rx="46" fill="#3B2412" opacity=".22" transform="translate(6 10)"/>
    <rect x="-452" y="-122" width="904" height="292" rx="46" fill="#3A2414" opacity=".9"/><rect x="-436" y="-108" width="872" height="18" rx="9" fill="#fff" opacity=".08"/>
    <text y="-16" font-size="88" fill="#FFF7E8">続きは次回！</text><text y="66" font-size="54" fill="#F2D3A8">フォローして待っててね</text>
    <text y="128" font-size="38" fill="#FFF7E8" opacity=".85" font-family="Noto Sans, Noto Sans CJK JP, sans-serif">To be continued! Follow us</text></g>`;
  const SFX = [{ t: 0.0, type: 'hum@13.4', pan: 0 },
    { t: 0.28, type: 'pop', pan: -.1 }, { t: 0.72, type: 'pop', pan: -.1 }, { t: 1.16, type: 'tap', pan: -.1 },   // ぴょん、ぴょん
    { t: 1.4, type: 'doorq', pan: 0 }, { t: 2.45, type: 'blink', pan: -.2 }, { t: 2.95, type: 'blink', pan: .2 },
    { t: 3.27, type: 'pikon', pan: -.1 },                                                                          // ピコーン（目がキラッ）
    { t: 4.05, type: 'swish', pan: -.1 }, { t: 4.36, type: 'pop', pan: 0 }, { t: 4.76, type: 'tap', pan: .1 },
    { t: 4.85, type: 'swish', pan: .1 }, { t: 5.58, type: 'kyu', pan: .1 },                                       // キュッ
    { t: 5.72, type: 'pop', pan: 0 }, { t: 6.06, type: 'tap', pan: -.1 },
    { t: 5.84, type: 'tap', pan: -.4 }, { t: 6.01, type: 'tap', pan: -.4 }, { t: 6.18, type: 'tap', pan: -.4 },    // 小さな拍手
    { t: 7.2, type: 'ding', pan: .15 }, { t: 7.3, type: 'doorq', pan: 0 }, { t: 7.8, type: 'pon', pan: .2 },
    { t: 10.0, type: 'pikon', pan: -.1 }, { t: 10.3, type: 'puku', pan: -.1 }];                                  // ！ → ぷくーっ
  const BTN_SFX = [];
  POP_T.forEach((x, i) => SFX.push({ t: x, type: 'pop', pan: i % 2 ? .25 : -.35 }));                            // ポン！ポン！ポポポポン！
  SFX.push({ t: 14.02, type: 'pop', pan: 0 });
  // 拍手の前足（ユズの胸の前に小さく。腕は描かない）
  function clap(t) {
    if (t < 5.75 || t > 6.25) return '';
    const s = ELV.JIL.s, cx = JX + 188 * s, cy = ELV.y(ELV.JIL) + 318 * s, g = Math.abs(Math.sin((t - 5.75) * Math.PI / .17)), d = 4 + 14 * g;
    return `<g data-nb="1">${[-1, 1].map(sd => `<ellipse cx="${cx + sd * d}" cy="${cy}" rx="15" ry="12" fill="#F6EBDC" stroke="#CFA174" stroke-width="3"/>`).join('')}${g < .2 ? `<g stroke="#F2C14E" stroke-width="5" stroke-linecap="round"><path d="M${cx - 30} ${cy - 30} l-10 -10 M${cx} ${cy - 36} l0 -14 M${cx + 30} ${cy - 30} l10 -10"/></g>` : ''}</g>`;
  }
  window.EP = {
    dur: 21.0,
    // わざと（オーナーの絵コンテ）：モチは 12.3 秒から書類の山に埋もれる（ネクタイだけ見える）／13.4 秒から最後まで静止（シーン…→テロップ）
    qaAllow: { hidden_ren: [[12.2, 21]], still: [[13.3, 21]] },
    bgmHolds: '0.0-14.0',   // 本編は BGM なし。13.4〜14.0 は完全な無音（シーン…）。テロップから BGM
    sfx: SFX.sort((a, b) => a.t - b.t),
    frame(t) {
      if (!window.L || !window.RIG || !window.ELV) return;
      const PO = pomAt(t);
      const pomSvg = ELV.pomDefs() + ELV.pom(PO.P.x, PO.P.y, PO.P.s, PO.q);
      const bg = ELV.bg({ open: doorOpen(t), floor: floorAt(t), down: t >= 1.9 && t < 7.2, up: false, lit: litAt(t), hallFloor: t < 3 ? 8 : 1, hall: PO.layer === 'hall' ? pomSvg : '', plant: false, pulse: .5 + .5 * Math.sin(t * 4) });
      L.char('ren', renPose(t), t, '', charOpt(t)); ELV.stretchEar('R', stretchAt(t)); ELV.stretchEar('L', stretchAt(t));
      L.char('jil', jilPose(t), t, '', charOpt(t));
      // はちまき：頭 → 手に持つ → 耳の束に結ぶ
      let back = PO.layer === 'back' ? `<g data-nb="1">${pomSvg}</g>` : '', fx = '';
      const ps = PO.P.s, pHead = { x: PO.P.x, y: PO.P.y - 128 * ps };
      const eL = renPoint(/^M\s*134 112/, .32), eR = renPoint(/^M\s*226 112/, .32);
      const bun = eL && eR ? { x: (eL.x + eR.x) / 2, y: (eL.y + eR.y) / 2, w: Math.min(110, Math.hypot(eR.x - eL.x, eR.y - eL.y) + 70) } : null;
      if (t >= 4.15 && t < 5.3) { const lift = sm(4.15, 4.35, t); back += ELV.bandLoose(pHead.x, pHead.y - (60 + 60 * lift) * ps, ps * .95, 6 * Math.sin(t * 9)); }   // 外して、頭の上に持つ
      if (t >= 5.3 && bun) {
        const k = sm(5.3, 5.6, t);
        if (k < 1 && t < 5.6) back += ELV.bandLoose(lerp(pHead.x, bun.x, k), lerp(pHead.y - 120 * ps, bun.y, k), ps * .95, 0);
        fx += ELV.bandTied(bun.x, bun.y, bun.w, sm(5.45, 5.65, t), -4);
      }
      // クリの目がキラッ／「！」
      const eyeY = PO.P.y + (-134) * ps;
      if (t >= 3.27 && t < 3.85) { const a = L.pulse(t, 3.27, 3.85); for (const sd of [-1, 1]) fx += `<g transform="translate(${PO.P.x + sd * 22 * ps + 6} ${eyeY - 8}) scale(${.4 + .8 * a}) rotate(${t * 200})" opacity="${a.toFixed(2)}"><path d="M0 -22 L5 -5 L22 0 L5 5 L0 22 L-5 5 L-22 0 L-5 -5Z" fill="#FFE27A" stroke="#fff" stroke-width="3"/></g>`; }
      const emk = t >= 10.0 && t < 10.9 ? `<g opacity="${Math.min(1, (10.9 - t) * 4).toFixed(2)}">${L.emark(PO.P.x + 80 * ps / 1.7, PO.P.y - 250 * ps, .9 * L.outBack(sm(10.0, 10.15, t)))}</g>` : '';
      // モチの幸せ（一瞬だけ強く）
      if (t >= 7.5 && t < 8.6) fx += L.sparkles(RX() + 300, ELV.y(ELV.REN) + 200, t, 1.6 * L.pulse(t, 7.5, 8.6), 6);
      fx += clap(t);
      // 書類（飛ぶ紙・山）。山はモチの上、ネクタイの所だけすき間
      const tie = renPoint(/^M\s*177 293/);
      fx += pileSvg(t, tie) + (PO.layer === 'front' ? `<g data-nb="1">${pomSvg}</g>` : '') + flyingSvg(t, { x: PO.P.x, y: PO.P.y, s: ps, c: PO.q.cheek });
      fx += emk;
      const cam = L.camAt([
        { t: 0, z: 1.08, cx: 490, cy: 1190 },                  // 第2話の終わり（扉が開いてクリ）
        { t: 0.01, z: 1.13, cx: 520, cy: 1220, d: 1.6 },        // クリが乗りこむ（最初のコマからゆっくり寄る）
        { t: 4.3, z: 1.15, cx: 560, cy: 1120, d: .5 },          // モチの頭の上
        { t: 6.25, z: 1.7, cx: 650, cy: 1130, d: .4 },          // 結ばれたモチの顔（少し長めに）
        { t: 7.15, z: 1.12, cx: 520, cy: 1220, d: .4 },         // 1階・扉
        { t: 10.7, z: 1.06, cx: 520, cy: 1150, d: .6 },         // 書類の山
      ], t);
      if (still(t)) cam.z /= 1 + .006 * Math.sin(t * .9);
      L.mount({ bg, back, fx, ui: t < 20.05 ? TELOP(L.seg(t, 14.0, 14.5)) : '', cam, t });
      if (typeof endcard === 'function') endcard(t, EP.dur);
    }
  };
})();
var EP = window.EP;
