// 新キャラ回「新人のポム（ほおぶくろ）」v2（18秒）
// ポム：キンクマハムスターの新入社員（赤いはちまき・若葉の社員バッジ）。ゲーム「チモシーダッシュ」と同じ見た目。
// ゲーム：新人は渡された仕事を、ぜんぶほおぶくろにしまう（断らない新人あるある）。量は倍々で増える。
// ①1枚目がもう空中（0.3秒でつかむ）→ほおへ ②3枚 → ほおがふくらむ ③課長、調子に乗ってタワーごと → パンパン、本人は得意げ
// （間：ジルの寄り・無音）→ 足ダン → ほおから書類が全部噴き出して課長の頭に積もる（マグの回の天丼）→ 0.3秒かたまる
// 関係性：ジルはあきれつつ課長の頭から1枚どけてあげる → 課長、その1枚をまたポムへ（ジルが止めても聞かない＝報われない課長）
// オチの後のオチ：ポム、うれしそうにまたしまう → ジルの無言の顔（2秒）。最後の絵（空中の書類・ポム）が冒頭につながる
// 審査（依頼の4役レビュー 1周目）の指摘で直した点：冒頭のおじぎをやめて動作から入る／ポムを大きく／量を倍々に／噴き出す瞬間を中くらいの画で／後半を短く
window.EP = {
dur: 18.0,
bgmHolds: '6.3-7.2',
sfx: [{ t: 0.3, type: 'tap' }, { t: 0.62, type: 'pop' }, { t: 0.95, type: 'blink' }, { t: 1.15, type: 'twitch' },
{ t: 1.7, type: 'tap' }, { t: 2.05, type: 'tap' }, { t: 2.4, type: 'tap' },
{ t: 1.75, type: 'swish' }, { t: 2.3, type: 'tap' }, { t: 2.75, type: 'pop' },
{ t: 3.7, type: 'swish' }, { t: 4.15, type: 'whoosh' }, { t: 4.5, type: 'tap' }, { t: 5.0, type: 'pop' }, { t: 5.25, type: 'boing' }, { t: 5.6, type: 'clink' },
{ t: 7.2, type: 'thump' }, { t: 7.25, type: 'whoosh' }, { t: 7.9, type: 'flop' }, { t: 8.1, type: 'flop' },
{ t: 8.7, type: 'twitch' }, { t: 9.05, type: 'tap' }, { t: 9.35, type: 'tap' }, { t: 9.7, type: 'swish' },
{ t: 10.6, type: 'pon' }, { t: 11.0, type: 'blink' }, { t: 11.3, type: 'swish' }, { t: 11.85, type: 'tap' }, { t: 12.25, type: 'pop' }, { t: 12.5, type: 'clink' }, { t: 13.2, type: 'blink' }],
frame(t) {
const dur = this.dur, sh = shakeAt(t, 7.2, 0.5, 26);
const S = { x: sh.x, y: sh.y };
office({ clock: [10, 5], shake: S, mug: false, papers: 'neat' });
const f = clear('fx'), ui = clear('ui'), back = clear('back');

// ---- ポム（机の上）
const PX = 600, PY = 1192, PS = 1.2;
const q = { cheek: 0, eye: 'round', bow: 0, squash: 0, paws: 0, wob: 0, blush: 0.35, look: 0, mouth: 'w', sweat: 0 };
const st1 = seg(t, 0.45, 0.65), st2 = seg(t, 2.55, 2.8), st3 = seg(t, 4.75, 5.2), st4 = seg(t, 12.05, 12.3);
const burst = seg(t, 7.22, 7.45);
let ck = 0.25 * ease(st1) + 0.3 * ease(st2) + 0.45 * ease(st3);
ck *= 1 - ease(burst);
ck += 0.3 * ease(st4);
q.cheek = ck;
if ((t < 0.65) || (t >= 2.25 && t < 2.8) || (t >= 4.45 && t < 5.2) || (t >= 11.8 && t < 12.3)) q.paws = 1;
if (t >= 0.65 && t < 1.6) Object.assign(q, { eye: 'happy', blush: 0.6, bow: goBack(t, 1.0, 1.25, 1.35, 1.6) });
if (t >= 2.8 && t < 3.6) Object.assign(q, { eye: 'happy', blush: 0.7 });
if (t >= 3.7 && t < 4.45) Object.assign(q, { eye: 'big', look: -0.6 });
if (t >= 5.2 && t < 7.2) Object.assign(q, { eye: t >= 5.45 ? 'happy' : 'round', blush: 0.9, wob: Math.sin(t * 9) * (t < 6.2 ? 6 : 3) * (1 - seg(t, 6.9, 7.2)) });
if (t >= 7.2 && t < 8.5) Object.assign(q, { eye: 'big', blush: 0.2, squash: -0.35 * pulse(t, 7.22, 7.6), mouth: 'o', sweat: t >= 7.8 ? 1 : 0 });
if (t >= 8.5 && t < 9.6) Object.assign(q, { eye: 'happy', blush: 0.9, bow: goBack(t, 8.6, 8.85, 9.1, 9.4), sweat: 1 });
if (t >= 9.6 && t < 11.7) Object.assign(q, { eye: 'round', look: -0.7 });
if (t >= 12.3) Object.assign(q, { eye: 'happy', blush: 0.8, look: 0 });
back.appendChild(pomDefs());
back.appendChild(pomShape(PX + S.x, PY + S.y, PS, q));
sparkle(back, t, 5.55, PX, PY - 250, 1.3);
sparkle(back, t, 12.45, PX, PY - 250, 1.0);

// ---- レン（床、机の手前）
const RX = 120, RY = 1160;
let R = Object.assign({}, RIG.POSES.sit, RIG.FACES.neutral, { scale: 1.45, x: RX + S.x, y: RY + S.y, eyeLook: 0.7, headNod: -6 });
const toss = (a) => goBack(t, a, a + 0.3, a + 0.5, a + 0.8);
const r0 = 1 - ease(seg(t, 0.0, 0.3)), r2 = toss(1.6), r3 = goBack(t, 3.6, 4.0, 4.3, 4.6), r4 = toss(11.0);
const rr = Math.max(r0 * 0.6, r2, r3, r4);
if (rr > 0) Object.assign(R, RIG.POSES.stand, { headNod: -16 - 18 * rr, y: RY - 90 * rr + S.y, eyeLook: 0.8 });
if (t >= 0.7 && t < 1.5) Object.assign(R, RIG.FACES.think, { question: pulse(t, 0.7, 1.5) * 1.2, eyeLook: 0.8 });
if (t >= 2.8 && t < 3.6) Object.assign(R, RIG.FACES.smile, { eyeLook: 0.8 });
if (t >= 4.6 && t < 7.2) Object.assign(R, RIG.FACES.smug, { sparkle: pulse(t, 5.4, 6.2), eyeLook: 0.8 });
if (t >= 7.2 && t < 8.2) Object.assign(R, RIG.FACES.surprised, { eyeLook: 0.8, headNod: -10 });
if (t >= 7.95 && t < 8.3) Object.assign(R, { excl: 0, eyeOpen: 1.25 }); // かたまる
if (t >= 8.3) Object.assign(R, RIG.FACES.oops, { bodySquash: -0.35 * pulse(t, 8.3, 8.7), eyeLook: 0.2, sweat: 1 });
if (t >= 10.0 && t < 10.5) Object.assign(R, RIG.FACES.neutral, { sweat: 0, eyeLook: 0.9 });
if (t >= 10.5 && t < 10.95) Object.assign(R, RIG.FACES.think, { question: 0, headNod: 18 * pulse(t, 10.5, 10.95) });
if (t >= 10.95) Object.assign(R, RIG.FACES.smile, { sweat: 0, eyeLook: 0.8 });
if (r4 > 0) Object.assign(R, RIG.POSES.stand, { headNod: -16 - 18 * r4, y: RY - 90 * r4 + S.y });
const Rq = draw('ren', 'ren', R, t, {});
const ht = headTop(Rq);
const mouth = { x: Rq.x + 180 * Rq.scale, y: Rq.y + (252 + (Rq.headNod || 0)) * Rq.scale };
const paws = { x: PX, y: PY - 96 * PS };

// ---- 書類
const flyTo = (a, b, u, h) => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) - h * Math.sin(Math.PI * u) });
const cheekPos = { x: PX + 36 * PS, y: PY - 112 * PS };
const sheetAt = (layer, p, rot, s, n) => layer.appendChild(paperShape(p.x, p.y, rot, s, n || 1));
// tFly=口を離れる, tCatch=手に届く, tStuff=しまい始め, tIn=しまい終わり
const passes = [{ fly: -0.3, catch: 0.3, stuff: 0.45, inn: 0.65, n: 1, sc: 1 }, { fly: 1.95, catch: 2.25, stuff: 2.55, inn: 2.8, n: 3, sc: 1.05 },
{ fly: 4.1, catch: 4.45, stuff: 4.75, inn: 5.2, n: 10, sc: 1.3, big: 1 }, { fly: 11.4, catch: 11.8, stuff: 12.05, inn: 12.3, n: 1, sc: 1 }];
const startMouth = { x: mouth.x, y: mouth.y };
passes.forEach((ps, k) => {
if (k === 3 && t < 10.55) return; // 最後の1枚は頭の上の山から取る
if (t < ps.fly) {
if (k === 3) { if (t < 10.9) { sheetAt(f, flyTo({ x: ht.x - 20, y: ht.y - 14 }, mouth, ease(seg(t, 10.55, 10.9)), 60), 6, 1, 1); return; } }
else if (ps.fly - t > 1.3) return;
sheetAt(f, mouth, 4, ps.sc, ps.n);
} else if (t < ps.catch) {
const from = k === 0 ? { x: lerp(startMouth.x, paws.x, 0.5), y: lerp(startMouth.y, paws.y, 0.5) - 120 } : mouth;
const u = k === 0 ? 0.5 + 0.5 * seg(t, 0, ps.catch) : seg(t, ps.fly, ps.catch);
const a = k === 0 ? startMouth : mouth;
sheetAt(f, k === 0 ? flyTo(a, paws, u, 170) : flyTo(a, paws, u, ps.big ? 220 : 170), lerp(4, -8, u), ps.sc, ps.n);
} else if (t < ps.stuff) { sheetAt(back, { x: paws.x + Math.sin(t * 20) * 2, y: paws.y - (ps.big ? 10 : 0) }, -8, ps.sc * 0.95, ps.n); }
else if (t < ps.inn) { const u = ease(seg(t, ps.stuff, ps.inn)); sheetAt(back, { x: lerp(paws.x, cheekPos.x, u), y: lerp(paws.y, cheekPos.y, u) }, -8 + 30 * u, ps.sc * 0.95 * (1 - u), Math.max(1, Math.round(ps.n * (1 - u)))); }
});
// 噴き出す書類 → 課長の頭の上に積もる（10枚）。3枚は床へひらひら
const pileN = 10;
for (let i = 0; i < pileN; i++) {
const t0 = 7.25 + i * 0.03, t1 = 7.8 + i * 0.045;
const dst = { x: ht.x - 4 + [-10, 8, -4, 12, -8, 4, -12, 10, -2, 6][i], y: ht.y - 12 - i * 11 };
if (t < t0) continue;
if (i === pileN - 1 && t >= 9.6) { const u = seg(t, 9.6, 10.2); if (u < 1) sheetAt(f, { x: lerp(dst.x, dst.x + 170, u), y: lerp(dst.y, 1730, ease(u)) }, 20 * u, 1.15, 1); else sheetAt(back, { x: dst.x + 170, y: 1730 }, 20, 1.15, 1); continue; }
if (i === pileN - 2 && t >= 10.55) continue;
const u = seg(t, t0, t1);
const rot = u < 1 ? 360 * (1 + i % 2) * u : [-6, 5, -3, 7, -5, 3, -7, 4, -2, 6][i];
sheetAt(f, u < 1 ? flyTo(cheekPos, dst, u, 300 + i * 18) : dst, rot, 1.15, 1);
}
[[260, 1700, 0], [860, 1760, 1], [470, 1790, 2]].forEach(([x, y, k]) => {
const t0 = 7.3 + k * 0.06, u = seg(t, t0, t0 + 1.4); if (t < t0) return;
const p = { x: lerp(cheekPos.x, x, u) + 40 * Math.sin(u * 9 + k) * (1 - u), y: lerp(cheekPos.y - 120, y, ease(u)) - 240 * Math.sin(Math.PI * Math.min(1, u * 1.6)) * (1 - u) };
sheetAt(u < 1 ? f : back, p, u < 1 ? 40 * Math.sin(u * 8 + k) : [12, -9, 4][k], 1.1, 1);
});

