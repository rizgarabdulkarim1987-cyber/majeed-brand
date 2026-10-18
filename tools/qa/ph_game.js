// phone view of the tea game: section screenshot + game stage at several steps
const { chromium } = require('playwright'); const path = require('path');
const [, , html, out, lang = 'en', W = '393', H = '852', tag = 'a', stepsArg = '0'] = process.argv;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--allow-file-access-from-files'] });
  const ctx = await browser.newContext({ viewport: { width: +W, height: +H - 190 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const logs = [];
  page.on('pageerror', (e) => logs.push(String(e.message).slice(0, 200))); page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text().slice(0, 200)); });
  await page.goto('file://' + path.resolve(html)); await page.waitForTimeout(1200);
  if (lang !== 'en') await page.evaluate((l) => window.__go(l + '.html'), lang);
  await page.waitForSelector('.teagame');
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('.teagame').scrollIntoView({ block: 'start' }); });
  await page.waitForFunction('window.__mjGame', null, { timeout: 120000 }); await page.waitForTimeout(1500);
  await page.evaluate(() => { const g = window.__mjGame; g.running = false; });
  const info = await page.evaluate(() => { const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top + scrollY), Math.round(b.width), Math.round(b.height)]; }; return { vw: innerWidth, vh: innerHeight, section: r('.teagame'), heading: r('.teagame .section-heading'), picker: r('.gm-picker'), stage: r('.gm-stage'), steps: r('.gm-steps'), status: r('.gm-status') }; });
  console.log(JSON.stringify(info));
  const shot = async (name) => { await page.waitForTimeout(250); await page.screenshot({ path: path.join(out, `g_${name}_${lang}_${tag}.png`) }); };
  // scroll so the heading is at the top of the screen, then so the stage is centred
  await page.evaluate(() => { const s = document.querySelector('.teagame'); scrollTo(0, s.getBoundingClientRect().top + scrollY - 70); }); await shot('top');
  const el = await page.$('.teagame'); await el.screenshot({ path: path.join(out, `g_section_${lang}_${tag}.png`) });
  for (const n of stepsArg.split(',').map(Number).filter(Boolean)) {
    await page.evaluate((n) => { window.__mjGame.run(n); }, n);
    await page.evaluate((n) => window.__mjGame.advance(n === 1 ? 9.6 : n === 2 ? 8.5 : n === 3 ? 5 : n === 4 ? 11 : 22), n);
    await page.evaluate(() => { const s = document.querySelector('.gm-stage'); scrollTo(0, s.getBoundingClientRect().top + scrollY - 70); });
    const st = await page.$('.gm-stage'); await page.waitForTimeout(300); await st.screenshot({ path: path.join(out, `g_step${n}_${lang}_${tag}.png`) });
  }
  if (process.env.POUR) {
    await page.evaluate(() => { window.__mjGame.reset && window.__mjGame.reset(); });
  }
  console.log('logs', JSON.stringify(logs));
  await browser.close();
})();
