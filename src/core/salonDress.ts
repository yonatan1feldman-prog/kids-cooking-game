import Phaser from 'phaser';
import { IMAGES } from './assets';
import { ART_SALON } from './salonAssets';
import { CUSTOMER, GEM_SLOTS, hairHex, hexOf, PAINT_HEX, tailHex, type CustomerId, type Look } from './salon';
import { sfx } from './sfx';
import type { CharacterDef } from '../recipes/types';
import { Character } from '../steps/Character';
import type { Spot } from './stage';

/**
 * Dressing a customer (research/mermaid-dressup-spec.md 6): one place that turns a `Look` into layers in her container,
 * for the salon, the bench where the three wait (salon PR 4) and Marina in the lagoon (salon PR 4). The order, back to
 * front: hair-back, tail, tail-shine, [her body], top, necklace, [salon PR 2's face paint], [her eyes], [her mouth], gems,
 * glitter, things on her skin (the sand), hair-front, hair-shine, things in her hair (seaweed), clip, crown.
 *
 * Her own layers breathe (Character); every layer added here follows that breath frame by frame (`sync`), so the hair
 * never slides on her head. Every 600x700 layer hangs from her feet like hers; a small thing (a gem, a spot of sand) sits
 * at its point of her frame. `dy`/`dx` (frame units) and `grow` on a layer are for little motions on top (a new hair
 * style arriving, the fringe lifted to show what hides under it): tween those, never the image's own position or scale.
 */

/** Her feet in the frame, from its centre (Character's FOOT: feet at y 684 of 700). */
const FOOT = 334;
const FRAME = { w: 600, h: 700 };

/** A customer's layers as a Character (the three share one rig: gen_customers.py). */
export function customerDef(id: CustomerId): CharacterDef {
  return {
    body: `cust-${id}-body`,
    eyesOpen: `cust-${id}-eyes-open`,
    eyesBlink: `cust-${id}-eyes-blink`,
    eyesSurprised: `cust-${id}-eyes-surprised`,
    eyesHappy: `cust-${id}-eyes-happy`,
    mouthClosed: `cust-${id}-mouth-closed`,
    mouthOpen: `cust-${id}-mouth-open`,
    mouthChew: `cust-${id}-mouth-chew`,
  } as CharacterDef;
}

const rasterOf = (key: string) => ((IMAGES as Record<string, { raster?: number }>)[key]?.raster ?? 1);

/** Where an added layer sits: on her frame (hangs from her feet like her own layers) or at a point of it. */
type Layer = {
  img: Phaser.GameObjects.Image;
  /** A point of her frame (small things), or null (a 600x700 layer). */
  at: { x: number; y: number } | null;
  /** Its size at rest (point things: scale at her scale 1; frame layers: 1). */
  base: number;
  /** Little motions on top, tweened by the stages. */
  m: { dx: number; dy: number; grow: number };
};

/** The named places in the stack, in order (back to front). `body`, `eyes`, `mouth` are hers. */
const ORDER = [
  'hair-back', 'tail', 'tail-shine', 'body', 'top', 'necklace', 'face', 'eyes', 'mouth', 'gems', 'glitter', 'skin',
  'hair-front', 'hair-shine', 'hair', 'clip', 'crown',
] as const;
export type DressSlot = (typeof ORDER)[number];

/**
 * One customer dressed: her Character and the layers on her. `apply(look)` changes what she wears (keeping what did not
 * change); `attach` puts a thing of a stage (sand, seaweed) into the stack.
 */
export class Dressing {
  look: Look;
  private named = new Map<string, Layer>();
  private extra: { slot: DressSlot; layer: Layer }[] = [];

