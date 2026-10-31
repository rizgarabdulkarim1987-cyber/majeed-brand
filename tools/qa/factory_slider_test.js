// the photo slider on the Factories page: arrows, dots, swipe, keys, auto-advance, in en / ar / ku
// node factory_slider_test.js <index.html> <outdir> [W=1280] [H=800] [langs=en,ar,ku]
const { chromium } = require('playwright'); const path = require('path');
const [, , html, out, W = '1280', H = '800', langsArg = 'en,ar,ku'] = process.argv;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: +W, height: +H }, hasTouch: false });
  const errs = []; page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 200)));
  await page.goto('file://' + path.resolve(html)); await page.waitForTimeout(1000);
  const state = () => page.evaluate(() => {
    const on = [...document.querySelectorAll('.ps-dots button')].findIndex((b) => b.classList.contains('on'));
    const fr = document.querySelector('.ps-frame').getBoundingClientRect(), mid = fr.left + fr.width / 2;
    // the slide whose centre is nearest the middle of the stage must be the one marked as the current one
    const near = [...document.querySelectorAll('.ps-slide')].map((s, k) => { const r = s.getBoundingClientRect(); return [k, Math.abs(r.left + r.width / 2 - mid), r.width]; }).sort((a, b) => a[1] - b[1])[0];
    const marked = [...document.querySelectorAll('.ps-slide')].findIndex((s) => s.classList.contains('on'));
    return { dot: on, shown: near[0], marked, off: Math.round(near[1]), slideW: Math.round(near[2]), stage: [Math.round(fr.width), Math.round(fr.height)], dir: getComputedStyle(document.querySelector('.ps-track')).direction };
  });
  for (const lang of langsArg.split(',')) {
    await page.evaluate((l) => window.__go(l === 'en' ? 'en-factories.html' : l + '-factories.html'), lang);
    await page.waitForSelector('.ps-frame'); await page.waitForTimeout(900);
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const f = document.querySelector('.ps-frame'); window.scrollTo(0, f.getBoundingClientRect().top + scrollY - 120); });
    await page.waitForTimeout(600);
    const info = await page.evaluate(() => ({ slides: document.querySelectorAll('.ps-slide').length, dots: document.querySelectorAll('.ps-dots button').length, region: document.querySelector('.photo-slider').getAttribute('aria-label'), alt: document.querySelector('.ps-slide img').alt, next: document.querySelector('.ps-next').getAttribute('aria-label'), slide1: document.querySelector('.ps-slide').getAttribute('aria-label'), imgOk: [...document.querySelectorAll('.ps-slide img')].every((i) => i.complete && i.naturalWidth > 0) }));
    console.log(lang, 'markup', JSON.stringify(info));
    console.log(lang, 'start', JSON.stringify(await state()));
    await page.click('.ps-next'); await page.waitForTimeout(900); console.log(lang, 'after next', JSON.stringify(await state()));
    await page.click('.ps-prev'); await page.waitForTimeout(900); console.log(lang, 'after prev', JSON.stringify(await state()));
    await page.click('.ps-dots button:nth-child(4)'); await page.waitForTimeout(900); console.log(lang, 'dot 4', JSON.stringify(await state()));
    // swipe: drag the picture towards the next one
    const b = await (await page.$('.ps-frame')).boundingBox(); const cx = b.x + b.width / 2, cy = b.y + b.height / 2, dir = lang === 'en' ? -1 : 1;
    await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx + dir * 150, cy, { steps: 6 }); await page.mouse.up(); await page.mouse.move(2, 2); await page.waitForTimeout(900);
    console.log(lang, 'swipe to next', JSON.stringify(await state()));
    await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx - dir * 150, cy, { steps: 6 }); await page.mouse.up(); await page.mouse.move(2, 2); await page.waitForTimeout(900);
    console.log(lang, 'swipe back', JSON.stringify(await state()));
    // tap the picture on the next side of the middle one
    const nb = await page.evaluate((l) => { const sl = [...document.querySelectorAll('.ps-slide')], c = sl.findIndex((x) => x.classList.contains('on')), t = sl[(c + 1) % sl.length].getBoundingClientRect(), fr = document.querySelector('.ps-frame').getBoundingClientRect(), lo = Math.max(t.left, fr.left), hi = Math.min(t.right, fr.right); return { x: (lo + hi) / 2, y: t.top + t.height / 2, from: c }; }, lang);
    await page.mouse.click(nb.x, nb.y); await page.mouse.move(2, 2); await page.waitForTimeout(900);
    console.log(lang, 'tap neighbour (was', nb.from + ')', JSON.stringify(await state()));
    await page.screenshot({ path: path.join(out, `fs_${lang}_${W}.png`) });
    // auto-advance (pointer away from the slider)
    const before = (await state()).dot; await page.waitForTimeout(5600); const after = (await state()).dot; console.log(lang, 'auto-advance', before, '->', after);
    await page.keyboard.press('Tab');
  }
  console.log('errors', errs.length, errs.slice(0, 3).join(' | '));
  await browser.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
