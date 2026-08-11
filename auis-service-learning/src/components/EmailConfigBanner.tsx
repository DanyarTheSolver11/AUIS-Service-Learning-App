// Warns the admin on-screen when Gmail API sending isn't configured yet
// - any of the three required credentials missing, or EMAIL_FROM still
// looks like a placeholder. The underlying failure mode otherwise is
// silent (only visible in server logs), so this catches it before an
// admin wonders why no supervisor has confirmed anything.
export function EmailConfigBanner() {
  const hasCreds = !!(
    process.env.GMAIL_CLIENT_ID &&
    process.env.GMAIL_CLIENT_SECRET &&
    process.env.GMAIL_REFRESH_TOKEN
  );
  const from = process.env.EMAIL_FROM ?? "";
  const looksUnconfigured = from.includes("your-account") || from.includes("example.com") || from.trim() === "";

  if (hasCreds && !looksUnconfigured) return null;

  return (
    <div className="mb-6 rounded-sm border border-claret-500/40 bg-claret-500/[0.06] px-5 py-4">
      <p className="text-sm font-semibold text-claret-600">
        ⚠ Supervisor emails are not yet reaching real inboxes
      </p>
      <p className="mt-1 text-xs leading-relaxed text-claret-600/90">
        {!hasCreds && (
          <>
            <code className="rounded bg-claret-500/10 px-1 py-0.5">GMAIL_CLIENT_ID</code>,{" "}
            <code className="rounded bg-claret-500/10 px-1 py-0.5">GMAIL_CLIENT_SECRET</code>, or{" "}
            <code className="rounded bg-claret-500/10 px-1 py-0.5">GMAIL_REFRESH_TOKEN</code> isn&rsquo;t
            set yet.{" "}
          </>
        )}
        See the Gmail API setup steps in <code className="rounded bg-claret-500/10 px-1 py-0.5">README.md</code>{" "}
        — a one-time Google Cloud Console authorization, no third-party email service needed.
      </p>
    </div>
  );
}
