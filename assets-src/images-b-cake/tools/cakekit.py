# Shared kit for images-b-cake (the seventh recipe: birthday cake).
# Wraps the pancake kit (images-b-pancakes/tools/pancakekit.py) READ-ONLY, which wraps the smoothie / cookie / salad / prep kits and the
# style-B kit (images-b/tools/pb.py: palette, paper grain, torn cream rim, shadows). Bytecode caching is off, so importing writes
# nothing into the other folders. This module only adds the cake / frosting / candle colours, the shared geometry, a few shared
# drawings (a batter blob, the sponge top, the candle, the flame, the smoke wisp, a mini cake for the card and the frame sticker)
# and a save() that writes into images-b-cake/ only.
import sys, os, math, random
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
CAKE_DIR = os.path.normpath(os.path.join(HERE, ".."))
KTOOLS = os.path.normpath(os.path.join(HERE, "..", "..", "images-b-pancakes", "tools"))
sys.path.insert(0, KTOOLS)
from pancakekit import *                     # noqa: F401,F403  pb palette + helpers, prep/salad/cookie/smoothie/pancake helpers
import pancakekit as KIT                     # noqa: E402
import saladkit as SK                        # noqa: E402
from saladkit import PA, PB, PE, gen_items, gen_kitchen   # noqa: F401,E402

FORBID = SK.FORBID

# ---- cake colours -------------------------------------------------------------------------------------------------
# Raw cake batter: thicker and paler than the pancake batter (BAT #FAE0A0) and clearly not cookie dough (#F0C984):
# a buttery vanilla cream that holds a soft peak.
CB, CB_L, CB_D, CB_DD = "#F7DC9A", "#FFF2CC", "#E0BC6C", "#BE9646"
VAN = "#A97C3E"                                             # vanilla specks
SUG, SUG_D = "#FBF7F0", "#E2DBCF"                           # sugar
# Baked sponge seen from above: golden crumb with a browner crust ring.
SPG, SPG_L, SPG_D = "#EFC07A", "#FAE0B2", "#D79C4A"
CRU, CRU_D, CRU_DD = "#D2954A", "#B2762F", "#8E5A22"        # crust top / edge / the dark crumb line
# Frosting, the three tubs. Pink = the cookie icing pink, choc = the cookie chocolate, white = a cool vanilla white.
FP, FP_L, FP_D = "#F58FB0", "#FFC8DA", "#D9668C"
FW, FW_L, FW_D = "#FFFBF2", "#FFFFFF", "#DCD2C0"
FC, FC_L, FC_D = "#7A4A2C", "#A9714A", "#543018"
FROST = {"pink": (FP, FP_L, FP_D), "white": (FW, FW_L, FW_D), "choc": (FC, FC_L, FC_D)}
# frosting-blob is drawn NEUTRAL so the game can tint it (multiply) to any of the three.
BLOB_C_ = "#FAF5EC"
# Candle: cream wax with a coral spiral (the kitchen coral), dark wick. Flame: orange body, yellow heart, a blue foot.
WAX, WAX_L, WAX_D = "#FDF3DE", "#FFFFFF", "#E2D2B2"
STRIPE, STRIPE_D = CORAL, CORAL_D
WICK, WICK_L = "#4A382C", "#7A6450"
FLM_O, FLM_Y, FLM_W, FLM_B = "#FF9A3C", "#FFD35A", "#FFF6D2", "#9ED3FA"
SMOKE_1, SMOKE_2 = "#B9B0A2", "#DED7CA"
CHIP, CHIP_L, CHIP_D = "#6E4126", "#9C6743", "#482712"      # chocolate chip (darker than the cookie icing chocolate)
STEEL, STEEL_L, STEEL_D = METAL, METAL_L, METAL_D
PAN_IN, PAN_IN_L, PAN_IN_D = "#BFC9C6", "#DCE4E1", "#8A9794"   # the pan's floor / wall

