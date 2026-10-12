import { describe, expect, it } from "vitest";
import { BONUS_PAGES, bonusPrompts, purchaseFromSession, PRINTED_BOOK_PRICE } from "./printedBook";

const user = "11111111-1111-1111-1111-111111111111";
const book = "22222222-2222-2222-2222-222222222222";

describe("printed book", () => {
  it("costs $24.99", () => expect(PRINTED_BOOK_PRICE).toBe("$24.99"));

  it("a paid one-time checkout with a book becomes a purchase", () => {
    const row = purchaseFromSession(
      { id: "cs_1", mode: "payment", payment_status: "paid", metadata: { userId: user, bookId: book } },
      "sandbox",
    );
    expect(row).toEqual({ owner_id: user, book_id: book, stripe_session_id: "cs_1", environment: "sandbox", status: "paid" });
  });

  it("an unpaid checkout creates nothing", () => {
    expect(
      purchaseFromSession({ id: "cs_2", mode: "payment", payment_status: "unpaid", metadata: { userId: user, bookId: book } }, "sandbox"),
    ).toBeNull();
  });

  it("a subscription checkout is not a printed book", () => {
    expect(
      purchaseFromSession({ id: "cs_3", mode: "subscription", payment_status: "paid", metadata: { userId: user, bookId: book } }, "sandbox"),
    ).toBeNull();
  });

  it("includes 5 bonus pages", () => {
    expect(BONUS_PAGES).toBe(5);
    expect(bonusPrompts("Space", [])).toHaveLength(5);
  });
});
