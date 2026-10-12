# Put the "Watch how it works" video section live on colormywords.app

## What happens

1. **Safety check first.** Run a fresh security scan and wait for it to finish. The last scan
   predates the newest changes, so it needs refreshing before the site goes out again. If anything
   serious shows up, I'll tell you before publishing rather than pushing it live.
2. **Publish.** Send the current build to https://colormywords.app.
3. **Confirm it's really there** by opening the live address itself, not just the preview:
   - the "Watch how it works" heading and the video appear at the top of the start page;
   - the video file and its opening picture both load from the live site;
   - nothing else on the page broke — the cover, the motto, the buttons and the other pages
     (bookshelf, plans, settings, sign-in) still open.
4. **Confirm the sound is there.** Two checks I can do myself, plus one that needs your ears:
   - The video file itself carries a real stereo sound track (already checked: 46 seconds long,
     picture and sound in one file), and the site delivers it in a way iPhones can play and skip
     about in.
   - The player on the page is not muted and has no hidden setting that would silence it — it
     starts quiet only because browsers require a tap first, and the sound comes on the moment
     someone presses play.
   - **Yours to confirm:** press play on the live site and listen. My test browser can't actually
     play this video, so I can prove the sound exists and isn't switched off, but I can't hear it.

## What you'll see

The start page opens with the video section at the top, playing right on the page with its own
sound and fullscreen controls. The cover, the motto and everything else sit just below it.

## Notes

- Publishing takes a few minutes, so the change may not appear the instant it's requested.
- Payments stay in test mode; nothing about charging changes with this publish.
- The web address stays colormywords.app.

## Technical

- Fresh `security--run_security_scan`, read the result, then `preview_ui--publish`.
- Verification via Playwright against https://colormywords.app: assert the section heading and
  `<video>` element exist in the served page, the video and poster URLs return 200, and the page
  raises no errors. Route checks on /books, /plans, /settings, /auth for 200.
- Sound evidence: `ffprobe` on the live video URL reports an AAC stereo audio stream (48 kHz)
  alongside the h264 picture, duration 46.0s; a byte-range request returns 206; the player markup
  carries `controls` and `playsInline` with no `muted`, `autoPlay` or `loop`.
- Roadmap entry for the video section moves from open to done.
