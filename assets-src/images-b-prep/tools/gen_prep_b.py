# images-b-prep, part B: cheese + grater, cutting board, knife, vegetables (whole + slice), can, jar, oven mitts, photo frame.
# Run: python tools/gen_prep_b.py [names...]   (writes into images-b-prep/ only)
import math, random, re, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from prepkit import *  # noqa: F401,F403
from gen_prep_a import tomato_side, CHROME, CHROME_D, CHROME_L

SHRED, SHRED_LO, SHRED_HI = "#FFE27A", "#F2C24A", "#FFF4C8"      # same as images-b cheese-shred
GLASS, GLASS_D = "#E4F1EE", "#C3DCD8"                            # same as images-b cheese-shaker


# ================= CHEESE BLOCK (380x300) =================
def cheese_block():
    p = "cb-"
    sil = rpoly([(50, 130), (96, 78), (336, 78), (336, 206), (290, 262), (50, 262)], 12)
    L = [ground_shadow(190, 272, 160, 12, p, .36), G(P(sil, CHEESE_D), p + "cut")]
    L.append(P(rpoly([(52, 132), (290, 132), (290, 260), (52, 260)], 12), CHEESE))                      # front
    L.append(P(rpoly([(54, 130), (98, 80), (334, 80), (290, 130)], 10), CHEESE_L))                      # top
    L.append(P(rpoly([(292, 132), (334, 84), (334, 204), (292, 256)], 8), mix(CHEESE, CHEESE_D, .55)))  # side
    holes = ""
    for x, y, rx, ry in ((100, 176, 18, 14), (200, 214, 24, 18), (250, 160, 12, 10), (130, 232, 10, 8), (174, 150, 9, 7)):
        holes += E(x, y + 2, rx, ry, CHEESE_D) + E(x, y, rx * .9, ry * .8, mix(CHEESE_D, "#C98A1E", .35))
    for x, y, rx, ry in ((170, 104, 20, 7), (270, 96, 12, 4.5), (120, 116, 9, 3.5)):
        holes += E(x, y, rx, ry, mix(CHEESE_D, "#C98A1E", .2))
    holes += E(318, 150, 8, 13, mix(CHEESE_D, "#C98A1E", .3)) + E(310, 206, 6, 10, mix(CHEESE_D, "#C98A1E", .3))
    L.append(G(holes, p + "sh"))
    L.append(P("M64,142 L150,142 L144,150 L64,150Z", WHITE, ' opacity="0.45"'))
    return doc(p, 380, 300, "".join(L), seed=91, sh=(4, 3.5, .33))


# ================= GRATER (440x640) =================
def grater():
    p = "gt-"
    L = [ground_shadow(220, 616, 176, 14, p, .38)]
    handle = smooth_open([(150, 116), (140, 64), (170, 30), (270, 30), (300, 64), (290, 116)])
    L.append(G(stroke(handle, TEAL_D, 44) + stroke(handle, TEAL, 32), p + "cut"))
    L.append(stroke(smooth_open([(156, 78), (176, 44), (230, 40)]), TEAL_L, 8, ' opacity="0.8"'))
    body = rpoly([(106, 110), (334, 110), (374, 596), (66, 596)], 18)
    side = rpoly([(334, 112), (378, 132), (414, 584), (372, 596)], 12)
    L.append(G(P(side, METAL_D) + P(body, METAL_D), p + "cut"))
    L.append(P(side, mix(METAL_D, METAL, .3)))
    L.append(P(rpoly([(110, 114), (330, 114), (368, 590), (72, 590)], 16), METAL))
    L.append(P(rpoly([(118, 130), (140, 130), (104, 580), (84, 580)], 8), METAL_L, ' opacity="0.8"'))
    # grating teeth: dark slot + raised light lip above it
    holes = ""
    r = random.Random(4)
    for row in range(11):
        y = 164 + row * 38
        t = (y - 110) / 486
        x0, x1 = 106 - 40 * t + 44, 334 + 40 * t - 44
        cnt = 5 if row % 2 == 0 else 4
        for k in range(cnt):
            x = x0 + (x1 - x0) * ((k + (0 if row % 2 == 0 else .5)) / (4 if row % 2 == 0 else 4))
            holes += P(f"M{n(x - 14)},{n(y)} Q{n(x)},{n(y - 12)} {n(x + 14)},{n(y)} Q{n(x)},{n(y + 5)} {n(x - 14)},{n(y)}Z", METAL_L)
            holes += E(x, y + 3, 12, 4.5, "#56605E")
    L.append(G(holes, p + "sh"))
    # teal cap + rubber foot
    L.append(G(P(rpoly([(96, 94), (344, 94), (348, 128), (92, 128)], 12), TEAL_D) + P(rpoly([(100, 92), (340, 92), (342, 120), (98, 120)], 10), TEAL), p + "sh"))
    L.append(G(P(rpoly([(58, 572), (380, 572), (418, 566), (420, 596), (382, 610), (56, 610)], 10), TEAL_D), p + "sh"))
    L.append(P(rpoly([(64, 576), (374, 576), (376, 586), (62, 586)], 4), TEAL, ' opacity="0.9"'))
    return doc(p, 506, 736, '<g transform="scale(1.15)">' + "".join(L) + "</g>", seed=93, sh=(4, 3.5, .33))   # drawn in 440x640, published x1.15


