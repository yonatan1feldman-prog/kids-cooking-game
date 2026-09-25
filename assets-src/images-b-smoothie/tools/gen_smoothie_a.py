# images-b-smoothie, part A: the four fruits to the images-b-prep vegetable spec: fruit-*-whole (560x420 grid published at
# 672x504 by gen_prep_b.veg_doc), fruit-*-slice (the 140 piece drawing at 240/140 by gen_prep_b.slice_from_topping) and
# fruit-*-inside (cut-face strip, 60 wide, as tall as the body; heights and profiles MEASURED from the same outlines that draw
# the whole fruit, with gen_prep_e.sample_path/column, exactly like gen_salad_a.py).
# Run: python tools/gen_smoothie_a.py [names...] [--profiles]   (writes into images-b-smoothie/ only)
import sys, os
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import math, random, json
from smoothiekit import *  # noqa: F401,F403

K = PB.VEG_K
BOXES = []


def check_r(name, pts, c, rmax):
    r = max(math.hypot(x - c[0], y - c[1]) for x, y in pts)
    BOXES.append((name, f"max r {r:.1f}", rmax, r <= rmax))


def pdoc(p, body, seed):
    """Same frame and filters as the images-b toppings / salad pieces (140x140, centre 70,70, r <= 58)."""
    return gen_items.doc(p, 140, 140, body, seed=seed, sh=(3, 2.5, .33), cut={"rim": 2.4, "rough": 3.5})


# ================= PIECES (140 box, top-down slices; also used flat inside the blender heaps) =================
def piece_banana_body(p, c=70):
    rim = wobp(c, c + 1, 52, 49, .02, 3, 26)
    g = G(P(smooth(rim), BAN_D), p + "cut")
    g += P(wob(c - .5, c, 48.5, 45.5, .02, 4, 26), BAN)                                    # thin yellow peel ring
    g += G(P(wob(c, c + .5, 44, 41, .025, 5, 26), BAN_F), p + "sh")                         # cream flesh
    g += P(wob(c, c + 1, 22, 20, .05, 6, 18), BAN_F2)                                       # core
    sd = ""
    for i in range(3):                                                                       # three seed rows (the banana "star")
        a = i / 3 * 2 * math.pi - math.pi / 2
        for rr in (7, 14):
            x, y = c + math.cos(a) * rr, c + 1 + math.sin(a) * rr
            sd += E(x, y, 2.6, 3.4, BAN_SEED, f' transform="rotate({n(math.degrees(a) + 90)} {n(x)} {n(y)})"')
    g += sd + C(c, c + 1, 2.4, BAN_SEED)
    g += P(f"M{c - 38},{c - 8} Q{c - 32},{c - 30} {c - 10},{c - 38} Q{c - 26},{c - 28} {c - 32},{c - 6}Z", WHITE, ' opacity="0.7"')
    return g, rim


def piece_strawberry_body(p, c=70):
    # a lengthwise slice: heart-ish outline (shoulders up, point down), red skin, pink flesh, white core with branches
    out = [(c + x * .95, c + 2 + y * .95) for x, y in [(0, -40), (22, -50), (44, -40), (52, -14), (44, 16), (24, 40), (0, 54), (-24, 40), (-44, 16), (-52, -14), (-44, -40), (-22, -50)]]
    check_r("piece-strawberry", out, (70, 70), 58)
    g = G(P(smooth(out), STR_D), p + "cut")
    g += P(smooth([(c + (x - c) * .93, c - 1.5 + (y - c) * .93) for x, y in out]), STR)
    g += G(P(smooth([(c + (x - c) * .8, c + (y - c) * .8) for x, y in out]), STR_F), p + "sh")
    core = [(c, c - 30), (8, -18), (10, 4), (5, 24), (0, 34), (-5, 24), (-10, 4), (-8, -18)]
    core = [core[0]] + [(c + x, c + y) for x, y in core[1:]]
    g += P(smooth(core), STR_F2)
    g += "".join(stroke(f"M{c},{c + dy} Q{c + sx * 14},{c + dy - 4} {c + sx * 26},{c + dy - 12}", STR_F2, 3.2, ' opacity="0.9"')
                 for dy in (-12, 4, 18) for sx in (-1, 1))
    g += "".join(E(c + math.cos(a) * 41, c + 2 + math.sin(a) * 38, 2.4, 3.4, STR_SEED) for a in [i / 14 * 2 * math.pi for i in range(14)])
    g += P(f"M{c - 38},{c - 16} Q{c - 32},{c - 38} {c - 12},{c - 42} Q{c - 26},{c - 32} {c - 32},{c - 12}Z", WHITE, ' opacity="0.55"')
    return g, out


