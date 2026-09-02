# Keep the fill inside the lines again

## What's actually in the code today

The containment work is still there, in three places:

- `src/routes/api/generate-image.ts` and `src/routes/api/photo-to-lineart.ts` both instruct the model to draw closed, unbroken outlines, and the photo route is told to keep/add a rectangular border.
- `src/lib/photo.ts` draws a real black frame around every prepared photo (`border: true` by default), toggleable in Photo prep.
- `src/components/ColoringCanvas.tsx` has the bucket fill (`fillAt`), which flattens white paper + paint + line art and treats any pixel darker than `DARK_WALL = 110` as a wall.

So nothing was deleted. The leaks come from the wall test being too permissive for real line art:

- Thin or soft (anti-aliased) outlines can sit lighter than 110, so the fill walks straight through them.
- A single 1-pixel gap in a generated outline lets the whole region drain out.
- Diagonal walls can be crossed at corners because the fill queues neighbours before re-checking.
- Where a picture has no closed outer contour, tapping background legitimately floods the whole page.

## What will change

1. **Stronger wall detection** — raise the wall threshold and treat "not clearly paper-white" as a wall rather than only "dark", so grey and anti-aliased edges stop the fill.
2. **Thicken walls before filling** — build a wall map from the flattened view and dilate it by 1-2 pixels, so hairline outlines and pixel-wide gaps become solid barriers. The dilation is used only for the fill decision; the painted result is trimmed back so color still reaches right up to the line.
3. **Gap sealing** — close 1-3 pixel gaps in the wall map (morphological close) so small breaks in AI outlines no longer leak.
4. **A page boundary** — treat the canvas edge as a wall so a fill can never run off the sheet, and offer an always-on thin frame around generated pages so background taps stay inside the page.
5. **Safety cap with feedback** — if a fill would cover more than a large share of the page (a sign it leaked), stop it, leave the page untouched, and show "That area isn't closed — try tapping inside a smaller shape."
6. **Fill strength control** — bring back a small slider ("Fill strength" / gap sealing 0-3) so a user can loosen it on very sketchy pages.

## Technical notes

All in `src/components/ColoringCanvas.tsx`:

- Replace the inline `matches` luminance check in `fillAt` with a precomputed `Uint8Array` wall map from `flattenVisible`, using a whiteness test plus dilation/closing controlled by a `gapSeal` state value.
- Flood fill over the non-wall map with the existing scanline loop, then erode the resulting mask by the dilation radius before blitting, so paint meets the outline without covering it.
- Add the leak guard (`filled / (w*h)` over threshold → abort + message) and a small "Fill strength" control in the tools panel next to Size.
- Cache the wall map per line-art image + canvas size, invalidated on paint changes and page switches.

`src/lib/photo.ts` / photo prep: keep the border default on; no behaviour change beyond that.

No changes to generation prompts, saving, exports, or the other brushes.
