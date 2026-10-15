"""Builds the whole single-file site (index.html) from the ORIGINAL upload:
  * swaps the old 2D tea game for the real WebGL 3D one (five steps), with the product picker
  * adds Central Kurdish (Sorani) pages for every page, a language menu (English / Arabic / Kurdish)
  * Arabic headlines in Arabic Typesetting (Amiri where it is not installed), Kurdish in NRT (Noto Sans Arabic where it is not installed)
Usage (see README.md):
  git show 445639b:index.html > original.html
  python3 integrate.py original.html ../game3d/dist/majeed3d.min.js ../index.html
Fonts: put ArabicTypesetting.ttf, NRT-Reg.ttf and NRT-Bd.ttf in site-build/fonts/ and rebuild to embed them (needs: pip install fonttools brotli).
"""
import json, re, sys

orig_path, bundle_path, out_path = sys.argv[1:4]
s = open(orig_path, encoding='utf-8').read()
bundle = open(bundle_path, encoding='utf-8').read()
assert '</script' not in bundle and '<!--' not in bundle

i_pages = s.index('window.__PAGES=') + len('window.__PAGES=')
pages, e_pages = json.JSONDecoder().raw_decode(s, i_pages)
i_img = s.index('window.__IMG=') + len('window.__IMG=')
imgs, e_img = json.JSONDecoder().raw_decode(s, i_img)

# ---------------------------------------------------------------- text per language
T = {
    'en': {
        'p': 'Five steps from leaf to glass. Add the leaves and cardamom, run the water, set it on the cooker, boil it, then pour. The teapot, glass and pouch are the real Majeed ones.',
        'status': ('Six steps from leaf to glass. Start with the leaves.', 'Five steps from leaf to glass. Start with the leaves.'),
        'stage': ('A kitchen scene with a glass teapot, a stove and a tea glass. Use the step buttons below to make the tea.',
                  'A 3D kitchen scene with a glass teapot, a tap, a stove and a tea glass. Use the step buttons below to make the tea.'),
        'ol': ('The six steps', 'The five steps'),
        's1': ('1. Put the tea leaves in', 'Put the tea leaves in', 'Add leaves', 'Lid off, leaves in',
               '1. Add the leaves and cardamom', 'Add leaves and cardamom', 'Add leaves', 'Lid off, leaves and cardamom in'),
        's5': ('6. Fill the cup', 'Fill the cup', 'Fill the cup', 'Pour from pot to cup',
               '5. Pour into the glass', 'Pour into the glass', 'Pour the tea', 'Pour from the pot into the glass'),
    },
    'ar': {
        'p': 'خمس خطوات من الورقة إلى الكأس: أضف الأوراق والهيل، افتح الماء، ضع الإبريق على الموقد، دعه يغلي ثم اسكب الشاي. الإبريق والكأس والكيس هي منتجات مجيد الحقيقية.',
        'status': ('ست خطوات من الورقة إلى الكأس. ابدأ بالأوراق.', 'خمس خطوات من الورقة إلى الكأس. ابدأ بالأوراق.'),
        'stage': ('مشهد مطبخ فيه إبريق زجاجي وموقد وكأس شاي. استخدم أزرار الخطوات في الأسفل لصنع الشاي.',
                  'مشهد مطبخ ثلاثي الأبعاد فيه إبريق زجاجي وصنبور وموقد وكأس شاي. استخدم أزرار الخطوات في الأسفل لصنع الشاي.'),
        'ol': ('الخطوات الست', 'الخطوات الخمس'),
        's1': ('1. ضع أوراق الشاي', 'ضع أوراق الشاي', 'الأوراق', 'ارفع الغطاء وأضف الأوراق',
               '1. أضف الأوراق والهيل', 'أضف الأوراق والهيل', 'الأوراق', 'ارفع الغطاء وأضف الأوراق والهيل'),
        's5': ('6. املأ الكأس', 'املأ الكأس', 'املأ الكأس', 'اسكب من الإبريق إلى الكأس',
               '5. اسكب في الكأس', 'اسكب في الكأس', 'اسكب', 'اسكب من الإبريق إلى الكأس'),
    },
}

PICK = {
    'en': ('Choose your tea', [('cardamom-pouch', 'Cardamom Pouch', 'Pouch'), ('cardamom-450g', 'Cardamom Tea', '450 g'), ('cardamom-800g', 'Cardamom Tea', '800 g'),
                              ('cardamom-1kg', 'Cardamom Tea', '1 kg'), ('classic-450g', 'Classic Black Tea', '450 g'), ('classic-800g', 'Classic Black Tea', '800 g')]),
    'ar': ('اختر شايك', [('cardamom-pouch', 'كيس شاي بالهيل', 'كيس'), ('cardamom-450g', 'شاي بالهيل', '٤٥٠ غ'), ('cardamom-800g', 'شاي بالهيل', '٨٠٠ غ'),
                         ('cardamom-1kg', 'شاي بالهيل', '١ كغ'), ('classic-450g', 'الشاي الأسود الكلاسيكي', '٤٥٠ غ'), ('classic-800g', 'الشاي الأسود الكلاسيكي', '٨٠٠ غ')]),
}

