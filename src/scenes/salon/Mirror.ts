import type { HandMotion } from '../../core/hand';
import { keepLook } from '../../core/salon';
import { delight } from '../../core/salonDress';
import type { P } from '../MiniGame';
import type { SalonStage, SeaSalon } from '../SeaSalon';

/**
 * The end of the visit (salon PR 1's simple version; salon PR 4 makes it the mirror and the show, spec 5.6): she spins
 * with joy in her new look, the ta-da and the photo for the memory book (the sea's frame), her look is kept (Marina wears
 * hers in the lagoon: salon PR 4), and Mom's warm goodbye; then back to the lagoon. Nothing to do: it runs by itself.
 */
export class Mirror implements SalonStage {
  readonly id = 'mirror' as const;
  readonly free = false;
  readonly hasDone = false;
  private photoDone = false;

  constructor(private h: SeaSalon) {}

  begin() {
    const h = this.h;
    const c = h.customer;
    if (!c) return h.bye('vo-salon-bye');
    // her look stays, whatever happens next (the home button during the photo too)
    keepLook(c.id, c.look);
    h.zoom(false);
    h.time.delayedCall(300, () => {
      c.ch.partyDance(true);
      h.theMom?.celebrate();
    });
    h.time.delayedCall(1700, () => this.snap());
  }

  private snap() {
    const h = this.h;
    const c = h.customer;
    if (!c || this.photoDone || !h.scene.isActive()) return;
    this.photoDone = true;
    const L = h.layout;
    const S = h.table.salon;
    const side = Math.min(L.H * 0.92, 720 * S.seat.scale);
    const mid = c.toWorld({ x: 300, y: 360 });
    const area = { x: mid.x - side / 2, y: Math.max(0, mid.y - side / 2), w: side, h: side };
    const at: P = { x: (S.room.x0 + S.room.x1) / 2, y: L.cy };
    h.photo(area, at, (photo) => {
      delight(h, c);
      h.time.delayedCall(1800, () => {
        h.tweens.add({ targets: photo, alpha: 0, scale: 0.6, duration: 500 });
        h.bye('vo-salon-bye');
      });
    });
  }

  way(): HandMotion | null {
    return null;
  }
  helpOnce() {
    return false;
  }
  down(_p: Phaser.Input.Pointer, at: P) {
    // (a tap on her meanwhile: she giggles)
    this.h.tickleCustomer(at);
  }
}
