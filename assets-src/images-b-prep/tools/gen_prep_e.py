# images-b-prep, part E: cut-face strips (veg-*-inside) + press-dent.
# Run: python tools/gen_prep_e.py [names...] [--profiles]   (writes into images-b-prep/ only)
# The strip heights and the top/bottom profile of every whole vegetable are MEASURED from the same outlines
# gen_prep_b.py draws, so a strip placed on any cut line fits the body exactly (see README-prep.md).
import math, re, sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from prepkit import *  # noqa: F401,F403
import gen_prep_b as B

K = B.VEG_K            # grid (560x420) -> file (672x504)
SW = 60                # strip width in whole-veg file units (the code does not stretch it horizontally)


# ---------------- outline sampling ----------------
def sample_path(d, steps=24):
    """Absolute M/L/Q/C/Z path -> list of polygons (points)."""
    toks = re.findall(r"[MLQCZ]|-?\d+(?:\.\d+)?", d)
    polys, cur, pos, i, cmd = [], [], (0, 0), 0, None
    num = lambda: float(toks[i])
    while i < len(toks):
        t = toks[i]
        if t in "MLQCZ":
            cmd = t; i += 1
            if t == "Z":
                if cur: polys.append(cur); cur = []
                continue
        if cmd == "M":
            pos = (num(), float(toks[i + 1])); i += 2; cur = [pos]; cmd = "L"
        elif cmd == "L":
            pos = (num(), float(toks[i + 1])); i += 2; cur.append(pos)
        elif cmd == "Q":
            c1 = (num(), float(toks[i + 1])); p1 = (float(toks[i + 2]), float(toks[i + 3])); i += 4
            for s in range(1, steps + 1):
                u = s / steps
                cur.append(((1 - u) ** 2 * pos[0] + 2 * (1 - u) * u * c1[0] + u * u * p1[0], (1 - u) ** 2 * pos[1] + 2 * (1 - u) * u * c1[1] + u * u * p1[1]))
            pos = p1
        elif cmd == "C":
            c1 = (num(), float(toks[i + 1])); c2 = (float(toks[i + 2]), float(toks[i + 3])); p1 = (float(toks[i + 4]), float(toks[i + 5])); i += 6
            for s in range(1, steps + 1):
                u = s / steps; v = 1 - u
                cur.append((v ** 3 * pos[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u ** 3 * p1[0],
                            v ** 3 * pos[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u ** 3 * p1[1]))
            pos = p1
    if cur: polys.append(cur)
    return polys


def outline(veg):
    """Body outline(s) in the 560x420 drawing grid (the silhouette, without shadow)."""
    if veg == "tomato":
        return [smooth(wobp(280, 230, 158 * 1.08, 158, .02, 5, 22))]
    if veg == "mushroom":
        return [B.MUSH_CAP_D, B.MUSH_STEM_D]
    if veg == "pepper":
        return [smooth(B.PEPPER_OUT)]
    return [smooth(B.onion_pts())]


def column(polys, x):
    """(top, bottom) of the union of polygons at vertical line x (grid units), or None."""
    ys = []
    for poly in polys:
        for (x0, y0), (x1, y1) in zip(poly, poly[1:] + poly[:1]):
            if (x0 - x) * (x1 - x) <= 0 and x0 != x1:
                ys.append(y0 + (y1 - y0) * (x - x0) / (x1 - x0))
    return (min(ys), max(ys)) if ys else None


def profile(veg, step=24):
    """[[x, top, bottom], ...] in 672x504 file units, every `step` units across the body span."""
    polys = [p for d in outline(veg) for p in sample_path(d)]
    x0, x1 = B.VEG_SPAN[veg]
    out = []
    x = x0 + 4
    while x <= x1 - 4:
        c = column(polys, x / K)
        if c:
            out.append([round(x), round(c[0] * K, 1), round(c[1] * K, 1)])
        x += step
    return out


def strip_height(veg):
    return math.ceil(max(b - t for _, t, b in profile(veg, 4)))


MUSH_CAP_FRAC = (258 - 56) / (394 - 56)       # cap part of the mushroom strip (top 59.8%)


# ---------------- strips (viewBox SW x H; body is a narrow lens, the cut face seen at a grazing angle) ----------------
def lens(cx, cy, rx, ry, k=28):
    return smooth([(cx + math.cos(i / k * 2 * math.pi) * rx * (1 - .15 * abs(math.sin(i / k * 2 * math.pi)) ** 8),
                    cy + math.sin(i / k * 2 * math.pi) * ry) for i in range(k)])


def strip_doc(p, H, body, seed):
    return doc(p, SW, H, body, seed=seed, sh=(2, 2, .28), cut={"rim": 1.8, "rough": 2.5})


def tomato_inside():
    p = "ti-"; H = strip_height("tomato"); c = H / 2
    L = [G(P(lens(30, c, 27, c - 1), mix(RED_D, "#7A2016", .28)), p + "cut")]
    L.append(P(lens(30, c, 23, c - 7), RED))
    L.append(P(lens(30, c, 18, c - 26), RED_L))
    pk = ""
    for sy in (-1, 1):                       # two seed pockets (the tomato-slice pockets, seen edge-on)
        py = c + sy * c * .42
        pk += P(wob(30, py, 12, c * .26, .06, 20 + sy, 14), SEEDPOCK)
        for dy in (-.12, 0, .12):
            pk += E(30 + (4 if dy == 0 else -4), py + dy * c, 3.2, 5, SEED)
    L.append(G(pk, p + "sh"))
    L.append(P(wob(30, c, 8, c * .1, .1, 31, 10), "#FBA487"))
    L.append(P(lens(24, c - c * .25, 4, c * .35), "#FFC1A8", ' opacity="0.8"'))
    return strip_doc(p, H, "".join(L), 221)


def onion_inside():
    p = "ni-"; H = strip_height("onion"); c = H / 2
    L = [G(P(lens(30, c, 27, c - 1), ONION_D), p + "cut")]
    rings = [(24, 5, ONION), (22, 10, ONION_W), (20, 28, ONION), (18, 33, ONION_W), (16, 50, ONION_D), (15, 55, ONION_W),
             (13, 72, ONION), (12, 77, ONION_W), (10, 94, ONION), (9, 99, ONION_W)]
    for rx, inset, col in rings:
        if c - inset > 8:
            L.append(P(lens(30, c, rx, c - inset), col))
    L.append(P(lens(24, c - c * .3, 3, c * .3), ONION_L, ' opacity="0.8"'))
    return strip_doc(p, H, "".join(L), 223)


def pepper_inside():
    p = "pi-"; H = strip_height("pepper"); c = H / 2
    L = [G(P(lens(30, c, 27, c - 1), PEPPER_D), p + "cut")]
    L.append(P(lens(30, c, 24, c - 5), PEPPER))
    L.append(P(lens(30, c, 20, c - 16), "#E4F3CF"))                 # pale inner wall
    L.append(G(P(lens(30, c, 15, c - 26), "#C9E2AC"), p + "sh"))    # the hollow
    sd = ""
    for i, fy in enumerate((-.3, -.12, .06, .22, .36)):             # a few seeds and a pale rib
        sd += E(30 + (5 if i % 2 else -5), c + fy * c, 3.4, 5.2, "#FFF6DA") + E(30 + (5 if i % 2 else -5) - 1, c + fy * c - 1.5, 1.4, 2, WHITE)
    sd += P(wob(30, c + c * .55, 9, c * .08, .1, 7, 10), "#D9F0BE")
    L.append(G(sd, p + "sh"))
    L.append(P(lens(24, c - c * .3, 3, c * .3), "#C8EFA8", ' opacity="0.85"'))
    return strip_doc(p, H, "".join(L), 225)


def mushroom_inside():
    p = "mi-"; H = strip_height("mushroom"); cb = H * MUSH_CAP_FRAC
    cap = f"M6,{n(cb - 10)} Q4,6 30,3 Q56,6 54,{n(cb - 10)} Q54,{n(cb)} 30,{n(cb)} Q6,{n(cb)} 6,{n(cb - 10)}Z"
    stem = f"M12,{n(cb - 8)} L12,{H - 14} Q12,{H - 2} 30,{H - 2} Q48,{H - 2} 48,{H - 14} L48,{n(cb - 8)}Z"
    L = [G(P(stem, mix(MUSH, GILL, .45)) + P(cap, mix(MUSH_CAP, "#5E3420", .3)), p + "cut")]
    L.append(P(f"M10,{n(cb - 12)} Q8,16 30,12 Q52,16 50,{n(cb - 12)}Z", MUSH))                      # white cap flesh
    L.append(G(P(f"M10,{n(cb - 26)} L50,{n(cb - 26)} L50,{n(cb - 10)} Q30,{n(cb - 4)} 10,{n(cb - 10)}Z", "#B98552"), p + "sh"))  # gills
    L.append(P(f"M16,{n(cb - 4)} L16,{H - 16} Q16,{H - 6} 30,{H - 6} Q44,{H - 6} 44,{H - 16} L44,{n(cb - 4)}Z", MUSH))    # stem flesh
    L.append(P(wrect(20, cb + 10, 6, H - cb - 40, 3, .3, 5), "#FFF6E2", ' opacity="0.9"'))
    return strip_doc(p, H, "".join(L), 227)


# ---------------- press dent (260x140) ----------------
def press_dent():
    p = "pd-"
    grad = (f'<radialGradient id="{p}g" cx="130" cy="66" r="124" gradientUnits="userSpaceOnUse" gradientTransform="translate(0 66) scale(1 .5) translate(0 -66)">'
            f'<stop offset="0" stop-color="{SH}" stop-opacity="0.5"/><stop offset="0.55" stop-color="{SH}" stop-opacity="0.32"/>'
            f'<stop offset="0.85" stop-color="{SH}" stop-opacity="0.08"/><stop offset="1" stop-color="{SH}" stop-opacity="0"/></radialGradient>')
    L = [E(130, 66, 124, 62, f"url(#{p}g)")]
    # squeezed-up rim: a soft light crescent on the near (lower) edge, a softer one at the back
    L.append(G(P("M30,84 Q130,142 230,84 Q130,120 30,84Z", WHITE, ' opacity="0.7"'), p + "bl"))
    L.append(G(P("M60,30 Q130,6 200,30 Q130,20 60,30Z", WHITE, ' opacity="0.3"'), p + "bl"))
    return doc(p, 260, 140, "".join(L), material="smooth", seed=231, blur=5, extra_defs=grad)


ITEMS = {"veg-tomato-inside": tomato_inside, "veg-mushroom-inside": mushroom_inside, "veg-pepper-inside": pepper_inside,
         "veg-onion-inside": onion_inside, "press-dent": press_dent}

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    for name, fn in ITEMS.items():
        if not args or name in args:
            save(name, fn())
    if "--profiles" in sys.argv:
        print(json.dumps({v: {"stripH": strip_height(v), "profile": profile(v)} for v in B.VEG_SPAN}, separators=(",", ":")))
