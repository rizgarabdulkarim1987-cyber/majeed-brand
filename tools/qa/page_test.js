// usage: node page_test.js <html> <outdir> <w> <h> <lang: en|ar> <script.json>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [, , html, out, W = '1280', H = '800', lang = 'en', scriptPath] = process.argv;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: +W, height: +H } });
  const logs = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text().slice(0, 400)}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${String(e.message).slice(0, 400)}`));
  await page.goto('file://' + path.resolve(html));
  if (lang !== 'en') await page.evaluate((l) => window.__go(l + '.html'), lang);
  await page.waitForSelector('.teagame');
  await page.evaluate(() => document.querySelector('.teagame').scrollIntoView({ block: 'center' }));
  await page.waitForFunction('window.__mjGame', null, { timeout: 120000 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { const g = window.__mjGame; g.running = false; document.querySelector('.teagame').scrollIntoView({ block: 'center' }); });
  await page.waitForTimeout(800);
  const steps = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));
  const info = () => page.evaluate(() => ({ status: (document.querySelector('.gm-status') || {}).innerText, steps: [...document.querySelectorAll('.gm-step')].map((b) => b.dataset.state + (b.disabled ? '*' : '')), done: !!document.querySelector('.gm-done'), chosen: (document.querySelector('.gm-prod[aria-checked=true]') || {}).dataset && document.querySelector('.gm-prod[aria-checked=true]').dataset.slug, product: window.__mjGame && window.__mjGame.product, pickLocked: [...document.querySelectorAll('.gm-prod')].every((b) => b.disabled), stage: (() => { const r = document.querySelector('.gm-stage').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; })() }));
  for (const s of steps) {
    if (s.pick) await page.evaluate((sl) => document.querySelector('.gm-prod[data-slug="' + sl + '"]').click(), s.pick);
    if (s.click) await page.evaluate((n) => { const b = document.querySelectorAll('.gm-step')[n - 1]; b.click(); }, s.click);
    if (s.adv) await page.evaluate((t) => window.__mjGame.advance(t), s.adv);
    if (s.info) console.log(s.info, JSON.stringify(await info()));
    if (s.shot) { await page.waitForTimeout(200); const el = await page.$(s.full ? 'body' : '.gm-frame'); await (s.full ? page.screenshot({ path: path.join(out, s.shot + '.png') }) : el.screenshot({ path: path.join(out, s.shot + '.png') })); console.log('shot', s.shot); }
  }
  console.log('logs', logs.length ? '\n' + logs.slice(0, 20).join('\n') : '(none)');
  await browser.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
