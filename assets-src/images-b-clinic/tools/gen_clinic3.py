# images-b-clinic, round 3 (the clinic in the style of "Doctor Games for kids": big close-ups with lots of small things to
# clean and fix; research/clinic-doctor-games.md). Shares gen_clinic.py's kit and palette; writes into images-b-clinic/.
# Run: python tools/gen_clinic3.py [names...]   then copy the SVGs into public/assets/images and bake the WebPs.
# The anchors the game relies on are printed at the end (ART.clinic in src/core/assets.ts).
# Nothing here is scary: the germs are silly and cheeky (big eyes, a grin), the bug is a smiling ladybird, no blood.
import sys, os, math, random
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from gen_clinic import *  # noqa: F401,F403  (the kit, the palette, doc / tool_doc / lens_doc, save)
import gen_clinic as gc

# ================================================================ the new close-ups (520 frame like the others)
EYE_C = (260, 262)
EAR_HOLE = (282, 300)


def lens_eye():
    """A big open eye (the lids and skin light grey: tinted to the patient; the eyeball not tinted, so it is drawn on its
    own layer: lens-eye-ball). EYE_C is the pupil."""
    p = "ley-"
    s = rect(0, 0, 520, 520, GREY)
    s += P(wob(260, 140, 210, 40, .05, 3, 24), GREY_D, ' opacity="0.35"')   # the brow's shade
    s += stroke("M90,128 Q260,70 430,128", GREY_D, 22, ' opacity="0.7"')    # the brow
    s += P(wob(260, 380, 190, 30, .05, 4, 20), GREY_L, ' opacity="0.6"')    # the cheek's light
    return lens_doc(p, s, 321)


def lens_eye_ball():
    """The eyeball over lens-eye (not tinted): white, a big blue iris, the pupil, two shines, the lashes."""
    p = "leb-"
    cx, cy = EYE_C
    almond = f"M70,{cy} Q260,110 450,{cy} Q260,400 70,{cy}Z"
    s = G(P(almond, "#FFFFFF"), p + "sh")
    clip = f'<clipPath id="{p}al"><path d="{almond}"/></clipPath>'
    inner = C(cx, cy, 92, "#6FB7D9") + C(cx, cy, 72, "#4C97C0") + C(cx, cy, 44, "#22303A")
    inner += C(cx - 24, cy - 28, 18, WHITE, ' opacity="0.95"') + C(cx + 26, cy + 22, 8, WHITE, ' opacity="0.8"')
    inner += "".join(stroke(f"M{n(cx + math.cos(a) * 50)},{n(cy + math.sin(a) * 50)} L{n(cx + math.cos(a) * 84)},{n(cy + math.sin(a) * 84)}", "#8FCBE6", 4, ' opacity="0.6"')
                     for a in [i * math.pi / 8 for i in range(16)])
    s += f'<g clip-path="url(#{p}al)">{inner}</g>'
    s += stroke(f"M66,{cy} Q260,104 454,{cy}", INK, 9)
    s += "".join(stroke(f"M{n(x)},{n(y)} q{n(dx)},-30 {n(dx * 1.6)},-46", INK, 7)
                 for x, y, dx in ((130, 196, -10), (190, 168, -6), (260, 158, 0), (330, 168, 6), (390, 196, 10)))
    s += stroke(f"M84,{cy + 8} Q260,388 436,{cy + 8}", INK, 4, ' opacity="0.45"')
    return svg(520, 520, std_defs(p, "smooth", 322, (4, 3.5, .25), (8, 7, .2)) + clip, G(s, p + "gr"))


