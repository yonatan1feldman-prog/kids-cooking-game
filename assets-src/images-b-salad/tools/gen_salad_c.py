# images-b-salad, part C: dressing (lemon half x3, juice drop, oil bottle, oil drop, salt shaker), water drop, recipe card.
# Run: python tools/gen_salad_c.py [names...]   (writes into images-b-salad/ only)
import math, random, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from saladkit import *  # noqa: F401,F403
import gen_salad_a as SA
import gen_salad_b as SB


# ================= LEMON HALF (520x520, three squeeze states in one frame) =================
LEMON_FACE = (260, 226)       # centre of the cut face; juice falls from the lower rim (260, ~440) when tilted


def lemon_half(stage):
    p = f"lm{stage}-"
    r = random.Random(stage + 3)
    cx, cy = LEMON_FACE
    rx, ry = {1: (196, 132), 2: (184, 112), 3: (170, 92)}[stage]
    cy2 = cy + (132 - ry) * .6
    bottom = {1: 452, 2: 430, 3: 404}[stage]
    jag = {1: 0, 2: .03, 3: .07}[stage]
    face = wobp(cx, cy2, rx, ry, jag, 10 + stage, 40)
    L = [G(E(262, bottom + 20, 190, 16, SH, ' opacity="0.34"'), p + "bl")]
    # rind body (the dome under the cut face) + a small tip at the bottom
    dome = f"M{cx - rx},{n(cy2)} C{cx - rx},{n(cy2 + (bottom - cy2) * .75)} {cx - rx * .5},{bottom} {cx},{bottom} C{cx + rx * .5},{bottom} {cx + rx},{n(cy2 + (bottom - cy2) * .75)} {cx + rx},{n(cy2)}Z"
    tip = wob(cx + 8, bottom - 2, 22, 12, .06, 3, 12)
    L.append(G(P(tip, LEM_D) + P(dome, LEM_D) + P(smooth(face), LEM_D), p + "cut"))
    body = P(dome, LEM)
    body += P(f"M{cx + rx * .35},{n(cy2 + 30)} Q{cx + rx * .95},{n(cy2 + 50)} {cx + rx * .6},{n(bottom - 40)} Q{cx + rx * .3},{bottom - 12} {cx},{bottom - 6} Q{cx + rx * .7},{n(bottom - 60)} {cx + rx * .35},{n(cy2 + 30)}Z",
              LEM_D, ' opacity="0.55"')
    body += P(wob(cx - rx * .62, cy2 + (bottom - cy2) * .45, rx * .16, (bottom - cy2) * .22, .08, 4, 12, 20), LEM_L, ' opacity="0.8"')
    pores = "".join(C(r.uniform(cx - rx * .8, cx + rx * .8), r.uniform(cy2 + 40, bottom - 30), 3.4, LEM_D, ' opacity="0.4"') for _ in range(26))
    body += pores
    if stage >= 2:   # squeeze creases on the rind
        for k in range(stage + 1):
            x = cx - rx * .5 + k * rx * .45
            body += P(f"M{n(x)},{n(cy2 + 30)} Q{n(x + 14)},{n((cy2 + bottom) / 2)} {n(x - 6)},{n(bottom - 24)} Q{n(x + 6)},{n((cy2 + bottom) / 2)} {n(x)},{n(cy2 + 30)}Z", LEM_D, ' opacity="0.7"')
    L.append(body)
    # cut face: rind ring, pith, ten segments, centre
    L.append(P(smooth(face), LEM))
    pith = [(cx + (x - cx) * .92, cy2 + (y - cy2) * .9) for x, y in face]
    L.append(G(P(smooth(pith), LEM_P), p + "sh"))
    seg_col = {1: "#FFD84E", 2: mix(LEM_S, LEM_D, .18), 3: mix(LEM_S, "#D9B866", .45)}[stage]
    segs = ""
    rin, rout = .14, {1: .84, 2: .8, 3: .74}[stage]
    for i in range(10):
        a = i / 10 * 2 * math.pi + .15
        da = math.pi / 10 * (.88 if stage == 1 else .76)
        ro = rout * (1 if stage == 1 else r.uniform(.8, 1.0))
        pts = [(cx + math.cos(a) * rx * rin, cy2 + math.sin(a) * ry * rin)]
        for t in (-1, -.5, 0, .5, 1):
            aa = a + t * da
            pts.append((cx + math.cos(aa) * rx * ro * (1 - .04 * abs(t)), cy2 + math.sin(aa) * ry * ro * (1 - .04 * abs(t))))
        segs += P(smooth(pts, .1), seg_col)
        if stage < 3:   # juice sacs: a lighter lens along each segment
            m1 = (cx + math.cos(a) * rx * .38, cy2 + math.sin(a) * ry * .38)
            m2 = (cx + math.cos(a) * rx * ro * .82, cy2 + math.sin(a) * ry * ro * .82)
            segs += stroke(f"M{n(m1[0])},{n(m1[1])} L{n(m2[0])},{n(m2[1])}", LEM_L, 9 if stage == 1 else 6, ' opacity="0.85"')
        else:           # squeezed: torn, collapsed sacs
            m2 = (cx + math.cos(a) * rx * ro * .7, cy2 + math.sin(a) * ry * ro * .7)
            segs += P(wob(*m2, 9, 5, .2, i, 8, math.degrees(a)), mix(LEM_P, "#E6CF8E", .5))
    L.append(G(segs, p + "sh"))
    L.append(P(wob(cx, cy2, rx * .1, ry * .1, .1, 7, 10), LEM_P))
    if stage < 3:
        seeds = "".join(P(wob(x, y, 7, 11, .05, 20 + i, 10, rot), "#FFF6D6") + P(wob(x + 1, y + 2, 5, 8, .05, 30 + i, 10, rot), "#F0DFA8")
                        for i, (x, y, rot) in enumerate(((cx + 52, cy2 - 22, 60), (cx - 60, cy2 + 30, -30))))
        L.append(G(seeds, p + "sh"))
    if stage == 1:   # juicy: glints and a few drops on the face
        L.append("".join(P(wob(x, y, 9, 4.5, .1, 40 + i, 10, rot), WHITE, ' opacity="0.8"') for i, (x, y, rot) in
                         enumerate(((cx - 100, cy2 - 60, -30), (cx + 20, cy2 - 90, 0), (cx + 120, cy2 - 30, 40), (cx - 40, cy2 + 70, -10), (cx + 90, cy2 + 60, 30)))))
        L.append("".join(P(wob(x, y, 8, 10, .08, 60 + i, 10), LEM_L) + C(x - 2, y - 3, 3, WHITE) for i, (x, y) in enumerate(((cx - 140, cy2 + 10), (cx + 150, cy2 - 10), (cx + 30, cy2 + 104)))))
    elif stage == 2:
        L.append("".join(P(wob(x, y, 7, 3.5, .1, 40 + i, 10, rot), WHITE, ' opacity="0.55"') for i, (x, y, rot) in enumerate(((cx - 90, cy2 - 50, -30), (cx + 90, cy2 - 20, 40)))))
    L.append(P(f"M{cx - rx * .86},{n(cy2 - 20)} Q{cx - rx * .7},{n(cy2 - ry * .9)} {cx - rx * .2},{n(cy2 - ry * .98)} Q{cx - rx * .66},{n(cy2 - ry * .8)} {cx - rx * .8},{n(cy2 - 10)}Z", WHITE, ' opacity="0.45"'))
    return gen_items.doc(p, 520, 520, "".join(L), seed=371 + stage, sh=(4, 3.5, .33))


