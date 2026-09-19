# AGENTS.md — read this first

## What this is
A private cooking game for a 5-year-old girl. She plays mainly on an Android phone (20:9) held
sideways (landscape, locked), sometimes on a tablet. It is not for any app store. The owner is not
technical and does no manual steps: agents do everything.

**Language: the child speaks English.** Anything spoken or worded in the game (voice-over,
narration, sung jingles with words, any text ever shown) is in **English**, now and in the future.
The screen stays text-free (see the UX rules). Commit messages stay in Hebrew: they are for the owner.

**The idea: cooking with Mom.** Mom stands at the counter for the whole recipe, shows every move with her hand,
and talks in a warm, encouraging English voice. Pipa the hedgehog is the kitchen pet; she tastes the pizza at the end.

Current content: one recipe (pizza), start to finish, with the style-B paper cut-out art, Mom's voice, music and
sounds, in landscape. Later recipes should be mostly a new data file (plus their voice lines).

Stack: Phaser 4 (4.2.x) + Vite + TypeScript, installed as a PWA (vite-plugin-pwa).
The official Phaser 4 skills are in `node_modules/phaser/skills/*/SKILL.md`. Read the
relevant ones (scenes, input, tweens, particles, scale-and-responsive, loading-assets,
audio-and-sound, render-textures) before changing engine-level code. They beat any other
notes (e.g. `../cooking-game-assets/mechanics-notes.md` is hints only). Phaser 4 differs from 3
(for example tint modes, filters instead of masks and FX, Vector2 instead of Point, and
DynamicTexture needs `.render()`).

## UX rules (must hold for every change)
1. **Zero text to read.** Icons, motion and sound only. No words, letters or digits on screen.
2. **You can't fail and you can't get stuck.** Each step: the first two times a recipe is played, Mom shows it once
   before it starts (her demo hand, at most 2.5 s, the dish unchanged; a touch ends it at once and counts). After 5 s
   without progress her hand shows the gesture again (the hint, with a glow on the target), and after 10 more seconds
   Mom helps: "Let me help you!" and her hand visibly does it (`src/steps/Step.ts`: `HINT_AFTER_MS`,
   `AUTO_AFTER_HINT_MS`, `DEMO_MAX_MS`). Exception: free decorating waits 15 s for the hint (once something is on the
   pizza she points at the done button: "Tap here when you're done!") and 15 more to help. 3 missed drops in a row
   show the hint right away (`Step.miss()`). There is no wrong answer and no losing.
3. **One finger only:** tap, drag, rub. No double-tap gestures, no long-press, no multi-touch, no time limits.
   The first finger to touch owns the action until lifted. A second finger or a resting palm
   never interrupts or steals it (`Step.onDown/onMove/onUp`, `iconButton`).
   The one deliberate exception is the home button: it needs two separate taps within 2 s (see 9).
4. **Physical size first.** On the phone, 1080 world units are only about 6.5 cm. The pizza and its
   board are shown at their full native size (no 75% reduction). Everything the child touches is at least
   **200 world units on its short side**, and its touch area reaches beyond the drawing. Drop targets accept
   generous misses. A lost touch (pointercancel, release off the screen, the device turned to portrait)
   sends the item gently back. Touch size beats identical outline thickness (see "Sizes" below).
5. **No-touch zones:** nothing interactive may start in the bottom 8% of the screen (palm, `PALM_ZONE`)
   or in 4% of the width on each side (the thumbs of the holding hands, `SIDE_ZONE`).
   `inNoTouchZone()` in `layout.ts` is applied by `Step.onDown` and `iconButton` (screen coordinates),
   and the stage table keeps every touch area out of those strips.
6. **Instant feedback** for every action on touch-down: motion + particles + sound.
   Buttons fire on press. Only the play button fires on release, because browsers grant fullscreen,
   audio unlock, orientation lock and wake lock only from a completed tap.
7. **Progress lives in the object** (dough flattens, sauce spreads, pizza fills). No progress bars, no dots,
   no top bar.
8. **Landscape only, any landscape ratio, no distortion.** 4:3 to 20:9 (see "Landscape layout"). Held
   upright, a text-free rotate screen covers the game and the game pauses (`core/orientation.ts`).
9. **Home button** (top-left, the only button on the recipe screen besides done): the first tap makes it
   grow and wobble, a second tap within 2 s goes home, otherwise it shrinks back. No long press.

## Child wellbeing rules (permanent, must hold for every change)
1. **No character is ever sad, disappointed or pleading** when she leaves or stops. No reminders to come back, no
   daily streaks, no rewards for returning, no counters, no points, no scores.
2. **Every recipe ends with a clear, warm finale** (Mom: "We made a pizza together!", a cheer, "That was fun! Bye bye!")
   and then goes quietly back to the home screen. The game never starts another recipe by itself.
3. **No time pressure. She can't fail. Leaving is always easy** (the home button is always there; two taps only so a
   stray palm can't end her work; the device's own home/back always works).
4. **Praise is for effort and process, never for a trait** ("You worked so hard!", "I love how you did that!",
   or about the pizza: "Beautiful!", "Yummy!"). Never "you're so smart / talented / good".
