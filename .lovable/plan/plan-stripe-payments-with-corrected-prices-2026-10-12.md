# Plan: Stripe payments with corrected prices

## Prices (confirmed by you)
- **Limited plan ("Coloring Plus"): $9.99/month** — 15 pages, 3 books per month (unchanged)
- **Premium plan ("Coloring Unlimited"): $24.99/month** — unlimited pages and books (was $25.99, will be corrected)
- **Printed book order: $24.99** one-time (unchanged)

## Step 1 — Fix the displayed price (no payment setup needed)
- Update the plans screen so Premium shows **$24.99/month** instead of $25.99.
- This can be done immediately, before payments are connected.

## Step 2 — Connect Stripe (blocked on workspace plan)
Lovable's built-in Stripe payments require a paid workspace plan; this workspace is not on one yet, so the connection cannot be enabled right now.

Two paths:
1. **Upgrade the workspace plan**, then I enable built-in Stripe payments (no Stripe account needed; a test environment is created first so you can try purchases without real money).
2. **Use your own Stripe account** with your own API keys instead — works without a workspace upgrade.

## Step 3 — Once Stripe is connected
- Create the two subscription products: Limited $9.99/month and Premium $24.99/month.
- Create the one-time printed book product at $24.99.
- Wire the plans screen buttons so tapping a plan opens checkout; after payment, the account's plan flips to limited or premium automatically and the monthly page limits update.
- Wire the printed book order: collect payment plus a shipping address, and save the order so you can print and mail each book. (Printing and shipping itself stays manual — the app collects the order and money only.)
- Test the full flow in the test environment before going live.

## What I need from you
- Approve this plan to do Step 1 now (price fix).
- Tell me which payment path you want: upgrade the workspace for built-in Stripe, or connect your own Stripe account.
