# images-b-clinic, round 4 (research/clinic-research-2.md): what "Doctor Games for kids" has that the clinic lacked, the
# bee sting, the bug bites and the muddy child. Shares gen_clinic.py's kit and palette; writes into images-b-clinic/.
# Run: python tools/gen_clinic4.py [names...]   then copy the SVGs into public/assets/images and bake the WebPs.
# The anchors the game relies on are printed at the end (ART.clinic in src/core/assets.ts).
# Nothing here is scary: the bee went home long ago (only its tiny sting is left), the bugs are round smiling gnats, the
# mud is just mud.
import sys, os, math
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from gen_clinic import *  # noqa: F401,F403
import gen_clinic as gc

# ================================================================ the close-ups (520 frame like the others)
SKIN = [(150, 170), (270, 140), (380, 190), (190, 290), (320, 280), (400, 330), (150, 380), (260, 390), (360, 410)]


def lens_skin():
    """A patch of arm (light grey: tinted to the patient): the arm's soft roll across, its light, a crease at the elbow.
    The stings, the bites, the gnats and the mud go on it (SKIN: the places)."""
    p = "lsk-"
    s = rect(0, 0, 520, 520, GREY_L)
    arm = "M-20,70 Q260,30 540,90 L540,470 Q260,510 -20,450Z"
    s += G(P(arm, GREY), p + "sh")
    s += P("M-20,120 Q260,84 540,140 L540,200 Q260,150 -20,190Z", WHITE, ' opacity="0.28"')
    s += P("M-20,400 Q260,440 540,410 L540,470 Q260,510 -20,450Z", GREY_D, ' opacity="0.35"')
    s += stroke("M70,300 Q90,270 76,236", GREY_D, 6, ' opacity="0.45"')   # the elbow's crease
    return lens_doc(p, s, 401)


HAND = (262, 300)


def lens_hand():
    """A child's open hand, palm up (tinted): the palm, four fingers and the thumb (a splinter goes into HAND)."""
    p = "lha-"
    s = rect(0, 0, 520, 520, MINT_L)
    fingers = [(150, 150, -18, 150), (220, 112, -6, 170), (300, 112, 6, 170), (372, 150, 18, 150)]
    for i, (x, y, a, h) in enumerate(fingers):
        s += G(P(wr(x - 34, y - h / 2, 68, h, 34, 1, 3 + i), GREY, f' transform="rotate({a} {x} {y + h / 2})"'), p + "sh")
    s += G(P("M90,330 Q60,250 120,236 Q160,232 180,300 Z", GREY), p + "sh")   # the thumb
    s += G(P(wob(262, 330, 160, 150, .03, 1, 30), GREY), p + "sh")
    s += P(wob(262, 350, 100, 80, .05, 2, 24), GREY_D, ' opacity="0.35"')
    s += stroke("M150,290 Q240,260 330,300", GREY_D, 5, ' opacity="0.45"') + stroke("M170,360 Q250,330 360,350", GREY_D, 5, ' opacity="0.4"')
    return lens_doc(p, s, 402)


# ================================================================ the things on the skin
def stinger():
    """110x100: a round pink bump with a tiny dark sting in its top (the tweezers take it out)."""
    p = "ost-"
    s = P(wob(55, 60, 40, 30, .06, 1, 18), "#F3A0A4", ' opacity="0.9"') + P(wob(52, 56, 22, 14, .08, 2, 14), "#F8C2C2", ' opacity="0.9"')
    s += stroke("M58,52 L72,18", INK, 5) + C(72, 18, 4, INK)
    return doc(p, 110, 100, G(s, p + "sh"), "smooth", seed=411)


def bite():
    """90x80: a little pink bug bite, itchy (cream on it)."""
    p = "obi-"
    s = P(wob(45, 42, 32, 26, .08, 1, 16), "#F28A9A", ' opacity="0.85"') + P(wob(43, 39, 14, 10, .1, 2, 12), "#FBC6CE", ' opacity="0.9"')
    return doc(p, 90, 80, G(s, p + "sh"), "smooth", seed=412)


