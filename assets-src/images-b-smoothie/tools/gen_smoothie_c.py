# images-b-smoothie, part C: card-smoothie, colander-fruit, milk-carton, milk-drop, glass-empty / glass-full, photo-frame-smoothie.
# Run: python tools/gen_smoothie_c.py [names...]   (writes into images-b-smoothie/ only)
import sys, os
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import math, random, re
from smoothiekit import *  # noqa: F401,F403
import gen_salad_b as SB
import gen_salad_c as SC
import gen_smoothie_a as SA

# ================= GLASS (320x440; empty and full share the frame) =================
GRIM_C, GRIM_RX, GRIM_RY = (160, 72), 100, 18       # rim ellipse
G_OUT = "M60,72 L84,392 Q86,410 106,410 L214,410 Q234,410 236,392 L260,72 A100,18 0 0 1 60,72Z"
G_IN_TOP, G_IN_BOT = (72, 248, 80), (92, 228, 370)     # inside walls (x left, x right, y)
FILL_TOP = 98                                          # liquid surface of glass-full
STRAW_TOP = (262, 14)


def g_half(y):
    t = (G_IN_BOT[2] - y) / (G_IN_BOT[2] - G_IN_TOP[2])
    return 68 + t * (88 - 68)


def glass_layers(p, full, straw=True, flat=False):
    """Layers of the glass (in 320x440 units). flat=True: no filters (for stickers / the card)."""
    F = (lambda s, f: s) if flat else G
    L = []
    L.append(P(G_OUT, GLASS, ' opacity="0.55"'))
    if full:
        hw = g_half(FILL_TOP)
        liq = f"M{n(160 - hw)},{FILL_TOP} L{G_IN_BOT[0]},{G_IN_BOT[2] - 8} Q{G_IN_BOT[0]},{G_IN_BOT[2]} {G_IN_BOT[0] + 12},{G_IN_BOT[2]} L{G_IN_BOT[1] - 12},{G_IN_BOT[2]} Q{G_IN_BOT[1]},{G_IN_BOT[2]} {G_IN_BOT[1]},{G_IN_BOT[2] - 8} L{n(160 + hw)},{FILL_TOP}Z"
        if straw:   # the part of the straw inside the drink shows faintly through it
            L.append(stroke("M196,360 L226,100", mix(PINK_D, SMO, .5), 13))
        L.append(P(liq, SMO))
        L.append(P(f"M{n(160 - hw + 6)},{FILL_TOP + 20} L{G_IN_BOT[0] + 6},{G_IN_BOT[2] - 16} L{G_IN_BOT[0] + 30},{G_IN_BOT[2] - 16} L{n(160 - hw + 36)},{FILL_TOP + 20}Z", SMO_D, ' opacity="0.35"'))
        r = random.Random(3)
        L.append("".join(C(160 + r.uniform(-.8, .8) * g_half(y), y, r.uniform(3, 6), SMO_L, ' opacity="0.8"') for y in [r.uniform(140, 350) for _ in range(12)]))
        foam = "".join(C(160 + math.cos(a) * hw * .88, FILL_TOP + math.sin(a) * hw * .14, 9 + (i % 3) * 2, SMO_F) for i, a in enumerate([i / 16 * 2 * math.pi for i in range(16)]))
        L.append(F(E(160, FILL_TOP, hw, hw * .16, SMO_L) + foam + E(160, FILL_TOP - 1, hw * .78, hw * .1, mix(SMO_F, WHITE, .4)), p + "sh"))
        if straw:
            st = f'<clipPath id="{p}st"><path d="M226,100 L{STRAW_TOP[0]},{STRAW_TOP[1]} L{STRAW_TOP[0] + 14},{STRAW_TOP[1] + 6} L240,104Z"/></clipPath>'
            body = stroke(f"M226,104 L{STRAW_TOP[0] + 6},{STRAW_TOP[1] + 4}", PINK_D, 16) + stroke(f"M226,104 L{STRAW_TOP[0] + 6},{STRAW_TOP[1] + 4}", WHITE, 12)
            stripes = "".join(P(f"M200,{y} L300,{y - 40} L300,{y - 26} L200,{y + 14}Z", PINK_D) for y in range(40, 160, 28))
            L.append(F(body + st + G(stripes, None, f' clip-path="url(#{p}st)"'), p + "sh"))
    # front glass: side walls, highlights, bottom, rim
    L.append(P("M60,72 L84,392 L96,388 L74,78Z", GLASS_D, ' opacity="0.8"') + P("M260,72 L236,392 L224,388 L246,78Z", GLASS_D, ' opacity="0.8"'))
    L.append(P("M92,372 L228,372 L234,392 Q234,404 214,404 L106,404 Q86,404 86,392Z", GLASS_D, ' opacity="0.75"'))
    L.append(P("M86,110 L104,340 L114,340 L98,110Z", WHITE, ' opacity="0.6"') + P("M226,120 L214,300 L220,300 L234,120Z", WHITE, ' opacity="0.4"'))
    L.append(F(stroke(G_OUT, GLASS_D, 5), p + "cut"))
    L.append(P("M60,72 A100,18 0 0 0 260,72 A100,18 0 0 0 60,72Z M68,74 A92,13 0 0 1 252,74 A92,13 0 0 1 68,74Z", mix(GLASS, GLASS_D, .5), ' fill-rule="evenodd"'))
    L.append(P("M90,80 Q160,96 230,80", "none", f' stroke="{WHITE}" stroke-width="4" opacity="0.8"'))
    return L


