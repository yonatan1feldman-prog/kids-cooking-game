import Phaser from 'phaser';
import type { ImageKey, SoundKey } from './assets';
import { burst, stars } from './fx';
import { inNoTouchZone } from './layout';
import { sfx } from './sfx';

/**
 * Secrets (the premium round, research/premium-spec.md 4.5): in every world two small things in the background that do
 * not look like buttons, a cupboard door, a bird on a tree, the fish in the lagoon. A tap on one shows a little
 * surprise, and the next tap (this visit or the next) a different one of its three: the mouse with its cheese peeks out
 * of the cupboard, then a butterfly flies out, then paper hearts. Which one is next is kept on the device
 * (`localStorage` `cooking.secret.<world>.<id>`, an index, never shown, never counted for her: wellbeing rules 1 and 6).
 * Nothing here moves or calls by itself (rule 5): it only answers her tap. A tap here is never a miss and never
 * progress: it only fires where no button or game thing is under the finger, and never in the no-touch strips.
 *
 * Each world's scene calls `addSecrets(this, '<world>')` in its create (one line); the kitchen's come with the kitchen's
 * pieces (core/kitchen.ts), so the title, home, album and every recipe have them. Places are in the world's background
 * frame (2400x1080), so they sit on what they belong to at every ratio; one off the screen is simply not there.
 * Pictures: core/secretAssets.ts (each loaded with its world only). Pieces of the background itself (a door, a framed
 * picture, the pennants) are the background's own texture, cropped: no new texture, no bytes.
 */
export type SecretWorld = 'kitchen' | 'garden' | 'market' | 'farm' | 'clinic' | 'mermaid';

/** Each world's background (the one image the places are measured on). */
const BG: Record<SecretWorld, string> = {
  kitchen: 'bg-kitchen-landscape',
  garden: 'bg-garden',
  market: 'bg-market',
  farm: 'bg-farm',
  clinic: 'bg-clinic-wait',
  mermaid: 'bg-lagoon',
};

/** A touch counts this far round a secret's box (world units at k = 1): a small thing is still a 200-unit target. */
const REACH = 70;
/** Depths: just over the background (and the kitchen's pieces at -99), under everything she plays with. */
const D = { inside: -98.6, thing: -98.4, cover: -98.2, fly: 60 };

type Box = [number, number, number, number];

/** A secret as placed: its parts, where it can be touched (bg frame) and its three answers. */
interface Placed {
  id: string;
  hit: Box;
  answers: ((p: Place) => void)[];
}

/** What an answer works with: the scene, the background's scale and the frame -> world mapping. */
interface Place {
  scene: Phaser.Scene;
  s: number;
  at: (x: number, y: number) => { x: number; y: number };
  /** Busy until this time (scene clock): a tap meanwhile is ignored, so answers never pile up. */
  busy: number;
}

interface Def {
  id: string;
  /** Builds what is always there (a crop of the background, a small picture) and returns its touch box and answers. */
  build: (p: Place) => Placed;
}

// ---------------------------------------------------------------- the answers' building blocks

/** A crop of the background's own picture, laid exactly over it, turning or growing round `pivot` (bg frame). */
function crop(p: Place, key: string, box: Box, pivot: [number, number], depth = D.cover) {
  const img = p.scene.add.image(0, 0, key);
  const fw = img.frame.realWidth;
  const fh = img.frame.realHeight;
  const w = p.at(pivot[0], pivot[1]);
  img.setCrop(box[0], box[1], box[2], box[3]).setOrigin(pivot[0] / fw, pivot[1] / fh).setPosition(w.x, w.y).setScale(p.s).setDepth(depth);
  return img;
}

/** A small picture standing at (x, y) of the bg frame (its bottom centre), `scale` of its native size. */
function thing(p: Place, key: ImageKey, x: number, y: number, scale: number, flip = false) {
  const w = p.at(x, y);
  return p.scene.add.image(w.x, w.y, key).setOrigin(0.5, 1).setScale(p.s * scale).setFlipX(flip).setDepth(D.thing);
}

