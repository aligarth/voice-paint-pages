/**
 * Plan definitions with no dependencies, so both the browser and the server can
 * read the same numbers.
 */

export type PlanId = "free" | "standard" | "premium";

export type PlanLimits = {
  /** AI pictures a customer may draw per calendar month. */
  pages: number;
  /** Books a customer may save per calendar month. */
  books: number;
};

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: { pages: 1, books: 0 },
  standard: { pages: 15, books: 3 },
  premium: { pages: Infinity, books: Infinity },
};

export const PLAN_LABELS: Record<PlanId, string> = {
  free: "Free",
  standard: "Coloring Plus",
  premium: "Coloring Unlimited",
};

/** Free coloring is kept for a day, then dropped. */
export const FREE_KEEP_MS = 24 * 60 * 60 * 1000;

/** Shown wherever an action is locked, so the copy stays consistent. */
export const UPGRADE_COPY = "This is part of a paid plan. See plans for what's included.";