# ================= CHEESE PILES (400x260) + HANDFUL (300x260) =================
def shred_defs(p):
    """Four reusable shred pieces (like images-b cheese-shred: pale strip, darker underside, light top)."""
    d = ""
    for i, (Ln, col) in enumerate(((50, SHRED), (58, SHRED_HI), (44, SHRED), (54, CHEESE_L))):
        d += (f'<g id="{p}s{i}">' + P(wob(0, 2.5, Ln / 2, 7, .1, 300 + i, 10), SHRED_LO) + P(wob(0, 0, Ln / 2 - 1, 6, .1, 310 + i, 10), col)
              + P(wob(-Ln * .08, -2.2, Ln * .26, 1.8, .1, 320 + i, 8), WHITE, ' opacity="0.6"') + "</g>")
    return d


def shreds(p, r, pts):
    return "".join(f'<use href="#{p}s{r.randint(0, 3)}" transform="translate({n(x)} {n(y)}) rotate({r.randint(-75, 75)})"/>' for x, y in pts)


def cheese_pile(k):
    p = f"cp{k}-"
    W, H, N = {1: (80, 36, 12), 2: (132, 80, 30), 3: (176, 140, 60)}[k]
    base = 234
    top = lambda x: base - H * max(0, 1 - ((x - 200) / W) ** 2) ** .8
    prof = [(200 + W * math.cos(t), top(200 + W * math.cos(t))) for t in [i / 16 * math.pi for i in range(17)]]
    mound = smooth(prof + [(200 - W - 8, base + 4), (200, base + 8), (200 + W + 8, base + 4)])
    r = random.Random(k * 7)
    L = [ground_shadow(200, base + 8, W + 34, 10, p, .34), G(P(mound, mix(CHEESE, CHEESE_D, .35)), p + "cut")]
    pts = []
    for i in range(N):
        x = r.uniform(200 - W * .95, 200 + W * .95)
        y = r.uniform(top(x) + 4, base - 4)
        pts.append((x, y))
    pts.sort(key=lambda q: q[1])
    rim = [(200 + W * .9 * math.cos(t), top(200 + W * .9 * math.cos(t)) + 3) for t in [i / (6 + 2 * k) * math.pi for i in range(1, 6 + 2 * k)]]
    L.append(G(shreds(p, r, pts + rim), p + "sh"))
    loose = [(200 - W - 30, base - 2), (200 + W + 26, base), (200 + W + 50, base - 6)][:k + 1]
    L.append(G(shreds(p, r, loose), p + "sh"))
    return doc(p, 400, 260, "".join(L), seed=95 + k, sh=(3, 2.5, .3), extra_defs=shred_defs(p))


HANDFUL_ANCHOR = (150, 116)


def cheese_handful():
    p = "ch-"
    r = random.Random(5)
    L = [G(P(wob(150, 116, 90, 68, .06, 1, 20), mix(CHEESE, CHEESE_D, .35)), p + "cut")]
    pts = [(150 + math.cos(a) * d * 80, 116 + math.sin(a) * d * 58) for a, d in [(r.uniform(0, 6.28), math.sqrt(r.random())) for _ in range(34)]]
    pts.sort(key=lambda q: q[1])
    L.append(G(shreds(p, r, pts), p + "sh"))
    L.append(G(shreds(p, r, [(122, 206), (176, 222), (146, 244)]), p + "sh"))     # a few falling
    return doc(p, 300, 260, "".join(L), seed=99, sh=(3, 2.5, .3), extra_defs=shred_defs(p))


# ================= CUTTING BOARD (1000x600) =================
BOARD_FACE, BOARD_EDGE, BOARD_L, BOARD_GR = "#EECB95", "#B77E4B", "#F8E0B4", "#D9AD74"


def board_shape(dy=0):
    body = wrect(30, 70 + dy, 870, 440, 64, 1.2, 1, 40)
    tab = wrect(830, 210 + dy, 150, 160, 70, .8, 2)
    hole = wob(930, 290 + dy, 24, 24, .03, 3, 14)
    return body, tab, hole


