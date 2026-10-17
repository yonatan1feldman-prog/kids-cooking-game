# images-b-clinic, round 6 (research/clinic-spec-6.md). Shares gen_clinic.py's kit and palette; writes into images-b-clinic/.
# Run: python tools/gen_clinic6.py [names...]   then copy the SVGs into public/assets/images and bake the WebPs.
# Part A (PR 1): clinic-bowl, the kidney bowl beside the close-up: whatever the tweezers or the magnet take out of her
# goes in it (Jonathan's rule). The things lie "in" it over its floor (BOWL_FLOOR), drawn on top in the game.
import sys, os
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from gen_clinic import *  # noqa: F401,F403
import gen_clinic as gc

# The bowl's floor in its 300x170 frame: the band the things lie on (centre, half width, half height).
BOWL_FLOOR = (150, 92, 98, 26)


def kidney(cx, cy, w, h, dent):
    """A kidney outline: an oval with its top edge pulled in (`dent`) in the middle."""
    x0, x1, y0, y1 = cx - w, cx + w, cy - h, cy + h
    return (f"M{n(x0)},{n(cy)} C{n(x0)},{n(y0)} {n(cx - w * .55)},{n(y0)} {n(cx - w * .3)},{n(y0 + h * .12)}"
            f" Q{n(cx)},{n(y0 + dent)} {n(cx + w * .3)},{n(y0 + h * .12)}"
            f" C{n(cx + w * .55)},{n(y0)} {n(x1)},{n(y0)} {n(x1)},{n(cy)}"
            f" C{n(x1)},{n(y1)} {n(cx + w * .5)},{n(y1)} {n(cx)},{n(y1 - h * .08)}"
            f" C{n(cx - w * .5)},{n(y1)} {n(x0)},{n(y1)} {n(x0)},{n(cy)}Z")


def bowl():
    """300x170: a steel-blue enamel kidney bowl seen from a little above (it must stand out from the white pillow and the
    aqua bed it often sits over): a darker rim line, a pale floor inside, a soft shadow under it."""
    p = "cbo-"
    RIM_D = "#4E7F9C"; BODY = "#A9C6DA"; BODY_L = "#CFE0EC"; FLOOR = "#E6EFF5"
    s = ground_shadow(150, 152, 132, 14, p, .32)
    s += G(P(kidney(150, 90, 138, 68, 40), RIM_D) + P(kidney(150, 85, 133, 63, 40), BODY), p + "cut")
    s += P(kidney(150, 90, 114, 48, 32), BODY_L)
    s += P(kidney(150, 96, 98, 35, 24), FLOOR)
    s += stroke("M70,112 Q150,138 230,112", BODY, 5, ' opacity="0.6"')
    s += P(wob(80, 58, 30, 8, .1, 4, 12, -18), WHITE, ' opacity="0.95"')
    s += P(wob(228, 60, 15, 6, .1, 5, 10, 16), WHITE, ' opacity="0.8"')
    return doc(p, 300, 170, s, "smooth", seed=611, cut={"rim": 2.6, "rough": 3.5})


ITEMS6 = {"clinic-bowl": bowl}


if __name__ == "__main__":
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    for k, fn in ITEMS6.items():
        if not only or k in only:
            gc.save(k, fn())
    print("anchors: BOWL_FLOOR", BOWL_FLOOR)
