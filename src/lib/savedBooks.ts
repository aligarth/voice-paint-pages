export type SavedKind = "page" | "book";

export type SavedBook = {
  id: string;
  title: string;
  savedAt: number;
  pages: string[];
  /** Optional painted layers for each page, aligned by index. */
  paints?: (string | null)[] | undefined;
  /** Titles for each page, aligned by index. */
  pageTitles?: string[] | undefined;
  /** "page" = one generated coloring page, "book" = a collection the user built. */
  kind?: SavedKind | undefined;
};


export const MAX_BOOKS = 100;

/** Older records have no `kind`: multi-page records were combined books. */
export function recordKind(record: SavedBook): SavedKind {
  if (record.kind) return record.kind;
  return record.pages.length > 1 ? "book" : "page";
}

export function isSavedPage(record: SavedBook) {
  return recordKind(record) === "page";
}

export function isSavedBook(record: SavedBook) {
  return recordKind(record) === "book";
}

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

export async function listBooks(): Promise<SavedBook[]> {
  if (typeof indexedDB === "undefined") return [];
  try {
    const all = await tx<SavedBook[]>("readonly", (store) => store.getAll() as IDBRequest<SavedBook[]>);
    return all.sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

export async function saveBook(
  title: string,
  pages: string[],
  paints?: (string | null)[],
): Promise<SavedBook[]> {
  const existing = await listBooks();
  if (existing.length >= MAX_BOOKS) {
    throw new Error(`You can keep ${MAX_BOOKS} books. Delete one to save a new book.`);
  }
  const book: SavedBook = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    savedAt: Date.now(),
    pages,
    paints,
  };
  await tx("readwrite", (store) => store.put(book));
  return listBooks();
}

export async function deleteBook(id: string): Promise<SavedBook[]> {
  await tx("readwrite", (store) => store.delete(id));
  return listBooks();
}

export async function renameBook(id: string, title: string): Promise<SavedBook[]> {
  const books = await listBooks();
  const book = books.find((item) => item.id === id);
  if (!book) return books;
  await tx("readwrite", (store) => store.put({ ...book, title: title.trim() || book.title }));
  return listBooks();
}

/** Removes one page from a book; deletes the whole book when it was the last page. */
export async function deleteBookPage(id: string, pageIndex: number): Promise<SavedBook[]> {
  const books = await listBooks();
  const book = books.find((item) => item.id === id);
  if (!book) return books;
  const pages = book.pages.filter((_, i) => i !== pageIndex);
  const paints = book.paints?.filter((_, i) => i !== pageIndex);
  if (!pages.length) return deleteBook(id);
  await tx("readwrite", (store) => store.put({ ...book, pages, paints }));
  return listBooks();
}

/** Deletes a standalone page and removes its image from every book that uses it. Empty books are deleted. */
export async function deletePageAndCascade(id: string): Promise<SavedBook[]> {
  const books = await listBooks();
  const page = books.find((b) => b.id === id && isSavedPage(b));
  if (!page) return books;

  const srcsToRemove = new Set(page.pages);
  await tx("readwrite", (store) => store.delete(id));

  const remaining = await listBooks();
  for (const book of remaining.filter(isSavedBook)) {
    const indicesToRemove = book.pages
      .map((src, i) => (srcsToRemove.has(src) ? i : -1))
      .filter((i): i is number => i !== -1);
    if (indicesToRemove.length === 0) continue;

    const pages = book.pages.filter((_, i) => !indicesToRemove.includes(i));
    const paints = book.paints?.filter((_, i) => !indicesToRemove.includes(i));

    if (pages.length === 0) {
      await tx("readwrite", (store) => store.delete(book.id));
    } else {
      await tx("readwrite", (store) => store.put({ ...book, pages, paints }));
    }
  }

  return listBooks();
}

/** Writes a book record as-is (used by auto-save, combine and undo). */
export async function saveBookRecord(book: SavedBook): Promise<SavedBook[]> {
  await tx("readwrite", (store) => store.put(book));
  return listBooks();
}

export function makeBookId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