def cutting_board():
    p = "cu-"
    L = [G(E(505, 540, 480, 30, SH, ' opacity="0.3"'), p + "bl")]
    b, t, h = board_shape(26)
    L.append(G(P(b + " " + t, BOARD_EDGE, ' fill-rule="nonzero"') , p + "cut"))
    b, t, h = board_shape(0)
    L.append(f'<mask id="{p}m" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="600"><rect width="1000" height="600" fill="#fff"/><path d="{h}" fill="#000"/><path d="{board_shape(26)[2]}" fill="#000"/></mask>')
    face = P(b, BOARD_FACE) + P(t, BOARD_FACE)
    face += P(wrect(64, 104, 802, 372, 44, 1, 5, 40) + " " + wrect(76, 116, 778, 348, 36, 1, 6, 40), BOARD_GR, ' fill-rule="evenodd" opacity="0.8"')   # juice groove
    gr = ""
    r = random.Random(8)
    for i, y in enumerate((160, 214, 262, 318, 372, 420)):
        x0 = r.uniform(110, 300); w = r.uniform(250, 460)
        gr += P(f"M{n(x0)},{y} Q{n(x0 + w / 2)},{y - 8} {n(x0 + w)},{y + 1} Q{n(x0 + w / 2)},{y - 3} {n(x0)},{y + 4}Z", BOARD_GR, ' opacity="0.75"')
    face += gr
    face += P("M90,100 Q300,86 520,92 Q300,98 96,112Z", BOARD_L, ' opacity="0.9"')
    face += E(930, 290, 34, 34, BOARD_GR, ' opacity="0.7"')
    L.append(G(G(face, p + "sh"), None, f' mask="url(#{p}m)"'))
    return doc(p, 1000, 600, "".join(L), material="rough", seed=101, sh=(4, 3.5, .3), paper={"fibre": .1, "tooth": .35, "mottle": .12})


# ================= KNIFE (240x640, vertical, blade down) =================
KNIFE_TIP = (118, 618)
BLADE = "M72,266 L168,266 C178,380 180,470 168,540 C158,596 136,618 118,618 C90,618 72,596 72,560Z"


def knife_body(p):
    L = []
    L.append(G(P(wrect(76, 16, 88, 236, 44, .8, 1), CORAL_D) + P(BLADE, METAL_D), p + "cut"))
    L.append(P(wrect(80, 14, 78, 228, 39, .6, 2), CORAL))
    L.append(P(wrect(92, 36, 16, 170, 8, .4, 3), CORAL_L, ' opacity="0.9"'))
    L.append(C(120, 84, 11, CREAM) + C(120, 174, 11, CREAM) + C(118, 82, 4, WHITE, ' opacity="0.8"') + C(118, 172, 4, WHITE, ' opacity="0.8"'))
    L.append(G(P(wrect(70, 236, 100, 38, 16, .5, 4), CHROME_D) + P(wrect(72, 234, 96, 30, 14, .5, 5), CHROME), p + "sh"))
    L.append(P("M78,276 L160,276 C168,380 170,468 160,534 C150,588 132,606 118,606 C94,606 80,588 80,556Z", METAL_L))
    L.append(P("M150,280 L162,280 C170,380 172,468 162,534 C154,578 140,600 126,606 C142,586 150,560 154,530 C160,470 158,380 150,280Z", WHITE, ' opacity="0.75"'))  # soft edge bevel
    L.append(P(wrect(92, 290, 12, 190, 6, .4, 6), WHITE, ' opacity="0.55"'))
    heart = "M120,398 C98,382 94,366 102,358 C109,351 117,354 120,362 C123,354 131,351 138,358 C146,366 142,382 120,398Z"
    L.append(G(P(heart, PINK_D), p + "sh"))
    return "".join(L)


def knife():
    p = "kn-"
    return doc(p, 240, 640, knife_body(p), seed=103, sh=(4, 3.5, .33))


# ================= VEGETABLES: whole (560x420, on the board, cut right->left) + slice (240x240) =================
VEG_SPAN_GRID = {"tomato": (104, 456), "mushroom": (76, 484), "pepper": (50, 490), "onion": (26, 530)}
VEG_SPAN = {k: (round(a * 1.2), round(b * 1.2)) for k, (a, b) in VEG_SPAN_GRID.items()}   # x range of the body in the 672x504 file


VEG_K = 1.2                      # drawn in a 560x420 grid, published at 672x504 (short side >= 500)
VEG_W, VEG_H = 672, 504


def veg_doc(p, body, seed):
    L = [ground_shadow(280, 396, 200, 14, p, .34), body]
    return doc(p, VEG_W, VEG_H, f'<g transform="scale({VEG_K})">' + "".join(L) + "</g>", seed=seed, sh=(4, 3.5, .33))


def veg_tomato_whole():
    p = "vt-"
    return veg_doc(p, G(tomato_side(280, 230, 158, 5), p + "cut"), 111)


MUSH_CAP_D = "M78,236 C68,120 168,56 280,56 C392,56 492,120 482,236 C476,258 446,264 412,258 L148,258 C114,264 84,258 78,236Z"
MUSH_STEM_D = "M206,250 L192,356 Q188,392 232,394 L328,394 Q372,392 368,356 L354,250Z"


def veg_mushroom_whole():
    p = "vm-"
    cap, stem = MUSH_CAP_D, MUSH_STEM_D
    L = [G(P(stem, mix(MUSH, GILL, .45)) + P(cap, mix(MUSH_CAP, "#5E3420", .3)), p + "cut")]
    L.append(P("M212,252 L200,354 Q198,382 236,384 L324,384 Q360,382 358,354 L346,252Z", MUSH))
    L.append(P("M312,262 L330,380 Q352,378 352,356 L340,262Z", GILL, ' opacity="0.6"'))
    L.append(P("M88,232 C80,126 176,66 280,66 C384,66 480,126 472,232 C466,248 440,252 412,248 L148,248 C120,252 94,248 88,232Z", MUSH_CAP))
    L.append(G(P("M112,246 Q280,208 448,246 Q430,266 280,268 Q130,266 112,246Z", "#B98552"), p + "sh"))
    L.append(P("M130,172 C140,118 196,82 262,76 C204,98 164,130 150,180Z", MUSH_CAP_L, ' opacity="0.95"'))
    L.append(C(318, 104, 9, MUSH_CAP_L, ' opacity="0.8"') + C(370, 140, 6, MUSH_CAP_L, ' opacity="0.7"'))
    return veg_doc(p, "".join(L), 113)


