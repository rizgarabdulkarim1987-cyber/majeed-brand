"""Phone layout of the home-page hero.
 * The two call-to-action buttons also sit directly under the headline on phones (a second copy, only shown at <= 800px), so they are on the first screen
   and clear of the browser's bottom toolbar; the original pair under the picture is hidden there.
 * On a phone the hero is a plain column: headline, buttons, product picture, small print. The 3D depth layer (perspective / translateZ) is for
   mouse movement on desktop; on touch screens it is switched off, and the decorative pieces can never catch a tap.
"""
import re


def add_mobile_actions(h):
    """Adds a copy of the hero's call-to-action buttons inside .hero-copy (hidden except on phones)."""
    a = h.index('<div class="hero-actions">')
    b = h.index('<a class="scroll-cue"', a)
    actions = h[a:b]
    assert actions.endswith('</div>') and actions.count('class="visual-cta') == 2, actions[-80:]
    inner = actions[len('<div class="hero-actions">'):-len('</div>')]
    d = h.index('<p class="hero-description">')
    e = h.index('</p>', d) + len('</p>')
    assert h[e:e + 6] == '</div>', h[e:e + 20]            # the end of .hero-copy
    return h[:e] + '<div class="hero-actions mobile-actions">' + inner + '</div>' + h[e:]


HERO_MOBILE_CSS = (
    '.mobile-actions{display:none}'
    '.visual-cta{-webkit-tap-highlight-color:transparent;touch-action:manipulation}'
    '@media (max-width:800px){'
    # a plain column: headline, buttons, tagline, product picture, small print - nothing is placed over anything else
    '.hero{height:auto;min-height:0;max-height:none;padding:104px 6% 26px}'
    '.hero-scene{display:flex;flex-direction:column;min-height:0;padding-bottom:118px}'
    '.hero-copy,.rtl .hero-copy{position:relative;top:auto;left:auto;right:auto;max-width:100%;margin-top:18px}'
    '.hero-copy h1 span,.hero-copy h1 em{display:block}.hero-copy h1 em:before{content:none}'
    '.hero-description{margin-top:12px;font-size:12px}.rtl .hero-description{font-size:12px}'
    '.hero-copy .mobile-actions{display:flex;gap:10px;margin-top:20px}'
    '.hero-bottom .hero-actions:not(.mobile-actions){display:none}.hero-bottom{margin-top:0}.scroll-cue{margin-top:6px}'
    # the tagline beside the jar (Arabic on the English page, English on the Arabic / Kurdish pages): one centred line above the picture
    '.arabic-hero,.rtl .arabic-hero{position:relative;top:auto;bottom:auto;right:auto;left:auto;order:1;align-self:center;margin:22px 0 0;font-size:24px;line-height:1.3;letter-spacing:0;transform:none;text-align:center}'
    '.arabic-hero br{display:none}.arabic-hero span{display:inline;font-size:1em;margin:0 .4em}.rtl .arabic-hero{font-size:19px;direction:ltr}'
    # the product picture: a modest size, centred
    '.hero-product,.rtl .hero-product{order:2;position:relative;top:auto;left:auto;width:min(52vw,214px);height:min(70vw,290px);margin:16px auto 0}'
    '.hero-orbit{top:auto;bottom:calc(118px + min(70vw,290px)/2 - min(76vw,296px)/2);left:50%;margin-left:calc(min(76vw,296px)/-2);width:min(76vw,296px);height:min(76vw,296px)}'
    # small print at the bottom: the note on the left, the glass clear of the picture and of the round button that floats at the bottom right
    '.hero-note,.rtl .hero-note{inset:auto auto 22px 0}'
    '.hero-tea,.rtl .hero-tea{bottom:14px;right:22%;left:auto}.round-stamp{display:none}'
    # a few leaves, kept to the sides of the picture and away from the text
    '.hero .leaf-0,.hero .leaf-1,.hero .leaf-3,.hero .leaf-5,.hero .leaf-6{display:none}'
    '.hero .leaf-2{top:auto;bottom:212px;left:0;right:auto}.hero .leaf-4{top:auto;bottom:300px;right:0;left:auto}'
    '.hero .pod-a{top:auto;bottom:150px;left:6px;right:auto}.hero .pod-b{top:auto;bottom:248px;right:8px;left:auto}'
    # nothing decorative can catch a tap
    '.hero-product,.hero-orbit,.arabic-hero,.hero-tea,.round-stamp,.hero-note,.hero .leaves{pointer-events:none}'
    # no 3D depth layer on a phone
    '.site[data-d3] .hero{perspective:none}'
    '.site[data-d3] .hero-scene{perspective:none;transform-style:flat;transform:none}'
    '.site[data-d3] .hero-product,.site[data-d3] .hero-copy,.site[data-d3] .arabic-hero,.site[data-d3] .hero-tea,.site[data-d3] .hero-note{translate:none;rotate:none}'
    '.site[data-d3] .hero-product>.pack{animation:7s ease-in-out infinite float}'
    '.site[data-d3] .hero-orbit{transform:none;translate:none;border:1px solid #b9b9a95c;box-shadow:none;animation:none}.site[data-d3] .hero-orbit:before{display:none}'
    '.site[data-d3] .hero .leaves{transform:none;transform-style:flat;animation:none}'
    '.site[data-d3] .hero .leaf{translate:none;animation:8s ease-in-out infinite leaf-float}.site[data-d3] .hero .pod{translate:none}'
    '}'
    # the narrowest phones: the two buttons share the row
    '@media (max-width:360px){.hero-copy .mobile-actions{gap:8px}.mobile-actions .visual-cta{flex:1 1 0;min-width:0;gap:5px;padding-block:0;padding-inline:8px 10px;font-size:8.5px}.mobile-actions .cta-object{width:30px}}'
)
