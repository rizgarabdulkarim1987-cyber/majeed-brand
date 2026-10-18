// viewport screenshots of named sections at a desktop size: node sec_shot.js html out W H lang page name=selector ...
const { chromium } = require('playwright'); const path = require('path');
const [, , html, out, W, H, lang, pg, ...els] = process.argv;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: +W, height: +H } });
  await page.goto('file://' + path.resolve(html)); await page.waitForTimeout(1200);
  await page.evaluate((p) => window.__go(p), pg); await page.waitForTimeout(900);
  for (const spec of els) {
    const [name, sel] = spec.split('=');
    await page.evaluate((s) => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector(s); if (e) scrollTo(0, e.getBoundingClientRect().top + scrollY - 100); }, sel);
    await page.waitForTimeout(1600); await page.mouse.move(2, 2);
    await page.screenshot({ path: path.join(out, `${name}_${lang}_${W}.png`) });
  }
  await browser.close();
})();
