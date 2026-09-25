# Shared kit for images-b-cookies (the third recipe: cookies).
# Wraps the salad kit (images-b-salad/tools/saladkit.py) READ-ONLY, which itself wraps the prep kit and the style-B kit
# (images-b/tools/pb.py palette, paper grain, torn edge, shadows). Bytecode caching is off, so importing writes nothing
# into the other folders. Output goes ONLY to images-b-cookies/.
import sys, os, re, math
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
COOK = os.path.normpath(os.path.join(HERE, ".."))
STOOLS = os.path.normpath(os.path.join(HERE, "..", "..", "images-b-salad", "tools"))
sys.path.insert(0, STOOLS)
from saladkit import *                      # noqa: F401,F403  pb palette + helpers, prep + salad helpers
import saladkit as SK                       # noqa: E402
from saladkit import PA, PB, gen_items, gen_kitchen   # noqa: F401,E402

FORBID = SK.FORBID

# ---- cookie colours: the pizza-dough colours of pb pushed to a warm golden beige (multiply by TINT) ----
TINT = (.97, .90, .76)     # raw: #F0C984; x the game bake multiply 0xFFD49A -> golden #F0A750
KEEP = {WHITE, SH, RIM, "#FFFFFF", "#FFF8EA"}


def tint(c):
    if c.upper() in KEEP:
        return c
    r, g, b = rgb(c)
    return hexc([r * TINT[0], g * TINT[1], b * TINT[2]])


def recolor(s, old_prefix, new_prefix):
    """Re-tint a pb/prep dough drawing into cookie dough (whites and the shadow colour stay) and rename its ids."""
    s = re.sub(r"#[0-9A-Fa-f]{6}\b", lambda m: tint(m.group(0)), s)
    return s.replace(old_prefix, new_prefix)


CK, CK_L, CK_D = tint(DOUGH), tint(DOUGH_L), tint(DOUGH_D)          # cookie dough: #F0C984, light, shade
CK_DD = mix(CK_D, "#8A5424", .35)                                    # dough edge / thickness
SPECK = "#9A6A36"                                                    # vanilla specks
FLOUR, FLOUR_D = "#FFFDF7", "#EDE3D2"
SUGAR, SUGAR_D = "#F7F4EE", "#DCD8D2"
BUTTER, BUTTER_L, BUTTER_D = "#FFE07A", "#FFF0B4", "#EDBE3E"
YOLK, YOLK_L, YOLK_D = "#FFB22E", "#FFD66B", "#EC8E14"
SHELL, SHELL_L, SHELL_D = "#F2D3AC", "#FBE8CF", "#D9AE7C"
PINK_I, PINK_IL, PINK_ID = "#F58FB0", "#FFC3D6", "#D9668C"          # pink icing
CHOC, CHOC_L, CHOC_D = "#7A4A2C", "#A26A44", "#553018"              # chocolate icing
CANDY, CANDY_L, CANDY_D = "#3E8FD8", "#8CC4F2", "#2A66A6"           # candy dot (blue: none of the other items is blue)
GRIP = {"star": (MUSTARD, "#FFD776", mix(MUSTARD, "#8A5A10", .3)), "heart": (CORAL, CORAL_L, CORAL_D),
        "circle": (TEAL, TEAL_L, TEAL_D), "flower": (GREEN, GREEN_L, GREEN_D)}

# ---- geometry shared by the sheet, the tray, the cookies and the cutters (see README-cookies.md) ----
SLOTS = [(220, 215), (500, 215), (780, 215), (220, 485), (500, 485), (780, 485)]   # in cookie-dough-flat AND baking-tray (1000x700)
SLOT_SIZE = 250
COOKIE_BOX = 260            # cookie-* viewBox 260x260, shape centred (130,130)
CUTTER_BOX = 320            # cutter-* viewBox 320x320
CUT_TOP, CUT_PRESS = (160, 148), (160, 172)   # cutter: top grip rim centre, cutting edge centre (= press point)


def shape_pts(kind, s=1.0):
    """Cookie / cutter outline centred on (0,0), about 220 wide at s=1."""
    pts = []
    if kind == "circle":
        return [(math.cos(a) * 104 * s, math.sin(a) * 104 * s) for a in [i / 40 * 2 * math.pi for i in range(40)]]
    if kind == "star":
        raw = []
        for i in range(10):
            a = -math.pi / 2 + i * math.pi / 5
            rr = 118 if i % 2 == 0 else 60
            raw.append((math.cos(a) * rr, math.sin(a) * rr + 12))
        # round the corners: sample a rounded polygon
        rad = 20
        for i in range(10):
            p0, p1, p2 = raw[i - 1], raw[i], raw[(i + 1) % 10]
            la, lb = math.hypot(p0[0] - p1[0], p0[1] - p1[1]), math.hypot(p2[0] - p1[0], p2[1] - p1[1])
            a = (p1[0] + (p0[0] - p1[0]) / la * rad, p1[1] + (p0[1] - p1[1]) / la * rad)
            b = (p1[0] + (p2[0] - p1[0]) / lb * rad, p1[1] + (p2[1] - p1[1]) / lb * rad)
            for t in (0, .5, 1):
                pts.append(((1 - t) ** 2 * a[0] + 2 * (1 - t) * t * p1[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * p1[1] + t * t * b[1]))
        return [(x * s, y * s) for x, y in pts]
    if kind == "heart":
        k = 7.0
        for i in range(56):
            t = i / 56 * 2 * math.pi
            x = 16 * math.sin(t) ** 3
            y = -(13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t))
            pts.append((x * k * s, (y - 2.2) * k * s))
        return pts
    if kind == "flower":
        pc = [(math.cos(-math.pi / 2 + j * math.pi / 3) * 64, math.sin(-math.pi / 2 + j * math.pi / 3) * 64) for j in range(6)]
        for i in range(96):
            a = -math.pi / 2 + i / 96 * 2 * math.pi
            dx, dy = math.cos(a), math.sin(a)
            best = 70
            for cx, cy in pc:
                b = dx * cx + dy * cy; c = cx * cx + cy * cy - 46 * 46
                disc = b * b - c
                if disc > 0:
                    best = max(best, b + math.sqrt(disc))
            pts.append((dx * best * s, dy * best * s))
        return pts
    raise ValueError(kind)


def shape_d(kind, s=1.0, t=1 / 6):
    return smooth(shape_pts(kind, s), t)


def save(name, s):
    """Write one SVG into images-b-cookies/ (never anywhere else). Returns size in bytes."""
    assert not any(f in s for f in FORBID), name
    path = os.path.join(COOK, name + ".svg")
    assert os.path.dirname(os.path.abspath(path)) == COOK
    with open(path, "w", encoding="utf8") as f:
        f.write(s)
    size = len(s.encode("utf8"))
    print(f"{name:22s} {size / 1024:6.1f} KB" + ("  OVER BUDGET" if size > 60 * 1024 else ""))
    return size


def run(items):
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    for name, fn in items.items():
        if not only or name in only:
            save(name, fn())
