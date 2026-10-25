// エピソード共通：オフィス背景・効果・エンドカード・ユーティリティ
const NS = 'http://www.w3.org/2000/svg';
const el = (n, a, k) => { const e = document.createElementNS(NS, n); for (const x in a) e.setAttribute(x, a[x]); (k || []).forEach(c => c && e.appendChild(c)); return e; };
const lerp = (a, b, t) => a + (b - a) * t, clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const pulse = (t, a, b) => { const u = seg(t, a, b); return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0; };
const clear = id => { const n = document.getElementById(id); while (n.firstChild) n.removeChild(n.firstChild); return n; };

// 頭のてっぺん（ワールド座標）。小物を頭に乗せるとき用
function headTop(P) {
  const lx = P.char === 'ren' ? 180 : 188, ly = P.char === 'ren' ? 105 : 120;
  const x = P.flip ? 400 - lx : lx;
  return { x: P.x + x * P.scale, y: P.y + (ly + (P.headNod || 0)) * P.scale };
}

// 画面揺れ（足ダン）
function shakeAt(t, t0, dur = 0.45, amp = 22) {
  if (t > t0 && t < t0 + dur) { const k = 1 - seg(t, t0, t0 + dur); return { x: Math.sin(t * 140) * amp * k, y: Math.cos(t * 170) * amp * 0.64 * k }; }
  return { x: 0, y: 0 };
}

// オフィス背景。o = { clock:[h,m], papers:'neat'|'messy'|number(0=messy→1=neat), mug:true, dim:0〜1, shake }
function office(o) {
  o = Object.assign({ clock: [9, 55], papers: 'neat', mug: true, dim: 0, shake: { x: 0, y: 0 } }, o);
  const bg = clear('bg');
  const [h, m] = o.clock, angM = (m / 60) * 360, angH = ((h % 12) / 12) * 360 + angM / 12;
  const hand = (ang, len, w, c) => el('line', { x1: 0, y1: 0, x2: 0, y2: -len, stroke: c, 'stroke-width': w, 'stroke-linecap': 'round', transform: `rotate(${ang})` });
  const neat = o.papers === 'neat' ? 1 : o.papers === 'messy' ? 0 : o.papers;
  const sheets = [];
  const mess = [[-14, -30, 10], [9, 26, -6], [-22, -10, 18], [16, 12, -12], [-6, 40, 4], [20, -24, -16]];
  mess.forEach((d, i) => {
    const M = o.paperMess || 1; const r = lerp(d[0], 0, neat) * M, dx = lerp(d[1], 0, neat) * M, dy = lerp(d[2], 0, neat) * M - (o.paperLift || 0) * (40 + i * 16);
    sheets.push(el('rect', { x: 300 + dx, y: 1158 - i * 9 + dy, width: 220, height: 30, fill: i % 2 ? '#FFFFFF' : '#FBF7EF', stroke: '#D8CBB6', 'stroke-width': 4, transform: `rotate(${r} ${410 + dx} ${1173 - i * 9 + dy})` }));
  });
  bg.appendChild(el('g', { transform: `translate(${o.shake.x} ${o.shake.y})` }, [
    el('rect', { x: -40, y: -40, width: 1160, height: 2000, fill: '#F4ECE0' }),
    el('rect', { x: -40, y: 1180, width: 1160, height: 800, fill: '#E3D3BC' }),
    el('rect', { x: 120, y: 220, width: 520, height: 360, rx: 18, fill: o.dim > 0.5 ? '#3E5470' : '#DCEAF4', stroke: '#C9B79E', 'stroke-width': 12 }),
    el('line', { x1: 380, y1: 220, x2: 380, y2: 580, stroke: '#C9B79E', 'stroke-width': 12 }),
    el('line', { x1: 120, y1: 400, x2: 640, y2: 400, stroke: '#C9B79E', 'stroke-width': 12 }),
    el('circle', { cx: 860, cy: 330, r: 96, fill: '#FFFFFF', stroke: '#C9B79E', 'stroke-width': 12 }),
    el('g', { transform: 'translate(860 330)' }, [hand(angH, 52, 10, '#4E3626'), hand(angM, 76, 8, '#4E3626'), el('circle', { r: 8, fill: '#4E3626' })]),
    el('ellipse', { cx: 120, cy: 1010, rx: 40, ry: 90, fill: '#7CB36A', transform: 'rotate(-22 120 1010)' }),
    el('ellipse', { cx: 190, cy: 1000, rx: 40, ry: 96, fill: '#6A9E5A', transform: 'rotate(18 190 1000)' }),
    el('ellipse', { cx: 155, cy: 985, rx: 36, ry: 104, fill: '#7CB36A' }),
    el('rect', { x: 105, y: 1080, width: 100, height: 120, rx: 16, fill: '#C77C55' }),
    el('rect', { x: 300, y: 1240, width: 36, height: 420, fill: '#8E6844' }), el('rect', { x: 980, y: 1240, width: 36, height: 420, fill: '#8E6844' }),
    el('rect', { x: 240, y: 1190, width: 840, height: 56, rx: 12, fill: '#A97E55', stroke: '#6B4E32', 'stroke-width': 6 }),
    ...sheets,
    el('rect', { x: 700, y: 960, width: 300, height: 200, rx: 16, fill: '#3B4A5A' }),
    el('rect', { x: 718, y: 978, width: 264, height: 160, rx: 8, fill: o.dim > 0.5 ? '#26313D' : '#9FC3DE' }),
    el('rect', { x: 830, y: 1160, width: 40, height: 30, fill: '#3B4A5A' }),
    o.mug ? mugShape(560, 1120, 1) : null
  ]));
  document.getElementById('dim').style.opacity = o.dim * 0.55;
}
function mugShape(x, y, s, rot = 0) {
  return el('g', { transform: `translate(${x} ${y}) rotate(${rot} ${35 * s} ${36 * s}) scale(${s})` }, [
    el('rect', { x: 0, y: 0, width: 70, height: 72, rx: 12, fill: '#C9962F', stroke: '#4E3626', 'stroke-width': 5 }),
    el('path', { d: 'M70 16 q26 0 26 20 q0 20 -26 20', fill: 'none', stroke: '#4E3626', 'stroke-width': 5 })
  ]);
}

