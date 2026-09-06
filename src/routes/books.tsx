import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Download,
  FileDown,
  FileArchive,
  ImageDown,
  Library,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import {
  deleteBook,
  deleteBookPage,
  deletePageAndCascade,
  isSavedBook,
  isSavedPage,
  listBooks,
  makeBookId,
  recordKind,
  renameBook,
  saveBookRecord,
  type SavedBook,
} from "@/lib/savedBooks";
import { exportPagesToPdf } from "@/lib/exportPdf";
import { exportPagesToZip } from "@/lib/exportZip";
import { downloadFlattenedPage } from "@/lib/flattenPage";
import { cn } from "@/lib/utils";

import { clearSession, saveSession } from "@/lib/session";

type View = "pages" | "bookshelf";

export const Route = createFileRoute("/books")({
  validateSearch: (search: Record<string, unknown>): { view: View } => ({
    view: search["view"] === "bookshelf" ? "bookshelf" : "pages",
  }),
  head: () => ({
    meta: [
      { title: "My Pages & My Bookshelf — Color My World" },
      {
        name: "description",
        content:
          "Browse every coloring page you made in My Pages, choose the ones you love, and build them into a book that lives in My Bookshelf.",
      },
      { property: "og:title", content: "My Pages & My Bookshelf — Color My World" },
      {
        property: "og:description",
        content:
          "Manage your saved coloring pages and books: rename, delete, export a PDF, or reopen anything to keep coloring.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BooksPage,
});

function BooksPage() {
  const navigate = useNavigate();
  const { view } = Route.useSearch();
  const [books, setBooks] = useState<SavedBook[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);
  const [undoBook, setUndoBook] = useState<SavedBook | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearUndo = () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = null;
    setUndoBook(null);
  };

  useEffect(() => () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, []);

  // Choose pages (My Pages view) to build one book.
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bookTitle, setBookTitle] = useState("My coloring book");
  /** Which book on the shelf is opened up to show its pictures. */
  const [openBookId, setOpenBookId] = useState<string | null>(null);

  useEffect(() => {
    void listBooks().then(setBooks);
  }, []);

  const records = useMemo(
    () => (books ?? []).filter(view === "pages" ? isSavedPage : isSavedBook),
    [books, view],
  );

  const setView = (next: View) => {
    clearUndo();
    setSelecting(false);
    setSelectedIds([]);
    void navigate({ to: "/books", search: { view: next } });
  };

  /** Leave the last book behind on the shelf and land on the studio's front cover. */
  const startNewBook = async () => {
    await clearSession();
    void navigate({ to: "/" });
  };

  const openBook = async (book: SavedBook, startPage?: number) => {
    await saveSession({
      bookId: book.id,
      bookKind: recordKind(book),
      title: book.title,
      pages: book.pages.map((src, i) => ({
        src,
        paint: book.paints?.[i] ?? null,
        ...(book.pageTitles?.[i] ? { title: book.pageTitles[i]! } : {}),
      })),
      openPage: startPage ?? null,
    });
    void navigate({ to: "/" });
  };

  const exportBook = async (book: SavedBook) => {
    setExportingId(book.id);
    setMessage(null);
    try {
      await exportPagesToPdf(
        book.title,
        book.pages.map((src, i) => ({ src, paint: book.paints?.[i] ?? null })),
      );
      setMessage(`Downloaded “${book.title}” as a PDF.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not build the PDF.");
    } finally {
      setExportingId(null);
    }
  };

  const exportBookZip = async (book: SavedBook) => {
    setExportingId(`${book.id}-zip`);
    setMessage(null);
    try {
      await exportPagesToZip(
        book.title,
        book.pages.map((src, i) => ({ src, paint: book.paints?.[i] ?? null })),
      );
      setMessage(`Downloaded “${book.title}” as a ZIP.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not build the ZIP.");
    } finally {
      setExportingId(null);
    }
  };

  /** One-tap save of the whole book (line art + coloring) to the device. */
  const saveBookToDevice = async (book: SavedBook) => {
    setExportingId(`${book.id}-save`);
    setMessage(null);
    try {
      await exportPagesToPdf(
        book.title,
        book.pages.map((src, i) => ({ src, paint: book.paints?.[i] ?? null })),
      );
      setMessage(`Saved “${book.title}” to your device.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save this book.");
    } finally {
      setExportingId(null);
    }
  };

  const exportPagePng = async (book: SavedBook, index: number) => {
    const src = book.pages[index];
    if (!src) return;
    try {
      await downloadFlattenedPage(
        { src, paint: book.paints?.[index] ?? null },
        `${book.title.replace(/\s+/g, "-").toLowerCase()}-page-${index + 1}.png`,
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not export this page.");
    }
  };

  /** Copies the chosen pages into one new book without touching the originals. */
  const createBook = async () => {
    if (!selectedIds.length) return;
    const chosen = selectedIds
      .map((id) => records.find((record) => record.id === id))
      .filter((record): record is SavedBook => Boolean(record));
    if (!chosen.length) return;
    const title = bookTitle.trim() || "My coloring book";
    const pages: string[] = [];
    const paints: (string | null)[] = [];
    for (const record of chosen) {
      record.pages.forEach((src, i) => {
        pages.push(src);
        paints.push(record.paints?.[i] ?? null);
      });
    }
    try {
      setBooks(
        await saveBookRecord({
          id: makeBookId(),
          title,
          savedAt: Date.now(),
          pages,
          paints,
          kind: "book",
        }),
      );
      clearUndo();
      setSelecting(false);
      setSelectedIds([]);
      setMessage(
        `Created “${title}” with ${pages.length} ${pages.length === 1 ? "page" : "pages"} in My Bookshelf.`,
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not create the book.");
    }
  };

  /** Deletes a book but keeps the record around so it can be restored. */
  const confirmDeleteBook = async () => {
    const id = deletingBookId;
    setDeletingBookId(null);
    if (!id) return;
    const target = (books ?? []).find((record) => record.id === id);
    try {
      setBooks(await deleteBook(id));
      if (target) {
        setUndoBook(target);
        if (undoTimer.current) clearTimeout(undoTimer.current);
        undoTimer.current = setTimeout(() => setUndoBook(null), 15000);
      }
      setMessage(`Deleted “${target?.title ?? "book"}”.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not delete the book.");
    }
  };

  /** Puts the last deleted book back exactly as it was. */
  const undoDeleteBook = async () => {
    const target = undoBook;
    if (!target) return;
    clearUndo();
    try {
      setBooks(await saveBookRecord(target));
      setMessage(`Restored “${target.title}”.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not restore the book.");
    }
  };

  const confirmDeletePage = async () => {
    if (!deletingId) return;
    clearUndo();
    try {
      setBooks(await deletePageAndCascade(deletingId));
      setMessage("Page deleted and removed from any books that used it.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not delete the page.");
    } finally {
      setDeletingId(null);
    }
  };

  const isPages = view === "pages";
  /** On the shelf we show closed books until one is tapped open. */
  const shelfClosed = !isPages && openBookId === null;
  const visibleRecords = isPages
    ? records
    : records.filter((book) => book.id === openBookId);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/" className="btn-crayon mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to studio
      </Link>

      <header>
        <h1 className="flex flex-wrap items-center gap-3 text-4xl font-extrabold">
          {isPages ? <Library className="h-8 w-8" /> : <BookOpen className="h-8 w-8" />}
          {isPages ? "My Pages" : "My Bookshelf"}
          <span className="text-base font-bold text-muted-foreground">
            {books ? `${records.length} saved` : "loading…"}
          </span>
        </h1>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setView("pages")}
            aria-pressed={isPages}
            className={cn("btn-crayon", isPages && "bg-primary text-primary-foreground")}
          >
            <Library className="h-4 w-4" /> My Pages
          </button>
          <button
            type="button"
            onClick={() => setView("bookshelf")}
            aria-pressed={!isPages}
            className={cn("btn-crayon", !isPages && "bg-primary text-primary-foreground")}
          >
            <BookOpen className="h-4 w-4" /> My Bookshelf
          </button>
          {!isPages && (
            <button
              type="button"
              onClick={() => void startNewBook()}
              className="btn-crayon bg-primary text-primary-foreground"
            >
              <Plus className="h-4 w-4" /> Start a new book
            </button>
          )}
          {isPages && records.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelecting((prev) => {
                  if (prev) setSelectedIds([]);
                  return !prev;
                });
              }}
              aria-pressed={selecting}
              className={cn("btn-crayon", selecting && "bg-accent text-accent-foreground")}
            >
              <Check className="h-4 w-4" /> {selecting ? "Done choosing" : "Choose pages"}
            </button>
          )}
        </div>

        <p className="mt-3 max-w-xl text-base text-muted-foreground">
          {isPages
            ? "Every picture you draw saves itself here as its own page. Choose the pages you want and build them into one book."
            : shelfClosed
              ? "Tap a book to open it and see every picture inside, then tap the picture you want to color."
              : "Tap any picture to color it. Rename, remove pages, export a PDF, or close the book to go back to the shelf."}
        </p>

        {!isPages && !shelfClosed && (
          <button
            type="button"
            className="btn-crayon mt-4"
            onClick={() => setOpenBookId(null)}
          >
            <ArrowLeft className="h-4 w-4" /> Close book
          </button>
        )}

        {(message || undoBook) && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {message && <p className="text-sm font-bold text-primary">{message}</p>}
            {undoBook && (
              <button type="button" className="btn-crayon" onClick={() => void undoDeleteBook()}>
                <RotateCcw className="h-4 w-4" /> Undo delete
              </button>
            )}
          </div>
        )}
      </header>

      {books && records.length === 0 && (
        <div className="paper-card mt-10 p-8 text-center">
          <p className="text-lg font-extrabold">
            {isPages ? "No saved pages yet" : "No books yet"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {isPages
              ? "Say it, type it or snap it in the studio — each picture saves itself here as its own page."
              : "Draw all the pages in the studio, then tap Generate book to put it on your shelf."}
          </p>
          {isPages ? (
            <Link to="/" className="btn-crayon mt-5 inline-flex">
              Go make one
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => void startNewBook()}
              className="btn-crayon mt-5 inline-flex"
            >
              <Plus className="h-4 w-4" /> Start a new book
            </button>
          )}
        </div>
      )}

      {shelfClosed && records.length > 0 && (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {records.map((book) => (
            <button
              key={book.id}
              type="button"
              onClick={() => setOpenBookId(book.id)}
              className="group text-left transition-transform hover:-translate-y-1"
              aria-label={`Open ${book.title}`}
            >
              <div className="relative">
                {/* stacked page edges behind the cover */}
                <span className="absolute inset-y-2 -right-1 w-3 rounded-r-xl border-2 border-border bg-card" />
                <span className="absolute inset-y-1 -right-2 w-3 rounded-r-xl border-2 border-border bg-muted" />
                <div className="relative overflow-hidden rounded-2xl rounded-l-md border-2 border-border bg-card shadow-lg">
                  <span className="absolute inset-y-0 left-0 w-4 bg-primary/80" />
                  <div className="relative ml-4 aspect-[3/4] w-[calc(100%-1rem)] bg-white">
                    {book.pages[0] && (
                      <img
                        src={book.pages[0]}
                        alt={`${book.title} cover`}
                        className="absolute inset-0 h-full w-full object-contain"
                      />
                    )}
                    {book.paints?.[0] && (
                      <img
                        src={book.paints[0]!}
                        alt=""
                        className="absolute inset-0 h-full w-full object-contain"
                      />
                    )}
                  </div>
                  <div className="ml-4 border-t-2 border-border px-3 py-3">
                    <p className="text-lg font-extrabold capitalize">{book.title}</p>
                    <p className="text-xs font-bold text-muted-foreground">
                      {book.pages.length} {book.pages.length === 1 ? "page" : "pages"} · tap to open
                    </p>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className={cn("mt-10 space-y-8", selecting && "pb-32")}>
        {visibleRecords.map((book) => {
          const isSelected = selectedIds.includes(book.id);
          return (
            <section
              key={book.id}
              className={cn("paper-card p-5", selecting && isSelected && "ring-4 ring-primary")}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                {editingId === book.id ? (
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    <input
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      autoFocus
                      className="min-w-[12rem] flex-1 rounded-full border-2 border-border bg-card px-4 py-2 text-base font-bold outline-none focus:border-primary"
                      aria-label="Title"
                    />
                    <button
                      type="button"
                      className="btn-crayon"
                      onClick={async () => {
                        setBooks(await renameBook(book.id, draftTitle));
                        setEditingId(null);
                      }}
                    >
                      <Check className="h-4 w-4" /> Save
                    </button>
                    <button type="button" className="btn-crayon" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4" /> Cancel
                    </button>
                  </div>
                ) : (
                  <h2 className="flex items-center gap-3 text-2xl font-extrabold capitalize">
                    {book.title}{" "}
                    <span className="text-base font-bold text-muted-foreground">
                      · {book.pages.length} {book.pages.length === 1 ? "page" : "pages"}
                    </span>
                  </h2>
                )}

                <div className="flex flex-wrap gap-2">
                  {selecting && isPages && (
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() =>
                        setSelectedIds((prev) =>
                          isSelected ? prev.filter((id) => id !== book.id) : [...prev, book.id],
                        )
                      }
                      className={cn(
                        "btn-crayon",
                        isSelected && "bg-primary text-primary-foreground",
                      )}
                    >
                      <Check className="h-4 w-4" /> {isSelected ? "Chosen" : "Choose"}
                    </button>
                  )}
                  {editingId !== book.id && (
                    <button
                      type="button"
                      className="btn-crayon"
                      onClick={() => {
                        setEditingId(book.id);
                        setDraftTitle(book.title);
                      }}
                    >
                      <Pencil className="h-4 w-4" /> Rename
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-crayon disabled:opacity-50"
                    disabled={exportingId === book.id}
                    onClick={() => void exportBook(book)}
                  >
                    {exportingId === book.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="h-4 w-4" />
                    )}
                    {exportingId === book.id ? "Building PDF…" : "Export PDF"}
                  </button>
                  <button
                    type="button"
                    className="btn-crayon disabled:opacity-50"
                    disabled={exportingId === `${book.id}-zip`}
                    onClick={() => void exportBookZip(book)}
                  >
                    {exportingId === `${book.id}-zip` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileArchive className="h-4 w-4" />
                    )}
                    {exportingId === `${book.id}-zip` ? "Building ZIP…" : "Export ZIP"}
                  </button>
                  <button type="button" className="btn-crayon" onClick={() => void openBook(book)}>
                    Open & color
                  </button>
                  {!isPages && (
                    <button
                      type="button"
                      className="btn-crayon disabled:opacity-50"
                      disabled={exportingId === `${book.id}-save`}
                      onClick={() => void saveBookToDevice(book)}
                    >
                      {exportingId === `${book.id}-save` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      {exportingId === `${book.id}-save` ? "Saving…" : "Save book"}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-crayon"
                    onClick={() => {
                      if (isPages) {
                        setDeletingId(book.id);
                      } else {
                        setDeletingBookId(book.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" /> {isPages ? "Delete page" : "Delete book"}
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {book.pages.map((src, index) => (
                  <div key={index} className="rounded-2xl border-2 border-border p-2">
                    <button
                      type="button"
                      onClick={() => void openBook(book, index)}
                      aria-label={`Color ${book.pageTitles?.[index] || `page ${index + 1}`}`}
                      className="relative block aspect-square w-full overflow-hidden rounded-xl bg-white transition-transform hover:-translate-y-0.5"
                    >
                      <img
                        src={src}
                        alt={`${book.title} page ${index + 1}`}
                        className="absolute inset-0 h-full w-full object-contain"
                      />
                      {book.paints?.[index] && (
                        <img
                          src={book.paints[index]!}
                          alt=""
                          className="absolute inset-0 h-full w-full object-contain"
                        />
                      )}
                      <span className="absolute bottom-1 left-1 rounded-full border-2 border-border bg-card px-2 py-0.5 text-[10px] font-extrabold">
                        Tap to color
                      </span>
                    </button>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold">
                        {book.pageTitles?.[index]?.trim() || `Page ${index + 1}`}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Export page ${index + 1} as PNG`}
                          className="rounded-full border-2 border-border p-1 transition-transform hover:scale-110"
                          onClick={() => void exportPagePng(book, index)}
                        >
                          <ImageDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete page ${index + 1}`}
                          className="rounded-full border-2 border-border p-1 transition-transform hover:scale-110"
                          onClick={async () => setBooks(await deleteBookPage(book.id, index))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {selecting && isPages && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-border bg-card p-4 shadow-lg">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
              <span className="rounded-full bg-primary px-3 py-1 text-primary-foreground">
                {selectedIds.length}
              </span>
              <span>{selectedIds.length === 1 ? "page chosen" : "pages chosen"}</span>
              <button
                type="button"
                onClick={() => setSelectedIds(records.map((record) => record.id))}
                className="ml-2 rounded-full border-2 border-border px-3 py-1 text-xs font-extrabold hover:bg-muted"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="rounded-full border-2 border-border px-3 py-1 text-xs font-extrabold hover:bg-muted"
              >
                Clear
              </button>
            </div>
            <div className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:flex-none">
              <input
                type="text"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                placeholder="Name your book"
                className="min-w-[12rem] flex-1 rounded-full border-2 border-border bg-background px-4 py-2 text-sm font-bold outline-none focus:border-accent sm:flex-none"
                aria-label="Book title"
              />
              <button
                type="button"
                onClick={() => void createBook()}
                disabled={selectedIds.length === 0}
                className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-primary px-5 py-2 text-sm font-extrabold text-primary-foreground disabled:opacity-50"
              >
                <BookOpen className="h-4 w-4" /> Create book
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingBookId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl border-2 border-border bg-card p-6 shadow-xl">
            <h3 className="text-xl font-extrabold">Delete this book?</h3>
            <p className="mt-2 text-muted-foreground">You can undo right after.</p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" className="btn-crayon" onClick={() => setDeletingBookId(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-crayon bg-primary text-primary-foreground"
                onClick={() => void confirmDeleteBook()}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl border-2 border-border bg-card p-6 shadow-xl">
            <h3 className="text-xl font-extrabold">Delete this page?</h3>
            <p className="mt-2 text-muted-foreground">
              This page will be removed from My Pages and from any books that use it.
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" className="btn-crayon" onClick={() => setDeletingId(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-crayon bg-primary text-primary-foreground"
                onClick={() => void confirmDeletePage()}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
