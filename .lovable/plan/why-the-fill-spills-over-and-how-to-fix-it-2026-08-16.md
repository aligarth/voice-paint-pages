# Why the fill spills over — and how to fix it

## What's going on

Two things in the current fill can make it cover much more than the shape you tapped.

1. **The fill's copy of the drawing doesn't line up with the drawing you see.**
   On screen the outline picture is fitted inside the square with "contain" (kept at its own proportions, with blank strips if it isn't perfectly square). The fill, however, stretches that same picture to fill the whole square before scanning it. If the picture isn't exactly square, every outline in the fill's copy sits slightly off from where you tapped, so the color walks straight past lines and floods neighboring areas.

2. **The color-match slack is too generous.**
   The fill currently accepts any pixel within 32 shades per channel of the tapped color. Soft grey edges around thin outlines fall inside that window, so the fill steps over the line instead of stopping at it.

Both are unconfirmed as the specific cause of what you just saw until the fix is in and retested, but they are the only two paths that produce "way larger" on a properly closed drawing.

## Changes

1. Draw the outline picture into the fill's scratch copy using the exact same "contain" fit the screen uses (same offset, same scale, blank strips left white), so lines land where you tapped them.
2. Tighten the match slack from 32 to a small value (about 12) so faint grey edge pixels count as a wall, not as fillable space.
3. Treat clearly dark pixels as hard walls regardless of the tapped color, so an anti-aliased outline can never be crossed.
4. Keep everything else as-is: one tap, one undo step, paint layer only, outlines untouched.

## Technical notes

In `src/components/ColoringCanvas.tsx`:

- `flattenVisible`: replace `ctx.drawImage(line, 0, 0, out.width, out.height)` with letterbox math derived from `naturalWidth`/`naturalHeight` matching `object-contain`.
- `FILL_TOLERANCE`: 32 -> 12.
- In `fillAt`'s `matches`, add an early reject when the pixel's luminance is below a dark threshold (~110) and the seed pixel is not itself dark.

## Verification

Load a generated page, tap inside a small enclosed shape, confirm the fill stops at its outline; tap the background and confirm it fills background only.
