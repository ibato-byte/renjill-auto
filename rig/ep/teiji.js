// 「定時1分前」（約9.5秒・セリフなし）v2 絵
// 金曜17:59。帰る準備万端のジル → 書類の山を抱えたレン「ちょっといい？」→ ジル固まる → 18:00 の鐘でジルが土ぼこりを残して消える
// → 空の椅子に話しかけるレン → こちら（見ている人）を向いて「ちょっといい？」（最初の場面＝見ている人の席に戻ってループ）
document.write('<script src="v2/lib.js"><\/script>');
var EP = {
  dur: 9.5,
  bgmHolds: '4.0-4.5',
  sfx: [{ t: 0.15, type: 'pop' }, { t: 0.6, type: 'tap' }, { t: 1.4, type: 'whoosh' }, { t: 1.9, type: 'pon' }, { t: 2.7, type: 'blink' },
    { t: 3.2, type: 'twitch' }, { t: 4.0, type: 'chime' }, { t: 4.35, type: 'swish' }, { t: 4.45, type: 'whoosh' }, { t: 5.6, type: 'tap' }, { t: 6.9, type: 'pon' }, { t: 7.6, type: 'boing' }],
  frame(t) {
    const L = window.L; if (!L) return;
    const { seg, ease, lerp, outBack } = L;
    const DESK = 1360;
    const gone = t >= 4.4;                                 // ジルが消えた
    const min = t < 4.0 ? 59 : 0, hr = t < 4.0 ? 17 : 18;
    const bg = L.office({ sky: 'dusk', clock: [hr, min], month: '11月' })
      + L.chair(360, 1500, gone ? (t - 4.4) * 14 * Math.max(0, 1 - (t - 4.4) / 2.2) : 0);
    // ジル：0〜1.4 ルンルン（揺れ）→ 2.6 気づく → 3.2 固まる（汗・耳ぺたん）→ 4.4 消える
    let jil = '';
    if (!gone) {
      const bob = t < 2.3 ? Math.sin(t * 9) * 5 : 0;
      const face = t < 2.5 ? { eye: 'happy', mouth: 'smile' } : t < 3.1 ? { eye: 'wide', mouth: 'o', look: [.6, 0] } : { eye: 'wide', mouth: 'wobble', look: [.6, 0] };
      const ear = t < 2.5 ? .4 : -1;
      const sweat = seg(t, 3.0, 3.3);
      const squash = t > 3.9 ? .35 * seg(t, 3.9, 4.3) : 0;  // 消える直前に縮む（ため）
      jil = L.bunny('jil', { x: 360, y: 1430 + bob, s: 1.0, face, ear, sweat, squash, lean: t < 2.3 ? Math.sin(t * 9) * 4 : 0, armR: t < 2.4 ? 70 + Math.sin(t * 9) * 20 : 30, t, shake: t > 3.2 && t < 3.9 ? 6 : 0 });
    }
    // 机・ノートPC・バッグ（ジルより手前）
    const front = L.desk(DESK, { x: 20, w: 600, h: 300, props: L.laptop(520, DESK + 4, .62, `<rect x="20" y="20" width="288" height="40" rx="8" fill="#9DB9DD"/><rect x="20" y="80" width="200" height="16" rx="6" fill="#B9CBE3"/><rect x="20" y="110" width="240" height="16" rx="6" fill="#B9CBE3"/>`) + (gone ? '' : L.bag(150 + (t < 2.3 ? Math.sin(t * 9) * 4 : 0), DESK + 2, .9)) });
    // レン：1.4 右から滑り込む（書類の山）→ 5.2 空の椅子を見る → 6.4 こちらを向く
    const enter = outBack(seg(t, 1.4, 1.9));
    const rx = lerp(1500, 900, enter);
    const rface = t < 4.4 ? { eye: 'happy', mouth: 'smile' } : t < 6.4 ? { eye: 'tiny', mouth: 'flat', look: [-1, 0] } : { eye: 'open', mouth: 'smile', look: [0, .2] };
    const stack = L.papers(0, -30, 13);
    const ren = L.bunny('ren', { x: rx, y: 1700, s: 1.05, flip: t < 6.4, face: rface, ear: t < 4.4 ? .3 : -.2, armL: 25, armR: 25, item: stack, t, tilt: t > 5 && t < 6.4 ? -6 : 0, blush: t > 6.6 ? 1 : .7 });
    // 吹き出し・効果（fx）
    let fx = '';
    if (t > 1.95 && t < 3.6) fx += L.bubble(800, 1020, 'ちょっといい？', { w: 470, h: 120, fs: 56, tail: 60, s: outBack(seg(t, 1.95, 2.25)) });
    if (t > 3.2 && t < 3.9) fx += L.mark(560, 920, '!?', 1 + .1 * Math.sin(t * 30));
    if (t >= 4.0 && t < 4.4) fx += L.label(540, 520, 'キンコーン', { fs: 90, rot: -6, fill: '#F2A33A', s: outBack(seg(t, 4.0, 4.2)) });
    if (t >= 4.4) fx += L.dust(360, 1150, seg(t, 4.4, 5.3));
    if (t >= 4.4 && t < 4.9) fx += L.speed(360, 1050, 1 - seg(t, 4.4, 4.9), 40);
    if (t > 5.5 && t < 6.3) fx += L.bubble(840, 1050, '…', { w: 200, h: 110, fs: 64, tail: 40 });
    // 最後：こちらに「ちょっといい？」
    let ui = '';
    if (t > 6.9) ui += L.bubble(540, 560, 'ちょっといい？', { w: 600, h: 150, fs: 72, tail: 40, s: outBack(seg(t, 6.9, 7.2)) });
    const cam = L.camAt([
      { t: 0, z: 1.25, cx: 420, cy: 1080 },
      { t: 1.4, z: 1.05, cx: 600, cy: 1140, d: .5 },
      { t: 2.6, z: 1.55, cx: 400, cy: 1020, d: .5 },
      { t: 3.75, z: 1.25, cx: 500, cy: 800, d: .45 },        // 時計
      { t: 4.4, z: 1.05, cx: 600, cy: 1140, d: .5 },
      { t: 6.4, z: 1.5, cx: 880, cy: 1180, d: .7 },
    ], t);
    if (t > 8.6) fx = '';                                    // エンドカード前に効果を片付ける
    L.mount({ bg, back: '', ren, jil: jil + front, fx, ui: t > 8.6 ? '' : ui, cam });
    if (typeof endcard === 'function') endcard(t, EP.dur);
  }
};
