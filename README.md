# Majeed Tea - majeedbrand.com

The Majeed Tea website: English, Arabic and Central Kurdish (Sorani), with a real 3D tea-making game.
It is one self-contained file, `index.html`, which GitHub serves to Hostinger (Git auto-deploy of `main` into `public_html`); `.htaccess` makes browsers check for a newer page on every visit.
**`index.html` is generated - do not edit it by hand.**

## What is here
| path | what |
|---|---|
| `index.html` | the whole site: every page in three languages, images, fonts, the 3D game engine |
| `site-build/` | the build: `integrate.py` assembles `index.html` from the original upload plus the modules in this folder (see `site-build/README.md`) |
| `game3d/` | the source of the WebGL tea game: teapot, glass, tap, cooker, product tins / jars / pouch, pouring physics (see `game3d/README.md`) |
| `tools/qa/` | browser checks (Playwright) used before every release (see `tools/qa/README.md`) |
| `.htaccess` | cache rule for the server |

## Rebuild
```
git show 445639b:index.html > original.html                      # the original upload (first commit)
cd game3d && npm install && node build.mjs dist/majeed3d.min.js --min && cd ..
python3 site-build/integrate.py original.html game3d/dist/majeed3d.min.js index.html
```
Push `main` and Hostinger deploys it.

## What the site has
- Products (Cardamom 450 g / 800 g / 1 kg / 5 kg trade pack / pouch, Classic Black 450 g / 800 g, Golden Majeed 600 g tin, Cardamom Tea 4.2 kg carton, Pekoe Black Tea 8 kg carton, Premium Tea 1 kg bag), each with its own page, in a 3D-style slider; the tin, the cartons and the bag are added by `add_products()` in `site-build/more_products.py`. No page says "Indian" any more (`site-build/no_india.py` takes it out of the uploaded text, and the build stops if it is still anywhere)
- Home page: hero slide show (changes every 5 s), "Majeed in numbers" (250 million cups, 2,700 markets, and the number of products; the "10,000 tons" fact and the scrolling words strip were taken off at the owner's request), tea moments, the 3D tea game (choose your tea, five steps), story, distributors
- About page: the spirit, "A Tradition in Every Cup", mission / vision / values
- Languages: English, Arabic (headlines in Arabic Typesetting, Amiri where it is not installed), Kurdish (NRT, Noto Sans Arabic where it is not installed). Kurdish text is `site-build/ku_strings.py`; it has not been proof-read by a native speaker yet
- Phones, iPads and Macs: stacked hero on phones and upright tablets, a big tea-game scene on phones, Safari / iOS fixes (`desktop_fixes.py`, `mobile_fixes.py`, `safari_fixes.py`)
- Factories page: a photo slider (five tea-garden photos) under the headline (`site-build/factory_slider.py`)
- Favicon: the Majeed logo (`favicon.ico`, `favicon-32.png`, `favicon-192.png`, `apple-touch-icon.png` in the root; `site-build/favicon.py`)
- Footer credit on the About page only: "Developed by Buzzify" (the Buzzify mark), linking to buzzify.me
