# images-b-soup, part C: the water jug, the serving bowl (soup-bowl-empty / -full), the ladle of soup (soup-portion),
# the recipe card and the photo frame.
# Run: python tools/gen_soup_c.py [names...]     (writes into images-b-soup/ only)
import math, random, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from soupkit import *  # noqa: F401,F403
import gen_soup_a as A


# ================= A SMALL BOWL OF SOUP (the card picture and the photo-frame sticker; no filters inside) =================
def mini_soup_bowl(cx, cy, s, wisps=True):
    """A small bowl of vegetable soup with chunks. (cx, cy) = the centre of the soup surface, about 250 wide at s = 1.
    Uses no filter references, so it can be pasted into the prep photo frame like the pancakes' mini stack."""
    g = ""
    if wisps:
        for dx, h, o in ((-42, 96, .55), (2, 124, .65), (44, 92, .5)):
            g += stroke(f"M{n(cx + dx * s)},{n(cy - 26 * s)} C{n(cx + (dx - 22) * s)},{n(cy - (26 + h * .4) * s)} "
                        f"{n(cx + (dx + 20) * s)},{n(cy - (26 + h * .7) * s)} {n(cx + (dx - 8) * s)},{n(cy - (26 + h) * s)}",
                        WHITE, 11 * s, f' opacity="{o}"')
    g += E(cx, cy - 4 * s, 124 * s, 40 * s, "#E0D5C1")                                  # rim (back edge)
    g += E(cx, cy - 6 * s, 120 * s, 36 * s, WHITE)
    g += E(cx, cy, 104 * s, 29 * s, BR3_D)                                              # the soup
    g += E(cx, cy - 2 * s, 99 * s, 25 * s, BR3)
    for dx, dy, kind, sc in ((-52, 2, "K", .58), (-14, -6, "P", .52), (26, 4, "Z", .56), (62, -2, "K", .5), (0, 10, "P", .46), (-34, 12, "Z", .46)):
        g += bit(kind, cx + dx * s, cy + dy * s, 40 * s * sc, 700 + int(dx), 0)
    g += E(cx - 40 * s, cy - 12 * s, 30 * s, 7 * s, BR3_L, ' opacity="0.8"')
    g += P(f"M{n(cx - 124 * s)},{n(cy - 4 * s)} C{n(cx - 118 * s)},{n(cy + 56 * s)} {n(cx - 56 * s)},{n(cy + 82 * s)} {n(cx)},{n(cy + 82 * s)} "
           f"C{n(cx + 56 * s)},{n(cy + 82 * s)} {n(cx + 118 * s)},{n(cy + 56 * s)} {n(cx + 124 * s)},{n(cy - 4 * s)} "
           f"L{n(cx + 104 * s)},{n(cy)} A{n(104 * s)},{n(29 * s)} 0 0 1 {n(cx - 104 * s)},{n(cy)}Z", "#F2EAE0")     # the front wall
    g += P(f"M{n(cx - 124 * s)},{n(cy - 4 * s)} A{n(124 * s)},{n(40 * s)} 0 0 0 {n(cx + 124 * s)},{n(cy - 4 * s)} "
           f"L{n(cx + 104 * s)},{n(cy)} A{n(104 * s)},{n(29 * s)} 0 0 1 {n(cx - 104 * s)},{n(cy)}Z", TEAL_L)        # teal rim band
    g += E(cx, cy + 82 * s, 42 * s, 9 * s, "#E0D5C1")                                    # foot
    g += P(f"M{n(cx - 96 * s)},{n(cy + 22 * s)} Q{n(cx - 70 * s)},{n(cy + 62 * s)} {n(cx - 20 * s)},{n(cy + 74 * s)} "
           f"Q{n(cx - 74 * s)},{n(cy + 54 * s)} {n(cx - 88 * s)},{n(cy + 20 * s)}Z", WHITE, ' opacity="0.7"')
    return g


