# images-b-sea (the mermaid world, "Mermaid with Mom": research/mermaid-spec.md 8). Style B paper cut-out on the shared kit
# (images-b/tools/pb.py and images-b-clinic/tools/gen_clinic.py, both read-only); writes into images-b-sea/ only.
# Mermaid PR 1: the lagoon (background, rock, the five shell doors and their pictures, the chest, the
# seaweed, the far dolphin, the photo frame, the done shell). Later PRs add their groups to ITEMS in their own block.
# Run: python tools/gen_sea.py [names...]   then copy the SVGs into public/assets/images and bake the WebPs.
# Palette (the 13 colours + the sea's 5): turquoise #5FC9C3, deep sea #2E7FA6, sand #F6E3B5, coral #F28C7A, pearl #F4F1EA.
import sys, os, math, random
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
OUTDIR = os.path.normpath(os.path.join(HERE, ".."))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "images-b-clinic", "tools")))
from gen_clinic import *  # noqa: F401,F403
OUTDIR = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))  # (after the import: gen_clinic has its own HERE and OUTDIR)

TURQ = "#5FC9C3"; TURQ_D = "#3FA9A6"; TURQ_L = "#A6E6DF"
DEEP = "#2E7FA6"; DEEP_L = "#4E9FBF"
SAND = "#F6E3B5"; SAND_D = "#E6C98E"; SAND_L = "#FBF0D4"
CORALC = "#F28C7A"; CORALC_D = "#D96A58"
PEARL = "#F4F1EA"; PEARL_D = "#D9D2C4"
SHELL = "#F7A7A8"; SHELL_D = "#DB7F84"; SHELL_L = "#FCD3D2"
ROCK = "#8FA3A8"; ROCK_D = "#6D8288"; ROCK_L = "#B3C3C6"
KELP = "#5FA35A"; KELP_D = "#457F43"; KELP_L = "#8CC67E"
LILAC = "#B99BD8"; GOLD = "#F2C14E"; GOLD_D = "#D19A2A"


def sparkle(x, y, r, fill=WHITE, extra=""):
    return P(f"M{n(x)},{n(y - r)} L{n(x + r * .3)},{n(y - r * .3)} L{n(x + r)},{n(y)} L{n(x + r * .3)},{n(y + r * .3)} L{n(x)},{n(y + r)} "
             f"L{n(x - r * .3)},{n(y + r * .3)} L{n(x - r)},{n(y)} L{n(x - r * .3)},{n(y - r * .3)}Z", fill, extra)


def bubble(x, y, r, op=0.7):
    return (C(x, y, r, WHITE, f' opacity="{op * .25}"') + f'<circle cx="{n(x)}" cy="{n(y)}" r="{n(r)}" fill="none" stroke="{WHITE}" stroke-width="{n(max(2, r * .14))}" opacity="{op}"/>'
            + P(f"M{n(x - r * .55)},{n(y - r * .1)} Q{n(x - r * .5)},{n(y - r * .55)} {n(x - r * .1)},{n(y - r * .6)}", "none", f' stroke="{WHITE}" stroke-width="{n(max(2, r * .16))}" stroke-linecap="round" opacity="{op}"'))


def starfish(cx, cy, r, fill, rot=-90, dark=None):
    pts = []
    for i in range(10):
        a = math.radians(rot + i * 36)
        rr = r if i % 2 == 0 else r * .45
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
    s = P(smooth(pts, 1 / 9), dark or mix(fill, "#5A2A10", .25), ' transform="translate(0 4)"') + P(smooth(pts, 1 / 9), fill)
    s += "".join(C(cx + math.cos(math.radians(rot + i * 72)) * r * .5, cy + math.sin(math.radians(rot + i * 72)) * r * .5, r * .1, WHITE, ' opacity="0.6"') for i in range(5))
    return s


