# Home cover: fewer buttons, new cover character

## What changes on the cover page

1. Remove the **My Pages** link from the cover page. Only **Start my book** and **My Bookshelf** remain there. (My Pages stays reachable from the other screens, so nothing is lost.)
2. Replace the dragon cover art with new artwork: a smiling Black boy with an afro, a camera hanging around his neck, and a visible dimple — drawn in the same friendly, colorful coloring-book style, with the "Color My World" title treatment kept.

## Technical notes

- `src/routes/index.tsx`, cover step (~lines 756-782): drop the My Pages link, keep the Start my book button and My Bookshelf link, and rebalance the button row spacing.
- Generate the new cover image and overwrite/replace `src/assets/book-cover.jpg` (imported as `coverArt`), updating the `alt` text to describe the new character.
- No other screens, flows, or logic change.
