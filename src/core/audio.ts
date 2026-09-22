import Phaser from 'phaser';
import manifest from 'virtual:asset-manifest';
import { RECIPE_SOUNDS } from './assets';

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
  | 'vo-hello' | 'vo-what-make' | 'vo-wash' | 'vo-wash-rub' | 'vo-wash-done' | 'vo-knead' | 'vo-crush' | 'vo-stir' | 'vo-grate'
  // part B (round 5)
  | 'vo-choose' | 'vo-cut' | 'vo-cut-careful' | 'vo-open-can' | 'vo-open-jar' | 'vo-pour' | 'vo-temp' | 'vo-temp-more'
  | 'vo-temp-hot' | 'vo-temp-done' | 'vo-mitts' | 'vo-share' | 'vo-slice-mom' | 'vo-mom-yum' | 'vo-slice-pipa' | 'vo-photo'
  // the salad (round 6)
  | 'vo-pick-salad' | 'vo-wash-veg' | 'vo-wash-veg-done' | 'vo-tear' | 'vo-choose-veg' | 'vo-into-bowl' | 'vo-squeeze' | 'vo-oil'
  | 'vo-salt' | 'vo-mix' | 'vo-serve' | 'vo-bowl-mom' | 'vo-fresh' | 'vo-bowl-pipa' | 'vo-photo-salad' | 'vo-finale-salad'
  // the cookies (round 7)
  | 'vo-pick-cookies' | 'vo-flour' | 'vo-sugar' | 'vo-butter' | 'vo-egg' | 'vo-stir-dough' | 'vo-knead-cookies' | 'vo-roll-cookies'
  | 'vo-pick-cutter' | 'vo-stamp' | 'vo-tray' | 'vo-temp-150' | 'vo-decorate-cookies' | 'vo-share-cookies' | 'vo-cookie-mom'
  | 'vo-cookie-pipa' | 'vo-cookie-yum' | 'vo-photo-cookies' | 'vo-finale-cookies'
  // the smoothie (round 8)
  | 'vo-pick-smoothie' | 'vo-wash-fruit' | 'vo-choose-fruit' | 'vo-into-blender' | 'vo-milk' | 'vo-lid' | 'vo-blend'
  | 'vo-blend-done' | 'vo-pour-glass' | 'vo-share-smoothie' | 'vo-glass-mom' | 'vo-glass-pipa' | 'vo-smoothie-yum'
  | 'vo-photo-smoothie' | 'vo-finale-smoothie'
  // the pancakes (round 8)
  | 'vo-pick-pancakes' | 'vo-stir-batter' | 'vo-stove' | 'vo-ladle' | 'vo-bubbles' | 'vo-flip' | 'vo-flip-done'
  | 'vo-more-pancake' | 'vo-decorate-pancakes' | 'vo-share-pancakes' | 'vo-pancake-mom' | 'vo-pancake-pipa'
  | 'vo-pancake-yum' | 'vo-photo-pancakes' | 'vo-finale-pancakes'
  // the memory book and the vegetable soup (round 9)
  | 'vo-album' | 'vo-pick-soup' | 'vo-peel' | 'vo-peel-done' | 'vo-into-pot' | 'vo-water' | 'vo-stir-soup'
  | 'vo-soup-ready' | 'vo-serve-soup' | 'vo-soup-mom' | 'vo-soup-pipa' | 'vo-soup-yum' | 'vo-photo-soup'
  | 'vo-finale-soup'
  | 'vo-pick-cake' | 'vo-stir-cake' | 'vo-pour-pan' | 'vo-pick-frosting' | 'vo-frost' | 'vo-decorate-cake'
  | 'vo-candles' | 'vo-wish' | 'vo-blow-more' | 'vo-blown' | 'vo-share-cake' | 'vo-cake-mom' | 'vo-cake-pipa'
  | 'vo-cake-yum' | 'vo-photo-cake' | 'vo-finale-cake'
  | CountKey | TempKey | NameKey;

