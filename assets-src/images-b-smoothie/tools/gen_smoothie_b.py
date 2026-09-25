# images-b-smoothie, part B: the blender. Jar family (600x800, one viewBox): blender-jar-back, jar-heap-1..3, blend-stage-1..3,
# blender-jar-front (stack back -> contents -> front). blender-base (700x520, jar seat anchor), blender-button-off/-on (280x280),
# blender-lid (480x240, seat anchor on the jar mouth). See README-smoothie.md for all anchors.
# Run: python tools/gen_smoothie_b.py [names...]   (writes into images-b-smoothie/ only)
import sys, os
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import math, random
from smoothiekit import *  # noqa: F401,F403
import gen_smoothie_a as SA

# ---------------- jar geometry (600x800) ----------------
JW, JH = 600, 800
RIM_C, RIM_RX, RIM_RY = (300, 118), 208, 30          # outer rim ellipse = the jar mouth (the lid lands here)
MOUTH_RX, MOUTH_RY = 196, 24                         # inner opening
OUT_TOP, OUT_BOT = (92, 508, 118), (158, 442, 690)   # outer glass: x left/right at the top rim and at the bottom
IN_TOP, IN_BOT = (106, 494, 126), (172, 428, 676)    # inner walls (the contents are clipped to this)
COLLAR = (150, 686, 300, 90)                         # blade collar x, y, w, h -> bottom centre (300, 776) = SEAT
SEAT = (300, 776)
HANDLE = "M500,186 C560,180 586,214 584,300 L578,470 C576,540 548,566 470,566 L470,528 C520,528 538,512 540,466 L546,300 C548,240 536,222 504,224Z"
SPOUT = (72, 100)                                    # the pouring lip (left of the rim)


def half_w(y):
    """Inner half-width at height y (the walls are straight)."""
    t = (IN_BOT[2] - y) / (IN_BOT[2] - IN_TOP[2])
    return (IN_BOT[1] - IN_BOT[0]) / 2 + t * ((IN_TOP[1] - IN_TOP[0]) / 2 - (IN_BOT[1] - IN_BOT[0]) / 2)


def body_outer():
    l0, r0, y0 = OUT_TOP; l1, r1, y1 = OUT_BOT
    return (f"M{l0},{y0} L{l1},{y1 - 14} Q{l1},{y1} {l1 + 16},{y1} L{r1 - 16},{y1} Q{r1},{y1} {r1},{y1 - 14} L{r0},{y0} "
            f"A{RIM_RX},{RIM_RY} 0 0 0 {l0},{y0}Z")


def inner_poly():
    l0, r0, y0 = IN_TOP; l1, r1, y1 = IN_BOT
    return f"M{l0},{y0 - 40} L{r0},{y0 - 40} L{r0},{y0} L{r1},{y1} Q300,{y1 + 20} {l1},{y1} L{l0},{y0}Z"


def jar_clip(p):
    return f'<clipPath id="{p}in"><path d="{inner_poly()}"/></clipPath>'


def blades(p):
    g = ""
    for a, ln in ((-20, 82), (160, 82), (70, 46), (250, 46)):
        g += f'<g transform="rotate({a} 300 662)">' + P("M300,656 Q340,642 " + f"{300 + ln},650 Q{300 + ln * .8},668 300,668Z", CHROME_D) + P(f"M300,657 Q336,646 {300 + ln - 6},652 Q{300 + ln * .7},660 300,662Z", CHROME_L, ' opacity="0.8"') + "</g>"
    g += C(300, 664, 16, CHROME_D) + C(298, 661, 10, CHROME_L)
    return g


