import Phaser from 'phaser';
import { listPhotos } from './album';

/**
 * Her newest picture from the art corner, taped up on the kitchen cabinet in place of the stock child's drawing
 * (`kitchen-drawing`, core/scenery.ts). It is her work shown, not a reward: nothing counts or asks for more. The picture
 * is the one kept in the memory book (core/album.ts, recipe `art-*`), read once at boot and replaced when she
 * finishes another; without one the stock drawing stays. Every failure is silent.
 */
export const WALL_DRAWING = 'kitchen-drawing-mine';
/** The stock drawing's box (156 x 180 in the kitchen frame): the new one fills the same box. */
const W = 156;
const H = 180;

/** Draws the picture (a data URL) onto a sheet of paper with a strip of tape and makes it the wall texture. */
export function setWallDrawing(game: Phaser.Game, data: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width = W;
          c.height = H;
          const g = c.getContext('2d');
          if (!g) return resolve();
          g.save();
          g.translate(W / 2, H / 2 + 6);
          g.rotate(-0.04);
          // the paper, a soft shadow under it
          g.fillStyle = 'rgba(58,34,22,0.28)';
          g.fillRect(-68, -72, 140, 150);
          g.fillStyle = '#FFFDF7';
          g.fillRect(-70, -76, 140, 150);
          // her picture (square, the sheet in the middle of it), fitted inside the paper
          const s = Math.min(128 / img.width, 138 / img.height);
          g.drawImage(img, (-img.width * s) / 2, -70 + (138 - img.height * s) / 2, img.width * s, img.height * s);
          g.restore();
          // the tape across the top
          g.save();
          g.translate(W / 2, 12);
          g.rotate(0.06);
          g.fillStyle = 'rgba(238,178,60,0.85)';
          g.fillRect(-34, -9, 68, 20);
          g.restore();
          // The texture may be on screen right now (the cabinet behind the art corner, 20:9): it is redrawn in place,
          // never removed. (Removing it under a shown image crashed the WebGL renderer on the next frame, and the
          // whole game froze, after the second finished picture of a visit.)
          const cur = game.textures.exists(WALL_DRAWING) ? game.textures.get(WALL_DRAWING) : null;
          if (cur instanceof Phaser.Textures.CanvasTexture) {
            const cg = cur.getContext();
            cg.clearRect(0, 0, cur.width, cur.height);
            cg.drawImage(c, 0, 0, cur.width, cur.height);
            cur.refresh();
          } else if (!cur) game.textures.addCanvas(WALL_DRAWING, c);
        } catch {
          /* the stock drawing stays */
        }
        resolve();
      };
      img.onerror = () => resolve();
      img.src = data;
    } catch {
      resolve();
    }
  });
}

/** At boot: her newest art-corner picture from the memory book, if there is one. */
export async function refreshWallDrawing(game: Phaser.Game) {
  const photos = await listPhotos();
  const mine = photos.find((p) => p.recipe.startsWith('art-'));
  if (mine) await setWallDrawing(game, mine.data);
}
