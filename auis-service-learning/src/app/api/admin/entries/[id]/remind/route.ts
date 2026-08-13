import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const entry = await prisma.volunteerEntry.findUnique({
    where: { id: params.id },
    include: { student: { select: { name: true, email: true } } },
  });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (entry.status !== "PENDING") {
    return NextResponse.json({ error: "This entry has already been resolved." }, { status: 409 });
  }

  try {
    await sendReminderEmail({
      supervisorEmail: entry.supervisorEmail,
      supervisorName: entry.supervisorName,
      studentName: entry.student.name ?? entry.student.email,
      approvalToken: entry.approvalToken,
    });
  } catch (err) {
    console.error("Failed to send reminder:", err);
    Sentry.captureException(err);
    return NextResponse.json({ error: "Gmail API rejected the reminder email." }, { status: 502 });
  }

  await prisma.volunteerEntry.update({ where: { id: entry.id }, data: { reminderSentAt: new Date() } });
  return NextResponse.json({ success: true });
}