# ================= DROPS (120x160): juice, oil, water =================
DROP = "M60,10 C70,42 104,70 104,106 C104,132 84,150 60,150 C36,150 16,132 16,106 C16,70 50,42 60,10Z"
DROP_IN = "M60,34 C68,58 94,80 94,108 C94,128 79,141 60,141 C41,141 26,128 26,108 C26,80 52,58 60,34Z"


def drop(p, dark, mid, light, seed, alpha=1.0):
    L = [G(P(DROP, dark, f' opacity="{alpha}"'), p + "cut"), P(DROP_IN, mid, f' opacity="{alpha}"')]
    L.append(P(wob(66, 118, 22, 14, .06, 3, 12), light, ' opacity="0.8"'))
    L.append(P("M40,86 Q46,64 58,52 Q52,72 50,94Z", WHITE, ' opacity="0.9"') + C(44, 108, 5, WHITE, ' opacity="0.85"'))
    return gen_items.doc(p, 120, 160, "".join(L), material="smooth", seed=seed, sh=(3, 2.5, .25), cut={"rim": 2, "rough": 2.5, "op": .2})


# ================= OIL BOTTLE (300x640, open, pourer spout) =================
OIL_SPOUT = (150, 30)
BOTTLE = "M122,96 L122,196 Q122,236 92,262 Q56,292 56,350 L56,576 Q56,616 100,616 L200,616 Q244,616 244,576 L244,350 Q244,292 208,262 Q178,236 178,196 L178,96Z"
BOTTLE_IN = "M130,212 Q128,244 100,268 Q66,296 66,352 L66,572 Q66,604 102,604 L198,604 Q234,604 234,572 L234,352 Q234,296 200,268 Q172,244 170,212Z"


