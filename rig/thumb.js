// サムネイル生成: node thumb.js <ep> <t秒> "<cam z,cx,cy>" "<EN hook/JA sub>" "<EP.N>" <出力jpg> [variant A|B|C]
// 海外にも届くよう、上段は英語（大）、下段は日本語（小）。話数は載せない（後で削除・入替しても矛盾しないように）。<EP.N>引数は互換のため残すが未使用。
// A: 上に大きな文字＋下にチップ  B: 下に文字  C: 文字なし（チップのみ）
// 文字とチップは縦の中央 1080x1440（3:4）の範囲に収める：Instagram/TikTokのプロフィールグリッドは中央を切り抜くため
// 終了コード：3=文字がグリッド外/重なり 4=顔がない 5=見出しが小さい 6=キャラが端で中途半端に切れる 7=文字の背景がごちゃつく 8=直近の回と見出しが揃わない
const { chromium } = require('playwright');
const [ep, t, cam, hook, no, out, variant = 'A'] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto(`file://${__dirname}/ep.html?ep=${ep}&cam=${cam}`); await p.waitForTimeout(600);
  await p.evaluate(t => window.setFrame(t), parseFloat(t));
  await p.evaluate(({ hook, no, variant }) => {
    const css = `
      .th{position:fixed;left:0;right:0;z-index:99;font-family:'Noto Sans CJK JP','Zen Maru Gothic',sans-serif;text-align:center;pointer-events:none}
      .hook{font-weight:900;font-size:138px;line-height:1.05;color:#FFF7E8;letter-spacing:.01em;font-family:'Noto Sans','Noto Sans CJK JP',sans-serif;
            -webkit-text-stroke:14px #5A3A1E;paint-order:stroke fill;text-shadow:0 16px 0 #5A3A1E,0 30px 40px rgba(60,35,10,.35)}
      .hook small{display:block;font-size:66px;color:#FFD86B;margin-top:14px;font-family:'Noto Sans CJK JP',sans-serif;letter-spacing:.04em}
      .chip{position:fixed;left:0;right:0;top:700px;z-index:99;display:flex;justify-content:center;align-items:center;gap:22px;font-family:'Noto Sans CJK JP',sans-serif}
      .chip .n{background:#C9962F;color:#fff;font-weight:900;font-size:60px;font-family:'Noto Sans',sans-serif;padding:14px 38px;border-radius:999px;border:8px solid #FFF7E8;box-shadow:0 8px 0 #5A3A1E}
      .chip .s{background:#355F86;color:#fff;font-weight:700;font-size:42px;font-family:'Noto Sans',sans-serif;letter-spacing:.06em;padding:16px 34px;border-radius:999px;border:8px solid #FFF7E8;box-shadow:0 8px 0 #5A3A1E}
      .frame{position:fixed;inset:0;z-index:98;box-shadow:inset 0 0 0 26px #FFF7E8, inset 0 0 0 40px #C9962F;pointer-events:none}`;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    document.body.insertAdjacentHTML('beforeend', `<div class="frame"></div><div class="chip"><span class="s">REN &amp; JILL</span></div>`);
    if (variant !== 'C') {
      const [l1, l2] = hook.split('/');
      const d = document.createElement('div'); d.className = 'th hook';
      d.style[variant === 'A' ? 'top' : 'bottom'] = variant === 'A' ? '450px' : '500px'; // 中央3:4／1:1の切り抜き（プロフィールのグリッド）でも文字が見える安全域に置く
      d.innerHTML = l2 ? `${l1}<small>${l2}</small>` : l1; document.body.appendChild(d);
    }
    // 自動フィット（2026-10-21）：文字数に関係なく、英語の見出しは枠の幅の約80%（既存の「CAMERA OFF」「APPROVED.」と同じくらい）、
    // 日本語は約50%の幅になるよう文字の大きさを合わせる。ただし大きくするのは元の大きさ（英語138px・日本語66px）の1.3倍まで。
    // 長い見出しは同じ幅まで小さくする（最小は英語70px・日本語40px）。チップは文字のすぐ下に置く
    const d = document.querySelector('.hook');
    if (d) {
      const fit = (el, target, base, min) => { el.style.whiteSpace = 'nowrap';
        const rg = document.createRange(); const width = fs => { el.style.fontSize = fs + 'px'; rg.selectNodeContents(el.firstChild || el); return rg.getBoundingClientRect().width; };
        const w0 = width(base); let fs = Math.floor(base * target / w0);           // 幅は文字の大きさにほぼ比例する
        fs = Math.max(min, Math.min(Math.floor(base * 1.3), fs));
        while (width(fs) > target && fs > min) fs -= 1;                          // 目標の幅を超えない大きさに詰める
        return fs; };
      const sm = d.querySelector('small'); const main = document.createElement('span'); main.textContent = d.firstChild.textContent; d.replaceChild(main, d.firstChild); main.style.display = 'block';
      fit(main, 860, 138, 70); if (sm) fit(sm, 540, 66, 40);
      const r = d.getBoundingClientRect(); const chip = document.querySelector('.chip'); if (chip && variant === 'A') chip.style.top = Math.round(r.bottom + 28) + 'px';
    }
  }, { hook, no, variant });
  // グリッド切り抜きチェック：Instagram/TikTokのプロフィールは中央3:4（y 240〜1680）だけを表示する。
  // 文字・チップが1pxでもはみ出たら失敗させ、投稿を止める（2026-10-19の見切れ事故の再発防止）。
  const SAFE = { top: 240 + 40, bottom: 1680 - 40, left: 40, right: 1040 };
  const m = await p.evaluate(() => {
    const u = rs => { const a = [...rs].filter(r => r.width > 0); return a.length ? { top: Math.min(...a.map(r => r.top)), bottom: Math.max(...a.map(r => r.bottom)), left: Math.min(...a.map(r => r.left)), right: Math.max(...a.map(r => r.right)) } : null; };
    const h = document.querySelector('.hook'); let text = null; if (h) { const rs = []; const w = document.createTreeWalker(h, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const rg = document.createRange(); rg.selectNodeContents(n); rs.push(...rg.getClientRects()); } text = u(rs); }
    const c = document.querySelector('.chip .s'); const chip = c ? c.getBoundingClientRect().toJSON() : null;
    const line = el => { if (!el) return null; const rg = document.createRange(); rg.selectNodeContents(el); const r = rg.getBoundingClientRect(); return { width: Math.round(r.width), height: Math.round(r.height), fontSize: parseFloat(el.style.fontSize) }; };
    return { text, chip, en: line(h && h.querySelector('span')), ja: line(h && h.querySelector('small')) };
  });
  // 見出しの幅チェック（2026-10-21）：英語の見出しが枠の幅の 70% 未満なら、プロフィールの一覧で文字が小さく見えるので失敗させる。
  // （1.3倍まで大きくしても届かない短い見出しのとき。見出しの言葉を少し長くして作り直す）
  const MIN_EN_RATIO = 0.70;
  if (variant !== 'C' && m.en && m.en.width < 1080 * MIN_EN_RATIO) { console.error('THUMB_NARROW', JSON.stringify({ en: m.en, min: Math.round(1080 * MIN_EN_RATIO) })); await b.close(); process.exit(5); }
  // ---- 追加チェック（2026-10-21）。NG なら作り直し（cam・t・hook を変える）
  // (a) キャラの切れ：枠（1080x1920）の中に体の一部が写っているのに、顔（鼻）が枠の内側（端から60px以上内側）にないキャラがいたら NG
  //     （例：上の端に課長のあごとネクタイだけが写る）
  const chars = await p.evaluate(() => ['ren', 'jil'].map(id => {
    const svg = document.getElementById(id); if (!svg) return null;
    const rs = [...svg.querySelectorAll('path,ellipse,circle,rect,polygon,line,g > use')].map(n => n.getBoundingClientRect()).filter(r => r.width > 0 && r.height > 0);
    if (!rs.length) return { id, visible: 0 };
    const box = { left: Math.min(...rs.map(r => r.left)), top: Math.min(...rs.map(r => r.top)), right: Math.max(...rs.map(r => r.right)), bottom: Math.max(...rs.map(r => r.bottom)) };
    // 見えている面積（枠と重なる部分。各パーツの重なりの合計を上限で丸める）
    const inter = r => Math.max(0, Math.min(r.right, 1080) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, 1920) - Math.max(r.top, 0));
    const visible = Math.min(1080 * 1920, rs.reduce((s, r) => s + inter(r), 0));
    const nose = [...svg.querySelectorAll('path[fill="#C88D85"],path[fill="#D98F8E"]')].map(n => n.getBoundingClientRect()).find(r => r.width > 0);
    return { id, box, visible: Math.round(visible), nose: nose ? { x: Math.round(nose.left + nose.width / 2), y: Math.round(nose.top + nose.height / 2) } : null };
  }).filter(Boolean));
  const EDGE = 60, MIN_VISIBLE = 1080 * 1920 * 0.005;
  const cut = chars.filter(c => c.visible > MIN_VISIBLE && !(c.nose && c.nose.x > EDGE && c.nose.x < 1080 - EDGE && c.nose.y > EDGE && c.nose.y < 1920 - EDGE));
  if (cut.length) { console.error('THUMB_CUT_CHARACTER', JSON.stringify(cut.map(c => ({ id: c.id, nose: c.nose, box: c.box })))); await b.close(); process.exit(6); }

  // (b) 文字の背景のごちゃつき：文字とチップを消した絵で、文字の範囲（英語・日本語・チップ）の背景のエッジ（明るさの急な変化）の割合を測る。
  //     多すぎる（机の天板の線・毛並み・小物が文字の後ろにある）と読みにくいので NG
  const zones = await p.evaluate(() => {
    const rect = el => { if (!el) return null; const rg = document.createRange(); rg.selectNodeContents(el); const r = rg.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
    const h = document.querySelector('.hook'); const c = document.querySelector('.chip .s');
    const out = { en: rect(h && h.querySelector('span')), ja: rect(h && h.querySelector('small')), chip: c ? (r => ({ x: r.left, y: r.top, w: r.width, h: r.height }))(c.getBoundingClientRect()) : null };
    document.querySelectorAll('.th,.chip,.frame').forEach(e => { e.style.visibility = 'hidden'; });
    return out;
  });
  const busy = {};
  for (const [k, z] of Object.entries(zones)) {
    if (!z) continue;
    const clip = { x: Math.max(0, Math.round(z.x - 12)), y: Math.max(0, Math.round(z.y - 12)), width: Math.round(Math.min(1080, z.w + 24)), height: Math.round(z.h + 24) };
    const png = (await p.screenshot({ clip, type: 'png' })).toString('base64');
    busy[k] = await p.evaluate(async b64 => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const g = cv.getContext('2d'); g.drawImage(img, 0, 0);
      const { data, width, height } = g.getImageData(0, 0, cv.width, cv.height);
      const L = (x, y) => { const i = (y * width + x) * 4; return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]; };
      let n = 0, edge = 0;
      for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) { n++; if (Math.abs(L(x + 1, y) - L(x - 1, y)) + Math.abs(L(x, y + 1) - L(x, y - 1)) > 48) edge++; }
      return Math.round(edge / n * 1000) / 10; // %
    }, png);
  }
  await p.evaluate(() => document.querySelectorAll('.th,.chip,.frame').forEach(e => { e.style.visibility = ''; }));
  const BUSY_MAX = 3.0; // %（文字の範囲の背景のうち、強いエッジの画素の割合の上限）
  const busyNg = Object.entries(busy).filter(([, v]) => v > BUSY_MAX);
  if (busyNg.length) { console.error('THUMB_BUSY_BACKGROUND', JSON.stringify({ busy, max: BUSY_MAX })); await b.close(); process.exit(7); }

  // (c) 直近の回との揃い：同じフォルダの <ep>_thumb.json（作ったときの寸法）の直近6本の中央値と比べ、
  //     英語の見出しの幅・高さ・位置、チップの位置が大きくずれていたら NG
  const fs = require('fs'), path = require('path');
  const dir = path.dirname(path.resolve(out));
  const me = { ep, en: m.en && { width: m.en.width, height: m.en.height, top: Math.round(m.text.top) }, chipTop: m.chip ? Math.round(m.chip.top) : null, busy, made: new Date().toISOString() };
  const others = fs.readdirSync(dir).filter(f => f.endsWith('_thumb.json') && f !== `${ep}_thumb.json`)
    .map(f => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { return null; } })
    .filter(o => o && o.en).sort((a, b) => String(b.made).localeCompare(String(a.made))).slice(0, 6);
  if (variant !== 'C' && me.en && others.length >= 3) {
    const med = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
    const ref = { width: med(others.map(o => o.en.width)), height: med(others.map(o => o.en.height)), top: med(others.map(o => o.en.top)), chipTop: med(others.map(o => o.chipTop)) };
    const off = [];
    if (Math.abs(me.en.width - ref.width) > ref.width * 0.08) off.push('幅');
    if (me.en.height < ref.height * 0.55 || me.en.height > ref.height * 1.6) off.push('高さ');
    if (Math.abs(me.en.top - ref.top) > 60) off.push('位置');
    if (Math.abs(me.chipTop - ref.chipTop) > 160) off.push('チップの位置');
    if (off.length) { console.error('THUMB_NOT_ALIGNED', JSON.stringify({ off, me: { ...me.en, chipTop: me.chipTop }, ref, compared: others.map(o => o.ep) })); await b.close(); process.exit(8); }
  }

  // 顔チェック：グリッド（中央3:4）の中、文字より下に、少なくとも1匹の顔（鼻）が十分な大きさで写っていること
  const faces = await p.evaluate(() => ['#C88D85', '#D98F8E'].map(c => { const n = document.querySelector(`path[fill="${c}"]`); if (!n) return null; const r = n.getBoundingClientRect(); return r.width < 1 ? null : { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; }).filter(Boolean));
  const chipBottom = m.chip ? m.chip.bottom : 800;
  const goodFace = faces.some(f => f.x > 150 && f.x < 930 && f.y > chipBottom + 120 && f.y < 1600 && f.w >= 22);
  if (!goodFace) { console.error('THUMB_NO_FACE', JSON.stringify({ faces, chipBottom })); await b.close(); process.exit(4); }
  const out_of = b => b && (b.top < SAFE.top || b.bottom > SAFE.bottom || b.left < SAFE.left || b.right > SAFE.right);
  const overlap = m.text && m.chip && m.text.bottom > m.chip.top - 8 && m.text.top < m.chip.bottom;
  if (out_of(m.text) || out_of(m.chip) || overlap) { console.error('THUMB_UNSAFE', JSON.stringify({ ...m, overlap })); await b.close(); process.exit(3); }
  await p.screenshot({ path: out, type: 'jpeg', quality: 92 });
  fs.writeFileSync(out.replace(/\.jpg$/, '.json'), JSON.stringify(me, null, 1)); // 次の回の揃いチェックに使う寸法
  await b.close(); console.log('thumb', out, JSON.stringify({ en: m.en, ja: m.ja, busy }));
})();
