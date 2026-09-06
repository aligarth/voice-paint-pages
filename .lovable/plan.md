# Keep colored books saved on the shelf

Right now a book you create is saved with its pictures, but once you open a book from My Bookshelf and keep coloring, the new coloring is only kept in the "resume where you left off" spot — it is never written back into that book on the shelf. So the shelf book still shows the older coloring, and if you start a different book the newer coloring is gone.

## What will change

- When you open a book from My Bookshelf, the app remembers which book you're in.
- Every stroke, fill and undo you make is written back into that same book a moment later, automatically — no Save button needed.
- Close the app, close the tab, come back tomorrow: the book on the shelf opens with exactly the coloring you left, page for page.
- Deleting or adding a page while inside that book updates the same shelf book instead of creating a duplicate.
- Tapping "Generate book" on a book you already generated updates that book instead of adding a second copy of it.
- If storage ever runs out, you get a plain message telling you the coloring could not be saved, instead of silently losing it.

## Technical notes

- `ColoringSession` in `src/lib/session.ts` gains an optional `bookId`; `openBook` in `src/routes/books.tsx` writes `bookId: book.id` when it hands off to the studio.
- `src/routes/index.tsx` restores that id into a `shelfBookIdRef` (also set by `openSavedBook` and by `generateBook`, replacing the current `generatedBookRef`), and clears it in `startFresh`.
- A debounced effect (same ~600ms rhythm as the existing session auto-save) calls `saveBookRecord` with the current pages, paints and page titles under that id when `shelfBookIdRef` is set, keeping `kind: "book"` and the original `savedAt`.
- Page deletion inside a linked book updates the record through the same write path so the shelf copy stays in sync.
- Storage stays IndexedDB (`say-and-color`), which already holds full page and paint data URLs — no thumbnail-only truncation exists today, so nothing to change there. Write failures surface via the existing `setSaveMessage`.
