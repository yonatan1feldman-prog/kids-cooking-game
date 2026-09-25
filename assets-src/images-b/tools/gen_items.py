# Style-B production items: dough, tools, sauce, cheese, toppings, board, slice, topping bin.
# Run: python images-b/tools/gen_items.py   (writes into images-b/)
# All helpers/palette/filters come from pb.py (shared kit, do not edit it here).
import sys, os, math, random, re, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pb import *

BOXES = {}   # name -> list of (label, bbox, expected-check) for the geometry report


# ---------------- local helpers ----------------
def wobp(cx, cy, rx, ry, j=0.03, seed=1, k=22, rot=0):
    """Same as pb.wob but returns the points (so bounding boxes can be checked)."""
    r = random.Random(seed)
    ca, sa = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    pts = []
    for i in range(k):
        a = i / k * 2 * math.pi
        f = 1 + (r.random() * 2 - 1) * j
        x, y = math.cos(a) * rx * f, math.sin(a) * ry * f
        pts.append((cx + x * ca - y * sa, cy + x * sa + y * ca))
    return pts


def polar(cx, cy, rfun, k=48):
    return [(cx + math.cos(i / k * 2 * math.pi) * rfun(i / k * 2 * math.pi),
             cy + math.sin(i / k * 2 * math.pi) * rfun(i / k * 2 * math.pi)) for i in range(k)]


def bbox(pts):
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    return (min(xs), min(ys), max(xs), max(ys))


def ring(outer, inner, fill, extra=""):
    """Evenodd ring from two point loops (true hole: whatever is below shows through)."""
    return P(smooth(outer) + " " + smooth(inner), fill, ' fill-rule="evenodd"' + extra)


def check(name, label, box, exp, tol=4):
    """exp = (x0, y0, x1, y1) with None for 'don't care'."""
    ok = all(e is None or abs(b - e) <= tol for b, e in zip(box, exp))
    BOXES.setdefault(name, []).append((label, tuple(round(v, 1) for v in box), exp, ok))
    return ok


def check_r(name, label, pts, c, rmax):
    r = max(math.hypot(x - c[0], y - c[1]) for x, y in pts)
    ok = r <= rmax
    BOXES.setdefault(name, []).append((label, f"max r {r:.1f}", f"<= {rmax}", ok))


def scale_path(d, sx, sy, ox, oy, tx, ty):
    """Scale every absolute x,y pair of a path about (ox,oy), then move to (tx,ty)."""
    return re.sub(r"(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)",
                  lambda m: f"{n(tx + (float(m.group(1)) - ox) * sx)},{n(ty + (float(m.group(2)) - oy) * sy)}", d)


def doc(p, w, h, body, material="default", seed=3, sh=(4, 3.5, .33), sh2=(8, 7, .28), cut=None, blur=6, extra_defs="", paper=None):
    d = std_defs(p, material, seed, sh, sh2, cut, blur)
    if paper:   # per-file tweak of the paper preset (e.g. calmer fibres on dark wood)
        d = d.replace(f_paper(p + "gr", material, seed), f_paper(p + "gr", material, seed, 1.0, **paper))
    return svg(w, h, d + extra_defs, G(body, p + "gr"))


# ================= TOPPINGS (140x140, centre 70,70, r <= 58) =================
def topping_tomato():
    p = "tt-"
    c = 70
    skin = wobp(c, c + 1, 56, 55, .025, 11, 26)
    check_r("topping-tomato", "skin", skin, (70, 70), 58)
    L = [G(P(smooth(skin), mix(RED_D, "#7A2016", .28)), p + "cut")]                       # dark skin rim
    L.append(G(P(wob(c - .5, c, 50, 49, .03, 12, 24), RED), p + "sh"))                     # outer flesh wall
    L.append(G(P(wob(c, c, 41, 40, .035, 13, 22), RED_L), p + "sh"))                       # light inner flesh
    # three big seed pockets (bold, readable) around a light core
    pk = ""
    for i in range(3):
        a = i / 3 * 2 * math.pi - math.pi / 2 + .3
        px, py = c + math.cos(a) * 21, c + math.sin(a) * 21
        pk += P(wob(px, py, 16, 11.5, .07, 20 + i, 14, math.degrees(a)), SEEDPOCK)
    L.append(G(pk, p + "sh"))
    L.append(P(wob(c, c, 8, 8, .1, 31, 10), "#FBA487"))                                   # core
    sd = ""
    for i in range(3):
        a = i / 3 * 2 * math.pi - math.pi / 2 + .3
        for off in (-.28, .28):
            px, py = c + math.cos(a + off) * 23, c + math.sin(a + off) * 23
            sd += E(px, py, 3.4, 5, SEED, f' transform="rotate({n(math.degrees(a))} {n(px)} {n(py)})"')
    L.append(G(sd, p + "sh"))
    L.append(P(f"M{c - 42},{c - 8} Q{c - 38},{c - 32} {c - 16},{c - 42} Q{c - 30},{c - 28} {c - 36},{c - 6}Z", "#FFC1A8", ' opacity="0.85"'))
    return doc(p, 140, 140, "".join(L), seed=21, sh=(3, 2.5, .33), cut={"rim": 2.4, "rough": 3.5})


