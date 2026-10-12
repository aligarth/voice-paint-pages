# Add the promo video to the website

## What we're building
A "Watch how it works" play button on the landing (cover) screen. Tapping it opens the promo video full-screen and plays it with sound. The landing page itself stays clean — no video loads until someone taps.

- **Placement:** on the cover screen, with the other action buttons (next to My Bookshelf / GitHub / Plans), styled like the existing crayon buttons with a play icon.
- **Playback:** tap to play, sound on. The player shows standard controls (play/pause, scrub, full-screen) and a close button.
- **Source:** Ahmed's own promo video file, attached in chat. Hosted on the app's CDN — nothing bundled into the repo.

## Steps

1. **Receive the video file** (waits on Ahmed — attach it in chat). Accepted formats: MP4, MOV, WebM, up to 20 MB per message. If it's a MOV, convert to MP4 (H.264/AAC) for phone and desktop compatibility.
2. **Upload to CDN:** run the asset CLI on the file, save the returned `.asset.json` pointer under `src/assets/`, and reference the CDN URL in code. If the file is over ~20 MB, compress it with ffmpeg first (1080p target) and confirm the video still looks good.
3. **Poster frame:** extract a still frame from the video with ffmpeg so the player shows the video's opening image instead of a black box before play.
4. **Add the player component** (`src/components/PromoVideo.tsx`):
   - A "Watch how it works" button on the cover screen of `src/routes/index.tsx`.
   - Opens a full-screen overlay with the `<video>` element: `controls`, sound on, starts paused with the poster frame; play/pause button; Escape and backdrop tap close it; video stops when closed.
   - Matches the app's look (same button styles, rounded corners, sleeve-green accents) — no hardcoded colors.
5. **Verify:** Playwright — button appears on the cover, tapping opens the player, the video element loads from the CDN URL (HTTP 200), Escape closes it, and mobile-width (390px) layout looks right. Check the build log is clean.

## Publish
This is a live-site-visible change. After verification I'll ask whether to publish to colormywords.app so visitors see it.

## Notes
- The old Remotion promo scenes in `remotion/` stay untouched — this uses Ahmed's own video.
- The video file itself can't be previewed by me (video content), but I can check its duration, size and first frame technically.
