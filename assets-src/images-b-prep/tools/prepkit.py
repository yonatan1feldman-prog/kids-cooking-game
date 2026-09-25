# Shared kit for images-b-prep. Re-uses the style-B production code in ../../images-b/tools READ-ONLY
# (palette, paper texture, torn edge, shadows, Mom's hand parts), so new items share the exact look.
# Bytecode caching is disabled so importing never writes into images-b/.
import sys, os
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
PREP = os.path.normpath(os.path.join(HERE, ".."))
BTOOLS = os.path.normpath(os.path.join(HERE, "..", "..", "images-b", "tools"))
sys.path.insert(0, BTOOLS)
from pb import *                      # noqa: F401,F403  palette + helpers + filters
import pb, gen_items, gen_mom, gen_kitchen  # noqa: E402
from gen_items import wobp, polar, bbox, ring, scale_path, doc, MUSH_SIL, kernel_pts  # noqa: F401,E402
from gen_kitchen import rpoly, rect  # noqa: F401,E402

FORBID = ("<text", "<image", "<script", "font-family", "@font-face", "<foreignObject", "href=\"http")


def save(name, s):
    """Write one SVG into images-b-prep/ (never anywhere else). Returns size in bytes."""
    assert not any(f in s for f in FORBID), name
    path = os.path.join(PREP, name + ".svg")
    with open(path, "w", encoding="utf8") as f:
        f.write(s)
    size = len(s.encode("utf8"))
    print(f"{name:22s} {size / 1024:6.1f} KB" + ("  OVER BUDGET" if size > 60 * 1024 else ""))
    return size


def lerp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def skin_palette(skin):
    """Same derivation as Mom's palette (gen_mom.palette) so kid hands match any skin tone."""
    return {"skin": skin, "skin_sh": mix(skin, "#7A3E30", .24), "skin_lt": mix(skin, "#FFF4E6", .28),
            "blush": mix(skin, "#E8606E", .42)}
