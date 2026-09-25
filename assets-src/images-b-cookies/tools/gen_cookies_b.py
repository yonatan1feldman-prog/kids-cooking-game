# images-b-cookies, part B: the rolled sheet (cookie-dough-flat), the four cutters and cookies, the baking tray,
# decorations (icing tubes, icing blobs, sprinkles, candy dot), the recipe card and the photo frame.
# Run: python tools/gen_cookies_b.py [names...]   (writes into images-b-cookies/ only)
import math, random, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cookiekit import *  # noqa: F401,F403
import gen_cookies_a as CA

SHAPES = ["star", "heart", "circle", "flower"]


def at(d, x, y, s=1.0, extra=""):
    """Place a shape (path data, or '#id' of a path defined once) at (x, y), scale s."""
    if d.startswith("#"):
        return f'<use href="{d}" transform="translate({n(x)} {n(y)})' + (f' scale({s})' if s != 1 else "") + f'"{extra}/>'
    return f'<path d="{d}" transform="translate({n(x)} {n(y)})' + (f' scale({s})' if s != 1 else "") + f'"{extra}/>'


# ================= COOKIE (260x260, raw dough, shape centred (130,130)) =================
def cookie_body(p, kind, cx, cy, s=1.0, seed=1):
    """Raw cookie seen from above with a little thickness. Returns markup (uses the {p}bl / {p}sh filters)."""
    sid = f"{p}s{seed}"
    pre = f'<defs><path id="{sid}" d="{shape_d(kind)}"/></defs>'
    d = "#" + sid
    g = pre + G(at(d, cx + 3 * s, cy + 14 * s, s, f' fill="{SH}" opacity="0.5"'), p + "bl")
    g += at(d, cx, cy + 11 * s, s, f' fill="{mix(CK_DD, "#6B3A1A", .25)}"')             # the side (thickness), dark enough to read on the sheet
    g += at(d, cx, cy + 6 * s, s, f' fill="{CK_D}"')
    g += at(d, cx, cy, s, f' fill="{CK}"')
    cid = f"{p}k{seed}"
    inner = (at(d, cx - 8 * s, cy - 10 * s, s * .74, f' fill="{CK_L}" opacity="0.95"')
             + at(d, cx + 14 * s, cy + 16 * s, s * 1.0, f' fill="none" stroke="{CK_D}" stroke-width="22" opacity="0.45"'))
    g += f'<clipPath id="{cid}">{at(d, cx, cy, s)}</clipPath>' + G(G(inner, p + "bl"), None, f' clip-path="url(#{cid})"')
    r = random.Random(seed)
    for _ in range(12):
        a, rr = r.uniform(0, 6.283), r.uniform(0, 58) * s
        g += C(cx + math.cos(a) * rr, cy + math.sin(a) * rr, r.uniform(1.6, 2.6) * s, SPECK, ' opacity="0.55"')
    for _ in range(5):
        a, rr = r.uniform(0, 6.283), r.uniform(0, 60) * s
        g += C(cx + math.cos(a) * rr, cy + math.sin(a) * rr, 2.4 * s, WHITE, ' opacity="0.85"')        # sugar glints
    g += P(wob(cx - 40 * s, cy - 44 * s, 20 * s, 8 * s, .1, seed, 10, -30), "#FFF3D6", ' opacity="0.8"')
    return g


def cookie(kind):
    p = f"ck{kind[:2]}-"
    return doc(p, 260, 260, cookie_body(p, kind, 130, 130), material="smooth", seed=301 + SHAPES.index(kind), blur=5)