PEPPER_OUT = [(430, 110), (468, 138), (486, 186), (476, 250), (488, 312), (470, 358), (420, 388), (330, 398), (240, 400), (160, 394),
              (104, 380), (66, 352), (56, 318), (76, 292), (50, 258), (54, 220), (76, 196), (58, 164), (76, 124), (120, 100), (200, 88), (300, 86), (380, 92)]


def veg_pepper_whole():
    """Bell pepper lying on its side: blossom end with three lobes at the left, shoulders + thick stem at the right."""
    p = "vp-"
    out = PEPPER_OUT
    d = smooth(out)
    L = [G(P(d, PEPPER_D), p + "cut")]
    L.append(P(smooth([(x - 2, y - 6) for x, y in out]), PEPPER))
    # lobe creases: two long grooves running from the stem end to the dents of the blossom end
    L.append(P("M470,214 Q300,186 72,198 Q300,204 470,228Z", PEPPER_D, ' opacity="0.6"'))
    L.append(P("M466,296 Q300,302 72,290 Q300,318 466,310Z", PEPPER_D, ' opacity="0.5"'))
    L.append(P("M110,168 Q240,126 400,138 Q250,142 124,184Z", "#C8EFA8", ' opacity="0.9"'))            # gloss
    L.append(P("M150,268 Q260,250 380,262 Q260,262 156,280Z", PEPPER_L, ' opacity="0.7"'))
    L.append(C(424, 150, 8, "#C8EFA8", ' opacity="0.8"'))
    # sunken shoulder + thick bent stem
    stem = P(wob(470, 248, 26, 44, .05, 7, 14), mix(PEPPER_D, "#2E5A22", .3))
    stem += P("M478,232 Q506,228 514,200 Q518,184 530,182 Q542,186 536,202 Q526,244 488,264Z", GREEN_D)
    stem += P("M490,238 Q510,230 518,206 Q522,196 530,194 Q520,226 496,250Z", GREEN, ' opacity="0.9"')
    L.append(G(stem, p + "sh"))
    return veg_doc(p, "".join(L), 115)


def onion_pts():
    pts = []
    for i in range(40):
        a = i / 40 * 2 * math.pi
        rx = 206 if math.cos(a) < 0 else 214
        pts.append((268 + math.cos(a) * rx, 250 + math.sin(a) * 136))
    # pull a pointy dry tip out at the right, a flat root end at the left
    pts[0] = (530, 240); pts[1] = (476, 272); pts[-1] = (478, 212)
    return pts


def veg_onion_whole():
    p = "vo-"
    pts = onion_pts()
    d = smooth(pts)
    L = [G(P(d, ONION_D), p + "cut")]
    L.append(P(smooth([(x - 2, y - 5) for x, y in pts]), ONION))
    L.append(G("".join(stroke(f"M72,{250 + o * .2} Q268,{250 + o} 500,{242 + o * .15}", ONION_D, 5, ' opacity="0.55"') for o in (-110, -64, -20, 30, 80, 118)), None))
    L.append(P("M110,176 Q250,124 400,150 Q250,142 124,190Z", ONION_L, ' opacity="0.95"'))
    L.append(P("M500,232 L532,238 L500,250Z", "#E6C4B6"))                                                  # papery tip
    roots = "".join(stroke(f"M62,{y} q-18,{(y - 250) * .2} -34,{(y - 250) * .5 + 6}", "#E8D6B8", 5) for y in (224, 238, 252, 266, 280))
    L.append(G(P(wob(64, 252, 12, 34, .05, 5, 12), "#D9B99A") + roots, p + "sh"))
    return veg_doc(p, "".join(L), 117)


def slice_from_topping(fn, p_old, p_new):
    """The slice = the images-b topping drawing, 240 box (x 240/140). Same colours and shapes, so a slice cut on the
    board is the same thing the child later puts on the pizza. Paper grain stays at native density."""
    s = fn()
    defs = re.search(r"<defs>(.*)</defs>", s).group(1).replace(p_old, p_new)
    body = re.search(r'</defs><g filter="url\(#' + p_old + r'gr\)">(.*)</g></svg>$', s).group(1).replace(p_old, p_new)
    k = 240 / 140
    shadow = G(E(70, 76, 56, 54, SH, ' opacity="0.22"'), p_new + "bl")
    return svg(240, 240, defs, G(f'<g transform="scale({k:.4f})">{shadow}{body}</g>', p_new + "gr"))


