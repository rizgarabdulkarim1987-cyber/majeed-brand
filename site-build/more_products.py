"""Products added to the range, and the one function that adds any product (slider, product index, count, its own pages in EN / AR / KU).
Used by integrate.py:  add_products(pages, imgs, [GOLD] + CARTONS, here),  KU_CARTONS (Arabic -> Kurdish for the new wording).

CARTONS are two of the pack photos the owner supplied (Majeed Cardamom 4.2 kg, Pekoe Black 8 kg); PREMIUM_BAG is the third (the yellow 1 kg bag).
Every figure and phrase below is what is printed on the pack. 'Kurdish' is Central Kurdish (Sorani); a native speaker should read it once."""
import base64, json, os, re

CARTONS = [
    {'slug': 'cardamom-4200g', 'accent': '#498339', 'image': 'assets/revised-cardamom-4200.webp', 'wide': True,
     'name': {'en': 'Cardamom Tea', 'ar': 'شاي بالهيل', 'ku': 'چای بە هێل'},
     'category': {'en': 'Tea carton', 'ar': 'كرتون شاي', 'ku': 'کارتۆنی چا'},
     'weight': {'en': '4.2 kg', 'ar': '٤٫٢ كغ', 'ku': '٤٫٢ کگم'},
     'size': {'en': '4.2 kg (21 × 200 g)', 'ar': '٤٫٢ كغ (٢١ × ٢٠٠ غ)', 'ku': '٤٫٢ کگم (٢١ × ٢٠٠ گم)'},
     'description': {'en': 'Premium cardamom tea in a 4.2 kg carton: 21 packs of 200 g, with a free gift inside.',
                     'ar': 'شاي بالهيل فاخر في كرتون ٤٫٢ كغ: ٢١ كيساً × ٢٠٠ غرام، مع هدية مجانية بداخله.',
                     'ku': 'چای هێلی نایاب لە کارتۆنێکی ٤٫٢ کگمی: ٢١ پاکێت، هەر یەکەیان ٢٠٠ گرام، لەگەڵ دیارییەکی بێبەرامبەر لە ناویدا.'},
     'flavor': None},                       # None = keep the cardamom pages' "Cardamom"
    {'slug': 'pekoe-black-8000g', 'accent': '#c4161c', 'image': 'assets/revised-pekoe-8000.webp', 'wide': True,
     'name': {'en': 'Pekoe Black Tea', 'ar': 'شاي بيكو أسود', 'ku': 'چای ڕەشی پیکۆ'},
     'category': {'en': 'Tea carton', 'ar': 'كرتون شاي', 'ku': 'کارتۆنی چا'},
     'weight': {'en': '8 kg', 'ar': '٨ كغ', 'ku': '٨ کگم'},
     'size': {'en': '8 kg (20 × 400 g)', 'ar': '٨ كغ (٢٠ × ٤٠٠ غ)', 'ku': '٨ کگم (٢٠ × ٤٠٠ گم)'},
     'description': {'en': 'Carefully selected whole-leaf black tea, with a blend of luxury and tradition. 20 packs of 400 g.',
                     'ar': 'شاي أسود مختار بعناية، ذو ورقة كاملة، يتميز بمزيج من الفخامة والتقاليد. ٢٠ كيساً × ٤٠٠ غرام.',
                     'ku': 'چای ڕەشی بە وردی هەڵبژێردراو، بە گەڵای تەواو، تێکەڵەیەک لە شکۆمەندی و داب‌ونەریت. ٢٠ پاکێت × ٤٠٠ گرام.'},
     'flavor': {'en': 'Whole-leaf black tea', 'ar': 'شاي أسود بالورقة الكاملة', 'ku': 'چای ڕەش بە گەڵای تەواو'}},
]

