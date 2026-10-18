// at scroll 0: is any text or control of the page hidden under the fixed header?
const { chromium } = require('playwright'); const path = require('path');
const [, , html, widths = '834,1024,1100,1280,1440,393'] = process.argv;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('file://' + path.resolve(html)); await page.waitForTimeout(1000);
  const keys = await page.evaluate(() => Object.keys(window.__PAGES).filter((k) => !/^(ar|ku)-products-(cardamom|classic)/.test(k) || /800g/.test(k)));
  let bad = 0;
  for (const w of widths.split(',').map(Number)) {
    await page.setViewportSize({ width: w, height: 800 });
    for (const k of keys) {
      await page.evaluate((k) => window.__go(k), k); await page.waitForTimeout(250);
      const r = await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0);
        const nav = document.querySelector('.nav'); const nb = nav.getBoundingClientRect(); const out = [];
        document.querySelectorAll('main h1,main h2,main p,main a,main button,main dt,main label').forEach((e) => {
          if (e.closest('.nav,[aria-hidden=true],.hero-slides,.floating-system')) return;
          const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return;
          const b = e.getBoundingClientRect(); if (!b.width || !b.height) return;
          const txt = (e.innerText || '').trim(); if (!txt && !e.getAttribute('aria-label')) return;
          if (b.bottom > nb.top && b.top < nb.bottom && b.right > nb.left && b.left < nb.right && b.top >= 0) {
            const x = Math.min(Math.max(b.left + b.width / 2, nb.left + 1), nb.right - 1), y = Math.min(Math.max(b.top + b.height / 2, 1), 700);
            const t = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
            if (t && t.closest('.nav')) out.push(e.tagName + ' "' + txt.slice(0, 24) + '" top=' + Math.round(b.top));
          }
        });
        return out;
      });
      if (r.length) { bad++; console.log(`[${w}] ${k}: ${r.slice(0, 4).join(' | ')}`); }
    }
  }
  console.log('pages x widths hidden under header:', bad);
  await browser.close();
})();
