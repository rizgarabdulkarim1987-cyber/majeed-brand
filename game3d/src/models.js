// The 3D models, all built from lathes and tubes in centimetres. Proportions follow the real Majeed teapot, tulip glass and pouch.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { glassFront, glassBack, liquidMaterials, makeLiquidUniforms } from './materials.js';
import { rng } from './util.js';

const V2 = (a) => a.map((p) => new THREE.Vector2(p[0], p[1]));

/** Smooth a hand-placed profile [[r,y],...] (bottom to top) into a dense one. */
export function smooth(ctl, n = 80) {
  const pts = new THREE.SplineCurve(V2(ctl)).getPoints(n);
  const out = [];
  let my = -1e9;
  for (const p of pts) { my = Math.max(my, p.y); out.push([Math.max(0, p.x), my]); }
  return out;
}

export function lathe(points, segs = 72) {
  return new THREE.LatheGeometry(V2(points), segs);
}

/** A tube whose radius runs from rA to rB along the curve; squash widens/flattens the section in z. */
export function taperedTube(curve, rA, rB, seg = 48, radial = 18, squash = 1) {
  const geo = new THREE.TubeGeometry(curve, seg, 1, radial, false);
  const pos = geo.attributes.position, n = radial + 1;
  for (let i = 0; i <= seg; i++) {
    const c = curve.getPointAt(i / seg), s = rA + (rB - rA) * (i / seg);
    for (let j = 0; j < n; j++) {
      const k = i * n + j;
      pos.setXYZ(k, c.x + (pos.getX(k) - c.x) * s, c.y + (pos.getY(k) - c.y) * s, c.z + (pos.getZ(k) - c.z) * s * squash);
    }
  }
  return geo;
}

/** Inner shape of a vessel: radius at any height, volume <-> level, and points to find the level of a tilted pour. */
export function makeVessel(inner) {
  const ys = inner.map((p) => p[1]), rs = inner.map((p) => p[0]);
  const cum = [0];
  for (let i = 1; i < ys.length; i++) {
    const dy = ys[i] - ys[i - 1], a = rs[i - 1], b = rs[i];
    cum.push(cum[i - 1] + (Math.PI * dy * (a * a + a * b + b * b)) / 3);
  }
  const total = cum[cum.length - 1];
  const R = (y) => {
    if (y <= ys[0]) return rs[0];
    for (let i = 1; i < ys.length; i++) if (y <= ys[i]) { const t = (y - ys[i - 1]) / Math.max(1e-6, ys[i] - ys[i - 1]); return rs[i - 1] + (rs[i] - rs[i - 1]) * t; }
    return rs[rs.length - 1];
  };
  const levelFor = (v) => {
    if (v <= 0) return ys[0];
    if (v >= total) return ys[ys.length - 1];
    for (let i = 1; i < cum.length; i++) if (v <= cum[i]) { const t = (v - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]); return ys[i - 1] + (ys[i] - ys[i - 1]) * t; }
    return ys[ys.length - 1];
  };
  const volumeAt = (y) => {
    if (y <= ys[0]) return 0;
    for (let i = 1; i < ys.length; i++) if (y <= ys[i]) {
      const t = (y - ys[i - 1]) / Math.max(1e-6, ys[i] - ys[i - 1]), r0 = rs[i - 1], r1 = r0 + (rs[i] - r0) * t, dy = y - ys[i - 1];
      return cum[i - 1] + (Math.PI * dy * (r0 * r0 + r0 * r1 + r1 * r1)) / 3;
    }
    return total;
  };
  const rnd = rng(11);
  const makeSamples = (N) => {
    const a = new Float32Array(N * 3);
    for (let k = 0; k < N; k++) {
      const y = levelFor(((k + rnd()) / N) * total), r = R(y) * Math.sqrt(rnd()), th = rnd() * Math.PI * 2;
      a[k * 3] = r * Math.cos(th); a[k * 3 + 1] = y; a[k * 3 + 2] = r * Math.sin(th);
    }
    return a;
  };
  return { R, levelFor, volumeAt, total, makeSamples, yMin: ys[0], yMax: ys[ys.length - 1] };
}

/** Glass in two layers: back faces in the scene pass (layer 0), refractive front faces in the glass pass (layer 1). */
export function addGlass(parent, geo, ctx, opts = {}) {
  const back = new THREE.Mesh(geo, ctx.glassBackMat);
  back.renderOrder = 1; back.layers.set(0);
  const front = new THREE.Mesh(geo, opts.front || ctx.glassFrontMat);
  front.renderOrder = 5; front.layers.set(1);
  parent.add(back, front);
  return { back, front };
}