def blender_jar_back():
    p = "jb-"
    L = []
    cx, cy, cw, ch = COLLAR[0], COLLAR[1], COLLAR[2], COLLAR[3]
    col = P(wrect(cx, cy, cw, ch, 18, .8, 3), BL_D) + P(wrect(cx + 4, cy, cw - 8, ch - 10, 16, .6, 4), BL)
    col += "".join(P(wrect(x - 4, cy + 14, 8, ch - 34, 4, .3, x), BL_D, ' opacity="0.5"') for x in range(cx + 26, cx + cw - 20, 26))
    col += P(wrect(cx + 18, cy + 8, cw - 36, 10, 5, .4, 5), BL_L, ' opacity="0.8"')
    L.append(G(col, p + "cut"))
    # back glass: a pale tint behind everything, darker at the edges
    grad = (f'<linearGradient id="{p}g" x1="92" y1="0" x2="508" y2="0" gradientUnits="userSpaceOnUse">'
            f'<stop offset="0" stop-color="{GLASS_D}" stop-opacity="0.9"/><stop offset="0.25" stop-color="{GLASS}" stop-opacity="0.55"/>'
            f'<stop offset="0.75" stop-color="{GLASS}" stop-opacity="0.55"/><stop offset="1" stop-color="{GLASS_D}" stop-opacity="0.9"/></linearGradient>')
    L.append(G(P(body_outer(), f"url(#{p}g)"), p + "sh"))
    L.append(P(f"M{IN_BOT[0]},{IN_BOT[2]} Q300,{IN_BOT[2] + 20} {IN_BOT[1]},{IN_BOT[2]} Q300,{IN_BOT[2] - 16} {IN_BOT[0]},{IN_BOT[2]}Z", GLASS_D, ' opacity="0.8"'))   # floor
    L.append(G(blades(p), p + "sh"))
    # far half of the rim (the near half is on the front layer)
    far = (f"M{RIM_C[0] - RIM_RX},{RIM_C[1]} A{RIM_RX},{RIM_RY} 0 0 1 {RIM_C[0] + RIM_RX},{RIM_C[1]} L{RIM_C[0] + MOUTH_RX},{RIM_C[1] + 2} "
           f"A{MOUTH_RX},{MOUTH_RY} 0 0 0 {RIM_C[0] - MOUTH_RX},{RIM_C[1] + 2}Z")
    L.append(P(far, GLASS_D) + P(f"M{RIM_C[0] - RIM_RX + 20},{RIM_C[1] - 6} A{RIM_RX - 20},{RIM_RY - 6} 0 0 1 {RIM_C[0] + RIM_RX - 20},{RIM_C[1] - 6}", "none",
                                 f' stroke="{WHITE}" stroke-width="4" opacity="0.7"'))
    return gen_items.doc(p, JW, JH, "".join(L), seed=601, sh=(4, 3.5, .3), extra_defs=grad)


def blender_jar_front():
    p = "jf-"
    L = []
    L.append(P(body_outer(), GLASS, ' opacity="0.16"'))
    # thick glass side walls (the contents stay clearly visible between them)
    l0, r0, y0 = OUT_TOP; l1, r1, y1 = OUT_BOT
    L.append(P(f"M{l0},{y0} L{l1},{y1 - 14} L{l1 + 16},{y1 - 10} L{l0 + 16},{y0 + 8}Z", GLASS_D, ' opacity="0.75"'))
    L.append(P(f"M{r0},{y0} L{r1},{y1 - 14} L{r1 - 16},{y1 - 10} L{r0 - 16},{y0 + 8}Z", GLASS_D, ' opacity="0.75"'))
    L.append(P(f"M{l1 + 4},{y1 - 12} Q300,{y1 + 10} {r1 - 4},{y1 - 12} L{r1 - 4},{y1 - 2} Q300,{y1 + 18} {l1 + 4},{y1 - 2}Z", GLASS_D, ' opacity="0.8"'))
    # highlights
    L.append(P("M136,176 L186,640 L204,640 L156,176Z", WHITE, ' opacity="0.55"') + P("M172,190 L206,520 L214,520 L182,190Z", WHITE, ' opacity="0.4"'))
    L.append(P("M468,190 L428,600 L436,600 L478,190Z", WHITE, ' opacity="0.35"'))
    # measuring ticks (no numbers): short marks down the right wall, every third one longer
    t = ""
    for i, y in enumerate(range(230, 640, 50)):
        xr = r0 - 16 - (y - y0) / (y1 - y0) * (r0 - r1) - 6
        t += stroke(f"M{n(xr)},{y} L{n(xr - (40 if i % 3 == 0 else 22))},{y}", mix(TEAL_D, GLASS_D, .3), 6, ' opacity="0.8"')
    L.append(t)
    # outline with the torn paper rim, then the near half of the rim, the lip and the handle
    L.append(G(stroke(body_outer(), GLASS_D, 7), p + "cut"))
    near = (f"M{RIM_C[0] - RIM_RX},{RIM_C[1]} A{RIM_RX},{RIM_RY} 0 0 0 {RIM_C[0] + RIM_RX},{RIM_C[1]} L{RIM_C[0] + MOUTH_RX},{RIM_C[1] + 2} "
            f"A{MOUTH_RX},{MOUTH_RY} 0 0 1 {RIM_C[0] - MOUTH_RX},{RIM_C[1] + 2}Z")
    L.append(G(P(near, mix(GLASS, GLASS_D, .5)), p + "sh"))
    L.append(P(f"M{RIM_C[0] - 150},{RIM_C[1] + 24} Q300,{RIM_C[1] + 36} {RIM_C[0] + 150},{RIM_C[1] + 24}", "none", f' stroke="{WHITE}" stroke-width="5" opacity="0.8"'))
    L.append(G(P(f"M{SPOUT[0] + 22},{RIM_C[1] - 6} L{SPOUT[0]},{SPOUT[1]} Q{SPOUT[0] - 4},{SPOUT[1] + 12} {SPOUT[0] + 14},{RIM_C[1] + 10} L{SPOUT[0] + 30},{RIM_C[1] + 4}Z",
                   mix(GLASS, GLASS_D, .5)), p + "cut"))
    hd = P(HANDLE, BL_D) + P("M504,196 C552,194 572,222 572,300 L566,466 C564,526 540,550 482,552 L482,540 C530,538 552,516 554,466 L560,300 C562,236 548,214 506,212Z", BL)
    hd += P("M556,270 L552,450 L562,450 L566,270Z", BL_L, ' opacity="0.8"')
    hd += P(wrect(478, 176, 40, 58, 12, .4, 7), BL_D) + P(wrect(468, 506, 40, 66, 12, .4, 8), BL_D)
    L.append(G(hd, p + "cut"))
    return gen_items.doc(p, JW, JH, "".join(L), seed=603, sh=(4, 3.5, .3))


