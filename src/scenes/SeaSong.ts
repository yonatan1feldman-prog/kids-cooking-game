import Phaser from 'phaser';
import { keepPhoto } from '../core/album';
import { music, voice, type VoiceKey } from '../core/audio';
import { FX_SOFT } from '../core/assets';
import { stars } from '../core/fx';
import { tapMotion, type HandMotion } from '../core/hand';
import { confetti } from '../core/juice';
import { sfx } from '../core/sfx';
import type { SoundKey } from '../core/assets';
import type { P } from './MiniGame';
import { SeaGame } from './SeaGame';

/**
 * The shell song (mermaid PR 4; research/mermaid-spec.md 3.5, "Simon without failing"). On a rock five bell shells,
 * biggest (lowest) to smallest (highest), each its own colour and its own note (C D E G A, the song's pentatonic scale).
 * A tap: the note, the shell glows and bounces, a bubble with a note in it rises and pops at the top.
 *  - free: she plays as she likes ("Tap the shells, they sing!"); after a few notes Mom offers a little tune.
 *  - listen: Mom's hand plays it, each shell lighting in turn ("Listen to my little song!"). Taps meanwhile still sing;
 *    Mom simply starts her tune again once it is quiet (nothing is broken, nothing is said).
 *  - copy: "Can you play it too?" Her taps: the right shell = it sings and glows; another shell = a soft bubble and the
 *    right one blinks twice (Mom shows it; never "wrong"). Idle: Mom's hand taps the right one; then she plays it.
 *  - Three tunes: easy 2, 3, 3 notes; hard 3, 4, 4, and after the last one Mom sings "la" along to it ("Now I'll sing
 *    along!") while the shells light up (and she may play with her).
 *  - The end: every shell glows, the party layer, Marina dances, a photo (the shells on the rock, in the sea frame) and
 *    "We made up a song together!", then quietly back to the lagoon, where three little bell shells now sit on Mom's
 *    rock (`lagoon.song`).
 * Learning: listening, remembering a short sequence, high and low. No score, no timer, nothing on screen to read.
 */

/** The five shells' notes (make_sea_sfx.py SHELL_NOTES) and colours (gen_sea.py BELLS), biggest first. */
const BELLS = [
  { size: 260, tint: 0xf28c7a },
  { size: 245, tint: 0xf2c14e },
  { size: 230, tint: 0x7ccb8a },
  { size: 215, tint: 0x4e9fd8 },
  { size: 200, tint: 0xb99bd8 },
] as const;
/** The time between two notes when Mom plays (make_sea_sfx.py NOTE_S: her sung "la"s keep this beat). */
const NOTE_MS = 620;
/** Notes she plays freely before Mom offers her tune. */
const FREE_NOTES = 4;
/** Quiet after her last tap before Mom (re)starts her tune. */
const QUIET_MS = 1500;
/**
 * Mom's three tunes per visit (shell indexes, 0 = the biggest), in three sets that take turns visit by visit. The hard
 * sets' last tunes are the ones Mom sings (make_sea_sfx.py SING_TUNES, in the same order: sing-1..3).
 */
const TUNES = {
  easy: [
    [[0, 2], [0, 2, 4], [4, 2, 0]],
    [[1, 3], [0, 1, 2], [2, 3, 4]],
    [[4, 0], [0, 4, 2], [3, 2, 1]],
  ],
  hard: [
    [[0, 2, 4], [0, 2, 4, 2], [4, 3, 2, 0]],
    [[2, 1, 0], [0, 2, 3, 1], [0, 1, 2, 4]],
    [[4, 2, 0], [1, 3, 4, 3], [4, 2, 1, 0]],
  ],
} as const;

interface Bell {
  i: number;
  img: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
  at: P;
  scale: number;
  /** Touch radius. */
  r: number;
}

