# images-b-pancakes, part B: the big plate with the stack (plate-big), the syrup bottle, the four toppings (syrup-blob, berry,
# banana-coin, butter-pat), the recipe card and the photo frame.
# Run: python tools/gen_pancakes_b.py [names...]   (writes into images-b-pancakes/ only)
import math, random, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pancakekit import *  # noqa: F401,F403
import gen_cookies_a as CA

STACK = [(-4, 42), (5, 28), (-3, 14)]      # the lower pancakes' offsets under the top one (plate-big), bottom first (review fix: deeper steps)


# ================= PLATE-BIG (720x720 = dough-flat frame; top pancake r 290 centred (360,360); all inside r 350) =================
def plate_big():
    p = "plb-"
    cx, cy = PLATE_C
    L = [G(C(cx + 4, cy + 8, PLATE_R, SH, ' opacity="0.3"'), p + "bl")]
    L.append(G(C(cx, cy, PLATE_R, "#E6DCCB"), p + "cut"))
    L.append(C(cx - 1, cy - 2, PLATE_R - 6, WHITE))
    L.append(P(ring_d(cx, cy, PLATE_R - 14, PLATE_R - 30), TEAL_L, ' fill-rule="evenodd" opacity="0.75"'))
    L.append("".join(C(cx + math.cos(i / 36 * 6.2832) * (PLATE_R - 22), cy + math.sin(i / 36 * 6.2832) * (PLATE_R - 22), 3.2, WHITE) for i in range(36)))
    L.append(C(cx, cy, PLATE_R - 40, "#F4EEE4"))
    st = ""
    for dx, dy in STACK:                                                   # the lower pancakes: only their golden sides peek out
        st += G(C(cx + dx, cy + dy + 7, TOP_R, GOLD_DD), p + "bl") if dy == STACK[0][1] else ""
        st += C(cx + dx, cy + dy + 6, TOP_R, GOLD_D) + C(cx + dx, cy + dy, TOP_R - 1, EDGE) + P(ring_d(cx + dx, cy + dy + 1, TOP_R - 1, TOP_R - 7), GOLD, ' fill-rule="evenodd" opacity="0.8"')
        st += P(ring_d(cx + dx, cy + dy - 3, TOP_R - 3, TOP_R - 6), "#FFE2A4", ' fill-rule="evenodd" opacity="0.7"')      # a light line: the pancake's soft top edge
    L.append(G(st, p + "sh"))
    top, _ = pancake_top(p, cx, cy, TOP_R, "golden", seed=480)
    L.append(G(top, p + "sh"))
    return doc(p, PLATE, PLATE, "".join(L), material="smooth", seed=501, sh=(4, 4, .3), blur=12)


# ================= SYRUP BOTTLE (260x520, squeeze bottle held nozzle down; tip (130,506)) =================
def maple_leaf(cx, cy, s, col):
    pts = []
    spec = [(0, -1.0), (.18, -.55), (.42, -.7), (.36, -.3), (.9, -.42), (.7, -.08), (.86, .1), (.42, .2), (.46, .46), (.08, .3), (0, .66)]
    right = [(cx + x * 40 * s, cy + y * 40 * s) for x, y in spec]
    left = [(cx - x * 40 * s, cy + y * 40 * s) for x, y in reversed(spec[1:-1])]
    pts = right + left
    g = P("M" + " L".join(f"{n(x)},{n(y)}" for x, y in pts) + "Z", col, ' stroke-linejoin="round"')
    g += stroke(f"M{n(cx)},{n(cy + 26 * s)} L{n(cx)},{n(cy + 46 * s)}", col, 4 * s)
    return g


def syrup_bottle():
    p = "sb-"
    body = "M52,40 L208,40 Q222,40 222,56 L222,352 Q222,394 176,412 L84,412 Q38,394 38,352 L38,56 Q38,40 52,40Z"
    L = [G(P(body, SYR), p + "cut")]
    L.append(f'<clipPath id="{p}b"><path d="{body}"/></clipPath>'
             + G(P("M30,30 L230,30 L230,112 Q130,124 30,108Z", mix(SYR_L, WHITE, .45)) + P("M30,108 Q130,124 230,112 L230,122 Q130,134 30,118Z", SYR_L, ' opacity="0.9"')
                 + G(E(196, 280, 36, 170, SYR_D, ' opacity="0.7"') + E(74, 250, 20, 130, SYR_L, ' opacity="0.8"'), p + "bl"), None, f' clip-path="url(#{p}b)"'))
    lab = P(wob(130, 250, 70, 76, .03, 3, 20), CORAL_D) + P(wob(130, 248, 64, 70, .03, 4, 20), CREAM) + maple_leaf(130, 244, 1.05, RED)
    L.append(G(lab, p + "sh"))
    L.append(P(wrect(56, 130, 12, 220, 6, .4, 5), WHITE, ' opacity="0.6"') + P(wrect(78, 140, 6, 60, 3, .3, 6), WHITE, ' opacity="0.5"'))
    # flip cap + nozzle (red), a syrup drop at the tip
    cap = P(wrect(72, 404, 116, 44, 12, .5, 7), CORAL_D) + P(wrect(76, 404, 108, 32, 10, .4, 8), CORAL) + P(wrect(86, 408, 44, 8, 4, .3, 9), CORAL_L, ' opacity="0.9"')
    cap += P("M100,444 L160,444 L140,494 Q130,500 120,494Z", CORAL_D) + P("M106,444 L130,444 L128,490 L122,490Z", CORAL_L, ' opacity="0.6"')
    L.append(G(cap, p + "sh"))
    L.append(G(P("M122,492 Q130,488 138,492 Q140,502 130,508 Q120,502 122,492Z", SYR) + C(127, 498, 2, WHITE, ' opacity="0.8"'), p + "sh"))
    return doc(p, SYRUP[0], SYRUP[1], "".join(L), material="smooth", seed=511, sh=(4, 3.5, .33), blur=8)