/** A printed label bent onto a lathe body: u across (angle), v up the height. */
function curvedPatch(R, yc, h, w, off = 0.05, segsU = 28, segsV = 8) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= segsV; j++) for (let i = 0; i <= segsU; i++) {
    const u = i / segsU, v = j / segsV, y = yc + (v - 0.5) * h;
    const r = R(y) + off, ang = (u - 0.5) * (w / R(yc));
    pos.push(r * Math.sin(ang), y, r * Math.cos(ang)); uv.push(u, v);
  }
  for (let j = 0; j < segsV; j++) for (let i = 0; i < segsU; i++) {
    const a = j * (segsU + 1) + i, b = a + 1, c = a + segsU + 1, d = c + 1;
    idx.push(a, b, d, a, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

/* ---------------- materials ---------------- */
export function makeMaterials(envMap) {
  const e = envMap;
  return {
    steel: new THREE.MeshStandardMaterial({ color: 0xdfe3e6, metalness: 1, roughness: 0.2, envMap: e, envMapIntensity: 1.7 }),
    steelDull: new THREE.MeshStandardMaterial({ color: 0xc9cdd0, metalness: 1, roughness: 0.34, envMap: e, envMapIntensity: 1.4 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xd9a948, metalness: 1, roughness: 0.28, envMap: e, envMapIntensity: 1.5 }),
    iron: new THREE.MeshStandardMaterial({ color: 0x1b1c1e, metalness: 0.6, roughness: 0.5, envMap: e, envMapIntensity: 0.7 }),
    blackGlass: new THREE.MeshStandardMaterial({ color: 0x0f1113, metalness: 0.2, roughness: 0.16, envMap: e, envMapIntensity: 1.2 }),
    woodDark: new THREE.MeshStandardMaterial({ color: 0x6a4222, roughness: 0.6, metalness: 0 }),
  };
}

/* ---------------- the glass teapot (proportions follow the real Majeed teapot: round body, tall steel collar, short high spout, big loop handle) ---------------- */
export function buildPot(ctx) {
  const g = new THREE.Group(); g.name = 'pot';
  const outer = smooth([[0, 0], [3.4, 0.0], [5.6, 0.3], [7.2, 1.2], [8.0, 2.8], [8.25, 5.0], [8.0, 7.6], [7.2, 10.0], [6.25, 11.9], [5.85, 13.0], [5.78, 13.7]], 110);
  const inner = smooth([[0, 0.6], [3.3, 0.6], [5.4, 0.9], [6.9, 1.8], [7.7, 3.2], [7.95, 5.0], [7.7, 7.5], [6.9, 9.8], [5.95, 11.7], [5.55, 13.0], [5.48, 13.8]], 110);
  const vessel = makeVessel(inner);
  const outerR = makeVessel(outer).R;
  const RIM = 15.3;                      // top of the steel collar: where the lid sits

  addGlass(g, lathe(outer, 88), ctx);
  // thick glass foot
  const foot = new THREE.Mesh(new THREE.TorusGeometry(3.7, 0.28, 10, 56), ctx.glassFrontMat); foot.rotation.x = Math.PI / 2; foot.position.y = 0.3; foot.layers.set(1); foot.renderOrder = 5; g.add(foot);

  // handle (opposite the spout) and spout, in the x/y plane
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-6.9, 11.4, 0), new THREE.Vector3(-10.4, 14.4, 0), new THREE.Vector3(-13.3, 11.6, 0),
    new THREE.Vector3(-13.0, 6.6, 0), new THREE.Vector3(-9.9, 3.4, 0), new THREE.Vector3(-7.4, 2.8, 0),
  ]);
  addGlass(g, taperedTube(handleCurve, 0.72, 0.72, 64, 16, 1.4), ctx);

  const spoutCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(6.9, 3.8, 0), new THREE.Vector3(9.8, 5.8, 0), new THREE.Vector3(11.9, 9.2, 0), new THREE.Vector3(12.7, 12.3, 0), new THREE.Vector3(12.85, 13.2, 0),
  ]);
  addGlass(g, taperedTube(spoutCurve, 1.55, 1.0, 56, 22), ctx);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.15, 10, 32), ctx.glassFrontMat);
  lip.position.set(12.85, 13.2, 0); lip.rotation.set(Math.PI / 2, 0, 0.1); lip.layers.set(1); lip.renderOrder = 5; g.add(lip);

  // steel collar and rim
  const collar = new THREE.Mesh(lathe([[6.0, 12.95], [6.04, 13.2], [6.05, 15.05], [6.18, 15.25], [6.3, 15.39], [6.0, 15.45]], 80), ctx.mats.steel);
  g.add(collar);
  const bead = new THREE.Mesh(new THREE.TorusGeometry(6.15, 0.18, 10, 80), ctx.mats.steel); bead.rotation.x = Math.PI / 2; bead.position.y = 12.98; g.add(bead);
  const innerRing = new THREE.Mesh(lathe([[5.5, 12.95], [5.5, 15.4]], 60), ctx.mats.steelDull); innerRing.material = innerRing.material.clone(); innerRing.material.side = THREE.BackSide; g.add(innerRing);

  // liquid: body + spout, clipped by the shared level plane
  const u = makeLiquidUniforms(ctx.shared);
  const lm = liquidMaterials(u);
  const bodyLiq = lathe(inner, 72);
  const spoutLiq = taperedTube(spoutCurve, 1.2, 0.72, 44, 14);
  const liq = [];
  for (const geo of [bodyLiq, spoutLiq]) {
    const bk = new THREE.Mesh(geo, lm.back); bk.renderOrder = 3; bk.layers.set(0);
    const fr = new THREE.Mesh(geo, lm.front); fr.renderOrder = 4; fr.layers.set(0);
    g.add(bk, fr); liq.push(bk, fr);
  }

  // printed label on the front of the body
  const label = new THREE.Mesh(curvedPatch(outerR, 6.5, 5.2, 7.4, 0.07), ctx.labelMat);
  label.layers.set(1); label.renderOrder = 10; g.add(label);

  // the steel lid (separate so it can lift off)
  const lid = new THREE.Group(); lid.name = 'lid';
  const Y = RIM - 12.3;                  // everything on the lid was drawn for a rim at 12.3
  const sy = (pts) => pts.map(([r, y]) => [r, y + Y]);
  const lidBody = new THREE.Mesh(lathe(smooth(sy([[5.4, 12.22], [6.28, 12.22], [6.4, 12.3], [6.32, 12.4], [5.85, 12.55], [5.0, 12.8], [3.4, 13.08], [1.6, 13.26], [0, 13.28]]), 44), 80), ctx.mats.steel);
  lid.add(lidBody);
  const knob = new THREE.Mesh(lathe(smooth(sy([[0, 13.28], [1.05, 13.28], [0.66, 13.65], [0.55, 14.05], [0.62, 14.35], [1.12, 14.65], [1.46, 15.15], [1.42, 15.62], [1.0, 16.0], [0.4, 16.2], [0, 16.22]]), 54), 44), ctx.mats.steel);
  lid.add(knob);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.13, 8, 36), ctx.mats.steel); ring.rotation.x = Math.PI / 2; ring.position.y = 14.48 + Y; lid.add(ring);
  for (let i = 0; i < 3; i++) {
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.2, 12), new THREE.MeshBasicMaterial({ color: 0x0b0b0b }));
    hole.rotation.x = -Math.PI / 2; hole.position.set(-2.9 - i * 0.05, 13.3 + Y, 0.9 - i * 0.9); lid.add(hole);
  }
  g.add(lid);

  return {
    group: g, lid, vessel, liquidUniforms: u, liquidMeshes: liq, outerR, rimY: RIM,
    samples: vessel.makeSamples(1200),
    lipLocal: new THREE.Vector3(12.6, 12.8, 0),
    mouthLocal: new THREE.Vector3(0, RIM, 0),
    steamLocal: new THREE.Vector3(-2.9, RIM + 1.2, 0.5),
    spoutCurve,
  };
}