def glass(full):
    p = "gf-" if full else "ge-"
    L = [ground_shadow(160, 416, 96, 10, p, .34)] + glass_layers(p, full)
    return gen_items.doc(p, 320, 440, "".join(L), seed=661 + full, sh=(3, 2.5, .3))


def mini_glass(p, x, y, s, straw=True):
    """The full glass, flat, with its rim centre at (x, y) and scale s."""
    return f'<g transform="translate({n(x)} {n(y)}) scale({s}) translate(-160 -72)">' + "".join(glass_layers(p, True, straw, flat=True)) + "</g>"


# ================= MILK CARTON (320x560) =================
CARTON_SPOUT = (38, 118)      # the open pouring corner (milk leaves here)


def milk_carton():
    p = "mc-"
    L = [ground_shadow(172, 528, 124, 12, p, .36)]
    side = P("M236,200 L284,184 L284,500 L236,520Z", mix(CREAM2, "#B9A48A", .25))
    front = P(wrect(60, 196, 180, 326, 8, .6, 3), WHITE)
    roof = P("M60,200 L236,200 L230,144 L66,144Z", CREAM) + P("M236,200 L284,184 L262,138 L230,144Z", mix(CREAM2, "#B9A48A", .15))
    fin = P("M64,104 L234,104 L234,146 L64,146Z", CREAM2) + P("M234,104 L262,110 L262,140 L234,146Z", mix(CREAM2, "#B9A48A", .3))
    spout = P(f"M64,104 L{CARTON_SPOUT[0] - 6},{CARTON_SPOUT[1] - 4} L60,152 L84,128Z", CREAM2) + E(CARTON_SPOUT[0] + 10, CARTON_SPOUT[1] + 2, 12, 16, mix(TEAL_D, "#1E3E42", .4), ' transform="rotate(-30 48 120)"')
    L.append(G(side + front + roof + fin + spout, p + "cut"))
    # blue lower band with a white milk wave, cow spots on the white top, a glass of milk and a heart
    band = f'<clipPath id="{p}f"><path d="{wrect(60, 196, 180, 326, 8, .6, 3)}"/></clipPath>'
    band += G(P("M50,360 Q100,330 150,356 Q200,382 250,350 L250,540 L50,540Z", TEAL) + P("M50,380 Q100,352 150,378 Q200,404 250,372 L250,390 Q200,420 150,394 Q100,370 50,398Z", TEAL_L, ' opacity="0.8"'), None, f' clip-path="url(#{p}f)"')
    band += P("M236,340 L284,326 L284,500 L236,520Z", TEAL_D)
    L.append(G(band, p + "sh"))
    spots = P(wob(96, 236, 22, 16, .12, 3, 12, 20), "#4A3528") + P(wob(208, 262, 16, 22, .12, 4, 12, -10), "#4A3528") + P(wob(150, 318, 12, 9, .15, 5, 10), "#4A3528")
    L.append(spots)
    cup = P("M118,410 L128,488 Q130,496 138,496 L166,496 Q174,496 176,488 L186,410Z", GLASS_D) + P("M122,420 L130,486 L174,486 L182,420Z", WHITE) + E(152, 420, 30, 6, MILK_L)
    L.append(G(cup, p + "sh"))
    L.append(G(heart(212, 440, .7, RED), p + "sh"))
    L.append(P("M72,214 L78,300 L86,300 L82,214Z", WHITE, ' opacity="0.8"'))
    return gen_items.doc(p, 320, 560, "".join(L), seed=671, sh=(4, 3.5, .33))


