# AGENTS.md — read this first

## What this is
A private cooking game for a 5-year-old girl. She plays mainly on an Android phone (20:9) held
sideways (landscape, locked), sometimes on a tablet. It is not for any app store. The owner is not
technical and does no manual steps: agents do everything.

**Language: the child speaks English.** Anything spoken or worded in the game (voice-over,
narration, sung jingles with words, any text ever shown) is in **English**, now and in the future.
The screen stays text-free (see the UX rules). Commit messages stay in Hebrew: they are for the owner.

Current content: one recipe (pizza), start to finish, with the real art and sounds, in landscape.
Later recipes should be mostly a new data file.

Stack: Phaser 4 (4.2.x) + Vite + TypeScript, installed as a PWA (vite-plugin-pwa).
The official Phaser 4 skills are in `node_modules/phaser/skills/*/SKILL.md`. Read the
relevant ones (scenes, input, tweens, particles, scale-and-responsive, loading-assets,
audio-and-sound, render-textures) before changing engine-level code. They beat any other
notes (e.g. `../cooking-game-assets/mechanics-notes.md` is hints only). Phaser 4 differs from 3
(for example tint modes, filters instead of masks and FX, Vector2 instead of Point, and
DynamicTexture needs `.render()`).

## UX rules (must hold for every change)
1. **Zero text to read.** Icons, motion and sound only. No words, letters or digits on screen.
2. **You can't fail and you can't get stuck.** Each step: after 5 s without progress a guiding
   hand demonstrates the gesture (with a glow on the target), and after 10 more seconds the step finishes itself
   (`src/steps/Step.ts`: `HINT_AFTER_MS`, `AUTO_AFTER_HINT_MS`). Exception: free decorating waits
   15 s for the hand (it points at the done button) and 30 s to finish itself. 3 missed drops in a row
   show the hand right away (`Step.miss()`). There is no wrong answer and no losing.
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

## Landscape layout
- **World:** always **1080 units high**. The width follows the screen: 1440 at 4:3, 1920 at 16:9, 2400 at 20:9
  (the main device). `main.ts`: Scale `EXPAND` on a 1440x1080 base (`BASE_W/BASE_H` in `layout.ts`).
- **Positions are never absolute 1920 numbers.** Everything is in ONE table, `src/core/stage.ts`
  (`getStage(layout)`), placed relative to the side margins (`m = 4%` of the width) and the center:
  `[ this step's ingredients / bins ] [ the dish on its board ] [ the character ]`. Scenes and steps read
  `ctx.stage.*`. To change the layout, change the table, not the steps.
- **Content scale `k`** (`layout.k`): 1 on every screen 16:9 and wider. Only screens narrower than 16:9
  (4:3 tablets, physically much bigger) show everything at `k < 1` (0.75 at 4:3), because the densest step
  (bins + full board + character at 75%) needs 1766 units between the side strips (`FIT_W`).
  `layout.Y(v)` maps a y of the 1080 design band to the world, scaled by k around the palm-strip line, so on
  those screens things still stand on the counter.
- **Background** `bg-kitchen-landscape` (1920x1080): anchored bottom-center at native height, so it is only
  cropped at the sides (4:3). If the screen is wider than the art (20:9) it grows uniformly just enough to cover
  the width, still bottom-anchored (`addBackground`). A wider background will come later under the same name.
- **Sizes** (the old "uniform art scale" rule is cancelled): images are shown at native size x `k`, except where
  the stage table gives an item its own scale: the character (75-100% of native, from the width left over:
  100% at 20:9, 75% at 16:9), the oven (75-95%, filling the room left of the board), the topping bins
  (as big as the left column allows, about 213 units at 16:9 and 20:9), the home button (85% = 204 units).
  The pizza (dish radius 350) and the board are always at native size x k.
