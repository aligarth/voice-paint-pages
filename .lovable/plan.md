# Every drawn page comes out with sealed lines

Right now the drawing prompt asks the model for unbroken outlines, but nothing checks the picture that comes back. A single hairline break — and AI line art almost always has a few — is enough for paint to escape into the rest of the page. The fix is to stop trusting the picture and clean it up before it ever reaches the coloring canvas.

## What changes for you

- Every finished page (spoken, typed, photo, or upload) is automatically cleaned so all shapes are closed before you can color it.
- Lines come out crisp black on pure white, with a thin closed frame around the page, so paint can never run off the edge.
- Nothing new to tap. It happens as the page finishes drawing.

## How the sealing works

A new step runs once per page, right after the final image arrives:

1. **Flatten to black and white.** Grey and blurry anti-aliased edges become solid line or solid paper — no in-between pixels for the fill to sneak through.
2. **Close the gaps.** Grow the line by a few pixels, then shrink it back. Real gaps get bridged; line thickness stays the same.
3. **Bridge stubborn breaks.** Any remaining open line-ends within a short distance of another line get joined with a short black connector.
4. **Frame the page.** Draw a thin closed black rectangle just inside the edges.
5. **Verify.** Check that the outside-the-drawing paper region does not reach the middle of the picture. If a page still reads as leaky, retry sealing once with stronger settings; if it still fails, the page draws normally and coloring falls back to today's in-canvas gap sealing.

## Technical notes

- New `src/lib/sealLineArt.ts`: canvas-based `sealLineArt(dataUrl, strength)` returning a PNG data URL. Reuses the same dilate/erode approach already proven in `src/components/ColoringCanvas.tsx`, plus an end-point bridging pass and border stroke.
- `src/routes/index.tsx` `runForPage`: streaming frames still render raw for live progress; on the final frame, the image is passed through `sealLineArt` before the page is marked `done` and stored, so saved pages and PDF exports use the sealed version.
- Prompt in `src/routes/api/generate-image.ts` gains explicit instructions for thick closed contours and no open line-ends; `src/routes/api/photo-to-lineart.ts` gets the same wording so both paths produce sealable art.
- `src/lib/photo.ts` keeps its existing white pad + border behavior; the seal pass runs after it.
- Canvas fill in `ColoringCanvas.tsx` is unchanged — it stays as the safety net, and its leak guard becomes the signal that a page was not sealable.
