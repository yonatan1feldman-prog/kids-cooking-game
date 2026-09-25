# images-b-salad, part B: lettuce (4 states), wooden salad bowl (2 layers) + mixed salad, serving bowl, salad portion,
# salad servers, colander with the vegetables.
# Run: python tools/gen_salad_b.py [names...]   (writes into images-b-salad/ only)
import math, random, re, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from saladkit import *  # noqa: F401,F403
import gen_salad_a as SA


# ---------------- helpers ----------------
FK = [52]


def frill(cx, cy, rx, ry, rot=0, seed=1, k=None, amp=1.0, a0=0, a1=2 * math.pi, closed=True):
    """Ruffled (frilly) ellipse: the lettuce leaf edge."""
    k = k or FK[0]
    r = random.Random(seed)
    ph = [r.uniform(0, 6.3) for _ in range(3)]
    ca, sa = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    pts = []
    for i in range(k):
        a = a0 + (a1 - a0) * i / (k if closed else k - 1)
        f = 1 + amp * (.035 * math.sin(13 * a + ph[0]) + .022 * math.sin(21 * a + ph[1]) + .03 * math.sin(3 * a + ph[2]))
        x, y = math.cos(a) * rx * f, math.sin(a) * ry * f
        pts.append((cx + x * ca - y * sa, cy + x * sa + y * ca))
    return pts


def taper(p0, c, p1, w0, w1, k=14):
    """Tapered curved band (a leaf rib): quadratic centre line p0 -> p1, width w0 -> w1."""
    L, R = [], []
    for i in range(k + 1):
        u = i / k
        x = (1 - u) ** 2 * p0[0] + 2 * (1 - u) * u * c[0] + u * u * p1[0]
        y = (1 - u) ** 2 * p0[1] + 2 * (1 - u) * u * c[1] + u * u * p1[1]
        dx = 2 * (1 - u) * (c[0] - p0[0]) + 2 * u * (p1[0] - c[0]); dy = 2 * (1 - u) * (c[1] - p0[1]) + 2 * u * (p1[1] - c[1])
        ln = math.hypot(dx, dy) or 1
        w = (w0 + (w1 - w0) * u) / 2
        L.append((x - dy / ln * w, y + dx / ln * w)); R.append((x + dy / ln * w, y - dx / ln * w))
    return smooth(L + R[::-1], .12)


# ================= LETTUCE (640x560, four states in one frame) =================
LW, LH = 640, 560


def lettuce_head_body(p, full=True, simple=False):
    """Round butterhead lettuce centred (320,300), base at y~505. full=False leaves out the front-left wrap leaf (one torn off)."""
    L = []
    back = P(smooth(frill(196, 292, 150, 176, -22, 1)), LET_D) + P(smooth(frill(444, 292, 150, 176, 22, 2)), LET_D)
    back += P(smooth(frill(320, 300, 214, 200, 0, 3)), LET_D)
    L.append(G(back, p + "cut"))
    L.append(P(smooth(frill(200, 286, 138, 162, -22, 4)), LET) + P(smooth(frill(440, 286, 138, 162, 22, 5)), LET))
    for (x0, y0, cx, cy, x1, y1) in ((300, 480, 170, 380, 110, 200), (340, 480, 470, 380, 530, 200)):   # outer ribs
        L.append(P(taper((x0, y0), (cx, cy), (x1, y1), 16, 5), "#D6EFA6", ' opacity="0.8"'))
    L.append(G(P(smooth(frill(320, 318, 186, 172, 0, 6)), LET), p + "sh"))               # body of the head
    heart = frill(322, 258, 132, 112, 0, 7, amp=.7)
    L.append(G(P(smooth(heart), LET_L), p + "sh"))                                         # pale heart
    L.append(P(smooth(frill(318, 240, 88, 66, 0, 8, amp=.6)), "#D2EE9C"))
    L.append(P(taper((300, 300), (318, 250), (356, 196), 14, 4), "#C3E68A", ' opacity="0.9"'))
    L.append(P(taper((346, 304), (338, 256), (300, 210), 12, 4), "#C3E68A", ' opacity="0.8"'))
    if simple:
        return "".join(L)
    # wrapping front leaves: cup the heart from both sides, rib from the base
    wraps = [((208, 372, 150, 128, -30, 9), ((300, 500), (190, 440), (118, 320))),
             ((432, 372, 150, 128, 30, 10), ((340, 500), (450, 440), (522, 320)))]
    if not full:
        wraps = wraps[1:]
    for (cx, cy, rx, ry, rot, sd), rib in wraps:
        pts = frill(cx, cy, rx, ry, rot, sd, amp=1.2)
        L.append(G(P(smooth(pts), LET_D), p + "sh"))
        L.append(P(smooth([(cx + (x - cx) * .94, cy + (y - cy) * .94 - 7) for x, y in pts]), LET))
        L.append(P(wob(cx - 20, cy - 34, 70, 34, .1, sd + 20, 14, rot), LET_L, ' opacity="0.8"'))
        L.append(P(taper(rib[0], rib[1], rib[2], 17, 5), "#D6EFA6", ' opacity="0.9"'))
        for u, side in ((.35, 1), (.55, -1), (.72, 1)):                                    # veins off the rib
            (x0, y0), (cx2, cy2), (x1, y1) = rib
            bx = (1 - u) ** 2 * x0 + 2 * (1 - u) * u * cx2 + u * u * x1; by = (1 - u) ** 2 * y0 + 2 * (1 - u) * u * cy2 + u * u * y1
            dx = 1 if x1 > x0 else -1
            L.append(P(taper((bx, by), (bx + dx * 30, by - 10 * side), (bx + dx * 58, by - 40 * side), 7, 3), "#D6EFA6", ' opacity="0.75"'))
    L.append(G(P(wob(320, 500, 44, 16, .05, 11, 14), "#E9F3C8"), p + "sh"))               # stalk base
    return "".join(L)


