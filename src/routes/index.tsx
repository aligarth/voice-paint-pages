import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Sparkles,
  ArrowLeft,
  Loader2,
  Trash2,
  BookOpen,
  Camera,
  Check,
  RefreshCw,
  FileDown,
  FileArchive,
  ImageDown,
  Library,
  X,
  Share2,
  RotateCcw,
  Upload,
  ArrowRight,
  Keyboard,

} from "lucide-react";
import { ColoringCanvas } from "@/components/ColoringCanvas";
import { MusicPlayer } from "@/components/MusicPlayer";
import { useSpeech } from "@/lib/useSpeech";
import { streamImage, streamImageFromPhoto } from "@/lib/streamImage";
import {
  deleteBook,
  isSavedPage,
  listBooks,
  makeBookId,
  saveBookRecord,
  type SavedBook,
} from "@/lib/savedBooks";
import { AUTO_LANG, SPEECH_LANGUAGES } from "@/lib/languages";
import { fileToDataUrl } from "@/lib/photo";
import { PhotoPrep } from "@/components/PhotoPrep";
import { CameraCapture } from "@/components/CameraCapture";
import { exportPagesToPdf } from "@/lib/exportPdf";
import { exportPagesToZip } from "@/lib/exportZip";
import { downloadFlattenedPage } from "@/lib/flattenPage";
import { clearSession, loadSession, saveSession } from "@/lib/session";
import { createSharedGallery } from "@/lib/share";
import { cn } from "@/lib/utils";
import coverArt from "@/assets/book-cover.jpg";

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Color My World — Make Your Own Coloring Book" },
      {
        name: "description",
        content:
          "Open your book, choose how many pages, then say it or snap it for each page and color it in with brushes, crayons and every color.",
      },
      { property: "og:title", content: "Color My World — Make Your Own Coloring Book" },
      {
        property: "og:description",
        content:
          "Say it or snap it. We draw it. You color it. Build a coloring book one page at a time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type PageMode = "say" | "type" | "snap";

type PageSource =
  | { kind: "text"; prompt: string }
  | { kind: "photo"; image: string; variant?: string | undefined };

type Page = {
  id: number;
  mode: PageMode;
  title: string;
  src: string | null;
  done: boolean;
  error?: string | undefined;
  source?: PageSource | undefined;
  regenerating?: boolean | undefined;
  paint?: string | null;
};

type Step = "cover" | "count" | "modes" | "book";

const PAGE_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12];

function blankPages(count: number, mode: PageMode): Page[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    mode,
    title: "",
    src: null,
    done: false,
  }));
}

