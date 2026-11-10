// 「最後の1枚」（セリフなし・約11.6秒）
// ゲーム：トレイに残った最後のコピー用紙を、レンとジルが同時につかんで綱引き。
// ①小（遠慮がち）②中（体ごと）③大（立ち上がって全力）→（間：音が止まり、紙の割れ目に寄る→ジルの顔：レンを見て、ほんの少しだけ口もとがゆるみ、また目がきりっ）→ビリッ
// オチ：二人はそれぞれ半分を、同じ上司（画面の外）へ堂々と提出。
// オチの後のオチ：ポムがセロハンテープで2枚の半分を貼り合わせて「1枚」として受理。トレイに戻された紙に、また二人の手が伸びる（冒頭につながる）
window.EP = {
dur: 12.0,
bgmHolds: '4.9-6.3',
sfx: [{ t: 0.2, type: 'tap' }, { t: 0.55, type: 'pop' }, { t: 1.4, type: 'tap' }, { t: 2.05, type: 'tap' },
{ t: 2.7, type: 'swish' }, { t: 3.1, type: 'tap' }, { t: 3.5, type: 'swish' },
{ t: 4.0, type: 'whoosh' }, { t: 4.4, type: 'boing' }, { t: 4.7, type: 'whoosh' },
{ t: 6.35, type: 'thump' }, { t: 6.4, type: 'whoosh' }, { t: 6.9, type: 'flop' },
{ t: 7.6, type: 'blink' }, { t: 7.95, type: 'chime' }, { t: 8.4, type: 'twitch' },
{ t: 8.7, type: 'pop' }, { t: 9.0, type: 'swish' }, { t: 9.4, type: 'tap' }, { t: 9.55, type: 'swish' }, { t: 9.85, type: 'clink' }, { t: 10.0, type: 'pon' }, { t: 10.3, type: 'swish' }, { t: 10.6, type: 'blink' }],
frame(t) {
const dur = this.dur, sh = shakeAt(t, 6.35, 0.5, 24);
const S = { x: sh.x, y: sh.y };
office({ clock: [17, 58], shake: S, mug: false, papers: 'neat' });
const f = clear('fx'), ui = clear('ui'), back = clear('back');

// ---------- 綱引きの強さ（d>0：紙がレン側へ寄る。k：紙の伸び）
const PCX = 630, PW = 170, PH = 215, PBOT = 1452;
const chirp = 5 + 0.0 * t, ph = 5.2 * t + 0.42 * t * t;
const stage = (a, b, v0, v1) => lerp(v0, v1, ease(seg(t, a, b)));
let amp = 0;
if (t >= 0.7) amp = 12;
if (t >= 2.1) amp = stage(2.1, 2.4, 12, 46);
if (t >= 3.7) amp = stage(3.7, 4.0, 46, 92);
if (t >= 4.9) amp = stage(4.9, 5.1, 92, 5);
let d = t < 0.7 ? 0 : amp * Math.sin(ph);
if (t >= 5.0 && t < 6.35) d = 5 * Math.sin(t * 70) * (1 + seg(t, 5.0, 6.3));
let k = 0;
if (t >= 0.7) k = 0.04 + 0.04 * Math.abs(Math.sin(ph));
if (t >= 2.1) k = stage(2.1, 2.4, k, 0.12 + 0.08 * Math.abs(Math.sin(ph)));
if (t >= 3.7) k = stage(3.7, 4.0, k, 0.25 + 0.15 * Math.abs(Math.sin(ph)));
if (t >= 5.0) k = lerp(0.4, 0.7, seg(t, 5.0, 6.3));
const torn = t >= 6.35;
const pull = (t >= 0.7 && !torn);
// キャラの体はつられて動く
const lean = pull ? clamp(-d * 0.42, -40, 40) : 0;

// ---------- キャラ
const RX = 120, RY = 1160, JX = 650, JY = 1240;
// レン（左）
let R = Object.assign({}, RIG.POSES.sit, RIG.FACES.neutral, { scale: 1.45, x: RX + S.x + lean, y: RY + S.y, eyeLook: 0.8 });
if (t < 0.7) Object.assign(R, RIG.FACES.smile, { eyeLook: 0.9 });
if (t >= 0.7 && t < 2.1) Object.assign(R, RIG.FACES.smile, { eyeLook: 0.9, mouth: 'smile' });
if (t >= 2.1 && t < 3.7) Object.assign(R, RIG.POSES.lean, RIG.FACES.sharp, { bodyTilt: -8, headNod: 8, sweat: 0.6 });
if (t >= 3.7 && t < 6.35) Object.assign(R, RIG.POSES.stand, RIG.FACES.angry, { excl: 0, headNod: -14, y: RY - 70 + S.y, eyeShape: 'angry' });
if (t >= 4.9 && t < 6.35) Object.assign(R, { eyeOpen: 0.7, sweat: 1, mouth: 'line' });
if (t >= 6.35 && t < 7.0) Object.assign(R, RIG.POSES.sit, RIG.FACES.surprised, { excl: 0, bodySquash: -0.3 * pulse(t, 6.35, 6.9), headNod: -10, x: RX + S.x - 30 * pulse(t, 6.35, 6.9) });
if (t >= 7.0 && t < 7.7) Object.assign(R, RIG.FACES.think, { question: 0, eyeLook: 0.9 });
if (t >= 7.7 && t < 9.2) Object.assign(R, RIG.POSES.stand, RIG.FACES.smug, { sparkle: 0, headNod: -16, y: RY - 70 + S.y, eyeLook: 0.7 });
if (t >= 9.2 && t < 10.4) Object.assign(R, RIG.POSES.sit, RIG.FACES.smile, { sparkle: pulse(t, 9.8, 10.4), eyeLook: 0.9 });
if (t >= 10.4) Object.assign(R, RIG.FACES.think, { question: 0, eyeShape: 'round', eyeLook: 0.9, browAngle: -8 });
const Rq = draw('ren', 'ren', R, t, {});

// ジル（右）
let J = Object.assign({}, RIG.POSES.sit, RIG.FACES.neutral, { scale: 1.25, flip: true, x: JX + S.x + lean, y: JY + S.y, eyeLook: 0.9 });
if (t < 2.1) Object.assign(J, RIG.FACES.sharp, { eyeLook: 0.9 });
if (t >= 2.1 && t < 3.7) Object.assign(J, RIG.POSES.lean, RIG.FACES.sharp, { bodyTilt: -8, headNod: 8, sweat: 0.6, eyeShape: 'angry' });
if (t >= 3.7 && t < 6.35) Object.assign(J, RIG.POSES.stand, RIG.FACES.angry, { excl: 0, headNod: -14, y: JY - 70 + S.y, eyeShape: 'angry' });
// 間：ジルの顔。レンを見て、ほんの少しゆるみ、またきりっ
if (t >= 4.9 && t < 6.35) {
Object.assign(J, { eyeShape: 'round', eyeOpen: 0.9, mouth: 'line', sweat: 0.5, excl: 0, browAngle: -6, heart: 0 });
const soft = pulse(t, 4.95, 5.8);
if (soft > 0) Object.assign(J, { eyeShape: 'half', eyeOpen: 0.6, mouth: 'smile', blush: 0.6 * soft, heart: soft, browAngle: 6 });
}
if (t >= 6.35 && t < 7.0) Object.assign(J, RIG.POSES.sit, RIG.FACES.surprised, { excl: 0, bodySquash: -0.3 * pulse(t, 6.35, 6.9), headNod: -10, x: JX + S.x + 30 * pulse(t, 6.35, 6.9) });
if (t >= 7.0 && t < 7.7) Object.assign(J, RIG.FACES.think, { question: 0, eyeLook: 0.9 });
if (t >= 7.7 && t < 9.2) Object.assign(J, RIG.POSES.stand, RIG.FACES.smug, { sparkle: 0, headNod: -16, y: JY - 70 + S.y, eyeLook: 0.7 });
if (t >= 9.2 && t < 10.4) Object.assign(J, RIG.POSES.sit, RIG.FACES.annoyed, { sweat: 1, eyeOpen: 0.15, eyeShape: 'flat', eyeLook: 0.9 });
if (t >= 10.4) Object.assign(J, RIG.FACES.sharp, { eyeShape: 'angry', eyeLook: 0.9, browAngle: -14 });
const Jq = draw('jil', 'jil', J, t, {});

// ---------- 紙とトレイ
const pcx = PCX - (pull ? d : 0) * 0.5;
const pw = PW * (1 + k * 0.9), ph2 = PH * (1 - k * 0.12);
const pTop = PBOT - ph2;
const sheetFill = '#FFFFFF', sheetStroke = '#CBBDA6';
const lines = (x0, w, y0, n) => { for (let i = 0; i < n; i++) f.appendChild(el('line', { x1: x0 + 14, y1: y0 + 30 + i * 22, x2: x0 + w - 14 - (i % 2) * 24, y2: y0 + 30 + i * 22, stroke: '#D5C9B4', 'stroke-width': 5, 'stroke-linecap': 'round' })); };
const JAG = [0, 0.1, 0.22, 0.34, 0.47, 0.6, 0.72, 0.85, 1].map((u, i) => ({ y: u, x: i % 2 ? 9 : -9 }));
const TX = 'LAST SHEET';
const drawTray = (c) => {
c = c || f;
// 小さな台車（紙の置き台）
c.appendChild(el('rect', { x: PCX - 150, y: 1476, width: 300, height: 170, rx: 10, fill: '#A97E55', stroke: '#6B4E32', 'stroke-width': 6 }));
c.appendChild(el('line', { x1: PCX - 150, y1: 1560, x2: PCX + 150, y2: 1560, stroke: '#6B4E32', 'stroke-width': 5 }));
c.appendChild(el('rect', { x: PCX - 24, y: 1508, width: 48, height: 10, rx: 5, fill: '#6B4E32' }));
c.appendChild(el('rect', { x: PCX - 24, y: 1590, width: 48, height: 10, rx: 5, fill: '#6B4E32' }));
c.appendChild(el('rect', { x: PCX - 140, y: 1418, width: 280, height: 62, rx: 8, fill: '#8FA3B5', stroke: '#566878', 'stroke-width': 6 }));
c.appendChild(el('rect', { x: PCX - 120, y: 1430, width: 240, height: 38, rx: 6, fill: '#FFF3C4', stroke: '#566878', 'stroke-width': 4 }));
c.appendChild(el('text', { x: PCX, y: 1460, 'font-size': 30, 'font-weight': 900, 'text-anchor': 'middle', fill: '#C8463C', 'font-family': "'Noto Sans','Noto Sans CJK JP',sans-serif", 'letter-spacing': 2 }, [document.createTextNode(TX)]));
};
// 手の位置（紙の左端・右端）
let paperL = pcx - pw / 2, paperR = pcx + pw / 2;
const gripY = pTop + 150; // 紙の下の方を持つ（上のふちを持つと、腕が体から遠くまで伸びた）
// 肩（キャラの位置から）
const RSH = { x: Rq.x + 330, y: 1555 }, JSH = { x: Jq.x + 190, y: 1555 };

// 紙：割れ目が育つ
if (!torn) {
const crack = t >= 5.0 ? seg(t, 5.0, 6.3) : 0;
const x0 = pcx - pw / 2, wob = (t >= 3.7 ? 7 : 3) * Math.sin(t * 24) * (k > 0.2 ? 1 : 0.3);
const sag = k * 24;
f.appendChild(el('path', { d: `M${x0} ${pTop} Q${pcx} ${pTop + sag} ${x0 + pw} ${pTop} L${x0 + pw} ${PBOT} L${x0} ${PBOT} Z`, fill: sheetFill, stroke: sheetStroke, 'stroke-width': 5, transform: `rotate(${wob * 0.2} ${pcx} ${PBOT})` }));
lines(x0, pw, pTop + sag * 0.5, 5);
// しわ（引っ張られている線）
for (let i = 0; i < Math.round(k * 8); i++) f.appendChild(el('line', { x1: x0 + 8, y1: pTop + 20 + i * 24, x2: pcx - 6, y2: pTop + 34 + i * 24, stroke: '#E3D8C4', 'stroke-width': 2.5, opacity: 0.8 }));
if (crack > 0) {
let dd = `M${pcx} ${pTop + 2}`;
const n = Math.max(1, Math.floor(crack * 8));
for (let i = 1; i <= n; i++) dd += ` L${pcx + (i % 2 ? 9 : -9)} ${pTop + 2 + (ph2 - 2) * Math.min(1, i / 8 * crack * 1.05) * 0.6}`;
f.appendChild(el('path', { d: dd, fill: 'none', stroke: '#8A7A64', 'stroke-width': 4, 'stroke-linejoin': 'round' }));
}
}
drawTray();
// ぐぐっ：力んでいる線（段階が上がるほど長く・多く）
if (pull || (t >= 4.9 && t < 6.35)) {
const lv = t < 2.1 ? 0 : t < 3.7 ? 1 : 2;
if (lv > 0) for (const sd of [-1, 1]) for (let i = 0; i < 2 + lv; i++) {
const x = (sd < 0 ? paperL : paperR) + sd * (28 + i * 4), y = gripY - 60 + i * 28 + 6 * Math.sin(t * 30 + i), L = 22 + lv * 16;
f.appendChild(el('line', { x1: x, y1: y, x2: x + sd * L, y2: y + (i - 1.5) * 6, stroke: '#5A3A1E', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.8 }));
}
}

// 破れた半分（レンが左、ジルが右）。手に持って動く
const tearT = t - 6.35;
let halfL = null, halfR = null;
if (torn) {
const settleU = ease(seg(t, 6.35, 7.0));
let hl = { x: lerp(PCX - 20, 520, ease(seg(t, 6.35, 6.7))), y: lerp(1350, 1330, settleU), r: -14 + 10 * settleU };
let hr = { x: lerp(PCX + 20, 740, ease(seg(t, 6.35, 6.7))), y: lerp(1350, 1330, settleU), r: 14 - 10 * settleU };
// 提出：二人とも同じ方向（画面の上＝上司）へ高く掲げる
const up = ease(seg(t, 7.7, 8.3));
hl.x = lerp(hl.x, 560, up); hl.y = lerp(hl.y, 1250, up); hr.x = lerp(hr.x, 700, up); hr.y = lerp(hr.y, 1250, up); // 掲げる高さは手が届く所まで（腕が長く伸びないように）
halfL = hl; halfR = hr;
}
const half = (c, side, a, scale) => {
const kids = [];
const w = PW / 2 + 6, h = PH;
let dd = side < 0 ? `M${-w} ${-h / 2} L${w * 0.0} ${-h / 2}` : `M${w} ${-h / 2} L${w * 0.0} ${-h / 2}`;
JAG.forEach(p => { dd += ` L${0 + side * p.x * -1} ${-h / 2 + p.y * h}`; });
dd += side < 0 ? ` L${-w} ${h / 2} Z` : ` L${w} ${h / 2} Z`;
kids.push(el('path', { d: dd, fill: '#FFFFFF', stroke: sheetStroke, 'stroke-width': 5, 'stroke-linejoin': 'round' }));
for (let i = 0; i < 5; i++) kids.push(el('line', { x1: side < 0 ? -w + 14 : 16, y1: -h / 2 + 34 + i * 22, x2: side < 0 ? -16 : w - 14, y2: -h / 2 + 34 + i * 22, stroke: '#D5C9B4', 'stroke-width': 5, 'stroke-linecap': 'round' }));
c.appendChild(el('g', { transform: `translate(${a.x} ${a.y}) rotate(${a.r}) scale(${scale || 1})` }, kids));
};

// ---------- ポム（オチの後のオチ）
const pomIn = t >= 8.2;
const PX = PCX, PY = lerp(1560, 1442, ease(seg(t, 8.2, 8.75))), PS = 1.05;
const joinU = ease(seg(t, 8.9, 9.3));     // 半分がポムの手に集まる
const taped = t >= 9.6;
if (pomIn) {
// ポムはキャビネットの後ろから顔を出す

const q = { cheek: 0, eye: 'round', bow: 0, squash: 0, paws: t >= 8.8 && t < 10.1 ? 1 : 0, wob: 0, blush: 0.4, look: -0.3, mouth: 'w', sweat: 0 };
if (t >= 9.3 && t < 9.6) Object.assign(q, { eye: 'big', look: 0 });
if (t >= 9.6) Object.assign(q, { eye: 'happy', blush: 0.9, bow: goBack(t, 9.85, 10.05, 10.15, 10.35) });
f.appendChild(pomDefs());
f.appendChild(pomShape(PX + S.x, PY + S.y, PS, q));
drawTray();
}

// ---------- 手と腕（キャラの上に重ねる）
const ARMCOL = '#C7A077', ARMCOL2 = '#CFA174';
// 手の目標位置
const rest = (sh, dir) => ({ x: sh.x + dir * 20, y: sh.y + 80 });
let handR, handJ;
const reach = ease(seg(t, 0.0, 0.55));
const gR = { x: paperL + 6, y: gripY }, gJ = { x: paperR - 6, y: gripY };
handR = { x: lerp(rest(RSH, 1).x, gR.x, reach), y: lerp(rest(RSH, 1).y, gR.y, reach) };
handJ = { x: lerp(rest(JSH, -1).x, gJ.x, reach), y: lerp(rest(JSH, -1).y, gJ.y, reach) };
if (torn) {
const pr = ease(seg(t, 6.35, 6.7));
const hl2 = halfL, hr2 = halfR;
handR = { x: hl2.x + 20, y: hl2.y + 20 }; handJ = { x: hr2.x - 20, y: hr2.y + 20 };
if (t >= 8.9) { // ポムへ手渡し
const u = joinU;
handR = { x: lerp(handR.x, PCX - 46, u), y: lerp(handR.y, 1330, u) }; handJ = { x: lerp(handJ.x, PCX + 46, u), y: lerp(handJ.y, 1330, u) };
}
}
// 手渡し後は手を引っ込める
const retract = ease(seg(t, 9.3, 9.7));
if (t >= 9.3) { handR = { x: lerp(handR.x, rest(RSH, 1).x, retract), y: lerp(handR.y, rest(RSH, 1).y, retract) }; handJ = { x: lerp(handJ.x, rest(JSH, -1).x, retract), y: lerp(handJ.y, rest(JSH, -1).y, retract) }; }
// 最後：もう一度トレイへ手が伸びる（冒頭につながる）
const again = ease(seg(t, 10.45, 11.0));
if (t >= 10.45) { handR = { x: lerp(rest(RSH, 1).x, gR.x - 8, again), y: lerp(rest(RSH, 1).y, gripY, again) }; handJ = { x: lerp(rest(JSH, -1).x, gJ.x + 8, again), y: lerp(rest(JSH, -1).y, gripY, again) }; /* トレイの紙へ（机の上の高さまで腕を伸ばしていた） */ }
const showArms = true;
if (showArms) {
limb(f, 'ren', handR, { col: ARMCOL, bend: 10, max: 210 }); // 体のふちから短い腕（肩を体の下の方に固定していたので、長い腕が体の後ろから生えて見えた）
limb(f, 'jil', handJ, { col: ARMCOL2, bend: 10, max: 210 });
}

// 半分（腕より前に：手が紙のふちを握る）
const frontHalves = (c) => {
if (!torn) return;
if (t < 8.9 + 0.4) {
half(c, -1, halfL, 1);
half(c, 1, halfR, 1);
} else {
const u = joinU;
const a = { x: lerp(halfL.x, PCX - 46, u), y: lerp(halfL.y, 1330, u), r: lerp(halfL.r, -2, u) };
const b = { x: lerp(halfR.x, PCX + 46, u), y: lerp(halfR.y, 1330, u), r: lerp(halfR.r, 2, u) };
if (!taped) { half(c, -1, a, 1); half(c, 1, b, 1); }
}
};
if (torn) {
if (t < 9.6) frontHalves(f);
}
// テープで貼った1枚
if (taped) {
const rise = ease(seg(t, 9.6, 9.85));
const toTray = ease(seg(t, 10.1, 10.5));
const sx = PCX, sy = lerp(lerp(1330, 1150, rise), PBOT - PH / 2, toTray);
const g = el('g', { transform: `translate(${sx} ${sy}) rotate(${lerp(-2, 0, toTray)}) scale(${lerp(1.0, 1.0, toTray)})` });
const w = PW / 2 + 6, h = PH;
g.appendChild(el('rect', { x: -w - 2, y: -h / 2, width: (w + 2) * 2, height: h, fill: '#FFFFFF', stroke: sheetStroke, 'stroke-width': 5 }));
for (let i = 0; i < 5; i++) g.appendChild(el('line', { x1: -w + 14, y1: -h / 2 + 34 + i * 22, x2: w - 14 - (i % 2) * 20, y2: -h / 2 + 34 + i * 22, stroke: '#D5C9B4', 'stroke-width': 5, 'stroke-linecap': 'round' }));
g.appendChild(el('rect', { x: -15, y: -h / 2 - 6, width: 30, height: h + 12, fill: '#F6E7A8', opacity: 0.85, stroke: '#D9C26A', 'stroke-width': 2 }));
// 受理スタンプ（緑のチェック）
const st = pulse(t, 10.0, 10.6);
const sc = t >= 9.85 ? (t < 10.05 ? 1.8 - 0.8 * seg(t, 9.85, 10.05) : 1) : 0;
if (sc > 0 && toTray < 1) g.appendChild(el('g', { transform: `translate(0 -20) rotate(-12) scale(${sc})` }, [
el('circle', { r: 48, fill: 'none', stroke: '#3FA34D', 'stroke-width': 9 }),
el('path', { d: 'M-24 2 L-8 20 L26 -20', fill: 'none', stroke: '#3FA34D', 'stroke-width': 11, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })]));
// 最前面ではなく、トレイの前縁より後ろに入る位置まで下ろす
f.appendChild(g);
if (toTray >= 1) drawTray();
}
// 手が紙に重なるよう、掴んでいる間は手を紙の上へ（紙は背面なので腕の描画で十分）
// テープを貼るときの動き：ぴっ
if (t >= 9.2 && t < 9.6) {
const u = seg(t, 9.2, 9.6);
f.appendChild(el('rect', { x: PCX - 15, y: 1330 - PH / 2 - 6, width: 30, height: (PH + 12) * ease(u), fill: '#F6E7A8', opacity: 0.85, stroke: '#D9C26A', 'stroke-width': 2 }));
}
sparkle(f, t, 9.9, PCX, 1000, 1.1);
// 提出：画面の上（上司）へ向けた小さな矢印を出さず、手元のきらめきだけで示す
if (t >= 8.0 && t < 8.6) { notes(f, t, 7.95, PCX, 1000); }

thumpWave(f, t, 6.35, PCX, 1350);
const punch = impactAt(ui, t, 6.35);

const PAPER = { x: PCX, y: 1330 };
const shots = [
{ t: 0.0, cx: PCX, cy: 1310, z: 1.3, z2: 1.5 },      // A 寄り：「LAST SHEET」のトレイ、両側から手が伸びる（すぐ動く）
{ t: 2.1, cx: PCX, cy: 1320, z: 1.25 },              // B 中：体ごと
{ t: 3.7, cx: PCX, cy: 1320, z: 1.05 },              // C 引き：立ち上がって全力
{ t: 4.9, cx: 640, cy: 1360, z: 1.15, z2: 1.3 },     // D 二人：無音の間。ジルがレンを見て、ほんの少しゆるむ
{ t: 5.8, cx: PAPER.x, cy: PAPER.y, z: 2.5, z2: 2.8 },// E 寄り：紙の割れ目
{ t: 6.5, cx: PCX, cy: 1320, z: 1.1 },              // F 引き：ビリッ
{ t: 7.3, cx: PCX, cy: 1230, z: 1.15 },              // G 中：二人とも半分を掲げる
{ t: 8.4, cx: PCX, cy: 1280, z: 1.6 },               // H 寄り：ポムがテープでとめる
{ t: 10.2, cx: PCX, cy: 1320, z: 1.2 }               // I 中：トレイに戻る→また手が伸びる
];
// 画面の外の上司（影の手だけが降りてくる）：二人の半分を受け取ろうと待つ
{ const dn = 0 * ease(seg(t, 7.75, 8.25)) * (1 - ease(seg(t, 8.6, 8.95))); if (dn > 0) { /* 2026-11-10：天井から大きな影の腕が降りてくるのは「変なところから腕が生える」ので出さない */
const ty = -300 + 1010 * dn + 8 * Math.sin(t * 9) * dn;
ui.appendChild(el('g', { opacity: 0.5 }, [el('rect', { x: 430, y: ty - 800, width: 220, height: 800, rx: 90, fill: '#2B2118' }),
el('ellipse', { cx: 540, cy: ty, rx: 118, ry: 90, fill: '#2B2118' }),
el('ellipse', { cx: 440, cy: ty - 20, rx: 38, ry: 60, fill: '#2B2118', transform: `rotate(24 440 ${ty})` }),
el('ellipse', { cx: 500, cy: ty + 70, rx: 30, ry: 44, fill: '#2B2118' }), el('ellipse', { cx: 580, cy: ty + 70, rx: 30, ry: 44, fill: '#2B2118' })]));
} }
camera(cameraAt(shots, t), punch);
endcard(t, dur);
}
};

// ---------- ポム（キンクマハムスター）の SVG。pom_debut と同じ見た目 ----------
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
function pomShape(x, y, s, q) {
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
const mouth = q.mouth === 'o' ? E(0, hy + 30, 4, 5, '#B5615E') :
el('path', { d: `M0 ${hy + 24} V${hy + 28} M0 ${hy + 28} q-4 4 -8 2 M0 ${hy + 28} q4 4 8 2`, fill: 'none', stroke: '#9A5A50', 'stroke-width': 2, 'stroke-linecap': 'round' });
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
const sw = q.sweat ? [el('path', { d: `M58 ${hy - 46} q-9 14 0 20 q9 -6 0 -20 Z`, fill: '#CFE2F1', stroke: '#4E77A0', 'stroke-width': 2.5, opacity: q.sweat })] : [];
return el('g', { transform: `translate(${x} ${y}) scale(${s * sx} ${s * sy})` }, [...body, head, ...pw, ...sw]);
}
