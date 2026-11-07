// 「年末調整」（約9.5秒・セリフなし）v2 絵
// 書類を読むレン → 書類がどんどん伸びて床まで → レン、目が回ってとける → ジルが無言でハンコ3回、書類はシュッと1枚に
// → 生き返ったレンがお礼に牧草を1本 → ジル、無表情のまま…もぐもぐ（ちょっとうれしい）
document.write('<script src="v2/lib.js"><\/script>');
var EP = {
  dur: 9.5,
  bgmHolds: '2.6-3.3',
  sfx: [{ t: 0.1, type: 'pop' }, { t: 0.5, type: 'swish' }, { t: 1.2, type: 'swish' }, { t: 1.9, type: 'swish' }, { t: 2.3, type: 'boing' }, { t: 2.8, type: 'flop' },
    { t: 3.4, type: 'whoosh' }, { t: 3.9, type: 'thump' }, { t: 4.3, type: 'thump' }, { t: 4.7, type: 'thump' }, { t: 4.95, type: 'whoosh' }, { t: 5.4, type: 'chime' },
    { t: 6.3, type: 'pon' }, { t: 7.4, type: 'tap' }, { t: 7.7, type: 'tap' }, { t: 8.0, type: 'tap' }],
  frame(t) {
    const L = window.L; if (!L) return;
    const { seg, ease, lerp, outBack } = L;
    const DESK = 1360;
    const bg = L.office({ sky: 'day', clock: [15, 0], month: '11月' });
    // 書類の長さ：0.3〜2.4 で伸びる、4.95 で一瞬で戻る
    const grow = t < 4.95 ? ease(seg(t, .3, 2.4)) : 1 - ease(seg(t, 4.95, 5.15));
    const len = 120 + grow * 640;
    const lines = Array.from({ length: Math.floor(len / 34) }, (_, i) => `<rect x="${-80}" y="${20 + i * 34}" width="${i % 3 ? 160 : 110}" height="10" rx="5" fill="#C9D3E0"/><rect x="60" y="${16 + i * 34}" width="20" height="18" rx="3" fill="none" stroke="#C9D3E0" stroke-width="3"/>`).join('');
    const stamps = [3.9, 4.3, 4.7].filter(s => t >= s && (t < 4.95 || s === 3.9)).map((s, i) => `<g transform="translate(${t < 4.95 ? -40 + i * 40 : 70} ${t < 4.95 ? 60 + i * 150 : 75}) rotate(-12) scale(${outBack(seg(t, s, s + .15))})"><circle r="36" fill="none" stroke="#E8473A" stroke-width="6"/><text y="13" font-size="34" font-weight="900" text-anchor="middle" fill="#E8473A" font-family="Noto Sans CJK JP">済</text></g>`).join('');
    const form = `<g transform="translate(540 ${DESK - 20})"><rect x="-120" y="0" width="240" height="${len}" rx="6" fill="#FFFDF8" stroke="#D7CCBB" stroke-width="3"/><rect x="-120" y="0" width="240" height="44" rx="6" fill="#7FA6D6"/><text x="0" y="31" font-size="26" font-weight="900" text-anchor="middle" fill="#fff" font-family="Noto Sans CJK JP">年末調整</text>${lines}${stamps}</g>`;
    // レン（机の向こう）
    const melt = t > 2.8 && t < 5.3 ? seg(t, 2.8, 3.1) * .45 * (1 - seg(t, 5.2, 5.5)) : 0;
    const rface = t < 2.2 ? { eye: 'tiny', mouth: 'flat', look: [0, 1] } : t < 5.3 ? { eye: 'dead', mouth: 'wobble' } : t < 6.2 ? { eye: 'wide', mouth: 'grin' } : { eye: 'happy', mouth: 'smile' };
    const rArm = t > 6.2 && t < 7.2 ? 95 * outBack(seg(t, 6.2, 6.5)) : 10;
    const hayStrand = t > 6.2 && t < 7.0 ? `<path d="M-215 -270 q-30 -80 -110 -130" stroke="#A8B84E" stroke-width="10" fill="none" stroke-linecap="round"/>` : '';
    const ren = L.bunny('ren', { x: 560, y: 1420 + melt * 120, s: 1.0, face: rface, ear: t > 2.2 && t < 2.8 ? 1 : -.2, squash: melt, gloom: t > 2.9 && t < 5.2 ? .8 : 0, armL: rArm, armR: 10, item: hayStrand, flip: true, t, tilt: t < 2.2 ? Math.sin(t * 3) * 4 : 0 });
    // ジル（左から入る）
    const jin = outBack(seg(t, 3.4, 3.8));
    const jx = lerp(-300, 230, jin);
    const stampArm = [3.9, 4.3, 4.7].some(s => t > s - .12 && t < s + .1) ? 140 : 70;
    const jface = t < 7.3 ? { eye: 'half', mouth: 'flat', brow: t < 5.4 ? 'angry' : null } : { eye: 'happy', mouth: 'cat' };
    const munch = t > 7.3 ? Math.sin(t * 22) * 3 : 0;
    const jHay = t > 6.9 ? `<path d="M${t > 7.3 ? 40 : 160} ${-370 + munch} l${t > 7.3 ? Math.max(0, 160 - (t - 7.3) * 120) : 150} -40" stroke="#A8B84E" stroke-width="10" fill="none" stroke-linecap="round"/>` : '';
    const stampItem = t > 3.4 && t < 5.2 ? `<g transform="translate(${stampArm > 100 ? 190 : 170} ${stampArm > 100 ? -300 : -230})"><rect x="-22" y="-80" width="44" height="80" rx="14" fill="#8C5A3C"/><rect x="-34" y="-6" width="68" height="26" rx="6" fill="#C0392B"/></g>` : '';
    const jil = jin > 0 ? L.bunny('jil', { x: jx, y: 1760, s: 1.0, face: jface, ear: t > 7.3 ? .5 : 0, armR: stampArm, item: stampItem + jHay, blush: t > 7.3 ? 1.2 : .6, t, squash: t > 7.3 ? Math.abs(Math.sin(t * 11)) * .05 : 0 }) : '';
    const front = L.desk(DESK, { x: 260, w: 620, h: 300 }) + form + L.papers(800, DESK, 4);
    let fx = '';
    if (t > 2.2 && t < 2.8) fx += L.mark(760, 860, '!!', 1.1);
    if (t > 3.9 && t < 5.0) fx += [3.9, 4.3, 4.7].filter(s => t > s && t < s + .3).map(s => L.label(380 + (s - 3.9) * 300, 1120, 'ポン', { fs: 80, rot: -8, fill: '#E8473A', s: outBack(seg(t, s, s + .12)) })).join('');
    if (t > 5.2 && t < 6.1) fx += L.label(560, 860, 'できた！', { fs: 96, fill: '#F2A33A', s: outBack(seg(t, 5.2, 5.45)) });
    if (t > 7.4 && t < 8.6) fx += L.label(330, 1150, 'もぐもぐ', { fs: 64, rot: -6, fill: '#6C9A4A' });
    const cam = L.camAt([
      { t: 0, z: 1.35, cx: 560, cy: 1080 },
      { t: 1.0, z: 1.05, cx: 540, cy: 1250, d: 1.4 },          // 伸びる書類を追って引く
      { t: 2.9, z: 1.3, cx: 560, cy: 1100, d: .5 },
      { t: 3.4, z: 1.05, cx: 460, cy: 1250, d: .5 },
      { t: 6.2, z: 1.2, cx: 420, cy: 1200, d: .6 },
      { t: 7.2, z: 1.55, cx: 260, cy: 1240, d: .6 },          // もぐもぐのジル
    ], t);
    if (t > 8.6) fx = '';
    L.mount({ bg, back: '', ren, jil: front + jil, fx, ui: '', cam });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
