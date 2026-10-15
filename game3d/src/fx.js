// Effects: steam/splash puffs, gas flames, boiling bubbles, tea leaves + cardamom with simple physics, and pour streams.
import * as THREE from 'three';
import { clamp, lerp, rng, sstep } from './util.js';
import { flameMaterial, puffMaterial } from './materials.js';

/* ---------------- puffs (steam, splashes) ---------------- */
export class Puffs {
  constructor(max, map) {
    this.max = max; this.n = 0; this.cursor = 0;
    this.pos = new Float32Array(max * 3); this.size = new Float32Array(max); this.alpha = new Float32Array(max); this.tint = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3); this.age = new Float32Array(max).fill(1e9); this.life = new Float32Array(max).fill(1);
    this.s0 = new Float32Array(max); this.s1 = new Float32Array(max); this.a0 = new Float32Array(max); this.drag = new Float32Array(max); this.grav = new Float32Array(max); this.seed = new Float32Array(max);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1));
    g.setAttribute('aTint', new THREE.BufferAttribute(this.tint, 3));
    this.mat = puffMaterial(map);
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false; this.points.renderOrder = 8;
    this.geo = g; this.t = 0;
  }
  emit(p, v, o = {}) {
    const i = this.cursor; this.cursor = (this.cursor + 1) % this.max;
    this.pos.set([p.x, p.y, p.z], i * 3); this.vel.set([v.x, v.y, v.z], i * 3);
    this.age[i] = 0; this.life[i] = o.life ?? 2; this.s0[i] = o.s0 ?? 1; this.s1[i] = o.s1 ?? 3; this.a0[i] = o.a ?? 0.25;
    this.drag[i] = o.drag ?? 0.6; this.grav[i] = o.grav ?? 0; this.seed[i] = Math.random() * 10;
    const c = o.tint ?? [1, 1, 1]; this.tint.set(c, i * 3);
  }
  update(dt) {
    this.t += dt;
    for (let i = 0; i < this.max; i++) {
      if (this.age[i] >= this.life[i]) { this.alpha[i] = 0; continue; }
      this.age[i] += dt;
      const k = clamp(this.age[i] / this.life[i], 0, 1), d = Math.exp(-this.drag[i] * dt), sd = this.seed[i];
      const vx = this.vel[i * 3] * d + Math.sin(this.t * 1.7 + sd) * 0.35 * dt * (1 - k), vz = this.vel[i * 3 + 2] * d + Math.cos(this.t * 1.3 + sd * 1.7) * 0.3 * dt * (1 - k);
      const vy = this.vel[i * 3 + 1] * d - this.grav[i] * dt;
      this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
      this.pos[i * 3] += vx * dt; this.pos[i * 3 + 1] += vy * dt; this.pos[i * 3 + 2] += vz * dt;
      this.size[i] = lerp(this.s0[i], this.s1[i], Math.sqrt(k));
      this.alpha[i] = this.a0[i] * sstep(0, 0.12, k) * (1 - sstep(0.35, 1, k));
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.aSize.needsUpdate = true; this.geo.attributes.aAlpha.needsUpdate = true; this.geo.attributes.aTint.needsUpdate = true;
  }
  reset() { this.age.fill(1e9); this.alpha.fill(0); this.geo.attributes.aAlpha.needsUpdate = true; }
}

/* ---------------- gas flame ring ---------------- */
export class Flames {
  constructor(radius = 3.15, count = 18) {
    this.group = new THREE.Group();
    this.mats = [];
    const base = new THREE.ConeGeometry(0.3, 1.5, 10, 1, true); base.translate(0, 0.75, 0);
    for (let i = 0; i < count; i++) {
      const m = flameMaterial(); m.uniforms.uSeed.value = i * 1.37; this.mats.push(m);
      const f = new THREE.Mesh(base, m);
      const a = (i / count) * Math.PI * 2;
      f.position.set(Math.cos(a) * radius, 0, Math.sin(a) * radius);
      f.rotation.set(Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2);
      f.renderOrder = 6; f.frustumCulled = false;
      this.group.add(f);
    }
    this.power = 0;
  }
  setPower(p) { this.power = p; this.group.visible = p > 0.01; for (const m of this.mats) m.uniforms.uPower.value = p; }
  update(t) { for (const m of this.mats) m.uniforms.uTime.value = t; }
}

