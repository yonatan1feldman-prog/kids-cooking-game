# Licenses: cooking-game-audio

Every audio file in this folder is listed below with its source and license. Only CC0 1.0 sources were used for music, sound effects and recorded character vocals. The narration is generated locally by an Apache-2.0 speech model. Nothing was bought, no account was used, and no cloud service was used.

| folder | source | license |
|---|---|---|
| voice-a/, voice-b/, voice-a-mom/, voice-b-mom/ | Generated locally with Kokoro-82M (Kokoro TTS) | Model weights: Apache-2.0 (hexgrad/Kokoro-82M). Runtime: kokoro-onnx (MIT) + onnxruntime (MIT) + espeak-ng via espeakng-loader (GPL-3.0; used only as a local phonemizer tool, not shipped) |
| final/ | Copies of the chosen files (voice-a-mom, music-1, sfx candidates no. 1, including the batch-2 prep-step sounds, the batch-3 salad sounds, the batch-4 cookie sounds, the batch-5 smoothie sounds, the batch-6 pancake sound, the batch-7 vegetable-soup sound and the batch-8 birthday-cake sound), renamed for the game | See final/LICENSES.md, which covers exactly those files |
| music/ | OpenGameArt | CC0 1.0 (details below) |
| sfx-candidates/ | Freesound (public HQ previews) and OpenGameArt | CC0 1.0 (details below) |
| sfx-candidates/current/ | Unchanged copies of cooking-game-assets/sounds (Kenney) | CC0 1.0; copied for side-by-side comparison only |
| character/ | Freesound and OpenGameArt, plus one Kokoro-synthesized hum | CC0 1.0 / Apache-2.0 model output |

## Narration (voice-a, voice-b)

- **Engine:** Kokoro-82M v1.0, ONNX build `kokoro-v1.0.onnx` + `voices-v1.0.bin` from https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0. The model card is https://huggingface.co/hexgrad/Kokoro-82M. The weights are licensed Apache-2.0 and were trained only on permissive or non-copyrighted audio.
- **Voice A:** `af_heart` (American English female), speed 0.85. **Voice B:** `af_bella` (American English female), speed 0.85. These are the two highest-rated voices in Kokoro's voice list.
- **Processing:** silence trimmed at -42 dB relative to peak (20 ms kept before the start, 60 ms after the end), 5 ms fade-in, 40 ms fade-out. Loudness normalized to -18 LUFS with a -1.5 dBFS peak cap. Mono, 24 kHz, OGG Vorbis q3. Script: `scripts/make_vo.py`.
- A few clips (vo-roll, vo-cheese) came out 0.7-1.0 dB quieter because the peak cap stopped the gain first.

| file | text | voice | duration (s) | loudness (LUFS) | size (bytes) |
|---|---|---|---|---|---|
| voice-a/vo-welcome.ogg | Let's cook! | af_heart | 0.88 | -18.0 | 8791 |
| voice-a/vo-pick-pizza.ogg | Let's make a pizza! | af_heart | 1.37 | -18.0 | 11780 |
| voice-a/vo-roll.ogg | Roll the dough! | af_heart | 0.99 | -18.8 | 9305 |
| voice-a/vo-sauce.ogg | Spread the sauce! | af_heart | 1.14 | -18.0 | 10431 |
| voice-a/vo-cheese.ogg | Sprinkle the cheese! | af_heart | 1.28 | -18.7 | 11329 |
| voice-a/vo-toppings.ogg | Add your toppings! | af_heart | 1.18 | -18.0 | 10858 |
| voice-a/vo-done-hint.ogg | Tap when you're done! | af_heart | 1.1 | -18.0 | 10099 |
| voice-a/vo-oven.ogg | Into the oven! | af_heart | 1.08 | -18.0 | 10094 |
| voice-a/vo-baking.ogg | It's baking! | af_heart | 1.0 | -18.0 | 9666 |
| voice-a/vo-ready.ogg | Ding! It's ready! | af_heart | 1.29 | -18.0 | 11513 |
| voice-a/vo-feed.ogg | Time to eat! | af_heart | 1.03 | -18.0 | 9632 |
| voice-a/vo-praise-1.ogg | Great job! | af_heart | 1.0 | -18.0 | 9389 |
| voice-a/vo-praise-2.ogg | Wow! | af_heart | 0.63 | -18.0 | 7114 |
| voice-a/vo-praise-3.ogg | Beautiful! | af_heart | 0.86 | -18.0 | 8515 |
| voice-a/vo-praise-4.ogg | Yummy! | af_heart | 0.7 | -18.0 | 7581 |
| voice-a/vo-finale.ogg | You made a pizza! | af_heart | 1.18 | -18.0 | 10539 |
| voice-b/vo-welcome.ogg | Let's cook! | af_bella | 0.83 | -18.0 | 8429 |
| voice-b/vo-pick-pizza.ogg | Let's make a pizza! | af_bella | 1.24 | -18.0 | 10675 |
| voice-b/vo-roll.ogg | Roll the dough! | af_bella | 0.93 | -18.0 | 8778 |
| voice-b/vo-sauce.ogg | Spread the sauce! | af_bella | 1.09 | -18.0 | 9958 |
| voice-b/vo-cheese.ogg | Sprinkle the cheese! | af_bella | 1.23 | -19.0 | 10791 |
| voice-b/vo-toppings.ogg | Add your toppings! | af_bella | 1.11 | -18.0 | 10174 |
| voice-b/vo-done-hint.ogg | Tap when you're done! | af_bella | 1.0 | -18.0 | 9346 |
| voice-b/vo-oven.ogg | Into the oven! | af_bella | 0.98 | -18.0 | 9345 |
| voice-b/vo-baking.ogg | It's baking! | af_bella | 0.97 | -18.0 | 9282 |
| voice-b/vo-ready.ogg | Ding! It's ready! | af_bella | 1.27 | -18.0 | 10960 |
| voice-b/vo-feed.ogg | Time to eat! | af_bella | 0.94 | -18.0 | 8997 |
| voice-b/vo-praise-1.ogg | Great job! | af_bella | 0.96 | -18.0 | 9189 |
| voice-b/vo-praise-2.ogg | Wow! | af_bella | 0.6 | -18.0 | 6767 |
| voice-b/vo-praise-3.ogg | Beautiful! | af_bella | 0.83 | -18.0 | 8116 |
| voice-b/vo-praise-4.ogg | Yummy! | af_bella | 0.61 | -18.0 | 6958 |
| voice-b/vo-finale.ogg | You made a pizza! | af_bella | 1.1 | -18.0 | 9966 |


## Mom script narration (voice-a-mom, voice-b-mom)

Same engine, voices, speed (0.85) and processing as the first narration above (Kokoro-82M, Apache-2.0; `scripts/make_vo.py mom`). Spoken text matches the script word for word. The only change is an added comma in "Now, you try!", which gives a short, warm pause. "Pipa" is pronounced PEE-pa.

Revision (2026-09-19), following preschool app-design guidance (no pressure to come back; praise effort and process, not traits): vo-again was removed; vo-praise-6 changed from "You're a great chef!" to "You worked so hard!"; vo-praise-7 and vo-bye were added. Only those three lines were regenerated, with identical settings.

| file | text | voice | duration (s) | loudness (LUFS) | size (bytes) |
|---|---|---|---|---|---|
| voice-a-mom/vo-welcome.ogg | Let's cook together! | af_heart | 1.25 | -18.0 | 11773 |
| voice-a-mom/vo-pick-pizza.ogg | Let's make a pizza! | af_heart | 1.37 | -18.0 | 11780 |
| voice-a-mom/vo-watch-me.ogg | Watch me first! | af_heart | 1.18 | -18.0 | 10337 |
| voice-a-mom/vo-your-turn.ogg | Now you try! | af_heart | 1.11 | -18.0 | 9970 |
| voice-a-mom/vo-roll.ogg | Let's roll the dough! | af_heart | 1.22 | -18.3 | 11113 |
| voice-a-mom/vo-sauce.ogg | Now spread the sauce! | af_heart | 1.34 | -18.0 | 11683 |
| voice-a-mom/vo-cheese.ogg | Sprinkle the cheese! | af_heart | 1.28 | -18.7 | 11329 |
| voice-a-mom/vo-toppings.ogg | Put on anything you like! | af_heart | 1.58 | -18.0 | 12979 |
| voice-a-mom/vo-done-hint.ogg | Tap here when you're done! | af_heart | 1.31 | -18.0 | 11078 |
| voice-a-mom/vo-oven.ogg | Into the oven it goes! | af_heart | 1.49 | -18.8 | 12591 |
| voice-a-mom/vo-baking.ogg | Look, it's baking! | af_heart | 1.28 | -18.0 | 11299 |
| voice-a-mom/vo-ready.ogg | Ding! It's ready! | af_heart | 1.29 | -18.0 | 11513 |
| voice-a-mom/vo-feed.ogg | Let's give Pipa a taste! | af_heart | 1.66 | -19.5 | 13664 |
| voice-a-mom/vo-help.ogg | Let me help you! | af_heart | 1.08 | -18.0 | 9858 |
| voice-a-mom/vo-praise-1.ogg | Great job! | af_heart | 1.0 | -18.0 | 9389 |
| voice-a-mom/vo-praise-2.ogg | Wow! | af_heart | 0.63 | -18.0 | 7114 |
| voice-a-mom/vo-praise-3.ogg | Beautiful! | af_heart | 0.86 | -18.0 | 8515 |
| voice-a-mom/vo-praise-4.ogg | Yummy! | af_heart | 0.7 | -18.0 | 7581 |
| voice-a-mom/vo-praise-5.ogg | I love it! | af_heart | 0.86 | -18.0 | 8746 |
| voice-a-mom/vo-praise-6.ogg | You worked so hard! | af_heart | 1.27 | -18.0 | 10826 |
| voice-a-mom/vo-praise-7.ogg | I love how you did that! | af_heart | 1.57 | -18.0 | 12796 |
| voice-a-mom/vo-finale.ogg | We made a pizza together! | af_heart | 1.53 | -18.0 | 13092 |
| voice-a-mom/vo-bye.ogg | That was fun! Bye bye! | af_heart | 1.59 | -18.0 | 12817 |
| voice-b-mom/vo-welcome.ogg | Let's cook together! | af_bella | 1.16 | -18.0 | 10717 |
| voice-b-mom/vo-pick-pizza.ogg | Let's make a pizza! | af_bella | 1.24 | -18.0 | 10675 |
| voice-b-mom/vo-watch-me.ogg | Watch me first! | af_bella | 1.15 | -18.1 | 10388 |
| voice-b-mom/vo-your-turn.ogg | Now you try! | af_bella | 1.08 | -18.0 | 9681 |
| voice-b-mom/vo-roll.ogg | Let's roll the dough! | af_bella | 1.18 | -18.0 | 10443 |
| voice-b-mom/vo-sauce.ogg | Now spread the sauce! | af_bella | 1.27 | -18.0 | 11070 |
| voice-b-mom/vo-cheese.ogg | Sprinkle the cheese! | af_bella | 1.23 | -19.0 | 10791 |
| voice-b-mom/vo-toppings.ogg | Put on anything you like! | af_bella | 1.41 | -18.0 | 12039 |
| voice-b-mom/vo-done-hint.ogg | Tap here when you're done! | af_bella | 1.21 | -18.0 | 10768 |
| voice-b-mom/vo-oven.ogg | Into the oven it goes! | af_bella | 1.41 | -18.4 | 11941 |
| voice-b-mom/vo-baking.ogg | Look, it's baking! | af_bella | 1.2 | -18.0 | 10535 |
| voice-b-mom/vo-ready.ogg | Ding! It's ready! | af_bella | 1.27 | -18.0 | 10960 |
| voice-b-mom/vo-feed.ogg | Let's give Pipa a taste! | af_bella | 1.64 | -18.1 | 13298 |
| voice-b-mom/vo-help.ogg | Let me help you! | af_bella | 0.95 | -18.0 | 8918 |
| voice-b-mom/vo-praise-1.ogg | Great job! | af_bella | 0.96 | -18.0 | 9189 |
| voice-b-mom/vo-praise-2.ogg | Wow! | af_bella | 0.6 | -18.0 | 6767 |
| voice-b-mom/vo-praise-3.ogg | Beautiful! | af_bella | 0.83 | -18.0 | 8116 |
| voice-b-mom/vo-praise-4.ogg | Yummy! | af_bella | 0.61 | -18.0 | 6958 |
| voice-b-mom/vo-praise-5.ogg | I love it! | af_bella | 0.8 | -18.0 | 8139 |
| voice-b-mom/vo-praise-6.ogg | You worked so hard! | af_bella | 1.22 | -18.0 | 10570 |
| voice-b-mom/vo-praise-7.ogg | I love how you did that! | af_bella | 1.48 | -19.1 | 11777 |
| voice-b-mom/vo-finale.ogg | We made a pizza together! | af_bella | 1.42 | -18.0 | 12131 |
| voice-b-mom/vo-bye.ogg | That was fun! Bye bye! | af_bella | 1.7 | -18.1 | 13191 |

### Prep steps (added 2026-09-19, voice-a-mom only)

40 new lines, Voice A only (`af_heart`, speed 0.85; `scripts/make_vo.py mom-a <names>`), with the same trimming, -18 LUFS / -1.5 dBFS peak cap, and OGG Vorbis q3 as above. Voice B was not generated for these. A check run first reproduced the existing raw audio of vo-bye and vo-praise-1 exactly (difference below 16-bit rounding). Spoken text matches the script word for word.
In count-6 the engine added a faint vowel before and after "six" (a speech recognizer heard "insects"); punctuation variants did not change it. See the fix below.

Targeted fix (2026-09-19, approved): `scripts/fix_vo.py`. vo-temp-more: gentle soft limiter on its one sharp peak (max 2.96 dB), then -18 LUFS (was -20.7). count-2, count-5, count-7, temp-50: start cut just before the opening consonant (3 ms fade-in, 20 ms silence in front), which removes a short voiced "uh" the engine added before the word. Second approved round: count-6 uses the clean cut (start before the "s", end 3 ms after the final "s" with an 8 ms fade-out), padded with silence to 0.55 s, then -18 LUFS. count-5 and temp-50 got the same soft limiter and normalization as vo-temp-more (max 0.9-1.0 dB), which brings them to the level of the other count/temp files. Originals are kept in `work/vo/pre-fix/`.

| file | text | voice | duration (s) | loudness (LUFS) | size (bytes) |
|---|---|---|---|---|---|
| voice-a-mom/vo-hello.ogg | Hi! I'm so happy to cook with you today! | af_heart | 2.52 | -18.0 | 19000 |
| voice-a-mom/vo-what-make.ogg | What shall we make today? | af_heart | 1.38 | -18.0 | 12109 |
| voice-a-mom/vo-wash.ogg | First, let's wash our hands! | af_heart | 1.8 | -18.0 | 14419 |
| voice-a-mom/vo-wash-rub.ogg | Rub, rub, rub! | af_heart | 1.32 | -18.0 | 11435 |
| voice-a-mom/vo-wash-done.ogg | All clean! | af_heart | 0.93 | -18.0 | 8956 |
| voice-a-mom/vo-knead.ogg | Let's squish the dough! | af_heart | 1.33 | -18.0 | 11565 |
| voice-a-mom/vo-crush.ogg | Squish the tomatoes! | af_heart | 1.42 | -18.7 | 12318 |
| voice-a-mom/vo-stir.ogg | Now stir it all around! | af_heart | 1.48 | -18.0 | 12615 |
| voice-a-mom/vo-grate.ogg | Let's grate the cheese! | af_heart | 1.39 | -18.7 | 12081 |
| voice-a-mom/vo-choose.ogg | Pick three toppings you like! | af_heart | 1.66 | -18.0 | 13655 |
| voice-a-mom/vo-cut.ogg | Let's cut it together! | af_heart | 1.31 | -18.0 | 11648 |
| voice-a-mom/vo-cut-careful.ogg | Nice and slow. Careful fingers! | af_heart | 2.45 | -18.0 | 17756 |
| voice-a-mom/vo-open-can.ogg | Let's open the can! | af_heart | 1.36 | -18.0 | 11732 |
| voice-a-mom/vo-open-jar.ogg | Let's open the jar! | af_heart | 1.4 | -18.0 | 12063 |
| voice-a-mom/vo-pour.ogg | Pour it into the bowl! | af_heart | 1.34 | -18.0 | 11930 |
| voice-a-mom/vo-temp.ogg | Let's set the oven to two hundred! | af_heart | 1.88 | -18.6 | 14894 |
| voice-a-mom/vo-temp-more.ogg | A little more! | af_heart | 0.95 | -18.0 | 8998 |
| voice-a-mom/vo-temp-hot.ogg | Oops, too hot! Turn it down a little. | af_heart | 2.29 | -18.0 | 17120 |
| voice-a-mom/vo-temp-done.ogg | Perfect! Now press start! | af_heart | 1.66 | -18.0 | 13777 |
| voice-a-mom/vo-mitts.ogg | It's hot! Put on your oven mitts! | af_heart | 1.91 | -18.0 | 14792 |
| voice-a-mom/vo-share.ogg | Let's share the pizza! | af_heart | 1.33 | -18.0 | 11476 |
| voice-a-mom/vo-slice-mom.ogg | One for me? Thank you! | af_heart | 1.63 | -18.8 | 12769 |
| voice-a-mom/vo-mom-yum.ogg | Mmm, delicious! | af_heart | 1.35 | -18.0 | 12072 |
| voice-a-mom/vo-slice-pipa.ogg | One for Pipa! | af_heart | 1.1 | -18.0 | 10110 |
| voice-a-mom/vo-photo.ogg | Let's take a picture of your pizza! | af_heart | 1.98 | -18.8 | 16060 |
| voice-a-mom/count-1.ogg | One! | af_heart | 0.63 | -18.0 | 7060 |
| voice-a-mom/count-2.ogg | Two! | af_heart | 0.55 | -18.0 | 6503 |
| voice-a-mom/count-3.ogg | Three! | af_heart | 0.69 | -18.0 | 7542 |
| voice-a-mom/count-4.ogg | Four! | af_heart | 0.66 | -18.0 | 7200 |
| voice-a-mom/count-5.ogg | Five! | af_heart | 0.67 | -18.0 | 7298 |
| voice-a-mom/count-6.ogg | Six! | af_heart | 0.55 | -18.0 | 6187 |
| voice-a-mom/count-7.ogg | Seven! | af_heart | 0.59 | -18.0 | 6929 |
| voice-a-mom/count-8.ogg | Eight! | af_heart | 0.68 | -18.0 | 7384 |
| voice-a-mom/count-9.ogg | Nine! | af_heart | 0.72 | -18.0 | 7754 |
| voice-a-mom/count-10.ogg | Ten! | af_heart | 0.63 | -18.0 | 7016 |
| voice-a-mom/temp-50.ogg | Fifty! | af_heart | 0.69 | -18.0 | 7552 |
| voice-a-mom/temp-100.ogg | One hundred! | af_heart | 0.97 | -18.0 | 9044 |
| voice-a-mom/temp-150.ogg | One hundred fifty! | af_heart | 1.38 | -18.0 | 12172 |
| voice-a-mom/temp-200.ogg | Two hundred! | af_heart | 0.93 | -18.0 | 9027 |
| voice-a-mom/temp-250.ogg | Two hundred fifty! | af_heart | 1.28 | -18.0 | 11339 |

### Salad (added 2026-09-19, voice-a-mom only)

26 new lines for the second recipe (16 `vo-*` lines and 10 `name-*` ingredient names), Voice A only (`af_heart`, speed 0.85; `scripts/make_vo.py mom-a <names>`), with the same trimming, -18 LUFS / -1.5 dBFS peak cap, and OGG Vorbis q3 as above. Spoken text matches the script word for word.

Targeted fix (2026-09-19): `scripts/fix_vo_salad.py`, which reuses the functions of `scripts/fix_vo.py` unchanged. Every name file was measured the same way as the count files: voiced energy before the opening consonant (and, for words ending in a fricative, after the final one), plus the Vosk speech recognizer limited to the ten ingredient words (and, for information, the recognizer with no word list). Measurements: `work/vo/fix-salad/measure.json` (before) and `measure-build.json` (candidates).
- name-carrot, name-pepper: a voiced "uh" before the opening consonant (-2.2 / -3.8 dB relative to the word, like count-2/7). Approach B (tight cut): start 2 ms before the opening consonant, 3 ms fade-in, 20 ms of silence in front; the end is where make_vo ends the file.
- name-onion: a ~70 ms breathy noise before the opening vowel; the limited recognizer heard `[unk]` (0.8), the free one "funny and". Same cut, at the first voiced frame. After the fix: "onion", 1.0.
- name-corn: a 30 ms unvoiced blip and a 40 ms gap before the "k" (the free recognizer heard "the corn"). Same cut, at the "k".
- After the fix the limited recognizer hears each of the four words alone, at confidence 1.0, with no lead vowel left. Then -18 LUFS. All ten names are 0.64-0.87 s, so none needed silence padding to the 0.55 s minimum. The other six names (cucumber, tomato, lettuce, mushroom, olives, lemon) measured clean and were not changed.
- vo-oil, vo-into-bowl: one sharp peak reached the -1.5 dBFS cap first, leaving them at -21.8 / -19.5 LUFS. The make_vo trim, then the same gentle soft limiter as vo-temp-more (max gain reduction 4.2 / 1.8 dB), then -18 LUFS.
- Originals are kept in `work/vo/pre-fix-salad/`.

