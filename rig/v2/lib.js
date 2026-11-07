// レンとジル v2 演出ライブラリ（2026-11）
// キャラは本番の rig.js（RIG.render）をそのまま使う＝ゲーム・これまでの投稿と同じ見た目。
// ここで足すのは「背景・小道具・カメラ・効果」だけ。画面の文字は使わず、数字・記号・絵で伝える（海外の視聴者にも通じるように）。
(function () {
  const L = {};
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => (k = clamp(k, 0, 1), k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const outBack = k => { k = clamp(k, 0, 1); const c = 1.70158; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const pulse = (t, a, b) => { const u = seg(t, a, b); return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0; };
  Object.assign(L, { clamp, lerp, ease, outBack, seg, pulse });

  // 本番の背景と同じ色（壁 #F4ECE0・木の机）を基準に、光と奥行きだけ足す
  const PAL = { wall: '#F4ECE0', wall2: '#EADFCF', floor: '#E6D6C0', floor2: '#D9C6AC', frame: '#FFFDF8', wood: '#A9784E', wood2: '#8C603C', woodTop: '#C0905F', leaf: '#7DB87A', leaf2: '#5E9C5E', pot: '#C97A55', ink: '#4A3324' };
  L.PAL = PAL;
  L.defs = () => `<defs>
  <filter id="v2dof" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2.4"/></filter>
  <filter id="v2soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="12"/></filter>
  <linearGradient id="v2wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8F1E6"/><stop offset="1" stop-color="${PAL.wall2}"/></linearGradient>
  <linearGradient id="v2floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PAL.floor}"/><stop offset="1" stop-color="${PAL.floor2}"/></linearGradient>
  <linearGradient id="v2desk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PAL.woodTop}"/><stop offset=".25" stop-color="${PAL.wood}"/><stop offset="1" stop-color="${PAL.wood2}"/></linearGradient>
  <linearGradient id="v2day" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFE0F5"/><stop offset="1" stop-color="#E6F3FB"/></linearGradient>
  <linearGradient id="v2dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6C29A"/><stop offset=".6" stop-color="#F9DDB4"/><stop offset="1" stop-color="#FBEBCD"/></linearGradient>
  <linearGradient id="v2night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2B3A63"/><stop offset="1" stop-color="#4A5A88"/></linearGradient>
  <linearGradient id="v2screen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EAF4FF"/><stop offset="1" stop-color="#CFE2F7"/></linearGradient>
  <radialGradient id="v2light" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF6DA" stop-opacity=".85"/><stop offset="1" stop-color="#FFF6DA" stop-opacity="0"/></radialGradient>
  <radialGradient id="v2shadow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#5A3A1E" stop-opacity=".28"/><stop offset="1" stop-color="#5A3A1E" stop-opacity="0"/></radialGradient>
  </defs>`;

  // ---------- 背景（オフィス） ----------
  // o: { sky: day|dusk|night, clock:[h,m], noClock, light: 0..1 }
  L.office = function (o = {}) {
    const sky = o.sky || 'day', night = sky === 'night';
    const win = x => `<g transform="translate(${x} 230)"><rect x="-12" y="-12" width="344" height="444" rx="14" fill="${PAL.frame}"/><rect width="320" height="420" rx="6" fill="url(#v2${sky})"/>
      ${night ? '<circle cx="230" cy="80" r="30" fill="#FFF3C4"/>' : '<g fill="#fff" opacity=".85"><ellipse cx="90" cy="100" rx="64" ry="22"/><ellipse cx="230" cy="160" rx="52" ry="17"/></g>'}
      <path d="M0 300 L48 270 L48 420 L0 420Z M66 420 L66 236 L122 236 L122 420Z M140 420 L140 284 L214 284 L214 420Z M232 420 L232 254 L320 254 L320 420Z" fill="${night ? '#33406B' : '#CADBE6'}" opacity=".9"/>
      ${night ? '<g fill="#FFE9A8" opacity=".85"><rect x="80" y="270" width="12" height="12"/><rect x="160" y="320" width="12" height="12"/><rect x="250" y="300" width="12" height="12"/><rect x="96" y="330" width="12" height="12"/></g>' : ''}
      <rect x="155" width="10" height="420" fill="${PAL.frame}"/><rect y="205" width="320" height="10" fill="${PAL.frame}"/></g>`;
    const g = [];
    g.push(`<rect x="-500" y="-500" width="2080" height="2920" fill="url(#v2wall)"/>`);
    g.push(`<g filter="url(#v2dof)">`);
    g.push(win(70) + win(690));
    if (!o.noClock) g.push(L.clock(540, 300, o.clock || [10, 10], .9));
    g.push(plant(985, 1000) + plant(95, 990, .8));
    g.push(`<rect x="-500" y="1000" width="2080" height="1500" fill="url(#v2floor)"/><rect x="-500" y="994" width="2080" height="12" fill="#EFE3D2"/>`);
    g.push(`</g>`);
    g.push(`<ellipse cx="${night ? 540 : 230}" cy="820" rx="460" ry="560" fill="url(#v2light)" opacity="${night ? .12 : (o.light == null ? .5 : o.light)}"/>`);
    if (night) g.push(`<rect x="-500" y="-500" width="2080" height="2920" fill="#1B2440" opacity=".18"/>`);
    return g.join('');
  };
  L.clock = (x, y, [h, m], s = 1) => {
    const ha = (h % 12 + m / 60) * 30, ma = m * 6;
    return `<g transform="translate(${x} ${y}) scale(${s})"><circle r="80" fill="#fff" stroke="#C9A87E" stroke-width="10"/>${Array.from({ length: 12 }, (_, i) => `<rect x="-3" y="-68" width="6" height="${i % 3 ? 8 : 16}" fill="#8C6B4A" transform="rotate(${i * 30})"/>`).join('')}<path d="M0 0 L0 -40" stroke="${PAL.ink}" stroke-width="9" stroke-linecap="round" transform="rotate(${ha})"/><path d="M0 0 L0 -60" stroke="${PAL.ink}" stroke-width="6" stroke-linecap="round" transform="rotate(${ma})"/><circle r="8" fill="#E86C5A"/></g>`;
  };
  // デジタル時計（数字は世界共通）
  L.digital = (x, y, txt, o = {}) => `<g transform="translate(${x} ${y}) scale(${o.s || 1})"><rect x="-170" y="-70" width="340" height="140" rx="26" fill="#2E3440"/><rect x="-156" y="-56" width="312" height="112" rx="16" fill="#1E232C"/><text x="0" y="34" text-anchor="middle" font-size="96" font-weight="900" font-family="Noto Sans Mono, Noto Sans CJK JP, monospace" fill="${o.color || '#7CF0A8'}">${txt}</text></g>`;
  function plant(x, y, s = 1) {
    return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-55 0 L-45 -110 L45 -110 L55 0Z" fill="${PAL.pot}"/><rect x="-52" y="-120" width="104" height="18" rx="6" fill="#DB8C66"/>${[[-60, -260, -20], [0, -320, 0], [60, -270, 20], [-90, -200, -40], [90, -210, 40]].map(([lx, ly, r], i) => `<ellipse cx="${lx}" cy="${ly + 60}" rx="34" ry="80" fill="${i % 2 ? PAL.leaf2 : PAL.leaf}" transform="rotate(${r} ${lx} ${ly + 60})"/>`).join('')}</g>`;
  }
  // 机（本番と同じ木の色。天板＋前板）
  L.desk = (y, o = {}) => { const x = o.x == null ? 0 : o.x, w = o.w || 1080, h = o.h || 260; return `<g><rect x="${x}" y="${y}" width="${w}" height="34" rx="10" fill="${PAL.woodTop}"/><rect x="${x + 8}" y="${y + 30}" width="${w - 16}" height="${h}" rx="8" fill="url(#v2desk)"/><rect x="${x + 30}" y="${y + 90}" width="${w - 60}" height="5" rx="2" fill="${PAL.wood2}" opacity=".5"/></g>`; };
  L.laptop = (x, y, s = 1, screen = '') => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-190 0 L190 0 L215 26 L-215 26Z" fill="#C9CFD8"/><rect x="-180" y="-250" width="360" height="250" rx="16" fill="#3B4252"/><rect x="-164" y="-234" width="328" height="218" rx="8" fill="url(#v2screen)"/><g transform="translate(-164 -234)">${screen}</g></g>`;
  L.papers = (x, y, n, o = {}) => {
    let s = '';
    for (let i = 0; i < n; i++) { const j = Math.sin(i * 12.9898) * (o.mess || 12); s += `<rect x="${x - 100 + j}" y="${y - (i + 1) * 14}" width="200" height="15" rx="3" fill="${i % 2 ? '#FFFFFF' : '#F4EFE6'}" stroke="#D7CCBB" stroke-width="2" transform="rotate(${Math.sin(i * 7.1) * 2.2} ${x} ${y - i * 14})"/>`; }
    return s;
  };
  L.bag = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-60 -110 Q0 -190 60 -110" fill="none" stroke="#7B4F2C" stroke-width="14"/><rect x="-100" y="-120" width="200" height="140" rx="26" fill="#C9744A"/><rect x="-100" y="-120" width="200" height="40" rx="20" fill="#B5643D"/><rect x="-16" y="-92" width="32" height="24" rx="6" fill="#F2C14E"/></g>`;
  L.chair = (x, y, spin = 0) => `<g transform="translate(${x} ${y})"><rect x="-16" y="-10" width="32" height="130" fill="#7A6E66"/><path d="M-110 125 L110 125" stroke="#5E544D" stroke-width="14" stroke-linecap="round"/><g transform="scale(${Math.cos(spin).toFixed(3)} 1)"><rect x="-140" y="-300" width="280" height="270" rx="56" fill="#8FA9C4"/><rect x="-120" y="-280" width="240" height="100" rx="36" fill="#A9C0D8" opacity=".7"/></g><rect x="-160" y="-40" width="320" height="56" rx="26" fill="#7D97B3"/></g>`;
  L.hayStrand = (x, y, len = 150, rot = -15) => `<path d="M${x} ${y} q${len * .4} ${-len * .25} ${len} ${-len * .1}" transform="rotate(${rot} ${x} ${y})" stroke="#A8B84E" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M${x + len * .6} ${y - len * .2} l18 -14" transform="rotate(${rot} ${x} ${y})" stroke="#A8B84E" stroke-width="6" stroke-linecap="round"/>`;
  L.stamp = (x, y, s = 1, rot = -12) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><circle r="36" fill="none" stroke="#E8473A" stroke-width="6"/><path d="M-16 0 L-4 13 L18 -14" fill="none" stroke="#E8473A" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  L.stamper = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-22" y="-86" width="44" height="80" rx="14" fill="#8C5A3C"/><rect x="-34" y="-10" width="68" height="26" rx="6" fill="#C0392B"/></g>`;

  // ---------- 効果（文字を使わない） ----------
  // 衝撃（ポン・ドン の代わり）：放射状の線
  L.impact = (x, y, k, s = 1, color = '#E8473A') => k <= 0 || k >= 1 ? '' : `<g transform="translate(${x} ${y}) scale(${s * (0.6 + k * .6)})" opacity="${1 - k}">${Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2; return `<path d="M${Math.cos(a) * 46} ${Math.sin(a) * 46} L${Math.cos(a) * 92} ${Math.sin(a) * 92}" stroke="${color}" stroke-width="10" stroke-linecap="round"/>`; }).join('')}</g>`;
  // チャイム（キンコーン の代わり）：音符と音の輪
  L.chime = (x, y, k, s = 1) => k <= 0 || k >= 1 ? '' : `<g transform="translate(${x} ${y}) scale(${s})" opacity="${1 - k * .7}">${[0, 1, 2].map(i => `<path d="M${-60 - i * 34 - k * 40} ${-40 - i * 10} q${-20} 40 0 80 M${60 + i * 34 + k * 40} ${-40 - i * 10} q20 40 0 80" stroke="#F2A33A" stroke-width="9" fill="none" stroke-linecap="round" opacity="${1 - i * .25}"/>`).join('')}<g fill="#F2A33A"><ellipse cx="-14" cy="34" rx="18" ry="14"/><rect x="0" y="-40" width="8" height="74"/><path d="M0 -40 q30 6 34 34 q-12 -16 -34 -14Z"/></g></g>`;
  // もぐもぐ の代わり：ほっぺの動き線
  L.munch = (x, y, t, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" stroke="#6C9A4A" stroke-width="7" fill="none" stroke-linecap="round" opacity=".85"><path d="M-30 ${-4 + Math.sin(t * 24) * 6} q-12 -10 -24 0"/><path d="M30 ${-4 - Math.sin(t * 24) * 6} q12 -10 24 0"/></g>`;
  L.check = (x, y, k, s = 1) => k <= 0 ? '' : `<g transform="translate(${x} ${y}) scale(${s * outBack(k)})"><circle r="70" fill="#5DBB63"/><path d="M-32 0 L-8 26 L36 -26" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  L.sparkles = (x, y, t, s = 1, n = 5) => `<g transform="translate(${x} ${y}) scale(${s})">${Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2 + t * 1.5, r = 90 + 20 * Math.sin(t * 6 + i), k = .6 + .4 * Math.sin(t * 9 + i * 2); return `<path transform="translate(${Math.cos(a) * r} ${Math.sin(a) * r}) scale(${k})" d="M0 -18 L5 -5 L18 0 L5 5 L0 18 L-5 5 L-18 0 L-5 -5Z" fill="#FFD45E"/>`; }).join('')}</g>`;
  L.speed = (cx, cy, a = 1, n = 44) => a <= 0 ? '' : `<g opacity="${a}">${Array.from({ length: n }, (_, i) => { const t = i / n * Math.PI * 2 + Math.sin(i * 3.3) * .05, r1 = 480 + Math.abs(Math.sin(i * 7.7)) * 160, r2 = 1600; return `<path d="M${cx + Math.cos(t) * r1} ${cy + Math.sin(t) * r1} L${cx + Math.cos(t + .02) * r2} ${cy + Math.sin(t + .02) * r2} L${cx + Math.cos(t - .02) * r2} ${cy + Math.sin(t - .02) * r2}Z" fill="#fff"/>`; }).join('')}</g>`;
  L.dust = (x, y, k) => k <= 0 || k >= 1 ? '' : `<g opacity="${1 - k}">${Array.from({ length: 9 }, (_, i) => { const a = i / 9 * Math.PI * 2, r = 50 + k * 200; return `<circle cx="${x + Math.cos(a) * r}" cy="${y + Math.sin(a) * r * .5}" r="${64 * (1 - k * .5)}" fill="#F3E6D3" stroke="#DCC9AC" stroke-width="5"/>`; }).join('')}</g>`;
  // 吹き出し（中は絵だけ）
  L.bubble = (x, y, inner, o = {}) => {
    const w = o.w || 300, h = o.h || 160, s = o.s == null ? 1 : o.s, tl = o.tail || -40;
    if (s <= 0) return '';
    return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" rx="${h / 2.4}" fill="#fff" stroke="${PAL.ink}" stroke-width="7"/><path d="M${tl - 20} -4 L${tl} 46 L${tl + 26} -4Z" fill="#fff" stroke="${PAL.ink}" stroke-width="7" stroke-linejoin="round"/><rect x="${tl - 16}" y="-12" width="40" height="12" fill="#fff"/><g transform="translate(0 ${-h / 2})">${inner}</g></g>`;
  };
  L.qmark = (x, y, s = 1) => `<text x="${x}" y="${y}" font-size="${110 * s}" font-weight="900" text-anchor="middle" dominant-baseline="central" font-family="Noto Sans CJK JP" fill="#E8473A" stroke="#fff" stroke-width="${12 * s}" paint-order="stroke">?</text>`;
  L.emark = (x, y, s = 1, ch = '!') => `<text x="${x}" y="${y}" font-size="${130 * s}" font-weight="900" text-anchor="middle" font-family="Noto Sans CJK JP" fill="#E8473A" stroke="#fff" stroke-width="${18 * s}" paint-order="stroke">${ch}</text>`;

  // ---------- 載せる・動かす ----------
  const set = (id, s) => { const n = document.getElementById(id); if (n) n.innerHTML = s || ''; };
  // sc: { bg, back, fx, ui, cam:{z,cx,cy}, shake(px), dim }
  L.mount = function (sc) {
    set('bg', L.defs() + (sc.bg || '')); set('back', sc.back); set('fx', sc.fx); set('ui', sc.ui);
    const c = sc.cam || { z: 1, cx: 540, cy: 960 };
    const sh = sc.shake || 0, t = sc.t || 0;
    const dx = sh ? Math.sin(t * 91) * sh : 0, dy = sh ? Math.cos(t * 77) * sh * .6 : 0;
    const w = document.getElementById('world');
    if (w) w.style.transform = `translate(${(540 - c.cx * c.z + dx).toFixed(2)}px, ${(960 - c.cy * c.z + dy).toFixed(2)}px) scale(${c.z.toFixed(4)})`;
    const d = document.getElementById('dim'); if (d) d.style.opacity = sc.dim || 0;
  };
  // キャラ：本番の RIG で描き、手前の小物（front）を同じ層に重ねる。alive で瞬き・呼吸・耳の揺れ
  L.char = function (id, p, t, front, opt) {
    const svg = document.getElementById(id); if (!svg) return;
    if (p) RIG.render(svg, RIG.alive(Object.assign({ char: id }, p), t, opt || {}));
    else svg.innerHTML = '';
    if (front) svg.insertAdjacentHTML('beforeend', front);
  };
  // カメラ：keys=[{t,z,cx,cy,d}]。各キーへ d 秒（既定 .6）でなめらかに
  L.camAt = function (keys, t) {
    let cur = { z: keys[0].z, cx: keys[0].cx, cy: keys[0].cy };
    for (let i = 1; i < keys.length; i++) {
      const k = keys[i]; if (t < k.t) break;
      const u = ease(seg(t, k.t, k.t + (k.d || .6)));
      cur = { z: lerp(cur.z, k.z, u), cx: lerp(cur.cx, k.cx, u), cy: lerp(cur.cy, k.cy, u) };
    }
    // ゆっくり寄り続ける（止まって見えないように）
    const drift = keys.drift == null ? .006 : keys.drift;
    cur.z *= 1 + drift * Math.sin(t * .9);
    return cur;
  };
  if (typeof window.camera !== 'function') window.camera = c => { const w = document.getElementById('world'); if (w) w.style.transform = `translate(${540 - c.cx * c.z}px, ${960 - c.cy * c.z}px) scale(${c.z})`; };
  window.L = L;
})();
