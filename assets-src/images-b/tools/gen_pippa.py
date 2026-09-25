# Pippa the hedgehog baker (character-* layers, 600x700) + Mom's pointing hint hand (hand-hint, 220x280).
# Style B paper cut-out. Ported from style-test/tools/gen_b.py (approved design) and gen_mom_b.py (hand).
# Run: python gen_pippa.py   (writes into ../)
import math, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pb import *

# ---------- Pippa palette (brighter production set) ----------
SPK_D = "#6E432C"; SPK = "#945E3C"; SPK_L = "#B67D4F"
FACE = "#F6DEB8"; FACE_D = "#EAC795"; SNOUT = "#FCEFD8"
BAND = "#DE4A3A"; BAND_D = "#B4382E"; DOT = "#FCEBD0"
APRON = TEAL; APRON_L = TEAL_L; APRON_D = TEAL_D
NOSE = "#3A2620"; MOUTH = "#7E2A28"; TONGUE = "#EE7A70"; TONGUE_L = "#F7A197"; TEETH = "#FFF8EC"
BROW = "#6E432C"
W, H = 600, 700
EYES = (230, 370)
EY = 312


def defs(p, material="smooth", seed=3, sh=(5, 4, .33), cut=None, blur=6):
    return std_defs(p, material, seed, sh=sh, cut=cut, blur=blur)


