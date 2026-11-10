// 「プレゼント交換」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：プレゼント交換。ジルは小さな箱（赤・リボン）を用意。そこへ大きな箱（緑・金のリボン、札「TO: JILL」）がすべってくる
// ひっくり返し：ジルがリボンをほどく → ふたが飛ぶ → 中から課長（binky）
// オチ：課長は箱の中でご満悦。ジルはジト目「…」。字幕「中身：上司」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
// 大きな箱（下の中心 x、底 y）。open=0〜1 でリボンがほどける、lid=ふたの飛び（0〜1）
const BOX = (x, y, untie, lid) => { const w = 380, h = 300, top = y - h;
  let s = `<g><rect x="${x - w / 2}" y="${top}" width="${w}" height="${h}" rx="16" fill="#3E8A55"/><rect x="${x - w / 2}" y="${top}" width="${w}" height="${h}" rx="16" fill="none" stroke="#2D6A40" stroke-width="6"/>`
    + `<g fill="#9CCB6E" opacity=".55">${[0, 1, 2, 3, 4, 5].map(i => `<circle cx="${x - w / 2 + 40 + i * 60}" cy="${top + 60 + (i % 2) * 120}" r="12"/>`).join('')}</g>`;
  if (untie < 1) s += `<rect x="${x - 22}" y="${top}" width="44" height="${h}" fill="#F2C230" opacity="${1 - untie}"/>`;
  // 札
  s += `<g transform="translate(${x + 120} ${top + 200}) rotate(-8)"><rect x="-70" y="-28" width="140" height="56" rx="10" fill="#FFF7E8" stroke="#C9A24A" stroke-width="4"/><text y="12" text-anchor="middle" font-family="Noto Sans" font-weight="900" font-size="28" fill="#3A2414">TO: JILL</text></g></g>`;
  // ふた（飛ぶ）
  const ly = top - 30 - lid * 700, lr = lid * 40;
  s += `<g transform="translate(${x + lid * 260} ${ly + 30}) rotate(${lr})"><rect x="${-w / 2 - 14}" y="-30" width="${w + 28}" height="60" rx="14" fill="#357A4A" stroke="#2D6A40" stroke-width="6"/>`
    + (untie < 1 ? `<rect x="-22" y="-30" width="44" height="60" fill="#F2C230" opacity="${1 - untie}"/><g opacity="${1 - untie}" transform="translate(0 -34) scale(${1 - untie * .5})"><path d="M0 0 C-60 -60 -110 -10 -70 14 C-40 30 -14 10 0 0 Z M0 0 C60 -60 110 -10 70 14 C40 30 14 10 0 0 Z" fill="#F2C230" stroke="#C9A24A" stroke-width="5"/><circle r="16" fill="#E0A92A"/></g>` : '')
    + `</g>`;
  return s; };
var EP = {
  dur: 9.5,
  bgmHolds: '5.4-6.0',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.9, type: 'chime' }, { t: 2.1, type: 'swish' }, { t: 2.8, type: 'thump' }, { t: 3.4, type: 'blink' }, { t: 4.4, type: 'tap' }, { t: 4.9, type: 'tap' },
    { t: 5.6, type: 'boing' }, { t: 6.0, type: 'chime' }, { t: 7.0, type: 'blink' }, { t: 7.6, type: 'twitch' }, { t: 8.3, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [15, 0] });
    const bx = 1300 - 600 * ease(seg(t, 2.0, 2.8));          // 箱がすべってくる
    const untie = seg(t, 4.4, 5.3), lid = ease(seg(t, 5.5, 6.3));
    const pop = (u => 1 - (1 - u) * (1 - u))(seg(t, 5.6, 6.6));   // 速すぎると瞬間移動に見えるので、1秒かけて出てくる
    // ジル（左）：小さな箱を用意（にこ）→ 大きな箱に「？」→ 札を見てうれしい → リボンをほどく（lean）→ びっくり → ジト目
    const jface = t < 2.0 ? RIG.FACES.smile : t < 3.4 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : t < 5.6 ? Object.assign({}, RIG.FACES.smile, { sparkle: t > 3.4 && t < 4.2 ? 1 : 0 }) : t < 7.0 ? Object.assign({}, RIG.FACES.surprised, { excl: 1 }) : RIG.FACES.annoyed;
    const reach = t >= 4.2 && t < 5.4;
    const jp = Object.assign({}, reach ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 30, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: .8, bodyTilt: reach ? -14 : 0, question: t >= 2.8 && t < 3.4 ? 1 : 0 });
    L.char('jil', jp, t, '', {});
    // レン：箱の中（見えない）→ 飛び出す（binky）→ 箱の中でご満悦
    if (t >= 5.6) {
      const up = t < 7.0 ? RIG.POSES.binky : RIG.POSES.sit, rf = t < 7.0 ? Object.assign({}, RIG.FACES.smile, { sparkle: 1 }) : RIG.FACES.smug;
      const ry = DESK - 120 - 760 * pop + (t < 7.0 ? 0 : 190 * ease(seg(t, 7.0, 7.4)));
      L.char('ren', Object.assign({}, up, rf, { x: bx - 300, y: ry, scale: 1.35, flip: true, eyeLook: .6 }), t, '', {});
    } else L.char('ren', null, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // ジルの小さなプレゼント
    fx += `<g transform="translate(440 ${DESK - 70})"><rect x="-60" y="-50" width="120" height="100" rx="10" fill="#E8473A"/><rect x="-10" y="-50" width="20" height="100" fill="#F2C230"/><path d="M0 -50 C-30 -80 -56 -56 -34 -46 Z M0 -50 C30 -80 56 -56 34 -46 Z" fill="#F2C230"/></g>`;
    // 大きな箱（課長はこの後ろから出てくる）
    fx += BOX(bx, DESK, untie, lid);
    if (t > 2.8 && t < 3.2) fx += L.impact(bx, DESK - 40, seg(t, 2.8, 3.2), .8, '#C9A24A');
    if (t > 5.6 && t < 6.6) fx += L.sparkles(bx, DESK - 520, t, 1.4, 10);
    if (t > 7.4 && t < 8.6) fx += L.emark(220, DESK - 650, 1.0, '…');
    let ui = (t > 0.8 && t < 2.2 ? CHIP(L, 'GIFT EXCHANGE', 'プレゼント交換', 1580, seg(t, .8, 1.1)) : '')
      + (t > 3.4 && t < 4.6 ? CHIP_OFF(L, 'TO: JILL', '大きな箱、ジルあて', 1580, seg(t, 3.4, 3.7)) : '')
      + (t > 6.6 && t < 8.6 ? CHIP_OFF(L, 'INSIDE: THE BOSS', '中身：上司', 1580, seg(t, 6.6, 6.9)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 380, cy: 1180 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1150, d: .9 },
      { t: 4.2, z: 1.25, cx: 620, cy: 1200, d: .6 },               // ほどく
      { t: 5.5, z: 1.0, cx: 560, cy: 1050, d: .4 },                // 飛び出す（引き）
      { t: 7.2, z: 1.15, cx: 520, cy: 1120, d: .6 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 5.6 && t < 5.9 ? 6 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
