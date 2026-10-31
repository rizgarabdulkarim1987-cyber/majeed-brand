// the two carton products (Majeed Cardamom 4.2 kg, Pekoe Black 8 kg): slider, product page, and "no Indian anywhere", in en/ar/ku
// node cartons_test.js <index.html> <outdir> [W=1280] [H=800] [langs=en,ar,ku]
const { chromium } = require('playwright');
const path = require('path');
const [, , html, out, W = '1280', H = '800', langsArg = 'en,ar,ku'] = process.argv;
const SLUGS = ['cardamom-4200g', 'pekoe-black-8000g'];
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: +W, height: +H } });
  const logs = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text().slice(0, 300)}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${String(e.message).slice(0, 300)}`));
  await page.goto('file://' + path.resolve(html));
  await page.waitForTimeout(1500);
  // 1) no page, in any language, says Indian
  const bad = await page.evaluate(() => Object.entries(window.__PAGES).filter(([k, h]) => /indian\b|\bindia\b|هندي|الهند\b|هیندی|هیندستان/i.test(h)).map(([k]) => k));
  console.log('pages still mentioning India:', JSON.stringify(bad));
  for (const lang of langsArg.split(',')) {
    const home = lang === 'en' ? 'index.html' : lang + '.html';
    await page.evaluate((h) => window.__go(h), home);
    await page.waitForSelector('#collection'); await page.waitForTimeout(500);
    for (const slug of SLUGS) {
      await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
      await page.evaluate((s) => { document.querySelector('#collection').scrollIntoView({ block: 'start' }); const k = window.__MJ.products.findIndex((p) => p.slug === s); document.querySelectorAll('.product-index button')[k].click(); }, slug);
      await page.waitForTimeout(1000);
      const st = await page.evaluate(() => {
        const info = document.querySelector('.product-stage-info'), act = document.querySelector('.stage-product.active'), pk = act.querySelector('.pack').getBoundingClientRect();
        return { h3: info.querySelector('h3').innerText, eyebrow: info.querySelector('.eyebrow').innerText.replace(/\s+/g, ' '), p: info.querySelector('div + p').innerText, href: info.querySelector('a.visual-cta').getAttribute('href'), count: document.querySelector('.collection-count').innerText.replace(/\s+/g, ' '), wide: act.classList.contains('wide'), pack: [Math.round(pk.width), Math.round(pk.height)], neighbours: [...document.querySelectorAll('.stage-product')].map((b) => b.getAttribute('aria-label')) };
      });
      console.log(lang, slug, JSON.stringify(st));
      await (await page.$('#collection')).screenshot({ path: path.join(out, `c_${lang}_${slug}_slider_${W}.png`) });
    }
    // each product page, through its link
    for (const slug of SLUGS) {
      await page.evaluate((s) => window.__go((window.__MJ.lang === 'en' ? 'en' : window.__MJ.lang) + '-products-' + s + '.html'), slug);
      await page.waitForSelector('.detail-copy'); await page.waitForTimeout(900);
      const dp = await page.evaluate(() => ({ title: document.title, h1: document.querySelector('h1').innerText, eyebrow: document.querySelector('.detail-copy .eyebrow').innerText.replace(/\s+/g, ' '), lead: document.querySelector('.lead').innerText, dl: [...document.querySelectorAll('.detail-copy dl > div')].map((d) => d.innerText.replace(/\s+/g, ' ')), pack: [document.querySelector('.detail-pack').offsetWidth, document.querySelector('.detail-pack').offsetHeight] }));
      console.log(lang, slug, 'detail', JSON.stringify(dp));
      await page.screenshot({ path: path.join(out, `c_${lang}_${slug}_detail_${W}.png`) });
    }
  }
  console.log('logs', logs.length ? '\n' + logs.slice(0, 15).join('\n') : '(none)');
  await browser.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