def topping_olive():
    p = "to-"
    c = 70
    out = wobp(c, c, 50, 47, .02, 1, 26)
    hole = wobp(c, c + 1, 12, 11.5, .04, 51, 14)
    check_r("topping-olive", "ring", out, (70, 70), 58)
    L = [G(ring(out, hole, OLIVE_D), p + "cut"),
         G(ring(wobp(c - 1, c - 1.5, 46.5, 43.5, .02, 2, 26), wobp(c, c + 1, 15, 14.5, .04, 52, 14), OLIVE), p + "sh"),
         P(f"M{c - 37},{c - 6} Q{c - 30},{c - 34} {c + 2},{c - 37} Q{c - 21},{c - 28} {c - 26},{c - 4}Z", OLIVE_S, ' opacity="0.95"'),
         P(wob(c + 26, c + 20, 8, 4.5, .1, 9, 12, -35), OLIVE_M)]
    return doc(p, 140, 140, "".join(L), seed=23, sh=(3, 2.5, .33), cut={"rim": 2.4, "rough": 3.5})


MUSH_SIL = "M12,84 C10,40 44,16 80,16 C116,16 150,40 148,84 C148,96 138,100 126,100 L102,100 L106,132 C107,143 98,148 88,148 L72,148 C62,148 53,143 54,132 L58,100 L34,100 C22,100 12,96 12,84Z"


def topping_mushroom():
    p = "tm-"
    # round-4 mushroom from gen_b.py (160 box, x 12-148, y 16-148) mapped to x 18-122, y 18-126
    sx, sy = 104 / 136, 108 / 132
    S = lambda d: scale_path(d, sx, sy, 12, 16, 18, 18)
    sil = S(MUSH_SIL)
    xy = [(float(a), float(b)) for a, b in re.findall(r"(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)", sil)]
    check("topping-mushroom", "silhouette", bbox(xy), (18, 18, 122, 126), 1.5)
    skin = S("M12,84 C10,40 44,16 80,16 C116,16 150,40 148,84 C148,90 144,94 138,94 C134,54 110,34 80,34 C50,34 26,54 22,94 C16,94 12,90 12,84Z")
    gills = S("M24,93 C30,78 56,72 80,72 C104,72 130,78 136,93 C132,99 126,100 120,100 L40,100 C34,100 28,99 24,93Z")
    L = [G(P(sil, MUSH), p + "cut"), G(P(skin, MUSH_CAP), p + "sh"),
         P(S("M24,72 C28,46 50,26 84,23 C58,34 38,50 32,76Z"), MUSH_CAP_L, ' opacity="0.9"'),
         G(P(gills, "#B98552"), p + "sh")]
    ribs = "".join(P(S(f"M{x - 2},{79 + abs(80 - x) * .12} L{x + (x - 80) * .06 - 1.2},99 L{x + (x - 80) * .06 + 1.2},99 L{x + 2},{79 + abs(80 - x) * .12}Z"), "#E6C38F")
                   for x in range(38, 124, 14))
    L.append(ribs)
    L.append(P(S("M60,104 Q58,124 62,140 Q66,146 72,146 Q64,126 66,104Z"), "#E0C293", ' opacity="0.9"'))   # stem shade
    L.append(P(wob(18 + (80 - 12) * sx, 18 + (56 - 16) * sy, 26, 10, .06, 5), "#FFF6E2", ' opacity="0.95"'))  # flesh highlight
    return doc(p, 140, 140, "".join(L), seed=25, sh=(3, 2.5, .33), cut={"rim": 2.4, "rough": 3.5})


def kernel_pts(cx, cy, w, h, rot, seed):
    """Plump corn kernel seen from above: wide rounded crown, slightly narrower rounded base."""
    r = random.Random(seed)
    base = [(0, -.5), (.34, -.47), (.5, -.25), (.49, .08), (.38, .36), (.18, .5), (0, .52), (-.18, .5), (-.38, .36), (-.49, .08), (-.5, -.25), (-.34, -.47)]
    ca, sa = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    pts = []
    for x, y in base:
        x = x * w * (1 + r.uniform(-.03, .03)); y = y * h * (1 + r.uniform(-.03, .03))
        pts.append((cx + x * ca - y * sa, cy + x * sa + y * ca))
    return pts


def topping_corn():
    p = "tc-"
    ks = [(38, 52, -8), (70, 49, 2), (102, 53, 9), (54, 88, -4), (86, 88, 5)]
    L = []
    allp = []
    for i, (x, y, rot) in enumerate(ks):
        w, h = 33, 37
        k = kernel_pts(x, y, w, h, rot, 40 + i)
        allp += k
        ca, sa = math.cos(math.radians(rot)), math.sin(math.radians(rot))
        loc = lambda lx, ly: (x + lx * ca - ly * sa, y + lx * sa + ly * ca)
        hx, hy = loc(-4, -6)
        gx, gy = loc(0, 10)
        inner = [(x + (px - x) * .8, y + (py - y) * .8 - 1.5) for px, py in k]
        piece = G(P(smooth(k), "#D98414"), p + "cut")
        piece += P(smooth(inner), CORN)
        piece += P(wob(hx, hy, 9, 7, .08, 60 + i, 12, rot - 20), CORN_L)
        piece += P(wob(gx, gy, 5, 6.5, .1, 70 + i, 10, rot), "#FFF3C8", ' opacity="0.95"')
        L.append(piece)
    check_r("topping-corn", "kernels", allp, (70, 70), 60)
    b = bbox(allp)
    check("topping-corn", "cluster bbox (centred)", ((b[0] + b[2]) / 2, (b[1] + b[3]) / 2, 0, 0), (70, 70, None, None), 3)
    return doc(p, 140, 140, "".join(L), seed=27, sh=(3, 2.5, .33), cut={"rim": 2.2, "rough": 3, "op": .45})