# ---- shared geometry (see README-cake.md) --------------------------------------------------------------------------
BOWL = (640, 520)                                            # = images-b-prep prep-bowl-back / -front / sauce-stage-*
IC, IRX, IRY = PA.IC, PA.IRX, PA.IRY                         # the bowl opening (320,176) rx 262 ry 74

PAN = (800, 800); PAN_C = (400, 400)                         # the round cake pan seen from above (one frame for -full)
PAN_R = 370                                                  # outer rim radius
PAN_LIP = 348                                                # inner edge of the rim lip = top of the wall
PAN_IR = 334                                                 # the BATTER WINDOW: the pan's floor radius == CAKE_R
PAN_BAT_R = 316                                              # the batter's own surface radius in cake-pan-full

# the baked cake and its plate: EXACTLY the pizza's frames, so the same component photographs and cuts them
CAKE = (720, 720); CAKE_C = (360, 356); CAKE_R = 334         # == images-b/dough-flat (720x720, centre (360,356), r 334)
CAKE_FACE_R = 290                                            # the frosting field == the pizza's sauce/cheese area r 290
PLATE = (820, 830); PLATE_C = (410, 408); PLATE_R = 389      # == images-b/pizza-board (tray) 820x830, r 389

TUB = (320, 360); TUB_BASE = (160, 336); TUB_TOP = (160, 140)   # frosting tub: base contact point, frosting surface centre
TUB_ORX, TUB_ORY = 132, 54                                   # the tub's opening (the frosting surface) around TUB_TOP
BLOB = (200, 200); BLOB_AT = (100, 100); BLOB_R = 68         # == images-b/sauce-blob: one lobed blob, used as a brush
STAMP = 140                                                  # choc-chip: the topping-* / cookie-decoration stamp frame
# The candle, drawn at candle_body(..., s=1): wax half-width CAND_RX, base -> top-ellipse CAND_H, wick 34 above the top.
CAND_RX, CAND_RY, CAND_H = 64, 20, 290
CANDLE = (260, 460); CANDLE_BASE = (130, 414)                # base anchor: the point that lands where she drops it
CANDLE_FLAME = (130, CANDLE_BASE[1] - CAND_H - 34)           # (130, 90) = the wick tip: where flame-candle's foot goes
FLAME = (200, 280); FLAME_BASE = (100, 236)                  # the flame's foot: put it ON the candle's flame point
SMOKE = (240, 360); SMOKE_BASE = (120, 340)                  # the wisp's foot: the blown-out candle's flame point
CARD = (400, 520)
FRAME = (700, 780)
CANDLES = 5                                                  # five candles (she is five)

# where the five candles stand on the cake face, in cake-file units around CAKE_C (base anchors)
CANDLE_SEATS = [(0, -150), (143, -46), (88, 121), (-88, 121), (-143, -46)]   # review fix 6: a 150-unit ring,
# 72 degrees apart, so the five candles never overlap and always read as five

OVEN = (700, 800); OVEN_WIN = (150, 320, 400, 290)           # = images-b/oven-* ; the pan goes in the window
PAN_IN_OVEN = (350, 468, 0.36)                               # centre + scale (x oven scale), like the cookies' baking tray


def clip_bowl(p, inner, grow=0):
    """Clip bowl contents to the opening (the prep-bowl / sauce-stage rule)."""
    return (f'<clipPath id="{p}bc"><ellipse cx="{IC[0]}" cy="{IC[1]}" rx="{IRX - 2 + grow}" ry="{IRY - 2 + grow}"/></clipPath>'
            + G(inner, None, f' clip-path="url(#{p}bc)"'))


# ---- shared drawings ----------------------------------------------------------------------------------------------
def batter_lump(x, y, s, seed, rot=0):
    """A soft lump of unmixed cake batter (butter + sugar + flour): pale, matte, with a lit top."""
    r = random.Random(seed)
    pts = [(x + math.cos(a) * s * r.uniform(.82, 1.14), y + math.sin(a) * s * .74 * r.uniform(.82, 1.14))
           for a in [i / 10 * 6.283 for i in range(10)]]
    g = P(smooth([(px, py + s * .16) for px, py in pts], .2), CB_D)
    g += P(smooth(pts, .2), CB)
    g += P(wob(x - s * .24, y - s * .26, s * .44, s * .2, .12, seed + 1, 12, rot), CB_L, ' opacity="0.85"')
    return g


