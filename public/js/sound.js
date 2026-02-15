// === Web Audio API Sound Manager ===
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      this.enabled = false;
    }
  }

  _tone(freq, dur, type = 'sine', vol = 0.3, delay = 0) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t);
    osc.stop(t + dur);
  }

  _noise(dur, vol = 0.1, delay = 0) {
    if (!this.enabled || !this.ctx) return;
    const sr = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, sr * dur, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime + delay;
    src.connect(gain);
    gain.connect(this.ctx.destination);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.start(t);
  }

  throw() {
    this.init();
    this._noise(0.25, 0.12);
    this._tone(200, 0.08, 'triangle', 0.15, 0.15);
    this._tone(280, 0.06, 'triangle', 0.12, 0.2);
    this._tone(240, 0.06, 'triangle', 0.1, 0.25);
    this._tone(320, 0.05, 'triangle', 0.08, 0.3);
  }

  resultNormal() {
    this.init();
    this._tone(523, 0.12, 'sine', 0.2);
    this._tone(659, 0.18, 'sine', 0.25, 0.08);
  }

  resultSpecial() {
    this.init();
    this._tone(523, 0.1, 'sine', 0.25);
    this._tone(659, 0.1, 'sine', 0.25, 0.08);
    this._tone(784, 0.1, 'sine', 0.25, 0.16);
    this._tone(1047, 0.35, 'sine', 0.3, 0.24);
  }

  resultBack() {
    this.init();
    this._tone(350, 0.12, 'sawtooth', 0.1);
    this._tone(250, 0.18, 'sawtooth', 0.08, 0.1);
  }

  move() {
    this.init();
    this._tone(880, 0.06, 'sine', 0.12);
    this._tone(1100, 0.08, 'sine', 0.08, 0.04);
  }

  capture() {
    this.init();
    this._noise(0.12, 0.25);
    this._tone(150, 0.25, 'square', 0.15, 0.05);
    this._tone(523, 0.12, 'sine', 0.2, 0.2);
    this._tone(659, 0.15, 'sine', 0.18, 0.3);
  }

  stack() {
    this.init();
    this._tone(600, 0.08, 'sine', 0.12);
    this._tone(900, 0.12, 'sine', 0.15, 0.06);
  }

  finish() {
    this.init();
    this._tone(784, 0.1, 'sine', 0.2);
    this._tone(988, 0.1, 'sine', 0.2, 0.08);
    this._tone(1175, 0.2, 'sine', 0.25, 0.16);
  }

  win() {
    this.init();
    [523, 587, 659, 784, 880, 1047].forEach((f, i) => {
      this._tone(f, 0.18, 'sine', 0.2, i * 0.1);
    });
    this._tone(1047, 0.6, 'sine', 0.25, 0.6);
  }

  turnChange() {
    this.init();
    this._tone(440, 0.08, 'sine', 0.08);
    this._tone(554, 0.12, 'sine', 0.1, 0.06);
  }

  click() {
    this.init();
    this._tone(700, 0.04, 'sine', 0.08);
  }

  step() {
    this.init();
    this._tone(600 + Math.random() * 200, 0.05, 'sine', 0.1);
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

const sfx = new SoundManager();
