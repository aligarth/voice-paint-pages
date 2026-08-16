const STORAGE_KEY = "say-and-color-favorites";
const MAX_FAVORITES = 18;

export function getFavoriteColors(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.filter((c) => typeof c === "string" && c.startsWith("#")) : [];
  } catch {
    return [];
  }
}

export function addFavoriteColor(hex: string): string[] {
  const normalized = hex.toLowerCase();
  const current = getFavoriteColors().filter((c) => c !== normalized);
  const next = [normalized, ...current].slice(0, MAX_FAVORITES);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function removeFavoriteColor(hex: string): string[] {
  const normalized = hex.toLowerCase();
  const next = getFavoriteColors().filter((c) => c !== normalized);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}
