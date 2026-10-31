"""The favicon: the Majeed logo (white script on the red tile) as a square tile.
  python3 favicon.py        regenerates favicon.ico, favicon-32.png, favicon-192.png and apple-touch-icon.png in the repository root
                            from source/majeed-logo.png (the logo the site's menu bar uses).
integrate.py puts FAVICON_LINKS in the <head> of every page and of the shell page (the icons are plain files in the site root,
so the browser also finds /favicon.ico by itself)."""
import os, sys

FAVICON_LINKS = ('<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png"><link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png">'
                 '<link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="shortcut icon" href="/favicon.ico">')


def make(root):
    import numpy as np
    from PIL import Image, ImageDraw
    here = os.path.dirname(os.path.abspath(__file__))
    logo = Image.open(os.path.join(here, 'source', 'majeed-logo.png')).convert('RGBA')
    a = np.asarray(logo).astype(int)
    white = (a[..., 0] > 200) & (a[..., 1] > 200) & (a[..., 2] > 200) & (a[..., 3] > 200)      # the script is the white part
    ys, xs = np.where(white)
    box = (xs.min() - 4, ys.min() - 4, xs.max() + 5, ys.max() + 5)
    script = logo.crop(box)                                                                   # white script on the logo's red
    S = 1024                                                                                  # drawn big, then scaled down (smooth edges)
    tile = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    mask = Image.new('L', (S, S), 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, S - 1, S - 1), radius=int(S * 0.22), fill=255)
    red = Image.new('RGBA', (S, S), (255, 0, 0, 255)); tile.paste(red, (0, 0), mask)
    w = int(S * 0.8); h = round(script.height * w / script.width)
    sc = script.resize((w, h), Image.LANCZOS)
    tile.alpha_composite(sc, ((S - w) // 2, (S - h) // 2 + int(S * 0.01)))
    out = {}
    for name, size in (('favicon-32.png', 32), ('favicon-192.png', 192), ('apple-touch-icon.png', 180)):
        im = tile.resize((size, size), Image.LANCZOS)
        if name == 'apple-touch-icon.png':                                                    # iOS draws its own rounded corners: a full red square
            sq = Image.new('RGBA', (S, S), (255, 0, 0, 255)); sq.alpha_composite(sc, ((S - w) // 2, (S - h) // 2 + int(S * 0.01))); im = sq.resize((size, size), Image.LANCZOS).convert('RGB')
        im.save(os.path.join(root, name)); out[name] = size
    tile.resize((256, 256), Image.LANCZOS).save(os.path.join(root, 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    return out


if __name__ == '__main__':
    root = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    print(make(root))
