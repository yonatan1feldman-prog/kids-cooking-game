# images-b-prep, part A: hand washing, kneading, sauce bowl + stages, wooden spoon.
# Run: python tools/gen_prep_a.py   (writes into images-b-prep/ only)
import math, random, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from prepkit import *  # noqa: F401,F403

WATER, WATER_L, WATER_D = "#8ACFE3", "#D6F1F8", "#5AAFCB"
CHROME, CHROME_D, CHROME_L = gen_kitchen.CHROME, gen_kitchen.CHROME_D, gen_kitchen.CHROME_L
ENAMEL, ENAMEL_D = "#FBF5EA", "#E6DAC4"
BASIN, BASIN_D = "#D3E9E6", "#A9CDC8"


# ================= SINK BASIN (900x560) =================
def sink_basin():
    p = "sk-"
    L = [G(E(450, 520, 420, 26, SH, ' opacity="0.3"'), p + "bl")]
    L.append(G(P(wrect(30, 64, 840, 452, 150, 1.2, 1, 40), ENAMEL_D), p + "cut"))          # rim + front thickness
    L.append(P(wrect(34, 58, 832, 432, 146, 1.2, 2, 40), ENAMEL))                            # rim top
    L.append(P(wrect(170, 70, 560, 14, 7, .8, 3), WHITE, ' opacity="0.8"'))                  # back-rim light
    L.append(P(wrect(66, 88, 768, 382, 132, .8, 4, 40) + " " + wrect(76, 98, 748, 362, 124, .8, 5, 40), TEAL_L, ' fill-rule="evenodd" opacity="0.85"'))  # teal pin-stripe
    # basin: dark back wall (depth) then the lighter floor, water pooled at the bottom
    L.append(G(P(wrect(100, 112, 700, 336, 124, 1, 6, 40), BASIN_D), p + "sh2"))
    L.append(P(wrect(112, 150, 676, 290, 112, 1, 7, 40), BASIN))
    L.append(P("M150,168 Q450,128 750,168 Q720,150 450,146 Q180,150 150,168Z", mix(BASIN_D, "#6E9E98", .3), ' opacity="0.5"'))
    L.append(P(wob(450, 352, 300, 74, .02, 8, 30), WATER, ' opacity="0.55"'))
    L.append(ring(wobp(450, 352, 250, 58, .02, 9, 30), wobp(450, 352, 238, 52, .02, 10, 30), WATER_L, ' opacity="0.8"'))
    L.append(ring(wobp(450, 352, 150, 34, .03, 11, 26), wobp(450, 352, 140, 29, .03, 12, 26), WATER_L, ' opacity="0.8"'))
    # drain
    L.append(G(E(450, 356, 40, 14, CHROME_D) + E(450, 354, 34, 11, CHROME) + "".join(
        P(wrect(438 + i * 8, 350, 4, 9, 2, .2, 20 + i), CHROME_D) for i in range(4)), p + "sh"))
    # glaze highlight on the front wall of the basin + front lip shine
    L.append(P("M140,300 Q150,390 238,428 Q176,384 164,300Z", WHITE, ' opacity="0.6"'))
    L.append(P("M170,478 Q450,494 730,478 L728,486 Q450,502 172,486Z", WHITE, ' opacity="0.7"'))
    return doc(p, 900, 560, "".join(L), material="default", seed=61, sh=(4, 3.5, .3), sh2=(7, 6, .28))


# ================= FAUCET (320x400) =================
FAUCET_OUT = (262, 176)   # centre of the spout opening (water starts here)


