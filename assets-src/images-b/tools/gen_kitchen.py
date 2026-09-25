# Style-B production generator: kitchen background, oven layers, buttons, star, recipe card.
# Run: python images-b/tools/gen_kitchen.py   (writes into images-b/)
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pb import *
import pb

def wrect(x, y, w, h, rad, j=1.5, seed=1, step=60):
    """pb.wrect with a coarser point step (keeps files small; big shapes don't need 26-unit points)."""
    return pb.wrect(x, y, w, h, rad, j, seed, step)

NAMES = ["bg-kitchen-landscape", "oven-closed", "oven-open", "oven-inside", "star",
         "btn-play", "btn-home", "btn-done", "card-pizza"]


def rpoly(pts, r):
    """Polygon with rounded corners (quadratic through each vertex)."""
    L = len(pts)
    d = ""
    for i in range(L):
        px, py = pts[i - 1]; vx, vy = pts[i]; nx, ny = pts[(i + 1) % L]
        la = math.hypot(px - vx, py - vy); lb = math.hypot(nx - vx, ny - vy)
        ra, rb = min(r, la / 2), min(r, lb / 2)
        ax, ay = vx + (px - vx) / la * ra, vy + (py - vy) / la * ra
        bx, by = vx + (nx - vx) / lb * rb, vy + (ny - vy) / lb * rb
        d += (f"M{n(ax)},{n(ay)}" if i == 0 else f"L{n(ax)},{n(ay)}") + f"Q{n(vx)},{n(vy)} {n(bx)},{n(by)}"
    return d + "Z"


def rect(x, y, w, h, fill, rx=0, extra=""):
    return f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}"' + (f' rx="{n(rx)}"' if rx else "") + f' fill="{fill}"{extra}/>'


# =====================================================================================
# OVEN (700x800, three aligned layers)
# =====================================================================================
OV = mix(RED, CORAL, .22)            # warm coral-red body
OV_D = mix(OV, "#6E2418", .32)
OV_DD = mix(OV, "#4A160E", .5)
OV_L = mix(OV, "#FFD9B8", .3)
DOOR = mix(OV, "#FFE0C8", .1)
KNOB, KNOB_D, KNOB_L = TEAL, TEAL_D, TEAL_L
CHROME, CHROME_D, CHROME_L = "#B9C2C0", "#838E8C", "#EEF3F1"


def interior(p, x0, y0, x1, y1, rad, seed=3):
    """Dark warm oven cavity drawn into box, clipped to a rounded rect. Returns (defs, body)."""
    w, h = x1 - x0, y1 - y0
    bx0, bx1 = x0 + w * .15, x1 - w * .15
    by0, by1 = y0 + h * .15, y1 - h * .2
    r = random.Random(seed)
    defs = (f'<clipPath id="{p}ic"><rect x="{x0}" y="{y0}" width="{w}" height="{h}" rx="{rad}"/></clipPath>'
            f'<radialGradient id="{p}gl" cx="{n((x0 + x1) / 2)}" cy="{n(by1)}" r="{n(w * .62)}" gradientUnits="userSpaceOnUse">'
            f'<stop offset="0" stop-color="#FFB054" stop-opacity="0.85"/><stop offset="0.45" stop-color="#E4602F" stop-opacity="0.4"/>'
            f'<stop offset="1" stop-color="#6A1E12" stop-opacity="0"/></radialGradient>'
            f'<linearGradient id="{p}tp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC070" stop-opacity="0.55"/>'
            f'<stop offset="1" stop-color="#FFC070" stop-opacity="0"/></linearGradient>')
    L = [rect(x0, y0, w, h, "#2C1712")]
    # ceiling, side walls, floor (perspective box)
    L.append(P(f"M{n(x0)},{n(y0)} L{n(x1)},{n(y0)} L{n(bx1)},{n(by0)} L{n(bx0)},{n(by0)}Z", "#3A2019"))
    L.append(P(f"M{n(x0)},{n(y0)} L{n(bx0)},{n(by0)} L{n(bx0)},{n(by1)} L{n(x0)},{n(y1)}Z", "#472519"))
    L.append(P(f"M{n(x1)},{n(y0)} L{n(bx1)},{n(by0)} L{n(bx1)},{n(by1)} L{n(x1)},{n(y1)}Z", "#3E2016"))
    L.append(P(f"M{n(x0)},{n(y1)} L{n(bx0)},{n(by1)} L{n(bx1)},{n(by1)} L{n(x1)},{n(y1)}Z", "#6A3522"))
    # back wall: bricks
    br = rect(bx0, by0, bx1 - bx0, by1 - by0, "#35190F")
    rows = 6
    bh = (by1 - by0) / rows
    for row in range(rows):
        yy = by0 + row * bh
        off = 0 if row % 2 else bh * .9
        bw = bh * 1.8
        x = bx0 - off
        k = 0
        while x < bx1:
            xa, xb = max(x + 2.5, bx0 + 2), min(x + bw - 2.5, bx1 - 2)
            if xb - xa > 8:
                br += P(wrect(xa, yy + 2.5, xb - xa, bh - 5, 5, .8, seed * 50 + row * 13 + k),
                        r.choice(["#6A3A28", "#72402C", "#613426", "#7A4630"]))
            x += bw; k += 1
    L.append(G(br, p + "sh"))
    # glow wash
    L.append(rect(x0, y0, w, h, f"url(#{p}gl)"))
    L.append(rect(x0, y0, w, h * .35, f"url(#{p}tp)"))
    # top heating element: glowing zig-zag
    def coil(y, xa, xb, amp, k):
        d = f"M{n(xa)},{n(y)}"
        step = (xb - xa) / k
        for i in range(k):
            d += f" L{n(xa + (i + .5) * step)},{n(y + (amp if i % 2 == 0 else -amp))}"
        return d + f" L{n(xb)},{n(y)}"
    cy_top = y0 + h * .15
    c1 = coil(cy_top, x0 + w * .1, x1 - w * .1, 9, 12)
    L.append(G(stroke(c1, "#FF8A3A", 16), p + "bl", ' opacity="0.8"'))
    L.append(stroke(c1, "#FF9E4C", 9) + stroke(c1, "#FFE0A0", 3.5))
    c2 = coil(y1 - h * .07, x0 + w * .12, x1 - w * .12, 7, 14)
    L.append(G(stroke(c2, "#FF7A30", 18), p + "bl", ' opacity="0.9"'))
    L.append(stroke(c2, "#FF9E4C", 10) + stroke(c2, "#FFE3A6", 4))
    # rack: back bar, front bar, converging rods
    ry_b, ry_f = by1 - 8, by1 + (y1 - by1) * .5
    rk = ""
    for i in range(9):
        t = i / 8
        xb_ = bx0 + 10 + (bx1 - bx0 - 20) * t
        xf_ = x0 + 26 + (w - 52) * t
        rk += stroke(f"M{n(xb_)},{n(ry_b)} L{n(xf_)},{n(ry_f)}", "#9A8378", 5)
    rk += stroke(f"M{n(bx0 + 6)},{n(ry_b)} L{n(bx1 - 6)},{n(ry_b)}", "#8A7368", 6)
    rk += stroke(f"M{n(x0 + 20)},{n(ry_f)} L{n(x1 - 20)},{n(ry_f)}", "#B8A196", 9)
    rk += stroke(f"M{n(x0 + 24)},{n(ry_f - 2)} L{n(x1 - 24)},{n(ry_f - 2)}", "#E6D2C2", 2.5, ' opacity="0.7"')
    L.append(G(rk, p + "sh"))
    # embers
    L.append("".join(C(r.uniform(x0 + 30, x1 - 30), r.uniform(y0 + h * .2, y1 - h * .25), r.uniform(2.5, 4.5), "#FFD08A",
                       f' opacity="{r.uniform(.35, .8):.2f}"') for _ in range(14)))
    # soft inner shadow at the rim for depth
    L.append(G(f'<rect x="{x0}" y="{y0}" width="{w}" height="{h}" rx="{rad}" fill="none" stroke="#1A0B07" stroke-width="22" opacity="0.55"/>', p + "bl"))
    return defs, G("".join(L), None, f' clip-path="url(#{p}ic)"')


