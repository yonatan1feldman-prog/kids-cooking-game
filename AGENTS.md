# AGENTS.md — read this first

## What this is
A private cooking game for a 5-year-old girl. She plays mainly on an Android phone held
upright (portrait), sometimes on a tablet. It is not for any app store. The owner is not
technical and does no manual steps: agents do everything.

**Language: the child speaks English.** Anything spoken or worded in the game (voice-over,
narration, sung jingles with words, any text ever shown) is in **English**, now and in the future.
The screen stays text-free (see the UX rules). Commit messages stay in Hebrew: they are for the owner.

Current content: one recipe (pizza), start to finish, with the real art and sounds.
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
3. **One finger only:** tap, drag, rub. No double-tap, no long-press, no multi-touch, no time limits.
   The first finger to touch owns the action until lifted. A second finger or a resting palm
   never interrupts or steals it (`Step.onDown/onMove/onUp`, `iconButton`).
4. **Big and forgiving.** The touch area of every dragged item is at least 15% of the screen
   width (`MIN_DRAG_SHARE`), and hit areas reach beyond the drawing. Drop targets accept generous
   misses. A lost touch (pointercancel, release off the screen) sends the item gently back.
5. **Palm zone:** nothing interactive may start in the bottom 8% of the screen (`PALM_ZONE`).
   `Step.onDown` and `iconButton` already filter this (on screen coordinates).
6. **Instant feedback** for every action on touch-down: motion + particles + sound.
   Buttons fire on press. Only the play button fires on release, because browsers grant fullscreen,
   audio unlock and wake lock only from a completed tap.
7. **Progress lives in the object** (dough flattens, sauce spreads, pizza fills). No progress bars or dots.
8. **Any portrait size, no distortion.** See "Uniform art scale" below.

## Uniform art scale (from the art's STYLE.md)
All art is drawn in one 1080x1920 design space: an SVG's viewBox size is its size on screen.
- Every SVG is rasterized at its native viewBox size (`IMAGES[key].size` in `assets.ts`), and every
  image is shown at ONE scale, `layout.k` (use `art(img, layout)`). That keeps the 8 px ink outline
  the same thickness everywhere. Don't `fit()` art to arbitrary sizes. Deviations are only temporary
  effects (pop-in, lift while dragging, the pizza shrinking into the oven).
- Place things in design coordinates with `layout.P(x, y)`: the 1080x1920 stage is centered on screen
  (the scale manager uses EXPAND, so the screen is always at least 1080x1920 and k is usually 1).
  Taller phones get extra margin; the background covers everything.
- Layered art shares a frame and is stacked at one position: the character (600x700: body, then eyes,
  then mouth) and the oven (700x800: oven-inside, then the pizza, then oven-closed, whose window is a real hole).
  Geometry the code relies on is in `ART` in `assets.ts` (fingertip, oven window, pizza spot, dough radius).

## Project layout
```
index.html                 page shell (no scroll/zoom/pull-to-refresh/callout/selection)
vite.config.ts             dev server (--host), PWA, asset-manifest plugin
plugins/asset-manifest.ts  virtual:asset-manifest = the asset files that exist on disk
scripts/make-icons.mjs     regenerates the temporary PWA icons (public/icons)
public/assets/images/      SVG art (from the asset agent)
public/assets/sounds/      ogg/mp3 sounds (from the asset agent)
src/main.ts                Phaser config (3 touch pointers), gesture blocking, lifecycle, SW registration
src/core/
  assets.ts                THE ASSET CONTRACT: image keys + native sizes, sound keys, ART geometry, palette
  placeholders.ts          code-drawn stand-ins for missing images; UI textures (bin, sauce brush); opaqueBounds
  svgRaster.ts             SVG -> texture at native size, aspect kept
  sfx.ts                   sfx(): plays if loaded, silent otherwise; sfxThen(): chain sounds
  device.ts                browser-gesture blocking, wake lock, audio resume (background return, every touch)
  layout.ts                getLayout (k, P), art, fit, cover, palm zone, resize handling, background
  fx.ts                    burst / puff / stars particles, boing squash
  hand.ts                  HandHint: tap / drag / rub / circle demos, fingertip = image origin, target glow
  ui.ts                    iconButton (art scale, padded hit circle, fires on press)
src/recipes/
  types.ts                 Recipe + StepDef types (one params type per step type)
  pizza.ts                 the pizza recipe, pure data
  index.ts                 RECIPES list shown on the home screen
src/steps/
  Step.ts                  base: idle timer, hint, auto-finish, finger ownership, miss streak
  Dish.ts                  the food carried between steps; capture() flattens it into one texture
  slices.ts                cuts the captured pizza into wedges (2D canvas), stock-art fallback
  registry.ts              step type name -> implementation
  RollStep / SpreadStep / SprinkleStep / DecorateStep / BakeStep / FeedStep
src/scenes/
  BootScene                loads existing assets, fills gaps with placeholders
  TitleScene               big play button (audio resume, fullscreen, wake lock)
  HomeScene                one card per recipe
  RecipeScene              runs any recipe's steps in order; the board (tray) sits under the dish
```

