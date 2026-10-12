# Publish the new name and motto to the live site

## What you'll get

The web address **voice-paint-pages.lovable.app** currently still shows the old version:
its browser tab reads "Color My World" and the line under the picture reads
"Say it or snap it. We draw it. You color it." Your copy of the app already has the new
name and the new motto, so this is only about pushing that saved version out to the address
people visit.

After this, the live site will show:

- Cover picture lettered **Color My Words** (the smiling boy, his camera, the planets and the red rocket)
- The line under it: **Speak it, Snap it, Type it, or Upload it. We'll draw it. You color it.**
- Browser tabs, link previews and shared-book previews all carrying the same wording

Nothing else changes: same web address, same sign-in, same bookshelf and coloring pages.

## Steps

1. **Run a fresh safety check.** The last scan is over a month old, so I'll run a new one and
   read the result. The most recent check found nothing serious — only one note about the
   shared-gallery feature being open on purpose, which is how you want it. If a new scan turns
   up something serious, I'll stop and tell you what it is before publishing.
2. **Publish to the same address.** No name change, no new address — it updates
   voice-paint-pages.lovable.app in place. The site is already set to public, so anyone you
   send the link can open it.
3. **Confirm it actually landed.** Once deployed, I'll open the live address and read back the
   tab title, the motto line and the cover picture, and tell you exactly what the live site
   now says.

## Timing

Publishing usually takes about a minute, sometimes a few minutes more. That's an estimate, not
a guarantee — I'll check the live site rather than assume it finished.

## Technical details

- Frontend-only deploy: the cover asset (`src/assets/book-cover.jpg`, re-lettered "Color My
  Words") plus the motto text in `src/routes/index.tsx` (visible line under the cover, and the
  route's description/og:description) and `src/routes/__root.tsx` (description/og:description).
  No database or sign-in changes, so nothing deploys automatically ahead of this.
- Verified in the running preview: the motto paragraph renders as
  "Speak it, Snap it, Type it, or Upload it. We'll draw it. You color it." and no "Color My
  World" string remains anywhere in `src/`, `remotion/` or the readme.
- Verified on the live site just now (HTTP 200): title still "Color My World — Make Your Own
  Coloring Book", old motto still served — confirming the deploy is stale, not the source.
- Publish settings read: already published, visibility `public`. No slug change, so the URL
  stays `voice-paint-pages.lovable.app`.
- Security scan state: one `info`-level finding only (public policies on `shared_galleries`,
  the intentional share feature). All scanners report `up_to_date: false`, so a fresh
  `run_security_scan` runs first and its result is read before publishing.
- The promo video scenes (`remotion/`) carry the same wording but are not part of this web
  deploy — they render to a video file separately, so nothing there needs publishing.
