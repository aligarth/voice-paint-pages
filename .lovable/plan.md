# Plan: Closed-Area Bucket Fill

## Goal
Improve the new Paint Bucket tool so it only floods enclosed coloring-book regions and works consistently alongside the brush, crayon, marker and eraser tools.

## Current State
`src/components/ColoringCanvas.tsx` already has a basic flood-fill implementation that reads the line-art image and treats dark pixels as walls. It fills the paint layer wherever the click starts and matches the existing paint color.

## Changes

1. **Enclosed-region detection**
   - During the flood fill, track whether any filled pixel touches the canvas edge.
   - If the region reaches the edge, the area is not closed; abort the fill so the whole page does not get colored.

2. **Respect brush size / line thickness**
   - Use the current brush size as a wall-thickness buffer when sampling the line-art pixel.
   - Thicker "walls" make the fill stop sooner, preventing leaks through thin or anti-aliased lines.

3. **Tool integration**
   - Keep the bucket as a first-class tool in the tool grid.
   - Disable the brush-size visual preview for the bucket (it is not a stroke tool), but still read the size value for the wall buffer.
   - Make sure switching from brush/crayon/marker/eraser to bucket and back preserves the selected color and size.

4. **Visual feedback**
   - Change the cursor to a paint-bucket icon when the bucket tool is active.
   - Briefly flash a message if the user clicks an open area ("That area isn't closed — try a closed shape").

## Files to Edit
- `src/components/ColoringCanvas.tsx`

## Out of Scope
- No new routes, backend, or storage changes.
- No changes to the generation or sharing flows.
