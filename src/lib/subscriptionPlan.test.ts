import { describe, expect, it } from "vitest";
import { PLAN_LIMITS } from "./planLimits";
import { planForSubscription } from "./subscriptionPlan";

describe("paid plans", () => {
  it("$9.99 Coloring Plus allows 15 pages and 3 books", () => {
    expect(planForSubscription("coloring_plus_monthly", "active")).toBe("standard");
    expect(PLAN_LIMITS.standard).toEqual({ pages: 15, books: 3 });
  });
  it("$24.99 Coloring Unlimited has no page limit", () => {
    expect(planForSubscription("coloring_unlimited_monthly", "active")).toBe("premium");
    expect(PLAN_LIMITS.premium.pages).toBe(Infinity);
  });
  it("a cancelled subscription goes back to free", () => {
    expect(planForSubscription("coloring_plus_monthly", "canceled")).toBe("free");
  });
});
