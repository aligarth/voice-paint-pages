# Turn the mode-picking screen into a page-titling screen

## What changes

- The screen after "How many pages?" currently shows bulk "Say it / Type it / Snap it" buttons and per-page mode toggles.
- Replace that with a simple page-titling screen:
  - A list of cards, one for each page.
  - Each card shows a title input (default: "Page 1", "Page 2", etc.) and an edit button to focus / clear the title.
  - A "Next" button that takes the user into the book creation / coloring flow.
- Remove the bulk mode buttons entirely.
- Keep each page's default mode as `say`; the user can switch to `type` or `snap` on the canvas page itself (already supported in the studio).
- Update the screen title and subtitle to match (e.g., "Name your pages" / "Give each page a title. You can change it later.").

## Files to edit

- `src/routes/index.tsx`: rework the `step === "modes"` section.
- Add a small inline `Edit` icon button next to each title input for the "edit" action.
- Persist page titles into the existing `PageDraft` objects so they travel with the book into the studio and can be saved with the book.
- Update `head()` metadata for the route if it references the old mode wording.

## Unknowns / decisions

- Page titles default to "Page N". If the user leaves a title blank, fall back to "Page N".
- Mode defaults to `say`; the studio already lets the user switch modes per page, so no mode picker is needed here.