# ================= TOPPINGS (140x140, centre (70,70), radius <= 58; like topping-*) =================
def syrup_blob():
    p = "sy-"
    r = random.Random(3)
    lobes = [(70 + math.cos(a) * 34, 70 + math.sin(a) * 32, rr) for a, rr in ((.3, 20), (2.0, 18), (3.6, 22), (5.1, 17))]
    base = gen_items.wobp(70, 70, 44, 40, .08, 5, 22)
    L = [G(P(smooth(base), SYR_D) + "".join(C(x, y, rr, SYR_D) for x, y, rr in lobes), p + "cut")]
    L.append(P(wob(69, 68, 40, 36, .08, 6, 22), SYR) + "".join(C(x - 1, y - 2, rr - 4, SYR) for x, y, rr in lobes))
    L.append(P(wob(64, 62, 26, 20, .1, 7, 18), SYR_L, ' opacity="0.7"'))
    L.append(P("M40,60 Q46,40 68,36 Q52,48 48,64Z", WHITE, ' opacity="0.85"') + C(92, 58, 4, WHITE, ' opacity="0.8"') + C(52, 96, 3, WHITE, ' opacity="0.6"'))
    return doc(p, STAMP, STAMP, "".join(L), material="smooth", seed=521, sh=(2, 2, .3), blur=4, cut={"rim": 2.2, "rough": 3})


def blueberry(cx, cy, rr, seed):
    g = C(cx + 1, cy + 2, rr, BLU_D) + C(cx, cy, rr - 2, BLU) + P(wob(cx - rr * .25, cy - rr * .3, rr * .55, rr * .38, .1, seed, 12, -30), BLU_L, ' opacity="0.7"')
    g += C(cx - rr * .4, cy - rr * .45, rr * .16, BLU_B, ' opacity="0.95"')
    kx, ky = cx + rr * .22, cy + rr * .2                                                   # the little star-shaped crown
    g += "".join(stroke(f"M{n(kx)},{n(ky)} L{n(kx + math.cos(a) * rr * .3)},{n(ky + math.sin(a) * rr * .3)}", BLU_D, rr * .12) for a in [i / 5 * 6.283 - 1.57 for i in range(5)])
    g += C(kx, ky, rr * .12, "#26305F")
    return g


def berry():
    p = "br-"
    L = [G(blueberry(50, 82, 26, 1), p + "cut"), G(blueberry(90, 80, 24, 2), p + "cut"), G(blueberry(68, 46, 24, 3), p + "cut")]
    L.append(G(P("M86,34 Q108,20 120,34 Q104,48 86,34Z", GREEN) + stroke("M88,34 Q104,30 116,33", GREEN_D, 2), p + "sh"))     # a mint leaf
    return doc(p, STAMP, STAMP, "".join(L), material="smooth", seed=531, sh=(3, 2.5, .33), blur=4, cut={"rim": 2.2, "rough": 3})


def banana_coin():
    p = "bn-"
    L = [G(C(70, 72, 52, mix(BAN_F, BAN_D, .45)), p + "cut")]
    L.append(C(69, 70, 48, BAN_F) + P(wob(66, 66, 34, 32, .05, 3, 16), "#FFF9E2", ' opacity="0.8"'))
    L.append(C(70, 71, 18, BAN_F2, ' opacity="0.9"'))
    seeds = ""
    for i in range(3):                                                                        # the three-armed seed star of a banana slice
        a = i / 3 * 6.283 - 1.57
        seeds += E(70 + math.cos(a) * 9, 71 + math.sin(a) * 9, 3, 6, BAN_SEED, f' transform="rotate({n(math.degrees(a) + 90)} {n(70 + math.cos(a) * 9)} {n(71 + math.sin(a) * 9)})"')
    seeds += C(70, 71, 3, BAN_SEED)
    L.append(seeds)
    L.append(P("M36,58 Q44,32 70,26 Q50,40 44,62Z", WHITE, ' opacity="0.75"'))
    return doc(p, STAMP, STAMP, "".join(L), material="smooth", seed=541, sh=(3, 2.5, .33), blur=4, cut={"rim": 2.2, "rough": 3})


