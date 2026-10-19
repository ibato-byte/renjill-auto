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
      isRen ? null : lg('earIn', [[0, c.earIn1], [1, c.earIn2]], 0, 1)
    ].filter(Boolean));
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
      E(bodyCx, 304, bw, bh, u('body'), fur),
      // 後ろ脚（stretchで伸びる）
      sq > 0.2 ? E(bodyCx + bw * 0.78, 386, 54, 15, '#D6BB98', fur) : E(338, 386, 56, 15, '#D6BB98', fur),
      sq > 0.2 ? E(bodyCx + bw * 0.98, 392, 30, 12, c.cream, fur) : null,
      // 胸のクリーム
      E(176, 326 + 10 * Math.max(0, sq), 86, 74 * (1 - 0.2 * Math.max(0, sq)), u('cream'), fur),
      // 前足
      E(150, 390, 24, 13, '#F0E3D1', fur), E(204, 392, 24, 13, '#F0E3D1', fur)
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
        kids.push(E(cx + eyeDx, 195, 13, eyeRy, u('eye')));
        if (p.eyeShape === 'half') kids.push(P(`M${cx - 15} 186 h30 v-14 h-30 z`, u('head')));
        if (p.eyeShape === 'angry') kids.push(P(`M${cx - 16} 184 L${cx + 16} 192 L${cx + 16} 176 Z`, u('head')));
        kids.push(E(cx + eyeDx + 4.5, 189.5, 4, 3.2, '#FFFFFF', { opacity: 0.9 }));
        kids.push(P(`M${cx - 13} 192 Q${cx} 178 ${cx + 13} 192`, 'none', { stroke: '#5E4535', 'stroke-width': 1.6, opacity: 0.6 }));
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
    const head = G({ transform: `translate(0 ${p.headNod}) rotate(${p.headTilt} 180 240)` }, [
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
      E(222 + 30 * Math.max(0, sq), 322, bw, bh, u('body'), fur),
      E(300, 388 - 46 * lift, 42, 12, '#DABE9C', Object.assign({ transform: `rotate(${-30 * lift} 300 388)` }, fur)),
      E(184, 336, 64, 58, u('cream'), fur),
      E(164, 390, 19, 11, '#F3E8DA', fur), E(206, 391, 19, 11, '#F3E8DA', fur)
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
        kids.push(E(cx + eyeDx, 201, 18, eyeRy, u('eye')));
        if (p.eyeShape === 'half') kids.push(P(`M${cx - 20} 191 h40 v-18 h-40 z`, u('head')));
        if (p.eyeShape === 'angry') kids.push(P(`M${cx - 20} 186 L${cx + 20} 196 L${cx + 20} 176 Z`, u('head')));
        kids.push(E(cx + eyeDx + 6, 193, 5.2, 4.2, '#FFFFFF', { opacity: 0.92 }));
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

    const head = G({ transform: `translate(0 ${p.headNod}) rotate(${p.headTilt} 188 240)` }, [
      // 立ち耳（根元で回転）
      G({ transform: `rotate(${-12 + p.earL} 164 150)` }, [E(164, 118, 22, 36, u('ear'), fur), E(164, 121, 11, 26, u('earIn'))]),
      G({ transform: `rotate(${13 + p.earR} 212 150)` }, [E(212, 116, 22, 36, u('ear'), fur), E(212, 119, 11, 26, u('earIn'))]),
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