# ---------------- body ----------------
def character_body():
    p = "pp-bd-"
    cut, sh = p + "cut", p + "sh"
    L = [G(E(300, 676, 168, 10, SH, ' opacity="0.42"'), p + "bl")]
    # back spikes (body), outer silhouette -> torn rim
    L.append(G(P(spiky(300, 530, 150, 190, 150, 390, 11, 3, .92), SPK_D, f' stroke="{SPK_D}" stroke-width="12" stroke-linejoin="round"'), cut))
    # feet
    feet = P(wob(236, 656, 52, 25, .05, 1), SPK) + P(wob(364, 656, 52, 25, .05, 2), SPK)
    feet += P(wob(236, 650, 38, 15, .06, 3), FACE_D) + P(wob(364, 650, 38, 15, .06, 4), FACE_D)
    L.append(G(feet, cut))
    # body
    L.append(G(P(wob(300, 540, 150, 126, .02, 5), SPK), sh))
    L.append(G(P(wob(300, 552, 118, 108, .025, 6), FACE), sh))
    # apron with scalloped hem, trim, pocket and a little pizza patch
    apron = "M196,500 Q300,488 404,500 Q416,590 392,646 Q300,666 208,646 Q184,590 196,500Z"
    hem = "".join(C(214 + i * 21.5, 648 + 6 * math.sin(i / 8 * math.pi), 13, APRON) for i in range(9))
    L.append(G(P(apron, APRON) + hem, sh))
    L.append(P("M204,628 Q300,646 396,628 L394,638 Q300,656 206,638Z", CREAM, ' opacity="0.9"'))
    L.append(P("M206,506 Q300,496 394,506 L396,520 Q300,510 204,520Z", APRON_L, ' opacity="0.8"'))
    pocket = P(wrect(246, 556, 108, 64, 16, 1, 7), APRON_D)
    stitch = "".join(f'<rect x="{252 + i * 10}" y="562" width="6" height="2.6" rx="1.3" fill="#D6ECE8" opacity="0.85"/>' for i in range(10))
    L.append(G(pocket, sh) + stitch)
    patch = (P("M300,566 L334,612 Q300,625 266,612Z", CRUST) + P("M300,576 L325,608 Q300,617 275,608Z", CHEESE)
             + C(296, 592, 5.5, RED) + C(309, 604, 5, RED) + C(287, 606, 4.5, RED))
    L.append(G(patch, sh))
    # straps
    L.append(G(P("M214,500 Q224,470 244,452 L256,460 Q238,476 232,500Z", APRON) + P("M386,500 Q376,470 356,452 L344,460 Q362,476 368,500Z", APRON), sh))
    # left arm resting on tummy
    L.append(G(P(wob(178, 548, 30, 46, .06, 8, 18, 25), SPK) + P(wob(190, 584, 26, 22, .06, 9), FACE_D), cut))
    # head spike halo (three tones); darkest is the outer silhouette
    L.append(G(P(spiky(300, 300, 196, 256, 146, 394, 17, 10, .95), SPK_D, f' stroke="{SPK_D}" stroke-width="22" stroke-linejoin="round"'), cut))
    L.append(G(P(spiky(300, 306, 182, 232, 154, 386, 16, 11, .95), SPK, f' stroke="{SPK}" stroke-width="18" stroke-linejoin="round"'), sh))
    L.append(G(P(spiky(300, 312, 160, 202, 162, 378, 15, 12, .95), SPK_L, f' stroke="{SPK_L}" stroke-width="14" stroke-linejoin="round"'), sh))
    # head base
    L.append(G(E(300, 330, 196, 170, SPK), sh))
    # ears
    ears = P(wob(146, 214, 42, 40, .05, 13), FACE_D) + P(wob(454, 214, 42, 40, .05, 14), FACE_D)
    ears += P(wob(148, 216, 24, 23, .08, 15), PINK) + P(wob(452, 216, 24, 23, .08, 16), PINK)
    L.append(G(ears, sh))
    # heart-shaped face
    L.append(G(C(236, 318, 122, FACE) + C(364, 318, 122, FACE) + E(300, 384, 158, 102, FACE), sh))
    L.append(E(300, 446, 110, 34, FACE_D, ' opacity="0.5"'))   # chin shade
    # cheeks
    L.append(E(196, 398, 34, 22, CHEEK, ' opacity="0.85"') + E(404, 398, 34, 22, CHEEK, ' opacity="0.85"'))
    L.append(C(186, 392, 5, "#F8C4B6") + C(394, 392, 5, "#F8C4B6"))
    # snout & nose
    L.append(G(P(wob(300, 380, 62, 44, .04, 17), SNOUT), sh))
    L.append(G(P(wob(300, 358, 22, 16, .06, 18), NOSE), sh))
    L.append(E(293, 353, 7, 4.5, "#8B6A5E"))
    # bandana (signature): red with cream polka dots, knot + tails on the right
    band = "M122,238 Q138,112 300,98 Q462,112 478,238 Q400,196 300,194 Q200,196 122,238Z"
    dots = "".join(C(x, y, 8.5, DOT) for x, y in [(170, 190), (220, 150), (280, 128), (340, 128), (398, 150), (448, 190), (250, 180), (320, 170), (385, 190), (205, 212)])
    L.append(f'<clipPath id="{p}bc"><path d="{band}"/></clipPath>')
    L.append(G(P(band, BAND) + G(dots, None, f' clip-path="url(#{p}bc)"') + P("M140,226 Q300,178 460,226 Q400,200 300,198 Q200,200 140,226Z", BAND_D, ' opacity="0.6"'), sh))
    knot = P("M456,168 Q510,120 540,150 Q530,196 470,196Z", BAND_D) + P("M468,196 Q520,210 526,260 Q480,254 458,206Z", BAND_D)
    knot += P("M460,172 Q504,136 526,156 Q520,186 472,190Z", BAND) + P("M470,200 Q512,214 514,246 Q480,240 462,208Z", BAND)
    knot += C(512, 160, 6.5, DOT) + C(494, 226, 6.5, DOT)
    L.append(G(knot, cut))
    L.append(G(P(wob(466, 190, 20, 18, .08, 19), BAND_D), sh))
    # right arm raised, holding a wooden spoon
    spoon = P("M490,470 L518,262 L538,265 L510,473Z", WOOD_L) + P(wob(532, 236, 28, 38, .04, 20, 18, 8), WOOD_L) + P(wob(534, 232, 18, 26, .06, 21, 16, 8), WOOD)
    L.append(G(spoon, cut))
    arm = P("M392,512 Q426,480 462,446 Q490,428 504,452 Q502,476 480,496 Q446,530 420,556Z", SPK)
    L.append(G(arm, sh))
    L.append(G(P(wob(490, 450, 30, 28, .06, 22), FACE_D) + P(wob(478, 440, 9, 7, .1, 23, 10, -30), FACE_D), sh))
    return svg(W, H, defs(p, seed=31, blur=4), G("".join(L), p + "gr"))


