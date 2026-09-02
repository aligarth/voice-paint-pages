# Ask to add each drawn page to your named book

Right now every finished page is auto-saved on its own, and pages only become a book if you go into "Choose pages" and tap Create book. This change asks you page by page, and keeps one single book in My Bookshelf.

## What you'll see

1. A page finishes drawing.
2. A small prompt appears on that page card: **Add this page to "My coloring book"?** with **Add to book** and **Not now**.
3. Tapping **Add to book** puts the page into the one book named on the page-count/naming screen. The prompt is replaced by an **Added to your book** badge (with an **Undo** for a few seconds).
4. Tapping **Not now** dismisses the prompt; the page stays available and can still be added later with an **Add to book** button on the card.
5. My Bookshelf shows **one book** with your title, containing every page you added, in page order — not one entry per page.
6. Redrawing a page that's already in the book replaces that page inside the book instead of adding a duplicate.

The existing "Choose pages" / Create book flow stays available for building extra books from a subset of pages.

## Technical notes

`src/lib/savedBooks.ts`
- Add `upsertPageInBook(bookId, title, page)` that reads the record, replaces the entry matching a stable page key or appends it, and re-sorts entries by page order; and `removePageFromBook(bookId, pageKey)` for Undo. Records are written with `kind: "book"`.
- Add an optional `pageKeys?: (string | null)[]` field to `SavedBook` (aligned by index, like `paints`/`pageTitles`) so a session page slot maps to its entry in the book across redraws.

`src/lib/session.ts`
- Persist the current session's book id (`bookId`) and the set of page slots already added (`addedPages: number[]`), so the prompt state and the target book survive a refresh.

`src/routes/index.tsx`
- Replace the "every freshly drawn page becomes its own little book" auto-save effect: finished pages no longer create standalone `kind: "page"` records automatically. Instead they enter a `pendingAdd` set.
- New state: `sessionBookId` (created lazily on the first add), `addedPages: Set<number>`, `dismissedPrompt: Set<number>`, `undoAdd: { pageId } | null`.
- Page card renders the ask prompt when the page is `done` and not added/dismissed; renders an "Added" badge (plus Undo) when added; renders a plain "Add to book" button when dismissed.
- Adding calls `upsertPageInBook` with the current `bookTitle`, then refreshes `savedBooks` via `listBooks()`.
- When the user's coloring changes an already-added page, re-upsert that page's paint layer on the existing debounce so the book keeps current coloring.
- `startFresh` resets `sessionBookId`, `addedPages`, `dismissedPrompt`.
- Renaming the book title while pages are added updates the book record's title.

`src/routes/books.tsx`
- No structural change needed; the session book already appears in My Bookshelf as a `kind: "book"` record. Existing rename / remove page / delete / undo delete / export actions apply to it.

No changes to generation, coloring tools, or export rendering.
