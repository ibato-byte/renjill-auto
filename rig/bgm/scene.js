// 作業用BGMの場面（横長）。1章＝60秒のつなぎ目のないループ。章ごとに時刻・空・2匹のようすが変わる（夕方→夜→深夜）。
// URL: scene.html?hour=17.5&ren=type&jil=type&look=0&weather=rain&seed=3
// すべての動きは「60秒でちょうど元に戻る」周期で作る（ループの継ぎ目が見えない）。
(function () {
  const Q = new URLSearchParams(location.search);
  const CFG = { hour: +(Q.get('hour') || 17.5), ren: Q.get('ren') || 'type', jil: Q.get('jil') || 'type', look: +(Q.get('look') || 0), weather: Q.get('weather') || 'rain', seed: +(Q.get('seed') || 1) };
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
  const WALLS = [['#F8F1E6', '#EADFCF'], ['#EEF3EC', '#DCE5D8'], ['#EEF1F7', '#DCE1EC'], ['#FBF0E4', '#F0DCC6']][CFG.look % 4];
  // まばたき：60秒の中の決まった時刻（キャラごと）
  const BLINKS = { ren: [3.1, 9.4, 14.2, 14.6, 21.7, 27.9, 33.3, 40.8, 46.1, 51.5, 56.9], jil: [1.7, 6.9, 12.8, 19.3, 24.4, 24.8, 31.6, 37.2, 43.9, 49.3, 54.2, 58.4] };
  const blink = (id, t) => { for (const b of BLINKS[id]) { const u = (t - b) / 0.16; if (u > 0 && u < 1) return 1 - Math.sin(Math.PI * u); } return 1; };

  function city(t) {
    let s = '';
    const B = [[0, 150, 90], [70, 230, 110], [170, 120, 80], [240, 280, 130], [360, 170, 100], [450, 240, 90], [530, 130, 120], [640, 210, 100], [730, 160, 110]];
    B.forEach(([x, h, bw], i) => {
      s += `<rect x="${x}" y="${470 - h}" width="${bw}" height="${h}" fill="${day > 0 ? mix('C9B7B0', 'C4D3DE', day) : mix('C9B7B0', '27335A', night)}"/>`;
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
  function background(t) {
    const g = [L.defs()];
    g.push(`<defs><linearGradient id="bwall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${WALLS[0]}"/><stop offset="1" stop-color="${WALLS[1]}"/></linearGradient>
      <linearGradient id="bsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SKY[0]}"/><stop offset="1" stop-color="${SKY[1]}"/></linearGradient>
      <clipPath id="bwin"><rect x="0" y="0" width="820" height="470" rx="8"/></clipPath></defs>`);
    g.push(`<rect width="${W}" height="${H}" fill="url(#bwall)"/>`);
    g.push(`<rect y="640" width="${W}" height="170" fill="${WALLS[1]}"/><rect y="632" width="${W}" height="10" fill="#FFFDF8" opacity=".8"/>`);
    // 大きな窓（街の景色）
    g.push(`<g transform="translate(240 110)"><rect x="-16" y="-16" width="852" height="502" rx="16" fill="${PAL.frame}"/><g clip-path="url(#bwin)"><rect width="820" height="470" fill="url(#bsky)"/>`
      + (night > 0.6 ? (CFG.weather === 'rain' ? '' : `<circle cx="650" cy="90" r="38" fill="#FFF3C4" opacity="${0.95 * night}"/>`) : CFG.weather === 'rain' ? '' : `<circle cx="${700 - 420 * day}" cy="${262 + 160 * night - 170 * day}" r="56" fill="${mix('FFD9A0', 'FFF6D8', day)}" opacity="${0.9 - night}"/>`)
      + (CFG.weather === 'rain' ? `<g fill="${day > 0 ? mix('E9DCD6', 'DDE5EC', day) : mix('E9DCD6', '3A4770', night)}" opacity=".9"><ellipse cx="${200 + 30 * w(t, 1)}" cy="70" rx="210" ry="46"/><ellipse cx="${560 + 24 * w(t, 1, 2)}" cy="120" rx="250" ry="52"/></g>` : `<g fill="#fff" opacity="${0.8 - 0.65 * night}"><ellipse cx="${190 + 26 * w(t, 1)}" cy="90" rx="110" ry="26"/><ellipse cx="${520 + 20 * w(t, 1, 2)}" cy="150" rx="90" ry="20"/></g>`)
      + (night > 0.5 && CFG.weather !== 'rain' ? Array.from({ length: 26 }, (_, i) => `<circle cx="${hash(i + 500) * 820}" cy="${hash(i + 600) * 250}" r="${1.5 + hash(i) * 1.8}" fill="#fff" opacity="${(0.4 + 0.5 * w(t, 2 + i % 4, i)) * night}"/>`).join('') : '')
      + city(t) + rain(t)
      + `</g><rect x="402" width="16" height="470" fill="${PAL.frame}"/><rect y="228" width="820" height="14" fill="${PAL.frame}"/><rect x="-30" y="476" width="880" height="26" rx="8" fill="#FFFDF8"/></g>`);
    // 時計（章の時刻。秒針だけ60秒で1周する）
    const hh = Math.floor(hr), mm = Math.round((hr - hh) * 60);
    g.push(L.clock(1225, 230, [hh, mm], 0.95) + `<g transform="translate(1225 230)"><path d="M0 12 L0 -58" stroke="#E86C5A" stroke-width="3" stroke-linecap="round" transform="rotate(${t / P * 360})"/></g>`);
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
    L.char('jil', jp, t, '', opt); L.char('ren', rp, t, '', opt);
    // 机と小物（手前）
    const lampOn = L.clamp((hr - 17.2) / 1.2, 0, 1);
    let f = `<rect y="${DESK}" width="${W}" height="${H - DESK}" fill="url(#v2desk)"/><rect y="${DESK - 6}" width="${W}" height="40" rx="10" fill="${PAL.woodTop}"/>`
      + [80, 700, 1320].map(x => `<rect x="${x}" y="${DESK + 96}" width="520" height="150" rx="14" fill="none" stroke="${PAL.wood2}" stroke-width="6" opacity=".45"/><rect x="${x + 220}" y="${DESK + 160}" width="80" height="16" rx="8" fill="#E9D2A8" opacity=".9"/>`).join('');
    const glowJ = CFG.jil === 'asleep' ? 0.05 : 0.16 + 0.22 * night + 0.03 * w(t, 30), glowR = CFG.ren === 'asleep' ? 0.05 : 0.16 + 0.22 * night + 0.03 * w(t, 26, 1);
    f += laptopBack(640, DESK + 4, 0.74, glowJ) + laptopBack(1262, DESK + 4, 0.78, glowR);
    f += L.papers(880, DESK + 2, 4 + CFG.seed % 5, { mess: 8 }) + mug(1012, DESK + 2, t) + hayBowl(1560, DESK + 2) + lamp(1760, DESK + 2, lampOn);
    if (rp._eat) f += L.hayStrand(1196, DESK - 206 + 4 * Math.sin(rp._eat * 9), 120, -8) + L.munch(1256, DESK - 214, rp._eat, 1.25);
    document.getElementById('front').innerHTML = f;
    // 光：夜は部屋全体を青く沈め（乗算＝色がにごらない）、ランプのまわりだけあたたかく残す
    const dark = 0.8 * night + 0.14 * late;
    const shade = mix('FFFFFF', '475285', dark), near = mix('FFFFFF', 'FFE9C4', 0.5 * night);
    document.getElementById('light').innerHTML = `<defs><radialGradient id="lg" gradientUnits="userSpaceOnUse" cx="1760" cy="${DESK - 170}" r="1250"><stop offset="0" stop-color="${near}"/><stop offset=".34" stop-color="${mix(near.slice(1), shade.slice(1), 0.55)}"/><stop offset="1" stop-color="${shade}"/></radialGradient>
      <radialGradient id="vg" cx="50%" cy="46%" r="78%"><stop offset=".6" stop-color="#FFFFFF"/><stop offset="1" stop-color="#C9B8A8"/></radialGradient></defs>
      <rect width="${W}" height="${H}" fill="${mix('FFFFFF', 'FFD9B0', 0.5 * (1 - night) * (1 - day))}"/><rect width="${W}" height="${H}" fill="url(#lg)" style="mix-blend-mode:multiply"/><rect width="${W}" height="${H}" fill="url(#vg)" style="mix-blend-mode:multiply"/>`;
  };
  setT(0);
})();
