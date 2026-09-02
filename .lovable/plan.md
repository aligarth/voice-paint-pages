# The named book saves itself to the bookshelf

All five things you listed are already built: books persist on the device, the bookshelf opens saved books and exports printable PDFs, typed prompts drive the drawing, the page-count screen creates exactly that many pages, and photo upload runs through the closed-outline pipeline.

The one real gap is the connection between them: the book you name at the start never becomes a book in the bookshelf on its own. Today each finished page is saved individually, and you only get a book if you tap into choose-pages mode and combine them by hand. That's what this plan fixes.

## What changes for you

- The title you give at the start becomes a real book in **My Bookshelf** as soon as your first page finishes drawing.
- Every page you finish after that is added to that same book automatically, in page order, with its title and any coloring.
- Coloring a page updates it inside the book — no re-saving.
- Renaming the book in the setup screen renames the bookshelf book.
- Deleting a page removes it from the book too; if it was the last page, the book goes away.
- Choosing pages and combining them into a separate book still works exactly as it does now, for when you want a different selection.

## Technical notes

`src/routes/index.tsx`
- Add a `sessionBookIdRef` (persisted in the session record so it survives a reload) holding one `kind: "book"` record id for the current book.
- In the existing auto-save effect, alongside the per-page `kind: "page"` records, upsert the session book via `saveBookRecord`: `pages`/`paints`/`pageTitles` rebuilt from `pages.filter(p => p.src)` in page order, `title` from `bookTitle`.
- Run the same upsert when `bookTitle` changes and when a page's `paint` changes, so the book stays in sync.
- In `confirmDeletePage`, rebuild the session book after the page is cleared; delete the record when no pages remain.
- `startOver` clears `sessionBookIdRef` so the next book gets a fresh record.

`src/lib/session.ts`
- Add an optional `bookId` field to `ColoringSession` so the session book is reused after a reload instead of duplicated.

No changes to the bookshelf page, PDF export, sealing, or the drawing endpoints.
