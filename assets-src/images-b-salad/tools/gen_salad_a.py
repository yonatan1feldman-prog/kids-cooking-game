# images-b-salad, part A: bowl pieces (piece-*), new cutting vegetables (veg-cucumber-*, veg-carrot-*).
# Run: python tools/gen_salad_a.py [names...] [--profiles]   (writes into images-b-salad/ only)
# The whole vegetables follow the images-b-prep spec exactly: drawn in the 560x420 grid, published at 672x504 (x1.2) by
# gen_prep_b.veg_doc (same ground shadow, same scale); the slices are the piece drawings at 240/140 (gen_prep_b.slice_from_topping);
# the cut-face strips are 60 wide and as tall as the body, and their profiles are measured from the same outlines (gen_prep_e).
import math, random, sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from saladkit import *  # noqa: F401,F403

K = PB.VEG_K
BOXES = []


def check_r(name, pts, c, rmax):
    r = max(math.hypot(x - c[0], y - c[1]) for x, y in pts)
    BOXES.append((name, f"max r {r:.1f}", rmax, r <= rmax))


def pdoc(p, body, seed):
    """Same frame and filters as the images-b toppings (140x140, centre 70,70, r <= 58)."""
    return gen_items.doc(p, 140, 140, body, seed=seed, sh=(3, 2.5, .33), cut={"rim": 2.4, "rough": 3.5})


# ================= PIECES (top-down, in the bowl; same size as topping-*) =================
def piece_cucumber():
    p = "pc-"
    c = 70
    skin = wobp(c, c + 1, 55, 54, .018, 3, 28)
    check_r("piece-cucumber", skin, (70, 70), 58)
    L = [G(P(smooth(skin), CUKE_D), p + "cut")]
    L.append(P(wob(c - .5, c - .5, 50.5, 49.5, .02, 4, 26), CUKE))                        # thin light under-skin
    L.append(G(P(wob(c, c, 46, 45, .02, 5, 26), CUKE_F), p + "sh"))                        # pale flesh
    zone = polar(c, c + 1, lambda a: 25 + 4 * math.cos(3 * a + .5), 36)
    L.append(P(smooth(zone), "#BFE08A"))                                                   # translucent seed zone (three lobes)
    sd = ""
    for i in range(3):
        a = i / 3 * 2 * math.pi + .5
        for off in (-.32, .32):
            x, y = c + math.cos(a + off) * 15, c + 1 + math.sin(a + off) * 15
            sd += E(x, y, 3.2, 5.6, CUKE_SEED, f' transform="rotate({n(math.degrees(a + off) + 90)} {n(x)} {n(y)})"')
    L.append(G(sd, p + "sh"))
    L.append(P(wob(c, c + 1, 5, 5, .1, 6, 10), CUKE_F2))
    L.append(P(f"M{c - 44},{c - 8} Q{c - 38},{c - 34} {c - 12},{c - 44} Q{c - 30},{c - 32} {c - 38},{c - 6}Z", WHITE, ' opacity="0.6"'))
    return pdoc(p, "".join(L), 301)


def piece_carrot():
    p = "pk-"
    c = 70
    rim = wobp(c, c + 1, 51, 50, .03, 5, 24)
    check_r("piece-carrot", rim, (70, 70), 58)
    L = [G(P(smooth(rim), CAR_D), p + "cut")]
    L.append(G(P(wob(c - .5, c - 1, 47, 46, .03, 6, 24), CAR), p + "sh"))
    L.append(P(wob(c, c, 29, 28, .04, 7, 20), mix(CAR, CAR_D, .35)))                    # darker ring around the core
    L.append(P(smooth(polar(c, c, lambda a: 25 + 2.5 * math.cos(6 * a), 36)), CAR_L))
    L.append(P(smooth(polar(c, c, lambda a: 14 + 2 * math.cos(6 * a + .5), 24)), CAR_C))
    L.append(P(f"M{c - 40},{c - 8} Q{c - 34},{c - 30} {c - 12},{c - 40} Q{c - 28},{c - 30} {c - 34},{c - 6}Z", "#FFD7A8", ' opacity="0.9"'))
    return pdoc(p, "".join(L), 303)


