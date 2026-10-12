import type { PlanId } from "./planLimits";

/** Which paid price unlocks which plan. Keyed by the stable price id. */
export const PRICE_TO_PLAN: Record<string, PlanId> = {
  coloring_plus_monthly: "standard",
  coloring_unlimited_monthly: "premium",
};

export const PLAN_TO_PRICE: Partial<Record<PlanId, string>> = {
  standard: "coloring_plus_monthly",
  premium: "coloring_unlimited_monthly",
};

const KEEPS_ACCESS = new Set(["active", "trialing", "past_due"]);

/** The plan a subscription grants right now. Anything not paid falls back to free. */
export function planForSubscription(priceId: string | null | undefined, status: string): PlanId {
  if (!priceId || !KEEPS_ACCESS.has(status)) return "free";
  return PRICE_TO_PLAN[priceId] ?? "free";
}