# ================= CAN OF CORN (340x460) + LID =================
def can_common(p, opened):
    L = [ground_shadow(170, 440, 146, 13, p, .38)]
    body = "M50,96 L50,418 A120,26 0 0 0 290,418 L290,96Z"
    L.append(G(P(body, METAL_D) + E(170, 96, 120, 26, METAL_D), p + "cut"))
    L.append(P("M54,96 L54,416 A116,24 0 0 0 286,416 L286,96Z", METAL))
    for y in (112, 124, 394, 406):                                                     # rolled ribs
        L.append(P(f"M54,{y} A116,24 0 0 0 286,{y} L286,{y + 5} A116,24 0 0 1 54,{y + 5}Z", METAL_D, ' opacity="0.7"'))
    label = "M52,140 A118,26 0 0 0 288,140 L288,378 A118,26 0 0 1 52,378Z"
    L.append(G(P(label, GREEN), p + "sh"))
    L.append(P("M52,146 A118,26 0 0 0 288,146 L288,156 A118,26 0 0 1 52,156Z", CREAM, ' opacity="0.9"'))
    L.append(P("M52,362 A118,26 0 0 0 288,362 L288,372 A118,26 0 0 1 52,372Z", CREAM, ' opacity="0.9"'))
    # label picture: a corn cob in its husk on a cream oval
    pic = E(170, 272, 84, 84, CREAM)
    pic += P("M122,330 Q96,270 126,200 Q132,262 150,318Z", GREEN_D) + P("M218,330 Q244,270 214,200 Q208,262 190,318Z", GREEN_D)
    cob = P(wob(170, 262, 34, 70, .02, 5, 18), CORN_D)
    for row in range(8):
        for col in range(3):
            x = 170 + (col - 1) * 20; y = 206 + row * 15
            if abs(x - 170) > 30 * math.sqrt(max(0, 1 - ((y - 262) / 68) ** 2)): continue
            cob += P(wrect(x - 8.5, y - 6, 17, 13, 5, .3, row * 3 + col), CORN) + E(x - 3, y - 2, 3.5, 2.5, CORN_L)
    pic += cob
    pic += P("M140,346 Q112,296 132,236 Q148,296 170,344Z", GREEN) + P("M200,346 Q228,296 208,236 Q192,296 170,344Z", GREEN_L)
    L.append(G(pic, p + "sh"))
    # cylinder light and shade
    L.append(P("M64,100 L64,410 L84,414 L84,104Z", WHITE, ' opacity="0.35"'))
    L.append(P("M252,108 L252,414 L284,408 L284,100Z", SH, ' opacity="0.14"'))
    if opened:   # open top: kernels inside, the rim around them
        L.append(E(170, 96, 120, 26, METAL_L))
        L.append(E(170, 97, 108, 21, CORN_D))
        k = ""
        r = random.Random(3)
        for row in range(4):
            for col in range(10):
                x = 76 + col * 21 + (row % 2) * 10 + r.uniform(-2, 2); y = 84 + row * 9
                k += P(wob(x, y, 11, 7, .1, row * 10 + col, 10, r.uniform(-20, 20)), CORN) + E(x - 2, y - 2, 4, 2.4, CORN_L)
        L.append(f'<clipPath id="{p}o"><ellipse cx="170" cy="97" rx="107" ry="20"/></clipPath>' + G(k, None, f' clip-path="url(#{p}o)"'))
        L.append(P("M62,96 A108,21 0 0 1 278,96 A108,24 0 0 0 62,96Z", METAL_D, ' opacity="0.6"'))
    else:        # closed lid with a pull ring
        L.append(E(170, 96, 120, 26, METAL_L))
        L.append(E(170, 98, 106, 20, METAL))
        L.append(E(170, 98, 84, 15, METAL_L, ' opacity="0.6"') + E(170, 99, 66, 11, METAL))
        L.append(G(P(wob(200, 94, 34, 12, .02, 9, 16) + " " + wob(202, 94, 22, 6, .03, 10, 14), CHROME_D, ' fill-rule="evenodd"') + E(172, 97, 8, 4, CHROME_D), p + "sh"))
    return L


def can_corn(opened):
    p = "cco-" if opened else "ccc-"
    return doc(p, 340, 460, "".join(can_common(p, opened)), seed=121 + opened, sh=(4, 3.5, .33))


def can_lid():
    p = "cl-"
    L = [G(E(150, 150, 124, 70, SH, ' opacity="0.3"'), p + "bl")]
    L.append(G(P("M24,120 L24,134 A126,76 0 0 0 276,134 L276,120Z", METAL_D) + E(150, 120, 126, 76, METAL_D), p + "cut"))
    L.append(E(150, 118, 122, 72, METAL_L))
    L.append(E(150, 120, 106, 62, METAL) + E(150, 121, 84, 48, METAL_L, ' opacity="0.6"') + E(150, 122, 64, 36, METAL))
    L.append(G(P(wob(180, 170, 42, 20, .02, 9, 16) + " " + wob(182, 170, 28, 11, .03, 10, 14), CHROME_D, ' fill-rule="evenodd"') + E(154, 150, 9, 5, CHROME_D), p + "sh"))
    L.append(P("M60,96 Q100,64 160,58 Q104,74 72,104Z", WHITE, ' opacity="0.6"'))
    return doc(p, 300, 260, "".join(L), seed=125, sh=(4, 3.5, .33))


