# Make "No thanks" actually dismiss the music card

Right now tapping **No thanks** records the choice but nothing on screen changes, so it looks broken.

## What will change

- Tapping **No thanks** hides the whole music card right away.
- In its place, a small quiet line with a **Play music** link, so you can bring it back if you change your mind.
- The choice is remembered on your device, so the card stays hidden next time you open the app until you ask for music again.

## Technical notes

- `src/lib/musicStore.ts`: persist `asked` (and `enabled`) to `localStorage` and hydrate on first read; add `resetMusicPrompt()` to clear the dismissal.
- `src/components/MusicPlayer.tsx`: when `music.asked && !music.enabled && !music.tracks.length`, render only the compact "Want music? Play music" line that calls `resetMusicPrompt()`; otherwise unchanged.
- No changes to playback, playlist, or streaming links.
