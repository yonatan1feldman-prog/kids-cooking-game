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


# ---------------------------------------------------------------- mermaid PR 4: the shell song
# The five bell shells (biggest = lowest): C D E G A, the pentatonic scale of the song (C5..A5), a water glockenspiel note
# with a soft bubble under it. Keep in step with NOTES in src/scenes/SeaSong.ts.
SHELL_NOTES = (523.25, 587.33, 659.25, 783.99, 880.0)
# The last tune of each hard visit (the same as SeaSong.ts TUNES.hard[v][2]): Mom sings "la" on each note, an octave
# down (her voice), one syllable every NOTE_S (SeaSong.ts NOTE_MS).
SING_TUNES = ((4, 3, 2, 0), (0, 1, 2, 4), (4, 2, 1, 0))
NOTE_S = 0.62


def shell_note(i):
    f = SHELL_NOTES[i]
    n = int(1.6 * SR)
    out = np.zeros(n)
    place(out, 0.8 * glock(f, 1.5), 0.0)
    # a little "water" wobble: the same note an octave up, very soft, with a slow vibrato
    t = np.arange(n) / SR
    place(out, 0.08 * np.sin(2 * np.pi * 2 * f * t + 0.6 * np.sin(2 * np.pi * 5 * t)) * np.exp(-t / 0.4), 0.0)
    place(out, 0.18 * blub(260 + 30 * i, 0.08, 1.6), 0.02)
    return lp(out, 7000)


def bubble_pop_soft():
    n = int(0.45 * SR)
    out = np.zeros(n)
    place(out, 0.6 * blub(220, 0.12, 1.4), 0.0)
    place(out, 0.3 * blub(300, 0.08, 2.0), 0.1)
    return lp(out, 2500)


def formant(x, f, bw):
    return bp(x, max(60, f - bw / 2), f + bw / 2, 2)


def la(f0, secs):
    """One sung "la": a soft glottal buzz (a few harmonics, a gentle vibrato from 0.15 s) through the vowel's formants,
    with an "l" at the start (formants low and closed for 60 ms, then opening into "a")."""
    n = int(secs * SR)
    t = np.arange(n) / SR
    vib = 1 + 0.012 * np.sin(2 * np.pi * 5.2 * t) * np.clip((t - 0.15) / 0.15, 0, 1)
    ph = 2 * np.pi * np.cumsum(f0 * vib) / SR
    src = sum(np.sin(h * ph) / h ** 1.2 for h in range(1, 14)) + 0.02 * rng.standard_normal(n)
    a = formant(src, 850, 160) + 0.6 * formant(src, 1220, 200) + 0.25 * formant(src, 2810, 300)
    l = formant(src, 360, 120) + 0.3 * formant(src, 1100, 200)
    open_ = np.clip((t - 0.03) / 0.07, 0, 1)
    y = (1 - open_) * 0.7 * l + open_ * a
    return y * np.minimum(1, t / 0.03) * np.minimum(1, (secs - t) / 0.12).clip(0, 1)


def sing(v):
    tune = SING_TUNES[v]
    out = np.zeros(int((len(tune) * NOTE_S + 0.6) * SR))
    for j, i in enumerate(tune):
        held = NOTE_S * (1.6 if j == len(tune) - 1 else 0.92)
        place(out, la(SHELL_NOTES[i] / 2, held), j * NOTE_S)
    return lp(out, 5000)


SOUNDS = [
    # mermaid PR 4: the shell song
    *[(f"shell-note-{i + 1}", (lambda i=i: shell_note(i))) for i in range(5)],
    ("bubble-pop-soft", bubble_pop_soft),
    *[(f"sing-{v + 1}", (lambda v=v: sing(v))) for v in range(3)],
    # mermaid PR 1
    ("shell-open", shell_open), ("bubble-breath", bubble_breath),
]

ONLY = sys.argv[1:]
for name, fn in SOUNDS:
    if ONLY and name not in ONLY:
        continue
    finish(name, fn())
