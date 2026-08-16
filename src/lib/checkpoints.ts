const STORAGE_KEY = "say-and-color-checkpoints";
const MAX_CHECKPOINTS_PER_PAGE = 10;
const AUTOSAVE_INTERVAL_MS = 45_000;

export type Checkpoint = {
  id: string;
  paint: string | null;
  savedAt: number;
  label: string;
};

export type PageKey = `${string}::page-${number}`;

function getKey(bookTitle: string, pageIndex: number): PageKey {
  const slug = bookTitle.trim().toLowerCase().replace(/\s+/g, "-") || "book";
  return `${slug}::page-${pageIndex}` as PageKey;
}

function readAll(): Record<PageKey, Checkpoint[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<PageKey, Checkpoint[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<PageKey, Checkpoint[]>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function listCheckpoints(bookTitle: string, pageIndex: number): Checkpoint[] {
  const all = readAll();
  const key = getKey(bookTitle, pageIndex);
  return (all[key] ?? []).sort((a, b) => b.savedAt - a.savedAt);
}

export function saveCheckpoint(bookTitle: string, pageIndex: number, paint: string | null): Checkpoint[] {
  const all = readAll();
  const key = getKey(bookTitle, pageIndex);
  const previous = all[key] ?? [];
  const now = Date.now();
  // Skip if the latest checkpoint is identical (cheap string compare) or within 5 seconds.
  const latest = previous[0];
  if (latest && Math.abs(latest.savedAt - now) < 5_000 && latest.paint === paint) {
    return previous;
  }
  const checkpoint: Checkpoint = {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    paint,
    savedAt: now,
    label: new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
  const next = [checkpoint, ...previous].slice(0, MAX_CHECKPOINTS_PER_PAGE);
  all[key] = next;
  writeAll(all);
  return next;
}

export function restoreCheckpoint(bookTitle: string, pageIndex: number, checkpointId: string): string | null {
  const all = readAll();
  const key = getKey(bookTitle, pageIndex);
  const found = (all[key] ?? []).find((c) => c.id === checkpointId);
  return found?.paint ?? null;
}

export function deleteCheckpoint(bookTitle: string, pageIndex: number, checkpointId: string): Checkpoint[] {
  const all = readAll();
  const key = getKey(bookTitle, pageIndex);
  const next = (all[key] ?? []).filter((c) => c.id !== checkpointId);
  if (next.length) all[key] = next;
  else delete all[key];
  writeAll(all);
  return next;
}

export function useAutosaveInterval(
  enabled: boolean,
  callback: () => void,
) {
  if (!enabled) return;
  const id = window.setInterval(callback, AUTOSAVE_INTERVAL_MS);
  return () => window.clearInterval(id);
}