def gnat():
    """120x110: a tiny round bug with see-through wings, big eyes and a smile (the spray sends it off, buzzing)."""
    p = "ogn-"
    s = P(wob(36, 34, 26, 14, .1, 4, 14, -30), "#DDF0F7", ' opacity="0.9"') + P(wob(84, 34, 26, 14, .1, 5, 14, 30), "#DDF0F7", ' opacity="0.9"')
    s += stroke("M44,96 L36,106", INK, 4) + stroke("M60,98 L60,108", INK, 4) + stroke("M76,96 L84,106", INK, 4)
    s += C(60, 70, 32, "#6E5A8C") + P(wob(52, 60, 12, 8, .1, 6, 10, -25), "#9C88BC", ' opacity="0.9"')
    for ex in (48, 72):
        s += C(ex, 66, 10, WHITE) + C(ex + 1, 68, 5, INK) + C(ex + 3, 65, 2, WHITE)
    s += stroke("M50,82 Q60,90 70,82", WHITE, 3) + stroke("M50,42 q-6,-14 -16,-14", INK, 3) + stroke("M70,42 q6,-14 16,-14", INK, 3)
    return doc(p, 120, 110, G(s, p + "sh"), "smooth", seed=413)


def mud():
    """110x100: a splat of brown mud (the sponge foams it)."""
    p = "omu-"
    # (dark enough to read on Leo's dark skin too, with a lighter wet shine on it)
    s = P(spiky(55, 52, 30, 44, 0, 360, 9, 7), "#4E321D") + P(wob(55, 52, 32, 28, .1, 8, 18), "#654128")
    s += P(wob(44, 42, 10, 6, .12, 9, 10, -20), "#B08A62", ' opacity="0.85"') + C(88, 20, 7, "#4E321D") + C(18, 86, 5, "#4E321D")
    return doc(p, 110, 100, G(s, p + "sh"), "smooth", seed=414)


def foam():
    """110x100: a heap of soap bubbles where the mud was (the water rinses it away)."""
    p = "ofo-"
    s = "".join(C(x, y, r, WHITE, ' opacity="0.95"') + C(x - r * .35, y - r * .35, r * .3, SKY_L, ' opacity="0.9"')
                for x, y, r in ((40, 58, 22), (66, 54, 26), (54, 34, 18), (82, 70, 16), (28, 76, 14)))
    s += "".join(C(x, y, r, "none", f' stroke="{SKY_D}" stroke-width="2" opacity="0.6"') for x, y, r in ((40, 58, 22), (66, 54, 26), (54, 34, 18)))
    return doc(p, 110, 100, G(s, p + "sh"), "smooth", seed=415)


# ================================================================ the tools (240 frame)
def sponge():
    """A soft yellow sponge with holes and a few bubbles (its middle is the tip: it scrubs)."""
    p = "tsg-"
    s = P(wr(46, 70, 148, 104, 26, 2, 1), "#F6CF4E") + P(wr(46, 70, 148, 30, 14, 1.5, 2), "#8FC76A")
    s += "".join(C(x, y, r, "#E2AE2E", ' opacity="0.8"') for x, y, r in ((84, 128, 8), (120, 146, 6), (154, 124, 9), (102, 158, 5), (170, 156, 5), (68, 152, 5)))
    s += "".join(C(x, y, r, WHITE, ' opacity="0.9"') + C(x - r * .3, y - r * .3, r * .3, SKY_L) for x, y, r in ((70, 60, 14), (96, 46, 10), (180, 62, 12)))
    return tool_doc(p, s, 421)


def bugspray():
    """A little green spray can with a leaf and a smiling bug that waves bye (the mist comes out at the top left)."""
    p = "tbs-"
    s = P(wr(80, 76, 90, 146, 26, 1.2, 1), "#7CC47A") + P(wr(90, 88, 70, 120, 20, 1, 2), "#A9DCA0", ' opacity="0.8"')
    s += rect(98, 50, 54, 30, WHITE) + P("M88,30 L160,30 L166,52 L88,52Z", AQUA_D) + rect(50, 34, 42, 14, AQUA)
    s += P("M104,170 Q120,120 148,132 Q140,170 104,170Z", "#4E9A44") + stroke("M108,166 Q126,146 144,136", WHITE, 3)
    s += C(124, 112, 12, "#6E5A8C") + C(120, 109, 3, WHITE) + C(128, 109, 3, WHITE)
    return tool_doc(p, s, 422)


