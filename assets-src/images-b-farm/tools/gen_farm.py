# images-b-farm (Mom's farm, a stage that is not cooking: look after the farm animals; research/farm-spec.md).
# Style B paper cut-out on the shared kit (images-b/tools/pb.py, READ-ONLY) and Pipa's eye drawings (gen_pippa.py) and
# the guests' soft mouths (gen_guests.py). Writes into images-b-farm/ only.
# Run: python tools/gen_farm.py [names...]   then copy the SVGs into public/assets/images and bake the WebPs.
#
# The animals (horse, cow, sheep, pig) are stacks of layers on one 800x700 frame, like Pipa and the guests (the game's
# Character class drives them): body, eyes open / blink / happy / surprised, mouth closed / open / chew. They face LEFT
# (their heads on the left, toward the tools), feet on y 684. Things on them (the sheep's fleece bands, the pig's mud,
# the horse's shine) are drawn in the same frame coordinates with a viewBox cut to their own box, so the game places
# each at its box's centre in the frame (printed at the end = ART.farm in src/core/assets.ts).
import sys, os, math, random
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
OUTDIR = os.path.normpath(os.path.join(HERE, ".."))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "images-b", "tools")))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "images-b-guests", "tools")))
from pb import *  # noqa: F401,F403
import pb
from gen_pippa import round_eye, arc_band  # noqa: E402
from gen_guests import soft_mouth  # noqa: E402

W, H = 800, 700
FEET = 684

SKY = "#C4DCDA"; SKY_L = "#DCEBE6"
HILL = "#A9C090"; HILL_F = "#BFD3A6"; HILL_D = "#8CA776"
GRASS = "#8FBF62"; GRASS_D = "#6E9E48"; GRASS_L = "#A9D17E"
BARN = "#C9563C"; BARN_D = "#A23E2A"; BARN_L = "#E07A5C"
STRAW = "#EFCB6A"; STRAW_D = "#D2A445"; STRAW_L = "#F8E19C"
MUD = "#7A5034"; MUD_D = "#5E3A24"; MUD_L = "#966443"
MILK = "#FFFDF7"; MILK_D = "#EDE6D8"
WOOL = "#FFFBF2"; WOOL_D = "#E8DCC8"; WOOL_L = "#FFFFFF"
SUN = "#FFD152"; SUN_D = "#F2A93B"
CARROT = "#F28A2E"; CARROT_D = "#CF6A1A"; CARROT_L = "#FFAE5C"
APPLE = "#E5483A"; APPLE_D = "#B8302A"; APPLE_L = "#F57A68"
LEAF = GREEN; LEAF_D = GREEN_D; LEAF_L = GREEN_L
RIBBON = {"red": ("#E0503A", "#B83A28", "#F48A6E"), "blue": ("#5B8FD6", "#3F6FB2", "#9CC0EE"), "yellow": ("#F5C542", "#D59C1A", "#FFE28E")}

HORSE = dict(coat="#B5764A", d="#8E5733", l="#CF9566", mane="#5A3A2A", mane_l="#7A5038", muzzle="#E7BC92", muzzle_d="#C8946A",
             hoof="#4A3328", mouth="#6E2E26", tongue="#EE7A70", brow="#5A3A2A", ear_in="#E7A28E")
COW = dict(coat="#FBF6EC", d="#E3D9C6", l="#FFFFFF", spot="#4A3C36", spot_l="#62514A", muzzle="#F5B9B2", muzzle_d="#E08F88",
           horn="#F2E2BE", horn_d="#D4BD8E", hoof="#4A3C36", udder="#F5B0AA", udder_d="#E08F88", mouth="#6E2E26",
           tongue="#EE7A70", brow="#4A3C36", ear_in="#F3A6A0")
SHEEP = dict(coat="#F2D9C8", d="#DDB9A4", l="#FBEADF", face="#F6E5D3", face_d="#E2C6AE", leg="#5A463E", mouth="#6E2E26",
             tongue="#EE7A70", brow="#8E6E5C", ear_in="#F3A6A0")
PIG = dict(coat="#F5ABA6", d="#E08680", l="#FBCBC4", snout="#EE8F8E", snout_d="#C9666A", nost="#9E4650", mouth="#6E2E26",
           tongue="#E25E6A", brow="#C9666A", ear_in="#E8807E")
HEN = {"white": dict(body="#FFF8EE", d="#E6DACA", l="#FFFFFF", wing="#F1E6D6"),
       "brown": dict(body="#C4703E", d="#9E522A", l="#DC915E", wing="#A85A30")}
COMB = "#E2483A"; COMB_D = "#B8302A"; BEAK = "#F4A23C"; BEAK_D = "#D87F22"


def wr(x, y, w, h, rad, j=1.5, seed=1, step=40):
    return pb.wrect(x, y, w, h, rad, j, seed, step)


def rect(x, y, w, h, fill, extra=""):
    return f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}" fill="{fill}"{extra}/>'


def doc(p, w, h, body, material="default", seed=3, sh=(4, 3.5, .33), cut=None, extra_defs="", vb=None):
    s = svg(w, h, std_defs(p, material, seed, sh, (8, 7, .28), cut) + extra_defs, G(body, p + "gr"))
    if vb:  # a box cut out of a bigger frame: draw in the frame's coordinates
        s = s.replace(f'viewBox="0 0 {w} {h}"', f'viewBox="{n(vb[0])} {n(vb[1])} {w} {h}"', 1)
    return s


def poly(pts):
    return "M" + " L".join(f"{n(x)},{n(y)}" for x, y in pts) + "Z"


# ---------------------------------------------------------------- shared small things
def carrot(cx, top, w, h, seed=1):
    pts = [(cx - w / 2, top + 6), (cx - w * .42, top + h * .35), (cx - w * .2, top + h * .78), (cx, top + h),
           (cx + w * .2, top + h * .78), (cx + w * .42, top + h * .35), (cx + w / 2, top + 6), (cx, top - 4)]
    s = P(smooth(pts), CARROT_D) + P(smooth([(x * .88 + cx * .12, y) for x, y in pts]), CARROT)
    for i in range(4):
        y = top + h * (.2 + i * .16)
        hw = w * (.34 - i * .06)
        s += stroke(f"M{n(cx - hw)},{n(y)} q{n(hw * .5)},4 {n(hw * .8)},1", CARROT_D, 2.6, ' opacity="0.7"')
    s += P(f"M{n(cx - w * .3)},{n(top + 12)} Q{n(cx - w * .28)},{n(top + h * .5)} {n(cx - w * .08)},{n(top + h * .8)} Q{n(cx - w * .18)},{n(top + h * .4)} {n(cx - w * .16)},{n(top + 12)}Z", CARROT_L, ' opacity="0.8"')
    rr = random.Random(seed)
    for i, a in enumerate((-30, -10, 10, 30)):
        a = math.radians(a + rr.uniform(-4, 4))
        L = w * 1.1
        tx, ty = cx + math.sin(a) * L, top - math.cos(a) * L
        s += stroke(f"M{n(cx)},{n(top)} Q{n(cx + math.sin(a) * L * .4)},{n(top - L * .55)} {n(tx)},{n(ty)}", LEAF_D if i % 2 else LEAF, 8)
        s += P(wob(tx, ty, 12, 16, .1, seed + i, 10, math.degrees(a)), LEAF_L if i % 2 == 0 else LEAF)
    return s


def apple(cx, cy, r, seed=1):
    s = P(wob(cx, cy, r, r * .92, .03, seed, 22), APPLE_D) + P(wob(cx - r * .04, cy - r * .04, r * .9, r * .82, .03, seed + 1, 22), APPLE)
    s += P(f"M{n(cx - r * .6)},{n(cy - r * .1)} Q{n(cx - r * .55)},{n(cy - r * .58)} {n(cx - r * .14)},{n(cy - r * .66)} Q{n(cx - r * .42)},{n(cy - r * .42)} {n(cx - r * .48)},{n(cy - r * .05)}Z", APPLE_L, ' opacity="0.9"')
    s += stroke(f"M{n(cx)},{n(cy - r * .7)} Q{n(cx + 4)},{n(cy - r * 1.05)} {n(cx + 12)},{n(cy - r * 1.18)}", WALNUT_D, 8)
    s += P(wob(cx + r * .38, cy - r * .98, r * .3, r * .14, .08, seed + 3, 12, -25), LEAF)
    return s


