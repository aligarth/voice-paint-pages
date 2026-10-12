# How people find Color My Words, and how they put it on a computer

## The short answer

Right now, nobody finds it. There is no app to download — it only runs in a browser at `voice-paint-pages.lovable.app`, and nothing makes it installable on a computer. Search engines have not picked it up either: a Google search for the site returns nothing.

The good news is that "use it on a computer" is already true — I opened the live site at a computer-sized screen and "Start my book" works with no errors. What's missing is (a) a web address people would trust and remember, (b) an app-style icon people can click from their desktop, and (c) a way to actually pay, which today's visitors can't do.

## What I checked (2026-10-12)

- **Traffic:** 1 visit in the last 30 days (Sep 13 – Oct 12), 10 pageviews, all "Direct", mobile, US. That is almost certainly your own test, not a stranger.
- **Live plans screen:** all three plans say "Coming soon", and the printed book is priced at "$24.99" in one line and "$1" in another. The checkout I built is in the code but not on the live site yet.
- **No install support:** the app has no install file at all, so Chrome never offers "Install app". People can only bookmark it.
- **No privacy, about or contact page anywhere in the app.**
- **Shared book links** show a generic auto-screenshot, not your book cover, and the page a friend lands on has no "make your own book" invitation — so sharing dead-ends.
- **Search demand is real** (Semrush, US): "ai coloring page generator" 2,400 searches/month, "coloring book online" 3,600, "personalized coloring book" 880 at low difficulty, "make your own coloring book" 590.
- **Competitors give more away** (all checked 2026-10-12): ColorPage.ai gives 10 free credits and lets you make a page without signing up, plus iPhone and Android apps; MyColoring.ai gives 4 free credits with no sign-up; ColoringBook.ai gives 4 a month from $6.99. Your free tier is 1 page, and it says "No saving, printing or sharing" — so a first-timer cannot try the actual promise.
- **Your three promo videos still say "Color My World"**, use the old motto, and end with "Download now" — a promise the app can't keep. They were made before the rename.
- **Your name is already taken:** theparentingway.com runs a free tool called "Color My Words".

## Who this is for (and what they worry about)

1. **Parents of young kids** — want something specific and age-right, but will not upload family photos: "I would NEVER upload photos of anyone in my family" (r/Autism_Parenting, quoted in the research, page not opened). Competitors answer with a plain "your photos stay private" line.
2. **Teachers and homeschool families** — "generic coloring pages online are either too easy for older kids or too advanced" (r/teachingresources, quoted in the research, page not opened). They need pages at the right level, free to try, and a school-Chromebook answer nobody in this market has published.
3. **Adult coloring hobbyists** — distrust printed AI art, calling it "AI slop" (r/Coloring, quoted in the research, page not opened). They care about line quality and paper.

## The plan, in the order that brings people soonest

1. **Put the app on colormywords.app.** You already own it and your emails already come from it. A real address is what makes a link worth clicking, is what gets remembered and searched, and is what every directory listing will ask for. The current address is a giveaway that this is a demo.
2. **Fix the way people buy and the way people reach you.** Make the live plans screen show working "Upgrade" buttons instead of "Coming soon", settle the printed book at one price, and add a short privacy page that says plainly what happens to a child's photo or voice recording. Until these work, ads and outreach waste your money and your first impressions — and a kids' photo product with no privacy page is the wrong thing to show parents.
3. **Give people an icon on their computer.** Add the install file and icons so Chrome offers "Install app" — this is the honest answer to "download it", and it's also the only route that later leads to Microsoft Store or Google Play listings.
4. **Re-make the promo videos** with the current name, current motto and the real web address, replacing "Download now" with "Make your book". Posting them as they are would send people to a product that contradicts the ad.
5. **List where people already look for this.** Product Hunt (free), There's An AI For That ($49 one-time, checked 2026-10-12), and Pinterest with the vertical video plus a few sample pages. Start with people you know for the first handful of users — competitors win by giving free tries, so a generous first page costs you little and proves the idea.
6. **Then search.** Add a sitemap, give the site its own share picture (the book cover, sized for links), and build a few pages aimed at the searches above. This is slower than steps 1–5 but it is the only channel that compounds.

**Already done:** the app is live and works on a computer-sized screen; the sign-up and password-reset emails are branded and reaching mailboxes.
**Not possible yet:** an app-store listing (needs step 3 first); paid ads are on hold until step 2 works, because visitors currently cannot pay.

## Technical notes

- **Domain:** connect colormywords.app in Project Settings → Domains as primary, then point the app's email links and canonical addresses at it. Your DNS host already works — the email records went in cleanly.
- **Install support:** add `public/manifest.webmanifest` with name, short name, start_url, `display: "standalone"`, theme colour, and 192/512 px icons derived from the book cover, plus matching head tags and a "Add to Home Screen / Install on your computer" help line in the app. No offline mode — that needs a service worker and is a separate decision.
- **Offer fixes:** publish the checkout work, correct the printed-book copy to a single price, and change the free tier so at least one page can be printed — the current "No saving, printing or sharing" line blocks the product's core promise.
- **Privacy page:** a real route with plain answers on photo and voice retention; the app records voice and accepts photos, so this also touches children's privacy rules.
- **Shared links:** set the app's own share picture to a 1200×630 copy of the cover, and add a "make your own book" call to action on the shared-book page.
- **Videos:** the video project's code already carries the correct name and motto, so this is a re-render, not a rewrite — its libraries need installing first.
- After approval I'll also save this plan to `marketing/plan.md` in your Files with each action's status, and note in project memory that the research exists.

## What I could not check

Reddit, Facebook, TikTok and Instagram pages can't be opened from here, so every community above is a lead with unconfirmed rules, not a place I've verified you may post in. Whether these apps work offline or on managed school Chromebooks is unknown — I searched and found nothing. Your location is unverified, so nothing local was checked. Whether your iCloud inbox now accepts the emails after the junk-folder tips is still yours to confirm.
