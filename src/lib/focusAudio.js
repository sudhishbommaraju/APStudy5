// Focus Sounds engine — real-time audio synthesis via the Web Audio API.
// Everything here is generated on the fly: no files, no streaming, no ads,
// no licensing. Sound runs continuously until stopped.
//
// Categories: classical, electronic, binaural, gamma40, white, pink.
// A single module-level singleton keeps audio playing across route changes.

let ctx = null;
function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
  }
  return ctx;
}

export const TRACKS = [
  { id: 'classical', name: 'Classical', desc: 'Gentle generative piano', tag: 'Calm focus' },
  { id: 'electronic', name: 'Electronic', desc: 'Warm ambient synth', tag: 'Flow state' },
  { id: 'binaural', name: 'Binaural Beats', desc: '10 Hz alpha waves', tag: 'Relaxed focus' },
  { id: 'gamma40', name: '40 Hz Gamma', desc: 'Memory & concentration', tag: 'Deep work' },
  { id: 'white', name: 'White Noise', desc: 'Even, full-spectrum hush', tag: 'Block distractions' },
  { id: 'pink', name: 'Pink Noise', desc: 'Softer, balanced noise', tag: 'Steady & calm' },
];

function noiseBuffer(kind) {
  const c = getCtx();
  const len = c.sampleRate * 3;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  if (kind === 'white') {
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  } else if (kind === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  }
  return buf;
}

// C major pentatonic across a few octaves — guarantees consonant results.
const PENTA = [];
(() => {
  const base = [0, 2, 4, 7, 9]; // semitone offsets
  for (let oct = -1; oct <= 2; oct++) {
    base.forEach((s) => PENTA.push(261.63 * Math.pow(2, oct + s / 12)));
  }
})();

class FocusAudio {
  constructor() {
    this.master = null;
    this.nodes = [];
    this.timer = null;
    this.current = null;
    this.playing = false;
    this.volume = 0.45;
    this.listeners = new Set();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    fn(this.state());
    return () => this.listeners.delete(fn);
  }
  state() {
    return { current: this.current, playing: this.playing, volume: this.volume };
  }
  emit() {
    const s = this.state();
    this.listeners.forEach((fn) => fn(s));
  }

  _master() {
    const c = getCtx();
    if (!this.master) {
      this.master = c.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(c.destination);
    }
    return this.master;
  }

  setVolume(v) {
    this.volume = v;
    if (this.master) this.master.gain.setTargetAtTime(v, getCtx().currentTime, 0.05);
    this.emit();
  }

  _fadeIn(g, to = 0.5, t = 0.6) {
    const now = getCtx().currentTime;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(to, now + t);
  }

  async toggle(type) {
    if (this.current === type && this.playing) {
      this.stop();
      return;
    }
    await this.play(type);
  }

  async play(type) {
    const c = getCtx();
    if (c.state === 'suspended') {
      try {
        await c.resume();
      } catch {
        /* ignore */
      }
    }
    this._stopNodes();
    this._master();
    this.current = type;
    this.playing = true;

    if (type === 'white' || type === 'pink') this._noise(type);
    else if (type === 'binaural') this._binaural(180, 10);
    else if (type === 'gamma40') this._gamma40();
    else if (type === 'classical') this._melody({ wave: 'triangle', beat: 0.62, vol: 0.32, octave: 1 });
    else if (type === 'electronic') this._electronic();

    this.emit();
  }

  _noise(kind) {
    const c = getCtx();
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(kind);
    src.loop = true;
    const g = c.createGain();
    g.gain.value = 0.0001;
    src.connect(g).connect(this._master());
    src.start();
    this._fadeIn(g, kind === 'white' ? 0.4 : 0.5);
    this.nodes.push(src, g);
  }

  _binaural(base, beat) {
    const c = getCtx();
    const merger = c.createChannelMerger(2);
    const g = c.createGain();
    g.gain.value = 0.0001;
    const mk = (freq, ch) => {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq;
      const og = c.createGain();
      og.gain.value = 0.6;
      o.connect(og).connect(merger, 0, ch);
      o.start();
      this.nodes.push(o, og);
    };
    mk(base, 0);
    mk(base + beat, 1);
    merger.connect(g).connect(this._master());
    this._fadeIn(g, 0.4);
    this.nodes.push(merger, g);
  }