def piece_mango_body(p, c=70):
    # a mango cheek, scored into cubes (the "mango hedgehog" cut): a thick two-tone skin rim (green to red) and a cube grid on the flesh,
    # so it never reads as an egg yolk or an apricot (review fix 1)
    out = wobp(c, c + 1, 56, 45, .02, 7, 26)
    grad = (f'<linearGradient id="{p}rk" x1="14" y1="120" x2="126" y2="20" gradientUnits="userSpaceOnUse">'
            f'<stop offset="0" stop-color="{MAN_R}"/><stop offset="0.5" stop-color="{MAN_O}"/><stop offset="1" stop-color="{MAN_G}"/></linearGradient>')
    g = grad + G(P(smooth(out), f"url(#{p}rk)"), p + "cut")
    flesh = wob(c, c + .5, 47, 36, .02, 9, 26)
    g += G(P(flesh, MAN_F), p + "sh")
    g += f'<clipPath id="{p}fl"><path d="{flesh}"/></clipPath>'
    cubes = ""
    for i in range(-3, 4):
        for j in range(-3, 4):
            x, y = c + i * 17 + (j % 2) * 3, c + j * 15
            cubes += f'<rect x="{n(x - 6.5)}" y="{n(y - 5.5)}" width="13" height="11" rx="4" fill="{MAN_FL}"/>'
    grid = stroke("".join(f"M{c + i * 17 - 30},{c - 50} L{c + i * 17 + 30},{c + 50}" for i in range(-5, 6))
                  + "".join(f"M{c - 60},{c + j * 15 - 8} L{c + 60},{c + j * 15 + 8}" for j in range(-4, 5)), MAN_FD, 2.6, ' opacity="0.8"')
    g += G(cubes + grid, None, f' clip-path="url(#{p}fl)"')
    g += P(f"M{c - 42},{c - 6} Q{c - 36},{c - 28} {c - 12},{c - 34} Q{c - 28},{c - 24} {c - 34},{c - 4}Z", WHITE, ' opacity="0.45"')
    return g, out


def piece_kiwi_body(p, c=70):
    out = wobp(c, c + 1, 55, 51, .02, 12, 26)
    g = G(P(smooth(out), KIW_D), p + "cut")
    g += P(wob(c - .5, c, 51, 47, .02, 13, 26), KIW)                                        # brown skin ring
    g += G(P(wob(c, c + .5, 47, 43, .02, 14, 26), KIW_F), p + "sh")                          # green flesh
    rays = "".join(stroke(f"M{n(c + math.cos(a) * 18)},{n(c + 1 + math.sin(a) * 17)} L{n(c + math.cos(a) * 40)},{n(c + 1 + math.sin(a) * 37)}", KIW_FL, 3, ' opacity="0.8"')
                   for a in [i / 18 * 2 * math.pi for i in range(18)])
    g += rays
    g += P(wob(c, c + 1, 15, 13, .08, 15, 14), KIW_C)                                       # pale core
    g += "".join(E(c + math.cos(a) * 21, c + 1 + math.sin(a) * 19.5, 1.9, 3.3, KIW_SEED, f' transform="rotate({n(math.degrees(a) + 90)} {n(c + math.cos(a) * 21)} {n(c + 1 + math.sin(a) * 19.5)})"')
                 for a in [i / 16 * 2 * math.pi + .1 for i in range(16)])
    g += P(f"M{c - 40},{c - 8} Q{c - 34},{c - 30} {c - 12},{c - 38} Q{c - 28},{c - 28} {c - 34},{c - 6}Z", WHITE, ' opacity="0.45"')
    return g, out


PIECES = {"banana": piece_banana_body, "strawberry": piece_strawberry_body, "mango": piece_mango_body, "kiwi": piece_kiwi_body}
PSEED = {"banana": 501, "strawberry": 503, "mango": 505, "kiwi": 507}