/* ---------------- tulip glass + saucer ---------------- */
export function buildCup(ctx) {
  const g = new THREE.Group(); g.name = 'cup';
  const outer = smooth([[0, 0], [1.9, 0], [2.25, 0.25], [2.35, 1.0], [2.2, 2.4], [1.85, 3.9], [1.72, 5.0], [1.86, 6.5], [2.3, 8.1], [2.65, 9.3], [2.72, 9.55]], 80);
  const inner = smooth([[0, 0.85], [1.6, 0.85], [2.1, 1.1], [2.15, 2.4], [1.75, 3.9], [1.6, 5.0], [1.73, 6.5], [2.18, 8.1], [2.52, 9.3], [2.58, 9.6]], 80);
  const vessel = makeVessel(inner), outerR = makeVessel(outer).R;
  addGlass(g, lathe(outer, 56), ctx);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.65, 0.07, 8, 40), ctx.glassFrontMat); rim.rotation.x = Math.PI / 2; rim.position.y = 9.5; rim.layers.set(1); rim.renderOrder = 5; g.add(rim);
  const u = makeLiquidUniforms(ctx.shared);
  const lm = liquidMaterials(u);
  const liqGeo = lathe(inner, 48);
  const liq = [];
  const b = new THREE.Mesh(liqGeo, lm.back); b.renderOrder = 3; b.layers.set(0);
  const f = new THREE.Mesh(liqGeo, lm.front); f.renderOrder = 4; f.layers.set(0);
  g.add(b, f); liq.push(b, f);
  const label = new THREE.Mesh(curvedPatch(outerR, 4.9, 2.1, 3.1, 0.05, 24, 6), ctx.labelMat);
  label.layers.set(1); label.renderOrder = 10; g.add(label);

  const saucer = new THREE.Group(); saucer.name = 'saucer';
  const sp = smooth([[0, 0.08], [3.0, 0.08], [5.5, 0.6], [5.95, 1.2], [5.95, 1.36], [5.2, 0.96], [3.1, 0.62], [2.8, 0.66], [2.4, 0.56], [0, 0.56]], 80);
  addGlass(saucer, new THREE.LatheGeometry(V2(sp), 64), ctx, { front: ctx.saucerFrontMat });
  return { group: g, saucer, vessel, liquidUniforms: u, liquidMeshes: liq, baseY: 0.56 };
}

