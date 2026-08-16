# Fix exports so colored pages come out aligned

## What's wrong

The paint you make is stored on a fixed 1024x1024 square canvas, while the line art is displayed letterboxed inside that square (kept at its real proportions, with empty space above/below or left/right). Every export path ignores that difference:

- PDF (`src/lib/exportPdf.ts`) and ZIP (`src/lib/exportZip.ts`) size the output to the line art's real pixel size and then stretch the square paint layer to fill it.
- The single-page PNG exports in the studio (`src/routes/index.tsx`) and library (`src/routes/books.tsx`) do the same.
- The studio's own "Download page" (`ColoringCanvas.download`) does the reverse — it stretches the line art to fill the square, so lines shift instead.

Result: on any page that isn't perfectly square, the color is squashed/offset relative to the outlines, so exports look wrong even though the screen looks right.

## The fix

Use one shared flattening helper that reproduces exactly what the screen shows:

1. Output canvas = a square whose side is the longest side of the line art (matching the paint layer's coordinate space).
2. Fill white, draw the paint layer 1:1 (no scaling).
3. Draw the line art with `multiply`, scaled and centered the same way the screen does (`object-contain` fit inside the square) — the same math already used by `flattenVisible` in `ColoringCanvas`.
4. Optionally trim the empty letterbox margins at the end so the exported sheet has no dead bands.

## Technical notes

- New `src/lib/flattenPage.ts` exporting `flattenPage({ src, paint }): Promise<HTMLCanvasElement>` with the contain-fit math and the crop-to-content step.
- Rewire `src/lib/exportPdf.ts` (`toJpeg`) and `src/lib/exportZip.ts` (`renderPagePng`) to call it.
- Replace the inline flatten loops in `src/routes/index.tsx` (`exportPagePng`) and `src/routes/books.tsx` (`exportPagePng`) with the helper.
- Update `download()` in `src/components/ColoringCanvas.tsx` to use it too.
- Keep `crossOrigin = "anonymous"` on loads and wrap `toDataURL`/`toBlob` in a clear error message, so a shared/remote page image that can't be read reports a real reason instead of failing silently.

No changes to generation, the coloring tools, or saved-book storage.