// ---- ジル
const JX = 650;
const hp = RIG.hop(t, 1.6, 2.6, 1150, JX, { hops: 3, height: 40 });
const hp2 = RIG.hop(t, 8.9, 9.45, JX, 570, { hops: 1, height: 34 });
const jx = t < 8.9 ? hp.x : hp2.x, jy = t < 8.9 ? hp.yOff : hp2.yOff, jsq = t < 8.9 ? hp.squash : hp2.squash;
let J = Object.assign({}, RIG.POSES.sit, RIG.FACES.neutral, { scale: 1.25, flip: true, x: jx + S.x, y: 1240 + jy + S.y, bodySquash: jsq, eyeLook: 0.9 });
if (t >= 2.8 && t < 3.7) Object.assign(J, RIG.FACES.think, { question: pulse(t, 2.9, 3.7), eyeLook: 0.9 });
if (t >= 3.7 && t < 5.0) Object.assign(J, RIG.FACES.annoyed, { sweat: 1, eyeLook: 0.9 });
if (t >= 5.0 && t < 6.3) Object.assign(J, RIG.FACES.surprised, { excl: pulse(t, 5.0, 5.7), eyeLook: 0.9 });
if (t >= 6.3 && t < 6.75) Object.assign(J, RIG.FACES.sharp, { earL: -8 * seg(t, 6.3, 6.7), earR: 8 * seg(t, 6.3, 6.7), bodySquash: -0.2 * seg(t, 6.3, 6.7) });
thumpPose(J, t, 6.75, 7.2, S);
if (t >= 7.2 && t < 8.5) Object.assign(J, RIG.FACES.sharp, {});
if (t >= 8.5 && t < 8.9) Object.assign(J, RIG.FACES.annoyed, { sweat: 1, eyeLook: 1 });
const nd = goBack(t, 9.45, 9.6, 9.8, 10.1);
if (nd > 0) Object.assign(J, RIG.POSES.nudge, RIG.FACES.sharp, { bodyTilt: 10 * nd, headTilt: 14 * nd, headNod: 14 * nd });
if (t >= 10.1 && t < 10.8) Object.assign(J, RIG.FACES.neutral, { eyeLook: 0.8 });
// 「やめて」：ジルが立ち上がって止める → 課長は気づかず渡す
const stop = goBack(t, 10.8, 11.1, 11.6, 11.9);
if (stop > 0) Object.assign(J, RIG.POSES.stand, RIG.FACES.surprised, { excl: 0, headNod: -16 - 20 * stop, y: 1240 - 80 * stop + S.y, eyeLook: 1 });
if (t >= 11.9) Object.assign(J, RIG.FACES.annoyed, { sparkle: 0, eyeLook: 0.9, sweat: 1, eyeOpen: 0.15, eyeShape: 'flat' });
const Jq = draw('jil', 'jil', J, t, { vx: t < 8.9 ? hp.vx : hp2.vx });
thumpWave(f, t, 7.2, Jq.x + 250, 1730);
const punch = impactAt(ui, t, 7.2);