def scallop(cx, hy, rx, ry, fill, dark, light, ribs=9, inner=False):
    """A scallop fan from its hinge (cx, hy) up to height ry, half width rx, a bump per rib on its rim."""
    pts = []
    for i in range(ribs * 4 + 1):
        t = i / (ribs * 4)
        a = math.radians(-160 + 140 * t)
        bump = 1 + 0.06 * abs(math.sin(math.pi * t * ribs))
        pts.append((cx + math.cos(a) * rx * bump, hy + math.sin(a) * ry * bump))
    pts += [(cx + rx * .18, hy + 4), (cx - rx * .18, hy + 4)]
    d = smooth(pts, 1 / 10)
    s = P(d, dark, ' transform="translate(0 5)"') + P(d, fill)
    for i in range(ribs):
        t = (i + .5) / ribs
        a = math.radians(-160 + 140 * t)
        s += stroke(f"M{n(cx)},{n(hy - 6)} L{n(cx + math.cos(a) * rx * .96)},{n(hy + math.sin(a) * ry * .96)}", light if inner else dark, 5 if inner else 6, ' opacity="0.55"')
    s += P(f"M{n(cx - rx * .55)},{n(hy - ry * .62)} Q{n(cx)},{n(hy - ry * .86)} {n(cx + rx * .4)},{n(hy - ry * .7)}", "none", f' stroke="{light}" stroke-width="10" stroke-linecap="round" opacity="0.6"')
    return s


# ================================================================ the lagoon
def bg_lagoon():
    """2400x1080, under the water: light turquoise at the top (the surface, a soft sun), deeper towards the sand; a reef
    of coral and rocks far behind, a small friendly wreck in the middle distance, the sand from y ~880 (things stand on
    it). The middle 1440 (what 4:3 shows) holds the main things; nothing busy where the doors and Mom stand."""
    p = "bgl-"
    defs = (f'<linearGradient id="{p}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9BE3DC"/>'
            f'<stop offset="0.55" stop-color="#5FC2C6"/><stop offset="1" stop-color="#3E9DB5"/></linearGradient>'
            f'<radialGradient id="{p}sun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFBE0" stop-opacity="0.9"/>'
            f'<stop offset="1" stop-color="#FFFBE0" stop-opacity="0"/></radialGradient>')
    L = [f'<rect x="0" y="0" width="2400" height="1080" fill="url(#{p}w)"/>']
    L.append(f'<ellipse cx="1150" cy="40" rx="520" ry="200" fill="url(#{p}sun)"/>')
    # the surface: a band of light waves at the top
    wave = "M0,70 " + " ".join(f"Q{x + 60},{52 if (x // 120) % 2 else 88} {x + 120},70" for x in range(0, 2400, 120)) + " L2400,0 L0,0Z"
    L.append(P(wave, "#C9F2EC", ' opacity="0.8"'))
    L.append(P("M0,96 " + " ".join(f"Q{x + 80},{84 if (x // 160) % 2 else 108} {x + 160},96" for x in range(0, 2400, 160)), "none", f' stroke="{WHITE}" stroke-width="6" opacity="0.5"'))
    # the far reef: soft dark blobs, faint coral shapes
    rr = random.Random(7)
    far = "".join(P(wob(x, 840 + rr.uniform(-30, 20), rr.uniform(120, 220), rr.uniform(90, 150), .08, 10 + i, 18), "#3C8FA5", ' opacity="0.45"') for i, x in enumerate(range(-60, 2500, 190)))
    L.append(far)
    for i, x in enumerate((140, 520, 980, 1480, 1880, 2280)):
        y = 820 + rr.uniform(-20, 20)
        col = (CORALC, LILAC, "#F3B562", CORALC, LILAC, "#F3B562")[i]
        br = "".join(stroke(f"M{x},{y} Q{x + dx * .2},{y - h * .6} {x + dx},{y - h}", col, 24) + C(x + dx, y - h, 18, col)
                     for dx, h in ((-70, 110), (-28, 160), (22, 150), (66, 100)))
        br += P(wob(x, y + 6, 46, 22, .1, i + 40, 14), col)
        L.append(G(br, None, ' opacity="0.6"'))
    # the wreck, small in the middle distance: a tilted wooden hull, a round window, a broken mast
    hull = "M1040,560 Q1060,640 1180,650 L1400,640 Q1450,600 1460,540 L1440,532 Q1300,560 1050,548Z"
    w = P(hull, WALNUT_D, ' transform="translate(0 6)"') + P(hull, WALNUT)
    w += "".join(stroke(f"M1056,{y} Q1250,{y + 18} 1450,{y - 8}", WALNUT_D, 5, ' opacity="0.7"') for y in (570, 598, 624))
    w += C(1260, 592, 22, WALNUT_D) + C(1260, 592, 15, "#2F6F86")
    w += P("M1300,548 L1320,380 L1338,384 L1324,548Z", WALNUT_D) + P("M1322,400 L1400,430 L1318,470Z", "#E9DCC0", ' opacity="0.85"')
    L.append(G(f'<g transform="translate(-40 190) rotate(-7 1250 600)">{w}</g>', p + "sh", ' opacity="0.85"'))
    # bubbles rising here and there
    L.append("".join(bubble(x + rr.uniform(-10, 10), y, r, .5) for x, y, r in ((300, 420, 14), (330, 360, 9), (310, 300, 6), (900, 300, 11), (920, 250, 7),
                                                                                (1650, 380, 13), (1670, 320, 8), (2150, 450, 12), (2170, 390, 7), (700, 520, 8))))
    # little fish far off (muted)
    for x, y, s, col in ((620, 300, 1, "#F3B562"), (680, 330, .8, "#F3B562"), (1760, 240, .9, CORALC), (1820, 270, .7, CORALC)):
        L.append(P(wob(x, y, 30 * s, 16 * s, .05, int(x), 14), col, ' opacity="0.7"') + P(f"M{n(x + 26 * s)},{y} L{n(x + 46 * s)},{n(y - 14 * s)} L{n(x + 46 * s)},{n(y + 14 * s)}Z", col, ' opacity="0.7"') + C(x - 14 * s, y - 3 * s, 3 * s, INK, ' opacity="0.7"'))
    # the sand
    sand = "M0,900 " + " ".join(f"Q{x + 150},{880 if (x // 300) % 2 else 914} {x + 300},898" for x in range(0, 2400, 300)) + " L2400,1080 L0,1080Z"
    L.append(G(P(sand, SAND_D, ' transform="translate(0 -8)"') + P(sand, SAND), p + "cut"))
    L.append("".join(P(f"M{x},{y} q30,-10 60,0", "none", f' stroke="{SAND_D}" stroke-width="5" stroke-linecap="round" opacity="0.6"') for x, y in ((180, 960), (420, 1010), (760, 970), (1100, 1020), (1420, 975), (1700, 1015), (2050, 965), (2250, 1010))))
    L.append("".join(C(rr.uniform(0, 2400), rr.uniform(930, 1070), rr.uniform(3, 6), SAND_L, ' opacity="0.9"') for _ in range(60)))
    # a few shells and starfish on the sand at the sides
    L.append(G(starfish(90, 1000, 34, "#F3A65A", -80) + starfish(2330, 990, 30, CORALC, -100)
               + scallop(560, 1040, 30, 34, SHELL, SHELL_D, SHELL_L, 7) + scallop(1860, 1046, 26, 30, LILAC, "#9A7EBA", "#E2D4F2", 7), p + "sh"))
    return doc(p, 2400, 1080, "".join(L), "bg", seed=91, sh=(4, 4, .22), extra_defs=defs)


