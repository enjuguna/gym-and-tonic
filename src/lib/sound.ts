// Procedural ambience + UI sounds via Web Audio — zero audio assets.
// Rain: filtered noise loop. Stings: short oscillator envelopes.

class SoundEngine {
  private ctx: AudioContext | null = null;
  private rainGain: GainNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;
  enabled = false;

  private ensure(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private makeNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      // brown-ish noise: smoother than white, reads as rain
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    return buf;
  }

  startRain() {
    const ctx = this.ensure();
    if (this.rainSource) return;
    const src = ctx.createBufferSource();
    src.buffer = this.makeNoiseBuffer(ctx);
    src.loop = true;
    // lowpass shapes noise into rainfall
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 2);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
    this.rainSource = src;
    this.rainGain = gain;
  }

  stopRain() {
    if (!this.rainGain || !this.rainSource || !this.ctx) return;
    const g = this.rainGain;
    g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.6);
    const src = this.rainSource;
    setTimeout(() => { try { src.stop(); } catch { /* stopped */ } }, 800);
    this.rainSource = null;
    this.rainGain = null;
  }

  /** soft paper/click tick for pins and approvals */
  tick(freq = 660) {
    if (!this.enabled && !this.ctx) return;
    try {
      const ctx = this.ensure();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch { /* audio unavailable */ }
  }

  /** two-note case-closed sting */
  sting(win: boolean) {
    if (!this.enabled && !this.ctx) return;
    try {
      const ctx = this.ensure();
      const notes = win ? [392, 587.33] : [330, 262]; // G4→D5 resolve, or fall
      notes.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = f;
        const t0 = ctx.currentTime + i * 0.22;
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.linearRampToValueAtTime(0.14, t0 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.7);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.75);
      });
    } catch { /* audio unavailable */ }
  }

  /** A short opt-in workout cue. It never starts the ambient rain loop. */
  alert() {
    try {
      const ctx = this.ensure();
      [523.25, 659.25].forEach((frequency, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const at = ctx.currentTime + index * 0.12;
        osc.type = "sine";
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.linearRampToValueAtTime(0.09, at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
        osc.connect(gain).connect(ctx.destination);
        osc.start(at);
        osc.stop(at + 0.32);
      });
    } catch { /* audio unavailable */ }
  }

  toggle(on: boolean) {
    this.enabled = on;
    if (on) this.startRain();
    else this.stopRain();
  }
}

export const sound = new SoundEngine();