def piece_doc(fruit, p):
    g, out = PIECES[fruit](p)
    check_r("piece-" + fruit, out, (70, 70), 58)
    return pdoc(p, g, PSEED[fruit])


# ================= WHOLE FRUIT (560x420 grid -> 672x504, resting on the board at y ~ 396 grid) =================
def banana_axis(t):
    return 44 + t * 446, 256 + 84 * (1 - (2 * t - 1) ** 2)


def banana_pts(N=24):
    top, bot = [], []
    for i in range(N + 1):
        t = i / N
        x, yc = banana_axis(t)
        h = 57 * (1 - abs(2 * t - 1) ** 2.4) ** .45 * (.8 + .2 * t) + 6
        top.append((x, yc - h)); bot.append((x, yc + h * .95))
    return top + bot[::-1][1:-1]


def fruit_banana_whole():
    p = "fb-"
    pts = banana_pts()
    stem = "M478,250 Q500,236 516,214 Q526,198 540,196 Q552,200 548,214 Q534,238 506,270Z"
    L = [G(P(stem, mix(BAN_D, "#7A6A20", .35)) + P(smooth(pts, .14), BAN_D) + P(wob(46, 258, 11, 13, .08, 3, 12), BAN_TIP), p + "cut")]
    L.append(P(smooth([(x - 1, y - 5 if y < banana_axis((x - 44) / 446)[1] else y - 4) for x, y in pts], .14), BAN))
    # the ridge: a darker lengthwise edge, then the lit upper face
    ridge = [(x, yc + 10 - 20 * (1 - (2 * (x - 44) / 446 - 1) ** 2)) for x, yc in (banana_axis(t / 12) for t in range(1, 12))]
    L.append(stroke(smooth_open(ridge), BAN_D, 5, ' opacity="0.6"'))
    hl = [(x, yc - 34 * (1 - abs(2 * (x - 44) / 446 - 1) ** 2) - 4) for x, yc in (banana_axis(t / 12) for t in range(2, 11))]
    hl2 = [(x, y + 16 * (1 - abs(2 * (x - 44) / 446 - 1) ** 2) + 3) for x, y in hl[::-1]]
    L.append(P(smooth(hl + hl2, .12), BAN_L, ' opacity="0.9"'))
    L.append(P("M60,300 Q260,420 470,300 Q260,396 72,290Z", BAN_D, ' opacity="0.45"'))                        # belly shade
    r = random.Random(4)
    L.append("".join(P(wob(x, y, r.uniform(3, 5), r.uniform(2.5, 4), .15, i, 8), BAN_TIP, ' opacity="0.55"')
                     for i, (x, y) in enumerate(((180, 320), (196, 330), (330, 318), (352, 310), (270, 350), (400, 296)))))   # sugar spots
    L.append(P("M482,252 Q500,238 514,218 Q520,208 530,204 Q520,222 506,244Z", mix(BAN_L, GREEN_L, .35), ' opacity="0.8"'))
    L.append(P(wob(542, 204, 7, 8, .1, 5, 10), BAN_TIP))
    return PB.veg_doc(p, "".join(L), 511)


def straw_pts():
    pts = []
    for i in range(33):
        u = i / 32
        x = 96 + u * 360
        h = 150 * (u ** .62) * (1 - u ** 7) ** .35 + 4
        bump = 6 * math.sin(u * math.pi * 3) * u
        pts.append((x, 248 - h - bump))
    bot = []
    for i in range(33):
        u = i / 32
        x = 96 + u * 360
        h = 146 * (u ** .6) * (1 - u ** 7) ** .35 + 4
        bot.append((x, 250 + h))
    return pts + bot[::-1][1:-1]