def leaf_pts(cx, cy, R, seed, k=64, ruff=1.0):
    """Torn lettuce piece: rounded blob with a ruffled (frilly) edge."""
    r = random.Random(seed)
    ph = [r.uniform(0, 6.3) for _ in range(4)]
    return polar(cx, cy, lambda a: R * (1 + .1 * math.sin(2 * a + ph[0]) + .06 * math.sin(3 * a + ph[1])
                                          + ruff * (.05 * math.sin(11 * a + ph[2]) + .03 * math.sin(17 * a + ph[3]))), k)


def leaf_body(cx, cy, R, seed, rot=0, colors=(LET_D, LET, LET_L, LET_P)):
    """Layers of one torn lettuce piece (no filter): dark edge, leaf, light patch, pale rib + veins."""
    d_, m_, l_, p_ = colors
    out = leaf_pts(cx, cy, R, seed)
    g = P(smooth(out), d_)
    g += P(smooth([(cx + (x - cx) * .93 - R * .02, cy + (y - cy) * .93 - R * .05) for x, y in out]), m_)
    g += P(wob(cx - R * .22, cy - R * .2, R * .5, R * .32, .12, seed + 1, 14, -30), l_, ' opacity="0.85"')
    a = math.radians(rot)
    ca, sa = math.cos(a), math.sin(a)
    T = lambda x, y: (cx + x * ca - y * sa, cy + x * sa + y * ca)
    rib = [T(-R * .85, R * .1), T(-R * .2, -R * .02), T(R * .6, -R * .12), T(R * .55, -R * .04), T(-R * .2, R * .1), T(-R * .85, R * .2)]
    g += P(smooth(rib, .12), p_)
    for s, (u, v) in enumerate(((-.35, -1), (.1, -1), (-.1, 1), (.35, 1))):
        x0, y0 = T(R * u, v * R * .02)
        x1, y1 = T(R * (u + .3), v * R * .55)
        g += stroke(f"M{n(x0)},{n(y0)} Q{n((x0 + x1) / 2 + 3)},{n((y0 + y1) / 2)} {n(x1)},{n(y1)}", p_, max(3.5, R * .07), ' opacity="0.75"')
    return g, out


def piece_lettuce():
    p = "pl-"
    g, out = leaf_body(70, 70, 48, 11, rot=-28)
    check_r("piece-lettuce", out, (70, 70), 58)
    return pdoc(p, G(g, p + "cut"), 305)


# ================= WHOLE VEGETABLES (560x420 grid -> 672x504) =================
def cuke_pts(N=26):
    top, bot = [], []
    for i in range(N + 1):
        t = i / N
        x = 44 + t * 472
        h = 72 * (1 - abs(2 * t - 1) ** 2.5) ** (1 / 2.5) * (.93 + .07 * t)
        yc = 316 - 6 * math.sin(math.pi * t)
        top.append((x, yc - h)); bot.append((x, yc + h))
    return top + bot[::-1][1:-1]


