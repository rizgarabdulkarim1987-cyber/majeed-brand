// every page x several widths: page errors, duplicate ids, broken internal links, broken images, horizontal overflow (with classic 15px scrollbars)
const { chromium } = require('playwright'); const path = require('path');
const [, , html, widthsArg = '1440,1280,1024,834,390,320', only = ''] = process.argv;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + String(e.message).slice(0, 160)));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 160)); });
  page.on('requestfailed', (r) => { if (!r.url().startsWith('data:')) errs.push('requestfailed: ' + r.url().slice(0, 120)); });
  await page.goto('file://' + path.resolve(html)); await page.waitForTimeout(1200);
  const keys = await page.evaluate(() => Object.keys(window.__PAGES));
  const list = only ? keys.filter((k) => only.split(',').includes(k)) : keys;
  console.log('pages', keys.length, 'checking', list.length);
  const seenLinks = new Set(); let problems = 0;
  for (const w of widthsArg.split(',').map(Number)) {
    await page.setViewportSize({ width: w, height: w < 500 ? 800 : 800 });
    for (const k of list) {
      errs.length = 0;
      await page.evaluate((k) => window.__go(k), k); await page.waitForTimeout(350);
      const r = await page.evaluate(([w]) => {
        const out = { dup: [], links: [], imgs: [], over: [], noname: [] };
        const st = document.createElement('style'); st.textContent = '::-webkit-scrollbar{width:15px;height:15px}'; document.head.appendChild(st);
        const ids = {}; document.querySelectorAll('[id]').forEach((e) => { ids[e.id] = (ids[e.id] || 0) + 1; }); for (const i in ids) if (ids[i] > 1) out.dup.push(i);
        document.querySelectorAll('a[href]').forEach((a) => { const h = a.getAttribute('href'); if (/^(https?:|mailto:|tel:|#)/.test(h)) return; if (!window.__PAGES[h]) out.links.push(h); });
        document.querySelectorAll('img').forEach((i) => { if (!i.getAttribute('src')) out.imgs.push('empty src'); else if (i.complete && i.naturalWidth === 0) out.imgs.push((i.getAttribute('src') || '').slice(0, 60)); });
        document.querySelectorAll('button,a[href]').forEach((b) => { const t = (b.innerText || '').trim() || b.getAttribute('aria-label') || b.getAttribute('title'); if (!t && !b.querySelector('img[alt]:not([alt=""])')) out.noname.push(b.className.toString().slice(0, 40) || b.tagName); });
        const cw = document.documentElement.clientWidth;
        if (document.documentElement.scrollWidth > cw + 1) {
          out.over.push('doc ' + document.documentElement.scrollWidth + ' > ' + cw);
          [...document.querySelectorAll('body *')].forEach((e) => { const b = e.getBoundingClientRect(); if (b.width && b.right > cw + 2 && !e.closest('.leaves,.hero-orbit,.ticker,.showroom,svg,.floating-system,.moment-tabs,.gm-picker,.product-index,.lang-menu,.mobile-menu,[aria-hidden=true]')) { if (out.over.length < 6) out.over.push(e.tagName + '.' + String(e.className).slice(0, 28) + ' right=' + Math.round(b.right)); } });
        }
        return out;
      }, [w]);
      const bad = r.dup.length || r.links.length || r.imgs.length || r.over.length || errs.length;
      const noname = r.noname.length ? ' noname:' + [...new Set(r.noname)].join(',') : '';
      if (bad || (w === 1440 && noname)) { problems++; console.log(`[${w}] ${k}: ${r.dup.length ? 'dupIds=' + r.dup.join('|') + ' ' : ''}${r.links.length ? 'badLinks=' + [...new Set(r.links)].join('|') + ' ' : ''}${r.imgs.length ? 'badImgs=' + r.imgs.join('|') + ' ' : ''}${r.over.length ? 'overflow=' + r.over.join(' ; ') + ' ' : ''}${errs.length ? 'errors=' + errs.join(' ; ') : ''}${w === 1440 ? noname : ''}`); }
    }
  }
  console.log('done; pages with problems:', problems);
  await browser.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