def tear_defs(p):
    """Four torn-piece shapes (the piece-lettuce drawing at other seeds), reused with <use>."""
    d = ""
    for i, (seed, rot) in enumerate(((11, -28), (23, 40), (37, 120), (51, -80))):
        g, _ = SA.leaf_body(0, 0, 50, seed, rot)
        d += f'<g id="{p}t{i}">{g}</g>'
    return d


def pile(p, pts, seed):
    r = random.Random(seed)
    return "".join(f'<use href="#{p}t{r.randint(0, 3)}" transform="translate({n(x)} {n(y)}) rotate({r.randint(0, 359)}) scale({n(s)} {n(s * r.uniform(.72, 1))})"/>'
                   for x, y, s in sorted(pts, key=lambda q: q[1]))


def mound(cx, base, w, h, cnt, seed, s=1.1):
    """Points for a heap of torn pieces: a dome of width w and height h standing on y=base."""
    r = random.Random(seed)
    pts = []
    for i in range(cnt):
        x = cx + r.uniform(-1, 1) * w / 2
        top = base - h * max(0, 1 - ((x - cx) / (w / 2)) ** 2) ** .7
        pts.append((x, r.uniform(top + 30, base - 24), s * r.uniform(.9, 1.1)))
    return pts


def lettuce(stage):
    p = f"lt{stage}-"
    L = []
    if stage == 0:
        L.append(ground_shadow(320, 516, 230, 16, p, .34))
        L.append(lettuce_head_body(p))
    elif stage == 1:
        L.append(ground_shadow(300, 516, 210, 15, p, .34) + ground_shadow(530, 522, 90, 10, p, .3))
        L.append(f'<g transform="translate(290 505) scale(.9) translate(-320 -505)">{lettuce_head_body(p, full=False)}</g>')
        L.append(G(pile(p, [(500, 486, 1.0), (566, 470, .95), (548, 512, 1.05)], 3), p + "cut"))
    elif stage == 2:
        L.append(ground_shadow(210, 516, 140, 12, p, .34) + ground_shadow(440, 522, 170, 13, p, .32))
        L.append(f'<g transform="translate(200 505) scale(.6) translate(-320 -505)">{lettuce_head_body(p, full=False)}</g>')
        L.append(G(pile(p, mound(440, 520, 300, 150, 11, 5), 5), p + "cut"))
    else:
        L.append(ground_shadow(320, 522, 250, 16, p, .34))
        L.append(G(pile(p, mound(320, 524, 470, 270, 22, 7, 1.15), 7), p + "cut"))
    return gen_items.doc(p, LW, LH, "".join(L), seed=331 + stage, sh=(4, 3.5, .33), extra_defs=tear_defs(p) if stage else "")