| file | text | voice | duration (s) | loudness (LUFS) | size (bytes) |
|---|---|---|---|---|---|
| voice-a-mom/vo-pick-salad.ogg | Let's make a salad! | af_heart | 1.31 | -18.0 | 11508 |
| voice-a-mom/vo-wash-veg.ogg | Let's wash the vegetables! | af_heart | 1.72 | -18.7 | 14049 |
| voice-a-mom/vo-wash-veg-done.ogg | Squeaky clean! | af_heart | 1.08 | -18.0 | 10230 |
| voice-a-mom/vo-tear.ogg | Tear the lettuce into little pieces! | af_heart | 1.98 | -18.0 | 15452 |
| voice-a-mom/vo-choose-veg.ogg | Pick three vegetables you like! | af_heart | 1.82 | -18.0 | 14281 |
| voice-a-mom/vo-into-bowl.ogg | Put it all in the bowl! | af_heart | 1.31 | -18.0 | 11405 |
| voice-a-mom/vo-squeeze.ogg | Squeeze the lemon! | af_heart | 1.12 | -18.0 | 10571 |
| voice-a-mom/vo-oil.ogg | Pour a little olive oil! | af_heart | 1.47 | -18.0 | 12303 |
| voice-a-mom/vo-salt.ogg | A tiny pinch of salt! | af_heart | 1.55 | -18.0 | 12791 |
| voice-a-mom/vo-mix.ogg | Now mix it all up! | af_heart | 1.33 | -18.0 | 11287 |
| voice-a-mom/vo-serve.ogg | Let's serve the salad! | af_heart | 1.36 | -18.0 | 12314 |
| voice-a-mom/vo-bowl-mom.ogg | Some for me? Thank you! | af_heart | 1.65 | -18.5 | 13045 |
| voice-a-mom/vo-bowl-pipa.ogg | Some for Pipa! | af_heart | 1.13 | -18.0 | 10367 |
| voice-a-mom/vo-fresh.ogg | Mmm, so fresh and crunchy! | af_heart | 2.09 | -18.1 | 15880 |
| voice-a-mom/vo-photo-salad.ogg | Let's take a picture of your salad! | af_heart | 1.92 | -18.4 | 15760 |
| voice-a-mom/vo-finale-salad.ogg | We made a salad together! | af_heart | 1.41 | -18.0 | 12231 |
| voice-a-mom/name-cucumber.ogg | Cucumber! | af_heart | 0.85 | -18.3 | 8604 |
| voice-a-mom/name-tomato.ogg | Tomato! | af_heart | 0.85 | -18.0 | 8330 |
| voice-a-mom/name-pepper.ogg | Pepper! | af_heart | 0.68 | -18.0 | 7400 |
| voice-a-mom/name-carrot.ogg | Carrot! | af_heart | 0.64 | -18.0 | 7047 |
| voice-a-mom/name-onion.ogg | Onion! | af_heart | 0.65 | -18.0 | 7362 |
| voice-a-mom/name-lettuce.ogg | Lettuce! | af_heart | 0.78 | -18.0 | 7890 |
| voice-a-mom/name-mushroom.ogg | Mushroom! | af_heart | 0.87 | -18.0 | 8439 |
| voice-a-mom/name-corn.ogg | Corn! | af_heart | 0.66 | -18.0 | 7113 |
| voice-a-mom/name-olives.ogg | Olives! | af_heart | 0.78 | -18.0 | 7756 |
| voice-a-mom/name-lemon.ogg | Lemon! | af_heart | 0.7 | -18.0 | 7747 |

### Cookies (added 2026-09-19, voice-a-mom only)

23 new lines for the third recipe (19 `vo-*` lines and 4 `name-*` cookie-cutter shapes), Voice A only (`af_heart`, speed 0.85; `scripts/make_vo.py mom-a <names>`), with the same trimming, -18 LUFS / -1.5 dBFS peak cap, and OGG Vorbis q3 as above. Spoken text matches the script word for word (name-heart: see below).

Targeted fix (2026-09-19): `scripts/fix_vo_cookies.py`, which reuses the functions of `scripts/fix_vo.py` and `scripts/fix_vo_salad.py` unchanged. All 23 lines were measured the same way as before (loudness, peak, voiced energy before the opening consonant, consonant-noise runs at the end, and the Vosk speech recognizer with no word list; the four names also with the recognizer limited to "a", the four shapes and `[unk]`). Measurements: `work/vo/fix-cookies/measure.json` (after) and `measure-build.json` (candidates, with the before values).
- vo-egg: a short voiced "uh" before "Crack" (the recognizer heard "the crack the egg"). Approach B (tight cut) at the "k": 2 ms before it, 3 ms fade-in, 20 ms silence in front. After: "crack the egg tap tap tap".
- vo-flour, vo-butter: a breathy exhale (about 70 ms, -15 to -20 dB) after the final "r" (the recognizer heard "flowers" / "butters"). End cut 5 ms into that noise, 25 ms fade-out. After: "... the flower" (homophone of flour) / "drop in the butter".
- vo-decorate-cookies, vo-photo-cookies, vo-cookie-mom, vo-temp-150, vo-pick-cookies: a sharp peak reached the -1.5 dBFS cap first (-22.6 / -19.1 / -18.9 / -18.7 / -18.6 LUFS). The make_vo trim, then the same gentle soft limiter as vo-temp-more / vo-oil (max gain reduction 5.3 dB on a 13 ms "D" burst for decorate, 1.1-1.6 dB for the others), then -18 LUFS.
- name-heart (regenerated): the limited recognizer heard "a a heart" (0.77 on the extra "a"). Regenerated with the text "A heart!!" (identical phonemes, `ɐ hˈɑːɹt`, punctuation only); limited recognizer: "a heart", both 1.0. name-star, name-circle, name-flower: "a" + the shape, all 1.0, unchanged.
- The other 13 lines measured clean and were not changed. Final range: -18.4 to -17.7 LUFS (measured on the decoded OGG), peaks -1.2 to -5.3 dBFS. Originals of the changed lines are in `work/vo/pre-fix-cookies/`.

| file | text | voice | duration (s) | loudness (LUFS) | size (bytes) |
|---|---|---|---|---|---|
| voice-a-mom/vo-pick-cookies.ogg | Let's bake cookies! | af_heart | 1.36 | -18.0 | 11739 |
| voice-a-mom/vo-flour.ogg | Pour in the flour! | af_heart | 1.04 | -18.0 | 9804 |
| voice-a-mom/vo-sugar.ogg | Now the sugar! | af_heart | 1.03 | -18.0 | 9705 |
| voice-a-mom/vo-butter.ogg | Drop in the butter! | af_heart | 1.03 | -18.0 | 9998 |
| voice-a-mom/vo-egg.ogg | Crack the egg! Tap, tap, tap! | af_heart | 2.1 | -18.0 | 15814 |
| voice-a-mom/vo-stir-dough.ogg | Stir it into dough! | af_heart | 1.27 | -18.0 | 11213 |
| voice-a-mom/vo-knead-cookies.ogg | Let's squish the cookie dough! | af_heart | 1.56 | -18.0 | 12896 |
| voice-a-mom/vo-roll-cookies.ogg | Roll it nice and flat! | af_heart | 1.5 | -18.0 | 12335 |
| voice-a-mom/vo-pick-cutter.ogg | Pick a shape you like! | af_heart | 1.33 | -18.0 | 11321 |
| voice-a-mom/vo-stamp.ogg | Press it into the dough! | af_heart | 1.4 | -18.0 | 11999 |
| voice-a-mom/name-star.ogg | A star! | af_heart | 0.82 | -18.0 | 8433 |
| voice-a-mom/name-heart.ogg | A heart! | af_heart | 0.86 | -18.0 | 8359 |
| voice-a-mom/name-circle.ogg | A circle! | af_heart | 0.83 | -18.0 | 8431 |
| voice-a-mom/name-flower.ogg | A flower! | af_heart | 0.87 | -18.0 | 8310 |
| voice-a-mom/vo-tray.ogg | Onto the baking tray! | af_heart | 1.46 | -18.0 | 12176 |
| voice-a-mom/vo-temp-150.ogg | Let's set the oven to one hundred fifty! | af_heart | 2.35 | -18.0 | 18240 |
| voice-a-mom/vo-decorate-cookies.ogg | Decorate them any way you like! | af_heart | 2.07 | -18.0 | 15789 |
| voice-a-mom/vo-share-cookies.ogg | Let's share the cookies! | af_heart | 1.37 | -18.2 | 11780 |
| voice-a-mom/vo-cookie-mom.ogg | A cookie for me? Thank you! | af_heart | 1.76 | -18.0 | 13707 |
| voice-a-mom/vo-cookie-pipa.ogg | A cookie for Pipa! | af_heart | 1.28 | -18.4 | 11138 |
| voice-a-mom/vo-cookie-yum.ogg | Mmm, so sweet and crumbly! | af_heart | 2.15 | -18.7 | 17184 |
| voice-a-mom/vo-photo-cookies.ogg | Let's take a picture of your cookies! | af_heart | 1.98 | -18.0 | 15657 |
| voice-a-mom/vo-finale-cookies.ogg | We made cookies together! | af_heart | 1.49 | -18.0 | 12648 |

### Fruit smoothie (added 2026-09-19, voice-a-mom only)

19 new lines for the fourth recipe (15 `vo-*` lines and 4 `name-*` fruit names), Voice A only (`af_heart`, speed 0.85; `scripts/make_vo.py mom-a <names>`), with the same trimming, -18 LUFS / -1.5 dBFS peak cap, and OGG Vorbis q3 as above. Spoken text matches the script word for word.

Targeted fix (2026-09-19): `scripts/fix_vo_smoothie.py`, a copy of `scripts/fix_vo_cookies.py` that reuses the functions of `scripts/fix_vo.py` and `scripts/fix_vo_salad.py` unchanged (only the line list, one start-cut rule for a word with no opening consonant noise, and a tail cut + limiter combination were added). All 19 lines were measured the same way as before (loudness, peak, voiced energy before the opening consonant, consonant-noise runs at the end, and the Vosk speech recognizer with no word list; the four names also with the recognizer limited to the four fruit names and `[unk]`, as for the salad names). Measurements: `work/vo/fix-smoothie/measure-before-fix.json` (before), `measure.json` (after) and `measure-build.json` (candidates, with the before values).
- name-banana: a voiced "uh" (about 60 ms, only 4 dB under the peak) before the "b", then a short dip (the recognizer heard "the banana"; regenerating as "Banana!!" or "Banana." kept it). Approach B (tight cut): start 2 ms before the "b", where the level rises again after the dip, 3 ms fade-in, 20 ms silence in front, then -18 LUFS. After: the limited recognizer hears "banana" at 1.0. The recognizer with no word list hears "they nana" at every start point tried (0.100-0.123 s); like "lemon" / "lettuce" / "olives" in the salad round, the small model mishears some isolated words.
- name-kiwi: a faint noise (-33 dB) before the "k". The same start cut, at the "k". Limited recognizer: "kiwi" 1.0 (the recognizer with no word list does not recognise "kiwi" in any take: "here we're").
- vo-into-blender: a breathy exhale after the final "r" of "blender" (60 ms, -23 to -32 dB, like vo-flour/vo-butter), and a peak that reached the cap first (-18.7 LUFS). End cut 5 ms into the noise, 25 ms fade-out, then the gentle soft limiter (max gain reduction 0.5 dB) and -18 LUFS.
- vo-pick-smoothie, vo-smoothie-yum, vo-photo-smoothie: a sharp peak reached the -1.5 dBFS cap first (-18.7 / -20.3 / -19.1 LUFS). The make_vo trim, then the same gentle soft limiter as vo-temp-more (max gain reduction 1.3 / 2.7 / 1.6 dB), then -18 LUFS. vo-photo-smoothie decodes with a -0.4 dBFS peak (the Vorbis encoder overshoots the -1.7 dBFS limiter ceiling of the WAV; no clipping).
- The other 13 lines measured clean and were not changed. Recognizer (no word list) on the sentences: every word as written ("pour" in vo-milk as its homophone "poor"; "Pipa" is not in its vocabulary). Final range: -17.96 to -17.62 LUFS (measured on the decoded OGG), peaks -0.4 to -5.0 dBFS. Originals of the changed lines are in `work/vo/pre-fix-smoothie/`.

| file | text | voice | duration (s) | loudness (LUFS) | size (bytes) |
|---|---|---|---|---|---|
| voice-a-mom/vo-pick-smoothie.ogg | Let's make a smoothie! | af_heart | 1.33 | -18.0 | 11825 |
| voice-a-mom/vo-wash-fruit.ogg | Let's wash the fruit! | af_heart | 1.35 | -18.0 | 11680 |
| voice-a-mom/vo-choose-fruit.ogg | Pick three fruits you like! | af_heart | 1.56 | -18.0 | 12757 |
| voice-a-mom/name-banana.ogg | Banana! | af_heart | 0.7 | -18.0 | 7525 |
| voice-a-mom/name-strawberry.ogg | Strawberry! | af_heart | 0.84 | -18.0 | 8468 |
| voice-a-mom/name-mango.ogg | Mango! | af_heart | 0.83 | -18.0 | 8283 |
| voice-a-mom/name-kiwi.ogg | Kiwi! | af_heart | 0.71 | -18.0 | 7346 |
| voice-a-mom/vo-into-blender.ogg | Put it all in the blender! | af_heart | 1.26 | -18.0 | 12084 |
| voice-a-mom/vo-milk.ogg | Pour in the milk! | af_heart | 1.12 | -18.0 | 10294 |
| voice-a-mom/vo-lid.ogg | Put the lid on tight! | af_heart | 1.34 | -18.0 | 11602 |
| voice-a-mom/vo-blend.ogg | Press the big button! | af_heart | 1.3 | -18.0 | 11652 |
| voice-a-mom/vo-blend-done.ogg | All smooth! | af_heart | 0.97 | -18.0 | 9331 |
| voice-a-mom/vo-pour-glass.ogg | Pour it into the glasses! | af_heart | 1.56 | -18.0 | 12997 |
| voice-a-mom/vo-share-smoothie.ogg | Let's share the smoothie! | af_heart | 1.35 | -18.0 | 12038 |
| voice-a-mom/vo-glass-mom.ogg | A glass for me? Thank you! | af_heart | 1.76 | -18.0 | 13912 |
| voice-a-mom/vo-glass-pipa.ogg | A glass for Pipa! | af_heart | 1.25 | -18.0 | 11124 |
| voice-a-mom/vo-smoothie-yum.ogg | Mmm, so fruity and cold! | af_heart | 2.14 | -18.0 | 16587 |
| voice-a-mom/vo-photo-smoothie.ogg | Let's take a picture of your smoothie! | af_heart | 1.96 | -18.0 | 16158 |
| voice-a-mom/vo-finale-smoothie.ogg | We made a smoothie together! | af_heart | 1.46 | -18.0 | 12684 |

### Pancakes (added 2026-09-19, voice-a-mom only)

15 new `vo-*` lines for the fifth recipe, Voice A only (`af_heart`, speed 0.85; `scripts/make_vo.py mom-a <names>`), with the same trimming, -18 LUFS / -1.5 dBFS peak cap, and OGG Vorbis q3 as above. Spoken text matches the script word for word.

Targeted fix (2026-09-19): `scripts/fix_vo_pancakes.py`, a copy of `scripts/fix_vo_smoothie.py` that reuses the functions of `scripts/fix_vo.py` and `scripts/fix_vo_salad.py` unchanged (only the line list and one combined start + end cut were added). All 15 lines were measured the same way as before (loudness, peak, voiced energy before the opening consonant, consonant-noise runs at the start and end, and the Vosk speech recognizer with no word list). Measurements: `work/vo/fix-pancakes/measure-before-fix.json` (before), `measure.json` (after) and `measure-build-1.json` / `measure-build-2.json` (candidates, with the before values).
- vo-pancake-yum: a breathy hiss (70 ms, up to -7 dB, consonant-like noise) before the "Mmm", and a breathy exhale (60 ms, -24 to -34 dB) after "fluffy". Start cut at the first voiced frame after the hiss (the name-onion rule), end cut 5 ms into the exhale (the vo-flour rule), 3 ms fade-in, 25 ms fade-out, then -18 LUFS.
- vo-flip-done: a breathy exhale after "brown" (80 ms, -9 to -32 dB). vo-more-pancake: a breathy exhale after "more" (50 ms, -22 to -38 dB). End cut 5 ms into the noise, 25 ms fade-out (as vo-flour), then -18 LUFS.
- vo-ladle, vo-pick-pancakes, vo-photo-pancakes, vo-share-pancakes, vo-pancake-mom: a sharp peak reached the -1.5 dBFS cap first (-20.4 / -19.2 / -19.2 / -18.4 / -18.3 LUFS). The make_vo trim, then the same gentle soft limiter as vo-temp-more (max gain reduction 2.8 / 1.7 / 1.7 / 0.8 / 0.7 dB), then -18 LUFS. (vo-ladle also has a very faint 20 ms breath after "pan", -31/-32 dB, too short to count as a noise run; a tail cut there was tried and rejected because the run rule cut into the sentence, so it was left.)
- The other 7 lines measured clean and were not changed. Recognizer (no word list): every word as written ("Whee" as its homophone "we"; "Pipa" recognised as "pipa"). Final range: -18.17 to -17.78 LUFS (measured on the decoded OGG), peaks -1.19 to -3.92 dBFS. Originals of the changed lines are in `work/vo/pre-fix-pancakes/`.

| file | text | voice | duration (s) | loudness (LUFS) | size (bytes) |
|---|---|---|---|---|---|
| voice-a-mom/vo-pick-pancakes.ogg | Let's make pancakes! | af_heart | 1.41 | -18.0 | 12187 |
| voice-a-mom/vo-stir-batter.ogg | Stir the batter nice and smooth! | af_heart | 1.79 | -18.0 | 14669 |
| voice-a-mom/vo-stove.ogg | Let's turn on the stove! | af_heart | 1.5 | -18.0 | 12584 |
| voice-a-mom/vo-ladle.ogg | Pour the batter into the pan! | af_heart | 1.64 | -18.0 | 13317 |
| voice-a-mom/vo-bubbles.ogg | Wait for the bubbles! | af_heart | 1.28 | -18.0 | 11430 |
| voice-a-mom/vo-flip.ogg | Now flip it! Swipe up! | af_heart | 1.72 | -18.3 | 13565 |
| voice-a-mom/vo-flip-done.ogg | Whee! Golden brown! | af_heart | 1.26 | -18.0 | 10930 |
| voice-a-mom/vo-more-pancake.ogg | One more! | af_heart | 0.71 | -18.0 | 7700 |
| voice-a-mom/vo-decorate-pancakes.ogg | Put on anything you like! | af_heart | 1.58 | -18.0 | 12979 |
| voice-a-mom/vo-share-pancakes.ogg | Let's share the pancakes! | af_heart | 1.46 | -18.0 | 12215 |
| voice-a-mom/vo-pancake-mom.ogg | Some for me? Thank you! | af_heart | 1.65 | -18.0 | 13081 |
| voice-a-mom/vo-pancake-pipa.ogg | Some for Pipa! | af_heart | 1.13 | -18.0 | 10367 |
| voice-a-mom/vo-pancake-yum.ogg | Mmm, warm and fluffy! | af_heart | 1.71 | -18.0 | 13851 |
| voice-a-mom/vo-photo-pancakes.ogg | Let's take a picture of your pancakes! | af_heart | 2.09 | -18.0 | 16193 |
| voice-a-mom/vo-finale-pancakes.ogg | We made pancakes together! | af_heart | 1.66 | -18.0 | 13473 |


### Vegetable soup (added 2026-09-20, voice-a-mom only)

16 new lines for the sixth recipe (14 `vo-*` soup lines, `vo-album` for the recipe album, and 2 `name-*` vegetable names), Voice A only (`af_heart`, speed 0.85; `scripts/make_vo.py mom-a <names>`), with the same trimming, -18 LUFS / -1.5 dBFS peak cap, and OGG Vorbis q3 as above.