def corn(cx, cy, w, h, seed=1):
    s = P(wob(cx, cy, w / 2, h / 2, .03, seed, 22), CORN_D) + P(wob(cx, cy - 4, w / 2 - 6, h / 2 - 8, .03, seed + 1, 22), CORN)
    for row in range(-5, 6):
        for col in (-1, 0, 1):
            x = cx + col * w * .24
            y = cy + row * h * .075
            if (x - cx) ** 2 / (w / 2 - 10) ** 2 + (y - cy) ** 2 / (h / 2 - 12) ** 2 < 1:
                s += E(x, y, w * .1, h * .03, CORN_L, ' opacity="0.85"')
    for sgn in (-1, 1):
        s += P(f"M{n(cx)},{n(cy + h * .5)} Q{n(cx + sgn * w * .7)},{n(cy + h * .1)} {n(cx + sgn * w * .45)},{n(cy - h * .3)} Q{n(cx + sgn * w * .3)},{n(cy + h * .1)} {n(cx + sgn * 8)},{n(cy + h * .5)}Z", LEAF if sgn < 0 else LEAF_D)
    return s


def egg(cx, cy, s, col, col_d, seed=1):
    d = P(wob(cx, cy, 34 * s, 44 * s, .02, seed, 22), col_d) + P(wob(cx - 2 * s, cy - 2 * s, 31 * s, 41 * s, .02, seed + 1, 22), col)
    d += E(cx - 12 * s, cy - 16 * s, 9 * s, 14 * s, WHITE, ' opacity="0.55"')
    return d


EGG_COL = {"white": ("#FFF9EE", "#E3D6BF"), "brown": ("#D9945A", "#B8733E")}


def fluff(cx, cy, rx, ry, seed, col, k=14, j=.12):
    """A woolly outline: bumps round an ellipse."""
    rr = random.Random(seed)
    pts = []
    for i in range(k * 2):
        a = i / (k * 2) * 2 * math.pi
        f = 1.0 if i % 2 == 0 else 1 - j - rr.uniform(0, .05)
        pts.append((cx + math.cos(a) * rx * f, cy + math.sin(a) * ry * f))
    return P(smooth(pts, 1 / 4), col)


# ---------------------------------------------------------------- eyes and mouths (Pipa's, placed per animal)
def eyes(g, kind, name, mid):
    p = f"fa{name[:2]}-e{kind[0]}-"
    L = []
    for cx in g["xs"]:
        sgn = -1 if cx < mid else 1
        ey, rx, ry = g["y"], g["rx"], g["ry"]
        s = rx / 38
        if kind == "open":
            L.append(G(round_eye(p, cx, ey, rx, ry), p + "sh"))
        elif kind == "surprised":
            L.append(G(round_eye(p, cx, ey - 4, rx * 1.16, ry * 1.13, True), p + "sh"))
            bx, by = cx + sgn * 4, ey - ry * 1.85
            L.append(G(P(arc_band(bx, by, 50 * s, 9, 11, True), g["brow"], f' transform="rotate({-sgn * 8} {bx} {by})"'), p + "sh"))
        elif kind == "blink":
            L.append(G(P(arc_band(cx, ey + 14 * s, 70 * s, 12 * s, 13, False), EYE), p + "sh"))
        elif kind == "happy":
            L.append(G(P(arc_band(cx, ey + 18 * s, 76 * s, 20 * s, 15, True), EYE), p + "sh"))
    return std_defs(p, "smooth", 41 + len(kind) + len(name), sh=(3, 2.5, .3)), G("".join(L), p + "gr")


# ---------------------------------------------------------------- the horse
H_EYES = dict(xs=(146, 214), y=222, rx=22, ry=26, brow=HORSE["brow"])
H_MOUTH = dict(x=178, y=356, s=.5, cheek_dx=96, face=HORSE["muzzle"])
H_ZONES = ((282, 300), (460, 330), (612, 392))   # mane / neck, back, hip (where the brush works, in turn on hard)


def leg(x, top, w, col, hoof, seed, bot=FEET - 4):
    return P(wr(x - w / 2, top, w, bot - top - 26, w * .4, 1.2, seed), col) + P(wr(x - w / 2 - 3, bot - 34, w + 6, 34, 10, 1, seed + 1), hoof)


def horse_body():
    c, p = HORSE, "fho-bd-"
    L = [G(E(450, 680, 300, 14, SH, ' opacity="0.35"'), p + "bl")]
    # tail
    L.append(G(P("M690,318 C770,330 790,450 760,600 C740,560 712,470 678,380Z", c["mane"]) + P("M700,340 C752,370 760,450 748,540 C730,480 714,420 690,370Z", c["mane_l"], ' opacity="0.7"'), p + "sh"))
    L.append(G(leg(334, 430, 46, c["d"], c["hoof"], 3) + leg(594, 430, 46, c["d"], c["hoof"], 5), p + "sh"))
    L.append(G(P(wob(468, 384, 236, 124, .03, 7, 24), c["coat"]), p + "cut"))
    L.append(P(wob(450, 340, 170, 60, .05, 8, 18), c["l"], ' opacity="0.5"'))
    L.append(G(leg(392, 440, 50, c["coat"], c["hoof"], 9) + leg(648, 440, 50, c["coat"], c["hoof"], 11), p + "sh"))
    # neck and head
    neck = smooth([(232, 150), (300, 230), (372, 318), (360, 432), (268, 398), (170, 250)], 1 / 5)
    L.append(G(P(neck, c["coat"]), p + "cut"))
    L.append(G(P(wob(184, 236, 86, 116, .02, 12, 22, -8), c["coat"]), p + "cut"))
    for sgn, ex in ((-1, 138), (1, 224)):
        L.append(G(P(f"M{ex - 26},{140} Q{ex + sgn * 6},{70} {ex + sgn * 10},{60} Q{ex + 22},{110} {ex + 22},{140}Z", c["coat"]) + P(f"M{ex - 14},{132} Q{ex + sgn * 4},{86} {ex + sgn * 8},{80} Q{ex + 12},{112} {ex + 12},{132}Z", c["ear_in"]), p + "sh"))
    # mane along the neck, and the forelock
    mane = ""
    for i in range(7):
        t = i / 6
        x, y = 236 + 120 * t, 150 + 160 * t
        mane += P(wob(x + 16, y - 6, 34, 26, .12, 20 + i, 12, 50), c["mane"] if i % 2 else c["mane_l"])
    mane += P(wob(182, 136, 40, 30, .12, 30, 12, -10), c["mane"]) + P(wob(160, 146, 26, 22, .12, 31, 10), c["mane_l"])
    L.append(G(mane, p + "sh"))
    L.append(P(wr(172, 168, 24, 120, 12, 1, 33), WHITE, ' opacity="0.9"'))   # the blaze
    L.append(G(P(wob(178, 318, 78, 60, .03, 34, 20), c["muzzle"]), p + "sh"))
    L.append(E(146, 312, 11, 8, c["muzzle_d"]) + E(210, 312, 11, 8, c["muzzle_d"]))
    defs = std_defs(p, "smooth", 61, sh=(5, 4, .33), blur=4)
    return svg(W, H, defs, G("".join(L), p + "gr"))


def horse_shine():
    """Glossy streaks over the coat: they show as she brushes (frame coordinates, cut to their box)."""
    p = "fhs-"
    s = ""
    for (x, y), a in zip(H_ZONES, (50, 0, 20)):
        for i in range(3):
            s += P(wob(x - 30 + i * 30, y - 10 + i * 12, 48, 9, .1, 40 + i + x, 12, a - 10), WHITE, ' opacity="0.55"')
        s += C(x + 40, y - 30, 7, WHITE, ' opacity="0.8"') + C(x - 50, y + 12, 5, WHITE, ' opacity="0.7"')
    return doc(p, 470, 220, s, "smooth", seed=71, vb=(200, 250))


def horse_teeth():
    """The horse's mouth close up (520): lips round a row of four big teeth (where the smudges sit, TEETH)."""
    p = "fht-"
    c = HORSE
    s = G(C(260, 260, 250, c["muzzle"]), p + "cut")
    s += P(wob(260, 300, 200, 150, .03, 3, 22), c["mouth"])
    s += E(260, 370, 120, 60, c["tongue"])
    for i, x in enumerate((138, 218, 302, 382)):
        s += G(P(wr(x - 38, 168, 76, 110, 18, 1.4, 10 + i), WHITE) + P(wr(x - 30, 176, 26, 60, 10, 1, 20 + i), "#FFFFFF", ' opacity="0.6"'), p + "sh")
    s += P(f"M70,190 Q260,120 450,190 Q260,150 70,190Z", c["muzzle_d"])
    s += P(f"M90,420 Q260,470 430,420 Q260,440 90,420Z", c["muzzle_d"], ' opacity="0.8"')
    return doc(p, 520, 520, s, "smooth", seed=73, cut={"rim": 3, "rough": 4})