- **Composition per step:** the character stands on the right for the whole recipe (blinks, her eyes follow the
  finger / hand / dish, a short happy hop at the end of each step, `steps/Character.ts`). Roll: the pin rests
  upright in the left column and lies across the finger while rolling. Spread: bowl left. Sprinkle: shaker left.
  Decorate: 6 bins in 2 columns on the left, done button above the character's head. Bake: the oven left of the
  dish, side by side. Feed: slices on the board, dragged right to her mouth (a carried slice points its tip at
  the mouth, its middle under the finger).
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
public/assets/images/      SVG art (from the asset agent)
public/assets/sounds/      ogg/mp3 sounds (from the asset agent)
src/main.ts                Phaser config (3 touch pointers), gesture blocking, lifecycle, orientation guard, SW
src/core/
  assets.ts                THE ASSET CONTRACT: image keys + native sizes, sound keys, ART geometry, palette
  placeholders.ts          code-drawn stand-ins for missing images (incl. topping-bin); sauce brush; opaqueBounds
  svgRaster.ts             SVG -> texture at native size, aspect kept
  sfx.ts                   sfx(): plays if loaded, silent otherwise; sfxThen(): chain sounds
  device.ts                browser-gesture blocking, wake lock, audio resume (background return, every touch)
  layout.ts                world size, k, Y(), no-touch zones, resize handling, background
  stage.ts                 THE LAYOUT TABLE: every position and per-item scale, relative to margins and center
  orientation.ts           landscape guard: rotate screen, pause/resume
  fx.ts                    burst / puff / stars particles, boing squash
  hand.ts                  HandHint: tap / drag / rub / circle demos, fingertip = image origin, target glow
  ui.ts                    iconButton (padded hit circle, fires on press, optional two-tap confirm)
src/recipes/
  types.ts                 Recipe + StepDef + CharacterDef types (one params type per step type)
  pizza.ts                 the pizza recipe, pure data
  index.ts                 RECIPES list shown on the home screen
src/steps/
  Step.ts                  base: idle timer, hint, auto-finish, finger ownership, miss streak, cancelGesture
  Character.ts             the character on the right: layers, blink, look-at, moods, cheer
  Dish.ts                  the food carried between steps; capture() flattens it into one texture
  slices.ts                cuts the captured pizza into wedges (2D canvas), stock-art fallback
  registry.ts              step type name -> implementation
  RollStep / SpreadStep / SprinkleStep / DecorateStep / BakeStep / FeedStep
src/scenes/
  BootScene                loads existing assets, fills gaps with placeholders
  TitleScene               big play button (audio resume, fullscreen + landscape lock, wake lock)
  HomeScene                one card per recipe
  RecipeScene              runs any recipe's steps in order; board under the dish; the character; home button
```

## Recipes are data
A recipe is `{ id, card, board, character, steps: StepDef[] }`. Each step names a reusable type and its params.
Step types: `roll`, `spread`, `sprinkle`, `decorate`, `bake`, `feed`. `character` lists her layer keys
(body, eyes x4, mouth x3); she is on screen for the whole recipe.
To add a recipe: create `src/recipes/<name>.ts`, add it to `RECIPES`, and add any new image keys
to the contract in `src/core/assets.ts` together with a placeholder in `placeholders.ts`.
A new step type means a new `Step` subclass + a `StepDef` variant + a registry entry + its anchors in `stage.ts`.
Every step subclass must implement `showHint()` and `autoFinish()`, call `poke()` on real progress,
and treat `onUp(..., cancelled)` as "put it back gently".

The child's own pizza: at the end of decorating, `Dish.capture()` renders the dish (dough, sauce,
cheese, toppings where she put them) into one texture (`pizza-made`). That exact pizza goes into
the oven, is seen through the window, and is cut into the slices she feeds. `pizza-slice` is only a
fallback if the capture fails.

## Asset contract (another agent produces the art and sounds)
- Images: `public/assets/images/<key>.svg`. Sounds: `public/assets/sounds/<key>.ogg` and/or `.mp3` (ogg preferred).
- Image keys (34): bg-kitchen-landscape, dough-ball, dough-flat, rolling-pin, sauce-bowl, sauce-blob,
  cheese-shaker, cheese-shred, topping-tomato, topping-olive, topping-mushroom, topping-corn,
  topping-pepper, topping-onion, tray, oven-inside, oven-closed, oven-open, pizza-slice,
  character-body, character-eyes-open, character-eyes-blink, character-eyes-surprised,
  character-eyes-happy, character-mouth-closed, character-mouth-open, character-mouth-chew,
  hand-hint, star, btn-play, btn-home, btn-done, card-pizza, topping-bin.
  (`bg-kitchen`, the portrait background, is no longer used and was removed from the game folder.)
- **`topping-bin` (240x240) is not delivered yet:** the game draws it in code (cream rounded box, 8 px ink outline,
  20% ink shadow) until `topping-bin.svg` arrives. The bin is scaled to fit its cell; the topping is drawn on top of it.
- Sound keys (9): tap, pop, squish, sprinkle, whoosh, oven-ding, munch, cheer, cheer-jingle.
  Any future voice lines are in English.
- Art conventions the code assumes (see STYLE.md in the asset folder):
  - viewBox = native size in world units (the world is 1080 high). Outlines are 8 px, ink `#5B3A29`.
  - `bg-kitchen-landscape`: 1920x1080; the counter must stay plain across the whole width (it is bottom-anchored).
  - `hand-hint`: the fingertip is at (53, 23) in its 220x280 viewBox.
  - `tray` is the round pizza board under the dough (not a topping bin; that is `topping-bin`).
  - `pizza-slice`: crust at the top, tip pointing down.
  - `cheese-shaker`: holes at the top (it is turned upside down while shaking).
  - `rolling-pin`: drawn lying down; the game stands it upright (rotated 90 degrees) while it rests.
  - Character layers share a 600x700 frame; the mouth position is measured from `character-mouth-open`.
  - Oven layers share a 700x800 frame; the window hole is x 150-550, y 320-610; the pizza sits at (350, 480), diameter about 320.
  - `sauce-blob`: its silhouette becomes a solid sauce brush (outline removed).