def speckle(cx, cy, rx, ry, k, seed, col=VAN, op=.55, sz=(1.6, 3.0)):
    """Vanilla specks / crumbs scattered in an ellipse."""
    r = random.Random(seed)
    s = ""
    for _ in range(k):
        a, d = r.uniform(0, 6.283), math.sqrt(r.random())
        s += C(cx + math.cos(a) * rx * d, cy + math.sin(a) * ry * d, r.uniform(*sz), col, f' opacity="{op}"')
    return s


def sponge_top(p, cx, cy, R, seed=1):
    """The baked cake seen from straight above: a domed golden sponge with a browner crust ring and a crumbly edge.
    Review fix 1: the three long cracks used to cross in the middle and read as pre-cut slice lines, and the dome was
    too flat to survive being shrunk. The dome now has a real shoulder-to-crown ramp, the crust ring is darker and
    narrower, and the cracks are short, off-centre and pale.
    Returns (markup, outer point loop) so the caller can wrap the silhouette in the torn-edge filter."""
    r = random.Random(seed)
    out = gen_items.wobp(cx, cy, R, R * .995, .009, seed, 46)
    g = P(smooth(out), CRU_DD)                                                       # the dark baked edge
    g += P(wob(cx, cy - 2, R * .972, R * .965, .01, seed + 1, 44), CRU_D)
    g += P(wob(cx - 2, cy - 5, R * .94, R * .932, .012, seed + 2, 42), CRU)          # the crust ring
    g += P(wob(cx - 3, cy - 8, R * .9, R * .888, .014, seed + 3, 40), SPG_D)         # the shoulder of the dome
    g += P(wob(cx - 4, cy - 12, R * .82, R * .806, .016, seed + 4, 38), mix(SPG, SPG_D, .4))
    g += P(wob(cx - 5, cy - 16, R * .72, R * .705, .018, seed + 5, 36), SPG)         # the domed top
    g += P(wob(cx - 16, cy - 30, R * .56, R * .53, .024, seed + 6, 30), mix(SPG, SPG_L, .5))
    g += P(wob(cx - 30, cy - 44, R * .38, R * .34, .03, seed + 7, 26), SPG_L, ' opacity="0.8"')    # the crown, lit
    # a shaded crescent on the lower right, so the dome has a side away from the light
    g += P(f"M{n(cx - R * .62)},{n(cy + R * .5)} A{n(R * .9)},{n(R * .88)} 0 0 0 {n(cx + R * .76)},{n(cy + R * .18)} "
           f"A{n(R * .74)},{n(R * .72)} 0 0 1 {n(cx - R * .5)},{n(cy + R * .42)}Z", CRU_D, ' opacity="0.22"')
    # two short, pale baking cracks, kept off the centre so they never read as cut lines
    for a, dd, ln in ((-2.1, .46, .3), (1.15, .5, .26)):
        x0, y0 = cx + math.cos(a) * R * dd, cy + math.sin(a) * R * dd
        x1, y1 = x0 + math.cos(a + 1.4) * R * ln, y0 + math.sin(a + 1.4) * R * ln
        g += stroke(f"M{n(x0)},{n(y0)} Q{n((x0 + x1) / 2 + r.uniform(-20, 20))},{n((y0 + y1) / 2 + r.uniform(-16, 16))} {n(x1)},{n(y1)}",
                    CRU_D, R * .02, ' opacity="0.28"')
    g += speckle(cx, cy - 10, R * .72, R * .66, 30, seed + 9, CRU_D, .26, (2.2, 4.2))
    g += speckle(cx, cy - 10, R * .68, R * .62, 24, seed + 11, SPG_L, .5, (2.0, 4.0))
    return g, out