# ================= SALAD BOWL (900x620, back + front layers; salad-mixed in the same frame) =================
SW_, SH_ = 900, 620
RC, RRX, RRY = (450, 210), 420, 118          # rim ellipse
OC, ORX, ORY = (450, 218), 388, 100          # opening ellipse
SBODY = "M30,210 C30,440 200,580 450,580 C700,580 870,440 870,210Z"
SFRONT = f"M30,210 C30,440 200,580 450,580 C700,580 870,440 870,210 L838,218 A{ORX},{ORY} 0 0 1 62,218Z"
SFRONT_RIM = f"M30,210 A{RRX},{RRY} 0 0 0 870,210 L838,218 A{ORX},{ORY} 0 0 1 62,218Z"
BOWL, BOWL_D, BOWL_L = mix(WALNUT, WOOD, .25), WALNUT_D, mix(WALNUT_L, WOOD_L, .5)


def salad_bowl_back():
    p = "sbb-"
    L = [G(E(450, 594, 350, 20, SH, ' opacity="0.36"'), p + "bl")]
    L.append(G(P(wob(450, 568, 170, 20, .02, 3), BOWL_D), p + "sh"))
    L.append(G(P(SBODY, BOWL) + E(*RC, RRX, RRY, BOWL_D), p + "cut"))
    L.append(E(*RC, RRX, RRY, BOWL_L))
    grad = (f'<linearGradient id="{p}in" x1="0" y1="{OC[1] - ORY}" x2="0" y2="{OC[1] + ORY}" gradientUnits="userSpaceOnUse">'
            f'<stop offset="0" stop-color="{mix(WALNUT_D, "#3A200F", .45)}"/><stop offset="0.6" stop-color="{WALNUT_D}"/>'
            f'<stop offset="1" stop-color="{WALNUT}"/></linearGradient>')
    L.append(E(*OC, ORX, ORY, f"url(#{p}in)"))
    gr = "".join(ring(wobp(450, 244 + i * 8, rr + 3, rr * .24 + 3, .01, 20 + i, 36), wobp(450, 244 + i * 8, rr - 3, rr * .24 - 3, .01, 20 + i, 36),
                      WALNUT_L, ' opacity="0.25"') for i, rr in enumerate((330, 250, 160)))                 # turned-wood rings on the floor
    L.append(gr)
    L.append(G(E(450, 270, 250, 40, WALNUT_L, ' opacity="0.35"'), p + "bl"))
    L.append(P("M110,190 Q260,136 440,130 Q270,150 124,204Z", "#F0C896", ' opacity="0.35"'))
    return gen_items.doc(p, SW_, SH_, "".join(L), material="rough", seed=341, sh=(4, 3.5, .33), extra_defs=grad,
                         paper={"fibre": .1, "tooth": .35, "mottle": .12})


def salad_bowl_front():
    p = "sbf-"
    L = [G(P(SFRONT, BOWL), p + "cut")]
    L.append(f'<clipPath id="{p}f"><path d="{SFRONT}"/></clipPath>')
    inner = P("M40,360 C100,520 250,578 450,578 C650,578 800,520 860,360 C800,480 650,540 450,540 C250,540 100,480 40,360Z", BOWL_D, ' opacity="0.75"')
    for i, y in enumerate((300, 350, 420, 470)):                                             # wood grain following the bowl
        w = 400 - (y - 280) * .7
        inner += P(f"M{n(450 - w)},{y} Q450,{y + 64 - i * 6} {n(450 + w)},{y} Q450,{y + 54 - i * 6} {n(450 - w)},{y}Z", BOWL_D, ' opacity="0.45"')
    band = "M44,286 Q450,380 856,286 L846,322 Q450,420 54,322Z"                              # painted teal band with cream dots
    inner += G(P(band, TEAL), p + "sh")
    inner += "".join(C(x, 306 + 50 * (1 - ((x - 450) / 410) ** 2), 8, CREAM) for x in range(90, 820, 52))
    inner += P("M58,236 Q70,360 170,448 Q100,356 92,244Z", "#F0C896", ' opacity="0.45"')
    L.append(G(inner, None, f' clip-path="url(#{p}f)"'))
    L.append(P(SFRONT_RIM, BOWL_L))
    L.append(P("M120,262 Q450,322 780,262 Q450,310 120,262Z", WHITE, ' opacity="0.4"'))
    return gen_items.doc(p, SW_, SH_, "".join(L), material="rough", seed=343, sh=(4, 3.5, .33), paper={"fibre": .1, "tooth": .35, "mottle": .12})


