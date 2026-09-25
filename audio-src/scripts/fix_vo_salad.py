"""Targeted fixes to the salad lines in voice-a-mom (2026-09-19). Everything else keeps make_vo.py's processing.
Reuses fix_vo.py's functions unchanged (measurement, approach-B cut, soft limiter, normalize, encode).

  python fix_vo_salad.py measure  -> measures every name-* file (lead/trail extra vowel + speech recognizer) into work/vo/fix-salad/measure.json
  python fix_vo_salad.py build    -> renders candidates into work/vo/fix-salad/ and measures them
  python fix_vo_salad.py apply    -> backs up the originals to work/vo/pre-fix-salad/, copies the chosen candidates into voice-a-mom/,
                                     updates work/vo/report-mom.json

name-carrot, name-pepper: Kokoro adds a short voiced "uh" before the opening consonant (as in count-2/5/7). Approach B of fix_vo.py:
  start cut 2 ms before the opening consonant (3 ms fade-in, 20 ms silence in front), end where make_vo ends the file.
name-onion: a ~70 ms breathy noise before the opening vowel (recognizer: [unk]). Same cut, at the start of voicing.
name-corn: a 30 ms unvoiced blip and a 40 ms gap before the "k". Same cut, at the "k".
Then make_vo's loudness step (-18 LUFS, -1.5 dBFS cap), padded with silence at the end to at least 0.55 s, OGG Vorbis q3.
vo-oil, vo-into-bowl: one sharp peak hit the -1.5 dBFS cap first (-21.9 / -19.5 LUFS). The make_vo trim, then fix_vo.py's soft limiter
  + normalize, exactly as vo-temp-more.
"""
import json, shutil, sys
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parent))
import fix_vo as F

ROOT = F.ROOT
WORK = F.WORK = ROOT / "work/vo/fix-salad"
PRE = ROOT / "work/vo/pre-fix-salad"
NAMES = ["cucumber", "tomato", "pepper", "carrot", "onion", "lettuce", "mushroom", "corn", "olives", "lemon"]
F.NUMS = NAMES + ["[unk]"]  # recognizer grammar: only this word list
F.TAIL_CUT = {"name-lettuce", "name-olives"}  # words that end in a fricative: the trail measurement applies
START_RUN = {"name-carrot": 0, "name-pepper": 0, "name-corn": 0}  # consonant run the word starts at (in the raw take the corn blip stays under the run threshold)
VOICING = {"name-onion"}  # starts at the first voiced frame after the leading noise
LIMIT = ["vo-oil", "vo-into-bowl"]
MIN_LEN = 0.55

def raw(name):
    return F.decode(ROOT / f"work/vo/voice-a-mom-{name}-raw.wav")

def measure_all(folder, pattern):
    return {p.stem: F.measure(p, p.stem) | {"asr_free": F.asr(p, grammar=False)} for p in sorted(folder.glob(pattern))}

def cut(x, sr, name):
    fr = F.frames(x, sr); pk = max(d for _, d, _ in fr)
    r = F.runs(fr, pk)
    if name in VOICING:
        i = r[0][1] + 1
        while fr[i][2] > 3000: i += 1
        a = fr[i][0]
    else:
        a = fr[r[START_RUN[name]][0]][0]
    a = max(0, a - int(0.002 * sr))
    env = np.convolve(np.abs(x), np.ones(int(0.01 * sr)) / int(0.01 * sr), mode="same")
    b = min(len(x), np.where(env > env.max() * 10 ** (-42 / 20))[0][-1] + int(0.06 * sr))  # make_vo's end point
    return F.cut_fade(x, sr, a, b, int(0.04 * sr)), round(a / sr, 3)

def pad(y, sr):
    n = int(round(MIN_LEN * sr))
    return np.concatenate([y, np.zeros(n - len(y))]) if len(y) < n else y

def build():
    WORK.mkdir(parents=True, exist_ok=True)
    res = {}
    for name in list(START_RUN) + sorted(VOICING):
        x, sr = raw(name)
        y, start = cut(x, sr, name)
        out = F.encode(pad(F.normalize(y, sr), sr), sr, f"{name}_B")
        res[name] = {"before": F.measure(ROOT / f"voice-a-mom/{name}.ogg", name) | {"asr_free": F.asr(ROOT / f"voice-a-mom/{name}.ogg", grammar=False)},
                     "B": F.measure(out, name) | {"asr_free": F.asr(out, grammar=False), "cut_at_s": start}}
        print(name, res[name]["B"], flush=True)
    for name in LIMIT:
        x, sr = raw(name)
        z, gr = F.limit_and_normalize(F.trim(x, sr), sr)
        out = F.encode(z, sr, f"{name}_L")
        res[name] = {"before": F.measure(ROOT / f"voice-a-mom/{name}.ogg", "vo-temp-more"),
                     "L": F.measure(out, "vo-temp-more") | {"limiter_max_gr_db": gr}}
        print(name, res[name]["L"], flush=True)
    json.dump(res, open(WORK / "measure-build.json", "w"), indent=1)

def apply(choice):
    PRE.mkdir(parents=True, exist_ok=True)
    for name in choice:
        if not (PRE / f"{name}.ogg").exists():
            shutil.copy2(ROOT / f"voice-a-mom/{name}.ogg", PRE / f"{name}.ogg")
    F.apply(choice)

if __name__ == "__main__":
    if sys.argv[1] == "measure":
        WORK.mkdir(parents=True, exist_ok=True)
        json.dump(measure_all(ROOT / "voice-a-mom", "name-*.ogg"), open(WORK / "measure.json", "w"), indent=1)
    elif sys.argv[1] == "build":
        build()
    elif sys.argv[1] == "apply":  # e.g. fix_vo_salad.py apply name-carrot=B vo-oil=L
        apply(dict(a.split("=") for a in sys.argv[2:]))
