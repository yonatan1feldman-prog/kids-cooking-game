# images-b-cookies, part A: ingredients (flour-bag, sugar-jar, butter-cube, egg-1..3), the batter in the prep bowl
# (batter-stage-0..3) and the cookie dough (cookie-dough-knead-1..3, cookie-dough-ball).
# Run: python tools/gen_cookies_a.py [names...]   (writes into images-b-cookies/ only)
import math, random, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cookiekit import *  # noqa: F401,F403

FLOUR_MOUTH = (200, 96)      # flour-bag: centre of the open mouth (pour anchor)
SUGAR_MOUTH = (170, 92)      # sugar-jar: centre of the open mouth (pour anchor)
EGG_TAP = (200, 368)         # egg-1/2: bottom of the shell (touches the bowl rim when tapped)
EGG_DROP = (200, 414)        # egg-3: bottom of the falling yolk + white (lands in the bowl)


def dust(r, n_, x0, x1, y0, y1, rmin=2, rmax=4.5, op=.9):
    return "".join(C(r.uniform(x0, x1), r.uniform(y0, y1), r.uniform(rmin, rmax), WHITE, f' opacity="{op}"') for _ in range(n_))


# ================= FLOUR BAG (400x520, open, mouth up) =================
KRAFT, KRAFT_L, KRAFT_D = "#E4C48F", "#F1DBB2", "#C9A26A"


def wheat(cx, cy, s, rot):
    g = stroke(f"M{cx},{cy + 70 * s} Q{cx + 4 * s},{cy + 10 * s} {cx},{cy - 60 * s}", WALNUT, 5 * s)
    for i in range(6):
        y = cy - 50 * s + i * 17 * s
        for side in (-1, 1):
            g += f'<g transform="rotate({side * 32} {n(cx)} {n(y)})">' + P(wob(cx + side * 12 * s, y, 12 * s, 7 * s, .06, i * 2 + (side > 0), 10), CHEESE_D) + P(wob(cx + side * 11 * s, y - 1.5 * s, 8 * s, 4.5 * s, .08, i * 3 + 1, 10), CHEESE) + "</g>"
    g += P(wob(cx, cy - 64 * s, 8 * s, 12 * s, .06, 77, 10), CHEESE_D) + P(wob(cx, cy - 66 * s, 5 * s, 8 * s, .08, 78, 10), CHEESE)
    return f'<g transform="rotate({rot} {n(cx)} {n(cy)})">{g}</g>'


def flour_bag():
    p = "fb-"
    body = "M84,118 L316,118 Q330,300 340,452 Q340,478 312,480 L88,480 Q60,478 60,452 Q70,300 84,118Z"
    L = [ground_shadow(200, 486, 160, 13, p, .36)]
    L.append(G(P(body, KRAFT), p + "cut"))
    L.append(f'<clipPath id="{p}b"><path d="{body}"/></clipPath>')
    shade = (P("M270,118 L316,118 Q330,300 340,452 Q340,478 312,480 L290,480 Q300,300 270,118Z", KRAFT_D, ' opacity="0.55"')
             + P("M84,118 L110,118 Q96,300 92,480 L88,480 Q60,478 60,452 Q70,300 84,118Z", KRAFT_L, ' opacity="0.7"')
             + stroke("M150,130 Q146,300 140,476", KRAFT_D, 3, ' opacity="0.35"') + stroke("M250,130 Q258,300 262,476", KRAFT_D, 3, ' opacity="0.35"'))
    L.append(G(shade, None, f' clip-path="url(#{p}b)"'))
    # label: cream oval with three wheat ears (no words)
    lab = E(200, 320, 104, 100, CORAL_D) + E(200, 318, 98, 94, CREAM)
    lab += wheat(172, 322, .85, -18) + wheat(228, 322, .85, 18) + wheat(200, 310, 1.0, 0)
    L.append(G(lab, p + "sh"))
    # open mouth: back cuff, flour heap, front cuff (folded-down paper)
    L.append(P("M78,104 Q200,70 322,104 L316,124 Q200,98 84,124Z", KRAFT_D))
    heap = P("M88,112 Q110,50 170,40 Q210,30 244,44 Q298,58 312,112 Q200,132 88,112Z", FLOUR)
    heap += P("M120,86 Q150,54 196,48 Q160,62 136,96Z", WHITE, ' opacity="0.9"') + P("M230,60 Q280,70 300,104 Q270,86 240,80Z", FLOUR_D, ' opacity="0.8"')
    r = random.Random(5)
    heap += "".join(C(r.uniform(110, 290), r.uniform(60, 108), r.uniform(1.5, 3), FLOUR_D, ' opacity="0.8"') for _ in range(14))
    L.append(G(heap, p + "sh"))
    cuff = P("M72,108 Q200,138 328,108 L330,146 Q268,158 200,154 Q132,158 70,146Z", KRAFT_L)
    cuff += stroke("M72,108 Q200,138 328,108", KRAFT_D, 4, ' opacity="0.8"') + stroke("M70,146 Q132,158 200,154 Q268,158 330,146", KRAFT_D, 4, ' opacity="0.7"')
    cuff += "".join(stroke(f"M{x},{126 + 12 * (1 - ((x - 200) / 128) ** 2)} l0,22", KRAFT_D, 2.5, ' opacity="0.35"') for x in range(96, 320, 30))
    L.append(G(cuff, p + "sh"))
    # flour dust on the bag and on the cuff
    L.append(dust(r, 12, 90, 310, 150, 240, 2, 4, .85) + P(wob(118, 176, 26, 9, .2, 3, 12, -10), WHITE, ' opacity="0.55"')
             + P(wob(286, 440, 30, 10, .2, 4, 12, 8), WHITE, ' opacity="0.5"') + dust(r, 10, 40, 360, 482, 500, 2, 4, .9))
    return doc(p, 400, 520, "".join(L), material="rough", seed=201, sh=(4, 3.5, .33))