def oven_common(p, open_=False):
    L = [ground_shadow(350, 772, 300, 20, p, .38)]
    # legs with mustard toes
    legs = ""
    for x in (112, 588):
        legs += P(f"M{x - 30},696 L{x + 30},696 L{x + 20},742 Q{x},750 {x - 20},742Z", WALNUT)
        legs += E(x, 744, 26, 9, MUSTARD) + E(x - 6, 741, 12, 3.5, "#F7D27E")
    L.append(G(legs, p + "sh"))
    # little crest on top (decorative motif): cream arch with a heart
    crest = P(f"M282,70 Q282,26 350,24 Q418,26 418,70Z", OV_D)
    crest += P(f"M292,70 Q294,36 350,34 Q406,36 408,70Z", CREAM)
    crest += P("M350,63 C336,53 330,46 336,40 C341,35 348,38 350,43 C352,38 359,35 364,40 C370,46 364,53 350,63Z", RED)
    L.append(G(crest, p + "cut"))
    # body: back (edge) layer then front
    L.append(G(P(wrect(40, 60, 620, 650, 66, 1.4, 3), OV_D), p + "cut"))
    L.append(G(P(wrect(50, 60, 600, 636, 60, 1.4, 4), OV), p + "sh"))
    # side shading / highlight (paper strips)
    L.append(P(wrect(60, 120, 20, 540, 10, 1, 5), OV_L, ' opacity="0.7"'))
    L.append(P(wrect(622, 120, 20, 540, 10, 1, 6), OV_D, ' opacity="0.6"'))
    L.append(P("M70,118 Q72,84 104,70 Q88,92 86,124Z", "#FFD6BE", ' opacity="0.75"'))
    # control panel
    L.append(G(P(wrect(80, 86, 540, 138, 34, 1.2, 7), CREAM2), p + "sh"))
    L.append(P(wrect(88, 90, 524, 124, 30, 1, 8), CREAM))
    kn = ""
    for i, x in enumerate((152, 250, 450, 548)):
        a = [-40, 20, -20, 40][i]
        kn += "".join(C(x + math.cos(math.radians(t)) * 46, 152 + math.sin(math.radians(t)) * 46, 3.2, "#CDAE8E") for t in (-150, -90, -30))
        kn += G(C(x, 154, 36, KNOB_D) + C(x, 150, 31, KNOB) + P(wob(x - 8, 140, 16, 11, .06, 20 + i, 14, -30), KNOB_L, ' opacity="0.75"')
                + P(wrect(x - 6, 124, 12, 30, 6, .3, 30 + i), CREAM, f' transform="rotate({a} {x} 150)"'), p + "sh")
    L.append(kn)
    # central dial: chrome bezel, cream face, coloured arc, needle
    dial = C(350, 156, 54, CHROME_D) + C(350, 152, 50, CHROME) + P(wob(338, 134, 30, 16, .05, 40, 14, -25), CHROME_L, ' opacity="0.8"') + C(350, 154, 40, WHITE)
    arc_cols = [GREEN, MUSTARD, CORAL, RED]
    for i, c in enumerate(arc_cols):
        a0, a1 = math.radians(160 + i * 55), math.radians(160 + (i + 1) * 55 - 6)
        dial += f'<path d="M{n(350 + math.cos(a0) * 30)},{n(154 + math.sin(a0) * 30)} A30,30 0 0 1 {n(350 + math.cos(a1) * 30)},{n(154 + math.sin(a1) * 30)}" fill="none" stroke="{c}" stroke-width="8"/>'
    L.append(G(dial, p + "sh"))
    L.append(G(P("M346,158 L375,128 Q379,126 378,131 L354,162Z", RED_D) + C(350, 156, 8, "#5A3A2C"), p + "sh"))
    # scalloped trim under the panel
    sc = P(wrect(66, 222, 568, 14, 7, .6, 9), CREAM)
    sc += "".join(C(84 + i * 33, 234, 14, CREAM) for i in range(17))
    sc += "".join(C(84 + i * 33, 237, 4.5, MUSTARD if i % 2 else KNOB) for i in range(17))
    return L, G(sc, p + "sh")


