# Add "Type it" as a page option

Right now each blank page offers Speak, Photo and Upload. Typing is only hidden inside the speak popup. This adds typing as its own first-class way to fill a page, like the original app.

## What changes

1. **Third mode on setup screen** — the "Say it or snap it?" step gains a "Type it" choice per page, plus a "Type it for every page" shortcut. Heading becomes "Say it, type it, or snap it?".
2. **Type it button under every page** — each blank/finished page gets a "Type it" button next to Speak / Photo / Upload, opening a small typing card: a text box ("e.g. a dragon eating pizza"), a "Draw it" button, and Cancel. No microphone, no language picker.
3. **Speak popup stays as-is** — mic plus editable transcript, so a spoken phrase can still be corrected before drawing.
4. **Redraw, exports, autosave, bookshelf unchanged** — a typed page produces the same text prompt the speak flow does, so everything downstream already works.

## Technical notes

- `PageMode` becomes `"say" | "type" | "snap"`; `blankPages` and the restore path accept the new value (session already stores `mode` loosely).
- New `typeFor` state mirrors `speakFor`, and confirming calls the existing `runForPage(id, { kind: "text", prompt }, prompt)` — no generation logic changes.
- Page card buttons wrap to a second row on narrow screens so four actions stay tappable on phones.
- Only `src/routes/index.tsx` is touched (plus the `PageMode` union in `src/lib/session.ts` if it is typed there).
