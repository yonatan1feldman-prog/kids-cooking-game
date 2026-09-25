# images-b-skewers (the eighth recipe: fruit skewers, the `thread` step): skewer-stick, skewer-stand, skewer-plate,
# card-skewers, photo-frame-skewers. Wraps the smoothie kit READ-ONLY (its fruit colours and pieces); writes into
# images-b-skewers/ only. Run: python tools/gen_skewers.py [names...]
import sys, os, re, math, random
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
OUTDIR = os.path.normpath(os.path.join(HERE, ".."))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, "..", "..", "images-b-smoothie", "tools")))
from smoothiekit import *  # noqa: F401,F403
import smoothiekit as SMK
import gen_smoothie_a as SA
import gen_smoothie_c as SMC

# ================= THE STICK (60x720, standing: the point at the top, the foot at the bottom) =================
STICK_W, STICK_H = 60, 720
STICK_TOP, STICK_FOOT = 10, 712          # the point's tip, the foot (it stands in the stand's hole)


def stick_path(x0=30, top=STICK_TOP, foot=STICK_FOOT, w=9):
    return (f"M{x0},{top} L{x0 + w * .5},{top + 36} L{x0 + w},{top + 60} L{x0 + w},{foot - 8} "
            f"Q{x0 + w},{foot} {x0},{foot} Q{x0 - w},{foot} {x0 - w},{foot - 8} L{x0 - w},{top + 60} L{x0 - w * .5},{top + 36}Z")


def stick_layers(p, flat=False):
    Fn = (lambda s, f: s) if flat else G
    L = [Fn(P(stick_path(), WOOD), p + "cut")]
    L.append(P(f"M27,{STICK_TOP + 40} L25,{STICK_FOOT - 20} L29,{STICK_FOOT - 20} L31,{STICK_TOP + 40}Z", WOOD_L, ' opacity="0.9"'))
    L.append(P(f"M34,{STICK_TOP + 70} L35,{STICK_FOOT - 30} L37,{STICK_FOOT - 30} L37,{STICK_TOP + 70}Z", WOOD_D, ' opacity="0.6"'))
    r = random.Random(5)
    L.append("".join(stroke(f"M{27 + r.uniform(-3, 3):.1f},{y} l{r.uniform(-1, 1):.1f},{r.uniform(18, 40):.1f}", WOOD_D, 1.4, ' opacity="0.45"')
                     for y in range(90, STICK_FOOT - 40, 57)))
    return L


def skewer_stick():
    p = "sk-"
    return gen_items.doc(p, STICK_W, STICK_H, "".join(stick_layers(p)), seed=801, sh=(3, 2.5, .3), cut={"rim": 2, "rough": 2.5})


# ================= THE TRAY (800x600): the board of this recipe; Mom's model and her three skewers lie on it in rows =================
TRAY_W, TRAY_H = 800, 600
ROWS = (-187, -62, 62, 187)              # the rows' centre lines, from the tray's centre (the game's ART.skewers.rows)


def skewer_tray():
    p = "tr-"
    L = [G(P(wrect(36, 40, 728, 548, 44, 1.2, 3), SH, ' opacity="0.3"'), p + "bl")]
    handles = "".join(P(wrect(x, 250, 60, 110, 26, .8, 7 + i), WALNUT) + P(wrect(x + 16, 280, 28, 50, 12, .6, 9 + i), "#3A2216", ' opacity="0.8"')
                      for i, x in enumerate((6, 734)))
    L.append(G(handles, p + "cut"))
    L.append(G(P(wrect(36, 28, 728, 548, 44, 1.2, 3), WALNUT) + P(wrect(52, 44, 696, 516, 34, 1, 4), WALNUT_D), p + "cut"))
    L.append(P(wrect(66, 58, 668, 488, 28, .8, 5), WOOD))
    r = random.Random(11)
    grain = "".join(stroke(f"M{80 + r.uniform(0, 40):.0f},{y:.0f} C{300:.0f},{y + r.uniform(-14, 14):.0f} {500:.0f},{y + r.uniform(-14, 14):.0f} {720 - r.uniform(0, 40):.0f},{y + r.uniform(-6, 6):.0f}",
                           WOOD_D, 2.2, ' opacity="0.35"') for y in [90 + i * 37 + r.uniform(-8, 8) for i in range(12)])
    L.append(grain)
    L.append(P("M80,72 L720,72 L716,84 L84,84Z", WOOD_L, ' opacity="0.8"'))
    # a checked cloth napkin under the rows, so the fruit reads well on the wood
    pat = (f'<pattern id="{p}ck" width="44" height="44" patternUnits="userSpaceOnUse">'
           f'<rect width="44" height="44" fill="{CREAM}"/><rect width="22" height="44" fill="{CORAL_L}" opacity="0.35"/>'
           f'<rect width="44" height="22" fill="{CORAL_L}" opacity="0.35"/></pattern>')
    L.append(G(P(wrect(96, 86, 608, 428, 12, 1.4, 6), f"url(#{p}ck)"), p + "sh"))
    return gen_items.doc(p, TRAY_W, TRAY_H, "".join(L), seed=805, sh=(4, 3.5, .32), extra_defs=pat)


