// レンとジル v2 演出ライブラリ（2026-11）
// キャラは本番の rig.js（RIG.render）をそのまま使う＝ゲーム・これまでの投稿と同じ見た目。
// ここで足すのは「背景・小道具・カメラ・効果」だけ。画面の文字は使わず、数字・記号・絵で伝える（海外の視聴者にも通じるように）。
(function () {
  const L = {};
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => (k = clamp(k, 0, 1), k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const outBack = k => { k = clamp(k, 0, 1); const c = 1.70158; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const pulse = (t, a, b) => { const u = seg(t, a, b); return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0; };
  Object.assign(L, { clamp, lerp, ease, outBack, seg, pulse });

  // 本番の背景と同じ色（壁 #F4ECE0・木の机）を基準に、光と奥行きだけ足す
  const PAL = { wall: '#F4ECE0', wall2: '#EADFCF', floor: '#E6D6C0', floor2: '#D9C6AC', frame: '#FFFDF8', wood: '#A9784E', wood2: '#8C603C', woodTop: '#C0905F', leaf: '#7DB87A', leaf2: '#5E9C5E', pot: '#C97A55', ink: '#4A3324' };
  L.PAL = PAL;
  L.defs = () => `<defs>
  <filter id="v2dof" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2.4"/></filter>
  <filter id="v2soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="12"/></filter>
  <linearGradient id="v2wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8F1E6"/><stop offset="1" stop-color="${PAL.wall2}"/></linearGradient>
  <linearGradient id="v2floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PAL.floor}"/><stop offset="1" stop-color="${PAL.floor2}"/></linearGradient>
  <linearGradient id="v2desk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PAL.woodTop}"/><stop offset=".25" stop-color="${PAL.wood}"/><stop offset="1" stop-color="${PAL.wood2}"/></linearGradient>
  <linearGradient id="v2day" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFE0F5"/><stop offset="1" stop-color="#E6F3FB"/></linearGradient>
  <linearGradient id="v2dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6C29A"/><stop offset=".6" stop-color="#F9DDB4"/><stop offset="1" stop-color="#FBEBCD"/></linearGradient>
  <linearGradient id="v2night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2B3A63"/><stop offset="1" stop-color="#4A5A88"/></linearGradient>
  <linearGradient id="v2screen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EAF4FF"/><stop offset="1" stop-color="#CFE2F7"/></linearGradient>
  <radialGradient id="v2light" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF6DA" stop-opacity=".85"/><stop offset="1" stop-color="#FFF6DA" stop-opacity="0"/></radialGradient>
  <radialGradient id="v2vig" cx="50%" cy="45%" r="75%"><stop offset=".6" stop-color="#3B2412" stop-opacity="0"/><stop offset="1" stop-color="#3B2412" stop-opacity=".16"/></radialGradient>
  <linearGradient id="v2under" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B2412" stop-opacity=".34"/><stop offset="1" stop-color="#3B2412" stop-opacity="0"/></linearGradient>
  <linearGradient id="v2metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4D8"/><stop offset=".5" stop-color="#E9D2A8"/><stop offset="1" stop-color="#B8935C"/></linearGradient>
  <linearGradient id="v2pot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#A85F3F"/><stop offset=".35" stop-color="#DE9670"/><stop offset="1" stop-color="#9C5638"/></linearGradient>
  <linearGradient id="v2leafA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#A5D69A"/><stop offset="1" stop-color="#5E9C5E"/></linearGradient>
  <linearGradient id="v2leafB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7DB87A"/><stop offset="1" stop-color="#3F7C4A"/></linearGradient>
  <linearGradient id="v2rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F0D9B4"/><stop offset=".5" stop-color="#C9A87E"/><stop offset="1" stop-color="#9A7650"/></linearGradient>
  <radialGradient id="v2face" cx="42%" cy="36%" r="70%"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#EFE7DA"/></radialGradient>
  <linearGradient id="v2frameG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E9DFCE"/></linearGradient>
  <radialGradient id="v2sun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF3C4" stop-opacity=".95"/><stop offset=".4" stop-color="#FFE9A8" stop-opacity=".4"/><stop offset="1" stop-color="#FFE9A8" stop-opacity="0"/></radialGradient>
  <linearGradient id="v2slat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".7" stop-color="#F6F0E4"/><stop offset="1" stop-color="#D9CDB8"/></linearGradient>
  <linearGradient id="v2lap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E4E8EE"/><stop offset="1" stop-color="#AEB6C2"/></linearGradient>
  <radialGradient id="v2shadow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#5A3A1E" stop-opacity=".28"/><stop offset="1" stop-color="#5A3A1E" stop-opacity="0"/></radialGradient>
  </defs>`;

  // ---------- 背景（オフィス） ----------
  // o: { sky: day|dusk|night, clock:[h,m], noClock, light: 0..1, look: 0..3 }
  // 総見直し（2026-11-10・OVERHAUL 56/57/59/61/87）：毎話同じ絵にならないよう、話ごとに「部屋の見た目」を4種類から選ぶ（壁の色・窓・本棚・ホワイトボード・額）。
  //   時計の時刻で光の色も変える（朝＝白っぽい・昼＝そのまま・夕方＝あたたかい・夜＝青い）。手前の机・キャラの位置は変えない（台本はそのまま）
  const LOOKS = [
    { wall: ['#F8F1E6', '#EADFCF'], name: 'warm' },          // これまでの部屋
    { wall: ['#EEF3EC', '#DCE5D8'], name: 'mint' },          // ミント：横長の窓＋ブラインド・本棚
    { wall: ['#EEF1F7', '#DCE1EC'], name: 'blue' },          // 青み：窓＋ホワイトボード
    { wall: ['#FBF0E4', '#F0DCC6'], name: 'peach' }          // 桃色：額の絵＋窓
  ];
  const epName = () => { try { return new URLSearchParams(location.search).get('ep') || ''; } catch (e) { return ''; } };
  L.lookOf = name => { const T = window.LOOK_ALL || {}; if (T[name] != null) return T[name]; let h = 0; for (const c of String(name || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % LOOKS.length; };
  L.office = function (o = {}) {
    const hr = o.clock ? o.clock[0] + (o.clock[1] || 0) / 60 : 10;
    // 時刻に合わせた空（台本で 'day' 固定でも、17時以降なら夕方・19時以降なら夜に）
    let sky = o.sky || 'day';
    if (sky === 'day' && hr >= 19) sky = 'night'; else if (sky === 'day' && hr >= 17) sky = 'dusk';
    const night = sky === 'night';
    const look = o.look != null ? o.look : L.lookOf(epName()), LK = LOOKS[look];
    /* 見た目の作り込み（2026-11-16・アニメ 1〜）：背景が「色の板」に見えて、毛並みまで描いたキャラクターとつり合っていなかった。光・かげ・厚みを足す。形・位置・大きさは変えない（台本・カメラはそのまま） */
    const cloud = (cx, cy, k) => `<g transform="translate(${cx} ${cy}) scale(${k})"><ellipse cx="0" cy="8" rx="66" ry="16" fill="#D5E6F2" opacity=".8"/><ellipse cx="-26" cy="-2" rx="34" ry="20" fill="#fff"/><ellipse cx="14" cy="-10" rx="40" ry="26" fill="#fff"/><ellipse cx="46" cy="2" rx="26" ry="15" fill="#fff"/></g>`;
    const lit = night ? '#FFE9A8' : '#E3EEF5';
    const wdots = (x0, y0, w, h, n) => { const cols = Math.max(1, Math.floor((w - 10) / 17)), rows = Math.max(1, Math.floor((h - 20) / 26)); let o2 = ''; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const k = (r * 7 + c * 13 + Math.round(x0)) % 5; if (night ? (k === 0 || k === 3) : k !== 2) o2 += `<rect x="${x0 + 8 + c * 17}" y="${y0 + 14 + r * 26}" width="9" height="12" rx="1.5"/>`; } return o2; }; // 窓の明かりは、たて・よこにそろえる（ばらばらだと紙ふぶきに見えた）
    const win = x => `<g transform="translate(${x} 230)"><rect x="-2" y="2" width="344" height="452" rx="16" fill="#5A3A1E" opacity=".14"/><rect x="-12" y="-12" width="344" height="444" rx="14" fill="url(#v2frameG)"/><rect x="-12" y="-12" width="344" height="444" rx="14" fill="none" stroke="#DCCFB9" stroke-width="3"/><rect width="320" height="420" rx="6" fill="url(#v2${sky})"/>
      ${night ? '<g fill="#fff" opacity=".8"><circle cx="40" cy="50" r="2.5"/><circle cx="120" cy="120" r="2"/><circle cx="90" cy="30" r="1.8"/><circle cx="280" cy="150" r="2.2"/><circle cx="170" cy="60" r="1.6"/><circle cx="60" cy="170" r="1.8"/></g><circle cx="230" cy="80" r="74" fill="url(#v2sun)" opacity=".6"/><circle cx="230" cy="80" r="30" fill="#FFF3C4"/><circle cx="220" cy="72" r="7" fill="#F2E2A6" opacity=".7"/><circle cx="240" cy="90" r="4.5" fill="#F2E2A6" opacity=".7"/>'
        : (sky === 'dusk' ? '<circle cx="236" cy="236" r="120" fill="url(#v2sun)"/><circle cx="236" cy="236" r="26" fill="#FFF1C2"/>' : '') + cloud(92, 100, 1) + cloud(236, 160, .8)}
      <path d="M0 330 L30 306 L30 420 L0 420Z M44 420 L44 262 L96 262 L96 420Z M112 420 L112 300 L150 300 L150 420Z M176 420 L176 244 L236 244 L236 420Z M252 420 L252 290 L320 290 L320 420Z" fill="${night ? '#3D4B7A' : '#DCE8F0'}" opacity=".8"/>
      <path d="M0 300 L48 270 L48 420 L0 420Z M66 420 L66 236 L122 236 L122 420Z M140 420 L140 284 L214 284 L214 420Z M232 420 L232 254 L320 254 L320 420Z" fill="${night ? '#33406B' : '#CADBE6'}" opacity=".9"/>
      <g fill="${night ? '#1F2A4E' : '#B4C9D8'}" opacity=".5"><rect x="110" y="236" width="12" height="184"/><rect x="202" y="284" width="12" height="136"/><rect x="38" y="276" width="10" height="144"/><rect x="306" y="254" width="14" height="166"/></g>
      <g fill="${lit}" opacity="${night ? .9 : .55}">${wdots(66, 236, 44, 184, 9)}${wdots(140, 284, 62, 136, 8)}${wdots(232, 254, 74, 166, 10)}${wdots(0, 300, 38, 120, 4)}</g>
      <rect y="380" width="320" height="40" fill="${night ? '#1B2440' : '#EAF2F7'}" opacity=".35"/>
      <g fill="#fff" opacity="${night ? .08 : .2}"><path d="M30 0 L100 0 L-20 420 L-90 420Z"/><path d="M130 0 L160 0 L40 420 L10 420Z"/></g>
      <rect width="320" height="16" fill="#5A3A1E" opacity=".1"/><rect width="12" height="420" fill="#5A3A1E" opacity=".07"/>
      <rect x="155" width="10" height="420" fill="${PAL.frame}"/><rect x="163" width="2.5" height="420" fill="#D9CCB6"/><rect y="205" width="320" height="10" fill="${PAL.frame}"/><rect y="213" width="320" height="2.5" fill="#D9CCB6"/>
      <rect x="-26" y="428" width="372" height="20" rx="6" fill="#FFFDF8"/><rect x="-26" y="443" width="372" height="5" rx="2.5" fill="#D9CCB6"/><rect x="-18" y="448" width="356" height="10" fill="#5A3A1E" opacity=".1"/></g>`;
    const shelf = x => `<g transform="translate(${x} 250)"><rect x="-2" y="0" width="340" height="424" rx="14" fill="#5A3A1E" opacity=".16"/><rect x="-10" y="-10" width="340" height="420" rx="12" fill="#B98A5E"/><rect x="-10" y="-10" width="340" height="8" rx="4" fill="#D6AC80"/><rect width="320" height="400" rx="6" fill="#8C603C"/><rect width="320" height="400" rx="6" fill="url(#v2under)" opacity=".5"/>`
      + [0, 1, 2].map(r => [0, 1, 2, 3, 4, 5, 6].map(i => { const w = 26 + (i * 13 + r * 7) % 18, hh = 70 + (i * 17 + r * 11) % 40, x0 = 14 + i * 43, y0 = r * 133 + 125 - hh, c = ['#D9734E', '#5E8FB8', '#E8C25A', '#7DB87A', '#C98BB0', '#F2EEE6', '#6C8A9E'][(i + r * 2) % 7];
        return `<g transform="rotate(${i === 5 ? -8 : 0} ${x0} ${r * 133 + 125})"><rect x="${x0}" y="${y0}" width="${w}" height="${hh}" rx="4" fill="${c}"/><rect x="${x0}" y="${y0}" width="${w * .28}" height="${hh}" rx="3" fill="#fff" opacity=".22"/><rect x="${x0 + w * .74}" y="${y0}" width="${w * .26}" height="${hh}" rx="3" fill="#3B2412" opacity=".16"/><rect x="${x0 + 3}" y="${y0 + 12}" width="${w - 6}" height="5" fill="#fff" opacity=".55"/><rect x="${x0 + 3}" y="${y0 + hh - 20}" width="${w - 6}" height="4" fill="#3B2412" opacity=".22"/></g>`; }).join('')
        + `<rect x="0" y="${r * 133 + 125}" width="320" height="12" fill="#B98A5E"/><rect x="0" y="${r * 133 + 125}" width="320" height="3" fill="#D6AC80"/><rect x="0" y="${r * 133 + 137}" width="320" height="22" fill="url(#v2under)"/>`).join('')
      + `<ellipse cx="250" cy="383" rx="40" ry="10" fill="#5A3A1E" opacity=".2"/><g transform="translate(250 384)"><path d="M-22 0 L-17 -34 L17 -34 L22 0Z" fill="url(#v2pot)"/><ellipse cx="-6" cy="-52" rx="11" ry="22" fill="url(#v2leafA)" transform="rotate(-24 -6 -52)"/><ellipse cx="9" cy="-56" rx="11" ry="24" fill="url(#v2leafB)" transform="rotate(18 9 -56)"/></g></g>`;
    const board = x => `<g transform="translate(${x} 250)"><rect x="-4" y="-2" width="344" height="312" rx="14" fill="#5A3A1E" opacity=".14"/><rect x="-12" y="-12" width="344" height="304" rx="12" fill="url(#v2lap)"/><rect x="-12" y="-12" width="344" height="6" rx="3" fill="#F4F6F9"/><rect width="320" height="280" rx="6" fill="#FFFFFF"/><rect width="320" height="14" rx="6" fill="#5A6A7A" opacity=".1"/>`
      + `<path d="M40 0 L120 0 L60 280 L-20 280Z" fill="#DCE8F4" opacity=".35"/>`
      + `<path d="M30 60 q40 -30 80 0 t80 0" stroke="#5E8FB8" stroke-width="8" fill="none" stroke-linecap="round"/><rect x="30" y="110" width="110" height="70" rx="10" fill="none" stroke="#E8473A" stroke-width="7"/>`
      + `<path d="M170 200 L210 130 L250 170 L290 90" stroke="#5DBB63" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="62" cy="232" r="14" fill="#5A3A1E" opacity=".18"/><circle cx="60" cy="230" r="14" fill="#E8C25A"/><circle cx="55" cy="225" r="4.5" fill="#fff" opacity=".6"/><circle cx="282" cy="32" r="10" fill="#E8473A"/><circle cx="279" cy="29" r="3" fill="#fff" opacity=".6"/>`
      + `<rect x="60" y="292" width="200" height="16" rx="6" fill="#9AA3AE"/><rect x="60" y="292" width="200" height="4" rx="2" fill="#C5CCD5"/><rect x="84" y="284" width="44" height="10" rx="4" fill="#3B4252"/><rect x="84" y="284" width="10" height="10" rx="3" fill="#E9EDF2"/><rect x="138" y="284" width="44" height="10" rx="4" fill="#E8473A"/><rect x="138" y="284" width="10" height="10" rx="3" fill="#E9EDF2"/><rect x="200" y="280" width="46" height="14" rx="4" fill="#6C7A8A"/><rect x="200" y="290" width="46" height="4" fill="#F2EEE6"/></g>`;
    const frames = x => `<g transform="translate(${x} 260)"><rect x="-4" y="-2" width="204" height="258" rx="12" fill="#5A3A1E" opacity=".16"/><rect x="-10" y="-10" width="200" height="250" rx="10" fill="url(#v2frameG)"/><rect x="-10" y="-10" width="200" height="250" rx="10" fill="none" stroke="#DCCFB9" stroke-width="3"/><rect width="180" height="230" rx="4" fill="url(#v2day)"/><circle cx="130" cy="55" r="46" fill="url(#v2sun)" opacity=".8"/><circle cx="130" cy="55" r="22" fill="#F2C14E"/><path d="M0 190 L46 120 L80 160 L108 132 L180 196 L180 230 L0 230Z" fill="#A9CFA2"/><path d="M0 170 L60 90 L100 140 L130 110 L180 170 L180 230 L0 230Z" fill="#7DB87A"/><path d="M60 90 L100 140 L88 150 L60 118 L36 150 L24 138Z" fill="#fff" opacity=".22"/><path d="M0 204 Q90 186 180 206 L180 230 L0 230Z" fill="#5E9C5E"/><rect width="180" height="10" fill="#5A3A1E" opacity=".12"/><rect width="8" height="230" fill="#5A3A1E" opacity=".08"/>`
      + `<g transform="translate(200 70)"><rect x="-4" y="-2" width="144" height="178" rx="12" fill="#5A3A1E" opacity=".16"/><rect x="-10" y="-10" width="140" height="170" rx="10" fill="url(#v2frameG)"/><rect x="-10" y="-10" width="140" height="170" rx="10" fill="none" stroke="#DCCFB9" stroke-width="3"/><rect width="120" height="150" rx="4" fill="#F7D9C4"/><circle cx="60" cy="70" r="34" fill="#E8907A"/><circle cx="50" cy="60" r="14" fill="#F4B3A0" opacity=".8"/><path d="M26 70 a34 34 0 0 0 68 0Z" fill="#C96F5A" opacity=".45"/><rect x="20" y="118" width="80" height="10" rx="5" fill="#C98B6A"/><rect width="120" height="8" fill="#5A3A1E" opacity=".12"/></g></g>`;
    const blinds = x => `<g transform="translate(${x} 230)"><rect x="-4" y="-8" width="328" height="14" rx="5" fill="#EDE4D4"/>${Array.from({ length: 9 }, (_, i) => `<rect x="0" y="${i * 22 + 13}" width="320" height="6" fill="#5A3A1E" opacity=".1"/><rect x="0" y="${i * 22}" width="320" height="12" rx="3" fill="url(#v2slat)" opacity=".95"/>`).join('')}<rect x="60" y="0" width="2.5" height="200" fill="#CFC3AE"/><rect x="258" y="0" width="2.5" height="200" fill="#CFC3AE"/><rect x="296" y="0" width="2.5" height="250" fill="#CFC3AE"/><rect x="291" y="246" width="12" height="20" rx="5" fill="#EDE4D4"/></g>`;
    const g = [];
    g.push(`<rect x="-500" y="-500" width="2080" height="2920" fill="url(#v2wall${look})"/>`);
    g.push(`<linearGradient id="v2wall${look}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${LK.wall[0]}"/><stop offset="1" stop-color="${LK.wall[1]}"/></linearGradient>`);
    // 腰板（壁の下の帯）で部屋の奥行き
    g.push(`<rect x="-500" y="860" width="2080" height="140" fill="${LK.wall[1]}" opacity=".9"/><rect x="-500" y="852" width="2080" height="10" fill="#FFFDF8" opacity=".8"/>`);
    g.push(`<g filter="url(#v2dof)">`);
    if (look === 0) g.push(win(70) + win(690));
    else if (look === 1) g.push(win(70) + blinds(70) + shelf(690));
    else if (look === 2) g.push(win(70) + board(690));
    else g.push(frames(70) + win(690));
    if (!o.noClock) g.push(L.clock(540, 300, o.clock || [10, 10], .9));
    g.push(plant(985, 1000) + plant(95, 990, .8));
    g.push(`<rect x="-500" y="1000" width="2080" height="1500" fill="url(#v2floor)"/><rect x="-500" y="968" width="2080" height="30" fill="#F6EEE0"/><rect x="-500" y="968" width="2080" height="5" fill="#FFFDF8"/><rect x="-500" y="994" width="2080" height="12" fill="#EFE3D2"/><rect x="-500" y="1006" width="2080" height="46" fill="url(#v2under)" opacity=".45"/>`
      + [1090, 1210, 1360].map((yy, i) => `<rect x="-500" y="${yy}" width="2080" height="${3 + i}" fill="#5A3A1E" opacity=".05"/>`).join(''));
    g.push(`</g>`);
    // 窓からの光（夕方は低く・あたたかい）
    const lx = look === 3 ? 850 : 230;
    g.push(`<ellipse cx="${night ? 540 : lx}" cy="${sky === 'dusk' ? 900 : 820}" rx="460" ry="560" fill="url(#v2light)" opacity="${night ? .12 : (o.light == null ? .5 : o.light)}"/>`);
    // 窓の形の日だまり（床に落ちる光。夜は出さない）
    if (!night) { const wx = look === 3 ? 690 : 70, c = sky === 'dusk' ? '#FFD9A0' : '#FFF8E4', a = sky === 'dusk' ? .3 : .22; g.push(`<g filter="url(#v2dof)" opacity="${a}" fill="${c}"><path d="M${wx + 60} 1030 L${wx + 205} 1030 L${wx + 290} 1170 L${wx + 110} 1170Z"/><path d="M${wx + 225} 1030 L${wx + 370} 1030 L${wx + 490} 1170 L${wx + 310} 1170Z"/></g>`); }
    // 時間帯の色（朝は少し白く、夕方はあたたかく、夜は青く）
    if (night) g.push(`<rect x="-500" y="-500" width="2080" height="2920" fill="#1B2440" opacity=".18"/>`);
    else if (sky === 'dusk') g.push(`<rect x="-500" y="-500" width="2080" height="2920" fill="#F2994A" opacity=".10"/>`);
    else if (hr < 10) g.push(`<rect x="-500" y="-500" width="2080" height="2920" fill="#FFFFFF" opacity=".06"/>`);
    // 四隅を少し暗く（手前のキャラが目立つ）
    g.push(`<rect x="-500" y="-500" width="2080" height="2920" fill="url(#v2vig)"/>`);
    return g.join('');
  };
  L.clock = (x, y, [h, m], s = 1) => {
    const ha = (h % 12 + m / 60) * 30, ma = m * 6;
    return `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="5" cy="9" r="88" fill="#5A3A1E" opacity=".16"/><circle r="85" fill="url(#v2rim)"/><circle r="76" fill="#8C6B4A" opacity=".5"/><circle r="74" fill="url(#v2face)"/><circle r="74" fill="none" stroke="#5A3A1E" stroke-width="6" opacity=".08"/>${Array.from({ length: 12 }, (_, i) => `<rect x="-3" y="-68" width="6" height="${i % 3 ? 8 : 16}" rx="2" fill="#8C6B4A" transform="rotate(${i * 30})"/>`).join('')}<g transform="translate(3 4)" opacity=".18"><path d="M0 0 L0 -40" stroke="#3B2412" stroke-width="9" stroke-linecap="round" transform="rotate(${ha})"/><path d="M0 0 L0 -60" stroke="#3B2412" stroke-width="6" stroke-linecap="round" transform="rotate(${ma})"/></g><path d="M0 0 L0 -40" stroke="${PAL.ink}" stroke-width="9" stroke-linecap="round" transform="rotate(${ha})"/><path d="M0 0 L0 -60" stroke="${PAL.ink}" stroke-width="6" stroke-linecap="round" transform="rotate(${ma})"/><circle r="8" fill="#E86C5A"/><circle cx="-2.5" cy="-2.5" r="2.6" fill="#fff" opacity=".7"/><path d="M-58 -30 A66 66 0 0 1 -14 -64" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
  };
  // デジタル時計（数字は世界共通）
  L.digital = (x, y, txt, o = {}) => `<g transform="translate(${x} ${y}) scale(${o.s || 1})"><rect x="-164" y="-58" width="340" height="140" rx="26" fill="#3B2412" opacity=".2"/><rect x="-170" y="-70" width="340" height="140" rx="26" fill="#2E3440"/><rect x="-170" y="-70" width="340" height="60" rx="26" fill="#fff" opacity=".07"/><rect x="-156" y="-56" width="312" height="112" rx="16" fill="#1E232C"/><rect x="-156" y="-56" width="312" height="14" rx="7" fill="#000" opacity=".35"/><text x="0" y="34" text-anchor="middle" font-size="96" font-weight="900" font-family="Noto Sans Mono, Noto Sans CJK JP, monospace" fill="${o.color || '#7CF0A8'}" opacity=".35" stroke="${o.color || '#7CF0A8'}" stroke-width="10" stroke-linejoin="round" filter="url(#v2dof)">${txt}</text><text x="0" y="34" text-anchor="middle" font-size="96" font-weight="900" font-family="Noto Sans Mono, Noto Sans CJK JP, monospace" fill="${o.color || '#7CF0A8'}">${txt}</text><path d="M-150 -50 L-60 -50 L-110 50 L-150 50Z" fill="#fff" opacity=".05"/></g>`;
  function plant(x, y, s = 1) {
    return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="2" rx="80" ry="14" fill="#5A3A1E" opacity=".18"/>${[[-90, -200, -40], [90, -210, 40], [-60, -260, -20], [60, -270, 20], [0, -320, 0]].map(([lx, ly, r], i) => `<g transform="rotate(${r} ${lx} ${ly + 60})"><ellipse cx="${lx}" cy="${ly + 60}" rx="34" ry="80" fill="url(#v2leaf${i % 2 ? 'B' : 'A'})"/><path d="M${lx} ${ly + 136} L${lx} ${ly - 12}" stroke="#fff" stroke-width="3" opacity=".3" stroke-linecap="round"/><path d="M${lx} ${ly + 90} l-16 -22 M${lx} ${ly + 50} l16 -22 M${lx} ${ly + 20} l-14 -20" stroke="#fff" stroke-width="2" opacity=".2" fill="none"/></g>`).join('')}<path d="M-55 0 L-45 -110 L45 -110 L55 0Z" fill="url(#v2pot)"/><rect x="-52" y="-120" width="104" height="18" rx="6" fill="#DB8C66"/><rect x="-52" y="-120" width="104" height="5" rx="2.5" fill="#F0B594"/><rect x="-46" y="-102" width="92" height="10" fill="#5A3A1E" opacity=".2"/></g>`;
  }
  // 机（本番と同じ木の色。天板＋前板）
  L.desk = (y, o = {}) => { const x = o.x == null ? 0 : o.x, w = o.w || 1080, h = o.h || 260; return `<g><rect x="${x}" y="${y}" width="${w}" height="34" rx="10" fill="${PAL.woodTop}"/><rect x="${x + 8}" y="${y + 30}" width="${w - 16}" height="${h}" rx="8" fill="url(#v2desk)"/><rect x="${x + 30}" y="${y + 90}" width="${w - 60}" height="5" rx="2" fill="${PAL.wood2}" opacity=".5"/></g>`; };
  // 手前の机（画面いっぱいの前板）と引き出し。75 話が同じ絵を 1 話ずつ書いていたのを、ここ 1 か所に（2026-11-16：見た目の作り込みを全話に一度に入れるため）
  L.deskFront = y => `<rect x="-500" y="${y + 28}" width="2080" height="900" fill="url(#v2desk)"/>`
    + [[70, 0, 1], [118, 300, -1], [200, -200, 1], [290, 150, -1], [330, -350, 1], [420, 40, -1], [520, 260, 1], [640, -120, -1], [760, 90, 1]].map(([dy, dx, k], i) => `<path d="M-500 ${y + dy} Q${dx + 200} ${y + dy + 14 * k} ${dx + 760} ${y + dy + 2} T1580 ${y + dy + 6 * k}" stroke="${i % 3 ? '#6E4728' : '#D9B084'}" stroke-width="${i % 3 ? 3 : 2.5}" fill="none" opacity="${i % 3 ? .16 : .22}"/>`).join('')
    + `<rect x="-500" y="${y + 30}" width="2080" height="46" fill="url(#v2under)"/><rect x="-500" y="${y}" width="2080" height="34" rx="10" fill="${PAL.woodTop}"/><rect x="-500" y="${y}" width="2080" height="7" rx="3.5" fill="#E2BC8E"/><rect x="-500" y="${y + 27}" width="2080" height="7" fill="#8C603C" opacity=".45"/><ellipse cx="300" cy="${y + 5}" rx="260" ry="5" fill="#fff" opacity=".28"/>`;
  L.drawer = (x, y) => `<rect x="${x}" y="${y + 90}" width="460" height="170" rx="14" fill="#5A3A1E" opacity=".07"/><rect x="${x}" y="${y + 90}" width="460" height="170" rx="14" fill="none" stroke="${PAL.wood2}" stroke-width="6" opacity=".55"/><path d="M${x + 14} ${y + 97} L${x + 446} ${y + 97}" stroke="#3B2412" stroke-width="5" opacity=".2" stroke-linecap="round"/><path d="M${x + 14} ${y + 265} L${x + 446} ${y + 265}" stroke="#E2BC8E" stroke-width="4" opacity=".55" stroke-linecap="round"/>`
    + `<rect x="${x + 188}" y="${y + 166}" width="84" height="20" rx="10" fill="#3B2412" opacity=".28"/><rect x="${x + 190}" y="${y + 160}" width="80" height="16" rx="8" fill="url(#v2metal)"/><rect x="${x + 198}" y="${y + 163}" width="64" height="3.5" rx="1.75" fill="#fff" opacity=".7"/>`;
  L.laptop = (x, y, s = 1, screen = '') => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="28" rx="230" ry="12" fill="#3B2412" opacity=".2"/><path d="M-190 0 L190 0 L215 26 L-215 26Z" fill="url(#v2lap)"/><path d="M-170 6 L170 6 L182 18 L-182 18Z" fill="#8E97A4" opacity=".5"/><rect x="-215" y="22" width="430" height="5" rx="2.5" fill="#8E97A4"/><rect x="-180" y="-250" width="360" height="250" rx="16" fill="#3B4252"/><rect x="-180" y="-250" width="360" height="250" rx="16" fill="none" stroke="#5A6478" stroke-width="3"/><rect x="-164" y="-234" width="328" height="218" rx="8" fill="url(#v2screen)"/><g transform="translate(-164 -234)">${screen}</g><path d="M-150 -234 L-60 -234 L-130 -16 L-164 -16 L-164 -200Z" fill="#fff" opacity=".14"/><circle cx="0" cy="-242" r="3" fill="#1E232C"/></g>`;
  L.papers = (x, y, n, o = {}) => {
    let s = n > 0 ? `<ellipse cx="${x + 6}" cy="${y + 2}" rx="118" ry="10" fill="#3B2412" opacity=".18"/>` : '';
    for (let i = 0; i < n; i++) { const j = Math.sin(i * 12.9898) * (o.mess || 12); s += `<g transform="rotate(${Math.sin(i * 7.1) * 2.2} ${x} ${y - i * 14})"><rect x="${x - 100 + j}" y="${y - (i + 1) * 14}" width="200" height="15" rx="3" fill="${i % 2 ? '#FFFFFF' : '#F4EFE6'}" stroke="#D7CCBB" stroke-width="2"/><rect x="${x - 98 + j}" y="${y - (i + 1) * 14 + 10}" width="196" height="4" fill="#3B2412" opacity=".07"/></g>`; }
    if (n > 0) { const j = Math.sin((n - 1) * 12.9898) * (o.mess || 12); s += `<g opacity=".3" fill="#8C7B66"><rect x="${x - 80 + j}" y="${y - n * 14 + 4}" width="110" height="2.5" rx="1"/><rect x="${x - 80 + j}" y="${y - n * 14 + 9}" width="150" height="2.5" rx="1"/></g>`; }
    return s;
  };
  L.bag = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="20" rx="112" ry="12" fill="#3B2412" opacity=".2"/><path d="M-60 -110 Q0 -190 60 -110" fill="none" stroke="#5E3A1E" stroke-width="16"/><path d="M-60 -110 Q0 -190 60 -110" fill="none" stroke="#8A5A34" stroke-width="9"/><rect x="-100" y="-120" width="200" height="140" rx="26" fill="#C9744A"/><rect x="-100" y="-60" width="200" height="80" rx="26" fill="#8E4A2A" opacity=".28"/><rect x="-88" y="-108" width="22" height="112" rx="11" fill="#fff" opacity=".14"/><rect x="-100" y="-120" width="200" height="40" rx="20" fill="#B5643D"/><path d="M-84 -84 L84 -84" stroke="#F0C9A8" stroke-width="2.5" stroke-dasharray="8 6" opacity=".7"/><rect x="-18" y="-90" width="36" height="28" rx="7" fill="#3B2412" opacity=".25"/><rect x="-16" y="-92" width="32" height="24" rx="6" fill="url(#v2metal)"/><rect x="-10" y="-88" width="20" height="4" rx="2" fill="#fff" opacity=".7"/></g>`;
  L.chair = (x, y, spin = 0) => `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="130" rx="130" ry="12" fill="#3B2412" opacity=".18"/><rect x="-16" y="-10" width="32" height="130" fill="#7A6E66"/><rect x="-16" y="-10" width="10" height="130" fill="#fff" opacity=".2"/><path d="M-110 125 L110 125" stroke="#5E544D" stroke-width="14" stroke-linecap="round"/><circle cx="-110" cy="132" r="10" fill="#3B3632"/><circle cx="110" cy="132" r="10" fill="#3B3632"/><g transform="scale(${Math.cos(spin).toFixed(3)} 1)"><rect x="-140" y="-300" width="280" height="270" rx="56" fill="#8FA9C4"/><rect x="-140" y="-150" width="280" height="120" rx="56" fill="#4E6A88" opacity=".25"/><rect x="-120" y="-280" width="240" height="100" rx="36" fill="#A9C0D8" opacity=".7"/><path d="M-96 -150 Q0 -138 96 -150" stroke="#5F7C9A" stroke-width="4" fill="none" opacity=".6"/></g><rect x="-160" y="-28" width="320" height="50" rx="24" fill="#5F7C9A"/><rect x="-160" y="-40" width="320" height="56" rx="26" fill="#7D97B3"/><rect x="-140" y="-34" width="280" height="12" rx="6" fill="#fff" opacity=".2"/></g>`;
  L.hayStrand = (x, y, len = 150, rot = -15) => `<path d="M${x} ${y} q${len * .4} ${-len * .25} ${len} ${-len * .1}" transform="rotate(${rot} ${x} ${y})" stroke="#A8B84E" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M${x + len * .6} ${y - len * .2} l18 -14" transform="rotate(${rot} ${x} ${y})" stroke="#A8B84E" stroke-width="6" stroke-linecap="round"/>`;
  L.stamp = (x, y, s = 1, rot = -12) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><circle r="36" fill="none" stroke="#E8473A" stroke-width="6"/><path d="M-16 0 L-4 13 L18 -14" fill="none" stroke="#E8473A" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  L.stamper = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="18" rx="42" ry="7" fill="#3B2412" opacity=".22"/><rect x="-22" y="-86" width="44" height="80" rx="14" fill="#8C5A3C"/><rect x="-16" y="-80" width="10" height="66" rx="5" fill="#fff" opacity=".25"/><rect x="8" y="-86" width="14" height="80" rx="7" fill="#3B2412" opacity=".2"/><rect x="-24" y="-18" width="48" height="10" rx="4" fill="url(#v2metal)"/><rect x="-34" y="-10" width="68" height="26" rx="6" fill="#C0392B"/><rect x="-34" y="-10" width="68" height="7" rx="3.5" fill="#E8695A"/><rect x="-34" y="9" width="68" height="7" rx="3.5" fill="#8E2318"/></g>`;

  // ---------- 効果（文字を使わない） ----------
  // 衝撃（ポン・ドン の代わり）：放射状の線
  L.impact = (x, y, k, s = 1, color = '#E8473A') => k <= 0 || k >= 1 ? '' : `<g transform="translate(${x} ${y}) scale(${s * (0.6 + k * .6)})" opacity="${1 - k}">${Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2; return `<path d="M${Math.cos(a) * 46} ${Math.sin(a) * 46} L${Math.cos(a) * 92} ${Math.sin(a) * 92}" stroke="${color}" stroke-width="10" stroke-linecap="round"/>`; }).join('')}</g>`;
  // チャイム（キンコーン の代わり）：音符と音の輪
  L.chime = (x, y, k, s = 1) => k <= 0 || k >= 1 ? '' : `<g transform="translate(${x} ${y}) scale(${s})" opacity="${1 - k * .7}">${[0, 1, 2].map(i => `<path d="M${-60 - i * 34 - k * 40} ${-40 - i * 10} q${-20} 40 0 80 M${60 + i * 34 + k * 40} ${-40 - i * 10} q20 40 0 80" stroke="#F2A33A" stroke-width="9" fill="none" stroke-linecap="round" opacity="${1 - i * .25}"/>`).join('')}<g fill="#F2A33A"><ellipse cx="-14" cy="34" rx="18" ry="14"/><rect x="0" y="-40" width="8" height="74"/><path d="M0 -40 q30 6 34 34 q-12 -16 -34 -14Z"/></g></g>`;
  // もぐもぐ の代わり：ほっぺの動き線
  L.munch = (x, y, t, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" stroke="#6C9A4A" stroke-width="7" fill="none" stroke-linecap="round" opacity=".85"><path d="M-30 ${-4 + Math.sin(t * 24) * 6} q-12 -10 -24 0"/><path d="M30 ${-4 - Math.sin(t * 24) * 6} q12 -10 24 0"/></g>`;
  L.check = (x, y, k, s = 1) => k <= 0 ? '' : `<g transform="translate(${x} ${y}) scale(${s * outBack(k)})"><circle cx="4" cy="8" r="72" fill="#3B2412" opacity=".2"/><circle r="70" fill="#5DBB63"/><path d="M-70 0 a70 70 0 0 0 140 0Z" fill="#3F9A4A" opacity=".45"/><path d="M-50 -30 A58 58 0 0 1 -6 -58" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round" opacity=".5"/><path d="M-30 4 L-6 30 L38 -22" fill="none" stroke="#2F7D3A" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" opacity=".5"/><path d="M-32 0 L-8 26 L36 -26" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  L.sparkles = (x, y, t, s = 1, n = 5) => `<g transform="translate(${x} ${y}) scale(${s})">${Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2 + t * 1.5, r = 90 + 20 * Math.sin(t * 6 + i), k = .6 + .4 * Math.sin(t * 9 + i * 2); return `<path transform="translate(${Math.cos(a) * r} ${Math.sin(a) * r}) scale(${k})" d="M0 -18 L5 -5 L18 0 L5 5 L0 18 L-5 5 L-18 0 L-5 -5Z" fill="#FFD45E"/><circle transform="translate(${Math.cos(a) * r} ${Math.sin(a) * r}) scale(${k})" r="4.5" fill="#FFF9E0"/>`; }).join('')}</g>`;
  L.speed = (cx, cy, a = 1, n = 44) => a <= 0 ? '' : `<g opacity="${a}">${Array.from({ length: n }, (_, i) => { const t = i / n * Math.PI * 2 + Math.sin(i * 3.3) * .05, r1 = 480 + Math.abs(Math.sin(i * 7.7)) * 160, r2 = 1600; return `<path d="M${cx + Math.cos(t) * r1} ${cy + Math.sin(t) * r1} L${cx + Math.cos(t + .02) * r2} ${cy + Math.sin(t + .02) * r2} L${cx + Math.cos(t - .02) * r2} ${cy + Math.sin(t - .02) * r2}Z" fill="#fff"/>`; }).join('')}</g>`;
  L.dust = (x, y, k) => k <= 0 || k >= 1 ? '' : `<g opacity="${1 - k}">${Array.from({ length: 9 }, (_, i) => { const a = i / 9 * Math.PI * 2, r = 50 + k * 200; return `<circle cx="${x + Math.cos(a) * r}" cy="${y + Math.sin(a) * r * .5}" r="${64 * (1 - k * .5)}" fill="#F3E6D3" stroke="#DCC9AC" stroke-width="5"/>`; }).join('')}</g>`;
  // 吹き出し（中は絵だけ）
  L.bubble = (x, y, inner, o = {}) => {
    const w = o.w || 300, h = o.h || 160, s = o.s == null ? 1 : o.s, tl = o.tail || -40;
    if (s <= 0) return '';
    return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="${-w / 2 + 6}" y="${-h + 10}" width="${w}" height="${h}" rx="${h / 2.4}" fill="#3B2412" opacity=".16"/><rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" rx="${h / 2.4}" fill="#fff" stroke="${PAL.ink}" stroke-width="7"/><rect x="${-w / 2 + 14}" y="${-h * .42}" width="${w - 28}" height="${h * .36}" rx="${h * .18}" fill="#F3EADB" opacity=".6"/><path d="M${tl - 20} -4 L${tl} 46 L${tl + 26} -4Z" fill="#fff" stroke="${PAL.ink}" stroke-width="7" stroke-linejoin="round"/><rect x="${tl - 16}" y="-12" width="40" height="12" fill="#fff"/><g transform="translate(0 ${-h / 2})">${inner}</g></g>`;
  };
  L.qmark = (x, y, s = 1) => `<text x="${x}" y="${y}" font-size="${110 * s}" font-weight="900" text-anchor="middle" dominant-baseline="central" font-family="Noto Sans CJK JP" fill="#E8473A" stroke="#fff" stroke-width="${12 * s}" paint-order="stroke">?</text>`;
  L.emark = (x, y, s = 1, ch = '!') => `<text x="${x}" y="${y}" font-size="${130 * s}" font-weight="900" text-anchor="middle" font-family="Noto Sans CJK JP" fill="#E8473A" stroke="#fff" stroke-width="${18 * s}" paint-order="stroke">${ch}</text>`;

  // ---------- 載せる・動かす ----------
  const set = (id, s) => { const n = document.getElementById(id); if (n) n.innerHTML = s || ''; };
  // sc: { bg, back, fx, ui, cam:{z,cx,cy}, shake(px), dim }
  L.mount = function (sc) {
    set('bg', L.defs() + (sc.bg || '')); set('back', sc.back); set('fx', sc.fx); set('ui', sc.ui);
    const c = sc.cam || { z: 1, cx: 540, cy: 960 };
    const sh = sc.shake || 0, t = sc.t || 0;
    const dx = sh ? Math.sin(t * 91) * sh : 0, dy = sh ? Math.cos(t * 77) * sh * .6 : 0;
    const w = document.getElementById('world');
    if (w) w.style.transform = `translate(${(540 - c.cx * c.z + dx).toFixed(2)}px, ${(960 - c.cy * c.z + dy).toFixed(2)}px) scale(${c.z.toFixed(4)})`;
    const d = document.getElementById('dim'); if (d) d.style.opacity = sc.dim || 0;
  };
  // ---------- 動きの部品（総見直し 2026-11-10・OVERHAUL 43〜49・73・88）----------
  // どれも「パラメータの上書き」を返す。Object.assign(pose, L.xxx(...)) で使う。y は yOff（上向きが負）
  // ため：動く前に少し縮む（t0 が動き出し。直前 dur 秒）
  L.anticip = (t, t0, dur = .18) => { const u = seg(t, t0 - dur, t0); return u > 0 && u < 1 ? { bodySquash: -.28 * Math.sin(Math.PI * u * .5) } : {}; };
  // 着地のつぶれ（tl が着地の瞬間）
  L.land = (t, tl, dur = .22) => { const u = seg(t, tl, tl + dur); return u > 0 && u < 1 ? { bodySquash: -.32 * Math.sin(Math.PI * u) } : {}; };
  // 驚いて飛び上がる（t0 から .5 秒）：ため→跳ぶ→着地。耳がはね、目が丸く
  L.startle = (t, t0) => { const u = seg(t, t0, t0 + .5); if (u <= 0 || u >= 1) return {}; const up = Math.sin(Math.PI * Math.min(1, u / .8));
    return { yOff: -110 * up, bodySquash: u < .12 ? -.3 : u > .85 ? -.25 : .2 * up, earL: -18 * up, earR: 18 * up, eyeOpen: 1.15, excl: 1 }; };
  // がっかり：耳が下がり、体がしぼむ（t0 から .6 秒かけて。以後そのまま）
  L.droop = (t, t0) => { const k = ease(seg(t, t0, t0 + .6)); return k <= 0 ? {} : { earL: 22 * k, earR: -22 * k, bodySquash: -.12 * k, headNod: 14 * k, headTilt: -6 * k, ...(k > .5 ? { eyeShape: 'half' } : {}) }; };
  // うれしい：ビンキー（跳んで空中で体をひねる）。t0 から .55 秒
  L.binky = (t, t0) => { const u = seg(t, t0, t0 + .55); if (u <= 0 || u >= 1) return {}; const up = Math.sin(Math.PI * u);
    return { yOff: -130 * up, bodyTilt: 26 * Math.sin(Math.PI * 2 * u), headTilt: -18 * Math.sin(Math.PI * 2 * u), bodySquash: u < .1 || u > .9 ? -.25 : .15 * up }; };
  // 走って入る：x0→x1 を t0〜t1 で（うさぎ跳び＋土ぼこり）。いきなり出ない・消えない
  L.runIn = (t, t0, t1, x0, x1, groundY) => { const h = RIG.hop(t, t0, t1, x0, x1, { height: 40 }); const k = h.moving ? ((t - t0) * 6) % 1 : -1;
    return { x: h.x, yOff: h.yOff, bodySquash: h.squash, vx: h.vx, dust: h.moving && groundY != null ? L.dust(h.x + (x1 > x0 ? 80 : 320), groundY, Math.max(0.01, k) * .6) : '' }; };
  // 待機中の生命感：耳のぴくっ（ランダムな間隔・seed で固定）
  L.twitch = (t, seed = 1) => { const n = Math.floor(t / 1.3 + seed), on = Math.sin(n * 91.7 + seed) > .55, u = (t / 1.3 + seed) % 1;
    return on && u < .25 ? { earL: 9 * Math.sin(Math.PI * u / .25 * 2), earR: -6 * Math.sin(Math.PI * u / .25 * 2) } : {}; };
  // 足元の影（総見直し 2026-11-10・OVERHAUL 61/62）：キャラが浮いて見えないよう、いつも足元に影。
  //   跳んでいる間（足が「地面」より上）は影を地面に残したまま小さく・薄くする＝高さが分かる。
  //   地面＝直近の足の位置。0.6秒以上上にいる（机に乗ったなど）ときは、そこを新しい地面にする。
  L._ground = {};
  L.footShadow = function (svg, id, q, t) {
    const s = q.scale || 1, fx = q.x + 200 * s, fy = q.y + 410 * s;
    let g = L._ground[id];
    if (!g || fy >= g.y - 2 || Math.abs(t - g.t) > 1.5 || (t - (g.up || t)) > 0.6) g = L._ground[id] = { y: fy, t, up: null };
    else { g.t = t; if (g.up == null) g.up = t; }
    if (fy >= g.y - 2) g.up = null;
    const h = Math.max(0, g.y - fy), k = Math.max(0.35, 1 - h / (260 * s));
    const sh = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    sh.setAttribute('cx', fx); sh.setAttribute('cy', g.y - 4 * s); sh.setAttribute('rx', 150 * s * k); sh.setAttribute('ry', 20 * s * k);
    sh.setAttribute('fill', '#5A3A1E'); sh.setAttribute('opacity', (0.2 * k).toFixed(3)); sh.setAttribute('data-shadow', '1');
    svg.insertBefore(sh, svg.firstChild.nextSibling);
  };
  // キャラ：本番の RIG で描き、手前の小物（front）を同じ層に重ねる。alive で瞬き・呼吸・耳の揺れ
  L.char = function (id, p, t, front, opt) {
    const svg = document.getElementById(id); if (!svg) return;
    // 待機中の耳のぴくっ（OVERHAUL 50）：耳の角度に足すだけ（台本の耳の動きは消さない）
    if (p && !(opt && opt.twitch === false)) { const tw = L.twitch(t, id === 'ren' ? 1 : 2); if (tw.earL) p = Object.assign({}, p, { earL: (p.earL || 0) + tw.earL, earR: (p.earR || 0) + tw.earR }); }
    if (p) { const q = RIG.render(svg, RIG.alive(Object.assign({ char: id }, p), t, opt || {})); if (!(opt && opt.shadow === false)) L.footShadow(svg, id, q, t); }
    else { svg.innerHTML = ''; delete L._ground[id]; }
    if (front) svg.insertAdjacentHTML('beforeend', front);
  };
  // カメラ：keys=[{t,z,cx,cy,d}]。各キーへ d 秒（既定 .6）でなめらかに
  L.camAt = function (keys, t) {
    let cur = { z: keys[0].z, cx: keys[0].cx, cy: keys[0].cy };
    for (let i = 1; i < keys.length; i++) {
      const k = keys[i]; if (t < k.t) break;
      const u = ease(seg(t, k.t, k.t + (k.d || .6)));
      cur = { z: lerp(cur.z, k.z, u), cx: lerp(cur.cx, k.cx, u), cy: lerp(cur.cy, k.cy, u) };
    }
    // ゆっくり寄り続ける（止まって見えないように）
    const drift = keys.drift == null ? .006 : keys.drift;
    cur.z *= 1 + drift * Math.sin(t * .9);
    return cur;
  };
  if (typeof window.camera !== 'function') window.camera = c => { const w = document.getElementById('world'); if (w) w.style.transform = `translate(${540 - c.cx * c.z}px, ${960 - c.cy * c.z}px) scale(${c.z})`; };
  window.L = L;
})();
