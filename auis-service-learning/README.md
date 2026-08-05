# AUIS Service Learning Program (SLP) Tracker

Replaces the manual SLP spreadsheet + Google Form + paper-signature workflow
described in Student Services' semester email with a web app.

## What it does

- **Students** log in with their `@auis.edu.krd` Google account, add
  volunteering entries (date, department, activity, hours, supervisor),
  and see their live approved-hours total and award tier.
- **Supervisors** get an email with a one-click link — no login — to
  confirm or reject the entry.
- **Student Services (admin)** sees every student's approved hours and
  award tier in one table, and exports a ceremony-ready CSV.
- Award tiers (Regular/Bronze/Silver/Gold/Diamond) are calculated
  automatically from the thresholds in the current email — see
  `src/lib/awards.ts` if these ever change.
- A `Semester` record holds the date window and deadline, so the exact
  same app is reused every semester — just add a new semester row and
  flip `isActive`.

## Stack

Next.js 14 (App Router) · TypeScript · PostgreSQL via Prisma · NextAuth
(Google, domain-restricted) · Resend (email) · Tailwind CSS · deploy on
Vercel — same stack as the ticketing system, so you can reuse what you
already know about the Neon/Vercel/Google OAuth setup.

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in:
   - **Neon**: create a project at neon.tech, grab the pooled connection
     string for `DATABASE_URL` and the direct one for `DIRECT_URL`.
   - **Google OAuth**: Google Cloud Console → APIs & Services →
     Credentials → Create OAuth Client ID (Web application). Add
     `http://localhost:3000/api/auth/callback/google` as an authorized
     redirect URI (add the Vercel URL version later too).
   - **NEXTAUTH_SECRET**: run `openssl rand -base64 32`.
   - **ADMIN_EMAILS**: the Student Services manager's email + yours.
   - **RESEND_API_KEY**: sign up at resend.com, verify a sending domain
     (or use their test domain while developing).
3. `npx prisma db push` — creates the tables in Neon.
4. `npm run seed` — creates the Fall 2025 semester with the dates from
   the email (edit `prisma/seed.ts` first if these change).
5. `npm run dev` → http://localhost:3000

## Deploying (Vercel)

1. Push this repo to GitHub.
2. Import it in Vercel, add all the same env vars from `.env` (set
   `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your production URL).
3. Add the production callback URL to the Google OAuth client:
   `https://your-app.vercel.app/api/auth/callback/google`.
4. Deploy. Run `npx prisma db push` once against production (or wire it
   into a build step) before the first real users sign in.

## Rolling over to a new semester

1. In `prisma/seed.ts` (or directly via `npm run db:studio`), add a new
   `Semester` row with the new dates/deadline, and set the old one's
   `isActive` to `false`.
2. That's it — students immediately see the new semester's window and
   old entries stay archived under the previous semester.

## Notes / things you may want to add next

- **GPA-based awards** (Dean's/President's) aren't in this app — the
  email says no student action is needed for those, so they're likely a
  registrar-side list Student Services already has. If they want it
  tracked here too, it'd need an admin-side CSV import.
- **Reminder emails** to slow-to-respond supervisors: `sendReminderEmail`
  in `src/lib/email.ts` is ready to use — just needs a cron trigger
  (Vercel Cron hitting a route that finds `PENDING` entries older than
  N days) if you want it automatic.
- **Rate limiting / abuse prevention** on the public `/approve/[token]`
  route isn't implemented — the token itself (32 random bytes) is the
  main protection. Fine for this use case, but worth knowing.
