# images-b-premium (the premium round, PR 5: research/premium-spec.md 4.5): the home screen's shelf plank and the small
# "secrets" hidden in each world (core/secrets.ts): a mouse, a butterfly, a bird, a pigeon, a rooster, a puppy and a
# fish. Uses the shared style-B kit (images-b/tools/pb.py, READ-ONLY) and writes into images-b-premium/.
# Run: python3 tools/gen_secrets.py   then copy the SVGs into public/assets/images and bake the WebPs (__bakeWebp).
import sys, os, math
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "images-b", "tools")))
import pb
from pb import *  # noqa: F401,F403

pb.OUT = os.path.normpath(os.path.join(HERE, ".."))

GREY = "#A9A3A6"; GREY_D = "#857E83"; GREY_L = "#CBC6C7"
EAR = "#F3B3B0"
FEATH = "#8A97A8"; FEATH_D = "#6B788A"; FEATH_L = "#B4BFCB"
ORANGE = "#F59A3C"; ORANGE_D = "#D8752A"; ORANGE_L = "#FFC07A"
DOG = "#C99A6A"; DOG_D = "#A27448"; DOG_L = "#E2BE92"
CRAB = "#EE6B4D"; CRAB_D = "#C24A33"; CRAB_L = "#FF977A"
SHELLC = "#F2D3A2"; SHELLC_D = "#D6AE73"; SHELLC_L = "#FBE7C6"


def doc(p, w, h, body, material="default", seed=3, sh=(3, 3, .3)):
    return svg(w, h, std_defs(p, material, seed, sh, (6, 5, .25)), G(body, p + "gr"))


def eye(x, y, r):
    return C(x, y, r, EYE) + C(x + r * .35, y - r * .35, r * .32, WHITE)


# ---------------------------------------------------------------- the shelf: a long plank, lit from above
def shelf():
    p = "shf-"
    w, h = 1600, 84
    body = P(wrect(4, 14, w - 8, 44, 6, 1.2, 3, 60), WALNUT_D)
    body += P(wrect(4, 10, w - 8, 36, 6, 1.0, 4, 60), WOOD)
    body += P(wrect(10, 10, w - 20, 10, 4, .6, 5, 80), WOOD_L, ' opacity="0.9"')
    # grain: long soft streaks along the plank
    for i, (y, x0, x1) in enumerate([(27, 40, 520), (33, 610, 1180), (25, 1240, 1560), (38, 160, 760), (30, 880, 1420)]):
        body += stroke(f"M{x0},{y} C{x0 + (x1 - x0) * .3},{y - 3} {x0 + (x1 - x0) * .7},{y + 3} {x1},{y}", WOOD_D, 2.2, ' opacity="0.45"')
    for x in (250, 980, 1390):
        body += E(x, 28, 7, 3.5, WOOD_D, ' opacity="0.5"')
    return doc(p, w, h, G(body, p + "cut"), "rough", 41, sh=(6, 5, .32))


# ---------------------------------------------------------------- the kitchen: a mouse with a bit of cheese
def mouse():
    p = "smo-"
    s = ""
    s += P(wob(50, 34, 22, 21, .05, 2), GREY_D) + P(wob(50, 34, 15, 14, .05, 3), EAR)
    s += P(wob(102, 34, 22, 21, .05, 4), GREY_D) + P(wob(102, 34, 15, 14, .05, 5), EAR)
    s += P(wob(76, 72, 42, 36, .04, 6), GREY)
    s += P(wob(70, 64, 26, 20, .05, 7), GREY_L, ' opacity="0.6"')
    s += eye(62, 66, 6) + eye(90, 66, 6)
    s += C(76, 86, 6.5, PINK_D) + E(60, 84, 7, 4, CHEEK, ' opacity="0.6"') + E(92, 84, 7, 4, CHEEK, ' opacity="0.6"')
    for dy in (-3, 3):
        s += stroke(f"M66,{88 + dy} L38,{84 + dy * 2}", GREY_D, 1.6) + stroke(f"M86,{88 + dy} L114,{84 + dy * 2}", GREY_D, 1.6)
    # paws holding a wedge of cheese
    s += P("M54,96 L120,96 L112,124 L60,124Z", CHEESE_D)
    s += P("M56,95 L118,95 L118,104 L56,104Z", CHEESE_L)
    s += P("M58,104 L116,104 L110,122 L62,122Z", CHEESE)
    s += C(78, 113, 5, CHEESE_D) + C(98, 110, 3.5, CHEESE_D)
    s += P(wob(56, 102, 9, 8, .06, 8), GREY) + P(wob(116, 102, 9, 8, .06, 9), GREY)
    return doc(p, 150, 130, G(s, p + "cut"), "smooth", 11)


# ---------------------------------------------------------------- a butterfly (kitchen cupboard, the garden's tree)
def butterfly():
    p = "sbu-"
    s = ""
    s += P(smooth([(58, 48), (30, 14), (8, 20), (10, 46), (30, 56)]), CORAL) + P(smooth([(62, 48), (90, 14), (112, 20), (110, 46), (90, 56)]), CORAL)
    s += P(smooth([(58, 52), (28, 60), (20, 82), (40, 88), (56, 66)]), MUSTARD) + P(smooth([(62, 52), (92, 60), (100, 82), (80, 88), (64, 66)]), MUSTARD)
    s += C(30, 32, 7, CORAL_L) + C(90, 32, 7, CORAL_L) + C(38, 74, 5, CHEESE_L) + C(82, 74, 5, CHEESE_L)
    s += P(wob(60, 56, 5, 26, .05, 3), EYE)
    s += stroke("M58,32 Q52,16 46,10", EYE, 2) + stroke("M62,32 Q68,16 74,10", EYE, 2)
    return doc(p, 120, 100, G(s, p + "cut"), "smooth", 13)


