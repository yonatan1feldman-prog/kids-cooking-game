# images-b-clinic, round 5 (research/clinic-spec-5.md), part A: the two new problems, a scratchy throat and a sunburn, and
# their tools. Shares gen_clinic.py's kit and palette; writes into images-b-clinic/.
# Run: python tools/gen_clinic5.py [names...]   then copy the SVGs into public/assets/images and bake the WebPs.
# The anchors the game relies on are printed at the end (ART.clinic in src/core/assets.ts).
# Nothing here is scary: the throat's "tickles" are fluffy smiling puffs, the sunburn is a soft pink glow.
import sys, os, math, random
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from gen_clinic import *  # noqa: F401,F403
import gen_clinic as gc

# ================================================================ the throat close-up (520 frame, not tinted, like the mouth)
TICKLES = [(196, 268), (324, 268), (260, 318), (214, 352), (306, 352), (260, 376)]


def lens_throat():
    """A mouth open wide (not tinted): the lips, the teeth's edges, the deep pink throat, the uvula hanging in the middle,
    the tonsils' soft cushions at the sides, the tongue low down. The tickles sit in the throat (TICKLES)."""
    p = "lth-"
    s = rect(0, 0, 520, 520, "#F3D9C6")
    s += G(P(wob(260, 270, 236, 196, .02, 1, 36), "#E5867E"), p + "sh")
    s += P(wob(260, 276, 210, 170, .02, 2, 36), "#B4474C")
    # the throat: a deep, soft, rounded opening
    s += P(wob(260, 300, 132, 120, .03, 3, 30), "#8E2E38")
    s += P(wob(260, 316, 92, 86, .04, 4, 26), "#6E2230", ' opacity="0.8"')
    # the tonsils' cushions, the arches
    for sgn in (-1, 1):
        s += P(wob(260 + sgn * 128, 300, 40, 74, .05, 5 + sgn, 18), "#D86A72") + P(wob(260 + sgn * 132, 290, 16, 30, .1, 7 + sgn, 12), "#EE9AA0", ' opacity="0.7"')
    s += stroke("M140,170 Q260,130 380,170", "#D86A72", 18, ' opacity="0.9"')
    # the uvula
    s += G(P("M244,150 Q260,140 276,150 Q280,206 268,224 Q260,232 252,224 Q240,206 244,150Z", "#E07880"), p + "sh")
    s += P(wob(256, 210, 6, 9, .1, 9, 10), "#F2A6AC", ' opacity="0.8"')
    # teeth's edges at the top and bottom, the tongue low down
    s += "".join(G(P(wr(x - 28, 70, 56, 44, 16, 1, int(x)), WHITE), p + "sh") for x in (170, 230, 290, 350))
    s += G(P(wob(260, 452, 170, 74, .03, 10, 30), "#E86D70"), p + "sh") + stroke("M260,400 L260,470", "#C9505E", 5)
    s += "".join(G(P(wr(x - 28, 466, 56, 40, 14, 1, int(x) + 3), WHITE), p + "sh") for x in (200, 260, 320))
    return lens_doc(p, s, 501)


def tickle():
    """100x100: a little fluffy throat tickle, pale yellow, smiling (the spray sends it off as a bubble)."""
    p = "otk-"
    s = P(spiky(50, 52, 30, 40, 0, 360, 14, 11), "#FFE9A6") + P(wob(50, 52, 30, 28, .06, 12, 18), "#FFF3C8")
    s += C(40, 48, 5.5, INK) + C(60, 48, 5.5, INK) + C(42, 46, 2, WHITE) + C(62, 46, 2, WHITE)
    s += stroke("M41,62 Q50,70 59,62", INK, 3.5) + C(32, 60, 5, CHEEK, ' opacity="0.7"') + C(68, 60, 5, CHEEK, ' opacity="0.7"')
    return doc(p, 100, 100, G(s, p + "sh"), "smooth", seed=511)


def burn():
    """120x80: a soft pink-red sunburn glow on the skin (cool aloe makes it fade)."""
    p = "obu-"
    s = P(wob(60, 40, 52, 30, .05, 1, 18), "#F2606C", ' opacity="0.6"') + P(wob(56, 38, 34, 18, .08, 2, 14), "#F58A90", ' opacity="0.7"')
    s += "".join(C(x, y, 2.5, "#FFE6E0", ' opacity="0.8"') for x, y in ((42, 32), (66, 30), (78, 44), (52, 48)))
    return doc(p, 120, 80, s, "smooth", seed=512)


# ================================================================ the tools (240 frame)
def honey():
    """A spoon of golden honey (its bowl is the tip: it goes to the mouth)."""
    p = "tho-"
    t = ' transform="rotate(-40 120 120)"'
    s = P(wr(110, 96, 20, 136, 10, 1, 1), WOOD, t) + P(wr(114, 104, 8, 118, 4, 1, 2), WOOD_L, t)
    s += P(wob(120, 64, 40, 50, .03, 3, 22), WOOD_D, t) + P(wob(120, 62, 32, 40, .04, 4, 20), "#F2B53A", t)
    s += P(wob(112, 52, 12, 14, .1, 5, 12), "#FFE08A", t + ' opacity="0.9"')
    s += P("M88,108 Q96,128 90,140 Q82,128 88,108Z", "#F2B53A")
    return tool_doc(p, s, 521)