/* ---------------- the products you can brew ---------------- */
// real pack sizes (cm) and photo proportions; every product except the 5 kg trade pack
export const PRODUCTS = {
  'cardamom-pouch': { type: 'pouch', h: 17.5, aspect: 0.6714, card: true },
  'cardamom-450g': { type: 'jar', h: 13.0, aspect: 0.6571, split: 0.165, card: true },
  'cardamom-800g': { type: 'jar', h: 15.5, aspect: 0.6607, split: 0.165, card: true },
  'cardamom-1kg': { type: 'jar', h: 17.0, aspect: 0.6357, split: 0.165, card: true },
  'classic-450g': { type: 'jar', h: 13.0, aspect: 0.6339, split: 0.16, card: false },
  'classic-800g': { type: 'jar', h: 15.5, aspect: 0.6054, split: 0.16, card: false },
};

/** A pack photo bent into a shallow 3D shell (like a round jar or a plump pouch): u across, v from v0 to v1 of the photo. */
function packShell(w, h, depth, v0, v1, sx = 28, sy = 30, pillow = 0) {
  const geo = new THREE.PlaneGeometry(w, h, sx, sy);
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / (w / 2), y01 = (p.getY(i) + h / 2) / h;
    const round = Math.sqrt(Math.max(0, 1 - x * x));
    const pil = pillow ? (1 - Math.pow(Math.abs(x), 2.4)) * (0.35 + 0.65 * Math.sin(Math.min(1, y01 * 1.15) * Math.PI * 0.92)) : round;
    p.setZ(i, pil * (depth / 2)); p.setY(i, p.getY(i) + h / 2);
    uv.setY(i, v0 + (v1 - v0) * y01);
  }
  geo.computeVertexNormals();
  return geo;
}

