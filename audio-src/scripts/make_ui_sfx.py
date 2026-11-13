"""The premium round's UI sounds, synthesised (no samples, nothing to license; added 2026-11-13, research/premium-spec.md
4.1 and 6). One soft paper language for the whole game: paper-lift (a thing picked up: a short airy rustle going up),
paper-drop (put down: a soft paper pat), whoosh-soft (the paper page of a scene change sliding over), chime-1..5 (a
rising pentatonic bell for step after step, C5 D5 E5 G5 A5) and tada (a short warm "ta-da" for a finished dish).
Never loud or startling; every file under 20 KB. Writes work/sfx/<name>.wav and final/sfx/<name>.ogg (-18 LUFS, peak
-1.5 dB, like make_sea_sfx.py), then copy final/sfx/<name>.ogg to public/assets/sounds/sfx/.
Run from audio-src: python scripts/make_ui_sfx.py [names...]"""
import shutil
import subprocess
import sys
from pathlib import Path
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy.signal import butter, lfilter

ROOT = Path(__file__).resolve().parent.parent
SR = 44100
rng = np.random.default_rng(14)


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


def sweep_noise(secs, f0, f1, width=0.6):
    """Noise through a band that glides from f0 to f1 (block-wise, 10 ms blocks): the sound of paper moving through air."""
    n = int(secs * SR)
    noise = rng.standard_normal(n + SR // 10)
    out = np.zeros(n)
    blk = SR // 100
    for i in range(0, n, blk):
        f = f0 * (f1 / f0) ** (i / n)
        lo, hi = f * (1 - width / 2), min(f * (1 + width / 2), SR / 2 - 100)
        seg = bp(noise[i: i + blk + 400], lo, hi)[400: 400 + blk] if i + blk + 400 <= noise.size else np.zeros(blk)
        out[i: i + blk] = seg[: min(blk, n - i)]
    return out


def bell(f, secs=1.0, bright=1.0):
    """A soft bell / glockenspiel note: a few inharmonic partials, the high ones dying first."""
    n = int(secs * SR)
    t = np.arange(n) / SR
    x = sum(g * np.sin(2 * np.pi * f * r * t) * np.exp(-t / (secs * d))
            for r, g, d in ((1, 1, .32), (2, .25 * bright, .16), (2.76, .2 * bright, .1), (5.4, .06 * bright, .04)))
    return x * np.minimum(1, t / 0.003)


def paper_lift():
    n = int(0.2 * SR)
    out = np.zeros(n)
    place(out, sweep_noise(0.16, 1800, 4200) * env(int(0.16 * SR), 0.03, 0.05), 0.0)
    # two tiny crinkles in it
    for at in (0.02, 0.07):
        m = int(0.012 * SR)
        place(out, 0.6 * bp(rng.standard_normal(m), 3000, 7000) * env(m, 0.001, 0.004), at)
    return lp(out, 8000)


def paper_drop():
    n = int(0.26 * SR)
    out = np.zeros(n)
    # the pat: a soft low thump (a fast falling sine) under a short brush of paper
    m = int(0.12 * SR)
    t = np.arange(m) / SR
    place(out, 0.9 * np.sin(2 * np.pi * np.cumsum(220 * np.exp(-t / 0.05) + 90) / SR) * env(m, 0.002, 0.03), 0.0)
    k = int(0.09 * SR)
    place(out, 0.35 * bp(rng.standard_normal(k), 900, 3500) * env(k, 0.002, 0.025), 0.0)
    return lp(out, 5000)


def whoosh_soft():
    n = int(0.5 * SR)
    m = int(0.44 * SR)
    t = np.arange(m) / SR
    shape = np.sin(np.pi * np.clip(t / 0.44, 0, 1)) ** 1.6
    out = np.zeros(n)
    place(out, sweep_noise(0.44, 350, 1600, 0.8) * shape, 0.0)
    return lp(out, 4000)


CHIME_NOTES = (523.25, 587.33, 659.25, 783.99, 880.0)


def chime(i):
    f = CHIME_NOTES[i]
    n = int(1.0 * SR)
    out = np.zeros(n)
    place(out, bell(f, 0.9), 0.0)
    # a quiet octave above, a breath later: a little sparkle that grows with the step
    place(out, (0.12 + 0.04 * i) * bell(2 * f, 0.5, 0.5), 0.05)
    return lp(out, 9000)


def tada():
    n = int(1.4 * SR)
    out = np.zeros(n)
    # "ta": a quick pickup (G5), "da": the C major chord with C6 on top, bells and a soft warm pad under it
    place(out, 0.6 * bell(783.99, 0.35), 0.0)
    for f, g in ((523.25, .55), (659.25, .5), (783.99, .5), (1046.5, .6)):
        place(out, g * bell(f, 1.1), 0.14)
    m = int(1.1 * SR)
    t = np.arange(m) / SR
    pad = sum(np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) for f in (261.63, 329.63, 392.0))
    place(out, 0.12 * pad * np.minimum(1, t / 0.06) * np.exp(-t / 0.45), 0.14)
    return lp(out, 8000)


def finish(name, x):
    meter = pyln.Meter(SR, block_size=0.1)
    x = pyln.normalize.loudness(x, meter.integrated_loudness(x), -18.0)
    peak = np.max(np.abs(x))
    lim = 10 ** (-1.5 / 20)
    if peak > lim:
        x = x * lim / peak
    # (no click at the end)
    f = min(x.size, int(0.01 * SR))
    x[-f:] *= np.linspace(1, 0, f)
    wav = ROOT / f"work/sfx/{name}.wav"
    wav.parent.mkdir(parents=True, exist_ok=True)
    sf.write(wav, x.astype(np.float32), SR)
    out = ROOT / f"final/sfx/{name}.ogg"
    out.parent.mkdir(parents=True, exist_ok=True)
    ff = ROOT / "tools/ffmpeg/bin/ffmpeg.exe"
    subprocess.run([str(ff) if ff.exists() else "ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-ac", "1",
                    "-c:a", "libvorbis", "-q:a", "3", str(out)], check=True)
    shutil.copy(out, ROOT.parent / "public/assets/sounds/sfx" / out.name)
    print(name, round(len(x) / SR, 2), out.stat().st_size)


SOUNDS = [
    ("paper-lift", paper_lift), ("paper-drop", paper_drop), ("whoosh-soft", whoosh_soft),
    *[(f"chime-{i + 1}", (lambda i=i: chime(i))) for i in range(5)],
    ("tada", tada),
]

ONLY = sys.argv[1:]
for name, fn in SOUNDS:
    if ONLY and name not in ONLY:
        continue
    finish(name, fn())
