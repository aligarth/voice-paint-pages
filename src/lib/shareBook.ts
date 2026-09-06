import { buildPagesPdfBlob, pdfFileName } from "./exportPdf";
import { flattenPage, type FlattenSource } from "./flattenPage";
import { createSharedGallery, type SharedPage } from "./share";
import { saveBookRecord, type SavedBook } from "./savedBooks";

/** Largest picture edge we upload for a shared link, so links stay quick to open. */
const SHARE_MAX_EDGE = 1100;
const SHARE_QUALITY = 0.72;
/** Safety net so one huge book can't blow past what the database row can hold. */
const SHARE_MAX_BYTES = 6_000_000;

export type ShareResult = { shared: boolean; downloaded: boolean };

/**
 * Sends the book as a printable file through the device share sheet.
 * Falls back to a plain download where sharing files isn't supported (most desktops).
 */
export async function shareBookFile(title: string, sources: FlattenSource[]): Promise<ShareResult> {
  const blob = await buildPagesPdfBlob(title, sources);
  const file = new File([blob], pdfFileName(title), { type: "application/pdf" });

  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };

  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({
        files: [file],
        title,
        text: `${title} — a coloring book made in Color My World`,
      });
      return { shared: true, downloaded: false };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return { shared: false, downloaded: false };
      }
      // Fall through to the download so the book is never lost.
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return { shared: false, downloaded: true };
}

/** Bakes the coloring into each picture and shrinks it for the web. */
async function flattenForWeb(page: FlattenSource): Promise<string> {
  const canvas = await flattenPage(page);
  const scale = Math.min(1, SHARE_MAX_EDGE / Math.max(canvas.width, canvas.height));
  if (scale === 1) return canvas.toDataURL("image/jpeg", SHARE_QUALITY);

  const small = document.createElement("canvas");
  small.width = Math.max(1, Math.round(canvas.width * scale));
  small.height = Math.max(1, Math.round(canvas.height * scale));
  const ctx = small.getContext("2d");
  if (!ctx) return canvas.toDataURL("image/jpeg", SHARE_QUALITY);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, small.width, small.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(canvas, 0, 0, small.width, small.height);
  return small.toDataURL("image/jpeg", SHARE_QUALITY);
}

/**
 * Publishes a view-only copy of the book, exactly as it is coloured right now,
 * and returns a link anyone can open. The newest link is remembered on the book.
 */
export async function createBookShareLink(book: SavedBook): Promise<string> {
  if (!book.pages.length) throw new Error("This book has no pages to share yet.");

  const pages: SharedPage[] = [];
  let bytes = 0;
  for (let i = 0; i < book.pages.length; i += 1) {
    const source: FlattenSource = { src: book.pages[i]!, paint: book.paints?.[i] ?? null };
    const image = await flattenForWeb(source);
    bytes += image.length;
    if (bytes > SHARE_MAX_BYTES) {
      throw new Error(
        "This book is too big to share as a link. Try sharing the book file instead, or split it into smaller books.",
      );
    }
    pages.push({ src: image, title: book.pageTitles?.[i] || `Page ${i + 1}` });
  }

  const { id, url } = await createSharedGallery(book.title, pages);
  if (book.shareId !== id) {
    await saveBookRecord({ ...book, shareId: id });
  }
  return url;
}
