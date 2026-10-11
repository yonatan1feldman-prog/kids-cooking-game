# A small painting kit for the puzzle pictures (images-b-puzzle): 800 x 800 SVGs in a soft, painterly-realistic
# look (light from the top left, gradients, fur and grass as many short brush strokes, a blurred background, a
# warm grade and a little canvas grain on top). Everything is generated here; nothing is downloaded.
import math, random

S = 800


def n(v):
    s = f"{v:.1f}"
    return s[:-2] if s.endswith(".0") else s


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def rgbhex(c):
    return "#%02X%02X%02X" % tuple(max(0, min(255, int(round(v)))) for v in c)


def mix(a, b, t):
    A, B = hexrgb(a), hexrgb(b)
    return rgbhex(tuple(A[i] + (B[i] - A[i]) * t for i in range(3)))


def jit(col, rnd, amt=14):
    c = hexrgb(col)
    d = rnd.uniform(-amt, amt)
    return rgbhex(tuple(v + d + rnd.uniform(-amt, amt) * 0.4 for v in c))


def smooth(pts, closed=True):
    """A Catmull-Rom curve through the points, as SVG cubic segments."""
    m = len(pts)
    if m < 3:
        return "M" + " L".join(f"{n(x)} {n(y)}" for x, y in pts)
    d = f"M{n(pts[0][0])} {n(pts[0][1])}"
    rng = range(m) if closed else range(m - 1)
    for i in rng:
        p0 = pts[(i - 1) % m] if closed or i > 0 else pts[i]
        p1 = pts[i]
        p2 = pts[(i + 1) % m]
        p3 = pts[(i + 2) % m] if closed or i + 2 < m else p2
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f" C{n(c1[0])} {n(c1[1])} {n(c2[0])} {n(c2[1])} {n(p2[0])} {n(p2[1])}"
    return d + (" Z" if closed else "")


def blob(cx, cy, rx, ry, jitter=0.04, seed=1, k=14, rot=0):
    rnd = random.Random(seed)
    ph = [rnd.uniform(0, 6.28) for _ in range(3)]
    pts = []
    cr, sr = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    for i in range(k):
        a = 2 * math.pi * i / k
        f = 1 + jitter * (math.sin(2 * a + ph[0]) * 0.6 + math.sin(3 * a + ph[1]) * 0.3 + math.sin(5 * a + ph[2]) * 0.2)
        x, y = rx * f * math.cos(a), ry * f * math.sin(a)
        pts.append((cx + x * cr - y * sr, cy + x * sr + y * cr))
    return smooth(pts)


class Doc:
    def __init__(self, seed=1):
        self.defs = []
        self.body = []
        self.ids = 0
        self.rnd = random.Random(seed)

    def id(self, p="d"):
        self.ids += 1
        return f"{p}{self.ids}"

    def add(self, s):
        self.body.append(s)

    # ---- paint
    def lin(self, stops, x1=0, y1=0, x2=0, y2=1, user=False):
        i = self.id("g")
        u = ' gradientUnits="userSpaceOnUse"' if user else ""
        st = "".join(f'<stop offset="{o}" stop-color="{c}"' + (f' stop-opacity="{a}"' if a != 1 else "") + "/>" for o, c, a in _stops(stops))
        self.defs.append(f'<linearGradient id="{i}" x1="{n(x1)}" y1="{n(y1)}" x2="{n(x2)}" y2="{n(y2)}"{u}>{st}</linearGradient>')
        return f"url(#{i})"

    def rad(self, stops, cx=0.5, cy=0.5, r=0.5, fx=None, fy=None, user=False):
        i = self.id("g")
        u = ' gradientUnits="userSpaceOnUse"' if user else ""
        f = (f' fx="{n(fx)}"' if fx is not None else "") + (f' fy="{n(fy)}"' if fy is not None else "")
        st = "".join(f'<stop offset="{o}" stop-color="{c}"' + (f' stop-opacity="{a}"' if a != 1 else "") + "/>" for o, c, a in _stops(stops))
        self.defs.append(f'<radialGradient id="{i}" cx="{n(cx)}" cy="{n(cy)}" r="{n(r)}"{f}{u}>{st}</radialGradient>')
        return f"url(#{i})"

    def blur(self, sd):
        i = self.id("b")
        self.defs.append(f'<filter id="{i}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="{sd}"/></filter>')
        return f' filter="url(#{i})"'

    def wobble(self, scale=6, freq=0.035, seed=3, blur=0):
        """Painterly edges: the shape's outline is pushed about by a soft noise."""
        i = self.id("w")
        b = f'<feGaussianBlur stdDeviation="{blur}"/>' if blur else ""
        self.defs.append(
            f'<filter id="{i}" x="-10%" y="-10%" width="120%" height="120%">'
            f'<feTurbulence type="fractalNoise" baseFrequency="{freq}" numOctaves="2" seed="{seed}" result="t"/>'
            f'<feDisplacementMap in="SourceGraphic" in2="t" scale="{scale}" xChannelSelector="R" yChannelSelector="G"/>{b}</filter>')
        return f' filter="url(#{i})"'

    def clip(self, d):
        i = self.id("c")
        self.defs.append(f'<clipPath id="{i}"><path d="{d}"/></clipPath>')
        return f' clip-path="url(#{i})"'

    def svg(self, grade=True, grain=0.10, vignette=0.28, warm="#FFD9A0", warmth=0.10):
        top = []
        if grade:
            if warmth:
                top.append(f'<rect width="{S}" height="{S}" fill="{warm}" opacity="{warmth}" style="mix-blend-mode:soft-light"/>')
            if vignette:
                v = self.rad([(0, "#000000", 0), (0.62, "#000000", 0), (1, "#2A1606", vignette)], 0.5, 0.48, 0.75)
                top.append(f'<rect width="{S}" height="{S}" fill="{v}"/>')
            if grain:
                gi = self.id("n")
                self.defs.append(
                    f'<filter id="{gi}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7"/>'
                    f'<feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.42  0 0 0 0 0.33  0 0 0 2.2 -0.9"/></filter>')
                top.append(f'<rect width="{S}" height="{S}" filter="url(#{gi})" opacity="{grain}" style="mix-blend-mode:overlay"/>')
        return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{S}" height="{S}" viewBox="0 0 {S} {S}">'
                f'<defs>{"".join(self.defs)}</defs>{"".join(self.body)}{"".join(top)}</svg>\n')