# ---------------------------------------------------------------- a little bird (the garden's tree)
def bird():
    p = "sbi-"
    s = ""
    s += P("M22,64 L4,52 L8,76Z", TEAL_D)
    s += P(wob(56, 66, 38, 30, .04, 2), TEAL)
    s += P(wob(62, 76, 24, 18, .05, 3), CORAL_L)
    s += P(wob(90, 44, 24, 23, .04, 4), TEAL)
    s += P("M110,42 L128,48 L110,54Z", MUSTARD)
    s += eye(96, 40, 5.5) + E(88, 52, 6, 4, CHEEK, ' opacity="0.55"')
    s += P(smooth([(40, 58), (62, 50), (74, 66), (52, 80), (34, 72)]), TEAL_D)
    s += stroke("M48,94 L46,104", MUSTARD, 3) + stroke("M64,94 L66,104", MUSTARD, 3)
    return doc(p, 130, 110, G(s, p + "cut"), "smooth", 15)


# ---------------------------------------------------------------- a pigeon (the market's rooftop)
def pigeon():
    p = "spi-"
    s = ""
    s += P("M24,70 L2,64 L10,88Z", FEATH_D)
    s += P(wob(64, 78, 44, 32, .04, 2), FEATH)
    s += P(smooth([(40, 70), (70, 60), (88, 78), (60, 96), (36, 88)]), FEATH_D)
    s += P(wob(102, 50, 24, 24, .04, 4), FEATH_L)
    s += P(wob(98, 66, 16, 10, .05, 5), "#7FB5A2", ' opacity="0.85"')
    s += P("M122,50 L140,56 L122,60Z", PINK_D)
    s += eye(108, 46, 5.5)
    s += stroke("M56,108 L54,122", PINK_D, 3.5) + stroke("M74,108 L76,122", PINK_D, 3.5)
    return doc(p, 150, 130, G(s, p + "cut"), "smooth", 17)


# ---------------------------------------------------------------- a rooster (the farm's barn roof)
def rooster():
    p = "sro-"
    s = ""
    for i, (c, a) in enumerate([(GREEN_D, -40), (TEAL, -15), (GREEN, 10)]):
        s += P(smooth([(52, 92), (24 + i * 4, 34 + i * 6), (8 + i * 6, 52 + i * 12), (40, 104)]), c)
    s += P(wob(84, 100, 46, 38, .04, 2), RUST)
    s += P(smooth([(60, 96), (92, 86), (110, 104), (84, 124), (58, 114)]), mix(RUST, EYE, .2))
    s += P(wob(116, 58, 24, 26, .04, 4), CREAM)
    s += P(smooth([(104, 34), (110, 18), (118, 30), (126, 16), (132, 32), (138, 24), (136, 42), (112, 42)]), RED)
    s += P("M138,56 L156,62 L138,68Z", MUSTARD)
    s += P(wob(134, 78, 7, 10, .06, 5), RED)
    s += eye(124, 54, 5.5)
    s += stroke("M74,134 L72,152", MUSTARD, 4) + stroke("M94,134 L96,152", MUSTARD, 4)
    return doc(p, 160, 160, G(s, p + "cut"), "smooth", 19)


# ---------------------------------------------------------------- a puppy (peeking from the doghouse)
def puppy():
    p = "spu-"
    s = ""
    s += P(smooth([(30, 40), (14, 54), (16, 96), (34, 90), (44, 52)]), DOG_D)
    s += P(smooth([(120, 40), (136, 54), (134, 96), (116, 90), (106, 52)]), DOG_D)
    s += P(wob(75, 66, 44, 40, .04, 2), DOG)
    s += P(wob(92, 50, 16, 14, .06, 3), DOG_L, ' opacity="0.9"')
    s += P(wob(75, 88, 24, 18, .04, 4), DOG_L)
    s += eye(58, 62, 6.5) + eye(92, 62, 6.5)
    s += P(wob(75, 80, 9, 7, .05, 5), EYE)
    s += P("M70,94 Q75,99 80,94 L80,104 Q75,110 70,104Z", PINK_D)
    s += E(52, 82, 7, 4, CHEEK, ' opacity="0.55"') + E(98, 82, 7, 4, CHEEK, ' opacity="0.55"')
    return doc(p, 150, 120, G(s, p + "cut"), "smooth", 21)


# ---------------------------------------------------------------- a little fish (the clinic's picture, the wreck)
def fish():
    p = "sfi-"
    s = ""
    s += P("M30,40 L4,18 L10,40 L4,62Z", ORANGE_D)
    s += P(wob(66, 40, 40, 26, .04, 2), ORANGE)
    s += P(smooth([(60, 16), (76, 4), (88, 18)]), ORANGE_D)
    s += P(wob(72, 46, 26, 12, .05, 3), ORANGE_L, ' opacity="0.8"')
    s += stroke("M50,22 Q56,40 50,58", ORANGE_D, 2.4, ' opacity="0.7"')
    s += eye(90, 34, 6)
    s += stroke("M98,48 Q102,50 104,46", EYE, 2)
    return doc(p, 120, 80, G(s, p + "cut"), "smooth", 23)


PIECES = {
    "card-shelf": shelf,
    "secret-mouse": mouse,
    "secret-butterfly": butterfly,
    "secret-bird": bird,
    "secret-pigeon": pigeon,
    "secret-rooster": rooster,
    "secret-puppy": puppy,
    "secret-fish": fish,
}


def main(names):
    for key, fn in PIECES.items():
        if names and key not in names:
            continue
        path, size = write(key, fn())
        print(f"{key:18s} {size / 1024:5.1f} KB")


if __name__ == "__main__":
    main(sys.argv[1:])
