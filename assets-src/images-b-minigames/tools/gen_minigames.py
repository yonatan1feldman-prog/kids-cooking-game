# images-b-minigames (two games that are not cooking: the market and washing up; research/minigames-spec.md).
# Uses the shared style-B kit (images-b/tools/pb.py, READ-ONLY) and writes into images-b-minigames/ only.
# Run: python tools/gen_minigames.py [names...]   then copy the SVGs into public/assets/images and bake the WebPs.
# The anchors the game relies on are printed at the end (ART.market / ART.dishes in src/core/assets.ts).
import sys, os, math, random
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
OUTDIR = os.path.normpath(os.path.join(HERE, ".."))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "images-b", "tools")))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "images-b-garden", "tools")))
from pb import *  # noqa: F401,F403
import pb
from gen_garden import tomato, strawberry, carrot_root, carrot_tops  # noqa: E402  (the garden's small fruit)

SKY_T = "#9FCBE0"; SKY_B = "#E4F1EF"
STONE = "#D9C7A8"; STONE_D = "#BFA982"; STONE_L = "#E8DAC0"
AWN = "#E0503A"; AWN_D = "#B83A28"
BLUE = "#5B8FD6"; BLUE_D = "#3F6FB2"; BLUE_L = "#9CC0EE"
YEL = "#F5C542"; YEL_D = "#D59C1A"; YEL_L = "#FFE28E"
PNK = "#EE88AE"; PNK_D = "#C9628A"; PNK_L = "#F8BDD2"
COLOURS = {"blue": (BLUE, BLUE_D, BLUE_L), "yellow": (YEL, YEL_D, YEL_L), "pink": (PNK, PNK_D, PNK_L)}
SPONGE = "#FFD35C"; SPONGE_D = "#E4A92C"; SCRUB = "#62AE48"; SCRUB_D = "#468A34"


def wr(x, y, w, h, rad, j=1.5, seed=1, step=40):
    return pb.wrect(x, y, w, h, rad, j, seed, step)


def rect(x, y, w, h, fill, extra=""):
    return f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}" fill="{fill}"{extra}/>'


def doc(p, w, h, body, material="default", seed=3, sh=(4, 3.5, .33), cut=None, extra_defs=""):
    return svg(w, h, std_defs(p, material, seed, sh, (8, 7, .28), cut) + extra_defs, G(body, p + "gr"))


