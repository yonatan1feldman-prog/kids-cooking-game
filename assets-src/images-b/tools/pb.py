# Shared kit for the style-B production set ("paper cut-out children's book").
# Every generator in this folder imports from here, so palette, paper texture and shadows stay identical.
# Derived from style-test/tools/gen_b.py (helpers copied so images-b is self-contained).
#
# Production changes vs the style test:
#  * palette: foreground colours brighter and more saturated; background colours stay calmer (see BG_*).
#  * paper(): grain now has paper FIBRES (anisotropic streaks) + fine tooth + very soft mottle that only
#    lightens/darkens a little. Presets per material so surfaces don't share one digital noise.
#  * cut(): torn/cut edge filter. A thin, irregular cream rim (the white core of cut paper) plus the
#    drop shadow, on chosen layers only. It also separates foreground items from the background.
import math, os, random

OUT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

# ---------------- palette ----------------
SH = "#3A2216"            # shadow colour (all shadows)
RIM = "#FFF8EA"           # torn paper core
CREAM = "#FBF0DA"; CREAM2 = "#F3E2C0"; PAPER = "#EFDBB2"; WHITE = "#FFFDF7"
# food
RED = "#EC5A3C"; RED_L = "#F8866A"; RED_D = "#C0412C"; SEEDPOCK = "#FDC19A"; SEED = "#FFF0C8"
SAUCE = "#D8432E"; SAUCE_L = "#E8654A"; SAUCE_D = "#AE3326"; HERB = "#5F8A3A"
CHEESE = "#FFD152"; CHEESE_L = "#FFE89A"; CHEESE_D = "#EAAA2E"
OLIVE = "#6B4468"; OLIVE_M = "#8A6187"; OLIVE_S = "#C3A3C0"; OLIVE_D = "#4A2D48"
MUSH = "#F6E3BE"; MUSH_CAP = "#94593A"; MUSH_CAP_L = "#BE8358"; GILL = "#D9AE7C"
CORN = "#FFC93A"; CORN_L = "#FFE27E"; CORN_D = "#E59E1C"
PEPPER = "#5DB043"; PEPPER_L = "#8ED06A"; PEPPER_D = "#3E8A2E"
ONION = "#C9669A"; ONION_L = "#F2B9D6"; ONION_D = "#9C4777"; ONION_W = "#FCEAF3"
DOUGH = "#F7DFAE"; DOUGH_L = "#FCEDCC"; DOUGH_D = "#E8C689"
CRUST = "#E0A35C"; CRUST_D = "#BD7E40"; CRUST_L = "#F0C07E"
# wood / kitchen things
WOOD = "#CB915F"; WOOD_D = "#A36D43"; WOOD_L = "#DDAA78"
WALNUT = "#9E643A"; WALNUT_D = "#774626"; WALNUT_L = "#BB8052"
TEAL = "#3F9EA3"; TEAL_L = "#7CC4C2"; TEAL_D = "#2D7A80"
MUSTARD = "#EEB23C"; RUST = "#C45A3C"; SAGE = "#95B676"; SAGE_D = "#739759"; SAGE_L = "#B6CF9C"
CORAL = "#F4773C"; CORAL_D = "#C8572A"; CORAL_L = "#FF9A62"
GREEN = "#62AE48"; GREEN_D = "#468A34"; GREEN_L = "#8FCB6C"
PINK = "#F3A6A0"; PINK_D = "#E0827E"
EYE = "#2E201B"; CHEEK = "#F0897A"
METAL = "#A9B4B1"; METAL_D = "#7F8B88"; METAL_L = "#D4DCD9"
# background (calmer: lighter, less chroma, so gameplay items pop)
BG_WALL = "#F3E4C6"; BG_WALL_M = "#E8D3AC"; BG_TILE = "#F7EDD8"; BG_TILE2 = "#EFE0C3"
BG_WOOD = "#D8AB7C"; BG_WOOD2 = "#DDB184"; BG_WOOD_D = "#B98659"; BG_WOOD_L = "#E6C096"
BG_SAGE = "#A9C090"; BG_SAGE_D = "#8CA776"; BG_SAGE_L = "#C3D5AE"


def n(v):
    s = f"{v:.1f}"
    return s[:-2] if s.endswith(".0") else s


