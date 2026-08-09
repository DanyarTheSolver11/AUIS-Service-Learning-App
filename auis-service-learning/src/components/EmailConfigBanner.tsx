// Resend's shared onboarding@resend.dev sender can only deliver to the
// Resend account owner's own email — never to real supervisors. This
// shows a persistent, hard-to-miss warning on the admin dashboard until
// a verified domain is configured, since the failure mode otherwise is
// silent (see /api/admin/entries route logs for "Resend rejected...").
export function EmailConfigBanner() {
  const from = process.env.EMAIL_FROM ?? "";
  const isTestDomain = from.includes("resend.dev") || from.trim() === "";

  if (!isTestDomain) return null;

  return (
    <div className="mb-6 rounded-sm border border-claret-500/40 bg-claret-500/[0.06] px-5 py-4">
      <p className="text-sm font-semibold text-claret-600">
        ⚠ Supervisor emails are not yet reaching real inboxes
      </p>
      <p className="mt-1 text-xs leading-relaxed text-claret-600/90">
        <code className="rounded bg-claret-500/10 px-1 py-0.5">EMAIL_FROM</code> is still set to
        Resend&rsquo;s shared test sender, which can only deliver to the account owner&rsquo;s own
        email — not to real supervisors at any @auis.edu.krd address. Verify a sending domain at{" "}
        <a href="https://resend.com/domains" target="_blank" rel="noreferrer" className="underline">
          resend.com/domains
        </a>{" "}
        and update <code className="rounded bg-claret-500/10 px-1 py-0.5">EMAIL_FROM</code> in
        Vercel&rsquo;s environment variables, then redeploy.
      </p>
    </div>
  );
}