# ---------------- eyes ----------------
def lashes(cx, cy, s=1.0):
    sgn = -1 if cx < 300 else 1
    ox = cx + sgn * 36 * s
    a = P(f"M{n(ox)},{n(cy - 22 * s)} Q{n(ox + sgn * 18)},{n(cy - 36 * s)} {n(ox + sgn * 26)},{n(cy - 30 * s)} Q{n(ox + sgn * 14)},{n(cy - 26 * s)} {n(ox + sgn * 4)},{n(cy - 14 * s)}Z", EYE)
    a += P(f"M{n(ox + sgn * 2)},{n(cy - 8 * s)} Q{n(ox + sgn * 22)},{n(cy - 14 * s)} {n(ox + sgn * 28)},{n(cy - 6 * s)} Q{n(ox + sgn * 14)},{n(cy - 4 * s)} {n(ox + sgn * 2)},{n(cy)}Z", EYE)
    return a


def round_eye(p, cx, cy, rx, ry, big=False):
    e = P(wob(cx, cy, rx, ry, .02, cx + ry), EYE)
    e += f'<clipPath id="{p}c{cx}"><ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}"/></clipPath>'
    e += G(E(cx, cy + ry * .65, rx * .9, ry * .56, "#6A4636") + E(cx, cy + ry * .74, rx * .63, ry * .35, "#8F6046"), None, f' clip-path="url(#{p}c{cx})"')
    k = 1.25 if big else 1.0
    e += C(cx + rx * .29, cy - ry * .35, 14 * k, WHITE) + C(cx - rx * .34, cy + ry * .35, 6 * k, WHITE) + C(cx + rx * .53, cy + ry * .13, 3.5 * k, WHITE, ' opacity="0.9"')
    return e


def arc_band(cx, cy, w, h, t, up=True):
    """Crescent strip: an arc of width w, height h, thickness t. up=True -> ^ shape, else U shape."""
    s = -1 if up else 1
    x0, x1 = cx - w / 2, cx + w / 2
    # outer curve and inner curve (quadratic), rounded ends via small arcs
    d = (f"M{n(x0)},{n(cy)} Q{n(cx)},{n(cy + s * h * 2)} {n(x1)},{n(cy)}"
         f" A{n(t / 2)},{n(t / 2)} 0 0 {1 if up else 0} {n(x1 - t * .7)},{n(cy - s * t * .7)}"
         f" Q{n(cx)},{n(cy + s * (h * 2 - t * 2.2))} {n(x0 + t * .7)},{n(cy - s * t * .7)}"
         f" A{n(t / 2)},{n(t / 2)} 0 0 {1 if up else 0} {n(x0)},{n(cy)}Z")
    return d


def eyes(kind):
    p = {"open": "pp-eo-", "blink": "pp-eb-", "happy": "pp-eh-", "surprised": "pp-es-"}[kind]
    L = []
    for cx in EYES:
        sgn = -1 if cx < 300 else 1
        if kind == "open":
            L.append(G(round_eye(p, cx, EY, 38, 46), p + "sh") + lashes(cx, EY))
        elif kind == "surprised":
            L.append(G(round_eye(p, cx, EY - 4, 44, 52, True), p + "sh") + lashes(cx, EY - 8, 1.1))
            # small raised brows, tilted up toward the middle
            bx, by = cx + sgn * 4, EY - 84
            L.append(G(P(arc_band(bx, by, 50, 9, 11, True), BROW, f' transform="rotate({-sgn * 8} {bx} {by})"'), p + "sh"))
        elif kind == "blink":
            cy = EY + 14
            L.append(G(P(arc_band(cx, cy, 70, 12, 13, False), EYE), p + "sh"))
            ox = cx + sgn * 33
            # lashes flick from the outer end of the lid
            L.append(P(f"M{ox},{cy - 2} Q{ox + sgn * 18},{cy - 4} {ox + sgn * 26},{cy - 16} Q{ox + sgn * 14},{cy + 2} {ox},{cy + 8}Z", EYE))
            L.append(P(f"M{ox - sgn * 6},{cy + 6} Q{ox + sgn * 12},{cy + 14} {ox + sgn * 16},{cy + 26} Q{ox + sgn * 4},{cy + 20} {ox - sgn * 12},{cy + 14}Z", EYE))
        elif kind == "happy":
            cy = EY + 18
            L.append(G(P(arc_band(cx, cy, 76, 20, 15, True), EYE), p + "sh"))
            ox = cx + sgn * 36
            L.append(P(f"M{ox},{cy - 6} Q{ox + sgn * 16},{cy - 20} {ox + sgn * 26},{cy - 18} Q{ox + sgn * 14},{cy - 8} {ox + sgn * 4},{cy + 4}Z", EYE))
    return svg(W, H, std_defs(p, "smooth", 41 + len(kind), sh=(3, 2.5, .3)), G("".join(L), p + "gr"))


