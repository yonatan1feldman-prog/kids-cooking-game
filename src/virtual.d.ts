declare module 'virtual:asset-manifest' {
  const manifest: {
    /** image key -> url (relative to BASE_URL) */
    images: Record<string, string>;
    /** sound key -> urls, preferred format first */
    sounds: Record<string, string[]>;
  };
  export default manifest;
}
