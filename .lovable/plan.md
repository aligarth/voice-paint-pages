# Simpler flow: a book cover, then blank pages you fill in

Reshape the home experience into a short guided setup, then a book of blank pages where each page is filled in on its own — spoken, snapped, or uploaded.

## The new flow

1. **Cover screen** — the app opens on a closed coloring book whose cover reads "Color My World" (with the slogan underneath). One button opens the book.
2. **How many pages?** — a simple picker (1-12, plus a couple of quick presets) for the length of the book.
3. **How do you want to fill each page?** — per page, choose Say it or Snap it. Options: apply one choice to every page, or set each page individually in a compact list.
4. **The book opens** — all pages appear as blank sheets in a swipeable/scrollable book. Each blank page has its own buttons underneath: Speak, Take photo, Upload from device.
5. **Fill a page** — using a page's button runs the existing flow (speech transcript confirmation, or photo prep with crop/brightness/border) and the generated line art lands on that page only.
6. **Color it** — tapping a filled page opens the existing coloring studio with all current tools, undo/redo, checkpoints, favorites, and exports.

## What stays

- My Bookshelf, Start a new book, and Regenerate page.
- All current coloring tools, autosave/resume, PDF/ZIP/PNG export, sharing links, music, language handling.
- One book per session: the book you set up is the book you're working in.

## What changes / goes away

- The "save as one book" combining flow is removed — no multi-book merge, no bulk selection mode on the bookshelf.
- The old multi-photo snap tray with batch generation and page-count-per-photo multiplication is replaced by per-page filling (photos are chosen for the page you're on).
- The home screen no longer leads with Say it / Snap it buttons; those live on each blank page.

## Technical notes

- `src/routes/index.tsx` gets a small step machine: `cover` → `pages` → `mode` → `book` → `studio`, replacing the current tray/review states.
- A book becomes a fixed-length array of page slots (`{ id, mode, lineArt|null, paint|null }`), stored through `src/lib/savedBooks.ts` and restored via `src/lib/session.ts` on reload.
- Generation reuses `src/routes/api/generate-image.ts` and `api/photo-to-lineart.ts` unchanged, called for a single target slot; `regeneratePage` re-points at that slot.
- `src/lib/savedBooks.ts` and `src/routes/books.tsx` drop the combine/merge code paths and selection mode.
- `ColoringCanvas`, `PhotoPrep`, `useSpeech`, export and share libs are untouched.
- Cover artwork generated as an image asset in `src/assets`.

Promo video work stays paused (the 16:9 render is not resumed in this pass).
