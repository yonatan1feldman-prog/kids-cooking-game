import Phaser from 'phaser';
import { FX_SOFT } from './assets';
import type { Layout } from './layout';
import { getStage } from './stage';
import { FX_GLOW, FX_VIGNETTE } from './placeholders';
import { sfx } from './sfx';
import { WALL_DRAWING } from './artWall';

/**
 * The living window (visual round 4): life outside the kitchen window, the one thing on screen that moves by itself
 * without answering her (the owner asked for it: "birds flying past the window"). It is life, not a lure (wellbeing
 * rule 5): small, slow, muted, silent, never flashing, only inside the window's glass at the top of the wall, far
 * from anything she touches, and nothing in it can be tapped.
 * - Now and then (every `BIRD_GAP_MS`) one to three birds fly across the window from left to right, flapping and
 *   gliding (`kitchen-bird-up` / `-down`, assets-src/images-b/tools/gen_kitchen_sky.py).
 * - One cloud (`kitchen-cloud`) drifts across the window very slowly, the same way; when it passes in front of the sun
 *   the sunbeam dims a little.
 * - A soft sunbeam (drawn in code, `SUNBEAM_KEY`) falls from the window onto the wall and the counter, with the
 *   window's cross in it, under everything the game puts on the counter. It turns a few degrees over a recipe's
 *   length, as the afternoon goes on.
 * Everything is placed in the background's 2400x1080 frame, like the kitchen's pieces (core/kitchen.ts), and cropped
 * to the window's two upper panes, so the frame and its cross stay in front. It runs on the scene's own clock, so it
 * pauses with the scene (the rotate screen, the background).
 */

/** The window's upper panes in the background's frame (gen_kitchen.py: window 960,40 400x190, cross 12 wide). */
const PANES: readonly [number, number, number, number][] = [
  [960, 40, 1154, 129],
  [1166, 40, 1360, 129],
];
const SUN = { x: 1270, y: 98 };

const BIRD_SIZE = [58, 44] as const;
const CLOUD_SIZE = [156, 62] as const;
/** The quiet time between two flights, and before the first one. */
const BIRD_GAP_MS: [number, number] = [18000, 34000];
const BIRD_FIRST_MS: [number, number] = [3000, 7000];
/** Background units per second. */
const BIRD_SPEED = 72;
const CLOUD_SPEED = 4.5;
const CLOUD_GAP_MS: [number, number] = [6000, 20000];

export const SUNBEAM_KEY = 'fx-sunbeam';
/** The sunbeam's box in the background's frame (drawn at a quarter of that size). */
const BEAM = { x0: 560, y0: 236, x1: 1400, y1: 1000, q: 4 };
const BEAM_ALPHA = 0.26;

/** A piece that slides across the panes: one image per pane, each cropped to its pane. */
class Clipped {
  readonly imgs: Phaser.GameObjects.Image[];
  private panes: readonly [number, number, number, number][];
  /** Its top-left in the background's frame. */
  x = 0;
  y = 0;

  /** `s`: the background's scale; `k`: the piece's own size in the background's frame. */
  constructor(scene: Phaser.Scene, key: string, private toWorld: (x: number, y: number) => { x: number; y: number }, private s: number, public k: number, depth: number, panes = PANES) {
    this.panes = panes;
    this.imgs = panes.map(() => scene.add.image(0, 0, key).setOrigin(0, 0).setScale(s * k).setDepth(depth).setVisible(false));
  }

  setKey(key: string) {
    for (const img of this.imgs) if (img.texture.key !== key) img.setTexture(key);
  }

  hide() {
    for (const img of this.imgs) img.setVisible(false);
  }

  place() {
    this.imgs.forEach((img, i) => {
      const [px0, py0, px1, py1] = this.panes[i];
      const k = this.k;
      const w = img.frame.realWidth * k;
      const h = img.frame.realHeight * k;
      const x0 = Math.max(px0, this.x);
      const x1 = Math.min(px1, this.x + w);
      const y0 = Math.max(py0, this.y);
      const y1 = Math.min(py1, this.y + h);
      if (x1 - x0 < 1 || y1 - y0 < 1) {
        img.setVisible(false);
        return;
      }
      const at = this.toWorld(this.x, this.y);
      img.setPosition(at.x, at.y).setScale(this.s * k).setVisible(true);
      img.setCrop((x0 - this.x) / k, (y0 - this.y) / k, (x1 - x0) / k, (y1 - y0) / k);
    });
  }
}