- **Missing files are fine:** a placeholder is drawn in code and a missing sound is silent. Swapping in
  real assets is only copying files into those folders. The dev server reloads by itself. For the
  production/PWA build, run `npm run build` again, since the asset list is fixed at build time.
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
  `rollback-pre-landscape` (end of round 1, portrait), `v0.2-landscape` (end of round 2, landscape).

## Running
- Everything is served under the sub-path `/kids-cooking-game/` (Vite `base`), in dev and preview too.
  Code builds URLs from `import.meta.env.BASE_URL` (or page-relative paths), never from a leading `/`.
- `npm run dev`: dev server on the LAN (`--host`, port 5173). Open `http://<computer's LAN address>:5173/kids-cooking-game/` on the phone.
- Dev only: `?step=N` (0-based) jumps straight to step N of the recipe.
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

## Testing notes for agents
- Use `scripts/harness.js` (served by the dev server). Details and pitfalls: Handoff notes, section 1.
- In an automated Chrome whose window is hidden, requestAnimationFrame doesn't run. The harness drives frames
  with `game.loop.step(t)` and replaces `Date.now` with the same virtual clock BEFORE any scene starts
  (the TweenManager uses its own `Date.now` clock and freezes if it runs behind).
- Synthetic `mouseup` must be dispatched on the canvas (not on window) for Phaser to see it.
- Desktop Chrome has no touch listeners. The harness calls `game.input.onTouchStart/onTouchMove/onTouchEnd/
  onTouchCancel` with fake events.
- Nothing replaces a real finger on a real phone. Always list what still needs a hands-on check.

## Handoff notes (end of round 2, landscape; written for the next agent)

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
  the mouth, or anywhere right of the character's left edge (`stage.charLeft`).
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
- The hand (`core/hand.ts`) has its origin at the fingertip and a soft glow on the first target. `stop()` kills its tweens.
  `hand.position` is where the fingertip is (the character watches it).

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

### 6. Open points after round 2
- **Needs a real finger on the real phone (20:9):** the thumb strips (4%) and the palm strip in real two-handed play;
  whether 213-unit bins (~1.3 cm) and the 204-unit home button are easy for her; the two-tap home button (does she arm it
  by accident, does an adult find it); dragging a slice to the right with the tip leading; rolling with the pin lying
  across the finger; the rotate screen and resuming after a real rotation (browsers fire touchcancel differently);
  fullscreen + landscape lock from the play button; the look of the eyes following the finger.
- **4:3 tablets** show everything at k = 0.75 (pizza radius 262 units, bins ~160, home button 153, character 56% of
  native). Physically they are still bigger than on the phone (a tablet's 1080 units are ~15 cm), but below the
  200-unit rule in world units. If that matters, the fix is to give tablets a different composition, not to shrink more.
- **16:9** is exactly the fit width: the character is at 75%, 25-unit gaps between the columns. Nothing to spare.
- **20:9** crops the top 270 units of the 1920-wide background (it is scaled x1.25 to cover the width). A 2400-wide
  `bg-kitchen-landscape` from the asset agent will fix that with no code change.
- `topping-bin.svg` is still to come from the asset agent (240x240 viewBox; drawn in code until then).
- The rolling pin's shadow is drawn for a lying pin; standing upright at rest, its shadow is at its side.
- The recipe screen doesn't re-layout on a size change (camera zoom only): if the browser bar appears or disappears in
  landscape, the scene is slightly letterboxed until the next recipe.