def oven_closed():
    p = "ovc-"
    L, scallop = oven_common(p)
    # door with depth
    L.append(G(P(wrect(82, 250, 536, 440, 42, 1.2, 10), OV_DD), p + "sh2"))
    L.append(P(wrect(88, 250, 524, 428, 38, 1.2, 11), DOOR))
    L.append(P(wrect(100, 262, 12, 400, 6, .6, 12), OV_L, ' opacity="0.8"'))
    L.append(P(wrect(588, 262, 12, 400, 6, .6, 13), OV_D, ' opacity="0.5"'))
    # window frame: cream ring, bevel, dark lip (the hole is cut by the mask)
    L.append(G(P(wrect(120, 294, 460, 346, 56, 1.2, 14), CREAM), p + "sh"))
    L.append(P(wrect(134, 306, 432, 318, 44, 1, 15), mix(CREAM2, OV, .18)))
    L.append(P(wrect(143, 313, 414, 304, 37, .5, 16), "#7A2E1E"))
    # door bottom motif: pizza badge + dot rows
    mo = E(350, 660, 50, 17, MUSTARD) + E(350, 657, 44, 12, "#F7CF6E")
    mo += P("M330,650 L370,650 Q350,676 350,676Z", CRUST) + P("M333,652 L367,652 L350,672Z", CHEESE) + C(345, 656, 3.5, RED) + C(355, 660, 3, RED) + C(351, 666, 2.5, OLIVE)
    L.append(G(mo, p + "sh"))
    L.append("".join(C(x, 660, 6, OV_D) for x in (150, 190, 230, 270, 430, 470, 510, 550)))
    # kick band + vents
    L.append(P(wrect(66, 684, 568, 18, 8, .6, 17), OV_DD) + "".join(P(wrect(262 + i * 38, 689, 24, 7, 3.5, .3, 18 + i), "#5A1C12") for i in range(5)))
    L.append(scallop)
    # chrome handle bar with posts
    hd = P(wrect(170, 252, 22, 36, 7, .5, 20), CHROME_D) + P(wrect(508, 252, 22, 36, 7, .5, 21), CHROME_D)
    hd += P(wrect(148, 256, 404, 26, 13, .6, 22), CHROME) + P(wrect(162, 259, 372, 7, 3.5, .4, 23), CHROME_L) + P(wrect(166, 274, 368, 5, 2.5, .3, 24), CHROME_D, ' opacity="0.6"')
    L.append(G(hd, p + "sh"))
    body = G("".join(L), p + "gr")
    mask = (f'<mask id="{p}m" maskUnits="userSpaceOnUse" x="0" y="0" width="700" height="800">'
            f'<rect width="700" height="800" fill="#fff"/><rect x="150" y="320" width="400" height="290" rx="30" fill="#000"/></mask>')
    # glass: inner edge shadow + glare only at the edges/corners (centre stays clear for the pizza)
    gl = f'<clipPath id="{p}wc"><rect x="150" y="320" width="400" height="290" rx="30"/></clipPath>'
    g = G('<rect x="150" y="320" width="400" height="290" rx="30" fill="none" stroke="#2A0E08" stroke-width="18" opacity="0.45"/>', p + "bl")
    g += P("M150,410 L150,372 L214,320 L262,320Z", WHITE, ' opacity="0.42"')
    g += P("M150,446 L150,428 L282,320 L302,320Z", WHITE, ' opacity="0.28"')
    g += P("M550,540 L550,566 L500,610 L470,610Z", WHITE, ' opacity="0.25"')
    g += rect(318, 326, 150, 5, WHITE, 2.5, ' opacity="0.35"')
    glass = gl + G(g, None, f' clip-path="url(#{p}wc)"')
    defs = std_defs(p, "default", seed=21, sh=(5, 4, .34), sh2=(7, 6, .3), cut={"rim": 2.6, "rough": 5}, blur=7) + mask
    return svg(700, 800, defs, G(body, None, f' mask="url(#{p}m)"') + glass)


def oven_inside():
    p = "ovi-"
    d, body = interior(p, 110, 280, 590, 650, 12, seed=5)
    defs = std_defs(p, "default", seed=24, blur=7) + d
    return svg(700, 800, defs, G(body, p + "gr"))