# ================= CUTTER (320x320, hollow metal band with a coloured grip rim) =================
def cutter(kind):
    p = f"cu{kind[:2]}-"
    d = "#" + p + "s"
    col, col_l, col_d = GRIP[kind]
    tx, ty = CUT_TOP
    px, py = CUT_PRESS
    L = [f'<defs><path id="{p}s" d="{shape_d(kind)}"/></defs>', G(at(d, px + 4, py + 8, 1, f' fill="none" stroke="{SH}" stroke-width="16" opacity="0.4"'), p + "bl")]
    wall = ""
    steps = list(range(py - ty, -1, -3))
    for i, dy in enumerate(steps):                                   # the metal wall: the outline extruded downwards
        c = mix(METAL, METAL_D, dy / (py - ty) * .8)
        wall += at(d, tx, ty + dy, 1, f' fill="none" stroke="{c}" stroke-width="9"')
    wall += at(d, tx, py - 2, 1, f' fill="none" stroke="{METAL_L}" stroke-width="3" stroke-dasharray="60 140 30 200" opacity="0.9"')   # glints on the wall
    L.append(G(wall, p + "cut"))
    rim = at(d, tx, ty, 1, f' fill="none" stroke="{col_d}" stroke-width="22"')
    rim += at(d, tx, ty - 3, 1, f' fill="none" stroke="{col}" stroke-width="18"')
    rim += at(d, tx - 2, ty - 7, 1, f' fill="none" stroke="{col_l}" stroke-width="5" stroke-dasharray="90 50 40 70" opacity="0.9"')
    L.append(G(rim, p + "sh"))
    return doc(p, CUTTER_BOX, CUTTER_BOX, "".join(L), material="default", seed=311 + SHAPES.index(kind), blur=5)


# ================= ROLLED SHEET (1000x700; 6 slots, see cookiekit.SLOTS) =================
def dough_flat():
    p = "cdf-"
    x0, y0, x1, y1 = 34, 44, 966, 648
    L = [G(P(wrect(x0 + 6, y0 + 22, x1 - x0, y1 - y0, 90, 3, 2, 30), SH, ' opacity="0.35"'), p + "bl")]
    L.append(P(wrect(x0, y0 + 16, x1 - x0, y1 - y0, 90, 3, 3, 30), CK_DD))
    L.append(P(wrect(x0, y0 + 9, x1 - x0, y1 - y0, 90, 3, 4, 30), CK_D))
    L.append(G(P(wrect(x0, y0, x1 - x0, y1 - y0, 90, 3, 5, 30), CK), p + "cut"))
    sheet = wrect(x0, y0, x1 - x0, y1 - y0, 90, 3, 5, 30)
    inner = (P(wrect(110, 100, 640, 330, 120, 4, 6, 40), CK_L, ' opacity="0.85"')
             + P(sheet, "none", f' stroke="{CK_D}" stroke-width="40" opacity="0.4" transform="translate(12 16)"'))
    L.append(f'<clipPath id="{p}s"><path d="{sheet}"/></clipPath>' + G(G(inner, p + "bl"), None, f' clip-path="url(#{p}s)"'))
    # the rolling pin's soft tracks (long, faint, horizontal)
    tr = "".join(stroke(f"M{x0 + 60},{y} Q500,{y + r_} {x1 - 60},{y + 4}", c, w_, f' opacity="{o}"')
                 for y, r_, c, w_, o in ((150, 6, CK_L, 10, .7), (330, -4, CK_D, 6, .35), (420, 5, CK_L, 12, .6), (570, -3, CK_D, 6, .3)))
    L.append(G(tr, p + "bl"))
    r = random.Random(7)
    L.append("".join(C(r.uniform(80, 920), r.uniform(80, 620), r.uniform(1.8, 2.8), SPECK, ' opacity="0.5"') for _ in range(60)))
    L.append("".join(C(r.uniform(70, 930), r.uniform(70, 630), r.uniform(2, 4), WHITE, ' opacity="0.8"') for _ in range(40)))
    L.append(P(wob(160, 600, 70, 18, .2, 3, 12, -6), WHITE, ' opacity="0.45"') + P(wob(860, 110, 60, 14, .2, 4, 12, 8), WHITE, ' opacity="0.45"'))
    return doc(p, 1000, 700, "".join(L), material="smooth", seed=321, sh=(5, 4, .3), blur=9)


