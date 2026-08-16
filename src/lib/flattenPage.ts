/**
 * Flattens a coloring page (paint layer + line art) exactly the way the studio shows it.
 *
 * The paint layer is painted on a fixed 1024x1024 square canvas, while the line art is
 * displayed letterboxed inside that square with `object-contain`. Exports must reproduce
 * that geometry or the color ends up stretched/offset relative to the outlines.
 */

export type FlattenSource = { src: string; paint?: string | null };

/** Coordinate space of the paint canvas in ColoringCanvas. */
const PAINT_SIZE = 1024;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load a page image"));
    img.src = src;
  });
}

/** Crops away the empty letterbox bands so the exported sheet has no dead margins. */
function cropTo(
  canvas: HTMLCanvasElement,
  box: { x: number; y: number; w: number; h: number },
): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(box.w));
  out.height = Math.max(1, Math.round(box.h));
  const ctx = out.getContext("2d");
  if (!ctx) return canvas;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(
    canvas,
    Math.round(box.x),
    Math.round(box.y),
    out.width,
    out.height,
    0,
    0,
    out.width,
    out.height,
  );
  return out;
}

/**
 * Renders white paper, the paint layer at 1:1, then the line art multiplied on top using
 * the same contain-fit the screen uses. Returns a canvas cropped to the artwork.
 */
export async function flattenPage(page: FlattenSource): Promise<HTMLCanvasElement> {
  const line = await loadImage(page.src);
  const naturalW = line.naturalWidth || PAINT_SIZE;
  const naturalH = line.naturalHeight || PAINT_SIZE;

  // Square work canvas matching the paint layer's coordinate space, upscaled so we never
  // lose line-art detail on non-square pages.
  const side = Math.max(PAINT_SIZE, naturalW, naturalH);
  const ratio = side / PAINT_SIZE;

  const work = document.createElement("canvas");
  work.width = side;
  work.height = side;
  const ctx = work.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, side, side);

  if (page.paint) {
    try {
      const paint = await loadImage(page.paint);
      // Paint is authored in a 1024 square; scale uniformly with the work canvas.
      ctx.drawImage(paint, 0, 0, PAINT_SIZE * ratio, PAINT_SIZE * ratio);
    } catch {
      /* skip an unreadable paint layer */
    }
  }

  const scale = Math.min(side / naturalW, side / naturalH);
  const dw = naturalW * scale;
  const dh = naturalH * scale;
  const dx = (side - dw) / 2;
  const dy = (side - dh) / 2;

  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(line, dx, dy, dw, dh);
  ctx.globalCompositeOperation = "source-over";

  return cropTo(work, { x: dx, y: dy, w: dw, h: dh });
}

/** Flattens a page and returns a PNG data URL. */
export async function flattenPageToDataUrl(page: FlattenSource, type = "image/png", quality?: number) {
  const canvas = await flattenPage(page);
  try {
    return canvas.toDataURL(type, quality);
  } catch {
    throw new Error("This page image can't be exported because it couldn't be read securely.");
  }
}

/** Flattens a page and returns a Blob. */
export async function flattenPageToBlob(page: FlattenSource, type = "image/png"): Promise<Blob> {
  const canvas = await flattenPage(page);
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not create an image for this page"));
      }, type);
    } catch {
      reject(new Error("This page image can't be exported because it couldn't be read securely."));
    }
  });
}

/** Triggers a browser download of a flattened page as a PNG. */
export async function downloadFlattenedPage(page: FlattenSource, fileName: string) {
  const url = await flattenPageToDataUrl(page);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
}