def picker_html(lang):
    label, items = PICK[lang]
    chips = ''.join(
        '<button class="gm-prod" type="button" role="radio" aria-checked="%s" data-slug="%s"><img src="assets/game/prod-%s.webp" alt="" draggable="false" decoding="async" width="30" height="46"/>'
        '<span><b>%s</b><small>%s</small></span></button>' % ('true' if n == 0 else 'false', slug, slug, name, sub)
        for n, (slug, name, sub) in enumerate(items))
    return '<div class="gm-picker" role="radiogroup" aria-label="%s"><span class="gm-picker-label">%s</span>%s</div>' % (label, label, chips)

CANVAS = ('<canvas class="gm-gl" aria-hidden="true"></canvas>'
          '<button class="gm-prompt" tabindex="-1" aria-hidden="true" data-on="false"><span></span></button>')

CSS_ADD = ('.gm-picker{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:0 0 14px;padding:2px 2px 4px}@media (max-width:800px){.gm-picker{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;padding-bottom:8px}.gm-picker::-webkit-scrollbar{display:none}}'
           '.gm-picker-label{flex:none;letter-spacing:.14em;text-transform:uppercase;color:#66685c;font:600 11px/1 DM Sans,Noto Sans Arabic,sans-serif;padding-inline-end:4px}'
           '.rtl .gm-picker-label{letter-spacing:0}'
           '.gm-prod{flex:none;display:flex;align-items:center;gap:10px;padding:6px 16px 6px 8px;border:1px solid var(--line);border-radius:999px;background:#fbf8f1;color:var(--ink);text-align:start;transition:background .25s,color .25s,border-color .25s,transform .25s,opacity .25s}'
           '.rtl .gm-prod{padding:6px 8px 6px 16px}'
           '.gm-prod img{width:30px;height:46px;object-fit:contain;flex:none;filter:drop-shadow(0 3px 3px #0003)}'
           '.gm-prod b{display:block;font:600 13px/1.15 DM Sans,Noto Sans Arabic,sans-serif;white-space:nowrap}'
           '.gm-prod small{display:block;margin-top:2px;color:#66685c;font-size:11px;line-height:1.2}'
           '.gm-prod:hover:not(:disabled){transform:translateY(-2px);border-color:#b9b4a6}'
           '.gm-prod[aria-checked=true]{background:var(--ink);color:#fff;border-color:var(--ink)}.gm-prod[aria-checked=true] small{color:#d8d3c7}'
           '.gm-prod:disabled{cursor:not-allowed;opacity:.55}.gm-prod[aria-checked=true]:disabled{opacity:.9}'
           '.gm-gl{display:block;position:absolute;inset:0;width:100%;height:100%;touch-action:pan-y}@media (max-width:800px){.gm-stage{aspect-ratio:5/3.9}}'
           '.gm-nogl .gm-fallback{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;gap:4%;padding:12% 8% 22%}'
           '.gm-nogl .gm-fallback img{width:34%;max-height:70%;object-fit:contain;filter:drop-shadow(0 12px 16px #0008)}')

