# Give the paint brush a clean, solid edge

The haze is the brush's "soft bristle bleed" pass: every segment paints an extra stroke 35% wider than your brush at 16% opacity, and overlapping segments stack that translucency into a visible glow. Removing it makes brush strokes crisp and fully opaque.

## What changes for you

- Brush strokes paint with a clean, solid edge — no halo or glow around them.
- The brush keeps its smooth curves and its speed/pressure tapering, so it still feels like a brush rather than a hard pencil.
- Crayon, Marker, and Eraser are untouched.

## Technical details

In `src/components/ColoringCanvas.tsx`, inside the `tool === "brush"` branch of `strokeSegment`:

- Delete the `drawPass(width * 1.35, 0.16)` bleed pass and the `drawPass(width * 0.45, 0.65)` core pass.
- Paint a single pass at full opacity (`alpha = 1`) with the smoothed quadratic curve and the existing dynamic `width`, keeping `lineCap`/`lineJoin` round so joins stay smooth.
- Leave the width smoothing (`lastWidth`), midpoint smoothing (`lastMid`), and speed/pressure logic exactly as they are.

Then verify in the studio that a brush stroke has a hard edge, overlapping passes don't darken, and undo/redo plus saving still behave normally.
