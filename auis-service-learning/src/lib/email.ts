// Sends email through the Gmail API - Google's own HTTPS API, not SMTP.
//
// This is the reliable way to send mail from Vercel: SMTP connections
// (nodemailer + smtp.gmail.com) are documented by Vercel itself as
// unreliable on serverless functions - a function can be frozen or torn
// down mid-handshake before the send completes, causing silent,
// intermittent failures. The Gmail API sidesteps that entirely by being
// a plain HTTPS request, same as any other API this app calls.
//
// Setup uses OAuth2: a one-time authorization of a specific Google
// account (e.g. your own @auis.edu.krd address) grants this app
// permission to send mail *as that account* indefinitely, via a
// refresh token - no ongoing login, no third-party email service, no
// DNS. See README.md for the exact Google Cloud Console steps.
//
// Quota: Gmail accounts can send up to 500 recipients/day; Google
// Workspace accounts (which @auis.edu.krd almost certainly is) get
// 2,000/day - comfortably more than this app's volume.

const FROM_RAW = process.env.EMAIL_FROM ?? "AUIS Volunteering Hours Tracker <noreply@example.com>";

function base64url(input: string): string {
  return Buffer.from(input, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Refresh tokens don't expire on their own use, but the short-lived
// access token they exchange for does (~1 hour) - so every send fetches
// a fresh one. This is a normal, expected extra round-trip for OAuth2,
// not a sign of anything wrong.
async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID ?? "",
      client_secret: process.env.GMAIL_CLIENT_SECRET ?? "",
      refresh_token: process.env.GMAIL_REFRESH_TOKEN ?? "",
      grant_type: "refresh_token",
    }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.access_token) {
    throw new Error(`Failed to refresh Gmail access token: ${JSON.stringify(json ?? `HTTP ${res.status}`)}`);
  }
  return json.access_token as string;
}

function buildRawMessage(opts: { to: string; subject: string; html: string }): string {
  // Subject is base64-encoded (RFC 2047) so it's safe even if it ever
  // contains non-ASCII characters (Kurdish/Arabic names, etc).
  const encodedSubject = `=?UTF-8?B?${Buffer.from(opts.subject, "utf-8").toString("base64")}?=`;
  const message = [
    `From: ${FROM_RAW}`,
    `To: ${opts.to}`,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    opts.html,
  ].join("\r\n");
  return base64url(message);
}

async function sendEmail(opts: { to: string; subject: string; html: string }) {
  const accessToken = await getAccessToken();
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: buildRawMessage(opts) }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(`Gmail API rejected the email: ${JSON.stringify(body ?? `HTTP ${res.status}`)}`);
  }
  return res.json();
}

export async function sendApprovalRequestEmail(opts: {
  supervisorEmail: string;
  supervisorName: string;
  studentName: string;
  department: string;
  action: string;
  hours: number;
  date: string;
  approvalToken: string;
}) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const link = `${base}/approve/${opts.approvalToken}`;
  return sendEmail({
    to: opts.supervisorEmail,
    subject: `Please confirm ${opts.studentName}'s volunteer hours`,
    html: `
      <p>Dear ${opts.supervisorName || "Supervisor"},</p>
      <p>${opts.studentName} has logged the following volunteering entry with AUIS Student Services and listed you as their supervisor:</p>
      <ul>
        <li><b>Date:</b> ${opts.date}</li>
        <li><b>Department:</b> ${opts.department}</li>
        <li><b>Activity:</b> ${opts.action}</li>
        <li><b>Hours:</b> ${opts.hours}</li>
      </ul>
      <p>Please confirm whether this is accurate by clicking below. No account or login is required.</p>
      <p><a href="${link}" style="display:inline-block;padding:10px 20px;background:#002855;color:#fff;text-decoration:none;border-radius:6px;">Review this entry</a></p>
      <p style="color:#666;font-size:12px;">If the button doesn't work, copy this link: ${link}</p>
      <p>Thank you,<br/>AUIS Student Services</p>
    `,
  });
}

export async function sendReminderEmail(opts: {
  supervisorEmail: string;
  supervisorName: string;
  studentName: string;
  approvalToken: string;
}) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const link = `${base}/approve/${opts.approvalToken}`;
  return sendEmail({
    to: opts.supervisorEmail,
    subject: `Reminder: confirm ${opts.studentName}'s volunteer hours`,
    html: `
      <p>Dear ${opts.supervisorName || "Supervisor"},</p>
      <p>Just a friendly reminder — ${opts.studentName} is waiting on your confirmation of a volunteering entry before the AUIS Awards deadline.</p>
      <p><a href="${link}">Review the entry here</a></p>
    `,
  });
}

export async function sendStatusUpdateEmail(opts: {
  studentEmail: string;
  studentName: string;
  status: "APPROVED" | "REJECTED";
  department: string;
  hours: number;
  reason?: string | null;
}) {
  const approved = opts.status === "APPROVED";
  return sendEmail({
    to: opts.studentEmail,
    subject: approved
      ? `Your ${opts.department} entry was approved`
      : `Your ${opts.department} entry needs attention`,
    html: approved
      ? `<p>Hi ${opts.studentName},</p><p>Your supervisor confirmed your entry for <b>${opts.department}</b> (${opts.hours} hrs). It now counts toward your total.</p>`
      : `<p>Hi ${opts.studentName},</p><p>Your supervisor did not confirm your entry for <b>${opts.department}</b>.</p>${
          opts.reason ? `<p>Reason given: ${opts.reason}</p>` : ""
        }<p>Please edit the entry and resubmit, or contact your supervisor.</p>`,
  });
}

// Admin-authored message to many students at once. Sent individually per
// recipient (not BCC, which would leak every address to every student),
// in small sequential batches with a short pause between them - partly
// to be a good citizen of Gmail's sending limits, partly because
// refreshing an access token per batch rather than per email keeps this
// reasonably fast without hammering Google's token endpoint.
export async function sendBroadcastEmail(opts: {
  recipients: string[];
  subject: string;
  message: string; // plain text, line breaks preserved
}) {
  const html = `<div style="white-space:pre-wrap;font-family:sans-serif;font-size:14px;line-height:1.6;">${opts.message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</div><p style="margin-top:24px;color:#888;font-size:12px;">— AUIS Student Services, sent via the Volunteering Hours Tracker</p>`;

  const BATCH_SIZE = 10;
  const failed: string[] = [];

  for (let i = 0; i < opts.recipients.length; i += BATCH_SIZE) {
    const batch = opts.recipients.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((to) => sendEmail({ to, subject: opts.subject, html }))
    );
    results.forEach((r, idx) => {
      if (r.status === "rejected") failed.push(batch[idx]);
    });
    if (i + BATCH_SIZE < opts.recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return { sent: opts.recipients.length - failed.length, failed };
}
