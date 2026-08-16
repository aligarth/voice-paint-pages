import { useEffect, useRef, useState } from "react";
import {
  Eraser,
  Paintbrush,
  Pencil,
  RotateCcw,
  Redo,
  Trash2,
  Download,
  Droplet,
  PanelRightOpen,
  PanelRightClose,
  Heart,
  X,
  Clock,
  PaintBucket,
} from "lucide-react";
import { BRUSH_SIZES, CRAYON_COLORS, SPECTRUM } from "@/lib/palette";
import { addFavoriteColor, getFavoriteColors, removeFavoriteColor } from "@/lib/favoriteColors";
import {
  deleteCheckpoint,
  listCheckpoints,
  restoreCheckpoint,
  saveCheckpoint,
  type Checkpoint,
} from "@/lib/checkpoints";
import { cn } from "@/lib/utils";


type Tool = "brush" | "crayon" | "marker" | "eraser" | "bucket";

const TOOLS: { id: Tool; label: string; icon: typeof Paintbrush }[] = [
  { id: "brush", label: "Paint brush", icon: Paintbrush },
  { id: "crayon", label: "Crayon", icon: Pencil },
  { id: "marker", label: "Marker", icon: Droplet },
  { id: "bucket", label: "Fill color", icon: PaintBucket },
  { id: "eraser", label: "Eraser", icon: Eraser },
];

