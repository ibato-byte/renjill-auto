// 「Wi-Fiが切れた」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：オンライン会議。画面の中でレンが話している（口パク）→ Wi-Fi の印に×、レンの顔が変な表情で固まる
// ひっくり返し：固まったままの顔を、ジルがスクリーンショット（カシャ）→ オチ：つながった瞬間、レンはにこにこ。ジルの手元には保存した変顔。字幕「スクショ、保存しました」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
const WIFI = (x, y, ok, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${[1, 2, 3].map(i => `<path d="M${-i * 26} ${-i * 10} a${i * 36} ${i * 36} 0 0 1 ${i * 52} 0" fill="none" stroke="${ok ? '#5DBB63' : '#B8B2A8'}" stroke-width="9" stroke-linecap="round"/>`).join('')}<circle cy="8" r="9" fill="${ok ? '#5DBB63' : '#B8B2A8'}"/>${ok ? '' : '<path d="M30 -70 L70 -30 M70 -70 L30 -30" stroke="#E8473A" stroke-width="12" stroke-linecap="round"/>'}</g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '2.6-3.4',
  sfx: [{ t: 0.2, type: 'pop' }, { t: 0.8, type: 'pon' }, { t: 1.4, type: 'pon' }, { t: 2.0, type: 'pon' }, { t: 2.6, type: 'click' }, { t: 2.8, type: 'blink' }, { t: 3.6, type: 'twitch' },
    { t: 4.6, type: 'tap' }, { t: 5.2, type: 'click' }, { t: 5.3, type: 'chime' }, { t: 6.4, type: 'pop' }, { t: 7.0, type: 'pon' }, { t: 7.6, type: 'pon' }, { t: 8.2, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const cut = t >= 2.6 && t < 6.4;                    // 切れている間
    const bg = L.office({ sky: 'day', clock: [14, 0] });
    // ジル（左・実物）：聞く → 固まった顔を見てにやり → 5.2 スクショ（カシャ）→ 保存した絵を手元に
    const jface = t < 3.6 ? RIG.FACES.sharp : t < 6.4 ? RIG.FACES.smug : RIG.FACES.smile;
    const jp = Object.assign({}, RIG.POSES.sit, jface, { x: -60, y: DESK - 426 * 1.4 + 20, scale: 1.4, eyeLook: .8, blush: t > 3.6 ? .5 : 0 }, L.startle(t, 2.65));
    L.char('jil', jp, t, '', {});
    // レン（画面の中）：口パク → 2.6 固まる（変顔：目が片方閉じ、口が「う」）→ 6.4 復帰（にこにこ）
    // 総見直し 11/13：画面を大きく（780×720）、レンを1.75倍に（前は画面の高さの20%で小さかった）。画面の中は自宅の壁（会議の相手だと一目で分かる）
    const MX = 260, MY = 420, MW = 760, MH = 720;
    const talk = Math.floor(t * 6) % 2 === 0;
    let rface = t < 2.6 ? Object.assign({}, talk ? RIG.FACES.smile : RIG.FACES.neutral, { mouth: talk ? 'open' : 'w' }) : cut ? Object.assign({}, RIG.FACES.oops, { eyeOpen: .35, mouth: 'pout', browAngle: 18, sweat: 0 }) : RIG.FACES.smile;
    const RS = 1.75, rp = Object.assign({}, RIG.POSES.sit, rface, { x: MX + MW / 2 - 212 * RS, y: MY + MH - 30 - 426 * RS, scale: RS, headTilt: cut ? 9 : Math.sin(t * 3) * 3 },
      t >= 6.4 ? L.land(t, 6.4) : {});
    L.char('ren', rp, t, '', { blink: !cut, breathe: !cut, ears: !cut, shadow: false });
    const rs = document.getElementById('ren');
    if (rs) { rs.style.transform = ''; rs.style.clipPath = `inset(${MY}px ${1080 - MX - MW}px ${1920 - MY - MH}px ${MX}px round 18px)`;
      rs.style.filter = t > 5.2 && t < 5.45 ? `brightness(${(1 + 2 * (1 - seg(t, 5.2, 5.45))).toFixed(2)})` : cut ? 'grayscale(.75) brightness(.92)' : ''; }   // 固まっている間は色が抜ける／スクショの瞬間は白く光る
    // 画面（奥）：自宅の壁・本棚・画面の枠・ノートPCの台
    const back = `<rect x="${MX}" y="${MY}" width="${MW}" height="${MH}" rx="18" fill="#D9E4EC"/><rect x="${MX}" y="${MY + MH * .62}" width="${MW}" height="${MH * .38}" fill="#C7D3DC"/>`
      + `<g opacity=".8"><rect x="${MX + 40}" y="${MY + 70}" width="170" height="16" rx="6" fill="#A98B6A"/>${[0, 1, 2, 3].map(i => `<rect x="${MX + 52 + i * 34}" y="${MY + 18 - (i % 2) * 10}" width="26" height="${52 + (i % 2) * 10}" rx="4" fill="${['#C96F5A', '#6E9BB8', '#E2B65A', '#7BA77A'][i]}"/>`).join('')}</g>`
      + `<g><rect x="${MX - 16}" y="${MY + MH + 8}" width="${MW + 32}" height="52" rx="12" fill="#3B4252"/><path d="M${MX + 60} ${MY + MH + 60} L${MX + MW - 60} ${MY + MH + 60} L${MX + MW - 20} ${DESK} L${MX + 20} ${DESK}Z" fill="#C9CFD8"/></g>`
      + `<rect x="${MX - 4}" y="${MY - 4}" width="${MW + 8}" height="${MH + 8}" rx="22" fill="none" stroke="#3B4252" stroke-width="24"/>`;
    // 手前：机・ノートPCの台・Wi-Fi の印・スクショの紙
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    fx += WIFI(MX + MW - 120, MY + 80, !cut, 1.1);
    if (cut && t < 3.4) fx += L.emark(MX + MW / 2, MY - 40, 1.2, '!?');
    if (cut) fx += `<g transform="translate(${MX + MW / 2} ${MY + MH - 40})">${Array.from({ length: 3 }, (_, i) => `<circle cx="${-40 + i * 40}" cy="0" r="${12 + 6 * Math.max(0, Math.sin(t * 6 - i * 1.2))}" fill="#fff" opacity=".9"/>`).join('')}</g>`;   // つながるのを待つ点々
    // スクショ：5.2 に白いフラッシュ → ジルの手元に紙（固まった顔の小さな絵）
    if (t > 5.3) { const k = outBack(seg(t, 5.3, 5.7)); fx += `<g transform="translate(${400} ${DESK + 150}) rotate(-8) scale(${1.3 * k})"><rect x="-120" y="-150" width="240" height="190" rx="10" fill="#fff" stroke="#D7CCBB" stroke-width="5"/><ellipse cx="0" cy="-70" rx="56" ry="48" fill="#DEC9A8"/><path d="M-28 -78 q8 -10 16 0 M12 -84 L34 -74" stroke="#3A2414" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="0" cy="-48" rx="10" ry="7" fill="#C88D85"/><path d="M-8 -36 q8 6 16 0" stroke="#5A3826" stroke-width="4" fill="none"/><rect x="-100" y="0" width="200" height="12" rx="6" fill="#E2D8C8"/></g>`; }
    if (t > 5.2 && t < 5.6) fx += L.impact(400, DESK + 40, seg(t, 5.2, 5.6), .9, '#F2A33A');
    let ui = (t > 1.8 && t < 3.4 ? CHIP(L, 'ONLINE MEETING', 'オンライン会議。上司は画面の中', 1380, seg(t, 1.8, 2.1)) : '')
      + (t > 5.6 && t < 8.6 ? CHIP_OFF(L, 'FROZEN FACE: SAVED', '固まった顔、ジルが保存', 1380, seg(t, 5.6, 5.9)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 620, cy: 860 },
      { t: 0.01, z: 1.08, cx: 525, cy: 940, d: .9 },
      { t: 2.6, z: 1.6, cx: MX + MW / 2, cy: MY + MH * .45, d: .4 },   // 固まった顔に寄る
      { t: 3.6, z: 1.12, cx: 510, cy: 960, d: .5 },
      { t: 5.1, z: 1.35, cx: 380, cy: 1180, d: .4 },                    // スクショの紙とジル
      { t: 6.4, z: 1.1, cx: 525, cy: 940, d: .5 },
      { t: 7.6, z: 1.3, cx: 470, cy: 1100, d: .6 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, back, fx, ui, cam, t, shake: t > 5.2 && t < 5.3 ? 6 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