WIRING = r'''  /* ---- tea game: a real WebGL 3D kitchen, five steps from leaf to glass ---- */
  var tg = $('.teagame');
  if (window.__mjGame && window.__mjGame.dispose) { try { window.__mjGame.dispose(); } catch (e) {} window.__mjGame = null; }
  if (tg && window.MJTeaGame) {
    var IC = function (p) { return '<svg xmlns="http://www.w3.org/2000/svg" width="{S}" height="{S}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; };
    var ICN = { check: IC('<path d="M20 6 9 17l-5-5"/>').replace(/\{S\}/g, 14), thermo: IC('<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>').replace(/\{S\}/g, 14),
      vol: IC('<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/>').replace(/\{S\}/g, 18),
      mute: IC('<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/>').replace(/\{S\}/g, 18),
      redo: IC('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>').replace(/\{S\}/g, 16) };
    var li = ku ? 2 : ar ? 1 : 0;
    var LINES = {
      idle: ['Five steps from leaf to glass. Start with the leaves.', 'خمس خطوات من الورقة إلى الكأس. ابدأ بالأوراق.', 'پێنج هەنگاو لە گەڵاوە تا ئیستکان. بە گەڵاکان دەست پێبکە.'],
      leaves: ['Leaves and cardamom going in…', 'الأوراق والهيل تدخل الإبريق…', 'گەڵا و هێل دەکرێنە ناو قوریەکەوە…'],
      'leaves-done': ['Leaves and cardamom are in. Now the water.', 'الأوراق والهيل في مكانهما. الآن الماء.', 'گەڵا و هێل لە ناودان. ئێستا ئاو.'],
      water: ['Water on!', 'الماء ينسكب!', 'ئاو دەڕژێت!'], 'water-done': ['Water is in. Time for the cooker.', 'الماء جاهز. إلى الموقد.', 'ئاو لە ناودایە. کاتی ئاگردانە.'],
      cooker: ['To the cooker!', 'إلى الموقد!', 'بەرەو ئاگردان!'], 'cooker-done': ['On the stove. Light it.', 'على الموقد. أشعل النار.', 'لەسەر ئاگردانە. ئاگرەکەی داگیرسێنە.'],
      boil: ['Boiling…', 'يغلي…', 'دەکوڵێت…'], 'boil-done': ['A rolling boil. Pour the tea into the glass.', 'غليان قوي. اسكب الشاي في الكأس.', 'کوڵانێکی بەهێز. چاکە بڕێژە ناو ئیستکانەکە.'],
      pour: ['Pouring…', 'نسكب…', 'دەیڕێژین…'], done: ['Your tea is ready.', 'شايك جاهز.', 'چاکەت ئامادەیە.'] };
    var LINES_PLAIN = { leaves: ['Tea leaves going in…', 'الأوراق تدخل الإبريق…', 'گەڵاکانی چا دەکرێنە ناو قوریەکەوە…'], 'leaves-done': ['Leaves are in. Now the water.', 'الأوراق في مكانها. الآن الماء.', 'گەڵاکان لە ناودان. ئێستا ئاو.'] };
    var STEP1 = { card: [['Add leaves and cardamom', 'Add leaves', 'Lid off, leaves and cardamom in'], ['أضف الأوراق والهيل', 'الأوراق', 'ارفع الغطاء وأضف الأوراق والهيل'], ['گەڵا و هێل زیاد بکە', 'گەڵاکان', 'سەرپۆش لابە، گەڵا و هێل بکەرە ناوی']],
                  plain: [['Add the tea leaves', 'Add leaves', 'Lid off, leaves in'], ['أضف أوراق الشاي', 'الأوراق', 'ارفع الغطاء وأضف الأوراق'], ['گەڵاکانی چا زیاد بکە', 'گەڵاکان', 'سەرپۆش لابە، گەڵاکان بکەرە ناوی']] };
    var step1Mode = '';
    var gst = $('.gm-stage', tg), gsteps = $$('.gm-steps .gm-step', tg), gstatus = $('.gm-status', tg), glive = $('.gm-sr', tg), gmute = $('.gm-icon', tg);
    var els = { stage: gst, canvas: $('.gm-gl', tg), prompt: $('.gm-prompt', tg) };
    var picks = $$('.gm-prod', tg), PRODS = ['cardamom-pouch', 'cardamom-450g', 'cardamom-800g', 'cardamom-1kg', 'classic-450g', 'classic-800g'];
    var last = { done: 0 }, muted = false, doneEl = null, game = null;
    var imgOf = function (p) { return (window.__IMG && window.__IMG[p]) || p; };
    var paintGame = function (u) {
      last = u;
      gsteps.forEach(function (b, i) {
        var n = i + 1, state = u.done >= n ? 'done' : n === u.done + 1 ? 'active' : 'locked';
        b.dataset.state = state; b.disabled = state !== 'active' || u.busy;
        var num = $('.gm-num', b); if (num) num.innerHTML = state === 'done' ? ICN.check : String(n);
      });
      var mode = u.card === false ? 'plain' : 'card';
      if (mode !== step1Mode && gsteps[0]) {
        step1Mode = mode; var t1 = STEP1[mode][li], b1 = gsteps[0];
        var f1 = $('.gm-full', b1), s1 = $('.gm-short', b1), m1 = $('small', b1);
        if (f1) f1.textContent = t1[0]; if (s1) s1.textContent = t1[1]; if (m1) m1.textContent = t1[2]; b1.setAttribute('aria-label', '1. ' + t1[0]);
      }
      var line = ((mode === 'plain' && LINES_PLAIN[u.phase]) || LINES[u.phase] || LINES.idle)[li];
      if (gstatus) gstatus.innerHTML = line + (u.phase === 'boil' ? '<b>' + ICN.thermo + u.temp + '°C</b>' : '');
      if (glive) glive.textContent = line + (u.phase === 'boil' ? ' ' + u.temp + '°C' : '');
      picks.forEach(function (b) { b.disabled = !!u.busy || (u.done > 0 && u.done < 5); });
      if (u.done === 5 && !doneEl) {
        doneEl = document.createElement('div'); doneEl.className = 'gm-done'; doneEl.setAttribute('role', 'status');
        doneEl.innerHTML = '<p>' + L('Your tea is ready.', 'شايك جاهز.', 'چاکەت ئامادەیە.') + '</p><button>' + ICN.redo + L('Brew again', 'اصنع مرة أخرى', 'دووبارە دروست بکەرەوە') + '</button>';
        $('button', doneEl).addEventListener('click', function () { game.reset(); });
        gst.appendChild(doneEl);
      } else if (u.done !== 5 && doneEl) { doneEl.remove(); doneEl = null; }
    };
    var booted = false;
    var boot = function () {
      if (booted) return; booted = true;
      try {
        var prodImgs = {}; PRODS.forEach(function (s) { prodImgs[s] = imgOf('assets/game/prod-' + s + '.webp'); });
        game = new window.MJTeaGame.TeaGame(els, { logo: imgOf('assets/logo.png'), prod: prodImgs }, paintGame, motion);
        window.__mjGame = game;
      } catch (err) {
        /* no WebGL here: show the real products and say so, instead of a broken box */
        game = null; gst.classList.add('gm-nogl');
        var fb = document.createElement('div'); fb.className = 'gm-fallback';
        fb.innerHTML = '<img src="' + imgOf('assets/teaware-teapot.webp') + '" alt=""/><img src="' + imgOf('assets/teaware-glass.webp') + '" alt=""/>';
        gst.insertBefore(fb, gst.firstChild);
        if (gstatus) gstatus.textContent = L('Your device can’t show the 3D scene.', 'جهازك لا يعرض المشهد ثلاثي الأبعاد.', 'ئامێرەکەت ناتوانێت دیمەنی سێ ڕەهەندی پیشان بدات.');
        gsteps.forEach(function (b) { b.disabled = true; b.dataset.state = 'locked'; });
        picks.forEach(function (b) { b.disabled = true; });
        return;
      }
      game.start();
      if (gmute) gmute.addEventListener('click', function () { muted = !muted; game.setMuted(muted); gmute.setAttribute('aria-pressed', String(muted)); gmute.innerHTML = muted ? ICN.mute : ICN.vol; });
      new IntersectionObserver(function (en) { game.setVisible(en[0].isIntersecting); }, { rootMargin: '80px' }).observe(gst);
      new ResizeObserver(function () { game.resize(); }).observe(gst);
      gst.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var b = gst.getBoundingClientRect(); game.pointer(((e.clientX - b.left) / b.width - 0.5) * 2, ((e.clientY - b.top) / b.height - 0.5) * 2);
      });
      gst.addEventListener('pointerleave', function () { game.pointer(0, 0); });
      onMotion.push(function () { game.setMotion(motion); });
    };
    gsteps.forEach(function (b, i) { b.addEventListener('click', function () { boot(); if (game) game.run(i + 1); }); });
    picks.forEach(function (b) { b.addEventListener('click', function () {
      boot(); if (!game || !game.setProduct(b.dataset.slug)) return;
      picks.forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
      try { b.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) {}
    }); });
    if (els.prompt) els.prompt.addEventListener('click', function () { boot(); if (game) game.run(last.done + 1); });
    /* the 3D scene is only built when the section is about to be seen, so the page itself loads as fast as before */
    if ('IntersectionObserver' in window) {
      var bio = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { bio.disconnect(); boot(); } }, { rootMargin: '600px 0px' });
      bio.observe(gst);
    } else boot();
  }

  /* ---- language menu: closes on an outside click or Escape ---- */
  $$('.lang-switch details', root).forEach(function (d) {
    document.addEventListener('click', function (e) { if (d.open && !d.contains(e.target)) d.open = false; });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && d.open) { d.open = false; var sm = $('summary', d); if (sm && d.contains(document.activeElement)) sm.focus(); } });
  });

'''

