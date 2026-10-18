// the round Majeed button on a phone: tap opens the menu, tap outside / Escape / a link closes it, Contact opens the contact page
const { chromium } = require('playwright'); const path = require('path');
const [, , html, out, lang = 'en', W = '393', H = '852'] = process.argv;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const ctx = await browser.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const logs = []; page.on('pageerror', (e) => logs.push(String(e.message).slice(0, 200)));
  await page.goto('file://' + path.resolve(html)); await page.waitForTimeout(1500);
  if (lang !== 'en') await page.evaluate((l) => window.__go(l + '.html'), lang);
  await page.waitForTimeout(1000);
  const st = () => page.evaluate(() => { const a = document.querySelector('.mobile-tea-actions'), t = document.querySelector('.mobile-tea-toggle'), m = document.querySelector('#tea-action-menu'); return { expanded: a.classList.contains('expanded'), aria: t.getAttribute('aria-expanded'), label: t.getAttribute('aria-label'), inert: m.hasAttribute('inert') }; });
  const tapToggle = async () => { const b = await (await page.$('.mobile-tea-toggle')).boundingBox(); await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(900); };
  console.log('start', JSON.stringify(await st()));
  await tapToggle(); console.log('after tap 1', JSON.stringify(await st()));
  await page.screenshot({ path: path.join(out, `fab_open_${lang}.png`) });
  await tapToggle(); console.log('after tap 2', JSON.stringify(await st()));
  await tapToggle(); await page.touchscreen.tap(60, 300); await page.waitForTimeout(700); console.log('after tap outside', JSON.stringify(await st()));
  await tapToggle();
  const c = await (await page.$('.radial-contact-link')).boundingBox(); await page.touchscreen.tap(c.x + c.width / 2, c.y + c.height / 2); await page.waitForTimeout(1200);
  console.log('contact tap ->', await page.evaluate(() => document.title), 'logs', JSON.stringify(logs));
  await browser.close();
})();