# the yellow 1 kg bag ("Premium Tea"); its wording is what is printed on the bag
PREMIUM_BAG = {'slug': 'premium-1kg', 'accent': '#d8a11a', 'image': 'assets/revised-premium-1000.webp',
    'name': {'en': 'Premium Tea', 'ar': 'شاي ممتاز', 'ku': 'چای نایاب'},
    'category': {'en': 'Tea pouch', 'ar': 'كيس شاي', 'ku': 'کیسەی چا'},
    'weight': {'en': '1 kg', 'ar': '١ كغ', 'ku': '١ کگم'},
    'description': {'en': 'Premium black tea from the finest tea estates, in a 1 kg bag. Store in a cool, dry place.',
                    'ar': 'شاي أسود ممتاز من أجود مزارع الشاي، في كيس ١ كغ. يُحفظ في مكان بارد وجاف.',
                    'ku': 'چای ڕەشی نایاب لە باشترین کێڵگەکانی چا، لە کیسەیەکی ١ کگمیدا. لە شوێنێکی ساردی وشک بیپارێزە.'},
    'flavor': {'en': 'Premium black tea', 'ar': 'شاي أسود ممتاز', 'ku': 'چای ڕەشی نایاب'}}

NEW_PRODUCTS = CARTONS + [PREMIUM_BAG]       # added one after the other, after the Golden Majeed tin

def ku_entries(specs):
    """Arabic text used on the pages -> Kurdish (names, categories, weights, sizes, descriptions, flavours and the page titles)."""
    out = {}
    def put(ar, ku):
        assert out.get(ar, ku) == ku, ('conflicting Kurdish', ar)
        out[ar] = ku
    for s in specs:
        for f in ('name', 'category', 'weight', 'size', 'description'):
            if f in s: put(s[f]['ar'], s[f]['ku'])
        put('%s %s | Majeed Tea' % (s['name']['ar'], s['weight']['ar']), '%s %s | Majeed Tea' % (s['name']['ku'], s['weight']['ku']))
        if s['flavor']:
            put(s['flavor']['ar'], s['flavor']['ku'])
    return out

KU_CARTONS = ku_entries(NEW_PRODUCTS)

# the pages the new product pages are cloned from (same layout; only the product words differ)
TEMPLATE = {
    'en': {'file': 'en-products-classic-black-800g.html', 'title': 'Classic Black Tea 800 g | Majeed Tea', 'name': 'Classic Black Tea', 'cat': 'Tea jar', 'w': '800 g',
           'lead': 'Black tea for your everyday tea ritual. Discover your Majeed moment.',
           'flavor': '<div><dt>Flavor profile</dt><dd>Ask us for details</dd></div>', 'flavor_new': '<div><dt>Flavor profile</dt><dd>%s</dd></div>'},
    'ar': {'file': 'ar-products-classic-black-800g.html', 'title': 'الشاي الأسود الكلاسيكي ٨٠٠ غ | Majeed Tea', 'name': 'الشاي الأسود الكلاسيكي', 'cat': 'عبوة شاي', 'w': '٨٠٠ غ',
           'lead': 'شاي أسود لطقوس الشاي اليومية. اكتشف لحظتك مع مجيد.',
           'flavor': '<div><dt>النكهة</dt><dd>تواصل معنا للتفاصيل</dd></div>', 'flavor_new': '<div><dt>النكهة</dt><dd>%s</dd></div>'},
}

