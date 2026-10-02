"""The game's music, synthesised here from notes (numpy + scipy + ffmpeg only; no samples, nothing downloaded).

Three songs, each 32 bars (A A' B A) that loop gaplessly, each as three synchronised stems the game mixes live
(core/audio.ts `music`):
  base   ukulele or marimba chords, bass, a light shaker or claps   always on      stereo
  tune   the melody (xylophone / whistle / glockenspiel)            on; out while Mom talks   mono
  party  kick, claps, tambourine, a counter-melody, fills           after each success, the whole finale   mono
plus `-up`, a one-bar rising glockenspiel run in the song's key (the stinger when the party layer comes in).

Usage (from audio-src/):  python3 scripts/make_music.py [kitchen outside art] [--preview DIR]
Writes work/music-gen/*.wav (scratch), final/music/music-<song>-<stem>.ogg, and with --preview one mp3 per song
(base + tune, the party layer coming in mid-way, then going again). Research and spec:
the project's research/music-spec.md. Mixing: every stem gets ONE gain per song, so the full mix (base + tune + party)
is -20 LUFS integrated like the old music, base + tune about 2 LU quieter. Seams: render 2 bars past the loop and fold
that tail onto the head, so plucks and the room ring across the join; the checks at the end measure the join.
"""
import json, re, subprocess, sys
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, lfilter, sosfilt

SR = 44100
ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / "work" / "music-gen"
FINAL = ROOT / "final" / "music"
FFMPEG = "ffmpeg"

# ---------------------------------------------------------------- notes

NOTE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def midi(name: str) -> int:
    m = re.fullmatch(r"([A-G])([#b]?)(-?\d)", name)
    assert m, name
    n = NOTE[m[1]] + (1 if m[2] == "#" else -1 if m[2] == "b" else 0)
    return 12 * (int(m[3]) + 1) + n


