import JSZip from "jszip";

export type ZipPage = { src: string; paint?: string | null };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load a page image"));
    img.src = src;
  });
}

async function renderPagePng(page: ZipPage): Promise<Blob> {
  const img = await loadImage(page.src);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || 1024;
  canvas.height = img.naturalHeight || 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (page.paint) {
    try {
      const paint = await loadImage(page.paint);
      ctx.drawImage(paint, 0, 0, canvas.width, canvas.height);
    } catch {
      /* skip unreadable paint layer */
    }
  }

  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "source-over";

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not create PNG blob"));
    }, "image/png");
  });
}

export function zipFileName(title: string) {
  const slug = title.trim().replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "");
  return `${slug || "coloring-book"}.zip`;
}

/** Builds a ZIP file containing each page as a PNG and triggers a download. */
export async function exportPagesToZip(title: string, sources: ZipPage[]) {
  if (!sources.length) throw new Error("There are no finished pages to export yet.");

  const zip = new JSZip();
  const folder = zip.folder(title.trim() || "My coloring book");
  if (!folder) throw new Error("Could not create ZIP folder");

  const safeTitle = (title.trim() || "page").replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "");

  for (let i = 0; i < sources.length; i += 1) {
    const blob = await renderPagePng(sources[i]!);
    folder.file(`${safeTitle || "page"}-${String(i + 1).padStart(2, "0")}.png`, blob);
  }

  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const link = document.createElement("a");
  link.href = url;
  link.download = zipFileName(title);
  link.click();
  URL.revokeObjectURL(url);
}
