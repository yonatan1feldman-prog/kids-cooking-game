# images-b-cake, part B: the decorating kit and the two flat items.
#   frosting-tub-pink / -white / -choc  the three tubs she taps to choose a colour   (320x360, one frame)
#   frosting-blob                       ONE neutral blob the game tints and uses as a brush (200x200, = images-b/sauce-blob)
#   choc-chip                           a 140x140 stamp, like candy-dot / berry
#   candle / flame-candle / smoke-puff  the birthday candle and what happens to it
#   card-cake                           the home-screen card (400x520, the card-soup / card-cookies construction)
#   photo-frame-cake                    700x780, EXACTLY the images-b-prep photo-frame with a cake sticker
# Run: python tools/gen_cake_b.py [names...]     (writes into images-b-cake/ only)
import math, random, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cakekit import *  # noqa: F401,F403


# ================= THE FROSTING TUBS (320x360; base contact (160,336), frosting surface (160,140) rx 132 ry 54) =======
TUB_RIM_Y, TUB_RRX, TUB_RRY = 138, 140, 58                   # the plastic rim, just outside the frosting surface
TUB_BOT_Y, TUB_BRX, TUB_BRY = 318, 104, 18                   # the bottom ellipse; its lowest point = TUB_BASE
PLAS, PLAS_L, PLAS_D = "#F4EFE4", "#FFFFFF", "#D6CDBC"       # the cream plastic of the tub


def tub_body():
    """The tub's silhouette: rim ellipse -> tapered wall -> the near half of the bottom ellipse."""
    cx = TUB_BASE[0]
    return (f"M{cx - TUB_RRX},{TUB_RIM_Y} C{cx - TUB_RRX - 2},{TUB_RIM_Y + 82} {cx - TUB_BRX - 10},{TUB_BOT_Y - 36} "
            f"{cx - TUB_BRX},{TUB_BOT_Y} A{TUB_BRX},{TUB_BRY} 0 0 1 {cx + TUB_BRX},{TUB_BOT_Y} "
            f"C{cx + TUB_BRX + 10},{TUB_BOT_Y - 36} {cx + TUB_RRX + 2},{TUB_RIM_Y + 82} {cx + TUB_RRX},{TUB_RIM_Y} "
            f"A{TUB_RRX},{TUB_RRY} 0 0 1 {cx - TUB_RRX},{TUB_RIM_Y}Z")


def frost_pool(cx, cy, rx, ry, kind, seed=1):
    """A heaped pool of frosting seen into an oval opening: the same look as frost_disc but foreshortened."""
    col, col_l, col_d = FROST[kind]
    r = random.Random(seed)
    g = P(wob(cx, cy + ry * .07, rx, ry, .03, seed, 34), col_d)                        # the shaded meniscus
    g += P(wob(cx - rx * .02, cy - ry * .06, rx * .95, ry * .9, .035, seed + 1, 34), col)
    g += P(wob(cx - rx * .18, cy - ry * .3, rx * .54, ry * .44, .06, seed + 2, 24), col_l, ' opacity="0.55"')
    d = "M" + " L".join(f"{n(cx + math.cos(i / 9 * 6.283) * (rx * .78 - i * rx * .026))},"
                        f"{n(cy + math.sin(i / 9 * 6.283) * (ry * .7 - i * ry * .024))}" for i in range(26))
    g += stroke(d, col_d, ry * .17, ' opacity="0.34"')                                   # the spatula swirl
    g += stroke(d, col_l, ry * .07, ' opacity="0.45"')
    for _ in range(6):                                                                   # the peaks it left behind
        a, dd = r.uniform(0, 6.283), math.sqrt(r.random()) * .72
        g += P(wob(cx + math.cos(a) * rx * dd, cy + math.sin(a) * ry * dd, rx * .11, ry * .12, .16,
                   r.randint(1, 999), 10, r.uniform(-30, 30)), col_l, ' opacity="0.5"')
    return g


