# images-b-garden (the garden, a stage that is not cooking: plant, water, grow, pick; research/new-stage-2-spec.md).
# Uses the shared style-B kit (images-b/tools/pb.py, READ-ONLY) and writes into images-b-garden/ only.
# Run: python tools/gen_garden.py [names...]   then copy the SVGs into public/assets/images and bake the WebPs.
# The anchors the game relies on are printed at the end (ART.garden in src/core/assets.ts).
import sys, os, math, random
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
OUTDIR = os.path.normpath(os.path.join(HERE, ".."))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "images-b", "tools")))
from pb import *  # noqa: F401,F403
import pb

SKY = "#C4DCDA"; SKY_L = "#DCEBE6"
HILL = "#A9C090"; HILL_F = "#BFD3A6"; HILL_D = "#8CA776"
GRASS = "#8FBF62"; GRASS_D = "#6E9E48"; GRASS_L = "#A9D17E"
SOIL = "#7A4E32"; SOIL_D = "#5A3622"; SOIL_L = "#98663F"
LEAF = GREEN; LEAF_D = GREEN_D; LEAF_L = GREEN_L
CARROT = "#F28A2E"; CARROT_D = "#CF6A1A"; CARROT_L = "#FFAE5C"
STRAW = "#E8433A"; STRAW_D = "#B8302A"; STRAW_L = "#F57A68"
CAN = TEAL; CAN_D = TEAL_D; CAN_L = TEAL_L
SUN = "#FFD152"; SUN_D = "#F2A93B"; SUN_L = "#FFE89A"
CLOUD = "#B9C6CE"; CLOUD_D = "#98A7B2"; CLOUD_L = "#D6DFE4"
SNAIL = "#E9C79A"; SNAIL_D = "#C79E6E"; SHELL = "#C0784A"; SHELL_D = "#94553A"; SHELL_L = "#E0A06A"


def wr(x, y, w, h, rad, j=1.5, seed=1, step=40):
    return pb.wrect(x, y, w, h, rad, j, seed, step)


def rect(x, y, w, h, fill, extra=""):
    return f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}" fill="{fill}"{extra}/>'


def doc(p, w, h, body, material="default", seed=3, sh=(4, 3.5, .33), cut=None, extra_defs=""):
    return svg(w, h, std_defs(p, material, seed, sh, (8, 7, .28), cut) + extra_defs, G(body, p + "gr"))


# ---------------------------------------------------------------- the fruit (small, shared by packets, card, basket)
def tomato(cx, cy, r, seed=1):
    s = G(P(wob(cx, cy, r, r * .92, .04, seed, 22), RED_D) + P(wob(cx - r * .04, cy - r * .04, r * .9, r * .82, .04, seed + 1, 22), RED))
    s += P(f"M{n(cx - r * .62)},{n(cy - r * .1)} Q{n(cx - r * .55)},{n(cy - r * .6)} {n(cx - r * .12)},{n(cy - r * .7)} Q{n(cx - r * .45)},{n(cy - r * .45)} {n(cx - r * .5)},{n(cy - r * .05)}Z", RED_L, ' opacity="0.9"')
    star = spiky(cx, cy - r * .78, r * .12, r * .42, 0, 360, 5, seed + 3, .55)
    s += P(star, LEAF_D) + P(spiky(cx, cy - r * .8, r * .08, r * .34, 20, 380, 5, seed + 4, .5), LEAF)
    s += P(f"M{n(cx - r * .05)},{n(cy - r * .85)} L{n(cx + r * .02)},{n(cy - r * 1.12)} L{n(cx + r * .12)},{n(cy - r * 1.1)} L{n(cx + r * .07)},{n(cy - r * .82)}Z", LEAF_D)
    return s


def strawberry(cx, cy, r, seed=1):
    # r = half width; the berry is a rounded heart tip down, leaves on top
    pts = [(cx - r, cy - r * .5), (cx - r * .92, cy + r * .2), (cx - r * .55, cy + r * .85), (cx, cy + r * 1.25),
           (cx + r * .55, cy + r * .85), (cx + r * .92, cy + r * .2), (cx + r, cy - r * .5), (cx + r * .5, cy - r * .78),
           (cx, cy - r * .7), (cx - r * .5, cy - r * .78)]
    s = P(smooth(pts), STRAW_D)
    inner = [(x * .9 + cx * .1, y * .9 + (cy - r * .05) * .1) for x, y in pts]
    s += P(smooth(inner), STRAW)
    s += P(f"M{n(cx - r * .7)},{n(cy - r * .3)} Q{n(cx - r * .7)},{n(cy + r * .3)} {n(cx - r * .35)},{n(cy + r * .7)} Q{n(cx - r * .5)},{n(cy + r * .2)} {n(cx - r * .45)},{n(cy - r * .35)}Z", STRAW_L, ' opacity="0.8"')
    rr = random.Random(seed)
    for i in range(11):
        x = cx + rr.uniform(-.65, .65) * r
        y = cy + rr.uniform(-.35, .8) * r
        if abs(x - cx) / r > 0.75 - (y - cy) / r * .35:
            continue
        s += E(x, y, r * .06, r * .09, SUN_L)
    s += P(spiky(cx, cy - r * .7, r * .15, r * .62, 180, 360, 4, seed + 5, .55), LEAF_D)
    s += P(spiky(cx, cy - r * .74, r * .1, r * .5, 190, 350, 4, seed + 6, .5), LEAF)
    return s