def topping_pepper():
    p = "tp-"
    c = 70
    R = lambda a: 52 + 4.5 * math.cos(4 * a + .4) + 1.5 * math.sin(3 * a)
    out = polar(c, c, R, 56)
    check_r("topping-pepper", "ring", out, (70, 70), 58)
    L = [G(ring(out, polar(c, c, lambda a: R(a) - 16, 56), PEPPER_D), p + "cut"),
         G(ring(polar(c - .5, c - 1, lambda a: R(a) - 3.5, 56), polar(c, c, lambda a: R(a) - 16, 56), PEPPER), p + "sh"),
         G(ring(polar(c, c, lambda a: R(a) - 10, 56), polar(c, c, lambda a: R(a) - 16, 56), PEPPER_L), p + "sh")]
    # pale ribs poking into the hollow at the four dimples
    rb = ""
    for i in range(4):
        a = (math.pi - .4) / 4 + i * math.pi / 2
        rr = R(a) - 16
        rb += P(wob(c + math.cos(a) * (rr - 2), c + math.sin(a) * (rr - 2), 6, 4.5, .1, 80 + i, 10, math.degrees(a)), "#D9F0BE")
    L.append(G(rb, p + "sh"))
    # glossy skin highlight
    L.append(P(f"M{c - 44},{c - 12} Q{c - 36},{c - 36} {c - 12},{c - 46} Q{c - 30},{c - 34} {c - 39},{c - 10}Z", "#C8EFA8", ' opacity="0.9"'))
    return doc(p, 140, 140, "".join(L), seed=29, sh=(3, 2.5, .33), cut={"rim": 2.4, "rough": 3.5})


def topping_onion():
    p = "tn-"
    c = 70
    o1 = wobp(c, c, 55, 53, .02, 3, 28)
    check_r("topping-onion", "outer ring", o1, (70, 70), 58)
    # outer ring: purple skin band + pale flesh
    L = [G(ring(o1, wobp(c, c, 41, 39.5, .03, 4, 26), ONION_D), p + "cut"),
         G(ring(wobp(c - .5, c - 1, 51, 49.5, .02, 5, 28), wobp(c, c, 41, 39.5, .03, 4, 26), ONION), p + "sh"),
         G(ring(wobp(c, c - .5, 46, 44.5, .025, 6, 28), wobp(c, c, 41, 39.5, .03, 4, 26), ONION_W), p + "sh")]
    # inner ring: separate paper ring, slightly off-centre, gap between rings is a real hole
    ci = (c + 3, c + 2)
    L.append(G(ring(wobp(*ci, 34, 33, .03, 7, 24), wobp(*ci, 21, 20, .04, 8, 20), ONION_D), p + "cut"))
    L.append(G(ring(wobp(ci[0] - .5, ci[1] - 1, 31, 30, .03, 9, 24), wobp(*ci, 21, 20, .04, 8, 20), ONION), p + "sh"))
    L.append(G(ring(wobp(ci[0], ci[1] - .5, 26.5, 25.5, .03, 10, 24), wobp(*ci, 21, 20, .04, 8, 20), ONION_W), p + "sh"))
    L.append(P(f"M{c - 44},{c - 8} Q{c - 38},{c - 34} {c - 12},{c - 44} Q{c - 30},{c - 34} {c - 40},{c - 6}Z", ONION_L, ' opacity="0.9"'))
    return doc(p, 140, 140, "".join(L), seed=31, sh=(3, 2.5, .33), cut={"rim": 2.4, "rough": 3.5})


# ================= CHEESE SHRED (80x44) =================
def cheese_shred():
    """Grated mozzarella / mild cheddar: soft pale strip ~16 thick, one gentle curl, soft ragged ends."""
    p = "cs-"
    r = random.Random(12)
    top, bot, mid = [], [], []
    N = 12
    for i in range(N + 1):
        t = i / N
        x = 14 + t * 52
        y = 22 + 4.2 * math.sin(t * math.pi - .1) - 2.1 + r.uniform(-.3, .3)
        w = 8 * min(1, 0.55 + 2.4 * min(t, 1 - t)) + r.uniform(-.4, .4)
        top.append((x + r.uniform(-.5, .5), y - w)); bot.append((x + r.uniform(-.5, .5), y + w)); mid.append((x, y))
    pts = top + [(67.5, mid[-1][1] - 2), (66, mid[-1][1] + .5), (68, mid[-1][1] + 3)] + bot[::-1] + [(12, mid[0][1] + 2.5), (14, mid[0][1]), (12.5, mid[0][1] - 2.5)]
    b = bbox(pts)
    check("cheese-shred", "shred", b, (12, None, 68, None), 2)
    check("cheese-shred", "centre y", ((b[1] + b[3]) / 2,) * 4, (22, 22, 22, 22), 2.5)
    body = P(smooth(pts), "#FFE27A")
    lo = P(smooth([(x, y + 2) for x, y in mid[1:-1]] + [(x, y + 7) for x, y in mid[-2:0:-1]]), "#F2C24A")
    hi = P(smooth([(x, y - 5) for x, y in mid[4:8]] + [(x, y - 3.2) for x, y in mid[7:3:-1]]), "#FFF4C8")
    return doc(p, 80, 44, G(body + lo + hi, p + "cut"), seed=33, sh=(2, 1.6, .28), cut={"rim": 1.4, "rough": 2, "freq": .25})