# ================= COLANDER WITH FRUIT (820x560, the salad colander frame) =================
_EMB = [0]


def embed_fruit(fn, old, new, x, y, s, rot=0):
    """salad embed_veg (whole drawing without its ground shadow) + a unique id for the fruit's own body clip path."""
    _EMB[0] += 1
    g = SB.embed_veg(fn, old, new, x, y, s, rot)
    return g.replace(f'id="{new}b"', f'id="{new}b{_EMB[0]}"').replace(f"url(#{new}b)", f"url(#{new}b{_EMB[0]})")


def mango_grad(p):
    return (f'<linearGradient id="{p}sk" x1="90" y1="330" x2="490" y2="150" gradientUnits="userSpaceOnUse">'
            f'<stop offset="0" stop-color="{MAN_R}"/><stop offset="0.35" stop-color="{MAN_O}"/><stop offset="0.68" stop-color="{MAN_Y}"/>'
            f'<stop offset="1" stop-color="{MAN_G}"/></linearGradient>')


def colander_fruit():
    p = "cf-"
    CL, CL_D, CL_L = SB.CL, SB.CL_D, SB.CL_L
    L = [G(E(410, 520, 330, 20, SH, ' opacity="0.34"'), p + "bl")]
    L.append(G(P(wrect(300, 456, 220, 44, 18, .8, 3), CL_D), p + "sh"))
    for x in (38, 782):
        L.append(G(P(wob(x + (-16 if x < 400 else 16), 196, 44, 22, .03, x, 16) + " " + wob(x + (-16 if x < 400 else 16), 196, 24, 9, .04, x + 1, 12), CL_D, ' fill-rule="evenodd"'), p + "cut"))
    L.append(G(P(SB.CL_BODY, CL) + E(*SB.CL_RC, SB.CL_RX, SB.CL_RY, CL_D), p + "cut"))
    L.append(E(*SB.CL_RC, SB.CL_RX, SB.CL_RY, CL_L))
    L.append(E(*SB.CL_OC, SB.CL_OX, SB.CL_OY, mix(CL_D, "#5A1E10", .3)))
    holes = "".join(C(410 + math.cos(a) * rr * SB.CL_OX * .9, 206 + math.sin(a) * rr * SB.CL_OY * .8, 6, "#3A1A10", ' opacity="0.8"')
                    for rr in (.35, .6, .85) for a in [i / int(10 + rr * 14) * 2 * math.pi for i in range(int(10 + rr * 14))])
    L.append(holes)
    # the fruit, back to front: mango and kiwi at the back, the banana across, strawberries in front
    fr = embed_fruit(SA.fruit_mango_whole, "fm-", p, 290, 180, .5, -8)
    fr += embed_fruit(lambda: SA.fruit_kiwi_whole(14), "fk-", p, 540, 186, .46, 10)
    fr += embed_fruit(SA.fruit_banana_whole, "fb-", p, 420, 196, .66, -6)
    sdef = f'<g id="{p}sb">' + embed_fruit(SA.fruit_strawberry_whole, "fs-", p, 0, 0, 1) + "</g>"      # one strawberry, used three times
    fr += "".join(f'<use href="#{p}sb" transform="translate({x} {y}) rotate({a}) scale({s})"/>' for x, y, s, a in ((236, 226, .32, 24), (590, 224, .32, -156), (410, 246, .3, 70)))
    L.append(fr)
    r = random.Random(6)
    L.append("".join(P(wob(x, y, 7, 9, .1, i, 10), SB.WATER_L, ' opacity="0.9"') + C(x - 2, y - 3, 2.5, WHITE)
                     for i, (x, y) in enumerate([(r.uniform(180, 640), r.uniform(100, 240)) for _ in range(16)])))
    L.append(G(P(SB.CL_FRONT, CL), p + "cut"))
    L.append(f'<clipPath id="{p}f"><path d="{SB.CL_FRONT}"/></clipPath>')
    fro = P("M50,300 C100,420 220,464 410,464 C600,464 720,420 770,300 C720,400 600,440 410,440 C220,440 100,400 50,300Z", CL_D, ' opacity="0.7"')
    for row, y in enumerate((270, 318, 364, 406)):
        w = 350 - (y - 240) * .9
        cnt = int(w / 30)
        for i in range(-cnt, cnt + 1):
            x = 410 + i * 30 + (15 if row % 2 else 0)
            yy = y + 40 * (1 - ((x - 410) / 380) ** 2)
            fro += E(x, yy, 7, 5.5, "#4A1E12", ' opacity="0.85"') + E(x - 1, yy - 2.5, 5, 2, CL_L, ' opacity="0.5"')
    fro += P("M70,240 Q86,340 170,414 Q110,340 104,248Z", WHITE, ' opacity="0.35"')
    L.append(G(fro, None, f' clip-path="url(#{p}f)"'))
    L.append(P(SB.CL_FRONT_RIM, CL_L))
    L.append(P("M110,244 Q410,300 710,244 Q410,290 110,244Z", WHITE, ' opacity="0.45"'))
    out = gen_items.doc(p, 820, 560, "".join(L), seed=681, sh=(4, 3.5, .33), extra_defs=mango_grad(p) + sdef)
    return SB._round(out)