TOOL_TIP4 = {"sponge": (120, 122), "bugspray": (52, 40)}


def sick4(kind):
    """200x200 cards like sick-*: a bee sting, bug bites, a muddy face."""
    p = f"sk4{kind[:2]}-"
    s = G(P(wob(100, 104, 90, 90, .02, 1, 30), "#FFFCF2"), p + "cut")
    if kind == "sting":
        s += P("M30,150 Q90,110 170,124 L176,176 Q100,160 34,186Z", "#F6C9A8")
        s += P(wob(110, 134, 18, 13, .1, 2, 14), "#F3A0A4") + stroke("M112,130 L120,112", INK, 4)
        # the bee flying home, smiling
        s += P(wob(70, 52, 14, 8, .1, 3, 12, -30), "#DDF0F7") + P(wob(92, 50, 14, 8, .1, 4, 12, 30), "#DDF0F7")
        s += E(82, 72, 26, 20, MUSTARD) + rect(74, 54, 7, 36, INK, ' transform="rotate(10 78 72)"') + rect(88, 54, 7, 36, INK, ' transform="rotate(10 92 72)"')
        s += C(60, 70, 4, INK) + stroke("M128,60 q14,-10 28,0", MUSTARD, 4, ' stroke-dasharray="6 6"')
    elif kind == "bites":
        s += P("M30,150 Q90,110 170,124 L176,176 Q100,160 34,186Z", "#F6C9A8")
        s += "".join(C(x, y, r, "#F28A9A") for x, y, r in ((76, 146, 9), (116, 138, 11), (146, 150, 8)))
        s += C(100, 72, 18, "#6E5A8C") + P(wob(84, 52, 12, 7, .1, 3, 12, -30), "#DDF0F7") + P(wob(116, 52, 12, 7, .1, 4, 12, 30), "#DDF0F7")
        s += C(94, 70, 4, WHITE) + C(106, 70, 4, WHITE) + stroke("M94,80 Q100,84 106,80", WHITE, 2.5)
    else:  # dirty
        s += C(100, 110, 62, "#F6C9A8") + C(80, 100, 6, INK) + C(120, 100, 6, INK) + stroke("M84,130 Q100,140 116,130", INK, 4)
        s += P(spiky(70, 140, 14, 20, 0, 360, 7, 3), "#8E6440") + P(spiky(136, 76, 12, 17, 0, 360, 7, 4), "#8E6440") + P(spiky(132, 146, 9, 13, 0, 360, 7, 5), "#8E6440")
    return doc(p, 200, 200, G(s, p + "sh"), "smooth", seed=580 + len(kind), cut={"rim": 3, "rough": 4})


def done_badge():
    """120x120: the gold star that goes on a problem's card when it is fixed."""
    p = "odb-"
    s = C(60, 60, 50, "#7CC47A") + C(60, 60, 42, "#A9DCA0")
    s += star(60, 62, 30, MUSTARD) + star(60, 62, 18, "#FFE08A")
    return doc(p, 120, 120, G(s, p + "sh"), "smooth", seed=431, cut={"rim": 2.4, "rough": 3})


ITEMS4 = {
    "lens-skin": lens_skin, "lens-hand": lens_hand, "clinic-sting": stinger, "clinic-bite": bite, "clinic-gnat": gnat,
    "clinic-mud": mud, "clinic-foam": foam, "tool-sponge": sponge, "tool-bugspray": bugspray,
    "sick-sting": lambda: sick4("sting"), "sick-bites": lambda: sick4("bites"), "sick-dirty": lambda: sick4("dirty"),
    "clinic-done": done_badge,
}


if __name__ == "__main__":
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    for k, fn in ITEMS4.items():
        if not only or k in only:
            gc.save(k, fn())
    print("anchors: TOOL_TIP4", TOOL_TIP4, "SKIN", SKIN, "HAND", HAND)