  _gamma40() {
    const c = getCtx();
    const carrier = c.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.value = 200;
    const am = c.createGain();
    am.gain.value = 0.5;
    const lfo = c.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 40;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 0.5;
    lfo.connect(lfoGain).connect(am.gain);
    carrier.connect(am);
    const g = c.createGain();
    g.gain.value = 0.0001;
    am.connect(g).connect(this._master());
    carrier.start();
    lfo.start();
    this._fadeIn(g, 0.3);
    this.nodes.push(carrier, lfo, lfoGain, am, g);
  }

  _delaySpace(out, time = 0.34, fb = 0.32) {
    const c = getCtx();
    const delay = c.createDelay();
    delay.delayTime.value = time;
    const feed = c.createGain();
    feed.gain.value = fb;
    delay.connect(feed).connect(delay);
    delay.connect(out);
    this.nodes.push(delay, feed);
    return delay;
  }

  _voice(freq, when, dur, wave, vol, dest, dest2) {
    const c = getCtx();
    const o = c.createOscillator();
    o.type = wave;
    o.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(vol, when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(dest);
    if (dest2) g.connect(dest2);
    o.start(when);
    o.stop(when + dur + 0.05);
  }

  _melody({ wave, beat, vol, octave }) {
    const c = getCtx();
    const g = c.createGain();
    g.gain.value = 0.0001;
    g.connect(this._master());
    this._fadeIn(g, 0.6, 1);
    const space = this._delaySpace(g);
    let next = c.currentTime + 0.15;
    const pool = PENTA.filter((_, i) => i >= 5 * octave && i <= 5 * octave + 12);
    this.timer = setInterval(() => {
      const now = c.currentTime;
      while (next < now + 0.6) {
        const f = pool[Math.floor(Math.random() * pool.length)];
        this._voice(f, next, beat * 1.6, wave, vol, g, space);
        // occasional soft harmony a third up
        if (Math.random() < 0.4) {
          const f2 = pool[Math.min(pool.length - 1, pool.indexOf(f) + 2)] || f;
          this._voice(f2, next + 0.02, beat * 1.4, wave, vol * 0.5, g, space);
        }
        next += beat;
      }
    }, 120);
    this.nodes.push(g);
  }

  _electronic() {
    const c = getCtx();
    const g = c.createGain();
    g.gain.value = 0.0001;
    g.connect(this._master());
    this._fadeIn(g, 0.5, 1);

    // Pad: detuned saws through a slow-moving lowpass.
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 700;
    const cutLfo = c.createOscillator();
    cutLfo.frequency.value = 0.08;
    const cutAmt = c.createGain();
    cutAmt.gain.value = 380;
    cutLfo.connect(cutAmt).connect(lp.frequency);
    cutLfo.start();
    lp.connect(g);
    const padGain = c.createGain();
    padGain.gain.value = 0.12;
    padGain.connect(lp);
    [130.81, 164.81, 196.0].forEach((f) => {
      [0, 0.5].forEach((det) => {
        const o = c.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = f;
        o.detune.value = det * 7;
        o.connect(padGain);
        o.start();
        this.nodes.push(o);
      });
    });

    const space = this._delaySpace(g, 0.28, 0.34);
    const pool = PENTA.filter((_, i) => i >= 10 && i <= 20);
    let next = c.currentTime + 0.15;
    let step = 0;
    this.timer = setInterval(() => {
      const now = c.currentTime;
      while (next < now + 0.6) {
        const f = pool[step % pool.length];
        this._voice(f, next, 0.26, 'square', 0.06, g, space);
        // soft kick on the down-beat
        if (step % 4 === 0) {
          const k = c.createOscillator();
          k.frequency.setValueAtTime(110, next);
          k.frequency.exponentialRampToValueAtTime(40, next + 0.12);
          const kg = c.createGain();
          kg.gain.setValueAtTime(0.5, next);
          kg.gain.exponentialRampToValueAtTime(0.0001, next + 0.18);
          k.connect(kg).connect(g);
          k.start(next);
          k.stop(next + 0.2);
        }
        step++;
        next += 0.3;
      }
    }, 120);

    this.nodes.push(lp, cutLfo, cutAmt, padGain, g);
  }

  _stopNodes() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    const c = getCtx();
    this.nodes.forEach((n) => {
      try {
        if (n.stop) n.stop(c.currentTime + 0.05);
        n.disconnect();
      } catch {
        /* ignore */
      }
    });
    this.nodes = [];
  }

  stop() {
    this._stopNodes();
    this.playing = false;
    this.current = null;
    this.emit();
  }
}

export const focusAudio = new FocusAudio();
