# Finish the book, then open it from the shelf

Two changes: a clear finish button once the last page has been drawn, and a bookshelf that greets you with a closed book you tap to see the pictures inside.

## 1. "Generate book" once the last page is drawn

- As soon as every page in the current book has a drawing, a wide **Generate book** button appears at the bottom of the book view. Colouring first is optional.
- Tapping it saves the whole book — its name and all its pages, with any colours already added — into My Bookshelf, then takes you straight to the bookshelf screen.
- No manual page-picking needed anymore for this path; the pages you just made are the pages of the book.
- If some pages have no drawing yet the button stays hidden, and a small line says how many pages still need a picture.

## 2. Bookshelf opens like a real book

- Landing on My Bookshelf shows each saved book as a closed book cover: the book's name on the spine/front, with your first page peeking through as the cover picture.
- Tapping a book opens it, revealing all its pictures in a grid.
- Tapping any picture inside opens that page in the coloring studio so you can colour it.
- Rename, Export PDF, Export ZIP, Save book and Delete stay available on the opened book.
- Closing the book returns to the shelf of closed books.

## Technical notes

- `src/routes/index.tsx`: add an `allPagesFilled` check; render a footer **Generate book** action in the `book` step and in the studio footer. It reuses the existing `saveBookRecord` write with `kind: "book"` (same payload shape as `saveSelectedAsBook`, all pages instead of `selectedPages`), then `navigate({ to: "/books", search: { view: "bookshelf" } })`.
- Guard against duplicates by keeping the generated book id in a ref, so tapping twice updates the same record.
- `src/routes/books.tsx`: in the `bookshelf` view, add local `openBookId` state. When null, render a closed-book card grid (cover art = `book.pages[0]`, with paint overlay); when set, render the existing page grid plus a "Close book" control. Each page thumbnail becomes a button calling the existing `openBook(book)` flow with a starting page index.
- `openBook` gets an optional start-page argument passed through to the studio session (`openPage` in `src/lib/session.ts`), so tapping a picture lands directly on it.
- My Pages view and the existing choose-pages/combine flow stay as they are.