def lagoon_rock():
    """900x400: a big round rock with moss and a sea anemone, its top around y 110 (Mom's tail lies over it)."""
    p = "lrk-"
    body = "M40,400 Q20,250 120,170 Q240,96 420,104 Q620,90 760,150 Q880,220 870,400Z"
    s = G(P(body, ROCK_D, ' transform="translate(0 8)"') + P(body, ROCK), p + "cut")
    s += P("M120,190 Q260,120 430,128 Q600,118 720,170 Q600,150 430,156 Q270,156 140,210Z", ROCK_L, ' opacity="0.7"')
    s += "".join(P(wob(x, y, rx, ry, .1, int(x), 14), ROCK_D, ' opacity="0.35"') for x, y, rx, ry in ((260, 280, 60, 30), (560, 250, 80, 34), (700, 320, 50, 26), (380, 340, 70, 24)))
    s += G(P(wob(180, 196, 70, 22, .15, 3, 18, -20), KELP) + P(wob(640, 140, 90, 20, .15, 4, 18, 8), KELP_L), p + "sh")
    an = "".join(stroke(f"M760,220 Q{760 + dx * .6},{200 - h * .5} {760 + dx},{220 - h}", CORALC, 12, '') for dx, h in ((-40, 50), (-20, 64), (0, 70), (20, 64), (40, 50)))
    s += G(an + P(wob(760, 226, 40, 16, .08, 9, 14), CORALC_D), p + "sh")
    s += G(scallop(330, 132, 24, 26, SHELL, SHELL_D, SHELL_L, 6), p + "sh")
    return doc(p, 900, 400, s, "rough", seed=131, cut={"rim": 3, "rough": 5, "freq": .12})


