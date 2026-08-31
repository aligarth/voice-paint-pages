# Delete the page you're working on

Right now there's no way to delete a page from the book you're building. Delete only appears on saved records (the My Pages cards and the My Pages / My Bookshelf library), so the picture currently open in the coloring view can't be removed.

## What changes

A **Delete page** action appears in two places inside the current book:

- On each page card in the book grid (next to Speak / Type / Photo), whenever that card has a drawing.
- In the coloring view header, for the page you have open.

Tapping it asks to confirm: "Delete this page? It will be removed from My Pages and from any book that used it."

On confirm:

- The slot resets to a **blank page** — your book keeps the same number of pages, and the slot goes back to offering Speak / Type it / Photo so you can fill it again.
- The auto-saved copy of that page is deleted from **My Pages**, and the page is pulled out of any **My Bookshelf** book that used it. A book left with no pages is deleted.
- If you were in the coloring view, you go back to the book grid.
- A short confirmation message shows: "Page deleted."

Blank slots show no Delete button (nothing to delete). A page still being drawn keeps its existing Cancel button instead.

## Technical notes

`src/routes/index.tsx`
- New state `deletePageId: number | null` driving a confirmation overlay styled like the existing removal confirmations.
- `confirmDeletePage()`: resets the page in `pages` to a blank slot (keep `id` and `mode`, clear `src`, `paint`, `title`, `prompt`, `done`, `error`), clears it from selection state and `lastOpened`, closes `openPage` if it was open, then deletes the saved record and refreshes `savedBooks`.
- Match the saved record by the page's image source among `savedBooks.filter(isSavedPage)` (same data-URL matching the existing cascade uses), then call `deletePageAndCascade(record.id)`.
- Session autosave already persists `pages`, so the blank slot survives reload.

`src/lib/savedBooks.ts`
- No change: `deletePageAndCascade` already deletes the standalone page, strips it from books, and drops emptied books.