# ================= BAKING TRAY (1000x700, same slots as the sheet) =================
def baking_tray():
    p = "bt-"
    L = [G(P(wrect(18, 34, 970, 650, 60, 2, 1, 40), SH, ' opacity="0.36"'), p + "bl")]
    L.append(G(P(wrect(10, 18, 980, 654, 60, 1.5, 2, 40), METAL_D), p + "cut"))
    L.append(P(wrect(12, 14, 976, 648, 58, 1.2, 3, 40), METAL))
    L.append(P(wrect(22, 22, 956, 632, 52, 1, 4, 40), METAL_L, ' opacity="0.7"'))
    L.append(P(wrect(44, 50, 912, 590, 38, 1, 5, 40), METAL_D))                              # inner wall (dark)
    L.append(P(wrect(50, 60, 900, 574, 34, 1, 6, 40), mix(METAL, METAL_D, .3)))                # tray floor
    # two handle holes in the short rims
    L.append(P(wrect(-2, 290, 34, 120, 16, .6, 7), METAL_D) + P(wrect(968, 290, 34, 120, 16, .6, 8), METAL_D))
    L.append(P(wrect(16, 300, 12, 100, 6, .4, 9), mix(METAL_D, SH, .5)) + P(wrect(972, 300, 12, 100, 6, .4, 10), mix(METAL_D, SH, .5)))
    # baking paper
    paper = wrect(66, 74, 868, 548, 20, 3, 11, 30)
    L.append(G(P(paper, "#FBF3E2"), p + "sh"))
    L.append(f'<clipPath id="{p}pp"><path d="{paper}"/></clipPath>'
             + G(G(P("M66,74 L420,74 Q300,300 66,420Z", WHITE, ' opacity="0.6"') + P("M934,622 L600,622 Q800,420 934,300Z", "#E9DCC2", ' opacity="0.7"'), p + "bl"), None, f' clip-path="url(#{p}pp)"'))
    L.append(stroke("M120,90 Q240,82 330,96", "#E9DCC2", 3, ' opacity="0.8"') + stroke("M640,600 Q760,610 870,596", "#E9DCC2", 3, ' opacity="0.8"'))
    L.append(P("M60,40 Q300,26 520,30 Q300,40 70,56Z", WHITE, ' opacity="0.6"'))                # rim shine
    return doc(p, 1000, 700, "".join(L), material="default", seed=331, sh=(4, 3.5, .33), blur=10, paper={"fibre": .08, "tooth": .3})


# ================= DECORATIONS =================
def icing_tube(kind):
    """Soft squeeze tube (260x520), nozzle down; nozzle tip (130, 500)."""
    p = f"it{kind[0]}-"
    col, col_l, col_d = (PINK_I, PINK_IL, PINK_ID) if kind == "pink" else (CHOC, CHOC_L, CHOC_D)
    body = "M58,70 L202,70 Q214,70 214,84 L206,330 Q200,380 160,400 L100,400 Q60,380 54,330 L46,84 Q46,70 58,70Z"
    L = [G(P(body, col), p + "cut")]
    L.append(f'<clipPath id="{p}b"><path d="{body}"/></clipPath>'
             + G(G(E(190, 250, 40, 200, col_d, ' opacity="0.6"') + E(84, 210, 22, 150, col_l, ' opacity="0.7"'), p + "bl"), None, f' clip-path="url(#{p}b)"'))
    # crimped end (top), cream band with dots
    L.append(G(P(wrect(38, 30, 184, 48, 10, .6, 3), col_d) + "".join(P(wrect(48 + i * 20, 36, 8, 36, 4, .3, i), col, ' opacity="0.8"') for i in range(9)), p + "sh"))
    L.append(P("M50,210 L210,210 L208,268 L52,268Z", CREAM) + "".join(C(74 + i * 28, 239, 8, [PINK_I, CANDY, MUSTARD, GREEN, CORAL, PINK_I][i]) for i in range(6)))
    # nozzle: white cone with a swirl of icing peeking out
    L.append(G(P("M96,396 L164,396 L148,470 Q130,478 112,470Z", WHITE) + P("M104,396 L124,396 L122,466 L114,466Z", "#E8E4DC", ' opacity="0.7"')
               + stroke("M100,410 L160,410", "#D8D2C8", 3) + stroke("M104,430 L156,430", "#D8D2C8", 3) + stroke("M108,450 L152,450", "#D8D2C8", 3), p + "sh"))
    L.append(G(P("M112,470 Q130,462 148,470 Q146,494 130,504 Q114,494 112,470Z", col) + P(wob(124, 480, 5, 8, .1, 3, 10), col_l, ' opacity="0.9"'), p + "sh"))
    L.append(P(wrect(66, 90, 12, 110, 6, .4, 4), WHITE, ' opacity="0.55"'))
    return doc(p, 260, 520, "".join(L), material="smooth", seed=341 + (kind == "choc"), sh=(4, 3.5, .33))


