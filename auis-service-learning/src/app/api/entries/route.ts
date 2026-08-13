import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateApprovalToken } from "@/lib/tokens";
import { sendApprovalRequestEmail } from "@/lib/email";

const entrySchema = z.object({
  date: z.string(), // ISO date
  department: z.string().min(1).max(200),
  action: z.string().min(1).max(1000),
  hours: z.number().positive().max(24),
  supervisorName: z.string().min(1).max(200),
  supervisorEmail: z.string().email(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const entries = await prisma.volunteerEntry.findMany({
    where: { studentId: userId },
    include: { semester: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = entrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const semester = await prisma.semester.findFirst({ where: { isActive: true } });
  if (!semester) {
    return NextResponse.json({ error: "No active semester configured. Contact Student Services." }, { status: 400 });
  }
  if (new Date() > semester.deadline) {
    return NextResponse.json({ error: `Submissions closed on ${semester.deadline.toDateString()}.` }, { status: 403 });
  }
  const entryDate = new Date(data.date);
  if (entryDate < semester.startDate || entryDate > semester.endDate) {
    return NextResponse.json(
      { error: `Date must be between ${semester.startDate.toDateString()} and ${semester.endDate.toDateString()} for ${semester.name}.` },
      { status: 400 }
    );
  }

  const userId = (session.user as any).id as string;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const approvalToken = generateApprovalToken();

  const entry = await prisma.volunteerEntry.create({
    data: {
      studentId: userId,
      semesterId: semester.id,
      date: entryDate,
      department: data.department,
      action: data.action,
      hours: data.hours,
      supervisorName: data.supervisorName,
      supervisorEmail: data.supervisorEmail,
      approvalToken,
    },
  });

  try {
    await sendApprovalRequestEmail({
      supervisorEmail: data.supervisorEmail,
      supervisorName: data.supervisorName,
      studentName: user?.name ?? user?.email ?? "A student",
      department: data.department,
      action: data.action,
      hours: data.hours,
      date: entryDate.toDateString(),
      approvalToken,
    });
  } catch (err) {
    // Entry is saved either way; the student/admin can trigger a resend later.
    console.error("Failed to send approval email:", err);
    Sentry.captureException(err);
  }

  return NextResponse.json({ entry }, { status: 201 });
}
