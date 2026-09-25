"""Builds final/ with the chosen files under the names the game uses, plus LICENSES.md and MIXING.md for that folder only."""
import json, re, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FINAL = ROOT / "final"
for d in ("voice", "music", "sfx"):  # MIXING.md is hand-written and kept
    shutil.rmtree(FINAL / d, ignore_errors=True)
    (FINAL / d).mkdir(parents=True)

# voice: every file from voice-a-mom, same names
for f in sorted((ROOT / "voice-a-mom").glob("*.ogg")):
    shutil.copy2(f, FINAL / "voice" / f.name)
# music
shutil.copy2(ROOT / "music/music-1.ogg", FINAL / "music/music-main.ogg")
# sfx: first candidate of each group, renamed
SFX = ["munch", "squish", "sprinkle", "whoosh", "bake", "star", "complete"]
# batch 2 (prep steps, 2026-09-19); a name whose -1 candidate is missing is skipped and listed as missing
SFX2 = ["chop", "water", "bubbles", "can-open", "jar-open", "pour", "grate", "camera", "click", "beep"]
SFX2_FOUND = [n for n in SFX2 if (ROOT / f"sfx-candidates/{n}-1.ogg").exists()]
# batch 3 (salad, 2026-09-19); same rule
SFX3 = ["tear", "squeeze", "crunch", "drizzle", "salt"]
SFX3_FOUND = [n for n in SFX3 if (ROOT / f"sfx-candidates/{n}-1.ogg").exists()]
# batch 4 (cookies, 2026-09-19); same rule
SFX4 = ["egg-crack", "flour-poof", "stamp", "icing", "cookie-crunch"]
SFX4_FOUND = [n for n in SFX4 if (ROOT / f"sfx-candidates/{n}-1.ogg").exists()]
# batch 5 (smoothie, 2026-09-19); same rule
SFX5 = ["blender", "lid-click", "slurp", "glass-pour"]
SFX5_FOUND = [n for n in SFX5 if (ROOT / f"sfx-candidates/{n}-1.ogg").exists()]
# batch 6 (pancakes, 2026-09-19); same rule
SFX6 = ["sizzle"]
SFX6_FOUND = [n for n in SFX6 if (ROOT / f"sfx-candidates/{n}-1.ogg").exists()]
# batch 7 (vegetable soup, 2026-09-20); same rule
SFX7 = ["peel"]
SFX7_FOUND = [n for n in SFX7 if (ROOT / f"sfx-candidates/{n}-1.ogg").exists()]
# batch 8 (birthday cake, 2026-09-20); same rule
SFX8 = ["blow"]
SFX8_FOUND = [n for n in SFX8 if (ROOT / f"sfx-candidates/{n}-1.ogg").exists()]
for name in SFX2_FOUND + SFX3_FOUND + SFX4_FOUND + SFX5_FOUND + SFX6_FOUND + SFX7_FOUND + SFX8_FOUND:
    shutil.copy2(ROOT / f"sfx-candidates/{name}-1.ogg", FINAL / f"sfx/{name}.ogg")
for name in SFX:
    shutil.copy2(ROOT / f"sfx-candidates/{name}-1.ogg", FINAL / f"sfx/{name}.ogg")

def row_for(notes, fname):
    for line in (ROOT / notes).read_text(encoding="utf-8").splitlines():
        if re.match(rf"^\|\s*`?{re.escape(fname)}`?\s*\|", line):
            return line
    raise SystemExit(f"no license row for {fname} in {notes}")

def header_for(notes):
    lines = (ROOT / notes).read_text(encoding="utf-8").splitlines()
    for i, l in enumerate(lines):
        if l.startswith("|") and i + 1 < len(lines) and re.match(r"^\|[-| :]+\|$", lines[i + 1]):
            return l, lines[i + 1]

rep = [r for r in json.load(open(ROOT / "work/vo/report-mom.json")) if r[0] == "voice-a-mom"]
texts = {}
src = (ROOT / "scripts/make_vo.py").read_text(encoding="utf-8")
for k, v in re.findall(r'^\s*"((?:vo|count|temp|name)-[\w-]+)": "(.*)",$', src.split("MOM_LINES = {", 1)[1].split("}", 1)[0], re.M):
    texts[k] = v.replace("\'", "'")