def door_shell(open_=False):
    """300x260: a big scallop shell on the sand, its hinge at the bottom (ART_SEA.doorHinge 150, 236). Open: the top half
    lifted back, the pearly inside and a pearl in the lower half."""
    p = "dso-" if open_ else "dsc-"
    if not open_:
        s = G(scallop(150, 236, 140, 214, SHELL, SHELL_D, SHELL_L, 9), p + "cut")
        s += G(P(wr(112, 226, 76, 30, 10, 1, 3), SHELL_D) + P(wr(118, 222, 64, 24, 8, 1, 4), SHELL), p + "sh")
    else:
        s = G(scallop(150, 166, 122, 160, SHELL, SHELL_D, SHELL_L, 9), p + "cut")
        s += P(wob(150, 110, 96, 64, .03, 5, 22), "#FFE9EC", ' opacity="0.9"') + P(wob(150, 104, 70, 40, .04, 6, 20), PEARL, ' opacity="0.8"')
        bowl = "M20,180 Q40,256 150,258 Q260,256 280,180 Q220,206 150,206 Q80,206 20,180Z"
        s += G(P(bowl, SHELL_D, ' transform="translate(0 4)"') + P(bowl, SHELL), p + "cut")
        s += P("M40,186 Q150,226 260,186 Q230,212 150,214 Q70,212 40,186Z", SHELL_L, ' opacity="0.8"')
        s += G(C(150, 194, 30, PEARL_D) + C(148, 190, 28, PEARL) + C(140, 180, 9, WHITE), p + "sh")
        s += sparkle(196, 150, 14) + sparkle(98, 140, 10)
    return doc(p, 300, 260, s, "smooth", seed=141 + open_, cut={"rim": 3, "rough": 4})


def icon_doc(p, inner, seed, bg=PEARL):
    s = G(P(wob(80, 84, 74, 72, .02, 1, 26), mix(bg, "#7A5A40", .22)) + P(wob(80, 80, 74, 72, .02, 2, 26), bg), p + "cut")
    return doc(p, 160, 160, s + G(inner, p + "sh"), "smooth", seed=seed, cut={"rim": 2.4, "rough": 3})


def icon_tail():
    """The sparkly tail: a mermaid's fin up out of a wave, turquoise with pink."""
    t = "M70,150 Q58,110 78,82 Q92,62 86,50"
    s = stroke(t, TURQ, 34, '') + stroke(t, TURQ_L, 8, ' opacity="0.6"')
    s += P("M86,54 C70,40 44,34 30,16 Q50,20 60,12 Q72,30 88,40Z", "#F59AB5") + P("M86,54 C96,36 118,26 136,14 Q132,32 140,42 Q114,46 90,60Z", "#F59AB5")
    s += sparkle(40, 70, 12, GOLD) + sparkle(124, 76, 9, GOLD) + sparkle(112, 112, 7, WHITE)
    s += P("M14,138 Q40,120 66,138 Q92,156 118,138 Q134,128 148,134 L148,160 L14,160Z", DEEP_L, ' opacity="0.8"')
    return icon_doc("dit-", s, 151)


def icon_ride():
    """The bubble ride: a big bubble passing through a golden ring."""
    s = f'<ellipse cx="80" cy="80" rx="30" ry="62" fill="none" stroke="{GOLD_D}" stroke-width="16"/>'
    s += f'<path d="M80,18 A30,62 0 0 0 80,142" fill="none" stroke="{GOLD}" stroke-width="12"/>'
    s += C(100, 80, 40, "#BFEFF4", ' opacity="0.85"') + f'<circle cx="100" cy="80" r="40" fill="none" stroke="{WHITE}" stroke-width="5"/>'
    s += P("M74,66 Q80,46 98,42", "none", f' stroke="{WHITE}" stroke-width="7"')
    s += f'<path d="M80,18 A30,62 0 0 1 80,142" fill="none" stroke="{GOLD}" stroke-width="12"/>'
    s += C(30, 120, 8, WHITE, ' opacity="0.8"') + C(24, 96, 5, WHITE, ' opacity="0.8"') + C(140, 40, 6, PEARL)
    return icon_doc("dir-", s, 152)


