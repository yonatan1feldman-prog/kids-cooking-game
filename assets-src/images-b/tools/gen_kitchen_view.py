# More around the kitchen (visual round 5, 2026-09): a garden outside the window (a fence, flowers, a little house
# with a chimney), a cat asleep on the window sill (body, tail and three heads: asleep, awake, yawning), a clock on the
# wall (its face and two hands), a child's drawing taped to the right cabinet, one thing on the sill per recipe (and a
# pot of daisies on the other screens), and paper bunting on the wall for the birthday cake.
# Like the living kitchen's pieces (gen_kitchen_live.py), each piece's viewBox is its own box in the background's
# 2400x1080 frame, so the game lays it exactly where it is drawn here (core/scenery.ts, `VIEW`) and the paper grain
# lines up with the background. Same paper filters as the kitchen.
# Run: python images-b/tools/gen_kitchen_view.py   (writes into images-b/live/)
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pb import *

p = "bgv-"
m = lambda c, t=.25: mix(c, BG_WALL, t)          # the wall's pieces are a little muted, like the background's

# ---------------------------------------------------------------- the garden outside (lower panes only)
FENCE = "#F7EEDD"
ROOF = m(RUST, .2)
HOUSE = "#F4E7D0"


def garden():
    g = ""
    # the little house on the far hill, its chimney just under the window's cross (the smoke rises behind it)
    g += G(P("M1116,138 L1124,138 L1124,158 L1116,158Z", m("#B0654A", .2))
           + P(wrect(1082, 160, 44, 28, 3, .6, 11), HOUSE)
           + P("M1074,164 L1104,139 L1134,164Z", ROOF)
           + P(wrect(1098, 172, 11, 16, 2, .4, 12), m(TEAL, .3))
           + P(wrect(1086, 168, 9, 8, 2, .3, 13), m(MUSTARD, .2)) + P(wrect(1113, 168, 9, 8, 2, .3, 14), m(MUSTARD, .2)), p + "sh")
    # a round bush and a tall sunflower on the right
    g += G(P(wob(1206, 204, 26, 16, .1, 21), m("#7FA06A", .15)) + P(wob(1196, 200, 14, 9, .1, 22), m("#95B676", .15)), p + "sh")
    g += G(stroke("M1330,226 Q1326,196 1332,170", m(GREEN_D, .2), 3.5) + P(wob(1322, 196, 9, 4, .1, 23, rot=-30), m(GREEN, .2))
           + "".join(P(wob(1332 + math.cos(a) * 9, 166 + math.sin(a) * 9, 6, 3.5, .1, 30 + i, 10, math.degrees(a)), m(MUSTARD, .1)) for i, a in enumerate([k * math.pi / 5 for k in range(10)]))
           + C(1332, 166, 6, m("#8A5A3A", .15)), p + "sh")
    # the picket fence across both panes
    f = P(wrect(950, 206, 420, 6, 2, .4, 41, step=60), FENCE) + P(wrect(950, 219, 420, 6, 2, .4, 42, step=60), FENCE)
    for i, x in enumerate(range(958, 1366, 17)):
        f += P(f"M{x},{232} L{x},{201} L{x + 4.5},{195} L{x + 9},{201} L{x + 9},{232}Z", FENCE)
    g += G(f, p + "sh")
    # flowers along its foot
    fl = ""
    r = __import__("random").Random(5)
    for i in range(16):
        x = 964 + i * 25 + r.uniform(-5, 5)
        if 1150 < x < 1170:
            continue
        y = 222 + r.uniform(-3, 4)
        col = [m(PINK_D, .1), m(MUSTARD, .1), WHITE, m(CORAL, .15)][i % 4]
        fl += stroke(f"M{n(x)},{n(y + 10)} L{n(x)},{n(y)}", m(GREEN_D, .2), 2) + C(x, y, 4.5, col) + C(x, y, 1.8, m(MUSTARD, .05) if col == WHITE else WHITE)
    g += G(fl, p + "sh")
    clip = (f'<clipPath id="{p}pane"><path d="M960,141 H1154 V230 H974 Q960,230 960,216Z"/>'
            f'<path d="M1166,141 H1360 V216 Q1360,230 1346,230 H1166Z"/></clipPath>')
    return clip, G(g, None, f' clip-path="url(#{p}pane)"')


# ---------------------------------------------------------------- the cat on the sill (facing left, into the room)
CAT = m("#E8A25E", .12); CAT_D = m("#C47A3C", .12); CAT_L = m("#F8DDB6", .1); CAT_EAR = m(PINK, .15)