# ---- salad pieces for the mixed layer / portion (flat layers, reused with <use>) ----
def mix_defs(p):
    d = ""
    g, _ = SA.leaf_body(0, 0, 40, 11, -28); d += f'<g id="{p}L0">{g}</g>'
    g, _ = SA.leaf_body(0, 0, 40, 23, 50); d += f'<g id="{p}L1">{g}</g>'
    g, _ = SA.leaf_body(0, 0, 40, 51, 150, colors=(mix(LET_D, LET, .3), LET_L, "#D6F09E", LET_P)); d += f'<g id="{p}L2">{g}</g>'   # paler heart leaf
    cu = C(0, 0, 27, CUKE_D) + C(-.5, -1, 24.5, CUKE) + C(0, 0, 22, CUKE_F) + P(smooth(polar(0, .5, lambda a: 12 + 2 * math.cos(3 * a), 18)), "#BFE08A")
    cu += "".join(E(math.cos(a) * 7.5, .5 + math.sin(a) * 7.5, 2, 3.4, CUKE_SEED, f' transform="rotate({n(math.degrees(a) + 90)} {n(math.cos(a) * 7.5)} {n(.5 + math.sin(a) * 7.5)})"')
                  for a in (.5, 2.6, 4.7))
    cu += P("M-20,-6 Q-16,-19 -4,-23 Q-13,-15 -16,-4Z", WHITE, ' opacity="0.6"')
    d += f'<g id="{p}C">{cu}</g>'
    ca = C(0, 0, 24, CAR_D) + C(-.5, -1, 21.5, CAR) + C(0, 0, 13, mix(CAR, CAR_D, .35)) + C(0, 0, 11, CAR_L) + C(0, 0, 6, CAR_C)
    ca += P("M-17,-5 Q-14,-15 -4,-18 Q-11,-12 -13,-3Z", "#FFD7A8", ' opacity="0.9"')
    d += f'<g id="{p}K">{ca}</g>'
    to = C(0, 0, 28, mix(RED_D, "#7A2016", .28)) + C(-.5, -1, 25, RED) + C(0, 0, 19, RED_L)
    for i in range(3):
        a = i / 3 * 2 * math.pi - math.pi / 2 + .3
        to += P(wob(math.cos(a) * 10, math.sin(a) * 10, 7.5, 5.5, .08, 20 + i, 12, math.degrees(a)), SEEDPOCK)
        to += E(math.cos(a) * 11, math.sin(a) * 11, 1.8, 2.8, SEED, f' transform="rotate({n(math.degrees(a))} {n(math.cos(a) * 11)} {n(math.sin(a) * 11)})"')
    to += P("M-21,-4 Q-18,-17 -7,-22 Q-15,-14 -17,-2Z", "#FFC1A8", ' opacity="0.85"')
    d += f'<g id="{p}T">{to}</g>'
    arc = lambda rr, a0, a1, k=10: [(math.cos(a0 + (a1 - a0) * i / k) * rr, math.sin(a0 + (a1 - a0) * i / k) * rr) for i in range(k + 1)]
    a0, a1 = math.radians(190), math.radians(360)
    pe = P(smooth(arc(27, a0, a1) + arc(15, a0, a1)[::-1]), PEPPER_D) + P(smooth(arc(25, a0, a1) + arc(16, a0, a1)[::-1]), PEPPER) + P(smooth(arc(21, a0, a1) + arc(16, a0, a1)[::-1]), PEPPER_L)
    d += f'<g id="{p}G">{pe}</g>'
    a0, a1 = math.radians(160), math.radians(380)
    on = P(smooth(arc(26, a0, a1) + arc(17, a0, a1)[::-1]), ONION_D) + P(smooth(arc(24.5, a0, a1) + arc(18, a0, a1)[::-1]), ONION) + P(smooth(arc(21.5, a0, a1) + arc(18, a0, a1)[::-1]), ONION_W)
    d += f'<g id="{p}O">{on}</g>'
    return d


MIX_KINDS = ["L0", "T", "C", "L1", "K", "G", "L2", "O", "C", "T", "L0", "K"]


def mix_use(p, kind, x, y, s, rot, tilt):
    return f'<use href="#{p}{kind}" transform="translate({n(x)} {n(y)}) rotate({rot}) scale({n(s)} {n(s * tilt)})"/>'


def heap_top(x, cx=450, hw=372, top=76, base=OC[1]):
    u = (x - cx) / hw
    return base - (base - top) * max(0, 1 - u * u) ** .6