def hz(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


CHORD = {"": (0, 4, 7), "m": (0, 3, 7), "7": (0, 4, 7, 10), "m7": (0, 3, 7, 10), "maj7": (0, 4, 7, 11)}


def chord_pcs(sym: str):
    m = re.fullmatch(r"([A-G][#b]?)(m7|maj7|m|7)?", sym)
    assert m, sym
    root = midi(m[1] + "0") % 12
    return root, [(root + i) % 12 for i in CHORD[m[2] or ""]]


def uke_voicing(sym: str):
    """Re-entrant ukulele (G4 C4 E4 A4): each string takes the nearest chord tone at or above it (0-4 frets).
    That gives the real shapes: C 0003, G 0232, F 2010, Am 2000, Dm 2210, G7 0212, Bb 3211, D7 2020..."""
    _, pcs = chord_pcs(sym)
    out = []
    for o in (midi("G4"), midi("C4"), midi("E4"), midi("A4")):
        fret = min((pc - o) % 12 for pc in pcs)
        out.append(o + fret)
    return out


def parse_bar(text: str):
    """'C5/.5 E5/.5 G5/1 r/2' -> [(start_beat, beats, midi | None)]; a bar is 4 beats."""
    t, out = 0.0, []
    for tok in text.split():
        n, d = tok.split("/")
        d = float(d)
        out.append((t, d, None if n == "r" else midi(n)))
        t += d
    assert abs(t - 4) < 1e-6, f"bar of {t} beats: {text}"
    return out


# ---------------------------------------------------------------- instruments (mono float arrays at SR)

RNG = np.random.default_rng(7)


def env_ad(n: int, attack: float, tau: float):
    t = np.arange(n) / SR
    e = np.exp(-t / tau)
    a = int(attack * SR)
    if a > 0:
        e[:a] *= np.linspace(0, 1, a, endpoint=False)
    return e


_ks_cache: dict = {}


def pluck(m: float, variant: int, bright: float, secs: float = 2.2, t60: float = 2.4):
    """Karplus-Strong string (the ukulele), exact pitch by resampling the integer-period string."""
    key = (round(m, 2), variant, round(bright, 2))
    if key not in _ks_cache:
        f = hz(m)
        N = int(round(SR / f))
        S = 0.3  # the loop's averaging weight: less than 0.5 rings longer (the delay is N + S samples)
        f0 = SR / (N + S)
        rng = np.random.default_rng(1000 + variant * 97 + int(m))
        exc = rng.uniform(-1, 1, N)
        exc = lfilter([1 - bright], [1, -bright], exc)  # softer pick = darker
        p = max(1, int(N * 0.18))  # plucked a fifth of the way along: a comb on the excitation
        exc = exc - np.roll(exc, p) * 0.6
        exc -= exc.mean()
        L = int(secs * SR * f0 / f) + N
        y = np.zeros(L)
        y[:N] = exc
        d = 10 ** (-3 / (t60 * f0))
        k = N
        while k < L:
            e = min(k + N, L)
            idx = np.arange(k, e)
            y[k:e] = d * ((1 - S) * y[idx - N] + S * y[idx - N - 1])
            k = e
        n_out = int(secs * SR)
        y = np.interp(np.arange(n_out) * (f / f0), np.arange(L), y)
        y /= np.max(np.abs(y)) + 1e-9
        _ks_cache[key] = y
    return _ks_cache[key]


MALLETS = {
    # partial ratios, their levels and decay times (s): xylophone (tuned twelfth, quick), marimba (warm), glockenspiel
    "xylo": ([1, 3.0, 6.1, 9.3], [1, 0.35, 0.12, 0.05], [0.32, 0.07, 0.03, 0.015]),
    "marimba": ([1, 4.0, 9.9], [1, 0.22, 0.05], [0.55, 0.09, 0.03]),
    "glock": ([1, 2.76, 5.40, 8.93], [1, 0.25, 0.1, 0.04], [1.1, 0.35, 0.12, 0.05]),
}


def mallet(kind: str, m: float, secs: float = 1.6):
    ratios, amps, taus = MALLETS[kind]
    n = int(secs * SR)
    t = np.arange(n) / SR
    f = hz(m)
    y = np.zeros(n)
    for r, a, tau in zip(ratios, amps, taus):
        if f * r < SR / 2.2:
            y += a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / tau)
    a = int(0.002 * SR)
    y[:a] *= np.linspace(0, 1, a, endpoint=False)
    # the mallet's knock: a 4 ms band of noise around the note
    click = RNG.uniform(-1, 1, int(0.004 * SR)) * np.linspace(1, 0, int(0.004 * SR))
    y[: click.size] += 0.12 * click
    return y / (np.max(np.abs(y)) + 1e-9)


