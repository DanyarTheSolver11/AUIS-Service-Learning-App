# Launch Checklist — AUIS Volunteering Hours Tracker

Work through these in order. Nothing here is optional except where marked.

## 1. Fix the supervisor-email blocker (do this first — everything else depends on it)

Right now, confirmation emails can only reach your own inbox, not real
supervisors. See the **"⚠️ Before supervisor emails will work"** section
in `README.md` for the full walkthrough. In short:

- [ ] Enable the **Gmail API** on your existing Google Cloud project.
- [ ] Add `https://developers.google.com/oauthplayground` as an
      authorized redirect URI on your existing OAuth Client.
- [ ] Use [Google's OAuth Playground](https://developers.google.com/oauthplayground)
      with your own Client ID/Secret to authorize the `gmail.send` scope,
      signed in as the account that should send these emails (your own
      `@auis.edu.krd` works) — copy the **Refresh token** it gives you.
- [ ] In Vercel, set `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`,
      `GMAIL_REFRESH_TOKEN`, and `EMAIL_FROM` (must match the account you
      authorized exactly), redeploy.
- [ ] Test: submit one real entry with a **friend's** real
      `@auis.edu.krd` email as supervisor (not your own), confirm they
      receive it.

**Do not proceed past this step until confirmation emails reach a real
`@auis.edu.krd` address that isn't your own.** Everything below assumes
this works.

## 2. Wipe test data

Your database currently has test entries and test students from
development. Before real students see this:

- [ ] Neon dashboard → Tables → `VolunteerEntry` → delete all test rows
      (or delete and let it recreate empty via `npx prisma db push`,
      whichever is easier for you).
- [ ] Same for any test `User` rows that aren't real admins.
- [ ] Leave the `Semester` table — you'll fix its dates in the next step
      rather than deleting it.

## 3. Set the real semester window

- [ ] Go to **Semesters** in the app.
- [ ] Either edit the existing semester's dates, or create a new one, to
      match the actual upcoming cycle's dates (start, end, submission
      deadline) — whatever Student Services has decided for this round.
- [ ] Confirm it's marked **Active**.

## 4. Add the real admin

- [ ] In Vercel's env vars, set `ADMIN_EMAILS` to include the Student
      Services manager's real `@auis.edu.krd` email (comma-separated with
      yours if you're keeping access too).
- [ ] Redeploy.
- [ ] Have her sign in once to confirm she lands on the Registry page,
      not the student dashboard.

## 5. Final QA pass

Click through this as if you were three different people:

- [ ] **As a student**: sign in, add an entry, confirm the Student ID
      prompt appears if missing, confirm it saves.
- [ ] **As a supervisor**: open the confirmation email (real inbox, not
      yours), click confirm, confirm the student's dashboard updates.
- [ ] **As admin**: check Registry stats update, check the new entry
      shows in Entries, try editing an entry, try the "log on behalf of"
      manual entry, try Message Students with a test message to yourself.
- [ ] Check the app on a phone-sized browser window — nothing should look
      cut off or broken.
- [ ] Confirm `/help` reads clearly to someone who's never seen the app.

## 6. (Optional, but recommended) Turn on error monitoring

- [ ] Sign up free at [sentry.io](https://sentry.io) → Create Project → Next.js.
- [ ] Add `NEXT_PUBLIC_SENTRY_DSN` in Vercel, redeploy.
- [ ] Trigger a harmless test error somehow (e.g. temporarily break
      something small, or just wait for the first real one) and confirm
      it shows up in Sentry's dashboard within a minute or two.
- [ ] From now on, check Sentry occasionally instead of manually digging
      through Vercel logs when something seems off.

## 7. (Optional) Custom domain

`your-app.vercel.app` works fine, but if you want it to feel more
official: Vercel project → Settings → Domains → add something like
`volunteering.auis.edu.krd` (needs the same DNS access as step 1). Purely
cosmetic — skip this if it's not worth the extra DNS coordination right
now.

## 8. Walk the manager through it

Before announcing to the whole community, sit with the Student Services
manager (in person or a call) and walk through `STUDENT_SERVICES_GUIDE.md`
together — specifically:
- [ ] How to review/approve/reject entries
- [ ] How to export the ceremony list
- [ ] How to message students
- [ ] What to do if a supervisor never responds

Get her explicit sign-off that it's ready before the community sees it.

## 9. Announce it

Once steps 1–7 are done, send the announcement. A draft is below — adapt
freely, but the structure (what changed, what stays the same, a direct
link, a deadline reminder) works well for this kind of switch.

### Draft announcement email

> **Subject: New: Log your volunteering hours online — no more printed
> forms**
>
> Dear AUIS students,
>
> Starting this semester, logging your volunteering hours for the AUIS
> Awards Ceremony is fully online — no more printing the SLP sheet,
> chasing signatures, or scanning anything.
>
> **What's new:**
> Go to **[your app URL]** and sign in with your AUIS Google account.
> Add each volunteering activity as you go — date, department, what you
> did, hours, and your supervisor's name and email. Your supervisor gets
> an email with a single link to confirm it; no account needed on their
> end. Once confirmed, it counts toward your total immediately, and you
> can see your running hours and award tier at any time.
>
> **What stays the same:**
> The award tiers and hour requirements are unchanged — see
> **[your app URL]/help** for the full breakdown and a step-by-step walk
> through of how it works.
>
> **Deadline:** [insert this cycle's real deadline]. Submissions close
> automatically after this date, so don't wait until the last day —
> especially since your supervisor needs time to confirm.
>
> Questions? Reach out to Student Services directly.
>
> Best regards,
> Student Services

Consider sending this through the usual channels (mass email, and maybe
a follow-up post closer to the deadline) — the **Message Students**
admin feature can also send a reminder directly through the app to
anyone who still hasn't started, once you've got some data to work with.

## 10. After launch

- [ ] Check back after a few days — Registry's stats and Entries tab
      will tell you if things are moving (students submitting,
      supervisors confirming) or stalling somewhere.
- [ ] The automatic reminder cron only kicks in inside the last 14 days
      before the deadline — don't be surprised if pending entries sit
      quietly before then, that's expected.
