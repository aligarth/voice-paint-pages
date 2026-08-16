import { useEffect, useRef, useState } from "react";
import { Camera, Check, Crop, Sun, X, ArrowRight, Lock, LockOpen, Smile, Box, Square, Image as ImageIcon } from "lucide-react";
import { DEFAULT_ADJUST, adjustPhoto, type PhotoAdjust } from "@/lib/photo";
import { cn } from "@/lib/utils";

type Props = {
  /** Downscaled data URLs of the picked photos, in order. */
  photos: string[];
  onCancel: () => void;
  /** Called with the prepared (cropped + adjusted) data URLs. */
  onDone: (prepared: string[]) => void;
};

const TIPS = [
  "Fill the frame with one clear subject",
  "Use bright, even light — avoid harsh shadows",
  "Hold steady and shoot straight-on, not at an angle",
  "Plain background = cleaner outlines",
];

/** Smart framing presets — fractions of the source photo. */
const PRESETS = [
  { id: "full", label: "Full photo", icon: ImageIcon, crop: { x: 0, y: 0, w: 1, h: 1 } },
  { id: "face", label: "Face", icon: Smile, crop: { x: 0.2, y: 0.06, w: 0.6, h: 0.6 } },
  { id: "object", label: "Object", icon: Box, crop: { x: 0.12, y: 0.12, w: 0.76, h: 0.76 } },
] as const;

/** Guided crop + brightness/contrast step before turning photos into line art. */
export function PhotoPrep({ photos, onCancel, onDone }: Props) {
  const [index, setIndex] = useState(0);
  const [adjust, setAdjust] = useState<PhotoAdjust>(DEFAULT_ADJUST);
  const [ready, setReady] = useState<string[]>([]);
  const [working, setWorking] = useState(false);
  const [locked, setLocked] = useState(false);
  const [preset, setPreset] = useState<string>("full");
  const frame = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);

  // Keep framing when the crop is locked, otherwise reset for each new photo.
  useEffect(() => {
    if (!locked) {
      setAdjust(DEFAULT_ADJUST);
      setPreset("full");
    }
  }, [index, locked]);

  const current = photos[index];
  if (!current) return null;

  const point = (e: React.PointerEvent) => {
    const box = frame.current?.getBoundingClientRect();
    if (!box) return null;
    return {
      x: Math.min(1, Math.max(0, (e.clientX - box.left) / box.width)),
      y: Math.min(1, Math.max(0, (e.clientY - box.top) / box.height)),
    };
  };

  const handleDown = (e: React.PointerEvent) => {
    if (locked) return;
    const p = point(e);
    if (!p) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = p;
    setAdjust((a) => ({ ...a, crop: { x: p.x, y: p.y, w: 0.02, h: 0.02 } }));
  };

  const handleMove = (e: React.PointerEvent) => {
    if (!drag.current || locked) return;
    const p = point(e);
    if (!p) return;
    const start = drag.current;
    setPreset("custom");
    setAdjust((a) => ({
      ...a,
      crop: {
        x: Math.min(start.x, p.x),
        y: Math.min(start.y, p.y),
        w: Math.max(0.05, Math.abs(p.x - start.x)),
        h: Math.max(0.05, Math.abs(p.y - start.y)),
      },
    }));
  };

  const handleUp = () => {
    drag.current = null;
  };

  const next = async () => {
    setWorking(true);
    const prepared = await adjustPhoto(current, adjust);
    const all = [...ready, prepared];
    setWorking(false);
    if (index + 1 < photos.length) {
      setReady(all);
      setIndex(index + 1);
    } else {
      onDone(all);
    }
  };

  const { crop } = adjust;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/60 p-4">
      <div className="paper-card my-6 w-full max-w-2xl p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-extrabold">
            <Camera className="h-5 w-5" /> Get it camera-ready
            <span className="text-sm font-bold text-muted-foreground">
              {index + 1}/{photos.length}
            </span>
          </h2>
          <button type="button" onClick={onCancel} aria-label="Cancel" className="btn-crayon">
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="mt-3 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
          {TIPS.map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {tip}
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-2 text-sm font-bold">
            <Crop className="h-4 w-4" /> Framing
          </span>
          {PRESETS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setPreset(item.id);
                  setAdjust((a) => ({ ...a, crop: { ...item.crop } }));
                }}
                aria-pressed={preset === item.id}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border-2 border-border px-3 py-1.5 text-sm font-extrabold transition-transform hover:-translate-y-0.5",
                  preset === item.id ? "bg-primary text-primary-foreground" : "bg-card",
                )}
              >
                <Icon className="h-4 w-4" /> {item.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setAdjust((a) => ({ ...a, border: a.border === false }))}
            aria-pressed={adjust.border !== false}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border-2 border-border px-3 py-1.5 text-sm font-extrabold transition-transform hover:-translate-y-0.5",
              adjust.border !== false ? "bg-primary text-primary-foreground" : "bg-card",
            )}
          >
            <Square className="h-4 w-4" /> Add border
          </button>
          <button
            type="button"
            onClick={() => setLocked((v) => !v)}
            aria-pressed={locked}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border-2 border-border px-3 py-1.5 text-sm font-extrabold transition-transform hover:-translate-y-0.5",
              locked ? "bg-primary text-primary-foreground" : "bg-card",
            )}
          >
            {locked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
            {locked ? "Crop locked" : "Lock crop"}
          </button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {locked
            ? "This crop, brightness and contrast stay the same for every photo."
            : "Pick a preset or drag on the photo to crop to your subject."}
        </p>
        <div
          ref={frame}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          className="relative mt-2 touch-none select-none overflow-hidden rounded-2xl border-2 border-border bg-muted"
        >
          <img
            src={current}
            alt={`Photo ${index + 1} preview`}
            className="block w-full"
            style={{ filter: `brightness(${adjust.brightness}) contrast(${adjust.contrast})` }}
            draggable={false}
          />
          {(crop.w < 0.999 || crop.h < 0.999) && (
            <div
              className="pointer-events-none absolute border-2 border-dashed border-primary bg-primary/10"
              style={{
                left: `${crop.x * 100}%`,
                top: `${crop.y * 100}%`,
                width: `${crop.w * 100}%`,
                height: `${crop.h * 100}%`,
              }}
            />
          )}
          {adjust.border !== false && (
            <div className="pointer-events-none absolute inset-[3%] border-4 border-foreground" />
          )}
        </div>


        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold">
            <span className="flex items-center gap-2">
              <Sun className="h-4 w-4" /> Brightness
            </span>
            <input
              type="range"
              min={0.6}
              max={1.8}
              step={0.05}
              value={adjust.brightness}
              onChange={(e) => setAdjust((a) => ({ ...a, brightness: Number(e.target.value) }))}
              className="mt-1 w-full accent-primary"
            />
          </label>
          <label className="text-sm font-bold">
            Contrast
            <input
              type="range"
              min={0.6}
              max={2}
              step={0.05}
              value={adjust.contrast}
              onChange={(e) => setAdjust((a) => ({ ...a, contrast: Number(e.target.value) }))}
              className="mt-1 w-full accent-primary"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setAdjust(DEFAULT_ADJUST);
              setPreset("full");
            }}
            className="btn-crayon text-sm"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => void next()}
            disabled={working}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border-2 border-border bg-primary px-6 py-3 text-base font-extrabold text-primary-foreground transition-transform hover:-translate-y-1 disabled:opacity-50",
            )}
          >
            {index + 1 < photos.length ? (
              <>
                Next photo <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Make my pages <Check className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
