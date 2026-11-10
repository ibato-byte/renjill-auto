// 「お弁当が入れ替わった」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：12:00、二人の机にお弁当。ふたを開けると、ジルの箱には牧草の山（レンの）、レンの箱には小さなサラダ（ジルの）
// ひっくり返し：取り替える → レンは3秒で完食、ジルのサラダまで見る → オチ：ジルがサラダを抱えて後ろを向く。字幕「3秒で完食」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
// お弁当箱：open=ふたの開き具合（0〜1）、inner=中身、ribbon=目印の色
const BENTO = (x, y, open, inner, ribbon, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-130" y="-70" width="260" height="90" rx="16" fill="#F4EFE6" stroke="#CDBFA8" stroke-width="6"/><rect x="-118" y="-62" width="236" height="60" rx="10" fill="#E8DFCF"/>${inner}<g transform="translate(0 ${-70 - open * 26}) scale(1 ${1 - open * .82})"><rect x="-134" y="-36" width="268" height="40" rx="14" fill="#FFF9F0" stroke="#CDBFA8" stroke-width="6"/><rect x="-30" y="-30" width="60" height="28" rx="8" fill="${ribbon}"/></g></g>`;
const HAYIN = (k) => { let s = `<g transform="translate(0 -40) scale(${.6 + .4 * k} ${k}) translate(0 40)"><path d="M-150 -40 Q-90 -230 0 -250 Q90 -230 150 -40 Z" fill="#E6C97E"/><path d="M-150 -40 Q-60 -120 0 -110 Q60 -120 150 -40 Z" fill="#D9B86A"/>`; for (let i = 0; i < 11; i++) s += `<line x1="${-100 + i * 20}" y1="${-70}" x2="${-90 + i * 20 + Math.sin(i * 2.1) * 30}" y2="${-200 - Math.cos(i * 1.3) * 35}" stroke="#C9A24E" stroke-width="7" stroke-linecap="round"/>`; return s + '</g>'; };
const SALAD = (k) => `<g transform="scale(${k})"><ellipse cx="0" cy="-46" rx="70" ry="26" fill="#fff" stroke="#B9CDE0" stroke-width="6"/><ellipse cx="-26" cy="-66" rx="28" ry="15" fill="#6FA86A" transform="rotate(-20 -26 -66)"/><ellipse cx="18" cy="-72" rx="30" ry="16" fill="#8DC07C" transform="rotate(15 18 -72)"/><ellipse cx="-4" cy="-84" rx="22" ry="12" fill="#A6D18F"/><circle cx="4" cy="-58" r="11" fill="#E86C5A"/></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '7.0-7.6',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.0, type: 'chime' }, { t: 3.4, type: 'click' }, { t: 3.45, type: 'click' }, { t: 3.8, type: 'boing' }, { t: 4.1, type: 'twitch' }, { t: 5.8, type: 'swish' }, { t: 6.0, type: 'swish' },
    { t: 6.6, type: 'tap' }, { t: 6.8, type: 'tap' }, { t: 7.0, type: 'tap' }, { t: 7.2, type: 'pon' }, { t: 7.8, type: 'blink' }, { t: 8.2, type: 'swish' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [12, 0] });
    const open = outBack(seg(t, 3.4, 3.8));
    const swap = ease(seg(t, 5.8, 6.3));                     // 箱を取り替える
    const eat = t >= 6.6;
    const gone = t >= 7.2;                                   // レンの箱、空
    // ジル（左）：ふたを開けて牧草の山にびっくり → 取り替えて一口 → レンの視線に気づいてサラダを抱える
    const jface = t < 3.8 ? RIG.FACES.neutral : t < 5.8 ? RIG.FACES.annoyed : t < 7.8 ? RIG.FACES.smile : RIG.FACES.sharp;
    const jp = Object.assign({}, RIG.POSES.sit, jface, { x: 60, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: t < 3.4 ? .3 : t >= 7.8 ? .9 : .5, headTilt: t >= 7.8 ? -14 : 0, bodyTilt: t >= 8.2 ? -10 : 0, sweat: t > 3.8 && t < 5.8 ? .6 : 0 });
    L.char('jil', jp, t, '', {});
    // レン（右）：小さなサラダに「？」→ 取り替えて大よろこび、もぐもぐ → 空っぽ、ジルのサラダを見る
    const rface = t < 3.8 ? RIG.FACES.smile : t < 5.8 ? RIG.FACES.think : t < 7.2 ? RIG.FACES.smile : RIG.FACES.shy;
    const rp = Object.assign({}, RIG.POSES.sit, rface, { x: 560, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: t >= 7.2 ? .9 : .2, headNod: eat && t < 7.2 ? Math.abs(Math.sin(t * 16)) * 10 : 0, bodySquash: eat && t < 7.2 ? Math.sin(t * 16) * .15 : 0, headTilt: t >= 7.6 ? 12 : 0 });
    L.char('ren', rp, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // 箱の位置：左（ジルの前 x=300）と右（レンの前 x=800）。swap で入れ替わる
    const xL = 300 + 500 * swap, xR = 800 - 500 * swap, yB = DESK - 20 - Math.sin(swap * Math.PI) * 80;
    // 左の箱（ピンクの目印＝ジルの箱）の中身は牧草の山。右の箱（青＝レンの箱）の中身は小さなサラダ
    const hayK = gone ? 0 : eat ? Math.max(0, 1 - seg(t, 6.6, 7.2)) : 1;
    fx += BENTO(xL, yB, open, open > 0 ? HAYIN(open * hayK) : '', '#E86CB0');
    fx += BENTO(xR, DESK - 20 - Math.sin(swap * Math.PI) * 40, open, open > 0 ? SALAD(open) : '', '#4A90D9');
    if (t > 3.4 && t < 3.8) fx += L.impact(xL, DESK - 220, seg(t, 3.4, 3.8), .8, '#F2A33A');
    if (t > 3.8 && t < 5.8) { fx += L.emark(230, DESK - 650, 1.0); fx += L.qmark(900, DESK - 660, 1.0); }
    if (eat && t < 7.2) fx += L.munch(800, DESK - 120, t, 1.0);
    if (t > 7.2 && t < 7.7) fx += L.impact(800, DESK - 120, seg(t, 7.2, 7.7), .7, '#F2B544');
    let ui = (t > 1.8 && t < 3.4 ? CHIP(L, 'LUNCH TIME: 12:00', 'お弁当、ふたを開けると…', 1380, seg(t, 1.8, 2.1)) : '')
      + (t > 4.2 && t < 5.6 ? CHIP_OFF(L, 'SWAPPED', '入れ替わってる', 1380, seg(t, 4.2, 4.5)) : '')
      + (t > 7.4 && t < 8.6 ? CHIP_OFF(L, 'GONE IN 3 SECONDS', '3秒で完食。次はジルのサラダ', 1380, seg(t, 7.4, 7.7)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.4, cx: 540, cy: 1150 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1120, d: .9 },
      { t: 3.3, z: 1.3, cx: 540, cy: 1250, d: .4 },                 // 箱に寄る
      { t: 4.2, z: 1.1, cx: 540, cy: 1100, d: .5 },
      { t: 6.5, z: 1.3, cx: 760, cy: 1150, d: .5 },                 // もぐもぐ
      { t: 7.6, z: 1.1, cx: 500, cy: 1120, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: t > 3.4 && t < 3.5 ? 4 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
