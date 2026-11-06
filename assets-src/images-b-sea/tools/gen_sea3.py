# images-b-sea, mermaid PR 3 (research/mermaid-spec.md 3.3 and 3.4): cleaning the lagoon and the shell treasure.
# Its own file on gen_sea.py's kit (read-only), so the parallel mermaid PRs never edit the same generator.
# Run: python tools/gen_sea3.py [names...]   then copy the SVGs into public/assets/images and bake the WebPs.
# Cleaning: the murky water (murk), six bits of rubbish (trash-*: green or blue, the hard level sorts them by colour),
# the two net bags (net-basket-blue / -green), the dolphin and the turtle (dolphin-free, turtle-free: the net and the bag
# are the real trash-net / trash-bag laid over them in the game), the bushy seaweed things hide behind (seaweed-hide), a
# seahorse. Shells: the three kinds (shell-fan, shell-spiral, starfish), the basket, the sand mound a shell hides
# under, the necklace's string and the necklace on Marina.
import sys, os, math, random
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from gen_sea import *  # noqa: F401,F403  (gen_clinic's kit + the sea's palette, scallop, starfish, sparkle, bubble)
OUTDIR = os.path.normpath(os.path.join(HERE, ".."))

# the two sorting colours (strong and different also for a colour-blind eye: a clear blue and a yellowish green)
BLUE = "#4F8FE0"; BLUE_D = "#2F6CC0"; BLUE_L = "#A9CBF5"
LEAF = "#67B845"; LEAF_D = "#478E2C"; LEAF_L = "#A8DE86"


def item_doc(p, w, h, s, seed):
    return doc(p, w, h, s, "smooth", seed=seed, cut={"rim": 2.6, "rough": 3.5})


# ================================================================ cleaning the lagoon
def murk():
    """1200x700: the murky water, a soft grey-green haze of blurred blobs (the game fades it as the rubbish goes)."""
    p = "mrk-"
    rr = random.Random(5)
    blobs = "".join(P(wob(rr.uniform(80, 1120), rr.uniform(80, 620), rr.uniform(140, 260), rr.uniform(90, 170), .12, i + 3, 16),
                      rr.choice(("#7E9468", "#8C9A6E", "#6F8A6A", "#94A07A")), f' opacity="{rr.uniform(.35, .6):.2f}"') for i in range(26))
    specks = "".join(C(rr.uniform(40, 1160), rr.uniform(40, 660), rr.uniform(3, 7), "#5E6E48", ' opacity="0.45"') for _ in range(60))
    defs = (f'<filter id="{p}fog" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="38"/></filter>'
            f'<radialGradient id="{p}fade" cx="0.5" cy="0.5" r="0.5"><stop offset="0.55" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>'
            f'<mask id="{p}m" maskUnits="userSpaceOnUse" x="0" y="0" width="1200" height="700"><rect width="1200" height="700" fill="url(#{p}fade)"/></mask>')
    body = f'<g mask="url(#{p}m)"><g filter="url(#{p}fog)">{blobs}</g>{specks}</g>'
    return svg(1200, 700, defs, body)


def trash_bottle():
    """200x200: a green plastic bottle lying tilted, its cap off to the side."""
    s = f'<g transform="rotate(-28 100 100)">'
    body = "M40,82 Q40,66 58,66 L126,66 Q136,66 144,76 L156,88 L176,88 L176,112 L156,112 L144,124 Q136,134 126,134 L58,134 Q40,134 40,118Z"
    s += P(body, LEAF_D, ' transform="translate(0 5)"') + P(body, LEAF, ' opacity="0.95"')
    s += P("M54,76 L124,76 Q130,76 134,80 L54,84Z", LEAF_L, ' opacity="0.8"')
    s += rect(72, 88, 50, 24, WHITE, ' opacity="0.9"') + stroke("M80,100 L114,100", LEAF_D, 5, ' opacity="0.6"')
    s += P(wr(174, 86, 14, 28, 4, .8, 2), LEAF_D) + "</g>"
    return item_doc("tbo-", 200, 200, G(s, "tbo-cut"), 401)


