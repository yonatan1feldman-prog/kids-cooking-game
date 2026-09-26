import Phaser from 'phaser';
import { listPhotos } from '../core/album';
import { voice } from '../core/audio';
import { burst, stars } from '../core/fx';
import { MomHandView, type HandMotion } from '../core/hand';
import { confetti, settle, sway, tickles, touchRipples } from '../core/juice';
import { addBackground, getLayout, inNoTouchZone, keepLayoutOnResize, ORIENTATION_PAUSE, PALM_ZONE, type Layout } from '../core/layout';
import { cutGrid, helpOrder, makePieceTextures, nextGrid, puzzleFinished, puzzlesDone, type PieceShape } from '../core/puzzle';
import { sfx } from '../core/sfx';
import { getStage } from '../core/stage';
import { AUTO_AFTER_HINT_MS, DEMO_MAX_MS, HINT_AFTER_MS, TUNING } from '../core/tuning';
import { iconButton, otherPointerDown } from '../core/ui';
import { RECIPES } from '../recipes';
import { Character } from '../steps/Character';
import { Mom } from '../steps/Mom';
import { assetsReady } from './BootScene';

type P = { x: number; y: number };

interface Piece {
  img: Phaser.GameObjects.Image;
  shape: PieceShape;
  /** Its place on the board (world). */
  home: P;
  /** Where it waits beside the board, and at what size. */
  tray: P;
  placed: boolean;
}

const PHOTO = 'puzzle-photo';
const PREFIX = 'puzzle-piece';

/**
 * The puzzle (research/puzzle-spec.md): a photo from the memory book, cut into jigsaw pieces at runtime. The whole
 * picture shows first, then it comes apart and the pieces settle beside the board, where the picture stays faint
 * under the piece outlines. She drags a piece near its place and it clicks in; anywhere else it floats gently back
 * (a quiet miss, three in a row show the hint). Mom's hand shows a piece's way after HINT_AFTER_MS, and after
 * AUTO_AFTER_HINT_MS more she puts one piece in herself and gives the puzzle back. All in: the picture is whole
 * again, stars, Mom's line, and back to the book. 4 pieces the first time, then 6, 9 and 12 (TUNING.puzzle).
 *
 * One finger owns a piece until it is lifted; no rotation, no timer, no score, nothing to lose (the wellbeing rules).
 */
export class PuzzleScene extends Phaser.Scene {
  private photoId = 0;
  private page = 0;
  private pieces: Piece[] = [];
  private owner: Phaser.Input.Pointer | null = null;
  private held: Piece | null = null;
  private grab: P = { x: 0, y: 0 };
  private cell = { w: 0, h: 0 };
  private traySize = 1;
  private ready = false;
  private done = false;
  private helping = false;
  private demoOn = false;
  private idle = 0;
  private hintOn = false;
  private misses = 0;
  private boardBox = { x0: 0, y0: 0, x1: 0, y1: 0 };
  private hand!: MomHandView;
  private mom: Mom | null = null;
  private pipa: Character | null = null;
  private mine: string[] = [];
  private leaving = false;
  /** For the test harness. */
  shown = { ready: false, done: false, cols: 0, rows: 0, n: 0, placed: 0, tray: 0, helped: 0, missed: 0 };

  constructor() {
    super('Puzzle');
  }

  init(data: { photoId?: number; page?: number }) {
    this.photoId = data.photoId ?? 0;
    this.page = data.page ?? 0;
    this.pieces = [];
    this.owner = this.held = null;
    this.ready = this.done = this.helping = this.demoOn = this.hintOn = this.leaving = false;
    this.idle = this.misses = 0;
    this.mine = [];
    this.mom = this.pipa = null;
    this.shown = { ready: false, done: false, cols: 0, rows: 0, n: 0, placed: 0, tray: 0, helped: 0, missed: 0 };
  }

