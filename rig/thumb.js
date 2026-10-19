// サムネイル生成: node thumb.js <ep> <t秒> "<cam z,cx,cy>" "<EN hook/JA sub>" "<EP.N>" <出力jpg> [variant A|B|C]
// 海外にも届くよう、上段は英語（大）、下段は日本語（小）。話数は載せない（後で削除・入替しても矛盾しないように）。<EP.N>引数は互換のため残すが未使用。
// A: 上に大きな文字＋下にチップ  B: 下に文字  C: 文字なし（チップのみ）
// 文字とチップは縦の中央 1080x1440（3:4）の範囲に収める：Instagram/TikTokのプロフィールグリッドは中央を切り抜くため
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
    // 自動フィット：英語の見出しが1行に収まるまで文字を小さくし、日本語も1行に。チップは文字のすぐ下に置く
    const d = document.querySelector('.hook');
    if (d) {
      const fit = (el, max, min) => { let fs = max; el.style.whiteSpace = 'nowrap'; el.style.fontSize = fs + 'px';
        const rg = document.createRange(); const width = () => { rg.selectNodeContents(el.firstChild || el); return rg.getBoundingClientRect().width; };
        while (width() > 940 && fs > min) { fs -= 4; el.style.fontSize = fs + 'px'; } return fs; };
      const sm = d.querySelector('small'); const main = document.createElement('span'); main.textContent = d.firstChild.textContent; d.replaceChild(main, d.firstChild); main.style.display = 'block';
      fit(main, 138, 70); if (sm) fit(sm, 66, 40);
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
    return { text, chip };
  });
  // 顔チェック：グリッド（中央3:4）の中、文字より下に、少なくとも1匹の顔（鼻）が十分な大きさで写っていること
  const faces = await p.evaluate(() => ['#C88D85', '#D98F8E'].map(c => { const n = document.querySelector(`path[fill="${c}"]`); if (!n) return null; const r = n.getBoundingClientRect(); return r.width < 1 ? null : { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; }).filter(Boolean));
  const chipBottom = m.chip ? m.chip.bottom : 800;
  const goodFace = faces.some(f => f.x > 150 && f.x < 930 && f.y > chipBottom + 120 && f.y < 1600 && f.w >= 22);
  if (!goodFace) { console.error('THUMB_NO_FACE', JSON.stringify({ faces, chipBottom })); await b.close(); process.exit(4); }
  const out_of = b => b && (b.top < SAFE.top || b.bottom > SAFE.bottom || b.left < SAFE.left || b.right > SAFE.right);
  const overlap = m.text && m.chip && m.text.bottom > m.chip.top - 8 && m.text.top < m.chip.bottom;
  if (out_of(m.text) || out_of(m.chip) || overlap) { console.error('THUMB_UNSAFE', JSON.stringify({ ...m, overlap })); await b.close(); process.exit(3); }
  await p.screenshot({ path: out, type: 'jpeg', quality: 92 });
  await b.close(); console.log('thumb', out);
})();