interface Bird {
  c: Clipped;
  dx: number;
  y: number;
  phase: number;
}

const rnd = (r: [number, number]) => Phaser.Math.Between(r[0], r[1]);

/** The sunbeam's picture, drawn once on a canvas: a soft trapezoid of light with the window's cross as shade. */
function makeSunbeam(scene: Phaser.Scene) {
  if (scene.textures.exists(SUNBEAM_KEY)) return;
  const { x0, y0, x1, y1, q } = BEAM;
  const w = Math.round((x1 - x0) / q);
  const h = Math.round((y1 - y0) / q);
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const g = cv.getContext('2d');
  if (!g) return;
  // bg frame -> canvas
  const X = (x: number) => (x - x0) / q;
  const Y = (y: number) => (y - y0) / q;
  // the window's bottom edge (the sill) lights a wider patch further down and to the left (the sun is up on the right)
  const top = [964, 1356];
  const bot = [640, 1110];
  const at = (u: number, v: number) => [X(top[0] + (top[1] - top[0]) * u + ((bot[0] + (bot[1] - bot[0]) * u) - (top[0] + (top[1] - top[0]) * u)) * v), Y(236 + (990 - 236) * v)];
  const quad = (u0: number, u1: number, v0: number, v1: number) => {
    g.beginPath();
    const pts = [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)];
    g.moveTo(pts[0][0], pts[0][1]);
    for (const pt of pts.slice(1)) g.lineTo(pt[0], pt[1]);
    g.closePath();
    g.fill();
  };
  g.filter = 'blur(3px)';
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(255,241,207,0.45)');
  grad.addColorStop(0.12, 'rgba(255,241,207,1)');
  grad.addColorStop(0.7, 'rgba(255,241,207,0.55)');
  grad.addColorStop(1, 'rgba(255,241,207,0)');
  g.fillStyle = grad;
  quad(0, 1, 0, 1);
  // the window's cross: its shade in the light (the mullion in the middle, the transom half-way down)
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = 'rgba(0,0,0,0.6)';
  const mu = (1160 - 964) / (1356 - 964);
  quad(mu - 0.018, mu + 0.018, 0, 1);
  quad(0, 1, 0.47, 0.52);
  scene.textures.addCanvas(SUNBEAM_KEY, cv);
}

// ---------------------------------------------------------------- more around the kitchen (visual round 5)
/** All four panes: the upper two (sky) and the lower two (the garden). */
const ALL_PANES: readonly [number, number, number, number][] = [...PANES, [960, 141, 1154, 230], [1166, 141, 1360, 230]];
/** The one thing on the sill: something of the recipe's (a pot of daisies on the other screens). */
const SILL_BY_RECIPE: Record<string, string> = {
  pizza: 'tomato', salad: 'lemons', cookies: 'cookies', smoothie: 'fruit', pancakes: 'honey', soup: 'carrots', cake: 'present', skewers: 'berries',
};
/** Over a recipe the sky outside warms from the afternoon to a soft sunset (and the sunbeam with it). */
const SUNSET_MS = 300000;
const SUNSET_ALPHA = 0.4;
const SKY_KEY = 'fx-sky-warm';
/** The chimney's smoke: a soft puff now and then, rising slowly. */
const SMOKE_EVERY_MS = 2800;
const SMOKE_LIFE_MS = 6500;
const CHIMNEY = { x: 1120, y: 136 };
/** The cat: asleep, breathing; now and then it looks up, yawns or swishes its tail. */
const CAT_WAIT_MS: [number, number] = [14000, 30000];
const CAT_FIRST_MS: [number, number] = [6000, 12000];
const CAT_BOX: [number, number] = [1220, 164];
const CLOCK_BOX: [number, number] = [1780, 86];
const CLOCK_C: [number, number] = [1840, 146];