def frosting_tub(kind):
    """An open tub of frosting, seen slightly from above so the whole colour is visible. She taps one to choose."""
    p = f"ft{kind[0]}-"
    col, col_l, col_d = FROST[kind]
    band = FW_D if kind == "white" else col                   # the white tub gets a warm beige band, never a second colour
    dot = TEAL_L if kind == "white" else WHITE
    cx = TUB_BASE[0]
    body = tub_body()
    L = [G(E(cx + 8, TUB_BASE[1] + 2, TUB_BRX * 1.1, 15, SH, ' opacity="0.3"'), p + "bl")]      # contact shadow
    L.append(G(P(body, PLAS_D), p + "cut"))                                                     # the cut-paper silhouette
    L.append(P(f"M{cx - TUB_RRX + 6},{TUB_RIM_Y + 6} C{cx - TUB_RRX + 4},{TUB_RIM_Y + 84} {cx - TUB_BRX - 4},{TUB_BOT_Y - 34} "
               f"{cx - TUB_BRX + 4},{TUB_BOT_Y - 4} A{TUB_BRX - 4},{TUB_BRY - 3} 0 0 1 {cx + TUB_BRX - 4},{TUB_BOT_Y - 4} "
               f"C{cx + TUB_BRX + 4},{TUB_BOT_Y - 34} {cx + TUB_RRX - 4},{TUB_RIM_Y + 84} {cx + TUB_RRX - 6},{TUB_RIM_Y + 6} "
               f"A{TUB_RRX - 6},{TUB_RRY - 5} 0 0 1 {cx - TUB_RRX + 6},{TUB_RIM_Y + 6}Z", PLAS))
    # the colour band round the belly, clipped to the tub, with polka dots and a pale label patch
    bid = f"{p}bc"
    bw = f'<clipPath id="{bid}"><path d="{body}"/></clipPath>'
    lab = P(f"M{cx - TUB_RRX},{TUB_RIM_Y + 66} C{cx - 100},{TUB_RIM_Y + 108} {cx + 100},{TUB_RIM_Y + 108} {cx + TUB_RRX},{TUB_RIM_Y + 66} "
            f"L{cx + TUB_RRX},{TUB_BOT_Y - 16} C{cx + 90},{TUB_BOT_Y + 22} {cx - 90},{TUB_BOT_Y + 22} {cx - TUB_RRX},{TUB_BOT_Y - 16}Z", band)
    for i in range(7):                                                                         # dots on the band
        lab += C(cx - 96 + i * 32, TUB_RIM_Y + 100 + (16 if i % 2 else 0), 7, dot, ' opacity="0.8"')
    lab += P(f"M{cx - 62},{TUB_RIM_Y + 130} C{cx - 30},{TUB_RIM_Y + 150} {cx + 30},{TUB_RIM_Y + 150} {cx + 62},{TUB_RIM_Y + 130} "
             f"L{cx + 58},{TUB_RIM_Y + 158} C{cx + 28},{TUB_RIM_Y + 176} {cx - 28},{TUB_RIM_Y + 176} {cx - 58},{TUB_RIM_Y + 158}Z",
             WHITE, ' opacity="0.75"')                                                          # a blank label strip (no text)
    lab += C(cx - 34, TUB_RIM_Y + 158, 8, col_d, ' opacity="0.7"') + C(cx, TUB_RIM_Y + 162, 9, col, ' opacity="0.85"')
    lab += C(cx + 34, TUB_RIM_Y + 158, 8, col_l, ' opacity="0.9"')                              # three colour pips = "frosting"
    L.append(bw + G(lab, None, f' clip-path="url(#{bid})"'))
    # the plastic rim, then the frosting inside it
    L.append(G(E(cx, TUB_RIM_Y, TUB_RRX, TUB_RRY, PLAS_D), p + "sh"))
    L.append(E(cx, TUB_RIM_Y - 3, TUB_RRX - 3, TUB_RRY - 3, PLAS_L, ' opacity="0.85"'))
    L.append(E(cx, TUB_TOP[1] - 2, TUB_ORX + 8, TUB_ORY + 8, PLAS_D))                           # the inside wall, in shade
    L.append(G(frost_pool(TUB_TOP[0], TUB_TOP[1], TUB_ORX, TUB_ORY, kind, seed=61), p + "sh"))
    # gloss on the plastic
    gid = f"{p}gc"
    gl = P(f"M{cx - 118},{TUB_RIM_Y + 40} Q{cx - 128},{TUB_RIM_Y + 130} {cx - 92},{TUB_BOT_Y - 6} "
           f"Q{cx - 106},{TUB_RIM_Y + 130} {cx - 100},{TUB_RIM_Y + 40}Z", WHITE, ' opacity="0.6"')
    gl += P(f"M{cx + 104},{TUB_RIM_Y + 50} Q{cx + 116},{TUB_RIM_Y + 140} {cx + 86},{TUB_BOT_Y - 4} "
            f"Q{cx + 100},{TUB_RIM_Y + 140} {cx + 94},{TUB_RIM_Y + 50}Z", PLAS_D, ' opacity="0.55"')
    L.append(f'<clipPath id="{gid}"><path d="{body}"/></clipPath>' + G(gl, None, f' clip-path="url(#{gid})"'))
    L.append(P(f"M{cx - 96},{TUB_RIM_Y - 22} Q{cx - 20},{TUB_RIM_Y - 44} {cx + 62},{TUB_RIM_Y - 28} "
               f"Q{cx - 16},{TUB_RIM_Y - 30} {cx - 92},{TUB_RIM_Y - 12}Z", WHITE, ' opacity="0.55"'))       # rim shine
    return doc(p, TUB[0], TUB[1], "".join(L), material="smooth", seed=251 + list(FROST).index(kind),
               sh=(4, 3.5, .32), blur=5)


