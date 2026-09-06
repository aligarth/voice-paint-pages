import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchSharedGallery, type SharedGallery } from "@/lib/share";
import { ArrowLeft, BookOpen, Printer, Share2 } from "lucide-react";

export const Route = createFileRoute("/gallery/$id")({
  head: ({ params }) => ({
    meta: [
      { title: "A shared coloring book — Color My World" },
      {
        name: "description",
        content: "Flip through a finished coloring book, page by page, shared from Color My World.",
      },
      { property: "og:title", content: "A shared coloring book — Color My World" },
      {
        property: "og:description",
        content: "Flip through a finished coloring book, page by page, shared from Color My World.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const { id } = Route.useParams();
  const [gallery, setGallery] = useState<SharedGallery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchSharedGallery(id)
      .then((data) => {
        if (!mounted) return;
        if (!data) {
          setError("We couldn't find that gallery. It may have expired or the link is incorrect.");
        } else {
          setGallery(data);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load gallery");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: gallery?.title ?? "My coloring book", url });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 text-center">
        <p className="text-lg text-foreground">Loading gallery…</p>
      </div>
    );
  }

  if (error || !gallery) {
    return (
      <div className="min-h-screen bg-background p-6 text-center">
        <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="mb-2 font-display text-2xl">Gallery not found</h1>
        <p className="mb-6 text-muted-foreground">{error ?? "This gallery doesn't exist."}</p>
        <Link to="/" className="btn-crayon">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link to="/" className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              <ArrowLeft className="h-4 w-4" /> Home
            </Link>
            <h1 className="font-display text-2xl md:text-3xl">{gallery.title}</h1>
            <p className="text-sm text-muted-foreground">
              {gallery.pages.length} page{gallery.pages.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => window.print()} className="btn-crayon">
              <Printer className="h-4 w-4" /> Print
            </button>
            <button type="button" onClick={handleShare} className="btn-crayon">
              <Share2 className="h-4 w-4" /> Share link
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.pages.map((page, index) => (
            <div
              key={index}
              className="paper-card flex flex-col items-center gap-3 overflow-hidden p-3"
            >
              <div className="relative w-full rounded-xl border-2 border-border bg-white">
                <img
                  src={page.paint ?? page.src}
                  alt={`${page.title} coloring page ${index + 1}`}
                  className="aspect-[3/4] w-full rounded-xl object-contain"
                  loading="lazy"
                />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">
                {page.title || `Page ${index + 1}`}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