# ================= WATER JUG (360x520; pour spout tip (52,118)) =================
def water_jug():
    p = "wjg-"
    sx, sy = JUG_SPOUT
    rim = (198, 148, 104, 31)                                                             # rim ellipse cx, cy, rx, ry
    body = ("M94,148 C90,300 100,414 124,446 C152,478 244,478 272,446 C296,414 306,300 302,148"
            f" L{rim[0] + rim[2]},{rim[1]}Z")
    L = [G(E(198, 486, 104, 17, SH, ' opacity="0.34"'), p + "bl")]
    L.append(G(stroke("M300,196 C348,196 352,250 348,272 C344,300 322,324 296,330", GLASS_D, 30)
               + stroke("M300,196 C348,196 352,250 348,272 C344,300 322,324 296,330", mix(GLASS, WHITE, .3), 19), p + "cut"))   # handle
    # review fix: the spout read as a blue flag. It is now a clear triangular lip pulled out of the rim.
    spout = f"M100,140 Q74,126 {sx},{sy} Q62,144 78,164 Q96,170 106,166Z"
    L.append(G(P(body, GLASS) + P(spout, GLASS) + E(*rim, GLASS), p + "cut"))
    L.append(E(rim[0], rim[1], rim[2], rim[3], mix(GLASS_D, WHITE, .25)))                 # the opening seen from above
    L.append(E(rim[0], rim[1] + 3, rim[2] - 13, rim[3] - 7, mix(GLASS_D, SH, .18)))
    # the water inside, clipped to the jug
    L.append(f'<clipPath id="{p}b"><path d="{body}"/></clipPath>')
    wat = P("M92,214 Q198,252 306,214 L302,410 C298,438 272,458 198,458 C124,458 100,438 96,410Z", WATER_D)
    wat += P("M96,222 Q198,258 302,222 L298,406 C294,432 268,450 198,450 C128,450 104,432 100,406Z", WATER)
    wat += P("M92,214 Q198,252 306,214 L305,232 Q198,270 93,232Z", WATER_L, ' opacity="0.9"')    # the water surface
    wat += P("M120,268 Q132,360 154,430 Q126,356 112,270Z", WHITE, ' opacity="0.5"')
    L.append(G(G(wat, p + "sh"), None, f' clip-path="url(#{p}b)"'))
    L.append(P("M258,190 Q276,300 262,420 Q286,300 274,188Z", WHITE, ' opacity="0.45"'))          # glass highlights
    L.append(P("M112,186 Q104,290 116,392 Q96,292 104,184Z", WHITE, ' opacity="0.35"'))
    L.append(P(f"M{sx},{sy} Q{sx + 22},{sy + 8} 104,146 Q{sx + 26},{sy + 22} 84,160 Q{sx + 4},{sy + 12} {sx},{sy}Z", mix(GLASS, WHITE, .55)))   # the lip
    L.append(P(f"M{sx + 6},{sy + 4} Q{sx + 30},{sy + 14} 98,150 Q{sx + 30},{sy + 20} {sx + 8},{sy + 12}Z", WATER, ' opacity="0.85"'))   # water in the lip
    L.append(G(P(f"M{sx + 10},{sy + 22} Q{sx + 22},{sy + 28} {sx + 19},{sy + 44} Q{sx + 16},{sy + 62} {sx + 8},{sy + 63} "
                 f"Q{sx},{sy + 60} {sx + 2},{sy + 44} Q{sx - 2},{sy + 28} {sx + 10},{sy + 22}Z", WATER)
               + C(sx + 8, sy + 53, 3, WHITE, ' opacity="0.85"'), p + "sh"))                       # a drop hanging under the spout
    L.append(E(198, 452, 84, 17, GLASS_D, ' opacity="0.7"') + E(198, 450, 76, 13, mix(GLASS, WHITE, .35)))  # base
    return doc(p, JUG[0], JUG[1], "".join(L), material="smooth", seed=681, sh=(4, 3.5, .33), blur=8)


