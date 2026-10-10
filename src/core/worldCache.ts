import manifest from 'virtual:asset-manifest';

/**
 * The clinic and the farm are not in the install (polish round, research/polish-spec.md P19): the service worker keeps
 * their own files in a runtime cache (`world-assets`, vite.config.ts) the first time she goes there. Before going in,
 * `worldReady` makes sure every one of them can be had: what is not cached yet is fetched now (through the service
 * worker, which keeps it), a few at a time, while the caller's spinner turns. False when one can't be fetched (offline
 * before the first visit, a lost connection): the caller stays where it is, nothing half-drawn is ever shown.
 * Without a service worker (dev, a first visit before it is installed) the files come from the network as before.
 */
const CACHE = 'world-assets';
const PARALLEL = 6;
/** A single file that gets no answer for this long counts as failed (a slow connection that still answers is fine). */
const FILE_TIMEOUT_MS = 30000;

const url = (p: string) => import.meta.env.BASE_URL + p;

const fetched = new Set<string>();

export async function worldReady(id: string): Promise<boolean> {
  const files = (manifest.world?.[id] ?? []).filter((f) => !fetched.has(f));
  if (!files.length || !('caches' in window) || !navigator.serviceWorker?.controller) return true;
  let missing: string[];
  try {
    const cache = await caches.open(CACHE);
    const have = await Promise.all(files.map((f) => cache.match(url(f)).then((r) => !!r)));
    missing = files.filter((_, i) => !have[i]);
  } catch {
    return true; // no Cache API here after all: load as before
  }
  for (const f of files) if (!missing.includes(f)) fetched.add(f);
  if (!missing.length) return true;
  if (navigator.onLine === false) return false;
  let ok = true;
  const next = async (): Promise<void> => {
    for (let f = missing.shift(); f && ok; f = missing.shift()) {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), FILE_TIMEOUT_MS);
      try {
        const res = await fetch(url(f), { signal: ctl.signal });
        await res.arrayBuffer(); // the whole file, so the service worker has it cached
        if (res.ok) fetched.add(f);
        else ok = false;
      } catch {
        ok = false;
      } finally {
        clearTimeout(timer);
      }
    }
  };
  await Promise.all(Array.from({ length: PARALLEL }, next));
  if (!ok) console.warn(`[assets] ${id}: its files could not be fetched (offline?): staying here`);
  return ok;
}