# ================= SUGAR JAR (340x480, open glass jar full of sugar; same frame as prep jar-olives) =================
def sugar_jar():
    p = "sj-"
    L = [ground_shadow(170, 462, 140, 12, p, .38)]
    neck = wrect(98, 84, 144, 50, 12, .6, 1)
    L.append(G(P(PB.JAR, GLASS) + P(neck, GLASS), p + "cut"))
    r = random.Random(9)
    su = P(PB.JAR_IN, SUGAR) + P("M60,130 L280,130 L280,160 Q170,176 60,160Z", mix(SUGAR, "#FFFFFF", .5))
    for _ in range(90):                                            # crystals: tiny grey-blue diamonds + white glints
        x, y = r.uniform(70, 270), r.uniform(150, 440)
        a = r.uniform(0, 90)
        su += f'<rect x="{n(x)}" y="{n(y)}" width="5" height="5" fill="{SUGAR_D if r.random() < .6 else WHITE}" transform="rotate({n(a)} {n(x + 2.5)} {n(y + 2.5)})"/>'
    L.append(f'<clipPath id="{p}j"><path d="{PB.JAR_IN}"/></clipPath>' + G(su, None, f' clip-path="url(#{p}j)"'))
    # label: pink oval with three sugar cubes (no words)
    lab = E(170, 316, 96, 74, PINK_D) + E(170, 314, 90, 68, CREAM)
    for x, y, a in ((136, 330, -8), (196, 334, 10), (166, 292, 4)):
        cube = (P(f"M{x - 24},{y - 12} L{x},{y - 24} L{x + 24},{y - 12} L{x},{y}Z", WHITE) + P(f"M{x - 24},{y - 12} L{x},{y} L{x},{y + 28} L{x - 24},{y + 16}Z", SUGAR_D)
                + P(f"M{x + 24},{y - 12} L{x},{y} L{x},{y + 28} L{x + 24},{y + 16}Z", mix(SUGAR_D, WHITE, .45)))
        cube += "".join(C(x + dx, y + dy, 1.6, "#C9C4BC") for dx, dy in ((-12, 6), (-8, 14), (10, 8), (14, 16), (4, -12), (-6, -14)))
        lab += f'<g transform="rotate({a} {x} {y})">{cube}</g>'
    L.append(G(lab, p + "sh"))
    L.append(P(wrect(74, 170, 16, 240, 8, .6, 3), WHITE, ' opacity="0.7"') + P(wrect(96, 176, 8, 90, 4, .4, 4), WHITE, ' opacity="0.5"')
             + P(wrect(256, 190, 9, 170, 4.5, .4, 5), WHITE, ' opacity="0.45"'))
    # open mouth: glass lip + sugar heaped just above it
    L.append(G(E(170, 92, 76, 15, GLASS_D) + E(170, 92, 66, 11, SUGAR_D), p + "sh"))
    L.append(P("M106,94 Q120,66 170,62 Q222,66 234,94 Q170,104 106,94Z", SUGAR))
    L.append("".join(C(r.uniform(120, 220), r.uniform(74, 96), 1.8, SUGAR_D) for _ in range(12)) + C(150, 72, 2.5, WHITE) + C(196, 78, 2.2, WHITE))
    L.append(P("M104,90 A66,11 0 0 1 236,90 A70,14 0 0 0 104,90Z", WHITE, ' opacity="0.6"'))
    # a pink ribbon bow on the neck (friendly, no words)
    bow = P("M170,140 Q130,118 124,140 Q130,162 170,140Z", PINK_D) + P("M170,140 Q210,118 216,140 Q210,162 170,140Z", PINK_D)
    bow += P("M170,140 Q136,126 132,140 Q138,154 170,140Z", PINK) + P("M170,140 Q204,126 208,140 Q202,154 170,140Z", PINK)
    bow += C(170, 140, 10, PINK_D) + P("M164,146 L150,172 L160,170 L166,178Z", PINK_D) + P("M176,146 L190,172 L180,170 L174,178Z", PINK_D)
    L.append(G(P("M60,134 L280,134 L280,146 L60,146Z", PINK, ' opacity="0.95"') + bow, p + "sh"))
    return doc(p, 340, 480, "".join(L), seed=211, sh=(4, 3.5, .33))


