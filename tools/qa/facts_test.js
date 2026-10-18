// the "Majeed in numbers" section: placement, counting, animation frames, motion off
const { chromium } = require('playwright');
const path = require('path');
const [, , html, out, W = '1280', H = '800', langs = 'en,ar,ku'] = process.argv;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: process.env.NOGPU ? ['--no-sandbox', '--allow-file-access-from-files'] : ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: +W, height: +H } });
  const logs = [];
  page.on('console', (m) => { if (['error'].includes(m.type())) logs.push(`[${m.type()}] ${m.text().slice(0, 300)}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${String(e.message).slice(0, 300)}`));
  await page.goto('file://' + path.resolve(html));
  await page.waitForTimeout(1500);
  for (const lang of langs.split(',')) {
    const home = lang === 'en' ? 'index.html' : lang + '.html';
    await page.evaluate((h) => window.__go(h), home);
    await page.waitForSelector('#facts'); await page.waitForTimeout(500);
    const order = await page.evaluate(() => [...document.querySelectorAll('main > section, main > div.ticker, .site > section, .site > div.ticker')].map((e) => e.id || e.className.split(' ')[0]).join(' > '));
    const pre = await page.evaluate(() => [...document.querySelectorAll('.fact-num')].map((e) => e.textContent));
    console.log(lang, 'order:', order, '| before view:', pre.join(' '));
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const f = document.querySelector('#facts'); window.scrollTo(0, f.getBoundingClientRect().top + scrollY - 90); });
    const frames = [250, 900, 1500, 2600, 4200];
    let last = 0;
    for (const t of frames) {
      await page.waitForTimeout(t - last); last = t;
      const nums = await page.evaluate(() => [...document.querySelectorAll('.fact-num')].map((e) => e.textContent));
      console.log(lang, t + 'ms', nums.join(' '));
      if (t === 900 || t === 4200) await page.screenshot({ path: path.join(out, `f_${lang}_${W}_${t}.png`) });
    }
    const st = await page.evaluate(() => { const g = document.querySelector('.facts-grid'); const cs = getComputedStyle(document.querySelector('.fact-num')); return { run: g.hasAttribute('data-run'), font: cs.fontFamily.slice(0, 40), labels: [...document.querySelectorAll('.fact-label')].map((e) => e.textContent), aria: [...document.querySelectorAll('.fact')].map((e) => e.getAttribute('aria-label')), h2: document.querySelector('#facts-title').innerText.replace(/\n/g, ' / '), tileW: document.querySelector('.fact').offsetWidth, overflow: document.documentElement.scrollWidth > innerWidth } });
    console.log(lang, JSON.stringify(st));
  }
  // motion off: numbers are final straight away
  await page.evaluate(() => window.__go('index.html')); await page.waitForTimeout(600);
  await page.evaluate(() => { document.querySelector('.motion-toggle').click(); });
  await page.waitForTimeout(300);
  const off = await page.evaluate(() => [...document.querySelectorAll('.fact-num')].map((e) => e.textContent));
  console.log('motion off:', off.join(' '), 'still:', await page.evaluate(() => document.querySelector('.site').classList.contains('still')));
  console.log('logs', logs.length ? '\n' + logs.slice(0, 15).join('\n') : '(none)');
  await browser.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
