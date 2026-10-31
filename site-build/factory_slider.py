"""The photo slider on the Factories page (all three languages): the owner's five photos from the tea gardens, right under the page's headline.
Pictures only (no headline or caption). Arrows, dots, swipe / drag, arrow keys, and it moves on by itself every 5 seconds
(it waits while the pointer is on it, while it is off screen, in a hidden tab, and when motion is switched off).
Used by integrate.py:  add_factory_slider(pages, imgs, here),  KU_SLIDER (the Kurdish wording),  SLIDER_CSS,  SLIDER_JS (part of the shared page script)."""
import base64, os

N = 5
IMAGES = ['assets/factory-%d.webp' % (k + 1) for k in range(N)]      # (no sub-folder: the page loader only maps assets/<name> and assets/game/<name>)

TEXT = {
    'en': {'region': 'Photo gallery', 'alt': 'Majeed Tea in the tea gardens', 'prev': 'Previous photo', 'next': 'Next photo', 'dots': 'Choose a photo',
           'slide': 'Photo %s of %s', 'dot': 'Photo %s'},
    'ar': {'region': 'معرض الصور', 'alt': 'مجيد في مزارع الشاي', 'prev': 'الصورة السابقة', 'next': 'الصورة التالية', 'dots': 'اختر صورة',
           'slide': 'صورة %s من %s', 'dot': 'صورة %s'},
    'ku': {'region': 'گەلەری وێنە', 'alt': 'مەجید لە باخەکانی چادا', 'prev': 'وێنەی پێشوو', 'next': 'وێنەی دواتر', 'dots': 'وێنەیەک هەڵبژێرە',
           'slide': 'وێنەی %s لە %s', 'dot': 'وێنەی %s'},
}
ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'


def _n(lang, k):
    return str(k) if lang == 'en' else ''.join(ARABIC_DIGITS[int(c)] for c in str(k))


def _strings(lang):
    t = TEXT[lang]
    out = [t['region'], t['alt'], t['prev'], t['next'], t['dots']]
    out += [t['slide'] % (_n(lang, k), _n(lang, N)) for k in range(1, N + 1)]
    out += [t['dot'] % _n(lang, k) for k in range(1, N + 1)]
    return out


# Arabic text used on the Arabic pages -> Kurdish (the Kurdish pages are made from the Arabic ones)
KU_SLIDER = dict(zip(_strings('ar'), _strings('ku')))

ARROW = ('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
         'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m15 18-6-6 6-6"/></svg>')


def slider_html(lang):
    t = TEXT[lang]
    slides = ''.join(
        '<figure class="ps-slide" role="group" aria-roledescription="slide" aria-label="%s"><img src="%s" alt="%s" width="1600" height="1066" decoding="async" draggable="false"/></figure>'
        % (t['slide'] % (_n(lang, k + 1), _n(lang, N)), IMAGES[k], t['alt']) for k in range(N))
    dots = ''.join('<button type="button" aria-label="%s"%s><i></i></button>' % (t['dot'] % _n(lang, k + 1), ' class="on" aria-current="true"' if k == 0 else '') for k in range(N))
    return ('<section class="photo-slider section" aria-roledescription="carousel" aria-label="%s"><div class="ps-frame">'
            '<div class="ps-track">%s</div>'
            '<button class="ps-btn ps-prev" type="button" aria-label="%s">%s</button><button class="ps-btn ps-next" type="button" aria-label="%s">%s</button>'
            '<div class="ps-dots" role="group" aria-label="%s">%s</div></div></section>'
            % (t['region'], slides, t['prev'], ARROW, t['next'], ARROW, t['dots'], dots))


def add_factory_slider(pages, imgs, here):
    for k in IMAGES:
        with open(os.path.join(here, k), 'rb') as fh:
            imgs[k] = 'data:image/webp;base64,' + base64.b64encode(fh.read()).decode()
    for lang in ('en', 'ar'):
        key = '%s-factories.html' % lang
        h = pages[key]
        marker = '<section class="journey section">'
        assert h.count(marker) == 1, key
        pages[key] = h.replace(marker, slider_html(lang) + marker)


