"""Measures a product photo (transparent webp, 720 px tall) and stores its outline in profiles.json + ../src/profiles.js.
   python3 add_profile.py <slug> <cap0_row>
 * the outline is the radius / height at 241 even steps from the bottom, taken from the picture itself;
 * cap0_row: the pixel row (from the top of the 720 px picture) of the seam where the lid / cap sits on the body;
 * cap1 (the front edge of the lid's top face) is found from the picture: the first row, from the top, where the width stops growing.
"""
import json, os, sys
from PIL import Image

here = os.path.dirname(os.path.abspath(__file__))
slug, cap0_row = sys.argv[1], int(sys.argv[2])
im = Image.open(os.path.join(here, slug + '.webp')).convert('RGBA')
w, h = im.size
mask = im.split()[3].point(lambda v: 255 if v > 100 else 0).load()
wid = [sum(1 for x in range(w) if mask[x, y]) for y in range(h)]
N = 240
rows = [wid[min(h - 1, max(0, int(round((1 - k / N) * (h - 1)))))] / 2.0 / h for k in range(N + 1)]
r = []
for i in range(len(rows)):
    lo, hi = max(0, i - 1), min(len(rows) - 1, i + 1)
    r.append(round(sum(rows[lo:hi + 1]) / (hi - lo + 1), 4))
yF = next(y for y in range(8, 200) if wid[y + 3] - wid[y] <= 3)
entry = {'aspect': w / h, 'r': r, 'cap0': round(1 - cap0_row / h, 4), 'cap1': round(1 - yF / h, 4)}
path = os.path.join(here, 'profiles.json')
prof = json.load(open(path))
prof[slug] = entry
json.dump(prof, open(path, 'w'))
with open(os.path.join(here, '..', 'src', 'profiles.js'), 'w') as f:
    f.write('// Outline of each product photo: radius / height at 241 even steps from the bottom, taken from the picture itself.\n'
            '// cap0..cap1: where the screw cap / lid sits (bottom edge of its band, and the front edge of its top face).\n'
            'export const PROFILES = ' + json.dumps(prof, separators=(',', ':')) + ';\n')
print(slug, 'size', (w, h), 'cap0', entry['cap0'], 'cap1', entry['cap1'], 'rmax', max(r))
