// 休憩室のセット（2026-11-21 新規）。連載「休憩室のこたつ」（breakroom1・2・3）で共通に使う。
// オーナーの決まり：前の話の最後と次の話の冒頭がつながるように、座る位置・布団のめくれ方・書類・ハンコ・ノートPC・みかんの位置をそろえる → ここで1か所に決める。
// 使い方：document.write('<script src="v2/breakroom_set.js"><\/script>')（クリを使うので v2/elevator_set.js も読む）
//   BR.bg(o) … 部屋（壁・窓・時計・札「休憩室」・床）
//   BR.kotatsu(o) … こたつ（天板・布団）と天板の上の小物。キャラの前（#fx）に描く。o は下の STATE を参照
(function () {
  const BR = {};
  // ---- 立ち位置（3話とも同じ）。ユズは左で右向き（flip）、モチは右で左向き ----
  BR.JIL = { x: 56, y: 776, s: 1.15, flip: true };
  BR.REN = { x: 546, y: 740, s: 1.3, flip: false };
  // ---- こたつ ----
  BR.K = { cx: 540, backY: 1168, frontY: 1244, backHalf: 285, frontHalf: 325, floor: 1650 };
  // 天板の上の小物の位置（3話とも同じ）
  BR.P = {
    papers: { x: 736, y: 1222 },   // モチの書類の束
    hanko: { x: 818, y: 1224 },    // ハンコ（朱肉はその奥）
    pad: { x: 842, y: 1198 },      // 朱肉
    laptop: { x: 362, y: 1220 },   // ユズのノートPC（画面はユズの方＝左を向いて開く）
    bowl: { x: 540, y: 1196 },     // みかんのかご
    peeled: { x: 640, y: 1218 },   // むいてあるみかん
  };
  // 布団の中（ユズの後ろ足・クリ）。めくった所から見える
  BR.FOOT = { x0: 330, y: 1560 };          // ユズの後ろ足の付け根（左の布団の中）
  BR.LIFT = { cx: 800, w: 380 };           // モチがめくる所（布団の前の右はし＝モチの近く）
  const C = { wall: '#F3E6D2', wall2: '#E9D6BC', base: '#C9A57E', floor1: '#D8C2A2', floor2: '#C4A985', wood: '#A36A40', wood2: '#6E4428', fut1: '#7FA3C7', fut2: '#5E83AA', futL: '#E8F0F7', ink: '#3B2412' };
  const A = o => Object.entries(o).map(([k, v]) => `${k}="${v}"`).join(' ');
  // ---- 部屋 ----
  BR.bg = (o = {}) => {
    const t = o.t || 0;
    let s = `<defs><linearGradient id="brWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.wall}"/><stop offset="1" stop-color="${C.wall2}"/></linearGradient>
      <linearGradient id="brFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.floor1}"/><stop offset="1" stop-color="${C.floor2}"/></linearGradient>
      <linearGradient id="brSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFD9EE"/><stop offset="1" stop-color="#EAF3F8"/></linearGradient>
      <radialGradient id="brSun" cx=".3" cy=".2" r=".9"><stop offset="0" stop-color="#FFF4D8" stop-opacity=".85"/><stop offset="1" stop-color="#FFF4D8" stop-opacity="0"/></radialGradient></defs>`;
    s += `<rect x="-600" y="-600" width="2280" height="3120" fill="url(#brWall)"/>`;
    // 腰板
    s += `<rect x="-600" y="1180" width="2280" height="260" fill="#E2CDB0"/><rect x="-600" y="1176" width="2280" height="10" fill="${C.base}"/>`;
    // 窓（寒い朝：外は白っぽい空・窓のすみに霜）
    s += `<g transform="translate(560 300)"><rect x="-270" y="-10" width="540" height="430" rx="14" fill="#FFFDF8"/><rect x="-250" y="10" width="500" height="390" rx="6" fill="url(#brSky)"/>`
      + `<path d="M-250 330 q60 -40 120 -10 q70 30 140 -20 q60 -30 120 10 q40 20 70 0 V400 H-250Z" fill="#FFFFFF" opacity=".9"/>`
      + `<rect x="-6" y="10" width="12" height="390" fill="#FFFDF8"/><rect x="-250" y="196" width="500" height="10" fill="#FFFDF8"/>`
      + `<path d="M-250 10 q40 10 50 50 q-30 -10 -50 0Z M250 10 q-40 14 -46 52 q24 -14 46 -6Z M-250 400 q30 -30 70 -30 q-40 10 -70 30Z" fill="#FFFFFF" opacity=".85"/>`
      + `<ellipse cx="-100" cy="120" rx="320" ry="260" fill="url(#brSun)"/></g>`;
    // 時計（朝 9:00 ごろ）
    const mm = (o.min != null ? o.min : 2) * 6, hh = (9 + (o.min != null ? o.min : 2) / 60) * 30;
    s += `<g transform="translate(140 470)"><circle r="74" fill="#FFFDF8" stroke="#8C603C" stroke-width="10"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => `<rect x="-3" y="-62" width="6" height="${i % 3 ? 8 : 14}" fill="#8C603C" transform="rotate(${i * 30})"/>`).join('')}`
      + `<rect x="-5" y="-40" width="10" height="44" rx="5" fill="${C.ink}" transform="rotate(${hh})"/><rect x="-3.5" y="-58" width="7" height="62" rx="3.5" fill="${C.ink}" transform="rotate(${mm})"/><circle r="7" fill="#C8263C"/></g>`;
    // 棚（ポット・湯のみ）
    s += `<g transform="translate(920 560)"><rect x="-120" y="70" width="240" height="16" rx="6" fill="${C.wood}"/><rect x="-60" y="-10" width="70" height="80" rx="18" fill="#E8EEF2" stroke="#B7C3CB" stroke-width="4"/><rect x="-50" y="-26" width="50" height="20" rx="8" fill="#B7C3CB"/>`
      + `<rect x="34" y="34" width="34" height="36" rx="8" fill="#7FA36E"/><rect x="74" y="40" width="30" height="30" rx="8" fill="#D98B5F"/></g>`;
    // 床
    s += `<rect x="-600" y="1436" width="2280" height="1200" fill="url(#brFloor)"/>` + [1500, 1580, 1690, 1830].map((y, i) => `<path d="M-600 ${y} H1680" stroke="#B49672" stroke-width="${2 + i}" opacity=".35"/>`).join('');
    // こたつの下の敷きもの（ラグ）
    s += `<ellipse cx="${BR.K.cx}" cy="1640" rx="620" ry="70" fill="#C9B79A" opacity=".55"/><ellipse cx="${BR.K.cx}" cy="1640" rx="580" ry="58" fill="#E3D4BA" opacity=".6"/>`;
    // 札「休憩室」（入口のわく。第1話の最初に寄る）
    s += `<g transform="translate(${BR.SIGN.x} ${BR.SIGN.y})"><rect x="-150" y="-52" width="300" height="104" rx="14" fill="${C.ink}" opacity=".15" transform="translate(5 7)"/><rect x="-150" y="-52" width="300" height="104" rx="14" fill="#FFFDF8" stroke="#8C603C" stroke-width="7"/>`
      + `<text y="22" text-anchor="middle" font-family="Noto Sans CJK JP, sans-serif" font-weight="900" font-size="62" fill="${C.ink}" letter-spacing="6">休憩室</text></g>`;
    return s;
  };
  BR.SIGN = { x: 260, y: 150 };   // 札の場所（世界の座標）
  // ---- 天板の上の小物 ----
  function papersSvg(p, k) {   // k = { lift（持ち上げ 0〜1）, tilt（deg）, n }
    const n = k.n || 9, lift = k.lift || 0, sx = p.x, sy = p.y - 40 * lift;
    let s = `<g transform="translate(${sx} ${sy}) rotate(${k.tilt || 0})">`;
    for (let i = 0; i < n; i++) { const off = (k.mess || 0) * Math.sin(i * 2.3) * 6; s += `<path d="M${-62 + off} ${-i * 3.2} L${58 + off} ${-i * 3.2} L${70 + off} ${12 - i * 3.2} L${-50 + off} ${12 - i * 3.2}Z" fill="${i % 2 ? '#FFFFFF' : '#F4EFE6'}" stroke="#CDBFAA" stroke-width="1.6"/>`; }
    s += `<path d="M-34 ${-n * 3.2 + 4} L30 ${-n * 3.2 + 4}" stroke="#8C7B66" stroke-width="3" opacity=".35"/></g>`;
    return s;
  }
  function hankoSvg(p, k) {   // k = { x, y（持ち上げた位置。なければ置いてある）, stamp（押した印 0〜1） }
    const x = k.x != null ? k.x : p.x, y = k.y != null ? k.y : p.y;
    return `<g transform="translate(${x} ${y}) rotate(${k.rot || 0})"><ellipse cx="0" cy="2" rx="16" ry="5" fill="${C.ink}" opacity="${k.y != null ? .0 : .18}"/><rect x="-11" y="-58" width="22" height="58" rx="9" fill="#C8263C"/><rect x="-11" y="-58" width="8" height="58" rx="4" fill="#fff" opacity=".25"/><circle cx="0" cy="-60" r="10" fill="#A81E31"/><rect x="-13" y="-6" width="26" height="8" rx="3" fill="#7A1422"/></g>`;
  }
  function laptopSvg(p, k) {   // k = { open 0〜1（画面の開き）, glow }
    const o = k.open == null ? 1 : k.open, ang = -8 - 96 * o;   // 開くと画面がユズ（左）の方へ立つ。こちらからは画面の裏が見える
    return `<g transform="translate(${p.x} ${p.y})"><path d="M-88 0 L80 0 L96 16 L-72 16Z" fill="#C9CED3" stroke="#9AA3AB" stroke-width="2"/><path d="M-70 4 L70 4 L80 12 L-60 12Z" fill="#AEB6BE" opacity=".7"/>`
      + `<g transform="translate(-84 2) rotate(${ang})"><rect x="0" y="-8" width="172" height="12" rx="5" fill="#B9C0C7"/><rect x="0" y="-8" width="${172}" height="12" rx="5" fill="none" stroke="#8C959E" stroke-width="2"/></g>`
      + `<g transform="translate(-84 2) rotate(${ang})"><rect x="6" y="-6" width="160" height="10" rx="4" fill="#D7DDE2"/></g>`
      // 画面の裏（立てた時に見える面）
      + (o > .35 ? `<g opacity="${Math.min(1, (o - .35) * 3).toFixed(2)}"><path d="M-84 2 L${-84 + 172 * Math.cos(ang * Math.PI / 180)} ${2 + 172 * Math.sin(ang * Math.PI / 180)} L${-60 + 172 * Math.cos(ang * Math.PI / 180)} ${-2 + 172 * Math.sin(ang * Math.PI / 180)} L-60 -2Z" fill="#C9CED3" stroke="#8C959E" stroke-width="2.5"/>`
        + `<circle cx="${-72 + 86 * Math.cos(ang * Math.PI / 180)}" cy="${86 * Math.sin(ang * Math.PI / 180)}" r="9" fill="#E8ECEF"/>`
        + (k.glow ? `<path d="M-60 -2 L${-60 + 172 * Math.cos(ang * Math.PI / 180)} ${-2 + 172 * Math.sin(ang * Math.PI / 180)}" stroke="#BFE3FF" stroke-width="4" opacity="${k.glow}"/>` : '') + `</g>` : '')
      + `</g>`;
  }
  BR.laptopLid = (o) => { const ang = (-8 - 96 * o) * Math.PI / 180; return { x0: BR.P.laptop.x - 84, y0: BR.P.laptop.y + 2, x1: BR.P.laptop.x - 84 + 172 * Math.cos(ang), y1: BR.P.laptop.y + 2 + 172 * Math.sin(ang) }; };
  function mikanSvg(x, y, r, o = {}) {
    return `<g transform="translate(${x} ${y}) rotate(${o.rot || 0})"><circle r="${r}" fill="#F29A2E"/><circle r="${r}" fill="none" stroke="#D8781C" stroke-width="2"/><circle cx="${-r * .3}" cy="${-r * .32}" r="${r * .3}" fill="#fff" opacity=".35"/>`
      + (o.leaf === false ? '' : `<path d="M0 ${-r} q${r * .25} ${-r * .4} ${r * .55} ${-r * .3}" stroke="#4E7A2E" stroke-width="${r * .18}" fill="none" stroke-linecap="round"/>`) + `</g>`;
  }
  // むいたみかん（皮が花のように開き、中に房）。take＝取った房の数
  function peeledSvg(p, take = 0) {
    let s = `<g transform="translate(${p.x} ${p.y})"><path d="M-30 0 Q-44 -14 -36 -26 Q-20 -18 -12 -6 Q-8 -30 6 -32 Q12 -16 10 -4 Q22 -24 38 -20 Q36 -6 26 2 Q10 12 -12 10Z" fill="#F29A2E" stroke="#D8781C" stroke-width="2"/><path d="M-26 2 Q0 10 24 2" stroke="#FFE7C2" stroke-width="5" fill="none"/>`;
    for (let i = 0; i < 6 - take; i++) s += `<ellipse cx="${-14 + i * 6}" cy="${-8 - (i % 2) * 4}" rx="9" ry="13" fill="#F7B04C" stroke="#E08A22" stroke-width="1.5" transform="rotate(${-30 + i * 12} ${-14 + i * 6} ${-8})"/>`;
    return s + `</g>`;
  }
  BR.segment = (x, y, s = 1, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><ellipse rx="10" ry="15" fill="#F7B04C" stroke="#E08A22" stroke-width="2"/><path d="M0 -12 Q4 0 0 12" stroke="#FFE2A8" stroke-width="2" fill="none"/></g>`;
  BR.mikan = mikanSvg;
  // ---- 布団の中（めくった所の中。ユズの後ろ足・クリ）を描く関数を外から渡せる：o.inside(clipId) ----
  // o = { lift（めくり 0〜1）, bumps:[{x, k}]（布団のもぞもぞ。x と強さ 0〜1）, futL/futR（左右のすその動き）, props:{…}, inside: 文字列 }
  BR.kotatsu = (o = {}) => {
    const K = BR.K, cx = K.cx, by = K.backY, fy = K.frontY, fl = K.floor;
    const x0 = cx - K.frontHalf - 90, x1 = cx + K.frontHalf + 90;
    const lift = (o.lift || 0) < .04 ? 0 : o.lift, L = BR.LIFT;   // ほとんど閉じた布団は閉じて描く（2026-11-21：めくれが 0 に近いと床に赤と白の細い線が残った）
    // 布団の前の下のすそ：めくる所は上へ持ち上がる。bumps は上へふくらむ
    const hemY = x => { let y = fl + 6; for (const b of (o.bumps || [])) y -= 46 * b.k * Math.exp(-Math.pow((x - b.x) / 110, 2)); const d = (x - L.cx) / (L.w / 2); if (lift > 0 && Math.abs(d) < 1) y -= 320 * lift * Math.pow(Math.cos(d * Math.PI / 2), 1.1); return y; };
    let hem = ''; for (let x = x0 + 30; x <= x1 - 30; x += 20) hem += ` L${x} ${hemY(x).toFixed(1)}`;
    const sideL = (o.futL || 0) * 26, sideR = (o.futR || 0) * 26;
    const futon = `M${cx - K.frontHalf} ${fy - 4} Q${x0 - 10 - sideL} ${fy + 30} ${x0 - sideL} ${fl - 60} Q${x0 + 4} ${fl} ${x0 + 30} ${hemY(x0 + 30)}${hem} Q${x1 - 4} ${fl} ${x1 + sideR} ${fl - 60} Q${x1 + 10 + sideR} ${fy + 30} ${cx + K.frontHalf} ${fy - 4} Z`;
    let s = `<defs><linearGradient id="brFut" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.fut1}"/><stop offset="1" stop-color="${C.fut2}"/></linearGradient>
      <clipPath id="brFutC"><path d="${futon}"/></clipPath>
      <radialGradient id="brIn" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#FF9A4C"/><stop offset=".6" stop-color="#C9542E"/><stop offset="1" stop-color="#5A2418"/></radialGradient>
      <clipPath id="brOpen"><path d="M${L.cx - L.w / 2 - 10} ${fl + 20} ${(() => { let p = ''; for (let x = L.cx - L.w / 2; x <= L.cx + L.w / 2; x += 15) p += ` L${x} ${hemY(x)}`; return p; })()} L${L.cx + L.w / 2 + 10} ${fl + 20} Z"/></clipPath></defs>`;
    // めくった所の中（オレンジの光・中のもの）
    if (lift > 0) s += `<g data-nb="1"><g clip-path="url(#brOpen)"><rect x="${L.cx - L.w}" y="${fl - 300}" width="${L.w * 2}" height="400" fill="url(#brIn)"/>${o.inside || ''}</g></g>`;
    // 布団
    s += `<g data-nb="1"><path d="${futon}" fill="url(#brFut)"/><g clip-path="url(#brFutC)" opacity=".55">`
      + [-4, -3, -2, -1, 0, 1, 2, 3, 4].map(i => `<path d="M${cx + i * 110} ${fy} q${i * 10} ${(fl - fy) / 2} ${i * 26} ${fl - fy + 30}" stroke="${C.futL}" stroke-width="10" fill="none" opacity=".45"/>`).join('')
      + [0, 1, 2].map(i => `<path d="M${x0 - 40} ${fy + 90 + i * 120} H${x1 + 40}" stroke="${C.futL}" stroke-width="8" opacity=".35"/>`).join('')
      + `</g><path d="M${x0 + 40} ${fl - 4}${hem.replace(/^ L/, ' M').replace(/ L/g, ' L')}" stroke="#3F5F86" stroke-width="5" fill="none" opacity=".35"/>`
      + (o.bumps || []).map(b => b.k > .05 ? `<path d="M${b.x - 70} ${fl - 30 - 50 * b.k} q70 ${-40 * b.k} 140 0" stroke="#FFFFFF" stroke-width="6" fill="none" opacity="${(.3 * b.k).toFixed(2)}"/>` : '').join('')
      // めくった布の裏（めくったときの内がわの縁）
      + (lift > 0 ? `<path d="M${L.cx - L.w / 2} ${hemY(L.cx - L.w / 2)} ${(() => { let p = ''; for (let x = L.cx - L.w / 2; x <= L.cx + L.w / 2; x += 15) p += ` L${x} ${hemY(x) + 3}`; return p; })()}" stroke="#E8F0F7" stroke-width="12" fill="none" opacity=".85"/>` : '')
      + `</g>`;
    // 天板（上の面が少し見える）
    s += `<g data-nb="1"><path d="M${cx - K.backHalf} ${by} L${cx + K.backHalf} ${by} L${cx + K.frontHalf} ${fy} L${cx - K.frontHalf} ${fy}Z" fill="${C.wood}"/><path d="M${cx - K.backHalf + 20} ${by + 8} L${cx + K.backHalf - 30} ${by + 8}" stroke="#fff" stroke-width="5" opacity=".2"/>`
      + `<rect x="${cx - K.frontHalf - 6}" y="${fy - 4}" width="${2 * K.frontHalf + 12}" height="26" rx="8" fill="${C.wood2}"/></g>`;
    // 小物
    const P = BR.P, pr = o.props || {};
    s += `<g data-nb="1">` + `<ellipse cx="${P.pad.x}" cy="${P.pad.y + 4}" rx="22" ry="8" fill="#5A2418"/><ellipse cx="${P.pad.x}" cy="${P.pad.y}" rx="20" ry="7" fill="#B8323A"/>`
      + `<g transform="translate(${P.bowl.x} ${P.bowl.y})"><path d="M-70 -6 Q0 34 70 -6Z" fill="#8C603C"/><path d="M-70 -6 Q0 10 70 -6" stroke="#B38254" stroke-width="5" fill="none"/></g>`
      + (pr.bowl === 0 ? '' : mikanSvg(P.bowl.x - 30, P.bowl.y - 20, 24) + mikanSvg(P.bowl.x + 28, P.bowl.y - 18, 23, { rot: 30 }) + mikanSvg(P.bowl.x, P.bowl.y - 40, 22, { rot: -20 }))
      + peeledSvg(P.peeled, pr.taken || 0)
      + laptopSvg(P.laptop, pr.laptop || {})
      + papersSvg(P.papers, pr.papers || {})
      + (pr.stampMark ? `<g transform="translate(${P.papers.x + 10} ${P.papers.y - 30})" opacity="${pr.stampMark}"><circle r="13" fill="none" stroke="#C8263C" stroke-width="4"/></g>` : '')
      + (pr.hankoHeld ? '' : hankoSvg(P.hanko, pr.hanko || {}))
      + `</g>`;
    return s;
  };
  BR.hanko = (x, y, rot = 0) => hankoSvg(BR.P.hanko, { x, y, rot });
  BR.papers = (k) => papersSvg(BR.P.papers, k);
  // ユズの後ろ足（布団の中で、左から中へのびる。付け根 FOOT・足先 tip）
  BR.foot = (tipX, tipY, o = {}) => {
    const f = BR.FOOT, mx = (f.x0 + tipX) / 2, my = Math.min(f.y, tipY) - 14;
    return `<g><path d="M${f.x0 - 60} ${f.y + 10} Q${mx} ${my} ${tipX} ${tipY}" stroke="#D2A877" stroke-width="56" fill="none" stroke-linecap="round"/><path d="M${f.x0 - 60} ${f.y + 4} Q${mx} ${my - 8} ${tipX - 10} ${tipY - 8}" stroke="#E6C49A" stroke-width="18" fill="none" stroke-linecap="round" opacity=".7"/>`
      + `<ellipse cx="${tipX + 14}" cy="${tipY + 4}" rx="40" ry="26" fill="#F3E3CC"/><ellipse cx="${tipX + 22}" cy="${tipY + 10}" rx="10" ry="7" fill="#E7B9A8" opacity=".7"/></g>`;
  };
  // クリが寝ている姿（横になって、両前足で何かを抱える）。(x, y) が体の真ん中。rot で寝返り
  BR.pomSleep = (x, y, s, o = {}) => {
    const q = Object.assign({ eye: 'happy', blush: .6, paws: 0 }, o.q || {});
    return `<g transform="translate(${x} ${y}) rotate(${o.rot != null ? o.rot : -78}) scale(${o.flip ? -1 : 1} 1)">${ELV.pom(0, 70, s, q)}</g>`;
  };
  // 前足（肩の位置を決めて描く。common.js の limb と同じ形・色。体のうしろの布団から棒が生えて見えないように、体の見えている所から出す）
  BR.paw = (sx, sy, hx, hy, o = {}) => {
    { const len = Math.hypot(hx - sx, hy - sy); if (len > 120) window.__LIMBCUT = Math.max(window.__LIMBCUT || 0, len); }   // 公式の長さ（120）より長い前足は QA で止める（2026-11-21：棒のような長い腕）
    const col = o.col || '#C7A077', w = o.w || 32, mx = (sx + hx) / 2, my = (sy + hy) / 2 + (o.bend || 0), ang = Math.atan2(hy - my, hx - mx) * 180 / Math.PI, pw = w * .68, ph = w * .58;
    return `<g><path d="M${sx} ${sy} Q${mx} ${my} ${hx} ${hy}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/><path d="M${sx} ${sy} Q${mx} ${my} ${hx} ${hy}" fill="none" stroke="#6E5034" stroke-width="${w * .28}" stroke-linecap="round" opacity=".12" transform="translate(0 ${w * .3})"/>`
      + `<g transform="translate(${hx} ${hy}) rotate(${ang})"><ellipse rx="${pw}" ry="${ph}" fill="${col}"/><ellipse cx="${-pw * .1}" cy="${-ph * .35}" rx="${pw * .62}" ry="${ph * .38}" fill="#fff" opacity=".32"/>`
      + [-.32, .18].map(k => `<path d="M${pw * .98} ${ph * k} Q${pw * .78} ${ph * (k + .04)} ${pw * .6} ${ph * k}" fill="none" stroke="#8E7052" stroke-width="${w * .055}" stroke-linecap="round" opacity=".6"/>`).join('') + `</g></g>`;
  };
  // モチが身をかがめた形（第1話の最後〜第3話の途中。3話で同じ値）
  BR.CROUCH = { dx: 280, dy: 360, tilt: -30 };   // 2026-11-21：こたつの右の外へ身をかがめる（前足を公式の長さのまま布団のはしへ届かせるため）
  window.BR = BR;
})();
