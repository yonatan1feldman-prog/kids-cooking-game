# images-b-art (the art corner: five kinds of drawing on an easel; research/drawing-stages-spec.md).
# Uses the shared style-B kit (images-b/tools/pb.py, READ-ONLY) and writes into images-b-art/ only.
# Run: python tools/gen_art.py [names...]   then copy the SVGs into public/assets/images and bake the WebPs.
# The pictures she traces, joins and colours in are drawn by the game itself (src/core/artPictures.ts): only the
# things around them are art. The anchors the game relies on are printed at the end (ART.art in src/core/assets.ts).
import sys, os, math, random
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
OUTDIR = os.path.normpath(os.path.join(HERE, ".."))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "images-b", "tools")))
from pb import *  # noqa: F401,F403
import pb

# The seven paints (the same numbers as PAINTS in src/core/artPictures.ts).
PAINT = {
    "red": "#E8473A", "yellow": "#F7C933", "blue": "#3E8FE0", "green": "#5CB547",
    "pink": "#F27FB2", "purple": "#9A62C9", "orange": "#F58B2E",
}
RAINBOW = ["#E8473A", "#F58B2E", "#F7C933", "#5CB547", "#3E8FE0", "#9A62C9"]
SKY_T = "#8EC5E6"; SKY_B = "#DCEFF5"
GLASS = "#CFE6EE"
INK = "#5B3A29"

# the easel (1000x1000): the sheet's place on the board, the tray under it
EASEL_SHEET = (112, 100, 776, 620)   # x, y, w, h (5:4)
# the steamy window (800x640): the glass inside the frame
WINDOW_GLASS = (44, 44, 712, 520)
# the photo frame's window (as every photo-frame: 540 square at 80,80)
FRAME_WIN = (80, 80, 540, 540)


def wr(x, y, w, h, rad, j=1.5, seed=1, step=40):
    return pb.wrect(x, y, w, h, rad, j, seed, step)


def rect(x, y, w, h, fill, extra=""):
    return f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}" fill="{fill}"{extra}/>'


def doc(p, w, h, body, material="default", seed=3, sh=(4, 3.5, .33), cut=None, extra_defs=""):
    return svg(w, h, std_defs(p, material, seed, sh, (8, 7, .28), cut) + extra_defs, G(body, p + "gr"))


def tape(p, x, y, w=140, rot=-4):
    t = f' transform="rotate({rot} {x + w / 2} {y + 18})"'
    return G(P(wr(x, y, w, 40, 3, 1.4, 6), MUSTARD, ' opacity="0.85"' + t)
             + "".join(C(x + 16 + i * 18, y + 20, 4, WHITE, ' opacity="0.7"' + t) for i in range(int(w / 18) - 1)), p + "sh")


# ================================================================ paint pots
def pot_body(cx, cy, col, seed, rainbow=False):
    """A round pot of paint seen a little from above: a glass jar, the paint inside, a drip down the front."""
    s = P(wr(cx - 82, cy - 40, 164, 130, 30, 1.4, seed), "#F4EFE6")                    # the jar
    if rainbow:
        clip = f'<clipPath id="rbc{seed}"><path d="{wr(cx - 74, cy - 26, 148, 110, 26, 1.2, seed + 1)}"/></clipPath>'
        st = "".join(rect(cx - 80 + i * 27, cy - 40, 28, 140, c) for i, c in enumerate(RAINBOW))
        s += clip + f'<g clip-path="url(#rbc{seed})">{st}</g>'
        top = "".join(P(wob(cx - 50 + i * 20, cy - 34, 16, 10, .05, seed + 10 + i, 12), c) for i, c in enumerate(RAINBOW))
        s += P(wob(cx, cy - 36, 80, 22, .02, seed + 2, 26), mix(RAINBOW[2], WHITE, .2)) + top
    else:
        d = mix(col, "#000000", .22)
        l = mix(col, WHITE, .35)
        s += P(wr(cx - 74, cy - 26, 148, 110, 26, 1.2, seed + 1), col)
        s += P(wob(cx, cy - 36, 80, 22, .02, seed + 2, 26), d) + P(wob(cx, cy - 38, 72, 17, .03, seed + 3, 24), col)
        s += P(wob(cx - 22, cy - 41, 26, 7, .05, seed + 4, 14), l, ' opacity="0.9"')
        # a drip down the front
        s += P(f"M{cx + 20},{cy - 30} Q{cx + 30},{cy + 4} {cx + 26},{cy + 26} Q{cx + 22},{cy + 40} {cx + 16},{cy + 26} Q{cx + 12},{cy}"
               f" {cx + 8},{cy - 30}Z", d, ' opacity="0.9"')
    s += P(f"M{cx - 66},{cy - 18} Q{cx - 72},{cy + 30} {cx - 58},{cy + 74} L{cx - 46},{cy + 74} Q{cx - 58},{cy + 30} {cx - 52},{cy - 18}Z", WHITE, ' opacity="0.45"')
    return s


