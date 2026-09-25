# images-b-soup, part A: the two new cutting vegetables (veg-potato-*, veg-zucchini-*) and the peeling art
# (peel-skin-carrot, peel-skin-potato, peeler, peel-strip).
# Run: python tools/gen_soup_a.py [names...] [--profiles]     (writes into images-b-soup/ only)
#
# The whole vegetables follow the images-b-prep vegetable spec exactly: drawn in the 560x420 grid, published at 672x504 (x1.2) by
# gen_prep_b.veg_doc (same ground shadow, same scale); the slices are the 140x140 piece drawings at 240/140 (gen_prep_b.slice_from_topping);
# the cut-face strips are 60 wide and as tall as the body, and their profiles are measured from the same outlines (gen_prep_e).
# The two peel skins use overlay_doc: the same frame and scale but no ground shadow, and the same outline points as the vegetable
# under them, so they register pixel-exactly (peel-skin-carrot on images-b-salad/veg-carrot-whole, peel-skin-potato on veg-potato-whole).
import math, random, sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from soupkit import *  # noqa: F401,F403

K = VEG_K
BOXES = []


def check_r(name, pts, c, rmax):
    r = max(math.hypot(x - c[0], y - c[1]) for x, y in pts)
    BOXES.append((name, f"max r {r:.1f}", rmax, r <= rmax))


def pdoc(p, body, seed):
    """The 140x140 piece frame (centre (70,70), silhouette r <= 58), exactly like the images-b toppings."""
    return gen_items.doc(p, STAMP, STAMP, body, seed=seed, sh=(3, 2.5, .33), cut={"rim": 2.4, "rough": 3.5})


# ================= PIECES (140x140; they become the -slice files at 240/140) =================
def piece_potato():
    """A round slice of peeled potato: pale waxy flesh, a faint ring pattern, no dark skin (it has been peeled)."""
    p = "qp-"
    c = 70
    rim = gen_items.wobp(c, c + 1, 53, 52, .025, 3, 26)
    check_r("piece-potato", rim, (70, 70), 58)
    L = [G(P(smooth(rim), POT_F_D), p + "cut")]
    L.append(G(P(wob(c - .5, c - 1, 48, 47, .025, 4, 26), POT_F), p + "sh"))
    L.append(P(smooth(gen_items.polar(c, c, lambda a: 34 + 2.5 * math.cos(3 * a + .4), 30)), mix(POT_F, POT_F_L, .7)))
    L.append(P(smooth(gen_items.polar(c, c, lambda a: 19 + 2 * math.cos(4 * a + 1.1), 24)), POT_F_L))
    for rr, op in ((42, .45), (28, .35)):                                              # faint starch rings
        L.append(gen_items.ring(gen_items.wobp(c, c, rr, rr - .6, .02, 9 + rr, 26), gen_items.wobp(c, c, rr - 3, rr - 3.6, .02, 9 + rr, 26), POT_F_D, f' opacity="{op}"'))
    L.append(P("M38,60 Q44,38 66,32 Q50,44 44,62Z", "#FFFBEA", ' opacity="0.9"'))
    return pdoc(p, "".join(L), 601)


def piece_zucchini():
    """A round of zucchini: dark green skin ring, very pale flesh, a small seed star."""
    p = "qz-"
    c = 70
    skin = gen_items.wobp(c, c + 1, 54, 53, .02, 5, 28)
    check_r("piece-zucchini", skin, (70, 70), 58)
    L = [G(P(smooth(skin), ZUC_D), p + "cut")]
    L.append(P(wob(c - .5, c - .5, 49.5, 48.5, .02, 6, 26), ZUC))
    L.append(G(P(wob(c, c, 43, 42, .02, 7, 26), ZUC_F), p + "sh"))                      # pale flesh
    L.append(P(smooth(gen_items.polar(c, c + 1, lambda a: 22 + 3.5 * math.cos(3 * a + .9), 34)), ZUC_F2))
    sd = ""
    for i in range(3):
        a = i / 3 * 2 * math.pi + .9
        for off in (-.3, .3):
            x, y = c + math.cos(a + off) * 13, c + 1 + math.sin(a + off) * 13
            sd += E(x, y, 3, 5.2, ZUC_SEED, f' transform="rotate({n(math.degrees(a + off) + 90)} {n(x)} {n(y)})"')
    L.append(G(sd, p + "sh"))
    L.append(P(wob(c, c + 1, 4.5, 4.5, .1, 8, 10), "#FFFDF0"))
    L.append(P("M38,58 Q44,36 66,30 Q48,42 44,60Z", WHITE, ' opacity="0.7"'))
    return pdoc(p, "".join(L), 603)