def frost_disc(p, cx, cy, R, kind, seed=1, swirl=True):
    """A spread field of frosting seen from above: centre (cx,cy), radius R. Used by the mini cake, the card and the tubs."""
    col, col_l, col_d = FROST[kind]
    r = random.Random(seed)
    g = P(wob(cx, cy + R * .022, R, R * .99, .035, seed, 30), col_d)
    g += P(wob(cx, cy, R * .96, R * .95, .04, seed + 1, 30), col)
    g += P(wob(cx - R * .16, cy - R * .2, R * .56, R * .48, .07, seed + 2, 22), col_l, ' opacity="0.6"')
    if swirl:
        d = "M" + " L".join(
            f"{n(cx + math.cos(i / 9 * 6.283) * (R * .82 - i * R * .028))},{n(cy + math.sin(i / 9 * 6.283) * (R * .78 - i * R * .026))}"
            for i in range(28))
        g += stroke(d, col_d, R * .075, ' opacity="0.38"')
        g += stroke(d, col_l, R * .03, ' opacity="0.45"')
    for _ in range(5):                                                  # little peaks the spatula left behind
        a, dd = r.uniform(0, 6.283), math.sqrt(r.random()) * R * .7
        g += P(wob(cx + math.cos(a) * dd, cy + math.sin(a) * dd, R * .1, R * .06, .16, r.randint(1, 999), 10, r.uniform(-40, 40)),
               col_l, ' opacity="0.5"')
    return g


def flame_shape(cx, cy, s, seed=1):
    """One small teardrop candle flame: foot at (cx,cy), tip s*192 above it. No filter refs (safe to paste anywhere)."""
    H = 192 * s
    W = 52 * s
    tip = (cx, cy - H)
    outer = (f"M{n(cx)},{n(cy)} C{n(cx - W)},{n(cy - H * .18)} {n(cx - W * 1.02)},{n(cy - H * .62)} {n(tip[0])},{n(tip[1])} "
             f"C{n(cx + W * 1.02)},{n(cy - H * .62)} {n(cx + W)},{n(cy - H * .18)} {n(cx)},{n(cy)}Z")
    g = P(outer, FLM_O)
    g += P(f"M{n(cx)},{n(cy - H * .06)} C{n(cx - W * .6)},{n(cy - H * .2)} {n(cx - W * .6)},{n(cy - H * .58)} {n(cx)},{n(cy - H * .84)} "
           f"C{n(cx + W * .6)},{n(cy - H * .58)} {n(cx + W * .6)},{n(cy - H * .2)} {n(cx)},{n(cy - H * .06)}Z", FLM_Y)
    g += P(f"M{n(cx)},{n(cy - H * .12)} C{n(cx - W * .3)},{n(cy - H * .24)} {n(cx - W * .3)},{n(cy - H * .48)} {n(cx)},{n(cy - H * .62)} "
           f"C{n(cx + W * .3)},{n(cy - H * .48)} {n(cx + W * .3)},{n(cy - H * .24)} {n(cx)},{n(cy - H * .12)}Z", FLM_W)
    g += P(f"M{n(cx)},{n(cy + H * .03)} C{n(cx - W * .55)},{n(cy - H * .04)} {n(cx - W * .5)},{n(cy - H * .2)} {n(cx)},{n(cy - H * .22)} "
           f"C{n(cx + W * .5)},{n(cy - H * .2)} {n(cx + W * .55)},{n(cy - H * .04)} {n(cx)},{n(cy + H * .03)}Z", FLM_B, ' opacity="0.75"')
    return g


