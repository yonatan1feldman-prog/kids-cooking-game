import Phaser from 'phaser';
import { boing, stars } from './fx';
import { sfx } from './sfx';
import { byVisit } from './sea';
import {
  DYE_HEX, PAINT_HEX, WISH, WISH_SPARE, hairHex, hexOf, lipsHex, tailHex, wishKind, wishMet, wishNext, wishStage,
  type CustomerId, type Look, type WishItem,
} from './salon';
import { delight, giggle, rasterOf } from './salonDress';
import { visits, type P } from '../scenes/MiniGame';
import { SALON_STAGE_CLASSES, type SeaSalon } from '../scenes/SeaSalon';

/**
 * The customer's wish (salon PR 3; research/mermaid-dressup-spec.md 5.0, 6): on the hard level the customer in the chair
 * thinks of three things she would love (a hair colour, a crown, pink lips ...), one from each of three stages, in a
 * thought bubble of her own up in the room's top right corner, clear of the column, her face and Mom. Nothing has to be
 * done about it: the done button comes as always, nobody is ever sad, and the bubble just goes quietly at the mirror.
 * Whenever her look has a wished thing on (spotted after every change of her look, `onLookChanged`) the bubble grows, a
 * green tick lands on that picture, she claps and Mom says "That's what she wished for!"; all three: the bubble bursts
 * into stars, she is overjoyed, "All three wishes! You listened so well!" (praise for listening: a thing she did). A tap on
 * the bubble (or on her) shows it big again for a while. One wish per visit (`byVisit` over WISH).
 */

const INK = 0x8a6a55;
const PAPER = 0xfffdf7;
/** The bubble's size at scale 1 (k 1): three pictures of CELL, a margin round them. */
const CELL = 132;
const BW = 3 * CELL + 84;
const BH = 196;
/** Its scale while she only remembers it (the corner), and while it shows (a find, a peek, the start). */
const SMALL = 0.86;
const BIG = 1.1;
const ZOOMED = 0.72;
const PEEK_MS = 2600;

type Wishing = {
  items: WishItem[];
  found: boolean[];
  box: Phaser.GameObjects.Container;
  pics: Phaser.GameObjects.Container[];
  big: boolean;
  timer?: Phaser.Time.TimerEvent;
  gone: boolean;
};

const wishes = new WeakMap<SeaSalon, Wishing>();

/** The wished things of `stage` she has not got yet (Mom's hint in that stage points at them first). */
export function wishPending(h: SeaSalon, stage?: string): WishItem[] {
  const w = wishes.get(h);
  if (!w || w.gone) return [];
  return w.items.filter((it, i) => !w.found[i] && (!stage || wishStage(it) === stage));
}

/** The wish of this visit: three things from stages the game has, none of which she has on already. */
export function chooseWish(look: Look, n: number): WishItem[] {
  const have = (w: WishItem) => !!SALON_STAGE_CLASSES[wishStage(w)];
  const out: WishItem[] = [];
  const free = (w: WishItem) => have(w) && !out.some((o) => wishKind(o) === wishKind(w));
  for (const want of [...byVisit(WISH, n)]) {
    let w = want;
    if (!have(w)) w = WISH_SPARE.find(free) ?? w;
    // (something she already has on is no wish: the next one of its kind)
    for (let i = 0; i < 6 && wishMet(w, look); i++) w = wishNext(w);
    if (free(w) && !wishMet(w, look)) out.push(w);
  }
  return out;
}

/**
 * Hard: the customer just sat down; she shows her wish (Pick calls this). Nothing on the easy level.
 */
export function startWish(h: SeaSalon) {
  const c = h.customer;
  if (h.lvl !== 2 || !c || wishes.get(h)?.gone === false) return;
  const items = chooseWish(c.look, visits('sea-salon-wish'));
  if (!items.length) return;
  const k = h.k;
  const box = h.add.container(0, 0).setDepth(30);
  const g = h.add.graphics();
  g.lineStyle(5, INK, 1);
  g.fillStyle(PAPER, 1);
  // (two small puffs lead from the bubble down towards her head, on its left)
  for (const t of [{ x: -BW * 0.4, y: BH / 2 + 4, r: 18 }, { x: -BW * 0.5, y: BH / 2 + 38, r: 11 }]) {
    g.fillCircle(t.x, t.y, t.r);
    g.strokeCircle(t.x, t.y, t.r);
  }
  g.fillEllipse(0, 0, BW, BH);
  g.strokeEllipse(0, 0, BW, BH);
  box.add(g);
  const pics = items.map((it, i) => {
    const pic = picture(h, it, c.id, c.look);
    pic.setPosition((i - 1) * CELL, 0);
    box.add(pic);
    return pic;
  });
  box.setScale(0);
  const w: Wishing = { items, found: items.map(() => false), box, pics, big: true, gone: false };
  wishes.set(h, w);
  place(h, w, BIG, 0);
  box.setScale(0);
  h.tweens.add({ targets: box, scale: BIG * k, duration: 380, ease: 'Back.easeOut' });
  sfx(h, 'pop', { volume: 0.6 });
  h.time.delayedCall(250, () => c.ch.box.active && giggle(h, c.id));
  h.speak('vo-salon-wish', { ttlMs: 6000 });
  w.timer = h.time.delayedCall(5200, () => rest(h, w));
  h.shown.wish = { items, found: [...w.found], granted: false };

  h.onLookChanged.push((look) => check(h, w, look));
  const onDown = (p: Phaser.Input.Pointer) => {
    if (w.gone || !h.playing) return;
    const at = { x: p.worldX, y: p.worldY };
    const b = box.getBounds();
    if (Phaser.Geom.Rectangle.Contains(b, at.x, at.y) || (h.customer?.ch.hit(at.x, at.y) && !h.cellAt(at))) peek(h, w);
  };
  const onUpdate = () => {
    if (w.gone) return;
    // (the mirror: her wish goes quietly, whatever came true)
    if (!h.customer || h.stage?.id === 'mirror' || h.shown.done) return hide(h, w);
    const want = w.big ? BIG : h.zoomed ? ZOOMED : SMALL;
    if (!h.tweens.isTweening(box) && Math.abs(box.scale - want * k) > 0.01) place(h, w, want, 300);
  };
  h.input.on(Phaser.Input.Events.POINTER_DOWN, onDown);
  h.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);
  h.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    h.input.off(Phaser.Input.Events.POINTER_DOWN, onDown);
    h.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    w.gone = true;
    wishes.delete(h);
  });
  // (something she wished for may come at once: a surprise, a look she had)
  check(h, w, c.look);
}

