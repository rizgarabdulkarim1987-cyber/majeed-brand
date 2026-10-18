"""About page: "Majeed Tea — A Tradition in Every Cup" (the text supplied by the owner, in English; the Arabic and Kurdish are translations of it).
It sits right after the opening block of the About page (before "What brings us together"), as its own dark section.
Used by integrate.py: add_tradition(pages), ABOUT_CSS (About pages), and the Kurdish text is KU_ABOUT in ku_strings.py."""

TEXT = {
    'en': {
        'eyebrow': 'MAJEED TEA',
        'h2': ('A Tradition', 'in Every Cup.'),
        'title': 'Majeed Tea — A Tradition in Every Cup',
        'p1': 'At Majeed Tea, we believe that tea is more than a drink; it is a tradition that brings people together, creates moments of connection, and adds warmth to everyday life.',
        'p2': 'With a passion for quality and a commitment to excellence, we carefully select and blend premium tea leaves to deliver a rich aroma, distinctive taste, and satisfying experience in every cup. Inspired by the deep-rooted tea culture of Iraq, we strive to bring families and friends together through the timeless pleasure of sharing tea.',
        'lead': 'Our promise is simple:',
        'promise': 'exceptional quality, authentic taste, and a cup worth remembering.',
    },
    'ar': {
        'eyebrow': 'شاي مجيد',
        'h2': ('تقليد', 'في كل كوب.'),
        'title': 'شاي مجيد — تقليد في كل كوب',
        'p1': 'في شاي مجيد، نؤمن بأن الشاي أكثر من مجرد مشروب؛ إنه تقليد يجمع الناس، ويصنع لحظات من التواصل، ويضيف الدفء إلى الحياة اليومية.',
        'p2': 'بشغف بالجودة والتزام بالتميّز، نختار أوراق الشاي الفاخرة ونمزجها بعناية لنقدّم رائحة غنية، وطعماً مميزاً، وتجربة مُرضية في كل كوب. وانطلاقاً من ثقافة الشاي العريقة في العراق، نسعى إلى جمع العائلات والأصدقاء حول متعة تقاسم الشاي الخالدة.',
        'lead': 'وعدنا بسيط:',
        'promise': 'جودة استثنائية، وطعم أصيل، وكوب يستحق أن نتذكره.',
    },
}


def tradition_html(lang):
    t = TEXT[lang]
    return ('<section class="tradition section" id="tradition" aria-label="%s"><span class="tradition-star" aria-hidden="true">✳</span>'
            '<div class="tradition-grid"><div class="tradition-head"><p class="eyebrow">%s</p><h2>%s<br/><em>%s</em></h2></div>'
            '<div class="tradition-copy"><p>%s</p><p>%s</p></div></div>'
            '<blockquote class="tradition-promise"><p class="tradition-lead">%s</p><p class="tradition-line">%s</p></blockquote></section>'
            % (t['title'], t['eyebrow'], t['h2'][0], t['h2'][1], t['p1'], t['p2'], t['lead'], t['promise']))


def add_tradition(pages):
    for key, lang in (('en-about.html', 'en'), ('ar-about.html', 'ar')):
        h = pages[key]
        anchor = '<section class="values-section section">'
        assert h.count(anchor) == 1, key
        pages[key] = h.replace(anchor, tradition_html(lang) + anchor, 1)


ABOUT_CSS = (
    '.tradition{position:relative;isolation:isolate;overflow:hidden;color:#f5f0e5;background:#23261e}'
    '.tradition:before{content:"";position:absolute;z-index:-1;inset:auto -8% -40% auto;width:56vw;height:56vw;max-width:700px;max-height:700px;border-radius:50%;background:radial-gradient(circle,#e9b94930,#e9b94900 66%)}'
    '.tradition-star{position:absolute;z-index:-1;top:46px;right:6%;color:#e9b949;font-size:74px;line-height:1;opacity:.28;animation:trad-spin 46s linear infinite;pointer-events:none}'
    '.rtl .tradition-star{right:auto;left:6%}'
    '@keyframes trad-spin{to{transform:rotate(360deg)}}'
    '.tradition-grid{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:7%;align-items:start}'
    '.tradition .eyebrow{color:#cfcab9}'
    '.tradition h2{color:#f5f0e5;font-size:clamp(40px,5vw,76px)}.tradition h2 em{color:#e9b949}'
    '.tradition-copy{display:grid;gap:22px;padding-top:6px}'
    '.tradition-copy p{max-width:600px;color:#d9d4c6;font-size:17px;line-height:1.75}'
    '.tradition-copy p:first-child{color:#f5f0e5;font-size:20px;line-height:1.6}'
    '.tradition-promise{position:relative;margin:64px 0 0;padding:38px 0 0;border-top:1px solid #f5f0e533}'
    '.tradition-lead{margin:0 0 14px;color:#cfcab9;font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase}'
    '.tradition-line{margin:0;max-width:980px;color:#e9b949;font:italic 400 clamp(30px,4vw,58px)/1.2 Georgia,serif;letter-spacing:-.02em}'
    '.rtl .tradition-lead{letter-spacing:0;font-size:14px}'
    '.rtl .tradition h2 em{font-family:inherit;font-style:normal}'
    '.rtl .tradition-line{font-family:Noto Sans Arabic,sans-serif;font-style:normal;font-weight:700;letter-spacing:0;font-size:clamp(28px,3.4vw,48px);line-height:1.5}'
    '.rtl:not(.ku) .tradition-line{font-family:var(--ar-head);font-weight:400;font-size:clamp(34px,4.2vw,60px);line-height:1.35}'
    '.rtl .tradition-copy p{font-size:18px;line-height:1.9}.rtl .tradition-copy p:first-child{font-size:21px}'
    '.ku .tradition-copy p,.ku .tradition-lead{font-family:var(--ku-font)}.ku .tradition-line{font-family:var(--ku-head)}'
    '@media (max-width:800px){.tradition-grid{grid-template-columns:1fr;gap:26px}.tradition-star{top:26px;font-size:52px}'
    '.tradition-copy p{font-size:15px}.tradition-copy p:first-child{font-size:17px}.rtl .tradition-copy p{font-size:16px}.rtl .tradition-copy p:first-child{font-size:18px}'
    '.tradition-promise{margin-top:40px;padding-top:28px}}'
    '.still .tradition-star{animation:none}'
)