def aloe():
    """A green tube of cool aloe gel with a leaf on it, its nozzle at the upper left (the tip)."""
    p = "tal-"
    t = ' transform="rotate(-35 120 120)"'
    s = P("M70,70 L170,70 L160,190 Q120,200 80,190Z", "#9FD88A", t) + rect(70, 186, 100, 18, "#4E9A44", t)
    s += P(wr(98, 30, 44, 44, 8, 1, 1), WHITE, t) + rect(108, 18, 24, 18, "#4E9A44", t)
    s += P("M120,104 Q150,130 120,170 Q90,130 120,104Z", "#4E9A44", t) + stroke("M120,112 L120,164", "#C8EBB8", 3, t)
    return tool_doc(p, s, 522)


def sunhat():
    """A straw sun hat with a coral ribbon and a daisy (given to her head; it stays on)."""
    p = "tha-"
    s = P(wob(120, 150, 112, 42, .03, 1, 30), "#F6D27A") + P(wob(120, 146, 96, 32, .04, 2, 26), "#FBE3A0", ' opacity="0.7"')
    s += P("M64,150 Q62,70 120,64 Q178,70 176,150 Q120,166 64,150Z", "#F6D27A")
    s += "".join(stroke(f"M{x},{150 - abs(x - 120) // 6} Q{x + 4},100 {120 + (x - 120) * .4},70", "#E2B456", 3, ' opacity="0.6"') for x in (80, 100, 140, 160))
    s += P("M66,128 Q120,146 174,128 L176,148 Q120,166 64,148Z", CORAL)
    s += "".join(P(wob(160 + math.cos(a) * 12, 130 + math.sin(a) * 12, 9, 6, .1, 3 + i, 10, math.degrees(a)), WHITE) for i, a in enumerate([k * math.pi / 3 for k in range(6)]))
    s += C(160, 130, 7, MUSTARD)
    return tool_doc(p, s, 523)


TOOL_TIP5 = {"honey": (84, 77), "aloe": (68, 46), "hat": (120, 120)}


def sick5(kind):
    """200x200 cards like sick-*: a scratchy throat, a sunburn."""
    p = f"sk5{kind[:2]}-"
    s = G(P(wob(100, 104, 90, 90, .02, 1, 30), "#FFFCF2"), p + "cut")
    if kind == "throat":
        s += C(100, 92, 52, "#F6C9A8") + C(82, 82, 5, INK) + C(118, 82, 5, INK) + P(wob(100, 112, 16, 12, .05, 2, 12), "#9C3A3E")
        s += P("M70,140 L130,140 L134,184 L66,184Z", "#F6C9A8") + P("M60,146 Q100,162 140,146 L142,166 Q100,182 58,166Z", CORAL)
        s += "".join(stroke(f"M{x},{y} l8,-6 l8,6 l8,-6", "#E2616E", 4) for x, y in ((140, 104), (36, 104)))
    else:  # sunburn
        s += star(46, 46, 26, MUSTARD, inner=.6) + C(46, 46, 16, "#FFE08A")
        s += C(110, 112, 56, "#F6C9A8") + C(92, 104, 5, INK) + C(128, 104, 5, INK) + stroke("M96,130 Q110,140 124,130", INK, 4)
        s += P(wob(110, 116, 14, 10, .1, 3, 12), "#F2606C", ' opacity="0.8"') + P(wob(78, 122, 16, 10, .1, 4, 12), "#F2606C", ' opacity="0.6"') + P(wob(142, 122, 16, 10, .1, 5, 12), "#F2606C", ' opacity="0.6"')
    return doc(p, 200, 200, G(s, p + "sh"), "smooth", seed=590 + len(kind), cut={"rim": 3, "rough": 4})


ITEMS5 = {
    "lens-throat": lens_throat, "clinic-tickle": tickle, "clinic-burn": burn, "tool-honey": honey, "tool-aloe": aloe,
    "tool-hat": sunhat, "sick-throat": lambda: sick5("throat"), "sick-sunburn": lambda: sick5("sunburn"),
}



