// 「ミュートのまま」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：オンライン会議。画面の中のレンが熱く話している（口パク）。でもマイクの印は赤い斜線（ミュート）
// ひっくり返し：ジルが画面のマイク印を指でとんとん → レンが気づいてミュート解除（印が緑）→ オチ：解除した瞬間に大あくび。字幕「解除した瞬間、あくび」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
const CHIP_OFF = () => ''; // 2026-11-10 オーナー：言葉を入れすぎると世界観が崩れる。途中の字幕は1回（状況）まで。オチは絵で見せる
// マイクの印：on=赤い斜線（ミュート）／緑（話せる）
const MIC = (x, y, muted, s = 1, pulse = 0) => `<g transform="translate(${x} ${y}) scale(${s * (1 + pulse * .15)})"><circle r="46" fill="${muted ? '#E8473A' : '#5DBB63'}"/><rect x="-12" y="-30" width="24" height="40" rx="12" fill="#fff"/><path d="M-22 -4 a22 22 0 0 0 44 0 M0 18 l0 14 M-12 32 l24 0" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>${muted ? '<path d="M-28 -28 L28 28" stroke="#fff" stroke-width="8" stroke-linecap="round"/>' : ''}</g>`;
var EP = {
  dur: 9.5,
  bgmHolds: '6.8-7.4',
  sfx: [{ t: 0.2, type: 'pop' }, { t: 1.0, type: 'twitch' }, { t: 1.8, type: 'twitch' }, { t: 2.6, type: 'twitch' }, { t: 3.4, type: 'twitch' }, { t: 4.2, type: 'tap' }, { t: 4.5, type: 'tap' }, { t: 4.8, type: 'tap' }, { t: 5.4, type: 'blink' },
    { t: 6.2, type: 'click' }, { t: 6.4, type: 'pon' }, { t: 6.8, type: 'boing' }, { t: 7.6, type: 'flop' }, { t: 8.2, type: 'blink' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [10, 30] });
    const muted = t < 6.2;
    const yawn = t >= 6.8;
    // ジル（左・実物）：ずっと聞こえないので首をかしげる → 4.2 画面の印をとんとん → 解除で「よし」→ あくびに白目
    const jface = t < 4.2 ? RIG.FACES.think : t < 6.2 ? RIG.FACES.sharp : t < 7.4 ? RIG.FACES.smile : RIG.FACES.annoyed;
    const tapK = t > 4.2 && t < 5.1 ? Math.abs(Math.sin((t - 4.2) / .3 * Math.PI)) : 0;
    const jp = Object.assign({}, t > 4.2 && t < 5.1 ? RIG.POSES.lean : RIG.POSES.sit, jface, { x: -60, y: DESK - 426 * 1.4 + 20, scale: 1.4, eyeLook: .8, headTilt: t < 4.2 ? -12 : 0, bodyTilt: t > 4.2 && t < 5.1 ? -10 - tapK * 6 : 0, question: t < 4.2 ? 1 : 0 });
    L.char('jil', jp, t, '', {});
    // レン（画面の中）：熱弁（口パク大きめ・頭ふり）→ 5.4 印に気づく → 6.2 解除 → 6.8 大あくび → 7.6 しょんぼり
    const talk = Math.floor(t * 7) % 2 === 0;
    let rface = t < 5.4 ? Object.assign({}, RIG.FACES.angry, { excl: 0, mouth: talk ? 'open' : 'w', eyeShape: 'round', browAngle: -6 }) : t < 6.2 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : t < 6.8 ? RIG.FACES.smile : t < 7.6 ? Object.assign({}, RIG.FACES.sleepy, { eyeOpen: .05, mouth: 'open', zzz: 0 }) : Object.assign({}, RIG.FACES.oops, { sweat: 1 });
    // 総見直し 11/13：画面を大きく（760×720）、レンを1.75倍に（前は画面の高さの20%で小さかった）。画面の中は自宅の壁（会議の相手だと一目で分かる）
    const MX = 260, MY = 420, MW = 760, MH = 720, RS = 1.75;
    const rp = Object.assign({}, RIG.POSES.sit, rface, { x: MX + MW / 2 - 212 * RS, y: MY + MH - 30 - 426 * RS, scale: RS, headTilt: t < 5.4 ? Math.sin(t * 9) * 6 : 0, headNod: t < 5.4 ? Math.abs(Math.sin(t * 9)) * 6 : yawn && t < 7.6 ? -14 : 0, bodySquash: yawn && t < 7.6 ? .25 : 0 },
      t >= 7.6 ? L.droop(t, 7.6) : {});
    L.char('ren', rp, t, '', { shadow: false });
    const rs = document.getElementById('ren'); if (rs) { rs.style.transform = ''; rs.style.clipPath = `inset(${MY}px ${1080 - MX - MW}px ${1920 - MY - MH}px ${MX}px round 18px)`; }
    const back = `<rect x="${MX}" y="${MY}" width="${MW}" height="${MH}" rx="18" fill="#D9E4EC"/><rect x="${MX}" y="${MY + MH * .62}" width="${MW}" height="${MH * .38}" fill="#C7D3DC"/>`
      + `<g opacity=".8"><rect x="${MX + 40}" y="${MY + 70}" width="170" height="16" rx="6" fill="#A98B6A"/>${[0, 1, 2, 3].map(i => `<rect x="${MX + 52 + i * 34}" y="${MY + 18 - (i % 2) * 10}" width="26" height="${52 + (i % 2) * 10}" rx="4" fill="${['#C96F5A', '#6E9BB8', '#E2B65A', '#7BA77A'][i]}"/>`).join('')}</g>`
      + `<g><rect x="${MX - 16}" y="${MY + MH + 8}" width="${MW + 32}" height="52" rx="12" fill="#3B4252"/><path d="M${MX + 60} ${MY + MH + 60} L${MX + MW - 60} ${MY + MH + 60} L${MX + MW - 20} ${DESK} L${MX + 20} ${DESK}Z" fill="#C9CFD8"/></g>`
      + `<rect x="${MX - 4}" y="${MY - 4}" width="${MW + 8}" height="${MH + 8}" rx="22" fill="none" stroke="#3B4252" stroke-width="24"/>`;
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    const MCX = MX + 80, MCY = MY + MH - 80;   // マイクの印（画面の左下。ジルの顔のすぐ横＝前足が届く所）
    fx += MIC(MCX, MCY, muted, 1.3, muted && t < 5.4 ? Math.abs(Math.sin(t * 6)) : t > 6.2 && t < 6.6 ? outBack(seg(t, 6.2, 6.6)) : 0);
    // 話しているのに聞こえない：画面の中の「…」と、音の線が消える印（赤い波線の上に×）
    if (muted && t < 5.4) { fx += `<g transform="translate(${MX + MW / 2} ${MY - 60})" font-family="Noto Sans CJK JP" font-weight="900" font-size="120" fill="#8A8378" text-anchor="middle"><text y="30">…</text></g>`;
      if (talk) fx += `<g stroke="#8A8378" stroke-width="8" stroke-linecap="round" fill="none" opacity=".8"><path d="M${MX + 150} ${MY + 330} q-30 30 0 60"/><path d="M${MX + 120} ${MY + 320} q-40 40 0 80"/></g>`; }   // 話している印（声の線。灰色＝届いていない）
    // ジルの指（画面の印をとんとん）
    if (t > 4.2 && t < 5.1) fx += `<g transform="translate(${MCX - 20 - 20 * tapK} ${MCY + 10 - 10 * tapK}) rotate(-30) scale(1.3)"><ellipse cx="0" cy="0" rx="26" ry="18" fill="#D9B48C" stroke="#B88A5C" stroke-width="4"/><circle cx="-16" cy="-14" r="8" fill="#D9B48C" stroke="#B88A5C" stroke-width="4"/><circle cx="0" cy="-20" r="8" fill="#D9B48C" stroke="#B88A5C" stroke-width="4"/><circle cx="16" cy="-14" r="8" fill="#D9B48C" stroke="#B88A5C" stroke-width="4"/></g>`;
    if (t > 4.2 && t < 5.1 && tapK > .8) fx += L.impact(MCX, MCY, (tapK - .8) * 5, .6, '#F2A33A');
    if (t > 5.4 && t < 6.2) fx += L.emark(MX + MW / 2, MY - 40, 1.2);
    if (t > 6.2 && t < 6.7) fx += L.impact(MCX, MCY, seg(t, 6.2, 6.7), .8, '#5DBB63');
    // あくびの音（大きな波線が画面から出る）
    if (yawn && t < 7.6) fx += `<g stroke="#5DBB63" stroke-width="10" stroke-linecap="round" fill="none" opacity=".9">${[0, 1, 2].map(i => `<path d="M${MX + 120 - i * 36} ${MY + 300} q-30 30 0 60 q30 30 0 60" transform="translate(${Math.sin(t * 10 + i) * 4} 0)"/>`).join('')}</g>`;
    let ui = (t > 1.8 && t < 3.4 ? CHIP(L, 'ONLINE MEETING: MUTED', 'オンライン会議。上司はミュートで熱弁', 1380, seg(t, 1.8, 2.1)) : '')
      + (t > 4.4 && t < 5.4 ? CHIP_OFF(L, 'MUTED FOR 2 MINUTES', '2分間、だれにも聞こえていない', 1380, seg(t, 4.4, 4.7)) : '')
      + (t > 7.0 && t < 8.6 ? CHIP_OFF(L, 'UNMUTED: YAWN', '解除した瞬間、あくび', 1380, seg(t, 7.0, 7.3)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 620, cy: 860 },
      { t: 0.01, z: 1.08, cx: 525, cy: 940, d: .9 },
      { t: 4.1, z: 1.4, cx: 330, cy: 1080, d: .4 },                 // 印をとんとん（ジルと印）
      { t: 5.3, z: 1.6, cx: MX + MW / 2, cy: MY + MH * .45, d: .4 },  // 気づく（寄り）
      { t: 6.7, z: 1.6, cx: MX + MW / 2, cy: MY + MH * .45, d: .3 },  // あくび
      { t: 7.8, z: 1.1, cx: 525, cy: 940, d: .6 },
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, back, fx, ui, cam, t, shake: t > 6.8 && t < 6.95 ? 5 : 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