# ================= A MINI SKEWER (flat, for the card and the photo frame's sticker) =================
def piece_defs(p):
    return "".join(f'<g id="{p}{f[0]}" transform="translate(-70 -70)">{SMK.unfilter(SA.PIECES[f](p + f[0] + "x")[0])}</g>' for f in SA.FRUITS)


def mini_skewer(p, x, y, s, fruits, rot=0):
    """A skewer standing with its foot at (x, y), scale s (1 = the game's stick with 0.55 slices), rotated by rot."""
    inner = "".join(stick_layers(p + "s", flat=True))
    pitch = 118
    for i, f in enumerate(fruits):
        cy = STICK_FOOT - 90 - i * pitch
        inner += f'<use href="#{p}{f[0]}" transform="translate(30 {cy}) scale(0.94)"/>'
    return f'<g transform="translate({n(x)} {n(y)}) rotate({rot}) scale({s}) translate(-30 -{STICK_FOOT})">{inner}</g>'


# ================= RECIPE CARD (400x520, the card layout of the others) =================
def card_skewers():
    p = "crk-"
    L = [G(P(gen_kitchen.wrect(10, 10, 380, 500, 36, 2.2, 3, step=18), CREAM), p + "cut")]
    pat = (f'<pattern id="{p}gh" width="40" height="40" patternUnits="userSpaceOnUse">'
           f'<rect width="40" height="40" fill="#EAF5E2"/><rect width="20" height="40" fill="{GREEN_L}" opacity="0.25"/>'
           f'<rect width="40" height="20" fill="{GREEN_L}" opacity="0.25"/></pattern>')
    L.append(G(P(gen_kitchen.wrect(34, 34, 332, 332, 26, 1.2, 4), f"url(#{p}gh)"), p + "sh"))
    L.append(G(E(200, 344, 150, 12, SH, ' opacity="0.25"'), p + "bl"))
    sk = mini_skewer(p, 118, 350, .44, ["strawberry", "banana", "strawberry", "banana", "strawberry"], -14)
    sk += mini_skewer(p, 206, 356, .44, ["kiwi", "mango", "kiwi", "mango", "kiwi"], 0)
    sk += mini_skewer(p, 292, 350, .44, ["banana", "kiwi", "strawberry", "banana", "kiwi"], 14)
    L.append(G(sk, p + "sh"))
    L.append(G(P(gen_kitchen.wrect(130, -4, 140, 40, 3, 1.4, 6), MUSTARD, ' opacity="0.85" transform="rotate(-4 200 15)"')
               + "".join(C(146 + i * 18, 16, 4, WHITE, ' opacity="0.7" transform="rotate(-4 200 15)"') for i in range(7)), p + "sh"))
    L.append(G("".join(P(wob(x, 440, 50, 44, .04, 7 + i, 20), WHITE) for i, x in enumerate((92, 200, 308))), p + "sh"))
    L.append(G("".join(f'<use href="#{p}{f[0]}" transform="translate({x} 440) scale(0.62)"/>' for f, x in (("strawberry", 92), ("banana", 200), ("kiwi", 308))), p + "sh"))
    d = std_defs(p, "rough", seed=57, sh=(4, 3.5, .32), cut={"rim": 3, "rough": 7, "freq": .12}) + pat + piece_defs(p)
    return svg(400, 520, d, G("".join(L), p + "gr"))


# ================= PHOTO FRAME (700x780, the prep frame with a skewer sticker) =================
def photo_frame_skewers():
    s = SMC.photo_frame_smoothie()
    old = SMC.smoothie_sticker()
    assert s.count(old.replace("pf-", "pfm-")) == 1 or s.count(old) == 1, "smoothie sticker not found"
    new = mini_skewer("pfk-", 392, 716, .17, ["strawberry", "banana", "kiwi"], 50)
    s = s.replace(old, new) if s.count(old) == 1 else s.replace(old.replace("pf-", "pfm-"), new)
    s = s.replace("pfm-", "pfk-")
    return s.replace("</defs>", piece_defs("pfk-") + "</defs>", 1)


def save(name, s):
    assert not any(f in s for f in SMK.FORBID), name
    path = os.path.join(OUTDIR, name + ".svg")
    with open(path, "w", encoding="utf8") as f:
        f.write(s)
    size = len(s.encode("utf8"))
    print(f"{name:24s} {size / 1024:6.1f} KB" + ("  OVER BUDGET" if size > 60 * 1024 else ""))


ITEMS = {"skewer-stick": skewer_stick, "skewer-tray": skewer_tray,
         "card-skewers": card_skewers, "photo-frame-skewers": photo_frame_skewers}

if __name__ == "__main__":
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    for k, fn in ITEMS.items():
        if not only or k in only:
            save(k, fn())
