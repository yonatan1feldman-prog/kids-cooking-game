# The puzzle's own pictures (not from the memory book): twelve painterly-realistic scenes a 4-5-year-old loves.
# Run from the repo root:  python3 assets-src/images-b-puzzle/tools/gen_pictures.py [names...]
# then:                    node assets-src/images-b-puzzle/tools/render.mjs [names...]
# The SVGs (and sheet.jpg) are git-ignored: the generator is deterministic, the WebPs in public/assets/puzzle are
# what the game ships. The list and order here = PICTURES in src/core/puzzle.ts.
import os, sys, math, random
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from kit import *  # noqa: F401,F403

OUT = os.path.normpath(os.path.join(HERE, ".."))
SCENES = {}


def scene(fn):
    SCENES[fn.__name__.replace("_", "-")] = fn
    return fn


# ------------------------------------------------------------------ shared backgrounds
def garden_bg(d, rnd, horizon=540, light="#EAF2D0"):
    d.add(R(0, 0, S, S, d.lin([(0, "#BFDCEB"), (0.45, light), (1, "#9BC46A")])))
    far = ""
    for i in range(16):
        x = rnd.uniform(-60, S + 60)
        far += E(x, rnd.uniform(150, 420), rnd.uniform(90, 170), rnd.uniform(70, 140), rnd.choice(["#5E8F3E", "#6FA04A", "#4C7B34", "#86B25A"]), f' opacity="{rnd.uniform(.6, .95):.2f}"')
    far += bokeh(rnd, 26, 0, 120, S, horizon - 20, 10, 34, ["#FFF6C8", "#FFFFFF", "#F7E08A"], (0.25, 0.6))
    far += bokeh(rnd, 14, 0, horizon - 120, S, horizon, 8, 20, ["#F49AC1", "#FFD35C", "#FFFFFF", "#E86A5A"], (0.5, 0.85))
    d.add(G(far, d.blur(16)))