TEETH = ((138, 222), (218, 230), (302, 230), (382, 222), (178, 250), (342, 250))


def smudge():
    p = "fsm-"
    s = P(wob(50, 40, 40, 30, .12, 3, 14), "#C9A24E", ' opacity="0.9"') + P(wob(40, 34, 18, 12, .2, 4, 10), "#E0BE6A", ' opacity="0.8"')
    s += C(70, 52, 6, "#A88236") + C(30, 56, 4, "#A88236")
    return doc(p, 100, 80, s, "smooth", seed=75)


# ---------------------------------------------------------------- the cow
C_EYES = dict(xs=(150, 230), y=236, rx=22, ry=26, brow=COW["brow"])
C_MOUTH = dict(x=190, y=360, s=.55, cheek_dx=96, face=COW["muzzle"])
TEATS = ((488, 590), (552, 590))
COLLAR = (296, 370)
BELL_AT = (302, 430)


def cow_body():
    c, p = COW, "fco-bd-"
    L = [G(E(460, 680, 300, 14, SH, ' opacity="0.35"'), p + "bl")]
    L.append(G(stroke("M700,330 Q752,420 740,560", c["d"], 14) + P(wob(740, 574, 18, 30, .1, 2, 12), c["spot"]), p + "sh"))
    L.append(G(leg(334, 440, 50, c["d"], c["hoof"], 3) + leg(606, 440, 50, c["d"], c["hoof"], 5), p + "sh"))
    body = wob(470, 390, 240, 132, .03, 7, 24)
    L.append(G(P(body, c["coat"]), p + "cut"))
    clip = f'<clipPath id="{p}cl"><path d="{body}"/></clipPath>'
    spots = P(wob(400, 330, 90, 60, .12, 8, 14, 10), c["spot"]) + P(wob(610, 420, 80, 70, .12, 9, 14), c["spot"]) + P(wob(530, 290, 50, 36, .14, 10, 12), c["spot"])
    L.append(f'<g clip-path="url(#{p}cl)">{spots}</g>')
    # the udder and its two teats
    L.append(G(P(wob(520, 520, 76, 44, .04, 12, 18), c["udder"]) + "".join(P(wr(x - 15, 540, 30, 54, 14, 1, 13 + i), c["udder_d"]) for i, (x, _) in enumerate(TEATS)), p + "sh"))
    L.append(G(leg(392, 450, 54, c["coat"], c["hoof"], 9) + leg(660, 450, 54, c["coat"], c["hoof"], 11), p + "sh"))
    # neck, collar, head, ears, horns
    L.append(G(P(smooth([(230, 250), (330, 270), (380, 360), (350, 452), (260, 420), (200, 330)], 1 / 5), c["coat"]), p + "cut"))
    L.append(G(stroke(f"M{COLLAR[0] + 30},{COLLAR[1] - 96} Q{COLLAR[0] + 26},{COLLAR[1] - 20} {COLLAR[0] + 6},{COLLAR[1] + 58}", RED, 26), p + "sh"))
    for sgn, ex in ((-1, 92), (1, 292)):
        L.append(G(P(wob(ex, 212, 50, 24, .05, 20 + sgn, 16, sgn * -14), c["coat"]) + P(wob(ex, 214, 32, 13, .05, 22 + sgn, 14, sgn * -14), c["ear_in"]), p + "sh"))
        hx = 192 + sgn * 62
        L.append(G(P(f"M{hx - 16},{176} Q{hx + sgn * 10},{120} {hx + sgn * 34},{112} Q{hx + sgn * 20},{140} {hx + 16},{180}Z", c["horn"]), p + "sh"))
    L.append(G(P(wob(190, 262, 100, 104, .02, 24, 22), c["coat"]), p + "cut"))
    L.append(P(wob(226, 214, 46, 34, .12, 25, 12), c["spot"]))
    L.append(G(P(wob(190, 330, 92, 62, .03, 26, 20), c["muzzle"]), p + "sh"))
    L.append(E(154, 322, 12, 9, c["muzzle_d"]) + E(226, 322, 12, 9, c["muzzle_d"]))
    defs = std_defs(p, "smooth", 63, sh=(5, 4, .33), blur=4) + clip
    return svg(W, H, defs, G("".join(L), p + "gr"))


def cow_bell():
    """140x160: hangs from (70, 18) (the collar's loop)."""
    p = "fcb-"
    s = G(stroke("M52,24 Q70,0 88,24", METAL_D, 9), p + "sh")
    s += G(P("M36,40 Q70,22 104,40 L118,128 Q70,146 22,128Z", MUSTARD) + P("M46,48 Q70,36 92,48 L100,118 Q70,128 42,118Z", "#F8D06A", ' opacity="0.7"'), p + "cut")
    s += C(70, 138, 13, CORN_D)
    return doc(p, 140, 160, s, "rough", seed=77)


def trough():
    """360x170: a wooden trough on the ground; its inside (where the hay or the food lies) at TROUGH_IN."""
    p = "ftr-"
    s = G(P("M20,40 L340,40 L316,150 L44,150Z", WOOD_D), p + "cut")
    s += P("M36,48 L324,48 L304,138 L56,138Z", WOOD) + "".join(stroke(f"M{40 + i * 2},{70 + i * 24} L{320 - i * 2},{70 + i * 24}", WOOD_D, 3, ' opacity="0.5"') for i in range(3))
    s += G(P(wr(10, 26, 340, 26, 10, 1.2, 4), WALNUT), p + "sh")
    return doc(p, 360, 170, s, "rough", seed=79, cut={"rim": 3, "rough": 5})


TROUGH_IN = (180, 40)


def hay(cx, cy, w, h, seed):
    s = P(wob(cx, cy, w / 2, h / 2, .06, seed, 18), STRAW_D) + P(wob(cx - 4, cy - 4, w / 2 - 8, h / 2 - 8, .06, seed + 1, 18), STRAW)
    rr = random.Random(seed)
    for i in range(18):
        x = cx + rr.uniform(-.45, .45) * w
        y = cy + rr.uniform(-.38, .38) * h
        a = rr.uniform(-40, 40)
        s += stroke(f"M{n(x - 16)},{n(y)} L{n(x + 16)},{n(y + a / 6)}", STRAW_L if i % 2 else STRAW_D, 3)
    return s


def hay_bale():
    p = "fhb-"
    s = G(P(wr(20, 50, 200, 130, 22, 2, 3), STRAW_D) + P(wr(26, 52, 188, 118, 20, 2, 4), STRAW), p + "cut")
    rr = random.Random(5)
    for i in range(26):
        x, y = rr.uniform(34, 206), rr.uniform(62, 166)
        s += stroke(f"M{n(x - 14)},{n(y)} L{n(x + 14)},{n(y + rr.uniform(-5, 5))}", STRAW_L if i % 2 else STRAW_D, 3)
    s += G(rect(70, 46, 12, 138, RED) + rect(158, 46, 12, 138, RED), p + "sh")
    return doc(p, 240, 220, s, "rough", seed=81, cut={"rim": 3, "rough": 5})


def hay_pile():
    p = "fhp-"
    return doc(p, 280, 140, hay(140, 80, 250, 100, 7), "rough", seed=83)


def milk_bucket(full):
    """260x260 metal bucket, the milk's surface at (130, 86); `full` = with milk (the game crops it to fill it up)."""
    p = "fmb-" if not full else "fmf-"
    s = G(stroke("M42,92 Q130,-12 218,92", METAL_D, 9), p + "sh")
    s += G(P("M30,86 L230,86 L206,240 L54,240Z", METAL_D) + P("M40,92 L220,92 L198,232 L62,232Z", METAL), p + "cut")
    s += rect(52, 130, 158, 10, METAL_D, ' opacity="0.5"') + rect(58, 190, 146, 10, METAL_D, ' opacity="0.5"')
    s += P("M54,104 L72,104 L84,226 L70,226Z", METAL_L, ' opacity="0.6"')
    s += E(130, 88, 102, 18, METAL_D)
    if full:
        s += E(130, 90, 92, 13, MILK) + E(108, 88, 30, 5, WHITE)
    else:
        s += E(130, 90, 92, 13, "#5F6966")
    return doc(p, 260, 260, s, "rough", seed=85 + full, cut={"rim": 3, "rough": 4})