/** Something in the scenery a tap may answer (in the recipe, `liveKitchen`): never a miss, never progress. */
export interface Tappable {
  mid: { x: number; y: number };
  bounds(): Phaser.Geom.Rectangle;
  poke(): void;
}

/** The warm sky: a gradient over the window's glass (its rounded corners too), drawn once. */
function makeSkyWarm(scene: Phaser.Scene) {
  if (scene.textures.exists(SKY_KEY)) return;
  const cv = document.createElement('canvas');
  cv.width = 400;
  cv.height = 190;
  const g = cv.getContext('2d');
  if (!g) return;
  const grad = g.createLinearGradient(0, 0, 0, 190);
  grad.addColorStop(0, '#FFA877');
  grad.addColorStop(0.45, '#FFB58E');
  grad.addColorStop(1, '#F6C58C');
  g.fillStyle = grad;
  g.beginPath();
  g.roundRect(0, 0, 400, 190, 14);
  g.fill();
  scene.textures.addCanvas(SKY_KEY, cv);
}

interface Puff {
  c: Clipped;
  age: number;
  drift: number;
}

/**
 * Visual round 5 (the owner: "a lot more scenery, much more interest"): a garden with a fence, flowers and a little
 * house outside the window, its chimney smoking softly; the sky warming towards sunset over a recipe; a cat asleep on
 * the sill (it breathes, and now and then looks up, yawns or swishes its tail; in a recipe a tap wakes it for a yawn);
 * a clock on the wall showing the real time; a child's drawing on the cabinet; one thing of the recipe's on the sill;
 * bunting for the birthday cake. All of it is up on the wall, far from where she works, under everything the game puts
 * there, and slow; nothing flashes. Pieces join as soon as their art is in (on the title it may still be loading).
 */
