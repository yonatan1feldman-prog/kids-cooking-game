"""The clinic's effects, synthesised (no samples, so nothing to license; added 2026-10-03): heartbeat (the stethoscope:
lub-dub, soft and low), cough (a patient's small, cute "hm-hm", never a hurting one), gurgle (a tummy's bubbly rumble),
spray (a gentle "pssht" of water), sticky (a plaster pressed on), brush (a toothbrush's quick scrub), wheeze (a soft
little whistle from a chest with a cough). Writes work/sfx/<name>.wav and final/sfx/<name>.ogg (-18 LUFS, peak -1.5 dB,
like make_art_sfx.py). Run from audio-src: python scripts/make_clinic_sfx.py"""
import subprocess
from pathlib import Path
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy.signal import butter, lfilter

ROOT = Path(__file__).resolve().parent.parent
SR = 44100
rng = np.random.default_rng(11)


def env(n, a, r):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / r)


def bp(x, lo, hi, order=2):
    b, a = butter(order, [lo / (SR / 2), hi / (SR / 2)], btype="band")
    return lfilter(b, a, x)


def place(out, x, at):
    s = int(at * SR)
    out[s: s + x.size] += x[: max(0, out.size - s)]


def thump(f0, dur, amp):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = f0 * (1 + 0.6 * np.exp(-t / 0.02))
    x = np.sin(2 * np.cumsum(np.pi * f / SR)) * env(n, 0.004, dur / 3)
    return amp * (x + 0.15 * bp(rng.standard_normal(n), 60, 400) * env(n, 0.002, 0.02))


def heartbeat():
    out = np.zeros(int(0.9 * SR))
    place(out, thump(58, 0.22, 1.0), 0.02)
    place(out, thump(72, 0.18, 0.7), 0.24)
    return out


def cough():
    out = np.zeros(int(0.75 * SR))
    for at, a in ((0.0, 1.0), (0.3, 0.75)):
        n = int(0.2 * SR)
        t = np.arange(n) / SR
        breath = bp(rng.standard_normal(n), 500, 2600) * env(n, 0.008, 0.06)
        voice = np.sin(2 * np.pi * (330 - 120 * t / 0.2) * t) * env(n, 0.01, 0.05) * 0.35
        place(out, a * (breath + voice), at)
    return out


def gurgle():
    out = np.zeros(int(1.0 * SR))
    for i in range(7):
        n = int(0.11 * SR)
        t = np.arange(n) / SR
        f0 = rng.uniform(180, 420)
        f = f0 * (1 + 0.8 * t / 0.11)
        x = np.sin(2 * np.cumsum(np.pi * f / SR)) * env(n, 0.005, 0.04)
        place(out, x * rng.uniform(0.5, 1.0), 0.04 + i * 0.12 + rng.uniform(-0.02, 0.02))
    b, a = butter(2, 900 / (SR / 2))
    return lfilter(b, a, out)


def spray():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 2500, 9000) * np.minimum(1, t / 0.01) * np.minimum(1, (0.45 - t) / 0.15)
    return x * 0.6


def sticky():
    n = int(0.28 * SR)
    t = np.arange(n) / SR
    crackle = bp(rng.standard_normal(n), 1200, 5000) * (0.4 + 0.6 * (rng.random(n) > 0.92))
    x = crackle * np.minimum(1, t / 0.01) * np.exp(-t / 0.12)
    place(x, thump(140, 0.1, 0.4), 0.16)  # the press at the end
    return x


def brush():
    n = int(0.42 * SR)
    t = np.arange(n) / SR
    strokes = 0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 7 * t))
    return bp(rng.standard_normal(n), 1800, 7000) * strokes * np.minimum(1, t / 0.02) * np.minimum(1, (0.42 - t) / 0.08) * 0.6


def wheeze():
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    f = 900 + 250 * np.sin(2 * np.pi * 1.4 * t)
    x = np.sin(2 * np.cumsum(np.pi * f / SR)) * np.sin(np.pi * t / 0.6) ** 2
    return 0.4 * x + 0.2 * bp(rng.standard_normal(n), 700, 2500) * np.sin(np.pi * t / 0.6) ** 2


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


for name, fn in (("heartbeat", heartbeat), ("cough", cough), ("gurgle", gurgle), ("spray", spray), ("sticky", sticky),
                 ("brush", brush), ("wheeze", wheeze)):
    finish(name, fn())
