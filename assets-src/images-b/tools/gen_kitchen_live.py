# The living kitchen (gameplay round, 2026-09): the few background things she can tap (the jars and the basil on the
# shelf, the four utensils on the rail, the three copper pots, the sun in the window) as their own small SVGs, and the
# background without them. Drawn by exactly the same code as gen_kitchen.bg_kitchen (same seeds, same filters, same
# coordinates), so the game lays each one exactly over its empty spot and the kitchen looks as before until she taps.
# Each piece's viewBox is its own box in the background's 2400x1080 frame, so the paper grain lines up too.
# Run: python images-b/tools/gen_kitchen_live.py   (writes into images-b/live/)
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pb import *
import gen_kitchen
from gen_kitchen import wrect, rect  # (the kitchen's own coarser wrect, as in the background)

p = "bgk-"
JAR = "#F7F0E2"
MT, MT_D = mix(METAL, BG_WALL, .25), mix(METAL_D, BG_WALL, .25)
ry = 70


def jar_flour():
    return G(P(wrect(520, 130, 84, 96, 20, 1, 90), JAR) + P(wrect(513, 118, 98, 20, 9, .8, 91), BG_WOOD_D) + P(wrect(538, 158, 48, 32, 8, .8, 92), mix(MUSTARD, BG_WALL, .3)), p + "sh")