def milk_bottle(full):
    """140x260: a glass bottle with a red cap; `full` = white milk inside (cropped from the bottom up as it fills)."""
    p = "fbf-" if full else "fbe-"
    glass = "M48,28 L92,28 L92,70 Q120,92 120,128 L120,234 Q120,248 106,248 L34,248 Q20,248 20,234 L20,128 Q20,92 48,70Z"
    s = G(P(glass, "#CFE6EA", ' opacity="0.75"'), p + "cut")
    if full:
        s += P("M30,120 Q70,112 110,120 L110,232 Q110,240 100,240 L40,240 Q30,240 30,232Z", MILK) + P("M36,130 L48,130 L48,230 L36,230Z", WHITE, ' opacity="0.7"')
    s += P("M30,96 L42,96 L42,232 L30,232Z", WHITE, ' opacity="0.5"')
    s += G(P(wr(42, 12, 56, 26, 8, 1, 3), RED) + rect(42, 30, 56, 6, RED_D), p + "sh")
    return doc(p, 140, 260, s, "smooth", seed=87 + full)


# ---------------------------------------------------------------- the sheep
S_EYES = dict(xs=(166, 232), y=244, rx=21, ry=25, brow=SHEEP["brow"])
S_MOUTH = dict(x=200, y=330, s=.5, cheek_dx=96, face=SHEEP["face"])
FLEECE = (250, 210, 730, 560)   # the fleece's box in the frame (bands are vertical strips of it)
RIBBON_AT = (282, 352)


def sheep_body():
    c, p = SHEEP, "fsh-bd-"
    L = [G(E(470, 680, 260, 14, SH, ' opacity="0.35"'), p + "bl")]
    L.append(G(leg(360, 460, 32, c["leg"], EYE, 3) + leg(590, 460, 32, c["leg"], EYE, 5), p + "sh"))
    L.append(G(P(wob(484, 392, 200, 110, .03, 7, 24), c["coat"]), p + "cut"))
    L.append(P(wob(480, 350, 150, 44, .05, 8, 18), c["l"], ' opacity="0.6"'))
    L.append(G(C(690, 360, 22, c["coat"]), p + "sh"))
    L.append(G(leg(410, 466, 34, c["leg"], EYE, 9) + leg(640, 466, 34, c["leg"], EYE, 11), p + "sh"))
    L.append(G(P(smooth([(220, 240), (320, 290), (350, 380), (300, 440), (230, 380)], 1 / 5), c["coat"]), p + "cut"))
    for sgn, ex in ((-1, 110), (1, 292)):
        L.append(G(P(wob(ex, 250, 48, 20, .05, 20 + sgn, 16, sgn * -20), c["face"]) + P(wob(ex, 252, 30, 10, .05, 22 + sgn, 14, sgn * -20), c["ear_in"]), p + "sh"))
    L.append(G(P(wob(200, 270, 80, 94, .02, 24, 22), c["face"]), p + "cut"))
    # the woolly top of her head stays (only her body is sheared)
    L.append(G(fluff(200, 186, 76, 42, 25, WOOL, 9) + fluff(196, 180, 52, 26, 26, WOOL_L, 7), p + "sh"))
    L.append(E(184, 300, 8, 6, c["face_d"]) + E(216, 300, 8, 6, c["face_d"]))
    defs = std_defs(p, "smooth", 65, sh=(5, 4, .33), blur=4)
    return svg(W, H, defs, G("".join(L), p + "gr"))


def fleece_shape():
    x0, y0, x1, y1 = FLEECE
    cx, cy = (x0 + x1) / 2 + 6, (y0 + y1) / 2 + 6
    return cx, cy, (x1 - x0) / 2, (y1 - y0) / 2


def fleece_band(i, nb):
    """Band i of nb vertical strips of her fleece: x from bx0 to bx1."""
    p = f"ffl{nb}{i}-"
    x0, y0, x1, y1 = FLEECE
    bx0 = x0 + (x1 - x0) * i / nb
    bx1 = x0 + (x1 - x0) * (i + 1) / nb
    cx, cy, rx, ry = fleece_shape()
    clip = f'<clipPath id="{p}cl"><rect x="{n(bx0 - (2 if i else 30))}" y="{y0 - 30}" width="{n(bx1 - bx0 + (2 if i else 30) + (30 if i == nb - 1 else 2))}" height="{y1 - y0 + 60}"/></clipPath>'
    wool = fluff(cx, cy, rx, ry, 31, WOOL_D, 18, .1) + fluff(cx - 6, cy - 8, rx - 10, ry - 12, 32, WOOL, 18, .1)
    rr = random.Random(33)
    for j in range(40):
        x, y = rr.uniform(x0 + 30, x1 - 30), rr.uniform(y0 + 30, y1 - 40)
        if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < .8:
            wool += stroke(f"M{n(x - 12)},{n(y + 4)} Q{n(x)},{n(y - 12)} {n(x + 12)},{n(y + 4)}", WOOL_D, 4, ' opacity="0.8"')
    s = f'<g clip-path="url(#{p}cl)">{wool}</g>'
    bw = bx1 - bx0 + (30 if i == 0 else 4) + (30 if i == nb - 1 else 4)
    return doc(p, int(math.ceil(bw)), y1 - y0 + 40, s, "smooth", seed=90 + i, extra_defs=clip,
               vb=(bx0 - (30 if i == 0 else 4), y0 - 20))


def fleece_boxes(nb):
    x0, y0, x1, y1 = FLEECE
    out = []
    for i in range(nb):
        bx0 = x0 + (x1 - x0) * i / nb
        bx1 = x0 + (x1 - x0) * (i + 1) / nb
        l = bx0 - (30 if i == 0 else 4)
        w = int(math.ceil(bx1 - bx0 + (30 if i == 0 else 4) + (30 if i == nb - 1 else 4)))
        out.append((round(l + w / 2), round(y0 - 20 + (y1 - y0 + 40) / 2), w, y1 - y0 + 40))
    return out


def wool_curl():
    p = "fwc-"
    return doc(p, 140, 110, fluff(70, 56, 56, 40, 41, WOOL_D, 8) + fluff(66, 52, 46, 32, 42, WOOL, 8), "smooth", seed=95)


def wool_pile():
    p = "fwp-"
    s = ""
    for i, (x, y, r) in enumerate(((90, 120, 60), (170, 110, 66), (250, 124, 56), (130, 76, 50), (210, 70, 52))):
        s += fluff(x, y, r, r * .74, 50 + i, WOOL_D, 9) + fluff(x - 4, y - 4, r * .84, r * .62, 60 + i, WOOL, 9)
    return doc(p, 340, 180, s, "smooth", seed=97)


def yarn_ball():
    p = "fyb-"
    s = G(C(120, 124, 96, WOOL_D) + C(116, 120, 90, WOOL), p + "cut")
    for i, (r0, a0) in enumerate(((80, 200), (70, 230), (60, 260), (80, 20), (66, 50), (52, 80))):
        a = math.radians(a0)
        x0, y0 = 120 + r0 * math.cos(a), 124 + r0 * math.sin(a)
        x1, y1 = 120 + r0 * math.cos(a + 2.4), 124 + r0 * math.sin(a + 2.4)
        cx, cy = 120 + 30 * math.cos(a + 1.2), 124 + 30 * math.sin(a + 1.2)
        s += stroke(f"M{n(x0)},{n(y0)} Q{n(cx)},{n(cy)} {n(x1)},{n(y1)}", WOOL_D, 5)
    s += stroke("M196,170 Q230,200 214,230", WOOL_D, 6)
    return doc(p, 240, 240, s, "smooth", seed=99, cut={"rim": 3, "rough": 4})


def ribbon(col):
    """200x150: a bow, its knot at (100, 70)."""
    p = f"frb{col[0]}-"
    c, d, l = RIBBON[col]
    s = G(P("M92,74 L60,140 L84,134 L96,148 L104,80Z", d) + P("M108,74 L140,140 L116,134 L104,148 L96,80Z", d), p + "sh")
    s += G(P("M100,70 Q40,10 18,50 Q10,96 100,78Z", c) + P("M100,70 Q160,10 182,50 Q190,96 100,78Z", c), p + "cut")
    s += P("M90,66 Q50,34 34,56 Q40,72 90,72Z", l, ' opacity="0.6"') + G(P(wob(100, 72, 20, 18, .05, 3, 12), d), p + "sh")
    return doc(p, 200, 150, s, "smooth", seed=101 + len(col))


# ---------------------------------------------------------------- the pig
P_EYES = dict(xs=(168, 246), y=268, rx=21, ry=25, brow=PIG["brow"])
P_MOUTH = dict(x=206, y=394, s=.48, cheek_dx=96, face=PIG["coat"])
MUD_SPOTS = ((330, 360, 150, 110), (468, 316, 160, 100), (600, 400, 150, 120), (430, 470, 170, 100), (640, 470, 120, 90))


