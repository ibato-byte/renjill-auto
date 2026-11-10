// 「有給の申請」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：ジルが有給の申請書（カレンダーの絵＋日付の丸）を出す。レンは書類を見ずにハンコ（✓）
// ひっくり返し：押した直後、壁のカレンダーを見る → その日は大事な会議の日（赤い丸＝同じ日）→ 取り消そうと振り向く
// オチ：ジルはもう帽子とかばんで出発済み（0.5秒）。字幕「承認の0.5秒後、出発済み」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
// 申請書：小さなカレンダー（11月）に「27」の赤丸、下にハンコ枠
const FORM = (x, y, s, stamped) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-150" y="-190" width="300" height="380" rx="10" fill="#fff" stroke="#D7CCBB" stroke-width="6"/><rect x="-110" y="-160" width="220" height="40" rx="8" fill="#E86C5A"/><text x="0" y="-130" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="30" fill="#fff">11</text>${[0, 1, 2, 3, 4].map(r => [0, 1, 2, 3, 4, 5, 6].map(c => `<rect x="${-105 + c * 30}" y="${-100 + r * 30}" width="24" height="24" rx="4" fill="${r === 3 && c === 5 ? '#FFE0E0' : '#F1EBE2'}"/>`).join('')).join('')}<circle cx="${-105 + 5 * 30 + 12}" cy="${-100 + 3 * 30 + 12}" r="18" fill="none" stroke="#E8473A" stroke-width="5"/><text x="${-105 + 5 * 30 + 12}" y="${-100 + 3 * 30 + 20}" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="22" fill="#E8473A">27</text><rect x="-60" y="90" width="120" height="80" rx="8" fill="none" stroke="#C9C2B6" stroke-width="4" stroke-dasharray="8 8"/>${stamped ? `<g transform="translate(0 130) rotate(-8)"><circle r="30" fill="none" stroke="#E8473A" stroke-width="6"/><path d="M-14 0 L-4 11 L16 -12" fill="none" stroke="#E8473A" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g>` : ''}</g>`;
// 壁のカレンダー：27 に赤い丸と「会議」の絵（吹き出しの人型ではなく、机と3つの椅子の記号）
const WALLCAL = (x, y, ring) => `<g transform="translate(${x} ${y})"><rect x="-150" y="-180" width="300" height="360" rx="12" fill="#fff" stroke="#E2D2BC" stroke-width="5"/><rect x="-150" y="-180" width="300" height="56" rx="12" fill="#E86C5A"/><text x="0" y="-140" text-anchor="middle" font-size="34" font-weight="900" font-family="Noto Sans CJK JP" fill="#fff">11</text>${[0, 1, 2, 3, 4].map(r => [0, 1, 2, 3, 4, 5, 6].map(c => `<rect x="${-120 + c * 36}" y="${-100 + r * 44}" width="30" height="36" rx="4" fill="#F1EBE2"/>`).join('')).join('')}<g transform="translate(${-120 + 5 * 36 + 15} ${-100 + 3 * 44 + 18})"><text y="8" text-anchor="middle" font-size="24" font-weight="900" font-family="Noto Sans CJK JP" fill="#3A2414">27</text><circle r="${26 * ring}" fill="none" stroke="#E8473A" stroke-width="6" opacity="${Math.min(1, ring * 2)}"/></g><g transform="translate(${-120 + 5 * 36 + 15} ${-100 + 3 * 44 + 18}) translate(-60 40) scale(.8)"><rect x="-30" y="-6" width="60" height="12" rx="4" fill="#5A3A1E"/><circle cx="-20" cy="-18" r="8" fill="#5A3A1E"/><circle cx="0" cy="-18" r="8" fill="#5A3A1E"/><circle cx="20" cy="-18" r="8" fill="#5A3A1E"/></g></g>`;
const HATBAG = (x, y) => `<g transform="translate(${x} ${y})"><path d="M-70 0 q70 -30 140 0 l-14 -20 q-56 -20 -112 0 Z" fill="#E86C5A"/><path d="M-50 -20 q50 -70 100 0 Z" fill="#E86C5A"/><rect x="60" y="20" width="110" height="80" rx="12" fill="#C9A24E" stroke="#9A7A2E" stroke-width="5"/><rect x="95" y="0" width="40" height="24" rx="10" fill="none" stroke="#9A7A2E" stroke-width="6"/></g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '4.4-5.0',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.0, type: 'swish' }, { t: 1.4, type: 'tap' }, { t: 2.6, type: 'thump' }, { t: 3.0, type: 'pon' }, { t: 3.8, type: 'twitch' }, { t: 4.4, type: 'blink' }, { t: 4.8, type: 'thump' }, { t: 5.4, type: 'swish' }, { t: 5.8, type: 'whoosh' },
    { t: 6.4, type: 'twitch' }, { t: 7.2, type: 'flop' }, { t: 8.2, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const ring = t >= 4.4 ? outBack(seg(t, 4.4, 4.8)) : 0;
    const bg = L.office({ sky: 'day', clock: [16, 0] }) + WALLCAL(540, 610, ring);
    const stamped = t >= 2.6;
    const gone = t >= 6.0;                                     // ジル、出発済み
    // レン（右）：書類を見ずにハンコ（にこにこ）→ 3.8 ふと壁のカレンダーを見る（上を向く）→ 4.4 赤い丸に気づく（！汗）→ 5.4 振り向く → 空席に固まる
    const rface = t < 3.8 ? RIG.FACES.smile : t < 4.4 ? RIG.FACES.neutral : t < 7.2 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : Object.assign({}, RIG.FACES.oops, { sweat: 1 });
    const rp = Object.assign({}, RIG.POSES.sit, rface, { x: 540, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: t < 3.8 ? .3 : t < 5.4 ? -.2 : .9, headNod: t >= 3.8 && t < 5.4 ? -22 : t >= 2.4 && t < 2.8 ? 16 : 0, headTilt: t >= 5.4 ? -10 : 0, bodySquash: t >= 7.2 ? -.2 : 0 });
    L.char('ren', rp, t, '', {});
    // ジル（左）：1.0 書類を差し出す（lean）→ ✓ を見てにこ → 5.4〜5.8 で一気に左へ（帽子・かばん）
    if (!gone) {
      const dash = t >= 5.4 ? RIG.hop(t, 5.4, 6.0, 40, -800, { hops: 2, height: 60 }) : { x: 40, yOff: 0, squash: 0 };
      const jface = t < 2.6 ? RIG.FACES.sharp : RIG.FACES.smile;
      const jp = Object.assign({}, t < 2.6 ? RIG.POSES.lean : t >= 5.4 ? RIG.POSES.stretch : RIG.POSES.sit, jface, { x: dash.x, y: DESK - 413 * 1.3 + dash.yOff, scale: 1.3, bodySquash: dash.squash, bodyTilt: t < 2.6 ? -8 : 0, eyeLook: .7 });
      L.char('jil', jp, t, t >= 5.4 ? HATBAG(dash.x + 300, DESK - 560) : '', { vx: t >= 5.4 ? -1400 : 0 });
    } else L.char('jil', null, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // 申請書：1.0 に左から机の中央へ
    const slide = t < 1.0 ? -1 : ease(seg(t, 1.0, 1.4));
    if (t >= 1.0) fx += FORM(200 + 340 * slide, DESK - 60, .9, stamped);
    if (t > 2.2 && t < 2.6) fx += L.stamper(540, DESK + 60 - 120 * Math.abs(Math.sin(seg(t, 2.2, 2.6) * Math.PI)), 1.1);
    if (t > 2.6 && t < 3.0) fx += L.impact(540, DESK + 50, seg(t, 2.6, 3.0), .7, '#E8473A');
    if (t > 4.4 && t < 4.9) fx += L.impact(540, 610, seg(t, 4.4, 4.9), 1.1, '#E8473A');
    if (t > 4.4 && t < 5.4) fx += L.emark(900, DESK - 700, 1.0);
    if (gone) { fx += L.chair(300, DESK - 40, 0); fx += L.speed(0, DESK - 400, Math.max(0, 1 - seg(t, 6.0, 6.8)) * .6, 20); }
    if (gone && t < 7.2) fx += L.dust(-40, DESK, Math.min(1, (t - 6.0) * 2));
    if (t >= 7.2) fx += L.qmark(900, DESK - 700, 1.0);
    let ui = (t > 1.8 && t < 3.4 ? CHIP(L, 'PAID LEAVE: NOV 27', 'ジルの有給申請（11/27）。上司は見ずに承認', 1380, seg(t, 1.8, 2.1)) : '')
      + (t > 4.6 && t < 5.6 ? CHIP_OFF(L, 'NOV 27: THE BIG MEETING', '11/27は大事な会議の日', 1380, seg(t, 4.6, 4.9)) : '')
      + (t > 6.2 && t < 8.6 ? CHIP_OFF(L, 'APPROVED. 0.5 SEC LATER:', '承認の0.5秒後、ジルは出発済み', 1380, seg(t, 6.2, 6.5)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 540, cy: 1150 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1100, d: .9 },
      { t: 2.2, z: 1.3, cx: 560, cy: 1250, d: .4 },                 // ハンコ
      { t: 3.8, z: 1.1, cx: 540, cy: 900, d: .5 },                  // 壁のカレンダー
      { t: 4.3, z: 1.5, cx: 540, cy: 650, d: .3 },
      { t: 5.3, z: 1.0, cx: 500, cy: 1050, d: .4 },                 // 引き：ジルが消える
      { t: 7.0, z: 1.3, cx: 700, cy: 1120, d: .5 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: (t > 2.6 && t < 2.7) || (t > 4.4 && t < 4.5) ? 5 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