def jar_pasta():
    past = "".join(P(wob(642 + (i % 3) * 20, 164 + (i // 3) * 15, 8, 4.5, .2, 100 + i, 8, i * 40), mix("#EFC66E", BG_WALL, .2)) for i in range(12))
    return G(P(wrect(624, 146, 78, 80, 17, 1, 93), mix("#CFE0DC", BG_WALL, .2)) + past + P(wrect(618, 134, 90, 17, 8, .8, 94), mix(TEAL, BG_WALL, .45)), p + "sh")


def jar_jam():
    return G(P(wrect(724, 160, 62, 66, 10, 1, 95), mix(RUST, BG_WALL, .35)) + P(wrect(724, 176, 62, 30, 4, .6, 96), JAR) + C(755, 191, 10, mix(RED, BG_WALL, .3)), p + "sh")


def basil():
    b = "".join(P(wob(836 + math.cos(a) * 24, 146 + math.sin(a) * 16, 17, 10, .1, 110 + i, 12, math.degrees(a)), BG_SAGE_D if i % 2 else mix(BG_SAGE_D, "#6D8F52", .4)) for i, a in enumerate([k * .9 for k in range(7)]))
    return G(b + P("M810,176 L862,176 L853,226 L819,226Z", mix("#C8704F", BG_WALL, .3)) + P(wrect(806, 170, 60, 13, 5, .5, 111), mix("#B35F42", BG_WALL, .3)), p + "sh")


def rail():
    rx0, rx1 = 1440, 1700
    return P(wrect(rx0, ry, rx1 - rx0, 11, 5.5, .6, 120), "#A08670") + C(rx0 + 2, ry + 5, 9, mix(MUSTARD, BG_WALL, .25)) + C(rx1 - 2, ry + 5, 9, mix(MUSTARD, BG_WALL, .25))


def ladle():
    return rect(1486, ry + 8, 6, 118, MT) + P(wob(1489, ry + 146, 25, 21, .04, 121), MT) + P(wob(1489, ry + 142, 17, 12, .06, 122), MT_D)


def whisk():
    return rect(1546, ry + 8, 10, 66, BG_WOOD) + "".join(P(wob(1551 + dx, ry + 114, 12 - abs(dx) * .6, 44, .03, 123 + i), "none", f' stroke="{MT}" stroke-width="3.5"') for i, dx in enumerate((-8, 0, 8)))


def spatula():
    return rect(1606, ry + 8, 8, 100, BG_WOOD_D) + P(wrect(1586, ry + 102, 48, 58, 12, .8, 124), BG_WOOD_L)


def pan():
    return rect(1656, ry + 8, 8, 70, "#6E5C55") + P(wob(1660, ry + 120, 40, 40, .02, 125), "#6E5C55") + P(wob(1660, ry + 120, 30, 30, .03, 126), "#857069")


def pot(i):
    x = (2090, 2210, 2320)[i]
    rr = 40 - i * 4
    return stroke(f"M{x},232 L{x},{290 - rr}", "#A08670", 3) + P(wob(x, 290, rr, rr, .02, 50 + i), mix("#C98552", BG_WALL, .3)) + P(wob(x - 7, 283, rr * .55, rr * .5, .05, 55 + i), mix("#E0A874", BG_WALL, .3), ' opacity="0.9"')


def sun():
    wx, wy = 960, 40
    return G(C(wx + 310, wy + 58, 30, "#F5D27C") + C(wx + 310, wy + 58, 21, "#F9E1A0"), p + "sh")


# key: (drawing as it appears in the background, drawing for the piece's own file, box x0 y0 x1 y1, pivot)
# The pivot (in the background's frame) is what it turns or squashes around: a jar's foot, a utensil's or pot's hook.
PIECES = {
    "kitchen-jar-flour": (jar_flour(), jar_flour(), (500, 106, 624, 240), (562, 226)),
    "kitchen-jar-pasta": (jar_pasta(), jar_pasta(), (606, 122, 718, 240), (663, 226)),
    "kitchen-jar-jam": (jar_jam(), jar_jam(), (712, 148, 798, 240), (755, 226)),
    "kitchen-basil": (basil(), basil(), (786, 112, 888, 240), (836, 226)),
    "kitchen-ladle": (ladle(), G(ladle(), p + "sh"), (1454, 72, 1526, 250), (1489, 76)),
    "kitchen-whisk": (whisk(), G(whisk(), p + "sh"), (1528, 72, 1576, 238), (1551, 76)),
    "kitchen-spatula": (spatula(), G(spatula(), p + "sh"), (1576, 72, 1646, 242), (1610, 76)),
    "kitchen-pan": (pan(), G(pan(), p + "sh"), (1610, 72, 1712, 242), (1660, 76)),
    "kitchen-pot-1": (pot(0), G(pot(0), p + "sh"), (2040, 226, 2144, 342), (2090, 232)),
    "kitchen-pot-2": (pot(1), G(pot(1), p + "sh"), (2164, 226, 2260, 338), (2210, 232)),
    "kitchen-pot-3": (pot(2), G(pot(2), p + "sh"), (2278, 226, 2366, 334), (2320, 232)),
    "kitchen-sun": (sun(), sun(), (1228, 56, 1316, 144), (1270, 98)),
}


def defs():
    return std_defs(p, "bg", seed=61, sh=(3, 2.5, .22), sh2=(6, 5, .24), blur=6)


def piece_svg(body, box):
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {y0} {w} {h}" width="{w}" height="{h}">'
            f'<defs>{defs()}</defs>{G(body, p + "gr")}</svg>')


def main():
    bg = gen_kitchen.bg_kitchen()
    # The utensils share one group with their rail: the rail stays in the background.
    full_ut = rail() + ladle() + whisk() + spatula() + pan()
    assert full_ut in bg, "utensils not found"
    bg = bg.replace(full_ut, rail(), 1)
    for key, (in_bg, _, _, _) in PIECES.items():
        if key in ("kitchen-ladle", "kitchen-whisk", "kitchen-spatula", "kitchen-pan"):
            continue
        assert bg.count(in_bg) == 1, key
        bg = bg.replace(in_bg, "", 1)
    out = os.path.join(OUT, "live")
    path, size = write("bg-kitchen-landscape", bg, "live")
    print(f"bg-kitchen-landscape (without the pieces) {size / 1024:6.1f} KB")
    for key, (_, own, box, pivot) in PIECES.items():
        path, size = write(key, piece_svg(own, box), "live")
        x0, y0, x1, y1 = box
        print(f"{key:22s} {size / 1024:5.1f} KB  box {box}  size {x1 - x0}x{y1 - y0}  pivot in piece ({pivot[0] - x0}, {pivot[1] - y0})")


if __name__ == "__main__":
    main()
