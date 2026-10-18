// usage: node check_site.js <path-to-index.html> <out-dir>
const { chromium } = require('playwright');
const path = require('path');
const [, , htmlPath, outDir] = process.argv;

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const logs = [];
  const blocked = new Set();
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text().slice(0, 300)}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${String(e.message).slice(0, 300)}`));
  // block every network request except the local file itself
  await page.route('**/*', (route) => {
    const u = route.request().url();
    if (u.startsWith('file://') || u.startsWith('data:') || u.startsWith('blob:') || u.startsWith('about:')) return route.continue();
    blocked.add(new URL(u).host);
    return route.abort();
  });
  await page.goto('file://' + path.resolve(htmlPath), { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(4000);

  const info = await page.evaluate(() => {
    const q = (s) => document.querySelectorAll(s).length;
    const tg = document.querySelector('.teagame, #teagame, [class*="teagame"]');
    const r = tg ? tg.getBoundingClientRect() : null;
    return {
      title: document.title,
      lang: document.documentElement.lang,
      bodyTextLen: document.body.innerText.length,
      h1: (document.querySelector('h1') || {}).innerText || null,
      canvases: q('canvas'),
      teagameSection: !!tg,
      teagameBox: r ? { top: Math.round(r.top + scrollY), h: Math.round(r.height), w: Math.round(r.width) } : null,
      hasEngine: typeof window.MJTeaGame,
      navLinks: [...document.querySelectorAll('nav a')].slice(0, 8).map((a) => a.getAttribute('href')),
      pageHeight: document.documentElement.scrollHeight,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({ path: path.join(outDir, 'top.png') });
  if (info.teagameSection) {
    await page.evaluate(() => document.querySelector('.teagame, #teagame, [class*="teagame"]').scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(outDir, 'game.png') });
  }
  console.log('blocked hosts:', [...blocked].join(', ') || '(none)');
  console.log('console problems:', logs.length ? '\n' + logs.slice(0, 15).join('\n') : '(none)');
  await browser.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