def pig_body():
    c, p = PIG, "fpi-bd-"
    L = [G(E(470, 680, 270, 14, SH, ' opacity="0.35"'), p + "bl")]
    L.append(G(stroke("M690,360 q40,-20 34,10 q-6,26 -30,10 q-18,-14 6,-30", c["d"], 10), p + "sh"))
    L.append(G(leg(370, 500, 50, c["d"], c["snout_d"], 3) + leg(600, 500, 50, c["d"], c["snout_d"], 5), p + "sh"))
    L.append(G(P(wob(476, 420, 226, 130, .03, 7, 24), c["coat"]), p + "cut"))
    L.append(P(wob(470, 370, 160, 50, .05, 8, 18), c["l"], ' opacity="0.6"'))
    L.append(G(leg(420, 510, 54, c["coat"], c["snout_d"], 9) + leg(650, 510, 54, c["coat"], c["snout_d"], 11), p + "sh"))
    for sgn, ex in ((-1, 150), (1, 266)):
        L.append(G(P(f"M{ex - 40},{214} Q{ex + sgn * 30},{140} {ex + sgn * 46},{150} Q{ex + sgn * 40},{210} {ex + 40},{224}Z", c["coat"]) + P(f"M{ex - 24},{210} Q{ex + sgn * 24},{162} {ex + sgn * 36},{168} Q{ex + sgn * 30},{206} {ex + 24},{216}Z", c["ear_in"]), p + "sh"))
    L.append(G(P(wob(208, 300, 110, 102, .02, 24, 22), c["coat"]), p + "cut"))
    L.append(G(P(wob(206, 346, 56, 40, .03, 25, 18), c["snout"]) + E(190, 346, 9, 13, c["nost"]) + E(222, 346, 9, 13, c["nost"]), p + "sh"))
    L.append(E(140, 330, 22, 14, CHEEK, ' opacity="0.6"') + E(274, 330, 22, 14, CHEEK, ' opacity="0.6"'))
    defs = std_defs(p, "smooth", 67, sh=(5, 4, .33), blur=4)
    return svg(W, H, defs, G("".join(L), p + "gr"))


def mud_patch(i):
    x, y, w, h = MUD_SPOTS[i]
    p = f"fmd{i}-"
    s = P(wob(x, y, w / 2 - 8, h / 2 - 8, .14, 70 + i, 16), MUD) + P(wob(x - 10, y - 8, w / 2 - 26, h / 2 - 24, .2, 80 + i, 12), MUD_L, ' opacity="0.7"')
    rr = random.Random(90 + i)
    for j in range(4):
        s += C(x + rr.uniform(-.5, .5) * w, y + rr.uniform(-.5, .5) * h, rr.uniform(6, 12), MUD_D)
    return doc(p, w + 16, h + 16, s, "smooth", seed=110 + i, vb=(x - w / 2 - 8, y - h / 2 - 8))


# ---------------------------------------------------------------- the hens, the nest, eggs, the chick
def hen(col, up):
    """300x(260 sitting | 320 standing): a hen facing left; her beak at (54, 112)."""
    c, p = HEN[col], f"fhn{col[0]}{int(up)}-"
    h = 320 if up else 260
    L = []
    if up:
        for x in (130, 170):
            L.append(G(stroke(f"M{x},230 L{x - 6},300", BEAK_D, 8) + stroke(f"M{x - 24},302 L{x + 12},302", BEAK_D, 7), p + "sh"))
    by = 160
    L.append(G(P("M220,120 Q300,40 288,150 Q270,90 236,150Z", c["d"]) + P("M210,130 Q280,70 270,170 Q250,120 226,160Z", c["body"]), p + "sh"))
    L.append(G(P(wob(160, by + 20, 112, 82, .03, 3, 22), c["body"]), p + "cut"))
    L.append(P(wob(176, by + 26, 64, 40, .06, 4, 16, -10), c["wing"]))
    L.append(stroke(f"M130,{by + 30} Q170,{by + 56} 220,{by + 34}", c["d"], 4, ' opacity="0.6"'))
    L.append(G(P(wob(92, 104, 52, 54, .03, 5, 18), c["body"]), p + "cut"))
    L.append(G(P("M70,58 Q74,30 90,48 Q98,22 110,46 Q124,30 122,62Z", COMB), p + "sh"))
    L.append(G(P("M44,102 L18,116 L46,124Z", BEAK) + P(wob(56, 138, 9, 14, .05, 6, 10), COMB), p + "sh"))
    L.append(C(78, 94, 10, EYE) + C(81, 90, 3.5, WHITE))
    return doc(p, 300, h, "".join(L), "smooth", seed=120 + len(col) + up)


HEN_BEAK = (30, 112)


def nest():
    """340x170: a straw nest; a hen sits in it at NEST_SEAT, its eggs lie at NEST_EGG."""
    p = "fne-"
    s = G(P(wob(170, 110, 160, 56, .05, 3, 22), STRAW_D) + P(wob(170, 96, 140, 40, .05, 4, 22), STRAW), p + "cut")
    rr = random.Random(5)
    for i in range(30):
        x = rr.uniform(30, 310)
        y = rr.uniform(70, 150)
        s += stroke(f"M{n(x - 20)},{n(y + rr.uniform(-6, 6))} L{n(x + 20)},{n(y + rr.uniform(-6, 6))}", STRAW_L if i % 2 else STRAW_D, 3)
    return doc(p, 340, 170, s, "rough", seed=131, cut={"rim": 3, "rough": 6})


NEST_SEAT = (170, 96)
NEST_EGG = (170, 84)


def egg_img(col):
    p = f"feg{col[0]}-"
    a, b = EGG_COL[col]
    return doc(p, 100, 120, egg(50, 62, 1.2, a, b, 3), "smooth", seed=140 + len(col))


def chick():
    p = "fck-"
    s = G(P(wob(70, 82, 50, 42, .04, 3, 18), "#FFD84A") + P(wob(56, 46, 32, 30, .04, 4, 16), "#FFE07A"), p + "cut")
    s += P(wob(84, 86, 24, 16, .08, 5, 12, -20), CORN_D, ' opacity="0.6"')
    s += P("M28,46 L12,54 L30,58Z", BEAK) + C(48, 40, 6, EYE) + C(50, 38, 2, WHITE)
    s += stroke("M60,122 L58,132 M80,122 L82,132", BEAK_D, 5)
    return doc(p, 140, 140, s, "smooth", seed=150)


def egg_basket():
    """300x220: a woven basket; eggs sit in its top at BASKET_IN; a coloured tag on its front (hard: by colour)."""
    p = "fba-"
    s = G(stroke("M60,80 Q150,-20 240,80", WALNUT_D, 12), p + "sh")
    body = "M24,80 L276,80 L250,206 L50,206Z"
    s += G(P(body, WALNUT), p + "cut")
    clip = f'<clipPath id="{p}cl"><path d="{body}"/></clipPath>'
    weave = ""
    for row in range(5):
        y = 92 + row * 24
        for col in range(10):
            x = 30 + col * 26 + (13 if row % 2 else 0)
            weave += P(wob(x, y, 12, 9, .05, row * 10 + col, 8), WOOD_L if (row + col) % 2 else WOOD)
    s += f'<g clip-path="url(#{p}cl)">{weave}</g>'
    s += P(wr(16, 66, 268, 26, 12, 1.2, 4), WALNUT_D)
    return doc(p, 300, 220, s, "rough", seed=161, cut={"rim": 3, "rough": 5}, extra_defs=clip)


BASKET_IN = (150, 70)


def grain_scoop():
    """240x240: a wooden scoop of grain; the grain pours from its mouth (GRAIN_MOUTH)."""
    p = "fgs-"
    s = G(P(wr(140, 130, 90, 34, 14, 1.2, 3), WALNUT, ' transform="rotate(30 180 150)"'), p + "sh")
    s += G(P("M30,90 Q30,180 120,180 Q170,170 170,110 Q160,96 120,96Z", WOOD) + P("M44,100 Q46,166 118,168 Q156,160 158,112Z", WOOD_D, ' opacity="0.5"'), p + "cut")
    rr = random.Random(7)
    grain = ""
    for i in range(46):
        x, y = rr.uniform(46, 156), rr.uniform(84, 112)
        grain += E(x, y, 7, 5, CORN if i % 3 else CORN_D, f' transform="rotate({rr.uniform(0, 180):.0f} {x:.0f} {y:.0f})"')
    s += G(grain, p + "sh")
    return doc(p, 240, 240, s, "rough", seed=171, cut={"rim": 3, "rough": 4})


GRAIN_MOUTH = (40, 96)


