"""The farm's effects, synthesised (no samples, so nothing to license; added 2026-10-09, research/farm-spec.md): the animals'
own friendly voices (neigh, moo, baa, cluck, peep, oink: short, soft, cartoon-like, never loud or startling), milk-squirt
(a squeeze into the bucket), clip-buzz (the shears' soft hum), cow-bell (the bell on her collar) and splash-mud (the pig
back in her puddle). Writes work/sfx/<name>.wav and final/sfx/<name>.ogg (-18 LUFS, peak -1.5 dB, like
make_clinic_sfx.py). Run from audio-src: python scripts/make_farm_sfx.py [names...]"""
import subprocess
import sys
from pathlib import Path
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy.signal import butter, lfilter

ROOT = Path(__file__).resolve().parent.parent
SR = 44100
rng = np.random.default_rng(23)


def env(n, a, r):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / r)


def shape(n, a, r):
    """Attack a, release r at the end, flat between."""
    t = np.arange(n) / SR
    d = n / SR
    return np.minimum(1, t / a) * np.minimum(1, np.maximum(0, d - t) / r)


def bp(x, lo, hi, order=2):
    b, a = butter(order, [lo / (SR / 2), hi / (SR / 2)], btype="band")
    return lfilter(b, a, x)


def lp(x, f, order=2):
    b, a = butter(order, f / (SR / 2))
    return lfilter(b, a, x)


def place(out, x, at):
    s = int(at * SR)
    out[s: s + x.size] += x[: max(0, out.size - s)]


def saw(f):
    """A band-limited-ish sawtooth following the frequency curve f (per sample)."""
    ph = np.cumsum(f / SR)
    x = np.zeros_like(ph)
    for h in range(1, 14):
        x += np.sin(2 * np.pi * h * ph) / h * (1 if h * f.max() < SR / 2.2 else 0)
    return x


def voice(f, formants, breath=0.05):
    """A voiced sound: a sawtooth source through a few formant bands (centre, width, gain), plus a little breath."""
    src = saw(f)
    out = np.zeros_like(src)
    for fc, w, g in formants:
        out += g * bp(src, max(40, fc - w / 2), fc + w / 2)
    out += breath * bp(rng.standard_normal(src.size), 800, 4000)
    return out


def moo():
    d = 1.05
    n = int(d * SR)
    t = np.arange(n) / SR
    f = 150 - 40 * t / d + 18 * np.exp(-((t - 0.25) / 0.18) ** 2) + 2.5 * np.sin(2 * np.pi * 5 * t)
    # "mmm" closing into "oooo": the formants open a little
    x = voice(f, [(330, 220, 1.0), (700 + 160 * np.sin(np.pi * min(1, 0.6)), 300, 0.45), (2400, 600, 0.06)], 0.02)
    return lp(x, 1600) * shape(n, 0.12, 0.3)


def neigh():
    d = 0.95
    n = int(d * SR)
    t = np.arange(n) / SR
    # a friendly little whinny: up, a fast wobble, gently down
    base = 520 + 380 * np.sin(np.pi * np.minimum(1, t / 0.5)) - 260 * np.maximum(0, t - 0.5) / 0.45
    f = base * (1 + 0.06 * np.sin(2 * np.pi * 17 * t))
    x = voice(f, [(900, 500, 1.0), (1700, 600, 0.5), (3000, 900, 0.12)], 0.08)
    am = 0.75 + 0.25 * np.sin(2 * np.pi * 17 * t)
    return x * am * shape(n, 0.04, 0.25)


def baa():
    d = 0.8
    n = int(d * SR)
    t = np.arange(n) / SR
    f = 360 + 30 * np.sin(np.pi * t / d)
    x = voice(f, [(750, 400, 1.0), (1250, 400, 0.7), (2600, 700, 0.15)], 0.04)
    trem = 0.6 + 0.4 * np.sin(2 * np.pi * 7.5 * t)
    return x * trem * shape(n, 0.05, 0.25)