# ================= POTATO (the peeled potato: a lumpy oval lying on the board) =================
PC, PRX, PRY = (280, 282), 205, 96          # centre / radii in the 560x420 drawing grid (body bottom ~388, like the other vegetables)


def potato_pts(k=32):
    """Lumpy oval, fatter on the left, a little narrower at the right end (a real potato is never an ellipse)."""
    pts = []
    for i in range(k):
        a = i / k * 2 * math.pi
        f = 1 + .06 * math.sin(2 * a + .6) + .035 * math.sin(3 * a + 2.1) + .02 * math.sin(5 * a + .3)
        pts.append((PC[0] + math.cos(a) * PRX * f, PC[1] + math.sin(a) * PRY * f))
    return pts


def pot_mid(x):
    return PC[1]


def veg_potato_whole():
    """Review fix 1: the first version was a flat pale blob that read as a spilled puddle. It now has a firm darker edge,
    a shaded underside, a broad top light and deeper dents, so it reads as one solid, heavy potato."""
    p = "vpo-"
    pts = potato_pts()
    L = [G(P(smooth(pts), mix(POT_F_D, "#A98649", .45)), p + "cut")]                      # the cut-paper edge: clearly darker
    L.append(P(smooth([(x - 2, y - 9) for x, y in pts]), POT_F_D))
    L.append(P(smooth([(x - 3, y - 20 if y > PC[1] else y - 13) for x, y in pts]), POT_F))
    L.append(P(wob(PC[0] - 34, PC[1] - 36, 146, 52, .05, 11, 20, -8), POT_F_L, ' opacity="0.9"'))    # broad top light
    L.append(P(f"M{PC[0] - 176},{PC[1] + 36} Q{PC[0] - 40},{PC[1] + 118} {PC[0] + 172},{PC[1] + 26} "
               f"Q{PC[0] - 40},{PC[1] + 92} {PC[0] - 176},{PC[1] + 36}Z", mix(POT_F_D, SH, .3), ' opacity="0.55"'))   # underside shade
    r = random.Random(23)
    dents = ""
    for (dx, dy, rx, ry, rot) in ((-110, 22, 34, 15, 12), (54, 42, 30, 13, -8), (128, -18, 24, 11, 20), (-30, -48, 26, 10, -14)):
        x, y = PC[0] + dx, PC[1] + dy
        dents += P(wob(x, y + 4, rx, ry, .12, r.randint(0, 999), 12, rot), mix(POT_F_D, "#A98649", .5), ' opacity="0.7"')
        dents += P(wob(x, y, rx * .8, ry * .7, .12, r.randint(0, 999), 12, rot), mix(POT_F, POT_F_L, .5), ' opacity="0.9"')
    L.append(dents)                                                                       # shallow dents where the eyes were cut out
    L.append(P(wob(PC[0] - 78, PC[1] - 54, 58, 17, .1, 5, 12, -12), "#FFFCEE", ' opacity="0.95"'))
    return PB.veg_doc(p, "".join(L), 611)


# ================= ZUCCHINI (fatter and darker than the salad cucumber, a cut stem on the right) =================
ZX0, ZX1, ZYC, ZH = 40, 520, 310, 86


def zuc_h(t):
    return ZH * (1 - abs(2 * t - 1) ** 3.2) ** (1 / 3.0) * (.90 + .10 * t)


def zuc_pts(N=28):
    top, bot = [], []
    for i in range(N + 1):
        t = i / N
        x = ZX0 + t * (ZX1 - ZX0)
        h = zuc_h(t)
        yc = ZYC - 5 * math.sin(math.pi * t)
        top.append((x, yc - h)); bot.append((x, yc + h))
    return top + bot[::-1][1:-1]


