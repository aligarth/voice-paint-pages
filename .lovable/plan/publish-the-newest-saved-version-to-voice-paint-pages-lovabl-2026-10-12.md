# Publish the newest saved version to voice-paint-pages.lovable.app

## What you'll get

The live address already shows the new cover and motto today — I read the page people
actually receive, not just your preview:

- Cover picture lettered **Color My Words** (the smiling boy, his camera, the planets, the
  red rocket) — the picture the live site sends is byte-for-byte the same file as the one in
  your project
- The line under it: **Speak it, Snap it, Type it, or Upload it. We'll draw it. You color it.**
- Browser tab and link previews: **Color My Words — Make Your Own Coloring Book**
- Plans page prices: **$9.99** limited, **$24.99** premium

What is **not** live yet is the newest saved work: the sign-up / password-reset email screens
still return "page not found" on the live address. So publishing is still worth doing — it
pushes that out to the same address, with the cover and motto staying exactly as they are.

Nothing else changes: same web address, same sign-in, same bookshelf and coloring pages.

## Steps

1. **Run a fresh safety check first.** Two of the three checks are stale (last run in early
   September), so I'll start a new one and read the result before publishing. The most recent
   result found nothing serious — only one note about the shared-gallery feature being open on
   purpose, which is how you want it. If a new check turns up something serious, I'll stop and
   tell you what it is before publishing.
2. **Publish to the same address.** No name change, no new address — it updates
   voice-paint-pages.lovable.app in place. The site is already set to public, so anyone you
   send the link can open it.
3. **Confirm it actually landed.** After deploying, I'll re-read the live page and check three
   things: the tab title and motto line still read correctly, the cover picture it sends is
   still the same file as the project's, and the email screens now respond instead of
   "page not found". Then I'll tell you exactly what the live site says.

## Timing

Publishing usually takes about a minute, sometimes a few minutes more. That's an estimate, not
a guarantee — I'll check the live site rather than assume it finished.

## Still waiting on you (publishing does not fix these)

- **Email delivery:** notify.colormywords.app needs its DNS records added at your domain host
  before confirmation emails can go out. Until then, nobody can finish signing up.
- **Payments:** the plans buttons still say "Coming soon" until you choose between upgrading
  your workspace for the built-in card payments or connecting your own card-processing account.

## Technical details

- Verified on the live site just now (HTTP 200): title "Color My Words — Make Your Own
  Coloring Book", motto "Speak it, Snap it, Type it, or Upload it. We'll draw it. You color
  it.", served cover asset `/assets/book-cover-DP3hMUxB.jpg` whose MD5
  (`f4a84eead93433f8a1d267f888398475`) matches `src/assets/book-cover.jpg` exactly; vision read
  of that served picture confirms the lettering "Color My Words" and the unchanged character.
- Verified stale on the live site: `GET /lovable/email/auth/preview` returns HTTP 404, while
  the route file exists in the project — confirming the deploy predates the email scaffolding
  commit (`c76e568 Scaffolded email templates`).
- Publish settings read: already published, visibility `public`, no custom domain. No slug
  change requested, so the URL stays `voice-paint-pages.lovable.app`.
- Security scan state: `supply_chain` up to date (no findings); `app_mcp` and `lov_pgscan`
  report `up_to_date: false` with their last results from 2026-09-06/07 — one `info`-level
  finding only (public policies on `shared_galleries`, the intentional share feature). A fresh
  `run_security_scan` therefore runs first and its result is read before publishing.
- Working tree is clean (`git status --short` empty), so the publish ships the committed
  state including the email routes, `src/start.ts` and `vite.config.ts` changes.
- This is a frontend + server-route deploy: the email preview/webhook routes, `src/start.ts`,
  and `vite.config.ts` are part of the app bundle, so they only reach the live address through
  this publish.