// 足ダンの衝撃波（黄色い輪）
function thumpWave(f, t, t0, cx, cy) {
  const u = seg(t, t0, t0 + 0.55);
  if (u <= 0 || u >= 1) return;
  const r = 40 + 360 * u;
  f.appendChild(el('circle', { cx, cy, r, fill: 'none', stroke: '#F2C14E', 'stroke-width': 18 * (1 - u), opacity: 1 - u }));
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; f.appendChild(el('line', { x1: cx + Math.cos(a) * (r + 20), y1: cy + Math.sin(a) * (r + 20) * 0.5, x2: cx + Math.cos(a) * (r + 90), y2: cy + Math.sin(a) * (r + 90) * 0.5, stroke: '#F2C14E', 'stroke-width': 10 * (1 - u), 'stroke-linecap': 'round', opacity: 1 - u })); }
}
// きらっ
function sparkle(f, t, t0, cx, cy, s = 1) {
  const u = seg(t, t0, t0 + 0.6); if (u <= 0 || u >= 1) return;
  const k = Math.sin(Math.PI * u) * s;
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; const d = 70 + 40 * u; f.appendChild(el('path', { d: `M0 -18 L5 -5 L18 0 L5 5 L0 18 L-5 5 L-18 0 L-5 -5 Z`, fill: '#F2C14E', transform: `translate(${cx + Math.cos(a) * d} ${cy + Math.sin(a) * d}) scale(${k})` })); }
}
// 音符（チャイム）
function notes(f, t, t0, cx, cy) {
  const u = seg(t, t0, t0 + 1.4); if (u <= 0 || u >= 1) return;
  [0, 1, 2].forEach(i => { const v = clamp(u * 1.4 - i * 0.2, 0, 1); if (v <= 0 || v >= 1) return;
    const x = cx + (i - 1) * 70 + Math.sin(v * 6 + i) * 12, y = cy - 160 * v;
    f.appendChild(el('g', { transform: `translate(${x} ${y})`, opacity: 1 - v }, [el('ellipse', { cx: 0, cy: 0, rx: 16, ry: 12, fill: '#355F86', transform: 'rotate(-20)' }), el('line', { x1: 14, y1: -2, x2: 14, y2: -52, stroke: '#355F86', 'stroke-width': 5 }), el('path', { d: 'M14 -52 q18 6 16 24', fill: 'none', stroke: '#355F86', 'stroke-width': 5 })])); });
}

// エンドカード（最後0.6秒）
function endcard(t, dur) { document.getElementById('end').style.opacity = seg(t, dur - 0.9, dur - 0.4); }

// キャラ1体を描く（ベース＋表情＋ポーズ＋上書き → 生命感 → 描画）
function draw(svgId, char, base, t, opt) {
  const P = Object.assign({}, RIG.DEFAULTS, { char, id: svgId }, base);
  const Q = RIG.alive(P, t, opt);
  RIG.render(document.getElementById(svgId), Q);
  return Q;
}

