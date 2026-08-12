import { useEffect, useRef, useState } from "react";
import {
  Eraser,
  Paintbrush,
  Pencil,
  RotateCcw,
  Trash2,
  Download,
  Droplet,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";
import { BRUSH_SIZES, CRAYON_COLORS, SPECTRUM } from "@/lib/palette";
import { cn } from "@/lib/utils";


type Tool = "brush" | "crayon" | "marker" | "eraser";

const TOOLS: { id: Tool; label: string; icon: typeof Paintbrush }[] = [
  { id: "brush", label: "Paint brush", icon: Paintbrush },
  { id: "crayon", label: "Crayon", icon: Pencil },
  { id: "marker", label: "Marker", icon: Droplet },
  { id: "eraser", label: "Eraser", icon: Eraser },
];

export function ColoringCanvas({ src, title }: { src: string; title: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const history = useRef<ImageData[]>([]);

  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#ED0A3F");
  const [size, setSize] = useState(24);
  const [panelOpen, setPanelOpen] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    history.current = [];
  }, [src]);

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
  };

  const strokeSegment = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = size;

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
          const jitter = (Math.random() - 0.5) * size * 0.35;
          const x = from.x + (to.x - from.x) * t + jitter;
          const y = from.y + (to.y - from.y) * t + jitter;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineWidth = size * (0.6 + pass * 0.2);
        ctx.stroke();
      }
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

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pushHistory();
    drawing.current = true;
    setIsDrawing(true);
    const point = pointFromEvent(e);
    lastPoint.current = point;
    strokeSegment(point, { x: point.x + 0.01, y: point.y + 0.01 });
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !lastPoint.current) return;
    const point = pointFromEvent(e);
    strokeSegment(lastPoint.current, point);
    lastPoint.current = point;
  };

  const onPointerUp = () => {
    drawing.current = false;
    lastPoint.current = null;
    setIsDrawing(false);
  };


  const undo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const previous = history.current.pop();
    if (!canvas || !ctx || !previous) return;
    ctx.putImageData(previous, 0, 0);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    pushHistory();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
          onPointerLeave={onPointerUp}
          className="absolute inset-0 h-full w-full touch-none"
          style={{ cursor: "crosshair" }}
        />
        <img
          src={src}
          alt={`Line art of ${title}`}
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain mix-blend-multiply"
          draggable={false}
        />

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
          <div className="mt-3 grid grid-cols-4 gap-2">
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

          <h3 className="label-chalk mt-5">Size</h3>
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

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={undo} className="btn-crayon">
              <RotateCcw className="h-4 w-4" /> Undo
            </button>
            <button type="button" onClick={clear} className="btn-crayon">
              <Trash2 className="h-4 w-4" /> Clear
            </button>
            <button type="button" onClick={download} className="btn-crayon">
              <Download className="h-4 w-4" /> Save
            </button>
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

          <div
            className="mt-3 h-14 w-full rounded-xl border-2 border-border/70"
            style={{ backgroundColor: color }}
            aria-label={`Current color ${color}`}
          />

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
