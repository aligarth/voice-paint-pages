import { jsPDF } from "jspdf";

/** Loads an image source (data URL or remote URL) into an HTMLImageElement. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load a page image"));
    img.src = src;
  });
}

/** Draws the image on a white canvas so transparent PNGs print cleanly. */
async function toJpeg(src: string): Promise<{ data: string; width: number; height: number }> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || 1024;
  canvas.height = img.naturalHeight || 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return { data: canvas.toDataURL("image/jpeg", 0.92), width: canvas.width, height: canvas.height };
}

export function pdfFileName(title: string) {
  const slug = title.trim().replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "");
  return `${slug || "coloring-book"}.pdf`;
}

/** Builds a single letter-size PDF, one coloring page per sheet, and downloads it. */
export async function exportPagesToPdf(title: string, sources: string[]) {
  if (!sources.length) throw new Error("There are no finished pages to export yet.");
  const doc = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;
  const headerH = 26;

  for (let i = 0; i < sources.length; i += 1) {
    if (i > 0) doc.addPage();
    const image = await toJpeg(sources[i]!);
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2 - headerH;
    const scale = Math.min(maxW / image.width, maxH / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    const x = (pageW - w) / 2;
    const y = margin + headerH + (maxH - h) / 2;

    doc.setFontSize(12);
    doc.setTextColor(90);
    doc.text(title || "My coloring book", margin, margin + 10);
    doc.text(`Page ${i + 1} of ${sources.length}`, pageW - margin, margin + 10, { align: "right" });
    doc.addImage(image.data, "JPEG", x, y, w, h);
  }

  doc.save(pdfFileName(title));
}
