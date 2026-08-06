import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "AUIS Service Learning <noreply@auis-slp.vercel.app>";

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
  const result = await resend.emails.send({
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

  if (result.error) {
    console.error("Resend rejected the approval email:", JSON.stringify(result.error));
    throw new Error(`Resend error: ${result.error.message ?? JSON.stringify(result.error)}`);
  }
  return result;
}

export async function sendReminderEmail(opts: {
  supervisorEmail: string;
  supervisorName: string;
  studentName: string;
  approvalToken: string;
}) {
  const link = appUrl(`/approve/${opts.approvalToken}`);
  const result = await resend.emails.send({
    from: FROM,
    to: opts.supervisorEmail,
    subject: `Reminder: confirm ${opts.studentName}'s volunteer hours`,
    html: `
      <p>Dear ${opts.supervisorName || "Supervisor"},</p>
      <p>Just a friendly reminder — ${opts.studentName} is waiting on your confirmation of a volunteering entry before the AUIS Awards deadline.</p>
      <p><a href="${link}">Review the entry here</a></p>
    `,
  });

  if (result.error) {
    console.error("Resend rejected the reminder email:", JSON.stringify(result.error));
    throw new Error(`Resend error: ${result.error.message ?? JSON.stringify(result.error)}`);
  }
  return result;
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
  const result = await resend.emails.send({
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

  if (result.error) {
    console.error("Resend rejected the status update email:", JSON.stringify(result.error));
    throw new Error(`Resend error: ${result.error.message ?? JSON.stringify(result.error)}`);
  }
  return result;
}