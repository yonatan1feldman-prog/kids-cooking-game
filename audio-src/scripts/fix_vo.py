"""Targeted, approved fixes to six voice-a-mom lines (2026-09-19). Everything else keeps make_vo.py's processing.

  python fix_vo.py build   -> renders candidates into work/vo/fix/ and writes work/vo/fix/measure.json (loads Kokoro for approach A)
  python fix_vo.py apply   -> copies the chosen candidates into voice-a-mom/ and updates work/vo/report-mom.json

vo-temp-more: the make_vo trim, then a gentle soft limiter (same design as work/sfx/scripts/process.py --limit) on the one
  sharp peak, so that normalizing to -18 LUFS no longer hits the -1.5 dBFS peak cap first.
count-2/5/6/7, temp-50: Kokoro adds a short voiced "uh" before the word (and after "six"). Two approaches, the cleaner one wins:
  A  the word three times in one carrier sentence ("Six! ... Six! ... Six!"). Kokoro leaves almost no silence between them,
     so each instance is cut at its consonants (split_struct); the cleanest instance is kept.
  B  the original raw take, with the start cut just before the opening consonant (3 ms fade-in, 20 ms of silence in front,
     as make_vo keeps 20 ms before the start) and, for count-6, the end cut just after the final "s" (8 ms fade-out).
Both then get make_vo's loudness step (-18 LUFS, -1.5 dBFS peak cap) and the same OGG Vorbis q3 encode.
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.ndimage import maximum_filter1d, uniform_filter1d

ROOT = Path(__file__).resolve().parent.parent
FFMPEG = ROOT / "tools/ffmpeg/bin/ffmpeg.exe"
WORK = ROOT / "work/vo/fix"
TARGET_LUFS = -18.0
PEAK_LIMIT = 10 ** (-1.5 / 20)
WORDS = {"count-2": "Two", "count-5": "Five", "count-6": "Six", "count-7": "Seven", "temp-50": "Fifty"}
TAIL_CUT = {"count-6"}  # words that also get an "uh" after the final consonant
NUMS = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "fifty", "hundred", "[unk]"]
MIN_LEN, MAX_LEN = 0.55, 0.80


# --- identical to make_vo.py -------------------------------------------------------------------------
def trim(x, sr, thresh_db=-42, pre=0.02, post=0.06):
    env = np.abs(x)
    win = int(0.01 * sr)
    env = np.convolve(env, np.ones(win) / win, mode="same")
    thr = env.max() * 10 ** (thresh_db / 20)
    idx = np.where(env > thr)[0]
    a = max(0, idx[0] - int(pre * sr)); b = min(len(x), idx[-1] + int(post * sr))
    y = x[a:b].copy()
    fi, fo = int(0.005 * sr), int(0.04 * sr)
    y[:fi] *= np.linspace(0, 1, fi); y[-fo:] *= np.linspace(1, 0, fo)
    return y

def loudness(y, sr):
    meter = pyln.Meter(sr, block_size=min(0.4, len(y) / sr * 0.9))
    return meter.integrated_loudness(np.concatenate([y, y, y]))

def normalize(y, sr):
    y = y * 10 ** ((TARGET_LUFS - loudness(y, sr)) / 20)
    pk = np.abs(y).max()
    if pk > PEAK_LIMIT:
        y *= PEAK_LIMIT / pk
    return y
# ------------------------------------------------------------------------------------------------------

def encode(y, sr, stem):
    wav = WORK / f"{stem}.wav"
    sf.write(wav, y, sr, subtype="PCM_16")
    out = WORK / f"{stem}.ogg"
    subprocess.run([str(FFMPEG), "-y", "-loglevel", "error", "-i", str(wav), "-c:a", "libvorbis", "-q:a", "3", "-ac", "1", str(out)], check=True)
    return out

def decode(path):
    x, sr = sf.read(path)
    return np.asarray(x, dtype=np.float64), sr

def frames(x, sr, hop=0.01):
    h = int(hop * sr); out = []
    for i in range(0, len(x) - h, h):
        f = x[i:i + h]
        out.append((i, 20 * np.log10(np.sqrt(np.mean(f ** 2)) + 1e-9), np.mean(np.abs(np.diff(np.sign(f)))) / 2 * sr))
    return out

def runs(fr, pk, min_len=3):
    """Consonant-noise runs as (first, last) frame index: >= 30 ms of high zero-crossing rate within 35 dB of the peak
    (so a tiny click is not mistaken for a consonant)."""
    out, i = [], 0
    noisy = [z > 5000 and d > pk - 35 for _, d, z in fr]
    while i < len(fr):
        if noisy[i]:
            j = i
            while j < len(fr) and noisy[j]: j += 1
            if j - i >= min_len: out.append((i, j - 1))
            i = j
        else:
            i += 1
    return out

def fric_runs(fr, pk):
    r = runs(fr, pk)
    return (r[0][0], r[-1][1]) if r else (None, None)

def blobs(x, sr, tail):
    """Extra-vowel energy in dB relative to the loudest frame: voiced frames before the opening consonant (lead)
    and, for words ending in a consonant, after the final one (trail). None = no such frame at all."""
    fr = frames(x, sr); pk = max(d for _, d, _ in fr)
    f0, f1 = fric_runs(fr, pk)
    lead = [d for _, d, z in fr[:f0] if z < 3000 and d > pk - 60]
    trail = [d for _, d, z in fr[f1 + 1:] if z < 3000 and d > pk - 60] if tail else []
    r = lambda v: round(max(v) - pk, 1) if v else None
    return r(lead), (r(trail) if tail else "n/a")

_asr = None
def asr(path, grammar=True):
    global _asr
    from vosk import Model, KaldiRecognizer, SetLogLevel
    SetLogLevel(-1)
    _asr = _asr or Model(str(ROOT / "work/sfx/vosk-model-small-en-us-0.15"))
    pcm = subprocess.run([str(FFMPEG), "-v", "error", "-i", str(path), "-af", "adelay=300,apad=pad_dur=0.3",
                          "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout  # 0.3 s silence each side, for every candidate
    r = KaldiRecognizer(_asr, 16000, json.dumps(NUMS)) if grammar else KaldiRecognizer(_asr, 16000)
    r.SetWords(True); r.AcceptWaveform(pcm)
    return [(w["word"], round(w["conf"], 2)) for w in json.loads(r.FinalResult()).get("result", [])]

def measure(path, name):
    x, sr = decode(path)
    lead, trail = blobs(x, sr, name in TAIL_CUT)
    return {"file": str(path.relative_to(ROOT)).replace("\\", "/"), "dur": round(len(x) / sr, 3), "lufs": round(loudness(x, sr), 2),
            "peak_dbfs": round(20 * np.log10(np.abs(x).max()), 2), "lead_db": lead, "trail_db": trail,
            "asr": asr(path, grammar=name != "vo-temp-more")}

# --- approach B: tighter cut of the original raw take ------------------------------------------------
def cut_b(raw, sr, name):
    fr = frames(raw, sr); pk = max(d for _, d, _ in fr)
    f0, f1 = fric_runs(fr, pk)
    a = max(0, fr[f0][0] - int(0.002 * sr))              # 2 ms before the opening consonant
    # where make_vo would end the file: 60 ms after the last sound above -42 dB
    env =np.convolve(np.abs(raw), np.ones(int(0.01 * sr)) / int(0.01 * sr), mode="same")
    b = min(len(raw), np.where(env > env.max() * 10 ** (-42 / 20))[0][-1] + int(0.06 * sr))
    fo = int(0.04 * sr)
    if name in TAIL_CUT:
        b = fr[f1][0] + int(0.01 * sr) + int(0.003 * sr)  # end of the final "s" frame + 3 ms
        fo = int(0.008 * sr)
    return cut_fade(raw, sr, a, b, fo)

def cut_fade(x, sr, a, b, fo):
    """a..b with a 3 ms fade-in and the given fade-out, preceded by 20 ms of silence (make_vo keeps 20 ms before the start)."""
    y = x[a:b].copy()
    fi = int(0.003 * sr)
    y[:fi] *= np.linspace(0, 1, fi); y[-fo:] *= np.linspace(1, 0, fo)
    return np.concatenate([np.zeros(int(0.02 * sr)), y])

# --- approach A: three takes in one carrier sentence --------------------------------------------------
def split_struct(x, sr, n_per, tail):
    """Cut the carrier into its three instances using the consonant runs: a word with n_per runs in its single take
    must show exactly 3 * n_per runs here. Each instance starts 2 ms before its opening consonant. It ends 3 ms after its
    final consonant (words ending in one, like "six"), otherwise where the level first falls 35 dB under the peak after
    its last run (the next instance's lead-in is not included)."""
    fr = frames(x, sr); pk = max(d for _, d, _ in fr)
    r = runs(fr, pk)
    if len(r) != 3 * n_per:
        return None, len(r)
    hop = int(0.01 * sr); out = []
    for k in range(3):
        first, last = r[k * n_per], r[k * n_per + n_per - 1]
        a = max(0, fr[first[0]][0] - int(0.002 * sr))
        if tail:
            b, fo = fr[last[1]][0] + hop + int(0.003 * sr), int(0.008 * sr)
        else:
            nxt = r[(k + 1) * n_per][0] if k < 2 else len(fr)
            j = last[1] + 1
            while j < nxt and fr[j][1] > pk - 35: j += 1
            b, fo = min(len(x), fr[j][0] if j < len(fr) else len(x)), int(0.04 * sr)
        out.append(cut_fade(x, sr, a, b, fo))
    return out, len(r)

# --- vo-temp-more: gentle limiter, then normalize ------------------------------------------------------
def soft_limit(y, sr, ceiling):
    env = maximum_filter1d(np.abs(y), size=int(0.006 * sr))
    gr = np.minimum(1.0, ceiling / np.maximum(env, 1e-9))
    gr = np.minimum(gr, uniform_filter1d(gr, size=int(0.004 * sr)))
    gr = uniform_filter1d(gr, size=int(0.004 * sr))
    return y * gr, gr

def limit_and_normalize(y, sr):
    """Raise to -18 LUFS; the soft limiter keeps the peak at the cap instead of the cap lowering the whole clip."""
    g = 10 ** ((TARGET_LUFS - loudness(y, sr)) / 20); ceiling = PEAK_LIMIT * 10 ** (-0.2 / 20)
    for _ in range(8):
        z, gr = soft_limit(y * g, sr, ceiling)
        l = loudness(z, sr)
        if abs(l - TARGET_LUFS) < 0.02: break
        g *= 10 ** ((TARGET_LUFS - l) / 20)
    pk = np.abs(z).max()
    if pk > PEAK_LIMIT: z *= PEAK_LIMIT / pk
    return z, round(float(-20 * np.log10(gr.min())), 2)

def build():
    WORK.mkdir(parents=True, exist_ok=True)
    res = {"reference": {}, "files": {}}
    # reference levels, measured the same way on the shipped oggs
    sents = [p for p in sorted((ROOT / "voice-a-mom").glob("vo-*.ogg")) if p.stem != "vo-temp-more"]
    counts = [p for p in sorted((ROOT / "voice-a-mom").glob("count-*.ogg")) if p.stem not in WORDS]
    res["reference"]["sentences"] = {p.stem: round(loudness(*decode(p)), 2) for p in sents}
    res["reference"]["counts"] = {p.stem: round(loudness(*decode(p)), 2) for p in counts}

    # vo-temp-more
    raw, sr = decode(ROOT / "work/vo/voice-a-mom-vo-temp-more-raw.wav")
    y, gr = limit_and_normalize(trim(raw, sr), sr)
    out = encode(y, sr, "vo-temp-more_L")
    res["files"]["vo-temp-more"] = {"before": measure(ROOT / "work/vo/pre-fix/vo-temp-more.ogg", "vo-temp-more"),
                                    "L": {**measure(out, "vo-temp-more"), "limiter_max_gr_db": gr}}
    # counts / temp-50
    from kokoro_onnx import Kokoro
    kok = Kokoro(str(ROOT / "tools/kokoro/kokoro-v1.0.onnx"), str(ROOT / "tools/kokoro/voices-v1.0.bin"))
    for name, word in WORDS.items():
        r = {"before": measure(ROOT / f"work/vo/pre-fix/{name}.ogg", name)}
        raw, sr = decode(ROOT / f"work/vo/voice-a-mom-{name}-raw.wav")
        r["B"] = measure(encode(normalize(cut_b(raw, sr, name), sr), sr, f"{name}_B"), name)
        fr = frames(raw, sr); n_per = len(runs(fr, max(d for _, d, _ in fr)))
        text = f"{word}! ... {word}! ... {word}!"
        audio, sr = kok.create(text, voice="af_heart", speed=0.85, lang="en-us")
        audio = np.asarray(audio, dtype=np.float64)
        sf.write(WORK / f"{name}_A-carrier-raw.wav", audio, sr)
        segs, found = split_struct(audio, sr, n_per, name in TAIL_CUT)
        r["A_carrier"] = {"text": text, "consonant_runs_expected": 3 * n_per, "found": found}
        for k, seg in enumerate(segs or [], 1):
            r[f"A{k}"] = measure(encode(normalize(seg, sr), sr, f"{name}_A{k}"), name)
        res["files"][name] = r
        print(name, "done", flush=True)
    del kok
    json.dump(res, open(WORK / "measure.json", "w"), indent=1)

def apply(choice):
    rep_path = ROOT / "work/vo/report-mom.json"
    rep = json.load(open(rep_path))
    for name, cand in choice.items():
        src = WORK / f"{name}_{cand}.ogg"
        dst = ROOT / "voice-a-mom" / f"{name}.ogg"
        dst.write_bytes(src.read_bytes())
        y, sr = decode(WORK / f"{name}_{cand}.wav")
        for r in rep:
            if r[0] == "voice-a-mom" and r[1] == name:
                r[2], r[3], r[4] = round(len(y) / sr, 2), float(round(loudness(y, sr), 1)), dst.stat().st_size
        print(name, "<-", src.name)
    json.dump(rep, open(rep_path, "w"), indent=1)

def round2():
    """Second approved round (2026-09-19):
    count-6: the clean approach-B cut (8 ms fade at the end of the word), padded with silence to 0.55 s, then make_vo's normalize.
    count-5, temp-50: their approach-B cut, then the same soft limiter + normalize as vo-temp-more."""
    y, sr = decode(WORK / "count-6_B.wav")
    y = np.concatenate([y, np.zeros(int(round(0.55 * sr)) - len(y))])
    out = {"count-6": measure(encode(normalize(y, sr), sr, "count-6_B55"), "count-6")}
    for name in ("count-5", "temp-50"):
        y, sr = decode(WORK / f"{name}_B.wav")
        z, gr = limit_and_normalize(y, sr)
        out[name] = {**measure(encode(z, sr, f"{name}_BL"), name), "limiter_max_gr_db": gr}
    json.dump(out, open(WORK / "measure-round2.json", "w"), indent=1)

if __name__ == "__main__":
    if sys.argv[1] == "build":
        build()
    elif sys.argv[1] == "round2":
        round2()
    elif sys.argv[1] == "apply":  # e.g. fix_vo.py apply vo-temp-more=L count-6=A2 count-2=B
        apply(dict(a.split("=") for a in sys.argv[2:]))