def trash_can():
    """200x200: a blue drink can, a little dented, lying on its side."""
    s = '<g transform="rotate(14 100 100)">'
    s += P(wr(36, 58, 128, 84, 14, 1.4, 1), BLUE_D, ' transform="translate(0 5)"') + P(wr(36, 58, 128, 84, 14, 1.4, 2), BLUE)
    s += E(40, 100, 12, 40, METAL_D) + E(40, 100, 8, 34, METAL_L) + E(160, 100, 10, 40, METAL)
    s += P("M70,66 L150,66 L150,78 L70,80Z", BLUE_L, ' opacity="0.7"') + P("M96,94 Q110,84 126,96 Q110,110 96,94Z", WHITE, ' opacity="0.85"')
    s += P("M118,128 L128,118 L136,132Z", BLUE_D, ' opacity="0.7"') + "</g>"
    return item_doc("tca-", 200, 200, G(s, "tca-cut"), 402)


def trash_bag():
    """200x200: a blue plastic bag, crumpled, its two handles up (see-through at the edges)."""
    bag = "M46,74 Q40,150 64,172 Q100,186 136,172 Q160,150 154,74 Q128,86 100,80 Q72,86 46,74Z"
    s = P(bag, BLUE_D, ' transform="translate(0 5)" opacity="0.9"') + P(bag, BLUE, ' opacity="0.85"')
    s += stroke("M60,80 Q50,34 82,40 Q92,50 86,82", BLUE, 14) + stroke("M140,80 Q150,34 118,40 Q108,50 114,82", BLUE, 14)
    s += "".join(stroke(f"M{x},{y0} Q{x + 8},{(y0 + y1) / 2} {x - 4},{y1}", BLUE_L, 5, ' opacity="0.7"') for x, y0, y1 in ((76, 96, 160), (104, 92, 170), (128, 98, 156)))
    s += P("M58,92 Q62,130 74,160 Q60,140 54,104Z", WHITE, ' opacity="0.45"')
    return item_doc("tbg-", 200, 200, G(s, "tbg-cut"), 403)


def trash_straw():
    """200x200: a green bendy straw with white stripes."""
    pts = [(40, 160), (80, 120), (120, 80), (136, 60), (150, 52), (172, 40)]
    s = stroke(smooth_open(pts), LEAF_D, 26, ' transform="translate(0 4)"') + stroke(smooth_open(pts), LEAF, 22)
    s += "".join(stroke(f"M{x - 8},{y - 10} L{x + 8},{y + 10}", WHITE, 6, ' opacity="0.9"') for x, y in ((56, 144), (78, 122), (100, 100), (122, 78)))
    s += "".join(stroke(f"M{x},{y - 11} L{x + 4},{y + 11}", LEAF_D, 4, ' opacity="0.6"') for x, y in ((140, 58), (148, 54), (156, 50)))
    return item_doc("tst-", 200, 200, G(s, "tst-cut"), 404)


def trash_tyre():
    """200x200: a small blue rubber ring (a toy tyre), a little sand on it."""
    s = C(100, 106, 76, BLUE_D) + C(100, 100, 76, BLUE)
    s += C(100, 100, 34, "#2E6FA6") + C(100, 100, 30, "#2E7FA6")
    s += "".join(stroke(f"M{100 + math.cos(math.radians(a)) * 40},{100 + math.sin(math.radians(a)) * 40} L{100 + math.cos(math.radians(a)) * 72},{100 + math.sin(math.radians(a)) * 72}", BLUE_D, 7, ' opacity="0.5"') for a in range(0, 360, 30))
    s += P("M44,70 Q70,34 116,30", "none", f' stroke="{BLUE_L}" stroke-width="10" stroke-linecap="round" opacity="0.8"')
    s += "".join(C(x, y, 4, SAND, ' opacity="0.9"') for x, y in ((140, 150), (150, 140), (60, 150)))
    out = f'<path d="M24,100 a76,76 0 1,0 152,0 a76,76 0 1,0 -152,0 M70,100 a30,30 0 1,1 60,0 a30,30 0 1,1 -60,0Z" fill="none"/>'
    return item_doc("tty-", 200, 200, G(s + out, "tty-cut"), 405)