def cluck():
    out = np.zeros(int(0.85 * SR))
    for i, (at, f0, dur) in enumerate(((0.0, 620, 0.09), (0.16, 640, 0.09), (0.34, 700, 0.26))):
        n = int(dur * SR)
        t = np.arange(n) / SR
        f = f0 * (1 + (0.35 if i == 2 else 0.1) * np.sin(np.pi * t / dur))
        x = voice(f, [(1100, 600, 1.0), (2200, 800, 0.4)], 0.1) * env(n, 0.004, dur / 2.2)
        place(out, x, at)
    return out


def peep():
    out = np.zeros(int(0.5 * SR))
    for at in (0.0, 0.2):
        n = int(0.13 * SR)
        t = np.arange(n) / SR
        f = 2700 + 900 * t / 0.13
        x = np.sin(2 * np.pi * np.cumsum(f / SR)) * np.sin(np.pi * t / 0.13) ** 1.5
        place(out, 0.6 * x, at)
    return out


def oink():
    out = np.zeros(int(0.75 * SR))
    for at, f0 in ((0.0, 210), (0.3, 240)):
        d = 0.24
        n = int(d * SR)
        t = np.arange(n) / SR
        f = f0 * (1 + 0.5 * np.sin(np.pi * t / d)) * (1 + 0.08 * np.sin(2 * np.pi * 34 * t))
        x = voice(f, [(600, 300, 1.0), (1500, 500, 0.6)], 0.12)
        place(out, x * shape(n, 0.02, 0.08), at)
    return lp(out, 2500)


def milk_squirt():
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 2200, 7000) * np.minimum(1, t / 0.005) * np.exp(-t / 0.08)
    m = int(0.12 * SR)
    tp = np.arange(m) / SR
    plink = np.sin(2 * np.pi * np.cumsum((900 + 1200 * tp / 0.12) / SR)) * env(m, 0.002, 0.03)
    out = np.zeros(int(0.32 * SR))
    place(out, 0.5 * x, 0)
    place(out, 0.35 * plink, 0.15)
    return out


def clip_buzz():
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    f = np.full(n, 118.0)
    x = saw(f) * (0.7 + 0.3 * np.sin(2 * np.pi * 40 * t))
    x = bp(x, 200, 2400) + 0.15 * bp(rng.standard_normal(n), 3000, 8000)
    return 0.6 * x * shape(n, 0.03, 0.08)


def cow_bell():
    n = int(1.1 * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for f, a, r in ((540, 1.0, 0.45), (812, 0.6, 0.3), (1186, 0.4, 0.2), (1630, 0.2, 0.12)):
        out += a * np.sin(2 * np.pi * f * t) * env(n, 0.002, r)
    place(out, 0.6 * out[: int(0.6 * SR)].copy(), 0.22)
    return out


def splash_mud():
    n = int(0.7 * SR)
    t = np.arange(n) / SR
    thud = lp(rng.standard_normal(n), 500) * env(n, 0.003, 0.12) * 2.5
    out = thud.copy()
    for i in range(6):
        m = int(0.07 * SR)
        tp = np.arange(m) / SR
        f0 = rng.uniform(220, 420)
        b = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 1.2 * tp / 0.07) / SR)) * env(m, 0.003, 0.025)
        place(out, 0.5 * b, 0.12 + i * 0.07 + rng.uniform(-0.02, 0.02))
    return out


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


ONLY = sys.argv[1:]
for name, fn in (("moo", moo), ("neigh", neigh), ("baa", baa), ("cluck", cluck), ("peep", peep), ("oink", oink),
                 ("milk-squirt", milk_squirt), ("clip-buzz", clip_buzz), ("cow-bell", cow_bell), ("splash-mud", splash_mud)):
    if ONLY and name not in ONLY:
        continue
    finish(name, fn())