# ================================================================ part B (PR 2): the care rooms, next door (research/clinic-spec-5.md §4)
# The care room's wall and floor, and each room's props. Anchors printed at the end (ART.clinic.care in src/core/assets.ts).
def bg_clinic_care():
    """2400x1080: the room next door, mint and peach, a wooden floor from y 640 (the tub, the bed stand on it), a window
    with a curtain, a shelf of folded towels and little jars, a garland of paper stars, a soft rug. Mom's face covers about
    x 1800-2300, y 40-420 at 20:9: a plain cupboard there. No writing anywhere."""
    p = "bgk-"
    L = [rect(0, 0, 2400, 640, MINT_L)]
    L.append("".join(rect(x, 0, 60, 640, PEACH, ' opacity="0.45"') for x in range(0, 2400, 160)))
    L.append(rect(0, 520, 2400, 120, AQUA_L) + rect(0, 514, 2400, 12, WHITE))
    L.append("".join(heart(x, 580, .2, AQUA, ' opacity="0.5"') for x in range(80, 2400, 160)))
    # the floor
    L.append(rect(0, 640, 2400, 440, BG_WOOD_L))
    L.append("".join(rect(0, y, 2400, 3, BG_WOOD_D, ' opacity="0.45"') for y in range(690, 1080, 64)))
    rr = random.Random(17)
    L.append("".join(rect(rr.uniform(0, 2400), y, 3, 64, BG_WOOD_D, ' opacity="0.35"') for y in range(640, 1080, 64) for _ in range(5)))
    L.append(rect(0, 636, 2400, 14, WALNUT))
    # a round rug in the middle
    L.append(G(P(wob(1150, 900, 700, 120, .02, 3, 40), SKY_L) + P(wob(1150, 900, 620, 92, .02, 4, 40), WHITE, ' opacity="0.6"')
               + "".join(C(1150 + math.cos(a) * 520, 900 + math.sin(a) * 78, 12, AQUA) for a in [i * math.pi / 8 for i in range(16)]), p + "sh"))
    # the window with its curtains (left), a garland of stars over the room
    L.append(G(window(p, 420, 110, 360, 250, 27), p + "sh"))
    gar = stroke("M900,70 Q1250,170 1620,70", WALNUT_D, 4)
    for i in range(9):
        t = (i + .5) / 9
        x = 900 + 720 * t
        y = 70 + 4 * 100 * t * (1 - t) + 26
        gar += star(x, y, 26, (MUSTARD, HEART_L, AQUA, CORAL_L)[i % 4], rot=-90 + (i % 2) * 12)
    L.append(G(gar, p + "sh"))
    # a shelf of folded towels and small jars
    shelf = P(wr(1000, 330, 520, 22, 6, 1, 81), WOOD) + P("M1040,352 L1052,384 L1064,352Z", WOOD_D) + P("M1456,352 L1468,384 L1480,352Z", WOOD_D)
    for i, (x, c) in enumerate(((1020, HEART_L), (1020, AQUA_L), (1120, "#FFE6A8"), (1120, WHITE))):
        y = 330 - 34 - (i % 2) * 34
        shelf += P(wr(x, y, 90, 32, 10, 1, 82 + i), c) + rect(x + 6, y + 14, 78, 4, WHITE, ' opacity="0.7"')
    shelf += "".join(P(wr(x, 330 - h, 46, h, 12, 1, x), col, ' opacity="0.92"') + P(wr(x - 3, 330 - h - 14, 52, 16, 6, 1, x + 1), AQUA_D)
                     for x, h, col in ((1250, 70, "#EAF6F8"), (1316, 54, HEART_L), (1380, 80, "#E6D8F2")))
    shelf += P(wob(1470, 300, 30, 26, .1, 91, 14), GREEN) + P(wr(1446, 300, 48, 30, 8, 1, 92), CORAL)
    L.append(G(shelf, p + "sh"))
    # a cupboard behind Mom (only its left side shows beside her)
    cab = P(wr(1820, 60, 500, 560, 12, 1.2, 101), WHITE) + P(wr(1840, 80, 220, 520, 8, 1, 102), PEACH) + P(wr(2080, 80, 220, 520, 8, 1, 103), PEACH)
    cab += C(2040, 340, 10, WALNUT) + C(2100, 340, 10, WALNUT) + heart(1950, 180, .6, HEART_L)
    L.append(G(cab, p + "sh"))
    # a teddy and a toy box at the left by the wall
    toy = P(wr(120, 560, 220, 130, 14, 1.2, 111), AQUA) + rect(120, 590, 220, 12, AQUA_D, ' opacity="0.6"')
    toy += C(200, 540, 34, WOOD) + C(200, 504, 28, WOOD) + C(182, 482, 10, WOOD) + C(218, 482, 10, WOOD) + C(193, 500, 3.5, INK) + C(207, 500, 3.5, INK)
    L.append(G(toy, p + "sh"))
    return doc(p, 2400, 1080, "".join(L), "bg", seed=181, sh=(4, 4, .22))


# ---- the medicine room: a big bottle, three fruit syrups, the spoon (tool-syrup)
BOTTLE_LIQ = (52, 150, 208, 352)   # the liquid's box in the 260x380 frame: x0, top (full), x1, bottom


