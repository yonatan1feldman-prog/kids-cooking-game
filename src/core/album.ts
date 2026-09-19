/**
 * The memory book (round 9). Every finale's photo — the one the camera already took, exactly as it is shown in the
 * frame — is kept on the device in IndexedDB, with the recipe it belongs to and the day it was made. Nothing more:
 * no counters, no empty slots, no "collect them all", no rewards. It is only there so she and Mom can look at
 * what they cooked together (see "Child wellbeing rules").
 *
 * Nothing here ever throws into the game: a browser without IndexedDB, a full disk, a private window — the photo is
 * simply not kept, silently, and everything else goes on as before.
 */

const DB_NAME = 'cooking-album';
const DB_VERSION = 1;
const STORE = 'photos';
/** How many photos are kept. The oldest one goes quietly when a newer one arrives. */
export const ALBUM_MAX = 40;

export interface AlbumPhoto {
  /** Auto key, increasing: the newest photo has the biggest one. */
  id: number;
  /** The recipe's id (`pizza`, `soup`, ...): the album shows the photo in that recipe's frame. */
  recipe: string;
  /** When it was made (ms since the epoch). */
  at: number;
  /** The picture itself, a compressed WebP (or PNG where WebP is not written) as a data URL. */
  data: string;
}

function open(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/** Runs `body` in one transaction and resolves with its result, or with `fallback` if anything at all goes wrong. */
async function tx<T>(mode: IDBTransactionMode, fallback: T, body: (store: IDBObjectStore, done: (v: T) => void) => void): Promise<T> {
  const db = await open();
  if (!db) return fallback;
  return new Promise<T>((resolve) => {
    let out = fallback;
    const finish = (v: T) => {
      out = v;
    };
    try {
      const t = db.transaction(STORE, mode);
      t.oncomplete = () => {
        db.close();
        resolve(out);
      };
      t.onerror = t.onabort = () => {
        db.close();
        resolve(fallback);
      };
      body(t.objectStore(STORE), finish);
    } catch {
      try {
        db.close();
      } catch {
        /* already closed */
      }
      resolve(fallback);
    }
  });
}

/**
 * Keeps one finished photo. Silent on every failure. When there are more than ALBUM_MAX, the oldest ones go
 * (the album stays a book of the last forty things they cooked, never a score).
 */
export async function keepPhoto(recipe: string, data: string): Promise<boolean> {
  if (!data) return false;
  const ok = await tx('readwrite', false, (store, done) => {
    store.add({ recipe, at: Date.now(), data });
    // Trim from the front (the smallest keys are the oldest).
    const keys = store.getAllKeys();
    keys.onsuccess = () => {
      const all = keys.result;
      // +1 for the one just added, which this request may not see yet.
      const over = all.length + 1 - ALBUM_MAX;
      for (let i = 0; i < over; i++) store.delete(all[i]);
      done(true);
    };
  });
  if (ok) known = Math.min(ALBUM_MAX, known + 1);
  return ok;
}

/**
 * How many photos the book holds, as last read. The home screen needs this synchronously (it decides whether the
 * album button is there at all), so it is read once at boot and kept up to date by `keepPhoto`.
 */
let known = 0;
export const albumCount = () => known;
export async function refreshAlbumCount(): Promise<number> {
  known = await countPhotos();
  return known;
}

/** Every kept photo, newest first. `[]` if there are none or the store cannot be read. */
export async function listPhotos(): Promise<AlbumPhoto[]> {
  return tx<AlbumPhoto[]>('readonly', [], (store, done) => {
    const req = store.getAll();
    req.onsuccess = () => done(((req.result as AlbumPhoto[]) ?? []).slice().sort((a, b) => b.id - a.id));
  });
}

/** How many photos are kept (only used to decide whether the album button is shown at all). */
export async function countPhotos(): Promise<number> {
  return tx('readonly', 0, (store, done) => {
    const req = store.count();
    req.onsuccess = () => done(req.result ?? 0);
  });
}