function addKitchenLife(scene: Phaser.Scene, toWorld: (x: number, y: number) => { x: number; y: number }, s: number, recipeId: string | undefined, beam: Phaser.GameObjects.Image | undefined) {
  const has = (k: string) => scene.textures.exists(k);
  const pending: { keys: string[]; make: () => void }[] = [];
  const when = (keys: string[], make: () => void) => pending.push({ keys, make });
  const placeAt = (key: string, box: [number, number], depth: number) => {
    const at = toWorld(box[0], box[1]);
    return scene.add.image(at.x, at.y, key).setOrigin(0, 0).setScale(s).setDepth(depth);
  };
  const pinned = (key: string, box: [number, number], pivot: [number, number], depth: number) => {
    const img = scene.add.image(0, 0, key);
    img.setOrigin((pivot[0] - box[0]) / img.frame.realWidth, (pivot[1] - box[1]) / img.frame.realHeight);
    const at = toWorld(pivot[0], pivot[1]);
    return img.setPosition(at.x, at.y).setScale(s).setDepth(depth);
  };
  const tappables: Tappable[] = [];

  // the garden in the lower panes, the drawing, the sill's thing, the cake's bunting
  when(['kitchen-garden'], () => placeAt('kitchen-garden', [960, 136], -99.8));
  // (her own newest picture from the art corner, if there is one: core/artWall.ts)
  when(['kitchen-drawing'], () => placeAt(has(WALL_DRAWING) ? WALL_DRAWING : 'kitchen-drawing', [2216, 20], -99));
  const sill = `kitchen-sill-${SILL_BY_RECIPE[recipeId ?? ''] ?? 'flowers'}`;
  when([sill], () => placeAt(sill, [936, 138], -98.2));
  if (recipeId === 'cake') {
    when(['kitchen-bunting-l'], () => placeAt('kitchen-bunting-l', [428, 4], -99));
    when(['kitchen-bunting-r'], () => placeAt('kitchen-bunting-r', [1484, 4], -99));
  }

  // the clock: the real time (the minute hand moves too slowly to see)
  let hands: [Phaser.GameObjects.Image, Phaser.GameObjects.Image] | undefined;
  when(['kitchen-clock', 'kitchen-clock-hour', 'kitchen-clock-minute'], () => {
    placeAt('kitchen-clock', CLOCK_BOX, -99);
    hands = [pinned('kitchen-clock-hour', CLOCK_BOX, CLOCK_C, -98.9), pinned('kitchen-clock-minute', CLOCK_BOX, CLOCK_C, -98.85)];
  });
  const setClock = () => {
    if (!hands) return;
    const now = new Date();
    const min = now.getMinutes() + now.getSeconds() / 60;
    hands[0].setAngle(((now.getHours() % 12) + min / 60) * 30);
    hands[1].setAngle(min * 6);
  };

  // the sky warming (only in a recipe: title and home stay in the afternoon)
  makeSkyWarm(scene);
  const sky = has(SKY_KEY) ? new Clipped(scene, SKY_KEY, toWorld, s, 1, -98.4, ALL_PANES) : undefined;
  if (sky) {
    sky.x = 960;
    sky.y = 40;
    sky.place();
    for (const img of sky.imgs) img.setAlpha(0);
  }
  let warmth = -1;
  const warm = (t: number) => {
    const w = recipeId ? Phaser.Math.Easing.Sine.InOut(Math.min(1, t / SUNSET_MS)) : 0;
    if (Math.abs(w - warmth) < 0.002) return;
    warmth = w;
    if (sky) for (const img of sky.imgs) img.setAlpha(SUNSET_ALPHA * w);
    if (beam) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(0xffffff), Phaser.Display.Color.ValueToColor(0xffb070), 100, Math.round(w * 100));
      beam.setTint(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
    }
  };

  // the chimney's smoke
  const puffs: Puff[] = [];
  let smokeWait = 800;
  const smoke = (d: number) => {
    smokeWait -= d;
    if (smokeWait <= 0 && has(FX_SOFT)) {
      smokeWait = SMOKE_EVERY_MS;
      const c = new Clipped(scene, FX_SOFT, toWorld, s, 0.2, -98.7, ALL_PANES);
      for (const img of c.imgs) img.setTint(0xf4eee6);
      puffs.push({ c, age: 0, drift: Phaser.Math.FloatBetween(3, 7) });
    }
    for (let i = puffs.length - 1; i >= 0; i--) {
      const pf = puffs[i];
      pf.age += d;
      const a = pf.age / SMOKE_LIFE_MS;
      if (a >= 1) {
        for (const img of pf.c.imgs) img.destroy();
        puffs.splice(i, 1);
        continue;
      }
      const sec = pf.age / 1000;
      pf.c.k = 0.2 + 0.4 * a;
      const half = 32 * pf.c.k;
      pf.c.x = CHIMNEY.x + pf.drift * sec + Math.sin(sec * 1.3) * 3 - half;
      pf.c.y = CHIMNEY.y - 15 * sec - half;
      pf.c.place();
      for (const img of pf.c.imgs) img.setAlpha(0.6 * Math.sin(Math.PI * Math.min(1, a * 1.6 + 0.2)) * (1 - a));
    }
  };

  // the cat
  let cat: { body: Phaser.GameObjects.Image; head: Phaser.GameObjects.Image; tail: Phaser.GameObjects.Image; headY: number } | undefined;
  let catBusy = false;
  let catWait = rnd(CAT_FIRST_MS);
  let breath = 0;
  const head = (key: string) => cat?.head.setTexture(key);
  const after = (ms: number, fn: () => void) => scene.time.delayedCall(ms, fn);
  const done = (ms: number) =>
    after(ms, () => {
      head('kitchen-cat-sleep');
      catBusy = false;
      catWait = rnd(CAT_WAIT_MS);
    });
  const look = () => {
    head('kitchen-cat-awake');
    after(1300, () => head('kitchen-cat-sleep'));
    after(1450, () => head('kitchen-cat-awake'));
    done(2900);
  };
  const yawn = () => {
    head('kitchen-cat-awake');
    after(450, () => head('kitchen-cat-yawn'));
    after(1650, () => head('kitchen-cat-awake'));
    done(2400);
  };
  const swish = (then = true) => {
    if (!cat) return;
    scene.tweens.chain({
      targets: cat.tail,
      tweens: [
        { angle: 9, duration: 520, ease: 'Sine.easeInOut' },
        { angle: -7, duration: 700, ease: 'Sine.easeInOut' },
        { angle: 5, duration: 620, ease: 'Sine.easeInOut' },
        { angle: 0, duration: 520, ease: 'Sine.easeInOut' },
      ],
    });
    if (then) done(2400);
  };
  const catKeys = ['kitchen-cat-body', 'kitchen-cat-tail', 'kitchen-cat-sleep', 'kitchen-cat-awake', 'kitchen-cat-yawn'];
  when(catKeys, () => {
    const tail = pinned('kitchen-cat-tail', CAT_BOX, [1364, 236], -98.3);
    const body = pinned('kitchen-cat-body', CAT_BOX, [1318, 248], -98.25);
    const hd = pinned('kitchen-cat-sleep', CAT_BOX, [1284, 236], -98.22);
    cat = { body, head: hd, tail, headY: hd.y };
    tappables.push({
      mid: toWorld(1300, 222),
      bounds: () => Phaser.Geom.Rectangle.Union(body.getBounds(), hd.getBounds()),
      poke: () => {
        if (catBusy) return;
        catBusy = true;
        sfx(scene, 'pop', { volume: 0.35, minGapMs: 300 });
        yawn();
        swish(false);
      },
    });
  });
  const catLife = (d: number) => {
    if (!cat) return;
    breath += d;
    const b = Math.sin((breath / 3400) * Math.PI * 2);
    cat.body.setScale(s, s * (1 + 0.02 * b));
    cat.head.y = cat.headY - 1.1 * s * b;
    if (catBusy) return;
    catWait -= d;
    if (catWait > 0) return;
    catBusy = true;
    const r = Math.random();
    if (r < 0.4) look();
    else if (r < 0.65) yawn();
    else swish();
  };

  let t = 0;
  let tick = 0;
  const update = (d: number) => {
    t += d;
    for (let i = pending.length - 1; i >= 0; i--) {
      if (pending[i].keys.every(has)) {
        pending[i].make();
        pending.splice(i, 1);
      }
    }
    tick -= d;
    if (tick <= 0) {
      tick = 1000;
      setClock();
    }
    warm(t);
    smoke(d);
    catLife(d);
  };
  update(0);
  return { update, tappables };
}

