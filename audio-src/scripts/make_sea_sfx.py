"""The mermaid world's effects, synthesised (no samples, nothing to license; added 2026-11-06, research/mermaid-spec.md 7).
Soft, round and watery, never loud or startling. Mermaid PR 1: shell-open (a big shell door opening on the sand: a soft
creak of the hinge, a puff of water and a rising shimmer) and bubble-breath (Pipa's little breath of bubbles in her bubble:
three soft blubs going up). Later PRs add their effects to SOUNDS in their own block. Writes work/sfx/<name>.wav and
final/sfx/<name>.ogg (-18 LUFS, peak -1.5 dB, like make_farm_sfx.py). Run from audio-src: python scripts/make_sea_sfx.py [names...]"""
import subprocess
import sys
from pathlib import Path
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy.signal import butter, lfilter

ROOT = Path(__file__).resolve().parent.parent
SR = 44100
rng = np.random.default_rng(31)


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


def shell_open():
    n = int(1.3 * SR)
    out = np.zeros(n)
    # the hinge: a short soft creak (a gliding low tone through a narrow band)
    m = int(0.28 * SR)
    t = np.arange(m) / SR
    creak = np.sin(2 * np.pi * np.cumsum(180 + 120 * t / 0.28 + 12 * np.sin(2 * np.pi * 31 * t)) / SR)
    place(out, 0.35 * bp(creak, 150, 1400) * env(m, 0.03, 0.12), 0.0)
    # a puff of water as it lifts
    w = int(0.4 * SR)
    place(out, 0.5 * lp(bp(rng.standard_normal(w), 300, 2500), 1800) * env(w, 0.02, 0.1), 0.08)
    # a rising shimmer of three bell notes (C6 E6 G6) and a few bubbles
    for i, f in enumerate((1046.5, 1318.5, 1568.0)):
        place(out, 0.28 * glock(f, 0.9), 0.22 + i * 0.09)
    for i in range(4):
        place(out, 0.3 * blub(rng.uniform(320, 520)), 0.3 + i * 0.11 + rng.uniform(-0.02, 0.02))
    return out


def bubble_breath():
    n = int(0.75 * SR)
    out = np.zeros(n)
    for i, f in enumerate((300, 380, 470)):
        place(out, blub(f + rng.uniform(-20, 20), 0.1, 2.2), 0.05 + i * 0.17)
    return lp(out, 3500)


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


SOUNDS = [
    # mermaid PR 1
    ("shell-open", shell_open), ("bubble-breath", bubble_breath),
]

ONLY = sys.argv[1:]
for name, fn in SOUNDS:
    if ONLY and name not in ONLY:
        continue
    finish(name, fn())
