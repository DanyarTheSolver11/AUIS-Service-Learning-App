import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "AUIS Volunteering Hours Tracker <noreply@auis-vht.vercel.app>";

function appUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}${path}`;
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
  const link = appUrl(`/approve/${opts.approvalToken}`);
  return resend.emails.send({
    from: FROM,
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
      <p><a href="${link}" style="display:inline-block;padding:10px 20px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:6px;">Review this entry</a></p>
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
  const link = appUrl(`/approve/${opts.approvalToken}`);
  return resend.emails.send({
    from: FROM,
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
  return resend.emails.send({
    from: FROM,
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

// Admin-authored message to many students at once (e.g. "deadline is in
// one week and you haven't logged anything yet"). Resend's batch API
// caps at 100 recipients per call, and BCC would leak everyone's address
// to everyone else, so we chunk into individual sends run in parallel
// batches instead. Returns which addresses failed so the admin UI can
// report a partial-success count rather than a false "all sent".
export async function sendBroadcastEmail(opts: {
  recipients: string[];
  subject: string;
  message: string; // plain text, line breaks preserved
}) {
  const html = `<div style="white-space:pre-wrap;font-family:sans-serif;font-size:14px;line-height:1.6;">${opts.message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</div><p style="margin-top:24px;color:#888;font-size:12px;">— AUIS Student Services, sent via the Volunteering Hours Tracker</p>`;

  const BATCH_SIZE = 20;
  const failed: string[] = [];

  for (let i = 0; i < opts.recipients.length; i += BATCH_SIZE) {
    const batch = opts.recipients.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((to) => resend.emails.send({ from: FROM, to, subject: opts.subject, html }))
    );
    results.forEach((r, idx) => {
      if (r.status === "rejected" || (r.status === "fulfilled" && r.value.error)) {
        failed.push(batch[idx]);
      }
    });
  }

  return { sent: opts.recipients.length - failed.length, failed };
}