# ================= SAUCE BLOB (200x200) =================
def sauce_blob():
    """Nearly flat brush stamp: one gently wobbly blob in one red; overlapping stamps merge into one field."""
    p = "sb-"
    r = random.Random(8)
    SR = "#DC4A32"
    pts = polar(100, 100, lambda a: 68 + 2.6 * math.sin(a * 3 + .7) + 1.4 * math.sin(a * 5 + 2) + r.uniform(-.6, .6), 30)
    b = bbox(pts)
    check("sauce-blob", "blob", b, (100 - 70, 100 - 70, 100 + 70, 100 + 70), 5)
    check_r("sauce-blob", "blob", pts, (100, 100), 73)
    inner = polar(98, 97, lambda a: 46 + 2 * math.sin(a * 3 + 1.9), 24)
    L = [G(P(smooth(pts), SR), p + "cut"),
         G(P(smooth(inner), "#E2553C", ' opacity="0.6"'), p + "bl")]      # very soft, low-contrast lighter centre
    # torn edge in the same red (no cream rim, no drop shadow): the game uses the alpha as a paint brush
    return doc(p, 200, 200, "".join(L), seed=35, blur=10, cut={"op": 0, "rim": 1.6, "rough": 3, "rim_col": SR, "rim_op": 1})


# ================= DOUGH BALL (360x300) =================
def dough_ball():
    p = "db-"
    # soft dome: elliptical top (height 166) over a short rounded tuck to the base
    pts = [(180 + 124 * math.cos(t), 214 - 166 * math.sin(t)) for t in [i / 12 * math.pi for i in range(13)]]
    pts += [(180 + 124 * math.cos(t) * (1 - .06 * math.sin(t - math.pi)), 214 + 52 * math.sin(t - math.pi))
            for t in [math.pi + i / 8 * math.pi for i in range(1, 8)]]
    pts = pts[:-1] if pts[-1] == pts[0] else pts
    check("dough-ball", "lump", bbox(pts), (56, 48, 304, 266), 3)
    L = [ground_shadow(180, 272, 145, 14, p, .34)]
    # floury contact: soft white dust patch the dough sits on
    L.append(G(E(180, 268, 140, 12, WHITE, ' opacity="0.55"'), p + "bl"))
    L.append(G(P(smooth(pts), DOUGH), p + "cut"))
    L.append(f'<clipPath id="{p}c"><path d="{smooth(pts)}"/></clipPath>')
    shade = (E(190, 262, 150, 40, mix(DOUGH, DOUGH_D, .8), ' opacity="0.75"') + E(292, 190, 30, 80, mix(DOUGH, DOUGH_D, .7), ' opacity="0.6"'))
    L.append(G(G(shade, p + "bl"), None, f' clip-path="url(#{p}c)"'))                  # soft underside / side shade
    L.append(G(P(wob(146, 118, 70, 44, .05, 3, 18, -30), DOUGH_L, ' opacity="0.9"'), p + "bl"))  # soft top light
    L.append(P(wob(122, 104, 22, 12, .08, 4, 12, -34), "#FFF8E6", ' opacity="0.85"'))
    r = random.Random(6)
    fl = P(wob(196, 80, 38, 12, .15, 7, 14, 8), WHITE, ' opacity="0.5"')
    for i in range(14):
        a = r.uniform(-2.8, -.3); d = r.uniform(.2, .8)
        fl += C(180 + math.cos(a) * 110 * d, 150 + math.sin(a) * 90 * d, r.uniform(2.2, 4), WHITE, ' opacity="0.9"')
    for i in range(16):
        x = r.choice([r.uniform(36, 96), r.uniform(264, 326)]); y = r.uniform(258, 282)
        fl += C(x, y, r.uniform(2, 4.2), WHITE, ' opacity="0.9"')
    L.append(fl)
    return doc(p, 360, 300, "".join(L), material="smooth", seed=41, sh=(5, 4, .3), blur=7)


# ================= DOUGH FLAT (720x720) =================
def dough_flat():
    p = "df-"
    cx, cy = 360, 356
    outer = wobp(cx, cy, 334, 332, .008, 3, 44)
    check_r("dough-flat", "outer crust", outer, (cx, cy), 338)
    L = [G(P(smooth(outer), mix(DOUGH_D, CRUST_L, .25)), p + "cut")]
    L.append(P(wob(cx, cy, 300, 298, .01, 5, 40), mix(DOUGH, DOUGH_D, .35)))              # base below the rim step
    L.append(P(wob(cx - 4, cy - 6, 294, 292, .012, 6, 40), DOUGH))                         # flat centre (sauce area r~290)
    L.append(P(wob(cx - 40, cy - 46, 210, 196, .04, 7, 30), mix(DOUGH, DOUGH_L, .45), ' opacity="0.8"'))
    # raised crust rim: a ring layer on top, its soft shadow falls onto the flat centre
    rim_o = wobp(cx - 1, cy - 3, 328, 326, .008, 8, 44)
    rim_i = wobp(cx, cy, 296, 294, .01, 9, 40)
    L.append(G(ring(rim_o, rim_i, DOUGH), p + "sh2"))
    # lit top of the rim (upper left) and a shaded band (lower right)
    L.append(ring(wobp(cx - 3, cy - 5, 322, 320, .008, 10, 44), wobp(cx + 1, cy + 3, 306, 303, .01, 11, 40), DOUGH_L, ' opacity="0.9"'))
    L.append(ring(wobp(cx, cy, 329, 327, .008, 12, 44), wobp(cx - 8, cy - 10, 322, 320, .01, 13, 44), mix(DOUGH_D, CRUST_L, .2), ' opacity="0.75"'))
    # a few subtle flour dots / bubbles only
    r = random.Random(9)
    bb = ""
    for i in range(7):
        a = r.random() * 2 * math.pi; d = math.sqrt(r.random()) * 240
        x, y = cx + math.cos(a) * d, cy + math.sin(a) * d
        bb += E(x + 1, y + 3, 10, 6.5, DOUGH_D, ' opacity="0.55"') + E(x, y, 9, 5.5, DOUGH_L)
    for i in range(22):
        a = r.random() * 2 * math.pi; d = math.sqrt(r.random()) * 300
        bb += C(cx + math.cos(a) * d, cy + math.sin(a) * d, r.uniform(2.5, 4.5), WHITE, ' opacity="0.8"')
    L.append(bb)
    return doc(p, 720, 720, "".join(L), material="smooth", seed=43, sh=(5, 4, .3), sh2=(7, 7, .22))


