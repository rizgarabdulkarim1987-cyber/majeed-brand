// Procedural canvases: the studio-style environment that glass and steel reflect, the wall, the wood, soft sprites.
import * as THREE from 'three';
import { rng } from './util.js';

const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };

/** Equirectangular reflection map: big window, softboxes, warm lamp, green tiled wall, wooden floor. */
export function makeEnvCanvas() {
  const [c, g] = mk(2048, 1024);
  // base: ceiling -> wall -> floor
  const bg = g.createLinearGradient(0, 0, 0, 1024);
  bg.addColorStop(0, '#2b2a26'); bg.addColorStop(0.3, '#46493f'); bg.addColorStop(0.49, '#3f6048');
  bg.addColorStop(0.52, '#3a2a1b'); bg.addColorStop(1, '#6b4a2a');
  g.fillStyle = bg; g.fillRect(0, 0, 2048, 1024);
  // back wall (toward -z, u≈0.25): darker green with gold specks
  const wall = g.createLinearGradient(256, 0, 768, 0);
  wall.addColorStop(0, 'rgba(15,40,25,0)'); wall.addColorStop(0.5, 'rgba(15,40,25,0.55)'); wall.addColorStop(1, 'rgba(15,40,25,0)');
  g.fillStyle = wall; g.fillRect(256, 280, 512, 250);
  const soft = (x, y, w, h, col, a, bars) => {
    const grd = g.createRadialGradient(x, y, 0, x, y, Math.max(w, h) * 0.75);
    g.save();
    g.filter = 'blur(10px)';
    g.fillStyle = col; g.globalAlpha = a;
    const r = 16;
    g.beginPath();
    g.roundRect(x - w / 2, y - h / 2, w, h, r); g.fill();
    g.restore();
    if (bars) {
      g.save(); g.globalAlpha = 0.85; g.fillStyle = '#1d211b';
      for (let i = 1; i < bars; i++) g.fillRect(x - w / 2 + (w * i) / bars - 5, y - h / 2, 10, h);
      g.fillRect(x - w / 2, y - 5, w, 10);
      g.restore();
    }
    void grd;
  };
  // big window front-left (toward +z, -x): u ~ 0.88, elevation ~ +20°
  soft(1800, 400, 330, 290, '#ffffff', 1, 3);
  // key softbox front-right
  soft(1260, 430, 220, 200, '#fff3df', 0.9, 0);
  // overhead strip light
  soft(1024, 110, 1100, 70, '#fff7ea', 0.95, 0);
  // warm lamp glow behind-top (center-back)
  soft(512, 190, 200, 90, '#ffd38a', 0.9, 0);
  // low fill bounce from the counter
  soft(1536, 640, 700, 60, '#d9a56a', 0.45, 0);
  return c;
}