def faucet():
    p = "fc-"
    L = [G(E(120, 380, 100, 12, SH, ' opacity="0.35"'), p + "bl")]
    base = P(wrect(56, 300, 128, 76, 30, .6, 1), CHROME_D) + P(wrect(60, 294, 120, 70, 28, .6, 2), CHROME)
    # handles: two round knobs with a red and a blue dot
    for x, col in ((34, RED), (206, "#5BA8D8")):
        base += P(wob(x, 322, 30, 22, .03, x), CHROME_D) + P(wob(x, 318, 27, 19, .03, x + 1), CHROME) + E(x, 314, 10, 7, col)
    L.append(G(base, p + "cut"))
    # gooseneck: thick tube up then arching over to the right, ending in a downward spout
    neck = smooth_open([(120, 300), (120, 180), (126, 92), (170, 58), (226, 62), (258, 100), (262, 150)])
    L.append(G(stroke(neck, CHROME_D, 54) + stroke(neck, CHROME, 44), p + "cut"))
    L.append(stroke(smooth_open([(106, 280), (106, 180), (112, 104), (150, 72), (196, 66)]), CHROME_L, 10, ' opacity="0.9"'))
    L.append(G(P(wrect(236, 142, 52, 40, 12, .4, 3), CHROME_D) + E(262, 178, 22, 7, "#5E6967"), p + "sh"))
    L.append(P(wrect(66, 300, 20, 56, 10, .4, 4), CHROME_L, ' opacity="0.8"'))
    return doc(p, 320, 400, "".join(L), material="default", seed=63, sh=(4, 3.5, .33))


# ================= WATER STREAM (140x420) =================
def water_stream():
    p = "ws-"
    r = random.Random(3)
    lft = [(70 - 20 - t * 8 + r.uniform(-1.5, 1.5), 4 + t * 360) for t in [i / 8 for i in range(9)]]
    rgt = [(70 + 20 + t * 8 + r.uniform(-1.5, 1.5), 4 + t * 360) for t in [i / 8 for i in range(9)]]
    body = smooth(lft + [(70, 372)] + rgt[::-1] + [(70, 0)], 1 / 7)
    L = [G(P(body, WATER, ' opacity="0.9"'), p + "cut")]
    L.append(stroke(smooth_open([(60, 10), (57, 120), (55, 240), (52, 340)]), WATER_L, 9, ' opacity="0.9"'))
    L.append(stroke(smooth_open([(82, 40), (84, 150), (86, 230)]), WHITE, 4, ' opacity="0.7"'))
    L.append(stroke(smooth_open([(74, 260), (76, 330)]), WATER_D, 5, ' opacity="0.5"'))
    # splash at the bottom
    sp = E(70, 384, 52, 14, WATER, ' opacity="0.85"') + E(70, 381, 36, 8, WATER_L)
    for x, y, rr in ((18, 364, 7), (122, 362, 7), (34, 344, 5), (108, 342, 5.5), (8, 392, 4.5), (132, 394, 4.5)):
        sp += C(x, y, rr, WATER) + C(x - 1.5, y - 1.5, rr * .4, WHITE, ' opacity="0.9"')
    L.append(G(sp, p + "sh"))
    # 240 wide frame (short side >= 240), stream centred at x=120, top of the stream at (120,0)
    return doc(p, 240, 420, '<g transform="translate(50 0)">' + "".join(L) + "</g>", material="smooth", seed=65, sh=(3, 2.5, .22), cut={"rim": 1.8, "rough": 2.5, "op": .18})


