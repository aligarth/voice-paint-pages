# Save book button in My Bookshelf

Add a **Save book** button beside **Delete book** on every book in My Bookshelf that saves the whole book to the device.

## Behavior

- Appears only in the **My Bookshelf** view, in each book's action row, directly to the left of **Delete book**.
- Tapping it saves the entire book — line art plus any coloring — as a single PDF download named after the book title.
- While saving, the button shows a spinner and "Saving…" and is disabled so it can't be double-tapped.
- On success: "Saved “{title}” to your device." On failure, a plain error message appears in the same spot as other messages.
- Existing **Export PDF** / **Export ZIP** buttons stay as they are; this is the simple one-tap save.

## Technical notes

`src/routes/books.tsx`
- Reuse the existing `exportPagesToPdf` flow and `exportingId` state with a distinct key (e.g. `${book.id}-save`) so the spinner is scoped to this button.
- Render the button only when `view === "bookshelf"` (i.e. `!isPages`), immediately before the delete button in the same action `div`.
- Use the existing `btn-crayon` styling, a `Save`/`Download` lucide icon, and the existing `setMessage` feedback pattern.

No changes to storage, page data, coloring, or the My Pages view.
