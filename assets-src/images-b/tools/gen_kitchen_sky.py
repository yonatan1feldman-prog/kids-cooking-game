# The living window (visual round 4, 2026-09): what moves outside the kitchen window by itself, now and then: a bird
# (two wing frames) and a cloud. They are small pieces the game slides across the window's panes (core/scenery.ts),
# cropped to the glass; the window itself stays in the background. Same paper filters as the kitchen.
# Run: python images-b/tools/gen_kitchen_sky.py   (writes into images-b/live/)
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pb import *

p = "bgs-"
SKY = "#C4DCDA"
BIRD = mix("#56657A", SKY, .2)
BIRD_FAR = mix(BIRD, SKY, .35)
BEAK = mix(MUSTARD, SKY, .15)
CLOUD = "#FBF4E6"


def defs():
    return std_defs(p, "bg", seed=64, sh=(2, 2, .16), sh2=(3, 3, .18), blur=4)


def bird(up):
    # side view, flying to the right; drawn in a 44x34 box, shown at 1.3x
    if up:
        far = P("M20,15 Q20,6 16,1 Q24,5 26,14Z", BIRD_FAR)
        near = P("M17,16 Q14,6 7,2 Q19,4 25,15Z", BIRD)
    else:
        far = P("M21,19 Q22,26 19,31 Q26,26 27,19Z", BIRD_FAR)
        near = P("M17,18 Q13,27 6,31 Q20,28 25,18Z", BIRD)
    body = (P(wob(22, 18, 9.5, 4.6, .05, 7), BIRD) + C(30.5, 15.5, 4.4, BIRD)
            + P("M34,14.2 L39,15.8 L34,17.4Z", BEAK) + P("M14,17 L6,13.5 L7.5,21Z", BIRD))
    return G(far + body + near, p + "sh", ' transform="scale(1.3)"')


def cloud():
    return G(P(wob(34, 40, 25, 12, .08, 81), CLOUD) + P(wob(68, 33, 44, 17, .08, 82), CLOUD)
             + P(wob(104, 27, 29, 16, .08, 83), CLOUD) + P(wob(126, 38, 20, 10, .08, 84), CLOUD), p + "sh")


PIECES = {
    "kitchen-bird-up": (bird(True), 58, 44),
    "kitchen-bird-down": (bird(False), 58, 44),
    "kitchen-cloud": (cloud(), 156, 62),
}


def main():
    for key, (body, w, h) in PIECES.items():
        path, size = write(key, svg(w, h, defs(), G(body, p + "gr")), "live")
        print(f"{key:20s} {size / 1024:5.1f} KB  {w}x{h}")


if __name__ == "__main__":
    main()