# ================= BUBBLE (240x240) =================
def bubble():
    p = "bu-"
    c = 120
    L = [G(P(wob(c, c, 100, 100, .006, 1, 28), "#EAF7F8", ' opacity="0.55"'), p + "cut")]
    # iridescent paper ring: teal / pink / yellow arcs
    L.append(ring(wobp(c, c, 100, 100, .006, 1, 28), wobp(c, c, 89, 89, .01, 2, 28), "#9FD7E0"))
    arc = lambda a0, a1, r0, r1, col, op: P(
        f"M{n(c + math.cos(a0) * r1)},{n(c + math.sin(a0) * r1)} A{r1},{r1} 0 0 1 {n(c + math.cos(a1) * r1)},{n(c + math.sin(a1) * r1)} "
        f"L{n(c + math.cos(a1) * r0)},{n(c + math.sin(a1) * r0)} A{r0},{r0} 0 0 0 {n(c + math.cos(a0) * r0)},{n(c + math.sin(a0) * r0)}Z", col, f' opacity="{op}"')
    L.append(arc(math.radians(20), math.radians(110), 88, 100, "#F4AFC4", .9))
    L.append(arc(math.radians(120), math.radians(170), 89, 99, "#FFE08A", .9))
    L.append(arc(math.radians(-80), math.radians(-10), 89, 99, "#B9E3C6", .9))
    # big glare + small glint (cream paper pieces)
    L.append(G(P("M62,98 Q70,58 112,44 Q86,66 80,104Z", WHITE, ' opacity="0.95"'), p + "sh"))
    L.append(C(150, 58, 9, WHITE, ' opacity="0.95"') + C(168, 162, 6, WHITE, ' opacity="0.7"'))
    return doc(p, 240, 240, "".join(L), material="smooth", seed=67, sh=(3, 3, .22), cut={"rim": 2.2, "rough": 3.5, "op": .2})


# ================= DOUGH KNEAD STAGES (360x300, same frame as dough-ball) =================
def dome(amp, seed, ry=166, k=34):
    """dough-ball silhouette (x 56-304, top 48, base 266) with lumps of amplitude amp."""
    r = random.Random(seed)
    ph = [r.uniform(0, 6.3) for _ in range(3)]
    bump = lambda t: 1 + amp * (math.sin(t * 5 + ph[0]) * .5 + math.sin(t * 9 + ph[1]) * .3 + math.sin(t * 13 + ph[2]) * .2)
    pts = []
    for i in range(k + 1):
        t = i / k * math.pi
        b = bump(t)
        pts.append((180 + 124 * math.cos(t) * (1 + (b - 1) * .6), 214 - ry * math.sin(t) * b))
    for i in range(1, 8):
        t = math.pi + i / 8 * math.pi
        pts.append((180 + 124 * math.cos(t) * (1 - .06 * math.sin(t - math.pi)), 214 + 52 * math.sin(t - math.pi)))
    return pts