# ---------------------------------------------------------------- tools and food (240 frames; working points printed)
def brush():
    p = "fbr-"
    s = G(P(wr(40, 60, 160, 90, 40, 1.4, 3), WALNUT) + P(wr(52, 68, 136, 30, 14, 1, 4), WALNUT_L, ' opacity="0.6"'), p + "cut")
    s += G("".join(rect(52 + i * 14, 146, 9, 44, "#6A4A36", ' rx="4"') for i in range(10)), p + "sh")
    s += G(P(wr(70, 40, 100, 30, 14, 1, 5), RED), p + "sh")
    return doc(p, 240, 240, s, "rough", seed=181)


BRUSH_TIP = (120, 186)


def shears():
    p = "fsc-"
    s = G(P(wr(84, 70, 72, 150, 30, 1.4, 3), TEAL) + P(wr(94, 80, 22, 120, 10, 1, 4), TEAL_L, ' opacity="0.6"'), p + "cut")
    s += G(P(wr(70, 30, 100, 50, 12, 1, 5), METAL) + "".join(rect(76 + i * 12, 18, 7, 20, METAL_D, ' rx="3"') for i in range(8)), p + "sh")
    s += C(120, 170, 10, MUSTARD)
    return doc(p, 240, 240, s, "rough", seed=183)


SHEARS_TIP = (120, 26)


def soap():
    p = "fso-"
    s = G(P(wr(40, 80, 160, 100, 36, 1.4, 3), "#F7B7C8") + P(wr(52, 88, 120, 34, 16, 1, 4), "#FFD8E2", ' opacity="0.8"'), p + "cut")
    s += G(C(170, 72, 18, "#DDF2F6", ' opacity="0.9"') + C(196, 56, 11, "#DDF2F6", ' opacity="0.9"') + C(150, 52, 8, "#DDF2F6"), p + "sh")
    return doc(p, 240, 240, s, "smooth", seed=185)


SOAP_TIP = (120, 130)


def sponge():
    p = "fsp-"
    s = G(P(wr(36, 70, 168, 110, 28, 2, 3), "#FFD152") + P(wr(36, 150, 168, 30, 12, 1.4, 4), GREEN), p + "cut")
    rr = random.Random(5)
    s += "".join(C(rr.uniform(56, 184), rr.uniform(86, 140), rr.uniform(4, 8), CORN_D, ' opacity="0.7"') for _ in range(14))
    return doc(p, 240, 240, s, "rough", seed=187)


SPONGE_TIP = (120, 124)


def farm_carrot():
    return doc("fca-", 200, 240, carrot(100, 92, 56, 136, 3), "smooth", seed=191)


def farm_apple():
    return doc("fap-", 200, 200, apple(100, 110, 70, 3), "smooth", seed=193)


def farm_corn():
    return doc("fcn-", 200, 240, corn(100, 120, 90, 200, 3), "smooth", seed=195)


def pump():
    """240x400: a green hand pump; water comes out of its spout (PUMP_SPOUT); its handle is the touch place."""
    p = "fpu-"
    s = G(P(wr(70, 340, 120, 50, 12, 1.2, 3), METAL_D), p + "sh")
    s += G(P(wr(84, 110, 70, 240, 26, 1.4, 4), GREEN_D) + P(wr(94, 120, 22, 210, 10, 1, 5), GREEN_L, ' opacity="0.5"'), p + "cut")
    s += G(P("M150,150 L216,150 Q232,152 232,170 L232,196 L208,196 L208,176 L150,176Z", GREEN_D), p + "sh")
    s += G(stroke("M100,110 L30,40", METAL_D, 16) + C(30, 40, 16, RED), p + "sh")
    s += G(P(wr(70, 92, 98, 34, 14, 1, 6), GREEN), p + "sh")
    return doc(p, 240, 400, s, "rough", seed=197)


PUMP_SPOUT = (220, 200)
PUMP_HANDLE = (30, 40)


def cart():
    """480x330: the farm cart where what the animals give goes (its inside at CART_IN)."""
    p = "fct-"
    s = G(stroke("M40,170 L-10,140", WALNUT_D, 16), p + "sh")
    s += G(P("M30,120 L450,120 L430,250 L50,250Z", BARN_D) + P("M44,132 L436,132 L420,238 L60,238Z", BARN), p + "cut")
    s += "".join(stroke(f"M{60 + i * 90},132 L{70 + i * 86},238", BARN_D, 6, ' opacity="0.6"') for i in range(5))
    s += G(P(wr(20, 108, 440, 26, 10, 1.2, 4), WALNUT), p + "sh")
    for x in (120, 360):
        s += G(C(x, 262, 58, WALNUT_D) + C(x, 262, 46, WOOD) + C(x, 262, 12, WALNUT_D) + "".join(stroke(f"M{x},262 L{n(x + 44 * math.cos(a))},{n(262 + 44 * math.sin(a))}", WALNUT_D, 6) for a in [k * math.pi / 3 for k in range(6)]), p + "sh")
    return doc(p, 480, 330, s, "rough", seed=199, cut={"rim": 3, "rough": 5})


CART_IN = (240, 116)


def card_disc():
    """240: the round card a chore's picture sits on (the chore cards beside an animal)."""
    p = "fcd-"
    s = G(C(120, 120, 112, STRAW_D) + C(120, 120, 100, CREAM), p + "cut")
    s += C(120, 120, 100, "none", f' stroke="{STRAW}" stroke-width="6"')
    return doc(p, 240, 240, s, "rough", seed=201)


def done_badge():
    p = "fdb-"
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        r = 52 if i % 2 == 0 else 24
        pts.append((60 + r * math.cos(a), 62 + r * math.sin(a)))
    s = G(C(60, 60, 56, GREEN_D) + P(smooth(pts, 1 / 12), SUN), p + "cut")
    return doc(p, 120, 120, s, "smooth", seed=203)


def scarf():
    """Pipa's scarf, in her 600x700 frame (round her neck, under her mouth), cut to its box."""
    p = "fsf-"
    c, d, l = RED, RED_D, RED_L
    s = G(P("M196,476 Q300,520 404,476 L412,512 Q300,560 188,512Z", c) + P("M200,488 Q300,526 400,488", l, ' opacity="0"'), p + "cut")
    s += G(P("M356,500 L380,600 L346,604 L330,510Z", d) + P("M372,520 L392,608 L360,612Z", c), p + "sh")
    s += "".join(stroke(f"M{x},{n(486 + 14 * math.sin((x - 196) / 208 * math.pi))} L{x + 10},{n(520 + 12 * math.sin((x - 196) / 208 * math.pi))}", WHITE, 6, ' opacity="0.7"') for x in range(220, 400, 34))
    return doc(p, 260, 160, s, "smooth", seed=205, vb=(170, 460))


# ---------------------------------------------------------------- the farm (2400x1080), the fence, the home card, the photo
def barn(x, y, s):
    """A red barn, its door open, at (x, y) = the middle of its base."""
    w, h = 420 * s, 300 * s
    out = P(poly([(x - w / 2, y), (x - w / 2, y - h), (x, y - h - 170 * s), (x + w / 2, y - h), (x + w / 2, y)]), BARN)
    out += P(poly([(x - w / 2 - 24 * s, y - h + 6 * s), (x, y - h - 190 * s), (x + w / 2 + 24 * s, y - h + 6 * s), (x + w / 2 + 24 * s, y - h - 18 * s), (x, y - h - 214 * s), (x - w / 2 - 24 * s, y - h - 18 * s)]), WALNUT_D)
    out += P(wr(x - 90 * s, y - 200 * s, 180 * s, 200 * s, 8, 1, 5), "#5A3826")
    out += P(wr(x - 90 * s, y - 200 * s, 180 * s, 200 * s, 8, 1, 6), "none") + stroke(f"M{n(x - 90 * s)},{n(y - 200 * s)} L{n(x + 90 * s)},{n(y)} M{n(x + 90 * s)},{n(y - 200 * s)} L{n(x - 90 * s)},{n(y)}", WHITE, 8 * s, ' opacity="0"')
    for sgn in (-1, 1):   # the doors swung open
        dx = x + sgn * 90 * s
        out += P(poly([(dx, y), (dx, y - 200 * s), (dx + sgn * 60 * s, y - 190 * s), (dx + sgn * 60 * s, y - 6 * s)]), BARN_L)
        out += stroke(f"M{n(dx)},{n(y - 200 * s)} L{n(dx + sgn * 60 * s)},{n(y - 6 * s)}", WHITE, 7 * s)
    out += P(wr(x - 46 * s, y - h - 90 * s, 92 * s, 70 * s, 6, 1, 7), "#5A3826") + stroke(f"M{n(x - 46 * s)},{n(y - h - 55 * s)} L{n(x + 46 * s)},{n(y - h - 55 * s)}", WHITE, 6 * s)
    return out