def veg_zucchini_whole():
    p = "vzu-"
    pts = zuc_pts()
    L = [G(P(smooth(pts), ZUC_D) + P(wob(528, 306, 18, 22, .06, 3, 14), mix(ZUC_D, "#6A5A24", .45)), p + "cut")]   # skin + cut stem
    L.append(P(smooth([(x - 1, y - 7 if y < ZYC else y - 3) for x, y in pts]), ZUC))
    for dy, w, op in ((-52, 8, .5), (-18, 9, .42), (22, 8, .36)):                        # pale lengthwise flecked stripes
        lens = [(x, ZYC + dy - w * math.sin(math.pi * (x - 66) / 424)) for x in range(66, 491, 30)]
        lens += [(x, ZYC + dy + w * math.sin(math.pi * (x - 66) / 424)) for x in range(490, 65, -30)]
        L.append(P(smooth(lens), ZUC_L, f' opacity="{op}"'))
    r = random.Random(13)
    fl = ""
    for i in range(46):                                                                   # the speckles that make a zucchini a zucchini
        t = r.uniform(.07, .94)
        x = ZX0 + t * (ZX1 - ZX0)
        h = zuc_h(t) * .8
        y = ZYC + r.uniform(-h, h * .82)
        rr = r.uniform(2.6, 5.4)
        fl += E(x, y, rr, rr * .74, "#B7D98C", ' opacity="0.75"')
    L.append(fl)
    L.append(P("M92,258 Q262,224 452,246 Q272,242 100,272Z", "#C7E79B", ' opacity="0.8"'))     # gloss
    L.append(P(wob(46, 308, 9, 12, .1, 9, 10), mix(ZUC_L, "#E6E28C", .5), ' opacity="0.9"'))    # blossom end
    return PB.veg_doc(p, "".join(L), 613)


# ---------------- measured profiles + cut-face strips ----------------
OUTLINES = {"potato": lambda: [smooth(potato_pts())], "zucchini": lambda: [smooth(zuc_pts())]}
SPAN_GRID = {"potato": (min(x for x, _ in potato_pts()), max(x for x, _ in potato_pts())),   # the body's real x range
             "zucchini": (ZX0, ZX1)}                                                        # the cut stem nub (x 528) is right of the span
VEG_SPAN = {k: (round(a * K), round(b * K)) for k, (a, b) in SPAN_GRID.items()}


def profile(veg, step=24):
    polys = [pp for d in OUTLINES[veg]() for pp in PE.sample_path(d)]
    x0, x1 = VEG_SPAN[veg]
    out, x = [], x0 + 4
    while x <= x1 - 4:
        c = PE.column(polys, x / K)
        if c:
            out.append([round(x), round(c[0] * K, 1), round(c[1] * K, 1)])
        x += step
    return out


def strip_height(veg):
    return math.ceil(max(b - t for _, t, b in profile(veg, 4)))


def potato_inside():
    p = "poi-"; H = strip_height("potato"); c = H / 2
    L = [G(P(PE.lens(30, c, 27, c - 1), POT_F_D), p + "cut")]
    L.append(P(PE.lens(30, c, 24, c - 5), POT_F))
    L.append(P(PE.lens(30, c, 19, c * .66), mix(POT_F, POT_F_L, .55)))
    L.append(P(PE.lens(30, c, 12, c * .38), POT_F_L))
    L.append(P(PE.lens(23, c - c * .3, 3, c * .3), "#FFFCEE", ' opacity="0.85"'))
    return PE.strip_doc(p, H, "".join(L), 621)


def zucchini_inside():
    p = "zui-"; H = strip_height("zucchini"); c = H / 2
    L = [G(P(PE.lens(30, c, 27, c - 1), ZUC_D), p + "cut")]
    L.append(P(PE.lens(30, c, 24, c - 4), ZUC))
    L.append(P(PE.lens(30, c, 21, c - 10), ZUC_F))
    L.append(P(PE.lens(30, c, 12, c * .52), ZUC_F2))
    sd = "".join(E(30 + (3 if i % 2 else -3), c + f * c, 3, 5, ZUC_SEED) for i, f in enumerate((-.32, -.1, .12, .34)))
    L.append(G(sd, p + "sh"))
    L.append(P(PE.lens(23, c - c * .3, 3, c * .3), WHITE, ' opacity="0.5"'))
    return PE.strip_doc(p, H, "".join(L), 623)