def cat_body():
    b = P(wob(1318, 222, 58, 26, .04, 51), CAT)
    b += "".join(stroke(f"M{x},{200 + abs(x - 1322) * .12} Q{x + 6},{214} {x + 2},{226}", CAT_D, 6) for x in (1300, 1322, 1344))
    b += P(wob(1300, 236, 30, 10, .06, 52), CAT_L, ' opacity="0.8"')
    b += E(1262, 242, 15, 7, CAT_L) + E(1286, 244, 15, 7, CAT_L)
    return G(b, p + "sh")


def cat_tail():
    t = stroke("M1364,234 Q1386,258 1378,290 Q1372,312 1386,322", CAT, 13)
    t += stroke("M1376,306 Q1374,314 1384,320", CAT_D, 13)
    return G(t, p + "sh")


def cat_head(kind):
    dy = {"sleep": 6, "awake": -8, "yawn": -8}[kind]
    y = lambda v: v + dy
    h = P(f"M1238,{y(210)} L1242,{y(180)} L1262,{y(200)}Z", CAT) + P(f"M1264,{y(199)} L1283,{y(181)} L1288,{y(210)}Z", CAT)
    h += P(f"M1243,{y(203)} L1245,{y(188)} L1255,{y(199)}Z", CAT_EAR) + P(f"M1270,{y(199)} L1280,{y(189)} L1283,{y(204)}Z", CAT_EAR)
    h += P(wob(1262, y(222), 29, 23, .04, 61), CAT)
    h += stroke(f"M1262,{y(200)} L1262,{y(208)}", CAT_D, 4) + stroke(f"M1253,{y(202)} L1255,{y(209)}", CAT_D, 3.5) + stroke(f"M1271,{y(202)} L1269,{y(209)}", CAT_D, 3.5)
    h += E(1261, y(234), 14, 8, CAT_L)
    if kind == "sleep":
        h += stroke(f"M1244,{y(222)} Q1250,{y(228)} 1256,{y(222)}", EYE, 2.6) + stroke(f"M1267,{y(222)} Q1273,{y(228)} 1279,{y(222)}", EYE, 2.6)
    elif kind == "awake":
        h += E(1250, y(222), 4.6, 6, EYE) + E(1273, y(222), 4.6, 6, EYE) + C(1251.5, y(220), 1.6, WHITE) + C(1274.5, y(220), 1.6, WHITE)
    else:
        h += stroke(f"M1244,{y(220)} Q1250,{y(216)} 1256,{y(221)}", EYE, 2.6) + stroke(f"M1267,{y(221)} Q1273,{y(216)} 1279,{y(220)}", EYE, 2.6)
        h += E(1261, y(240), 7, 8, m("#C2566A", .1)) + E(1261, y(243), 4, 3.5, m(PINK, .05))
    h += P(f"M1257,{y(229)} L1265,{y(229)} L1261,{y(234)}Z", m(PINK_D, .05))
    wh = m("#FFFFFF", .3)
    h += (stroke(f"M1248,{y(234)} L1226,{y(230)}", wh, 1.4) + stroke(f"M1248,{y(237)} L1227,{y(238)}", wh, 1.4)
          + stroke(f"M1274,{y(234)} L1296,{y(230)}", wh, 1.4) + stroke(f"M1274,{y(237)} L1295,{y(238)}", wh, 1.4))
    if kind == "sleep":
        h += C(1245, y(233), 4, CHEEK, ' opacity="0.35"') + C(1278, y(233), 4, CHEEK, ' opacity="0.35"')
    return G(h, p + "sh")


CAT_BOX = (1220, 164, 1400, 332)

# ---------------------------------------------------------------- the clock
CLK = (1840, 146)


def clock_face():
    cx, cy = CLK
    f = P(wob(cx, cy, 54, 54, .015, 71), m(TEAL, .3)) + P(wob(cx, cy, 45, 45, .015, 72), "#FBF4E6")
    for i in range(12):
        a = math.radians(i * 30)
        r = 37
        f += C(cx + math.sin(a) * r, cy - math.cos(a) * r, 4.2 if i % 3 == 0 else 2.4, m(EYE, .35))
    return G(f, p + "sh2")


def hand(length, width, col):
    cx, cy = CLK
    return G(P(f"M{cx - width / 2},{cy + 6} L{cx - width / 2 * .7},{cy - length} Q{cx},{cy - length - width} {cx + width / 2 * .7},{cy - length} L{cx + width / 2},{cy + 6}Z", col), p + "sh")


