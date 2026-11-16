// 「エレベーターで上司と2人」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：エレベーターに上司と部下の2人きり。階の表示が 1 → 2 → 3 … とゆっくり進む。沈黙（ジルは階の数字だけを見る。レンは何か言おうとして吹き出しが「…」）
// ひっくり返し：数字が 12 でチン → オチ：ドアが開いた瞬間、ジルは最速で退場。レンの吹き出しは出しかけのまま。字幕「12階、部下は0.1秒で退場」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
// エレベーターの箱：open=0..1 でドアが左右に開く
// 2026-11-16 見た目の作り込み：灰色の板だった扉・壁に、金属のつや・わくの厚み・足もとのかげ・階数の表示の光を足す（形・位置は同じ）
const ELEV = (open) => `<defs><linearGradient id="evWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C6C1B9"/><stop offset="1" stop-color="#A9A39A"/></linearGradient><linearGradient id="evDoor" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B4AFA7"/><stop offset=".2" stop-color="#DAD6CF"/><stop offset=".55" stop-color="#C6C1B9"/><stop offset="1" stop-color="#ACA79F"/></linearGradient><linearGradient id="evIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF8E2"/><stop offset=".8" stop-color="#F6E6BE"/><stop offset="1" stop-color="#D9C79C"/></linearGradient><linearGradient id="evSh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B2412" stop-opacity=".3"/><stop offset="1" stop-color="#3B2412" stop-opacity="0"/></linearGradient></defs>
<rect x="-500" y="-500" width="2080" height="2920" fill="url(#evWall)"/>${[-340, 20, 1060, 1420].map(x => `<rect x="${x}" y="-500" width="4" height="1990" fill="#8E8880" opacity=".35"/>`).join('')}<rect x="-500" y="1490" width="2080" height="930" fill="#9A948B"/><rect x="-500" y="1490" width="2080" height="60" fill="url(#evSh)"/><rect x="-500" y="1440" width="2080" height="50" fill="#8E8880" opacity=".5"/>
<rect x="104" y="384" width="872" height="1112" rx="14" fill="#3B2412" opacity=".14"/><rect x="120" y="400" width="840" height="1080" rx="10" fill="#8E8880"/><rect x="120" y="400" width="840" height="12" rx="6" fill="#B4AFA7"/><rect x="140" y="420" width="800" height="1040" fill="url(#evIn)"/><rect x="140" y="420" width="800" height="90" fill="url(#evSh)" opacity=".5"/><rect x="160" y="900" width="760" height="14" rx="7" fill="#C9B88E"/><rect x="160" y="900" width="760" height="5" rx="2.5" fill="#EFE2BE"/>
<g>${[[140 - open * 400], [540 + open * 400]].map(([x]) => `<rect x="${x}" y="420" width="400" height="1040" fill="url(#evDoor)" stroke="#9E9890" stroke-width="6"/><rect x="${x + 30}" y="460" width="340" height="960" rx="6" fill="none" stroke="#9E9890" stroke-width="3" opacity=".5"/><path d="M${x + 60} 420 L${x + 130} 420 L${x + 60} 1460 L${x - 10 + 60} 1460Z" fill="#fff" opacity=".12"/><rect x="${x}" y="1380" width="400" height="80" fill="url(#evSh)" opacity=".35" transform="rotate(180 ${x + 200} 1420)"/>`).join('')}</g><rect x="140" y="420" width="800" height="26" fill="url(#evSh)" opacity=".6"/><rect x="120" y="1460" width="840" height="30" fill="#6E6861"/><rect x="120" y="1460" width="840" height="7" fill="#9A948B"/>
<g transform="translate(1010 980)"><rect x="-34" y="-74" width="68" height="148" rx="12" fill="#8E8880"/><rect x="-34" y="-74" width="68" height="10" rx="5" fill="#B4AFA7"/><circle cx="0" cy="-30" r="17" fill="#DAD6CF" stroke="#6E6861" stroke-width="3"/><path d="M-8 -26 L0 -38 L8 -26Z" fill="#6E6861"/><circle cx="0" cy="30" r="17" fill="#DAD6CF" stroke="#6E6861" stroke-width="3"/><path d="M-8 26 L0 38 L8 26Z" fill="#6E6861"/></g>`;
const FLOOR = (n, s = 1) => `<g transform="translate(540 290) scale(${s})"><rect x="-144" y="-50" width="300" height="120" rx="18" fill="#3B2412" opacity=".2"/><rect x="-150" y="-60" width="300" height="120" rx="18" fill="#2E3440"/><rect x="-150" y="-60" width="300" height="50" rx="18" fill="#fff" opacity=".07"/><rect x="-138" y="-48" width="276" height="96" rx="12" fill="#1E232C"/><text x="0" y="30" text-anchor="middle" font-size="84" font-weight="900" font-family="Noto Sans Mono, monospace" fill="#FF8A5B" opacity=".35" stroke="#FF8A5B" stroke-width="9" stroke-linejoin="round">${n}</text><text x="0" y="30" text-anchor="middle" font-size="84" font-weight="900" font-family="Noto Sans Mono, monospace" fill="#FF8A5B">${n}</text><path d="M-110 -20 L-90 -44 L-70 -20Z" fill="#7CF0A8"/></g>`;
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
    const go = seg(t, 7.0, 7.4), js = 1.5 * (1 - go * .6);
    const jp = Object.assign({}, t > 7.0 ? RIG.POSES.stretch : RIG.POSES.sit, t > 7.0 ? RIG.FACES.smile : RIG.FACES.neutral, { x: L.lerp(110, 540 - 270 * js / 1.5 * .5, go), y: L.lerp(GROUND, 1300, go) - 413 * js, scale: js, eyeLook: 0, headNod: t < 7.0 ? -14 : 0, bodySquash: t > 6.6 && t < 7.0 ? -.3 * seg(t, 6.6, 7.0) : 0 });
    L.char('jil', t > 7.4 ? null : jp, t, '', { vx: t > 7.0 ? -1500 : 0 });
    // レン：ちらちら見る → 何か言おうとする（吹き出し「…」が出かかる）→ 取り残される
    const glance = Math.sin(t * 1.3) > .3 ? -.8 : 0;
    const rp = Object.assign({}, RIG.POSES.sit, t > 7.2 ? RIG.FACES.neutral : RIG.FACES.smile, { x: 320, y: GROUND - 413 * 1.7, scale: 1.7, flip: true, eyeLook: t > 7.2 ? -1 : glance, sweat: t > 3.5 && t < 6.6 ? .6 : 0, blush: .3 });
    L.char('ren', rp, t, '', {});
    let fx = '';
    const want = L.pulse(t, 2.0, 6.6);
    if (t > 2.0 && t < 6.6) fx += L.bubble(760, GROUND - 640, `<text y="20" text-anchor="middle" font-size="70" font-weight="900" font-family="Noto Sans CJK JP" fill="#3A2414">${'・'.repeat(1 + Math.floor(want * 2.9))}</text>`, { w: 170, h: 120, tail: 40, s: .5 + want * .5 });
    if (t > 7.2) fx += L.bubble(760, GROUND - 640, `<text y="20" text-anchor="middle" font-size="70" font-weight="900" font-family="Noto Sans CJK JP" fill="#3A2414">・</text>`, { w: 150, h: 120, tail: 40, s: 1 });
    if (t > 7.0 && t < 7.6) fx += L.speed(540, 1000, 1 - seg(t, 7.0, 7.6), 30);
    let ui = (t > 1.8 && t < 3.4 ? CHIP(L, 'ELEVATOR. BOSS. SILENCE.', 'エレベーターで上司と2人きり', 1500, seg(t, 1.8, 2.1)) : '')
      + (t > 7.3 && t < 8.6 ? CHIP_OFF(L, '12F. JILL: OUT IN 0.1 SEC', '12階、部下は0.1秒で退場', 1500, seg(t, 7.3, 7.6)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.15, cx: 530, cy: 1060 },
      { t: 0.01, z: 1.05, cx: 530, cy: 1040, d: 1.0 },
      { t: 3.2, z: 1.22, cx: 540, cy: 1170, d: .6 },               // レンの顔
      { t: 6.4, z: 1.2, cx: 540, cy: 800, d: .3 },                 // 階の表示
      { t: 6.9, z: 1.0, cx: 540, cy: 1000, d: .3 },
      { t: 7.8, z: 1.3, cx: 560, cy: 1180, d: .6 },                // 取り残されたレン
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 6.6 && t < 6.75 ? 6 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
