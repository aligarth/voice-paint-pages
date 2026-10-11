/**
 * What the signed-in person may still do this calendar month.
 *
 * The counts live on the server against their account; this file only reads the
 * copy the app already holds and works out what is left.
 */
import { accountState } from "./accountState";
import { PLAN_LIMITS } from "./planLimits";
import { currentPlan } from "./plan";

export function pagesThisMonth(): number {
  return accountState().pages;
}

export function booksThisMonth(): number {
  return accountState().books;
}

function limits() {
  return PLAN_LIMITS[currentPlan()];
}

/** Pages the person may still draw this month. */
export function pagesLeft(): number {
  return Math.max(0, limits().pages - pagesThisMonth());
}

/** Books the person may still save this month. */
export function booksLeft(): number {
  return Math.max(0, limits().books - booksThisMonth());
}

export function canCreatePage(): boolean {
  return pagesLeft() > 0;
}

export function canSaveBook(): boolean {
  return booksLeft() > 0;
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
  if (!Number.isFinite(pageAllowance())) return null;
  const left = pagesLeft();
  return currentPlan() === "free"
    ? `Free pages left this month: ${left}`
    : `Pages left this month: ${left}`;
}