export class SeaSongScene extends SeaGame {
  protected readonly id = 'sea-song';
  protected readonly waiting = ['free', 'copy'] as const;
  private bells: Bell[] = [];
  private tunes: readonly (readonly number[])[] = [];
  private visit = 0;
  private round = 0;
  /** In `copy`: how many notes of the tune she has played. */
  private pos = 0;
  private freeNotes = 0;
  /** Misses in a row in this tune (two: Mom says she'll show it again and plays it). */
  private wrongRun = 0;
  /** Mom's playing: a token so a tune cut short by her taps stops cleanly; the timer that restarts it when quiet. */
  private playToken = 0;
  private quietTimer: Phaser.Time.TimerEvent | null = null;
  private afterFree: Phaser.Time.TimerEvent | null = null;
  private rockTop = 0;

  constructor() {
    super('SeaSong');
  }

  init() {
    super.init();
    this.bells = [];
    this.round = this.pos = this.freeNotes = this.wrongRun = 0;
    this.playToken = 0;
    this.quietTimer = this.afterFree = null;
  }

  protected build() {
    const L = this.L;
    const S = this.S;
    const k = L.k;
    this.cameras.main.setBackgroundColor('#5fc9c3');
    this.add.image(L.cx, L.H, 'bg-lagoon').setOrigin(0.5, 1).setScale(Math.max(1, L.W / 2400)).setDepth(-100);

    // Which tunes (they take turns visit by visit; MiniGame counted this visit already).
    let n = 1;
    try {
      n = Number(localStorage.getItem(`cooking.runs.${this.id}`)) || 1;
    } catch {
      /* no storage: the first set */
    }
    this.visit = (n - 1) % 3;
    this.tunes = (this.level === 2 ? TUNES.hard : TUNES.easy)[this.visit];
    this.shown.visit = this.visit;
    this.shown.tunes = this.tunes;

    // The shells in a row on a rock, from the left thumb strip to just left of Marina (or Mom's face), big to small.
    const area = { x0: L.m + 40 * k, x1: S.prepArea.x1 };
    const gap = 40 * k;
    const total = BELLS.reduce((a, b) => a + b.size, 0) + 4 * 40;
    const sc = Math.min(k * 1.05, (area.x1 - area.x0 - 40 * k) / total);
    const width = total * sc;
    let x = (area.x0 + area.x1) / 2 - width / 2;
    const foot = L.Y(800);
    // (the rock under them: lagoon-rock, wide and low)
    const rockW = width + 160 * k;
    const rock = this.add.image((area.x0 + area.x1) / 2, foot - 30 * k, 'lagoon-rock').setOrigin(0.5, 0.27).setDepth(2);
    rock.setScale(rockW / 900, 0.75 * k);
    this.rockTop = foot;
    this.bells = BELLS.map((b, i) => {
      const w = b.size * sc;
      const at = { x: x + w / 2, y: foot - (w / 2) * 0.92 + i * 4 * k };
      x += w + gap * (sc / k);
      const glow = this.add.image(at.x, at.y, 'shell-glow').setTint(b.tint).setAlpha(0).setDepth(9).setBlendMode(Phaser.BlendModes.ADD);
      glow.setScale((w * 1.35) / 320);
      const img = this.add.image(at.x, at.y, `bell-shell-${i + 1}`).setScale(sc).setDepth(10);
      return { i, img, glow, at, scale: sc, r: Math.max(w * 0.55, 105 * k) };
    });
    this.shown.bells = this.bells.map((b) => ({ x: Math.round(b.at.x), y: Math.round(b.at.y), w: Math.round(BELLS[b.i].size * sc) }));
    (window as unknown as { __seaSong: SeaSongScene }).__seaSong = this;
  }

  protected ready() {
    super.ready();
    this.time.delayedCall(300, () => this.begin('free', 'vo-song-start'));
  }

  protected shutdown() {
    this.playToken++;
    this.quietTimer?.remove();
    this.afterFree?.remove();
  }

  // ---------------------------------------------------------------- the shells