# ================= PEEL SKINS (overlays that register pixel-exactly on the whole vegetable) =================
def peel_skin_carrot():
    """The carrot's skin: exactly the outline images-b-salad/veg-carrot-whole draws (gen_salad_a.carrot_pts),
    duller and browner than the body under it, with the seams of five peeler passes."""
    p = "pkc-"
    pts = SA.carrot_pts()
    L = [G(P(smooth(pts, .14), CPK_D), p + "cut")]
    L.append(P(smooth([(x - 1, y - 5 if y < SA.car_mid(x) else y - 3) for x, y in pts], .14), CPK))
    xs = list(range(SA.CAR_TIP + 12, SA.CAR_SH + 1, 26))
    seams = ""
    for f in (.2, .4, .6, .8):                                                             # the seams of the peeler passes
        line = [(x, SA.car_bot(x) - 2 * SA.carrot_h(x) * (1 - f) + 2.5 * math.sin(x / 42 + f * 7)) for x in xs]
        seams += stroke(smooth_open(line), CPK_D, 3.4, ' opacity="0.5"')
    L.append(seams)
    r = random.Random(31)
    sp = ""
    for i in range(34):                                                                    # earth specks and little rootlet dots
        x = r.uniform(SA.CAR_TIP + 20, SA.CAR_SH - 8)
        h = SA.carrot_h(x)
        y = r.uniform(SA.car_bot(x) - 2 * h + h * .3, SA.car_bot(x) - h * .15)
        sp += E(x, y, r.uniform(2.4, 4.6), r.uniform(1.8, 3.4), CPK_D, ' opacity="0.6"')
    for x in range(120, 430, 62):
        h = SA.carrot_h(x)
        sp += stroke(f"M{x},{n(SA.car_bot(x) - 2 * h + 8)} q6,{n(h * .5)} -2,{n(h * .95)}", CPK_D, 2.4, ' opacity="0.45"')
    L.append(sp)
    hl = [(x, SA.car_bot(x) - 2 * SA.carrot_h(x) + 9 + SA.carrot_h(x) * .12) for x in range(70, 440, 30)]
    hl += [(x, SA.car_bot(x) - 2 * SA.carrot_h(x) + 9 + SA.carrot_h(x) * .34) for x in range(430, 69, -30)]
    L.append(P(smooth(hl), CPK_L, ' opacity="0.55"'))
    L.append(P(smooth(pts, .14), "#6B5440", ' opacity="0.14"'))          # a dusty film: unwashed skin against the clean carrot
    return overlay_doc(p, "".join(L), 631)


def peel_skin_potato():
    """The potato's brown skin: exactly the outline veg-potato-whole draws, with eyes and earth."""
    p = "pkp-"
    pts = potato_pts()
    L = [G(P(smooth(pts), PSK_D), p + "cut")]
    L.append(P(smooth([(x - 2, y - 7) for x, y in pts]), PSK))
    L.append(P(wob(PC[0] - 40, PC[1] - 34, 132, 52, .05, 11, 20, -8), PSK_L, ' opacity="0.8"'))
    seams = ""
    for f in (.26, .5, .74):                                                               # peeler-pass seams, following the belly
        line = [(PC[0] + u * PRX * .96,
                 PC[1] - PRY * .96 * math.sqrt(max(0, 1 - u * u)) + 2 * PRY * .96 * math.sqrt(max(0, 1 - u * u)) * f + 3 * math.sin(u * 5))
                for u in [i / 16 * 1.92 - .96 for i in range(17)]]
        seams += stroke(smooth_open(line), PSK_D, 3.6, ' opacity="0.45"')
    L.append(seams)
    r = random.Random(37)
    eyes = ""
    for (dx, dy, rr) in ((-118, 16, 9), (46, 38, 8), (126, -22, 7), (-26, -50, 7.5), (-70, 54, 6.5), (108, 44, 6)):
        x, y = PC[0] + dx, PC[1] + dy
        eyes += E(x, y + 2, rr * 1.5, rr * .9, PSK_D, ' opacity="0.7"')
        eyes += E(x, y, rr * .8, rr * .55, PSK_EYE)
        eyes += E(x - rr * .2, y - rr * .2, rr * .3, rr * .2, PSK_L, ' opacity="0.6"')
    L.append(G(eyes, p + "sh"))                                                            # the eyes
    sp = ""
    for i in range(40):
        a, rr = r.uniform(0, 6.283), math.sqrt(r.random()) * .9
        x, y = PC[0] + math.cos(a) * PRX * rr, PC[1] + math.sin(a) * PRY * rr
        sp += E(x, y, r.uniform(2.2, 4.4), r.uniform(1.6, 3.2), PSK_D, ' opacity="0.5"')
    L.append(sp)
    L.append(P(wob(PC[0] - 78, PC[1] - 52, 56, 16, .1, 5, 12, -12), "#E2C29A", ' opacity="0.75"'))
    return overlay_doc(p, "".join(L), 633)