def bottle_body(x0=40, x1=220, top=118, bot=362):
    return (f"M{x0 + 20},{top} Q{x0},{top + 8} {x0},{top + 40} L{x0},{bot - 30} Q{x0},{bot} {x0 + 30},{bot} L{x1 - 30},{bot}"
            f" Q{x1},{bot} {x1},{bot - 30} L{x1},{top + 40} Q{x1},{top + 8} {x1 - 20},{top}Z")


def care_bottle_back():
    """260x380: the empty medicine bottle (the glass behind the liquid, the neck, the cap)."""
    p = "cbb-"
    s = G(P(bottle_body(), "#E6F3F5", ' opacity="0.95"'), p + "sh")
    s += P(wr(98, 60, 64, 66, 10, 1, 2), "#E6F3F5") + P(wr(88, 22, 84, 46, 12, 1, 3), HEART)
    s += "".join(rect(98 + i * 16, 26, 6, 38, HEART_D, ' opacity="0.5"') for i in range(5))
    s += ground_shadow(130, 366, 100, 12, p, .25)
    return doc(p, 260, 380, s, "smooth", seed=611)


def care_bottle_fill():
    """260x380: the medicine inside the bottle, light grey (tinted to the fruit; cropped from the top as it fills)."""
    p = "cbf-"
    x0, top, x1, bot = BOTTLE_LIQ
    s = P(f"M{x0},{top} L{x1},{top} L{x1},{bot - 22} Q{x1},{bot} {x1 - 24},{bot} L{x0 + 24},{bot} Q{x0},{bot} {x0},{bot - 22}Z", "#F2F2F2")
    s += "".join(C(x, y, r, WHITE, ' opacity="0.7"') for x, y, r in ((90, 220, 8), (160, 270, 6), (120, 320, 10), (180, 200, 5)))
    return doc(p, 260, 380, s, "smooth", seed=612)


def care_bottle_front():
    """260x380: the glass's shine and its outline, and a heart label (over the liquid)."""
    p = "cbt-"
    s = stroke(bottle_body(), AQUA_D, 6) + stroke("M98,126 L98,64 L162,64 L162,126", AQUA_D, 5)
    s += P(wr(64, 140, 18, 180, 9, 1, 1), WHITE, ' opacity="0.55"') + P(wr(92, 140, 8, 60, 4, 1, 2), WHITE, ' opacity="0.45"')
    s += P(wr(150, 280, 54, 54, 12, 1, 3), WHITE, ' opacity="0.9"') + heart(177, 304, .45, HEART)
    return doc(p, 260, 380, s, "smooth", seed=613)


JAR_FRUIT = {"strawberry": ("#F05A6A", "#F7909A"), "banana": ("#F7D04A", "#FBE58C"), "blueberry": ("#5E6BD8", "#929BEA")}


def fruit_mark(kind, cx, cy, s):
    if kind == "strawberry":
        o = P(f"M{n(cx)},{n(cy + 34 * s)} Q{n(cx - 34 * s)},{n(cy + 4 * s)} {n(cx - 26 * s)},{n(cy - 16 * s)} Q{n(cx)},{n(cy - 26 * s)} {n(cx + 26 * s)},{n(cy - 16 * s)} Q{n(cx + 34 * s)},{n(cy + 4 * s)} {n(cx)},{n(cy + 34 * s)}Z", "#E8414E")
        o += "".join(C(cx + dx * s, cy + dy * s, 2.6 * s, "#FFE6A8") for dx, dy in ((-12, -4), (0, 6), (12, -4), (-6, 18), (8, 18)))
        return o + P(spiky(cx, cy - 20 * s, 6 * s, 18 * s, 180, 360, 5, 7), GREEN)
    if kind == "banana":
        return (P(f"M{n(cx - 34 * s)},{n(cy - 18 * s)} Q{n(cx - 20 * s)},{n(cy + 30 * s)} {n(cx + 34 * s)},{n(cy + 6 * s)} Q{n(cx - 4 * s)},{n(cy + 12 * s)} {n(cx - 22 * s)},{n(cy - 22 * s)}Z", "#F7D04A")
                + C(cx - 30 * s, cy - 20 * s, 4 * s, WALNUT))
    return "".join(C(cx + dx * s, cy + dy * s, 15 * s, "#4E5CC8") + C(cx + dx * s - 4 * s, cy + dy * s - 4 * s, 4 * s, "#A7AEF0") for dx, dy in ((-14, 8), (14, 8), (0, -14)))


def care_jar(kind):
    """240x240: a jar of fruit syrup, its fruit on the lid's label (a tap picks the medicine's flavour)."""
    p = f"cj{kind[:2]}-"
    col, light = JAR_FRUIT[kind]
    s = P(wr(56, 76, 128, 140, 26, 1.2, 1), "#EAF6F8", ' opacity="0.95"')
    s += P(wr(64, 110, 112, 100, 22, 1, 2), col) + P(wr(72, 116, 30, 70, 12, 1, 3), light, ' opacity="0.8"')
    s += P(wr(48, 46, 144, 40, 12, 1, 4), WHITE) + P(wr(48, 70, 144, 10, 4, 1, 5), GREY_L)
    s += C(120, 156, 40, WHITE, ' opacity="0.95"') + fruit_mark(kind, 120, 156, .9)
    return doc(p, 240, 240, G(s, p + "cut"), "smooth", seed=620 + len(kind), cut={"rim": 2.6, "rough": 3.5})


