import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

// Unlike /api/admin/export (ceremony list: approved hours + tier only),
// this dumps every individual entry regardless of status - useful for
// audits, dispute resolution, or archiving before a semester rolls over.
export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const semester = await prisma.semester.findFirst({ where: { isActive: true } });
  if (!semester) return NextResponse.json({ error: "No active semester" }, { status: 400 });

  const entries = await prisma.volunteerEntry.findMany({
    where: { semesterId: semester.id },
    include: { student: { select: { name: true, email: true, studentId: true } } },
    orderBy: [{ status: "asc" }, { date: "desc" }],
  });

  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = [
    "Student Name",
    "Student ID",
    "Student Email",
    "Date",
    "Department",
    "Activity",
    "Hours",
    "Status",
    "Supervisor Name",
    "Supervisor Email",
    "Rejection Reason",
    "Submitted",
  ];
  const csvLines = [
    header.join(","),
    ...entries.map((e) =>
      [
        esc(e.student.name ?? ""),
        esc(e.student.studentId ?? ""),
        esc(e.student.email),
        esc(e.date.toDateString()),
        esc(e.department),
        esc(e.action),
        e.hours.toFixed(1),
        e.status,
        esc(e.supervisorName),
        esc(e.supervisorEmail),
        esc(e.rejectedReason ?? ""),
        esc(e.createdAt.toDateString()),
      ].join(",")
    ),
  ];

  return new NextResponse(csvLines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="all-entries-${semester.name.replace(/\s+/g, "-")}.csv"`,
    },
  });
}