# ================= ROLLING PIN (640x200) =================
def rolling_pin():
    p = "rp-"
    BAR = "#E4B07A"; BAR_L = "#F4CF9E"; BAR_D = "#C38A55"
    check("rolling-pin", "barrel", (125, 40, 515, 154), (125, 40, 515, 154), 0)
    check("rolling-pin", "handles", (20, 72, 620, 122), (20, 72, 620, 122), 0)
    L = [ground_shadow(320, 180, 260, 13, p, .36)]
    hd = ""
    for x0 in (20, 490):
        hd += P(wrect(x0, 72, 130, 50, 25, .8, x0), WALNUT)
    L.append(G(hd, p + "cut"))
    hl = ""
    for x0 in (20, 490):
        hl += P(wrect(x0 + 12, 78, 106, 12, 6, .5, x0 + 1), WALNUT_L, ' opacity="0.95"')
        hl += P(wrect(x0 + 10, 106, 110, 10, 5, .5, x0 + 2), WALNUT_D, ' opacity="0.8"')
    L.append(hl)
    # collars where the handle meets the barrel
    L.append(G(P(wrect(112, 66, 30, 62, 12, .6, 5), WALNUT_D) + P(wrect(498, 66, 30, 62, 12, .6, 6), WALNUT_D), p + "sh"))
    # barrel
    bar = P(wrect(125, 40, 390, 114, 44, 1.2, 7), BAR_D)
    L.append(G(bar, p + "cut"))
    L.append(P(wrect(128, 42, 384, 96, 42, 1, 8), BAR))
    L.append(P(wrect(162, 54, 316, 20, 10, .8, 9), BAR_L))
    L.append(P(wrect(150, 60, 70, 8, 4, .4, 10), WHITE, ' opacity="0.55"'))
    # soft wood grain slivers
    gr = ""
    for (x, y, w) in ((200, 102, 120), (350, 116, 110), (250, 90, 60), (420, 94, 50)):
        gr += P(f"M{x},{y} Q{x + w / 2},{y - 7} {x + w},{y + 1} Q{x + w / 2},{y - 3} {x},{y + 4}Z", BAR_D, ' opacity="0.8"')
    L.append(gr)
    return doc(p, 640, 200, "".join(L), material="rough", seed=45, sh=(4, 3.5, .33))


# ================= SAUCE BOWL (340x300) =================
def sauce_bowl():
    p = "sw-"
    body = "M24,122 C24,206 82,266 170,266 C258,266 316,206 316,122Z"
    check("sauce-bowl", "bowl", (24, 86, 316, 266), (24, None, 316, 266), 0)
    L = [ground_shadow(170, 278, 130, 13, p, .38)]
    L.append(G(P(wob(170, 256, 74, 14, .03, 3), TEAL_D), p + "sh"))                         # foot ring
    bowl = P(body, TEAL) + E(170, 122, 146, 36, TEAL)
    L.append(G(bowl, p + "cut"))
    # body shading + cream band with coral dots
    L.append(P("M40,182 C60,240 110,262 170,262 C230,262 280,240 300,182 C280,226 230,246 170,246 C110,246 60,226 40,182Z", TEAL_D, ' opacity="0.8"'))
    band = "M36,168 Q170,204 304,168 L296,194 Q170,232 44,194Z"
    L.append(G(P(band, CREAM), p + "sh"))
    L.append("".join(C(x, 181 + 18 * (1 - ((x - 170) / 130) ** 2), 5.5, CORAL) for x in range(62, 290, 30)))
    L.append(P("M44,142 Q50,196 92,226 Q62,190 58,146Z", TEAL_L, ' opacity="0.8"'))          # glaze highlight
    # rim, inner wall, sauce
    L.append(E(170, 122, 146, 36, TEAL_L))
    L.append(E(170, 124, 132, 28, TEAL_D))
    L.append(f'<clipPath id="{p}in"><ellipse cx="170" cy="124" rx="132" ry="28"/></clipPath>')
    sauce = E(170, 130, 128, 26, SAUCE) + E(158, 126, 88, 15, SAUCE_L) + P("M92,120 Q120,110 154,112 Q124,116 100,124Z", "#F59A7E", ' opacity="0.9"')
    sauce += P(wob(210, 132, 5, 2.6, .2, 7, 8, 20), HERB) + P(wob(120, 136, 4.5, 2.4, .2, 8, 8, -30), HERB)
    L.append(G(G(sauce, p + "sh"), None, f' clip-path="url(#{p}in)"'))
    # wooden spoon handle sticking up to the right
    spoon = P("M232,126 Q236,112 244,100 L292,14 Q300,2 310,8 Q318,14 312,24 L262,112 Q256,122 252,130Z", WOOD)
    spoon += P("M296,16 Q302,8 308,11 L262,96 Q258,100 256,96Z", WOOD_L, ' opacity="0.9"')
    L.append(G(spoon, p + "cut"))
    L.append(G(P(wob(242, 130, 18, 6, .1, 9, 12, -8), SAUCE), p + "sh"))                   # sauce hugging the handle
    return doc(p, 340, 300, "".join(L), material="default", seed=47, sh=(4, 3.5, .33))


