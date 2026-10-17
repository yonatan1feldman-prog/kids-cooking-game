# images-b-clinic, round 6 (research/clinic-spec-6.md). Shares gen_clinic.py's kit and palette; writes into images-b-clinic/.
# Run: python tools/gen_clinic6.py [names...]   then copy the SVGs into public/assets/images and bake the WebPs.
# Part A (PR 1): clinic-bowl, the kidney bowl beside the close-up: whatever the tweezers or the magnet take out of her
# goes in it (Jonathan's rule). The things lie "in" it over its floor (BOWL_FLOOR), drawn on top in the game.
import sys, os, math, random
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



# ================================================================ part B (PR 2): seven new problems (research/clinic-spec-6.md §3)
# Five on the teeth (all in lens-mouth: TEETH are the eight teeth's centres), burrs in the fur (lens-fur), the hiccups and
# a bump on the head. Nothing is scary: the plaque and the burrs have sleepy smiling faces, the wobbly tooth is a happy
# milestone (no pliers: it wiggles out into a soft gauze pad and goes in a tooth fairy box), no drill, no blood.
# The things in a close-up are drawn in its 520 frame's units; tinted ones (the candy, the wire, the band, the braces'
# smile) are light grey so the game colours them.
TEETH = gc.TEETH
# Between two neighbouring teeth (candy sticks there): the upper row's three gaps, the lower row's three.
GAPS = [((TEETH[i][0] + TEETH[i + 1][0]) // 2, (TEETH[i][1] + TEETH[i + 1][1]) // 2 + (10 if i < 3 else -10)) for i in (0, 1, 2, 4, 5, 6)]
# Where burrs sit in the fur close-up.
BURRS = [(150, 180), (300, 150), (390, 250), (190, 320), (320, 330), (250, 230)]
TOOTH_W = "#FFFDF7"; TOOTH_G = "#F1F1EE"


def face(cx, cy, s, sleepy=True):
    """A tiny friendly face (sleepy closed eyes, or open), smiling."""
    if sleepy:
        e = (stroke(f"M{n(cx - 12 * s)},{n(cy)} q5,4 10,0", INK, 3 * s) + stroke(f"M{n(cx + 2 * s)},{n(cy)} q5,4 10,0", INK, 3 * s))
    else:
        e = C(cx - 8 * s, cy, 3.5 * s, INK) + C(cx + 8 * s, cy, 3.5 * s, INK)
    return e + stroke(f"M{n(cx - 6 * s)},{n(cy + 9 * s)} Q{n(cx)},{n(cy + 14 * s)} {n(cx + 6 * s)},{n(cy + 9 * s)}", INK, 2.6 * s)


def plaque():
    """90x80: a blob of sticky yellow plaque, half see-through, with a sleepy smiling face (the flosser squirts it off)."""
    p = "tpq-"
    s = P(wob(45, 42, 38, 31, .08, 1, 18), "#EFD77A", ' opacity="0.88"') + P(wob(40, 36, 22, 15, .1, 2, 14), "#F8EBA8", ' opacity="0.8"')
    s += "".join(C(x, y, r, "#E2C258", ' opacity="0.7"') for x, y, r in ((20, 56, 5), (70, 54, 4), (62, 22, 3)))
    s += face(45, 42, 1.0)
    return doc(p, 90, 80, s, "smooth", seed=621)


def tooth_dull():
    """70x86: a tooth gone dull and creamy (over a tooth in lens-mouth, where the plaque was): brushing makes it shine."""
    p = "ttd-"
    s = P(wr(4, 4, 62, 78, 24, 1, 3), "#F2E6C2", ' opacity="0.92"') + P(wob(26, 30, 8, 14, .1, 4, 10), "#E6D6A8", ' opacity="0.8"')
    return doc(p, 70, 86, s, "smooth", seed=622)


def candy():
    """70x70: a chewy candy bit (light grey: the game tints it pink, green, orange or purple), a shine and a smile."""
    p = "tcd-"
    s = G(P(wob(35, 36, 27, 23, .08, 1, 16, 20), "#E4E4E0") + P(wob(30, 30, 13, 8, .12, 2, 12, 20), WHITE, ' opacity="0.9"'), p + "sh")
    s += C(28, 40, 2.6, INK) + C(42, 40, 2.6, INK) + stroke("M30,48 Q35,52 40,48", INK, 2.2)
    return doc(p, 70, 70, s, "smooth", seed=623)


def smear():
    """70x60: a little sticky sugar smear left between two teeth (the floss cleans it)."""
    p = "tsm-"
    s = P(wob(35, 30, 24, 18, .1, 1, 14), "#F6C7D0", ' opacity="0.75"') + "".join(C(x, y, 2.5, WHITE, ' opacity="0.9"') for x, y in ((26, 24), (42, 28), (34, 38)))
    return doc(p, 70, 60, s, "smooth", seed=624)


def tooth_shape(x, y, w, h, extra=""):
    return P(wr(x, y, w, h, min(w, h) * .36, 1, int(x + y + w)), TOOTH_W, extra)


def crooked():
    """120x140: a big tooth leaning 18 degrees (it hides the straight one under it; tapped with the pusher it stands up)."""
    p = "tcr-"
    t = ' transform="rotate(18 60 70)"'
    s = G(tooth_shape(16, 20, 88, 100, t), p + "sh") + P(wob(44, 52, 10, 20, .1, 3, 10), TOOTH_G, t + ' opacity="0.9"')
    s += stroke("M14,26 q-8,10 -2,20 M106,110 q8,-10 2,-20", "#C9B9A8", 4, ' opacity="0.8"')
    return doc(p, 120, 140, s, "smooth", seed=625)


def bracket():
    """60x60: a tiny shiny bracket (a little square button) that sticks on a tooth."""
    p = "tbr-"
    s = G(P(wr(12, 14, 36, 32, 8, 1, 1), METAL_D) + P(wr(16, 18, 28, 24, 6, 1, 2), METAL_L), p + "sh")
    s += rect(14, 27, 32, 6, METAL) + C(22, 22, 3, WHITE, ' opacity="0.9"')
    return doc(p, 60, 60, s, "smooth", seed=626)


def wire():
    """300x70: the braces' wire with its little coloured band loops (light grey: tinted to the colour she picked)."""
    p = "twr-"
    s = stroke("M8,36 Q150,46 292,36", "#C8C8C4", 9) + stroke("M8,33 Q150,43 292,33", WHITE, 3, ' opacity="0.9"')
    s += "".join(P(wob(x, 37 + 4 * math.sin(x / 95 * math.pi), 15, 12, .05, int(x), 14), "#DCDCD8") + C(x - 4, 33, 3, WHITE, ' opacity="0.9"') for x in (40, 110, 190, 260))
    return doc(p, 300, 70, s, "smooth", seed=627)


def band():
    """120x120: one braces band on the tray (light grey: the game tints the three of them pink, blue and green)."""
    p = "tbd-"
    s = G(f'<path d="M60,14 A46,46 0 1 1 59.9,14Z M60,36 A24,24 0 1 0 60.1,36Z" fill="#E0E0DC" fill-rule="evenodd"/>', p + "cut")
    s += P(wob(40, 34, 14, 6, .1, 2, 10, -40), WHITE, ' opacity="0.9"')
    return doc(p, 120, 120, s, "smooth", seed=628, cut={"rim": 2.6, "rough": 3})


def braces_smile():
    """240x120: a little smile with braces (put on the patient's mouth after the braces, it stays; the wire light grey:
    tinted to the colour she picked)."""
    p = "tbs-"
    s = G(P("M20,30 Q120,60 220,30 Q200,104 120,108 Q40,104 20,30Z", "#9C3A3E"), p + "sh")
    s += "".join(tooth_shape(x, 36 + abs(x - 112) // 9, 30, 36) for x in (36, 70, 104, 138, 172))
    s += stroke("M30,56 Q120,80 210,56", "#C8C8C4", 6) + "".join(rect(x + 8, 52 + abs(x - 112) // 7, 14, 12, "#E2E2DE") for x in (36, 70, 104, 138, 172))
    s += stroke("M20,30 Q120,60 220,30", INK, 5)
    return doc(p, 240, 120, s, "smooth", seed=629)


def wobbly():
    """100x120: a little baby tooth, a touch creamier and rounder than the others (it wiggles out with the soft gauze)."""
    p = "two-"
    s = G(tooth_shape(20, 18, 60, 74) + P(wob(38, 42, 8, 16, .1, 3, 10), TOOTH_G, ' opacity="0.9"'), p + "sh")
    s += P(wob(50, 96, 22, 7, .1, 4, 12), "#F2C7C4", ' opacity="0.8"')
    return doc(p, 100, 120, s, "smooth", seed=630)


def gum():
    """90x100: the soft gum where a lower tooth stands (over that tooth in lens-mouth): where the baby tooth was, the new
    one peeks out."""
    p = "tgm-"
    s = P(wr(8, 6, 74, 90, 28, 1, 1), "#E86D70") + P(wob(45, 82, 34, 14, .06, 2, 16), "#F08A8C", ' opacity="0.9"')
    s += P(wob(45, 74, 12, 5, .1, 3, 10), "#C9505E", ' opacity="0.7"')
    return doc(p, 90, 100, s, "smooth", seed=631)


def new_tooth():
    """70x80: a brand new tooth peeking up out of the gum, with a tiny sparkle."""
    p = "tnt-"
    s = G(P("M12,74 L12,34 Q12,8 35,8 Q58,8 58,34 L58,74Z", TOOTH_W), p + "sh") + P(wob(26, 30, 6, 12, .1, 2, 10), TOOTH_G, ' opacity="0.9"')
    s += star(56, 14, 9, "#FFE08A")
    return doc(p, 70, 80, s, "smooth", seed=632)


def lens_fur():
    """520: a patch of soft fur (light grey: tinted to the patient), tufts and gentle strands (the burrs sit in it: BURRS)."""
    p = "lfu-"
    s = rect(0, 0, 520, 520, GREY)
    rr = random.Random(7)
    for i in range(70):
        x, y = rr.uniform(-10, 530), rr.uniform(-10, 530)
        a = rr.uniform(-.5, .5)
        s += stroke(f"M{n(x)},{n(y)} q{n(10 + 30 * a)},{n(26)} {n(6 + 50 * a)},{n(54)}", GREY_D if i % 3 else WHITE, rr.uniform(4, 7), f' opacity="{0.35 if i % 3 else 0.5}"')
    s += P(wob(200, 160, 120, 70, .05, 3, 22), GREY_L, ' opacity="0.45"')
    return lens_doc(p, s, 633)


def burr():
    """100x100: a round brown burr, prickly all round, with a sleepy smile (it sticks in the fur; the tweezers take it out)."""
    p = "cbu-"
    s = G(P(spiky(50, 50, 30, 44, 0, 360, 16, 21), "#8E6A3E") + P(wob(50, 50, 31, 30, .06, 22, 18), "#A98250"), p + "sh")
    s += P(wob(42, 40, 12, 7, .12, 23, 10, -30), "#C9A270", ' opacity="0.8"') + face(50, 52, 1.1)
    return doc(p, 100, 100, s, "smooth", seed=634)


def tangle():
    """110x90: a little knot in the fur where a burr was (light-grey-brown curls; the comb smooths it)."""
    p = "ctn-"
    s = "".join(stroke(f"M{x},{y} c14,-18 30,-6 18,8 c-12,14 -28,0 -10,-14", c, 5, ' opacity="0.85"')
                for x, y, c in ((30, 50, "#A88A68"), (54, 40, "#8E7254"), (66, 58, "#A88A68"), (44, 62, "#BFA483")))
    return doc(p, 110, 90, s, "smooth", seed=635)


# ---- the new tools (240 frame; tips printed at the end = ART.clinic.tip)
def flosser():
    """A water flosser: a white and blue handle with a water tank, a thin nozzle to the upper left (its end is the tip)."""
    p = "tfl-"
    t = ' transform="rotate(-40 120 120)"'
    s = P(wr(96, 90, 48, 136, 20, 1, 1), WHITE, t) + P(wr(102, 150, 36, 66, 14, 1, 2), SKY, t + ' opacity="0.9"')
    s += P(wr(106, 104, 28, 26, 8, 1, 3), AQUA_D, t) + rect(114, 26, 12, 70, AQUA, t) + C(120, 24, 7, AQUA_D, t)
    s += P(wob(120, 186, 10, 16, .1, 4, 10), WHITE, t + ' opacity="0.7"')
    return tool_doc(p, s, 641)


def floss():
    """A floss box with the floss pulled out and held taut between two fingers' little pegs (the middle of the string is
    the tip)."""
    p = "tfs-"
    s = P(wr(70, 136, 100, 80, 16, 1.2, 1), SKY_D) + P(wr(80, 146, 80, 60, 12, 1, 2), SKY_L, ' opacity="0.8"') + heart(120, 178, .4, HEART_L)
    s += C(50, 70, 16, PEACH_D) + C(190, 70, 16, PEACH_D) + C(50, 70, 10, PEACH) + C(190, 70, 10, PEACH)
    s += stroke("M50,70 L190,70", WHITE, 4) + stroke("M120,140 Q100,110 120,72", WHITE, 3, ' opacity="0.8"')
    return tool_doc(p, s, 642)


def pusher():
    """The dentist's little mirror-pusher: a slim handle and a small round mirror at the upper left (the mirror is the tip)."""
    p = "tpu-"
    s = stroke("M200,200 L86,86", METAL_D, 14) + stroke("M200,200 L86,86", METAL_L, 7)
    s += P(wr(170, 168, 44, 44, 14, 1, 1), AQUA, ' transform="rotate(45 192 190)"')
    s += C(70, 70, 30, METAL_D) + C(70, 70, 22, SKY_L) + P(wob(62, 62, 9, 5, .1, 2, 10, -40), WHITE, ' opacity="0.9"')
    return tool_doc(p, s, 643)


def brackets_box():
    """A little open box of brackets, one held up on a stick at the upper left (it is the tip)."""
    p = "tbb-"
    s = P(wr(80, 120, 120, 90, 16, 1.2, 1), HEART_L) + P(wr(90, 112, 100, 30, 10, 1, 2), WHITE)
    s += "".join(P(wr(x, 118, 18, 16, 4, 1, x), METAL_L) for x in (100, 126, 152))
    s += stroke("M150,130 L66,64", WOOD, 9) + P(wr(48, 46, 32, 30, 7, 1, 3), METAL_D) + P(wr(52, 50, 24, 22, 5, 1, 4), METAL_L)
    return tool_doc(p, s, 644)


def gauze():
    """A soft folded gauze pad, white with a faint weave (its middle is the tip: it wiggles the wobbly tooth)."""
    p = "tga-"
    s = P(wr(52, 70, 136, 110, 20, 2.2, 1), WHITE) + P(wr(62, 60, 116, 100, 18, 2, 2), "#FAFAF6")
    s += "".join(stroke(f"M70,{y} L170,{y}", GREY_L, 3, ' opacity="0.8"') for y in range(78, 152, 14))
    s += "".join(stroke(f"M{x},68 L{x},152", GREY_L, 3, ' opacity="0.6"') for x in range(80, 172, 16))
    return tool_doc(p, s, 645)


def toothbox():
    """A tiny pink tooth fairy box with a star on its lid (given to the bowl: the tooth hops in, it goes home with her)."""
    p = "ttx-"
    s = P(wr(62, 104, 116, 96, 20, 1.2, 1), HEART_L) + P(wr(54, 80, 132, 40, 14, 1, 2), HEART)
    s += star(120, 150, 26, "#FFE08A") + star(120, 150, 14, WHITE, extra=' opacity="0.7"')
    s += C(120, 76, 9, MUSTARD)
    return tool_doc(p, s, 646)


def comb():
    """A wide-toothed comb, its teeth to the lower left (the middle of the teeth is the tip)."""
    p = "tcb-"
    t = ' transform="rotate(-35 120 120)"'
    s = P(wr(40, 70, 160, 40, 14, 1, 1), CORAL, t) + "".join(rect(48 + i * 15, 104, 9, 62, CORAL_L, t) for i in range(10))
    s += P(wob(80, 84, 22, 6, .1, 2, 10), WHITE, t + ' opacity="0.6"')
    return tool_doc(p, s, 647)


def bow():
    """A big pink hair bow with dots (given to her head; it stays on, like the sun hat)."""
    p = "tbw-"
    s = P("M120,120 Q70,60 40,80 Q24,120 40,160 Q70,180 120,120Z", HEART) + P("M120,120 Q170,60 200,80 Q216,120 200,160 Q170,180 120,120Z", HEART)
    s += "".join(C(x, y, 6, HEART_L) for x, y in ((62, 100), (60, 140), (178, 100), (180, 140), (84, 122), (156, 122)))
    s += P(wr(104, 104, 32, 34, 10, 1, 3), HEART_D)
    return tool_doc(p, s, 648)


TOOL_TIP6 = {"flosser": (58, 47), "floss": (120, 70), "pusher": (70, 70), "brackets": (64, 61), "gauze": (120, 120),
             "toothbox": (120, 140), "comb": (130, 138), "bow": (120, 120)}


def sick6(kind):
    """200x200 cards like sick-*: the seven new problems."""
    p = f"sk6{kind[:3]}-"
    s = G(P(wob(100, 104, 90, 90, .02, 1, 30), "#FFFCF2"), p + "cut")
    big_tooth = "M60,60 Q100,40 140,60 Q150,110 132,152 Q120,164 112,130 Q100,116 88,130 Q80,164 68,152 Q50,110 60,60Z"
    if kind == "plaque":
        s += P(big_tooth, WHITE, ' stroke="#B4B4B0" stroke-width="4"') + P(wob(100, 84, 30, 22, .1, 3, 14), "#EFD77A", ' opacity="0.9"') + face(100, 84, .9)
    elif kind == "candy":
        s += P(big_tooth, WHITE, ' stroke="#B4B4B0" stroke-width="4"')
        s += P(wob(140, 62, 22, 16, .1, 4, 14, 30), "#F3A6C8") + stroke("M156,52 l16,-10 M156,72 l18,4", "#F3A6C8", 6)
    elif kind == "braces":
        s += "".join(P(wr(x, 70, 30, 50, 10, 1, x), WHITE, f' stroke="#B4B4B0" stroke-width="3" transform="rotate({r} {x + 15} 95)"') for x, r in ((44, 0), (80, 14), (116, -10), (150, 0)))
        s += stroke("M40,96 Q100,104 186,96", METAL_D, 5) + "".join(rect(x + 8, 90, 14, 12, METAL_L) for x in (44, 80, 116, 150))
    elif kind == "wobbly":
        s += P(big_tooth, WHITE, ' stroke="#B4B4B0" stroke-width="4" transform="rotate(-10 100 100)"')
        s += stroke("M38,70 q-10,20 0,40 M162,70 q10,20 0,40", CORAL, 5) + star(150, 40, 14, "#FFE08A")
    elif kind == "burrs":
        s += P(wob(100, 116, 70, 56, .05, 2, 24), "#E8C9A0") + "".join(stroke(f"M{x},{y} q8,16 4,30", "#C9A270", 4) for x, y in ((50, 90), (80, 80), (120, 84), (150, 96)))
        s += "".join(P(spiky(x, y, 14, 21, 0, 360, 12, int(x)), "#8E6A3E") for x, y in ((80, 116), (128, 128)))
    elif kind == "hiccups":
        s += C(92, 112, 52, "#F6C9A8") + C(76, 102, 5, INK) + C(108, 102, 5, INK) + C(92, 128, 8, "#9C3A3E")
        s += "".join(P(wob(x, y, r, r, .05, int(x), 12), SKY_L, f' stroke="{SKY_D}" stroke-width="3"') for x, y, r in ((150, 70, 18), (168, 38, 11)))
        s += stroke("M40,60 l10,10 M30,80 l14,2", CORAL, 4)
    else:  # bump
        s += C(100, 116, 58, "#F6C9A8") + C(84, 124, 5, INK) + C(116, 124, 5, INK) + stroke("M88,144 Q100,152 112,144", INK, 4)
        s += P(wob(108, 70, 24, 18, .05, 3, 14), "#F6B6AE") + P(wob(100, 64, 8, 5, .1, 4, 10, -30), WHITE, ' opacity="0.7"')
        s += star(156, 50, 12, MUSTARD) + star(46, 56, 9, MUSTARD)
    return doc(p, 200, 200, G(s, p + "sh"), "smooth", seed=650 + len(kind), cut={"rim": 3, "rough": 4})


ITEMS6B = {
    "tooth-plaque": plaque, "tooth-dull": tooth_dull, "tooth-candy": candy, "tooth-smear": smear, "tooth-crooked": crooked,
    "tooth-bracket": bracket, "tooth-wire": wire, "clinic-band": band, "clinic-braces-smile": braces_smile,
    "tooth-wobbly": wobbly, "tooth-gum": gum, "tooth-new": new_tooth, "lens-fur": lens_fur, "clinic-burr": burr,
    "clinic-tangle": tangle, "tool-flosser": flosser, "tool-floss": floss, "tool-pusher": pusher,
    "tool-brackets": brackets_box, "tool-gauze": gauze, "tool-toothbox": toothbox, "tool-comb": comb, "tool-bow": bow,
}
for _k in ("plaque", "candy", "braces", "wobbly", "burrs", "hiccups", "bump"):
    ITEMS6B[f"sick-{_k}"] = (lambda k: (lambda: sick6(k)))(_k)


ITEMS6 = {"clinic-bowl": bowl, **ITEMS6B}


if __name__ == "__main__":
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    for k, fn in ITEMS6.items():
        if not only or k in only:
            gc.save(k, fn())
    print("anchors: BOWL_FLOOR", BOWL_FLOOR)
    print("part B: TOOL_TIP6", TOOL_TIP6, "GAPS", GAPS, "BURRS", BURRS)