/** An effect if this world has it loaded, else a soft pop (never a "not loaded" warning: these play anywhere). */
function play(scene: Phaser.Scene, key: SoundKey, opts: { volume?: number; rate?: number } = {}) {
  sfx(scene, scene.cache.audio.exists(key) ? key : 'pop', { pitch: 'vary', ...opts });
}

/** A squash on its foot, a hop, a little squash as it lands. */
function hop(p: Place, img: Phaser.GameObjects.Image, height = 40, sound: SoundKey = 'pop') {
  const s = img.getData('rest') ?? img.scaleX;
  img.setData('rest', s);
  const y0 = img.getData('y0') ?? img.y;
  img.setData('y0', y0);
  p.scene.tweens.killTweensOf(img);
  img.setScale(s).setY(y0).setAngle(0);
  play(p.scene, sound, { volume: 0.6 });
  p.scene.tweens.chain({
    targets: img,
    tweens: [
      { scaleY: s * 0.82, scaleX: s * 1.1, duration: 90, ease: 'Quad.easeOut' },
      { scaleY: s * 1.08, scaleX: s * 0.95, y: y0 - height * p.s, duration: 200, ease: 'Quad.easeOut' },
      { scaleY: s, scaleX: s, y: y0, duration: 180, ease: 'Quad.easeIn' },
      { scaleY: s * 0.9, scaleX: s * 1.06, duration: 70, yoyo: true },
    ],
  });
}

/** A little wiggle (a wave of a claw, a happy wag): angle back and forth round its foot. */
function wiggle(p: Place, img: Phaser.GameObjects.Image, angle = 10, times = 3, sound: SoundKey = 'squeak') {
  p.scene.tweens.killTweensOf(img);
  img.setAngle(0);
  play(p.scene, sound, { volume: 0.5 });
  p.scene.tweens.add({ targets: img, angle: { from: -angle, to: angle }, duration: 120, yoyo: true, repeat: times, ease: 'Sine.easeInOut', onComplete: () => img.setAngle(0) });
}

/** Grows a little and back (a crop of the background: never smaller, so the picture under it never shows). */
function swell(p: Place, img: Phaser.GameObjects.Image, by = 0.1, times = 1) {
  const s = img.getData('rest') ?? img.scaleX;
  img.setData('rest', s);
  p.scene.tweens.killTweensOf(img);
  img.setScale(s);
  p.scene.tweens.add({ targets: img, scale: s * (1 + by), duration: 160, yoyo: true, repeat: times - 1, ease: 'Sine.easeOut', onComplete: () => img.setScale(s) });
}

/**
 * Something flies out from (x, y) (bg frame): a picture that pops out, flutters along a soft arc to `to` and fades there
 * (a butterfly, a bird, a fish swimming across).
 */
function flyOut(p: Place, key: ImageKey, from: [number, number], to: [number, number], o: { scale?: number; ms?: number; flap?: boolean; back?: boolean } = {}) {
  const sc = p.scene;
  const a = p.at(from[0], from[1]);
  const b = p.at(to[0], to[1]);
  const s = p.s * (o.scale ?? 1);
  const img = sc.add.image(a.x, a.y, key).setScale(s * 0.3).setDepth(D.fly).setFlipX(b.x < a.x);
  const ms = o.ms ?? 1600;
  sc.tweens.add({ targets: img, scale: s, duration: 260, ease: 'Back.easeOut' });
  // (a flap: the picture narrows and widens like wings or a tail)
  if (o.flap !== false) sc.tweens.add({ targets: img, scaleY: s * 0.7, duration: 110, yoyo: true, repeat: Math.floor(ms / 220), delay: 260 });
  const mid = { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - 160 * p.s };
  const t = { v: 0 };
  sc.tweens.add({
    targets: t,
    v: 1,
    duration: ms,
    ease: 'Sine.easeInOut',
    yoyo: !!o.back,
    hold: o.back ? 500 : 0,
    onUpdate: () => {
      const v = t.v;
      img.setPosition((1 - v) * (1 - v) * a.x + 2 * v * (1 - v) * mid.x + v * v * b.x, (1 - v) * (1 - v) * a.y + 2 * v * (1 - v) * mid.y + v * v * b.y);
    },
    onYoyo: () => img.setFlipX(!img.flipX),
    onComplete: () => {
      if (o.back) {
        sc.tweens.add({ targets: img, scale: s * 0.3, alpha: 0, duration: 200, onComplete: () => img.destroy() });
      } else sc.tweens.add({ targets: img, alpha: 0, duration: 300, onComplete: () => img.destroy() });
    },
  });
  return ms + (o.back ? ms + 700 : 300);
}

