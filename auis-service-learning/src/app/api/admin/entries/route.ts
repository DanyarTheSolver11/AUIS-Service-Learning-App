import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { generateApprovalToken } from "@/lib/tokens";

export async function GET(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const rawStatus = searchParams.get("status");
  const status = ["PENDING", "APPROVED", "REJECTED"].includes(rawStatus ?? "") ? rawStatus : null;
  const semesterId = searchParams.get("semesterId");

  const semester = semesterId
    ? await prisma.semester.findUnique({ where: { id: semesterId } })
    : await prisma.semester.findFirst({ where: { isActive: true } });

  if (!semester) return NextResponse.json({ entries: [], semester: null });

  const entries = await prisma.volunteerEntry.findMany({
    where: {
      semesterId: semester.id,
      ...(status ? { status: status as any } : {}),
    },
    include: { student: { select: { name: true, email: true, studentId: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ entries, semester });
}

// Student Services logs hours directly on a student's behalf — e.g. the
// student came into the office in person, or a supervisor confirmed hours
// verbally/by email outside the app. These are auto-approved since an
// admin is vouching for them directly; no supervisor link is sent.
const manualEntrySchema = z.object({
  studentEmail: z.string().email(),
  date: z.string(),
  department: z.string().min(1).max(200),
  action: z.string().min(1).max(1000),
  hours: z.number().positive().max(24),
});

export async function POST(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = manualEntrySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;

  const semester = await prisma.semester.findFirst({ where: { isActive: true } });
  if (!semester) return NextResponse.json({ error: "No active semester configured." }, { status: 400 });

  const email = data.studentEmail.toLowerCase();
  if (!email.endsWith("@auis.edu.krd")) {
    return NextResponse.json({ error: "Student email must be an @auis.edu.krd address." }, { status: 400 });
  }

  const student = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, role: "STUDENT" },
  });

  const adminEmail = (session.user as any).email ?? "Student Services";
  const entry = await prisma.volunteerEntry.create({
    data: {
      studentId: student.id,
      semesterId: semester.id,
      date: new Date(data.date),
      department: data.department,
      action: data.action,
      hours: data.hours,
      supervisorName: `Logged by Student Services (${adminEmail})`,
      supervisorEmail: adminEmail,
      status: "APPROVED",
      approvedAt: new Date(),
      approvalToken: generateApprovalToken(),
    },
  });

  return NextResponse.json({ entry }, { status: 201 });
}