# ================= PEELER (420x460 Y-peeler; grip (210,92), blade line x 126..294 at y 358) =================
def peeler():
    """Review fix 3: the first version read as a handbag (fat arms, a thin grey slot). The arms are now thin steel wire,
    the handle a short fat grip and the blade a chunky cradle with a dark slot and a bright sharpened edge."""
    p = "plr-"
    gx, gy = PEELER_GRIP
    bx0, bx1, by = PEELER_BLADE
    L = [G(E(gx, 442, 132, 15, SH, ' opacity="0.3"'), p + "bl")]
    # the two arms: thin steel wire, so the tool reads as a Y-peeler and not as a bag handle
    arms = ""
    for sgn in (-1, 1):
        d = (f"M{n(gx + sgn * 56)},{n(gy + 40)} C{n(gx + sgn * 104)},{n(gy + 104)} {n(gx + sgn * 118)},{n(by - 130)} "
             f"{n(gx + sgn * 112)},{n(by - 26)}")
        arms += stroke(d, STEEL_D, 21) + stroke(d, STEEL, 13) + stroke(d, STEEL_L, 4, ' opacity="0.85"')
    L.append(G(arms, p + "cut"))
    # the handle: a short fat grip with finger ridges and a hanging hole
    L.append(G(P(wrect(gx - 116, gy - 54, 232, 104, 50, 1.2, 3, 22), TEAL_D), p + "cut"))
    L.append(P(wrect(gx - 110, gy - 49, 220, 92, 45, 1, 4, 22), TEAL))
    L.append(P(wrect(gx - 88, gy - 40, 176, 28, 14, .7, 5, 20), TEAL_L, ' opacity="0.7"'))
    L.append("".join(P(wrect(gx - 62 + i * 34, gy - 4, 20, 36, 10, .5, 6 + i), CORAL, ' opacity="0.9"') for i in range(4)))
    L.append(C(gx - 92, gy - 2, 15, mix(TEAL_D, SH, .3)) + C(gx - 92, gy - 2, 10, HOB_L))          # hanging hole
    # the blade cradle: a chunky chrome bar with a dark slot and the sharpened edge under it
    L.append(G(P(wrect(bx0 - 32, by - 46, (bx1 - bx0) + 64, 86, 28, .8, 9, 20), STEEL_D), p + "cut"))
    L.append(P(wrect(bx0 - 26, by - 41, (bx1 - bx0) + 52, 72, 24, .7, 10, 20), STEEL))
    L.append(P(wrect(bx0 - 20, by - 36, (bx1 - bx0) + 40, 22, 10, .5, 14, 18), STEEL_L, ' opacity="0.8"'))
    L.append(P(wrect(bx0 - 8, by - 24, (bx1 - bx0) + 16, 20, 9, .4, 11, 18), mix(STEEL_D, SH, .55)))      # the slot the peel goes through
    L.append(P(wrect(bx0, by - 6, bx1 - bx0, 15, 6, .3, 12, 18), STEEL_L))                                 # the blade
    L.append(P(f"M{n(bx0)},{n(by + 2)} L{n(bx1)},{n(by + 2)}", "none", f' stroke="{WHITE}" stroke-width="5" opacity="0.95"'))   # the cutting edge
    L.append(C(bx0 - 19, by - 10, 9, STEEL_D) + C(bx0 - 19, by - 12, 5.5, STEEL_L)
             + C(bx1 + 19, by - 10, 9, STEEL_D) + C(bx1 + 19, by - 12, 5.5, STEEL_L))                      # the two swivel pins
    return doc(p, PEELER[0], PEELER[1], "".join(L), material="smooth", seed=641, sh=(4, 3.5, .33), blur=8)