def icon_clean():
    """Cleaning the lagoon: a smiling dolphin jumping over a net bag with a bottle in it."""
    body = "M28,96 Q40,52 92,44 Q126,40 142,58 Q124,56 116,62 Q130,74 132,92 Q110,78 84,80 Q56,84 40,104Z"
    s = P(body, "#7FB6D6") + P("M44,96 Q70,78 108,78 Q90,90 60,100Z", "#D7EEF8")
    s += P("M86,46 L96,24 L108,46Z", "#6AA2C4") + C(118, 56, 4, INK) + P("M128,66 Q134,70 140,66", "none", f' stroke="{INK}" stroke-width="3"')
    s += P("M30,96 L12,86 L18,108Z", "#6AA2C4")
    net = "M48,110 L112,110 L104,150 L56,150Z"
    s += P(net, "#E9DCC0", ' opacity="0.6"') + "".join(stroke(f"M{x},110 L{x + 6},150", WALNUT, 3) for x in (56, 72, 88, 104)) + "".join(stroke(f"M{50 + i},{y} L{110 - i},{y}", WALNUT, 3) for i, y in ((2, 122), (4, 136)))
    s += P(wr(70, 118, 18, 26, 5, 1, 9), "#8FD3A8", ' opacity="0.9"')
    return icon_doc("dic-", s, 153)


def icon_shells():
    """The shell treasure: a little basket with shells and a starfish, a necklace of shells over it."""
    s = P("M30,92 L130,92 L118,146 Q80,154 42,146Z", WOOD) + "".join(stroke(f"M{x},94 L{x + 4},146", WOOD_D, 4, ' opacity="0.6"') for x in (46, 66, 86, 106))
    s += stroke("M34,108 L126,108", WOOD_D, 4, ' opacity="0.6"')
    s += scallop(60, 96, 22, 28, SHELL, SHELL_D, SHELL_L, 6) + starfish(98, 78, 22, "#F3A65A") + scallop(80, 92, 16, 20, LILAC, "#9A7EBA", "#E2D4F2", 5)
    s += "".join(C(30 + i * 14, 40 + 18 * math.sin(i / 7 * math.pi), 6, PEARL) for i in range(8))
    return icon_doc("dis-", s, 154)


def icon_song():
    """The shell song: a spiral shell with music notes rising out of it."""
    sh = "M28,132 Q20,96 52,80 Q88,64 112,90 Q128,110 116,132Z"
    s = P(sh, "#F3C27A") + "".join(stroke(f"M{x},{y0} Q{x + 6},{(y0 + 132) / 2} {x},132", "#D19A50", 4, ' opacity="0.7"') for x, y0 in ((46, 86), (66, 76), (86, 78), (104, 90)))
    s += P("M112,92 Q140,80 146,104 Q136,96 120,104Z", "#F3C27A")
    note = lambda x, y, c: C(x, y, 9, c) + stroke(f"M{x + 8},{y} L{x + 8},{y - 34} Q{x + 18},{y - 30} {x + 24},{y - 20}", c, 5, '')
    s += note(62, 52, DEEP) + note(98, 40, CORALC) + note(128, 66, "#8E6BBF")
    return icon_doc("dis2-", s, 155)


def chest(open_=False):
    """300x240: a little wooden treasure chest by the wreck; open: pearls and a soft shine inside (ART_SEA.chestIn)."""
    p = "cho-" if open_ else "chc-"
    box = P(wr(40, 110, 220, 110, 14, 1.2, 1), WOOD_D) + P(wr(40, 104, 220, 108, 14, 1.2, 2), WOOD)
    box += rect(40, 140, 220, 12, GOLD_D) + rect(140, 104, 20, 116, GOLD_D) + P(wr(134, 126, 32, 34, 6, 1, 3), GOLD)
    if not open_:
        lid = "M40,112 Q40,46 150,40 Q260,46 260,112Z"
        s = G(box, p + "cut") + G(P(lid, WOOD_D, ' transform="translate(0 4)"') + P(lid, WOOD) + stroke("M40,100 Q150,96 260,100", GOLD_D, 10) + rect(140, 40, 20, 70, GOLD_D), p + "cut")
    else:
        lid = "M46,104 Q40,30 70,6 L232,6 Q262,30 254,104 Q150,84 46,104Z"
        s = G(P(lid, WOOD_D) + P("M60,96 Q56,40 80,18 L220,18 Q246,40 240,96 Q150,80 60,96Z", WALNUT_D), p + "cut")
        s += "".join(C(70 + i * 22 + (j % 2) * 10, 104 - j * 14, 13, PEARL if (i + j) % 3 else "#FFE7EC") for j in range(2) for i in range(8))
        s += G(box, p + "cut") + sparkle(110, 70, 14, "#FFF4B8") + sparkle(196, 76, 11, "#FFF4B8")
    return doc(p, 300, 240, s, "rough", seed=161 + open_, cut={"rim": 3, "rough": 4})


