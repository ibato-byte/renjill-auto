// 「机の片付け」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：年末。レンの机は書類の山（2つ）。ジルは自分の机がきれい（✓）
// ひっくり返し：レンが目にもとまらぬ速さで片付け → 3秒で机がピカピカ（きらきら）。ジル感心
// オチ：ジルが引き出しを開けると、書類がどさーっと雪崩。字幕「片付け：3秒。行き先：引き出し」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 総見直し（2026-11-10）：字幕は2回まで。3回目以降（オチの説明）は出さず、絵で見せる
const SHEET = (x, y, r, s = 1) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><rect x="-60" y="-42" width="120" height="84" rx="4" fill="#fff" stroke="#D7CCBB" stroke-width="3"/><path d="M-40 -20 h80 M-40 0 h80 M-40 20 h50" stroke="#C9BBA6" stroke-width="5" stroke-linecap="round"/></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '5.4-6.0',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.0, type: 'tap' }, { t: 2.4, type: 'whoosh' }, { t: 2.8, type: 'swish' }, { t: 3.1, type: 'swish' }, { t: 3.4, type: 'swish' }, { t: 3.7, type: 'swish' }, { t: 4.0, type: 'swish' }, { t: 4.4, type: 'chime' },
    { t: 5.4, type: 'blink' }, { t: 6.4, type: 'click' }, { t: 6.8, type: 'whoosh' }, { t: 7.0, type: 'thump' }, { t: 7.6, type: 'twitch' }, { t: 8.2, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [15, 0] });
    const clean = ease(seg(t, 2.6, 4.3));                                  // 片付けの進み
    const pile = Math.round(10 * (1 - clean));
    const fast = t >= 2.6 && t < 4.3;
    const open = ease(seg(t, 6.4, 6.8));                                   // 引き出しが開く
    // ジル（左）：自分の机はきれい（smug）→ レンの山にジト目 → ピカピカに驚く → 感心（にこ・♥）→ 引き出しを開ける（lean）→ 雪崩にがーん
    const jface = t < 2.4 ? RIG.FACES.annoyed : t < 4.4 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : t < 6.4 ? RIG.FACES.shy : t < 7.0 ? RIG.FACES.smile : Object.assign({}, RIG.FACES.surprised, { excl: 1 });
    const jp = Object.assign({}, t >= 6.0 && t < 7.0 ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: 40, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: .8, bodyTilt: t >= 6.0 && t < 7.0 ? -16 : 0 });
    L.char('jil', jp, t, '', {});
    // レン（右）：山の前でのんびり → 本気（sharp・高速で左右に揺れる）→ どや顔 → 雪崩で目をそらす（汗）
    const rface = t < 2.4 ? RIG.FACES.neutral : t < 4.4 ? RIG.FACES.sharp : t < 7.0 ? RIG.FACES.smug : Object.assign({}, RIG.FACES.oops, { sweat: 1, eyeLook: -.7 });
    const rp = Object.assign({}, fast ? RIG.POSES.lean : RIG.POSES.sit, rface, { x: 540, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: t >= 7.0 ? -.7 : .4, bodyTilt: fast ? Math.sin(t * 45) * 10 : 0 });
    L.char('ren', rp, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + `<rect x="60" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="250" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`;
    // レンの引き出し（右）：開くと手前・下へ出てくる
    fx += `<g transform="translate(0 ${open * 60})"><rect x="560" y="${DESK + 90}" width="460" height="170" rx="14" fill="${open > 0 ? '#B98A5E' : 'none'}" stroke="${L.PAL.wood2}" stroke-width="6" opacity="${open > 0 ? 1 : .55}"/><rect x="750" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/></g>`;
    // ジルの机のきれいな✓
    if (t < 2.4) fx += L.check(250, DESK - 80, 1, .5);
    // 書類の山（レンの机の上、2つ）
    fx += L.papers(640, DESK - 4, pile) + L.papers(1030, DESK - 4, Math.round(pile * .8));
    // 片付け中：書類がびゅんびゅん引き出しへ
    if (fast) for (let i = 0; i < 4; i++) { const u = ((t * 3 + i * .25) % 1); fx += SHEET(820 + Math.sin(i * 2) * 120 * (1 - u), DESK - 140 + u * 260, u * 300, .7); }
    if (fast) fx += L.speed(820, DESK - 60, .4, 18);
    if (t > 4.3 && t < 6.0) fx += L.sparkles(820, DESK - 80, t, 1.1, 6);
    // 雪崩：引き出しから書類が手前と左右へ（6.7〜）
    if (t >= 6.7) { const k = seg(t, 6.7, 7.6); for (let i = 0; i < 26; i++) { const a = -Math.PI * (.15 + (i / 26) * .7), sp = 380 + (i % 5) * 90, d = Math.min(1, k * (1 + (i % 3) * .2)); const x = 790 + Math.cos(a) * sp * d * 1.4 * (i % 2 ? 1 : -1), y = DESK + 170 + Math.sin(a) * sp * d * .55 + 420 * d * d; fx += SHEET(x, Math.min(DESK + 420, y), i * 37 + d * 200, .8); } }
    if (t > 6.8 && t < 7.3) fx += L.impact(790, DESK + 170, seg(t, 6.8, 7.3), 1.0, '#C9BBA6');
    if (t > 5.4 && t < 6.0) fx += L.emark(230, DESK - 650, 1.0, '♡');
    let ui = (t > 1.4 && t < 2.6 ? CHIP(L, 'YEAR-END CLEANUP', '年末。上司の机は書類の山', 1580, seg(t, 1.4, 1.7)) : '')
      + (t > 4.4 && t < 5.9 ? CHIP(L, 'CLEAN IN 3 SEC', '3秒でピカピカ', 1580, seg(t, 4.4, 4.7)) : '')
      + (t > 7.4 && t < 8.6 ? CHIP_OFF(L, 'ALL IN THE DRAWER', '行き先：引き出し', 1580, seg(t, 7.4, 7.7)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 540, cy: 1150 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1150, d: .9 },
      { t: 2.5, z: 1.2, cx: 760, cy: 1230, d: .4 },                 // 高速で片付け
      { t: 4.4, z: 1.05, cx: 540, cy: 1150, d: .4 },                // ピカピカ
      { t: 6.3, z: 1.0, cx: 600, cy: 1300, d: .4 },                 // 引き出し（引いて雪崩まで見せる）
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 6.8 && t < 7.0 ? 6 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
