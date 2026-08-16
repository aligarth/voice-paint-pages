# Idea Library: browse things to draw

Add a browsable "Idea library" on the home screen so you don't have to think of a prompt. Tap any idea and it drops straight into the "I heard" confirm card, ready to draw (you can still edit the text and page count before generating).

## Categories and examples

- Animals: bunny, kitten, puppy, dinosaur, elephant, dolphin, unicorn
- Vehicles: fire truck, rocket ship, race car, pirate ship, tractor
- Fantasy: dragon, fairy, castle, wizard, mermaid
- Nature: sunflower field, rainforest tree, ocean waves, mountains
- Holidays: Christmas tree, pumpkin, Easter eggs, birthday party
- Everyday: ice cream cone, backpack, school bus, tea party
- Cartoon characters (originals): mischievous cartoon boy on a skateboard, clever cartoon rabbit chewing a carrot, goofy cartoon duck sailor, superhero kid with a cape

Each idea is a short prompt phrase that already asks for bold, closed outlines so the fill tool works well on the result.

## Note on named characters

Bart Simpson, Bugs Bunny and similar are copyrighted characters, so the app should not generate them by name. The "Cartoon characters" row gives the same vibe with original, style-inspired descriptions instead. If you'd rather it just try the exact names anyway, say so and I'll wire the ideas as free text.

## How it works

- New "Pick an idea" section on the home screen, above/below the Say it / Snap it buttons, with a category chip row and a scrollable grid of idea buttons.
- Tapping an idea sets the transcript and the "heard" confirm state, so the existing flow (page count 1-8, "Yes, draw it", Edit & Redraw) works unchanged.
- Also add a "Surprise me" button that picks a random idea.

## Technical details

- New `src/lib/ideaLibrary.ts` exporting typed categories: `{ id, label, ideas: string[] }[]`, plus a `randomIdea()` helper.
- New `src/components/IdeaLibrary.tsx`: category chips + idea grid, one `onPick(prompt: string)` callback. Styling uses existing design tokens and the current card/chip look.
- `src/routes/index.tsx`: render `<IdeaLibrary onPick={(p) => { setTranscript(p); setHeard(p); }} />`; no changes to generation, saving, or export logic.