# ================= FROSTING BLOB (200x200; the images-b/sauce-blob brush, drawn NEUTRAL so the game tints it) =========
def frosting_blob():
    """One lobed blob of frosting, centre (100,100), r ~68 -- the same frame, centre and radius as images-b/sauce-blob,
    so the game turns its silhouette into a flat brush in exactly the same way. Drawn in ONE near-white neutral
    (#FAF5EC) with only a whisper of shading, so a multiply / tint to pink, white or chocolate keeps it flat and
    overlapping stamps merge into one field instead of showing seams."""
    p = "fb-"
    r = random.Random(12)
    pts = gen_items.polar(BLOB_AT[0], BLOB_AT[1],
                          lambda a: BLOB_R + 2.8 * math.sin(a * 3 + .5) + 1.5 * math.sin(a * 5 + 2.2) + r.uniform(-.6, .6), 30)
    gen_items.check("frosting-blob", "blob", gen_items.bbox(pts),
                    (BLOB_AT[0] - 70, BLOB_AT[1] - 70, BLOB_AT[0] + 70, BLOB_AT[1] + 70), 5)
    gen_items.check_r("frosting-blob", "blob", pts, BLOB_AT, 73)
    inner = gen_items.polar(98, 97, lambda a: 46 + 2 * math.sin(a * 3 + 1.9), 24)
    L = [G(P(smooth(pts), BLOB_C_), p + "cut"),
         G(P(smooth(inner), mix(BLOB_C_, FW_D, .35), ' opacity="0.45"'), p + "bl")]     # a very soft, low-contrast centre
    # torn edge in the same neutral (no cream rim, no drop shadow): the game uses the alpha as a paint brush
    return doc(p, BLOB[0], BLOB[1], "".join(L), seed=35, blur=10,
               cut={"op": 0, "rim": 1.6, "rough": 3, "rim_col": BLOB_C_, "rim_op": 1})


