/**
 * Single source of truth for which plan the current person is on.
 *
 * The answer comes from their account on the server. Until someone is signed
 * in it is "free". A dev-only override lets both states be exercised in the
 * browser; it is compiled out of the shipped build.
 */
import { accountState } from "./accountState";
import { PLAN_LIMITS, type PlanId } from "./planLimits";

export * from "./planLimits";

const OVERRIDE_KEY = "cmw-plan-override";

function validOverride(raw: string | null): raw is PlanId {
  return raw === "free" || raw === "standard" || raw === "premium";
}

/** The dev-only plan switch, or null when it isn't set (always in a real build). */
export function devPlanOverride(): PlanId | null {
  if (!import.meta.env.DEV || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(OVERRIDE_KEY);
    return validOverride(raw) ? raw : null;
  } catch {
    /* storage unavailable — no override */
    return null;
  }
}

export function currentPlan(): PlanId {
  return devPlanOverride() ?? accountState().plan;
}

export function planLimits() {
  return PLAN_LIMITS[currentPlan()];
}

export function isFreePlan() {
  return currentPlan() === "free";
}