def carrot_root(cx, top, w, h, seed=1):
    pts = [(cx - w / 2, top + 6), (cx - w * .42, top + h * .35), (cx - w * .2, top + h * .78), (cx, top + h),
           (cx + w * .2, top + h * .78), (cx + w * .42, top + h * .35), (cx + w / 2, top + 6), (cx, top - 4)]
    s = P(smooth(pts), CARROT_D) + P(smooth([(x * .88 + cx * .12, y) for x, y in pts]), CARROT)
    for i in range(4):
        y = top + h * (.2 + i * .16)
        hw = w * (.34 - i * .06)
        s += stroke(f"M{n(cx - hw)},{n(y)} q{n(hw * .5)},4 {n(hw * .8)},1", CARROT_D, 2.4, ' opacity="0.7"')
    s += P(f"M{n(cx - w * .3)},{n(top + 12)} Q{n(cx - w * .28)},{n(top + h * .5)} {n(cx - w * .08)},{n(top + h * .8)} Q{n(cx - w * .18)},{n(top + h * .4)} {n(cx - w * .16)},{n(top + 12)}Z", CARROT_L, ' opacity="0.8"')
    return s


def carrot_tops(cx, base, h, seed=1, spread=1.0):
    rr = random.Random(seed)
    s = ""
    for i, a in enumerate((-32, -14, 2, 18, 34)):
        a = math.radians(a * spread + rr.uniform(-4, 4))
        L = h * rr.uniform(.8, 1.0)
        tx, ty = cx + math.sin(a) * L, base - math.cos(a) * L
        col = LEAF_D if i % 2 else LEAF
        s += stroke(f"M{n(cx)},{n(base)} Q{n(cx + math.sin(a) * L * .4)},{n(base - L * .55)} {n(tx)},{n(ty)}", col, 7)
        for k in range(4):
            t = .35 + k * .17
            px, py = cx + math.sin(a) * L * t, base - math.cos(a) * L * t
            for side in (-1, 1):
                s += P(wob(px + side * 13, py - 6, 15, 8, .1, seed + i * 9 + k, 10, side * 35 + math.degrees(a)), col)
        s += P(wob(tx, ty, 13, 16, .1, seed + i, 10, math.degrees(a)), LEAF_L if i % 2 == 0 else col)
    return s


def leaf_shape(cx, cy, L, W, ang, col, vein=None):
    a = math.radians(ang)
    ux, uy = math.cos(a), math.sin(a)
    vx, vy = -uy, ux
    pts = [(cx, cy), (cx + ux * L * .3 + vx * W, cy + uy * L * .3 + vy * W), (cx + ux * L * .75 + vx * W * .7, cy + uy * L * .75 + vy * W * .7),
           (cx + ux * L, cy + uy * L), (cx + ux * L * .75 - vx * W * .7, cy + uy * L * .75 - vy * W * .7), (cx + ux * L * .3 - vx * W, cy + uy * L * .3 - vy * W)]
    s = P(smooth(pts, 1 / 5), col)
    if vein:
        s += stroke(f"M{n(cx)},{n(cy)} L{n(cx + ux * L * .85)},{n(cy + uy * L * .85)}", vein, 3, ' opacity="0.6"')
    return s


