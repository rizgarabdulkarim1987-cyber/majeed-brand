"""The photo slider on the Factories page (all three languages): the owner's five photos from the tea gardens, right under the page's headline.
Pictures only (no headline or caption). A smaller, centred slider: the middle picture full size, its neighbours peeking at the sides; arrows and dots under it, swipe / drag, arrow keys, and it moves on by itself every 5 seconds
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
    return ('<section class="photo-slider section" aria-roledescription="carousel" aria-label="%s">'
            '<div class="ps-frame"><div class="ps-track">%s</div></div>'
            '<div class="ps-nav"><button class="ps-btn ps-prev" type="button" aria-label="%s">%s</button>'
            '<div class="ps-dots" role="group" aria-label="%s">%s</div>'
            '<button class="ps-btn ps-next" type="button" aria-label="%s">%s</button></div></section>'
            % (t['region'], slides, t['prev'], ARROW, t['dots'], dots, t['next'], ARROW))


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
    '.photo-slider{padding-top:44px;padding-bottom:20px}'
    # the stage: the middle picture full size, its neighbours smaller and faded at the sides
    '.ps-frame{position:relative;overflow:hidden;padding:16px 0 42px;touch-action:pan-y;-webkit-user-select:none;user-select:none;'
    '-webkit-mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent);mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)}'
    '.ps-track{display:flex;gap:22px;transition:transform .7s cubic-bezier(.2,.8,.2,1);will-change:transform}'
    '.ps-track.drag,.ps-track.no-tr{transition:none}'
    '.ps-slide{flex:0 0 54%;min-width:0;margin:0;aspect-ratio:3/2;overflow:hidden;border-radius:22px;background:#d9d6c8;cursor:pointer;opacity:.5;transform:scale(.86);'
    'transition:transform .7s cubic-bezier(.2,.8,.2,1),opacity .7s,box-shadow .7s}'
    '.ps-track.drag .ps-slide,.ps-track.no-tr .ps-slide{transition:none}'
    '.ps-slide.on{opacity:1;transform:none;cursor:default;box-shadow:0 18px 30px -22px #29251c80,0 0 0 1px #29251c14}'
    '.ps-slide img{display:block;width:100%;height:100%;object-fit:cover;object-position:50% 38%;pointer-events:none;-webkit-user-drag:none}'
    # controls under the pictures: arrow, dots, arrow
    '.ps-nav{display:flex;justify-content:center;align-items:center;gap:18px;margin-top:-14px}'
    '.ps-btn{display:grid;place-items:center;flex:none;width:42px;height:42px;border:1px solid var(--line);border-radius:50%;background:#fbf8f1;color:var(--ink);'
    'transition:background .25s,color .25s,transform .25s,border-color .25s;-webkit-tap-highlight-color:transparent}'
    '.ps-btn:hover{background:var(--ink);color:#fff;border-color:var(--ink);transform:translateY(-2px)}'
    '.ps-next svg{transform:scaleX(-1)}'
    '.rtl .ps-prev svg{transform:scaleX(-1)}.rtl .ps-next svg{transform:none}'
    '.ps-dots{display:flex;align-items:center;gap:2px}'
    '.ps-dots button{display:grid;place-items:center;height:30px;padding:0 4px;-webkit-tap-highlight-color:transparent}'
    '.ps-dots i{display:block;width:7px;height:7px;border-radius:4px;background:#b9b6a6;transition:width .35s,background .35s}'
    '.ps-dots button:hover i{background:#8e917f}'
    '.ps-dots .on i{width:26px;background:var(--ink)}'
    '@media (max-width:1000px){.ps-slide{flex-basis:66%}}'
    '@media (max-width:800px){.photo-slider{padding-top:26px;padding-bottom:6px}.ps-track{gap:12px}.ps-slide{flex-basis:78%;aspect-ratio:4/3;border-radius:16px;transform:scale(.9)}'
    '.ps-frame{padding:8px 0 30px}.ps-btn{width:38px;height:38px}.ps-nav{gap:12px}}'
    '@media (prefers-reduced-motion:reduce){.ps-track,.ps-slide{transition:none}}'
)

SLIDER_JS = r'''  /* ---- Factories page: the photo slider (centred picture with its neighbours at the sides; arrows, dots, swipe / drag, keys, auto-advance every 5 s) ---- */
  var psRoot = $('.photo-slider');
  if (psRoot) (function () {
    var frame = $('.ps-frame', psRoot), track = $('.ps-track', frame), slides = $$('.ps-slide', track), dots = $$('.ps-dots button', psRoot);
    var n = slides.length, EVERY = 5000, rtl = (ar || ku) ? 1 : -1;      // which way the track moves for the next picture
    if (n < 2) return;
    track.style.direction = (ar || ku) ? 'rtl' : 'ltr';
    var cur = 0, timer = 0, visible = true, hover = false, drag = null, step = 0, shift = 0;
    var measure = function () {
      var sw = slides[0].offsetWidth, gap = parseFloat(getComputedStyle(track).columnGap) || 0, cw = frame.clientWidth;
      step = sw + gap; shift = (cw - sw) / 2;
    };
    var place = function (dx) { measure(); track.style.transform = 'translate3d(' + (rtl * (cur * step - shift) + (dx || 0)).toFixed(1) + 'px,0,0)'; };
    var paint = function () {
      dots.forEach(function (b, k) { b.classList.toggle('on', k === cur); if (k === cur) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      slides.forEach(function (s, k) { s.classList.toggle('on', k === cur); s.setAttribute('aria-hidden', k === cur ? 'false' : 'true'); });
    };
    var go = function (i) { cur = (i + n) % n; place(0); paint(); };
    var schedule = function () {
      clearTimeout(timer); timer = 0;
      if (!motion || document.hidden || !visible || hover || drag) return;
      timer = setTimeout(function () { go(cur + 1); schedule(); }, EVERY);
    };
    $('.ps-prev', psRoot).addEventListener('click', function () { go(cur - 1); schedule(); });
    $('.ps-next', psRoot).addEventListener('click', function () { go(cur + 1); schedule(); });
    dots.forEach(function (b, k) { b.addEventListener('click', function () { go(k); schedule(); }); });
    // drag / swipe (a tap on a neighbouring picture brings it to the middle)
    frame.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      measure();
      drag = { x: e.clientX, id: e.pointerId, dx: 0, t: Date.now() };
      track.classList.add('drag'); clearTimeout(timer); timer = 0;
      try { frame.setPointerCapture(e.pointerId); } catch (x) {}
    });
    frame.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x, toward = dx * rtl;         // > 0: towards the next picture, < 0: towards the previous one
      if ((cur === 0 && toward < 0) || (cur === n - 1 && toward > 0)) dx *= 0.3;     // a little give at the ends, then it holds
      drag.dx = dx; place(dx);
    });
    var end = function (e) {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      var dx = drag.dx, quick = Date.now() - drag.t < 350;
      drag = null; track.classList.remove('drag');
      if (Math.abs(dx) < 6 && e && e.clientX !== undefined && e.type === 'pointerup') {            // a tap: which picture is under the finger?
        var hit = document.elementFromPoint(e.clientX, e.clientY), s = hit && hit.closest ? hit.closest('.ps-slide') : null, k = s ? slides.indexOf(s) : -1;
        go(k >= 0 ? k : cur);
      } else if (Math.abs(dx) > step * 0.22 || (quick && Math.abs(dx) > 30)) go(cur + (dx * rtl > 0 ? 1 : -1));
      else go(cur);
      schedule();
    };
    frame.addEventListener('pointerup', end); frame.addEventListener('pointercancel', end);
    // keys, hover, focus, visibility, size
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
    window.addEventListener('resize', function () { track.classList.add('no-tr'); place(0); void track.offsetWidth; track.classList.toggle('no-tr', !motion); });
    place(0); paint(); schedule();
  })();

'''