def brush(x0, y0, x1, y1, tip):
    """A paintbrush from (x0, y0) (the handle's end) to (x1, y1) (the tip)."""
    a = math.atan2(y1 - y0, x1 - x0)
    L = math.hypot(x1 - x0, y1 - y0)
    deg = math.degrees(a)
    t = f' transform="translate({n(x0)} {n(y0)}) rotate({n(deg)})"'
    s = P(f"M0,-8 L{n(L * .62)},-7 L{n(L * .62)},7 L0,8Z", WALNUT, t)
    s += P(f"M{n(L * .6)},-9 L{n(L * .74)},-10 L{n(L * .74)},10 L{n(L * .6)},9Z", METAL, t)
    s += P(f"M{n(L * .74)},-10 Q{n(L * .9)},-12 {n(L)},0 Q{n(L * .9)},12 {n(L * .74)},10Z", tip, t)
    return s


def art_pot(name):
    p = f"ap{name[:2]}-"
    rb = name == "rainbow"
    col = PAINT.get(name, RAINBOW[0])
    tip = col if not rb else RAINBOW[4]
    s = G(brush(170, 26, 120, 120, tip), p + "sh")
    s += G(pot_body(110, 140, col, 300 + len(name), rb), p + "cut")
    return doc(p, 220, 240, s, "smooth", seed=310 + len(name), sh=(4, 3.5, .3), cut={"rim": 2.6, "rough": 3.5})


# ================================================================ the easel
def art_easel():
    """1000x1000: a wooden easel. The board (the sheet is laid on it in code at EASEL_SHEET), a clip on top, a tray
    with chalk and a crayon below it, the two front legs and the back leg."""
    p = "aes-"
    legs = stroke("M300,700 L170,990", WALNUT_D, 46) + stroke("M300,700 L170,990", WALNUT, 34)
    legs += stroke("M700,700 L830,990", WALNUT_D, 46) + stroke("M700,700 L830,990", WALNUT, 34)
    back = stroke("M500,600 L500,985", WOOD_D, 36) + stroke("M500,600 L500,985", WOOD, 24)
    board = P(wr(70, 50, 860, 700, 18, 1.6, 401), WALNUT) + P(wr(84, 62, 832, 676, 14, 1.4, 402), WOOD)
    board += "".join(P(f"M{n(100 + i * 92)},70 Q{n(120 + i * 92)},400 {n(96 + i * 92)},730", "none", f' stroke="{WOOD_D}" stroke-width="3" opacity="0.35"') for i in range(9))
    tray = P(wr(40, 740, 920, 56, 12, 1.4, 403), WALNUT) + P(wr(48, 744, 904, 22, 8, 1, 404), WALNUT_L, ' opacity="0.8"')
    things = P(wr(150, 712, 140, 30, 12, 1, 405), WHITE) + P(wr(320, 714, 120, 28, 8, 1, 406), PAINT["blue"]) + P(wr(320, 714, 30, 28, 6, 1, 407), mix(PAINT["blue"], WHITE, .4))
    things += P(wr(700, 712, 150, 30, 8, 1, 408), PAINT["red"]) + P(f"M850,712 L880,727 L850,742Z", mix(PAINT["red"], "#000000", .2))
    clip = P(wr(440, 40, 120, 56, 10, 1, 409), METAL_D) + P(wr(450, 46, 100, 30, 8, 1, 410), METAL_L)
    s = G(back, p + "sh") + G(legs, p + "sh") + G(board, p + "cut") + G(tray + things, p + "sh") + G(clip, p + "sh")
    return doc(p, 1000, 1000, s, "rough", seed=411, sh=(5, 5, .3), cut={"rim": 3, "rough": 5, "freq": .12})