# ---- the bath: a tub (back and front, she sits between them), the shower, the towel, the rubber duck
TUB_RIM = 236      # the tub's rim in its 1000x520 frame (she sits with her waist at it)


def care_tub_back():
    """1000x520: the inside of the bathtub (its far wall and the water's surface) behind the patient."""
    p = "ctb-"
    s = G(P(wob(500, 250, 440, 92, .02, 1, 40), WHITE), p + "sh")
    s += P(wob(500, 256, 410, 74, .02, 2, 40), SKY_L) + P(wob(500, 262, 380, 58, .03, 3, 36), SKY, ' opacity="0.8"')
    s += "".join(P(wob(300 + i * 140, 258 + (i % 2) * 8, 40, 8, .1, 4 + i, 12), WHITE, ' opacity="0.7"') for i in range(4))
    return doc(p, 1000, 520, s, "smooth", seed=631)


def care_tub_front():
    """1000x520: the tub's front (the near rim and the side, on little feet), in front of her: it cuts her at the waist."""
    p = "ctf-"
    body = f"M60,{TUB_RIM} Q500,{TUB_RIM + 60} 940,{TUB_RIM} Q950,440 820,470 L180,470 Q50,440 60,{TUB_RIM}Z"
    s = G(P(body, WHITE) + P(f"M90,{TUB_RIM + 30} Q500,{TUB_RIM + 86} 910,{TUB_RIM + 30} L900,{TUB_RIM + 54} Q500,{TUB_RIM + 110} 100,{TUB_RIM + 54}Z", SKY_L, ' opacity="0.7"'), p + "cut")
    s += G(stroke(f"M60,{TUB_RIM} Q500,{TUB_RIM + 60} 940,{TUB_RIM}", WHITE, 26) + stroke(f"M70,{TUB_RIM - 6} Q500,{TUB_RIM + 52} 930,{TUB_RIM - 6}", AQUA_L, 8), p + "sh")
    s += "".join(heart(x, 400, .5, HEART_L, ' opacity="0.9"') for x in (330, 500, 670))
    s += "".join(G(P(wob(x, 486, 34, 26, .06, 9 + i, 14), MUSTARD), p + "sh") for i, x in enumerate((210, 790)))
    s += ground_shadow(500, 500, 400, 16, p, .25)
    return doc(p, 1000, 520, s, "smooth", seed=632, cut={"rim": 3, "rough": 4})


def shower():
    """A hand shower: the round head (its holes are the tip, upper left) on a handle and a hose."""
    p = "tsw-"
    s = stroke("M170,200 Q220,230 230,240", METAL_D, 12)
    s += P(wr(120, 110, 30, 110, 14, 1, 1), METAL_L, ' transform="rotate(-40 135 165)"')
    s += C(84, 84, 56, METAL) + C(84, 84, 46, METAL_L) + "".join(C(84 + dx, 84 + dy, 4, METAL_D) for dx in (-24, -8, 8, 24) for dy in (-24, -8, 8, 24) if dx * dx + dy * dy < 900)
    return tool_doc(p, s, 641)


def towel():
    """A soft folded towel (it rubs her dry; afterwards it stays on her head)."""
    p = "ttl-"
    s = P(wr(40, 70, 160, 120, 30, 1.4, 1), HEART_L) + P(wr(40, 120, 160, 22, 8, 1, 2), WHITE, ' opacity="0.7"')
    s += P(wr(40, 160, 160, 12, 6, 1, 3), HEART, ' opacity="0.7"') + "".join(C(70 + i * 25, 100, 5, WHITE, ' opacity="0.6"') for i in range(5))
    return tool_doc(p, s, 642)


def towel_head():
    """320x200: the towel wrapped on her head like a turban (it stays on after the bath)."""
    p = "cth-"
    s = P(wob(160, 120, 150, 70, .03, 1, 30), HEART_L) + P(wob(150, 92, 112, 52, .04, 2, 26), "#F9BDC4")
    s += stroke("M50,130 Q160,70 280,120", HEART, 8, ' opacity="0.6"') + stroke("M80,90 Q170,50 250,90", WHITE, 6, ' opacity="0.6"')
    s += P(wob(240, 60, 36, 30, .06, 3, 16, 20), HEART_L) + "".join(C(90 + i * 36, 150, 5, WHITE, ' opacity="0.6"') for i in range(5))
    return doc(p, 320, 200, G(s, p + "cut"), "smooth", seed=643, cut={"rim": 2.6, "rough": 3.5})


