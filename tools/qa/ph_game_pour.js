// frames during the pour (step 5) on a phone
const { chromium } = require('playwright'); const path = require('path');
const [, , html, out, lang = 'en', W = '393', H = '852'] = process.argv;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--allow-file-access-from-files'] });
  const ctx = await browser.newContext({ viewport: { width: +W, height: +H - 190 }, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto('file://' + path.resolve(html)); await page.waitForTimeout(1200);
  if (lang !== 'en') await page.evaluate((l) => window.__go(l + '.html'), lang);
  await page.waitForSelector('.teagame');
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('.teagame').scrollIntoView({ block: 'start' }); });
  await page.waitForFunction('window.__mjGame', null, { timeout: 120000 }); await page.waitForTimeout(1500);
  await page.evaluate(() => { window.__mjGame.running = false; window.__mjGame.manual = true; });
  const seq = [[1, 9.6], [2, 8.5], [3, 5], [4, 11]];
  for (const [n, t] of seq) await page.evaluate(([n, t]) => { window.__mjGame.run(n); window.__mjGame.advance(t); }, [n, t]);
  await page.evaluate(() => { window.__mjGame.run(5); });
  const times = [1.2, 1.6, 1.6, 2.5];
  let k = 0;
  for (const t of times) { await page.evaluate((t) => window.__mjGame.advance(t), t); await page.evaluate(() => { const s = document.querySelector('.gm-stage'); scrollTo(0, s.getBoundingClientRect().top + scrollY - 70); }); await page.waitForTimeout(250); const st = await page.$('.gm-stage'); await st.screenshot({ path: path.join(out, `pour_${lang}_${W}_${k++}.png`) }); }
  await browser.close();
})();