/** Paper hearts (the code-drawn `fx-heart`) float up from (x, y). */
function hearts(p: Place, x: number, y: number, n = 6) {
  const w = p.at(x, y);
  burst(p.scene, w.x, w.y, { texture: 'fx-heart', count: n, tint: [0xf27a86, 0xf6a5ad, 0xe85d6c], size: 34 * p.s, speed: 260 * p.s, gravityY: -120 * p.s, lifespan: 1300, depth: D.fly });
  play(p.scene, 'star', { volume: 0.5 });
}

/** Sparkles at (x, y). */
function sparkle(p: Place, x: number, y: number, n = 8) {
  const w = p.at(x, y);
  stars(p.scene, w.x, w.y, n, 36 * p.s);
  play(p.scene, 'star', { volume: 0.5 });
}

/** Bubbles rise from (x, y). */
function bubbles(p: Place, x: number, y: number, n = 10) {
  const w = p.at(x, y);
  burst(p.scene, w.x, w.y, { count: n, tint: [0xffffff, 0xd8f3f6, 0xb8e6ee], size: 22 * p.s, speed: 140 * p.s, gravityY: -420 * p.s, lifespan: 1400, depth: D.fly });
  play(p.scene, 'bubbles', { volume: 0.5 });
}

/**
 * A cupboard door (a crop of the background) that swings open on its hinge (it narrows toward it, seen edge-on), the
 * dark inside behind it; `inside` builds what is in there for this answer and returns how long to stay open.
 */
function door(p: Place, key: string, box: Box, hinge: 'left' | 'right', inside: number) {
  const hx = hinge === 'left' ? box[0] : box[0] + box[2];
  const cover = crop(p, key, box, [hx, box[1] + box[3] / 2]);
  const tl = p.at(box[0], box[1]);
  const dark = p.scene.add.rectangle(tl.x, tl.y, box[2] * p.s, box[3] * p.s, inside).setOrigin(0, 0).setDepth(D.inside).setVisible(false);
  let open = false;
  const swing = (stay: (done: () => void) => void) => {
    if (open) return;
    open = true;
    dark.setVisible(true);
    play(p.scene, 'click', { volume: 0.6 });
    p.scene.tweens.add({
      targets: cover,
      scaleX: p.s * 0.14,
      duration: 220,
      ease: 'Quad.easeOut',
      onComplete: () =>
        stay(() =>
          p.scene.tweens.add({
            targets: cover,
            scaleX: p.s,
            duration: 260,
            ease: 'Quad.easeIn',
            onComplete: () => {
              open = false;
              dark.setVisible(false);
              play(p.scene, 'click', { volume: 0.5 });
            },
          }),
        ),
    });
  };
  return { swing, cover };
}