/** Where the bubble sits at `scale`: its top right corner in the room's top right, left of the done button. */
function place(h: SeaSalon, w: Wishing, scale: number, ms: number) {
  const k = h.k;
  const S = h.table;
  const room = S.salon.room;
  const s = scale * k;
  const right = Math.min(room.x1 - 6 * k, S.done.x - 130 * k);
  const x = right - (BW / 2) * s;
  const y = room.y0 + 10 * k + (BH / 2) * s;
  if (!ms) return w.box.setPosition(x, y).setScale(s);
  h.tweens.killTweensOf(w.box);
  h.tweens.add({ targets: w.box, x, y, scale: s, duration: ms, ease: scale > SMALL ? 'Back.easeOut' : 'Sine.easeInOut' });
}

/** Back to the corner, small (she remembers it). */
function rest(h: SeaSalon, w: Wishing) {
  if (w.gone) return;
  w.big = false;
  place(h, w, h.zoomed ? ZOOMED : SMALL, 420);
}

/** Big for a while (a find, a tap on it), then back to the corner. */
function show(h: SeaSalon, w: Wishing, ms = PEEK_MS) {
  if (w.gone) return;
  w.timer?.remove();
  if (!w.big) place(h, w, BIG, 320);
  w.big = true;
  w.timer = h.time.delayedCall(ms, () => rest(h, w));
}

function peek(h: SeaSalon, w: Wishing) {
  if (w.big) return;
  show(h, w);
  const c = h.customer;
  if (c) giggle(h, c.id);
  h.shown.wishPeeks = ((h.shown.wishPeeks as number | undefined) ?? 0) + 1;
}

/** After every change of her look: what has come true now. */
function check(h: SeaSalon, w: Wishing, look: Look) {
  if (w.gone) return;
  const now = w.items.map((it, i) => !w.found[i] && wishMet(it, look));
  if (!now.some(Boolean)) return;
  now.forEach((n, i) => n && (w.found[i] = true));
  const all = w.found.every(Boolean);
  h.shown.wish = { items: w.items, found: [...w.found], granted: all };
  show(h, w, all ? 4000 : 2400);
  const c = h.customer;
  let at = 300;
  now.forEach((n, i) => {
    if (!n) return;
    h.time.delayedCall(at, () => tick(h, w, i));
    at += 260;
  });
  // she claps (a happy hop), Mom is glad
  h.time.delayedCall(at, () => {
    if (w.gone || !c?.ch.box.active) return;
    delight(h, c);
    h.theMom?.happy();
    h.time.delayedCall(900, () => h.theMom?.rest());
    if (all) granted(h, w);
    else h.speak('vo-salon-found', { ttlMs: 4000 });
  });
}

/** A green tick lands on picture i. */
function tick(h: SeaSalon, w: Wishing, i: number) {
  if (w.gone) return;
  const pic = w.pics[i];
  const k = h.k;
  const v = h.add.image(CELL * 0.3, CELL * 0.26, 'btn-done');
  v.setScale(0);
  pic.add(v);
  h.tweens.add({ targets: v, scale: (CELL * 0.42) / v.frame.realWidth, duration: 300, ease: 'Back.easeOut' });
  boing(h, pic, 0.2);
  const m = pic.getWorldTransformMatrix();
  stars(h, m.tx, m.ty, 6, 34 * k);
  sfx(h, 'chime-3', { pitch: 'vary' });
}

