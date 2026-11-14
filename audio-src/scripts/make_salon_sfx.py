"""The mermaid salon's effects, synthesised (no samples, nothing to license; added 2026-11-14, research/mermaid-dressup-spec.md
11, PR V). Soft, round and watery like the lagoon's (make_sea_sfx.py; its helpers are copied here so that file stays as it
is). The sponge uses the core `squish`; the paper and bell sounds are the UI's. giggle-1..3 are the customers' little wordless
giggles (each customer plays them at her own rate, ART_SALON / spec 4). Writes work/sfx/<name>.wav and final/sfx/<name>.ogg
(-18 LUFS, peak -1.5 dB). Run from audio-src: python scripts/make_salon_sfx.py [names...]"""
import subprocess
import sys
from pathlib import Path
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy.signal import butter, lfilter

ROOT = Path(__file__).resolve().parent.parent
SR = 44100
rng = np.random.default_rng(47)


def env(n, a, r):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / r)


def bp(x, lo, hi, order=2):
    b, a = butter(order, [lo / (SR / 2), hi / (SR / 2)], btype="band")
    return lfilter(b, a, x)


def lp(x, f, order=2):
    b, a = butter(order, f / (SR / 2))
    return lfilter(b, a, x)


def place(out, x, at):
    s = int(at * SR)
    m = min(x.size, out.size - s)
    if m > 0:
        out[s: s + m] += x[:m]


def blub(f0, secs=0.09, up=1.8):
    """One bubble: a sine sweeping up fast (the classic underwater plop), soft at both ends."""
    n = int(secs * SR)
    t = np.arange(n) / SR
    f = f0 * (1 + up * (t / secs) ** 1.5)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.004, secs * 0.45)


def glock(f, secs=1.2):
    """A small water-glockenspiel note: a bell partial set, decaying."""
    n = int(secs * SR)
    t = np.arange(n) / SR
    x = sum(g * np.sin(2 * np.pi * f * r * t) * np.exp(-t / (secs * d)) for r, g, d in ((1, 1, .35), (2.76, .35, .12), (5.4, .12, .05)))
    return x * np.minimum(1, t / 0.002)


def formant(x, f, bw):
    return bp(x, max(60, f - bw / 2), f + bw / 2, 2)


def finish(name, x):
    meter = pyln.Meter(SR, block_size=0.1)
    x = pyln.normalize.loudness(x, meter.integrated_loudness(x), -18.0)
    peak = np.max(np.abs(x))
    lim = 10 ** (-1.5 / 20)
    if peak > lim:
        x = x * lim / peak
    wav = ROOT / f"work/sfx/{name}.wav"
    wav.parent.mkdir(parents=True, exist_ok=True)
    sf.write(wav, x.astype(np.float32), SR)
    out = ROOT / f"final/sfx/{name}.ogg"
    subprocess.run([str(ROOT / "tools/ffmpeg/bin/ffmpeg.exe"), "-y", "-loglevel", "error", "-i", str(wav), "-ac", "1",
                    "-c:a", "libvorbis", "-q:a", "5", str(out)], check=True)
    print(name, round(len(x) / SR, 2), out.stat().st_size)




def noise(secs):
    return rng.standard_normal(int(secs * SR))


def weed_pluck():
    """A bit of seaweed plucked out of her hair: a tiny wet pop and a soft rising whoop."""
    out = np.zeros(int(0.45 * SR))
    place(out, 0.6 * blub(260, 0.07, 2.6), 0.0)
    m = int(0.2 * SR)
    t = np.arange(m) / SR
    place(out, 0.3 * np.sin(2 * np.pi * np.cumsum(500 + 900 * t / 0.2) / SR) * env(m, 0.01, 0.07), 0.05)
    return lp(out, 6000)


