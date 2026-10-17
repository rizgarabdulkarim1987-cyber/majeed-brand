"""The "Majeed in numbers" section: four facts with small motion graphics, placed second on the home page (after the hero and its ticker).
Used by integrate.py:  facts_html(lang, n_products) -> markup,  FACTS_CSS,  the script lives in integrate.py (WIRING).
The figures are the ones the owner supplied: 10,000 tons sold, 250 million cups, 2,700 markets, one SKU count (= the products in the range)."""

TEXT = {
    'en': {
        'eyebrow': 'MAJEED IN NUMBERS',
        'h2': ('One cup at a time.', 'Millions of times over.'),
        'p': 'A few numbers behind the name on your shelf.',
        'facts': [('10,000', '', 'Tons of tea sold', '10,000 tons of tea sold'),
                  ('250', 'million', 'Cups of tea enjoyed', '250 million cups of tea enjoyed'),
                  ('2,700', '', 'Markets where Majeed is present', 'Present in 2,700 markets'),
                  ('{n}', '', 'Products (SKUs)', '{n} products (SKUs)')],
    },
    'ar': {
        'eyebrow': 'مجيد بالأرقام',
        'h2': ('كوب بعد كوب.', 'ملايين المرات.'),
        'p': 'أرقام قليلة وراء الاسم الذي تراه على رفّك.',
        'facts': [('١٠٬٠٠٠', '', 'طن من الشاي المباع', '١٠٬٠٠٠ طن من الشاي المباع'),
                  ('٢٥٠', 'مليون', 'كوب شاي تم احتساؤه', '٢٥٠ مليون كوب شاي تم احتساؤه'),
                  ('٢٬٧٠٠', '', 'سوق يتواجد فيه مجيد', '٢٬٧٠٠ سوق يتواجد فيه مجيد'),
                  ('{n}', '', 'منتجات (SKU)', '{n} منتجات (SKU)')],
    },
}
ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'


def _num(lang, n):
    return str(n) if lang == 'en' else ''.join(ARABIC_DIGITS[int(c)] for c in str(n))


# ---------------------------------------------------------------- the four graphics (viewBox 200 x 120; the finished picture is the plain, un-animated state)
def _bars():
    hs = [18, 26, 24, 38, 48, 56, 70, 82]
    out, pts = [], []
    for i, h in enumerate(hs):
        x = 16 + i * 22
        out.append('<rect class="fx-bar" style="--i:%d;opacity:%.2f" x="%d" y="%d" width="14" height="%d" rx="3"/>' % (i, 0.28 + i * 0.1, x, 104 - h, h))
        pts.append('%d,%d' % (x + 7, 104 - h - 10))
    return ('<svg viewBox="0 0 200 120" aria-hidden="true" focusable="false"><line class="fx-base" x1="10" y1="104" x2="190" y2="104"/>' + ''.join(out)
            + '<path class="fx-trend" pathLength="1" d="M%s"/><circle class="fx-dot" cx="%s" cy="%s" r="4"/><circle class="fx-dot-ring" cx="%s" cy="%s" r="4"/></svg>'
            % (' L'.join(pts), pts[-1].split(',')[0], pts[-1].split(',')[1], pts[-1].split(',')[0], pts[-1].split(',')[1]))


GLASS = 'M76 32 C80 44 86 50 86 58 C86 64 80 68 80 76 C80 86 90 92 100 92 C110 92 120 86 120 76 C120 68 114 64 114 58 C114 50 120 44 124 32 Z'


def _cups():
    def static_glass(clip_id):
        return ('<ellipse class="fx-saucer" cx="100" cy="96" rx="34" ry="5"/>'
                '<g clip-path="url(#%s)"><rect class="fx-tea" x="70" y="40" width="60" height="56"/></g>'
                '<path class="fx-glass" d="%s"/><ellipse class="fx-rim" cx="100" cy="32" rx="24" ry="3"/>' % (clip_id, GLASS))
    return ('<svg viewBox="0 0 200 120" aria-hidden="true" focusable="false"><defs>'
            '<clipPath id="fx-gc"><path d="%s"/></clipPath><clipPath id="fx-gc2"><path d="%s"/></clipPath>'
            '<g id="fx-mini-src">%s</g></defs>'
            '<g class="fx-mini" style="--i:0"><g transform="translate(-14 40) scale(.6)"><use href="#fx-mini-src"/></g></g>'
            '<g class="fx-mini" style="--i:1"><g transform="translate(94 40) scale(.6)"><use href="#fx-mini-src"/></g></g>'
            '<path class="fx-steam" style="--i:0" d="M90 24 q-5 -6 0 -11 q5 -5 0 -10"/><path class="fx-steam" style="--i:1" d="M100 24 q-5 -6 0 -11 q5 -5 0 -10"/><path class="fx-steam" style="--i:2" d="M110 24 q-5 -6 0 -11 q5 -5 0 -10"/>'
            '<ellipse class="fx-saucer" cx="100" cy="96" rx="34" ry="5"/>'
            '<g clip-path="url(#fx-gc)"><rect class="fx-tea fx-fill" x="70" y="40" width="60" height="56"/></g>'
            '<path class="fx-glass" d="%s"/><ellipse class="fx-rim" cx="100" cy="32" rx="24" ry="3"/></svg>'
            % (GLASS, GLASS, static_glass('fx-gc2'), GLASS))


