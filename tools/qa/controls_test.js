// Playwright "trial" clicks: scrolls each control into view and checks that it really is the thing that would receive the click (not covered by something else)
const { chromium } = require('playwright'); const path = require('path');
const [, , html, W, H, mob, pagesArg = 'index.html,ar.html,ku.html,en-products.html,en-products-golden-600g.html,en-about.html,en-contact.html,en-factories.html'] = process.argv;
const SEL = ['.nav nav a', '.brand', '.lang-switch summary', '.menu-toggle', '.visual-cta', '.text-button', '.hero-dots button', '.moment-tabs button', '.product-index button', '.taste-tabs button', '.gm-prod', '.gm-step', '.gm-icon', '.back-link', '.viewer-controls button', '.brew-steps button', '.send-button', '.footer-bottom a', '.footer-top a', '.mobile-tea-toggle', '#collection .prev', '#collection .next', '.motion-toggle', '.social-action'];
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const ctx = await browser.newContext({ viewport: { width: +W, height: +H }, isMobile: mob === '1', hasTouch: mob === '1' });
  const page = await ctx.newPage();
  await page.goto('file://' + path.resolve(html)); await page.waitForTimeout(1200);
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}*,*:before,*:after{animation:none!important;transition:none!important}' });
  let total = 0, bad = 0;
  for (const pg of pagesArg.split(',')) {
    await page.evaluate((p) => window.__go(p), pg); await page.waitForTimeout(600);
    await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}*,*:before,*:after{animation:none!important;transition:none!important}' });
    for (const sel of SEL) {
      const n = await page.locator(sel).count();
      for (let i = 0; i < Math.min(n, 12); i++) {
        const loc = page.locator(sel).nth(i);
        const vis = await loc.evaluate((e) => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0 && !e.disabled && e.getAttribute('aria-disabled') !== 'true' && !e.closest('[inert],[aria-hidden=true]') && !(e.closest('.is-hidden')) && !(e.closest('.tea-radial-menu')) && !(e.closest('.mobile-menu')) && !(e.closest('.desktop-social-rail') && false); }).catch(() => false);
        if (!vis) continue;
        total++;
        try { await loc.click({ trial: true, timeout: 2000 }); }
        catch (e) { bad++; const m = String(e.message).split('\n').filter((l) => /intercepts|not visible|outside|detached|stable/.test(l)).slice(0, 2).join(' / ').slice(0, 200); const lab = await loc.evaluate((el) => (el.innerText || el.getAttribute('aria-label') || el.className).toString().trim().slice(0, 30)).catch(() => '?'); console.log(`FAIL ${pg} ${sel}[${i}] "${lab}": ${m}`); }
      }
    }
  }
  console.log(`${W}x${H}${mob === '1' ? ' touch' : ''}: ${total} controls checked, ${bad} failed`);
  await browser.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
