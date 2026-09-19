import Phaser from 'phaser';
import manifest from 'virtual:asset-manifest';

/**
 * Every sound, on the one Web Audio context Phaser already made (game.sound.context).
 * Levels follow MIXING.md in the sound folder (the owner's numbers win where they differ):
 *   Mom's voice 1.0 (the reference) · effects ~0.65 (munch 1.0: its file is 5 dB quieter)
 *   · bake sizzle loop 0.4 · music 0.22, ducked to 0.11 while Mom speaks and back over 0.5 s.
 * No mute button. Everything stops on the rotate screen and in the background, and comes back after.
 *
 * - Effects keep going through Phaser (`sfx()` in sfx.ts): their decoded buffers are put in game.cache.audio.
 * - Voice lines (`voice.say`): exactly one at a time, never overlapping. A line whose moment has passed
 *   (it waited too long, or `valid()` says no) is dropped, never played late. See `Voice`.
 * - Music and the bake sizzle are gapless AudioBufferSourceNode loops (not <audio loop>).
 */

export const LEVEL = { voice: 1, sfx: 0.65, loop: 0.4, water: 0.35, music: 0.22, musicDucked: 0.11 } as const;

/** Voice-line keys (public/assets/sounds/voice). */
export type VoiceKey =
  | 'vo-welcome' | 'vo-pick-pizza' | 'vo-watch-me' | 'vo-your-turn' | 'vo-roll' | 'vo-sauce' | 'vo-cheese' | 'vo-toppings'
  | 'vo-done-hint' | 'vo-oven' | 'vo-baking' | 'vo-ready' | 'vo-feed' | 'vo-help' | 'vo-finale' | 'vo-bye'
  | 'vo-praise-1' | 'vo-praise-2' | 'vo-praise-3' | 'vo-praise-4' | 'vo-praise-5' | 'vo-praise-6' | 'vo-praise-7'
  | 'vo-hello' | 'vo-what-make' | 'vo-wash' | 'vo-wash-rub' | 'vo-wash-done' | 'vo-knead' | 'vo-crush' | 'vo-stir' | 'vo-grate';

const PRAISE: VoiceKey[] = ['vo-praise-1', 'vo-praise-2', 'vo-praise-3', 'vo-praise-4', 'vo-praise-5', 'vo-praise-6', 'vo-praise-7'];

let game: Phaser.Game | null = null;
const buffers = new Map<string, AudioBuffer>();
const ctx = () => (game?.sound as Phaser.Sound.WebAudioSoundManager | undefined)?.context;

// ---------------------------------------------------------------- loading

/**
 * Fetches and decodes every sound in the asset manifest, in the background (the title does not wait).
 * Effects go into game.cache.audio for Phaser; voice, music and loops are kept here.
 */
export function loadSounds(g: Phaser.Game, url: (path: string) => string) {
  game = g;
  const sm = g.sound as Phaser.Sound.WebAudioSoundManager;
  sm.pauseOnBlur = false; // the page lifecycle is handled here (holdAudio), not by window blur
  const c = ctx();
  if (!c) return;
  const missing: string[] = [];
  // Voice first (the hello line comes right after the play tap), then effects, then the long music file.
  // A voice line is any file in voice/ (vo-*, and count-* / temp-* for part B).
  const isVoice = (k: string) => manifest.sounds[k].some((p) => p.includes('/voice/'));
  const order = (k: string) => (isVoice(k) ? 0 : k === 'music-main' ? 2 : 1);
  const keys = Object.keys(manifest.sounds).sort((a, b) => order(a) - order(b));
  (async () => {
    for (const key of keys) {
      try {
        const res = await fetch(url(manifest.sounds[key][0]));
        const buf = await c.decodeAudioData(await res.arrayBuffer());
        buffers.set(key, buf);
        if (!isVoice(key) && !LOOPS.includes(key)) g.cache.audio.add(key, buf);
        if (key === 'music-main') music.onLoaded();
      } catch {
        missing.push(key);
      }
    }
    if (missing.length) console.info(`[assets] silent sounds: ${missing.join(', ')}`);
    soundsLoaded = true;
  })();
}

/** Played as gapless loops here (not through Phaser). */
const LOOPS = ['music-main', 'bake', 'water'];

let soundsLoaded = false;
export const allSoundsLoaded = () => soundsLoaded;

// ---------------------------------------------------------------- holds (rotate screen, background)

const holds = new Set<string>();

/**
 * Stops all sound while any hold is on ('rotate', 'hidden'): the voice line in progress is dropped
 * (never resumed half-way or late), the context is suspended (music, sizzle and effects freeze
 * where they are) and resumes when the last hold is lifted.
 */