def _network():
    nodes = [(32, 30), (58, 92), (22, 64), (150, 24), (178, 60), (146, 98), (100, 14), (104, 110), (68, 40), (132, 60)]
    cx, cy = 100, 62
    lines = ''.join('<path class="fx-link" pathLength="1" style="--i:%d" d="M%d %d L%d %d"/>' % (i, cx, cy, x, y) for i, (x, y) in enumerate(nodes))
    dots = ''.join('<circle class="fx-node" style="--i:%d" cx="%d" cy="%d" r="3.4"/>' % (i, x, y) for i, (x, y) in enumerate(nodes))
    return ('<svg viewBox="0 0 200 120" aria-hidden="true" focusable="false"><ellipse class="fx-orbit" cx="100" cy="62" rx="52" ry="34"/><ellipse class="fx-orbit" cx="100" cy="62" rx="88" ry="54"/>'
            + lines + '<circle class="fx-ripple" style="--i:0" cx="100" cy="62" r="7"/><circle class="fx-ripple" style="--i:1" cx="100" cy="62" r="7"/><circle class="fx-ripple" style="--i:2" cx="100" cy="62" r="7"/>'
            + dots + '<circle class="fx-core" cx="100" cy="62" r="7.5"/><circle class="fx-core-dot" cx="100" cy="62" r="2.6"/></svg>')


def _packs():
    def jar(w, h, label):
        return ('<rect x="%.1f" y="%d" width="%d" height="%d" rx="3" class="fx-jar"/><rect x="%.1f" y="%d" width="%d" height="%d" rx="1" class="fx-leaf"/>'
                '<rect x="%.1f" y="%.1f" width="%d" height="%.1f" class="%s"/><rect x="%.1f" y="%d" width="%d" height="5" rx="2" class="fx-cap-%s"/>'
                % (-w / 2, -h + 5, w, h - 5, -w / 2 + 1, -h * 0.3, w - 2, h * 0.3 - 1,
                   -w / 2, -h * 0.66, w, h * 0.34, 'fx-lab-' + label, -w / 2 + 1, -h, w - 2, label))
    items = [  # (centre x, drawing)
        (14, '<path class="fx-pouch" d="M-8 0 L-8 -30 Q-8 -37 -3 -38 L3 -38 Q8 -37 8 -30 L8 0 Z"/><path class="fx-seal" d="M-8 -34 L8 -34"/><rect class="fx-lab-gold" x="-5" y="-26" width="10" height="12" rx="2"/>'),
        (36, jar(16, 32, 'g')), (59, jar(18, 40, 'g')), (83, jar(19, 46, 'g')),
        (109, '<rect class="fx-tin" x="-10" y="-40" width="20" height="40" rx="2"/><path class="fx-tin-lid" d="M-11 -40 L-11 -44 Q-11 -48 -6 -49 L6 -49 Q11 -48 11 -44 L11 -40 Z"/><rect class="fx-tin-shine" x="-6" y="-37" width="3" height="34" rx="1.5"/><rect class="fx-lab-red" x="-5" y="-28" width="10" height="9" rx="2"/>'),
        (134, jar(16, 32, 'b')), (157, jar(18, 40, 'b')),
        (182, '<rect class="fx-trade" x="-11" y="-34" width="22" height="34" rx="2"/><rect class="fx-lab-white" x="-6" y="-26" width="12" height="12" rx="2"/><path class="fx-seal" d="M-11 -30 L11 -30"/>'),
    ]
    g = ''.join('<g transform="translate(%d 104)"><g class="fx-pk" style="--i:%d">%s</g></g>' % (x, i, d) for i, (x, d) in enumerate(items))
    return '<svg viewBox="0 0 200 120" aria-hidden="true" focusable="false"><line class="fx-base" x1="4" y1="104" x2="196" y2="104"/>' + g + '</svg>'