changed = {}
for key in ('index.html', 'ar.html'):
    h = pages[key]
    lang = 'ar' if key == 'ar.html' else 'en'
    t = T[lang]

    # ---- section markup
    a = h.index('<section class="teagame')
    b = h.index('</section>', a) + len('</section>')
    sec = h[a:b]
    # paragraph under the heading
    sec, n = re.subn(r'(<div class="section-heading"><div><h2 id="teagame-title">.*?</h2></div><p>).*?(</p></div>)', lambda m: m.group(1) + t['p'] + m.group(2), sec, count=1, flags=re.S)
    assert n == 1, key
    sec = sec.replace('<div class="gm-frame">', '<div class="gm-frame">' + picker_html(lang), 1)
    assert 'gm-picker' in sec
    # 2D scene -> one WebGL canvas
    p0 = sec.index('<div class="gm-persp">')
    p1 = sec.index('<div class="gm-heat"')
    sec = sec[:p0] + CANVAS + sec[p1:]
    for old, new in ((t['status'][0], t['status'][1]), (t['stage'][0], t['stage'][1]), (t['ol'][0], t['ol'][1])):
        assert old in sec, (key, old)
        sec = sec.replace(old, new)
    # steps: drop the old "fill the pot with another pot" step, renumber the last one
    lis = re.findall(r'<li><button class="gm-step".*?</button></li>', sec, flags=re.S)
    assert len(lis) == 6, (key, len(lis))
    l1, l5, l6 = lis[0], lis[4], lis[5]
    o = t['s1']; n1 = l1.replace(o[0], o[4]).replace('<span class="gm-full">' + o[1] + '</span>', '<span class="gm-full">' + o[5] + '</span>').replace('<span class="gm-short">' + o[2] + '</span>', '<span class="gm-short">' + o[6] + '</span>').replace('<small>' + o[3] + '</small>', '<small>' + o[7] + '</small>')
    assert n1 != l1
    o = t['s5']; n6 = l6.replace(o[0], o[4]).replace('<span class="gm-num">6</span>', '<span class="gm-num">5</span>').replace('<span class="gm-full">' + o[1] + '</span>', '<span class="gm-full">' + o[5] + '</span>').replace('<span class="gm-short">' + o[2] + '</span>', '<span class="gm-short">' + o[6] + '</span>').replace('<small>' + o[3] + '</small>', '<small>' + o[7] + '</small>')
    assert n6 != l6
    sec = sec.replace(l1, n1).replace(l5, '').replace(l6, n6)
    assert sec.count('class="gm-step"') == 5
    h = h[:a] + sec + h[b:]

    # ---- CSS
    last_style = h.rindex('</style>')
    h = h[:last_style] + CSS_ADD + h[last_style:]
    old_heat = 'at 82% 76%'
    assert old_heat in h
    h = h.replace(old_heat, 'at 60% 58%')

    changed[key] = h

pages.update(changed)

# ---- every page carries the shared scripts: the old 2D engine becomes a stub (the engine loads once, outside the pages),
# ---- and the tea-game wiring is replaced (it only does anything on a page that has the tea-game section)
for key, h in list(pages.items()):
    scripts = [(m.start(), m.end()) for m in re.finditer(r'<script[^>]*>.*?</script>', h, flags=re.S)]
    eng = [(x, y) for (x, y) in scripts if 'var MJTeaGame=' in h[x:y]]
    wir = [(x, y) for (x, y) in scripts if '/* ---- tea game: the same engine the site uses' in h[x:y]]
    assert len(wir) == 1 and len(eng) <= 1, (key, len(eng), len(wir))
    (a3, b3) = wir[0]
    w0 = h.index('  /* ---- tea game: the same engine the site uses, driven from the rendered markup ---- */', a3)
    w1 = h.index('  /* ---- site-wide 3D layer', w0)
    h = h[:w0] + WIRING + h[w1:]
    if eng:
        # the wiring script comes after the engine on the pages that have it, so cut the engine last-to-first by position
        a2, b2 = eng[0]
        assert b2 <= a3
        h = h[:a2] + '<script>/* the 3D tea game engine is loaded once, before the pages */</script>' + h[b2:]
    pages[key] = h