/**
 * Adds the living window over the background (`bg`: the image addBackground made, origin bottom-centre). Title, home,
 * the album and the recipe all get it.
 */
export function addScenery(scene: Phaser.Scene, bg: Phaser.GameObjects.Image, recipeId?: string) {
  const s = bg.scaleX;
  const toWorld = (bx: number, by: number) => ({ x: bg.x + (bx - 1200) * s, y: bg.y + (by - 1080) * s });
  const has = (k: string) => scene.textures.exists(k);

  // the sunbeam, under everything on the counter (the board is at -1), over the wall's pieces
  makeSunbeam(scene);
  let beam: Phaser.GameObjects.Image | undefined;
  if (has(SUNBEAM_KEY)) {
    const pivot = toWorld(1160, 236);
    beam = scene.add.image(pivot.x, pivot.y, SUNBEAM_KEY).setDepth(-98).setScale(BEAM.q * s).setAlpha(BEAM_ALPHA);
    beam.setOrigin((1160 - BEAM.x0) / (BEAM.x1 - BEAM.x0), 0);
    // the afternoon goes on: a few degrees over about a recipe's length, and back
    scene.tweens.add({ targets: beam, angle: { from: -1.5, to: 2.5 }, duration: 300000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // (on the title the window's pieces may still be loading: they join as soon as they are in)
  let cloud: Clipped | undefined;
  let cloudWait = 0;

  const birds: Bird[] = [];
  let birdWait = rnd(BIRD_FIRST_MS);
  let clock = 0;
  const flock = () => {
    const n = Phaser.Math.RND.pick([1, 1, 2, 2, 3]);
    const y = Phaser.Math.Between(56, 74);
    for (let i = 0; i < n; i++) {
      const c = new Clipped(scene, 'kitchen-bird-up', toWorld, s, i ? 0.86 : 1, -98.5);
      birds.push({ c, dx: -i * Phaser.Math.Between(46, 70), y: y + (i ? Phaser.Math.Between(-14, 12) : 0), phase: Math.random() * 1000 });
    }
    birds.forEach((b) => (b.c.x = PANES[0][0] - BIRD_SIZE[0] + b.dx));
  };

  const life = addKitchenLife(scene, toWorld, s, recipeId, beam);
  bg.setData('scenery', life.tappables);

  const update = (_t: number, dt: number) => {
    const d = Math.min(dt, 100);
    clock += d;
    life.update(d);
    if (!cloud && has('kitchen-cloud')) {
      cloud = new Clipped(scene, 'kitchen-cloud', toWorld, s, 1, -98.6);
      cloud.x = Phaser.Math.Between(PANES[0][0] - 60, PANES[1][2] - CLOUD_SIZE[0] - 40);
      cloud.y = 52;
    }
    if (cloud) {
      if (cloudWait > 0) {
        cloudWait -= d;
      } else {
        cloud.x += (CLOUD_SPEED * d) / 1000;
        if (cloud.x > PANES[1][2]) {
          cloud.x = PANES[0][0] - CLOUD_SIZE[0];
          cloud.y = Phaser.Math.Between(48, 60);
          cloudWait = rnd(CLOUD_GAP_MS);
          cloud.hide();
        } else cloud.place();
      }
      if (beam) {
        const cover = cloudWait > 0 ? 0 : Phaser.Math.Clamp(1 - Math.abs(cloud.x + CLOUD_SIZE[0] / 2 - SUN.x) / 110, 0, 1);
        const want = BEAM_ALPHA * (1 - 0.55 * Phaser.Math.Easing.Sine.InOut(cover));
        beam.setAlpha(beam.alpha + (want - beam.alpha) * Math.min(1, d / 400));
      }
    }
    if (!birds.length) {
      birdWait -= d;
      if (birdWait <= 0 && has('kitchen-bird-up') && has('kitchen-bird-down')) flock();
      return;
    }
    let out = true;
    for (const b of birds) {
      b.c.x += (BIRD_SPEED * d) / 1000;
      const t = clock + b.phase;
      // flap for 1.2 s, glide for 0.8 s; a gentle rise and fall
      const flapping = t % 2000 < 1200;
      b.c.setKey(flapping && Math.floor(t / 130) % 2 ? 'kitchen-bird-down' : 'kitchen-bird-up');
      b.c.y = b.y + Math.sin(t / 260) * 5;
      b.c.place();
      if (b.c.x < PANES[1][2]) out = false;
    }
    if (out) {
      for (const b of birds) for (const img of b.c.imgs) img.destroy();
      birds.length = 0;
      birdWait = rnd(BIRD_GAP_MS);
    }
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, update);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, update));
}

/** The lagoon's light rays (drawn in code, like the kitchen's sunbeam): a soft wedge, bright at the top. */
export const SEA_RAY_KEY = 'fx-sea-ray';

/**
 * The lagoon's sea life (the mermaid world, research/mermaid-spec.md 0; the kind of the living window): slow soft rays of
 * light swaying over the water and the sand, and one tall seaweed rocking gently in the current. Quiet, slow, muted,
 * silent, nothing in it can be tapped, all of it behind what she touches. (Pipa's little bubbles are SeaGame's
 * `pipaInBubble`.) `seaweed`: where the seaweed stands (its foot) and its scale.
 */
export function seaLife(scene: Phaser.Scene, L: { W: number; H: number; k: number }, seaweed: { x: number; y: number; scale: number }) {
  if (!scene.textures.exists(SEA_RAY_KEY)) {
    const w = 160;
    const h = 512;
    const tex = scene.textures.createCanvas(SEA_RAY_KEY, w, h);
    const c = tex?.getContext();
    if (c && tex) {
      const g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(255,255,240,0.9)');
      g.addColorStop(0.6, 'rgba(255,255,240,0.35)');
      g.addColorStop(1, 'rgba(255,255,240,0)');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(w * 0.38, 0);
      c.lineTo(w * 0.62, 0);
      c.lineTo(w, h);
      c.lineTo(0, h);
      c.closePath();
      c.fill();
      tex.refresh();
    }
  }
  const rays = [0.16, 0.34, 0.55, 0.78].map((fx, i) => {
    const r = scene.add.image(L.W * fx, -20 * L.k, SEA_RAY_KEY).setOrigin(0.5, 0).setDepth(-90).setBlendMode(Phaser.BlendModes.ADD);
    r.setScale((1.1 + 0.25 * (i % 2)) * L.k * 1.6, (L.H * 0.95) / 512).setAngle(-8 + i * 3).setAlpha(0.06);
    scene.tweens.add({ targets: r, alpha: 0.16, angle: r.angle + 4, duration: 6000 + i * 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 900 });
    return r;
  });
  const weed = scene.add.image(seaweed.x, seaweed.y, 'seaweed').setOrigin(0.5, 1).setScale(seaweed.scale).setDepth(-80);
  scene.tweens.add({ targets: weed, angle: { from: -4, to: 4 }, duration: 3800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return { rays, weed };
}

// ---------------------------------------------------------------- light and depth (the premium round, PR 2)
/**
 * "A lit paper book" (research/premium-spec.md section 2): every world has one soft light, from the upper left (the
 * kitchen's window, the sun outside, the water's surface in the lagoon, a lamp in the clinic), and its own front.
 * - `addLight`: one vignette over the background (`fx-vignette`, tinted ink, stretched over the screen, its clear middle
 *   a little toward the light, so the light's corner stays bright and the far corners settle) and, outside the kitchen
 *   (which has its sunbeam), one wide soft glow from the light (`fx-glow`, SCREEN). Both sit just over the background and
 *   its own pieces and under everything the game puts on it; neither moves (wellbeing rule 5). Two quads.
 * - `addForeground`: one or two big things in the very front of a world (assets-src/images-b/tools/gen_dressing.py),
 *   a little darker than the play things, cut by the screen's bottom edge and kept in the no-touch strips (the bottom
 *   8%, the side 4%); never tappable, over the characters, under the buttons and the scene-change page.
 */
export type LightFrom = 'window' | 'sun' | 'water' | 'lamp';
/** The vignette's and the glow's depth: over the background (-100), its pieces and the kitchen's sunbeam (-98). */
export const LIGHT_DEPTH = -96;
/** The foreground's depth: over the characters and anything carried, under the home button (900) and the page. */
export const FOREGROUND_DEPTH = 890;
const LIGHTS: Record<LightFrom, { ink: number; alpha: number; glow?: { x: number; y: number; w: number; h: number; tint: number; alpha: number } }> = {
  window: { ink: 0x3a2216, alpha: 0.17 },
  sun: { ink: 0x3a2216, alpha: 0.15, glow: { x: 0.12, y: 0.02, w: 1.1, h: 1.25, tint: 0xfff0c8, alpha: 0.32 } },
  water: { ink: 0x0b3a50, alpha: 0.2, glow: { x: 0.45, y: -0.08, w: 1.7, h: 0.8, tint: 0xeefff6, alpha: 0.22 } },
  lamp: { ink: 0x2e3a3a, alpha: 0.15, glow: { x: 0.3, y: 0.0, w: 1.0, h: 1.0, tint: 0xfff6e2, alpha: 0.26 } },
};

export function addLight(scene: Phaser.Scene, L: Pick<Layout, 'W' | 'H'>, opts: { from: LightFrom }): Phaser.GameObjects.Image[] {
  const out: Phaser.GameObjects.Image[] = [];
  const spec = LIGHTS[opts.from];
  if (scene.textures.exists(FX_VIGNETTE)) {
    // (the clear middle moved a little up and to the left, toward the light)
    out.push(scene.add.image(L.W * 0.46, L.H * 0.44, FX_VIGNETTE).setDisplaySize(L.W * 1.16, L.H * 1.24).setTint(spec.ink).setAlpha(spec.alpha).setDepth(LIGHT_DEPTH));
  }
  const g = spec.glow;
  if (g && scene.textures.exists(FX_GLOW)) {
    out.push(scene.add.image(L.W * g.x, L.H * g.y, FX_GLOW).setDisplaySize(L.W * g.w, L.H * g.h).setTint(g.tint).setAlpha(g.alpha)
      .setBlendMode(Phaser.BlendModes.SCREEN).setDepth(LIGHT_DEPTH + 0.5));
  }
  return out;
}

export type ForegroundWorld = 'kitchen' | 'garden' | 'market' | 'farm' | 'clinic';
/** Slightly darker than the play things (they are nearer and out of the light). */
const FOREGROUND_TINT = 0xe4dbd0;
/**
 * Each piece: its key, the corner it stands in (`left`: its frame's bottom-left at the screen's bottom-left, else
 * bottom-right, mirrored), how far its frame pokes past the screen's side and bottom (frame units), and its scale.
 * Kept low: what shows above the palm strip stays at the screen's very edge (checked by the harness, `__fgCheck`).
 * `wide`: only on screens 16:9 and wider.
 */
const FOREGROUND: Record<ForegroundWorld, { key: string; side: 'left' | 'right'; dx: number; dy: number; scale: number; flip?: boolean; wide?: boolean }[]> = {
  kitchen: [
    { key: 'fg-napkin', side: 'right', dx: 10, dy: 74, scale: 0.86 },
    { key: 'fg-lemons', side: 'right', dx: -150, dy: 62, scale: 0.9, wide: true },
  ],
  garden: [
    { key: 'fg-leaves', side: 'left', dx: 60, dy: 150, scale: 0.8 },
    { key: 'fg-leaves', side: 'right', dx: 90, dy: 120, scale: 0.62, flip: true },
  ],
  market: [{ key: 'fg-basket', side: 'left', dx: 40, dy: 104, scale: 0.86 }],
  farm: [{ key: 'fg-fence', side: 'left', dx: 75, dy: 24, scale: 0.9 }],
  clinic: [{ key: 'fg-desk', side: 'left', dx: 60, dy: 52, scale: 0.86 }],
};

export function addForeground(scene: Phaser.Scene, L: Pick<Layout, 'W' | 'H' | 'k'>, world: ForegroundWorld): Phaser.GameObjects.Image[] {
  const out: Phaser.GameObjects.Image[] = [];
  for (const f of FOREGROUND[world]) {
    // (`wide`: only where Pipa sits beside Mom, 16:9 and wider; on narrower screens the work reaches that corner)
    if (!scene.textures.exists(f.key) || (f.wide && L.W < 1700)) continue;
    const s = f.scale * L.k;
    const left = f.side === 'left';
    const img = scene.add.image(left ? -f.dx * s : L.W + f.dx * s, L.H + f.dy * s, f.key).setOrigin(left ? 0 : 1, 1).setScale(s)
      .setTint(FOREGROUND_TINT).setDepth(FOREGROUND_DEPTH);
    if (f.flip) img.setFlipX(true);
    img.setData('foreground', true);
    out.push(img);
  }
  return out;
}

/** Under the board (-1), over the light. */
const CLOTH_DEPTH = -2;

/**
 * The kitchen's light and depth (called by addBackground, so every kitchen screen has it): the window's light on all
 * of them; in a recipe (`recipeId`) also the oilcloth under the work area (`stage.cloth`) and the kitchen's front
 * (a checked napkin with a bowl of lemons on it, in front of Mom); washing up gets the front only (its sink is the work area).
 */
export function dressKitchen(scene: Phaser.Scene, L: Layout, recipeId?: string) {
  addLight(scene, L, { from: 'window' });
  if (!recipeId) return;
  if (recipeId !== 'dishes' && scene.textures.exists('counter-cloth')) {
    const c = getStage(L).cloth;
    scene.add.image(c.x, c.y, 'counter-cloth').setScale(c.scale).setDepth(CLOTH_DEPTH);
  }
  addForeground(scene, L, 'kitchen');
}