def dough_knead(stage):
    p = f"dk{stage}-"
    amp, ry = {1: (.16, 122), 2: (.07, 146), 3: (.0, 166)}[stage]
    col = {1: mix(DOUGH, DOUGH_D, .32), 2: mix(DOUGH, DOUGH_D, .14), 3: DOUGH}[stage]
    pts = dome(amp, 7 + stage, ry)
    d = smooth(pts)
    L = [ground_shadow(180, 272, 145, 14, p, .34), G(E(180, 268, 140, 12, WHITE, ' opacity="0.55"'), p + "bl")]
    if stage == 1:   # loose shaggy crumbs beside the lump
        L.append(G("".join(P(wob(x, y, rx, ry_, .2, 30 + i, 10), col) for i, (x, y, rx, ry_) in
                           enumerate(((38, 256, 16, 10), (320, 258, 13, 9), (300, 238, 9, 7), (60, 240, 8, 6)))), p + "cut"))
    L.append(G(P(d, col), p + "cut"))
    L.append(f'<clipPath id="{p}c"><path d="{d}"/></clipPath>')
    shade = E(190, 262, 150, 40, mix(col, DOUGH_D, .8), ' opacity="0.75"') + E(292, 190, 30, 80, mix(col, DOUGH_D, .7), ' opacity="0.6"')
    folds = ""
    if stage == 1:   # deep folds, cracks and dry flour patches
        for x, y, w, a in ((120, 120, 70, -20), (230, 150, 80, 15), (160, 200, 90, -5), (250, 96, 40, 30)):
            folds += P(f"M{x - w / 2},{y} Q{x},{y - 18} {x + w / 2},{y} Q{x},{y - 6} {x - w / 2},{y}Z", mix(col, "#9A6A36", .45), f' transform="rotate({a} {x} {y})" opacity="0.85"')
        for x, y in ((150, 160), (210, 110), (100, 190)):
            folds += stroke(f"M{x},{y} l10,8 l-4,10 l9,7", mix(col, "#9A6A36", .5), 3.5, ' opacity="0.8"')
    elif stage == 2:  # one soft fold seam, a few creases
        folds += P("M110,150 Q180,122 258,154 Q182,138 110,150Z", mix(col, "#9A6A36", .35), ' opacity="0.7"')
        folds += P("M150,210 Q196,196 236,214 Q196,206 150,210Z", mix(col, "#9A6A36", .3), ' opacity="0.6"')
    L.append(G(G(shade, p + "bl") + folds, None, f' clip-path="url(#{p}c)"'))
    lt = {1: .55, 2: .8, 3: .95}[stage]
    L.append(G(P(wob(146, 118 + (166 - ry) * .5, 70, 44, .05, 3, 18, -30), DOUGH_L, f' opacity="{lt}"'), p + "bl"))
    if stage >= 2:
        L.append(P(wob(122, 104 + (166 - ry) * .5, 22, 12, .08, 4, 12, -34), "#FFF8E6", f' opacity="{.55 if stage == 2 else .9}"'))
    if stage == 3:   # extra satin sheen: the dough is ready
        L.append(P("M92,168 Q96,110 150,82 Q116,118 110,172Z", "#FFF8E6", ' opacity="0.7"'))
    r = random.Random(20 + stage)
    fl = ""
    nfl = {1: 26, 2: 16, 3: 8}[stage]
    for i in range(nfl):
        a = r.uniform(-2.8, -.3); dd = r.uniform(.2, .8)
        fl += C(180 + math.cos(a) * 110 * dd, 150 + math.sin(a) * 90 * dd, r.uniform(2.2, 4.4), WHITE, ' opacity="0.9"')
    if stage == 1:
        fl += P(wob(200, 96, 40, 14, .2, 9, 14, 12), WHITE, ' opacity="0.55"') + P(wob(120, 176, 30, 10, .2, 10, 12, -20), WHITE, ' opacity="0.5"')
    for i in range(16):
        x = r.choice([r.uniform(36, 96), r.uniform(264, 326)]); y = r.uniform(258, 282)
        fl += C(x, y, r.uniform(2, 4.2), WHITE, ' opacity="0.9"')
    L.append(fl)
    return doc(p, 360, 300, "".join(L), material="smooth", seed=41 + stage, sh=(5, 4, .3), blur=7)


# ================= PREP BOWL (640x520, two layers) + SAUCE STAGES (same frame) =================
BC, BRX, BRY = (320, 170), 290, 88          # rim ellipse
IC, IRX, IRY = (320, 176), 262, 74           # inner (opening) ellipse
BODY = "M30,170 C30,340 150,470 320,470 C490,470 610,340 610,170Z"
FRONT = f"M30,170 C30,340 150,470 320,470 C490,470 610,340 610,170 L582,176 A{IRX},{IRY} 0 0 1 58,176Z"
FRONT_RIM = f"M30,170 A{BRX},{BRY} 0 0 0 610,170 L582,176 A{IRX},{IRY} 0 0 1 58,176Z"
# Round 11: the torn-paper edge goes only round the body below the rim (its top = the rim's lower arc, hidden under
# FRONT_RIM). Cut along FRONT, the short edges where the rim meets the back layer showed as white seams on both sides.
FRONT_LOW = f"M30,170 C30,340 150,470 320,470 C490,470 610,340 610,170 A{BRX},{BRY} 0 0 1 30,170Z"


