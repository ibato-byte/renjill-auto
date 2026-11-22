// 「月曜の朝」（約10.6秒・セリフなし）v3 演出（2026-11-15 総見直しで作り直し）／キャラは本番の rig.js
// 状況：月曜 7:00、目覚ましが鳴る。布団のモチは、寝返りで目覚ましを体でつぶして止める（7:00→7:10→7:20 と3回）→ 時計が 8:59 に飛ぶ
// オチ：会社。8:59、ユズはコーヒーを持って席にいる。横の席は空（ネクタイだけ）→ ユズが空の席を見る
//       → 寝室に戻る：8:59 の赤い時計の横で、モチはまだ寝ている（＝出社しない理由が絵で分かる）→ はっと飛び起きる
// オチの後のオチ（0.5秒）：着地して、そのまま布団に戻って寝る（最初のコマに戻るループ）
// 前の版（v2）の問題：寝室でモチの顔が右で切れる（キャラの中心が x+300 にあり、時計とも重なっていた）／出社しない理由が絵で分からない
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
// 目覚まし。squash（0〜1）で体につぶされて縦に縮む
// 2026-11-16 見た目の作り込み：寝室・ふとん・目覚ましが色の板だったので、光・かげ・厚みを足す（形・位置は同じ）
const ALARM = (x, y, ring, s, t, squash = 0) => `<defs><radialGradient id="alBody" cx="36%" cy="30%" r="80%"><stop offset="0" stop-color="#FF8A78"/><stop offset=".55" stop-color="#E8473A"/><stop offset="1" stop-color="#B02A20"/></radialGradient><radialGradient id="alFace" cx="42%" cy="36%" r="70%"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#EFE7DA"/></radialGradient></defs><g transform="translate(${x} ${y}) rotate(${ring ? Math.sin(t * 60) * 7 : 0}) scale(${s * (1 + squash * .25)} ${s * (1 - squash * .45)})"><path d="M-50 70 L-70 104 M50 70 L70 104" stroke="#8E2318" stroke-width="14" stroke-linecap="round"/><circle cx="-64" cy="-70" r="24" fill="#B02A20"/><circle cx="64" cy="-70" r="24" fill="#B02A20"/><circle cx="-66" cy="-73" r="20" fill="url(#alBody)"/><circle cx="62" cy="-73" r="20" fill="url(#alBody)"/><rect x="-8" y="-112" width="16" height="26" rx="6" fill="#8E2318"/><circle r="90" fill="url(#alBody)"/><circle r="74" fill="#8E2318" opacity=".45"/><circle r="72" fill="url(#alFace)"/>${Array.from({ length: 12 }, (_, i) => `<rect x="-3" y="-64" width="6" height="${i % 3 ? 8 : 15}" rx="2" fill="#B9A58C" transform="rotate(${i * 30})"/>`).join('')}<path d="M0 0 L0 -44 M0 0 L30 16" stroke="#3A2414" stroke-width="8" stroke-linecap="round"/><circle r="7" fill="#3A2414"/><path d="M-54 -30 A62 62 0 0 1 -12 -60" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".6"/>${ring ? '<path d="M-120 -40 q-20 40 0 80 M120 -40 q20 40 0 80" stroke="#E8473A" stroke-width="9" fill="none" stroke-linecap="round"/>' : ''}</g>`;
const ROOMDEFS = `<defs><linearGradient id="brN" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#27325A"/><stop offset="1" stop-color="#36436E"/></linearGradient><linearGradient id="brD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6E82B4"/><stop offset="1" stop-color="#5C6E9C"/></linearGradient><linearGradient id="brFl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6E5A4A"/><stop offset="1" stop-color="#4A3B30"/></linearGradient><linearGradient id="brFlD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8A7460"/><stop offset="1" stop-color="#5E4C3E"/></linearGradient><linearGradient id="brSkyN" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121A30"/><stop offset="1" stop-color="#26335A"/></linearGradient><linearGradient id="brSkyD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FD3F2"/><stop offset="1" stop-color="#DDF0FA"/></linearGradient><radialGradient id="brGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF3C4" stop-opacity=".9"/><stop offset=".4" stop-color="#FFF3C4" stop-opacity=".3"/><stop offset="1" stop-color="#FFF3C4" stop-opacity="0"/></radialGradient><linearGradient id="brCur" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8FA3CF"/><stop offset=".3" stop-color="#B9C7E6"/><stop offset=".6" stop-color="#8FA3CF"/><stop offset="1" stop-color="#A9B9DD"/></linearGradient><linearGradient id="brSh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E1424" stop-opacity=".4"/><stop offset="1" stop-color="#0E1424" stop-opacity="0"/></linearGradient></defs>`;
const ROOM = day => { const fl = [1250, 1400, 1600].map((y, i) => `<rect x="-500" y="${y}" width="2080" height="${3 + i}" fill="#1E1610" opacity=".18"/>`).join('');
  const win = `<rect x="614" y="150" width="404" height="476" rx="16" fill="#0E1424" opacity=".25"/><rect x="620" y="140" width="380" height="460" rx="14" fill="url(#brSky${day ? 'D' : 'N'})"/>`
    + (day ? `<circle cx="900" cy="250" r="120" fill="url(#brGlow)"/><circle cx="900" cy="250" r="46" fill="#FFE27A"/><g fill="#fff" opacity=".9"><ellipse cx="720" cy="420" rx="70" ry="20"/><ellipse cx="700" cy="404" rx="36" ry="22"/><ellipse cx="748" cy="398" rx="44" ry="28"/></g>`
      : `<g fill="#fff" opacity=".8"><circle cx="680" cy="210" r="3"/><circle cx="760" cy="330" r="2.4"/><circle cx="720" cy="470" r="2.6"/><circle cx="940" cy="430" r="2.4"/><circle cx="820" cy="190" r="2"/><circle cx="870" cy="520" r="2.2"/></g><circle cx="900" cy="250" r="110" fill="url(#brGlow)" opacity=".7"/><circle cx="900" cy="250" r="40" fill="#FFF3C4"/><circle cx="888" cy="240" r="9" fill="#F2E2A6" opacity=".7"/><circle cx="912" cy="262" r="6" fill="#F2E2A6" opacity=".7"/>`)
    + `<path d="M660 140 L740 140 L640 600 L620 600 L620 330Z" fill="#fff" opacity="${day ? .18 : .06}"/><rect x="620" y="140" width="380" height="460" rx="14" fill="none" stroke="#F4ECE0" stroke-width="12"/><rect x="804" y="140" width="10" height="460" fill="#F4ECE0"/><rect x="620" y="364" width="380" height="10" fill="#F4ECE0"/><rect x="600" y="600" width="420" height="22" rx="8" fill="#F4ECE0"/><rect x="600" y="616" width="420" height="6" rx="3" fill="#C9BFAE"/>`
    + [[560, 1], [1010, -1]].map(([x, d]) => `<path d="M${x} 110 L${x + 70} 110 Q${x + 60 + d * 10} 380 ${x + 78} 660 L${x - 8} 660 Q${x + 10 - d * 10} 380 ${x} 110Z" fill="url(#brCur)" opacity="${day ? 1 : .55}"/>`).join('') + `<rect x="540" y="96" width="560" height="18" rx="9" fill="${day ? '#C9BFAE' : '#6E7BA6'}"/>`;
  return ROOMDEFS + `<rect x="-500" y="-500" width="2080" height="2920" fill="url(#br${day ? 'D' : 'N'})"/>` + win
    + `<rect x="-500" y="1108" width="2080" height="42" fill="${day ? '#D9D0C2' : '#56628E'}"/><rect x="-500" y="1108" width="2080" height="6" fill="${day ? '#F4ECE0' : '#7482B0'}"/><rect x="-500" y="1150" width="2080" height="1400" fill="url(#brFl${day ? 'D' : ''})"/>${fl}<rect x="-500" y="1150" width="2080" height="70" fill="url(#brSh)"/>`
    + `<path d="M560 1170 L900 1170 L1180 1560 L700 1560Z" fill="${day ? '#FFF1C8' : '#B9C7E6'}" opacity="${day ? .22 : .1}"/>`; };
