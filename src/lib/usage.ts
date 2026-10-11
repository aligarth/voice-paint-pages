/**
 * Per-calendar-month counters for the current plan's allowances.
 *
 * The month key is stored alongside the counts, so the numbers reset themselves
 * on the 1st without any scheduled job.
 */

import { PLAN_LIMITS, currentPlan, type PlanLimits } from "./plan";

const KEY = "cmw-usage";

type UsageRow = { month: string; pages: number; books: number };

function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function read(): UsageRow {
  const row: UsageRow = { month: monthKey(), pages: 0, books: 0 };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return row;
    const parsed = JSON.parse(raw) as Partial<UsageRow>;
    // A new month starts from zero.
    if (parsed.month !== row.month) return row;
    return {
      month: row.month,
      pages: Number.isFinite(parsed.pages) ? Math.max(0, Number(parsed.pages)) : 0,
      books: Number.isFinite(parsed.books) ? Math.max(0, Number(parsed.books)) : 0,
    };
  } catch {
    return row;
  }
}

function write(row: UsageRow) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(row));
  } catch {
    /* storage unavailable — the limit still applies from the counts we have */
  }
}

export function pagesThisMonth(): number {
  return read().pages;
}

export function booksThisMonth(): number {
  return read().books;
}

function limits(): PlanLimits {
  return PLAN_LIMITS[currentPlan()];
}

/** Pages the customer may still draw this month. */
export function pagesLeft(): number {
  return Math.max(0, limits().pages - pagesThisMonth());
}

/** Books the customer may still save this month. */
export function booksLeft(): number {
  return Math.max(0, limits().books - booksThisMonth());
}

export function canCreatePage(): boolean {
  return pagesLeft() > 0;
}

export function canSaveBook(): boolean {
  return booksLeft() > 0;
}

export function recordPage() {
  const row = read();
  row.pages += 1;
  write(row);
}

export function recordBook() {
  const row = read();
  row.books += 1;
  write(row);
}

/** How many pages this plan allows, for the plans screen and locked messages. */
export function pageAllowance(): number {
  return limits().pages;
}

export function bookAllowance(): number {
  return limits().books;
}

/** "Free pages left this month: 1" style line; null when the plan is unlimited. */
export function allowanceLine(): string | null {
  const left = pagesLeft();
  if (!Number.isFinite(pageAllowance())) return null;
  return currentPlan() === "free"
    ? `Free pages left this month: ${left}`
    : `Pages left this month: ${left}`;
}