# ================= SOUP BOWL (560x360, one frame for empty and full) =================
BW, BH = SBOWL
BRIM = (280, 150, 240, 66)
BBODY = "M40,150 C40,244 142,306 280,306 C418,306 520,244 520,150Z"
BOPEN = (SBOWL_IC[0], SBOWL_IC[1], SBOWL_IRX, SBOWL_IRY)


def soup_bowl(full):
    p = "sbf-" if full else "sbe-"
    L = [G(E(280, 322, 196, 18, SH, ' opacity="0.34"'), p + "bl")]
    L.append(G(P(wob(280, 312, 96, 15, .02, 3), "#D9CDB8"), p + "sh"))                     # foot
    L.append(G(P(BBODY, "#E6DCCB") + E(*BRIM, "#E6DCCB"), p + "cut"))
    L.append(E(BRIM[0], BRIM[1] - 2, BRIM[2] - 5, BRIM[3] - 4, WHITE))
    grad = (f'<linearGradient id="{p}in" x1="0" y1="{BOPEN[1] - BOPEN[3]}" x2="0" y2="{BOPEN[1] + BOPEN[3]}" gradientUnits="userSpaceOnUse">'
            f'<stop offset="0" stop-color="#DCD2C2"/><stop offset="0.55" stop-color="#EFE7DA"/><stop offset="1" stop-color="#FBF6EC"/></linearGradient>')
    L.append(E(*BOPEN, f"url(#{p}in)"))
    if full:
        r = random.Random(5)
        cy, rx, ry = 166, 200, 50
        soup = P(wob(BOPEN[0], cy + 3, rx, ry, .015, 3, 28), BR3_D)
        soup += P(wob(BOPEN[0] - 4, cy, rx * .97, ry * .93, .018, 4, 28), BR3)
        soup += P(wob(BOPEN[0] - 26, cy - ry * .34, rx * .55, ry * .4, .04, 5, 20), BR3_L, ' opacity="0.65"')
        bits = []
        for i in range(11):
            a, rr = r.uniform(0, 6.283), math.sqrt(r.random())
            x = BOPEN[0] + math.cos(a) * rx * .74 * rr
            y = cy + 4 + math.sin(a) * ry * .66 * rr
            kind = "PKZPKOZP"[i % 8]
            bits.append((y, bit(kind, x, y, {"P": 30, "K": 23, "Z": 24, "O": 15}[kind] * r.uniform(.92, 1.08), r.randint(0, 999),
                                r.uniform(-30, 30) if kind == "P" else 0)))
        bits.sort(key=lambda q: q[0])
        soup += "".join(u for _, u in bits)
        for i in range(6):
            a = r.uniform(0, 6.283); rr = math.sqrt(r.random())
            soup += E(BOPEN[0] + math.cos(a) * rx * .7 * rr, cy + math.sin(a) * ry * .6 * rr, r.uniform(5, 9), r.uniform(3.5, 6), BR3_L, ' opacity="0.85"')
        soup += P(f"M{BOPEN[0] - rx * .7},{n(cy - ry * .2)} Q{BOPEN[0] - rx * .2},{n(cy - ry * .66)} {BOPEN[0] + rx * .2},{n(cy - ry * .5)} "
                  f"Q{BOPEN[0] - rx * .2},{n(cy - ry * .34)} {BOPEN[0] - rx * .64},{n(cy - ry * .04)}Z", WHITE, ' opacity="0.45"')
        clip = f'<clipPath id="{p}o"><ellipse cx="{BOPEN[0]}" cy="{BOPEN[1]}" rx="{BOPEN[2] - 3}" ry="{BOPEN[3] - 2}"/></clipPath>'
        L.append(clip + G(G(soup, p + "sh"), None, f' clip-path="url(#{p}o)"'))
        L.append(steam(p, BOPEN[0], cy - ry * .6, .62, 3, seed=7))
    L.append(P(f"M40,150 A{BRIM[2]},{BRIM[3]} 0 0 0 520,150 L{BOPEN[0] + BOPEN[2]},{BOPEN[1]} "
               f"A{BOPEN[2]},{BOPEN[3]} 0 0 1 {BOPEN[0] - BOPEN[2]},{BOPEN[1]}Z", TEAL_L))                 # teal rim band
    L.append(P("M92,182 Q280,236 468,182 Q280,222 92,182Z", WHITE, ' opacity="0.5"'))                      # lip shine
    L.append(P("M62,196 Q86,258 164,292 Q96,256 76,192Z", WHITE, ' opacity="0.4"'))
    return doc(p, BW, BH, "".join(L), material="smooth", seed=691 + full, sh=(4, 3.5, .3), blur=7, extra_defs=grad)


