"""Wording changes the owner asked for, applied to the uploaded pages before anything else is built.
Each entry is (old, new); the build stops if an old text is no longer found (so a change can never silently do nothing)."""

# The Arabic tagline "طعم كل الأوقات" (the taste of every moment) became "طعم الأوقات الحلوة" (the taste of the sweet moments):
# the home headline, the footer, the menu, the page title and the label on the moments panel.
# The Kurdish pages are made from the Arabic ones, so they follow (KU_COPY); the English pages keep their own line.
REPLACEMENTS = [
    ('طعم كل الأوقات', 'طعم الأوقات الحلوة'),
    # the large background words in the hero ("طعم" over "كل الأوقات")
    ('طعم<br/><span>كل الأوقات</span>', 'طعم<br/><span>الأوقات الحلوة</span>'),
]
# Arabic (new) -> Kurdish for the pieces above that were not translated before
KU_COPY = {'الأوقات الحلوة': 'ساتە شیرینەکان'}

import re
# the scrolling words strip under the hero (FAMILY * FRIENDS * WORK ...) was taken off the home page at the owner's request
TICKER = re.compile(r'<div class="ticker"[^>]*>.*?</div>', re.S)

def apply_copy_edits(pages):
    used = {}
    for key in list(pages):
        h, n = TICKER.subn('', pages[key])
        if n:
            used['ticker'] = used.get('ticker', 0) + n
            pages[key] = h
    assert used.get('ticker'), 'no ticker found to remove'
    for key in list(pages):
        h = pages[key]
        for old, new in REPLACEMENTS:
            n = h.count(old)
            if n:
                used[old] = used.get(old, 0) + n
                h = h.replace(old, new)
        pages[key] = h
    missing = [old for old, _ in REPLACEMENTS if old not in used]
    assert not missing, ('nothing to replace for', missing)
    return used