# ---------------------------------------------------------------- background (2400x1080)
def bg_garden():
    p = "bgg-"
    rr = random.Random(7)
    grad = (f'<linearGradient id="{p}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FCBE0"/>'
            f'<stop offset="0.7" stop-color="#DDEFF0"/></linearGradient>')
    L = [rect(0, 0, 2400, 1080, f"url(#{p}sky)")]
    # far hills
    far = [(-50, 640)] + [(x, 560 + 40 * math.sin(x / 260) + rr.uniform(-10, 10)) for x in range(0, 2500, 160)] + [(2450, 640), (2450, 900), (-50, 900)]
    L.append(G(P("M" + " L".join(f"{n(x)},{n(y)}" for x, y in far) + "Z", HILL_F), p + "sh"))
    near = [(-50, 700)] + [(x, 640 + 36 * math.sin(x / 190 + 1.3) + rr.uniform(-8, 8)) for x in range(0, 2500, 140)] + [(2450, 700), (2450, 900), (-50, 900)]
    L.append(G(P("M" + " L".join(f"{n(x)},{n(y)}" for x, y in near) + "Z", HILL), p + "sh"))
    # trees on the hills
    for x, y, s in ((520, 600, 1.0), (1560, 590, .8), (2150, 610, 1.1), (1180, 620, .6)):
        L.append(G(P(wr(x - 10 * s, y, 20 * s, 90 * s, 6, 1, int(x)), WALNUT)
                   + P(wob(x, y - 20 * s, 70 * s, 64 * s, .08, int(x) + 1, 18), HILL_D)
                   + P(wob(x - 18 * s, y - 36 * s, 42 * s, 36 * s, .1, int(x) + 2, 14), mix(HILL_D, HILL, .5)), p + "sh"))
    # the house wall with the kitchen door, at the left edge (she came out of it)
    L.append(G(P(wr(-40, 180, 330, 700, 10, 1.5, 3), BG_WALL) + P(wr(-40, 150, 360, 60, 10, 1.5, 4), RUST), p + "cut"))
    L.append(G(P(wr(70, 420, 170, 420, 70, 1.2, 5), TEAL_D) + P(wr(84, 434, 142, 400, 60, 1.2, 6), TEAL)
               + C(206, 640, 10, MUSTARD) + P(wr(96, 452, 118, 100, 50, 1, 7), TEAL_L, ' opacity="0.5"'), p + "sh"))
    L.append(G(P(wr(50, 250, 90, 110, 10, 1, 8), WOOD) + P(wr(60, 260, 70, 90, 6, 1, 9), SKY_L)
               + rect(93, 260, 4, 90, WOOD) + rect(60, 303, 70, 4, WOOD), p + "sh"))
    # the fence
    fence = ""
    for i, x in enumerate(range(300, 2440, 70)):
        h = 150 + rr.uniform(-6, 6)
        fence += P(f"M{x},{n(820)} L{x},{n(820 - h + 18)} L{x + 24},{n(820 - h)} L{x + 48},{n(820 - h + 18)} L{x + 48},820Z", WOOD_L if i % 2 else mix(WOOD_L, WOOD, .3))
    fence += P(wr(290, 700, 2150, 22, 6, 1.2, 11), WOOD) + P(wr(290, 770, 2150, 22, 6, 1.2, 12), WOOD)
    L.append(G(fence, p + "cut"))
    # grass
    L.append(G(P("M-20,800 " + " ".join(f"Q{x + 60},{n(780 + rr.uniform(-10, 10))} {x + 120},{n(800 + rr.uniform(-6, 6))}" for x in range(-20, 2420, 120)) + " L2420,1100 L-20,1100Z", GRASS), p + "sh"))
    L.append(P("M-20,930 " + " ".join(f"Q{x + 80},{n(910 + rr.uniform(-12, 12))} {x + 160},{n(930 + rr.uniform(-6, 6))}" for x in range(-20, 2420, 160)) + " L2420,1100 L-20,1100Z", GRASS_D, ' opacity="0.55"'))
    tufts = ""
    for i in range(70):
        x, y = rr.uniform(0, 2400), rr.uniform(820, 1070)
        c = GRASS_D if rr.random() < .5 else GRASS_L
        tufts += P(f"M{n(x - 12)},{n(y)} L{n(x - 6)},{n(y - 26)} L{n(x - 1)},{n(y - 4)} L{n(x + 4)},{n(y - 30)} L{n(x + 8)},{n(y - 3)} L{n(x + 14)},{n(y - 22)} L{n(x + 16)},{n(y)}Z", c)
    L.append(tufts)
    fl = ""
    for i in range(26):
        x, y = rr.uniform(320, 2380), rr.uniform(830, 1060)
        col = [WHITE, SUN_L, PINK, "#C9B6E4"][i % 4]
        fl += "".join(C(x + math.cos(a) * 8, y + math.sin(a) * 8, 6, col) for a in [k * 1.2566 for k in range(5)]) + C(x, y, 5, MUSTARD)
    L.append(G(fl, p + "sh"))
    defs = std_defs(p, "bg", seed=71, sh=(3, 3, .16), sh2=(4, 4, .18), blur=4) + grad
    return svg(2400, 1080, defs, G("".join(L), p + "gr"))


# ---------------------------------------------------------------- the raised bed (1300x360): soil y 30-150, planks from 140
BED_W, BED_H = 1300, 360
SOIL_Y = 100                # the soil line where the plants stand
HOLES = (250, 650, 1050)    # the three holes' x


