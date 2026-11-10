// 「月曜の朝」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：月曜 7:00、目覚ましが鳴る。布団のレン → 止める（7:00→7:10→7:20 と3回） → ひっくり返し：時計が 8:59 に飛ぶ
// オチ：オフィスのジルはすでにコーヒー片手に席。横の席（レン）は空。字幕「8:59、上司はまだ布団」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
const ALARM = (x, y, ring, s, t) => `<g transform="translate(${x} ${y}) rotate(${ring ? Math.sin(t * 60) * 6 : 0}) scale(${s})"><circle r="90" fill="#E8473A"/><circle r="72" fill="#fff"/><circle cx="-64" cy="-70" r="22" fill="#E8473A"/><circle cx="64" cy="-70" r="22" fill="#E8473A"/><path d="M0 0 L0 -44 M0 0 L30 16" stroke="#3A2414" stroke-width="8" stroke-linecap="round"/><circle r="7" fill="#3A2414"/>${ring ? '<path d="M-120 -40 q-20 40 0 80 M120 -40 q20 40 0 80" stroke="#E8473A" stroke-width="9" fill="none" stroke-linecap="round"/>' : ''}</g>`;
const BEDROOM = (L) => `<rect x="-500" y="-500" width="2080" height="2920" fill="#2E3A5C"/><rect x="60" y="200" width="420" height="520" rx="14" fill="#1A2238"/><rect x="60" y="200" width="420" height="520" rx="14" fill="none" stroke="#F4ECE0" stroke-width="12"/><circle cx="380" cy="320" r="40" fill="#FFF3C4"/><rect x="-500" y="1150" width="2080" height="1400" fill="#5B4A3E"/>`;
const FUTON = (x, y, lift) => `<g transform="translate(${x} ${y})"><path d="M-520 ${60 - lift * 30} Q-400 ${-260 - lift * 60} 0 -240 Q400 -260 520 60 Z" fill="#7FA6D6"/><path d="M-520 ${60 - lift * 30} Q-400 ${-200 - lift * 40} 0 -180 Q400 -200 520 60" fill="none" stroke="#5E86B8" stroke-width="10"/><rect x="-560" y="40" width="1120" height="120" rx="30" fill="#F4ECE0"/></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '5.4-5.9',
  sfx: [{ t: 0.1, type: 'chime' }, { t: 0.9, type: 'thump' }, { t: 1.6, type: 'chime' }, { t: 2.4, type: 'thump' }, { t: 3.1, type: 'chime' }, { t: 3.9, type: 'thump' },
    { t: 4.6, type: 'whoosh' }, { t: 5.4, type: 'pon' }, { t: 6.4, type: 'clink' }, { t: 7.2, type: 'blink' }, { t: 7.9, type: 'twitch' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack, pulse } = L;
    const office = t >= 4.6;
    // 時計の表示：7:00 → 7:10 → 7:20 → (飛ぶ) 8:59
    const HIT = [0.9, 2.4, 3.9];
    const n = HIT.filter(h => t >= h).length;
    const clockTxt = office ? '8:59' : ['7:00', '7:10', '7:20', '7:20'][n];
    const ring = !office && (t < HIT[0] || (t > 1.6 && t < HIT[1]) || (t > 3.1 && t < HIT[2]));
    let bg, fx = '', jp = null, rp = null;
    if (!office) {
      bg = BEDROOM(L) + L.digital(540, 560, clockTxt, { s: 1.3, color: '#FFB86B' });
      const hit = HIT.some(h => t > h - .15 && t < h + .1);
      const DESKY = 1250;
      rp = Object.assign({}, RIG.POSES.loaf, hit ? RIG.FACES.annoyed : RIG.FACES.sleepy, { x: 540, y: DESKY - 413 * 1.5, scale: 1.5, zzz: hit ? 0 : 1, eyeOpen: hit ? .5 : .05, headNod: hit ? 0 : 20, bodyTilt: hit ? -6 : 0 });
      fx += FUTON(540, DESKY + 10, hit ? 1 : 0);
      fx += `<g transform="translate(900 ${DESKY - 120})">${ALARM(0, 0, ring, 1.0, t)}</g>`;
      if (hit) fx += `<g transform="translate(900 ${DESKY - 120})">${L.impact(0, 0, seg(t, HIT.find(h => t > h - .15 && t < h + .1) - .15, HIT.find(h => t > h - .15 && t < h + .1) + .1), 1.1)}</g>`;
      // 7:20 のあと：時計の数字が高速で進む（飛ぶ）
      if (t > 4.2) { const k = seg(t, 4.2, 4.6); bg = BEDROOM(L) + L.digital(540, 560, ['7:20', '7:41', '8:05', '8:30', '8:59'][Math.min(4, Math.floor(k * 5))], { s: 1.3 + k * .2, color: k > .8 ? '#E8473A' : '#FFB86B' }); }
    } else {
      bg = L.office({ sky: 'day', noClock: true }) + L.digital(540, 560, '8:59', { s: 1.3, color: '#E8473A' });
      const DESK = 1400;
      jp = Object.assign({}, RIG.POSES.sit, RIG.FACES.sharp, { x: 260, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: t > 7.2 ? .8 : 0 });
      fx += `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
        + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
      // ジルのコーヒー・空の席（レンのネクタイだけ椅子に）
      fx += `<g transform="translate(470 ${DESK - 10})"><path d="M-50 0 L-60 -110 L60 -110 L50 0Z" fill="#fff" stroke="#C9A87E" stroke-width="5"/><path d="M60 -90 q50 0 50 40 q0 40 -50 40" fill="none" stroke="#C9A87E" stroke-width="8"/><path d="M-20 -130 q10 -30 0 -50 M10 -130 q10 -30 0 -50" stroke="#C9A87E" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
      fx += L.chair(820, DESK - 20, 0) + `<g transform="translate(820 ${DESK - 330})"><path d="M-14 0 L14 0 L8 20 L16 100 L0 118 L-16 100 L-8 20Z" fill="#F2B632" stroke="#C98C10" stroke-width="4"/></g>`;
      if (t > 7.2) fx += `<g transform="translate(820 ${DESK - 480})">${L.qmark(0, 0, 1)}</g>`;
    }
    L.char('ren', rp, t, '', {}); L.char('jil', jp, t, '', {});
    let ui = (t > 1.8 && t < 3.4 ? CHIP(L, 'MONDAY, 7:00 AM', '月曜の朝7時、上司のレン', 1380, seg(t, 1.8, 2.1)) : '')
      + (t > 5.4 && t < 8.6 ? CHIP_OFF(L, '8:59. BOSS: STILL IN BED', '8:59、上司はまだ布団', 1380, seg(t, 5.4, 5.7)) : '');
    const cam = office
      ? L.camAt([{ t: 0, z: 1.0, cx: 540, cy: 1120 }, { t: 4.61, z: 1.25, cx: 540, cy: 1150, d: .9 }, { t: 7.2, z: 1.4, cx: 700, cy: 1150, d: .6 }], t)
      : L.camAt([{ t: 0, z: 1.5, cx: 600, cy: 1050 }, { t: 0.01, z: 1.2, cx: 560, cy: 1000, d: .8 }, { t: 2.4, z: 1.35, cx: 700, cy: 1050, d: .5 }, { t: 4.2, z: 1.3, cx: 540, cy: 700, d: .4 }], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: HIT.some(h => t > h && t < h + .12) ? 9 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