# ---------------- mouths ----------------
def mouth_open():
    p = "pp-mo-"
    m = "M252,394 Q300,408 348,394 Q360,392 358,406 Q350,474 300,476 Q250,474 242,406 Q240,392 252,394Z"
    inner = G(E(300, 482, 46, 32, TONGUE) + E(290, 468, 18, 9, TONGUE_L), None, f' clip-path="url(#{p}c)"')
    teeth = P("M260,396 Q300,408 340,396 L337,410 Q300,420 263,410Z", TEETH)
    L = [f'<clipPath id="{p}c"><path d="{m}"/></clipPath>', G(P(m, MOUTH) + inner + teeth, p + "sh")]
    return svg(W, H, std_defs(p, "smooth", 51, sh=(3, 2.5, .3)), G("".join(L), p + "gr"))


def mouth_closed():
    p = "pp-mc-"
    m = "M262,396 Q300,418 338,396 Q344,393 343,400 Q328,432 300,432 Q272,432 257,400 Q256,393 262,396Z"
    L = [G(P(m, MOUTH) + E(300, 424, 14, 5, "#DC6C66"), p + "sh")]
    return svg(W, H, std_defs(p, "smooth", 53, sh=(3, 2.5, .3)), G("".join(L), p + "gr"))


def mouth_chew():
    p = "pp-mw-"
    L = []
    # puffed cheeks: round face-paper bulges beside the snout, each with a blush and a light
    for sgn in (-1, 1):
        cx = 300 + sgn * 94
        L.append(G(P(wob(cx, 408, 48, 40, .03, 60 + sgn), FACE) + E(cx + sgn * 8, 408, 36, 24, CHEEK, ' opacity="0.85"')
                   + C(cx - sgn * 2, 398, 6, "#F9CDBF"), p + "sh"))
    # wavy closed mouth, cut as a paper strip
    pts = [(266, 406), (283, 418), (300, 411), (317, 418), (334, 406)]
    wave = smooth_open(pts, .2)
    L.append(G(stroke(wave, MOUTH, 12), p + "sh"))
    # a crumb at the corner
    L.append(G(P(wob(340, 428, 8, 7, .15, 70, 9), CRUST) + P(wob(339, 427, 4.5, 3.8, .15, 71, 8), CRUST_L), p + "sh"))
    return svg(W, H, std_defs(p, "smooth", 57, sh=(3, 2.5, .3)), G("".join(L), p + "gr"))


# ---------------- Mom's hint hand ----------------
SKIN = "#E6B38A"
_ap = "#5E9095"
HC_ = {
    "skin": SKIN, "skin_sh": mix(SKIN, "#7A3E30", .24), "skin_lt": mix(SKIN, "#FFF4E6", .28),
    "shirt": mix(mix(_ap, "#F2A98C", .8), "#FBF1E4", .7), "shirt_d": mix(mix(_ap, "#F2A98C", .8), "#FBF1E4", .38),
    "trim": "#F6EAD6",
}
HC_["cuff"] = HC_["shirt_d"]                        # stronger peach so the cuff reads on the cream wall
HC_["cuff_d"] = mix(HC_["shirt_d"], "#7A3E30", .18)


