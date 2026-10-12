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
- Motto changed to "Speak it, Snap it, Type it, or Upload it. We'll draw it. You color it." on the
  start screen, in page titles/descriptions, and in the promo video.
- Live site re-published: voice-paint-pages.lovable.app now serves the "Color My Words" cover and
  the new motto (checked in the served page and in the picture the live site sends).
- Live site re-published again with the newest saved code: the sign-up / password-reset email
  screens now respond at the live address (they were "page not found" before). Cover, motto, tab
  title and plan prices re-checked in the served page; fresh safety check before publishing found
  nothing serious.

## Open
- Blocker: notify.colormywords.app is set up but still waiting on its DNS records being added at
  the domain host, so confirmation emails can't be delivered yet and nobody can finish creating an
  account. Verification usually takes a few minutes (up to 72 hours) once the records are in.
- Payments still disconnected: /plans shows "Coming soon", and premium status can only be changed
  directly in the database for now.
