/** Auto-saved in-progress coloring session so users can pick up where they left off. */
export type SessionPage = {
  /** Line-art image (data URL), or null for a page that hasn't been filled yet. */
  src: string | null;
  /** Transparent paint layer the user has coloured, if any. */
  paint?: string | null;
  /** How this page gets filled: spoken or snapped. */
  mode?: "say" | "type" | "snap";
};

export type ColoringSession = {
  title: string;
  pages: SessionPage[];
  openPage: number | null;
  savedAt: number;
};

const DB_NAME = "say-and-color-session";
const STORE = "session";
const KEY = "current";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Cannot open storage"));
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = run(transaction.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("Storage error"));
        transaction.oncomplete = () => db.close();
      }),
  );
}

export async function loadSession(): Promise<ColoringSession | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    return (await tx<ColoringSession | undefined>("readonly", (store) => store.get(KEY))) ?? null;
  } catch {
    return null;
  }
}

export async function saveSession(session: Omit<ColoringSession, "savedAt">): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    await tx("readwrite", (store) => store.put({ ...session, savedAt: Date.now() }, KEY));
  } catch {
    /* storage full or unavailable — resume is best-effort */
  }
}

export async function clearSession(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    await tx("readwrite", (store) => store.delete(KEY));
  } catch {
    /* ignore */
  }
}