def olive_branch(cx, cy, s=1.0):
    """Label picture: brown twig, long silver-green leaves, a green and a dark olive (like the images-b-prep olive jar)."""
    T = lambda x, y: (cx + x * s, cy + y * s)
    g = stroke("M{},{} Q{},{} {},{}".format(*map(n, T(-70, 40) + T(-10, 10) + T(70, -40))), WALNUT, 7 * s)
    for x, y, a in ((-52, 30, -70), (-34, 22, 20), (-12, 10, -80), (12, 0, 10), (34, -14, -60), (56, -28, 30), (70, -44, -30)):
        px, py = T(x, y)
        g += (f'<g transform="rotate({a} {n(px)} {n(py)})">' + P(wob(px, py - 15 * s, 7.5 * s, 18 * s, .04, int(x + 99), 12), SAGE_D)
              + P(wob(px - 1, py - 16 * s, 5 * s, 15 * s, .05, int(x + 199), 12), SAGE_L) + "</g>")
    ox, oy = T(-8, 36)
    g += stroke(f"M{n(T(-14, 16)[0])},{n(T(-14, 16)[1])} L{n(ox)},{n(oy - 14 * s)}", WALNUT, 4 * s)
    g += P(wob(ox, oy, 15 * s, 19 * s, .03, 5, 14, 10), mix(GREEN_D, OLIVE_D, .15)) + P(wob(ox - 1, oy - 2, 13 * s, 16.5 * s, .03, 6, 14, 10), mix(GREEN, SAGE, .3))
    g += P(wob(ox - 5 * s, oy - 7 * s, 4 * s, 6 * s, .1, 7, 10), "#D9EDB8", ' opacity="0.95"')
    dx, dy = T(40, 6)
    g += stroke(f"M{n(T(30, -12)[0])},{n(T(30, -12)[1])} L{n(dx)},{n(dy - 14 * s)}", WALNUT, 4 * s)
    g += P(wob(dx, dy, 14 * s, 18 * s, .03, 8, 14, -10), OLIVE_D) + P(wob(dx - 1, dy - 2, 12 * s, 15.5 * s, .03, 9, 14, -10), OLIVE)
    g += P(wob(dx - 5 * s, dy - 7 * s, 4 * s, 5 * s, .1, 10, 10), OLIVE_S, ' opacity="0.9"')
    return g


