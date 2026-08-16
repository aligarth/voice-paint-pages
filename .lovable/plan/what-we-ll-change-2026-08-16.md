Remove the "Color my day" wake-word feature

## What we'll change
- Strip the wake-word detection logic and state from `src/lib/useSpeech.ts` so the microphone only activates when the user taps the mic button (tap-and-talk).
- Remove the wake-word toggle button and explanatory text from the home screen in `src/routes/index.tsx`.
- Remove the `\bcolor my day\b` cleanup step from `parseRequest` in `src/lib/useSpeech.ts` since the phrase will no longer be part of the flow.

## Files affected
- `src/lib/useSpeech.ts` — remove `WAKE_PHRASE`, `wakeEnabled`, `wakeActive`, `wakeEndIndexRef`, `toggleWake`, the wake-phrase branch in `onresult`, the wake-restart behavior in `onend`, and the wake-related `useEffect`.
- `src/routes/index.tsx` — remove destructured `wakeEnabled`, `wakeActive`, `toggleWake`; simplify mic active-state logic; remove the wake toggle button and its helper text.

## Outcome
The app no longer listens for "Color my day". Voice input works only through the explicit "Say it" / mic button, keeping the existing tap-and-talk behavior intact.
