# Production Mom (style B, paper cut-out), "Mom version 1": brown bun, no glasses, teal apron.
# Usage:  python tools/gen_mom.py                    -> writes Mom v1 into images-b/ (layers + demo hands)
#         python tools/gen_mom.py --out tools/_variants/x --hair_style bob --glasses 1 --hair_color "#C9793E"
#         (--out is relative to images-b/ unless absolute)
# Layers share viewBox 0 0 800 800 (y=800 = waist, body centre line x=500).
# Demo hands mom-hand-* share viewBox 0 0 400 400; anchors in HAND_ANCHORS.
# Based on style-test/tools/gen_mom_b.py (the approved Mom), ported to pb.py; see images-b/README-mom.md.
import argparse, math, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pb import (P, E, C, G, n, wob, wrect, smooth, smooth_open, svg, std_defs, mix, lum,  # noqa: E402
                SH, EYE, TEAL, WOOD, WOOD_D, WOOD_L, SAUCE, SAUCE_L, SAUCE_D, CHEESE, CHEESE_L, CHEESE_D, OUT)

# ---- change one line to restyle Mom ----
PARAMS = {"hair_color": "#6B4430", "hair_style": "bun", "skin_tone": "#E6B38A", "glasses": False, "apron_color": TEAL}
HAIR_STYLES = ("bun", "bob", "curly")
BLOUSE = "#F6B496"

DX = 200                    # the style-test drawing (600 wide, centre 300) shifted right -> centre x 500
PIVOT_LEFT = (350, 505)     # mom-arm-left shoulder (viewer's left, pointing arm)
PIVOT_RIGHT = (650, 505)    # mom-arm-right shoulder (waving arm)
# pointing arm geometry (frame coords): shoulder -> elbow -> wrist -> fingertip, pointing left ~12 deg up
ARM_L = dict(shoulder=(350, 505), elbow=(264, 428), wrist=(160, 405))
HAND_ANCHORS = {"point": (100, 100), "roll": (140, 140), "spread": (110, 250), "sprinkle": (125, 115), "grab": (110, 150)}


def palette(pr):
    skin, hair, apron = pr["skin_tone"], pr["hair_color"], pr["apron_color"]
    dark_hair = lum(hair) < 0.22
    c = {
        "skin": skin,
        "skin_sh": mix(skin, "#7A3E30", .24),
        "skin_lt": mix(skin, "#FFF4E6", .28),
        "blush": mix(skin, "#E8606E", .42),
        "nose": mix(skin, "#7A3E30", .16),
        "mouth": mix(skin, "#5A1618", .72),
        "tongue": mix("#E57A70", skin, .15),
        "hair": hair,
        "hair_d": mix(hair, "#120A06", .4),
        "hair_l": mix(hair, "#B08070", .38) if dark_hair else mix(hair, "#FFE9CC", .25),
        "hair_m": mix(hair, "#8A5A48", .22) if dark_hair else mix(hair, "#FFE9CC", .12),
        "brow": mix(hair, "#120A06", .25) if lum(hair) > .3 else mix(hair, "#6A4A3E", .25),
        "apron": apron,
        "apron_d": mix(apron, "#1E120C", .25),
        "apron_l": mix(apron, "#FFF6E8", .35),
        "shirt": BLOUSE,                          # warm coral-peach blouse (fixed, reads warm on the cream wall)
        "shirt_d": mix(BLOUSE, "#B4524A", .3),
        "dot": "#FFF4E4",
        "trim": "#F6EAD6",
        "frame": mix(apron, "#2A1A12", .5),
    }
    if lum(skin) > .8 and abs(lum(c["shirt"]) - lum(skin)) < .1:   # very light skin: deepen the blouse so arms separate
        c["shirt"] = mix(BLOUSE, "#D9705E", .45)
        c["shirt_d"] = mix(c["shirt"], "#8E3A34", .3)
    return c


# ---------- building blocks ----------
def filt(p, material="smooth", seed=3, **kw):
    return std_defs(p, material, seed, sh=(4, 3.5, .3), sh2=(7, 6, .28), **kw)


def shift(inner):
    """Style-test coordinates (600 frame) -> production 800 frame."""
    return f'<g transform="translate({DX} 0)">{inner}</g>'