# ================= JAR OF OLIVES (340x480) + LID =================
JAR = "M88,126 Q58,134 56,178 L56,420 Q56,452 98,454 L242,454 Q284,452 284,420 L284,178 Q282,134 252,126Z"
JAR_IN = "M94,136 Q68,144 66,182 L66,416 Q66,442 102,444 L238,444 Q274,442 274,416 L274,182 Q272,144 246,136Z"


def olive_def(p):
    return (f'<g id="{p}ol">' + P(wob(0, 0, 25, 19, .03, 30, 14), OLIVE_D) + P(wob(-1, -1.5, 22.5, 16.3, .03, 31, 14), OLIVE)
            + P(wob(-8.7, -7.2, 8, 3.8, .1, 32, 10), OLIVE_S, ' opacity="0.9"') + "</g>")


def olive_use(p, x, y, s, rot):
    return f'<use href="#{p}ol" transform="translate({n(x)} {n(y)}) rotate({n(rot)}) scale({s})"/>'


def olive(x, y, rx, ry, seed, rot):
    return (f'<g transform="rotate({n(rot)} {n(x)} {n(y)})">' + P(wob(x, y, rx, ry, .03, seed, 14), OLIVE_D) + P(wob(x - 1, y - 1.5, rx * .9, ry * .86, .03, seed + 1, 14), OLIVE)
            + P(wob(x - rx * .35, y - ry * .38, rx * .32, ry * .2, .1, seed + 2, 10), OLIVE_S, ' opacity="0.9"') + "</g>")


