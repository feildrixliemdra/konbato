/**
 * Whether the ~25 MB background-removal model has already been downloaded.
 *
 * Modelled as a small external store rather than `useState` + `useEffect`:
 * reading storage happens synchronously during render on the client, so the
 * page never flashes the "one-time download" prompt at someone who has already
 * paid that cost, and the value cannot drift between components.
 */

// Versioned so a future change to what we store cannot be misread as the old shape.
const MODEL_CACHE_KEY = 'konbato_bg_model_downloaded:v1';

let snapshot = false;
let hydrated = false;
const listeners = new Set<() => void>();

function readStoredFlag(): boolean {
  // getItem throws when storage is disabled or blocked (private browsing, quota).
  try {
    return localStorage.getItem(MODEL_CACHE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function subscribeModelCache(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getModelCacheSnapshot(): boolean {
  if (!hydrated) {
    snapshot = readStoredFlag();
    hydrated = true;
  }
  return snapshot;
}

/** The server has no storage, so it always reports "not downloaded yet". */
export function getModelCacheServerSnapshot(): boolean {
  return false;
}

export function markModelCacheDownloaded(): void {
  snapshot = true;
  hydrated = true;
  try {
    localStorage.setItem(MODEL_CACHE_KEY, 'true');
  } catch {
    // Storage may be unavailable; the in-memory flag still holds this session.
  }
  listeners.forEach((listener) => listener());
}