def prep_bowl_back():
    p = "pbb-"
    L = [G(E(320, 486, 250, 20, SH, ' opacity="0.36"'), p + "bl")]
    L.append(G(P(wob(320, 462, 124, 18, .02, 3), TEAL_D), p + "sh"))
    L.append(G(P(BODY, TEAL) + E(*BC, BRX, BRY, TEAL), p + "cut"))
    L.append(E(*BC, BRX, BRY, TEAL_L))
    grad = (f'<linearGradient id="{p}in" x1="0" y1="{IC[1] - IRY}" x2="0" y2="{IC[1] + IRY}" gradientUnits="userSpaceOnUse">'
            f'<stop offset="0" stop-color="{mix(TEAL_D, "#1E4F52", .35)}"/><stop offset="0.55" stop-color="{TEAL_D}"/>'
            f'<stop offset="1" stop-color="{mix(TEAL, TEAL_D, .3)}"/></linearGradient>')
    L.append(E(*IC, IRX, IRY, f"url(#{p}in)"))
    L.append(G(E(320, 214, 200, 36, mix(TEAL, TEAL_L, .3), ' opacity="0.45"'), p + "bl"))  # lit floor
    L.append(P("M92,150 Q200,112 330,108 Q200,122 104,162Z", TEAL_L, ' opacity="0.35"'))
    return doc(p, 640, 520, "".join(L), material="default", seed=71, sh=(4, 3.5, .33), extra_defs=grad)


def prep_bowl_front():
    p = "pbf-"
    L = [G(P(FRONT_LOW, TEAL), p + "cut")]
    L.append(f'<clipPath id="{p}f"><path d="{FRONT}"/></clipPath>')
    inner = P("M40,300 C80,420 190,466 320,466 C450,466 560,420 600,300 C560,396 450,440 320,440 C190,440 80,396 40,300Z", TEAL_D, ' opacity="0.8"')
    band = "M40,272 Q320,356 600,272 L588,316 Q320,404 52,316Z"
    inner += G(P(band, CREAM), p + "sh")
    inner += "".join(C(x, 300 + 44 * (1 - ((x - 320) / 272) ** 2), 9, CORAL) for x in range(80, 580, 48))
    inner += P("M54,214 Q66,318 150,392 Q92,318 86,222Z", TEAL_L, ' opacity="0.75"')
    L.append(G(inner, None, f' clip-path="url(#{p}f)"'))
    L.append(P(FRONT_RIM, TEAL_L))
    L.append(P("M96,226 Q320,272 544,226 Q320,262 96,226Z", WHITE, ' opacity="0.45"'))   # lip shine
    return doc(p, 640, 520, "".join(L), material="default", seed=73, sh=(4, 3.5, .33))


def tomato_side(cx, cy, r, seed, rot=0, stem=True):
    """Whole tomato seen from the side, centre (cx,cy), radius r (paper layers)."""
    g = P(wob(cx, cy, r * 1.08, r, .02, seed, 22), mix(RED_D, "#7A2016", .28))
    g += P(wob(cx - r * .04, cy - r * .05, r * 1.0, r * .92, .02, seed + 1, 22), RED)
    g += P(f"M{n(cx - r * .3)},{n(cy - r * .8)} Q{n(cx - r * .05)},{n(cy)} {n(cx - r * .25)},{n(cy + r * .85)} Q{n(cx + r * .12)},{n(cy)} {n(cx - r * .3)},{n(cy - r * .8)}Z", RED_D, ' opacity="0.35"')
    g += P(f"M{n(cx + r * .35)},{n(cy - r * .78)} Q{n(cx + r * .6)},{n(cy)} {n(cx + r * .38)},{n(cy + r * .82)} Q{n(cx + r * .74)},{n(cy)} {n(cx + r * .35)},{n(cy - r * .78)}Z", RED_D, ' opacity="0.3"')
    g += P(wob(cx - r * .45, cy - r * .35, r * .32, r * .17, .08, seed + 2, 12, -40), RED_L, ' opacity="0.95"')
    g += C(cx - r * .6, cy - r * .1, r * .07, "#FFD9C8", ' opacity="0.9"')
    if stem:   # green calyx star + stem
        pts = []
        for i in range(10):
            a = -math.pi / 2 + i / 10 * 2 * math.pi
            rr = r * (.42 if i % 2 == 0 else .12)
            pts.append((cx + math.cos(a) * rr * 1.25, cy - r * .86 + math.sin(a) * rr * .45))
        g += P(smooth(pts, .12), GREEN_D) + P(smooth([(x, y - 3) for x, y in pts], .12), GREEN)
        g += P(wrect(cx - r * .06, cy - r * 1.1, r * .12, r * .26, r * .06, .4, seed + 3), GREEN_D)
    return f'<g transform="rotate({rot} {n(cx)} {n(cy)})">{g}</g>' if rot else g