def whistle(m: float, beats: float, spb: float):
    """A whistled / recorder-like line: sine + a little 2nd and 3rd, delayed vibrato, breath."""
    secs = beats * spb * 0.92 + 0.08
    n = int(secs * SR)
    t = np.arange(n) / SR
    f = hz(m)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t) * np.clip((t - 0.15) / 0.2, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    y = np.sin(ph) + 0.12 * np.sin(2 * ph) + 0.04 * np.sin(3 * ph)
    breath = sosfilt(butter(2, [f * 0.8, min(f * 3, SR / 2.3)], "bandpass", fs=SR, output="sos"), RNG.uniform(-1, 1, n))
    y += 0.25 * breath
    e = np.ones(n)
    a, r = int(0.035 * SR), int(0.07 * SR)
    e[:a] = np.linspace(0, 1, a) ** 1.5
    e[-r:] *= np.linspace(1, 0, r)
    e *= 1 - 0.15 * np.clip(t / max(secs, 0.3), 0, 1)  # breathes out a little
    return y * e / 1.3


def bass(m: float, beats: float, spb: float):
    """A short, round, bouncy bass (pizzicato / plucked): harmonics so a phone speaker still shows the notes."""
    secs = max(0.12, beats * spb * 0.9)
    n = int((secs + 0.08) * SR)
    t = np.arange(n) / SR
    f = hz(m)
    y = sum(a * np.sin(2 * np.pi * f * h * t) * np.exp(-t / tau) for h, a, tau in
            ((1, 1.0, 0.45), (2, 0.55, 0.22), (3, 0.3, 0.12), (4, 0.14, 0.07)))
    e = np.ones(n)
    a = int(0.006 * SR)
    e[:a] = np.linspace(0, 1, a)
    off = int(secs * SR)
    e[off:] *= np.linspace(1, 0, n - off)
    return y * e / 1.6


def noise_hit(n_secs: float, lo: float, hi: float, attack: float, tau: float, seed: int):
    n = int(n_secs * SR)
    rng = np.random.default_rng(seed)
    x = rng.uniform(-1, 1, n)
    sos = butter(2, [lo, min(hi, SR / 2.2)], "bandpass", fs=SR, output="sos") if hi else butter(2, lo, "highpass", fs=SR, output="sos")
    return sosfilt(sos, x) * env_ad(n, attack, tau)


def shaker(seed):
    return noise_hit(0.12, 4500, 0, 0.012, 0.035, seed) * 1.6


def clap(seed):
    n = int(0.25 * SR)
    y = np.zeros(n)
    for i, dt in enumerate((0, 0.009, 0.019)):
        s = int(dt * SR)
        h = noise_hit(0.25 - dt, 900, 2600, 0.001, 0.006 if i < 2 else 0.07, seed * 7 + i)
        y[s: s + h.size] += h[: n - s] * (0.8 if i < 2 else 1.0)
    return y * 2.2


def tamb(seed):
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    rng = np.random.default_rng(seed)
    jing = sum(np.sin(2 * np.pi * f * t + rng.uniform(0, 6.3)) for f in (5200, 6750, 8300, 9650))
    x = noise_hit(0.22, 6500, 0, 0.002, 0.06, seed) * 2 + 0.25 * jing * rng.uniform(0.3, 1, n) * env_ad(n, 0.002, 0.07)
    return x


def kick():
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    f = 52 + 110 * np.exp(-t / 0.035)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.13)
    y += 0.3 * np.sin(2 * np.pi * 2 * np.cumsum(f) / SR) * np.exp(-t / 0.05)  # the 2nd harmonic: heard on a phone
    y[: int(0.002 * SR)] += RNG.uniform(-0.4, 0.4, int(0.002 * SR))
    return y


# ---------------------------------------------------------------- songs

# Every song: 32 bars, A (1-8) A' (9-16) B (17-24) A (25-32). A bar's melody is notes with beats: 'C5/.5 r/1'.
KITCHEN_A = [
    "C5/.5 E5/.5 G5/1 G5/.5 A5/.5 G5/1",
    "F5/.5 A5/.5 C6/1 A5/1 F5/1",
    "G5/.5 F5/.5 E5/.5 D5/.5 B4/1 D5/1",
    "C5/1 E5/1 C5/1 r/1",
    "C5/.5 E5/.5 G5/1 G5/.5 A5/.5 G5/1",
    "A5/.5 B5/.5 C6/1 A5/.5 G5/.5 F5/1",
    "D5/.5 E5/.5 F5/1 B4/.5 D5/.5 G5/1",
    "E5/1 C5/1 r/1 G4/.5 B4/.5",
]
KITCHEN = dict(
    bpm=128, root="C", base="uke", tune="xylo", counter="glock", strum="island",
    chords=["C", "F", "G", "C", "C", "F", "G7", "C"] * 2 + ["Am", "F", "C", "G", "Am", "F", "Dm", "G7"]
    + ["C", "F", "G", "C", "C", "F", "G7", "C"],
    melody=KITCHEN_A
    + KITCHEN_A[:3] + ["C5/1 E5/1 G5/1 r/1", KITCHEN_A[4], "A5/.5 G5/.5 F5/.5 A5/.5 C6/2",
                       "B5/.5 A5/.5 G5/.5 F5/.5 D5/1 B4/1", "C5/2 r/2"]
    + ["A5/1 C6/1 E6/1 C6/1", "A5/1 G5/1 F5/2", "E5/1 G5/1 C6/1 G5/1", "D5/.5 E5/.5 F5/.5 E5/.5 D5/2",
       "A5/.5 B5/.5 C6/1 B5/.5 A5/.5 E5/1", "F5/.5 G5/.5 A5/1 G5/.5 F5/.5 C5/1", "D5/1 F5/1 A5/1 F5/1",
       "G5/1 F5/.5 E5/.5 D5/1 G4/.5 B4/.5"]
    + KITCHEN_A,
    up=["C6", "E6", "G6", "C7", "E7", "G7"],
)