def duck():
    """140x120: a yellow rubber duck (it hides in the bubbles; a tap finds it)."""
    p = "cdk-"
    s = P(wob(72, 82, 56, 30, .03, 1, 24), MUSTARD) + C(96, 46, 26, MUSTARD) + P(wob(60, 74, 26, 14, .06, 2, 14, -20), "#F8D070")
    s += P("M118,46 Q140,48 134,58 Q122,60 114,54Z", CORAL) + C(102, 40, 5, INK) + C(104, 38, 1.8, WHITE)
    return doc(p, 140, 120, G(s, p + "cut"), "smooth", seed=644, cut={"rim": 2.6, "rough": 3.5})


# ---- the bandage: the roll, a strip of it, the heart on top
def roll():
    """A roll of soft bandage, its loose end hanging (the tip: the roll's middle)."""
    p = "trl-"
    s = P("M150,140 Q180,190 150,226 L118,224 Q146,190 120,150Z", WHITE) + stroke("M134,170 L150,208", GREY_L, 4)
    s += C(120, 120, 62, WHITE) + C(120, 120, 46, GREY_L, ' opacity="0.8"') + C(120, 120, 20, "#E8D8C0") + C(120, 120, 9, WHITE)
    s += "".join(stroke(f"M{n(120 + math.cos(a) * 30)},{n(120 + math.sin(a) * 30)} L{n(120 + math.cos(a) * 58)},{n(120 + math.sin(a) * 58)}", GREY_L, 3) for a in [i * math.pi / 4 for i in range(8)])
    return tool_doc(p, s, 651)


def wrap():
    """360x110: one turn of bandage across the limb (laid at an angle, one over another)."""
    p = "cwr-"
    s = P(wr(10, 20, 340, 70, 26, 1.4, 1), WHITE) + "".join(rect(30 + i * 22, 28, 3, 54, GREY_L, ' opacity="0.7"') for i in range(14))
    s += P(wr(10, 74, 340, 14, 6, 1, 2), GREY_L, ' opacity="0.8"')
    return doc(p, 360, 110, G(s, p + "cut"), "smooth", seed=652, cut={"rim": 2.4, "rough": 3})


def heart_sticker():
    """120x120: a heart sticker for the bandage."""
    p = "cht-"
    s = heart(60, 62, 1.45, WHITE) + heart(60, 62, 1.2, HEART) + P(wob(46, 44, 10, 6, .1, 1, 10, -30), WHITE, ' opacity="0.8"')
    return doc(p, 120, 120, G(s, p + "cut"), "smooth", seed=653, cut={"rim": 2.4, "rough": 3})


# ---- the dentist's chair: the polisher, the toothpaste (light grey: tinted pink, blue or green)
def polisher():
    """A tooth polisher: a round soft cup on a white handle (the cup is the tip, upper left)."""
    p = "tpo-"
    t = ' transform="rotate(-45 120 120)"'
    s = P(wr(106, 70, 28, 160, 14, 1, 1), WHITE, t) + P(wr(110, 150, 20, 50, 8, 1, 2), AQUA, t)
    s += C(66, 66, 32, SKY_D) + C(66, 66, 22, SKY_L) + C(66, 66, 10, WHITE)
    return tool_doc(p, s, 661)


def paste():
    """240x240: a toothpaste tube, light grey with a darker cap (tinted pink, blue or green in the game)."""
    p = "cpa-"
    t = ' transform="rotate(-30 120 120)"'
    s = P("M74,40 L166,40 L158,176 Q120,186 82,176Z", "#F4F4F4", t) + rect(74, 34, 92, 16, "#D8D8D8", t)
    s += P(wr(100, 176, 40, 34, 8, 1, 1), "#B0B0B0", t) + star(120, 104, 22, WHITE, extra=t) + star(120, 104, 14, "#DADADA", extra=t)
    return tool_doc(p, s, 662)


# ---- the eye chart: six shapes in three rows (no letters), the shapes to match, the glasses
CHART_SHAPES = [("star", 260, 150, 1.0), ("heart", 170, 330, .7), ("moon", 350, 330, .7), ("circle", 140, 500, .5), ("triangle", 260, 500, .5), ("house", 380, 500, .5)]
SHAPE_COL = {"star": MUSTARD, "heart": HEART, "moon": "#8E8BE0", "circle": AQUA_D, "triangle": GREEN, "house": CORAL}