CLOCK_BOX = (1780, 86, 1900, 206)

# ---------------------------------------------------------------- the child's drawing on the right cabinet
def drawing():
    d = P(wrect(2236, 40, 118, 142, 4, 1.2, 81), "#FFFDF7")
    cr = lambda path, col, w=3.4: stroke(path, col, w, ' opacity="0.9"')
    d += cr("M2244,160 Q2270,154 2296,162 Q2320,168 2346,158", GREEN, 4)
    d += C(2328, 66, 11, "#F7C94A") + "".join(cr(f"M{n(2328 + math.cos(a) * 15)},{n(66 + math.sin(a) * 15)} L{n(2328 + math.cos(a) * 21)},{n(66 + math.sin(a) * 21)}", "#F2B53A", 2.6) for a in [k * math.pi / 4 for k in range(8)])
    # Mom (pink dress, brown bun) and the girl (yellow dress) holding hands
    d += C(2266, 88, 9, "#F3C9A5") + C(2266, 76, 5, "#8A5A3A") + P("M2266,97 L2254,132 L2278,132Z", "#F08FA0")
    d += cr("M2261,132 L2259,152", "#8A5A3A", 2.6) + cr("M2271,132 L2273,152", "#8A5A3A", 2.6)
    d += C(2296, 106, 7, "#F3C9A5") + P("M2296,113 L2286,138 L2306,138Z", "#F7C94A")
    d += cr("M2292,138 L2291,152", "#8A5A3A", 2.4) + cr("M2300,138 L2301,152", "#8A5A3A", 2.4)
    d += cr("M2272,108 Q2282,118 2290,118", "#F3C9A5", 2.6)
    # Pipa: a brown spiky blob with a dot of a nose
    d += P(spiky(2330, 146, 11, 17, 180, 360, 7, 91), "#9E6A48") + E(2330, 148, 12, 8, "#E9C49A") + C(2320, 147, 1.8, EYE)
    # two strips of tape
    d += P(wrect(2226, 30, 36, 14, 2, .5, 82), "#F4EBD2", ' opacity="0.85" transform="rotate(-18 2244 37)"')
    d += P(wrect(2328, 30, 36, 14, 2, .5, 83), "#F4EBD2", ' opacity="0.85" transform="rotate(16 2346 37)"')
    return G(G(d, p + "sh"), None, ' transform="rotate(-3 2295 110)"')


DRAW_BOX = (2216, 20, 2372, 200)

# ---------------------------------------------------------------- one thing on the sill for each recipe
POT = m("#C8704F", .2); POT_D = m("#B35F42", .2)
GLASS = m("#CFE0DC", .15)


def pot():
    return P("M974,208 L1020,208 L1014,247 L980,247Z", POT) + P(wrect(969, 202, 56, 12, 4, .5, 101), POT_D)


def bowl(col):
    return P("M948,222 Q950,250 996,250 Q1042,250 1044,222Z", col) + P(wrect(944, 218, 104, 8, 4, .4, 102), mix(col, WHITE, .25))


def leaf(x, y, a, seed, col=None):
    return P(wob(x, y, 9, 4, .1, seed, 12, a), col or m(GREEN, .2))


def sill_flowers():
    s = stroke("M985,204 L984,172", m(GREEN_D, .2), 3) + stroke("M997,204 L1004,160", m(GREEN_D, .2), 3) + stroke("M1009,204 L1018,180", m(GREEN_D, .2), 3)
    s += leaf(990, 190, -30, 111) + leaf(1010, 188, 30, 112)
    for i, (x, y) in enumerate(((984, 170), (1004, 158), (1018, 178))):
        s += "".join(E(x + math.cos(a) * 7, y + math.sin(a) * 7, 5.5, 3.2, WHITE, f' transform="rotate({n(math.degrees(a))} {n(x + math.cos(a) * 7)} {n(y + math.sin(a) * 7)})"') for a in [k * math.pi / 4 for k in range(8)])
        s += C(x, y, 4.2, m(MUSTARD, .05))
    return G(s + pot(), p + "sh")


def sill_tomato():
    s = stroke("M996,204 Q990,180 998,152", m(GREEN_D, .2), 3.5) + stroke("M994,186 Q980,176 972,178", m(GREEN_D, .2), 2.5) + stroke("M997,170 Q1012,162 1020,168", m(GREEN_D, .2), 2.5)
    s += leaf(976, 172, -20, 121) + leaf(1016, 160, 20, 122) + leaf(1000, 150, -60, 123) + leaf(986, 196, 20, 124)
    s += C(976, 186, 8, m(RED, .1)) + C(1018, 178, 9, m(RED, .1)) + C(1004, 192, 7, m(CORAL, .1))
    s += C(974, 183, 2.2, m(RED_L, .1)) + C(1015, 175, 2.4, m(RED_L, .1))
    return G(s + pot(), p + "sh")