5. **Every animation, sound and effect answers something she did** (or helps her after she stopped: the hint, Mom's
   help). Nothing sparkles, bobs, pulses or wiggles by itself to pull her attention. Allowed exceptions, because they
   are life, not lures: Mom breathing and blinking, Pipa blinking, the soft background music, the loading spinner,
   and the text-free rotate animation. The oven's glow and steam while baking are the result of her putting the
   pizza in. (Round 4 removed: the play button's endless pulse, the recipe card's endless bobbing, the bins' endless
   wiggle, the done button's endless pulse, the oven's endless "tap me" hop, stars around Pipa's head at every step.)
6. **No ads, no purchases, no links out, no data collection.** Nothing is sent anywhere. The only thing stored is a
   local run counter per recipe (`localStorage`, `cooking.runs.<id>`), used only to stop Mom's automatic demos after
   the first two runs; it is never shown.

## Landscape layout
- **World:** always **1080 units high**. The width follows the screen: 1440 at 4:3, 1920 at 16:9, 2400 at 20:9
  (the main device). `main.ts`: Scale `EXPAND` on a 1440x1080 base (`BASE_W/BASE_H` in `layout.ts`).
- **Positions are never absolute 1920 numbers.** Everything is in ONE table, `src/core/stage.ts`
  (`getStage(layout)`), placed relative to the side margins (`m = 4%` of the width) and the center:
  `[ this step's ingredients / bins ] [ the dish on its board ] [ Mom (and little Pipa) ]`. Scenes and steps read
  `ctx.stage.*`. To change the layout, change the table, not the steps.
- **Content scale `k`** (`layout.k`): 1 on every screen 16:9 and wider. Only screens narrower than 16:9
  (4:3 tablets, physically much bigger) show everything at `k < 1` (0.75 at 4:3), because the densest step
  (bins + full board + character at 75%) needs 1766 units between the side strips (`FIT_W`).
  `layout.Y(v)` maps a y of the 1080 design band to the world, scaled by k around the palm-strip line, so on
  those screens things still stand on the counter.
- **Background** `bg-kitchen-landscape` (2400x1080): anchored bottom-center at native height, so it is only
  cropped at the sides (16:9, 4:3); at 20:9 it fits exactly at scale 1. If a screen is ever wider than 2400 it grows
  uniformly just enough to cover the width, still bottom-anchored (`addBackground`).
- **Sizes** (the old "uniform art scale" rule is cancelled): images are shown at native size x `k`, except where
  the stage table gives an item its own scale: Mom (the right column's scale, 75-100% of native: 100% at 20:9,
  75% at 16:9), the oven (75-90%, filling the room left of the board), the topping bins (as big as the left column
  allows, about 213 units at 16:9 and 20:9), the home button (85% = 204 units), the play button (1.4x, rasterized
  at 1.4x: `raster` in assets.ts), Pipa (0.4 small, 0.62 big, x k), Mom's demo hands (point 0.62, roll/spread/grab
  0.66, sprinkle 1.1, x k: `HAND_SCALE` in core/hand.ts, from the art agent's checked scenes).
  The pizza (dish radius 350) and the board are always at native size x k.
- **Composition per step:** Mom stands on the right for the whole recipe, her 800x800 frame's bottom on the screen
  bottom (it is cut at her waist, so she never jumps: her happy move is a stretch and sway from the waist).
  On 16:9 and wider, Pipa sits small on the counter between the pizza and Mom (never over the pizza itself or Mom's
  face; 0.362 at 16:9 where the gap is narrow). On 4:3 Pipa only comes for feeding. Roll: the pin rests upright in the
  left column and lies across the finger while rolling. Spread: bowl left. Sprinkle: shaker left. Decorate: 6 bins in
  2 columns on the left, done button above Mom's head. Bake: the oven left of the dish, side by side.
  Feed: Pipa moves to the board's right rim, big (0.62); where that would cover Mom's face (16:9, 4:3) Mom steps right
  (`feedMomShift`, her face stays on screen). Slices are dragged right to Pipa's mouth (tip first).
- **Mom's pointing arm** stays in its drawn pose (pointing at the pizza) on phones. Only on 4:3, where Pipa is not on
  screen, it turns (max 20 degrees around the shoulder) toward the oven while baking. On the phone that aim passed over
  Pipa's head, so there the demo hand points at the oven instead. Feeding: -18 degrees (tucked behind Pipa); finale: +55.
- **Orientation:** manifest `orientation: 'landscape'`; the play button asks for fullscreen + `lock('landscape')`
  (works only in fullscreen / installed PWA). Otherwise `core/orientation.ts` watches the size of `#game`: when it
  is taller than wide it shows `#rotate` (index.html: a phone turning, with a round arrow, CSS animation), pauses
  every running scene except Boot (step timers, idle clocks, tweens, delayed calls) and all sounds, and first emits
  `ORIENTATION_PAUSE` so RecipeScene drops the current gesture gently (`Step.cancelGesture()`). Back in landscape it
  resumes exactly where it was and emits `ORIENTATION_RESUME`. Title and Home rebuild at the new size
  (`keepLayoutOnResize(..., { relayout: true })`); the recipe keeps its layout and the camera zooms if the size changed.

## Project layout
```
index.html                 page shell (no scroll/zoom/pull-to-refresh/callout/selection) + #rotate screen
vite.config.ts             base path /kids-cooking-game/, dev server (--host), PWA (landscape manifest), asset-manifest plugin
.github/workflows/deploy.yml  builds and publishes to GitHub Pages on every push to master
README.md, ASSET-LICENSES.md  public description and the asset licenses (the repo is public)
plugins/asset-manifest.ts  virtual:asset-manifest = the asset files that exist on disk
scripts/make-icons.mjs     regenerates the temporary PWA icons (public/icons)
scripts/harness.js         test harness for the automated Chrome (see "Testing notes")
scripts/bake-webp.js       pre-renders the SVGs to WebP, run inside the game page (see "Pre-rendered art")
public/assets/images/      SVG art (the source, from the art agent) + webp/ (pre-rendered, committed)
public/assets/sounds/      voice/ (Mom, 23 lines), music/ (1 loop), sfx/ (12 effects incl. the bake loop)
src/main.ts                Phaser config (3 touch pointers), gesture blocking, lifecycle, orientation guard, SW
src/core/
  assets.ts                THE ASSET CONTRACT: image keys + native sizes, sound keys, ART geometry (Mom pivots, hand anchors)
  placeholders.ts          code-drawn stand-ins for missing images (a generic one for most); sauce brush; opaqueBounds
  svgRaster.ts             SVG -> texture at native size, aspect kept; WebP -> texture
  audio.ts                 all sound on one Web Audio context: loading, levels, Mom's voice queue, music, bake loop, holds
  sfx.ts                   sfx(): plays an effect if loaded, silent otherwise (relative volume); sfxThen(): chain
  device.ts                browser-gesture blocking, wake lock, audio resume (background return, every touch)
  layout.ts                world size, k, Y(), no-touch zones, resize handling, background
  stage.ts                 THE LAYOUT TABLE: every position and per-item scale, relative to margins and center
  orientation.ts           landscape guard: rotate screen, pause/resume
  fx.ts                    burst / puff / stars particles, boing squash
  hand.ts                  MomHandView: Mom's 5 demo hands, keyframed motions (demo / looping hint), follow (help), props
  ui.ts                    iconButton (padded hit circle, fires on press, optional two-tap confirm)
src/recipes/
  types.ts                 Recipe + StepDef + CharacterDef types (one params type per step type)
  pizza.ts                 the pizza recipe, pure data
  index.ts                 RECIPES list shown on the home screen
src/steps/
  Step.ts                  base: intro (demo + voice), idle timer, hint, Mom's help, finger ownership, miss streak, cancelGesture
  Mom.ts                   Mom: 12 layers, breathing, blink, look-at, lip movement from the voice, cheer, arm aim
  Character.ts             Pipa: layers, blink, look-at, moods (expect, chew, party), small beside Mom / big for feeding
  Dish.ts                  the food carried between steps; capture() flattens it into one texture
  slices.ts                cuts the captured pizza into wedges (2D canvas), stock-art fallback
  registry.ts              step type name -> implementation
  RollStep / SpreadStep / SprinkleStep / DecorateStep / BakeStep / FeedStep
src/scenes/
  BootScene                loads the title's 4 images, starts Title, loads the rest + all sounds in the background
  TitleScene               big play button (audio resume, fullscreen + landscape lock, wake lock, music, vo-welcome)
  HomeScene                one card per recipe, Mom (and Pipa); waits for the art before starting a recipe
  RecipeScene              runs any recipe's steps in order; board under the dish; Mom, Pipa, Mom's hand; demo counter; home button
```

## Recipes are data
A recipe is `{ id, card, board, character, steps: StepDef[] }`. Each step names a reusable type and its params.
Step types: `roll`, `spread`, `sprinkle`, `decorate`, `bake`, `feed`. `character` lists Pipa's layer keys
(body, eyes x4, mouth x3). Mom is the same for every recipe (fixed keys in `steps/Mom.ts`).
To add a recipe: create `src/recipes/<name>.ts`, add it to `RECIPES`, and add any new image keys
to the contract in `src/core/assets.ts` together with a placeholder in `placeholders.ts`.
A new step type means a new `Step` subclass + a `StepDef` variant + a registry entry + its anchors in `stage.ts`.
Every step subclass must implement `demo()` (Mom's hand motion for the current phase, max 2.5 s, never changing the
dish: anything carried is a see-through prop) and `autoFinish()` (Mom's help: her hand visibly does it, via
`hand.follow` or `hand.play`), set `stepLine` (its voice line, if any), call `poke()` on real progress, and treat
`onUp(..., cancelled)` as "put it back gently". `showHint()` defaults to looping `demo()`.
Voice lines per event: Title tap vo-welcome; card vo-pick-pizza; demo start vo-watch-me + the step line
(vo-roll / vo-sauce / vo-cheese / vo-toppings / vo-feed), demo end vo-your-turn; no demo: the step line only;
step done: a random vo-praise-1..7 (never the same twice in a row); decorate done-hint vo-done-hint; pizza in the oven
vo-oven, half-way vo-baking, ding vo-ready; finale vo-finale, then the cheer effect, then vo-bye, then home.
One line at a time, never overlapping; a line whose moment has passed is dropped (core/audio.ts `Voice`).

The child's own pizza: at the end of decorating, `Dish.capture()` renders the dish (dough, sauce,
cheese, toppings where she put them) into one texture (`pizza-made`). That exact pizza goes into
the oven, is seen through the window, and is cut into the slices she feeds. `pizza-slice` is only a
fallback if the capture fails.

