# Improve email deliverability (avoid junk folder)

## Why emails landed in junk
- Sending setup is healthy: `notify.colormywords.app` is verified, both test sends show as delivered successfully.
- Cause: brand-new sending subdomain with no reputation history; iCloud files first-time unknown senders into junk.
- Primary fix is user-side: mark the message "Not Junk" and add the sender to contacts; reputation builds over the coming weeks.

## Plan (small app-side improvements that help filters trust the mail)

1. **More specific, branded subject lines** in `src/routes/lovable/email/auth/webhook.ts`
   - "Confirm your email" → "Confirm your email — Color My Words"
   - "Reset your password" → "Reset your password — Color My Words"
   - Same pattern for invite, magic link, email change, reauthentication subjects.
   - Branded, specific subjects reduce junk classification and are clearer in the inbox.

2. **Junk-folder hint on the sign-up screen** in `src/routes/auth.tsx`
   - After submitting a sign-up (and password reset), show a short hint: "No email? Check your junk folder and tap 'Not Junk' so future emails reach your inbox."
   - No change to the sign-up flow itself.

## Not doing
- No DNS changes — records are verified and correct.
- No third-party email services — Lovable manages SPF/DKIM/DMARC in the delegated zone.