SLIDER_CSS = (
    '.photo-slider{padding-top:56px;padding-bottom:30px}'
    '.ps-frame{position:relative;overflow:hidden;isolation:isolate;aspect-ratio:16/9;border-radius:28px;background:#d9d6c8;touch-action:pan-y;-webkit-user-select:none;user-select:none;box-shadow:0 28px 60px -28px #29251c66}'
    '.ps-track{display:flex;height:100%;transition:transform .75s cubic-bezier(.2,.8,.2,1);will-change:transform}'
    '.ps-track.drag,.ps-track.no-tr{transition:none}'
    '.ps-slide{flex:0 0 100%;min-width:0;height:100%;margin:0}'
    '.ps-slide img{display:block;width:100%;height:100%;object-fit:cover;object-position:50% 36%;pointer-events:none;-webkit-user-drag:none}'
    '.ps-btn{position:absolute;top:50%;z-index:2;display:grid;place-items:center;width:46px;height:46px;margin-top:-23px;border:1px solid #ffffff80;border-radius:50%;background:#f5f0e5e6;color:var(--ink);'
    'box-shadow:0 8px 22px -8px #0006;transition:transform .25s,background .25s;-webkit-tap-highlight-color:transparent}'
    '.ps-btn:hover{background:#fff;transform:scale(1.06)}'
    '.ps-prev{left:18px}.ps-next{right:18px}.ps-next svg{transform:scaleX(-1)}'
    '.rtl .ps-prev{left:auto;right:18px}.rtl .ps-next{right:auto;left:18px}.rtl .ps-prev svg{transform:scaleX(-1)}.rtl .ps-next svg{transform:none}'
    '.ps-dots{position:absolute;left:0;right:0;bottom:12px;z-index:2;display:flex;justify-content:center;gap:2px}'
    '.ps-dots button{display:grid;place-items:center;height:26px;padding:0 4px;-webkit-tap-highlight-color:transparent}'
    '.ps-dots i{display:block;width:8px;height:8px;border-radius:4px;background:#ffffffb3;box-shadow:0 1px 5px #0005;transition:width .35s,background .35s}'
    '.ps-dots .on i{width:28px;background:#fff}'
    '@media (max-width:800px){.ps-frame{aspect-ratio:4/3;border-radius:20px}.ps-btn{width:40px;height:40px;margin-top:-20px}.ps-prev{left:10px}.ps-next{right:10px}.rtl .ps-prev{right:10px}.rtl .ps-next{left:10px}'
    '.ps-dots{bottom:6px}.photo-slider{padding-top:30px;padding-bottom:10px}}'
    '@media (prefers-reduced-motion:reduce){.ps-track{transition:none}}'
)

SLIDER_JS = r'''  /* ---- Factories page: the photo slider (arrows, dots, swipe / drag, keys, and it moves on by itself every 5 seconds) ---- */
  var psRoot = $('.photo-slider');
  if (psRoot) (function () {
    var frame = $('.ps-frame', psRoot), track = $('.ps-track', frame), slides = $$('.ps-slide', track), dots = $$('.ps-dots button', frame);
    var n = slides.length, EVERY = 5000, rtl = (ar || ku) ? 1 : -1;      // which way the track moves for the next picture
    if (n < 2) return;
    track.style.direction = (ar || ku) ? 'rtl' : 'ltr';
    var cur = 0, timer = 0, visible = true, hover = false, drag = null;
    var place = function (dx) { track.style.transform = 'translate3d(calc(' + (rtl * cur * 100) + '% + ' + (dx || 0) + 'px),0,0)'; };
    var paint = function () {
      dots.forEach(function (b, k) { b.classList.toggle('on', k === cur); if (k === cur) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      slides.forEach(function (s, k) { s.setAttribute('aria-hidden', k === cur ? 'false' : 'true'); });
    };
    var go = function (i) { cur = (i + n) % n; place(0); paint(); };
    var schedule = function () {
      clearTimeout(timer); timer = 0;
      if (!motion || document.hidden || !visible || hover || drag) return;
      timer = setTimeout(function () { go(cur + 1); schedule(); }, EVERY);
    };
    $('.ps-prev', frame).addEventListener('click', function () { go(cur - 1); schedule(); });
    $('.ps-next', frame).addEventListener('click', function () { go(cur + 1); schedule(); });
    dots.forEach(function (b, k) { b.addEventListener('click', function () { go(k); schedule(); }); });
    // drag / swipe
    frame.addEventListener('pointerdown', function (e) {
      if (e.button || e.target.closest('button')) return;
      drag = { x: e.clientX, id: e.pointerId, w: frame.clientWidth, dx: 0, t: Date.now() };
      track.classList.add('drag'); clearTimeout(timer); timer = 0;
      try { frame.setPointerCapture(e.pointerId); } catch (x) {}
    });
    frame.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x;
      // no pulling past the first / last picture (a little give, then it holds)
      var toward = dx * rtl;                                  // > 0: towards the next picture, < 0: towards the previous one
      if ((cur === 0 && toward < 0) || (cur === n - 1 && toward > 0)) dx *= 0.3;
      drag.dx = dx; place(dx);
    });
    var end = function (e) {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      var dx = drag.dx, w = drag.w, quick = Date.now() - drag.t < 350;
      drag = null; track.classList.remove('drag');
      if (Math.abs(dx) > w * 0.18 || (quick && Math.abs(dx) > 30)) go(cur + (dx * rtl > 0 ? 1 : -1)); else go(cur);
      schedule();
    };
    frame.addEventListener('pointerup', end); frame.addEventListener('pointercancel', end);
    // keys, hover, focus, visibility
    psRoot.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      var forward = (e.key === 'ArrowRight') === !(ar || ku);
      go(cur + (forward ? 1 : -1)); schedule(); e.preventDefault();
    });
    frame.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hover = true; schedule(); } });
    frame.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hover = false; schedule(); } });
    psRoot.addEventListener('focusin', function () { hover = true; schedule(); }); psRoot.addEventListener('focusout', function () { hover = false; schedule(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; schedule(); }, { threshold: 0.25 }).observe(frame);
    document.addEventListener('visibilitychange', schedule);
    onMotion.push(function () { track.classList.toggle('no-tr', !motion); schedule(); });
    track.classList.toggle('no-tr', !motion);
    window.addEventListener('resize', function () { place(0); });
    place(0); paint(); schedule();
  })();

'''
