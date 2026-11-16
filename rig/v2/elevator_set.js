// エレベーターの中のセット（2026-11-16 新規）。「エレベーター」シリーズ（第1話 elevator.js・第2話・第3話…）で共通に使う。
// 内装・ボタンの配置・照明・キャラの立ち位置と大きさを 1 か所にまとめ、話ごとに変えない（つながりが崩れないように）。
// 使い方：document.write('<script src="v2/elevator_set.js"><\/script>') → ELV.bg({ open, floor, lit, up }) を背景に、ELV.REN / ELV.JIL の位置でキャラを描く。
//   open … 扉の開き 0（閉）〜1（開）／ floor … 階の表示の数字／ lit … 光っているボタンの階の配列（例 [10,9,8]）／ glow … 押した直後の光の強さ { 階: 0..1 }
(function () {
  const ELV = {};
  // ---- 立ち位置（全話共通）。y はリグの左上。足もと＝GROUND ----
  ELV.GROUND = 1650;
  ELV.REN = { x: 250, s: 1.55 };   // ボタンの近く（右）。体の中心 ≒ x + 200*s
  ELV.JIL = { x: 0, s: 1.28 };     // 左どなり
  ELV.y = c => ELV.GROUND - 413 * c.s;
  // ---- ボタン（たてに 1 列。上が高い階）----
  // 位置は、レンのたれ耳の先が届く高さ（耳を振り上げた -88° 〜 たらした -30° の間）に合わせてある
  ELV.PANEL = { x: 922, y: 1040, w: 72, h: 450 };
  ELV.FLOORS = [8, 7, 6, 5, 4, 3, 2, 1];
  ELV.BTN = ELV.FLOORS.map((n, i) => ({ n, x: 958, y: 1160 + i * 29, r: 11.5 }));
  ELV.BX = 958;
  // ---- 色 ----
  const K = { wall1: '#ECE8E1', wall2: '#D8D2C8', seam: '#C2BBB0', steel1: '#F2F1EE', steel2: '#C9C6C0', steel3: '#A7A49E', floor1: '#CFC8BC', floor2: '#B9B1A4', ink: '#3B2412' };
  const defs = `<defs>
  <linearGradient id="elWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${K.wall1}"/><stop offset="1" stop-color="${K.wall2}"/></linearGradient>
  <linearGradient id="elSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#CFC8BD"/><stop offset="1" stop-color="#E4DFD6"/></linearGradient>
  <linearGradient id="elSideR" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#CFC8BD"/><stop offset="1" stop-color="#E4DFD6"/></linearGradient>
  <linearGradient id="elDoor" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${K.steel3}"/><stop offset=".18" stop-color="${K.steel1}"/><stop offset=".5" stop-color="${K.steel2}"/><stop offset=".82" stop-color="#E6E4E0"/><stop offset="1" stop-color="${K.steel3}"/></linearGradient>
  <linearGradient id="elFrame" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B9B6B0"/><stop offset=".5" stop-color="#ECEBE8"/><stop offset="1" stop-color="#ABA8A2"/></linearGradient>
  <linearGradient id="elFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${K.floor1}"/><stop offset="1" stop-color="${K.floor2}"/></linearGradient>
  <linearGradient id="elHall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8F1E6"/><stop offset=".7" stop-color="#EADFCF"/><stop offset=".7" stop-color="#E2D3BE"/><stop offset="1" stop-color="#D6C4AA"/></linearGradient>
  <linearGradient id="elCeil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7F5F1"/><stop offset="1" stop-color="#E3DED6"/></linearGradient>
  <radialGradient id="elLight" cx="50%" cy="0%" r="90%"><stop offset="0" stop-color="#FFF8E6" stop-opacity=".75"/><stop offset="1" stop-color="#FFF8E6" stop-opacity="0"/></radialGradient>
  <radialGradient id="elGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFC56B" stop-opacity=".95"/><stop offset=".45" stop-color="#FFB347" stop-opacity=".35"/><stop offset="1" stop-color="#FFB347" stop-opacity="0"/></radialGradient>
  <linearGradient id="elPlate" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C7C4BE"/><stop offset=".35" stop-color="#F0EFEC"/><stop offset="1" stop-color="#B6B3AD"/></linearGradient>
  <radialGradient id="elBtnOff" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#E4E2DE"/><stop offset="1" stop-color="#B9B6B0"/></radialGradient>
  <radialGradient id="elBtnOn" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#FFF6DA"/><stop offset=".55" stop-color="#FFC861"/><stop offset="1" stop-color="#F29A2E"/></radialGradient>
  <clipPath id="elOpening"><rect x="276" y="486" width="528" height="1004"/></clipPath>
  </defs>`;
  // 階の表示（扉の上）
  ELV.indicator = (n, up = true, pulse = 0) => `<g transform="translate(540 410)"><rect x="-112" y="-50" width="224" height="104" rx="18" fill="${K.ink}" opacity=".16"/><rect x="-116" y="-58" width="232" height="104" rx="18" fill="url(#elFrame)"/><rect x="-100" y="-44" width="200" height="76" rx="10" fill="#1E232C"/><rect x="-100" y="-44" width="200" height="10" rx="5" fill="#000" opacity=".35"/>`
    + (up ? `<path d="M-76 6 L-58 -22 L-40 6Z" fill="#7CF0A8" opacity="${.75 + .25 * pulse}"/>` : '')
    + `<text x="22" y="20" text-anchor="middle" font-size="64" font-weight="900" font-family="Noto Sans Mono, monospace" fill="#FF8A5B" opacity=".35" stroke="#FF8A5B" stroke-width="8" stroke-linejoin="round">${n}</text><text x="22" y="20" text-anchor="middle" font-size="64" font-weight="900" font-family="Noto Sans Mono, monospace" fill="#FF8A5B">${n}</text><path d="M-92 -40 L-30 -40 L-62 28 L-92 28Z" fill="#fff" opacity=".05"/></g>`;
  // ボタンの板（扉の右がわ）。lit：光っている階の配列、glow：押した直後の強い光
  ELV.panel = (lit = [], glow = {}) => {
    const P = ELV.PANEL, on = new Set(lit);
    let s = `<g><rect x="${P.x + 6}" y="${P.y + 10}" width="${P.w}" height="${P.h}" rx="16" fill="${K.ink}" opacity=".16"/><rect x="${P.x}" y="${P.y}" width="${P.w}" height="${P.h}" rx="16" fill="url(#elPlate)" stroke="#A29F99" stroke-width="3"/><rect x="${P.x + 8}" y="${P.y + 8}" width="14" height="${P.h - 16}" rx="7" fill="#fff" opacity=".35"/>`
      // 上の小さな表示と、下の開・閉ボタン（光らない）
      + `<rect x="${P.x + 16}" y="${P.y + 22}" width="${P.w - 32}" height="40" rx="6" fill="#1E232C"/><circle cx="${P.x + P.w / 2}" cy="${P.y + 42}" r="5" fill="#7CF0A8" opacity=".8"/>`
      + [[0, -50, '◀▶'], [0, -18, '▶◀']].map(([dx, dy, g]) => `<circle cx="${ELV.BX + dx}" cy="${P.y + P.h + dy}" r="12" fill="url(#elBtnOff)" stroke="#9C9993" stroke-width="2"/><text x="${ELV.BX + dx}" y="${P.y + P.h + dy + 4}" text-anchor="middle" font-size="10" font-weight="900" fill="#6E6A64" font-family="Noto Sans CJK JP">${g}</text>`).join('');
    for (const b of ELV.BTN) {
      const o = on.has(b.n), g = glow[b.n] || 0;
      if (o) s += `<circle cx="${b.x}" cy="${b.y}" r="${b.r * (2.6 + 1.4 * g)}" fill="url(#elGlow)" opacity="${.55 + .45 * g}"/>`;
      s += `<circle cx="${b.x}" cy="${b.y + 2}" r="${b.r + 3}" fill="#8E8B85" opacity=".5"/><circle cx="${b.x}" cy="${b.y}" r="${b.r * (1 - .12 * g)}" fill="url(#elBtn${o ? 'On' : 'Off'})" stroke="${o ? '#E08A22' : '#9C9993'}" stroke-width="2.5"/>`
        + `<text x="${b.x}" y="${b.y + 5}" text-anchor="middle" font-size="14" font-weight="900" font-family="Noto Sans, sans-serif" fill="${o ? '#7A3E06' : '#6E6A64'}">${b.n}</text>`;
    }
    return s + `</g>`;
  };
  // 背景ぜんぶ（壁・天井の照明・扉・床・階の表示・ボタン）
  ELV.bg = (o = {}) => {
    const open = o.open || 0, d = 264 * open;
    const seams = [150, 930].map(x => `<rect x="${x}" y="260" width="3" height="1250" fill="${K.seam}" opacity=".6"/>`).join('');
    return defs
      // 壁と左右の側壁（奥行き）
      + `<rect x="-500" y="-500" width="2080" height="2920" fill="url(#elWall)"/>`
      + `<path d="M-500 -500 L60 260 L60 1510 L-500 2100Z" fill="url(#elSide)"/><path d="M1580 -500 L1020 260 L1020 1510 L1580 2100Z" fill="url(#elSideR)"/>`
      + `<path d="M60 260 L60 1510" stroke="#B7B0A5" stroke-width="4"/><path d="M1020 260 L1020 1510" stroke="#B7B0A5" stroke-width="4"/>`
      // 手すり（左右の側壁）
      + `<path d="M-120 1150 L60 1110" stroke="#B9B6B0" stroke-width="18" stroke-linecap="round"/><path d="M-120 1150 L60 1110" stroke="#F2F1EE" stroke-width="6" stroke-linecap="round"/><path d="M1200 1150 L1020 1110" stroke="#B9B6B0" stroke-width="18" stroke-linecap="round"/><path d="M1200 1150 L1020 1110" stroke="#F2F1EE" stroke-width="6" stroke-linecap="round"/>`
      + seams
      // 天井と照明
      + `<path d="M-500 -500 L1580 -500 L1020 260 L60 260Z" fill="url(#elCeil)"/><rect x="60" y="248" width="960" height="14" fill="#C9C3B9"/>`
      + `<g>${[200, 420, 660, 880].map(x => `<rect x="${x - 70}" y="120" width="140" height="44" rx="12" fill="#FFFBEF"/><rect x="${x - 70}" y="120" width="140" height="44" rx="12" fill="none" stroke="#E0D9CC" stroke-width="3"/>`).join('')}</g>`
      + `<ellipse cx="540" cy="300" rx="760" ry="900" fill="url(#elLight)"/>`
      // 扉のわく・向こうの廊下・扉
      + `<rect x="250" y="462" width="580" height="1048" rx="8" fill="url(#elFrame)"/><rect x="250" y="462" width="580" height="10" rx="5" fill="#fff" opacity=".6"/>`
      + `<g clip-path="url(#elOpening)"><rect x="276" y="486" width="528" height="1004" fill="url(#elHall)"/><rect x="276" y="1180" width="528" height="10" fill="#FFFDF8" opacity=".7"/><g transform="translate(700 1290) scale(.55)" opacity=".85"><ellipse cx="0" cy="2" rx="80" ry="14" fill="#5A3A1E" opacity=".18"/><ellipse cx="-40" cy="-150" rx="34" ry="80" fill="#7DB87A" transform="rotate(-20 -40 -150)"/><ellipse cx="40" cy="-160" rx="34" ry="80" fill="#5E9C5E" transform="rotate(20 40 -160)"/><ellipse cx="0" cy="-210" rx="30" ry="80" fill="#7DB87A"/><path d="M-55 0 L-45 -110 L45 -110 L55 0Z" fill="#C97A55"/></g>`
      + [[276 - d, 1], [540 + d, -1]].map(([x, k]) => `<g><rect x="${x}" y="486" width="264" height="1004" fill="url(#elDoor)"/><rect x="${x}" y="486" width="264" height="1004" fill="none" stroke="#9E9B95" stroke-width="3"/><path d="M${x + 40} 486 L${x + 96} 486 L${x + 30} 1490 L${x - 26} 1490Z" fill="#fff" opacity=".16"/><rect x="${x + (k > 0 ? 258 : 0)}" y="486" width="6" height="1004" fill="#8E8B85" opacity=".6"/></g>`).join('')
      + `<rect x="276" y="486" width="528" height="22" fill="${K.ink}" opacity=".12"/></g>`
      // 床（扉の前のしきい・床のつや）
      + `<rect x="-500" y="1490" width="2080" height="1000" fill="url(#elFloor)"/><rect x="250" y="1490" width="580" height="22" fill="#9E9B95"/><rect x="250" y="1490" width="580" height="6" fill="#E6E4E0"/>`
      + `<path d="M-500 2100 L60 1510 L1020 1510 L1580 2100Z" fill="url(#elFloor)"/><path d="M60 1510 L1020 1510" stroke="#A9A194" stroke-width="5"/>`
      + [1600, 1720, 1880].map((y, i) => `<path d="M${-40 - i * 60} ${y} L${1120 + i * 60} ${y}" stroke="#A9A194" stroke-width="${2 + i}" opacity=".35"/>`).join('')
      + `<ellipse cx="540" cy="1560" rx="420" ry="40" fill="#fff" opacity=".12"/>`
      + ELV.indicator(o.floor == null ? 1 : o.floor, o.up !== false, o.pulse || 0)
      + ELV.panel(o.lit || [], o.glow || {});
  };
  // レンの右の耳（たれ耳）が、ボタン b にふれているか（DOM の実際の耳の形で判定する＝絵と音が必ず合う）
  ELV.earTouch = function () {
    const svg = document.getElementById('ren'); if (!svg) return [];
    const ear = [...svg.querySelectorAll('path')].find(p => /^M\s*226 112/.test(p.getAttribute('d') || ''));
    if (!ear || !ear.isPointInFill) return [];
    const m = ear.getCTM && ear.getCTM(); if (!m) return [];
    const inv = m.inverse(); // getCTM＝耳の中の座標 → svg の座標（＝世界の座標）。その逆
    const pt = svg.createSVGPoint ? svg.createSVGPoint() : new DOMPoint();
    const hit = [];
    for (const b of ELV.BTN) {
      let on = false;
      for (const [dx, dy] of [[0, 0], [-b.r * .55, 0], [0, -b.r * .5], [0, b.r * .5]]) { pt.x = b.x + dx; pt.y = b.y + dy; const q = pt.matrixTransform(inv); if (ear.isPointInFill(q)) { on = true; break; } }
      if (on) hit.push(b.n);
    }
    return hit;
  };
  window.ELV = ELV;
})();
