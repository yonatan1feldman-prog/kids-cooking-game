# Shared kit for images-b-pancakes (the fifth recipe: pancakes).
# Wraps the smoothie kit (images-b-smoothie/tools/smoothiekit.py) READ-ONLY, which wraps the cookie, salad and prep kits and the
# style-B kit (images-b/tools/pb.py palette, paper grain, torn edge, shadows). Bytecode caching is off, so importing writes nothing
# into the other folders. It only adds the pancake / stove / syrup colours, the shared pancake-top drawing, the shared geometry
# and a save() that writes into images-b-pancakes/ only.
import sys, os, re, math, random
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
PANC = os.path.normpath(os.path.join(HERE, ".."))
MTOOLS = os.path.normpath(os.path.join(HERE, "..", "..", "images-b-smoothie", "tools"))
sys.path.insert(0, MTOOLS)
from smoothiekit import *                    # noqa: F401,F403  pb palette + helpers, prep/salad/cookie/smoothie helpers
import smoothiekit as MK                     # noqa: E402
import saladkit as SK                        # noqa: E402
from saladkit import PA, PB, gen_items, gen_kitchen   # noqa: F401,E402

FORBID = SK.FORBID

# ---- batter / pancake colours (warm creams and golds that sit between the pb dough and crust colours) ----
BAT, BAT_L, BAT_D = "#FAE0A0", "#FFF1C8", "#E9C477"          # runny batter (raw)
MILKP, MILKP_D = "#F4F8F8", "#C9D8DA"                          # milk in the bowl (cool white, blue-grey shade: set apart from the warm flour)
SET, SET_L, SET_D = "#F6D48C", "#FBE6B4", "#E3B563"          # raw top of a setting pancake (bubbles stage)
GOLD, GOLD_L, GOLD_D, GOLD_DD = "#E7A043", "#F4C574", "#C9802F", "#A8662A"   # cooked golden side
EDGE, EDGE_D = "#F2CC80", "#D69A48"                            # pale cooked rim / stack sides
SYR, SYR_L, SYR_D = "#D47C26", "#F5B058", "#9C5018"           # maple syrup (amber; review fix: lighter, it read as chocolate)
BLU, BLU_L, BLU_D, BLU_B = "#4F62B0", "#8496D8", "#2F3B7A", "#B7C2E8"   # blueberry skin, light, dark, bloom
# pan + stove
PAN, PAN_L, PAN_D = "#4C5157", "#6A7078", "#34383D"           # non-stick pan surface
HOB, HOB_L, HOB_D = "#F5EEDF", "#FFFBF2", "#E0D4BC"           # cream enamel cooktop
GRATE, GRATE_L = "#5A534F", "#8C837D"                         # cast-iron grate / burner (review fix: softer than near-black)
FL_B, FL_BL, FL_BD, FL_O, FL_Y = "#4FA6EC", "#9ED3FA", "#2D7CC4", "#FF9A3C", "#FFD35A"   # flame blue, light, dark, orange, yellow

# ---- shared geometry (see README-pancakes.md) ----
BOWL = (640, 520); IC, IRX, IRY = PA.IC, PA.IRX, PA.IRY       # the prep-bowl frame / opening (320,176) rx 262 ry 74
STOVE = (1200, 920); BURNER = (480, 450); KNOB_SEAT = (1040, 752); BURNER2 = (1040, 250)
PAN_BOX = (1240, 800); PAN_C = (400, 400); PAN_R = 372; PAN_IN = 336    # pan disc centre / outer rim radius / cooking surface
PUD_BOX = 680; PUD_C = (340, 340); PUD_OFF = (PAN_C[0] - PUD_C[0], PAN_C[1] - PUD_C[1])     # puddle family: top-left in pan units
CAKE_R = 240                                                   # full pancake radius in the puddle frame (= pan scale)
PUD_R = {1: 118, 2: 184, 3: 240}
FLAME_BOX = 1000; FLAME_C = (500, 500); FLAME_IN, FLAME_OUT = 336, 452
KNOB_BOX = 280; KNOB_C = (140, 140)
PLATE = 720; PLATE_C = (360, 360); TOP_R = 290; PLATE_R = 334
LADLE = (400, 640); LADLE_POUR = (40, 458)
SYRUP = (260, 520); SYRUP_TIP = (130, 506)
STAMP = 140


