# Add a closed border frame to uploaded photos

Uploaded/snapped photos often have subjects that run off the edge of the frame, so the line art comes out with open edges and paint leaks out when filling. Fix: give every prepared photo a solid rectangular border, and tell the line-art generator to keep it.

## What changes for you

- After cropping in the "Get it camera-ready" step, each photo gets a thin white margin plus a solid black rectangle drawn around it.
- A "Add border" toggle in that step (on by default) so you can turn it off for photos that already have a clean frame.
- Generated pages then always have four closed straight lines around the picture, so the fill tool can't spill outside the page.

## Technical notes

1. `src/lib/photo.ts`
   - Extend `PhotoAdjust` with `border?: boolean` (default true in `DEFAULT_ADJUST`).
   - In `adjustPhoto`, after drawing the cropped/adjusted image: reset `ctx.filter`, inset the drawn image by a small padding (about 3% of the short side) on a white background, then stroke a rectangle with `lineWidth` about 1.5% of the short side in near-black, aligned on half-pixel coordinates so it stays crisp.

2. `src/components/PhotoPrep.tsx`
   - Add a pill toggle next to the framing presets bound to `adjust.border`, respecting the existing crop-lock behavior (border choice persists like brightness/contrast when locked).
   - Show the border in the live preview as a CSS outline/inset ring so it matches the exported result.

3. `src/routes/api/photo-to-lineart.ts`
   - Add to the instruction: preserve the existing rectangular border as four straight, unbroken black lines forming a fully closed frame at the edge of the page; do not crop it away, do not add extra frames or decoration.

No changes to the voice/text generation route or the coloring canvas.