def oven_open():
    p = "ovo-"
    L, scallop = oven_common(p, True)
    # recessed lip around the mouth
    L.append(G(P(wrect(80, 230, 540, 450, 40, 1, 30), OV_DD), p + "sh"))
    d, cav = interior(p, 90, 240, 610, 670, 30, seed=7)
    L.append(cav)
    L.append(scallop)
    # hinges
    L.append(G(P(wrect(112, 660, 44, 18, 6, .4, 31), CHROME_D) + P(wrect(544, 660, 44, 18, 6, .4, 32), CHROME_D), p + "sh"))
    # door dropped open: inner face in perspective + thickness edge
    face = rpoly([(62, 668), (638, 668), (662, 764), (38, 764)], 16)
    edge = rpoly([(38, 758), (662, 758), (660, 784), (40, 784)], 10)
    dr = P(edge, OV_DD) + P(face, mix(OV, "#6A2A1C", .18))
    dr += P(rpoly([(92, 676), (608, 676), (626, 752), (74, 752)], 12), CREAM)
    dr += P(rpoly([(118, 684), (582, 684), (596, 744), (104, 744)], 10), "#4A2A22")
    dr += P("M150,684 L196,684 L168,744 L122,744Z", WHITE, ' opacity="0.22"') + P("M214,684 L232,684 L204,744 L186,744Z", WHITE, ' opacity="0.16"')
    dr += P(rpoly([(118, 684), (582, 684), (596, 744), (104, 744)], 10), "#FF9A4A", ' opacity="0.18"')
    dr += P(rpoly([(44, 760), (656, 760), (654, 768), (46, 768)], 3), OV_L, ' opacity="0.7"')
    dr += P(wrect(150, 782, 400, 12, 6, .4, 33), CHROME) + P(wrect(164, 783, 372, 4, 2, .3, 34), CHROME_L)
    L.append(G(dr, p + "cut"))
    defs = std_defs(p, "default", seed=27, sh=(5, 4, .34), sh2=(7, 6, .3), cut={"rim": 2.6, "rough": 5}, blur=7) + d
    return svg(700, 800, defs, G("".join(L), p + "gr"))


# =====================================================================================
# BUTTONS 240x240
# =====================================================================================
def button(p, rim, face, light, icon, seed, face_r=98):
    L = [ground_shadow(120, 219, 88, 6, p, .35)]
    L.append(G(P(wob(120, 118, 108, 107, .009, seed, 30), rim), p + "cut"))
    L.append(G(P(wob(120, 113, face_r, face_r - 1, .01, seed + 1, 30), face), p + "sh"))
    L.append(P(wob(114, 104, 76, 70, .04, seed + 2, 24), light, ' opacity="0.55"'))
    L.append(P("M44,98 Q56,52 104,34 Q72,58 62,104Z", WHITE, ' opacity="0.38"'))
    L.append(icon)
    defs = std_defs(p, "default", seed=seed + 30, sh=(4, 3, .36), sh2=(5, 3, .45), cut={"rim": 2.4, "rough": 4.5})
    return svg(240, 240, defs, G("".join(L), p + "gr"))


def btn_play():
    p = "bpl-"
    tri = rpoly([(84, 54), (186, 113), (84, 172)], 17)
    return button(p, mix(CORAL_D, "#7A2A14", .3), CORAL, CORAL_L, G(P(tri, CREAM), p + "sh2"), 11, face_r=93)


ROSE, ROSE_D, ROSE_L = "#E7708A", "#BF4D69", "#F7A3B3"


def btn_home():
    p = "bhm-"
    house = rpoly([(120, 56), (180, 110), (164, 110), (164, 168), (76, 168), (76, 110), (60, 110)], 9)
    ic = P(house, CREAM) + P(wrect(144, 62, 16, 34, 4, .4, 3), CREAM)
    door = P("M106,168 L106,138 Q106,124 120,124 Q134,124 134,138 L134,168Z", ROSE_D)
    return button(p, ROSE_D, ROSE, ROSE_L, G(ic, p + "sh2") + door, 21)


def btn_done():
    p = "bdn-"
    ck = stroke("M70,118 L106,154 L172,84", CREAM, 32)
    return button(p, GREEN_D, mix(GREEN, GREEN_D, .25), GREEN_L, G(ck, p + "sh2"), 31)


# =====================================================================================
# STAR 200x200
# =====================================================================================
STAR = [(100, 16), (125.9, 68.4), (183.7, 76.8), (141.8, 117.6), (151.7, 175.2), (100, 148), (48.3, 175.2), (58.2, 117.6), (16.3, 76.8), (74.1, 68.4)]


STAR_OUT = [(100, 14.6), (125.9, 68.4), (185.6, 76), (141.8, 117.6), (152.9, 176.8), (100, 148), (47.1, 176.8), (58.2, 117.6), (14.4, 76), (74.1, 68.4)]


def star_pts(s, dx=0, dy=0, cx=100, cy=104):
    return [(cx + (x - cx) * s + dx, cy + (y - cy) * s + dy) for x, y in STAR]


def star():
    p = "str-"
    L = [G(P(rpoly(STAR_OUT, 9), CHEESE_D), p + "cut")]
    L.append(G(P(rpoly(star_pts(.86, 0, -3), 8), CHEESE), p + "sh"))
    L.append(P(rpoly(star_pts(.5, 0, -4), 6), CHEESE_L, ' opacity="0.9"'))
    L.append(P("M68,78 Q76,62 92,58 Q84,70 80,84Z", WHITE, ' opacity="0.75"'))
    L.append(C(96, 44, 5, WHITE, ' opacity="0.7"'))
    defs = std_defs(p, "default", seed=41, sh=(3, 2.5, .3), cut={"rim": 2, "rough": 4})
    return svg(200, 200, defs, G("".join(L), p + "gr"))