def coop(x, y, s):
    w, h = 220 * s, 150 * s
    out = P(wr(x - w / 2, y - h, w, h, 8, 1, 11), WOOD) + "".join(stroke(f"M{n(x - w / 2)},{n(y - h + i * 30 * s)} L{n(x + w / 2)},{n(y - h + i * 30 * s)}", WOOD_D, 3, ' opacity="0.5"') for i in range(1, 5))
    out += P(poly([(x - w / 2 - 20 * s, y - h + 4), (x, y - h - 90 * s), (x + w / 2 + 20 * s, y - h + 4)]), BARN_D)
    out += P(wob(x, y - h * .5, 34 * s, 40 * s, .03, 12, 16), "#4A3226")
    out += stroke(f"M{n(x - 30 * s)},{n(y)} L{n(x + 50 * s)},{n(y - h * .5 + 30 * s)}", WOOD_D, 10 * s)
    return out


def bg_farm():
    p = "bgf-"
    rr = random.Random(9)
    grad = (f'<linearGradient id="{p}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FCBE0"/>'
            f'<stop offset="0.72" stop-color="#E4F1EC"/></linearGradient>')
    L = [rect(0, 0, 2400, 1080, f"url(#{p}sky)")]
    L.append(G(C(1980, 150, 70, SUN_D) + C(1976, 146, 60, SUN), p + "sh"))
    far = [(-50, 640)] + [(x, 540 + 50 * math.sin(x / 300) + rr.uniform(-10, 10)) for x in range(0, 2500, 160)] + [(2450, 640), (2450, 900), (-50, 900)]
    L.append(G(P(poly(far), HILL_F), p + "sh"))
    # fields in stripes on the far hill
    for i in range(4):
        L.append(P(wob(1500 + i * 180, 600 - i * 8, 120, 30, .05, 20 + i, 14, -6), [HILL, "#D9CB7A", HILL_D, "#E2D38C"][i], ' opacity="0.7"'))
    near = [(-50, 700)] + [(x, 650 + 30 * math.sin(x / 210 + .9) + rr.uniform(-8, 8)) for x in range(0, 2500, 140)] + [(2450, 700), (2450, 900), (-50, 900)]
    L.append(G(P(poly(near), HILL), p + "sh"))
    for x, y, s in ((1420, 640, .9), (2240, 650, 1.0), (980, 660, .6)):
        L.append(G(P(wr(x - 12 * s, y, 24 * s, 110 * s, 6, 1, int(x)), WALNUT) + P(wob(x, y - 30 * s, 90 * s, 80 * s, .08, int(x) + 1, 18), HILL_D)
                   + P(wob(x - 24 * s, y - 50 * s, 52 * s, 44 * s, .1, int(x) + 2, 14), mix(HILL_D, HILL, .5)), p + "sh"))
    L.append(G(barn(640, 780, 1.15), p + "cut"))
    L.append(G(coop(1100, 790, 1.0), p + "cut"))
    # grass, the mud puddle (near the barn), flowers
    L.append(G(P("M-20,770 " + " ".join(f"Q{x + 60},{n(752 + rr.uniform(-10, 10))} {x + 120},{n(770 + rr.uniform(-6, 6))}" for x in range(-20, 2420, 120)) + " L2420,1100 L-20,1100Z", GRASS), p + "sh"))
    L.append(P("M-20,920 " + " ".join(f"Q{x + 80},{n(900 + rr.uniform(-12, 12))} {x + 160},{n(920 + rr.uniform(-6, 6))}" for x in range(-20, 2420, 160)) + " L2420,1100 L-20,1100Z", GRASS_D, ' opacity="0.5"'))
    L.append(G(P(wob(PUDDLE[0], PUDDLE[1], 190, 40, .06, 41, 20), MUD_D) + P(wob(PUDDLE[0] - 8, PUDDLE[1] - 4, 170, 30, .06, 42, 20), MUD) + E(PUDDLE[0] - 60, PUDDLE[1] - 10, 40, 6, MUD_L, ' opacity="0.7"'), p + "sh"))
    tufts = ""
    for i in range(80):
        x, y = rr.uniform(0, 2400), rr.uniform(790, 1070)
        if abs(x - PUDDLE[0]) < 210 and abs(y - PUDDLE[1]) < 50:
            continue
        c = GRASS_D if rr.random() < .5 else GRASS_L
        tufts += P(f"M{n(x - 12)},{n(y)} L{n(x - 6)},{n(y - 26)} L{n(x - 1)},{n(y - 4)} L{n(x + 4)},{n(y - 30)} L{n(x + 8)},{n(y - 3)} L{n(x + 14)},{n(y - 22)} L{n(x + 16)},{n(y)}Z", c)
    L.append(tufts)
    fl = ""
    for i in range(24):
        x, y = rr.uniform(40, 2380), rr.uniform(800, 1060)
        if abs(x - PUDDLE[0]) < 220 and abs(y - PUDDLE[1]) < 60:
            continue
        col = [WHITE, "#FFE89A", PINK, "#C9B6E4"][i % 4]
        fl += "".join(C(x + math.cos(a) * 8, y + math.sin(a) * 8, 6, col) for a in [k * 1.2566 for k in range(5)]) + C(x, y, 5, MUSTARD)
    L.append(G(fl, p + "sh"))
    defs = std_defs(p, "bg", seed=73, sh=(3, 3, .16), sh2=(4, 4, .18), blur=4) + grad
    return svg(2400, 1080, defs, G("".join(L), p + "gr"))


PUDDLE = (980, 900)   # in the 2400x1080 background


def fence():
    """2400x240: the paddock fence the animals look over (in front of the ones waiting, behind the one she looks after)."""
    p = "ffe-"
    rr = random.Random(13)
    s = ""
    for i, x in enumerate(range(10, 2400, 120)):
        h = 220 + rr.uniform(-8, 8)
        s += P(wr(x, 240 - h, 34, h, 8, 1.2, i), WOOD_L if i % 2 else mix(WOOD_L, WOOD, .3))
    s += P(wr(0, 70, 2400, 30, 8, 1.2, 101), WOOD) + P(wr(0, 150, 2400, 30, 8, 1.2, 102), WOOD)
    return doc(p, 2400, 240, s, "rough", seed=207, cut={"rim": 2, "rough": 4})


def card_farm():
    p = "cfm-"
    L = [G(P(wr(10, 10, 380, 500, 36, 2.2, 3, step=18), CREAM), p + "cut")]
    clip = f'<clipPath id="{p}cl"><path d="{wr(34, 34, 332, 432, 26, 1.2, 4)}"/></clipPath>'
    sc = SKY_L
    scene = rect(20, 20, 360, 460, sc) + P(wob(120, 330, 230, 120, .05, 221, 20), HILL_F) + P(wob(320, 350, 200, 110, .05, 222, 20), HILL)
    scene += G(C(310, 90, 34, SUN_D) + C(308, 88, 28, SUN), p + "sh")
    scene += G(barn(120, 300, .42), p + "sh")
    scene += rect(20, 300, 360, 200, GRASS)
    # a cow and a horse looking over the fence
    scene += G(P(wob(250, 270, 66, 64, .02, 3, 22), COW["coat"]) + P(wob(276, 244, 26, 18, .1, 4, 12), COW["spot"])
               + P(wob(250, 312, 58, 36, .03, 5, 18), COW["muzzle"]) + E(230, 310, 7, 5, COW["muzzle_d"]) + E(270, 310, 7, 5, COW["muzzle_d"])
               + C(226, 262, 9, EYE) + C(274, 262, 9, EYE) + C(229, 259, 3, WHITE) + C(277, 259, 3, WHITE)
               + P(wob(186, 240, 26, 12, .05, 6, 12, -14), COW["coat"]) + P(wob(314, 240, 26, 12, .05, 7, 12, 14), COW["coat"])
               + P("M212,214 Q206,190 196,186 Q214,192 224,214Z", COW["horn"]) + P("M288,214 Q294,190 304,186 Q286,192 276,214Z", COW["horn"]), p + "sh")
    scene += G(P(wob(120, 256, 48, 70, .02, 8, 22, -6), HORSE["coat"]) + P(wob(118, 306, 44, 32, .03, 9, 18), HORSE["muzzle"])
               + P("M92,196 Q96,166 104,160 Q112,180 112,196Z", HORSE["coat"]) + P("M132,196 Q136,166 146,160 Q150,180 148,198Z", HORSE["coat"])
               + P(wob(120, 196, 28, 18, .12, 10, 12), HORSE["mane"]) + C(102, 246, 8, EYE) + C(138, 246, 8, EYE) + C(104, 243, 3, WHITE) + C(140, 243, 3, WHITE)
               + rect(114, 214, 12, 60, WHITE, ' opacity="0.9" rx="6"'), p + "sh")
    fence_s = "".join(P(wr(x, 300, 22, 140, 6, 1, 30 + i), WOOD_L) for i, x in enumerate(range(30, 380, 62))) + P(wr(20, 320, 360, 20, 6, 1, 40), WOOD) + P(wr(20, 380, 360, 20, 6, 1, 41), WOOD)
    scene += G(fence_s, p + "sh")
    scene += G(egg(320, 450, .9, *EGG_COL["white"], 50) + egg(350, 456, .9, *EGG_COL["brown"], 51), p + "sh")
    scene += G(P(wr(60, 420, 120, 60, 10, 1, 52), METAL) + E(120, 422, 60, 10, MILK), p + "sh")
    L.append(G(f'<g clip-path="url(#{p}cl)">{scene}</g>', p + "sh"))
    L.append(G(P(wr(130, -4, 140, 40, 3, 1.4, 6), MUSTARD, ' opacity="0.85" transform="rotate(-4 200 15)"'), p + "sh"))
    defs = std_defs(p, "rough", seed=235, sh=(4, 3.5, .32), cut={"rim": 3, "rough": 7, "freq": .12}) + clip
    return svg(400, 520, defs, G("".join(L), p + "gr"))


