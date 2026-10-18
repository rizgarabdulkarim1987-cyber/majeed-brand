// regression: home page intact, no console errors, page swaps do not break the game or leak contexts
const { chromium } = require('playwright');
const path = require('path');
const [, , html, out] = process.argv;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const logs = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text().slice(0, 300)}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${String(e.message).slice(0, 300)}`));
  await page.goto('file://' + path.resolve(html));
  await page.waitForTimeout(2500);
  const top = await page.evaluate(() => ({ title: document.title, h1: (document.querySelector('h1') || {}).innerText, game: !!window.__mjGame, sections: [...document.querySelectorAll('section')].length }));
  console.log('home (before scroll)', JSON.stringify(top));
  await page.screenshot({ path: path.join(out, 'home_top.png') });
  await page.evaluate(() => document.querySelector('.teagame').scrollIntoView({ block: 'center' }));
  await page.waitForFunction('window.__mjGame', null, { timeout: 60000 });
  console.log('game created after scroll: true');
  for (const to of ['en-products.html', 'index.html', 'ar.html', 'en-about.html', 'index.html']) {
    await page.evaluate((t) => window.__go(t), to);
    await page.waitForTimeout(600);
    if (to === 'index.html' || to === 'ar.html') {
      await page.evaluate(() => document.querySelector('.teagame').scrollIntoView({ block: 'center' }));
      await page.waitForFunction('window.__mjGame && window.__mjGame.renderer', null, { timeout: 60000 });
    }
    const st = await page.evaluate(() => ({ page: document.title, game: !!window.__mjGame, canvases: document.querySelectorAll('.gm-gl').length, lost: window.__mjGame ? window.__mjGame.renderer.getContext().isContextLost() : null }));
    console.log('->', to, JSON.stringify(st));
  }
  console.log('logs', logs.length ? '\n' + logs.slice(0, 15).join('\n') : '(none)');
  await browser.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