# ================= CHEESE SHAKER (260x400) =================
def cheese_shaker():
    p = "ck-"
    jar = wrect(40, 140, 180, 230, 34, .8, 1, step=20)
    check("cheese-shaker", "jar", (40, 140, 220, 370), (40, 140, 220, 370), 0)
    check("cheese-shaker", "lid", (48, 50, 212, 146), (None, 50, None, 146), 2)
    GLASS = "#E4F1EE"; GLASS_D = "#C3DCD8"
    L = [ground_shadow(130, 382, 105, 12, p, .38)]
    L.append(G(P(jar, GLASS), p + "cut"))
    L.append(f'<clipPath id="{p}j"><path d="{wrect(46, 146, 168, 218, 30, .6, 2, step=20)}"/></clipPath>')
    # cheese inside: a heap with a wavy top, shreds layered on it
    r = random.Random(4)
    ch = P("M30,214 Q60,196 92,208 Q124,220 156,204 Q190,190 230,206 V380 H30Z", CHEESE_D)
    for i in range(34):
        x = r.uniform(44, 216); y = r.uniform(214, 366)
        a = r.uniform(-40, 40); L2 = r.uniform(26, 40)
        col = r.choice([CHEESE, CHEESE, CHEESE_L, CHEESE])
        ch += P(wob(x, y, L2 / 2, 5.5, .12, 100 + i, 12, a), col)
    for i in range(7):
        x = 50 + i * 26 + r.uniform(-6, 6); y = 207 + 6 * math.sin(i * 1.3) + r.uniform(-3, 3)
        ch += P(wob(x, y, 16, 5.5, .12, 200 + i, 12, r.uniform(-30, 30)), CHEESE_L)
    L.append(G(G(ch, p + "sh"), None, f' clip-path="url(#{p}j)"'))
    # glass: tinted bottom, edge band, highlights
    L.append(P(wrect(46, 330, 168, 34, 16, .6, 3), GLASS_D, ' opacity="0.45"'))
    L.append(P(wrect(58, 164, 20, 150, 10, .6, 4), WHITE, ' opacity="0.8"'))
    L.append(P(wrect(84, 170, 9, 80, 4.5, .4, 5), WHITE, ' opacity="0.6"'))
    L.append(P(wrect(194, 180, 10, 120, 5, .4, 6), WHITE, ' opacity="0.45"'))
    # neck ring
    L.append(G(P(wrect(56, 132, 148, 20, 8, .6, 7), GLASS_D), p + "sh"))
    # lid: screw band + dome with holes
    lid = P(wrect(48, 104, 164, 42, 16, .8, 8), CORAL_D)
    lid += P("M56,110 C58,64 94,50 130,50 C166,50 202,64 204,110Z", CORAL)
    L.append(G(lid, p + "cut"))
    L.append(P(wrect(54, 110, 152, 30, 12, .6, 9), CORAL))
    L.append("".join(P(wrect(x, 114, 7, 22, 3.5, .3, 10 + i), CORAL_D, ' opacity="0.8"') for i, x in enumerate(range(66, 196, 18))))
    L.append(P("M72,98 C76,72 98,60 122,58 C102,66 88,78 84,98Z", CORAL_L, ' opacity="0.95"'))
    holes = "".join(C(x, y, 6, "#6B2A18") for x, y in ((130, 68), (106, 80), (154, 80), (118, 94), (142, 94), (86, 96), (174, 96)))
    L.append(holes)
    return doc(p, 260, 400, "".join(L), material="default", seed=49, sh=(4, 3.5, .33))


# ================= TRAY / PIZZA BOARD (820x830) =================
def tray():
    p = "tr-"
    FACE = "#B27A48"; EDGE = "#8A5530"; GRAIN = "#A87244"; BEV = "#CC9A68"; DARK = "#96602F"
    c = (410, 408)
    edge = wobp(410, 413, 389, 389, .004, 400, 60)
    face = wobp(*c, 386, 386, .004, 401, 60)
    b = bbox(edge + face)
    check("tray", "board (excl. ~3 rim)", b, (410 - 390, 410 - 390, 410 + 390, 410 + 392), 4)
    grad = (f'<radialGradient id="{p}rg" cx="360" cy="360" r="400" gradientUnits="userSpaceOnUse">'
            f'<stop offset="0" stop-color="#D9A876" stop-opacity="0.55"/><stop offset="0.55" stop-color="#C08650" stop-opacity="0.18"/>'
            f'<stop offset="0.85" stop-color="{FACE}" stop-opacity="0"/><stop offset="1" stop-color="{EDGE}" stop-opacity="0.35"/></radialGradient>')
    L = [G(E(410, 422, 388, 392, SH, ' opacity="0.32"'), p + "bl")]
    L.append(G(P(smooth(edge), EDGE), p + "cut"))
    L.append(G(P(smooth(face), FACE), p + "sh"))
    L.append(P(smooth(face), f"url(#{p}rg)"))                                               # broad soft radial light
    # 3 very faint, smooth, near-circular grain lines
    gr = ""
    for i, rr in enumerate((268, 184, 96)):
        o = wobp(406, 406, rr + 1.6, rr * .985 + 1.6, .006, 410 + i, 40)
        inn = wobp(406, 406, rr - 1.6, rr * .985 - 1.6, .006, 410 + i, 40)
        gr += ring(o, inn, GRAIN, ' opacity="0.55"')
    L.append(gr)
    # lighter bevel ring just inside the edge, darker ring where the dough edge sits (r ~326-357)
    L.append(ring(wobp(*c, 382, 382, .004, 402, 60), wobp(*c, 366, 366, .004, 403, 60), BEV, ' opacity="0.8"'))
    L.append(ring(wobp(*c, 357, 357, .005, 404, 60), wobp(*c, 326, 326, .006, 405, 60), DARK, ' opacity="0.75"'))
    L.append(G(P("M96,318 Q150,146 330,76 Q200,160 128,330Z", "#E2B684", ' opacity="0.5"'), p + "bl"))
    L.append(P("M700,630 Q650,712 548,756 Q656,690 708,596Z", EDGE, ' opacity="0.3"'))
    r = random.Random(13); fl = ""
    for i in range(9):
        a = r.random() * 2 * math.pi; d = r.uniform(60, 360)
        fl += C(410 + math.cos(a) * d, 408 + math.sin(a) * d, r.uniform(2, 3.6), WHITE, ' opacity="0.7"')
    L.append(fl)
    return doc(p, 820, 830, "".join(L), material="rough", seed=51, sh=(5, 4, .3), blur=8, extra_defs=grad, paper={"fibre": .1, "tooth": .35, "mottle": .12})