# ================= BUTTER CUBE (300x260) =================
def butter_block(p, cx, cy, s=1.0):
    """Butter cube in 3/4 view, centre of the top face (cx, cy)."""
    w, d, h = 92 * s, 40 * s, 84 * s
    top = [(cx - w, cy), (cx - w + d * 1.2, cy - d), (cx + w, cy - d), (cx + w - d * 1.2, cy)]
    front = [(cx - w, cy), (cx + w - d * 1.2, cy), (cx + w - d * 1.2, cy + h), (cx - w, cy + h)]
    side = [(cx + w - d * 1.2, cy), (cx + w, cy - d), (cx + w, cy + h - d), (cx + w - d * 1.2, cy + h)]
    g = P(rpoly(front, 10 * s), BUTTER) + P(rpoly(side, 8 * s), BUTTER_D) + P(rpoly(top, 10 * s), BUTTER_L)
    g += P(wob(cx - 20 * s, cy - 20 * s, 40 * s, 7 * s, .1, 3, 12, -6), WHITE, ' opacity="0.7"')
    g += stroke(f"M{n(cx - w + 18 * s)},{n(cy + 26 * s)} Q{n(cx - 20 * s)},{n(cy + 20 * s)} {n(cx + 18 * s)},{n(cy + 30 * s)}", mix(BUTTER, BUTTER_D, .6), 3 * s, ' opacity="0.7"')
    g += P(wob(cx - w + 30 * s, cy + 50 * s, 18 * s, 10 * s, .1, 5, 10), BUTTER_L, ' opacity="0.6"')
    return g


BUTTER_BASE = (146, 196)     # butter-cube: bottom centre of the cube (the point that rests on the flour mound)


def butter_cube():
    p = "bc-"
    L = [ground_shadow(146, 200, 118, 11, p, .34)]
    L.append(G(butter_block(p, 146, 112), p + "cut"))
    return doc(p, 300, 260, "".join(L), material="smooth", seed=221, sh=(4, 3.5, .33))


# ================= EGGS (400x440, one frame for the three states) =================
EC = (200, 236)


def egg_pts(cx=EC[0], cy=EC[1], k=64):
    pts = []
    for i in range(k):
        t = i / k * 2 * math.pi
        st = math.sin(t)
        pts.append((cx + 100 * math.cos(t) * (1 + .1 * st), cy + 130 * st))
    return pts


def crack_line(cy=226, x0=90, x1=310, seed=4):
    r = random.Random(seed)
    xs = [x0 + (x1 - x0) * i / 12 for i in range(13)]
    return [(x, cy + (14 if i % 2 else -10) + r.uniform(-4, 4)) for i, x in enumerate(xs)]


