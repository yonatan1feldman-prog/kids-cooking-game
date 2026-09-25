# Shared kit for images-b-soup (the sixth recipe: vegetable soup).
# Wraps the pancake kit (images-b-pancakes/tools/pancakekit.py) READ-ONLY, which wraps the smoothie / cookie / salad / prep kits and the
# style-B kit (images-b/tools/pb.py: palette, paper grain, torn cream rim, shadows). Bytecode caching is off, so importing writes
# nothing into the other folders. This module only adds the soup / pot / peel colours, the shared geometry, a few shared drawings
# (chopped vegetable bits, steam) and a save() that writes into images-b-soup/ only.
import sys, os, re, math, random
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
SOUP = os.path.normpath(os.path.join(HERE, ".."))
KTOOLS = os.path.normpath(os.path.join(HERE, "..", "..", "images-b-pancakes", "tools"))
sys.path.insert(0, KTOOLS)
from pancakekit import *                      # noqa: F401,F403  pb palette + helpers, prep/salad/cookie/smoothie/pancake helpers
import pancakekit as KIT                      # noqa: E402
import saladkit as SK                         # noqa: E402
from saladkit import PA, PB, PE, gen_items, gen_kitchen   # noqa: F401,E402
import gen_salad_a as SA                      # noqa: E402  (the carrot: peel-skin-carrot must register on veg-carrot-whole)

FORBID = SK.FORBID

# ---- soup colours -------------------------------------------------------------------------------------------------
# broth: pale and watery (stage 1) -> golden (stage 2) -> rich and thick (stage 3)
BR1, BR1_L, BR1_D = "#F7E4B2", "#FDF4D6", "#DDC287"
BR2, BR2_L, BR2_D = "#EDB255", "#F9D28C", "#CB8C35"
BR3, BR3_L, BR3_D = "#DE8C33", "#F0AE5B", "#B2671F"
BROTH = {1: (BR1, BR1_L, BR1_D), 2: (BR2, BR2_L, BR2_D), 3: (BR3, BR3_L, BR3_D)}
# potato: PEELED flesh (veg-potato-whole is the peeled potato) and the brown skin that peel-skin-potato draws over it
POT_F, POT_F_L, POT_F_D = "#F0DB9C", "#FCF0C6", "#CBA967"     # review fix 1: warmer flesh and a firm dark edge (it read as a cream puddle)
PSK, PSK_L, PSK_D, PSK_EYE = "#B98A56", "#D2A874", "#96683A", "#7A5230"
# zucchini: dark green skin, pale flesh, a small seed zone
ZUC_D, ZUC, ZUC_L = "#316B2B", "#4F9236", "#8CC05E"
ZUC_F, ZUC_F2, ZUC_SEED = "#E7F2C6", "#D6E8AB", "#FBF7DC"
# carrot peel: duller and browner than the carrot body under it, so peeling is a visible change
CPK, CPK_L, CPK_D = "#C06C28", "#D48B4B", "#94501A"   # review fix 2: dull, dusty skin, clearly darker than the bright peeled carrot under it
# the pot: deep coral enamel, cream inside, steel rim (it must not read as the teal prep bowl)
PT, PT_L, PT_D, PT_DD = "#E2653A", "#FF9061", "#B8452A", "#8F3220"
PT_IN, PT_IN_D = "#F7EEDD", "#DCCBAE"
STEEL, STEEL_L, STEEL_D = METAL, METAL_L, METAL_D
HERBX, HERBX_L = "#4E7B2E", "#7BA84C"
WATER, WATER_L, WATER_D = PA.WATER, PA.WATER_L, PA.WATER_D

# ---- shared geometry (see README-soup.md) -------------------------------------------------------------------------
VEG_W, VEG_H, VEG_K = PB.VEG_W, PB.VEG_H, PB.VEG_K          # 672 x 504, drawn in a 560 x 420 grid at x1.2
STAMP = 140                                                  # the topping / piece frame
SLICE = 240                                                  # the cut slice frame