def shape(kind, cx, cy, s):
    col = SHAPE_COL[kind]
    if kind == "star":
        return star(cx, cy, 80 * s, col)
    if kind == "heart":
        return heart(cx, cy + 4 * s, 2.1 * s, col)
    if kind == "moon":
        return f'<path d="M{n(cx + 30 * s)},{n(cy - 70 * s)} A{n(76 * s)},{n(76 * s)} 0 1 0 {n(cx + 30 * s)},{n(cy + 70 * s)} A{n(58 * s)},{n(58 * s)} 0 1 1 {n(cx + 30 * s)},{n(cy - 70 * s)}Z" fill="{col}"/>'
    if kind == "circle":
        return C(cx, cy, 66 * s, col)
    if kind == "triangle":
        return P(f"M{n(cx)},{n(cy - 70 * s)} L{n(cx + 74 * s)},{n(cy + 58 * s)} L{n(cx - 74 * s)},{n(cy + 58 * s)}Z", col)
    return P(f"M{n(cx)},{n(cy - 72 * s)} L{n(cx + 70 * s)},{n(cy - 6 * s)} L{n(cx + 52 * s)},{n(cy - 6 * s)} L{n(cx + 52 * s)},{n(cy + 62 * s)} L{n(cx - 52 * s)},{n(cy + 62 * s)} L{n(cx - 52 * s)},{n(cy - 6 * s)} L{n(cx - 70 * s)},{n(cy - 6 * s)}Z", col) + rect(cx - 14 * s, cy + 18 * s, 28 * s, 44 * s, WHITE)


def care_chart():
    """520x640: the eye chart on its stand: shapes, big at the top and smaller row by row (CHART_SHAPES)."""
    p = "cec-"
    s = G(P(wr(20, 20, 480, 600, 18, 1.4, 1), WOOD) + P(wr(40, 40, 440, 560, 10, 1, 2), "#FFFCF2"), p + "cut")
    s += "".join(rect(70, y, 380, 3, SKY_D, ' opacity="0.4"') for y in (250, 420))
    s += "".join(shape(k, x, y, sc) for k, x, y, sc in CHART_SHAPES)
    return doc(p, 520, 640, s, "rough", seed=671, cut={"rim": 3, "rough": 5, "freq": .12})


def shape_card(kind):
    """200x200: one shape on a round white card (the tray: she taps the one Mom's hand shows on the chart)."""
    p = f"cs{kind[:2]}-"
    s = G(P(wob(100, 104, 92, 92, .02, 1, 30), "#FFFCF2"), p + "cut") + shape(kind, 100, 104, .9)
    return doc(p, 200, 200, G(s, p + "sh"), "smooth", seed=680 + len(kind), cut={"rim": 3, "rough": 4})


def glasses():
    """240x120: round glasses, light grey (tinted in the game); they go on her face and stay."""
    p = "cgl-"
    ring = lambda x: f'<path d="M{x},18 A42,42 0 1 1 {x - .1},18Z M{x},32 A28,28 0 1 0 {x + .1},32Z" fill="#E4E4E4" fill-rule="evenodd"/>'
    s = ring(66) + ring(174) + stroke("M100,58 Q120,46 140,58", "#E4E4E4", 10)
    s += C(66, 60, 28, SKY_L, ' opacity="0.45"') + C(174, 60, 28, SKY_L, ' opacity="0.45"') + P(wob(56, 48, 10, 5, .1, 1, 10, -30), WHITE, ' opacity="0.8"')
    return doc(p, 240, 120, G(s, p + "cut"), "smooth", seed=691, cut={"rim": 2.4, "rough": 3})


# ---- the rest: a bed (headboard and pillow behind her, the bed's side in front), the blanket, the lamp, snacks
BED_SEAT = 300      # the mattress's top in its 1000x560 frame: she sits up against the pillow with her hips here


def care_bed_back():
    """1000x560: the headboard, the pillow and the mattress's top behind the patient."""
    p = "cbk-"
    s = G(P(wr(140, 20, 720, 300, 120, 1.6, 1), WOOD) + P(wr(170, 46, 660, 260, 100, 1.4, 2), WOOD_L), p + "cut")
    s += "".join(heart(330 + i * 170, 120, .5, HEART_L, ' opacity="0.8"') for i in range(3))
    s += G(P(wob(500, 250, 300, 80, .03, 3, 30), WHITE) + P(wob(480, 236, 220, 44, .05, 4, 24), GREY_L, ' opacity="0.6"'), p + "sh")
    s += G(P(wr(60, BED_SEAT - 10, 880, 70, 30, 1.4, 5), "#FFFCF2"), p + "sh")
    return doc(p, 1000, 560, s, "smooth", seed=701, cut={"rim": 3, "rough": 4})


def care_bed_front():
    """1000x560: the bed's side and the sheet in front of her (it cuts her below the hips), on short legs."""
    p = "cbf2-"
    s = G(P(wr(40, BED_SEAT + 40, 920, 150, 30, 1.6, 1), WOOD) + P(wr(60, BED_SEAT + 30, 880, 60, 24, 1.4, 2), "#FFFCF2"), p + "cut")
    s += "".join(G(P(wr(x, BED_SEAT + 180, 40, 60, 10, 1, x), WOOD_D), p + "sh") for x in (90, 870))
    s += "".join(C(160 + i * 136, BED_SEAT + 120, 10, WOOD_L) for i in range(6))
    s += ground_shadow(500, BED_SEAT + 240, 460, 14, p, .25)
    return doc(p, 1000, 560, s, "smooth", seed=702, cut={"rim": 3, "rough": 4})