# ---------------- shape helpers ----------------
def smooth(pts, t=1 / 6):
    """Closed Catmull-Rom spline through pts -> cubic bezier path data."""
    L = len(pts)
    d = f"M{n(pts[0][0])},{n(pts[0][1])}"
    for i in range(L):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % L], pts[(i + 2) % L]
        c1 = (p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t)
        c2 = (p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t)
        d += f"C{n(c1[0])},{n(c1[1])} {n(c2[0])},{n(c2[1])} {n(p2[0])},{n(p2[1])}"
    return d + "Z"


def smooth_open(pts, t=1 / 6):
    """Open Catmull-Rom spline (for strokes)."""
    L = len(pts)
    d = f"M{n(pts[0][0])},{n(pts[0][1])}"
    for i in range(L - 1):
        p0, p1, p2 = pts[max(i - 1, 0)], pts[i], pts[i + 1]
        p3 = pts[min(i + 2, L - 1)]
        c1 = (p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t)
        c2 = (p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t)
        d += f"C{n(c1[0])},{n(c1[1])} {n(c2[0])},{n(c2[1])} {n(p2[0])},{n(p2[1])}"
    return d


def wob(cx, cy, rx, ry, j=0.03, seed=1, k=22, rot=0):
    """Hand-cut ellipse: slightly irregular radius."""
    r = random.Random(seed)
    pts = []
    ca, sa = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    for i in range(k):
        a = i / k * 2 * math.pi
        f = 1 + (r.random() * 2 - 1) * j
        x, y = math.cos(a) * rx * f, math.sin(a) * ry * f
        pts.append((cx + x * ca - y * sa, cy + x * sa + y * ca))
    return smooth(pts)


def rrect_pts(x, y, w, h, rad, step=26):
    pts = []
    rad = min(rad, w / 2, h / 2)
    segs = [((x + rad, y), (x + w - rad, y)), ((x + w, y + rad), (x + w, y + h - rad)),
            ((x + w - rad, y + h), (x + rad, y + h)), ((x, y + h - rad), (x, y + rad))]
    corners = [(x + w - rad, y + rad, -90), (x + w - rad, y + h - rad, 0), (x + rad, y + h - rad, 90), (x + rad, y + rad, 180)]
    for i in range(4):
        (ax, ay), (bx, by) = segs[i]
        L = math.hypot(bx - ax, by - ay)
        m = max(1, int(L / step))
        for s in range(m):
            pts.append((ax + (bx - ax) * s / m, ay + (by - ay) * s / m))
        cx, cy, a0 = corners[i]
        for s in range(3):
            a = math.radians(a0 + s * 30)
            pts.append((cx + math.cos(a) * rad, cy + math.sin(a) * rad))
    return pts


def wrect(x, y, w, h, rad, j=1.5, seed=1, step=26):
    """Hand-cut rounded rectangle."""
    r = random.Random(seed)
    pts = [(px + (r.random() * 2 - 1) * j, py + (r.random() * 2 - 1) * j) for px, py in rrect_pts(x, y, w, h, rad, step)]
    return smooth(pts)


def spiky(cx, cy, rin, rout, a0, a1, count, seed=1, ry_scale=1.0):
    r = random.Random(seed)
    pts = [(cx, cy)]
    for i in range(count * 2 + 1):
        a = math.radians(a0 + (a1 - a0) * i / (count * 2))
        rr = (rout * (1 + (r.random() - .5) * .08)) if i % 2 else rin
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr * ry_scale))
    return "M" + " L".join(f"{n(x)},{n(y)}" for x, y in pts) + "Z"


def P(d, fill, extra=""):
    return f'<path d="{d}" fill="{fill}"{extra}/>'


def E(cx, cy, rx, ry, fill, extra=""):
    return f'<ellipse cx="{n(cx)}" cy="{n(cy)}" rx="{n(rx)}" ry="{n(ry)}" fill="{fill}"{extra}/>'


def C(cx, cy, r, fill, extra=""):
    return f'<circle cx="{n(cx)}" cy="{n(cy)}" r="{n(r)}" fill="{fill}"{extra}/>'


def G(inner, filt=None, extra=""):
    f = f' filter="url(#{filt})"' if filt else ""
    return f"<g{f}{extra}>{inner}</g>"


def stroke(d, col, w, extra=""):
    return f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{n(w)}" stroke-linecap="round" stroke-linejoin="round"{extra}/>'


# ---------------- colour helpers ----------------
def rgb(h):
    h = h.lstrip("#")
    return [int(h[i:i + 2], 16) for i in (0, 2, 4)]


