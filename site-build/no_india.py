"""The owner asked for every mention of "Indian" to go from the website (English, Arabic and Kurdish).
The uploaded pages carry it in a handful of places; this swaps each one, on every page, before anything else is built.
Kurdish needs no list of its own: the Kurdish pages are made from the Arabic ones (and ku_strings.py no longer has the Indian wording)."""

# (old, new) - the old text is exactly what the original pages contain
REPLACEMENTS = [
    # product descriptions: the product sliders' data on every page, and the Classic Black detail pages
    ('Indian black tea for your everyday tea ritual.', 'Black tea for your everyday tea ritual.'),
    ('شاي هندي أسود لطقوس الشاي اليومية.', 'شاي أسود لطقوس الشاي اليومية.'),
    # About page, "Our mission"
    ('a good cup of Indian tea part of everyday life', 'a good cup of tea part of everyday life'),
    ('دفء كوب الشاي الهندي جزءاً من كل يوم', 'دفء كوب الشاي جزءاً من كل يوم'),
    # product detail pages: the "Origin" row simply goes (the other rows stay)
    ('<div><dt>Origin</dt><dd>India</dd></div>', ''),
    ('<div><dt>المنشأ</dt><dd>الهند</dd></div>', ''),
    # the products page title
    ('<title>Indian Tea Collection | Majeed Tea</title>', '<title>Majeed Products | Majeed Tea</title>'),
    # home page: the line above the headline, and the round stamp
    ('INDIAN TEA. A WORLD OF MOMENTS.', 'MAJEED TEA. A WORLD OF MOMENTS.'),
    ('شاي هندي. عالم من اللحظات.', 'شاي مجيد. عالم من اللحظات.'),
    ('class="round-stamp">INDIAN TEA<', 'class="round-stamp">MAJEED TEA<'),
    ('class="round-stamp">شاي هندي<', 'class="round-stamp">شاي مجيد<'),
]

def remove_india(pages):
    used = {old: 0 for old, _ in REPLACEMENTS}
    for key in list(pages):
        h = pages[key]
        for old, new in REPLACEMENTS:
            n = h.count(old)
            if n:
                used[old] += n
                h = h.replace(old, new)
        pages[key] = h
    unused = [old for old, n in used.items() if n == 0]
    assert not unused, ('nothing to replace for', unused)
    return used

def check_clean(pages):
    """No page may still say it (the three.js engine's CSS colour list has 'indianred'; that is not on a page)."""
    import re
    bad = []
    for key, h in pages.items():
        for m in re.finditer(r'(?i)indian\b|\bindia\b|هندي|الهند\b|هیندی|هیندستان|هندستان', h):
            bad.append((key, h[max(0, m.start() - 40):m.end() + 40]))
    assert not bad, bad[:5]
