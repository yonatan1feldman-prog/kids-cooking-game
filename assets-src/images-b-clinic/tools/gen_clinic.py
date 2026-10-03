# images-b-clinic (the clinic world: Mom the nurse treats the animals; research/clinic-spec.md).
# Uses the shared style-B kit (images-b/tools/pb.py, READ-ONLY) and writes into images-b-clinic/ only.
# Run: python tools/gen_clinic.py [names...]   then copy the SVGs into public/assets/images and bake the WebPs.
# The anchors the game relies on are printed at the end (ART.clinic in src/core/assets.ts).
# Nothing here is scary: no blood, no needles, no red cross (a heart instead), the scrape is a pink scuff with dust.
import sys, os, math, random
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
OUTDIR = os.path.normpath(os.path.join(HERE, ".."))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "images-b", "tools")))
from pb import *  # noqa: F401,F403
import pb

MINT = "#CFE6D8"; MINT_D = "#AFD2BF"; MINT_L = "#E2F1E8"
AQUA = "#7CC4C2"; AQUA_D = "#4FA3A6"; AQUA_L = "#B5E0DC"
SKY = "#BFE0EE"; SKY_D = "#8EC3DB"; SKY_L = "#DDF0F7"
PEACH = "#F7DCC4"; PEACH_D = "#EBC3A3"
NURSE = "#A9D8EA"; NURSE_D = "#7DBCD6"
HEART = "#EE6F7C"; HEART_D = "#C9505E"; HEART_L = "#F8A5AE"
COUNTER = "#EEF3EA"; COUNTER_D = "#C9D9CC"; COUNTER_L = "#FAFCF6"
GREY = "#D9D9D6"; GREY_D = "#B4B4B0"; GREY_L = "#F1F1EE"   # the lens limbs (tinted in the game: keep them light grey)
INK = "#3A2A22"
STICK = "#E7C38A"; STICK_D = "#B98A4C"


def wr(x, y, w, h, rad, j=1.5, seed=1, step=40):
    return pb.wrect(x, y, w, h, rad, j, seed, step)


def rect(x, y, w, h, fill, extra=""):
    return f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}" fill="{fill}"{extra}/>'


def doc(p, w, h, body, material="default", seed=3, sh=(4, 3.5, .33), cut=None, extra_defs=""):
    return svg(w, h, std_defs(p, material, seed, sh, (8, 7, .28), cut) + extra_defs, G(body, p + "gr"))


def heart(cx, cy, s, fill, extra=""):
    d = (f"M{n(cx)},{n(cy + 30 * s)} C{n(cx - 46 * s)},{n(cy - 4 * s)} {n(cx - 34 * s)},{n(cy - 40 * s)} {n(cx)},{n(cy - 18 * s)}"
         f" C{n(cx + 34 * s)},{n(cy - 40 * s)} {n(cx + 46 * s)},{n(cy - 4 * s)} {n(cx)},{n(cy + 30 * s)}Z")
    return P(d, fill, extra)


def star(cx, cy, r, fill, rot=-90, inner=.48, extra=""):
    pts = []
    for i in range(10):
        a = math.radians(rot + i * 36)
        rr = r if i % 2 == 0 else r * inner
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
    return P("M" + " L".join(f"{n(x)},{n(y)}" for x, y in pts) + "Z", fill, extra)


def cloud(x, y, s, fill, seed, extra=""):
    return "".join(P(wob(x + dx * s, y + dy * s, r * s, r * .72 * s, .05, seed + i, 16), fill, extra)
                   for i, (dx, dy, r) in enumerate(((-58, 10, 52), (0, -10, 72), (64, 8, 56))))