# ---------------- contents (same 600x800 frame, clipped to the inside of the jar) ----------------
def piece_defs(p):
    """Flat (unfiltered) copies of the four slice drawings, centred on (0,0) at 140-box size."""
    d = ""
    for f in SA.FRUITS:
        g, _ = SA.PIECES[f](p)
        d += f'<g id="{p}{f[0]}" transform="translate(-70 -70)">{unfilter(g)}</g>'
    return d


def use(p, f, x, y, s, rot, tilt):
    return f'<use href="#{p}{f[0]}" transform="translate({n(x)} {n(y)}) scale({n(s)} {n(s * tilt)}) rotate({rot})"/>'


HEAP_TOP = {1: 540, 2: 404, 3: 262}         # top of the fruit pile inside the jar


def pile(p, top, seed, s=.9, dens=1.0):
    r = random.Random(seed)
    items = []
    y = IN_BOT[2] - 10
    row = 0
    while y > top + 10:
        hw = half_w(y)
        cnt = max(2, int(2 * hw / (104 / dens)))
        for i in range(cnt + 1):
            x = 300 - hw + (i + (.5 if row % 2 else 0)) * (2 * hw / cnt) + r.uniform(-10, 10)
            f = SA.FRUITS[(i + row * 2 + r.randint(0, 1)) % 4]
            items.append((y, use(p, f, x, y + r.uniform(-6, 6), s * r.uniform(.9, 1.08), r.randint(0, 359), r.uniform(.62, .9))))
        y -= 52
        row += 1
    # crown: a few pieces poking out of the top, a little tilted towards the viewer
    hw = half_w(top)
    for i in range(5):
        x = 300 - hw * .8 + i * hw * .4 + r.uniform(-8, 8)
        items.append((top + 40, use(p, SA.FRUITS[(i + 1) % 4], x, top + 18 + r.uniform(-6, 6) + abs(x - 300) * .08, s, r.randint(0, 359), r.uniform(.7, .88))))
    items.sort(key=lambda q: q[0])
    return items


