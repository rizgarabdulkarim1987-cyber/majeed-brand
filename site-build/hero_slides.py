"""The home-page hero: the product picture is a slide show that changes by itself every 5 seconds.
The page carries only the first picture (the signature jar); the script adds the rest from the product list (window.__MJ, shown in the language of the page),
cross-fades between two layers, and draws a caption and one dot per product. It stops when the picture is not on screen, the tab is hidden,
the pointer rests on it, or motion is paused (the site's "Pause motion" button / the device's reduced-motion setting). The dots always work by hand.
Used by integrate.py:  HERO_SLIDES_CSS (home pages) and HERO_SLIDES_JS (inside the shared page script)."""

HERO_SLIDES_CSS = (
    # two stacked layers instead of one picture; every product fits the same box
    '.hero-product>.pack{position:absolute;inset:3% 0 17%;width:auto;height:auto;background-size:contain;background-position:center;'
    'transition:opacity .9s ease,translate .9s cubic-bezier(.2,.8,.2,1),scale .9s cubic-bezier(.2,.8,.2,1)}'
    '.hero-product>.pack.is-next{opacity:0;translate:calc(var(--hs,1)*9%) 0;scale:.9}'
    '.hero-product>.pack.is-prev{opacity:0;translate:calc(var(--hs,1)*-9%) 0;scale:.9}'
    '.hero-product>.pack.no-tr{transition:none!important}'
    # caption and dots, under the picture
    '.hero-slides{position:absolute;z-index:6;left:38%;width:38%;bottom:0;display:flex;flex-direction:column;align-items:center;gap:2px}'
    '.rtl .hero-slides{left:29%}@media (max-width:1100px){.hero-slides{width:40%}}'
    '.hero-slide-name{margin:0;min-height:16px;color:#66685c;font:600 10px/1.5 DM Sans,Noto Sans Arabic,sans-serif;letter-spacing:.14em;text-transform:uppercase;text-align:center;animation:hero-name .5s ease both}'
    '.rtl .hero-slide-name{letter-spacing:0;font-size:12px;text-transform:none}'
    '.ku .hero-slide-name{font-family:var(--ku-font)}'
    '.hero-dots{display:flex;align-items:center;justify-content:center}'
    '.hero-dots button{display:grid;place-items:center;height:24px;padding:0 4px;-webkit-tap-highlight-color:transparent}'
    '.hero-dots i{display:block;position:relative;overflow:hidden;width:7px;height:7px;border-radius:4px;background:#b9b6a6;transition:width .35s,background .35s}'
    '.hero-dots button:hover i{background:#8e917f}'
    '.hero-dots .on i{width:30px;background:#d9d3c3}'
    '.hero-dots .on i:after{content:"";position:absolute;inset:0;background:var(--ink);transform-origin:0 50%}'
    '.rtl .hero-dots .on i:after{transform-origin:100% 50%}'
    '.hero-dots:not(.run) .on i:after{transform:none}'
    '.hero-dots.run .on i:after{animation:hero-fill var(--hero-every,5s) linear both}'
    '@keyframes hero-fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}@keyframes hero-name{from{opacity:0;transform:translateY(4px)}}'
    '.hero-dots button:focus-visible{outline-offset:2px}'
    # on a phone the caption and dots sit in the column, under the picture
    '@media (max-width:800px){.hero-slides,.rtl .hero-slides{position:relative;left:auto;bottom:auto;width:auto;order:3;align-self:center;margin-top:22px}'
    '.hero-product>.pack{inset:2% 0 3%}}'
)