def trash_net():
    """200x200: a green fishing net in a loose tangle (it comes off the dolphin's fin; the hard level sorts it green)."""
    p = "tnt-"
    blob = wob(100, 104, 82, 66, .1, 7, 18)
    s = f'<clipPath id="{p}c"><path d="{blob}"/></clipPath>'
    s += P(blob, LEAF, ' opacity="0.28"')
    mesh = "".join(stroke(f"M{x},0 Q{x + 30},100 {x - 10},200", LEAF_D, 6) for x in range(0, 230, 26))
    mesh += "".join(stroke(f"M0,{y} Q100,{y + 24} 200,{y - 6}", LEAF_D, 6) for y in range(20, 200, 26))
    s += f'<g clip-path="url(#{p}c)">{mesh}</g>'
    s += f'<path d="{blob}" fill="none" stroke="{LEAF_D}" stroke-width="9"/>'
    s += "".join(C(x, y, 9, "#F2C14E") + C(x - 2, y - 3, 3, WHITE) for x, y in ((40, 70), (164, 92), (120, 164)))
    return item_doc(p, 200, 200, G(s, p + "sh"), 406)


def net_basket(col, dark, light, seed):
    """420x360: a big round net bag on a wooden hoop, its mouth open at the top (the rubbish goes in), in its colour."""
    p = f"nb{seed}-"
    bag = "M54,120 Q40,270 120,330 Q210,372 300,330 Q380,270 366,120Z"
    s = G(P(bag, mix(col, "#FFFFFF", .55), ' opacity="0.55"'), p + "sh")
    s += f'<clipPath id="{p}c"><path d="{bag}"/></clipPath>'
    mesh = "".join(stroke(f"M{x},100 Q{x + (210 - x) * .35},260 {210 + (x - 210) * .3},370", dark, 7) for x in range(20, 420, 40))
    mesh += "".join(stroke(f"M30,{y} Q210,{y + 40} 390,{y}", dark, 7) for y in (170, 220, 270, 320))
    s += f'<g clip-path="url(#{p}c)">{mesh}</g>' + f'<path d="{bag}" fill="none" stroke="{dark}" stroke-width="10"/>'
    # the hoop: an open ellipse (the mouth), wood with a coloured band
    s += G(f'<ellipse cx="210" cy="118" rx="168" ry="44" fill="none" stroke="{WOOD_D}" stroke-width="30"/>'
           f'<ellipse cx="210" cy="112" rx="168" ry="44" fill="none" stroke="{col}" stroke-width="24"/>'
           f'<path d="M60,104 Q210,60 360,104" fill="none" stroke="{light}" stroke-width="8" opacity="0.8"/>', p + "cut")
    s += E(210, 122, 140, 26, mix(dark, "#000000", .3), ' opacity="0.35"')
    # a float on each side (it bobs in the water) and a shell charm in the middle
    s += G(C(46, 130, 26, CORALC) + C(40, 122, 9, WHITE, ' opacity="0.8"') + C(374, 130, 26, CORALC) + C(368, 122, 9, WHITE, ' opacity="0.8"'), p + "sh")
    s += G(scallop(210, 236, 38, 46, col, dark, light, 7), p + "sh")
    return doc(p, 420, 360, s, "smooth", seed=410 + seed, cut={"rim": 3, "rough": 4})