def oil_bottle():
    p = "ob-"
    L = [G(E(150, 624, 116, 12, SH, ' opacity="0.36"'), p + "bl")]
    L.append(G(P(BOTTLE, GLASS), p + "cut"))
    grad = (f'<linearGradient id="{p}oil" x1="0" y1="250" x2="0" y2="610" gradientUnits="userSpaceOnUse">'
            f'<stop offset="0" stop-color="{OIL_L}"/><stop offset="0.35" stop-color="{OIL}"/><stop offset="1" stop-color="{OIL_D}"/></linearGradient>')
    L.append(f'<clipPath id="{p}in"><path d="{BOTTLE_IN}"/></clipPath>')
    oil = P("M40,286 Q150,270 260,286 L260,620 L40,620Z", f"url(#{p}oil)") + E(150, 284, 110, 10, OIL_L, ' opacity="0.9"')
    L.append(G(G(oil, p + "sh"), None, f' clip-path="url(#{p}in)"'))
    # label: coral-rimmed cream oval, olive branch picture (no words)
    lab = E(150, 452, 86, 94, CORAL_D) + E(150, 450, 80, 88, CREAM)
    L.append(f'<clipPath id="{p}lb"><ellipse cx="150" cy="450" rx="80" ry="88"/></clipPath>')
    L.append(G(lab + G(olive_branch(150, 452, 1.0), None, f' clip-path="url(#{p}lb)"'), p + "sh"))
    # glass highlights + neck ring + pourer spout
    L.append(P(wrect(74, 312, 16, 250, 8, .6, 3), WHITE, ' opacity="0.65"') + P(wrect(132, 112, 9, 80, 4.5, .4, 4), WHITE, ' opacity="0.6"')
             + P(wrect(214, 330, 9, 180, 4.5, .4, 5), WHITE, ' opacity="0.4"'))
    L.append(G(P(wrect(112, 92, 76, 26, 10, .5, 6), CHROME_D) + P(wrect(114, 90, 72, 20, 9, .5, 7), CHROME), p + "sh"))
    spout = P("M132,92 L140,40 Q142,26 150,26 Q158,26 160,40 L168,92Z", CHROME_D) + P("M136,90 L143,42 Q145,32 150,32 Q155,32 157,42 L164,90Z", CHROME)
    spout += E(150, 30, 8, 3.5, "#5E6967") + P("M140,86 L145,46 L148,46 L145,86Z", WHITE, ' opacity="0.7"')
    L.append(G(spout, p + "cut"))
    L.append(G(P(wob(158, 50, 5, 8, .1, 8, 8), OIL), p + "sh"))                               # a golden drip on the spout
    return gen_items.doc(p, 300, 640, "".join(L), seed=381, sh=(4, 3.5, .33), extra_defs=grad)


# ================= SALT SHAKER (260x400) =================
SALT_HOLES = (130, 70)


def salt_shaker():
    p = "sl-"
    jar = "M78,150 Q46,196 60,254 Q40,318 64,362 Q72,374 92,374 L168,374 Q188,374 196,362 Q220,318 200,254 Q214,196 182,150Z"
    jin = "M86,166 Q60,206 72,256 Q54,316 74,354 Q80,364 96,364 L164,364 Q180,364 186,354 Q206,316 188,256 Q200,206 174,166Z"
    L = [ground_shadow(130, 384, 96, 11, p, .38)]
    L.append(G(P(jar, GLASS), p + "cut"))
    L.append(f'<clipPath id="{p}j"><path d="{jin}"/></clipPath>')
    r = random.Random(4)
    salt = P("M30,214 Q80,200 130,208 Q180,216 230,202 V380 H30Z", "#F4F4EE")
    salt += "".join(P(wob(r.uniform(60, 200), r.uniform(214, 366), 4, 3.4, .2, i, 6, r.uniform(0, 90)), r.choice(["#FFFFFF", "#DDE6E8", "#E9EEEF"])) for i in range(46))
    L.append(G(G(salt, p + "sh"), None, f' clip-path="url(#{p}j)"'))
    L.append(P(wrect(76, 214, 16, 110, 8, .6, 3), WHITE, ' opacity="0.8"') + P(wrect(176, 230, 8, 90, 4, .4, 4), WHITE, ' opacity="0.5"'))
    L.append(G(P(wrect(72, 136, 116, 26, 10, .6, 5), TEAL_D) + P(wrect(74, 134, 112, 20, 9, .6, 6), TEAL), p + "sh"))   # teal neck band
    lid = P("M76,140 C78,84 102,58 130,58 C158,58 182,84 184,140Z", CHROME_D) + P("M82,136 C84,88 106,64 130,64 C154,64 176,88 178,136Z", CHROME)
    lid += P("M92,120 C96,92 110,76 126,72 C112,84 104,100 102,122Z", WHITE, ' opacity="0.7"')
    L.append(G(lid, p + "cut"))
    L.append("".join(C(x, y, 5.5, "#4A5553") for x, y in ((130, 72), (112, 84), (148, 84), (130, 96), (104, 104), (156, 104), (130, 118))))
    return gen_items.doc(p, 260, 400, "".join(L), seed=391, sh=(4, 3.5, .33))