def fruit_strawberry_whole():
    p = "fs-"
    pts = straw_pts()
    L = [G(P(smooth(pts, .14), STR_D), p + "cut")]
    L.append(P(smooth([(x - 1, y - 6 if y < 249 else y - 4) for x, y in pts], .14), STR))
    clip = f'<clipPath id="{p}b"><path d="{smooth(pts, .14)}"/></clipPath>'
    inner = P("M150,170 Q280,110 440,128 Q290,132 170,188Z", STR_L, ' opacity="0.85"')                          # gloss
    inner += P("M100,300 Q280,420 470,330 L470,420 L100,420Z", STR_D, ' opacity="0.4"')                          # shaded belly
    # seeds: little yellow teardrops sitting in small dimples, in staggered rows following the body
    sd = ""
    rj = random.Random(5)
    for row in range(-5, 6):
        for col in range(9):
            x = 140 + col * 38 + (19 if row % 2 else 0)
            u = (x - 96) / 360
            if u > .95: continue
            h = 150 * (u ** .62) * (1 - u ** 7) ** .35
            y = 250 + row * h / 5.6
            if abs(row) * h / 5.6 > h - 18: continue
            x += rj.uniform(-5, 5); y += rj.uniform(-4, 4)
            sd += E(x + 1, y + 1.5, 6, 7.5, STR_D, ' opacity="0.55"') + E(x, y, 3.8, 5.6, STR_SEED)
    L.append(clip + G(inner + sd, None, f' clip-path="url(#{p}b)"'))
    # green calyx (leaves) at the right: not cut (like the pepper stem)
    cal = ""
    for a, ln in ((-80, 70), (-40, 84), (0, 76), (40, 84), (80, 70), (-60, 60), (60, 60)):
        ra = math.radians(a)
        tx, ty = 452 + math.cos(ra) * ln * .7, 250 + math.sin(ra) * ln * 1.4
        cal += P(f"M452,250 Q{n((452 + tx) / 2 - math.sin(ra) * 16)},{n((250 + ty) / 2 + math.cos(ra) * 16)} {n(tx)},{n(ty)} "
                 f"Q{n((452 + tx) / 2 + math.sin(ra) * 16)},{n((250 + ty) / 2 - math.cos(ra) * 16)} 452,250Z", LEAF_D if a % 40 else LEAF)
    cal += P(wob(452, 250, 20, 30, .06, 7, 12), LEAF_D)
    cal += P("M462,246 Q496,240 516,226 Q528,220 532,230 Q520,248 470,262Z", LEAF_D) + P("M466,248 Q498,242 516,230 Q510,244 472,256Z", LEAF_L, ' opacity="0.8"')
    L.append(G(cal, p + "cut"))
    return PB.veg_doc(p, "".join(L), 513)


def mango_pts():
    return polar(282, 264, lambda a: (1 / math.sqrt((math.cos(a) / 226) ** 2 + (math.sin(a) / (132 if math.sin(a) < 0 else 128)) ** 2))
                 * (1 + .05 * math.cos(2 * a + 2.4) + .03 * math.sin(3 * a)), 44)


def fruit_mango_whole():
    p = "fm-"
    pts = mango_pts()
    grad = (f'<linearGradient id="{p}sk" x1="90" y1="330" x2="490" y2="150" gradientUnits="userSpaceOnUse">'
            f'<stop offset="0" stop-color="{MAN_R}"/><stop offset="0.35" stop-color="{MAN_O}"/><stop offset="0.68" stop-color="{MAN_Y}"/>'
            f'<stop offset="1" stop-color="{MAN_G}"/></linearGradient>')
    L = [G(P(smooth(pts), mix(MAN_D, "#8A3A12", .25)) + P(wob(508, 244, 14, 10, .08, 3, 10), WALNUT_D), p + "cut")]
    L.append(P(smooth([(x - 1, y - 6 if y < 264 else y - 4) for x, y in pts]), f"url(#{p}sk)"))
    L.append(P(wob(200, 206, 110, 58, .05, 5, 20, -12), MAN_R, ' opacity="0.35"'))                            # blush
    L.append(P("M110,214 Q180,146 300,138 Q200,160 128,232Z", "#FFF0B8", ' opacity="0.75"'))                    # gloss
    L.append(f'<clipPath id="{p}b"><path d="{smooth(pts)}"/></clipPath>' + G(P("M60,300 Q280,430 520,290 L520,420 L60,420Z", MAN_D, ' opacity="0.3"'), None, f' clip-path="url(#{p}b)"'))
    r = random.Random(9)
    L.append("".join(C(r.uniform(120, 460), r.uniform(180, 340), 2.4, "#FFF3C0", ' opacity="0.7"') for _ in range(24)))   # lenticels
    L.append(P(wob(502, 242, 7, 6, .1, 4, 10), mix(WALNUT_D, "#3A200F", .3)))
    L.append(P("M506,238 Q530,214 560,212 Q546,236 510,248Z", LEAF_D) + P("M510,238 Q532,220 552,216 Q538,232 512,244Z", LEAF_L, ' opacity="0.7"'))
    return PB.veg_doc(p, "".join(L), 515).replace("<defs>", "<defs>" + grad, 1)