const FJ = { x: 650 + 212 * 1.25, y: 1490 };
const shots = [
{ t: 0.0, cx: 500, cy: 1250, z: 1.5, z2: 1.6 }, // A 中寄り：書類が空中→新人ポムがキャッチ（課長の顔も入る）
{ t: 1.6, cx: 520, cy: 1220, z: 1.3 }, // B 中：3枚
{ t: 3.6, cx: 540, cy: 1180, z: 1.2 }, // C 中：タワーごと
{ t: 5.0, cx: 600, cy: 1060, z: 2.1, z2: 2.3 }, // D 寄り：ほおパンパン、得意げ
{ t: 6.15, cx: FJ.x - 30, cy: FJ.y, z: 2.0, z2: 2.6 }, // E 寄り：ジルのため（無音）
{ t: 7.1, cx: 460, cy: 1180, z: 1.25 }, // F 中：足ダン→噴き出す→課長の頭に山、かたまる
{ t: 8.6, cx: 470, cy: 1240, z: 1.35 }, // G 中：ポムのごめんなさい、ジルが1枚どける
{ t: 10.4, cx: 500, cy: 1240, z: 1.3 }, // H 中：課長がまた渡す（ジルが止めても）
{ t: 12.7, cx: FJ.x - 110, cy: FJ.y, z: 2.4 }, // I 寄り：ジルの無言（2秒）
{ t: 14.7, cx: 520, cy: 1220, z: 1.2 } // J 中：最後の絵
];
camera(cameraAt(shots, t), punch);
endcard(t, dur);
}
};