/** All three came true: the bubble bursts into stars, she is overjoyed, Mom praises the listening. */
function granted(h: SeaSalon, w: Wishing) {
  const c = h.customer;
  h.speak('vo-salon-granted', { ttlMs: 6000 });
  h.time.delayedCall(1300, () => {
    if (w.gone) return;
    w.gone = true;
    w.timer?.remove();
    const b = w.box;
    h.tweens.killTweensOf(b);
    stars(h, b.x, b.y, 14, 56 * h.k);
    sfx(h, 'shimmer', { pitch: 'vary' });
    h.tweens.add({ targets: b, scale: b.scale * 1.25, alpha: 0, duration: 300, ease: 'Quad.easeOut', onComplete: () => b.destroy() });
    if (c?.ch.box.active && (c.ch.mood === 'rest' || c.ch.mood === 'happy')) c.ch.react('love');
    h.theMom?.celebrate();
  });
}

/** The bubble goes quietly (the mirror; the visit is over). */
function hide(h: SeaSalon, w: Wishing) {
  if (w.gone) return;
  w.gone = true;
  w.timer?.remove();
  const b = w.box;
  h.tweens.killTweensOf(b);
  h.tweens.add({ targets: b, alpha: 0, scale: b.scale * 0.85, duration: 300, onComplete: () => b.destroy() });
}

// ---------------------------------------------------------------- the pictures in the bubble

/** The drawn part of a picture in its own units (a customer-frame picture: the 600x700 frame) and the frame's size. */
export function drawn(scene: Phaser.Scene, key: string) {
  const f = scene.textures.getFrame(key);
  const r = rasterOf(key);
  const fw = (f?.realWidth ?? 600 * r) / r;
  const fh = (f?.realHeight ?? 700 * r) / r;
  const d = f?.trimmed ? (f as unknown as { data: { spriteSourceSize: { x: number; y: number; w: number; h: number } } }).data.spriteSourceSize : null;
  const box = d ? { x0: d.x / r, y0: d.y / r, x1: (d.x + d.w) / r, y1: (d.y + d.h) / r } : { x0: 0, y0: 0, x1: fw, y1: fh };
  return { box, fw, fh };
}

/** One wished thing, drawn small (its own pictures from the salon, fitted by their drawing; a colour on the thing it colours). */
function picture(h: SeaSalon, it: WishItem, id: CustomerId, look: Look): Phaser.GameObjects.Container {
  const layers: { key: string; tint?: number }[] = [];
  if ('hair' in it || 'hairColour' in it) {
    // (a colour shows on long waves: a short bob in a colour reads as a hat)
    const style = 'hair' in it ? it.hair : 'waves';
    const tint = 'hairColour' in it ? hexOf(DYE_HEX[it.hairColour]) : hairHex(id, look.hairColour);
    layers.push({ key: `hair-back-${style}`, tint }, { key: `hair-front-${style}`, tint });
  } else if ('tail' in it || 'tailColour' in it) {
    const shape = 'tail' in it ? it.tail : 'classic';
    const tint = 'tailColour' in it ? tailHex(id, it.tailColour) : tailHex(id, look.tailColour);
    layers.push({ key: `tail-${shape}`, tint }, { key: `tail-${shape}-shine` });
  } else if ('top' in it) layers.push({ key: `top-${it.top}` });
  else if ('crown' in it) layers.push({ key: `crown-${it.crown}` });
  else if ('necklace' in it) layers.push({ key: `necklace-${it.necklace}` });
  else if ('gem' in it) layers.push({ key: `gem-${it.gem}` });
  else layers.push({ key: `cust-${id}-mouth-open`, tint: lipsHex(id, it.lips) });
  const ok = layers.filter((l) => h.textures.exists(l.key));
  const pic = h.add.container(0, 0);
  if (!ok.length) {
    // (a stand-in: a blob of the colour)
    const tint = 'lips' in it ? hexOf(PAINT_HEX[it.lips]) : 0xffffff;
    pic.add(h.add.circle(0, 0, CELL * 0.3, tint));
    return pic;
  }
  const ds = ok.map((l) => drawn(h, l.key));
  const b = ds.map((d) => d.box).reduce((a, q) => ({ x0: Math.min(a.x0, q.x0), y0: Math.min(a.y0, q.y0), x1: Math.max(a.x1, q.x1), y1: Math.max(a.y1, q.y1) }));
  // (a mouth is small: it fills less of its cell than a tail, or it would look like a giant mouth)
  const fill = 'lips' in it ? 0.66 : 'gem' in it ? 0.74 : 0.94;
  const s = (fill * CELL) / Math.max(b.x1 - b.x0, b.y1 - b.y0);
  ok.forEach((l, i) => {
    const d = ds[i];
    const img = h.add.image((d.fw / 2 - (b.x0 + b.x1) / 2) * s, (d.fh / 2 - (b.y0 + b.y1) / 2) * s, l.key).setScale(s / rasterOf(l.key));
    if (l.tint !== undefined) img.setTint(l.tint);
    pic.add(img);
  });
  return pic;
}

/** For the test harness: where picture i of the bubble is (world). */
export function wishPictureAt(h: SeaSalon, i: number): P | null {
  const w = wishes.get(h);
  const pic = w?.pics[i];
  if (!pic || w.gone) return null;
  const m = pic.getWorldTransformMatrix();
  return { x: m.tx, y: m.ty };
}
