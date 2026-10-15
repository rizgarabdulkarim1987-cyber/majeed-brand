// The tea game: a real WebGL scene. Five steps: leaves + cardamom in, water from the tap, onto the cooker, boil, pour into the glass.
import * as THREE from 'three';
import { clamp, lerp, sstep, easeIO, easeOut, easeSine, linear, rng, Tweens } from './util.js';
import { makeEnvCanvas, makeWallCanvas, makeWoodCanvas, makeBlobCanvas, makeSpriteCanvas, canvasTexture } from './textures.js';
import { makeShared, streamMaterial } from './materials.js';
import { buildPot, buildCup, buildPouch, buildStove, buildTap, buildLamp, buildRoom, makeMaterials, makeGlassMaterials, labelMaterial } from './models.js';
import { Puffs, Flames, Grains, Bubbles, Stream } from './fx.js';
import { Sfx } from './audio.js';

const V3 = THREE.Vector3;
const FOV = 34;
const POT_FILL = 0.62;        // share of the pot that holds water
const CUP_FILL = 0.9;         // how full the glass gets
const G_STREAM = 760;         // gravity used for the visible stream (cm/s^2)

const WARE = 1.22;           // teapot, glass and saucer are built life-size and shown a little larger
const POS = {
  potRest: new V3(-28, 0, 4),
  potTap: new V3(-19, 0, -8.5),
  stove: new V3(19, 0, -8),
  glass: new V3(41.5, 0, 8),
  shelfTop: new V3(-41, 29.5, -15),
  lidPark: new V3(-37, 0, 17),
  tap: new V3(-1, 0, -14),
  lamp: new V3(8, 44, -12),
};

export class TeaGame {
  constructor(els, imgs, onUpdate, motion) {
    this.els = els; this.stage = els.stage; this.canvas = els.canvas; this.onUpdate = onUpdate || (() => {});
    this.motion = motion !== false; this.imgs = imgs || {};
    this.state = { done: 0, busy: false, phase: 'idle', temp: 26 };
    this.visible = true; this.manual = false; this.running = false; this.time = 0; this.raf = 0;
    this.ptr = { x: 0, y: 0, sx: 0, sy: 0 };
    this.tw = new Tweens(); this.loops = []; this.sfx = new Sfx();
    this.rand = rng(3);
    this.sim = { potVol: 0, cupVol: 0, brew: 0, boil: 0, agit: 0, flame: 0, tap: 0, steamPot: 0, steamCup: 0, flow: 0 };
    this.initRenderer();
    this.initScene();
    this.resize();
    this.reset(true);
  }

  /* ---------------- setup ---------------- */
  initRenderer() {
    const r = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
    r.setClearColor(0x13291b, 1);
    this.renderer = r;
    this.frameTex = null;
  }

  loadTex(src, srgb = true) {
    const t = new THREE.Texture();
    if (!src) return t;
    const img = new Image();
    img.onload = () => { t.image = img; t.needsUpdate = true; this.dirty = true; };
    img.src = src;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }

  initScene() {
    const r = this.renderer;
    const scene = (this.scene = new THREE.Scene());
    this.camera = new THREE.PerspectiveCamera(FOV, 1.5, 5, 700);
    this.shared = makeShared();

    // environment: PMREM for steel/standard materials, a sharp cube for glass and liquid
    const envTex = new THREE.CanvasTexture(makeEnvCanvas());
    envTex.mapping = THREE.EquirectangularReflectionMapping; envTex.colorSpace = THREE.SRGBColorSpace;
    const pm = new THREE.PMREMGenerator(r);
    this.envMap = pm.fromEquirectangular(envTex).texture;
    scene.environment = this.envMap; scene.environmentIntensity = 0.9;
    const cubeRT = new THREE.WebGLCubeRenderTarget(512, { generateMipmaps: false, minFilter: THREE.LinearFilter });
    cubeRT.fromEquirectangularTexture(r, envTex);
    this.shared.tEnv.value = cubeRT.texture;
    pm.dispose();

    const ctx = (this.ctx = {
      shared: this.shared, envMap: this.envMap,
      mats: makeMaterials(this.envMap),
      wallTex: canvasTexture(makeWallCanvas()), woodTex: canvasTexture(makeWoodCanvas()),
      pouchTex: this.loadTex(this.imgs.pouch), logoTex: this.loadTex(this.imgs.logo),
    });
    Object.assign(ctx, makeGlassMaterials(this.shared, cubeRT.texture));
    ctx.labelMat = labelMaterial(ctx.logoTex, this.envMap); ctx.labelMat.alphaTest = 0.35;
    const sprite = canvasTexture(makeSpriteCanvas(), false);
    const blobTex = canvasTexture(makeBlobCanvas(), false);

    // lights
    const hemi = new THREE.HemisphereLight(0xd6efe0, 0x80552c, 0.9);
    const key = new THREE.DirectionalLight(0xfff1de, 2.4); key.position.set(-70, 90, 110);
    const lampLight = new THREE.PointLight(0xffd8a0, 2600, 0, 2); lampLight.position.copy(POS.lamp).add(new V3(0, -3, 12));
    const flameLight = new THREE.PointLight(0xff8a3a, 0, 0, 2); flameLight.position.set(POS.stove.x, 12.5, POS.stove.z + 2);
    for (const l of [hemi, key, lampLight, flameLight]) { l.layers.enableAll(); scene.add(l); }
    this.flameLight = flameLight; this.lampLight = lampLight;

    // room
    this.room = buildRoom(ctx); scene.add(this.room.group);
    const lamp = buildLamp(ctx); lamp.group.position.copy(POS.lamp); scene.add(lamp.group);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprite, color: 0xffd490, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.set(34, 34, 1); glow.position.copy(POS.lamp).add(new V3(0, -1.5, 0.5)); scene.add(glow);

    // stove, tap, pouch
    this.stove = buildStove(ctx); this.stove.group.position.copy(POS.stove); scene.add(this.stove.group);
    this.flames = new Flames(3.15, 18); this.flames.group.position.set(POS.stove.x, 9.15, POS.stove.z); scene.add(this.flames.group);
    this.flameGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprite, color: 0x6aa8ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.flameGlow.scale.set(13, 7, 1); this.flameGlow.position.set(POS.stove.x, 9.6, POS.stove.z + 1); scene.add(this.flameGlow);
    this.tap = buildTap(ctx); this.tap.group.position.copy(POS.tap); scene.add(this.tap.group);
    this.pouch = buildPouch(ctx); scene.add(this.pouch.group);

    // teapot (with its steel lid), glass and saucer
    this.pot = buildPot(ctx); scene.add(this.pot.group);
    this.pot.group.scale.setScalar(WARE);
    this.cup = buildCup(ctx); this.cup.saucer.position.copy(POS.glass); this.cup.saucer.scale.setScalar(WARE); scene.add(this.cup.saucer);
    this.cup.group.position.set(POS.glass.x, this.cup.baseY * WARE, POS.glass.z); this.cup.group.scale.setScalar(WARE); scene.add(this.cup.group);

    // grains and bubbles live in pot space
    this.grains = new Grains(this.pot.group, this.pot.vessel, 210, 22, this.envMap);
    this.bubbles = new Bubbles(this.pot.group, this.pot.vessel, 70);

    // streams
    this.waterMat = streamMaterial(this.shared, 0xcfe8f0); this.waterMat.uniforms.uAlpha.value = 0.55;
    this.teaMat = streamMaterial(this.shared, 0x45180a);
    this.tapStream = new Stream(this.waterMat); scene.add(this.tapStream.mesh);
    this.potStream = new Stream(this.teaMat); scene.add(this.potStream.mesh);
    this.pts = Array.from({ length: 31 }, () => new V3());

    // steam / splashes
    this.puffs = new Puffs(260, sprite); scene.add(this.puffs.points);
    this.puffAcc = { pot: 0, spout: 0, cup: 0, splash: 0, tapSplash: 0, grain: 0 };

    // contact shadows
    const mkBlob = (w, d, o = 0.9) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, opacity: o }));
      m.rotation.x = -Math.PI / 2; m.scale.set(w, d, 1); m.renderOrder = 0.5; scene.add(m); return m;
    };
    this.blobs = { pot: mkBlob(25, 20), cup: mkBlob(20, 17), lid: mkBlob(20, 18, 0.8), pouch: mkBlob(16, 9, 0.7), stove: mkBlob(42, 38, 0.8) };
    this.blobs.stove.position.set(POS.stove.x, 0.03, POS.stove.z + 1);
    this.blobs.cup.position.set(POS.glass.x + 1, 0.03, POS.glass.z + 0.5);

    this.hintPos = new V3();
  }

  /* ---------------- public API (same shape as the old engine) ---------------- */
  start() { this.running = true; this.last = performance.now(); if (!this.manual) this.loopFrame(); }
  setVisible(v) { this.visible = v; if (v && this.running && !this.raf && !this.manual) { this.last = performance.now(); this.loopFrame(); } }
  setMuted(m) { this.sfx.setMuted(m); }
  setMotion(m) { this.motion = m; }
  pointer(x, y) { this.ptr.x = x; this.ptr.y = y; }
  get busy() { return this.state.busy; }
  resize() {
    const w = Math.max(2, this.stage.clientWidth), h = Math.max(2, this.stage.clientHeight);
    const pr = Math.min(window.devicePixelRatio || 1, w < 700 ? 2 : 1.75) * (this.prScale || 1);
    this.renderer.setPixelRatio(Math.max(0.75, pr)); this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.fitCamera();
    const db = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    if (this.frameTex) this.frameTex.dispose();
    this.frameTex = new THREE.FramebufferTexture(db.x, db.y);
    this.frameTex.minFilter = THREE.LinearFilter; this.frameTex.magFilter = THREE.LinearFilter;
    this.shared.tFrame.value = this.frameTex; this.shared.uRes.value.set(db.x, db.y);
    this.puffs.mat.uniforms.uK.value = db.y / (2 * Math.tan((FOV * Math.PI) / 360));
    this.dirty = true;
    if (this.manual) this.render();
  }
  fitCamera() {
    const asp = this.camera.aspect, half = asp < 1.2 ? 41 : 61;     // narrow screens zoom in and follow the action
    const dist = Math.max(112, half / (Math.tan((FOV * Math.PI) / 360) * asp));
    this.camBase = new V3(2, 25 + (dist - 118) * 0.2, dist);
    this.camTarget = new V3(2, 12.5 + (dist - 118) * 0.1, 0);
    this.camera.position.copy(this.camBase); this.camera.lookAt(this.camTarget);
    this.camera.updateProjectionMatrix();
  }

  /* ---------------- the five steps ---------------- */
  run(n) {
    if (this.state.busy || n !== this.state.done + 1 || n > 5) return Promise.resolve();
    this.state.busy = true; this.sfx.ensure(); this.emit();
    const fn = [null, this.step1, this.step2, this.step3, this.step4, this.step5][n];
    return fn.call(this).then(() => { this.state.busy = false; this.state.done = n; this.emit(); }).catch(() => { this.state.busy = false; this.emit(); });
  }

  phase(p) { this.state.phase = p; this.emit(); }
  emit() { this.onUpdate({ ...this.state, temp: Math.round(this.state.temp) }); }

  arc(obj, a, b, lift, dur, ease = easeIO, tiltAmt = 0) {
    return this.tw.run(dur, (k) => {
      obj.position.lerpVectors(a, b, k); obj.position.y += Math.sin(Math.PI * k) * lift;
      if (tiltAmt) obj.rotation.z = Math.sin(Math.PI * k) * tiltAmt;
    }, ease);
  }
  loop(fn) { return new Promise((res) => { this.loops.push({ fn, res }); }); }

  async step1() {
    const { pot, pouch } = this, lid = pot.lid;
    this.phase('leaves');
    // lid lifts off and rests on the counter
    pot.group.updateMatrixWorld(true); this.scene.attach(lid);
    const lid0 = lid.position.clone(), park = new V3(POS.lidPark.x, -12.2 * WARE, POS.lidPark.z);
    this.sfx.click();
    await this.arc(lid, lid0, park, 9, 1.0, easeIO, 0.35); lid.rotation.z = 0;
    // pouch comes down from the shelf and tilts over the open pot
    const g = pouch.group, mouthTarget = new V3(pot.group.position.x - 0.6, pot.group.position.y + 12.3 * WARE + 5, pot.group.position.z);
    const rotEnd = -1.95;
    const endPos = new V3(); { const m = new THREE.Matrix4().makeRotationZ(rotEnd); const mp = pouch.mouthLocal.clone().applyMatrix4(m); endPos.copy(mouthTarget).sub(mp); }
    const sh = POS.shelfTop.clone();
    await this.tw.run(1.3, (k) => { g.position.lerpVectors(sh, endPos, k); g.position.y += Math.sin(Math.PI * k) * 6; g.rotation.z = rotEnd * sstep(0.15, 1, k); }, easeIO);
    // pour the grains
    const dur = 2.8; let t0 = 0; let emitted = 0; const total = 232;
    await this.tw.run(dur, (k) => {
      g.rotation.z = rotEnd + Math.sin(k * dur * 13) * 0.045 - 0.12 * Math.sin(Math.PI * k);
      const want = Math.floor(sstep(0, 0.97, k) * total);
      while (emitted < want) {
        emitted++;
        const loc = pouch.mouthLocal.clone(); loc.x += (this.rand() - 0.5) * 6.5; loc.z += (this.rand() - 0.5) * 1.6;
        const w = g.localToWorld(loc); pot.group.updateMatrixWorld(true); const l = pot.group.worldToLocal(w);
        this.grains.emit(l, emitted % 10 === 0);
      }
      t0 = k;
    }, linear);
    void t0;
    await this.tw.wait(0.5);
    // pouch goes back to the shelf
    const cur = g.position.clone(), rz = g.rotation.z;
    await this.tw.run(1.2, (k) => { g.position.lerpVectors(cur, sh, k); g.position.y += Math.sin(Math.PI * k) * 5; g.rotation.z = lerp(rz, 0, sstep(0, 0.8, k)); }, easeIO);
    g.position.copy(sh); g.rotation.set(0, 0, 0);
    this.phase('leaves-done');
  }

  async step2() {
    const { pot } = this, tapG = this.tap;
    this.phase('water');
    // pot slides under the tap
    const a = POS.potRest.clone(), b = POS.potTap.clone();
    await this.tw.run(1.0, (k) => { pot.group.position.lerpVectors(a, b, k); pot.group.position.y = Math.sin(Math.PI * k) * 2.2; }, easeIO);
    pot.group.position.copy(b);
    // open the tap
    this.sfx.click();
    await this.tw.run(0.35, (k) => { tapG.lever.rotation.z = lerp(0, 0.55, k); this.sim.tap = k; }, easeOut);
    const loop = this.sfx.loop('water', 1);
    const target = pot.vessel.total * POT_FILL;
    await this.tw.run(3.4, (k) => { this.sim.potVol = target * k; this.sim.tap = 1; this.sim.flow = 1; }, linear);
    loop.stop();
    await this.tw.run(0.35, (k) => { tapG.lever.rotation.z = lerp(0.55, 0, k); this.sim.tap = 1 - k; }, easeOut);
    this.sim.tap = 0; this.sim.flow = 0;
    await this.tw.wait(0.5);
    this.phase('water-done');
  }

  async step3() {
    const { pot } = this, lid = pot.lid;
    this.phase('cooker');
    // lid goes back on
    const l0 = lid.position.clone(), seat = pot.group.position.clone();
    await this.tw.run(1.1, (k) => { lid.position.lerpVectors(l0, seat, k); lid.position.y += Math.sin(Math.PI * k) * 8; lid.rotation.z = Math.sin(Math.PI * k) * 0.35; }, easeIO);
    await this.tw.run(0.18, (k) => { lid.position.y = seat.y + (1 - k) * 0.5; }, linear);
    this.sfx.click();
    pot.group.add(lid); lid.scale.set(1, 1, 1); lid.position.set(0, 0, 0); lid.rotation.set(0, 0, 0);
    // pot goes to the cooker
    const p0 = pot.group.position.clone(), p1 = new V3(POS.stove.x, this.stove.potSeatY - 0.2, POS.stove.z);
    this.sfx.whoosh();
    await this.tw.run(2.0, (k) => {
      pot.group.position.lerpVectors(p0, p1, easeIO(k)); pot.group.position.y += Math.sin(Math.PI * k) * 11;
      pot.group.rotation.z = Math.sin(Math.PI * k * 2) * 0.03;
    }, linear);
    pot.group.rotation.z = 0; pot.group.position.copy(p1);
    await this.tw.run(0.3, (k) => { pot.group.position.y = p1.y + 0.25 * (1 - k) * Math.sin(k * 9) * 0.3; }, linear);
    this.phase('cooker-done');
  }

  async step4() {
    const { pot } = this, knob = this.stove.knob;
    this.phase('boil');
    this.sfx.click();
    await this.tw.run(0.5, (k) => { knob.rotation.z = lerp(0, -1.3, k); }, easeOut);
    // ignite
    await this.tw.run(0.8, (k) => { this.sim.flame = k; }, easeOut);
    const loop = this.sfx.loop('boil', 1);
    const dur = 7.2;
    await this.tw.run(dur, (k) => {
      this.state.temp = lerp(26, 100, easeIO(k) * 0.75 + k * 0.25);
      this.sim.brew = sstep(0.08, 0.95, k);
      this.sim.agit = sstep(0.05, 0.85, k);
      this.sim.boil = sstep(0.55, 0.9, k);
      this.sim.steamPot = sstep(0.25, 0.9, k);
      this.emit();
    }, linear);
    this.state.temp = 100;
    loop.set(0.7);
    this.boilLoop = loop;
    await this.tw.wait(0.8);
    this.phase('boil-done');
  }

  async step5() {
    const { pot, cup } = this, g = pot.group, stoveP = g.position.clone();
    this.phase('pour');
    this.sfx.click();
    // flame off
    this.tw.run(0.5, (k) => { this.stove.knob.rotation.z = lerp(-1.3, 0, k); }, easeOut);
    this.tw.run(0.7, (k) => { this.sim.flame = 1 - k; }, easeOut);
    if (this.boilLoop) { this.boilLoop.stop(); this.boilLoop = null; }
    this.sfx.whoosh();
    // lift off the cooker and carry it to the glass
    const cupTop = 18;                            // height the spout is held at
    const pose = (theta, travel) => {
      const lip = pot.lipLocal.clone().multiplyScalar(WARE).applyEuler(new THREE.Euler(0, 0, -theta));
      return new V3(POS.glass.x - travel - lip.x, cupTop - lip.y, POS.glass.z);
    };
    const travel = 2.6; let theta = 0;
    const p0 = stoveP.clone(), p1 = pose(0.0, travel);
    await this.tw.run(1.7, (k) => {
      g.position.lerpVectors(p0, p1, easeIO(k)); g.position.y += Math.sin(Math.PI * k) * 5;
      g.rotation.z = -0.02 * Math.sin(Math.PI * k);
    }, linear);
    this.stove.group.updateMatrixWorld(true);
    // tilt until the water reaches the lip, then hold a gentle pour until the glass is full
    const cupTarget = cup.vessel.total * CUP_FILL;
    let pouring = false, finished = false, hold = 0, sndLoop = null;
    this.travelVal = travel;
    await this.loop((dt) => {
      const exc = this.potExcess;
      if (!finished) {
        if (!pouring) { theta += 0.5 * dt; if (exc > 0.02) pouring = true; }
        else theta += clamp((0.6 - exc) * 1.1, -0.6, 0.6) * dt;
        theta = clamp(theta, 0, 1.5);
        if (this.sim.cupVol >= cupTarget) finished = true;
      } else theta = Math.max(0, theta - 0.9 * dt);
      g.rotation.z = -theta;
      g.position.copy(pose(theta, this.travelVal));
      const Q = this.pourRate;
      if (Q > 0.3 && !sndLoop) sndLoop = this.sfx.loop('pour', 1);
      if (sndLoop && finished && Q < 0.3) { sndLoop.stop(); sndLoop = null; }
      if (finished && Q < 0.05) hold += dt;
      return finished && theta <= 0.001 && hold > 0.3;
    });
    if (sndLoop) sndLoop.stop();
    // bring the pot back to the cooker
    const q0 = g.position.clone();
    await this.tw.run(1.6, (k) => { g.position.lerpVectors(q0, stoveP, easeIO(k)); g.position.y += Math.sin(Math.PI * k) * 5; }, linear);
    g.position.copy(stoveP); g.rotation.z = 0;
    this.sim.agit = 0.15;
    this.sfx.chime();
    this.phase('done');
  }

  /* ---------------- reset ---------------- */
  reset(first) {
    this.tw.clear(); this.loops.length = 0; this.sfx.stopAll(); this.boilLoop = null;
    const { pot, pouch } = this;
    pot.group.add(pot.lid); pot.lid.scale.set(1, 1, 1); pot.lid.position.set(0, 0, 0); pot.lid.rotation.set(0, 0, 0);
    pot.group.position.copy(POS.potRest); pot.group.rotation.set(0, 0, 0);
    pouch.group.position.copy(POS.shelfTop); pouch.group.rotation.set(0, 0, 0);
    this.tap.lever.rotation.z = 0; this.stove.knob.rotation.z = 0;
    this.sim = { potVol: 0, cupVol: 0, brew: 0, boil: 0, agit: 0, flame: 0, tap: 0, steamPot: 0, steamCup: 0, flow: 0 };
    this.grains.clear(); this.puffs.reset();
    this.tapStream.mesh.visible = false; this.potStream.mesh.visible = false;
    this.state = { done: 0, busy: false, phase: 'idle', temp: 26 };
    this.potExcess = -5; this.pourRate = 0;
    this.applyLiquidLook();
    this.stage.style.setProperty('--heat', '0');
    this.emit();
    if (!first) this.dirty = true;
  }

  /* ---------------- per-frame ---------------- */
  applyLiquidLook() {
    const b = this.sim.brew;
    const u = this.pot.liquidUniforms;
    const tea = clamp(b, 0, 1);
    // clear water -> brewed tea
    u.uCore.value.setRGB(lerp(0.26, 0.032, tea), lerp(0.55, 0.008, tea), lerp(0.64, 0.003, tea));
    u.uEdge.value.setRGB(lerp(0.42, 0.34, tea), lerp(0.80, 0.08, tea), lerp(0.90, 0.015, tea));
    u.uSurf.value.setRGB(lerp(0.50, 0.16, tea), lerp(0.75, 0.05, tea), lerp(0.82, 0.012, tea));
    u.uOpacity.value = lerp(0.34, 0.97, sstep(0, 0.6, tea));
    u.uBoil.value = Math.max(this.sim.boil, this.sim.flow * 0.35);
    const c = this.cup.liquidUniforms;
    c.uCore.value.setRGB(0.032, 0.008, 0.003); c.uEdge.value.setRGB(0.36, 0.09, 0.016); c.uSurf.value.setRGB(0.16, 0.05, 0.012);
    c.uOpacity.value = 0.97; c.uBoil.value = this.cupRipple || 0;
  }

  tick(dt) {
    this.time += dt;
    this.shared.uTime.value = this.time;
    this.tw.update(dt);
    for (let i = this.loops.length - 1; i >= 0; i--) { if (this.loops[i].fn(dt)) { const l = this.loops.splice(i, 1)[0]; l.res(); } }
    this.updateWorld(dt);
  }

  updateWorld(dt) {
    const S = this.sim, pot = this.pot, cup = this.cup, g = pot.group;
    g.updateMatrixWorld(true);

    // pour physics: level of the (possibly tilted) pot, flow over the lip into the glass
    const total = pot.vessel.total;
    const fr = clamp(S.potVol / total, 0, 1);
    const m = g.matrixWorld.elements, N = pot.samples.length / 3;
    let level = -1000;
    if (fr > 0.0008) {
      if (!this._ys || this._ys.length !== N) this._ys = new Float32Array(N);
      const ys = this._ys, s = pot.samples;
      for (let i = 0; i < N; i++) ys[i] = m[1] * s[i * 3] + m[5] * s[i * 3 + 1] + m[9] * s[i * 3 + 2] + m[13];
      ys.sort();
      level = ys[Math.min(N - 1, Math.floor(fr * N))];
    }
    const lipW = pot.lipLocal.clone().applyMatrix4(g.matrixWorld);
    this.potExcess = fr > 0.0008 ? level - lipW.y : -5;
    let Q = 0;
    if (this.state.phase === 'pour' && this.potExcess > 0) {
      Q = Math.min(48 * Math.pow(this.potExcess, 1.5), 60);
      const dv = Math.min(Q * dt, S.potVol - total * 0.3);
      if (dv > 0) { S.potVol -= dv; S.cupVol += dv; } else Q = 0;
    }
    this.pourRate = Q;
    pot.liquidUniforms.uLevel.value = level;
    this.potLevelWorld = level;

    // glass level
    const cupLocal = cup.vessel.levelFor(S.cupVol);
    this.cupLevelWorld = S.cupVol > 0.01 ? cup.group.position.y + cupLocal * WARE : -1000;
    cup.liquidUniforms.uLevel.value = this.cupLevelWorld;
    this.cupRipple = lerp(this.cupRipple || 0, Q > 0.5 ? 0.55 : 0, Math.min(1, dt * 4));

    this.applyLiquidLook();

    // stove: flames, light, glow
    this.flames.setPower(S.flame); this.flames.update(this.time);
    this.flameLight.intensity = S.flame * 650 * (0.9 + 0.1 * Math.sin(this.time * 17));
    this.flameGlow.material.opacity = S.flame * 0.55;
    this.stage.style.setProperty('--heat', (S.flame * 0.8).toFixed(3));

    // grains + bubbles in the pot
    const levelLocal = level > -500 ? g.worldToLocal(new V3(0, level, 0)).y : -1000;
    this.grains.update(dt, this.time, S.agit, g.rotation.z === 0 ? levelLocal : -1000, 1);
    this.bubbles.update(dt, S.boil * (this.state.phase === 'pour' ? 0 : 1), levelLocal);

    // lid rattle when boiling hard
    if (S.boil > 0.2 && pot.lid.parent === g && this.state.phase !== 'pour') {
      const a = S.boil; pot.lid.position.y = Math.max(0, Math.sin(this.time * 31) * 0.1 * a); pot.lid.rotation.z = Math.sin(this.time * 27) * 0.012 * a;
    } else if (pot.lid.parent === g) { pot.lid.position.y = 0; pot.lid.rotation.z = 0; }

    // tap stream
    const tapMouth = this.tap.mouthLocal.clone().add(POS.tap);
    if (S.tap > 0.02) {
      const topY = tapMouth.y, endY = (level > -500 ? level : g.position.y + pot.vessel.yMin * WARE + 0.1);
      for (let i = 0; i <= 30; i++) { const t = i / 30; this.pts[i].set(tapMouth.x + Math.sin(t * 9 + this.time * 20) * 0.03, lerp(topY, endY, t), tapMouth.z); }
      this.tapStream.set(this.pts, 0.5 * S.tap, 0.36 * S.tap); this.tapStream.mesh.visible = true;
      this.waterMat.uniforms.uFlow.value = this.time;
      this.puffAcc.tapSplash += dt * 60 * S.tap;
      while (this.puffAcc.tapSplash >= 1) {
        this.puffAcc.tapSplash -= 1;
        this.puffs.emit(new V3(tapMouth.x + (this.rand() - 0.5) * 1.2, endY + 0.1, tapMouth.z + (this.rand() - 0.5) * 1.0), new V3((this.rand() - 0.5) * 9, 8 + this.rand() * 8, (this.rand() - 0.5) * 6), { life: 0.55, s0: 0.5, s1: 1.4, a: 0.35, grav: 60, tint: [0.9, 0.97, 1] });
      }
    } else this.tapStream.mesh.visible = false;

    // pour stream from the lip to the glass
    if (Q > 0.25) {
      const rot = new THREE.Euler(0, 0, g.rotation.z);
      const vx = 6 + Math.min(10, -g.rotation.z * 8) , vy = -4;
      const y0 = lipW.y, endY = this.cupLevelWorld > -500 ? this.cupLevelWorld : cup.group.position.y + cup.vessel.yMin * WARE;
      const Tf = (vy + Math.sqrt(vy * vy + 2 * G_STREAM * Math.max(0.1, y0 - endY))) / G_STREAM;
      for (let i = 0; i <= 30; i++) { const t = (i / 30) * Tf; this.pts[i].set(lipW.x + vx * t, y0 + vy * t - 0.5 * G_STREAM * t * t, lipW.z); }
      const r0 = 0.12 + 0.34 * Math.min(1, Q / 26);
      this.potStream.set(this.pts, r0, r0 * 0.72); this.potStream.mesh.visible = true;
      this.teaMat.uniforms.uFlow.value = this.time; this.teaMat.uniforms.uAlpha.value = 0.55 + 0.35 * Math.min(1, Q / 20);
      this.travelVal = lerp(this.travelVal ?? vx * Tf, vx * Tf, 0.3);
      this.puffAcc.splash += dt * 55 * Math.min(1, Q / 20);
      while (this.puffAcc.splash >= 1) {
        this.puffAcc.splash -= 1;
        this.puffs.emit(new V3(lipW.x + vx * Tf + (this.rand() - 0.5) * 1.0, endY + 0.2, lipW.z + (this.rand() - 0.5) * 0.8), new V3((this.rand() - 0.5) * 5, 5 + this.rand() * 6, (this.rand() - 0.5) * 4), { life: 0.5, s0: 0.35, s1: 0.9, a: 0.3, grav: 60, tint: [1, 0.86, 0.62] });
      }
      void rot;
    } else this.potStream.mesh.visible = false;

    // steam: from lid holes + spout while hot, from the glass when it holds tea
    const hotPot = S.steamPot * (this.state.phase === 'pour' ? 0.55 : 1) * (S.flame > 0.2 || this.state.phase === 'pour' || this.state.done >= 4 ? 1 : 0.35);
    this.puffAcc.pot += dt * 22 * hotPot;
    while (this.puffAcc.pot >= 1) {
      this.puffAcc.pot -= 1;
      const p = new V3(-2.9 + (this.rand() - 0.5) * 1.5, 13.4, 0.5 + (this.rand() - 0.5) * 2.2).applyMatrix4(g.matrixWorld);
      this.puffs.emit(p, new V3((this.rand() - 0.5) * 1.2, 5 + this.rand() * 3, (this.rand() - 0.5) * 1.2), { life: 2.2 + this.rand(), s0: 1.5, s1: 4.6, a: 0.2 * hotPot + 0.05, drag: 0.5 });
    }
    this.puffAcc.spout += dt * 14 * hotPot;
    while (this.puffAcc.spout >= 1) {
      this.puffAcc.spout -= 1;
      this.puffs.emit(lipW.clone().add(new V3((this.rand() - 0.5), 0.4, (this.rand() - 0.5))), new V3(1 + this.rand(), 4 + this.rand() * 2, 0), { life: 1.8, s0: 0.9, s1: 3, a: 0.17 * hotPot + 0.03, drag: 0.5 });
    }
    const cupHot = clamp(S.cupVol / Math.max(1, cup.vessel.total * 0.3), 0, 1);
    this.puffAcc.cup += dt * 12 * cupHot;
    while (this.puffAcc.cup >= 1) {
      this.puffAcc.cup -= 1;
      const top = cup.group.position.y + 10 * WARE;
      this.puffs.emit(new V3(POS.glass.x + (this.rand() - 0.5) * 2.4, top, POS.glass.z + (this.rand() - 0.5) * 2), new V3((this.rand() - 0.5) * 0.8, 4.5 + this.rand() * 2.5, (this.rand() - 0.5) * 0.8), { life: 2.4, s0: 0.9, s1: 3.2, a: 0.17 * cupHot, drag: 0.55 });
    }
    this.puffs.update(dt);

    // shadows
    this.updateShadows();
    // idle sway + pointer parallax
    this.updateCamera(dt);
  }

  updateShadows() {
    const g = this.pot.group, b = this.blobs;
    const onStove = Math.abs(g.position.x - POS.stove.x) < 18 && Math.abs(g.position.z - POS.stove.z) < 13 && g.position.y > 4;
    const surf = onStove ? 8.5 : 0.03, h = Math.max(0, g.position.y - (onStove ? 10.75 : 0));
    b.pot.position.set(g.position.x + h * 0.15, surf + 0.04, g.position.z + h * 0.2 + 0.5);
    const sc = 1 + h * 0.05; b.pot.scale.set(25 * WARE * sc, 20 * WARE * sc, 1); b.pot.material.opacity = 0.9 / (1 + h * 0.1);
    const L = this.pot.lid;
    if (L.parent !== g) { b.lid.visible = true; const h2 = Math.max(0, L.position.y + 12.2 * WARE); b.lid.position.set(L.position.x, 0.04, L.position.z + 0.3); b.lid.material.opacity = 0.8 / (1 + h2 * 0.12); } else b.lid.visible = false;
    b.cup.material.opacity = 0.85;
    const p = this.pouch.group;
    const onShelf = p.position.distanceTo(POS.shelfTop) < 0.5;
    b.pouch.visible = onShelf; b.pouch.position.set(POS.shelfTop.x, POS.shelfTop.y + 0.05, POS.shelfTop.z + 1);
    void p;
  }

  updateCamera(dt) {
    const k = this.motion ? 1 : 0;
    let fx = 2;
    if (this.camera.aspect < 1.2) {
      const ph = this.state.phase;
      fx = ph === 'idle' || ph === 'leaves' || ph === 'leaves-done' ? -20 : ph === 'water' || ph === 'water-done' ? -10 : ph === 'cooker' || ph === 'cooker-done' || ph === 'boil' || ph === 'boil-done' ? 12 : 24;
    }
    this.focusX = this.focusX === undefined ? fx : this.focusX + (fx - this.focusX) * Math.min(1, dt * 2.4);
    this.camBase.x = this.focusX; this.camTarget.x = this.focusX;
    this.ptr.sx += (this.ptr.x * k - this.ptr.sx) * Math.min(1, dt * 4); this.ptr.sy += (this.ptr.y * k - this.ptr.sy) * Math.min(1, dt * 4);
    const sway = this.motion ? Math.sin(this.time * 0.4) : 0;
    this.camera.position.set(this.camBase.x + this.ptr.sx * 3 + sway * 0.6, this.camBase.y - this.ptr.sy * 1.8, this.camBase.z);
    this.camera.lookAt(this.camTarget);
    this.camera.updateMatrixWorld();
    this.positionHint();
  }

  positionHint() {
    const pr = this.els.prompt; if (!pr) return;
    const d = this.state.done, show = !this.state.busy && d < 5 && this.visible;
    let w;
    if (d === 0) w = this.pouch.group.position.clone().add(new V3(0, 8, 0));
    else if (d === 1) w = POS.tap.clone().add(new V3(4.5, 9.5, 2.5));
    else if (d === 2) w = this.pot.group.position.clone().add(new V3(0, 8, 0));
    else if (d === 3) w = POS.stove.clone().add(new V3(0, 4.2, 13.8));
    else w = this.pot.group.position.clone().add(new V3(0, 8, 0));
    w.project(this.camera);
    const x = (w.x * 0.5 + 0.5) * this.stage.clientWidth, y = (-w.y * 0.5 + 0.5) * this.stage.clientHeight;
    pr.style.transform = `translate(${(x - 38).toFixed(1)}px, ${(y - 38).toFixed(1)}px)`;
    pr.dataset.on = show ? 'true' : 'false';
  }

  render() {
    const r = this.renderer;
    r.setRenderTarget(null);
    this.camera.layers.set(0); r.autoClear = true; r.render(this.scene, this.camera);
    r.copyFramebufferToTexture(this.frameTex);
    this.camera.layers.set(1); r.autoClear = false; r.render(this.scene, this.camera);
    r.autoClear = true;
  }

  loopFrame() {
    const f = (now) => {
      this.raf = 0;
      if (!this.running || !this.visible) return;
      const raw = (now - this.last) / 1000, dt = Math.min(0.05, Math.max(0.001, raw)); this.last = now;
      this.tick(dt); this.render();
      // slow device: quietly lower the resolution until it keeps up (never raised again, so it cannot flicker)
      this.ema = this.ema === undefined ? raw : this.ema * 0.94 + raw * 0.06; this.frames = (this.frames || 0) + 1;
      if (this.frames > 45 && this.ema > 0.034 && (this.prScale || 1) > 0.55) { this.prScale = (this.prScale || 1) * 0.82; this.frames = 0; this.ema = 0.02; this.resize(); }
      this.raf = requestAnimationFrame(f);
    };
    this.raf = requestAnimationFrame(f);
  }

  /** Frees the graphics context when the page is swapped out. */
  dispose() {
    this.running = false; this.visible = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.tw.clear(); this.loops.length = 0; this.sfx.stopAll();
    try {
      this.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      if (this.frameTex) this.frameTex.dispose();
      this.renderer.dispose(); this.renderer.forceContextLoss();
    } catch (e) { /* the canvas is already gone */ }
  }

  /** Test helper: advance the simulation without waiting in real time. */
  async advance(sec, step = 1 / 30) { let t = 0; while (t < sec) { this.tick(step); t += step; await Promise.resolve(); } this.render(); }
}
