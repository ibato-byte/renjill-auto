// 「窓を3秒開けた」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：外は雪（窓の向こうに雪）。暖房でぽかぽかの部屋。レンが「ちょっと換気」と窓を開ける（レンが窓際へ）
// ひっくり返し：3秒（数字）で雪が吹き込む → 机とジルの頭に雪が積もる
// オチ：レンは机の雪で小さな雪うさぎを作ってご満悦。字幕「換気：3秒。雪うさぎ：1羽」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
const FLAKES = (t, n, x0, x1, y0, y1, op) => { let s = `<g fill="#fff" opacity="${op}">`; for (let i = 0; i < n; i++) { const u = (i * 0.618) % 1, ph = (t * (.35 + (i % 5) * .08) + u) % 1; const x = x0 + (x1 - x0) * ((u * 7 + Math.sin(t * 1.3 + i) * .04 + 1) % 1), y = y0 + (y1 - y0) * ph; s += `<circle cx="${x}" cy="${y}" r="${6 + (i % 3) * 3}"/>`; } return s + '</g>'; };
const DRIFT = (x, y, w, h) => h <= 0 ? '' : `<path d="M${x - w / 2} ${y} Q${x - w / 4} ${y - h} ${x} ${y - h * .8} Q${x + w / 4} ${y - h * 1.1} ${x + w / 2} ${y} Z" fill="#fff" stroke="#DCE9F5" stroke-width="4"/>`;
const SNOWBUNNY = (x, y, k) => k <= 0 ? '' : `<g transform="translate(${x} ${y}) scale(${k})"><ellipse cx="0" cy="0" rx="70" ry="48" fill="#fff" stroke="#DCE9F5" stroke-width="4"/><ellipse cx="-30" cy="-60" rx="12" ry="34" fill="#7FB37A" transform="rotate(-18 -30 -60)"/><ellipse cx="-6" cy="-64" rx="12" ry="34" fill="#7FB37A" transform="rotate(10 -6 -64)"/><circle cx="-34" cy="-14" r="5" fill="#E8473A"/><circle cx="-12" cy="-14" r="5" fill="#E8473A"/></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '4.4-5.0',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.0, type: 'swish' }, { t: 1.6, type: 'click' }, { t: 2.0, type: 'whoosh' }, { t: 2.8, type: 'whoosh' }, { t: 3.6, type: 'whoosh' }, { t: 4.4, type: 'twitch' }, { t: 4.9, type: 'click' }, { t: 5.6, type: 'swish' },
    { t: 6.2, type: 'tap' }, { t: 6.6, type: 'tap' }, { t: 7.0, type: 'tap' }, { t: 7.6, type: 'pon' }, { t: 8.2, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [11, 0] }) + FLAKES(t, 30, 70, 390, 230, 650, .9) + FLAKES(t, 30, 690, 1010, 230, 650, .9);
    const open = t >= 1.6 && t < 4.9;                        // 窓が開いている（3秒ちょっと）
    const snowK = t < 2.0 ? 0 : Math.min(1, (t - 2.0) / 2.9);  // 積もり具合
    const bunny = t >= 7.0 ? outBack(seg(t, 7.0, 7.6)) : 0;
    // レン：1.0 窓際へ（右の窓の下に立つ：x 700）→ 1.6 開ける（lean）→ 4.9 閉めて戻る → 6.2〜 机の雪で雪うさぎ（頭を上下）→ ご満悦
    const rh = t >= 1.0 && t < 1.5 ? RIG.hop(t, 1.0, 1.5, 540, 700, { hops: 1, height: 30 }) : t >= 5.0 && t < 5.5 ? RIG.hop(t, 5.0, 5.5, 700, 540, { hops: 1, height: 30 }) : { x: t >= 1.5 && t < 5.0 ? 700 : 540, yOff: 0, squash: 0 };
    const rface = t < 4.4 ? RIG.FACES.smile : t < 6.2 ? Object.assign({}, RIG.FACES.oops, { sweat: 0 }) : t < 7.6 ? RIG.FACES.neutral : RIG.FACES.smug;
    const rp = Object.assign({}, t >= 1.5 && t < 5.0 ? RIG.POSES.stand : RIG.POSES.sit, rface, { x: rh.x, y: DESK - 413 * 1.35 + rh.yOff, scale: 1.35, flip: true, bodySquash: rh.squash, eyeLook: .4, headNod: t >= 6.2 && t < 7.0 ? Math.abs(Math.sin(t * 14)) * 10 : 0 });
    L.char('ren', rp, t, '', {});
    // ジル（左）：ぽかぽか（にこ）→ 雪が頭に積もる → ジト目でレンを見る
    const jface = t < 2.6 ? RIG.FACES.smile : t < 4.4 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : RIG.FACES.annoyed;
    const jp = Object.assign({}, RIG.POSES.sit, jface, { x: 40, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: .8, bodyTilt: t >= 2.6 && t < 4.9 ? Math.sin(t * 40) * 2 : 0 });
    L.char('jil', jp, t, snowK > .3 ? DRIFT(40 + 350, DESK - 413 * 1.3 + 110, 200, 36 * snowK) : '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // 開いた窓（右の窓の下半分が開く：枠を少し明るく）と吹き込む雪
    if (open) fx += `<rect x="690" y="440" width="320" height="210" fill="#EAF4FF" opacity=".55" pointer-events="none"/>` + FLAKES(t * 2, 40, 300, 1050, 440, DESK, .95);
    // 3 秒のカウント（窓の横に数字）
    if (t >= 1.6 && t < 4.9) fx += `<g transform="translate(540 760)"><circle r="64" fill="#fff" stroke="#5A3A1E" stroke-width="8"/><text y="24" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="64" fill="#5A3A1E">${Math.max(1, 3 - Math.floor(t - 1.6))}</text></g>`;
    // 机の雪
    fx += DRIFT(300, DESK + 2, 520, 70 * snowK) + DRIFT(760, DESK + 2, 420, 50 * snowK);
    fx += SNOWBUNNY(760, DESK - 40, bunny);
    if (t > 7.0 && t < 7.5) fx += L.impact(760, DESK - 160, seg(t, 7.0, 7.5), .8, '#9BC7F0');
    if (t > 7.6) fx += L.sparkles(760, DESK - 160, t, .9, 5);
    if (t > 4.4 && t < 5.6) fx += L.emark(230, DESK - 650, 1.0);
    let ui = (t > 1.8 && t < 3.3 ? CHIP(L, 'FRESH AIR: 3 SECONDS', '上司の換気。3秒だけ', 1380, seg(t, 1.8, 2.1)) : '')
      + (t > 4.6 && t < 6.0 ? CHIP_OFF(L, 'SNOW: INSIDE', '雪、部屋の中に', 1380, seg(t, 4.6, 4.9)) : '')
      + (t > 7.6 && t < 8.6 ? CHIP_OFF(L, 'RESULT: 1 SNOW BUNNY', '結果：雪うさぎ1羽', 1380, seg(t, 7.6, 7.9)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 540, cy: 1100 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1050, d: .9 },
      { t: 1.5, z: 1.15, cx: 700, cy: 950, d: .5 },                 // 窓
      { t: 4.4, z: 1.05, cx: 540, cy: 1050, d: .4 },                // 引き：雪の部屋
      { t: 6.8, z: 1.35, cx: 720, cy: 1180, d: .5 },                // 雪うさぎ
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