def egg_shell(p, pts, clip_id):
    d = smooth(pts)
    g = P(d, SHELL)
    shade = (E(EC[0] + 60, EC[1] + 60, 90, 120, SHELL_D, ' opacity="0.55"') + E(EC[0] - 44, EC[1] - 62, 36, 50, SHELL_L, ' opacity="0.95"'))
    g += f'<clipPath id="{clip_id}"><path d="{d}"/></clipPath>' + G(G(shade, p + "bl"), None, f' clip-path="url(#{clip_id})"')
    g += P(wob(EC[0] - 50, EC[1] - 70, 14, 22, .08, 3, 12, 20), WHITE, ' opacity="0.8"')
    r = random.Random(3)
    g += "".join(C(r.uniform(130, 270), r.uniform(150, 330), r.uniform(1.4, 2.4), SHELL_D, ' opacity="0.7"') for _ in range(10))
    return g


def egg(stage):
    p = f"eg{stage}-"
    L = []
    if stage < 3:
        L.append(ground_shadow(200, 372, 90, 10, p, .32))
        body = egg_shell(p, egg_pts(), p + "c")
        if stage == 2:
            cl = crack_line()
            dcl = "M" + " L".join(f"{n(x)},{n(y)}" for x, y in cl[2:11])
            body += stroke(dcl, mix(SHELL_D, "#6B3A1A", .45), 6) + stroke(dcl, "#FFF6E6", 2, ' opacity="0.8" transform="translate(0 4)"')
            body += stroke(f"M{n(cl[5][0])},{n(cl[5][1])} l-8,22 l8,14", mix(SHELL_D, "#6B3A1A", .45), 4)
            body += stroke(f"M{n(cl[8][0])},{n(cl[8][1])} l10,-20 l-4,-14", mix(SHELL_D, "#6B3A1A", .45), 4)
            body += P("M252,224 L262,212 L270,226Z", "#FFF6E6")                            # a tiny chip shows the inside
        L.append(G(body, p + "cut"))
        return doc(p, 400, 440, "".join(L), material="smooth", seed=231 + stage, sh=(4, 3.5, .33))
    # stage 3: the shell opened into two halves, yolk and white falling out between them
    pts, cl = egg_pts(), crack_line()
    cap = [q for q in pts if q[1] < 226 and 90 < q[0] < 310 or q[1] < 200]
    cap = sorted([q for q in pts if q[1] <= 222], key=lambda q: math.atan2(q[1] - EC[1], q[0] - EC[0]))
    cup = sorted([q for q in pts if q[1] > 222], key=lambda q: math.atan2(q[1] - EC[1], q[0] - EC[0]))
    zz = [(90, 222)] + cl[1:12] + [(310, 222)]
    cap_poly = cap + zz                                    # left-to-right over the top, back along the zigzag
    cup_poly = cup + list(reversed(zz))

    def half(poly, inner_y, flip):
        d = "M" + " L".join(f"{n(x)},{n(y)}" for x, y in poly) + "Z"
        g = P(d, SHELL, ' stroke-linejoin="round"')
        g += P(d, SHELL_D, ' opacity="0.25" transform="translate(6 4)"')
        g += E(200, inner_y, 104, 16, "#FFF6E6")           # the clean inside rim of the shell
        return g

    left = half(cap_poly, 222, False)
    right = half(cup_poly, 222, True)
    # falling white + yolk (between the halves, down to the drop point)
    wd = smooth([(194, 196), (206, 196), (212, 250), (222, 296), (256, 318), (266, 360), (250, 404), (214, 416), (182, 414), (148, 398), (136, 356), (150, 318), (184, 294), (190, 250)])
    white = P(wd, "#FFFFFF", f' opacity="0.72" stroke="{SUGAR_D}" stroke-width="3"')
    white += P("M152,340 Q156,318 178,308 Q162,326 160,352Z", "#FFFFFF") + stroke("M199,204 L199,280", "#FFFFFF", 4)
    yolk = C(200, 364, 46, YOLK_D) + C(199, 361, 43, YOLK) + P(wob(184, 344, 16, 9, .1, 5, 10, -30), YOLK_L) + C(180, 340, 5, WHITE)
    drip = ""
    L.append(G(white + drip + yolk, p + "sh"))
    L.append(G(f'<g transform="translate(124 172) rotate(-20) scale(.8) translate(-200 -222)">{left}</g>', p + "cut"))
    L.append(G(f'<g transform="translate(276 172) rotate(200) scale(.8) translate(-200 -222)">{right}</g>', p + "cut"))
    return doc(p, 400, 440, "".join(L), material="smooth", seed=233, sh=(4, 3.5, .33))


