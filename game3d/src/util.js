// Small helpers: maths, easing, seeded random, and a tiny tween runner.
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeIn = (t) => t * t * t;
export const easeSine = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);
export const linear = (t) => t;
export const easeBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

export function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

/** Runs timed callbacks from the render loop; every run() returns a promise so a step reads top to bottom. */
export class Tweens {
  constructor() { this.list = []; }
  run(dur, fn, ease = easeIO) {
    return new Promise((res) => {
      const a = { t: 0, dur: Math.max(dur, 1e-4), fn, ease, res };
      this.list.push(a);
      fn(ease(0));
    });
  }
  wait(sec) { return this.run(sec, () => {}, linear); }
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const a = this.list[i];
      a.t += dt;
      const k = Math.min(1, a.t / a.dur);
      a.fn(a.ease(k));
      if (k >= 1) { this.list.splice(i, 1); a.res(); }
    }
  }
  clear() { this.list.length = 0; }
}
