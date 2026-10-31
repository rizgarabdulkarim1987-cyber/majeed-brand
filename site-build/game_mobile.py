"""The tea game on a phone (<= 700px): the picture of the kitchen is the main thing.
 * The stage is edge to edge and tall; the status line is one slim line along its bottom, the sound button a small round button in the corner.
 * The long paragraph under the heading is dropped, the tea picker is a single slim row, and the five steps are one row of five buttons
   (number + short name) instead of six big cards. (The engine zooms its camera in on a phone and follows the action: game3d/src/game.js fitCamera.)
 * The round Majeed button steps aside while the game is on screen, so it never covers the game or its buttons.
Used by integrate.py: GAME_MOBILE_CSS (home pages) and GAME_MOBILE_JS (inside the shared page script)."""

GAME_MOBILE_CSS = (
    '@media (max-width:700px){'
    '.teagame.section{padding-top:48px;padding-bottom:34px}'
    '.teagame .section-heading{margin-bottom:12px}.teagame .section-heading h2{font-size:31px}.teagame .section-heading>p{display:none}'
    # the tea picker: one slim row
    '.gm-picker{margin-bottom:10px;padding-bottom:6px}.gm-picker-label{font-size:9px}'
    '.gm-prod{gap:6px;padding:3px 12px 3px 5px}.rtl .gm-prod{padding:3px 5px 3px 12px}.gm-prod img{width:20px;height:31px}'
    '.gm-prod span{display:flex;align-items:baseline;gap:5px}.gm-prod b{font-size:12px}.gm-prod small{margin:0;font-size:10px}'
    # the stage: edge to edge, tall
    '.gm-stage{aspect-ratio:auto;height:112vw;height:min(112vw,68svh);margin-inline:-6vw;border-radius:0}'
    '.gm-vignette{box-shadow:inset 0 0 60px #000a}'
    '.gm-hud{inset:auto 10px 10px 10px;align-items:center;gap:8px}'
    '.gm-status{display:block;flex:1 1 auto;min-width:0;padding:7px 12px;font-size:11.5px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    '.gm-icon{width:34px;height:34px}.gm-icon svg{width:16px;height:16px}'
    '.gm-done{bottom:56px;gap:12px;padding:9px 10px 9px 18px}.rtl .gm-done{padding:9px 18px 9px 10px}.gm-done p{font-size:15px}.gm-done button{padding:9px 14px;font-size:12px}'
    # the five steps: one row
    '.gm-steps{grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-top:10px}'
    '.gm-step{min-height:0;padding:8px 3px 7px;align-items:center;text-align:center;gap:4px;border-radius:12px}'
    '.gm-step-top{justify-content:center;margin:0}.gm-step-top svg{display:none}'
    '.gm-step strong{font-size:10px;line-height:1.2;letter-spacing:0;overflow-wrap:anywhere}'
    '.gm-full,.gm-step small{display:none}.gm-short{display:inline}'
    '.gm-num{width:22px;height:22px;font-size:11px}'
    '}'
)

GAME_MOBILE_JS = r'''  /* ---- on a phone the round Majeed button steps aside while the game is on screen ---- */
  var gmFrame = tg && $('.gm-frame', tg), gmFloat = $('.floating-system');
  if (gmFrame && gmFloat && 'IntersectionObserver' in window) {
    var gmQuery = matchMedia('(max-width:700px)');
    new IntersectionObserver(function (en) {
      var away = gmQuery.matches && en[0].isIntersecting;
      gmFloat.classList.toggle('is-hidden', away);
      if (away && typeof setMenu === 'function') setMenu(false);
    }, { threshold: 0.3 }).observe(gmFrame);
  }

'''
