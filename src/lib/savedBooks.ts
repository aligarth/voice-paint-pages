/**
 * The coloring library the app works with.
 *
 * Everything lives in the signed-in person's own space on the server, so pages
 * and books are private to them and follow them to any device. What was saved
 * on this device before sign-in exists stays put and is copied across the
 * first time they sign in.
 */
import {
  MAX_BOOKS,
  deleteBookPageRecord,
  deleteBookRecord,
  deletePageAndCascadeRecord,
  getBookRecord as fetchBookRecord,
  importFromDevice as importDeviceRecords,
  listBookRecords,
  renameBookRecord,
  saveBookRecord as writeBookRecord,
  savePagePaint as writePagePaint,
} from "./account.functions";

export type SavedKind = "page" | "book";

export type SavedBook = {
  id: string;
  title: string;
  savedAt: number;
  /** In shelf listings this holds the cover picture only; openBook() returns every page. */
  pages: string[];
  /** Painted layers aligned with `pages`. */
  paints?: (string | null)[] | undefined;
  /** Titles aligned with `pages`. */
  pageTitles?: string[] | undefined;
  /** "page" = one generated coloring page, "book" = a collection the user built. */
  kind?: SavedKind | undefined;
  /** How many pictures the book really holds, including the ones a listing leaves out. */
  pageCount?: number | undefined;
  /** Id of the shared, view-only copy of this book, once a link has been made. */
  shareId?: string | undefined;
};

export { MAX_BOOKS };

/** Older records have no `kind`: multi-page records were combined books. */
export function recordKind(record: SavedBook): SavedKind {
  if (record.kind) return record.kind;
  const total = record.pageCount ?? record.pages.length;
  return total > 1 ? "book" : "page";
}

export function isSavedPage(record: SavedBook) {
  return recordKind(record) === "page";
}

export function isSavedBook(record: SavedBook) {
  return recordKind(record) === "book";
}

export function makeBookId() {
  return crypto.randomUUID();
}

// ---------- The signed-in person's own space ----------

export async function listBooks(): Promise<SavedBook[]> {
  try {
    return await listBookRecords();
  } catch {
    return [];
  }
}

/** One book with every picture and painted layer. */
export async function openBookRecord(id: string): Promise<SavedBook> {
  return await fetchBookRecord({ data: { id } });
}

/** Stores one page's coloring without re-sending the whole book. */
export async function savePagePaint(id: string, index: number, paint: string | null) {
  await writePagePaint({ data: { id, index, paint } });
}

export async function saveBookRecord(book: SavedBook): Promise<SavedBook[]> {
  return await writeBookRecord({ data: toInput(book) });
}

export async function deleteBook(id: string): Promise<SavedBook[]> {
  const { books } = await deleteBookRecord({ data: { id } });
  return books;
}

/** Deletes a book but hands back everything it held, so it can be put back. */
export async function deleteBookKeepingCopy(
  id: string,
): Promise<{ books: SavedBook[]; removed: SavedBook | null }> {
  return await deleteBookRecord({ data: { id } });
}

export async function renameBook(id: string, title: string): Promise<SavedBook[]> {
  const clean = title.trim();
  if (!clean) return await listBooks();
  return await renameBookRecord({ data: { id, title: clean } });
}

/** Removes one page from a book; deletes the whole book when it was the last page. */
export async function deleteBookPage(id: string, pageIndex: number): Promise<SavedBook[]> {
  return await deleteBookPageRecord({ data: { id, index: pageIndex } });
}

/** Deletes a standalone page and removes its image from every book that used it. */
export async function deletePageAndCascade(id: string): Promise<SavedBook[]> {
  return await deletePageAndCascadeRecord({ data: { id } });
}

/** Keeps the shape the server accepts, and never trusts a device-made id. */
function toInput(book: SavedBook) {
  const pages = book.pages.filter(Boolean).slice(0, 60);
  return {
    id: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(book.id)
      ? book.id
      : null,
    title: (book.title || "My coloring book").trim().slice(0, 200),
    savedAt: Math.round(book.savedAt || Date.now()),
    pages,
    paints: book.paints?.slice(0, 60),
    pageTitles: book.pageTitles?.slice(0, 60),
    kind: recordKind(book),
    shareId: book.shareId ?? null,
  };
}

// ---------- What this device still holds from before sign-in ----------

const DB_NAME = "say-and-color";
const STORE = "books";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Cannot open storage"));
  });
}

function readDeviceBooks(): Promise<SavedBook[]> {
  if (typeof indexedDB === "undefined") return Promise.resolve([]);
  return openDb().then(
    (db) =>
      new Promise<SavedBook[]>((resolve) => {
        if (!db.objectStoreNames.contains(STORE)) {
          db.close();
          resolve([]);
          return;
        }
        const transaction = db.transaction(STORE, "readonly");
        const request = transaction.objectStore(STORE).getAll();
        request.onsuccess = () => resolve((request.result as SavedBook[]) ?? []);
        request.onerror = () => resolve([]);
        transaction.oncomplete = () => db.close();
      }),
  );
}

/**
 * Copies this device's pages and books into the signed-in person's space.
 * Pictures already in the account are skipped, so running it again is harmless.
 */
export async function importDeviceLibrary(): Promise<{ imported: number; skipped: number }> {
  const records = (await readDeviceBooks()).filter((record) => record.pages?.length);
  if (!records.length) return { imported: 0, skipped: 0 };
  return await importDeviceRecords({ data: { records: records.map(toInput) } });
}