# ================= BATTER STAGES (640x520, the prep-bowl frame; stack prep-bowl-back -> stage -> prep-bowl-front) =================
IC, IRX, IRY = PA.IC, PA.IRX, PA.IRY
BUTTER_ON_MOUND = (262, 150)    # where a dropped butter cube sits on the stage-0 mound (prep-bowl frame)
YOLK_ON_MOUND = (372, 150)      # where the egg yolk lands on the stage-0 mound


def pool(p, col, col_d, cy=200, rx=236, ry=56, seed=1):
    g = P(wob(IC[0], cy, rx, ry, .02, seed, 30), col_d) + P(wob(IC[0] - 6, cy - 5, rx * .96, ry * .86, .025, seed + 1, 30), col)
    return f'<clipPath id="{p}c"><ellipse cx="{IC[0]}" cy="{IC[1]}" rx="{IRX - 2}" ry="{IRY - 2}"/></clipPath>' + G(G(g, p + "sh"), None, f' clip-path="url(#{p}c)"')


def mound(cx, base, w, h, seed, k=18):
    r = random.Random(seed)
    top = [(cx - w + 2 * w * i / k, base - h * math.sin(math.pi * i / k) ** .8 * (1 + r.uniform(-.05, .05))) for i in range(k + 1)]
    bottom = [(cx + w * .9, base + 22), (cx, base + 34), (cx - w * .9, base + 22)]
    return top + bottom


def batter(stage):
    p = f"bs{stage}-"
    L = []
    r = random.Random(40 + stage)
    if stage == 0:       # a dry pale mound of flour with a few sugar crystals (butter and egg are added by the game on top)
        L.append(pool(p, FLOUR, FLOUR_D, 204, 230, 54, 3))
        m = mound(318, 214, 214, 100, 7)
        g = P(smooth(m), FLOUR)
        g += P("M150,196 Q200,132 300,118 Q220,150 176,206Z", WHITE, ' opacity="0.95"')
        g += P("M360,124 Q450,150 500,200 Q440,176 380,160Z", FLOUR_D, ' opacity="0.7"')
        g += P(wob(318, 118, 36, 9, .1, 5, 12), FLOUR_D, ' opacity="0.6"')                       # small dip on top (a well)
        for _ in range(26):                                                                     # sugar crystals
            x, y = r.uniform(170, 470), r.uniform(128, 222)
            if y < 214 - 100 * math.sin(math.pi * (x - 104) / 428) ** .8 + 8: continue
            g += f'<rect x="{n(x)}" y="{n(y)}" width="6" height="6" fill="{SUGAR_D}" transform="rotate(45 {n(x + 3)} {n(y + 3)})"/>' + C(x + 3, y + 1, 1.4, WHITE)
        L.append(G(g, p + "sh"))
    elif stage == 1:     # first stir: the mound starts to mix, a lumpy butter streak and yellow egg streaks
        L.append(pool(p, mix(FLOUR, CK_L, .35), mix(FLOUR_D, CK_D, .3), 204, 232, 54, 5))
        m = mound(318, 214, 210, 82, 9)
        g = P(smooth(m), mix(FLOUR, CK_L, .25))
        g += P("M150,196 Q200,146 280,134 Q210,160 176,206Z", WHITE, ' opacity="0.9"')
        g += P("M188,184 Q250,150 330,160 Q400,170 452,150 Q420,184 340,182 Q260,178 196,196Z", YOLK, ' opacity="0.9"')   # egg streak
        g += P("M232,206 Q300,196 368,208 Q300,214 240,214Z", YOLK_L, ' opacity="0.9"')
        for i, (x, y, s_) in enumerate(((262, 158, 22), (300, 176, 16), (228, 190, 14), (400, 196, 13), (344, 146, 12))):
            g += P(wob(x, y, s_ * 1.3, s_ * .8, .15, 60 + i, 10), BUTTER_D) + P(wob(x - 2, y - 3, s_ * 1.1, s_ * .6, .15, 70 + i, 10), BUTTER)
        g += stroke("M170,210 Q240,170 330,186 Q420,200 470,176", mix(FLOUR_D, CK_D, .5), 4, ' opacity="0.6"')   # the spoon's first track
        g += dust(r, 14, 150, 480, 150, 222, 2, 4, .95)
        L.append(G(g, p + "sh"))
    elif stage == 2:     # crumbly, half-mixed dough: many golden crumbs heaped up, a few pale flour patches
        L.append(pool(p, mix(CK_L, FLOUR, .3), CK_D, 204, 236, 56, 7))
        crumbs = ""
        spots = [(x, y) for y in range(124, 240, 24) for x in range(116, 540, 40)]
        for i, (x, y) in enumerate(spots):
            x += r.uniform(-10, 10); y += r.uniform(-6, 6)
            u = (x - 320) / 210
            if abs(u) > 1: continue
            topy = 214 - 88 * max(0, 1 - u * u) ** .8
            if y < topy: continue
            s_ = r.uniform(18, 27)
            col = r.choice([CK, CK, CK_L, mix(CK, FLOUR, .25)])
            crumbs += P(wob(x + 2, y + 4, s_, s_ * .7, .18, i, 9), CK_D) + P(wob(x, y, s_ * .9, s_ * .62, .18, i + 300, 9), col) + P(wob(x - s_ * .25, y - s_ * .22, s_ * .35, s_ * .16, .2, i + 600, 8), CK_L, ' opacity="0.9"')
        crumbs += "".join(P(wob(x, y, 20, 8, .2, 90 + i, 10), FLOUR, ' opacity="0.85"') for i, (x, y) in enumerate(((210, 170), (390, 184), (300, 142))))
        L.append(G(crumbs, p + "sh"))
    else:                # one smooth even mass of cookie dough: a soft round dome, like the kneaded dough
        L.append(pool(p, CK, mix(CK, CK_D, .6), 204, 236, 56, 9))
        m = mound(320, 222, 200, 132, 11, 24)
        g = P(smooth(m), CK)
        g += f'<clipPath id="{p}m"><path d="{smooth(m)}"/></clipPath>'
        g += G(G(E(430, 222, 130, 70, CK_D, ' opacity="0.75"') + E(262, 140, 110, 50, CK_L, ' opacity="0.95"'), p + "bl"), None, f' clip-path="url(#{p}m)"')
        g += P("M176,176 Q204,112 276,98 Q224,128 196,184Z", "#FFF3D6", ' opacity="0.85"') + P(wob(250, 110, 14, 7, .1, 3, 10, -20), "#FFF8E6", ' opacity="0.9"')
        g += P("M236,168 Q310,146 392,162 Q316,156 240,176Z", CK_D, ' opacity="0.45"')                                  # one soft fold
        g += "".join(C(r.uniform(190, 450), r.uniform(120, 214), 1.8, SPECK, ' opacity="0.55"') for _ in range(16))
        L.append(G(g, p + "sh"))
    return doc(p, 640, 520, "".join(L), seed=240 + stage, sh=(4, 3.5, .33))


