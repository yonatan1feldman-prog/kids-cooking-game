import Phaser from 'phaser';

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
 * Loads a pre-rendered WebP (scripts/bake-webp.js) as a canvas texture. It already has the
 * texture size, so nothing is rasterized at load time. Resolves false on any failure.
 */
export async function loadWebpTexture(textures: Phaser.Textures.TextureManager, key: string, url: string): Promise<boolean> {
  try {
    const img = await decodeImage(url);
    if (!img.naturalWidth) return false;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.drawImage(img, 0, 0);
    if (textures.exists(key)) textures.remove(key);
    textures.addCanvas(key, canvas);
    return true;
  } catch (err) {
    console.warn(`[assets] webp "${key}" failed, trying the svg`, err);
    return false;
  }
}
