// 「お歳暮の箱」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：12月。大きなお歳暮の箱（のし紙つき）が机に届く。二人ともわくわく
// ひっくり返し：開けると中にまた箱 → また箱 …（5回、どんどん小さく）。机の端に空き箱の山
// オチ：最後の小さな箱に、牧草が1本。レンは大喜び（照れ・♥）、ジルはジト目。字幕「箱5個。中身：牧草1本」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
const SIZES = [1, .8, .63, .48, .34];
const OPEN = [2.4, 3.1, 3.8, 4.5, 5.2];          // i 番目の箱を開ける時刻
// 箱（底の中央 x,y）。s=大きさ、lid=ふたの持ち上がり（0〜1）、noshi=のし紙
const BOX = (x, y, s, lid = 0, noshi = false) => { const w = 300 * s, h = 210 * s, lh = 44 * s;
  let g = `<g><rect x="${x - w / 2}" y="${y - h}" width="${w}" height="${h}" rx="${8 * s}" fill="#F6EAD6" stroke="#C9A97E" stroke-width="5"/>`;
  if (noshi) g += `<rect x="${x - w * .2}" y="${y - h}" width="${w * .4}" height="${h}" fill="#fff" stroke="#E2D2B8" stroke-width="3"/><path d="M${x - 18 * s} ${y - h + 30 * s} l18 ${-14 * s} l18 ${14 * s}" fill="none" stroke="#E8473A" stroke-width="6"/>`;
  g += `<rect x="${x - w / 2 - 8 * s}" y="${y - h - lh - lid * 160 * s}" width="${w + 16 * s}" height="${lh}" rx="${6 * s}" fill="#EFDDBF" stroke="#C9A97E" stroke-width="5" transform="rotate(${-lid * 25} ${x - w / 2} ${y - h - lid * 160 * s})"/></g>`; return g; };