# ================= PIZZA SLICE (300x300) =================
def qb(p0, c, p1, t):
    return ((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1])


def pizza_slice():
    p = "ps-"
    check("pizza-slice", "tip", (150, 284, 150, 284), (150, 284, 150, 284), 0)
    r = random.Random(17)
    CH = "#FFD65E"
    # sauce base = slice silhouette (thin red band shows along the cut edges and just inside the crust)
    body = "M150,284 Q147,280 144,272 L40,82 Q150,40 260,82 L156,272 Q153,280 150,284Z"
    drips = P("M84,158 Q76,166 78,182 Q80,192 86,190 Q90,184 90,170Z", CH) + P("M212,128 Q222,134 222,148 Q221,158 215,156 Q211,150 207,138Z", CH)
    L = [G(P(body, SAUCE) + drips, p + "cut")]
    # cheese: warm melted layer with an irregular edge
    cz = []
    a, b_, c = (150, 268), (53, 99), (247, 99)
    for i in range(12):
        t = i / 12
        cz.append((a[0] + (b_[0] - a[0]) * t + r.uniform(-1.8, 1.8), a[1] + (b_[1] - a[1]) * t))
    for i in range(12):
        cz.append(qb(b_, (150, 62), c, i / 12))
    for i in range(12):
        t = i / 12
        cz.append((c[0] + (a[0] - c[0]) * t + r.uniform(-1.8, 1.8), c[1] + (a[1] - c[1]) * t))
    L.append(G(P(smooth(cz), CH), p + "sh"))
    L.append(P(smooth([(150 + (x - 150) * .9, 180 + (y - 180) * .9 - 4) for x, y in cz]), mix(CH, CHEESE_D, .35), ' opacity="0.35"'))
    blobs = "".join(P(wob(x, y, rx, ry, .15, 30 + i, 12, rot), CHEESE_L) for i, (x, y, rx, ry, rot) in enumerate(
        ((150, 96, 30, 9, -4), (96, 112, 12, 7, 30), (205, 180, 10, 6, -60), (150, 238, 9, 5, 0), (120, 222, 8, 5, 40))))
    L.append(blobs)
    # toppings from our set, bigger
    tc = (108, 134)
    tom = C(*tc, 23, mix(RED_D, "#7A2016", .28)) + C(tc[0] - .5, tc[1] - 1, 20, RED) + C(*tc, 15.5, RED_L)
    tom += "".join(P(wob(tc[0] + math.cos(a_) * 8.5, tc[1] + math.sin(a_) * 8.5, 7, 4.8, .1, 5 + i, 10, math.degrees(a_)), SEEDPOCK) for i, a_ in enumerate((-1.3, .8, 2.9)))
    L.append(G(tom, p + "sh"))
    # mushroom slice (same silhouette as topping-mushroom), ~38 wide
    s = 38 / 136
    M = lambda d: scale_path(d, s, s, 12, 16, 168, 106)
    mush = P(M(MUSH_SIL), MUSH) + P(M("M12,84 C10,40 44,16 80,16 C116,16 150,40 148,84 C148,90 144,94 138,94 C134,54 110,34 80,34 C50,34 26,54 22,94 C16,94 12,90 12,84Z"), MUSH_CAP)
    mush += P(M("M24,93 C30,78 56,72 80,72 C104,72 130,78 136,93 C132,99 126,100 120,100 L40,100 C34,100 28,99 24,93Z"), "#B98552")
    L.append(G(mush, p + "sh"))
    oli = P(wob(172, 186, 15, 14, .03, 6) + " " + wob(172, 186.5, 4.5, 4.3, .05, 7, 12), OLIVE_D, ' fill-rule="evenodd"')
    oli += P(wob(171.5, 185.5, 12.5, 11.5, .03, 8) + " " + wob(172, 186.5, 6, 5.6, .05, 9, 12), OLIVE, ' fill-rule="evenodd"')
    oli += P("M161,183 Q164,175 172,174 Q166,178 164,185Z", OLIVE_S)
    L.append(G(oli, p + "sh"))
    # green pepper piece: an arc of the ring
    pc, a0, a1 = (124, 192), math.radians(200), math.radians(350)
    arc = lambda rr, k=10: [(pc[0] + math.cos(a0 + (a1 - a0) * i / k) * rr, pc[1] + 6 + math.sin(a0 + (a1 - a0) * i / k) * rr) for i in range(k + 1)]
    pep = P(smooth(arc(20) + arc(10)[::-1]), PEPPER_D) + P(smooth(arc(18) + arc(10.5)[::-1]), PEPPER) + P(smooth(arc(14) + arc(10.5)[::-1]), PEPPER_L)
    L.append(G(pep, p + "sh"))
    # bumpy golden crust band on top
    P0, Cc, P1 = (30, 64), (150, -2), (270, 64)
    top = []
    for i in range(41):
        t = i / 40
        x, y = qb(P0, Cc, P1, t)
        top.append((x, y - 3.2 * abs(math.sin(t * math.pi * 7))))
    bot = [qb((264, 96), (150, 46), (36, 96), i / 16) for i in range(17)]
    crust = top + [(272, 78)] + bot + [(28, 78)]
    check("pizza-slice", "crust", bbox(crust), (30, 30, 270, 96), 3)
    L.append(G(P(smooth(crust), CRUST_D), p + "cut"))
    inner = [(x, y + 4) for x, y in top[1:-1]] + [(x, y - 5) for x, y in bot[1:-1]]
    L.append(P(smooth(inner), CRUST))
    hl = [(x, y + 7) for x, y in top[5:-5]] + [(x, y + 15) for x, y in top[-6:4:-1]]
    L.append(P(smooth(hl), CRUST_L))
    L.append("".join(P(wob(x, qb(P0, Cc, P1, (x - 30) / 240)[1] + 22 + r.uniform(-3, 5), r.uniform(6, 10), r.uniform(3.5, 5), .2, 20 + i, 10, (x - 150) * .3), CRUST_D, ' opacity="0.7"')
                     for i, x in enumerate(range(60, 250, 27))))
    return doc(p, 300, 300, "".join(L), seed=53, sh=(4, 3.5, .33))


