# Add cursive welcome words to the boy's afro on the book cover

## What changes
- On the start-screen book cover, the boy's afro gets the words **"All Races, All Ages, All Languages Welcome!"** in flowing cursive. The letters are a light color so they show up on the dark hair, and they follow the curve of the afro.
- Everything else on the cover stays the same: the boy's smile, dimple and camera, the planets, the red rocket, the "Color My Words" title, and the green sleeve.
- The phone app icon is not changed.

## Steps
1. Edit the existing cover picture to add the cursive words inside the afro. The rest of the picture is kept as it is.
2. Check the result up close: every word is spelled right, easy to read, and fully inside the hair, and the face and title are untouched. If anything is wrong, fix it and check again.
3. Swap the new cover onto the start screen and check it there.

## Technical details
- Use `imagegen--edit_image` on `src/assets/book-cover.jpg` and save the result to a new file, `src/assets/book-cover-welcome.jpg`. Keep the original until the new one is approved.
- Update the `coverArt` import in `src/routes/index.tsx`.
- The shelf book covers use page pictures, not this cover, so nothing else needs to change.