# ================= SOUP PORTION (360x420: a full ladle; anchor (150,250) = the centre of the soup) =================
def soup_portion():
    """Review fix 7: the first version was a wide shallow cup with a nearly horizontal handle and read as a small frying pan.
    The frame is taller now, the cup deep and narrow, and the handle rises steeply the way a ladle's does."""
    p = "spo-"
    ax, ay = PORTION_AT
    rim = (ax, 236, 98, 34)
    cup = (f"M{rim[0] - rim[2]},{rim[1]} C{rim[0] - rim[2] - 14},{rim[1] + 118} {rim[0] - 70},{rim[1] + 152} {rim[0]},{rim[1] + 152} "
           f"C{rim[0] + 70},{rim[1] + 152} {rim[0] + rim[2] + 14},{rim[1] + 118} {rim[0] + rim[2]},{rim[1]}Z")
    L = [G(E(ax + 6, 400, 86, 11, SH, ' opacity="0.3"'), p + "bl")]
    stem = f"M{rim[0] + 74},{rim[1] - 24} C{rim[0] + 134},{rim[1] - 74} {rim[0] + 156},{rim[1] - 130} {rim[0] + 164},{rim[1] - 200}"
    L.append(G(stroke(stem, STEEL_D, 28) + stroke(stem, STEEL, 19) + stroke(stem, STEEL_L, 5, ' opacity="0.8"'), p + "cut"))
    grip = f"M{rim[0] + 160},{rim[1] - 150} C{rim[0] + 165},{rim[1] - 176} {rim[0] + 166},{rim[1] - 190} {rim[0] + 166},{rim[1] - 206}"
    L.append(G(stroke(grip, TEAL_D, 42) + stroke(grip, TEAL, 33) + stroke(grip, TEAL_L, 9, ' opacity="0.75"')
               + C(rim[0] + 166, rim[1] - 204, 9, TEAL_D), p + "sh"))
    L.append(G(P(cup, STEEL) + E(*rim, STEEL), p + "cut"))
    L.append(f'<clipPath id="{p}c"><path d="{cup}"/></clipPath>'
             + G(G(E(rim[0] + 72, rim[1] + 82, 88, 96, STEEL_D, ' opacity="0.8"') + E(rim[0] - 60, rim[1] + 52, 26, 60, STEEL_L, ' opacity="0.9"'), p + "bl"),
                 None, f' clip-path="url(#{p}c)"'))
    L.append(E(rim[0], rim[1], rim[2] - 6, rim[3] - 4, STEEL_D))                                    # the inner back wall
    # the soup in the cup: its surface is centred on the anchor (the point that follows the finger)
    r = random.Random(9)
    sx_, sy_, srx, sry = ax, ay, 86, 26
    soup = P(wob(sx_, sy_ + 3, srx, sry, .015, 3, 26), BR3_D)
    soup += P(wob(sx_ - 3, sy_, srx * .96, sry * .92, .018, 4, 26), BR3)
    bits = []
    for i in range(7):
        a, rr = r.uniform(0, 6.283), math.sqrt(r.random())
        x, y = sx_ + math.cos(a) * srx * .68 * rr, sy_ + 2 + math.sin(a) * sry * .6 * rr
        kind = "PKZPKZO"[i % 7]
        bits.append((y, bit(kind, x, y, {"P": 27, "K": 21, "Z": 22, "O": 14}[kind] * r.uniform(.92, 1.08), r.randint(0, 999),
                            r.uniform(-30, 30) if kind == "P" else 0)))
    bits.sort(key=lambda q: q[0])
    soup += "".join(u for _, u in bits)
    soup += E(sx_ - 34, sy_ - sry * .5, 28, 7, BR3_L, ' opacity="0.85"')
    soup += P(f"M{n(sx_ - srx * .66)},{n(sy_ - sry * .2)} Q{n(sx_ - srx * .2)},{n(sy_ - sry * .7)} {n(sx_ + srx * .16)},{n(sy_ - sry * .52)} "
              f"Q{n(sx_ - srx * .2)},{n(sy_ - sry * .3)} {n(sx_ - srx * .6)},{n(sy_ - sry * .02)}Z", WHITE, ' opacity="0.5"')
    L.append(G(soup, p + "sh"))
    L.append(P(f"M{rim[0] - rim[2]},{rim[1]} A{rim[2]},{rim[3]} 0 0 0 {rim[0] + rim[2]},{rim[1]}", "none",
               f' stroke="{STEEL_L}" stroke-width="7"'))                                             # the front lip
    L.append(steam(p, ax, sy_ - sry * 1.4, .62, 3, seed=11))
    return doc(p, PORTION[0], PORTION[1], "".join(L), material="smooth", seed=701, sh=(4, 3.5, .33), blur=7)


