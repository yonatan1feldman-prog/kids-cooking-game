# רישיונות / Licenses

Every sound and image the game ships, where it comes from, and its license. Paths are under `public/assets/`.
Everything is CC0 1.0 (public domain dedication, no attribution required, credited anyway), drawn for this
project, or narration generated locally with an Apache-2.0 model.

## Sounds: effects (`sounds/sfx/`)

### Kept from the first version (Kenney audio packs, CC0 1.0)

Taken unmodified (only renamed). The `License.txt` inside each downloaded zip states "Creative Commons Zero, CC0"
(http://creativecommons.org/publicdomain/zero/1.0/).

| File | Source pack | Original file in pack | Pack URL | License | Author |
|---|---|---|---|---|---|
| sfx/tap.ogg | Interface Sounds | Audio/click_001.ogg | https://kenney.nl/assets/interface-sounds | CC0 1.0 | Kenney (kenney.nl) |
| sfx/pop.ogg | Interface Sounds | Audio/drop_002.ogg | https://kenney.nl/assets/interface-sounds | CC0 1.0 | Kenney (kenney.nl) |
| sfx/oven-ding.ogg | Impact Sounds | Audio/impactBell_heavy_000.ogg | https://kenney.nl/assets/impact-sounds | CC0 1.0 | Kenney (kenney.nl) |
| sfx/cheer.ogg | Voiceover Pack | Female/congratulations.ogg | https://kenney.nl/assets/voiceover-pack | CC0 1.0 | Kenney (kenney.nl) |
| sfx/cheer-jingle.ogg | Music Jingles | Audio/Pizzicato jingles/jingles_PIZZI10.ogg | https://kenney.nl/assets/music-jingles | CC0 1.0 | Kenney (kenney.nl) |

### New in round 4 (they replace the old munch, squish, sprinkle and whoosh)

From the sound agent's `final/LICENSES.md`. Freesound files use the public HQ preview; all four source pages showed
"Creative Commons 0" when checked on 2026-09-19. The OpenGameArt pages list CC0 only.

| File | Title | Author | Source page | License | Processing |
|---|---|---|---|---|---|
| sfx/munch.ogg | Apple Bite Quick.wav | RoofDog | https://freesound.org/people/RoofDog/sounds/79240/ | CC0 1.0 | cut 1.55-2.40 s, trimmed, faded, high-pass 60 Hz, -23 LUFS |
| sfx/squish.ogg | Squish Sounds Effects (squish_01) | ezduzziteh | https://opengameart.org/content/squish-sounds-effects | CC0 1.0 | trimmed, faded, high-pass 80 Hz, -18 LUFS |
| sfx/sprinkle.ogg | salt shaking.wav | simosco | https://freesound.org/people/simosco/sounds/235561/ | CC0 1.0 | cut 0.50-1.95 s (3 shakes), high-pass 150 Hz, -18 LUFS |
| sfx/whoosh.ogg | Woosh | florianreichelt | https://freesound.org/people/florianreichelt/sounds/683096/ | CC0 1.0 | cut 0.50-1.45 s, 120 ms fades, -18 LUFS |
| sfx/bake.ogg (loop) | sizzling cooking on stove.mp3 | FartMuffin | https://freesound.org/people/FartMuffin/sounds/575514/ | CC0 1.0 | 4.0 s seamless loop from 3.0-7.6 s, filtered, soft limiter, -21 LUFS |
| sfx/star.ogg | Chimey UI Sounds (Chime_Confirm) | mousebyte | https://opengameart.org/content/chimey-ui-sounds | CC0 1.0 | trimmed, faded, -20 LUFS |
| sfx/complete.ogg | Win Jingle (WinVibraphone) | fupi | https://opengameart.org/content/win-jingle | CC0 1.0 | cut to 2.8 s, 300 ms fade-out, -20 LUFS |

## Sounds: music (`sounds/music/`)

| File | Title | Author | Source page | License | Processing |
|---|---|---|---|---|---|
| music/music-main.ogg | Cozy Puzzle In-Game 1 | MintoDog | https://opengameart.org/content/cozy-puzzle-in-game-1 | CC0 1.0 | none to the loop (exactly 256 beats at 118 BPM, gapless); gain -7.9 dB to -20 LUFS; Vorbis q2 |

## Sounds: Mom's voice (`sounds/voice/`, 23 lines, English)

- Generated locally with **Kokoro-82M** v1.0 (https://huggingface.co/hexgrad/Kokoro-82M), ONNX build from
  https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0. The model weights are **Apache-2.0**;
  it was trained only on permissive or non-copyrighted audio, and the generated audio contains no third-party recordings.
- Voice `af_heart` (American English, female), speed 0.85. Silence trimmed, short fades, -18 LUFS, mono 24 kHz Vorbis.

| File | Text |
|---|---|
| vo-welcome | Let's cook together! |
| vo-pick-pizza | Let's make a pizza! |
| vo-watch-me | Watch me first! |
| vo-your-turn | Now, you try! |
| vo-roll | Let's roll the dough! |
| vo-sauce | Now spread the sauce! |
| vo-cheese | Sprinkle the cheese! |
| vo-toppings | Put on anything you like! |
| vo-done-hint | Tap here when you're done! |
| vo-oven | Into the oven it goes! |
| vo-baking | Look, it's baking! |
| vo-ready | Ding! It's ready! |
| vo-feed | Let's give Pipa a taste! |
| vo-help | Let me help you! |
| vo-praise-1 ... 7 | Great job! · Wow! · Beautiful! · Yummy! · I love it! · You worked so hard! · I love how you did that! |
| vo-finale | We made a pizza together! |
| vo-bye | That was fun! Bye bye! |

## Graphics (`images/`)

All SVG files in `images/` were drawn for this project by the art agent (style B, paper cut-out; generators in
`cooking-game-assets/images-b/tools`, not part of this repo). No third-party art, fonts or images.
`images/webp/` holds WebP renderings of those same SVGs, made by `scripts/bake-webp.js`.