def shower():
    """The shell shower: a soft gentle stream of water for 1.2 s, with bubbles rising in it."""
    secs = 1.3
    n = int(secs * SR)
    t = np.arange(n) / SR
    shape = np.minimum(1, t / 0.12) * np.minimum(1, (secs - t) / 0.3).clip(0, 1)
    x = 0.5 * lp(bp(noise(secs), 500, 7000), 5000) * (0.8 + 0.2 * np.sin(2 * np.pi * 7 * t)) * shape
    for i in range(9):
        place(x, 0.22 * blub(rng.uniform(380, 720), 0.07, 2.2), 0.1 + i * 0.12 + rng.uniform(-0.03, 0.03))
    return x


def hair_swish():
    """A new hairstyle: a soft airy swish down, like a ribbon of hair through water, and a tiny bell."""
    secs = 0.55
    n = int(secs * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for k in range(6):   # a band of noise sweeping down
        lo = 3800 - k * 500
        seg = bp(noise(secs), max(300, lo - 600), lo + 400)
        x += seg * np.exp(-((t - 0.06 - k * 0.04) / 0.07) ** 2)
    x = 0.4 * x
    place(x, 0.18 * glock(1975.5, 0.4), 0.18)
    return x


def spray_click():
    """Tapping the spray to change its colour: a plastic click and a little tick of a bell."""
    out = np.zeros(int(0.35 * SR))
    m = int(0.015 * SR)
    place(out, 0.7 * bp(noise(0.015), 1800, 6000) * env(m, 0.0005, 0.004), 0.0)
    place(out, 0.4 * bp(noise(0.015), 1200, 4000) * env(m, 0.0005, 0.004), 0.05)
    place(out, 0.2 * glock(2637.0, 0.25), 0.06)
    return out


def spray_hiss():
    """The colour spray: a soft fine mist (short, it repeats while she rubs), never harsh."""
    secs = 0.5
    n = int(secs * SR)
    t = np.arange(n) / SR
    shape = np.minimum(1, t / 0.03) * np.minimum(1, (secs - t) / 0.15).clip(0, 1)
    return 0.4 * lp(bp(noise(secs), 2500, 9000), 7000) * shape


def comb_strokes():
    """The comb through her hair: three soft strokes (a brushed tick-run) and a shimmer at the end."""
    out = np.zeros(int(1.1 * SR))
    for s in range(3):
        for j in range(10):
            m = int(0.01 * SR)
            place(out, (0.18 - j * 0.008) * bp(noise(0.01), 2500, 7000) * env(m, 0.0005, 0.003), 0.04 + s * 0.26 + j * 0.016)
        w = int(0.18 * SR)
        place(out, 0.1 * bp(noise(0.18), 1500, 5000) * env(w, 0.03, 0.06), 0.04 + s * 0.26)
    for i, f in enumerate((1568.0, 2093.0)):
        place(out, 0.16 * glock(f, 0.5), 0.82 + i * 0.07)
    return out


def blush_brush():
    """The blush brush on her cheek: a very soft round brushing (short; it repeats while she rubs)."""
    secs = 0.45
    n = int(secs * SR)
    t = np.arange(n) / SR
    shape = np.sin(np.pi * t / secs) ** 2
    return 0.4 * lp(bp(noise(secs), 400, 3000), 2000) * shape * (0.85 + 0.15 * np.sin(2 * np.pi * 9 * t))


def lipstick_pop():
    """Lipstick on: a little kissy pop (a soft lip smack) and a twinkle."""
    out = np.zeros(int(0.5 * SR))
    m = int(0.05 * SR)
    t = np.arange(m) / SR
    place(out, 0.7 * np.sin(2 * np.pi * np.cumsum(900 - 500 * t / 0.05) / SR) * env(m, 0.001, 0.012), 0.0)
    place(out, 0.35 * bp(noise(0.03), 800, 4000) * env(int(0.03 * SR), 0.0005, 0.006), 0.0)
    place(out, 0.2 * glock(2349.3, 0.35), 0.09)
    return out


def splash_soft():
    """A new tail: a soft round splash and two bubbles."""
    out = np.zeros(int(0.9 * SR))
    w = int(0.5 * SR)
    place(out, 0.5 * lp(bp(noise(0.5), 250, 3500), 2400) * env(w, 0.01, 0.12), 0.0)
    place(out, 0.4 * blub(240, 0.1, 2.0), 0.12)
    place(out, 0.3 * blub(340, 0.08, 2.2), 0.3)
    return out


def jewel_ting():
    """A crown, a clip or a necklace put on: a bright little two-bell ting."""
    out = np.zeros(int(1.0 * SR))
    place(out, 0.4 * glock(1760.0, 0.8), 0.0)
    place(out, 0.3 * glock(2637.0, 0.7), 0.07)
    return out


def gem_click():
    """A gem stuck on her face: a tiny glassy click with a sparkle."""
    out = np.zeros(int(0.5 * SR))
    m = int(0.012 * SR)
    place(out, 0.6 * bp(noise(0.012), 3000, 9000) * env(m, 0.0003, 0.002), 0.0)
    place(out, 0.22 * glock(3136.0, 0.3), 0.01)
    place(out, 0.12 * glock(4186.0, 0.25), 0.05)
    return out


def mirror_chime():
    """The mirror turns round to her: a slow rising shimmer of five bells (C6 E6 G6 C7 E7) on a soft swell."""
    out = np.zeros(int(1.9 * SR))
    w = int(1.0 * SR)
    t = np.arange(w) / SR
    place(out, 0.15 * lp(bp(noise(1.0), 2000, 8000), 6000) * np.sin(np.pi * t / 1.0) ** 2, 0.0)
    for i, f in enumerate((1046.5, 1318.5, 1568.0, 2093.0, 2637.0)):
        place(out, 0.24 * glock(f, 1.0), 0.1 + i * 0.12)
    return out


def giggle(v):
    """A little mermaid girl's wordless giggle: 3-5 bright "hee" syllables, stepping down, through a child's vowel
    formants (a high voice; the game plays it at each customer's own rate)."""
    syl = (5, 4, 3)[v]
    f0s = (520, 470, 560)[v]
    out = np.zeros(int((syl * 0.11 + 0.35) * SR))
    for j in range(syl):
        secs = 0.085 if j < syl - 1 else 0.16
        n = int(secs * SR)
        t = np.arange(n) / SR
        f0 = f0s * (1 - 0.035 * j) * (1 + 0.04 * np.sin(np.pi * t / secs))
        ph = 2 * np.pi * np.cumsum(f0) / SR
        src = sum(np.sin(h * ph) / h ** 1.3 for h in range(1, 10)) + 0.15 * rng.standard_normal(n)
        y = formant(src, 400, 160) + 0.8 * formant(src, 2600, 400) + 0.3 * formant(src, 3300, 500)   # "ee"
        h = bp(rng.standard_normal(n), 2000, 7000) * np.exp(-t / 0.012) * 0.25   # the breathy "h"
        place(out, (y + h) * np.minimum(1, t / 0.01) * np.minimum(1, (secs - t) / 0.03).clip(0, 1), j * 0.11)
    return lp(out, 7000)


SOUNDS = [
    ("weed-pluck", weed_pluck), ("shower", shower), ("hair-swish", hair_swish), ("spray-click", spray_click),
    ("spray-hiss", spray_hiss), ("comb-strokes", comb_strokes), ("blush-brush", blush_brush), ("lipstick-pop", lipstick_pop),
    ("splash-soft", splash_soft), ("jewel-ting", jewel_ting), ("gem-click", gem_click), ("mirror-chime", mirror_chime),
    *[(f"giggle-{v + 1}", (lambda v=v: giggle(v))) for v in range(3)],
]

ONLY = sys.argv[1:]
for name, fn in SOUNDS:
    if ONLY and name not in ONLY:
        continue
    finish(name, fn())
