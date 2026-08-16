# One book per picture, with an option to combine

Every finished page becomes its own little book automatically, and My Books gets a way to merge several books into one big book (with an undo).

## What changes for you

- **Auto-save, one page = one book.** Each snapped photo and each spoken request saves itself to My Books as soon as its page finishes drawing, titled from what you said (or "Photo page 1", etc. for snaps). No need to tap "Save book".
- **No more 5-book cap.** The library grows as you make pages; a much larger cap (100) keeps storage sane, and when it's full the app tells you to delete some.
- **Combine books.** In My Books, a "Select" mode adds a checkbox to each book. Pick two or more, tap "Combine into one book", give the new book a name, and their pages merge in the order you selected. The originals are removed.
- **Undo combine.** Right after combining, a bar appears: "Combined 4 books · Undo". Tapping it puts the original books back and removes the merged one. It stays available until you leave the page.
- The existing "Save book" button in the studio becomes "Save as one book" — it still bundles the current session's pages into a single book if you want them grouped that way.

## Technical notes

`src/lib/savedBooks.ts`
- Raise `MAX_BOOKS` to 100 and keep the friendly over-limit error.
- Add `saveBookRecord(book: SavedBook)` and `restoreBooks(books: SavedBook[])` (raw put helpers, used for combine/undo).
- Add `combineBooks(ids: string[], title: string)` returning `{ books, undo: { created: SavedBook, removed: SavedBook[] } }`: concatenates `pages` and `paints` (padding paints with nulls so indexes stay aligned), writes the new book, deletes the sources.
- Add `undoCombine(payload)`: deletes the merged book and re-puts the removed originals.

`src/routes/index.tsx`
- New helper `autoSavePage(page)`: when a page transitions to `done` with a `src` and no error, save it as a one-page book. Title = subject for text pages, `${bookTitle} — photo N` for photo pages. Track saved page ids in a ref so a re-render or regenerate doesn't duplicate; on regenerate, replace that page's auto-saved book instead of adding another.
- Call it from the completion points of `generate` and `generateFromPhotos` (and `regeneratePage`), then refresh `savedBooks`.
- Drop the `{savedBooks.length}/{MAX_BOOKS}` counter pressure in the header label; relabel the manual button "Save as one book".

`src/routes/books.tsx`
- Add `selecting` / `selected: string[]` state, a "Select books" toggle, per-card checkbox, and a sticky action bar showing "Combine N books" plus a title input (prefilled "My big coloring book").
- After combining, store the undo payload in state and render "Combined N books · Undo"; clear it when the user navigates away or performs another action.
- Keep rename/delete/export behavior unchanged, and disable selection controls while an export is running.

No changes to generation prompts, the coloring tools, or export flattening.
