// 「クリスマスツリーの飾り」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：オフィスにツリー。ジルが赤・金の玉を飾る（きらきら）
// ひっくり返し：レンも飾る → 吊るすのは書類（赤丸の締め切り印つき）→ ツリーが書類だらけ
// オチ：ジルが星の代わりに、てっぺんに「✓」のスタンプ。字幕「飾り：締め切りの書類」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
// ツリー：balls=玉の数（0〜4）、papers=書類の数（0〜5）、star=てっぺん（0 なし／1 ✓）
const TREE = (x, y, balls, papers, star, t) => {
  let s = `<g transform="translate(${x} ${y})"><rect x="-30" y="-20" width="60" height="70" fill="#8C5A3C"/><path d="M-200 -20 L0 -300 L200 -20 Z" fill="#3F8F4E"/><path d="M-160 -170 L0 -400 L160 -170 Z" fill="#4CA35A"/><path d="M-110 -320 L0 -520 L110 -320 Z" fill="#5DB868"/>`;
  const bp = [[-120, -70], [90, -100], [-60, -230], [70, -260]], pp = [[120, -60], [-130, -130], [40, -180], [-70, -320], [60, -360]];
  for (let i = 0; i < balls; i++) s += `<circle cx="${bp[i][0]}" cy="${bp[i][1]}" r="22" fill="${i % 2 ? '#E8473A' : '#F2B544'}"/><circle cx="${bp[i][0] - 6}" cy="${bp[i][1] - 7}" r="6" fill="#fff" opacity=".7"/>`;
  for (let i = 0; i < papers; i++) s += `<g transform="translate(${pp[i][0]} ${pp[i][1]}) rotate(${-12 + i * 7 + Math.sin(t * 3 + i) * 3})"><line x1="0" y1="-30" x2="0" y2="-8" stroke="#3A2414" stroke-width="3"/><rect x="-34" y="-8" width="68" height="84" rx="4" fill="#fff" stroke="#D7CCBB" stroke-width="3"/><rect x="-22" y="8" width="44" height="6" rx="3" fill="#E2D8C8"/><rect x="-22" y="22" width="36" height="6" rx="3" fill="#E2D8C8"/><circle cx="12" cy="52" r="14" fill="none" stroke="#E8473A" stroke-width="4"/></g>`;
  if (star > 0) s += `<g transform="translate(0 -540) scale(${star})"><circle r="34" fill="#5DBB63"/><path d="M-16 0 L-5 12 L18 -13" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  return s + '</g>';
};
var EP = {
  dur: 9.5,
  bgmHolds: '5.4-6.0',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.9, type: 'clink' }, { t: 1.4, type: 'clink' }, { t: 1.9, type: 'clink' }, { t: 2.4, type: 'clink' }, { t: 3.2, type: 'tap' }, { t: 3.7, type: 'tap' }, { t: 4.2, type: 'tap' }, { t: 4.7, type: 'tap' }, { t: 5.2, type: 'tap' },
    { t: 5.6, type: 'twitch' }, { t: 6.4, type: 'blink' }, { t: 7.2, type: 'swish' }, { t: 7.6, type: 'pon' }, { t: 8.2, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [15, 0] });
    const balls = Math.min(4, Math.max(0, Math.floor((t - 0.4) / 0.5)));          // 0.9〜2.4
    const papers = t < 3.2 ? 0 : Math.min(5, Math.floor((t - 2.7) / 0.5));          // 3.2〜5.2
    const star = t >= 7.6 ? outBack(seg(t, 7.6, 8.0)) : 0;
    // ジル（左）：飾る（lean、玉のたびに体を揺らす）→ 書類を見て固まる → 7.2 ✓ を置きに手を伸ばす（stretch）
    const jface = t < 3.2 ? RIG.FACES.smile : t < 7.2 ? RIG.FACES.annoyed : RIG.FACES.smug;
    const jp = Object.assign({}, t < 2.6 ? RIG.POSES.lean : t >= 7.2 ? RIG.POSES.stretch : RIG.POSES.sit, jface, { x: 40, y: DESK - 413 * 1.3, scale: 1.3, bodyTilt: t < 2.6 ? -10 + Math.sin(t * 12) * 3 : 0, eyeLook: .8, headTilt: t >= 5.6 && t < 7.2 ? -12 : 0 });
    L.char('jil', jp, t, '', {});
    // レン（右）：様子を見る → 3.2〜5.2 書類を吊るす（lean、得意げ）→ 満足（smile）→ ✓ に拍手（頭の上下）
    const rface = t < 3.2 ? RIG.FACES.neutral : t < 5.6 ? RIG.FACES.smile : t < 7.6 ? RIG.FACES.smug : RIG.FACES.shy;
    const rp = Object.assign({}, t >= 3.0 && t < 5.4 ? RIG.POSES.lean : RIG.POSES.sit, rface, { x: 540, y: DESK - 413 * 1.35, scale: 1.35, flip: true, bodyTilt: t >= 3.0 && t < 5.4 ? -10 + Math.sin(t * 12) * 3 : 0, eyeLook: .6, headNod: t > 8.0 ? Math.abs(Math.sin(t * 14)) * 8 : 0 });
    L.char('ren', rp, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // ツリー（机の中央・手前）
    fx += TREE(540, DESK - 30, balls, papers, star, t);
    for (let i = 0; i < 4; i++) { const at = 0.4 + (i + 1) * 0.5; if (t > at && t < at + .3) fx += L.sparkles(540, DESK - 300, t, .9, 4); }
    for (let i = 0; i < 5; i++) { const at = 2.7 + (i + 1) * 0.5; if (t > at && t < at + .25) fx += L.impact(540, DESK - 330, seg(t, at, at + .25), .5, '#E8473A'); }
    if (t > 5.6 && t < 7.2) fx += L.emark(230, DESK - 650, 1.0, '…');
    if (t > 7.6 && t < 8.1) fx += L.impact(540, DESK - 570, seg(t, 7.6, 8.1), .9, '#5DBB63');
    if (t > 7.6) fx += L.sparkles(540, DESK - 560, t, 1.0, 6);
    let ui = (t > 1.8 && t < 3.2 ? CHIP(L, 'OFFICE TREE: DAY 1', 'オフィスのツリー。ジルが飾る', 1380, seg(t, 1.8, 2.1)) : '')
      + (t > 4.0 && t < 5.6 ? CHIP_OFF(L, 'ORNAMENTS: DEADLINES', '上司の飾り：締め切りの書類', 1380, seg(t, 4.0, 4.3)) : '')
      + (t > 7.8 && t < 8.6 ? CHIP_OFF(L, 'TOP OF THE TREE: DONE', 'てっぺんは「済」', 1380, seg(t, 7.8, 8.1)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 540, cy: 1000 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1050, d: .9 },
      { t: 3.0, z: 1.25, cx: 600, cy: 1050, d: .5 },                // 書類を吊るす
      { t: 5.5, z: 1.05, cx: 540, cy: 1050, d: .4 },
      { t: 7.4, z: 1.3, cx: 540, cy: 900, d: .4 },                  // てっぺん
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 7.6 && t < 7.7 ? 4 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
