// 「ホワイトボード」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：ジルがホワイトボードに売上のグラフを書く。右肩上がり（きりっ）
// ひっくり返し：課長がペンを持って「ちょっと足すね」→ グラフの山に耳を2本、目と鼻
// オチ：グラフがうさぎの顔に。課長はご満悦、ジルはジト目。字幕「売上グラフ：うさぎになった」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 総見直し（2026-11-10）：字幕は2回まで。3回目以降（オチの説明）は出さず、絵で見せる
// 線を k（0〜1）まで描く：path の長さを使わず、点の列を途中まで
const PART = (pts, k) => { const n = pts.length - 1, m = Math.max(0, Math.min(n, k * n)), i = Math.floor(m), f = m - i; const out = pts.slice(0, i + 1); if (i < n) out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f]); return out.length > 1 ? 'M' + out.map(p => p.join(' ')).join(' L') : ''; };
// ボード（左上が 140,300・幅 800・高さ 520）
const BX = 140, BY = 120;   // サムネイルの文字が板の線にかからないよう、板は高めに
const GRAPH = [[60, 440], [180, 400], [300, 410], [420, 320], [500, 170], [580, 320], [700, 250], [760, 200]].map(([x, y]) => [BX + x, BY + y]);   // まんなかに大きな山
var EP = {
  dur: 9.5,
  bgmHolds: '5.6-6.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.7, type: 'swish' }, { t: 1.5, type: 'swish' }, { t: 2.3, type: 'chime' }, { t: 3.2, type: 'blink' }, { t: 3.8, type: 'swish' }, { t: 4.3, type: 'swish' }, { t: 4.8, type: 'tap' },
    { t: 5.1, type: 'tap' }, { t: 5.4, type: 'tap' }, { t: 5.9, type: 'pon' }, { t: 7.0, type: 'twitch' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [14, 0], noClock: true });
    const g = seg(t, .6, 2.2);                              // ジルがグラフを書く
    const e1 = seg(t, 3.8, 4.3), e2 = seg(t, 4.3, 4.8);     // 課長が耳を2本
    const face = seg(t, 4.8, 5.6);                           // 目・鼻・口
    // ジル（左）：書く（lean・きりっ）→ 満足 → 課長が書き足すのに「？」→ うさぎの顔にジト目
    const jl = t > .5 && t < 2.3;
    const jface = t < 2.3 ? RIG.FACES.sharp : t < 3.6 ? Object.assign({}, RIG.FACES.smile, { sparkle: 1 }) : t < 5.8 ? Object.assign({}, RIG.FACES.think, { question: 1 }) : RIG.FACES.annoyed;
    L.char('jil', Object.assign({}, jl ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 20, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: .4, bodyTilt: jl ? -10 : 0 }), t, '', {});
    // レン（右）：見ている → ペンを持って立つ（stand）→ 書き足す（lean）→ ご満悦
    const rl = t > 3.7 && t < 5.7;
    const rface = t < 3.2 ? RIG.FACES.neutral : t < 3.7 ? Object.assign({}, RIG.FACES.smile, { sparkle: 1 }) : t < 5.7 ? RIG.FACES.sharp : Object.assign({}, RIG.FACES.smug, { sparkle: t < 7.2 ? 1 : 0 });
    L.char('ren', Object.assign({}, rl ? RIG.POSES.lean : t > 3.2 && t < 3.7 ? RIG.POSES.stand : RIG.POSES.sit, rface, { x: 560, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: -.5, bodyTilt: rl ? 10 : 0 }), t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // ホワイトボード（キャラの頭より上）
    fx += `<g><rect x="${BX - 14}" y="${BY - 14}" width="828" height="548" rx="16" fill="#9AA3AE"/><rect x="${BX}" y="${BY}" width="800" height="520" rx="8" fill="#FBFCFD"/>`
      + `<path d="M${BX + 50} ${BY + 30} L${BX + 50} ${BY + 470} L${BX + 780} ${BY + 470}" stroke="#46525E" stroke-width="6" fill="none"/>`
      + `<text x="${BX + 70}" y="${BY + 50}" font-family="Noto Sans CJK JP" font-weight="900" font-size="34" fill="#46525E">売上</text></g>`;
    const d = PART(GRAPH, g); if (d) fx += `<path d="${d}" stroke="#2F6FA8" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    // 課長の書き足し：山のてっぺん（GRAPH[4]）に耳を2本、山の中に目と鼻と口（赤いペン）
    const [px, py] = GRAPH[4];
    const ear = (dx, k) => k <= 0 ? '' : `<path d="${PART([[px + dx - 26, py + 30], [px + dx - 34, py - 90], [px + dx, py - 140], [px + dx + 34, py - 90], [px + dx + 26, py + 30]], k)}" stroke="#E8473A" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    fx += ear(-34, e1) + ear(34, e2);
    if (face > 0) fx += `<g opacity="${Math.min(1, face * 3)}"><circle cx="${px - 34}" cy="${py + 90}" r="12" fill="#E8473A"/><circle cx="${px + 34}" cy="${py + 90}" r="12" fill="#E8473A"/></g>`
      + (face > .4 ? `<path d="M${px - 10} ${py + 120} L${px + 10} ${py + 120} L${px} ${py + 132} Z" fill="#E8473A"/>` : '')
      + (face > .7 ? `<path d="M${px - 26} ${py + 140} Q${px - 13} ${py + 156} ${px} ${py + 140} Q${px + 13} ${py + 156} ${px + 26} ${py + 140}" stroke="#E8473A" stroke-width="7" fill="none" stroke-linecap="round"/>` : '');
    if (t > 5.8 && t < 7.0) fx += L.sparkles(px, py + 60, t, 1.6, 8);
    if (t > 7.0 && t < 8.6) fx += L.emark(220, DESK - 640, 1.0, '…');
    let ui = (t > 0.8 && t < 2.6 ? CHIP(L, 'SALES ARE UP', 'ジル、売上のグラフ', 1600, seg(t, .8, 1.1)) : '')
      + (t > 3.8 && t < 5.6 ? CHIP(L, 'BOSS ADDS A LITTLE…', '課長が少し書き足す', 1600, seg(t, 3.8, 4.1)) : '')
      + (t > 6.2 && t < 8.6 ? CHIP_OFF(L, 'THE CHART: A BUNNY', '売上グラフ：うさぎになった', 1600, seg(t, 6.2, 6.5)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.25, cx: 400, cy: 900 },
      { t: 0.01, z: 1.0, cx: 540, cy: 960, d: .9 },
      { t: 3.6, z: 1.3, cx: 640, cy: 520, d: .5 },                  // 書き足し
      { t: 5.8, z: 1.0, cx: 540, cy: 960, d: .5 },                  // うさぎの顔（引き）
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