# ================================================================ the five picture cards
def card_base(p, w=300, h=300):
    return G(P(wr(10, 10, w - 20, h - 20, 30, 2, 3, step=18), CREAM), p + "cut")


def pick_trace():
    p = "apt-"
    s = card_base(p)
    cx, cy, r = 150, 150, 84
    dots = ""
    for i in range(24):
        a = i / 24 * 2 * math.pi
        dots += C(cx + math.cos(a) * r, cy + math.sin(a) * r, 7, "#B8A88E")
    s += G(dots, p + "sh")
    # half of it traced in glowing gold, the rays out
    s += G(stroke(f"M{cx - r},{cy} A{r},{r} 0 0 1 {cx + r},{cy}", "#FFE58A", 26, ' opacity="0.7"')
           + stroke(f"M{cx - r},{cy} A{r},{r} 0 0 1 {cx + r},{cy}", PAINT["orange"], 14), p + "sh")
    rays = "".join(stroke(f"M{n(cx + math.cos(a) * (r + 18))},{n(cy + math.sin(a) * (r + 18))} L{n(cx + math.cos(a) * (r + 40))},{n(cy + math.sin(a) * (r + 40))}", PAINT["yellow"], 10)
                   for a in [math.pi + i * math.pi / 4 for i in range(5)])
    s += G(rays, p + "sh")
    s += G(C(cx + r, cy, 16, WHITE) + C(cx + r, cy, 9, PAINT["orange"]), p + "sh")
    return doc(p, 300, 300, s, "rough", seed=420, cut={"rim": 3, "rough": 6, "freq": .12})


def pip(cx, cy, k, r=5):
    """k dots arranged like a die face."""
    at = {1: [(0, 0)], 2: [(-1, -1), (1, 1)], 3: [(-1, -1), (0, 0), (1, 1)], 4: [(-1, -1), (1, -1), (-1, 1), (1, 1)],
          5: [(-1, -1), (1, -1), (0, 0), (-1, 1), (1, 1)]}[k]
    return "".join(C(cx + dx * r * 1.6, cy + dy * r * 1.6, r, INK) for dx, dy in at)


def pick_dots():
    p = "apd-"
    s = card_base(p)
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        rr = 100 if i % 2 == 0 else 44
        pts.append((150 + math.cos(a) * rr, 158 + math.sin(a) * rr))
    line = "M" + " L".join(f"{n(x)},{n(y)}" for x, y in pts[:7])
    s += G(stroke("M" + " L".join(f"{n(x)},{n(y)}" for x, y in pts) + "Z", "#CDBFA6", 4, ' stroke-dasharray="10 10"'), p + "sh")
    s += G(stroke(line, PAINT["blue"], 12), p + "sh")
    for i, (x, y) in enumerate(pts):
        s += G(C(x, y, 17, WHITE) + C(x, y, 13, PAINT["red"] if i < 7 else "#C9B79A"), p + "sh")
    s += G(C(pts[7][0], pts[7][1], 24, "#FFE58A", ' opacity="0.8"') + C(pts[7][0], pts[7][1], 15, PAINT["yellow"]), p + "sh")
    return doc(p, 300, 300, s, "rough", seed=421, cut={"rim": 3, "rough": 6, "freq": .12})


def pick_colour():
    p = "apc-"
    s = card_base(p)
    wall = P("M70,140 L230,140 L230,250 L70,250Z", PAINT["yellow"])
    roof = P("M52,148 L150,60 L248,148Z", PAINT["red"])
    door = P(wr(126, 186, 48, 64, 8, 1, 5), "#FFFDF7")
    win = P(wr(84, 162, 34, 34, 4, 1, 6), PAINT["blue"])
    win2 = P(wr(184, 162, 34, 34, 4, 1, 7), "#FFFDF7")
    ink = "".join(stroke(d, INK, 6) for d in ("M70,140 L230,140 L230,250 L70,250Z", "M52,148 L150,60 L248,148Z",
                                             "M126,250 L126,186 L174,186 L174,250", "M84,162 h34 v34 h-34Z", "M184,162 h34 v34 h-34Z"))
    s += G(wall + roof + door + win + win2 + ink, p + "sh")
    # a drop of paint falling onto the door
    s += G(P("M150,150 Q164,172 160,184 Q150,196 140,184 Q136,172 150,150Z", PAINT["green"]), p + "sh")
    return doc(p, 300, 300, s, "rough", seed=422, cut={"rim": 3, "rough": 6, "freq": .12})


