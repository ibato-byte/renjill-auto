// 作業用BGMの場面（横長）。1章＝60秒のつなぎ目のないループ。章ごとに時刻・空・2匹のようすが変わる（夕方→夜→深夜）。
// URL: scene.html?hour=17.5&ren=type&jil=type&look=0&weather=rain&seed=3
// すべての動きは「60秒でちょうど元に戻る」周期で作る（ループの継ぎ目が見えない）。
(function () {
  const Q = new URLSearchParams(location.search);
  const CFG = { hour: +(Q.get('hour') || 17.5), ren: Q.get('ren') || 'type', jil: Q.get('jil') || 'type', look: +(Q.get('look') || 0), weather: Q.get('weather') || 'rain', seed: +(Q.get('seed') || 1), style: Q.get('style') || 'lofi', month: +(Q.get('month') || 11), view: Q.get('view') || '' };
  const ST = CFG.style;   // 曲調に合わせて、窓の外・小物・衣装・動きを変える：lofi / sea（海）/ wa（和）/ club（あげあげ）/ ballad（しっとり）
  // 窓の景色（view）は曲調と別に決められる：city（街）/ sea（海）/ garden（和の庭）/ neon（ネオンの街）/ stars（星空）/ hills（田園）/ mountain（山の湖）。指定がなければ曲調から決まる。
  // 同じ「景色 × 時間帯 × 天気」は二度と出さない（auto/bgm_themes.py。オーナー指示 2026-11-14「曲も映像も完全な新作だけ」）
  const VIEW = CFG.view || (ST === 'sea' ? 'sea' : ST === 'wa' ? 'garden' : ST === 'club' ? 'neon' : ST === 'ballad' ? 'stars' : 'city');
  const SNOW = CFG.weather === 'snow', WET = CFG.weather === 'rain' || SNOW;   // WET＝くもり空（太陽・月・星を出さない）
  const P = 60, W = 1920, H = 1080, DESK = 800;
  const L = window.L, PAL = L.PAL, TAU = Math.PI * 2;
  const w = (t, k, ph = 0) => Math.sin(TAU * k * t / P + ph);            // 60秒に k 回の波（必ず周期が合う）
  const hash = n => { const x = Math.sin(n * 127.1 + CFG.seed * 311.7) * 43758.5453; return x - Math.floor(x); };
  const seg = L.seg, ease = L.ease, lerp = L.lerp;
  const mix = (a, b, k) => { const pa = a.match(/\w\w/g).map(h => parseInt(h, 16)), pb = b.match(/\w\w/g).map(h => parseInt(h, 16)); return '#' + pa.map((v, i) => Math.round(lerp(v, pb[i], k)).toString(16).padStart(2, '0')).join(''); };
  // 時刻 → 空と部屋の明るさ（17時=夕方、19時=青い夕暮れ、21時以降=夜）
  const hr = CFG.hour;
  const night = L.clamp((hr - 17.5) / 2.5, 0, 1);                        // 0=夕方 1=夜
  const late = L.clamp((hr - 21) / 2.5, 0, 1);                           // 深夜（部屋の明かりを落とす）
  const day = L.clamp((16.8 - hr) / 1.6, 0, 1);                          // 1=昼（青空） 0=夕方以降
  const SKY = day > 0 ? [mix('F6B08A', 'A9D4F2', day), mix('FBE3C0', 'E6F3FB', day)] : [mix('F6B08A', '2B3A63', night), mix('FBE3C0', '4A5A88', night)];
  const WALLS = ST === 'sea' ? [['#F1F8F8', '#D9ECEC'], ['#F8F4E8', '#E9E0C8']][CFG.look % 2] : ST === 'wa' ? [['#F3EBDA', '#E2D5BC'], ['#EFE9DD', '#DDD3C0']][CFG.look % 2] : ST === 'club' ? [['#E9E4F3', '#CFC8E2'], ['#E4E9F3', '#C8D0E2']][CFG.look % 2]
    : [['#F8F1E6', '#EADFCF'], ['#EEF3EC', '#DCE5D8'], ['#EEF1F7', '#DCE1EC'], ['#FBF0E4', '#F0DCC6']][CFG.look % 4];
  // まばたき：60秒の中の決まった時刻（キャラごと）
  const BLINKS = { ren: [3.1, 9.4, 14.2, 14.6, 21.7, 27.9, 33.3, 40.8, 46.1, 51.5, 56.9], jil: [1.7, 6.9, 12.8, 19.3, 24.4, 24.8, 31.6, 37.2, 43.9, 49.3, 54.2, 58.4] };
  const blink = (id, t) => { for (const b of BLINKS[id]) { const u = (t - b) / 0.16; if (u > 0 && u < 1) return 1 - Math.sin(Math.PI * u); } return 1; };

  function city(t) {
    let s = '';
    const B = [[0, 150, 90], [70, 230, 110], [170, 120, 80], [240, 280, 130], [360, 170, 100], [450, 240, 90], [530, 130, 120], [640, 210, 100], [730, 160, 110]];
    B.forEach(([x, h, bw], i) => {
      s += `<rect x="${x}" y="${470 - h}" width="${bw}" height="${h}" fill="${day > 0 ? mix('C9B7B0', 'C4D3DE', day) : mix('C9B7B0', '27335A', night)}"/>` + (SNOW ? `<rect x="${x - 3}" y="${470 - h - 7}" width="${bw + 6}" height="12" rx="6" fill="${mix('FFFFFF', 'A9B6D6', night)}"/>` : '');
      for (let r = 0; r < Math.floor(h / 34); r++) for (let c = 0; c < Math.floor(bw / 30); c++) {
        const id = i * 97 + r * 13 + c; if (hash(id) < 0.45) continue;
        const on = hash(id + 5) < 0.25 + 0.6 * night - 0.35 * late; if (!on) continue;
        const tw = 0.75 + 0.25 * w(t, 1 + Math.floor(hash(id + 9) * 4), hash(id) * 6);      // ゆっくりまたたく
        s += `<rect x="${x + 9 + c * 30}" y="${470 - h + 12 + r * 34}" width="13" height="16" rx="2" fill="#FFE2A0" opacity="${(0.25 + 0.7 * night) * tw}"/>`;
      }
    });
    return s;
  }
  function rain(t) {
    if (CFG.weather !== 'rain') return '';
    let s = '<g stroke="#DCEBFA" stroke-linecap="round">';
    for (let i = 0; i < 70; i++) {
      const sp = 3 + Math.floor(hash(i) * 4);                              // 60秒に sp*20 回落ちる（周期が合う）
      const u = (t * sp * 20 / P + hash(i + 40)) % 1, x = hash(i + 80) * 840 - 10, y = u * 520 - 30;
      s += `<path d="M${x} ${y} l-5 26" stroke-width="${1.6 + hash(i + 3) * 1.4}" opacity="${0.25 + 0.3 * hash(i + 7)}"/>`;
    }
    s += '</g>';
    for (let i = 0; i < 9; i++) {                                           // 窓ガラスを伝うしずく
      const u = (t * (1 + (i % 3)) / P + hash(i + 200)) % 1, x = 40 + hash(i + 300) * 740;
      s += `<path d="M${x} ${u * 500 - 20} q${4 * Math.sin(u * 20 + i)} 14 0 30" stroke="#F2F8FF" stroke-width="5" fill="none" stroke-linecap="round" opacity="${0.5 * Math.sin(Math.PI * u)}"/>`;
    }
    return s;
  }
  // ---- 窓の外（曲調ごと）----
  function sea(t) {
    const top = mix('4FA9D8', '1F3A66', night), deep = mix('2E86C1', '14294D', night);
    let s = `<rect y="300" width="820" height="170" fill="#${top.slice(1)}"/><rect y="360" width="820" height="110" fill="${deep}" opacity=".55"/><rect y="298" width="820" height="4" fill="#fff" opacity="${0.5 - 0.3 * night}"/>`;
    const sx = night > 0.6 ? 650 : 700 - 420 * day;
    s += `<g opacity="${WET ? 0 : 0.5 - 0.2 * night}">${Array.from({ length: 7 }, (_, i) => `<rect x="${sx - 40 + 10 * w(t, 6, i)}" y="${310 + i * 22}" width="${80 + i * 10}" height="6" rx="3" fill="#FFF3C4" transform="translate(${-i * 5} 0)"/>`).join('')}</g>`;
    for (let i = 0; i < 16; i++) { const y = 318 + (i * 37) % 150, k = (t * (1 + i % 3) / P + hash(i + 900)) % 1;
      s += `<path d="M${-60 + k * 940} ${y} q14 -7 28 0 t28 0" stroke="#fff" stroke-width="${2 + (y - 300) / 60}" fill="none" stroke-linecap="round" opacity="${0.5 * Math.sin(Math.PI * k) * (1 - 0.5 * night)}"/>`; }
    const bx = -80 + (t / P) * 1000;                                       // ヨットが60秒で窓を横切る（出入りは窓の外＝つなぎ目が見えない）
    s += `<g transform="translate(${bx} ${296 + 3 * w(t, 12)}) rotate(${2 * w(t, 12, 1)})"><path d="M-26 0 L26 0 L18 12 L-18 12Z" fill="${mix('FFFFFF', '8FA3C4', night)}"/><path d="M0 -2 L0 -46 L24 -2Z" fill="${mix('FFFFFF', 'B8C6DE', night)}"/><path d="M-3 -2 L-3 -34 L-20 -2Z" fill="${mix('F2A65A', '8A7FA8', night)}"/></g>`;
    s += `<g transform="translate(790 -10)">${[[-150, 18], [-110, 44], [-60, 66], [-180, -6]].map(([r, l], i) => `<path d="M0 0 q-70 20 -150 ${l + 40}" stroke="${mix('4E9A5A', '1F3D3A', night)}" stroke-width="22" fill="none" stroke-linecap="round" transform="rotate(${-8 * i + 2.5 * w(t, 3 + i % 2, i)})"/>`).join('')}</g>`;
    return s;
  }
  function garden(t) {
    let s = `<path d="M0 470 L0 330 Q120 250 250 320 Q380 230 520 310 Q660 240 820 320 L820 470Z" fill="${mix('9DB8A0', '22304F', night)}"/><path d="M0 470 L0 380 Q200 330 420 372 Q640 330 820 366 L820 470Z" fill="${mix('7FA07E', '1A2742', night)}"/>`;
    s += `<g transform="translate(150 470)" fill="${mix('8E8A80', '2B3350', night)}"><rect x="-10" y="-70" width="20" height="70"/><path d="M-34 -70 L34 -70 L22 -92 L-22 -92Z"/><rect x="-18" y="-128" width="36" height="36" rx="4"/><rect x="-9" y="-120" width="18" height="20" fill="#FFD98A" opacity="${0.2 + 0.75 * night + 0.05 * w(t, 20)}"/><path d="M-36 -128 L36 -128 L0 -156Z"/></g>`;
    s += `<g stroke="${mix('5B4636', '171D33', night)}" stroke-width="12" fill="none" stroke-linecap="round"><path d="M820 70 Q700 90 620 60 M700 82 Q680 130 640 150"/></g>` + [[640, 52], [690, 70], [742, 62], [662, 126], [634, 150]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y + 1.5 * w(t, 4, i)}" rx="44" ry="16" fill="${mix('3F7D4E', '1B3540', night)}"/>`).join('');
    if (SNOW) s += `<path d="M0 470 L0 392 Q200 346 420 384 Q640 346 820 378 L820 470Z" fill="${mix('FFFFFF', '8E9CC0', night)}" opacity=".85"/><path d="M116 -158 L184 -158 L150 -184Z" transform="translate(0 470)" fill="${mix('FFFFFF', 'A9B6D6', night)}"/>`
      + [[640, 44], [690, 62], [742, 54], [662, 118]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="38" ry="9" fill="${mix('FFFFFF', 'A9B6D6', night)}"/>`).join('');
    const FALL = SNOW ? 0 : [9, 10, 11, 12].includes(CFG.month) ? 14 : [3, 4, 5].includes(CFG.month) ? -14 : 0;   // 秋はもみじ、春は花びら。冬・夏は何も舞わない
    for (let i = 0; i < Math.abs(FALL); i++) if (FALL < 0) { const sp = 1 + i % 2, u = (t * sp / P + hash(i + 40)) % 1, x = hash(i + 80) * 820 + 40 * Math.sin(u * 9 + i);
      s += `<ellipse transform="translate(${x} ${u * 520 - 30}) rotate(${u * 540 + i * 40})" rx="7" ry="4.5" fill="#F8C8D8" opacity="${0.9 - 0.4 * night}"/>`; } else {          // もみじが舞う
      const sp = 1 + i % 2, u = (t * sp / P + hash(i + 40)) % 1, x = hash(i + 80) * 820 + 40 * Math.sin(u * 9 + i), y = u * 520 - 30;
      s += `<path transform="translate(${x} ${y}) rotate(${u * 540 + i * 40}) scale(${0.8 + hash(i) * 0.6})" d="M0 -12 L3 -4 L11 -6 L6 1 L10 9 L2 6 L0 13 L-2 6 L-10 9 L-6 1 L-11 -6 L-3 -4Z" fill="${['#D9483B', '#E8873A', '#C8322B'][i % 3]}" opacity="${0.9 - 0.4 * night}"/>`; }
    return s;
  }
  function neon(t) {                                                       // 夜の街にネオン（色はゆっくり移り変わる。強い点滅はさせない）
    let s = city(t);
    [[90, 250, '#FF5FA2'], [270, 210, '#5FD0FF'], [470, 270, '#B48CFF'], [660, 240, '#FFD45E'], [760, 300, '#5FFFC0']].forEach(([x, y, c], i) => {
      const a = 0.55 + 0.35 * w(t, 6 + i, i);
      s += `<rect x="${x - 6}" y="${y - 6}" width="${62}" height="26" rx="8" fill="${c}" opacity="${a * 0.35}" filter="url(#v2soft)"/><rect x="${x}" y="${y}" width="50" height="14" rx="6" fill="none" stroke="${c}" stroke-width="4" opacity="${a}"/>`; });
    for (let i = 0; i < 3; i++) { const ang = 20 * w(t, 2 + i, i * 2); s += `<path d="M${150 + i * 260} 470 L${150 + i * 260 - 40} -40 L${150 + i * 260 + 40} -40Z" fill="${['#FF7AC0', '#7AD8FF', '#C8A8FF'][i]}" opacity=".10" transform="rotate(${ang} ${150 + i * 260} 470)"/>`; }
    return s;
  }
  function quiet(t) {                                                      // しっとり：星。冬（12〜2月）は雪、ほかの月はときどき流れ星
    let s = Array.from({ length: 40 }, (_, i) => `<circle cx="${hash(i + 500) * 820}" cy="${hash(i + 600) * 280}" r="${1.4 + hash(i) * 1.8}" fill="#fff" opacity="${(0.35 + 0.5 * w(t, 2 + i % 4, i)) * Math.max(0.3, night)}"/>`).join('') + city(t);
    if (!WET) { const u = ((t % 30) - 8) / 0.9; if (u > 0 && u < 1) s += `<path d="M${640 - u * 300} ${40 + u * 120} l60 -24" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity="${Math.sin(Math.PI * u)}"/>`; }
    return s;
  }
  function snow(t) {                                                       // 雪（天気が snow の回。どの景色にも降る）
    if (!SNOW) return '';
    let s = '';
    for (let i = 0; i < 60; i++) { const sp = 1 + i % 3, u = (t * sp / P + hash(i + 40)) % 1, x = hash(i + 80) * 820 + 18 * Math.sin(u * 12 + i);
      s += `<circle cx="${x}" cy="${u * 500 - 15}" r="${2 + hash(i + 3) * 2.6}" fill="#fff" opacity="${0.55 + 0.35 * hash(i + 7)}"/>`; }
    return s;
  }
  function hills(t) {                                                      // 田園：丘と畑、農家、小さな電車が60秒で窓を横切る
    const far = SNOW ? mix('EEF2F6', '6F7CA6', night) : mix('A9C7A0', '22304F', night), mid = SNOW ? mix('FFFFFF', '8A96BC', night) : mix('8DB57E', '1C2A46', night), near = SNOW ? mix('F6F8FB', '7C89B2', night) : mix('B9CC7A', '1A2742', night);
    let s = `<path d="M0 470 L0 300 Q140 236 300 290 Q470 220 640 286 Q740 250 820 280 L820 470Z" fill="${far}"/><path d="M0 470 L0 356 Q210 300 430 350 Q640 306 820 340 L820 470Z" fill="${mid}"/>`;
    [[90, 300, 1], [420, 262, .8], [585, 290, .9], [735, 268, .7]].forEach(([x, y, k], i) => { s += `<g transform="translate(${x} ${y}) scale(${k})"><rect x="-4" y="0" width="8" height="26" fill="${mix('7A5A40', '1A1F33', night)}"/><ellipse cy="${-10 + 1.2 * w(t, 3, i)}" rx="24" ry="28" fill="${SNOW ? mix('E6ECF2', '6A78A2', night) : mix('5E9A5E', '18303A', night)}"/></g>`; });
    s += `<g transform="translate(250 318)"><rect x="-34" y="-30" width="68" height="34" fill="${mix('F2E4CE', '34406A', night)}"/><path d="M-44 -30 L0 -62 L44 -30Z" fill="${SNOW ? mix('FFFFFF', 'A9B6D6', night) : mix('C8644A', '2A2F52', night)}"/><rect x="-22" y="-20" width="16" height="16" rx="2" fill="#FFD98A" opacity="${0.15 + 0.8 * night}"/><rect x="6" y="-20" width="14" height="24" fill="${mix('8C603C', '1F2540', night)}"/></g>`;
    s += `<path d="M0 470 L0 412 Q200 384 420 404 Q640 380 820 398 L820 470Z" fill="${near}"/>`;
    if (!SNOW) for (let i = 0; i < 9; i++) s += `<path d="M${-40 + i * 105} 470 Q${40 + i * 98} 430 ${90 + i * 92} 404" stroke="${mix('9DB862', '16223C', night)}" stroke-width="5" fill="none" opacity=".7"/>`;
    s += `<rect y="392" width="820" height="4" fill="${mix('8A7A6A', '2A3050', night)}"/>` + Array.from({ length: 28 }, (_, i) => `<rect x="${i * 30 + 6}" y="390" width="5" height="9" fill="${mix('7A6A5A', '232945', night)}"/>`).join('');
    const tx = -220 + (t / P) * 1280;                                      // 電車（出入りは窓の外＝つなぎ目が見えない）
    s += `<g transform="translate(${tx} ${364 + 0.8 * w(t, 40)})">` + [0, 74].map(o => `<rect x="${o}" y="0" width="70" height="28" rx="7" fill="${mix('F2A65A', '6A5F8E', night)}"/><rect x="${o}" y="18" width="70" height="6" fill="${mix('FFFDF8', '9AA6C8', night)}"/>` + [8, 30, 52].map(x => `<rect x="${o + x}" y="5" width="14" height="10" rx="2" fill="${night > 0.4 ? '#FFE2A0' : '#DDF0FA'}" opacity="${0.75 + 0.2 * night}"/>`).join('') + [14, 56].map(x => `<circle cx="${o + x}" cy="29" r="5" fill="${mix('5B4636', '171D33', night)}"/>`).join('')).join('') + `</g>`;
    return s;
  }
  function mountain(t) {                                                   // 山の湖：雪をかぶった山、松林、湖にうつる光、ボート
    const rock = mix('8C9BB5', '202B4E', night), rock2 = mix('A9B6CC', '2A3660', night), cap = mix('FFFFFF', 'B4C0DE', night), pine = SNOW ? mix('CFDAE2', '3A4A70', night) : mix('3F7D5E', '14263A', night);
    let s = `<path d="M-40 330 L150 96 L300 250 L400 150 L560 330Z" fill="${rock2}"/><path d="M260 330 L520 60 L700 240 L760 190 L880 330Z" fill="${rock}"/>`;
    s += `<path d="M150 96 L112 143 L138 136 L156 158 L176 138 L199 147Z" fill="${cap}"/><path d="M520 60 L470 112 L500 104 L522 132 L548 106 L578 118Z" fill="${cap}"/>` + (SNOW ? `<path d="M400 150 L372 178 L398 172 L420 190 L440 178Z" fill="${cap}"/><path d="M760 190 L738 212 L760 208 L782 222Z" fill="${cap}"/>` : '');
    for (let i = 0; i < 20; i++) { const x = i * 43 + hash(i + 700) * 20 - 10, hgt = 44 + hash(i + 720) * 34; s += `<path d="M${x} 336 L${x + 15} ${336 - hgt} L${x + 30} 336Z" fill="${pine}"/>`; }
    const lake = mix('6FA8C8', '16264C', night);
    s += `<rect y="332" width="820" height="138" fill="${lake}"/><rect y="332" width="820" height="46" fill="${rock}" opacity=".28"/><rect y="330" width="820" height="4" fill="${SNOW ? cap : mix('E6F3FB', '4A5A88', night)}" opacity=".7"/>`;
    for (let i = 0; i < 14; i++) { const y = 350 + (i * 29) % 112, k = (t * (1 + i % 2) / P + hash(i + 900)) % 1;
      s += `<path d="M${-60 + k * 940} ${y} h${30 + (i % 3) * 14}" stroke="#fff" stroke-width="${2 + (y - 340) / 70}" stroke-linecap="round" opacity="${0.38 * Math.sin(Math.PI * k) * (1 - 0.4 * night)}"/>`; }
    if (!WET) s += `<g opacity="${0.45 - 0.15 * night}">${Array.from({ length: 5 }, (_, i) => `<rect x="${(night > 0.6 ? 650 : 700 - 420 * day) - 26 + 8 * w(t, 6, i)}" y="${346 + i * 22}" width="${52 + i * 8}" height="5" rx="2.5" fill="#FFF3C4"/>`).join('')}</g>`;
    s += `<g transform="translate(${210 + 26 * w(t, 1)} ${420 + 2 * w(t, 10)}) rotate(${1.5 * w(t, 10, 1)})"><path d="M-34 0 L34 0 L24 12 L-24 12Z" fill="${mix('B5773E', '3A3558', night)}"/><rect x="-2" y="-16" width="4" height="16" fill="${mix('7A5A40', '2A2948', night)}"/><circle cx="0" cy="-20" r="6" fill="#FFD98A" opacity="${0.1 + 0.85 * night}"/></g>`;
    return s;
  }
  const BASE = { city, sea, garden, neon, stars: quiet, hills, mountain };
  const outside = t => (BASE[VIEW] || city)(t) + rain(t) + snow(t);
  function background(t) {
    const g = [L.defs()];
    g.push(`<defs><linearGradient id="bwall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${WALLS[0]}"/><stop offset="1" stop-color="${WALLS[1]}"/></linearGradient>
      <linearGradient id="bsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SKY[0]}"/><stop offset="1" stop-color="${SKY[1]}"/></linearGradient>
      <clipPath id="bwin"><rect x="0" y="0" width="820" height="470" rx="8"/></clipPath></defs>`);
    g.push(`<rect width="${W}" height="${H}" fill="url(#bwall)"/>`);
    g.push(`<rect y="640" width="${W}" height="170" fill="${WALLS[1]}"/><rect y="632" width="${W}" height="10" fill="#FFFDF8" opacity=".8"/>`);
    // 大きな窓（街の景色）
    g.push(`<g transform="translate(240 110)"><rect x="-16" y="-16" width="852" height="502" rx="16" fill="${PAL.frame}"/><g clip-path="url(#bwin)"><rect width="820" height="470" fill="url(#bsky)"/>`
      + (night > 0.6 ? (WET ? '' : `<circle cx="650" cy="90" r="38" fill="#FFF3C4" opacity="${0.95 * night}"/>`) : WET ? '' : `<circle cx="${700 - 420 * day}" cy="${262 + 160 * night - 170 * day}" r="56" fill="${mix('FFD9A0', 'FFF6D8', day)}" opacity="${0.9 - night}"/>`)
      + (WET ? `<g fill="${day > 0 ? mix('E9DCD6', 'DDE5EC', day) : mix('E9DCD6', '3A4770', night)}" opacity=".9"><ellipse cx="${200 + 30 * w(t, 1)}" cy="70" rx="210" ry="46"/><ellipse cx="${560 + 24 * w(t, 1, 2)}" cy="120" rx="250" ry="52"/></g>` : `<g fill="#fff" opacity="${0.8 - 0.65 * night}"><ellipse cx="${190 + 26 * w(t, 1)}" cy="90" rx="110" ry="26"/><ellipse cx="${520 + 20 * w(t, 1, 2)}" cy="150" rx="90" ry="20"/></g>`)
      + (night > 0.5 && !WET ? Array.from({ length: 26 }, (_, i) => `<circle cx="${hash(i + 500) * 820}" cy="${hash(i + 600) * 250}" r="${1.5 + hash(i) * 1.8}" fill="#fff" opacity="${(0.4 + 0.5 * w(t, 2 + i % 4, i)) * night}"/>`).join('') : '')
      + outside(t)
      + `</g>` + (ST === 'wa' ? [136, 273, 547, 684].map(x => `<rect x="${x}" width="6" height="470" fill="#B98A5E"/>`).join('') + [114, 342].map(y => `<rect y="${y}" width="820" height="6" fill="#B98A5E"/>`).join('') : '')
      + `<rect x="402" width="16" height="470" fill="${ST === 'wa' ? '#A9784E' : PAL.frame}"/><rect y="228" width="820" height="14" fill="${ST === 'wa' ? '#A9784E' : PAL.frame}"/><rect x="-30" y="476" width="880" height="26" rx="8" fill="${ST === 'wa' ? '#B98A5E' : '#FFFDF8'}"/></g>`);
    if (ST === 'club') g.push(`<g transform="translate(1225 0)"><rect x="-2" width="4" height="36" fill="#8A8FA0"/><circle cy="82" r="48" fill="#C9CFE0"/>${Array.from({ length: 28 }, (_, i) => { const a = i / 28 * TAU + t / P * TAU * 2, r = 12 + (i % 4) * 10; return `<rect x="${Math.cos(a) * r - 5}" y="${82 + Math.sin(a) * r * 0.9 - 5}" width="10" height="10" rx="2" fill="${['#FFFFFF', '#FFD0EA', '#CDEBFF', '#E6D8FF'][i % 4]}" opacity="${0.55 + 0.4 * w(t, 8 + i % 5, i)}"/>`; }).join('')}</g>`);
    // 時計（章の時刻。秒針だけ60秒で1周する）
    const hh = Math.floor(hr), mm = Math.round((hr - hh) * 60);
    const CY = ST === 'club' ? 300 : 230;
    g.push(L.clock(1225, CY, [hh, mm], ST === 'club' ? 0.8 : 0.95) + `<g transform="translate(1225 ${CY})"><path d="M0 12 L0 -58" stroke="#E86C5A" stroke-width="3" stroke-linecap="round" transform="rotate(${t / P * 360})"/></g>`);
    // 本棚（右）
    g.push(`<g transform="translate(1400 130)"><rect x="-12" y="-12" width="424" height="444" rx="12" fill="#B98A5E"/><rect width="400" height="420" rx="6" fill="#8C603C"/>`
      + [0, 1, 2].map(r => `<rect y="${r * 140 + 130}" width="400" height="12" fill="#B98A5E"/>` + Array.from({ length: 9 }, (_, i) => { const bw = 24 + (i * 13 + r * 7 + CFG.seed * 5) % 16, bh = 70 + (i * 17 + r * 11 + CFG.seed * 3) % 44, x0 = 12 + i * 43;
        return (i + r + CFG.seed) % 7 === 3 ? '' : `<rect x="${x0}" y="${r * 140 + 130 - bh}" width="${bw}" height="${bh}" rx="4" fill="${['#D9734E', '#5E8FB8', '#E8C25A', '#7DB87A', '#C98BB0', '#F2EEE6', '#6C8A9E'][(i + r * 2 + CFG.seed) % 7]}"/>`; }).join('')).join('')
      + `<g transform="translate(330 104)"><path d="M-26 26 L-20 -14 L20 -14 L26 26Z" fill="${PAL.pot}"/><ellipse cx="-14" cy="-40" rx="12" ry="30" fill="${PAL.leaf}" transform="rotate(${-18 + 2 * w(t, 3)} -14 -14)"/><ellipse cx="14" cy="-44" rx="12" ry="32" fill="${PAL.leaf2}" transform="rotate(${16 + 2 * w(t, 3, 1)} 14 -14)"/></g></g>`);
    // 観葉植物（左）：葉がゆっくりゆれる
    g.push(`<g transform="translate(120 800)"><path d="M-62 0 L-50 -124 L50 -124 L62 0Z" fill="${PAL.pot}"/><rect x="-58" y="-136" width="116" height="20" rx="7" fill="#DB8C66"/>`
      + [[-66, -290, -22], [0, -360, 0], [66, -300, 22], [-100, -220, -42], [100, -232, 42]].map(([lx, ly, r], i) => `<ellipse cx="${lx}" cy="${ly + 66}" rx="38" ry="90" fill="${i % 2 ? PAL.leaf2 : PAL.leaf}" transform="rotate(${r + 2.2 * w(t, 2 + i % 2, i)} ${lx * 0.3} -130)"/>`).join('') + '</g>');
    return g.join('');
  }

  // ノートパソコン（こちらに背を向けている。ふたに葉っぱのマーク）。画面の光が顔に当たる
  const laptopBack = (x, y, s, glow) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="-150" rx="250" ry="170" fill="#DCEBFF" opacity="${glow}" filter="url(#v2soft)"/>
    <path d="M-150 0 L150 0 L140 -190 Q140 -204 126 -204 L-126 -204 Q-140 -204 -140 -190Z" fill="#C9CFD8"/><path d="M-150 0 L150 0 L140 -190 Q140 -204 126 -204 L-126 -204 Q-140 -204 -140 -190Z" fill="#fff" opacity=".18"/>
    <g transform="translate(0 -104)"><ellipse cx="-9" cy="0" rx="13" ry="22" fill="#9FB3C8" transform="rotate(-24)"/><ellipse cx="9" cy="0" rx="13" ry="22" fill="#8CA2BA" transform="rotate(24)"/></g>
    <rect x="-170" y="0" width="340" height="14" rx="7" fill="#AEB6C2"/></g>`;
  const mug = (x, y, t) => `<g transform="translate(${x} ${y})"><rect x="-34" y="-74" width="68" height="74" rx="12" fill="#FFFDF8"/><path d="M34 -56 q30 0 30 22 t-30 22" fill="none" stroke="#FFFDF8" stroke-width="11"/><rect x="-34" y="-74" width="68" height="14" rx="7" fill="#EFE3D2"/><path d="M-14 -40 q14 -14 28 0 q-14 22 -28 0Z" fill="#E86C5A" opacity=".8"/>`
    + [0, 1, 2].map(i => { const u = (t * 6 / P + i / 3) % 1; return `<path d="M${-14 + i * 14 + 6 * Math.sin(u * 6 + i)} ${-84 - u * 90} q10 -14 0 -28 q-10 -14 0 -28" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity="${0.55 * Math.sin(Math.PI * u)}"/>`; }).join('') + '</g>';
  const lamp = (x, y, on) => `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="-150" rx="330" ry="260" fill="url(#v2light)" opacity="${0.75 * on}"/><rect x="-46" y="-12" width="92" height="14" rx="7" fill="#6C7A8A"/><rect x="-6" y="-170" width="12" height="160" fill="#6C7A8A"/><path d="M-70 -170 L70 -170 L44 -250 L-44 -250Z" fill="#F2C14E"/><path d="M-70 -170 L70 -170 L64 -188 L-64 -188Z" fill="#FFE9A8" opacity="${0.4 + 0.6 * on}"/></g>`;
  // 曲調ごとの小物
  const drink = (x, y, t) => `<g transform="translate(${x} ${y})"><path d="M-30 -96 L30 -96 L22 0 L-22 0Z" fill="#FFFFFF" opacity=".55"/><path d="M-27 -70 L27 -70 L22 0 L-22 0Z" fill="#F2A65A" opacity=".9"/><path d="M-30 -96 L30 -96" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M8 -96 L26 -150" stroke="#E86C5A" stroke-width="6" stroke-linecap="round"/><circle cx="-26" cy="-98" r="18" fill="#F7C948" stroke="#E8A33A" stroke-width="5"/><path d="M-26 -116 v36 M-44 -98 h36" stroke="#E8A33A" stroke-width="3"/></g>`;
  const starfish = (x, y) => `<path transform="translate(${x} ${y}) rotate(-12)" d="M0 -30 L8 -9 L30 -9 L12 5 L19 27 L0 14 L-19 27 L-12 5 L-30 -9 L-8 -9Z" fill="#F28B66" stroke="#D96B4A" stroke-width="4" stroke-linejoin="round"/>`;
  const yunomi = (x, y, t) => `<g transform="translate(${x} ${y})"><path d="M-30 -62 L30 -62 L24 0 L-24 0Z" fill="#6F8F7A"/><rect x="-30" y="-66" width="60" height="12" rx="6" fill="#86A690"/><path d="M-16 -30 q16 10 32 0" stroke="#F4EAD8" stroke-width="4" fill="none" opacity=".6"/>`
    + [0, 1].map(i => { const u = (t * 6 / P + i / 2) % 1; return `<path d="M${-8 + i * 16 + 6 * Math.sin(u * 6 + i)} ${-74 - u * 80} q10 -14 0 -28 q-10 -14 0 -28" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity="${0.5 * Math.sin(Math.PI * u)}"/>`; }).join('') + '</g>';
  const andon = (x, y, on, t) => `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="-120" rx="300" ry="250" fill="url(#v2light)" opacity="${(0.55 + 0.04 * w(t, 16)) * Math.max(0.35, on)}"/><rect x="-52" y="-8" width="104" height="12" rx="4" fill="#5B4636"/><path d="M-44 -8 L-38 -210 L38 -210 L44 -8Z" fill="#FFF1CF"/><path d="M-44 -8 L-38 -210 M0 -8 L0 -210 M44 -8 L38 -210 M-42 -76 L42 -76 M-40 -142 L40 -142" stroke="#5B4636" stroke-width="6" fill="none"/><rect x="-46" y="-222" width="92" height="14" rx="4" fill="#5B4636"/><ellipse cx="0" cy="-100" rx="26" ry="60" fill="#FFC96B" opacity="${0.45 + 0.1 * w(t, 16)}"/></g>`;
  const candle = (x, y, t) => { const fl = 1 + 0.12 * w(t, 22) + 0.06 * w(t, 37, 1); return `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="-140" rx="260" ry="210" fill="url(#v2light)" opacity="${0.5 + 0.06 * w(t, 22)}"/><ellipse cx="0" cy="-2" rx="46" ry="10" fill="#C9A87E"/><rect x="-20" y="-110" width="40" height="110" rx="8" fill="#FFF6E4"/><path d="M-20 -96 q10 12 14 -4" stroke="#F1E3C6" stroke-width="6" fill="none"/><rect x="-1.5" y="-122" width="3" height="14" fill="#5B4636"/><path d="M0 -122 q${-14 * fl} ${-20 * fl} 0 ${-46 * fl} q${14 * fl} ${26 * fl} 0 ${46 * fl}Z" fill="#FFB347"/><path d="M0 -124 q${-6 * fl} ${-10 * fl} 0 ${-24 * fl} q${6 * fl} ${14 * fl} 0 ${24 * fl}Z" fill="#FFF3C4"/></g>`; };
  const speaker = (x, y, t) => { const k = 1 + 0.07 * Math.max(0, w(t, 120)); return `<g transform="translate(${x} ${y})"><rect x="-58" y="-190" width="116" height="190" rx="14" fill="#2E3440"/><circle cx="0" cy="-64" r="${40 * k}" fill="#1E232C" stroke="#5E6678" stroke-width="6"/><circle cx="0" cy="-64" r="${14 * k}" fill="#5E6678"/><circle cx="0" cy="-148" r="${18 * k}" fill="#1E232C" stroke="#5E6678" stroke-width="5"/></g>`; };
  const neonLamp = (x, y, t) => { const c = [mix('FF5FA2', '5FD0FF', 0.5 + 0.5 * w(t, 5)), mix('FFB05F', 'FF5FA2', 0.5 + 0.5 * w(t, 5)), mix('5FFFC0', '5F9BFF', 0.5 + 0.5 * w(t, 5)), mix('FFD45E', 'FF7A9A', 0.5 + 0.5 * w(t, 5))][CFG.seed % 4]; return `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="-150" rx="300" ry="240" fill="${c}" opacity=".22" filter="url(#v2soft)"/><rect x="-40" y="-10" width="80" height="12" rx="6" fill="#2E3440"/><path d="M0 -10 L0 -60 M-40 -230 q40 -60 80 0 q-40 60 -80 0 M0 -170 L0 -60" stroke="${c}" stroke-width="12" fill="none" stroke-linecap="round"/></g>`; };
  // ---- 衣装・小物（頭といっしょに動く）。キャラの顔と体つきは変えず、付け足すだけ（ゲームや短尺と同じキャラに見えるように）
  const onHead = (q, cx, inner) => `<g transform="translate(${q.x} ${q.y}) scale(${q.scale}) ${q.flip ? 'scale(-1 1) translate(-400 0)' : ''}"><g transform="translate(0 ${q.headNod || 0}) rotate(${q.headTilt || 0} ${cx} 240)">${inner}</g></g>`;
  const onBody = (q, inner) => `<g transform="translate(${q.x} ${q.y}) scale(${q.scale}) ${q.flip ? 'scale(-1 1) translate(-400 0)' : ''}"><g transform="rotate(${q.bodyTilt || 0} 200 300)">${inner}</g></g>`;
  function renWear(q, t) {
    if (ST === 'club') return onHead(q, 180, `<path d="M84 196 Q84 62 180 62 Q276 62 276 196" stroke="#2E3440" stroke-width="16" fill="none" stroke-linecap="round"/><rect x="60" y="168" width="44" height="78" rx="20" fill="#E8473A"/><rect x="256" y="168" width="44" height="78" rx="20" fill="#E8473A"/><rect x="68" y="182" width="12" height="50" rx="6" fill="#fff" opacity=".35"/>`);
    if (ST === 'sea') return onHead(q, 180, `<ellipse cx="180" cy="122" rx="132" ry="26" fill="#EBCB8B" stroke="#C9A25E" stroke-width="5"/><path d="M112 120 Q112 44 180 44 Q248 44 248 120Z" fill="#F2D9A0" stroke="#C9A25E" stroke-width="5"/><path d="M113 104 Q180 122 247 104 L248 120 Q180 138 112 120Z" fill="#E8473A"/>`);
    if (ST === 'wa') return onHead(q, 180, `<path d="M104 150 Q180 124 256 150 L256 170 Q180 144 104 170Z" fill="#FFFFFF" stroke="#D9D2C4" stroke-width="3"/><circle cx="180" cy="148" r="9" fill="#C8322B"/><path d="M256 156 q30 4 40 34 M256 164 q22 12 22 44" stroke="#FFFFFF" stroke-width="12" fill="none" stroke-linecap="round"/>`);
    if (ST === 'ballad') return onBody(q, `<path d="M108 262 Q180 300 252 262 L250 290 Q180 326 110 290Z" fill="#C8443C"/><path d="M214 286 L246 280 L252 362 L224 366Z" fill="#B53A33"/><path d="M226 352 l-2 12 M236 350 l0 14 M246 350 l2 12" stroke="#B53A33" stroke-width="5" stroke-linecap="round"/>`);
    return '';
  }
  function jilWear(q, t) {
    if (ST === 'club') return onHead(q, 188, `<circle cx="148" cy="201" r="25" fill="#1E232C" opacity=".92"/><circle cx="228" cy="201" r="25" fill="#1E232C" opacity=".92"/><path d="M134 190 l12 -10 M214 190 l12 -10" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".55"/>`);
    if (ST === 'sea') return onHead(q, 188, `<g transform="translate(246 150)">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-17" rx="12" ry="17" fill="#F2668B" transform="rotate(${a})"/>`).join('')}<circle r="8" fill="#FFD45E"/></g>`);
    if (ST === 'wa') return onHead(q, 188, `<g transform="translate(128 152)">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-13" rx="9" ry="13" fill="#F6B6C8" transform="rotate(${a})"/>`).join('')}<circle r="6" fill="#F2D15E"/><path d="M-6 12 q-4 18 -2 34 M6 12 q4 16 4 30" stroke="#C8322B" stroke-width="3" fill="none" transform="rotate(${4 * w(t, 10)})"/><circle cx="-8" cy="48" r="5" fill="#C8322B"/><circle cx="10" cy="44" r="5" fill="#F2D15E"/></g>`);
    if (ST === 'ballad') return onBody(q, `<path d="M124 276 Q188 308 252 276 L250 300 Q188 332 126 300Z" fill="#3F6FA8"/><path d="M150 298 L178 304 L170 366 L144 360Z" fill="#35608F"/>`);
    return '';
  }
  const hayBowl = (x, y) => `<g transform="translate(${x} ${y})">${[-40, -22, -4, 14, 32, -30, 6, 24].map((dx, i) => `<path d="M${dx} -30 q${6 - i} -30 ${(i % 3 - 1) * 16} -${60 + (i * 11) % 30}" stroke="${i % 2 ? '#A8B84E' : '#BFC866'}" stroke-width="8" fill="none" stroke-linecap="round"/>`).join('')}<path d="M-70 -40 L70 -40 L52 0 L-52 0Z" fill="#E8C9A0"/><rect x="-74" y="-48" width="148" height="14" rx="7" fill="#F2DDBB"/></g>`;

  // ---------- 2匹のようす（60秒ループ）----------
  function renPose(t) {
    const base = { x: 1020, y: DESK + 4 - 413 * 1.42, scale: 1.42 };
    const breathe = 0.03 * w(t, 14), ears = 2.4 * w(t, 9, 1);
    let p;
    if (CFG.ren === 'asleep') {          // ぐっすり：机につっぷして、ゆっくり寝息
      p = Object.assign({}, RIG.POSES.loaf, RIG.FACES.sleepy, { headNod: 44 + 5 * w(t, 10), headTilt: -9, bodySquash: -0.42 + 0.06 * w(t, 10), zzz: 0.75 + 0.25 * w(t, 10), earL: 10, earR: -8 });
    } else if (CFG.ren === 'sleepy') {   // うとうと：ゆっくり頭が落ちて、はっと戻る（20秒に1回）
      const u = (t % 20) / 20, drop = u < 0.72 ? ease(u / 0.72) : u < 0.78 ? 1 - ease((u - 0.72) / 0.06) : 0, jolt = u >= 0.72 && u < 0.86;
      p = Object.assign({}, RIG.POSES.sit, RIG.FACES.neutral, { headNod: 34 * drop, headTilt: -8 * drop, eyeOpen: jolt ? 1.15 : 1 - 0.85 * drop, eyeShape: drop > 0.75 ? 'flat' : 'round', excl: 0, sweat: jolt ? 0.7 : 0, earL: 12 * drop, earR: -10 * drop, mouth: 'w', bodySquash: -0.12 * drop + breathe });
    } else if (CFG.ren === 'hay') {      // 牧草をもぐもぐ（30秒のうち10秒）。あとは画面を見る
      const u = t % 30, eat = u > 8 && u < 19;
      p = Object.assign({}, RIG.POSES.sit, eat ? RIG.FACES.smile : RIG.FACES.neutral, { headNod: eat ? 6 + 3 * Math.abs(Math.sin(u * 9)) : 2 * w(t, 6), eyeLook: eat ? 0 : 0.25 * w(t, 4), blush: eat ? 0.6 : 0, bodySquash: breathe });
      p._eat = eat ? u : 0;
    } else if (CFG.ren === 'dance') {    // ノリノリ：拍に合わせて体がはずむ・首をふる・耳がゆれる（1秒に2回＝120拍/分）
      const b = Math.abs(w(t, 60)), sway = w(t, 30);
      p = Object.assign({}, RIG.POSES.sit, RIG.FACES.smile, { headNod: 4 + 16 * b, headTilt: 9 * sway, bodyTilt: 4 * sway, bodySquash: -0.12 * b + 0.04, yOff: 0, blush: 0.5, earL: -16 * b + 6 * sway, earR: 16 * b + 6 * sway, sparkle: w(t, 6) > 0.7 ? 1 : 0 });
    } else if (CFG.ren === 'gaze') {     // 窓の外をぼんやり見る（しっとり）：ゆっくり首をかしげ、ときどき目を細める
      const k = 0.5 + 0.5 * w(t, 2);
      p = Object.assign({}, RIG.POSES.sit, RIG.FACES.neutral, { eyeLook: 0.85, headTilt: 5 + 4 * w(t, 3), headNod: 2 + 2 * w(t, 6), eyeOpen: 0.72 + 0.2 * k, mouth: 'w', bodySquash: breathe, earL: 6, earR: -5 });
    } else {                             // 仕事中：画面を目で追う。音楽に合わせてほんの少し首がゆれる
      p = Object.assign({}, RIG.POSES.sit, RIG.FACES.neutral, { headNod: 3 + 2.5 * w(t, 20), headTilt: 2.5 * w(t, 5), eyeLook: 0.35 * w(t, 7), bodySquash: breathe, mouth: w(t, 2) > 0.8 ? 'smile' : 'w' });
    }
    if (p.eyeShape !== 'flat' && p.eyeShape !== 'happy' && CFG.ren !== 'asleep') p.eyeOpen = (p.eyeOpen == null ? 1 : p.eyeOpen) * blink('ren', t);
    p.earL = (p.earL || 0) + ears; p.earR = (p.earR || 0) - ears * 0.8;
    return Object.assign(base, p, { flip: true });
  }
  function jilPose(t) {
    const base = { x: 360, y: DESK + 4 - 413 * 1.28, scale: 1.28 };
    const breathe = 0.03 * w(t, 15, 2), ears = 3 * w(t, 8, 2);
    let p;
    if (CFG.jil === 'asleep') {
      p = Object.assign({}, RIG.POSES.loaf, RIG.FACES.sleepy, { headNod: 40 + 5 * w(t, 9, 1), headTilt: 8, bodySquash: -0.4 + 0.06 * w(t, 9, 1), zzz: 0.7 + 0.25 * w(t, 9, 1), earL: 16, earR: -14 });
    } else if (CFG.jil === 'glance') {   // 仕事をしながら、ときどき課長のほうを見る（30秒に1回・あきれ顔）
      const u = t % 30, look = u > 12 && u < 17, k = look ? Math.sin(Math.PI * (u - 12) / 5) : 0;
      p = Object.assign({}, RIG.POSES.sit, RIG.FACES.sharp, { eyeShape: look && k > 0.3 ? 'half' : 'round', eyeLook: 0.3 * w(t, 8) * (1 - k) + 1.0 * k, headTilt: 10 * k + 2 * w(t, 6), headNod: 2 * w(t, 18), bodySquash: breathe, eyeOpen: 1 - 0.3 * k, sweat: look && k > 0.6 ? 0.6 : 0 });
    } else if (CFG.jil === 'dance') {    // 小さくノリノリ（ジルは控えめ）：拍で首がはずみ、耳がぴょこぴょこ
      const b = Math.abs(w(t, 60, 0.4)), sway = w(t, 30, 0.6);
      p = Object.assign({}, RIG.POSES.sit, RIG.FACES.smile, { headNod: 3 + 9 * b, headTilt: -6 * sway, bodyTilt: -2.5 * sway, bodySquash: -0.08 * b + breathe, blush: 0.6, earL: 10 * b, earR: -10 * b });
    } else if (CFG.jil === 'gaze') {     // 手を止めて、窓の外を見る
      p = Object.assign({}, RIG.POSES.sit, RIG.FACES.neutral, { eyeLook: -0.7, headTilt: -6 + 3 * w(t, 3, 1), headNod: 2 * w(t, 5), eyeOpen: 0.85, mouth: 'w', bodySquash: breathe });
    } else if (CFG.jil === 'happy') {    // のってきた：にこにこ、音に合わせて体がゆれる
      p = Object.assign({}, RIG.POSES.sit, RIG.FACES.smile, { headTilt: 5 * w(t, 10), headNod: 3 * w(t, 20), bodyTilt: 1.5 * w(t, 10), bodySquash: breathe, blush: 0.5 });
    } else {
      p = Object.assign({}, RIG.POSES.sit, RIG.FACES.sharp, { eyeLook: 0.35 * w(t, 9, 1), headNod: 2 + 2 * w(t, 24), headTilt: 2 * w(t, 4, 1), bodySquash: breathe });
    }
    if (p.eyeShape !== 'flat' && p.eyeShape !== 'happy' && CFG.jil !== 'asleep') p.eyeOpen = (p.eyeOpen == null ? 1 : p.eyeOpen) * blink('jil', t);
    const tw = hash(Math.floor(t / 5) + 3) > 0.6 ? 7 * Math.max(0, Math.sin(((t / 5) % 1) * Math.PI * 4)) * ((t / 5) % 1 < 0.5 ? 1 : 0) : 0;   // 耳のぴくっ
    p.earL = (p.earL || 0) + ears - tw; p.earR = (p.earR || 0) - ears * 0.8 + tw * 0.6;
    return Object.assign(base, p);
  }

  window.BGM = { P, CFG };
  window.setT = function (t) {
    t = ((t % P) + P) % P;
    document.getElementById('bg').innerHTML = background(t);
    const rp = renPose(t), jp = jilPose(t);
    const opt = { blink: false, breathe: false, ears: false, twitch: false, shadow: false };
    L.char('jil', jp, t, jilWear(jp, t), opt); L.char('ren', rp, t, renWear(rp, t), opt);
    // 机と小物（手前）
    const lampOn = L.clamp((hr - 17.2) / 1.2, 0, 1);
    let f = `<rect y="${DESK}" width="${W}" height="${H - DESK}" fill="url(#v2desk)"/><rect y="${DESK - 6}" width="${W}" height="40" rx="10" fill="${PAL.woodTop}"/>`
      + [80, 700, 1320].map(x => `<rect x="${x}" y="${DESK + 96}" width="520" height="150" rx="14" fill="none" stroke="${PAL.wood2}" stroke-width="6" opacity=".45"/><rect x="${x + 220}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8" opacity=".9"/>`).join('');
    const glowJ = CFG.jil === 'asleep' ? 0.05 : 0.16 + 0.22 * night + 0.03 * w(t, 30), glowR = CFG.ren === 'asleep' ? 0.05 : 0.16 + 0.22 * night + 0.03 * w(t, 26, 1);
    f += laptopBack(640, DESK + 4, 0.74, glowJ) + laptopBack(1262, DESK + 4, 0.78, glowR);
    f += (ST === 'club' ? speaker(900, DESK + 2, t) : L.papers(880, DESK + 2, 4 + CFG.seed % 5, { mess: 8 }) + (ST === 'sea' ? starfish(930, DESK - 78 - 14 * (CFG.seed % 5)) : ''))
      + (ST === 'sea' ? drink(1016, DESK + 2, t) : ST === 'wa' ? yunomi(1012, DESK + 2, t) : mug(1012, DESK + 2, t)) + hayBowl(1560, DESK + 2)
      + (ST === 'wa' ? andon(1760, DESK + 2, lampOn, t) : ST === 'ballad' ? candle(1760, DESK + 2, t) : ST === 'club' ? neonLamp(1760, DESK + 2, t) : lamp(1760, DESK + 2, lampOn));
    if (rp._eat) f += L.hayStrand(1196, DESK - 206 + 4 * Math.sin(rp._eat * 9), 120, -8) + L.munch(1256, DESK - 214, rp._eat, 1.25);
    document.getElementById('front').innerHTML = f;
    // 光：夜は部屋全体を青く沈め（乗算＝色がにごらない）、ランプのまわりだけあたたかく残す
    const dark = 0.8 * night + 0.14 * late;
    const CLUB = [['5A2A9A', '1F4F98', 'FF8AC8', '8AD8FF'], ['8A2A6A', '5A2A9A', 'FFB08A', 'FF8AC8'], ['1F6A78', '2A3F9A', '8AFFD0', '8AC0FF'], ['9A3A2A', '7A2A8A', 'FFD08A', 'FF9AB0']][CFG.seed % 4];   // 章ごとに照明の色を変える（ピンク×青 → 赤紫 → 青緑 → 夕焼け色）
    const tint = ST === 'club' ? mix(CLUB[0], CLUB[1], 0.5 + 0.5 * w(t, 4)).slice(1) : ST === 'ballad' ? '3A4478' : ST === 'wa' ? '5A4A6A' : '475285';
    const shade = mix('FFFFFF', tint, ST === 'club' ? 0.94 : dark), near = ST === 'club' ? mix('FFFFFF', mix(CLUB[2], CLUB[3], 0.5 + 0.5 * w(t, 5)).slice(1), 0.6) : mix('FFFFFF', 'FFE9C4', 0.5 * night);
    document.getElementById('light').innerHTML = `<defs><radialGradient id="lg" gradientUnits="userSpaceOnUse" cx="1760" cy="${DESK - 170}" r="1250"><stop offset="0" stop-color="${near}"/><stop offset=".34" stop-color="${mix(near.slice(1), shade.slice(1), 0.55)}"/><stop offset="1" stop-color="${shade}"/></radialGradient>
      <radialGradient id="vg" cx="50%" cy="46%" r="78%"><stop offset=".6" stop-color="#FFFFFF"/><stop offset="1" stop-color="#C9B8A8"/></radialGradient></defs>
      <rect width="${W}" height="${H}" fill="${mix('FFFFFF', 'FFD9B0', 0.5 * (1 - night) * (1 - day))}"/><rect width="${W}" height="${H}" fill="url(#lg)" style="mix-blend-mode:multiply"/><rect width="${W}" height="${H}" fill="url(#vg)" style="mix-blend-mode:multiply"/>`;
  };
  setT(0);
})();
