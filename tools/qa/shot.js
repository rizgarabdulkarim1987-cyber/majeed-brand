// usage: node shot.js <harness-dir> <out-dir> <w> <h> <script.json>   script: [{"adv":2},{"run":1},{"shot":"a"},{"eval":"..."}]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [, , dir, out, W = '1000', H = '640', scriptPath] = process.argv;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: +W + 10, height: +H + 10 } });
  const logs = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text().slice(0, 500)}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${String(e.message).slice(0, 500)}`));
  await page.goto('file://' + path.resolve(dir, 'index.html') + `?w=${W}&h=${H}` + (process.env.PROD ? `&p=${process.env.PROD}` : ''));
  await page.waitForFunction('window.ready||window.err', null, { timeout: 120000 });
  const err = await page.evaluate('window.err');
  if (err) { console.log('INIT ERROR', err); }
  const steps = scriptPath ? JSON.parse(fs.readFileSync(scriptPath, 'utf8')) : [{ shot: 'idle' }];
  for (const s of steps) {
    if (s.adv) await page.evaluate((t) => { window.game.advance(t); }, s.adv);
    if (s.run) await page.evaluate((n) => { window.game.run(n); }, s.run);
    if (s.eval) { const r = await page.evaluate(s.eval); if (r !== undefined) console.log('eval:', JSON.stringify(r)); }
    if (s.shot) { await page.waitForTimeout(150); await page.screenshot({ path: path.join(out, s.shot + '.png'), clip: s.clip ? { x: s.clip[0], y: s.clip[1], width: s.clip[2], height: s.clip[3] } : { x: 0, y: 0, width: +W, height: +H } }); console.log('shot', s.shot); }
  }
  console.log('state', JSON.stringify(await page.evaluate('window.last')));
  console.log('logs', logs.length ? '\n' + logs.slice(0, 20).join('\n') : '(none)');
  await browser.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
