# Remove the Paint Bucket fill tool

Strip the fill feature and everything built for it out of the coloring studio, leaving Brush, Crayon, Marker, and Eraser working exactly as they do now.

## What changes for you

- The "Fill color" bucket disappears from the tool list.
- Its extra controls go away too: the fill tolerance slider, the "Closed shape / Fill area" mode toggle, the "Wall width" label variant, and the semi-transparent region preview highlight.
- Nothing else about coloring, undo/redo, saving, or exporting changes.

## Technical details

All in `src/components/ColoringCanvas.tsx`:

- Remove `"bucket"` from the `Tool` union and from the tools array; drop the `PaintBucket` icon import.
- Delete `fillTolerance` and `fillMode` state plus their UI block, and revert the size label to always read "Size".
- Delete `buildWallMap`, the wall-map cache, `computeRegion`, `floodFill`, `drawPreview`, `clearPreview`, `previewMask`, `previewGen`, and the `previewRef` overlay canvas and its element.
- Remove all bucket branches from the pointer down/move/up handlers and the pending-tap logic, and reset the canvas cursor to `crosshair`.
- Clean up the effect dependency lists that referenced the removed state.

Then verify the studio still builds and painting/erasing/undo behave normally.
