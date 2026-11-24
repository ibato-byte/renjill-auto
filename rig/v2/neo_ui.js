// 「定時1分前のちょっといい？」（2026-11-24 オーナーが基盤に決めた回）と同じ見た目の画面の文字・吹き出し・締め（2026-11-24）
// オーナー：「今後サムネイルデザインや最後の締め方、演出デザインを統一」「動画の長さは毎回30秒前後」「テロップは日本語の指定に英訳も加える」
// 見本：usagi-office-media の 20261124_teiji59_{1,2,3}.mp4 と _cover.jpg
//   NEO.brand()                 … 上の小さなブランド名「東京うさぎオフィス TOKYO USAGI OFFICE」（いつも）
//   NEO.title(ja, en, k)        … 冒頭の大きな題名（黄色・こげ茶のふち・1〜2行）＋その下の英語
//   NEO.telop(ja, en, k, o)     … 場面の字幕（こげ茶の角丸の箱・白い日本語＋小さい英語）
//   NEO.say(x, y, ja, en, k, o) … 吹き出し（白・こげ茶のふち・しっぽ）
//   NEO.think(x, y, ja, en, k, o) … モワモワの吹き出し（考えていること）
//   NEO.ending(ja, en, k)       … 最後の赤い札（「つづく ▶ …」「Follow for Part 2 ▶ …」。少し傾ける）
//   NEO.install()               … 毛をふわっと見せる（モチ・ユズの絵の外がわに細い毛）
// k は 0〜1（出てくる途中）。すべて画面の座標（#ui）に描く。
(function () {
  const NEO = {};
  const INK = '#4A2C16', CREAM = '#FFF4DC', YEL = '#FFE34D', RED = '#C8213A';
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const back = t => Math.min(1, Math.max(0, t)) === 1 ? 1 : (() => { const x = Math.min(1, Math.max(0, t)), c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); })();
  const T = (x, y, size, txt, o = {}) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="'Noto Sans CJK JP','Noto Sans JP',sans-serif" font-weight="${o.w || 900}" font-size="${size}" fill="${o.fill || '#fff'}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 8}" stroke-linejoin="round" paint-order="stroke"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${esc(txt)}</text>`;
  // ---- 上の小さなブランド名（見本：y 215・こげ茶のふちのクリーム色）----
  NEO.brand = (o = {}) => T(540, 226, 30, '東京うさぎオフィス TOKYO USAGI OFFICE', { fill: CREAM, stroke: '#5A3A22', sw: 7, w: 900, ls: 1 });
  // ---- 冒頭の大きな題名（見本：黄色 105px・こげ茶の太いふち＋影・英語は 52px のクリーム）----
  // part（例「PART 1 / 3」）：英語の下に赤い札（2026-11-22 オーナー：タイトルの下に Part を。表紙と同じ札）
  NEO.title = (ja, en, k = 1, part = '') => {
    if (k <= 0) return '';
    const lines = Array.isArray(ja) ? ja : [ja], s = .86 + .14 * back(Math.min(1, k * 1.4)), a = Math.min(1, k * 3);
    const fs = Math.min(112, Math.floor(940 / Math.max(...lines.map(l => [...l].length))));
    let y = 400 - (lines.length - 1) * fs * .55, g = '';
    for (const l of lines) { g += T(540, y + 8, fs, l, { fill: '#3B2210', stroke: '#3B2210', sw: 22 }) + T(540, y, fs, l, { fill: YEL, stroke: INK, sw: 20 }); y += fs * 1.12; }
    if (en) g += T(540, y - fs * .1 + 22, 50, en, { fill: CREAM, stroke: INK, sw: 12, w: 900 });
    if (part) { const py = y - fs * .1 + 70, pw = part.length * 30 + 70; g += `<rect x="${540 - pw / 2}" y="${py + 6}" width="${pw}" height="70" rx="35" fill="#5A1420"/><rect x="${540 - pw / 2 - 6}" y="${py - 6}" width="${pw + 12}" height="82" rx="41" fill="${CREAM}"/><rect x="${540 - pw / 2}" y="${py}" width="${pw}" height="70" rx="35" fill="${RED}"/>` + T(540, py + 50, 44, part, { fill: '#FFFFFF', ls: 2 }); }
    return `<g opacity="${a.toFixed(2)}" transform="translate(540 420) scale(${s.toFixed(3)}) translate(-540 -420)">${g}</g>`;
  };
  // ---- 場面の字幕（見本：「作戦① 聞こえないふり / Plan A: pretend not to hear」）----
  NEO.telop = (ja, en, k = 1, o = {}) => {
    if (k <= 0) return '';
    const y = o.y || 470, lines = Array.isArray(ja) ? ja : [ja], fs = o.size || 70, pad = 30;
    const w = Math.min(990, Math.max(Math.max(...lines.map(l => [...l].length)) * fs + 110, (en || '').length * 21 + 110));
    const h = pad + lines.length * fs * 1.15 + (en ? 56 : 0) + pad - fs * .15, a = Math.min(1, k * 3), s = .9 + .1 * back(Math.min(1, k * 1.5));
    let g = `<rect x="${540 - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="34" fill="#3B2617" opacity=".8"/>`;
    let ty = y - h / 2 + pad + fs * .86;
    for (const l of lines) { g += T(540, ty, fs, l, { fill: '#FFFFFF' }); ty += fs * 1.15; }
    if (en) g += T(540, ty - fs * 1.15 + 54, 36, en, { fill: '#FFF1C9', w: 800 });
    return `<g opacity="${a.toFixed(2)}" transform="translate(540 ${y}) scale(${s.toFixed(3)}) translate(-540 ${-y})">${g}</g>`;
  };
  // ---- 吹き出し（見本：「ちょっといい？ / Got a minute?」）。(x, y) は吹き出しのまんなか、o.tx・o.ty はしっぽの先 ----
  NEO.say = (x, y, ja, en, k = 1, o = {}) => {
    if (k <= 0) return '';
    const fs = o.size || 64, w = Math.max([...ja].length * fs + 90, (en || '').length * 21 + 80), h = fs + (en ? 70 : 40) + 26;
    const tx = o.tx == null ? x : o.tx, ty = o.ty == null ? y + h / 2 + 50 : o.ty, s = back(Math.min(1, k * 1.6)), a = Math.min(1, k * 4);
    const bx = x - w / 2, by = y - h / 2, tw = 26;
    const tail = `<path d="M${x - tw} ${y + h / 2 - 4} L${tx} ${ty} L${x + tw} ${y + h / 2 - 4}Z" fill="#fff" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`;
    const box = `<rect x="${bx}" y="${by}" width="${w}" height="${h}" rx="${h / 2.4}" fill="#fff" stroke="${INK}" stroke-width="6"/>`;
    const cover = `<rect x="${x - tw - 2}" y="${y + h / 2 - 12}" width="${tw * 2 + 4}" height="12" fill="#fff"/>`;
    const txt = T(x, by + 26 + fs * .86, fs, ja, { fill: '#2E1C0E' }) + (en ? T(x, by + 26 + fs + 44, 32, en, { fill: '#8A6E58', w: 800 }) : '');
    return `<g opacity="${a.toFixed(2)}" transform="translate(${tx} ${ty}) scale(${s.toFixed(3)}) translate(${-tx} ${-ty})"><g transform="translate(0 6)" opacity=".18">${box.replace('fill="#fff"', 'fill="#000"')}</g>${tail}${box}${cover}${txt}</g>`;
  };
  // ---- モワモワの吹き出し（考えていること）。しっぽは小さな丸3つ ----
  NEO.think = (x, y, ja, en, k = 1, o = {}) => {
    if (k <= 0) return '';
    const fs = o.size || 60, w = Math.max([...ja].length * fs + 120, (en || '').length * 21 + 110), h = fs + (en ? 70 : 40) + 60;
    const tx = o.tx == null ? x + w * .3 : o.tx, ty = o.ty == null ? y + h / 2 + 90 : o.ty, s = back(Math.min(1, k * 1.4)), a = Math.min(1, k * 4);
    const n = Math.max(10, Math.round((w + h) / 46)); let bumps = '';
    for (let i = 0; i < n; i++) { const th = i / n * Math.PI * 2, bx = x + Math.cos(th) * w / 2, by = y + Math.sin(th) * h / 2, r = 34 + 10 * ((i * 7) % 3) / 2; bumps += `<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="${r.toFixed(1)}"/>`; }
    const cloud = c => `<g fill="${c}"><ellipse cx="${x}" cy="${y}" rx="${w / 2}" ry="${h / 2}"/>${bumps}</g>`;
    const dots = [.25, .55, .8].map((u, i) => `<circle cx="${(x + (tx - x) * (.55 + u * .45)).toFixed(1)}" cy="${(y + h / 2 + (ty - y - h / 2) * u).toFixed(1)}" r="${18 - i * 5}" fill="#fff" stroke="${INK}" stroke-width="5"/>`).join('');
    const txt = T(x, y - (en ? 18 : -fs * .32), fs, ja, { fill: '#2E1C0E' }) + (en ? T(x, y + 40, 32, en, { fill: '#8A6E58', w: 800 }) : '');
    return `<g opacity="${a.toFixed(2)}" transform="translate(${x} ${y + h / 2}) scale(${s.toFixed(3)}) translate(${-x} ${-(y + h / 2)})">${dots}<g transform="translate(0 6)" opacity=".15">${cloud('#000')}</g><g stroke="${INK}" stroke-width="12">${cloud(INK)}</g>${cloud('#fff')}${txt}</g>`;
  };
  // ---- 最後の赤い札（見本：「つづく ▶ 何を隠してる？ / Follow for Part 2 ▶ What is he hiding?」。少し右上がり）----
  // ja が長いとき（13文字より長い）は「つづく ▶」を1行目に小さく、問いかけを2行目に大きく
  NEO.ending = (ja, en, k = 1) => {
    if (k <= 0) return '';
    const s = back(Math.min(1, k * 1.5)), a = Math.min(1, k * 4), x = 540, y = 450, w = 940;
    const m = [...ja].length > 13 ? ja.match(/^(.*?▶)\s*(.*)$/) : null;
    const rows = m ? [[m[1], 58], [m[2], Math.min(84, Math.floor(860 / [...m[2]].length))]] : [[ja, Math.min(84, Math.floor(860 / [...ja].length))]];
    const enFs = en ? Math.min(42, Math.floor(1560 / en.length)) : 0;
    const h = 48 + rows.reduce((q, r) => q + r[1] * 1.12, 0) + (en ? enFs + 26 : 0) + 34;
    let g = `<g transform="rotate(-2.6 ${x} ${y})"><rect x="${x - w / 2 + 6}" y="${y - h / 2 + 12}" width="${w}" height="${h}" rx="40" fill="#5A1420" opacity=".35"/>`
      + `<rect x="${x - w / 2 - 8}" y="${y - h / 2 - 8}" width="${w + 16}" height="${h + 16}" rx="46" fill="${CREAM}"/><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="40" fill="${RED}"/>`;
    let ty = y - h / 2 + 40;
    for (const [txt, fs] of rows) { ty += fs * .9; g += T(x, ty + 6, fs, txt, { fill: '#5A1420' }) + T(x, ty, fs, txt, { fill: '#FFFFFF' }); ty += fs * .22; }
    if (en) g += T(x, ty + enFs + 14, enFs, en, { fill: '#FFE34D', w: 900 });
    g += `</g>`;
    return `<g opacity="${a.toFixed(2)}" transform="translate(${x} ${y}) scale(${s.toFixed(3)}) translate(${-x} ${-y})">${g}</g>`;
  };
  // ---- 毛をふわっと（見本の絵：体のふちに細い毛が出ている）。#ren・#jil の svg に重ねがけ ----
  NEO.install = () => {
    if (document.getElementById('neoFluffDefs')) return;
    document.body.insertAdjacentHTML('beforeend', `<svg id="neoFluffDefs" width="0" height="0" style="position:absolute"><defs><filter id="neoFluff" x="-5%" y="-5%" width="110%" height="110%">`
      + `<feTurbulence type="fractalNoise" baseFrequency="0.55 0.9" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G" result="d"/>`
      + `<feTurbulence type="fractalNoise" baseFrequency="1.6 0.35" numOctaves="1" seed="5" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 1  0 0 0 0 .96  0 0 0 0 .9  .9 0 0 0 -.45" result="tc"/>`
      + `<feComposite in="tc" in2="d" operator="in" result="hl"/><feMerge><feMergeNode in="d"/><feMergeNode in="hl"/></feMerge></filter></defs></svg>`);
    window.NEO_EYES = true;   // rig.js：目を「定時1分前」と同じ、くっきりした形で描く
    // 毛ふわは体だけ。目とメガネ（data-crisp）は、ふわをかけない写しを上に重ねる（2026-11-24 オーナー：目をはっきり）
    if (window.L && !L.__neoCrisp) {
      const orig = L.char; L.__neoCrisp = true;
      L.char = function (id) { orig.apply(this, arguments); NEO.crisp(id); };
    }
    for (const id of ['ren', 'jil']) NEO.crisp(id);
  };
  NEO.crisp = (id) => {
    const svg = document.getElementById(id); if (!svg) return;
    svg.style.filter = 'none';
    const g = svg.querySelector(':scope > g:not([data-neo-crisp])'); if (!g) return;
    g.style.filter = 'url(#neoFluff)';
    const sharp = g.querySelectorAll('[data-crisp]'); if (!sharp.length) return;
    const c = g.cloneNode(true);
    c.setAttribute('data-neo-crisp', '1'); c.style.filter = 'none'; c.setAttribute('visibility', 'hidden');
    c.querySelectorAll('defs, clipPath, filter').forEach(n => n.remove());
    c.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
    c.querySelectorAll('[filter]').forEach(n => n.removeAttribute('filter'));
    c.querySelectorAll('[data-crisp]').forEach(n => n.setAttribute('visibility', 'visible'));
    sharp.forEach(n => n.setAttribute('visibility', 'hidden'));   // ふわをかけた方の目は消す（ふちのザラザラが残らないように）
    g.querySelectorAll('clipPath *').forEach(n => n.setAttribute('visibility', 'visible'));   // 半目・ジロッの目を切り抜く形は消さない（消すと目が線だけになった。2026-11-24）
    g.after(c);
  };
  window.NEO = NEO;
})();