import base64, os
here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, here)
from ku_strings import KU_BY_INDEX, KU_SCRIPT, KU_GAME

# ======================================================================================================================
# LANGUAGES: Kurdish (Sorani), the language menu, and the fonts
# ======================================================================================================================
AR = re.compile(r'[\u0600-\u06FF]')

# ---- Kurdish dictionary: page strings + script strings + the new game wording (keyed by the exact Arabic used on the page)
KU = dict(KU_BY_INDEX)
for k, v in KU_SCRIPT.items():
    assert KU.get(k, v) == v, ('conflicting translation', k)
    KU[k] = v
_g = KU_GAME
GAME_PAIRS = [
    (T['ar']['p'], _g['p']), (T['ar']['status'][1], _g['status']), (T['ar']['stage'][1], _g['stage']), (T['ar']['ol'][1], _g['ol']),
    (PICK['ar'][0], _g['picker_label']), ('كيس', 'کیسە'), ('الصوت', _g['sound']), ('لعبة صنع الشاي', _g['roledesc']),
    ('اصنع الشاي كما ينبغي.', 'چا وەک پێویست دروست بکە.'),
    # steps 2-4 keep their old Arabic wording
    ('2. أضف الماء', '2. ئاو زیاد بکە'), ('أضف الماء', 'ئاو زیاد بکە'), ('الماء', 'ئاو'), ('افتح الصنبور', 'ئاوەکە بکەرەوە'),
    ('3. ضعه على الموقد', '3. بیخە سەر ئاگردان'), ('ضعه على الموقد', 'بیخە سەر ئاگردان'), ('الموقد', 'ئاگردان'), ('أغلق الغطاء وارفع الإبريق', 'سەرپۆش دابخە و قوریەکە هەڵبگرە'),
    ('4. اغلِه', '4. بیکوڵێنە'), ('اغلِه', 'بیکوڵێنە'), ('أشعل النار', 'ئاگرەکە داگیرسێنە'),
]
for a_, k_ in zip(T['ar']['s1'][4:8], _g['s1']): GAME_PAIRS.append((a_, k_))
for a_, k_ in zip(T['ar']['s5'][4:8], _g['s5']): GAME_PAIRS.append((a_, k_))
for a_, k_ in GAME_PAIRS:
    assert KU.get(a_, k_) == k_, ('conflicting game translation', a_)
    KU[a_] = k_

def ku_of(ar_text):
    if not ar_text: return ''
    if ar_text not in KU: raise KeyError('no Kurdish for: ' + ar_text)
    return KU[ar_text]

# ---- 1) the shared page script learns a third language
DET_KU = [ku_of(x) for x in ('تأمل لون الشاي في ضوء النهار.', 'دع البخار الدافئ يملأ اللحظة.', 'تبدأ حكاية كل كوب بورقة.', 'لمسة الهيل في مجموعة الشاي المعطر.', 'اهتمام بالتفاصيل، من الورقة إلى الكوب.', 'حضر الشاي حسب تعليمات العبوة.')]
SCRIPT_PATCHES = [
    ("var D = window.__MJ || {}, lang = D.lang || 'en', ar = lang === 'ar';",
     "var D = window.__MJ || {}, lang = D.lang || 'en', ar = lang === 'ar', ku = lang === 'ku', L = function (e, a, k) { return ku ? k : ar ? a : e; };"),
    ("document.documentElement.lang = lang;", "document.documentElement.lang = ku ? 'ckb' : lang;"),
    ("document.documentElement.dir = ar ? 'rtl' : 'ltr';", "document.documentElement.dir = (ar || ku) ? 'rtl' : 'ltr';"),
    ("(motion ? (ar ? 'إيقاف الحركة' : 'Pause motion') : (ar ? 'تشغيل الحركة' : 'Enable motion'))",
     "(motion ? L('Pause motion', 'إيقاف الحركة', %s) : L('Enable motion', 'تشغيل الحركة', %s))" % (json.dumps(ku_of('إيقاف الحركة'), ensure_ascii=False), json.dumps(ku_of('تشغيل الحركة'), ensure_ascii=False))),
    ("ar ? 'القائمة' : 'Navigation'", "L('Navigation', 'القائمة', %s)" % json.dumps(ku_of('القائمة'), ensure_ascii=False)),
    ("(ar ? 'إغلاق القائمة' : 'Close menu')", "L('Close menu', 'إغلاق القائمة', %s)" % json.dumps(ku_of('إغلاق القائمة'), ensure_ascii=False)),
    ("'<p>طعم كل الأوقات</p>'", "'<p>' + L('طعم كل الأوقات', 'طعم كل الأوقات', %s) + '</p>'" % json.dumps(ku_of('طعم كل الأوقات'), ensure_ascii=False)),
    ("var word = ar ? m.ar : m.en;", "var word = m[lang] || m.en;"),
    ("ar ? m.titleAr : m.titleEn", "ku ? m.titleKu : ar ? m.titleAr : m.titleEn"),
    ("(ar ? 'عرض ' : 'Show ')", "L('Show ', 'عرض ', %s)" % json.dumps(ku_of('عرض '), ensure_ascii=False)),
    ("(l === 'en' ? 'index.html' : 'ar.html')", "(l === 'en' ? 'index.html' : l + '.html')"),
    ("var DET = ar ? [", "var DET = ku ? %s : ar ? [" % json.dumps(DET_KU, ensure_ascii=False)),
    ("s.textContent = ar ? 'هذه نسخة معاينة، ولا ترسل الرسائل.' : 'This is a preview, so messages are not sent.';",
     "s.textContent = L('This is a preview, so messages are not sent.', 'هذه نسخة معاينة، ولا ترسل الرسائل.', %s);" % json.dumps(ku_of('هذه نسخة معاينة، ولا ترسل الرسائل.'), ensure_ascii=False)),
]
for key, h in list(pages.items()):
    for old, new_ in SCRIPT_PATCHES:
        if old == "var DET = ar ? [" and 'var DET = ar ? [' not in h:
            continue                      # the tea-detail tabs only exist on the home pages
        assert old in h or old in ("(ar ? 'عرض ' : 'Show ')", "ar ? m.titleAr : m.titleEn", "var word = ar ? m.ar : m.en;", "(l === 'en' ? 'index.html' : 'ar.html')", "s.textContent = ar ? 'هذه نسخة معاينة، ولا ترسل الرسائل.' : 'This is a preview, so messages are not sent.';"), (key, old[:60])
        h = h.replace(old, new_)
    pages[key] = h

