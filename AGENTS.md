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