// ---------- ポム（キンクマハムスター）の SVG。足元が (x, y)。ゲームの絵と同じ配色 ----------
const POM = { a: '#F3E3CA', b: '#DCC29E', deep: '#C9A57A', cream: '#FAF1E4', earO: '#8E786C', earI: '#E9A9A2', nose: '#E58F98', pink: '#F2B8B0', band: '#C8263C', eye: '#0B0D10' };
function pomDefs() {
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
// q = { cheek 0〜1, eye 'round'|'happy'|'big', bow 0〜1, squash, paws 0/1, wob(deg), blush, look -1〜1, mouth 'w'|'o' }
function pomShape(x, y, s, q) {
const fur = { filter: 'url(#pomfur)' };
const E = (cx, cy, rx, ry, fill, ex) => el('ellipse', Object.assign({ cx, cy, rx, ry, fill }, ex || {}));
const sq = q.squash || 0, sy = 1 + sq * 0.6, sx = 1 - sq * 0.4;
const c = q.cheek || 0, bow = q.bow || 0;
const hy = -128 + 16 * bow; // 頭の中心
const body = [
E(0, 2, 78, 9, '#3B2A20', { opacity: 0.18, filter: 'url(#pomblur)' }),
E(-30, -5, 17, 8, POM.pink), E(30, -5, 17, 8, POM.pink),
E(0, -60, 76, 62, 'url(#pombody)', fur),
E(0, -46, 48, 40, POM.cream, Object.assign({ opacity: 0.95 }, fur)),
// 若葉の社員バッジ
el('g', { transform: 'translate(-30 -40) scale(0.9)' }, [
el('path', { d: 'M0 12 L-9 0 L-9 -11 L0 -4 Z', fill: '#F2C230', stroke: '#B8901C', 'stroke-width': 1 }),
el('path', { d: 'M0 12 L9 0 L9 -11 L0 -4 Z', fill: '#3FA34D', stroke: '#2C7A37', 'stroke-width': 1 })])
];
// 手：ふだんはおなかの前、受け取るときはバンザイ
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
const mouth = q.mouth === 'o' ? E(0, hy + 30, 4, 5, '#B5615E') :
el('path', { d: `M0 ${hy + 24} V${hy + 28} M0 ${hy + 28} q-4 4 -8 2 M0 ${hy + 28} q4 4 8 2`, fill: 'none', stroke: '#9A5A50', 'stroke-width': 2, 'stroke-linecap': 'round' });
const head = el('g', { transform: `rotate(${q.wob || 0} 0 ${hy + 40})` }, [
ear(-1), ear(1),
E(0, hy, 64, 55, 'url(#pomhead)', fur),
E(0, hy - 24, 44, 26, '#E2BE8C', { opacity: 0.4, filter: 'url(#pomblur)' }), // 頭の上のあんず色
cheek(-1), cheek(1),
E(-36 - 18 * c, hy + 16, 9 + 6 * c, 5 + 3 * c, '#EC8C8C', { opacity: 0.45 * (q.blush || 0) }), E(36 + 18 * c, hy + 16, 9 + 6 * c, 5 + 3 * c, '#EC8C8C', { opacity: 0.45 * (q.blush || 0) }),
eye(-1), eye(1),
E(0, hy + 14, 6.5, 4.8, POM.nose),
mouth,
el('path', { d: `M-14 ${hy + 18} L-${54 + 20 * c} ${hy + 10} M-14 ${hy + 22} L-${52 + 20 * c} ${hy + 26} M14 ${hy + 18} L${54 + 20 * c} ${hy + 10} M14 ${hy + 22} L${52 + 20 * c} ${hy + 26}`, fill: 'none', stroke: '#FFFFFF', 'stroke-width': 1.3, opacity: 0.85 }),
// はちまき
el('path', { d: `M-54 ${hy - 24} Q0 ${hy - 44} 54 ${hy - 24}`, fill: 'none', stroke: POM.band, 'stroke-width': 10, 'stroke-linecap': 'round' }),
el('path', { d: `M-44 ${hy - 28} Q0 ${hy - 45} 44 ${hy - 28}`, fill: 'none', stroke: '#FFFFFF', 'stroke-width': 2, opacity: 0.4 }),
el('path', { d: `M50 ${hy - 26} q16 2 22 12 l-6 4 q-6 -8 -16 -10 Z M50 ${hy - 26} q18 -6 26 0 l-4 6 q-8 -4 -20 0 Z`, fill: POM.band })
]);
const sw = q.sweat ? [el('path', { d: `M58 ${hy - 46} q-9 14 0 20 q9 -6 0 -20 Z`, fill: '#CFE2F1', stroke: '#4E77A0', 'stroke-width': 2.5, opacity: q.sweat })] : [];
return el('g', { transform: `translate(${x} ${y}) scale(${s * sx} ${s * sy})` }, [...body, head, ...pw, ...sw]);
}
// 書類（n 枚の束）
function paperShape(x, y, rot, s, n) {
const kids = [];
for (let i = n - 1; i >= 0; i--) kids.push(el('g', { transform: `translate(${i * 3} ${-i * 5}) rotate(${(i % 2 ? 1 : -1) * i * 2})` }, [
el('rect', { x: -36, y: -26, width: 72, height: 52, rx: 4, fill: i % 2 ? '#FBF7EF' : '#FFFFFF', stroke: '#D8CBB6', 'stroke-width': 3 }),
el('path', { d: 'M-24 -12 H20 M-24 -2 H24 M-24 8 H12', fill: 'none', stroke: '#C9BBA4', 'stroke-width': 3, 'stroke-linecap': 'round' })]));
return el('g', { transform: `translate(${x} ${y}) rotate(${rot}) scale(${Math.max(0.001, s)})` }, kids);
}
