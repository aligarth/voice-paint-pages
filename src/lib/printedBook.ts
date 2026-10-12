/** The one-time Printed Book purchase: price, bonus pages, and how a paid checkout becomes a purchase. */
export const PRINTED_BOOK_PRICE_ID = "printed_book_onetime";
export const PRINTED_BOOK_PRICE = "$24.99";
export const BONUS_PAGES = 5;

const UUID = /^[0-9a-f-]{36}$/i;

export type PurchaseRow = {
  owner_id: string;
  book_id: string;
  stripe_session_id: string;
  environment: string;
  status: "paid";
};

/** Turns a completed checkout session into a purchase row, or null when it isn't a paid printed-book order. */
export function purchaseFromSession(session: any, env: string): PurchaseRow | null {
  if (!session || session.mode !== "payment") return null;
  if (session.payment_status === "unpaid") return null;
  const userId = session.metadata?.userId;
  const bookId = session.metadata?.bookId;
  if (!userId || !bookId || !UUID.test(userId) || !UUID.test(bookId)) return null;
  if (typeof session.id !== "string") return null;
  return { owner_id: userId, book_id: bookId, stripe_session_id: session.id, environment: env, status: "paid" };
}

/** Prompts for the bonus pages, themed on the book's title and page names. */
export function bonusPrompts(title: string, pageTitles: string[]): string[] {
  const theme = [title, ...pageTitles].map((t) => t.trim()).filter(Boolean).slice(0, 6).join(", ");
  const base = theme || "a fun adventure";
  const ideas = [
    "a new friend",
    "a cozy hideout",
    "a big celebration",
    "an amazing vehicle",
    "a magical surprise",
  ];
  return ideas.slice(0, BONUS_PAGES).map((idea) => `${idea} in the world of: ${base}`);
}
