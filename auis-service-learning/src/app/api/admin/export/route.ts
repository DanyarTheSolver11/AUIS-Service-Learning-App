import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAwardTier, getAwardLabel } from "@/lib/awards";

export async function GET() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const semester = await prisma.semester.findFirst({ where: { isActive: true } });
  if (!semester) return NextResponse.json({ error: "No active semester" }, { status: 400 });

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    include: { entries: { where: { semesterId: semester.id, status: "APPROVED" } } },
  });

  const rows = students
    .map((s) => {
      const totalHours = s.entries.reduce((sum, e) => sum + e.hours, 0);
      const tier = getAwardTier(totalHours);
      return { s, totalHours, tier };
    })
    .filter((r) => r.tier !== "NONE")
    .sort((a, b) => b.totalHours - a.totalHours);

  const header = ["Student Name", "Student ID", "Email", "Approved Hours", "Award Tier"];
  const csvLines = [
    header.join(","),
    ...rows.map((r) =>
      [
        `"${(r.s.name ?? "").replace(/"/g, '""')}"`,
        r.s.studentId ?? "",
        r.s.email,
        r.totalHours.toFixed(1),
        getAwardLabel(r.tier),
      ].join(",")
    ),
  ];

  return new NextResponse(csvLines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="awards-${semester.name.replace(/\s+/g, "-")}.csv"`,
    },
  });
}
