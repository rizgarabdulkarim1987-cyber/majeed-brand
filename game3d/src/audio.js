// Tiny synthesized sound: water, boil, pour, click, chime. No files, nothing downloaded.
export class Sfx {
  constructor() { this.ctx = null; this.muted = false; this.loops = new Set(); this.master = null; this._noise = null; }
  ensure() {
    if (this.muted) return false;
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ctx.destination);
        const len = this.ctx.sampleRate * 2, b = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = b.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this._noise = b;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    } catch (e) { return false; }
  }
  setMuted(m) {
    this.muted = m;
    if (m) this.stopAll();
  }
  stopAll() { for (const l of [...this.loops]) l.stop(); }
  /** kind: 'water' | 'pour' | 'boil' */
  loop(kind, gain = 1) {
    if (!this.ensure()) return { stop() {}, set() {} };
    const c = this.ctx, src = c.createBufferSource(); src.buffer = this._noise; src.loop = true;
    const f = c.createBiquadFilter(), g = c.createGain();
    if (kind === 'boil') { f.type = 'lowpass'; f.frequency.value = 340; g.gain.value = 0; }
    else { f.type = 'bandpass'; f.frequency.value = kind === 'pour' ? 1250 : 2100; f.Q.value = 0.6; g.gain.value = 0; }
    src.connect(f); f.connect(g); g.connect(this.master); src.start();
    const target = (kind === 'boil' ? 0.22 : 0.16) * gain;
    g.gain.linearRampToValueAtTime(target, c.currentTime + 0.25);
    let timer = 0;
    if (kind === 'boil') timer = setInterval(() => { if (this.muted) return; this.blip(); }, 120);
    const h = {
      stop: () => {
        clearInterval(timer);
        try { g.gain.cancelScheduledValues(c.currentTime); g.gain.setValueAtTime(g.gain.value, c.currentTime); g.gain.linearRampToValueAtTime(0, c.currentTime + 0.35); src.stop(c.currentTime + 0.4); } catch (e) { /* already stopped */ }
        this.loops.delete(h);
      },
      set: (v) => { try { g.gain.linearRampToValueAtTime(target * v, c.currentTime + 0.1); } catch (e) { /* ignore */ } },
    };
    this.loops.add(h);
    return h;
  }
  blip() {
    if (!this.ctx || this.muted) return;
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = 'sine'; o.frequency.setValueAtTime(260 + Math.random() * 420, t); o.frequency.exponentialRampToValueAtTime(700 + Math.random() * 500, t + 0.07);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 0.1);
  }
  click() {
    if (!this.ensure()) return;
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = 'square'; o.frequency.setValueAtTime(900, t); o.frequency.exponentialRampToValueAtTime(240, t + 0.05);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 0.08);
  }
  whoosh() {
    if (!this.ensure()) return;
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this._noise;
    const f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime;
    f.type = 'bandpass'; f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(2400, t + 0.5); f.Q.value = 0.8;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.1, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + 0.65);
  }
  chime() {
    if (!this.ensure()) return;
    const c = this.ctx, t = c.currentTime;
    [880, 1320, 1760].forEach((fr, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = fr;
      g.gain.setValueAtTime(0.0001, t + i * 0.09); g.gain.exponentialRampToValueAtTime(0.09 / (i + 1), t + i * 0.09 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 1.2);
      o.connect(g); g.connect(this.master); o.start(t + i * 0.09); o.stop(t + i * 0.09 + 1.3);
    });
  }
}
