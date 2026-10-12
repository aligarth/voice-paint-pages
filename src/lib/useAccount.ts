/**
 * Who is signed in, what plan they are on, and what they have left this month.
 * The auth listener itself lives once in src/routes/__root.tsx.
 *
 * Every value is worked out from the same snapshot React is rendering, so a
 * screen never shows numbers from a server answer that hasn't arrived yet.
 */
import { useSyncExternalStore } from "react";

import { accountState, serverAccountState, subscribeAccount } from "./accountState";
import { devPlanOverride } from "./plan";
import { PLAN_LIMITS } from "./planLimits";

export function useAccount() {
  const state = useSyncExternalStore(subscribeAccount, accountState, serverAccountState);
  const plan = devPlanOverride() ?? state.plan;
  const limits = PLAN_LIMITS[plan];
  const pagesLeft = Math.max(0, limits.pages - state.pages);
  const booksLeft = Math.max(0, limits.books - state.books);
  const allowanceLine = Number.isFinite(limits.pages)
    ? plan === "free"
      ? `Free pages left this month: ${pagesLeft}`
      : `Pages left this month: ${pagesLeft}`
    : null;

  return {
    signedIn: state.userId !== null,
    email: state.email,
    plan,
    account: state,
    pagesLeft,
    booksLeft,
    canCreatePage: pagesLeft > 0,
    canSaveBook: booksLeft > 0,
    allowanceLine,
    pageAllowance: limits.pages,
    bookAllowance: limits.books,
    isFreePlan: plan === "free",
  };
}