def facts_html(lang, n_products):
    t = TEXT[lang]
    arts = [_bars(), _cups(), _network(), _packs()]
    tiles = ''
    for (fig, unit, label, aria), art in zip(t['facts'], arts):
        fig = fig.replace('{n}', _num(lang, n_products)); aria = aria.replace('{n}', _num(lang, n_products))
        to = int(''.join(c for c in fig if c.isdigit()) if lang == 'en' else ''.join(str(ARABIC_DIGITS.index(c)) for c in fig if c in ARABIC_DIGITS))
        tiles += ('<div class="fact" role="group" aria-label="%s"><div class="fact-art">%s</div>'
                  '<p class="fact-figure" aria-hidden="true"><span class="fact-num" data-to="%d">%s</span>%s</p><p class="fact-label" aria-hidden="true">%s</p></div>'
                  % (aria, art, to, fig, ('<span class="fact-unit">%s</span>' % unit) if unit else '', label))
    return ('<section class="facts section" id="facts" aria-labelledby="facts-title"><div class="facts-glow" aria-hidden="true"></div>'
            '<div class="section-heading"><div><p class="eyebrow">%s</p><h2 id="facts-title">%s<br/><em>%s</em></h2></div><p>%s</p></div>'
            '<div class="facts-grid">%s</div></section>' % (t['eyebrow'], t['h2'][0], t['h2'][1], t['p'], tiles))


