declare module 'virtual:asset-manifest' {
  const manifest: {
    /** image key -> url (relative to the page) */
    images: Record<string, string>;
    /** sound key -> urls, preferred format first */
    sounds: Record<string, string[]>;
  };
  export default manifest;
}