# ================================================================ the rooms
def window(p, x, y, w, h, seed, tree=True):
    """A window with sky, a hill, a tree and curtains (static: the clinic has no living window)."""
    s = P(wr(x - 18, y - 18, w + 36, h + 36, 10, 1.4, seed), WHITE)
    clip = f'<clipPath id="{p}w{seed}"><rect x="{x}" y="{y}" width="{w}" height="{h}"/></clipPath>'
    view = rect(x, y, w, h, SKY) + rect(x, y + h * .55, w, h * .45, SKY_L, ' opacity="0.6"')
    view += cloud(x + w * .3, y + h * .25, .7, WHITE, seed + 5, ' opacity="0.9"')
    view += C(x + w * .8, y + h * .22, h * .1, "#FFE08A")
    view += P(f"M{x},{n(y + h * .8)} Q{n(x + w * .35)},{n(y + h * .58)} {n(x + w * .7)},{n(y + h * .76)} T{x + w},{n(y + h * .7)} L{x + w},{y + h} L{x},{y + h}Z", BG_SAGE)
    if tree:
        view += rect(x + w * .22 - 7, y + h * .6, 14, h * .25, WALNUT) + P(wob(x + w * .22, y + h * .56, 44, 40, .1, seed + 9, 14), SAGE_D)
    s += f'<g clip-path="url(#{p}w{seed})">{view}</g>' + clip
    s += rect(x + w / 2 - 7, y, 14, h, WHITE) + rect(x, y + h / 2 - 7, w, 14, WHITE)
    s += P(wr(x - 30, y + h + 10, w + 60, 24, 8, 1, seed + 3), WHITE)
    # curtains
    for side in (-1, 1):
        cx = x - 40 if side < 0 else x + w + 40
        d = f"M{cx - 50},{y - 40} L{cx + 50},{y - 40} Q{cx + 30 * side + 10},{y + h * .5} {cx + 40},{y + h + 30} L{cx - 40},{y + h + 30} Q{cx - 20},{y + h * .5} {cx - 50},{y - 40}Z"
        s += P(d, HEART_L) + "".join(C(cx - 26 + (i % 3) * 26, y - 10 + (i // 3) * 46, 5, WHITE, ' opacity="0.8"') for i in range(3 * int(h / 46)))
    s += P(wr(x - 110, y - 52, w + 220, 18, 8, 1, seed + 4), WALNUT)
    return s


def eye_chart(x, y):
    """A picture chart (no letters): a big star, then hearts, then circles, smaller row by row."""
    s = P(wr(x, y, 200, 280, 10, 1.2, 31), WHITE) + P(wr(x + 8, y + 8, 184, 264, 6, 1, 32), "#FFFCF2")
    s += star(x + 100, y + 62, 42, MUSTARD)
    s += heart(x + 64, y + 140, .55, HEART) + heart(x + 136, y + 140, .55, HEART)
    s += "".join(C(x + 52 + i * 32, y + 200, 11, AQUA_D) for i in range(4))
    s += "".join(star(x + 48 + i * 26, y + 244, 8, CORAL) for i in range(5))
    return s


def bg_clinic():
    """2400x1080, the treatment room. Like the kitchen: the wall to y 390, a long white counter from there to the
    bottom (the exam cushion and the tool dishes stand on it, Mom stands behind it), so every layout of the kitchen
    fits. Mom's face covers about x 1800-2300, y 40-420 at 20:9: the wall's pieces stay left of it or behind her."""
    p = "bgc-"
    L = [rect(0, 0, 2400, 400, MINT)]
    stripes = "".join(rect(x, 0, 30, 400, MINT_L, ' opacity="0.55"') for x in range(0, 2400, 90))
    L.append(stripes)
    # little hearts in the wallpaper
    rr = random.Random(4)
    L.append("".join(heart(x + rr.uniform(-8, 8), y + rr.uniform(-6, 6), .22, MINT_D, ' opacity="0.7"') for x in range(45, 2400, 180) for y in (60, 190, 320)))
    # the splashback tiles and the counter
    L.append(rect(0, 340, 2400, 70, WHITE))
    L.append("".join(rect(x, 340, 2, 70, COUNTER_D, ' opacity="0.6"') for x in range(0, 2400, 64)))
    L.append(rect(0, 372, 2400, 2, COUNTER_D, ' opacity="0.6"'))
    L.append(G(rect(0, 408, 2400, 600, COUNTER) + rect(0, 408, 2400, 10, COUNTER_L), p + "sh"))
    L.append("".join(rect(0, y, 2400, 3, COUNTER_D, ' opacity="0.3"') for y in range(470, 1000, 90)))
    L.append("".join(heart(x, y, .18, MINT_D, ' opacity="0.45"') for x in range(120, 2400, 240) for y in (520, 790)))
    L.append(G(rect(0, 1000, 2400, 80, WHITE) + rect(0, 1018, 2400, 16, AQUA_L) + "".join(rect(x, 1040, 120, 8, COUNTER_D, ' opacity="0.7"') for x in range(80, 2400, 300)), p + "sh"))
    # the window (centre-left) and the chart, a shelf with cotton jars, a plant and a teddy, a heart poster, a cabinet
    L.append(G(window(p, 720, 60, 380, 230, 11), p + "sh"))
    L.append(G(eye_chart(1250, 50), p + "sh"))
    shelf = P(wr(260, 250, 330, 20, 6, 1, 41), WOOD) + P(f"M290,270 L300,300 L310,270Z", WOOD_D) + P(f"M540,270 L550,300 L560,270Z", WOOD_D)
    jar = lambda x, w, h, col: (P(wr(x, 250 - h, w, h, 14, 1, int(x)), "#EAF6F8", ' opacity="0.92"')
                                + "".join(C(x + 18 + (i % 3) * (w - 36) / 2, 250 - 20 - (i // 3) * 22, 14, col) for i in range(int(h / 22) * 3))
                                + P(wr(x - 4, 250 - h - 18, w + 8, 22, 6, 1, int(x) + 1), AQUA_D))
    shelf += jar(282, 86, 104, WHITE) + jar(386, 70, 80, HEART_L)
    shelf += P(wr(480, 196, 64, 54, 10, 1, 45), CORAL) + P(wob(512, 170, 46, 38, .12, 46, 14), GREEN) + P(wob(490, 150, 26, 22, .12, 47, 12), GREEN_L)
    L.append(G(shelf, p + "sh"))
    # teddy bear on the window sill
    ted = C(1150, 278, 26, WOOD) + C(1150, 240, 22, WOOD) + C(1133, 222, 9, WOOD) + C(1167, 222, 9, WOOD)
    ted += C(1150, 246, 8, WOOD_L) + C(1143, 236, 3, INK) + C(1157, 236, 3, INK) + heart(1150, 282, .3, HEART)
    L.append(G(ted, p + "sh"))
    # a heart poster with a smiling plaster
    post = P(wr(1520, 70, 190, 220, 10, 1.2, 51), WHITE) + heart(1615, 170, 1.4, HEART_L)
    post += P(wr(1565, 160, 100, 34, 14, 1, 52), "#F5D9A8", ' transform="rotate(-25 1615 177)"') + rect(1600, 160, 30, 34, "#EBC489", ' transform="rotate(-25 1615 177)"')
    post += C(1600, 150, 5, INK) + C(1630, 150, 5, INK)
    L.append(G(post, p + "sh"))
    # the glass cabinet behind Mom (only its left side shows beside her)
    cab = P(wr(1800, 30, 520, 300, 10, 1.2, 61), WHITE) + P(wr(1820, 50, 230, 260, 6, 1, 62), SKY_L) + P(wr(2070, 50, 230, 260, 6, 1, 63), SKY_L)
    cab += rect(1820, 175, 480, 8, WHITE)
    cab += "".join(P(wr(x, 105, 44, 66, 10, 1, x), c) for x, c in ((1850, HEART_L), (1910, "#FFE6A8"), (1970, AQUA_L), (2100, "#E6D8F2"), (2170, HEART_L)))
    cab += "".join(C(x, 280, 22, c) for x, c in ((1870, WHITE), (1920, "#FFE6A8"), (2120, AQUA_L), (2180, WHITE), (2240, HEART_L)))
    L.append(G(cab, p + "sh"))
    return doc(p, 2400, 1080, "".join(L), "bg", seed=71, sh=(4, 4, .22))


def bg_clinic_wait():
    """2400x1080, the waiting room: a warm wall, a window, pictures, the door to the treatment room (a round window
    with a heart), a wooden floor with a round rug (the bench and the patients are drawn on it by the game)."""
    p = "bgw-"
    L = [rect(0, 0, 2400, 600, PEACH)]
    L.append("".join(rect(x, 0, 6, 600, PEACH_D, ' opacity="0.35"') for x in range(40, 2400, 120)))
    L.append(rect(0, 470, 2400, 130, AQUA_L) + rect(0, 466, 2400, 12, WHITE))
    L.append("".join(rect(x, 478, 4, 122, AQUA, ' opacity="0.35"') for x in range(30, 2400, 60)))
    # floor
    L.append(rect(0, 600, 2400, 480, BG_WOOD))
    rr = random.Random(9)
    L.append("".join(rect(0, y, 2400, 3, BG_WOOD_D, ' opacity="0.5"') for y in range(650, 1080, 70)))
    L.append("".join(rect(rr.uniform(0, 2400), y, 3, 70, BG_WOOD_D, ' opacity="0.4"') for y in range(600, 1080, 70) for _ in range(5)))
    L.append(rect(0, 596, 2400, 14, WALNUT))
    # the rug
    L.append(G(P(wob(1000, 860, 640, 130, .02, 3, 40), HEART_L) + P(wob(1000, 860, 560, 100, .02, 4, 40), "#FBE3DA")
               + "".join(heart(1000 + math.cos(a) * 470, 860 + math.sin(a) * 86, .3, HEART) for a in [i * math.pi / 6 for i in range(12)]), p + "sh"))
    # window, pictures, door
    L.append(G(window(p, 330, 90, 340, 250, 21), p + "sh"))
    fr = lambda x, y, w, h, inner, sd: P(wr(x, y, w, h, 8, 1.2, sd), WOOD) + P(wr(x + 14, y + 14, w - 28, h - 28, 4, 1, sd + 1), "#FFFCF2") + inner
    fish = P(wob(925, 210, 46, 28, .05, 5, 16), CORAL) + P("M968,210 L1000,186 L1000,234Z", CORAL_D) + C(905, 204, 6, INK)
    fish += "".join(C(880 + i * 26, 160 - i * 12, 6 + i, SKY_D, ' opacity="0.8"') for i in range(3))
    L.append(G(fr(830, 120, 220, 170, fish, 31), p + "sh"))
    rain = "".join(stroke(f"M{1630 + i * 10},280 A{70 - i * 10},{70 - i * 10} 0 0 1 {1770 - i * 10},280", c, 9) for i, c in enumerate((HEART, MUSTARD, GREEN, SKY_D)))
    L.append(G(fr(1600, 160, 200, 150, rain, 33), p + "sh"))
    door = P(wr(1160, 120, 340, 486, 14, 1.4, 41), WHITE) + P(wr(1182, 140, 296, 466, 10, 1.2, 42), AQUA)
    door += C(1330, 260, 70, WHITE) + C(1330, 260, 58, SKY_L) + heart(1330, 262, .9, HEART)
    door += P(wr(1210, 380, 240, 180, 8, 1, 43), AQUA_D, ' opacity="0.35"') + C(1440, 400, 14, MUSTARD)
    L.append(G(door, p + "sh"))
    # a toy box with a ball and blocks, a tall plant
    toys = P(wr(110, 700, 260, 170, 14, 1.4, 51), CORAL) + rect(110, 740, 260, 16, CORAL_D, ' opacity="0.6"')
    toys += C(180, 690, 40, SKY_D) + P("M140,690 Q180,660 220,690", "none", f' stroke="{WHITE}" stroke-width="8"')
    toys += P(wr(240, 640, 60, 60, 6, 1, 52), MUSTARD) + P(wr(300, 660, 50, 50, 6, 1, 53), GREEN)
    L.append(G(toys, p + "sh"))
    plant = P(wr(1020, 520, 110, 110, 18, 1, 61), MUSTARD) + "".join(P(wob(1075 + dx, 470 + dy, 40, 18, .1, 62 + i, 12, a), GREEN if i % 2 else GREEN_L)
                                                                   for i, (dx, dy, a) in enumerate(((-40, 20, -30), (40, 10, 30), (-20, -40, -70), (25, -50, 70), (0, -90, 90))))
    L.append(G(plant, p + "sh"))
    return doc(p, 2400, 1080, "".join(L), "bg", seed=81, sh=(4, 4, .22))


# ================================================================ furniture
def clinic_bed():
    """900x320: a padded exam cushion lying on the counter, a strip of paper over it, a pillow at the left. The
    patient sits on it with her feet at BED_SEAT."""
    p = "cbd-"
    s = G(P(wr(20, 120, 860, 180, 40, 2, 1), AQUA_D) + P(wr(20, 104, 860, 176, 40, 2, 2), AQUA), p + "cut")
    s += P(wr(40, 112, 820, 30, 14, 1, 3), AQUA_L, ' opacity="0.7"')
    s += "".join(C(x, 190, 6, AQUA_D, ' opacity="0.6"') for x in range(120, 820, 120))
    s += G(P(wr(220, 96, 460, 150, 10, 1, 4), WHITE, ' opacity="0.92"'), p + "sh")
    s += G(P(wob(120, 120, 100, 52, .05, 5, 20, -6), WHITE) + P(wob(110, 108, 70, 26, .08, 6, 16, -6), GREY_L), p + "sh")
    s += ground_shadow(450, 296, 430, 18, p, .25)
    return doc(p, 900, 320, s, "smooth", seed=101, cut={"rim": 3, "rough": 4})


def clinic_bench():
    """1500x420: a wooden bench with a back for the waiting room; the patients sit with their feet at BENCH_SEAT."""
    p = "cbn-"
    back = P(wr(60, 20, 1380, 70, 16, 1.4, 1), WOOD) + P(wr(60, 110, 1380, 60, 14, 1.2, 2), WOOD_L)
    posts = "".join(P(wr(x, 10, 44, 300, 10, 1, x), WOOD_D) for x in (90, 1366))
    seat = P(wr(30, 250, 1440, 70, 16, 1.4, 3), WOOD) + P(wr(40, 254, 1420, 18, 8, 1, 4), WOOD_L, ' opacity="0.8"')
    legs = "".join(P(wr(x, 310, 40, 96, 8, 1, x + 7), WOOD_D) for x in (100, 520, 940, 1360))
    s = G(posts + back, p + "cut") + G(legs, p + "sh") + G(seat, p + "cut")
    return doc(p, 1500, 420, s, "rough", seed=111, cut={"rim": 3, "rough": 5, "freq": .12})


def clinic_slot():
    """240x240: the round enamel dish a tool lies on (the tray in the left column)."""
    p = "csl-"
    s = G(P(wob(120, 130, 104, 98, .02, 1, 30), SKY_D) + P(wob(120, 124, 100, 94, .02, 2, 30), WHITE), p + "cut")
    s += P(wob(120, 128, 80, 74, .03, 3, 26), SKY_L, ' opacity="0.8"') + P(wob(94, 92, 34, 12, .1, 4, 12, -30), WHITE, ' opacity="0.9"')
    return doc(p, 240, 240, s, "smooth", seed=121, cut={"rim": 2.6, "rough": 3.5})


def clinic_chart():
    """300x380: the treatment plan, a sheet on a clipboard; the tools are drawn in code in its rows (CHART_ROWS)."""
    p = "cch-"
    s = G(P(wr(20, 30, 260, 340, 18, 1.6, 1), WOOD), p + "cut")
    s += G(P(wr(40, 66, 220, 290, 6, 1, 2), WHITE), p + "sh")
    s += G(P(wr(105, 14, 90, 46, 12, 1, 3), METAL_D) + P(wr(115, 22, 70, 22, 8, 1, 4), METAL_L), p + "sh")
    s += "".join(rect(60, y, 180, 3, SKY_D, ' opacity="0.5"') for y in CHART_LINES)
    s += heart(232, 336, .35, HEART)
    return doc(p, 300, 380, s, "rough", seed=131, cut={"rim": 3, "rough": 5, "freq": .12})


CHART_LINES = (140, 210, 280)
CHART_ROWS = [(150, 104), (150, 175), (150, 246), (150, 316)]   # the centres of the four tool rows (300x380 frame)


# ================================================================ the tools (240x240; TOOL_TIP = the point that does the work)
def tool_doc(p, s, seed):
    return doc(p, 240, 240, G(s, p + "cut"), "smooth", seed=seed, cut={"rim": 2.6, "rough": 3.5})


def thermometer():
    p = "tth-"
    t = ' transform="rotate(-45 120 120)"'
    s = P(wr(104, 20, 32, 170, 16, 1, 1), WHITE, t) + P(wr(113, 40, 14, 140, 7, 1, 2), GREY_L, t)
    s += P(wr(113, 120, 14, 64, 7, 1, 3), HEART, t) + C(120, 196, 20, HEART, t) + C(114, 190, 6, HEART_L, t)
    s += P(wr(100, 14, 40, 40, 14, 1, 4), AQUA, t)
    s += "".join(rect(129, y, 8, 3, GREY_D, t) for y in range(60, 170, 18))
    return tool_doc(p, s, 201)


def stethoscope():
    p = "tst-"
    tube = stroke("M70,40 Q50,120 110,150 Q160,170 168,196", AQUA_D, 14) + stroke("M110,40 Q110,110 110,150", AQUA_D, 14)
    s = tube + C(70, 36, 10, METAL_D) + C(110, 36, 10, METAL_D)
    s += C(176, 200, 30, METAL_D) + C(176, 200, 22, METAL_L) + C(170, 194, 7, WHITE, ' opacity="0.8"')
    return tool_doc(p, s, 202)


def plaster():
    p = "tpl-"
    t = ' transform="rotate(-30 120 120)"'
    s = P(wr(20, 88, 200, 64, 30, 1, 1), "#F5D9A8", t) + P(wr(88, 92, 64, 56, 10, 1, 2), "#EBC489", t)
    s += "".join(C(x, y, 3, "#D9AE6E", t) for x in (40, 56, 184, 200) for y in (108, 132))
    s += heart(120, 122, .3, HEART_L, t)
    return tool_doc(p, s, 203)


def cream():
    p = "tcr-"
    t = ' transform="rotate(-35 120 120)"'
    s = P(f"M70,70 L170,70 L160,190 Q120,200 80,190Z", WHITE, t) + rect(70, 186, 100, 18, AQUA_D, t)
    s += P(wr(98, 30, 44, 44, 8, 1, 1), HEART, t) + rect(108, 18, 24, 18, HEART_D, t)
    s += heart(120, 128, .5, HEART_L, t)
    return tool_doc(p, s, 204)


def spray():
    p = "tsp-"
    s = P(wr(70, 90, 100, 130, 30, 1.2, 1), SKY_D) + P(wr(80, 100, 80, 110, 24, 1, 2), SKY_L, ' opacity="0.8"')
    s += rect(98, 60, 44, 34, WHITE) + P("M92,40 L168,40 L176,64 L92,64Z", AQUA) + rect(52, 44, 44, 14, AQUA_D)
    s += P(wob(120, 160, 26, 18, .1, 3, 12), WHITE, ' opacity="0.7"')
    return tool_doc(p, s, 205)


def tweezers():
    p = "ttw-"
    s = P("M190,40 L60,190 L54,186 L176,34Z", METAL_D) + P("M196,50 L66,196 L62,192 L184,44Z", METAL)
    s += P("M196,30 Q214,40 200,58 L180,40Z", METAL_D) + C(58, 192, 5, METAL_D)
    return tool_doc(p, s, 206)


def magnifier():
    p = "tmg-"
    s = stroke("M150,150 L210,210", WALNUT_D, 30) + stroke("M150,150 L208,208", WALNUT, 22)
    s += C(100, 100, 74, AQUA_D) + C(100, 100, 60, SKY_L) + P(wob(78, 74, 24, 12, .1, 3, 12, -40), WHITE, ' opacity="0.9"')
    return tool_doc(p, s, 207)


def toothbrush():
    p = "ttb-"
    t = ' transform="rotate(-40 120 120)"'
    s = P(wr(108, 70, 24, 160, 12, 1, 1), HEART, t) + P(wr(104, 14, 32, 70, 10, 1, 2), WHITE, t)
    s += "".join(rect(108 + (i % 3) * 8, 18 + (i // 3) * 12, 6, 10, SKY_D, t) for i in range(15))
    return tool_doc(p, s, 208)


def cup():
    p = "tcu-"
    s = P("M64,70 L176,70 L162,206 Q120,216 78,206Z", WHITE) + P("M72,86 L168,86 L160,170 Q120,178 80,170Z", SKY, ' opacity="0.85"')
    s += P(wob(120, 72, 56, 10, .02, 3, 20), SKY_D, ' opacity="0.8"') + stroke("M150,30 L130,140", HEART, 10)
    s += heart(120, 190, .3, HEART_L)
    return tool_doc(p, s, 209)


def syrup():
    """A spoon of pink medicine (the bowl at the lower left is the tip)."""
    p = "tsy-"
    s = stroke("M200,40 L110,140", METAL_D, 16) + stroke("M200,40 L110,140", METAL_L, 9)
    s += P(wob(80, 168, 52, 38, .03, 1, 20, -40), METAL_D) + P(wob(80, 168, 42, 29, .04, 2, 20, -40), HEART_L)
    s += P(wob(70, 160, 14, 7, .1, 3, 12, -40), WHITE, ' opacity="0.8"')
    return tool_doc(p, s, 210)


def cloth():
    p = "tcl-"
    s = P(wr(40, 70, 160, 110, 18, 2, 1), SKY_D) + P(wr(40, 60, 160, 104, 18, 2, 2), SKY)
    s += "".join(rect(52, y, 136, 4, WHITE, ' opacity="0.6"') for y in (90, 112, 134))
    s += P(wob(84, 82, 26, 9, .1, 3, 12, -10), WHITE, ' opacity="0.8"') + P(wr(40, 150, 160, 30, 12, 1.2, 4), SKY_D, ' opacity="0.5"')
    return tool_doc(p, s, 211)


def hotbottle():
    p = "thb-"
    s = P(wr(56, 70, 128, 150, 40, 1.4, 1), CORAL) + P(wr(70, 86, 100, 118, 30, 1, 2), CORAL_L, ' opacity="0.6"')
    s += rect(96, 34, 48, 44, CORAL_D) + P(wr(90, 22, 60, 22, 8, 1, 3), MUSTARD)
    s += heart(120, 150, .55, WHITE, ' opacity="0.85"')
    return tool_doc(p, s, 212)


TOOL_TIP = {
    "thermometer": (174, 174), "stethoscope": (176, 200), "plaster": (120, 120), "cream": (68, 46),
    "spray": (52, 50), "tweezers": (58, 192), "magnifier": (100, 100), "toothbrush": (74, 65),
    "cup": (120, 120), "syrup": (80, 168), "cloth": (120, 120), "hotbottle": (120, 150),
}


# ================================================================ the close-up lenses (520x520, light grey: tinted)
LENS = 520


def lens_doc(p, s, seed):
    clip = f'<clipPath id="{p}lc"><circle cx="260" cy="260" r="250"/></clipPath>'
    return svg(LENS, LENS, std_defs(p, "smooth", seed, (4, 3.5, .25), (8, 7, .2), {"rim": 2, "rough": 3}) + clip,
               G(f'<g clip-path="url(#{p}lc)">{s}</g>', p + "gr"))


def lens_knee():
    """A leg bent at the knee: the thigh from the left, the round knee, the shin going down (the scrape: KNEE)."""
    p = "lkn-"
    leg = "M-20,200 L250,190 Q380,186 410,290 Q430,370 410,560 L250,560 Q262,420 240,370 Q200,330 -20,350Z"
    s = G(P(leg, GREY), p + "sh")
    s += P(wob(320, 285, 92, 80, .04, 2, 22), GREY_L, ' opacity="0.75"')
    s += stroke("M230,360 Q260,330 300,370", GREY_D, 5, ' opacity="0.5"') + stroke("M40,250 L200,246", GREY_L, 10, ' opacity="0.6"')
    return lens_doc(p, s, 301)


def lens_paw():
    """A foot from below: a big pad and four toe pads (the splinter goes into PAW)."""
    p = "lpw-"
    s = G(P(wob(260, 320, 190, 170, .03, 1, 30), GREY), p + "sh")
    s += P(wob(260, 360, 110, 80, .04, 2, 24), GREY_D, ' opacity="0.55"')
    s += "".join(G(P(wob(x, y, 46, 54, .05, 3 + i, 18), GREY), p + "sh") + P(wob(x, y + 6, 28, 32, .06, 9 + i, 14), GREY_D, ' opacity="0.5"')
                 for i, (x, y) in enumerate(((120, 160), (210, 110), (310, 110), (400, 160))))
    return lens_doc(p, s, 302)


def lens_tummy():
    """A round tummy with a belly button (the stethoscope and the warm bottle go on it)."""
    p = "ltm-"
    s = G(P(wob(260, 300, 250, 240, .02, 1, 36), GREY), p + "sh")
    s += P(wob(260, 320, 170, 160, .03, 2, 30), GREY_L, ' opacity="0.7"')
    s += P(wob(262, 330, 14, 10, .1, 3, 12), GREY_D) + stroke("M250,326 Q262,336 274,326", GREY_D, 4)
    return lens_doc(p, s, 303)


def lens_mouth():
    """An open mouth (not tinted): the lips, the pink inside, the tongue, four teeth above and four below (TEETH)."""
    p = "lmo-"
    s = rect(0, 0, 520, 520, "#F3D9C6")
    s += G(P(wob(260, 270, 230, 170, .02, 1, 36), "#E5867E"), p + "sh")
    s += P(wob(260, 280, 200, 140, .02, 2, 36), "#9C3A3E")
    s += P(wob(260, 360, 130, 60, .04, 3, 24), "#E86D70") + stroke("M260,330 L260,390", "#C9505E", 5)
    for (x, y) in TEETH:
        up = y < 270
        s += G(P(wr(x - 32, y - 40, 64, 80, 24, 1, int(x + y)), WHITE), p + "sh")
        s += P(wob(x - 10, y - (18 if up else -18), 8, 16, .1, int(x), 10), GREY_L, ' opacity="0.9"')
    return lens_doc(p, s, 304)


TEETH = [(155, 190), (222, 172), (298, 172), (365, 190), (165, 350), (228, 368), (292, 368), (355, 350)]
KNEE = (320, 285)
PAW = (262, 340)


def lens_ring():
    """600x600: the magnifier's rim around the lens (the lens's 520 circle sits in its middle)."""
    p = "lrg-"
    s = G(f'<path d="M300,20 A280,280 0 1 1 299.9,20Z M300,48 A252,252 0 1 0 300.1,48Z" fill="{AQUA_D}" fill-rule="evenodd"/>', p + "cut")
    s += f'<path d="M300,30 A270,270 0 1 1 299.9,30Z M300,44 A256,256 0 1 0 300.1,44Z" fill="{AQUA_L}" fill-rule="evenodd" opacity="0.8"/>'
    s += P(wob(170, 110, 60, 14, .1, 3, 12, -35), WHITE, ' opacity="0.8"')
    return doc(p, 600, 600, s, "smooth", seed=311, cut={"rim": 3, "rough": 4})


# ================================================================ what is wrong (overlays)
def scrape():
    """200x140: a pink scuff (no blood) with little lines; the dust lies over it (clinic-dust)."""
    p = "osc-"
    s = P(wob(100, 70, 80, 46, .12, 1, 20, -10), "#F2A7A4", ' opacity="0.9"') + P(wob(96, 70, 54, 28, .15, 2, 16, -10), "#EE8E8E", ' opacity="0.8"')
    s += "".join(stroke(f"M{50 + i * 22},{50 + (i % 2) * 6} L{70 + i * 22},{86 - (i % 2) * 4}", "#E07A7C", 4, ' opacity="0.7"') for i in range(5))
    return doc(p, 200, 140, s, "smooth", seed=401)


def dust():
    p = "odu-"
    rr = random.Random(3)
    s = "".join(P(wob(rr.uniform(30, 190), rr.uniform(30, 130), rr.uniform(6, 14), rr.uniform(5, 11), .2, i, 10), rr.choice(["#9C7A58", "#B89874", "#7E6248"]))
                for i in range(26))
    return doc(p, 220, 160, G(s, p + "sh"), "default", seed=402)


def splinter():
    p = "osp-"
    s = P("M10,40 L140,22 L150,30 L18,52Z", STICK) + P("M10,40 L140,26 L18,48Z", STICK_D, ' opacity="0.5"')
    return doc(p, 160, 70, G(s, p + "sh"), "default", seed=403)


def cream_smear():
    p = "ocs-"
    s = P(wob(90, 60, 74, 40, .15, 1, 18), WHITE, ' opacity="0.95"') + stroke("M40,60 Q80,30 120,58 Q90,80 60,64", "#EDEDE8", 6)
    return doc(p, 180, 120, s, "smooth", seed=404)


def dirt():
    """100x90: a brown smudge on a tooth (brushed away)."""
    p = "odt-"
    s = P(wob(50, 46, 34, 30, .18, 1, 14), "#B98A4C", ' opacity="0.9"') + P(wob(44, 40, 16, 12, .2, 2, 12), "#8E6532", ' opacity="0.8"')
    return doc(p, 100, 90, s, "smooth", seed=405)


def cheek():
    p = "och-"
    return doc(p, 110, 70, P(wob(55, 35, 46, 24, .05, 1, 16), "#F0697A", ' opacity="0.75"'), "smooth", seed=406)


def sweat():
    p = "osw-"
    s = P("M30,4 Q52,44 46,60 Q40,76 30,76 Q20,76 14,60 Q8,44 30,4Z", "#9FD4F0") + P(wob(24, 56, 6, 9, .1, 2, 10), WHITE, ' opacity="0.8"')
    return doc(p, 60, 80, G(s, p + "sh"), "smooth", seed=407)


def bump():
    """120x110: a puffy cheek (the sore tooth's clue), pink and round, with a tiny ice pack's cool shine."""
    p = "obm-"
    s = P(wob(60, 58, 50, 44, .04, 1, 18), "#F6B6AE", ' opacity="0.95"') + P(wob(48, 44, 18, 12, .1, 2, 12, -30), WHITE, ' opacity="0.7"')
    return doc(p, 120, 110, G(s, p + "sh"), "smooth", seed=408)


# ================================================================ stickers and the problem cards
def sticker(kind):
    p = f"st{kind[:2]}-"
    s = G(P(wob(100, 104, 86, 86, .02, 1, 30), WHITE), p + "cut")
    if kind == "star":
        s += star(100, 106, 66, MUSTARD) + star(100, 106, 40, "#FFE08A")
    elif kind == "heart":
        s += heart(100, 108, 1.7, HEART) + P(wob(78, 84, 16, 9, .1, 2, 10, -30), HEART_L, ' opacity="0.9"')
    else:
        s += C(100, 104, 66, "#FFD152") + C(78, 90, 9, INK) + C(122, 90, 9, INK)
        s += stroke("M66,118 Q100,152 134,118", INK, 8) + C(64, 116, 10, CHEEK, ' opacity="0.7"') + C(136, 116, 10, CHEEK, ' opacity="0.7"')
    return doc(p, 200, 200, s, "smooth", seed=500 + len(kind), cut={"rim": 3, "rough": 4})


def sick(kind):
    """200x200: what is wrong, as a picture (Pipa's bubble on little chef; the three cards on big chef)."""
    p = f"sk{kind[:2]}-"
    s = G(P(wob(100, 104, 90, 90, .02, 1, 30), "#FFFCF2"), p + "cut")
    if kind == "fever":
        t = ' transform="rotate(-30 100 100)"'
        s += P(wr(88, 30, 24, 120, 12, 1, 2), WHITE, t + ' stroke="#B4B4B0" stroke-width="3"') + P(wr(93, 60, 14, 84, 7, 1, 3), HEART, t) + C(100, 156, 18, HEART, t)
        s += "".join(stroke(f"M{140 + i * 10},{60 + i * 22} Q{150 + i * 10},{50 + i * 22} {160 + i * 10},{60 + i * 22}", CORAL, 5) for i in range(3))
    elif kind == "cough":
        s += cloud(104, 92, .62, SKY_L, 4) + "".join(C(62 + i * 20, 150 - i * 10, 6 + 2 * i, SKY_D) for i in range(3))
        s += "".join(stroke(f"M{x},{y} q12,-10 24,0", SKY_D, 5) for x, y in ((52, 80), (140, 60)))
    elif kind == "tummy":
        s += C(100, 112, 62, "#F6C9A8") + P(wob(100, 120, 9, 7, .1, 3, 10), "#C99878")
        s += "".join(stroke(f"M{n(100 + math.cos(a) * 78)},{n(112 + math.sin(a) * 78)} q8,-10 16,0 q8,10 16,0", CORAL, 5) for a in (-2.6, -0.55, 0.9))
    elif kind == "tooth":
        s += P("M60,60 Q100,40 140,60 Q150,110 132,152 Q120,164 112,130 Q100,116 88,130 Q80,164 68,152 Q50,110 60,60Z", WHITE, ' stroke="#B4B4B0" stroke-width="4"')
        s += P(wob(116, 82, 14, 12, .2, 4, 12), "#B98A4C")
    elif kind == "knee":
        s += P("M30,150 Q80,100 120,100 Q160,104 170,160 L130,180 Q120,140 100,140 Q70,146 50,180Z", "#F6C9A8")
        s += P(wob(120, 120, 22, 14, .15, 5, 14), "#F2A7A4") + "".join(C(108 + i * 8, 116 + (i % 2) * 6, 3, "#9C7A58") for i in range(4))
    elif kind == "paw":
        s += C(100, 128, 40, "#F6C9A8") + "".join(C(x, y, 16, "#F6C9A8") for x, y in ((56, 84), (86, 62), (116, 62), (146, 84)))
        s += P("M84,124 L132,112 L134,118 L86,130Z", STICK_D)
    return doc(p, 200, 200, G(s, p + "sh") if kind not in ("fever",) else s, "smooth", seed=520 + len(kind), cut={"rim": 3, "rough": 4})


# ================================================================ the title's two worlds, the photo frame
def world_btn(kind):
    """240x240 (shown at 1.4x, raster 1.4 like btn-play): the kitchen's pot with steam on coral, the clinic's nurse bag
    with a heart on aqua."""
    p = f"bw{kind[:2]}-"
    col, col_d = (CORAL, CORAL_D) if kind == "kitchen" else (AQUA, AQUA_D)
    s = G(P(wob(120, 126, 104, 104, .015, 1, 36), col_d) + P(wob(120, 120, 104, 104, .015, 2, 36), col), p + "cut")
    s += P(wob(92, 72, 40, 18, .1, 3, 14, -30), WHITE, ' opacity="0.35"')
    if kind == "kitchen":
        s += P("M58,112 L182,112 L172,176 Q120,190 68,176Z", WHITE) + rect(44, 112, 152, 14, WHITE) + P(wr(104, 96, 32, 14, 6, 1, 4), WHITE)
        s += rect(36, 126, 24, 10, WHITE) + rect(180, 126, 24, 10, WHITE)
        s += "".join(stroke(f"M{x},88 Q{x - 10},72 {x},58 Q{x + 10},44 {x},30", WHITE, 7, ' opacity="0.9"') for x in (92, 120, 148))
        s += heart(120, 150, .45, col)
    else:
        s += P(wr(54, 88, 132, 100, 18, 1.2, 5), WHITE) + stroke("M96,90 L96,70 Q96,62 104,62 L136,62 Q144,62 144,70 L144,90", WHITE, 10)
        s += heart(120, 140, .8, HEART)
    return doc(p, 240, 240, s, "smooth", seed=600 + len(kind), cut={"rim": 3, "rough": 4})


FRAME_WIN = (80, 80, 540, 540)


def photo_frame_clinic():
    """700x780: an aqua frame with hearts and plasters round it, its window (FRAME_WIN) open; stickers below."""
    p = "pfc-"
    x, y, w, h = FRAME_WIN
    outer = wr(30, 30, 640, 640, 26, 2, 1, step=24)
    s = G(f'<path d="{outer} M{x},{y} h{w} v{h} h-{w}Z" fill="{AQUA}" fill-rule="evenodd"/>', p + "cut")
    s += G(f'<path d="{wr(46, 46, 608, 608, 20, 1.4, 2, step=24)} M{x - 8},{y - 8} h{w + 16} v{h + 16} h-{w + 16}Z" fill="{AQUA_L}" fill-rule="evenodd" opacity="0.7"/>', p + "sh")
    rr = random.Random(5)
    deco = ""
    for i in range(12):
        side = i % 4
        t = rr.uniform(.12, .88)
        px, py = [(40 + t * 620, 56), (644, 40 + t * 620), (40 + t * 620, 644), (56, 40 + t * 620)][side]
        deco += heart(px, py, .32, HEART if i % 2 else WHITE)
    s += G(deco, p + "sh")
    s += G(P(wr(-20, 60, 150, 44, 18, 1, 9), "#F5D9A8", ' transform="rotate(-35 55 82)"') + P(wr(570, 600, 150, 44, 18, 1, 10), "#F5D9A8", ' transform="rotate(-35 645 622)"'), p + "sh")
    s += G(star(200, 724, 40, MUSTARD) + heart(350, 728, 1.0, HEART) + C(500, 724, 38, "#FFD152") + C(488, 716, 5, INK) + C(512, 716, 5, INK)
           + stroke("M482,734 Q500,750 518,734", INK, 5), p + "sh")
    return doc(p, 700, 780, s, "rough", seed=611, cut={"rim": 3, "rough": 6, "freq": .12})


ITEMS = {
    "bg-clinic": bg_clinic, "bg-clinic-wait": bg_clinic_wait, "clinic-bed": clinic_bed, "clinic-bench": clinic_bench,
    "clinic-slot": clinic_slot, "clinic-chart": clinic_chart,
    "tool-thermometer": thermometer, "tool-stethoscope": stethoscope, "tool-plaster": plaster, "tool-cream": cream,
    "tool-spray": spray, "tool-tweezers": tweezers, "tool-magnifier": magnifier, "tool-toothbrush": toothbrush,
    "tool-cup": cup, "tool-syrup": syrup, "tool-cloth": cloth, "tool-hotbottle": hotbottle,
    "lens-knee": lens_knee, "lens-paw": lens_paw, "lens-tummy": lens_tummy, "lens-mouth": lens_mouth, "lens-ring": lens_ring,
    "clinic-scrape": scrape, "clinic-dust": dust, "clinic-splinter": splinter, "clinic-cream": cream_smear,
    "clinic-dirt": dirt, "clinic-cheek": cheek, "clinic-sweat": sweat, "clinic-bump": bump,
    "btn-world-kitchen": lambda: world_btn("kitchen"), "btn-world-clinic": lambda: world_btn("clinic"),
    "photo-frame-clinic": photo_frame_clinic,
}
for _k in ("star", "heart", "smile"):
    ITEMS[f"sticker-{_k}"] = (lambda k: (lambda: sticker(k)))(_k)
for _k in ("fever", "cough", "tummy", "tooth", "knee", "paw"):
    ITEMS[f"sick-{_k}"] = (lambda k: (lambda: sick(k)))(_k)


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
    print("anchors: TOOL_TIP", TOOL_TIP)
    print("TEETH", TEETH, "KNEE", KNEE, "PAW", PAW, "CHART_ROWS", CHART_ROWS, "FRAME_WIN", FRAME_WIN)
    print("BED: 900x320, seat line y 112 (the cushion's top), centre x 450; BENCH: 1500x420, seat y 252")