// ---------- v2：仮想カメラ（寄り・引き・カット・ズームパンチ） ----------
// shots = [{t, cx, cy, z, z2?, ease?}] 各ショットは次のショットの t まで。z→z2 へゆっくり寄る（プッシュイン）
// ショット切替は「瞬間カット」ではなく、なめらかに寄る／引く（いきなり画面が変わらない）。変化が大きいほど時間をかける（0.35〜0.8秒）
const camMoveDur = (a, b) => clamp(0.3 + 0.45 * Math.abs(Math.log(b.z / a.z)) + 0.3 * Math.hypot(b.cx - a.cx, b.cy - a.cy) / 1000, 0.35, 0.8);
function cameraAt(shots, t) {
  let i = 0; while (i + 1 < shots.length && shots[i + 1].t <= t) i++;
  const s = shots[i], end = i + 1 < shots.length ? shots[i + 1].t : s.t + 4;
  const u = clamp((t - s.t) / (end - s.t), 0, 1);
  const cur = { z: lerp(s.z, s.z2 != null ? s.z2 : s.z, u), cx: lerp(s.cx, s.cx2 != null ? s.cx2 : s.cx, u), cy: lerp(s.cy, s.cy2 != null ? s.cy2 : s.cy, u) };
  if (i === 0) return cur;
  // 前ショットの終端から現ショットへ、イーズでつなぐ
  const ps = shots[i - 1];
  const prev = { z: ps.z2 != null ? ps.z2 : ps.z, cx: ps.cx2 != null ? ps.cx2 : ps.cx, cy: ps.cy2 != null ? ps.cy2 : ps.cy };
  const D = camMoveDur(prev, cur); if (t - s.t >= D) return cur;
  const k = ease(clamp((t - s.t) / D, 0, 1));
  return { z: lerp(prev.z, cur.z, k), cx: lerp(prev.cx, cur.cx, k), cy: lerp(prev.cy, cur.cy, k) };
}
function camera(c, punch) {
  // punch: 0〜1 のズームパンチ（足ダンの瞬間にぐっと寄って戻る）
  const z = c.z * (1 + 0.12 * (punch || 0));
  // 画面外（背景の外）が映らないように中心を制限
  const hw = 540 / z, hh = 960 / z;
  const cx = clamp(c.cx, hw - 40, 1120 - hw), cy = clamp(c.cy, hh - 40, 1960 - hh);
  document.getElementById('world').style.transform = `translate(${540 - cx * z}px, ${960 - cy * z}px) scale(${z})`;
}
// 画面空間の演出（集中線・衝撃フラッシュ）
function speedLines(ui, k, cx = 540, cy = 960, color = '#3B2E22') {
  if (k <= 0) return;
  for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2 + (i % 3) * 0.05; const r1 = 520 + (i * 37 % 120), r2 = 1300;
    ui.appendChild(el('line', { x1: cx + Math.cos(a) * r1, y1: cy + Math.sin(a) * r1, x2: cx + Math.cos(a) * r2, y2: cy + Math.sin(a) * r2, stroke: color, 'stroke-width': 6 + (i % 4) * 3, opacity: 0.18 * k })); }
}
function impactFlash(ui, k) { if (k > 0) ui.appendChild(el('rect', { x: 0, y: 0, width: 1080, height: 1920, fill: '#FFF6DA', opacity: 0.3 * k })); }

// ---------- v2 ヘルパ ----------
// 足ダン（a:構え開始, b:着地）。着地の瞬間に shakeAt/thumpWave を合わせる
function thumpPose(P, t, a, b, sh, base_y = 1240) {
  const th = seg(t, a, b);
  if (th > 0 && th < 1) { const up = th < 0.75 ? th / 0.75 : 1 - (th - 0.75) / 0.25; Object.assign(P, RIG.POSES.thump, RIG.FACES.angry, { legLift: up, y: base_y - 30 * up + sh.y }); return true; }
  return false;
}
// 押す・寄るなど「行って戻る」動き（a→b で到達、c→d で戻る）0〜1
function goBack(t, a, b, c, d) { return ease(seg(t, a, b)) * (1 - ease(seg(t, c, d))); }
// 標準の締め：ズームパンチ・集中線・フラッシュ
function impactAt(ui, t, t0) { speedLines(ui, t > t0 - 0.05 && t < t0 + 0.5 ? 1 - seg(t, t0 - 0.05, t0 + 0.5) : 0); impactFlash(ui, Math.max(0, 1 - Math.abs(t - t0 - 0.02) / 0.12)); return Math.max(0, 1 - Math.abs(t - t0) / 0.25); }
const FACE_REN = { x: 360, y: 900 }, FACE_JIL = { x: 860, y: 1470 };
