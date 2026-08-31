# Pages first, then build books from selected pages

The app generates and saves individual coloring pages. A book is created only when the user deliberately selects pages and saves that selection together.

## Correct experience

1. **Generate pages** — Say it, Type it, Snap it, or Upload creates individual coloring pages. Each finished result auto-saves to **My Pages**, whether it has been colored or not.
2. **Choose pages** — users can enter selection mode either from the current page-making session or from **My Pages**, and select at least one generated page. The page currently open in the coloring canvas is included in the choose-pages list and can be selected too, with its in-progress coloring captured as it stands.
3. **Build one book** — the user names the selection and taps **Create book**. The selected pages are copied into one ordered, multi-page book without deleting the originals from My Pages.
4. **My Bookshelf** — contains only the multi-page books users deliberately created from selected pages. No generated page appears here automatically.
5. Opening a bookshelf book restores every selected page in order, including its saved coloring; uncolored pages reopen as clean line art ready to color.

## Navigation and wording

- Rename the current home strip heading **My Pages** and every current **My books** button to **My Pages**.
- Add a separate **My Bookshelf** button beside My Pages.
- The library route provides two clear views:
  - **My Pages**: all individually generated pages, with selection controls to create a book.
  - **My Bookshelf**: only books assembled from selected pages.
- In the current session, keep **Select pages**, but rename **Save as one book** to **Create book**.

## Selection behavior

- Selection is available in both the current session and My Pages.
- Generated-but-uncolored pages are selectable; completely blank placeholders are not.
- Require at least one page to create a book.
- Preserve the order in which pages are selected. Provide **Select all**, **Clear**, a book-title field, and **Create book**.
- Creating a book copies each page's line art and optional paint layer. It does not remove or convert the original page records.
- After creation, confirm the title and page count and provide a direct way to open My Bookshelf.

## Technical notes

`src/lib/savedBooks.ts`
- Add a persisted record discriminator, `kind: "page" | "book"`, and a compatibility helper for older records: records with multiple pages are books; single-page records are pages unless explicitly marked otherwise.
- Ensure individual auto-saves are written with `kind: "page"` and user-created collections with `kind: "book"`.
- Keep the existing page/paint index alignment so uncolored pages continue to use `null` paint layers.

`src/routes/index.tsx`
- Filter the home strip to page records and label it **My Pages**.
- Add separate **My Pages** and **My Bookshelf** navigation actions.
- Keep current-session page selection, require two selections, write the result as `kind: "book"`, and use the wording **Create book**.

`src/routes/books.tsx`
- Add **My Pages** and **My Bookshelf** views, addressable through the route search parameter.
- In My Pages, add selection mode across saved page records with ordered selection, Select all, Clear, title, and Create book controls. A single selected page is enough to create a book.
- In My Bookshelf, show only `kind: "book"` records and retain open/color, rename, page removal, delete, and export actions.
- Keep page-level rename, delete, open/color, and export actions in My Pages, without presenting individual pages as books.
- Update headings, empty states, and route metadata to use the page/book distinction consistently.

No changes to image generation, coloring tools, prompts, or export rendering.
