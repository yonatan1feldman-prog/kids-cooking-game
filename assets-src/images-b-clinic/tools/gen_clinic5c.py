# images-b-clinic, round 5 (research/clinic-spec-5.md), part C: the hard level's little surprises. Shares gen_clinic.py's
# kit and palette; writes into images-b-clinic/.
# Run: python tools/gen_clinic5c.py [names...]   then copy the SVGs into public/assets/images and bake the WebPs.
# care-tongue: the tongue lifted over the lower middle teeth in the mouth close-up (a germ hides behind it; a touch moves
# it down). lens-eye-lid: the eye close-up's lid shut (the blink when the drops come too fast); light grey like lens-eye,
# so the game tints it to the patient.
import sys, os
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from gen_clinic import *  # noqa: F401,F403
import gen_clinic as gc

# Where the tongue sits in lens-mouth's 520 frame (its image centre), over TEETH[5] and TEETH[6].
TONGUE_AT = (260, 362)  # (shown at 0.85 of its size)


def tongue():
    """240x180: a soft pink tongue, lifted, its tip round at the top, a groove down the middle, a little shine."""
    p = "ctg-"
    body = "M20,176 Q14,60 120,22 Q226,60 220,176Z"
    s = G(P(body, "#E86D70"), p + "sh")
    s += P("M44,170 Q42,84 120,50 Q198,84 196,170Z", "#F08A8C", ' opacity="0.55"')
    s += stroke("M120,58 Q116,110 120,170", "#C9505E", 6, ' opacity="0.8"')
    s += P(wob(84, 82, 22, 12, .1, 3, 12, -30), "#FFC4C4", ' opacity="0.8"')
    return doc(p, 240, 180, s, "smooth", seed=521)


def eye_lid():
    """520x520 over lens-eye-ball (same frame): the eye shut, a soft lid over the whole almond, the lashes along a closed
    smile-shaped line (a happy, sleepy blink, never a squeeze). No shadow: it melts into the tinted skin."""
    p = "lel-"
    # (no shadow: tinted like lens-eye's skin, the lid melts into it; it reaches up over the open eye's lashes)
    lid = "M56,262 C110,52 410,52 464,262 Q260,414 56,262Z"
    s = P(lid, GREY)
    s += stroke("M110,232 Q260,170 410,232", GREY_D, 6, ' opacity="0.5"')
    s += stroke("M70,264 Q260,346 450,264", INK, 9)
    s += "".join(stroke(f"M{x},{y} q{dx},26 {dx * 1.4},40", INK, 7) for x, y, dx in ((140, 300, -8), (200, 322, -4), (260, 330, 0), (320, 322, 4), (380, 300, 8)))
    return lens_doc(p, s, 523)


ITEMS5C = {"care-tongue": tongue, "lens-eye-lid": eye_lid}


if __name__ == "__main__":
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    for k, fn in ITEMS5C.items():
        if not only or k in only:
            gc.save(k, fn())
    print("anchors: TONGUE_AT", TONGUE_AT)