def dolphin_free():
    """520x300: a friendly dolphin, side view facing left, smiling, its dorsal fin up (the net lies over its back fin in
    the game: ART_SEA3.dolphinNet)."""
    p = "dlp-"
    body = ("M30,170 Q40,108 120,86 Q220,60 320,82 Q400,98 450,140 L500,116 Q506,150 486,168 Q506,190 500,222 L452,196"
            " Q400,224 310,230 Q200,236 120,214 Q70,204 52,196 Q30,190 30,170Z")
    s = G(P(body, "#5F93B8", ' transform="translate(0 6)"') + P(body, "#7FB6D6"), p + "cut")
    s += P("M54,186 Q140,206 240,206 Q340,204 430,176 Q340,224 230,226 Q130,226 60,198Z", "#D7EEF8")
    s += G(P("M220,74 Q250,20 300,10 Q290,46 296,84Z", "#6AA2C4"), p + "sh")
    s += G(P("M200,196 Q230,250 280,262 Q262,226 262,202Z", "#6AA2C4"), p + "sh")
    # the beak, the smile, the eye
    s += P("M30,170 Q10,172 6,180 Q18,190 52,192Z", "#7FB6D6") + stroke("M14,182 Q40,196 80,186", INK, 4, ' opacity="0.8"')
    s += C(98, 146, 13, INK) + C(94, 141, 5, WHITE) + P("M84,128 Q98,120 112,128", "none", f' stroke="{INK}" stroke-width="4" stroke-linecap="round"')
    s += E(110, 176, 16, 9, CHEEK, ' opacity="0.45"')
    s += P("M120,104 Q220,74 330,96", "none", f' stroke="#B9DCEF" stroke-width="10" stroke-linecap="round" opacity="0.7"')
    return doc(p, 520, 300, s, "smooth", seed=421, cut={"rim": 3, "rough": 4})


def turtle_free():
    """360x260: a little sea turtle, side view facing left, a green patterned shell, a smile (the bag goes over her head
    in the game: ART_SEA3.turtleHead)."""
    p = "ttl-"
    s = G(P("M232,170 Q300,190 330,232 Q290,230 240,196Z", "#9CC97A") + P("M120,176 Q90,226 50,236 Q80,196 118,166Z", "#9CC97A"), p + "sh")
    s += G(P("M240,120 Q300,96 334,120 Q300,128 252,142Z", "#9CC97A") + P("M120,124 Q70,80 40,90 Q70,112 116,138Z", "#9CC97A"), p + "sh")
    shell = "M110,150 Q110,60 200,52 Q290,60 292,150 Q200,176 110,150Z"
    s += G(P(shell, "#4E8F45", ' transform="translate(0 5)"') + P(shell, "#6FAE55"), p + "cut")
    s += "".join(P(wob(x, y, rx, ry, .06, int(x), 12), "#8CC870", ' opacity="0.9"') for x, y, rx, ry in ((200, 92, 30, 22), (152, 118, 24, 20), (248, 118, 24, 20), (200, 134, 28, 14)))
    s += P("M110,150 Q200,176 292,150 Q290,164 200,180 Q112,166 110,150Z", "#E8D79A")
    head = "M114,128 Q70,108 40,124 Q22,140 40,160 Q72,176 116,158Z"
    s += G(P(head, "#9CC97A"), p + "cut")
    s += C(52, 134, 9, INK) + C(49, 130, 3.5, WHITE) + stroke("M30,150 Q44,160 62,154", INK, 3.5) + E(66, 150, 10, 6, CHEEK, ' opacity="0.45"')
    return doc(p, 360, 260, s, "smooth", seed=431, cut={"rim": 3, "rough": 4})


def seaweed_hide():
    """240x420: a bushy clump of seaweed on the sand (something can hide behind it), its foot at the bottom centre."""
    p = "swh-"
    s = ""
    for dx, h, col, w in ((-70, 300, KELP_D, 30), (60, 320, KELP_D, 30), (-36, 380, KELP, 34), (30, 400, KELP, 34), (0, 360, KELP_L, 30)):
        pts = [(120 + dx * t + 16 * math.sin(t * 6 + dx), 410 - h * t) for t in [i / 10 for i in range(11)]]
        s += stroke(smooth_open(pts), col, w, '')
        s += "".join(P(wob(x + (18 if i % 2 else -18), y, 22, 11, .1, int(y) + i, 12, -30 if i % 2 else 30), col) for i, (x, y) in enumerate(pts[1:-1]))
    s += P(wob(120, 412, 90, 16, .08, 3, 14), SAND_D)
    return doc(p, 240, 420, G(s, p + "sh"), "smooth", seed=441)


