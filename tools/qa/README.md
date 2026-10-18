# QA tools

Playwright scripts used to check the site in a real browser (English / Arabic / Kurdish, desktop, iPad and phone sizes).
Install once: `cd tools/qa && npm install` and point `PW_CHROMIUM` at a Chromium (default `/opt/pw-browsers/chromium`).
Every script takes the built `index.html` first. (WebGL runs on the software renderer, so the game checks are slow.)

| script | what it checks |
|---|---|
| `site_audit.js <html> [widths] [pages]` | every page at several widths: page errors, duplicate ids, broken links / images, sideways overflow (with classic 15 px scrollbars) |
| `overlap_audit.js <html> <W> <H> <pages> <0\|1>` | which text, pictures and controls overlap each other (`overlap_audit_touch.js` is the phone variant) |
| `cta_audit.js <html> <W> <H>` | every link / button: is it really what a finger or pointer would hit (not covered by something else) |
| `nav_cover.js <html> [widths]` | content hidden under the fixed header |
| `nav_test.js`, `menu_test.js`, `check_site.js` | page switching, the language menu (Escape / outside click), the home page, the contact form message |
| `page_test.js <html> <outdir> <W> <H> <en\|ar\|ku> <flow.json>` | drives the tea game (`flows/*.json`: pick a tea, run the five steps, screenshots) |
| `hero_slide_test.js`, `facts_test.js`, `gold_test.js`, `arrows_test.js`, `picker_click.js` | the hero slide show, the numbers section, the Golden Majeed pages, the slider arrows, the tea picker |
| `ph_game.js`, `ph_game_pour.js`, `ph_hero.js`, `ph_fab.js`, `ph_el.js` | phone screenshots of the game, the hero, the round button's menu and single elements |
| `hero_shot.js`, `sec_shot.js`, `full_shot.js`, `shot.js`, `lang_shot.js` | screenshots (hero at a size, a section, a whole page; the 3D engine alone in a harness; the language menu) |