/** The three answers of a cupboard: the mouse with its cheese peeks out; a butterfly flies out; paper hearts float out. */
function cupboard(id: string, box: Box, hinge: 'left' | 'right', first: number): Def {
  return {
    id,
    build: (p) => {
      const d = door(p, BG.kitchen, box, hinge, 0x5d7a4f);
      const cx = box[0] + box[2] / 2;
      const bottom = box[1] + box[3];
      const mouse = thing(p, 'secret-mouse', cx, bottom - 6, 0.9).setDepth(D.thing).setVisible(false);
      const answers = [
        () =>
          d.swing((close) => {
            const y0 = mouse.y;
            mouse.setVisible(true).setY(y0 + 60 * p.s).setAlpha(1);
            play(p.scene, 'squeak', { volume: 0.6 });
            p.scene.tweens.add({ targets: mouse, y: y0, duration: 300, ease: 'Back.easeOut' });
            p.scene.tweens.add({ targets: mouse, angle: { from: -6, to: 6 }, duration: 160, yoyo: true, repeat: 3, delay: 350, onComplete: () => mouse.setAngle(0) });
            p.scene.time.delayedCall(1500, () =>
              p.scene.tweens.add({ targets: mouse, y: y0 + 60 * p.s, duration: 220, ease: 'Quad.easeIn', onComplete: () => (mouse.setY(y0).setVisible(false), close()) }),
            );
          }),
        () =>
          d.swing((close) => {
            const out = flyOut(p, 'secret-butterfly', [cx, bottom - 50], [hinge === 'left' ? cx - 520 : cx + 520, 120], { scale: 0.8, ms: 1800 });
            p.scene.time.delayedCall(Math.min(900, out), close);
          }),
        () =>
          d.swing((close) => {
            hearts(p, cx, bottom - 60, 7);
            p.scene.time.delayedCall(900, close);
          }),
      ];
      return { id, hit: box, answers: [...answers.slice(first), ...answers.slice(0, first)] };
    },
  };
}

// ---------------------------------------------------------------- the secrets of every world