## Recipes are data
A recipe is `{ id, card, board, steps: StepDef[] }`. Each step names a reusable type and its params.
Step types: `roll`, `spread`, `sprinkle`, `decorate`, `bake`, `feed`.
To add a recipe: create `src/recipes/<name>.ts`, add it to `RECIPES`, and add any new image keys
to the contract in `src/core/assets.ts` together with a placeholder in `placeholders.ts`.
A new step type means a new `Step` subclass + a `StepDef` variant + a registry entry.
Every step subclass must implement `showHint()` and `autoFinish()`, call `poke()` on real progress,
and treat `onUp(..., cancelled)` as "put it back gently".

The child's own pizza: at the end of decorating, `Dish.capture()` renders the dish (dough, sauce,
cheese, toppings where she put them) into one texture (`pizza-made`). That exact pizza goes into
the oven, is seen through the window, and is cut into the slices she feeds. `pizza-slice` is only a
fallback if the capture fails.

## Asset contract (another agent produces the art and sounds)
- Images: `public/assets/images/<key>.svg`. Sounds: `public/assets/sounds/<key>.ogg` and/or `.mp3` (ogg preferred).
- Image keys (33): bg-kitchen, dough-ball, dough-flat, rolling-pin, sauce-bowl, sauce-blob,
  cheese-shaker, cheese-shred, topping-tomato, topping-olive, topping-mushroom, topping-corn,
  topping-pepper, topping-onion, tray, oven-inside, oven-closed, oven-open, pizza-slice,
  character-body, character-eyes-open, character-eyes-blink, character-eyes-surprised,
  character-eyes-happy, character-mouth-closed, character-mouth-open, character-mouth-chew,
  hand-hint, star, btn-play, btn-home, btn-done, card-pizza.
- Sound keys (9): tap, pop, squish, sprinkle, whoosh, oven-ding, munch, cheer, cheer-jingle.
  Any future voice lines are in English.
- Art conventions the code assumes (see STYLE.md in the asset folder):
  - viewBox = on-screen size in the 1080x1920 design space. Outlines are 8 px, ink `#5B3A29`.
  - `hand-hint`: the fingertip is at (53, 23) in its 220x280 viewBox.
  - `tray` is the round pizza board under the dough (not a topping bin; the bins are drawn in code).
  - `pizza-slice`: crust at the top, tip pointing down.
  - `cheese-shaker`: holes at the top (it is turned upside down while shaking).
  - Character layers share a 600x700 frame; the mouth position is measured from `character-mouth-open`.
  - Oven layers share a 700x800 frame; the window hole is x 150-550, y 320-610; the pizza sits at (350, 480), diameter about 320.
  - `sauce-blob`: its silhouette becomes a solid sauce brush (outline removed).
- **Missing files are fine:** a placeholder is drawn in code and a missing sound is silent. Swapping in
  real assets is only copying files into those folders. The dev server reloads by itself. For the
  production/PWA build, run `npm run build` again, since the asset list is fixed at build time.
- The browser console lists which placeholders and silent sounds are in use (`[assets]` lines).

## Working rules
- Work on a branch. No remote exists. **Never push, and never merge to master,** without a separate,
  explicit approval message from the owner.
