import Phaser from 'phaser';

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
  /** Its top-left in the background's frame. */
  x = 0;
  y = 0;

  /** `s`: the background's scale; `k`: the piece's own size in the background's frame. */
  constructor(scene: Phaser.Scene, key: string, private toWorld: (x: number, y: number) => { x: number; y: number }, s: number, private k: number, depth: number) {
    this.imgs = PANES.map(() => scene.add.image(0, 0, key).setOrigin(0, 0).setScale(s * k).setDepth(depth).setVisible(false));
  }

  setKey(key: string) {
    for (const img of this.imgs) if (img.texture.key !== key) img.setTexture(key);
  }

  hide() {
    for (const img of this.imgs) img.setVisible(false);
  }

  place() {
    this.imgs.forEach((img, i) => {
      const [px0, py0, px1, py1] = PANES[i];
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
      img.setPosition(at.x, at.y).setVisible(true);
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

/**
 * Adds the living window over the background (`bg`: the image addBackground made, origin bottom-centre). Title, home,
 * the album and the recipe all get it.
 */
export function addScenery(scene: Phaser.Scene, bg: Phaser.GameObjects.Image) {
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

  const update = (_t: number, dt: number) => {
    const d = Math.min(dt, 100);
    clock += d;
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