def pancake_top(p, cx, cy, R, kind, seed=1, clip=True):
    """A pancake seen from straight above, centre (cx, cy), radius R.
    kind: 'wet' (fresh glossy batter puddle), 'set' (raw top with bubbles), 'golden' (the cooked, flipped side)."""
    r = random.Random(seed)
    g = ""
    if kind == "wet":
        out = gen_items.wobp(cx, cy, R, R * .985, .035 if R < 150 else .022, seed, 30)
        g += P(smooth(out), BAT_D)
        g += P(wob(cx - R * .02, cy - R * .03, R * .95, R * .93, .02, seed + 1, 30), BAT)
        g += P(wob(cx - R * .16, cy - R * .2, R * .6, R * .5, .05, seed + 2, 22), BAT_L, ' opacity="0.7"')
        g += P(f"M{n(cx - R * .72)},{n(cy - R * .12)} Q{n(cx - R * .62)},{n(cy - R * .62)} {n(cx - R * .12)},{n(cy - R * .74)} "
               f"Q{n(cx - R * .5)},{n(cy - R * .54)} {n(cx - R * .6)},{n(cy - R * .08)}Z", WHITE, ' opacity="0.85"')     # glossy streak
        g += C(cx + R * .42, cy - R * .38, R * .045, WHITE, ' opacity="0.8"')
        return g, out
    if kind == "set":
        out = gen_items.wobp(cx, cy, R, R * .99, .018, seed, 36)
        g += P(smooth(out), EDGE_D)                                                             # the edge already browning
        g += P(wob(cx, cy, R * .965, R * .955, .015, seed + 1, 36), EDGE)
        g += P(wob(cx - R * .01, cy - R * .01, R * .9, R * .89, .02, seed + 2, 34), SET)
        g += P(wob(cx - R * .2, cy - R * .22, R * .52, R * .44, .05, seed + 3, 22), SET_L, ' opacity="0.8"')
        spots = []
        for i in range(60):
            a, rr = r.uniform(0, 6.283), math.sqrt(r.random()) * R * .78
            x, y = cx + math.cos(a) * rr, cy + math.sin(a) * rr
            if all(math.hypot(x - u, y - v) > R * .13 for u, v in spots):
                spots.append((x, y))
            if len(spots) >= 20: break
        for i, (x, y) in enumerate(spots):
            s = R * r.uniform(.035, .06)
            if i % 3 == 0:                                            # popped: a little dark hole with a pale ring
                g += C(x, y, s * 1.15, SET_D) + C(x + s * .1, y + s * .15, s * .6, GOLD_DD, ' opacity="0.8"')
            else:                                                     # a bubble: shaded ring + a bright glint
                g += C(x, y + s * .15, s, SET_D) + C(x, y, s * .82, SET_L) + C(x - s * .3, y - s * .32, s * .28, WHITE, ' opacity="0.95"')
        return g, out
    # golden
    out = gen_items.wobp(cx, cy, R, R * .99, .014, seed, 40)
    g += P(smooth(out), EDGE_D)
    g += P(wob(cx, cy, R * .975, R * .968, .012, seed + 1, 40), EDGE)
    g += P(wob(cx + R * .005, cy + R * .01, R * .9, R * .895, .02, seed + 2, 36), GOLD_L)
    # review fix 1: an even golden-brown centre fading to a lighter rim (was: dark blotches that read as burnt / leopard spots)
    inner = C(cx + R * .02, cy + R * .03, R * .7, GOLD) + C(cx + R * .04, cy + R * .05, R * .42, mix(GOLD, GOLD_D, .35), ' opacity="0.8"')
    for i in range(9):                                                # a few soft, faint browned patches
        a, rr = r.uniform(0, 6.283), math.sqrt(r.random()) * R * .55
        inner += P(wob(cx + math.cos(a) * rr, cy + math.sin(a) * rr, R * r.uniform(.1, .16), R * r.uniform(.07, .11), .12, seed + 10 + i, 12, r.uniform(0, 180)),
                   GOLD_D, ' opacity="0.28"')
    cid = f"{p}gc{seed}"
    ind = smooth(gen_items.wobp(cx + R * .005, cy + R * .01, R * .9, R * .895, .02, seed + 2, 36))
    g += (f'<clipPath id="{cid}"><path d="{ind}"/></clipPath>'
          + G(G(inner, p + "bl") if clip else inner, None, f' clip-path="url(#{cid})"'))
    g += P(wob(cx - R * .3, cy - R * .34, R * .26, R * .1, .1, seed + 60, 12, -35), "#FFE2A4", ' opacity="0.7"')
    return g, out