Targeted fix (2026-09-20): `scripts/fix_vo_soup.py`, a copy of `scripts/fix_vo_pancakes.py` that reuses the functions of `scripts/fix_vo.py` and `scripts/fix_vo_salad.py` unchanged (only the line list and the chosen fixes differ). Originals are kept in `work/vo/pre-fix-soup/`.
- name-zucchini: a loud voiced "uh" before the "z" (60 ms, up to -8.6 dB under the peak; the free recognizer heard "is that kieny"). Start cut 2 ms before the "z" at 0.108 s (3 ms fade-in, 20 ms silence in front, the approved name-carrot cut), then the same gentle soft limiter as vo-temp-more (1.84 dB) and -18 LUFS (was -19.1).
- vo-stir-soup: the same voiced "uh" before the "st" (50 ms, up to -7.2 dB; the recognizer heard "esther the soup"). The same start cut, at 0.128 s, then -18 LUFS.
- vo-water: a breathy exhale after "water" (140 ms of high-zero-crossing noise; the recognizer heard "waters"). End cut 5 ms into the noise at 0.955 s, 25 ms fade-out (the approved vo-flour cut), then -18 LUFS.
- vo-album, vo-peel, vo-photo-soup: a sharp peak reached the -1.5 dBFS cap first (-20.0 / -19.1 / -19.0 LUFS). The make_vo trim, then the same gentle soft limiter as vo-temp-more (max 2.42 / 1.50 / 1.54 dB) and -18 LUFS.
- The other 10 lines measured clean (no lead or trail blob, no click, peak under the cap, -18.15 to -17.72 LUFS) and were not changed.
- **Tried and rejected:** a tail cut on vo-peel-done. The 90 ms noise burst after "peeled" is the "d" release, not an exhale: cutting it turned the recognizer's reading from "oh peeled" into "i'll peel", so the file was left as generated.
- Recognizer (Vosk small-en-us, no word list): every sentence as written, with the substitutions the model already makes on the shipped lines - "pour" as its homophone "poor", "bowl" as "ball", and "All peeled!" as "oh peeled" (the same recognizer reads the shipped, approved vo-wash-done, "All clean!", as "i'll clean", so this is the recognizer's vowel, not the audio). Limited to the two vegetable names, as for the salad names: potato 1.0, zucchini 1.0. Final range: -18.15 to -17.72 LUFS.

| file | text | voice | duration (s) | loudness (LUFS) | size (bytes) |
|---|---|---|---|---|---|
| voice-a-mom/vo-album.ogg | Look at everything we made! | af_heart | 1.62 | -17.9 | 13283 |
| voice-a-mom/vo-pick-soup.ogg | Let's make vegetable soup! | af_heart | 1.79 | -18.1 | 14518 |
| voice-a-mom/name-potato.ogg | Potato! | af_heart | 0.87 | -17.9 | 8411 |
| voice-a-mom/name-zucchini.ogg | Zucchini! | af_heart | 0.82 | -17.8 | 8257 |
| voice-a-mom/vo-peel.ogg | Let's peel it! Swipe along! | af_heart | 1.93 | -17.8 | 14964 |
| voice-a-mom/vo-peel-done.ogg | All peeled! | af_heart | 0.95 | -17.9 | 9129 |
| voice-a-mom/vo-into-pot.ogg | Put it all in the pot! | af_heart | 1.37 | -17.9 | 11866 |
| voice-a-mom/vo-water.ogg | Pour in the water! | af_heart | 0.92 | -18.0 | 8879 |
| voice-a-mom/vo-stir-soup.ogg | Stir the soup while it cooks! | af_heart | 1.45 | -18.0 | 12010 |
| voice-a-mom/vo-soup-ready.ogg | It smells so good! | af_heart | 1.26 | -17.8 | 11194 |
| voice-a-mom/vo-serve-soup.ogg | Let's serve the soup! | af_heart | 1.28 | -17.8 | 11337 |
| voice-a-mom/vo-soup-mom.ogg | A bowl for me? Thank you! | af_heart | 1.75 | -18.1 | 13782 |
| voice-a-mom/vo-soup-pipa.ogg | A bowl for Pipa! | af_heart | 1.25 | -17.9 | 10775 |
| voice-a-mom/vo-soup-yum.ogg | Mmm, warm and cozy! | af_heart | 1.94 | -17.8 | 14838 |
| voice-a-mom/vo-photo-soup.ogg | Let's take a picture of your soup! | af_heart | 1.81 | -17.8 | 14300 |
| voice-a-mom/vo-finale-soup.ogg | We made soup together! | af_heart | 1.36 | -17.7 | 11809 |

### Birthday cake (added 2026-09-20, voice-a-mom only)

19 new lines for the seventh recipe (16 `vo-*` cake lines and 3 `name-*` frosting colours), Voice A only (`af_heart`, speed 0.85; `scripts/make_vo.py mom-a <names>`), with the same trimming, -18 LUFS / -1.5 dBFS peak cap, and OGG Vorbis q3 as above.

Targeted fix (2026-09-20): `scripts/fix_vo_cake.py`, a copy of `scripts/fix_vo_soup.py` that reuses the functions of `scripts/fix_vo.py`, `scripts/fix_vo_salad.py` and `scripts/fix_vo_pancakes.py` unchanged (only the line list and the chosen fixes differ). All 19 lines were measured the same way as before (loudness, peak, voiced energy before the opening consonant, consonant-noise runs at the end, and the Vosk speech recognizer with no word list; the three names also with the recognizer limited to the three colours and `[unk]`, as for the salad names). Measurements: `work/vo/fix-cake/measure.json` (after; the same file held the before values, printed in the round log), `measure-build.json` (candidates, with the before values) and `measure-names.json`. Originals of the changed lines are kept in `work/vo/pre-fix-cake/`.
- name-pink: a loud voiced "uh" before the "p" (50 ms, up to -4.4 dB under the peak, like name-carrot and name-banana; the free recognizer heard "the tank"). Start cut 2 ms before the "p" at 0.118 s (3 ms fade-in, 20 ms silence in front, the approved name-carrot cut), then -18 LUFS. After the fix the lead is gone and the recognizer limited to the three colours hears "pink" at 1.0. With no word list it hears "hank": the small model does not recognise an isolated "pink" at any cut point, the same way it never recognises the shipped name-banana ("they nana") or name-kiwi ("here we're").
- name-chocolate: the same voiced "uh" before the "ch" (70 ms, up to -2.7 dB; the recognizer heard "a chocolate", the extra "a" at 0.42). The same start cut, at 0.118 s, then -18 LUFS. After: "chocolate" alone, 1.0, with and without the word list.
- vo-pick-frosting: a fainter version of the same noise before the "p" (20 ms, -14.2 dB). The same start cut, at 0.118 s, then -18 LUFS. The words were already right; the fix raised the recognizer's confidence on "pick" from 0.64 to 0.81 and on "a" from 0.52 to 0.65, and removed the lead blob.
- vo-pour-pan: a breathy exhale after the final "n" of "pan" (60 ms of high-zero-crossing noise at -18 to -33 dB; the recognizer heard "pans"). End cut 5 ms into the noise at 1.285 s, 25 ms fade-out (the approved vo-flour cut), then -18 LUFS. After: "pour it into the pan", every word at 1.0.
- vo-decorate-cake, vo-photo-cake, vo-cake-pipa: a sharp peak reached the -1.5 dBFS cap first (-19.0 / -18.6 / -18.2 LUFS). The make_vo trim, then the same gentle soft limiter as vo-temp-more (max gain reduction 1.34 / 1.10 / 0.62 dB) and -18 LUFS.
- The other 12 lines measured clean (no lead or trail blob, no click, peak under the cap, -17.95 to -17.75 LUFS) and were not changed.
- Recognizer (Vosk small-en-us, no word list): every sentence as written, with the substitutions the model already makes on the shipped lines - "Yay!" as its homophone "yea" (as "Whee!" comes out "we" in the shipped vo-flip-done), "Pipa" is not in its vocabulary, and "A slice" runs together as "as slice" (the same model reads the identical "A slice" of vo-cake-mom correctly at 1.0, so this is the recognizer's word boundary, not the audio). Final range: -17.93 to -17.75 LUFS measured on the decoded OGG, peaks -1.2 to -4.8 dBFS.

| file | text | voice | duration (s) | loudness (LUFS) | size (bytes) |
|---|---|---|---|---|---|
| voice-a-mom/vo-pick-cake.ogg | Let's bake a birthday cake! | af_heart | 1.65 | -17.8 | 13464 |
| voice-a-mom/vo-stir-cake.ogg | Stir the cake batter! | af_heart | 1.27 | -17.8 | 11392 |
| voice-a-mom/vo-pour-pan.ogg | Pour it into the pan! | af_heart | 1.25 | -17.9 | 11193 |
| voice-a-mom/vo-pick-frosting.ogg | Pick a frosting color! | af_heart | 1.39 | -17.8 | 12042 |
| voice-a-mom/name-pink.ogg | Pink! | af_heart | 0.6 | -17.9 | 6932 |
| voice-a-mom/name-white.ogg | White! | af_heart | 0.71 | -17.9 | 7612 |
| voice-a-mom/name-chocolate.ogg | Chocolate! | af_heart | 0.75 | -17.9 | 7731 |
| voice-a-mom/vo-frost.ogg | Spread the frosting all over! | af_heart | 1.73 | -17.9 | 14305 |
| voice-a-mom/vo-decorate-cake.ogg | Decorate your cake! | af_heart | 1.19 | -17.9 | 10666 |
| voice-a-mom/vo-candles.ogg | Put on the candles! | af_heart | 1.21 | -17.8 | 10647 |
| voice-a-mom/vo-wish.ogg | Make a wish and blow out the candles! | af_heart | 2.15 | -17.8 | 16400 |
| voice-a-mom/vo-blow-more.ogg | Keep blowing! | af_heart | 0.98 | -17.9 | 9185 |
| voice-a-mom/vo-blown.ogg | Yay! Happy birthday! | af_heart | 1.41 | -17.9 | 11874 |
| voice-a-mom/vo-share-cake.ogg | Let's share the cake! | af_heart | 1.22 | -17.8 | 10664 |
| voice-a-mom/vo-cake-mom.ogg | A slice for me? Thank you! | af_heart | 1.79 | -17.8 | 13840 |
| voice-a-mom/vo-cake-pipa.ogg | A slice for Pipa! | af_heart | 1.3 | -17.8 | 11155 |
| voice-a-mom/vo-cake-yum.ogg | Mmm, so soft and sweet! | af_heart | 2.07 | -17.9 | 16128 |
| voice-a-mom/vo-photo-cake.ogg | Let's take a picture of your cake! | af_heart | 1.82 | -17.8 | 14350 |
| voice-a-mom/vo-finale-cake.ogg | We made a birthday cake together! | af_heart | 1.72 | -17.9 | 14668 |

## Music (music/)

_Copied from `music/MUSIC-NOTES.md`._

## Background music loops (pizza cooking game)

All three tracks are from OpenGameArt.org. Each source page lists **CC0** as its license ("CC0 1.0 Universal / Public Domain Dedication"). I checked the license block on each page on 2026-09-19. The music-box zip has no license file inside. It holds only the four .ogg files, so the page is the only license statement. No attribution is required. Crediting the authors is still polite and costs nothing, for example in a credits screen.

Common processing for all three files:
- Decoded to 44.1 kHz stereo float.
- Loop built or trimmed as described in each row.
- Loudness measured with ffmpeg `loudnorm` (measurement pass), then a **single linear gain** (`volume=`) brings each file to **-20 LUFS integrated**. A linear gain keeps the seam intact, which dynamic loudnorm would not.
- Encoded with ffmpeg libvorbis at 44.1 kHz stereo.
- Checked again after encoding: decoded sample count equals the loop length, integrated loudness is -20.0 LUFS, true peak is at or below -6.6 dBTP.

| target file | title | author | source page URL | direct download URL | license (exact) | original file | processing | duration | size bytes | character | seam verification |
|---|---|---|---|---|---|---|---|---|---|---|---|
| music-1.ogg | Cozy Puzzle In-Game 1 | MintoDog | https://opengameart.org/content/cozy-puzzle-in-game-1 | https://opengameart.org/sites/default/files/cozy_puzzle_in-game_1_bpm118.ogg | CC0 (page license field: "CC0") | cozy_puzzle_in-game_1_bpm118.ogg (Vorbis 44.1k stereo, 130.17 s) | The author labels it loopable. The length is exactly 256 beats at 118 BPM (5,740,475 samples), so no trim or crossfade was needed. Gain -7.89 dB (from -12.1 to -20.0 LUFS). Vorbis q2 (~96 kbps) to stay under 1.5 MB | 130.170 s | 1,477,823 | Gentle bossa-nova "cozy puzzle" tune. Author tags: bossa nova, flute, mallets, saxophone, relax, cozy. 118 BPM. Very steady level (LRA 1.9 LU) | Measured on the decoded OGG: join jump 0.0095, below the 99th-percentile sample step near the seam (0.031). No high-frequency spike at the join (-26 dB vs following 10 ms). Head is 10 dB louder than tail because the loop's downbeat lands on sample 0 |
| music-2.ogg | 4 Music Box Tracks: "musicbox2_cute_tune" | Aureolus_Omicron | https://opengameart.org/content/4-music-box-tracks | https://opengameart.org/sites/default/files/musicbox2_cute_tune.ogg (also inside https://opengameart.org/sites/default/files/4_music_box_tracks_ogg.zip, which is byte-identical) | CC0 (page license field: "CC0"; page tags include "looping") | musicbox2_cute_tune.ogg (Vorbis 44.1k stereo, 137.146 s) | Authored looping OGG, 256 beats at 112 BPM. Kept all 6,048,006 samples: the 6 samples past the exact beat grid lead smoothly into sample 0, and trimming them made the join jump larger (0.008 became 0.033). Gain -4.95 dB (from -15.05 to -20.0 LUFS). Vorbis q2 (~96 kbps) | 137.143 s | 1,340,065 | Cute music box / celesta tune. Author tags: cute, happy, music box, celesta. About 112 BPM, light and sparse | Measured on the decoded OGG: join jump 0.0010, smaller than 98% of all sample steps. No high-frequency spike at the join (-11 dB vs following 10 ms). The level rise at the join is a music-box note starting on the downbeat: its high-frequency content keeps ringing, so it is not a click |
| music-3.ogg | Children's Game Music 3 - Home | heartade | https://opengameart.org/content/childrens-game-music-3-home | https://opengameart.org/sites/default/files/children_soundtrack_3.wav | CC0 (page license field: "CC0") | children_soundtrack_3.wav (85.5 s) | The original is not a loop: it plays to about 84.5 s and then fades out in about 1 s. Spectral cross-correlation showed the opening material recurs at exactly 168 beats at 140 BPM (72.000 s, correlation 0.87), so the loop length is 72.000 s (3,175,200 samples). **Loop crossfade:** the continuation after 72 s (x[72s : 73.5s]) is equal-power crossfaded into the first 1.5 s of the head, and everything after 72 s is dropped. The end of the file therefore flows into material that continues it. Gain -6.83 dB (from -13.2 to -20.0 LUFS). Vorbis q3 (~112 kbps) | 72.000 s | 963,388 | Peaceful, warm indoor theme with piano, flute and strings. Author: "Peaceful indoors theme ... created for an educational game for children"; tags: indoors, childlike, warm. About 140 BPM (felt as a relaxed 70) | Measured on the decoded OGG: join jump 0.0017, smaller than 93% of sample steps. Tail and head levels over 50 ms are -21.5 and -19.9 dB. RMS in 250 ms steps across the crossfade stays between -13 and -18 dB, with no dip or bump. No high-frequency spike at the join (-8 dB) |

#### How the seam was measured

The scripts are in `work/music/scripts/`: `seam.py`, `make_loops.py` and `analyze.py`. Each loop is treated as wrapping around (last sample, then first sample). The checks are:
1. The largest per-channel sample jump at the join, compared with the distribution of all sample-to-sample steps and with the 99th percentile within ±200 ms of the seam.
2. RMS of the last 50 ms compared with the first 50 ms.
3. Log-spectrum cosine similarity of the last 200 ms and the first 200 ms.
4. A click detector: the energy above 6 kHz in the 2 ms that straddle the join, compared with the 10 ms that follow it. A click shows up as a positive spike. All three files show a negative value, meaning no spike.

All checks were run on the pre-encode WAV and again on the decoded final OGG.

#### Integration notes
- **Vorbis priming:** ffprobe reports the container `duration_ts` 128 samples longer than the audio (for example 5,740,603 against 5,740,475). This is the standard Vorbis pre-skip, marked with a negative start PTS. Decoders that honour Ogg granule positions, such as ffmpeg, browsers' `decodeAudioData` and Android ExoPlayer, return exactly the loop length; I confirmed this with ffmpeg. For a truly gapless loop in the game, decode to a buffer and loop that buffer (Web Audio `AudioBufferSourceNode.loop = true`, or Howler with `html5:false`). Avoid looping an `<audio>` element / HTML5 media, which usually leaves a small gap.
- All three files are at the same loudness (-20 LUFS), so they can be switched between without volume jumps.
- I could not listen to the audio. Character descriptions come from the authors' descriptions and tags plus signal analysis (tempo, onset density, brightness, level stability). Someone should listen quickly before shipping.

### Rejected / alternative candidates

| candidate | license on page | reason not used |
|---|---|---|
| Happy Clappy Loop (OwlishMedia) https://opengameart.org/content/happy-clappy-loop | CC0 | Good cheerful piano that loops seamlessly, but only 17.4 s long, so it would get repetitive quickly. **Best backup** if a 4th track or a short menu loop is wanted (raw file in work/music/HappyClappyLoop.wav) |
| Happy Lullaby (song17) (cynicmusic) https://opengameart.org/content/happy-lullaby-song17 | CC0 | Bells and arpeggios, 39.5 s. The source is a 32 kHz MP3 (lower fidelity), it fades out at the end (tail -53 dB), and the calm lullaby character is close to the music box |
| musicbox4_happy_polka (Aureolus_Omicron) | CC0 | Fine license, but would give two music-box tracks. It is also denser (3.8 onsets/s) and has a wider level range. Alternative for music-2 |
| Ukulele Forest (StarNinjas) https://opengameart.org/content/ukulele-forest-beginning-loop-and-end | CC0 | Ukulele fits the brief, but the loop is only 8.4 s (too repetitive) |
| Feel Good Island (Brandon75689) https://opengameart.org/content/feel-good-island | OGA-BY 3.0 + CC0 (CC0 usable) | Not loop-ready: 0.2 s of leading silence, 3 s trailing fade, and a quiet intro section (-49 dB). Bass-heavy mix at 129 BPM |
| Napping on a Cloud (congusbongus) https://opengameart.org/content/napping-on-a-cloud | CC0 | 4 min 8 s tracker/chiptune piece with a hot master (sample peak +2 dBFS, clipped). Too long for a 1.5 MB budget |
| Jungle Simple Style 1 (Tozan) https://opengameart.org/content/jungle-simple-style-1 | CC0 | Source is 16 kHz (dull, low fidelity), very quiet with long silences |
| Children's Game Music 1 - Picnic / 4 - Activity (heartade) | CC0 | Picnic (sax, vibraphone, strings, 37 s) is more upbeat and ends in a fade. Activity is percussion-driven (shakers, woodblocks). Both are possible alternatives from the same author as music-3 |
| Shop Theme "Buy Something!" (CleytonKauffman) https://opengameart.org/content/shop-theme | CC0 | Looped bossa "elevator" tune. Downloaded (work/music/shop_theme/) but not processed because music-1 already covers bossa |
| Apple Cider (Zane Little Music) https://opengameart.org/content/apple-cider | CC0 | Guitar, flute, whistle and bells, but not labelled as a loop, and the source is a 3.2 MB OGG or 70 MB WAV. Not evaluated further |
| Bossa (SpringySpringo) https://opengameart.org/content/bossa-shop-theme-in-low-fi-and-hd | CC-BY 3.0 + CC0 | Built from BandLab samples, so the provenance of the underlying samples is a question. Skipped to stay safe |
| FreePD.com | "Public Domain" only | The site now shows a closure notice and says only "free-to-use, Public Domain", with no explicit CC0 wording. Not used, per the rules |
| Kenney.nl | CC0 | Kenney's audio packs are sound effects and short jingles, not background music loops, so there was nothing suitable |
| Freesound previews | - | Not needed. OpenGameArt had enough full-quality CC0 downloads, so no login-gated sources or preview-quality files were used |

## Sound-effect candidates (sfx-candidates/)

_Copied from `sfx-candidates/SFX-NOTES.md`._

## SFX candidates: pizza game

These are **candidates to choose by ear**. No winner has been picked. For each category, the files are numbered 1-3 (the numbers are not a ranking). They were chosen without listening, using the title, description and tags, plus a waveform check: noise floor, clipping, attack/envelope, spectral centroid (how bright or harsh) and length.

`current/` holds unchanged copies of the sounds the game uses now, so you can compare them: `munch.ogg`, `squish.ogg`, `sprinkle.ogg`, `whoosh.ogg`, `oven-ding.ogg`, `cheer-jingle.ogg` (all Kenney CC0; see `cooking-game-assets/LICENSES.md`).

### Licenses

- **Only CC0 1.0** sources were used. Each license was read on the sound's own page.
- **OpenGameArt:** the page's license field says exactly `CC0` and links to https://creativecommons.org/publicdomain/zero/1.0/. Every OGA page used lists **only** CC0 (none are dual-licensed). The OGA zip/7z files used (`crunch_-_tito.zip`, `25-CC0-mud-sfx.zip`, `winjingle.zip`, `mousebyte_chimeyui.7z`) have **no license file inside**, so the OGA page is the license statement.
- **Freesound:** freesound.org itself returned **HTTP 502** from this network for the whole session (curl and web fetch both failed). So each sound page was read from its most recent **Internet Archive (Wayback Machine) snapshot**, which shows the page's license field `Creative Commons 0`. The snapshot date is given for each sound. Downloads are the **public HQ preview files** (`cdn.freesound.org/previews/...-hq.ogg`, about 192 kbps Vorbis), because the original files need a login. Before release, it is worth opening each Freesound page in a browser once to confirm the license is still CC0 (Freesound lets authors change licenses). The oldest snapshot is for munch-2 (2017).
- Kenney packs were downloaded and checked too (RPG Audio, UI Audio, Digital Audio, Interface Sounds, Impact Sounds, Music Jingles; `License.txt` says "Creative Commons Zero, CC0"). No Kenney file made the final list. See "alternates" below.

### Processing (same for every file)

The processing script is `work/sfx/scripts/process.py`. For each file:
- decode, mono downmix, 44.1 kHz, remove DC offset;
- for multi-take files: cut out one take, found by energy segmentation;
- trim leading silence (threshold -45 dB below the loudest 5 ms frame; -40/-50 where noted), keeping 5 ms before the attack. 2 ms fade-in (longer where noted) and a 50-300 ms fade-out;
- gentle high-pass (60-150 Hz) to remove rumble; low-pass only where noted;
- **loudness:** gain to **-18 LUFS** for one-shots (munch, squish, sprinkle, whoosh, character) or **-20 LUFS** for the soft sounds (star, complete, bake), with a **-1 dBFS peak cap**. Very short, spiky sounds (munch, some squishes) reach the peak cap first, so they end up quieter than the target (-19 to -23 LUFS). The actual LUFS and peak are listed for each file. No compression was used, except a soft peak limiter on the bake loops;
- **loops (bake-1/2/3):** a body of N seconds, with the next 0.5-0.6 s of audio equal-power crossfaded into the start, so the end joins the start seamlessly. Loop the whole file. Note: some Android players (MediaPlayer) can add a tiny gap at the loop point with OGG. SoundPool, or ExoPlayer with gapless looping, is usually seamless;
- encode OGG Vorbis `-q:a 4`, mono, 44.1 kHz, metadata stripped.

### Candidates

| target file | title | author | source page URL | direct download URL used | license (as stated) | original file / segment | processing | duration | size (bytes) | why chosen |
|---|---|---|---|---|---|---|---|---|---|---|
| munch-1.ogg | Apple Bite Quick.wav | RoofDog | https://freesound.org/people/RoofDog/sounds/79240/ | https://cdn.freesound.org/previews/79/79240_1227539-hq.ogg (Freesound HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked via an Internet Archive snapshot dated 2026-01-12 (freesound.org gave HTTP 502 from this network) | 79240 HQ preview, 3.63 s; used 1.55-2.25 s (the main bite at about 1.63 s) | cut 1.55-2.40s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 80 ms fade-out; high-pass 60 Hz; mono 44.1k; loudness -23.2 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.70 s | 10746 | Studio recording (Sony PCM-D50, close mic) of a quick, crisp apple bite. The background is clean and the attack is sharp. |
| munch-2.ogg | Bite (Apple) | wadaltmon | https://freesound.org/people/wadaltmon/sounds/275015/ | https://cdn.freesound.org/previews/275/275015_4675419-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked via an Internet Archive snapshot dated 2017-02-14 (only snapshot) (freesound.org gave HTTP 502 from this network) | 275015 HQ preview, 0.87 s; whole take (single bite) | trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 60 ms fade-out; high-pass 60 Hz; mono 44.1k; loudness -21.5 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.68 s | 10825 | One short apple bite: a single clean event, not clipped. Less treble than the cucumber crunches on OpenGameArt. |
| munch-3.ogg | 7 Eating Crunches | starninjas (made by her brother Tito) | https://opengameart.org/content/7-eating-crunches | https://opengameart.org/sites/default/files/crunch_-_tito.zip | CC0 (OpenGameArt license field "CC0", linking to creativecommons.org/publicdomain/zero/1.0/); no license file in the zip | crunch.4.ogg from the zip (0.68 s); whole take | trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 60 ms fade-out; high-pass 60 Hz; mono 44.1k; loudness -19.2 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.45 s | 9563 | A short, clean crunch from a pack made for eating sounds. The background is very quiet and it is not clipped. It has less treble than crunch.3. |
| squish-1.ogg | Squish Sounds Effects | ezduzziteh | https://opengameart.org/content/squish-sounds-effects | https://opengameart.org/sites/default/files/squish_01_0.mp3 | CC0 (OpenGameArt license field "CC0", linking to creativecommons.org/publicdomain/zero/1.0/) | squish_01.mp3 (0.45 s); whole take | trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 60 ms fade-out; high-pass 80 Hz; mono 44.1k; loudness -18.2 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.30 s | 6379 | A short, soft squish with a very clean background (noise about -87 dB) and little treble. It was made for a bug-squishing game, but the sound is short and not gory. |
| squish-2.ogg | 25 CC0 mud SFX | rubberduck | https://opengameart.org/content/25-cc0-mud-sfx | https://opengameart.org/sites/default/files/25-CC0-mud-sfx.zip | CC0 (OpenGameArt license field "CC0", linking to creativecommons.org/publicdomain/zero/1.0/); no license file in the zip | mud_14.ogg from the zip (0.46 s); whole take | trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 60 ms fade-out; high-pass 80 Hz; mono 44.1k; loudness -18.0 LUFS, peak -1.3 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.36 s | 7155 | A real recording of hands in mud. It is one of the few takes in the pack that is not at full level. The attack is soft (about 0.2 s) and the tone is warm. |
| squish-3.ogg | Squish Sounds Effects | ezduzziteh | https://opengameart.org/content/squish-sounds-effects | https://opengameart.org/sites/default/files/squish_03.mp3 | CC0 (OpenGameArt license field "CC0", linking to creativecommons.org/publicdomain/zero/1.0/) | squish_03.mp3 (0.46 s); whole take | trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 60 ms fade-out; high-pass 80 Hz; mono 44.1k; loudness -22.1 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.30 s | 6153 | The darkest and softest squish in the ezduzziteh set, with almost nothing above 6 kHz. |
| sprinkle-1.ogg | salt shaking.wav | simosco | https://freesound.org/people/simosco/sounds/235561/ | https://cdn.freesound.org/previews/235/235561_4258636-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked via an Internet Archive snapshot dated 2026-02-08 (freesound.org gave HTTP 502 from this network) | 235561 HQ preview (10.5 s, repeated shakes); used 0.50-1.95 s (3 shakes) | cut 0.50-1.95s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 80 ms fade-out; high-pass 150 Hz; mono 44.1k; loudness -18.0 LUFS, peak -3.3 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 1.45 s | 17635 | A sea-salt shaker: a light rattle of fine grains. Three quick shakes are about as long as sprinkling cheese. It is bright, but not clipped. |
| sprinkle-2.ogg | Adding salt | tinyworlds | https://opengameart.org/content/adding-salt | https://opengameart.org/sites/default/files/adding_salt_01.ogg | CC0 (OpenGameArt license field "CC0", linking to creativecommons.org/publicdomain/zero/1.0/) | adding_salt_01.ogg (3.2 s); used 0.70-1.72 s (one pinch) | cut 0.70-1.72s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 80 ms fade-out; high-pass 150 Hz; mono 44.1k; loudness -22.0 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 1.02 s | 12872 | Salt falling onto a meal: a soft pitter of small grains. This is the closest match to cheese landing on a pizza. |
| sprinkle-3.ogg | General Household Sound Effects (shakingcoffeegrounds01.wav) | bretbernhoft | https://opengameart.org/content/general-household-sound-effects | https://opengameart.org/sites/default/files/shakingcoffeegrounds01.wav | CC0 (OpenGameArt license field "CC0", linking to creativecommons.org/publicdomain/zero/1.0/); the page also says "available in the public domain" | shakingcoffeegrounds01.wav (120 s stereo); used 80.00-81.45 s (one clean shake) | cut 80.00-81.45s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 80 ms fade-out; high-pass 150 Hz; mono 44.1k; loudness -19.1 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 1.45 s | 17387 | Shaking coffee grounds: a dry, grainy shaker. I used the loudest single shake, which has the least background noise. |
| whoosh-1.ogg | Woosh | florianreichelt | https://freesound.org/people/florianreichelt/sounds/683096/ | https://cdn.freesound.org/previews/683/683096_6253486-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked via an Internet Archive snapshot dated 2026-07-12 (freesound.org gave HTTP 502 from this network) | 683096 HQ preview (1.72 s); used 0.50-1.45 s (swell and peak) with a 120 ms fade-in | cut 0.50-1.45s; trim silence (thr -40 dB rel. max, 5 ms pre-roll), 120 ms fade-in, 120 ms fade-out; high-pass 60 Hz; mono 44.1k; loudness -18.0 LUFS, peak -4.8 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.95 s | 11079 | A slow, soft air woosh that builds up gradually, with no sharp stick-swing crack. This is the gentlest option for sliding the pizza into the oven. |
| whoosh-2.ogg | Air Woosh Move | almitory | https://opengameart.org/content/air-woosh-move | https://opengameart.org/sites/default/files/air_move.wav | CC0 (OpenGameArt license field "CC0", linking to creativecommons.org/publicdomain/zero/1.0/) | air_move.wav (1.4 s); first 0.8 s of the sound | trim silence (thr -40 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 100 ms fade-out; high-pass 60 Hz; mono 44.1k; loudness -18.0 LUFS, peak -1.7 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.80 s | 10514 | Made as a movement woosh for animations and games. It is clean and medium-bright. |
| whoosh-3.ogg | Whoosh #1 | Kinoton | https://freesound.org/people/Kinoton/sounds/427823/ | https://cdn.freesound.org/previews/427/427823_2247456-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked via an Internet Archive snapshot dated 2026-07-12 (freesound.org gave HTTP 502 from this network) | 427823 HQ preview (0.8 s); whole take | trim silence (thr -40 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 60 ms fade-out; high-pass 60 Hz; mono 44.1k; loudness -18.0 LUFS, peak -4.5 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.33 s | 6522 | A short bamboo-stick whoosh, the quickest option (0.33 s) for moving small items. It sounds a little more like a swing than the other two. |
| bake-1.ogg | sizzling cooking on stove.mp3 | FartMuffin | https://freesound.org/people/FartMuffin/sounds/575514/ | https://cdn.freesound.org/previews/575/575514_10643288-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked via an Internet Archive snapshot dated 2025-12-20 (freesound.org gave HTTP 502 from this network) | 575514 HQ preview (9.9 s); used 3.0-7.6 s (skips a loud pop at 2.25 s) | seamless loop: 4.0s body, 0.6s equal-power crossfade of tail into head; high-pass 80 Hz; low-pass 9000 Hz; soft peak limiter (max gain reduction 9.9 dB); mono 44.1k; loudness -20.8 LUFS, peak -6.0 dBFS (target -20 LUFS, peak cap -6); OGG Vorbis -q:a 4 | 4.00 s | 40535 | **LOOP.** Food sizzling in a pan, taken from its steadiest part (the level changes by only about ±2 dB). Crackle peaks were softly limited so single pops don't jump out. |
| bake-2.ogg | Boiling water loops (cooking_without_cover_01.ogg) | tinyworlds | https://opengameart.org/content/boiling-water-loops | https://opengameart.org/sites/default/files/cooking_without_cover_01.ogg | CC0 (OpenGameArt license field "CC0", linking to creativecommons.org/publicdomain/zero/1.0/) | cooking_without_cover_01.ogg (10 s loop); used 0.5-6.0 s | seamless loop: 5.0s body, 0.5s equal-power crossfade of tail into head; high-pass 60 Hz; soft peak limiter (max gain reduction 5.2 dB); mono 44.1k; loudness -20.8 LUFS, peak -3.0 dBFS (target -20 LUFS, peak cap -3); OGG Vorbis -q:a 4 | 5.00 s | 47273 | **LOOP.** A pot of pumpkin bubbling gently: a warm 'blub-blub', the closest match to bubbling cheese. |
| bake-3.ogg | General Household Sound Effects (fryingpan01.wav) | bretbernhoft | https://opengameart.org/content/general-household-sound-effects | https://opengameart.org/sites/default/files/fryingpan01.wav | CC0 (OpenGameArt license field "CC0", linking to creativecommons.org/publicdomain/zero/1.0/); the page also says "available in the public domain" | fryingpan01.wav (60 s stereo); used 1.5-6.1 s (the steadiest part) | seamless loop: 4.0s body, 0.6s equal-power crossfade of tail into head; high-pass 80 Hz; low-pass 6000 Hz; soft peak limiter (max gain reduction 3.8 dB); mono 44.1k; loudness -20.1 LUFS, peak -3.0 dBFS (target -20 LUFS, peak cap -3); OGG Vorbis -q:a 4 | 4.00 s | 41841 | **LOOP.** A very even frying-pan sizzle. The original is very hissy, so I cut the treble above 6 kHz to make it a soft background sizzle. |
| star-1.ogg | Chimey UI Sounds (Chime_Confirm) | mousebyte | https://opengameart.org/content/chimey-ui-sounds | https://opengameart.org/sites/default/files/mousebyte_chimeyui.7z | CC0 (OpenGameArt license field "CC0", linking to creativecommons.org/publicdomain/zero/1.0/); the page says "No rights reserved, no credit needed"; no license file in the 7z | Chime_Confirm.mp3 from the 7z (1.31 s); whole take | trim silence (thr -50 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 80 ms fade-out; mono 44.1k; loudness -20.0 LUFS, peak -8.0 dBFS (target -20 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 1.31 s | 10536 | A soft chime with a very clean background. It is medium-bright, so it should not be piercing. |
| star-2.ogg | Glockenspiel_46_f4_04 | cabled_mess | https://freesound.org/people/cabled_mess/sounds/348924/ | https://cdn.freesound.org/previews/348/348924_5450487-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked via an Internet Archive snapshot dated 2025-06-19 (freesound.org gave HTTP 502 from this network) | 348924 HQ preview (3.4 s); first 1.5 s (strike and most of the ring) | trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 80 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -20.0 LUFS, peak -4.7 dBFS (target -20 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 1.50 s | 12108 | One clean note on a small real glockenspiel (Zoom H5 + Rode NT2000): a pure, simple 'ding'. |
| star-3.ogg | MAGShim_Sparkling Twinkle Bleep 1_EM | newlocknew | https://freesound.org/people/newlocknew/sounds/825544/ | https://cdn.freesound.org/previews/825/825544_5828667-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked via an Internet Archive snapshot dated 2026-07-03 (freesound.org gave HTTP 502 from this network) | 825544 HQ preview (30 s, several variants); used 0-1.2 s (first twinkle) | cut 0.00-1.20s; trim silence (thr -40 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 150 ms fade-out; high-pass 150 Hz; low-pass 10000 Hz; mono 44.1k; loudness -20.0 LUFS, peak -1.5 dBFS (target -20 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 1.19 s | 10978 | A designed 'sparkling bright ding', the most magical-sounding of the three. I cut the treble above 10 kHz to soften the sharpest part. |
| complete-1.ogg | Win Jingle (WinVibraphone) | fupi | https://opengameart.org/content/win-jingle | https://opengameart.org/sites/default/files/winjingle.zip | CC0 (OpenGameArt license field "CC0", linking to creativecommons.org/publicdomain/zero/1.0/); no license file in the zip | WinVibraphone.ogg from the zip (3.78 s); cut to 2.8 s with a 300 ms fade-out | trim silence (thr -50 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 300 ms fade-out; mono 44.1k; loudness -20.0 LUFS, peak -6.4 dBFS (target -20 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 2.80 s | 18215 | A short jingle made for 'end of level / job well done', played on a soft vibraphone. It is warm, not brassy. |
| complete-2.ogg | Chimey UI Sounds (Chime_LevelUp) | mousebyte | https://opengameart.org/content/chimey-ui-sounds | https://opengameart.org/sites/default/files/mousebyte_chimeyui.7z | CC0 (OpenGameArt license field "CC0", linking to creativecommons.org/publicdomain/zero/1.0/); no license file in the 7z | Chime_LevelUp.mp3 from the 7z (1.78 s); whole take | trim silence (thr -50 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 150 ms fade-out; mono 44.1k; loudness -20.0 LUFS, peak -9.1 dBFS (target -20 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 1.78 s | 12329 | A rising 'Level Up' chime: short, light and sparkly. It is from the same set as star-1, so the two would sound like they belong together. |
| complete-3.ogg | Good answer harp glissando.wav | oggraphics | https://freesound.org/people/oggraphics/sounds/610703/ | https://cdn.freesound.org/previews/610/610703_7772719-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked via an Internet Archive snapshot dated 2025-12-12 (freesound.org gave HTTP 502 from this network) | 610703 HQ preview (6.7 s, mostly ring-out and silence); first 2.45 s | trim silence (thr -50 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 300 ms fade-out; high-pass 60 Hz; mono 44.1k; loudness -20.1 LUFS, peak -7.3 dBFS (target -20 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 2.45 s | 23642 | An upward harp sweep made as a 'correct answer' sound. Soft and warm. |

### Listening notes / what to check by ear

- **munch:** munch-1 and munch-2 are real apple bites (crisp). munch-3 is a mouth crunch from a small indie pack. All three are single bites with no chewing.
- **squish:** there is **no CC0 recording of actual dough** that is clean enough (see rejected). These are soft squishes from a bug-squish pack (1, 3) and hands in mud (2). Check that none sounds "gross" to a 5-year-old.
- **sprinkle:** all three are real grain shakers (salt, salt falling, coffee grounds). None has a sparkle layered on. If you want a sparkle, a quiet star-1 could be played on top in code.
- **bake:** bake-2 is bubbling (closest to melted cheese). bake-1 and bake-3 are sizzles. All are seamless loops, meant to play quietly under the "baking" screen.
- **star / complete:** star-1 and complete-2 are from the same chime set (mousebyte), so they would sound like they belong together.

### Alternates (CC0, checked, not processed; easy to add)

- complete: **Kenney Music Jingles `jingles_STEEL02`** (steel drum, rising whole-tone run) and `jingles_STEEL10` (rising D-E-F#-G). Both CC0 (https://kenney.nl/assets/music-jingles), same pack as the current cheer-jingle. Also fupi's `WinGrandPiano` / `WinFantasia` in the same win-jingle zip; olver "HARP GLISSANDO UP.wav" (https://freesound.org/people/olver/sounds/505063/, CC0, rendered from a Reason sound bank, long); mousebyte "Chime_Save"/"Chime_Load".
- star: Kenney Interface Sounds `confirmation_002/003`, `maximize_00x` (synth UI blips, less magical); Samulis "Glockenspiel - C5" (https://freesound.org/people/Samulis/sounds/373364/, CC0, VSCO2 CE; very quiet original).
- whoosh: Kenney RPG Audio `cloth1.ogg` (soft cloth swish, CC0); qubodup "Whoosh" (https://freesound.org/people/qubodup/sounds/60013/, CC0, bamboo, 0.43 s).
- sprinkle: other shakes in the same coffee-grounds file (e.g. 57.23-57.81 s, 60.33-61.91 s).
- munch: OGA "Crunch sounds (burnt toast)" crunch_10.ogg (cogitollc, CC0).
- bake: BenjaminNelan "Frying Pan Sizzle" (https://freesound.org/people/BenjaminNelan/sounds/353124/, CC0, 25 s, bright).

### Rejected candidates (and why)

| candidate | source | reason |
|---|---|---|
| Koops "Apple_Crunch_16/17" | freesound 20279/20280 | Attribution 4.0, not CC0 |
| MEAXX "Apple Munch.wav" | freesound 218069 | Attribution 4.0 |
| Shannonbotha "Biting into apple" | freesound 325991 | Attribution |
| bogenseeberg "pizza.wav" | freesound 621202 | Attribution NonCommercial |
| sonicmariobrotha "apple bite" (and OGA "Apple Bite", which was cut from it) | freesound 333825 / OGA apple-bite | CC0, but the preview has 21 clipped samples in the loudest bites, and OGA users say it "sounds like paper" (very bright) |
| OGA "Crunch sounds (cucumber)" | cogitollc | CC0, but very bright/papery (most of the energy is above 6 kHz) and some takes are quiet and noisy |
| OGA "7 Eating Crunches" crunch.1 | starninjas | clipped (22 samples at full scale) |
| OGA "Crunchy bite" | fvcalderan | made with the voice (a mouth imitation), not a real bite |
| Archos "Slime 7.wav" (stress ball) | freesound 433827, CC0 | quiet and crinkly/clicky (centroid about 7 kHz), not squishy |
| ricexzeeb "Wet Squishy sound" (oatmeal) | freesound 151184, CC0 | wet, clicky, sounds gross |
| jb_stems "Kneading dough in metal pot" | freesound 612769, CC0 | dough events are very quiet and crumbly, with loud pot knocks |
| PrincessGrace "Kneading Bread.wav" | freesound 323769, CC0 | whole file is very quiet (about -58 dBFS), so boosting it brings up noise |
| SoundDesignForYou "Squelching SFX [7]" | freesound 649980, CC0 | described as blood/flesh/gore |
| DrMinky "Slime Death" | freesound 167074 | Attribution 4.0 |
| OGA "8 wet squish slurp impacts", "2 wooden squish splatter" | qubodup | gory splatter content |
| AdamsArchive "salt and pepper shakers" | freesound 379261 | Attribution 3.0 |
| Jay6Waza "SALT - pouring salt" | freesound 323180 | Attribution NonCommercial |
| E-Copeland / DanaGarcia "Salt shaker" | freesound 542608 / 560183 | page not archived, so the license could not be checked |
| OGA "swishes sound pack" | artisticdude | CC0, but 0.1 s weapon swishes (too sharp and short) |
| Robhog "SWOOSH Sound Effect" | freesound 788990, CC0 | stick swings with about 30 ms cores (sharp), not soft |
| EverHeat "Sizzle(loop)" | freesound 208748 | Attribution 3.0 |
| bennathanras "Food Sizzling" | freesound 607430 | Attribution NonCommercial |
| OGA "Bubble sound effects" loops | bmaczero | CC0, but single bubble plops with gaps, not a steady bubbling bed |
| OGA "Fire crackling" | antumdeluge | CC0, but a fireplace, not food; low-level and noisy |
| Universfield "Magical Twinkle" | freesound 758819 | Attribution 4.0 |
| qubodup "Magic Wand Glitter" | freesound 211624, CC0 | extremely bright (centroid 12-14 kHz), would be piercing |
| newagesoup "GLEAM-GLOW-SFX-CHIME" | freesound 351408, CC0 | 95% of the energy is above 6 kHz (hissy shimmer) |
| smokinghotdog "Magic Stars Retro Sparkle" | freesound 584244, CC0 | 3 s low retro synth sweeps, not a short chime |
| frubu "glockenspiel C 1a" | freesound 161553, CC0 | noisy background (floor about -38 dB) |
| OGA "Bell dings/chimes" | pwl | "somewhat thin" (author's words), and bell_ding2 is clipped |
| OGA "Completion sound", "Point bell" | haeldb | dual CC0/OGA-BY. Skipped to keep only pages that list CC0 alone |
| OGA "Pleasing bell" / "Magic words / healing" | spring-spring | CC0, but the bell is very quiet and noisy, and the harp is 3 s+ with a long attack. Kept as a possible alternate |
| Stickinthemud "chimes 3sec gliss up" | freesound 44164 | Attribution 4.0 |
| everythingsounds "Harp Glissando" | freesound 594961 | Attribution 4.0 |
| grunz "success.wav" | freesound 109662 | Attribution 3.0 |
| OGA "Win sound effect", "New thing get", "Positive sound", "Level complete splash" | listener / congusbongus / ezduzziteh / greyfroggames | CC0, but chiptune/synth (retro 8-bit) or long, or already covered by better options |
| OGA "Video game cheerful ending" | almitory | lists many licenses at once. Not used, to be safe |

### Could not find in CC0

- A clean **dough / sauce-spreading** recording (every CC0 dough recording found was too quiet or noisy). The squish candidates are generic soft squishes.
- A single-take **cheese-grater / cheese-falling** sound. Salt and coffee-ground shakers are the stand-ins.
- A true **oven hum**. The bake candidates are pan sizzle and pot bubbling instead.

Working files, downloads and scripts are in `work/sfx/` (`dl/` = OGA/Kenney, `fs/pv/` = Freesound previews, `fs/page_*.html` = archived Freesound pages used for the license check, `scripts/`).


### License re-check (2026-09-19)

freesound.org was reachable again at the end of the session. All Freesound pages used above were opened live on 2026-09-19 and every one links to creativecommons.org/publicdomain/zero/1.0 (CC0).

### Batch 2: prep-step sounds (2026-09-19)

chop, water, bubbles, can-open, jar-open, pour, grate, camera, click, beep. Unlike batch 1, candidate **1 is the recommended default** here, and it is the one copied into `final/sfx/`. The full notes are also in `work/sfx/new/NEW-SFX.md`.

There are 2 candidates per sound. Candidate **1 is the recommended default**. They were chosen without listening, using the title, description and tags, plus a waveform check (noise floor, clipping, envelope, spectral centroid/brightness, length), the same way as `sfx-candidates/SFX-NOTES.md`.

### Licenses (date checked: 2026-09-19)

- **Only CC0 1.0.** All 20 files come from **Freesound**. This time freesound.org was **reachable live**, so each sound page was read directly on **2026-09-19** (no Wayback snapshots were needed). Every page used shows the license field `Creative Commons 0`, linking to http://creativecommons.org/publicdomain/zero/1.0/. The saved pages are in `work/sfx/new/pages/fs_<id>.html` (this includes the pages of rejected sounds).
- Search: Freesound search with the filter `license:"Creative Commons 0"`. The license was then checked again on each sound's own page.
- Downloads are the **public HQ previews** (`cdn.freesound.org/previews/...-hq.ogg`, about 192 kbps Vorbis), because the originals need a login. They are saved in `work/sfx/dl2/fs_<id>.ogg`.
- OpenGameArt "General Household Sound Effects" (bretbernhoft; the license field lists only `CC0`; page re-read live on 2026-09-19 and saved as `pages/oga_general-household-sound-effects.html`) was also downloaded and checked. No file from it made the final list (see Rejected / alternates).
- Kenney packs (CC0 per `License.txt`) were checked for beep/click/chop. None were used.
- No CC-BY, CC-BY-NC, Sampling+ or unknown-license sound was downloaded for use. Every candidate considered below had a CC0 page. The rejections are for quality or origin reasons (for example AI-generated, mouth-made, or an ambiguous attribution note).

### Processing

This is the same pipeline as SFX-NOTES.md. The script is a byte-identical copy of `work/sfx/scripts/process.py`, saved as `work/sfx/new/tools/process.py`. It was copied only so that its log goes to `work/sfx/new/tools/proclog.jsonl` and the existing `work/sfx/scripts/proclog.jsonl` is not changed. The script was run with `ROOT/.venv/Scripts/python.exe`. The processing column below is the script's printed log.

- One-shots: target **-18 LUFS** (chop, bubbles, can-open, jar-open, pour, grate). Soft UI sounds: **-20 LUFS** (camera, click, beep). Peak cap **-1 dBFS**. Short, spiky sounds reach the peak cap first, so they end up a little quieter (-19 to -22 LUFS).
- **bubbles-2 is the only one-shot with the soft peak limiter (`--limit`).** Without it, the foam-soap squirt peaks capped it at -25.9 LUFS. With it: 7.9 dB of gain reduction on 2 spikes, and the result is -20.1 LUFS.
- **Water loops (water-1/2):** `--loop 3.5 0.5`. That is a 3.5 s body, with the next 0.5 s equal-power crossfaded into the start. Also `--lufs -20 --limit --peak -3`, like the bake loops. The limiter was not triggered (0.0 dB). A low-pass at 9 kHz softens the tap hiss.
- **Seam check (loops):** the loop was repeated 3 times, and the 10 ms RMS around the loop point was compared with the body.
  - water-1: seam frames -25.3 to -22.6 dB. The body range is -25.9 to -20.8 dB (median -23.6). The end-to-start sample step is 0.104, which is inside the normal sample-to-sample range (99th percentile 0.153). Spectral centroid of the last 100 ms is 6.8 kHz, and of the first 100 ms 6.6 kHz.
  - water-2: seam frames -24.9 to -20.1 dB. The body range is -26.1 to -19.8 dB (median -23.3). The step is 0.037, below the median sample-to-sample step. Centroid 6.5 kHz on both sides.
  - Both loops are seamless (no level dip or click at the join). Both are exactly 154,350 samples (3.500 s). The note about Android MediaPlayer loop gaps in SFX-NOTES.md applies here too.
- All 20 outputs were checked: each exists, is mono 44.1 kHz OGG Vorbis `-q:a 4`, has 0 clipped samples, and is within the length limits: chop 0.27-0.34 s, camera 0.19 s, click 0.15 s, beep 0.41-0.48 s, others 0.35-1.95 s.

### Candidates

| target file | title | author | source page URL | direct download URL used | license (as stated) | original file / segment | processing | duration | size (bytes) | why chosen |
|---|---|---|---|---|---|---|---|---|---|---|
| chop-1.ogg | Chop on cuttingboard | SunBanana | https://freesound.org/people/SunBanana/sounds/862542/ | https://cdn.freesound.org/previews/862/862542_2530072-hq.ogg (Freesound HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 862542 HQ preview (0.50 s, single chop); whole take, trimmed to start at the chop (about 0.16 s) | trim silence (thr -30 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 80 ms fade-out; high-pass 80 Hz; mono 44.1k; loudness -18.0 LUFS, peak -4.6 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.34 s | 6850 | "Me chopping a knife on a cutting board": a single soft chop with a medium-dark tone (centroid about 2.4 kHz) and no clipping. It is already a short one-shot. |
| chop-2.ogg | Knife 2.mp3 | hannahbelle144 | https://freesound.org/people/hannahbelle144/sounds/625624/ | https://cdn.freesound.org/previews/625/625624_11835707-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 625624 HQ preview (21.3 s, many slices); used 2.10-2.62 s (the loudest single chop, at 2.18 s) | cut 2.10-2.62s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 91 ms fade-out; high-pass 80 Hz; mono 44.1k; loudness -18.0 LUFS, peak -4.2 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.27 s | 5908 | A chef's knife on a wooden board, recorded in "a fairly anechoic closet". The background is very clean (about -64 dB). It is a warm, woody "thock" (centroid about 0.7 kHz), softer than chop-1. |
| water-1.ogg | Kitchen Faucet with Water running into the Sink (Take A) | ani_music | https://freesound.org/people/ani_music/sounds/632457/ | https://cdn.freesound.org/previews/632/632457_3008343-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"; the page adds "Sound credit would be nice but not necessary"); page checked live on freesound.org, 2026-09-19 | 632457 HQ preview (31.2 s); used 9.5-13.6 s (the steadiest part: ±0.7 dB) | seamless loop: 3.5s body, 0.5s equal-power crossfade of tail into head; high-pass 100 Hz; low-pass 9000 Hz; soft peak limiter (max gain reduction -0.0 dB); mono 44.1k; loudness -20.0 LUFS, peak -8.1 dBFS (target -20 LUFS, peak cap -3); OGG Vorbis -q:a 4 | 3.50 s | 37852 | **LOOP.** A kitchen tap running into the sink. It is the most even recording found (level std 0.7 dB) and has no clipping. The low-pass takes the edge off the hiss. |
| water-2.ogg | Kitchen Faucet / Water Tap / Running Water Sound | olehenriksen | https://freesound.org/people/olehenriksen/sounds/771248/ | https://cdn.freesound.org/previews/771/771248_3316599-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 771248 HQ preview (90.7 s); used 21.0-25.1 s (a steady part: ±1.0 dB) | seamless loop: 3.5s body, 0.5s equal-power crossfade of tail into head; high-pass 100 Hz; low-pass 9000 Hz; soft peak limiter (max gain reduction -0.0 dB); mono 44.1k; loudness -20.0 LUFS, peak -6.6 dBFS (target -20 LUFS, peak cap -3); OGG Vorbis -q:a 4 | 3.50 s | 36904 | **LOOP.** A kitchen tap recorded at 96k/24 (Zoom H4n Pro). It is a little darker (centroid about 8 kHz before the filter) and more "splashy" than water-1. |
| bubbles-1.ogg | mutliple bubbles bursting | florianreichelt | https://freesound.org/people/florianreichelt/sounds/683100/ | https://cdn.freesound.org/previews/683/683100_6253486-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 683100 HQ preview (1.16 s); whole take (5 bubble pops, 0.05-0.70 s) | trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 100 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -19.1 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.66 s | 8547 | A quick string of soft, round bubble "bloops" (centroid about 1.3 kHz), with silence in between. Gentle and playful, not hissy. It reads as "bubbly" more than as a real sink. |
| bubbles-2.ogg | Jabon en espuma .aif | Fbela2001 | https://freesound.org/people/Fbela2001/sounds/586061/ | https://cdn.freesound.org/previews/586/586061_13177066-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 586061 HQ preview (2.5 s; the sound is 0-1.47 s); whole take | trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 150 ms fade-out; high-pass 100 Hz; soft peak limiter (max gain reduction 7.9 dB); mono 44.1k; loudness -20.1 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 1.51 s | 17684 | Real hand-washing foam soap being pumped out (tags "delicado, sencillo, suave"): a soft, foamy squish-fizz. Two squirt spikes were softly limited, because otherwise the file would sit at -26 LUFS. |
| can-open-1.ogg | Opening Can with fizz - Soda / Beer / Pop | MutilatorBCB | https://freesound.org/people/MutilatorBCB/sounds/689705/ | https://cdn.freesound.org/previews/689/689705_1025379-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"; the page adds "Credit ... appreciated but not necessary"); page checked live on freesound.org, 2026-09-19 | 689705 HQ preview (3.5 s); used 1.00-2.00 s (the main "pssht" pop and a short fizz; skips the first tab clicks) | cut 1.00-2.00s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 200 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -18.5 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.79 s | 12189 | A studio recording (Neumann TLM-102) of a pull-tab can opening with fizz. The background is very clean (about -75 dB) and it is not clipped. The classic, easy-to-recognise "can open" sound. |
| can-open-2.ogg | Soda Can Open | Kraftaggregat | https://freesound.org/people/Kraftaggregat/sounds/735888/ | https://cdn.freesound.org/previews/735/735888_9268998-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 735888 HQ preview (0.83 s); whole take (tab crack at 0.02 s, pop at 0.56 s) | trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 100 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -19.3 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.71 s | 10430 | A short "crack ... pop" of a soda can (Zoom H6), with a clean background and no clipping. The first tab crack is bright, so check that it is not too sharp. |
| jar-open-1.ogg | Opening & closing the lid on a glass jar | randbsoundbites | https://freesound.org/people/randbsoundbites/sounds/829762/ | https://cdn.freesound.org/previews/829/829762_16968183-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"; the page says "Free to use as you see fit"); page checked live on freesound.org, 2026-09-19 | 829762 HQ preview (4.15 s: open at 0.55 s, close at 2.65 s); used 0.50-1.00 s (the opening only) | cut 0.50-1.00s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 80 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -20.1 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.35 s | 7259 | A glass-jar lid twisted and lifted off: a short twist and "tock" with a warm tone (centroid about 3.8 kHz). The background is very clean. |
| jar-open-2.ogg | Jar lid unscrew.wav | MWsfx | https://freesound.org/people/MWsfx/sounds/574168/ | https://cdn.freesound.org/previews/574/574168_12956274-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 574168 HQ preview (4.3 s); used 0.80-1.50 s (the unscrewing twists) | cut 0.80-1.50s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 100 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -20.0 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.70 s | 10873 | A jar lid being unscrewed (Zoom H4n): a few quick grinding "twist" ticks. The background is clean (about -80 dB in the original). It is the "unscrewing" version, where jar-open-1 is the "lid off" version. |
| pour-1.ogg | Cereal Pour.wav | Zeemilo | https://freesound.org/people/Zeemilo/sounds/452378/ | https://cdn.freesound.org/previews/452/452378_9387410-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 452378 HQ preview (10.4 s); used 1.55-3.40 s (the start of the pour: swell, then a full stream) | cut 1.55-3.40s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 300 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -19.9 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 1.83 s | 24757 | Cereal poured into a bowl, recorded with a Zoom H4n inside the bowl. The pour starts naturally, the background is quiet (about -63 dB) and the tone is medium (centroid about 5 kHz). |
| pour-2.ogg | Pouring_Cereal_Bowl_MiniWheats.wav | vcspran | https://freesound.org/people/vcspran/sounds/344605/ | https://cdn.freesound.org/previews/344/344605_5144331-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 344605 HQ preview (5.0 s); used 0.50-2.30 s (start of the pour) | cut 0.50-2.30s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 300 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -22.0 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 1.80 s | 22372 | Mini-Wheats poured into a bowl: bigger, drier pieces with a "rattly" pour. It is a little brighter (centroid about 6.4 kHz) and a little noisier than pour-1. |
| grate-1.ogg | carrot-grating-slow-medium-fast | BogumilaMerc | https://freesound.org/people/BogumilaMerc/sounds/835794/ | https://cdn.freesound.org/previews/835/835794_18186550-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 835794 HQ preview (22.1 s: slow, medium, fast); used 0.10-2.05 s (the first 3 slow strokes) | cut 0.10-2.05s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 100 ms fade-out; high-pass 150 Hz; low-pass 10000 Hz; mono 44.1k; loudness -18.0 LUFS, peak -4.6 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 1.95 s | 19554 | Real grating on a box grater (Zoom H6 + shotgun), with 3 clearly separate strokes and silence between them (background about -73 dB). A carrot rather than cheese, but it is the same "scritch" sound. Low-passed at 10 kHz to soften it. |
| grate-2.ogg | 10-grater.wav | 14GRevendovaN | https://freesound.org/people/14GRevendovaN/sounds/419365/ | https://cdn.freesound.org/previews/419/419365_8364176-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 419365 HQ preview (7.8 s, steady strokes about every 0.45 s); used 1.15-2.95 s (4 strokes) | cut 1.15-2.95s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 100 ms fade-out; high-pass 150 Hz; mono 44.1k; loudness -18.3 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 1.80 s | 20853 | A household grater with regular, rhythmic strokes. It is darker and softer than grate-1 (centroid about 5.5 kHz) and has a very clean original. The description only says "sound of household chores", so the item being grated is unknown. |
| camera-1.ogg | Camera Shutter Snap | SecureSubset | https://freesound.org/people/SecureSubset/sounds/784946/ | https://cdn.freesound.org/previews/784/784946_16752880-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 784946 HQ preview (0.25 s); whole take | trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 50 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -20.0 LUFS, peak -2.8 dBFS (target -20 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.19 s | 5680 | A compact "ka-chik" shutter snap. It is the least bright of all the shutters found (centroid about 4 kHz), and it is clean and not clipped. |
| camera-2.ogg | camera shutter 2.wav | mywhats | https://freesound.org/people/mywhats/sounds/175516/ | https://cdn.freesound.org/previews/175/175516_1084891-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 175516 HQ preview (0.24 s); whole take | trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 50 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -20.0 LUFS, peak -1.7 dBFS (target -20 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.19 s | 5602 | A real Zenit-E (Russian analog SLR) shutter: a classic mechanical click, with a clean background (about -86 dB). A bit brighter than camera-1. |
| click-1.ogg | microwave switch knob click dial select turn satisfying mechanical control foley kitchen zoom-h5 xy-microphone_ | dimapain | https://freesound.org/people/dimapain/sounds/862193/ | https://cdn.freesound.org/previews/862/862193_18051562-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 862193 HQ preview (14.2 s, about 29 knob detents); used 7.26-7.44 s (one clean detent at 7.28 s) | cut 7.26-7.44s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 50 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -20.0 LUFS, peak -1.2 dBFS (target -20 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.15 s | 5323 | The detent click of a kitchen appliance (microwave) dial, recorded at 96/24 (Zoom H5). One soft, dull tick (centroid about 3.5 kHz) that suits playing once per dial step. |
| click-2.ogg | 20180207_Rotating knob on a stove.wav | cabled_mess | https://freesound.org/people/cabled_mess/sounds/563969/ | https://cdn.freesound.org/previews/563/563969_5450487-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 563969 HQ preview (38.6 s, single knob clicks with pauses); used 4.59-4.78 s (one click at 4.62 s) | cut 4.59-4.78s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 50 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -21.8 LUFS, peak -1.0 dBFS (target -20 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.15 s | 5179 | A real stove knob being turned (ME66 + Zoom H6, denoised). The background is very clean (about -99 dB) and the click is a bit crisper (centroid about 5 kHz). Same author as star-2. |
| beep-1.ogg | Oven Beeps | trendkill_ivxx | https://freesound.org/people/trendkill_ivxx/sounds/846672/ | https://cdn.freesound.org/previews/846/846672_18514981-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 846672 HQ preview (5.5 s, "my little oven tune"); used 0.24-0.72 s (the first two tones) | cut 0.24-0.72s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 80 ms fade-out; high-pass 400 Hz; mono 44.1k; loudness -20.0 LUFS, peak -11.9 dBFS (target -20 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.48 s | 8175 | A real oven's two-note beep (about 2.8 kHz, then 2.6 kHz). Each note fades out gently like a small chime instead of cutting off hard, which makes it the softest beep found. The high-pass removes a 120/286 Hz mains hum. What remains of the background is about -45 dB. |
| beep-2.ogg | Microwave oven beeps.flac | TRP | https://freesound.org/people/TRP/sounds/572534/ | https://cdn.freesound.org/previews/572/572534_97550-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 572534 HQ preview (2.1 s, 3 beeps); used 0.12-0.55 s (the first beep) | cut 0.12-0.55s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 100 ms fade-out; high-pass 200 Hz; mono 44.1k; loudness -20.0 LUFS, peak -15.3 dBFS (target -20 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.41 s | 7450 | One simple 2 kHz microwave beep: a 0.1 s tone with a short natural decay. The background is very clean (about -74 dB). A plainer "appliance" beep than beep-1. |

### Listening notes / what to check by ear

- **chop:** chop-1 is a crisper knife-on-board chop, and chop-2 is a softer, woody thock. Both are single chops, well under 0.6 s.
- **water:** both are loops of a kitchen tap. water-1 is smoother, and water-2 is splashier. Play them quietly. Tap water is naturally hissy, even with the 9 kHz low-pass.
- **bubbles:** bubbles-1 is playful "bloop" bubbles (it may sound slightly cartoony). bubbles-2 is real foam soap from a pump, which is more realistic for hand washing.
- **can-open:** both are pull-tab soda cans. No clean, short CC0 recording of a manual **can opener** was found (see Rejected).
- **jar-open:** jar-open-1 is the lid coming off (short). jar-open-2 is the unscrewing twist.
- **beep:** all real appliance beeps are about 2-3 kHz piezo tones. beep-1 (decaying two-note) is the softest. If both still sound too sharp, the alternates below include a Kenney soft UI chime.

### Alternates (CC0, checked, not processed)

- water: OGA "General Household Sound Effects" `kitchensink01-04.wav` (bretbernhoft, CC0). They are steady, but very bright (centroid about 9.5 kHz).
- bubbles: Reitanna "soapy sounds.wav" (https://freesound.org/people/Reitanna/sounds/215349/, CC0; rubbing mousse to sound like hand soap; spiky).
- chop: OGA `kitchencuttingboard01.wav` (bretbernhoft, CC0; clean single chops, for example at 7.22 s); Erbsland-Music "Cutting a Carrot" (https://freesound.org/people/Erbsland-Music/sounds/634119/, CC0, very clean but brighter).
- can-open: freddybob951 "Opening Tab Soda Can" (https://freesound.org/people/freddybob951/sounds/617630/, CC0, very bright crack); WavJunction.com "Open Soda Can Tab" (https://freesound.org/people/WavJunction.com/sounds/512682/, CC0, needs about 8 dB of limiting).
- jar-open: randbsoundbites "Opening & closing the lid on a glass jar 4" (https://freesound.org/people/randbsoundbites/sounds/845079/, CC0).
- grate: 231133SeanMorrey "Grating_Cheese_1" (https://freesound.org/people/231133SeanMorrey/sounds/708466/, CC0; real cheese, but the strokes are sparse and the background is about -55 dB); Luisa_Sanchez "Grater" (https://freesound.org/people/Luisa_Sanchez/sounds/813449/, CC0, bright).
- camera: Kodack "Camera Shutter Click" (https://freesound.org/people/Kodack/sounds/271010/, CC0, Olympus, bright).
- click: Kenney Interface Sounds `tick_001.ogg`, `click_001.ogg` (CC0; synthetic UI ticks).
- beep: photogtony "microwave beep.wav" (https://freesound.org/people/photogtony/sounds/242006/, CC0; a clean but flat 0.55 s 2 kHz beep); BadIdeaProductions "Start Microwave, 30 sec" end beeps (https://freesound.org/people/BadIdeaProductions/sounds/856189/, CC0); Kenney Interface Sounds `confirmation_004.ogg` (CC0; a soft 1.3 kHz UI chime, if a real beep is too sharp).

### Rejected

| candidate | source | reason |
|---|---|---|
| DataJuggler "Soda Can Opening" | freesound 750288, CC0 | the page says it is **AI-generated** (Stable Audio), so it is not a recording |
| qubodup "Opening Mason Jar" | freesound 743249, CC0 field | the description says it was "carved out of" a spice-grinder recording and points to "CC BY attribution requirements" on the profile. The licensing is ambiguous and it is not really a jar, so it was skipped |
| DeltaCode "opening-soda-can.wav" | freesound 667672, CC0 | described as "A Capella" (mouth-made), and very bright (95% of the energy above 6 kHz) |
| bojan_t95 "Soap bubbles pop" | freesound 507006, CC0 | mouth-made ("Mouth-made sound, edited") |
| Rosesstawn "Pompas de jabon - Burbujas" | freesound 509184, CC0 | made with beatbox, not real bubbles |
| LampEight "Soapy Hands" | freesound 178021, CC0 | tagged "gore / squelch" |
| joewrightmusic "Tiny Bubbles.wav" | freesound 434636, CC0 | a spiky fizz of tiny pops. At the peak cap it only reached -24.7 LUFS, and it is hissier than the chosen two |
| HOrvi64 "Washing My Hands" | freesound 832062, CC0 | mostly running water, very bright (centroid about 12 kHz) |
| PostProdDog "Washing hands" | freesound 537841, CC0 | a whole tap/lather/rinse/paper-towel sequence. The lather is buried under water |
| adviseme333 "shampoo lather", aneolus "Milk foam bubbles" (x2), karinalarasart "Bubble Bath" | freesound 680772 / 544408 / 544409 / 541224, CC0 | very quiet originals (-40 to -47 dB RMS), so boosting them brings up noise |
| fthrll "lather shaving soap in mug", decadylan "Shaving Brush" | freesound 784843 / 825812, CC0 | sparse brush and mug handling, not bubbly |
| SamuelGremaud "SOAPING" | freesound 520926, CC0 | shower soaping with running water, noise floor about -38 dB |
| OGA "poppingbubbles01.wav" | bretbernhoft (OGA), CC0 | sharp full-level pops, bright (centroid about 7 kHz) |
| Iman.Media "Chopping Carrots on Cutting Board" | freesound 850287, CC0 | 56 clipped samples in the preview; 293 s long |
| AudioPapkin "Chopping onion" | freesound 716548, CC0 | 42 clipped samples, bright (centroid about 6.8 kHz) |
| jstan904 "knife-chop.mp3" | freesound 444023, CC0 | slicing through bread, not a chop |
| spanrucker / Colonnades / KaleidacousticsAudio / dutchlady / krissyeliot chopping | freesound 272220 / 760374 / 627197 / 360795 / 125521, CC0 | noisier backgrounds, squelchy lettuce, or plastic/synthetic boards. The chosen two are cleaner, on wood |
| Tom_Kaszuba "Kitchen Faucet Running Water" | freesound 657244, CC0 | 243 clipped samples in the preview; very loud and hissy |
| florianreichelt "sound of a water tap" | freesound 451761, CC0 | uneven (gurgles, level std 2.2 dB) |
| peridactyloptrix "Tap running", brainwaves8 "A running faucet", mrrap4food "kitchen water Faucet" | freesound 202529 / 215997 / 470589, CC0 | low level (-28 to -35 dB RMS) with a noise floor close to the signal |
| giddster "Kitchen faucet" | freesound 336518, CC0 | the tap is almost fully open and less steady (std 2 dB) |
| amandasal1478 "Running Water Faucet" | freesound 827443, CC0 | only 3.6 s, with on/off transitions (not enough steady audio for a loop) |
| Joao_Janz "Kitchen Sink Tap ... Very Soft" | freesound 473713, CC0 | the tap opens and closes within 5 s. Very quiet |
| sloppyjoe24 "Opening Soda Can" | freesound 325700, CC0 | 33 clipped samples, garage reverb |
| sonicstreet "Opening soda can (close)" | freesound 612089, CC0 | 8 clipped samples |
| 13GPanska_Gorbusinova_Anna "Opening a can of soda or beer" | freesound 377996, CC0 | reached only -22.3 LUFS. The chosen two are cleaner |
| kyles "can soft drink soda crack open and fizz" | freesound 637349, CC0 | 24 s, mostly fizz, bright |
| pbharri "Can Opening.wav" | freesound 426360, CC0 | extremely quiet (peak -43 dBFS) |
| Dentrabert "Can Open.wav" | freesound 673310, CC0 | quiet, with a long ring |
| weyhingj "Can Opener" | freesound 144059, CC0 | 1584 clipped samples |
| bochevictoria007 "Foley-Can opener" | freesound 539290, CC0 | 8.8 s of repeated manual can-opener cranking, loud |
| OGA "electriccanopener01.wav" | bretbernhoft (OGA), CC0 | 26 s of continuous electric motor noise |
| PixaPexelAudio "Coffee Jar Open.wav" | freesound 674977, CC0 | a single pop spike held it to -28.8 LUFS (it would need 10.8 dB of limiting); 2 samples at full scale |
| SpliceSound "SmallJarLidScrewUnscrew", jamieorpen "Unscrewing Lid" | freesound 160444 / 447968, CC0 | quiet (-26 dB RMS), long series of small ticks |
| mikepopescu "Glass Jar Metallic Lid ...", BillyPalmer "Glass lid off", nickmaysoundmusic "Kilner_jar ... latch" | freesound 720040 / 435000 / 503569, CC0 | a long handling take, a quiet layered glass lid, and a bright metal latch (centroid about 8.4 kHz) |
| whi1ter1ce / swiftoid / swordofkings128 / ron88888 cereal pours | freesound 708072 / 184306 / 398027 / 758942, CC0 | noise floor -35 to -46 dB, a box crinkle (184306), or bright (758942, centroid about 9 kHz) |
| cupido-1 "cereals in bowl" | freesound 434860, CC0 | sparse, a few pieces at a time, not a pour |
| thedapperdan "Rice Pour", hello_world+123 "pouring rice variation" | freesound 199930 / 764991, CC0 | rice into a plastic bucket/pot, very bright (centroid 7.5-9 kHz) |
| bassimat "Rice grains poured into a cup (contact mic)" | freesound 823855, CC0 | contact microphone, not a natural sound |
| PhilllChabbb "Dry Beans In Plastic Bowl" | freesound 269348, CC0 | 131 s of playing with the beans. The pours get bright (about 10 kHz) |
| paulmerlo "Pouring Coffee Beans" | freesound 539273, CC0 | 24752 clipped samples |
| JarredGibb "Grating cheese.wav" | freesound 244902, CC0 | very quiet (-34 dB RMS), background only 18 dB below it |
| Noisehag "cheese_grater_02/03", Necrosensual "grater2", aamuhaamu "grater2", suonisordi "CGC-...-grater" | freesound 110546 / 110547 / 33917 / 185407 / 737360, CC0 | a grater being **hit** (percussion), not grating |
| saturdaysoundguy "Cheese Grater whoosh" | freesound 391443, CC0 | a whoosh made with a grater |
| freakmanson "Carrot on grater.m4a" | freesound 515330, CC0 | phone microphone, continuous and very bright (centroid about 8.7 kHz) |
| CaspianWagner "Grating noises" | freesound 702510, CC0 | a metal grate scraped with a stick |
| yfjesse "Yunon YN500 Camera Shutter", Tonik1105 "Contarex camera shutter", justamudkip "Camera Shutter #2" | freesound 579884 / 520684 / 854742, CC0 | bright (centroid 8-10 kHz) |
| jdaniel1999 "Camera shutter.wav" | freesound 376205, CC0 | the preview URL returned 404 |
| elricadavis "Camera Shutter" | freesound 764584, CC0 | noisy background (about 30 dB below the clicks) |
| TOMRORYPARSONS "Camera shutter sound.wav" | freesound 425245, CC0 | a long 0.5 s multi-part digital shutter |
| Leonardmedia.nl "Shutter sound android Phone camera" | freesound 636540, CC0 | a recording of a phone's built-in UI sound (third-party design). Skipped to be safe |
| el_boss "Radial knob clicks" | freesound 643563, CC0 | bright (centroid about 10 kHz) |
| lolamadeus "knob click 1" | freesound 144194, CC0 | noise floor only 25 dB below the click |
| plumaudio "Laundry Machine Knob Turn", FOSSarts "Dial on clothing iron", Zott820 "Clicking Dial on Toy" | freesound 521471 / 740226 / 174770, CC0 | 78 / 583 / 365 clipped samples |
| Epease123 "Rotary Dial Switch" | freesound 626659, CC0 | continuous quiet ratchet, bright |
| Sami_Kullstrom "Microwave beep.wav" | freesound 388044, CC0 | phone recording with hum (noise floor only 13 dB below the beep) |
| mrrap4food "Microwave Buttons Beep", kayasavas87 "Microwave Beeps" | freesound 470588 / 70763, CC0 | very quiet (-45 dB RMS) |
| tbsounddesigns "MICROWAVE BEEP", vcspran "Microwaving_Food_Start" | freesound 530198 / 344600, CC0 | beeps over the running microwave (floor -32 / -34 dB) |
| simosco "microwave beeps", ARodLRU2018 "Microwave Beep_ digital" | freesound 235558 / 662314, CC0 | quiet (-30 dB RMS), with the background only about 22-29 dB lower |
| jimbo555 "Microwave Beep.wav" | freesound 630500, CC0 | 352 clipped samples |
| OGA "microwave01-03.wav" | bretbernhoft (OGA), CC0 | 2 minutes of the microwave running (hum), no clear beep |
| Kenney Digital Audio `tone1`, `twoTone1`, `twoTone2` | kenney.nl digital-audio, CC0 | low (280 Hz), buzzy sci-fi blips. They do not sound like an oven |

### Missing

- None. All 10 sounds have 2 CC0 candidates.
- Partial gaps in meaning:
  - **can-open** has no clean, short CC0 recording of a **can opener**. The only ones found were clipped, long cranking, or an electric motor, so both candidates are pull-tab cans.
  - **grate** has no clean CC0 recording of **cheese** on a grater. grate-1 is a carrot, and grate-2 is not specified. The one real cheese take (708466) is listed as an alternate.

### Files

- Outputs: `sfx-candidates/{chop,water,bubbles,can-open,jar-open,pour,grate,camera,click,beep}-{1,2}.ogg` (new files; no existing file was changed).
- Downloads: `work/sfx/dl2/` (Freesound previews `fs_<id>.ogg`, plus the OGA household wavs).
- License pages (all saved 2026-09-19): `work/sfx/new/pages/` (`fs_<id>.html` for each Freesound sound considered; `oga_general-household-sound-effects.html`).
- Tools and logs: `work/sfx/new/tools/` (`process.py` = copy of the pipeline; `proclog.jsonl` = final processing log; `proclog_trials.jsonl` = trial runs; `fss.py` / `fsp.sh` = search and page/licence fetch; `seam.py` = loop seam check; `premd5.txt` = checksums of the pre-existing files). Trial renders: `work/sfx/new/tmp/`. Search result pages: `work/sfx/new/search/`.

### Batch 3: salad sounds (2026-09-19)

tear, squeeze, crunch, drizzle, salt (second recipe: vegetable salad). As in batch 2, candidate **1 is the recommended default**. Nothing was copied into `final/sfx/`. The same notes are also in `work/sfx/salad/SALAD-SFX.md`.

There are 2 candidates per sound. They were chosen without listening, using the title, description and tags, plus a waveform check (noise floor, clipping, envelope, spectral centroid/brightness, length), the same way as batch 2.

### Licenses (date checked: 2026-09-19)

- **Only CC0 1.0.** All 10 files come from **Freesound**. freesound.org was **reachable live**, so each sound page was read directly on **2026-09-19**. Every page used shows the license field `Creative Commons 0`, linking to http://creativecommons.org/publicdomain/zero/1.0/. The saved pages are in `work/sfx/salad/pages/fs_<id>.html` (this includes the pages of rejected sounds).
- Search: Freesound search with the filter `license:"Creative Commons 0"`. The license was then checked again on each sound's own page.
- Downloads are the **public HQ previews** (`cdn.freesound.org/previews/...-hq.ogg`, about 192 kbps Vorbis), because the originals need a login. They are saved in `work/sfx/salad/dl/fs_<id>.ogg`.
- No OpenGameArt or Kenney file was used in this batch.
- No CC-BY, CC-BY-NC, Sampling+ or unknown-license sound was downloaded for use. Every candidate considered below had a CC0 page. The rejections are for quality or origin reasons (clipping, noise, gore/zombie design takes, contact mics, reuse of a batch-1 source).

### Processing

This is the same pipeline as batch 2. The script is a byte-identical copy of `work/sfx/new/tools/process.py`, saved as `work/sfx/salad/tools/process.py`. It was copied only so that its log goes to `work/sfx/salad/tools/proclog.jsonl` and the existing logs are not changed. The script was run with `ROOT/.venv/Scripts/python.exe`. The processing column below is the script's printed log.

- One-shots: target **-18 LUFS**, peak cap **-1 dBFS**, OGG Vorbis `-q:a 4`, mono 44.1 kHz. Short, spiky sounds reach the peak cap first, so they end up quieter. In this batch: tear-1 -22.6, squeeze-2 -22.8 and drizzle-2 -21.8 LUFS (no limiter; similar to batch 2's pour-2 at -22.0).
- **tear-2 is the only file with the soft peak limiter (`--limit`).** The lettuce crackle has one big snap (at 4.22 s in the source) that capped it at -27.2 LUFS without the limiter. With it: 9.2 dB of gain reduction on the snaps, and the result is -23.6 LUFS. Even with the limiter it stays the quietest file, because the whole take is made of short crackles.
- drizzle-2 starts in the middle of the pour, so it has a 30 ms fade-in instead of 2 ms. The drizzles have a 300 ms fade-out, like batch 2's pours. The salt shakers use a 150 Hz high-pass.
- All 10 outputs were checked by decoding them again: each exists, is mono 44.1 kHz OGG Vorbis, has 0 clipped samples, and is within the length limits: crunch 0.48-0.50 s, tear 0.55-0.84 s, squeeze 0.63-0.66 s, salt 0.85-1.00 s, drizzle 1.60-2.05 s. The loudness of the decoded files was within 0.7 dB of the script values (-18.1 to -23.9 LUFS).
- Before any file was written, md5 checksums of all existing files in `sfx-candidates/` and `final/sfx/` were saved to `work/sfx/salad/tools/premd5.txt`. After processing, all of them still matched (no existing file was changed).

### Candidates

| target file | title | author | source page URL | direct download URL used | license (as stated) | original file / segment | processing | duration | size (bytes) | why chosen |
|---|---|---|---|---|---|---|---|---|---|---|
| tear-1.ogg | lettuce rip chomp chew saw | spanrucker | https://freesound.org/people/spanrucker/sounds/272240/ | https://cdn.freesound.org/previews/272/272240_220835-hq.ogg (Freesound HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 272240 HQ preview (47.6 s, iceberg lettuce: rip, chomp, chew, saw); used 4.50-5.05 s (the first and loudest rip, at 4.56 s) | cut 4.50-5.05s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 80 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -22.6 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.55 s | 10322 | Real iceberg lettuce (tags "lettuce, rip, salad, kitchen"): one short, crisp leafy rip with a very clean background (about -71 dB). Centroid about 6.4 kHz. |
| tear-2.ogg | Lettuce Ripping - Senn K6 SD 788T.WAV | lunchmoney | https://freesound.org/people/lunchmoney/sounds/382042/ | https://cdn.freesound.org/previews/382/382042_6692504-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 382042 HQ preview (11.0 s, lettuce being broken apart); used 3.76-4.60 s (a crackle and the big snap at 4.22 s) | cut 3.76-4.60s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 100 ms fade-out; high-pass 100 Hz; soft peak limiter (max gain reduction 9.2 dB); mono 44.1k; loudness -23.6 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.84 s | 14356 | Lettuce leaves being ripped and broken (Sennheiser K6 + Sound Devices 788T), with a gated, silent background. A crunchier, more crackly tear than tear-1 (centroid about 5.4 kHz). |
| squeeze-1.ogg | Lemon,Juicy,Squeeze,Fruit.wav | Filipe Chagas | https://freesound.org/people/Filipe%20Chagas/sounds/91915/ | https://cdn.freesound.org/previews/91/91915_1512131-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 91915 HQ preview (45.6 s, several lemon squeezes); used 17.12-17.78 s (one full squeeze) | cut 17.12-17.78s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 100 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -20.0 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.63 s | 12002 | "Squeezed lemon with juice", recorded with a Schoeps CMC MK41 and a Sound Devices 722 in a very quiet room (background about -73 dB). A wet, juicy squish (centroid about 5.2 kHz). |
| squeeze-2.ogg | Squeezing Lemon | PhilllChabbb | https://freesound.org/people/PhilllChabbb/sounds/337785/ | https://cdn.freesound.org/previews/337/337785_4205952-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 337785 HQ preview (27.1 s); used 6.50-7.16 s (one swelling squeeze) | cut 6.50-7.16s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 100 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -22.8 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.66 s | 13543 | A lemon squeezed by hand (Zoom H4n, "tiny bathroom"): a slower, swelling squelch. The background is a little higher than squeeze-1 (about -60 dB in the original). |
| crunch-1.ogg | Biting an apple | Urkki69 | https://freesound.org/people/Urkki69/sounds/628260/ | https://cdn.freesound.org/previews/628/628260_12244617-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 628260 HQ preview (4.5 s, a single bite at 1.02-1.32 s); used 0.95-1.60 s | cut 0.95-1.60s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 100 ms fade-out; high-pass 80 Hz; mono 44.1k; loudness -18.4 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.48 s | 8589 | One crisp bite into a green Granny Smith apple, with no chewing. The background is silent and it is not clipped. It is the fullest, least harsh bite found (centroid about 5.2 kHz). |
| crunch-2.ogg | Biting a Cucumber.wav | v23 | https://freesound.org/people/v23/sounds/589149/ | https://cdn.freesound.org/previews/589/589149_1751509-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 589149 HQ preview (21.6 s, several bites and chews); used 0.15-0.65 s (the first bite) | cut 0.15-0.65s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 100 ms fade-out; high-pass 80 Hz; mono 44.1k; loudness -18.0 LUFS, peak -2.8 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.50 s | 9392 | A real cucumber bite (a salad vegetable), with a clean background (about -65 dB) and no clipping. It is brighter and snappier than crunch-1 (centroid about 8 kHz). |
| drizzle-1.ogg | Water pouring into glass bowl 01 | Rudmer_Rotteveel | https://freesound.org/people/Rudmer_Rotteveel/sounds/700352/ | https://cdn.freesound.org/previews/700/700352_4921277-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"; the page says "CC0, so no need to give credit"); page checked live on freesound.org, 2026-09-19 | 700352 HQ preview (5.2 s); used 0.50-2.55 s (the start of the pour: a thin, even stream, before the louder end at 2.6 s) | cut 0.50-2.55s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 300 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -19.7 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 2.05 s | 28891 | A thin stream poured into a glass bowl (like a salad bowl). It starts naturally, is fairly even and has a very clean original (about -78 dB). Water, not oil. Centroid about 5.5 kHz. |
| drizzle-2.ogg | Slowly Pouring Water Into A Glass | jbeetle | https://freesound.org/people/jbeetle/sounds/274690/ | https://cdn.freesound.org/previews/274/274690_3029356-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 274690 HQ preview (6.0 s); used 3.40-5.00 s (the slow, thin end of the pour and its natural stop, skipping the louder start) | cut 3.40-5.00s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 30 ms fade-in, 300 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -21.8 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 1.60 s | 26734 | A slow pour into a glass (Yeti mic): a gentle trickle that tapers off, with no clipping. It is more "glassy" and a little more uneven than drizzle-1. |
| salt-1.ogg | Shaking Salt 1 | OutbreakProtocol | https://freesound.org/people/OutbreakProtocol/sounds/720467/ | https://cdn.freesound.org/previews/720/720467_15607324-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 720467 HQ preview (2.6 s, about 6 shakes); used 0.30-1.15 s (the first 4 shakes) | cut 0.30-1.15s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 80 ms fade-out; high-pass 150 Hz; mono 44.1k; loudness -18.0 LUFS, peak -4.7 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.85 s | 11012 | Distinct "shk-shk-shk-shk" salt shakes with short gaps between them. It is the least bright salt shaker found (centroid about 6 kHz) and has a clean background (about -63 dB). |
| salt-2.ogg | Salt shaker.wav | DanaGarcia | https://freesound.org/people/DanaGarcia/sounds/560183/ | https://cdn.freesound.org/previews/560/560183_12494212-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 (in batch 1 its license could not be checked; now it can) | 560183 HQ preview (4.65 s); used 0.95-1.95 s (3-4 shakes) | cut 0.95-1.95s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 80 ms fade-out; high-pass 150 Hz; mono 44.1k; loudness -18.0 LUFS, peak -2.6 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 1.00 s | 12297 | A real salt shaker with a gated, silent background. It is finer and brighter than salt-1 (centroid about 8.5 kHz). |

### Listening notes / what to check by ear

- **tear:** tear-1 comes from a take with rip, chomp, chew and saw sounds. The segment used is the first loud event, which should be a rip, but please check by ear that it is not a chomp. tear-2 is crunchier and more crackly, and it is quiet (-23.6 LUFS) even with the limiter. Both source pages mention gore uses (tags such as "gore, bones" on 382042), but both recordings are plain lettuce.
- **squeeze:** squeeze-1 is short and juicy. squeeze-2 is a slower squelch with a little room sound, and it is about 3 dB quieter.
- **crunch:** crunch-1 is an apple (full and crisp). crunch-2 is a cucumber (brighter and snappier). Both are single bites with no chewing. They are different from munch-1/2/3 (batch 1), which come from other recordings.
- **drizzle:** both are **water** poured in a thin stream, not oil. Oil is thicker and quieter, so a real oil drizzle sounds softer. If they sound too "watery", try them quieter or with a low-pass. drizzle-1 is smoother; drizzle-2 is glassier and ends with the pour stopping.
- **salt:** salt-1 is a few distinct shakes (darker). salt-2 is finer and brighter. Salt shakers are naturally hissy (6-9 kHz), so play them quietly.

### Alternates (CC0, checked, not processed)

- tear: spanrucker 272240 at 18.45-19.05 s (a longer, darker rip; a trial render reached -19.6 LUFS without the limiter; same take as tear-1).
- squeeze: Filipe Chagas 91915 at 27.18-27.75 s (another squeeze in the same take); Filipe Chagas "Lemon,Squeeze,Squishy,Fruit.wav" (https://freesound.org/people/Filipe%20Chagas/sounds/91916/, CC0, "dry", quieter).
- crunch: Anthousai "apple - bite 01.wav" (https://freesound.org/people/Anthousai/sounds/398756/, CC0, clean single bite, brighter at about 7 kHz); 775noise "Biting into an apple.wav" (https://freesound.org/people/775noise/sounds/494568/, CC0, 2 bites, about 7.3 kHz); yuliana_yurukova "apple bite" (https://freesound.org/people/yuliana_yurukova/sounds/774782/, CC0, bites with chewing).
- drizzle: clement.bernardeau "Pouring oil.wav" (https://freesound.org/people/clement.bernardeau/sounds/699231/, CC0). This is the only real **oil** pour found, but it is oil glugging into a bottle (gurgly, centroid about 1.9 kHz), not a thin drizzle. It has 16 clipped samples at 30.45 s, so only a segment away from that point could be used.
- salt: KCJones321 "Salt Shaker Shaking.wav" (https://freesound.org/people/KCJones321/sounds/411197/, CC0, rhythmic shakes, about 9 kHz); Luisa_Sanchez "Salt shaker" (https://freesound.org/people/Luisa_Sanchez/sounds/813451/, CC0, short shakes, very bright at about 10.4 kHz); dster777 "Salt Shaker;Shaken.wav" (https://freesound.org/people/dster777/sounds/344553/, CC0, 5.5 s of continuous shaking, bright).

### Rejected

| candidate | source | reason |
|---|---|---|
| neilsher "Cabbage Rip.wav" | freesound 411683, CC0 | 10 clipped samples, 4 of them inside the best rip (16.12-16.18 s); made as a zombie/brain SFX |
| MalikArsYasakani "Gore Tear 1" | freesound 814734, CC0 | 3 clipped samples, noisy background (about -39 dB), a gore design take |
| IENBA "Gore Cabbage" | freesound 607909, CC0 | cabbage squished and twisted for gore; the best rip reached only -25.7 LUFS |
| Bandslam33 "Lettuce#02.wav" | freesound 545606, CC0 | very quiet (peak -27 dBFS, loudest 20 ms frame -45 dB); made for gut sounds |
| d.n.audio.uk "Lettuce" | freesound 412531, CC0 | a chop/crush ("axe-wielded death-blows"), not a tear |
| aabbccddee123 "049_ArbolsiendoRasgado-004.wav" | freesound 469457, CC0 | a cartoon "tree leaves ripping" effect tagged "cloth"; quiet and very bright (about 10.6 kHz) |
| actionlewis "LETTUCE.wav" | freesound 538698, CC0 | someone eating lettuce (chewing), not tearing |
| nazwhale "Lemon Squeeze" | freesound 845258, CC0 | very bright (centroid about 10.6 kHz), background about -53 dB |
| Joao_Janz "Crushing a Lemon 1_5" | freesound 483932, CC0 | a 50 ms smash/hit (tags "punch, bone breaking"), not a squeeze |
| SleepyCatSound "Peel and crush the orange" | freesound 525199, CC0 | 1098 clipped samples; 138 s long |
| greenlinker "Squeezing Grapefruit" | freesound 757516, CC0 | the main squeeze is very bright (about 9.7 kHz) and quiet (-25 dB RMS); tagged for gore |
| AntumDeluge "Apple Bite" | freesound 584290, CC0 | cut from sonicmariobrotha's apple bite, which batch 1 rejected (clipped, "sounds like paper") |
| phatcorns "Apple Bite" | freesound 250106, CC0 | a mushy apple EQ'd to sound crisp; background about -50 dB; peaks at 0 dBFS |
| JoMungus "Crispy bite" | freesound 718593, CC0 | 2 clipped samples; a rice cake |
| cabled_mess "Cracking carrots" | freesound 564674, CC0 | 6 clipped samples; carrots cracked by hand, not bitten |
| lolamadeus "Carrot Snaps and Crunches" | freesound 181107, CC0 | carrot snaps recorded as a bone-break layer; very bright (8-10 kHz) |
| Erbsland-Music "Eating a Raw Carrot" | freesound 634123, CC0 | mostly chewing, background about -53 dB; the one clear bite is bright (about 8.2 kHz) |
| MadManJimJam "AppleBite.wav" | freesound 426715, CC0 | quiet, very bright (about 9 kHz) |
| PhilllChabbb "Oil Canister Pouring Out into Glass Bottle" | freesound 264455, CC0 | real olive oil, but it glugs in pulses from a canister, not a thin stream |
| PhilllChabbb "Olive Oil Canister" | freesound 264454, CC0 | shaking and squeezing a metal canister, no pour |
| nataliegonzalez19 "pouring oil onto pan" | freesound 636150, CC0 | continuous noisy sizzle (background -29 dB, centroid about 8.3 kHz) |
| ValentinPetiteau "Pour liquid - bottle - close - gloup" | freesound 610390, CC0 | bassy bottle glugs and bubbles, not a drizzle |
| Penny_1527 "Oil movement in container" | freesound 849890, CC0 | very quiet (peak -16 dBFS, -33 dB RMS) sloshing, no pour |
| sokworks "Pouring Milk (Slow)" | freesound 868495, CC0 | only about 0.15 s of actual pour |
| 14GPanskaZakopcanik_Jonas "18-01 Milk pouring_Slow.wav" | freesound 420098, CC0 | very quiet (peak -17.6 dBFS, loudest frame -36 dB) |
| rafael45 "Serving Water Slowly.wav" | freesound 241880, CC0 | phone recording, 204 clipped samples |
| FillSoko "Pouring water into glass" | freesound 257957, CC0 | 834 clipped samples |
| BillyPalmer "Pouring Water In Bowl.wav" | freesound 431119, CC0 | 1 clipped sample, mostly a splash; the author says it "sounds like weeing" |
| simosco "salt shaking.wav" | freesound 235561, CC0 | already used as sprinkle-1 (batch 1), so it was not used again |
| aunrea "Salt Shaker" / GallerShades "salt shaker.wav" | freesound 495669 / 83701, CC0 | extremely quiet (peak about -35 dBFS) |
| lucaslara "Salt Shaker_1-2.aif" | freesound 154480, CC0 | background only about 18 dB below the shakes |
| TimoCoetzee200014 "Salt Shaker" | freesound 594308, CC0 | noisy background (about -42 dB, about 20 dB below the shakes) |
| Unknown_Audio "Salt Shaker.wav" | freesound 416909, CC0 | very bright (centroid about 11 kHz) |
| jamieorpen "Salt Shaker" | freesound 447992, CC0 | quiet (peak -24 dBFS) and very bright (about 10.4 kHz) |
| Luisa_Sanchez "salt shaker" | freesound 816981, CC0 | recorded with a piezo contact microphone, not a natural sound |
| fernandolins86 "ShakerSal(07).wav" | freesound 448155, CC0 | a musical shaker made from salt in a mug (0.23 s) |
| xenognosis "Salt shake.wav", DannyG1207 "Daniel G Shaking Salt" | freesound 137245 / 546718, CC0 | salt shaken in a plastic container, not a salt shaker |

### Missing

- None. All 5 sounds have 2 CC0 candidates.
- Partial gaps in meaning:
  - **drizzle** has no clean CC0 recording of a thin **olive-oil** drizzle. Both candidates are water poured in a thin stream. The only real oil pour (699231) is listed as an alternate.
  - **crunch** has no clean single bite of a **raw carrot**. crunch-1 is an apple and crunch-2 is a cucumber.

### Files

- Outputs: `sfx-candidates/{tear,squeeze,crunch,drizzle,salt}-{1,2}.ogg` (new files; no existing file was changed).
- Downloads: `work/sfx/salad/dl/` (Freesound previews `fs_<id>.ogg`).
- License pages (all saved 2026-09-19): `work/sfx/salad/pages/` (`fs_<id>.html` for each Freesound sound considered).
- Tools and logs: `work/sfx/salad/tools/` (`process.py` = copy of the pipeline; `proclog.jsonl` = final processing log; `proclog_trials.jsonl` = trial runs; `fss.py` / `fsp.sh` = search and page/licence fetch, with paths pointed at `work/sfx/salad/`; `ana.py` / `env.py` = waveform checks (clipping, floor, centroid, events, envelope); `seam.py`, `clip.py`, `peaks.py` = copies of the batch 2 helpers; `premd5.txt` = checksums of the pre-existing files). Trial renders: `work/sfx/salad/tmp/`. Search result pages: `work/sfx/salad/search/`.

### Batch 4: cookie sounds (2026-09-19)

egg-crack, flour-poof, stamp, icing, cookie-crunch (third recipe: cookies). One candidate per sound (`<name>-1.ogg`), copied straight into `final/sfx/` as `<name>.ogg` by `scripts/build_final.py`. Chosen without listening, from title, description and tags plus a waveform check (envelope, noise floor, length), as in batches 2-3.

### Licenses (date checked: 2026-09-19)

- **Only CC0 1.0.** All 5 files come from **Freesound**, found with the search filter `license:"Creative Commons 0"`; each sound's own page was then read live on 2026-09-19 and shows the license field `Creative Commons 0` (http://creativecommons.org/publicdomain/zero/1.0/). Saved pages: `work/sfx/cookies/pages/fs_<id>.html`.
- Downloads are the public HQ previews (originals need a login), saved in `work/sfx/cookies/dl/fs_<id>.ogg`.
- No OpenGameArt, Kenney, Sonniss (not CC0) or other-license file was used. Nothing was synthesised.

### Processing

Same pipeline as batches 2-3: a byte-identical copy of `work/sfx/salad/tools/process.py` in `work/sfx/cookies/tools/` (log: `proclog.jsonl`; the last line per file is the one used). Target -18 LUFS, peak cap -1 dBFS, mono 44.1 kHz, OGG Vorbis `-q:a 4`. Spiky sounds reach the peak cap first: egg-crack -19.8, stamp -20.3 LUFS. **cookie-crunch uses the soft peak limiter (`--limit`, like salad tear-2):** without it -26.6 LUFS; with it 8.6 dB of gain reduction on the crunch transients and -22.8 LUFS.

### Candidates

| target file | title | author | source page URL | direct download URL used | license (as stated) | original file / segment | processing | duration | size (bytes) | why chosen |
|---|---|---|---|---|---|---|---|---|---|---|
| egg-crack-1.ogg | egg - crack - with hit - wide.wav | Anthousai | https://freesound.org/people/Anthousai/sounds/336614/ | https://cdn.freesound.org/previews/336/336614_5923045-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 336614 HQ preview (4.54 s, an egg cracked on the side of a glass bowl); used 3.50-4.20 s (the single loudest crack at 3.60 s) | cut 3.50-4.20s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 51 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -19.8 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.155 s | 5368 | one clean, sharp crack of a real egg on a bowl |
| flour-poof-1.ogg | Dry Puff.wav | valeofhearts | https://freesound.org/people/valeofhearts/sounds/532234/ | https://cdn.freesound.org/previews/532/532234_5285794-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 532234 HQ preview (0.83 s, a single dry puff of air; tags: air, flour, poof, wind); whole file | trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 150 ms fade-out; high-pass 80 Hz; mono 44.1k; loudness -18.0 LUFS, peak -4.8 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.624 s | 9992 | a short, soft 'poof', tagged flour/poof by its author |
| stamp-1.ogg | 17_stamp, rubber, plastic.wav | 15FPanska_KristynaHaupt | https://freesound.org/people/15FPanska_KristynaHaupt/sounds/461888/ | https://cdn.freesound.org/previews/461/461888_9681967-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 461888 HQ preview (15.6 s, a rubber stamp pressed several times); used 0.10-0.60 s (the first press) | cut 0.10-0.60s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 80 ms fade-out; high-pass 60 Hz; mono 44.1k; loudness -20.3 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.339 s | 7127 | a soft, dull press-thump; a cookie cutter pressed into dough is a similar soft thud (no CC0 recording of a cutter pressed into dough was found; 462645 is cutters rattling on a counter) |
| icing-1.ogg | Squeezing Sound | wesleywestmusic | https://freesound.org/people/wesleywestmusic/sounds/680684/ | https://cdn.freesound.org/previews/680/680684_14164674-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 680684 HQ preview (8.9 s, several squeezes; tags: squeeze, squash, mash, knead); used 0.25-0.75 s (the first smooth squeeze) | cut 0.25-0.75s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 20 ms fade-in, 100 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -18.0 LUFS, peak -2.9 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.5 s | 8545 | a smooth, rounded squeeze envelope, closest to squeezing an icing bag (no CC0 piping-bag/icing recording found; the whipped-cream sprays 846514/32921 are pressurised hisses) |
| cookie-crunch-1.ogg | Eating A Biscuit or Cookie | black_trillium | https://freesound.org/people/black_trillium/sounds/752128/ | https://cdn.freesound.org/previews/752/752128_4889106-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 752128 HQ preview (74 s, a biscuit being eaten, denoised with RX-8); used 1.65-2.15 s (the first bite: two crisp crunches) | cut 1.65-2.15s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 100 ms fade-out; high-pass 80 Hz; soft peak limiter (max gain reduction 8.6 dB); mono 44.1k; loudness -22.8 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.414 s | 8081 | a real biscuit bite, clean (denoised) background; different from crunch (apple) and munch |

### Missing

- None: all 5 sounds found under CC0.
- Partial gaps in meaning: **stamp** is a rubber stamp press (no CC0 recording of a cookie cutter pressed into dough); **icing** is a generic smooth squeeze (no CC0 piping-bag recording). egg-crack is short (0.16 s): one crack, no drip.

### Files

- Outputs: `sfx-candidates/{egg-crack,flour-poof,stamp,icing,cookie-crunch}-1.ogg` (new files; no existing file was changed) and the same files in `final/sfx/` without `-1`.
- Downloads, pages, tools: `work/sfx/cookies/` (`dl/`, `pages/`, `tools/` with `fss.py`, `fsp.sh`, `env.py`, `process.py`, `proclog.jsonl`).

### Batch 5: smoothie sounds (2026-09-19)

blender (loop), lid-click, slurp, glass-pour (fourth recipe: fruit smoothie). One candidate per sound (`<name>-1.ogg`), copied straight into `final/sfx/` as `<name>.ogg` by `scripts/build_final.py`. Chosen without listening, from title, description and tags plus a waveform check (envelope, steadiness, brightness, noise floor, length), as in batches 2-4.

### Licenses (date checked: 2026-09-19)

- **Only CC0 1.0.** All 4 files come from **Freesound**, found with the search filter `license:"Creative Commons 0"`; each sound's own page was then read live on 2026-09-19 and shows the license field `Creative Commons 0` (http://creativecommons.org/publicdomain/zero/1.0/). Saved pages: `work/r8-smoothie/sfx/pages/fs_<id>.html`.
- Downloads are the public HQ previews (originals need a login), saved in `work/r8-smoothie/sfx/dl/fs_<id>.ogg`.
- No OpenGameArt, Kenney, Sonniss (not CC0) or other-license file was used. Nothing was synthesised.

### Processing

Same pipeline as batches 2-4: a byte-identical copy of `work/sfx/cookies/tools/process.py` in `work/r8-smoothie/sfx/tools/` (log: `proclog.jsonl`; the last line per file is the one used). One-shots: target -18 LUFS, peak cap -1 dBFS, mono 44.1 kHz, OGG Vorbis `-q:a 4`. **glass-pour uses the soft peak limiter (`--limit`, like cookie-crunch):** without it the splashes held it at -23.3 LUFS; with it 5.3 dB of gain reduction and -18.8 LUFS. **blender is a loop, made like the water/bake loops:** `--loop 4.0 0.6` (a 4.0 s body with the next 0.6 s equal-power crossfaded into the start), `--lufs -20 --limit --peak -3` (limiter not triggered), high-pass 80 Hz and low-pass 8 kHz to keep the motor soft. Taken from the steadiest part of the recording (8.6-13.2 s, level std 0.3 dB over 100 ms frames). Seam check: 50 ms frames around the loop point -22.2 to -23.0 dB, body range -24.2 to -21.8 dB (median -22.7); end-to-start sample step 0.033, inside the normal sample-to-sample range (99th percentile 0.081). Loop the whole file: 0 to 4.000 s (176400 samples at 44.1 kHz).

### Candidates

| target file | title | author | source page URL | direct download URL used | license (as stated) | original file / segment | processing | duration | size (bytes) | why chosen |
|---|---|---|---|---|---|---|---|---|---|---|
| blender-1.ogg | blender-making-lassi.ogg | pbimal | https://freesound.org/people/pbimal/sounds/646773/ | https://cdn.freesound.org/previews/646/646773_11830391-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 646773 HQ preview (16.9 s, a kitchen blender blending lassi, a yogurt drink); used 8.6-13.2 s (the steadiest part) | seamless loop: 4.0s body, 0.6s equal-power crossfade of tail into head; high-pass 80 Hz; low-pass 8000 Hz; soft peak limiter (max gain reduction -0.0 dB); mono 44.1k; loudness -20.0 LUFS, peak -8.8 dBFS (target -20 LUFS, peak cap -3); OGG Vorbis -q:a 4 | 4.00 s | 39299 | **LOOP.** A real blender running with liquid inside (closest to a smoothie), very even (±0.3 dB) and darker than the dry-motor recordings (spectral centroid about 4.2 kHz vs 5-10 kHz); the 8 kHz low-pass softens it further |
| lid-click-1.ogg | Close_Plastic_Container_Lid | Mediasaur | https://freesound.org/people/Mediasaur/sounds/788095/ | https://cdn.freesound.org/previews/788/788095_10164671-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 788095 HQ preview (0.39 s, the lid of a plastic container snapped shut; noise-reduced by the author); whole file | trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 50 ms fade-out; high-pass 100 Hz; mono 44.1k; loudness -18.0 LUFS, peak -1.7 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.389 s | 7936 | one clean plastic snap with a small second tick, like a blender lid pressed on |
| slurp-1.ogg | milkshake.wav | 180007 | https://freesound.org/people/180007/sounds/445523/ | https://cdn.freesound.org/previews/445/445523_8287416-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 445523 HQ preview (7.1 s, slurping a thick milkshake through a straw); used 0.60-1.45 s (one short slurp) | cut 0.60-1.45s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 20 ms fade-in, 150 ms fade-out; high-pass 80 Hz; mono 44.1k; loudness -18.1 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.85 s | 11502 | a thick drink through a straw, just like a smoothie; short and bubbly, no voice (529295 ends with a spoken "ah"; the others are cup, coffee or soda-with-ice slurps) |
| glass-pour-1.ogg | Pouring water into a glass | ahamirikia | https://freesound.org/people/ahamirikia/sounds/710550/ | https://cdn.freesound.org/previews/710/710550_15407943-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 710550 HQ preview (7.5 s, water poured from a bottle into a glass); used 0.35-2.45 s (the main pour) | cut 0.35-2.45s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 20 ms fade-in, 300 ms fade-out; high-pass 100 Hz; soft peak limiter (max gain reduction 5.3 dB); mono 44.1k; loudness -18.8 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 2.075 s | 34011 | liquid into a glass, no clipping (316686 and 579752 clip in the preview); a different recording from drizzle (700352, a glass bowl) |

### Missing

- None: all 4 sounds found under CC0.
- Partial gaps in meaning: glass-pour is water, not a thick smoothie (no CC0 recording of a smoothie being poured was found); lid-click is a plastic container lid, not a blender jug lid.

### Files

- Outputs: `sfx-candidates/{blender,lid-click,slurp,glass-pour}-1.ogg` (new files; no existing file was changed) and the same files in `final/sfx/` without `-1`.
- Downloads, pages, tools: `work/r8-smoothie/sfx/` (`dl/`, `pages/`, `search/`, `tools/` with `fss.py`, `fsp.sh`, `env.py`, `ana.py`, `steady.py`, `seam.py`, `process.py`, `proclog.jsonl`).

### Batch 6: pancake sounds (2026-09-19)

sizzle (loop; fifth recipe: pancakes). One candidate (`sizzle-1.ogg`), copied straight into `final/sfx/` as `sizzle.ogg` by `scripts/build_final.py`. Chosen without listening, from title, description and tags plus a waveform check (steadiness, crackle/crest factor, brightness, low-frequency handling noise, clipping), as in batches 2-5.

### Licenses (date checked: 2026-09-19)

- **Only CC0 1.0.** From **Freesound**, found with the search filter `license:"Creative Commons 0"`; the sound's own page was then read live on 2026-09-19 and shows the license field `Creative Commons 0` (http://creativecommons.org/publicdomain/zero/1.0/). Saved page: `work/r8-pancakes/sfx/pages/fs_534484.html`.
- Download is the public HQ preview (originals need a login), saved in `work/r8-pancakes/sfx/dl/fs_534484.ogg`.
- No OpenGameArt, Kenney, Sonniss (not CC0) or other-license file was used. Nothing was synthesised.

### Processing

Same pipeline as batches 2-5: a byte-identical copy of `work/r8-smoothie/sfx/tools/process.py` in `work/r8-pancakes/sfx/tools/` (log: `proclog.jsonl`). **sizzle is a loop, made like the blender loop:** `--seg 40.0 44.6 --loop 4.0 0.6` (a 4.0 s body with the next 0.6 s equal-power crossfaded into the start), `--lufs -20 --limit --peak -3` (limiter not triggered), high-pass 80 Hz and low-pass 6 kHz to keep the sizzle soft and take the edge off the crackle. Taken from the least crackly steady part of the recording (40-45 s: crest factor 17 dB vs 25 dB earlier in the file, level range 4.7 dB over 50 ms frames). Result: 50 ms frames -25.7 to -21.7 dB (median -23.3), crest max 16 dB, spectral centroid 5.2 kHz (7.6 kHz before the low-pass), no clipping. Seam check: frames around the loop point -22.6 to -24.1 dB, inside the body range; end-to-start sample step 0.008, well inside the normal sample-to-sample range (99th percentile 0.127). Loop the whole file: 0 to 4.000 s (176400 samples at 44.1 kHz).

### Candidates

| target file | title | author | source page URL | direct download URL used | license (as stated) | original file / segment | processing | duration | size (bytes) | why chosen |
|---|---|---|---|---|---|---|---|---|---|---|
| sizzle-1.ogg | pan fry1.wav | Vital_Sounds | https://freesound.org/people/Vital_Sounds/sounds/534484/ | https://cdn.freesound.org/previews/534/534484_10944090-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-19 | 534484 HQ preview (46.3 s, food frying in oil in a pan); used 40.0-44.6 s (the steadiest, least crackly part) | seamless loop: 4.0s body, 0.6s equal-power crossfade of tail into head; high-pass 80 Hz; low-pass 6000 Hz; soft peak limiter (max gain reduction -0.0 dB); mono 44.1k; loudness -20.0 LUFS, peak -6.8 dBFS (target -20 LUFS, peak cap -3); OGG Vorbis -q:a 4 | 4.00 s | 39086 | **LOOP.** A clean, continuous, even pan sizzle (no handling noise, no clipping, ±2 dB), the least spiky of the candidates; the on-topic "Cooking a pancake" (383138) and "Crepe Making" (117602) recordings are much quieter, with mic bumps and handling noise, and "Frying Bacon, Seamless Loop" (753538) and 571670 are crackly (crest 29-33 dB) |

### Missing

- None: sizzle found under CC0.
- Partial gap in meaning: the recording is described as frying meat, not pancake batter (the two CC0 pancake/crepe recordings are too noisy); a gentle, steady pan sizzle sounds the same.

### Files

- Output: `sfx-candidates/sizzle-1.ogg` (new file; no existing file was changed) and the same file in `final/sfx/` as `sizzle.ogg`.
- Downloads, pages, tools: `work/r8-pancakes/sfx/` (`dl/`, `pages/`, `search/`, `tools/` with `fss.py`, `fsp.sh`, `env.py`, `ana.py`, `steady.py`, `seam.py`, `win.py`, `process.py`, `proclog.jsonl`).

### Batch 7: vegetable-soup sounds (2026-09-20)

peel (sixth recipe: vegetable soup). One candidate (`peel-1.ogg`), copied straight into `final/sfx/` as `peel.ogg` by `scripts/build_final.py`. Chosen without listening, from title, description and tags plus a waveform check (single clean stroke, onset transient, steadiness of the scrape body, brightness, low-frequency handling noise, clipping), as in batches 2-6.

### Licenses (date checked: 2026-09-20)

- **Only CC0 1.0.** From **Freesound**, found with the search filter `license:"Creative Commons 0"`; the sound's own page was then read live on 2026-09-20 and shows the license field `Creative Commons 0` (http://creativecommons.org/publicdomain/zero/1.0/). Saved page: `work/r9-soup/sfx/pages/fs_634142.html`.
- Download is the public HQ preview (originals need a login), saved in `work/r9-soup/sfx/dl/fs_634142.ogg`.
- No OpenGameArt, Kenney, Sonniss (not CC0) or other-license file was used. Nothing was synthesised.

### Processing

Same pipeline as batches 2-6: a byte-identical copy of `work/r8-pancakes/sfx/tools/process.py` in `work/r9-soup/sfx/tools/` (log: `proclog.jsonl`). peel is a one-shot: `--seg 2.05 2.52` (one single peeler stroke out of the grouped recording), `--hp 80` (removes table/handling rumble), `--lufs -18 --peak -1.0`, 60 ms fade-out. The stroke has a sharp metal-on-carrot onset transient (crest factor 22 dB), so the -1.0 dBFS peak cap reaches its limit first and holds the file at **-22.9 LUFS** - the same outcome as munch, tear and cookie-crunch, which are also sharp one-shots at about -23 LUFS and are played at gain 1.0. A soft limiter was tried (it reached -18.7 LUFS at 4.9 dB gain reduction) and **rejected**: 4.9 dB of gain reduction dulls the bite of the blade catching the skin, and the documented convention for a sharp one-shot is to keep the transient and raise the playback gain instead. Result: 0.47 s, onset at 0.00-0.01 s, scrape body -7 to -10 dB over the following 0.30 s (range 3 dB), tail down to -21 dB, spectral centroid 8.1 kHz, no clipping.

### Candidates

| target file | title | author | source page URL | direct download URL used | license (as stated) | original file / segment | processing | duration | size (bytes) | why chosen |
|---|---|---|---|---|---|---|---|---|---|---|
| peel-1.ogg | Peeling a Carrot | Erbsland-Music | https://freesound.org/people/Erbsland-Music/sounds/634142/ | https://cdn.freesound.org/previews/634/634142_522747-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-20 | 634142 HQ preview (20.0 s, several groups of peeler strokes on a carrot with a Y-style aluminium peeler); used 2.05-2.52 s (one isolated medium-length stroke with a quiet lead-in at -35 dB and no neighbouring stroke inside the cut) | cut 2.05-2.52s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 60 ms fade-out; high-pass 80 Hz; mono 44.1k; loudness -22.9 LUFS, peak -1.0 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.47 s | 8770 | Exactly the brief: a vegetable peeler taking a strip off a carrot. Recorded with a Zoom H6 + XYH-6 at 96 kHz/24-bit with only cutting and gain applied, so it is the cleanest of the five CC0 peeler recordings: a clear blade-bite onset, an even scrape body and no handling rumble or sink/room noise. "Peeling Carrots" (429887) is over a kitchen sink, "Carrot Peeling" (672731) and "carrot-peeling-slow-medium-fast" (835795) are noisier and have strokes too close together to isolate, and "Skinning Carrots" (534376) is an unprocessed SM58 close recording whose author adds a statement against certain reuses, so it was set aside |

### Missing

- None: peel found under CC0.

### Files

- Output: `sfx-candidates/peel-1.ogg` (new file; no existing file was changed) and the same file in `final/sfx/` as `peel.ogg`.
- Downloads, pages, tools: `work/r9-soup/sfx/` (`dl/`, `pages/`, `search/`, `tools/` with `fss.py`, `fsp.sh`, `env.py`, `ana.py`, `seg.py`, `process.py`, `proclog.jsonl`).


### Batch 8: birthday-cake sounds (2026-09-20)

blow (seventh recipe: birthday cake). One candidate (`blow-1.ogg`), copied straight into `final/sfx/` as `blow.ogg` by `scripts/build_final.py`. Chosen without listening, from title, description and tags plus a waveform and spectrum check (single clean puff, length, signal-to-noise ratio against the room floor, share of energy in the 800-3000 Hz breath band vs. below 200 Hz, clipping), as in batches 2-7.

### Licenses (date checked: 2026-09-20)

- **Only CC0 1.0.** From **Freesound**, found with the search filter `license:"Creative Commons 0"`; the sound's own page was then read live on 2026-09-20 and shows the license field `Creative Commons 0` (http://creativecommons.org/publicdomain/zero/1.0/). Saved page: `work/r10-cake/sfx/pages/fs_242867.html`.
- Download is the public HQ preview (originals need a login), saved in `work/r10-cake/sfx/dl/fs_242867.ogg`.
- No OpenGameArt, Kenney, Sonniss (not CC0) or other-license file was used. Nothing was synthesised.

### Processing

Same pipeline as batches 2-7: a byte-identical copy of `work/r9-soup/sfx/tools/process.py` in `work/r10-cake/sfx/tools/` (log: `proclog.jsonl`). blow is a one-shot: `--seg 0.20 0.60` (the whole puff with its decay), `--hp 80` (removes any handling rumble; the source has almost none, 1.4 % of its energy below 200 Hz), `--lufs -18 --peak -1.0`, 60 ms fade-out. Unlike the sharp one-shots (munch, tear, cookie-crunch, peel) this sound has a soft onset, so it reaches the **-18 LUFS target at a -2.7 dBFS peak** and the peak cap never engages. A soft limiter was tried and rejected as pointless: at -18 LUFS its gain reduction is 0.0 dB, so it changes nothing. Result: 0.344 s, rise 0.02-0.07 s, peak at 0.10 s, decay to -35 dB by 0.20 s, 81 % of the energy in 800-3000 Hz and 0.9 % below 200 Hz (spectral centroid 1.2 kHz), no clipping. Play at gain 0.65, like the other one-shot effects.

### Candidates

| target file | title | author | source page URL | direct download URL used | license (as stated) | original file / segment | processing | duration | size (bytes) | why chosen |
|---|---|---|---|---|---|---|---|---|---|---|
| blow-1.ogg | blowing out candle.wav | Reitanna | https://freesound.org/people/Reitanna/sounds/242867/ | https://cdn.freesound.org/previews/242/242867_950925-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked live on freesound.org, 2026-09-20 | 242867 HQ preview (0.80 s, one close-miked breath puff blowing a candle out); used 0.20-0.60 s (the whole puff: 0.04 s of room floor, the rise, the peak and the full decay, with nothing else in the file) | cut 0.20-0.60s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 60 ms fade-out; high-pass 80 Hz; mono 44.1k; loudness -18.0 LUFS, peak -2.7 dBFS (target -18 LUFS, peak cap -1) | 0.34 s | 6930 | Exactly the brief, and the only candidate that is gentle, short and clean at once. Breath-band spectrum (81 % of the energy in 800-3000 Hz, 1.4 % below 200 Hz), 40 dB signal-to-noise against the room floor, 0.36 s of usable puff, no clipping, and the file contains this one puff and nothing else. "Candle blow" (656818, Samsung phone) is a mic wind-blast, not a puff: 62 % of its energy is below 200 Hz and its spectral centroid is 242 Hz, so high-passing it would leave almost nothing. "Man Blowing Candle Out" (382667) has usable takes but only 17.5 dB signal-to-noise (its quietest take peaks at -33.7 dBFS and needs about 31 dB of gain) and its takes run 0.7-1.4 s, a sustained blow rather than a short puff. "Blowing on a candle" (573035) is 46 s of many takes over a -41 dB room floor (26 dB signal-to-noise) and its one strong take is a hard 0.5 s blow with audible high-frequency hiss. "Blowing Out Candle_more airy" (406648) peaks at -32.3 dBFS with a -50 dB floor, so only about 18 dB of usable range. "Candle flame flickers, blown out" (826338) is a spliced composite with added reverb, a continuous flame flicker under the blow and a clipped +3.2 dBFS peak |

### Missing

- None: blow found under CC0.

### Files

- Output: `sfx-candidates/blow-1.ogg` (new file; no existing file was changed) and the same file in `final/sfx/` as `blow.ogg`.
- Downloads, pages, tools: `work/r10-cake/sfx/` (`dl/`, `pages/`, `search/`, `tools/` with `fss.py`, `fsp.sh`, `env.py`, `ana.py`, `seg.py`, `band.py`, `process.py`, `proclog.jsonl`).


## Character sounds (character/)

_Copied from `character/CHARACTER-NOTES.md`._

## Character vocal candidates (wordless)

Six short vocal reactions for the game's character, to **choose by ear**. None were listened to. They were chosen by title, description and waveform checks. As an extra check, a small offline speech recognizer (Vosk small-en) was run on each vocal candidate to catch real words. It found no words in the files kept here, except that "yay" and "wow" are exclamations by nature.

The license rules, Freesound access notes (pages checked via Internet Archive snapshots because freesound.org gave HTTP 502; downloads are the public HQ previews) and processing steps are the same as in `../sfx-candidates/SFX-NOTES.md`. All six are normalized to -18 LUFS with a -1 dBFS peak cap, mono, 44.1 kHz, OGG Vorbis q4.

**Honest caveat:** I could not find a CC0 **child** voice that is clean and wordless. The voices here are a teenage girl (giggle), adult women (ah), cartoon/creature voices (yay, whoop, huh) and a high-pitched "wow". None were pitch-shifted by me. If the character should sound younger, a small pitch-up (+2 to +3 semitones) in code or ffmpeg is an option, but judge by ear first.

### Candidates

| target file | title | author | source page URL | direct download URL used | license (as stated) | original file / segment | processing | duration | size (bytes) | why chosen |
|---|---|---|---|---|---|---|---|---|---|---|
| char-giggle.ogg | Girl, female, laughing, giggling.wav | SpliceSound | https://freesound.org/people/SpliceSound/sounds/218308/ | https://cdn.freesound.org/previews/218/218308_1480854-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked via an Internet Archive snapshot dated 2025-11-07 (freesound.org gave HTTP 502 from this network) | 218308 HQ preview (11.4 s, 6 separate giggles); used 3.00-3.95 s (3rd giggle) | cut 3.00-3.95s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 60 ms fade-out; high-pass 90 Hz; mono 44.1k; loudness -18.0 LUFS, peak -5.5 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.82 s | 11645 | A teenage girl giggling. It is a very clean recording with short, separate giggles. I used the longest single giggle. |
| char-yay.ogg | yay.wav | Higgs01 | https://freesound.org/people/Higgs01/sounds/428156/ | https://cdn.freesound.org/previews/428/428156_8014960-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked via an Internet Archive snapshot dated 2025-02-26 (freesound.org gave HTTP 502 from this network) | 428156 HQ preview (1.23 s); whole take | trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 80 ms fade-out; high-pass 90 Hz; mono 44.1k; loudness -18.0 LUFS, peak -1.4 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 1.06 s | 13155 | A high cartoon 'yay!' made for a game where a rat cheers, so it already sounds like a cute character. Clean and not clipped. 'Yay' is an exclamation, not a real word. |
| char-wow.ogg | wow.mp3 | willy_ineedthatapp_com | https://freesound.org/people/willy_ineedthatapp_com/sounds/167355/ | https://cdn.freesound.org/previews/167/167355_3062051-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked via an Internet Archive snapshot dated 2026-03-11 (freesound.org gave HTTP 502 from this network) | 167355 HQ preview (1.66 s); whole take | trim silence (thr -35 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 120 ms fade-out; high-pass 90 Hz; mono 44.1k; loudness -18.0 LUFS, peak -5.5 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 1.60 s | 11680 | A high, rising 'wow' (happily amazed). There is some background noise, so listen for hiss. |
| char-ah-surprise.ogg | 01-Ah Oh Sorpresivo.wav | lauracarolina09 | https://freesound.org/people/lauracarolina09/sounds/445868/ | https://cdn.freesound.org/previews/445/445868_9244716-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked via an Internet Archive snapshot dated 2024-07-14 (freesound.org gave HTTP 502 from this network) | 445868 HQ preview (2.6 s, 'Ah' then 'Oh'); used 0.15-1.00 s (the 'Ah!' only) | cut 0.15-1.00s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 100 ms fade-out; high-pass 90 Hz; mono 44.1k; loudness -18.0 LUFS, peak -4.2 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.80 s | 11140 | A surprised female 'Ah!' with no words, for the happy-surprise / gasp moment. I cut the second half ('oh') because the speech checker heard it as 'no'. |
| char-whoop.ogg | Funny Whoop Cartoon Sounds | Breviceps | https://freesound.org/people/Breviceps/sounds/684510/ | https://cdn.freesound.org/previews/684/684510_9159316-hq.ogg (HQ preview) | Creative Commons 0 (Freesound license field "Creative Commons 0"); page checked via an Internet Archive snapshot dated 2025-01-13 (freesound.org gave HTTP 502 from this network) | 684510 HQ preview (4.6 s, 6 whoops); used 0.05-0.68 s (1st whoop) | cut 0.05-0.68s; trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 60 ms fade-out; high-pass 90 Hz; mono 44.1k; loudness -18.0 LUFS, peak -7.2 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.56 s | 8282 | A happy cartoon 'whoop': very clean, short and wordless. |
| (moved to work/character-alternates/char-huh.ogg, to keep the folder at 6) | Huh | tinyworlds | https://opengameart.org/content/huh | https://opengameart.org/sites/default/files/huh.wav | CC0 (OpenGameArt license field "CC0", linking to creativecommons.org/publicdomain/zero/1.0/) | huh.wav (0.35 s); whole take | trim silence (thr -45 dB rel. max, 5 ms pre-roll), 2 ms fade-in, 50 ms fade-out; high-pass 90 Hz; mono 44.1k; loudness -18.0 LUFS, peak -6.7 dBFS (target -18 LUFS, peak cap -1); OGG Vorbis -q:a 4 | 0.35 s | 6368 | A cute, soft 'huh?' made for a character in a Samorost-like game, for curious or 'hmm?' moments. Low-pitched and wordless. |
| char-mmm-synth.ogg | (synthesized) "mmm" hum | generated locally with Kokoro-82M, voice af_heart | https://huggingface.co/hexgrad/Kokoro-82M | n/a (generated from phonemes `mˈmmmː!`, speed 0.8) | Kokoro-82M weights: Apache-2.0; generated output carries no third-party rights | whole take | trim silence, 5 ms fade-in / 40 ms fade-out; -18 LUFS, peak cap -1.5 dBFS; mono 24 kHz; OGG Vorbis -q:a 3 | 0.86 s | 8360 | **Experimental.** No CC0 recording of "mmm" was found, so this is a TTS hum. Analysis shows a voiced hum with falling pitch (~240 → 170 Hz), but it was not heard. It may sound robotic. |

### Coverage vs. the wish-list

| wanted | file | status |
|---|---|---|
| giggle | char-giggle.ogg | found |
| delight / "yay" | char-yay.ogg, char-whoop.ogg | found (cartoon voices) |
| surprise "oh!/ooh!" / happy gasp | char-ah-surprise.ogg, char-wow.ogg | found ("ah!" and "wow" instead of "ooh") |
| curious "hmm?" | work/character-alternates/char-huh.ogg | found, but moved out of character/ to keep the limit of 6 (not on the original wish-list) |
| **"mmm" (yummy)** | char-mmm-synth.ogg (synthetic fallback) | **no CC0 recording found**; a TTS-generated hum was added instead. The good ones (AudioRichter "Mmm Female Various", freesound 169342) are CC-BY. adamcreeper "hmmmm.wav" (freesound 678493, said to be CC0) had no archived page, so I could not check its license. |

### Other CC0 options checked (alternates, not in the folder)

- OGA "Group giggling" (AuraVoice / nocturnalvanguard, CC0, https://opengameart.org/content/group-giggling): clean, but a **group** of adult women. The speech checker heard some words around 3.3-3.9 s. The first 1.6 s would work as a "crowd giggle".
- OGA "80 CC0 creature SFX" (rubberduck): `cute_01`-`cute_10` (pitched-up squeaks, somewhat noisy) and `ooh.ogg` (0.2 s, low male "oh").
- OGA "Female RPG voice starter pack" (cicifyre, CC0): the cutesy voice's `healed1.wav` sounds like an "ah~". The other lines are words (spell names).
- Freesound CC0, not processed: zut50 "yay.mp3" (162395, a group of adults), jayfrosting "Gasp 1 with surprise" (333412, small **crowd**), FloydP "Women gasping.wav" (346213, 8.8 s multi-take), Vikra9409 "Short Whispering Gasp" (825529, whispery), Breviceps "Cartoon - Uh-Oh!" (445964, negative meaning), Sadiquecat "Yippee" (810904, adult man; page shows both CC-BY and CC0 labels, which is unclear).

### Rejected

| candidate | reason |
|---|---|
| JohnsonBrandEditing "Cartoon giggle laugh high pitch" (freesound 243378, CC0) | heavily clipped (about 4900 samples at full scale), so it is distorted |
| FunWithSound "Laugh Group of Children" (416703, CC0) | old family video: noisy background (floor about -28 dB) and room sound |
| SoundMunger "Little Girl giggle" (62263) | Attribution 4.0 |
| thatjeffcarter "giggle.wav" (85135), OBXJohn "Child Laughing" (242932) | Attribution 4.0 |
| Stevious42 "Baby Laugh" (259611) | Attribution 3.0 |
| magicalmysticva "Cute Girl Voice Reactions" (736463) / "Cute Anime Girl Laughing" (734049) | Attribution 4.0 |
| AudioRichter "OOh Female Various" (169336), "Mmm" (169342) | Attribution. They were also described as "sexy/flirty", which is wrong for this game |
| silversatyr "Surprised Woman" (333267), Iceofdoom "Oh!" (371555) | Attribution |
| TheScarlettWitch89 "Female 'Ooh' Singing Voice" (427200) | Attribution 3.0 |
| LittleRainySeasons "Wow Sound.wav" (338047, CC0) | not a voice (a "Hallelujah"-like effect) |
| DarkNightPrincess "Woah!" (621774), tuhinpaul "young girls giggling" (342838), craigsmith "Children Cheering" (438421), makkuzu "wow.wav" (555610), Legnalegna55 "WOW wow" (547353), qubodup "Nom Nom Nom" (210432) | the Freesound page could not be fetched (site down, and not archived or the archive rate-limited me), so the license could not be checked. Worth checking in a browser, since some are said to be CC0 |
| OGA "Tiny creatures sounds" laugh.ogg (fvcalderan) | a pitched-up "battle" creature voice; its tail (0.9 s build-up) may sound spooky |
| OGA "Pixie voice saying game over", "Little girl saying game over" | real words |


### License re-check (2026-09-19)

freesound.org was reachable again at the end of the session. All five Freesound pages above were opened live on 2026-09-19 and every one links to creativecommons.org/publicdomain/zero/1.0 (CC0).