# ================= RECIPE CARD (400x520; the card-pancakes / card-cookies layout) =================
def mini_potato(cx, cy, s):
    """The ingredient potato: unpeeled, so it reads as a potato at card size (review fix: the pale one read as nothing)."""
    g = P(wob(cx, cy, 44 * s, 31 * s, .07, 3, 18, -10), PSK_D) + P(wob(cx - 1, cy - 4, 41 * s, 28 * s, .07, 4, 18, -10), PSK)
    g += P(wob(cx - 12 * s, cy - 11 * s, 20 * s, 8 * s, .1, 5, 10, -16), PSK_L, ' opacity="0.9"')
    for dx, dy in ((-18, 4), (6, 10), (16, -8), (-6, -10)):
        g += E(cx + dx * s, cy + dy * s, 4.2 * s, 2.8 * s, PSK_EYE, ' opacity="0.85"')
    return g


def mini_carrot(cx, cy, s):
    g = P(f"M{n(cx - 12 * s)},{n(cy + 40 * s)} L{n(cx - 20 * s)},{n(cy - 28 * s)} Q{n(cx)},{n(cy - 36 * s)} {n(cx + 20 * s)},{n(cy - 28 * s)} "
          f"L{n(cx + 12 * s)},{n(cy + 40 * s)} Q{n(cx)},{n(cy + 48 * s)} {n(cx - 12 * s)},{n(cy + 40 * s)}Z", CAR_D)
    g += P(f"M{n(cx - 9 * s)},{n(cy + 36 * s)} L{n(cx - 16 * s)},{n(cy - 26 * s)} Q{n(cx)},{n(cy - 32 * s)} {n(cx + 16 * s)},{n(cy - 26 * s)} "
           f"L{n(cx + 9 * s)},{n(cy + 36 * s)} Q{n(cx)},{n(cy + 42 * s)} {n(cx - 9 * s)},{n(cy + 36 * s)}Z", CAR)
    g += stroke(f"M{n(cx - 6 * s)},{n(cy - 20 * s)} L{n(cx - 4 * s)},{n(cy + 28 * s)}", CAR_L, 4 * s, ' opacity="0.8"')
    for dx, rot in ((-16, -40), (0, 0), (16, 40)):
        g += P(wob(cx + dx * s, cy - 42 * s, 15 * s, 8 * s, .12, 7 + dx, 12, rot), GREEN)
    return g