/* ---------------- tea leaves + cardamom ---------------- */
export class Grains {
  constructor(parent, vessel, nLeaf = 130, nPod = 16, envMap = null) {
    this.vessel = vessel; this.r = rng(5);
    this.nLeaf = nLeaf; this.nPod = nPod; this.n = nLeaf + nPod;
    const leafGeo = new THREE.PlaneGeometry(1, 1, 6, 2);      // a curled strip, like a rolled tea leaf
    { const lp = leafGeo.attributes.position; for (let i = 0; i < lp.count; i++) { const x = lp.getX(i), y = lp.getY(i); lp.setZ(i, 0.28 * Math.cos(x * Math.PI) * (0.4 + y) + 0.12 * Math.sin(y * 9)); } leafGeo.computeVertexNormals(); }
    const podGeo = new THREE.SphereGeometry(0.5, 12, 9);
    const pp = podGeo.attributes.position;
    for (let i = 0; i < pp.count; i++) {      // ridged, pointed pod
      const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i);
      const a = Math.atan2(z, y), ridge = 1 + 0.07 * Math.cos(a * 3), taper = 1 - 0.35 * Math.pow(Math.abs(x) * 2, 3);
      pp.setXYZ(i, x * 2.5, y * ridge * taper, z * ridge * taper);
    }
    podGeo.computeVertexNormals();
    // black tea and green cardamom: the colour lives in the material, so it can never come out white
    const lm = new THREE.MeshStandardMaterial({ color: 0x0e0b09, roughness: 0.8, metalness: 0, envMap, envMapIntensity: 0.12, side: THREE.DoubleSide });
    const pm = new THREE.MeshStandardMaterial({ color: 0x2a6618, roughness: 0.62, metalness: 0, envMap, envMapIntensity: 0.14 });
    this.leaves = new THREE.InstancedMesh(leafGeo, lm, nLeaf);
    this.pods = new THREE.InstancedMesh(podGeo, pm, nPod);
    for (const m of [this.leaves, this.pods]) { m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.renderOrder = 2; parent.add(m); }
    const r = this.r;
    this.st = new Float32Array(this.n);                // 0 idle, 1 falling, 2 resting
    this.p = new Float32Array(this.n * 3); this.v = new Float32Array(this.n * 3);
    this.rest = new Float32Array(this.n * 3);
    this.rot = new Float32Array(this.n * 3); this.spin = new Float32Array(this.n * 3);
    this.sc = new Float32Array(this.n * 3); this.ph = new Float32Array(this.n); this.sp = new Float32Array(this.n);
    const c = new THREE.Color();
    for (let i = 0; i < this.n; i++) {
      const leaf = i < nLeaf;
      if (leaf) { this.sc.set([0.9 + r() * 1.0, 0.34 + r() * 0.28, 1], i * 3); }
      else { const s = 1.15 + r() * 0.4; this.sc.set([s * 1.0, s * 0.9, s * 0.9], i * 3); }
      this.rot.set([r() * 6.28, r() * 6.28, r() * 6.28], i * 3);
      this.spin.set([(r() - 0.5) * 9, (r() - 0.5) * 9, (r() - 0.5) * 9], i * 3);
      this.ph[i] = r() * 6.28; this.sp[i] = 0.6 + r() * 1.3;
      if (leaf) { const k = 1.4 + r() * 3.6; c.setRGB(k, k * 0.82, k * 0.64); this.leaves.setColorAt(i, c); }
      else { const k = 0.8 + r() * 0.6; c.setRGB(k * 0.95, k, k * 0.9); this.pods.setColorAt(i, c); }
    }
    this.nextLeaf = 0; this.nextPod = 0;
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler(); this._s = new THREE.Vector3(); this._v = new THREE.Vector3();
    this.clear();
  }
  clear() {
    this.st.fill(0); this.nextLeaf = 0; this.nextPod = 0;
    this.show();
  }
  /** Drop one grain from a point (pot-local); pods go in ~1 of 9. */
  emit(from, pod) {
    let i;
    if (pod) { if (this.nextPod >= this.nPod) return; i = this.nLeaf + this.nextPod++; }
    else { if (this.nextLeaf >= this.nLeaf) return; i = this.nextLeaf++; }
    const r = this.r;
    this.p.set([from.x + (r() - 0.5) * 5.2, from.y + r() * 0.8, from.z + (r() - 0.5) * 3.4], i * 3);
    this.v.set([(r() - 0.5) * 11, -6 - r() * 6, (r() - 0.5) * 8], i * 3);
    this.st[i] = 1;
  }
  update(dt, t, agit, levelLocal, flow) {
    const V = this.vessel;
    for (let i = 0; i < this.n; i++) {
      const s = this.st[i];
      if (s === 0) continue;
      const pod = i >= this.nLeaf, k = i * 3;
      this.rot[k] += this.spin[k] * dt * (s === 1 ? 1 : 0.15 * (0.3 + agit)); this.rot[k + 1] += this.spin[k + 1] * dt * (s === 1 ? 1 : 0.15 * (0.3 + agit)); this.rot[k + 2] += this.spin[k + 2] * dt * (s === 1 ? 1 : 0.15 * (0.3 + agit));
      if (s === 1) {
        this.v[k + 1] -= 520 * dt; const d = Math.exp(-0.9 * dt); this.v[k] *= d; this.v[k + 2] *= d;
        this.p[k] += this.v[k] * dt; this.p[k + 1] += this.v[k + 1] * dt; this.p[k + 2] += this.v[k + 2] * dt;
        const y = this.p[k + 1];
        const rr = Math.hypot(this.p[k], this.p[k + 2]), lim = V.R(Math.max(y, V.yMin)) - 0.45;
        if (y < V.yMax - 0.5 && rr > lim) { const f = lim / rr; this.p[k] *= f; this.p[k + 2] *= f; this.v[k] *= -0.3; this.v[k + 2] *= -0.3; }
        const hy = V.yMin + 0.38 + (pod ? 0.35 : 0) + Math.max(0, 1 - rr / 7.4) * 1.25 + this.ph[i] * 0.06;
        if (y <= hy) { this.p[k + 1] = hy; this.st[i] = 2; this.rest[k] = this.p[k]; this.rest[k + 1] = hy; this.rest[k + 2] = this.p[k + 2]; }
      } else {
        // resting: water lifts and swirls the grains as it heats (agit 0..1), pods float up
        const a = this.rest[k], b = this.rest[k + 2], rad = Math.hypot(a, b), ang0 = Math.atan2(b, a);
        const w = agit * (0.5 + 0.7 * (1 - rad / 8)) * this.sp[i] * 0.9;
        const ang = ang0 + t * w * 0.35 * (flow ?? 1);
        let y = this.rest[k + 1];
        const wet = levelLocal > y + 0.3;
        if (wet) y += agit * (0.8 + Math.sin(t * this.sp[i] * 2.4 + this.ph[i]) * 0.8 + (pod ? 3.6 : 1.9) * Math.sin(t * 0.7 * this.sp[i] + this.ph[i]) * 0.5 * agit);
        if (pod && wet) y = lerp(y, levelLocal - 0.45, clamp(agit * 1.05, 0, 0.92));
        y = Math.min(y, levelLocal - 0.35);
        y = Math.max(y, this.rest[k + 1]);
        const lim = V.R(Math.max(y, V.yMin)) - 0.5;
        const rr = Math.min(rad * (1 + agit * 0.35 * Math.sin(t * this.sp[i] + this.ph[i])), lim);
        this.p[k] = Math.cos(ang) * rr; this.p[k + 1] = y; this.p[k + 2] = Math.sin(ang) * rr;
      }
    }
    this.show();
  }
  show() {
    for (let i = 0; i < this.n; i++) {
      const pod = i >= this.nLeaf, k = i * 3, vis = this.st[i] !== 0;
      this._s.set(vis ? this.sc[k] : 0, vis ? this.sc[k + 1] : 0, vis ? this.sc[k + 2] : 0);
      this._e.set(this.rot[k], this.rot[k + 1], this.rot[k + 2]); this._q.setFromEuler(this._e);
      this._v.set(this.p[k], this.p[k + 1], this.p[k + 2]);
      this._m.compose(this._v, this._q, this._s);
      (pod ? this.pods : this.leaves).setMatrixAt(pod ? i - this.nLeaf : i, this._m);
    }
    this.leaves.instanceMatrix.needsUpdate = true; this.pods.instanceMatrix.needsUpdate = true;
    if (this.leaves.instanceColor) this.leaves.instanceColor.needsUpdate = true;
    if (this.pods.instanceColor) this.pods.instanceColor.needsUpdate = true;
  }
}