def heap_items(p, seed, cx, hw, top, base, low, rows, s=1.0):
    """Jittered rows of pieces inside a dome (top..base), spread evenly so every kind shows."""
    r = random.Random(seed)
    items = []
    k = 0
    for j in range(rows):
        y0 = top + 30 + (low - top - 30) * j / max(1, rows - 1)
        xs = [x for x in range(int(cx - hw), int(cx + hw), int(64 * s))]
        off = r.uniform(0, 32 * s)
        for x in xs:
            x = x + off + r.uniform(-10, 10) * s
            if abs(x - cx) > hw * .98: continue
            ht = heap_top(x, cx, hw, top, base)
            if y0 < ht + 22 * s: continue
            y = y0 + r.uniform(-12, 12) * s
            kind = MIX_KINDS[(k * 5 + j) % len(MIX_KINDS)]; k += 1
            sc = (1.1 if kind.startswith("L") else 1.3) * s * r.uniform(.9, 1.08)
            items.append((y, mix_use(p, kind, x, y, sc, r.randint(0, 359), r.uniform(.62, .95))))
    # top ridge: leaves and colour along the crown so the dome edge is frilly, not a hard curve
    for i in range(14):
        x = cx - hw * .9 + i * hw * 1.8 / 13 + r.uniform(-8, 8)
        y = heap_top(x, cx, hw, top, base) + 16 * s
        kind = ["L0", "L1", "T", "L2", "C", "L1", "K", "L0", "G", "L2", "T", "L1", "O", "L0"][i]
        items.append((y, mix_use(p, kind, x, y, (1.05 if kind.startswith("L") else 1.25) * s, r.randint(0, 359), r.uniform(.6, .9))))
    items.sort(key=lambda q: q[0])
    return items


def gloss(p, pts, seed):
    """Dressing sheen, herb flecks and salt: tiny light touches on top of the pieces."""
    r = random.Random(seed)
    g = ""
    for x, y in pts:
        g += P(wob(x, y, r.uniform(5, 9), r.uniform(2.5, 4), .15, r.randint(0, 999), 10, r.uniform(-40, 10)), WHITE, ' opacity="0.7"')
    return g


def salad_mixed():
    p = "sm-"
    top = 76
    dome = [(x, heap_top(x, top=top) + 18) for x in range(76, 826, 25)]
    base = [(OC[0] + math.cos(a) * (ORX - 6), OC[1] + math.sin(a) * (ORY - 4)) for a in [i / 24 * math.pi for i in range(1, 24)]][::-1]
    fill = "M" + " L".join(f"{n(x)},{n(y)}" for x, y in dome + base[::-1]) + "Z"   # polygon: a spline overshoots at the side corners
    L = [f'<clipPath id="{p}c"><rect x="0" y="0" width="{SW_}" height="{OC[1]}"/><ellipse cx="{OC[0]}" cy="{OC[1]}" rx="{ORX - 4}" ry="{ORY - 3}"/></clipPath>']
    body = P(fill, mix(LET_D, "#2E5A22", .35))                                                # shadowy leafy base between the pieces
    items = heap_items(p, 5, 450, 372, top, OC[1], OC[1] + 70, 7)
    third = len(items) // 3
    layers = [items[:third], items[third:2 * third], items[2 * third:]]
    body += "".join(G("".join(u for _, u in lay), p + "sh") for lay in layers)
    r = random.Random(9)
    body += gloss(p, [(r.uniform(160, 740), r.uniform(120, 250)) for _ in range(12)], 3)
    body += "".join(P(wob(r.uniform(140, 760), r.uniform(110, 280), 5, 2.5, .2, 60 + i, 8, r.uniform(-60, 60)), HERB) for i in range(14))
    body += "".join(C(r.uniform(160, 740), r.uniform(110, 270), 2.6, WHITE, ' opacity="0.95"') for _ in range(18))   # salt
    L.append(G(G(body, p + "cut"), None, f' clip-path="url(#{p}c)"'))
    return gen_items.doc(p, SW_, SH_, "".join(L), seed=345, sh=(3, 2.5, .33), extra_defs=mix_defs(p))


# ================= SERVING BOWL (480x320) =================
SVC, SVRX, SVRY = (240, 118), 212, 58
SVO = ((240, 122), 196, 50)              # opening ellipse; same proportions as the salad bowl opening (388x100)
SV_MIX = 196 / ORX                       # salad-mixed scale that fits the opening


