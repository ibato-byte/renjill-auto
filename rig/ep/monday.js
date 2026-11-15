// 「月曜の朝」（約10.6秒・セリフなし）v3 演出（2026-11-15 総見直しで作り直し）／キャラは本番の rig.js
// 状況：月曜 7:00、目覚ましが鳴る。布団のレンは、寝返りで目覚ましを体でつぶして止める（7:00→7:10→7:20 と3回）→ 時計が 8:59 に飛ぶ
// オチ：会社。8:59、ジルはコーヒーを持って席にいる。横の席は空（ネクタイだけ）→ ジルが空の席を見る
//       → 寝室に戻る：8:59 の赤い時計の横で、レンはまだ寝ている（＝出社しない理由が絵で分かる）→ はっと飛び起きる
// オチの後のオチ（0.5秒）：着地して、そのまま布団に戻って寝る（最初のコマに戻るループ）
// 前の版（v2）の問題：寝室でレンの顔が右で切れる（キャラの中心が x+300 にあり、時計とも重なっていた）／出社しない理由が絵で分からない
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
// 目覚まし。squash（0〜1）で体につぶされて縦に縮む
const ALARM = (x, y, ring, s, t, squash = 0) => `<g transform="translate(${x} ${y}) rotate(${ring ? Math.sin(t * 60) * 7 : 0}) scale(${s * (1 + squash * .25)} ${s * (1 - squash * .45)})"><circle r="90" fill="#E8473A"/><circle r="72" fill="#fff"/><circle cx="-64" cy="-70" r="22" fill="#E8473A"/><circle cx="64" cy="-70" r="22" fill="#E8473A"/><path d="M0 0 L0 -44 M0 0 L30 16" stroke="#3A2414" stroke-width="8" stroke-linecap="round"/><circle r="7" fill="#3A2414"/>${ring ? '<path d="M-120 -40 q-20 40 0 80 M120 -40 q20 40 0 80" stroke="#E8473A" stroke-width="9" fill="none" stroke-linecap="round"/>' : ''}</g>`;
const BEDROOM = () => `<rect x="-500" y="-500" width="2080" height="2920" fill="#2E3A5C"/><rect x="620" y="140" width="380" height="460" rx="14" fill="#1A2238"/><rect x="620" y="140" width="380" height="460" rx="14" fill="none" stroke="#F4ECE0" stroke-width="12"/><circle cx="900" cy="250" r="40" fill="#FFF3C4"/><rect x="-500" y="1150" width="2080" height="1400" fill="#5B4A3E"/>`;
// 朝の寝室（8:59）：窓が明るい
const BEDROOM_DAY = () => `<rect x="-500" y="-500" width="2080" height="2920" fill="#5C6E9C"/><rect x="620" y="140" width="380" height="460" rx="14" fill="#BFE3F7"/><rect x="620" y="140" width="380" height="460" rx="14" fill="none" stroke="#F4ECE0" stroke-width="12"/><circle cx="900" cy="250" r="46" fill="#FFE27A"/><rect x="-500" y="1150" width="2080" height="1400" fill="#6B5848"/>`;
const FUTON = (x, y, lift) => `<g transform="translate(${x} ${y})"><path d="M-520 ${60 - lift * 30} Q-400 ${-260 - lift * 60} 0 -240 Q400 -260 520 60 Z" fill="#7FA6D6"/><path d="M-520 ${60 - lift * 30} Q-400 ${-200 - lift * 40} 0 -180 Q400 -200 520 60" fill="none" stroke="#5E86B8" stroke-width="10"/><rect x="-560" y="40" width="1120" height="120" rx="30" fill="#F4ECE0"/></g>`;
const RS = 1.6, CXR = 470;            // 寝室のレン：大きさと体の中心（rig の x は左端。中心＝x＋200×scale）
const DESKY = 1250, AX = 880, AY = DESKY - 150;
var EP = {
  dur: 10.6,
  bgmHolds: '7.3-7.9',
  sfx: [{ t: 0.1, type: 'chime' }, { t: 0.9, type: 'flop' }, { t: 1.6, type: 'chime' }, { t: 2.4, type: 'flop' }, { t: 3.1, type: 'chime' }, { t: 3.9, type: 'flop' },
    { t: 4.6, type: 'whoosh' }, { t: 5.6, type: 'clink' }, { t: 6.3, type: 'blink' },
    { t: 7.3, type: 'swish' }, { t: 7.35, type: 'chime' }, { t: 7.9, type: 'boing' }, { t: 8.55, type: 'thump' }, { t: 9.2, type: 'flop' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease } = L;
    const office = t >= 4.6 && t < 7.3, late = t >= 7.3;
    // 時計の表示：7:00 → 7:10 → 7:20 → (飛ぶ) 8:59
    const HIT = [0.9, 2.4, 3.9];
    const n = HIT.filter(h => t >= h).length;
    const ring = !office && !late && (t < HIT[0] || (t > 1.6 && t < HIT[1]) || (t > 3.1 && t < HIT[2]));
    let bg, fx = '', jp = null, rp = null;
    if (!office && !late) {
      // ---- 7:00〜7:20：鳴るたびに、寝返りで目覚ましを体でつぶして止める（腕は使わない）
      const clockTxt = ['7:00', '7:10', '7:20', '7:20'][n];
      bg = BEDROOM() + L.digital(300, 360, clockTxt, { s: 1.2, color: '#FFB86B' });
      // 寝返り：鳴っている間に目覚ましの方へ転がり（0.35秒）、HIT でつぶす → 戻る
      const h = HIT.find(x => t > x - .45 && t < x + .45);
      const roll = h == null ? 0 : (t < h ? ease(seg(t, h - .45, h)) : 1 - ease(seg(t, h + .15, h + .45)));
      rp = Object.assign({}, RIG.POSES.loaf, RIG.FACES.sleepy, { x: CXR - 200 * RS + roll * 150, y: DESKY - 413 * RS, scale: RS, zzz: roll > .1 ? 0 : 1, eyeOpen: roll > .3 ? .35 : .05, headNod: 20 - roll * 20, bodyTilt: roll * 24 },
        h != null ? L.anticip(t, h - .45, .15) : {}, h != null ? L.land(t, h, .25) : {});
      fx += FUTON(540, DESKY + 10, roll);
      const sq = h == null ? 0 : Math.sin(Math.PI * seg(t, h - .05, h + .35));
      fx += ALARM(AX, AY, ring, 1.0, t, sq);
      if (h != null) fx += L.impact(AX, AY - 40, seg(t, h - .05, h + .25), 1.1);
      // 7:20 のあと：時計の数字が高速で進む（飛ぶ）
      if (t > 4.2) { const k = seg(t, 4.2, 4.6); bg = BEDROOM() + L.digital(300, 360, ['7:20', '7:41', '8:05', '8:30', '8:59'][Math.min(4, Math.floor(k * 5))], { s: 1.2 + k * .2, color: k > .8 ? '#E8473A' : '#FFB86B' }); }
    } else if (office) {
      // ---- 会社 8:59：ジルはコーヒーを持って席に。横の席は空（ネクタイだけ）
      bg = L.office({ sky: 'day', noClock: true }) + L.digital(540, 520, '8:59', { s: 1.3, color: '#E8473A' });
      const DESK = 1400, JS = 1.45;
      jp = Object.assign({}, RIG.POSES.sit, RIG.FACES.sharp, { x: 280 - 200 * JS, y: DESK - 413 * JS, scale: JS, eyeLook: t > 5.9 ? .8 : 0, headTilt: t > 6.3 ? -8 : 0 });
      fx += `${L.deskFront(DESK)}`
        + [60, 560].map(x => `${L.drawer(x, DESK)}`).join('');
      // ジルのコーヒー（体のすぐ前）・空の席（レンのネクタイだけ椅子に）
      const sip = t > 5.4 && t < 5.9 ? -30 : 0;
      fx += `<g transform="translate(470 ${DESK - 10 + sip})"><path d="M-50 0 L-60 -110 L60 -110 L50 0Z" fill="#fff" stroke="#C9A87E" stroke-width="5"/><path d="M60 -90 q50 0 50 40 q0 40 -50 40" fill="none" stroke="#C9A87E" stroke-width="8"/><path d="M-20 -130 q10 -30 0 -50 M10 -130 q10 -30 0 -50" stroke="#C9A87E" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
      fx += L.chair(820, DESK - 20, 0) + `<g transform="translate(820 ${DESK - 330})"><path d="M-14 0 L14 0 L8 20 L16 100 L0 118 L-16 100 L-8 20Z" fill="#F2B632" stroke="#C98C10" stroke-width="4"/></g>`;
      if (t > 6.3) fx += L.qmark(820, DESK - 480, Math.min(1, seg(t, 6.3, 6.5) * 1.2));
    } else {
      // ---- 寝室に戻る 8:59：まだ寝ている → はっと飛び起きる → 着地 → そのまま布団に戻って寝る
      bg = BEDROOM_DAY() + L.digital(300, 360, t < 9.4 ? '8:59' : '9:00', { s: 1.4, color: '#E8473A' });
      const up = 7.9, landT = 8.55, back = 9.2;
      const awake = t >= up && t < back + .2;
      rp = Object.assign({}, RIG.POSES.loaf, awake ? RIG.FACES.surprised : RIG.FACES.sleepy,
        { x: CXR - 200 * RS, y: DESKY - 413 * RS, scale: RS, zzz: awake ? 0 : 1, eyeOpen: awake ? 1.2 : .05, headNod: awake ? 0 : 20, excl: 0 },
        L.startle(t, up), L.land(t, landT), t >= back ? L.droop(t, back) : {});
      if (rp.yOff) rp.y += rp.yOff * 1.8;   // 部品の yOff は rig が使わないので y に足す（布団から体が出るよう大きめに）
      // 飛び起きるあいだ布団がめくれる
      fx += FUTON(540, DESKY + 10, t > up && t < back ? Math.sin(Math.PI * seg(t, up, back)) : 0);
      fx += ALARM(AX, AY, t < 9.2, 1.0, t, 0);
    }
    L.char('ren', rp, t, '', {}); L.char('jil', jp, t, '', {});
    let ui = (t > 1.8 && t < 3.4 ? CHIP(L, 'MONDAY, 7:00 AM', '月曜の朝7時、上司のレン', 1500, seg(t, 1.8, 2.1)) : '');
    const cam = office
      ? L.camAt([{ t: 0, z: 1.0, cx: 540, cy: 1100 }, { t: 4.61, z: 1.2, cx: 560, cy: 1120, d: .9 }, { t: 6.1, z: 1.3, cx: 570, cy: 1120, d: .5 }], t)
      : late
        ? L.camAt([{ t: 0, z: 1.35, cx: 560, cy: 900 }, { t: 7.31, z: 1.15, cx: 540, cy: 900, d: .5 }, { t: 9.2, z: 1.3, cx: 520, cy: 980, d: .6 }], t)
        : L.camAt([{ t: 0, z: 1.25, cx: 560, cy: 900 }, { t: 0.01, z: 1.15, cx: 560, cy: 900, d: .8 }, { t: 2.4, z: 1.25, cx: 600, cy: 950, d: .5 }, { t: 4.2, z: 1.2, cx: 420, cy: 700, d: .4 }], t);
    if (t > 9.7) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: HIT.some(h => t > h && t < h + .12) || (t > 8.55 && t < 8.67) ? 9 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
