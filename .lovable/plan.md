# Basic Fill Mode for Paint Bucket

## What we'll change
Add a "Basic fill" mode to the Paint Bucket tool so tapping an area fills that contiguous region even if it touches the edge of the page. Keep the existing closed-shape guard available as an option.

## Why
The current bucket only fills fully enclosed shapes. The user wants a simpler Microsoft-Paint-style fill that colors whatever area is tapped, regardless of closure.

## Implementation
1. **Add a fill mode toggle** in `src/components/ColoringCanvas.tsx`:
   - New state: `fillMode: "closed" | "basic"` defaulting to `"closed"`.
   - Two compact buttons or a segmented control in the tool panel, shown only when the Bucket tool is selected.
   - Labels: "Closed shape" (current behavior) and "Fill area" (new behavior).

2. **Update region preview**:
   - In basic mode, always tint the hovered region with the current color, never the red "not closed" warning.
   - In closed mode, keep the existing red edge-touch warning.

3. **Update `floodFill`**:
   - If `fillMode === "basic"`, skip the `touchesEdge` abort and fill the region normally.
   - If `fillMode === "closed"`, keep the existing guard and message.

4. **Clear caches when mode changes**:
   - Include `fillMode` in the `useEffect` that resets `wallCache` and preview so switching modes updates the overlay immediately.

## Verification
- Typecheck passes (`tsgo`).
- Production build passes (`bun run build`).
- Manual check: selecting "Fill area" and tapping an open background region fills it; switching back to "Closed shape" restores the edge-touch guard.