  constructor(private scene: Phaser.Scene, readonly ch: Character, readonly id: CustomerId, look: Look) {
    this.look = cloneLook(look);
    const sync = () => this.sync();
    scene.events.on(Phaser.Scenes.Events.UPDATE, sync);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, sync));
    ch.box.once(Phaser.GameObjects.Events.DESTROY, () => scene.events.off(Phaser.Scenes.Events.UPDATE, sync));
    this.apply(look);
  }

  /** Her layer called `name` (hair-back, hair-front, hair-shine, tail, tail-shine, top, necklace, clip, crown). */
  get(name: string): Phaser.GameObjects.Image | undefined {
    return this.named.get(name)?.img;
  }
  /** The little motions on a named layer (tween dx / dy / grow). */
  motion(name: string) {
    return this.named.get(name)?.m;
  }

  /**
   * What she wears now. Returns the layers that are new (a stage makes them arrive) and the ones taken off (already out
   * of the stack; the caller lets them go: `leave`).
   */
  apply(look: Look): { added: Phaser.GameObjects.Image[]; removed: Phaser.GameObjects.Image[] } {
    this.look = cloneLook(look);
    const id = this.id;
    const want = new Map<string, { key: string; tint?: number; at?: { x: number; y: number }; base?: number }>();
    want.set('hair-back', { key: `hair-back-${look.hair}`, tint: hairHex(id, look.hairColour) });
    want.set('tail', { key: `tail-${look.tail}`, tint: tailHex(id, look.tailColour) });
    want.set('tail-shine', { key: `tail-${look.tail}-shine` });
    want.set('top', { key: `top-${look.top}` });
    if (look.necklace === 'marina') want.set('necklace', { key: 'necklace-marina', at: { x: ART_SALON.neck.x, y: ART_SALON.neck.y + 34 }, base: 1 });
    else if (look.necklace) want.set('necklace', { key: `necklace-${look.necklace}` });
    look.gems.forEach((g, i) => want.set(`gem-${i}`, { key: `gem-${g.kind}`, at: GEM_SLOTS[g.slot], base: 1 }));
    look.glitter.forEach((p, i) => want.set(`glitter-${i}`, { key: 'fx-sparkle', at: { x: p[0], y: p[1] }, base: 0.34, tint: i % 2 ? 0xfff4b8 : 0xffffff }));
    want.set('hair-front', { key: `hair-front-${look.hair}`, tint: hairHex(id, look.hairColour) });
    if (look.shine) want.set('hair-shine', { key: `hair-shine-${look.hair}` });
    if (look.clip) want.set('clip', { key: 'clip-flower' });
    if (look.crown) want.set('crown', { key: `crown-${look.crown}` });

    const added: Phaser.GameObjects.Image[] = [];
    const removed: Phaser.GameObjects.Image[] = [];
    for (const [name, l] of this.named) {
      const w = want.get(name);
      if (!w || w.key !== l.img.texture.key) {
        removed.push(l.img);
        this.named.delete(name);
      }
    }
    for (const [name, w] of want) {
      let l = this.named.get(name);
      if (!l) {
        if (!this.scene.textures.exists(w.key)) continue;
        const img = new Phaser.GameObjects.Image(this.scene, 0, FOOT, w.key);
        if (w.at) img.setOrigin(0.5, 0.5);
        else img.setOrigin(0.5, 0.5 + FOOT / FRAME.h);
        l = { img, at: w.at ?? null, base: w.base ?? 1, m: { dx: 0, dy: 0, grow: 1 } };
        this.named.set(name, l);
        added.push(img);
      }
      if (w.tint !== undefined) l.img.setTint(w.tint);
      else l.img.clearTint();
    }
    // her mouth: the lipstick (salon PR 2), else her own lips' colour (the mouths are drawn white)
    this.ch.parts.mouth.setTint(look.lips ? hexOf(PAINT_HEX[look.lips]) : hexOf(CUSTOMER[id].lips));
    for (const r of removed) this.ch.box.remove(r);
    this.restack();
    this.sync();
    return { added, removed };
  }

  /** A stage's own thing in her stack (a spot of sand on her skin, a bit of seaweed in her hair), at a point of her frame. */
  attach(img: Phaser.GameObjects.Image, slot: DressSlot, at: { x: number; y: number }, base = 1) {
    img.setOrigin(0.5, 0.5);
    const layer: Layer = { img, at, base, m: { dx: 0, dy: 0, grow: 1 } };
    this.extra.push({ slot, layer });
    img.once(Phaser.GameObjects.Events.DESTROY, () => (this.extra = this.extra.filter((e) => e.layer !== layer)));
    this.restack();
    this.sync();
    return layer.m;
  }
  detach(img: Phaser.GameObjects.Image) {
    this.extra = this.extra.filter((e) => e.layer.img !== img);
    this.ch.box.remove(img);
  }

  /** Lets go of layers `apply` took off: they fade (and rise a little) in her container, then go. */
  leave(imgs: Phaser.GameObjects.Image[], ms = 220) {
    for (const img of imgs) {
      this.ch.box.add(img);
      this.scene.tweens.add({ targets: img, alpha: 0, y: img.y - 30 * (img.scaleY || 1), duration: ms, ease: 'Quad.easeIn', onComplete: () => img.destroy() });
    }
  }

  /** A layer arriving: from a little above, clear, settling with an overshoot (paper's `appear`, kept on her head). */
  arrive(img: Phaser.GameObjects.Image, opts: { from?: number; ms?: number; delay?: number } = {}) {
    const l = [...this.named.values(), ...this.extra.map((e) => e.layer)].find((q) => q.img === img);
    if (!l) return;
    img.setAlpha(0);
    l.m.dy = -(opts.from ?? 40);
    l.m.grow = 1.08;
    this.scene.tweens.add({ targets: img, alpha: 1, duration: (opts.ms ?? 300) * 0.6, delay: opts.delay ?? 0 });
    this.scene.tweens.add({ targets: l.m, dy: 0, grow: 1, duration: opts.ms ?? 300, delay: opts.delay ?? 0, ease: 'Back.easeOut' });
  }

  private restack() {
    const p = this.ch.parts;
    const box = this.ch.box;
    const keep = box.list.filter((o) => o !== p.body && o !== p.eyes && o !== p.mouth && !this.owns(o as Phaser.GameObjects.Image));
    const stack: Phaser.GameObjects.GameObject[] = [];
    for (const slot of ORDER) {
      if (slot === 'body') stack.push(...keep.filter((o) => o.getData?.('salonUnder')), p.body);
      else if (slot === 'eyes') stack.push(p.eyes);
      else if (slot === 'mouth') stack.push(p.mouth);
      else {
        for (const [name, l] of this.named) if (slotOf(name) === slot) stack.push(l.img);
        for (const e of this.extra) if (e.slot === slot) stack.push(e.layer.img);
      }
      if (slot === 'mouth') stack.push(...keep.filter((o) => !o.getData?.('salonUnder')));
    }
    box.removeAll(false);
    box.add(stack);
  }

  private owns(o: Phaser.GameObjects.Image) {
    for (const l of this.named.values()) if (l.img === o) return true;
    return this.extra.some((e) => e.layer.img === o);
  }

  /** Every added layer follows her breath (her body's scale) and its own little motions. */
  private sync() {
    const body = this.ch.parts.body;
    if (!body.active) return;
    const rb = rasterOf(body.texture.key);
    const bx = body.scaleX * rb;
    const by = body.scaleY * rb;
    const place = (l: Layer) => {
      const img = l.img;
      if (!img.active) return;
      if (!l.at) {
        const r = rasterOf(img.texture.key);
        img.setScale((bx / r) * l.m.grow, (by / r) * l.m.grow);
        img.setPosition(l.m.dx * bx, FOOT + l.m.dy * by);
      } else {
        img.setScale(l.base * bx * l.m.grow, l.base * by * l.m.grow);
        img.setPosition((l.at.x - FRAME.w / 2 + l.m.dx) * bx, FOOT + (l.at.y - FRAME.h / 2 - FOOT + l.m.dy) * by);
      }
    };
    for (const l of this.named.values()) place(l);
    for (const e of this.extra) place(e.layer);
  }

  /** A point of her frame in the world (where she is now). */
  toWorld(p: { x: number; y: number }) {
    const b = this.ch.box;
    return { x: b.x + (p.x - FRAME.w / 2) * b.scaleX, y: b.y + (p.y - FRAME.h / 2) * b.scaleY };
  }
  /** A world point in her frame. */
  toFrame(p: { x: number; y: number }) {
    const b = this.ch.box;
    return { x: (p.x - b.x) / b.scaleX + FRAME.w / 2, y: (p.y - b.y) / b.scaleY + FRAME.h / 2 };
  }

  /** Takes every added layer off her (her own layers stay). */
  undress() {
    for (const l of this.named.values()) l.img.destroy();
    this.named.clear();
    for (const e of [...this.extra]) e.layer.img.destroy();
    this.extra = [];
  }
}