- `git add` explicit paths only. Never `git add .` or `git add -A`. For assets, the folder paths
  `public/assets/images` and `public/assets/sounds` are allowed.
- Commit messages in Hebrew, written to a file and committed with `git commit -F <file>`.
- After each significant step, `npm run typecheck` and `npm run build` must both pass with no errors, then commit.
- Don't install libraries beyond what is needed.
- Stay inside this folder. `../cooking-game-assets` may be READ and copied FROM, never written,
  changed or deleted (another agent works there). Use `images/` and top-level `sounds/*.ogg`,
  not `images-v1/`, `sounds-v1/` or `sounds/voice/`, unless the owner says otherwise.
- Rollback points: tags `rollback-start` (first commit) and `rollback-pre-assets` (before the real assets).

## Running
- `npm run dev`: dev server on the LAN (`--host`, port 5173). Open `http://<PC-IP>:5173` on the phone.
- Dev only: `?step=N` (0-based) jumps straight to step N of the recipe.
- `npm run build`, `npm run preview`: production build. The service worker and the screen wake lock only
  work on HTTPS or localhost, so over plain LAN http the screen may still dim. Installing the PWA needs
  an HTTPS deployment (a future round).

## Testing notes for agents
- In an automated Chrome whose window is hidden, requestAnimationFrame doesn't run. Drive frames
  manually with `game.loop.step(t)`, and replace `Date.now` with the same virtual clock BEFORE any scene
  starts: the TweenManager uses its own `Date.now` clock and freezes if it runs behind.
  `window.game` is exposed for this.
- Synthetic `mouseup` must be dispatched on the canvas (not on window) for Phaser to see it.
- Desktop Chrome has no touch listeners. Simulate touches by calling `game.input.onTouchStart/
  onTouchMove/onTouchEnd/onTouchCancel` with fake events ({changedTouches:[{identifier,pageX,pageY,target:canvas}], ...}).
- Nothing replaces a real finger on a real phone. Always list what still needs a hands-on check.

## Handoff notes (end of round 1, written for the next agent)

State: branch `round-1-pizza`, full pizza recipe with real art and sounds, portrait only.
Rollback tags: `rollback-start`, `rollback-pre-assets`. Screenshots of the last full run (portrait, real
assets) are in `docs/screenshots-round1/` (git-ignored, local only): compare against them after a refactor.

### 1. Test harness (automated Chrome, no real finger)
The Chrome window used by the browser tools is hidden, so `requestAnimationFrame` never fires and the
game only moves when you step it. Paste this into the page (via the JS tool) right after the page loads,
BEFORE interacting. It emulates a 1080x2333 phone by shrinking the game container:
```js
const g=document.getElementById('game'); g.style.width='288px'; g.style.height='622px'; // phone ratio; keep inside the viewport
window.dispatchEvent(new Event('resize'));              // the ScaleManager did not notice the container change on its own
window.__T = performance.now();
const realNow = Date.now.bind(Date); window.__off = realNow() - __T;
Date.now = () => Math.floor(__T + __off);                 // TweenManager clock = same virtual clock (see pitfalls)
window.__tick = (ms=16) => { __T += ms; game.loop.step(__T); };
window.__run = async (ms) => { for (let i=0;i<Math.ceil(ms/16);i++){ __tick(16); if (i%40==0) await new Promise(r=>setTimeout(r,0)); } };
window.__S = 288/1080;                                    // screen px per game px
window.__touch = (type,id,x,y) => { const r=game.canvas.getBoundingClientRect();
  const t={identifier:id,pageX:r.left+x*__S,pageY:r.top+y*__S,clientX:r.left+x*__S,clientY:r.top+y*__S,target:game.canvas};
  const ev={changedTouches:[t],touches:[t],targetTouches:[t],timeStamp:performance.now(),target:game.canvas,preventDefault(){},cancelable:true};
  const m=game.input; ({start:()=>m.onTouchStart(ev),move:()=>m.onTouchMove(ev),end:()=>m.onTouchEnd(ev),cancel:()=>m.onTouchCancel(ev)})[type](); __tick(); };
window.__drag = async (pts) => { __touch('start',1,...pts[0]); for (let i=1;i<pts.length;i++){ const [a,b]=pts[i-1],[c,d]=pts[i];
  for (let k=1;k<=6;k++) __touch('move',1,a+(c-a)*k/6,b+(d-b)*k/6); } __touch('end',1,...pts[pts.length-1]); };
window.__tap = (x,y) => { __touch('start',1,x,y); __touch('end',1,x,y); };
window.__R = () => game.scene.getScene('Recipe');       // __R().step, __R().ctx.dish, __R().ctx.hand ...
await __run(1500);
game.scene.getScenes(true).forEach(s=>s.scene.stop()); await __run(50); game.scene.start('Title'); await __run(900); // re-layout at the new size
```
All coordinates passed to `__touch/__drag/__tap` are GAME pixels (use `__R().ctx.dish.x`, `step.bins[i].x`,
`step.done`, `step.closed`, `step.sliceCenter(s)`, `step.mouthAt` ...). Design coordinates -> game: add
`oy = (game.scale.height - 1920) / 2` to y (x offset is 0 on phones).