def pointing_hand(c, tx, ty, ang, sc, flen=128, cuff_rot=-24):
    """Hand pointing along local -y, fingertip at local (0,0). Curled fingers on the left, the thumb folded
    across them, a peach blouse cuff turned toward the lower right."""
    s, sh, lt = c["skin"], c["skin_sh"], c["skin_lt"]
    d = flen - 118
    wy = 176 + d   # wrist pivot
    cuff = (P(wrect(-58, 188 + d, 116, 84, 40, 1, 5), c["cuff"])
            + P(wrect(-48, 244 + d, 96, 18, 9, .6, 4), c["cuff_d"], ' opacity="0.6"')
            + P(wrect(-64, 180 + d, 128, 34, 16, 1, 6), c["trim"]))
    g = f'<g transform="rotate({cuff_rot} 0 {wy})">' + P(wrect(-36, 146 + d, 72, 60, 24, 1, 7), sh) + cuff + "</g>"
    g += P(wob(4, 140 + d, 64, 58, .03, 8), sh)       # palm back
    g += P(wob(2, 134 + d, 60, 54, .03, 9), s)        # palm
    fin = f"M-20,{flen} L-18,17 Q-17,0 0,0 Q17,0 18,17 L20,{flen}Z"
    g += P(fin, sh, ' transform="translate(3 2)"') + P(fin, s)
    g += P(f"M-13,{n(flen * .5)} Q0,{n(flen * .54)} 13,{n(flen * .5)} Q0,{n(flen * .58)} -13,{n(flen * .5)}Z", sh, ' opacity="0.75"')
    g += P(wob(-1, 17, 9.5, 12, .1, 32), lt, ' opacity="0.95"')     # nail light
    for i in range(3):   # curled fingers stacked on the left
        y = 104 + d + i * 29
        g += P(wrect(-58, y, 62, 32, 16, .6, 10 + i), sh) + P(wrect(-56, y - 2, 58, 28, 14, .6, 20 + i), s)
        g += P(wob(-46, y + 12, 5.5, 4.5, .1, 25 + i), lt, ' opacity="0.85"')
    # thumb sticking out on the right, angled up and away from the index (classic pointer-hand read)
    tb = f'<g transform="rotate(32 44 {150 + d})">'
    tb += P(wrect(29, 80 + d, 32, 84, 16, .6, 34), sh, ' transform="translate(3 3)"') + P(wrect(29, 80 + d, 30, 82, 15, .6, 35), s)
    tb += P(wob(44, 94 + d, 7, 9, .1, 36), lt, ' opacity="0.9"')
    tb += "</g>"
    g += tb
    return f'<g transform="translate({n(tx)} {n(ty)}) rotate({n(ang)}) scale({sc})">{g}</g>'


def hand_hint():
    p = "pp-hh-"
    c = HC_
    hand = pointing_hand(c, 53, 23, -12, .86)
    shadow = hand
    for k in ("skin", "skin_sh", "skin_lt", "cuff", "cuff_d", "trim"):
        shadow = shadow.replace(f'"{c[k]}"', f'"{SH}"')
    shadow = f'<g opacity="0.3" filter="url(#{p}bl)" transform="translate(7 11)">{shadow}</g>'
    return svg(220, 280, std_defs(p, "smooth", 61, sh=(3, 2.5, .3), blur=4, cut={"rim": 1.6, "rough": 3}), shadow + G(G(hand, p + "cut"), p + "gr"))


def main():
    files = {
        "character-body": character_body(),
        "character-eyes-open": eyes("open"), "character-eyes-blink": eyes("blink"),
        "character-eyes-happy": eyes("happy"), "character-eyes-surprised": eyes("surprised"),
        "character-mouth-open": mouth_open(), "character-mouth-closed": mouth_closed(), "character-mouth-chew": mouth_chew(),
        "hand-hint": hand_hint(),
    }
    for k, s in files.items():
        path, size = write(k, s)
        print(f"{k:28s} {size / 1024:6.1f} KB")
        assert size <= 60 * 1024, k


if __name__ == "__main__":
    main()
