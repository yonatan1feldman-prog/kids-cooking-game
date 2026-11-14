import Phaser from 'phaser';
import { tapMotion, type HandMotion } from '../../core/hand';
import * as paper from '../../core/paper';
import { CUSTOMERS, customerImages, savedLook, type CustomerId } from '../../core/salon';
import { delight, makeCustomer, type Dressing } from '../../core/salonDress';
import { readMark } from '../../core/sea';
import { startWish } from '../../core/salonWish';
import { sfx } from '../../core/sfx';
import { TUNING } from '../../core/tuning';
import { releaseImages } from '../BootScene';
import type { P } from '../MiniGame';
import type { SalonPlan, SalonStage, SeaSalon } from '../SeaSalon';

/**
 * Who comes to the salon today? (spec 5.0) The three little mermaid girls wait on a bench of shells, each in her look of
 * last time (or her own hair and the classic tail), and wave as they arrive. A tap on one: Mom says her name, she swims
 * up into the big shell chair, the other two swim off (their pictures are freed: the salon keeps one customer). After 5 s
 * Mom's hand taps one; she picks one herself after 15 s more (the first time: Marina).
 */
export class Pick implements SalonStage {
  readonly id = 'pick' as const;
  readonly free = false;
  readonly hasDone = false;
  private waiting: Dressing[] = [];
  private bench?: Phaser.GameObjects.Image;
  private chosen = false;
  private hintAt = 0;

  constructor(private h: SeaSalon) {}

  begin() {
    const h = this.h;
    const S = h.table.salon;
    this.bench = h.add.image(S.bench.x, S.bench.y, 'salon-bench').setScale(S.bench.scale).setDepth(6);
    paper.appear(h, this.bench);
    this.waiting = CUSTOMERS.map((id, i) => {
      const d = makeCustomer(h, id, savedLook(id), S.benchSeat(i));
      d.ch.box.setDepth(7);
      d.ch.enter(250 + i * 180);
      // (each waves hello as she arrives: a happy hop and her giggle)
      h.time.delayedCall(800 + i * 260, () => d.ch.box.active && !this.chosen && delight(h, d));
      return d;
    });
    h.shown.waiting = this.waiting.map((d) => d.id);
    h.time.delayedCall(700, () => h.play('vo-salon-who'));
  }

  hintAfter() {
    return TUNING.salon.pickHintMs;
  }
  helpAfter() {
    return TUNING.salon.pickHelpMs;
  }

  /** Who Mom points at / picks: the first time Marina, else the one after who came last. */
  private suggestion(): Dressing {
    if (this.h.firstVisit) return this.waiting.find((d) => d.id === 'marina') ?? this.waiting[0];
    const last = readMark<CustomerId>('salon.last');
    const i = last ? (CUSTOMERS.indexOf(last) + 1 + this.hintAt) % CUSTOMERS.length : this.hintAt % CUSTOMERS.length;
    return this.waiting.find((d) => d.id === CUSTOMERS[i]) ?? this.waiting[0];
  }

  private centre(d: Dressing): P {
    return d.toWorld({ x: 300, y: 300 });
  }

  way(): HandMotion | null {
    if (this.chosen) return null;
    const d = this.suggestion();
    this.hintAt++;
    return { ...tapMotion(this.centre(d), this.h.k), glow: this.centre(d) };
  }

  helpOnce() {
    if (this.chosen) return false;
    const d = this.h.firstVisit ? this.waiting.find((q) => q.id === 'marina')! : this.suggestion();
    this.h.momHand.play(tapMotion(this.centre(d), this.h.k), { onDone: () => (this.h.helpDone(), this.choose(d)) });
    return true;
  }

  plan(): SalonPlan | null {
    if (this.chosen) return null;
    const want = (window as unknown as { __salonCustomer?: CustomerId }).__salonCustomer;
    const d = this.waiting.find((q) => q.id === want) ?? this.waiting[0];
    return { kind: 'tap', at: this.centre(d), what: d.id };
  }

  down(_p: Phaser.Input.Pointer, at: P) {
    if (this.chosen) return;
    let best: Dressing | undefined;
    let bd = Infinity;
    for (const d of this.waiting) {
      if (!d.ch.hit(at.x, at.y)) continue;
      const dd = Math.abs(at.x - d.ch.rest.x);
      if (dd < bd) (bd = dd), (best = d);
    }
    if (best) this.choose(best);
  }

  private choose(d: Dressing) {
    if (this.chosen) return;
    this.chosen = true;
    const h = this.h;
    const S = h.table.salon;
    h.progress();
    sfx(h, 'pop', { pitch: 'vary' });
    h.name(`name-${d.id}`);
    h.speak('vo-salon-sit', { ttlMs: 5000 });
    h.theMom?.happy();
    h.time.delayedCall(900, () => h.theMom?.rest());
    // she swims up into the chair, a few bubbles behind her
    d.ch.box.setDepth(6);
    d.ch.moveTo(S.seat, 600);
    h.sparkle(this.centre(d), [0xffffff, 0xeafcff], 8);
    h.time.delayedCall(650, () => d.ch.box.active && delight(h, d));
    // the other two swim off, out of the salon (and their pictures go: one customer stays in memory)
    const others = this.waiting.filter((q) => q !== d);
    others.forEach((o, i) => {
      const dir = o.ch.rest.x < d.ch.rest.x ? -1 : 1;
      h.tweens.killTweensOf(o.ch.box);
      h.tweens.add({
        targets: o.ch.box,
        x: o.ch.box.x + dir * 420 * h.k,
        y: o.ch.box.y - 160 * h.k,
        alpha: 0,
        angle: dir * 10,
        delay: 120 + i * 80,
        duration: 650,
        ease: 'Sine.easeIn',
        onComplete: () => {
          o.undress();
          o.ch.box.destroy();
          // (one frame later: nothing shows them any more)
          // (QA salon: Marina dressed keeps her rig: the lagoon shows her in her look right after, and reloading it there
          // on a slow phone left her a green box; about 1.6 MB while another girl is styled)
          if (o.id !== 'marina' || !readMark('salon.marina')) h.time.delayedCall(30, () => releaseImages(h.game, customerImages(o.id)));
        },
      });
    });
    if (this.bench) paper.vanish(h, this.bench);
    h.shown.released = others.map((o) => o.id);
    this.waiting = [d];
    h.time.delayedCall(700, () => {
      h.seat(d);
      startWish(h); // salon PR 3: hard, her wish
      h.stageOver(900);
    });
  }

  end() {
    this.hintAt = 0;
  }
}