Timings to run between actions (virtual ms via `__run`):
- Title tap -> Home: 1300. Card tap -> Recipe ready: 1600.
- After a step completes, RecipeScene waits 800 before the next step, plus the step's own ending:
  roll ~1500 total, spread 1800 (animated fill), sprinkle 1800 (pieces are still flying when the count is reached),
  decorate 2500 after the done tap (450 delay + async snapshot), bake: drag-in 480 + bake 3500 -> tap oven -> 2600.
- Feed: 1200 between slices (260 fly + ~1000 chew). Last slice -> party 3800 -> Home ~5000.
- Idle checks: hint at 5000 (decorate 15000), auto-finish 10000 later (decorate 30000 total).
- Don't assume a step is finished after a fixed number of gestures: loop "while the step name is still X, do another gesture".

Harness pitfalls:
- The JS tool call times out at 45 s, but the script keeps running in the page. For long sequences, start them
  without awaiting (`window.__done=null; run().then(r=>__done=r)`), then poll `__done`.
- Any source edit makes Vite do a full page reload: the harness is gone and must be pasted again.
- Mouse instead of touch works too (tests the mouse pointer, not touch slots): dispatch `MouseEvent`s on
  `game.canvas`, including `mouseup`. A synthetic `mouseup` sent to `window` is NOT processed by Phaser.
- Screenshots (`computer zoom` on the container region) can show a stale frame. Step a few frames before
  taking one, and keep the region inside the current viewport (the viewport height changes between sessions).
- A reload during a long sequence (e.g. overnight) kills the virtual clock: start again from a fresh load.
- `?step=N` jumps skip the earlier steps, so the dish is incomplete (e.g. the oven then shows a lone
  tomato: `09-bake-jump-mode-tomato-only.png`). For visual checks, play from step 0.

### 2. Layout: where positions live
- Design space and helpers: `src/core/layout.ts` (`BASE_W/BASE_H` 1080x1920, `PALM_ZONE`, `MIN_DRAG_SHARE`,
  `getLayout()` -> `k`, `ox`, `oy`, `P(x,y)`, `safeBottom`). `main.ts` passes BASE_W/H to the ScaleManager (EXPAND).
- Absolute positions in 1080x1920 design coordinates (all go through `L.P`):
  - `scenes/TitleScene.ts`: play button (540, 960).
  - `scenes/HomeScene.ts`: card (540, 960), or 2 columns for more recipes.
  - `scenes/RecipeScene.ts`: `DISH_HOME` (540, 1110), home button (160, 160).
  - `steps/RollStep.ts`: rolling pin rest (540, 540).
  - `steps/SpreadStep.ts`: sauce bowl (820, 500).
  - `steps/SprinkleStep.ts`: shaker rest (850, 470).
  - `steps/DecorateStep.ts`: `BINS_TOP` 400, bins in 3 columns 290 apart and rows 260 apart, `DISH_AT` (540, 1175), `DONE_AT` (860, 1610).
  - `steps/BakeStep.ts`: `OVEN_AT` (540, 480), `DISH_WAIT` (540, 1330).
  - `steps/FeedStep.ts`: `CHAR_AT` (540, 470). The slices sit wherever the dish is (DISH_WAIT after baking).