def planks(p):
    s = G(P(wr(10, 140, 1280, 214, 18, 1.6, 21), WALNUT) + P(wr(22, 150, 1256, 194, 14, 1.4, 22), WOOD), p + "cut")
    for i, y in enumerate((212, 280)):
        s += P(wr(24, y - 3, 1252, 6, 3, .8, 23 + i), WOOD_D, ' opacity="0.7"')
    rr = random.Random(24)
    s += "".join(stroke(f"M{n(x)},{n(y)} q60,{n(rr.uniform(-4, 4))} 140,{n(rr.uniform(-3, 3))}", WOOD_D, 2, ' opacity="0.35"')
                 for x, y in [(rr.uniform(40, 1100), rr.uniform(165, 330)) for _ in range(16)])
    s += P("M26,154 L1274,154 L1270,164 L30,164Z", WOOD_L, ' opacity="0.8"')
    for x in (40, 1236):
        s += G(P(wr(x, 134, 24, 220, 8, 1, x), WALNUT_D), p + "sh")
    return s


def garden_bed():
    p = "gb-"
    s = G(P(wr(20, 30, 1260, 150, 50, 2, 31), SOIL_D), p + "cut")
    s += P(wr(34, 40, 1232, 130, 46, 2, 32), SOIL)
    rr = random.Random(33)
    s += "".join(E(rr.uniform(60, 1240), rr.uniform(52, 150), rr.uniform(5, 12), rr.uniform(3, 6), SOIL_L if rr.random() < .6 else SOIL_D, ' opacity="0.8"') for _ in range(60))
    s += planks(p)
    return doc(p, BED_W, BED_H, s, "rough", seed=34, sh=(4, 4, .3), cut={"rim": 3, "rough": 6, "freq": .1})


def garden_bed_front():
    p = "gbf-"
    return doc(p, BED_W, BED_H, planks(p), "rough", seed=34, sh=(4, 4, .3), cut={"rim": 3, "rough": 6, "freq": .1})


def garden_hole():
    p = "gh-"
    s = G(P(wob(90, 40, 80, 28, .06, 41, 18), SOIL_L), p + "sh") + P(wob(90, 42, 62, 20, .07, 42, 16), SOIL_D) + P(wob(90, 46, 44, 12, .08, 43, 14), "#3F2516")
    return doc(p, 180, 80, s, seed=44, sh=(2, 2, .25))


def garden_mound():
    p = "gm-"
    s = G(P("M10,80 Q30,24 100,18 Q170,24 190,80Z", SOIL_D), p + "cut") + P("M22,78 Q40,32 100,28 Q160,32 178,78Z", SOIL)
    s += P("M50,52 Q80,34 112,34 Q84,42 60,60Z", SOIL_L, ' opacity="0.8"')
    rr = random.Random(45)
    s += "".join(E(rr.uniform(40, 160), rr.uniform(46, 74), 5, 3, SOIL_L) for _ in range(9))
    return doc(p, 200, 90, s, seed=46, sh=(3, 2.5, .3), cut={"rim": 2, "rough": 3})


def garden_seed():
    p = "gs-"
    s = G(P("M25,4 Q46,26 40,44 Q34,58 25,58 Q16,58 10,44 Q4,26 25,4Z", "#8A5A36") + P("M25,10 Q40,28 35,43 Q31,52 25,52 Q19,52 15,43 Q10,28 25,10Z", "#C8955C")
          + P("M20,22 Q16,34 20,44 Q22,32 26,24Z", "#E6BD84", ' opacity="0.9"'), p + "cut")
    return doc(p, 50, 62, s, seed=47, sh=(2, 2, .3), cut={"rim": 2, "rough": 2})


# ---------------------------------------------------------------- the seed packets (240x320)
def packet(kind):
    p = f"sp{kind[0]}-"
    col = {"tomato": "#F7C9B8", "strawberry": "#F9D3DA", "carrot": "#FBDDB5"}[kind]
    acc = {"tomato": RED, "strawberry": STRAW, "carrot": CARROT}[kind]
    s = G(P(wr(16, 30, 208, 280, 16, 1.6, 51), CREAM), p + "cut")
    # the crimped top
    s += G(P("M16,30 " + " ".join(f"L{x + 8},14 L{x + 16},30" for x in range(16, 224, 16)) + " L224,54 L16,54Z", mix(CREAM, PAPER, .5)), p + "sh")
    s += P(wr(32, 70, 176, 176, 14, 1.2, 52), col)
    s += P(wr(32, 256, 176, 36, 10, 1, 53), acc)
    s += "".join(C(56 + i * 32, 274, 7, WHITE, ' opacity="0.8"') for i in range(5))
    if kind == "tomato":
        s += G(leaf_shape(120, 204, 70, 22, -150, LEAF, LEAF_D) + leaf_shape(120, 204, 70, 22, -30, LEAF_D) + tomato(120, 168, 58, 61), p + "sh")
    elif kind == "strawberry":
        s += G(leaf_shape(120, 210, 64, 22, -160, LEAF_D) + leaf_shape(120, 210, 64, 22, -20, LEAF) + strawberry(120, 150, 50, 62), p + "sh")
    else:
        s += G(carrot_tops(120, 130, 60, 63, .8) + carrot_root(120, 122, 60, 118, 64), p + "sh")
    return doc(p, 240, 320, s, "rough", seed=55, sh=(4, 3.5, .32), cut={"rim": 3, "rough": 5, "freq": .12})


