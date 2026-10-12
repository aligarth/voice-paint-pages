# Roadmap

## Done
- Paywall: free tier (1 page/month, color only, nothing saved, 24-hour expiry), $9.99 and $25.99 tiers,
  plans screen, locked save/export/share actions.
- Backend tables for per-account storage: books, book_pages, usage counters, account plans — each row
  readable only by the person it belongs to.
- Email/password sign-in turned on in the backend.
- Sign-in screens: create account, sign in, forgot password, reset password, sign out, plus a
  signed-in indicator on the cover and the bookshelf.
- Pages, books, coloring and monthly limits now live in the signed-in person's own space; the
  bookshelf and page creation ask for sign-in first.
- Anything already drawn on this device is copied into the account the first time they sign in.
- App renamed to "Color My Words": cover picture re-lettered and every title, shared-link line,
  readme and promo card updated.

## Open
- Blocker: no email sender is configured for this project, so confirmation emails can't be delivered
  and nobody can finish creating an account. Waiting on Ahmed to choose between connecting his own
  email domain or letting sign-in start immediately without email confirmation.
- Payments still disconnected: /plans shows "Coming soon", and premium status can only be changed
  directly in the database for now.