def sill_lemons():
    s = ""
    for i, (x, y) in enumerate(((970, 212), (996, 204), (1022, 212))):
        s += P(wob(x, y, 15, 11, .05, 131 + i), m("#F4D34C", .1)) + C(x - 5, y - 4, 3, m("#FBE88C", .1))
    s += leaf(1004, 192, -30, 134) + leaf(1030, 199, 20, 135)
    return G(s + bowl(m(TEAL, .3)), p + "sh")


def sill_cookies():
    s = P(wrect(962, 170, 70, 77, 16, .8, 141), GLASS, ' opacity="0.95"')
    for i, (x, y) in enumerate(((980, 230), (1012, 228), (996, 212), (978, 196), (1014, 198))):
        s += C(x, y, 12, m(CRUST, .1)) + C(x - 4, y - 3, 2.3, m(WALNUT_D, .1)) + C(x + 4, y + 2, 2.3, m(WALNUT_D, .1))
    s += P(wrect(958, 160, 78, 14, 6, .6, 142), m(RED_D, .3)) + C(997, 157, 7, m(RED_D, .3))
    return G(s, p + "sh")


def sill_fruit():
    s = C(972, 208, 14, m(RED, .1)) + stroke("M972,194 L974,188", m(WALNUT_D, .2), 2.5) + leaf(981, 190, -20, 151)
    s += C(1018, 208, 14, m(CORAL, .05)) + C(1014, 204, 2, m(CORAL_L, .1))
    s += P("M978,206 Q996,226 1030,196 Q1026,214 1000,218 Q984,220 978,206Z", m("#F6D45A", .1)) + C(1030, 196, 2.5, m(WALNUT_D, .2))
    return G(s + bowl(m(CREAM2, .1)), p + "sh")


def sill_honey():
    s = P(wob(996, 222, 30, 26, .03, 161), m(MUSTARD, .15)) + P(wrect(972, 192, 48, 12, 5, .5, 162), m(WALNUT, .2))
    s += P("M972,206 Q978,214 984,208 Q990,220 996,210 Q1002,216 1008,208 Q1014,214 1020,206 L1020,200 L972,200Z", m("#F2A93A", .1))
    s += stroke("M1010,196 L1030,162", m(WALNUT, .15), 4) + P(wob(1032, 158, 7, 5, .05, 163, 12, -60), m(WALNUT, .15))
    s += stroke("M980,212 Q984,222 982,232", m("#FBE3A0", .1), 3, ' opacity="0.8"')
    return G(s, p + "sh")


def sill_carrots():
    s = ""
    for i, (x, a) in enumerate(((984, -14), (998, 0), (1012, 12))):
        tip = (x + math.sin(math.radians(a)) * 40, 196 - math.cos(math.radians(a)) * 40)
        s += stroke(f"M{x},196 L{n(tip[0])},{n(tip[1])}", m(CORAL, .05), 9)
        s += leaf(tip[0] - 4, tip[1] - 8, -70 + a, 171 + i) + leaf(tip[0] + 4, tip[1] - 9, -110 + a, 174 + i)
    s += P("M972,196 L1022,196 L1018,247 L976,247Z", m("#D9E4E0", .15)) + P(wrect(968, 192, 58, 10, 4, .5, 177), m("#BCCBC6", .15))
    s += P("M1022,204 Q1036,210 1022,228", "none", f' stroke="{m("#BCCBC6", .15)}" stroke-width="5"')
    return G(s, p + "sh")


def sill_present():
    s = P(wrect(966, 196, 62, 51, 4, .6, 181), m(PINK, .1)) + P(wrect(962, 186, 70, 14, 4, .5, 182), m(PINK_D, .1))
    s += P("M992,186 L1002,186 L1002,247 L992,247Z", m(TEAL, .2))
    s += P(wob(984, 180, 11, 7, .06, 183, 12, 20), m(TEAL, .2)) + P(wob(1010, 180, 11, 7, .06, 184, 12, -20), m(TEAL, .2)) + C(997, 184, 5, m(TEAL_D, .2))
    return G(s, p + "sh")