# ---------------------------------------------------------------- the plants
def garden_sprout():
    p = "gsp-"
    s = stroke("M70,176 Q68,130 72,96", LEAF_D, 9) + leaf_shape(72, 98, 64, 22, -150, LEAF, LEAF_D) + leaf_shape(72, 98, 64, 22, -30, LEAF_L, LEAF_D)
    return doc(p, 140, 180, G(s, p + "cut"), seed=71, sh=(3, 2.5, .3), cut={"rim": 2, "rough": 3})


def young(kind):
    p = f"py{kind[0]}-"
    if kind == "carrot":
        s = carrot_tops(130, 376, 190, 81, .9)
    else:
        s = stroke("M130,376 Q126,280 134,190", LEAF_D, 11)
        for i, (y, a, L) in enumerate(((330, -160, 90), (320, -20, 96), (262, -150, 84), (250, -30, 88), (200, -110, 70), (196, -70, 66))):
            s += leaf_shape(132, y, L, 30, a, LEAF if i % 2 else LEAF_L, LEAF_D)
    return doc(p, 260, 380, G(s, p + "cut"), seed=82, sh=(3, 3, .3), cut={"rim": 2.4, "rough": 4})


# grown plants: where the fruits hang (from the plant's base point, the soil line)
TOMATO_FRUITS = ((-92, -330), (70, -420), (-40, -210), (96, -250))
STRAW_FRUITS = ((-128, -44), (0, -30), (126, -52))


def plant_tomato():
    p = "ptm-"
    W, H = 400, 640
    bx, by = 200, 636
    s = G(P(wr(bx + 40, 60, 16, by - 50, 6, 1, 91), WOOD), p + "sh")      # the stake
    s += stroke(f"M{bx},{by} Q{bx - 10},{by - 200} {bx + 6},{by - 380} Q{bx + 14},{by - 480} {bx},{by - 560}", LEAF_D, 13)
    for x, y in TOMATO_FRUITS:
        s += stroke(f"M{bx + (6 if x > 0 else -4)},{by + y + 20 if abs(x) < 50 else by + y + 40} Q{bx + x * .6},{by + y - 10} {bx + x},{by + y - 18}", LEAF_D, 6)
    rr = random.Random(92)
    for i in range(16):
        t = i / 15
        y = by - 80 - t * 480
        side = -1 if i % 2 else 1
        a = (-160 if side < 0 else -20) + rr.uniform(-15, 15)
        s += leaf_shape(bx + rr.uniform(-6, 6), y, rr.uniform(80, 110) * (1 - t * .3), 30, a, [LEAF, LEAF_L, LEAF_D][i % 3], LEAF_D)
    s += stroke(f"M{bx + 40},{by - 300} q30,-10 8,-40", "#D9C08A", 4) + stroke(f"M{bx + 40},{by - 460} q30,-10 8,-40", "#D9C08A", 4)
    return doc(p, W, H, G(s, p + "cut"), seed=93, sh=(4, 3.5, .3), cut={"rim": 2.6, "rough": 4, "freq": .15})


def plant_strawberry():
    p = "pst-"
    W, H = 420, 300
    bx, by = 210, 296
    s = ""
    for x, y in STRAW_FRUITS:
        s += stroke(f"M{bx},{by - 40} Q{bx + x * .5},{by - 130} {bx + x},{by + y - 44}", LEAF_D, 5)
    rr = random.Random(95)
    for i, a in enumerate((-160, -128, -112, -90, -70, -52, -20, -145, -35)):
        L = rr.uniform(110, 170) if i < 7 else 80
        ang = math.radians(a)
        tx, ty = bx + math.cos(ang) * L, by + math.sin(ang) * L
        s += stroke(f"M{bx},{by} Q{n(bx + math.cos(ang) * L * .5)},{n(by + math.sin(ang) * L * .5 - 20)} {n(tx)},{n(ty)}", LEAF_D, 6)
        for k, off in enumerate((-40, 0, 40)):
            s += leaf_shape(tx, ty, 62 if off == 0 else 52, 28, a + off, [LEAF, LEAF_L, LEAF_D][(i + k) % 3], LEAF_D)
    return doc(p, W, H, G(s, p + "cut"), seed=96, sh=(4, 3.5, .3), cut={"rim": 2.6, "rough": 4, "freq": .15})


def garden_flower():
    p = "gfl-"
    s = "".join(P(wob(40 + math.cos(a) * 17, 40 + math.sin(a) * 17, 15, 11, .08, 100 + i, 12, math.degrees(a)), WHITE) for i, a in enumerate(k * 1.2566 - 1.57 for k in range(5)))
    s += C(40, 40, 11, MUSTARD) + C(37, 37, 4, SUN_L)
    return doc(p, 80, 80, G(s, p + "cut"), seed=101, sh=(2, 2, .3), cut={"rim": 2, "rough": 2})


