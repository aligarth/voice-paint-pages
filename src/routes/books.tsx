import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  FileDown,
  FileArchive,
  ImageDown,
  Loader2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import {
  deleteBook,
  deleteBookPage,
  listBooks,
  renameBook,
  type SavedBook,
} from "@/lib/savedBooks";
import { exportPagesToPdf } from "@/lib/exportPdf";
import { exportPagesToZip } from "@/lib/exportZip";
import { downloadFlattenedPage } from "@/lib/flattenPage";

import { saveSession } from "@/lib/session";

export const Route = createFileRoute("/books")({
  head: () => ({
    meta: [
      { title: "My Books — Say & Color Library" },
      {
        name: "description",
        content:
          "View, rename, export and delete your saved coloring books and individual pages, then reopen any book to keep coloring.",
      },
      { property: "og:title", content: "My Books — Say & Color Library" },
      {
        property: "og:description",
        content: "Manage your saved coloring books: rename, delete pages, export a PDF or resume coloring.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BooksPage,
});

function BooksPage() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<SavedBook[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void listBooks().then(setBooks);
  }, []);

  const openBook = async (book: SavedBook) => {
    await saveSession({
      title: book.title,
      pages: book.pages.map((src, i) => ({ src, paint: book.paints?.[i] ?? null })),
      openPage: null,
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


  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/" className="btn-crayon mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to studio
      </Link>

      <header>
        <h1 className="flex flex-wrap items-center gap-3 text-4xl font-extrabold">
          <BookOpen className="h-8 w-8" /> My books
          <span className="text-base font-bold text-muted-foreground">
            {books ? `${books.length} saved` : "loading…"}
          </span>
        </h1>
        <p className="mt-3 max-w-xl text-base text-muted-foreground">
          Every picture you draw is saved here as its own little book. Combine any of them into one
          big book, rename, remove pages, export a PDF, or reopen a book to keep coloring.
        </p>

        {((books && books.length > 1) || undoPayload) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {books && books.length > 1 && (
              <button
                type="button"
                className="btn-crayon"
                onClick={() => {
                  setSelecting((prev) => !prev);
                  setSelected([]);
                }}
              >
                <Layers className="h-4 w-4" /> {selecting ? "Cancel selecting" : "Combine books"}
              </button>
            )}
            {undoPayload && (
              <button type="button" className="btn-crayon" onClick={() => void revertCombine()}>
                <Undo2 className="h-4 w-4" /> Undo combine
              </button>
            )}
          </div>
        )}

        {selecting && (
          <div className="paper-card mt-4 flex flex-wrap items-center gap-3 p-4">
            <span className="text-sm font-extrabold">
              {selected.length === 0
                ? "Tick the books you want in one big book"
                : `${selected.length} selected`}
            </span>
            <input
              value={combineTitle}
              onChange={(e) => setCombineTitle(e.target.value)}
              aria-label="Combined book title"
              className="min-w-[12rem] flex-1 rounded-full border-2 border-border bg-card px-4 py-2 text-base font-bold outline-none focus:border-primary"
            />
            <button
              type="button"
              className="btn-crayon disabled:opacity-50"
              disabled={selected.length < 2 || combining}
              onClick={() => void combineSelected()}
            >
              {combining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
              Combine {selected.length > 1 ? selected.length : ""} books
            </button>
          </div>
        )}
        {message && <p className="mt-3 text-sm font-bold text-primary">{message}</p>}
      </header>

      {books && books.length === 0 && (
        <div className="paper-card mt-10 p-8 text-center">
          <p className="text-lg font-extrabold">No saved books yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Say it or snap it in the studio — each picture saves itself here as its own book.
          </p>
          <Link to="/" className="btn-crayon mt-5 inline-flex">
            Go make one
          </Link>
        </div>
      )}

      <div className="mt-10 space-y-8">
        {books?.map((book) => (
          <section key={book.id} className="paper-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {editingId === book.id ? (
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <input
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    autoFocus
                    className="min-w-[12rem] flex-1 rounded-full border-2 border-border bg-card px-4 py-2 text-base font-bold outline-none focus:border-primary"
                    aria-label="Book title"
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
                  {selecting && (
                    <input
                      type="checkbox"
                      checked={selected.includes(book.id)}
                      onChange={() => toggleSelected(book.id)}
                      aria-label={`Select ${book.title}`}
                      className="h-5 w-5 accent-primary"
                    />
                  )}
                  {book.title}{" "}
                  <span className="text-base font-bold text-muted-foreground">
                    · {book.pages.length} {book.pages.length === 1 ? "page" : "pages"}
                  </span>
                </h2>
              )}

              <div className="flex flex-wrap gap-2">
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
                <button
                  type="button"
                  className="btn-crayon"
                  onClick={async () => setBooks(await deleteBook(book.id))}
                >
                  <Trash2 className="h-4 w-4" /> Delete book
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {book.pages.map((src, index) => (
                <div key={index} className="rounded-2xl border-2 border-border p-2">
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-white">
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
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold">Page {index + 1}</span>
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
        ))}
      </div>
    </main>
  );
}