def icing_blob(kind):
    """A piped swirl of icing seen from above (140x140, centre (70,70), like topping-*)."""
    p = f"ib{kind[0]}-"
    col, col_l, col_d = (PINK_I, PINK_IL, PINK_ID) if kind == "pink" else (mix(CHOC, CHOC_L, .35), "#C08A5E", CHOC_D)
    L = [G(P(wob(70, 72, 56, 54, .06, 3, 20), col_d), p + "cut")]
    L.append(P(wob(69, 69, 52, 50, .06, 4, 20), col))
    L.append(P(wob(66, 64, 36, 34, .07, 5, 18), col_l, ' opacity="0.55"'))
    sw = "M70,70 m-40,4 a40,38 0 1 1 80,-4 a34,32 0 1 1 -64,6 a24,22 0 1 1 44,-4 a12,11 0 1 1 -22,2"
    L.append(stroke(sw, col_d, 5, ' opacity="0.6"'))
    L.append(P(wob(52, 48, 13, 6, .1, 6, 10, -30), WHITE, ' opacity="0.8"') + C(90, 56, 3.5, WHITE, ' opacity="0.8"'))
    return doc(p, 140, 140, "".join(L), material="smooth", seed=351 + (kind == "choc"), blur=4)


def sprinkles_cluster():
    p = "spr-"
    r = random.Random(17)
    cols = [PINK_I, CANDY, MUSTARD, GREEN, CORAL, WHITE, "#B785D6"]
    s = ""
    for i in range(26):
        a, rr = r.uniform(0, 6.283), math.sqrt(r.random()) * 46
        x, y, rot = 70 + math.cos(a) * rr, 70 + math.sin(a) * rr, r.uniform(0, 180)
        c = cols[i % len(cols)]
        s += f'<rect x="{n(x - 10)}" y="{n(y - 3.5)}" width="20" height="7" rx="3.5" fill="{c}" transform="rotate({n(rot)} {n(x)} {n(y)})"/>'
    return doc(p, 140, 140, G(s, p + "sh"), material="smooth", seed=361, sh=(2, 1.5, .35), blur=4)


def candy_dot():
    p = "cd-"
    L = [G(C(70, 72, 50, CANDY_D), p + "cut"), C(69, 68, 46, CANDY), P(wob(62, 60, 30, 26, .05, 3, 16), CANDY_L, ' opacity="0.6"'),
         P(wob(50, 46, 14, 7, .1, 4, 10, -35), WHITE, ' opacity="0.9"'), C(88, 88, 4, WHITE, ' opacity="0.6"')]
    return doc(p, 140, 140, "".join(L), material="smooth", seed=371, blur=4)


# ================= RECIPE CARD (400x520, the card-pizza layout) =================
def card_cookies():
    p = "crc-"
    L = [G(P(gen_kitchen.wrect(10, 10, 380, 500, 36, 2.2, 3, step=18), CREAM), p + "cut")]
    pat = (f'<pattern id="{p}gh" width="40" height="40" patternUnits="userSpaceOnUse">'
           f'<rect width="40" height="40" fill="#FBE4EC"/><rect width="20" height="40" fill="{PINK_I}" opacity="0.25"/>'
           f'<rect width="40" height="20" fill="{PINK_I}" opacity="0.25"/></pattern>')
    L.append(G(P(gen_kitchen.wrect(34, 34, 332, 332, 26, 1.2, 4), f"url(#{p}gh)"), p + "sh"))
    # a plate of four decorated cookies (baked colour)
    L.append(G(P(wob(200, 204, 150, 146, .015, 5, 30), "#E6DCCB"), p + "sh") + P(wob(200, 202, 146, 142, .015, 6, 30), WHITE)
             + P(wob(200, 204, 112, 108, .02, 7, 28), "#F4EEE4"))
    L.append("".join(C(200 + math.cos(a) * 130, 203 + math.sin(a) * 126, 4, PINK_I) for a in [i / 20 * 2 * math.pi for i in range(20)]))
    baked = f'<filter id="{p}bk" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0 0 .831 0 0 0 0 0 .604 0 0 0 0 0 1 0"/></filter>'
    ck = ""
    for kind, x, y, rot in (("star", 146, 150, -8), ("heart", 256, 156, 10), ("circle", 150, 258, 0), ("flower", 256, 260, 14)):
        ck += f'<g transform="rotate({rot} {x} {y})">' + G(cookie_body(p, kind, x, y, .42, SHAPES.index(kind) + 1), p + "bk") + "</g>"
    ck += G(G(P(wob(146, 150, 16, 15, .1, 3, 12), PINK_I) + C(142, 146, 3, WHITE), p + "sh") + G(P(wob(256, 152, 15, 14, .1, 4, 12), CHOC), p + "sh"))
    ck += "".join(f'<rect x="{n(x - 6)}" y="{n(y - 2)}" width="12" height="4" rx="2" fill="{c}" transform="rotate({a} {x} {y})"/>' for x, y, a, c in
                  ((140, 248, 20, PINK_I), (158, 262, -40, CANDY), (150, 272, 70, MUSTARD), (166, 250, 110, GREEN), (136, 266, -10, CORAL)))
    ck += C(256, 260, 11, CANDY_D) + C(255, 258, 9.5, CANDY) + C(252, 255, 3, WHITE)
    L.append(ck)
    L.append(G(P(gen_kitchen.wrect(130, -4, 140, 40, 3, 1.4, 6), MUSTARD, ' opacity="0.85" transform="rotate(-4 200 15)"')
               + "".join(C(146 + i * 18, 16, 4, WHITE, ' opacity="0.7" transform="rotate(-4 200 15)"') for i in range(7)), p + "sh"))
    # ingredient row: egg, butter, flour (wheat)
    L.append(G("".join(P(wob(x, 440, 50, 44, .04, 7 + i, 20), WHITE) for i, x in enumerate((92, 200, 308))), p + "sh"))
    eg = E(92, 442, 26, 33, SHELL_D) + E(91, 440, 24, 31, SHELL) + E(84, 428, 7, 10, SHELL_L)
    bu = CA.butter_block(p, 200, 430, .36)
    wh = CA.wheat(308, 440, .5, -14) + CA.wheat(320, 444, .5, 16)
    L.append(G(eg, p + "sh") + G(bu, p + "sh") + G(wh, p + "sh"))
    defs = std_defs(p, "rough", seed=51, sh=(4, 3.5, .32), cut={"rim": 3, "rough": 7, "freq": .12}) + pat + baked
    return svg(400, 520, defs, G("".join(L), p + "gr"))