def garden_tomato():
    p = "gto-"
    return doc(p, 140, 150, G(tomato(70, 82, 56, 111), p + "cut"), seed=112, sh=(3, 3, .3), cut={"rim": 2.4, "rough": 3.5})


def garden_strawberry():
    p = "gst-"
    return doc(p, 130, 150, G(strawberry(65, 64, 50, 113), p + "cut"), seed=114, sh=(3, 3, .3), cut={"rim": 2.4, "rough": 3.5})


CARROT_TOP = 196   # where the root meets the leaves (the soil line when it grows in the bed)


def garden_carrot():
    p = "gca-"
    s = carrot_tops(90, CARROT_TOP + 6, 180, 115, .9) + carrot_root(90, CARROT_TOP, 76, 214, 116)
    return doc(p, 180, 420, G(s, p + "cut"), seed=117, sh=(3, 3, .3), cut={"rim": 2.4, "rough": 3.5})


# ---------------------------------------------------------------- the watering can (440x320), spout tip at the left
SPOUT = (22, 92)


def watering_can():
    p = "wc-"
    s = G(stroke("M300,110 Q300,20 210,20 Q140,20 140,96", CAN_D, 22) + stroke("M300,110 Q300,34 210,34 Q154,34 152,96", CAN, 10), p + "sh")
    s += G(P("M150,122 L40,78 L22,70 L14,100 L34,106 L150,196Z", CAN_D) + P("M150,134 L42,90 L30,94 L36,100 L150,180Z", CAN), p + "cut")
    s += G(P(wob(SPOUT[0], SPOUT[1] - 6, 16, 26, .05, 121, 12, 20), CAN_D) + "".join(C(SPOUT[0] - 4 + math.cos(a) * 9, SPOUT[1] - 6 + math.sin(a) * 15, 3, CAN_L) for a in (0, 1.6, 3.2, 4.8)), p + "sh")
    s += G(P(wr(140, 96, 250, 204, 40, 1.8, 122), CAN_D) + P(wr(150, 104, 230, 188, 34, 1.6, 123), CAN), p + "cut")
    s += P(wr(162, 118, 40, 150, 18, 1, 124), CAN_L, ' opacity="0.7"')
    s += P(wr(150, 170, 230, 40, 10, 1, 125), MUSTARD, ' opacity="0.9"') + "".join(C(174 + i * 36, 190, 7, WHITE, ' opacity="0.8"') for i in range(6))
    s += P(wr(360, 118, 60, 90, 22, 1, 126), CAN_D)
    return doc(p, 440, 320, s, seed=127, sh=(4, 3.5, .3), cut={"rim": 3, "rough": 5})


# ---------------------------------------------------------------- the sky: sun and cloud
def garden_sun():
    p = "gsu-"
    s = ""
    for i in range(12):
        a = i / 12 * 2 * math.pi
        x0, y0 = 150 + math.cos(a) * 92, 150 + math.sin(a) * 92
        s += P(f"M{n(x0 + math.cos(a + 1.57) * 16)},{n(y0 + math.sin(a + 1.57) * 16)} L{n(150 + math.cos(a) * 144)},{n(150 + math.sin(a) * 144)} L{n(x0 - math.cos(a + 1.57) * 16)},{n(y0 - math.sin(a + 1.57) * 16)}Z", SUN_D if i % 2 else SUN)
    s = G(s, p + "sh") + G(C(150, 150, 96, SUN_D) + C(148, 147, 88, SUN), p + "cut")
    s += P("M92,118 Q104,78 146,70 Q112,88 104,122Z", SUN_L, ' opacity="0.9"')
    s += C(120, 150, 8, EYE) + C(180, 150, 8, EYE) + stroke("M118,176 Q150,202 182,176", EYE, 6) + C(102, 172, 11, CHEEK, ' opacity="0.5"') + C(198, 172, 11, CHEEK, ' opacity="0.5"')
    return doc(p, 300, 300, s, seed=131, sh=(3, 3, .2), cut={"rim": 3, "rough": 5})


def garden_cloud():
    p = "gcl-"
    parts = ((130, 170, 100, 72), (250, 118, 120, 96), (380, 140, 110, 86), (480, 180, 80, 60), (300, 200, 200, 60))
    s = G("".join(P(wob(x, y + 6, rx, ry, .06, 140 + i, 20), CLOUD_D) for i, (x, y, rx, ry) in enumerate(parts)), p + "cut")
    s += "".join(P(wob(x, y, rx * .94, ry * .9, .06, 150 + i, 20), CLOUD) for i, (x, y, rx, ry) in enumerate(parts))
    s += P(wob(230, 90, 60, 30, .1, 160, 14), CLOUD_L, ' opacity="0.8"') + P(wob(372, 110, 50, 24, .1, 161, 14), CLOUD_L, ' opacity="0.8"')
    return doc(p, 580, 270, s, seed=162, sh=(4, 4, .2), cut={"rim": 3, "rough": 6, "freq": .1})