# ================================================================ the market
def bg_market():
    p = "bgm-"
    rr = random.Random(5)
    grad = (f'<linearGradient id="{p}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{SKY_T}"/>'
            f'<stop offset="0.75" stop-color="{SKY_B}"/></linearGradient>')
    L = [rect(0, 0, 2400, 1080, f"url(#{p}sky)")]
    # clouds, far and soft
    for x, y, s in ((380, 150, 1.0), (1320, 110, .8), (2050, 190, 1.1)):
        L.append(G("".join(P(wob(x + dx * s, y + dy * s, r * s, r * .7 * s, .05, int(x) + i, 16), WHITE, ' opacity="0.8"')
                           for i, (dx, dy, r) in enumerate(((-60, 10, 60), (0, -10, 80), (70, 10, 62)))), p + "sh"))
    # the little town: a row of houses with roofs and windows
    cols = [(BG_WALL, RUST), ("#F6D7B8", TEAL_D), ("#EAD9F0", "#8A6FB0"), ("#FDE7A6", CORAL_D), ("#D9EAD3", RUST), ("#F8D2C8", TEAL)]
    x = -60
    i = 0
    houses = ""
    while x < 2460:
        w = rr.uniform(230, 320)
        h = rr.uniform(260, 380)
        wall, roof = cols[i % len(cols)]
        top = 760 - h
        houses += P(wr(x, top, w, h + 40, 6, 1.4, 30 + i), wall)
        houses += P(f"M{n(x - 16)},{n(top + 4)} L{n(x + w / 2)},{n(top - 110)} L{n(x + w + 16)},{n(top + 4)}Z", roof)
        for r in range(2):
            for c in range(2):
                wx = x + w * (.22 + c * .38)
                wy = top + 50 + r * 120
                if wy + 80 > 740:
                    continue
                houses += P(wr(wx, wy, w * .22, 76, 8, 1, 40 + i * 5 + r * 2 + c), "#FFF8EA") + P(wr(wx + 5, wy + 5, w * .22 - 10, 66, 6, 1, 60 + i), "#A9CFE0")
                houses += rect(wx + w * .11 - 2, wy + 5, 4, 66, "#FFF8EA")
        x += w + rr.uniform(10, 40)
        i += 1
    L.append(G(houses, p + "cut"))
    # bunting across the square
    bunt = stroke("M-20,120 Q600,220 1200,130 Q1800,220 2420,120", WALNUT_D, 4)
    for j in range(40):
        t = j / 39
        bx = -20 + t * 2440
        seg = t * 2
        yy = 120 + 90 * math.sin(math.pi * (seg % 1))
        col = [AWN, YEL, BLUE, SAGE, PNK][j % 5]
        bunt += P(f"M{n(bx - 20)},{n(yy)} L{n(bx + 20)},{n(yy)} L{n(bx)},{n(yy + 44)}Z", col)
    L.append(G(bunt, p + "sh"))
    # the square's stones
    L.append(G(rect(-20, 740, 2440, 360, STONE), p + "sh"))
    stones = ""
    for row, y in enumerate(range(770, 1090, 80)):
        off = 0 if row % 2 else 90
        for x in range(-120 + off, 2440, 180):
            stones += P(wr(x + 5, y + 5, 170, 70, 18, 1.2, x * 7 + y, step=60), STONE_L if (x // 180 + row) % 3 else STONE_D, ' opacity="0.7"')
    L.append(stones)
    defs = std_defs(p, "bg", seed=73, sh=(3, 3, .16), sh2=(4, 4, .18), blur=4) + grad
    return svg(2400, 1080, defs, G("".join(L), p + "gr"))


def market_awning():
    """1600x260: a scalloped, striped awning; the code stretches it uniformly over the stall."""
    p = "maw-"
    stripes = ""
    for i in range(16):
        x = i * 100
        stripes += rect(x, 20, 100, 170, AWN if i % 2 == 0 else CREAM)
    scallops = ""
    for i in range(16):
        x = i * 100
        scallops += P(f"M{x},186 Q{x + 50},262 {x + 100},186Z", AWN_D if i % 2 == 0 else CREAM2)
    body = G(P(wr(0, 12, 1600, 184, 10, 1.4, 3), AWN_D), p + "cut") + stripes + scallops
    body += P(wr(-4, 6, 1608, 30, 10, 1.2, 4), WALNUT) + P(wr(0, 10, 1600, 14, 6, 1, 5), WALNUT_L, ' opacity="0.8"')
    return doc(p, 1600, 260, body, "rough", seed=11, sh=(4, 4, .3), cut={"rim": 3, "rough": 6, "freq": .1})


def market_counter():
    """1600x300: the stall's counter (top edge at y 30: the lower row stands on it) and the shelf is `market-shelf`."""
    p = "mco-"
    s = G(P(wr(0, 20, 1600, 60, 10, 1.4, 21), WALNUT) + P(wr(20, 70, 1560, 230, 12, 1.4, 22), WOOD), p + "cut")
    for i, x in enumerate(range(40, 1580, 160)):
        s += P(wr(x, 84, 150, 200, 8, 1, 23 + i), WOOD_L if i % 2 else mix(WOOD, WOOD_L, .5), ' opacity="0.9"')
    s += P("M6,28 L1594,28 L1590,40 L10,40Z", WALNUT_L, ' opacity="0.8"')
    return doc(p, 1600, 300, s, "rough", seed=24, sh=(4, 4, .3), cut={"rim": 3, "rough": 6, "freq": .1})


def market_shelf():
    """1600x90: the upper shelf, a plank on two brackets (its top at y 16)."""
    p = "msh-"
    s = G(P(wr(0, 10, 1600, 40, 8, 1.4, 31), WALNUT) + P(wr(8, 16, 1584, 20, 6, 1, 32), WOOD_L), p + "cut")
    for x in (120, 1440):
        s += G(P(f"M{x},48 L{x + 40},48 L{x + 40},88 Z", WALNUT_D), p + "sh")
    return doc(p, 1600, 90, s, "rough", seed=33, sh=(4, 4, .3), cut={"rim": 2.4, "rough": 5})


def market_pole():
    p = "mpo-"
    s = G(P(wr(10, 0, 34, 900, 12, 1.2, 41), WALNUT) + P(wr(18, 0, 10, 900, 5, 1, 42), WALNUT_L, ' opacity="0.7"'), p + "sh")
    return doc(p, 54, 900, s, "rough", seed=43, sh=(3, 3, .3))


def market_crate():
    """300x150: the front of a crate; an item stands behind it on the shelf (its foot 20 above the crate's bottom)."""
    p = "mcr-"
    s = G(P(wr(6, 10, 288, 134, 10, 1.4, 51), WOOD_D), p + "cut")
    for i, y in enumerate((16, 58, 100)):
        s += P(wr(14, y, 272, 36, 6, 1, 52 + i), WOOD if i % 2 else WOOD_L)
    s += P(wr(12, 10, 24, 134, 6, 1, 55), WALNUT) + P(wr(264, 10, 24, 134, 6, 1, 56), WALNUT)
    return doc(p, 300, 150, s, "rough", seed=57, sh=(3, 3, .3), cut={"rim": 2.4, "rough": 4})


def market_list():
    """600x320: the shopping list, a paper note hanging from a clothes peg; the code lays the pictures on it."""
    p = "mli-"
    s = G(P(wr(20, 40, 560, 270, 18, 2, 61, step=24), WHITE), p + "cut")
    for y in range(110, 300, 60):
        s += stroke(f"M50,{y} L550,{y}", "#BFD6E6", 3, ' opacity="0.8"')
    s += stroke("M90,46 L90,300", "#F2A6A0", 3, ' opacity="0.7"')
    peg = P(wr(276, 0, 48, 90, 10, 1, 62), WOOD) + P(wr(284, 8, 32, 74, 8, 1, 63), WOOD_L) + P(wr(282, 36, 36, 10, 3, 1, 64), METAL_D)
    s += G(peg, p + "sh")
    return doc(p, 600, 320, s, "default", seed=65, sh=(4, 3.5, .3), cut={"rim": 3, "rough": 5})


def market_bag():
    """A market tote the list's pictures stand for (the card's icon)."""
    return ""


def card_market():
    p = "cmk-"
    L = [G(P(wr(10, 10, 380, 500, 36, 2.2, 3, step=18), CREAM), p + "cut")]
    clip = f'<clipPath id="{p}cl"><path d="{wr(34, 34, 332, 332, 26, 1.2, 4)}"/></clipPath>'
    scene = rect(20, 20, 360, 360, SKY_B) + rect(20, 300, 360, 80, STONE)
    aw = "".join(rect(20 + i * 45, 60, 45, 70, AWN if i % 2 == 0 else CREAM) for i in range(8))
    aw += "".join(P(f"M{20 + i * 45},128 Q{42 + i * 45},160 {65 + i * 45},128Z", AWN_D if i % 2 == 0 else CREAM2) for i in range(8))
    scene += G(aw, p + "sh")
    scene += G(rect(40, 130, 14, 200, WALNUT) + rect(346, 130, 14, 200, WALNUT) + P(wr(30, 250, 340, 90, 8, 1, 5), WOOD), p + "sh")
    scene += G(P(wr(60, 212, 120, 50, 6, 1, 6), WOOD_L) + P(wr(220, 212, 120, 50, 6, 1, 7), WOOD_L), p + "sh")
    scene += G(tomato(96, 206, 26, 71) + tomato(142, 204, 24, 72) + strawberry(262, 196, 26, 73) + strawberry(306, 200, 24, 75), p + "sh")
    L.append(G(f'<g clip-path="url(#{p}cl)">{scene}</g>', p + "sh"))
    L.append(G(P(wr(130, -4, 140, 40, 3, 1.4, 6), MUSTARD, ' opacity="0.85" transform="rotate(-4 200 15)"')
               + "".join(C(146 + i * 18, 16, 4, WHITE, ' opacity="0.7" transform="rotate(-4 200 15)"') for i in range(7)), p + "sh"))
    # the list: a note with three little pictures and ticks
    note = G(P(wr(70, 392, 260, 104, 10, 1.4, 8), WHITE), p + "sh")
    note += G(tomato(118, 448, 20, 81) + strawberry(200, 440, 20, 82) + carrot_root(282, 424, 20, 46, 83), p + "sh")
    L.append(note)
    defs = std_defs(p, "rough", seed=235, sh=(4, 3.5, .32), cut={"rim": 3, "rough": 7, "freq": .12}) + clip
    return svg(400, 520, defs, G("".join(L), p + "gr"))


# ================================================================ washing up
PLATE = 300
PLATE_R = 136


def plate_body(cx, cy, r, col, seed):
    c, d, l = COLOURS[col]
    s = P(wob(cx, cy, r, r, .012, seed, 40), d)
    s += P(wob(cx, cy - 3, r - 6, r - 6, .012, seed + 1, 40), c)
    s += P(wob(cx, cy, r * .68, r * .68, .015, seed + 2, 36), WHITE)
    s += P(wob(cx, cy + 3, r * .6, r * .6, .015, seed + 3, 36), CREAM, ' opacity="0.7"')
    # a ring of dots on the rim, and a shine
    s += "".join(C(cx + math.cos(a) * r * .84, cy + math.sin(a) * r * .84, r * .05, l) for a in [i * math.pi / 8 for i in range(16)])
    s += P(f"M{n(cx - r * .8)},{n(cy - r * .2)} Q{n(cx - r * .7)},{n(cy - r * .75)} {n(cx - r * .2)},{n(cy - r * .86)} Q{n(cx - r * .62)},{n(cy - r * .6)} {n(cx - r * .72)},{n(cy - r * .16)}Z", WHITE, ' opacity="0.55"')
    return s


def dish_plate(col):
    p = f"dp{col[0]}-"
    s = G(plate_body(150, 150, PLATE_R, col, 91), p + "cut")
    return doc(p, PLATE, PLATE, s, "smooth", seed=92, sh=(4, 3.5, .3), cut={"rim": 2.6, "rough": 3.5})


CUP_W, CUP_H = 280, 260
CUP_HOOK = (232, 90)   # the top of the handle: it hangs on the hook there


def dish_cup(col):
    """A mug, side view, its handle on the right (it hangs from a hook by the handle)."""
    c, d, l = COLOURS[col]
    p = f"dc{col[0]}-"
    body = P(wr(30, 50, 180, 190, 30, 1.2, 101), d) + P(wr(38, 54, 164, 178, 26, 1.2, 102), c)
    body += P(wob(120, 56, 86, 16, .02, 103, 24), d) + P(wob(120, 58, 76, 11, .02, 104, 24), "#6B4A3A")
    body += P(wr(38, 150, 164, 26, 8, 1, 105), l, ' opacity="0.85"')
    body += P("M52,80 Q48,160 64,216 L78,216 Q64,160 70,80Z", WHITE, ' opacity="0.45"')
    handle = stroke("M202,90 Q262,90 258,150 Q254,204 202,200", d, 30) + stroke("M202,90 Q262,90 258,150 Q254,204 202,200", c, 18)
    s = G(handle + body, p + "cut")
    return doc(p, CUP_W, CUP_H, s, "smooth", seed=106, sh=(4, 3.5, .3), cut={"rim": 2.6, "rough": 3.5})


def dish_mess():
    """300x300: food on a dirty dish (tomato sauce and crumbs); it fades as she scrubs."""
    p = "dms-"
    rr = random.Random(111)
    s = ""
    for i, (x, y, r) in enumerate(((120, 130, 54), (182, 170, 40), (150, 206, 30), (96, 190, 24), (200, 110, 22))):
        s += P(wob(x, y, r, r * .8, .18, 112 + i, 14, rr.uniform(0, 90)), SAUCE_D) + P(wob(x - 3, y - 3, r * .78, r * .6, .2, 120 + i, 12), SAUCE)
    for i in range(16):
        x, y = rr.uniform(70, 230), rr.uniform(80, 230)
        s += P(wob(x, y, rr.uniform(5, 10), rr.uniform(4, 8), .2, 140 + i, 8), CRUST if i % 2 else HERB)
    return doc(p, 300, 300, G(s, p + "sh"), "default", seed=150, sh=(2, 2, .2))


def dish_sponge():
    p = "dsp-"
    s = G(P(wr(20, 50, 200, 90, 18, 2, 161), SPONGE_D) + P(wr(24, 54, 192, 80, 16, 2, 162), SPONGE), p + "cut")
    rr = random.Random(163)
    s += "".join(E(rr.uniform(40, 200), rr.uniform(70, 126), rr.uniform(3, 7), rr.uniform(2, 5), SPONGE_D, ' opacity="0.6"') for _ in range(26))
    s += G(P(wr(20, 14, 200, 44, 14, 2, 164), SCRUB_D) + P(wr(24, 16, 192, 36, 12, 2, 165), SCRUB), p + "sh")
    return doc(p, 240, 150, s, "rough", seed=166, sh=(3, 3, .3), cut={"rim": 2.4, "rough": 4})


RACK_W, RACK_H = 960, 720
RACK_COLS = (170, 480, 790)       # the three colour columns' centres: blue, yellow, pink
RACK_HOOK_Y = 96                  # the hooks' tip (a cup's CUP_HOOK hangs there)
RACK_SLOT_Y = 520                 # a plate's centre when it stands in its slot


def dish_rack():
    """960x720: a wooden drying rack. Top: a rail with a hook per colour (the cups hang there). Below: a tray with a
    slot of dowels per colour (the plates stand there). Each column carries its colour: a painted tag on the rail and
    painted dowel tips, so she matches the colour, not a word."""
    p = "drk-"
    frame = P(wr(20, 40, 36, 660, 12, 1.2, 171), WALNUT) + P(wr(904, 40, 36, 660, 12, 1.2, 172), WALNUT)
    frame += P(wr(10, 30, 940, 40, 12, 1.4, 173), WALNUT) + P(wr(16, 36, 928, 16, 6, 1, 174), WALNUT_L, ' opacity="0.8"')
    frame += P(wr(10, 640, 940, 60, 14, 1.4, 175), WALNUT) + P(wr(18, 646, 924, 24, 8, 1, 176), WOOD_L, ' opacity="0.9"')
    back = ""
    for i, (x, col) in enumerate(zip(RACK_COLS, ("blue", "yellow", "pink"))):
        c, d, l = COLOURS[col]
        # each column's painted back board: the colour she matches
        back += P(wr(x - 146, 74, 292, 570, 22, 1.6, 190 + i), l) + P(wr(x - 132, 88, 264, 542, 18, 1.4, 194 + i), mix(l, WHITE, .45))
    s = G(back, p + "sh") + G(frame, p + "cut")
    for i, (x, col) in enumerate(zip(RACK_COLS, ("blue", "yellow", "pink"))):
        c, d, l = COLOURS[col]
        # the tag on the rail
        s += G(C(x - 70, 50, 30, d) + C(x - 70, 48, 24, c) + C(x - 78, 40, 7, l), p + "sh")
        # the hook
        hook = f"M{x + 70},60 L{x + 70},{RACK_HOOK_Y - 6} Q{x + 70},{RACK_HOOK_Y + 26} {x + 44},{RACK_HOOK_Y + 16}"
        s += G(stroke(hook, METAL_D, 16) + stroke(hook, METAL_L, 7), p + "sh")
        # the plate slot: two rows of dowels with painted tips, a coloured strip on the tray
        dow = ""
        for dx in (-120, -40, 40, 120):
            dow += P(wr(x + dx - 9, 390, 18, 262, 8, 1, 180 + i * 10 + dx), WOOD_D) + C(x + dx, 392, 14, c) + C(x + dx - 3, 388, 5, l)
        s += G(dow, p + "sh")
        s += P(wr(x - 140, 652, 280, 18, 8, 1, 200 + i), c, ' opacity="0.95"')
    return doc(p, RACK_W, RACK_H, s, "rough", seed=210, sh=(4, 4, .3), cut={"rim": 3, "rough": 5, "freq": .12})


def card_dishes():
    p = "cds-"
    L = [G(P(wr(10, 10, 380, 500, 36, 2.2, 3, step=18), CREAM), p + "cut")]
    clip = f'<clipPath id="{p}cl"><path d="{wr(34, 34, 332, 332, 26, 1.2, 4)}"/></clipPath>'
    scene = rect(20, 20, 360, 360, BG_TILE) + rect(20, 300, 360, 80, BG_WOOD)
    scene += G(P(wob(200, 300, 150, 44, .02, 5, 24), METAL_D) + P(wob(200, 296, 136, 34, .02, 6, 24), "#BFE3F0"), p + "sh")
    scene += G(plate_body(200, 210, 90, "blue", 7), p + "sh")
    scene += G(P(wr(250, 250, 90, 44, 12, 1.4, 8), SPONGE) + P(wr(250, 236, 90, 22, 10, 1.4, 9), SCRUB), p + "sh")
    bub = "".join(C(x, y, r, WHITE, ' opacity="0.85"') + C(x - r * .3, y - r * .3, r * .3, "#DDF3FA") for x, y, r in
                  ((90, 140, 22), (120, 100, 14), (300, 150, 18), (320, 110, 12), (160, 80, 10), (260, 90, 16)))
    scene += G(bub, p + "sh")
    L.append(G(f'<g clip-path="url(#{p}cl)">{scene}</g>', p + "sh"))
    L.append(G(P(wr(130, -4, 140, 40, 3, 1.4, 6), MUSTARD, ' opacity="0.85" transform="rotate(-4 200 15)"')
               + "".join(C(146 + i * 18, 16, 4, WHITE, ' opacity="0.7" transform="rotate(-4 200 15)"') for i in range(7)), p + "sh"))
    # three little plates below, one per colour
    L.append(G("".join(plate_body(x, 444, 42, col, 10 + i) for i, (x, col) in enumerate(((100, "blue"), (200, "yellow"), (300, "pink")))), p + "sh"))
    defs = std_defs(p, "rough", seed=236, sh=(4, 3.5, .32), cut={"rim": 3, "rough": 7, "freq": .12}) + clip
    return svg(400, 520, defs, G("".join(L), p + "gr"))


ITEMS = {
    "bg-market": bg_market, "market-awning": market_awning, "market-counter": market_counter, "market-shelf": market_shelf,
    "market-pole": market_pole, "market-crate": market_crate, "market-list": market_list, "card-market": card_market,
    "dish-plate-blue": lambda: dish_plate("blue"), "dish-plate-yellow": lambda: dish_plate("yellow"),
    "dish-plate-pink": lambda: dish_plate("pink"), "dish-cup-blue": lambda: dish_cup("blue"),
    "dish-cup-yellow": lambda: dish_cup("yellow"), "dish-cup-pink": lambda: dish_cup("pink"), "dish-mess": dish_mess,
    "dish-sponge": dish_sponge, "dish-rack": dish_rack, "card-dishes": card_dishes,
}


def save(name, s):
    path = os.path.join(OUTDIR, name + ".svg")
    with open(path, "w", encoding="utf8") as f:
        f.write(s)
    size = len(s.encode("utf8"))
    print(f"{name:24s} {size / 1024:6.1f} KB" + ("  OVER BUDGET" if size > 60 * 1024 else ""))


if __name__ == "__main__":
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    for k, fn in ITEMS.items():
        if not only or k in only:
            save(k, fn())
    print("anchors: CUP_HOOK", CUP_HOOK, "RACK_COLS", RACK_COLS, "RACK_HOOK_Y", RACK_HOOK_Y, "RACK_SLOT_Y", RACK_SLOT_Y,
          "PLATE_R", PLATE_R)