  create() {
    const L = getLayout(this);
    // The puzzle keeps its layout on a size change (the camera zooms): the pieces she has put in stay put.
    keepLayoutOnResize(this, L);
    addBackground(this, L);
    const S = getStage(L);

    iconButton(this, L, 'btn-home', S.home.x, S.home.y, () => this.back(), { confirm: true, scale: S.homeScale, hitPad: 30 }).setDepth(900);
    this.hand = new MomHandView(this, L);
    touchRipples(this, L);

    assetsReady().then(() => {
      if (!this.scene.isActive()) return;
      this.mom = new Mom(this, S.mom);
      this.mom.rest();
      this.mom.followHand(() => this.hand.active);
      if (S.pet) {
        this.pipa = new Character(this, RECIPES[0].character, S.pet, S.feedPet);
        this.pipa.enter(150);
      }
      tickles(this, () => [this.mom, this.pipa]);
    });

    this.input.on(Phaser.Input.Events.GAMEOBJECT_DOWN, this.onDown, this);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.onAnyDown, this);
    this.input.on(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    const up = (p: Phaser.Input.Pointer) => this.onUp(p, p.wasCanceled);
    const upOutside = (p: Phaser.Input.Pointer) => this.onUp(p, true);
    this.input.on(Phaser.Input.Events.POINTER_UP, up);
    this.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, upOutside);
    // The device turned to portrait: the piece in her hand floats back, gently.
    const onPause = () => this.owner && this.onUp(this.owner, true);
    this.game.events.on(ORIENTATION_PAUSE, onPause);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(ORIENTATION_PAUSE, onPause);
      this.input.off(Phaser.Input.Events.GAMEOBJECT_DOWN, this.onDown, this);
      this.input.off(Phaser.Input.Events.POINTER_DOWN, this.onAnyDown, this);
      this.input.off(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
      this.input.off(Phaser.Input.Events.POINTER_UP, up);
      this.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, upOutside);
      this.hand.destroy();
      for (const k of this.mine) if (this.textures.exists(k)) this.textures.remove(k);
      this.mine = [];
    });

    void this.build(L, S);
  }

  /** Back to the memory book, on the page she came from (the home button, or quietly after the finale). */
  private back() {
    if (this.leaving) return;
    this.leaving = true;
    this.scene.start('Album', { page: this.page });
  }

  /** The photo as a texture (from the book's data URL). */
  private loadPhoto(data: string): Promise<boolean> {
    return new Promise((resolve) => {
      let settled = false;
      const end = (ok: boolean) => {
        if (settled) return;
        settled = true;
        resolve(ok);
      };
      try {
        if (this.textures.exists(PHOTO)) this.textures.remove(PHOTO);
        this.textures.once(`addtexture-${PHOTO}`, () => end(true));
        this.textures.addBase64(PHOTO, data);
        this.mine.push(PHOTO);
        this.time.delayedCall(2500, () => end(false));
      } catch {
        end(false);
      }
    });
  }

  private async build(L: Layout, S: ReturnType<typeof getStage>) {
    const photo = (await listPhotos()).find((p) => p.id === this.photoId);
    if (!this.scene.isActive()) return;
    if (!photo || !(await this.loadPhoto(photo.data)) || !this.scene.isActive()) return this.back();
    await assetsReady();
    if (!this.scene.isActive()) return;

    const { k } = L;
    // The room: from the thumb strip to Mom's face (or Pipa), above the palm strip.
    const x0 = L.m + 12 * k;
    const x1 = S.albumArea.x1;
    const y0 = L.Y(40);
    const y1 = L.H * (1 - PALM_ZONE) - 14 * k;
    const B = Math.floor(Math.min((y1 - y0) * 0.9, (x1 - x0) * 0.52));
    const bx = x1 - B / 2 - 18 * k;
    const by = (y0 + y1) / 2;
    const matPad = 22 * k;
    this.boardBox = { x0: bx - B / 2 - matPad, y0: by - B / 2 - matPad, x1: bx + B / 2 + matPad, y1: by + B / 2 + matPad };

    // The board: a sheet of the album's cream card with a warm brown edge, a soft shadow under it.
    const mat = this.add.graphics().setDepth(10);
    const r = 28 * k;
    const bb = this.boardBox;
    mat.fillStyle(0x000000, 0.13).fillRoundedRect(bb.x0 + 10 * k, bb.y0 + 14 * k, bb.x1 - bb.x0, bb.y1 - bb.y0, r);
    mat.fillStyle(0xc98b5b).fillRoundedRect(bb.x0, bb.y0, bb.x1 - bb.x0, bb.y1 - bb.y0, r);
    mat.fillStyle(0xfff6e6).fillRoundedRect(bb.x0 + 10 * k, bb.y0 + 10 * k, bb.x1 - bb.x0 - 20 * k, bb.y1 - bb.y0 - 20 * k, r * 0.7);

    // The cut.
    const [cols, rows] = nextGrid();
    const shapes = cutGrid(cols, rows);
    const src = this.textures.get(PHOTO).getSourceImage() as HTMLImageElement;
    const { pad, w, h } = makePieceTextures(this.game, src, B, cols, rows, shapes, PREFIX);
    this.cell = { w, h };
    shapes.forEach((_, i) => this.mine.push(`${PREFIX}-${i}`));
    this.mine.push(`${PREFIX}-guide`);
    const guide = this.add.image(bx, by, `${PREFIX}-guide`).setDepth(11).setAlpha(0);
    const whole = this.add.image(bx, by, PHOTO).setDepth(12).setDisplaySize(B, B);

    // Where the pieces wait: left of the board, clear of the home button.
    const homeR = 110 * k;
    const gap = 26 * k;
    const trayX1 = bb.x0 - gap;
    const homeBottom = S.home.y + homeR + 10 * k;
    const regions = [
      { x0: S.home.x + homeR + 10 * k, x1: trayX1, y0, y1: homeBottom },
      { x0, x1: trayX1, y0: homeBottom, y1 },
    ].filter((g) => g.x1 - g.x0 > 60 * k && g.y1 - g.y0 > 60 * k);
    const pw = w + 2 * pad;
    const ph = h + 2 * pad;
    const n = shapes.length;
    let slots: P[] = [];
    let s: number = TUNING.puzzle.trayMax;
    for (; s >= 0.3; s -= 0.025) {
      // A piece's footprint in the tray: its cell and a little of its tabs (tabs may reach between neighbours).
      const fw = (w + 1.4 * pad) * s + 8 * k;
      const fh = (h + 1.4 * pad) * s + 8 * k;
      slots = [];
      for (const g of regions) {
        const nc = Math.floor((g.x1 - g.x0) / fw);
        const nr = Math.floor((g.y1 - g.y0) / fh);
        const ox = g.x0 + (g.x1 - g.x0 - nc * fw) / 2 + fw / 2;
        const oy = g.y0 + (g.y1 - g.y0 - nr * fh) / 2 + fh / 2;
        for (let rr = 0; rr < nr; rr++) for (let cc = 0; cc < nc; cc++) slots.push({ x: ox + cc * fw, y: oy + rr * fh });
      }
      if (slots.length >= n) break;
    }
    s = Math.max(0.3, s);
    this.traySize = s;
    // Spread the pieces over the free slots (not all bunched at the top), in a shuffled order.
    const pick = slots.length >= n ? Array.from({ length: n }, (_, i) => slots[Math.floor(((i + 0.5) * slots.length) / n)]) : Array.from({ length: n }, (_, i) => slots[i % Math.max(1, slots.length)] ?? { x: x0 + 100 * k, y: by });
    const order = Phaser.Utils.Array.Shuffle(Array.from({ length: n }, (_, i) => i));

    // Every piece's touch area reaches at least 200 x 200 world units (UX rule 4) around its cell.
    const minTouch = 200 * k;
    this.pieces = shapes.map((shape, i) => {
      const home = { x: bx - B / 2 + (shape.col + 0.5) * w, y: by - B / 2 + (shape.row + 0.5) * h };
      const t = pick[order[i]];
      const jitter = 6 * k;
      const tray = { x: t.x + Phaser.Math.FloatBetween(-jitter, jitter), y: t.y + Phaser.Math.FloatBetween(-jitter, jitter) };
      const img = this.add.image(home.x, home.y, `${PREFIX}-${i}`).setDepth(20 + i).setVisible(false);
      const hw = Math.max(w / 2 + pad * 0.4, minTouch / 2 / s);
      const hh = Math.max(h / 2 + pad * 0.4, minTouch / 2 / s);
      img.setInteractive(new Phaser.Geom.Rectangle(pw / 2 - hw, ph / 2 - hh, hw * 2, hh * 2), Phaser.Geom.Rectangle.Contains);
      img.input!.enabled = false;
      const piece: Piece = { img, shape, home, tray, placed: false };
      img.setData('piece', piece);
      return piece;
    });
    this.shown = { ...this.shown, cols, rows, n, tray: Math.round(s * 100) / 100 };

    // "Let's make a puzzle from your picture!": the whole picture first, then it comes apart.
    voice.say('vo-puzzle', { ttlMs: 4000, valid: () => this.scene.isActive() });
    this.time.delayedCall(1300, () => {
      sfx(this, 'whoosh');
      this.tweens.add({ targets: whole, alpha: 0, duration: 250 });
      this.tweens.add({ targets: guide, alpha: 1, duration: 250 });
      this.pieces.forEach((p, i) => {
        p.img.setVisible(true);
        this.tweens.add({
          targets: p.img,
          x: p.tray.x,
          y: p.tray.y,
          scale: s,
          duration: 520,
          delay: 60 * i,
          ease: 'Back.easeOut',
          onComplete: () => {
            if (p.img.input) p.img.input.enabled = true;
          },
        });
      });
      this.time.delayedCall(520 + 60 * n + 50, () => {
        this.ready = true;
        this.shown.ready = true;
        whole.destroy();
        // The first puzzle on this device: Mom shows once how a piece goes in (a touch ends it at once).
        if (puzzlesDone() === 0) this.showWay(false);
      });
    });
  }

  /** The next piece Mom shows or puts in: corners first, then the border, then the middle. */
  private nextPiece(): Piece | null {
    const order = helpOrder(this.pieces.map((p) => p.shape));
    return order.map((i) => this.pieces[i]).find((p) => !p.placed && p !== this.held) ?? null;
  }

  /** Mom's hand carries a see-through copy of a piece from where it waits to its place: once (the demo) or looping (the hint). */
  private showWay(loop: boolean) {
    const p = this.nextPiece();
    if (!p) return;
    const m: HandMotion = {
      kind: 'grab',
      keys: [
        { x: p.tray.x, y: p.tray.y, t: 0 },
        { x: p.tray.x, y: p.tray.y, t: 300 },
        { x: p.home.x, y: p.home.y, t: 1700 },
        { x: p.home.x, y: p.home.y, t: 2200 },
      ],
      props: [{ key: p.img.texture.key, scale: this.traySize, endScale: 1, alpha: 0.6 }],
      glow: loop ? p.home : undefined,
    };
    if (!loop) {
      m.keys = m.keys.filter((q) => q.t <= DEMO_MAX_MS);
      this.demoOn = true;
      this.hand.play(m, { onDone: () => (this.demoOn = false) });
      return;
    }
    this.hintOn = true;
    this.hand.play(m, { loop: true, gapMs: 900 });
  }

  private stopHint() {
    if (this.hintOn || this.demoOn) this.hand.stop();
    this.hintOn = this.demoOn = false;
  }

  /** Mom puts one piece in herself ("Let me help you!"), then the puzzle is hers again. */
  private help() {
    const p = this.nextPiece();
    if (!p || this.helping) return;
    this.stopHint();
    this.helping = true;
    this.shown.helped++;
    if (p.img.input) p.img.input.enabled = false;
    voice.say('vo-help', { ttlMs: 2500, valid: () => this.scene.isActive() && !this.done });
    p.img.setDepth(500);
    this.hand.follow('grab', () => ({ x: p.img.x, y: p.img.y }));
    this.tweens.add({
      targets: p.img,
      x: p.home.x,
      y: p.home.y,
      scale: 1,
      delay: 250,
      duration: TUNING.puzzle.helpMs,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.hand.stop();
        this.helping = false;
        this.idle = 0;
        this.place(p);
      },
    });
  }

  /** Any touch: a demo or a hint gives way at once (the touch still counts for what it lands on). */
  private onAnyDown(p: Phaser.Input.Pointer) {
    if (this.demoOn || (this.hintOn && !this.owner)) {
      if (!otherPointerDown(this, p)) this.stopHint();
    }
    if (!otherPointerDown(this, p)) this.idle = 0;
  }

  private onDown(p: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) {
    const piece = obj.getData?.('piece') as Piece | undefined;
    if (!piece || piece.placed || !this.ready || this.done || this.helping || this.owner) return;
    if (inNoTouchZone(this, p.x, p.y) || otherPointerDown(this, p)) return;
    this.stopHint();
    this.owner = p;
    this.held = piece;
    this.tweens.killTweensOf(piece.img);
    // The point of the piece under her finger stays under it while it grows to its board size (kept near its middle).
    const lim = 0.35 * Math.min(this.cell.w, this.cell.h);
    const s = piece.img.scale || 1;
    this.grab = {
      x: Phaser.Math.Clamp((piece.img.x - p.worldX) / s, -lim, lim),
      y: Phaser.Math.Clamp((piece.img.y - p.worldY) / s, -lim, lim),
    };
    piece.img.setDepth(600);
    this.tweens.add({ targets: piece.img, scale: 1, x: p.worldX + this.grab.x, y: p.worldY + this.grab.y, duration: 140, ease: 'Quad.easeOut' });
    sfx(this, 'tap', { volume: 0.7 });
  }

  private onMove(p: Phaser.Input.Pointer) {
    if (p !== this.owner || !this.held) return;
    const img = this.held.img;
    const L = getLayout(this);
    const nx = Phaser.Math.Clamp(p.worldX + this.grab.x, 0, L.W);
    const ny = Phaser.Math.Clamp(p.worldY + this.grab.y, 0, L.H);
    // The lift's grow tween ends early once she moves: the piece is at its board size and under her finger.
    if (this.tweens.isTweening(img)) this.tweens.killTweensOf(img);
    img.setScale(1).setPosition(nx, ny);
    sway(this, img, p.worldX - p.prevPosition.x, L.k);
  }

  private onUp(p: Phaser.Input.Pointer, cancelled: boolean) {
    if (p !== this.owner) return;
    const piece = this.held;
    this.owner = null;
    this.held = null;
    if (!piece) return;
    settle(this, piece.img);
    const img = piece.img;
    const near = Math.hypot(img.x - piece.home.x, img.y - piece.home.y) < TUNING.puzzle.snap * Math.min(this.cell.w, this.cell.h);
    if (near && !cancelled) return this.place(piece);
    // Anywhere else it floats back to where it waited; let go over the board, that is a (quiet) miss.
    const bb = this.boardBox;
    if (!cancelled && img.x > bb.x0 && img.x < bb.x1 && img.y > bb.y0 && img.y < bb.y1) {
      this.shown.missed++;
      if (++this.misses >= 3) {
        this.misses = 0;
        this.idle = 0;
        this.showWay(true);
      }
    }
    img.setDepth(20 + this.pieces.indexOf(piece));
    this.tweens.add({ targets: img, x: piece.tray.x, y: piece.tray.y, scale: this.traySize, duration: 380, ease: 'Back.easeOut' });
  }

  /** A piece clicks into its place: a little squash, sparkles, a click. */
  private place(piece: Piece) {
    const L = getLayout(this);
    piece.placed = true;
    if (piece.img.input) piece.img.input.enabled = false;
    piece.img.setDepth(30 + this.pieces.indexOf(piece)).setAngle(0);
    this.tweens.killTweensOf(piece.img);
    this.tweens.chain({
      targets: piece.img,
      tweens: [
        { x: piece.home.x, y: piece.home.y, scale: 1.04, duration: 110, ease: 'Quad.easeOut' },
        { scale: 1, duration: 260, ease: 'Back.easeOut' },
      ],
    });
    sfx(this, 'click');
    sfx(this, 'pop', { volume: 0.6 });
    burst(this, piece.home.x, piece.home.y, { texture: 'star', count: 6, size: 34 * L.k, speed: 380, gravityY: 500, lifespan: 650, depth: 70 });
    this.misses = 0;
    this.idle = 0;
    this.shown.placed = this.pieces.filter((q) => q.placed).length;
    if (this.pieces.every((q) => q.placed)) return this.finish();
    // Mom's eyes light up for a moment; Pipa too, now and then.
    this.mom?.happy();
    this.time.delayedCall(900, () => !this.done && this.mom?.rest());
    if (this.shown.placed % 2 === 0) this.pipa?.cheer();
  }

  /** The picture is whole again: the lines go, stars and paper, Mom's line and cheer, then quietly back to the book. */
  private finish() {
    if (this.done) return;
    this.done = true;
    this.shown.done = true;
    this.stopHint();
    puzzleFinished();
    const L = getLayout(this);
    const bx = (this.boardBox.x0 + this.boardBox.x1) / 2;
    const by = (this.boardBox.y0 + this.boardBox.y1) / 2;
    this.time.delayedCall(420, () => {
      const B = this.boardBox.x1 - this.boardBox.x0 - 44 * L.k;
      const whole = this.add.image(bx, by, PHOTO).setDepth(80).setDisplaySize(B, B).setAlpha(0);
      this.tweens.add({ targets: whole, alpha: 1, duration: 450 });
      sfx(this, 'cheer-jingle');
      stars(this, bx, by, 14, 70 * L.k);
      confetti(this, bx, by - 100 * L.k, 22, 28 * L.k);
      this.mom?.celebrate();
      this.pipa?.cheer();
      let gone = false;
      const leave = () => {
        if (gone) return;
        gone = true;
        this.time.delayedCall(2200, () => this.back());
      };
      voice.say('vo-puzzle-done', { ttlMs: 4000, valid: () => this.scene.isActive(), done: leave });
      // In case the line never plays (no sound on the device yet): the book still comes back.
      this.time.delayedCall(6000, leave);
    });
  }

  update(_t: number, delta: number) {
    const p = this.owner ?? this.input.manager.pointers.find((q) => q.isDown);
    const at = this.held ? { x: this.held.img.x, y: this.held.img.y } : (this.hand.position ?? (p ? { x: p.worldX, y: p.worldY } : null));
    if (at) {
      this.mom?.lookAt(at.x, at.y);
      this.pipa?.lookAt(at.x, at.y);
    }
    if (!this.ready || this.done || this.helping || this.demoOn || this.owner) return;
    this.idle += delta;
    if (!this.hintOn && this.idle >= HINT_AFTER_MS) this.showWay(true);
    if (this.idle >= HINT_AFTER_MS + AUTO_AFTER_HINT_MS) this.help();
  }
}