def candle_body(p, cx, base_y, s, seed=1, shadow=True, body_only=False):
    """A birthday candle in a slight 3/4 view, standing on a cake that is seen from above: the near half of the base
    ellipse dips TOWARDS the viewer (the wax is pushed into the frosting), the top ellipse is open and the coral rings
    sag the same way, so the wax reads as a cylinder lit from the upper left.
    (cx, base_y) = the BASE ANCHOR; the wick tip (the FLAME POINT) is CAND_H + 34 above it, at s = 1.
    body_only=True returns just the silhouette path (for the torn-edge cut layer)."""
    RX = CAND_RX * s                # half-width of the wax
    RY = CAND_RY * s                # how open the top / base ellipses are (the 3/4 view)
    H = CAND_H * s                  # base -> top-ellipse centre
    top = base_y - H
    # the silhouette: left flank down, the NEAR half of the base ellipse (bulging down, sweep 1), right flank up,
    # then the BACK half of the top ellipse (bulging up, sweep 1) - so the whole open top is inside the outline.
    body = (f"M{n(cx - RX)},{n(top)} L{n(cx - RX)},{n(base_y)} A{n(RX)},{n(RY)} 0 0 1 {n(cx + RX)},{n(base_y)} "
            f"L{n(cx + RX)},{n(top)} A{n(RX)},{n(RY)} 0 0 1 {n(cx - RX)},{n(top)}Z")
    if body_only:
        return body
    g = ""
    if shadow:                      # the candle's own shadow, cast down-right onto the cake
        g += E(cx + 24 * s, base_y + 8 * s, RX * 1.1, RY * .82, SH, ' opacity="0.26"')
    g += P(body, WAX_D)
    # the lit body: its bottom rides the SAME base ellipse as the silhouette (its corners sit on it), so the wax ends
    # in one clean rounded edge instead of leaving a pale flap sticking out at the foot
    g += P(f"M{n(cx - RX * .9)},{n(top)} L{n(cx - RX * .9)},{n(base_y + RY * .436)} A{n(RX)},{n(RY)} 0 0 1 "
           f"{n(cx + RX * .5)},{n(base_y + RY * .866)} L{n(cx + RX * .5)},{n(top + RY * .5)} A{n(RX * .9)},{n(RY * .9)} 0 0 1 "
           f"{n(cx - RX * .9)},{n(top)}Z", WAX)                                                   # the lit body
    # coral rings wrapping the cylinder: both edges of every band sag towards the viewer, clipped to the wax
    cid = f"{p}cb{seed}"
    st = ""
    bw = H * .112                                                    # band height on the front of the cylinder
    for i in range(4):
        y0 = top + RY + H * (0.08 + i * 0.222)
        w = RX
        st += P(f"M{n(cx - w)},{n(y0)} A{n(w)},{n(RY)} 0 0 1 {n(cx + w)},{n(y0)} L{n(cx + w)},{n(y0 + bw)} "
                f"A{n(w)},{n(RY)} 0 0 0 {n(cx - w)},{n(y0 + bw)}Z", STRIPE)
        st += P(f"M{n(cx - w)},{n(y0 + 2 * s)} A{n(w)},{n(RY)} 0 0 1 {n(cx + w)},{n(y0 + 2 * s)} "
                f"L{n(cx + w)},{n(y0 + bw * .42)} A{n(w)},{n(RY)} 0 0 0 {n(cx - w)},{n(y0 + bw * .42)}Z",
                mix(STRIPE, WAX_L, .35), ' opacity="0.8"')            # a lit top edge on each ring
    g += (f'<clipPath id="{cid}"><path d="{body}"/></clipPath>'
          + G(st, None, f' clip-path="url(#{cid})"'))
    # the shaded right flank and the lit left flank, both inside the wax
    sid = f"{p}cs{seed}"
    fl = P(f"M{n(cx + RX * .42)},{n(top)} L{n(cx + RX * 1.02)},{n(top)} L{n(cx + RX * 1.02)},{n(base_y + RY)} "
           f"L{n(cx + RX * .42)},{n(base_y + RY)}Z", SH, ' opacity="0.2"')
    fl += P(f"M{n(cx - RX * .82)},{n(top + RY * .6)} L{n(cx - RX * .34)},{n(top + RY * .4)} "
            f"L{n(cx - RX * .38)},{n(base_y - 6 * s)} L{n(cx - RX * .86)},{n(base_y - 12 * s)}Z", WAX_L, ' opacity="0.55"')
    g += (f'<clipPath id="{sid}"><path d="{body}"/></clipPath>' + G(fl, None, f' clip-path="url(#{sid})"'))
    g += E(cx, top, RX, RY, WAX_D)                                                                # the open top, seen into
    g += E(cx, top + 2 * s, RX * .84, RY * .78, mix(WAX, WAX_D, .5))
    g += E(cx - RX * .22, top - RY * .16, RX * .42, RY * .34, WAX_L, ' opacity="0.85"')
    g += stroke(f"M{n(cx)},{n(top + 3 * s)} C{n(cx + 5 * s)},{n(top - 12 * s)} {n(cx - 5 * s)},{n(top - 23 * s)} "
                f"{n(cx)},{n(top - 34 * s)}", WICK, 8 * s)                                        # the wick
    g += C(cx, top - 34 * s, 4.5 * s, WICK_L)
    return g


