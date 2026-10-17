"""The Buzzify credit in the footer of every page: the Buzzify mark (round black badge, white "buzz!fy" with its blue dot) and "Developed by Buzzify",
linking to buzzify.me. The mark is built from the wordmark in public/brand/logo-white.png of the buzzify-site project (assets/buzzify-mark.webp, 240 px)."""

CREDIT_IMAGE = 'assets/buzzify-mark.webp'
CREDIT_URL = 'https://buzzify.me'
LABEL = {'en': 'Developed by', 'ar': 'تطوير بواسطة', 'ku': 'گەشەپێدراوە لەلایەن'}
NAME = 'Buzzify'


def add_credit(key, h):
    lang = 'ku' if key.startswith('ku') else 'ar' if key.startswith('ar') else 'en'
    assert h.count('</footer>') == 1, key
    i = h.index('</footer>')
    block = ('<div class="footer-credit"><a href="%s" target="_blank" rel="noopener" aria-label="%s %s"><img src="%s" alt="" width="40" height="40" loading="lazy" decoding="async"/>'
             '<span>%s <b dir="ltr">%s</b></span></a></div>' % (CREDIT_URL, LABEL[lang], NAME, CREDIT_IMAGE, LABEL[lang], NAME))
    return h[:i] + block + h[i:]


CREDIT_CSS = (
    '.footer-credit{display:flex;justify-content:flex-start;margin-top:18px;padding-top:16px;border-top:1px solid #bdb8a35c}'
    '.footer-credit a{display:inline-flex;align-items:center;gap:12px;color:#66685c;font-size:12px;letter-spacing:.04em;opacity:.9;transition:opacity .25s,transform .25s}'
    '.footer-credit a:hover,.footer-credit a:focus-visible{opacity:1;transform:translateY(-1px)}'
    '.footer-credit b{color:var(--ink);font-weight:700;letter-spacing:.02em}'
    '.footer-credit img{display:block;flex:none;width:40px;height:40px;border-radius:50%;box-shadow:0 3px 10px #29261826}'
    '.rtl .footer-credit a{letter-spacing:0;font-size:13px}'
    '.ku .footer-credit a{font-family:var(--ku-font)}'
    '@media (max-width:800px){.footer-credit{justify-content:center;margin-top:14px}}'
)