# ================= RECIPE CARD (400x520, same layout as card-pizza / card-salad / card-cookies) =================
def card_smoothie():
    p = "crm-"
    L = [G(P(gen_kitchen.wrect(10, 10, 380, 500, 36, 2.2, 3, step=18), CREAM), p + "cut")]
    pat = (f'<pattern id="{p}gh" width="40" height="40" patternUnits="userSpaceOnUse">'
           f'<rect width="40" height="40" fill="#FFEBDD"/><rect width="20" height="40" fill="{CORAL_L}" opacity="0.28"/>'
           f'<rect width="40" height="20" fill="{CORAL_L}" opacity="0.28"/></pattern>')
    L.append(G(P(gen_kitchen.wrect(34, 34, 332, 332, 26, 1.2, 4), f"url(#{p}gh)"), p + "sh"))
    # two smoothie glasses with straws, fruit slices around them
    L.append(G(E(200, 340, 140, 12, SH, ' opacity="0.25"'), p + "bl"))
    L.append(G(mini_glass(p + "a", 146, 128, .66) + mini_glass(p + "b", 258, 150, .6), p + "sh"))
    defs = "".join(f'<g id="{p}{f[0]}" transform="translate(-70 -70)">{unfilter(SA.PIECES[f](p)[0])}</g>' for f in SA.FRUITS)
    sl = "".join(f'<use href="#{p}{f[0]}" transform="translate({x} {y}) scale({s}) rotate({a})"/>'
                 for f, x, y, s, a in (("strawberry", 82, 300, .5, -20), ("kiwi", 330, 300, .52, 0), ("banana", 318, 84, .42, 0), ("mango", 76, 90, .44, 30)))
    L.append(G(sl, p + "sh"))
    L.append(G(P(gen_kitchen.wrect(130, -4, 140, 40, 3, 1.4, 6), MUSTARD, ' opacity="0.85" transform="rotate(-4 200 15)"')
               + "".join(C(146 + i * 18, 16, 4, WHITE, ' opacity="0.7" transform="rotate(-4 200 15)"') for i in range(7)), p + "sh"))
    # ingredient row: banana, strawberry, milk
    L.append(G("".join(P(wob(x, 440, 50, 44, .04, 7 + i, 20), WHITE) for i, x in enumerate((92, 200, 308))), p + "sh"))
    ban = P("M58,432 Q92,474 128,428 Q132,420 126,418 Q96,452 64,424 Q56,424 58,432Z", BAN_D) + P("M62,430 Q92,466 124,424 Q96,446 66,424Z", BAN) + stroke("M126,420 L134,408", mix(BAN_D, "#7A6A20", .35), 5) + C(60, 428, 4, BAN_TIP)
    stw = P("M200,470 Q172,440 180,420 Q200,410 220,420 Q228,440 200,470Z", STR_D) + P("M200,464 Q178,440 184,424 Q200,416 216,424 Q222,440 200,464Z", STR)
    stw += "".join(E(x, y, 1.8, 2.6, STR_SEED) for x, y in ((192, 432), (208, 432), (200, 444), (190, 448), (210, 448), (200, 456)))
    stw += P("M184,420 L192,408 L200,416 L208,408 L216,420 Q200,426 184,420Z", LEAF_D) + P("M188,418 L194,410 L200,418 L206,410 L212,418Z", LEAF)
    mk = P("M290,420 L290,476 L326,476 L326,420 L318,404 L298,404Z", WHITE) + P("M290,420 L326,420 L318,404 L298,404Z", CREAM2) + P("M290,446 Q308,438 326,446 L326,476 L290,476Z", TEAL) + P("M296,400 L320,400 L320,408 L296,408Z", CREAM2)
    L.append(G(ban, p + "sh") + G(stw, p + "sh") + G(stroke("M290,420 L290,476 L326,476 L326,420 L318,404 L298,404Z", GLASS_D, 3) + mk, p + "sh"))
    d = std_defs(p, "rough", seed=55, sh=(4, 3.5, .32), cut={"rim": 3, "rough": 7, "freq": .12}) + pat + defs
    return svg(400, 520, d, G("".join(L), p + "gr"))