def eye_red():
    """520x520 over lens-eye-ball (same frame): the white of the eye pink with soft little veins from the corners; it
    fades as the eye gets better."""
    p = "oer-"
    cx, cy = EYE_C
    almond = f"M76,{cy} Q260,116 444,{cy} Q260,394 76,{cy}Z"
    clip = f'<clipPath id="{p}al"><path d="{almond}"/></clipPath>'
    rr = random.Random(7)
    inner = P(almond, "#F4A0A8", ' opacity="0.42"')
    for i in range(10):
        left = i % 2 == 0
        x0 = 80 if left else 440
        y0 = cy + rr.uniform(-36, 36)
        x1 = x0 + (rr.uniform(60, 110) if left else -rr.uniform(60, 110))
        y1 = y0 + rr.uniform(-28, 28)
        inner += stroke(f"M{n(x0)},{n(y0)} Q{n((x0 + x1) / 2)},{n(y0 + rr.uniform(-18, 18))} {n(x1)},{n(y1)}", "#E2616E", 4, ' opacity="0.75"')
    body = f'<g clip-path="url(#{p}al)">{inner}</g>'
    return svg(520, 520, std_defs(p, "smooth", 323) + clip, G(body, p + "gr"))


def lens_ear():
    """An ear seen from the side (light grey: tinted): the outer rim, the inner fold and the dark hole (EAR_HOLE)."""
    p = "lea-"
    s = rect(0, 0, 520, 520, GREY_L)
    ear = "M250,40 Q430,40 440,220 Q450,360 360,430 Q300,480 250,470 Q200,460 210,400 Q160,360 150,260 Q140,60 250,40Z"
    s += G(P(ear, GREY), p + "sh")
    s += P("M258,90 Q380,94 390,220 Q396,330 330,390 Q290,420 268,404 Q300,330 250,270 Q200,200 258,90Z", GREY_D, ' opacity="0.45"')
    hx, hy = EAR_HOLE
    s += P(wob(hx, hy, 66, 74, .05, 2, 22), "#5C3A33", ' opacity="0.85"') + P(wob(hx + 6, hy + 8, 42, 50, .06, 3, 18), "#3A2420")
    s += stroke("M300,70 Q410,90 412,220", WHITE, 10, ' opacity="0.45"')
    return lens_doc(p, s, 324)


def lens_xray():
    """The tummy on the x-ray screen (not tinted): navy, light blue ribs and spine, the round tummy outline."""
    p = "lxr-"
    s = rect(0, 0, 520, 520, "#203A5C") + C(260, 260, 240, "#284A72", ' opacity="0.9"')
    body = "M150,-10 Q120,200 140,330 Q160,470 260,500 Q360,470 380,330 Q400,200 370,-10Z"
    s += P(body, "#3D6E9E", ' opacity="0.8"')
    s += P(wob(260, 340, 105, 95, .04, 5, 24), "#4F87B8", ' opacity="0.8"')   # the tummy
    s += "".join(rect(250, y, 20, 26, "#CFE9F7", ' rx="6" opacity="0.9"') for y in range(0, 230, 34))  # the spine
    for i, y in enumerate((40, 92, 144, 196)):
        w = 150 - i * 8
        s += stroke(f"M248,{y} Q{248 - w * .6},{y - 6} {248 - w},{y + 34}", "#CFE9F7", 13, ' opacity="0.85"')
        s += stroke(f"M272,{y} Q{272 + w * .6},{y - 6} {272 + w},{y + 34}", "#CFE9F7", 13, ' opacity="0.85"')
    s += "".join(stroke(f"M0,{y} L520,{y}", "#8EC3DB", 2, ' opacity="0.12"') for y in range(10, 520, 16))  # scan lines
    return lens_doc(p, s, 325)


