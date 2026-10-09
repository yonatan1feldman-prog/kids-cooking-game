# images-b-clinic, round 5 (research/clinic-spec-5.md), part A: the two new problems, a scratchy throat and a sunburn, and
# their tools. Shares gen_clinic.py's kit and palette; writes into images-b-clinic/.
# Run: python tools/gen_clinic5.py [names...]   then copy the SVGs into public/assets/images and bake the WebPs.
# The anchors the game relies on are printed at the end (ART.clinic in src/core/assets.ts).
# Nothing here is scary: the throat's "tickles" are fluffy smiling puffs, the sunburn is a soft pink glow.
import sys, os, math
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from gen_clinic import *  # noqa: F401,F403
import gen_clinic as gc

# ================================================================ the throat close-up (520 frame, not tinted, like the mouth)
TICKLES = [(196, 268), (324, 268), (260, 318), (214, 352), (306, 352), (260, 376)]


def lens_throat():
    """A mouth open wide (not tinted): the lips, the teeth's edges, the deep pink throat, the uvula hanging in the middle,
    the tonsils' soft cushions at the sides, the tongue low down. The tickles sit in the throat (TICKLES)."""
    p = "lth-"
    s = rect(0, 0, 520, 520, "#F3D9C6")
    s += G(P(wob(260, 270, 236, 196, .02, 1, 36), "#E5867E"), p + "sh")
    s += P(wob(260, 276, 210, 170, .02, 2, 36), "#B4474C")
    # the throat: a deep, soft, rounded opening
    s += P(wob(260, 300, 132, 120, .03, 3, 30), "#8E2E38")
    s += P(wob(260, 316, 92, 86, .04, 4, 26), "#6E2230", ' opacity="0.8"')
    # the tonsils' cushions, the arches
    for sgn in (-1, 1):
        s += P(wob(260 + sgn * 128, 300, 40, 74, .05, 5 + sgn, 18), "#D86A72") + P(wob(260 + sgn * 132, 290, 16, 30, .1, 7 + sgn, 12), "#EE9AA0", ' opacity="0.7"')
    s += stroke("M140,170 Q260,130 380,170", "#D86A72", 18, ' opacity="0.9"')
    # the uvula
    s += G(P("M244,150 Q260,140 276,150 Q280,206 268,224 Q260,232 252,224 Q240,206 244,150Z", "#E07880"), p + "sh")
    s += P(wob(256, 210, 6, 9, .1, 9, 10), "#F2A6AC", ' opacity="0.8"')
    # teeth's edges at the top and bottom, the tongue low down
    s += "".join(G(P(wr(x - 28, 70, 56, 44, 16, 1, int(x)), WHITE), p + "sh") for x in (170, 230, 290, 350))
    s += G(P(wob(260, 452, 170, 74, .03, 10, 30), "#E86D70"), p + "sh") + stroke("M260,400 L260,470", "#C9505E", 5)
    s += "".join(G(P(wr(x - 28, 466, 56, 40, 14, 1, int(x) + 3), WHITE), p + "sh") for x in (200, 260, 320))
    return lens_doc(p, s, 501)


def tickle():
    """100x100: a little fluffy throat tickle, pale yellow, smiling (the spray sends it off as a bubble)."""
    p = "otk-"
    s = P(spiky(50, 52, 30, 40, 0, 360, 14, 11), "#FFE9A6") + P(wob(50, 52, 30, 28, .06, 12, 18), "#FFF3C8")
    s += C(40, 48, 5.5, INK) + C(60, 48, 5.5, INK) + C(42, 46, 2, WHITE) + C(62, 46, 2, WHITE)
    s += stroke("M41,62 Q50,70 59,62", INK, 3.5) + C(32, 60, 5, CHEEK, ' opacity="0.7"') + C(68, 60, 5, CHEEK, ' opacity="0.7"')
    return doc(p, 100, 100, G(s, p + "sh"), "smooth", seed=511)


def burn():
    """120x80: a soft pink-red sunburn glow on the skin (cool aloe makes it fade)."""
    p = "obu-"
    s = P(wob(60, 40, 52, 30, .05, 1, 18), "#F2606C", ' opacity="0.6"') + P(wob(56, 38, 34, 18, .08, 2, 14), "#F58A90", ' opacity="0.7"')
    s += "".join(C(x, y, 2.5, "#FFE6E0", ' opacity="0.8"') for x, y in ((42, 32), (66, 30), (78, 44), (52, 48)))
    return doc(p, 120, 80, s, "smooth", seed=512)