def ring_d(cx, cy, ro, ri, k=48):
    o = [(cx + math.cos(i / k * 6.2832) * ro, cy + math.sin(i / k * 6.2832) * ro) for i in range(k)]
    i_ = [(cx + math.cos(i / k * 6.2832) * ri, cy + math.sin(i / k * 6.2832) * ri) for i in range(k)]
    return smooth(o) + " " + smooth(i_)


def mini_stack(cx, cy, s, pre=""):
    """A small side-view stack of three pancakes with syrup, a butter pat and a berry (card, frame sticker).
    Centre of the top pancake (cx, cy), scale s (about 200 wide at s=1)."""
    g = E(cx, cy + 92 * s, 118 * s, 20 * s, "#E6DCCB") + E(cx, cy + 88 * s, 112 * s, 16 * s, WHITE)          # plate
    for i, dy in enumerate((64, 40, 16)):
        g += E(cx, cy + dy * s + 6 * s, 96 * s, 22 * s, EDGE_D) + E(cx, cy + dy * s, 96 * s, 22 * s, GOLD) + E(cx, cy + dy * s - 7 * s, 92 * s, 17 * s, EDGE)
    g += E(cx, cy - 6 * s, 92 * s, 20 * s, GOLD)
    g += E(cx - 6 * s, cy - 9 * s, 70 * s, 12 * s, GOLD_L, ' opacity="0.6"')
    g += P(f"M{n(cx - 70 * s)},{n(cy - 10 * s)} Q{n(cx - 60 * s)},{n(cy - 24 * s)} {n(cx)},{n(cy - 24 * s)} Q{n(cx + 64 * s)},{n(cy - 22 * s)} {n(cx + 74 * s)},{n(cy - 6 * s)} "
           f"Q{n(cx + 78 * s)},{n(cy + 16 * s)} {n(cx + 70 * s)},{n(cy + 34 * s)} Q{n(cx + 62 * s)},{n(cy + 20 * s)} {n(cx + 50 * s)},{n(cy + 6 * s)} "
           f"Q{n(cx - 20 * s)},{n(cy + 14 * s)} {n(cx - 60 * s)},{n(cy + 6 * s)} Q{n(cx - 66 * s)},{n(cy + 30 * s)} {n(cx - 74 * s)},{n(cy + 22 * s)}Z", SYR)   # syrup
    g += P(f"M{n(cx - 40 * s)},{n(cy - 16 * s)} Q{n(cx)},{n(cy - 22 * s)} {n(cx + 30 * s)},{n(cy - 16 * s)}", "none", f' stroke="{SYR_L}" stroke-width="{n(4 * s)}" stroke-linecap="round"')
    g += P(f"M{n(cx - 20 * s)},{n(cy - 34 * s)} L{n(cx + 18 * s)},{n(cy - 34 * s)} L{n(cx + 24 * s)},{n(cy - 14 * s)} L{n(cx - 14 * s)},{n(cy - 12 * s)}Z", BUTTER_D)
    g += P(f"M{n(cx - 22 * s)},{n(cy - 40 * s)} L{n(cx + 16 * s)},{n(cy - 42 * s)} L{n(cx + 18 * s)},{n(cy - 30 * s)} L{n(cx - 20 * s)},{n(cy - 28 * s)}Z", BUTTER_L)
    g += C(cx + 46 * s, cy - 18 * s, 12 * s, BLU_D) + C(cx + 45 * s, cy - 20 * s, 10.5 * s, BLU) + C(cx + 42 * s, cy - 24 * s, 3 * s, BLU_B)
    g += C(cx - 48 * s, cy - 14 * s, 10 * s, BLU_D) + C(cx - 49 * s, cy - 16 * s, 8.8 * s, BLU) + C(cx - 51 * s, cy - 19 * s, 2.6 * s, BLU_B)
    return g


def save(name, s):
    """Write one SVG into images-b-pancakes/ (never anywhere else). Returns size in bytes."""
    assert not any(f in s for f in FORBID), name
    path = os.path.join(PANC, name + ".svg")
    assert os.path.dirname(os.path.abspath(path)) == PANC
    with open(path, "w", encoding="utf8") as f:
        f.write(s)
    size = len(s.encode("utf8"))
    print(f"{name:24s} {size / 1024:6.1f} KB" + ("  OVER BUDGET" if size > 60 * 1024 else ""))
    return size


def run(items):
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    for name, fn in items.items():
        if not only or name in only:
            save(name, fn())