HERO_SLIDES_JS = r'''  /* ---- hero: the product picture is a slide show that changes by itself every 5 seconds ---- */
  if (window.__mjHero) { try { window.__mjHero.stop(); } catch (e) {} window.__mjHero = null; }
  var hpWrap = $('.hero-product'), hpFront = hpWrap && $('.pack', hpWrap), hpScene = $('.hero-scene');
  if (hpWrap && hpFront && hpScene && D.products) (function () {
    var EVERY = 5000, ORDER = ['cardamom-1kg', 'golden-600g', 'classic-black-800g', 'cardamom-pouch', 'cardamom-800g', 'classic-black-450g', 'cardamom-450g'];
    var urlOf = function (css) { var m = /url\(["']?(.*?)["']?\)/.exec(css || ''); return m ? m[1] : ''; };
    var slides = [{ src: urlOf(hpFront.style.backgroundImage), label: hpFront.getAttribute('aria-label') || '' }];
    ORDER.forEach(function (slug) {
      var p = D.products.filter(function (x) { return x.slug === slug; })[0];
      if (p) slides.push({ src: rel(p.image), label: p.name[lang] + (p.weight[lang] ? ' · ' + p.weight[lang] : '') });
    });
    if (slides.length < 2 || !slides[0].src) return;
    hpWrap.style.setProperty('--hs', (ar || ku) ? '-1' : '1');
    var back = hpFront.cloneNode(false), front = hpFront;
    back.removeAttribute('role'); back.removeAttribute('aria-label'); back.setAttribute('aria-hidden', 'true'); back.className += ' is-next';
    hpWrap.insertBefore(back, hpFront.nextSibling);
    var box = document.createElement('div'); box.className = 'hero-slides';
    box.innerHTML = '<p class="hero-slide-name"></p><div class="hero-dots" role="group" aria-label="' + L('Majeed products', 'منتجات مجيد', 'بەرهەمەکانی مەجید') + '"></div>';
    hpScene.appendChild(box);
    var nameEl = $('.hero-slide-name', box), dotsEl = $('.hero-dots', box);
    box.style.setProperty('--hero-every', EVERY + 'ms'); dotsEl.style.setProperty('--hero-every', EVERY + 'ms');
    var btns = slides.map(function (s, k) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', s.label); b.innerHTML = '<i></i>';
      b.addEventListener('click', function () { go(k); schedule(); }); dotsEl.appendChild(b); return b;
    });
    var cur = 0, timer = 0, token = 0, visible = true, hover = false, busy = 0;
    var paint = function () {
      btns.forEach(function (b, k) { b.classList.toggle('on', k === cur); if (k === cur) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      nameEl.textContent = slides[cur].label; nameEl.style.animation = 'none'; void nameEl.offsetWidth; nameEl.style.animation = '';
    };
    var load = function (src) {
      return new Promise(function (res) { var im = new Image(); im.onload = function () { if (im.decode) im.decode().then(res, res); else res(); }; im.onerror = res; im.src = src; });
    };
    var instant = function (el, add, remove) { el.classList.add('no-tr'); if (remove) el.classList.remove(remove); if (add) el.classList.add(add); void el.offsetWidth; el.classList.remove('no-tr'); };
    function go(i) {
      i = (i + slides.length) % slides.length; if (i === cur) return;
      var my = ++token, s = slides[i];
      load(s.src).then(function () {
        if (my !== token) return;
        clearTimeout(busy);
        // settle any slide still on its way out, then bring the new one in
        instant(back, 'is-next', 'is-prev'); back.style.backgroundImage = 'url("' + s.src + '")';
        var old = front; front = back; back = old; cur = i;
        front.setAttribute('role', 'img'); front.setAttribute('aria-label', s.label); front.removeAttribute('aria-hidden');
        back.removeAttribute('role'); back.removeAttribute('aria-label'); back.setAttribute('aria-hidden', 'true');
        if (!motion) { instant(front, '', 'is-next'); instant(back, 'is-prev'); }
        else { void front.offsetWidth; front.classList.remove('is-next'); back.classList.add('is-prev'); busy = setTimeout(function () { instant(back, 'is-next', 'is-prev'); }, 1000); }
        paint();
      });
    }
    function schedule() {
      clearTimeout(timer); timer = 0;
      var run = motion && !document.hidden && visible && !hover;
      dotsEl.classList.toggle('run', run);
      if (!run) return;
      var a = btns[cur]; a.classList.remove('on'); void a.offsetWidth; a.classList.add('on');      // the dot's fill starts again from empty
      timer = setTimeout(function () { go(cur + 1); schedule(); }, EVERY);
    }
    var io = null;
    if ('IntersectionObserver' in window) { io = new IntersectionObserver(function (en) { visible = en[0].isIntersecting; schedule(); }, { threshold: 0.2 }); io.observe(hpScene); }
    var pause = function (v) { return function (e) { if (e.pointerType && e.pointerType !== 'mouse') return; hover = v; schedule(); }; };
    [hpWrap, box].forEach(function (el) { el.addEventListener('pointerenter', pause(true)); el.addEventListener('pointerleave', pause(false)); });
    box.addEventListener('focusin', function () { hover = true; schedule(); }); box.addEventListener('focusout', function () { hover = false; schedule(); });
    document.addEventListener('visibilitychange', schedule);
    onMotion.push(schedule);
    paint(); schedule();
    setTimeout(function () { load(slides[1].src); }, 1500);                                          // the next picture is decoded before it is needed
    window.__mjHero = { stop: function () { clearTimeout(timer); clearTimeout(busy); token++; if (io) io.disconnect(); document.removeEventListener('visibilitychange', schedule); } };
  })();

'''
