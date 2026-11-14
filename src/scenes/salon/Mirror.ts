import Phaser from 'phaser';
import { FX_SOFT } from '../../core/assets';
import { music } from '../../core/audio';
import * as paper from '../../core/paper';
import { stars } from '../../core/fx';
import type { HandMotion } from '../../core/hand';
import { keepLook, markShowOff } from '../../core/salon';
import { ART_SALON } from '../../core/salonAssets';
import { delight, giggle, surprise } from '../../core/salonDress';
import { sfx } from '../../core/sfx';
import { TUNING } from '../../core/tuning';
import { breath } from '../SeaGame';
import type { P } from '../MiniGame';
import type { SalonStage, SeaSalon } from '../SeaSalon';

const T = TUNING.salon;
/** salon-mirror (560x720) and its clear glass (ART_SALON.mirrorWindow), native size. */
const MIRROR = { w: 560, h: 720 };
const WIN = ART_SALON.mirrorWindow;
/** The reflection's own texture (one per visit; gone with the scene). */
const REFLECTION = 'salon-reflection';
/** Her size while she swims the show (of her size in the chair). */
const SWIM_SCALE = 0.8;

type Part = 'mirror' | 'look' | 'photo' | 'show' | 'bye';

/**
 * The end of the visit (salon PR 4, research/mermaid-dressup-spec.md 5.6): the payoff of the whole salon. It runs by
 * itself (no done button), every touch on her or the mirror is answered, the home button works throughout.
 *
 * 1. The mirror. All visit long it stood turned away behind the chair (narrow and a little dim: SeaSalon `build`). Mom:
 *    "Ready? Look in the mirror!" It turns round to her (the glass shows its face with a chime and a glint), and in it
 *    she sees herself: her reflection (a snapshot of her head and shoulders, the right shape for the glass, flipped like
 *    a mirror: no crop, so the trimmed-texture pitfall of flipX + setCrop does not apply). She is surprised, then
 *    delighted; her reflection hops with her. If the snapshot fails the glass simply shines.
 * 2. "Look what you made! She loves it!" She spins with joy; the glass melts into sparkles.
 * 3. The photo (the sea's ta-da and frame, kept in the memory book as `mermaid-salon`), then it flies to the corner
 *    where the column was, tilted like a picture pinned up.
 * 4. The show: a beam of light comes on over the sand, little lights along a runway, "Swim, little mermaid, show us your
 *    new look!" She swims left, right, left and back along an arc, a trail of sparkles and bubbles behind her, the two
 *    little fish following; the party music; Mom claps. A tap on her as she swims: a pirouette (an answer, never a lure).
 * 5. Back in her chair, happy; her look is kept (it already was at the start: the home button anywhere keeps it too),
 *    Mom's warm goodbye, and the lagoon, where Marina wears hers.
 */
export class Mirror implements SalonStage {
  readonly id = 'mirror' as const;
  readonly free = false;
  readonly hasDone = false;
  private part: Part = 'mirror';
  private reflection?: Phaser.GameObjects.Image;
  private glass?: { x: number; y: number; w: number; h: number };
  private photo?: Phaser.GameObjects.Container;
  /** The swim: where she is along it (0..1), and whether a pirouette is on. */
  private swim = { t: 0 };
  private swimming = false;
  private spinning = false;
  private beam?: Phaser.GameObjects.Image;
  private pool?: Phaser.GameObjects.Image;
  private fish: { img: Phaser.GameObjects.Image; lag: number }[] = [];
  private trail: P[] = [];
  private trailMs = 0;
  private bubbleMs = 0;
  private things: Phaser.GameObjects.GameObject[] = [];
  private glinted = 0;

  constructor(private h: SeaSalon) {}

  private get k() {
    return this.h.k;
  }

