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

- Email domain notify.colormywords.app verified in public DNS: nameserver handover plus the
  sending, mail-routing and spam-check records all present and correct — nothing left to add at
  the domain host.
- Sign-up tested end to end on the live site: test account created, confirmation email sent and
  accepted, password-reset email sent and accepted, and Settings shows the real plan and pages
  left ("Plan: Free", "1 of 1 left").

## Open
- Ahmed confirmed the emails arrive but land in the iCloud junk folder — expected for a brand-new
  sending domain (no reputation yet). App-side polish shipped: branded subject lines on all auth
  emails ("Confirm your email — Color My Words" etc.) and a "check your junk folder, tap Not Junk"
  hint shown after sign-up and after a password reset. Primary fix is recipient-side: marking the
  message Not Junk trains iCloud's filter; new-domain reputation improves over the coming weeks.
- The test account alimagarsa@icloud.com stays in the backend until Ahmed says to remove it.
- Payments still disconnected: /plans shows "Coming soon", and premium status can only be changed
  directly in the database for now.