def hexc(c):
    return "#" + "".join(f"{max(0, min(255, round(v))):02X}" for v in c)


def mix(a, b, t):
    A, B = rgb(a), rgb(b)
    return hexc([A[i] + (B[i] - A[i]) * t for i in range(3)])


def lum(h):
    r, g, b = rgb(h)
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255


# ---------------- filters ----------------
# Filter ids must be unique per file; pass a short prefix p (e.g. "tom-").
def f_shadow(fid, dy=4, blur=3.5, op=0.33, dx=0):
    return (f'<filter id="{fid}" x="-25%" y="-25%" width="150%" height="160%" color-interpolation-filters="sRGB">'
            f'<feGaussianBlur in="SourceAlpha" stdDeviation="{blur}"/><feOffset dx="{dx}" dy="{dy}" result="b"/>'
            f'<feFlood flood-color="{SH}" flood-opacity="{op}"/><feComposite in2="b" operator="in" result="s"/>'
            f'<feMerge><feMergeNode in="s"/><feMergeNode in="SourceGraphic"/></feMerge></filter>')


def f_cut(fid, rim=2.2, rough=4.0, freq=0.22, seed=5, dy=4, blur=3.5, op=0.33, rim_col=RIM, rim_op=0.95, dx=0):
    """Torn/cut paper edge: irregular cream rim just outside the shape + drop shadow under it.
    rim = rim width (user units), rough = how ragged the rim is, freq = raggedness frequency."""
    return (f'<filter id="{fid}" x="-20%" y="-20%" width="140%" height="150%" color-interpolation-filters="sRGB">'
            f'<feMorphology in="SourceAlpha" operator="dilate" radius="{rim}" result="dil"/>'
            f'<feTurbulence type="fractalNoise" baseFrequency="{freq}" numOctaves="2" seed="{seed}" result="tn"/>'
            f'<feDisplacementMap in="dil" in2="tn" scale="{rough}" xChannelSelector="R" yChannelSelector="G" result="rg"/>'
            f'<feFlood flood-color="{rim_col}" flood-opacity="{rim_op}"/><feComposite in2="rg" operator="in" result="rim"/>'
            f'<feGaussianBlur in="rg" stdDeviation="{blur}"/><feOffset dx="{dx}" dy="{dy}" result="b"/>'
            f'<feFlood flood-color="{SH}" flood-opacity="{op}"/><feComposite in2="b" operator="in" result="s"/>'
            f'<feMerge><feMergeNode in="s"/><feMergeNode in="rim"/><feMergeNode in="SourceGraphic"/></feMerge></filter>')


# Material presets for paper(): (tooth freq, tooth strength, fibre freq x/y, fibre strength, mottle strength, mottle freq)
MATERIALS = {
    "default": dict(freq=0.9, tooth=0.5, fib=(0.16, 0.7), fibre=0.13, mottle=0.10, mfreq=0.018),
    "smooth":  dict(freq=1.0, tooth=0.32, fib=(0.18, 0.8), fibre=0.08, mottle=0.06, mfreq=0.012),   # dough, skin, faces
    "rough":   dict(freq=0.8, tooth=0.6, fib=(0.13, 0.6), fibre=0.18, mottle=0.14, mfreq=0.02),   # card, wood, bins
    "bg":      dict(freq=0.75, tooth=0.5, fib=(0.12, 0.55), fibre=0.12, mottle=0.22, mfreq=0.006),  # background
}