  /** A shell sings: its note, its glow and bounce, a bubble with a note rising from it. */
  private ring(i: number, opts: { soft?: boolean; long?: boolean } = {}) {
    const b = this.bells[i];
    const k = this.L.k;
    sfx(this, `shell-note-${i + 1}` as SoundKey, { vary: false, minGapMs: 0, volume: opts.soft ? 0.55 : 1 });
    this.tweens.killTweensOf(b.img);
    b.img.setScale(b.scale);
    this.tweens.add({ targets: b.img, scaleX: b.scale * 1.1, scaleY: b.scale * 0.92, duration: 90, yoyo: true, ease: 'Quad.easeOut', onComplete: () => {
      this.tweens.add({ targets: b.img, scaleY: b.scale * 1.06, duration: 110, yoyo: true, ease: 'Sine.easeInOut' });
    } });
    this.tweens.killTweensOf(b.glow);
    b.glow.setAlpha(0.95);
    this.tweens.add({ targets: b.glow, alpha: 0, delay: opts.long ? 500 : 180, duration: 600 });
    this.noteBubble(b, k);
    this.shown.notes = ((this.shown.notes as number) ?? 0) + 1;
  }

  private noteBubble(b: Bell, k: number) {
    const top = this.L.Y(170);
    const nb = this.add.image(b.at.x + Phaser.Math.Between(-20, 20) * k, b.at.y - 60 * k, 'note-bubble').setTint(BELLS[b.i].tint).setDepth(20);
    nb.setScale(0.5 * k).setAlpha(0.95);
    const sway = Phaser.Math.Between(-60, 60) * k;
    this.tweens.add({ targets: nb, scale: 0.85 * k, duration: 400, ease: 'Back.easeOut' });
    this.tweens.add({ targets: nb, y: top, x: nb.x + sway, duration: 4000, ease: 'Sine.easeIn', onComplete: () => {
      // (it pops at the top: a ring of little bubbles, quietly)
      const pop = this.add.image(nb.x, nb.y, FX_SOFT).setTint(0xffffff).setAlpha(0.7).setDepth(20);
      pop.setScale((60 * k) / pop.frame.realWidth);
      this.tweens.add({ targets: pop, scale: pop.scale * 2.2, alpha: 0, duration: 300, onComplete: () => pop.destroy() });
      nb.destroy();
    } });
  }

  /** "Here!": the right shell blinks twice (Mom showing, not a mistake). */
  private blink(i: number) {
    const b = this.bells[i];
    this.tweens.killTweensOf(b.glow);
    b.glow.setAlpha(0);
    this.tweens.add({ targets: b.glow, alpha: 0.85, duration: 180, yoyo: true, repeat: 1, delay: 250 });
  }

  private shellAt(at: P): number {
    let best = -1;
    let bd = Infinity;
    this.bells.forEach((b) => {
      const d = Math.hypot(at.x - b.at.x, at.y - b.at.y);
      if (d < b.r && d < bd) {
        bd = d;
        best = b.i;
      }
    });
    return best;
  }

  // ---------------------------------------------------------------- Mom's tune

