// phone layout audit: which visible text / controls overlap each other?
const { chromium } = require('playwright'); const path = require('path');
const [, , html, W = '393', H = '852', pagesArg = 'index.html,ar.html,ku.html,en-products.html,en-products-golden-600g.html,en-about.html,en-contact.html,en-factories.html', mob = '1'] = process.argv;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const ctx = await browser.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1, isMobile: mob === '1', hasTouch: mob === '1' });
  const page = await ctx.newPage();
  await page.goto('file://' + path.resolve(html)); await page.waitForTimeout(1500);
  for (const p of pagesArg.split(',')) {
    await page.evaluate((p) => window.__go(p), p); await page.waitForTimeout(900);
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += 600) { await page.evaluate((y) => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, y); }, y); await page.waitForTimeout(120); }
    await page.evaluate(() => { scrollTo(0, 0); const st = document.createElement('style'); st.textContent = '*,*:before,*:after{animation:none!important;transition:none!important}'; document.head.appendChild(st); });
    await page.waitForTimeout(500);
    const res = await page.evaluate(() => {
      const vis = (e) => { for (let a = e; a && a !== document.documentElement; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return false; } return true; };
      const skip = (e) => e.closest('[aria-hidden="true"],svg,.leaves,.ticker,[inert],.lang-menu,.moment-image,.gm-stage,.hero-orbit,.facts-glow,.skip,.sr' + '');
      const clipRect = (e) => { let r = e.getBoundingClientRect(); let a = e.parentElement; while (a && a !== document.body) { const cs = getComputedStyle(a); if (/(auto|scroll|hidden)/.test(cs.overflowX) && a.clientWidth < a.scrollWidth + 1 && a !== document.documentElement) { const ar = a.getBoundingClientRect(); r = { left: Math.max(r.left, ar.left), right: Math.min(r.right, ar.right), top: Math.max(r.top, ar.top), bottom: Math.min(r.bottom, ar.bottom) }; } a = a.parentElement; } return r; };
      const items = [];
      for (const e of document.querySelectorAll('body *')) {
        if (skip(e) || !vis(e)) continue;
        const own = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
        const tag = e.tagName; const kind = own ? 'text' : (tag === 'IMG' || (e.classList.contains('pack') && e.getAttribute('role') === 'img')) ? 'img' : (tag === 'BUTTON' || (tag === 'A' && (e.classList.contains('visual-cta') || e.classList.contains('social-action') || e.classList.contains('primary-tea-action')))) ? 'ctl' : null;
        if (!kind) continue;
        let r = e.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) continue;
        // text boxes: shrink to the text itself
        if (own) { const rg = document.createRange(); rg.selectNodeContents(e); const rr = rg.getBoundingClientRect(); if (rr.width && rr.height) r = rr; }
        const c = clipRect(e); const L = Math.max(r.left, c.left), R = Math.min(r.right, c.right), T = Math.max(r.top, c.top), B = Math.min(r.bottom, c.bottom);
        if (R - L < 3 || B - T < 3) continue;
        items.push({ e, kind, L, R, T: T + scrollY, B: B + scrollY, name: tag.toLowerCase() + '.' + String(e.className).split(' ')[0] + (own ? ' "' + e.textContent.trim().slice(0, 22) + '"' : '') });
      }
      const out = [];
      for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
        const a = items[i], b = items[j];
        if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
        const w = Math.min(a.R, b.R) - Math.max(a.L, b.L), h = Math.min(a.B, b.B) - Math.max(a.T, b.T);
        if (w > 3 && h > 3 && w * h > 30) out.push({ k: a.kind + '/' + b.kind, a: a.name, b: b.name, at: Math.round(Math.max(a.T, b.T)), area: Math.round(w * h) });
      }
      return out;
    });
    const textish = res.filter((r) => r.k !== 'img/img');
    console.log('##', p, W + 'px', 'overlaps:', textish.length);
    for (const r of textish.slice(0, 40)) console.log('  ', r.k, '|', r.a, '<>', r.b, '| y', r.at, 'area', r.area);
  }
  await browser.close();
})();
