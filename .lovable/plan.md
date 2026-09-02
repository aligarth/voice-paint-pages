# Remove "My Pages" from Color My World

## Goal
Drop the separate "My Pages" section so the app has one library screen: **My Bookshelf**. Saved pages still exist behind the scenes — they just show up as a page picker when you build a book, not as their own browsable tab.

## What the screens will look like

### Home screen (`src/routes/index.tsx`)
- Already shows only **Start my book** and **My Bookshelf** — unchanged.
- Remove the "My Pages" saved-pages shelf that appears below the studio, plus the two small `My Pages` / `My Bookshelf` links in its heading.
- Reword the page-delete confirmation so it no longer says "removed from My Pages".

### Library screen (`src/routes/books.tsx`)
- Remove the `My Pages` / `My Bookshelf` tab pair and the `view` search param. The route always shows books.
- Title becomes just **My Bookshelf**.
- Keep a **Choose pages** button. Pressing it reveals your saved pages inline as a selectable grid with a title field and a **Create book** action (still requires at least one page). Pressing **Done choosing** hides it again.
- Empty state: "No books yet — say it, type it or snap it in the studio, then choose pages to build your first book." with a single button that opens the page picker.
- Rename, delete, undo-delete, save/export PDF, and reopen-to-color all stay exactly as they are.
- Route metadata retitled to "My Bookshelf — Color My World".

### Other copy
- `PhotoPrep.tsx`: "Make my pages" becomes "Make my book pages".
- No remaining user-facing "My Pages" strings.

## Technical notes
- No changes to `savedBooks.ts`, the IndexedDB schema, or existing saved records — page records stay stored, only their standalone browsing view goes away.
- The selection state (`selecting`, `selectedIds`, `bookTitle`) already exists in `books.tsx`; it moves from the pages tab into the bookshelf screen instead of being deleted.
- `Link to="/books"` calls drop their `search={{ view: ... }}` argument.

## Out of scope
- Cover art, voice/snap generation, the coloring canvas, music player, and PDF export logic are untouched.
