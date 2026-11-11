// 「最後の1枚」（セリフなし・約11.6秒）v2 演出／キャラは本番の rig.js
// 2026-11-11 作り直し（総見直し）：レンとジルには腕がない。紙のはしを「口でくわえて」引っぱる（うさぎらしいしぐさ）。limb() は使わない。
// ゲーム：トレイに残った最後のコピー用紙。レンとジルが左右から同時にくわえて綱引き。
// ①小（くわえて首を振る）②中（体ごと後ろへ）③大（立ち上がって全力・耳が飛ぶ）→（間：音が止まり、紙の割れ目に寄る→ジルがレンを見て、ほんの少しゆるみ、またきりっ）→ビリッ
// オチ：二人とも半分をくわえたまま、得意げにビンキー（少しずらして）。
// オチの後のオチ：ポムがトレイの後ろから出てきて、2枚の半分をテープで貼り合わせて「受理」。紙がトレイに戻ると、また二人がくわえに寄る（冒頭につながる）
document.write('<script src="v2/lib.js"><\/script>');
var EP = {
  dur: 11.6,
  bgmHolds: '4.6-5.9',
  sfx: [{ t: 0.2, type: 'pop' }, { t: 0.45, type: 'tap' }, { t: 1.0, type: 'swish' }, { t: 1.6, type: 'swish' },
    { t: 2.0, type: 'whoosh' }, { t: 2.5, type: 'swish' }, { t: 3.0, type: 'swish' },
    { t: 3.4, type: 'boing' }, { t: 3.9, type: 'whoosh' }, { t: 4.3, type: 'whoosh' },
    { t: 5.3, type: 'blink' }, { t: 5.9, type: 'thump' }, { t: 6.0, type: 'whoosh' }, { t: 6.5, type: 'flop' },
    { t: 7.0, type: 'boing' }, { t: 7.15, type: 'boing' }, { t: 7.9, type: 'pop' }, { t: 8.4, type: 'swish' },
    { t: 8.9, type: 'swish' }, { t: 9.3, type: 'clink' }, { t: 9.4, type: 'pon' }, { t: 9.9, type: 'tap' }, { t: 10.3, type: 'twitch' }],
  frame(t) {
    const L = window.L; if (!L || !window.RIG) return;
    const { seg, ease, outBack, pulse, lerp, clamp } = L;
    const dur = this.dur;
    const bg = L.office({ sky: 'day', clock: [17, 58] });

    // ---------- 寸法：紙（横長）を2匹が左右のはしでくわえる。顔は正面向きなので、口と口の間は頭の幅より広く
    const CX = 540, PWID = 330, PHT = 230;            // 紙の幅・高さ
    const sR = 1.55, sJ = 1.38;                        // 大きさ（画面の高さの35%以上に見えるよう、寄りと合わせて）
    const FEET = 1660;
    const RY = FEET - 405 * sR;                        // レン（左・向きを反転＝顔が内側）
    const MOUTHY = RY + 261 * sR;                      // くわえたときの口の高さ
    const JY = MOUTHY - 261 * sJ;                      // ジル（右）の口の高さをそろえる
    const TRAYY = 1560;                                // トレイ（紙の置き台）の上のふち

    // ---------- 綱引きの強さ：d<0 で紙がレン側（左）へ。k：紙の伸び
    const stage = (a, b, v0, v1) => lerp(v0, v1, ease(seg(t, a, b)));
    const bite = ease(seg(t, 0.15, 0.45));            // 寄ってくわえる
    const biting = t >= 0.45 && t < 5.9;
    const torn = t >= 5.9;
    const ph = 5.4 * t + 0.4 * t * t;
    let amp = 0;
    if (t >= 0.6) amp = stage(0.6, 0.9, 0, 16);
    if (t >= 2.0) amp = stage(2.0, 2.3, 16, 44);
    if (t >= 3.4) amp = stage(3.4, 3.7, 44, 74);
    if (t >= 4.6) amp = stage(4.6, 4.8, 74, 3);
    let d = biting ? amp * Math.sin(ph) : 0;
    if (t >= 4.7 && t < 5.9) d = 3 * Math.sin(t * 70) * (1 + seg(t, 4.7, 5.8));   // ぴん、と張ったまま震える
    let k = 0;                                         // 伸び（0〜1）
    if (biting) k = t < 2.0 ? 0.05 + 0.05 * Math.abs(Math.sin(ph)) : t < 3.4 ? 0.18 + 0.1 * Math.abs(Math.sin(ph)) : t < 4.6 ? 0.34 + 0.14 * Math.abs(Math.sin(ph)) : lerp(0.45, 0.7, seg(t, 4.7, 5.8));
    const stretch = k * 34;                            // 口と口の間が広がる px
    const pullBack = biting ? (t < 2.0 ? 4 : t < 3.4 ? 14 : 24) : 0;   // 体を後ろへ反らす
    const sh = t > 5.9 && t < 6.35 ? (1 - seg(t, 5.9, 6.35)) * 22 : 0;

    // ---------- レン（左）
    const rIn = lerp(-70, 0, bite);                    // くわえる前は少し離れている
    let rx = CX - PWID / 2 - stretch / 2 - 220 * sR + rIn + d - pullBack;
    let R = Object.assign({}, RIG.POSES.sit, RIG.FACES.smile, { scale: sR, flip: true, x: rx, y: RY, eyeLook: -0.8, headNod: 18 * bite });
    if (t < 0.45) Object.assign(R, L.anticip(t, 0.3), { mouth: t > 0.3 ? 'open' : 'smile' });
    if (t >= 0.45 && t < 2.0) Object.assign(R, RIG.FACES.smile, { mouth: 'line', eyeShape: 'happy', headTilt: 6 * Math.sin(ph) });
    if (t >= 2.0 && t < 3.4) Object.assign(R, RIG.POSES.lean, RIG.FACES.sharp, { mouth: 'line', bodyTilt: 10, headNod: 18, sweat: 0.6, eyeLook: -0.8 }, L.anticip(t, 2.0));
    if (t >= 3.4 && t < 4.6) Object.assign(R, RIG.POSES.stand, RIG.FACES.angry, { excl: 0, mouth: 'line', headNod: 0, bodyTilt: 16, y: RY - 40, earL: -26, earR: 20, sweat: 1 }, L.anticip(t, 3.4));
    if (t >= 4.6 && t < 5.9) Object.assign(R, RIG.POSES.stand, RIG.FACES.sharp, { mouth: 'line', headNod: 0, bodyTilt: 16, y: RY - 40, eyeOpen: 0.75, sweat: 1, eyeLook: -0.8 });
    // ビリッ：うしろへ転がる→座る（着地のつぶれ）
    if (t >= 5.9 && t < 6.8) { const u = seg(t, 5.9, 6.25); Object.assign(R, RIG.POSES.sit, RIG.FACES.surprised, { excl: 0, mouth: 'line', x: rx - 90 * ease(u), y: RY - 60 * Math.sin(Math.PI * u), bodyTilt: 24 * Math.sin(Math.PI * u), headNod: 10 }, L.land(t, 6.25)); }
    if (t >= 6.8) { R.x = rx - 90; Object.assign(R, RIG.FACES.smug, { sparkle: 0, mouth: 'line', headNod: 8, eyeLook: -0.4 }, L.binky(t, 7.0)); }
    if (t >= 8.4 && t < 9.9) Object.assign(R, RIG.FACES.surprised, { excl: 0, mouth: 'w', headNod: 0, eyeLook: -0.8, eyeOpen: 1.1 });
    if (t >= 9.4 && t < 9.9) Object.assign(R, L.droop(t, 9.4), { mouth: 'w' });
    if (t >= 9.9) { const u = ease(seg(t, 9.9, 10.4)); Object.assign(R, RIG.FACES.sharp, { x: lerp(rx - 90, rx, u), headNod: 18 * u, mouth: u > 0.6 ? 'open' : 'line', eyeLook: -0.8 }, L.anticip(t, 9.95)); }
    if (R.yOff) { R.y += R.yOff; delete R.yOff; }
    const Rq = drawChar('ren', R, t);

    // ---------- ジル（右）：少し遅れて同じことをする（2匹が同時に同じ動きをしない）
    const jIn = lerp(70, 0, ease(seg(t, 0.2, 0.5)));
    let jx = CX + PWID / 2 + stretch / 2 - 188 * sJ + jIn + d + pullBack;
    let J = Object.assign({}, RIG.POSES.sit, RIG.FACES.sharp, { scale: sJ, x: jx, y: JY, eyeLook: -0.8, headNod: 18 * ease(seg(t, 0.2, 0.5)) });
    if (t < 0.5) Object.assign(J, L.anticip(t, 0.35), { mouth: t > 0.35 ? 'open' : 'line' });
    if (t >= 0.5 && t < 2.0) Object.assign(J, RIG.FACES.sharp, { mouth: 'line', headTilt: -5 * Math.sin(ph + 0.6) });
    if (t >= 2.0 && t < 3.4) Object.assign(J, RIG.POSES.lean, RIG.FACES.sharp, { eyeShape: 'angry', mouth: 'line', bodyTilt: -10, headNod: 18, sweat: 0.6, eyeLook: -0.8 }, L.anticip(t, 2.08));
    if (t >= 3.4 && t < 4.6) Object.assign(J, RIG.POSES.stand, RIG.FACES.angry, { excl: 0, mouth: 'line', headNod: 0, bodyTilt: -16, y: JY - 36, earL: 18, earR: -18, sweat: 1 }, L.anticip(t, 3.48));
    // 間：ジルがレンを見て、ほんの少しゆるみ、またきりっ
    if (t >= 4.6 && t < 5.9) {
      Object.assign(J, RIG.POSES.stand, { y: JY - 36, headNod: 0, bodyTilt: -16, eyeShape: 'round', eyeOpen: 0.95, mouth: 'line', sweat: 0.5, excl: 0, browAngle: -6, eyeLook: -1 });
      const soft = pulse(t, 4.75, 5.55);
      if (soft > 0) Object.assign(J, { eyeShape: 'half', eyeOpen: 0.6, blush: 0.7 * soft, heart: soft, browAngle: 6 });
    }
    if (t >= 5.9 && t < 6.8) { const u = seg(t, 5.96, 6.3); Object.assign(J, RIG.POSES.sit, RIG.FACES.surprised, { excl: 0, mouth: 'line', x: jx + 90 * ease(u), y: JY - 60 * Math.sin(Math.PI * u), bodyTilt: -24 * Math.sin(Math.PI * u), headNod: 10 }, L.land(t, 6.3)); }
    if (t >= 6.8) { J.x = jx + 90; Object.assign(J, RIG.FACES.smug, { sparkle: 0, mouth: 'line', headNod: 8, eyeLook: -0.4 }, L.binky(t, 7.15)); }
    if (t >= 8.4 && t < 9.9) Object.assign(J, RIG.FACES.annoyed, { mouth: 'w', headNod: 0, eyeLook: -0.8, sweat: 1 });
    if (t >= 9.5 && t < 9.9) Object.assign(J, L.droop(t, 9.5), { mouth: 'w' });
    if (t >= 9.98) { const u = ease(seg(t, 9.98, 10.45)); Object.assign(J, RIG.FACES.sharp, { eyeShape: 'angry', x: lerp(jx + 90, jx, u), headNod: 18 * u, mouth: u > 0.6 ? 'open' : 'line', eyeLook: -0.8, browAngle: -14 }, L.anticip(t, 10.03)); }
    if (J.yOff) { J.y += J.yOff; delete J.yOff; }
    const Jq = drawChar('jil', J, t);

    // ---------- 口の位置（描いた絵から取る＝体が動いても紙がずれない）
    const mR = mouthOf('ren'), mJ = mouthOf('jil');

    // ---------- 前面（紙・トレイ・効果）
    let fx = '';
    const paperLines = (x0, y0, w, n) => Array.from({ length: n }, (_, i) => `<line x1="${x0 + 22}" y1="${y0 + 40 + i * 30}" x2="${x0 + w - 22 - (i % 2) * 40}" y2="${y0 + 40 + i * 30}" stroke="#D5C9B4" stroke-width="6" stroke-linecap="round"/>`).join('');
    const tray = () => `<g>
      <ellipse cx="${CX}" cy="${TRAYY + 196}" rx="200" ry="20" fill="#5A3A1E" opacity=".18"/>
      <rect x="${CX - 200}" y="${TRAYY + 50}" width="400" height="140" rx="22" fill="#B48A60"/><rect x="${CX - 200}" y="${TRAYY + 50}" width="400" height="26" rx="13" fill="#C99E73"/>
      <rect x="${CX - 186}" y="${TRAYY + 120}" width="372" height="5" rx="2" fill="#8C603C" opacity=".5"/><circle cx="${CX}" cy="${TRAYY + 150}" r="9" fill="#8C603C"/>
      <path d="M${CX - 210} ${TRAYY} L${CX + 210} ${TRAYY} L${CX + 196} ${TRAYY + 64} Q${CX + 192} ${TRAYY + 74} ${CX + 180} ${TRAYY + 74} L${CX - 180} ${TRAYY + 74} Q${CX - 192} ${TRAYY + 74} ${CX - 196} ${TRAYY + 64} Z" fill="#8FA3B5"/>
      <path d="M${CX - 210} ${TRAYY} L${CX + 210} ${TRAYY}" stroke="#B9C8D6" stroke-width="10" stroke-linecap="round"/>
      <rect x="${CX - 120}" y="${TRAYY + 18}" width="240" height="40" rx="12" fill="#FFF3C4"/>
      <text x="${CX}" y="${TRAYY + 49}" font-size="30" font-weight="900" text-anchor="middle" fill="#C8463C" font-family="Noto Sans, Noto Sans CJK JP, sans-serif" letter-spacing="2">LAST SHEET</text></g>`;
    // 紙（くわえている間：上の2つの角が口、下は口の真下へ垂れる。伸びるほど真ん中がくびれる）
    if (!torn) {
      let A, B;
      if (t < 0.45) { A = { x: CX - PWID / 2, y: MOUTHY }; B = { x: CX + PWID / 2, y: MOUTHY }; }
      else { A = mR; B = mJ; }
      const lift = biting ? 0 : 0;
      const pinch = k * 46, sag = 10 + k * 20, wob = (t >= 3.4 ? 6 : 2) * Math.sin(t * 26) * (biting ? 1 : 0);
      const mid = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 + sag };
      const bl = { x: A.x + 10 + pinch * 0.4, y: A.y + PHT - lift }, br = { x: B.x - 10 - pinch * 0.4, y: B.y + PHT - lift };
      const bm = { x: (bl.x + br.x) / 2 + wob, y: (bl.y + br.y) / 2 - pinch * 0.5 };
      fx += `<path d="M${A.x} ${A.y} Q${mid.x} ${mid.y} ${B.x} ${B.y} L${br.x} ${br.y} Q${bm.x} ${bm.y + pinch} ${bl.x} ${bl.y} Z" fill="#FFFFFF" stroke="#CBBDA6" stroke-width="6" stroke-linejoin="round"/>`;
      fx += `<g opacity=".9">${paperLines(Math.min(A.x, bl.x), Math.min(A.y, B.y) + sag * 0.5, Math.abs(B.x - A.x), 5)}</g>`;
      // 引っぱられたしわ（真ん中へ向かう斜めの線）
      for (let i = 0; i < Math.round(k * 9); i++) fx += `<path d="M${A.x + 16} ${A.y + 30 + i * 22} L${mid.x - 10} ${A.y + 50 + i * 22} M${B.x - 16} ${B.y + 30 + i * 22} L${mid.x + 10} ${B.y + 50 + i * 22}" stroke="#E3D8C4" stroke-width="3" opacity=".9"/>`;
      // 割れ目（間のあいだに育つ）
      const crack = seg(t, 4.75, 5.85);
      if (crack > 0) { let dd = `M${mid.x} ${mid.y - 4}`; const n = Math.max(1, Math.floor(crack * 8)); for (let i = 1; i <= n; i++) dd += ` L${mid.x + (i % 2 ? 10 : -10)} ${mid.y + (PHT - 30) * (i / 8) * crack}`; fx += `<path d="${dd}" fill="none" stroke="#8A7A64" stroke-width="5" stroke-linejoin="round"/>`; }
      // 口もとの「くわえ」（紙のはしに小さな歯の跡）
      if (t >= 0.45) for (const m of [A, B]) fx += TEETH(m.x, m.y);
    }
    // 力んでいる線（段階が上がるほど長く・多く）
    if (biting && t >= 2.0 && t < 4.6) {
      const lv = t < 3.4 ? 1 : 2;
      for (const [m, sd] of [[mR, -1], [mJ, 1]]) for (let i = 0; i < 2 + lv; i++) {
        const x = m.x + sd * (150 + i * 6), y = m.y - 70 + i * 34 + 6 * Math.sin(t * 30 + i), Ln = 26 + lv * 16;
        fx += `<path d="M${x} ${y} l${sd * Ln} ${(i - 1.5) * 7}" stroke="#5A3A1E" stroke-width="7" stroke-linecap="round" opacity=".75"/>`;
      }
    }
    // 破れた半分：それぞれの口からぶら下がって揺れる
    const half = (m, side, swing, s = 1) => {
      const w = PWID / 2 + 4, h = PHT; const jag = [0, .12, .25, .38, .5, .62, .75, .88, 1];
      let dd = side < 0 ? `M0 0 L${w} 0` : `M0 0 L${-w} 0`;
      jag.forEach((u, i) => { dd += ` L${side < 0 ? w + (i % 2 ? 9 : -9) : -w + (i % 2 ? -9 : 9)} ${u * h}`; });
      dd += ` L${side < 0 ? 12 : -12} ${h} Z`;
      const x0 = side < 0 ? 12 : -w + 12;
      return `<g transform="translate(${m.x} ${m.y}) rotate(${swing}) scale(${s})"><path d="${dd}" fill="#FFFFFF" stroke="#CBBDA6" stroke-width="6" stroke-linejoin="round"/>${paperLines(x0 - 8, 0, w - 4, 5)}</g>` + (give <= 0 ? TEETH(m.x, m.y) : '');
    };
    // ポム（オチの後のオチ）：トレイの後ろから出て、2枚を受け取り、テープでとめる
    const pomIn = t >= 7.9 && t < 10.3;
    const PY = lerp(TRAYY + 120, TRAYY - 40, ease(seg(t, 7.9, 8.35)) - ease(seg(t, 9.95, 10.3)));   // 出てきて、紙を戻したら引っこむ
    const give = ease(seg(t, 8.4, 8.85));             // 半分が口からポムの前へ
    const taped = t >= 9.3;
    const JOIN = { x: CX, y: TRAYY - 420 };
    if (torn && !taped) {
      const sw = (side) => (side < 0 ? -1 : 1) * 22 * Math.exp(-3 * (t - 5.9)) * Math.sin((t - 5.9) * 14) + (side < 0 ? 4 : -4);
      const hl = { x: lerp(mR.x, JOIN.x - 2, give), y: lerp(mR.y, JOIN.y, give) }, hr = { x: lerp(mJ.x, JOIN.x + 2, give), y: lerp(mJ.y, JOIN.y, give) };
      // ポムに渡すときは、ジャグ（破れたふち）どうしが真ん中で合う向きに
      if (give < 1) { fx += half({ x: hl.x - (PWID / 2 + 4) * 0 * give, y: hl.y }, -1, sw(-1) * (1 - give)); fx += half(hr, 1, sw(1) * (1 - give)); }
      else { fx += half({ x: JOIN.x - PWID / 2 - 4, y: JOIN.y }, -1, 0); fx += half({ x: JOIN.x + PWID / 2 + 4, y: JOIN.y }, 1, 0); }
      // テープ：ぴっと上から下へ
      if (t >= 8.9) { const u = ease(seg(t, 8.9, 9.3)); fx += `<rect x="${JOIN.x - 18}" y="${JOIN.y - 8}" width="36" height="${(PHT + 16) * u}" rx="4" fill="#F6E7A8" opacity=".9" stroke="#D9C26A" stroke-width="2"/>`; }
    }
    if (taped) {
      const toTray = ease(seg(t, 9.75, 10.15));
      const sx = CX - PWID / 2 - 4, sy = lerp(JOIN.y, MOUTHY, toTray);
      fx += `<g transform="translate(${sx} ${sy})"><rect width="${PWID + 8}" height="${PHT}" fill="#FFFFFF" stroke="#CBBDA6" stroke-width="6"/>${paperLines(0, 0, PWID + 8, 5)}<rect x="${PWID / 2 - 14}" y="-8" width="36" height="${PHT + 16}" rx="4" fill="#F6E7A8" opacity=".9" stroke="#D9C26A" stroke-width="2"/></g>`;
      // 受理（緑のチェック）
      const sc = t < 9.75 ? outBack(seg(t, 9.35, 9.6)) : 1 - seg(t, 9.75, 9.95);
      if (sc > 0) fx += `<g transform="translate(${CX} ${sy + PHT / 2}) rotate(-12) scale(${sc * 1.3})"><circle r="52" fill="#FFFFFF" opacity=".85"/><circle r="48" fill="none" stroke="#3FA34D" stroke-width="10"/><path d="M-24 2 L-8 20 L26 -20" fill="none" stroke="#3FA34D" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></g>`;
      if (t > 9.35 && t < 10.0) fx += L.sparkles(CX, sy + PHT / 2, t, 1.1, 5);
    }
    // ビリッの衝撃
    if (t > 5.9 && t < 6.4) fx += L.impact(CX, MOUTHY + 80, seg(t, 5.9, 6.4), 1.6, '#F2C14E');
    fx += tray();
    if (t > 5.3 && t < 5.9) fx += `<g opacity="${pulse(t, 5.3, 5.9).toFixed(2)}" fill="#5A3A1E">${[-40, 0, 40].map((x, i) => `<circle cx="${CX + 120 + x}" cy="${MOUTHY - 330}" r="${seg(t, 5.3 + i * .12, 5.42 + i * .12) * 13}"/>`).join('')}</g>`;   // 「…」（文字は豆腐になるので丸で）
    const ui = L.speed(540, 960, t > 5.88 && t < 6.4 ? 1 - seg(t, 5.88, 6.4) : 0, 36) + (t > 5.88 && t < 6.05 ? `<rect width="1080" height="1920" fill="#FFF6DA" opacity="${(0.35 * (1 - seg(t, 5.88, 6.05))).toFixed(2)}"/>` : '');

    // ---------- カメラ
    const cam = L.camAt([
      { t: 0, z: 1.18, cx: CX, cy: MOUTHY - 190 },                  // A 寄り：トレイの最後の1枚へ、両側から口が寄る（すぐ動く）
      { t: 2.0, z: 1.26, cx: CX, cy: MOUTHY - 150, d: .5 },        // B 中：体ごと
      { t: 3.4, z: 1.12, cx: CX, cy: MOUTHY - 190, d: .5 },        // C 引き：立ち上がって全力
      { t: 4.6, z: 1.55, cx: CX + 120, cy: MOUTHY - 60, d: .5 },  // D ジルの顔：レンを見て、ほんの少しゆるむ
      { t: 5.25, z: 2.3, cx: CX, cy: MOUTHY + 90, d: .45 },       // E 寄り：紙の割れ目
      { t: 5.9, z: 1.15, cx: CX, cy: MOUTHY - 170, d: .35 },       // F 引き：ビリッ
      { t: 7.8, z: 1.3, cx: CX, cy: MOUTHY - 200, d: .5 },        // G ポム
      { t: 9.75, z: 1.18, cx: CX, cy: MOUTHY - 190, d: .5 }        // H トレイに戻る→また口が寄る
    ], t);
    L.mount({ bg, fx: (pomIn ? '' : '') + fx, ui, cam, t, shake: sh });
    if (pomIn) { const f = document.getElementById('fx');
      const q = { cheek: 0, eye: 'round', bow: 0, squash: 0, paws: t >= 8.5 && t < 9.7 ? 1 : 0, wob: 0, blush: 0.4, look: 0, mouth: 'w', sweat: 0 };
      if (t >= 9.0 && t < 9.3) Object.assign(q, { eye: 'big' });
      if (t >= 9.3) Object.assign(q, { eye: 'happy', blush: 0.9, bow: L.pulse(t, 9.5, 9.9) });
      // ポムは紙とトレイの間（紙の後ろ、トレイの前には出ない）
      const tr = f.lastElementChild; f.insertBefore(pomDefs(), tr); f.insertBefore(pomShape(CX, PY, 1.15, q), tr); }
    if (typeof endcard === 'function') endcard(t, dur);
  }
};
// 前歯で紙のはしをくわえる（うさぎの2本の前歯。紙の上に重ねて「くわえている」と分かるように）
function TEETH(x, y) { return `<g transform="translate(${x} ${y - 6})"><path d="M-17 -2 Q0 -12 17 -2" fill="none" stroke="#7A5A48" stroke-width="4" stroke-linecap="round"/><rect x="-9" y="-3" width="8.5" height="13" rx="3" fill="#FFFFFF" stroke="#7A5A48" stroke-width="2.5"/><rect x="0.5" y="-3" width="8.5" height="13" rx="3" fill="#FFFFFF" stroke="#7A5A48" stroke-width="2.5"/></g>`; }
// キャラを描いて、足元の影をつける（L.char と同じ。描いたパラメータを返す）
function drawChar(id, p, t) {
  const svg = document.getElementById(id);
  const q = RIG.render(svg, RIG.alive(Object.assign({ char: id }, p), t, {}));
  L.footShadow(svg, id, q, t);
  return q;
}
// 口の位置（ワールド座標）：鼻（rig.js の c.nose の色の形）の下 14（キャラの座標）
function mouthOf(id) {
  const NOSE = { ren: '#C88D85', jil: '#D98F8E' };
  const svg = document.getElementById(id);
  const n = [...svg.querySelectorAll('path,ellipse')].find(e => (e.getAttribute('fill') || '').toUpperCase() === NOSE[id]);
  if (!n) return { x: 540, y: 1400 };
  const b = n.getBBox(), m = n.getCTM(), p = svg.createSVGPoint();
  p.x = b.x + b.width / 2; p.y = b.y + b.height + 9;
  const w = p.matrixTransform(m);
  return { x: w.x, y: w.y };
}

