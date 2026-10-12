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

  return doc;
}

/**
 * Print-shop ready book: 8.5×11 in trim plus 0.125 in bleed on every side, 0.5 in safe margin,
 * a front cover, a title page, numbered pages, and a blank back so the sheet count is even.
 */
export async function downloadPrintedBookPdf(title: string, sources: PdfPage[]) {
  if (!sources.length) throw new Error("There are no finished pages to print yet.");
  const bleed = 9; // 0.125 in
  const W = 612 + bleed * 2;
  const H = 792 + bleed * 2;
  const safe = bleed + 36; // 0.5 in inside trim
  const name = title.trim() || "My coloring book";
  const doc = new jsPDF({ unit: "pt", format: [W, H], orientation: "portrait" });

  const placeImage = async (src: PdfPage, top: number, bottom: number) => {
    const image = await toJpeg(src);
    const maxW = W - safe * 2;
    const maxH = H - top - bottom;
    const scale = Math.min(maxW / image.width, maxH / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    doc.addImage(image.data, "JPEG", (W - w) / 2, top + (maxH - h) / 2, w, h);
  };

  // Front cover
  doc.setFillColor(106, 156, 20);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(safe, safe + 90, W - safe * 2, H - safe * 2 - 150, 16, 16, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  doc.text(doc.splitTextToSize(name, W - safe * 2), W / 2, safe + 40, { align: "center" });
  await placeImage(sources[0]!, safe + 110, safe + 80);
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("Color My Words", W / 2, H - safe - 20, { align: "center" });

  // Title page
  doc.addPage();
  doc.setTextColor(30);
  doc.setFontSize(30);
  doc.text(doc.splitTextToSize(name, W - safe * 2), W / 2, H / 2 - 30, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(90);
  doc.text("This book belongs to: ____________________", W / 2, H / 2 + 30, { align: "center" });
  doc.text("Made with Color My Words — colormywords.app", W / 2, H - safe, { align: "center" });

  // Coloring pages
  for (let i = 0; i < sources.length; i += 1) {
    doc.addPage();
    await placeImage(sources[i]!, safe, safe + 24);
    doc.setFontSize(11);
    doc.setTextColor(110);
    doc.text(String(i + 1), W / 2, H - safe, { align: "center" });
  }

  // Blank back so it prints double-sided cleanly
  if (doc.getNumberOfPages() % 2 === 1) doc.addPage();
  doc.addPage();
  doc.setFillColor(106, 156, 20);
  doc.rect(0, 0, W, H, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text("colormywords.app", W / 2, H - safe - 10, { align: "center" });
  if (doc.getNumberOfPages() % 2 === 1) doc.insertPage(doc.getNumberOfPages());

  doc.save(pdfFileName(`${name}-printed-book`));
}