  begin() {
    const h = this.h;
    const c = h.customer;
    if (!c) return h.bye('vo-salon-bye');
    // her look stays, whatever happens next (the home button during the show too)
    keepLook(c.id, c.look);
    markShowOff(c.id);
    h.shown.mirror = { part: 'mirror' };
    h.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.end());
    h.zoom(false);
    this.setVanity();
    // (taps are answered from now on: she giggles, the mirror glints, a pirouette in the show)
    h.play(null);
    h.time.delayedCall(T.zoomMs + 60, () => this.snapReflection());
    h.time.delayedCall(T.zoomMs + 120, () => {
      h.speak('vo-salon-mirror', { ttlMs: 5000 });
      const g = this.glassBox();
      h.theMom?.aimArmAt(g.x, g.y);
    });
    h.time.delayedCall(T.zoomMs + 900, () => this.turnMirror());
  }

  /**
   * The little coral table with its jars (and its secret, salon/vanity.ts): where the room has space for it the salon
   * stood it on the sand all visit; elsewhere (most screens: the column takes the sand) it comes now, where the column
   * was, under the photo that will be pinned there.
   */
  private setVanity() {
    const h = this.h;
    if (h.vanity?.active || !h.textures.exists('salon-vanity')) return;
    const L = h.layout;
    const S = h.table.salon;
    const k = this.k;
    const s = Math.min(0.62 * k, (S.room.x0 * 0.85) / 520);
    if (s < 0.3 * k) return;
    const v = h.add.image(Math.max(S.room.x0 * 0.5, 260 * s), L.Y(994) - 140 * s, 'salon-vanity').setScale(s).setDepth(4);
    paper.appear(h, v, 2);
    h.vanity = v;
    h.shown.vanity = { x: v.x, y: v.y };
  }

  // ---------------------------------------------------------------- 1. the mirror

  /** The glass of the mirror where it stands now (world box, centre and size). */
  private glassBox() {
    const m = this.h.mirror;
    const sx = Math.abs(m.scaleX);
    const sy = m.scaleY;
    const cx = m.x + (WIN.x + WIN.w / 2 - MIRROR.w / 2) * sx;
    const cy = m.y + (WIN.y + WIN.h / 2 - MIRROR.h / 2) * sy;
    return { x: cx, y: cy, w: WIN.w * sx, h: WIN.h * sy };
  }

  /** Her head and shoulders, in the glass's own shape (no crop needed), taken before the mirror comes round. */
  private snapReflection() {
    const h = this.h;
    const c = h.customer;
    if (!c || !h.scene.isActive()) return;
    const L = h.layout;
    const s = c.ch.box.scaleX;
    const hh = 440 * s;
    const ww = (hh * WIN.w) / WIN.h;
    const mid = c.toWorld({ x: 300, y: 300 });
    const a = {
      x: Math.round(Phaser.Math.Clamp(mid.x - ww / 2, 0, L.W - ww)),
      y: Math.round(Phaser.Math.Clamp(mid.y - hh / 2, 0, L.H - hh)),
      w: Math.round(Math.min(ww, L.W)),
      h: Math.round(Math.min(hh, L.H)),
    };
    let got = false;
    try {
      h.game.renderer.snapshotArea(a.x, a.y, a.w, a.h, (img) => {
        if (got || !h.scene.isActive() || !(img instanceof HTMLImageElement)) return;
        got = true;
        if (h.textures.exists(REFLECTION)) h.textures.remove(REFLECTION);
        h.textures.addImage(REFLECTION, img);
        h.shown.mirror = { ...(h.shown.mirror as object), reflection: [a.w, a.h] };
      });
    } catch {
      /* the glass simply shines */
    }
  }

  /** The mirror turns round to her (narrow and dim → its face), the glass shows her reflection. */
  private turnMirror() {
    const h = this.h;
    const m = h.mirror;
    const S = h.table.salon;
    const k = this.k;
    if (!m?.active || this.part !== 'mirror') return;
    h.tweens.killTweensOf(m);
    // (a little to the right and upright, in front of the chair, behind her: the glass clear of her hair)
    const to = { x: Math.min(S.mirror.x + 50 * k, S.room.x1 - (MIRROR.w / 2 - 30) * S.mirror.scale), y: S.mirror.y };
    m.setDepth(4);
    h.tweens.add({ targets: m, x: to.x, y: to.y, angle: 0, duration: 700, ease: 'Sine.easeInOut' });
    h.tweens.chain({
      targets: m,
      tweens: [
        { scaleX: 0, duration: 260, ease: 'Quad.easeIn', onComplete: () => m.clearTint() },
        { scaleX: S.mirror.scale * 1.06, duration: 300, ease: 'Quad.easeOut' },
        { scaleX: S.mirror.scale, scaleY: S.mirror.scale, duration: 220, ease: 'Sine.easeInOut' },
      ],
    });
    h.time.delayedCall(560, () => {
      sfx(h, 'mirror-chime');
      const g = this.glassAt(to);
      this.glass = g;
      this.glow(g, 0xfff4d6, 1.5);
      h.sparkle({ x: g.x + g.w * 0.3, y: g.y - g.h * 0.42 }, [0xffffff, 0xfff4b8], 5);
      this.showReflection(g);
    });
  }

  /** The glass's box when the mirror stands at `at` facing her. */
  private glassAt(at: P) {
    const s = this.h.table.salon.mirror.scale;
    return {
      x: at.x + (WIN.x + WIN.w / 2 - MIRROR.w / 2) * s,
      y: at.y + (WIN.y + WIN.h / 2 - MIRROR.h / 2) * s,
      w: WIN.w * s,
      h: WIN.h * s,
    };
  }

  private showReflection(g: { x: number; y: number; w: number; h: number }) {
    const h = this.h;
    const c = h.customer;
    if (h.textures.exists(REFLECTION)) {
      const r = h.add.image(g.x, g.y, REFLECTION).setFlipX(true).setDepth(4.1).setAlpha(0);
      // (inset a hair so the glass's own rim stays: the picture lies in the glass, not over the frame)
      r.setDisplaySize(g.w * 0.97, g.h * 0.97);
      this.reflection = r;
      h.tweens.add({ targets: r, alpha: 0.94, duration: 520, ease: 'Sine.easeOut' });
      // her reflection breathes with her (a very little)
      h.tweens.add({ targets: r, scaleY: r.scaleY * 1.012, duration: 2100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      h.shown.mirror = { ...(h.shown.mirror as object), shown: true };
    }
    this.sweep(g, 700);
    // she sees herself: a little surprise, then delight (her reflection hops with her)
    h.time.delayedCall(420, () => {
      if (!c?.ch.box.active) return;
      surprise(h, c, 380);
      h.time.delayedCall(520, () => {
        if (this.part !== 'mirror' || !c.ch.box.active) return;
        delight(h, c);
        this.hopReflection();
        this.part = 'look';
        this.lookParty();
      });
    });
  }

  /** A soft glint sliding across the glass (inside it). */
  private sweep(g: { x: number; y: number; w: number; h: number }, delay = 0) {
    const h = this.h;
    const s = h.add.image(g.x - g.w * 0.3, g.y, FX_SOFT).setTint(0xffffff).setBlendMode(Phaser.BlendModes.ADD).setDepth(4.2).setAlpha(0).setAngle(18);
    s.setDisplaySize(g.w * 0.22, g.h * 0.9);
    this.things.push(s);
    h.tweens.add({ targets: s, x: g.x + g.w * 0.3, delay, duration: 760, ease: 'Sine.easeInOut', onComplete: () => s.destroy() });
    h.tweens.add({ targets: s, alpha: 0.55, delay, duration: 380, yoyo: true, ease: 'Sine.easeInOut' });
  }

  private glow(g: { x: number; y: number; w: number; h: number }, tint: number, grow: number) {
    const h = this.h;
    const o = h.add.image(g.x, g.y, FX_SOFT).setTint(tint).setBlendMode(Phaser.BlendModes.ADD).setDepth(3.9).setAlpha(0);
    o.setDisplaySize(g.w * grow, g.h * grow);
    this.things.push(o);
    h.tweens.add({ targets: o, alpha: 0.75, duration: 300, yoyo: true, hold: 200, ease: 'Sine.easeInOut', onComplete: () => o.destroy() });
  }

  /** Her reflection hops when she does (her cheer: up and back). */
  private hopReflection() {
    const r = this.reflection;
    if (!r?.active) return;
    const y = this.glass?.y ?? r.y;
    this.h.tweens.add({ targets: r, y: y - 16 * this.k, duration: 170, yoyo: true, ease: 'Quad.easeOut', onComplete: () => r.setY(y) });
  }

  // ---------------------------------------------------------------- 2. "Look what you made!", she spins

  private lookParty() {
    const h = this.h;
    const c = h.customer;
    h.shown.mirror = { ...(h.shown.mirror as object), part: 'look' };
    h.speak('vo-salon-look', { ttlMs: 5000 });
    h.time.delayedCall(700, () => h.theMom?.celebrate());
    h.time.delayedCall(2600, () => {
      if (!c?.ch.box.active || this.part !== 'look') return;
      c.ch.setMood('rest');
      c.ch.partyDance(true);
      giggle(h, c.id);
      // the glass melts into sparkles while she turns (a mirror can't follow a spin)
      const g = this.glass;
      const r = this.reflection;
      if (g) {
        h.sparkle({ x: g.x, y: g.y }, [0xffffff, 0xfff4b8, 0xffd6ea], 10);
        this.sweep(g);
      }
      if (r?.active) {
        h.tweens.killTweensOf(r);
        h.tweens.add({ targets: r, alpha: 0, duration: 600, ease: 'Sine.easeIn' });
      }
    });
    h.time.delayedCall(4500, () => this.snap());
  }

  // ---------------------------------------------------------------- 3. the photo

  private snap() {
    const h = this.h;
    const c = h.customer;
    if (!c || this.part !== 'look' || !h.scene.isActive()) return;
    this.part = 'photo';
    h.shown.mirror = { ...(h.shown.mirror as object), part: 'photo' };
    const L = h.layout;
    const S = h.table.salon;
    const side = Math.min(L.H * 0.92, 720 * S.seat.scale);
    const mid = c.toWorld({ x: 300, y: 360 });
    const area = { x: mid.x - side / 2, y: Math.max(0, mid.y - side / 2), w: side, h: side };
    const at: P = { x: (S.room.x0 + S.room.x1) / 2, y: L.cy };
    h.photo(area, at, (photo) => {
      this.photo = photo;
      delight(h, c, { hop: false });
      h.time.delayedCall(1500, () => this.pinPhoto());
    });
  }

  /** The photo flies to where the column was, tilted like a picture pinned up; then the show. */
  private pinPhoto() {
    const h = this.h;
    const p = this.photo;
    if (this.part !== 'photo') return;
    if (p?.active) {
      const L = h.layout;
      const S = h.table.salon;
      const to = { x: Math.max(S.room.x0 * 0.5, 190 * this.k), y: L.H * 0.42 };
      const f = Math.min(0.8, Math.max(300 * this.k, S.room.x0 * 0.85) / Math.max(1, p.getBounds().width));
      sfx(h, 'whoosh-soft', { pitch: 'vary', volume: 0.7 });
      h.tweens.killTweensOf(p);
      h.tweens.add({ targets: p, x: to.x, y: to.y, scale: p.scale * Math.max(0.45, f), angle: -6, duration: 700, ease: 'Quad.easeInOut' });
      h.shown.mirror = { ...(h.shown.mirror as object), pinned: to };
      // (pinned up on the water behind her: she swims in front of it in the show)
      h.time.delayedCall(700, () => p.active && p.setDepth(5.8));
    }
    h.time.delayedCall(760, () => this.show());
  }

  // ---------------------------------------------------------------- 4. the show

  /** Where she is along the swim (t 0..1): left, right, left, home, rising a little and dipping. */
  private swimAt(t: number): P & { angle: number } {
    const S = this.h.table.salon;
    const seat = S.seat;
    const roomW = S.room.x1 - S.room.x0;
    const s = seat.scale * SWIM_SCALE;
    // (her body is about 260 frame units wide at its widest; the column is gone, so she has the left of the screen too;
    // on the right she stops short of Mom's face)
    const half = 250 * s;
    const k = this.k;
    const left = Math.max(half + 60 * k, seat.x - Math.max(roomW * 0.42, 560 * k));
    const right = Math.max(seat.x + 80 * k, Math.min(S.room.x1 - half * 0.5, seat.x + Math.max(roomW * 0.3, 360 * k)));
    const a = Math.sin(3 * Math.PI * t);
    // left at t 1/6, right at 1/2, left at 5/6, home at 1
    const x = a >= 0 ? seat.x - (seat.x - left) * a : seat.x - (right - seat.x) * a;
    const lift = 170 * k;
    const y = seat.y - lift * Math.sin(Math.PI * t) - 50 * k * Math.abs(a);
    const angle = -Math.cos(3 * Math.PI * t) * 8;
    return { x, y, angle };
  }

  private show() {
    const h = this.h;
    const c = h.customer;
    if (!c?.ch.box.active || this.part !== 'photo') return;
    this.part = 'show';
    h.shown.mirror = { ...(h.shown.mirror as object), part: 'show' };
    const L = h.layout;
    const S = h.table.salon;
    const k = this.k;
    music.party(true);
    h.theMom?.rest();
    h.speak('vo-salon-show', { ttlMs: 5000 });
    // the light comes on: a beam from the surface, a pool of light on the sand, the runway's little lights one by one
    const floorY = S.room.y1 - 30 * k;
    const beam = h.add.image(S.seat.x, L.H * 0.42, FX_SOFT).setTint(0xfff3d6).setBlendMode(Phaser.BlendModes.ADD).setDepth(4.5).setAlpha(0);
    beam.setDisplaySize(520 * k, L.H * 1.25);
    const pool = h.add.image(S.seat.x, floorY, FX_SOFT).setTint(0xfff1c4).setBlendMode(Phaser.BlendModes.ADD).setDepth(4.4).setAlpha(0);
    pool.setDisplaySize(720 * k, 150 * k);
    this.beam = beam;
    this.pool = pool;
    this.things.push(beam, pool);
    h.tweens.add({ targets: beam, alpha: 0.32, duration: 500, ease: 'Sine.easeOut' });
    h.tweens.add({ targets: pool, alpha: 0.6, duration: 500, ease: 'Sine.easeOut' });
    const x0 = this.swimAt(1 / 6).x;
    const x1 = this.swimAt(1 / 2).x;
    const n = 7;
    for (let i = 0; i < n; i++) {
      const x = x0 + ((x1 - x0) * i) / (n - 1);
      const dot = h.add.image(x, floorY + 10 * k, FX_SOFT).setTint(i % 2 ? 0xffd6ea : 0xfff4b8).setBlendMode(Phaser.BlendModes.ADD).setDepth(4.4).setAlpha(0);
      dot.setDisplaySize(70 * k, 40 * k);
      this.things.push(dot);
      h.tweens.add({ targets: dot, alpha: 0.95, delay: 120 + i * 70, duration: 200, ease: 'Sine.easeOut', onComplete: () => {
        h.tweens.add({ targets: dot, alpha: { from: 0.95, to: 0.45 }, duration: 520 + i * 40, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      } });
    }
    // the two little fish wait off to the side, then follow her
    if (h.textures.exists('little-fish')) {
      for (const lag of [260, 460]) {
        const img = h.add.image(S.seat.x + 340 * k, S.seat.y - 60 * k, 'little-fish').setScale(0.7 * k).setDepth(5.5).setAlpha(0);
        this.fish.push({ img, lag });
        this.things.push(img);
      }
    }
    h.theMom?.cheer();
    // she leaves the chair and swims (a proxy along the path: her own tweens, a hop or a pirouette, never fight it)
    h.time.delayedCall(700, () => {
      if (this.part !== 'show' || !c.ch.box.active) return;
      h.tweens.killTweensOf(c.ch.box);
      c.ch.box.setDepth(6).setScale(S.seat.scale * SWIM_SCALE);
      this.swimming = true;
      this.swim.t = 0;
      this.trail = [];
      this.fish.forEach((f) => h.tweens.add({ targets: f.img, alpha: 1, duration: 300 }));
      sfx(h, 'splash-soft');
      h.tweens.add({
        targets: this.swim,
        t: 1,
        duration: Math.max(T.showMs, 2600) * 1.6,
        ease: 'Sine.easeInOut',
        onComplete: () => this.home(),
      });
      h.time.delayedCall(900, () => this.part === 'show' && h.theMom?.celebrate());
    });
  }

  /** Each frame of the swim: she follows the path, the trail and the fish follow her, the beam too. */
  tick(delta: number) {
    if (!this.swimming) return;
    const h = this.h;
    const c = h.customer;
    if (!c?.ch.box.active) return;
    const p = this.swimAt(this.swim.t);
    const box = c.ch.box;
    box.setPosition(p.x, p.y);
    if (!this.spinning) box.setAngle(p.angle);
    this.trail.unshift({ x: p.x, y: p.y });
    if (this.trail.length > 60) this.trail.length = 60;
    if (this.beam?.active) this.beam.x += (p.x - this.beam.x) * 0.12;
    if (this.pool?.active) this.pool.x += (p.x - this.pool.x) * 0.12;
    const k = this.k;
    const s = box.scaleY;
    // sparkles from her tail every 120 ms, a breath of bubbles now and then
    this.trailMs += delta;
    if (this.trailMs >= 120) {
      this.trailMs = 0;
      const tail = c.toWorld({ x: 300, y: 600 });
      h.sparkle({ x: tail.x, y: tail.y }, [0xffffff, 0xfff4b8, 0xffd6ea], 3);
    }
    this.bubbleMs += delta;
    if (this.bubbleMs >= 700) {
      this.bubbleMs = 0;
      breath(h, p.x + 80 * s, p.y - 260 * s, k, 2);
    }
    // the fish follow, a little behind (frames ago), facing the way they swim
    for (const f of this.fish) {
      const i = Math.min(this.trail.length - 1, Math.round(f.lag / 16));
      const q = this.trail[i];
      if (!q || !f.img.active) continue;
      const tx = q.x + (f.lag > 300 ? -1 : 1) * 160 * s;
      const ty = q.y + (f.lag > 300 ? 120 : -40) * s;
      const dx = tx - f.img.x;
      if (Math.abs(dx) > 1) f.img.setFlipX(dx > 0);
      f.img.setPosition(f.img.x + dx * 0.2, f.img.y + (ty - f.img.y) * 0.2);
    }
  }

  /** A tap on her as she swims: a pirouette (once at a time). */
  private pirouette() {
    const h = this.h;
    const c = h.customer;
    if (!c || this.spinning) return;
    this.spinning = true;
    const box = c.ch.box;
    giggle(h, c.id);
    c.ch.setMood('happy');
    h.sparkle({ x: box.x, y: box.y - 120 * box.scaleY }, [0xffffff, 0xfff4b8, 0xffd6ea], 8);
    sfx(h, 'shimmer', { pitch: 'vary', minGapMs: 200 });
    const spin = { a: 0 };
    h.tweens.add({
      targets: spin,
      a: 360,
      duration: 560,
      ease: 'Sine.easeInOut',
      onUpdate: () => box.active && box.setAngle(spin.a),
      onComplete: () => {
        this.spinning = false;
        h.shown.pirouettes = ((h.shown.pirouettes as number) ?? 0) + 1;
        h.time.delayedCall(300, () => c.ch.box.active && c.ch.mood === 'happy' && c.ch.setMood('rest'));
      },
    });
  }

  // ---------------------------------------------------------------- 5. home, and the goodbye

  private home() {
    const h = this.h;
    const c = h.customer;
    if (this.part !== 'show') return;
    this.part = 'bye';
    this.swimming = false;
    h.shown.mirror = { ...(h.shown.mirror as object), part: 'bye' };
    if (!c?.ch.box.active) return h.bye('vo-salon-bye');
    const S = h.table.salon;
    c.ch.box.setAngle(0);
    c.ch.moveTo(S.seat, 500);
    for (const f of this.fish) h.tweens.add({ targets: f.img, x: f.img.x + 500 * this.k, alpha: 0, duration: 900, ease: 'Sine.easeIn' });
    if (this.beam) h.tweens.add({ targets: this.beam, alpha: 0, duration: 900 });
    h.time.delayedCall(520, () => {
      if (!c.ch.box.active) return;
      c.ch.box.setDepth(5);
      sfx(h, 'splash-soft', { volume: 0.6 });
      delight(h, c);
      stars(h, c.ch.box.x, c.ch.box.y - 200 * S.seat.scale, 10, 60 * this.k);
      h.theMom?.happy();
    });
    h.time.delayedCall(1100, () => h.bye('vo-salon-bye'));
  }

  // ---------------------------------------------------------------- touches

  way(): HandMotion | null {
    return null;
  }
  helpOnce() {
    return false;
  }
  hintAfter() {
    // (nothing to hint: the ending runs by itself)
    return 600000;
  }
  lookTarget(): P | null {
    if (this.part === 'mirror' || this.part === 'look') return this.glass ?? this.glassBox();
    return null;
  }
  down(_p: Phaser.Input.Pointer, at: P) {
    const h = this.h;
    const c = h.customer;
    if (!c) return;
    if (this.swimming) {
      const box = c.ch.box;
      const s = box.scaleY;
      if (Math.abs(at.x - box.x) < 280 * s && at.y > box.y - 360 * s && at.y < box.y + 340 * s) this.pirouette();
      return;
    }
    if (h.tickleCustomer(at)) {
      if (this.part === 'look') this.hopReflection();
      return;
    }
    // a tap on the glass: it glints and chimes softly
    const g = this.glass;
    if (g && Math.abs(at.x - g.x) < g.w * 0.6 && Math.abs(at.y - g.y) < g.h * 0.6 && h.time.now - this.glinted > 600) {
      this.glinted = h.time.now;
      this.sweep(g);
      h.sparkle({ x: at.x, y: at.y }, [0xffffff, 0xfff4b8], 4);
      sfx(h, 'mirror-chime', { volume: 0.5, pitch: 'vary', minGapMs: 500 });
    }
  }

  end() {
    this.swimming = false;
    const h = this.h;
    if (h.textures?.exists(REFLECTION)) {
      this.reflection?.destroy();
      this.reflection = undefined;
      h.textures.remove(REFLECTION);
    }
  }
}
