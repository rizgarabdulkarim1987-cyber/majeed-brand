const { chromium } = require('playwright'); const path = require('path');
const [, , html, W, H, mob] = process.argv;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--allow-file-access-from-files'] });
  const ctx = await browser.newContext({ viewport: { width: +W, height: +H }, isMobile: mob === '1', hasTouch: mob === '1' });
  const page = await ctx.newPage();
  await page.goto('file://' + path.resolve(html)); await page.waitForTimeout(1200);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('.gm-picker').scrollIntoView({ block: 'center' }); });
  await page.waitForFunction('window.__mjGame', null, { timeout: 120000 }); await page.waitForTimeout(1500);
  const out = [];
  for (const i of [1, 2, 3, 5, 6]) {
    const info = await page.evaluate((i) => { const b = document.querySelectorAll('.gm-prod')[i]; b.scrollIntoView({ block: 'center', inline: 'center' }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, dis: b.disabled, w: Math.round(r.width) }; }, i);
    await page.waitForTimeout(250);
    if (mob === '1') await page.touchscreen.tap(info.x, info.y); else await page.mouse.click(info.x, info.y);
    await page.waitForTimeout(500);
    const chosen = await page.evaluate(() => (document.querySelector('.gm-prod[aria-checked=true]') || {}).dataset.slug);
    out.push(i + ':' + chosen + (info.dis ? '(disabled)' : ''));
  }
  console.log(`${W}x${H}${mob === '1' ? ' touch' : ''}`, out.join('  '));
  await browser.close();
})();
