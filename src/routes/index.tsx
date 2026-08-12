import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Mic, MicOff, Sparkles, ArrowLeft, Loader2, Palette, Ear } from "lucide-react";
import { ColoringCanvas } from "@/components/ColoringCanvas";
import { parseRequest, useSpeech } from "@/lib/useSpeech";
import { streamImage } from "@/lib/streamImage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Say & Color — Voice-Made Coloring Books" },
      {
        name: "description",
        content:
          "Speak what you want to draw, choose how many pages, and color your custom coloring book right in the browser with brushes, crayons and every color.",
      },
      { property: "og:title", content: "Say & Color — Voice-Made Coloring Books" },
      {
        property: "og:description",
        content:
          "Talk into your mic, get instant line-art coloring pages, and paint them with brushes, crayons and endless colors.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Page = {
  id: number;
  title: string;
  src: string | null;
  done: boolean;
  error?: string;
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
  } = useSpeech();
  const [pages, setPages] = useState<Page[]>([]);
  const [busy, setBusy] = useState(false);
  const [bookTitle, setBookTitle] = useState("");
  const [openPage, setOpenPage] = useState<number | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const generate = useCallback(
    async (rawText: string) => {
      const { subject, pages: count } = parseRequest(rawText);
      if (!subject) {
        setGenError("Tell me what to draw, like “five pages of friendly dinosaurs”.");
        return;
      }
      setGenError(null);
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
    },
    [],
  );

  useEffect(() => {
    if (pendingCommand && !busy) {
      generate(pendingCommand);
      clearPendingCommand();
    }
  }, [pendingCommand, busy, generate, clearPendingCommand]);

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
        <ColoringCanvas src={activePage.src} title={activePage.title} />
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
          Say it. <span className="text-primary">We draw it.</span>
          <br />
          You color it.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          Hold the mic and describe your picture — “six pages of sea turtles surfing”. Your pages
          appear as clean line art, ready to paint with brushes, crayons and every color there is.
        </p>
      </header>

      <section className="paper-card mx-auto mt-10 max-w-2xl p-6 sm:p-8">
        <div className="flex flex-col items-center gap-4">
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

          <p className="max-w-md text-center text-xs text-muted-foreground">
            {wakeEnabled
              ? "Keep this tab open. Your mic stays active so the wake phrase works."
              : "Or type your request below."}
          </p>

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

      {pages.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-extrabold capitalize">
            {bookTitle} <span className="text-muted-foreground">· {pages.length} {pages.length === 1 ? "page" : "pages"}</span>
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => (
              <button
                key={page.id}
                type="button"
                disabled={!page.src}
                onClick={() => setOpenPage(page.id)}
                className="paper-card group relative aspect-square overflow-hidden p-2 text-left transition-transform enabled:hover:-translate-y-1 disabled:cursor-wait"
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
                        <span className="text-xs font-bold">Sketching page {page.id + 1}…</span>
                      </>
                    )}
                  </div>
                )}
                <span className="absolute bottom-2 left-2 rounded-full border-2 border-border bg-card px-3 py-1 text-xs font-extrabold">
                  Page {page.id + 1}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