# ================= TOPPING BIN (240x240) =================
def topping_bin():
    p = "tb-"
    FLOOR = mix(TEAL_L, CREAM, .72); FLOOR_D = mix(TEAL_L, CREAM, .45)
    check("topping-bin", "floor (w>=170,h>=150)", (28, 40, 212, 198), (28, 40, 212, 198), 0)
    check("topping-bin", "all inside 240 (shadow ~y236)", (6, 12, 234, 236), (None, None, None, None), 0)
    L = [G(E(120, 224, 106, 9, SH, ' opacity="0.42"'), p + "bl")]
    L.append(G(P(wrect(8, 20, 224, 206, 42, 1, 1), TEAL_D), p + "cut"))                  # front lip / body
    L.append(P(wrect(8, 12, 224, 202, 42, 1, 2), TEAL))                                   # rim top
    L.append(P(wrect(18, 16, 204, 16, 8, .6, 3), TEAL_L, ' opacity="0.85"'))              # light on back rim
    L.append(P(wrect(24, 28, 192, 174, 30, .8, 4), mix(TEAL_D, TEAL, .35)))              # inner back wall (depth)
    L.append(G(P(wrect(28, 40, 184, 158, 26, .8, 5), FLOOR), p + "sh"))                   # floor
    L.append(P(wrect(34, 170, 172, 24, 14, .6, 6), FLOOR_D, ' opacity="0.5"'))
    # enamel speckles on the rim
    r = random.Random(5); sp = ""
    for i in range(30):
        side = r.randint(0, 3); t = r.random()
        if side == 0: x, y = 30 + t * 180, r.uniform(16, 26)
        elif side == 1: x, y = 30 + t * 180, r.uniform(204, 210)
        elif side == 2: x, y = r.uniform(12, 22), 44 + t * 150
        else: x, y = r.uniform(218, 228), 44 + t * 150
        sp += C(x, y, r.uniform(1.4, 2.4), CREAM, ' opacity="0.85"')
    L.append(sp)
    L.append(P("M40,214 Q120,220 200,214 L200,219 Q120,225 40,219Z", TEAL_L, ' opacity="0.7"'))   # front lip shine
    return doc(p, 240, 240, "".join(L), material="rough", seed=55, sh=(4, 3.5, .3))


ITEMS = {
    "dough-ball": dough_ball, "dough-flat": dough_flat, "rolling-pin": rolling_pin, "sauce-bowl": sauce_bowl,
    "sauce-blob": sauce_blob, "cheese-shaker": cheese_shaker, "cheese-shred": cheese_shred,
    "topping-tomato": topping_tomato, "topping-olive": topping_olive, "topping-mushroom": topping_mushroom,
    "topping-corn": topping_corn, "topping-pepper": topping_pepper, "topping-onion": topping_onion,
    "tray": tray, "pizza-slice": pizza_slice, "topping-bin": topping_bin,
}

if __name__ == "__main__":
    bad = 0
    for name, fn in ITEMS.items():
        s = fn()
        assert "<text" not in s and "<image" not in s and "<script" not in s
        path, size = write(name, s)
        print(f"{name:18s} {size / 1024:6.1f} KB" + ("  OVER BUDGET" if size > 60 * 1024 else ""))
        bad += size > 60 * 1024
    shutil.copyfile(os.path.join(OUT, "tray.svg"), os.path.join(OUT, "pizza-board.svg"))
    print(f"{'pizza-board':18s} (byte copy of tray)")
    print("\ngeometry checks:")
    for name, rows in BOXES.items():
        for label, box, exp, ok in rows:
            print(f"  {'OK ' if ok else 'BAD'} {name:16s} {label:28s} {box} vs {exp}")
            bad += not ok
    print("\nALL OK" if not bad else f"\n{bad} PROBLEM(S)")
