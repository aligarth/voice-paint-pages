# Fill With Color (MS Paint style)

Bring back a bucket-fill tool, but built the way Microsoft Paint actually works — no "closed region" rules, no tolerance guessing, no preview overlay.

## How MS Paint behaves (what we will match)

- You tap a spot. Paint looks at the color of that exact pixel on the **visible picture**.
- It spreads outward across every touching pixel of that same color and stops at anything different — the black outline, or paint you already laid down.
- If the outline has a gap, the color leaks through to the next area. That is correct Paint behavior, not a bug.
- Tapping directly on a black line fills the line's connected black pixels, nothing more.
- One tap = one undo step.

## Why the earlier version felt broken

The old tool filled based only on the transparent paint layer, so it never really "saw" the drawing's outlines, then tried to compensate with an enclosed-region check and a tolerance slider. Those extra rules are what made it refuse to fill or bleed unpredictably.

## What gets built

1. A fifth tool chip, **Fill with color**, next to Brush / Crayon / Marker / Eraser, with a bucket icon and a bucket cursor.
2. It uses the currently selected color and works with the full palette plus saved favorites, same as every other tool.
3. Filling is a single tap (no dragging), respects undo/redo, autosave checkpoints, and PNG/PDF/ZIP export like normal paint strokes.
4. Anti-aliasing handling: a small fixed color-match window so soft grey edge pixels next to a line don't leave a visible halo. Fixed value, no slider.

## Technical notes

In `src/components/ColoringCanvas.tsx`:

- Add `"fill"` to the `Tool` union and to `TOOLS`.
- On pointer down with `tool === "fill"`: `pushHistory()`, then run the fill and `reportPaint()`; skip the stroke path entirely.
- Build a scratch 1024x1024 offscreen canvas each fill = line-art image drawn first, then the paint canvas composited on top. This flattened buffer is the "what the user sees" source the scan reads from — this is the core correction versus the previous attempt.
- Scanline flood fill (stack-based, row spans) over that buffer starting at the tapped pixel, matching within a fixed per-channel tolerance (~32) plus alpha. Mark matched pixels in a `Uint8Array` mask.
- Write the mask into a transparent `ImageData` of the chosen color and `putImageData`-blit it onto the paint canvas, so the line art is never overwritten.
- No region preview canvas, no `previewGen`, no enclosed-edge test, no tolerance state.
