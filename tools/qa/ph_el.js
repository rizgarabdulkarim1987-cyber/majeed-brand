// element screenshots on a phone: node ph_el.js <html> <out> <lang> <page> <W> <H> <name>=<css selector> ...
const { chromium } = require('playwright'); const path = require('path');
const [, , html, out, lang, pg, W, H, ...els] = process.argv;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const ctx = await browser.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto('file://' + path.resolve(html)); await page.waitForTimeout(1500);
  await page.evaluate((p) => window.__go(p), pg); await page.waitForTimeout(900);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 600) { await page.evaluate((y) => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, y); }, y); await page.waitForTimeout(120); }
  await page.evaluate(() => { const st = document.createElement('style'); st.textContent = '*,*:before,*:after{animation:none!important;transition:none!important}.floating-system{display:none!important}'; document.head.appendChild(st); });
  for (const spec of els) {
    const [name, sel] = spec.split('=');
    const h = await page.$(sel); if (!h) { console.log('missing', sel); continue; }
    await h.scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
    await h.screenshot({ path: path.join(out, `${name}_${lang}_${W}.png`) });
  }
  await browser.close();
})();