def wing(cx, cy, side, cols, seed):
    sx = 1 if side > 0 else -1
    up = f"M{cx},{cy} C{cx + sx * 30},{cy - 110} {cx + sx * 120},{cy - 120} {cx + sx * 110},{cy - 40} C{cx + sx * 104},{cy} {cx + sx * 40},{cy + 4} {cx},{cy}Z"
    lo = f"M{cx},{cy + 6} C{cx + sx * 90},{cy + 10} {cx + sx * 100},{cy + 90} {cx + sx * 50},{cy + 96} C{cx + sx * 20},{cy + 96} {cx + sx * 6},{cy + 50} {cx},{cy + 6}Z"
    s = P(up, cols[0]) + P(lo, cols[1])
    s += C(cx + sx * 70, cy - 60, 16, cols[2]) + C(cx + sx * 50, cy + 52, 11, cols[2]) + C(cx + sx * 92, cy - 70, 7, WHITE)
    return s


def pick_mirror():
    p = "apm-"
    s = card_base(p)
    s += G(stroke("M150,40 L150,268", "#CDBFA6", 4, ' stroke-dasharray="10 10"'), p + "sh")
    s += G(wing(150, 140, -1, (PAINT["pink"], PAINT["purple"], PAINT["yellow"]), 1) + wing(150, 140, 1, (PAINT["pink"], PAINT["purple"], PAINT["yellow"]), 2), p + "sh")
    s += G(P(wr(140, 96, 20, 120, 10, 1, 8), INK) + stroke("M146,100 Q130,70 116,66", INK, 5) + stroke("M154,100 Q170,70 184,66", INK, 5), p + "sh")
    # little sparkles: the magic
    for x, y in ((60, 60), (240, 70), (62, 236), (238, 230)):
        s += G(P(f"M{x},{y - 14} L{x + 4},{y - 4} L{x + 14},{y} L{x + 4},{y + 4} L{x},{y + 14} L{x - 4},{y + 4} L{x - 14},{y} L{x - 4},{y - 4}Z", PAINT["yellow"]), p + "sh")
    return doc(p, 300, 300, s, "rough", seed=423, cut={"rim": 3, "rough": 6, "freq": .12})


def pick_steam():
    p = "aps-"
    s = card_base(p)
    clip = f'<clipPath id="{p}gl"><rect x="56" y="56" width="188" height="188" rx="10"/></clipPath>'
    view = rect(56, 56, 188, 188, SKY_T) + P(wob(150, 260, 160, 70, .03, 3, 24), GREEN) + C(200, 100, 26, PAINT["yellow"])
    fog = rect(56, 56, 188, 188, "#F4F8F8", ' opacity="0.86"')
    # the wiped smile: the view shows through the fog where the finger went
    wipe = (f'<mask id="{p}mk"><rect x="0" y="0" width="300" height="300" fill="white"/>'
            + stroke("M96,150 Q150,214 204,150", "black", 30) + C(116, 110, 16, "black") + C(184, 110, 16, "black") + '</mask>')
    s += clip + wipe + G(f'<g clip-path="url(#{p}gl)">{view}<g mask="url(#{p}mk)">{fog}</g></g>', p + "sh")
    frame = P(wr(44, 44, 212, 212, 14, 1.4, 9), WALNUT) + rect(56, 56, 188, 188, "none")
    s += G(f'<path d="{wr(44, 44, 212, 212, 14, 1.4, 9)} M56,56 h188 v188 h-188Z" fill="{WALNUT}" fill-rule="evenodd"/>' + rect(146, 56, 8, 188, WALNUT), p + "cut")
    del frame
    return doc(p, 300, 300, s, "rough", seed=424, cut={"rim": 3, "rough": 6, "freq": .12})