def veg_cucumber_whole(bumps_n=34):
    p = "vc-"
    pts = cuke_pts()
    L = [G(P(smooth(pts), CUKE_D) + P(wob(522, 318, 16, 11, .06, 3, 12), mix(CUKE_D, "#6B5A2A", .4)), p + "cut")]   # skin + stem nub
    L.append(P(smooth([(x - 1, y - 6 if y < 316 else y - 3) for x, y in pts]), CUKE))
    for dy, w, op in ((-44, 7, .55), (-14, 8, .45), (18, 7, .4)):                          # pale lengthwise stripes
        lens = [(x, 316 + dy - w * math.sin(math.pi * (x - 70) / 420)) for x in range(70, 491, 30)]
        lens += [(x, 316 + dy + w * math.sin(math.pi * (x - 70) / 420)) for x in range(490, 69, -30)]
        L.append(P(smooth(lens), CUKE_L, f' opacity="{op}"'))
    r = random.Random(7)
    bumps = ""
    for i in range(bumps_n):                                                                # little warts
        x = r.uniform(80, 490); t = (x - 44) / 472
        h = 72 * (1 - abs(2 * t - 1) ** 2.5) ** (1 / 2.5) * .74
        y = r.uniform(316 - h, 316 + h * .8)
        bumps += C(x + .6, y + 1.8, 4.2, CUKE_D, ' opacity="0.7"') + C(x, y, 3.8, "#A8D883")
    L.append(bumps)
    L.append(P("M96,268 Q260,236 452,256 Q270,252 104,282Z", "#CDEFAE", ' opacity="0.85"'))    # gloss
    L.append(P(wob(50, 318, 8, 10, .1, 9, 10), "#E8E08A", ' opacity="0.9"'))                    # blossom end
    return PB.veg_doc(p, "".join(L), 311)


CAR_TIP, CAR_SH = 36, 452


def carrot_h(x):
    t = max(0, (x - CAR_TIP) / (CAR_SH - CAR_TIP))
    return 5 + 61 * t ** .72


def car_bot(x):
    return 388 - 26 * (1 - max(0, (x - CAR_TIP) / (CAR_SH - CAR_TIP)))


def car_mid(x):
    return car_bot(x) - carrot_h(x)


def carrot_pts():
    top, bot = [], []
    for i in range(25):
        x = CAR_TIP + (CAR_SH - CAR_TIP) * i / 24
        h = carrot_h(x)
        top.append((x, car_bot(x) - 2 * h)); bot.append((x, car_bot(x)))
    H = carrot_h(CAR_SH)
    cap = [(CAR_SH + math.sin(a) * H * .45, 388 - H - math.cos(a) * H) for a in [j / 8 * math.pi for j in range(1, 8)]]
    return [(CAR_TIP - 6, car_mid(CAR_TIP))] + top[1:] + cap + bot[::-1][:-1]


def veg_carrot_whole(leaf_n=4):
    p = "vk-"
    pts = carrot_pts()
    H = carrot_h(CAR_SH)
    # leafy top first (behind the shoulder): stems + feathery leaflets
    gr = ""
    r = random.Random(3)
    for (tx, ty, w) in ((486, 150, 11), (526, 168, 11), (546, 232, 10)):
        sx, sy = CAR_SH + 14, 388 - H - 4
        mx, my = (sx + tx) / 2 + 10, (sy + ty) / 2
        gr += stroke(f"M{sx},{sy} Q{mx},{my} {tx},{ty}", GREEN_D, w)
        for j in range(leaf_n):
            u = .4 + j * .17 * 4 / leaf_n
            x = (1 - u) ** 2 * sx + 2 * (1 - u) * u * mx + u * u * tx
            y = (1 - u) ** 2 * sy + 2 * (1 - u) * u * my + u * u * ty
            for side in (-1, 1):
                gr += P(wob(x + side * 17, y - 4, 22, 11, .12, r.randint(0, 999), 12, side * 40 - 60), r.choice([GREEN, GREEN_L, GREEN]))
        gr += P(wob(tx, ty - 8, 20, 13, .12, r.randint(0, 999), 12, -60), GREEN_L)
    L = [G(gr, p + "cut")]
    L.append(G(P(smooth(pts, .14), CAR_D), p + "cut"))
    L.append(P(smooth([(x - 1, y - 5 if y < car_mid(x) else y - 3) for x, y in pts], .14), CAR))
    ridges = ""
    for x in range(90, 440, 38):                                                            # rings (transverse ridges)
        h = carrot_h(x)
        b = car_bot(x)
        ridges += P(f"M{x - 3},{n(b - 2 * h + 6)} Q{x + 5},{n(b - h)} {x - 1},{n(b - 2 - h * .25)} Q{x + 1},{n(b - h)} {x - 3},{n(b - 2 * h + 6)}Z",
                    CAR_D, ' opacity="0.55"')
    L.append(ridges)
    hl = [(x, car_bot(x) - 2 * carrot_h(x) + 8 + carrot_h(x) * .1) for x in range(70, 440, 30)]
    hl += [(x, car_bot(x) - 2 * carrot_h(x) + 8 + carrot_h(x) * .38) for x in range(430, 69, -30)]
    L.append(P(smooth(hl), CAR_L, ' opacity="0.8"'))
    L.append(P(wob(CAR_SH + 8, 388 - H - 2, 16, 9, .08, 5, 12, 80), mix(GREEN_D, CAR_D, .45)))  # crown where the leaves start
    return PB.veg_doc(p, "".join(L), 313)


