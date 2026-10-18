// clicks the real language menu: every language of home, products, a product page, contact; and checks lang/dir/title/links each time
const { chromium } = require('playwright');
const path = require('path');
const [, , html] = process.argv;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const logs = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text().slice(0, 300)}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${String(e.message).slice(0, 300)}`));
  await page.goto('file://' + path.resolve(html));
  await page.waitForTimeout(1500);
  const state = () => page.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir, title: document.title, current: (document.querySelector('.lang-menu a[aria-current=true]') || {}).textContent, links: [...document.querySelectorAll('.lang-menu a')].map((a) => a.getAttribute('href')) }));
  const pick = async (name) => { await page.evaluate(() => { document.querySelector('.lang-switch details').open = true; }); await page.click('.lang-menu a[lang=' + name + ']'); await page.waitForTimeout(900); };
  const seq = [['ku', 'home'], ['ar', 'home'], ['en', 'home']];
  for (const [l] of seq) { await pick(l === 'ku' ? 'ckb' : l); console.log('home ->', l, JSON.stringify(await state())); }
  // deep page: products -> detail -> each language keeps the same page
  await page.evaluate(() => window.__go('en-products-cardamom-800g.html')); await page.waitForTimeout(600);
  console.log('detail en', JSON.stringify(await state()));
  await pick('ckb'); console.log('detail ->ku', JSON.stringify(await state()));
  await pick('ar'); console.log('detail ->ar', JSON.stringify(await state()));
  await page.evaluate(() => window.__go('ku-contact.html')); await page.waitForTimeout(600);
  console.log('contact ku', JSON.stringify(await state()));
  // contact form message in Kurdish
  const fs = await page.evaluate(() => { const f = document.querySelector('form'); if (!f) return 'no form'; [...f.querySelectorAll('input,textarea')].forEach((i) => { if (i.type !== 'hidden' && !i.className.includes('honeypot')) i.value = i.type === 'email' ? 'a@b.co' : 'x'; }); f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); return (document.querySelector('.form-status') || {}).textContent; });
  console.log('form status ku:', fs);
  // Escape closes the menu; outside click closes it
  await page.evaluate(() => { document.querySelector('.lang-switch details').open = true; }); await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  console.log('menu closed by Escape:', await page.evaluate(() => !document.querySelector('.lang-switch details').open));
  await page.evaluate(() => { document.querySelector('.lang-switch details').open = true; }); await page.mouse.click(600, 500); await page.waitForTimeout(200);
  console.log('menu closed by outside click:', await page.evaluate(() => !document.querySelector('.lang-switch details').open));
  console.log('logs', logs.length ? '\n' + logs.slice(0, 12).join('\n') : '(none)');
  await browser.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