# ================= CHOCOLATE CHIP (140x140 stamp, centre (70,70), r <= 58; = candy-dot / berry) =======================
def choc_chip():
    """One chocolate chip: the classic rounded cone, seen a little from above so its disc base shows.
    Review fix 4: it used to read as a flat brown triangle. The cone now has a rounded shoulder, the base disc it
    sits on is visible all round, and the gloss is a real highlight down the lit side."""
    p = "cc-"
    cx, base = 70, 110
    apex = 26
    L = [G(E(cx, base, 47, 17, CHIP_D), p + "cut")]                                       # the disc base (the cut edge)
    cone = (f"M{cx - 44},{base - 3} C{cx - 45},{base - 44} {cx - 30},{apex + 26} {cx - 4},{apex} "
            f"C{cx + 26},{apex + 26} {cx + 43},{base - 44} {cx + 44},{base - 3} "
            f"A44,16 0 0 1 {cx - 44},{base - 3}Z")
    L.append(G(P(cone, CHIP), p + "sh"))
    L.append(P(f"M{cx - 36},{base - 8} C{cx - 37},{base - 46} {cx - 24},{apex + 30} {cx - 5},{apex + 6} "
               f"C{cx + 4},{apex + 30} {cx + 10},{base - 44} {cx + 12},{base - 12} "
               f"A24,10 0 0 1 {cx - 36},{base - 8}Z", mix(CHIP, CHIP_L, .55)))              # the lit left face
    L.append(P(f"M{cx + 12},{base - 12} C{cx + 12},{base - 46} {cx + 2},{apex + 28} {cx - 4},{apex + 2} "
               f"C{cx + 26},{apex + 26} {cx + 43},{base - 44} {cx + 44},{base - 5} "
               f"A44,16 0 0 0 {cx + 12},{base - 12}Z", CHIP_D, ' opacity="0.5"'))           # the shaded right face
    L.append(P(f"M{cx - 27},{base - 26} C{cx - 26},{base - 54} {cx - 16},{apex + 34} {cx - 7},{apex + 14} "
               f"C{cx - 13},{apex + 38} {cx - 17},{base - 52} {cx - 17},{base - 28}Z", CHIP_L, ' opacity="0.9"'))   # gloss
    L.append(gen_items.ring(gen_items.wobp(cx, base, 47, 17, .01, 3, 26), gen_items.wobp(cx, base - 1, 41, 13, .01, 4, 26),
                            mix(CHIP_D, CHIP, .35), ' opacity="0.85"'))                     # the seated base ring, all round
    L.append(E(cx - 12, base - 6, 17, 5, CHIP_L, ' opacity="0.35"'))
    L.append(C(cx + 13, apex + 30, 4, CHIP_L, ' opacity="0.75"'))
    return doc(p, STAMP, STAMP, "".join(L), material="smooth", seed=261, sh=(3, 2.5, .34), blur=4)


# ================= THE CANDLE (260x460; BASE ANCHOR (130,414), FLAME POINT (130,90)) =================================
def candle():
    """A striped birthday candle standing on a cake seen from above (a slight 3/4 view). She drags it: the BASE ANCHOR
    (130,414) is the point that lands where she drops it; flame-candle's foot goes on the FLAME POINT (130,90)."""
    p = "cnd-"
    cx, by = CANDLE_BASE
    L = [G(E(cx + 24, by + 8, CAND_RX * 1.1, CAND_RY * .82, SH, ' opacity="0.26"'), p + "bl")]
    L.append(G(P(candle_body(p, cx, by, 1, body_only=True), WAX_D), p + "cut"))
    L.append(candle_body(p, cx, by, 1, seed=3, shadow=False))
    return doc(p, CANDLE[0], CANDLE[1], "".join(L), material="smooth", seed=271, sh=(4, 3.5, .32), blur=6,
               cut={"rim": 2, "rough": 4, "freq": .16})


# ================= THE FLAME (200x280; FOOT (100,236), tip (100,44)) ================================================
def flame_candle():
    """A small teardrop candle flame -- NOT the pancakes' gas-hob ring. Its FOOT (100,236) goes on the candle's
    flame point, so the wick disappears into the blue base of the flame."""
    p = "flc-"
    cx, cy = FLAME_BASE
    L = [G(E(cx, cy - 104, 66, 104, FLM_Y, ' opacity="0.3"') + E(cx, cy - 70, 44, 66, FLM_O, ' opacity="0.22"'), p + "bl")]
    L.append(flame_shape(cx, cy, 1))
    L.append(C(cx, cy - 150, 7, WHITE, ' opacity="0.55"'))
    return doc(p, FLAME[0], FLAME[1], "".join(L), material="smooth", seed=281, sh=(0, 0.1, 0), blur=9)


