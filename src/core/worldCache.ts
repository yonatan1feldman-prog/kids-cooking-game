import manifest from 'virtual:asset-manifest';

/**
 * The clinic and the farm are not in the install (polish round, research/polish-spec.md P19): the service worker keeps
 * their own files in a runtime cache (`world-assets`, vite.config.ts) the first time she goes there. Before going in,
 * `worldReady` makes sure every one of them can be had: what is not cached yet is fetched now (through the service
 * worker, which keeps it), a few at a time, while the caller's spinner turns. Each file is tried up to three times; online,
 * a handful that still fail don't keep her out (stand-ins cover them). Offline before the first visit: false.
 * Without a service worker (dev, a first visit before it is installed) the files come from the network as before.
 */
const CACHE = 'world-assets';
const PARALLEL = 6;
/** One try at a file that gets no answer for this long counts as failed (a slow connection that still answers is fine). */
const FILE_TIMEOUT_MS = 45000;
/** Each file is tried this many times (a phone's connection drops a request now and then: one lost file must never
 * keep her out, clinic-open fix). */
const TRIES = 3;
/** Online, she goes in even when a few files could not be had (the loader tries them once more, and a missing picture
 * or sound has a stand-in): only when more than this share is missing does the caller stay where it is. */
const MAY_MISS = 0.15;

const url = (p: string) => import.meta.env.BASE_URL + p;

const fetched = new Set<string>();

/** (a function, so TypeScript does not take the answer as fixed between two looks) */
const offline = () => navigator.onLine === false;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchOne(f: string): Promise<boolean> {
  for (let attempt = 0; attempt < TRIES; attempt++) {
    if (attempt) await wait(attempt * 1200);
    if (offline()) return false;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), FILE_TIMEOUT_MS);
    try {
      const res = await fetch(url(f), { signal: ctl.signal });
      await res.arrayBuffer(); // the whole file, so the service worker has it cached
      if (res.ok) return true;
      if (res.status === 404) return false; // not there at all: trying again won't help
    } catch {
      /* lost: try again */
    } finally {
      clearTimeout(timer);
    }
  }
  return false;
}

/**
 * `onProgress(done, total)` is called as files come in (the caller's spinner fills up). True when she can go in: every
 * file is at hand, or online with only a few missing. False when offline before the first visit, or when most files
 * can't be fetched: the caller stays where it is, nothing half-drawn is ever shown.
 */
export async function worldReady(id: string, onProgress?: (done: number, total: number) => void): Promise<boolean> {
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
  if (offline()) return false;
  const total = missing.length;
  const queue = [...missing];
  let done = 0;
  let lost = 0;
  let got = 0;
  onProgress?.(0, total);
  const next = async (): Promise<void> => {
    for (let f = queue.shift(); f; f = queue.shift()) {
      if (await fetchOne(f)) {
        fetched.add(f);
        got++;
      } else lost++;
      // (offline, nothing at all coming through, or most of it lost already: no point fetching the rest now, she is
      // not kept waiting; what came is kept for the next tap)
      if (offline() || lost > total * MAY_MISS || (!got && lost >= PARALLEL)) queue.length = 0;
      onProgress?.(++done, total);
    }
  };
  await Promise.all(Array.from({ length: PARALLEL }, next));
  if (got === total) return true;
  // (what was not fetched, the lost ones and those never tried once it gave up)
  const ok = !offline() && total - got <= total * MAY_MISS;
  console.warn(`[assets] ${id}: ${total - got} of ${total} files could not be fetched: ${ok ? 'going in anyway' : 'staying here (offline?)'}`);
  return ok;
}