# ================================================================ the home card
def card_art():
    p = "car-"
    L = [G(P(wr(10, 10, 380, 500, 36, 2.2, 3, step=18), CREAM), p + "cut")]
    clip = f'<clipPath id="{p}cl"><path d="{wr(34, 34, 332, 332, 26, 1.2, 4)}"/></clipPath>'
    scene = rect(20, 20, 360, 360, BG_WALL) + rect(20, 310, 360, 70, BG_WOOD)
    # the easel with a painting on it: a sun, a rainbow, a green hill
    ez = stroke("M140,250 L100,350", WALNUT, 16) + stroke("M260,250 L300,350", WALNUT, 16) + stroke("M200,220 L200,345", WOOD_D, 12)
    ez += P(wr(86, 70, 228, 190, 10, 1.2, 5), WALNUT) + P(wr(98, 80, 204, 168, 6, 1, 6), WHITE)
    paint = "".join(stroke(f"M{120 + i * 7},{214} A{80 - i * 7},{80 - i * 7} 0 0 1 {280 - i * 7},214", c, 8) for i, c in enumerate(RAINBOW))
    paint += C(258, 112, 18, PAINT["yellow"]) + P(wob(200, 262, 130, 40, .03, 7, 20), GREEN)
    ez += f'<g clip-path="url(#{p}pc)">{paint}</g>'
    pc = f'<clipPath id="{p}pc"><rect x="98" y="80" width="204" height="168"/></clipPath>'
    ez += P(wr(70, 254, 260, 18, 6, 1, 8), WALNUT_D)
    scene += G(ez, p + "sh")
    L.append(G(f'<g clip-path="url(#{p}cl)">{scene}</g>', p + "sh"))
    L.append(tape(p, 130, -4))
    # three paint pots and a brush below
    pots = "".join(pot_body(x, 432, c, 20 + i) for i, (x, c) in enumerate(((96, PAINT["red"]), (200, PAINT["yellow"]), (304, PAINT["blue"]))))
    L.append(G(f'<g transform="translate(40 99) scale(.8)">{pots}</g>', p + "sh"))
    defs = std_defs(p, "rough", seed=430, sh=(4, 3.5, .32), cut={"rim": 3, "rough": 7, "freq": .12}) + clip + pc
    return svg(400, 520, defs, G("".join(L), p + "gr"))


# ================================================================ the memory book's frame
def photo_frame_art():
    """700x780: a painted wooden frame, its window (FRAME_WIN) open, crayons and paint dabs around it."""
    p = "pfa-"
    x, y, w, h = FRAME_WIN
    outer = wr(30, 30, 640, 640, 26, 2, 1, step=24)
    inner = f"M{x},{y} h{w} v{h} h-{w}Z"
    s = G(f'<path d="{outer} {inner}" fill="{WOOD}" fill-rule="evenodd"/>', p + "cut")
    s += G(f'<path d="{wr(46, 46, 608, 608, 20, 1.4, 2, step=24)} M{x - 8},{y - 8} h{w + 16} v{h + 16} h-{w + 16}Z" fill="{WOOD_L}" fill-rule="evenodd" opacity="0.7"/>', p + "sh")
    rr = random.Random(5)
    dabs = ""
    for i in range(18):
        side = i % 4
        t = rr.uniform(.08, .92)
        px, py = [(40 + t * 620, 54), (646, 40 + t * 620), (40 + t * 620, 646), (54, 40 + t * 620)][side]
        dabs += P(wob(px, py, rr.uniform(9, 15), rr.uniform(7, 12), .2, 10 + i, 12, rr.uniform(0, 90)), list(PAINT.values())[i % 7])
    s += G(dabs, p + "sh")
    # crayons below
    cr = ""
    for i, c in enumerate(("red", "blue", "yellow", "green", "purple")):
        cx = 120 + i * 112
        a = (-8 + i * 4)
        t = f' transform="rotate({a} {cx} 720)"'
        cr += P(wr(cx - 20, 690, 40, 76, 6, 1, 30 + i), PAINT[c], t) + P(f"M{cx - 20},{692} L{cx},{660} L{cx + 20},{692}Z", mix(PAINT[c], "#000000", .15), t)
        cr += rect(cx - 20, 716, 40, 14, WHITE, ' opacity="0.6"' + t)
    s += G(cr, p + "sh")
    return doc(p, 700, 780, s, "rough", seed=440, sh=(5, 5, .3), cut={"rim": 3, "rough": 6, "freq": .12})


