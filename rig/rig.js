// レンとジル リグ v1 — SVGパーツ分け + ボーン（transformグループ）+ パラメータ駆動
// 使い方: RIG.render(svgEl, { char:'ren'|'jil', ...params })  / RIG.pose(name) / RIG.face(name)
(function (global) {
  const NS = 'http://www.w3.org/2000/svg';

  // ---------- 色（決定版キャラクターシートと同じ） ----------
  const C = {
    ren: { fur1: '#DDB68C', fur2: '#C7A077', fur3: '#9C7652', head1: '#E3C29C', head2: '#CDA67C', head3: '#A88259',
           ear1: '#C4A381', ear2: '#AE8D6D', ear3: '#8E7057', cream: '#F3E7D6', eye1: '#6B4631', eye2: '#3A2216', eye3: '#0F0704',
           nose: '#C88D85', mouth: '#7A5A48', blush: '#EFA09A', theme: '#C9962F', themeDark: '#A97A1E' },
    jil: { fur1: '#E2BB8D', fur2: '#CFA174', fur3: '#A3754C', head1: '#E9C79F', head2: '#D3A777', head3: '#B08155',
           ear1: '#C79A6C', ear2: '#B38657', earIn1: '#E9C3B2', earIn2: '#DDA898', cream: '#F6EBDC', eye1: '#46525E', eye2: '#1C1919', eye3: '#050404',
           nose: '#D98F8E', mouth: '#A86E68', blush: '#EFA09A', theme: '#355F86', ring: '#9A7F5A' }
  };

  // ---------- デフォルトパラメータ（ボーン） ----------
  const DEFAULTS = {
    char: 'ren',
    x: 0, y: 0, scale: 1, flip: false,
    bodySquash: 0,      // -1(縮む)〜1(びろーん伸びる)
    bodyTilt: 0,        // 体の傾き deg
    headTilt: 0,        // 首の傾き deg
    headNod: 0,         // 頭の上下 px
    earL: 0, earR: 0,   // 耳の角度 deg（レン:垂れ耳の揺れ / ジル:立ち耳の向き）
    eyeOpen: 1,         // 0(閉じ)〜1(開き)
    eyeLook: 0,         // 瞳の左右 -1〜1
    eyeShape: 'round',  // round | happy | flat | angry | half
    browAngle: 0,       // 眉（レンは目の上の陰で表現）
    mouth: 'w',         // w | smile | open | line | wavy | pout
    blush: 0,           // 0〜1
    pose: 'sit',        // sit | stretch | stand | thump | lean
    legLift: 0,         // 足ダン用 0〜1
    prop: true,         // ネクタイ/メガネ+社員証
    sweat: 0, zzz: 0, heart: 0, excl: 0, question: 0, sparkle: 0, // 記号
    fur: true
  };

  // ---------- 表情プリセット ----------
  const FACES = {
    neutral:  { eyeOpen: 1, eyeShape: 'round', mouth: 'w', browAngle: 0, blush: 0 },
    smile:    { eyeOpen: 1, eyeShape: 'happy', mouth: 'smile', browAngle: 0, blush: 0.6 },
    oops:     { eyeOpen: 0.6, eyeShape: 'round', mouth: 'pout', browAngle: 12, sweat: 1 },
    smug:     { eyeOpen: 0.55, eyeShape: 'half', mouth: 'smile', browAngle: -10, sparkle: 1 },
    sleepy:   { eyeOpen: 0.08, eyeShape: 'flat', mouth: 'w', zzz: 1 },
    sharp:    { eyeOpen: 1, eyeShape: 'round', mouth: 'line', browAngle: -8 },
    annoyed:  { eyeOpen: 0.5, eyeShape: 'flat', mouth: 'line', browAngle: 0, sweat: 0.6 },
    angry:    { eyeOpen: 1, eyeShape: 'angry', mouth: 'open', browAngle: -18, excl: 1 },
    shy:      { eyeOpen: 1, eyeShape: 'happy', mouth: 'wavy', blush: 1, heart: 1 },
    surprised:{ eyeOpen: 1.25, eyeShape: 'round', mouth: 'open', browAngle: 14, excl: 1 },
    think:    { eyeOpen: 0.8, eyeShape: 'round', eyeLook: 0.6, mouth: 'line', question: 1 }
  };

  // ---------- ポーズプリセット ----------
  const POSES = {
    sit:     { pose: 'sit', bodySquash: 0, bodyTilt: 0, headTilt: 0, headNod: 0, legLift: 0 },
    loaf:    { pose: 'sit', bodySquash: -0.5, bodyTilt: 0, headNod: 10 },
    stretch: { pose: 'stretch', bodySquash: 1, bodyTilt: 0, headTilt: 6, headNod: 26 },
    flop:    { pose: 'flop', bodySquash: 0, bodyTilt: 0, headTilt: 78, headNod: 31, headX: -36, legLift: 0, earL: 138, earR: -4, eyeOpen: 0.06, eyeShape: 'flat', mouth: 'w', blush: 0.6 }, // ばたん：頭のてっぺんを背中側へ倒し、ほおを床に（首が宙にうかない）。耳は背中へ寝かせる（2026-11-17 直し）
    bow:     { pose: 'bow', bodySquash: 0, bodyTilt: 0, headTilt: -9, headNod: 62, legLift: 0, earL: 6, earR: 6, eyeOpen: 0.06, eyeShape: 'flat', mouth: 'yawn' }, // 前のび＋あくび（22 頭は前へ下がって少し前へ傾く・23 耳は力がぬけて外へ・24 目はぎゅっと閉じる）
    sploot:  { pose: 'sploot', bodySquash: 0, bodyTilt: 0, headTilt: 3, headNod: 86, legLift: 0, earL: -3, earR: -3 }, // あごが前足の上にのる高さ // のびて寝る（あごを前足にのせる高さ）
    stand:   { pose: 'stand', bodySquash: -0.2, headNod: -16 },
    thump:   { pose: 'thump', bodySquash: -0.35, headTilt: -4, legLift: 1 },
    lean:    { pose: 'lean', bodySquash: 0, bodyTilt: -8, headTilt: -10, headNod: 6 },
    nudge:   { pose: 'lean', bodyTilt: 10, headTilt: 14, headNod: 14 },
    binky:   { pose: 'stand', bodySquash: 0.3, bodyTilt: 18, headTilt: 12, headNod: -8 }
  };

  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIO = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  const easeOutBack = t => { const s = 1.70158; return 1 + (--t) * t * ((s + 1) * t + s); };

  // ---------- SVGヘルパ ----------
  function el(name, attrs, children) {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    (children || []).forEach(c => c && n.appendChild(c));
    return n;
  }
  const E = (cx, cy, rx, ry, fill, extra) => el('ellipse', Object.assign({ cx, cy, rx, ry, fill }, extra || {}));
  const P = (d, fill, extra) => el('path', Object.assign({ d, fill }, extra || {}));
  const G = (attrs, kids) => el('g', attrs, kids);

  function defs(id, c, isRen) {
    const furFilter = el('filter', { id: id + 'fur', x: '-10%', y: '-10%', width: '120%', height: '120%' }, [
      el('feTurbulence', { type: 'fractalNoise', baseFrequency: isRen ? '0.55' : '0.6', numOctaves: '2', seed: isRen ? '4' : '7', result: 'n' }),
      el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: isRen ? '6' : '5', xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' }),
      el('feTurbulence', { type: 'fractalNoise', baseFrequency: isRen ? '0.9 0.18' : '0.95 0.2', numOctaves: '2', seed: isRen ? '9' : '12', result: 't' }),
      el('feColorMatrix', { in: 't', type: 'matrix', values: '0 0 0 0 0.32  0 0 0 0 0.22  0 0 0 0 0.14  0.8 0 0 0 -0.34', result: 'tc' }),
      el('feComposite', { in: 'tc', in2: 'd', operator: 'in', result: 'tm' }),
      el('feMerge', {}, [el('feMergeNode', { in: 'd' }), el('feMergeNode', { in: 'tm' })])
    ]);
    const blur = (nm, sd) => el('filter', { id: id + nm, x: '-40%', y: '-40%', width: '180%', height: '180%' }, [el('feGaussianBlur', { stdDeviation: sd })]);
    const rg = (nm, stops, cx, cy, r) => el('radialGradient', { id: id + nm, cx, cy, r }, stops.map(s => el('stop', { offset: s[0], 'stop-color': s[1], 'stop-opacity': s[2] == null ? 1 : s[2] })));
    const lg = (nm, stops, x2, y2) => el('linearGradient', { id: id + nm, x1: 0, y1: 0, x2, y2 }, stops.map(s => el('stop', { offset: s[0], 'stop-color': s[1] })));
    return el('defs', {}, [
      furFilter, blur('blur', 7), blur('blurS', 3),
      rg('body', [[0, c.fur1], [0.55, c.fur2], [1, c.fur3]], 0.35, 0.3, 0.8),
      rg('head', [[0, c.head1], [0.65, c.head2], [1, c.head3]], 0.5, 0.42, 0.62),
      rg('cream', [[0, c.cream, 1], [0.6, c.cream, 0.9], [1, c.cream, 0]], 0.5, 0.45, 0.5),
      rg('eye', [[0, c.eye1], [0.45, c.eye2], [1, c.eye3]], 0.42, 0.38, 0.65),
      isRen ? lg('ear', [[0, c.ear1], [0.6, c.ear2], [1, c.ear3]], 0.2, 1) : lg('ear', [[0, c.ear1], [1, c.ear2]], 0, 1),
      isRen ? null : lg('earIn', [[0, c.earIn1], [1, c.earIn2]], 0, 1),
      // 足（2026-11-16）：上がやわらかい光、下が少し沈む。前足はクリーム、後ろ足は体より少し明るい茶
      rg('paw', [[0, isRen ? '#FCF5EA' : '#FEF8EF'], [0.55, isRen ? '#F0E3D1' : '#F3E8DA'], [1, isRen ? '#D3BC9F' : '#D8C4AA']], 0.45, 0.32, 0.72), // 丸みが出るように、まん中が明るく、ふちが沈む
      rg('foot', [[0, isRen ? '#E4CBA6' : '#E6CDA8'], [0.6, isRen ? '#CFB08B' : '#D3B48F'], [1, isRen ? '#A88662' : '#AC8A66']], 0.62, 0.3, 0.75), // 体の色に近い茶（つま先だけ明るい）
      rg('haunch', [[0, c.fur1, 0.9], [0.6, c.fur2, 0.55], [1, c.fur2, 0]], 0.4, 0.35, 0.65)
    ].filter(Boolean));
  }

  // ---------- 足（2026-11-16 オーナー：手足が安っぽい → 作り込み） ----------
  // 前足：指の分かれ目・上の光・下のかげ・床に落ちるかげ・胸から続く毛（手首）。w＝半分の幅、h＝半分の高さ
  function frontPaw(cx, cy, w, h, u, fur, cream, top) { // top＝その位置の体の下のふち（のびる時は体が上がるので、うでを見せてつなぐ）
    const t = cy - h * 1.05, b = cy + h * 0.62, arm = top != null && top < t - h * 0.2;
    const shape = `M${cx - w} ${b - h * 0.1} C${cx - w * 1.06} ${cy - h * 0.35} ${cx - w * 0.62} ${t} ${cx} ${t} C${cx + w * 0.62} ${t} ${cx + w * 1.06} ${cy - h * 0.35} ${cx + w} ${b - h * 0.1} Q${cx + w * 0.55} ${b + h * 0.22} ${cx} ${b + h * 0.18} Q${cx - w * 0.55} ${b + h * 0.22} ${cx - w} ${b - h * 0.1} Z`;
    const toe = k => `M${cx + w * k} ${b + h * 0.02} Q${cx + w * k * 1.12} ${cy + h * 0.1} ${cx + w * k * 0.96} ${cy - h * 0.18}`; // 指の分かれ目：下の半分だけ、内へ少し曲がる
    return G({}, [
      E(cx, b + h * 0.2, w * 1.05, h * 0.32, '#3B2A20', { opacity: 0.22, filter: u('blurS') }), // 床に落ちる小さなかげ
      arm ? P(`M${cx - w * 0.7} ${top - h * 0.8} L${cx - w * 0.78} ${cy - h * 0.2} L${cx + w * 0.78} ${cy - h * 0.2} L${cx + w * 0.7} ${top - h * 0.8} Z`, cream, fur) : null, // うで（体と足をつなぐ）
      arm ? P(`M${cx + w * 0.55} ${top - h * 0.4} L${cx + w * 0.62} ${cy - h * 0.4}`, 'none', { stroke: '#B59878', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.25, filter: u('blurS') }) : null,
      E(cx, cy - h * 1.35, w * 0.8, h * 1.6, u('cream'), { opacity: 0.5 }), // 手首：胸の毛から、ふちを作らずに続く
      E(cx, t + h * 0.2, w * 0.92, h * 0.3, '#8A6A4A', { opacity: 0.2, filter: u('blurS') }), // 足と胸の間のかげ（足が胸の前に出ている）
      P(shape, u('paw'), fur),
      ...[-0.34, 0.34].map(k => G({}, [P(toe(k), 'none', { stroke: '#A98E70', 'stroke-width': 1.7, 'stroke-linecap': 'round', opacity: 0.5 }), P(toe(k), 'none', { stroke: '#FFFFFF', 'stroke-width': 1.2, 'stroke-linecap': 'round', opacity: 0.35, transform: `translate(${k > 0 ? 1.6 : -1.6} -0.6)` })])), // 分かれ目の横に毛の光
      E(cx - w * 0.15, cy - h * 0.55, w * 0.62, h * 0.32, '#FFFFFF', { opacity: 0.45, filter: u('blurS') }), // 上の光（やわらかく 1 つ）
      P(`M${cx - w * 0.85} ${b - h * 0.02} Q${cx} ${b + h * 0.34} ${cx + w * 0.85} ${b - h * 0.02}`, 'none', { stroke: '#A88B6C', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.3, filter: u('blurS') }) // 下のかげ
    ]);
  }
  // 後ろ足：かかと（体の下）からつま先へ。つま先は丸くふくらむ。dir＝つま先の向き（+1 右）。L＝長さ、h＝厚み
  function hindFoot(hx, y, L, h, dir, u, fur) {
    const tx = hx + dir * L, d = dir;
    const shape = `M${hx - d * L * 0.1} ${y + h * 0.8} C${hx - d * L * 0.18} ${y - h * 0.4} ${hx + d * L * 0.1} ${y - h * 1.15} ${hx + d * L * 0.42} ${y - h * 0.9} C${hx + d * L * 0.62} ${y - h * 0.75} ${tx - d * h * 1.3} ${y - h * 1.0} ${tx - d * h * 0.2} ${y - h * 0.62} C${tx + d * h * 0.55} ${y - h * 0.32} ${tx + d * h * 0.5} ${y + h * 0.75} ${tx - d * h * 0.4} ${y + h * 0.92} L${hx + d * L * 0.1} ${y + h * 0.95} Z`;
    const crease = k => `M${tx - d * h * k} ${y + h * 0.82} Q${tx - d * h * (k - 0.2)} ${y + h * 0.3} ${tx - d * h * (k - 0.05)} ${y - h * 0.1}`;
    return G({}, [
      E(hx + d * L * 0.45, y + h * 0.95, L * 0.62, h * 0.38, '#3B2A20', { opacity: 0.2, filter: u('blurS') }),
      P(shape, u('foot'), fur),
      E(hx + d * L * 0.12, y - h * 0.7, L * 0.34, h * 0.62, '#6E5034', { opacity: 0.26, filter: u('blurS') }), // 体の下に入る所のかげ
      E(tx - d * h * 0.55, y + h * 0.1, h * 0.85, h * 0.62, '#F3E6D2', { opacity: 0.55, filter: u('blurS') }), // つま先の明るい毛
      P(crease(0.55), 'none', { stroke: '#9E7F5D', 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: 0.45 }),
      E(hx + d * L * 0.5, y - h * 0.45, L * 0.3, h * 0.28, '#FFF6E8', { opacity: 0.4, filter: u('blurS') }), // 甲の光
      P(`M${hx} ${y + h * 0.85} L${tx - d * h * 0.6} ${y + h * 0.82}`, 'none', { stroke: '#8E7052', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.25, filter: u('blurS') }) // 足の裏のかげ
    ]);
  }
  // もも：すわった体の後ろに、丸くふくらんだ太もも（光とかげで）
  function haunch(cx, cy, rx, ry, u, fur) {
    return G({}, [
      E(cx, cy, rx, ry, u('haunch'), fur),
      P(`M${cx - rx * 0.92} ${cy + ry * 0.25} C${cx - rx * 0.8} ${cy - ry * 0.85} ${cx + rx * 0.45} ${cy - ry * 1.05} ${cx + rx * 0.9} ${cy - ry * 0.2}`, 'none', { stroke: '#FFF3E0', 'stroke-width': 12, 'stroke-linecap': 'round', opacity: 0.2, filter: u('blur') }),
      P(`M${cx - rx * 0.95} ${cy + ry * 0.35} C${cx - rx * 0.7} ${cy + ry * 1.0} ${cx + rx * 0.5} ${cy + ry * 1.05} ${cx + rx * 0.95} ${cy + ry * 0.3}`, 'none', { stroke: '#8A6844', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: 0.24, filter: u('blur') })
    ]);
  }

  // ---------- のびて寝る（スプルート）2026-11-17 ----------
  // オーナー：「のびて寝る姿がただの丸い体」。本物のうさぎ（RSPCA・House Rabbit Society などの解説、写真）：
  // おなかを床にべったり付け、体は長く低い。後ろ足 2 本はまっすぐ後ろへ投げ出し、足の裏が上を向く。前足は前へ。あごは前足か床にのせる。
  // たれ耳は床に広がり、立ち耳は首のうしろへ寝かせる。頭（顔）はアニメの形のまま下げるだけ。ここでは体・足・しっぽを描く（数字はレンの大きさ。ジルは縮める）
  function splootBody(isRen, p, c, u, fur) {
    const S = isRen ? 1 : 0.8, hx = isRen ? 180 : 188, gy = 398, sx = isRen ? 1 : 0.86, sy = isRen ? 1.06 : 1; // 体つき：ホーランドロップはずんぐり（少し高く）、ネザーランドドワーフは小さくまとまる（横に短い）
    const wrap = kids => G({ transform: `translate(${hx} ${gy}) scale(${S * sx} ${S * sy}) translate(-180 -398)` }, kids);
    const line = (d, col, w, op, blur) => P(d, 'none', Object.assign({ stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', opacity: op }, blur ? { filter: u(blur) } : {}));
    // 後ろ足（足の裏を上に向けて、まっすぐうしろへ）。かかと hx0 → つま先 tx。w＝足の幅。far＝奥の足
    const hindSole = (x0, y0, tx, ty, w, far) => {
      const dx = tx - x0, dy = ty - y0, L = Math.hypot(dx, dy), ang = Math.atan2(dy, dx) * 180 / Math.PI;
      return G({ transform: `translate(${x0} ${y0}) rotate(${ang})` }, [
        E(L * 0.55, w * 0.95, L * 0.55, w * 0.42, '#3B2A20', { opacity: far ? 0.16 : 0.24, filter: u('blurS') }),                     // 足の下のかげ（床に近い）
        P(`M${-L * 0.06} ${-w * 0.3} C ${L * 0.3} ${-w * 0.5} ${L * 0.68} ${-w * 0.62} ${L * 0.9} ${-w * 0.56} C ${L * 1.04} ${-w * 0.48} ${L * 1.06} ${w * 0.46} ${L * 0.9} ${w * 0.54} C ${L * 0.66} ${w * 0.62} ${L * 0.3} ${w * 0.5} ${-L * 0.06} ${w * 0.36} Z`, u('foot'), fur), // 足：かかとは細く、つま先へ少し広がる
        P(`M${L * 0.16} ${-w * 0.36} C ${L * 0.4} ${-w * 0.5} ${L * 0.7} ${-w * 0.52} ${L * 0.86} ${-w * 0.4} C ${L * 0.88} ${-w * 0.1} ${L * 0.7} ${w * 0.02} ${L * 0.42} ${0} C ${L * 0.26} ${-w * 0.02} ${L * 0.14} ${-w * 0.12} ${L * 0.16} ${-w * 0.36} Z`, '#6A4C36', { opacity: far ? 0.62 : 0.6, filter: u('blurS') }), // 足の裏のまん中：すれて濃い毛（うさぎの足の裏に肉球は無い）
        E(L * 0.5, w * 0.22, L * 0.36, w * 0.16, '#F2DEC2', { opacity: 0.45, filter: u('blurS') }),                                   // 足の横の明るい毛（丸みが出る）
        line(`M${L * 0.2} ${w * 0.44} C ${L * 0.45} ${w * 0.52} ${L * 0.7} ${w * 0.54} ${L * 0.88} ${w * 0.46}`, '#6E5034', 3, 0.22, 'blurS'), // 足の下のふちのかげ
        E(L * 0.08, -w * 0.05, w * 0.36, w * 0.28, '#F0DCBF', { opacity: 0.3, filter: u('blurS') }),                                             // かかと：骨が出て、毛が明るい
        ...[-0.36, -0.12, 0.12, 0.36].map((k, i) => E(L * (0.95 + (i % 3 ? 0.02 : -0.01)), w * k * 1.08, w * 0.2, w * 0.17, '#EEDDC4', Object.assign({ opacity: far ? 0.6 : 0.85 }, fur))), // 指 4 本：毛のふさ。力がぬけて少し開く
        ...[-0.24, 0, 0.24].map(k => line(`M${L * 0.86} ${w * k} L${L * 0.99} ${w * k}`, '#9E7F5D', 1.3, 0.5)),                           // 指の分かれ目
        ...(far ? [] : [-0.36, -0.12, 0.12, 0.36].map(k => line(`M${L * 0.97} ${w * k} l3.5 0`, '#6A5040', 1.4, 0.4))),                   // つめの先（毛の中に少しだけ）
        line(`M${L * 0.1} ${-w * 0.44} C ${L * 0.4} ${-w * 0.56} ${L * 0.7} ${-w * 0.58} ${L * 0.88} ${-w * 0.48}`, '#FFF3E2', 2.4, 0.35, 'blurS'), // ふちの光
      ]);
    };
    const back = [
      E(392, 399, 252, 15, '#3B2A20', { opacity: 0.18, filter: u('blur') }),                       // 床のかげ：広く低い。光は左前から → かげは少しうしろへ
      E(330, 396, 170, 6, '#2E2018', { opacity: 0.32, filter: u('blurS') }),                        // おなかが床に付いている所
      G({ opacity: 0.94 }, [hindSole(446, 346, 590, 336, 26, true)]),                              // 奥の後ろ足
      line('M440 350 C 470 348 490 348 500 350', '#5A4030', 7, 0.18, 'blurS'),                      // 奥の足がお尻にかくれる所のかげ
    ];
    const body = [
      // 体：肩のふくらみ・腰の前のくぼみ・腰の骨で高く・お尻は丸く
      P('M214 300 C 228 286 252 278 276 279 C 300 280 318 290 344 289 C 380 287 404 268 436 268 C 470 268 494 292 498 326 C 502 358 492 384 470 394 L 222 396 C 206 380 204 320 214 300 Z', u('body'), fur),
      P('M300 282 C 340 286 380 270 430 268 C 456 268 474 276 484 290 C 450 284 400 290 340 296 Z', c.fur3 || '#9C7652', { opacity: 0.16, filter: u('blur') }), // 背中の毛は少し濃い
      E(320, 340, 120, 40, '#FFF3E0', { opacity: 0.08, filter: u('blur') }),                       // 体の横の、ゆるい光（上からの光が回りこむ）
      P('M218 352 C 300 366 400 368 486 350 L 478 390 L 222 394 Z', '#6E5034', { opacity: 0.22, filter: u('blur') }), // 体の下は暗い
      P('M240 390 C 320 394 400 394 470 388', 'none', { stroke: '#D9B88E', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.25, filter: u('blurS') }), // 床からの照り返し（おなかのふち）
      P('M228 392 q 8 5 16 1 q 9 5 18 0 q 8 6 17 1 q 9 5 18 0 q 8 5 17 1 q 9 6 18 0 q 8 5 17 1 q 9 5 18 0 q 8 6 17 1 q 9 5 18 0 q 8 5 16 0 q 9 5 18 -2 q 8 4 16 -3 L 470 386 L 228 386 Z', c.fur2, Object.assign({ opacity: 0.55 }, fur)), // おなかのふちの毛：床に押されて、うすくはみ出す
      line('M236 292 C 256 282 290 282 320 292 C 350 296 390 274 440 274 C 466 276 484 290 490 304', '#FFF4E2', 14, 0.3, 'blur'), // 背中の光
      line('M226 296 C 250 282 290 280 320 290 C 352 294 392 268 438 268 C 470 268 492 288 497 318', '#FFF7EA', 2.5, 0.45, 'blurS'), // 背中のふちの細い光
      line('M262 286 C 296 284 320 296 346 294 C 380 292 404 276 440 276', '#9C7A55', 2.2, 0.2),   // 背骨のゆるい線
      E(270, 292, 30, 12, '#F6E6CC', { opacity: 0.3, filter: u('blurS') }),                         // 肩甲骨のふくらみ
      E(436, 280, 34, 13, '#F6E6CC', { opacity: 0.38, filter: u('blurS') }),                        // 腰の骨
      E(340, 300, 26, 9, '#8E6C4A', { opacity: 0.16, filter: u('blurS') }),                         // 腰の前のくぼみ
      line('M360 300 C 380 318 392 348 396 384', '#7E5E40', 8, 0.18, 'blur'),                       // もものつけ根のくぼみ（おなかとももの境）
      ...[[404, 316, 22], [420, 334, 24], [440, 350, 22], [456, 336, 20], [300, 316, 26], [332, 330, 28], [366, 324, 24], [262, 320, 22]].map(([x, y, l]) => line(`M${x} ${y} q ${l * 0.5} ${l * 0.28} ${l} ${l * 0.32}`, '#A5845F', 1.5, 0.32)), // 毛の流れ：体の前からお尻へ、ももは丸く
      // すね：ももから足へまっすぐのびる（足がもものはしから急に出ない）
      hindSole(456, 377, 616, 384, 30, false),   // つま先は床から少しうく                                                      // 手前の後ろ足
      // もも：床に倒れて平たく。筋肉のふくらみと、その上の光
      P('M392 300 C 430 290 474 300 488 330 C 498 356 488 384 462 392 L 404 392 C 388 372 382 320 392 300 Z', u('haunch'), fur),
      E(440, 318, 34, 16, '#FFF3E0', { opacity: 0.22, filter: u('blurS') }),                        // ももの上の光
      line('M402 386 C 430 392 458 390 478 380', '#5E4430', 6, 0.22, 'blurS'),                      // ももが床に付く所のかげ
      // しっぽ：お尻の上のうしろに付き、ぺたんと寝る。ふちはふさふさ
      G({}, [E(492, 312, 7, 8, '#B89874', { opacity: 0.5, filter: u('blurS') }),                  // つけ根のかげ
        E(500, 318, 17, 13, '#F4EADB', fur), E(498, 312, 12, 7, c.fur2, { opacity: 0.5, filter: u('blurS') }), // しっぽ：上は毛の色、下とふちが白
        ...[[486, 312], [494, 306], [506, 308], [514, 316], [512, 326], [500, 330], [488, 324]].map(([x, y]) => E(x, y, 5.5, 4.5, '#FBF7F0', Object.assign({ opacity: 0.8 }, fur))), // ふさふさのふち
        E(502, 326, 12, 5, '#D9C8B0', { opacity: 0.6, filter: u('blurS') }),                        // しっぽの下のかげ
        E(497, 313, 7, 4, '#FFFFFF', { opacity: 0.7, filter: u('blurS') })]),                         // しっぽの上の光
      // 胸のクリーム：床に押されて横に広がる
      E(200, 372, 72, 28, u('cream'), fur),
      E(236, 318, 44, 40, u('body'), fur),                                                          // 首の毛
      line('M246 296 C 238 316 236 340 240 366', '#8E6C4A', 6, 0.14, 'blur'),                       // 肩と胸の境のかげ
      P('M236 352 C 250 346 268 350 276 364 C 282 378 276 392 262 395 L 238 395 C 228 384 228 360 236 352 Z', u('body'), fur), // ひじ：前足のつけ根が、胸の横で床に付く
      E(258, 366, 14, 8, '#FFF3E0', { opacity: 0.25, filter: u('blurS') }),                        // ひじの光
      line('M240 392 C 252 396 266 396 276 390', '#5E4430', 4, 0.2, 'blurS'),                       // ひじの下のかげ
      E(226, 300, 30, 12, '#6E5034', { opacity: 0.2, filter: u('blur') }),                          // 頭と首の境のかげ（頭がのっている）
      line('M300 300 C 320 304 340 304 356 300', '#FFF0DC', 5, 0.18, 'blurS'),                      // 息でふくらむ胸のあたりの、ゆるい光
      E(470, 300, 10, 8, '#F6E6CC', { opacity: 0.3, filter: u('blurS') }),                          // お尻の上の光（しっぽの手前）
      P('M240 380 C 300 386 400 386 470 376 L 466 388 C 400 394 300 394 240 390 Z', isRen ? '#EAD2B0' : '#EFD6B4', { opacity: 0.35, filter: u('blurS') }), // わき腹の下は、おなかの明るい毛が少し見える
      ...[[452, 272], [466, 276], [478, 284]].map(([x, y]) => P(`M${x} ${y} q 4 -6 9 -4`, 'none', { stroke: '#F3E3CA', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.5 })), // お尻の上のふちの毛が、少し立つ
      E(468, 366, 10, 7, '#F6E6CC', { opacity: 0.32, filter: u('blurS') }),                        // ひざ（ももとすねの間）の小さな光
      E(492, 384, 16, 6, '#F2E2CA', { opacity: 0.35, filter: u('blurS') }),                         // すねの内側の明るい毛
      E(232, 318, 18, 34, '#6E5034', { opacity: 0.12, filter: u('blur') }),                         // たれ耳が体に落とすかげ
      line('M222 392 C 236 396 256 397 272 395', '#2E2018', 4, 0.22, 'blurS'),                    // 胸が床に付く所の細いかげ
      P('M400 386 C 420 380 446 378 462 382 L 458 392 L 404 394 Z', '#4A3424', { opacity: 0.18, filter: u('blurS') }), // 後ろ足とおなかの間のすき間のかげ
      line('M384 300 C 404 284 444 282 470 296', '#8C6A48', 3, 0.2, 'blurS'),                       // 奥のもも（腰の向こう側）のふち
      line('M226 300 C 236 306 246 306 254 300', '#9C7A55', 2, 0.3),                                // あごの下の毛のたるみ（頭がのっている）
      ...[[476, 372], [470, 380]].map(([x, y]) => line(`M${x} ${y} q -6 4 -10 10`, '#E8D2B0', 2, 0.45)), // かかとの長い毛（ふさ）
    ];
    return { back: wrap(back), body: wrap(body) };
  }
  // 寝る時の前足：あごの下から前へ（手前へ）出して平たく。頭のあとに描いて、指先が見えるように
  function splootPaws(isRen, c, u, fur) {
    const S = isRen ? 1 : 0.8, hx = isRen ? 180 : 188;
    const paw = (x, y, w, h, rot) => G({ transform: `rotate(${rot} ${x} ${y})` }, [
      E(x, y + h * 0.9, w * 1.1, h * 0.5, '#3B2A20', { opacity: 0.22, filter: u('blurS') }),       // 床のかげ
      P(`M${x - w} ${y + h * 0.5} C ${x - w * 1.05} ${y - h * 0.6} ${x - w * 0.5} ${y - h * 1.1} ${x} ${y - h * 1.1} C ${x + w * 0.5} ${y - h * 1.1} ${x + w * 1.05} ${y - h * 0.6} ${x + w} ${y + h * 0.5} Q ${x} ${y + h * 1.05} ${x - w} ${y + h * 0.5} Z`, u('paw'), fur),
      ...[-0.42, -0.14, 0.14, 0.42].map(k => E(x + w * k * 1.02, y + h * 0.5, w * 0.24, h * 0.42, '#FFFBF4', { opacity: 0.55, filter: u('blurS') })), // 指 4 本のふくらみ
      ...[-0.28, 0, 0.28].map(k => P(`M${x + w * k} ${y + h * 0.82} q ${w * 0.04} ${-h * 0.4} 0 ${-h * 0.75}`, 'none', { stroke: '#A98E70', 'stroke-width': 1.4, 'stroke-linecap': 'round', opacity: 0.5 })), // 指の分かれ目
      E(x - w * 0.2, y - h * 0.5, w * 0.55, h * 0.3, '#FFFFFF', { opacity: 0.45, filter: u('blurS') }), // 上の光
    ]);
    // 前足：ホーランドロップは骨太で幅広、ネザーランドドワーフは小さく細い
    return G({ transform: `translate(${hx} 398) scale(${S}) translate(-180 -398)` }, [E(150, 380, 22, 10, c.cream, { opacity: 0.6, filter: u('blurS') }), E(212, 383, 22, 10, c.cream, { opacity: 0.6, filter: u('blurS') }), // 手首：胸の毛から続く
      paw(150, 392, isRen ? 26 : 21, isRen ? 12 : 10, -6), paw(212, 395, isRen ? 26 : 21, isRen ? 12 : 10, 5), E(182, 384, 62, 6, '#5A4030', { opacity: 0.2, filter: u('blurS') })]); // あごが前足にのる所のかげ
  }

  // ---------- 前のび（伸び）とあくび　2026-11-17 ----------
  // 本物の伸び：前足を前へ遠くのばして胸を床へ近づけ、後ろ足は立ったままなので、お尻が高く背中は前へ下がる。頭は前へ下がり、大きくあくび（目はぎゅっと閉じる）
  function bowBody(isRen, p, c, u, fur) {
    const S = isRen ? 1 : 0.8, hx = isRen ? 180 : 188, sx = isRen ? 1 : 0.88;
    const wrap = kids => G({ transform: `translate(${hx} 398) scale(${S * sx} ${S}) translate(-180 -398)` }, kids);
    const line = (d, col, w, op, blur) => P(d, 'none', Object.assign({ stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', opacity: op }, blur ? { filter: u(blur) } : {}));
    const back = [
      E(270, 397, 240, 12, '#3B2A20', { opacity: 0.18, filter: u('blur') }),                                   // 1 床のかげ：前足からお尻の下まで、細長く
      E(130, 397, 130, 5, '#2E2018', { opacity: 0.28, filter: u('blurS') }),                                   // 2 前足が床に付いている所の濃いかげ
      E(440, 396, 50, 5, '#2E2018', { opacity: 0.3, filter: u('blurS') }),                                     // 3 後ろ足の下のかげ
      hindFoot(408, 384, 70, 15, 1, u, fur),                                                                   // 4 奥の後ろ足（立ったまま）
    ];
    const body = [
      // 5 体：胸は床の近く、背中は前へ下り、お尻が一番高い（丸く）
      P('M232 350 C 252 318 300 278 360 248 C 404 226 456 220 484 248 C 506 272 504 320 486 360 C 466 394 422 394 398 382 C 350 370 300 374 262 386 C 238 390 226 370 232 350 Z', u('body'), fur),
      line('M246 338 C 290 300 350 262 410 236 C 446 226 474 236 488 258', '#FFF4E2', 13, 0.3, 'blur'),       // 6 背中の光（前へ下る線）
      line('M262 334 C 304 300 360 266 412 244', '#9C7A55', 2, 0.22),                                         // 7 背骨の線
      E(452, 240, 30, 13, '#F6E6CC', { opacity: 0.38, filter: u('blurS') }),                                   // 8 腰の骨（いちばん高い所）
      P('M262 380 C 300 368 350 368 396 380 L 392 392 C 350 382 300 382 266 392 Z', '#6E5034', { opacity: 0.22, filter: u('blurS') }), // 9 おなかの下（床から浮いている）
      P('M268 378 C 300 372 340 372 380 378', 'none', { stroke: isRen ? '#EAD2B0' : '#EFD6B4', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.4, filter: u('blurS') }), // 10 おなかの明るい毛
      haunch(452, 318, 46, 60, u, fur),                                                                         // 11 もも：立った後ろ足の太もも（丸く高い）
      line('M426 270 C 410 310 408 352 420 384', '#7E5E40', 7, 0.18, 'blur'),                                  // 12 ももとおなかの境
      hindFoot(436, 388, 76, 16, 1, u, fur),                                                                   // 13 手前の後ろ足（床をしっかりふむ）
      G({}, [E(488, 248, 6, 7, '#B89874', { opacity: 0.5, filter: u('blurS') }), E(494, 244, 15, 12, '#F4EADB', fur), E(492, 238, 10, 6, c.fur2, { opacity: 0.5, filter: u('blurS') }), // 14 しっぽ：お尻の上でぴんと上がる
        ...[[482, 238], [490, 232], [502, 234], [508, 244], [500, 254]].map(([x, y]) => E(x, y, 5, 4.5, '#FBF7F0', Object.assign({ opacity: 0.8 }, fur)))]),
      // 15 胸のクリーム：床すれすれ
      E(222, 370, 46, 26, u('cream'), fur),
      // 16 前足：前へ遠くのばす。うでが長く見え、足先は平たく床に
      P('M236 352 C 190 362 110 372 52 378 C 34 381 34 396 52 397 C 120 398 200 394 248 386 Z', u('cream'), fur),   // 奥の前うで
      P('M244 362 C 200 372 130 382 80 388 C 62 391 64 404 82 404 C 140 404 210 400 256 392 Z', u('cream'), fur), // 手前の前うで
      line('M90 388 C 160 382 210 374 244 366', '#B59878', 3, 0.3, 'blurS'),                                     // 17 うでのかげ（2 本の間）
      ...[[52, 388], [82, 396]].map(([x, y]) => G({}, [E(x, y + 6, 20, 4, '#3B2A20', { opacity: 0.2, filter: u('blurS') }), E(x, y, 18, 8, u('paw'), fur),
        ...[-0.5, 0, 0.5].map(k => line(`M${x - 6 + k * 3} ${y + 5} q ${-3} ${-3} ${-4} ${-7}`, '#A98E70', 1.3, 0.45))])), // 18 足先と指（平たく床に）
      line('M236 330 C 230 346 232 360 240 372', '#8E6C4A', 6, 0.15, 'blur'),                                    // 19 肩と胸の境
    ];
    return { back: wrap(back), body: wrap(body) };
  }

  // ---------- ばたん（フロップ）2026-11-17 ----------
  // 安心しきったうさぎは、横へばたんと倒れて寝る：体は横向きに床へ、白いおなかがこちら側、4 本の足は力がぬけて前（こちら）へ投げ出す。頭はほおを床につけて横に寝る
  const SLEEPY = /^(sploot|flop)$/; // 寝ている姿（のび寝・ばたん）：閉じた目・ゆるんだひげ・弱いほおの赤み・頭の光をおさえる、を一緒に使う
  function flopBody(isRen, p, c, u, fur) {
    const S = isRen ? 1 : 0.8, hx = isRen ? 180 : 188, sx = isRen ? 1 : 0.88;
    const wrap = kids => G({ transform: `translate(${hx} 398) scale(${S * sx} ${S}) translate(-180 -398)` }, kids);
    const line = (d, col, w, op, blur) => P(d, 'none', Object.assign({ stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', opacity: op }, blur ? { filter: u(blur) } : {}));
    // 足：つけ根は太く（もも・うで）、先へ細くなり、足先は丸い毛のかたまり。力がぬけて、少し曲がる
    const leg = (x0, y0, x1, y1, w, col) => { const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, mx = x0 + dx * .55 + nx * w * .25, my = y0 + dy * .55 + ny * w * .25;
      return G({}, [E(x1, y1 + w * .5, w * .9, w * .25, '#3B2A20', { opacity: 0.2, filter: u('blurS') }),
        P(`M${x0 + nx * w * .75} ${y0 + ny * w * .75} Q${mx + nx * w * .5} ${my + ny * w * .5} ${x1 + nx * w * .38} ${y1 + ny * w * .38} L${x1 - nx * w * .38} ${y1 - ny * w * .38} Q${mx - nx * w * .45} ${my - ny * w * .45} ${x0 - nx * w * .75} ${y0 - ny * w * .75} Z`, col, fur),
        P(`M${x0 + nx * w * .5} ${y0 + ny * w * .5} Q${mx + nx * w * .3} ${my + ny * w * .3} ${x1 + nx * w * .25} ${y1 + ny * w * .25}`, 'none', { stroke: '#FFF4E2', 'stroke-width': w * .25, 'stroke-linecap': 'round', opacity: 0.3, filter: u('blurS') }),
        E(x1 + dx / L * w * .2, y1 + dy / L * w * .2, w * .62, w * .48, u('paw'), fur), line(`M${x1 - w * .15} ${y1 + w * .35} q -1 -4 0 -7 M${x1 + w * .18} ${y1 + w * .35} q -1 -4 0 -7`, '#A98E70', 1.3, 0.45)]); };
    const back = [E(330, 397, 220, 13, '#3B2A20', { opacity: 0.2, filter: u('blur') }), E(330, 396, 170, 5, '#2E2018', { opacity: 0.3, filter: u('blurS') })]; // 1 床のかげ（体が横に寝ている分、広く）
    const body = [
      // 2 体：横に寝て、背中が奥（上）、おなかがこちら（下）
      P('M232 330 C 256 290 320 272 390 274 C 452 276 498 300 502 340 C 506 372 484 394 450 396 L 250 396 C 226 388 218 356 232 330 Z', u('body'), fur),
      line('M246 314 C 300 286 380 278 452 288 C 480 294 496 312 500 330', '#FFF4E2', 12, 0.28, 'blur'),       // 3 背中の光
      // 4 白いおなか：横に寝ているので、こちら側に大きく見える
      P('M252 360 C 300 344 400 340 470 356 C 486 362 488 384 470 392 C 400 398 300 398 256 392 C 240 386 238 368 252 360 Z', u('cream'), fur),
      line('M262 364 C 320 350 400 348 462 360', '#D9C5A8', 3, 0.35, 'blurS'),                                // 5 おなかと横腹の境
      E(360, 376, 60, 9, '#FFFFFF', { opacity: 0.25, filter: u('blurS') }),                                     // 6 おなかの毛の光
      haunch(450, 330, 46, 38, u, fur),                                                                         // 7 上になった後ろもも
      // 8 後ろ足 2 本：力がぬけて前（こちら）へ投げ出す。少しずらして重なる
      leg(456, 346, 522, 388, 20, c.fur2), leg(438, 356, 500, 396, 22, c.fur1),
      // 9 前足 2 本：胸の前でゆるく
      leg(272, 356, 240, 392, 15, c.cream), leg(290, 364, 262, 398, 16, c.cream), // 前足は胸の下から床へ。短く、肉球側を少し見せる
      G({}, [E(506, 318, 14, 11, '#F4EADB', fur), ...[[496, 312], [508, 308], [516, 318], [508, 328]].map(([x, y]) => E(x, y, 5, 4, '#FBF7F0', Object.assign({ opacity: 0.8 }, fur)))]), // 10 しっぽ（体の横のはし）
      P('M200 300 C 220 290 252 292 268 304 C 280 316 280 352 266 366 C 248 380 214 376 202 360 C 190 344 188 312 200 300 Z', u('body'), fur), // 11 首と肩：頭と体を、ふくらんだ毛でなめらかにつなぐ
      E(262, 372, 24, 10, u('cream'), { opacity: 0.6, filter: u('blurS') }),                                  // 15 のど元の明るい毛（頭の下にかくれ、胸へ続く。こぶに見えないよう小さく）
    ];
    const cheekShadow = G({}, [E(isRen ? 185 : 199, 397, 96, 10, '#3B2A20', { opacity: 0.22, filter: u('blur') }), E(isRen ? 178 : 192, 396, 62, 4, '#2E2018', { opacity: 0.28, filter: u('blurS') })]); // 16 ほおが床についている所の、こい影（頭が浮いて見えないように）
    return { back: G({}, [wrap(back), cheekShadow]), body: wrap(body) };
  }

  // ---------- レン（ホーランドロップ） ----------
  function buildRen(p, id) {
    const c = C.ren, u = n => `url(#${id}${n})`;
    const fur = p.fur ? { filter: u('fur') } : {};
    const sq = p.bodySquash; // -1..1
    // 体：squashで横に伸び縦に潰れる
    const bw = 148 * (1 + 0.45 * Math.max(0, sq)) * (1 - 0.08 * Math.max(0, -sq));
    const bh = 90 * (1 - 0.3 * Math.max(0, sq)) * (1 + 0.12 * Math.max(0, -sq));
    const bodyCx = 240 + 40 * Math.max(0, sq);
    const body = G({ transform: `rotate(${p.bodyTilt} 200 300)` }, [
      // 後ろ足（体の下から外へ。のびる時も体から離れない：体の下のふちに付ける）
      (() => { const hx = sq > 0.2 ? bodyCx + bw * 0.42 : 318, ky = (hx - bodyCx) / bw, by = 304 + bh * Math.sqrt(Math.max(0, 1 - ky * ky)); return hindFoot(hx, Math.min(386, by - 4), sq > 0.2 ? 86 : 70, 16, 1, u, fur); })(),
      E(bodyCx, 304, bw, bh, u('body'), fur),
      // もも
      haunch(bodyCx + bw * 0.5, 334 - 6 * Math.max(0, sq), bw * 0.4, bh * 0.56, u, fur),
      // 胸のクリーム
      E(176, 326 + 10 * Math.max(0, sq), 86, 74 * (1 - 0.2 * Math.max(0, sq)), u('cream'), fur),
      // 前足
      ...[[150, 390], [204, 392]].map(([x, y]) => { const k = (x - bodyCx) / bw; return frontPaw(x, y, 24, 13, u, fur, c.cream, 304 + bh * Math.sqrt(Math.max(0, 1 - k * k))); })
    ]);
    // 足ダン（レンはほぼ使わない）
    // ネクタイ
    const tie = p.prop ? G({ transform: `rotate(${10 + p.bodyTilt} 182 286)` }, [
      P('M175 282 L189 282 L187 293 L177 293 Z', c.theme),
      P('M177 293 L187 293 L193 334 L182 345 L171 334 Z', c.theme),
      P('M182 296 L182 340', 'none', { stroke: c.themeDark, 'stroke-width': 2, opacity: 0.6 })
    ]) : null;

    // 頭（首ボーン）
    const headY = 192 + p.headNod;
    const eyeRy = 14.5 * Math.min(1.3, Math.max(0.05, p.eyeOpen));
    const eyeDx = 5 * p.eyeLook;
    const eye = (cx) => {
      const kids = [];
      if (p.eyeShape === 'happy') {
        kids.push(P(`M${cx - 14} 197 Q${cx} 178 ${cx + 14} 197`, 'none', { stroke: c.eye2, 'stroke-width': 4.5, 'stroke-linecap': 'round' }));
      } else if (p.eyeShape === 'flat' || p.eyeOpen < 0.15) {
        kids.push(SLEEPY.test(p.pose) ? P(`M${cx - 14} 197 Q${cx} 205 ${cx + 14} 197`, 'none', { stroke: c.eye2, 'stroke-width': 3.4, 'stroke-linecap': 'round' }) : P(`M${cx - 13} 196 Q${cx} 202 ${cx + 13} 196`, 'none', { stroke: c.eye2, 'stroke-width': 4, 'stroke-linecap': 'round' })); // 寝ている時：まぶたの線は細く、ゆるく下へ
      } else {
        // 半目・怒り目：上を頭の色の板でかくすと、色が合わず四角く見えた（2026-11-16）→ まぶたの線の下だけを見せ、まぶたの線を引く
        const lid = p.eyeShape === 'half' ? `M${cx - 21} 186 Q${cx} 190 ${cx + 21} 186` : p.eyeShape === 'angry' ? (cx < 180 ? `M${cx - 21} 182.6 L${cx + 21} 193.6` : `M${cx - 21} 193.6 L${cx + 21} 182.6`) : null;
        const eyeIn = [E(cx + eyeDx, 195, 13, eyeRy, u('eye')), E(cx + eyeDx + 4.5, 189.5, 4, 3.2, '#FFFFFF', { opacity: 0.9 })];
        if (lid) { const cid = `${id}lid${cx}`; kids.push(el('clipPath', { id: cid }, [P(lid + ` V${186 + 60} H${cx - 21} Z`, '#000')])); kids.push(G({ 'clip-path': `url(#${cid})` }, eyeIn)); kids.push(P(lid, 'none', { stroke: c.eye2, 'stroke-width': 3.6, 'stroke-linecap': 'round' })); }
        else kids.push(...eyeIn);
        if (!lid) kids.push(P(`M${cx - 13} 192 Q${cx} 178 ${cx + 13} 192`, 'none', { stroke: '#5E4535', 'stroke-width': 1.6, opacity: 0.6 }));
      }
      return G({}, kids);
    };
    const mouthEl = {
      w:     P('M180 236 V243 M180 243 Q174 249 168 247 M180 243 Q186 249 192 247', 'none', { stroke: c.mouth, 'stroke-width': 1.8, 'stroke-linecap': 'round' }),
      smile: P('M166 240 Q180 256 194 240', 'none', { stroke: c.mouth, 'stroke-width': 2.4, 'stroke-linecap': 'round' }),
      open:  P('M170 240 Q180 258 190 240 Z', '#C9605F', { stroke: c.mouth, 'stroke-width': 2 }),
      line:  P('M170 245 H190', 'none', { stroke: c.mouth, 'stroke-width': 2.4, 'stroke-linecap': 'round' }),
      wavy:  P('M166 244 q5 -5 10 0 q5 5 10 0 q5 -5 8 0', 'none', { stroke: c.mouth, 'stroke-width': 2.2, 'stroke-linecap': 'round' }),
      pout:  E(180, 246, 5, 6, '#C9605F', { stroke: c.mouth, 'stroke-width': 1.8 }),
      yawn:  G({}, [E(180, 252, 11, 15, '#7A3436', { stroke: c.mouth, 'stroke-width': 2 }), E(180, 260, 7, 6, '#E58C8C'), P('M172 241 l2 4 M188 241 l-2 4', 'none', { stroke: '#FFFFFF', 'stroke-width': 2, 'stroke-linecap': 'round' })]) // 21 あくび：口を大きく縦にあけ、桃色の舌と前歯
    }[p.mouth] || null;

    const earRot = (side, deg) => `rotate(${deg} ${side < 0 ? 130 : 230} 120)`;
    // ホーランドロップの耳：頭頂の横から外へふわっと広がり、丸い先端が頬の外側に垂れる
    const earL = G({ transform: earRot(-1, -p.earL) }, [
      P('M134 112 C 100 102 56 126 40 180 C 26 230 28 286 52 306 C 74 324 106 306 112 272 C 118 238 110 204 106 172 C 102 146 114 124 134 112 Z', u('ear'), fur),
      // 先端の丸いふくらみ
      E(66, 296, 24, 12, c.ear3, { opacity: 0.22, filter: u('blurS') }),
      p.pose === 'sploot' ? G({}, [P('M118 140 C 98 190 94 250 72 298', 'none', { stroke: c.ear3, 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.3, filter: u('blurS') }), E(64, 302, 26, 6, '#EAD3B4', { opacity: 0.4, filter: u('blurS') })]) : null, // 寝ている時：耳の折れ目・床に付いた耳先 // 寝ている時：耳の折れ目と、床に付いた耳先
      // 付け根の折れ
      P('M112 122 C 122 112 136 110 150 118', 'none', { stroke: c.ear3, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.5 })
    ]);
    const earR = G({ transform: earRot(1, p.earR) + (p.pose === 'flop' ? ' translate(230 120) scale(1 0.5) translate(-230 -120)' : '') }, [ // ばたん：下側の耳は頭の下じきになり、床に沿って短く見える
      P('M226 112 C 260 102 304 126 320 180 C 334 230 332 286 308 306 C 286 324 254 306 248 272 C 242 238 250 204 254 172 C 258 146 246 124 226 112 Z', u('ear'), fur),
      E(294, 296, 24, 12, c.ear3, { opacity: 0.22, filter: u('blurS') }),
      p.pose === 'sploot' ? G({}, [P('M242 140 C 262 190 266 250 288 298', 'none', { stroke: c.ear3, 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.3, filter: u('blurS') }), E(296, 302, 26, 6, '#EAD3B4', { opacity: 0.4, filter: u('blurS') })]) : null,
      P('M248 122 C 238 112 224 110 210 118', 'none', { stroke: c.ear3, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.5 })
    ]);
    const head = G({ transform: (p.pose === 'flop' ? 'translate(0 396) scale(1.03 0.95) translate(0 -396) ' : '') + `translate(${p.headX || 0} ${p.headNod}) rotate(${p.headTilt} 180 240)` + (p.pose === 'sploot' ? ' translate(0 292) scale(1.02 0.96) translate(0 -292)' : '') }, [ // 寝る時：あごが前足に押されて、少しつぶれる（26）
      // 頭
      P('M180 105 C 252 105 292 150 292 202 C 292 258 246 292 180 292 C 114 292 68 258 68 202 C 68 150 108 105 180 105 Z', u('head'), fur),
      E(180, 250, 70, 34, '#E9D3B6', { opacity: 0.75, filter: u('blur') }),
      // クラウン（ふわっと盛り上がった頭頂）
      E(180, 118, 42, 10, '#E3C7A3', { opacity: SLEEPY.test(p.pose) ? 0.18 : 0.7, filter: u('blurS') }), // 頭のてっぺんの光は、頭の形の内側に収める（上にはみ出すと、うすい輪がのって見えた。2026-11-17） // 寝ている時は頭のてっぺんの光を弱く（光の輪のように浮いて見えた）
      P('M138 122 C 152 112 168 110 180 112 C 192 110 208 112 222 122', 'none', { stroke: '#A98863', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.55 }),
      E(150, 196, 20, 18, '#EAD7BE', { opacity: 0.8, filter: u('blurS') }),
      E(210, 196, 20, 18, '#EAD7BE', { opacity: 0.8, filter: u('blurS') }),
      // 耳（頬の前に垂れる）
      earL, earR,
      // 口元
      E(168, 242, 17, 13, c.cream, fur), E(192, 242, 17, 13, c.cream, fur), E(180, 259, 13, 8, c.cream, fur),
      // 眉（陰）
      G({ transform: `rotate(${-p.browAngle} 150 176)` }, [P('M136 176 Q150 170 164 176', 'none', { stroke: '#A88259', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: Math.abs(p.browAngle) > 2 ? 0.8 : 0 })]),
      G({ transform: `rotate(${p.browAngle} 210 176)` }, [P('M196 176 Q210 170 224 176', 'none', { stroke: '#A88259', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: Math.abs(p.browAngle) > 2 ? 0.8 : 0 })]),
      eye(150), eye(210),
      G({ transform: noseT(p, 180) }, [P('M173 229 Q180 225 187 229 Q184 235 180 236 Q176 235 173 229 Z', c.nose)]), // 鼻のひくひく（alive の p.nose）
      mouthEl,
      E(124, 228, 15, 9, c.blush, { opacity: (SLEEPY.test(p.pose) ? 0.35 : 0.55) * p.blush }), E(236, 228, 15, 9, c.blush, { opacity: (SLEEPY.test(p.pose) ? 0.35 : 0.55) * p.blush }), // 寝ている時はほおの赤みを弱く
      G({ transform: p.nose ? `translate(180 240) scale(${1 + 0.03 * p.nose} 1) translate(-180 ${-240 - 1.6 * p.nose})` : '' }, [P(SLEEPY.test(p.pose) ? 'M158 242 Q124 240 94 247 M158 247 Q126 253 100 263 M202 242 Q236 240 266 247 M202 247 Q234 253 260 263' : 'M158 240 Q122 230 92 229 M158 246 Q124 247 96 254 M202 240 Q238 230 268 229 M202 246 Q236 247 264 254', 'none', { stroke: '#FBF6EE', 'stroke-width': 1.1, opacity: 0.85 })]), // 寝ている時：ひげの力がぬけて下がる
      SLEEPY.test(p.pose) ? G({}, [E(150, 207, 17, 5, '#B48E66', { opacity: 0.22, filter: u('blurS') }), E(210, 207, 17, 5, '#B48E66', { opacity: 0.22, filter: u('blurS') }), // 閉じた目の下のふくらみ
        P('M136 197 l-5 3 M224 197 l5 3', 'none', { stroke: c.eye2, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.6 }), // 目じりのまつ毛
        ...(p.pose === 'sploot' ? [E(132, 282, 30, 11, c.head2, { opacity: 0.55, filter: u('blurS') }), E(228, 282, 30, 11, c.head2, { opacity: 0.55, filter: u('blurS') })] : [])]) : null // ほおの毛：前足に押されて横へ
    ]);

    if (p.pose === 'flop') { const fb = flopBody(true, p, c, u, fur); return G({}, [fb.back, fb.body, head]); } // 12 ネクタイは体の下にかくれる
    if (p.pose === 'bow') { const bb = bowBody(true, p, c, u, fur); return G({}, [bb.back, bb.body, p.prop ? G({ transform: 'rotate(-40 196 372)' }, [P('M190 368 L200 368 L204 388 L196 398 L188 388 Z', c.theme)]) : null, head]); } // 20 ネクタイは、さがった胸から前へたれる
    if (p.pose === 'sploot') { // のびて寝る：体は splootBody。ネクタイは、あごの下から先だけ床にのぞく（24）
      const sb = splootBody(true, p, c, u, fur), tieTip = p.prop ? G({ transform: 'rotate(-28 200 382)' }, [E(204, 410, 12, 4, '#3B2A20', { opacity: 0.2, filter: u('blurS') }), P('M196 380 L206 380 L211 402 L201 414 L191 402 Z', c.theme, { opacity: 0.97 }), P('M201 384 L201 410', 'none', { stroke: c.themeDark, 'stroke-width': 1.6, opacity: 0.5 }), P('M193 401 L201 412 L209 401', 'none', { stroke: '#FFFFFF', 'stroke-width': 1, opacity: 0.25 }), E(201, 384, 9, 5, '#2E2018', { opacity: 0.3, filter: u('blurS') })]) : null; // ネクタイ：あごの下から、細い所→広がって先がとがる形で床に寝る
      const earRest = G({ transform: `translate(0 ${p.headNod})` }, [E(70, 304, 34, 6, '#3B2A20', { opacity: 0.2, filter: u('blurS') }), E(290, 304, 34, 6, '#3B2A20', { opacity: 0.2, filter: u('blurS') })]); // 床に付いた耳先のかげ
      return G({}, [sb.back, sb.body, earRest, splootPaws(true, c, u, fur), tieTip, head]); }
    const shadow = E(215 + 40 * Math.max(0, sq), 398, 170 * (1 + 0.3 * Math.max(0, sq)), 14, '#3B2A20', { opacity: 0.18, filter: u('blur') });
    return G({}, [shadow, body, tie, head]);
  }

  // ---------- ジル（ネザーランドドワーフ） ----------
  function buildJil(p, id) {
    if (p.pose === 'flop') p = Object.assign({}, p, { headNod: 40, headX: -30, earL: 0, earR: 0 }); // ばたん（ジル）：頭が小さめなので少し下げる。立ち耳は頭と一緒に背中側へ寝る
    const c = C.jil, u = n => `url(#${id}${n})`;
    const fur = p.fur ? { filter: u('fur') } : {};
    const sq = p.bodySquash;
    const bw = 112 * (1 + 0.4 * Math.max(0, sq)) * (1 - 0.08 * Math.max(0, -sq));
    const bh = 74 * (1 - 0.28 * Math.max(0, sq)) * (1 + 0.12 * Math.max(0, -sq));
    const lift = p.legLift; // 足ダン：後ろ足が上がって下りる
    const body = G({ transform: `rotate(${p.bodyTilt} 200 320)` }, [
      // 後ろ足（足ダン：かかとを支点に上がって下りる）
      (() => { const jx = 222 + 30 * Math.max(0, sq), hx = sq > 0.2 ? jx + bw * 0.4 : 284, ky = (hx - jx) / bw, by = 322 + bh * Math.sqrt(Math.max(0, 1 - ky * ky)); // のびる時は体の下のふちに付ける
        return G({ transform: `translate(0 ${-30 * lift}) rotate(${-24 * lift} 288 388)` }, [hindFoot(hx, Math.min(386, by - 4), 54, 13, 1, u, fur)]); })(),
      E(222 + 30 * Math.max(0, sq), 322, bw, bh, u('body'), fur),
      haunch(222 + 30 * Math.max(0, sq) + bw * 0.5, 350, bw * 0.4, bh * 0.56, u, fur),
      E(184, 336, 64, 58, u('cream'), fur),
      ...[[164, 390], [206, 391]].map(([x, y]) => { const k = (x - 222 - 30 * Math.max(0, sq)) / bw; return frontPaw(x, y, 19, 11, u, fur, c.cream, 322 + bh * Math.sqrt(Math.max(0, 1 - k * k))); })
    ]);
    const lanyard = p.prop ? G({}, [
      P('M166 284 L188 316 L210 284', 'none', { stroke: c.theme, 'stroke-width': 3, 'stroke-linejoin': 'round' }),
      el('rect', { x: 177, y: 314, width: 22, height: 28, rx: 3, fill: '#FFFFFF', stroke: c.theme, 'stroke-width': 1.8 }),
      el('rect', { x: 181, y: 318, width: 14, height: 9, rx: 1, fill: c.head2 }),
      P('M181 332 H195 M181 337 H191', 'none', { stroke: '#9AA9B6', 'stroke-width': 1.8, 'stroke-linecap': 'round' })
    ]) : null;

    const eyeRy = 19.5 * Math.min(1.3, Math.max(0.05, p.eyeOpen));
    const eyeDx = 6 * p.eyeLook;
    const eye = (cx) => {
      const kids = [];
      if (p.eyeShape === 'happy') {
        kids.push(P(`M${cx - 17} 204 Q${cx} 182 ${cx + 17} 204`, 'none', { stroke: c.eye2, 'stroke-width': 5, 'stroke-linecap': 'round' }));
      } else if (p.eyeShape === 'flat' || p.eyeOpen < 0.15) {
        kids.push(SLEEPY.test(p.pose) ? P(`M${cx - 17} 203 Q${cx} 212 ${cx + 17} 203`, 'none', { stroke: c.eye2, 'stroke-width': 3.8, 'stroke-linecap': 'round' }) : P(`M${cx - 16} 202 Q${cx} 209 ${cx + 16} 202`, 'none', { stroke: c.eye2, 'stroke-width': 4.5, 'stroke-linecap': 'round' }));
      } else {
        // 半目・怒り目：上を頭の色の板でかくすと、色が合わず四角く見えた（2026-11-16）→ まぶたの線の下だけを見せ、まぶたの線を引く
        const lid = p.eyeShape === 'half' ? `M${cx - 26} 191 Q${cx} 195 ${cx + 26} 191` : p.eyeShape === 'angry' ? (cx < 188 ? `M${cx - 26} 184.5 L${cx + 26} 197.5` : `M${cx - 26} 197.5 L${cx + 26} 184.5`) : null;
        const eyeIn = [E(cx + eyeDx, 201, 18, eyeRy, u('eye')), E(cx + eyeDx + 6, 193, 5.2, 4.2, '#FFFFFF', { opacity: 0.92 })];
        if (lid) { const cid = `${id}lid${cx}`; kids.push(el('clipPath', { id: cid }, [P(lid + ` V${191 + 60} H${cx - 26} Z`, '#000')])); kids.push(G({ 'clip-path': `url(#${cid})` }, eyeIn)); kids.push(P(lid, 'none', { stroke: c.eye2, 'stroke-width': 3.6, 'stroke-linecap': 'round' })); }
        else kids.push(...eyeIn);
        kids.push(P(`M${cx - 9} 210 Q${cx} 215 ${cx + 9} 210`, 'none', { stroke: '#A9BDCC', 'stroke-width': 2, opacity: 0.25 }));
      }
      return G({}, kids);
    };
    const mouthEl = {
      w:     P('M188 236 V243 M188 243 Q183 248 178 246 M188 243 Q193 248 198 246', 'none', { stroke: c.mouth, 'stroke-width': 1.8, 'stroke-linecap': 'round' }),
      smile: P('M176 240 Q188 254 200 240', 'none', { stroke: c.mouth, 'stroke-width': 2.4, 'stroke-linecap': 'round' }),
      open:  P('M178 240 Q188 258 198 240 Z', '#C9605F', { stroke: c.mouth, 'stroke-width': 2 }),
      line:  P('M178 245 H198', 'none', { stroke: c.mouth, 'stroke-width': 2.4, 'stroke-linecap': 'round' }),
      wavy:  P('M174 244 q5 -5 10 0 q5 5 10 0 q5 -5 8 0', 'none', { stroke: c.mouth, 'stroke-width': 2.2, 'stroke-linecap': 'round' }),
      pout:  E(188, 246, 5, 6, '#C9605F', { stroke: c.mouth, 'stroke-width': 1.8 }),
      yawn:  G({}, [E(188, 252, 10, 14, '#7A3436', { stroke: c.mouth, 'stroke-width': 2 }), E(188, 259, 6.5, 5.5, '#E58C8C'), P('M181 241 l2 4 M195 241 l-2 4', 'none', { stroke: '#FFFFFF', 'stroke-width': 2, 'stroke-linecap': 'round' })])
    }[p.mouth] || null;

    const head = G({ transform: (p.pose === 'flop' ? 'translate(0 396) scale(1.03 0.95) translate(0 -396) ' : '') + `translate(${p.headX || 0} ${p.headNod}) rotate(${p.headTilt} 188 240)` + (p.pose === 'sploot' ? ' translate(0 290) scale(1.02 0.96) translate(0 -290)' : '') }, [
      // 立ち耳（根元で回転）
      p.pose === 'sploot' ? E(286, 214, 40, 10, '#7A5638', { opacity: 0.18, filter: u('blurS'), transform: 'rotate(32 286 214)' }) : null, // 寝かせた耳が首にのっている所のかげ
      ...(p.pose === 'sploot' ? [ // 寝る時の立ち耳：首のうしろへ寝かせる。前からは短く、外へ倒れて見え、内側の桃色はほとんど見えない（27・28）
        G({ transform: 'translate(184 150) rotate(112) scale(0.78 1.42) translate(-184 -150)' }, [E(176, 112, 20, 36, u('ear'), fur)]),   // 奥の耳：少し高く
        G({ transform: 'translate(220 156) rotate(122) scale(0.84 1.5) translate(-220 -156)' }, [E(212, 118, 21, 36, u('ear'), fur), E(212, 112, 6, 22, '#FFF2DE', { opacity: 0.3, filter: u('blurS') }), P('M196 96 Q 200 80 212 82', 'none', { stroke: '#FFF4E4', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.45, filter: u('blurS') }), E(206, 146, 6, 9, u('earIn'), { opacity: 0.35 }), P('M204 84 Q212 118 206 150', 'none', { stroke: '#A3754C', 'stroke-width': 2, opacity: 0.35 })])] : [
      G({ transform: `rotate(${-12 + p.earL} 164 150)` }, [E(164, 118, 22, 36, u('ear'), fur), E(164, 121, 11, 26, u('earIn'))]),
      G({ transform: `rotate(${13 + p.earR} 212 150)` }, [E(212, 116, 22, 36, u('ear'), fur), E(212, 119, 11, 26, u('earIn'))])]),
      P('M188 130 C 248 130 284 166 284 210 C 284 260 240 290 188 290 C 136 290 92 260 92 210 C 92 166 128 130 188 130 Z', u('head'), fur),
      E(188, 252, 66, 30, '#EED9BE', { opacity: 0.75, filter: u('blur') }),
      E(148, 200, 27, 25, '#F0DDC4', { opacity: 0.9, filter: u('blurS') }),
      E(228, 200, 27, 25, '#F0DDC4', { opacity: 0.9, filter: u('blurS') }),
      E(178, 242, 16, 12.5, c.cream, fur), E(198, 242, 16, 12.5, c.cream, fur), E(188, 258, 12, 7, c.cream, fur),
      // 眉（陰）
      G({ transform: `rotate(${-p.browAngle} 148 178)` }, [P('M132 178 Q148 172 164 178', 'none', { stroke: '#B08155', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: Math.abs(p.browAngle) > 2 ? 0.8 : 0 })]),
      G({ transform: `rotate(${p.browAngle} 228 178)` }, [P('M212 178 Q228 172 244 178', 'none', { stroke: '#B08155', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: Math.abs(p.browAngle) > 2 ? 0.8 : 0 })]),
      eye(148), eye(228),
      G({ transform: noseT(p, 188) }, [P('M181 229 Q188 225 195 229 Q192 235 188 236 Q184 235 181 229 Z', c.nose)]), // 鼻のひくひく（alive の p.nose）
      mouthEl,
      E(118, 232, 14, 8, c.blush, { opacity: 0.55 * p.blush }), E(258, 232, 14, 8, c.blush, { opacity: 0.55 * p.blush }),
      G({ transform: p.nose ? `translate(188 240) scale(${1 + 0.03 * p.nose} 1) translate(-188 ${-240 - 1.6 * p.nose})` : '' }, [P(SLEEPY.test(p.pose) ? 'M166 242 Q132 240 100 246 M166 247 Q134 253 106 263 M210 242 Q244 240 276 246 M210 247 Q242 253 270 263' : 'M166 240 Q130 230 98 226 M166 246 Q132 248 102 256 M210 240 Q246 230 278 226 M210 246 Q244 248 274 256', 'none', { stroke: '#FBF6EE', 'stroke-width': 1.1, opacity: 0.9 })]), // ひげも鼻と一緒に少し持ち上がる
      SLEEPY.test(p.pose) ? G({}, [E(148, 213, 20, 5, '#B48E66', { opacity: 0.2, filter: u('blurS') }), E(228, 213, 20, 5, '#B48E66', { opacity: 0.2, filter: u('blurS') }), P('M131 203 l-5 3 M245 203 l5 3', 'none', { stroke: c.eye2, 'stroke-width': 2.2, 'stroke-linecap': 'round', opacity: 0.6 }), ...(p.pose === 'sploot' ? [E(140, 280, 24, 8, c.head2, { opacity: 0.4, filter: u('blurS') }), E(236, 280, 24, 8, c.head2, { opacity: 0.4, filter: u('blurS') })] : [])]) : null, // 前足に押されたほおの毛は、のび寝だけ（ばたんでは顔の外にうかんだ。2026-11-17）
      // メガネ
      p.prop ? G(SLEEPY.test(p.pose) ? { transform: 'translate(0 5) rotate(-4 188 200)' } : {}, [ // 寝ている時：メガネが少し鼻へずり落ちて、かたむく
        SLEEPY.test(p.pose) ? G({}, [el('circle', { cx: 148, cy: 201, r: 25, fill: '#DCE6EE', opacity: 0.12 }), el('circle', { cx: 228, cy: 201, r: 25, fill: '#DCE6EE', opacity: 0.12 })]) : null, // レンズのうすい色
        el('circle', { cx: 148, cy: 201, r: 26, fill: 'none', stroke: c.ring, 'stroke-width': 2.2 }),
        el('circle', { cx: 228, cy: 201, r: 26, fill: 'none', stroke: c.ring, 'stroke-width': 2.2 }),
        P('M174 197 Q188 190 202 197 M122 197 L106 192 M254 197 L270 192', 'none', { stroke: c.ring, 'stroke-width': 2.2, 'stroke-linecap': 'round' }),
        P('M136 186 l7 -7', 'none', { stroke: '#FFFFFF', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: SLEEPY.test(p.pose) ? 0.35 : 0.6 })
      ]) : null
    ]);
    if (p.pose === 'flop') { const fb = flopBody(false, p, c, u, fur); return G({}, [fb.back, fb.body, head]); }
    if (p.pose === 'bow') { const bb = bowBody(false, p, c, u, fur); return G({}, [bb.back, bb.body, head]); }
    if (p.pose === 'sploot') { // のびて寝る：社員証は床に（25）。ひもはあごの下へ
      const sb = splootBody(false, p, c, u, fur), card = p.prop ? G({ transform: 'rotate(-14 236 384)' }, [P('M190 368 Q206 386 230 376', 'none', { stroke: c.theme, 'stroke-width': 3, 'stroke-linecap': 'round' }), el('rect', { x: 233, y: 366, width: 6, height: 6, rx: 1.5, fill: '#C9CED4', stroke: '#8E969E', 'stroke-width': 1 }), E(238, 400, 16, 4, '#3B2A20', { opacity: 0.2, filter: u('blurS') }), el('rect', { x: 226, y: 370, width: 22, height: 28, rx: 3, fill: '#FFFFFF', stroke: c.theme, 'stroke-width': 1.8 }), el('rect', { x: 230, y: 374, width: 14, height: 9, rx: 1, fill: c.head2 }), P('M230 388 H244 M230 393 H240', 'none', { stroke: '#9AA9B6', 'stroke-width': 1.8, 'stroke-linecap': 'round' })]) : null;
      return G({}, [sb.back, sb.body, splootPaws(false, c, u, fur), head, card]); }
    const shadow = E(210, 398, 130, 13, '#3B2A20', { opacity: 0.18, filter: u('blur') });
    return G({}, [shadow, body, lanyard, head]);
  }

  // ---------- 記号（吹き出しの代わり） ----------
  function symbols(p, isRen) {
    const kids = [];
    const ox = isRen ? 300 : 290, oy = 120;
    const ink = '#6E5848';
    const unflip = (x) => p.flip ? { transform: `translate(${x} 0) scale(-1 1) translate(${-x} 0)` } : {};
    if (p.zzz > 0) kids.push(el('text', Object.assign({ x: ox, y: oy, 'font-size': 44 * p.zzz, 'font-weight': 900, fill: ink, 'font-family': 'Zen Maru Gothic, sans-serif', opacity: p.zzz }, unflip(ox + 20)), [document.createTextNode('Zz')]));
    if (p.sweat > 0) kids.push(P(`M${ox + 10} ${oy - 20} Q${ox} ${oy} ${ox + 10} ${oy + 10} Q${ox + 20} ${oy} ${ox + 10} ${oy - 20} Z`, '#CFE2F1', { stroke: '#4E77A0', 'stroke-width': 2.5, opacity: p.sweat, transform: `scale(${0.6 + 0.6 * p.sweat}) translate(${(1 / (0.6 + 0.6 * p.sweat) - 1) * ox} ${(1 / (0.6 + 0.6 * p.sweat) - 1) * oy})` }));
    if (p.excl > 0) kids.push(G({ opacity: p.excl, transform: `translate(${ox} ${oy - 30}) scale(${p.excl})` }, [P('M0 0 v30', 'none', { stroke: '#C8463C', 'stroke-width': 7, 'stroke-linecap': 'round' }), el('circle', { cx: 0, cy: 44, r: 4.5, fill: '#C8463C' })]));
    if (p.question > 0) kids.push(el('text', Object.assign({ x: ox - 10, y: oy + 10, 'font-size': 52, 'font-weight': 900, fill: '#4E77A0', 'font-family': 'Zen Maru Gothic, sans-serif', opacity: p.question }, unflip(ox + 4)), [document.createTextNode('?')]));
    if (p.heart > 0) kids.push(P(`M${ox} ${oy - 10} C ${ox - 8} ${oy - 20} ${ox - 22} ${oy - 12} ${ox - 14} ${oy} L${ox} ${oy + 14} L${ox + 14} ${oy} C ${ox + 22} ${oy - 12} ${ox + 8} ${oy - 20} ${ox} ${oy - 10} Z`, '#E86A75', { opacity: p.heart, transform: `scale(${p.heart}) translate(${(1 / p.heart - 1) * ox} ${(1 / p.heart - 1) * oy})` }));
    if (p.sparkle > 0) kids.push(P(`M${ox} ${oy - 20} l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 Z`, '#D6A23C', { opacity: p.sparkle }));
    return G({}, kids);
  }

  // ---------- 公開API ----------
  function render(svg, params) {
    const p = Object.assign({}, DEFAULTS, params);
    const isRen = p.char === 'ren';
    const id = (p.id || p.char) + '_';
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.appendChild(defs(id, C[p.char], isRen));
    const flip = p.flip ? 'scale(-1 1) translate(-400 0)' : '';
    const g = G({ transform: `translate(${p.x} ${p.y}) scale(${p.scale}) ${flip}` }, [isRen ? buildRen(p, id) : buildJil(p, id), symbols(p, isRen)]);
    svg.appendChild(g);
    return p;
  }

  // タイムライン：keys = [{t, ...params}] を時刻tで補間
  function sample(keys, t) {
    if (t <= keys[0].t) return keys[0];
    if (t >= keys[keys.length - 1].t) return keys[keys.length - 1];
    let i = 0; while (keys[i + 1].t < t) i++;
    const a = keys[i], b = keys[i + 1], u = (t - a.t) / (b.t - a.t);
    const e = (b.ease === 'back' ? easeOutBack : b.ease === 'linear' ? (x => x) : easeIO)(u);
    const out = {};
    const all = Object.assign({}, a, b);
    for (const k in all) {
      const va = a[k] != null ? a[k] : b[k], vb = b[k] != null ? b[k] : a[k];
      out[k] = (typeof va === 'number' && typeof vb === 'number') ? lerp(va, vb, e) : (u < 0.5 ? va : vb);
    }
    return out;
  }

  // ---------- v2.1 生命感レイヤー（パラメータだけを足す。既存の描画は変えない） ----------
  // 疑似乱数（シードごとに同じまばたき位置になる → 再描画しても同じ動画になる）
  // 鼻のひくひく：鼻を少し持ち上げて縦にちぢめる（p.nose 0〜1。2026-11-18）
  const noseT = (p, x) => p.nose ? `translate(${x} 236) scale(${1 + 0.06 * p.nose} ${1 - 0.22 * p.nose}) translate(${-x} -236) translate(0 ${-1.5 * p.nose})` : '';
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  // 自動まばたき：3.5〜6.5秒ごとに0.14秒で閉じて開く。たまに二度まばたき（うさぎはまばたきが少ない。2026-11-18 に 2.2〜4.2 秒から変更）
  function blinkAt(t, seed) {
    let tt = 0.6 + hash(seed) * 1.5, k = 0;
    while (tt < t + 1) {
      const d = t - tt;
      if (d >= 0 && d < 0.14) return 1 - Math.sin(Math.PI * d / 0.14);
      if (hash(seed + k * 7.3) > 0.8) { const d2 = d - 0.22; if (d2 >= 0 && d2 < 0.14) return 1 - Math.sin(Math.PI * d2 / 0.14); }
      tt += 3.5 + hash(seed + k * 3.1) * 3.0; k++;
    }
    return 1;
  }
  // alive(p, t, opt): まばたき・呼吸・耳の揺れ（移動速度vxに遅れてついてくる慣性つき）を足す
  // opt = { seed, vx(移動速度px/s), blink:true, breathe:true, ears:true }
  function alive(p, t, opt) {
    opt = opt || {};
    const seed = opt.seed != null ? opt.seed : (p.char === 'ren' ? 1 : 2);
    const q = Object.assign({}, p);
    const closedFace = q.eyeShape === 'happy' || q.eyeShape === 'flat' || (q.eyeOpen != null && q.eyeOpen < 0.2);
    if (opt.blink !== false && !closedFace) q.eyeOpen = (q.eyeOpen != null ? q.eyeOpen : 1) * blinkAt(t, seed);
    if (opt.breathe !== false) q.bodySquash = (q.bodySquash || 0) + 0.018 * Math.sin(t * 3.6 + seed); { const w = (t + seed * 7) % 19; if (w < 1.6) q.bodySquash += 0.03 * Math.sin(w / 1.6 * Math.PI); }   // 19 秒に 1 回、少し深く息をつく   // 呼吸：1 分に約 34 回（うさぎの休んでいる時は 30〜60 回。前は約 23 回）
    if (opt.nose !== false && !(p.eyeOpen != null && p.eyeOpen < 0.2) && !SLEEPY.test(p.pose || '')) { const b = Math.floor(t / 1.6 + seed * 0.37), u = t / 1.6 + seed * 0.37 - b; q.nose = hash(b + seed * 5) > (Math.abs(opt.vx || 0) > 30 ? 0.05 : 0.35) && u < 0.45 ? Math.max(0, Math.sin(u / 0.45 * Math.PI * 4)) : 0; }   // 鼻のひくひく：1.6 秒ごとに、6 割ほどの確率で 4 回ひくひく（寝ている時・目を閉じている時はしない）
    if (opt.head !== false && !(p.eyeOpen != null && p.eyeOpen < 0.2) && !SLEEPY.test(p.pose || '')) { const b = Math.floor(t / 2.7 + seed), u = (t / 2.7 + seed) - b, tgt = (k) => (hash(k * 3.7 + seed) - 0.5) * 6, a = tgt(b - 1), z = tgt(b); q.headTilt = (q.headTilt || 0) + a + (z - a) * Math.min(1, u * 2.7 / 0.14); const w = u * 2.7; q.__lag = w < 0.7 ? -(z - a) * 1.6 * Math.sin(w / 0.7 * Math.PI * 1.5) * (1 - w / 0.7) : 0; }   // 耳は頭より遅れてゆれ、落ち着く   // 頭の向きを数秒ごとに小さく「くいっ」と変える（±3°、0.14 秒で。うさぎの頭の動きは短く素早い）
    if (opt.ears !== false) {
      const isRen = q.char === 'ren';
      const idle = (isRen ? 2.2 : 3.2) * Math.sin(t * (isRen ? 1.1 : 1.7) + seed * 2);   // たれ耳は重いので、ゆっくりゆれる
      const drag = Math.max(-1, Math.min(1, (opt.vx || 0) / 900)) * (isRen ? 14 : 10);
      const twitch = isRen ? 0 : (hash(Math.floor(t * 0.7) + seed) > 0.75 ? 7 * Math.max(0, Math.sin((t * 0.7 % 1) * Math.PI * 4)) : 0);
      const one = hash(Math.floor(t * 0.7) + seed * 9) > 0.5;   // ぴくっとするのは片耳ずつ（本物は片耳ずつ音の方へ向ける）
      q.earL = (q.earL || 0) + idle - drag - (one ? twitch : 0) + (q.__lag || 0);
      q.earR = (q.earR || 0) - idle * 0.8 - drag + (one ? 0 : twitch) + (q.__lag || 0);
    }
    return q;
  }
  // hop(t, t0, t1, x0, x1, opt): うさぎ跳びの移動。{x, yOff, squash, vx, moving} を返す
  function hop(t, t0, t1, x0, x1, opt) {
    opt = opt || {};
    const hops = opt.hops || Math.max(1, Math.round(Math.abs(x1 - x0) / 160));
    const h = opt.height || 46;
    if (t <= t0) return { x: x0, yOff: 0, squash: 0, vx: 0, moving: false };
    if (t >= t1) { const after = t - t1; const settle = after < 0.25 ? -0.25 * Math.sin(Math.PI * after / 0.25) : 0; return { x: x1, yOff: 0, squash: settle, vx: 0, moving: false }; }
    const u = (t - t0) / (t1 - t0), ph = u * hops, k = ph - Math.floor(ph), n = Math.floor(ph);
    const g = 0.12, ka = Math.min(1, Math.max(0, (k - g) / (1 - 2 * g)));   // 1 回の跳びの前後に、地面についている時間（ため・着地）を作る。前へ進むのは宙にいる間だけ
    const x = x0 + (x1 - x0) * (n + easeIO(ka)) / hops;
    const yOff = -h * (0.88 + 0.24 * hash(n * 5.3 + 1)) * Math.sin(Math.PI * ka);   // 跳ぶ高さは 1 回ごとに少し変わる
    const squash = k < 0.15 ? -0.3 * (1 - k / 0.15) : k > 0.85 ? -0.3 * ((k - 0.85) / 0.15) : 0.18 * Math.sin(Math.PI * k);
    return { x, yOff, squash, vx: (x1 - x0) / (t1 - t0), moving: true };
  }

  global.RIG = { render, FACES, POSES, DEFAULTS, sample, C, alive, hop, blinkAt };
})(window);