lic = ["# Licenses: final/", "",
"This file covers only the files in this folder. Every file is either CC0 1.0 (public domain dedication; no attribution required, credited anyway) or narration generated locally with an Apache-2.0 model.", "",
f"## voice/ ({len(rep)} files)", "",
"- **Source:** generated locally with **Kokoro-82M** v1.0 (https://huggingface.co/hexgrad/Kokoro-82M), ONNX build from https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0.",
"- **License:** the model weights are Apache-2.0. The model was trained only on permissive or non-copyrighted audio. The generated audio contains no third-party recordings.",
"- **Voice and processing:** `af_heart` (American English female), speed 0.85. Silence trimmed at -42 dB relative to peak (20 ms kept before the start, 60 ms after the end), 5 ms fade-in, 40 ms fade-out. Loudness -18 LUFS with a -1.5 dBFS peak cap. Mono, 24 kHz, OGG Vorbis q3.",
"- **Spoken text:** matches the script word for word, except for an added comma in \"Now, you try!\". \"Pipa\" is pronounced PEE-pa.",
"- **Prep steps (added 2026-09-19):** 40 more lines (25 `vo-*` prep-step lines, `count-1`..`count-10`, `temp-50`..`temp-250`), same engine, voice, speed and processing. A check run reproduced the existing raw audio of vo-bye and vo-praise-1 exactly (difference below 16-bit rounding), so the new lines match the old ones.",
"- **Targeted fix (2026-09-19, approved): `scripts/fix_vo.py`. vo-temp-more: gentle soft limiter on its one sharp peak (max 2.96 dB), then -18 LUFS (was -20.7). count-2, count-5, count-7, temp-50: start cut just before the opening consonant (3 ms fade-in, 20 ms silence in front), which removes a short voiced \"uh\" the engine added before the word. Second approved round: count-6 uses the clean cut (start before the \"s\", end 3 ms after the final \"s\" with an 8 ms fade-out), padded with silence to 0.55 s, then -18 LUFS. count-5 and temp-50 got the same soft limiter and normalization as vo-temp-more (max 0.9-1.0 dB), which brings them to the level of the other count/temp files. Originals are kept in `work/vo/pre-fix/`.**",
"- **Salad (added 2026-09-19):** 26 more lines (16 `vo-*` salad lines and 10 `name-*` ingredient names), same engine, voice, speed and processing. **Targeted fix (`scripts/fix_vo_salad.py`, reusing fix_vo.py's functions):** name-carrot and name-pepper had the same voiced \"uh\" before the opening consonant as the count files, name-onion a short breathy noise before the vowel (the speech recognizer, limited to the ten ingredient words, heard `[unk]`), and name-corn a short blip before the \"k\". All four: start cut just before the word (3 ms fade-in, 20 ms silence in front), then -18 LUFS. After the fix the limited recognizer hears each word at confidence 1.0. vo-oil and vo-into-bowl: one sharp peak held them at -21.8 / -19.5 LUFS; the same soft limiter as vo-temp-more (max 4.2 / 1.8 dB), then -18 LUFS. Originals are kept in `work/vo/pre-fix-salad/`.", "",
"- **Cookies (added 2026-09-19):** 23 more lines (19 `vo-*` cookie lines and 4 `name-*` cookie-cutter shapes), same engine, voice, speed and processing. **Targeted fix (`scripts/fix_vo_cookies.py`, reusing fix_vo.py's functions):** vo-egg had a short voiced \"uh\" before \"Crack\" (tight start cut at the \"k\"); vo-flour and vo-butter a breathy exhale after the last word (end cut into the noise, 25 ms fade-out); vo-decorate-cookies, vo-photo-cookies, vo-cookie-mom, vo-temp-150 and vo-pick-cookies hit the peak cap first (-22.6 to -18.6 LUFS) and got the same gentle soft limiter as vo-temp-more, then -18 LUFS; name-heart was regenerated as \"A heart!!\" (same phonemes, punctuation only) because the speech recognizer heard an extra \"a\". After the fixes the speech recognizer hears every line as written (\"flour\" as its homophone \"flower\"; \"Pipa\" is not in its vocabulary).",
"- **Fruit smoothie (added 2026-09-19):** 19 more lines (15 `vo-*` smoothie lines and 4 `name-*` fruit names), same engine, voice, speed and processing. **Targeted fix (`scripts/fix_vo_smoothie.py`, a copy of fix_vo_cookies.py reusing the same functions):** name-banana had a voiced \"uh\" before the \"b\" (the speech recognizer heard \"the banana\"): start cut at the \"b\" (3 ms fade-in, 20 ms silence in front); name-kiwi had a faint noise (-33 dB) before the \"k\": the same start cut; vo-into-blender had a breathy exhale after \"blender\" (end cut into the noise, 25 ms fade-out, as vo-flour) and, with vo-pick-smoothie, vo-smoothie-yum and vo-photo-smoothie, hit the peak cap first (-20.3 to -18.7 LUFS): the same gentle soft limiter as vo-temp-more (max 0.5-2.7 dB), then -18 LUFS. After the fixes the speech recognizer hears every sentence as written (\"pour\" as its homophone \"poor\"; \"Pipa\" is not in its vocabulary), and, limited to the four fruit names as for the salad names, each name at confidence 1.0.",
"- **Pancakes (added 2026-09-19):** 15 more `vo-*` lines, same engine, voice, speed and processing. **Targeted fix (`scripts/fix_vo_pancakes.py`, a copy of fix_vo_smoothie.py reusing the same functions):** vo-pancake-yum had a breathy hiss before the \"Mmm\" and an exhale after \"fluffy\": start cut at the first voiced frame after the hiss (as name-onion) and end cut into the exhale (25 ms fade-out, as vo-flour); vo-flip-done and vo-more-pancake had a breathy exhale after the last word: the same end cut; vo-ladle, vo-pick-pancakes, vo-photo-pancakes, vo-share-pancakes and vo-pancake-mom hit the peak cap first (-20.4 to -18.3 LUFS): the same gentle soft limiter as vo-temp-more (max 0.7-2.8 dB), then -18 LUFS. After the fixes the speech recognizer hears every line as written (\"Whee\" as its homophone \"we\").",
"- **Vegetable soup (added 2026-09-20):** 16 more lines (14 `vo-*` soup lines, `vo-album` for the recipe album, and 2 `name-*` vegetable names), same engine, voice, speed and processing. **Targeted fix (`scripts/fix_vo_soup.py`, a copy of fix_vo_pancakes.py reusing the same functions):** name-zucchini had a loud voiced \"uh\" before the \"z\" (-8.6 dB under the peak; the free recognizer heard \"is that kieny\"): start cut at the \"z\" (3 ms fade-in, 20 ms silence in front, as name-carrot) plus the gentle soft limiter (1.8 dB), then -18 LUFS (was -19.1); vo-stir-soup had the same \"uh\" before the \"st\" (-7.2 dB; the recognizer heard \"esther the soup\"): the same start cut, then -18 LUFS; vo-water had a breathy exhale after \"water\" (the recognizer heard \"waters\"): end cut 5 ms into the exhale with a 25 ms fade-out, as vo-flour; vo-album, vo-peel and vo-photo-soup hit the -1.5 dBFS peak cap first (-20.0 to -19.0 LUFS): the same gentle soft limiter as vo-temp-more (max 1.5-2.4 dB), then -18 LUFS. After the fixes the speech recognizer hears every sentence as written (\"pour\" as its homophone \"poor\"; \"Pipa\" is not in its vocabulary; \"bowl\" comes out as \"ball\", and \"All peeled!\" as \"oh peeled\", the same substitution the recognizer already makes on the shipped vo-wash-done, \"All clean!\"), and, limited to the two vegetable names as for the salad names, each name at confidence 1.0. A tail cut on vo-peel-done was tried and rejected: the noise after \"peeled\" is the \"d\" release, and cutting it lost the word. Originals are kept in `work/vo/pre-fix-soup/`.",
"- **Birthday cake (added 2026-09-20):** 19 more lines (16 `vo-*` cake lines and 3 `name-*` frosting colours), same engine, voice, speed and processing. **Targeted fix (`scripts/fix_vo_cake.py`, a copy of fix_vo_soup.py reusing the same functions):** name-pink and name-chocolate had a loud voiced \"uh\" before the opening consonant (-4.4 / -2.7 dB under the peak; the free recognizer heard \"the tank\" / \"a chocolate\"): start cut at the \"p\" / \"ch\" (3 ms fade-in, 20 ms silence in front, as name-carrot), then -18 LUFS; vo-pick-frosting had a fainter version of the same noise before the \"p\" (-14.2 dB): the same start cut, which raised the recognizer's confidence on \"pick\" from 0.64 to 0.81; vo-pour-pan had a breathy exhale after \"pan\" (the recognizer heard \"pans\"): end cut 5 ms into the exhale with a 25 ms fade-out, as vo-flour, after which it hears \"pan\" at 1.0; vo-decorate-cake, vo-photo-cake and vo-cake-pipa hit the -1.5 dBFS peak cap first (-19.0 / -18.6 / -18.2 LUFS): the same gentle soft limiter as vo-temp-more (max 1.3 / 1.1 / 0.6 dB), then -18 LUFS. After the fixes the speech recognizer hears every sentence as written (\"Yay!\" as its homophone \"yea\"; \"Pipa\" is not in its vocabulary, and it runs \"A slice\" together as \"as slice\", exactly as it does on the shipped vo-glass-mom / vo-cookie-mom lines), and, limited to the three frosting colours as for the salad names, each colour at confidence 1.0. The other 12 lines measured clean and were not changed. Originals of the changed lines are in `work/vo/pre-fix-cake/`.",
"| file | text | duration (s) | loudness (LUFS) | size (bytes) |", "|---|---|---|---|---|"]
order = list(texts)
for _, name, dur, lufs, size in sorted(rep, key=lambda r: order.index(r[1])):
    lic.append(f"| voice/{name}.ogg | {texts[name].replace('Now, you', 'Now you')} | {dur} | {round(lufs, 1)} | {size} |")
