import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { sendBroadcastEmail } from "@/lib/email";

const schema = z.object({
  audience: z.enum(["ALL_STUDENTS", "NO_ENTRIES", "HAS_PENDING", "BELOW_10_HOURS"]),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
});

export async function POST(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { audience, subject, message } = parsed.data;

  const semester = await prisma.semester.findFirst({ where: { isActive: true } });
  if (!semester) return NextResponse.json({ error: "No active semester configured." }, { status: 400 });

  let recipients: string[] = [];

  if (audience === "ALL_STUDENTS") {
    const users = await prisma.user.findMany({ where: { role: "STUDENT" }, select: { email: true } });
    recipients = users.map((u) => u.email);
  } else if (audience === "NO_ENTRIES") {
    // Every student, minus anyone with at least one entry this semester —
    // i.e. people who haven't started at all yet.
    const [all, withEntries] = await Promise.all([
      prisma.user.findMany({ where: { role: "STUDENT" }, select: { id: true, email: true } }),
      prisma.volunteerEntry.findMany({
        where: { semesterId: semester.id },
        select: { studentId: true },
        distinct: ["studentId"],
      }),
    ]);
    const engagedIds = new Set(withEntries.map((e) => e.studentId));
    recipients = all.filter((u) => !engagedIds.has(u.id)).map((u) => u.email);
  } else if (audience === "HAS_PENDING") {
    const pending = await prisma.volunteerEntry.findMany({
      where: { semesterId: semester.id, status: "PENDING" },
      select: { student: { select: { email: true } } },
      distinct: ["studentId"],
    });
    recipients = pending.map((p) => p.student.email);
  } else {
    // BELOW_10_HOURS: everyone with at least one entry, but under the
    // minimum award threshold on approved hours so far.
    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      include: { entries: { where: { semesterId: semester.id, status: "APPROVED" } } },
    });
    recipients = students
      .filter((s) => {
        const total = s.entries.reduce((sum, e) => sum + e.hours, 0);
        return total > 0 && total < 10;
      })
      .map((s) => s.email);
  }

  if (recipients.length === 0) {
    return NextResponse.json({ error: "No students match that audience — nothing sent." }, { status: 400 });
  }

  try {
    const result = await sendBroadcastEmail({ recipients, subject, message });
    return NextResponse.json(result);
  } catch (err) {
    console.error("Broadcast failed:", err);
    Sentry.captureException(err);
    return NextResponse.json({ error: "Gmail API rejected the broadcast." }, { status: 502 });
  }
}
