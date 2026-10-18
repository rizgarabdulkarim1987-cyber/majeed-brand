// usage: node lang_shot.js <html> <outdir> <page> <w> <h> <label>:<action>...   action: top | menu | sel=<css> | fonts
const { chromium } = require('playwright');
const path = require('path');
const [, , html, out, pg, W = '1280', H = '800', ...acts] = process.argv;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: +W, height: +H } });
  const logs = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text().slice(0, 300)}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${String(e.message).slice(0, 300)}`));
  await page.goto('file://' + path.resolve(html));
  await page.waitForTimeout(1500);
  if (pg !== 'index.html') await page.evaluate((p) => window.__go(p), pg);
  await page.waitForTimeout(1800);
  for (const a of acts) {
    const [label, act] = a.split(':');
    if (act === 'top') { await page.evaluate(() => scrollTo(0, 0)); }
    else if (act === 'menu') { await page.evaluate(() => { scrollTo(0, 0); document.querySelector('.lang-switch details').open = true; }); }
    else if (act.startsWith('sel=')) { await page.evaluate((s) => { const e = document.querySelector(s); if (e) e.scrollIntoView({ block: 'center' }); }, act.slice(4)); }
    else if (act === 'bottom') { await page.evaluate(() => scrollTo(0, document.body.scrollHeight)); }
    await page.waitForTimeout(900);
    if (label !== 'info') await page.screenshot({ path: path.join(out, label + '.png') });
    if (act === 'fonts' || label === 'info') {
      const info = await page.evaluate(() => {
        const q = (s) => document.querySelector(s); const cs = (e) => e ? getComputedStyle(e).fontFamily.slice(0, 70) + ' | w' + getComputedStyle(e).fontWeight + ' | ' + getComputedStyle(e).fontSize : null;
        return { lang: document.documentElement.lang, dir: document.documentElement.dir, h1: cs(q('h1')), h2: cs(q('h2')), body: cs(q('.site')), footerH2: cs(q('.footer-brand h2')), arabicHero: cs(q('.arabic-hero')), nav: (q('.nav nav') || {}).innerText, switchText: (q('.lang-switch summary') || {}).innerText, loaded: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')).filter((v, i, a) => a.indexOf(v) === i) };
      });
      console.log(label + ' ' + JSON.stringify(info));
    }
  }
  console.log('logs', logs.length ? '\n' + logs.slice(0, 12).join('\n') : '(none)');
  await browser.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