# ================= THE SMOKE (240x360; FOOT (120,340)) =============================================================
def smoke_puff():
    """A wisp of smoke from a blown-out candle. Its FOOT (120,340) goes on the same flame point the flame used."""
    p = "smk-"
    cx, cy = SMOKE_BASE
    L = [G(smoke_wisp(cx, cy, 1, seed=5), p + "bl")]
    return doc(p, SMOKE[0], SMOKE[1], "".join(L), material="smooth", seed=291, sh=(0, 0.1, 0), blur=7)


# ================= RECIPE CARD (400x520, the card-soup / card-cookies construction) =================================
def mini_egg(cx, cy, s):
    return (E(cx, cy + 2 * s, 26 * s, 33 * s, SHELL_D) + E(cx - 1 * s, cy, 24 * s, 31 * s, SHELL)
            + E(cx - 7 * s, cy - 12 * s, 7 * s, 10 * s, SHELL_L))


def mini_butter(cx, cy, s):
    g = P(f"M{n(cx - 26 * s)},{n(cy - 6 * s)} L{n(cx - 4 * s)},{n(cy - 18 * s)} L{n(cx + 26 * s)},{n(cy - 10 * s)} "
          f"L{n(cx + 26 * s)},{n(cy + 12 * s)} L{n(cx - 4 * s)},{n(cy + 20 * s)} L{n(cx - 26 * s)},{n(cy + 8 * s)}Z", BUTTER_D)
    g += P(f"M{n(cx - 26 * s)},{n(cy - 6 * s)} L{n(cx - 4 * s)},{n(cy - 18 * s)} L{n(cx + 26 * s)},{n(cy - 10 * s)} "
           f"L{n(cx + 4 * s)},{n(cy + 2 * s)}Z", BUTTER_L)                                   # the top face
    g += P(f"M{n(cx + 4 * s)},{n(cy + 2 * s)} L{n(cx + 26 * s)},{n(cy - 10 * s)} L{n(cx + 26 * s)},{n(cy + 12 * s)} "
           f"L{n(cx + 4 * s)},{n(cy + 20 * s)}Z", BUTTER)                                    # the right face
    return g


def mini_sugar(cx, cy, s):
    """A little heap of sugar with a wooden scoop. Review fix 3: a pale heap on a white blob read as an empty slot,
    so the heap now has a firm shaded edge and a scoop behind it to give the slot a shape."""
    g = P(f"M{n(cx + 6 * s)},{n(cy - 8 * s)} L{n(cx + 34 * s)},{n(cy - 26 * s)} L{n(cx + 40 * s)},{n(cy - 17 * s)} "
          f"L{n(cx + 12 * s)},{n(cy + 1 * s)}Z", WOOD_D)                                    # the scoop's handle
    g += P(wob(cx + 2 * s, cy - 7 * s, 17 * s, 13 * s, .05, 9, 16, -28), WOOD)
    g += P(wob(cx + 1 * s, cy - 9 * s, 13 * s, 9 * s, .06, 10, 14, -28), WOOD_L, ' opacity="0.8"')
    g += P(wob(cx, cy + 8 * s, 32 * s, 15 * s, .05, 3, 22), mix(SUG_D, WOOD_D, .3))          # the heap's shaded foot
    g += P(wob(cx - 1 * s, cy + 4 * s, 29 * s, 13 * s, .06, 4, 22), SUG_D)
    g += P(wob(cx - 3 * s, cy + 1 * s, 25 * s, 11 * s, .07, 5, 20), SUG)
    g += P(wob(cx - 9 * s, cy - 3 * s, 13 * s, 5 * s, .1, 6, 12), WHITE, ' opacity="0.9"')
    r = random.Random(7)
    for _ in range(12):
        a, d = r.uniform(0, 6.283), math.sqrt(r.random())
        g += C(cx + math.cos(a) * 24 * s * d, cy + 3 * s + math.sin(a) * 10 * s * d, 2.4 * s,
               mix(SUG_D, WOOD_D, .35), ' opacity="0.75"')                                   # visible crystals
    g += C(cx - 34 * s, cy + 15 * s, 2.8 * s, SUG_D) + C(cx + 31 * s, cy + 17 * s, 3 * s, SUG_D)
    return g


