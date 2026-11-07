// 「エレベーターで上司と2人」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：エレベーターに上司と部下の2人きり。階の表示が 1 → 2 → 3 … とゆっくり進む。沈黙（ジルは階の数字だけを見る。レンは何か言おうとして吹き出しが「…」）
// ひっくり返し：数字が 12 でチン → オチ：ドアが開いた瞬間、ジルは最速で退場。レンの吹き出しは出しかけのまま。字幕「12階、部下は0.1秒で退場」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
// エレベーターの箱：open=0..1 でドアが左右に開く
const ELEV = (open) => `<rect x="-500" y="-500" width="2080" height="2920" fill="#B9B4AC"/><rect x="120" y="400" width="840" height="1080" rx="10" fill="#8E8880"/><rect x="140" y="420" width="800" height="1040" fill="#FFF4D6"/><g><rect x="${140 - open * 400}" y="420" width="400" height="1040" fill="#C9C4BC" stroke="#9E9890" stroke-width="6"/><rect x="${540 + open * 400}" y="420" width="400" height="1040" fill="#C9C4BC" stroke="#9E9890" stroke-width="6"/></g><rect x="120" y="1460" width="840" height="30" fill="#6E6861"/>`;
const FLOOR = (n, s = 1) => `<g transform="translate(540 290) scale(${s})"><rect x="-150" y="-60" width="300" height="120" rx="18" fill="#2E3440"/><text x="0" y="30" text-anchor="middle" font-size="84" font-weight="900" font-family="Noto Sans Mono, monospace" fill="#FF8A5B">${n}</text><path d="M-110 -20 L-90 -44 L-70 -20Z" fill="#7CF0A8"/></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '0.0-6.6',          // 沈黙の回：BGM なし。6.6 のチンから BGM
  sfx: [{ t: 0.3, type: 'click' }, { t: 1.1, type: 'click' }, { t: 1.9, type: 'click' }, { t: 2.7, type: 'click' }, { t: 3.5, type: 'click' }, { t: 4.3, type: 'click' }, { t: 5.1, type: 'click' }, { t: 5.9, type: 'click' },
    { t: 2.3, type: 'blink' }, { t: 4.0, type: 'twitch' }, { t: 6.6, type: 'pon' }, { t: 6.9, type: 'swish' }, { t: 7.1, type: 'whoosh' }, { t: 8.0, type: 'blink' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const fl = t < 6.6 ? Math.min(11, 1 + Math.floor(t / .8)) : 12;
    const open = ease(seg(t, 6.7, 7.1));
    const bg = ELEV(open) + FLOOR(fl, 1 + .15 * L.pulse(t, 6.6, 6.9));
    const GROUND = 1440;
    // ジル：数字をじっと見る（上を向く）→ 7.0 でドアの奥へ最速退場
    const go = seg(t, 7.0, 7.4), js = 1.3 * (1 - go * .6);
    const jp = Object.assign({}, t > 7.0 ? RIG.POSES.stretch : RIG.POSES.sit, t > 7.0 ? RIG.FACES.smile : RIG.FACES.neutral, { x: L.lerp(200, 540 - 270 * js / 1.3 * .5, go), y: L.lerp(GROUND, 1300, go) - 413 * js, scale: js, eyeLook: 0, headNod: t < 7.0 ? -14 : 0, bodySquash: t > 6.6 && t < 7.0 ? -.3 * seg(t, 6.6, 7.0) : 0 });
    L.char('jil', t > 7.4 ? null : jp, t, '', { vx: t > 7.0 ? -1500 : 0 });
    // レン：ちらちら見る → 何か言おうとする（吹き出し「…」が出かかる）→ 取り残される
    const glance = Math.sin(t * 1.3) > .3 ? -.8 : 0;
    const rp = Object.assign({}, RIG.POSES.sit, t > 7.2 ? RIG.FACES.neutral : RIG.FACES.smile, { x: 540, y: GROUND - 413 * 1.45, scale: 1.45, flip: true, eyeLook: t > 7.2 ? -1 : glance, sweat: t > 3.5 && t < 6.6 ? .6 : 0, blush: .3 });
    L.char('ren', rp, t, '', {});
    let fx = '';
    const want = L.pulse(t, 2.0, 6.6);
    if (t > 2.0 && t < 6.6) fx += L.bubble(760, GROUND - 640, `<text y="20" text-anchor="middle" font-size="70" font-weight="900" font-family="Noto Sans CJK JP" fill="#3A2414">${'・'.repeat(1 + Math.floor(want * 2.9))}</text>`, { w: 170, h: 120, tail: 40, s: .5 + want * .5 });
    if (t > 7.2) fx += L.bubble(760, GROUND - 640, `<text y="20" text-anchor="middle" font-size="70" font-weight="900" font-family="Noto Sans CJK JP" fill="#3A2414">・</text>`, { w: 150, h: 120, tail: 40, s: 1 });
    if (t > 7.0 && t < 7.6) fx += L.speed(540, 1000, 1 - seg(t, 7.0, 7.6), 30);
    let ui = (t > 1.8 && t < 3.4 ? CHIP(L, 'ELEVATOR. BOSS. SILENCE.', 'エレベーターで上司と2人きり', 1500, seg(t, 1.8, 2.1)) : '')
      + (t > 7.3 && t < 8.6 ? CHIP(L, '12F. JILL: OUT IN 0.1 SEC', '12階、部下は0.1秒で退場', 1500, seg(t, 7.3, 7.6)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.3, cx: 540, cy: 1050 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1000, d: 1.0 },
      { t: 3.2, z: 1.35, cx: 620, cy: 1150, d: .6 },               // レンの顔
      { t: 6.4, z: 1.2, cx: 540, cy: 800, d: .3 },                 // 階の表示
      { t: 6.9, z: 1.0, cx: 540, cy: 1000, d: .3 },
      { t: 7.8, z: 1.3, cx: 600, cy: 1150, d: .6 },                // 取り残されたレン
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 6.6 && t < 6.75 ? 6 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