# ---------------------------------------------------------------- the snail (260x190, facing left; mouth at its left end) and its leaf
SNAIL_MOUTH = (30, 150)


def garden_snail():
    p = "gsn-"
    body = P("M16,160 Q14,128 46,120 L200,130 Q248,140 250,168 Q246,182 210,182 L40,182 Q16,180 16,160Z", SNAIL_D) + P("M24,160 Q24,134 50,128 L196,138 Q236,148 238,166 Q232,174 206,174 L44,174 Q24,172 24,160Z", SNAIL)
    stalks = stroke("M50,130 Q40,80 30,56", SNAIL_D, 9) + stroke("M66,130 Q70,84 76,60", SNAIL_D, 9) + C(30, 52, 14, WHITE) + C(76, 56, 14, WHITE) + C(28, 54, 7, EYE) + C(74, 58, 7, EYE)
    smile = stroke("M26,150 Q36,158 48,152", EYE, 4) + C(56, 150, 7, CHEEK, ' opacity="0.6"')
    shell = P(wob(160, 104, 76, 70, .03, 171, 24), SHELL_D) + P(wob(158, 100, 68, 62, .03, 172, 24), SHELL)
    spiral = ""
    pts = [(158 + math.cos(t) * (4 + t * 7.2), 100 + math.sin(t) * (4 + t * 6.6)) for t in [i * .25 for i in range(0, 34)]]
    spiral = stroke(smooth_open(pts), SHELL_D, 7) + P("M110,70 Q130,44 170,42 Q138,56 124,80Z", SHELL_L, ' opacity="0.8"')
    s = G(body, p + "cut") + G(shell + spiral, p + "cut") + G(stalks, p + "sh") + smile
    return doc(p, 260, 190, s, seed=173, sh=(3, 3, .3), cut={"rim": 2.4, "rough": 3.5})


def garden_leaf():
    p = "gle-"
    pts = [(20, 150), (40, 70), (110, 22), (190, 36), (226, 90), (206, 150), (140, 172), (70, 170)]
    s = G(P(smooth(pts), LEAF_D) + P(smooth([(x * .9 + 12, y * .9 + 8) for x, y in pts]), LEAF_L), p + "cut")
    s += stroke("M34,152 Q110,110 196,56", LEAF_D, 5, ' opacity="0.7"') + "".join(stroke(f"M{x},{y} q{-10},-30 -30,-44", LEAF_D, 3, ' opacity="0.5"') + stroke(f"M{x},{y} q30,6 44,24", LEAF_D, 3, ' opacity="0.5"') for x, y in ((80, 124), (130, 96), (170, 72)))
    return doc(p, 240, 190, s, seed=181, sh=(3, 3, .3), cut={"rim": 2.4, "rough": 4})


# ---------------------------------------------------------------- the basket (440x320; front layer over what is in it)
BASKET_IN = (220, 128)   # the middle of the heap inside, where picked things land


def weave(p, y0, y1):
    s = ""
    for r_, y in enumerate(range(y0, y1, 30)):
        for i, x in enumerate(range(56, 390, 44)):
            s += P(wr(x + (22 if r_ % 2 else 0) - 6, y, 44, 26, 12, 1, 190 + r_ * 20 + i), [WOOD_L, WOOD][(i + r_) % 2])
    return s


def basket_front_shape():
    return "M40,120 L400,120 Q396,250 350,300 L90,300 Q44,250 40,120Z"


def garden_basket():
    p = "gba-"
    s = G(stroke("M60,130 Q60,-10 220,-6 Q380,-10 380,130", WALNUT, 22) + stroke("M60,130 Q62,6 220,8 Q378,6 380,130", WOOD_L, 8), p + "sh")
    s += G(P(wob(220, 124, 186, 40, .02, 201, 26), WALNUT_D), p + "cut") + P(wob(220, 128, 170, 30, .03, 202, 24), "#5A3622")
    return doc(p, 440, 320, s, "rough", seed=203, sh=(4, 3.5, .3), cut={"rim": 3, "rough": 5})


def garden_basket_front():
    p = "gbx-"
    clip = f'<clipPath id="{p}cl"><path d="{basket_front_shape()}"/></clipPath>'
    s = G(P(basket_front_shape(), WALNUT), p + "cut") + f'<g clip-path="url(#{p}cl)">{weave(p, 118, 300)}</g>'
    s += P(wr(30, 108, 380, 30, 14, 1.4, 211), WALNUT_D) + P(wr(36, 112, 368, 18, 9, 1, 212), WOOD_L, ' opacity="0.8"')
    return doc(p, 440, 320, s, "rough", seed=213, sh=(4, 3.5, .3), cut={"rim": 3, "rough": 5}, extra_defs=clip)