def seaweed():
    """200x400: one tall seaweed, its foot at the bottom centre (the game rocks it gently)."""
    p = "swd-"
    s = ""
    for dx, h, col, w in ((-36, 300, KELP_D, 28), (30, 340, KELP, 30), (0, 390, KELP_L, 32)):
        pts = [(100 + dx * t + 18 * math.sin(t * 7 + dx), 400 - h * t) for t in [i / 10 for i in range(11)]]
        s += stroke(smooth_open(pts), col, w, '')
        s += "".join(P(wob(x + 14, y, 16, 8, .1, int(y), 12, -30), col) for x, y in pts[2:-1:2])
    return doc(p, 200, 400, G(s, p + "sh"), "smooth", seed=171)


def dolphin_far():
    """240x120: a small dolphin jumping far off (muted, it plays in the back of the clean lagoon)."""
    p = "dlf-"
    body = "M20,96 Q60,24 150,24 Q200,26 222,50 Q196,46 186,52 Q204,70 204,92 Q170,66 130,64 Q70,64 36,108Z"
    s = P(body, "#6E9FBF") + P("M40,98 Q86,72 150,70 Q120,84 70,100Z", "#BFDCEB") + P("M140,26 L156,4 L172,30Z", "#5F8FAF") + C(196, 44, 4, INK)
    return doc(p, 240, 120, s, "smooth", seed=181)


def photo_frame_sea():
    """700x780: a turquoise frame with shells, starfish and pearls round it, its window (FRAME_WIN) open."""
    p = "pfs-"
    x, y, w, h = FRAME_WIN
    outer = wr(30, 30, 640, 640, 26, 2, 1, step=24)
    s = G(f'<path d="{outer} M{x},{y} h{w} v{h} h-{w}Z" fill="{TURQ}" fill-rule="evenodd"/>', p + "cut")
    s += G(f'<path d="{wr(46, 46, 608, 608, 20, 1.4, 2, step=24)} M{x - 8},{y - 8} h{w + 16} v{h + 16} h-{w + 16}Z" fill="{TURQ_L}" fill-rule="evenodd" opacity="0.7"/>', p + "sh")
    deco = "".join(C(60 + i * 36, 54, 9, PEARL) for i in range(17)) + "".join(C(60 + i * 36, 646, 9, PEARL) for i in range(17))
    deco += scallop(90, 90, 36, 40, SHELL, SHELL_D, SHELL_L, 7) + starfish(616, 70, 38, "#F3A65A") + scallop(610, 650, 34, 38, LILAC, "#9A7EBA", "#E2D4F2", 7) + starfish(80, 630, 34, CORALC)
    s += G(deco, p + "sh")
    s += G(scallop(220, 760, 40, 46, SHELL, SHELL_D, SHELL_L, 7) + starfish(350, 726, 38, "#F3A65A") + bubble(480, 724, 30, .95), p + "sh")
    return doc(p, 700, 780, s, "rough", seed=191, cut={"rim": 3, "rough": 6, "freq": .12})


def sea_done():
    """120x120: a little pink shell with a white tick (the activities' done mark)."""
    p = "sdn-"
    s = G(scallop(60, 108, 54, 92, SHELL, SHELL_D, SHELL_L, 7), p + "cut")
    s += stroke("M34,62 L54,82 L90,40", WHITE, 14)
    return doc(p, 120, 120, s, "smooth", seed=201, cut={"rim": 2.4, "rough": 3})