# ================= PHOTO FRAME (700x780, identical to images-b-prep photo-frame, cookie sticker) =================
def pizza_sticker():
    """The exact markup of the pizza-slice sticker in gen_prep_b.photo_frame (swapped out, like photo-frame-salad)."""
    return (P("M410,726 L380,668 Q410,654 440,668Z", SAUCE) + P("M410,716 L388,672 Q410,662 432,672Z", CHEESE)
            + P(wrect(376, 656, 68, 16, 8, .3, 5), CRUST) + C(404, 686, 5, RED) + C(416, 700, 4, OLIVE))


def cookie_sticker():
    """A small round baked cookie with pink icing and sprinkles (round, so it does not repeat the star sticker beside it)."""
    g = C(410, 697, 29, mix(CK_DD, "#6B3A1A", .25)) + C(410, 693, 28, mix(CK, "#D98A3A", .45)) + C(404, 686, 9, mix(CK_L, "#FFF3D6", .4), ' opacity="0.6"')
    g += P(wob(410, 692, 18, 17, .08, 5, 14), PINK_I) + C(404, 686, 3, WHITE, ' opacity="0.9"')
    g += "".join(f'<rect x="{n(x - 3.5)}" y="{n(y - 1.3)}" width="7" height="2.6" rx="1.3" fill="{c}" transform="rotate({a} {x} {y})"/>'
                 for x, y, a, c in ((402, 696, 30, CANDY), (416, 688, -30, MUSTARD), (414, 700, 80, GREEN), (406, 684, 120, WHITE)))
    return g


def photo_frame_cookies():
    s = PB.photo_frame()
    old = pizza_sticker()
    assert s.count(old) == 1, "pizza sticker not found in the prep frame code"
    return s.replace(old, cookie_sticker()).replace("pf-", "pfc-")


ITEMS = {"card-cookies": card_cookies, "cookie-dough-flat": dough_flat, "baking-tray": baking_tray,
         **{f"cutter-{k}": (lambda k=k: cutter(k)) for k in SHAPES}, **{f"cookie-{k}": (lambda k=k: cookie(k)) for k in SHAPES},
         "icing-tube-pink": lambda: icing_tube("pink"), "icing-tube-choc": lambda: icing_tube("choc"),
         "icing-blob-pink": lambda: icing_blob("pink"), "icing-blob-choc": lambda: icing_blob("choc"),
         "sprinkles-cluster": sprinkles_cluster, "candy-dot": candy_dot, "photo-frame-cookies": photo_frame_cookies}

if __name__ == "__main__":
    run(ITEMS)
