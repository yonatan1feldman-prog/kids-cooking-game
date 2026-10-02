"""The art corner's four effects, synthesised (no samples, so nothing to license): crayon (a short scratch of filtered
noise), xylo (one soft mallet note, C6; the game pitches it up the scale with `rate`), splosh (paint pouring into an
area) and squeak (a finger on steamy glass). Writes work/sfx/<name>.wav and final/sfx/<name>.ogg (loudness -18 LUFS,
peak -1.5 dB, like make_vo.py). Run from audio-src: python scripts/make_art_sfx.py"""
import subprocess
from pathlib import Path
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy.signal import butter, lfilter

ROOT = Path(__file__).resolve().parent.parent
SR = 44100
rng = np.random.default_rng(7)


def env(n, a, r):
    t = np.arange(n) / SR
    e = np.minimum(1, t / a) * np.exp(-t / r)
    return e


def bp(x, lo, hi, order=2):
    b, a = butter(order, [lo / (SR / 2), hi / (SR / 2)], btype="band")
    return lfilter(b, a, x)


def crayon():
    n = int(0.32 * SR)
    t = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 1800, 6500)
    # the grain of the paper: a fast irregular amplitude flutter
    grain = 0.55 + 0.45 * np.abs(np.sin(2 * np.pi * (38 + 6 * np.sin(2 * np.pi * 3 * t)) * t))
    e = np.minimum(1, t / 0.02) * np.minimum(1, (0.32 - t) / 0.08)
    return x * grain * e * 0.6


def xylo():
    n = int(0.7 * SR)
    t = np.arange(n) / SR
    f = 1046.5
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.22) + 0.35 * np.sin(2 * np.pi * f * 3.9 * t) * np.exp(-t / 0.05)
    x += 0.2 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / 0.12)
    return x * np.minimum(1, t / 0.002)


def splosh():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    # a wet low "blub": a falling sine with a little noise
    f = 420 * np.exp(-t / 0.12) + 120
    ph = 2 * np.cumsum(np.pi * f / SR)
    x = np.sin(ph) * env(n, 0.005, 0.12)
    x += 0.3 * bp(rng.standard_normal(n), 300, 2200) * env(n, 0.003, 0.06)
    return x


def squeak():
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    f = 1400 + 500 * np.sin(2 * np.pi * 2.2 * t) + 60 * np.sin(2 * np.pi * 31 * t)
    ph = 2 * np.cumsum(np.pi * f / SR)
    x = (np.sin(ph) + 0.25 * np.sin(2 * ph)) * np.minimum(1, t / 0.03) * np.minimum(1, (0.3 - t) / 0.08)
    x += 0.15 * bp(rng.standard_normal(n), 2000, 6000) * np.minimum(1, (0.3 - t) / 0.1)
    return x * 0.5


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


for name, fn in (("crayon", crayon), ("xylo", xylo), ("splosh", splosh), ("squeak", squeak)):
    finish(name, fn())
