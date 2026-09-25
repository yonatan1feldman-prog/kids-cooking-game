# images-b-cake, part A: the batter in the big prep bowl (cake-batter-0..3), the round cake pan seen from above
# (cake-pan / cake-pan-full) and the baked cake on its plate (cake-baked / cake-plate).
# Run: python tools/gen_cake_a.py [names...]     (writes into images-b-cake/ only)
import math, random, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cakekit import *  # noqa: F401,F403


# ================= THE BATTER IN THE PREP BOWL (640x520; = prep-bowl-back/-front and sauce-stage-0..3) =================
# Contents are clipped to the opening (320,176) rx 262 ry 74, so they sit in the bowl exactly like the prep sauce stages.
LEVEL = {0: (320, 196, 226, 52), 1: (320, 192, 236, 56), 2: (320, 188, 246, 60), 3: (320, 184, 252, 64)}


def cake_batter(stage):
    p = f"cb{stage}-"
    r = random.Random(stage * 17 + 3)
    cx, cy, rx, ry = LEVEL[stage]
    L = []
    pool = ""
    if stage == 0:
        # dry: a pale mound of flour and sugar, butter lumps on it, a whole yolk on top. Nothing is stirred yet.
        pool += P(wob(cx, cy + 4, rx, ry, .03, 3, 30), SUG_D)
        pool += P(wob(cx - 4, cy - 2, rx * .96, ry * .92, .035, 4, 30), SUG)
        pool += P(wob(cx - 30, cy - 16, rx * .6, ry * .5, .06, 5, 24), WHITE, ' opacity="0.8"')          # the floury crown
        pool += speckle(cx, cy, rx * .82, ry * .7, 40, 7, SUG_D, .8, (2.2, 4.2))                          # sugar crystals
        for x, y, s_, sd in ((196, 188, 34, 11), (262, 168, 30, 13), (392, 180, 32, 17), (330, 206, 27, 19), (448, 196, 24, 23)):
            pool += batter_lump(x, y, s_, sd, r.uniform(-20, 20))                                        # butter / creamed lumps
        pool += C(372, 152, 33, YOLK_D) + C(372, 149, 30, YOLK) + P(wob(362, 140, 13, 8, .1, 9, 10, -30), YOLK_L, ' opacity="0.85"')
    else:
        pool += P(wob(cx, cy + 4, rx, ry, .02, stage, 30), CB_DD)
        pool += P(wob(cx - 5, cy, rx * .96, ry * .9, .022, stage + 1, 30), CB_D if stage == 1 else CB)
        if stage == 1:
            # first stir: yellow yolk streaks swirling through a pale, lumpy mix, dry flour still showing
            for i, (a0, rr) in enumerate(((0.4, .74), (2.1, .56), (3.9, .68), (5.3, .5))):
                x0, y0 = cx + math.cos(a0) * rx * rr, cy + math.sin(a0) * ry * rr
                x1, y1 = cx + math.cos(a0 + 1.5) * rx * rr * .5, cy + math.sin(a0 + 1.5) * ry * rr * .5
                pool += stroke(f"M{n(x0)},{n(y0)} Q{n(cx + math.cos(a0 + .8) * rx * .9)},{n(cy + math.sin(a0 + .8) * ry * .9)} {n(x1)},{n(y1)}",
                               YOLK, 15, ' opacity="0.85"')
            for _ in range(7):
                a, d = r.uniform(0, 6.283), math.sqrt(r.random())
                pool += P(wob(cx + math.cos(a) * rx * .78 * d, cy + math.sin(a) * ry * .7 * d, r.uniform(14, 26), r.uniform(9, 16),
                              .1, r.randint(1, 999), 12), SUG, ' opacity="0.85"')                        # dry flour patches
            for x, y, s_, sd in ((214, 190, 26, 31), (300, 168, 22, 33), (386, 194, 24, 37), (268, 216, 19, 39), (440, 184, 18, 41)):
                pool += batter_lump(x, y, s_, sd, r.uniform(-25, 25))
        elif stage == 2:
            # nearly mixed: a thick pale batter, a few lumps left, the stirring swirl still visible
            pool += P(wob(cx - 26, cy - 14, rx * .6, ry * .46, .04, 44, 24), CB_L, ' opacity="0.6"')
            d = "M" + " L".join(f"{n(cx + math.cos(i / 8 * 6.283) * (rx * .8 - i * 7))},{n(cy + math.sin(i / 8 * 6.283) * (ry * .74 - i * 2))}"
                                for i in range(22))
            pool += stroke(d, CB_D, 13, ' opacity="0.45"')
            for x, y, s_, sd in ((228, 186, 19, 51), (312, 170, 16, 53), (392, 190, 17, 55), (272, 210, 13, 57),
                                 (430, 178, 12, 59), (176, 200, 12, 61)):
                pool += batter_lump(x, y, s_, sd, r.uniform(-25, 25))
            pool += speckle(cx, cy, rx * .8, ry * .66, 18, 63, VAN, .4, (1.6, 2.8))
        else:
            # smooth: a level glossy pool with a folding ribbon and vanilla specks
            pool += P(wob(cx - 6, cy - 4, rx * .9, ry * .82, .018, 71, 30), mix(CB, CB_L, .35))
            pool += P(wob(cx - 40, cy - 18, rx * .56, ry * .4, .035, 73, 24), CB_L, ' opacity="0.75"')
            ribbon = (f"M{n(cx - rx * .72)},{n(cy + ry * .1)} C{n(cx - rx * .36)},{n(cy - ry * .56)} {n(cx + rx * .3)},{n(cy - ry * .5)} "
                      f"{n(cx + rx * .66)},{n(cy - ry * .04)} C{n(cx + rx * .3)},{n(cy - ry * .2)} {n(cx - rx * .3)},{n(cy - ry * .22)} "
                      f"{n(cx - rx * .68)},{n(cy + ry * .26)}Z")
            pool += P(ribbon, CB_L, ' opacity="0.85"')
            pool += stroke(f"M{n(cx - rx * .7)},{n(cy + ry * .16)} C{n(cx - rx * .3)},{n(cy - ry * .48)} {n(cx + rx * .3)},{n(cy - ry * .44)} "
                           f"{n(cx + rx * .64)},{n(cy + ry * .02)}", CB_D, 6, ' opacity="0.5"')
            pool += speckle(cx, cy, rx * .8, ry * .68, 34, 77, VAN, .5, (1.8, 3.2))
            pool += P(f"M{n(cx - rx * .6)},{n(cy - ry * .3)} Q{n(cx - rx * .2)},{n(cy - ry * .78)} {n(cx + rx * .18)},{n(cy - ry * .6)} "
                      f"Q{n(cx - rx * .2)},{n(cy - ry * .42)} {n(cx - rx * .56)},{n(cy - ry * .12)}Z", WHITE, ' opacity="0.42"')
    L.append(clip_bowl(p, G(pool, p + "sh")))
    return doc(p, BOWL[0], BOWL[1], "".join(L), material="smooth", seed=201 + stage, sh=(4, 3.5, .33), blur=6)


