/**
 * Procedural sound effects via Web Audio API. No samples shipped.
 *
 * Browsers only allow audio after a user gesture, so the AudioContext is
 * created lazily on first call. Subsequent calls reuse it; if it gets
 * suspended (tab backgrounded etc.), the next call resumes it.
 *
 * Each "sound" is an oscillator/noise + gain envelope. Adding a new sound
 * = a new method on `Sound` that schedules its own short patch.
 */

let ctx: AudioContext | null = null;
let muted = false;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

interface ToneOptions {
  type?: OscillatorType;
  freq: number;
  freqEnd?: number;
  duration: number;
  attack?: number;
  release?: number;
  gain?: number;
  detune?: number;
}

function tone(opts: ToneOptions): void {
  const c = ensureCtx();
  if (!c || muted) return;
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.freq, t0);
  if (opts.freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.freqEnd), t0 + opts.duration);
  }
  if (opts.detune) osc.detune.setValueAtTime(opts.detune, t0);

  const g = c.createGain();
  const peak = opts.gain ?? 0.18;
  const attack = opts.attack ?? 0.005;
  const release = opts.release ?? Math.max(0.04, opts.duration * 0.4);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.duration);

  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + opts.duration + release);
}

function noise(durationSec: number, gain = 0.12, lowpass?: number): void {
  const c = ensureCtx();
  if (!c || muted) return;
  const t0 = c.currentTime;
  const buffer = c.createBuffer(1, Math.max(1, c.sampleRate * durationSec), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;

  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + durationSec);

  if (lowpass !== undefined) {
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = lowpass;
    src.connect(f).connect(g).connect(c.destination);
  } else {
    src.connect(g).connect(c.destination);
  }
  src.start(t0);
  src.stop(t0 + durationSec);
}

export const Sound = {
  setMuted(m: boolean): void {
    muted = m;
  },
  isMuted(): boolean {
    return muted;
  },

  click(): void {
    tone({ type: "triangle", freq: 1200, duration: 0.05, gain: 0.14 });
  },
  drop(): void {
    tone({ type: "sine", freq: 220, freqEnd: 90, duration: 0.18, gain: 0.22 });
  },
  pickup(): void {
    tone({ type: "triangle", freq: 600, freqEnd: 1200, duration: 0.16, gain: 0.18 });
  },
  whoosh(): void {
    noise(0.28, 0.1, 800);
  },
  bonk(): void {
    tone({ type: "square", freq: 90, duration: 0.12, gain: 0.16 });
  },

  // --- per-action ---

  munch(): void {
    // Two short crunchy noise bursts
    noise(0.07, 0.18, 2200);
    setTimeout(() => noise(0.07, 0.16, 1800), 90);
  },
  bounce(): void {
    tone({ type: "sine", freq: 280, freqEnd: 200, duration: 0.18, gain: 0.2 });
  },
  zzz(): void {
    tone({ type: "sine", freq: 130, duration: 0.6, gain: 0.16, attack: 0.05, release: 0.25, detune: -10 });
    tone({ type: "sine", freq: 138, duration: 0.6, gain: 0.12, attack: 0.05, release: 0.25 });
  },
  boing(): void {
    tone({ type: "triangle", freq: 220, freqEnd: 520, duration: 0.12, gain: 0.18 });
    setTimeout(() => tone({ type: "triangle", freq: 520, freqEnd: 280, duration: 0.14, gain: 0.16 }), 110);
  },
  awww(): void {
    // Soft major-third chord (C5 ish + E5)
    tone({ type: "sine", freq: 523, duration: 0.45, gain: 0.12, attack: 0.04, release: 0.2 });
    tone({ type: "sine", freq: 659, duration: 0.45, gain: 0.1, attack: 0.04, release: 0.2 });
  },
};