export function holdAudio(reason: string, on: boolean) {
  if (on) {
    holds.add(reason);
    voice.stop();
  } else holds.delete(reason);
  const c = ctx();
  if (!c) return;
  if (holds.size) c.suspend().catch(() => {});
  else if (c.state !== 'running') c.resume().catch(() => {});
}

export const audioHeld = () => holds.size > 0;

// ---------------------------------------------------------------- music + loops

function startLoop(key: string, gain: GainNode): AudioBufferSourceNode | null {
  const c = ctx();
  const buf = buffers.get(key);
  if (!c || !buf) return null;
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true; // sample-accurate, gapless
  src.connect(gain);
  src.start();
  return src;
}

const ramp = (g: GainNode, to: number, sec: number) => {
  const c = ctx();
  if (!c) return;
  const t = c.currentTime;
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(g.gain.value, t);
  g.gain.linearRampToValueAtTime(to, t + sec);
};

/** One background tune, started once on the play tap and never restarted between screens. */
export const music = {
  gain: null as GainNode | null,
  src: null as AudioBufferSourceNode | null,
  wanted: false,
  /** Called from the play tap (a user gesture). Starts as soon as the file is decoded. */
  start() {
    this.wanted = true;
    this.tryStart();
  },
  onLoaded() {
    this.tryStart();
  },
  tryStart() {
    const c = ctx();
    if (!this.wanted || this.src || !c || !buffers.has('music-main')) return;
    this.gain = c.createGain();
    this.gain.gain.value = voice.speaking ? LEVEL.musicDucked : LEVEL.music;
    this.gain.connect(c.destination);
    this.src = startLoop('music-main', this.gain);
  },
  duck(on: boolean) {
    if (this.gain) ramp(this.gain, on ? LEVEL.musicDucked : LEVEL.music, on ? 0.15 : 0.5);
  },
};

/** A gapless effect loop that fades in and out over 300 ms (the oven sizzle, the running tap). */
function effectLoop(key: string, level: number) {
  return {
    gain: null as GainNode | null,
    src: null as AudioBufferSourceNode | null,
    get on() {
      return !!this.src;
    },
    start() {
      const c = ctx();
      if (!c || this.src) return;
      this.gain = c.createGain();
      this.gain.gain.value = 0;
      this.gain.connect(c.destination);
      this.src = startLoop(key, this.gain);
      if (!this.src) {
        this.gain.disconnect();
        this.gain = null;
        return;
      }
      ramp(this.gain, level, 0.3);
    },
    stop() {
      const c = ctx();
      const { src, gain } = this;
      this.src = null;
      this.gain = null;
      if (!c || !src || !gain) return;
      ramp(gain, 0, 0.3);
      try {
        src.stop(c.currentTime + 0.32);
      } catch {
        /* already stopped */
      }
    },
  };
}

/** The oven sizzle while the pizza bakes (0.4). */
export const bakeLoop = effectLoop('bake', LEVEL.loop);
/** The running tap while washing hands (0.35, MIXING.md). */
export const waterLoop = effectLoop('water', LEVEL.water);

// ---------------------------------------------------------------- voice

export interface SayOpts {
  /** Wait for the current line to end instead of cutting it (default: wait). */
  queue?: boolean;
  /** A queued line older than this is dropped (its moment passed). Default 2500 ms. */
  ttlMs?: number;
  /** Checked right before playing; false = drop it (e.g. the step it was for is over). */
  valid?: () => boolean;
  /** Called when the line ends, or right away if it is dropped or can't play. */
  done?: () => void;
}

interface Pending extends SayOpts {
  key: VoiceKey;
  at: number;
}

export interface VoiceLogEntry {
  key: string;
  /** performance.now() when it started / ended (real time, also under the test harness's virtual clock). */
  start: number;
  end?: number;
  cut?: boolean;
}

/**
 * Mom's voice. One line at a time: `say` either queues behind the current line (default) or cuts it
 * (50 ms fade). Lines that waited too long or are no longer valid are dropped. An AnalyserNode gives
 * the loudness of the line playing (`level()`), which drives Mom's mouth.
 */
class Voice {
  private cur: { src: AudioBufferSourceNode; gain: GainNode; entry: VoiceLogEntry; done?: () => void } | null = null;
  private queue: Pending[] = [];
  private analyser: AnalyserNode | null = null;
  private data: Uint8Array<ArrayBuffer> | null = null;
  /** Praise lines still to come in this round: a shuffled deck, every line once before any comes back. */
  private deck: VoiceKey[] = [];
  private lastPraise = '';
  /** Every line started, for the test harness (window.__voLog). */
  readonly log: VoiceLogEntry[] = [];

