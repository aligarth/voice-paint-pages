# Turning Color My World into a paid app

Free to try, $9.99/month to go unlimited, and a $24.99 printed book.

## One thing to know first

Paddle (your choice for checkout) only sells digital things — it is not allowed to charge for a physical printed book. So:

- The **$9.99/month membership** is a real Paddle checkout, live in the app.
- The **$24.99 printed book** is built end to end (bundle pages, shipping address, order saved for you to print and ship) but the order is recorded as awaiting payment, and you collect the $24.99 yourself for now. If you'd rather charge for it in the app, that needs Stripe instead of Paddle — say the word and I'll switch the whole thing to Stripe.

## Signing in

- Coloring, saving and your bookshelf stay open to everyone.
- Making a new picture asks you to sign in first (Google, one tap). This is what lets your free count and your membership follow you from phone to tablet to computer.
- A small account line appears on the front cover: your email and Sign out, or Sign in.

## Free tier

- 3 new pictures a month, counted from the 1st of each calendar month, reset automatically.
- "Free pages left: 3" shows on the naming/create screen and on a new Account page.
- Coloring, saving, your bookshelf and sharing links stay free forever. The limit is only on making new pictures — typed, spoken or from a photo.

## Premium — $9.99/month

Unlocks:
- Unlimited new pictures
- Saving and printing books (PDF and ZIP)
- Ordering a printed book

A **Go Premium** card appears exactly when it's needed: when a free member runs out of pictures for the month, or taps Save book / Export / Print. It shows what you get, the price read from the payment system (never from the page itself), and one Upgrade button that opens Paddle's checkout. Email and card details are collected there, never asked twice here.

After paying you land on a **Thank you** screen confirming membership is active. If you cancel or a payment fails, the app drops you back to free on its own — nothing for you to do.

## Printed book — $24.99

- Premium members can pick saved pages, name the book, and enter a shipping address.
- The order is saved with the finished book file, the address and a status: awaiting payment → paid → cancelled.
- You see your orders on the Account page. Only you (as admin) can see everyone's orders.

## Where you'll see it

- Front cover: account line, and a small "Free pages left" or "Premium" badge.
- Create/name screen: pages left, Go Premium card when out.
- Bookshelf: Save book / Export / Share stay where they are; Save and Export show the Go Premium card for free members, plus a new **Order printed book** button.
- New **Account** page: membership status, usage this month, manage/cancel, order history.
- New **Thank you** page after checkout.

## Technical plan

**Payments**: run `recommend_payment_provider` (seller country US), then `enable_paddle_payments`; create the $9.99 recurring product with `batch_create_product`. Requires the Pro plan. Checkout price is always fetched server-side; the browser only sends a product id. Paddle webhook handled by a server route under `src/routes/api/public/paddle-webhook.ts` with signature verification, flipping `profiles.plan` on `subscription.activated/updated` and back to `free` on `canceled/past_due`.

**Auth**: Google sign-in via `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })` plus `supabase--configure_social_auth`; new public `src/routes/auth.tsx`; `onAuthStateChange` wired once in `__root.tsx`.

**Database migration** (each table: `CREATE TABLE` → `GRANT` → enable RLS → policies):
- `profiles` (`id uuid pk` = auth user, `email`, `plan text default 'free'`, `plan_renews_at`, `paddle_customer_id`) + trigger on new auth user; owner-only select/update.
- `page_generations` (`id`, `user_id`, `created_at`, `kind`) — one row per generated picture; owner select, insert only through a server function.
- `purchases` (`id`, `user_id`, `product`, `amount_cents`, `status`, `provider_ref`, timestamps) — admin-only read/write via `has_role`.
- `book_orders` (`id`, `user_id`, `title`, `pages jsonb`, `shipping jsonb`, `status`, `created_at`) — owner select/insert, admin all.
- `app_role` enum + `user_roles` table + `has_role()` security-definer function, per the standard role pattern.

**Server functions** (`src/lib/billing.functions.ts`, `src/lib/quota.functions.ts`, all `requireSupabaseAuth`):
- `getEntitlements()` → `{ plan, used, limit, remaining }`, counting `page_generations` since the 1st of the month.
- `consumeGeneration()` → checks plan/quota server-side, records the row, returns `{ allowed }`. Called from the existing generate flow in `src/routes/index.tsx` before `streamImage`; a `403`-style result opens the paywall instead of drawing.
- `startPremiumCheckout()` → server-side price lookup + Paddle checkout session, returns the URL.
- `createBookOrder({ title, pages, shipping })` → premium check, inserts a `book_orders` row plus a pending `purchases` ledger row.

**UI**: `src/components/Paywall.tsx` (dialog), `src/hooks/useEntitlements.ts` (React Query wrapper), gates added in `src/routes/index.tsx` (generate) and `src/routes/books.tsx` (Save book / Export PDF / Export ZIP / print), new routes `src/routes/account.tsx`, `src/routes/thank-you.tsx`, `src/routes/auth.tsx`, each with its own `head()` title and description. Existing green button tokens and `btn-crayon` styling reused throughout.