# ---------------- measured profiles + strips ----------------
OUTLINES = {"cucumber": lambda: [smooth(cuke_pts())], "carrot": lambda: [smooth(carrot_pts(), .14)]}
SPAN_GRID = {"cucumber": (44, 516), "carrot": (CAR_TIP - 6, CAR_SH + 29)}
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


def cucumber_inside():
    p = "ci-"; H = strip_height("cucumber"); c = H / 2
    L = [G(P(PE.lens(30, c, 27, c - 1), CUKE_D), p + "cut")]
    L.append(P(PE.lens(30, c, 24, c - 4), CUKE))
    L.append(P(PE.lens(30, c, 21, c - 9), CUKE_F))
    L.append(P(PE.lens(30, c, 13, c * .58), "#BFE08A"))
    sd = "".join(E(30 + (3 if i % 2 else -3), c + f * c, 3.2, 5.4, CUKE_SEED) for i, f in enumerate((-.36, -.12, .12, .36)))
    L.append(G(sd, p + "sh"))
    L.append(P(PE.lens(23, c - c * .3, 3, c * .3), WHITE, ' opacity="0.55"'))
    return PE.strip_doc(p, H, "".join(L), 321)


def carrot_inside():
    p = "ki-"; H = strip_height("carrot"); c = H / 2
    L = [G(P(PE.lens(30, c, 27, c - 1), CAR_D), p + "cut")]
    L.append(P(PE.lens(30, c, 24, c - 4), CAR))
    L.append(P(PE.lens(30, c, 15, c * .62), mix(CAR, CAR_D, .35)))
    L.append(P(PE.lens(30, c, 13, c * .56), CAR_L))
    L.append(P(PE.lens(30, c, 7, c * .32), CAR_C))
    L.append(P(PE.lens(23, c - c * .3, 3, c * .3), "#FFD7A8", ' opacity="0.8"'))
    return PE.strip_doc(p, H, "".join(L), 323)


ITEMS = {"piece-cucumber": piece_cucumber, "piece-carrot": piece_carrot, "piece-lettuce": piece_lettuce,
         "veg-cucumber-whole": veg_cucumber_whole, "veg-cucumber-slice": lambda: PB.slice_from_topping(piece_cucumber, "pc-", "vcs-"),
         "veg-cucumber-inside": cucumber_inside,
         "veg-carrot-whole": veg_carrot_whole, "veg-carrot-slice": lambda: PB.slice_from_topping(piece_carrot, "pk-", "vks-"),
         "veg-carrot-inside": carrot_inside}

if __name__ == "__main__":
    run(ITEMS)
    for row in BOXES:
        print("  geometry", "OK " if row[3] else "BAD", *row[:3])
    if "--profiles" in sys.argv:
        print(json.dumps({v: {"span": VEG_SPAN[v], "stripH": strip_height(v), "profile": profile(v)} for v in VEG_SPAN}, separators=(",", ":")))
