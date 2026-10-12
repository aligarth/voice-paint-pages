# Make $24.99 the total price for the printed book (tax included)

## What changes for buyers
- The card form for the printed book shows exactly **$24.99** total, wherever the buyer is. Sales tax is taken out of that $24.99 instead of being added on top.
- Nothing else changes: same button, same 5 bonus pages, same print-ready download, one-time payment.
- The monthly plans ($9.99 and $24.99) are not changed in this round.

## Steps
1. Create a new $24.99 printed-book price marked "tax included", and move the existing price name over to it so checkout picks it up automatically. The old price is retired.
2. Run the printed-book purchase again in test mode with the test card, and confirm the card form shows $24.99 total (not €28.06 / US$30.24) and the bonus pages still arrive.
3. Publish so colormywords.app gets the printed book, the tax-included price and the customer dashboard, then open the live site to confirm.

## Technical details
- Stripe prices can't change `tax_behavior` after creation, so create a new one-time price on product `printed_book`: unit_amount 2499, currency usd, `tax_behavior: "inclusive"`, `lookup_key: "printed_book_onetime"` with `transfer_lookup_key: true`; deactivate the old price.
- `createCheckoutSession` already resolves the price by lookup key, so no code change is expected; `managed_payments` stays enabled.
- Update `mem://features/printed-book.md` to note the price is tax-inclusive.
