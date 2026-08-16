export type SavedBook = {
  id: string;
  title: string;
  savedAt: number;
  pages: string[];
  /** Optional painted layers for each page, aligned by index. */
  paints?: (string | null)[];
};

export const MAX_BOOKS = 5;

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
