# Delete page button

Add a delete action to each page card in My Pages. Deletion requires confirmation and cascades to remove that page from any books in My Bookshelf.

## What will change

### User flow
1. In My Pages, every page card shows a small delete button (trash icon).
2. Tapping it opens a confirmation dialog: "Delete this page? It will also be removed from any books that use it."
3. Confirming deletes the standalone page record.
4. The system scans every book in My Bookshelf; if a book contains the deleted page, that page is removed from the book.
5. If removing the page leaves a book with zero pages, the empty book is also deleted.
6. My Pages and My Bookshelf refresh to reflect the changes.

### Files to edit
- `src/lib/savedBooks.ts`
  - Add `deleteBookRecord(id)` helper if not already present.
  - Add `removePageFromBooks(pageId)` helper that iterates books, filters out the matching page (and its aligned paint entry), updates or deletes the book record, and returns counts for feedback.
- `src/routes/books.tsx`
  - Add a delete button to each page card in the `pages` view.
  - Wire the button to a confirmation dialog.
  - On confirm: call the delete helper, then call the cascade helper, then refresh the record list.
  - Show a brief success message after deletion.

### Edge cases
- A page that is not used in any book deletes only the standalone record.
- A page used in multiple books is removed from all of them.
- Empty books created by the cascade are removed automatically.
- Deletion is blocked from the UI while the operation is in progress.

## Verification
- Create a few pages, then a book containing some of them.
- Delete a page that is only in My Pages: it disappears from My Pages, the book remains unchanged.
- Delete a page that is inside a book: it disappears from My Pages and from the book; if the book's last page is deleted, the book disappears from My Bookshelf.
