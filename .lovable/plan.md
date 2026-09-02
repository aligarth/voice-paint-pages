# Remove "My Pages" from the library screen

The home screen is done. Now the second screen — the library reached from **My Bookshelf**.

## What changes

- No more tab switcher. The screen is titled **My Bookshelf** and always shows your books.
- Page selection stays, but folded in: a **Choose pages** button opens your saved pages inline as a picker, so you can still pick pages and create a book (minimum one page).
- Empty state reads: "Say it, type it or snap it in the studio, then choose pages to build your first book."
- Deleting a page still says the page is removed from any books that use it, without naming "My Pages".
- Page titles/descriptions for the screen become bookshelf-focused.

## Technical notes

- `src/routes/books.tsx`: drop the `View` search param and `setView` toggle; render books only. Move the saved-page grid into a collapsible picker section controlled by local state, keeping existing selection + create-book logic and the one-page minimum. Update `head()` metadata, empty-state copy, and the delete-page confirmation text.
- `src/routes/index.tsx`: update the `My Bookshelf` link to `/books` without the `view` search param.
- `src/components/PhotoPrep.tsx`: "Make my pages" becomes "Make my book pages".
- `src/lib/savedBooks.ts` is unchanged — pages are still stored, just not browsable as their own screen.