# =====================================================================================
# RECIPE CARD 400x520
# =====================================================================================
def pizza_top(p, cx, cy, R, seed=1):
    r = random.Random(seed)
    L = [G(P(wob(cx, cy, R, R, .025, seed, 30), CRUST_D), p + "sh")]
    L.append(P(wob(cx, cy - 2, R * .96, R * .95, .025, seed + 1, 30), CRUST))
    L.append(P(wob(cx - R * .1, cy - R * .12, R * .8, R * .78, .03, seed + 2, 24), CRUST_L, ' opacity="0.5"'))
    L.append(G(P(wob(cx, cy, R * .82, R * .81, .04, seed + 3, 26), SAUCE), p + "sh"))
    ch = ""
    for i in range(7):
        a = i / 7 * 6.283 + .3
        d = R * .42
        ch += P(wob(cx + math.cos(a) * d, cy + math.sin(a) * d, R * .3, R * .24, .12, seed + 10 + i, 14, math.degrees(a)), CHEESE)
    ch += P(wob(cx, cy, R * .34, R * .32, .1, seed + 20, 14), CHEESE)
    L.append(G(ch, p + "sh"))
    L.append(P(wob(cx - R * .2, cy - R * .2, R * .2, R * .12, .1, seed + 21, 12, -30), CHEESE_L, ' opacity="0.8"'))
    tp = ""
    for a, d in ((.2, .5), (2.3, .52), (4.3, .5)):
        x, y = cx + math.cos(a) * R * d, cy + math.sin(a) * R * d
        tr = R * .17
        tp += G(C(x, y, tr, RED_D) + C(x, y - 1, tr * .86, RED) + "".join(C(x + math.cos(k * 1.257) * tr * .45, y - 1 + math.sin(k * 1.257) * tr * .45, tr * .15, SEEDPOCK) for k in range(5)), p + "sh")
    for a, d in ((1.2, .55), (3.3, .5), (5.4, .55), (0, 0)):
        x, y = cx + math.cos(a) * R * d, cy + math.sin(a) * R * d
        tp += G(C(x, y, R * .1, OLIVE) + C(x, y, R * .045, CHEESE), p + "sh")
    for a, d, rot in ((.75, .33, 30), (2.9, .3, -40), (4.9, .33, 70), (5.9, .72, 10)):
        x, y = cx + math.cos(a) * R * d, cy + math.sin(a) * R * d
        tp += G(P(wob(x, y, R * .11, R * .055, .05, int(a * 10), 12, rot), HERB), p + "sh")
    L.append(tp)
    return "".join(L)


def card_pizza():
    p = "crd-"
    L = [G(P(wrect(10, 10, 380, 500, 36, 2.2, 3, step=18), CREAM), p + "cut")]
    # picture area: soft gingham
    pat = (f'<pattern id="{p}gh" width="40" height="40" patternUnits="userSpaceOnUse">'
           f'<rect width="40" height="40" fill="#FBE7DA"/><rect width="20" height="40" fill="{RED_L}" opacity="0.3"/>'
           f'<rect width="40" height="20" fill="{RED_L}" opacity="0.3"/></pattern>')
    L.append(G(P(wrect(34, 34, 332, 332, 26, 1.2, 4), f"url(#{p}gh)"), p + "sh"))
    L.append(pizza_top(p, 200, 204, 146, 5))
    # washi tape
    L.append(G(P(wrect(130, -4, 140, 40, 3, 1.4, 6), MUSTARD, ' opacity="0.85" transform="rotate(-4 200 15)"')
               + "".join(C(146 + i * 18, 16, 4, WHITE, ' opacity="0.7" transform="rotate(-4 200 15)"') for i in range(7)), p + "sh"))
    # ingredient row: three little paper tabs
    L.append(G("".join(P(wob(x, 440, 50, 44, .04, 7 + i, 20), WHITE) for i, x in enumerate((92, 200, 308))), p + "sh"))
    tom = C(92, 440, 34, RED_D) + C(92, 438, 29, RED) + "".join(C(92 + math.cos(k * 1.257 + .3) * 15, 438 + math.sin(k * 1.257 + .3) * 15, 5.5, SEEDPOCK) for k in range(5)) + C(92, 438, 5, RED_L)
    wedge = P(rpoly([(166, 464), (234, 464), (234, 424), (170, 440)], 5), CHEESE_D) + P(rpoly([(166, 456), (234, 456), (234, 416), (170, 432)], 5), CHEESE)
    wedge += P(rpoly([(170, 432), (234, 416), (222, 410)], 4), CHEESE_L) + C(190, 446, 5, CHEESE_D) + C(214, 440, 6.5, CHEESE_D) + C(222, 452, 3.5, CHEESE_D)
    olive = C(308, 442, 32, OLIVE_D) + C(308, 438, 29, OLIVE) + C(308, 438, 12, CREAM2) + P("M288,424 Q296,414 310,412 Q298,420 294,430Z", OLIVE_S, ' opacity="0.8"')
    L.append(G(tom, p + "sh") + G(wedge, p + "sh") + G(olive, p + "sh"))
    defs = std_defs(p, "rough", seed=51, sh=(4, 3.5, .32), cut={"rim": 3, "rough": 7, "freq": .12}) + pat
    return svg(400, 520, defs, G("".join(L), p + "gr"))