h, sep = header_for("music/MUSIC-NOTES.md")
lic += ["", "## music/ (1 file)", "", "`music-main.ogg` is `music-1.ogg` from the sound pack, renamed. Details:", "", h, sep,
        row_for("music/MUSIC-NOTES.md", "music-1.ogg")]
h, sep = header_for("sfx-candidates/SFX-NOTES.md")
lic += ["", f"## sfx/ ({len(SFX) + len(SFX2_FOUND) + len(SFX3_FOUND) + len(SFX4_FOUND) + len(SFX5_FOUND) + len(SFX6_FOUND) + len(SFX7_FOUND) + len(SFX8_FOUND)} files)", "",
"Each file is candidate no. 1 from `sfx-candidates/`, renamed (e.g. `munch-1.ogg` → `munch.ogg`). The rows below are copied unchanged from the candidate notes, so the first column shows the candidate name.",
"- **Freesound files:** munch, sprinkle, whoosh and bake use the public, no-login HQ preview. All four source pages were checked live on 2026-09-19 and show Creative Commons 0.",
"- **OpenGameArt files:** squish, star and complete. Their pages list CC0 only.", "", h, sep]
for name in SFX:
    lic.append(row_for("sfx-candidates/SFX-NOTES.md", f"{name}-1.ogg"))
