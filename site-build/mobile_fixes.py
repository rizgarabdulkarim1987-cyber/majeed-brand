"""Phone clean-up for every page (<= 800px): nothing sits over anything else, and the 3D depth layer is off.
 * The 3D depth layer (perspective / translateZ) follows the mouse on a desktop; on a touch screen it only makes pictures drift over text and buttons,
   and Safari hit-tests it, so a button under a floating picture could miss a tap. It is switched off on phones.
 * Text and pictures that used to be placed on top of each other now have their own room (story card, tea moments, product slider arrows, product page controls).
"""

MOBILE_ALL_CSS = (
    '@media (max-width:800px){'
    # ---- no 3D depth layer on a phone
    '.site[data-d3] .moments,.site[data-d3] .product-stage,.site[data-d3] .taste,.site[data-d3] .story,.site[data-d3] .distribution,.site[data-d3] .brewing,.site[data-d3] .teagame,.site[data-d3] .product-detail{perspective:none}'
    '.site[data-d3] .moment-panel,.site[data-d3] .taste-visual,.site[data-d3] .story-art,.site[data-d3] .distribution-scene,.site[data-d3] .detail-visual{transform:none;perspective:none}'
    '.site[data-d3] .moment-image,.site[data-d3] .moment-copy{perspective:none;rotate:none}'
    '.site[data-d3] .moment-image>.pack,.site[data-d3] .moment-image>.tea-glass,.site[data-d3] .moment-scene-word,.site[data-d3] .moment-product,.site[data-d3] .moment-word{translate:none}'
    '.site[data-d3] .showroom{transform-style:flat;transform:none}'
    '.site[data-d3] .stage-product{transform:translate(-50%)}'
    '.site[data-d3] .stage-product.position-1{opacity:.65;transform:translate(-117%) rotate(-13deg) scale(.6)}.site[data-d3] .stage-product.position-3{opacity:.65;transform:translate(17%) rotate(13deg) scale(.6)}'
    '.site[data-d3] .stage-product.position-0,.site[data-d3] .stage-product.position-4{opacity:0}'
    '.site[data-d3] .stage-product.active>.pack{animation:none}.site[data-d3] .showroom-word{translate:none}.site[data-d3] .stage-platform{transform:none}'
    '.site[data-d3] .story-art .classic,.site[data-d3] .story-art .modern,.site[data-d3] .story-art .story-times,.site[data-d3] .story-art .story-spark{translate:none}'
    '.site[data-d3] .story-art .pack{translate:none;rotate:none;animation:7s ease-in-out infinite float}'
    '.site[data-d3] .distribution-scene .route,.site[data-d3] .distribution-scene .location,.site[data-d3] .distribution-scene .shipping{translate:none;rotate:none}'
    '.site[data-d3] .distribution-pack{translate:none;rotate:none;animation:8s ease-in-out infinite float}.site[data-d3] .detail-pack{translate:none}'
    # ---- tea moments: the text finishes above the picture of the pack
    '.moment-copy{padding-bottom:226px}.moment-word{font-size:70px;left:16px;bottom:-14px}.moment-scene-word{font-size:56px;top:7%}'
    # ---- product slider: the arrows sit under the pictures, not on them
    '.showroom .prev,.showroom .next{top:auto;bottom:-56px}.showroom .prev{left:calc(50% - 52px)}.showroom .next{right:calc(50% - 52px)}'
    '.product-stage-info{margin-top:76px}'
    # ---- story card (Classic x Modern): the two words above and below the jar, not across it
    '.story-art .pack{width:44%;height:48%;top:28%;left:28%}'
    '.classic{top:11%;left:20%;font-size:clamp(46px,13vw,56px)}.modern,.rtl .modern{bottom:5%;left:8%;font-size:clamp(44px,12.4vw,54px)}'
    '.rtl .story-art .classic,.rtl .story-art .modern{font-size:clamp(38px,11vw,48px)}'
    '.story-times{top:40%}.story-spark{top:16%;bottom:auto;right:13%}'
    # ---- market card: the caption has its own line under the pictures
    '.distribution-scene{margin-bottom:40px}.distribution-label{bottom:-34px}'
    # ---- product page: the zoom buttons sit under the picture
    '.detail-visual{min-height:0;padding:6px 0 64px}.detail-pack{height:400px}.viewer-controls{bottom:6px}'
    # ---- footer: the glass sits beside the logo, not across the tagline
    '.footer-brand .tea-glass{top:14px;bottom:auto;right:2%;left:auto;transform-origin:100% 0;transform:scale(.42) rotate(10deg)}.rtl .footer-brand .tea-glass{left:2%;right:auto;transform-origin:0 0}'
    # ---- the little menu of the round button: the caption sits in the free space of the arc
    '.radial-caption{top:127px;left:124px;width:118px;font-size:18px}.rtl .radial-caption{font-size:13px}'
    '}'
    '@media (max-width:420px){.moment-copy{padding-bottom:200px}}'
)
