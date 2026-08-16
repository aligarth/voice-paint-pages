# Why the paint brush looks like a flat line streak

## What I found in the coloring canvas

The brush is currently the plainest possible canvas stroke:

- It draws one hard-edged polyline: `lineWidth = size`, solid color, `globalAlpha = 1`, straight `lineTo` between pointer samples (`strokeSegment`, ColoringCanvas.tsx:161-208).
- Crayon gets 3 jittered passes at 28% opacity and marker gets 65% opacity, so those two read as "art tools" — brush has no texture, no soft edge, no opacity build-up, and no width variation, so it reads as a pen/marker streak.
- Stroke width is in canvas pixels on a fixed 1024x1024 backing canvas that is displayed much smaller (the page is an `aspect-square` box, typically ~500-700 CSS px). A size of 24 therefore paints roughly 12-16 px on screen, which is why even mid sizes feel thin.
- Consecutive pointer samples are joined with straight lines only, so fast strokes come out as visible angular streaks instead of a smooth sweep.

So: nothing is broken — the brush is literally a thin, hard, constant-width line.

## Proposed fix

1. **Make the brush feel like a brush.** Replace the single hard line with a layered stroke:
   - a soft outer pass at low alpha and slightly larger width (soft edge / bristle bleed),
   - a main body pass at full alpha,
   - a light inner core pass for a hint of a loaded-brush center.
2. **Add smoothing.** Interpolate between the last and current point with quadratic curves through midpoints so quick strokes are curved, not faceted.
3. **Add width dynamics.** Vary width with pointer speed (and pressure when the device reports it), so strokes taper naturally at start/end instead of being perfectly uniform.
4. **Fix perceived size.** Scale stroke width by the ratio between the 1024 backing canvas and its on-screen size so the size chips paint at the thickness the swatch implies, and widen the top of the size range for the brush.
5. **Keep the other tools untouched** — crayon, marker, eraser and the paint bucket (including its wall-width and tolerance behavior) stay exactly as they are today.

## Technical notes

- All changes are in `src/components/ColoringCanvas.tsx`: `strokeSegment` becomes tool-aware with a dedicated brush path, plus a small stroke-state ref holding the previous midpoint and last width for smoothing and taper.
- Width scaling reads the canvas `getBoundingClientRect()` width once per stroke start, so the multiplier does not cost anything per move event.
- Pressure comes from `e.pressure` on the pointer event, falling back to speed-based width when pressure is 0 or unsupported (mouse).
- The bucket's `buildWallMap` uses `size` for wall dilation; the display-scale multiplier will be applied only to painting strokes so bucket behavior is unchanged.