// ---------- ポム（キンクマハムスター）の SVG。pom_debut と同じ見目 ----------
const POM = { a: '#F3E3CA', b: '#DCC29E', deep: '#C9A57A', cream: '#FAF1E4', earO: '#8E786C', earI: '#E9A9A2', nose: '#E58F98', pink: '#F2B8B0', band: '#C8263C', eye: '#0B0D10' };
function pomEl(n, a, k) { const e = document.createElementNS('http://www.w3.org/2000/svg', n); for (const x in a) e.setAttribute(x, a[x]); (k || []).forEach(c => c && e.appendChild(c)); return e; }
function pomDefs() {
  const el = pomEl;
  const st = (o, c, a) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a == null ? 1 : a });
  return el('defs', {}, [
    el('filter', { id: 'pomfur', x: '-10%', y: '-10%', width: '120%', height: '120%' }, [
      el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.7', numOctaves: '2', seed: '21', result: 'n' }),
      el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: '5', xChannelSelector: 'R', yChannelSelector: 'G' })]),
    el('filter', { id: 'pomblur', x: '-40%', y: '-40%', width: '180%', height: '180%' }, [el('feGaussianBlur', { stdDeviation: 4 })]),
    el('radialGradient', { id: 'pombody', cx: 0.4, cy: 0.3, r: 0.8 }, [st(0, POM.a), st(0.6, POM.b), st(1, POM.deep)]),
    el('radialGradient', { id: 'pomhead', cx: 0.5, cy: 0.4, r: 0.65 }, [st(0, '#F7E9D3'), st(0.6, POM.a), st(1, POM.b)]),
    el('radialGradient', { id: 'pomcheek', cx: 0.45, cy: 0.4, r: 0.6 }, [st(0, '#FFFFFF'), st(0.62, POM.cream), st(0.9, '#EBDCC6'), st(1, '#D9C4A4')])
  ]);
}
function pomShape(x, y, s, q) {
  const el = pomEl;
  const fur = { filter: 'url(#pomfur)' };
  const E = (cx, cy, rx, ry, fill, ex) => el('ellipse', Object.assign({ cx, cy, rx, ry, fill }, ex || {}));
  const sq = q.squash || 0, sy = 1 + sq * 0.6, sx = 1 - sq * 0.4;
  const c = q.cheek || 0, bow = q.bow || 0;
  const hy = -128 + 16 * bow;
  const body = [
    E(0, 2, 78, 9, '#3B2A20', { opacity: 0.18, filter: 'url(#pomblur)' }),
    E(-30, -5, 17, 8, POM.pink), E(30, -5, 17, 8, POM.pink),
    E(0, -60, 76, 62, 'url(#pombody)', fur),
    E(0, -46, 48, 40, POM.cream, Object.assign({ opacity: 0.95 }, fur)),
    el('g', { transform: 'translate(-30 -40) scale(0.9)' }, [
      el('path', { d: 'M0 12 L-9 0 L-9 -11 L0 -4 Z', fill: '#F2C230', stroke: '#B8901C', 'stroke-width': 1 }),
      el('path', { d: 'M0 12 L9 0 L9 -11 L0 -4 Z', fill: '#3FA34D', stroke: '#2C7A37', 'stroke-width': 1 })])
  ];
  const pw = q.paws ? [E(-26, -96, 11, 9, POM.pink), E(26, -96, 11, 9, POM.pink)] : [E(-20, -70, 10, 8, POM.pink), E(20, -70, 10, 8, POM.pink)];
  const ear = sd => el('g', { transform: `translate(${sd * 42} ${hy - 44}) rotate(${sd * 22})` }, [E(0, 0, 17, 18, POM.earO, fur), E(0, 2, 12, 13, POM.earI)]);
  const cr = 1 + 1.45 * c;
  const cheek = sd => E(sd * (34 + 24 * c), hy + 18 + 8 * c, 26 * cr, 22 * (1 + 1.1 * c), 'url(#pomcheek)', fur);
  const eyeY = hy - 6, ex = 22 + 2 * c, look = 2.5 * (q.look || 0);
  const eye = sd => {
    const cx = sd * ex + look;
    if (q.eye === 'happy') return el('path', { d: `M${cx - 9} ${eyeY + 3} Q${cx} ${eyeY - 9} ${cx + 9} ${eyeY + 3}`, fill: 'none', stroke: POM.eye, 'stroke-width': 4, 'stroke-linecap': 'round' });
    const r = q.eye === 'big' ? 12 : 9.5;
    return el('g', {}, [E(cx, eyeY, r * 0.92, r * 1.05, POM.eye), E(cx + 3, eyeY - 4, r * 0.32, r * 0.3, '#FFFFFF'), E(cx - 2.5, eyeY + 4, r * 0.14, r * 0.12, '#FFFFFF', { opacity: 0.7 })]);
  };
  const mouth = el('path', { d: `M0 ${hy + 24} V${hy + 28} M0 ${hy + 28} q-4 4 -8 2 M0 ${hy + 28} q4 4 8 2`, fill: 'none', stroke: '#9A5A50', 'stroke-width': 2, 'stroke-linecap': 'round' });
  const head = el('g', { transform: `rotate(${q.wob || 0} 0 ${hy + 40})` }, [
    ear(-1), ear(1),
    E(0, hy, 64, 55, 'url(#pomhead)', fur),
    E(0, hy - 24, 44, 26, '#E2BE8C', { opacity: 0.4, filter: 'url(#pomblur)' }),
    cheek(-1), cheek(1),
    E(-36 - 18 * c, hy + 16, 9 + 6 * c, 5 + 3 * c, '#EC8C8C', { opacity: 0.45 * (q.blush || 0) }), E(36 + 18 * c, hy + 16, 9 + 6 * c, 5 + 3 * c, '#EC8C8C', { opacity: 0.45 * (q.blush || 0) }),
    eye(-1), eye(1),
    E(0, hy + 14, 6.5, 4.8, POM.nose),
    mouth,
    el('path', { d: `M-14 ${hy + 18} L-${54 + 20 * c} ${hy + 10} M-14 ${hy + 22} L-${52 + 20 * c} ${hy + 26} M14 ${hy + 18} L${54 + 20 * c} ${hy + 10} M14 ${hy + 22} L${52 + 20 * c} ${hy + 26}`, fill: 'none', stroke: '#FFFFFF', 'stroke-width': 1.3, opacity: 0.85 }),
    el('path', { d: `M-54 ${hy - 24} Q0 ${hy - 44} 54 ${hy - 24}`, fill: 'none', stroke: POM.band, 'stroke-width': 10, 'stroke-linecap': 'round' }),
    el('path', { d: `M-44 ${hy - 28} Q0 ${hy - 45} 44 ${hy - 28}`, fill: 'none', stroke: '#FFFFFF', 'stroke-width': 2, opacity: 0.4 }),
    el('path', { d: `M50 ${hy - 26} q16 2 22 12 l-6 4 q-6 -8 -16 -10 Z M50 ${hy - 26} q18 -6 26 0 l-4 6 q-8 -4 -20 0 Z`, fill: POM.band })
  ]);
  return el('g', { transform: `translate(${x} ${y}) scale(${s * sx} ${s * sy})` }, [...body, head, ...pw]);
}