def kiwi_pts():
    return polar(280, 262, lambda a: 1 / math.sqrt((math.cos(a) / 214) ** 2 + (math.sin(a) / 136) ** 2) * (1 + .025 * math.sin(2 * a + .6)), 40)


def fruit_kiwi_whole(fuzz_n=120):
    p = "fk-"
    pts = kiwi_pts()
    L = [G(P(smooth(pts), KIW_D), p + "cut")]
    L.append(P(smooth([(x - 1, y - 6 if y < 262 else y - 4) for x, y in pts]), KIW))
    L.append(P(wob(250, 196, 150, 56, .05, 5, 20, -4), KIW_L, ' opacity="0.55"'))
    L.append(f'<clipPath id="{p}b"><path d="{smooth(pts)}"/></clipPath>' + G(P("M50,300 Q280,430 520,290 L520,420 L50,420Z", KIW_D, ' opacity="0.4"'), None, f' clip-path="url(#{p}b)"'))
    r = random.Random(11)
    fuzz = ""
    for _ in range(fuzz_n):                                                                 # fuzzy skin: short soft hairs
        a = r.uniform(0, 2 * math.pi); rr = math.sqrt(r.uniform(0, .86))
        x, y = 280 + math.cos(a) * 214 * rr, 262 + math.sin(a) * 136 * rr
        d = r.uniform(-.6, .6)
        fuzz += stroke(f"M{n(x)},{n(y)} l{n(math.cos(d) * 9)},{n(math.sin(d) * 9 + 3)}", r.choice([KIW_D, KIW_L, "#D8C08A"]), 2.6, ' opacity="0.75"')
    L.append(fuzz)
    L.append(P(wob(66, 262, 8, 12, .1, 3, 10), KIW_D) + P(wob(492, 258, 12, 14, .08, 4, 12), mix(KIW_D, "#3A200F", .3)) + P(wob(490, 256, 6, 7, .1, 5, 10), KIW_L))
    return PB.veg_doc(p, "".join(L), 517)


# ---------------- measured profiles + strips (same method as gen_prep_e / gen_salad_a) ----------------
OUTLINES = {"banana": lambda: [smooth(banana_pts(), .14)], "strawberry": lambda: [smooth(straw_pts(), .14)],
            "mango": lambda: [smooth(mango_pts())], "kiwi": lambda: [smooth(kiwi_pts())]}
SPAN_GRID = {"banana": (40, 486), "strawberry": (96, 446), "mango": (56, 500), "kiwi": (66, 494)}   # stem / calyx / nub not cut
VEG_SPAN = {k: (round(a * K), round(b * K)) for k, (a, b) in SPAN_GRID.items()}


def profile(fruit, step=24):
    polys = [pp for d in OUTLINES[fruit]() for pp in PE.sample_path(d)]
    x0, x1 = VEG_SPAN[fruit]
    out, x = [], x0 + 4
    while x <= x1 - 4:
        c = PE.column(polys, x / K)
        if c:
            out.append([round(x), round(c[0] * K, 1), round(c[1] * K, 1)])
        x += step
    return out


def strip_height(fruit):
    return math.ceil(max(b - t for _, t, b in profile(fruit, 4)))


def banana_inside():
    p = "bi-"; H = strip_height("banana"); c = H / 2
    L = [G(P(PE.lens(30, c, 27, c - 1), BAN_D), p + "cut")]
    L.append(P(PE.lens(30, c, 24, c - 4), BAN))
    L.append(P(PE.lens(30, c, 21, c - 8), BAN_F))
    L.append(P(PE.lens(30, c, 11, c * .45), BAN_F2))
    L.append("".join(E(30 + (3 if i % 2 else -3), c + f * c, 2.4, 3.6, BAN_SEED) for i, f in enumerate((-.22, 0, .22))))
    L.append(P(PE.lens(23, c - c * .3, 3, c * .3), WHITE, ' opacity="0.6"'))
    return PE.strip_doc(p, H, "".join(L), 521)