OUTSIDE_A = [
    "D5/.5 G5/.5 G5/.5 A5/.5 B5/1 G5/1",
    "C6/.5 B5/.5 A5/.5 G5/.5 E5/1 G5/1",
    "D5/.5 G5/.5 B5/.5 D6/.5 B5/1 G5/1",
    "A5/2 F#5/1 D5/1",
    "D5/.5 G5/.5 G5/.5 A5/.5 B5/1 G5/1",
    "E6/.5 D6/.5 C6/.5 B5/.5 A5/1 C6/1",
    "B5/.5 A5/.5 G5/.5 F#5/.5 A5/1 F#5/1",
    "G5/2 r/1 D5/1",
]
OUTSIDE = dict(
    bpm=124, root="G", base="uke", tune="whistle", counter="glock", strum="chuck", clap_base=True,
    chords=["G", "C", "G", "D", "G", "C", "D", "G"] * 2 + ["Em", "C", "D", "G", "Em", "C", "D", "D7"]
    + ["G", "C", "G", "D", "G", "C", "D", "G"],
    melody=OUTSIDE_A
    + OUTSIDE_A[:3] + ["A5/1 B5/.5 A5/.5 F#5/1 D5/1", OUTSIDE_A[4], "E6/1 C6/1 A5/1 G5/.5 A5/.5",
                       "B5/.5 C6/.5 D6/1 F#5/1 A5/1", "G5/3 r/1"]
    + ["E6/1 D6/.5 B5/.5 G5/1 B5/1", "C6/1 B5/.5 A5/.5 G5/1 E5/1", "F#5/1 A5/1 D6/1 C6/1", "B5/1 A5/.5 G5/.5 D5/2",
       "E5/.5 G5/.5 B5/1 E6/1 D6/1", "C6/.5 B5/.5 A5/1 G5/1 E5/1", "D5/.5 E5/.5 F#5/.5 G5/.5 A5/1 C6/1",
       "B5/.5 A5/.5 F#5/1 D5/1 r/1"]
    + OUTSIDE_A,
    up=["G5", "B5", "D6", "G6", "B6", "D7"],
)

ART_A = [
    "C6/1 A5/1 F5/1 A5/1",
    "D6/1 Bb5/1 F5/2",
    "E5/1 G5/1 C6/1 Bb5/1",
    "A5/3 r/1",
    "D6/1 C6/1 A5/1 F5/1",
    "F5/1 Bb5/1 D6/1 C6/1",
    "Bb5/.5 A5/.5 G5/1 E5/1 G5/1",
    "F5/3 r/1",
]
ART = dict(
    bpm=120, root="F", base="marimba", tune="glock", counter="xylo", strum=None, soft=True,
    chords=["F", "Bb", "C", "F", "Dm", "Bb", "C", "F"] * 2 + ["Gm", "C", "F", "Dm", "Bb", "C", "F", "C7"]
    + ["F", "Bb", "C", "F", "Dm", "Bb", "C", "F"],
    melody=ART_A
    + ART_A[:4] + ["F6/1 E6/.5 D6/.5 A5/2", "Bb5/1 C6/.5 D6/.5 F6/2", "E6/1 C6/1 G5/1 Bb5/1", "F5/2 r/2"]
    + ["G5/1 Bb5/1 D6/2", "C6/1 Bb5/.5 A5/.5 G5/2", "A5/1 C6/1 F6/2", "D6/1 C6/.5 A5/.5 F5/2",
       "D6/.5 C6/.5 Bb5/1 F5/1 D6/1", "C6/.5 Bb5/.5 G5/1 E5/1 C6/1", "A5/1 F5/1 C6/1 A5/1", "G5/1 Bb5/1 E5/2"]
    + ART_A,
    up=["F5", "A5", "C6", "F6", "A6", "C7"],
)

