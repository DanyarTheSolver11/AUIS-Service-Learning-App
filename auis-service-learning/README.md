# AUIS Volunteering Hours Tracker

Replaces the manual SLP spreadsheet + Google Form + paper-signature
workflow described in Student Services' semester email with a web app.

## What it does

**Students** log in with their `@auis.edu.krd` Google account, add
volunteering entries (date, department, activity, hours, supervisor),
and see their live approved-hours total and award tier. A `/help` page
walks through the whole process for anyone unsure how it works.

**Supervisors** get an email with a one-click link — no login — to
confirm or reject the entry.

**Student Services (admin)** gets four views:
- **Registry** — summary stats + every student's approved hours/tier,
  with both a ceremony-only CSV export and a full audit-trail export
- **Entries** — every submission individually: search/filter, manual
  approve/reject override, edit or delete any entry regardless of
  status, resend a confirmation link, or log hours directly on a
  student's behalf (auto-approved, no supervisor email)
- **Semesters** — create/edit/activate the submission window each cycle
- **Message Students** — send a filtered group email (everyone, students
  who haven't started, students with pending entries, or students below
  the 10-hour minimum) without leaving the app

For non-technical day-to-day use, see **`STUDENT_SERVICES_GUIDE.md`**.

Award tiers (Regular/Bronze/Silver/Gold/Diamond) are calculated
automatically — see `src/lib/awards.ts` if the thresholds ever change.

## Stack

Next.js 14 (App Router) · TypeScript · PostgreSQL via Prisma · NextAuth
(Google, domain-restricted) · Resend (email) · Tailwind CSS · Vercel
(hosting + Cron).

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in Neon, Google OAuth, Resend,
   `NEXTAUTH_SECRET`, and `CRON_SECRET` — see comments in `.env.example`.
3. `npx prisma db push`
4. `npm run seed` (or just use the **Semesters** admin tab once running)
5. `npm run dev` → http://localhost:3000

## Deploying (Vercel)

1. Push to GitHub, import into Vercel (**Root Directory** = the project
   folder if nested in a larger repo).
2. Add all env vars from `.env`, with `NEXTAUTH_URL` and
   `NEXT_PUBLIC_APP_URL` set to the production URL.
3. Add the production callback URL in Google Cloud Console:
   `https://your-app.vercel.app/api/auth/callback/google`.
4. Deploy. `vercel.json` defines a daily Cron job
   (`/api/cron/remind-pending`) — Vercel picks this up automatically on
   deploy, no extra setup beyond having `CRON_SECRET` set as an env var
   (Vercel auto-sends it as the job's auth header when that exact
   variable name exists).

## ⚠️ Before supervisor emails will work for real students

Right now, `EMAIL_FROM` almost certainly still points at Resend's shared
`onboarding@resend.dev` sender. **That address can only deliver to the
Resend account owner's own inbox** — never to a real supervisor. The
admin Registry and Message Students pages will show a red banner as a
reminder until this is fixed.

**This isn't a code bug — it's a one-time setup step:**

1. Go to [resend.com/domains](https://resend.com/domains) → **Add Domain**.
2. Enter a domain you can prove ownership of via DNS. Two options:
   - **`auis.edu.krd`** (or better, a subdomain like
     `volunteering.auis.edu.krd`, which doesn't touch AUIS's main mail
     setup) — needs whoever controls AUIS's DNS (IT/registrar) to add a
     few records Resend gives you (SPF, DKIM).
   - **A domain you personally control**, if AUIS DNS access isn't
     available — same process, faster since you don't need anyone else.
3. Once Resend shows the domain as verified, update `EMAIL_FROM` in
   Vercel's environment variables to something like
   `AUIS Volunteering Hours Tracker <noreply@volunteering.auis.edu.krd>`.
4. Redeploy. From that point on, **every** `@auis.edu.krd` supervisor
   address works — no code changes, no per-recipient allowlisting, this
   fixes it permanently for everyone.

## Rolling over to a new semester

Handled entirely from the **Semesters** admin tab — no code or database
changes needed. See `STUDENT_SERVICES_GUIDE.md`.

## Architecture notes

- `Semester.isActive` — exactly one row is true at a time; every write
  path that sets it does so inside a transaction that flips the others
  off first.
- **Three separate ways an entry's status changes**, each a distinct
  code path: the public token-based `/api/approve/[token]` a supervisor
  uses; the authenticated admin override at `/api/admin/entries/[id]`;
  and manual admin-created entries, which skip the approval flow
  entirely and are created already `APPROVED`.
- `User.studentId` is optional at the schema level (Google OAuth doesn't
  provide it) — the dashboard prompts for it on first visit via
  `PATCH /api/profile`, since the ceremony export depends on it.
- **Broadcast emails** (`sendBroadcastEmail` in `src/lib/email.ts`) send
  individually per recipient in small parallel batches rather than BCC,
  so one student's address is never exposed to another.
- **The reminder cron** (`/api/cron/remind-pending`) only fires once a
  semester's deadline is within 14 days, and only re-reminds an entry
  every 4 days at minimum — tune both thresholds in that file if the
  cadence feels off.

## Things you may want to add next

- A **custom domain** for the app itself (e.g. `volunteering.auis.edu.krd`
  pointed at Vercel) instead of the default `.vercel.app` URL — purely
  cosmetic, doesn't affect functionality.
- **GPA-based awards** (Dean's/President's) aren't in this app — see the
  note in `STUDENT_SERVICES_GUIDE.md`.
- **Rate limiting** on the public `/approve/[token]` route isn't
  implemented — the 32-byte random token is the only protection, fine
  for this scale but worth knowing.