def sill_strawberries():
    s = ""
    for i, (x, y) in enumerate(((972, 212), (996, 206), (1020, 212), (984, 196), (1008, 194))):
        s += P(f"M{x - 10},{y - 4} Q{x},{y - 10} {x + 10},{y - 4} Q{x + 8},{y + 10} {x},{y + 13} Q{x - 8},{y + 10} {x - 10},{y - 4}Z", m(RED, .1))
        s += P(spiky(x, y - 6, 3, 8, 180, 360, 3, 190 + i), m(GREEN, .15)) + C(x - 3, y + 2, 1.2, m(SEED, .1)) + C(x + 3, y + 5, 1.2, m(SEED, .1))
    return G(s + bowl(m(WHITE, .15)), p + "sh")


SILL_BOX = (936, 138, 1060, 250)
SILL = {
    "kitchen-sill-flowers": sill_flowers, "kitchen-sill-tomato": sill_tomato, "kitchen-sill-lemons": sill_lemons,
    "kitchen-sill-cookies": sill_cookies, "kitchen-sill-fruit": sill_fruit, "kitchen-sill-honey": sill_honey,
    "kitchen-sill-carrots": sill_carrots, "kitchen-sill-present": sill_present, "kitchen-sill-berries": sill_strawberries,
}

# ---------------------------------------------------------------- bunting for the birthday cake
FLAGS = [m(CORAL, .2), m(TEAL, .25), m(MUSTARD, .15), m(PINK_D, .15)]


def bunting(x0, y0, x1, y1, sag, seed):
    q = lambda t: ((1 - t) ** 2 * x0 + 2 * t * (1 - t) * (x0 + x1) / 2 + t * t * x1, (1 - t) ** 2 * y0 + 2 * t * (1 - t) * ((y0 + y1) / 2 + 2 * sag) + t * t * y1)
    b = stroke(f"M{x0},{y0} Q{(x0 + x1) / 2},{(y0 + y1) / 2 + 2 * sag} {x1},{y1}", "#A08670", 2.2)
    k = int((x1 - x0) / 42)
    for i in range(1, k):
        (ax, ay), (bx, by) = q((i - .38) / k), q((i + .38) / k)
        mx, my = (ax + bx) / 2, (ay + by) / 2
        b += P(f"M{n(ax)},{n(ay)} L{n(bx)},{n(by)} L{n(mx)},{n(my + 27)}Z", FLAGS[(i + seed) % 4])
    return G(b, p + "sh") + C(x0, y0, 5, m(MUSTARD, .25)) + C(x1, y1, 5, m(MUSTARD, .25))


BUNT_L = (428, 4, 904, 80)
BUNT_R = (1484, 4, 1980, 80)


def defs():
    return std_defs(p, "bg", seed=61, sh=(3, 2.5, .22), sh2=(6, 5, .24), blur=6)


def piece_svg(body, box, extra_defs=""):
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {y0} {w} {h}" width="{w}" height="{h}">'
            f'<defs>{defs()}{extra_defs}</defs>{G(body, p + "gr")}</svg>')


def pieces():
    clip, g = garden()
    out = {"kitchen-garden": (g, (960, 136, 1360, 232), clip)}
    out["kitchen-cat-body"] = (cat_body(), CAT_BOX, "")
    out["kitchen-cat-tail"] = (cat_tail(), CAT_BOX, "")
    for k in ("sleep", "awake", "yawn"):
        out[f"kitchen-cat-{k}"] = (cat_head(k), CAT_BOX, "")
    out["kitchen-clock"] = (clock_face(), CLOCK_BOX, "")
    out["kitchen-clock-hour"] = (hand(22, 7, m(EYE, .25)), CLOCK_BOX, "")
    out["kitchen-clock-minute"] = (hand(33, 5, m(EYE, .25)) + G(C(*CLK, 5, m(RUST, .2)), p + "sh"), CLOCK_BOX, "")
    out["kitchen-drawing"] = (drawing(), DRAW_BOX, "")
    for key, fn in SILL.items():
        out[key] = (fn(), SILL_BOX, "")
    out["kitchen-bunting-l"] = (bunting(436, 14, 896, 12, 14, 0), BUNT_L, "")
    out["kitchen-bunting-r"] = (bunting(1492, 12, 1972, 14, 12, 2), BUNT_R, "")
    return out


def main():
    for key, (body, box, extra) in pieces().items():
        path, size = write(key, piece_svg(body, box, extra), "live")
        x0, y0, x1, y1 = box
        print(f"{key:24s} {size / 1024:5.1f} KB  box {box}  size {x1 - x0}x{y1 - y0}")


if __name__ == "__main__":
    main()