export function ColoringCanvas({
  src,
  title,
  pageIndex = 0,
  initialPaint,
  onPaintChange,
}: {
  src: string;
  title: string;
  /** Which page of the current book this canvas represents. */
  pageIndex?: number;
  /** Previously saved transparent paint layer to restore. */
  initialPaint?: string | null;
  /** Called with the paint layer (data URL) whenever the drawing changes. */
  onPaintChange?: (paint: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lineArtRef = useRef<HTMLImageElement | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const previewMask = useRef<Uint8Array | null>(null);
  const wallCache = useRef<{ key: string; wall: Uint8Array } | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingFill = useRef<{ x: number; y: number } | null>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  /** canvas px per CSS px, so the size chips paint at the thickness they show. */
  const displayScale = useRef(1);
  const lastMid = useRef<{ x: number; y: number } | null>(null);
  const lastWidth = useRef<number | null>(null);
  const lastTime = useRef(0);
  const history = useRef<ImageData[]>([]);
  const future = useRef<ImageData[]>([]);

  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#ED0A3F");
  const [size, setSize] = useState(24);
  const [panelOpen, setPanelOpen] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [showCheckpoints, setShowCheckpoints] = useState(false);
  const [fillMessage, setFillMessage] = useState<string | null>(null);
  const [fillTolerance, setFillTolerance] = useState(32);
  const [fillMode, setFillMode] = useState<"closed" | "basic">("closed");


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    history.current = [];
    if (!initialPaint) return;
    const saved = new Image();
    saved.onload = () => ctx.drawImage(saved, 0, 0, canvas.width, canvas.height);
    saved.src = initialPaint;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  useEffect(() => {
    const preview = previewRef.current;
    if (preview) {
      preview.width = 1024;
      preview.height = 1024;
    }
    wallCache.current = null;
    clearPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, tool, size, color, fillTolerance]);

  useEffect(
    () => () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  useEffect(() => {
    setFavorites(getFavoriteColors());
    setCheckpoints(listCheckpoints(title, pageIndex));
  }, [title, pageIndex]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const paint = canvas.toDataURL("image/png");
      setCheckpoints(saveCheckpoint(title, pageIndex, paint));
    }, 45_000);
    return () => window.clearInterval(id);
  }, [title, pageIndex]);

  const reportPaint = () => {
    const canvas = canvasRef.current;
    if (!canvas || !onPaintChange) return;
    onPaintChange(canvas.toDataURL("image/png"));
  };

  const updateHistoryState = () => {
    setCanUndo(history.current.length > 0);
    setCanRedo(future.current.length > 0);
  };

  const pointFromEvent = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const pushHistory = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    history.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (history.current.length > 20) history.current.shift();
    future.current = [];
    updateHistoryState();
  };

  const strokeSegment = (
    from: { x: number; y: number },
    to: { x: number; y: number },
    pressure = 0,
  ) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const scaled = size * displayScale.current;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = scaled;

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = color;

    if (tool === "crayon") {
      ctx.globalAlpha = 0.28;
      const steps = Math.max(2, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 3));
      for (let pass = 0; pass < 3; pass++) {
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const jitter = (Math.random() - 0.5) * scaled * 0.35;
          const x = from.x + (to.x - from.x) * t + jitter;
          const y = from.y + (to.y - from.y) * t + jitter;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineWidth = scaled * (0.6 + pass * 0.2);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    if (tool === "brush") {
      // Smooth the path through midpoints so quick strokes curve instead of faceting.
      const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
      const start = lastMid.current ?? from;
      const now = performance.now();
      const dt = Math.max(8, now - (lastTime.current || now));
      const speed = Math.hypot(to.x - from.x, to.y - from.y) / dt;
      lastTime.current = now;

      // Faster strokes thin out; reported pen pressure wins when available.
      const dynamic = pressure > 0 ? 0.55 + pressure * 0.75 : 1.15 - Math.min(0.5, speed / 4);
      const target = scaled * Math.max(0.35, Math.min(1.3, dynamic));
      const width = lastWidth.current == null ? target : lastWidth.current * 0.6 + target * 0.4;
      lastWidth.current = width;

      const drawPass = (w: number, alpha: number) => {
        ctx.globalAlpha = alpha;
        ctx.lineWidth = Math.max(0.6, w);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.quadraticCurveTo(from.x, from.y, mid.x, mid.y);
        ctx.stroke();
      };

      drawPass(width * 1.35, 0.16); // soft bristle bleed
      drawPass(width, 0.95); // body
      drawPass(width * 0.45, 0.65); // loaded core

      lastMid.current = mid;
      ctx.restore();
      return;
    }

    ctx.globalAlpha = tool === "marker" ? 0.65 : 1;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  };

  const getLineArtData = async () => {
    const img = lineArtRef.current;
    if (!img || !img.complete) return null;
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  };

  const hexToRgba = (hex: string) => {
    const clean = hex.replace("#", "");
    const r = Number.parseInt(clean.slice(0, 2), 16);
    const g = Number.parseInt(clean.slice(2, 4), 16);
    const b = Number.parseInt(clean.slice(4, 6), 16);
    return { r, g, b, a: 255 };
  };

  const buildWallMap = (lineData: ImageData, width: number, height: number) => {
    const wall = new Uint8Array(width * height);
    const radius = Math.max(1, Math.floor(size / 4));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const lr = lineData.data[idx] ?? 0;
        const lg = lineData.data[idx + 1] ?? 0;
        const lb = lineData.data[idx + 2] ?? 0;
        const la = lineData.data[idx + 3] ?? 0;
        if (la >= 30 && (lr + lg + lb) / 3 < 90 + fillTolerance) {
          wall[y * width + x] = 1;
        }
      }
    }

    if (radius <= 1) return wall;

    const dilated = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (wall[y * width + x]) {
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              if (dx * dx + dy * dy > radius * radius) continue;
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                dilated[ny * width + nx] = 1;
              }
            }
          }
        }
      }
    }
    return dilated;
  };

  const getWallMap = async (width: number, height: number) => {
    const key = `${src}|${size}|${fillTolerance}`;
    if (wallCache.current && wallCache.current.key === key) return wallCache.current.wall;
    const lineData = await getLineArtData();
    if (!lineData) return null;
    const wall = buildWallMap(lineData, width, height);
    wallCache.current = { key, wall };
    return wall;
  };

  /** Detect the region that a fill at this point would cover. */
  const computeRegion = async (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return null;
    const width = canvas.width;
    const height = canvas.height;
    const sx = Math.max(0, Math.min(width - 1, Math.floor(startX)));
    const sy = Math.max(0, Math.min(height - 1, Math.floor(startY)));

    const paintData = ctx.getImageData(0, 0, width, height);
    const wallMap = await getWallMap(width, height);
    if (!wallMap) return null;

    const targetIdx = (sy * width + sx) * 4;
    const tr = paintData.data[targetIdx] ?? 0;
    const tg = paintData.data[targetIdx + 1] ?? 0;
    const tb = paintData.data[targetIdx + 2] ?? 0;
    const ta = paintData.data[targetIdx + 3] ?? 0;
    const tolerance = fillTolerance;

    const matchesTarget = (idx: number) => {
      const dr = (paintData.data[idx] ?? 0) - tr;
      const dg = (paintData.data[idx + 1] ?? 0) - tg;
      const db = (paintData.data[idx + 2] ?? 0) - tb;
      const da = (paintData.data[idx + 3] ?? 0) - ta;
      return Math.hypot(dr, dg, db, da) <= tolerance;
    };

    const isWall = (x: number, y: number) => wallMap[y * width + x] === 1;
    if (isWall(sx, sy)) return null;

    const visited = new Uint8Array(width * height);
    const stack: [number, number][] = [[sx, sy]];
    const pixels: [number, number][] = [];
    let touchesEdge = false;

    while (stack.length) {
      const [x, y] = stack.pop()!;
      const idx = (y * width + x) * 4;
      if (visited[y * width + x]) continue;
      if (!matchesTarget(idx)) continue;
      if (isWall(x, y)) continue;

      visited[y * width + x] = 1;
      pixels.push([x, y]);
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        touchesEdge = true;
      }

      if (x > 0) stack.push([x - 1, y]);
      if (x < width - 1) stack.push([x + 1, y]);
      if (y > 0) stack.push([x, y - 1]);
      if (y < height - 1) stack.push([x, y + 1]);
    }

    return { pixels, touchesEdge, visited, width, height, paintData };
  };

  const clearPreview = () => {
    const canvas = previewRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    previewMask.current = null;
  };

  const drawPreview = async (px: number, py: number) => {
    const canvas = previewRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const x = Math.floor(px);
    const y = Math.floor(py);
    const mask = previewMask.current;
    if (
      mask &&
      x >= 0 &&
      y >= 0 &&
      x < canvas.width &&
      y < canvas.height &&
      mask[y * canvas.width + x] === 1
    ) {
      return; // still inside the previewed region
    }

    const region = await computeRegion(px, py);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!region || !region.pixels.length) {
      previewMask.current = null;
      return;
    }

    const tint = region.touchesEdge
      ? { r: 239, g: 68, b: 68, a: 77 }
      : { ...hexToRgba(color), a: 102 };

    const overlay = ctx.createImageData(canvas.width, canvas.height);
    for (const [rx, ry] of region.pixels) {
      const idx = (ry * canvas.width + rx) * 4;
      overlay.data[idx] = tint.r;
      overlay.data[idx + 1] = tint.g;
      overlay.data[idx + 2] = tint.b;
      overlay.data[idx + 3] = tint.a;
    }
    ctx.putImageData(overlay, 0, 0);
    previewMask.current = region.visited;
  };

  const queuePreview = (px: number, py: number) => {
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      void drawPreview(px, py);
    });
  };

  const floodFill = async (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const region = await computeRegion(startX, startY);
    clearPreview();
    if (!region) return;

    if (region.touchesEdge) {
      setFillMessage("That area isn't closed — try a closed shape");
      window.setTimeout(() => setFillMessage(null), 2000);
      return;
    }

    if (region.pixels.length) {
      const fill = hexToRgba(color);
      const { paintData, width } = region;
      for (const [x, y] of region.pixels) {
        const idx = (y * width + x) * 4;
        paintData.data[idx] = fill.r;
        paintData.data[idx + 1] = fill.g;
        paintData.data[idx + 2] = fill.b;
        paintData.data[idx + 3] = fill.a;
      }
      ctx.putImageData(paintData, 0, 0);
      reportPaint();
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const point = pointFromEvent(e);
    if (tool === "bucket") {
      if (e.pointerType !== "mouse") {
        // Touch/pen: show the preview first, fill on release.
        pendingFill.current = point;
        void drawPreview(point.x, point.y);
        return;
      }
      pushHistory();
      void floodFill(point.x, point.y);
      return;
    }
    pushHistory();
    drawing.current = true;
    setIsDrawing(true);
    lastPoint.current = point;
    const rect = e.currentTarget.getBoundingClientRect();
    displayScale.current = rect.width ? Math.max(1, e.currentTarget.width / rect.width) : 1;
    lastMid.current = point;
    lastWidth.current = null;
    lastTime.current = performance.now();
    strokeSegment(point, { x: point.x + 0.01, y: point.y + 0.01 }, e.pressure);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === "bucket") {
      const point = pointFromEvent(e);
      if (e.pointerType !== "mouse") pendingFill.current = point;
      queuePreview(point.x, point.y);
      return;
    }
    if (!drawing.current || !lastPoint.current) return;
    const point = pointFromEvent(e);
    strokeSegment(lastPoint.current, point, e.pressure);
    lastPoint.current = point;
  };


  const onPointerUp = () => {
    if (tool === "bucket") {
      const pending = pendingFill.current;
      pendingFill.current = null;
      if (pending) {
        pushHistory();
        void floodFill(pending.x, pending.y);
      }
      return;
    }
    drawing.current = false;
    lastPoint.current = null;
    lastMid.current = null;
    lastWidth.current = null;
    setIsDrawing(false);
    reportPaint();
  };

  const onPointerLeave = () => {
    pendingFill.current = null;
    clearPreview();
    if (tool === "bucket") return;
    onPointerUp();
  };


  const undo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const previous = history.current.pop();
    if (!canvas || !ctx || !previous) return;
    future.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (future.current.length > 20) future.current.shift();
    ctx.putImageData(previous, 0, 0);
    updateHistoryState();
    reportPaint();
  };

  const redo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const next = future.current.pop();
    if (!canvas || !ctx || !next) return;
    history.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (history.current.length > 20) history.current.shift();
    ctx.putImageData(next, 0, 0);
    updateHistoryState();
    reportPaint();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    pushHistory();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateHistoryState();
    onPaintChange?.(null);
  };

  const download = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const out = document.createElement("canvas");
    out.width = canvas.width;
    out.height = canvas.height;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, 0, 0);
    const line = new Image();
    line.crossOrigin = "anonymous";
    line.src = src;
    await new Promise((resolve) => {
      line.onload = resolve;
      line.onerror = resolve;
    });
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(line, 0, 0, out.width, out.height);
    const link = document.createElement("a");
    link.href = out.toDataURL("image/png");
    link.download = `${title.replace(/\s+/g, "-").toLowerCase() || "coloring-page"}.png`;
    link.click();
  };

  const snapshotCheckpoint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const paint = canvas.toDataURL("image/png");
    setCheckpoints(saveCheckpoint(title, pageIndex, paint));
  };

  const loadCheckpoint = (id: string) => {
    const paint = restoreCheckpoint(title, pageIndex, id);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || paint === null) return;
    pushHistory();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (paint) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        reportPaint();
        updateHistoryState();
      };
      img.src = paint;
    } else {
      reportPaint();
      updateHistoryState();
    }
  };

  const removeCheckpoint = (id: string) => {
    setCheckpoints(deleteCheckpoint(title, pageIndex, id));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key.toLowerCase() === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      } else if (e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const showPanel = panelOpen && !isDrawing;

  return (
    <div
      className={cn(
        "grid gap-6 transition-all duration-300",
        showPanel ? "lg:grid-cols-[minmax(0,1fr)_20rem]" : "grid-cols-1",
      )}
    >
      <div className="paper-card relative aspect-square w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerLeave}
          className="absolute inset-0 h-full w-full touch-none"
          style={{ cursor: tool === "bucket" ? "pointer" : "crosshair" }}
        />
        <img
          ref={lineArtRef}
          src={src}
          alt={`Line art of ${title}`}
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain mix-blend-multiply"
          draggable={false}
        />
        <canvas
          ref={previewRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 h-full w-full"
        />


        {fillMessage && (
          <div className="pointer-events-none absolute left-1/2 top-6 z-20 -translate-x-1/2 rounded-full bg-card/90 px-4 py-2 text-sm font-semibold text-foreground shadow-md backdrop-blur animate-in fade-in slide-in-from-top-2">
            {fillMessage}
          </div>
        )}

        <button
          type="button"
          onClick={() => setPanelOpen((prev) => !prev)}
          className={cn(
            "absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-border/70 bg-card/90 text-foreground shadow-sm backdrop-blur transition-all hover:scale-110",
            isDrawing && "pointer-events-none opacity-0",
          )}
          aria-label={showPanel ? "Hide tools" : "Show tools"}
          title={showPanel ? "Hide tools" : "Show tools"}
        >
          {showPanel ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "flex flex-col gap-5 overflow-hidden transition-all duration-300",
          showPanel ? "opacity-100 lg:w-auto" : "max-h-0 opacity-0 lg:max-h-0 lg:w-0",
        )}
      >

        <section className="paper-card p-4">
          <h3 className="label-chalk">Tools</h3>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {TOOLS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-label={label}
                title={label}
                onClick={() => setTool(id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border-2 border-border/70 bg-card px-2 py-3 text-[0.65rem] font-semibold transition-transform hover:-translate-y-0.5",
                  tool === id && "border-accent bg-accent/15 text-accent-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {label.split(" ")[0]}
              </button>
            ))}
          </div>

          <h3 className="label-chalk mt-5">
            {tool === "bucket" ? "Wall width" : "Size"}
          </h3>
          <div className="mt-3 flex items-center gap-2">
            {BRUSH_SIZES.map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`Size ${value}`}
                onClick={() => setSize(value)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 border-border/70 bg-card transition-transform hover:-translate-y-0.5",
                  size === value && "border-accent bg-accent/15",
                )}
              >
                <span
                  className="block rounded-full bg-foreground"
                  style={{
                    width: Math.max(3, Math.min(22, value / 4)),
                    height: Math.max(3, Math.min(22, value / 4)),
                  }}
                />
              </button>
            ))}
          </div>

          {tool === "bucket" && (
            <>
              <h3 className="label-chalk mt-5 flex items-center justify-between">
                <span>Fill tolerance</span>
                <span className="text-xs font-semibold text-muted-foreground">{fillTolerance}</span>
              </h3>
              <input
                type="range"
                min={8}
                max={96}
                step={4}
                value={fillTolerance}
                onChange={(e) => setFillTolerance(Number(e.target.value))}
                aria-label="Fill tolerance"
                className="mt-3 w-full accent-accent"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Lower is stricter about closed boundaries; higher fills across faint or broken lines.
              </p>
            </>
          )}



          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className="btn-crayon disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" /> Undo
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              className="btn-crayon disabled:opacity-50"
            >
              <Redo className="h-4 w-4" /> Redo
            </button>
            <button type="button" onClick={clear} className="btn-crayon">
              <Trash2 className="h-4 w-4" /> Clear
            </button>
            <button type="button" onClick={download} className="btn-crayon">
              <Download className="h-4 w-4" /> Save
            </button>
          </div>

          <div className="mt-5 border-t-2 border-border/40 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="label-chalk">Checkpoints</h3>
              <button
                type="button"
                onClick={() => setShowCheckpoints((prev) => !prev)}
                className="text-xs font-bold text-primary underline"
              >
                {showCheckpoints ? "Hide" : "Show"} ({checkpoints.length})
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Auto-saved every 45 seconds while you color.
            </p>
            <button
              type="button"
              onClick={snapshotCheckpoint}
              className="btn-crayon mt-2 w-full justify-center text-sm"
            >
              <Clock className="h-4 w-4" /> Save checkpoint now
            </button>

            {showCheckpoints && (
              <div className="mt-3 max-h-48 space-y-2 overflow-y-auto rounded-xl border-2 border-border/60 bg-card/50 p-2">
                {checkpoints.length === 0 && (
                  <p className="p-2 text-center text-xs text-muted-foreground">
                    No checkpoints yet. Keep coloring — they'll appear automatically.
                  </p>
                )}
                {checkpoints.map((checkpoint) => (
                  <div
                    key={checkpoint.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-card p-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold">{checkpoint.label}</p>
                      <p className="text-[0.65rem] text-muted-foreground">
                        {new Date(checkpoint.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => loadCheckpoint(checkpoint.id)}
                        className="rounded-full border-2 border-border bg-card px-2 py-1 text-[0.65rem] font-bold transition-transform hover:scale-105"
                      >
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCheckpoint(checkpoint.id)}
                        className="rounded-full border-2 border-border p-1 transition-transform hover:scale-110"
                        aria-label="Delete checkpoint"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="paper-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="label-chalk">Colors</h3>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              Any color
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-10 cursor-pointer rounded-md border-2 border-border/70 bg-card p-0.5"
                aria-label="Pick any color"
              />
            </label>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div
              className="h-14 flex-1 rounded-xl border-2 border-border/70"
              style={{ backgroundColor: color }}
              aria-label={`Current color ${color}`}
            />
            <button
              type="button"
              onClick={() => setFavorites(addFavoriteColor(color))}
              disabled={favorites.includes(color.toLowerCase())}
              className="flex h-10 items-center gap-1 rounded-full border-2 border-border bg-card px-3 text-xs font-bold transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              title="Save to favorites"
              aria-label="Save current color to favorites"
            >
              <Heart className={cn("h-4 w-4", favorites.includes(color.toLowerCase()) && "fill-primary text-primary")} />
              Save
            </button>
          </div>

          {favorites.length > 0 && (
            <>
              <p className="mt-4 text-[0.7rem] font-bold tracking-wide text-muted-foreground">
                MY FAVORITES
              </p>
              <div className="mt-2 grid grid-cols-9 gap-1.5">
                {favorites.map((hex) => (
                  <div key={hex} className="group relative aspect-square">
                    <button
                      type="button"
                      title={hex}
                      aria-label={hex}
                      onClick={() => setColor(hex)}
                      className={cn(
                        "h-full w-full rounded-md border border-border/60 transition-transform hover:scale-110",
                        color.toLowerCase() === hex && "ring-2 ring-foreground",
                      )}
                      style={{ backgroundColor: hex }}
                    />
                    <button
                      type="button"
                      onClick={() => setFavorites(removeFavoriteColor(hex))}
                      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-border bg-card text-[0.6rem] opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label={`Remove ${hex} from favorites`}
                      title="Remove"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          <p className="mt-4 text-[0.7rem] font-bold tracking-wide text-muted-foreground">
            CRAYON BOX
          </p>
          <div className="mt-2 grid grid-cols-8 gap-1.5">
            {CRAYON_COLORS.map((swatch) => (
              <button
                key={swatch.hex}
                type="button"
                title={swatch.name}
                aria-label={swatch.name}
                onClick={() => setColor(swatch.hex)}
                className={cn(
                  "aspect-square rounded-md border border-border/60 transition-transform hover:scale-110",
                  color.toLowerCase() === swatch.hex.toLowerCase() && "ring-2 ring-foreground",
                )}
                style={{ backgroundColor: swatch.hex }}
              />
            ))}
          </div>

          <p className="mt-4 text-[0.7rem] font-bold tracking-wide text-muted-foreground">
            FULL SPECTRUM
          </p>
          <div className="mt-2 max-h-52 overflow-y-auto rounded-lg pr-1">
            <div className="grid grid-cols-9 gap-[3px]">
              {SPECTRUM.flat().map((hex, index) => (
                <button
                  key={`${hex}-${index}`}
                  type="button"
                  title={hex}
                  aria-label={hex}
                  onClick={() => setColor(hex)}
                  className="aspect-square rounded-[3px] transition-transform hover:scale-125"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
