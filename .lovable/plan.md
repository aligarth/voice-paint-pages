# Remove the "My Pages" section from the home screen

## What will change

### `src/routes/index.tsx`
- Remove the saved-pages shelf (`bookshelf` JSX) that currently appears below the cover card, including its "My Pages" heading, saved-page grid, and delete buttons.
- Remove the `My Pages` link from the book-building header (the row that currently has `Choose pages`, `Start a new book`, `My Pages`, `My Bookshelf`).
- Keep the `My Bookshelf` link.
- Remove the unused `Library` icon import.
- Keep all book-building, coloring, export, and music-player logic unchanged.

### Out of scope
- The `/books` library page and its tabs are left for a separate decision.
- No changes to the data model or saved-page records.
