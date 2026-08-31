# Select pages and save them as one book

Add a way to pick pages in the open book and save the selection to My Bookshelf as a single book.

## What you'll see

- In the open book view, a new **Select pages** button appears once at least one page has a drawing.
- In select mode, every drawn page gets a tap-to-check circle in its corner; tapping the page toggles it instead of opening the coloring studio. Only still-blank (not yet drawn) pages can't be selected.
- Pages you haven't colored at all are just as saveable as colored ones — the line art is stored either way.
- A sticky bar at the bottom shows "3 pages selected", with **Select all**, **Clear**, a name field (prefilled with the book title), and **Save as one book**.
- Saving writes one book with the selected pages, in page order, keeping whatever coloring exists and leaving uncolored pages clean, then confirms: "Saved 'My coloring book' with 3 pages to your bookshelf." Select mode closes.
- The bookshelf strip on the home screen and My Bookshelf both show the new book right away; opening it reopens all its pages — colored and uncolored — so you can pick up coloring later.
- Each page still auto-saves as its own little book as it finishes — the combined book is an addition, not a replacement.

## Technical notes

`src/routes/index.tsx`
- New state: `selecting: boolean`, `selectedPages: number[]`, `combineTitle: string`.
- Page card click handler: when `selecting`, toggle id (only for pages with `src`); otherwise keep the existing `setOpenPage` behaviour. Add a checkbox indicator overlay and `aria-pressed` for accessibility.
- `saveSelectedAsBook()`: builds `pages`/`paints` arrays from `pages` filtered by `selectedPages` (ordered by page id), calls `saveBookRecord({ id: makeBookId(), title, savedAt: Date.now(), pages, paints })`, refreshes `savedBooks` via `listBooks()`, sets `saveMessage`, and exits select mode. Surfaces the `MAX_BOOKS` error message if storage is full.
- Selectability keys off `page.src` only (never `page.paint`), and `paints` entries are `page.paint ?? null` so uncolored pages round-trip as a null paint layer. `books.tsx` `openBook` and `openSavedBook` already map `paints?.[i] ?? null`, so resuming an uncolored saved page opens a clean canvas over the line art.
- Reset `selecting`/`selectedPages` in `startFresh` and `openSavedBook`.

No changes to `src/lib/savedBooks.ts` (`saveBookRecord` + `makeBookId` already cover this), no changes to generation, coloring tools, or exports.
