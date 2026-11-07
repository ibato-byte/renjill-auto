// レンとジル v2 描画ライブラリ（イラスト調・SVG）。依頼：絵の質を上げる（2026-11）
(function () {
  const L = {};
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => (k = clamp(k, 0, 1), k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const outBack = k => { k = clamp(k, 0, 1); const c = 1.70158; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  Object.assign(L, { clamp, lerp, ease, outBack, seg });

  L.defs = () => `<defs>
  <filter id="fur" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>
  <filter id="blur6"><feGaussianBlur stdDeviation="6"/></filter>
  <filter id="dof" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="3.2"/></filter>
  <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="10"/></filter>
  ${furGrad('renB', '#F7E3C6', '#E2B98A', '#B98A5C')}
  ${furGrad('renE', '#E9C49A', '#C9935F', '#94673F')}
  ${furGrad('jilB', '#F5CF9E', '#E09A55', '#B36A30')}
  ${furGrad('jilE', '#EDB27A', '#D2843F', '#9E5A25')}
  <radialGradient id="belly" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#FFF8EE"/><stop offset="1" stop-color="#F3DFC4"/></radialGradient>
  <radialGradient id="eye" cx="45%" cy="38%" r="65%"><stop offset="0" stop-color="#5A3A26"/><stop offset=".55" stop-color="#2A1A12"/><stop offset="1" stop-color="#120A06"/></radialGradient>
  <radialGradient id="blush" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FF8F8F" stop-opacity=".75"/><stop offset="1" stop-color="#FF8F8F" stop-opacity="0"/></radialGradient>
  <radialGradient id="earIn" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#FFC9C2"/><stop offset="1" stop-color="#E9A59A"/></radialGradient>
  <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBF1E2"/><stop offset="1" stop-color="#EBDCC6"/></linearGradient>
  <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C79A6E"/><stop offset="1" stop-color="#9C7049"/></linearGradient>
  <linearGradient id="desk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E7C08F"/><stop offset=".12" stop-color="#D4A671"/><stop offset="1" stop-color="#B98756"/></linearGradient>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FD0F2"/><stop offset="1" stop-color="#DDF0FB"/></linearGradient>
  <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2A272"/><stop offset=".6" stop-color="#F7CF94"/><stop offset="1" stop-color="#FBE6B8"/></linearGradient>
  <linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1D2B52"/><stop offset="1" stop-color="#3E4D7A"/></linearGradient>
  <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EAF4FF"/><stop offset="1" stop-color="#CFE2F7"/></linearGradient>
  <radialGradient id="light" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF6DA" stop-opacity=".9"/><stop offset="1" stop-color="#FFF6DA" stop-opacity="0"/></radialGradient>
  <radialGradient id="vig" cx="50%" cy="48%" r="75%"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#2B1A0C" stop-opacity=".38"/></radialGradient>
  </defs>`;
  function furGrad(id, a, b, c) {
    return `<radialGradient id="${id}" cx="42%" cy="32%" r="75%"><stop offset="0" stop-color="${a}"/><stop offset=".6" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient>`;
  }

  function eyes(e, cx, cy, gap, r, look = [0, 0], blink = 0) {
    const out = [];
    for (const sx of [-1, 1]) {
      const x = cx + sx * gap, y = cy;
      let k = e;
      if (blink > 0.5 && (e === 'open' || e === 'wide' || e === 'side')) k = 'closed';
      if (k === 'closed') out.push(`<path d="M${x - r * .8} ${y} Q${x} ${y + r * .55} ${x + r * .8} ${y}" fill="none" stroke="#2A1A12" stroke-width="${r * .22}" stroke-linecap="round"/>`);
      else if (k === 'happy') out.push(`<path d="M${x - r * .8} ${y + r * .2} Q${x} ${y - r * .7} ${x + r * .8} ${y + r * .2}" fill="none" stroke="#2A1A12" stroke-width="${r * .24}" stroke-linecap="round"/>`);
      else if (k === 'dead') out.push(`<path d="M${x - r * .55} ${y - r * .55} L${x + r * .55} ${y + r * .55} M${x + r * .55} ${y - r * .55} L${x - r * .55} ${y + r * .55}" stroke="#2A1A12" stroke-width="${r * .22}" stroke-linecap="round"/>`);
      else if (k === 'tiny') out.push(`<circle cx="${x + look[0] * r * .3}" cy="${y + look[1] * r * .3}" r="${r * .26}" fill="#1A0F08"/>`);
      else if (k === 'half') {
        out.push(`<ellipse cx="${x}" cy="${y + r * .1}" rx="${r * .9}" ry="${r * .62}" fill="url(#eye)"/>`);
        out.push(`<circle cx="${x - r * .28 + look[0] * r * .2}" cy="${y - r * .02}" r="${r * .2}" fill="#fff"/>`);
        out.push(`<path d="M${x - r * 1.05} ${y - r * .25} L${x + r * 1.05} ${y - r * .25}" stroke="#7A5233" stroke-width="${r * .28}" stroke-linecap="round"/>`);
      } else {
        const big = k === 'wide' ? 1.18 : 1, rx = r * .82 * big, ry = r * big;
        const lx = look[0] * r * .25, ly = look[1] * r * .25;
        out.push(`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#eye)"/>`);
        if (k === 'wide') out.push(`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="none" stroke="#fff" stroke-width="${r * .12}" opacity=".9"/>`);
        out.push(`<ellipse cx="${x - rx * .32 + lx}" cy="${y - ry * .38 + ly}" rx="${r * .3}" ry="${r * .34}" fill="#fff"/>`);
        out.push(`<circle cx="${x + rx * .3 + lx}" cy="${y + ry * .36 + ly}" r="${r * .13}" fill="#fff" opacity=".85"/>`);
      }
    }
    return out.join('');
  }
  // 鼻の色は rig/qa.js の顔検出（NOSE）と同じにする：レン #C88D85 / ジル #D98F8E
  function mouth(m, x, y, w, nc = '#E98A8A') {
    const sw = w * .1;
    const nose = `<path d="M${x - w * .16} ${y - w * .3} Q${x} ${y - w * .42} ${x + w * .16} ${y - w * .3} Q${x} ${y - w * .12} ${x - w * .16} ${y - w * .3}Z" fill="${nc}"/>`;
    let p = '';
    if (m === 'smile' || m === 'cat') p = `<path d="M${x - w * .38} ${y - w * .06} Q${x - w * .19} ${y + w * .18} ${x} ${y - w * .06} Q${x + w * .19} ${y + w * .18} ${x + w * .38} ${y - w * .06}" fill="none" stroke="#5A3826" stroke-width="${sw}" stroke-linecap="round"/>`;
    else if (m === 'o') p = `<ellipse cx="${x}" cy="${y + w * .12}" rx="${w * .17}" ry="${w * .22}" fill="#6B2E2E"/><ellipse cx="${x}" cy="${y + w * .22}" rx="${w * .1}" ry="${w * .07}" fill="#E98A8A"/>`;
    else if (m === 'flat') p = `<path d="M${x - w * .22} ${y + w * .04} L${x + w * .22} ${y + w * .04}" stroke="#5A3826" stroke-width="${sw}" stroke-linecap="round"/>`;
    else if (m === 'frown') p = `<path d="M${x - w * .26} ${y + w * .14} Q${x} ${y - w * .06} ${x + w * .26} ${y + w * .14}" fill="none" stroke="#5A3826" stroke-width="${sw}" stroke-linecap="round"/>`;
    else if (m === 'wobble') p = `<path d="M${x - w * .34} ${y + w * .08} q${w * .085} -${w * .1} ${w * .17} 0 t${w * .17} 0 t${w * .17} 0 t${w * .17} 0" fill="none" stroke="#5A3826" stroke-width="${sw}" stroke-linecap="round"/>`;
    else if (m === 'grin' || m === 'open') p = `<path d="M${x - w * .32} ${y - w * .02} Q${x} ${y + w * .5} ${x + w * .32} ${y - w * .02} Z" fill="#6B2E2E"/><path d="M${x - w * .16} ${y + w * .22} Q${x} ${y + w * .1} ${x + w * .16} ${y + w * .22} Q${x} ${y + w * .34} ${x - w * .16} ${y + w * .22}Z" fill="#E98A8A"/>`;
    return nose + p;
  }

  // キャラ：足元中央が原点、s=1 で高さ約620。o: { x, y, s, flip, face:{eye,mouth,look,blink,brow}, ear, blush, sweat, gloom, squash, lean, tilt, armL, armR, item, tail, shake, t }
  L.bunny = function (who, o = {}) {
    const ren = who === 'ren';
    const B = ren ? 'renB' : 'jilB', E = ren ? 'renE' : 'jilE';
    const s = o.s || 1, f = o.face || {}, sq = o.squash || 0;
    const sx = (1 + sq * .12) * (o.flip ? -1 : 1), sy = 1 - sq * .12;
    const shake = o.shake ? Math.sin((o.t || 0) * 97) * o.shake * .5 : 0;
    const lean = o.lean || 0;
    const ear = o.ear || 0;
    const parts = [];
    parts.push(`<ellipse cx="0" cy="6" rx="230" ry="34" fill="#3A2412" opacity=".22" filter="url(#shadow)"/>`);
    parts.push(`<g transform="rotate(${lean} 0 -150)">`);
    const tw = (o.tail || 0) * Math.sin((o.t || 0) * 70) * 10;
    parts.push(`<g transform="translate(${-185 + tw} -95)"><circle r="52" fill="#FFF8EE" filter="url(#fur)"/><circle r="52" fill="none" stroke="#E6D3BA" stroke-width="3"/></g>`);
    parts.push(`<path d="M-200 -10 C-240 -180 -150 -330 0 -330 C150 -330 240 -180 200 -10 C140 12 -140 12 -200 -10Z" fill="url(#${B})" filter="url(#fur)"/>`);
    parts.push(`<path d="M-110 -20 C-130 -150 -70 -240 0 -240 C70 -240 130 -150 110 -20 C60 -6 -60 -6 -110 -20Z" fill="url(#belly)" filter="url(#fur)" opacity=".95"/>`);
    parts.push(`<ellipse cx="-115" cy="-8" rx="78" ry="34" fill="url(#${B})" filter="url(#fur)"/><ellipse cx="115" cy="-8" rx="78" ry="34" fill="url(#${B})" filter="url(#fur)"/>`);
    parts.push(`<path d="M-160 -14 l0 14 M-138 -12 l0 12 M138 -12 l0 12 M160 -14 l0 14" stroke="#B48A62" stroke-width="4" stroke-linecap="round" opacity=".6"/>`);
    if (ren) parts.push(`<path d="M-30 -300 L30 -300 L16 -270 L34 -150 L0 -118 L-34 -150 L-16 -270Z" fill="#F2B632" stroke="#C98C10" stroke-width="5" stroke-linejoin="round"/><path d="M-4 -250 L18 -230 M-12 -205 L22 -180" stroke="#E79E12" stroke-width="7" stroke-linecap="round"/>`);
    else parts.push(`<path d="M-50 -315 Q0 -250 50 -315" fill="none" stroke="#3E6FB0" stroke-width="7"/><rect x="-34" y="-262" width="68" height="84" rx="10" fill="#fff" stroke="#9FB4CC" stroke-width="4"/><rect x="-22" y="-248" width="44" height="30" rx="6" fill="#F3C08A"/><rect x="-22" y="-210" width="44" height="7" rx="3" fill="#9FB4CC"/><rect x="-22" y="-198" width="30" height="7" rx="3" fill="#9FB4CC"/>`);
    const arm = (side, deg) => {
      const shx = side * 150, shy = -250, len = 120;
      const a = (deg || 0) * Math.PI / 180;
      const ex = shx + side * Math.sin(a) * len * .6, ey = shy + Math.cos(a) * len * .95 - Math.sin(a) * len * .55;
      return `<path d="M${shx} ${shy} Q${(shx + ex) / 2 + side * 20} ${(shy + ey) / 2} ${ex} ${ey}" stroke="${ren ? '#E2BB8E' : '#E29C58'}" stroke-width="64" stroke-linecap="round" fill="none"/><ellipse cx="${ex}" cy="${ey}" rx="36" ry="32" fill="#F6E6D2" filter="url(#fur)"/>`;
    };
    const hy = -430 + sq * 20;
    const headTilt = o.tilt || 0;
    let head = '';
    if (ren) {
      const ea = 8 - ear * 30;
      head += `<g transform="rotate(${ea} -170 -60)"><path d="M-170 -60 C-270 -40 -290 140 -230 230 C-190 270 -140 250 -138 180 C-130 80 -120 -10 -110 -60Z" fill="url(#${E})" filter="url(#fur)"/><path d="M-178 0 C-232 30 -240 150 -210 205" stroke="#B9875A" stroke-width="10" fill="none" opacity=".45" stroke-linecap="round"/></g>`;
      head += `<g transform="rotate(${-ea} 170 -60)"><path d="M170 -60 C270 -40 290 140 230 230 C190 270 140 250 138 180 C130 80 120 -10 110 -60Z" fill="url(#${E})" filter="url(#fur)"/><path d="M178 0 C232 30 240 150 210 205" stroke="#B9875A" stroke-width="10" fill="none" opacity=".45" stroke-linecap="round"/></g>`;
    } else {
      const ea = -ear * 14;
      head += `<g transform="rotate(${-10 + ea} -70 -150)"><path d="M-95 -140 C-130 -300 -60 -340 -40 -300 C-20 -260 -30 -190 -45 -140Z" fill="url(#${E})" filter="url(#fur)"/><path d="M-82 -160 C-100 -270 -62 -295 -52 -275 C-42 -250 -48 -200 -58 -160Z" fill="url(#earIn)"/></g>`;
      head += `<g transform="rotate(${10 - ea} 70 -150)"><path d="M95 -140 C130 -300 60 -340 40 -300 C20 -260 30 -190 45 -140Z" fill="url(#${E})" filter="url(#fur)"/><path d="M82 -160 C100 -270 62 -295 52 -275 C42 -250 48 -200 58 -160Z" fill="url(#earIn)"/></g>`;
    }
    head += `<ellipse cx="0" cy="0" rx="${ren ? 205 : 190}" ry="${ren ? 175 : 168}" fill="url(#${B})" filter="url(#fur)"/>`;
    head += `<ellipse cx="0" cy="62" rx="95" ry="66" fill="url(#belly)" filter="url(#fur)"/>`;
    if (ren) head += `<path d="M-60 -168 Q0 -150 60 -168 Q30 -120 0 -112 Q-30 -120 -60 -168Z" fill="#E7C49C" opacity=".8" filter="url(#fur)"/>`;
    const blush = o.blush == null ? .7 : o.blush;
    head += `<ellipse cx="-120" cy="58" rx="46" ry="28" fill="url(#blush)" opacity="${blush}"/><ellipse cx="120" cy="58" rx="46" ry="28" fill="url(#blush)" opacity="${blush}"/>`;
    head += eyes(f.eye || 'open', 0, 4, ren ? 82 : 76, ren ? 38 : 34, f.look || [0, 0], f.blink || 0);
    if (!ren) {
      head += `<g fill="none" stroke="#6B4A2E" stroke-width="7" opacity=".9"><circle cx="-76" cy="4" r="56"/><circle cx="76" cy="4" r="56"/><path d="M-20 -2 Q0 -14 20 -2"/></g><circle cx="-96" cy="-20" r="10" fill="#fff" opacity=".5"/><circle cx="56" cy="-20" r="10" fill="#fff" opacity=".5"/>`;
    }
    if (f.brow) {
      const b = f.brow, by = -54;
      const d = b === 'angry' ? [12, -12] : b === 'worry' ? [-14, 14] : [-6, -6];
      head += `<path d="M-120 ${by + d[0]} L-46 ${by - d[0]}" stroke="#7A5233" stroke-width="12" stroke-linecap="round"/><path d="M46 ${by - d[1]} L120 ${by + d[1]}" stroke="#7A5233" stroke-width="12" stroke-linecap="round"/>`;
    }
    head += mouth(f.mouth || 'smile', 0, 84, 80, ren ? '#C88D85' : '#D98F8E');
    head += `<g stroke="#A88566" stroke-width="3" opacity=".55" stroke-linecap="round"><path d="M-60 70 L-160 56 M-60 82 L-158 88 M60 70 L160 56 M60 82 L158 88"/></g>`;
    if (o.sweat) head += `<path d="M150 -120 q22 40 0 56 q-22 -16 0 -56Z" fill="#8FD0F5" stroke="#5AA8D8" stroke-width="3" opacity="${o.sweat}"/>`;
    if (o.gloom) head += `<g stroke="#5F6B8C" stroke-width="7" opacity="${o.gloom}"><path d="M-110 -175 L-110 -120 M-60 -185 L-60 -125 M-10 -190 L-10 -128 M40 -185 L40 -125 M90 -175 L90 -120"/></g>`;
    parts.push(`<g transform="translate(0 ${hy}) rotate(${headTilt})">${head}</g>`);
    parts.push(arm(-1, o.armL || 0));
    parts.push(arm(1, o.armR || 0));
    if (o.item) parts.push(o.item);
    parts.push('</g>');
    return `<g transform="translate(${(o.x || 0) + shake} ${o.y || 0}) scale(${s * sx} ${s * sy})">${parts.join('')}</g>`;
  };

  L.office = function (o = {}) {
    const sky = o.sky || 'day';
    const win = (x) => `<g transform="translate(${x} 250)"><rect x="-10" y="-10" width="360" height="480" rx="16" fill="#FFFDF8"/><rect width="340" height="460" rx="8" fill="url(#${sky === 'day' ? 'sky' : sky})"/>
      ${sky === 'night' ? '<circle cx="250" cy="90" r="34" fill="#FFF3C4"/><g fill="#FFE9A8" opacity=".8"><rect x="30" y="300" width="16" height="16"/><rect x="70" y="330" width="16" height="16"/><rect x="200" y="320" width="16" height="16"/></g>' : '<g fill="#fff" opacity=".9"><ellipse cx="90" cy="110" rx="70" ry="26"/><ellipse cx="240" cy="170" rx="60" ry="20"/></g>'}
      <path d="M0 ${sky === 'night' ? 290 : 330} L50 290 L50 460 L0 460Z M70 460 L70 250 L130 250 L130 460Z M150 460 L150 300 L230 300 L230 460Z M250 460 L250 270 L340 270 L340 460Z" fill="${sky === 'night' ? '#2A3560' : '#BFD7E8'}" opacity=".9"/>
      <rect x="165" width="10" height="460" fill="#FFFDF8"/><rect y="225" width="340" height="10" fill="#FFFDF8"/></g>`;
    const g = [];
    g.push(`<rect x="-400" y="-400" width="1880" height="2720" fill="url(#wall)"/>`);
    g.push(`<g filter="url(#dof)">`);
    g.push(win(80) + win(660));
    g.push(clock(540, 330, o.clock || [10, 10]));
    g.push(`<g transform="translate(470 520)"><rect width="140" height="170" rx="8" fill="#fff" stroke="#E2D2BC" stroke-width="4"/><rect width="140" height="40" rx="8" fill="#E86C5A"/><text x="70" y="30" font-size="26" font-weight="900" text-anchor="middle" fill="#fff" font-family="Noto Sans CJK JP">${o.month || '12月'}</text><g fill="#D8C8B2">${Array.from({ length: 15 }, (_, i) => `<rect x="${14 + (i % 5) * 24}" y="${56 + Math.floor(i / 5) * 34}" width="16" height="16" rx="3"/>`).join('')}</g></g>`);
    g.push(plant(980, 1010) + plant(110, 1000, .8));
    g.push(`<rect x="-400" y="1010" width="1880" height="1400" fill="url(#floor)"/><rect x="-400" y="1004" width="1880" height="14" fill="#E7D3B6"/>`);
    g.push(`</g>`);
    g.push(`<ellipse cx="260" cy="900" rx="420" ry="520" fill="url(#light)" opacity="${sky === 'night' ? .15 : .55}"/>`);
    if (o.props) g.push(o.props);
    return g.join('');
  };
  function clock(x, y, [h, m]) {
    const ha = (h % 12 + m / 60) * 30, ma = m * 6;
    return `<g transform="translate(${x} ${y})"><circle r="78" fill="#fff" stroke="#C9A87E" stroke-width="10"/>${Array.from({ length: 12 }, (_, i) => `<rect x="-3" y="-66" width="6" height="${i % 3 ? 8 : 16}" fill="#8C6B4A" transform="rotate(${i * 30})"/>`).join('')}<path d="M0 0 L0 -38" stroke="#4A3324" stroke-width="9" stroke-linecap="round" transform="rotate(${ha})"/><path d="M0 0 L0 -58" stroke="#4A3324" stroke-width="6" stroke-linecap="round" transform="rotate(${ma})"/><circle r="8" fill="#E86C5A"/></g>`;
  }
  L.clock = clock;
  function plant(x, y, s = 1) {
    return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-55 0 L-45 -110 L45 -110 L55 0Z" fill="#D9825B"/><rect x="-52" y="-120" width="104" height="18" rx="6" fill="#E8956D"/>${[[-60, -260, -20], [0, -320, 0], [60, -270, 20], [-90, -200, -40], [90, -210, 40]].map(([lx, ly, r]) => `<ellipse cx="${lx}" cy="${ly + 60}" rx="34" ry="80" fill="#6DAA6A" transform="rotate(${r} ${lx} ${ly + 60})"/>`).join('')}</g>`;
  }
  L.desk = (y = 1180, o = {}) => { const x = o.x == null ? -60 : o.x, w = o.w || 1200, h = o.h || 900; return `<g><rect x="${x}" y="${y}" width="${w}" height="70" rx="14" fill="url(#desk)"/><rect x="${x + 10}" y="${y + 60}" width="${w - 20}" height="${h}" rx="10" fill="#A87A4C"/><rect x="${x + 10}" y="${y + 60}" width="${w - 20}" height="24" fill="#8C6239" opacity=".6"/><rect x="${x + 40}" y="${y + 130}" width="${w - 80}" height="6" rx="3" fill="#8C6239" opacity=".5"/>${o.props || ''}</g>`; };
  L.laptop = (x, y, s = 1, screen = '') => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-190 0 L190 0 L215 26 L-215 26Z" fill="#C9CFD8"/><rect x="-180" y="-250" width="360" height="250" rx="16" fill="#3B4252"/><rect x="-164" y="-234" width="328" height="218" rx="8" fill="url(#screen)"/><g transform="translate(-164 -234)">${screen}</g></g>`;
  L.papers = (x, y, n, o = {}) => {
    let s = '';
    for (let i = 0; i < n; i++) { const j = Math.sin(i * 12.9898) * 14; s += `<rect x="${x - 110 + j}" y="${y - (i + 1) * 15}" width="220" height="16" rx="3" fill="${i % 2 ? '#FFFFFF' : '#F4EFE6'}" stroke="#D7CCBB" stroke-width="2" transform="rotate(${Math.sin(i * 7.1) * 2.2} ${x} ${y - i * 15})"/>`; }
    return s;
  };
  L.hay = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-120 0 Q-100 -110 0 -130 Q100 -110 120 0Z" fill="#B9C46A"/>${Array.from({ length: 26 }, (_, i) => { const a = -80 + i * 6.4; return `<path d="M${-100 + i * 8} 0 q${Math.sin(i) * 20} -60 ${a * .6} ${-90 - (i % 5) * 10}" stroke="${i % 3 ? '#9FAE4E' : '#D4D98A'}" stroke-width="6" fill="none" stroke-linecap="round"/>`; }).join('')}</g>`;

  L.bubble = (x, y, txt, o = {}) => {
    const w = o.w || 300, h = o.h || 130, fs = o.fs || 58;
    return `<g transform="translate(${x} ${y}) scale(${o.s || 1})"><rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" rx="${h / 2.4}" fill="#fff" stroke="#3A2414" stroke-width="7"/><path d="M${(o.tail || -40) - 20} -4 L${(o.tail || -40)} 46 L${(o.tail || -40) + 26} -4Z" fill="#fff" stroke="#3A2414" stroke-width="7" stroke-linejoin="round"/><rect x="${(o.tail || -40) - 16}" y="-12" width="40" height="12" fill="#fff"/><text x="0" y="${-h / 2 + fs * .36}" font-size="${fs}" font-weight="900" text-anchor="middle" fill="#3A2414" font-family="Noto Sans CJK JP">${txt}</text></g>`;
  };
  L.label = (x, y, txt, o = {}) => `<g transform="translate(${x} ${y}) rotate(${o.rot || 0}) scale(${o.s || 1})"><text text-anchor="middle" font-size="${o.fs || 64}" font-weight="900" font-family="Noto Sans CJK JP" fill="${o.fill || '#E8473A'}" stroke="#fff" stroke-width="${(o.fs || 64) * .22}" paint-order="stroke" stroke-linejoin="round">${txt}</text></g>`;
  L.speed = (cx, cy, a = 1, n = 48) => `<g opacity="${a}">${Array.from({ length: n }, (_, i) => { const t = i / n * Math.PI * 2 + Math.sin(i * 3.3) * .05, r1 = 520 + Math.abs(Math.sin(i * 7.7)) * 160, r2 = 1600; return `<path d="M${cx + Math.cos(t) * r1} ${cy + Math.sin(t) * r1} L${cx + Math.cos(t + .02) * r2} ${cy + Math.sin(t + .02) * r2} L${cx + Math.cos(t - .02) * r2} ${cy + Math.sin(t - .02) * r2}Z" fill="#fff"/>`; }).join('')}</g>`;
  L.mark = (x, y, ch, s = 1, color = '#E8473A') => `<text x="${x}" y="${y}" font-size="${130 * s}" font-weight="900" text-anchor="middle" font-family="Noto Sans CJK JP" fill="${color}" stroke="#fff" stroke-width="${18 * s}" paint-order="stroke">${ch}</text>`;
  window.L = L;
})();
// 本番の ep.html に載せる共通処理。層：bg → back → ren → jil → fx（最後は空に）→ ui（カメラの影響なし）
(function () {
  const L = window.L;
  const set = (id, s) => { const n = document.getElementById(id); if (n) n.innerHTML = s || ''; };
  L.mount = function (sc) {
    set('bg', L.defs() + (sc.bg || '')); set('back', sc.back); set('ren', sc.ren); set('jil', sc.jil); set('fx', sc.fx); set('ui', sc.ui);
    const c = sc.cam || { z: 1, cx: 540, cy: 960 };
    const w = document.getElementById('world');
    if (w) w.style.transform = `translate(${540 - c.cx * c.z}px, ${960 - c.cy * c.z}px) scale(${c.z})`;
    const d = document.getElementById('dim'); if (d) d.style.opacity = sc.dim || 0;
  };
  L.camAt = function (keys, t) {
    let cur = { z: keys[0].z, cx: keys[0].cx, cy: keys[0].cy };
    for (let i = 1; i < keys.length; i++) {
      const k = keys[i]; if (t < k.t) break;
      const u = L.ease(L.seg(t, k.t, k.t + (k.d || .6)));
      cur = { z: L.lerp(cur.z, k.z, u), cx: L.lerp(cur.cx, k.cx, u), cy: L.lerp(cur.cy, k.cy, u) };
    }
    return cur;
  };
  if (typeof window.camera !== 'function') window.camera = c => { const w = document.getElementById('world'); if (w) w.style.transform = `translate(${540 - c.cx * c.z}px, ${960 - c.cy * c.z}px) scale(${c.z})`; };
  L.dust = (x, y, k) => k <= 0 || k >= 1 ? '' : `<g opacity="${1 - k}">${Array.from({ length: 9 }, (_, i) => { const a = i / 9 * Math.PI * 2, r = 60 + k * 220; return `<circle cx="${x + Math.cos(a) * r}" cy="${y + Math.sin(a) * r * .55}" r="${70 * (1 - k * .5)}" fill="#F3E6D3" stroke="#D9C4A6" stroke-width="5"/>`; }).join('')}</g>`;
  L.chair = (x, y, spin = 0) => `<g transform="translate(${x} ${y})"><rect x="-20" y="-10" width="40" height="150" fill="#5B6270"/><path d="M-120 150 L120 150" stroke="#3D4250" stroke-width="16" stroke-linecap="round"/><g transform="scale(${Math.cos(spin)} 1)"><rect x="-150" y="-330" width="300" height="300" rx="60" fill="#4F6E9C"/><rect x="-130" y="-310" width="260" height="120" rx="40" fill="#6585B5" opacity=".6"/></g><rect x="-170" y="-40" width="340" height="60" rx="28" fill="#3F5A82"/></g>`;
  L.bag = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-60 -110 Q0 -190 60 -110" fill="none" stroke="#7B4F2C" stroke-width="14"/><rect x="-100" y="-120" width="200" height="140" rx="26" fill="#C9744A"/><rect x="-100" y="-120" width="200" height="40" rx="20" fill="#B5643D"/><rect x="-16" y="-92" width="32" height="24" rx="6" fill="#F2C14E"/></g>`;
})();
