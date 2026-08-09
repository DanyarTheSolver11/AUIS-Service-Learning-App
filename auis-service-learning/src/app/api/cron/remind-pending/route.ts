import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";

// Triggered daily by Vercel Cron (see vercel.json). Reminds supervisors
// of PENDING entries that either (a) haven't been reminded in the last
// 4 days, or (b) have never been reminded and are more than 2 days old
// — and only once the deadline is within 14 days, so students aren't
// nagging supervisors in week one of a four-month window.
//
// Authenticated via CRON_SECRET rather than requireAdminSession, since
// this is called by Vercel's scheduler, not a logged-in browser session.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const semester = await prisma.semester.findFirst({ where: { isActive: true } });
  if (!semester) return NextResponse.json({ reminded: 0, reason: "no active semester" });

  const daysToDeadline = (semester.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysToDeadline > 14 || daysToDeadline < 0) {
    return NextResponse.json({ reminded: 0, reason: "outside the reminder window" });
  }

  const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  const candidates = await prisma.volunteerEntry.findMany({
    where: {
      semesterId: semester.id,
      status: "PENDING",
      OR: [{ reminderSentAt: null, createdAt: { lt: twoDaysAgo } }, { reminderSentAt: { lt: fourDaysAgo } }],
    },
    include: { student: { select: { name: true, email: true } } },
  });

  let reminded = 0;
  for (const entry of candidates) {
    try {
      await sendReminderEmail({
        supervisorEmail: entry.supervisorEmail,
        supervisorName: entry.supervisorName,
        studentName: entry.student.name ?? entry.student.email,
        approvalToken: entry.approvalToken,
      });
      await prisma.volunteerEntry.update({ where: { id: entry.id }, data: { reminderSentAt: new Date() } });
      reminded++;
    } catch (err) {
      console.error(`Cron reminder failed for entry ${entry.id}:`, err);
    }
  }

  return NextResponse.json({ reminded, candidates: candidates.length });
}
