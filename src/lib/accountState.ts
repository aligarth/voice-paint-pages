/**
 * The plan in force and the monthly counters, kept in one place.
 *
 * The numbers come from the server, where they are stored against the
 * signed-in person's account — so clearing browser data or switching device
 * can't earn anyone a second free page.
 */
import { consumeUsage, getEntitlements } from "./account.functions";
import { importDeviceLibrary } from "./savedBooks";
import type { PlanId } from "./planLimits";

export type AccountState = {
  /** The signed-in person, or null while nobody is signed in. */
  userId: string | null;
  email: string | null;
  plan: PlanId;
  month: string;
  /** Pages drawn this calendar month. */
  pages: number;
  /** Books saved this calendar month. */
  books: number;
  /** True once the server has answered for the signed-in person. */
  loaded: boolean;
};

const EMPTY: AccountState = {
  userId: null,
  email: null,
  plan: "free",
  month: "",
  pages: 0,
  books: 0,
  loaded: false,
};

let state: AccountState = EMPTY;
const listeners = new Set<() => void>();
/** Whose items have already been copied across this session. */
let lastHandledFor: string | null = null;

function publish(next: AccountState) {
  state = next;
  for (const listener of listeners) listener();
}

export function accountState(): AccountState {
  return state;
}

/**
 * What a server render (and the first client render that matches it) sees:
 * nobody signed in. Keeping this a constant is what stops the screen being
 * rebuilt the moment a returning visitor's session is picked up.
 */
export function serverAccountState(): AccountState {
  return EMPTY;
}

/** Lets React re-render when the plan, counters or signer change. */
export function subscribeAccount(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetAccount() {
  lastHandledFor = null;
  publish(EMPTY);
}

/** Reads the signed-in person's plan and counters from the server. */
export async function refreshAccount(): Promise<AccountState> {
  const data = await getEntitlements();
  publish({ ...state, plan: data.plan, month: data.month, pages: data.pages, books: data.books, loaded: true });
  return state;
}

/**
 * Points the app at whoever just signed in: brings their pages and books from
 * this device into their account, then reads their plan and counters.
 */
export async function syncUser(user: { id: string; email?: string | null } | null) {
  if (!user) {
    resetAccount();
    return;
  }

  if (lastHandledFor === user.id) {
    publish({ ...state, userId: user.id, email: user.email ?? null });
    return;
  }

  lastHandledFor = user.id;
  publish({ ...EMPTY, userId: user.id, email: user.email ?? null });

  try {
    await importDeviceLibrary();
  } catch {
    /* the copy is best effort — signing in still works without it */
  }
  try {
    await refreshAccount();
  } catch {
    /* keeps whatever was last known until the next try */
  }
}

async function take(kind: "page" | "book"): Promise<boolean> {
  const result = await consumeUsage({ data: { kind } });
  publish({
    ...state,
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

const AFTER_KEY = "cmw-after-auth";

/** Remembers where the person was heading, so sign-in can put them back there. */
export function rememberDestination(path: string) {
  try {
    sessionStorage.setItem(AFTER_KEY, path);
  } catch {
    /* storage blocked — they'll land on the cover instead */
  }
}

/** Reads and clears the kept destination, keeping only a path on this app. */
export function takeDestination(): string {
  try {
    const raw = sessionStorage.getItem(AFTER_KEY);
    sessionStorage.removeItem(AFTER_KEY);
    if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  } catch {
    /* no destination kept */
  }
  return "/";
}
