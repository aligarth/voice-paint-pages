# Fill preview overlay for the Paint Bucket

Hover (or press-and-hold on touch) with the Paint Bucket selected and the app highlights the exact closed region it would fill, in a semi-transparent version of your current color. If the area isn't closed, the highlight shows in a warning tint instead so you know the fill would be refused before you commit.

## Behavior

- Only active when the Paint Bucket tool is selected.
- Desktop: highlight follows the cursor as you move over the page.
- Touch/pen: highlight appears on first tap-hold; lifting the finger performs the fill. Nothing is painted until the tap completes.
- Highlight clears on pointer leave, tool change, page change, or after the fill runs.
- Closed region: tinted with the current color at ~40% opacity.
- Open region: tinted red/amber at ~30% opacity, matching the existing "That area isn't closed" rule.

## Technical notes

All work stays in `src/components/ColoringCanvas.tsx`.

- Extract the region-detection half of `floodFill` into a shared `computeRegion(startX, startY)` helper that returns `{ pixels, touchesEdge }` using the existing `buildWallMap` + tolerance logic. `floodFill` then reuses it to paint, so preview and fill can never disagree.
- Add a third `<canvas>` layer (`previewRef`) above the paint canvas and line art, `pointer-events-none`, same 1024x1024 backing size and `absolute inset-0` sizing.
- On `onPointerMove` with `tool === "bucket"`, run `computeRegion` at the hovered point, then write the tinted pixels into the preview canvas via `putImageData`; clear it first each time.
- Throttle preview computation with `requestAnimationFrame` and skip recomputation while the pointer stays inside the previously previewed region, so hover stays smooth on a 1M-pixel flood fill.
- Cache the wall map per line-art image + `size` value so hover moves don't rebuild the dilated map on every frame; invalidate it when `src` or `size` changes.
- Clear the preview canvas in `onPointerLeave`, in an effect on `tool`/`src` change, and right before `floodFill` commits.