  /** Mom plays the current tune, her hand tapping each shell; `then` when it is over (not if it was cut short). */
  private momPlays(then: () => void, opts: { line?: VoiceKey | null; sing?: boolean } = {}) {
    this.setPhase(opts.sing ? 'sing' : 'listen');
    const token = ++this.playToken;
    const tune = this.tunes[this.round];
    const start = () => {
      if (token !== this.playToken || this.leaving) return;
      const lead = 500;
      // her hand: in at the first shell, a press on each in time, out again
      const keys: HandMotion['keys'] = [];
      const off = { x: 60 * this.L.k, y: 80 * this.L.k };
      const p0 = this.bells[tune[0]].at;
      keys.push({ x: p0.x + off.x, y: p0.y + off.y, t: 0 });
      tune.forEach((i, j) => {
        const p = this.bells[i].at;
        const t = lead + j * NOTE_MS;
        keys.push({ x: p.x, y: p.y - 10 * this.L.k, t: t - 160 });
        keys.push({ x: p.x, y: p.y - 10 * this.L.k, t, press: true });
        keys.push({ x: p.x, y: p.y - 10 * this.L.k, t: t + 140 });
      });
      const end = lead + (tune.length - 1) * NOTE_MS + 400;
      const last = this.bells[tune[tune.length - 1]].at;
      keys.push({ x: last.x + off.x, y: last.y + off.y, t: end + 300 });
      this.hand.play({ kind: 'point', keys });
      if (opts.sing) sfx(this, `sing-${this.visit + 1}` as SoundKey, { vary: false, minGapMs: 0 });
      tune.forEach((i, j) => {
        this.time.delayedCall((opts.sing ? 0 : lead) + j * NOTE_MS, () => token === this.playToken && !this.leaving && this.ring(i, { soft: opts.sing, long: true }));
      });
      this.time.delayedCall(end + 350, () => {
        if (token !== this.playToken || this.leaving) return;
        this.hand.stop();
        then();
      });
    };
    if (opts.line) this.say(opts.line, { ttlMs: 5000, done: () => this.time.delayedCall(250, start) });
    else start();
    this.shown.played = ((this.shown.played as number) ?? 0) + 1;
  }

  /** Mom's tune for this round, then her turn. */
  private offerTune(line: VoiceKey | null) {
    this.pos = 0;
    this.wrongRun = 0;
    this.momPlays(() => this.yourTurn(), { line });
  }

  private yourTurn() {
    this.begin('copy', this.round === 0 ? 'vo-song-copy' : 'vo-your-turn');
  }

  /** Her taps while Mom plays: they sing, Mom's tune stops, and once it is quiet she starts it again (no words). */
  private interrupt() {
    if (this.phase !== 'listen') return;
    this.playToken++;
    this.hand.stop();
    // (Mom's sentence goes on; only her tune waits)
    this.quietTimer?.remove();
    this.quietTimer = this.time.delayedCall(QUIET_MS, () => {
      this.quietTimer = null;
      if (this.phase === 'listen' && !this.leaving) this.momPlays(() => this.yourTurn());
    });
    this.shown.interrupted = ((this.shown.interrupted as number) ?? 0) + 1;
  }

  // ---------------------------------------------------------------- touch

  protected down(_p: Phaser.Input.Pointer, at: P) {
    const i = this.shellAt(at);
    if (i < 0) return;
    switch (this.phase) {
      case 'free':
        this.ring(i);
        this.poke();
        this.afterFree?.remove();
        if (++this.freeNotes >= FREE_NOTES) this.afterFree = this.time.delayedCall(QUIET_MS, () => this.startTunes());
        return;
      case 'listen':
        // (every tap starts the quiet again: Mom waits for her to finish)
        this.ring(i);
        this.interrupt();
        return;
      case 'copy':
        return this.copyTap(i);
      case 'sing':
      case 'yes':
      case 'finale':
        // (playing along with Mom or at the end: the shells always sing)
        this.ring(i, { soft: this.phase === 'sing' });
        return;
      default:
        return;
    }
  }

  private copyTap(i: number) {
    const tune = this.tunes[this.round];
    const want = tune[this.pos];
    if (i === want) {
      this.ring(i);
      this.poke();
      this.wrongRun = 0;
      if (++this.pos >= tune.length) this.tuneDone();
      return;
    }
    // Not the tune's note: a soft bubble, and the right shell blinks (Mom shows it). Two in a row: she plays it again.
    sfx(this, 'bubble-pop-soft', { minGapMs: 0 });
    const b = this.bells[i];
    this.tweens.add({ targets: b.img, angle: { from: -4, to: 4 }, duration: 90, yoyo: true, repeat: 1, onComplete: () => b.img.setAngle(0) });
    this.blink(want);
    this.miss();
    if (++this.wrongRun >= 2) {
      this.wrongRun = 0;
      this.stopHint();
      this.time.delayedCall(500, () => {
        if (this.phase !== 'copy' || this.leaving) return;
        // (she keeps what she played: Mom shows the whole tune, and her turn goes on from the same note)
        const keep = this.pos;
        this.momPlays(() => {
          this.begin('copy', null);
          this.pos = keep;
        }, { line: 'vo-song-again' });
      });
    }
  }

