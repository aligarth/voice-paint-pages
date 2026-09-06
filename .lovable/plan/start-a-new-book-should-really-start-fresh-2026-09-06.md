# Start a new book should really start fresh

## What's happening

The **Start a new book** button does send you to the main screen, but the main screen always
reopens the book you were last working on. So it looks like nothing happened — you land back
inside your coloring book instead of at the front cover.

## What will change

- Tapping **Start a new book** (both in the bookshelf header and in the empty-shelf message)
  takes you to the main screen and shows the front cover, ready to begin a new book.
- Your last book is not lost: it stays saved in My Bookshelf, and the "pick up where you left
  off" behaviour still works when you simply open the main screen normally.
- After starting fresh, the page-count and page-naming screens appear as they do the first time.

## Technical notes

- `src/routes/books.tsx`: both "Start a new book" links become `<Link to="/" search={{ new: 1 }}>`
  (the "Go make one" empty-state link on My Pages keeps its current behaviour).
- `src/routes/index.tsx`: add a `validateSearch` on the route for an optional `new` flag. In the
  restore effect, when the flag is set, skip session restore, call `clearSession()`, mark
  `restored` true, stay on `step: "cover"`, and strip the flag with
  `navigate({ to: "/", search: {}, replace: true })` so a later reload doesn't wipe new progress.
- Nothing else in the studio, saving, or bookshelf logic changes.
