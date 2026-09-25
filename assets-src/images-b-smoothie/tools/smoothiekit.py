# Shared kit for images-b-smoothie (the fourth recipe: fruit smoothie).
# Wraps the cookie kit (images-b-cookies/tools/cookiekit.py) READ-ONLY, which wraps the salad kit, the prep kit and the style-B kit
# (images-b/tools/pb.py palette, paper grain, torn edge, shadows). Bytecode caching is off, so importing writes nothing into the
# other folders. It only adds the fruit / smoothie / milk colours, a few shared shapes and a save() that writes into images-b-smoothie/ only.
import sys, os, re, math
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
SMOO = os.path.normpath(os.path.join(HERE, ".."))
CTOOLS = os.path.normpath(os.path.join(HERE, "..", "..", "images-b-cookies", "tools"))
sys.path.insert(0, CTOOLS)
from cookiekit import *                      # noqa: F401,F403  pb palette + helpers, prep + salad + cookie helpers
import cookiekit as CK                       # noqa: E402
import saladkit as SK                        # noqa: E402
from saladkit import PA, PB, PE, gen_items, gen_kitchen, body_of   # noqa: F401,E402

FORBID = SK.FORBID

# ---- fruit colours (mixed to sit in the pb palette; strawberry is crimson-pink so it never reads as the pb tomato red) ----
BAN, BAN_L, BAN_D, BAN_DD = "#FFD84A", "#FFEC94", "#E8B228", "#B98A1E"      # banana peel
BAN_F, BAN_F2, BAN_SEED = "#FFF3C8", "#FBE6A6", "#C9A25A"                   # banana flesh, core, seed dots
BAN_TIP = "#6B4A2A"                                                          # dark stem / tip ends
STR, STR_L, STR_D = "#E23A4E", "#F4747E", "#AE2238"                          # strawberry skin
STR_F, STR_F2, STR_SEED = "#F79AA6", "#FFE2E4", "#FFE27A"                   # flesh, white core, seeds
LEAF, LEAF_L, LEAF_D = GREEN, GREEN_L, GREEN_D
MAN_O, MAN_R, MAN_G, MAN_Y = "#FFA531", "#F0643A", "#9DC24A", "#FFC74A"     # mango skin: orange, red blush, green shoulder, yellow
MAN_D = "#D9731E"
MAN_F, MAN_FL, MAN_FD, MAN_PIT = "#FFB234", "#FFD36E", "#F09422", "#FFF1C4"  # mango flesh, light, fibre, pit
KIW, KIW_L, KIW_D = "#9C7A42", "#C2A468", "#66502A"                          # kiwi skin: fuzzy OLIVE brown (not potato brown)
KIW_F, KIW_FL, KIW_FD, KIW_C, KIW_SEED = "#8CC63F", "#B8DE6E", "#6FA82E", "#F2F6D2", "#2E201B"
# smoothie (a neutral pink-orange that fits any 3 of the 4 fruits with milk) and milk
SMO, SMO_L, SMO_D, SMO_F = "#F6A186", "#FFC6B2", "#DE7A66", "#FFE3D8"      # body, light, shade, foam
MILK, MILK_D, MILK_L = "#FFFFFF", "#CFDCE0", "#F2F7F8"
GLASS, GLASS_D = PB.GLASS, PB.GLASS_D                                        # the prep glass (olive jar)
CHROME, CHROME_D, CHROME_L = PA.CHROME, PA.CHROME_D, PA.CHROME_L
# blender plastics: coral body (the kitchen's coral), teal accents, cream
BL, BL_D, BL_L = CORAL, CORAL_D, CORAL_L


def heart(cx, cy, s, col, extra=""):
    """The frame's heart shape (same path formula as gen_prep_b.photo_frame)."""
    return P(f"M{n(cx)},{n(cy + 22 * s)} C{n(cx - 26 * s)},{n(cy + 4 * s)} {n(cx - 28 * s)},{n(cy - 16 * s)} {n(cx - 14 * s)},{n(cy - 22 * s)} "
             f"C{n(cx - 6 * s)},{n(cy - 25 * s)} {n(cx)},{n(cy - 18 * s)} {n(cx)},{n(cy - 12 * s)} C{n(cx)},{n(cy - 18 * s)} {n(cx + 6 * s)},{n(cy - 25 * s)} "
             f"{n(cx + 14 * s)},{n(cy - 22 * s)} C{n(cx + 28 * s)},{n(cy - 16 * s)} {n(cx + 26 * s)},{n(cy + 4 * s)} {n(cx)},{n(cy + 22 * s)}Z", col, extra)


def unfilter(s):
    """Drop filter references (for flat <use> copies inside another drawing)."""
    return re.sub(r' filter="url\(#[^)]*\)"', "", s)


def save(name, s):
    """Write one SVG into images-b-smoothie/ (never anywhere else). Returns size in bytes."""
    assert not any(f in s for f in FORBID), name
    path = os.path.join(SMOO, name + ".svg")
    assert os.path.dirname(os.path.abspath(path)) == SMOO
    with open(path, "w", encoding="utf8") as f:
        f.write(s)
    size = len(s.encode("utf8"))
    print(f"{name:24s} {size / 1024:6.1f} KB" + ("  OVER BUDGET" if size > 60 * 1024 else ""))
    return size


def run(items):
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    for name, fn in items.items():
        if not only or name in only:
            save(name, fn())