export function buildPack(ctx, slug, tex) {
  const spec = PRODUCTS[slug];
  const H = spec.h, W = H * spec.aspect;
  const g = new THREE.Group(); g.name = 'pack';
  const mat = () => new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, roughness: 0.5, metalness: 0, envMap: ctx.envMap, envMapIntensity: 0.22, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.16 });
  if (spec.type === 'pouch') {
    const f = new THREE.Mesh(packShell(W, H, 3.6, 0, 1, 26, 36, 1), mat());
    const seal = new THREE.Mesh(new THREE.BoxGeometry(W * 0.99, 0.5, 0.35), new THREE.MeshStandardMaterial({ color: 0xe2b23a, metalness: 0.9, roughness: 0.3, envMap: ctx.envMap }));
    seal.position.set(0, H - 0.1, 0);
    g.add(f, seal);
    return { group: g, cap: null, mouthLocal: new THREE.Vector3(0, H - 0.1, 0), spread: W * 0.34, W, H, spec };
  }
  // jar: a body and a screw cap that comes off
  const hb = H * (1 - spec.split), hc = H * spec.split;
  const body = new THREE.Mesh(packShell(W, hb, W * 0.82, 0, 1 - spec.split, 26, 28), mat());
  g.add(body);
  const cap = new THREE.Group();
  const capMesh = new THREE.Mesh(packShell(W, hc, W * 0.82, 1 - spec.split, 1, 26, 8), mat());
  cap.add(capMesh); cap.position.set(0, hb, 0);
  g.add(cap);
  return { group: g, cap, capH: hc, mouthLocal: new THREE.Vector3(0, hb, 0), spread: W * 0.26, W, H, spec };
}

/* ---------------- stove ---------------- */
export function buildStove(ctx) {
  const g = new THREE.Group(); g.name = 'stove';
  const body = new THREE.Mesh(new RoundedBoxGeometry(30, 7.8, 26, 4, 0.5), ctx.mats.steelDull); body.position.y = 3.9; g.add(body);
  const top = new THREE.Mesh(new RoundedBoxGeometry(29.2, 0.8, 25.2, 3, 0.25), ctx.mats.blackGlass); top.position.y = 8.0; g.add(top);
  // burner: base, cap, flame ports
  const base = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.2, 0.7, 40), ctx.mats.brass); base.position.y = 8.75; g.add(base);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.2, 0.55, 40), ctx.mats.iron); crown.position.y = 9.3; g.add(crown);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.1, 0.45, 40), ctx.mats.brass); cap.position.y = 9.75; g.add(cap);
  const portRing = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.22, 8, 40), ctx.mats.brass); portRing.rotation.x = Math.PI / 2; portRing.position.y = 9.0; g.add(portRing);
  // pan support: ring + four arms
  const trivet = new THREE.Group();
  const ringT = new THREE.Mesh(new THREE.TorusGeometry(4.9, 0.3, 10, 48), ctx.mats.iron); ringT.rotation.x = Math.PI / 2; trivet.add(ringT);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.5, 0.9), ctx.mats.iron);
    arm.position.set(Math.cos(a) * 6.6, -0.25, Math.sin(a) * 6.6); arm.rotation.y = -a; trivet.add(arm);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 1.6, 10), ctx.mats.iron); foot.position.set(Math.cos(a) * 8.9, -1.0, Math.sin(a) * 8.9); trivet.add(foot);
  }
  trivet.position.y = 10.5; g.add(trivet);
  // knob on the front panel
  const knob = new THREE.Group(); knob.position.set(0, 4.2, 13.2);
  const kb = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.5, 1.5, 36), ctx.mats.steel); kb.rotation.x = Math.PI / 2; knob.add(kb);
  const kc = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.4, 36), ctx.mats.iron); kc.rotation.x = Math.PI / 2; kc.position.z = 0.8; knob.add(kc);
  const kd = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.7, 0.3), new THREE.MeshStandardMaterial({ color: 0xca2a20, roughness: 0.4 })); kd.position.set(0, 0.7, 1.05); knob.add(kd);
  g.add(knob);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(10, 0.5), new THREE.MeshBasicMaterial({ color: 0xe7be50, transparent: true, opacity: 0.55 })); face.position.set(0, 1.3, 13.06); g.add(face);
  return { group: g, knob, burnerCenter: new THREE.Vector3(0, 9.4, 0), topY: 8.4, potSeatY: 10.95 };
}