def jar_common(p, opened):
    L = [ground_shadow(170, 462, 140, 12, p, .38)]
    L.append(G(P(JAR, GLASS) + P(wrect(96, 88, 148, 48, 12, .6, 1), GLASS), p + "cut"))
    r = random.Random(8)
    ol = P(JAR_IN, "#DDE3B0", ' opacity="0.6"')
    spots = [(x, y) for y in range(418, 120, -48) for x in range(98 + (y // 48 % 2) * 30, 272, 60)]
    for i, (x, y) in enumerate(spots):
        ol += olive_use(p, x + r.uniform(-6, 6), y + r.uniform(-5, 5), 1.3, r.uniform(-40, 40))
    L.append(f'<clipPath id="{p}j"><path d="{JAR_IN}"/><rect x="100" y="96" width="140" height="44"/></clipPath>' + G(G(ol, p + "sh"), None, f' clip-path="url(#{p}j)"'))
    # label: cream oval with an olive BRANCH (brown twig, long silver-green leaves in pairs) + one green and one purple olive
    lab = E(170, 312, 96, 74, CORAL_D) + E(170, 310, 90, 68, CREAM)
    twig = "M104,352 Q150,322 196,300 Q220,288 244,262"
    lab += stroke(twig, WALNUT, 8) + stroke("M170,312 Q176,332 172,344", WALNUT, 5) + stroke("M212,292 Q222,306 220,318", WALNUT, 5)
    for x, y, a in ((126, 336, -70), (142, 332, 20), (160, 318, -80), (184, 310, 10), (206, 290, -60), (228, 282, 30), (242, 256, -30)):
        lab += (f'<g transform="rotate({a} {x} {y})">' + P(wob(x, y - 16, 8, 19, .04, x, 12), SAGE_D)
                + P(wob(x - 1, y - 17, 5.5, 16, .05, x + 1, 12), SAGE_L) + stroke(f"M{x},{y - 2} L{x},{y - 30}", SAGE_D, 1.8) + "</g>")
    lab += olive(170, 352, 16, 21, 91, 8)                                                  # purple (kalamata) olive
    lab += (P(wob(219, 330, 15, 20, .03, 93, 14), mix(GREEN_D, OLIVE_D, .15)) + P(wob(218, 328, 13, 17.5, .03, 94, 14), mix(GREEN, SAGE, .3))
            + P(wob(213, 321, 4.5, 6, .1, 95, 10), "#D9EDB8", ' opacity="0.95"'))                # green olive
    L.append(f'<clipPath id="{p}lb"><ellipse cx="170" cy="310" rx="90" ry="68"/></clipPath>')
    L.append(G(E(170, 312, 96, 74, CORAL_D) + E(170, 310, 90, 68, CREAM) + G(lab, None, f' clip-path="url(#{p}lb)"'), p + "sh"))
    L.append(P(wrect(74, 160, 16, 250, 8, .6, 3), WHITE, ' opacity="0.7"') + P(wrect(96, 170, 8, 110, 4, .4, 4), WHITE, ' opacity="0.5"')
             + P(wrect(256, 190, 9, 170, 4.5, .4, 5), WHITE, ' opacity="0.45"'))
    if opened:
        L.append(G(E(170, 90, 78, 16, GLASS_D) + E(170, 90, 66, 11, "#4A2D48") , p + "sh"))
        L.append(f'<clipPath id="{p}m"><ellipse cx="170" cy="90" rx="66" ry="11"/></clipPath>'
                 + G(olive(140, 94, 22, 12, 71, 0) + olive(186, 92, 22, 12, 74, 10) + olive(164, 84, 18, 9, 77, -5), None, f' clip-path="url(#{p}m)"'))
        L.append(P("M104,86 A66,11 0 0 1 236,86 A70,14 0 0 0 104,86Z", WHITE, ' opacity="0.6"'))
    else:
        L.append(G(lid_side(p, 170, 64, 84, 38), p + "sh"))
    return L


def lid_side(p, cx, ytop, rx, h):
    """Screw lid seen from the front: coral band with ridges, lighter top ellipse."""
    g = P(f"M{cx - rx},{ytop} L{cx - rx},{ytop + h} A{rx},{rx * .18} 0 0 0 {cx + rx},{ytop + h} L{cx + rx},{ytop}Z", CORAL_D)
    g += "".join(P(wrect(x - 3, ytop + 6, 6, h - 6, 3, .2, int(x)), mix(CORAL_D, "#7A2A14", .35), ' opacity="0.6"') for x in range(cx - rx + 12, cx + rx - 6, 14))
    g += E(cx, ytop, rx, rx * .18, CORAL) + E(cx - rx * .3, ytop - 2, rx * .45, rx * .06, CORAL_L, ' opacity="0.9"')
    return g


def jar_olives(opened):
    p = "jo-" if opened else "jc-"
    return doc(p, 340, 480, "".join(jar_common(p, opened)), seed=131 + opened, sh=(4, 3.5, .33), extra_defs=olive_def(p))


def jar_lid():
    p = "jl-"
    L = [G(E(150, 176, 118, 26, SH, ' opacity="0.32"'), p + "bl")]
    L.append(G(P("M32,96 L32,160 A118,34 0 0 0 268,160 L268,96Z", CORAL_D) + E(150, 96, 118, 40, CORAL_D), p + "cut"))
    L.append("".join(P(wrect(x - 3.5, 110, 7, 70 - abs(x - 150) * .1, 3.5, .2, x), mix(CORAL_D, "#7A2A14", .35), ' opacity="0.55"') for x in range(44, 262, 16)))
    L.append(E(150, 94, 114, 38, CORAL) + E(150, 96, 92, 28, mix(CORAL, CORAL_L, .35)))
    L.append(G(P("M150,112 C132,100 128,90 134,84 C139,79 146,82 150,88 C154,82 161,79 166,84 C172,90 168,100 150,112Z", CREAM), p + "sh"))   # heart on top
    L.append(P("M60,84 Q90,62 140,58 Q96,70 70,92Z", WHITE, ' opacity="0.5"'))
    return doc(p, 300, 240, "".join(L), seed=135, sh=(4, 3.5, .33))


# ================= OVEN MITTS =================
MITT = [(44, 236), (36, 156), (36, 84), (50, 32), (94, 8), (138, 24), (156, 74), (160, 156), (158, 236)]
THUMB = [(46, 172), (14, 142), (2, 104), (14, 84), (34, 92), (50, 124)]


def mitt(p, x, y, s, rot, flip=False, heart=True):
    """One teal quilted mitt, thumb on the left (flip -> right). Local box ~0..164 x 0..300, cuff at the bottom."""
    body = smooth(MITT); th = smooth(THUMB)
    g = P(th, TEAL_D, ' transform="translate(2 3)"') + P(th, TEAL) + P(body, TEAL_D, ' transform="translate(2 4)"') + P(body, TEAL)
    q = "".join(stroke(f"M{a},{0} L{a + 220},{220}", TEAL_D, 4, ' opacity="0.5"') + stroke(f"M{a + 220},{0} L{a},{220}", TEAL_D, 4, ' opacity="0.5"') for a in range(-200, 200, 40))
    g += f'<clipPath id="{p}q{int(x)}"><path d="{body}"/></clipPath>' + G(q, None, f' clip-path="url(#{p}q{int(x)})"')
    g += P("M58,64 Q70,30 104,20 Q80,42 74,74Z", TEAL_L, ' opacity="0.8"')
    if heart:
        g += P("M112,150 C92,136 88,120 96,112 C103,105 110,108 112,116 C114,108 121,105 128,112 C136,120 132,136 112,150Z", CORAL)
    g += P(wrect(28, 226, 144, 62, 24, .8, 7), mix(CREAM2, "#C9A27A", .25)) + P(wrect(30, 222, 140, 56, 22, .8, 8), CREAM)
    g += "".join(P(wrect(40 + i * 24, 240, 12, 28, 6, .3, 9 + i), CORAL, ' opacity="0.8"') for i in range(5))
    g += stroke("M160,236 q26,-6 24,-32 q-2,-18 -18,-14", mix(CREAM2, "#C9A27A", .25), 8)          # hanging loop
    f = " scale(-1 1) translate(-200 0)" if flip else ""
    return f'<g transform="translate({n(x)} {n(y)}) rotate({rot}) scale({s}){f}">{g}</g>'


def oven_mitts():
    p = "om-"
    L = [G(E(240, 372, 200, 16, SH, ' opacity="0.34"'), p + "bl")]
    L.append(G(mitt(p, 40, 34, 1.12, -8, flip=True, heart=False), p + "cut"))
    L.append(G(mitt(p, 234, 16, 1.12, 8), p + "cut"))
    return doc(p, 480, 400, "".join(L), material="rough", seed=141, sh=(4, 3.5, .33))


def mitt_single():
    p = "ms-"
    return doc(p, 320, 400, G(mitt(p, 60, 30, 1.18, -6), p + "cut"), material="rough", seed=143, sh=(4, 3.5, .33))


# ================= PHOTO FRAME (700x780, transparent square window) =================
FRAME_HOLE = (80, 80, 540, 540)


def photo_frame():
    p = "pf-"
    x, y, w, h = FRAME_HOLE
    hole = wrect(x, y, w, h, 8, .6, 9, 40)
    L = [G(P(wrect(24, 24, 652, 732, 22, 1.2, 1, 40) + " " + hole, CREAM, ' fill-rule="evenodd"'), p + "cut")]
    L.append(P(wrect(66, 66, 568, 568, 14, .8, 2, 40) + " " + hole, CREAM2, ' fill-rule="evenodd"'))
    L.append(G(P(wrect(x - 3, y - 3, w + 6, h + 6, 10, .5, 3, 40) + " " + hole, mix(CREAM2, "#B0885E", .3), ' fill-rule="evenodd"'), p + "bl"))
    # decorations on the bottom band: heart, star, pizza slice, heart
    heart = lambda cx, cy, s, col: P(f"M{cx},{cy + 22 * s} C{cx - 26 * s},{cy + 4 * s} {cx - 28 * s},{cy - 16 * s} {cx - 14 * s},{cy - 22 * s} C{cx - 6 * s},{cy - 25 * s} {cx},{cy - 18 * s} {cx},{cy - 12 * s} C{cx},{cy - 18 * s} {cx + 6 * s},{cy - 25 * s} {cx + 14 * s},{cy - 22 * s} C{cx + 28 * s},{cy - 16 * s} {cx + 26 * s},{cy + 4 * s} {cx},{cy + 22 * s}Z", col)
    deco = heart(200, 694, 1.3, RED) + heart(500, 694, 1.3, PINK_D)
    st = gen_kitchen.STAR
    deco += P(rpoly([(290 + (sx - 100) * .42, 694 + (sy - 100) * .42) for sx, sy in st], 4), CHEESE_D) + P(rpoly([(290 + (sx - 100) * .32, 692 + (sy - 100) * .32) for sx, sy in st], 3), CHEESE)
    sl = P("M410,726 L380,668 Q410,654 440,668Z", SAUCE) + P("M410,716 L388,672 Q410,662 432,672Z", CHEESE) + P(wrect(376, 656, 68, 16, 8, .3, 5), CRUST) + C(404, 686, 5, RED) + C(416, 700, 4, OLIVE)
    deco += sl
    L.append(G(deco, p + "sh"))
    # washi tape on the two top corners
    for cx, cy, a, col, stripe in ((60, 56, -40, TEAL_L, TEAL), (640, 56, 40, PINK, CORAL)):
        t = P(wrect(cx - 76, cy - 22, 152, 44, 4, 1.5, cx), col, ' opacity="0.9"')
        t += "".join(P(wrect(cx - 70 + i * 26, cy - 22, 10, 44, 2, .5, cx + i), stripe, ' opacity="0.45"') for i in range(6))
        L.append(G(f'<g transform="rotate({a} {cx} {cy})">{t}</g>', p + "sh"))
    return doc(p, 700, 780, "".join(L), material="rough", seed=151, sh=(4, 3.5, .3))


ITEMS = {"cheese-block": cheese_block, "grater": grater, "cheese-pile-1": lambda: cheese_pile(1), "cheese-pile-2": lambda: cheese_pile(2),
         "cheese-pile-3": lambda: cheese_pile(3), "cheese-handful": cheese_handful, "cutting-board": cutting_board, "knife": knife,
         "veg-tomato-whole": veg_tomato_whole, "veg-tomato-slice": lambda: slice_from_topping(gen_items.topping_tomato, "tt-", "vts-"),
         "veg-mushroom-whole": veg_mushroom_whole, "veg-mushroom-slice": lambda: slice_from_topping(gen_items.topping_mushroom, "tm-", "vms-"),
         "veg-pepper-whole": veg_pepper_whole, "veg-pepper-slice": lambda: slice_from_topping(gen_items.topping_pepper, "tp-", "vps-"),
         "veg-onion-whole": veg_onion_whole, "veg-onion-slice": lambda: slice_from_topping(gen_items.topping_onion, "tn-", "vos-"),
         "can-corn-closed": lambda: can_corn(False), "can-corn-open": lambda: can_corn(True), "can-lid": can_lid,
         "jar-olives-closed": lambda: jar_olives(False), "jar-olives-open": lambda: jar_olives(True), "jar-lid": jar_lid,
         "oven-mitts": oven_mitts, "mitt-single": mitt_single, "photo-frame": photo_frame}

if __name__ == "__main__":
    only = sys.argv[1:]
    for name, fn in ITEMS.items():
        if not only or name in only:
            save(name, fn())
