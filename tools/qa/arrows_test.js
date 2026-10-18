// real mouse/touch clicks on the product slider arrows, side products and dots
const { chromium } = require('playwright'); const path = require('path');
const [, , html, W, H, mob, pg = 'index.html'] = process.argv;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const ctx = await browser.newContext({ viewport: { width: +W, height: +H }, isMobile: mob === '1', hasTouch: mob === '1' });
  const page = await ctx.newPage();
  await page.goto('file://' + path.resolve(html)); await page.waitForTimeout(1200);
  if (pg !== 'index.html') await page.evaluate((p) => window.__go(p), pg);
  await page.waitForTimeout(800);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector('#collection .showroom'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 160); });
  await page.waitForTimeout(900);
  const cur = () => page.evaluate(() => document.querySelector('.collection-count').innerText.replace(/\s+/g, ' ').trim());
  const click = async (sel, idx = 0) => { const els = await page.$$(sel); const b = await els[idx].boundingBox(); const x = b.x + b.width / 2, y = b.y + b.height / 2; if (mob === '1') await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); await page.waitForTimeout(500); };
  const res = [await cur()];
  await click('#collection .next'); res.push('next→' + await cur());
  await click('#collection .next'); res.push('next→' + await cur());
  await click('#collection .prev'); res.push('prev→' + await cur());
  await click('#collection .stage-product', 3); res.push('side(3)→' + await cur());
  await click('#collection .stage-product', 1); res.push('side(1)→' + await cur());
  await click('#collection .product-index button', 5); res.push('index(6)→' + await cur());
  console.log(`${W}x${H}${mob === '1' ? ' touch' : ''} ${pg}:`, res.join(' | '));
  await browser.close();
})();
