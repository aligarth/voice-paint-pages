# Test the printed book from start to finish

Signed in as your account (alimagarsa@icloud.com), in the preview, in test mode. No real money moves.

## Steps

1. **Make a book.** On the start screen, create a 2-page book with typed page names (for example "A rocket ship" and "A friendly robot"), wait for both drawings, then save it to My Bookshelf. This uses your free page for the month. If the limit stops the second page, I'll make a 1-page book instead.
2. **Tap "Get printed book — $24.99"** on that book and confirm the card form opens with the test-mode notice.
3. **Pay with the test card** 4242 4242 4242 4242, any future date, any 3-digit code, and any ZIP code.
4. **Watch the return.** The screen should say "Payment received — confirming it…", then "Making your printed book… (1 of 5)" through 5, then "Your printed book is ready."
5. **Check the shelf.** Open the book and confirm it now has the original pages plus 5 pages named "Bonus page 1–5". Your Settings page count should not have dropped because of them.
6. **Download the printed book.** Then I'll check the file page by page: cover, title page, numbered pages, an even page count, and the back cover.
7. **Check the purchase is remembered.** Tap the button again. It should go straight to the download with no second charge and no extra bonus pages. The customer dashboard should show 1 printed book sold.

## If something breaks

The most likely weak spot is the payment notice reaching the preview (this happened with the plans earlier). If the screen keeps saying "confirming", I'll look at the payment notice logs, fix the cause, and run the test again. I'll report exactly what I saw at each step, with screenshots.

## What it leaves behind

- One test book with 5 bonus pages on your shelf.
- One test purchase in the records.
- Your free page for this month used up.

I'll leave all of it in place unless you'd like it cleaned up afterward.

---

## Technical notes

- Session minted with `lovable auth-session --json` and restored into Playwright at 1280×1800. The book is created through the real UI so the image generation and sealing run as they do for users. If generation is too slow for the browser script, I'll fall back to saving a book through the app's own save call with a real generated page.
- Stripe Embedded Checkout runs inside an iframe: fill it through `page.frame_locator`. Return URL is `/books?view=bookshelf&printed=<bookId>`.
- Check the results in the database: a `book_purchases` row with `bonus_added = true` and `status = 'ready'`; `books.page_count` = original + 5; `usage.pages` unchanged by the bonus pages.
- If no row appears, check the webhook route on the preview deployment (it previously returned 404 there) through server logs, and confirm `checkout.session.completed` is part of the events Stripe sends to that endpoint.
- PDF QA: capture the download, convert it with `pdftoppm`, and inspect every page.
