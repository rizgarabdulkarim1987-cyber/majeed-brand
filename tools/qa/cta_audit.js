// every call-to-action link on every page: is it what a finger would hit at its centre (and its four corners)?
const { chromium } = require('playwright'); const path = require('path');
const [, , html, W = '393', H = '852'] = process.argv;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const ctx = await browser.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1, isMobile: process.env.MOB !== '0', hasTouch: process.env.MOB !== '0' });
  const page = await ctx.newPage();
  await page.goto('file://' + path.resolve(html)); await page.waitForTimeout(1500);
  const pages = await page.evaluate(() => Object.keys(window.__PAGES).filter((k) => /^(index|ar|ku|en-products|ar-products|ku-products|en-about|ar-about|ku-about|en-contact|ku-contact|en-factories)\.html$|golden|cardamom-800g/.test(k)));
  let bad = 0, total = 0;
  for (const p of pages) {
    await page.evaluate((p) => window.__go(p), p); await page.waitForTimeout(700);
    const n = await page.evaluate(() => document.querySelectorAll('.visual-cta, .text-button, .hero-actions a, .nav nav a, .brand, .moment-tabs button, .product-index button, .gm-step, .gm-prod, .hero-dots button, .send-button, .back-link, .footer-bottom a, .footer-top a').length);
    for (let i = 0; i < n; i++) {
      await page.evaluate((i) => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelectorAll('.visual-cta, .text-button, .hero-actions a, .nav nav a, .brand, .moment-tabs button, .product-index button, .gm-step, .gm-prod, .hero-dots button, .send-button, .back-link, .footer-bottom a, .footer-top a')[i].scrollIntoView({ block: 'center' }); }, i);
      await page.waitForTimeout(120);
      const r = await page.evaluate((i) => {
        const c = document.querySelectorAll('.visual-cta, .text-button, .hero-actions a, .nav nav a, .brand, .moment-tabs button, .product-index button, .gm-step, .gm-prod, .hero-dots button, .send-button, .back-link, .footer-bottom a, .footer-top a')[i]; const b = c.getBoundingClientRect();
        if (!b.width || getComputedStyle(c).display === 'none') return null;
        const pts = [[.5, .5], [.15, .5], [.85, .5], [.5, .2], [.5, .8]].map(([fx, fy]) => { const x = b.left + b.width * fx, y = b.top + b.height * fy; const t = document.elementFromPoint(x, y); return t && (t === c || c.contains(t)); });
        return { ok: pts.every(Boolean), pts: pts.map((v) => (v ? 1 : 0)).join(''), label: (c.innerText || '').trim().slice(0, 24), href: c.getAttribute('href') };
      }, i);
      if (!r) continue; total++;
      if (!r.ok) { bad++; console.log('BLOCKED', p, JSON.stringify(r)); }
    }
  }
  console.log('checked', total, 'links on', pages.length, 'pages; blocked:', bad);
  await browser.close();
})();