/* ---------------- bubbles in the boiling water ---------------- */
export class Bubbles {
  constructor(parent, vessel, n = 70) {
    this.vessel = vessel; this.n = n; this.r = rng(9);
    this.mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff1d8, transparent: true, opacity: 0.38, depthWrite: false }), n);
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 4.5; this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    parent.add(this.mesh);
    this.y = new Float32Array(n); this.a = new Float32Array(n); this.rr = new Float32Array(n); this.s = new Float32Array(n); this.sp = new Float32Array(n);
    for (let i = 0; i < n; i++) this.respawn(i, true);
    this._m = new THREE.Matrix4(); this._p = new THREE.Vector3(); this._q = new THREE.Quaternion(); this._s = new THREE.Vector3();
  }
  respawn(i, any) {
    const r = this.r;
    this.y[i] = this.vessel.yMin + 0.3 + (any ? r() * 9 : 0); this.a[i] = r() * 6.28; this.rr[i] = Math.sqrt(r()) * 0.88;
    this.s[i] = 0.1 + r() * 0.2; this.sp[i] = 3 + r() * 5;
  }
  update(dt, boil, levelLocal) {
    const m = this._m; const act = Math.floor(this.n * boil);
    for (let i = 0; i < this.n; i++) {
      if (i >= act) { m.makeScale(0, 0, 0); this.mesh.setMatrixAt(i, m); continue; }
      this.y[i] += this.sp[i] * dt * (0.6 + boil);
      if (this.y[i] > levelLocal - 0.1) this.respawn(i, false);
      const R = this.vessel.R(this.y[i]) * this.rr[i];
      const s = this.s[i] * (0.8 + boil * 0.6);
      m.compose(this._p.set(Math.cos(this.a[i]) * R, this.y[i], Math.sin(this.a[i]) * R), this._q, this._s.set(s, s, s));
      this.mesh.setMatrixAt(i, m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

/* ---------------- a falling stream (water / tea) ---------------- */
export class Stream {
  constructor(material, seg = 30, radial = 10) {
    this.seg = seg; this.radial = radial;
    const g = new THREE.BufferGeometry();
    const n = (seg + 1) * (radial + 1);
    this.pos = new Float32Array(n * 3); this.nor = new Float32Array(n * 3); this.uv = new Float32Array(n * 2);
    for (let i = 0; i <= seg; i++) for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j, a = (j / radial) * Math.PI * 2;
      this.nor[k * 3] = Math.cos(a); this.nor[k * 3 + 2] = Math.sin(a);
      this.uv[k * 2] = j / radial; this.uv[k * 2 + 1] = i / seg;
    }
    const idx = [];
    for (let i = 0; i < seg; i++) for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j, b = a + 1, c = a + radial + 1, d = c + 1; idx.push(a, c, b, b, c, d);
    }
    g.setIndex(idx);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(this.nor, 3)); g.setAttribute('uv', new THREE.BufferAttribute(this.uv, 2));
    this.mesh = new THREE.Mesh(g, material); this.mesh.frustumCulled = false; this.mesh.renderOrder = 7; this.mesh.visible = false;
    this.geo = g;
  }
  /** pts: array of Vector3 (seg+1 of them); r0/r1: radius at the top/bottom. */
  set(pts, r0, r1) {
    for (let i = 0; i <= this.seg; i++) {
      const p = pts[i], t = i / this.seg, rad = lerp(r0, r1, t) * (1 + 0.12 * Math.sin(t * 20));
      for (let j = 0; j <= this.radial; j++) {
        const k = (i * (this.radial + 1) + j) * 3;
        this.pos[k] = p.x + this.nor[k] * rad; this.pos[k + 1] = p.y; this.pos[k + 2] = p.z + this.nor[k + 2] * rad;
      }
    }
    this.geo.attributes.position.needsUpdate = true;
  }
}