def lawn(d, rnd, top=560, base=("#8CC05A", "#4F8B2E"), count=2200, light=0.0):
    d.add(R(0, top - 30, S, S - top + 30, d.lin([(0, base[0]), (1, base[1])]), d.blur(10)))
    d.add(G(strokes(rnd, count // 3, in_rect(rnd, -10, top - 20, S + 10, top + 90), lambda x, y: jit("#7DB24C", rnd, 18), 14, 3, lambda x, y: -90 + rnd.uniform(-20, 20)), d.blur(1.6)))
    d.add(strokes(rnd, count, in_rect(rnd, -10, top + 40, S + 10, S + 20),
                  lambda x, y: jit(mix("#9ACC63", "#3E7425", min(1, (y - top) / (S - top)) * 0.7 + rnd.random() * 0.3), rnd, 14),
                  22, 3.4, lambda x, y: -90 + rnd.uniform(-25, 25)))


def fur(d, rnd, shape, cx, cy, rx, ry, cols, count, length=20, width=3.4, flow=90, spread=0.5, edge=True):
    """Fur over a filled shape: strokes clipped to it, lighter top-left, darker bottom-right, flowing `flow`
    degrees and a little away from the centre; then a fringe of strokes across the outline."""
    lite, mid, dark = cols

    def col(x, y):
        t = ((x - cx) / rx * 0.45 + (y - cy) / ry * 0.55 + 1) / 2
        t = max(0, min(1, t + rnd.uniform(-0.18, 0.18)))
        return mix(lite, mid, t * 2) if t < 0.5 else mix(mid, dark, (t - 0.5) * 2)

    def ang(x, y):
        out = math.degrees(math.atan2(y - cy, x - cx))
        return flow + (((out - flow + 180) % 360) - 180) * spread

    s = strokes(rnd, count, in_ellipse(rnd, cx, cy, rx * 1.02, ry * 1.02), col, length, width, ang)
    d.add(G(s, d.clip(shape)))
    if edge:
        def rim():
            a = rnd.uniform(0, 6.283)
            return cx + math.cos(a) * rx * rnd.uniform(0.92, 1.0), cy + math.sin(a) * ry * rnd.uniform(0.92, 1.0)
        d.add(strokes(rnd, int(count * 0.18), rim, col, length * 0.75, width * 0.85, ang, alpha=(0.5, 0.9)))


# ------------------------------------------------------------------ 1. puppy
@scene
def puppy():
    d = Doc(11)
    rnd = d.rnd
    garden_bg(d, rnd)
    lawn(d, rnd, 560)
    gold = ("#F5DAA3", "#D9A458", "#9A6229")
    d.add(E(400, 742, 230, 34, "#1E2A10", ' opacity="0.45"' + d.blur(12)))
    # hind legs, body, chest
    for sx in (-1, 1):
        sh = blob(400 + sx * 128, 690, 92, 62, 0.05, 3 + sx)
        d.add(P(sh, d.rad([(0, gold[1]), (1, gold[2])], 0.4, 0.3, 0.8)))
        fur(d, rnd, sh, 400 + sx * 128, 690, 92, 62, gold, 260, 16, 3.2, 0)
    body = blob(400, 585, 168, 178, 0.035, 5)
    d.add(P(body, d.rad([(0, gold[0]), (0.55, gold[1]), (1, gold[2])], 0.35, 0.3, 0.85)))
    fur(d, rnd, body, 400, 585, 168, 178, gold, 1500, 24, 3.6, 90, 0.45)
    d.add(P(blob(400, 560, 92, 120, 0.06, 9), "#FBEBC8", ' opacity="0.7"' + d.blur(14)))
    # front legs and paws
    for sx in (-1, 1):
        x = 400 + sx * 62
        leg = smooth([(x - 40, 560), (x + 40, 560), (x + 38, 700), (x + 30, 735), (x - 30, 735), (x - 38, 700)])
        d.add(P(leg, d.lin([(0, gold[1]), (1, gold[0])], 0, 0, 1, 0)))
        fur(d, rnd, leg, x, 650, 42, 95, (gold[0], gold[1], "#B47A38"), 300, 16, 3, 90, 0.1, edge=False)
        paw = blob(x, 732, 50, 26, 0.04, 20 + sx)
        d.add(P(paw, d.rad([(0, "#FBE6BC"), (1, gold[1])], 0.4, 0.3, 0.8)))
        for t in (-0.45, 0, 0.45):
            d.add(line(x + t * 50, 722, x + t * 46, 748, "#A8733A", 2.2, ' opacity="0.6"'))
    # collar
    d.add(P("M300 452 Q400 500 500 452 L505 476 Q400 528 295 476 Z", d.lin([(0, "#E0453A"), (1, "#A3241D")])))
    d.add(C(400, 512, 18, d.rad([(0, "#FFF0A8"), (0.6, "#E8B83E"), (1, "#A87A1C")], 0.35, 0.3)))
    # head
    head = blob(400, 325, 150, 132, 0.03, 31)
    d.add(P(head, d.rad([(0, gold[0]), (0.6, gold[1]), (1, gold[2])], 0.38, 0.3, 0.8)))
    fur(d, rnd, head, 400, 325, 150, 132, gold, 1100, 18, 3.2, 90, 0.85)
    # ears
    for sx in (-1, 1):
        ear = blob(400 + sx * 138, 362, 50, 104, 0.06, 40 + sx, rot=-sx * 14)
        d.add(P(ear, d.lin([(0, "#C68A44"), (1, "#7E4C1E")]), d.wobble(4, 0.05, 2 + sx)))
        fur(d, rnd, ear, 400 + sx * 138, 362, 50, 104, ("#D9A458", "#B07534", "#6E4119"), 420, 22, 3, 90 + sx * 8, 0.1)
    # muzzle
    d.add(P(blob(400, 398, 82, 60, 0.04, 50), d.rad([(0, "#FFF3D8"), (0.7, "#F2D49C"), (1, "#D9A458")], 0.45, 0.35, 0.7), d.blur(2)))
    d.add(strokes(rnd, 160, in_ellipse(rnd, 400, 398, 70, 48), lambda x, y: jit("#F7E2B5", rnd, 10), 10, 2.4, lambda x, y: math.degrees(math.atan2(y - 380, x - 400)), alpha=(0.4, 0.8)))
    # eyes and brows
    for sx in (-1, 1):
        d.add(E(400 + sx * 56, 316, 30, 26, "#A86E2E", ' opacity="0.35"' + d.blur(5)))
        d.add(eye(400 + sx * 56, 318, 21, "#4A2A14"))
    # nose, mouth, tongue
    d.add(P("M372 362 Q400 350 428 362 Q432 380 414 390 Q400 396 386 390 Q368 380 372 362 Z", d.rad([(0, "#5A4038"), (1, "#140C08")], 0.4, 0.3, 0.7)))
    d.add(E(390, 364, 10, 5, "#FFFFFF", ' opacity="0.55"'))
    d.add(P("M400 394 L400 412 M400 412 Q384 428 366 418 M400 412 Q416 428 434 418", "none", ' stroke="#5A3A22" stroke-width="3.2" stroke-linecap="round"'))
    d.add(P("M384 420 Q400 416 416 420 Q420 446 400 452 Q380 446 384 420 Z", d.lin([(0, "#F48C9A"), (1, "#D45A6E")])))
    d.add(line(400, 424, 400, 442, "#C04A5C", 1.6, ' opacity="0.7"'))
    return d.svg()


# ------------------------------------------------------------------ 2. kitten
def whiskers(d, cx, cy, sx, col="#FFFFFF"):
    s = ""
    for i, a in enumerate((-12, 0, 12)):
        r = math.radians(a)
        x2, y2 = cx + sx * 150 * math.cos(r), cy + 150 * math.sin(r) - 6
        s += f'<path d="M{n(cx)} {n(cy + i * 6 - 6)} Q{n((cx + x2) / 2)} {n((cy + y2) / 2 - 10)} {n(x2)} {n(y2)}" stroke="{col}" stroke-width="2" fill="none" opacity="0.85"/>'
    d.add(s)


@scene
def kitten():
    d = Doc(12)
    rnd = d.rnd
    # a warm room: a sunny window behind, a plant, all soft
    d.add(R(0, 0, S, S, d.lin([(0, "#F3E3C8"), (1, "#E2C49C")])))
    bg = R(470, 40, 300, 380, "#FFF8E4", rx=10) + R(612, 40, 16, 380, "#D9BC92") + R(470, 224, 300, 14, "#D9BC92")
    bg += E(120, 300, 110, 150, "#5E8F3E") + E(80, 220, 70, 90, "#76A64C") + E(170, 230, 60, 80, "#4C7B34") + R(80, 380, 90, 110, "#B5643A", rx=12)
    bg += bokeh(rnd, 18, 470, 40, 770, 420, 10, 30, ["#FFFFFF", "#FFF2C0"], (0.4, 0.8))
    d.add(G(bg, d.blur(14)))
    d.add(P("M0 470 L800 470 L800 800 L0 800 Z", d.lin([(0, "#E9A8A0"), (1, "#C97B78")])))
    # the knitted blanket: rows of soft V stitches
    knit = ""
    for row in range(14):
        y = 480 + row * 24
        for col in range(-1, 34):
            x = col * 25 + (row % 2) * 12
            c = jit("#F2B9B0" if (row // 3) % 2 else "#F7D7C9", rnd, 10)
            knit += f'<path d="M{x} {y} Q{x + 6} {y + 16} {x + 12} {y + 20} M{x + 24} {y} Q{x + 18} {y + 16} {x + 12} {y + 20}" stroke="{c}" stroke-width="7" stroke-linecap="round" fill="none" opacity="0.9"/>'
    d.add(G(knit, d.blur(0.6)))
    d.add(R(0, 470, S, 60, d.lin([(0, "#7A4A3A", 0.35), (1, "#7A4A3A", 0)])))
    tab = ("#F7D9B0", "#E8A15C", "#A85E26")
    d.add(E(400, 720, 220, 40, "#5A2E26", ' opacity="0.35"' + d.blur(14)))
    # tail curled round the front
    d.add(P("M560 690 Q660 650 640 560 Q630 520 600 530 Q625 600 560 640 Z", d.lin([(0, tab[1]), (1, tab[2])]), d.wobble(4, 0.05, 4)))
    tail_shape = "M560 690 Q660 650 640 560 Q630 520 600 530 Q625 600 560 640 Z"
    d.add(G(strokes(rnd, 160, in_rect(rnd, 560, 520, 660, 700), lambda x, y: jit(tab[1] if (int(y) // 26) % 2 else tab[2], rnd, 12), 14, 3, lambda x, y: 60), d.clip(tail_shape)))
    body = blob(400, 590, 150, 150, 0.035, 7)
    d.add(P(body, d.rad([(0, tab[0]), (0.6, tab[1]), (1, tab[2])], 0.38, 0.3, 0.85)))
    fur(d, rnd, body, 400, 590, 150, 150, tab, 1100, 18, 3.2, 90, 0.5)
    # stripes on the body
    stripes = "".join(f'<path d="M{n(250 + i * 18)} {n(520 + (i % 3) * 30)} q30 20 10 70" stroke="#A65A22" stroke-width="12" fill="none" stroke-linecap="round" opacity="0.5"/>' for i in range(0, 3))
    stripes += "".join(f'<path d="M{n(550 - i * 18)} {n(520 + (i % 3) * 30)} q-30 20 -10 70" stroke="#A65A22" stroke-width="12" fill="none" stroke-linecap="round" opacity="0.5"/>' for i in range(0, 3))
    d.add(G(stripes, d.clip(body) + d.wobble(5, 0.06, 9)))
    d.add(P(blob(400, 600, 70, 110, 0.06, 8), "#FFF4E2", ' opacity="0.8"' + d.blur(12)))
    for sx in (-1, 1):
        paw = blob(400 + sx * 48, 728, 44, 26, 0.04, 22 + sx)
        d.add(P(paw, d.rad([(0, "#FFF6E8"), (1, "#F0CFA0")], 0.4, 0.3, 0.8)))
        for t in (-0.4, 0, 0.4):
            d.add(line(400 + sx * 48 + t * 44, 718, 400 + sx * 48 + t * 40, 742, "#C9945C", 2, ' opacity="0.6"'))
    # head and ears
    for sx in (-1, 1):
        ear = f"M{400 + sx * 60} 250 L{400 + sx * 132} 132 L{400 + sx * 150} 290 Z"
        d.add(P(ear, d.lin([(0, tab[2]), (1, tab[1])]), d.wobble(3, 0.06, 5 + sx)))
        d.add(P(f"M{400 + sx * 82} 258 L{400 + sx * 128} 168 L{400 + sx * 136} 282 Z", d.lin([(0, "#E99A9A"), (1, "#F7C6BE")]), d.blur(2)))
        d.add(strokes(rnd, 30, in_rect(rnd, 400 + sx * 120 - 12, 200, 400 + sx * 120 + 12, 270), lambda x, y: "#FFF4E8", 22, 1.6, lambda x, y: -90 - sx * 20, alpha=(0.5, 0.8)))
    head = blob(400, 330, 140, 118, 0.03, 33)
    d.add(P(head, d.rad([(0, tab[0]), (0.6, tab[1]), (1, tab[2])], 0.38, 0.3, 0.82)))
    fur(d, rnd, head, 400, 330, 140, 118, tab, 900, 14, 2.8, 90, 0.9)
    # forehead stripes (the tabby M)
    d.add(G(P("M352 236 q8 30 18 46 M400 226 l0 52 M448 236 q-8 30 -18 46 M300 300 q20 6 40 2 M500 300 q-20 6 -40 2", "none", ' stroke="#9A5320" stroke-width="9" stroke-linecap="round" opacity="0.65"'), d.wobble(4, 0.07, 3)))
    d.add(P(blob(400, 378, 92, 54, 0.04, 34), "#FFF2DE", ' opacity="0.85"' + d.blur(8)))
    for sx in (-1, 1):
        cx = 400 + sx * 56
        d.add(E(cx, 318, 34, 30, "#7A3E14", ' opacity="0.35"' + d.blur(4)))
        d.add(E(cx, 318, 30, 28, d.rad([(0, "#C7E27A"), (0.7, "#7DAA3A"), (1, "#3F6A1E")], 0.5, 0.6, 0.6)))
        d.add(E(cx, 320, 9, 22, "#120A06"))
        d.add(E(cx - 10, 306, 9, 7, "#FFFFFF", ' opacity="0.9"'))
        d.add(C(cx + 10, 332, 3.5, "#FFFFFF", ' opacity="0.6"'))
        d.add(P(f"M{cx - 32} 316 Q{cx} 284 {cx + 32} 316", "none", ' stroke="#5A2E10" stroke-width="3" opacity="0.7"'))
    d.add(P("M386 364 L414 364 L400 380 Z", d.lin([(0, "#F4A0A8"), (1, "#C9606E")])))
    d.add(P("M400 380 L400 392 M400 392 Q388 404 376 398 M400 392 Q412 404 424 398", "none", ' stroke="#7A3E2A" stroke-width="2.6" stroke-linecap="round"'))
    whiskers(d, 360, 384, -1)
    whiskers(d, 440, 384, 1)
    return d.svg()


# ------------------------------------------------------------------ 3. bunny
def daisy(x, y, r, rnd, col="#FFFFFF", mid="#F7C933"):
    s = ""
    k = 12
    for i in range(k):
        a = 360 * i / k + rnd.uniform(-6, 6)
        s += E(x, y - r * 0.55, r * 0.2, r * 0.55, jit(col, rnd, 6), f' transform="rotate({n(a)} {n(x)} {n(y)})"')
    s += C(x, y, r * 0.28, mid) + C(x - r * 0.08, y - r * 0.08, r * 0.12, "#FFF3B0", ' opacity="0.7"')
    return s


@scene
def bunny():
    d = Doc(13)
    rnd = d.rnd
    garden_bg(d, rnd, 520, "#F2F0D4")
    lawn(d, rnd, 540, ("#9CCB66", "#5C9636"), 2000)
    fl = ""
    for _ in range(14):
        fl += daisy(rnd.uniform(0, 800), rnd.uniform(560, 620), rnd.uniform(9, 14), rnd)
    d.add(G(fl, d.blur(1.2)))
    br = ("#E8D2B4", "#B8936C", "#6E5034")
    d.add(E(420, 720, 210, 34, "#1E2A10", ' opacity="0.45"' + d.blur(12)))
    # body (sitting, a little turned), fluffy tail
    d.add(C(560, 650, 52, "#FFFFFF", d.blur(3)))
    d.add(strokes(rnd, 160, in_ellipse(rnd, 560, 650, 50, 50), lambda x, y: jit("#F4F0EA", rnd, 10), 12, 3, lambda x, y: math.degrees(math.atan2(y - 650, x - 560))))
    body = blob(440, 600, 165, 140, 0.04, 6)
    d.add(P(body, d.rad([(0, br[0]), (0.6, br[1]), (1, br[2])], 0.35, 0.3, 0.85)))
    fur(d, rnd, body, 440, 600, 165, 140, br, 1200, 16, 3, 20, 0.6)
    d.add(P(blob(360, 640, 70, 80, 0.06, 7), "#F8F2E8", ' opacity="0.85"' + d.blur(12)))
    for x in (330, 400):
        paw = blob(x, 726, 40, 22, 0.04, x)
        d.add(P(paw, d.rad([(0, "#FFFFFF"), (1, "#E3D6C4")], 0.4, 0.3, 0.8)))
    hind = blob(530, 700, 80, 34, 0.04, 9)
    d.add(P(hind, d.rad([(0, br[1]), (1, br[2])], 0.4, 0.3, 0.8)))
    # ears: long and upright, pink inside
    for i, (x, rot) in enumerate(((300, -12), (390, 8))):
        ear = blob(x, 180, 42, 130, 0.04, 50 + i, rot=rot)
        d.add(P(ear, d.lin([(0, br[1]), (1, br[2])])))
        fur(d, rnd, ear, x, 180, 42, 130, br, 300, 14, 2.6, -90 + rot, 0.1)
        d.add(P(blob(x + 2, 186, 22, 108, 0.04, 60 + i, rot=rot), d.lin([(0, "#F6C3C0"), (1, "#E28E94")]), ' opacity="0.9"' + d.blur(3)))
    head = blob(345, 380, 120, 108, 0.03, 32)
    d.add(P(head, d.rad([(0, br[0]), (0.6, br[1]), (1, br[2])], 0.38, 0.3, 0.82)))
    fur(d, rnd, head, 345, 380, 120, 108, br, 900, 13, 2.6, 160, 0.8)
    d.add(P(blob(320, 420, 70, 46, 0.05, 36), "#FBF4EA", ' opacity="0.85"' + d.blur(9)))
    d.add(eye(380, 362, 22, "#3A2214"))
    d.add(eye(270, 366, 15, "#3A2214"))
    d.add(P("M296 404 Q306 396 316 404 Q306 416 296 404 Z", "#E68A96"))
    d.add(P("M306 412 L306 424 M306 424 Q296 434 286 428 M306 424 Q316 434 326 428", "none", ' stroke="#6E4A3A" stroke-width="2.4" stroke-linecap="round"'))
    whiskers(d, 290, 418, -1, "#F8F4EE")
    whiskers(d, 324, 418, 1, "#F8F4EE")
    # daisies in the grass, the nearest ones big and sharp
    fl = ""
    for x, y, r in ((90, 700, 34), (170, 760, 28), (690, 740, 36), (760, 660, 24), (620, 780, 22)):
        fl += line(x, y + r * 0.5, x + 6, y + 80, "#4E8A2E", 5)
        fl += daisy(x, y, r, rnd)
    d.add(fl)
    return d.svg()


# ------------------------------------------------------------------ 4. ducklings
def duck(d, rnd, cx, cy, s, body_cols, head_col=None, beak="#F59A2E", flip=1, fuzz=True):
    """A duck (or a duckling, small and fuzzy) floating to the left (flip=1) or right (-1)."""
    lite, mid, dark = body_cols
    hc = head_col or body_cols
    body = blob(cx, cy, 70 * s, 42 * s, 0.04, int(cx), rot=-6 * flip)
    tail = f"M{n(cx + flip * 60 * s)} {n(cy - 10 * s)} L{n(cx + flip * 100 * s)} {n(cy - 40 * s)} L{n(cx + flip * 70 * s)} {n(cy + 14 * s)} Z"
    d.add(P(tail, mid))
    d.add(P(body, d.rad([(0, lite), (0.6, mid), (1, dark)], 0.4, 0.3, 0.8)))
    hx, hy = cx - flip * 48 * s, cy - 52 * s
    neck = blob(cx - flip * 36 * s, cy - 26 * s, 26 * s, 30 * s, 0.03, int(cy))
    d.add(P(neck, mid))
    head = blob(hx, hy, 34 * s, 30 * s, 0.03, int(cx) + 1)
    d.add(P(head, d.rad([(0, hc[0]), (0.6, hc[1]), (1, hc[2])], 0.4, 0.3, 0.8)))
    if fuzz:
        for (sh, x, y, rx, ry) in ((body, cx, cy, 70 * s, 42 * s), (head, hx, hy, 34 * s, 30 * s)):
            fur(d, rnd, sh, x, y, rx, ry, (lite, mid, dark), int(500 * s * s) + 60, 10 * s + 3, 2.2, 180 if flip > 0 else 0, 0.6)
    else:
        d.add(G(strokes(rnd, int(160 * s), in_ellipse(rnd, cx + flip * 10 * s, cy, 60 * s, 28 * s), lambda x, y: jit(mix(lite, mid, rnd.random()), rnd, 10), 14 * s, 2.2, lambda x, y: 0 if flip < 0 else 180, curve=0.2, alpha=(0.35, 0.7)), d.clip(body)))
        d.add(P(f"M{n(cx - flip * 10 * s)} {n(cy - 18 * s)} q{n(flip * 50 * s)} -6 {n(flip * 70 * s)} 16", "none", f' stroke="{dark}" stroke-width="{n(5 * s)}" opacity="0.6" stroke-linecap="round"'))
    bx = hx - flip * 30 * s
    d.add(P(f"M{n(hx - flip * 20 * s)} {n(hy - 2 * s)} Q{n(bx - flip * 24 * s)} {n(hy - 4 * s)} {n(bx - flip * 26 * s)} {n(hy + 6 * s)} Q{n(bx - flip * 6 * s)} {n(hy + 14 * s)} {n(hx - flip * 16 * s)} {n(hy + 10 * s)} Z", d.lin([(0, beak), (1, mix(beak, "#A0400E", 0.4))])))
    d.add(eye(hx - flip * 6 * s, hy - 8 * s, 6.5 * s, "#1A0E06"))


@scene
def ducklings():
    d = Doc(14)
    rnd = d.rnd
    d.add(R(0, 0, S, 360, d.lin([(0, "#9CCBE6"), (1, "#E8F2E2")])))
    trees = "".join(E(rnd.uniform(-40, 840), rnd.uniform(240, 330), rnd.uniform(70, 140), rnd.uniform(60, 110), rnd.choice(["#4C7B34", "#5E8F3E", "#3E6A2A", "#76A64C"])) for _ in range(18))
    d.add(G(trees, d.blur(10)))
    d.add(R(0, 330, S, 40, "#6E9A44", d.blur(6)))
    # the pond, the trees mirrored in it, ripples
    d.add(R(0, 360, S, 440, d.lin([(0, "#7FA88A"), (0.35, "#5E95A8"), (1, "#3E7088")])))
    d.add(G(trees, ' transform="translate(0 700) scale(1 -1)" opacity="0.35"' + d.blur(14)))
    rip = ""
    for _ in range(170):
        y = rnd.uniform(370, 800)
        w = rnd.uniform(30, 120) * (0.5 + (y - 360) / 440)
        x = rnd.uniform(-20, 820)
        rip += line(x, y, x + w, y, rnd.choice(["#CFE6EE", "#A8D2DE", "#2E5E74"]), rnd.uniform(1.5, 3.5), f' opacity="{rnd.uniform(.25, .6):.2f}"')
    d.add(G(rip, d.blur(0.8)))
    # reeds at the sides
    reeds = ""
    for side in (0, 1):
        for _ in range(26):
            x = rnd.uniform(0, 110) if side == 0 else rnd.uniform(690, 800)
            h = rnd.uniform(160, 320)
            reeds += f'<path d="M{n(x)} 800 Q{n(x + rnd.uniform(-20, 20))} {n(800 - h / 2)} {n(x + rnd.uniform(-30, 30))} {n(800 - h)}" stroke="{jit("#5E8A36", rnd, 16)}" stroke-width="{n(rnd.uniform(5, 9))}" fill="none" stroke-linecap="round"/>'
        for _ in range(4):
            x = rnd.uniform(20, 90) if side == 0 else rnd.uniform(710, 780)
            y = rnd.uniform(500, 600)
            reeds += R(x - 9, y, 18, 70, "#6E4426", rx=9) + line(x, y, x, y - 30, "#5E8A36", 4)
    d.add(reeds)
    # Mother duck and three ducklings, each with a soft reflection and a ring of ripples
    fam = [(330, 470, 2.1, 0), (520, 590, 0.95, 1), (660, 650, 0.85, 2), (330, 690, 0.95, 3)]
    for cx, cy, s, i in fam:
        d.add(E(cx, cy + 30 * s, 110 * s, 16 * s, "#E8F4F6", ' opacity="0.35"' + d.blur(3)))
        d.add(E(cx, cy + 34 * s, 80 * s, 10 * s, "#1E3A48", ' opacity="0.35"' + d.blur(4)))
        if i == 0:
            duck(d, rnd, cx, cy, s, ("#F2E2C4", "#C9A27A", "#7E5E3E"), ("#9A7A56", "#7E5E3E", "#4E3A24"), "#E88A2E", fuzz=False)
            d.add(P(f"M{n(cx + 10)} {n(cy - 6)} q40 -6 70 6 l-6 14 q-30 -8 -64 -6 Z", "#3E62B8", ' opacity="0.9"'))
        else:
            duck(d, rnd, cx, cy, s, ("#FFF4A8", "#F7D23E", "#C99A14"), None, "#F59A2E", flip=1 if i != 2 else -1)
    return d.svg()


# ------------------------------------------------------------------ 5. horse
@scene
def horse():
    d = Doc(15)
    rnd = d.rnd
    d.add(R(0, 0, S, S, d.lin([(0, "#8FC2E8"), (0.5, "#E6F0E0"), (1, "#E6F0E0")])))
    clouds = "".join(E(x, y, rx, ry, "#FFFFFF", ' opacity="0.85"') for x, y, rx, ry in ((140, 120, 110, 40), (210, 100, 80, 46), (620, 160, 130, 44), (690, 140, 70, 40)))
    d.add(G(clouds, d.blur(8)))
    d.add(P("M0 470 Q200 380 420 430 Q620 470 800 400 L800 800 L0 800 Z", "#8CB866", d.blur(6)))
    d.add(P("M0 540 Q300 470 800 520 L800 800 L0 800 Z", d.lin([(0, "#9CCB66"), (1, "#5C9636")])))
    d.add(G(bokeh(rnd, 40, 0, 520, 800, 600, 3, 7, ["#FFFFFF", "#FFD35C", "#F49AC1"], (0.5, 0.9)), d.blur(1.5)))
    d.add(strokes(rnd, 1400, in_rect(rnd, -10, 600, 810, 810), lambda x, y: jit(mix("#9ACC63", "#3E7425", (y - 600) / 200), rnd, 14), 20, 3.2, lambda x, y: -90 + rnd.uniform(-25, 25)))
    ch = ("#D98B4E", "#A85A26", "#5E2E12")
    # neck and chest
    neck = smooth([(250, 800), (300, 560), (370, 380), (470, 300), (560, 330), (600, 450), (640, 800)])
    d.add(P(neck, d.lin([(0, ch[0]), (0.6, ch[1]), (1, ch[2])], 0, 0, 1, 0.3)))
    fur(d, rnd, neck, 450, 560, 220, 260, ch, 700, 22, 3.4, 110, 0.15, edge=False)
    # mane: long dark strokes down the neck
    mane = strokes(rnd, 420, lambda: (lambda t: (470 + t * 150 + rnd.uniform(-20, 20), 290 + t * 260 + rnd.uniform(-10, 10)))(rnd.random()),
                   lambda x, y: jit("#3A1E0E", rnd, 16), 70, 5, lambda x, y: 70 + rnd.uniform(-20, 20), curve=0.35, alpha=(0.7, 1))
    d.add(mane)
    # head: long, tipped down to the left
    head = smooth([(470, 300), (440, 250), (380, 236), (300, 300), (210, 420), (170, 500), (190, 556), (260, 560), (330, 500), (420, 440), (480, 390)])
    d.add(P(head, d.rad([(0, ch[0]), (0.6, ch[1]), (1, ch[2])], 0.45, 0.25, 0.9)))
    fur(d, rnd, head, 320, 400, 170, 170, ch, 700, 14, 2.6, 130, 0.2, edge=False)
    # the white blaze, the muzzle, the nostril
    d.add(P("M392 252 Q360 268 330 330 Q280 420 236 500 Q250 512 262 500 Q320 420 360 330 Q384 280 410 262 Z", "#FFF6EA", ' opacity="0.92"' + d.blur(3)))
    d.add(P(blob(214, 520, 52, 42, 0.04, 70), d.rad([(0, "#B07A5A"), (1, "#5A3424")], 0.4, 0.3, 0.8), ' opacity="0.85"' + d.blur(3)))
    d.add(E(196, 512, 9, 14, "#1E100A", ' transform="rotate(30 196 512)"'))
    d.add(P("M196 552 Q220 562 246 548", "none", ' stroke="#3A1E10" stroke-width="3" stroke-linecap="round"'))
    # ears, forelock, eye
    for x, rot in ((430, -18), (468, 4)):
        d.add(P(blob(x, 228, 18, 44, 0.04, x, rot=rot), d.lin([(0, ch[1]), (1, ch[2])])))
        d.add(P(blob(x, 236, 8, 28, 0.04, x + 1, rot=rot), "#3A1E0E", ' opacity="0.6"'))
    d.add(strokes(rnd, 60, in_rect(rnd, 400, 250, 450, 270), lambda x, y: jit("#3A1E0E", rnd, 14), 50, 4, lambda x, y: 120, curve=0.3))
    d.add(E(368, 334, 28, 22, "#5E2E12", ' opacity="0.45"' + d.blur(4)))
    d.add(eye(366, 334, 17, "#2A140A", (-0.4, 0)))
    d.add(P("M346 318 Q366 306 388 320", "none", ' stroke="#3A1E10" stroke-width="3" stroke-linecap="round"'))
    # a wooden fence in front
    fence = ""
    for y in (640, 712):
        fence += R(-10, y, 820, 30, d.lin([(0, "#C49A6C"), (1, "#7E5634")]), rx=6)
        fence += strokes(rnd, 60, in_rect(rnd, 0, y + 4, 800, y + 26), lambda x, y: jit("#6E4A2A", rnd, 10), 60, 2, lambda x, y: 0, curve=0.05, alpha=(0.3, 0.6))
    for x in (90, 690):
        fence += R(x, 600, 44, 220, d.lin([(0, "#B48A5C"), (1, "#6E4A2A")], 0, 0, 1, 0), rx=8)
    d.add(fence)
    return d.svg()


# ------------------------------------------------------------------ shared sky pieces
def cloud(d, cx, cy, w, rnd, col="#FFFFFF", shade="#C9D6E6", blur=5):
    puffs = ""
    for i in range(7):
        t = i / 6
        x = cx - w / 2 + t * w + rnd.uniform(-10, 10)
        r = w * (0.16 + 0.12 * math.sin(t * math.pi)) * rnd.uniform(0.85, 1.1)
        puffs += C(x, cy - r * 0.4, r, col)
    base = E(cx, cy + w * 0.06, w * 0.55, w * 0.1, shade)
    d.add(G(base + puffs + E(cx, cy + w * 0.04, w * 0.5, w * 0.08, shade, ' opacity="0.6"'), d.blur(blur)))


def hills(d, rnd, y, amp, cols, seed, blur=0, tex=0):
    pts = [(-20, 820)]
    r = random.Random(seed)
    ph = r.uniform(0, 6)
    for i in range(11):
        x = -20 + i * 84
        pts.append((x, y + amp * math.sin(i * 0.7 + ph) + r.uniform(-8, 8)))
    pts.append((820, 820))
    dd = "M-20 820 " + smooth(pts[1:-1], closed=False)[1:].split(" ", 0)[0]
    dd = smooth(pts[1:-1], closed=False) + " L820 820 L-20 820 Z"
    d.add(P(dd, d.lin([(0, cols[0]), (1, cols[1])], user=True, x1=0, y1=y - amp, x2=0, y2=y + 260), d.blur(blur) if blur else ""))
    if tex:
        d.add(G(strokes(rnd, tex, in_rect(rnd, -10, y - amp, 810, 820), lambda x, yy: jit(cols[0], rnd, 16), 12, 2.6, lambda x, yy: -90 + rnd.uniform(-30, 30), alpha=(0.3, 0.6)), d.clip(dd)))
    return dd


# ------------------------------------------------------------------ 6. rainbow
@scene
def rainbow():
    d = Doc(16)
    rnd = d.rnd
    d.add(R(0, 0, S, S, d.lin([(0, "#6FA8DC"), (0.55, "#CFE4F2"), (1, "#F4EED8")])))
    bands = ["#E8473A", "#F58B2E", "#F7C933", "#5CB547", "#3E8FE0", "#7A5CC9"]
    rb = "".join(f'<circle cx="430" cy="640" r="{390 - i * 22}" fill="none" stroke="{c}" stroke-width="24"/>' for i, c in enumerate(bands))
    d.add(G(rb, ' opacity="0.72"' + d.blur(5)))
    cloud(d, 170, 170, 230, rnd)
    cloud(d, 640, 120, 190, rnd)
    hills(d, rnd, 470, 30, ("#9CC77A", "#6FA04A"), 1, blur=3)
    hills(d, rnd, 530, 40, ("#8CC05A", "#4F8B2E"), 2, tex=500)
    # a big round tree on the right hill
    d.add(R(612, 420, 26, 140, d.lin([(0, "#8A5A34"), (1, "#5A3418")], 0, 0, 1, 0), rx=10))
    crown = blob(625, 380, 110, 96, 0.08, 4)
    d.add(P(crown, d.rad([(0, "#9CCB5A"), (0.6, "#5E9A36"), (1, "#3A6A22")], 0.35, 0.3, 0.8)))
    d.add(G(strokes(rnd, 500, in_ellipse(rnd, 625, 380, 112, 98), lambda x, y: jit(mix("#A8D46A", "#3A6A22", (x - 520) / 300 * 0.5 + (y - 290) / 200 * 0.5), rnd, 16), 12, 4, lambda x, y: rnd.uniform(0, 360), alpha=(0.6, 0.9)), d.clip(crown)))
    hills(d, rnd, 640, 26, ("#A2D068", "#4E8A2E"), 3, tex=900)
    # flowers in the near field
    fl = ""
    for _ in range(140):
        x, y = rnd.uniform(0, 800), rnd.uniform(650, 800)
        r = 3 + (y - 650) / 150 * 9
        c = rnd.choice(["#E8473A", "#F7C933", "#FFFFFF", "#F27FB2", "#9A62C9"])
        fl += C(x, y, r, c, f' opacity="{rnd.uniform(.75, 1):.2f}"') + C(x, y, r * 0.35, "#F7E08A")
    d.add(fl)
    return d.svg()


# ------------------------------------------------------------------ 7. the sea
@scene
def seaside():
    d = Doc(17)
    rnd = d.rnd
    d.add(R(0, 0, S, 400, d.lin([(0, "#5FA2D8"), (1, "#D6ECF4")])))
    d.add(C(620, 150, 70, "#FFF7D6", d.blur(18)))
    d.add(C(620, 150, 46, "#FFF4C4"))
    cloud(d, 200, 140, 200, rnd)
    # the sea: deep at the horizon, turquoise near the sand, sparkles and wave lines
    d.add(R(0, 380, S, 260, d.lin([(0, "#2F78A8"), (0.6, "#3EA6B8"), (1, "#7FD6CC")])))
    wav = ""
    for _ in range(220):
        y = rnd.uniform(386, 630)
        w = rnd.uniform(14, 70) * (0.4 + (y - 380) / 250)
        x = rnd.uniform(-20, 820)
        wav += line(x, y, x + w, y + rnd.uniform(-2, 2), rnd.choice(["#FFFFFF", "#BFEFF0", "#1E5E88"]), rnd.uniform(1.4, 3.4), f' opacity="{rnd.uniform(.3, .75):.2f}"')
    d.add(wav)
    d.add(G(bokeh(rnd, 30, 480, 390, 760, 470, 2, 5, ["#FFFFFF"], (0.6, 1)), d.blur(0.8)))
    # a little sailboat on the horizon
    boat = P("M150 372 L230 372 L218 390 L162 390 Z", "#C0392B") + P("M190 300 L190 370 L150 368 Z", "#FFFFFF") + P("M194 290 L194 370 L232 366 Z", "#F7E7C4") + line(192, 288, 192, 372, "#5A3A22", 3)
    d.add(G(boat, d.blur(0.6)))
    # foam where the water meets the sand
    d.add(P("M0 610 Q120 590 240 612 Q380 636 520 606 Q660 584 800 612 L800 650 L0 650 Z", "#FFFFFF", ' opacity="0.85"' + d.wobble(10, 0.04, 6, 1)))
    sand = "M0 630 Q200 610 400 634 Q600 656 800 628 L800 800 L0 800 Z"
    d.add(P(sand, d.lin([(0, "#F4DFAE"), (1, "#E2BE7E")])))
    d.add(G(bokeh(rnd, 900, 0, 630, 800, 800, 1, 2.4, ["#C99A5A", "#FFF4D8", "#B88848"], (0.3, 0.7)), d.clip(sand)))
    d.add(P("M0 640 Q200 620 400 644 Q600 666 800 638 L800 660 Q600 690 400 668 Q200 646 0 664 Z", "#C9A06A", ' opacity="0.35"' + d.blur(5)))
    # a starfish, two shells, a bucket
    st = ""
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        r = 54 if i % 2 == 0 else 22
        pts.append((190 + r * math.cos(a), 720 + r * math.sin(a)))
    st += E(196, 734, 60, 16, "#9A6E3A", ' opacity="0.35"' + d.blur(5))
    st += P(smooth(pts), d.rad([(0, "#FFB27A"), (1, "#E0602E")], 0.4, 0.35, 0.7))
    st += bokeh(rnd, 26, 160, 690, 220, 750, 2, 3.4, ["#FFE2C4"], (0.7, 1))
    d.add(st)
    for x, y, c in ((330, 760, "#F7D2D0"), (420, 708, "#FFF2E2")):
        sh = f"M{x - 34} {y + 10} Q{x} {y - 40} {x + 34} {y + 10} Q{x} {y + 20} {x - 34} {y + 10} Z"
        d.add(E(x + 4, y + 16, 38, 8, "#9A6E3A", ' opacity="0.35"' + d.blur(4)))
        d.add(P(sh, d.rad([(0, "#FFFFFF"), (1, c)], 0.5, 0.2, 0.9)))
        d.add("".join(line(x, y + 14, x + k * 10, y - 18 + abs(k) * 6, "#C99A8A", 1.6, ' opacity="0.7"') for k in range(-3, 4)))
    bx = 610
    d.add(E(bx + 6, 776, 90, 16, "#9A6E3A", ' opacity="0.4"' + d.blur(6)))
    d.add(P(f"M{bx - 70} 660 L{bx + 70} 660 L{bx + 56} 776 L{bx - 56} 776 Z", d.lin([(0, "#F25C4A"), (0.6, "#D9382A"), (1, "#A82418")], 0, 0, 1, 0)))
    d.add(E(bx, 660, 70, 14, "#B82A1C"))
    d.add(E(bx, 662, 62, 10, "#E8C48A"))
    d.add(P(f"M{bx - 66} 664 Q{bx} 560 {bx + 66} 664", "none", ' stroke="#F7C933" stroke-width="7"'))
    d.add(R(bx - 60, 700, 120, 14, "#F7C933", ' opacity="0.9"'))
    return d.svg()


# ------------------------------------------------------------------ 8. the snowy tree
@scene
def snowy_tree():
    d = Doc(18)
    rnd = d.rnd
    d.add(R(0, 0, S, S, d.lin([(0, "#7FA6D6"), (0.6, "#D8E4F2"), (1, "#F4F2F0")])))
    d.add(G(hills(d, rnd, 470, 24, ("#E6EEF6", "#C6D4E6"), 4, blur=4) and "", ""))
    far = "".join(P(f"M{x} {y} l-{w} {h} l{2 * w} 0 Z", "#7E98B8") for x, y, w, h in ((80, 360, 40, 120), (150, 380, 34, 100), (690, 350, 44, 130), (760, 390, 30, 90)))
    d.add(G(far, ' opacity="0.7"' + d.blur(4)))
    snow = "M-20 560 Q200 500 420 540 Q620 576 820 520 L820 820 L-20 820 Z"
    d.add(P(snow, d.lin([(0, "#FFFFFF"), (1, "#DCE6F2")])))
    d.add(P("M-20 600 Q300 560 820 620 L820 640 Q300 590 -20 630 Z", "#B8C8E0", ' opacity="0.4"' + d.blur(8)))
    # the cabin with a warm window
    cab = R(560, 420, 170, 120, d.lin([(0, "#9A5A34"), (1, "#6A3A1E")]))
    cab += "".join(line(560, 432 + i * 18, 730, 432 + i * 18, "#4E2A14", 2, ' opacity="0.5"') for i in range(6))
    cab += P("M540 430 L645 350 L750 430 Z", "#7A3A26") + P("M532 432 L645 340 L758 432 L750 440 L645 360 L540 440 Z", "#FFFFFF")
    cab += P("M548 426 Q645 330 742 426", "none", ' stroke="#FFFFFF" stroke-width="16" stroke-linecap="round"')
    cab += R(680, 360, 26, 50, "#6A3A26") + E(693, 360, 18, 8, "#FFFFFF")
    cab += R(588, 455, 50, 44, "#FFD36A") + R(588, 455, 50, 44, "none", ' stroke="#4E2A14" stroke-width="5"') + line(613, 455, 613, 499, "#4E2A14", 4) + line(588, 477, 638, 477, "#4E2A14", 4)
    cab += R(668, 470, 36, 70, "#4E2A14", rx=4)
    d.add(G(cab, d.blur(0.8)))
    d.add(C(613, 477, 60, "#FFC85A", ' opacity="0.35"' + d.blur(18)))
    d.add(G("".join(C(696 + i * 14, 330 - i * 26, 12 + i * 5, "#E8EEF6", f' opacity="{0.7 - i * 0.15:.2f}"') for i in range(4)), d.blur(5)))
    # the big pine, snow on every tier
    tx, base = 290, 640
    d.add(E(tx + 20, base + 10, 190, 26, "#9AAECC", ' opacity="0.5"' + d.blur(10)))
    d.add(R(tx - 18, base - 60, 36, 74, d.lin([(0, "#7A4A2A"), (1, "#4A2814")], 0, 0, 1, 0)))
    tiers = [(base - 40, 200, 150), (base - 150, 165, 140), (base - 255, 128, 130), (base - 350, 90, 120), (base - 430, 52, 100)]
    for i, (y, w, h) in enumerate(tiers):
        pts = [(tx, y - h)]
        k = 8
        for j in range(k + 1):
            t = j / k
            pts.append((tx + w - 2 * w * t, y + (14 if j % 2 else 0) + rnd.uniform(-4, 4)))
        dd = f"M{n(tx)} {n(y - h)} L{n(tx + w)} {n(y)} " + " ".join(f"L{n(x)} {n(yy)}" for x, yy in pts[2:]) + " Z"
        tree = d.lin([(0, "#3E7A4A"), (0.6, "#2A5A36"), (1, "#173A22")], 0, 0, 1, 0.4)
        d.add(P(dd, tree))
        d.add(G(strokes(rnd, 220, in_rect(rnd, tx - w, y - h, tx + w, y + 14), lambda x, yy: jit("#2E6A3A", rnd, 18), 16, 3, lambda x, yy: 120 if x < tx else 60, alpha=(0.5, 0.9)), d.clip(dd)))
        cap = smooth([(tx, y - h - 4), (tx + w * 0.55, y - h * 0.35), (tx + w + 4, y - 4), (tx + w * 0.6, y - 2), (tx + w * 0.2, y - 18), (tx - w * 0.3, y - 6), (tx - w - 4, y - 2), (tx - w * 0.55, y - h * 0.4)])
        d.add(P(cap, d.lin([(0, "#FFFFFF"), (1, "#DCE8F4")]), ' opacity="0.95"'))
    # a snowman beside it
    sm = E(470, 650, 66, 60, d.rad([(0, "#FFFFFF"), (1, "#C9D6EA")], 0.35, 0.3, 0.8)) + E(470, 560, 48, 44, d.rad([(0, "#FFFFFF"), (1, "#C9D6EA")], 0.35, 0.3, 0.8))
    sm += C(470, 492, 36, d.rad([(0, "#FFFFFF"), (1, "#C9D6EA")], 0.35, 0.3, 0.8))
    sm += P("M470 494 L512 504 L470 506 Z", "#F58B2E") + C(458, 482, 5, "#1E1A18") + C(484, 482, 5, "#1E1A18")
    sm += P("M432 528 Q470 548 508 528 L512 544 Q470 564 428 544 Z", "#D9382A") + R(490, 540, 18, 50, "#D9382A", ' transform="rotate(-10 499 540)"')
    sm += C(470, 572, 5, "#1E1A18") + C(470, 598, 5, "#1E1A18")
    sm += P("M440 470 L500 470 L494 432 L446 432 Z", "#2A2A3A") + R(430, 466, 80, 10, "#2A2A3A", rx=3)
    sm += line(424, 560, 370, 520, "#6A3A1E", 5) + line(516, 560, 566, 524, "#6A3A1E", 5)
    d.add(E(476, 712, 80, 14, "#9AAECC", ' opacity="0.5"' + d.blur(6)))
    d.add(sm)
    # falling snow, near flakes bigger and softer
    d.add(bokeh(rnd, 160, 0, 0, 800, 800, 1.5, 4, ["#FFFFFF"], (0.6, 0.95)))
    d.add(G(bokeh(rnd, 26, 0, 0, 800, 800, 6, 11, ["#FFFFFF"], (0.5, 0.8)), d.blur(2.5)))
    return d.svg(warm="#C8DCFF", warmth=0.06)


# ------------------------------------------------------------------ vehicles
def wheel(cx, cy, r, d, hub="#D8DCE0"):
    s = C(cx, cy, r, d.rad([(0, "#3A3A3E"), (0.8, "#1A1A1C"), (1, "#0A0A0A")]))
    s += C(cx, cy, r * 0.55, d.rad([(0, "#FFFFFF"), (0.5, hub), (1, "#7A7E84")], 0.4, 0.35, 0.7))
    s += "".join(C(cx + r * 0.32 * math.cos(a), cy + r * 0.32 * math.sin(a), r * 0.06, "#5A5E64") for a in [i * math.pi / 3 for i in range(6)])
    s += C(cx, cy, r * 0.14, "#9AA0A8")
    return s


def street_bg(d, rnd):
    d.add(R(0, 0, S, S, d.lin([(0, "#8EC0E6"), (0.6, "#E8EEF0")])))
    b = ""
    x = -20
    while x < 820:
        w = rnd.uniform(90, 160)
        h = rnd.uniform(200, 360)
        c = rnd.choice(["#E8C9A0", "#C9A486", "#D8B4A0", "#B9C4CC", "#E4D6B8"])
        b += R(x, 560 - h, w - 8, h, c)
        for wy in range(int(560 - h + 24), 520, 50):
            for wx in range(int(x + 14), int(x + w - 30), 34):
                b += R(wx, wy, 20, 28, rnd.choice(["#9CC4E0", "#FFF2C0", "#8AB0CC"]))
        x += w
    d.add(G(b, d.blur(7)))
    d.add(G("".join(E(rnd.uniform(0, 800), rnd.uniform(420, 520), rnd.uniform(40, 70), rnd.uniform(40, 70), rnd.choice(["#5E8F3E", "#76A64C"])) for _ in range(8)), d.blur(8)))
    d.add(R(0, 540, S, 40, "#C9C4BC"))
    d.add(R(0, 576, S, 230, d.lin([(0, "#6E6C6A"), (1, "#4A4846")])))
    d.add("".join(R(x, 712, 90, 12, "#F4F0E6", ' opacity="0.85"') for x in range(-40, 820, 170)))
    d.add(G(bokeh(rnd, 500, 0, 580, 800, 800, 1, 2, ["#8A8886", "#3A3836"], (0.3, 0.6))))


@scene
def fire_truck():
    d = Doc(19)
    rnd = d.rnd
    street_bg(d, rnd)
    d.add(E(400, 668, 360, 26, "#1A1816", ' opacity="0.55"' + d.blur(10)))
    red = d.lin([(0, "#FF6A52"), (0.35, "#E0301E"), (1, "#8E140C")])
    # the body: the long box, the cab at the front (left)
    d.add(R(250, 420, 500, 200, red, rx=16))
    d.add(R(70, 450, 200, 170, red, rx=22))
    d.add(P("M90 460 Q100 380 170 380 L262 380 L262 470 Z", red))
    d.add(P("M106 460 Q116 398 172 398 L244 398 L244 460 Z", d.lin([(0, "#CFEAF6"), (1, "#7FA8C6")])))
    d.add(P("M120 446 Q130 410 160 404 L190 404 L150 446 Z", "#FFFFFF", ' opacity="0.45"'))
    d.add(R(250, 420, 500, 22, "#FFFFFF", ' opacity="0.18"', rx=10))
    # the white stripe, doors and lockers
    d.add(R(70, 540, 680, 22, d.lin([(0, "#FFFFFF"), (1, "#CFCFCF")])))
    for x in (300, 420, 540, 660):
        d.add(R(x - 50, 444, 100, 86, "none", ' stroke="#9A1A10" stroke-width="4" opacity="0.8"', rx=8))
        d.add(R(x - 20, 484, 40, 8, "#D8DCE0", rx=4))
    d.add(R(170, 470, 70, 6, "#9A1A10"))
    d.add(R(196, 486, 30, 8, "#D8DCE0", rx=4))
    # bumper, lights, the siren on the roof, the ladder
    d.add(R(48, 590, 70, 26, d.lin([(0, "#F4F6F8"), (1, "#9AA0A8")]), rx=8))
    d.add(C(80, 484, 16, d.rad([(0, "#FFFFFF"), (0.5, "#FFF2A8"), (1, "#E8B83E")])))
    d.add(C(80, 484, 40, "#FFF2A8", ' opacity="0.35"' + d.blur(10)))
    d.add(R(150, 360, 70, 22, "#2E6ACC", rx=8) + R(150, 360, 34, 22, "#E8473A", rx=8))
    d.add(C(167, 370, 24, "#FF6A52", ' opacity="0.35"' + d.blur(8)))
    lad = R(270, 386, 470, 12, "#C9CED4", rx=4) + R(270, 408, 470, 12, "#9AA0A8", rx=4)
    lad += "".join(R(280 + i * 38, 386, 8, 34, "#B8BEC6") for i in range(13))
    lad += R(700, 398, 20, 24, "#6E747C")
    d.add(lad)
    # hose reel
    d.add(C(690, 590, 0, "none"))
    for x in (180, 560, 680):
        d.add(E(x, 622, 80, 30, "#5A100A"))
        d.add(wheel(x, 624, 56, d))
    return d.svg()


@scene
def train():
    d = Doc(20)
    rnd = d.rnd
    d.add(R(0, 0, S, S, d.lin([(0, "#7FB6E6"), (0.6, "#E4F0EE")])))
    cloud(d, 640, 120, 200, rnd)
    hills(d, rnd, 400, 40, ("#A6CC84", "#7DAA5A"), 5, blur=4)
    hills(d, rnd, 470, 30, ("#94C46A", "#5C9636"), 6, tex=300)
    d.add(G("".join(E(x, y, 34, 40, "#4C7B34") for x, y in ((90, 420), (130, 430), (700, 430), (740, 440))), d.blur(2)))
    # the embankment, rails and sleepers
    d.add(R(0, 600, S, 200, d.lin([(0, "#8CC05A"), (1, "#4F8B2E")])))
    d.add(strokes(rnd, 900, in_rect(rnd, -10, 650, 810, 810), lambda x, y: jit("#5E9A36", rnd, 16), 18, 3, lambda x, y: -90 + rnd.uniform(-25, 25)))
    d.add(R(0, 598, S, 34, "#A08A70"))
    d.add("".join(R(x, 600, 22, 30, "#6A4A2E") for x in range(0, 820, 40)))
    d.add(R(0, 600, S, 7, "#C9CED4") + R(0, 620, S, 7, "#9AA0A8"))
    # two carriages behind (right)
    for x0, col in ((560, ("#4E86D6", "#2A5AA8")), (370, ("#F7C933", "#C99A14"))):
        d.add(R(x0, 470, 170, 110, d.lin([(0, col[0]), (1, col[1])]), rx=12))
        d.add(R(x0 - 6, 460, 182, 18, "#5A3A22", rx=6))
        for wx in (x0 + 20, x0 + 95):
            d.add(R(wx, 490, 56, 44, d.lin([(0, "#E6F4FA"), (1, "#9CC4E0")]), rx=6))
        d.add(R(x0 - 14, 556, 18, 10, "#3A3A3E"))
        d.add(wheel(x0 + 40, 588, 24, d) + wheel(x0 + 130, 588, 24, d))
    # the engine (left): boiler, cab, chimney, cowcatcher
    red = d.lin([(0, "#F25C4A"), (0.4, "#D9382A"), (1, "#8E1A10")])
    d.add(R(80, 470, 220, 100, red, rx=40))
    d.add(R(230, 400, 120, 170, red, rx=10))
    d.add(R(220, 388, 140, 22, "#3A2A22", rx=8))
    d.add(R(250, 420, 80, 60, d.lin([(0, "#E6F4FA"), (1, "#9CC4E0")]), rx=8))
    d.add(R(80, 470, 220, 18, "#FFFFFF", ' opacity="0.18"', rx=9))
    d.add("".join(R(120 + i * 50, 470, 8, 100, "#F7C933", ' opacity="0.9"') for i in range(3)))
    d.add(P("M110 470 L104 410 L150 410 L144 470 Z", "#2A2A2E") + E(127, 408, 30, 9, "#3A3A3E"))
    d.add(E(196, 466, 24, 16, d.rad([(0, "#FFF2A8"), (1, "#C99A14")])))
    d.add(C(70, 520, 18, d.rad([(0, "#FFFFFF"), (0.6, "#FFF2A8"), (1, "#E8B83E")])) + C(70, 520, 44, "#FFF2A8", ' opacity="0.3"' + d.blur(10)))
    d.add(P("M80 560 L40 600 L120 600 L120 560 Z", "#3A3A3E"))
    d.add(wheel(130, 584, 34, d) + wheel(210, 584, 34, d) + wheel(300, 590, 28, d))
    d.add(R(120, 580, 190, 8, "#9AA0A8", rx=4))
    # puffs of steam from the chimney, drifting back
    puffs = ""
    for i in range(7):
        t = i / 6
        x, y, r = 130 + t * 420, 380 - t * 260 + math.sin(t * 6) * 20, 34 + t * 50
        puffs += C(x, y, r, "#FFFFFF", f' opacity="{0.95 - t * 0.5:.2f}"') + C(x + r * 0.3, y + r * 0.3, r * 0.7, "#DCE4EC", f' opacity="{0.6 - t * 0.3:.2f}"')
    d.add(G(puffs, d.blur(6)))
    return d.svg()


# ------------------------------------------------------------------ 11. birthday cake
@scene
def birthday_cake():
    d = Doc(21)
    rnd = d.rnd
    d.add(R(0, 0, S, S, d.lin([(0, "#F6D6E4"), (1, "#E8B8C8")])))
    bal = ""
    for x, y, c in ((110, 170, "#E8473A"), (200, 120, "#F7C933"), (640, 140, "#3E8FE0"), (720, 220, "#5CB547"), (560, 90, "#F27FB2")):
        bal += line(x, y + 70, x + rnd.uniform(-20, 20), y + 260, "#FFFFFF", 2)
        bal += E(x, y, 56, 70, d.rad([(0, mix(c, "#FFFFFF", 0.5)), (0.5, c), (1, mix(c, "#000000", 0.3))], 0.35, 0.3, 0.8))
    bal += bokeh(rnd, 40, 0, 0, 800, 420, 6, 18, ["#FFFFFF", "#FFF2C0", "#FFD0E0"], (0.4, 0.8))
    d.add(G(bal, d.blur(9)))
    # the table
    d.add(R(0, 560, S, 240, d.lin([(0, "#F4E8DA"), (1, "#D8C4AE")])))
    d.add(R(0, 556, S, 10, "#C9A88A", ' opacity="0.6"' + d.blur(3)))
    d.add(G(bokeh(rnd, 30, 0, 600, 800, 800, 3, 6, ["#E8473A", "#3E8FE0", "#F7C933", "#5CB547", "#F27FB2"], (0.8, 1))))
    # plate and cake (two tiers), pink icing drips, sprinkles, strawberries
    d.add(E(400, 690, 300, 50, "#B89A84", ' opacity="0.5"' + d.blur(10)))
    d.add(E(400, 668, 290, 54, d.lin([(0, "#FFFFFF"), (1, "#D8DCE0")])))
    d.add(E(400, 660, 250, 40, "#F4F6F8"))
    for (y0, y1, w, seed) in ((470, 650, 220, 1), (330, 470, 150, 2)):
        d.add(P(f"M{400 - w} {y0} L{400 - w} {y1} A{w} 30 0 0 0 {400 + w} {y1} L{400 + w} {y0} Z", d.lin([(0, "#FFF4E2"), (0.4, "#F7E2C4"), (1, "#C9A07A")], 0, 0, 1, 0)))
        drips = f"M{400 - w} {y0} "
        for i in range(13):
            x = 400 - w + (i + 0.5) * 2 * w / 13
            drips += f"L{n(x - w / 13 * 0.8)} {y0 + 10} Q{n(x - w / 26)} {n(y0 + rnd.uniform(36, 70))} {n(x)} {n(y0 + rnd.uniform(36, 70))} Q{n(x + w / 26)} {n(y0 + rnd.uniform(36, 70))} {n(x + w / 13 * 0.8)} {y0 + 10} "
        drips += f"L{400 + w} {y0} Z"
        d.add(E(400, y0, w, 30, d.lin([(0, "#FFC8DA"), (1, "#F48AB0")])))
        d.add(P(drips, d.lin([(0, "#FFB8D0"), (1, "#E87AA0")], 0, 0, 1, 0)))
        d.add(E(400, y0, w, 30, d.rad([(0, "#FFE0EA"), (1, "#F7A8C4")], 0.4, 0.3, 0.8)))
        sp = ""
        for _ in range(int(w * 0.5)):
            a = rnd.uniform(0, 6.283)
            rr = math.sqrt(rnd.random())
            x, y = 400 + math.cos(a) * w * 0.94 * rr, y0 + math.sin(a) * 28 * rr
            sp += R(x - 5, y - 2, 10, 4, rnd.choice(["#E8473A", "#3E8FE0", "#F7C933", "#5CB547", "#FFFFFF", "#9A62C9"]), f' transform="rotate({rnd.randint(0, 180)} {n(x)} {n(y)})"', rx=2)
        d.add(sp)
    for x in (300, 400, 500):
        d.add(P(f"M{x - 24} 474 Q{x} 430 {x + 24} 474 Q{x} 502 {x - 24} 474 Z", d.rad([(0, "#FF7A6A"), (1, "#C42A2A")], 0.4, 0.3, 0.8)))
        d.add(P(f"M{x - 12} 446 L{x} 436 L{x + 12} 446 Z", "#4E9A36"))
    # candles with flames and their glow
    for i, x in enumerate((340, 380, 420, 460)):
        y = 336 + (6 if i in (0, 3) else -2)
        col = ["#3E8FE0", "#F7C933", "#5CB547", "#F27FB2"][i]
        d.add(R(x - 8, y - 80, 16, 82, d.lin([(0, mix(col, "#FFFFFF", 0.4)), (1, col)], 0, 0, 1, 0)))
        d.add("".join(line(x - 8, y - 74 + k * 18, x + 8, y - 64 + k * 18, "#FFFFFF", 3, ' opacity="0.7"') for k in range(4)))
        d.add(line(x, y - 80, x, y - 90, "#3A2A22", 2))
        d.add(C(x, y - 104, 30, "#FFD36A", ' opacity="0.45"' + d.blur(10)))
        d.add(P(f"M{x} {y - 128} Q{x + 12} {y - 104} {x} {y - 90} Q{x - 12} {y - 104} {x} {y - 128} Z", d.rad([(0, "#FFFFFF"), (0.4, "#FFF2A8"), (1, "#F58B2E")], 0.5, 0.7, 0.6)))
    return d.svg()


# ------------------------------------------------------------------ 12. hot-air balloon
@scene
def balloon():
    d = Doc(22)
    rnd = d.rnd
    d.add(R(0, 0, S, S, d.lin([(0, "#4F95D6"), (0.6, "#BFE0F2"), (1, "#F4E8C8")])))
    cloud(d, 150, 210, 220, rnd)
    cloud(d, 660, 420, 180, rnd, blur=6)
    # a far balloon
    d.add(G(E(650, 170, 34, 40, d.lin([(0, "#F7C933"), (1, "#5CB547")], 0, 0, 1, 0)) + R(642, 214, 16, 12, "#8A5A34"), d.blur(1.5)))
    # the valley: patchwork fields and a river
    hills(d, rnd, 600, 20, ("#A6CC84", "#7DAA5A"), 7, blur=3)
    fields = ""
    for i in range(24):
        x, y = rnd.uniform(-40, 800), rnd.uniform(620, 780)
        w, h = rnd.uniform(90, 200), rnd.uniform(26, 50)
        fields += P(f"M{n(x)} {n(y)} l{n(w)} {n(-6)} l{n(10)} {n(h)} l{n(-w)} {n(6)} Z", rnd.choice(["#9CCB5A", "#C9D86A", "#E8D27A", "#7DB24C", "#B8C870"]))
    d.add(G(fields, ' opacity="0.9"' + d.blur(1.5)))
    d.add(P("M-20 760 Q200 700 380 730 Q560 760 820 690 L820 710 Q560 784 380 752 Q200 724 -20 784 Z", "#7FC4E0", ' opacity="0.85"' + d.blur(1.5)))
    d.add(G("".join(C(rnd.uniform(0, 800), rnd.uniform(620, 790), rnd.uniform(5, 10), "#4C7B34") for _ in range(50)), d.blur(0.8)))
    # the big balloon: stripes on a round envelope, shaded like a sphere
    cx, cy, R0 = 390, 300, 210
    env = f"M{cx} {cy - R0} C{cx + R0 * 1.35} {cy - R0} {cx + R0 * 1.15} {cy + R0 * 0.75} {cx + R0 * 0.32} {cy + R0 * 1.18} L{cx - R0 * 0.32} {cy + R0 * 1.18} C{cx - R0 * 1.15} {cy + R0 * 0.75} {cx - R0 * 1.35} {cy - R0} {cx} {cy - R0} Z"
    cols = ["#E8473A", "#F7C933", "#3E8FE0", "#F58B2E", "#5CB547", "#F27FB2", "#E8473A", "#F7C933"]
    gores = ""
    k = len(cols)
    for i in range(k):
        t0, t1 = -1 + 2 * i / k, -1 + 2 * (i + 1) / k
        def gx(t, yy):
            return cx + t * R0 * 1.2 * math.sqrt(max(0, 1 - ((yy - cy + 30) / (R0 * 1.25)) ** 2))
        pts = [(gx(t0, y), y) for y in range(cy - R0, int(cy + R0 * 1.2) + 1, 20)] + [(gx(t1, y), y) for y in range(int(cy + R0 * 1.2), cy - R0 - 1, -20)]
        gores += P("M" + " L".join(f"{n(x)} {n(y)}" for x, y in pts) + " Z", cols[i])
    d.add(G(gores, d.clip(env)))
    d.add(P(env, d.rad([(0, "#FFFFFF", 0.45), (0.35, "#FFFFFF", 0), (0.8, "#000000", 0.15), (1, "#000000", 0.4)], 0.36, 0.3, 0.75)))
    d.add(P(env, "none", ' stroke="#5A2A14" stroke-width="2" opacity="0.4"'))
    # the ropes and the basket
    by = cy + R0 * 1.18
    for x0, x1 in ((cx - R0 * 0.32, cx - 40), (cx - R0 * 0.12, cx - 14), (cx + R0 * 0.12, cx + 14), (cx + R0 * 0.32, cx + 40)):
        d.add(line(x0, by, x1, by + 70, "#6A4A2E", 2.4))
    bk = R(cx - 50, by + 66, 100, 70, d.lin([(0, "#C99A5C"), (1, "#8A5A2E")]), rx=8)
    bk += "".join(line(cx - 50, by + 76 + j * 12, cx + 50, by + 76 + j * 12, "#6A4A2E", 2, ' opacity="0.5"') for j in range(5))
    bk += "".join(line(cx - 40 + j * 16, by + 66, cx - 40 + j * 16, by + 136, "#6A4A2E", 2, ' opacity="0.35"') for j in range(6))
    bk += R(cx - 56, by + 60, 112, 14, "#7A4A22", rx=6)
    d.add(bk)
    return d.svg()


def main(names):
    for name, fn in SCENES.items():
        if names and name not in names:
            continue
        with open(os.path.join(OUT, name + ".svg"), "w", encoding="utf-8", newline="\n") as f:
            f.write(fn())
        print(name)


if __name__ == "__main__":
    main(sys.argv[1:])