  get speaking() {
    return !!this.cur;
  }

  /** The key of the line playing now, if any. */
  get current() {
    return this.cur?.entry.key ?? null;
  }

  say(key: VoiceKey, opts: SayOpts = {}) {
    if (!game || audioHeld()) return opts.done?.();
    const p: Pending = { ...opts, key, at: performance.now() };
    if (this.cur && opts.queue === false) {
      this.queue = [];
      this.cut();
    }
    if (this.cur) {
      this.queue.push(p);
      return;
    }
    this.play(p);
  }

  /**
   * A praise line from a shuffled deck: all seven in random order before any comes back, and never the
   * same one twice in a row, also where one deck ends and the next begins.
   */
  praise(opts: SayOpts = {}) {
    if (!this.deck.length) {
      this.deck = Phaser.Utils.Array.Shuffle([...PRAISE]);
      if (this.deck[0] === this.lastPraise) {
        const j = 1 + Math.floor(Math.random() * (this.deck.length - 1));
        [this.deck[0], this.deck[j]] = [this.deck[j], this.deck[0]];
      }
    }
    const pick = this.deck.shift()!;
    this.lastPraise = pick;
    this.say(pick, opts);
  }

  /** Drops everything waiting and cuts the line playing (the done callbacks still run). */
  stop() {
    const q = this.queue;
    this.queue = [];
    q.forEach((p) => p.done?.());
    this.cut();
  }

  /** Drops every queued line (the one playing finishes). */
  clearQueue() {
    const q = this.queue;
    this.queue = [];
    q.forEach((p) => p.done?.());
  }

  /** Loudness 0..1 of the line playing now (0 when silent). */
  level() {
    if (!this.cur || !this.analyser || !this.data) return 0;
    this.analyser.getByteTimeDomainData(this.data);
    let sum = 0;
    for (let i = 0; i < this.data.length; i++) {
      const v = (this.data[i] - 128) / 128;
      sum += v * v;
    }
    return Math.min(1, Math.sqrt(sum / this.data.length) * 4);
  }

  private cut() {
    const c = ctx();
    const cur = this.cur;
    if (!cur) return;
    this.cur = null;
    cur.entry.end = performance.now();
    cur.entry.cut = true;
    if (c) {
      ramp(cur.gain, 0, 0.05);
      try {
        cur.src.onended = null;
        cur.src.stop(c.currentTime + 0.06);
      } catch {
        /* already stopped */
      }
    }
    if (!this.queue.length) music.duck(false);
    cur.done?.();
  }

  private play(p: Pending): void {
    const c = ctx();
    const buf = buffers.get(p.key);
    if (!c || !buf || (p.valid && !p.valid())) {
      p.done?.();
      return this.next();
    }
    if (!this.analyser) {
      this.analyser = c.createAnalyser();
      this.analyser.fftSize = 512;
      this.data = new Uint8Array(new ArrayBuffer(this.analyser.fftSize));
      this.analyser.connect(c.destination);
    }
    const gain = c.createGain();
    gain.gain.value = LEVEL.voice;
    gain.connect(this.analyser);
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(gain);
    const entry: VoiceLogEntry = { key: p.key, start: performance.now() };
    this.log.push(entry);
    this.cur = { src, gain, entry, done: p.done };
    music.duck(true);
    const ended = () => {
      if (this.cur?.src !== src) return;
      this.cur = null;
      entry.end = performance.now();
      p.done?.();
      this.next();
      if (!this.cur) music.duck(false);
    };
    src.onended = ended;
    src.start();
    // Safety net: if the context can't run (audio still locked by the browser), the line still "ends"
    // on time, so Mom never keeps talking silently and nothing waits forever.
    setTimeout(() => {
      if (this.cur?.src === src && c.state !== 'running') ended();
    }, buf.duration * 1000 + 250);
  }

  private next(): void {
    while (this.queue.length) {
      const p = this.queue.shift()!;
      const expired = performance.now() - p.at > (p.ttlMs ?? 2500);
      if (expired || (p.valid && !p.valid())) {
        p.done?.();
        continue;
      }
      return this.play(p);
    }
  }
}

export const voice = new Voice();
(window as unknown as { __voLog: VoiceLogEntry[] }).__voLog = voice.log;

/** Duration of a voice line in ms (0 if not loaded). */
export const lineMs = (key: VoiceKey) => (buffers.get(key)?.duration ?? 0) * 1000;
