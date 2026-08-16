# Restore the "Snap it" camera button

## Goal
Put the camera-based "Snap it" action back on the main screen next to "Say it", while keeping the existing gallery "Choose photos" option in the photo section below.

## What changed before
The previous update removed the dual "Say it / Snap it" button row and replaced the headline with "Say it or choose it". The camera flow was moved entirely into the lower "Make a book from your photos" section as a "Choose photos" button without `capture="environment"`.

## What to build
1. Restore a second circular action button beside the mic button:
   - Label: "Snap it"
   - Icon: `Camera`
   - Behavior: opens the device camera directly using a dedicated file input with `capture="environment"` and `accept="image/*"`.
2. Update the headline back to "Say it or snap it. We draw it. You color it." and the description to mention snapping a photo again.
3. Keep the lower photo section and its "Choose photos" gallery button unchanged.
4. Reuse the existing `pickPhotos` / `PhotoPrep` pipeline so snapped photos still go through crop/brightness and review.

## Files to change
- `src/routes/index.tsx` — add the Snap it button, restore headline copy, wire a camera-only file input.
- `src/lib/photo.ts` (if needed) — confirm `fileToDataUrl` handles camera-captured files.

## Acceptance
- Main screen shows "Say it" (mic) and "Snap it" (camera) buttons side-by-side.
- Tapping "Snap it" on a phone opens the rear camera.
- The lower "Choose photos" gallery flow continues to work.
