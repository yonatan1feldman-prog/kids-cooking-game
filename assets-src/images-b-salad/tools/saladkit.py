# Shared kit for images-b-salad (the second recipe: vegetable salad).
# Re-uses the style-B production code READ-ONLY: images-b/tools (pb palette, paper grain, torn edge, shadows, toppings,
# Mom's hands) and images-b-prep/tools (vegetable spec, bowls, sink, slice-from-topping, strip measuring).
# Bytecode caching is disabled so importing never writes into images-b/ or images-b-prep/. Output goes ONLY to images-b-salad/.
import sys, os, re
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
SALAD = os.path.normpath(os.path.join(HERE, ".."))
PTOOLS = os.path.normpath(os.path.join(HERE, "..", "..", "images-b-prep", "tools"))
sys.path.insert(0, PTOOLS)
from prepkit import *                      # noqa: F401,F403  palette + pb helpers + gen_items helpers
import prepkit, pb, gen_items, gen_mom, gen_kitchen   # noqa: F401,E402
import gen_prep_a as PA, gen_prep_b as PB, gen_prep_e as PE   # noqa: E402

FORBID = ("<text", "<image", "<script", "font-family", "@font-face", "<foreignObject", "href=\"http")

# salad colours (derived from the pb palette so they sit in the same family)
CUKE_D, CUKE, CUKE_L = "#2F6B2A", "#4E9A3A", "#8CC862"          # cucumber skin: darker, bluer than the pepper green
CUKE_F, CUKE_F2, CUKE_SEED = "#D7EDA4", "#EEF8CF", "#FFF7D6"      # flesh, seed zone, seeds
CAR_D, CAR, CAR_L, CAR_C = "#CF5F1B", "#F2862C", "#FFB25E", "#FFC983"   # carrot
LET_D, LET, LET_L, LET_P = "#4F9A36", "#7DC24E", "#B4E07A", "#E4F4BE"   # lettuce: dark, mid, light, pale rib
LEM_D, LEM, LEM_L, LEM_P, LEM_S = "#E3A91A", "#FFD23F", "#FFEB94", "#FFF8DE", "#FFE06A"   # lemon rind, pith, segment
OIL_D, OIL, OIL_L = "#A08A16", "#D6BE34", "#F0DE7A"
WATER, WATER_L, WATER_D = PA.WATER, PA.WATER_L, PA.WATER_D
GLASS, GLASS_D = PB.GLASS, PB.GLASS_D
CHROME, CHROME_D, CHROME_L = PA.CHROME, PA.CHROME_D, PA.CHROME_L


def save(name, s):
    """Write one SVG into images-b-salad/ (never anywhere else). Returns size in bytes."""
    assert not any(f in s for f in FORBID), name
    path = os.path.join(SALAD, name + ".svg")
    assert os.path.dirname(os.path.abspath(path)) == SALAD
    with open(path, "w", encoding="utf8") as f:
        f.write(s)
    size = len(s.encode("utf8"))
    print(f"{name:22s} {size / 1024:6.1f} KB" + ("  OVER BUDGET" if size > 60 * 1024 else ""))
    return size


def body_of(s, p_old, p_new):
    """Take a generated file apart: (defs, body) with the filter-id prefix renamed, so a drawing can be embedded elsewhere."""
    defs = re.search(r"<defs>(.*)</defs>", s).group(1).replace(p_old, p_new)
    body = re.search(r'</defs><g filter="url\(#' + p_old + r'gr\)">(.*)</g></svg>$', s).group(1).replace(p_old, p_new)
    return defs, body


def run(items):
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    for name, fn in items.items():
        if not only or name in only:
            save(name, fn())
