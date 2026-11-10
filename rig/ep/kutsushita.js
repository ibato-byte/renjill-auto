// 「くつした」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：クリスマスイブの夜。ジルは小さなくつしたを机にかける。課長は床まで届く特大のくつした（にやり）
// ひっくり返し：翌朝。ジルのくつしたには小さな箱。課長の特大くつしたは、ぺたんこ → 頭から潜って探す（足だけ見える）
// オチ：出てきた課長の口に、牧草1本。それでもご満悦。字幕「プレゼントは同じ大きさ」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
// くつした（口の左上 x,y・幅 w・長さ h・ふくらみ bulge）
const SOCK = (x, y, w, h, bulge, sw) => { const b = bulge || 0;
  return `<g transform="translate(${x} ${y}) rotate(${sw || 0})"><path d="M0 0 L${w} 0 L${w + b * .2} ${h * .72} C${w + b * .3} ${h * .95} ${w * .9} ${h} ${w * .55} ${h} L${-w * .35} ${h} C${-w * .7} ${h} ${-w * .72} ${h * .7} ${-w * .4} ${h * .66} L${-b * .2} ${h * .62} Z" fill="#D9372E" stroke="#A92820" stroke-width="${Math.max(3, w * .03)}"/>`
    + `<rect x="${-w * .08}" y="${-h * .02}" width="${w * 1.16}" height="${h * .16}" rx="${h * .05}" fill="#FFF7EE" stroke="#E3D6C6" stroke-width="${Math.max(2, w * .02)}"/>`
    + `<path d="M${w * .2} ${h * .3} l${w * .12} ${h * .1} M${w * .55} ${h * .45} l${w * .12} ${h * .1}" stroke="#F0675C" stroke-width="${w * .05}" stroke-linecap="round" opacity=".6"/></g>`; };