FRAME_WIN = (80, 80, 540, 540)


def photo_frame_farm():
    """700x780: a wooden frame with straw and flowers round it, its window (FRAME_WIN) open; an egg, a bottle, a ball of wool below."""
    p = "pff-"
    x, y, w, h = FRAME_WIN
    outer = wr(30, 30, 640, 640, 26, 2, 1, step=24)
    s = G(f'<path d="{outer} M{x},{y} h{w} v{h} h-{w}Z" fill="{WOOD}" fill-rule="evenodd"/>', p + "cut")
    s += G(f'<path d="{wr(46, 46, 608, 608, 20, 1.4, 2, step=24)} M{x - 8},{y - 8} h{w + 16} v{h + 16} h-{w + 16}Z" fill="{WOOD_L}" fill-rule="evenodd" opacity="0.7"/>', p + "sh")
    rr = random.Random(5)
    deco = ""
    for i in range(12):
        side = i % 4
        t = rr.uniform(.12, .88)
        px, py = [(40 + t * 620, 56), (644, 40 + t * 620), (40 + t * 620, 644), (56, 40 + t * 620)][side]
        col = [WHITE, "#FFE89A", PINK, "#C9B6E4"][i % 4]
        deco += "".join(C(px + math.cos(a) * 11, py + math.sin(a) * 11, 8, col) for a in [k * 1.2566 for k in range(5)]) + C(px, py, 7, MUSTARD)
    s += G(deco, p + "sh")
    s += G(egg(210, 722, 1.0, *EGG_COL["white"], 60) + egg(270, 728, 1.0, *EGG_COL["brown"], 61)
           + f'<g transform="translate(330 640) scale(0.6)">' + P("M48,28 L92,28 L92,70 Q120,92 120,128 L120,234 Q120,248 106,248 L34,248 Q20,248 20,234 L20,128 Q20,92 48,70Z", MILK) + P(wr(42, 12, 56, 26, 8, 1, 3), RED) + "</g>"
           + fluff(480, 724, 44, 40, 62, WOOL_D, 9) + fluff(476, 720, 36, 32, 63, WOOL, 9), p + "sh")
    return doc(p, 700, 780, s, "rough", seed=611, cut={"rim": 3, "rough": 6, "freq": .12})


# ---------------------------------------------------------------- the animals' layer stacks
ANIMALS = {
    "horse": (horse_body, H_EYES, H_MOUTH, HORSE),
    "cow": (cow_body, C_EYES, C_MOUTH, COW),
    "sheep": (sheep_body, S_EYES, S_MOUTH, SHEEP),
    "pig": (pig_body, P_EYES, P_MOUTH, PIG),
}


def animal_layers(name):
    body, ey, m, pal = ANIMALS[name]
    files = {f"farm-{name}-body": body()}
    mid = sum(ey["xs"]) / 2
    for kind in ("open", "blink", "happy", "surprised"):
        d, b = eyes(ey, kind, name, mid)
        files[f"farm-{name}-eyes-{kind}"] = svg(W, H, d, b)
    for kind in ("closed", "open", "chew"):
        d, b = soft_mouth(kind, pal, m, "f" + name)
        files[f"farm-{name}-mouth-{kind}"] = svg(W, H, d, b)
    return files


def items():
    out = {}
    for a in ANIMALS:
        out.update({k: (lambda v=v: v) for k, v in animal_layers(a).items()})
    out.update({
        "bg-farm": bg_farm, "farm-fence": fence, "card-farm": card_farm, "photo-frame-farm": photo_frame_farm,
        "farm-cart": cart, "farm-card": card_disc, "farm-done": done_badge, "farm-trough": trough, "farm-pump": pump,
        "farm-nest": nest, "horse-shine": horse_shine, "horse-teeth": horse_teeth, "farm-smudge": smudge,
        "cow-bell": cow_bell, "hay-bale": hay_bale, "hay-pile": hay_pile, "milk-bucket": lambda: milk_bucket(0),
        "milk-bucket-full": lambda: milk_bucket(1), "milk-bottle-empty": lambda: milk_bottle(0), "milk-bottle-full": lambda: milk_bottle(1),
        "wool-curl": wool_curl, "wool-pile": wool_pile, "yarn-ball": yarn_ball,
        "sheep-ribbon-red": lambda: ribbon("red"), "sheep-ribbon-blue": lambda: ribbon("blue"), "sheep-ribbon-yellow": lambda: ribbon("yellow"),
        "hen-sit-white": lambda: hen("white", False), "hen-sit-brown": lambda: hen("brown", False),
        "hen-up-white": lambda: hen("white", True), "hen-up-brown": lambda: hen("brown", True),
        "egg-white": lambda: egg_img("white"), "egg-brown": lambda: egg_img("brown"), "farm-chick": chick, "egg-basket": egg_basket,
        "grain-scoop": grain_scoop, "farm-brush": brush, "farm-shears": shears, "farm-soap": soap, "farm-sponge": sponge,
        "farm-carrot": farm_carrot, "farm-apple": farm_apple, "farm-corn": farm_corn, "pipa-scarf": scarf,
    })
    for nb in (4, 6):
        for i in range(nb):
            out[f"fleece-{nb}-{i + 1}"] = (lambda i=i, nb=nb: fleece_band(i, nb))
    for i in range(len(MUD_SPOTS)):
        out[f"mud-patch-{i + 1}"] = (lambda i=i: mud_patch(i))
    return out


def save(name, s):
    path = os.path.join(OUTDIR, name + ".svg")
    with open(path, "w", encoding="utf8") as f:
        f.write(s)
    size = len(s.encode("utf8"))
    import re
    m = re.search(r'viewBox="([^"]+)"', s)
    print(f"{name:24s} {size / 1024:6.1f} KB  {m.group(1)}" + ("  OVER BUDGET" if size > 60 * 1024 else ""))


if __name__ == "__main__":
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    for k, fn in items().items():
        if not only or k in only:
            save(k, fn())
    print("anchors (ART.farm): FEET", FEET, "H_ZONES", H_ZONES, "TEETH", TEETH, "TEATS", TEATS, "COLLAR", COLLAR, "BELL_AT", BELL_AT,
          "TROUGH_IN", TROUGH_IN, "RIBBON_AT", RIBBON_AT, "FLEECE", FLEECE, "fleece-4", fleece_boxes(4), "fleece-6", fleece_boxes(6),
          "MUD_SPOTS", MUD_SPOTS, "HEN_BEAK", HEN_BEAK, "NEST_SEAT", NEST_SEAT, "NEST_EGG", NEST_EGG, "BASKET_IN", BASKET_IN,
          "GRAIN_MOUTH", GRAIN_MOUTH, "BRUSH_TIP", BRUSH_TIP, "SHEARS_TIP", SHEARS_TIP, "SOAP_TIP", SOAP_TIP, "SPONGE_TIP", SPONGE_TIP,
          "PUMP_SPOUT", PUMP_SPOUT, "PUMP_HANDLE", PUMP_HANDLE, "CART_IN", CART_IN, "PUDDLE", PUDDLE, "FRAME_WIN", FRAME_WIN)