# ================================================================ the steamy window
def art_window_view():
    """800x640: what the kitchen window looks out on, close up: sky, hills, the garden fence, flowers, a tree. The
    hidden things (art-find-*) are laid on it in code; the fog is drawn in code over the glass."""
    p = "awv-"
    grad = (f'<linearGradient id="{p}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{SKY_T}"/>'
            f'<stop offset="0.8" stop-color="{SKY_B}"/></linearGradient>')
    s = rect(0, 0, 800, 640, f"url(#{p}sky)")
    s += G(P(wob(160, 520, 360, 170, .03, 3, 26), SAGE) + P(wob(640, 540, 380, 180, .03, 4, 26), SAGE_L), p + "sh")
    s += G(P(wob(400, 640, 520, 150, .02, 5, 28), GREEN), p + "sh")
    # the tree on the left
    s += G(P(wr(110, 330, 34, 200, 10, 1, 6), WALNUT) + P(wob(126, 300, 96, 86, .08, 7, 18), GREEN_D) + P(wob(110, 286, 70, 60, .1, 8, 16), GREEN), p + "sh")
    # the fence
    fence = ""
    for i in range(14):
        fx = 20 + i * 58
        fence += P(f"M{fx},{600} L{fx},{480} L{fx + 18},{462} L{fx + 36},{480} L{fx + 36},{600}Z", WHITE)
    fence += rect(0, 510, 800, 16, CREAM2) + rect(0, 560, 800, 16, CREAM2)
    s += G(fence, p + "sh")
    rr = random.Random(9)
    fl = ""
    for i in range(16):
        fx, fy = rr.uniform(20, 780), rr.uniform(600, 632)
        c = list(PAINT.values())[i % 7]
        fl += stroke(f"M{n(fx)},{n(fy + 30)} L{n(fx)},{n(fy)}", GREEN_D, 5)
        fl += "".join(C(fx + math.cos(a) * 9, fy + math.sin(a) * 9, 7, c) for a in [j * math.pi * 2 / 5 for j in range(5)]) + C(fx, fy, 6, MUSTARD)
    s += G(fl, p + "sh")
    return doc(p, 800, 640, s, "bg", seed=450, extra_defs=grad)


def art_window_frame():
    """800x640: the window's wooden frame and its cross, the glass open (WINDOW_GLASS); the sill along the bottom."""
    p = "awf-"
    gx, gy, gw, gh = WINDOW_GLASS
    outer = wr(4, 4, 792, 600, 16, 1.6, 1, step=30)
    s = G(f'<path d="{outer} M{gx},{gy} h{gw} v{gh} h-{gw}Z" fill="{TEAL}" fill-rule="evenodd"/>', p + "cut")
    s += G(rect(gx + gw / 2 - 9, gy, 18, gh, TEAL) + rect(gx, gy + gh * .45 - 9, gw, 18, TEAL), p + "sh")
    s += G(P(wr(0, 584, 800, 54, 10, 1.4, 2), WOOD) + P(wr(6, 588, 788, 16, 6, 1, 3), WOOD_L, ' opacity="0.8"'), p + "cut")
    return doc(p, 800, 640, s, "rough", seed=451, sh=(4, 4, .3), cut={"rim": 3, "rough": 5, "freq": .12})


def face(cx, cy, r, p):
    return C(cx - r * .35, cy - r * .1, r * .1, EYE) + C(cx + r * .35, cy - r * .1, r * .1, EYE) + stroke(
        f"M{n(cx - r * .3)},{n(cy + r * .25)} Q{n(cx)},{n(cy + r * .5)} {n(cx + r * .3)},{n(cy + r * .25)}", EYE, r * .07) + C(cx - r * .55, cy + r * .2, r * .12, CHEEK, ' opacity="0.7"') + C(cx + r * .55, cy + r * .2, r * .12, CHEEK, ' opacity="0.7"')


def find_sun():
    p = "afs-"
    rays = spiky(120, 120, 70, 112, 0, 360, 12, 3)
    s = G(P(rays, MUSTARD) + C(120, 120, 72, PAINT["yellow"]) + face(120, 122, 60, p), p + "cut")
    return doc(p, 240, 240, s, "smooth", seed=460, cut={"rim": 2.6, "rough": 3.5})