lic += ["", "### Prep-step sounds (batch 2, added 2026-09-19)", "",
"Candidate no. 1 of each, renamed the same way. All ten are Freesound CC0; each license was read live on the sound's own page on 2026-09-19. Downloads are the public HQ previews.", "", h, sep]
for name in SFX2_FOUND:
    lic.append(row_for("sfx-candidates/SFX-NOTES.md", f"{name}-1.ogg"))
missing = [n for n in SFX2 if n not in SFX2_FOUND]
lic += ["", "**Missing (no CC0 source found):** " + (", ".join(missing) if missing else "none") + "."]
lic += ["", "### Salad sounds (batch 3, added 2026-09-19)", "",
"Candidate no. 1 of each, renamed the same way. Only CC0 sources; each license was read live on the sound's own page on 2026-09-19 (full notes: `sfx-candidates/SFX-NOTES.md`, Batch 3).", "", h, sep]
for name in SFX3_FOUND:
    lic.append(row_for("sfx-candidates/SFX-NOTES.md", f"{name}-1.ogg"))
missing3 = [n for n in SFX3 if n not in SFX3_FOUND]
lic += ["", "**Missing (no suitable CC0 source found):** " + (", ".join(missing3) if missing3 else "none") + "."]
lic += ["", "### Cookie sounds (batch 4, added 2026-09-19)", "",
"Candidate no. 1 of each, renamed the same way. Only CC0 sources; each license was read live on the sound's own Freesound page on 2026-09-19 (full notes: `sfx-candidates/SFX-NOTES.md`, Batch 4). stamp is a rubber-stamp press and icing a generic smooth squeeze (no CC0 cookie-cutter or piping-bag recording was found).", "", h, sep]
for name in SFX4_FOUND:
    lic.append(row_for("sfx-candidates/SFX-NOTES.md", f"{name}-1.ogg"))