const SECRETS: Record<SecretWorld, Def[]> = {
  kitchen: [
    // the right cupboard's left door (hinge on its left), and the left cupboard's right door (hinge on its right)
    cupboard('cupboard-r', [1992, 12, 204, 188], 'left', 0),
    cupboard('cupboard-l', [206, 12, 198, 190], 'right', 1),
  ],
  garden: [
    {
      // a little bird on the middle tree on the hill: it hops and sings, flies a round and comes back, or sparkles
      id: 'bird',
      build: (p) => {
        const bird = thing(p, 'secret-bird', 1176, 556, 0.7);
        return {
          id: 'bird',
          hit: [1110, 470, 140, 110],
          answers: [
            () => hop(p, bird, 34, 'squeak'),
            () => {
              bird.setVisible(false);
              const ms = flyOut(p, 'secret-bird', [1176, 520], [1700, 300], { scale: 0.7, ms: 1300, back: true });
              p.scene.time.delayedCall(ms, () => bird.setVisible(true));
            },
            () => (wiggle(p, bird, 8, 3, 'squeak'), sparkle(p, 1176, 480, 6)),
          ],
        };
      },
    },
    {
      // a butterfly resting on the fence: it flutters up, flies away and back, or sends up hearts
      id: 'butterfly',
      build: (p) => {
        const fly = thing(p, 'secret-butterfly', 1640, 700, 0.62);
        return {
          id: 'butterfly',
          hit: [1580, 630, 120, 90],
          answers: [
            () => hop(p, fly, 50, 'whoosh-soft'),
            () => {
              fly.setVisible(false);
              const ms = flyOut(p, 'secret-butterfly', [1640, 670], [2000, 380], { scale: 0.62, ms: 1400, back: true });
              p.scene.time.delayedCall(ms, () => fly.setVisible(true));
            },
            () => (hop(p, fly, 30, 'pop'), hearts(p, 1640, 650, 5)),
          ],
        };
      },
    },
  ],
  market: [
    {
      // a pigeon on the teal roof right of the stall: it bobs (pecks), flies off and comes back, or puffs up with sparkles
      id: 'pigeon',
      build: (p) => {
        const bird = thing(p, 'secret-pigeon', 1625, 394, 0.62);
        return {
          id: 'pigeon',
          hit: [1570, 310, 110, 85],
          answers: [
            () => wiggle(p, bird, 12, 3, 'squeak'),
            () => {
              bird.setVisible(false);
              const ms = flyOut(p, 'secret-pigeon', [1625, 360], [2050, 160], { scale: 0.62, ms: 1300, back: true });
              p.scene.time.delayedCall(ms, () => bird.setVisible(true));
            },
            () => (hop(p, bird, 26, 'pop'), sparkle(p, 1625, 320, 6)),
          ],
        };
      },
    },
    {
      // the pennants over the street (the background's own, cropped): they flutter, throw paper confetti, or a pigeon
      // flies along them
      id: 'pennants',
      build: (p) => {
        const flags = crop(p, BG.market, [1040, 120, 380, 120], [1230, 120]);
        const colours = [0xe8433a, 0xf5c242, 0x4b8fd1, 0x62ae48, 0xf27aa8];
        return {
          id: 'pennants',
          hit: [1040, 110, 380, 130],
          answers: [
            () => (swell(p, flags, 0.12, 3), play(p.scene, 'whoosh-soft', { volume: 0.6 })),
            () => {
              swell(p, flags, 0.08, 1);
              const w = p.at(1230, 200);
              burst(p.scene, w.x, w.y, { texture: 'fx-paper', count: 14, tint: colours, size: 26 * p.s, speed: 380 * p.s, gravityY: 600 * p.s, lifespan: 1300, depth: D.fly });
              play(p.scene, 'pop', { volume: 0.6 });
            },
            () => flyOut(p, 'secret-pigeon', [960, 170], [1520, 150], { scale: 0.5, ms: 1500 }),
          ],
        };
      },
    },
  ],
  farm: [
    {
      // the rooster on the barn's roof: he crows (a hop), flaps (a wiggle), turns round
      id: 'rooster',
      build: (p) => {
        const bird = thing(p, 'secret-rooster', 640, 236, 0.62);
        return {
          id: 'rooster',
          hit: [570, 140, 140, 100],
          answers: [
            () => (hop(p, bird, 30, 'cluck'), sparkle(p, 690, 160, 5)),
            () => wiggle(p, bird, 12, 4, 'cluck'),
            () => {
              play(p.scene, 'whoosh-soft', { volume: 0.5 });
              p.scene.tweens.add({ targets: bird, scaleX: 0, duration: 140, yoyo: true, onYoyo: () => bird.setFlipX(!bird.flipX) });
            },
          ],
        };
      },
    },
    {
      // the doghouse (its door is behind the fence): a puppy pops up over its roof, wags with hearts, or sparkles
      id: 'doghouse',
      build: (p) => {
        const pup = thing(p, 'secret-puppy', 1104, 604, 0.6).setVisible(false);
        const peek = (then: () => void) => {
          const y0 = pup.getData('y0') ?? pup.y;
          pup.setData('y0', y0);
          p.scene.tweens.killTweensOf(pup);
          pup.setVisible(true).setY(y0 + 40 * p.s).setAlpha(0).setAngle(0);
          p.scene.tweens.add({ targets: pup, y: y0, alpha: 1, duration: 280, ease: 'Back.easeOut', onComplete: then });
          p.scene.time.delayedCall(2000, () => p.scene.tweens.add({ targets: pup, y: y0 + 40 * p.s, alpha: 0, duration: 240, onComplete: () => pup.setVisible(false).setY(y0) }));
        };
        return {
          id: 'doghouse',
          hit: [980, 560, 250, 210],
          answers: [
            () => (play(p.scene, 'char-giggle', { volume: 0.5, rate: 1.3 }), peek(() => hop(p, pup, 14, 'pop'))),
            () => peek(() => (wiggle(p, pup, 10, 3, 'squeak'), hearts(p, 1104, 540, 5))),
            () => peek(() => sparkle(p, 1104, 540, 6)),
          ],
        };
      },
    },
  ],
  clinic: [
    {
      // the framed fish on the waiting room's wall (the background's own): it blows bubbles, a little fish swims out of
      // it and back, or it shines
      id: 'fish',
      build: (p) => {
        const frame = crop(p, BG.clinic, [826, 112, 230, 180], [941, 202]);
        return {
          id: 'fish',
          hit: [826, 112, 230, 180],
          answers: [
            () => (swell(p, frame, 0.06, 1), bubbles(p, 960, 140, 8)),
            () => flyOut(p, 'secret-fish', [941, 202], [1500, 240], { scale: 0.7, ms: 1500, back: true }),
            () => (swell(p, frame, 0.08, 2), sparkle(p, 941, 202, 8)),
          ],
        };
      },
    },
    {
      // the rainbow picture (the background's own): it beams a rainbow of paper bits, or sparkles, or swells
      id: 'rainbow',
      build: (p) => {
        const pic = crop(p, BG.clinic, [1592, 130, 220, 170], [1702, 215]);
        return {
          id: 'rainbow',
          hit: [1592, 130, 220, 170],
          answers: [
            () => {
              swell(p, pic, 0.08, 1);
              const w = p.at(1702, 200);
              burst(p.scene, w.x, w.y, { texture: 'fx-paper', count: 14, tint: [0xe8433a, 0xf59a3c, 0xf5c242, 0x62ae48, 0x4b8fd1, 0x9a6ad1], size: 24 * p.s, speed: 360 * p.s, gravityY: 500 * p.s, lifespan: 1300, depth: D.fly });
              play(p.scene, 'sparkle', { volume: 0.6 });
            },
            () => (swell(p, pic, 0.1, 2), sparkle(p, 1702, 215, 8)),
            () => (swell(p, pic, 0.06, 1), hearts(p, 1702, 200, 6)),
          ],
        };
      },
    },
  ],
  mermaid: [
    {
      // the two little yellow fish in the water at the left (the background's own): they puff up and blow bubbles,
      // a third fish swims out to them and back, or they sparkle
      id: 'fish-left',
      build: (p) => {
        const pair = crop(p, BG.mermaid, [585, 278, 140, 70], [655, 313]);
        return {
          id: 'fish-left',
          hit: [585, 278, 140, 70],
          answers: [
            () => (swell(p, pair, 0.12, 2), bubbles(p, 690, 280, 8)),
            () => flyOut(p, 'secret-fish', [655, 313], [1050, 260], { scale: 0.55, ms: 1300, back: true }),
            () => (swell(p, pair, 0.1, 1), sparkle(p, 655, 313, 7)),
          ],
        };
      },
    },
    {
      // the two pink fish high up at the right (the background's own): bubbles, a friend swimming by, or hearts
      id: 'fish-right',
      build: (p) => {
        const pair = crop(p, BG.mermaid, [1728, 220, 130, 64], [1793, 252]);
        return {
          id: 'fish-right',
          hit: [1728, 220, 130, 64],
          answers: [
            () => (swell(p, pair, 0.12, 2), bubbles(p, 1760, 220, 8)),
            () => flyOut(p, 'secret-fish', [1793, 252], [1400, 200], { scale: 0.55, ms: 1300, back: true }),
            () => (swell(p, pair, 0.08, 1), hearts(p, 1793, 240, 5)),
          ],
        };
      },
    },
  ],
};