const EMPTY = (x, y, s) => `<g><rect x="${x - 150 * s}" y="${y - 210 * s}" width="${300 * s}" height="${210 * s}" rx="${8 * s}" fill="#F6EAD6" stroke="#C9A97E" stroke-width="5"/><rect x="${x - 140 * s}" y="${y - 210 * s}" width="${280 * s}" height="${26 * s}" fill="#D9C3A0"/></g>`;
// 飛んでいくふた（開けた瞬間 0.45 秒）
const LID = (x, y, s, k) => k <= 0 || k >= 1 ? '' : `<g transform="translate(${x + 160 * k * (s > .5 ? 1 : -1)} ${y - 260 * k + 300 * k * k}) rotate(${k * 200})" opacity="${1 - k * .6}"><rect x="${-158 * s}" y="${-22 * s}" width="${316 * s}" height="${44 * s}" rx="${6 * s}" fill="#EFDDBF" stroke="#C9A97E" stroke-width="5"/></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '5.9-6.5',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.0, type: 'thump' }, { t: 2.4, type: 'swish' }, { t: 2.6, type: 'pon' }, { t: 3.1, type: 'swish' }, { t: 3.3, type: 'pon' }, { t: 3.8, type: 'swish' }, { t: 4.0, type: 'pon' }, { t: 4.5, type: 'swish' }, { t: 4.7, type: 'pon' }, { t: 5.2, type: 'swish' },
    { t: 5.6, type: 'chime' }, { t: 6.0, type: 'blink' }, { t: 6.6, type: 'twitch' }, { t: 7.4, type: 'pon' }, { t: 8.2, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400, BX = 560, BY = DESK + 6;
    const bg = L.office({ sky: 'day', clock: [10, 0] });
    const opened = OPEN.filter(o => t >= o).length;                  // 開けた箱の数
    // ジル（左）：わくわく（にこ）→ 箱が続いて「？」→ 牧草1本でジト目
    const jface = t < 3.8 ? RIG.FACES.smile : t < 5.6 ? RIG.FACES.think : RIG.FACES.annoyed;
    const jp = Object.assign({}, RIG.POSES.sit, jface, { x: 40, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: .8, question: t >= 3.8 && t < 5.6 ? 1 : 0 });
    L.char('jil', jp, t, '', {});
    // レン（右）：わくわく → 開ける（lean・前のめり）→ 牧草1本を見て大喜び（照れ・♥）→ もぐもぐ
    const busy = t >= 2.2 && t < 5.5;
    const rface = t < 2.2 ? RIG.FACES.smile : t < 5.5 ? RIG.FACES.sharp : RIG.FACES.shy;
    const rp = Object.assign({}, busy ? RIG.POSES.lean : RIG.POSES.sit, rface, { x: 540, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: .4, bodyTilt: busy ? -10 : 0, headNod: t >= 7.4 ? Math.abs(Math.sin(t * 16)) * 10 : 0, bodySquash: t >= 5.6 && t < 6.0 ? .12 * Math.sin((t - 5.6) * 15) : 0 });
    L.char('ren', rp, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // 届く（0.8〜1.0 で上から落ちてくる）
    const drop = t < 1.0 ? -400 * (1 - ease(seg(t, .5, 1.0))) : 0;
    // 空き箱の山（机の手前・左右の端）：開けた箱の外側から順に積む
    { const pile = [0, 0]; for (let i = 0; i < Math.min(opened, 4); i++) { const side = i % 2, k = ease(seg(t, OPEN[i] + .1, OPEN[i] + .45)), es = SIZES[i] * .62; const tx = side ? 820 : 300, ty = DESK + 6 - pile[side]; fx += EMPTY(BX + (tx - BX) * k, BY + (ty - BY) * k, es); pile[side] += 210 * es; } }
    OPEN.forEach((o, i) => { fx += LID(BX, BY - 210 * SIZES[i] - 22 * SIZES[i], SIZES[i], seg(t, o, o + .45)); });
    // いま机の上にある箱（opened 番目）。開けた直後はふたが飛ぶ
    if (opened < 5) {
      const i = opened, s = SIZES[i], pop = i > 0 ? outBack(seg(t, OPEN[i - 1] + .1, OPEN[i - 1] + .4)) : 1;
      fx += `<g transform="translate(0 ${drop})">` + BOX(BX, BY, s * pop, 0, i === 0) + '</g>';
    } else {
      // 最後の箱：ふたが開いて、牧草が1本
      fx += BOX(BX, BY, SIZES[4], 0).replace(/<rect[^>]*fill="#EFDDBF"[^>]*\/>/, '');
      const hk = outBack(seg(t, 5.4, 5.8));
      if (hk > 0) fx += `<g transform="translate(${BX} ${BY - 90 - 60 * hk}) rotate(-20) scale(${hk})"><path d="M-6 60 q4 -60 -2 -120 q8 -10 10 0 q4 60 0 120 Z" fill="#9CC46A" stroke="#6C9A4A" stroke-width="3"/></g>`;
      if (t > 5.6 && t < 6.1) fx += L.impact(BX, BY - 200, seg(t, 5.6, 6.1), .7, '#9CC46A');
      if (t > 5.8) fx += L.sparkles(BX, BY - 230, t, .7, 5);
    }
    // 開けるたびの小さな衝撃
    OPEN.slice(0, 4).forEach(o => { if (t > o && t < o + .3) fx += L.dust(BX, BY - 120, seg(t, o, o + .3)); });
    // 箱の数（左上に数字）
    if (t >= 2.4 && t < 5.8) fx += `<g transform="translate(540 760)"><circle r="70" fill="#fff" stroke="#C9A97E" stroke-width="10"/><text y="26" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="72" fill="#8C5A3C">${Math.min(5, opened)}</text></g>`;
    if (t > 6.0 && t < 7.2) fx += L.emark(230, DESK - 650, 1.0, '…');
    let ui = (t > 1.4 && t < 2.6 ? CHIP(L, 'A YEAR-END GIFT', '12月。お歳暮が届いた', 1580, seg(t, 1.4, 1.7)) : '')
      + (t > 4.0 && t < 5.4 ? CHIP_OFF(L, 'BOX. BOX. BOX.', '箱の中に、箱', 1580, seg(t, 4.0, 4.3)) : '')
      + (t > 6.6 && t < 8.6 ? CHIP_OFF(L, '5 BOXES. 1 HAY.', '箱5個。中身：牧草1本', 1580, seg(t, 6.6, 6.9)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 540, cy: 1150 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1150, d: .9 },
      { t: 2.3, z: 1.15, cx: 560, cy: 1250, d: .4 },                // 箱
      { t: 5.3, z: 1.4, cx: 600, cy: 1250, d: .4 },                 // 牧草1本
      { t: 6.4, z: 1.05, cx: 540, cy: 1150, d: .5 },                // 引き：空き箱の山とジト目
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 1.0 && t < 1.1 ? 4 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