def smoke_wisp(cx, base_y, s, seed=1):
    """A soft wisp of smoke rising from a just-blown-out candle. (cx, base_y) = the foot (the candle's flame point)."""
    r = random.Random(seed)
    g = ""
    for i, (dx, h, w, op) in enumerate(((0, 300, 22, .5), (-16, 236, 16, .38), (18, 190, 13, .3))):
        x0, y0 = cx + dx * s, base_y - 6 * s
        H = h * s
        d = (f"M{n(x0)},{n(y0)} C{n(x0 - 34 * s)},{n(y0 - H * .28)} {n(x0 + 40 * s)},{n(y0 - H * .5)} "
             f"{n(x0 - 6 * s)},{n(y0 - H * .74)} C{n(x0 - 40 * s)},{n(y0 - H * .9)} {n(x0 + 18 * s)},{n(y0 - H * .96)} {n(x0 + 6 * s)},{n(y0 - H)}")
        g += stroke(d, SMOKE_1 if i == 0 else SMOKE_2, w * s, f' opacity="{op}"')
    for _ in range(5):                                          # a few loose puffs at the top
        a = r.uniform(-.9, .9)
        g += E(cx + a * 52 * s, base_y - r.uniform(150, 290) * s, r.uniform(12, 24) * s, r.uniform(8, 16) * s,
               SMOKE_2, f' opacity="{r.uniform(.18, .34):.2f}"')
    return g


