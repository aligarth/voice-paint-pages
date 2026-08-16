# Promo Video Pack for Say & Color

Goal: a set of short promo videos for Facebook, Instagram (Reels/feed/Stories), TikTok, YouTube, and the app store / website hero — all built in code so they can be re-rendered and tweaked any time.

## What gets produced

Three cuts of one campaign, all sharing the same look, music-free (silent-safe with on-screen text so they work with sound off):

| Cut | Size | Length | Where it runs |
| --- | --- | --- | --- |
| Vertical | 1080x1920 (9:16) | ~20s | Reels, Stories, TikTok, Shorts |
| Square | 1080x1080 (1:1) | ~20s | Facebook + Instagram feed ads |
| Horizontal | 1920x1080 (16:9) | ~25s | YouTube, website hero, app store preview |

Each renders to an MP4 you can download.

## The story (same beat sheet in all three cuts)

1. **Hook** — big type: "Say it. We draw it." over a blank coloring page that a crayon line starts sketching across.
2. **Say it** — a spoken phrase appears as live captions ("a dragon eating pizza"), mic pulsing.
3. **We draw it** — line art draws itself on, stroke by stroke.
4. **You color it** — brush and crayon strokes flood the drawing with color; the palette fans out showing every color.
5. **Snap it too** — a photo drops in and turns into line art, proving the camera flow.
6. **Your books** — a few finished pages stack into a library shelf.
7. **End card** — logo/wordmark, the slogan "Say it or snap it. We draw it. You color it." and a clean call-to-action line.

## Look and feel

- Palette pulled from the app itself: warm paper background, the app's red/pink primary and amber accent, charcoal line art. No neon, no purple gradients.
- Playful family energy: bouncy spring entrances, crayon-textured strokes, hand-drawn arrows and doodle accents.
- One display font for headlines plus one clean body font for captions.
- Every drawing and coloring moment is animated line-by-line so it reads as real drawing, not a slideshow.

## Ad-safe framing

All text and key visuals stay inside the center 80% so Reels/Stories UI and feed crops never cut a word. The vertical cut leaves the top and bottom clear for platform chrome.

## Technical notes

- Built with Remotion (React + code-driven motion graphics) in a new `remotion/` folder in the project, so the video source is version-controlled and re-renderable.
- One shared scene library, three compositions (`promo-vertical`, `promo-square`, `promo-horizontal`) that reuse the scenes at different layouts and pacing.
- Line-art "self drawing" done with SVG path `strokeDashoffset` animation; coloring done with animated clip-path reveals over flat color shapes.
- Any illustration assets needed (the dragon page, the sample photo) are generated as image assets in the project.
- Rendered headless via a render script; final MP4s land in the documents folder for download. Videos are silent by design — you can add a licensed music track in your ad platform.

## Out of scope for this pass

No voiceover audio, no real screen recording of the live app (the UI is recreated in motion graphics), and no ad account setup or campaign publishing. Those can each be a follow-up.