# ---- 2) window.__MJ carries the Kurdish names, so the sliders and tabs work in Kurdish
def patch_mj(h, set_lang=None):
    i = h.index('window.__MJ=') + len('window.__MJ=')
    data, e = json.JSONDecoder().raw_decode(h, i)
    for mo in data['moments']:
        mo['ku'] = ku_of(mo['ar']); mo['titleKu'] = ku_of(mo['titleAr'])
    for pr in data['products']:
        for f in ('name', 'category', 'weight', 'description'):
            pr[f]['ku'] = ku_of(pr[f]['ar'])
    if set_lang: data['lang'] = set_lang
    return h[:i] + json.dumps(data, ensure_ascii=False) + h[e:]
for key in list(pages):
    pages[key] = patch_mj(pages[key])

# ---- 3) the Kurdish pages: the Arabic pages with every string swapped for Kurdish
def to_ku(key, h):
    segs = re.split(r'(<script.*?</script>|<style.*?</style>)', h, flags=re.S)
    missing = set()
    def val(raw):
        if not AR.search(raw): return None
        core = raw.strip(); lead = raw[:len(raw) - len(raw.lstrip())]; trail = raw[len(raw.rstrip()):]
        k = KU.get(core)
        if k is None: missing.add(core); return None
        k = re.sub(r'(?<=[^\s\u2060])([.،؟!:؛])', '\u2060\\1', k)      # a word joiner keeps the full stop with the word before it when a headline wraps
        return lead + k + trail
    for i, seg in enumerate(segs):
        if seg.startswith('<script') or seg.startswith('<style'): continue
        seg = re.sub(r'>([^<>]+)<', lambda m: ('>' + val(m.group(1)) + '<') if val(m.group(1)) is not None else m.group(0), seg)
        seg = re.sub(r'\b(aria-label|alt|title|placeholder|aria-roledescription|content)="([^"]*)"', lambda m: ('%s="%s"' % (m.group(1), val(m.group(2)))) if val(m.group(2)) is not None else m.group(0), seg)
        seg = re.sub(r'href="ar(\.html|-[A-Za-z0-9-]+\.html)"', r'href="ku\1"', seg)
        segs[i] = seg
    if missing:
        raise SystemExit('MISSING KURDISH for %s:\n' % key + '\n'.join('  ' + m.replace('\n', '⏎') for m in sorted(missing)))
    h = ''.join(segs)
    assert '<html lang="ar" dir="rtl">' in h, key
    h = h.replace('<html lang="ar" dir="rtl">', '<html lang="ckb" dir="rtl">', 1)
    assert '<div class="site rtl ">' in h, key
    h = h.replace('<div class="site rtl ">', '<div class="site rtl ku ">', 1)
    assert '"lang": "ar"' in h, key
    h = h.replace('"lang": "ar"', '"lang": "ku"', 1)
    return h
for key in [k for k in list(pages) if k.startswith('ar')]:
    pages['ku' + key[2:]] = to_ku(key, pages[key])
print('Kurdish pages:', sorted(k for k in pages if k.startswith('ku')))

# ---- 4) the language menu (English / العربية / کوردی) and the fonts' CSS, on every page
LANGS = [('en', 'English', 'en'), ('ar', 'العربية', 'ar'), ('ku', 'کوردی', 'ckb')]
LANG_LABEL = {'en': 'Language', 'ar': 'اللغة', 'ku': 'زمان'}
def page_id(key):
    if key == 'index.html': return 'en', ''
    m = re.match(r'^(en|ar|ku)(?:-(.+))?\.html$', key)
    return m.group(1), (m.group(2) or '')
def url_for(lang, rest):
    return ('index' if lang == 'en' else lang) + '.html' if not rest else lang + '-' + rest + '.html'
