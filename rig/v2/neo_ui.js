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
  NEO.brand = (o = {}) => T(540, 216, 30, '東京うさぎオフィス TOKYO USAGI OFFICE', { fill: CREAM, stroke: '#5A3A22', sw: 7, w: 900, ls: 1 });   // 見本と同じ高さ（y 216）
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
    // 2026-11-25 ブラッシュアップ：見本と同じ「うすい灰茶の箱（半透明）＋クリーム色の字にこげ茶のふち」。出るときは小さくはずみ、消えるときはすっと上へ
    const y = o.y || 470, lines = Array.isArray(ja) ? ja : [ja], fs = o.size || 74, pad = 30;
    const w = Math.min(1000, Math.max(Math.max(...lines.map(l => [...l].length)) * fs + 120, (en || '').length * 24 + 120));
    const h = pad + lines.length * fs * 1.15 + (en ? 60 : 0) + pad - fs * .15, a = Math.min(1, k * 3), s = .88 + .12 * back(Math.min(1, k * 1.5));
    let g = `<rect x="${540 - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="30" fill="#5B4B3E" opacity=".56"/>`;
    let ty = y - h / 2 + pad + fs * .86;
    for (const l of lines) { g += T(540, ty, fs, l, { fill: '#FFF8E8', stroke: '#3B2414', sw: 12 }); ty += fs * 1.15; }
    if (en) g += T(540, ty - fs * 1.15 + 58, 40, en, { fill: '#FFF8E8', stroke: '#3B2414', sw: 8, w: 900 });
    return `<g opacity="${a.toFixed(2)}" transform="translate(540 ${y - (1 - Math.min(1, k * 2)) * 14}) scale(${s.toFixed(3)}) translate(-540 ${-y})">${g}</g>`;
  };
  // ---- 吹き出し（見本：「ちょっといい？ / Got a minute?」）。(x, y) は吹き出しのまんなか、o.tx・o.ty はしっぽの先 ----
  NEO.say = (x, y, ja, en, k = 1, o = {}) => {
    if (k <= 0) return '';
    const fs = o.size || 64, w = Math.max([...ja].length * fs + 90, (en || '').length * 21 + 80), h = fs + (en ? 70 : 40) + 26;
    const tx = o.tx == null ? x : o.tx, ty = o.ty == null ? y + h / 2 + 50 : o.ty, s = back(Math.min(1, k * 1.6)), a = Math.min(1, k * 4);
    const bx = x - w / 2, by = y - h / 2, tw = 26;
    const tail = `<path d="M${x - tw} ${y + h / 2 - 4} L${tx} ${ty} L${x + tw} ${y + h / 2 - 4}Z" fill="#fff" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>`;
    const box = `<rect x="${bx}" y="${by}" width="${w}" height="${h}" rx="${h / 2.4}" fill="#fff" stroke="${INK}" stroke-width="8"/>`;
    const cover = `<rect x="${x - tw - 2}" y="${y + h / 2 - 12}" width="${tw * 2 + 4}" height="12" fill="#fff"/>`;
    const txt = T(x, by + 26 + fs * .86, fs, ja, { fill: '#4A2C16' }) + (en ? T(x, by + 26 + fs + 44, 34, en, { fill: '#A0683A', w: 900 }) : '');   // 見本：日本語はこげ茶、英語は明るい茶の太字
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
    const txt = T(x, y - (en ? 18 : -fs * .32), fs, ja, { fill: '#4A2C16' }) + (en ? T(x, y + 40, 34, en, { fill: '#A0683A', w: 900 }) : '');
    return `<g opacity="${a.toFixed(2)}" transform="translate(${x} ${y + h / 2}) scale(${s.toFixed(3)}) translate(${-x} ${-(y + h / 2)})">${dots}<g transform="translate(0 6)" opacity=".15">${cloud('#000')}</g><g stroke="${INK}" stroke-width="12">${cloud(INK)}</g>${cloud('#fff')}${txt}</g>`;
  };
  // ---- 最後の赤い札（見本：「つづく ▶ 何を隠してる？ / Follow for Part 2 ▶ What is he hiding?」。少し右上がり）----
  // ja が長いとき（13文字より長い）は「つづく ▶」を1行目に小さく、問いかけを2行目に大きく
  NEO.ending = (ja, en, k = 1, t = 0) => {
    if (k <= 0) return '';
    // 2026-11-25 ブラッシュアップ：見本と同じく、1行に入るなら1行（「つづく ▶ 何を隠してる？」）・右上がり −4°・白いふち。出るときにはずみ、そのあと小さくゆれる。まわりに星
    const s = back(Math.min(1, k * 1.5)), a = Math.min(1, k * 4), x = 540, y = 440, w = 960;
    const one = [...ja].length <= 16, m = one ? null : ja.match(/^(.*?▶)\s*(.*)$/);
    const rows = m ? [[m[1], 58], [m[2], Math.min(84, Math.floor(880 / [...m[2]].length))]] : [[ja, Math.min(80, Math.floor(880 / [...ja].length))]];
    const enFs = en ? Math.min(40, Math.floor(1640 / en.length)) : 0;
    const h = 44 + rows.reduce((q, r) => q + r[1] * 1.12, 0) + (en ? enFs + 24 : 0) + 30;
    const rot = -4 + (k >= 1 ? .5 * Math.sin(t * 2.4) : 0);
    let g = `<g transform="rotate(${rot.toFixed(2)} ${x} ${y})"><rect x="${x - w / 2 + 6}" y="${y - h / 2 + 14}" width="${w}" height="${h}" rx="34" fill="#5A1420" opacity=".35"/>`
      + `<rect x="${x - w / 2 - 9}" y="${y - h / 2 - 9}" width="${w + 18}" height="${h + 18}" rx="42" fill="#FFFFFF"/><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="34" fill="${RED}"/>`;
    let ty = y - h / 2 + 36;
    for (const [txt, fs] of rows) { ty += fs * .9; g += T(x, ty + 6, fs, txt, { fill: '#5A1420' }) + T(x, ty, fs, txt, { fill: '#FFFFFF' }); ty += fs * .22; }
    if (en) g += T(x, ty + enFs + 12, enFs, en, { fill: '#FFE34D', w: 900 });
    g += `</g>`;
    for (let i = 0; i < 4; i++) { const px = x + [-470, 480, -430, 455][i], py = y + [-h / 2 - 20, -h / 2 + 10, h / 2 + 26, h / 2 + 6][i], tw = .55 + .45 * Math.sin(t * 5 + i * 1.7); g += NEO.star(px, py, 20 + 6 * (i % 2), tw * Math.min(1, k * 2)); }
    return `<g opacity="${a.toFixed(2)}" transform="translate(${x} ${y}) scale(${s.toFixed(3)}) translate(${-x} ${-y})">${g}</g>`;
  };
  // ---- 小さな飾り（2026-11-25 ブラッシュアップ：見本の「!」「?」・星・ハート・音の文字・時刻の札）----
  NEO.star = (x, y, r, a = 1, c = '#FFD84D') => a <= 0 ? '' : `<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(r / 20).toFixed(3)})" d="M0 -20 Q3 -3 20 0 Q3 3 0 20 Q-3 3 -20 0 Q-3 -3 0 -20Z" fill="${c}" stroke="#FFFFFF" stroke-width="2" opacity="${a.toFixed(2)}"/>`;
  // 「!」「?」：見本と同じ赤・白いふち。出るときにはずむ（k：0〜1）
  NEO.mark = (x, y, ch, k = 1, o = {}) => {
    if (k <= 0) return '';
    const s = back(Math.min(1, k * 1.8)) * (o.s || 1), rot = (o.rot || 0) + 6 * Math.sin(k * 9) * (1 - Math.min(1, k));
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${s.toFixed(3)})" opacity="${Math.min(1, k * 4).toFixed(2)}">` + `<text x="0" y="0" text-anchor="middle" font-family="'Noto Sans CJK JP',sans-serif" font-weight="900" font-size="${o.size || 120}" fill="${o.fill || '#E5383B'}" stroke="#FFFFFF" stroke-width="16" stroke-linejoin="round" paint-order="stroke">${esc(ch)}</text></g>`;
  };
  // 音の文字（見本：「ドドドド」「そろ〜り」「ふわ〜」＝青むらさき・白いふち・ななめ）。k：0〜1 で出て、少しゆれる
  NEO.word = (x, y, txt, k = 1, o = {}) => {
    if (k <= 0) return '';
    const s = (.7 + .3 * back(Math.min(1, k * 2))) * (o.s || 1), a = Math.min(1, k * 4) * (o.a == null ? 1 : o.a);
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${o.rot == null ? -10 : o.rot}) skewX(-10) scale(${s.toFixed(3)})" opacity="${a.toFixed(2)}"><text x="0" y="0" text-anchor="middle" font-family="'Noto Sans CJK JP',sans-serif" font-weight="900" font-size="${o.size || 66}" fill="${o.fill || '#6C7BE0'}" stroke="#FFFFFF" stroke-width="12" stroke-linejoin="round" paint-order="stroke" letter-spacing="2">${esc(txt)}</text></g>`;
  };
  // 時刻・場面の札（見本の「17:59」＝こい紺の角丸・オレンジの字）
  NEO.chip = (x, y, txt, k = 1, o = {}) => {
    if (k <= 0) return '';
    const fs = o.size || 58, w = [...txt].reduce((q, c) => q + (c.charCodeAt(0) > 255 ? fs : fs * .62), 0) + 56, h = fs + 34, s = back(Math.min(1, k * 1.6));
    return `<g transform="translate(${x} ${y}) scale(${s.toFixed(3)})" opacity="${Math.min(1, k * 4).toFixed(2)}"><rect x="${-w / 2 + 4}" y="${-h / 2 + 8}" width="${w}" height="${h}" rx="14" fill="#000" opacity=".25"/><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="14" fill="#232A36" stroke="#3C4656" stroke-width="5"/><text x="0" y="${fs * .36}" text-anchor="middle" font-family="'Noto Sans CJK JP',sans-serif" font-weight="900" font-size="${fs}" fill="#FFB347">${esc(txt)}</text>`
      + (o.en ? `<text x="0" y="${h / 2 + 40}" text-anchor="middle" font-family="'Noto Sans CJK JP',sans-serif" font-weight="900" font-size="34" fill="${CREAM}" stroke="#3B2414" stroke-width="8" stroke-linejoin="round" paint-order="stroke">${esc(o.en)}</text>` : '') + `</g>`;
  };
  // 小さなハート（おいしい・うれしい）。t で上へのぼって消える（k：0〜1）
  NEO.heart = (x, y, k, r = 22) => { if (k <= 0 || k >= 1) return ''; const a = Math.sin(Math.PI * k), yy = y - 70 * k, sx = x + 10 * Math.sin(k * 7); return `<path transform="translate(${sx.toFixed(1)} ${yy.toFixed(1)}) scale(${(r / 22 * (.7 + .3 * k)).toFixed(3)})" d="M0 18 C-6 12 -22 2 -22 -9 C-22 -17 -15 -21 -10 -21 C-5 -21 -2 -18 0 -14 C2 -18 5 -21 10 -21 C15 -21 22 -17 22 -9 C22 2 6 12 0 18Z" fill="#FF8FA3" stroke="#FFFFFF" stroke-width="4" opacity="${a.toFixed(2)}"/>`; };
  // 世界の座標 → 画面の座標（common.js の camera() と同じ寄せ方）
  NEO.w2s = (c, x, y) => { const hw = 540 / c.z, hh = 960 / c.z, cx = Math.max(hw - 40, Math.min(1120 - hw, c.cx)), cy = Math.max(hh - 40, Math.min(1960 - hh, c.cy)); return { x: (x - cx) * c.z + 540, y: (y - cy) * c.z + 960 }; };
  // 飾りをまとめて描く（2026-11-25 ブラッシュアップ）。list：{ a, b, k:'word'|'mark'|'heart'|'star'|'chip', x, y, w:1（世界の座標）, txt, … }
  //   a〜b 秒の間だけ出る。出るときにはずみ、消える前の 0.22 秒でうすくなる。画面の外へはみ出さないよう、位置は内側に寄せる
  NEO.deco = (t, cam, list) => {
    let g = '';
    for (const d of list) {
      if (t < d.a || t >= d.b) continue;
      const kin = Math.min(1, (t - d.a) / .22), out = 1 - Math.max(0, Math.min(1, (t - (d.b - .22)) / .22)), u = (t - d.a) / (d.b - d.a);
      let q = d.w ? NEO.w2s(cam, d.x, d.y) : { x: d.x, y: d.y };
      q = { x: Math.max(d.mx || 150, Math.min(1080 - (d.mx || 150), q.x)), y: Math.max(560, Math.min(1720, q.y)) };
      if (d.k === 'word') g += NEO.word(q.x, q.y - 26 * u, d.txt, kin, { a: out, size: d.size, fill: d.fill, rot: (d.rot == null ? -10 : d.rot) + 2.5 * Math.sin(t * 9 + d.a * 7), s: d.s });
      else if (d.k === 'mark') g += `<g opacity="${out.toFixed(2)}">${NEO.mark(q.x, q.y + 4 * Math.sin(t * 7), d.txt, kin, { size: d.size, fill: d.fill, rot: d.rot })}</g>`;
      else if (d.k === 'heart') g += NEO.heart(q.x, q.y, u, d.r || 24);
      else if (d.k === 'star') g += NEO.star(q.x, q.y, (d.r || 26) * (.7 + .3 * Math.sin(t * 8 + d.a)), kin * out, d.fill);
      else if (d.k === 'sweat') g += `<g transform="translate(${q.x.toFixed(1)} ${(q.y + 12 * (1 - kin) + 3 * Math.sin(t * 3)).toFixed(1)}) scale(${(1.5 * (d.s || 1) * (.7 + .3 * kin)).toFixed(3)})" opacity="${(Math.min(1, kin * 1.5) * out).toFixed(2)}"><path d="M0 -30 C-6 -16 -17 -2 -17 9 C-17 19 -9 25 0 25 C9 25 17 19 17 9 C17 -2 6 -16 0 -30Z" fill="#CFE8F8" stroke="#4A7FB0" stroke-width="3.2" stroke-linejoin="round"/><path d="M-8 4 Q-9 13 -3 17" stroke="#FFFFFF" stroke-width="3.4" fill="none" stroke-linecap="round"/></g>`;   // 汗のしずく（顔の横に見える位置へ）
      else if (d.k === 'chip') g += `<g opacity="${out.toFixed(2)}">${NEO.chip(d.x, d.y, d.txt, kin, { en: d.en, size: d.size })}</g>`;
    }
    return g;
  };
  // 画面全体の色あい（見本のあたたかい夕方の光に寄せる：上からうすい桃色・ふちを少し暗く）。ui のいちばん下に敷く
  NEO.grade = (k = 1) => `<defs><linearGradient id="neoWarm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB98A" stop-opacity="${(.16 * k).toFixed(3)}"/><stop offset=".55" stop-color="#FFD9B0" stop-opacity="${(.05 * k).toFixed(3)}"/><stop offset="1" stop-color="#E9A27A" stop-opacity="${(.12 * k).toFixed(3)}"/></linearGradient><radialGradient id="neoVig" cx=".5" cy=".55" r=".75"><stop offset=".62" stop-color="#3B2414" stop-opacity="0"/><stop offset="1" stop-color="#3B2414" stop-opacity=".2"/></radialGradient></defs><rect x="0" y="0" width="1080" height="1920" fill="url(#neoWarm)" pointer-events="none"/><rect x="0" y="0" width="1080" height="1920" fill="url(#neoVig)" pointer-events="none"/>`;   // pointer-events なし：qa.js の「テロップが顔にかかる」検査に、色あいの板を数えさせない
  // ---- 毛をふわっと（見本の絵：体のふちにだけ短い毛。中はなめらか。2026-11-24 オーナー：ふわっとし過ぎ→「定時1分前」に合わせて弱く）----
  NEO.install = () => {
    if (document.getElementById('neoFluffDefs')) return;
    document.body.insertAdjacentHTML('beforeend', `<svg id="neoFluffDefs" width="0" height="0" style="position:absolute"><defs><filter id="neoFluff" x="-5%" y="-5%" width="110%" height="110%">`
      + `<feTurbulence type="fractalNoise" baseFrequency="0.9 0.9" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G" result="d"/>`
      + `<feMorphology in="SourceAlpha" operator="erode" radius="3" result="er"/><feGaussianBlur in="er" stdDeviation="1.5" result="erb"/><feComposite in="SourceGraphic" in2="erb" operator="in" result="core"/>`
      + `<feMerge><feMergeNode in="d"/><feMergeNode in="core"/></feMerge></filter></defs></svg>`);
    window.NEO_EYES = true;   // rig.js：目を「定時1分前」と同じ、くっきりした形で描く
    // 毛ふわは体だけ。目とメガネ（data-crisp）は、ふわをかけない写しを上に重ねる（2026-11-24 オーナー：目をはっきり）
    if (window.L && !L.__neoCrisp) {
      const orig = L.char; L.__neoCrisp = true;
      L.char = function (id) { orig.apply(this, arguments); NEO.crisp(id); };
    }
    for (const id of ['ren', 'jil']) NEO.crisp(id);
  };
  // 重ね順（2026-11-24 オーナー：社員証・ネクタイが口元からぶら下がって見えた＝くっきり版を全部いちばん上に重ねていた）
  //   ① 体（ふわ）→ ② 体のくっきり部品（社員証・ネクタイ）→ ③ 頭（ふわ）→ ④ 頭のくっきり部品（目・鼻・口・ひげ・メガネ）
  //   元の絵の「体→ネクタイ→頭」の順を守るので、首元の物が顔にかぶらない
  NEO.crisp = (id) => {
    const svg = document.getElementById(id); if (!svg) return;
    svg.style.filter = 'none';
    const g = svg.querySelector(':scope > g:not([data-neo-crisp])'); if (!g) return;
    g.style.filter = 'url(#neoFluff)';
    const sharp = g.querySelectorAll('[data-crisp]'); if (!sharp.length) return;
    const head = g.querySelector('[data-neo-head]');
    const layer = (show, fluff, tag) => {   // show = 元の絵の中で見せる部品の選び方
      const c = g.cloneNode(true);
      c.setAttribute('data-neo-crisp', tag); c.style.filter = fluff ? 'url(#neoFluff)' : 'none'; c.setAttribute('visibility', 'hidden');
      c.querySelectorAll('defs, clipPath').forEach(n => n.remove());
      c.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
      if (!fluff) c.querySelectorAll('[filter]').forEach(n => n.removeAttribute('filter'));
      show(c);
      return c;
    };
    const inHead = n => !!n.closest('[data-neo-head]');
    const crispBody = layer(c => c.querySelectorAll('[data-crisp]').forEach(n => { if (!inHead(n)) n.setAttribute('visibility', 'visible'); }), false, 'body');
    let headFluff = null, crispHead;
    if (head) {
      headFluff = layer(c => { const h = c.querySelector('[data-neo-head]'); h.setAttribute('visibility', 'visible'); h.querySelectorAll('[data-crisp]').forEach(n => n.setAttribute('visibility', 'hidden')); }, true, 'headfluff');
      crispHead = layer(c => c.querySelectorAll('[data-neo-head] [data-crisp]').forEach(n => n.setAttribute('visibility', 'visible')), false, 'head');
      head.setAttribute('visibility', 'hidden');   // ①には頭を描かない（③で描く）
    } else crispHead = layer(c => c.querySelectorAll('[data-crisp]').forEach(n => { if (inHead(n)) n.setAttribute('visibility', 'visible'); }), false, 'head');
    sharp.forEach(n => n.setAttribute('visibility', 'hidden'));   // ふわをかけた方のくっきり部品は消す（ふちのザラザラが残らないように）
    g.querySelectorAll('clipPath *').forEach(n => n.setAttribute('visibility', 'visible'));   // 半目・ジロッの目を切り抜く形は消さない（消すと目が線だけになった。2026-11-24）
    g.after(crispBody, ...(headFluff ? [headFluff] : []), crispHead);
  };
  window.NEO = NEO;
})();
