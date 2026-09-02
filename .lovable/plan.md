# Remove "My Pages" from Color My World

## Goal
Eliminate the separate "My Pages" concept so the app has one simple library: **My Bookshelf**. Generated pages are managed inside the studio/book flow and do not appear as their own browsable section.

## What will change

### Home screen (`src/routes/index.tsx`)
- Remove the "My Pages" saved-pages shelf that currently appears below the studio.
- Keep only the studio workflow and the link to **My Bookshelf**.
- Update any remaining "My Pages" labels in the page-delete confirmation dialog.

### Bookshelf page (`src/routes/books.tsx`)
- Remove the `view` search-param toggle (`pages` vs `bookshelf`).
- Rename the route title/description to "My Bookshelf — Color My World".
- Show only saved books (remove the saved-pages grid and the "Choose pages" selection UI).
- Update the empty-state text so it no longer references "My Pages".
- Keep rename, delete, undo-delete, and PDF export for books.

### Data model
- Keep `SavedBook` and individual saved-page records in `savedBooks.ts` unchanged so existing pages/books still load.
- Pages that are not yet in a book will no longer be visible in the UI; they can still be reached by reopening an existing book.

### Other references
- Update `PhotoPrep.tsx` label from "Make my pages" to "Make my book" or similar.
- Remove any remaining "My Pages" strings in user-facing copy.

## Out of scope
- No changes to the cover art, voice/snap generation, coloring canvas, music player, or PDF export logic.
- No changes to the underlying IndexedDB schema.
