import Phaser from 'phaser';
import { FX_DOT, FX_SOFT } from './assets';

interface BurstOpts {
  texture?: string;
  count?: number;
  tint?: number | number[];
  speed?: number;
  /** particle size in game px */
  size?: number;
  gravityY?: number;
  lifespan?: number;
  depth?: number;
}

/** One-shot particle burst that cleans itself up. */
export function burst(scene: Phaser.Scene, x: number, y: number, o: BurstOpts = {}) {
  const texture = o.texture ?? FX_DOT;
  const frame = scene.textures.getFrame(texture);
  const size = o.size ?? 22;
  const base = size / Math.max(1, frame?.realWidth ?? 32);
  const lifespan = o.lifespan ?? 700;
  const tint = o.tint ?? 0xffffff;
  const emitter = scene.add.particles(x, y, texture, {
    emitting: false,
    speed: { min: (o.speed ?? 400) * 0.4, max: o.speed ?? 400 },
    angle: { min: 0, max: 360 },
    scale: { start: base, end: 0 },
    alpha: { start: 1, end: 0.2 },
    rotate: { min: -180, max: 180 },
    gravityY: o.gravityY ?? 600,
    lifespan,
    tint: Array.isArray(tint) ? tint : [tint],
  });
  emitter.setDepth(o.depth ?? 50);
  emitter.explode(o.count ?? 14);
  scene.time.delayedCall(lifespan + 200, () => emitter.destroy());
  return emitter;
}

/** Soft puff (flour, steam). */
export function puff(scene: Phaser.Scene, x: number, y: number, tint = 0xffffff, count = 6, size = 70) {
  return burst(scene, x, y, { texture: FX_SOFT, count, tint, speed: 160, size, gravityY: -120, lifespan: 800 });
}

/** Star shower used for step completions and the finale. */
export function stars(scene: Phaser.Scene, x: number, y: number, count = 16, size = 70) {
  return burst(scene, x, y, { texture: 'star', count, speed: 900, size, gravityY: 900, lifespan: 1200, depth: 80 });
}

type Boingable = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform;

/**
 * A quick squash-and-stretch "boing". The object's resting scale is remembered on
 * first use, so rapid repeated boings never make it drift in size.
 */
export function boing(scene: Phaser.Scene, target: Boingable, amount = 0.12) {
  if (target.getData('restScaleX') === undefined) target.setData({ restScaleX: target.scaleX, restScaleY: target.scaleY });
  const sx = target.getData('restScaleX') as number;
  const sy = target.getData('restScaleY') as number;
  scene.tweens.add({
    targets: target,
    scaleX: { from: sx * (1 + amount), to: sx },
    scaleY: { from: sy * (1 - amount), to: sy },
    duration: 380,
    ease: 'Elastic.easeOut',
    easeParams: [1.2, 0.4],
  });
}

/** Call after intentionally changing an object's size, so later boings rest at the new size. */
export function setRestScale(target: Boingable) {
  target.setData({ restScaleX: target.scaleX, restScaleY: target.scaleY });
}