POT = (1000, 760)                                            # the pot's two layers + pot-heap-* + soup-stage-*
POT_RIM, POT_RRX, POT_RRY = (500, 250), 400, 108             # rim ellipse
POT_IC, POT_IRX, POT_IRY = (500, 258), 368, 92               # opening = the contents window
POT_BASE, POT_BRX, POT_BRY = (500, 700), 330, 25             # base contact ellipse (what sits on the hob)
POT_BODY = "M100,250 C100,455 110,595 148,652 C196,720 804,720 852,652 C890,595 900,455 900,250Z"
POT_FRONT = (f"M100,250 C100,455 110,595 148,652 C196,720 804,720 852,652 C890,595 900,455 900,250 "
             f"L868,258 A{POT_IRX},{POT_IRY} 0 0 1 132,258Z")
POT_FRONT_RIM = (f"M100,250 A{POT_RRX},{POT_RRY} 0 0 0 900,250 L868,258 A{POT_IRX},{POT_IRY} 0 0 1 132,258Z")
# On the images-b-pancakes cooktop, at the SAME scale. The cooktop is drawn from straight above and the pot from 3/4, so the pot's
# base ellipse is seated POT_SEAT_DY units in front of the burner centre: its foot then covers the grate instead of hovering
# behind the grate arms. Base half-width 330 <= the grate's reach 430, so the foot fits the hob.
POT_SEAT_DY = 150
POT_ON_STOVE = (BURNER[0] - POT_BASE[0], BURNER[1] + POT_SEAT_DY - POT_BASE[1])   # (-20, -100) = pot top-left in stove units

PEELER = (420, 460); PEELER_GRIP = (210, 92); PEELER_BLADE = (126, 294, 358)   # blade line: x 126..294 at y 358
PEEL_STRIP = (280, 240)
JUG = (360, 520); JUG_SPOUT = (52, 118)
SBOWL = (560, 360); SBOWL_IC, SBOWL_IRX, SBOWL_IRY = (280, 152), 226, 60
PORTION = (360, 420); PORTION_AT = (150, 250)   # review fix 7: a taller frame, so the handle can rise steeply (it read as a frying pan)
CARD = (400, 520)


def overlay_doc(p, body, seed):
    """The 672 x 504 whole-vegetable frame with the same x1.2 scale as PB.veg_doc but NO ground shadow:
    an overlay (peel-skin-*) that registers pixel-exactly on the vegetable under it."""
    return doc(p, VEG_W, VEG_H, f'<g transform="scale({VEG_K})">' + body + "</g>", seed=seed, sh=(4, 3.5, .33))


def clip_pot(p, inner, grow=0):
    """Clip contents to the pot's opening, but leave anything above the rim line free (the salad-heap rule):
    a mound may rise out of the pot, everything at or below the rim centre line is inside the opening."""
    return (f'<clipPath id="{p}pc"><rect x="0" y="0" width="{POT[0]}" height="{POT_IC[1]}"/>'
            f'<ellipse cx="{POT_IC[0]}" cy="{POT_IC[1]}" rx="{POT_IRX - 4 + grow}" ry="{POT_IRY - 3 + grow}"/></clipPath>'
            + G(inner, None, f' clip-path="url(#{p}pc)"'))


# ---- chopped vegetable bits (shared by pot-heap-*, soup-stage-*, soup-portion, soup-bowl-full, card-soup) ----------
def bit_potato(x, y, s, seed, rot=0):
    """A chunky rounded cube of peeled potato: the pale, biggest piece in the soup."""
    r = random.Random(seed)
    pts = [(x + dx * s * r.uniform(.9, 1.1), y + dy * s * r.uniform(.9, 1.1))
           for dx, dy in ((-1, -.72), (.2, -1), (1, -.66), (1.02, .4), (.1, .96), (-1.02, .5))]
    g = P(rpoly([(px + s * .12, py + s * .22) for px, py in pts], s * .3), POT_F_D)
    g += P(rpoly(pts, s * .3), POT_F)
    g += P(rpoly([(x - s * .5, y - s * .5), (x + s * .3, y - s * .62), (x + s * .36, y - s * .1), (x - s * .44, y)], s * .2), POT_F_L, ' opacity="0.85"')
    return f'<g transform="rotate({n(rot)} {n(x)} {n(y)})">{g}</g>' if rot else g


