// hero slide show: advances every 5 s, pauses on hover / motion off / hidden, dots work, caption follows
const { chromium } = require('playwright'); const path = require('path');
const [, , html, out, lang = 'en', W = '1280', H = '800', mobile = '0'] = process.argv;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: process.env.GPU ? ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--allow-file-access-from-files'] : ['--no-sandbox', '--allow-file-access-from-files'] });
  const ctx = await browser.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1, isMobile: mobile === '1', hasTouch: mobile === '1' });
  const page = await ctx.newPage(); const logs = [];
  page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text().slice(0, 200)); }); page.on('pageerror', (e) => logs.push(String(e.message).slice(0, 200)));
  await page.goto('file://' + path.resolve(html)); await page.waitForTimeout(800);
  if (lang !== 'en') await page.evaluate((l) => window.__go(l + '.html'), lang);
  await page.waitForSelector('.hero-dots');
  const st = () => page.evaluate(() => { const on = [...document.querySelectorAll('.hero-dots button')].findIndex((b) => b.classList.contains('on')); const packs = [...document.querySelectorAll('.hero-product>.pack')].map((p) => (p.className.replace(/pack|\s+/g, ' ').trim() || '-') + (p.hasAttribute('aria-hidden') ? '(h)' : '')); return { on, n: document.querySelectorAll('.hero-dots button').length, name: document.querySelector('.hero-slide-name').textContent, packs: packs.join(' | '), run: document.querySelector('.hero-dots').classList.contains('run'), label: (document.querySelector('.hero-product>.pack[role=img]') || {}).getAttribute ? document.querySelector('.hero-product>.pack[role=img]').getAttribute('aria-label') : null }; });
  const t0 = Date.now(); console.log('t=0', JSON.stringify(await st()));
  await page.screenshot({ path: path.join(out, `hs_${lang}_${W}_0.png`) });
  const times = [];
  let last = (await st()).on;
  while (Date.now() - t0 < 13500) { await page.waitForTimeout(100); const s = (await st()).on; if (s !== last) { times.push(((Date.now() - t0) / 1000).toFixed(1) + 's→' + s); last = s; if (times.length === 1) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(out, `hs_${lang}_${W}_mid.png`) }); } } }
  console.log('advances:', times.join(' '), JSON.stringify(await st()));
  await page.waitForTimeout(1200); await page.screenshot({ path: path.join(out, `hs_${lang}_${W}_1.png`) });
  // hover pauses (desktop only)
  if (mobile !== '1') { const b = await (await page.$('.hero-product')).boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(300); const a = (await st()); await page.waitForTimeout(6000); const c = await st(); console.log('hover: before', a.on, 'after 6 s', c.on, 'run', c.run); await page.mouse.move(2, 2); }
  // dot click
  await page.evaluate(() => document.querySelectorAll('.hero-dots button')[4].click()); await page.waitForTimeout(1500); console.log('after clicking dot 5:', JSON.stringify(await st()));
  await page.screenshot({ path: path.join(out, `hs_${lang}_${W}_dot.png`) });
  // motion off pauses
  await page.evaluate(() => document.querySelector('.motion-toggle').click()); await page.waitForTimeout(300); const m0 = await st(); await page.waitForTimeout(6000); const m1 = await st(); console.log('motion off: before', m0.on, 'after 6 s', m1.on, 'run', m1.run);
  await page.evaluate(() => document.querySelectorAll('.hero-dots button')[2].click()); await page.waitForTimeout(500); console.log('motion off, click dot 3:', JSON.stringify(await st()));
  console.log('logs', logs.length ? JSON.stringify(logs) : '(none)');
  await browser.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