# ================= RECIPE CARD (400x520, same layout as images-b card-pizza) =================
def card_salad():
    p = "crs-"
    L = [G(P(gen_kitchen.wrect(10, 10, 380, 500, 36, 2.2, 3, step=18), CREAM), p + "cut")]
    pat = (f'<pattern id="{p}gh" width="40" height="40" patternUnits="userSpaceOnUse">'
           f'<rect width="40" height="40" fill="#EEF4DE"/><rect width="20" height="40" fill="{GREEN_L}" opacity="0.3"/>'
           f'<rect width="40" height="20" fill="{GREEN_L}" opacity="0.3"/></pattern>')
    L.append(G(P(gen_kitchen.wrect(34, 34, 332, 332, 26, 1.2, 4), f"url(#{p}gh)"), p + "sh"))
    # the salad seen from above in its wooden bowl
    cx, cy = 200, 204
    bowl = G(P(wob(cx, cy, 150, 148, .015, 5, 30), SB.BOWL_D), p + "sh") + P(wob(cx - 1, cy - 2, 144, 142, .015, 6, 30), SB.BOWL)
    bowl += P(wob(cx, cy, 128, 126, .015, 7, 30), SB.BOWL_L) + P(wob(cx, cy + 2, 118, 116, .02, 8, 30), mix(WALNUT_D, "#3A200F", .3))
    bowl += "".join(C(cx + math.cos(a) * 136, cy + math.sin(a) * 134, 4, TEAL) for a in [i / 18 * 2 * math.pi for i in range(18)])
    L.append(bowl)
    r = random.Random(3)
    ldefs = ""
    for j, (sd, rot) in enumerate(((11, -28), (23, 40), (51, 150))):
        g, _ = SA.leaf_body(0, 0, 37, sd, rot)
        ldefs += f'<g id="{p}l{j}">{g}</g>'
    sal = "".join(f'<use href="#{p}l{i % 3}" transform="translate({n(cx + math.cos(a) * d)} {n(cy + math.sin(a) * d)}) rotate({r.randint(0, 359)}) scale({n(r.uniform(.92, 1.08))})"/>'
                  for i, (a, d) in enumerate([(i / 8 * 6.283, 70) for i in range(8)] + [(i / 4 * 6.283 + .6, 30) for i in range(4)]))
    L.append(G(sal, p + "sh"))
    tops = ""
    for i, (a, d) in enumerate([(i / 9 * 6.283 + .3, 62 + (i % 2) * 24) for i in range(9)] + [(0, 0)]):
        x, y = cx + math.cos(a) * d, cy + math.sin(a) * d
        k = i % 3
        if k == 0:
            tops += G(C(x, y, 17, mix(RED_D, "#7A2016", .28)) + C(x, y - 1, 14.5, RED) + "".join(C(x + math.cos(j * 2.09 + .5) * 6.5, y - 1 + math.sin(j * 2.09 + .5) * 6.5, 3.6, SEEDPOCK) for j in range(3)), p + "sh")
        elif k == 1:
            tops += G(C(x, y, 16, CUKE_D) + C(x, y - 1, 13.5, CUKE_F) + C(x, y - 1, 6.5, "#BFE08A"), p + "sh")
        else:
            tops += G(C(x, y, 13, CAR_D) + C(x, y - 1, 11, CAR) + C(x, y - 1, 5, CAR_C), p + "sh")
    L.append(tops)
    L.append(G(P(gen_kitchen.wrect(130, -4, 140, 40, 3, 1.4, 6), MUSTARD, ' opacity="0.85" transform="rotate(-4 200 15)"')
               + "".join(C(146 + i * 18, 16, 4, WHITE, ' opacity="0.7" transform="rotate(-4 200 15)"') for i in range(7)), p + "sh"))
    # ingredient row: cucumber slice, carrot, lemon half
    L.append(G("".join(P(wob(x, 440, 50, 44, .04, 7 + i, 20), WHITE) for i, x in enumerate((92, 200, 308))), p + "sh"))
    cu = C(92, 440, 33, CUKE_D) + C(92, 438, 29, CUKE) + C(92, 438, 26, CUKE_F) + P(smooth(polar(92, 439, lambda a: 13 + 2.5 * math.cos(3 * a + .5), 18)), "#BFE08A")
    cu += "".join(E(92 + math.cos(a) * 8, 439 + math.sin(a) * 8, 2.4, 4, CUKE_SEED, f' transform="rotate({n(math.degrees(a) + 90)} {n(92 + math.cos(a) * 8)} {n(439 + math.sin(a) * 8)})"') for a in (.5, 2.6, 4.7))
    ca = stroke("M232,420 Q244,404 238,392", GREEN_D, 6) + stroke("M232,420 Q250,414 256,400", GREEN_D, 6) + P(wob(240, 392, 9, 6, .1, 3, 10, -40), GREEN) + P(wob(256, 398, 9, 6, .1, 4, 10, 20), GREEN_L)
    ca += P("M160,468 Q196,446 232,414 Q242,418 240,430 Q206,462 164,474 Q156,474 160,468Z", CAR_D) + P("M162,466 Q196,446 230,418 Q236,422 234,428 Q204,456 166,470Z", CAR)
    ca += stroke("M190,452 L196,460", CAR_D, 3) + stroke("M208,440 L214,448", CAR_D, 3)
    le = E(308, 452, 40, 20, LEM_D) + P("M268,442 C268,470 290,478 308,478 C326,478 348,470 348,442Z", LEM_D) + E(308, 440, 40, 26, LEM) + E(308, 440, 35, 22, LEM_P)
    le += "".join(P(smooth([(308 + math.cos(a) * 5, 440 + math.sin(a) * 3)] + [(308 + math.cos(a + t * .25) * 30, 440 + math.sin(a + t * .25) * 18.5) for t in (-1, 0, 1)], .1), LEM_S) for a in [i / 8 * 6.283 for i in range(8)])
    L.append(G(cu, p + "sh") + G(ca, p + "sh") + G(le, p + "sh"))
    defs = std_defs(p, "rough", seed=53, sh=(4, 3.5, .32), cut={"rim": 3, "rough": 7, "freq": .12}) + pat + ldefs
    return svg(400, 520, defs, G("".join(L), p + "gr"))


ITEMS = {"lemon-half-1": lambda: lemon_half(1), "lemon-half-2": lambda: lemon_half(2), "lemon-half-3": lambda: lemon_half(3),
         "juice-drop": lambda: drop("jd-", LEM_D, LEM, LEM_L, 401),
         "oil-bottle": oil_bottle, "oil-drop": lambda: drop("od-", OIL_D, OIL, OIL_L, 403),
         "salt-shaker": salt_shaker, "water-drop": lambda: drop("wd-", WATER_D, WATER, WATER_L, 405, .95), "card-salad": card_salad}

if __name__ == "__main__":
    run(ITEMS)
