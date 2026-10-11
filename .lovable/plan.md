# Add the paywall: free tier plus two paid tiers (limits now, payments later)

You chose: build the limits first and plug real payments in later, the printed book costs $1 on the top plan, and free coloring simply expires after 24 hours with no emailed link.

## What you'll see

- A **plans** screen reachable from the front cover and from every locked action, showing the three tiers side by side.
- A line on the create screens telling you how many pages you have left this month, e.g. "Free pages left: 1".
- Free coloring that quietly disappears a day later, with a short explanation instead of a surprise.
- Locked buttons where saving, printing and sharing would have been — each one says why and offers the plans screen.

## The rules being built

```text
FREE                  $9.99/mo                $25.99/mo
1 page / month        15 pages / month        unlimited pages
color only            3 books / month         unlimited books
nothing saved         save + export + share   save + export + share
gone after 24 hours                           + printed book, $1, up to 10 pages
```

- A page counts the moment a picture is drawn, including a redraw of the same page.
- Free keeps only the in-progress coloring, and only for 24 hours. No page or book is written to My Pages or My Bookshelf, and PDF, ZIP, PNG and share links are unavailable.
- Nothing is deleted that is already on your shelf from earlier testing; those items stay openable. New saves and downloads are what get locked.

## How it behaves

- Draw your one free page, color it as usual. Try to draw a second and the app stops, says you've used your free page this month, and offers the plans screen.
- The page-count screen only lets a free user start with one page.
- Reopen the app the next day and the coloring is gone: "Your coloring is kept for 24 hours. This one has expired."
- While it's still live you see a small countdown, "Kept for 20 more hours", so nothing feels lost by accident.
- The plans screen lists all three tiers with their prices and what each includes, and the sign-up button reads "Coming soon" because no payment method is connected yet.

## Technical notes

- New `src/lib/plan.ts` — one source of truth for the current plan. It returns `free` today; when payments go live it reads the customer's real subscription instead, and nothing else has to change. Plan limits live in one table: free `{pages: 1, books: 0}`, standard `{pages: 15, books: 3}`, premium unlimited. A dev-only override (`import.meta.env.DEV`) lets both states be tested; it compiles out of the shipped build.
- New `src/lib/usage.ts` — counters keyed to the calendar month in local storage, so the month rolls over on its own: `pagesThisMonth()`, `booksThisMonth()`, `canCreatePage()`, `canSaveBook()`, `recordPage()`, `recordBook()`.
- `src/routes/index.tsx` — `runForPage` is the single entry point every picture goes through (spoken, typed, snapped, or redrawn), so the allowance is checked there before anything is drawn. The three auto-save effects are skipped on the free plan so nothing reaches the shelf, and `generateBook`, `saveSelectedAsBook`, `exportPdf`, `exportZip`, `exportPagePng` and `shareBook` each refuse with a "see plans" message.
- 24-hour expiry uses the `savedAt` stamp the session already stores: on open, anything older than a day is cleared and reported. The countdown reads from the same stamp.
- `src/routes/books.tsx` — export, share and save actions are gated the same way, with the plans screen linked in place of the button.
- New route `src/routes/plans.tsx` with its own page title and description for sharing.

## Verification

Driven in the real browser at phone size: draw the one free page, confirm a second draw is refused with the upgrade message, confirm no new shelf entries appear and the download buttons are locked, then back-date the saved session and confirm it is dropped as expired. Then flip the dev override to a paid plan and confirm saving, exporting and multi-page books behave exactly as they do today.

## Worth knowing

- Until sign-in and real payments exist, the counters live on the device — clearing browser data resets them. The same rules become per-person and unforgeable the moment accounts and payments are wired in.
- The $1 printed book needs a payment method and a shipping address, so it appears on the plans screen as part of the $25.99 tier but cannot be ordered yet.
- Built-in payments also need a paid workspace plan, which this workspace isn't on; that choice stays open until you decide.
