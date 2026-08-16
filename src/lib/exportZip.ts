import JSZip from "jszip";
import { flattenPageToBlob, type FlattenSource } from "./flattenPage";

export type ZipPage = FlattenSource;

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
    const blob = await flattenPageToBlob(sources[i]!);
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