# ---------------------------------------------------------------- the home card (400x520)
def card_garden():
    p = "cgd-"
    L = [G(P(wr(10, 10, 380, 500, 36, 2.2, 3, step=18), CREAM), p + "cut")]
    clip = f'<clipPath id="{p}cl"><path d="{wr(34, 34, 332, 332, 26, 1.2, 4)}"/></clipPath>'
    scene = rect(20, 20, 360, 360, SKY_L) + P(wob(120, 380, 220, 140, .05, 221, 20), HILL_F) + P(wob(320, 400, 200, 130, .05, 222, 20), HILL)
    scene += G(C(300, 100, 40, SUN_D) + C(298, 98, 34, SUN), p + "sh")
    scene += rect(20, 300, 360, 80, GRASS) + P(wr(60, 272, 280, 70, 16, 1.4, 223), SOIL) + P(wr(52, 300, 296, 70, 12, 1.4, 224), WOOD)
    plant = stroke("M140,290 Q136,220 146,160", LEAF_D, 8) + leaf_shape(144, 250, 60, 20, -160, LEAF, LEAF_D) + leaf_shape(144, 236, 60, 20, -20, LEAF_L, LEAF_D) + leaf_shape(146, 190, 50, 18, -150, LEAF, LEAF_D) + leaf_shape(146, 180, 50, 18, -30, LEAF_D)
    plant += tomato(112, 214, 24, 225) + tomato(176, 200, 22, 226) + tomato(150, 150, 20, 227)
    scene += G(plant, p + "sh")
    can = (P("M270,256 L214,226 L208,244 L270,284Z", CAN_D) + P(wr(262, 234, 88, 72, 16, 1, 228), CAN_D) + P(wr(266, 238, 80, 64, 14, 1, 229), CAN)
           + stroke("M340,240 Q346,204 304,206", CAN_D, 8))
    scene += G(can, p + "sh") + "".join(E(206 - i * 10, 250 + i * 14, 4, 7, "#6FB6D8") for i in range(3))
    L.append(G(f'<g clip-path="url(#{p}cl)">{scene}</g>', p + "sh"))
    L.append(G(P(wr(130, -4, 140, 40, 3, 1.4, 6), MUSTARD, ' opacity="0.85" transform="rotate(-4 200 15)"')
               + "".join(C(146 + i * 18, 16, 4, WHITE, ' opacity="0.7" transform="rotate(-4 200 15)"') for i in range(7)), p + "sh"))
    L.append(G("".join(P(wob(x, 440, 50, 44, .04, 7 + i, 20), WHITE) for i, x in enumerate((92, 200, 308))), p + "sh"))
    L.append(G(tomato(92, 446, 26, 231) + strawberry(200, 432, 24, 232) + carrot_root(308, 418, 28, 50, 233) + carrot_tops(308, 422, 26, 234, .7), p + "sh"))
    defs = std_defs(p, "rough", seed=235, sh=(4, 3.5, .32), cut={"rim": 3, "rough": 7, "freq": .12}) + clip
    return svg(400, 520, defs, G("".join(L), p + "gr"))


ITEMS = {
    "bg-garden": bg_garden, "garden-bed": garden_bed, "garden-bed-front": garden_bed_front, "garden-hole": garden_hole,
    "garden-mound": garden_mound, "garden-seed": garden_seed,
    "seed-packet-tomato": lambda: packet("tomato"), "seed-packet-strawberry": lambda: packet("strawberry"),
    "seed-packet-carrot": lambda: packet("carrot"),
    "garden-sprout": garden_sprout, "plant-tomato-1": lambda: young("tomato"), "plant-strawberry-1": lambda: young("strawberry"),
    "plant-carrot-1": lambda: young("carrot"), "plant-tomato-2": plant_tomato, "plant-strawberry-2": plant_strawberry,
    "garden-flower": garden_flower, "garden-tomato": garden_tomato, "garden-strawberry": garden_strawberry,
    "garden-carrot": garden_carrot, "watering-can": watering_can, "garden-sun": garden_sun, "garden-cloud": garden_cloud,
    "garden-snail": garden_snail, "garden-leaf": garden_leaf, "garden-basket": garden_basket,
    "garden-basket-front": garden_basket_front, "card-garden": card_garden,
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
    print("anchors: SOIL_Y", SOIL_Y, "HOLES", HOLES, "TOMATO_FRUITS", TOMATO_FRUITS, "STRAW_FRUITS", STRAW_FRUITS,
          "CARROT_TOP", CARROT_TOP, "SPOUT", SPOUT, "SNAIL_MOUTH", SNAIL_MOUTH, "BASKET_IN", BASKET_IN)