def chunk(x, y, s, seed, rot):
    """Squashed tomato piece: skin-side dark, flesh light, a seed pocket."""
    r = random.Random(seed)
    pts = [(x + math.cos(a) * s * r.uniform(.7, 1.15), y + math.sin(a) * s * .7 * r.uniform(.7, 1.15)) for a in [i / 9 * 6.283 for i in range(9)]]
    g = P(smooth(pts, .2), RED_D) + P(smooth([(x + (px - x) * .8, y + (py - y) * .8 - 2) for px, py in pts], .2), RED)
    g += P(wob(x - s * .25, y - s * .22, s * .3, s * .12, .1, seed + 2, 10, rot), RED_L, ' opacity="0.9"')
    g += P(wob(x + s * .1, y + 2, s * .36, s * .2, .1, seed + 1, 10, rot), "#F47A5E")
    g += E(x + s * .05, y - 1, 2.6, 3.6, SEED) + E(x + s * .28, y + 1, 2.6, 3.6, SEED)
    return g


def sauce_stage(stage):
    p = f"ss{stage}-"
    clip = f'<clipPath id="{p}c"><ellipse cx="{IC[0]}" cy="{IC[1]}" rx="{IRX - 2}" ry="{IRY - 2}"/></clipPath>'
    L = []
    r = random.Random(stage * 11)
    if stage == 0:   # five whole tomatoes; the front layer hides their lower halves
        toms = ((190, 190, 78, 1, -8), (330, 168, 84, 5, 4), (460, 192, 76, 9, 10), (256, 232, 80, 13, -4), (398, 236, 78, 17, 6))
        L.append(G("".join(tomato_side(x, y, rr, s, rot) for x, y, rr, s, rot in toms), p + "cut"))
        return doc(p, 640, 520, "".join(L), seed=80, sh=(4, 3.5, .33))
    # mashed stages: a pool of pulp (clipped to the opening) + chunks sticking out of it
    level = {1: (320, 206, 224, 50), 2: (320, 198, 240, 58), 3: (320, 192, 252, 64)}[stage]
    cx, cy, rx, ry = level
    pool = P(wob(cx, cy, rx, ry, .02, stage, 30), SAUCE_D)
    pool += P(wob(cx - 6, cy - 5, rx * .96, ry * .86, .025, stage + 1, 30), SAUCE if stage < 3 else mix(SAUCE, RED, .15))
    if stage == 3:   # smooth, glossy, herbs
        pool += P(wob(cx - 40, cy - 16, rx * .62, ry * .42, .04, 30, 26, -4), SAUCE_L, ' opacity="0.7"')
        pool += P("M150,176 Q230,148 330,150 Q236,162 164,186Z", "#F7A488", ' opacity="0.85"')
        pool += C(418, 176, 7, "#F7A488", ' opacity="0.8"')
        pool += "".join(P(wob(x, y, 7, 3.5, .2, 40 + i, 8, r.uniform(-60, 60)), HERB) for i, (x, y) in enumerate(((220, 210), (300, 186), (380, 214), (452, 196), (262, 236), (350, 240), (190, 190))))
    else:
        pool += P(wob(cx - 30, cy - 12, rx * .5, ry * .34, .05, 31, 20, -6), SAUCE_L, ' opacity="0.6"')
        seeds = "".join(E(r.uniform(cx - rx * .8, cx + rx * .8), r.uniform(cy - ry * .5, cy + ry * .6), 2.8, 4, SEED, f' transform="rotate({r.randint(0, 180)} 0 0)" opacity="0"') for _ in range(0))
        for _ in range(16 if stage == 1 else 22):
            sx, sy = r.uniform(cx - rx * .8, cx + rx * .8), r.uniform(cy - ry * .45, cy + ry * .6)
            pool += E(sx, sy, 2.8, 4, SEED, ' opacity="0.95"')
        pool += seeds
    L.append(clip + G(G(pool, p + "sh"), None, f' clip-path="url(#{p}c)"'))
    if stage == 1:   # big broken halves + chunks, one tomato still almost whole
        L.append(G(tomato_side(430, 178, 62, 3, 18, stem=False)
                   + "".join(chunk(x, y, s, 50 + i, r.uniform(-30, 30)) for i, (x, y, s) in enumerate(((190, 176, 48), (270, 158, 44), (330, 200, 46), (230, 216, 40), (140, 204, 34), (380, 228, 34)))), p + "cut"))
    elif stage == 2:
        L.append(G("".join(chunk(x, y, s, 70 + i, r.uniform(-30, 30)) for i, (x, y, s) in enumerate(((210, 186, 30), (300, 170, 28), (390, 190, 30), (260, 222, 24), (440, 214, 22), (160, 208, 20), (350, 228, 22)))), p + "sh"))
    return doc(p, 640, 520, "".join(L), seed=80 + stage, sh=(4, 3.5, .33))


