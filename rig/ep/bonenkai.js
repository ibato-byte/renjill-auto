// 「忘年会の幹事」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：忘年会の幹事はユズ。電話でお店を探す（モチはジョッキを持って待っている）
// ひっくり返し：お店のカードが3枚出て、全部に赤い×（満席）→ ユズがへたる
// オチ：モチが机に牧草の山とジョッキを置き、電飾が灯る。会場はこの机。字幕「会場、ここ」。乾杯の音、ユズは呆れ顔
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
// 受話器（ユズの耳元）
const PHONE = (x, y, s = 1, rot = -30) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M-70 -20 q0 -40 40 -40 l10 0 l14 34 l-22 14 q10 40 50 50 l14 -22 l34 14 l0 10 q0 40 -40 40 q-100 -10 -100 -100 Z" fill="#3B4252" stroke="#1F2630" stroke-width="5" stroke-linejoin="round"/><path d="M-58 -24 q2 -24 26 -26" stroke="#8A93A6" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/><path d="M-52 30 q20 44 62 54" stroke="#6B7488" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/></g>`;
// お店のカード（看板の絵：器＋湯気 ／ ジョッキ ／ フォーク）と×
const SHOP = (x, y, kind, k, xk) => {
  if (k <= 0) return '';
  const icon = kind === 0 ? `<path d="M-50 -10 q50 70 100 0 Z" fill="#E8B4A0"/><path d="M-20 -50 q10 -16 0 -32 M8 -50 q10 -16 0 -32" stroke="#B8B2A8" stroke-width="5" fill="none" stroke-linecap="round"/>`
    : kind === 1 ? `<rect x="-36" y="-50" width="72" height="90" rx="10" fill="#F2B544" stroke="#C98A12" stroke-width="5"/><rect x="-36" y="-62" width="72" height="22" rx="10" fill="#fff"/><rect x="36" y="-30" width="22" height="46" rx="10" fill="none" stroke="#C98A12" stroke-width="6"/>`
    : `<path d="M-30 -60 L-30 40 M-44 -60 L-44 -20 q0 20 14 20 M-16 -60 L-16 -20 q0 20 -14 20 M26 -60 q-20 20 0 60 L26 40" stroke="#5A3A1E" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  return `<g transform="translate(${x} ${y}) scale(${k})"><rect x="-120" y="-130" width="240" height="260" rx="18" fill="#fff" stroke="#D7CCBB" stroke-width="6"/><rect x="-120" y="-130" width="240" height="40" rx="18" fill="#E86C5A"/><g transform="translate(0 10)">${icon}</g><rect x="-80" y="80" width="160" height="14" rx="7" fill="#E2D8C8"/>${xk > 0 ? `<g transform="scale(${xk})"><path d="M-80 -80 L80 80 M80 -80 L-80 80" stroke="#E8473A" stroke-width="26" stroke-linecap="round"/></g>` : ''}</g>`;
};
const MUG = (x, y, s = 1, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><defs><linearGradient id="bkBeer" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E09A1E"/><stop offset=".35" stop-color="#FFD071"/><stop offset="1" stop-color="#D98E14"/></linearGradient></defs><rect x="40" y="-40" width="26" height="56" rx="12" fill="none" stroke="#C98A12" stroke-width="8"/><rect x="42" y="-38" width="22" height="52" rx="10" fill="none" stroke="#FFE2A0" stroke-width="2.5" opacity=".7"/><rect x="-40" y="-60" width="80" height="110" rx="12" fill="url(#bkBeer)" stroke="#C98A12" stroke-width="6"/><rect x="-40" y="26" width="80" height="24" rx="12" fill="#A86A08" opacity=".35"/>${[[-18, 20, 4], [8, 2, 3], [-6, -18, 3.5], [20, 26, 3], [14, -30, 2.5]].map(([bx, by, br]) => `<circle cx="${bx}" cy="${by}" r="${br}" fill="#FFF3CF" opacity=".75"/>`).join('')}<rect x="-40" y="-78" width="80" height="30" rx="12" fill="#fff" stroke="#E6DED0" stroke-width="3"/><circle cx="-24" cy="-76" r="13" fill="#fff"/><circle cx="0" cy="-82" r="15" fill="#fff"/><circle cx="24" cy="-76" r="13" fill="#fff"/><path d="M-30 -50 q6 14 0 22" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/><rect x="-36" y="-56" width="72" height="8" rx="4" fill="#C9B998" opacity=".35"/><rect x="-24" y="-40" width="10" height="70" rx="5" fill="#fff" opacity=".5"/></g>`; /* 2026-11-16 見た目：ビールに濃淡とあわ・泡のもこもこ・取っ手の光 */
// 電飾：たるんだ線に色の玉。lit で点灯（点滅）
const LIGHTS = (t, lit) => { let s = `<path d="M-20 560 Q540 760 1100 560" fill="none" stroke="#3A2414" stroke-width="6"/>`; const cols = ['#E8473A', '#F2B544', '#5DBB63', '#4A90D9', '#E86CB0']; for (let i = 0; i < 11; i++) { const u = i / 10, x = -20 + 1120 * u, y = 560 + 200 * 4 * u * (1 - u) * .5; const on = lit && (Math.floor(t * 4 + i) % 3 !== 0); s += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 26}" stroke="#3A2414" stroke-width="5"/><rect x="${x - 7}" y="${y + 20}" width="14" height="10" rx="3" fill="#5A4636"/>${on ? `<circle cx="${x}" cy="${y + 42}" r="46" fill="${cols[i % 5]}" opacity=".12"/><circle cx="${x}" cy="${y + 42}" r="30" fill="${cols[i % 5]}" opacity=".25"/>` : ''}<circle cx="${x}" cy="${y + 42}" r="18" fill="${cols[i % 5]}" opacity="${on ? 1 : .35}"/><circle cx="${x - 6}" cy="${y + 35}" r="5" fill="#fff" opacity="${on ? .7 : .25}"/>`; } return s; };
const HAYPILE = (L, x, y, k) => { if (k <= 0) return ''; let s = `<g transform="translate(${x} ${y}) scale(${k})"><defs><linearGradient id="bkHay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2DC9A"/><stop offset="1" stop-color="#D2AE5C"/></linearGradient></defs><ellipse cx="0" cy="34" rx="220" ry="26" fill="#3B2412" opacity=".18"/><ellipse cx="0" cy="0" rx="200" ry="70" fill="#D9B86A"/><path d="M-200 0 Q-120 -140 0 -150 Q120 -140 200 0 Z" fill="url(#bkHay)"/><path d="M-150 -40 Q-80 -128 0 -134" stroke="#FFF0C4" stroke-width="7" fill="none" stroke-linecap="round" opacity=".6"/>`; for (let i = 0; i < 12; i++) s += `<line x1="${-150 + i * 27}" y1="${-20 - Math.sin(i * 1.7) * 40}" x2="${-130 + i * 27 + Math.sin(i * 2.3) * 30}" y2="${-120 - Math.cos(i * 1.3) * 30}" stroke="#C9A24E" stroke-width="6" stroke-linecap="round"/>`; return s + '</g>'; };
var EP = {
  dur: 9.5,
  bgmHolds: '4.9-5.5',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.9, type: 'click' }, { t: 1.5, type: 'click' }, { t: 2.2, type: 'click' }, { t: 3.4, type: 'pon' }, { t: 3.7, type: 'thump' }, { t: 4.0, type: 'pon' }, { t: 4.3, type: 'thump' }, { t: 4.6, type: 'pon' }, { t: 4.9, type: 'thump' },
    { t: 5.2, type: 'flop' }, { t: 5.6, type: 'whoosh' }, { t: 6.0, type: 'thump' }, { t: 6.3, type: 'tap' }, { t: 6.5, type: 'tap' }, { t: 6.9, type: 'chime' }, { t: 7.6, type: 'clink' }, { t: 8.1, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'night', clock: [18, 30] });
    const cards = [3.4, 4.0, 4.6];                          // お店のカードが出る時刻（×はその 0.3 秒後）
    const allX = t >= 4.9;                                  // 3枚とも満席
    const party = t >= 5.6;                                 // モチが会場を作る
    const lit = t >= 6.9;
    // ユズ（左）：電話で探す（受話器） → 全部×でへたる → 最後は呆れ顔
    const jface = t < 4.9 ? RIG.FACES.sharp : t < 6.9 ? Object.assign({}, RIG.FACES.oops, { sweat: 1 }) : RIG.FACES.annoyed;
    const jp = Object.assign({}, t < 4.9 ? RIG.POSES.sit : RIG.POSES.loaf, jface, { x: 60, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: t < 4.9 ? .3 : .8, headTilt: t < 4.9 ? -8 : 0, headNod: t >= 4.9 && t < 6.9 ? 18 : t >= 6.9 ? 4 : 0 });
    L.char('jil', jp, t, t < 4.9 ? PHONE(222, DESK - 290, .85, -20) : '', {});
    // モチ（右）：ジョッキを持って待つ（にこにこ）→ ×で心配顔 → 5.6 立って会場づくり → 乾杯
    const rface = t < 4.9 ? RIG.FACES.smile : t < 5.6 ? Object.assign({}, RIG.FACES.oops, { sweat: 0 }) : RIG.FACES.smile;
    const rpose = party && t < 6.9 ? RIG.POSES.stand : RIG.POSES.sit;
    const rp = Object.assign({}, rpose, rface, { x: 520, y: DESK - 413 * 1.35, scale: 1.35, flip: true, bodyTilt: party && t < 6.9 ? Math.sin(t * 12) * 5 : 0, headTilt: t >= 7.6 ? -10 : 0, eyeLook: t < 4.9 ? .2 : .6 });
    L.char('ren', rp, t, '', {});
    // 手前：机
    let fx = `${L.deskFront(DESK)}`
      + [60, 560].map(x => `${L.drawer(x, DESK)}`).join('');
    // モチのジョッキ（最初から机の上。乾杯で持ち上げる）
    const lift = t >= 7.6 ? outBack(seg(t, 7.6, 7.9)) : 0;
    // お店のカード（3枚）と×
    cards.forEach((c, i) => { const k = outBack(seg(t, c, c + .3)), xk = outBack(seg(t, c + .3, c + .5)); fx += SHOP(260 + i * 230, DESK - 820 - (party ? 60 * ease(seg(t, 5.6, 6.0)) : 0), i, k * (party ? 1 - seg(t, 5.6, 6.0) : 1), xk); });
    // 会場づくり：牧草の山（5.6 に飛んでくる）→ ジョッキ2つ（6.3, 6.5）→ 電飾が灯る（6.9）
    if (party) { const k = outBack(seg(t, 5.6, 6.0)); fx += HAYPILE(L, 560, DESK - 10, k); fx += L.dust(560, DESK - 10, seg(t, 5.9, 6.4)); }
    if (t >= 6.3) fx += MUG(420, DESK - 70 - 300 * (1 - outBack(seg(t, 6.3, 6.6))), 1.1);
    if (t >= 6.5) fx += MUG(720, DESK - 70 - 300 * (1 - outBack(seg(t, 6.5, 6.8))) - 140 * lift, 1.1, -18 * lift);
    if (t >= 6.9) fx += L.sparkles(560, DESK - 260, t, 1.0, 6);
    if (t > 7.6 && t < 8.1) fx += L.impact(720, DESK - 240, seg(t, 7.6, 8.1), .8, '#F2B544');
    if (allX && t < 5.6) fx += L.emark(230, DESK - 650, 1.0, '…');
    // 電飾（背景の上、キャラの後ろではなく手前に。灯る前も線だけ見える＝会社の中とわかる）
    fx = LIGHTS(t, lit) + fx;
    let ui = (t > 1.8 && t < 3.4 ? CHIP(L, 'YEAR-END PARTY: 12/26', '忘年会の幹事はユズ。お店を探し中', 1380, seg(t, 1.8, 2.1)) : '')
      + (t > 4.9 && t < 5.6 ? CHIP_OFF(L, 'ALL FULL', '全部、満席', 1380, seg(t, 4.9, 5.2)) : '')
      + (t > 6.9 && t < 8.6 ? CHIP_OFF(L, 'VENUE: THIS DESK', '会場、この机', 1380, seg(t, 6.9, 7.2)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.4, cx: 300, cy: 1050 },
      { t: 0.01, z: 1.1, cx: 500, cy: 1100, d: .9 },
      { t: 3.3, z: 1.25, cx: 540, cy: 900, d: .4 },                 // お店のカード
      { t: 4.9, z: 1.3, cx: 430, cy: 1080, d: .4 },                 // へたるユズ
      { t: 5.6, z: 1.0, cx: 540, cy: 1050, d: .5 },                 // 引き：会場づくり
      { t: 7.5, z: 1.05, cx: 600, cy: 1100, d: .5 },                 // 乾杯
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: (t > 3.7 && t < 3.8) || (t > 4.3 && t < 4.4) || (t > 4.9 && t < 5.0) || (t > 6.0 && t < 6.1) ? 6 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
