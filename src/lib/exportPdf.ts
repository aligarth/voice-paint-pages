import { jsPDF } from "jspdf";
import { flattenPage, type FlattenSource } from "./flattenPage";

export type PdfPage = FlattenSource;

/** Flattens the paint layer under the line art on white, so pages print cleanly. */
async function toJpeg(page: PdfPage): Promise<{ data: string; width: number; height: number }> {
  const canvas = await flattenPage(page);
  let data: string;
  try {
    data = canvas.toDataURL("image/jpeg", 0.92);
  } catch {
    throw new Error("A page image couldn't be read securely, so it can't be added to the PDF.");
  }
  return { data, width: canvas.width, height: canvas.height };
}

export function pdfFileName(title: string) {
  const slug = title.trim().replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "");
  return `${slug || "coloring-book"}.pdf`;
}

/** Builds a single letter-size PDF, one coloring page per sheet, and downloads it. */
export async function exportPagesToPdf(title: string, sources: PdfPage[]) {
  const doc = await buildPagesPdf(title, sources);
  doc.save(pdfFileName(title));
}

/** Same sheets as the download, returned as a Blob so it can be shared as a file. */
export async function buildPagesPdfBlob(title: string, sources: PdfPage[]): Promise<Blob> {
  const doc = await buildPagesPdf(title, sources);
  return doc.output("blob");
}

async function buildPagesPdf(title: string, sources: PdfPage[]) {
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