## Asset contract (another agent produces the art and sounds)
- Images: `public/assets/images/<key>.svg` (the source) and, pre-rendered, `public/assets/images/webp/<key>.webp`.
  Sounds: `public/assets/sounds/{voice,music,sfx}/<key>.ogg` (and/or `.mp3`; the key is the file name).
- Image keys (52), all delivered (style B, from `../cooking-game-assets/images-b`; see its README-mom.md, CRITIQUE.md
  and the scene composer `scenes.js`, the reference for positions and scales):
  bg-kitchen-landscape, dough-ball, dough-flat, rolling-pin, sauce-bowl, sauce-blob, cheese-shaker, cheese-shred,
  topping-tomato, topping-olive, topping-mushroom, topping-corn, topping-pepper, topping-onion, topping-bin,
  tray, pizza-board, oven-inside, oven-closed, oven-open, pizza-slice,
  character-body, character-eyes-open / -blink / -surprised / -happy, character-mouth-closed / -open / -chew (Pipa),
  **mom (12 layers, 800x800):** mom-arm-right, mom-body, mom-head, mom-hair, mom-eyes-open / -blink / -happy /
  -surprised, mom-mouth-smile / -talk / -open, mom-arm-left,
  **mom-hand (5, 400x400):** mom-hand-point, mom-hand-roll, mom-hand-spread, mom-hand-sprinkle, mom-hand-grab,
  **pizza-board** (the board under the dish; `tray` is an identical older copy),
  hand-hint (the old single hand, still in the contract, not shown), star, btn-play, btn-home, btn-done, card-pizza.