/** Mom counting (count-1..10) and saying the oven temperature (temp-50..250). */
export type CountKey = `count-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10}`;
export type TempKey = `temp-${50 | 100 | 150 | 200 | 250}`;
/** Mom naming what she picked (the choose step: a new name may cut the name playing, never another line). */
export type NameKey = `name-${'tomato' | 'mushroom' | 'pepper' | 'onion' | 'corn' | 'olives' | 'cucumber' | 'carrot' | 'lemon' | 'lettuce' | 'star' | 'heart' | 'circle' | 'flower' | 'banana' | 'strawberry' | 'mango' | 'kiwi' | 'potato' | 'zucchini' | 'pink' | 'white' | 'chocolate'}`;
export const countKey = (n: number): CountKey => `count-${Math.max(1, Math.min(10, Math.round(n)))}` as CountKey;

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
  soundUrl = url;
  const sm = g.sound as Phaser.Sound.WebAudioSoundManager;
  sm.pauseOnBlur = false; // the page lifecycle is handled here (holdAudio), not by window blur
  if (!ctx()) return;
  // Voice first (the hello line comes right after the play tap), then effects, then the long music file.
  // A voice line is any file in voice/ (vo-*, and count-* / temp-* for part B). A recipe's own sounds wait for its card.
  const order = (k: string) => (isVoice(k) ? 0 : k === 'music-main' ? 2 : 1);
  const keys = Object.keys(manifest.sounds).filter((k) => !RECIPE_SOUNDS.has(k)).sort((a, b) => order(a) - order(b));
  decodeAll(keys).then(() => (soundsLoaded = true));
}

let soundUrl: (path: string) => string = (p) => p;
const isVoice = (k: string) => manifest.sounds[k].some((p) => p.includes('/voice/'));

/** Fetches and decodes `keys` one after another (the ones on disk and not decoded yet); a missing one stays silent. */
async function decodeAll(keys: readonly string[]) {
  const c = ctx();
  const missing: string[] = [];
  for (const key of keys) {
    if (buffers.has(key)) continue;
    if (!manifest.sounds[key] || !c || !game) {
      missing.push(key);
      continue;
    }
    try {
      const res = await fetch(soundUrl(manifest.sounds[key][0]));
      const buf = await c.decodeAudioData(await res.arrayBuffer());
      buffers.set(key, buf);
      if (!isVoice(key) && !LOOPS.includes(key)) game.cache.audio.add(key, buf);
      if (key === 'music-main') music.onLoaded();
    } catch {
      missing.push(key);
    }
  }
  if (missing.length) console.info(`[assets] silent sounds: ${missing.join(', ')}`);
}

/** A recipe's own sounds (RECIPE_ASSETS), loaded when its card is tapped. */
export const loadRecipeSounds = (keys: readonly string[]) => decodeAll(keys);

/** Frees a recipe's own sounds on the home screen (a line or effect still playing keeps its buffer until it ends). */
export function releaseSounds(keys: readonly string[]) {
  for (const key of keys) {
    buffers.delete(key);
    if (game?.cache.audio.exists(key)) game.cache.audio.remove(key);
  }
}

