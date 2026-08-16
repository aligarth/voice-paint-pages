# Add real people footage to the Color My World promo

Replace the illustrated placeholder scenes with live-action clips of real people using the app — a kid/parent speaking to the phone, hands snapping a photo, and fingers coloring on a tablet — while keeping the same story, palette, and typography.

## Footage to create (AI-generated live action, 8s each, 1080p)

1. **Say it** — Close-up of a child holding a phone up, speaking excitedly toward it; warm daylight kitchen table, parent partly in frame.
2. **Snap it** — Hands holding a phone photographing a toy dinosaur on a table; shutter moment, shallow depth of field.
3. **Color it** — Over-the-shoulder shot of a child's finger coloring a line-art page on a tablet, bright colors filling in.
4. **Together** — Parent and child laughing over a tablet with a finished colored page, cozy living room.

Each clip is generated as a video (not a still), downloaded into `remotion/public/video/`, then used as the scene background.

## How it's used in the video

- Welcome and end card stay graphic/typographic (logo, slogan, CTA) over a slow push-in of the "Together" clip, dimmed with a paper-tone overlay so text stays readable.
- Say it / Snap it / Color it scenes become footage-first: real clip fills the frame, with a soft vignette plus the existing animated UI overlays on top (transcript bubble, shutter frame, palette dots) so app features remain clear.
- Line-art and colored dragon stills are kept as the on-screen "app result" inserts.
- Motion system unchanged: same springs, same transitions, same durations, so all three cuts (9:16, 1:1, 16:9) re-render as-is with smart cropping per aspect via scaled `object-cover` framing.

## Technical notes

- Clips generated with the Lovable AI Gateway video model, then committed under `remotion/public/video/*.mp4` and referenced with `staticFile()` in `<OffthreadVideo>`.
- Footage is muted; all cuts stay silent-safe with on-screen text.
- Scene files updated: `SayItScene.tsx`, `SnapItScene.tsx`, `ColorItScene.tsx`, `BooksScene.tsx`, `WelcomeScene.tsx`, `EndCardScene.tsx`, plus a new `FootageLayer.tsx` for the shared video-with-overlay treatment.
- Re-render all three compositions to `/mnt/documents/` as new MP4s.

## Note on likeness

The people in the clips are AI-generated, not real identifiable individuals, so the footage is safe to use in ads. If you'd rather use your own family photos/video, send them and I'll cut those in instead.