- Sound keys: effects (12, `sfx/`): tap, pop, squish, sprinkle, whoosh, oven-ding, munch, cheer, cheer-jingle,
  star, complete (not used yet), bake (the loop). Voice (23, `voice/`, English): vo-welcome, vo-pick-pizza,
  vo-watch-me, vo-your-turn, vo-roll, vo-sauce, vo-cheese, vo-toppings, vo-done-hint, vo-oven, vo-baking, vo-ready,
  vo-feed, vo-help, vo-praise-1..7, vo-finale, vo-bye. Music (`music/`): music-main (a gapless 256-beat loop).
- Levels (core/audio.ts `LEVEL`, from the sound agent's MIXING.md with the owner's numbers): voice 1.0; effects 0.65
  (munch 1.0, star 0.6, complete 0.7); bake loop 0.4 (300 ms fades); music 0.22, ducked to 0.11 while Mom speaks,
  back over 0.5 s. Music and the bake loop are AudioBufferSourceNode loops. No mute button.
- Art conventions the code assumes:
  - viewBox = native size in world units (the world is 1080 high).
  - `bg-kitchen-landscape`: 2400x1080; the counter must stay plain across the whole width (it is bottom-anchored).
  - Mom: every layer shares the 800x800 frame; y 800 = her waist (the screen bottom); body centre x 500. Stack back
    to front: arm-right, body, head, hair, eyes, mouth, arm-left. Pivots: arm-left (350, 505), arm-right (650, 505);
    the pointing fingertip is at (37, 378). Her face (hair to chin) x 330-670, y 40-420 (kept clear of stars and Pipa).
  - Demo-hand anchors (the point placed on the target): point (100,100) fingertip, roll (140,140) palm, spread
    (110,250) spoon bowl, sprinkle (125,115) pinch, grab (110,150) carried item's centre (`ART.momHands`).
  - Pipa's layers share a 600x700 frame (opaque x 30-574, feet y 684); the mouth is measured from `character-mouth-open`.
  - `topping-bin` 240x240: the topping (140) is drawn on it at (120,112).
  - `tray` is the round pizza board under the dough (not a topping bin; that is `topping-bin`).
  - `pizza-slice`: crust at the top, tip pointing down.
  - `cheese-shaker`: holes at the top (it is turned upside down while shaking).
  - `rolling-pin`: drawn lying down; the game stands it upright (rotated 90 degrees) while it rests.
  - Oven layers share a 700x800 frame (opaque x 34-664, from y 20); the window hole is x 150-550, y 320-610; the pizza
    sits at (350, 480), diameter about 320.
  - `sauce-blob`: its silhouette becomes a solid sauce brush (outline removed).
- **Missing files are fine:** a placeholder is drawn in code and a missing sound is silent. Swapping in
  real assets is only copying files into those folders. The dev server reloads by itself. For the
  production/PWA build, run `npm run build` again, since the asset list is fixed at build time.
- **Pre-rendered art (WebP).** The style-B SVGs use filters (paper texture, torn edges) that took ~2.6 s to rasterize
  at load (desktop Chrome; a phone is slower). `scripts/bake-webp.js` runs inside the game page on the dev server and
  renders each SVG exactly like the game does, at its texture size (native x `raster`), to `images/webp/<key>.webp`
  (lossless when that is under 64 KB, else lossy 0.92), recording the SVG's sha1 in `images/webp/sources.json`.
  The build uses a WebP only if that sha1 matches the SVG on disk; otherwise it warns and the game rasterizes the SVG.
  **After changing or adding an SVG, re-run the bake** (open the dev page, then in the JS tool:
  `eval(await (await fetch('scripts/bake-webp.js')).text()); await __bakeWebp(); await __compareWebp();`),
  check the pixel diff (small items about 0.1/255, large lossy ones mean at most 3.5/255), commit `images/webp/`.
  Nothing in the build or in GitHub Actions runs the bake (no extra tool or dependency). SVGs with a valid WebP are
  not precached by the service worker.
- The browser console lists which placeholders and silent sounds are in use (`[assets]` lines).

## Working rules
- Work on a branch. **The repo is public on GitHub** (remote `origin`, see "Deployment").
  **Every push needs its own explicit approval message from the owner, every time.** An approval covers
  only the round it was given in. Never push, and never merge to master, without it.
- Nothing personal in the repo: no local IPs, no Windows paths with user names, no e-mail addresses,
  phone numbers, people's names, secrets or keys, in files or in commit messages. Commits use the
  GitHub noreply address set in the repo's local git config (never change the global config).
- `git add` explicit paths only. Never `git add .` or `git add -A`. For assets, the folder paths
  `public/assets/images` and `public/assets/sounds` are allowed.
- Commit messages in Hebrew, written to a file and committed with `git commit -F <file>`.
- After each significant step, `npm run typecheck` and `npm run build` must both pass with no errors, then commit.
- Don't install libraries beyond what is needed.
- Stay inside this folder. `../cooking-game-assets` may be READ and copied FROM, never written,
  changed or deleted (another agent works there). Use `images/` and top-level `sounds/*.ogg`,
  not `images-v1/`, `sounds-v1/` or `sounds/voice/`, unless the owner says otherwise.
  Its STYLE.md "Landscape layout" section is a starting point only; the owner's instructions won over it
  (no top bar, full-size pizza instead of 0.75x, background never cropped at the top).
- Rollback points: tags `rollback-start` (first commit), `rollback-pre-assets` (before the real assets),
  `rollback-pre-landscape` (end of round 1, portrait), `v0.2-landscape` (end of round 2, landscape),
  `rollback-pre-mom` (master before round 4, the Mom round).