def add_switcher(key, h):
    cur, rest = page_id(key)
    m = re.search(r'<a class="language" href="[^"]*" aria-label="[^"]*">(<svg.*?</svg>)[^<]*</a>', h, re.S)
    assert m, key
    items = ''.join('<a lang="%s" hreflang="%s" href="%s"%s>%s</a>' % (hl, hl, url_for(l, rest), ' aria-current="true"' if l == cur else '', name) for l, name, hl in LANGS)
    names = {l: (name, hl) for l, name, hl in LANGS}
    html = ('<div class="lang-switch"><details><summary aria-label="%s">%s<span lang="%s">%s</span></summary><div class="lang-menu">%s</div></details></div>'
            % (LANG_LABEL[cur], m.group(1), names[cur][1], names[cur][0], items))
    return h[:m.start()] + html + h[m.end():]

CSS_LANG = (
    # language menu
    '.lang-switch{position:relative;font-size:12px}'
    '.lang-switch summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:8px;padding:8px 4px;-webkit-user-select:none;user-select:none}'
    '.lang-switch summary::-webkit-details-marker{display:none}'
    '.lang-switch summary::after{content:"";width:6px;height:6px;margin-top:-3px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(45deg);transition:transform .2s}'
    '.lang-switch details[open] summary::after{margin-top:3px;transform:rotate(225deg)}'
    '.lang-switch summary:focus-visible{outline:3px solid #2849aa;outline-offset:3px;border-radius:8px}'
    '.lang-menu{position:absolute;top:calc(100% + 8px);inset-inline-end:0;z-index:60;min-width:172px;padding:6px;display:grid;gap:2px;background:#faf6ee;border:1px solid #d8d3c7;border-radius:16px;box-shadow:0 14px 40px #29261833}'
    '.lang-menu a{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:10px 14px;border-radius:11px;font-size:15px;line-height:1.2;white-space:nowrap}'
    '.lang-menu a:hover,.lang-menu a:focus-visible{background:#ebe6da}'
    '.lang-menu a[aria-current=true]{color:var(--red);font-weight:600}'
    '.lang-menu a[aria-current=true]::after{content:"";width:6px;height:11px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg) translateY(-2px)}'
    '@media (max-width:800px){.lang-switch{font-size:11px}}'
    # the tea in every CSS-drawn glass (hero, button icon, footer, taste section, contact, about...) is near-black, like the tea in the game
    '.glass-liquid{background:linear-gradient(90deg,#150703f4,#220d06f6 20%,#2e1208 46%,#4a1e0b 76%,#1a0804f4);box-shadow:inset 3px 0 8px #ff9a5224,inset 0 5px 2px #060201,inset 0 -5px 6px #8f4a1c2e}'
    '.footer-brand .tea-glass{opacity:.92}'
    # fonts: Arabic headlines in Arabic Typesetting (Amiri where it is not installed); Kurdish in NRT (Noto Sans Arabic where it is not installed)
    ":root{--ar-head:'Arabic Typesetting','Amiri',Manrope,'Noto Sans Arabic',sans-serif;--ku-font:'NRT','Noto Sans Arabic','DM Sans',sans-serif;--ku-head:'NRT','Noto Sans Arabic',Manrope,sans-serif}"
    '.rtl:not(.ku) h1,.rtl:not(.ku) h2,.rtl:not(.ku) h3,.rtl:not(.ku) .hero-copy h1,.rtl:not(.ku) .footer-brand h2,.rtl:not(.ku) .classic,.rtl:not(.ku) .modern,.rtl:not(.ku) .moment-word,.rtl:not(.ku) .moment-scene-word,.rtl:not(.ku) .showroom-word,'
    '.site:not(.rtl) .arabic-hero,.site:not(.rtl) .footer-brand h2,.site:not(.ku) .mobile-menu>p{font-family:var(--ar-head);font-weight:400;font-style:normal;letter-spacing:0}'
    '.rtl:not(.ku) h1,.rtl:not(.ku) h2,.rtl:not(.ku) h3{line-height:1.3}'
    '.ku{font-family:var(--ku-font)}'
    '.ku h1,.ku h2,.ku h3,.ku .hero-copy h1,.ku .footer-brand h2,.ku .classic,.ku .modern,.ku .moment-word,.ku .moment-scene-word,.ku .showroom-word,.ku .mobile-menu>a,.ku .mobile-menu>p,.ku .primary-text strong,.ku .radial-caption{font-family:var(--ku-head);font-style:normal;letter-spacing:0}'
    '.ku h1,.ku h2,.ku h3,.ku .hero-copy h1,.ku .footer-brand h2,.ku .classic,.ku .modern{font-weight:700;line-height:1.35}'
    '.ku .hero-copy h1{font-size:clamp(40px,4.8vw,68px)}@media (max-width:800px){.ku .hero-copy h1{font-size:44px}}@media (max-width:420px){.ku .hero-copy h1{font-size:38px}}'
    '.ku .eyebrow,.ku .pill,.ku .hero-topline,.ku .collection-count,.ku .scroll-cue,.ku .brand b{letter-spacing:0}'
    '.ku .gm-picker-label,.ku .gm-prod b,.ku .gm-status,.ku .gm-step strong,.ku .gm-done p{font-family:var(--ku-font)}'
)
for key in list(pages):
    h = add_switcher(key, pages[key])
    ls = h.rindex('</style>')
    pages[key] = h[:ls] + CSS_LANG + h[ls:]

