// 「加湿器MAX」（約9.5秒・セリフなし）v2 演出／キャラは本番の rig.js
// 状況：冬のオフィスは乾燥（湿度計 20%）。レンが加湿器を机に置いて、つまみを MAX に
// ひっくり返し：湯気がもくもく → 湿度 20→40→70→99% → 部屋が白くかすむ → ジルのメガネが真っ白に曇る
// オチ：レンはお肌つやつや（きらきら・ご満悦）。ジルはメガネを拭いてジト目。字幕「湿度99%。上司：つやつや」
document.write('<script src="v2/lib.js"><\/script>');
const CHIP = (L, en, ja, y, k) => k <= 0 ? '' : `<g transform="translate(540 ${y}) scale(${L.outBack(Math.min(1, k * 3))})" opacity="${Math.min(1, k * 4)}" font-family="Noto Sans CJK JP" font-weight="900" text-anchor="middle"><rect x="-470" y="-78" width="940" height="164" rx="40" fill="#3A2414" opacity=".88"/><text y="-4" font-size="72" fill="#FFF7E8">${en}</text><text y="58" font-size="44" fill="#F2D3A8">${ja}</text></g>`;
// 加湿器（底の中央 x,y）。knob=つまみの角度（0〜1）
const HUMID = (x, y, knob) => `<g transform="translate(${x} ${y})"><path d="M-80 0 L-70 -170 Q0 -200 70 -170 L80 0 Z" fill="#EAF4FF" stroke="#9BB8D8" stroke-width="6"/><ellipse cx="0" cy="-178" rx="36" ry="10" fill="#9BB8D8"/><circle cx="0" cy="-70" r="30" fill="#fff" stroke="#9BB8D8" stroke-width="5"/><line x1="0" y1="-70" x2="${Math.cos(Math.PI * (1.25 - knob * 1.5)) * 22}" y2="${-70 - Math.sin(Math.PI * (1.25 - knob * 1.5)) * 22}" stroke="#E8473A" stroke-width="6" stroke-linecap="round"/><text x="0" y="-22" text-anchor="middle" font-family="Noto Sans" font-weight="900" font-size="22" fill="${knob > .9 ? '#E8473A' : '#7A8FA8'}">${knob > .9 ? 'MAX' : 'LOW'}</text></g>`;
// 湯気（強さ k）
const MIST = (x, y, t, k) => { if (k <= 0) return ''; let s = `<g fill="#fff" pointer-events="none">`; const n = Math.round(4 + k * 10); for (let i = 0; i < n; i++) { const ph = (t * (.5 + k * .6) + i / n) % 1; const r = 26 + ph * 70 * (0.6 + k); s += `<circle cx="${x + Math.sin(i * 2.3 + t) * 40 * ph * (1 + k * 3)}" cy="${y - ph * 380 * (0.6 + k * .6)}" r="${r}" opacity="${(1 - ph) * .75}"/>`; } return s + '</g>'; };
var EP = {
  dur: 9.5,
  bgmHolds: '5.8-6.4',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 1.0, type: 'thump' }, { t: 1.8, type: 'click' }, { t: 2.0, type: 'whoosh' }, { t: 2.8, type: 'whoosh' }, { t: 3.6, type: 'whoosh' }, { t: 4.4, type: 'whoosh' }, { t: 5.2, type: 'chime' },
    { t: 5.8, type: 'blink' }, { t: 6.6, type: 'swish' }, { t: 7.4, type: 'pon' }, { t: 8.2, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack } = L;
    const DESK = 1400;
    const bg = L.office({ sky: 'day', clock: [14, 0] });
    const k = ease(seg(t, 2.4, 5.2)), clear = ease(seg(t, 6.4, 7.2));   // 6.4〜 もやが晴れる（上司のつやつやを見せる）                                    // 加湿の進み
    const hum = Math.round(20 + 79 * k);
    const knob = ease(seg(t, 1.6, 1.9));
    const fogged = t >= 4.6 && t < 7.0;                                   // ジルのメガネが曇っている
    // ジル（左）：乾燥でちょっとしょんぼり → 湯気に驚く → メガネ真っ白（固まる）→ 拭く（小刻み）→ ジト目
    const wiping = t >= 6.6 && t < 7.2;
    const jface = t < 2.0 ? RIG.FACES.neutral : t < 4.6 ? Object.assign({}, RIG.FACES.surprised, { excl: 0 }) : t < 7.2 ? RIG.FACES.neutral : RIG.FACES.annoyed;
    const jp = Object.assign({}, RIG.POSES.sit, jface, { x: 40, y: DESK - 413 * 1.3, scale: 1.3, eyeLook: .8, headNod: wiping ? Math.sin(t * 40) * 4 : 0 });
    const fogK = fogged ? Math.min(1, (t - 4.6) / .4) * (t > 6.6 ? Math.max(0, 1 - (t - 6.6) / .6) : 1) : 0;
    const lens = fogK > 0 ? `<g pointer-events="none" opacity="${.92 * fogK}"><circle cx="232" cy="1151" r="32" fill="#F4F8FC"/><circle cx="336" cy="1151" r="32" fill="#F4F8FC"/><path d="M218 1140 l14 -10 M322 1140 l14 -10" stroke="#fff" stroke-width="6" stroke-linecap="round"/></g>` : '';
    L.char('jil', jp, t, lens, {});
    // レン（右）：加湿器を置いて MAX（lean）→ 湯気に当たってうっとり → つやつや（ご満悦・きらきら）
    const rface = t < 2.0 ? RIG.FACES.smile : t < 5.2 ? Object.assign({}, RIG.FACES.smile, { blush: 1 }) : Object.assign({}, RIG.FACES.smug, { blush: 1 });
    const rp = Object.assign({}, t >= 1.4 && t < 2.0 ? RIG.POSES.lean : RIG.POSES.sit, rface, { x: 540, y: DESK - 413 * 1.35, scale: 1.35, flip: true, eyeLook: .3, bodyTilt: t >= 1.4 && t < 2.0 ? -12 : 0, headTilt: t >= 2.4 && t < 5.2 ? Math.sin(t * 3) * 6 : 0 });
    L.char('ren', rp, t, '', {});
    let fx = `<rect x="-500" y="${DESK + 28}" width="2080" height="900" fill="url(#v2desk)"/><rect x="-500" y="${DESK}" width="2080" height="34" rx="10" fill="${L.PAL.woodTop}"/>`
      + [60, 560].map(x => `<rect x="${x}" y="${DESK + 90}" width="460" height="170" rx="14" fill="none" stroke="${L.PAL.wood2}" stroke-width="6" opacity=".55"/><rect x="${x + 190}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8"/>`).join('');
    // 加湿器（1.0 に置く）
    const place = t < 1.0 ? -300 * (1 - ease(seg(t, .6, 1.0))) : 0;
    fx += `<g transform="translate(0 ${place})">${HUMID(560, DESK + 6, knob)}</g>`;
    fx += MIST(560, DESK - 190, t, t < 2.0 ? 0 : (.2 + k * .8) * (1 - clear * .7));
    // 部屋全体のもや（顔が見える程度まで）
    if (k > 0 && clear < 1) fx += `<rect x="-500" y="-500" width="2080" height="3000" fill="#F4F8FC" opacity="${(k * .42 * (1 - clear)).toFixed(3)}" pointer-events="none"/>`;
    // 湿度計（上の中央）
    if (t > 1.7 && t < 7.0) fx += `<g transform="translate(540 760)"><rect x="-150" y="-80" width="300" height="160" rx="26" fill="#fff" stroke="${hum > 90 ? '#E8473A' : '#5A7FA8'}" stroke-width="10"/><text y="10" text-anchor="middle" font-family="Noto Sans" font-weight="900" font-size="80" fill="${hum > 90 ? '#E8473A' : '#355F86'}">${hum}%</text><text y="58" text-anchor="middle" font-family="Noto Sans CJK JP" font-weight="900" font-size="30" fill="#7A8FA8">湿度</text></g>`;
    if (t > 5.2) fx += L.sparkles(837, 1080, t, 1.1, 6);
    if (t > 5.8 && t < 6.6) fx += L.emark(230, DESK - 650, 1.0, '…');
    let ui = (t > 1.8 && t < 3.2 ? CHIP(L, 'DRY AIR: 20%', '乾燥。上司が加湿器をMAXに', 1580, seg(t, 1.8, 2.1)) : '')
      + (t > 4.8 && t < 6.2 ? CHIP(L, 'HUMIDITY: 99%', '湿度99%。ジルのメガネ、真っ白', 1580, seg(t, 4.8, 5.1)) : '')
      + (t > 7.2 && t < 8.6 ? CHIP(L, 'BOSS: GLOWING', '上司：お肌つやつや', 1580, seg(t, 7.2, 7.5)) : '');
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 540, cy: 1150 },
      { t: 0.01, z: 1.05, cx: 540, cy: 1150, d: .9 },
      { t: 1.5, z: 1.25, cx: 620, cy: 1250, d: .4 },                // つまみを MAX
      { t: 2.6, z: 1.0, cx: 540, cy: 1100, d: .6 },                 // 湯気が広がる
      { t: 4.7, z: 1.4, cx: 300, cy: 1160, d: .4 },                 // 曇ったメガネ
      { t: 6.2, z: 1.05, cx: 540, cy: 1150, d: .4 },
      { t: 7.2, z: 1.35, cx: 800, cy: 1150, d: .5 },                // つやつやの上司
    ], t);
    if (t > 8.6) { fx = ''; ui = ''; }
    L.mount({ bg, fx, ui, cam, t, shake: 0 });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
