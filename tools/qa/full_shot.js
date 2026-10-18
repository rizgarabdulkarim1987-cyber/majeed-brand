const { chromium } = require('playwright'); const path = require('path');
const [, , html, out, W, H, pg = 'index.html'] = process.argv;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: +W, height: +H } });
  await page.goto('file://' + path.resolve(html)); await page.waitForTimeout(1200);
  if (pg !== 'index.html') await page.evaluate((p) => window.__go(p), pg);
  await page.waitForTimeout(800);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 400) { await page.evaluate((y) => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, y); }, y); await page.waitForTimeout(220); }
  await page.waitForTimeout(1500);
  await page.evaluate(() => { const st = document.createElement('style'); st.textContent = '.floating-system{display:none!important}'; document.head.appendChild(st); scrollTo(0, 0); });
  await page.mouse.move(2, 2); await page.waitForTimeout(600);
  await page.screenshot({ path: out, fullPage: true });
  console.log(pg, W, 'height', total);
  await browser.close();
})();