def find_bird():
    p = "afb-"
    body = P(wob(100, 92, 62, 44, .04, 3, 20), PAINT["blue"]) + P(wob(76, 70, 34, 30, .05, 4, 16), PAINT["blue"])
    body += P("M150,84 L196,62 L184,104Z", mix(PAINT["blue"], "#000000", .2))
    body += P(f"M88,96 Q120,60 150,92 Q122,112 88,96Z", mix(PAINT["blue"], WHITE, .4))
    body += P("M44,66 L22,74 L44,80Z", MUSTARD) + C(66, 62, 7, EYE) + C(64, 60, 2.5, WHITE)
    body += stroke("M90,134 L86,152", MUSTARD, 5) + stroke("M110,134 L114,152", MUSTARD, 5)
    return doc(p, 200, 160, G(body, p + "cut"), "smooth", seed=461, cut={"rim": 2.6, "rough": 3.5})


def find_cat():
    p = "afc-"
    O = CORAL; OD = CORAL_D; OL = CORAL_L
    s = P(wob(130, 160, 84, 56, .03, 3, 22), O)                      # the body, sitting
    s += stroke("M206,170 Q250,140 232,96", OD, 18)                  # the tail up
    s += P(wob(120, 92, 66, 56, .03, 4, 22), O)                      # the head
    s += P("M66,70 L74,22 L104,54Z", O) + P("M174,70 L166,22 L136,54Z", O)
    s += P("M76,62 L80,36 L96,54Z", OL) + P("M164,62 L160,36 L144,54Z", OL)
    s += stroke("M100,140 L100,200", OD, 4, ' opacity="0.5"') + stroke("M140,140 L140,200", OD, 4, ' opacity="0.5"')
    s += C(98, 88, 9, EYE) + C(142, 88, 9, EYE) + C(96, 85, 3, WHITE) + C(140, 85, 3, WHITE)
    s += P("M114,104 L126,104 L120,112Z", PINK_D) + stroke("M120,112 Q112,122 104,116", EYE, 3) + stroke("M120,112 Q128,122 136,116", EYE, 3)
    s += "".join(stroke(f"M{x0},{y0} L{x1},{y1}", EYE, 2.5, ' opacity="0.7"') for x0, y0, x1, y1 in
                 ((90, 108, 52, 100), (90, 114, 54, 118), (150, 108, 188, 100), (150, 114, 186, 118)))
    return doc(p, 260, 220, G(s, p + "cut"), "smooth", seed=462, cut={"rim": 2.6, "rough": 3.5})


def find_rainbow():
    p = "afr-"
    s = "".join(stroke(f"M{30 + i * 18},190 A{150 - i * 18},{150 - i * 18} 0 0 1 {330 - i * 18},190", c, 20) for i, c in enumerate(RAINBOW))
    s += P(wob(48, 186, 46, 24, .08, 3, 16), WHITE) + P(wob(312, 186, 46, 24, .08, 4, 16), WHITE)
    return doc(p, 360, 210, G(s, p + "cut"), "smooth", seed=463, cut={"rim": 2.6, "rough": 3.5})


ITEMS = {
    "card-art": card_art, "art-easel": art_easel, "photo-frame-art": photo_frame_art,
    "art-pick-trace": pick_trace, "art-pick-dots": pick_dots, "art-pick-colour": pick_colour,
    "art-pick-mirror": pick_mirror, "art-pick-steam": pick_steam,
    "art-window-view": art_window_view, "art-window-frame": art_window_frame,
    "art-find-sun": find_sun, "art-find-bird": find_bird, "art-find-cat": find_cat, "art-find-rainbow": find_rainbow,
}
for _c in list(PAINT) + ["rainbow"]:
    ITEMS[f"art-pot-{_c}"] = (lambda c: (lambda: art_pot(c)))(_c)


def save(name, s):
    path = os.path.join(OUTDIR, name + ".svg")
    with open(path, "w", encoding="utf8") as f:
        f.write(s)
    size = len(s.encode("utf8"))
    print(f"{name:24s} {size / 1024:6.1f} KB" + ("  OVER BUDGET" if size > 60 * 1024 else ""))


if __name__ == "__main__":
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    for k, fn in ITEMS.items():
        if not only or k in only:
            save(k, fn())
    print("anchors: EASEL_SHEET", EASEL_SHEET, "WINDOW_GLASS", WINDOW_GLASS, "FRAME_WIN", FRAME_WIN)