def strawberry_inside():
    p = "si-"; H = strip_height("strawberry"); c = H / 2
    L = [G(P(PE.lens(30, c, 27, c - 1), STR_D), p + "cut")]
    L.append(P(PE.lens(30, c, 24, c - 4), STR))
    L.append(P(PE.lens(30, c, 20, c - 12), STR_F))
    L.append(P(PE.lens(30, c, 8, c * .72), STR_F2))
    L.append("".join(stroke(f"M30,{n(c + f * c)} L{30 + sx * 15},{n(c + f * c - 10)}", STR_F2, 3, ' opacity="0.9"') for f in (-.4, -.1, .2, .5) for sx in (-1, 1)))
    L.append("".join(E(30 + sx * 22, c + f * c, 2.2, 3.2, STR_SEED) for f in (-.6, -.3, 0, .3, .6) for sx in (-1, 1)))
    L.append(P(PE.lens(23, c - c * .3, 3, c * .3), WHITE, ' opacity="0.5"'))
    return PE.strip_doc(p, H, "".join(L), 523)


def mango_inside():
    p = "mi-"; H = strip_height("mango"); c = H / 2
    L = [G(P(PE.lens(30, c, 27, c - 1), MAN_D), p + "cut")]
    L.append(P(PE.lens(30, c, 24, c - 4), MAN_O))
    L.append(P(PE.lens(30, c, 21, c - 8), MAN_F))
    L.append(P(PE.lens(30, c, 13, c * .7), MAN_FL, ' opacity="0.8"'))
    L.append(P(PE.lens(31, c + 4, 5, c * .45), MAN_PIT))                                        # the flat pit, seen edge-on
    L.append("".join(stroke(f"M{30 + sx * 16},{n(c - c * .6)} Q{30 + sx * 19},{n(c)} {30 + sx * 16},{n(c + c * .6)}", MAN_FD, 2, ' opacity="0.55"') for sx in (-1, 1)))
    L.append(P(PE.lens(23, c - c * .3, 3, c * .3), WHITE, ' opacity="0.55"'))
    return PE.strip_doc(p, H, "".join(L), 525)


def kiwi_inside():
    p = "ki-"; H = strip_height("kiwi"); c = H / 2
    L = [G(P(PE.lens(30, c, 27, c - 1), KIW_D), p + "cut")]
    L.append(P(PE.lens(30, c, 24, c - 4), KIW))
    L.append(P(PE.lens(30, c, 21, c - 8), KIW_F))
    L.append(P(PE.lens(30, c, 13, c * .78), KIW_FL, ' opacity="0.85"'))
    L.append(P(PE.lens(30, c, 5, c * .62), KIW_C))
    L.append("".join(E(30 + sx * 8, c + f * c, 1.8, 3.2, KIW_SEED) for f in (-.5, -.3, -.1, .1, .3, .5) for sx in (-1, 1)))
    L.append(P(PE.lens(23, c - c * .3, 3, c * .3), WHITE, ' opacity="0.45"'))
    return PE.strip_doc(p, H, "".join(L), 527)


FRUITS = ["banana", "strawberry", "mango", "kiwi"]
WHOLE = {"banana": fruit_banana_whole, "strawberry": fruit_strawberry_whole, "mango": fruit_mango_whole, "kiwi": fruit_kiwi_whole}
INSIDE = {"banana": banana_inside, "strawberry": strawberry_inside, "mango": mango_inside, "kiwi": kiwi_inside}
PREFIX = {"banana": "pb", "strawberry": "ps", "mango": "pm", "kiwi": "pk"}

ITEMS = {}
for _f in FRUITS:
    ITEMS[f"fruit-{_f}-whole"] = WHOLE[_f]
    ITEMS[f"fruit-{_f}-slice"] = (lambda f=_f: PB.slice_from_topping(lambda: piece_doc(f, PREFIX[f] + "-"), PREFIX[f] + "-", "s" + PREFIX[f] + "-"))
    ITEMS[f"fruit-{_f}-inside"] = INSIDE[_f]

if __name__ == "__main__":
    run(ITEMS)
    for row in BOXES:
        print("  geometry", "OK " if row[3] else "BAD", *row[:3])
    if "--profiles" in sys.argv:
        print(json.dumps({v: {"span": VEG_SPAN[v], "stripH": strip_height(v), "profile": profile(v)} for v in VEG_SPAN}, separators=(",", ":")))
