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
    sploot:  { pose: 'sploot', bodySquash: 0, bodyTilt: 0, headTilt: 3, headNod: 92, legLift: 0, earL: 0, earR: 0 }, // のびて寝る（あごを前足にのせる高さ）
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
    const S = isRen ? 1 : 0.8, hx = isRen ? 180 : 188, gy = 398;
    const wrap = kids => G({ transform: `translate(${hx} ${gy}) scale(${S}) translate(-180 -398)` }, kids);
    const back = [ // 体のうしろに隠れる物
      E(400, 396, 230, 13, '#3B2A20', { opacity: 0.2, filter: u('blur') }),                                             // 1 床のかげ：広く低い（体が床に広がる）
      E(330, 395, 170, 6, '#2E2018', { opacity: 0.32, filter: u('blurS') }),                                             // 2 床に付いている所の、濃く細いかげ
      // 3 奥の後ろ足：まっすぐ後ろへ。体より少し高く・小さく・暗く（遠いので）
      G({ opacity: 0.9 }, [P('M424 338 C 468 330 526 333 566 341 C 586 345 588 357 572 360 C 538 364 478 360 436 356 Z', u('foot'), fur),
        P('M532 336 C 560 338 584 346 586 355 C 570 352 548 349 528 348 Z', '#7A5D44', { opacity: 0.45, filter: u('blurS') }), E(440, 352, 60, 8, '#4A3424', { opacity: 0.2, filter: u('blurS') })]), // 4 足の裏（上を向く。毛が少し暗い）
    ];
    const body = [
      // 5 体：長く低い。肩から腰へ少し上がり、お尻で丸く下がる。おなかは床に平ら（下のふちがまっすぐ）
      P('M214 300 C 228 286 252 278 276 279 C 300 280 318 290 344 289 C 380 287 404 268 436 268 C 470 268 494 292 498 326 C 502 358 492 384 470 394 L 222 396 C 206 380 204 320 214 300 Z', u('body'), fur), // 肩のふくらみ・腰の前のくぼみ・腰の骨で高く・お尻は丸く
      // 6 おなかが床に押されて、横へふくらむ（下のふちの毛）
      P('M222 392 C 300 400 400 401 476 390', 'none', { stroke: c.fur2 || '#B8956C', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: 0.55, filter: u('blurS') }),
      // 7 体の下半分のかげ（床に近い所は暗い）
      P('M218 352 C 300 366 400 368 486 350 L 478 390 L 222 394 Z', '#6E5034', { opacity: 0.22, filter: u('blur') }),
      // 8 背中の光（首から腰へ）・9 背骨のゆるい線
      P('M236 292 C 256 282 290 282 320 292 C 350 296 390 274 440 274 C 466 276 484 290 490 304', 'none', { stroke: '#FFF4E2', 'stroke-width': 14, 'stroke-linecap': 'round', opacity: 0.3, filter: u('blur') }),
      P('M262 286 C 296 284 320 296 346 294 C 380 292 404 276 440 276', 'none', { stroke: '#9C7A55', 'stroke-width': 2.2, 'stroke-linecap': 'round', opacity: 0.22 }),
      E(270, 292, 30, 12, '#F6E6CC', { opacity: 0.3, filter: u('blurS') }), // 肩甲骨のふくらみの光
      // 10 腰の骨のふくらみ（いちばん高い所）
      E(436, 280, 34, 13, '#F6E6CC', { opacity: 0.38, filter: u('blurS') }), E(340, 300, 26, 9, '#8E6C4A', { opacity: 0.16, filter: u('blurS') }), // 腰の前のくぼみのかげ
      // 11 横に倒れたもも（平たく、外へ広がる）
      haunch(440, 352, 52, 34, u, fur),
      // 12 わき腹の毛の流れ（3 本）
      ...[[300, 318], [340, 322], [380, 320]].map(([x, y]) => P(`M${x} ${y} q 14 10 30 12`, 'none', { stroke: '#A5845F', 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: 0.35 })),
      // 13 白いしっぽ：お尻の上に、ぺたんと寝る
      E(494, 334, 16, 13, '#FBF5EC', fur), E(496, 338, 10, 7, '#E5D8C6', { opacity: 0.6, filter: u('blurS') }),
      // 14 手前の後ろ足：まっすぐ後ろへ投げ出す。かかと（15）が上へ少しとがり、足の裏（16）が上・うしろを向く。つま先（17）は丸い毛
      P('M432 368 C 476 362 534 366 584 375 C 604 379 608 393 590 397 C 550 400 484 399 436 396 C 424 390 424 372 432 368 Z', u('foot'), fur),
      P('M530 369 C 566 371 598 379 602 390 C 588 387 556 383 526 381 Z', '#8B6B4E', { opacity: 0.45, filter: u('blurS') }), // 足の裏：上・うしろを向いた、濃い毛の面
      E(450, 372, 13, 7, '#E9D2B0', { opacity: 0.6, filter: u('blurS') }),
      E(598, 390, 12, 8, '#F3E6D2', { opacity: 0.6, filter: u('blurS') }),
      P('M586 394 q 6 -6 4 -14 M574 395 q 6 -6 4 -15', 'none', { stroke: '#9E7F5D', 'stroke-width': 1.5, 'stroke-linecap': 'round', opacity: 0.45 }), // 18 指の分かれ目
      P('M436 396 L 580 397', 'none', { stroke: '#3B2A20', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.22, filter: u('blurS') }), // 19 足の下の細いかげ
      // 20 胸のクリーム：床に押されて横に広がる
      E(200, 372, 72, 28, u('cream'), fur),
      // 21 首の毛：頭と体の間にすき間を作らない
      E(236, 318, 44, 40, u('body'), fur),
      // 22 前足：前へのばして平たく（あごの下）。左右で少しずらす（そろえない）
      frontPaw(146, 389, 25, 9, u, fur, c.cream, null), frontPaw(214, 392, 25, 9, u, fur, c.cream, null),
      // 23 あごの下の小さなかげ（頭が前足にのっている）
      E(180, 384, 70, 8, '#5A4030', { opacity: 0.18, filter: u('blurS') }),
    ];
    return { back: wrap(back), body: wrap(body) };
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
        kids.push(P(`M${cx - 13} 196 Q${cx} 202 ${cx + 13} 196`, 'none', { stroke: c.eye2, 'stroke-width': 4, 'stroke-linecap': 'round' }));
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
      pout:  E(180, 246, 5, 6, '#C9605F', { stroke: c.mouth, 'stroke-width': 1.8 })
    }[p.mouth] || null;

    const earRot = (side, deg) => `rotate(${deg} ${side < 0 ? 130 : 230} 120)`;
    // ホーランドロップの耳：頭頂の横から外へふわっと広がり、丸い先端が頬の外側に垂れる
    const earL = G({ transform: earRot(-1, -p.earL) }, [
      P('M134 112 C 100 102 56 126 40 180 C 26 230 28 286 52 306 C 74 324 106 306 112 272 C 118 238 110 204 106 172 C 102 146 114 124 134 112 Z', u('ear'), fur),
      // 先端の丸いふくらみ
      E(66, 296, 24, 12, c.ear3, { opacity: 0.22, filter: u('blurS') }),
      // 付け根の折れ
      P('M112 122 C 122 112 136 110 150 118', 'none', { stroke: c.ear3, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.5 })
    ]);
    const earR = G({ transform: earRot(1, p.earR) }, [
      P('M226 112 C 260 102 304 126 320 180 C 334 230 332 286 308 306 C 286 324 254 306 248 272 C 242 238 250 204 254 172 C 258 146 246 124 226 112 Z', u('ear'), fur),
      E(294, 296, 24, 12, c.ear3, { opacity: 0.22, filter: u('blurS') }),
      P('M248 122 C 238 112 224 110 210 118', 'none', { stroke: c.ear3, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.5 })
    ]);
    const head = G({ transform: `translate(0 ${p.headNod}) rotate(${p.headTilt} 180 240)` + (p.pose === 'sploot' ? ' translate(0 292) scale(1.02 0.96) translate(0 -292)' : '') }, [ // 寝る時：あごが前足に押されて、少しつぶれる（26）
      // 頭
      P('M180 105 C 252 105 292 150 292 202 C 292 258 246 292 180 292 C 114 292 68 258 68 202 C 68 150 108 105 180 105 Z', u('head'), fur),
      E(180, 250, 70, 34, '#E9D3B6', { opacity: 0.75, filter: u('blur') }),
      // クラウン（ふわっと盛り上がった頭頂）
      E(180, 108, 46, 13, '#E3C7A3', { opacity: 0.7, filter: u('blurS') }),
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
      P('M173 229 Q180 225 187 229 Q184 235 180 236 Q176 235 173 229 Z', c.nose),
      mouthEl,
      E(124, 228, 15, 9, c.blush, { opacity: 0.55 * p.blush }), E(236, 228, 15, 9, c.blush, { opacity: 0.55 * p.blush }),
      P('M158 240 Q122 230 92 229 M158 246 Q124 247 96 254 M202 240 Q238 230 268 229 M202 246 Q236 247 264 254', 'none', { stroke: '#FBF6EE', 'stroke-width': 1.1, opacity: 0.85 })
    ]);

    if (p.pose === 'sploot') { // のびて寝る：体は splootBody。ネクタイは、あごの下から先だけ床にのぞく（24）
      const sb = splootBody(true, p, c, u, fur), tieTip = p.prop ? G({ transform: 'rotate(-62 214 396)' }, [P('M206 392 L222 392 L218 404 L210 404 Z', c.theme, { opacity: 0.95 })]) : null;
      const earRest = G({ transform: `translate(0 ${p.headNod})` }, [E(70, 304, 34, 6, '#3B2A20', { opacity: 0.2, filter: u('blurS') }), E(290, 304, 34, 6, '#3B2A20', { opacity: 0.2, filter: u('blurS') })]); // 20 床に付いた耳先のかげ
      return G({}, [sb.back, sb.body, earRest, tieTip, head]); }
    const shadow = E(215 + 40 * Math.max(0, sq), 398, 170 * (1 + 0.3 * Math.max(0, sq)), 14, '#3B2A20', { opacity: 0.18, filter: u('blur') });
    return G({}, [shadow, body, tie, head]);
  }

  // ---------- ジル（ネザーランドドワーフ） ----------
  function buildJil(p, id) {
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
        kids.push(P(`M${cx - 16} 202 Q${cx} 209 ${cx + 16} 202`, 'none', { stroke: c.eye2, 'stroke-width': 4.5, 'stroke-linecap': 'round' }));
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
      pout:  E(188, 246, 5, 6, '#C9605F', { stroke: c.mouth, 'stroke-width': 1.8 })
    }[p.mouth] || null;

    const head = G({ transform: `translate(0 ${p.headNod}) rotate(${p.headTilt} 188 240)` + (p.pose === 'sploot' ? ' translate(0 290) scale(1.02 0.96) translate(0 -290)' : '') }, [
      // 立ち耳（根元で回転）
      ...(p.pose === 'sploot' ? [ // 寝る時の立ち耳：首のうしろへ寝かせる。前からは短く、外へ倒れて見え、内側の桃色はほとんど見えない（27・28）
        G({ transform: 'translate(176 146) rotate(96) scale(0.8 1.55) translate(-176 -146)' }, [E(176, 112, 20, 36, u('ear'), fur)]),   // 奥の耳：少し高く
        G({ transform: 'translate(212 152) rotate(106) scale(0.86 1.6) translate(-212 -152)' }, [E(212, 118, 21, 36, u('ear'), fur), E(212, 112, 6, 22, '#FFF2DE', { opacity: 0.3, filter: u('blurS') }), P('M204 84 Q212 118 206 150', 'none', { stroke: '#A3754C', 'stroke-width': 2, opacity: 0.35 })])] : [
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
      P('M181 229 Q188 225 195 229 Q192 235 188 236 Q184 235 181 229 Z', c.nose),
      mouthEl,
      E(118, 232, 14, 8, c.blush, { opacity: 0.55 * p.blush }), E(258, 232, 14, 8, c.blush, { opacity: 0.55 * p.blush }),
      P('M166 240 Q130 230 98 226 M166 246 Q132 248 102 256 M210 240 Q246 230 278 226 M210 246 Q244 248 274 256', 'none', { stroke: '#FBF6EE', 'stroke-width': 1.1, opacity: 0.9 }),
      // メガネ
      p.prop ? G({}, [
        el('circle', { cx: 148, cy: 201, r: 26, fill: 'none', stroke: c.ring, 'stroke-width': 2.2 }),
        el('circle', { cx: 228, cy: 201, r: 26, fill: 'none', stroke: c.ring, 'stroke-width': 2.2 }),
        P('M174 197 Q188 190 202 197 M122 197 L106 192 M254 197 L270 192', 'none', { stroke: c.ring, 'stroke-width': 2.2, 'stroke-linecap': 'round' }),
        P('M136 186 l7 -7', 'none', { stroke: '#FFFFFF', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.6 })
      ]) : null
    ]);
    if (p.pose === 'sploot') { // のびて寝る：社員証は床に（25）。ひもはあごの下へ
      const sb = splootBody(false, p, c, u, fur), card = p.prop ? G({ transform: 'rotate(-14 236 384)' }, [P('M196 372 Q214 380 230 378', 'none', { stroke: c.theme, 'stroke-width': 3 }), el('rect', { x: 226, y: 370, width: 22, height: 28, rx: 3, fill: '#FFFFFF', stroke: c.theme, 'stroke-width': 1.8 }), el('rect', { x: 230, y: 374, width: 14, height: 9, rx: 1, fill: c.head2 }), P('M230 388 H244 M230 393 H240', 'none', { stroke: '#9AA9B6', 'stroke-width': 1.8, 'stroke-linecap': 'round' })]) : null;
      return G({}, [sb.back, sb.body, head, card]); }
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
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  // 自動まばたき：2.2〜4.2秒ごとに0.14秒で閉じて開く。たまに二度まばたき
  function blinkAt(t, seed) {
    let tt = 0.6 + hash(seed) * 1.5, k = 0;
    while (tt < t + 1) {
      const d = t - tt;
      if (d >= 0 && d < 0.14) return 1 - Math.sin(Math.PI * d / 0.14);
      if (hash(seed + k * 7.3) > 0.8) { const d2 = d - 0.22; if (d2 >= 0 && d2 < 0.14) return 1 - Math.sin(Math.PI * d2 / 0.14); }
      tt += 2.2 + hash(seed + k * 3.1) * 2.0; k++;
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
    if (opt.breathe !== false) q.bodySquash = (q.bodySquash || 0) + 0.025 * Math.sin(t * 2.4 + seed);
    if (opt.ears !== false) {
      const isRen = q.char === 'ren';
      const idle = (isRen ? 2.2 : 3.2) * Math.sin(t * 1.7 + seed * 2);
      const drag = Math.max(-1, Math.min(1, (opt.vx || 0) / 900)) * (isRen ? 14 : 10);
      const twitch = isRen ? 0 : (hash(Math.floor(t * 0.7) + seed) > 0.75 ? 7 * Math.max(0, Math.sin((t * 0.7 % 1) * Math.PI * 4)) : 0);
      q.earL = (q.earL || 0) + idle - drag - twitch;
      q.earR = (q.earR || 0) - idle * 0.8 - drag + twitch * 0.6;
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
    const u = (t - t0) / (t1 - t0), ph = u * hops, k = ph - Math.floor(ph);
    const x = x0 + (x1 - x0) * (Math.floor(ph) + easeIO(k)) / hops;
    const yOff = -h * Math.sin(Math.PI * k);
    const squash = k < 0.15 ? -0.3 * (1 - k / 0.15) : k > 0.85 ? -0.3 * ((k - 0.85) / 0.15) : 0.18 * Math.sin(Math.PI * k);
    return { x, yOff, squash, vx: (x1 - x0) / (t1 - t0), moving: true };
  }

  global.RIG = { render, FACES, POSES, DEFAULTS, sample, C, alive, hop, blinkAt };
})(window);
