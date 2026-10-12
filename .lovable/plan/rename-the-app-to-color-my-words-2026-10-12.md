# Rename the app to "Color My Words"

The name changes from **Color My World** to **Color My Words** everywhere it shows: the front cover picture, browser tab and link-preview titles, the shared-book message, and the promo video cards. The cover keeps the same art — the smiling boy with an afro, the camera around his neck, his dimple, and the space scene with planets, stars and the red rocket. Only the lettering changes.

## What happens

1. **Re-letter the cover picture.** The words are painted into the cover image itself (red bubble letters with a white outline, arched above the boy's head), so the picture is edited rather than retyped: the title becomes "Color My Words" and everything else in the artwork stays as it is. The new picture is checked by reading the letters back — if they come out wrong or the boy changes, it is tried again.
2. **Rename every mention in words.** Tab titles, sign-in / plans / settings / bookshelf / shared-book page titles, the cover's description for screen readers, the "made in Color My Words" line on shared links, the project readme, and the two promo video title cards.
3. **Check the result.** The app is opened in a browser to confirm the cover visibly reads "Color My Words", and a search confirms no "Color My World" is left anywhere.

## After this

The live site at voice-paint-pages.lovable.app still shows the old name until you ask me to publish the update. The web address itself does not change.

## Technical details

- **Cover art:** `imagegen--edit_image` on `src/assets/book-cover.jpg` (mode `edit`), prompt keeps the composition and lettering style (bold rounded red bubble letters, thick white outline, thin black outer line, arched above the boy's head) and replaces only the word "World" with "Words". Output overwrites the same path so the `coverArt` import at `src/routes/index.tsx:64` and the `<img>` at `src/routes/index.tsx:922` need no change. Verified with `vision--describe_image` for exact visible text and unchanged character details; one retry allowed before switching to a fresh generation matched to the original.
- **Text rename (case-preserving, "World" → "Words" in brand phrases only):**
  - `src/routes/__root.tsx:82,88,89`
  - `src/routes/index.tsx:73,80,924` (alt text)
  - `src/routes/auth.tsx:12,18`, `src/routes/settings.tsx:12,14,15`, `src/routes/reset-password.tsx:10,13,15,18`, `src/routes/plans.tsx:11,17`, `src/routes/books.tsx:55,61`, `src/routes/github.tsx:11,15,17,20`, `src/routes/gallery.$id.tsx:9,12,14,17`
  - `src/lib/shareBook.ts:32`
  - `remotion/src/scenes/WelcomeScene.tsx:84`, `remotion/src/scenes/EndCardScene.tsx:73`
  - `remotion/scripts/render-remotion.mjs:35` output filename `color-my-world-promo-` → `color-my-words-promo-`
  - `README.md:1`
- Untouched: the slogan "Say it or snap it. We draw it. You color it.", all prices and plan copy, and the `voice-paint-pages` URL slug.
- **Verification:** `/tmp/observability/build-errors.log` clean; `rg -i "color my world"` returns nothing; Playwright screenshot of `/` at 1280x1800 confirming the cover lettering.