# ================= PHOTO FRAME (700x780, identical to images-b-prep photo-frame, smoothie sticker) =================
def pizza_sticker():
    """The exact markup of the pizza-slice sticker in gen_prep_b.photo_frame (swapped out, like photo-frame-salad / -cookies)."""
    return (P("M410,726 L380,668 Q410,654 440,668Z", SAUCE) + P("M410,716 L388,672 Q410,662 432,672Z", CHEESE)
            + P(wrect(376, 656, 68, 16, 8, .3, 5), CRUST) + C(404, 686, 5, RED) + C(416, 700, 4, OLIVE))


def smoothie_sticker():
    """A small pink smoothie glass with a striped straw, the size of the other stickers on the band."""
    return mini_glass("pfm-g", 408, 654, .26)          # review fix: 0.2 was too small to read beside the heart and star


def photo_frame_smoothie():
    s = PB.photo_frame()
    old = pizza_sticker()
    assert s.count(old) == 1, "pizza sticker not found in the prep frame code"
    return s.replace(old, smoothie_sticker()).replace("pf-", "pfm-")


ITEMS = {"card-smoothie": card_smoothie, "colander-fruit": colander_fruit, "milk-carton": milk_carton,
         "milk-drop": lambda: SC.drop("md-", MILK_D, WHITE, MILK_L, 691),
         "glass-empty": lambda: glass(False), "glass-full": lambda: glass(True), "photo-frame-smoothie": photo_frame_smoothie}

if __name__ == "__main__":
    run(ITEMS)