- Relative distances (hit radii, lift offsets, hover offsets, particle sizes) are written as `N * this.k` in design px.
  They are orientation-independent and should stay as they are.
- Art-internal geometry (fingertip, oven window, pizza spot, dough radius) is in `ART` in `core/assets.ts`,
  in each image's own viewBox coordinates. It does not depend on the screen.
- The right way to change coordinate space: never convert numbers by hand inside steps. Change the design space in
  `layout.ts` (BASE_W/H, and `k = min(W/BASE_W, H/BASE_H)` already centers any stage), then move the anchor constants
  listed above. Better (recommended before landscape): gather those anchors into one table per orientation
  (e.g. `src/core/stage.ts`: `{ dishHome, pinRest, bowl, shaker, bins, done, oven, dishWait, character, home, play, card }`)
  that steps read from, so an orientation is data rather than code, like recipes.
- The palm zone is tested in SCREEN coordinates (`p.y > scale.height * (1 - PALM_ZONE)`), in `Step.onDown` and `iconButton`.
- A mid-scene resize doesn't re-layout: `keepLayoutOnResize` zooms the camera so the old layout stays visible.
  Layout happens only in `create()`.

### 3. Pizza capture and slicing (`steps/Dish.ts`, `steps/slices.ts`, `steps/FeedStep.ts`)
- `Dish.capture()` (called by DecorateStep after the done tap plus 450 ms, so the last pops have landed):
  it creates a DynamicTexture of size `2R + 24k`, temporarily moves the dish container to (0,0) at scale 1, calls
  `dt.draw(dish, size/2, size/2)` and `dt.render()`, and restores the position. Then `dt.snapshot(cb)` returns an
  HTMLImageElement, which is added as texture `pizza-made`. The layers are destroyed and the dish becomes one Image.
  `dish.madeImage` keeps the HTMLImageElement for slicing. The snapshot is NOT flipped (checked visually).
- Sensitive spots:
  - The dish must not be tweening (position or scale) at capture time. DecorateStep moves the dish on entry.
  - Anything added to the dish after the capture is lost (the capture is the truth from then on).
  - The capture has a 2 s safety timeout and resolves `false` on any error. FeedStep then uses `stockSlices`
    (`pizza-slice` art at scale k, tip-down art rotated to point inward).
  - The capture is taken BEFORE baking, so baking only tints `dish.base`. FeedStep copies
    `dish.base.tintTopLeft` onto every slice. Any future baked look (not only a tint) must be applied to the slices too.
  - The texture is in GAME pixels (it already includes k): show it at scale 1, not `art()`.
- `cutSlices(img, n, outline)`: for each wedge (mid-angle -90 + i*360/n) it makes a canvas the size of the wedge's
  bounding box, clips an arc path, draws the image and strokes the cut edges in ink (2x the outline width,
  half of which falls inside the clip). The origin is the apex (the pizza center). `restAngle` is 0 for real
  slices. Tip up while dragging = `restAngle + 90 - midAngle`. The grab point is `sliceCenter()` (0.6 R along the mid-angle).
  A drop counts if the FINGER or the slice apex is near the mouth (the apex hangs ~216 px from the finger).
- The sauce is a RenderTexture inside the dish. Its stamps are recorded, and on `Renderer.Events.RESTORE_WEBGL`
  they are replayed (context loss when switching apps). After the capture it no longer matters.