def bit_carrot(x, y, s, seed, tilt=.82):
    """A carrot coin (a round slice seen slightly from above)."""
    g = E(x, y + s * .16, s, s * tilt, CAR_D)
    g += E(x, y, s * .94, s * tilt * .94, CAR)
    g += E(x, y, s * .56, s * tilt * .56, mix(CAR, CAR_D, .3))
    g += E(x, y, s * .44, s * tilt * .44, CAR_L)
    g += E(x - s * .3, y - s * tilt * .34, s * .22, s * tilt * .16, "#FFD7A8", ' opacity="0.85"')
    return g


def bit_zucchini(x, y, s, seed, tilt=.82):
    """A zucchini round: dark green skin ring, pale flesh, a little seed star."""
    r = random.Random(seed)
    g = E(x, y + s * .16, s, s * tilt, ZUC_D)
    g += E(x, y, s * .94, s * tilt * .94, ZUC)
    g += E(x, y, s * .74, s * tilt * .74, ZUC_F)
    g += E(x, y, s * .38, s * tilt * .38, ZUC_F2)
    for i in range(3):
        a = i / 3 * 6.283 + r.uniform(0, 2)
        g += E(x + math.cos(a) * s * .2, y + math.sin(a) * s * tilt * .2, s * .09, s * tilt * .13, ZUC_SEED)
    g += E(x - s * .3, y - s * tilt * .34, s * .2, s * tilt * .14, "#F6FBE2", ' opacity="0.8"')
    return g


def bit_onion(x, y, s, seed, tilt=.8):
    """A small translucent onion piece (the aromatic; it keeps the heap from being only three colours)."""
    g = P(wob(x, y + s * .12, s, s * tilt, .12, seed, 12), ONION_D, ' opacity="0.9"')
    g += P(wob(x, y, s * .9, s * tilt * .9, .12, seed + 1, 12), ONION_W)
    g += P(wob(x, y, s * .5, s * tilt * .5, .16, seed + 2, 10), ONION_L, ' opacity="0.7"')
    return g


BITS = {"P": bit_potato, "K": bit_carrot, "Z": bit_zucchini, "O": bit_onion}


def bit(kind, x, y, s, seed, rot=0):
    if kind == "P":
        return bit_potato(x, y, s, seed, rot)
    return BITS[kind](x, y, s, seed)


def steam(p, cx, cy, s, n_=3, seed=1):
    """Soft pale steam wisps rising from (cx, cy). Drawn blurred, so it stays a wisp and never a white blob."""
    r = random.Random(seed)
    g = ""
    for i in range(n_):
        dx = (i - (n_ - 1) / 2) * 90 * s
        h = (150 + r.uniform(0, 90)) * s
        w = (26 + r.uniform(0, 12)) * s
        x0, y0 = cx + dx, cy
        d = (f"M{n(x0)},{n(y0)} C{n(x0 - w)},{n(y0 - h * .35)} {n(x0 + w)},{n(y0 - h * .6)} {n(x0 - w * .4)},{n(y0 - h)}")
        g += stroke(d, WHITE, 22 * s, f' opacity="{.5 - i * .04:.2f}"')
    return G(g, p + "bl")


def save(name, s):
    """Write one SVG into images-b-soup/ (never anywhere else). Returns size in bytes."""
    assert not any(f in s for f in FORBID), name
    path = os.path.join(SOUP, name + ".svg")
    assert os.path.dirname(os.path.abspath(path)) == SOUP, path
    with open(path, "w", encoding="utf8") as f:
        f.write(s)
    size = len(s.encode("utf8"))
    print(f"{name:22s} {size / 1024:6.1f} KB" + ("  OVER BUDGET" if size > 60 * 1024 else ""))
    return size


def run(items):
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    for name, fn in items.items():
        if not only or name in only:
            save(name, fn())
