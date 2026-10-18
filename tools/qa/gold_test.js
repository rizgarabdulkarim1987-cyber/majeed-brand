// the Golden Majeed tin on the slider and its product page, in en/ar/ku
const { chromium } = require('playwright');
const path = require('path');
const [, , html, out, W = '1280', H = '800'] = process.argv;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: +W, height: +H } });
  const logs = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text().slice(0, 300)}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${String(e.message).slice(0, 300)}`));
  await page.goto('file://' + path.resolve(html));
  await page.waitForTimeout(1500);
  for (const lang of ['en', 'ar', 'ku']) {
    const home = lang === 'en' ? 'index.html' : lang + '.html';
    await page.evaluate((h) => window.__go(h), home);
    await page.waitForSelector('#collection'); await page.waitForTimeout(500);
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('#collection').scrollIntoView({ block: 'start' }); });
    await page.waitForTimeout(600);
    const before = await page.evaluate(() => ({ count: document.querySelector('.collection-count').innerText.replace(/\s+/g, ' '), idx: document.querySelectorAll('.product-index button').length }));
    await page.evaluate(() => document.querySelectorAll('.product-index button')[3].click());
    await page.waitForTimeout(900);
    const st = await page.evaluate(() => {
      const info = document.querySelector('.product-stage-info');
      const act = document.querySelector('.stage-product.active .pack');
      return { dir: document.documentElement.dir, lang: document.documentElement.lang, h3: info.querySelector('h3').innerText, eyebrow: info.querySelector('.eyebrow').innerText.replace(/\s+/g, ' '), p: info.querySelector('div + p').innerText, href: info.querySelector('a.visual-cta').getAttribute('href'), count: document.querySelector('.collection-count').innerText.replace(/\s+/g, ' '),
        img: act.style.backgroundImage.slice(0, 60), imgOk: null, accent: document.querySelector('#collection').style.getPropertyValue('--accent'),
        pressed: [...document.querySelectorAll('.product-index button')].map((b) => b.getAttribute('aria-pressed') === 'true' ? 1 : 0).join(''), neighbours: [...document.querySelectorAll('.stage-product')].map((b) => b.getAttribute('aria-label')) };
    });
    console.log(lang, 'slider before', JSON.stringify(before)); console.log(lang, 'slider golden', JSON.stringify(st));
    await (await page.$('#collection')).screenshot({ path: path.join(out, `g_${lang}_slider_${W}.png`) });
    // product page via the CTA
    await page.evaluate(() => document.querySelector('.product-stage-info a.visual-cta').click());
    await page.waitForTimeout(900);
    const dp = await page.evaluate(() => {
      const cs = getComputedStyle(document.querySelector('.detail-pack .pack'));
      const sw = [...document.querySelectorAll('.lang-menu a')].map((a) => a.getAttribute('href') + (a.getAttribute('aria-current') ? '*' : ''));
      return { title: document.title, h1: document.querySelector('h1').innerText, eyebrow: document.querySelector('.detail-copy .eyebrow').innerText.replace(/\s+/g, ' '), lead: document.querySelector('.lead').innerText, dl: [...document.querySelectorAll('.detail-copy dl > div')].map((d) => d.innerText.replace(/\s+/g, ' ')), cta: document.querySelector('.detail-copy a.visual-cta').getAttribute('href'),
        bg: cs.backgroundImage.slice(0, 50), size: [document.querySelector('.detail-pack').offsetWidth, document.querySelector('.detail-pack').offsetHeight], sw, stageCount: document.querySelector('.collection-count') ? document.querySelector('.collection-count').innerText.replace(/\s+/g, ' ') : null, dir: document.documentElement.dir };
    });
    console.log(lang, 'detail', JSON.stringify(dp));
    await page.evaluate(() => { window.scrollTo(0, 0); });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(out, `g_${lang}_detail_${W}.png`) });
  }
  console.log('logs', logs.length ? '\n' + logs.slice(0, 15).join('\n') : '(none)');
  await browser.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