missing4 = [n for n in SFX4 if n not in SFX4_FOUND]
lic += ["", "**Missing (no suitable CC0 source found):** " + (", ".join(missing4) if missing4 else "none") + "."]
lic += ["", "### Smoothie sounds (batch 5, added 2026-09-19)", "",
"Candidate no. 1 of each, renamed the same way. Only CC0 sources; each license was read live on the sound's own Freesound page on 2026-09-19 (full notes: `sfx-candidates/SFX-NOTES.md`, Batch 5). blender is a seamless loop (4.0 s; loop the whole file). glass-pour is water poured into a glass and lid-click a plastic container lid (no CC0 smoothie-pour or blender-lid recording was found).", "", h, sep]
for name in SFX5_FOUND:
    lic.append(row_for("sfx-candidates/SFX-NOTES.md", f"{name}-1.ogg"))
missing5 = [n for n in SFX5 if n not in SFX5_FOUND]
lic += ["", "**Missing (no suitable CC0 source found):** " + (", ".join(missing5) if missing5 else "none") + "."]
lic += ["", "### Pancake sounds (batch 6, added 2026-09-19)", "",
"Candidate no. 1, renamed the same way. Only CC0 sources; the license was read live on the sound's own Freesound page on 2026-09-19 (full notes: `sfx-candidates/SFX-NOTES.md`, Batch 6). sizzle is a seamless loop (4.0 s; loop the whole file), a steady pan sizzle (the recording is of frying meat; the CC0 pancake/crepe recordings were too noisy).", "", h, sep]
for name in SFX6_FOUND:
    lic.append(row_for("sfx-candidates/SFX-NOTES.md", f"{name}-1.ogg"))
missing6 = [n for n in SFX6 if n not in SFX6_FOUND]
lic += ["", "**Missing (no suitable CC0 source found):** " + (", ".join(missing6) if missing6 else "none") + "."]
lic += ["", "### Vegetable-soup sounds (batch 7, added 2026-09-20)", "",
"Candidate no. 1, renamed the same way. Only CC0 sources; the license was read live on the sound's own Freesound page on 2026-09-20 (full notes: `sfx-candidates/SFX-NOTES.md`, Batch 7). peel is one isolated stroke of a Y-style vegetable peeler on a carrot, exactly the brief. Its onset transient is sharp, so the -1.0 dBFS peak cap holds it at -22.9 LUFS, like munch, tear and cookie-crunch; play it at gain 1.0.", "", h, sep]
for name in SFX7_FOUND:
    lic.append(row_for("sfx-candidates/SFX-NOTES.md", f"{name}-1.ogg"))
missing7 = [n for n in SFX7 if n not in SFX7_FOUND]
lic += ["", "**Missing (no suitable CC0 source found):** " + (", ".join(missing7) if missing7 else "none") + "."]
lic += ["", "### Birthday-cake sounds (batch 8, added 2026-09-20)", "",
"Candidate no. 1, renamed the same way. Only CC0 sources; the license was read live on the sound's own Freesound page on 2026-09-20 (full notes: `sfx-candidates/SFX-NOTES.md`, Batch 8). blow is one short, soft puff of breath blowing a candle out (0.34 s), exactly the brief: 81 % of its energy sits in the 800-3000 Hz breath band and only 0.9 % below 200 Hz, so it reads as a puff and not as a gust or a mic wind-blast. It reaches -18 LUFS at a -2.7 dBFS peak without touching the peak cap, so it needed no limiter; play it at gain 0.65 like the other one-shots.", "", h, sep]
for name in SFX8_FOUND:
    lic.append(row_for("sfx-candidates/SFX-NOTES.md", f"{name}-1.ogg"))
missing8 = [n for n in SFX8 if n not in SFX8_FOUND]
lic += ["", "**Missing (no suitable CC0 source found):** " + (", ".join(missing8) if missing8 else "none") + "."]
(FINAL / "LICENSES.md").write_text("\n".join(lic) + "\n", encoding="utf-8")
print({d: len(list((FINAL / d).glob("*.ogg"))) for d in ("voice", "music", "sfx")})