/** Which answer comes next for a secret (kept on the device; a browser that keeps nothing simply starts at the first). */
function nextAnswer(world: SecretWorld, id: string, n: number) {
  const key = `cooking.secret.${world}.${id}`;
  let i = 0;
  try {
    i = Number(localStorage.getItem(key)) || 0;
    localStorage.setItem(key, String((i + 1) % n));
  } catch {
    /* nothing is kept: fine */
  }
  return i % n;
}

/**
 * Puts the world's secrets on its background and makes them answer her taps. Safe to call in any create: it waits for
 * the background (and the secrets' pictures) to be there, follows it (the clinic's rooms slide), hides with it, and lets
 * go of everything when the scene shuts down. `only` limits it to some of the world's secrets.
 */
export function addSecrets(scene: Phaser.Scene, world: SecretWorld, opts: { bg?: Phaser.GameObjects.Image; only?: string[] } = {}) {
  const bgKey = BG[world];
  let placed: { p: Place; s: Placed; parts: Phaser.GameObjects.GameObject[] }[] | null = null;
  let bg: Phaser.GameObjects.Image | undefined = opts.bg;
  let last = { x: NaN, y: NaN, s: NaN, visible: true };

  const build = () => {
    bg ??= scene.children.list.find((o) => o instanceof Phaser.GameObjects.Image && o.texture.key === bgKey) as Phaser.GameObjects.Image | undefined;
    if (!bg) return;
    const b = bg;
    const fw = b.frame.realWidth;
    const fh = b.frame.realHeight;
    const at = (x: number, y: number) => ({ x: b.x + (x - b.originX * fw) * b.scaleX, y: b.y + (y - b.originY * fh) * b.scaleY });
    placed = [];
    for (const def of SECRETS[world]) {
      if (opts.only && !opts.only.includes(def.id)) continue;
      const p: Place = { scene, s: b.scaleX, at, busy: 0 };
      const before = new Set(scene.children.list);
      const s = def.build(p);
      placed.push({ p, s, parts: scene.children.list.filter((o) => !before.has(o)) });
    }
    last = { x: b.x, y: b.y, s: b.scaleX, visible: b.visible };
    // (for the tests: where each secret is, in world units)
    scene.data.set(`secrets-${world}`, placed.map((pl) => {
      const [x, y, w, h] = pl.s.hit;
      return { id: pl.s.id, ...pl.p.at(x + w / 2, y + h / 2) };
    }));
  };

  const update = () => {
    if (!placed) {
      if (SECRET_KEYS[world].every((k) => scene.textures.exists(k))) build();
      return;
    }
    if (!bg?.active) return;
    // (the clinic's rooms: the waiting room's background slides and hides; its secrets go with it)
    const dx = bg.x - last.x;
    const dy = bg.y - last.y;
    if (dx || dy || bg.visible !== last.visible) {
      for (const pl of placed)
        for (const o of pl.parts) {
          const t = o as Phaser.GameObjects.Image;
          if (dx || dy) t.setPosition(t.x + dx, t.y + dy);
          if (t.getData('x0') !== undefined) t.setData('x0', t.getData('x0') + dx);
          if (t.getData('y0') !== undefined) t.setData('y0', t.getData('y0') + dy);
          if (bg.visible !== last.visible) {
            // (hidden with the room, each part comes back as it was: the mouse stays in its cupboard)
            if (!bg.visible) t.setData('shown', t.visible).setVisible(false);
            else t.setVisible(t.getData('shown') !== false);
          }
        }
      last = { x: bg.x, y: bg.y, s: bg.scaleX, visible: bg.visible };
    }
  };

  const down = (ptr: Phaser.Input.Pointer) => {
    if (!placed || !bg?.active || !bg.visible || bg.alpha < 0.5) return;
    if (scene.input.manager.pointers.some((o) => o !== ptr && o.isDown)) return;
    if (inNoTouchZone(scene, ptr.x, ptr.y)) return;
    // (a button, a card, anything she plays with gets the tap)
    if (scene.input.hitTestPointer(ptr).length) return;
    for (const pl of placed) {
      const [x, y, w, h] = pl.s.hit;
      const a = pl.p.at(x, y);
      const r = REACH * pl.p.s;
      const inside = ptr.worldX > a.x - r && ptr.worldX < a.x + w * pl.p.s + r && ptr.worldY > a.y - r && ptr.worldY < a.y + h * pl.p.s + r;
      if (!inside) continue;
      if (scene.time.now < pl.p.busy) return;
      pl.p.busy = scene.time.now + 700;
      pl.s.answers[nextAnswer(world, pl.s.id, pl.s.answers.length)](pl.p);
      return;
    }
  };

  scene.events.on(Phaser.Scenes.Events.UPDATE, update);
  scene.input.on(Phaser.Input.Events.POINTER_DOWN, down);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.events.off(Phaser.Scenes.Events.UPDATE, update);
    scene.input.off(Phaser.Input.Events.POINTER_DOWN, down);
    placed = null;
  });
}

/** The pictures each world's secrets need before they are placed (the background's own crops need nothing). */
const SECRET_KEYS: Record<SecretWorld, readonly string[]> = {
  kitchen: ['bg-kitchen-landscape', 'secret-mouse', 'secret-butterfly'],
  garden: ['bg-garden', 'secret-bird', 'secret-butterfly'],
  market: ['bg-market', 'secret-pigeon'],
  farm: ['bg-farm', 'secret-rooster', 'secret-puppy'],
  clinic: ['bg-clinic-wait', 'secret-fish'],
  mermaid: ['bg-lagoon', 'secret-fish'],
};