- Temporary files go in `.tmp/` inside this folder (git-ignored), never outside it.
- This computer's memory is limited: one automated browser only, no parallel runs, no heavy sub-agents, and at least
  2 GB free before running the harness.

## Running
- Everything is served under the sub-path `/kids-cooking-game/` (Vite `base`), in dev and preview too.
  Code builds URLs from `import.meta.env.BASE_URL` (or page-relative paths), never from a leading `/`.
- `npm run dev`: dev server on the LAN (`--host`, port 5173). Open `http://<computer's LAN address>:5173/kids-cooking-game/` on the phone.
- Dev only: `?step=N` (0-based) jumps straight to step N of the recipe.
- Mom's demos show only the first two times a recipe starts on a device (`localStorage` key `cooking.runs.pizza`).
  To see them again: `localStorage.removeItem('cooking.runs.pizza')` in the console (the harness: `__demos(true)`).
- Load time is logged: `[assets] title images ready in N ms` and `all images ready N ms after boot` (`window.__loadTiming`).
- `npm run build`, `npm run preview`: production build (preview: `http://localhost:4173/kids-cooking-game/`).
  The service worker and the screen wake lock only work on HTTPS or localhost, so over plain LAN http the
  screen may still dim. The HTTPS deployment (see "Deployment") is where the PWA is installed from.

## Deployment
- Public URL: **https://yonatan1feldman-prog.github.io/kids-cooking-game/** (GitHub Pages, public repo
  `yonatan1feldman-prog/kids-cooking-game`, Pages source = GitHub Actions).
- How: every push to `master` runs `.github/workflows/deploy.yml` (npm ci, npm run build, then the official
  `actions/upload-pages-artifact` + `actions/deploy-pages`). Watch it with `gh run watch`. Nothing else to do.
- **A push is a deployment to the child's phone. Every push needs a separate, explicit approval from the owner.**
  Only `master` and tags are pushed; work branches stay local.
- `gh` (GitHub CLI) is installed at `C:\Program Files\GitHub CLI\gh.exe` and logged in; in an old shell it may
  not be on PATH, call it by its full path.
- After a deploy, check: the URL, `manifest.webmanifest` and `sw.js` return 200, every file in `public/assets`
  returns 200, the game loads with no console errors and no placeholders except known missing art, and the
  service worker registers. The installed app updates itself (autoUpdate) on its next start after a deploy.
- The `github-pages` environment only lets `master` deploy (a branch policy; it was set to `main` at first and
  the first run was rejected). Git pushes use gh as the credential helper for that one command:
  `git -c credential.helper= -c 'credential.helper=!"C:/Program Files/GitHub CLI/gh.exe" auth git-credential' push origin master`.
- Harness against the deployed build: `scripts/harness.js` is not deployed; load it from
  `https://raw.githubusercontent.com/yonatan1feldman-prog/kids-cooking-game/master/scripts/harness.js`. The build
  minifies class names, so first override `__step` to read the step type from the recipe
  (`sc.recipe.steps.find(s => s.params === sc.step.params).type` -> 'RollStep' etc.). Start `__auditRun` without
  awaiting it and read the result from a window variable in later short calls (45 s tool limit). A tab that stays
  hidden for minutes gets its timers throttled until nothing moves: open a fresh tab.

## Testing notes for agents
- Use `scripts/harness.js` (served by the dev server). Details and pitfalls: Handoff notes, section 1.
- In an automated Chrome whose window is hidden, requestAnimationFrame doesn't run. The harness drives frames
  with `game.loop.step(t)` and replaces `Date.now` with the same virtual clock BEFORE any scene starts
  (the TweenManager uses its own `Date.now` clock and freezes if it runs behind).
- Synthetic `mouseup` must be dispatched on the canvas (not on window) for Phaser to see it.
- Desktop Chrome has no touch listeners. The harness calls `game.input.onTouchStart/onTouchMove/onTouchEnd/
  onTouchCancel` with fake events.