# ================= COOKIE DOUGH (360x300, the dough-ball frame) =================
def specks(r, k, box):
    x0, y0, x1, y1 = box
    return "".join(C(r.uniform(x0, x1), r.uniform(y0, y1), r.uniform(1.4, 2.2), SPECK, ' opacity="0.55"') for _ in range(k))


def add_before_close(s, extra):
    i = s.rfind("</g></svg>")
    return s[:i] + extra + s[i:]


def cookie_knead(stage):
    s = recolor(PA.dough_knead(stage), f"dk{stage}-", f"ckk{stage}-")
    r = random.Random(50 + stage)
    return add_before_close(s, specks(r, {1: 6, 2: 10, 3: 14}[stage], (100, 110, 260, 240)))


def cookie_ball():
    s = recolor(gen_items.dough_ball(), "db-", "cdb-")
    return add_before_close(s, specks(random.Random(61), 16, (90, 90, 270, 240)))


ITEMS = {"flour-bag": flour_bag, "sugar-jar": sugar_jar, "butter-cube": butter_cube,
         "egg-1": lambda: egg(1), "egg-2": lambda: egg(2), "egg-3": lambda: egg(3),
         "batter-stage-0": lambda: batter(0), "batter-stage-1": lambda: batter(1), "batter-stage-2": lambda: batter(2), "batter-stage-3": lambda: batter(3),
         "cookie-dough-knead-1": lambda: cookie_knead(1), "cookie-dough-knead-2": lambda: cookie_knead(2), "cookie-dough-knead-3": lambda: cookie_knead(3),
         "cookie-dough-ball": cookie_ball}

if __name__ == "__main__":
    run(ITEMS)
