// phone hero: screenshot top + CTA area, what is on top of the CTA buttons, tap test
const { chromium } = require('playwright'); const path = require('path');
const [, , html, out, lang = 'en', W = '393', H = '852'] = process.argv;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const ctx = await browser.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
  const page = await ctx.newPage();
  const logs = []; page.on('pageerror', (e) => logs.push(String(e.message).slice(0, 200)));
  await page.goto('file://' + path.resolve(html)); await page.waitForTimeout(1500);
  if (lang !== 'en') await page.evaluate((l) => window.__go(l + '.html'), lang);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(out, `hero_${lang}_${W}.png`) });
  const info = await page.evaluate(() => {
    const r = (e) => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top + scrollY), Math.round(b.width), Math.round(b.height)]; };
    const q = (s) => document.querySelector(s);
    const ctas = [...document.querySelectorAll('.hero-actions .visual-cta')];
    return { docW: document.documentElement.scrollWidth, innerW: innerWidth, hero: r(q('.hero')), scene: r(q('.hero-scene')), h1: r(q('.hero-copy h1')), prod: r(q('.hero-product')), arabic: r(q('.arabic-hero')), bottom: r(q('.hero-bottom')), ctas: ctas.map(r), cue: r(q('.scroll-cue')), note: r(q('.hero-note')), tea: r(q('.hero-tea')), stamp: q('.round-stamp') ? r(q('.round-stamp')) : null };
  });
  console.log(JSON.stringify(info));
  // what is on top of each CTA centre?
  for (let i = 0; i < 2; i++) {
    await page.evaluate((i) => { const c = document.querySelectorAll('.hero-actions .visual-cta')[i]; c.scrollIntoView({ block: 'center' }); }, i);
    await page.waitForTimeout(500);
    const top = await page.evaluate((i) => { const c = document.querySelectorAll('.hero-actions .visual-cta')[i], b = c.getBoundingClientRect(); const x = b.left + b.width / 2, y = b.top + b.height / 2; const els = document.elementsFromPoint(x, y).slice(0, 5).map((e) => e.tagName + '.' + String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className).slice(0, 30)); return { x: Math.round(x), y: Math.round(y), href: c.getAttribute('href'), els, ptr: getComputedStyle(c).pointerEvents, vh: innerHeight }; }, i);
    console.log('cta', i, JSON.stringify(top));
    await page.screenshot({ path: path.join(out, `cta${i}_${lang}_${W}.png`) });
  }
  // real tap on the first CTA
  const before = await page.evaluate(() => document.title);
  const box = await (await page.$$('.hero-actions .visual-cta'))[0].boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(1200);
  console.log('after tap:', before, '->', await page.evaluate(() => document.title), 'logs', JSON.stringify(logs));
  await browser.close();
})();