def serving_bowl():
    p = "svb-"
    (ox, oy), orx, ory = SVO
    body = f"M28,118 C28,236 112,290 240,290 C368,290 452,236 452,118Z"
    L = [G(E(240, 302, 180, 12, SH, ' opacity="0.38"'), p + "bl")]
    L.append(G(P(wob(240, 284, 90, 12, .02, 3), TEAL_D), p + "sh"))
    L.append(G(P(body, TEAL) + E(*SVC, SVRX, SVRY, TEAL), p + "cut"))
    L.append(f'<clipPath id="{p}b"><path d="{body}"/></clipPath>')
    front = P("M36,190 C70,262 150,286 240,286 C330,286 410,262 444,190 C410,246 330,268 240,268 C150,268 70,246 36,190Z", TEAL_D, ' opacity="0.8"')
    front += G(P("M34,168 Q240,232 446,168 L438,196 Q240,262 42,196Z", CREAM), p + "sh")
    front += "".join(C(x, 182 + 30 * (1 - ((x - 240) / 206) ** 2), 6.5, CORAL) for x in range(62, 430, 34))
    front += P("M44,136 Q52,200 108,244 Q70,196 64,140Z", TEAL_L, ' opacity="0.75"')
    L.append(G(front, None, f' clip-path="url(#{p}b)"'))
    L.append(E(*SVC, SVRX, SVRY, TEAL_L))
    grad = (f'<linearGradient id="{p}in" x1="0" y1="{oy - ory}" x2="0" y2="{oy + ory}" gradientUnits="userSpaceOnUse">'
            f'<stop offset="0" stop-color="{mix(TEAL_D, "#1E4F52", .35)}"/><stop offset="1" stop-color="{mix(TEAL, TEAL_D, .3)}"/></linearGradient>')
    L.append(E(ox, oy, orx, ory, f"url(#{p}in)"))
    L.append(G(E(240, 140, 130, 22, mix(TEAL, TEAL_L, .3), ' opacity="0.45"'), p + "bl"))
    L.append(P("M70,104 Q150,76 250,72 Q150,86 80,114Z", WHITE, ' opacity="0.35"'))
    return gen_items.doc(p, 480, 320, "".join(L), seed=351, sh=(4, 3.5, .33), extra_defs=grad)


# ================= SALAD PORTION on a server spoon (360x280) =================
PORTION_ANCHOR = (160, 146)


def spoon_head(cx, cy, rx, ry, rot, seed):
    return (P(wob(cx, cy + 4, rx, ry, .02, seed, 24, rot), WOOD_D) + P(wob(cx, cy, rx * .97, ry * .95, .02, seed + 1, 24, rot), WOOD)
            + P(wob(cx + 4, cy + 4, rx * .8, ry * .72, .03, seed + 2, 22, rot), mix(WOOD_D, WOOD, .4)))


def salad_portion():
    p = "sp-"
    L = [G(E(170, 250, 150, 14, SH, ' opacity="0.3"'), p + "bl")]
    handle = P(taper((250, 170), (300, 110), (336, 36), 38, 30), WOOD_D) + P(taper((250, 166), (298, 108), (334, 34), 30, 22), WOOD)
    handle += P(wob(336, 34, 17, 17, .04, 3, 12), WOOD_D) + P(wob(335, 32, 14, 14, .04, 4, 12), TEAL) + P(wob(331, 28, 5, 4, .1, 5, 8), TEAL_L)
    L.append(G(handle + spoon_head(160, 176, 136, 74, -6, 7), p + "cut"))
    r = random.Random(4)
    dome = [(x, 176 - 100 * max(0, 1 - ((x - 160) / 120) ** 2) ** .6) for x in range(40, 281, 20)]
    base = [(160 + math.cos(a) * 118, 180 + math.sin(a) * 50) for a in [i / 12 * math.pi for i in range(1, 12)]]
    body = P("M" + " L".join(f"{n(x)},{n(y)}" for x, y in dome + base[::-1]) + "Z", mix(LET_D, "#2E5A22", .35))
    items = heap_items(p, 11, 160, 118, 76, 176, 214, 4, s=.9)
    body += G("".join(u for _, u in items), p + "sh")
    body += gloss(p, [(r.uniform(90, 230), r.uniform(100, 190)) for _ in range(5)], 2)
    L.append(G(body, p + "cut"))
    return gen_items.doc(p, 360, 280, "".join(L), seed=353, sh=(3, 2.5, .33), extra_defs=mix_defs(p))