def seahorse():
    """160x220: a little yellow-orange seahorse, facing left, curly tail, a smile."""
    p = "shs-"
    body = "M86,30 Q120,26 124,58 Q126,84 108,98 Q132,120 128,152 Q124,186 96,196 Q70,204 66,184 Q64,168 82,168 Q96,170 94,182 Q108,170 104,150 Q100,126 84,116 Q66,104 70,80 L44,84 Q36,72 50,64 L74,58 Q70,36 86,30Z"
    s = G(P(body, "#E39A3A", ' transform="translate(0 4)"') + P(body, "#F7B955"), p + "cut")
    s += "".join(stroke(f"M{x - 12},{y} Q{x},{y + 6} {x + 12},{y}", "#E39A3A", 4, ' opacity="0.8"') for x, y in ((104, 110), (110, 128), (110, 146), (104, 164)))
    s += P("M118,66 Q140,74 138,96 Q126,90 116,84Z", "#F59AB5")
    s += C(92, 52, 7, INK) + C(90, 50, 2.5, WHITE) + stroke("M56,76 Q62,80 70,76", INK, 3) + C(100, 66, 6, CHEEK, ' opacity="0.5"')
    s += "".join(C(x, y, 5, "#FFE08A") for x, y in ((96, 24), (108, 22), (118, 30)))
    return doc(p, 160, 220, s, "smooth", seed=451, cut={"rim": 2.6, "rough": 3.5})


# ================================================================ the shell treasure
def shell_fan():
    """200x200: a pink scallop (fan) shell, its hinge at the bottom."""
    s = G(scallop(100, 168, 82, 132, SHELL, SHELL_D, SHELL_L, 9), "sfn-cut")
    s += G(P(wr(74, 160, 52, 22, 8, 1, 3), SHELL_D) + P(wr(78, 158, 44, 16, 6, 1, 4), SHELL), "sfn-sh")
    return item_doc("sfn-", 200, 200, s, 461)


def shell_spiral():
    """200x200: a swirly shell (a cream-and-gold snail-like spiral seen from the side), its opening at the bottom left."""
    p = "ssp-"
    out = wob(104, 98, 80, 74, .03, 4, 26)
    s = G(P(out, "#D8BE8A", ' transform="translate(0 5)"') + P(out, PEARL), p + "cut")
    # the spiral, from the outside in
    pts = []
    for i in range(60):
        t = i / 59
        a = math.radians(200 + t * 900)
        r = 70 * (1 - t) + 6
        pts.append((108 + math.cos(a) * r, 94 + math.sin(a) * r * .95))
    s += stroke(smooth_open(pts, .2), "#D9A441", 9, ' opacity="0.9"')
    s += stroke(smooth_open(pts, .2), "#F2C978", 3, ' opacity="0.9"')
    s += P("M30,128 Q26,170 66,176 Q96,178 104,156 Q80,160 62,146 Q44,134 30,128Z", "#F7C9C9")
    s += P("M40,70 Q70,30 120,26", "none", f' stroke="{WHITE}" stroke-width="8" stroke-linecap="round" opacity="0.9"')
    return item_doc(p, 200, 200, s, 462)


def starfish_item():
    """200x200: an orange starfish."""
    return item_doc("sfi-", 200, 200, G(starfish(100, 104, 86, "#F3A65A", -90, "#C8792F"), "sfi-cut") + sparkle(150, 46, 10), 463)


def shell_basket():
    """380x300: a round woven basket, open at the top; the game puts a sample of what goes in it on its front."""
    p = "sbk-"
    body = "M30,96 L350,96 L322,268 Q190,296 58,268Z"
    s = G(P(body, WOOD_D, ' transform="translate(0 6)"') + P(body, WOOD), p + "cut")
    s += "".join(stroke(f"M{x},98 L{x + (190 - x) * .12},{276 - abs(x - 190) * .08}", WOOD_D, 6, ' opacity="0.55"') for x in range(54, 340, 30))
    s += "".join(stroke(f"M{36 + i * 4},{y} Q190,{y + 18} {344 - i * 4},{y}", WOOD_L, 8, ' opacity="0.6"') for i, y in enumerate((140, 186, 232)))
    s += G(f'<ellipse cx="190" cy="96" rx="170" ry="32" fill="{WOOD_L}"/>' f'<ellipse cx="190" cy="100" rx="146" ry="20" fill="{WALNUT_D}" opacity="0.75"/>', p + "cut")
    s += P(wr(120, 150, 140, 100, 40, 1.4, 6), SAND_L, ' opacity="0.95"')   # the label patch where the sample goes
    return doc(p, 380, 300, s, "rough", seed=471, cut={"rim": 3, "rough": 4})


