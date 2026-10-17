"""Desktop / Mac / Safari clean-up for every page (>= 801px), found by auditing the pages at MacBook sizes (1280-1728 px wide, 690-1000 px tall):
 * the round buttons fixed at the right edge no longer sit over text: pages keep a wider right margin, and the 'Find Majeed Tea' tile steps aside while the hero is on screen
   (it used to cover the hero's buttons on the Arabic / Kurdish pages and the stamp / scroll cue on the English one)
 * the Classic x Modern card keeps its two words above and below the jar (they used to run across it)
 * tea moments: the word sits above the pack and the text always finishes above the small pack picture
 * product slider arrows sit under the stage, not over the packs; market caption and product-page buttons have their own room
 * on a short screen (a 13" MacBook) the hero fits the window, so its buttons are visible without scrolling
 * Safari: rounded boxes that hold moving pictures are isolated (Safari does not always clip them to the rounded corners otherwise)
Used by integrate.py: DESKTOP_FIXES_CSS (every page) and DESKTOP_FIXES_JS (inside the shared page script)."""

DESKTOP_FIXES_CSS = (
    '@media (min-width:801px){'
    '.section{padding-right:max(5.6vw,96px)}.hero{padding-right:max(5.6%,96px)}footer{padding-right:max(5.6%,96px)}'
    '.story-art .pack{width:40%;height:47%;top:27%;left:30%}'
    '.classic{top:7%;left:26%;font-size:clamp(44px,4.6vw,68px)}'
    '.modern,.rtl .modern{bottom:5%;left:12%;font-size:clamp(42px,4.4vw,64px)}'
    '.story-times{top:40%}'
    '.moment-copy{padding-bottom:236px}'
    '.moment-scene-word{top:3%;left:5%;font-size:clamp(46px,4.3vw,64px);white-space:nowrap}.moment-image>.pack{height:72%}'
    '.showroom .prev,.showroom .next{top:auto;bottom:-56px}.showroom .prev{left:calc(50% - 52px)}.showroom .next{right:calc(50% - 52px)}'
    '.product-stage-info{margin-top:76px}'
    '.distribution-scene{margin-bottom:40px}.distribution-label{bottom:-34px}'
    '.detail-visual{padding-bottom:56px}'
    '.rtl .arabic-hero{direction:ltr}.hero-tea{right:17%}'
    '}'
    # an iPad or a small browser window (801-1100 px): the first block of a page starts below the fixed header (the generic .section padding used to win and put it under the header)
    '@media (min-width:801px) and (max-width:1100px){.moment-copy{padding-bottom:204px}.product-detail.section{padding-top:135px}.factory-hero.section{padding-top:150px}.contact.section{padding-top:150px}}'
    # the empty strip of the hero's bottom row never blocks the slide show's dots under it
    '.hero-bottom{pointer-events:none}.hero-bottom>*{pointer-events:auto}'
    '@media (min-width:801px) and (max-height:800px){.hero{min-height:680px;padding-top:108px}.hero-scene{min-height:440px}}'
    '.floating-system .primary-float{transition:opacity .3s,visibility .3s}'
    '.floating-system.over-hero .primary-float{opacity:0;pointer-events:none;visibility:hidden}'
    '.story-art,.moment-panel,.moment-image,.distribution-scene{isolation:isolate}'
    # decoration never catches a click or a tap (steam above the glass used to sit over the 'Play the ritual' button on a phone)
    ".steam,.tea-glass,.tea-glass *,.leaves,.leaves *,.brew-pour,.orbit-tea-leaf,.hero-orbit,.taste-circle,.stage-platform,.showroom-word,.moment-word,.moment-scene-word,.moment-product,.story-times,.story-spark,.story-art *,.distribution-scene *,.taste-visual *,.moment-image *{pointer-events:none}"
)

DESKTOP_FIXES_JS = r'''  /* ---- the 'Find Majeed Tea' tile (fixed, bottom right) steps aside while the hero is on screen, so it never covers the hero's buttons ---- */
  var dfHero = $('.hero'), dfFloat = $('.floating-system');
  if (dfHero && dfFloat && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { dfFloat.classList.toggle('over-hero', en[0].isIntersecting && en[0].intersectionRatio > 0.35); }, { threshold: [0, 0.35, 0.6, 1] }).observe(dfHero);
  }

'''