# ================= THE CAKE PAN FROM ABOVE (800x800, one frame for cake-pan and cake-pan-full) =================
def cake_pan(full):
    """A round cake pan seen from straight above. Batter window = circle centre (400,400) r 334 (= the baked cake's radius),
    so at the same scale the cake that comes out of the pan fills the pan's floor exactly."""
    p = "cpf-" if full else "cpe-"
    cx, cy = PAN_C
    out = gen_items.wobp(cx, cy, PAN_R, PAN_R * .997, .004, 3, 56)
    L = [G(E(cx + 6, cy + 20, PAN_R * .98, PAN_R * .95, SH, ' opacity="0.3"'), p + "bl")]      # contact shadow
    grad = (f'<radialGradient id="{p}rg" cx="{cx - 90}" cy="{cy - 110}" r="{PAN_IR * 1.5}" gradientUnits="userSpaceOnUse">'
            f'<stop offset="0" stop-color="#EDF2F0"/><stop offset="0.55" stop-color="{PAN_IN_L}"/>'
            f'<stop offset="1" stop-color="{PAN_IN}"/></radialGradient>')
    L.append(G(P(smooth(out), STEEL_D), p + "cut"))                                            # the outer rim edge
    L.append(P(wob(cx, cy - 2, PAN_R * .985, PAN_R * .98, .005, 5, 52), STEEL))                 # the rim lip
    L.append(P(wob(cx - 3, cy - 5, PAN_R * .955, PAN_R * .95, .005, 7, 52), STEEL_L, ' opacity="0.75"'))
    # review fix 2: the empty pan read as one flat grey disc at game size. The wall is now a wide, clearly darker
    # band between the rim and the floor, and the floor is lighter, so the pan reads as a container that can be filled.
    L.append(G(P(wob(cx, cy, PAN_LIP, PAN_LIP * .995, .005, 9, 50), mix(STEEL_D, SH, .22)), p + "sh"))     # the top of the wall
    L.append(P(wob(cx, cy + 3, PAN_LIP - 4, (PAN_LIP - 4) * .995, .005, 11, 50), mix(STEEL_D, SH, .42)))   # the wall, in shade
    L.append(P(wob(cx - 2, cy - 2, PAN_IR + 6, (PAN_IR + 6) * .995, .005, 12, 50), mix(STEEL_D, SH, .1)))  # its lit far side
    L.append(P(wob(cx, cy, PAN_IR, PAN_IR * .995, .005, 13, 48), f"url(#{p}rg)"))              # the floor (batter window)
    # two faint concentric scuff rings and a broad sheen across the floor
    L.append(gen_items.ring(gen_items.wobp(cx, cy, 250, 249, .004, 15, 44), gen_items.wobp(cx, cy, 245, 244, .004, 16, 44),
                            STEEL_L, ' opacity="0.4"'))
    L.append(gen_items.ring(gen_items.wobp(cx, cy, 140, 139, .005, 17, 40), gen_items.wobp(cx, cy, 136, 135, .005, 18, 40),
                            STEEL_L, ' opacity="0.33"'))
    L.append(P(f"M{cx - 250},{cy - 130} Q{cx - 160},{cy - 290} {cx + 40},{cy - 300} Q{cx - 130},{cy - 232} {cx - 214},{cy - 86}Z",
               WHITE, ' opacity="0.3"'))
    if full:
        r = random.Random(29)
        R = PAN_BAT_R
        bat = P(wob(cx, cy + 4, R, R * .995, .012, 31, 40), CB_DD)                              # the batter's shaded meniscus
        bat += P(wob(cx - 2, cy, R * .97, R * .965, .014, 33, 40), CB_D)
        bat += P(wob(cx - 4, cy - 4, R * .93, R * .925, .016, 35, 38), CB)                      # the level surface
        bat += P(wob(cx - 42, cy - 52, R * .58, R * .5, .035, 37, 28), CB_L, ' opacity="0.65"')  # broad sheen
        bat += P(f"M{cx - 210},{cy - 60} Q{cx - 150},{cy - 200} {cx + 10},{cy - 214} Q{cx - 116},{cy - 158} {cx - 178},{cy - 28}Z",
                 WHITE, ' opacity="0.42"')
        for i in range(3):                                                                      # the last folds of the ribbon
            a = 1.1 + i * 1.9
            x0, y0 = cx + math.cos(a) * R * .62, cy + math.sin(a) * R * .56
            x1, y1 = cx + math.cos(a + 2.0) * R * .5, cy + math.sin(a + 2.0) * R * .45
            bat += stroke(f"M{n(x0)},{n(y0)} Q{n(cx + math.cos(a + 1) * R * .9)},{n(cy + math.sin(a + 1) * R * .82)} {n(x1)},{n(y1)}",
                          CB_L, 16, ' opacity="0.5"')
        bat += speckle(cx, cy, R * .82, R * .78, 46, 39, VAN, .45, (2.0, 3.6))
        for _ in range(9):                                                                      # a few air bubbles
            a, d = r.uniform(0, 6.283), math.sqrt(r.random()) * R * .8
            x, y = cx + math.cos(a) * d, cy + math.sin(a) * d
            bat += C(x, y + 2, r.uniform(5, 9), CB_D, ' opacity="0.6"') + C(x, y, r.uniform(4, 7), CB_L, ' opacity="0.8"')
        cid = f"{p}fl"
        L.append(f'<clipPath id="{cid}"><path d="{wob(cx, cy, PAN_IR - 2, (PAN_IR - 2) * .995, .005, 13, 48)}"/></clipPath>'
                 + G(G(bat, p + "sh"), None, f' clip-path="url(#{cid})"'))
    return doc(p, PAN[0], PAN[1], "".join(L), material="default", seed=221 + full, sh=(5, 4, .3), blur=8, extra_defs=grad,
               paper={"fibre": .09, "tooth": .34, "mottle": .1})


