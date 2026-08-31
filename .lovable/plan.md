# Undo an accidental book delete

Deleting a book in My Bookshelf becomes reversible: right after deleting, an **Undo delete** action appears so the book can be put back exactly as it was.

## Behavior

- Tapping **Delete book** first asks for confirmation ("Delete this book? You can undo right after."), matching the existing page-delete confirmation style.
- After deleting, the message line reads: "Deleted “{title}”." with an **Undo delete** button beside it.
- Tapping **Undo delete** restores the book with its original title, page order, and coloring, then confirms "Restored “{title}”."
- The undo offer stays available for 15 seconds, and also disappears if the user switches views, deletes something else, or creates a book.
- Only the most recent deleted book can be undone.
- Existing delete behavior for individual pages in My Pages is unchanged.

## Technical notes

`src/routes/books.tsx`
- Add state `undoBook: SavedBook | null` plus a confirmation state for book deletes (reuse the pattern of `deletingId`, with a separate `deletingBookId` so the dialog copy differs).
- On confirmed book delete, keep the full record in `undoBook` before calling `deleteBook(book.id)`.
- Undo calls the existing `saveBookRecord(undoBook)` (unchanged record, so id/title/pages/paints/kind are preserved) and updates `books` from its return value.
- Clear `undoBook` on a 15s timer (cleaned up on unmount), on `setView`, on another delete, and after `createBook`.
- Render the Undo button next to the existing `message` paragraph, using `btn-crayon` styling and a `RotateCcw` lucide icon.

No changes to storage schema, page data, coloring, or exports.