def mini_zucchini(cx, cy, s):
    g = P(wob(cx, cy, 46 * s, 20 * s, .04, 3, 20, -14), ZUC_D) + P(wob(cx - 1, cy - 3, 43 * s, 17 * s, .04, 4, 20, -14), ZUC)
    g += P(wob(cx - 6 * s, cy - 6 * s, 26 * s, 5 * s, .1, 5, 12, -14), ZUC_L, ' opacity="0.8"')
    g += P(wob(cx + 40 * s, cy - 10 * s, 7 * s, 8 * s, .1, 6, 10), mix(ZUC_D, "#6A5A24", .45))
    return g


def card_soup():
    p = "crs-"
    L = [G(P(gen_kitchen.wrect(10, 10, 380, 500, 36, 2.2, 3, step=18), CREAM), p + "cut")]
    pat = (f'<pattern id="{p}gh" width="40" height="40" patternUnits="userSpaceOnUse">'
           f'<rect width="40" height="40" fill="#FCEDE2"/><rect width="20" height="40" fill="{CORAL_L}" opacity="0.26"/>'
           f'<rect width="40" height="20" fill="{CORAL_L}" opacity="0.26"/></pattern>')
    L.append(G(P(gen_kitchen.wrect(34, 34, 332, 332, 26, 1.2, 4), f"url(#{p}gh)"), p + "sh"))
    L.append(G(mini_soup_bowl(200, 214, 1.06), p + "sh"))
    L.append(G(mini_carrot(72, 318, .62) + mini_zucchini(322, 322, .62) + mini_potato(330, 84, .66), p + "sh"))
    L.append(G(P(gen_kitchen.wrect(130, -4, 140, 40, 3, 1.4, 6), MUSTARD, ' opacity="0.85" transform="rotate(-4 200 15)"')
               + "".join(C(146 + i * 18, 16, 4, WHITE, ' opacity="0.7" transform="rotate(-4 200 15)"') for i in range(7)), p + "sh"))
    # ingredient row: potato, carrot, zucchini
    L.append(G("".join(P(wob(x, 440, 50, 44, .04, 7 + i, 20), WHITE) for i, x in enumerate((92, 200, 308))), p + "sh"))
    L.append(G(mini_potato(92, 440, .95), p + "sh") + G(mini_carrot(200, 438, .85), p + "sh") + G(mini_zucchini(308, 440, .9), p + "sh"))
    d = std_defs(p, "rough", seed=59, sh=(4, 3.5, .32), cut={"rim": 3, "rough": 7, "freq": .12}) + pat
    return svg(CARD[0], CARD[1], d, G("".join(L), p + "gr"))


# ================= PHOTO FRAME (700x780, identical to images-b-prep photo-frame, soup sticker) =================
def pizza_sticker():
    """The exact markup of the pizza-slice sticker in gen_prep_b.photo_frame (swapped out, like the other recipes' frames)."""
    return (P("M410,726 L380,668 Q410,654 440,668Z", SAUCE) + P("M410,716 L388,672 Q410,662 432,672Z", CHEESE)
            + P(wrect(376, 656, 68, 16, 8, .3, 5), CRUST) + C(404, 686, 5, RED) + C(416, 700, 4, OLIVE))


def photo_frame_soup():
    s = PB.photo_frame()
    old = pizza_sticker()
    assert s.count(old) == 1, "pizza sticker not found in the prep frame code"
    return s.replace(old, mini_soup_bowl(410, 692, .5, wisps=False)).replace("pf-", "pfo-")


ITEMS = {"water-jug": water_jug, "soup-bowl-empty": lambda: soup_bowl(False), "soup-bowl-full": lambda: soup_bowl(True),
         "soup-portion": soup_portion, "card-soup": card_soup, "photo-frame-soup": photo_frame_soup}

if __name__ == "__main__":
    run(ITEMS)