# ================= SALAD SERVERS (440x640): wooden spoon + fork =================
SERVERS_ANCHOR = (220, 500)


def salad_servers():
    p = "ss-"
    L = [G(E(220, 612, 170, 14, SH, ' opacity="0.3"'), p + "bl")]
    # spoon (left, leaning right) and fork (right, leaning left): heads cross just above the anchor
    sp = P(taper((120, 40), (140, 250), (170, 420), 34, 28), WOOD_D) + P(taper((118, 38), (138, 248), (168, 418), 26, 20), WOOD)
    sp += spoon_head(166, 500, 70, 100, 8, 21)
    fk = P(taper((320, 40), (300, 250), (272, 420), 34, 28), WOOD_D) + P(taper((322, 38), (302, 248), (274, 418), 26, 20), WOOD)
    # fork head: neck widens into a rounded head with three wide, rounded tines and clear gaps
    fork = ("M258,420 Q246,446 236,470 Q226,500 228,560 Q228,590 240,592 Q252,590 252,560 L254,530 L264,530 L264,578 Q264,600 277,600 "
            "Q290,600 290,578 L290,530 L300,530 L302,560 Q302,590 314,592 Q326,590 326,560 Q328,500 318,470 Q308,446 296,420Z")
    fk += P(fork, WOOD_D, ' transform="translate(2 4)"') + P(fork, WOOD)
    fk += P("M244,478 Q276,462 310,478 Q276,470 248,490Z", WOOD_L, ' opacity="0.8"')
    L.append(G(fk, p + "cut"))
    L.append(G(sp, p + "cut"))
    L.append(P(wob(148, 478, 18, 34, .08, 30, 12, 8), WOOD_L, ' opacity="0.7"'))
    for x, y in ((120, 44), (320, 44)):                                                       # painted teal handle tips
        L.append(G(P(wob(x, y + 6, 20, 28, .03, x, 14), TEAL_D) + P(wob(x, y + 2, 17, 25, .03, x + 1, 14), TEAL) + P(wob(x - 5, y - 6, 5, 9, .1, x + 2, 8), TEAL_L), p + "sh"))
    L.append(stroke("M126,110 Q132,230 150,360", WOOD_L, 7, ' opacity="0.7"') + stroke("M316,110 Q308,230 294,360", WOOD_L, 7, ' opacity="0.6"'))
    return gen_items.doc(p, 440, 640, "".join(L), material="rough", seed=355, sh=(4, 3.5, .33))


# ================= COLANDER with the vegetables (820x560) =================
CL_RC, CL_RX, CL_RY = (410, 196), 372, 92
CL_OC, CL_OX, CL_OY = (410, 202), 342, 78
CL_BODY = "M38,196 C50,360 160,468 410,468 C660,468 770,360 782,196Z"
CL_FRONT = f"M38,196 C50,360 160,468 410,468 C660,468 770,360 782,196 L752,202 A{CL_OX},{CL_OY} 0 0 1 68,202Z"
CL_FRONT_RIM = f"M38,196 A{CL_RX},{CL_RY} 0 0 0 782,196 L752,202 A{CL_OX},{CL_OY} 0 0 1 68,202Z"
CL, CL_D, CL_L = mix(CORAL, RED, .25), mix(CORAL_D, "#7A2A14", .25), CORAL_L


def embed_veg(fn, old, new, x, y, s, rot=0):
    """A whole vegetable drawing (672x504 file) without its ground shadow, placed with its body centre at (x,y)."""
    _, body = body_of(fn(), old, new)
    body = re.sub(r'<g filter="url\(#' + new + r'bl\)">.*?</g>', "", body, count=1)
    return f'<g transform="translate({n(x)} {n(y)}) rotate({rot}) scale({s}) translate(-336 -380)">{body}</g>'