def blanket():
    """720x340: a patchwork quilt (dragged up from her lap to her chest)."""
    p = "cbl-"
    s = P(wr(20, 20, 680, 300, 50, 1.6, 1), SKY)
    cols = (SKY_L, HEART_L, "#FFE6A8", MINT_L)
    s += "".join(P(wr(40 + i * 128, 40 + j * 92, 120, 84, 18, 1, 10 + i * 3 + j), cols[(i + j) % 4], ' opacity="0.95"') for i in range(5) for j in range(3))
    s += "".join(heart(100 + i * 128, 82 + j * 92, .32, WHITE, ' opacity="0.8"') for i in range(5) for j in range(3) if (i + j) % 2 == 0)
    s += P(wr(20, 20, 680, 40, 20, 1.2, 3), WHITE, ' opacity="0.9"')
    return doc(p, 720, 340, G(s, p + "cut"), "smooth", seed=711, cut={"rim": 3, "rough": 4})


def lamp(on):
    """240x380: a little bedside lamp on a stool; on, its shade glows and a soft light falls."""
    p = "clo-" if on else "clf-"
    s = ""
    if on:
        s += P("M60,150 L180,150 L230,380 L10,380Z", "#FFF1A8", ' opacity="0.35"')
    s += G(P(wr(70, 300, 100, 70, 14, 1, 1), WOOD) + rect(112, 160, 16, 150, WALNUT), p + "sh")
    s += G(P("M60,60 L180,60 L206,170 L34,170Z", "#FFE08A" if on else PEACH_D) + P(wr(40, 160, 160, 16, 8, 1, 2), CORAL), p + "cut")
    if on:
        s += P(wob(120, 120, 70, 40, .05, 3, 16), WHITE, ' opacity="0.5"')
    return doc(p, 240, 380, s, "smooth", seed=721 if on else 722, cut={"rim": 2.6, "rough": 3.5})


def snack(kind):
    """160x160: a snack after the rest: an apple, a banana, a strawberry."""
    p = f"csn{kind[:2]}-"
    if kind == "apple":
        s = P(wob(80, 92, 56, 52, .04, 1, 24), "#E8414E") + P(wob(62, 78, 16, 22, .1, 2, 12, -20), "#F7909A", ' opacity="0.8"')
        s += stroke("M80,44 Q84,28 92,22", WALNUT, 7) + P(wob(104, 34, 18, 9, .1, 3, 12, -20), GREEN)
    elif kind == "banana":
        s = P("M24,58 Q40,140 136,112 Q140,100 130,96 Q60,110 46,46Z", "#F7D04A") + P("M40,64 Q56,118 120,108", "none", f' stroke="#E5B32E" stroke-width="5"')
        s += P(wr(18, 42, 30, 20, 6, 1, 1), WALNUT) + C(132, 104, 6, WALNUT)
    else:
        s = fruit_mark("strawberry", 80, 88, 1.9)
    return doc(p, 160, 160, G(s, p + "cut"), "smooth", seed=730 + len(kind), cut={"rim": 2.6, "rough": 3.5})


ITEMS5B = {
    "bg-clinic-care": bg_clinic_care, "care-bottle-back": care_bottle_back, "care-bottle-fill": care_bottle_fill,
    "care-bottle-front": care_bottle_front, "care-tub-back": care_tub_back, "care-tub-front": care_tub_front,
    "tool-shower": shower, "tool-towel": towel, "care-towel-head": towel_head, "care-duck": duck, "tool-roll": roll,
    "care-wrap": wrap, "care-heart": heart_sticker, "tool-polisher": polisher, "care-paste": paste, "care-chart": care_chart,
    "care-glasses": glasses, "care-bed-back": care_bed_back, "care-bed-front": care_bed_front, "care-blanket": blanket,
    "care-lamp-on": lambda: lamp(True), "care-lamp-off": lambda: lamp(False),
}
for _k in JAR_FRUIT:
    ITEMS5B[f"care-jar-{_k}"] = (lambda k: (lambda: care_jar(k)))(_k)
for _k, *_ in CHART_SHAPES:
    ITEMS5B[f"care-shape-{_k}"] = (lambda k: (lambda: shape_card(k)))(_k)
for _k in ("apple", "banana", "berry"):
    ITEMS5B[f"care-{_k}"] = (lambda k: (lambda: snack(k)))(_k)
TOOL_TIP5B = {"shower": (84, 84), "towel": (120, 130), "roll": (120, 120), "polisher": (66, 66)}

if __name__ == "__main__":
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    for k, fn in {**ITEMS5, **ITEMS5B}.items():
        if not only or k in only:
            gc.save(k, fn())
    print("anchors: TOOL_TIP5", TOOL_TIP5, "TICKLES", TICKLES)
    print("part B: TOOL_TIP5B", TOOL_TIP5B, "BOTTLE_LIQ", BOTTLE_LIQ, "TUB_RIM", TUB_RIM, "BED_SEAT", BED_SEAT, "CHART_SHAPES", CHART_SHAPES)