# ---- 5) the fonts themselves. Arabic Typesetting and NRT are used where they are installed (local()), and are embedded from
# ----    fonts/ if the font files are there (they are licensed/third-party fonts, so they are not downloaded or bundled here).
AR_RANGE = 'U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF,U+200C-200F'
def font_b64(path, keep_all=False):
    """woff2 (Arabic-script subset) of a font file, base64."""
    from fontTools import subset
    from fontTools.ttLib import TTFont
    opts = subset.Options(); opts.layout_features = ['*']; opts.flavor = 'woff2'; opts.name_IDs = ['*']; opts.notdef_outline = True; opts.glyph_names = False
    f = TTFont(path)
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=list(range(0x0020, 0x007F)) + list(range(0x00A0, 0x00B0)) + list(range(0x0600, 0x0700)) + list(range(0x0750, 0x0780)) + list(range(0x200C, 0x2010)) + [0x2026])
    sub.subset(f); f.flavor = 'woff2'
    import io
    buf = io.BytesIO(); f.save(buf)
    return base64.b64encode(buf.getvalue()).decode()
def find_font(*stems):
    d = os.path.join(here, 'fonts')
    if not os.path.isdir(d): return None
    for fn in sorted(os.listdir(d)):
        base = os.path.splitext(fn)[0].lower().replace(' ', '').replace('_', '').replace('-', '')
        if os.path.splitext(fn)[1].lower() in ('.ttf', '.otf', '.woff2', '.woff') and base in stems: return os.path.join(d, fn)
    return None
def face(family, weight, locals_, user_font, extra='', raw=None):
    parts = ["local('%s')" % n for n in locals_]
    if raw: parts.append("url(data:font/woff2;base64,%s) format('woff2')" % base64.b64encode(open(raw, 'rb').read()).decode())     # an open font that is already prepared: no tools needed
    elif user_font: parts.append("url(data:font/woff2;base64,%s) format('woff2')" % font_b64(user_font))
    assert parts, family
    return "@font-face{font-family:'%s';font-style:normal;font-weight:%s;font-display:swap;%sunicode-range:%s;src:%s}" % (family, weight, extra, AR_RANGE, ','.join(parts))
f_at = find_font('arabictypesetting', 'arabtype', 'arabictypesettingregular')
f_nrt = find_font('nrt', 'nrtreg', 'nrtregular', 'nrtlight')
f_nrtb = find_font('nrtbd', 'nrtbold')
print('fonts supplied -> Arabic Typesetting:', bool(f_at), '| NRT regular:', bool(f_nrt), '| NRT bold:', bool(f_nrtb))
FONT_FACES = (
    face('Arabic Typesetting', '400 700', ['Arabic Typesetting', 'ArabicTypesetting', 'Arabic Typesetting Regular', 'ArabicTypesetting-Regular'], f_at, 'size-adjust:125%;')
    + face('NRT', '400', ['NRT Reg', 'NRT-Reg', 'NRT Regular', 'NRT'], f_nrt)
    + face('NRT', '500 900', ['NRT Bold', 'NRT-Bd', 'NRT Bd', 'NRT-Bold'], f_nrtb or f_nrt)
)
# open-licence fallback for Arabic headlines where Arabic Typesetting is not installed: Amiri (SIL OFL), a classical Naskh
_amiri = os.path.join(here, 'fonts-open', 'amiri-arabic-400-subset.woff2')
FONT_FACES += face('Amiri', '400', [], None, raw=_amiri)
for slug in ('cardamom-pouch', 'cardamom-450g', 'cardamom-800g', 'cardamom-1kg', 'classic-450g', 'classic-800g'):
    with open(os.path.join(here, '..', 'game3d', 'products', slug + '.webp'), 'rb') as fh:
        imgs['assets/game/prod-%s.webp' % slug] = 'data:image/webp;base64,' + base64.b64encode(fh.read()).decode()

# ---------------------------------------------------------------- images: drop what only the old 2D game used
blob = json.dumps(pages, ensure_ascii=False)
for k in list(imgs):
    if k in ('assets/game/pouch.webp', 'assets/logo.png', 'assets/teaware-glass.webp', 'assets/teaware-teapot.webp'):
        continue
    if k not in blob:
        del imgs[k]

def jx(o):
    t = json.dumps(o, ensure_ascii=False)
    return t.replace('</', '<\\/').replace('<!--', '\\u003c!--').replace('-->', '--\\u003e')

new = s[:i_img] + jx(imgs) + s[e_img:i_pages]
new += jx(pages) + s[e_pages:]
# the extra @font-face rules join the site's shared font stylesheet (it is swapped in for the Google Fonts @import on every page)
i_f = new.index('window.__FONTCSS=') + len('window.__FONTCSS=')
css_old, e_f = json.JSONDecoder().raw_decode(new, i_f)
new = new[:i_f] + jx(css_old + FONT_FACES) + new[e_f:]
# the engine, once, before the page loader runs
loader_marker = 'window.__go=function(n)'
k = new.index(loader_marker)
new = new[:k] + '/* Majeed tea game: real WebGL 3D engine */\n' + bundle + '\n' + new[k:]
old_swap = 'document.open();document.write(h)'
assert old_swap in new
new = new.replace(old_swap, 'if(window.__mjGame){try{window.__mjGame.dispose()}catch(e){}window.__mjGame=null}' + old_swap, 1)
open(out_path, 'w', encoding='utf-8').write(new)
print('written', out_path, len(new), 'bytes; images kept:', len(imgs))
