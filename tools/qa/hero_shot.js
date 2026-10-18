const { chromium } = require('playwright'); const path = require('path');
const [, , html, out, W, H, lang = 'en', waitMs = '1500'] = process.argv;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: +W, height: +H } });
  await page.goto('file://' + path.resolve(html)); await page.waitForTimeout(800);
  if (lang !== 'en') await page.evaluate((l) => window.__go(l + '.html'), lang);
  await page.waitForTimeout(+waitMs);
  await page.mouse.move(2, 2);
  await page.screenshot({ path: out });
  await browser.close();
})();