# ================================================================ the things to clean, fix and take out
def germ(kind):
    """130x130: a silly germ: a bumpy blob, big eyes, a cheeky grin with its tongue out, two little arms waving."""
    col, dark, light = {"a": ("#8BD16B", "#5FA548", "#B5E69A"), "b": ("#B78BE3", "#8A5CC0", "#D7BCF2"),
                        "c": ("#F7A65A", "#D97E30", "#FFC992")}[kind]
    p = f"ogm{kind}-"
    seed = ord(kind)
    s = stroke("M22,80 q-14,-16 -4,-30", dark, 9) + stroke("M108,80 q14,-16 4,-30", dark, 9)
    s += P(spiky(65, 70, 44, 52, 0, 360, 9, seed), dark) + P(wob(65, 70, 44, 42, .06, seed, 22), col)
    s += P(wob(54, 50, 16, 9, .1, seed + 1, 12, -25), light, ' opacity="0.9"')
    for ex in (50, 80):
        s += C(ex, 64, 13, WHITE) + C(ex + 2, 66, 7, INK) + C(ex + 4, 63, 2.6, WHITE)
    s += P("M46,84 Q65,102 84,84 Q65,92 46,84Z", INK) + P(wob(70, 92, 7, 6, .1, seed + 2, 10), "#F27C8C")
    return doc(p, 130, 130, G(s, p + "sh"), "smooth", seed=330 + seed, cut={"rim": 2.4, "rough": 3})


def tooth_hole():
    """70x70: a little brown hole in a tooth (a star fills it)."""
    p = "oth-"
    s = P(wob(35, 35, 22, 19, .12, 1, 14), "#9A6A3C", ' opacity="0.9"') + P(wob(37, 37, 12, 10, .15, 2, 12), "#5E3A1E", ' opacity="0.9"')
    return doc(p, 70, 70, s, "smooth", seed=341)


def tooth_star():
    """90x90: the golden star that fills the hole (shiny)."""
    p = "ots-"
    s = star(45, 47, 38, MUSTARD) + star(45, 47, 24, "#FFE08A") + P(wob(36, 34, 8, 4, .1, 2, 10, -30), WHITE, ' opacity="0.9"')
    return doc(p, 90, 90, G(s, p + "sh"), "smooth", seed=342, cut={"rim": 2, "rough": 2.5})


def food_bit():
    """90x80: a bit of green leaf stuck on a tooth (washed away by the water spray)."""
    p = "ofb-"
    s = P("M12,52 Q30,10 78,18 Q70,62 12,52Z", GREEN) + stroke("M16,50 Q44,34 74,22", GREEN_D, 4)
    s += P(wob(34, 62, 9, 7, .2, 3, 10), CRUST_L)
    return doc(p, 90, 80, G(s, p + "sh"), "smooth", seed=343)


def eye_speck():
    """90x50: a stray eyelash with a fleck of dust (the tweezers take it out)."""
    p = "oes-"
    s = stroke("M10,36 Q40,6 80,20", INK, 6) + C(60, 32, 7, "#B89874")
    return doc(p, 90, 50, G(s, p + "sh"), "smooth", seed=344)


def ear_wax():
    """90x80: a soft yellow blob of ear wax (the cotton swab cleans it)."""
    p = "oew-"
    s = P(wob(45, 42, 32, 26, .14, 1, 16), "#E5B34A") + P(wob(38, 34, 12, 8, .15, 2, 12, -20), "#F6D78A", ' opacity="0.9"')
    return doc(p, 90, 80, G(s, p + "sh"), "smooth", seed=345)


def ear_bug():
    """130x120: a smiling ladybird, shell open a little (it got lost in the ear; out it flies, happy)."""
    p = "oeb-"
    s = P(wob(46, 34, 26, 12, .1, 4, 14, -30), "#DDF0F7", ' opacity="0.85"') + P(wob(84, 34, 26, 12, .1, 5, 14, 30), "#DDF0F7", ' opacity="0.85"')
    s += C(65, 74, 42, "#E2453C") + stroke("M65,34 L65,114", INK, 4)
    s += "".join(C(x, y, 7, INK) for x, y in ((46, 66), (84, 66), (50, 94), (80, 94)))
    s += C(65, 34, 22, INK) + C(57, 30, 6, WHITE) + C(73, 30, 6, WHITE) + C(58, 31, 3, INK) + C(74, 31, 3, INK)
    s += stroke("M58,42 Q65,48 72,42", WHITE, 3) + stroke("M56,16 q-6,-10 -14,-8", INK, 3) + stroke("M74,16 q6,-10 14,-8", INK, 3)
    return doc(p, 130, 120, G(s, p + "sh"), "smooth", seed=346)