FACTS_CSS = (
    '.facts{--gold:#e9b949;--paper:#f5f0e5;position:relative;isolation:isolate;overflow:hidden;color:var(--paper);background:#23261e}'
    '.facts-glow{position:absolute;z-index:-1;inset:-20% -10% auto auto;width:60vw;height:60vw;max-width:760px;max-height:760px;border-radius:50%;background:radial-gradient(circle,#e9b94933,#e9b94900 66%);animation:fx-drift 16s ease-in-out infinite alternate}'
    '.facts:before{content:"";position:absolute;z-index:-1;inset:auto auto -30% -12%;width:50vw;height:50vw;max-width:640px;max-height:640px;border-radius:50%;background:radial-gradient(circle,#ca2a2024,#ca2a2000 66%)}'
    '.facts .eyebrow{color:#cfcab9}.facts h2{color:var(--paper)}.facts h2 em{color:var(--gold)}.facts .section-heading>p{color:#b9b6a6}'
    '.facts-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}'
    '.fact{position:relative;padding:26px 26px 30px;border:1px solid #f5f0e51f;border-radius:24px;background:linear-gradient(165deg,#f5f0e512,#f5f0e505);transition:transform .35s,border-color .35s,background .35s}'
    '.fact:hover{transform:translateY(-6px);border-color:#e9b94966;background:linear-gradient(165deg,#f5f0e51a,#f5f0e508)}'
    '.fact-art{height:128px;margin-bottom:22px}.fact-art svg{display:block;width:100%;height:100%;overflow:visible}'
    '.fact-figure{display:flex;align-items:baseline;gap:.3em;color:var(--paper);font:500 clamp(46px,4.7vw,76px)/1 Manrope,Noto Sans Arabic,sans-serif;letter-spacing:-.055em;font-variant-numeric:tabular-nums}'
    '.fact-unit{color:var(--gold);font-size:.32em;font-weight:600;letter-spacing:0}'
    '.fact .fact-label{margin-top:14px;color:#b9b6a6;font-size:14px;line-height:1.4}'
    '.rtl .fact-figure{letter-spacing:0;font-weight:600;font-variant-numeric:normal;font-family:Noto Sans Arabic,Manrope,sans-serif}'
    '.ku .facts h2{font-size:clamp(32px,3.9vw,58px)}'
    '.ku .fact-figure,.ku .fact-label{font-family:var(--ku-font)}'
    # the pictures: the finished drawing is the plain state; each animation only plays from its first frame while the section is on screen
    '.fx-base{stroke:#f5f0e540;stroke-width:1.5}.fx-bar{fill:var(--gold);transform-box:fill-box;transform-origin:50% 100%}'
    '.fx-trend{fill:none;stroke:var(--paper);stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1}'
    '.fx-dot{fill:var(--paper)}.fx-dot-ring{fill:none;stroke:var(--paper);stroke-width:1.5;opacity:0;transform-box:fill-box;transform-origin:center}'
    '.fx-glass{fill:#f5f0e50f;stroke:#f5f0e5d9;stroke-width:1.6;stroke-linejoin:round}.fx-rim{fill:none;stroke:#f5f0e5a6;stroke-width:1.2}.fx-saucer{fill:#f5f0e514;stroke:#f5f0e566;stroke-width:1.2}'
    '.fx-tea{fill:#5a1f0c}.fx-steam{fill:none;stroke:#f5f0e5;stroke-width:2;stroke-linecap:round;opacity:.55}'
    '.fx-mini{opacity:.55;transform-box:fill-box;transform-origin:50% 100%}'
    '.fx-orbit{fill:none;stroke:#f5f0e52e;stroke-width:1;stroke-dasharray:2 5}.fx-link{stroke:#e9b94999;stroke-width:1.3;stroke-linecap:round;stroke-dasharray:1}'
    '.fx-node{fill:var(--gold);transform-box:fill-box;transform-origin:center}.fx-core{fill:#ca2a20}.fx-core-dot{fill:var(--paper)}'
    '.fx-ripple{fill:none;stroke:#ca2a20;stroke-width:1.5;opacity:0;transform-box:fill-box;transform-origin:center}'
    '.fx-pk{transform-box:fill-box;transform-origin:50% 100%}'
    '.fx-jar{fill:#f5f0e51f;stroke:#f5f0e580;stroke-width:.8}.fx-leaf{fill:#3a1a0b}.fx-cap-g{fill:#2ba53a}.fx-cap-b{fill:#1d46c6}.fx-lab-g{fill:#2f8f3d}.fx-lab-b{fill:#2a54c8}'
    '.fx-lab-gold{fill:#e9b949}.fx-lab-red{fill:#ca2a20}.fx-lab-white{fill:#f5f0e5}.fx-pouch{fill:#c9a93d}.fx-seal{fill:none;stroke:#f5f0e5a6;stroke-width:1.2}'
    '.fx-tin{fill:#e1b043}.fx-tin-lid{fill:#efc45a}.fx-tin-shine{fill:#fff3;}.fx-trade{fill:#3d7a35}'
    '[data-run] .fx-bar{animation:fx-grow 1.3s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i)*.11s)}'
    '[data-run] .fx-trend{animation:fx-draw 1.5s ease-out 1s both}'
    '[data-run] .fx-dot{animation:fx-pop .5s cubic-bezier(.34,1.56,.64,1) 2.4s both}'
    '[data-run] .fx-dot-ring{animation:fx-ring 2s ease-out 2.6s infinite}'
    '[data-run] .fx-fill{animation:fx-fill 2.6s cubic-bezier(.3,.6,.3,1) .2s both}'
    '[data-run] .fx-steam{animation:fx-steam 3.2s ease-in-out infinite;animation-delay:calc(var(--i)*.7s + 1.4s)}'
    '[data-run] .fx-mini{animation:fx-pop 1s cubic-bezier(.34,1.56,.64,1) both;animation-delay:calc(var(--i)*.35s + 1.2s)}'
    '[data-run] .fx-link{animation:fx-draw .9s ease-out both;animation-delay:calc(var(--i)*.09s + .3s)}'
    '[data-run] .fx-node{animation:fx-pop .6s cubic-bezier(.34,1.56,.64,1) both;animation-delay:calc(var(--i)*.09s + .9s)}'
    '[data-run] .fx-ripple{animation:fx-ripple 3.6s ease-out infinite;animation-delay:calc(var(--i)*1.2s)}'
    '[data-run] .fx-pk{animation:fx-pack .8s cubic-bezier(.34,1.56,.64,1) both;animation-delay:calc(var(--i)*.12s + .2s)}'
    '@keyframes fx-grow{from{transform:scaleY(0)}}@keyframes fx-draw{from{stroke-dashoffset:1}}'
    '@keyframes fx-pop{from{opacity:0;transform:scale(.2)}}'
    '@keyframes fx-ring{0%{opacity:.7;transform:scale(1)}100%{opacity:0;transform:scale(4)}}'
    '@keyframes fx-fill{from{transform:translateY(52px)}}'
    '@keyframes fx-steam{0%{opacity:0;transform:translateY(7px)}40%{opacity:.7}100%{opacity:0;transform:translateY(-8px)}}'
    '@keyframes fx-ripple{0%{opacity:.7;transform:scale(1)}100%{opacity:0;transform:scale(5.2)}}'
    '@keyframes fx-pack{from{opacity:0;transform:translateY(18px) scale(.5)}}'
    '@keyframes fx-drift{from{transform:translate(0,0)}to{transform:translate(-6%,8%)}}'
    '@media (max-width:1000px){.facts-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}'
    '@media (max-width:560px){.facts-grid{gap:12px}.fact{padding:18px 16px 22px;border-radius:20px}.fact-art{height:84px;margin-bottom:14px}'
    '.fact-figure{font-size:clamp(30px,9.4vw,40px)}.fact .fact-label{font-size:12px;margin-top:10px}}'
)
