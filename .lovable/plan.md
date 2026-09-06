# Green buttons to match the cover sleeve

The big action buttons are currently the same red as the rocket. They will become the olive-green from the boy's shirt sleeve on the cover.

## What will change

- Main buttons across the app (Start my book, My Bookshelf, Say it, Snap it, Draw it, Generate book, Yes play my music, and similar) turn the cover's green with white lettering.
- Every place that uses that colour follows automatically, so the look stays consistent from the home screen through the coloring studio and bookshelf.
- The cover artwork itself, the red "Color My World" title on the cover, and the outlined secondary buttons stay exactly as they are.

## Technical notes

- Sampled the sleeve colour from `src/assets/book-cover.jpg`: approx `#6A9C14`, i.e. `oklch(0.61 0.155 128)`.
- In `src/styles.css`, set `--primary` to that value and keep `--primary-foreground` near-white for contrast; adjust `--ring` to match so focus outlines stay coherent.
- No component changes needed — buttons already use the `bg-primary` / `text-primary-foreground` tokens.
