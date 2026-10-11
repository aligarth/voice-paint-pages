/**
 * The plan in force and the monthly counters, kept in one place.
 *
 * The numbers come from the server, where they are stored against the
 * signed-in person's account — so clearing browser data or switching device
 * can't earn anyone a second free page.
 */
import { consumeUsage, getEntitlements } from "./account.functions";
import type { PlanId } from "./planLimits";

export type AccountState = {
  plan: PlanId;
  month: string;
  /** Pages drawn this calendar month. */
  pages: number;
  /** Books saved this calendar month. */
  books: number;
  /** True once the server has answered for the signed-in person. */
  loaded: boolean;
};

const EMPTY: AccountState = { plan: "free", month: "", pages: 0, books: 0, loaded: false };

let state: AccountState = EMPTY;
const listeners = new Set<() => void>();

function publish(next: AccountState) {
  state = next;
  for (const listener of listeners) listener();
}

export function accountState(): AccountState {
  return state;
}

/** Lets React re-render when the plan or counters change. */
export function subscribeAccount(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetAccount() {
  publish(EMPTY);
}

/** Reads the signed-in person's plan and counters. */
export async function refreshAccount(): Promise<AccountState> {
  const data = await getEntitlements();
  publish({ plan: data.plan, month: data.month, pages: data.pages, books: data.books, loaded: true });
  return state;
}

async function take(kind: "page" | "book"): Promise<boolean> {
  const result = await consumeUsage({ data: { kind } });
  publish({
    plan: result.plan,
    month: result.month,
    pages: result.pages,
    books: result.books,
    loaded: true,
  });
  return result.ok;
}

/** Uses one of this month's pages. False when the account has none left. */
export function takePage() {
  return take("page");
}

/** Uses one of this month's book saves. False when the account has none left. */
export function takeBook() {
  return take("book");
}