  private startTunes() {
    if (this.phase !== 'free' || this.leaving) return;
    this.round = 0;
    this.offerTune('vo-song-listen');
  }

  private tuneDone() {
    this.setPhase('yes');
    const last = this.round === this.tunes.length - 1;
    this.shown.rounds = this.round + 1;
    // all the tune's shells glow together, the party layer for a few bars, Marina cheers
    for (const i of new Set(this.tunes[this.round])) {
      const g = this.bells[i].glow;
      this.tweens.killTweensOf(g);
      g.setAlpha(0.9);
      this.tweens.add({ targets: g, alpha: 0, delay: 600, duration: 700 });
    }
    music.party();
    this.mom?.happy();
    this.pipa?.cheer();
    stars(this, (this.bells[0].at.x + this.bells[4].at.x) / 2, this.bells[2].at.y - 120 * this.L.k, 10, 60 * this.L.k);
    this.say('vo-song-yes', {
      ttlMs: 4000,
      done: () => this.time.delayedCall(500, () => {
        if (this.leaving) return;
        this.mom?.rest();
        if (!last) {
          this.round++;
          this.offerTune(null);
        } else if (this.level === 2) {
          // hard: Mom sings along to the last tune, the shells lighting with her
          this.momPlays(() => this.finale(), { line: 'vo-song-sing', sing: true });
        } else this.finale();
      }),
    });
  }

  // ---------------------------------------------------------------- the end

  private finale() {
    if (this.shown.done) return;
    this.setPhase('finale');
    this.shown.done = true;
    const L = this.L;
    const k = L.k;
    try {
      localStorage.setItem('lagoon.song', '1');
    } catch {
      /* the lagoon simply shows no mark */
    }
    music.party(true);
    sfx(this, 'cheer-jingle');
    this.mom?.celebrate();
    // every shell glows, one after the other, twice
    this.bells.forEach((b, j) => {
      this.time.delayedCall(j * 140, () => this.ring(b.i, { soft: true }));
      this.time.delayedCall(900 + j * 140, () => this.ring(b.i, { soft: true }));
    });
    confetti(this, L.cx, L.Y(200), 22, 28 * k);
    // Marina dances: a spin and a few happy hops
    const m = this.pipa;
    if (m) {
      this.tweens.add({ targets: m.box, angle: 360, duration: 900, ease: 'Sine.easeInOut', delay: 200, onComplete: () => m.box.setAngle(0) });
      [0, 700, 1400].forEach((t) => this.time.delayedCall(t + 1100, () => m.box.active && m.cheer()));
    }
    this.time.delayedCall(2200, () => this.photo());
  }

  /** The photo of the shells on the rock, in the sea's frame, kept in the memory book; "We made up a song together!". */
  private photo() {
    if (this.leaving) return;
    const L = this.L;
    const k = L.k;
    const cx = (this.bells[0].at.x + this.bells[4].at.x) / 2;
    const side = Math.min(L.H * 0.8, this.bells[4].at.x - this.bells[0].at.x + 360 * k);
    const bottom = Math.min(L.H, this.rockTop + 120 * k);
    const area = { x: Math.round(Math.max(0, cx - side / 2)), y: Math.round(Math.max(0, bottom - side)), w: Math.round(side), h: Math.round(side) };
    sfx(this, 'camera', { vary: false });
    let after = false;
    const show = (src: HTMLImageElement | null) => {
      if (after || this.leaving) return;
      after = true;
      const flash = this.add.rectangle(L.W / 2, L.H / 2, L.W * 1.2, L.H * 1.2, 0xffffff).setDepth(2000).setAlpha(0.9);
      this.tweens.add({ targets: flash, alpha: 0, duration: 380, ease: 'Quad.easeOut', onComplete: () => flash.destroy() });
      this.framePhoto(src, cx);
    };
    try {
      this.game.renderer.snapshotArea(area.x, area.y, area.w, area.h, (img) => show(img instanceof HTMLImageElement ? img : null));
    } catch {
      show(null);
    }
    this.time.delayedCall(1200, () => show(null));
  }

