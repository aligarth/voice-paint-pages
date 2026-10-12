# Printed Book PDF — $24.99 one-time purchase

## What people get

Anyone signed in can buy a **Printed Book** for one of their books on My Bookshelf for **$24.99, paid once** (no subscription). After paying, they download a polished PDF that:

- **Printed cover** — a front cover with the book's name, the first picture and "Color My Words", plus a title page.
- **Print-shop ready** — standard 8.5×11 in pages with a safe margin and bleed so any print shop (Staples, FedEx Office, local printers) can print it as-is. Pages are numbered, and a blank back page is added so it prints double-sided cleanly.
- **Extra AI pages** — 5 bonus pages, drawn to match the book's theme, are added before checkout finishes building the PDF. They're also saved into the book on the shelf so the person can color them in the app.

The free "Save book" PDF stays as it is — a simple export with no cover, no print layout and no bonus pages.

## How it works for the person

1. On My Bookshelf, each book gets a **"Get printed book — $24.99"** button.
2. Tapping it opens the secure card form right on the page (test mode first, like the plans).
3. After paying, the screen says "Making your printed book…" while the 5 bonus pages are drawn (about a minute).
4. A **Download printed book** button appears. The purchase is remembered, so they can download it again anytime from the same book without paying twice.
5. Bonus pages don't count against their monthly page limit.

## Other changes

- The plans screen line "Printed book for $24.99 — coming soon" becomes "Printed book — $24.99 each, any plan".
- Saved to memory: printed book is $24.99 one-time, open to every signed-in user, includes cover + print-ready layout + 5 bonus pages.

## Questions settled by your answers

- Who buys: everyone signed in, one-time.
- Includes: printed cover, print-shop ready layout, extra AI pages.
- Assumption to confirm later: **5** bonus pages per printed book. Tell me if you want a different number.

---

## Technical notes

- **Product**: `payments--batch_create_product` → product `printed_book`, price `printed_book_onetime`, 2499 usd, one-time, quantity 1–1, tax code `txcd_10000000` (digital goods).
- **DB migration**: new table `public.book_purchases` (id, owner_id uuid, book_id uuid, stripe_session_id unique, environment, status `paid`/`ready`, bonus_added bool, created_at). RLS: owner can SELECT own rows; no client INSERT/UPDATE — only the webhook (service role) writes. GRANT select to authenticated, all to service_role.
- **Checkout**: extend `createCheckoutSession` in `src/lib/payments.functions.ts` to accept an optional `bookId` (verified as owned by the caller), set `metadata: { userId, bookId }`, `payment_intent_data.description` from the product name, `managed_payments: { enabled: true }`, mode `payment`.
- **Webhook** `src/routes/api/public/payments/webhook.ts`: handle `checkout.session.completed` with `payment_status === "paid"` and a `bookId` in metadata → upsert `book_purchases` on `stripe_session_id`. Existing subscription handling unchanged; `PRICE_TO_PLAN` ignores the one-time price.
- **Bonus pages**: new authenticated server function `finishPrintedBook({ bookId })` — checks a paid `book_purchases` row exists for the caller and `bonus_added = false`, generates 5 line-art pages through the existing image generation path using the book's title + page titles as the theme (run through `sealLineArt` on the client as today), appends them to the book, sets `bonus_added = true`. Skips `consumeUsage`. Idempotent so a refresh can't add pages twice.
- **PDF**: new `buildPrintedBookPdf()` in `src/lib/exportPdf.ts` — letter size + 0.125 in bleed, 0.5 in safe margin, cover page, title page, numbered pages, blank back page for even page count. Downloads client-side from the book's pages.
- **UI**: `src/routes/books.tsx` — button per book, embedded checkout via existing `PlanCheckout` pattern, `?printed=done&book=…` return handling with polling for the purchase row, then download button. `src/routes/plans.tsx` copy update.
- **Tests**: vitest — webhook maps a paid one-time session with bookId to a purchase row; a non-paid session creates nothing; `finishPrintedBook` refuses without a purchase and doesn't add bonus pages twice.
- **Still pending from the domain step**: publish the live site so colormywords.app carries the new email links and address tags (was about to run when this request arrived).
