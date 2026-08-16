# Plan: Bucket Fill — Closed Shapes Only

## Goal
Make the Paint Bucket tool fill only the closed shape the user taps, using the current brush/wall-size setting, and never spill across the whole page.

## What the user wants
Keep the one-tap-per-shape bucket behavior, but ensure it respects the selected size and only fills the specific closed region on screen.

## Changes

1. **Closed-area guard**
   - During the flood fill, collect every pixel that would be filled.
   - If any of those pixels reaches the edge of the canvas, the tapped area is not fully enclosed; abort the fill and show a brief message.

2. **Wall-thickness follows the selected size**
   - Thicken the detected line-art walls by a radius derived from the current size setting.
   - This prevents the fill from leaking through thin or slightly anti-aliased lines when a larger size is selected.

3. **Tool integration**
   - Keep the bucket as a first-class tool in the tool grid.
   - Rename the size label to "Wall width" while the bucket is active so users understand its purpose.
   - Preserve the selected color and size when switching between brush, crayon, marker, eraser, and bucket.

4. **Visual feedback**
   - Use a paint-bucket cursor when the bucket tool is active.
   - Show a short toast: "That area isn't closed — try a closed shape" when a tap is aborted.

## Files to Edit
- `src/components/ColoringCanvas.tsx`

## Out of Scope
- No new routes, backend, or storage changes.
- No auto-coloring of the entire page at once.