  private framePhoto(src: HTMLImageElement | null, cx: number) {
    const L = this.L;
    const k = L.k;
    const W = { x: 80, y: 80, w: 540, h: 540 };
    const s = Math.min(0.7 * k, (L.H * 0.62) / 780);
    const at = { x: cx, y: 30 * k + 390 * s };
    const parts: Phaser.GameObjects.GameObject[] = [];
    if (src) {
      try {
        const c = document.createElement('canvas');
        c.width = c.height = 420;
        c.getContext('2d')!.drawImage(src, 0, 0, 420, 420);
        let data = c.toDataURL('image/webp', 0.75);
        if (!data.startsWith('data:image/webp')) data = c.toDataURL('image/png');
        this.shown.photo = data.length;
        void keepPhoto('mermaid-song', data);
      } catch {
        /* the photo is simply not kept */
      }
      const key = 'sea-song-photo';
      if (this.textures.exists(key)) this.textures.remove(key);
      this.textures.addImage(key, src);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.textures.exists(key) && this.textures.remove(key));
      const pic = new Phaser.GameObjects.Image(this, (W.x + W.w / 2 - 350) * s, (W.y + W.h / 2 - 390) * s, key);
      pic.setScale((W.w * s) / pic.width, (W.h * s) / pic.height);
      parts.push(pic);
    }
    parts.push(new Phaser.GameObjects.Image(this, 0, 0, 'photo-frame-sea').setScale(s));
    const box = this.add.container(at.x, at.y, parts).setDepth(800).setScale(0.2).setAlpha(0);
    this.tweens.add({ targets: box, scale: 1, alpha: 1, angle: { from: -8, to: -2 }, duration: 520, ease: 'Back.easeOut' });
    this.time.delayedCall(700, () => {
      stars(this, at.x, at.y - 200 * s, 14, 70 * k);
      this.pipa?.cheer();
      let gone = false;
      const home = () => {
        if (gone) return;
        gone = true;
        this.time.delayedCall(1500, () => this.leave('finale'));
      };
      this.say('vo-song-done', { ttlMs: 5000, done: home });
      this.time.delayedCall(7000, home);
    });
  }

  /** Back to the lagoon (where Mom asks "What shall we do next?"), whether from the home button or the end. */
  protected leave(_from: 'recipe' | 'finale') {
    if (this.leaving) return;
    this.leaving = true;
    this.shutdown();
    voice.stop();
    this.scene.start('Lagoon', { from: 'activity' });
  }

  // ---------------------------------------------------------------- Mom's hand, her help, the harness

  /** The shell a child would tap next (free: one she has not heard yet; copy: the tune's next note). */
  plan(): P | null {
    if (this.phase === 'free') return this.bells[(this.freeNotes * 2) % 5].at;
    if (this.phase === 'copy') return this.bells[this.tunes[this.round][this.pos]].at;
    return null;
  }

  protected way(): HandMotion | null {
    const at = this.plan();
    return at ? tapMotion(at, this.L.k) : null;
  }

  protected helpOnce() {
    const at = this.plan();
    if (!at) return false;
    const i = this.shellAt(at);
    this.hand.play(tapMotion(at, this.L.k));
    this.time.delayedCall(600, () => {
      if (this.leaving) return;
      if (this.phase === 'free') {
        // (Mom plays one, then offers her tune at once)
        this.ring(i);
        this.helped();
        this.time.delayedCall(900, () => this.startTunes());
      } else if (this.phase === 'copy') {
        this.copyTap(i);
        this.helped();
      } else this.helped();
    });
    return true;
  }

  protected lookTarget(): P | null {
    return null;
  }
}