# ================================================================ the new tools (240 frame; tips printed at the end)
def filler():
    """A dentist's star pen: a mint handle, a gold star at its tip (it fills a hole with a star)."""
    p = "tfi-"
    t = ' transform="rotate(-40 120 120)"'
    s = P(wr(106, 60, 28, 170, 14, 1, 1), AQUA, t) + P(wr(112, 70, 10, 140, 5, 1, 2), AQUA_L, t)
    s += rect(114, 26, 12, 40, METAL_D, t) + "".join(rect(106, y, 28, 6, AQUA_D, t) for y in (150, 166, 182))
    s += star(62, 52, 30, MUSTARD) + star(62, 52, 18, "#FFE08A")
    return tool_doc(p, s, 351)


def cotton():
    """A fluffy cotton ball (its middle is the tip: it wipes the tears)."""
    p = "tco-"
    s = "".join(P(wob(120 + dx, 120 + dy, r, r * .9, .06, i, 16), WHITE) for i, (dx, dy, r) in enumerate(((-36, 10, 44), (30, 12, 46), (0, -24, 50), (0, 28, 44))))
    s += "".join(P(wob(120 + dx, 120 + dy, 14, 9, .15, 10 + i, 10), GREY_L, ' opacity="0.8"') for i, (dx, dy) in enumerate(((-30, 26), (34, 30), (6, -6))))
    return tool_doc(p, s, 352)


def eyedrops():
    """A little dropper bottle, its nozzle pointing down (the drop falls from the tip)."""
    p = "ted-"
    s = P(wr(84, 40, 72, 110, 22, 1, 1), SKY) + P(wr(94, 56, 52, 80, 16, 1, 2), SKY_L, ' opacity="0.8"')
    s += heart(120, 100, .4, HEART_L) + P(wr(90, 18, 60, 30, 10, 1, 3), HEART)
    s += P("M100,148 L140,148 L128,196 L112,196Z", WHITE) + P("M112,196 L128,196 L122,214 L118,214Z", SKY_D)
    s += P("M120,222 Q128,234 120,240 Q112,234 120,222Z", "#9FD4F0")
    return tool_doc(p, s, 353)


def swab():
    """A cotton swab, one fluffy end at the lower left (the tip)."""
    p = "tsw-"
    s = stroke("M66,174 L180,60", "#F3E2C0", 12) + stroke("M66,174 L180,60", WHITE, 7)
    s += P(wob(58, 182, 26, 18, .08, 1, 16, -45), WHITE) + P(wob(186, 54, 22, 15, .08, 2, 16, -45), WHITE)
    s += P(wob(52, 178, 10, 5, .1, 3, 10, -45), GREY_L, ' opacity="0.8"')
    return tool_doc(p, s, 354)


def penlight():
    """A doctor's little torch, its light at the lower left (the tip)."""
    p = "tli-"
    t = ' transform="rotate(45 120 120)"'
    s = P(wr(102, 30, 36, 150, 14, 1, 1), NURSE_D, t) + P(wr(108, 40, 12, 120, 6, 1, 2), NURSE, t)
    s += P(wr(96, 170, 48, 40, 10, 1, 3), METAL_D, t) + P(wr(102, 176, 36, 26, 8, 1, 4), "#FFF3B0", t)
    s += rect(130, 50, 6, 50, METAL_L, t)
    return tool_doc(p, s, 355)


def icepack():
    """A soft blue ice pack with a snowflake (held on the hot forehead)."""
    p = "tic-"
    s = P(wr(36, 66, 168, 116, 34, 2, 1), "#8FD0EE") + P(wr(50, 80, 140, 88, 26, 1.5, 2), "#BFE6F7", ' opacity="0.8"')
    for a in range(0, 180, 60):
        r = math.radians(a)
        s += stroke(f"M{n(120 - math.cos(r) * 30)},{n(124 - math.sin(r) * 30)} L{n(120 + math.cos(r) * 30)},{n(124 + math.sin(r) * 30)}", WHITE, 7)
    s += C(120, 124, 8, WHITE) + P(wob(72, 90, 18, 8, .1, 3, 10, -15), WHITE, ' opacity="0.8"')
    return tool_doc(p, s, 356)