def card_cake():
    p = "crk-"
    L = [G(P(gen_kitchen.wrect(10, 10, 380, 500, 36, 2.2, 3, step=18), CREAM), p + "cut")]
    pat = (f'<pattern id="{p}gh" width="40" height="40" patternUnits="userSpaceOnUse">'
           f'<rect width="40" height="40" fill="#FDECF2"/><rect width="20" height="40" fill="{FP}" opacity="0.24"/>'
           f'<rect width="40" height="20" fill="{FP}" opacity="0.24"/></pattern>')
    L.append(G(P(gen_kitchen.wrect(34, 34, 332, 332, 26, 1.2, 4), f"url(#{p}gh)"), p + "sh"))
    L.append(G(mini_cake(200, 208, 1.02, "pink"), p + "sh"))                                  # the picture: a lit birthday cake
    L.append(G(P(gen_kitchen.wrect(130, -4, 140, 40, 3, 1.4, 6), MUSTARD, ' opacity="0.85" transform="rotate(-4 200 15)"')
               + "".join(C(146 + i * 18, 16, 4, WHITE, ' opacity="0.7" transform="rotate(-4 200 15)"') for i in range(7)), p + "sh"))
    # ingredient row: egg, butter, sugar
    L.append(G("".join(P(wob(x, 440, 50, 44, .04, 7 + i, 20), WHITE) for i, x in enumerate((92, 200, 308))), p + "sh"))
    L.append(G(mini_egg(92, 440, 1), p + "sh") + G(mini_butter(200, 438, .95), p + "sh") + G(mini_sugar(308, 436, .95), p + "sh"))
    d = std_defs(p, "rough", seed=59, sh=(4, 3.5, .32), cut={"rim": 3, "rough": 7, "freq": .12}) + pat
    return svg(CARD[0], CARD[1], d, G("".join(L), p + "gr"))


# ================= PHOTO FRAME (700x780, identical to images-b-prep photo-frame, cake sticker) ======================
def pizza_sticker():
    """The exact markup of the pizza-slice sticker in gen_prep_b.photo_frame (swapped out, like the other recipes')."""
    return (P("M410,726 L380,668 Q410,654 440,668Z", SAUCE) + P("M410,716 L388,672 Q410,662 432,672Z", CHEESE)
            + P(wrect(376, 656, 68, 16, 8, .3, 5), CRUST) + C(404, 686, 5, RED) + C(416, 700, 4, OLIVE))


def photo_frame_cake():
    s = PB.photo_frame()
    old = pizza_sticker()
    assert s.count(old) == 1, "pizza sticker not found in the prep frame code"
    return s.replace(old, mini_cake(410, 690, .26, "pink")).replace("pf-", "pfk-")


ITEMS = {"frosting-tub-pink": lambda: frosting_tub("pink"), "frosting-tub-white": lambda: frosting_tub("white"),
         "frosting-tub-choc": lambda: frosting_tub("choc"), "frosting-blob": frosting_blob, "choc-chip": choc_chip,
         "candle": candle, "flame-candle": flame_candle, "smoke-puff": smoke_puff,
         "card-cake": card_cake, "photo-frame-cake": photo_frame_cake}

if __name__ == "__main__":
    run(ITEMS)
    for nm, rows in gen_items.BOXES.items():
        for label, box, exp, ok in rows:
            print(("  ok  " if ok else "  FAIL"), nm, label, box, exp)