SONGS = {"kitchen": KITCHEN, "outside": OUTSIDE, "art": ART}
BARS = 32
STRUMS = {
    # (beat, 'D' down / 'U' up / 'X' a chuck: muted, percussive, strength)
    "island": [(0, "D", 1.0), (1, "D", 0.8), (1.5, "U", 0.55), (2.5, "U", 0.55), (3, "D", 0.8), (3.5, "U", 0.55)],
    "chuck": [(0, "D", 1.0), (1, "X", 0.7), (1.5, "U", 0.5), (2, "D", 0.9), (3, "X", 0.7), (3.5, "U", 0.5)],
}


class Track:
    """A stereo buffer with placement: add(mono, at_seconds, gain, pan -1..1)."""

    def __init__(self, n):
        self.y = np.zeros((n, 2))

    def add(self, x, at, gain=1.0, pan=0.0):
        s = max(0, int(round(at * SR)))
        e = min(self.y.shape[0], s + x.size)
        if e <= s:
            return
        a = (pan + 1) * np.pi / 4
        self.y[s:e, 0] += x[: e - s] * gain * np.cos(a)
        self.y[s:e, 1] += x[: e - s] * gain * np.sin(a)


def room_ir(seconds=0.55, tau=0.085, seed=3):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    rng = np.random.default_rng(seed)
    ir = rng.standard_normal((n, 2)) * np.exp(-t / tau)[:, None]
    ir = sosfilt(butter(1, 5000, "lowpass", fs=SR, output="sos"), ir, axis=0)
    pre = int(0.012 * SR)
    ir = np.vstack([np.zeros((pre, 2)), ir])
    return ir / np.sqrt((ir ** 2).sum(axis=0))


IR = room_ir()


def reverb(y, wet):
    w = np.stack([fftconvolve(y[:, c], IR[:, c])[: y.shape[0]] for c in range(2)], axis=1)
    return y + wet * w