def colander():
    p = "co-"
    L = [G(E(410, 520, 330, 20, SH, ' opacity="0.34"'), p + "bl")]
    L.append(G(P(wrect(300, 456, 220, 44, 18, .8, 3), CL_D), p + "sh"))                    # foot ring
    for x in (38, 782):                                                                      # side handles
        L.append(G(P(wob(x + (-16 if x < 400 else 16), 196, 44, 22, .03, x, 16) + " " + wob(x + (-16 if x < 400 else 16), 196, 24, 9, .04, x + 1, 12), CL_D, ' fill-rule="evenodd"'), p + "cut"))
    L.append(G(P(CL_BODY, CL) + E(*CL_RC, CL_RX, CL_RY, CL_D), p + "cut"))
    L.append(E(*CL_RC, CL_RX, CL_RY, CL_L))
    L.append(E(*CL_OC, CL_OX, CL_OY, mix(CL_D, "#5A1E10", .3)))                                # inside, in shadow
    holes = "".join(C(410 + math.cos(a) * rr * CL_OX * .9, 206 + math.sin(a) * rr * CL_OY * .8, 6, "#3A1A10", ' opacity="0.8"')
                    for rr in (.35, .6, .85) for a in [i / int(10 + rr * 14) * 2 * math.pi for i in range(int(10 + rr * 14))])
    L.append(holes)
    # vegetables, back to front (they stand up out of the colander)
    FK[0] = 34
    veg = G(f'<g transform="translate(400 150) scale(.56) translate(-320 -300)">{lettuce_head_body(p, simple=True)}</g>', None)
    veg += embed_veg(PB.veg_pepper_whole, "vp-", p, 540, 200, .36, 6)
    veg += embed_veg(lambda: SA.veg_carrot_whole(leaf_n=2), "vk-", p, 600, 214, .46, -16)
    veg += embed_veg(lambda: SA.veg_cucumber_whole(14), "vc-", p, 240, 200, .5, 24)
    veg += G(PA.tomato_side(340, 250, 50, 5, -10) + PA.tomato_side(452, 262, 46, 9, 12), p + "cut")
    L.append(veg)
    # water drops on the vegetables
    r = random.Random(6)
    L.append("".join(P(wob(x, y, 7, 9, .1, i, 10), WATER_L, ' opacity="0.9"') + C(x - 2, y - 3, 2.5, WHITE)
                     for i, (x, y) in enumerate([(r.uniform(180, 640), r.uniform(90, 240)) for _ in range(16)])))
    # front wall with rows of holes, then the rim
    L.append(G(P(CL_FRONT, CL), p + "cut"))
    L.append(f'<clipPath id="{p}f"><path d="{CL_FRONT}"/></clipPath>')
    fr = P("M50,300 C100,420 220,464 410,464 C600,464 720,420 770,300 C720,400 600,440 410,440 C220,440 100,400 50,300Z", CL_D, ' opacity="0.7"')
    for row, y in enumerate((270, 318, 364, 406)):
        w = 350 - (y - 240) * .9
        cnt = int(w / 30)
        for i in range(-cnt, cnt + 1):
            x = 410 + i * 30 + (15 if row % 2 else 0)
            yy = y + 40 * (1 - ((x - 410) / 380) ** 2)
            fr += E(x, yy, 7, 5.5, "#4A1E12", ' opacity="0.85"') + E(x - 1, yy - 2.5, 5, 2, CL_L, ' opacity="0.5"')
    fr += P("M70,240 Q86,340 170,414 Q110,340 104,248Z", WHITE, ' opacity="0.35"')
    L.append(G(fr, None, f' clip-path="url(#{p}f)"'))
    L.append(P(CL_FRONT_RIM, CL_L))
    L.append(P("M110,244 Q410,300 710,244 Q410,290 110,244Z", WHITE, ' opacity="0.45"'))
    out = gen_items.doc(p, 820, 560, "".join(L), seed=361, sh=(4, 3.5, .33))
    return _round(out)


def _round(svgtxt):
    """Drop the decimal of path coordinates (the colander is shown at <= 0.8x, so 1 unit is invisible) to stay under 60 KB."""
    return re.sub(r'(?:\bd|cx|cy|rx|ry|\br)="[^"]*"', lambda m: re.sub(r"(\d)\.\d", r"\1", m.group(0)), svgtxt)


ITEMS = {"lettuce-head": lambda: lettuce(0), "lettuce-tear-1": lambda: lettuce(1), "lettuce-tear-2": lambda: lettuce(2), "lettuce-tear-3": lambda: lettuce(3),
         "salad-bowl-back": salad_bowl_back, "salad-bowl-front": salad_bowl_front, "salad-mixed": salad_mixed,
         "serving-bowl": serving_bowl, "salad-portion": salad_portion, "salad-servers": salad_servers, "colander": colander}

if __name__ == "__main__":
    run(ITEMS)