function Index() {
  const {
    supported,
    listening,
    transcript,
    error: micError,
    start,
    stop,
    setTranscript,
    pendingCommand,
    clearPendingCommand,
    lang,
    setLang,
    detectedLang,
  } = useSpeech();

  const [step, setStep] = useState<Step>("cover");
  const [pageCount, setPageCount] = useState(4);
  const [bookTitle, setBookTitle] = useState("My coloring book");
  const [pages, setPages] = useState<Page[]>([]);
  const [openPage, setOpenPage] = useState<number | null>(null);
  const [busyPage, setBusyPage] = useState<number | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [savedBooks, setSavedBooks] = useState<SavedBook[]>([]);
  const [exporting, setExporting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);

  // Choose pages to build one book.
  const [selecting, setSelecting] = useState(false);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [combineTitle, setCombineTitle] = useState("");
  /** The page most recently open in the coloring canvas — flagged as "Current page". */
  const [lastOpened, setLastOpened] = useState<number | null>(null);

  /** Which page is currently being filled, and how. */
  const [speakFor, setSpeakFor] = useState<number | null>(null);
  const [typeFor, setTypeFor] = useState<number | null>(null);
  const [typedPrompt, setTypedPrompt] = useState("");

  const [photoFor, setPhotoFor] = useState<number | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [prepPhoto, setPrepPhoto] = useState<string | null>(null);

  const uploadInput = useRef<HTMLInputElement | null>(null);
  const snapInput = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  /** Page id -> the one-page book it was auto-saved into, so redraws replace instead of duplicate. */
  const autoSavedRef = useRef<Map<number, { bookId: string; src: string }>>(new Map());

  useEffect(() => {
    void listBooks().then(setSavedBooks);
  }, []);

  // Restore the last in-progress book on first load.
  useEffect(() => {
    void loadSession().then((session) => {
      setRestored(true);
      if (!session?.pages.length) return;
      setBookTitle(session.title || "My coloring book");
      setPageCount(session.pages.length);
      setPages(
        session.pages.map((page, i) => ({
          id: i,
          mode: (page.mode as PageMode) ?? "say",
          title: session.title,
          src: page.src ?? null,
          done: Boolean(page.src),
          paint: page.paint ?? null,
        })),
      );
      setOpenPage(session.openPage);
      setStep("book");
      setSaveMessage("Picked up where you left off.");
    });
  }, []);

  // Auto-save progress so it survives a refresh or a closed tab.
  useEffect(() => {
    if (!restored || step !== "book" || busyPage !== null) return;
    if (!pages.length) return;
    const timer = window.setTimeout(() => {
      void saveSession({
        title: bookTitle,
        pages: pages.map((page) => ({
          src: page.done ? page.src : null,
          paint: page.paint ?? null,
          mode: page.mode,
        })),
        openPage,
      });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [pages, bookTitle, openPage, busyPage, restored, step]);

  // Every freshly drawn page becomes its own little book.
  useEffect(() => {
    if (!restored) return;
    const fresh = pages.filter(
      (page) => page.source && page.done && page.src && !page.error && !page.regenerating,
    );
    if (!fresh.length) return;

    let changed = false;
    const run = async () => {
      for (const page of fresh) {
        const src = page.src!;
        const existing = autoSavedRef.current.get(page.id);
        if (existing?.src === src) continue;
        const label = page.title || `Coloring page ${page.id + 1}`;
        const bookId = existing?.bookId ?? makeBookId();
        autoSavedRef.current.set(page.id, { bookId, src });
        try {
          await saveBookRecord({
            id: bookId,
            title: label,
            savedAt: Date.now(),
            pages: [src],
            paints: [page.paint ?? null],
            kind: "page",
          });
          changed = true;
        } catch {
          autoSavedRef.current.delete(page.id);
        }
      }
      if (changed) setSavedBooks(await listBooks());
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, restored]);

  /** Opens choose-pages mode with one page (e.g. the page open in the canvas) pre-selected. */
  const startSelectingWith = (id: number) => {
    setOpenPage(null);
    setLastOpened(id);
    setCombineTitle((prev) => prev || bookTitle);
    setSelectedPages((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setSelecting(true);
    setSaveMessage(null);
  };

  const saveSelectedAsBook = async () => {
    if (!selectedPages.length) return;
    // Keep the order the user tapped the pages in.
    const chosen = selectedPages
      .map((id) => pages.find((page) => page.id === id))
      .filter((page): page is Page => Boolean(page?.src));
    if (!chosen.length) return;
    const title = combineTitle.trim() || bookTitle || "My coloring book";
    try {
      await saveBookRecord({
        id: makeBookId(),
        title,
        savedAt: Date.now(),
        pages: chosen.map((page) => page.src!),
        paints: chosen.map((page) => page.paint ?? null),
        kind: "book",
      });
      setSavedBooks(await listBooks());
      setSaveMessage(
        `Created “${title}” with ${chosen.length} ${chosen.length === 1 ? "page" : "pages"} in My Bookshelf.`,
      );
      setSelecting(false);
      setSelectedPages([]);
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "Could not create the book.");
    }
  };

  const readyPages = pages.filter((page) => page.src);

  const exportPdf = async () => {
    if (!readyPages.length) return;
    setExporting(true);
    try {
      await exportPagesToPdf(
        bookTitle || "My coloring book",
        readyPages.map((page) => ({ src: page.src as string, paint: page.paint ?? null })),
      );
      setSaveMessage("PDF downloaded!");
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "Could not build the PDF.");
    } finally {
      setExporting(false);
    }
  };

  const exportZip = async () => {
    if (!readyPages.length) return;
    setExporting(true);
    try {
      await exportPagesToZip(
        bookTitle || "My coloring book",
        readyPages.map((page) => ({ src: page.src as string, paint: page.paint ?? null })),
      );
      setSaveMessage("ZIP downloaded!");
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "Could not build the ZIP.");
    } finally {
      setExporting(false);
    }
  };

  const exportPagePng = async (page: Page & { src: string }) => {
    try {
      await downloadFlattenedPage(
        { src: page.src, paint: page.paint ?? null },
        `${(bookTitle || "page").replace(/\s+/g, "-").toLowerCase()}-${page.id + 1}.png`,
      );
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "Could not export this page.");
    }
  };

  const shareBook = async () => {
    if (!readyPages.length) return;
    setSharing(true);
    try {
      const { url } = await createSharedGallery(
        bookTitle || "My coloring book",
        readyPages.map((page) => ({
          src: page.src as string,
          paint: page.paint ?? null,
          title: page.title || bookTitle,
        })),
      );
      setShareUrl(url);
      if (navigator.share) {
        try {
          await navigator.share({ title: bookTitle || "My coloring book", url });
        } catch {
          /* user cancelled */
        }
      }
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "Could not share this book.");
    } finally {
      setSharing(false);
    }
  };

  const startFresh = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    autoSavedRef.current.clear();
    setPages([]);
    setOpenPage(null);
    setBusyPage(null);
    setSaveMessage(null);
    setShareUrl(null);
    setGenError(null);
    setBookTitle("My coloring book");
    setStep("cover");
    setSelecting(false);
    setSelectedPages([]);
    void clearSession();
  };

  const openSavedBook = (book: SavedBook) => {
    autoSavedRef.current.clear();
    setBookTitle(book.title);
    setPageCount(book.pages.length);
    setPages(
      book.pages.map((src, i) => ({
        id: i,
        mode: "say" as PageMode,
        title: book.title,
        src,
        done: true,
        paint: book.paints?.[i] ?? null,
      })),
    );
    setOpenPage(null);
    setSaveMessage(null);
    setStep("book");
    setSelecting(false);
    setSelectedPages([]);
  };

  const runForPage = useCallback(async (id: number, source: PageSource, title: string) => {
    setGenError(null);
    setSaveMessage(null);
    setBusyPage(id);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPages((prev) =>
      prev.map((page) =>
        page.id === id
          ? { ...page, title, src: null, paint: null, done: false, error: undefined, source, regenerating: true }
          : page,
      ),
    );

    const onFrame = (src: string, isFinal: boolean) =>
      setPages((prev) =>
        prev.map((page) =>
          page.id === id ? { ...page, src, done: isFinal, regenerating: !isFinal } : page,
        ),
      );

    try {
      if (source.kind === "text") {
        await streamImage("/api/generate-image", source.prompt, onFrame, controller.signal);
      } else {
        await streamImageFromPhoto(
          "/api/photo-to-lineart",
          source.image,
          onFrame,
          source.variant,
          controller.signal,
        );
      }
      setPages((prev) =>
        prev.map((page) =>
          page.id === id ? { ...page, done: true, regenerating: false } : page,
        ),
      );
    } catch (err) {
      if (isAbortError(err)) {
        setPages((prev) =>
          prev.map((page) =>
            page.id === id
              ? { ...page, src: null, done: false, regenerating: false, error: "Cancelled" }
              : page,
          ),
        );
      } else {
        const message = err instanceof Error ? err.message : "Something went wrong";
        setPages((prev) =>
          prev.map((page) =>
            page.id === id
              ? {
                  ...page,
                  done: false,
                  regenerating: false,
                  error: message.includes("402")
                    ? "Out of AI credits — top up to keep drawing."
                    : "This page didn't draw. Try again.",
                }
              : page,
          ),
        );
      }
    } finally {
      abortRef.current = null;
      setBusyPage(null);
    }
  }, []);

  const regeneratePage = (id: number) => {
    const page = pages.find((item) => item.id === id);
    if (!page?.source) return;
    void runForPage(id, page.source, page.title);
  };

  const cancelPage = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusyPage(null);
  };

  // Speech heard for a page: prefill the confirm box.
  useEffect(() => {
    if (pendingCommand && speakFor !== null) {
      setTranscript(pendingCommand);
      clearPendingCommand();
    }
  }, [pendingCommand, speakFor, clearPendingCommand, setTranscript]);

  const openSpeak = (id: number) => {
    setGenError(null);
    setTranscript("");
    setSpeakFor(id);
  };

  const closeSpeak = () => {
    stop();
    setSpeakFor(null);
    setTranscript("");
  };

  const confirmSpeak = () => {
    const text = transcript.trim();
    if (speakFor === null || !text) return;
    stop();
    const id = speakFor;
    setSpeakFor(null);
    setTranscript("");
    void runForPage(id, { kind: "text", prompt: text }, text);
  };

  const openType = (id: number) => {
    setGenError(null);
    setTypedPrompt("");
    setTypeFor(id);
  };

  const closeType = () => {
    setTypeFor(null);
    setTypedPrompt("");
  };

  const confirmType = () => {
    const text = typedPrompt.trim();
    if (typeFor === null || !text) return;
    const id = typeFor;
    setTypeFor(null);
    setTypedPrompt("");
    void runForPage(id, { kind: "text", prompt: text }, text);
  };



  const openCamera = (id: number) => {
    setGenError(null);
    setPhotoFor(id);
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices?.getUserMedia === "function"
    ) {
      setCameraOpen(true);
      return;
    }
    snapInput.current?.click();
  };

  const openUpload = (id: number) => {
    setGenError(null);
    setPhotoFor(id);
    uploadInput.current?.click();
  };

  const usePhoto = async (file: File | undefined) => {
    if (!file) return;
    setPrepPhoto(await fileToDataUrl(file));
  };

  const activePage = pages.find((page) => page.id === openPage);

  // ---------- Studio ----------
  if (activePage?.src) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => setOpenPage(null)} className="btn-crayon">
            <ArrowLeft className="h-4 w-4" /> Back to my book
          </button>
          <button
            type="button"
            onClick={() => startSelectingWith(activePage.id)}
            className="btn-crayon"
          >
            <BookOpen className="h-4 w-4" /> Add this page to a book
          </button>
          <button
            type="button"
            onClick={() => void exportPdf()}
            disabled={exporting || !readyPages.length}
            className="btn-crayon disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            {exporting ? "Building PDF…" : "Export PDF"}
          </button>
          <button
            type="button"
            onClick={() => void exportZip()}
            disabled={exporting || !readyPages.length}
            className="btn-crayon disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileArchive className="h-4 w-4" />}
            {exporting ? "Building ZIP…" : "Export ZIP"}
          </button>
          <button
            type="button"
            onClick={() => void shareBook()}
            disabled={sharing || !readyPages.length}
            className="btn-crayon disabled:opacity-50"
          >
            {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
            {sharing ? "Sharing…" : "Share gallery"}
          </button>
        </div>
        <h1 className="mb-6 text-3xl font-extrabold capitalize">
          {activePage.title || bookTitle}{" "}
          <span className="text-muted-foreground">· page {activePage.id + 1}</span>
        </h1>
        <div className="mb-6">
          <MusicPlayer compact />
        </div>
        <ColoringCanvas
          key={activePage.id}
          src={activePage.src}
          title={activePage.title || bookTitle}
          pageIndex={activePage.id}
          initialPaint={activePage.paint ?? null}
          onPaintChange={(paint) =>
            setPages((prev) =>
              prev.map((page) => (page.id === activePage.id ? { ...page, paint } : page)),
            )
          }
        />
      </main>
    );
  }

  const savedPageRecords = savedBooks.filter(isSavedPage);

  const bookshelf =
    savedPageRecords.length > 0 ? (
      <section className="mt-14">
        <h2 className="flex flex-wrap items-center gap-2 text-2xl font-extrabold">
          <BookOpen className="h-6 w-6" /> My Pages
          <span className="text-base text-muted-foreground">
            · {savedPageRecords.length} saved · every new page saves itself
          </span>
          <span className="ml-auto flex flex-wrap gap-2">
            <Link to="/books" search={{ view: "pages" }} className="btn-crayon text-sm">
              <Library className="h-4 w-4" /> My Pages
            </Link>
            <Link to="/books" search={{ view: "bookshelf" }} className="btn-crayon text-sm">
              <BookOpen className="h-4 w-4" /> My Bookshelf
            </Link>
          </span>
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {savedPageRecords.map((book) => (
            <div key={book.id} className="paper-card p-3">
              <button
                type="button"
                onClick={() => openSavedBook(book)}
                className="block w-full text-left"
              >
                <img
                  src={book.pages[0]}
                  alt={`Saved page: ${book.title}`}
                  loading="lazy"
                  className="aspect-square w-full rounded-xl object-contain"
                />
                <p className="mt-2 truncate text-base font-extrabold capitalize">{book.title}</p>
                <p className="text-xs font-semibold text-muted-foreground">
                  {book.pages.length} {book.pages.length === 1 ? "page" : "pages"}
                </p>
              </button>
              <button
                type="button"
                onClick={async () => {
                  setSavedBooks(await deleteBook(book.id));
                  setSaveMessage(null);
                }}
                className="btn-crayon mt-3 w-full"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          ))}
        </div>
      </section>
    ) : null;

  // ---------- Cover ----------
  if (step === "cover") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="paper-card mx-auto max-w-md p-4 text-center sm:p-6">
          <img
            src={coverArt}
            alt="Color My World coloring book cover"
            width={1024}
            height={1280}
            className="mx-auto w-full rounded-xl border-2 border-border"
          />
          <p className="mt-4 text-lg font-extrabold">Say it or snap it. We draw it. You color it.</p>
          <button
            type="button"
            onClick={() => setStep("count")}
            className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-border bg-primary px-7 py-3 text-lg font-extrabold text-primary-foreground transition-transform hover:-translate-y-1"
          >
            <BookOpen className="h-5 w-5" /> Open my book
          </button>
          <div className="mt-4">
            <Link to="/books" className="btn-crayon text-sm">
              <Library className="h-4 w-4" /> My books
            </Link>
          </div>
        </div>
        {bookshelf}
        <MusicPlayer />
      </main>
    );
  }

  // ---------- Page count ----------
  if (step === "count") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <button type="button" onClick={() => setStep("cover")} className="btn-crayon">
          <ArrowLeft className="h-4 w-4" /> Back to the cover
        </button>
        <section className="paper-card mt-6 p-6 text-center sm:p-8">
          <h1 className="text-3xl font-extrabold">How many pages?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick how big your coloring book should be. You can fill each page one at a time.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {PAGE_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPageCount(n)}
                aria-pressed={pageCount === n}
                className={cn(
                  "h-14 w-14 rounded-full border-2 border-border text-xl font-extrabold transition-transform hover:-translate-y-0.5",
                  pageCount === n ? "bg-primary text-primary-foreground" : "bg-card text-foreground",
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <label className="mt-6 block text-sm font-bold">
            Name your book
            <input
              type="text"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              className="mt-2 w-full rounded-2xl border-2 border-border bg-background px-4 py-3 text-center text-lg font-semibold outline-none focus:border-accent"
            />
          </label>
          <button
            type="button"
            onClick={() => setStep("modes")}
            className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-border bg-accent px-7 py-3 text-lg font-extrabold text-accent-foreground transition-transform hover:-translate-y-1"
          >
            Next <ArrowRight className="h-5 w-5" />
          </button>
        </section>
        <MusicPlayer />
      </main>
    );
  }

  // ---------- Choose how each page gets filled ----------
  if (step === "modes") {
    const draft = pages.length === pageCount ? pages : blankPages(pageCount, "say");
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <button type="button" onClick={() => setStep("count")} className="btn-crayon">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <section className="paper-card mt-6 p-6 sm:p-8">
          <h1 className="text-center text-3xl font-extrabold">Say it, type it, or snap it?</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Choose how you want to fill each page. You can change it later on the page itself.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setPages(blankPages(pageCount, "say"))}
              className="btn-crayon"
            >
              <Mic className="h-4 w-4" /> Say it for every page
            </button>
            <button
              type="button"
              onClick={() => setPages(blankPages(pageCount, "type"))}
              className="btn-crayon"
            >
              <Keyboard className="h-4 w-4" /> Type it for every page
            </button>
            <button
              type="button"
              onClick={() => setPages(blankPages(pageCount, "snap"))}
              className="btn-crayon"
            >
              <Camera className="h-4 w-4" /> Snap it for every page
            </button>
          </div>

          <ul className="mt-6 space-y-2">
            {draft.map((page) => (
              <li
                key={page.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-border bg-card px-4 py-3"
              >
                <span className="text-sm font-extrabold">Page {page.id + 1}</span>
                <div className="flex flex-wrap gap-2">
                  {(["say", "type", "snap"] as PageMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      aria-pressed={page.mode === mode}
                      onClick={() =>
                        setPages(
                          draft.map((item) => (item.id === page.id ? { ...item, mode } : item)),
                        )
                      }
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border-2 border-border px-4 py-1.5 text-sm font-extrabold",
                        page.mode === mode
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-foreground",
                      )}
                    >
                      {mode === "say" ? (
                        <Mic className="h-4 w-4" />
                      ) : mode === "type" ? (
                        <Keyboard className="h-4 w-4" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                      {mode === "say" ? "Say it" : mode === "type" ? "Type it" : "Snap it"}

                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-7 text-center">
            <button
              type="button"
              onClick={() => {
                setPages(draft);
                setStep("book");
              }}
              className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-primary px-7 py-3 text-lg font-extrabold text-primary-foreground transition-transform hover:-translate-y-1"
            >
              <Sparkles className="h-5 w-5" /> Start my book
            </button>
          </div>
        </section>
        <MusicPlayer />
      </main>
    );
  }

  // ---------- The book ----------
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold capitalize sm:text-4xl">
            {bookTitle || "My coloring book"}
          </h1>
          <p className="text-sm font-semibold text-muted-foreground">
            {readyPages.length} of {pages.length} pages drawn
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {readyPages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelecting((prev) => {
                  const next = !prev;
                  if (!next) setSelectedPages([]);
                  else setCombineTitle(bookTitle);
                  return next;
                });
              }}
              className={cn("btn-crayon", selecting && "bg-primary text-primary-foreground")}
              aria-pressed={selecting}
            >
              <Check className="h-4 w-4" /> {selecting ? "Done selecting" : "Select pages"}
            </button>
          )}
          <button type="button" onClick={startFresh} className="btn-crayon">
            <RotateCcw className="h-4 w-4" /> Start a new book
          </button>
          <Link to="/books" className="btn-crayon">
            <Library className="h-4 w-4" /> My books
          </Link>
        </div>
      </header>

      {readyPages.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void exportPdf()}
            disabled={exporting}
            className="btn-crayon disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            {exporting ? "Building PDF…" : "Export PDF"}
          </button>
          <button
            type="button"
            onClick={() => void exportZip()}
            disabled={exporting}
            className="btn-crayon disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileArchive className="h-4 w-4" />}
            {exporting ? "Building ZIP…" : "Export ZIP"}
          </button>
          <button
            type="button"
            onClick={() => void shareBook()}
            disabled={sharing}
            className="btn-crayon disabled:opacity-50"
          >
            {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
            {sharing ? "Sharing…" : "Share gallery"}
          </button>
        </div>
      )}

      {saveMessage && <p className="mt-3 text-sm font-semibold text-primary">{saveMessage}</p>}
      {(genError || micError) && (
        <p className="mt-3 text-sm font-semibold text-primary">{genError ?? micError}</p>
      )}

      {shareUrl && (
        <div className="paper-card mt-5 p-4">
          <p className="text-sm font-bold">Your gallery is live!</p>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 rounded-xl border-2 border-border bg-card px-3 py-2 text-xs font-semibold text-foreground"
            />
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(shareUrl);
                setSaveMessage("Link copied!");
              }}
              className="btn-crayon text-sm"
            >
              Copy
            </button>
            <button
              type="button"
              onClick={() => setShareUrl(null)}
              className="rounded-full border-2 border-border p-2"
              aria-label="Close share link"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <MusicPlayer />

      <div className={cn("mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3", selecting && "pb-32")}>
        {pages.map((page) => {
          const working = page.regenerating || busyPage === page.id;
          const selectable = selecting && page.src && page.done;
          const isSelected = selectedPages.includes(page.id);
          return (
            <div key={page.id} className="paper-card p-3">
              <button
                type="button"
                disabled={(!page.src || !page.done) && !selectable}
                onClick={() => {
                  if (selectable) {
                    setSelectedPages((prev) =>
                      isSelected ? prev.filter((id) => id !== page.id) : [...prev, page.id],
                    );
                  } else {
                    setOpenPage(page.id);
                  }
                }}
                aria-pressed={selectable ? isSelected : undefined}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-xl border-2 bg-background transition-transform",
                  selectable ? "cursor-pointer" : "enabled:hover:-translate-y-1",
                  selectable && isSelected
                    ? "border-primary"
                    : "border-dashed border-border",
                )}
              >
                {page.src ? (
                  <div className="relative h-full w-full">
                    <img
                      src={page.src}
                      alt={`Coloring page ${page.id + 1}`}
                      className={cn(
                        "h-full w-full object-contain transition-[filter] duration-500",
                        page.done ? "blur-0" : "blur-md",
                      )}
                    />
                    {page.paint && (
                      <img
                        src={page.paint}
                        alt=""
                        className="pointer-events-none absolute inset-0 h-full w-full object-contain"
                      />
                    )}
                  </div>
                ) : working ? (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-xs font-bold">Drawing page {page.id + 1}…</span>
                  </div>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                    <span className="text-4xl font-extrabold text-border">{page.id + 1}</span>
                    <span className="text-xs font-bold">
                      {page.error ? page.error : "Blank page — fill it below"}
                    </span>
                  </div>
                )}
                <span className="absolute bottom-2 left-2 rounded-full border-2 border-border bg-card px-3 py-1 text-xs font-extrabold">
                  Page {page.id + 1}
                </span>
                {selectable ? (
                  <span
                    className={cn(
                      "absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border-2",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-transparent",
                    )}
                  >
                    <Check className="h-5 w-5" />
                  </span>
                ) : page.done && page.src ? (
                  <span className="absolute right-2 top-2 rounded-full border-2 border-border bg-primary p-1 text-primary-foreground">
                    <Check className="h-4 w-4" />
                  </span>
                ) : null}
              </button>

              {working ? (
                <button
                  type="button"
                  onClick={cancelPage}
                  className="btn-crayon mt-3 w-full justify-center border-primary text-primary"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
              ) : (
                <div className={cn("mt-3 flex flex-wrap gap-2", selecting && "pointer-events-none opacity-50")}>
                  <button
                    type="button"
                    onClick={() => openSpeak(page.id)}
                    disabled={busyPage !== null}
                    className="btn-crayon flex-1 justify-center text-sm disabled:opacity-50"
                  >
                    <Mic className="h-4 w-4" /> Speak
                  </button>
                  <button
                    type="button"
                    onClick={() => openType(page.id)}
                    disabled={busyPage !== null}
                    className="btn-crayon flex-1 justify-center text-sm disabled:opacity-50"
                  >
                    <Keyboard className="h-4 w-4" /> Type it
                  </button>

                  <button
                    type="button"
                    onClick={() => openCamera(page.id)}
                    disabled={busyPage !== null}
                    className="btn-crayon flex-1 justify-center text-sm disabled:opacity-50"
                  >
                    <Camera className="h-4 w-4" /> Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => openUpload(page.id)}
                    disabled={busyPage !== null}
                    className="btn-crayon flex-1 justify-center text-sm disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4" /> Upload
                  </button>
                  {page.source && (
                    <button
                      type="button"
                      onClick={() => regeneratePage(page.id)}
                      disabled={busyPage !== null}
                      className="btn-crayon flex-1 justify-center text-sm disabled:opacity-50"
                    >
                      <RefreshCw className="h-4 w-4" /> Redraw
                    </button>
                  )}
                  {page.src && page.done && (
                    <button
                      type="button"
                      onClick={() => void exportPagePng(page as Page & { src: string })}
                      className="btn-crayon flex-1 justify-center text-sm"
                      aria-label={`Export page ${page.id + 1} as PNG`}
                    >
                      <ImageDown className="h-4 w-4" /> PNG
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selecting && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-border bg-card p-4 shadow-lg">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
              <span className="rounded-full bg-primary px-3 py-1 text-primary-foreground">
                {selectedPages.length}
              </span>
              <span>
                {selectedPages.length === 1 ? "page selected" : "pages selected"}
              </span>
              <button
                type="button"
                onClick={() =>
                  setSelectedPages(pages.filter((p) => p.src && p.done).map((p) => p.id))
                }
                className="ml-2 rounded-full border-2 border-border px-3 py-1 text-xs font-extrabold hover:bg-muted"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => setSelectedPages([])}
                className="rounded-full border-2 border-border px-3 py-1 text-xs font-extrabold hover:bg-muted"
              >
                Clear
              </button>
            </div>
            <div className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:flex-none">
              <input
                type="text"
                value={combineTitle}
                onChange={(e) => setCombineTitle(e.target.value)}
                placeholder="Name your book"
                className="min-w-[12rem] flex-1 rounded-full border-2 border-border bg-background px-4 py-2 text-sm font-bold outline-none focus:border-accent sm:flex-none"
                aria-label="Book title"
              />
              <button
                type="button"
                onClick={() => void saveSelectedAsBook()}
                disabled={selectedPages.length === 0}
                className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-primary px-5 py-2 text-sm font-extrabold text-primary-foreground disabled:opacity-50"
              >
                <BookOpen className="h-4 w-4" /> Save as one book
              </button>
            </div>
          </div>
        </div>
      )}

      {bookshelf}

      {/* hidden inputs for photo pickers */}
      <input
        ref={uploadInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          void usePhoto(file);
        }}
      />
      <input
        ref={snapInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          void usePhoto(file);
        }}
      />

      {cameraOpen && (
        <CameraCapture
          max={1}
          onClose={() => setCameraOpen(false)}
          onFallback={() => {
            setCameraOpen(false);
            snapInput.current?.click();
          }}
          onCapture={(urls) => {
            setCameraOpen(false);
            if (urls[0]) setPrepPhoto(urls[0]);
          }}
        />
      )}

      {prepPhoto && (
        <PhotoPrep
          photos={[prepPhoto]}
          onCancel={() => {
            setPrepPhoto(null);
            setPhotoFor(null);
          }}
          onDone={(prepared) => {
            const image = prepared[0];
            const id = photoFor;
            setPrepPhoto(null);
            setPhotoFor(null);
            if (!image || id === null) return;
            void runForPage(id, { kind: "photo", image }, `Photo page ${id + 1}`);
          }}
        />
      )}

      {speakFor !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-3xl border-4 border-border bg-card p-6 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Page {speakFor + 1}
            </p>
            <h2 className="mt-1 text-2xl font-extrabold">Tell me what to draw</h2>

            <button
              type="button"
              onClick={() => (listening ? stop() : start())}
              disabled={!supported}
              className={cn(
                "mx-auto mt-5 flex h-24 w-24 items-center justify-center rounded-full border-4 border-border transition-transform disabled:opacity-50",
                listening
                  ? "animate-pulse bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:-translate-y-1",
              )}
              aria-label={listening ? "Stop listening" : "Start speaking"}
            >
              {listening ? <MicOff className="h-9 w-9" /> : <Mic className="h-9 w-9" />}
            </button>
            <p className="mt-2 text-sm font-bold">
              {listening ? "Listening… tap to stop" : supported ? "Tap and talk" : "Type it below"}
            </p>

            {supported && (
              <label className="mt-4 flex flex-col items-center gap-1 text-xs font-bold text-muted-foreground">
                Speak in any language
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="rounded-full border-2 border-border bg-card px-4 py-2 text-sm font-bold text-foreground outline-none focus:border-accent"
                >
                  <option value={AUTO_LANG}>Detect my language automatically</option>
                  {SPEECH_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
                {lang === AUTO_LANG && (
                  <span className="font-semibold normal-case">
                    Auto · listening in{" "}
                    {SPEECH_LANGUAGES.find((l) => l.code === detectedLang)?.label ?? detectedLang}
                  </span>
                )}
              </label>
            )}

            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={2}
              placeholder="e.g. a dragon eating pizza"
              className="mt-4 w-full rounded-2xl border-2 border-border bg-background px-4 py-3 text-center text-lg font-semibold outline-none focus:border-accent"
            />

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={confirmSpeak}
                disabled={!transcript.trim()}
                className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-accent px-6 py-2.5 text-base font-extrabold text-accent-foreground disabled:opacity-50"
              >
                <Check className="h-4 w-4" /> Yes, draw it
              </button>
              <button type="button" onClick={closeSpeak} className="btn-crayon">
                Cancel
              </button>
            </div>
            {micError && <p className="mt-3 text-sm font-semibold text-primary">{micError}</p>}
          </div>
        </div>
      )}

      {typeFor !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-3xl border-4 border-border bg-card p-6 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Page {typeFor + 1}
            </p>
            <h2 className="mt-1 text-2xl font-extrabold">Type what to draw</h2>

            <textarea
              value={typedPrompt}
              onChange={(e) => setTypedPrompt(e.target.value)}
              rows={3}
              autoFocus
              placeholder="e.g. a dragon eating pizza"
              className="mt-4 w-full rounded-2xl border-2 border-border bg-background px-4 py-3 text-center text-lg font-semibold outline-none focus:border-accent"
            />

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={confirmType}
                disabled={!typedPrompt.trim()}
                className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-accent px-6 py-2.5 text-base font-extrabold text-accent-foreground disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" /> Draw it
              </button>
              <button type="button" onClick={closeType} className="btn-crayon">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
