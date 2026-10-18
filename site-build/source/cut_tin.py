"""Cuts a product photo out of its white background (transparent PNG, edge colours cleaned) - how assets/revised-golden-600.webp was made.
   python3 cut_tin.py golden-600g-original.jpg golden-600g-cutout.png
Then: webp for the site (assets/revised-golden-600.webp, ~1000 px wide) and a 720 px tall webp for the 3D game (../../game3d/products/golden-600g.webp),
and  python3 ../../game3d/products/add_profile.py golden-600g <row of the lid seam>  to store its outline for the 3D model."""
import sys
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

src_path, out_path = sys.argv[1:3]
src = Image.open(src_path).convert('RGB')
a = np.asarray(src).astype(np.int16)
H, W = a.shape[:2]
cand = (a.max(2) - a.min(2)) > 26                       # coloured pixels = the product (the background is near white / grey)
ci = Image.fromarray((cand * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
cand = np.asarray(ci) > 127
free = ~cand                                            # everything reachable from the border without crossing the product is background
seen = np.zeros_like(free, bool); q = deque()
for x in range(W):
    for y in (0, H - 1):
        if free[y, x] and not seen[y, x]: seen[y, x] = True; q.append((y, x))
for y in range(H):
    for x in (0, W - 1):
        if free[y, x] and not seen[y, x]: seen[y, x] = True; q.append((y, x))
while q:
    y, x = q.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        yy, xx = y + dy, x + dx
        if 0 <= yy < H and 0 <= xx < W and free[yy, xx] and not seen[yy, xx]:
            seen[yy, xx] = True; q.append((yy, xx))
fg = ~seen
mi = Image.fromarray((fg * 255).astype(np.uint8))
alpha = np.asarray(mi.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(1.1))).astype(np.float32) / 255
core = np.asarray(mi.filter(ImageFilter.MinFilter(11))) > 127   # interior colours only
col = np.asarray(src).astype(np.float32).copy(); known = core.copy()
for _ in range(8):                                      # edge pixels take the colour of the nearest interior pixels (no white fringe)
    acc = np.zeros_like(col); cnt = np.zeros(known.shape, np.float32)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            if dy == 0 and dx == 0: continue
            ks = np.roll(np.roll(known, dy, 0), dx, 1); cs = np.roll(np.roll(col, dy, 0), dx, 1)
            acc += cs * ks[..., None]; cnt += ks
    new = (~known) & (cnt > 0)
    col[new] = acc[new] / cnt[new][..., None]; known = known | new
final = np.where((~core)[..., None], col, np.asarray(src).astype(np.float32))
out = Image.fromarray(np.concatenate([final, (alpha * 255)[..., None]], axis=2).clip(0, 255).astype(np.uint8), 'RGBA')
ys, xs = np.where(alpha > 0.02)
out.crop((max(xs.min() - 3, 0), max(ys.min() - 3, 0), min(xs.max() + 4, W), min(ys.max() + 4, H))).save(out_path)
print('saved', out_path)
