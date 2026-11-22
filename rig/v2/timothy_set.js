// 連載「クリのお土産『金のチモシー』」（timothy1・2・3）のセットと小物（2026-11-21 オーナーの絵コンテ）
// オーナーの決まり：休憩室の背景・テーブル・お土産箱・金色の袋・浅い皿のデザインは全話で同じ → ここで1か所に決める。
//   部屋は休憩室のこたつと同じ BR.bg（札「休憩室」・窓・時計・棚）。こたつの代わりに、ふつうのテーブル。
// 使い方：document.write('<script src="v2/lib.js"><\/script><script src="v2/elevator_set.js"><\/script><script src="v2/breakroom_set.js"><\/script><script src="v2/timothy_set.js"><\/script>')
//   TM.table(o) … テーブル（天板と前の面・脚）。キャラの前（#fx）に描く
//   TM.box(x, y, o) … お土産箱（開いた箱・側面に「お土産」・中に金色の袋と浅い皿）。o.dish = 皿のチモシーの量 0〜1
//   TM.dish(x, y, a, s) … 浅い皿（a = 量 0〜1。0 は空、1 は山盛り）
//   TM.bag(x, y, s, o) … 金色の袋「金のチモシー」（o.biz で「業務用」の大袋）
(function () {
  const TM = {};
  // ---- 立ち位置（3話とも同じ）----
  TM.T = { cx: 540, top: 1150, half: 460, floor: 1650 };          // テーブル（天板の上の面の高さ top）
  TM.JIL = { x: 30, y: 716, s: 1.15, flip: true };                // ユズ：テーブルの左の奥（右向き）
  TM.REN = { x: 640, y: 670, s: 1.3, flip: false };               // モチ：テーブルの右の奥（左向き）
  TM.POM = { x: 742, y: TM.T.top + 6, s: 1.15 };                   // クリ：テーブルの上、箱の右（小さいハムスター）
  TM.BOX = { x: 450, y: TM.T.top + 4 };                           // お土産箱（底のまんなか）
  TM.DISH_IN = { x: TM.BOX.x - 44, y: TM.BOX.y - 82 };           // 箱の中の浅い皿（ふちの高さ。箱の左＝ユズの側）
  const C = { wood: '#A36A40', wood2: '#6E4428', woodTop: '#C08A5A', ink: '#3B2412', box: '#F4EADB', box2: '#E2D2BA', boxIn: '#B89C78', ribbon: '#C8263C', gold1: '#F7D774', gold2: '#D9A93A', gold3: '#A8781E', hay: '#A8B84E', hay2: '#8C9C3A', hay3: '#C7CF7A', dish: '#FFFDF8', dish2: '#D9E3EA' };
  const TXT = (x, y, s, txt, o = {}) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Noto Sans CJK JP, sans-serif" font-weight="900" font-size="${s}" fill="${o.fill || C.ink}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 6}" paint-order="stroke" stroke-linejoin="round"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${txt}</text>`;
  // ---- テーブル ----
  TM.table = (o = {}) => {
    const T = TM.T, x0 = T.cx - T.half, x1 = T.cx + T.half;
    return `<g data-nb="1"><ellipse cx="${T.cx}" cy="${T.floor + 4}" rx="${T.half + 40}" ry="26" fill="${C.ink}" opacity=".16"/>`
      // テーブルクロス（前の面を床近くまでおおう。奥に座るモチとユズの体がテーブルの下から見えないように）
      + `<path d="M${x0 - 4} ${T.top + 6} H${x1 + 4} L${x1 + 14} ${T.floor - 70} Q${T.cx} ${T.floor - 52} ${x0 - 14} ${T.floor - 70} Z" fill="#F6EFE2"/>`
      + `<path d="M${x0 - 4} ${T.top + 6} H${x1 + 4} L${x1 + 8} ${T.top + 150} H${x0 - 8} Z" fill="#E7D9C2" opacity=".5"/>`
      + Array.from({ length: 9 }, (_, i) => `<path d="M${x0 + 40 + i * 84} ${T.top + 40} q-4 ${(T.floor - T.top) * .5} 4 ${T.floor - T.top - 120}" stroke="#E2D2B8" stroke-width="5" fill="none" opacity=".8"/>`).join('')
      + `<path d="M${x0 - 14} ${T.floor - 70} Q${T.cx} ${T.floor - 52} ${x1 + 14} ${T.floor - 70}" stroke="#C9A57E" stroke-width="8" fill="none"/>`
      + `<path d="M${x0 - 10} ${T.floor - 92} Q${T.cx} ${T.floor - 74} ${x1 + 10} ${T.floor - 92}" stroke="#7FA36E" stroke-width="6" fill="none" opacity=".7"/>`
      + `<rect x="${x0 - 6}" y="${T.top - 10}" width="${T.half * 2 + 12}" height="28" rx="12" fill="${C.woodTop}"/><rect x="${x0 - 6}" y="${T.top - 10}" width="${T.half * 2 + 12}" height="8" rx="4" fill="#fff" opacity=".25"/>`
      + `<rect x="${x0 - 6}" y="${T.top + 14}" width="${T.half * 2 + 12}" height="10" rx="4" fill="${C.wood2}" opacity=".35"/></g>`;
  };
  // ---- チモシー（細い草の束）。a = 量 0〜1。山の底のまんなか (x, y)、幅 w ----
  const hash = i => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  TM.hay = (x, y, a, w = 170, o = {}) => {
    if (a <= 0.001 && !o.n2) return '';
    const n = a <= 0.001 ? 0 : Math.max(1, Math.round((o.n || 30) * a)), h = 78 * Math.pow(a, .75);
    let s = '';
    for (let i = 0; i < n; i++) {
      const u = hash(i + 1), v = hash(i + 50), k = (u - .5) * 2;                 // 山の中の位置（-1〜1）
      const top = Math.max(0, 1 - k * k) * h * (.55 + .45 * v);                    // 山の形（まんなかが高い）
      const cx = x + k * w * .42, cy = y - top * .8 - 4, len = 70 + 50 * hash(i + 90), rot = -40 + 80 * hash(i + 130);
      const col = [C.hay, C.hay2, C.hay3][i % 3];
      s += `<path d="M${(cx - len / 2).toFixed(1)} ${cy.toFixed(1)} q${(len * .5).toFixed(1)} ${(-10 - 8 * v).toFixed(1)} ${len.toFixed(1)} ${(4 * k).toFixed(1)}" transform="rotate(${(rot * .35).toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})" stroke="${col}" stroke-width="${(6 + 2 * v).toFixed(1)}" fill="none" stroke-linecap="round"/>`;
    }
    if (o.n2) for (let j = 0; j < o.n2; j++) s += `<path d="M${x - 62 + j * 44} ${y - 10 - j * 6} q${36 - j * 8} ${-16 + j * 4} ${84 - j * 10} ${-6 + j * 10}" stroke="${j ? C.hay2 : C.hay}" stroke-width="8" fill="none" stroke-linecap="round"/>`;   // 1〜2本だけ残る
    return `<g>${s}</g>`;
  };
  // ---- 浅い皿（白い楕円の皿・青い線）。(x, y) は皿のふちのまんなか ----
  TM.dish = (x, y, a, s = 1, o = {}) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="16" rx="118" ry="20" fill="${C.ink}" opacity=".15"/>`
    + `<path d="M-112 0 Q-100 22 -60 24 H60 Q100 22 112 0 Z" fill="${C.dish2}"/><ellipse cx="0" cy="0" rx="114" ry="22" fill="${C.dish}"/><ellipse cx="0" cy="0" rx="114" ry="22" fill="none" stroke="#8FB0C8" stroke-width="4"/><ellipse cx="0" cy="2" rx="92" ry="15" fill="#EEF3F6"/>`
    + TM.hay(0, 6, a, 180, { n: 30, n2: o.left || 0 }) + `</g>`;
  // ---- 金色の袋「金のチモシー」。(x, y) は袋の底のまんなか。o.biz = 業務用 ----
  TM.bag = (x, y, s = 1, o = {}) => {
    const w = 170, h = 230, rot = o.rot || 0;
    const shine = `<path d="M${-w / 2 + 18} ${-h + 40} Q${-w / 2 + 10} ${-h / 2} ${-w / 2 + 22} -20" stroke="#FFF6C8" stroke-width="12" fill="none" stroke-linecap="round" opacity=".7"/>`;
    const label = `<rect x="${-w / 2 + 16}" y="${-h + 70}" width="${w - 32}" height="${o.biz ? 124 : 96}" rx="12" fill="#FFFDF2" stroke="${C.gold3}" stroke-width="4"/>`
      + TXT(0, -h + 108, 34, '金の') + TXT(0, -h + 148, 34, 'チモシー', { ls: -1 })
      + (o.biz ? `<rect x="${-w / 2 + 34}" y="${-h + 160}" width="${w - 68}" height="28" rx="6" fill="${C.ribbon}"/>` + TXT(0, -h + 183, 22, '業務用', { fill: '#FFFFFF', ls: 4 }) : '');
    const hayTop = Array.from({ length: 6 }, (_, i) => `<path d="M${-40 + i * 16} ${-h + 4} q${4 - i} -24 ${8 + i * 2} -40" stroke="${[C.hay, C.hay2, C.hay3][i % 3]}" stroke-width="6" fill="none" stroke-linecap="round"/>`).join('');
    return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><ellipse cx="0" cy="4" rx="${w / 2 + 10}" ry="12" fill="${C.ink}" opacity=".18"/>`
      + (o.open ? hayTop : '')
      + `<path d="M${-w / 2} 0 L${-w / 2 + 6} ${-h + 20} Q${-w / 2 + 10} ${-h} ${-w / 2 + 30} ${-h} H${w / 2 - 30} Q${w / 2 - 10} ${-h} ${w / 2 - 6} ${-h + 20} L${w / 2} 0 Z" fill="${C.gold2}"/>`
      + `<path d="M${-w / 2 + 14} -6 L${-w / 2 + 18} ${-h + 24} Q${-w / 2 + 22} ${-h + 8} ${-w / 2 + 38} ${-h + 8} H${w / 2 - 38} Q${w / 2 - 22} ${-h + 8} ${w / 2 - 18} ${-h + 24} L${w / 2 - 14} -6 Z" fill="${C.gold1}"/>`
      + `<path d="M${-w / 2 + 4} ${-h + 30} H${w / 2 - 4}" stroke="${C.gold3}" stroke-width="5" stroke-dasharray="6 6" opacity=".6"/>`
      + shine + label + `</g>`;
  };
  // ---- お土産箱（開いた箱）。(x, y) は箱の底のまんなか。o.dish = 中の浅い皿の量、o.bag = 金色の袋が入っている（第1話・第2話）----
  TM.box = (x, y, o = {}) => {
    const w = 280, h = 76, d = 30;   // 平たいお土産の箱（中の皿にのった山盛りのチモシーが、ふちの上に見える）   // 幅・高さ・奥行き（上から少し見える）
    const flaps = `<path d="M${-w / 2 + 30} ${-h - d} L${-w / 2 + 44} ${-h - d - 48} L${w / 2 - 44} ${-h - d - 48} L${w / 2 - 30} ${-h - d}Z" fill="${C.box}"/><path d="M${-w / 2 + 44} ${-h - d - 48} L${w / 2 - 44} ${-h - d - 48} L${w / 2 - 46} ${-h - d - 40} L${-w / 2 + 46} ${-h - d - 40}Z" fill="${C.ribbon}" opacity=".85"/>`;   // ふた（後ろに立てかけてある）
    const inner = `<path d="M${-w / 2} ${-h} L${-w / 2 + 30} ${-h - d} H${w / 2 - 30} L${w / 2} ${-h} Z" fill="${C.boxIn}"/>`;
    const bag = o.bag === false ? '' : TM.bag(78, -h + 10, .44, { rot: 8 });   // 袋は箱の右奥（上半分が見える）
    const dish = TM.dish(-44, -h - 6, o.dish == null ? 1 : o.dish, .72, { left: o.left || 0 });
    const front = `<rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" rx="6" fill="${C.box}"/><rect x="${-w / 2}" y="${-h}" width="${w}" height="14" fill="#fff" opacity=".35"/><rect x="${-w / 2}" y="-14" width="${w}" height="14" fill="${C.box2}"/>`
      + `<rect x="-14" y="${-h}" width="28" height="${h}" fill="${C.ribbon}" opacity=".9"/>`
      + `<rect x="-78" y="${-h + 12}" width="156" height="54" rx="9" fill="#FFFFFF" stroke="${C.ribbon}" stroke-width="5"/>` + TXT(0, -h + 54, 40, 'お土産', { ls: 4 });
    return `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="4" rx="${w / 2 + 20}" ry="14" fill="${C.ink}" opacity=".2"/>${flaps}${inner}${bag}${dish}${front}</g>`;
  };
  // ---- 紙袋（お土産を入れてきた茶色い紙袋）。(x, y) は持ち手のてっぺん（クリがくわえる所）。o.flat = たたんで置いた（中身を出したあと）----
  TM.paperBag = (x, y, s = 1, o = {}) => {
    if (o.flat) return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="4" rx="70" ry="9" fill="${C.ink}" opacity=".16"/><path d="M-62 0 L-54 -26 H54 L62 0Z" fill="#C79A63"/><path d="M-54 -26 H54 L48 -32 H-48Z" fill="#B38450"/><path d="M-30 -28 q30 -26 60 0" stroke="#8C603C" stroke-width="5" fill="none"/></g>`;
    const sw = o.swing || 0;
    return `<g transform="translate(${x} ${y}) rotate(${sw.toFixed(1)}) scale(${s})">`
      + `<path d="M-26 34 Q-24 -6 0 -2 Q24 -6 26 34" stroke="#8C603C" stroke-width="6" fill="none" stroke-linecap="round"/>`   // 持ち手（ひも）
      + `<path d="M-48 34 H48 L52 124 H-52Z" fill="#C79A63"/><path d="M-48 34 H48 L46 44 H-46Z" fill="#B38450"/><path d="M14 40 L18 120" stroke="#B38450" stroke-width="4" opacity=".6"/>`
      + `<rect x="-24" y="62" width="48" height="34" rx="6" fill="#FFF7E8" stroke="#C8263C" stroke-width="3"/><path d="M-10 79 h20 M0 69 v20" stroke="#C8263C" stroke-width="4"/>`   // 赤いリボンのシール
      + `<path d="M-46 118 H46" stroke="${C.ink}" stroke-width="3" opacity=".15"/></g>`;
  };
  // ---- 画面の小さなしるし ----
  TM.crunch = (x, y, k, s = 1) => k <= 0 || k >= 1 ? '' : `<g transform="translate(${x} ${y}) scale(${s * (.8 + .4 * k)})" opacity="${(1 - k).toFixed(2)}" stroke="#FFF7E8" stroke-width="7" stroke-linecap="round"><path d="M-40 -6 l-18 -10 M0 -24 v-20 M40 -6 l18 -10"/></g>`;
  window.TM = TM;
})();