def f_paper(fid, material="default", seed=3, scale=1.0, **over):
    """Paper texture applied to a group: fine tooth (light+dark specks), fibre streaks, very soft mottle.
    scale>1 makes the texture coarser (for files shown much smaller than native, keep 1)."""
    m = dict(MATERIALS[material]); m.update(over)
    fq = m["freq"] / scale
    fx, fy = m["fib"][0] / scale, m["fib"][1] / scale
    t, fb, mo = m["tooth"], m["fibre"], m["mottle"]
    return (f'<filter id="{fid}" x="-20%" y="-20%" width="140%" height="150%" color-interpolation-filters="sRGB">'
            # tooth: dark specks where noise is high, light where low
            f'<feTurbulence type="fractalNoise" baseFrequency="{fq:.3f}" numOctaves="2" seed="{seed}" result="n"/>'
            f'<feColorMatrix in="n" type="matrix" values="0 0 0 0 0.24 0 0 0 0 0.14 0 0 0 0 0.08 {1.4 * t:.2f} 0 0 0 {-0.78 * t:.2f}" result="d"/>'
            f'<feColorMatrix in="n" type="matrix" values="0 0 0 0 1 0 0 0 0 0.98 0 0 0 0 0.92 {-1.5 * t:.2f} 0 0 0 {0.56 * t:.2f}" result="l"/>'
            # fibres: stretched noise, only the peaks survive -> thin light strands + fewer darker strands
            f'<feTurbulence type="fractalNoise" baseFrequency="{fx:.3f} {fy:.3f}" numOctaves="3" seed="{seed + 11}" result="f"/>'
            f'<feColorMatrix in="f" type="matrix" values="0 0 0 0 1 0 0 0 0 0.98 0 0 0 0 0.93 {7 * fb:.2f} 0 0 0 {-4.35 * fb:.2f}" result="fl"/>'
            f'<feColorMatrix in="f" type="matrix" values="0 0 0 0 0.3 0 0 0 0 0.18 0 0 0 0 0.1 {-6 * fb:.2f} 0 0 0 {1.62 * fb:.2f}" result="fd"/>'
            # mottle: very large, faint, both directions
            f'<feTurbulence type="fractalNoise" baseFrequency="{m["mfreq"] / scale:.4f}" numOctaves="2" seed="{seed + 7}" result="m"/>'
            f'<feColorMatrix in="m" type="matrix" values="0 0 0 0 0.3 0 0 0 0 0.17 0 0 0 0 0.08 {0.9 * mo:.2f} 0 0 0 {-0.38 * mo:.2f}" result="md"/>'
            f'<feColorMatrix in="m" type="matrix" values="0 0 0 0 1 0 0 0 0 0.97 0 0 0 0 0.9 {-0.9 * mo:.2f} 0 0 0 {0.52 * mo:.2f}" result="ml"/>'
            # a second, weaker fibre set in the other direction so strands don't all run one way
            f'<feTurbulence type="fractalNoise" baseFrequency="{fy * .8:.3f} {fx * 1.3:.3f}" numOctaves="3" seed="{seed + 19}" result="f2"/>'
            f'<feColorMatrix in="f2" type="matrix" values="0 0 0 0 1 0 0 0 0 0.98 0 0 0 0 0.93 {5 * fb:.2f} 0 0 0 {-3.2 * fb:.2f}" result="fl2"/>'
            f'<feMerge result="g"><feMergeNode in="md"/><feMergeNode in="ml"/><feMergeNode in="fd"/><feMergeNode in="fl"/><feMergeNode in="fl2"/><feMergeNode in="d"/><feMergeNode in="l"/></feMerge>'
            f'<feComposite in="g" in2="SourceGraphic" operator="in" result="gc"/>'
            f'<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="gc"/></feMerge></filter>')


def f_blur(fid, s):
    return f'<filter id="{fid}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="{s}"/></filter>'


def std_defs(p, material="default", seed=3, sh=(4, 3.5, .33), sh2=(8, 7, .28), cut=None, blur=6, tex_scale=1.0):
    """Standard filter set for one file, ids: {p}gr (paper), {p}sh, {p}sh2 (shadows), {p}cut (torn edge), {p}bl (blur).
    cut: dict of f_cut kwargs (defaults are good for items drawn at ~1x)."""
    d = f_paper(p + "gr", material, seed, tex_scale) + f_shadow(p + "sh", *sh) + f_shadow(p + "sh2", *sh2) + f_blur(p + "bl", blur)
    ck = {"dy": sh[0], "blur": sh[1], "op": sh[2], "seed": seed + 2}
    ck.update(cut or {})
    d += f_cut(p + "cut", **ck)
    return d


def svg(w, h, defs, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
            f'<defs>{defs}</defs>{body}</svg>')


def write(name, s, sub=""):
    d = os.path.join(OUT, sub) if sub else OUT
    os.makedirs(d, exist_ok=True)
    path = os.path.join(d, name + ".svg")
    with open(path, "w", encoding="utf8") as f:
        f.write(s)
    return path, len(s.encode("utf8"))


def ground_shadow(cx, cy, rx, ry, p, op=0.35):
    """Soft contact shadow for standing items."""
    return G(E(cx, cy, rx, ry, SH, f' opacity="{op}"'), p + "bl")