def butter_pat():
    p = "bu-"
    L = [G(P(wob(72, 74, 54, 50, .1, 3, 18), BUTTER_L, ' opacity="0.8"'), p + "sh")]                         # the melting puddle
    pat = [(40, 44), (98, 38), (104, 96), (44, 102)]
    L.append(G(P(rpoly([(x + 5, y + 9) for x, y in pat], 12), BUTTER_D) + P(rpoly(pat, 12), BUTTER), p + "cut"))
    L.append(P(rpoly([(50, 52), (88, 48), (92, 72), (54, 76)], 10), BUTTER_L, ' opacity="0.9"'))
    L.append(P(wob(60, 58, 12, 5, .1, 5, 10, -8), WHITE, ' opacity="0.9"') + C(90, 90, 3, WHITE, ' opacity="0.7"'))
    return doc(p, STAMP, STAMP, "".join(L), material="smooth", seed=551, sh=(3, 2.5, .33), blur=4, cut={"rim": 2.2, "rough": 3})


# ================= RECIPE CARD (400x520, the card-pizza layout) =================
def card_pancakes():
    p = "crp-"
    L = [G(P(gen_kitchen.wrect(10, 10, 380, 500, 36, 2.2, 3, step=18), CREAM), p + "cut")]
    pat = (f'<pattern id="{p}gh" width="40" height="40" patternUnits="userSpaceOnUse">'
           f'<rect width="40" height="40" fill="#E4F2F1"/><rect width="20" height="40" fill="{TEAL_L}" opacity="0.3"/>'
           f'<rect width="40" height="20" fill="{TEAL_L}" opacity="0.3"/></pattern>')
    L.append(G(P(gen_kitchen.wrect(34, 34, 332, 332, 26, 1.2, 4), f"url(#{p}gh)"), p + "sh"))
    L.append(G(mini_stack(200, 196, 1.36), p + "sh"))
    L.append(G(blueberry(64, 330, 13, 5) + blueberry(86, 342, 12, 6) + blueberry(330, 72, 12, 7), p + "sh"))
    L.append(G(C(328, 334, 22, mix(BAN_F, BAN_D, .45)) + C(327, 332, 20, BAN_F) + C(327, 333, 3, BAN_SEED)
               + C(76, 76, 20, mix(BAN_F, BAN_D, .45)) + C(75, 74, 18, BAN_F) + C(75, 75, 3, BAN_SEED), p + "sh"))
    L.append(G(P(gen_kitchen.wrect(130, -4, 140, 40, 3, 1.4, 6), MUSTARD, ' opacity="0.85" transform="rotate(-4 200 15)"')
               + "".join(C(146 + i * 18, 16, 4, WHITE, ' opacity="0.7" transform="rotate(-4 200 15)"') for i in range(7)), p + "sh"))
    # ingredient row: egg, milk, flour (wheat)
    L.append(G("".join(P(wob(x, 440, 50, 44, .04, 7 + i, 20), WHITE) for i, x in enumerate((92, 200, 308))), p + "sh"))
    eg = E(92, 442, 26, 33, SHELL_D) + E(91, 440, 24, 31, SHELL) + E(84, 428, 7, 10, SHELL_L)
    mk = (stroke("M182,420 L182,476 L218,476 L218,420 L210,404 L190,404Z", GLASS_D, 3) + P("M182,420 L182,476 L218,476 L218,420 L210,404 L190,404Z", WHITE)
          + P("M182,420 L218,420 L210,404 L190,404Z", CREAM2) + P("M182,446 Q200,438 218,446 L218,476 L182,476Z", TEAL) + P("M188,400 L212,400 L212,408 L188,408Z", CREAM2))
    wh = CA.wheat(308, 440, .5, -14) + CA.wheat(320, 444, .5, 16)
    L.append(G(eg, p + "sh") + G(mk, p + "sh") + G(wh, p + "sh"))
    d = std_defs(p, "rough", seed=57, sh=(4, 3.5, .32), cut={"rim": 3, "rough": 7, "freq": .12}) + pat
    return svg(400, 520, d, G("".join(L), p + "gr"))


# ================= PHOTO FRAME (700x780, identical to images-b-prep photo-frame, pancake sticker) =================
def pizza_sticker():
    """The exact markup of the pizza-slice sticker in gen_prep_b.photo_frame (swapped out, like the cookie / smoothie frames)."""
    return (P("M410,726 L380,668 Q410,654 440,668Z", SAUCE) + P("M410,716 L388,672 Q410,662 432,672Z", CHEESE)
            + P(wrect(376, 656, 68, 16, 8, .3, 5), CRUST) + C(404, 686, 5, RED) + C(416, 700, 4, OLIVE))


def photo_frame_pancakes():
    s = PB.photo_frame()
    old = pizza_sticker()
    assert s.count(old) == 1, "pizza sticker not found in the prep frame code"
    return s.replace(old, mini_stack(410, 676, .42)).replace("pf-", "pfp-")


ITEMS = {"plate-big": plate_big, "syrup-bottle": syrup_bottle, "syrup-blob": syrup_blob, "berry": berry, "banana-coin": banana_coin,
         "butter-pat": butter_pat, "card-pancakes": card_pancakes, "photo-frame-pancakes": photo_frame_pancakes}

if __name__ == "__main__":
    run(ITEMS)