# ================================================================ the tools (240 frame)
def honey():
    """A spoon of golden honey (its bowl is the tip: it goes to the mouth)."""
    p = "tho-"
    t = ' transform="rotate(-40 120 120)"'
    s = P(wr(110, 96, 20, 136, 10, 1, 1), WOOD, t) + P(wr(114, 104, 8, 118, 4, 1, 2), WOOD_L, t)
    s += P(wob(120, 64, 40, 50, .03, 3, 22), WOOD_D, t) + P(wob(120, 62, 32, 40, .04, 4, 20), "#F2B53A", t)
    s += P(wob(112, 52, 12, 14, .1, 5, 12), "#FFE08A", t + ' opacity="0.9"')
    s += P("M88,108 Q96,128 90,140 Q82,128 88,108Z", "#F2B53A")
    return tool_doc(p, s, 521)


def aloe():
    """A green tube of cool aloe gel with a leaf on it, its nozzle at the upper left (the tip)."""
    p = "tal-"
    t = ' transform="rotate(-35 120 120)"'
    s = P("M70,70 L170,70 L160,190 Q120,200 80,190Z", "#9FD88A", t) + rect(70, 186, 100, 18, "#4E9A44", t)
    s += P(wr(98, 30, 44, 44, 8, 1, 1), WHITE, t) + rect(108, 18, 24, 18, "#4E9A44", t)
    s += P("M120,104 Q150,130 120,170 Q90,130 120,104Z", "#4E9A44", t) + stroke("M120,112 L120,164", "#C8EBB8", 3, t)
    return tool_doc(p, s, 522)


def sunhat():
    """A straw sun hat with a coral ribbon and a daisy (given to her head; it stays on)."""
    p = "tha-"
    s = P(wob(120, 150, 112, 42, .03, 1, 30), "#F6D27A") + P(wob(120, 146, 96, 32, .04, 2, 26), "#FBE3A0", ' opacity="0.7"')
    s += P("M64,150 Q62,70 120,64 Q178,70 176,150 Q120,166 64,150Z", "#F6D27A")
    s += "".join(stroke(f"M{x},{150 - abs(x - 120) // 6} Q{x + 4},100 {120 + (x - 120) * .4},70", "#E2B456", 3, ' opacity="0.6"') for x in (80, 100, 140, 160))
    s += P("M66,128 Q120,146 174,128 L176,148 Q120,166 64,148Z", CORAL)
    s += "".join(P(wob(160 + math.cos(a) * 12, 130 + math.sin(a) * 12, 9, 6, .1, 3 + i, 10, math.degrees(a)), WHITE) for i, a in enumerate([k * math.pi / 3 for k in range(6)]))
    s += C(160, 130, 7, MUSTARD)
    return tool_doc(p, s, 523)


TOOL_TIP5 = {"honey": (84, 77), "aloe": (68, 46), "hat": (120, 120)}


def sick5(kind):
    """200x200 cards like sick-*: a scratchy throat, a sunburn."""
    p = f"sk5{kind[:2]}-"
    s = G(P(wob(100, 104, 90, 90, .02, 1, 30), "#FFFCF2"), p + "cut")
    if kind == "throat":
        s += C(100, 92, 52, "#F6C9A8") + C(82, 82, 5, INK) + C(118, 82, 5, INK) + P(wob(100, 112, 16, 12, .05, 2, 12), "#9C3A3E")
        s += P("M70,140 L130,140 L134,184 L66,184Z", "#F6C9A8") + P("M60,146 Q100,162 140,146 L142,166 Q100,182 58,166Z", CORAL)
        s += "".join(stroke(f"M{x},{y} l8,-6 l8,6 l8,-6", "#E2616E", 4) for x, y in ((140, 104), (36, 104)))
    else:  # sunburn
        s += star(46, 46, 26, MUSTARD, inner=.6) + C(46, 46, 16, "#FFE08A")
        s += C(110, 112, 56, "#F6C9A8") + C(92, 104, 5, INK) + C(128, 104, 5, INK) + stroke("M96,130 Q110,140 124,130", INK, 4)
        s += P(wob(110, 116, 14, 10, .1, 3, 12), "#F2606C", ' opacity="0.8"') + P(wob(78, 122, 16, 10, .1, 4, 12), "#F2606C", ' opacity="0.6"') + P(wob(142, 122, 16, 10, .1, 5, 12), "#F2606C", ' opacity="0.6"')
    return doc(p, 200, 200, G(s, p + "sh"), "smooth", seed=590 + len(kind), cut={"rim": 3, "rough": 4})


ITEMS5 = {
    "lens-throat": lens_throat, "clinic-tickle": tickle, "clinic-burn": burn, "tool-honey": honey, "tool-aloe": aloe,
    "tool-hat": sunhat, "sick-throat": lambda: sick5("throat"), "sick-sunburn": lambda: sick5("sunburn"),
}


if __name__ == "__main__":
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    for k, fn in ITEMS5.items():
        if not only or k in only:
            gc.save(k, fn())
    print("anchors: TOOL_TIP5", TOOL_TIP5, "TICKLES", TICKLES)
