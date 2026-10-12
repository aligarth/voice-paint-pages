import { useEffect, useRef, useState } from "react";
import { Play, X } from "lucide-react";
import videoAsset from "@/assets/promo-video.mp4.asset.json";
import posterAsset from "@/assets/promo-poster.jpg.asset.json";

export function PromoVideo() {
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-crayon text-sm">
        <Play className="h-4 w-4" /> Watch how it works
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Color My Words promo video"
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-4"
          onClick={() => setOpen(false)}
        >
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close video"
              className="absolute -top-12 right-0 inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-card text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <video
              ref={videoRef}
              src={videoAsset.url}
              poster={posterAsset.url}
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full rounded-xl border-2 border-border bg-card"
            />
          </div>
        </div>
      )}
    </>
  );
}