# ================= THE BAKED CAKE (720x720; the pizza dough-flat frame: centre (360,356), r 334) =================
def cake_baked():
    p = "ckb-"
    cx, cy = CAKE_C
    body, out = sponge_top(p, cx, cy, CAKE_R, seed=41)
    gen_items.check_r("cake-baked", "sponge", out, (cx, cy), CAKE_R + 4)
    L = [G(P(smooth(out), CRU_DD), p + "cut"), body]
    return doc(p, CAKE[0], CAKE[1], "".join(L), material="smooth", seed=231, sh=(5, 4, .3), sh2=(7, 7, .22))


# ================= THE CAKE PLATE (820x830; the pizza-board frame: centre (410,408), r 389) =================
def cake_plate():
    """A big white cake plate with a teal rim: the same silhouette, centre and radius as images-b/pizza-board,
    so the cake registers on it exactly as the pizza does on its board."""
    p = "ckp-"
    cx, cy = PLATE_C
    R = PLATE_R
    edge = gen_items.wobp(cx, cy + 5, R, R * .997, .004, 301, 60)
    gen_items.check_r("cake-plate", "plate", edge, (cx, cy), R + 8)
    grad = (f'<radialGradient id="{p}rg" cx="{cx - 110}" cy="{cy - 140}" r="{R * 1.35}" gradientUnits="userSpaceOnUse">'
            f'<stop offset="0" stop-color="#FFFFFF"/><stop offset="0.6" stop-color="{WHITE}"/>'
            f'<stop offset="1" stop-color="#EAE0CF"/></radialGradient>')
    L = [G(E(cx, cy + 22, R * .97, R * .95, SH, ' opacity="0.3"'), p + "bl")]
    L.append(G(P(smooth(edge), "#E4D9C6"), p + "cut"))                                     # the rim's thickness
    L.append(P(wob(cx, cy, R * .985, R * .98, .004, 303, 60), f"url(#{p}rg)"))
    L.append(gen_items.ring(gen_items.wobp(cx, cy, R * .96, R * .955, .004, 305, 56),
                            gen_items.wobp(cx, cy, R * .86, R * .855, .005, 307, 56), TEAL_L, ' opacity="0.9"'))   # teal band
    L.append(gen_items.ring(gen_items.wobp(cx, cy, R * .875, R * .87, .004, 309, 56),
                            gen_items.wobp(cx, cy, R * .855, R * .85, .005, 311, 56), TEAL, ' opacity="0.55"'))
    L.append(G(gen_items.ring(gen_items.wobp(cx, cy, R * .84, R * .835, .005, 313, 52),
                              gen_items.wobp(cx, cy, R * .8, R * .795, .006, 315, 52), "#E4DAC8", ' opacity="0.8"'), p + "bl"))   # the well
    L.append(P(f"M{cx - 300},{cy - 132} Q{cx - 200},{cy - 322} {cx + 40},{cy - 336} Q{cx - 160},{cy - 258} {cx - 254},{cy - 78}Z",
               WHITE, ' opacity="0.55"'))
    L.append(P(f"M{cx + 240},{cy + 160} Q{cx + 160},{cy + 292} {cx - 10},{cy + 318} Q{cx + 140},{cy + 250} {cx + 208},{cy + 118}Z",
               "#E0D4C0", ' opacity="0.45"'))
    r = random.Random(317)
    L.append("".join(C(cx + math.cos(a) * d, cy + math.sin(a) * d, r.uniform(2, 3.4), WHITE, ' opacity="0.7"')
                     for a, d in ((r.uniform(0, 6.283), r.uniform(60, R * .78)) for _ in range(8))))
    return doc(p, PLATE[0], PLATE[1], "".join(L), material="smooth", seed=241, sh=(5, 4, .3), blur=8, extra_defs=grad)


ITEMS = {f"cake-batter-{i}": (lambda i=i: cake_batter(i)) for i in range(4)}
ITEMS.update({"cake-pan": lambda: cake_pan(False), "cake-pan-full": lambda: cake_pan(True),
              "cake-baked": cake_baked, "cake-plate": cake_plate})

if __name__ == "__main__":
    run(ITEMS)
    for nm, rows in gen_items.BOXES.items():
        for label, box, exp, ok in rows:
            print(("  ok  " if ok else "  FAIL"), nm, label, box, exp)
