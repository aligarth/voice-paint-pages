# Home cover: final approved artwork

## What changes on the cover page

1. Replace the existing `src/assets/book-cover.jpg` cover art with the final approved version: a smiling Black boy with an afro, camera around his neck, two dimples, a light goatee, sideburns, no eyebrow slit/face tattoo, set against an outer-space background with stars and planets, and a small red rocket arcing across the scene with no smoke/exhaust trail. The "Color My World" title treatment is kept.
2. Remove the **My Pages** link from the cover page. Only **Start my book** and **My Bookshelf** remain there. (My Pages stays reachable from other screens, so nothing is lost.)
3. Update the cover image `alt` text to describe the new character and scene.
4. Rebalance the cover button row spacing after removing the My Pages link.

## Technical notes

- `src/routes/index.tsx`, cover step (~lines 756-782): drop the My Pages link, keep the Start my book button and My Bookshelf link, and rebalance the button row spacing.
- Overwrite `src/assets/book-cover.jpg` with the final approved cover image (`new-book-cover-preview-v4.jpg`).
- No other screens, flows, or logic change.