# ================= PEEL STRIP (280x240: one curled strip that flies off sideways) =================
def peel_strip():
    """A ribbon of peel: a long straight tail that curls up at one end. The outer face is the warm tan of a skin, the
    inner face the pale flesh side. Tan-orange works for both the carrot and the potato; the game may tint it per vegetable.
    Review fix 4: the first version was a fat two-turn spiral that read as a pastry curl."""
    p = "pst-"
    OUT_, IN_, OUT_D = "#CB7126", "#F3E6C0", "#94501A"
    # centre line: straight and thin at the left, then one open curl at the right
    pts = []
    for i in range(44):
        t = i / 43
        if t < .45:                                                                        # the trailing tail
            pts.append((24 + t / .45 * 128, 168 - t / .45 * 26 + 6 * math.sin(t * 9)))
        else:
            a = -2.4 + (t - .45) / .55 * 4.0                                               # one open turn (not a closed loop)
            rr = 66 - 22 * (t - .45) / .55
            pts.append((198 + math.cos(a) * rr, 104 + math.sin(a) * rr * .96))
    wth = lambda t: 46 - 20 * t                                                       # review fix 4b: a wide ribbon, not a thin outline
    up, dn = [], []
    for i, (x, y) in enumerate(pts):
        t = i / (len(pts) - 1)
        x2, y2 = pts[min(i + 1, len(pts) - 1)]
        x0, y0 = pts[max(i - 1, 0)]
        dx, dy = x2 - x0, y2 - y0
        L_ = max(1e-3, math.hypot(dx, dy))
        nx, ny = -dy / L_, dx / L_
        up.append((x + nx * wth(t) / 2, y + ny * wth(t) / 2))
        dn.append((x - nx * wth(t) / 2, y - ny * wth(t) / 2))
    band = smooth_open(up) + " " + smooth_open(dn[::-1]).replace("M", "L", 1) + "Z"
    L = [G(P(band, OUT_D), p + "cut")]
    L.append(P(band, OUT_))
    inner = smooth_open([(x + (u - x) * .52, y + (v - y) * .52) for (x, y), (u, v) in zip(pts, dn)])
    L.append(stroke(inner, IN_, 11, ' opacity="0.95"'))                                     # the pale flesh side of the curl
    L.append(stroke(smooth_open(pts[:20]), mix(OUT_, "#E0A45E", .6), 5, ' opacity="0.55"'))
    r = random.Random(43)
    L.append("".join(E(x, y, r.uniform(1.8, 3.2), r.uniform(1.2, 2.2), OUT_D, ' opacity="0.45"')
                     for x, y in [pts[i] for i in range(3, 42, 5)]))
    return doc(p, PEEL_STRIP[0], PEEL_STRIP[1], "".join(L), material="smooth", seed=643, sh=(3, 3, .3), blur=5,
               cut={"rim": 2.2, "rough": 3})


ITEMS = {"veg-potato-whole": veg_potato_whole,
         "veg-potato-slice": lambda: PB.slice_from_topping(piece_potato, "qp-", "vpos-"),
         "veg-potato-inside": potato_inside,
         "veg-zucchini-whole": veg_zucchini_whole,
         "veg-zucchini-slice": lambda: PB.slice_from_topping(piece_zucchini, "qz-", "vzus-"),
         "veg-zucchini-inside": zucchini_inside,
         "peel-skin-carrot": peel_skin_carrot, "peel-skin-potato": peel_skin_potato,
         "peeler": peeler, "peel-strip": peel_strip}

if __name__ == "__main__":
    run(ITEMS)
    for row in BOXES:
        print("  geometry", "OK " if row[3] else "BAD", *row[:3])
    if "--profiles" in sys.argv:
        print(json.dumps({v: {"span": VEG_SPAN[v], "stripH": strip_height(v), "profile": profile(v)} for v in VEG_SPAN},
                         separators=(",", ":")))