def add_products(pages, imgs, specs, here):
    def one(h, old, new, what):
        assert h.count(old) == 1, (what, h.count(old), old[:70])
        return h.replace(old, new)
    cardamom_flavor = {}
    for lang in ('en', 'ar'):
        m = re.search(r'<dt>(?:Flavor profile|النكهة)</dt><dd>([^<]*)</dd>', pages[lang + '-products-cardamom-800g.html'])
        cardamom_flavor[lang] = m.group(1)
    for G in specs:
        with open(os.path.join(here, G['image']), 'rb') as fh:
            imgs[G['image']] = 'data:image/webp;base64,' + base64.b64encode(fh.read()).decode()
        G.setdefault('size', G['weight'])
        # 1) the detail pages, cloned from the Classic Black 800 g pages
        for lang in ('en', 'ar'):
            t = TEMPLATE[lang]
            h = pages[t['file']]
            h = one(h, '<title>%s</title>' % t['title'], '<title>%s %s | Majeed Tea</title>' % (G['name'][lang], G['weight'][lang]), 'title')
            a = h.index('<section class="product-detail'); b = h.index('</section>', a)
            sec = h[a:b]
            sec = one(sec, '--accent:#305cad', '--accent:' + G['accent'], 'accent')
            sec = one(sec, 'aria-label="%s"' % t['name'], 'aria-label="%s"' % G['name'][lang], 'aria')
            sec = one(sec, 'assets/revised-classic-800.webp', G['image'], 'image')
            if G.get('wide'):
                sec = one(sec, 'class="tiltable detail-pack"', 'class="tiltable detail-pack wide"', 'wide')
            sec = one(sec, '<p class="eyebrow">%s<!-- --> <span>•</span> <!-- -->%s</p>' % (t['cat'], t['w']), '<p class="eyebrow">%s<!-- --> <span>•</span> <!-- -->%s</p>' % (G['category'][lang], G['weight'][lang]), 'eyebrow')
            sec = one(sec, '<h1>%s</h1>' % t['name'], '<h1>%s</h1>' % G['name'][lang], 'h1')
            sec = one(sec, '<p class="lead">%s</p>' % t['lead'], '<p class="lead">%s</p>' % G['description'][lang], 'lead')
            flavor = (G['flavor'] or {}).get(lang) or cardamom_flavor[lang]
            sec = one(sec, t['flavor'], t['flavor_new'] % flavor, 'flavor')
            sec = one(sec, '<dd>%s</dd></div></dl>' % t['w'], '<dd>%s</dd></div></dl>' % G['size'][lang], 'size')
            pages['%s-products-%s.html' % (lang, G['slug'])] = h[:a] + sec + h[b:]
    # 2) every page: the product data the sliders read, the product index
    for key in list(pages):
        h = pages[key]; lang = 'ar' if key.startswith('ar') else 'en'
        i = h.index('window.__MJ=') + len('window.__MJ=')
        data, e = json.JSONDecoder().raw_decode(h, i)
        idx_html = None
        if 'class="collection-count"' in h:
            a = h.index('<div class="product-index"'); b = h.index('</div>', a)
            idx_html = h[a:b]
        for G in specs:
            slugs = [p['slug'] for p in data['products']]
            prev = data['products'][slugs.index(G['after'])]
            entry = {'slug': G['slug'], 'name': {k: G['name'][k] for k in ('en', 'ar')}, 'category': {k: G['category'][k] for k in ('en', 'ar')},
                     'weight': {k: G['weight'][k] for k in ('en', 'ar')}, 'description': {k: G['description'][k] for k in ('en', 'ar')},
                     'image': '/' + G['image'], 'accent': G['accent']}
            if G.get('wide'): entry['wide'] = True
            data['products'].insert(slugs.index(G['after']) + 1, entry)
            if idx_html is not None:
                pat = re.compile(r'<button aria-pressed="(?:true|false)"><span style="background:[^"]*"></span>%s<!-- --> <small>%s</small></button>' % (re.escape(prev['name'][lang]), re.escape(prev['weight'][lang])))
                marks = pat.findall(idx_html)
                assert len(marks) == 1, (key, G['slug'], prev['slug'], marks)
                new_btn = '<button aria-pressed="false"><span style="background:%s"></span>%s<!-- --> <small>%s</small></button>' % (G['accent'], G['name'][lang], G['weight'][lang])
                idx_html = idx_html.replace(marks[0], marks[0] + new_btn)
        total = len(data['products'])
        if idx_html is not None:
            h = h[:a] + idx_html + h[b:]
            h = one(h, '<i></i> <!-- -->07</span>', '<i></i> <!-- -->%02d</span>' % total, key + ' count')
        i = h.index('window.__MJ=') + len('window.__MJ=')          # (the index markup above may have moved it)
        _, e = json.JSONDecoder().raw_decode(h, i)
        pages[key] = h[:i] + json.dumps(data, ensure_ascii=False) + h[e:]