def jar_heap(stage):
    p = f"jh{stage}-"
    top = HEAP_TOP[stage]
    fill = (f"M{n(300 - half_w(top + 30))},{top + 30} Q300,{top - 6} {n(300 + half_w(top + 30))},{top + 30} L{IN_BOT[1]},{IN_BOT[2]} "
            f"Q300,{IN_BOT[2] + 20} {IN_BOT[0]},{IN_BOT[2]}Z")
    body = P(fill, mix(mix(MAN_F, STR_F, .5), STR_D, .3))                                # juicy pink-orange gaps between the pieces (not brown)
    items = pile(p, top, 30 + stage)
    third = max(1, len(items) // 3)
    for lay in (items[:third], items[third:2 * third], items[2 * third:]):
        body += G("".join(u for _, u in lay), p + "sh")
    L = [jar_clip(p), G(body, None, f' clip-path="url(#{p}in)"')]
    return gen_items.doc(p, JW, JH, "".join(L), seed=611 + stage, sh=(3, 2.5, .33), extra_defs=piece_defs(p))


LEVEL = 232                                  # liquid level of the blend stages (heap-3 + milk)


def blend_stage(stage):
    p = f"bs{stage}-"
    hw = half_w(LEVEL)
    col = {1: mix(MILK, SMO, .45), 2: mix(SMO, MILK, .18), 3: SMO}[stage]
    top = {1: mix(MILK, SMO, .25), 2: mix(SMO_L, MILK, .2), 3: SMO_F}[stage]
    liquid = f"M{n(300 - hw)},{LEVEL} L{IN_BOT[0]},{IN_BOT[2]} Q300,{IN_BOT[2] + 20} {IN_BOT[1]},{IN_BOT[2]} L{n(300 + hw)},{LEVEL}Z"
    body = P(liquid, col)
    grad = (f'<linearGradient id="{p}sh" x1="0" y1="0" x2="600" y2="0" gradientUnits="userSpaceOnUse">'
            f'<stop offset="0.15" stop-color="{SMO_D}" stop-opacity="0.45"/><stop offset="0.4" stop-color="{SMO_D}" stop-opacity="0"/>'
            f'<stop offset="0.7" stop-color="{SMO_D}" stop-opacity="0"/><stop offset="0.88" stop-color="{SMO_D}" stop-opacity="0.4"/></linearGradient>')
    body += P(liquid, f"url(#{p}sh)")
    r = random.Random(stage * 7)
    if stage == 1:     # chunky: many whole pieces in pale pink milk, milk swirls
        items = pile(p, LEVEL + 40, 41, s=.8, dens=.8)
        body += G("".join(u for _, u in items[::2]), p + "sh")
        body += "".join(stroke(f"M{n(300 - half_w(y) + 20)},{y} Q300,{y + 40 * (1 if i % 2 else -1)} {n(300 + half_w(y) - 20)},{y - 20}", WHITE, 10, ' opacity="0.45"')
                        for i, y in enumerate(range(320, 660, 80)))
    elif stage == 2:   # half: small bits and a whirl
        for i in range(40):
            y = r.uniform(LEVEL + 40, IN_BOT[2] - 10); x = 300 + r.uniform(-.85, .85) * half_w(y)
            f = SA.FRUITS[i % 4]
            body += use(p, f, x, y, r.uniform(.22, .34), r.randint(0, 359), r.uniform(.6, .9))
        body += "".join(stroke(f"M{n(300 - half_w(y) + 10)},{y} C220,{y + 50} 380,{y + 50} {n(300 + half_w(y) - 10)},{y - 10}", SMO_L, 9, ' opacity="0.6"')
                        for y in range(300, 660, 70))
    else:              # smooth: one colour, soft bubbles, gloss
        body += "".join(C(300 + r.uniform(-.8, .8) * half_w(y), y, r.uniform(4, 9), SMO_L, ' opacity="0.7"')
                        for y in [r.uniform(LEVEL + 60, IN_BOT[2] - 20) for _ in range(18)])
        body += P(f"M{n(300 - hw + 40)},{LEVEL + 70} Q{n(300 - hw + 70)},{LEVEL + 250} {n(300 - hw + 100)},{LEVEL + 400} L{n(300 - hw + 120)},{LEVEL + 400} "
                  f"Q{n(300 - hw + 86)},{LEVEL + 250} {n(300 - hw + 62)},{LEVEL + 70}Z", WHITE, ' opacity="0.3"')
    # the surface
    surf = E(300, LEVEL, hw, hw * .15, top)
    if stage == 2:     # a whirl in the middle
        surf += E(300, LEVEL + 4, hw * .5, hw * .07, SMO_D, ' opacity="0.35"') + stroke(f"M{300 - hw * .7},{LEVEL} Q300,{LEVEL + 22} {300 + hw * .5},{LEVEL - 4}", WHITE, 6, ' opacity="0.6"')
    if stage == 3:     # foam
        foam = "".join(C(300 + math.cos(a) * hw * .9, LEVEL + math.sin(a) * hw * .13, r.uniform(12, 20), SMO_F) for a in [i / 22 * 2 * math.pi for i in range(22)])
        surf += foam + E(300, LEVEL, hw * .8, hw * .1, mix(SMO_F, WHITE, .4)) + "".join(C(300 + r.uniform(-.6, .6) * hw, LEVEL + r.uniform(-10, 10), r.uniform(4, 8), WHITE, ' opacity="0.8"') for _ in range(10))
    if stage == 1:     # pieces floating on the milk
        surf += "".join(use(p, SA.FRUITS[i % 4], 300 - hw * .7 + i * hw * .35, LEVEL + r.uniform(-6, 8), .5, r.randint(0, 359), .45) for i in range(5))
    body += G(surf, p + "sh")
    L = [jar_clip(p), G(body, None, f' clip-path="url(#{p}in)"')]
    return gen_items.doc(p, JW, JH, "".join(L), material="smooth", seed=621 + stage, sh=(3, 2.5, .3), extra_defs=piece_defs(p) + grad)


# ---------------- lid (480x240): seat (240, 150) lands on the jar mouth (300, 118) at the same scale ----------------
LID_SEAT = (240, 150)


def blender_lid():
    p = "bl-"
    L = [G(E(240, 196, 200, 20, SH, ' opacity="0.28"'), p + "bl")]
    body = P("M44,106 L44,142 A196,32 0 0 0 436,142 L436,106Z", TEAL_D)                  # side band
    body += P("M60,142 L60,164 A180,24 0 0 0 420,164 L420,142Z", mix(TEAL_D, "#1E4E52", .3))   # plug that goes into the mouth
    body += E(240, 106, 196, 36, TEAL)
    L.append(G(body, p + "cut"))
    L.append("".join(P(wrect(x - 3, 116, 6, 22, 3, .2, x), TEAL_D, ' opacity="0.7"') for x in range(64, 420, 22)))
    L.append(E(240, 104, 170, 28, mix(TEAL, TEAL_L, .35)))
    cap = P("M186,54 L186,96 A54,14 0 0 0 294,96 L294,54Z", BL_D) + E(240, 54, 54, 15, BL) + E(228, 50, 24, 6, BL_L, ' opacity="0.9"')   # coral centre cap
    L.append(G(cap, p + "sh"))
    L.append(G(heart(240, 80, .55, CREAM), p + "sh"))
    L.append(P("M70,96 Q120,76 190,72 Q126,84 84,104Z", WHITE, ' opacity="0.5"'))
    return gen_items.doc(p, 480, 240, "".join(L), seed=631, sh=(4, 3.5, .33))


# ---------------- base (700x520): the jar SEAT (300, 776) sits on BASE_SEAT; button centre BUTTON_C ----------------
BASE_SEAT = (350, 108)
BUTTON_C = (350, 306)


def blender_base():
    p = "bb-"
    L = [ground_shadow(350, 494, 300, 18, p, .36)]
    L.append(G(P(wrect(120, 466, 90, 30, 12, .5, 1), mix(BL_D, "#5A1E10", .3)) + P(wrect(490, 466, 90, 30, 12, .5, 2), mix(BL_D, "#5A1E10", .3)), p + "sh"))
    shell = "M126,108 L574,108 Q604,108 610,140 L646,430 Q650,478 604,478 L96,478 Q50,478 54,430 L90,140 Q96,108 126,108Z"
    L.append(G(P(shell, BL_D), p + "cut"))
    L.append(P("M130,116 L570,116 Q596,116 600,144 L634,424 Q638,464 598,464 L102,464 Q62,464 66,424 L100,144 Q104,116 130,116Z", BL))
    L.append(P("M110,150 Q116,124 140,124 L230,124 Q160,140 130,300 Q118,380 100,420Z", BL_L, ' opacity="0.5"'))
    band = P("M72,392 L628,392 L634,430 Q638,464 598,464 L102,464 Q62,464 66,430Z", TEAL)
    band += "".join(C(x, 428, 7, CREAM) for x in range(110, 600, 44))
    L.append(G(band, p + "sh"))
    # seat plate on top where the jar collar stands
    L.append(G(E(350, 110, 196, 30, mix(BL_D, "#5A1E10", .25)) + E(350, 104, 186, 24, CHROME_D) + E(350, 101, 160, 18, CHROME), p + "sh"))
    # round recess for the big button
    bx, by = BUTTON_C
    L.append(G(C(bx, by, 124, mix(BL_D, "#5A1E10", .2)) + C(bx, by + 3, 116, mix(BL_D, "#3A1A10", .45)), p + "sh"))
    L.append(P(f"M{bx - 110},{by + 30} A116,116 0 0 0 {bx + 110},{by + 30} A112,100 0 0 1 {bx - 110},{by + 30}Z", BL_L, ' opacity="0.5"'))
    # two little lights either side (tell the child "this is a machine")
    L.append(G(C(170, 300, 18, CREAM2) + C(170, 300, 12, GREEN_L) + C(530, 300, 18, CREAM2) + C(530, 300, 12, CHEESE), p + "sh"))
    return gen_items.doc(p, 700, 520, "".join(L), material="rough", seed=641, sh=(4, 3.5, .33), paper={"fibre": .1, "tooth": .35, "mottle": .12})


# ---------------- button (280x280, centre (140,140)) ----------------
def swirl(cx, cy, s, col):
    """Three curved blades: the 'blend' symbol (no text)."""
    g = ""
    for k in range(3):
        a = k * 120
        g += f'<g transform="rotate({a} {cx} {cy})">' + P(f"M{cx},{cy} C{cx + 10 * s},{cy - 34 * s} {cx + 44 * s},{cy - 44 * s} {cx + 56 * s},{cy - 20 * s} C{cx + 36 * s},{cy - 28 * s} {cx + 18 * s},{cy - 14 * s} {cx + 8 * s},{cy + 6 * s}Z", col) + "</g>"
    return g + C(cx, cy, 11 * s, col)


def blender_button(on):
    p = "bo-" if on else "bf-"
    c = (140, 140)
    L, defs = [], ""
    if on:
        defs = (f'<radialGradient id="{p}h" cx="140" cy="140" r="138" gradientUnits="userSpaceOnUse">'
                f'<stop offset="0.66" stop-color="{CHEESE}" stop-opacity="0.9"/><stop offset="0.84" stop-color="{CHEESE}" stop-opacity="0.35"/>'
                f'<stop offset="1" stop-color="{CHEESE}" stop-opacity="0"/></radialGradient>')
        L.append(C(*c, 138, f"url(#{p}h)"))
    depth, press = (5, 8) if on else (18, 0)
    rim = mix(RED_D, "#7A2016", .2)
    L.append(G(P(wob(c[0], c[1] + depth / 2, 104, 104, .006, 3, 32), rim) + P(wob(c[0], c[1] + depth / 2, 104, 102, .006, 3, 32), rim, f' transform="translate(0 {depth / 2})"'), p + "cut"))
    face, light = (mix(RED, CHEESE, .25), CHEESE_L) if on else (RED, RED_L)
    L.append(G(P(wob(c[0], c[1] - 6 + press, 96, 94, .008, 4, 32), face), p + "sh"))
    L.append(P(wob(c[0] - 8, c[1] - 22 + press, 64, 52, .04, 5, 24), light, f' opacity="{.55 if on else .5}"'))
    L.append(P(f"M60,{118 + press} Q70,{66 + press} 124,{48 + press} Q90,{76 + press} 80,{126 + press}Z", WHITE, ' opacity="0.5"'))
    L.append(G(f'<g transform="rotate({40 if on else 0} 140 {134 + press})">' + swirl(140, 134 + press, 1.25, CREAM if not on else WHITE) + "</g>", p + "sh2"))
    d = std_defs(p, "default", seed=651 + on, sh=(4, 3, .36), sh2=(3, 2, .35), cut={"rim": 2.4, "rough": 4.5})
    return svg(280, 280, d + defs, G("".join(L), p + "gr"))


ITEMS = {"blender-jar-back": blender_jar_back, "blender-jar-front": blender_jar_front,
         "jar-heap-1": lambda: jar_heap(1), "jar-heap-2": lambda: jar_heap(2), "jar-heap-3": lambda: jar_heap(3),
         "blend-stage-1": lambda: blend_stage(1), "blend-stage-2": lambda: blend_stage(2), "blend-stage-3": lambda: blend_stage(3),
         "blender-lid": blender_lid, "blender-base": blender_base,
         "blender-button-off": lambda: blender_button(False), "blender-button-on": lambda: blender_button(True)}

if __name__ == "__main__":
    run(ITEMS)