def render(song: dict):
    bpm = song["bpm"]
    spb = 60 / bpm
    bar = 4 * spb
    loop_n = int(round(BARS * bar * SR))
    n = loop_n + int(2 * bar * SR)
    jit = np.random.default_rng(11)
    J = lambda s=0.004: jit.uniform(-s, s)  # a person playing: a few ms early or late
    soft = song.get("soft", False)
    root_pc = midi(song["root"] + "0") % 12
    base, tune, party = Track(n), Track(n), Track(n)

    # ----- base: chords
    if song["base"] == "uke":
        pat = STRUMS[song["strum"]]
        events = []  # (time, direction, strength, voicing)
        for b, sym in enumerate(song["chords"]):
            for beat, d, s in pat:
                events.append((b * bar + beat * spb, d, s, uke_voicing(sym)))
        hp = butter(2, 160, "highpass", fs=SR, output="sos")
        for i, (t0, d, s, v) in enumerate(events):
            nxt = events[i + 1][0] if i + 1 < len(events) else events[0][0] + BARS * bar
            strings = [0, 1, 2, 3] if d in "DX" else [3, 2, 1]
            for j, si in enumerate(strings):
                ring = (nxt - t0) + 0.03 if d != "X" else 0.06
                x = pluck(v[si], (i + si) % 3, 0.55 if d == "D" else 0.4)[: int(min(ring, 2.1) * SR)].copy()
                fade = min(int(0.03 * SR), x.size)
                x[-fade:] *= np.linspace(1, 0, fade)
                g = s * (0.85 + 0.15 * jit.random()) * (0.75 if d == "U" else 1)
                if d == "X":  # the chuck: the palm stops the strings at once, a knock of the body
                    x = x * env_ad(x.size, 0.001, 0.012)
                    g *= 1.4
                base.add(sosfilt(hp, x), t0 + j * 0.011 + J(), 0.32 * g, -0.25)
            if d == "X":
                base.add(noise_hit(0.05, 200, 1200, 0.001, 0.01, i), t0 + J(), 0.25 * s, -0.25)
    else:  # marimba broken chords in eighths (the art song: calm, rolling)
        for b, sym in enumerate(song["chords"]):
            r, pcs = chord_pcs(sym)
            lo = midi("F3") + ((r - midi("F3")) % 12)
            tones = sorted({lo + ((pc - lo) % 12) for pc in pcs})[:3]
            third = tones[1]
            figure = [tones[0], tones[2], tones[0] + 12, third + 12, tones[2] + 12, third + 12, tones[0] + 12, tones[2]]
            for k, mm in enumerate(figure):
                base.add(mallet("marimba", mm, 1.2), b * bar + k * spb / 2 + J(), 0.22 * (1.0 if k % 2 == 0 else 0.75),
                         -0.2 + 0.05 * (k % 4))

    # ----- base: bass (root, root, fifth, then the fifth again, or the octave before a new chord)
    for b, sym in enumerate(song["chords"]):
        r, pcs = chord_pcs(sym)
        lo = midi("E2") + ((r - midi("E2")) % 12)
        fifth = lo + 7
        nxt_r, _ = chord_pcs(song["chords"][(b + 1) % BARS])
        line = [(0, lo, 1), (1.5, lo, 0.5), (2, fifth, 1), (3.5, fifth if nxt_r == r else lo + 12, 0.5)] \
            if not soft else [(0, lo, 2), (2, fifth, 1.5)]
        for beat, mm, d in line:
            base.add(bass(mm, d, spb), b * bar + beat * spb + J(0.003), 0.55 * (1 if beat in (0, 2) else 0.75), 0.0)

    # ----- base: shaker (8ths, offbeats leaning) or claps on 2 and 4
    for b in range(BARS):
        for k in range(8):
            if soft and k % 2 == 0:
                continue
            base.add(shaker(b * 8 + k), b * bar + k * spb / 2 + J(0.006), (0.05 if k % 2 == 0 else 0.08) * (0.6 if soft else 1), 0.35)
        if song.get("clap_base"):
            for beat in (1, 3):
                base.add(clap(b * 4 + beat), b * bar + beat * spb + J(0.003), 0.16, 0.1)

    # ----- tune: the melody
    for b, text in enumerate(song["melody"]):
        for beat, d, mm in parse_bar(text):
            if mm is None:
                continue
            at = b * bar + beat * spb
            if song["tune"] == "whistle":
                tune.add(whistle(mm, d, spb), at + J(0.003), 0.30, 0.05)
            else:
                kind = song["tune"]
                tune.add(mallet(kind, mm), at + J(0.003), 0.42 if kind == "xylo" else 0.34, 0.1)
                if kind == "xylo" and d >= 1.5:  # a long note on a xylophone is a soft roll
                    k = 1
                    while k * 0.5 < d - 0.25:
                        tune.add(mallet(kind, mm), at + k * spb / 2 + J(0.003), 0.42 * 0.45, 0.1)
                        k += 1

    # ----- party: kick, claps, tambourine, a counter-melody on the offbeats, fills into each section
    ck = kick()
    for b, sym in enumerate(song["chords"]):
        t0 = b * bar
        fill = b % 8 == 7
        for beat in range(4):
            if not soft or beat in (0, 2):
                party.add(ck, t0 + beat * spb, 0.5 if not soft else 0.38, 0)
        for beat in (1, 3):
            party.add(clap(1000 + b * 4 + beat), t0 + beat * spb + J(0.003), 0.3 if not soft else 0.2, -0.05)
        for k in range(8):
            if k % 2 == 1 or (k == 6):
                party.add(tamb(2000 + b * 8 + k), t0 + k * spb / 2 + J(0.004), 0.16 if k % 2 else 0.1, 0.4)
        r, pcs = chord_pcs(sym)
        lo = midi("C6") + ((r - midi("C6")) % 12) - 12 if song["counter"] == "glock" else midi("C5") + ((r - midi("C5")) % 12)
        tones = sorted({lo + ((pc - lo) % 12) for pc in pcs[:3]})
        if not fill:
            for k, mm in zip((1, 3, 5, 7), (tones[0] + 12, tones[2], tones[1] + 12, tones[2])):
                party.add(mallet(song["counter"], mm, 1.2), t0 + k * spb / 2 + J(0.003), 0.17, -0.3)
        else:  # a fill: claps in 8ths then 16ths, a mallet run up the chord into the next section
            for k in range(4):
                party.add(clap(3000 + b * 8 + k), t0 + 2 * spb + k * spb / 4, 0.16 + 0.04 * k, 0)
            run = [tones[0], tones[1], tones[2], tones[0] + 12, tones[1] + 12, tones[2] + 12]
            for k, mm in enumerate(run):
                party.add(mallet(song["counter"], mm, 1.0), t0 + spb + k * spb / 4, 0.14 + 0.02 * k, -0.3)

    out = {}
    for name, tr, wet in (("base", base, 0.16), ("tune", tune, 0.22), ("party", party, 0.12)):
        y = reverb(tr.y, wet)
        y = sosfilt(butter(2, 35, "highpass", fs=SR, output="sos"), y, axis=0)
        y[: n - loop_n] += y[loop_n:]  # the tail rings on into the head: a seamless loop
        out[name] = y[:loop_n]
    # the stinger: one bar, a run up the tonic chord on the glockenspiel and a tambourine shake
    up = Track(int(2.2 * SR))
    for k, nm in enumerate(song["up"]):
        up.add(mallet("glock", midi(nm), 1.6), k * spb / 4, 0.3 + 0.03 * k, -0.2 + 0.08 * k)
    up.add(tamb(77), 5 * spb / 4, 0.25, 0.3)
    out["up"] = reverb(up.y, 0.18)
    return out