# ================================================================ mermaid PR 4: the shell song
# Five bell shells, biggest (lowest note) to smallest (highest), each its own colour so a note has a colour too.
BELLS = (  # (frame size, fill, dark, light)
    (260, "#F28C7A", "#D96A58", "#FBC4B8"),   # 1 coral: C
    (245, "#F2C14E", "#D19A2A", "#FBE3A6"),   # 2 gold: D
    (230, "#7CCB8A", "#549F63", "#C2EBC8"),   # 3 sea green: E
    (215, "#4E9FD8", "#2E7FA6", "#B4DAF2"),   # 4 sea blue: G
    (200, "#B99BD8", "#9A7EBA", "#E2D4F2"),   # 5 lilac: A
)


def bell_shell(i):
    """bell-shell-<i+1> (260 -> 200 square): a round scallop standing on its hinge with two little ears, a pearl at its foot
    and a shine; drawn in a 260 frame and scaled, so the five are one family that steps down in size."""
    size, fill, dark, light = BELLS[i]
    p = f"bs{i + 1}-"
    f = size / 260
    s = G(scallop(130, 226, 112, 190, fill, dark, light, 9), p + "cut")
    ears = f"M78,224 L50,206 Q44,232 70,246 Z M182,224 L210,206 Q216,232 190,246 Z"
    s += G(P(ears, dark) + P(wr(96, 214, 68, 34, 12, 1, 5 + i), dark) + P(wr(100, 210, 60, 28, 10, 1, 7 + i), fill), p + "sh")
    s += G(C(130, 238, 17, PEARL_D) + C(129, 235, 15, PEARL) + C(124, 230, 5, WHITE), p + "sh")
    s += sparkle(176, 86, 13) + sparkle(84, 120, 8)
    return doc(p, size, size, f'<g transform="scale({n(f)})">{s}</g>', "smooth", seed=211 + i, cut={"rim": 3, "rough": 4})


def note_bubble():
    """120: a round bubble with a music note in it, white and pale (the game tints it the shell's colour)."""
    p = "nbb-"
    s = C(60, 60, 52, WHITE, ' opacity="0.35"') + f'<circle cx="60" cy="60" r="52" fill="none" stroke="{WHITE}" stroke-width="7"/>'
    s += P("M30,48 Q32,26 54,20", "none", f' stroke="{WHITE}" stroke-width="7" stroke-linecap="round"')
    s += G(P(wob(52, 80, 14, 11, .03, 3, 14, -20), WHITE) + stroke("M64,78 L64,34 Q78,38 84,52", WHITE, 7, ''), p + "sh")
    return doc(p, 120, 120, s, "smooth", seed=221)


def shell_glow():
    """320: a soft ring of light with little sparkles (behind a shell that sings; the game tints and fades it)."""
    p = "sgl-"
    defs = (f'<radialGradient id="{p}g" cx="0.5" cy="0.5" r="0.5"><stop offset="0.45" stop-color="#FFFFFF" stop-opacity="0.0"/>'
            f'<stop offset="0.7" stop-color="#FFFFFF" stop-opacity="0.75"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>')
    s = f'<circle cx="160" cy="160" r="158" fill="url(#{p}g)"/>'
    s += "".join(sparkle(160 + math.cos(math.radians(a)) * 128, 160 + math.sin(math.radians(a)) * 128, 12 if j % 2 else 8)
                 for j, a in enumerate(range(0, 360, 45)))
    return svg(320, 320, defs, s)


ITEMS = {
    # mermaid PR 4: the shell song
    **{f"bell-shell-{i + 1}": (lambda i=i: bell_shell(i)) for i in range(5)},
    "note-bubble": note_bubble, "shell-glow": shell_glow,
    # mermaid PR 1: the lagoon
    "bg-lagoon": bg_lagoon, "lagoon-rock": lagoon_rock,
    "door-shell": lambda: door_shell(False), "door-shell-open": lambda: door_shell(True),
    "door-icon-tail": icon_tail, "door-icon-ride": icon_ride, "door-icon-clean": icon_clean, "door-icon-shells": icon_shells,
    "door-icon-song": icon_song, "chest-closed": lambda: chest(False), "chest-open": lambda: chest(True), "seaweed": seaweed,
    "lagoon-dolphin-far": dolphin_far, "photo-frame-sea": photo_frame_sea, "sea-done": sea_done,
}


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
    print("ART_SEA: doorHinge (150, 236), chestIn (150, 96), bg surface y 120, sand y 900, FRAME_WIN", FRAME_WIN)
