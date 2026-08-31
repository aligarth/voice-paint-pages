# Rename to "My pages" and add a separate "My bookshelf"

Split the saved library in two: single pages you make one at a time, and the multi-page books you build by selecting pages.

## What you'll see

- **My pages** — everywhere that used to say "My bookshelf" or "My books" now says "My pages": the strip on the home/book screen, the buttons in the header, and the library page title.
- **My bookshelf** — a second section that only holds books you created with "Save as one book" from selected pages. Nothing auto-saves into it.
- On the library page, two tabs at the top: **My pages** and **My bookshelf**. Each shows its own list with the same rename / delete / export PDF / export ZIP / open & color actions you have today.
- The home screen strip shows recent **pages**, with a link into the library; a small "My bookshelf (N)" link appears next to it when you have combined books.
- Saving selected pages confirms: "Saved 'My coloring book' with 3 pages to your bookshelf." and the new book lands in My bookshelf only.
- Existing saved items are sorted automatically: anything with a single page counts as a page, anything with two or more counts as a bookshelf book.

## Technical notes

`src/lib/savedBooks.ts`
- Add `kind?: "page" | "book"` to `SavedBook`.
- Add `resolveKind(book)` helper: `book.kind ?? (book.pages.length > 1 ? "book" : "page")` so older records classify without a migration.
- `saveBook` / auto-save path writes `kind: "page"`; the combined save writes `kind: "book"`.

`src/routes/index.tsx`
- `saveSelectedAsBook()` sets `kind: "book"` on the record it creates; auto-save sets `kind: "page"`.
- Rename the strip heading to "My pages" and the three `/books` link labels to "My pages".
- Filter the strip to `resolveKind(b) === "page"`; add a secondary link to `/books?tab=bookshelf` showing the bookshelf count when > 0.

`src/routes/books.tsx`
- Page title becomes "My pages"; head meta title/description/og updated to match ("My Pages — Say & Color Library").
- Add `tab` state (`"pages" | "bookshelf"`), initialised from the `tab` search param, with two toggle buttons. Render `books.filter(b => resolveKind(b) === tab-matching)`.
- Empty states per tab: pages → "Say it, type it or snap it in the studio"; bookshelf → "Use Select pages in your book to save several pages as one book."
- Keep rename/delete/deletePage/export/open behaviour unchanged.

No changes to generation, coloring tools, or exports.