# ---------------------------------------------------------------- loudness, files, checks


def write_wav(path: Path, y):
    path.parent.mkdir(parents=True, exist_ok=True)
    wavfile.write(path, SR, y.astype(np.float32))


def loudness(y):
    """Integrated loudness (LUFS) and true peak (dBTP) by ffmpeg's EBU R128 meter."""
    p = WORK / "_meter.wav"
    write_wav(p, y)
    r = subprocess.run([FFMPEG, "-hide_banner", "-nostats", "-i", str(p), "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    i = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1])
    tp = float(re.findall(r"Peak:\s+(-?[\d.inf]+) dBFS", r)[-1])
    return i, tp


def seam(y, at=0):
    """At sample `at` of the loop (0 = the join): the largest sample step there, and the energy above 6 kHz in the 2 ms
    around it vs the 10 ms after (dB). The join falls on the first downbeat, so an attack starts there: compare it
    with the same numbers at an ordinary downbeat inside the loop (a click would stand out from those)."""
    w = np.roll(y, -at, axis=0)
    w = np.vstack([w[-int(0.2 * SR):], w[: int(0.2 * SR)]])
    mid = int(0.2 * SR)
    jump = float(np.abs(w[mid] - w[mid - 1]).max())
    hp = sosfilt(butter(4, 6000, "highpass", fs=SR, output="sos"), w, axis=0)
    a = (hp[mid - int(0.001 * SR): mid + int(0.001 * SR)] ** 2).mean()
    after = (hp[mid + int(0.002 * SR): mid + int(0.012 * SR)] ** 2).mean() + 1e-15
    return round(jump, 4), round(float(10 * np.log10(a / after + 1e-15)), 1)


def ogg(src: Path, dst: Path, mono: bool):
    dst.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-i", str(src)] + (["-ac", "1"] if mono else [])
                   + ["-c:a", "libvorbis", "-q:a", "3", "-ar", str(SR), str(dst)], check=True)


def build(name: str, preview: Path | None):
    song = SONGS[name]
    st = render(song)
    # balance: the melody 1 LU under the base; the party layer adds 2 LU to base + tune; all of it at -20 LUFS
    lb, _ = loudness(st["base"])
    lt, _ = loudness(st["tune"])
    st["tune"] *= 10 ** ((lb - 1 - lt) / 20)
    bt = st["base"] + st["tune"]
    lbt, _ = loudness(bt)
    lp, _ = loudness(st["party"])
    want = 10 * np.log10(10 ** 0.2 - 1) + lbt  # party power = 0.585 x (base + tune)
    st["party"] *= 10 ** ((want - lp) / 20)
    full = bt + st["party"]
    lf, _ = loudness(full)
    g = 10 ** ((-20 - lf) / 20)
    for k in ("base", "tune", "party"):
        st[k] *= g
    st["up"] *= 10 ** ((lt - 2 - loudness(st["up"])[0]) / 20) * g  # as loud as the melody
    full = st["base"] + st["tune"] + st["party"]
    report = {"bpm": song["bpm"], "seconds": round(st["base"].shape[0] / SR, 3), "samples": st["base"].shape[0]}
    report["full_lufs"], report["full_tp"] = loudness(full)
    report["base_tune_lufs"], report["base_tune_tp"] = loudness(st["base"] + st["tune"])
    bar17 = int(round(16 * 4 * 60 / song["bpm"] * SR))  # an ordinary downbeat (the B section's first) to compare with
    for k, y in (("base", st["base"]), ("tune", st["tune"]), ("party", st["party"]), ("full", full)):
        report[f"seam_{k}"] = {"join": seam(y), "bar17": seam(y, bar17)}
    for k in ("base", "tune", "party", "up"):
        wav = WORK / f"music-{name}-{k}.wav"
        write_wav(wav, st[k])
        ogg(wav, FINAL / f"music-{name}-{k}.ogg", mono=k in ("tune", "party"))
        report[f"bytes_{k}"] = (FINAL / f"music-{name}-{k}.ogg").stat().st_size
    if preview:
        make_preview(name, song, st, preview)
    return report


def make_preview(name, song, st, out: Path):
    """About 45 s: base + tune for 12 bars, then the stinger and the party layer for 8 bars, then 4 bars without it."""
    bar = int(round(4 * 60 / song["bpm"] * SR))
    n = 24 * bar + 2 * SR
    y = np.zeros((n, 2))
    reps = int(np.ceil(n / st["base"].shape[0]))
    for k in ("base", "tune"):
        y += np.tile(st[k], (reps, 1))[:n]
    p = np.tile(st["party"], (reps, 1))[:n]
    gate = np.zeros(n)
    on, off = 12 * bar, 20 * bar
    gate[on:off] = 1
    gate[on: on + int(0.3 * SR)] = np.linspace(0, 1, int(0.3 * SR))
    gate[off: off + 2 * SR] = np.linspace(1, 0, 2 * SR)
    y += p * gate[:, None]
    u = st["up"]
    s = on - int(0.05 * SR)
    y[s: s + u.shape[0]] += u[: n - s]
    fade = 2 * SR
    y[-fade:] *= np.linspace(1, 0, fade)[:, None]
    out.mkdir(parents=True, exist_ok=True)
    wav = WORK / f"preview-{name}.wav"
    write_wav(wav, y)
    subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav), "-c:a", "libmp3lame", "-q:a", "3",
                    str(out / f"song-{name}.mp3")], check=True)


if __name__ == "__main__":
    args = sys.argv[1:]
    preview = None
    if "--preview" in args:
        i = args.index("--preview")
        preview = Path(args[i + 1])
        del args[i: i + 2]
    names = args or list(SONGS)
    WORK.mkdir(parents=True, exist_ok=True)
    reports = {n: build(n, preview) for n in names}
    print(json.dumps(reports, indent=1))
    (WORK / "report.json").write_text(json.dumps(reports, indent=1))