- Nothing replaces a real finger on a real phone. Always list what still needs a hands-on check.
- **Audio in the automated Chrome:** synthetic touches are not a user gesture, so the AudioContext stays suspended
  and voice lines only "end" by their safety timer. One real click (the computer tool's left_click on the play button)
  unlocks it for the rest of that page's life. For a voice log, play in real time (`__real`), see Handoff notes.

## Handoff notes (written for the next agent; round 4 on top, rounds 2-3 below still hold)

### 0. Round 4 (cooking with Mom): what changed and how to check it
State: branch `round-4-mom` (from `master` at tag `rollback-pre-mom`), not merged, not pushed. Commits: stage 1 art +
WebP, stage 2 Mom / Pipa / demos / voice manager, stage 3 sound files, stage 4 wellbeing rules, then this AGENTS update.
Screenshots of every step, with demos, at 20:9 and 4:3: `docs/screenshots-round4/` (git-ignored; `__tour`).
- **Load time** (desktop Chrome, this computer): SVGs rasterized at load took 2581 ms (images) / 3066 ms (to the title).
  With the WebP files and the title loading only its 4 images first: production build, first visit 1474 ms to the
  title (963 ms images); from the service worker cache 1.8 s (the rest is texture creation / GPU upload of ~20
  megapixels in the hidden automated tab). Since then the title waits only for bg, play button, star and card.
- **Voice** (`core/audio.ts`): `voice.say(key, {queue, ttlMs, valid, done})`. Default: waits for the current line;
  `queue:false` cuts it (50 ms fade). A waiting line is dropped after `ttlMs` (2.5 s) or when `valid()` is false, so a
  line never plays late. `voice.praise()` picks vo-praise-1..7, never the same twice in a row. The analyser level
  drives Mom's mouth. A real-time safety timer ends a line if the context can't run (audio locked), so Mom never
  "talks" forever. `holdAudio('rotate'|'hidden', on)` stops the line, suspends the context, resumes after.
- **Demos** (`Step.intro`, `Step.demo()`): the first two runs per device (`cooking.runs.<id>`). A scene-level
  POINTER_DOWN ends the demo (the step's own handler still gets the touch). `onDemoEnd()` / `HandMotion.onStop` undo
  what the demo hid (the roll demo hides the real pin while Mom's prop pin rolls).
- **Help** (`Step.help()` -> vo-help + `autoFinish()`): every step's autoFinish shows Mom's hand doing it
  (`hand.follow(kind, () => point)` or `hand.play`). A whole recipe with no touches ends at Home (Mom helped 7 times).
- **Stage table additions** (`core/stage.ts`): `mom`, `momFace`, `pet` (null below 1700 wide), `feedPet`,
  `feedMomShift`, `feedPetLeft`. Pipa's small scale shrinks to fit between the pizza and Mom's face (0.362 at 16:9).
  The oven is at most 90% and at Y(612): the new oven art is opaque from y 20, and at 95% its top touched the home
  button's touch area at 20:9.
- **Harness additions** (`scripts/harness.js`): `__demos(on)`, `__waitDemo()`, `__demoAt(w,h,step,ms)` (stops ms into
  that step's demo), `__real(ms)` (real-time stepping), `__voReport()`, `__fullRun(demos)` (voice log of a real-time
  run), `__saveShot(name)` + `__tour(w,h,tag)` (PNG of the game canvas into docs/screenshots-round4 through the dev
  server's `/__dev/shot`). The audit also checks Mom (without her arms) and Pipa (not over the pizza, not over
  Mom's face, not in the strips). `__gesture` waits 5.7 s after the oven drop (bake is 5 s now).
- **Checked in round 4** (automated Chrome): audit clean at 20:9, 16:9, 4:3 in every step; finale stars never over
  a face (0 of 17 at each ratio); full recipe with and without demos, voice logs without overlaps or praise repeats;
  a touch mid-demo ends it and counts (roll progress 0.55 from that drag); rotation mid-demo and mid-line (line cut,
  scene paused, idle clock frozen, resumes); background (line dropped, context suspended, resumes); Mom's help;
  capture and slices (`pizza-slice-made-*`, tint FFD49A); music 0.22 -> 0.11 while speaking -> 0.22; bake loop 0.4.
- **Hidden-tab artifact:** in the automated Chrome, `onended` of a line can arrive late (a 0.9 s line logged as 3 s),
  so logged durations are longer than the files. The order and the no-overlap check are what count.

State: branch `round-2-landscape` (from `round-1-pizza`), full pizza recipe in landscape, locked, with a rotate screen.
Round 3 (deploy): merged to `master` (tag `v0.2-landscape`), served under `/kids-cooking-game/`, published to
GitHub Pages (see "Deployment"). New work starts on a new branch from `master`.
Rollback tags: `rollback-start`, `rollback-pre-assets`, `rollback-pre-landscape` (the portrait game).
Screenshots of the last full run at 20:9, 16:9 and 4:3 (every step, plus the rotate screen) are in
`docs/screenshots-round2/` (git-ignored, local only). `docs/screenshots-round1/` are the old portrait references.

### 1. Test harness (`scripts/harness.js`, automated Chrome, no real finger)
The Chrome window used by the browser tools is hidden, so `requestAnimationFrame` never fires and the game only
moves when the harness steps it. Right after navigating to `http://localhost:5173/kids-cooking-game/`, run (JS tool):
```js
eval(await (await fetch('scripts/harness.js')).text());
await __setup(900, 405);   // container size in CSS px = the ratio to emulate: 900x405 = 20:9, 720x405 = 16:9, 640x480 = 4:3
```
`__setup` shrinks `#game`, installs the virtual clock (once), waits (stepping frames) until Boot has loaded the art and
started Title, then restarts at Title. Keep the container inside the viewport (its height changes between sessions).
Helpers (all coordinates are WORLD units; `__S` converts to CSS px):
- `__tick(ms)`, `__run(ms)`: advance virtual time. `__touch(type,id,x,y)`, `__tap(x,y)`, `__drag(pts, {hold})`.
- `__R()` = the Recipe scene (`__R().step`, `__R().ctx.dish`, `.character`, `.stage`, `.hand`), `__step()` = step class name.
- `__start()`: Title -> Home -> Recipe. `__gesture()`: one round of whatever the current step expects.
  `__to('FeedStep')`: plays until that step is current.
- `__audit()`: checks the current step: nothing cut off (opaque art extents), no touch area in the no-touch zones,
  no two items overlapping (visuals, and touch areas except the dish itself). `__auditRun(w, h)`: a whole recipe at
  that size, auditing every step. All three ratios returned no problems at the end of round 2.
- `__shotAt(w, h, what)`: screenshot tour, call in order 'title', 'home', 'roll', 'spread', 'sprinkle', 'decorate',
  'bake', 'feed' and take a screenshot after each (mid-gesture states keep the finger down).
- Rotation: set `#game` to a portrait size and `window.dispatchEvent(new Event('resize'))` (the orientation guard also
  uses a ResizeObserver, which may not fire in a hidden tab).
Timings (virtual ms): Title tap -> Home 1300; card tap -> Recipe ready 1600; between steps 800 + the step's ending
(roll ~1500, spread 1800, sprinkle 1800, decorate 2500 after done, bake: drag 480 + bake 3500 -> tap oven -> 2600,
feed 1200 per slice, party 3800 -> Home). Idle: hint at 5000 (decorate 15000), auto-finish 10000 later (decorate 30000).
Harness pitfalls:
- The JS tool call times out at 45 s (the script keeps running in the page). A whole recipe takes ~3 s real time.
- Any source edit (including `scripts/harness.js`) makes Vite reload the page: navigate again and re-run `eval` + `__setup`.
- `__yield` uses a MessageChannel (hidden-tab `setTimeout` is throttled to 1 s); each message releases every waiter and a
  timer backs it up, because a lost message once stalled a loop.
- While loading, Boot's status is LOADING and `scene.isActive('Boot')` is false: never restart scenes before Title is active.
- Screenshots: the zoom tool's coordinate frame is NOT CSS px. Region = CSS rect x (screenshot frame width / innerWidth)
  (it was 1456/1536: 20:9 -> [0,0,853,384], 16:9 -> [0,0,683,384], 4:3 -> [0,0,607,455]). A too-large region shows bands.
- The browser tools sometimes answer "Internal error" or time out without running the script. Check `__T` / `__step()` and retry.

### 2. Layout: where positions live
- `src/core/layout.ts`: `BASE_W/BASE_H` (1440x1080 EXPAND base), `PALM_ZONE` 0.08, `SIDE_ZONE` 0.04, `FIT_W` 1766,
  `getLayout()` -> `W, H, cx, cy, m, k, Y()`, `inNoTouchZone()`, `keepLayoutOnResize()`, `addBackground()`.
- `src/core/stage.ts`: the ONLY place with positions: home button, dish home, left-column spots (pin, bowl, shaker),
  bins (2 columns packed from the bottom, square cells, their 30-unit touch reach kept out of the strips and away from
  the home button), done button (above the character), oven (left of the board, scale 0.75-0.95), character (right
  column, feet near the bottom, scale 0.75-1.0 from the spare width), card grid, play button.
  Numbers there that describe the art (board 786 wide, oven body 628, character frame 600x700) are opaque extents.
- Relative distances inside steps (hit radii, lift offsets, particle sizes) are `N * k` and orientation-independent.
- A mid-scene resize doesn't re-layout the recipe: `keepLayoutOnResize` zooms the camera so the old layout stays
  visible. Title and Home rebuild themselves (they have no state).

### 3. Pizza capture and slicing (`steps/Dish.ts`, `steps/slices.ts`, `steps/FeedStep.ts`)
- `Dish.capture()` (called by DecorateStep after the done tap plus 450 ms, so the last pops have landed):
  it creates a DynamicTexture of size `2R + 24k`, temporarily moves the dish container to (0,0) at scale 1, calls
  `dt.draw(dish, size/2, size/2)` and `dt.render()`, and restores the position. Then `dt.snapshot(cb)` returns an
  HTMLImageElement, which is added as texture `pizza-made`. The layers are destroyed and the dish becomes one Image.
  `dish.madeImage` keeps the HTMLImageElement for slicing. The snapshot is NOT flipped (checked visually).
  Verified again in round 2 at all three ratios: slices are `pizza-slice-made-*`, cut from the child's pizza.
- Sensitive spots:
  - The dish must not be tweening (position or scale) at capture time. (In landscape the dish no longer moves on
    entering decorate, but the tween to `decorateDish` is still there if the stage table ever moves it.)
  - Anything added to the dish after the capture is lost (the capture is the truth from then on).
  - The capture has a 2 s safety timeout and resolves `false` on any error. FeedStep then uses `stockSlices`
    (`pizza-slice` art at scale k, tip-down art rotated to point inward).
  - The capture is taken BEFORE baking, so baking only tints `dish.base`. FeedStep copies
    `dish.base.tintTopLeft` onto every slice. Any future baked look (not only a tint) must be applied to the slices too.
  - The texture is in GAME pixels (it already includes k): show it at scale 1, not `art()`.
- `cutSlices(img, n, outline)`: for each wedge (mid-angle -90 + i*360/n) it makes a canvas the size of the wedge's
  bounding box, clips an arc path, draws the image and strokes the cut edges in ink (2x the outline width,
  half of which falls inside the clip). The origin is the apex (the pizza center). `restAngle` is 0 for real slices.
  The grab point is `sliceCenter()` (0.6 R along the mid-angle).
- Carrying (landscape): `FeedStep.carryPose()` puts the slice's middle under the finger and its tip (the origin) ahead of
  it, pointing at the mouth: angle = `restAngle + dir + 180 - midAngle`. A drop counts if the FINGER or the tip is near
  the mouth, or anywhere right of Pipa's opaque left edge (`stage.feedPetLeft`).
- The sauce is a RenderTexture inside the dish. Its stamps are recorded, and on `Renderer.Events.RESTORE_WEBGL`
  they are replayed (context loss when switching apps). After the capture it no longer matters.

### 4. Finger ownership and idle clocks (`steps/Step.ts`, `core/ui.ts`)
- Config: `input.activePointers: 3`. With 1, a resting palm grabs the only touch slot and every real touch is ignored.
- `Step.onDown` claims `owner = p` if nobody owns the step, the press is not in a no-touch zone and not on an
  interactive object. `onMove`/`onUp` only pass the owner through. The owner is cleared on its up / up-outside:
  inside `onUp` when the step registered one, and always by a `queueMicrotask` safety release registered on
  the first `onDown` (it runs after the step's own handlers). Steps get `onUp(p, cancelled)`, where
  `cancelled = pointer.wasCanceled || released outside the canvas` means "put it back gently".
- `Step.cancelGesture()` (new): calls every registered up handler with `cancelled = true` and releases the owner. Used when
  the device turns to portrait mid-gesture, so nothing stays in mid-air if the finger lifts while the game is covered.
- `iconButton` ignores presses while any other pointer is down (`otherPointerDown`), plus the no-touch zones.
  It fires on press by default. `fireOn:'up'` (play button only) fires on the release of the same pointer.
  `confirm: true` (home button): first press arms it (x1.4, wobble, 2 s timer), a second press fires. `hitPad` is in
  world units; `scale` overrides the image scale.
- Idle: `hintAfterMs` (5000) and `autoAfterHintMs` (10000) are per-step fields. DecorateStep sets 15000 / 15000.
  `update()` adds delta only while `idleOn`, and not while the owner finger is down (unless a hint is already showing).
  `poke()` = real progress (resets the clock, hides the hand). `setIdle(false)` for watch-only phases (baking).
  `miss()` x3 shows the hint immediately. `hit()` resets the streak.
  `autoFinish()` sets `auto` (input ignored). Multi-phase steps call `resumeAfterAuto()` to hand control back (BakeStep).
  While the rotate screen is up, the scene is paused, so none of these clocks run (checked: idle stayed 0 over 20 s).
- Mom's hand (`core/hand.ts`) is placed by its anchor (ART.momHands) and glows on the target only as a hint (not in
  the demo). `stop()` kills its tweens and runs the motion's `onStop`. `hand.position` is the anchor (Mom and Pipa watch it).

### 5. Phaser 4 pitfalls met here that the official skills don't mention
- The TweenManager keeps its own clock from `Date.now()` (`getDelta` in TweenManager.js), not the game loop's time.
  If `game.loop.step()` is driven with virtual time, tweens freeze. If `Date.now` is replaced after a TweenManager
  started and the new clock runs behind, the delta is negative and tweens stay frozen. Replace it once, before any scene starts.
  After a long scene pause its lag smoothing (`maxLag` 500 ms) turns the gap into one small step: tweens resume cleanly.
- Touch cancel does not have its own scene event: it arrives as `POINTER_UP` with `pointer.wasCanceled = true`.
  A release outside the canvas arrives as `POINTER_UP_OUTSIDE`. `GAME_OUT` is mouse-only and not useful for touch.
- A synthetic `mouseup` on `window` is ignored. Dispatch it on the canvas. Desktop Chrome registers no touch
  listeners, so call `game.input.onTouchStart/Move/End/Cancel` directly to simulate touches.
- `StampConfig` has `tint` but no tint mode. To paint a flat-colored silhouette (the sauce brush), recolor
  on a 2D canvas (`globalCompositeOperation = 'source-in'`) and `textures.addCanvas`.
- `DynamicTexture.draw(container, x, y)` with the container at (0,0) and scale 1 renders the container and all nested
  children, including a RenderTexture child. `dt.render()` must be called before `snapshot()`.
- Graphics `generateTexture` and `textures.addCanvas` textures expose a canvas via `getSourceImage()`. That is how
  `opaqueBounds()` measures the mouth position from the art (no GPU readback).
- `getBounds()` of an image inside a container already includes the container's transform (world bounds).
- `sound.play()` returns false when it can't play (e.g. still locked). For a chain like jingle -> cheer, use
  `sound.add` + `once('complete')`, with a timer fallback (`sfxThen`).
- Browser rule (not Phaser): on Android, fullscreen, AudioContext.resume, orientation lock and wake lock need a user
  activation. `touchend`/`pointerup` gives one; `pointerdown` on touch does not. Hence the play button fires on release.
  `screen.orientation.lock()` only works in fullscreen or an installed PWA; elsewhere the rotate screen does the job.
- Scale EXPAND: after the parent element changes size, dispatch a window `resize` event; the polling alone didn't catch it.
- SVGs are not loaded with `this.load.svg`. `core/svgRaster.ts` fetches, sets width and height to the native viewBox size,
  rasterizes to a canvas and calls `textures.addCanvas`. This gives exact native-size textures and a clean fallback.

### 6. Open points after round 4 (round 2's list follows, updated)
- **Needs a real finger and a real ear:** Mom's voice level against the music and effects on the phone speaker;
  whether the lip movement reads as talking; whether "Now you try!" arriving after the step line feels natural;
  whether the demo is slow enough to follow and a 5-year-old waits for it or taps through it (both are fine);
  the finale order (finale line, cheer, bye) and its length; the music loop over a long session (no click at the
  seam); sound after a real phone call / app switch / screen lock; the service worker's 5.85 MB first download on
  mobile data; whether the praise lines vary enough.
- 4:3 feeding: Mom steps right and her waving arm leaves the screen (her face stays). The art agent's 4:3 feed shot
  had her fully visible with Pipa in front of her body; that version covered her face at our 4:3 sizes.
- `sfx/complete.ogg` is delivered but not used (a 2.8 s jingle would collide with the praise line).
- The step-completion star burst (fx.stars from the dish) is not face-aware; only the finale is.
- Title screen: the art agent's reference shows Mom, Pipa and a baked pizza on the title. The game's title stays
  plain (background + play button) so it can appear after 4 images; Mom and Pipa appear from the home screen on.

### 6b. Open points after round 2
- **Needs a real finger on the real phone (20:9):** the thumb strips (4%) and the palm strip in real two-handed play;
  whether 213-unit bins (~1.3 cm) and the 204-unit home button are easy for her; the two-tap home button (does she arm it
  by accident, does an adult find it); dragging a slice to the right with the tip leading; rolling with the pin lying
  across the finger; the rotate screen and resuming after a real rotation (browsers fire touchcancel differently);
  fullscreen + landscape lock from the play button; the look of the eyes following the finger.
- **4:3 tablets** show everything at k = 0.75 (pizza radius 262 units, bins ~160, home button 153, character 56% of
  native). Physically they are still bigger than on the phone (a tablet's 1080 units are ~15 cm), but below the
  200-unit rule in world units. If that matters, the fix is to give tablets a different composition, not to shrink more.
- **16:9** is exactly the fit width: the character is at 75%, 25-unit gaps between the columns. Nothing to spare.
- The rolling pin's shadow is drawn for a lying pin; standing upright at rest, its shadow is at its side.
- The recipe screen doesn't re-layout on a size change (camera zoom only): if the browser bar appears or disappears in
  landscape, the scene is slightly letterboxed until the next recipe.
