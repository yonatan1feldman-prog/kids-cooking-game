import Phaser from 'phaser';
import { INK } from '../core/assets';

/**
 * A slice ready to place: its texture, origin at the tip (the pizza center), and the
 * rotation at which it sits in the whole pizza. Direction angles are in degrees.
 */
export interface SliceDef {
  key: string;
  originX: number;
  originY: number;
  /** Rotation of the image when the slice sits in the whole pizza. */
  restAngle: number;
  /** Direction from the pizza center through the middle of the slice. */
  midAngle: number;
  /** Distance from the tip to the slice's visual center, in game px. */
  centerDist: number;
}

/**
 * Cuts the child's pizza image into n wedges on a 2D canvas (no GPU readback, no masks).
 * Each cut edge gets the same ink outline as the art. `radius` < 1 cuts a smaller disc than the capture.
 */
export function cutSlices(scene: Phaser.Scene, img: HTMLImageElement, n: number, outline: number, radius = 1): SliceDef[] {
  const size = img.width;
  const c = size / 2;
  // (`radius`: the part of the capture that is food, e.g. the pancake inside its 350 frame)
  const r = c * radius;
  const out: SliceDef[] = [];
  for (let i = 0; i < n; i++) {
    const mid = -90 + (i * 360) / n;
    const a0 = Phaser.Math.DegToRad(mid - 180 / n);
    const a1 = Phaser.Math.DegToRad(mid + 180 / n);
    // Bounding box of the wedge.
    const pts = [{ x: c, y: c }];
    for (let t = 0; t <= 16; t++) {
      const a = a0 + ((a1 - a0) * t) / 16;
      pts.push({ x: c + Math.cos(a) * r, y: c + Math.sin(a) * r });
    }
    const pad = outline;
    const minX = Math.floor(Math.min(...pts.map((p) => p.x)) - pad);
    const minY = Math.floor(Math.min(...pts.map((p) => p.y)) - pad);
    const maxX = Math.ceil(Math.max(...pts.map((p) => p.x)) + pad);
    const maxY = Math.ceil(Math.max(...pts.map((p) => p.y)) + pad);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, maxX - minX);
    canvas.height = Math.max(1, maxY - minY);
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    const ax = c - minX;
    const ay = c - minY;
    const wedge = () => {
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.arc(ax, ay, r, a0, a1);
      ctx.closePath();
    };
    ctx.save();
    wedge();
    ctx.clip();
    ctx.drawImage(img, -minX, -minY);
    // Outline on the cut edges (half the stroke falls inside the clip).
    ctx.lineJoin = 'round';
    ctx.lineWidth = outline * 2;
    ctx.strokeStyle = '#' + INK.toString(16).padStart(6, '0');
    wedge();
    ctx.stroke();
    ctx.restore();

    const key = `pizza-slice-made-${i}`;
    if (scene.textures.exists(key)) scene.textures.remove(key);
    scene.textures.addCanvas(key, canvas);
    out.push({ key, originX: ax / canvas.width, originY: ay / canvas.height, restAngle: 0, midAngle: mid, centerDist: r * 0.6 });
  }
  return out;
}

/** Fallback when the capture failed: the stock pizza-slice art (crust on top, tip down). */
export function stockSlices(n: number, k: number): SliceDef[] {
  return Array.from({ length: n }, (_, i) => {
    const mid = -90 + (i * 360) / n;
    // The tip points down in the art; rotate so it points at the pizza center.
    return { key: 'pizza-slice', originX: 0.5, originY: 0.93, restAngle: mid + 90, midAngle: mid, centerDist: 150 * k };
  });
}