def _stops(stops):
    out = []
    for s in stops:
        if len(s) == 2:
            out.append((s[0], s[1], 1))
        else:
            out.append(s)
    return out


def P(d, fill, extra=""):
    return f'<path d="{d}" fill="{fill}"{extra}/>'


def E(cx, cy, rx, ry, fill, extra=""):
    return f'<ellipse cx="{n(cx)}" cy="{n(cy)}" rx="{n(rx)}" ry="{n(ry)}" fill="{fill}"{extra}/>'


def C(cx, cy, r, fill, extra=""):
    return f'<circle cx="{n(cx)}" cy="{n(cy)}" r="{n(r)}" fill="{fill}"{extra}/>'


def R(x, y, w, h, fill, extra="", rx=0):
    return f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}" rx="{n(rx)}" fill="{fill}"{extra}/>'


def G(body, extra=""):
    return f"<g{extra}>{body}</g>"


def line(x1, y1, x2, y2, col, w, extra=""):
    return f'<path d="M{n(x1)} {n(y1)} L{n(x2)} {n(y2)}" stroke="{col}" stroke-width="{n(w)}" stroke-linecap="round" fill="none"{extra}/>'


def strokes(rnd, count, where, colors, length, width, angle, curve=0.25, alpha=(0.55, 0.95)):
    """Many short brush strokes: `where()` gives a point, `angle(x, y)` the direction (degrees) there,
    `colors(x, y)` a colour. Returns SVG paths."""
    out = []
    for _ in range(count):
        p = where()
        if p is None:
            continue
        x, y = p
        a = math.radians(angle(x, y) + rnd.uniform(-12, 12))
        L = length * rnd.uniform(0.6, 1.25)
        x2, y2 = x + math.cos(a) * L, y + math.sin(a) * L
        bend = rnd.uniform(-curve, curve) * L
        mx, my = (x + x2) / 2 - math.sin(a) * bend, (y + y2) / 2 + math.cos(a) * bend
        col = colors(x, y)
        out.append(f'<path d="M{n(x)} {n(y)} Q{n(mx)} {n(my)} {n(x2)} {n(y2)}" stroke="{col}" stroke-width="{n(width * rnd.uniform(0.7, 1.3))}" '
                   f'stroke-linecap="round" fill="none" opacity="{rnd.uniform(*alpha):.2f}"/>')
    return "".join(out)


def in_ellipse(rnd, cx, cy, rx, ry):
    def f():
        while True:
            x, y = rnd.uniform(-1, 1), rnd.uniform(-1, 1)
            if x * x + y * y <= 1:
                return cx + x * rx, cy + y * ry
    return f


def in_rect(rnd, x0, y0, x1, y1):
    return lambda: (rnd.uniform(x0, x1), rnd.uniform(y0, y1))


def bokeh(rnd, count, x0, y0, x1, y1, r0, r1, cols, alpha=(0.15, 0.4)):
    return "".join(C(rnd.uniform(x0, x1), rnd.uniform(y0, y1), rnd.uniform(r0, r1), rnd.choice(cols), f' opacity="{rnd.uniform(*alpha):.2f}"') for _ in range(count))


def eye(cx, cy, r, iris="#3B2414", look=(0, 0), lid=None):
    """A soft, glossy animal eye: dark iris, a darker pupil, two catchlights, a light rim below."""
    lx, ly = look
    s = C(cx, cy + r * 0.08, r * 1.12, "#2A1A10", ' opacity="0.35"')
    s += C(cx, cy, r, iris)
    s += C(cx + lx * r * 0.2, cy + ly * r * 0.2, r * 0.62, "#120A06")
    s += E(cx - r * 0.32, cy - r * 0.36, r * 0.3, r * 0.24, "#FFFFFF", ' opacity="0.92"')
    s += C(cx + r * 0.35, cy + r * 0.35, r * 0.12, "#FFFFFF", ' opacity="0.6"')
    return s