def mini_cake(cx, cy, s, kind="pink", candles=True):
    """A small frosted birthday cake with candles, seen from the front-above. (cx, cy) = the centre of the top face,
    about 250 wide at s = 1. No filter references, so it can be pasted into the card and the prep photo frame."""
    col, col_l, col_d = FROST[kind]
    g = ""
    if candles:
        for dx, hh in ((-54, 74), (-18, 86), (20, 84), (54, 70)):
            bx, by = cx + dx * s, cy - 4 * s
            g += E(bx + 4 * s, by + 2 * s, 9 * s, 3 * s, SH, ' opacity="0.22"')
            g += P(f"M{n(bx - 8 * s)},{n(by)} L{n(bx - 8 * s)},{n(by - hh * s)} L{n(bx + 8 * s)},{n(by - hh * s)} L{n(bx + 8 * s)},{n(by)}Z", WAX_D)
            g += P(f"M{n(bx - 6 * s)},{n(by)} L{n(bx - 6 * s)},{n(by - hh * s)} L{n(bx + 2 * s)},{n(by - hh * s)} L{n(bx + 2 * s)},{n(by)}Z", WAX)
            for i in range(3):
                yy = by - hh * s * (.25 + i * .28)
                g += P(f"M{n(bx - 8 * s)},{n(yy)} L{n(bx + 8 * s)},{n(yy - 6 * s)} L{n(bx + 8 * s)},{n(yy + 3 * s)} L{n(bx - 8 * s)},{n(yy + 9 * s)}Z", STRIPE)
            g += E(bx, by - hh * s, 8 * s, 3 * s, WAX_L)
            g += flame_shape(bx, by - (hh + 5) * s, .2 * s)
    g += E(cx, cy + 96 * s, 130 * s, 22 * s, "#E6DCCB") + E(cx, cy + 92 * s, 124 * s, 18 * s, WHITE)     # the plate
    body = (f"M{n(cx - 110 * s)},{n(cy)} L{n(cx - 110 * s)},{n(cy + 62 * s)} "
            f"C{n(cx - 110 * s)},{n(cy + 86 * s)} {n(cx + 110 * s)},{n(cy + 86 * s)} {n(cx + 110 * s)},{n(cy + 62 * s)} L{n(cx + 110 * s)},{n(cy)}Z")
    g += P(body, CRU_D)                                                                                   # the sponge sides
    g += P(f"M{n(cx - 104 * s)},{n(cy + 10 * s)} L{n(cx - 104 * s)},{n(cy + 58 * s)} C{n(cx - 104 * s)},{n(cy + 76 * s)} "
           f"{n(cx + 40 * s)},{n(cy + 80 * s)} {n(cx + 40 * s)},{n(cy + 58 * s)} L{n(cx + 40 * s)},{n(cy + 10 * s)}Z", SPG)
    g += P(f"M{n(cx - 104 * s)},{n(cy + 26 * s)} C{n(cx - 40 * s)},{n(cy + 38 * s)} {n(cx + 20 * s)},{n(cy + 34 * s)} {n(cx + 40 * s)},{n(cy + 26 * s)} "
           f"L{n(cx + 40 * s)},{n(cy + 40 * s)} C{n(cx - 20 * s)},{n(cy + 50 * s)} {n(cx - 60 * s)},{n(cy + 48 * s)} {n(cx - 104 * s)},{n(cy + 40 * s)}Z",
           col, ' opacity="0.9"')                                                                          # a jam/frosting layer
    # the frosting on top, drooping over the edge
    g += P(f"M{n(cx - 112 * s)},{n(cy - 2 * s)} C{n(cx - 96 * s)},{n(cy + 30 * s)} {n(cx - 78 * s)},{n(cy + 8 * s)} {n(cx - 60 * s)},{n(cy + 24 * s)} "
           f"C{n(cx - 42 * s)},{n(cy + 40 * s)} {n(cx - 16 * s)},{n(cy + 10 * s)} {n(cx + 8 * s)},{n(cy + 26 * s)} "
           f"C{n(cx + 32 * s)},{n(cy + 42 * s)} {n(cx + 62 * s)},{n(cy + 8 * s)} {n(cx + 84 * s)},{n(cy + 26 * s)} "
           f"C{n(cx + 100 * s)},{n(cy + 38 * s)} {n(cx + 110 * s)},{n(cy + 18 * s)} {n(cx + 112 * s)},{n(cy - 2 * s)} "
           f"A{n(112 * s)},{n(30 * s)} 0 0 0 {n(cx - 112 * s)},{n(cy - 2 * s)}Z", col_d)
    g += E(cx, cy - 4 * s, 112 * s, 30 * s, col)
    g += E(cx - 22 * s, cy - 10 * s, 64 * s, 14 * s, col_l, ' opacity="0.6"')
    for dx, dy, cc in ((-72, -2, CANDY), (-30, 6, MUSTARD), (14, -8, GREEN), (58, 2, CANDY), (78, -8, CORAL), (-52, -12, CORAL)):
        g += C(cx + dx * s, cy + dy * s, 7 * s, cc)
    return g


def save(name, s):
    """Write one SVG into images-b-cake/ (never anywhere else). Returns size in bytes."""
    assert not any(f in s for f in FORBID), name
    path = os.path.join(CAKE_DIR, name + ".svg")
    assert os.path.dirname(os.path.abspath(path)) == CAKE_DIR, path
    with open(path, "w", encoding="utf8") as f:
        f.write(s)
    size = len(s.encode("utf8"))
    print(f"{name:20s} {size / 1024:6.1f} KB" + ("  OVER BUDGET" if size > 60 * 1024 else ""))
    return size


def run(items):
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    for name, fn in items.items():
        if not only or name in only:
            save(name, fn())
