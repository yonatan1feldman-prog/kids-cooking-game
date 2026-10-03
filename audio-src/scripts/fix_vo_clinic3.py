"""Targeted fixes to the clinic round 3 lines in voice-a-mom (2026-10-03; the fix_vo.py functions unchanged, the pattern of
fix_vo_minigames.py). The lines in LIMIT hit the -1.5 dBFS peak cap before -18 LUFS (down to -21.8): the same gentle soft
limiter as vo-temp-more, then -18 LUFS. The recognizer check of the older rounds was not run (no Vosk model here).

  python fix_vo_clinic3.py measure  -> lead / trail extra-vowel levels, LUFS and peak of the round's lines
  python fix_vo_clinic3.py apply    -> backs up the originals to work/vo/pre-fix-clinic3/, limits and re-encodes them into voice-a-mom/
                                    (then copy them to final/voice/ and public/assets/sounds/voice/)
"""
import shutil, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import fix_vo as F

ROOT = F.ROOT
PRE = ROOT / "work/vo/pre-fix-clinic3"
LINES = ["vo-sick-eye", "vo-sick-ear", "vo-tooth-food", "vo-germs", "vo-germ-run", "vo-tool-filler", "vo-tool-cotton", "vo-eye-speck", "vo-tool-eyedrops", "vo-tool-light", "vo-ear-bug", "vo-bug-bye", "vo-tool-swab", "vo-tool-icepack", "vo-tool-xray", "vo-tummy-germs", "vo-germs-gone", "vo-clinic-which", "vo-knee-dirt"]
LIMIT = ["vo-germs", "vo-ear-bug", "vo-tool-icepack", "vo-tool-xray", "vo-tummy-germs", "vo-eye-speck", "vo-knee-dirt"]


def measure():
    for n in LINES:
        x, sr = F.decode(ROOT / f"voice-a-mom/{n}.ogg")
        lead, trail = F.blobs(x, sr, False)
        print(n, round(len(x) / sr, 2), round(F.loudness(x, sr), 2), round(float(20 * F.np.log10(abs(x).max())), 2), lead, trail)


def apply():
    PRE.mkdir(parents=True, exist_ok=True)
    for n in LIMIT:
        src = ROOT / f"voice-a-mom/{n}.ogg"
        if not (PRE / src.name).exists():
            shutil.copy(src, PRE / src.name)
        x, sr = F.decode(PRE / src.name)
        y, db = F.limit_and_normalize(x, sr)
        F.WORK.mkdir(parents=True, exist_ok=True)
        shutil.copy(F.encode(y, sr, n), src)
        print(n, "limited", db, "dB")


if __name__ == "__main__":
    {"measure": measure, "apply": apply}[sys.argv[1]]()
