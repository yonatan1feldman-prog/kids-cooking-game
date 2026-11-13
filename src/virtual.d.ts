declare module 'virtual:asset-manifest' {
  const manifest: {
    /** image key -> url (relative to BASE_URL) */
    images: Record<string, string>;
    /** image key -> pre-rendered WebP url, only where it matches the current SVG */
    webp: Record<string, string>;
    /** image key -> [frame w, frame h, x, y, w, h]: the WebP holds only that box of its frame (transparent margin cut) */
    trim: Record<string, [number, number, number, number, number, number]>;
    /** sound key -> urls, preferred format first */
    sounds: Record<string, string[]>;
    /** the worlds the service worker caches at runtime, not at install (clinic, farm): the urls only each one uses */
    world: Record<string, string[]>;
  };
  export default manifest;
}