/** Played as gapless loops here (not through Phaser). */
const LOOPS = ['music-main', 'bake', 'water', 'blender', 'sizzle'];

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
function effectLoop(key: string, level: number, fade = 0.3) {
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
      ramp(this.gain, level, fade);
    },
    stop() {
      const c = ctx();
      const { src, gain } = this;
      this.src = null;
      this.gain = null;
      if (!c || !src || !gain) return;
      ramp(gain, 0, fade);
      try {
        src.stop(c.currentTime + fade + 0.02);
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
/** The blender motor while her finger holds its button (0.35, MIXING.md; a quick fade so it answers the finger at once). */
export const blenderLoop = effectLoop('blender', 0.35, 0.06);
/** The batter sizzling in the pan while she pours it (pancakes). */
export const sizzleLoop = effectLoop('sizzle', 0.35, 0.15);

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
  /**
   * The one exception to "a line is never cut": a line of a group ('count', 'temp') may cut the line of the SAME
   * group that is playing (and replaces one of that group still waiting), so quick counting or quick taps on the
   * temperature buttons follow her, instead of piling up. Other lines are never cut by it: it waits behind them.
   */
  group?: string;
  /**
   * With `group`: counting. Every number waits its turn behind other lines (none is skipped, "one" before "two");
   * only while a number of the group is playing does a newer one cut it (and replace the ones still waiting).
   * Without it (the temperatures) only the newest value matters: it replaces any of its group still waiting.
   */
  sequence?: boolean;
}

interface Pending extends SayOpts {
  key: VoiceKey;
  at: number;
}

export interface VoiceLogEntry {
  key: string;
  /** When it started / ended, ms on the voice clock (real time; the game clock in test mode, `Voice.simulate`). */
  start: number;
  end?: number;
  cut?: boolean;
  /** The line's group, if any (a same-group cut is the allowed exception). */
  group?: string;
  /** What cut it (a line key, or 'stop' for the rotate screen / background / home). */
  cutBy?: string;
}

/**
 * Mom's voice. One line at a time: `say` either queues behind the current line (default) or cuts it
 * (50 ms fade). Lines that waited too long or are no longer valid are dropped. An AnalyserNode gives
 * the loudness of the line playing (`level()`), which drives Mom's mouth.
 */
class Voice {
  private cur: { src: AudioBufferSourceNode | null; gain: GainNode | null; entry: VoiceLogEntry; done?: () => void; end: () => void; endAt: number } | null = null;
  /**
   * Test mode (the harness's `__voSim(true)`): a line "ends" exactly after its file's real length on the game's own
   * clock (game.loop.time, virtual under the harness), without playing any sound. So the voice timing can be
   * checked in the hidden automated Chrome, where the audio context never runs and timers are throttled.
   */
  private sim = false;
  private simHooked = false;
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

  /** Test mode on/off (see `sim`). */
  simulate(on: boolean) {
    this.stop();
    this.sim = on;
    if (on && game && !this.simHooked) {
      this.simHooked = true;
      game.events.on(Phaser.Core.Events.POST_STEP, () => {
        if (this.sim && this.cur && this.now() >= this.cur.endAt) this.cur.end();
      });
    }
  }

  get simulating() {
    return this.sim;
  }

  /** Every sound file decoded (the test harness waits for it: a line whose file isn't decoded yet is skipped). */
  get allLoaded() {
    return soundsLoaded;
  }

  /** The voice clock: real time, or the game's clock in test mode. */
  now() {
    return this.sim && game ? game.loop.time : performance.now();
  }

  say(key: VoiceKey, opts: SayOpts = {}) {
    if (!game || audioHeld()) return opts.done?.();
    const p: Pending = { ...opts, key, at: this.now() };
    if (this.cur && opts.queue === false) {
      this.queue = [];
      this.cut(key);
    }
    if (opts.group) {
      // The newest count / temperature replaces an older one of its group that is playing (cut) or still waiting;
      // a count behind another line just waits in order (`sequence`).
      const playingSame = this.cur?.entry.group === opts.group;
      if (playingSame || !opts.sequence) this.queue = this.queue.filter((q) => (q.group === opts.group ? (q.done?.(), false) : true));
      if (playingSame) this.cut(key);
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
    this.cut('stop');
  }

  /** Drops every queued line (the one playing finishes). */
  clearQueue() {
    const q = this.queue;
    this.queue = [];
    q.forEach((p) => p.done?.());
  }

  /** Loudness 0..1 of the line playing now (0 when silent). */
  level() {
    if (this.cur && this.sim) return 0.3;
    if (!this.cur || !this.analyser || !this.data) return 0;
    this.analyser.getByteTimeDomainData(this.data);
    let sum = 0;
    for (let i = 0; i < this.data.length; i++) {
      const v = (this.data[i] - 128) / 128;
      sum += v * v;
    }
    return Math.min(1, Math.sqrt(sum / this.data.length) * 4);
  }

  private cut(by = 'stop') {
    const c = ctx();
    const cur = this.cur;
    if (!cur) return;
    this.cur = null;
    cur.entry.end = this.now();
    cur.entry.cut = true;
    cur.entry.cutBy = by;
    if (c && cur.src && cur.gain) {
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
    const entry: VoiceLogEntry = { key: p.key, start: this.now(), group: p.group };
    this.log.push(entry);
    const ended = () => {
      if (this.cur?.entry !== entry) return;
      this.cur = null;
      entry.end = this.now();
      p.done?.();
      this.next();
      if (!this.cur) music.duck(false);
    };
    const endAt = entry.start + buf.duration * 1000;
    if (this.sim) {
      // Test mode: no sound; POST_STEP ends it at endAt on the game clock.
      this.cur = { src: null, gain: null, entry, done: p.done, end: ended, endAt };
      return;
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
    this.cur = { src, gain, entry, done: p.done, end: ended, endAt };
    music.duck(true);
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
      const expired = this.now() - p.at > (p.ttlMs ?? 2500);
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
// For the test harness (dev and tests only; nothing is sent anywhere): `__voice.simulate(true)`.
(window as unknown as { __voice: Voice }).__voice = voice;

/** Duration of a voice line in ms (0 if not loaded). */
export const lineMs = (key: VoiceKey) => (buffers.get(key)?.duration ?? 0) * 1000;
