import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Sparkles, ArrowLeft, Loader2, Palette, Ear, BookmarkPlus, Trash2, BookOpen, Camera, Check, RefreshCw, FileDown, Library, Eye, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ColoringCanvas } from "@/components/ColoringCanvas";
import { MusicPlayer } from "@/components/MusicPlayer";
import { parseRequest, useSpeech } from "@/lib/useSpeech";
import { streamImage, streamImageFromPhoto } from "@/lib/streamImage";
import { deleteBook, listBooks, saveBook, MAX_BOOKS, type SavedBook } from "@/lib/savedBooks";
import { AUTO_LANG, SPEECH_LANGUAGES } from "@/lib/languages";
import { fileToDataUrl } from "@/lib/photo";
import { PhotoPrep } from "@/components/PhotoPrep";
import { exportPagesToPdf } from "@/lib/exportPdf";
import { clearSession, loadSession, saveSession } from "@/lib/session";
import { cn } from "@/lib/utils";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Say & Color — Voice-Made Coloring Books" },
      {
        name: "description",
        content:
          "Speak or snap a photo to create a custom coloring book, then color the pages in your browser with brushes, crayons and every color.",
      },
      { property: "og:title", content: "Say & Color — Voice-Made Coloring Books" },
      {
        property: "og:description",
        content:
          "Talk or snap a photo to get instant line-art coloring pages, then paint them with brushes, crayons and endless colors.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type PageSource =
  | { kind: "text"; prompt: string }
  | { kind: "photo"; image: string; variant?: string | undefined };

type Page = {
  id: number;
  title: string;
  src: string | null;
  done: boolean;
  error?: string | undefined;
  source?: PageSource | undefined;
  /** True while this single page is being re-drawn. */
  regenerating?: boolean | undefined;
  /** Transparent layer holding the user's colouring for this page. */
  paint?: string | null;
};

function Index() {
  const {
    supported,
    listening,
    transcript,
    error: micError,
    start,
    stop,
    setTranscript,
    wakeEnabled,
    wakeActive,
    pendingCommand,
    toggleWake,
    clearPendingCommand,
    lang,
    setLang,
    detectedLang,
  } = useSpeech();
  const [pages, setPages] = useState<Page[]>([]);
  const [busy, setBusy] = useState(false);
  const [bookTitle, setBookTitle] = useState("");
  const [openPage, setOpenPage] = useState<number | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [savedBooks, setSavedBooks] = useState<SavedBook[]>([]);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [heard, setHeard] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement | null>(null);
  const snapInput = useRef<HTMLInputElement | null>(null);
  const [photoPageCount, setPhotoPageCount] = useState(1);
  const [prepPhotos, setPrepPhotos] = useState<string[] | null>(null);
  const [snapShots, setSnapShots] = useState<string[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [restored, setRestored] = useState(false);
  const [keepIds, setKeepIds] = useState<number[]>([]);

  useEffect(() => {
    void listBooks().then(setSavedBooks);
  }, []);

  // Restore the last in-progress book (and page) on first load.
  useEffect(() => {
    void loadSession().then((session) => {
      setRestored(true);
      if (!session?.pages.length) return;
      setBookTitle(session.title);
      setPages(
        session.pages.map((page, i) => ({
          id: i,
          title: session.title,
          src: page.src,
          done: true,
          paint: page.paint ?? null,
        })),
      );
      setOpenPage(session.openPage);
      setSaveMessage("Picked up where you left off.");
    });
  }, []);

  // Auto-save progress so it survives a refresh or a closed tab.
  useEffect(() => {
    if (!restored || busy) return;
    const ready = pages.filter((page): page is Page & { src: string } => Boolean(page.src) && page.done);
    if (!ready.length) return;
    const timer = window.setTimeout(() => {
      void saveSession({
        title: bookTitle,
        pages: ready.map((page) => ({ src: page.src, paint: page.paint ?? null })),
        openPage,
      });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [pages, bookTitle, openPage, busy, restored]);

  const exportPdf = async () => {
    const ready = pages
      .filter((page) => page.src)
      .map((page) => ({ src: page.src as string, paint: page.paint ?? null }));
    if (!ready.length) return;
    setExporting(true);
    try {
      await exportPagesToPdf(bookTitle || "My coloring book", ready);
      setSaveMessage("PDF downloaded!");
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "Could not build the PDF.");
    } finally {
      setExporting(false);
    }
  };

  const handleSaveBook = async () => {
    const sources = pages.map((page) => page.src).filter((src): src is string => Boolean(src));
    if (!sources.length) return;
    try {
      setSavedBooks(await saveBook(bookTitle || "My coloring book", sources));
      setSaveMessage("Saved to your bookshelf!");
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "Could not save this book.");
    }
  };

  const startFresh = () => {
    setPages([]);
    setBookTitle("");
    setOpenPage(null);
    setSaveMessage(null);
    void clearSession();
  };

  const openSavedBook = (book: SavedBook) => {
    setBookTitle(book.title);
    setPages(book.pages.map((src, i) => ({ id: i, title: book.title, src, done: true })));
    setOpenPage(null);
    setSaveMessage(null);
  };



  const startReview = useCallback(() => {
    setPages((prev) => {
      setKeepIds(prev.filter((page) => page.src).map((page) => page.id));
      return prev;
    });
    setReviewing(true);
  }, []);

  const applyReview = () => {
    setPages((prev) =>
      prev.filter((page) => keepIds.includes(page.id)).map((page, i) => ({ ...page, id: i })),
    );
    setReviewing(false);
    setKeepIds([]);
  };

  const regeneratePage = async (id: number) => {
    const page = pages.find((item) => item.id === id);
    const source = page?.source;
    if (!source) return;
    setPages((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, src: null, done: false, error: undefined, regenerating: true } : item,
      ),
    );
    const onFrame = (src: string, isFinal: boolean) =>
      setPages((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, src, done: isFinal, regenerating: !isFinal } : item,
        ),
      );
    try {
      if (source.kind === "text") {
        await streamImage("/api/generate-image", source.prompt, onFrame);
      } else {
        await streamImageFromPhoto("/api/photo-to-lineart", source.image, onFrame, source.variant);
      }
      setPages((prev) =>
        prev.map((item) => (item.id === id ? { ...item, done: true, regenerating: false } : item)),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setPages((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                done: true,
                regenerating: false,
                error: message.includes("402")
                  ? "Out of AI credits — top up to keep drawing."
                  : "This page didn't draw. Try again.",
              }
            : item,
        ),
      );
    }
  };

  const generate = useCallback(
    async (rawText: string) => {
      const { subject, pages: count } = parseRequest(rawText);
      if (!subject) {
        setGenError("Tell me what to draw, like “five pages of friendly dinosaurs”.");
        return;
      }
      setGenError(null);
      setSaveMessage(null);
      setReviewing(false);
      setBookTitle(subject);
      setBusy(true);
      const variations = [
        "",
        " in a playful scene",
        " with a big smile, close up",
        " surrounded by flowers and stars",
        " having an adventure outdoors",
        " with a friend",
        " under a bright sun",
        " with patterns and swirls in the background",
        " celebrating with balloons",
        " resting peacefully",
        " in a busy landscape",
        " with decorative border details",
      ];
      const initial: Page[] = Array.from({ length: count }, (_, i) => ({
        id: i,
        title: subject,
        src: null,
        done: false,
        source: {
          kind: "text" as const,
          prompt: `${subject}${variations[i % variations.length] ?? ""}`,
        },
      }));
      setPages(initial);

      for (let i = 0; i < count; i++) {
        try {
          await streamImage(
            "/api/generate-image",
            `${subject}${variations[i % variations.length] ?? ""}`,
            (dataUrl, isFinal) => {
              setPages((prev) =>
                prev.map((page) =>
                  page.id === i ? { ...page, src: dataUrl, done: isFinal } : page,
                ),
              );
            },
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : "Something went wrong";
          console.error("page generation failed", message);
          setPages((prev) =>
            prev.map((page) =>
              page.id === i
                ? {
                    ...page,
                    done: true,
                    error: message.includes("402")
                      ? "Out of AI credits — top up to keep drawing."
                      : "This page didn't draw. Try again.",
                  }
                : page,
            ),
          );
        }
      }
      setBusy(false);
      startReview();
    },
    [startReview],
  );

  const pickPhotos = useCallback(async (files: File[]) => {
    if (!files.length) return;
    setGenError(null);
    const urls = await Promise.all(files.map((file) => fileToDataUrl(file)));
    setPrepPhotos(urls);
  }, []);

  const addSnaps = useCallback(async (files: File[]) => {
    if (!files.length) return;
    setGenError(null);
    const urls = await Promise.all(files.map((file) => fileToDataUrl(file)));
    setSnapShots((prev) => [...prev, ...urls].slice(0, 12));
  }, []);

  const generateFromPhotos = useCallback(
    async (photos: string[], perPhoto: number) => {
      if (!photos.length) return;
      setGenError(null);
      setSaveMessage(null);
      setReviewing(false);
      setBookTitle("My photo coloring book");
      setBusy(true);
      const variants = [
        "",
        "Zoom in a little closer on the main subject for this version.",
        "Add a simple decorative background and border details for this version.",
        "Make the outlines chunkier and the shapes simpler for this version.",
      ];
      const jobs = photos.flatMap((src) =>
        Array.from({ length: perPhoto }, (_, v) => ({ src, variant: variants[v % variants.length] ?? "" })),
      );
      setPages(
        jobs.map((job, i) => ({
          id: i,
          title: "My photo coloring book",
          src: null,
          done: false,
          source: { kind: "photo" as const, image: job.src, variant: job.variant || undefined },
        })),
      );

      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i]!;
        try {
          await streamImageFromPhoto(
            "/api/photo-to-lineart",
            job.src,
            (src, isFinal) => {
              setPages((prev) =>
                prev.map((page) => (page.id === i ? { ...page, src, done: isFinal } : page)),
              );
            },
            job.variant || undefined,
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : "Something went wrong";
          setPages((prev) =>
            prev.map((page) =>
              page.id === i
                ? {
                    ...page,
                    done: true,
                    error: message.includes("402")
                      ? "Out of AI credits — top up to keep drawing."
                      : "This photo didn't turn into a page. Try another.",
                  }
                : page,
            ),
          );
        }
      }
      setBusy(false);
      startReview();
    },
    [startReview],
  );


  // Heard speech waits for confirmation instead of generating straight away.
  useEffect(() => {
    if (pendingCommand && !busy) {
      setHeard(pendingCommand);
      setTranscript(pendingCommand);
      clearPendingCommand();
    }
  }, [pendingCommand, busy, clearPendingCommand, setTranscript]);

  const activePage = pages.find((page) => page.id === openPage);

  if (activePage?.src) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <button type="button" onClick={() => setOpenPage(null)} className="btn-crayon mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to my book
        </button>
        <h1 className="mb-6 text-3xl font-extrabold capitalize">
          {activePage.title} <span className="text-muted-foreground">· page {activePage.id + 1}</span>
        </h1>
        <div className="mb-6">
          <MusicPlayer compact />
        </div>
        <ColoringCanvas
          key={activePage.id}
          src={activePage.src}
          title={activePage.title}
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

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="text-center">
        <span className="btn-crayon mx-auto text-[0.7rem] uppercase tracking-widest">
          <Palette className="h-4 w-4" /> On-demand coloring book
        </span>
        <h1 className="mt-5 text-5xl font-extrabold leading-tight sm:text-6xl">
          Say it or snap it.
          <br />
          <span className="text-primary">We draw it.</span> You color it.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          Describe your picture or snap a photo with your camera, then get clean line-art pages
          ready to paint with brushes, crayons and every color there is.
        </p>
        <Link to="/books" className="btn-crayon mx-auto mt-5 text-sm">
          <Library className="h-4 w-4" /> My books
        </Link>
      </header>

      <section className="paper-card mx-auto mt-10 max-w-2xl p-6 sm:p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-start justify-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const micActive = wakeActive || (!wakeEnabled && listening);
                  micActive ? stop() : start();
                }}
                disabled={!supported || busy}
                className={cn(
                  "flex h-28 w-28 items-center justify-center rounded-full border-4 border-border text-primary-foreground transition-transform disabled:opacity-50",
                  listening || wakeActive
                    ? "animate-pulse bg-primary"
                    : "bg-secondary text-secondary-foreground hover:-translate-y-1",
                )}
                aria-label={wakeActive ? "Stop listening" : wakeEnabled ? "Start speaking" : listening ? "Stop listening" : "Start speaking"}
              >
                {wakeActive || (!wakeEnabled && listening) ? (
                  <MicOff className="h-10 w-10" />
                ) : (
                  <Mic className="h-10 w-10" />
                )}
              </button>
              <p className="text-sm font-bold">
                {wakeActive
                  ? "Say your request…"
                  : wakeEnabled
                    ? "Listening for 'Color my day'"
                    : listening
                      ? "Listening… tap to stop"
                      : supported
                        ? "Tap and talk"
                        : "Or type below"}
              </p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => snapInput.current?.click()}
                disabled={busy}
                className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-border bg-secondary text-secondary-foreground transition-transform hover:-translate-y-1 disabled:opacity-50"
                aria-label="Snap a photo"
              >
                <Camera className="h-10 w-10" />
              </button>
              <p className="text-sm font-bold">
                {snapShots.length ? `Snap another (${snapShots.length})` : "Snap it"}
              </p>
            </div>
          </div>

          {snapShots.length > 0 && (
            <div className="w-full rounded-2xl border-2 border-dashed border-border bg-card/60 p-4">
              <p className="text-center text-sm font-bold">
                {snapShots.length} photo{snapShots.length === 1 ? "" : "s"} in this session
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {snapShots.map((src, i) => (
                  <div key={`${i}-${src.slice(-12)}`} className="relative">
                    <img
                      src={src}
                      alt={`Snapped photo ${i + 1}`}
                      className="h-20 w-20 rounded-xl border-2 border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setSnapShots((prev) => prev.filter((_, j) => j !== i))}
                      aria-label={`Remove photo ${i + 1}`}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-border bg-card text-xs font-extrabold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => snapInput.current?.click()}
                  disabled={busy || snapShots.length >= 12}
                  className="btn-crayon disabled:opacity-50"
                >
                  <Camera className="h-4 w-4" /> Snap another
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPrepPhotos(snapShots);
                    setSnapShots([]);
                  }}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-primary px-6 py-2.5 text-base font-extrabold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  Use these {snapShots.length} photo{snapShots.length === 1 ? "" : "s"}
                </button>
                <button
                  type="button"
                  onClick={() => setSnapShots([])}
                  className="text-sm font-bold text-muted-foreground underline"
                >
                  Clear
                </button>
              </div>
            </div>
          )}


          {supported && (
            <button
              type="button"
              onClick={toggleWake}
              className={cn(
                "flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors",
                wakeEnabled
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-accent/10",
              )}
              aria-pressed={wakeEnabled}
            >
              <Ear className="h-4 w-4" />
              {wakeEnabled ? "'Color my day' is on" : "Listen for 'Color my day'"}
            </button>
          )}

          {supported && (
            <label className="flex flex-col items-center gap-1 text-xs font-bold text-muted-foreground">
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

          {supported && (
            <p className="max-w-md text-center text-xs text-muted-foreground">
              {wakeEnabled
                ? "Keep this tab open. Your mic stays active so the wake phrase works."
                : "Tap the mic or type your request below."}
            </p>
          )}


          {heard && !busy && (
            <div className="w-full rounded-2xl border-2 border-accent bg-accent/10 p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                I heard
              </p>
              <p className="mt-1 text-lg font-extrabold">“{heard}”</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Edit it below if that's not right, then confirm.
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setHeard(null);
                    stop();
                    void generate(transcript);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-accent px-5 py-2 text-sm font-extrabold text-accent-foreground"
                >
                  <Check className="h-4 w-4" /> Yes, draw it
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHeard(null);
                    setTranscript("");
                    start();
                  }}
                  className="btn-crayon"
                >
                  <Mic className="h-4 w-4" /> Say it again
                </button>
              </div>
            </div>
          )}

          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={2}
            placeholder="e.g. four pages of a dragon baking cupcakes"
            className="w-full rounded-2xl border-2 border-border bg-background px-4 py-3 text-center text-lg font-semibold outline-none focus:border-accent"
          />

          <button
            type="button"
            onClick={() => {
              clearPendingCommand();
              setHeard(null);
              stop();
              void generate(transcript);
            }}
            disabled={busy || !transcript.trim()}
            className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-accent px-7 py-3 text-lg font-extrabold text-accent-foreground transition-transform hover:-translate-y-1 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            {busy ? "Drawing your book…" : "Make my coloring book"}
          </button>


          {(micError || genError) && (
            <p className="text-sm font-semibold text-primary">{micError ?? genError}</p>
          )}
        </div>
      </section>

      <MusicPlayer />

      <section className="paper-card mx-auto mt-6 max-w-2xl p-6 text-center sm:p-8">
        <h2 className="flex items-center justify-center gap-2 text-2xl font-extrabold">
          <Camera className="h-6 w-6" /> Make a book from your photos
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Pick a few from your gallery and we'll turn each one into coloring pages. You'll get camera
          tips plus a quick crop and brightness step first.
        </p>
        <input
          ref={photoInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []).slice(0, 12);
            e.target.value = "";
            void pickPhotos(files);
          }}
        />
        <input
          ref={snapInput}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []).slice(0, 12);
            e.target.value = "";
            void addSnaps(files);
          }}
        />
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="text-sm font-bold">Pages per photo:</span>
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPhotoPageCount(n)}
              aria-pressed={photoPageCount === n}
              className={cn(
                "h-10 w-10 rounded-full border-2 border-border text-base font-extrabold transition-transform hover:-translate-y-0.5",
                photoPageCount === n
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground",
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => photoInput.current?.click()}
          disabled={busy}
          className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-border bg-secondary px-7 py-3 text-lg font-extrabold text-secondary-foreground transition-transform hover:-translate-y-1 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
          {busy ? "Turning photos into pages…" : "Choose photos"}
        </button>
      </section>

      {pages.length > 0 && (
        <section className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-extrabold capitalize">
              {bookTitle} <span className="text-muted-foreground">· {pages.length} {pages.length === 1 ? "page" : "pages"}</span>
            </h2>
            <div className="flex flex-col items-end gap-1">
              <button
                type="button"
                onClick={() => void handleSaveBook()}
                disabled={busy || !pages.some((page) => page.src)}
                className="btn-crayon disabled:opacity-50"
              >
                <BookmarkPlus className="h-4 w-4" /> Save book ({savedBooks.length}/{MAX_BOOKS})
              </button>
              <button
                type="button"
                onClick={() => void exportPdf()}
                disabled={exporting || !pages.some((page) => page.src)}
                className="btn-crayon disabled:opacity-50"
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                {exporting ? "Building PDF…" : "Export PDF"}
              </button>
              <button type="button" onClick={startFresh} disabled={busy} className="btn-crayon disabled:opacity-50">
                <Sparkles className="h-4 w-4" /> Start a new book
              </button>
              {saveMessage && (
                <span className="text-xs font-semibold text-primary">{saveMessage}</span>
              )}
            </div>
          </div>

          {reviewing && (
            <div className="paper-card mt-5 flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="text-sm font-bold">
                Review your variations — tap a thumbnail to keep or skip it.{" "}
                <span className="text-muted-foreground">{keepIds.length} of {pages.length} kept</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setKeepIds(pages.filter((page) => page.src).map((page) => page.id))}
                  className="btn-crayon text-sm"
                >
                  Keep all
                </button>
                <button
                  type="button"
                  onClick={applyReview}
                  disabled={!keepIds.length}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-primary px-5 py-2 text-sm font-extrabold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" /> Apply to my book
                </button>
              </div>
            </div>
          )}

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => {
              const kept = keepIds.includes(page.id);
              return (
                <div key={page.id} className="relative">
                  <button
                    type="button"
                    disabled={!page.src}
                    onClick={() =>
                      reviewing
                        ? setKeepIds((prev) =>
                            prev.includes(page.id)
                              ? prev.filter((id) => id !== page.id)
                              : [...prev, page.id],
                          )
                        : setOpenPage(page.id)
                    }
                    className={cn(
                      "paper-card group relative block aspect-square w-full overflow-hidden p-2 text-left transition-transform enabled:hover:-translate-y-1 disabled:cursor-wait",
                      reviewing && !kept && "opacity-45",
                      reviewing && kept && "ring-4 ring-primary",
                    )}
                  >
                    {page.src ? (
                      <img
                        src={page.src}
                        alt={`Coloring page ${page.id + 1}: ${page.title}`}
                        className={cn(
                          "h-full w-full object-contain transition-[filter] duration-500",
                          page.done ? "blur-0" : "blur-md",
                        )}
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                        {page.error ? (
                          <span className="px-4 text-center text-sm font-semibold text-primary">
                            {page.error}
                          </span>
                        ) : (
                          <>
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="text-xs font-bold">
                              {page.regenerating ? "Re-drawing" : "Sketching"} page {page.id + 1}…
                            </span>
                          </>
                        )}
                      </div>
                    )}
                    <span className="absolute bottom-2 left-2 rounded-full border-2 border-border bg-card px-3 py-1 text-xs font-extrabold">
                      Page {page.id + 1}
                    </span>
                    {reviewing && kept && (
                      <span className="absolute right-2 top-2 rounded-full border-2 border-border bg-primary p-1 text-primary-foreground">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                  </button>
                  {page.source && (
                    <button
                      type="button"
                      onClick={() => void regeneratePage(page.id)}
                      disabled={busy || page.regenerating}
                      className="btn-crayon mt-2 w-full justify-center text-sm disabled:opacity-50"
                    >
                      <RefreshCw
                        className={cn("h-4 w-4", page.regenerating && "animate-spin")}
                      />
                      {page.regenerating ? "Re-drawing…" : "Regenerate this page"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

        </section>
      )}

      {savedBooks.length > 0 && (
        <section className="mt-14">
          <h2 className="flex items-center gap-2 text-2xl font-extrabold">
            <BookOpen className="h-6 w-6" /> My bookshelf
            <span className="text-base text-muted-foreground">· {savedBooks.length}/{MAX_BOOKS} saved</span>
            <Link to="/books" className="btn-crayon ml-auto text-sm">
              <Library className="h-4 w-4" /> My books
            </Link>
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {savedBooks.map((book) => (
              <div key={book.id} className="paper-card p-3">
                <button
                  type="button"
                  onClick={() => openSavedBook(book)}
                  className="block w-full text-left"
                >
                  <img
                    src={book.pages[0]}
                    alt={`Saved book: ${book.title}`}
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
      )}

      {prepPhotos && (
        <PhotoPrep
          photos={prepPhotos}
          onCancel={() => setPrepPhotos(null)}
          onDone={(prepared) => {
            setPrepPhotos(null);
            void generateFromPhotos(prepared, photoPageCount);
          }}
        />
      )}
    </main>
  );
}