/* ---------------- tap: a brass gooseneck standing on the counter ---------------- */
export function buildTap(ctx) {
  const g = new THREE.Group(); g.name = 'tap';
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 3.0, 1.3, 40), ctx.mats.brass); base.position.y = 0.65; g.add(base);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.4, 2.2, 36), ctx.mats.brass); collar.position.y = 2.3; g.add(collar);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 2, 0), new THREE.Vector3(0, 15, 0), new THREE.Vector3(0, 29.5, 0), new THREE.Vector3(-1.4, 36.3, 0.5), new THREE.Vector3(-6.2, 40.1, 1.6),
    new THREE.Vector3(-12.6, 39.5, 3.1), new THREE.Vector3(-16.6, 35.1, 4.4), new THREE.Vector3(-18.0, 30.5, 5.0), new THREE.Vector3(-18.0, 28.1, 5.0),
  ]);
  const neck = new THREE.Mesh(taperedTube(curve, 1.25, 1.0, 90, 20), ctx.mats.brass); g.add(neck);
  const noz = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.15, 1.6, 28), ctx.mats.steel); noz.position.set(-18.0, 27.5, 5.0); g.add(noz);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.2, 10, 28), ctx.mats.brass); ring.rotation.x = Math.PI / 2; ring.position.set(-18.0, 28.4, 5.0); g.add(ring);
  // side lever
  const lever = new THREE.Group(); lever.position.set(0, 11, 1.3);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(1.35, 24, 16), ctx.mats.brass); lever.add(hub);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 6.6, 20), ctx.mats.brass); bar.rotation.z = Math.PI / 2; bar.position.x = 3.9; lever.add(bar);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.85, 20, 14), ctx.mats.brass); tip.position.x = 7.3; lever.add(tip);
  g.add(lever);
  return { group: g, lever, mouthLocal: new THREE.Vector3(-18.0, 26.6, 5.0) };
}

/* ---------------- lamp ---------------- */
export function buildLamp(ctx) {
  const g = new THREE.Group(); g.name = 'lamp';
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 40, 8), new THREE.MeshBasicMaterial({ color: 0x0c1810 })); cord.position.y = 26; g.add(cord);
  const dome = new THREE.Mesh(lathe(smooth([[0.9, 6.4], [2.2, 6.0], [4.6, 4.4], [7.0, 1.6], [7.6, 0.0], [7.4, -0.5], [6.9, -0.4]], 40), 56), new THREE.MeshStandardMaterial({ color: 0xc9a14a, metalness: 1, roughness: 0.32, envMap: ctx.envMap, side: THREE.DoubleSide }));
  dome.position.y = 0; g.add(dome);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(2.4, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffc66e })); bulb.position.y = -0.4; g.add(bulb);
  return { group: g, bulb };
}

/* ---------------- room: wall, counter, shelf ---------------- */
export function buildRoom(ctx) {
  const g = new THREE.Group(); g.name = 'room';
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(300, 140), new THREE.MeshStandardMaterial({ map: ctx.wallTex, roughness: 0.55, metalness: 0.02, envMap: ctx.envMap, envMapIntensity: 0.35 }));
  wall.position.set(0, 70, -22); g.add(wall);
  const top = new THREE.Mesh(new THREE.BoxGeometry(170, 4, 60), new THREE.MeshStandardMaterial({ map: ctx.woodTex, roughness: 0.52, metalness: 0, envMap: ctx.envMap, envMapIntensity: 0.3 }));
  top.position.set(0, -2, 8); g.add(top);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(170, 1.0, 0.8), new THREE.MeshStandardMaterial({ color: 0xe0b278, roughness: 0.5 })); edge.position.set(0, -0.3, 38.1); g.add(edge);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(170, 60, 1.5), new THREE.MeshStandardMaterial({ color: 0x3a2412, roughness: 0.6 })); cab.position.set(0, -34, 38); g.add(cab);
  // shelf with brackets
  const shelf = new THREE.Group(); shelf.position.set(-41, 29.5, -15);
  const plank = new THREE.Mesh(new RoundedBoxGeometry(28, 1.2, 14, 2, 0.25), new THREE.MeshStandardMaterial({ color: 0x7d5028, roughness: 0.55 })); plank.position.y = -0.6; shelf.add(plank);
  for (const sx of [-10, 10]) {
    const br = new THREE.Mesh(new THREE.BoxGeometry(1.0, 7, 10), ctx.mats.woodDark); br.position.set(sx, -4.4, -2); shelf.add(br);
  }
  g.add(shelf);
  return { group: g, shelf };
}

export function labelMaterial(tex, envMap) {
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.28, metalness: 0, envMap, envMapIntensity: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
}

export function makeGlassMaterials(shared, envCube) {
  shared.tEnv.value = envCube;
  return {
    glassFrontMat: glassFront(shared, { refr: 0.065, env: 3.2, tint: 0xd3ece2, edgeDark: 0.4 }),
    saucerFrontMat: glassFront(shared, { refr: 0.02, env: 0.9, tint: 0xf0f8f4, edgeDark: 0.12 }),
    glassBackMat: glassBack(shared, { env: 2.6, tint: 0xdff2ea }),
  };
}
