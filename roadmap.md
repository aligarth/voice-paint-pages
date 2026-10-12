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

- Deliverability polish published to the live site: branded subject lines on all sign-up and
  password-reset emails, plus the "check your junk folder, tap Not Junk" tips on the sign-up and
  reset screens. Checked in the code the live address actually serves, and proven by a real
  password-reset email that was accepted and delivered from the new build.

- colormywords.app connected as the app's main web address: DNS records verified in public DNS, the
  domain set as primary (so the old lovable.app address redirects to it), and email links, page
  previews and the site's own canonical/address tags switched over to colormywords.app.

- Owner dashboard at /dashboard (link in Settings, owner account only): sign-ups, confirmed emails, paid upgrades, printed books sold, newest accounts.
- Printed book is $24.99 total with sales tax taken out of that price, not added on top.
- Installable on phones and computers: home-screen icon (the boy with the yellow crayon on the cover
  green), full-screen launch, app name "Color My Words". Published to colormywords.app together with
  the approved cover whose afro reads "All Races, All Ages, All Languages Welcome!"

## Open
- Ahmed's confirmation that the junk-folder tips clear the issue for his iCloud address — the
  main fix is marking a message "Not Junk" in iCloud, which trains the filter over time.
- The test account alimagarsa@icloud.com stays in the backend until Ahmed says to remove it.
- Payments still disconnected: /plans shows "Coming soon", and premium status can only be changed
  directly in the database for now.
- Payments: $9.99 Coloring Plus and $24.99 Coloring Unlimited checkout built (test mode); test payment went through — plan switch-on waits for the preview to finish updating so payment notices reach it. Going live needs Ahmed to finish the steps in the Payments tab.
- Email reputation: colormywords.app is now connected as the app's main web address, so email links
  open a real site instead of a parking page. Remaining lever needs Ahmed: reputation builds over
  weeks of real sending.
- colormywords.app hosting setup still finishing (active_provisioning) — confirm it serves the app
  over https, then re-publish so the live site carries the new address in its email links and tags.
- Printed book ($24.99 one-time) built in test mode: checkout on each shelf book, payment recorded by the webhook, 5 bonus pages added once, print-ready PDF download. Tested end to end in test mode: paid with the test card, 5 bonus pages added once, 10-page print file, second tap gives no second charge.