# ================= WOODEN SPOON (240x620, bowl down) =================
SPOON_ANCHOR = (120, 500)


def spoon_wood():
    p = "sp-"
    L = [G(P(wrect(100, 30, 40, 400, 20, .8, 1), WOOD_D) + P(wob(120, 500, 76, 96, .02, 2, 24), WOOD_D), p + "cut")]
    L.append(P(wrect(102, 28, 34, 396, 17, .6, 3), WOOD))
    L.append(P(wrect(108, 44, 10, 330, 5, .4, 4), WOOD_L, ' opacity="0.9"'))
    L.append(P(wob(120, 496, 70, 90, .02, 5, 24), WOOD))
    L.append(G(P(wob(122, 504, 52, 70, .03, 6, 22), mix(WOOD_D, WOOD, .35)), p + "sh"))           # hollow of the bowl
    L.append(P(wob(106, 480, 18, 30, .08, 7, 12, 10), WOOD_L, ' opacity="0.7"'))
    L.append(P("M96,428 Q120,420 144,428 Q140,440 120,440 Q100,440 96,428Z", WOOD_D, ' opacity="0.6"'))  # neck
    L.append(C(120, 56, 9, WOOD_D))                                                                    # hanging hole
    return doc(p, 240, 620, "".join(L), material="rough", seed=85, sh=(4, 3.5, .33))


ITEMS = {"sink-basin": sink_basin, "faucet": faucet, "water-stream": water_stream, "bubble": bubble,
         "dough-knead-1": lambda: dough_knead(1), "dough-knead-2": lambda: dough_knead(2), "dough-knead-3": lambda: dough_knead(3),
         "prep-bowl-back": prep_bowl_back, "prep-bowl-front": prep_bowl_front,
         "sauce-stage-0": lambda: sauce_stage(0), "sauce-stage-1": lambda: sauce_stage(1), "sauce-stage-2": lambda: sauce_stage(2),
         "sauce-stage-3": lambda: sauce_stage(3), "spoon-wood": spoon_wood}

if __name__ == "__main__":
    only = sys.argv[1:]
    for name, fn in ITEMS.items():
        if not only or name in only:
            save(name, fn())
