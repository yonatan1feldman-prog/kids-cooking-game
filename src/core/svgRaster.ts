import Phaser from 'phaser';
import manifest from 'virtual:asset-manifest';

/**
 * Loads an SVG and rasterizes it at its native contract size (`box`), keeping the
 * SVG's own aspect ratio (never distorted). One texture pixel = one design pixel.
 * Resolves false on any failure so the caller can fall back to a placeholder.
 */
export async function loadSvgTexture(
  textures: Phaser.Textures.TextureManager,
  key: string,
  url: string,
  box: readonly [number, number],
): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const text = await res.text();

    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    const svg = doc.documentElement;
    if (svg.nodeName.toLowerCase() !== 'svg') return false;

    const aspect = readAspect(svg);
    let w = box[0];
    let h = w / aspect;
    if (h > box[1]) {
      h = box[1];
      w = h * aspect;
    }
    w = Math.max(1, Math.round(w));
    h = Math.max(1, Math.round(h));

    if (!svg.getAttribute('viewBox')) {
      const ow = parseFloat(svg.getAttribute('width') ?? '');
      const oh = parseFloat(svg.getAttribute('height') ?? '');
      if (ow > 0 && oh > 0) svg.setAttribute('viewBox', `0 0 ${ow} ${oh}`);
    }
    svg.setAttribute('width', String(w));
    svg.setAttribute('height', String(h));
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' });
    const blobUrl = URL.createObjectURL(blob);
    try {
      const img = await decodeImage(blobUrl);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      ctx.drawImage(img, 0, 0, w, h);
      if (textures.exists(key)) textures.remove(key);
      textures.addCanvas(key, canvas);
      return true;
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  } catch (err) {
    console.warn(`[assets] svg "${key}" failed, using placeholder`, err);
    return false;
  }
}

function readAspect(svg: Element): number {
  const vb = (svg.getAttribute('viewBox') ?? '').trim().split(/[\s,]+/).map(Number);
  if (vb.length === 4 && vb[2] > 0 && vb[3] > 0) return vb[2] / vb[3];
  const w = parseFloat(svg.getAttribute('width') ?? '');
  const h = parseFloat(svg.getAttribute('height') ?? '');
  if (w > 0 && h > 0) return w / h;
  return 1;
}

function decodeImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image decode failed'));
    img.src = src;
  });
}

/**
 * Loads a pre-rendered WebP (scripts/bake-webp.js) as an image texture. It already has the texture size, so nothing
 * is rasterized at load time, and it goes to the GPU as it is (no canvas copy in between: half the memory, one copy
 * less of every pixel). It is decoded off the main thread first, so the upload doesn't also decode it in a frame.
 * Resolves false on any failure.
 */
export async function loadWebpTexture(textures: Phaser.Textures.TextureManager, key: string, url: string): Promise<boolean> {
  try {
    // decode() both loads and decodes it (off the main thread): one wait instead of two
    const img = new Image();
    img.src = url;
    await img.decode();
    if (!img.naturalWidth) return false;
    if (textures.exists(key)) textures.remove(key);
    const tex = textures.addImage(key, img);
    // Premium round PR 1: a WebP cut to its opaque box at the bake gets its full frame back here, so its size, origin,
    // pivots, crop and hit area are those of the full picture (Phaser draws the box at its offset in the frame); only
    // the box goes to the GPU. A file that doesn't match its record (an old cache) is used as it is.
    const t = manifest.trim?.[key];
    if (tex && t && img.naturalWidth === t[4] && img.naturalHeight === t[5]) tex.get().setTrim(t[0], t[1], t[2], t[3], t[4], t[5]);
    return true;
  } catch (err) {
    console.warn(`[assets] webp "${key}" failed, trying the svg`, err);
    return false;
  }
}

const fullSources = new WeakMap<object, HTMLCanvasElement>();

/**
 * A texture's picture at its full frame size, for code that reads its pixels on a 2D canvas (`getSourceImage()` is only
 * the cut box of a WebP trimmed at the bake): the box drawn at its place in a canvas of the frame's size, made once per
 * texture source. An untrimmed texture's own source is returned as it is.
 */
export function fullSourceImage(textures: Phaser.Textures.TextureManager, key: string): CanvasImageSource & { width: number; height: number } {
  const tex = textures.get(key);
  const src = tex.getSourceImage() as CanvasImageSource & { width: number; height: number };
  const f = tex.get();
  if (!(f as unknown as { data: { trim?: boolean } }).data.trim) return src;
  let c = fullSources.get(src);
  if (!c) {
    c = document.createElement('canvas');
    c.width = f.realWidth;
    c.height = f.realHeight;
    c.getContext('2d')?.drawImage(src, f.x, f.y);
    fullSources.set(src, c);
  }
  return c;
}
