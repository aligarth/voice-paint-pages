# Connect Stripe so $9.99 Coloring Plus unlocks 15 pages

Your workspace is now on the Pro plan, so Lovable's built-in Stripe payments can be turned on. You won't need your own Stripe account, and everything starts in test mode, so no real money moves until you go live.

## What you'll see
- The "Coming soon" button on the Coloring Plus card becomes **Upgrade for $9.99/month**. Tapping it opens a secure Stripe checkout.
- Once payment goes through, you come back to the app. Settings shows "Plan: Coloring Plus" with "15 of 15 left", and the start screen says "Pages left this month: 15".
- The plan stays active while the subscription is paid. If it's cancelled or a payment fails, the account goes back to Free (1 page).
- A **Manage subscription** link in Settings lets people cancel or change their card.
- Anyone not signed in who taps Upgrade is asked to sign in first, then taken back to the plans screen.

## Scope
- This round covers Coloring Plus only ($9.99/month, 15 pages, 3 books).
- Coloring Unlimited ($24.99/month) and the printed book ($24.99) stay "Coming soon". They can be added later the same way.

## Steps
1. Turn on built-in Stripe payments (test mode first). You'll fill in a short form.
2. Tax: Stripe handles sales tax, fraud and disputes for you (+3.5% per sale on top of Stripe's normal fee). You can change this later.
3. Create the "Coloring Plus" product: $9.99/month, tagged as digital software.
4. Connect checkout to the Upgrade button, and have Stripe's payment notices update the person's plan on their account.
5. Test it end to end with Stripe's test card while signed in as the test account: pay, then confirm Settings shows Coloring Plus with 15 pages left, then cancel and confirm it goes back to Free.

## Technical notes
- Run `recommend_payment_provider` first, then `enable_stripe_payments`, then `batch_create_product` with a SaaS tax code. Checkout session uses `managed_payments: { enabled: true }`, mode `subscription`, and `client_reference_id` = userId.
- A new authenticated server function creates the checkout session. A webhook server route under `src/routes/api/public/` verifies the Stripe signature and then uses the admin client to upsert `account_plans` (`plan = 'standard'` on active/trialing; `'free'` on canceled/unpaid/deleted). Store the Stripe customer and subscription ids in new columns on `account_plans` (migration).
- `getEntitlements` already reads `account_plans`, so the page limits (`PLAN_LIMITS.standard`) apply with no changes to the counting code. After checkout returns, call `refreshAccount()` so the new plan shows right away.
- Customer portal session for Manage subscription.
- Add a test that a `standard` plan allows 15 pages and 3 books, and that the webhook maps subscription status to the correct plan.
