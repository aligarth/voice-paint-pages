# Start a new book button in My Bookshelf

Add a clear "Start a new book" action inside the My Bookshelf view that sends the user back to the main screen to begin a fresh book.

## What will change

- In `src/routes/books.tsx`, when the active view is **My Bookshelf**, show a new button labeled **Start a new book** in the header action row, next to the My Pages / My Bookshelf tabs.
- The button uses TanStack `Link to="/"` so it behaves like a normal link (cmd/ctrl-click, preload, accessible).
- It uses the existing `btn-crayon` class and the primary green button style already in use for the main action buttons.
- The existing **Back to studio** link at the top of the page stays as-is; this new button is specifically for the bookshelf context.
- The empty-state message inside My Bookshelf (shown when no books exist) keeps its current text but its call-to-action is updated to the same **Start a new book** link, so the wording is consistent whether the shelf is empty or not.

## Out of scope

- No changes to the studio flow, book saving, or page generation.
- No changes to My Pages view.

## Technical notes

- File: `src/routes/books.tsx`.
- Add the button inside the `!isPages` branch of the header button row, after the My Bookshelf tab.
- Use `import { Link } from "@tanstack/react-router"` (already imported) and an icon such as `BookOpen` or `Plus` from `lucide-react`.
- Route `/` already exists as the main screen.