var EP = {
  dur: 9.5,
  bgmHolds: '4.6-5.2',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.9, type: 'tap' }, { t: 1.3, type: 'chime' }, { t: 2.1, type: 'swish' }, { t: 2.5, type: 'thump' }, { t: 3.5, type: 'chime' }, { t: 4.3, type: 'pon' },
    { t: 4.9, type: 'blink' }, { t: 5.3, type: 'swish' }, { t: 5.8, type: 'tap' }, { t: 6.2, type: 'tap' }, { t: 6.8, type: 'boing' }, { t: 7.4, type: 'chime' }, { t: 8.2, type: 'pon' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400, morning = t >= 3.4;
    const bg = L.office({ sky: morning ? 'day' : 'night', clock: morning ? [7, 0] : [22, 0] });
    const big = outBack(seg(t, 2.1, 2.6));
    const dive = t >= 5.2 && t < 6.8;
    // ジル（左）：かける（lean）→ 特大を見て「…」→ 朝：自分の箱にきらっ → 課長を見る → にこ
    const jface = t < 2.1 ? RIG.FACES.smile : t < 3.4 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : t < 4.6 ? Object.assign({}, RIG.FACES.smile, { sparkle: 1 }) : t < 7.2 ? RIG.FACES.think : RIG.FACES.smile;
    const jlean = t > .7 && t < 1.4;
    L.char('jil', Object.assign({}, jlean ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 30, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: .8, bodyTilt: jlean ? -10 : 0 }), t, '', {});
    // レン（右）：にやり → 朝、ぺたんこのくつしたに「？」→ 頭から潜る（見えない）→ 牧草1本くわえて出てくる（ご満悦）
    if (!dive) {
      const rface = t < 3.4 ? Object.assign({}, RIG.FACES.smug, { sparkle: t > 2.6 ? 1 : 0 }) : t < 5.2 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : Object.assign({}, RIG.FACES.smile, { sparkle: t < 7.6 ? 1 : 0 });
      const pop = t >= 6.8 ? outBack(seg(t, 6.8, 7.2)) : 1;
      L.char('ren', Object.assign({}, t >= 6.8 && t < 7.2 ? RIG.POSES.binky : RIG.POSES.sit, rface, { x: 540, y: DESK - 413 * 1.35 + (1 - pop) * 200, scale: 1.35, flip: true, eyeLook: .4, question: t >= 4.4 && t < 5.2 ? 1 : 0 }), t,
        t >= 6.8 ? L.hayStrand(800, 1200, 130, -10) : '', {});
    } else L.char('ren', null, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // フック
    fx += `<circle cx="300" cy="${DESK + 40}" r="9" fill="#C9A24A"/><circle cx="760" cy="${DESK + 40}" r="9" fill="#C9A24A"/>`;
    // ジルの小さなくつした（朝は小さな箱がのぞく）
    if (t >= .9) { const s = outBack(seg(t, .9, 1.2));
      if (morning) fx += `<g transform="translate(330 ${DESK + 34})"><rect x="-26" y="-40" width="52" height="46" rx="6" fill="#3E8A55"/><rect x="-5" y="-40" width="10" height="46" fill="#F2C230"/></g>`;
      fx += `<g transform="translate(270 ${DESK + 36}) scale(${s})">${SOCK(0, 0, 80, 150, 0, 4)}</g>`; }
    // 課長の特大くつした（夜はぺたんこ、潜っている間はふくらんで揺れる・足が出る）
    if (t >= 2.1) { const wig = dive ? Math.sin(t * 18) * 3 : 0, bul = dive ? 60 : 0;
      fx += `<g transform="translate(700 ${DESK + 36}) scale(${big})">${SOCK(0, 0, 230, 640, bul, wig)}</g>`;
      if (dive) fx += `<circle cx="815" cy="${DESK - 10}" r="52" fill="#C9A27A"/><circle cx="815" cy="${DESK - 50}" r="40" fill="#FFF7EE" stroke="#E3D6C6" stroke-width="4"/>` + [0, 1].map(k => { const kick = Math.abs(Math.sin(t * 16 + k * 2)) * 50; return `<g transform="translate(${735 + k * 160} ${DESK - 30 - kick}) rotate(${k ? 20 : -20})"><rect x="-30" y="-10" width="60" height="90" rx="28" fill="#C9A27A"/><ellipse cx="0" cy="-14" rx="44" ry="30" fill="#F4E6D2" stroke="#D9C4A8" stroke-width="4"/></g>`; }).join(''); }
    if (t > 2.5 && t < 2.9) fx += L.impact(815, DESK + 640, seg(t, 2.5, 2.9), .7, '#D9372E');
    if (t > 3.6 && t < 4.4) fx += L.sparkles(330, DESK, t, .9, 6);
    if (t > 6.8 && t < 7.6) fx += L.sparkles(800, 1150, t, 1.0, 8);
    // 夜→朝の切りかえ（少し暗く）
    const dim = t > 3.1 && t < 3.7 ? Math.sin(seg(t, 3.1, 3.7) * Math.PI) * .7 : 0;
    let ui = (t > 0.8 && t < 2.2 ? CHIP(L, 'CHRISTMAS EVE', 'イブの夜、くつしたを', 1640, seg(t, .8, 1.1)) : '')
      + (t > 2.6 && t < 3.3 ? CHIP_OFF(L, "BOSS'S: XXL", '上司のは特大', 1640, seg(t, 2.6, 2.9)) : '')
      + (t > 3.7 && t < 4.6 ? CHIP_OFF(L, 'NEXT MORNING', '次の朝', 1640, seg(t, 3.7, 4.0)) : '')
      + (t > 7.2 && t < 8.6 ? CHIP_OFF(L, 'GIFT: SAME SIZE', 'プレゼントは同じ大きさ', 1640, seg(t, 7.2, 7.5)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 360, cy: 1250 },
      { t: 0.01, z: 1.0, cx: 540, cy: 1300, d: .9 },
      { t: 2.0, z: .92, cx: 600, cy: 1380, d: .5 },                 // 特大のくつした（床まで）
      { t: 3.6, z: 1.3, cx: 330, cy: 1300, d: .5 },                 // ジルの箱
      { t: 4.6, z: .95, cx: 620, cy: 1380, d: .5 },                 // 潜る
      { t: 6.8, z: 1.3, cx: 720, cy: 1200, d: .4 },                 // 牧草1本
      { t: 7.6, z: 1.05, cx: 540, cy: 1250, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: 0, dim });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