const slotOf = (name: string): DressSlot => {
  if (name.startsWith('gem-')) return 'gems';
  if (name.startsWith('glitter-')) return 'glitter';
  return name as DressSlot;
};

export const cloneLook = (l: Look): Look => JSON.parse(JSON.stringify(l)) as Look;

/** Dresses `ch` (a customer of the salon, or Marina in the lagoon with cust-marina-*) in `look`. */
export function dress(scene: Phaser.Scene, ch: Character, id: CustomerId, look: Look): Dressing {
  return new Dressing(scene, ch, id, look);
}

/** A new customer in the salon at `at`, dressed (her Character on the customers' rig, then her look on her). */
export function makeCustomer(scene: Phaser.Scene, id: CustomerId, look: Look, at: Spot): Dressing {
  const ch = new Character(scene, customerDef(id), at, at);
  return dress(scene, ch, id, look);
}

/** Takes the look off and lets her go (her Character too). */
export function undress(d: Dressing) {
  d.undress();
  d.ch.box.destroy();
}

/** Her wordless voice (giggle-1..3, salon PR V), at her own pitch. */
export function giggle(scene: Phaser.Scene, id: CustomerId, n?: 1 | 2 | 3) {
  const which = n ?? (Phaser.Math.Between(1, 3) as 1 | 2 | 3);
  sfx(scene, `giggle-${which}`, { rate: CUSTOMER[id].voiceRate, pitch: 'vary', minGapMs: 350 });
}

/** She likes it: happy eyes and mouth, a little hop, her giggle (every thing she gets is answered like this). */
export function delight(scene: Phaser.Scene, d: Dressing, opts: { hop?: boolean; voice?: boolean } = {}) {
  const ch = d.ch;
  if (opts.hop !== false && ch.mood === 'rest') ch.cheer();
  else {
    ch.setMood('happy');
    scene.time.delayedCall(800, () => ch.box.active && ch.mood === 'happy' && ch.setMood('rest'));
  }
  if (opts.voice !== false) giggle(scene, d.id);
}

/** A little surprise, then a smile (the shower, the lipstick). */
export function surprise(scene: Phaser.Scene, d: Dressing, ms = 320) {
  const ch = d.ch;
  ch.setMood('expect');
  scene.time.delayedCall(ms, () => {
    if (!ch.box.active) return;
    ch.setMood('happy');
    scene.time.delayedCall(700, () => ch.box.active && ch.mood === 'happy' && ch.setMood('rest'));
  });
}
