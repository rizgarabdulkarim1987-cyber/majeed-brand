# Building index.html

`index.html` at the repository root is generated: it is the original Majeed site upload plus the 3D tea game, the product picker,
Central Kurdish (Sorani) pages and the language menu. Do not edit it by hand; change the sources here and rebuild.

## Rebuild
```
# 1. the original upload (first commit of this repo)
git show 445639b:index.html > original.html

# 2. the 3D game engine (source in ../game3d)
cd ../game3d && npm install && node build.mjs dist/majeed3d.min.js --min && cd ../site-build

# 3. the site
python3 integrate.py original.html ../game3d/dist/majeed3d.min.js ../index.html
```

## Products
The Golden Majeed 600 g tin is added by `add_golden()` in `integrate.py` (data in `GOLD`; its photo is `assets/revised-golden-600.webp`; its Kurdish wording is `KU_GOLDEN` in `ku_strings.py`).
It appears in the product slider, the product index, as its own product page in English, Arabic and Kurdish, and in the tea game's product picker (`../game3d`).

## Phone layout
`hero_mobile.py` (home-page hero on phones: buttons under the headline, a modest centred product picture) and `mobile_fixes.py` (no 3D depth layer on touch screens; no text or pictures laid over each other on the other sections) are appended to every page by `integrate.py`.
The round Majeed button at the bottom right of a phone is wired in `WIRING` in `integrate.py`. `.htaccess` makes browsers check for a newer page on every visit.

## Hero slide show
`hero_slides.py`: the hero's product picture changes by itself every 5 seconds (order and timing at the top of `HERO_SLIDES_JS`; the 5 kg trade pack is left out). It pauses when off screen, hovered, or when motion is paused.

## Tea game on a phone
`game_mobile.py`: on phones (<= 700px) the game stage is edge to edge and tall, the status is one slim line over its bottom, the five steps are one row, and the round Majeed button steps aside while the game is on screen. The engine zooms in and follows the action on a tall stage (`fitCamera` / `updateCamera` in `game3d/src/game.js`).

## Desktop, Mac and Safari
`desktop_fixes.py` (laptop / iPad sizes: round buttons keep clear of the text, no overlaps in the story card, tea moments, slider and market card, content starts below the fixed header, decoration never catches a click) and `safari_fixes.py` (iOS form-zoom, text-size-adjust, form-field appearance, tap highlight). The home hero on a tablet held upright uses the same stacked layout as a phone (`MQ_HERO` in `hero_mobile.py`).
The tea in every CSS-drawn glass is `#4C1208` (`.glass-liquid` in `CSS_LANG`, `integrate.py`).

## Buzzify credit
`buzzify_credit.py`: the Buzzify mark (`assets/buzzify-mark.webp`, built from the wordmark in the buzzify-site project) and "Developed by Buzzify" at the bottom of every page's footer, linking to buzzify.me.

## About page text
`about_tradition.py`: the "Majeed Tea — A Tradition in Every Cup" section of the About pages (English supplied by the owner; the Arabic is `TEXT['ar']` in that file and the Kurdish is `KU_ABOUT` in `ku_strings.py`).

## Source files
`source/golden-600g-original.jpg` is the supplied photo of the Golden Majeed tin and `source/cut_tin.py` cuts it out of its white background (how `assets/revised-golden-600.webp` was made).

## Fonts
- **Arabic headlines: Arabic Typesetting.** **Kurdish: NRT.** Both are used automatically on any visitor's device that has them installed.
  To make every visitor see them, embed the font files: put `ArabicTypesetting.ttf`, `NRT-Reg.ttf` (and `NRT-Bd.ttf`) in `site-build/fonts/`,
  run `pip install fonttools brotli`, and rebuild. Only add fonts you hold a web licence for; the files in `fonts/` are embedded in `index.html`.
- Until then Arabic headlines fall back to **Amiri** (SIL Open Font License, `fonts-open/`) and Kurdish to Noto Sans Arabic.
- `size-adjust` for Arabic Typesetting (it is small for its font size) is `FONT_FACES` in `integrate.py`.

## Kurdish text
All Kurdish strings are in `ku_strings.py` (page text keyed by its Arabic original; the game wording is in `KU_GAME` and in `WIRING` in `integrate.py`).
The build stops and lists any Arabic string that has no Kurdish translation.
