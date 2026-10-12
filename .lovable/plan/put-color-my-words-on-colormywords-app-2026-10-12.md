# Put Color My Words on colormywords.app

## What you'll end up with

Your app opens at **https://colormywords.app** — the same name your sign-up and password emails come from. The old `voice-paint-pages.lovable.app` address keeps working and automatically sends visitors to the new one, so nothing you've already shared breaks.

## What happens, step by step

1. **I show you the domain card.** It lists the exact DNS records your domain needs. Your domain's records live at GoDaddy (that's where it was registered), so this is where the changes get made — the card walks you through it, and you confirm before anything changes.
2. **You add the records at GoDaddy** (or the card does it for you if it can). Two things happen: the web address starts pointing at your app instead of the GoDaddy "coming soon" page that's there now, and a hidden proof record confirms the domain is yours.
3. **Your email setup stays untouched.** The sending address `notify.colormywords.app` was handed over separately, so changing the main web address does not affect the confirmation emails that are already working.
4. **I check it went through.** The domain moves through *verifying → setting up → active*, and a secure web address is issued automatically. This usually takes minutes; the provider allows up to 72 hours.
5. **I make it the main address.** Once it's active, I set `colormywords.app` as the primary domain so the old Lovable address redirects to it, and the app itself starts using the new name everywhere: the links inside sign-up and reset emails, the page previews that show when someone shares your link, and the website's own "this is my real address" tags (which search engines use).
6. **I re-publish and verify.** I open `https://colormywords.app` directly and confirm the app loads, the old address redirects, and a fresh sign-up email carries the new link.

## What I need from you

Nothing beyond the confirmation in the card and the GoDaddy step, if the card can't do it for you. If GoDaddy asks you to log in, that part has to be yours.

## A note on timing

The domain change itself is quick, but the reputation your emails are building still takes weeks of real sending. What this does fix immediately: email links currently point at a site that doesn't open, which spam filters dislike. After this, they open.

---

## Technical notes

**Current state (checked just now):**
- `domain_connect--connect_domain` routes `colormywords.app` to **byo_connect** — DNS records are added by you at your provider; the card supplies the exact values.
- Public DNS: nameservers `ns01.domaincontrol.com` / `ns02.domaincontrol.com` (GoDaddy). Root currently carries parking A records `13.248.243.5` and `76.223.105.230` — these must be replaced by Lovable's A record.
- `notify.colormywords.app` is a separate nameserver delegation (email) — unaffected by root A-record changes.
- Project is published; `colormywords.app` is not yet a custom domain on this project.

**Steps:**
1. Stage `domain_connect--show_domain_connect` for `colormywords.app`. Add both the root domain and `www` (www is not auto-added). Records come from the card — I don't supply them from memory.
2. Poll `domain_status--check_domain_status` until the domain reaches Active (or reports drifted/missing records, which the card then re-shows).
3. Set `colormywords.app` as **Primary** so `voice-paint-pages.lovable.app` redirects to it over HTTPS.
4. Code updates once the domain is live:
   - `src/routes/lovable/email/auth/webhook.ts:16` — `SITE_URL` → `https://colormywords.app`
   - `src/routes/lovable/email/auth/preview.ts:29` — sample project URL to match
   - `README.md:7` — live app link
   - Add `og:url` and a canonical link (canonical on leaf routes only, `https://colormywords.app` + path) in `head()` of each content route: `index.tsx`, `auth.tsx`, `books.tsx`, `plans.tsx`, `settings.tsx`, `reset-password.tsx`, `github.tsx`, `gallery.$id.tsx`. None exist today.
   - `roadmap.md` — mark the "put a website on colormywords.app" open item done
5. Re-publish, then verify by opening `https://colormywords.app` and a sign-up email link directly.

**Risks:** DNS propagation can take up to 72 hours; conflicting GoDaddy parking records must be removed, not just added alongside. Email deliverability is unchanged by this step.