/** The wall: dark green with a gold lattice, green tiled splash-back with grout and a gold trim line. */
export function makeWallCanvas() {
  const W = 2048, H = 1024;
  const [c, g] = mk(W, H);
  // wall covers y: 0..120 cm over the canvas height; splash-back is the bottom 28 cm
  const tileTop = Math.round(H * (1 - 28 / 120));
  const gr = g.createLinearGradient(0, 0, 0, tileTop);
  gr.addColorStop(0, '#13291b'); gr.addColorStop(0.75, '#1f4129'); gr.addColorStop(1, '#183422');
  g.fillStyle = gr; g.fillRect(0, 0, W, tileTop);
  const T = 74;
  g.strokeStyle = 'rgba(231,190,80,0.2)'; g.lineWidth = 1.6; g.fillStyle = 'rgba(231,190,80,0.05)';
  for (let y = 0; y < tileTop + T; y += T) for (let x = 0; x < W + T; x += T) {
    const cx = x + T / 2, cy = y + T / 2;
    g.beginPath(); g.moveTo(cx, cy - T * 0.42); g.lineTo(cx + T * 0.42, cy); g.lineTo(cx, cy + T * 0.42); g.lineTo(cx - T * 0.42, cy); g.closePath(); g.stroke();
    g.beginPath(); g.moveTo(cx, cy - T * 0.2); g.lineTo(cx + T * 0.2, cy); g.lineTo(cx, cy + T * 0.2); g.lineTo(cx - T * 0.2, cy); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(231,190,80,0.2)'; g.beginPath(); g.arc(cx, cy, 2.6, 0, 7); g.fill(); g.fillStyle = 'rgba(231,190,80,0.05)';
  }
  // splash-back tiles (grout colour underneath)
  g.fillStyle = '#17331f'; g.fillRect(0, tileTop, W, H - tileTop);
  const r = rng(7);
  const tw = 62, th = 31;
  for (let row = 0, y = tileTop; y < H; row++, y += th) {
    for (let x = -(row % 2) * (tw / 2); x < W; x += tw) {
      const v = 0.9 + r() * 0.22;
      g.fillStyle = `rgb(${Math.round(47 * v)},${Math.round(93 * v)},${Math.round(61 * v)})`;
      g.fillRect(x + 1.5, y + 1.5, tw - 3, th - 3);
      const hl = g.createLinearGradient(0, y, 0, y + th);
      hl.addColorStop(0, 'rgba(255,255,255,0.18)'); hl.addColorStop(0.35, 'rgba(255,255,255,0)'); hl.addColorStop(1, 'rgba(0,0,0,0.12)');
      g.fillStyle = hl; g.fillRect(x + 1.5, y + 1.5, tw - 3, th - 3);
    }
  }
  g.fillStyle = '#26241a'; g.fillRect(0, tileTop - 3, W, 9);
  g.fillStyle = 'rgba(231,190,80,0.85)'; g.fillRect(0, tileTop - 5, W, 5);
  g.fillStyle = 'rgba(255,240,200,0.5)'; g.fillRect(0, tileTop - 5, W, 1.5);
  return c;
}

/** Counter-top: wooden planks running left to right. */
export function makeWoodCanvas() {
  const [c, g] = mk(2048, 1024);
  const r = rng(21);
  const planks = 9, ph = 1024 / planks;
  for (let i = 0; i < planks; i++) {
    const y0 = i * ph;
    const hue = 28 + r() * 6, sat = 46 + r() * 10, lit = 38 + r() * 8;
    g.fillStyle = `hsl(${hue},${sat}%,${lit}%)`; g.fillRect(0, y0, 2048, ph);
    for (let k = 0; k < 120; k++) {
      const y = y0 + r() * ph;
      g.strokeStyle = `rgba(${r() > 0.5 ? '60,32,12' : '255,226,180'},${0.05 + r() * 0.12})`;
      g.lineWidth = 0.6 + r() * 1.6;
      g.beginPath(); g.moveTo(0, y);
      const amp = 2 + r() * 5, f = 0.002 + r() * 0.004, ph0 = r() * 7;
      for (let x = 0; x <= 2048; x += 32) g.lineTo(x, y + Math.sin(x * f + ph0) * amp);
      g.stroke();
    }
    // knots
    if (r() > 0.6) {
      const kx = r() * 2048, ky = y0 + ph * (0.3 + r() * 0.4);
      for (let k = 5; k > 0; k--) { g.strokeStyle = `rgba(60,32,12,${0.1 + k * 0.03})`; g.lineWidth = 1.3; g.beginPath(); g.ellipse(kx, ky, k * 9, k * 4, 0, 0, 7); g.stroke(); }
    }
    g.fillStyle = 'rgba(30,14,4,0.55)'; g.fillRect(0, y0, 2048, 2.5);
    g.fillStyle = 'rgba(255,230,190,0.18)'; g.fillRect(0, y0 + 2.5, 2048, 1.5);
  }
  // a few butt joints
  for (let i = 0; i < planks; i++) if (r() > 0.4) { g.fillStyle = 'rgba(30,14,4,0.5)'; g.fillRect(300 + r() * 1400, i * ph, 2.5, ph); }
  return c;
}

/** Soft dark blob for contact shadows. */
export function makeBlobCanvas() {
  const [c, g] = mk(128, 128);
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(18,8,0,0.85)'); grd.addColorStop(0.45, 'rgba(18,8,0,0.45)'); grd.addColorStop(1, 'rgba(18,8,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  return c;
}

/** Soft white puff for steam, splashes and glows. */
export function makeSpriteCanvas() {
  const [c, g] = mk(128, 128);
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.4, 'rgba(255,255,255,0.5)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  return c;
}

export function canvasTexture(canvas, srgb = true) {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