def xray():
    """The x-ray scanner: a mint frame with a navy screen and a handle (the screen's middle is the tip)."""
    p = "txr-"
    s = P(wr(150, 140, 30, 84, 12, 1, 1), AQUA_D) + P(wr(28, 28, 170, 140, 24, 1.4, 2), AQUA)
    s += P(wr(44, 44, 138, 108, 14, 1, 3), "#203A5C") + "".join(stroke(f"M{n(60 + i * 26)},60 Q{n(54 + i * 26)},90 {n(62 + i * 26)},130", "#CFE9F7", 6, ' opacity="0.8"') for i in range(5))
    s += C(178, 186, 8, HEART)
    return tool_doc(p, s, 357)


TOOL_TIP3 = {"filler": (62, 52), "cotton": (120, 120), "eyedrops": (120, 216), "swab": (58, 182), "light": (66, 174),
             "icepack": (120, 124), "xray": (113, 98)}


def sick3(kind):
    """200x200 cards like sick-*: a red eye, an ear with a ladybird."""
    p = f"sk3{kind[:2]}-"
    s = G(P(wob(100, 104, 90, 90, .02, 1, 30), "#FFFCF2"), p + "cut")
    if kind == "eye":
        s += P("M30,104 Q100,40 170,104 Q100,168 30,104Z", WHITE, ' stroke="#3A2A22" stroke-width="5"')
        s += C(100, 104, 30, "#4C97C0") + C(100, 104, 16, INK) + C(92, 96, 6, WHITE)
        s += stroke("M40,104 Q56,96 66,106", "#E2616E", 4) + stroke("M160,104 Q144,112 134,102", "#E2616E", 4)
        s += P("M150,140 Q160,156 150,166 Q140,156 150,140Z", "#9FD4F0")
    else:
        s += P("M96,30 Q160,30 162,96 Q164,150 128,170 Q104,184 92,160 Q70,140 66,100 Q62,34 96,30Z", "#F6C9A8")
        s += P(wob(108, 110, 20, 24, .05, 2, 14), "#5C3A33")
        s += C(108, 112, 12, "#E2453C") + C(108, 102, 7, INK) + "".join(stroke(f"M{x},{y} q8,-6 16,0", CORAL, 4) for x, y in ((40, 60), (150, 40)))
    return doc(p, 200, 200, G(s, p + "sh"), "smooth", seed=560 + len(kind), cut={"rim": 3, "rough": 4})


ITEMS3 = {
    "lens-eye": lens_eye, "lens-eye-ball": lens_eye_ball, "clinic-eye-red": eye_red, "lens-ear": lens_ear, "lens-xray": lens_xray,
    "germ-a": lambda: germ("a"), "germ-b": lambda: germ("b"), "germ-c": lambda: germ("c"),
    "tooth-hole": tooth_hole, "tooth-star": tooth_star, "food-bit": food_bit, "eye-speck": eye_speck,
    "ear-wax": ear_wax, "ear-bug": ear_bug,
    "tool-filler": filler, "tool-cotton": cotton, "tool-eyedrops": eyedrops, "tool-swab": swab, "tool-light": penlight,
    "tool-icepack": icepack, "tool-xray": xray, "sick-eye": lambda: sick3("eye"), "sick-ear": lambda: sick3("ear"),
}


if __name__ == "__main__":
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    for k, fn in ITEMS3.items():
        if not only or k in only:
            gc.save(k, fn())
    print("anchors: TOOL_TIP3", TOOL_TIP3, "EYE_C", EYE_C, "EAR_HOLE", EAR_HOLE)