def sand_mound():
    """260x120: a little heap of sand (a shell is half under it)."""
    p = "snd-"
    d = "M10,116 Q30,40 130,30 Q230,40 250,116Z"
    s = G(P(d, SAND_D, ' transform="translate(0 4)"') + P(d, SAND), p + "cut")
    s += "".join(C(x, y, 4, SAND_L) for x, y in ((80, 70), (150, 56), (190, 90), (110, 96), (60, 100)))
    s += P("M70,60 Q130,38 190,58", "none", f' stroke="{SAND_L}" stroke-width="8" stroke-linecap="round" opacity="0.8"')
    return doc(p, 260, 120, s, "rough", seed=481, cut={"rim": 2.6, "rough": 4})


def necklace_string():
    """1400x60: the necklace's cord, a gentle sag, a golden clasp at each end."""
    p = "nks-"
    s = stroke("M40,24 Q700,44 1360,24", "#C98A5A", 10) + stroke("M40,22 Q700,42 1360,22", "#E8B98A", 4, ' opacity="0.8"')
    s += G(C(30, 24, 18, GOLD_D) + C(30, 24, 11, GOLD) + C(1370, 24, 18, GOLD_D) + C(1370, 24, 11, GOLD), p + "sh")
    return doc(p, 1400, 60, s, "smooth", seed=491)


def necklace_marina():
    """240x130: the shell necklace as Marina wears it (over her shell top): pink fans, starfish and swirls on a cord."""
    p = "nkm-"
    cord = [(20, 14), (60, 62), (120, 86), (180, 62), (220, 14)]
    s = stroke(smooth_open(cord), "#C98A5A", 6)
    pos = [(44, 44), (78, 72), (120, 86), (162, 72), (196, 44)]
    for i, (x, y) in enumerate(pos):
        if i % 3 == 0:
            s += scallop(x, y + 16, 18, 26, SHELL, SHELL_D, SHELL_L, 6)
        elif i % 3 == 1:
            s += starfish(x, y + 4, 18, "#F3A65A", -90, "#C8792F")
        else:
            s += P(wob(x, y + 4, 12, 16, .05, i, 14, 30), PEARL) + stroke(f"M{x - 6},{y + 12} Q{x},{y} {x + 6},{y - 8}", "#E2B866", 4)
    s += sparkle(120, 112, 10, "#FFF4B8")
    return doc(p, 240, 130, G(s, p + "sh"), "smooth", seed=495)


ITEMS = {
    "murk": murk, "trash-bottle": trash_bottle, "trash-can": trash_can, "trash-bag": trash_bag, "trash-straw": trash_straw,
    "trash-tyre": trash_tyre, "trash-net": trash_net,
    "net-basket-blue": lambda: net_basket(BLUE, BLUE_D, BLUE_L, 1), "net-basket-green": lambda: net_basket(LEAF, LEAF_D, LEAF_L, 2),
    "dolphin-free": dolphin_free, "turtle-free": turtle_free, "seaweed-hide": seaweed_hide, "sea-seahorse": seahorse,
    "shell-fan": shell_fan, "shell-spiral": shell_spiral, "starfish": starfish_item, "shell-basket": shell_basket,
    "sand-mound": sand_mound, "necklace-string": necklace_string, "necklace-marina": necklace_marina,
}

if __name__ == "__main__":
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    for k, fn in ITEMS.items():
        if not only or k in only:
            save(k, fn())
    print("ART_SEA3: dolphin net over (420, 150) of 520x300, turtle head (64, 140) of 360x260, Marina's neck (300, 438) of 600x700")