# =====================================================================================
# BACKGROUND 2400x1080 (calm, light)
# =====================================================================================
def bg_kitchen():
    p = "bgk-"
    r = random.Random(42)
    L = [rect(0, 0, 2400, 1080, BG_WALL)]
    defs = ""
    # wallpaper: tiny leaf sprigs in a diamond grid, very low contrast
    leaf = lambda x, y, a: E(x, y, 5, 9, BG_WALL_M, f' transform="rotate({a} {x} {y})"')
    defs += (f'<pattern id="{p}wp" width="120" height="100" patternUnits="userSpaceOnUse">'
             + leaf(26, 24, 40) + leaf(38, 24, -40) + C(32, 34, 3, BG_WALL_M)
             + leaf(86, 74, 40) + leaf(98, 74, -40) + C(92, 84, 3, BG_WALL_M) + '</pattern>')
    L.append(rect(0, 0, 2400, 252, f"url(#{p}wp)", 0, ' opacity="0.6"'))
    L.append(P(wrect(-10, 244, 2420, 10, 4, .6, 1, step=80), BG_WALL_M))
    # backsplash tiles
    tile = lambda x, y, c, a: f'<rect x="{x + 2.5}" y="{y + 2.5}" width="45" height="40" rx="7" fill="{c}" transform="rotate({a} {x + 25} {y + 22})"/>'
    ACC = mix(BG_TILE2, "#E8B89A", .45)
    defs += (f'<pattern id="{p}tl" width="200" height="90" patternUnits="userSpaceOnUse" y="254">'
             f'<rect width="200" height="90" fill="{mix(BG_TILE2, BG_WALL_M, .5)}"/>'
             + tile(0, 0, BG_TILE, .7) + tile(50, 0, BG_TILE2, -.5) + tile(100, 0, BG_TILE, .4) + tile(150, 0, BG_TILE2, -.8)
             + tile(-25, 45, BG_TILE2, -.4) + tile(25, 45, BG_TILE, .8) + tile(75, 45, ACC, 0) + C(100, 67, 7, mix(ACC, "#D59A7A", .4))
             + tile(125, 45, BG_TILE2, -.7) + tile(175, 45, BG_TILE, .3) + '</pattern>')
    L.append(rect(0, 254, 2400, 130, f"url(#{p}tl)"))

    # ---- cabinets at the far sides (crop away at 4:3) ----
    def cabinet(x, w, s):
        c = P(wrect(x, -30, w, 262, 24, 1.5, s), BG_SAGE_D)
        c += P(wrect(x + 7, -30, w - 14, 250, 22, 1.5, s + 1), BG_SAGE)
        dw = (w - 42) / 2
        for k in range(2):
            dx = x + 14 + k * (dw + 14)
            c += P(wrect(dx, 12, dw, 190, 16, 1.2, s + 2 + k), BG_SAGE_L, ' opacity="0.6"')
            c += C(dx + (dw - 20 if k == 0 else 20), 168, 9, mix(MUSTARD, BG_WALL, .35))
        return G(c, p + "sh2")
    L.append(cabinet(-20, 440, 10) + cabinet(1980, 440, 20))
    # mugs (left) and copper pots (right) under the cabinets
    mg = ""
    for i, (x, c) in enumerate(((90, mix(CORAL, BG_WALL, .4)), (200, mix(TEAL, BG_WALL, .45)), (310, mix(MUSTARD, BG_WALL, .35)))):
        mg += stroke(f"M{x},232 L{x},256", "#A08670", 3) + P(wrect(x - 27, 256, 54, 52, 11, .8, 30 + i), c) + P(wob(x + 30, 281, 13, 15, .05, 40 + i), "none", f' stroke="{c}" stroke-width="7"')
    for i, x in enumerate((2090, 2210, 2320)):
        rr = 40 - i * 4
        mg += stroke(f"M{x},232 L{x},{290 - rr}", "#A08670", 3) + P(wob(x, 290, rr, rr, .02, 50 + i), mix("#C98552", BG_WALL, .3)) + P(wob(x - 7, 283, rr * .55, rr * .5, .05, 55 + i), mix("#E0A874", BG_WALL, .3), ' opacity="0.9"')
    L.append(G(mg, p + "sh"))

    # ---- window (centre-left, above the pizza), pale landscape ----
    wx, wy, ww, wh = 960, 40, 400, 190
    FR = "#F8EEDB"
    L.append(G(P(wrect(wx - 20, wy - 18, ww + 40, wh + 38, 26, 1.5, 60), FR), p + "sh2"))
    defs += f'<clipPath id="{p}wc"><rect x="{wx}" y="{wy}" width="{ww}" height="{wh}" rx="14"/></clipPath>'
    land = rect(wx, wy, ww, wh, "#C4DCDA")
    land += E(wx + 110, wy + 130, 190, 60, "#D2E5E1", ' opacity="0.8"')
    land += G(C(wx + 310, wy + 58, 30, "#F5D27C") + C(wx + 310, wy + 58, 21, "#F9E1A0"), p + "sh")
    land += G(P(wob(wx + 100, wy + 56, 42, 15, .08, 61), "#FBF4E6") + P(wob(wx + 140, wy + 48, 28, 15, .08, 62), "#FBF4E6"), p + "sh")
    land += G(P(f"M{wx - 10},{wy + 150} Q{wx + 90},{wy + 96} {wx + 200},{wy + 142} Q{wx + 300},{wy + 104} {wx + ww + 10},{wy + 140} V{wy + wh + 10} H{wx - 10}Z", "#B9CDA3"), p + "sh")
    land += G(P(f"M{wx - 10},{wy + 174} Q{wx + 140},{wy + 134} {wx + 260},{wy + 168} Q{wx + 340},{wy + 150} {wx + ww + 10},{wy + 166} V{wy + wh + 10} H{wx - 10}Z", "#A3BC8C"), p + "sh")
    for tx in (wx + 64, wx + 286, wx + 334):
        land += G(P(wob(tx, wy + 140, 14, 21, .08, tx), "#88A677") + rect(tx - 2, wy + 156, 4, 12, "#9C8068"), p + "sh")
    L.append(G(land, None, f' clip-path="url(#{p}wc)"'))
    L.append(G(rect(wx + ww / 2 - 6, wy, 12, wh, FR) + rect(wx, wy + wh / 2 - 6, ww, 12, FR), p + "sh"))
    # sill
    L.append(G(P(wrect(wx - 40, wy + wh + 14, ww + 80, 16, 6, .8, 63), BG_WOOD_L), p + "sh"))
    # curtains (muted rust with dots)
    CUR = mix(RUST, BG_WALL, .42); DOT = mix(CUR, WHITE, .55)
    for side in (-1, 1):
        cx0 = wx - 28 if side < 0 else wx + ww + 28
        cur = (f"M{cx0 - side * 4},{wy - 22} L{cx0 + side * 104},{wy - 22} Q{cx0 + side * 66},{wy + 86} {cx0 + side * 32},{wy + 114} "
               f"Q{cx0 + side * 58},{wy + 164} {cx0 + side * 66},{wy + 214} L{cx0 - side * 18},{wy + 216} Q{cx0 - side * 6},{wy + 96} {cx0 - side * 4},{wy - 22}Z")
        dots = "".join(C(cx0 + side * dx, wy + dy, 5.5, DOT) for dx, dy in [(20, 8), (60, 18), (36, 56), (10, 104), (40, 146), (20, 190), (58, 200), (82, -4)])
        defs += f'<clipPath id="{p}cu{side + 1}"><path d="{cur}"/></clipPath>'
        L.append(G(P(cur, CUR) + G(dots, None, f' clip-path="url(#{p}cu{side + 1})"'), p + "sh2"))
        L.append(G(P(wob(cx0 + side * 30, wy + 114, 17, 9, .1, 70 + side), mix(MUSTARD, BG_WALL, .3)), p + "sh"))
    L.append(G(P(wrect(wx - 66, wy - 32, ww + 132, 11, 5.5, .6, 72), "#A08670") + C(wx - 68, wy - 27, 10, mix(MUSTARD, BG_WALL, .25)) + C(wx + ww + 68, wy - 27, 10, mix(MUSTARD, BG_WALL, .25)), p + "sh"))

    # ---- left shelf with jars (muted) ----
    sx0, sx1, sy = 500, 880, 226
    L.append(G(P(wrect(sx0, sy, sx1 - sx0, 16, 6, 1, 80), BG_WOOD) + P(wrect(sx0 + 30, sy + 12, 15, 26, 4, .5, 81), BG_WOOD_D) + P(wrect(sx1 - 45, sy + 12, 15, 26, 4, .5, 82), BG_WOOD_D), p + "sh2"))
    JAR = "#F7F0E2"
    j = G(P(wrect(520, 130, 84, 96, 20, 1, 90), JAR) + P(wrect(513, 118, 98, 20, 9, .8, 91), BG_WOOD_D) + P(wrect(538, 158, 48, 32, 8, .8, 92), mix(MUSTARD, BG_WALL, .3)), p + "sh")
    past = "".join(P(wob(642 + (i % 3) * 20, 164 + (i // 3) * 15, 8, 4.5, .2, 100 + i, 8, i * 40), mix("#EFC66E", BG_WALL, .2)) for i in range(12))
    j += G(P(wrect(624, 146, 78, 80, 17, 1, 93), mix("#CFE0DC", BG_WALL, .2)) + past + P(wrect(618, 134, 90, 17, 8, .8, 94), mix(TEAL, BG_WALL, .45)), p + "sh")
    j += G(P(wrect(724, 160, 62, 66, 10, 1, 95), mix(RUST, BG_WALL, .35)) + P(wrect(724, 176, 62, 30, 4, .6, 96), JAR) + C(755, 191, 10, mix(RED, BG_WALL, .3)), p + "sh")
    basil = "".join(P(wob(836 + math.cos(a) * 24, 146 + math.sin(a) * 16, 17, 10, .1, 110 + i, 12, math.degrees(a)), BG_SAGE_D if i % 2 else mix(BG_SAGE_D, "#6D8F52", .4)) for i, a in enumerate([k * .9 for k in range(7)]))
    j += G(basil + P("M810,176 L862,176 L853,226 L819,226Z", mix("#C8704F", BG_WALL, .3)) + P(wrect(806, 170, 60, 13, 5, .5, 111), mix("#B35F42", BG_WALL, .3)), p + "sh")
    L.append(j)

    # ---- utensil rail (right, high up, above Mom's head) ----
    rx0, rx1, ry = 1440, 1700, 70
    MT, MT_D = mix(METAL, BG_WALL, .25), mix(METAL_D, BG_WALL, .25)
    ut = P(wrect(rx0, ry, rx1 - rx0, 11, 5.5, .6, 120), "#A08670") + C(rx0 + 2, ry + 5, 9, mix(MUSTARD, BG_WALL, .25)) + C(rx1 - 2, ry + 5, 9, mix(MUSTARD, BG_WALL, .25))
    ut += rect(1486, ry + 8, 6, 118, MT) + P(wob(1489, ry + 146, 25, 21, .04, 121), MT) + P(wob(1489, ry + 142, 17, 12, .06, 122), MT_D)
    ut += rect(1546, ry + 8, 10, 66, BG_WOOD) + "".join(P(wob(1551 + dx, ry + 114, 12 - abs(dx) * .6, 44, .03, 123 + i), "none", f' stroke="{MT}" stroke-width="3.5"') for i, dx in enumerate((-8, 0, 8)))
    ut += rect(1606, ry + 8, 8, 100, BG_WOOD_D) + P(wrect(1586, ry + 102, 48, 58, 12, .8, 124), BG_WOOD_L)
    ut += rect(1656, ry + 8, 8, 70, "#6E5C55") + P(wob(1660, ry + 120, 40, 40, .02, 125), "#6E5C55") + P(wob(1660, ry + 120, 30, 30, .03, 126), "#857069")
    L.append(G(ut, p + "sh"))

    # ---- counter ----
    L.append(G(P("M-10,380 L2410,380 L2410,414 L-10,414Z", BG_WOOD_D), p + "sh2"))
    L.append(P("M-10,382 L2410,382 L2410,390 L-10,390Z", BG_WOOD_L, ' opacity="0.45"'))
    ys = [414, 530, 648, 766, 884]
    PT = [BG_WOOD, BG_WOOD2, mix(BG_WOOD, BG_WOOD_L, .35), mix(BG_WOOD, BG_WOOD_D, .12), mix(BG_WOOD2, BG_WOOD_L, .2)]
    planks = ""
    joints = ""
    for i, y in enumerate(ys):
        h = (ys[i + 1] if i + 1 < len(ys) else 1004) - y
        x = -20 - r.uniform(0, 500)
        k = 0
        while x < 2420:
            w = r.uniform(560, 980)
            planks += P(wrect(x, y, w + 6, h + 4, 8, 1.4, 200 + i * 20 + k, step=90), r.choice(PT))
            joints += P(wrect(x + w + 1, y + 6, 4, h - 10, 2, .5, 400 + i * 20 + k, step=90), BG_WOOD_D, ' opacity="0.4"')
            x += w; k += 1
    L.append(G(planks, p + "sh"))
    L.append(joints)
    # plank seams
    L.append("".join(P(wrect(-20, y - 3, 2440, 5, 2.5, .8, 220 + i, step=120), BG_WOOD_D, ' opacity="0.5"') for i, y in enumerate(ys[1:])))
    gr = ""
    for i in range(30):
        y = r.uniform(440, 990); x = r.uniform(-100, 2300); w = r.uniform(200, 520)
        gr += P(f"M{n(x)},{n(y)} Q{n(x + w / 2)},{n(y - r.uniform(-6, 6))} {n(x + w)},{n(y)} Q{n(x + w / 2)},{n(y + 3)} {n(x)},{n(y)}Z", r.choice([BG_WOOD_D, BG_WOOD_L]), ' opacity="0.3"')
    # soft paper knots: two stacked cut ovals + a short grain swirl
    for i in range(9):
        x = r.uniform(80, 2320); y = r.choice(ys) + r.uniform(35, 80)
        gr += (P(wob(x, y, 24, 10, .08, 600 + i, 14), BG_WOOD_D, ' opacity="0.28"') + P(wob(x + 2, y, 12, 5, .1, 620 + i, 12), mix(BG_WOOD_D, "#8F5E3A", .4), ' opacity="0.35"')
               + P(f"M{n(x - 60)},{n(y - 14)} Q{n(x)},{n(y - 30)} {n(x + 64)},{n(y - 12)} Q{n(x)},{n(y - 26)} {n(x - 60)},{n(y - 14)}Z", BG_WOOD_D, ' opacity="0.25"'))
    L.append(G(gr, p + "sh", ' opacity="0.9"'))
    # soft shade under the back strip + darker front-edge vignette framing the scene
    defs += (f'<linearGradient id="{p}vt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{SH}" stop-opacity="0.16"/>'
             f'<stop offset="1" stop-color="{SH}" stop-opacity="0"/></linearGradient>'
             f'<linearGradient id="{p}vg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{SH}" stop-opacity="0"/>'
             f'<stop offset="0.6" stop-color="{SH}" stop-opacity="0.1"/><stop offset="1" stop-color="{SH}" stop-opacity="0.24"/></linearGradient>')
    L.append(rect(0, 414, 2400, 46, f"url(#{p}vt)"))
    L.append(rect(0, 700, 2400, 304, f"url(#{p}vg)"))
    # front lip + lower cabinets
    L.append(G(P("M-10,1000 L2410,1000 L2410,1026 L-10,1026Z", BG_WOOD_L), p + "sh"))
    cab = P("M-10,1024 L2410,1024 L2410,1090 L-10,1090Z", BG_SAGE)
    for i in range(12):
        x = i * 210 - 20
        cab += P(wrect(x + 10, 1036, 190, 60, 10, 1, 300 + i), BG_SAGE_L, ' opacity="0.5"') + C(x + 105, 1056, 7, mix(MUSTARD, BG_WALL, .3))
    L.append(G(cab, p + "sh2"))
    # tea towel (far left, crops at 4:3)
    tw = "M236,990 L336,990 L342,1080 L230,1080Z"
    defs += f'<clipPath id="{p}tw"><path d="{tw}"/></clipPath>'
    stripes = "".join(rect(228, y, 120, 8, mix(RUST, BG_WALL, .3), 0, ' opacity="0.7"') for y in (1012, 1026, 1060))
    L.append(G(P(tw, "#F6EEDD") + G(stripes, None, f' clip-path="url(#{p}tw)"'), p + "sh2"))

    d = std_defs(p, "bg", seed=61, sh=(3, 2.5, .22), sh2=(6, 5, .24), blur=6)
    return svg(2400, 1080, d + defs, G("".join(L), p + "gr"))


def main():
    fns = {"bg-kitchen-landscape": bg_kitchen, "oven-closed": oven_closed, "oven-open": oven_open, "oven-inside": oven_inside,
           "star": star, "btn-play": btn_play, "btn-home": btn_home, "btn-done": btn_done, "card-pizza": card_pizza}
    for k in NAMES:
        path, size = write(k, fns[k]())
        lim = 150 if k.startswith("bg") else 60
        print(f"{k:24s} {size / 1024:6.1f} KB {'OK' if size <= lim * 1024 else 'OVER BUDGET'}")


if __name__ == "__main__":
    main()
