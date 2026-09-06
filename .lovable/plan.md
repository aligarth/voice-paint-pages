# Share a finished book with a friend

Add a **Share** button to every book on the shelf, so a friend can see the book exactly as you colored it — every page with its colors already on it.

## What you'll be able to do

- Tap **Share** on a book in My Bookshelf.
- A small card opens with two choices:
  - **Send book** — opens your phone's normal share sheet (Messages, Mail, WhatsApp, AirDrop) with the colored book attached as a printable file. On a computer, where there is no share sheet, it simply downloads the file so you can attach it yourself.
  - **Copy link** — puts the book online and gives you a link. Anyone you send it to opens it in a browser and flips through all the pages, already colored. No app or account needed for them.
- While a link is being made you see "Preparing your link…", then the link with a **Copy** button and a note that anyone with the link can view it.
- If you make a link for the same book again, the same link is refreshed rather than piling up new ones.
- Every page is flattened first (your coloring baked into the picture), so nothing shows up blank or uncolored.

## Notes

- The shared link is view-only: friends can look and print, they can't change your book.
- Nothing is uploaded unless you choose **Copy link**.

## Technical plan

**Sharing the file (no backend)**
- New `src/lib/shareBook.ts`:
  - `buildBookPdfFile(title, sources)` — reuses `flattenPage` + the existing jsPDF builder from `src/lib/exportPdf.ts` (refactor `exportPagesToPdf` to expose a `buildPagesPdfBlob` returning a `Blob`; `exportPagesToPdf` keeps calling `doc.save`).
  - `shareBookFile(title, sources)` — wraps the Blob in a `File`, checks `navigator.canShare?.({ files: [file] })`, calls `navigator.share`; falls back to a download via object URL. Swallows `AbortError` (user cancelled).

**Sharing a link (Lovable Cloud)**
- Migration: public storage bucket `shared-books` (public SELECT) and table `public.shared_books` (`id uuid pk`, `title text`, `pages jsonb` = array of `{url, title}`, `created_at`, `owner_id uuid null`), with GRANTs (`SELECT` to `anon, authenticated`, `ALL` to `service_role`) and RLS: anon/authenticated `SELECT` allowed; writes only through a server function using the admin client.
- `src/lib/share.functions.ts` — `publishSharedBook` server fn (`inputValidator` with zod: `id`, `title`, `pages: string[]` of JPEG data URLs, max 40). Handler lazily imports `@/integrations/supabase/client.server`, decodes each data URL, uploads to `shared-books/<id>/<n>.jpg` with `upsert: true`, upserts the `shared_books` row, returns `{ id }`. Unauthenticated on purpose (the app has no required sign-in); size-capped.
- Client flattens pages to JPEGs (`flattenPage` → `toDataURL('image/jpeg', 0.85)`), generates/reuses a share id stored on the book record (`shareId` on `SavedBook` in `src/lib/savedBooks.ts`), calls the server fn, then builds `${window.location.origin}/shared/${id}`.
- New route `src/routes/shared.$id.tsx` — loader reads the row through the publishable client, renders a read-only page list with titles plus a Print button; own `head()` with title/description and `og:image` set to the first page's absolute storage URL. Not found → friendly "This shared book is no longer available".

**Bookshelf UI (`src/routes/books.tsx`)**
- Add a `Share2` action button next to `Save book` for shelf books (`!isPages`), reusing the existing `exportingId` busy pattern (`${book.id}-share`).
- Local state `sharePanelId`, `shareLink`, `shareBusy`, `shareError` render the small share card under the book header; errors surface in plain language.