const BEDROOM = () => ROOM(0);
// 朝の寝室（8:59）：窓が明るい
const BEDROOM_DAY = () => ROOM(1);
const FUTON = (x, y, lift) => `<defs><linearGradient id="fuQ" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9DBDE4"/><stop offset=".6" stop-color="#7FA6D6"/><stop offset="1" stop-color="#5E86B8"/></linearGradient></defs><g transform="translate(${x} ${y})"><ellipse cx="0" cy="170" rx="600" ry="26" fill="#0E1424" opacity=".25"/><rect x="-560" y="40" width="1120" height="120" rx="30" fill="#F4ECE0"/><rect x="-560" y="110" width="1120" height="50" rx="25" fill="#C9BFAE" opacity=".6"/><rect x="-540" y="50" width="1080" height="12" rx="6" fill="#fff" opacity=".7"/><path d="M-520 ${60 - lift * 30} Q-400 ${-260 - lift * 60} 0 -240 Q400 -260 520 60 Z" fill="url(#fuQ)"/><path d="M-360 ${40 - lift * 20} Q-300 ${-150 - lift * 40} -250 -214 M-120 50 Q-100 -150 -90 -236 M130 50 Q120 -150 110 -238 M370 50 Q320 -140 270 -222" stroke="#5E86B8" stroke-width="5" fill="none" opacity=".55"/><path d="M-430 ${-120 - lift * 40} Q-200 ${-222 - lift * 50} 0 -212 Q200 -216 400 -150" stroke="#C4DAF2" stroke-width="10" fill="none" opacity=".6" stroke-linecap="round"/><path d="M-520 ${60 - lift * 30} Q-400 ${-200 - lift * 40} 0 -180 Q400 -200 520 60" fill="none" stroke="#5E86B8" stroke-width="10"/></g>`;
const RS = 1.6, CXR = 470;            // 寝室のモチ：大きさと体の中心（rig の x は左端。中心＝x＋200×scale）
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
      // ---- 会社 8:59：ユズはコーヒーを持って席に。横の席は空（ネクタイだけ）
      bg = L.office({ sky: 'day', noClock: true }) + L.digital(540, 520, '8:59', { s: 1.3, color: '#E8473A' });
      const DESK = 1400, JS = 1.45;
      jp = Object.assign({}, RIG.POSES.sit, RIG.FACES.sharp, { x: 280 - 200 * JS, y: DESK - 413 * JS, scale: JS, eyeLook: t > 5.9 ? .8 : 0, headTilt: t > 6.3 ? -8 : 0 });
      fx += `${L.deskFront(DESK)}`
        + [60, 560].map(x => `${L.drawer(x, DESK)}`).join('');
      // ユズのコーヒー（体のすぐ前）・空の席（モチのネクタイだけ椅子に）
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
    let ui = (t > 1.8 && t < 3.4 ? CHIP(L, 'MONDAY, 7:00 AM', '月曜の朝7時、上司のモチ', 1500, seg(t, 1.8, 2.1)) : '');
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
