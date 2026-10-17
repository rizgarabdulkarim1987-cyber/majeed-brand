"""Safari / iOS / Mac normalisation, on every page.
 * iOS Safari zooms the page in when you tap a form field whose text is under 16 px; the contact form fields are 16 px on phones now
 * iOS Safari enlarges small text on its own after turning the phone; text-size-adjust keeps the layout as designed
 * iOS Safari draws its own inner shadow / rounding on text fields: appearance is reset
 * the grey flash when tapping a link or button on iOS is switched off (the keyboard focus ring stays)
 * Safari draws SVG stroke animations (pathLength) reliably only on <path>: the graphics in facts.py use paths
 * Safari does not always clip moving pictures to a rounded box: those boxes are isolated (see desktop_fixes.py)
 * the language menu's flex layout sits in a <span>, because Safari does not always lay a <summary> out as flex
"""

SAFARI_CSS = (
    'html{-webkit-text-size-adjust:100%;text-size-adjust:100%}'
    'a,button,summary{-webkit-tap-highlight-color:transparent}'
    'input:not([type=checkbox]):not([type=radio]):not([type=submit]),textarea,select{-webkit-appearance:none;appearance:none}'
    '.form-grid select{background:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\' fill=\'none\' stroke=\'%23292b23\' stroke-width=\'1.6\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M1 1.5l5 5 5-5\'/%3E%3C/svg%3E") no-repeat right 2px center;padding-right:22px;border-radius:0}'
    '.rtl .form-grid select{background-position:left 2px center;padding-right:0;padding-left:22px}'
    '@media (max-width:800px){.form-grid input,.form-grid textarea,.form-grid select{font-size:16px}}'
)