### 4. Finger ownership and idle clocks (`steps/Step.ts`, `core/ui.ts`)
- Config: `input.activePointers: 3`. With 1, a resting palm grabs the only touch slot and every real touch is ignored.
- `Step.onDown` claims `owner = p` if nobody owns the step, the press is not in the palm zone and not on an
  interactive object. `onMove`/`onUp` only pass the owner through. The owner is cleared on its up / up-outside:
  inside `onUp` when the step registered one, and always by a `queueMicrotask` safety release registered on
  the first `onDown` (it runs after the step's own handlers). Steps get `onUp(p, cancelled)`, where
  `cancelled = pointer.wasCanceled || released outside the canvas` means "put it back gently".
- `iconButton` ignores presses while any other pointer is down (`otherPointerDown`), plus the palm zone.
  It fires on press by default. `fireOn:'up'` (play button only) fires on the release of the same pointer.
- Idle: `hintAfterMs` (5000) and `autoAfterHintMs` (10000) are per-step fields. DecorateStep sets 15000 / 15000.
  `update()` adds delta only while `idleOn`, and not while the owner finger is down (unless a hint is already showing).
  `poke()` = real progress (resets the clock, hides the hand). `setIdle(false)` for watch-only phases (baking).
  `miss()` x3 shows the hint immediately. `hit()` resets the streak.
  `autoFinish()` sets `auto` (input ignored). Multi-phase steps call `resumeAfterAuto()` to hand control back (BakeStep).
- The hand (`core/hand.ts`) has its origin at the fingertip and a soft glow on the first target. `stop()` kills its tweens.

### 5. Phaser 4 pitfalls met here that the official skills don't mention
- The TweenManager keeps its own clock from `Date.now()` (`getDelta` in TweenManager.js), not the game loop's time.
  If `game.loop.step()` is driven with virtual time, tweens freeze. If `Date.now` is replaced after a TweenManager
  started and the new clock runs behind, the delta is negative and tweens stay frozen. Replace it once, before any scene starts.
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
- `sound.play()` returns false when it can't play (e.g. still locked). For a chain like jingle -> cheer, use
  `sound.add` + `once('complete')`, with a timer fallback (`sfxThen`).
- Browser rule (not Phaser): on Android, fullscreen, AudioContext.resume and wake lock need a user activation.
  `touchend`/`pointerup` gives one; `pointerdown` on touch does not. Hence the play button fires on release.
- Scale EXPAND: after the parent element changes size, dispatch a window `resize` event; the polling alone didn't catch it.
  Scenes don't re-layout by themselves (see section 2).
- SVGs are not loaded with `this.load.svg`. `core/svgRaster.ts` fetches, sets width and height to the native viewBox size,
  rasterizes to a canvas and calls `textures.addCanvas`. This gives exact native-size textures and a clean fallback.

### 6. Landscape conversion: assessment and suggested order
Easy (orientation-independent, should need no change):
- Step logic, recipe data, finger ownership, idle clocks, hints, sounds, particles, capture and slicing,
  the asset loading and placeholders, and the PWA machinery. Relative sizes are all `N * k`.
- ScaleManager: swap BASE_W/H to 1920x1080; `getLayout` already centers any stage.
- Manifest `orientation: 'landscape'`, and `lockPortrait()` -> lock landscape (TitleScene).
Hard / needs decisions:
- Art: `bg-kitchen` is a 1080x1920 portrait painting. Covering a landscape screen with it crops away most of it.
  A landscape background (1920x1080) must come from the asset agent. The other art can stay as it is.
- Every anchor in section 2 is a hand-placed vertical stack: bins above the pizza, oven above the dish, character
  above the plate. Landscape needs side-by-side compositions: oven left, dish right; character left, plate right;
  bins in a column next to the pizza. Vertical room is tight: 1080 minus the palm zone ~= 994 px, while the board
  is 830 px tall and the dish 720. Consider shrinking the board, or dropping it in some steps, rather than breaking uniform scale.
- The palm zone rule was written for portrait (bottom 8%). A phone held sideways in two hands rests on the left and right
  edges and the bottom corners. `PALM_ZONE` should become a set of screen regions, and it needs an owner decision.
- Hint drags and the hand image are tuned for up/down gestures. Check that they read well sideways.
- What to show when the device is held in the "wrong" orientation. Orientation lock only works in fullscreen or
  an installed PWA, so a text-free "rotate the phone" icon screen may be needed.
- The harness container size (288x622) must become landscape, and the screenshots in docs/ are portrait references only.
What I would do first:
1. With no visual change, move all anchors from section 2 into one stage table (`stage.ts`) read by the scenes and steps.
   Verify with the harness that the portrait screenshots still match.
2. Ask for a landscape `bg-kitchen` (and confirm the palm-zone policy for landscape) while doing step 1.
3. Add a landscape table, switch BASE_W/H, manifest and orientation lock. Tune each step with the harness and
   screenshots, starting with DecorateStep and FeedStep (the densest layouts).