def taper(pts, widths, cap=5):
    """Closed outline of a limb along a polyline with a width per point (rounded ends)."""
    L = len(pts)
    left, right = [], []
    for i in range(L):
        a, b = pts[max(i - 1, 0)], pts[min(i + 1, L - 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        d = math.hypot(dx, dy) or 1
        nx, ny = -dy / d, dx / d
        w = widths[i] / 2
        left.append((pts[i][0] + nx * w, pts[i][1] + ny * w))
        right.append((pts[i][0] - nx * w, pts[i][1] - ny * w))

    def capp(p, q, w, sgn):  # half circle around p, away from q
        dx, dy = p[0] - q[0], p[1] - q[1]
        d = math.hypot(dx, dy) or 1
        ux, uy = dx / d, dy / d
        nx, ny = -uy, ux
        out = []
        for k in range(1, cap):
            t = math.pi * k / cap
            out.append((p[0] + (nx * math.cos(t) * sgn + ux * math.sin(t)) * w, p[1] + (ny * math.cos(t) * sgn + uy * math.sin(t)) * w))
        return out

    end = capp(pts[-1], pts[-2], widths[-1] / 2, 1)
    start = capp(pts[0], pts[1], widths[0] / 2, -1)
    return smooth(left + end + right[::-1] + start)


def lerp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def chaikin(pts, it=3):
    for _ in range(it):
        out = [pts[0]]
        for p0, p1 in zip(pts, pts[1:]):
            out += [lerp(p0, p1, .25), lerp(p0, p1, .75)]
        pts = out + [pts[-1]]
    return pts


def arm_shape(c, S, Ee, W, ws=((0, 60), (.3, 56), (.5, 50), (.62, 48), (.8, 42), (1, 35))):
    """Paper-cut arm: shade layer + skin layer. Smooth centreline (round elbow), full upper arm, soft taper to the wrist.
    ws = (fraction of length, width) keys."""
    pts = chaikin([S, lerp(S, Ee, .5), Ee, lerp(Ee, W, .5), W])
    cum = [0]
    for p0, p1 in zip(pts, pts[1:]):
        cum.append(cum[-1] + math.hypot(p1[0] - p0[0], p1[1] - p0[1]))

    def wid(t):
        for (t0, w0), (t1, w1) in zip(ws, ws[1:]):
            if t <= t1:
                return w0 + (w1 - w0) * (t - t0) / (t1 - t0)
        return ws[-1][1]
    widths = [wid(v / cum[-1]) for v in cum]
    base = taper(pts, widths, 6)
    top = taper([(x, y - 3) for x, y in pts], [w - 6 for w in widths], 6)
    g = P(base, c["skin_sh"]) + P(top, c["skin"])
    ex, ey = Ee
    g += P(wob(ex + 2, ey - 8, 13, 9, .05, 91, 14), c["skin_lt"], ' opacity="0.35"')    # soft elbow light
    return g


def pointing_hand(c, tx, ty, ang, sc, cuff=None, flen=150, wrist=None):
    """Hand pointing along local -y, fingertip at local (0,0). Index finger length flen; palm below it."""
    s, sh, lt = c["skin"], c["skin_sh"], c["skin_lt"]
    d = flen - 118
    g = ""
    if cuff:
        g += cuff_band(c, 186 + d, 124, 110)
    g += P(wrect(-36, 150 + d, 72, 60, 22, 1, 7), wrist or sh)                             # wrist
    g += P(wob(6, 138 + d, 60, 56, .03, 8), sh)                                           # palm back
    g += P(wob(4, 132 + d, 56, 52, .03, 9), s)                                            # palm
    fin = f"M-17,{flen} L-15,14 Q-14,0 0,0 Q14,0 15,14 L17,{flen}Z"
    g += P(fin, sh, ' transform="translate(2 2)"') + P(fin, s)
    g += P(f"M-12,{flen * .52} Q0,{flen * .56} 12,{flen * .52} Q0,{flen * .6} -12,{flen * .52}Z", sh, ' opacity="0.7"')
    g += P(wob(-2, 14, 8, 10, .1, 32), lt, ' opacity="0.9"')                              # nail light
    for i in range(3):
        y = 106 + d + i * 28
        g += P(wrect(-50, y, 52, 30, 15, .6, 10 + i), sh) + P(wrect(-48, y - 2, 48, 26, 13, .6, 20 + i), s)
        g += P(wob(-40, y + 12, 5, 4, .1, 25 + i), lt, ' opacity="0.8"')
    thumb = f"M34,{150 + d} Q64,{120 + d} 50,{92 + d} Q40,{80 + d} 28,{92 + d} Q26,{118 + d} 12,{140 + d}Z"
    g += P(thumb, sh, ' transform="translate(2 2)"') + P(thumb, s)
    g += P(wob(40, 94 + d, 6, 5, .1, 33), lt, ' opacity="0.8"')
    return f'<g transform="translate({n(tx)} {n(ty)}) rotate({n(ang)}) scale({sc})">{g}</g>'


def open_hand(c, tx, ty, ang, sc):
    """Waving open palm: soft rounded palm, short round fingers, a clear thumb. Palm centre local (0,0), fingers along -y."""
    s, sh, lt = c["skin"], c["skin_sh"], c["skin_lt"]
    g = P(wob(1, 5, 52, 50, .03, 40), sh)
    for i, (x, a, L) in enumerate(((-29, -13, 44), (-9, -4, 52), (11, 4, 50), (29, 13, 40))):
        g += (f'<g transform="rotate({a} {x} -18)">' + P(wrect(x - 13.5, -18 - L, 27, L + 26, 13.5, .5, 41 + i), sh)
              + P(wrect(x - 12, -17 - L, 24, L + 22, 12, .5, 51 + i), s) + E(x, -L - 6, 6, 6.5, lt, ' opacity="0.8"') + "</g>")
    g += P(wob(0, 2, 48, 46, .03, 60), s)
    g += E(4, 8, 24, 20, lt, ' opacity="0.35"')
    g += (f'<g transform="rotate(-52 -36 18)">' + P(wrect(-50, -34, 30, 60, 15, .5, 61), sh)
          + P(wrect(-49, -33, 27, 55, 13.5, .5, 62), s) + E(-35.5, -24, 6, 6.5, lt, ' opacity="0.8"') + "</g>")
    return f'<g transform="translate({n(tx)} {n(ty)}) rotate({n(ang)}) scale({sc})">{g}</g>'


def cuff_band(c, y0, w=120, L=110):
    """Blouse cuff in hand-local coords (arm runs along +y from y0); rounded end inside the box."""
    return (P(wrect(-w / 2, y0, w, L, 44, 1, 5), c["shirt_d"]) + P(wrect(-w / 2 + 4, y0, w - 8, L - 8, 40, 1, 6), c["shirt"])
            + P(wrect(-w / 2 + 10, y0 + L - 34, w - 20, 16, 8, .6, 4), c["shirt_d"], ' opacity="0.5"')
            + P(wrect(-w / 2 - 6, y0 - 6, w + 12, 34, 14, 1, 7), c["trim"]))


# ---------- hair geometry (style-test coordinates, shifted by DX) ----------
HC = (300, 262)


def arc_pts(cx, cy, rx, ry, a0, a1, k):
    return [(cx + math.cos(math.radians(a0 + (a1 - a0) * i / (k - 1))) * rx, cy + math.sin(math.radians(a0 + (a1 - a0) * i / (k - 1))) * ry) for i in range(k)]


def curl_highlight(x, y, r, col, op=.8):
    return P(f"M{n(x - r * .6)},{n(y + r * .05)} Q{n(x - r * .55)},{n(y - r * .62)} {n(x + r * .15)},{n(y - r * .64)} Q{n(x - r * .38)},{n(y - r * .42)} {n(x - r * .44)},{n(y + r * .1)}Z", col, f' opacity="{op}"')


def curl_mass(c, spots, p, seed, outer="sh"):
    back = "".join(P(wob(x, y + 5, r + 4, r + 1, .07, seed + i, 16), c["hair_d"]) for i, (x, y, r) in enumerate(spots))
    mid = "".join(P(wob(x - 3, y - 2, r * .9, r * .86, .07, seed + 100 + i, 16), c["hair"]) for i, (x, y, r) in enumerate(spots))
    top = "".join(P(wob(x - 6, y - 6, r * .55, r * .5, .08, seed + 200 + i, 14), c["hair_m"]) for i, (x, y, r) in enumerate(spots) if i % 2 == 0)
    hl = "".join(curl_highlight(x - 4, y - 2, r * .8, c["hair_l"], .85) for i, (x, y, r) in enumerate(spots))
    return G(back, p + outer) + G(mid, p + "sh") + top + hl


def hair_back(c, style, p):
    if style == "curly":
        spots = [(300, 104, 58), (240, 100, 50), (360, 100, 50), (196, 126, 50), (404, 126, 50), (156, 170, 50), (444, 170, 50),
                 (128, 222, 48), (472, 222, 48), (116, 276, 46), (484, 276, 46), (122, 330, 44), (478, 330, 44),
                 (144, 380, 40), (456, 380, 40), (176, 414, 32), (424, 414, 32)]
        return curl_mass(c, spots, p, 700, "cut")
    return ""


def hair_front(c, style, p):
    h, hd, hl = c["hair"], c["hair_d"], c["hair_l"]
    L = []
    if style == "bun":
        L.append(G(P(wob(300, 104, 64, 60, .03, 801), hd) + P(wob(298, 98, 58, 54, .03, 802), h), p + "cut"))
        L.append(P("M258,84 Q286,54 330,66 Q300,66 274,92Z", hl, ' opacity="0.85"') + P("M270,118 Q300,86 338,104 Q304,100 280,124Z", hl, ' opacity="0.6"'))
        L.append(G(P(wob(300, 150, 46, 14, .05, 803), c["apron"]) + P(wob(300, 146, 36, 7, .08, 804), c["apron_l"], ' opacity="0.8"'), p + "sh"))
        outer = arc_pts(*HC, 164, 168, 164, 376, 18)
        line = [(452, 300), (446, 256), (428, 222), (396, 204), (356, 200), (318, 196), (286, 184), (262, 170), (236, 186), (206, 222), (182, 262), (158, 306)]
        L.append(G(P(smooth(outer + line), h), p + "cut"))
        L.append(P("M262,174 Q300,196 354,204 Q306,208 270,190Z", hd, ' opacity="0.6"') + P("M258,176 Q216,190 192,240 Q224,206 262,190Z", hd, ' opacity="0.6"'))
        L.append(P("M196,150 Q250,112 318,118 Q256,128 210,164Z", hl, ' opacity="0.8"') + P("M346,124 Q400,136 428,180 Q392,150 344,138Z", hl, ' opacity="0.6"'))
    elif style == "bob":
        outer = arc_pts(*HC, 168, 170, 166, 374, 18)
        line = [(456, 292), (442, 246), (414, 222), (382, 216), (352, 222), (326, 214), (300, 220), (274, 214), (248, 222), (218, 216), (188, 224), (164, 250), (148, 294)]
        cap = P(smooth(outer + line), h)
        side_l = "M136,236 Q126,300 136,366 Q146,392 176,386 Q190,380 184,364 Q170,356 172,330 Q176,286 178,244Z"
        side_r = "M464,236 Q474,300 464,366 Q454,392 424,386 Q410,380 416,364 Q430,356 428,330 Q424,286 422,244Z"
        L.append(G(P(side_l, hd) + P(side_r, hd), p + "cut"))
        L.append(G(P(side_l, h, ' transform="translate(3 -4)"') + P(side_r, h, ' transform="translate(-3 -4)"'), p + "sh"))
        L.append(G(cap, p + "cut"))
        L.append(P("M190,150 Q250,108 330,114 Q256,124 206,166Z", hl, ' opacity="0.8"') + P("M150,300 Q148,330 160,356 Q150,330 156,300Z", hl, ' opacity="0.7"'))
        L.append("".join(P(f"M{x},{212 - 6} Q{x + 4},{190} {x + 2},{168} Q{x + 8},{190} {x + 7},{210}Z", hd, ' opacity="0.45"') for x in (236, 288, 340, 392)))
    else:  # curly
        top = [(300, 118, 42), (254, 124, 38), (346, 124, 38), (212, 146, 36), (388, 146, 36), (178, 184, 34), (422, 184, 34)]
        fringe = [(218, 204, 27), (258, 194, 27), (300, 198, 27), (342, 194, 27), (382, 204, 27)]
        sides = [(162, 234, 29), (438, 234, 29), (152, 282, 25), (448, 282, 25), (156, 324, 21), (444, 324, 21)]
        L.append(curl_mass(c, top + fringe + sides, p, 900, "cut"))
    return "".join(L)


# ---------- layers (800x800) ----------
def layer(p, inner, material="smooth", seed=3):
    return svg(800, 800, filt(p, material, seed), G(inner, p + "gr"))


def mom_body(c, pr):
    p = "mp-bdy-"
    L = [hair_back(c, pr["hair_style"], p)]
    torso = "M250,432 Q196,440 150,470 Q118,492 116,560 L112,810 L488,810 L484,560 Q482,492 450,470 Q404,440 350,432Z"
    L.append(G(P(torso, c["shirt"]), p + "cut"))
    dots = "".join(C(x + (20 if r % 2 else 0), 468 + r * 38, 6.5, c["dot"]) for r in range(9) for x in range(112, 500, 40))
    L.append(f'<clipPath id="{p}tc"><path d="{torso}"/></clipPath>' + G(dots, None, f' clip-path="url(#{p}tc)" opacity="0.9"'))
    L.append(G(P("M262,380 L338,380 L342,456 Q300,476 258,456Z", c["skin_sh"]), p + "sh"))
    L.append(G(P("M232,436 Q300,478 368,436 Q352,428 340,430 Q300,470 260,430 Q248,428 232,436Z", c["trim"]), p + "sh"))
    L.append(G(P("M214,540 Q228,480 256,446 L276,454 Q252,486 240,540Z", c["apron"]) + P("M386,540 Q372,480 344,446 L324,454 Q348,486 360,540Z", c["apron"]), p + "sh"))
    bib = "M206,528 Q300,516 394,528 Q404,660 432,810 L168,810 Q196,660 206,528Z"
    L.append(G(P(bib, c["apron_d"], ' transform="translate(0 4)"') + P(bib, c["apron"]), p + "sh"))
    L.append(G("".join(C(214 + i * 21.5, 530 - 3 * math.sin(i / 8 * math.pi), 11, c["trim"]) for i in range(9)), p + "sh"))
    L.append(P("M214,560 Q300,550 386,560 L388,568 Q300,558 212,568Z", c["apron_l"], ' opacity="0.7"'))
    L.append(G(P(wrect(246, 640, 108, 78, 18, 1, 90), c["apron_d"]), p + "sh"))
    L.append("".join(f'<rect x="{254 + i * 10}" y="647" width="6" height="2.4" rx="1.2" fill="{c["trim"]}" opacity="0.8"/>' for i in range(10)))
    heart = "M300,700 Q270,680 272,664 Q276,650 290,654 Q298,657 300,666 Q302,657 310,654 Q324,650 328,664 Q330,680 300,700Z"
    L.append(G(P(heart, "#E8746A"), p + "sh"))
    return layer(p, shift("".join(L)), "default", 21)


def mom_head(c, pr):
    p = "mp-hd-"
    L = []
    ears = (P(wob(158, 290, 24, 28, .05, 1), c["skin_sh"]) + P(wob(442, 290, 24, 28, .05, 2), c["skin_sh"])
            + P(wob(160, 290, 15, 18, .08, 3), c["skin"]) + P(wob(440, 290, 15, 18, .08, 4), c["skin"]))
    pts = []
    for i in range(30):
        a = i / 30 * 2 * math.pi
        rx = 140 + 6 * max(0, math.sin(a)) * math.cos(2 * a) ** 2
        ry = 142 if math.sin(a) > 0 else 146
        pts.append((300 + math.cos(a) * rx, 268 + math.sin(a) * ry))
    L.append(G(ears + P(smooth(pts), c["skin"]), p + "cut"))
    L.append(P(wob(270, 228, 92, 70, .04, 5), c["skin_lt"], ' opacity="0.45"'))
    L.append(E(226, 334, 28, 16, c["blush"], ' opacity="0.75"') + E(374, 334, 28, 16, c["blush"], ' opacity="0.75"'))
    L.append(C(216, 328, 4, c["skin_lt"], ' opacity="0.8"') + C(364, 328, 4, c["skin_lt"], ' opacity="0.8"'))
    L.append(E(300, 318, 9, 6.5, c["nose"]))
    L.append(E(297, 316, 3.5, 2.2, c["skin_lt"], ' opacity="0.7"'))
    return layer(p, shift("".join(L)), "smooth", 23)


def mom_hair(c, pr):
    p = "mp-hr-"
    return layer(p, shift(hair_front(c, pr["hair_style"], p)), "default", 25)


EYES_X = (246, 354)
EYE_Y = 284


def glasses(c, p):
    g = ""
    for x in EYES_X:
        g += P(wob(x, EYE_Y, 46, 42, .01, x) + " " + wob(x, EYE_Y, 38, 34, .01, x + 1), c["frame"], ' fill-rule="evenodd"')
        g += P(f"M{x - 26},{EYE_Y - 8} Q{x - 20},{EYE_Y - 26} {x - 4},{EYE_Y - 30} Q{x - 18},{EYE_Y - 20} {x - 20},{EYE_Y - 4}Z", "#FFFFFF", ' opacity="0.45"')
    g += P(f"M292,{EYE_Y - 8} Q300,{EYE_Y - 14} 308,{EYE_Y - 8} L308,{EYE_Y - 2} Q300,{EYE_Y - 8} 292,{EYE_Y - 2}Z", c["frame"])
    g += P(f"M200,{EYE_Y - 10} L160,{EYE_Y - 2} L160,{EYE_Y + 4} L202,{EYE_Y - 2}Z", c["frame"]) + P(f"M400,{EYE_Y - 10} L440,{EYE_Y - 2} L440,{EYE_Y + 4} L398,{EYE_Y - 2}Z", c["frame"])
    lens = "".join(E(x, EYE_Y, 38, 34, "#FFFFFF", ' opacity="0.10"') for x in EYES_X)
    return lens + G(g, p + "sh")


def brows(c, lift=0):
    g = ""
    for x in EYES_X:
        sg = -1 if x < 300 else 1
        y = EYE_Y - 60 - lift
        g += P(f"M{x - 22},{y + 7} Q{x - 4},{y - 9} {x + 22},{y + 3} Q{x + 25},{y + 7} {x + 20},{y + 8} Q{x - 2},{y - 2} {x - 18},{y + 11} Q{x - 25},{y + 12} {x - 22},{y + 7}Z",
               c["brow"], f' transform="translate({x} 0) scale({-sg} 1) translate({-x} 0)"' if sg < 0 else "")
    return g


def eyes(c, pr, kind):
    p = f"mp-e{kind[:2]}-"
    L = []
    if kind in ("open", "surprised"):
        big = kind == "surprised"
        rx, ry = (27, 33) if big else (24, 30)
        for x in EYES_X:
            e = P(wob(x, EYE_Y, rx, ry, .02, x), EYE)
            e += f'<clipPath id="{p}c{x}"><ellipse cx="{x}" cy="{EYE_Y}" rx="{rx}" ry="{ry}"/></clipPath>'
            e += G(E(x, EYE_Y + ry * .75, rx * .95, ry * .6, "#5A3A2E"), None, f' clip-path="url(#{p}c{x})"')
            e += C(x + 7, EYE_Y - 10, 9 if big else 8, "#FFFFFF") + C(x - 7, EYE_Y + 10, 4 if big else 3.6, "#FFFFFF")
            if big:
                e += C(x + 12, EYE_Y + 2, 2.6, "#FFFFFF")      # extra sparkle: delighted, not scared
            sg = -1 if x < 300 else 1
            ox = x + sg * (rx - 3)
            e += P(f"M{ox},{EYE_Y - ry * .55} Q{ox + sg * 14},{EYE_Y - ry * .95} {ox + sg * 20},{EYE_Y - ry * .8} Q{ox + sg * 10},{EYE_Y - ry * .6} {ox + sg * 3},{EYE_Y - ry * .3}Z", EYE)
            L.append(G(e, p + "sh"))
        L.append(brows(c, lift=10 if big else 0))
    elif kind == "blink":
        for x in EYES_X:
            L.append(P(f"M{x - 24},{EYE_Y + 2} Q{x},{EYE_Y + 16} {x + 24},{EYE_Y + 2} Q{x},{EYE_Y + 24} {x - 24},{EYE_Y + 2}Z", EYE))
            sg = -1 if x < 300 else 1
            L.append(P(f"M{x + sg * 22},{EYE_Y + 4} Q{x + sg * 32},{EYE_Y + 2} {x + sg * 36},{EYE_Y + 8} Q{x + sg * 28},{EYE_Y + 8} {x + sg * 20},{EYE_Y + 9}Z", EYE))
        L.append(brows(c))
    else:  # happy: upward arcs
        for x in EYES_X:
            L.append(G(P(f"M{x - 24},{EYE_Y + 8} Q{x},{EYE_Y - 22} {x + 24},{EYE_Y + 8} Q{x + 22},{EYE_Y + 13} {x + 17},{EYE_Y + 8} Q{x},{EYE_Y - 10} {x - 17},{EYE_Y + 8} Q{x - 22},{EYE_Y + 13} {x - 24},{EYE_Y + 8}Z", EYE), p + "sh"))
        L.append(brows(c, lift=4))
    if pr["glasses"]:
        L.append(glasses(c, p))
    return layer(p, shift("".join(L)), "smooth", 27)


MY = 350   # mouth centre line


def mouth(c, pr, kind):
    p = f"mp-m{kind[:2]}-"
    teeth = "#FBF3E6"
    if kind == "smile":
        m = f"M262,{MY - 6} Q300,{MY + 14} 338,{MY - 6} Q344,{MY - 8} 343,{MY - 1} Q326,{MY + 30} 300,{MY + 30} Q274,{MY + 30} 257,{MY - 1} Q256,{MY - 8} 262,{MY - 6}Z"
        L = [G(P(m, c["mouth"]) + E(300, MY + 24, 13, 4.5, c["tongue"], ' opacity="0.8"'), p + "sh")]
    elif kind == "open":
        m = f"M264,{MY - 8} Q300,{MY + 2} 336,{MY - 8} Q344,{MY - 8} 342,{MY + 2} Q336,{MY + 50} 300,{MY + 52} Q264,{MY + 50} 258,{MY + 2} Q256,{MY - 8} 264,{MY - 8}Z"
        L = [f'<clipPath id="{p}c"><path d="{m}"/></clipPath>',
             G(P(m, c["mouth"]) + G(E(300, MY + 52, 34, 22, c["tongue"]), None, f' clip-path="url(#{p}c)"')
               + P(f"M270,{MY - 6} Q300,{MY + 3} 330,{MY - 6} L328,{MY + 3} Q300,{MY + 10} 272,{MY + 3}Z", teeth), p + "sh")]
    else:  # talk: friendly half-open smile (mid-word), smaller than "open", corners still up
        m = f"M276,{MY - 2} Q300,{MY + 5} 324,{MY - 2} Q331,{MY - 4} 329,{MY + 5} Q322,{MY + 33} 300,{MY + 34} Q278,{MY + 33} 271,{MY + 5} Q269,{MY - 4} 276,{MY - 2}Z"
        L = [f'<clipPath id="{p}c"><path d="{m}"/></clipPath>',
             G(P(m, c["mouth"]) + G(E(300, MY + 34, 22, 13, c["tongue"]) + P(f"M270,{MY - 6} Q300,{MY + 4} 330,{MY - 6} L330,{MY + 5} Q300,{MY + 12} 270,{MY + 5}Z", teeth),
                                    None, f' clip-path="url(#{p}c)"'), p + "sh")]
    return layer(p, shift("".join(L)), "smooth", 29)


def sleeve(c, cx, cy, rot, seed, cuff_off=30, trim_rot=None):
    """Puffed short sleeve. rot = direction the arm leaves the sleeve (deg); trim band sits across that direction."""
    ux, uy = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    tr = rot - 90 if trim_rot is None else trim_rot
    return (P(wob(cx, cy + 4, 52, 46, .04, seed, 18, rot), c["shirt_d"]) + P(wob(cx, cy, 50, 44, .04, seed + 1, 18, rot), c["shirt"])
            + P(wob(cx + ux * 22, cy + uy * 22 - 16, 20, 10, .08, seed + 3, 12, rot), c["shirt_d"], ' opacity="0.35"')
            + "".join(C(cx + ux * a + uy * b, cy + uy * a - ux * b, 6, c["dot"], ' opacity="0.9"') for a, b in ((-18, -14), (-6, 20), (8, -2), (-30, 10)))
            + P(wob(cx + ux * (cuff_off + 5), cy + uy * (cuff_off + 5), 42, 11, .06, seed + 4, 14, tr), c["shirt_d"])
            + P(wob(cx + ux * cuff_off, cy + uy * cuff_off, 40, 10, .06, seed + 2, 14, tr), c["trim"]))


def arm_left(c, pr):
    """Pointing arm (toward the pizza, left and ~12 deg up): sleeve, upper arm, elbow, forearm, wrist, hand."""
    p = "mp-al-"
    S, Ee, W = ARM_L["shoulder"], ARM_L["elbow"], ARM_L["wrist"]
    fx, fy = W[0] - Ee[0], W[1] - Ee[1]
    fl = math.hypot(fx, fy)
    ux, uy = fx / fl, fy / fl                                   # forearm direction
    ang = math.degrees(math.atan2(ux, -uy))                     # local -y of the hand -> (ux,uy)
    sc, flen = .68, 128
    Lh = (175 + flen - 118) * sc                                # fingertip -> wrist distance
    tip = (W[0] + ux * Lh, W[1] + uy * Lh)
    L = [arm_shape(c, (S[0] - 6, S[1] + 4), Ee, (W[0] + ux * 8, W[1] + uy * 8))]
    L.append(G(pointing_hand(c, tip[0], tip[1], ang, sc, flen=flen, wrist=c["skin"]), p + "sh"))
    ua = math.degrees(math.atan2(Ee[1] - S[1], Ee[0] - S[0]))
    L.append(G(sleeve(c, S[0] - 8, S[1] + 2, ua, 70, 34), p + "sh"))
    return layer(p, G("".join(L), p + "cut"), "smooth", 31), tip


def arm_right(c, pr):
    """Friendly wave, open hand up beside the head."""
    p = "mp-ar-"
    sx, sy = PIVOT_RIGHT
    S, Ee, W = (sx + 6, sy + 24), (722, 616), (736, 514)
    L = [arm_shape(c, S, Ee, W, ws=((0, 54), (.4, 50), (.5, 46), (.65, 44), (1, 35)))]
    L.append(G(open_hand(c, 739, 462, 12, .8), p + "sh"))
    L.append(G(sleeve(c, sx + 14, sy + 20, 58, 80, 30), p + "sh"))
    return layer(p, G("".join(L), p + "cut"), "smooth", 33)


# ---------- demo hands (400x400, from the lower right, hovering) ----------
def hand_file(p, inner, seed, extra=""):
    defs = std_defs(p, "smooth", seed, sh=(3, 2.5, .28), sh2=(6, 5, .25), cut=dict(dx=10, dy=16, blur=7, op=.3))
    return svg(400, 400, defs, G(G(inner, p + "cut") + extra, p + "gr"))


def tube(c, pts, w, nail=True):
    """A finger drawn as a paper tube: shade layer, skin layer, nail light at the end."""
    d = smooth_open(pts)
    g = (f'<path d="{d}" fill="none" stroke="{c["skin_sh"]}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" transform="translate(1.5 2.5)"/>'
         f'<path d="{d}" fill="none" stroke="{c["skin"]}" stroke-width="{w - 2}" stroke-linecap="round" stroke-linejoin="round"/>')
    if nail:
        (ax, ay), (bx, by) = pts[-2], pts[-1]
        l = math.hypot(bx - ax, by - ay) or 1
        g += E(bx - (bx - ax) / l * 3, by - (by - ay) / l * 3, w * .22, w * .26, c["skin_lt"], ' opacity="0.9"')
    return g


def wrist_cuff(c, y0, w=74, cw=122, cl=104):
    """Wrist piece + blouse cuff in hand-local coords, arm along +y."""
    return cuff_band(c, y0 + 44, cw, cl) + P(wrect(-w / 2, y0, w, 64, 24, 1, 9), c["skin_sh"]) + P(wrect(-w / 2 + 3, y0, w - 6, 58, 22, 1, 8), c["skin"])


def hand_point(c):
    ax, ay = HAND_ANCHORS["point"]
    return hand_file("mh-pt-", pointing_hand(c, ax, ay, -45, .92, cuff=True, flen=150), 41)


def hand_roll(c):
    """Flat palm-down hand, fingers together, pressing; palm centre = local (0,0)."""
    s, sh, lt = c["skin"], c["skin_sh"], c["skin_lt"]
    g = wrist_cuff(c, 34)
    # thumb lies flat on the -x side (lower left after rotation)
    g += f'<g transform="rotate(-16 -52 20)">' + P(wrect(-66, -22, 32, 60, 16, .6, 12), sh) + P(wrect(-65, -24, 28, 56, 14, .6, 13), s) + E(-51, -12, 7, 9, lt, ' opacity="0.9"') + "</g>"
    g += P(wob(2, 4, 62, 60, .03, 14), sh) + P(wob(0, 0, 60, 58, .03, 15), s)
    tips = ((-36, -112), (-12, -126), (13, -121), (37, -100))
    fing = [wrect(x - 14, t, 28, -t - 8, 14, .4, 20 + i) for i, (x, t) in enumerate(tips)]
    g += "".join(P(d, sh, ' transform="translate(1.5 2.5)"') for d in fing) + "".join(P(d, s) for d in fing)   # one merged mitten
    g += P(wrect(-50, -70, 100, 70, 20, .5, 29), s)
    for x, t in ((-24, -104), (0, -110), (25, -98)):                                                   # shallow finger grooves
        g += P(f"M{x},{t + 10} Q{x + 1},{(t - 30) / 2} {x},-34", "none", f' stroke="{sh}" stroke-width="3" stroke-linecap="round" opacity="0.55"')
    for x, t in tips:
        g += E(x, t + 13, 6.5, 7.5, lt, ' opacity="0.75"')
    g += P("M-44,-18 Q0,-30 44,-16 Q0,-22 -44,-18Z", sh, ' opacity="0.5"')                   # knuckle fold
    for x in (-36, -12, 12, 36):
        g += E(x, -28, 7, 4.5, lt, ' opacity="0.7"')
    g += P(wob(-8, 8, 30, 22, .05, 16), lt, ' opacity="0.35"')                                # back-of-hand light
    ax, ay = HAND_ANCHORS["roll"]
    return hand_file("mh-ro-", f'<g transform="translate({ax} {ay}) rotate(-45) scale(1.06 .9)">{g}</g>', 43)   # squashed: pressing down


def fist_on_stick(c):
    """Fist around a vertical stick at x=0 (fist centre local (0,0)), arm leaves along +x."""
    s, sh, lt = c["skin"], c["skin_sh"], c["skin_lt"]
    g = f'<g transform="rotate(-90)">{wrist_cuff(c, 44, 80)}</g>'
    g += P(wob(30, 4, 54, 56, .03, 50), sh) + P(wob(28, 0, 52, 54, .03, 51), s)             # palm / back of hand
    for i, (y, x0) in enumerate(((-30, -40), (-4, -42), (22, -38), (46, -30))):
        h = 26 if i < 3 else 22
        g += P(wrect(x0, y - h / 2, 70 - x0 * .2, h, h / 2, .5, 52 + i), sh, ' transform="translate(1 2.5)"') + P(wrect(x0 + 1, y - h / 2, 68 - x0 * .2, h - 2, h / 2 - 1, .5, 56 + i), s)
        g += E(x0 + 12, y - 2, 6, 4.5, lt, ' opacity="0.85"')
    thumb = "M44,-26 Q20,-58 -18,-54 Q-34,-50 -30,-38 Q-24,-30 -8,-34 Q18,-38 30,-14Z"
    g += P(thumb, sh, ' transform="translate(1.5 2.5)"') + P(thumb, s) + E(-20, -44, 8, 6, lt, ' opacity="0.9"')
    return g


def hand_spread(c):
    """Hand holding a wooden spoon; spoon bowl (lower left) = anchor, back of the spoon down, sauce on it."""
    ax, ay = HAND_ANCHORS["spread"]
    D = 150                                          # fist centre -> bowl centre (local +y)
    ang = 45
    spoon = (P(wrect(-10, -118, 20, D - 20 + 118, 10, .6, 60), WOOD_D, ' transform="translate(2 3)"') + P(wrect(-9, -118, 18, D - 20 + 118, 9, .6, 61), WOOD)
             + P(wrect(-4, -110, 6, D - 40 + 110, 3, .3, 62), WOOD_L, ' opacity="0.6"'))
    bowl = (P(wob(0, D + 2, 40, 52, .03, 63), WOOD_D) + P(wob(0, D, 38, 50, .03, 64), WOOD)
            + P(wob(2, D + 4, 29, 40, .04, 65), mix(WOOD_D, WOOD, .35))
            + P(wob(0, D + 12, 25, 30, .12, 66), SAUCE) + P(wob(-4, D + 6, 12, 14, .15, 67), SAUCE_L, ' opacity="0.8"')
            + P(f"M-30,{D + 20} Q-40,{D + 34} -34,{D + 44} Q-26,{D + 46} -26,{D + 34} Z", SAUCE_D)
            + P(wob(-10, D - 32, 8, 12, .1, 68), WOOD_L, ' opacity="0.6"'))
    inner = G(spoon + bowl, "mh-sp-sh") + fist_on_stick(c)
    return hand_file("mh-sp-", f'<g transform="translate({ax} {ay}) rotate({ang}) scale(.9) translate(0 {-D})">{inner}</g>', 45)


def hand_sprinkle(c):
    """Fingertips pinched together (slightly apart) at local (0,0), fingers pointing -y; cheese falls below."""
    s, sh, lt = c["skin"], c["skin_sh"], c["skin_lt"]
    g = wrist_cuff(c, 146, 80)
    g += tube(c, [(50, 118), (58, 88), (46, 66)], 22, False) + tube(c, [(32, 108), (38, 62), (20, 18)], 25)    # pinky, ring (behind)
    g += P(wob(8, 126, 56, 50, .03, 70), sh) + P(wob(6, 122, 54, 48, .03, 71), s)                          # back of hand
    g += tube(c, [(12, 100), (14, 50), (10, -2)], 27)                                                       # middle
    g += tube(c, [(-14, 100), (-18, 50), (-4, -6)], 28)                                                     # index
    g += tube(c, [(-50, 150), (-60, 84), (-44, 34), (-20, 12)], 31)                                        # thumb (front)
    g += E(-4, 116, 26, 12, lt, ' opacity="0.35"')
    ax, ay = HAND_ANCHORS["sprinkle"]
    hand = f'<g transform="translate({ax} {ay}) rotate(-50) scale(.9) translate(6 -4)">{g}</g>'
    shreds = ""
    for i, (dx, dy, r, w) in enumerate(((-8, 44, 60, 30), (14, 78, -20, 26), (-18, 104, 30, 28), (6, 134, 75, 24), (-24, 160, -40, 26), (12, 186, 15, 22))):
        x, y = ax + dx, ay + dy
        shreds += (f'<g transform="rotate({r} {x} {y})">' + P(wrect(x - w / 2, y - 4, w, 11, 5.5, .4, 80 + i), CHEESE_D)
                   + P(wrect(x - w / 2, y - 6, w, 9, 4.5, .4, 90 + i), CHEESE) + P(wrect(x - w / 2 + 3, y - 5, w - 8, 3, 1.5, .2, 99 + i), CHEESE_L) + "</g>")
    return hand_file("mh-sk-", hand, 47, G(shreds, "mh-sk-sh"))


def hand_grab(c):
    """Gentle pinch-carry seen from above: thumb + index/middle fingertips hold the item at its upper-right rim,
    the rest of the hand trails to the lower right. The item (140) centred on the anchor stays mostly visible."""
    s, sh, lt = c["skin"], c["skin_sh"], c["skin_lt"]
    g = wrist_cuff(c, 150, 80)
    g += tube(c, [(52, 124), (60, 96), (50, 76)], 21, False) + tube(c, [(34, 112), (42, 70), (30, 40)], 24, False)   # pinky, ring
    g += P(wob(8, 124, 56, 50, .03, 72), sh) + P(wob(6, 120, 54, 48, .03, 73), s)                                    # back of hand
    g += tube(c, [(16, 100), (20, 46), (16, 2)], 27)                                                                  # middle
    g += tube(c, [(-10, 100), (-12, 46), (-8, -4)], 28)                                                              # index
    g += tube(c, [(-52, 150), (-66, 86), (-52, 32), (-30, 6)], 31)                                                   # thumb
    g += E(-2, 114, 26, 12, lt, ' opacity="0.35"')
    ax, ay = HAND_ANCHORS["grab"]
    px, py = ax + 38, ay - 30                     # pinch point just inside the item's upper-right rim
    return hand_file("mh-gr-", f'<g transform="translate({px} {py}) rotate(-65) scale(.8)">{g}</g>', 49)


def build(out, pr):
    assert pr["hair_style"] in HAIR_STYLES, pr["hair_style"]
    c = palette(pr)
    os.makedirs(out, exist_ok=True)
    al, tip = arm_left(c, pr)
    files = {"mom-body": mom_body(c, pr), "mom-head": mom_head(c, pr), "mom-hair": mom_hair(c, pr),
             "mom-arm-left": al, "mom-arm-right": arm_right(c, pr)}
    for k in ("open", "blink", "happy", "surprised"):
        files["mom-eyes-" + k] = eyes(c, pr, k)
    for k in ("smile", "open", "talk"):
        files["mom-mouth-" + k] = mouth(c, pr, k)
    files.update({"mom-hand-point": hand_point(c), "mom-hand-roll": hand_roll(c), "mom-hand-spread": hand_spread(c),
                  "mom-hand-sprinkle": hand_sprinkle(c), "mom-hand-grab": hand_grab(c)})
    for name, s in files.items():
        with open(os.path.join(out, name + ".svg"), "w", encoding="utf8") as f:
            f.write(s)
    print(out)
    print(" ".join(f"{k}:{len(v.encode()) / 1024:.1f}K" for k, v in files.items()))
    print("pointing fingertip:", tuple(round(v) for v in tip))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out")
    for k in PARAMS:
        ap.add_argument("--" + k)
    a = ap.parse_args()
    pr = dict(PARAMS)
    for k in PARAMS:
        v = getattr(a, k)
        if v is not None:
            pr[k] = v not in ("0", "false", "False", "no") if k == "glasses" else v
    out = OUT if not a.out else (a.out if os.path.isabs(a.out) else os.path.join(OUT, a.out))
    build(os.path.normpath(out), pr)


if __name__ == "__main__":
    main()
